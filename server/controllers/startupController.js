import Startup from '../models/Startup.js';
import User from '../models/User.js';

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
        owner: userId
      });

      // Update User profile
      await User.findByIdAndUpdate(userId, {
        startupExists: true,
        startupId: newStartup._id,
        country: country // Sync country
      });
    }

    res.status(201).json({
      success: true,
      message: 'Startup registered successfully',
      startup: newStartup
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

    res.status(200).json({
      success: true,
      startup
    });

  } catch (error) {
    console.error(`[Startup Fetch Error] ${error.message}`);
    res.status(500).json({ success: false, message: 'Server error retrieving startup details' });
  }
};
