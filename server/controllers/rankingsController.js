import { getRankingsData } from '../services/rankingsService.js';
import Startup from '../models/Startup.js';
import Employee from '../models/Employee.js';
import countryEconomy from '../config/countryEconomy.js';

export const getRankings = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const mode = req.query.mode || 'global';
    const country = req.query.country || '';
    const industry = req.query.industry || '';
    const commodity = req.query.commodity || '';
    const sortBy = req.query.sortBy || 'companyValuation';
    const sortOrder = req.query.sortOrder || 'desc';

    const data = await getRankingsData({
      mode,
      search,
      country,
      industry,
      commodity,
      sortBy,
      sortOrder,
      page,
      limit
    });

    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getMyRankingSummary = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    let startup;
    if (global.useMockDb) {
      startup = global.mockStartups.find(s => String(s.owner) === String(userId));
    } else {
      startup = await Startup.findOne({ owner: userId });
    }

    if (!startup) {
      return res.status(200).json({ success: true, summary: null });
    }

    const startupIdStr = String(startup._id);

    // Compute ranks dynamically on the server
    let allStartups = [];
    if (global.useMockDb) {
      allStartups = [...(global.mockStartups || [])];
    } else {
      allStartups = await Startup.find({});
    }

    // Load employee counts
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

    const getCountryPrices = (countryName) => {
      const cData = countryEconomy.countries[countryName] || countryEconomy.countries['India'];
      return Object.keys(cData.commodities).reduce((acc, key) => {
        acc[key] = cData.commodities[key].price;
        return acc;
      }, {});
    };

    // Calculate valuations for all
    const valuations = allStartups.map(s => {
      const sId = String(s._id);
      const totalEmployees = employeeCounts[sId] || 0;
      const inventory = s.inventory || [];
      const localPrices = getCountryPrices(s.country);
      const inventoryValue = inventory.reduce((sum, item) => {
        const price = localPrices[item.productId] || 0;
        return sum + ((item.quantity || 0) * price);
      }, 0);

      const startingCapital = s.startingCapital || 50000;
      const currentBalance = s.currentBalance || 0;
      const valuation = startingCapital + currentBalance + (totalEmployees * 5000) + (inventoryValue * 1.5);

      return {
        id: sId,
        country: s.country,
        industry: s.industry,
        businessType: s.businessType,
        valuation
      };
    });

    // 1. Global Rank
    const sortedGlobal = [...valuations].sort((a, b) => b.valuation - a.valuation);
    const globalRank = sortedGlobal.findIndex(item => item.id === startupIdStr) + 1;

    // 2. Country Rank
    const sortedCountry = [...valuations]
      .filter(item => item.country.toLowerCase() === startup.country.toLowerCase())
      .sort((a, b) => b.valuation - a.valuation);
    const countryRank = sortedCountry.findIndex(item => item.id === startupIdStr) + 1;

    // 3. Industry Rank
    const sortedIndustry = [...valuations]
      .filter(item => item.industry.toLowerCase() === startup.industry.toLowerCase() || item.businessType.toLowerCase() === startup.businessType.toLowerCase())
      .sort((a, b) => b.valuation - a.valuation);
    const industryRank = sortedIndustry.findIndex(item => item.id === startupIdStr) + 1;

    // Percentile calculation
    const totalStartups = valuations.length;
    const percentile = totalStartups > 1 
      ? parseFloat(((1 - (globalRank - 1) / totalStartups) * 100).toFixed(1))
      : 100.0;

    const myValuation = valuations.find(item => item.id === startupIdStr)?.valuation || 50000;

    res.status(200).json({
      success: true,
      summary: {
        companyName: startup.startupName,
        logo: startup.logo || '',
        country: startup.country,
        businessType: startup.businessType,
        globalRank,
        countryRank,
        industryRank,
        companyValuation: myValuation,
        percentile
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
