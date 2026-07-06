import Marketplace from '../models/Marketplace.js';
import Startup from '../models/Startup.js';
import Transaction from '../models/Transaction.js';
import ncrCatalog from '../config/ncrCatalog.js';
import { getProductPrice } from '../config/countryEconomy.js';
import countryEconomy from '../config/countryEconomy.js';
import tradeService from '../services/tradeService.js';

/**
 * @desc    Create a new marketplace listing from seller inventory
 * @route   POST /api/marketplace/list
 * @access  Private
 */
export const createListing = async (req, res) => {
  const { productId, quantity, pricePerUnit } = req.body;
  const userId = req.user.id || req.user._id;

  try {
    // 1. Basic validation
    if (!productId || !quantity || !pricePerUnit) {
      return res.status(400).json({ success: false, message: 'All listing fields (product, quantity, price per unit) are required' });
    }

    const qty = parseInt(quantity, 10);
    const unitPrice = parseFloat(pricePerUnit);

    if (isNaN(qty) || qty <= 0) {
      return res.status(400).json({ success: false, message: 'Quantity must be a positive integer greater than 0' });
    }

    if (isNaN(unitPrice) || unitPrice <= 0) {
      return res.status(400).json({ success: false, message: 'Price per unit must be a positive number greater than 0' });
    }

    // 2. Fetch seller startup
    let startup;
    if (global.useMockDb) {
      startup = global.mockStartups.find(s => String(s.owner) === String(userId));
    } else {
      startup = await Startup.findOne({ owner: userId });
    }

    if (!startup) {
      return res.status(404).json({ success: false, message: 'No startup found for this player. Please register a startup first.' });
    }

    // 3. Verify product is in inventory and has sufficient quantity
    const inventory = startup.inventory || [];
    const inventoryItemIndex = inventory.findIndex(item => item.productId === productId);

    if (inventoryItemIndex === -1) {
      return res.status(400).json({ success: false, message: 'Product not found in your inventory' });
    }

    const inventoryItem = inventory[inventoryItemIndex];
    if (inventoryItem.quantity < qty) {
      return res.status(400).json({ 
        success: false, 
        message: `Insufficient inventory. You only have ${inventoryItem.quantity} unit(s) of ${inventoryItem.productName} available.` 
      });
    }

    // 4. Deduct quantity from inventory immediately (reserve goods)
    inventoryItem.quantity -= qty;
    
    // Remove product slot if quantity reaches 0
    let updatedInventory = [...inventory];
    if (inventoryItem.quantity === 0) {
      updatedInventory.splice(inventoryItemIndex, 1);
    }
    startup.inventory = updatedInventory;

    // Persist startup inventory change
    if (global.useMockDb) {
      // In-memory update is already mutated
    } else {
      startup.markModified('inventory');
      await startup.save();
    }

    // 5. Create listing
    const totalPrice = qty * unitPrice;
    const sellerCurrency = (countryEconomy.countries[startup.country] || countryEconomy.countries['United States']).currency;
    let newListing;

    if (global.useMockDb) {
      newListing = {
        _id: 'mock-listing-' + Date.now(),
        seller: startup._id,
        sellerStartupId: startup._id.toString(),
        sellerStartupName: startup.startupName,
        sellerCountry: startup.country,
        sellerCurrency,
        productId,
        commodity: productId,
        productName: inventoryItem.productName,
        quantity: qty,
        pricePerUnit: unitPrice,
        unitPrice,
        totalPrice,
        status: 'Active',
        buyer: null,
        buyerStartupName: null,
        listedAt: new Date(),
        createdAt: new Date()
      };
      if (!global.mockMarketplace) {
        global.mockMarketplace = [];
      }
      global.mockMarketplace.push(newListing);
    } else {
      newListing = await Marketplace.create({
        seller: startup._id,
        sellerStartupId: startup._id.toString(),
        sellerStartupName: startup.startupName,
        sellerCountry: startup.country,
        sellerCurrency,
        productId,
        commodity: productId,
        productName: inventoryItem.productName,
        quantity: qty,
        pricePerUnit: unitPrice,
        unitPrice,
        totalPrice,
        status: 'Active',
        listedAt: new Date()
      });
    }

    res.status(201).json({
      success: true,
      message: `Successfully listed ${qty}x ${inventoryItem.productName} for sale.`,
      listing: newListing,
      inventory: startup.inventory
    });

  } catch (error) {
    console.error(`[Create Listing Error] ${error.message}`);
    res.status(500).json({ success: false, message: 'Server error creating marketplace listing' });
  }
};

