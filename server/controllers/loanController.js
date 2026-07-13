import Startup from '../models/Startup.js';
import Loan from '../models/Loan.js';
import * as loanService from '../services/loanService.js';

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

export const getLoanEligibility = async (req, res) => {
  try {
    const startup = await getUserStartup(req);
    if (!startup) {
      return res.status(404).json({ success: false, message: 'Startup not found.' });
    }

    const data = await loanService.calculateLoanEligibility(startup._id);
    res.json({
      success: true,
      ...data
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getActiveLoans = async (req, res) => {
  try {
    const startup = await getUserStartup(req);
    if (!startup) {
      return res.status(404).json({ success: false, message: 'Startup not found.' });
    }

    let loans = [];
    if (global.useMockDb) {
      loans = (global.mockLoans || []).filter(l => String(l.startupId) === String(startup._id) && (l.status === 'Active' || l.status === 'Defaulted'));
    } else {
      loans = await Loan.find({ startupId: startup._id, status: { $in: ['Active', 'Defaulted'] } }).sort({ createdAt: -1 });
    }

    res.json({
      success: true,
      loans
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getLoanHistory = async (req, res) => {
  try {
    const startup = await getUserStartup(req);
    if (!startup) {
      return res.status(404).json({ success: false, message: 'Startup not found.' });
    }

    let loans = [];
    if (global.useMockDb) {
      loans = (global.mockLoans || []).filter(l => String(l.startupId) === String(startup._id) && l.status === 'Fully Repaid');
    } else {
      loans = await Loan.find({ startupId: startup._id, status: 'Fully Repaid' }).sort({ updatedAt: -1 });
    }

    res.json({
      success: true,
      loans
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const applyForLoan = async (req, res) => {
  try {
    const startup = await getUserStartup(req);
    if (!startup) {
      return res.status(404).json({ success: false, message: 'Startup not found.' });
    }

    const { loanType, amount, duration, purpose } = req.body;
    if (!loanType || !amount || !duration || !purpose) {
      return res.status(400).json({ success: false, message: 'Please provide all required loan fields.' });
    }

    const loan = await loanService.applyLoan(startup._id, {
      loanType,
      amount: Number(amount),
      duration: Number(duration),
      purpose
    });

    res.status(201).json({
      success: true,
      message: 'Corporate loan application approved successfully.',
      loan
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const repayLoan = async (req, res) => {
  try {
    const startup = await getUserStartup(req);
    if (!startup) {
      return res.status(404).json({ success: false, message: 'Startup not found.' });
    }

    const { id } = req.params;
    const { amount } = req.body;
    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({ success: false, message: 'Repayment amount must be a positive number.' });
    }

    const loan = await loanService.repayLoan(startup._id, id, Number(amount));
    res.json({
      success: true,
      message: loan.status === 'Fully Repaid' ? 'Loan fully paid off!' : 'Repayment successfully processed.',
      loan
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
