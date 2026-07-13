import Startup from '../models/Startup.js';
import Employee from '../models/Employee.js';
import Transaction from '../models/Transaction.js';
import countryEconomy from '../config/countryEconomy.js';

// We can define the list of commodity metrics to evaluate for rankings
const COMMODITY_METRICS = [
  { id: 'Top Wheat Producers', name: 'Wheat', type: 'Production', label: 'Wheat Producer' },
  { id: 'Top Rice Producers', name: 'Rice', type: 'Production', label: 'Rice Producer' },
  { id: 'Top Cotton Producers', name: 'Cotton', type: 'Production', label: 'Cotton Producer' },
  { id: 'Top Coal Producers', name: 'Coal', type: 'Production', label: 'Coal Producer' },
  { id: 'Top Bread Producers', name: 'Bread', type: 'Production', label: 'Bread Producer' },
  { id: 'Top Steel Beam Producers', name: 'Steel Beam', type: 'Production', label: 'Steel Beam Producer' },
  { id: 'Top Phone Manufacturers', name: 'Phone', type: 'Production', label: 'Phone Manufacturer' },
  { id: 'Top Car Manufacturers', name: 'Car', type: 'Production', label: 'Car Manufacturer' },
  { id: 'Top Wheat Sellers', name: 'Wheat', type: 'Sale', label: 'Wheat Seller' },
  { id: 'Top Wheat Buyers', name: 'Wheat', type: 'Purchase', label: 'Wheat Buyer' },
  { id: 'Top Coal Sellers', name: 'Coal', type: 'Sale', label: 'Coal Seller' },
  { id: 'Top Coal Buyers', name: 'Coal', type: 'Purchase', label: 'Coal Buyer' }
];