/**
 * Query helper to retrieve domestic active listings
 */
export const getDomesticListings = async (country) => {
  if (global.useMockDb) {
    return (global.mockMarketplace || []).filter(l => l.status === 'Active' && l.sellerCountry === country);
  }
  return await Marketplace.find({ status: 'Active', sellerCountry: country }).sort({ createdAt: -1 });
};

/**
 * Query helper to retrieve international active listings
 */
export const getInternationalListings = async (country) => {
  if (global.useMockDb) {
    return (global.mockMarketplace || []).filter(l => l.status === 'Active' && l.sellerCountry !== country);
  }
  return await Marketplace.find({ status: 'Active', sellerCountry: { $ne: country } }).sort({ createdAt: -1 });
};

/**
 * @desc    Get domestic active listings
 * @route   GET /api/marketplace/domestic
 * @access  Private
 */
export const getDomesticListingsController = async (req, res) => {
  const userId = req.user.id || req.user._id;
  try {
    let startup;
    if (global.useMockDb) {
      startup = global.mockStartups.find(s => String(s.owner) === String(userId));
    } else {
      startup = await Startup.findOne({ owner: userId });
    }
    const country = startup ? startup.country : 'United States';
    const rawListings = await getDomesticListings(country);

    const listings = rawListings.map(l => {
      const listingObj = l.toObject ? l.toObject() : l;
      const tradeInfo = tradeService.calculateTradePrice(listingObj, country);
      return {
        ...listingObj,
        buyerBasePrice: tradeInfo.buyerBasePrice,
        buyerPrice: tradeInfo.buyerPrice,
        shippingCost: tradeInfo.shippingCost,
        tariff: tradeInfo.tariffCost,
        finalPrice: tradeInfo.finalPrice,
        shippingPercentage: tradeInfo.shippingPercentage,
        tariffPercentage: tradeInfo.tariffPercentage,
        distance: tradeInfo.distance,
        tradeStatus: tradeInfo.tradeStatus,
        tradeRouteId: tradeInfo.tradeRouteId,
        buyerCurrency: tradeInfo.buyerCurrency
      };
    });

    res.status(200).json({ success: true, listings });
  } catch (error) {
    console.error(`[Domestic Listings Error] ${error.message}`);
    res.status(500).json({ success: false, message: 'Server error retrieving domestic listings' });
  }
};

/**
 * @desc    Get international active listings
 * @route   GET /api/marketplace/international
 * @access  Private
 */
export const getInternationalListingsController = async (req, res) => {
  const userId = req.user.id || req.user._id;
  try {
    let startup;
    if (global.useMockDb) {
      startup = global.mockStartups.find(s => String(s.owner) === String(userId));
    } else {
      startup = await Startup.findOne({ owner: userId });
    }
    const country = startup ? startup.country : 'United States';
    const rawListings = await getInternationalListings(country);

    const listings = rawListings.map(l => {
      const listingObj = l.toObject ? l.toObject() : l;
      const tradeInfo = tradeService.calculateTradePrice(listingObj, country);
      return {
        ...listingObj,
        buyerBasePrice: tradeInfo.buyerBasePrice,
        buyerPrice: tradeInfo.buyerPrice,
        shippingCost: tradeInfo.shippingCost,
        tariff: tradeInfo.tariffCost,
        finalPrice: tradeInfo.finalPrice,
        shippingPercentage: tradeInfo.shippingPercentage,
        tariffPercentage: tradeInfo.tariffPercentage,
        distance: tradeInfo.distance,
        tradeStatus: tradeInfo.tradeStatus,
        tradeRouteId: tradeInfo.tradeRouteId,
        buyerCurrency: tradeInfo.buyerCurrency
      };
    });

    res.status(200).json({ success: true, listings });
  } catch (error) {
    console.error(`[International Listings Error] ${error.message}`);
    res.status(500).json({ success: false, message: 'Server error retrieving international listings' });
  }
};

