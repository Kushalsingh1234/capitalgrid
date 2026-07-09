import Startup from '../models/Startup.js';
import Transaction from '../models/Transaction.js';
import countryEconomy from '../config/countryEconomy.js';

// Base demand catalog for retail stores
const BASE_DEMAND = {
  'Clothing Store': {
    'shirts': 180,
    'jeans': 160,
    'jackets': 90
  },
  'Electronics Store': {
    'tvs': 65,
    'laptops': 90,
    'phones': 170
  },
  'Restaurant': {
    'bread': 280,
    'biscuits': 200,
    'cheese': 140
  },
  'Car Showroom': {
    'cars': 25
  }
};

// Base duration catalog in seconds
const BASE_DURATION = {
  'Clothing Store': 3600,      // 60 mins
  'Electronics Store': 7200,   // 120 mins
  'Restaurant': 1800,          // 30 mins
  'Car Showroom': 14400         // 240 mins
};

// Map of businessType to supported productIds
const RETAIL_PRODUCTS_MAP = {
  'Clothing Store': ['shirts', 'jeans', 'jackets'],
  'Electronics Store': ['tvs', 'laptops', 'phones'],
  'Restaurant': ['bread', 'biscuits', 'cheese'],
  'Car Showroom': ['cars']
};

export const getAveragePurchaseCost = async (startupId, productId, basePrice) => {
  try {
    let startup;
    if (global.useMockDb) {
      startup = global.mockStartups.find(s => String(s._id) === String(startupId) || String(s.owner) === String(startupId));
    } else {
      const Startup = (await import('../models/Startup.js')).default;
      startup = await Startup.findById(startupId) || await Startup.findOne({ owner: startupId });
    }

    if (!startup) return 0;

    const inventoryItem = (startup.inventory || []).find(i => i.productId === productId);
    if (!inventoryItem || !inventoryItem.quantity || inventoryItem.quantity <= 0) {
      return 0;
    }

    const totalCost = inventoryItem.totalCost !== undefined ? inventoryItem.totalCost : (inventoryItem.quantity * basePrice * 0.75);
    return Math.round(totalCost / inventoryItem.quantity);
  } catch (err) {
    console.error(`[Average purchase cost lookup error]`, err);
    return 0;
  }
};

/**
 * Calculates dynamic projections for the retail store.
 */
