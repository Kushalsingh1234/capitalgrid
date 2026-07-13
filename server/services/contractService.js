import Contract from '../models/Contract.js';
import Startup from '../models/Startup.js';

export const createContract = async (startupId, contractData) => {
  let startup;
  if (global.useMockDb) {
    startup = (global.mockStartups || []).find(s => String(s._id) === String(startupId));
  } else {
    startup = await Startup.findById(startupId);
  }

  if (!startup) {
    throw new Error('Publisher startup company not found');
  }

  // Calculate Expiry Date from duration (in Days)
  const durationDays = Number(contractData.duration || 7);
  const expiryDate = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000);

  const newContractPayload = {
    startup: startup._id,
    startupName: startup.startupName,
    country: startup.country,
    businessType: startup.businessType,
    contractType: contractData.contractType, // 'Buying' or 'Selling'
    commodity: contractData.commodity,
    quantity: Number(contractData.quantity),
    offerValue: Number(contractData.offerValue),
    intervalType: contractData.intervalType, // 'Daily' or 'Weekly'
    intervalValue: Number(contractData.intervalValue),
    deliveryInterval: Number(contractData.deliveryInterval || (contractData.intervalType === 'Weekly' ? Number(contractData.intervalValue) * 7 : Number(contractData.intervalValue || 1))),
    deliveryIntervalUnit: contractData.deliveryIntervalUnit || 'Days',
    duration: durationDays,
    expiryDate: expiryDate,
    lateDeliveryPenalty: Number(contractData.lateDeliveryPenalty),
    description: contractData.description || '',
    status: 'Open'
  };

  let contract;
  if (global.useMockDb) {
    if (!global.mockContracts) {
      global.mockContracts = [];
    }
    contract = {
      _id: 'mock-contract-' + Date.now() + Math.random().toString(36).substr(2, 4),
      ...newContractPayload,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    global.mockContracts.push(contract);
  } else {
    contract = await Contract.create(newContractPayload);
  }

  return contract;
};

export const getContractsList = async ({
  search = '',
  country = '',
  industry = '',
  commodity = '',
  contractType = '',
  status = 'Open',
  page = 1,
  limit = 10
}) => {
  const pageNum = Math.max(1, Number(page));
  const limitNum = Math.max(1, Number(limit));
  const skip = (pageNum - 1) * limitNum;

  if (global.useMockDb) {
    if (!global.mockContracts) {
      global.mockContracts = [];
    }

    let filtered = [...global.mockContracts];

    // Filter by status
    if (status) {
      filtered = filtered.filter(c => String(c.status).toLowerCase() === status.toLowerCase());
    }

    // Filter by contractType (Buying / Selling)
    if (contractType) {
      filtered = filtered.filter(c => String(c.contractType).toLowerCase() === contractType.toLowerCase());
    }

    // Filter by country
    if (country) {
      filtered = filtered.filter(c => String(c.country).toLowerCase() === country.toLowerCase());
    }

    // Filter by industry/sector
    if (industry) {
      filtered = filtered.filter(c => 
        String(c.businessType).toLowerCase() === industry.toLowerCase()
      );
    }

    // Filter by commodity
    if (commodity) {
      filtered = filtered.filter(c => 
        String(c.commodity).toLowerCase() === commodity.toLowerCase()
      );
    }

    // Search bar text (matches startupName or commodity name)
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(c => 
        String(c.startupName).toLowerCase().includes(q) ||
        String(c.commodity).toLowerCase().includes(q)
      );
    }

    // Sort by createdAt desc
    filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const totalCount = filtered.length;
    const totalPages = Math.ceil(totalCount / limitNum);
    const paginated = filtered.slice(skip, skip + limitNum);

    return {
      contracts: paginated,
      totalCount,
      totalPages,
      page: pageNum,
      limit: limitNum
    };
  } else {
    // MongoDB aggregation query matching parameters
    const query = {};

    if (status) {
      query.status = status;
    }
    if (contractType) {
      query.contractType = contractType;
    }
    if (country) {
      query.country = { $regex: new RegExp('^' + country + '$', 'i') };
    }
    if (industry) {
      query.businessType = { $regex: new RegExp('^' + industry + '$', 'i') };
    }
    if (commodity) {
      query.commodity = { $regex: new RegExp('^' + commodity + '$', 'i') };
    }
    if (search) {
      const qRegex = new RegExp(search, 'i');
      query.$or = [
        { startupName: { $regex: qRegex } },
        { commodity: { $regex: qRegex } }
      ];
    }

    const totalCount = await Contract.countDocuments(query);
    const totalPages = Math.ceil(totalCount / limitNum);
    const contracts = await Contract.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .populate('startup', 'logo'); // Populate startup details (e.g. logo)

    return {
      contracts,
      totalCount,
      totalPages,
      page: pageNum,
      limit: limitNum
    };
  }
};

export const getContractDetails = async (contractId) => {
  if (global.useMockDb) {
    if (!global.mockContracts) {
      global.mockContracts = [];
    }
    const contract = global.mockContracts.find(c => String(c._id) === String(contractId));
    if (!contract) {
      throw new Error('Contract listing not found');
    }
    return contract;
  } else {
    const contract = await Contract.findById(contractId).populate('startup', 'logo');
    if (!contract) {
      throw new Error('Contract listing not found');
    }
    return contract;
  }
};