/**
 * @desc    Get all active marketplace listings
 * @route   GET /api/marketplace
 * @access  Private
 */
export const getAllListings = async (req, res) => {
  const userId = req.user.id || req.user._id;

  try {
    let startup;
    if (global.useMockDb) {
      startup = global.mockStartups.find(s => String(s.owner) === String(userId));
    } else {
      startup = await Startup.findOne({ owner: userId });
    }
    const country = startup ? startup.country : 'United States';

    const rawDomestic = await getDomesticListings(country);
    const rawInternational = await getInternationalListings(country);

    let rawListings;
    if (global.useMockDb) {
      rawListings = (global.mockMarketplace || []).filter(l => l.status === 'Active');
    } else {
      rawListings = await Marketplace.find({ status: 'Active' }).sort({ createdAt: -1 });
    }

    const mapListing = (l) => {
      const listingObj = l.toObject ? l.toObject() : l;
      const tradeInfo = tradeService.calculateTradePrice(listingObj, country);
      return {
        ...listingObj,
        buyerBasePrice: tradeInfo.buyerBasePrice,
        buyerPrice: tradeInfo.buyerPrice,
        shippingCost: tradeInfo.shippingCost,
        tariff: tradeInfo.tariffCost,
        finalPrice: tradeInfo.finalPrice,
        shippingPercentage: tradeInfo.shippingPercentage,
        tariffPercentage: tradeInfo.tariffPercentage,
        distance: tradeInfo.distance,
        tradeStatus: tradeInfo.tradeStatus,
        tradeRouteId: tradeInfo.tradeRouteId,
        buyerCurrency: tradeInfo.buyerCurrency
      };
    };

    res.status(200).json({
      success: true,
      listings: rawListings.map(mapListing),
      domestic: rawDomestic.map(mapListing),
      international: rawInternational.map(mapListing)
    });
  } catch (error) {
    console.error(`[Fetch Listings Error] ${error.message}`);
    res.status(500).json({ success: false, message: 'Server error retrieving marketplace listings' });
  }
};

/**
 * @desc    Purchase a marketplace listing
 * @route   POST /api/marketplace/buy/:id
 * @access  Private
 */