export const calculateDemandDetails = async (startup, selectedQuantities = {}) => {
  const businessType = startup.businessType;
  const country = startup.country || 'India';
  const countryData = countryEconomy.countries[country] || countryEconomy.countries['India'];
  const localPrices = countryData.commodities;

  const eligibleIds = RETAIL_PRODUCTS_MAP[businessType] || [];
  const demands = BASE_DEMAND[businessType] || {};
  const baseCycleDuration = BASE_DURATION[businessType] || 3600;
  const retailInventory = startup.retailInventory || [];

  let totalExpectedCustomers = 0;
  let totalRevenue = 0;
  let totalCost = 0;
  let totalDuration = 0;
  
  const expectedSales = {};
  const lockedQuantities = {};
  const productsDetails = [];

  for (const pId of eligibleIds) {
    const baseDemand = demands[pId] || 0;
    const basePrice = localPrices[pId]?.price || 100;
    
    // Find selling price in registry
    const pricingReg = retailInventory.find(i => i.productId === pId) || {
      sellingPrice: basePrice
    };

    // Calculate dynamic average purchase cost
    const avgCost = await getAveragePurchaseCost(startup._id, pId, basePrice);

    // V1 demand modifier: 1 / (sellingPrice / (basePrice * 1.08)) ^ 2
    const marketAveragePrice = basePrice * 1.08;
    const priceRatio = marketAveragePrice > 0 ? (pricingReg.sellingPrice / marketAveragePrice) : 1;
    let priceModifier = 1.0;
    if (priceRatio > 0) {
      priceModifier = 1 / Math.pow(priceRatio, 2);
    }
    priceModifier = Math.max(0.001, Math.min(3.0, priceModifier || 1.0));
    
    // Expected Customers = Base Demand * Price Modifier
    const expectedCustomers = Math.ceil(baseDemand * priceModifier);
    
    // Read manual quantity selected (limit by warehouse inventory)
    const warehouseItem = (startup.inventory || []).find(i => i.productId === pId);
    const availableQty = warehouseItem ? warehouseItem.quantity : 0;
    
    const qtySelected = Math.min(availableQty, selectedQuantities[pId] || 0);

    // Expected Units Sold = min(Quantity Selected, Expected Customers)
    const expectedUnitsSold = Math.min(qtySelected, expectedCustomers);

    // Sales Duration = Base Duration * (Quantity Selected / Base Demand) * Price Ratio
    let duration = 0;
    if (qtySelected > 0) {
      duration = Math.round(baseCycleDuration * (qtySelected / baseDemand) * priceRatio);
      // Clamp individual duration to a minimum of 10s to prevent visual freeze
      duration = Math.max(10, Math.min(28800, duration));
    }

    expectedSales[pId] = expectedUnitsSold;
    lockedQuantities[pId] = qtySelected;
    totalExpectedCustomers += expectedCustomers;
    totalRevenue += expectedUnitsSold * pricingReg.sellingPrice;
    totalCost += expectedUnitsSold * avgCost;

    totalDuration += duration;

    productsDetails.push({
      productId: pId,
      productName: countryData.commodities[pId]?.name || pId.charAt(0).toUpperCase() + pId.slice(1),
      availableStock: availableQty,
      avgPurchaseCost: avgCost,
      sellingPrice: pricingReg.sellingPrice,
      basePrice,
      expectedCustomers,
      expectedUnitsSold,
      duration,
      expectedRevenue: expectedUnitsSold * pricingReg.sellingPrice,
      expectedProfit: (expectedUnitsSold * pricingReg.sellingPrice) - (expectedUnitsSold * avgCost)
    });
  }

  const expectedProfit = totalRevenue - totalCost;

  return {
    expectedSales,
    lockedQuantities,
    expectedRevenue: totalRevenue,
    expectedProfit,
    expectedCustomers: totalExpectedCustomers,
    duration: totalDuration,
    productsDetails
  };
};

/**
 * Auto-resolves a completed retail cycle.
 */
export const checkAndResolveRetailCycle = (startup) => {
  if (!startup.retailState || startup.retailState.activeCycle?.status !== 'Running') {
    return false;
  }

  const now = new Date();
  const endTime = new Date(startup.retailState.activeCycle.endTime);
  if (now < endTime) {
    return false;
  }

  const cycle = startup.retailState.activeCycle;
  const expectedSales = cycle.expectedSales || {};
  const lockedQuantities = cycle.lockedQuantities || {};
  const productsSold = {};

  let totalRevenue = 0;
  let totalCost = 0;

  // Deduct sold inventory directly from player warehouse stock
  startup.inventory = startup.inventory.map(item => {
    const soldQty = expectedSales[item.productId] || 0;
    const reservedQty = lockedQuantities[item.productId] || 0;
    
    if (soldQty > 0) {
      const basePrice = countryEconomy.countries[startup.country || 'India']?.commodities[item.productId]?.price || 100;
      const initialQty = item.quantity || 0;
      const initialTotalCost = item.totalCost !== undefined ? item.totalCost : (initialQty * basePrice * 0.75);
      const avgCostPerUnit = initialQty > 0 ? (initialTotalCost / initialQty) : 0;

      item.quantity -= soldQty;
      if (item.totalCost !== undefined) {
        item.totalCost = Math.max(0, Math.round(item.quantity * avgCostPerUnit));
      }

      productsSold[item.productId] = soldQty;

      // Find price registry
      const pricingReg = startup.retailInventory.find(i => i.productId === item.productId);
      const sellingPrice = pricingReg ? pricingReg.sellingPrice : (item.pricePerUnit || 100);
      
      // Compute cost for accounting
      const avgCost = pricingReg ? pricingReg.avgPurchaseCost : Math.round(basePrice * 0.75);

      totalRevenue += soldQty * sellingPrice;
      totalCost += soldQty * avgCost;
    }
    return item;
  }).filter(item => item.quantity > 0);

  const grossProfit = totalRevenue - totalCost;

  // Deposit revenue to player balance
  startup.currentBalance += totalRevenue;

  // Update financials
  if (!startup.financials) {
    startup.financials = {
      revenue: 0,
      operatingExpenses: 0,
      payrollExpense: 0,
      productionExpense: 0,
      marketplaceExpense: 0,
      taxExpense: 0,
      netProfit: 0,
      retainedEarnings: 0
    };
  }
  startup.financials.revenue += totalRevenue;
  startup.financials.operatingExpenses += totalCost;
  startup.financials.netProfit += grossProfit;

  // Save history
  if (!startup.retailState.history) {
    startup.retailState.history = [];
  }
  startup.retailState.history.unshift({
    completionTime: now,
    customers: cycle.expectedCustomers,
    revenue: totalRevenue,
    profit: grossProfit,
    productsSold
  });

  if (startup.retailState.history.length > 20) {
    startup.retailState.history = startup.retailState.history.slice(0, 20);
  }

  // Reset active cycle
  startup.retailState.activeCycle = {
    status: 'Idle',
    startTime: null,
    endTime: null,
    duration: 0,
    expectedRevenue: 0,
    expectedProfit: 0,
    expectedCustomers: 0,
    expectedSales: {},
    lockedQuantities: {}
  };

  return true;
};

