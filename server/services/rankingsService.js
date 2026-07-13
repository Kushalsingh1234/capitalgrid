import Startup from '../models/Startup.js';
import Employee from '../models/Employee.js';
import Transaction from '../models/Transaction.js';
import countryEconomy from '../config/countryEconomy.js';

// Get local prices mapping helper
const getCountryPrices = (country) => {
  const cData = countryEconomy.countries[country] || countryEconomy.countries['India'];
  return Object.keys(cData.commodities).reduce((acc, key) => {
    acc[key] = cData.commodities[key].price;
    return acc;
  }, {});
};

export const getRankingsData = async ({ mode, search, country, industry, commodity, sortBy, sortOrder, page, limit }) => {
  // 1. Fetch all startups
  let startups = [];
  if (global.useMockDb) {
    startups = [...(global.mockStartups || [])];
  } else {
    startups = await Startup.find({});
  }

  // 2. Fetch employee counts grouped by startup
  const employeeCounts = {};
  if (global.useMockDb) {
    (global.mockEmployees || []).forEach(emp => {
      const sId = String(emp.startupId);
      employeeCounts[sId] = (employeeCounts[sId] || 0) + (emp.quantity || 0);
    });
  } else {
    const emps = await Employee.aggregate([
      { $group: { _id: '$startupId', total: { $sum: '$quantity' } } }
    ]);
    emps.forEach(item => {
      employeeCounts[String(item._id)] = item.total;
    });
  }

  // 3. Compute valuation for each startup
  let processedStartups = startups.map(s => {
    const sId = String(s._id);
    const totalEmployees = employeeCounts[sId] || 0;
    
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
      logo: s.logo || '',
      country: s.country,
      industry: s.industry,
      businessType: s.businessType,
      employees: totalEmployees,
      foundedDate: s.createdAt,
      companyValuation: valuation
    };
  });

  // 4. Apply search filter
  if (search) {
    const q = search.toLowerCase();
    processedStartups = processedStartups.filter(s => s.startupName.toLowerCase().includes(q));
  }

  // 5. Apply mode filters
  if (mode === 'country' && country) {
    processedStartups = processedStartups.filter(s => s.country.toLowerCase() === country.toLowerCase());
  } else if (mode === 'industry' && industry) {
    processedStartups = processedStartups.filter(s => 
      s.industry.toLowerCase() === industry.toLowerCase() || 
      s.businessType.toLowerCase() === industry.toLowerCase()
    );
  } else if (mode === 'commodity' && commodity) {
    let txType = 'Production';
    let prodName = 'Wheat';

    if (commodity.includes('Producer') || commodity.includes('Manufacturer')) {
      txType = 'Production';
    } else if (commodity.includes('Seller')) {
      txType = 'Sale';
    } else if (commodity.includes('Buyer')) {
      txType = 'Purchase';
    }

    if (commodity.toLowerCase().includes('wheat')) prodName = 'Wheat';
    else if (commodity.toLowerCase().includes('rice')) prodName = 'Rice';
    else if (commodity.toLowerCase().includes('cotton')) prodName = 'Cotton';
    else if (commodity.toLowerCase().includes('coal')) prodName = 'Coal';
    else if (commodity.toLowerCase().includes('bread')) prodName = 'Bread';
    else if (commodity.toLowerCase().includes('steel beam')) prodName = 'Steel Beam';
    else if (commodity.toLowerCase().includes('phone')) prodName = 'Phone';
    else if (commodity.toLowerCase().includes('car')) prodName = 'Car';

    const stats = {};
    if (global.useMockDb) {
      (global.mockTransactions || []).forEach(tx => {
        if (tx.transactionType === txType && String(tx.productName).toLowerCase() === prodName.toLowerCase()) {
          const sId = String(tx.startup);
          stats[sId] = (stats[sId] || 0) + (tx.quantity || 0);
        }
      });
    } else {
      const matchedTxs = await Transaction.aggregate([
        { 
          $match: { 
            transactionType: txType, 
            productName: { $regex: new RegExp("^" + prodName + "$", "i") } 
          } 
        },
        { $group: { _id: '$startup', total: { $sum: '$quantity' } } }
      ]);
      matchedTxs.forEach(item => {
        stats[String(item._id)] = item.total;
      });
    }

    const hasStats = Object.values(stats).some(val => val > 0);
    if (!hasStats) {
      return {
        success: true,
        rankings: [],
        totalCount: 0,
        totalPages: 0,
        page,
        limit
      };
    }

    processedStartups = processedStartups
      .filter(s => stats[String(s._id)] > 0)
      .map(s => ({
        ...s,
        commodityStat: stats[String(s._id)]
      }));

    processedStartups.sort((a, b) => b.commodityStat - a.commodityStat);
  }

  // 6. Sort results
  if (mode !== 'commodity') {
    const sField = sortBy || 'companyValuation';
    const sOrder = sortOrder || 'desc';

    processedStartups.sort((a, b) => {
      let valA = a[sField];
      let valB = b[sField];

      if (typeof valA === 'string') {
        valA = valA.toLowerCase();
        valB = valB.toLowerCase();
        if (valA < valB) return sOrder === 'asc' ? -1 : 1;
        if (valA > valB) return sOrder === 'asc' ? 1 : -1;
        return 0;
      }

      if (valA instanceof Date) {
        valA = valA.getTime();
        valB = valB.getTime();
      }

      return sOrder === 'asc' ? (valA - valB) : (valB - valA);
    });
  }

  // 7. Paginate results
  const totalCount = processedStartups.length;
  const totalPages = Math.ceil(totalCount / limit);
  const startIndex = (page - 1) * limit;
  const paginatedStartups = processedStartups.slice(startIndex, startIndex + limit);

  const rankings = paginatedStartups.map((s, index) => ({
    ...s,
    rank: startIndex + index + 1
  }));

  return {
    success: true,
    rankings,
    totalCount,
    totalPages,
    page,
    limit
  };
};