export const buyListing = async (req, res) => {
  const listingId = req.params.id;
  const userId = req.user.id || req.user._id;

  try {
    // 1. Find listing
    let listing;
    if (global.useMockDb) {
      listing = global.mockMarketplace.find(l => String(l._id) === String(listingId));
    } else {
      listing = await Marketplace.findById(listingId);
    }

    if (!listing) {
      return res.status(404).json({ success: false, message: 'Marketplace listing not found' });
    }

    if (listing.status !== 'Active') {
      return res.status(400).json({ success: false, message: 'This listing is no longer active' });
    }

    // 2. Fetch buyer startup
    let buyerStartup;
    if (global.useMockDb) {
      buyerStartup = global.mockStartups.find(s => String(s.owner) === String(userId));
    } else {
      buyerStartup = await Startup.findOne({ owner: userId });
    }

    if (!buyerStartup) {
      return res.status(404).json({ success: false, message: 'No startup found for buyer player. Please register a startup first.' });
    }

    // 3. Prevent players from buying their own listings
    if (String(buyerStartup._id) === String(listing.seller)) {
      return res.status(400).json({ success: false, message: 'You cannot purchase your own marketplace listing' });
    }

    // 4. Verify buyer balance using Trade Service
    let { quantity } = req.body;
    const buyQty = parseInt(quantity, 10) || listing.quantity;

    if (buyQty <= 0 || buyQty > listing.quantity) {
      return res.status(400).json({ success: false, message: 'Invalid purchase quantity requested.' });
    }

    const tradePriceInfo = tradeService.calculateTradePrice(listing, buyerStartup.country);
    const totalCost = tradePriceInfo.buyerPrice * buyQty;

    if (buyerStartup.currentBalance < totalCost) {
      return res.status(400).json({ 
        success: false, 
        message: `Insufficient funds. Cost is ${totalCost} but you only have ${buyerStartup.currentBalance}.` 
      });
    }

    // 5. Fetch seller startup
    let sellerStartup;
    if (global.useMockDb) {
      sellerStartup = global.mockStartups.find(s => String(s._id) === String(listing.seller));
    } else {
      sellerStartup = await Startup.findById(listing.seller);
    }

    if (!sellerStartup) {
      return res.status(404).json({ success: false, message: 'Seller startup record not found' });
    }

    const sellerRevenue = listing.pricePerUnit * buyQty;

    // 6. Execute transfers
    // Decrease buyer balance
    buyerStartup.currentBalance -= totalCost;
    
    // Increase seller balance (seller gets their original local price list value)
    sellerStartup.currentBalance += sellerRevenue;

    // Increase buyer inventory
    const buyerInventory = buyerStartup.inventory || [];
    const buyerItemIndex = buyerInventory.findIndex(item => item.productId === listing.productId);

    if (buyerItemIndex !== -1) {
      buyerInventory[buyerItemIndex].quantity += buyQty;
    } else {
      buyerInventory.push({
        productId: listing.productId,
        productName: listing.productName,
        quantity: buyQty
      });
    }
    buyerStartup.inventory = buyerInventory;

    // Update listing status and buyer info
    const isFullPurchase = buyQty === listing.quantity;
    if (isFullPurchase) {
      listing.status = 'Sold';
      listing.quantity = 0;
      listing.totalPrice = 0;
      listing.buyer = buyerStartup._id;
      listing.buyerStartupName = buyerStartup.startupName;
    } else {
      listing.quantity -= buyQty;
      listing.totalPrice = listing.quantity * listing.pricePerUnit;
    }

    // 7. Persist changes
    if (global.useMockDb) {
      // In-memory changes already updated in place
    } else {
      // Save buyer startup
      buyerStartup.markModified('inventory');
      await buyerStartup.save();

      // Save seller startup
      await sellerStartup.save();

      // Save listing
      await listing.save();
    }

    // 8. Create transaction history records (one for buyer, one for seller)
    if (global.useMockDb) {
      const sellerTx = {
        _id: 'mock-tx-s-' + Date.now(),
        startup: listing.seller,
        transactionType: 'Sale',
        buyerStartupName: buyerStartup.startupName,
        sellerStartupName: sellerStartup.startupName,
        productName: listing.productName,
        quantity: buyQty,
        pricePerUnit: listing.pricePerUnit,
        totalAmount: sellerRevenue,
        createdAt: new Date()
      };
      
      const buyerTx = {
        _id: 'mock-tx-b-' + (Date.now() + 1),
        startup: buyerStartup._id,
        transactionType: 'Purchase',
        buyerStartupName: buyerStartup.startupName,
        sellerStartupName: sellerStartup.startupName,
        productName: listing.productName,
        quantity: buyQty,
        pricePerUnit: tradePriceInfo.buyerPrice,
        totalAmount: totalCost,
        createdAt: new Date()
      };
      
      global.mockTransactions.push(sellerTx, buyerTx);
    } else {
      await Transaction.create([
        {
          startup: listing.seller,
          transactionType: 'Sale',
          buyerStartupName: buyerStartup.startupName,
          sellerStartupName: sellerStartup.startupName,
          productName: listing.productName,
          quantity: buyQty,
          pricePerUnit: listing.pricePerUnit,
          totalAmount: sellerRevenue
        },
        {
          startup: buyerStartup._id,
          transactionType: 'Purchase',
          buyerStartupName: buyerStartup.startupName,
          sellerStartupName: sellerStartup.startupName,
          productName: listing.productName,
          quantity: buyQty,
          pricePerUnit: tradePriceInfo.buyerPrice,
          totalAmount: totalCost
        }
      ]);
    }

    res.status(200).json({
      success: true,
      message: `Successfully purchased ${buyQty}x ${listing.productName} for ${totalCost}.`,
      currentBalance: buyerStartup.currentBalance,
      inventory: buyerStartup.inventory
    });

  } catch (error) {
    console.error(`[Buy Listing Error] ${error.message}`);
    res.status(500).json({ success: false, message: 'Server error processing purchase transaction' });
  }
};