export const getCompanyPublicProfile = async (startupId) => {
  // 1. Load the startup
  let startup;
  if (global.useMockDb) {
    startup = (global.mockStartups || []).find(s => String(s._id) === String(startupId));
  } else {
    startup = await Startup.findById(startupId);
  }
  
  if (!startup) {
    throw new Error('Company not found');
  }

  const sId = String(startup._id);

  // 2. Fetch all startups to calculate ranks
  let allStartups = [];
  if (global.useMockDb) {
    allStartups = [...(global.mockStartups || [])];
  } else {
    allStartups = await Startup.find({});
  }

  // Calculate total employees for all startups
  const employeeCounts = {};
  if (global.useMockDb) {
    (global.mockEmployees || []).forEach(emp => {
      const id = String(emp.startupId);
      employeeCounts[id] = (employeeCounts[id] || 0) + (emp.quantity || 0);
    });
  } else {
    const emps = await Employee.aggregate([
      { $group: { _id: '$startupId', total: { $sum: '$quantity' } } }
    ]);
    emps.forEach(item => {
      employeeCounts[String(item._id)] = item.total;
    });
  }

  // Helper to convert country prices
  const getCountryPrices = (country) => {
    const cData = countryEconomy.countries[country] || countryEconomy.countries['India'];
    return Object.keys(cData.commodities).reduce((acc, key) => {
      acc[key] = cData.commodities[key].price;
      return acc;
    }, {});
  };

  // Process all startups with valuations
  const startupsWithValuation = allStartups.map(s => {
    const sIdStr = String(s._id);
    const totalEmployees = employeeCounts[sIdStr] || 0;
    
    // Inventory value calculation
    const inventory = s.inventory || [];
    const localPrices = getCountryPrices(s.country);
    const inventoryValue = inventory.reduce((sum, item) => {
      const price = localPrices[item.productId] || 0;
      return sum + ((item.quantity || 0) * price);
    }, 0);

    const startingCapital = s.startingCapital || 50000;
    const currentBalance = s.currentBalance || 0;
    const valuation = Math.round(startingCapital + currentBalance + (totalEmployees * 5000) + (inventoryValue * 1.5));

    return {
      _id: s._id,
      startupName: s.startupName,
      country: s.country,
      industry: s.industry,
      businessType: s.businessType,
      companyValuation: valuation,
      employees: totalEmployees
    };
  });

  // Calculate Global Rank
  const globalSorted = [...startupsWithValuation].sort((a, b) => b.companyValuation - a.companyValuation);
  const globalRank = globalSorted.findIndex(s => String(s._id) === sId) + 1;

  // Calculate Country Rank
  const countrySorted = [...startupsWithValuation]
    .filter(s => s.country.toLowerCase() === startup.country.toLowerCase())
    .sort((a, b) => b.companyValuation - a.companyValuation);
  const countryRank = countrySorted.findIndex(s => String(s._id) === sId) + 1;

  // Calculate Industry Rank
  const industrySorted = [...startupsWithValuation]
    .filter(s => s.industry.toLowerCase() === startup.industry.toLowerCase() || s.businessType.toLowerCase() === startup.businessType.toLowerCase())
    .sort((a, b) => b.companyValuation - a.companyValuation);
  const industryRank = industrySorted.findIndex(s => String(s._id) === sId) + 1;

  // Calculate Percentile
  const totalRankedCount = globalSorted.length;
  const position = globalRank;
  const percentile = totalRankedCount > 0 
    ? Math.max(1, Math.min(100, Math.round((position / totalRankedCount) * 100))) 
    : 100;

  // 3. Fetch Transaction Statistics for Public Info
  let totalProduced = 0;
  let totalSales = 0;
  let totalPurchases = 0;
  let totalExports = 0;
  let totalImports = 0;

  // We build a cache of startup countries to compute exports/imports
  const countryMap = {};
  startupsWithValuation.forEach(s => {
    countryMap[s.startupName] = s.country;
  });

  let txs = [];
  if (global.useMockDb) {
    txs = (global.mockTransactions || []).filter(t => String(t.startup) === sId);
  } else {
    txs = await Transaction.find({ startup: startup._id });
  }

  txs.forEach(t => {
    if (t.transactionType === 'Production') {
      totalProduced += (t.quantity || 0);
    } else if (t.transactionType === 'Sale') {
      totalSales += (t.quantity || 0);
      // Check export
      if (t.buyerStartupName && countryMap[t.buyerStartupName] && countryMap[t.buyerStartupName] !== startup.country) {
        totalExports += (t.quantity || 0);
      }
    } else if (t.transactionType === 'Purchase') {
      totalPurchases += (t.quantity || 0);
      // Check import
      if (t.sellerStartupName && countryMap[t.sellerStartupName] && countryMap[t.sellerStartupName] !== startup.country) {
        totalImports += (t.quantity || 0);
      }
    }
  });

  // 4. Commodity/Production stats specific to businessType
  const SECTOR_PRODUCTS = {
    'farming': ['wheat', 'rice', 'cotton', 'grains', 'vegetables', 'seeds'],
    'dairy': ['milk', 'eggs', 'fodder'],
    'mining': ['coal', 'iron_ore', 'bauxite_ore', 'limestone', 'gypsum', 'crude_oil', 'minerals', 'sand', 'clay'],
    'food processing': ['bread', 'biscuits', 'cheese'],
    'garment factory': ['shirts', 'jeans', 'jackets', 'fabric'],
    'construction factory': ['steel', 'aluminium', 'cement', 'bricks', 'steel_beams', 'glass', 'silicon', 'plastics', 'chemicals'],
    'electronics manufacturing': ['processor', 'display', 'electronic_components', 'battery', 'on_board_computer', 'phones', 'laptops', 'tvs'],
    'automobile manufacturing': ['combustion_engine', 'cars']
  };

  const businessKey = (startup.businessType || startup.industry || '').toLowerCase();
  const relevantProducts = SECTOR_PRODUCTS[businessKey] || [];
  
  const productionStats = {};
  relevantProducts.forEach(prod => {
    productionStats[prod] = 0;
  });

  txs.forEach(t => {
    if (t.transactionType === 'Production' && t.productName) {
      const prodKey = t.productName.toLowerCase().replace(' ', '_');
      if (relevantProducts.includes(prodKey)) {
        productionStats[prodKey] += (t.quantity || 0);
      } else {
        // Match direct strings as fallback
        const matchingKey = relevantProducts.find(p => p.replace('_', ' ') === t.productName.toLowerCase());
        if (matchingKey) {
          productionStats[matchingKey] += (t.quantity || 0);
        }
      }
    }
  });

  const PRODUCT_DISPLAY_NAMES = {
    wheat: 'Wheat', rice: 'Rice', cotton: 'Cotton', grains: 'Grains', vegetables: 'Vegetables', seeds: 'Seeds',
    milk: 'Milk', eggs: 'Eggs', fodder: 'Fodder',
    coal: 'Coal', iron_ore: 'Iron Ore', bauxite_ore: 'Bauxite Ore', limestone: 'Limestone', gypsum: 'Gypsum', crude_oil: 'Crude Oil', minerals: 'Minerals', sand: 'Sand', clay: 'Clay',
    bread: 'Bread', biscuits: 'Biscuits', cheese: 'Cheese',
    shirts: 'Shirts', jeans: 'Jeans', jackets: 'Jackets', fabric: 'Fabric',
    steel: 'Steel', aluminium: 'Aluminium', cement: 'Cement', bricks: 'Bricks', steel_beams: 'Steel Beams', glass: 'Glass', silicon: 'Silicon', plastics: 'Plastics', chemicals: 'Chemicals',
    processor: 'Processors', display: 'Displays', electronic_components: 'Electronic Components', battery: 'Batteries', on_board_computer: 'On-Board Computers', phones: 'Phones', laptops: 'Laptops', tvs: 'TVs',
    combustion_engine: 'Combustion Engines', cars: 'Cars'
  };

  const productionStatistics = Object.keys(productionStats).map(key => ({
    productId: key,
    productName: PRODUCT_DISPLAY_NAMES[key] || key,
    quantity: productionStats[key]
  }));

  // 5. Commodity rankings
  const commodityRankings = [];
  
  for (const metric of COMMODITY_METRICS) {
    let metricTxs = [];
    if (global.useMockDb) {
      metricTxs = (global.mockTransactions || []).filter(tx => 
        tx.transactionType === metric.type && 
        String(tx.productName).toLowerCase() === metric.name.toLowerCase()
      );
    } else {
      metricTxs = await Transaction.find({
        transactionType: metric.type,
        productName: { $regex: new RegExp("^" + metric.name + "$", "i") }
      });
    }

    const statsMap = {};
    metricTxs.forEach(tx => {
      const s = String(tx.startup);
      statsMap[s] = (statsMap[s] || 0) + (tx.quantity || 0);
    });

    if (statsMap[sId] > 0) {
      const sortedByMetric = Object.keys(statsMap)
        .map(key => ({ startupId: key, value: statsMap[key] }))
        .sort((a, b) => b.value - a.value);

      const metricRank = sortedByMetric.findIndex(item => item.startupId === sId) + 1;
      commodityRankings.push({
        rank: metricRank,
        label: `Global ${metric.label}`
      });
    }
  }

  // 6. Achievements Placeholder Architecture
  const achievements = [];
  if (globalRank <= 100) {
    achievements.push({
      title: `Top 100 Global`,
      description: `Ranked in the top 100 companies globally.`,
      icon: 'fa-globe'
    });
  }
  if (countryRank <= 10) {
    achievements.push({
      title: `Top 10 ${startup.country}`,
      description: `Ranked in the top 10 companies in ${startup.country}.`,
      icon: 'fa-trophy'
    });
  }
  if (startup.level >= 5) {
    achievements.push({
      title: `Factory Level 5`,
      description: `Reached level 5 enterprise status.`,
      icon: 'fa-circle-up'
    });
  }

  const currentValuation = startupsWithValuation.find(s => String(s._id) === sId)?.companyValuation || 0;

  return {
    _id: startup._id,
    startupName: startup.startupName,
    logo: startup.logo || '',
    banner: startup.banner || '',
    description: startup.description || 'No company description provided.',
    country: startup.country,
    businessType: startup.businessType,
    industry: startup.industry,
    createdAt: startup.createdAt,
    level: startup.level || 1,
    employees: employeeCounts[sId] || 0,
    
    // Rankings
    globalRank,
    countryRank,
    industryRank,
    percentile,
    commodityRankings,
    
    // Statistics
    companyValuation: currentValuation,
    totalProduced,
    totalSales,
    totalPurchases,
    totalExports,
    totalImports,
    contractsCompleted: 0, // Currently 0
    productionStatistics,

    // Achievements
    achievements
  };
};
