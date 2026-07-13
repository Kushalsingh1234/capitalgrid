import * as contractService from '../services/contractService.js';
import Startup from '../models/Startup.js';

const VALID_COMMODITIES = [
  'seeds', 'wheat', 'rice', 'cotton', 'grains', 'vegetables', 'fodder', 'milk', 'eggs',
  'coal', 'iron ore', 'bauxite ore', 'limestone', 'gypsum', 'crude oil', 'minerals', 'sand', 'clay',
  'shirts', 'jeans', 'jackets', 'fabric', 'bread', 'biscuits', 'cheese', 'steel', 'aluminium',
  'cement', 'bricks', 'steel beams', 'glass', 'silicon', 'plastics', 'chemicals', 'processor',
  'display', 'electronic components', 'battery', 'on-board computer', 'phones', 'laptops',
  'tvs', 'combustion engine', 'cars'
];

const isCommodityValid = (comm) => {
  if (!comm) return false;
  const norm = comm.toLowerCase().replace(/_/g, ' ').trim();
  return VALID_COMMODITIES.includes(norm) || VALID_COMMODITIES.map(c => c.replace('-', ' ')).includes(norm.replace('-', ' '));
};

export const publishContract = async (req, res) => {
  try {
    const { 
      contractType, 
      commodity, 
      quantity, 
      offerValue, 
      intervalType, 
      intervalValue, 
      duration, 
      lateDeliveryPenalty, 
      description 
    } = req.body;

    // Retrieve user's startup reference from protect middleware
    let userStartup;
    if (global.useMockDb) {
      userStartup = (global.mockStartups || []).find(s => String(s.owner) === String(req.user._id));
    } else {
      userStartup = await Startup.findOne({ owner: req.user._id });
    }

    if (!userStartup) {
      return res.status(400).json({
        success: false,
        message: 'Active startup company reference is required to publish contract.'
      });
    }

    // Input fields validation
    if (!contractType || !['Buying', 'Selling'].includes(contractType)) {
      return res.status(400).json({ success: false, message: 'Invalid contract type.' });
    }

    if (!isCommodityValid(commodity)) {
      return res.status(400).json({ success: false, message: 'Invalid or unsupported game commodity.' });
    }

    if (!quantity || Number(quantity) <= 0) {
      return res.status(400).json({ success: false, message: 'Quantity must be a positive number.' });
    }

    if (!offerValue || Number(offerValue) <= 0) {
      return res.status(400).json({ success: false, message: 'Offer value must be a positive number.' });
    }

    if (!intervalType || !['Daily', 'Weekly'].includes(intervalType)) {
      return res.status(400).json({ success: false, message: 'Invalid delivery interval type.' });
    }

    if (!intervalValue || Number(intervalValue) <= 0) {
      return res.status(400).json({ success: false, message: 'Interval value must be positive.' });
    }

    if (!duration || ![3, 7, 14, 30].includes(Number(duration))) {
      return res.status(400).json({ success: false, message: 'Invalid contract duration.' });
    }

    if (lateDeliveryPenalty === undefined || ![10, 20, 30, 50].includes(Number(lateDeliveryPenalty))) {
      return res.status(400).json({ success: false, message: 'Invalid late delivery penalty percentage.' });
    }

    if (description && description.length > 500) {
      return res.status(400).json({ success: false, message: 'Description exceeds maximum limit of 500 characters.' });
    }

    const contract = await contractService.createContract(userStartup._id, {
      contractType,
      commodity,
      quantity,
      offerValue,
      intervalType,
      intervalValue,
      duration,
      lateDeliveryPenalty,
      description
    });

    res.status(201).json({
      success: true,
      message: 'Contract published successfully.',
      contract
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const getContracts = async (req, res) => {
  try {
    const { search, country, industry, commodity, contractType, page, limit } = req.query;
    const listData = await contractService.getContractsList({
      search,
      country,
      industry,
      commodity,
      contractType,
      status: 'Open',
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 10
    });

    res.json({
      success: true,
      ...listData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const getContract = async (req, res) => {
  try {
    const { id } = req.params;
    const contract = await contractService.getContractDetails(id);
    res.json({
      success: true,
      contract
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      message: error.message
    });
  }
};