/**
 * @desc    Get National Commodity Reserve (NCR) catalog
 * @route   GET /api/marketplace/ncr/catalog
 * @access  Private
 */
export const getNcrCatalog = async (req, res) => {
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

    const country = startup.country || 'United States';

    const catalog = ncrCatalog.map(item => {
      const localPrice = getProductPrice(country, item.productId);
      return {
        ...item,
        ncrBuyPrice: +(localPrice * 0.95).toFixed(2),
        ncrSellPrice: +(localPrice * 1.05).toFixed(2)
      };
    });

    res.status(200).json({ success: true, catalog });
  } catch (error) {
    console.error(`[NCR Catalog Error] ${error.message}`);
    res.status(500).json({ success: false, message: 'Server error retrieving NCR catalog' });
  }
};

/**
 * @desc    Purchase a product from NCR
 * @route   POST /api/marketplace/ncr/buy
 * @access  Private
 */
export const buyFromNcr = async (req, res) => {
  const { productId, quantity } = req.body;
  const userId = req.user.id || req.user._id;

  try {
    if (!productId || !quantity || quantity <= 0) {
      return res.status(400).json({ success: false, message: 'Product and a valid quantity are required' });
    }

    const qty = parseInt(quantity, 10);
    const ncrItem = ncrCatalog.find(i => i.productId === productId);
    if (!ncrItem) {
      return res.status(404).json({ success: false, message: 'Product not found in NCR catalog' });
    }

    let startup;
    if (global.useMockDb) {
      startup = global.mockStartups.find(s => String(s.owner) === String(userId));
    } else {
      startup = await Startup.findOne({ owner: userId });
    }

    if (!startup) {
      return res.status(404).json({ success: false, message: 'Startup not found for player' });
    }

    const country = startup.country || 'United States';
    const localPrice = getProductPrice(country, productId);
    const ncrSellPrice = +(localPrice * 1.05).toFixed(2);
    const totalCost = ncrSellPrice * qty;

    if (startup.currentBalance < totalCost) {
      return res.status(400).json({ success: false, message: 'Insufficient corporate liquidity reserves' });
    }

    // Perform transaction
    startup.currentBalance -= totalCost;

    const inventory = startup.inventory || [];
    const itemIndex = inventory.findIndex(i => i.productId === productId);
    if (itemIndex !== -1) {
      inventory[itemIndex].quantity += qty;
    } else {
      inventory.push({
        productId,
        productName: ncrItem.productName,
        quantity: qty
      });
    }
    startup.inventory = inventory;

    // Save
    if (global.useMockDb) {
      // updated in place
    } else {
      startup.markModified('inventory');
      await startup.save();
    }

    // Create Transaction
    let newTx;
    if (global.useMockDb) {
      newTx = {
        _id: 'mock-tx-ncr-' + Date.now(),
        startup: startup._id,
        transactionType: 'Purchase',
        buyerStartupName: startup.startupName,
        sellerStartupName: 'National Commodity Reserve',
        productName: ncrItem.productName,
        quantity: qty,
        pricePerUnit: ncrSellPrice,
        totalAmount: totalCost,
        createdAt: new Date()
      };
      global.mockTransactions.push(newTx);
    } else {
      newTx = await Transaction.create({
        startup: startup._id,
        transactionType: 'Purchase',
        buyerStartupName: startup.startupName,
        sellerStartupName: 'National Commodity Reserve',
        productName: ncrItem.productName,
        quantity: qty,
        pricePerUnit: ncrSellPrice,
        totalAmount: totalCost
      });
    }

    res.status(200).json({
      success: true,
      message: `Successfully purchased ${qty}x ${ncrItem.productName} from NCR`,
      currentBalance: startup.currentBalance,
      inventory: startup.inventory
    });

  } catch (error) {
    console.error(`[NCR Buy Error] ${error.message}`);
    res.status(500).json({ success: false, message: 'Server error buying from NCR' });
  }
};

