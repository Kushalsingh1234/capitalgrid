import Startup from '../models/Startup.js';
import Employee from '../models/Employee.js';
import countryEconomy from '../config/countryEconomy.js';

export const getCompanyValuation = async (startupId) => {
  try {
    let startup;
    if (global.useMockDb) {
      startup = global.mockStartups.find(s => String(s._id) === String(startupId));
    } else {
      startup = await Startup.findById(startupId);
    }
    if (!startup) return 50000;

    // 1. Get employees count
    let totalEmployees = 0;
    if (global.useMockDb) {
      const mockEmps = (global.mockEmployees || []).filter(e => String(e.startupId) === String(startupId));
      totalEmployees = mockEmps.reduce((sum, e) => sum + (e.quantity || 0), 0);
    } else {
      const emps = await Employee.find({ startupId });
      totalEmployees = emps.reduce((sum, e) => sum + (e.quantity || 0), 0);
    }

    // 2. Get inventory asset value
    const country = startup.country || 'India';
    const countryData = countryEconomy.countries[country] || countryEconomy.countries['India'];
    const commodities = countryData.commodities || {};

    const inventory = startup.inventory || [];
    const inventoryAssetValuation = inventory.reduce((sum, item) => {
      const price = commodities[item.productId]?.price || 0;
      return sum + ((item.quantity || 0) * price);
    }, 0);

    const currentCash = startup.currentBalance || 0;
    const startingCapital = startup.startingCapital || 50000;

    const valuation = Math.round(startingCapital + currentCash + (totalEmployees * 5000) + (inventoryAssetValuation * 1.5));
    return valuation;
  } catch (err) {
    console.error(`[Valuation Error] ${err.message}`);
    return 50000;
  }
};
