import * as agreementService from '../services/agreementService.js';
import Startup from '../models/Startup.js';

async function getUserStartup(req) {
  let userStartup = null;
  if (global.useMockDb) {
    if (!global.mockStartups) global.mockStartups = [];
    userStartup = global.mockStartups.find(s => String(s.owner) === String(req.user._id));
  } else {
    userStartup = await Startup.findOne({ owner: req.user._id });
  }
  return userStartup;
}

export const createProposal = async (req, res) => {
  try {
    const startup = await getUserStartup(req);
    if (!startup) {
      return res.status(404).json({ success: false, message: 'Your corporate startup profile was not found.' });
    }

    const proposal = await agreementService.submitProposal(req.body, startup._id);
    res.status(201).json({
      success: true,
      message: 'Agreement proposal submitted successfully.',
      agreement: proposal
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const counterProposal = async (req, res) => {
  try {
    const startup = await getUserStartup(req);
    if (!startup) {
      return res.status(404).json({ success: false, message: 'Your corporate startup profile was not found.' });
    }

    const { id } = req.params;
    const counter = await agreementService.counterProposal(id, req.body, startup._id);
    res.json({
      success: true,
      message: 'Counter proposal submitted successfully.',
      agreement: counter
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const acceptAgreement = async (req, res) => {
  try {
    const startup = await getUserStartup(req);
    if (!startup) {
      return res.status(404).json({ success: false, message: 'Your corporate startup profile was not found.' });
    }

    const { id } = req.params;
    const agreement = await agreementService.acceptAgreement(id, startup._id);
    res.json({
      success: true,
      message: 'Supply agreement accepted successfully. Operations are now active.',
      agreement
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const rejectAgreement = async (req, res) => {
  try {
    const startup = await getUserStartup(req);
    if (!startup) {
      return res.status(404).json({ success: false, message: 'Your corporate startup profile was not found.' });
    }

    const { id } = req.params;
    const agreement = await agreementService.rejectAgreement(id, startup._id);
    res.json({
      success: true,
      message: 'Agreement proposal rejected.',
      agreement
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const cancelAgreement = async (req, res) => {
  try {
    const startup = await getUserStartup(req);
    if (!startup) {
      return res.status(404).json({ success: false, message: 'Your corporate startup profile was not found.' });
    }

    const { id } = req.params;
    const agreement = await agreementService.cancelAgreement(id, startup._id);
    res.json({
      success: true,
      message: 'Agreement proposal cancelled.',
      agreement
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAgreementDetails = async (req, res) => {
  try {
    const startup = await getUserStartup(req);
    if (!startup) {
      return res.status(404).json({ success: false, message: 'Your corporate startup profile was not found.' });
    }

    const { id } = req.params;
    const agreement = await agreementService.getAgreementDetails(id, startup._id);
    res.json({
      success: true,
      agreement
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAgreementsList = async (req, res) => {
  try {
    const startup = await getUserStartup(req);
    if (!startup) {
      return res.status(404).json({ success: false, message: 'Your corporate startup profile was not found.' });
    }

    const { tab, search, page, limit } = req.query;
    const listData = await agreementService.getAgreementsList(startup._id, {
      tab,
      search,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 10
    });

    res.json({
      success: true,
      ...listData
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
