import Startup from '../models/Startup.js';
import User from '../models/User.js';
import ProductionTask from '../models/ProductionTask.js';
import { processCompletedTasks } from './productionController.js';
import countryEconomy from '../config/countryEconomy.js';
import { checkAndResolveRetailCycle } from '../controllers/retailController.js';
import { getCompanyValuation } from '../services/companyValuationService.js';

// Capital mappings based on country choice
const STARTING_CAPITALS = {
  'India': 1000000,
  'United States': 120000,
  'United Kingdom': 80000,
  'Germany': 100000,
  'Japan': 12000000,
  'Brazil': 500000,
  'Australia': 150000
};

// 3-Letter Country Codes for ID generation
const COUNTRY_CODES = {
  'India': 'IND',
  'United States': 'USA',
  'United Kingdom': 'GBR',
  'Germany': 'DEU',
  'Japan': 'JPN',
  'Brazil': 'BRA',
  'Australia': 'AUS'
};

/**
 * @desc    Create a new player Startup
 * @route   POST /api/startup/create
 * @access  Private
 */
export const createStartup = async (req, res) => {
  const { startupName, country, industry, businessType, logo } = req.body;
  const userId = req.user.id || req.user._id;

  try {
    // 1. Basic validation
    if (!startupName || !country || !industry || !businessType) {
      return res.status(400).json({ success: false, message: 'All startup registration fields are required' });
    }

    if (startupName.length < 3 || startupName.length > 30) {
      return res.status(400).json({ success: false, message: 'Startup name must be between 3 and 30 characters long' });
    }

    // 2. Ownership check: Max 1 startup per owner
    let existingStartup;
    if (global.useMockDb) {
      existingStartup = global.mockStartups.find(s => String(s.owner) === String(userId));
    } else {
      existingStartup = await Startup.findOne({ owner: userId });
    }

    if (existingStartup) {
      return res.status(400).json({ 
        success: false, 
        message: 'You already own a startup. Multiple startups are not allowed in Phase 1.' 
      });
    }

    // 3. Unique name check (case-insensitive)
    let nameExists;
    if (global.useMockDb) {
      nameExists = global.mockStartups.find(
        s => s.startupName.toLowerCase() === startupName.trim().toLowerCase()
      );
    } else {
      nameExists = await Startup.findOne({ 
        startupName: { $regex: new RegExp(`^${startupName.trim()}$`, 'i') } 
      });
    }

    if (nameExists) {
      return res.status(400).json({ 
        success: false, 
        message: 'Startup name is already registered by another entrepreneur. Please choose a unique name.' 
      });
    }

    // 4. Map starting capital and currency
    const startingCapital = STARTING_CAPITALS[country] || 100000;

    // 5. Generate Unique Startup ID (CG-IND-000123)
    const countryCode = COUNTRY_CODES[country] || 'CGD';
    let startupId;
    let idExists = true;

    while (idExists) {
      const randomDigits = String(Math.floor(Math.random() * 1000000)).padStart(6, '0');
      startupId = `CG-${countryCode}-${randomDigits}`;
      
      if (global.useMockDb) {
        idExists = global.mockStartups.some(s => s.startupId === startupId);
      } else {
        const checkId = await Startup.findOne({ startupId });
        idExists = !!checkId;
      }
    }

    // 6. Save Startup document (DB or Mock)
    let newStartup;

    if (global.useMockDb) {
      newStartup = {
        _id: 'mock-startup-' + Date.now(),
        startupName: startupName.trim(),
        startupId,
        country,
        industry,
        businessType,
        logo: logo || '',
        startingCapital,
        currentBalance: startingCapital,
        inventory: [],
        status: 'Active',
        employeesLaidOff: 0,
        employeesRecruited: 0,
        employeeMorale: 100,
        recentPayroll: null,
        financials: {
          revenue: 0,
          operatingExpenses: 0,
          payrollExpense: 0,
          productionExpense: 0,
          marketplaceExpense: 0,
          taxExpense: 0,
          netProfit: 0,
          retainedEarnings: 0
        },
        owner: userId,
        createdAt: new Date()
      };
      global.mockStartups.push(newStartup);

      // Update mock user record
      const mockUser = global.mockUsers.find(u => String(u._id) === String(userId) || String(u.id) === String(userId));
      if (mockUser) {
        mockUser.startupExists = true;
        mockUser.startupId = newStartup._id;
        mockUser.country = country; // Sync country
      }
    } else {
      newStartup = await Startup.create({
        startupName: startupName.trim(),
        startupId,
        country,
        industry,
        businessType,
        logo: logo || '',
        startingCapital,
        currentBalance: startingCapital,
        inventory: [],
        status: 'Active',
        employeesLaidOff: 0,
        employeesRecruited: 0,
        owner: userId
      });

      // Update User profile
      await User.findByIdAndUpdate(userId, {
        startupExists: true,
        startupId: newStartup._id,
        country: country // Sync country
      });
    }

    const countryData = countryEconomy.countries[country] || countryEconomy.countries['United States'];
    const localPrices = Object.keys(countryData.commodities).reduce((acc, key) => {
      acc[key] = countryData.commodities[key].price;
      return acc;
    }, {});

    res.status(201).json({
      success: true,
      message: 'Startup registered successfully',
      startup: {
        ...newStartup.toObject ? newStartup.toObject() : newStartup,
        localPrices
      }
    });

  } catch (error) {
    console.error(`[Startup Creation Error] ${error.message}`);
    res.status(500).json({ success: false, message: 'Server error during startup registration' });
  }
};