/**
 * Returns locked quantities for active retail cycle (to prevent marketplace trading).
 */
export const getLockedInventory = (startup) => {
  if (!startup.retailState || startup.retailState.activeCycle?.status !== 'Running') {
    return {};
  }
  return startup.retailState.activeCycle.lockedQuantities || {};
};

/**
 * GET /api/retail/status
 */
export const getRetailStatus = async (req, res) => {
  const userId = req.user.id || req.user._id;
  try {
    let startup;
    if (global.useMockDb) {
      startup = global.mockStartups.find(s => String(s.owner) === String(userId));
    } else {
      startup = await Startup.findOne({ owner: userId });
    }

    if (!startup) {
      return res.status(404).json({ success: false, message: 'Startup not found' });
    }

    // Resolve offline completed cycles
    const resolved = checkAndResolveRetailCycle(startup);
    if (resolved && !global.useMockDb) {
      await startup.save();
    }

    // Dynamically compute average costs and update registry
    const country = startup.country || 'India';
    const countryData = countryEconomy.countries[country] || countryEconomy.countries['India'];
    const localPrices = countryData.commodities;

    if (startup.retailInventory) {
      for (const item of startup.retailInventory) {
        const basePrice = localPrices[item.productId]?.price || 100;
        item.avgPurchaseCost = await getAveragePurchaseCost(startup._id, item.productId, basePrice);
      }
    }

    res.status(200).json({
      success: true,
      retailInventory: startup.retailInventory || [],
      retailState: startup.retailState || {},
      inventory: startup.inventory || []
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * POST /api/retail/pricing/update
 */
export const updatePricing = async (req, res) => {
  const { productId, sellingPrice } = req.body;
  const userId = req.user.id || req.user._id;

  try {
    if (!productId || sellingPrice === undefined || sellingPrice <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid product or selling price.' });
    }

    let startup;
    if (global.useMockDb) {
      startup = global.mockStartups.find(s => String(s.owner) === String(userId));
    } else {
      startup = await Startup.findOne({ owner: userId });
    }

    if (!startup) {
      return res.status(404).json({ success: false, message: 'Startup not found' });
    }

    if (startup.retailState?.activeCycle?.status === 'Running') {
      return res.status(400).json({ success: false, message: 'Cannot adjust prices while a sales cycle is running.' });
    }

    const retailItem = startup.retailInventory.find(i => i.productId === productId);
    if (!retailItem) {
      return res.status(404).json({ success: false, message: 'Product not found in retail pricing registry.' });
    }

    retailItem.sellingPrice = parseFloat(sellingPrice);

    const country = startup.country || 'India';
    const countryData = countryEconomy.countries[country] || countryEconomy.countries['India'];
    const localPrices = countryData.commodities;

    if (startup.retailInventory) {
      for (const item of startup.retailInventory) {
        const basePrice = localPrices[item.productId]?.price || 100;
        item.avgPurchaseCost = await getAveragePurchaseCost(startup._id, item.productId, basePrice);
      }
    }

    if (!global.useMockDb) {
      startup.markModified('retailInventory');
      await startup.save();
    }

    res.status(200).json({
      success: true,
      message: `Price updated successfully.`,
      retailInventory: startup.retailInventory
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * POST /api/retail/cycle/start
 */
export const startSalesCycle = async (req, res) => {
  const { selectedProducts } = req.body; // map of { productId: quantitySelected }
  const userId = req.user.id || req.user._id;

  try {
    if (!selectedProducts || typeof selectedProducts !== 'object') {
      return res.status(400).json({ success: false, message: 'selectedProducts is required' });
    }

    let startup;
    if (global.useMockDb) {
      startup = global.mockStartups.find(s => String(s.owner) === String(userId));
    } else {
      startup = await Startup.findOne({ owner: userId });
    }

    if (!startup) {
      return res.status(404).json({ success: false, message: 'Startup not found' });
    }

    if (startup.retailState?.activeCycle?.status === 'Running') {
      return res.status(400).json({ success: false, message: 'Sales cycle is already running.' });
    }

    // Verify quantities selected do not exceed warehouse stock
    for (const [pId, qty] of Object.entries(selectedProducts)) {
      const warehouseItem = startup.inventory.find(i => i.productId === pId);
      const availableQty = warehouseItem ? warehouseItem.quantity : 0;
      if (qty > availableQty) {
        return res.status(400).json({
          success: false,
          message: `Cannot put ${qty} units of ${pId} on sale. Only ${availableQty} units available in warehouse.`
        });
      }
    }

    // Calculate dynamic projections based on manual selected quantities
    const projections = await calculateDemandDetails(startup, selectedProducts);

    if (projections.duration <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot start cycle: No product quantities selected or estimated sales duration is zero.'
      });
    }

    const startTime = new Date();
    const endTime = new Date(startTime.getTime() + projections.duration * 1000);

    startup.retailState.activeCycle = {
      status: 'Running',
      startTime,
      endTime,
      duration: projections.duration,
      expectedRevenue: projections.expectedRevenue,
      expectedProfit: projections.expectedProfit,
      expectedCustomers: projections.expectedCustomers,
      expectedSales: projections.expectedSales,
      lockedQuantities: projections.lockedQuantities
    };

    if (!global.useMockDb) {
      startup.markModified('retailState');
      await startup.save();
    }

    res.status(200).json({
      success: true,
      message: 'Retail sales cycle initiated successfully.',
      startup
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * POST /api/retail/cycle/stop
 */
export const stopSalesCycle = async (req, res) => {
  const userId = req.user.id || req.user._id;

  try {
    let startup;
    if (global.useMockDb) {
      startup = global.mockStartups.find(s => String(s.owner) === String(userId));
    } else {
      startup = await Startup.findOne({ owner: userId });
    }

    if (!startup) {
      return res.status(404).json({ success: false, message: 'Startup not found' });
    }

    if (!startup.retailState || startup.retailState.activeCycle?.status !== 'Running') {
      return res.status(400).json({ success: false, message: 'No sales cycle is currently running.' });
    }

    startup.retailState.activeCycle = {
      status: 'Idle',
      startTime: null,
      endTime: null,
      duration: 0,
      expectedRevenue: 0,
      expectedProfit: 0,
      expectedCustomers: 0,
      expectedSales: {},
      lockedQuantities: {}
    };

    if (!global.useMockDb) {
      startup.markModified('retailState');
      await startup.save();
    }

    res.status(200).json({
      success: true,
      message: 'Retail sales cycle aborted.',
      startup
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * POST /api/retail/cycle/complete
 */
export const completeSalesCycle = async (req, res) => {
  const userId = req.user.id || req.user._id;

  try {
    let startup;
    if (global.useMockDb) {
      startup = global.mockStartups.find(s => String(s.owner) === String(userId));
    } else {
      startup = await Startup.findOne({ owner: userId });
    }

    if (!startup) {
      return res.status(404).json({ success: false, message: 'Startup not found' });
    }

    const resolved = checkAndResolveRetailCycle(startup);
    if (!resolved) {
      return res.status(400).json({ success: false, message: 'Cycle is not ready to complete.' });
    }

    if (!global.useMockDb) {
      startup.markModified('retailState');
      startup.markModified('inventory');
      startup.markModified('financials');
      await startup.save();
    }

    res.status(200).json({
      success: true,
      message: 'Sales cycle resolved successfully.',
      startup
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