/**
 * @desc    Sell a product to NCR
 * @route   POST /api/marketplace/ncr/sell
 * @access  Private
 */
export const sellToNcr = async (req, res) => {
  const { productId, quantity } = req.body;
  const userId = req.user.id || req.user._id;

  try {
    if (!productId || !quantity || quantity <= 0) {
      return res.status(400).json({ success: false, message: 'Product and a valid quantity are required' });
    }

    const qty = parseInt(quantity, 10);
    const ncrItem = ncrCatalog.find(i => i.productId === productId);
    if (!ncrItem) {
      return res.status(404).json({ success: false, message: 'Product not found in NCR catalog' });
    }

    let startup;
    if (global.useMockDb) {
      startup = global.mockStartups.find(s => String(s.owner) === String(userId));
    } else {
      startup = await Startup.findOne({ owner: userId });
    }

    if (!startup) {
      return res.status(404).json({ success: false, message: 'Startup not found for player' });
    }

    const inventory = startup.inventory || [];
    const itemIndex = inventory.findIndex(i => i.productId === productId);

    if (itemIndex === -1 || inventory[itemIndex].quantity < qty) {
      return res.status(400).json({ success: false, message: 'Insufficient stock in warehouse' });
    }

    const country = startup.country || 'United States';
    const localPrice = getProductPrice(country, productId);
    const ncrBuyPrice = +(localPrice * 0.95).toFixed(2);
    const totalRevenue = ncrBuyPrice * qty;

    // Perform transaction
    inventory[itemIndex].quantity -= qty;
    if (inventory[itemIndex].quantity === 0) {
      inventory.splice(itemIndex, 1);
    }
    startup.inventory = inventory;
    startup.currentBalance += totalRevenue;

    // Save
    if (global.useMockDb) {
      // updated in place
    } else {
      startup.markModified('inventory');
      await startup.save();
    }

    // Create Transaction
    let newTx;
    if (global.useMockDb) {
      newTx = {
        _id: 'mock-tx-ncr-' + Date.now(),
        startup: startup._id,
        transactionType: 'Sale',
        buyerStartupName: 'National Commodity Reserve',
        sellerStartupName: startup.startupName,
        productName: ncrItem.productName,
        quantity: qty,
        pricePerUnit: ncrBuyPrice,
        totalAmount: totalRevenue,
        createdAt: new Date()
      };
      global.mockTransactions.push(newTx);
    } else {
      newTx = await Transaction.create({
        startup: startup._id,
        transactionType: 'Sale',
        buyerStartupName: 'National Commodity Reserve',
        sellerStartupName: startup.startupName,
        productName: ncrItem.productName,
        quantity: qty,
        pricePerUnit: ncrBuyPrice,
        totalAmount: totalRevenue
      });
    }

    res.status(200).json({
      success: true,
      message: `Successfully sold ${qty}x ${ncrItem.productName} to NCR`,
      currentBalance: startup.currentBalance,
      inventory: startup.inventory
    });

  } catch (error) {
    console.error(`[NCR Sell Error] ${error.message}`);
    res.status(500).json({ success: false, message: 'Server error selling to NCR' });
  }
};