/**
 * @desc    Get active player Startup details
 * @route   GET /api/startup/my-startup
 * @access  Private
 */
export const getStartup = async (req, res) => {
  const userId = req.user.id || req.user._id;

  try {
    let startup;
    
    if (global.useMockDb) {
      startup = global.mockStartups.find(s => String(s.owner) === String(userId));
    } else {
      startup = await Startup.findOne({ owner: userId });
    }

    if (!startup) {
      return res.status(404).json({ success: false, message: 'No startup registered for this player' });
    }

    // Auto-migrate and initialize retail features
    let startupDirty = false;
    if (!startup.retailInventory) {
      startup.retailInventory = [];
      startupDirty = true;
    }
    if (!startup.retailState) {
      startup.retailState = {
        status: 'Open',
        reputation: 0.82,
        activeCycle: {
          status: 'Idle',
          startTime: null,
          endTime: null,
          duration: 0,
          expectedRevenue: 0,
          expectedProfit: 0,
          expectedCustomers: 0,
          expectedSales: {}
        },
        history: []
      };
      startupDirty = true;
    }

    const RETAIL_PRODUCTS_MAP = {
      'Clothing Store': ['shirts', 'jeans', 'jackets'],
      'Electronics Store': ['laptops', 'phones', 'tvs'],
      'Restaurant': ['biscuits', 'bread', 'cheese'],
      'Car Showroom': ['cars']
    };

    if (RETAIL_PRODUCTS_MAP[startup.businessType] && startup.retailInventory.length === 0) {
      const pIds = RETAIL_PRODUCTS_MAP[startup.businessType];
      const country = startup.country || 'India';
      const countryData = countryEconomy.countries[country] || countryEconomy.countries['India'];
      const localEconomy = countryData.commodities;
      startup.retailInventory = pIds.map(pId => {
        const econ = localEconomy[pId] || { name: pId, price: 100 };
        return {
          productId: pId,
          productName: econ.name,
          quantity: 0,
          sellingPrice: econ.price,
          basePrice: econ.price,
          avgPurchaseCost: Math.round(econ.price * 0.75)
        };
      });
      startupDirty = true;
    }

    // Resolve completed retail cycle
    const resolvedRetail = await checkAndResolveRetailCycle(startup);
    if (resolvedRetail) {
      startupDirty = true;
    }

    if (startupDirty && !global.useMockDb) {
      if (typeof startup.markModified === 'function') {
        startup.markModified('retailInventory');
        startup.markModified('retailState');
        startup.markModified('inventory');
        startup.markModified('financials');
      }
      await startup.save();
    }

    // Auto-migrate old documents missing financial accounting object
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
      if (startup.employeeMorale === undefined) {
        startup.employeeMorale = 100;
      }
      if (!global.useMockDb) {
        startup.markModified('financials');
        await startup.save();
      }
    }

    if (startup.outstandingTax === undefined) {
      if (typeof startup.set === 'function') {
        startup.set('outstandingTax', 0);
      } else {
        startup.outstandingTax = 0;
      }
      if (!global.useMockDb) {
        await startup.save();
      }
    }

    if (startup.productionSpeedMultiplier === undefined) {
      if (typeof startup.set === 'function') {
        startup.set('productionSpeedMultiplier', 1.0);
      } else {
        startup.productionSpeedMultiplier = 1.0;
      }
      if (!global.useMockDb) {
        await startup.save();
      }
    }

    // Process tasks
    await processCompletedTasks(startup._id);

    // Reload startup to retrieve fresh inventory state
    if (global.useMockDb) {
      startup = global.mockStartups.find(s => String(s.owner) === String(userId));
    } else {
      startup = await Startup.findOne({ owner: userId });
    }

    // Fetch remaining active tasks
    let activeTasks = [];
    if (global.useMockDb) {
      if (!global.mockProductionTasks) {
        global.mockProductionTasks = [];
      }
      activeTasks = global.mockProductionTasks.filter(
        t => String(t.startupId) === String(startup._id) && t.status === 'Producing'
      );
    } else {
      activeTasks = await ProductionTask.find({
        startupId: startup._id,
        status: 'Producing'
      });
    }

    const country = startup.country || 'United States';
    const countryData = countryEconomy.countries[country] || countryEconomy.countries['United States'];
    const localPrices = Object.keys(countryData.commodities).reduce((acc, key) => {
      acc[key] = countryData.commodities[key].price;
      return acc;
    }, {});

    // Compute dynamic avgPurchaseCost for retailInventory items
    if (startup.retailInventory) {
      const { getAveragePurchaseCost } = await import('./retailController.js');
      for (const item of startup.retailInventory) {
        const basePrice = localPrices[item.productId] || 100;
        item.basePrice = basePrice;
        item.avgPurchaseCost = await getAveragePurchaseCost(startup._id, item.productId, basePrice);
      }
    }

    const companyValuation = await getCompanyValuation(startup._id);

    res.status(200).json({
      success: true,
      startup: {
        ...startup.toObject ? startup.toObject() : startup,
        localPrices,
        companyValuation
      },
      tasks: activeTasks,
      serverTime: new Date()
    });

  } catch (error) {
    console.error(`[Startup Fetch Error] ${error.message}`);
    res.status(500).json({ success: false, message: 'Server error retrieving startup details' });
  }
};
