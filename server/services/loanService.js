import Startup from '../models/Startup.js';
import Loan from '../models/Loan.js';
import { getCompanyValuation } from './companyValuationService.js';
import { createNotification } from './notificationService.js';
import mongoose from 'mongoose';

// Rating definitions and annual interest rates
export const INTEREST_RATES = {
  'AAA': 5,
  'AA': 6,
  'A': 7,
  'BBB': 8,
  'BB': 10,
  'B': 12,
  'CCC': 15,
  'CC': 18,
  'C': 20,
  'D': 0 // No Eligibility
};

const RATINGS_ORDER = ['D', 'C', 'CC', 'CCC', 'B', 'BB', 'BBB', 'A', 'AA', 'AAA'];

const setupMockStorage = () => {
  if (!global.mockLoans) {
    global.mockLoans = [];
  }
};

/**
 * Calculates dynamic loan eligibility for a company.
 */
export const calculateLoanEligibility = async (startupId) => {
  setupMockStorage();
  
  let startup;
  if (global.useMockDb) {
    startup = global.mockStartups.find(s => String(s._id) === String(startupId));
  } else {
    startup = await Startup.findById(startupId);
  }

  if (!startup) {
    return {
      eligibility: 0,
      creditRating: 'BBB',
      valuation: 50000,
      outstandingDebt: 0,
      debtRatio: 0,
      hasDefaults: false,
      availableCredit: 0
    };
  }

  const creditRating = startup.creditRating || 'BBB';
  
  // Rating multipliers (factors of Valuation)
  const RATING_FACTORS = {
    'AAA': 0.50,
    'AA': 0.45,
    'A': 0.40,
    'BBB': 0.35,
    'BB': 0.30,
    'B': 0.25,
    'CCC': 0.15,
    'CC': 0.10,
    'C': 0.05,
    'D': 0.00
  };

  const ratingFactor = RATING_FACTORS[creditRating] || 0.35;
  const valuation = await getCompanyValuation(startupId);

  // Calculate existing outstanding debt
  let activeLoans = [];
  if (global.useMockDb) {
    activeLoans = global.mockLoans.filter(l => String(l.startupId) === String(startupId) && l.status === 'Active');
  } else {
    activeLoans = await Loan.find({ startupId, status: 'Active' });
  }

  const outstandingDebt = activeLoans.reduce((sum, l) => sum + (l.outstandingBalance || 0), 0);
  const debtRatio = valuation > 0 ? (outstandingDebt / valuation) : 0;

  // Monthly Profit and Taxes
  const netProfit = startup.financials?.netProfit || 0;
  const outstandingTax = startup.outstandingTax || 0;

  // Base calculation
  let eligibility = valuation * ratingFactor;

  // Profit/Loss adjustments
  if (netProfit > 0) {
    eligibility += netProfit * 2;
  } else {
    eligibility += netProfit * 1.5; // Decreases limit for net losses
  }

  // Outstanding tax penalty
  eligibility -= outstandingTax * 1.5;

  // Debt ratio multiplier penalty (Cap at 50%)
  if (debtRatio >= 0.50) {
    eligibility = 0;
  } else if (debtRatio > 0) {
    eligibility = eligibility * (1 - (debtRatio / 0.50));
  }

  eligibility = Math.max(0, Math.round(eligibility - outstandingDebt));

  if (creditRating === 'D') {
    eligibility = 0;
  }

  // Double check if any current defaulted loans exist
  let defaultedLoans = [];
  if (global.useMockDb) {
    defaultedLoans = global.mockLoans.filter(l => String(l.startupId) === String(startupId) && l.status === 'Defaulted');
  } else {
    defaultedLoans = await Loan.find({ startupId, status: 'Defaulted' });
  }

  if (defaultedLoans.length > 0) {
    eligibility = 0;
  }

  return {
    eligibility,
    creditRating,
    valuation,
    outstandingDebt,
    debtRatio,
    hasDefaults: defaultedLoans.length > 0,
    availableCredit: eligibility
  };
};

/**
 * Submits a new loan application.
 */
export const applyLoan = async (startupId, { loanType, amount, duration, purpose }) => {
  setupMockStorage();

  let startup;
  if (global.useMockDb) {
    startup = global.mockStartups.find(s => String(s._id) === String(startupId));
  } else {
    startup = await Startup.findById(startupId);
  }

  if (!startup) throw new Error('Startup not found');

  const { eligibility, creditRating, hasDefaults } = await calculateLoanEligibility(startupId);

  if (creditRating === 'D' || hasDefaults) {
    throw new Error('Loan rejected: Credit rating is D or outstanding defaults exist.');
  }

  if (amount > eligibility) {
    throw new Error(`Loan rejected: Requested amount exceeds current available credit limit of ${eligibility}.`);
  }

  const interestRate = INTEREST_RATES[creditRating] || 8;
  const interest = amount * (interestRate / 100) * (duration / 12);
  const totalRepayment = amount + interest;
  const monthlyEmi = Math.round(totalRepayment / duration);

  // Set Next EMI date to 1 month from now in game-clock time
  const now = new Date();
  const nextMonth = new Date(now);
  nextMonth.setUTCMonth(nextMonth.getUTCMonth() + 1);

  const loanData = {
    _id: global.useMockDb ? new mongoose.Types.ObjectId().toString() : undefined,
    startupId,
    loanType,
    purpose,
    amount,
    interestRate,
    duration,
    remainingDuration: duration,
    monthlyEmi,
    outstandingBalance: Math.round(totalRepayment),
    status: 'Active',
    missedPaymentsCount: 0,
    nextEmiDate: nextMonth,
    history: [],
    createdAt: new Date(),
    updatedAt: new Date()
  };

  let savedLoan;
  if (global.useMockDb) {
    savedLoan = loanData;
    global.mockLoans.push(savedLoan);
    startup.currentBalance += amount;
  } else {
    savedLoan = await Loan.create(loanData);
    await Startup.findByIdAndUpdate(startupId, { $inc: { currentBalance: amount } });
  }

  await createNotification(startupId, `Corporate loan approved: ${amount} added to your balance.`, 'LoanApproved', amount);

  return savedLoan;
};

/**
 * Handles partial or complete loan repayment.
 */
export const repayLoan = async (startupId, loanId, repayAmount) => {
  setupMockStorage();

  let startup;
  if (global.useMockDb) {
    startup = global.mockStartups.find(s => String(s._id) === String(startupId));
  } else {
    startup = await Startup.findById(startupId);
  }

  if (!startup) throw new Error('Startup not found');
  if (startup.currentBalance < repayAmount) throw new Error('Insufficient cash balance for repayment.');

  let loan;
  if (global.useMockDb) {
    loan = global.mockLoans.find(l => String(l._id) === String(loanId));
  } else {
    loan = await Loan.findById(loanId);
  }

  if (!loan) throw new Error('Loan not found');
  if (loan.status !== 'Active' && loan.status !== 'Defaulted') throw new Error('Loan is not active.');

  const principalPaid = Math.min(repayAmount, loan.outstandingBalance);
  loan.outstandingBalance -= principalPaid;

  // Add history log
  loan.history.push({
    paymentDate: new Date(),
    type: 'Early Repayment',
    amount: principalPaid,
    principalPaid: principalPaid,
    interestPaid: 0,
    status: 'Paid',
    balanceAfter: loan.outstandingBalance
  });

  if (loan.outstandingBalance <= 0) {
    loan.status = 'Fully Repaid';
    loan.outstandingBalance = 0;
    loan.remainingDuration = 0;

    // Reward successful repayment by raising credit rating
    const currentRatingIndex = RATINGS_ORDER.indexOf(startup.creditRating || 'BBB');
    if (currentRatingIndex < RATINGS_ORDER.length - 1) {
      startup.creditRating = RATINGS_ORDER[currentRatingIndex + 1];
    }
  } else {
    // Recalculate remaining monthly EMI
    if (loan.remainingDuration > 0) {
      loan.monthlyEmi = Math.round(loan.outstandingBalance / loan.remainingDuration);
    }
  }

  // Deduct from startup cash
  if (global.useMockDb) {
    startup.currentBalance -= principalPaid;
  } else {
    await loan.save();
    startup.currentBalance -= principalPaid;
    await startup.save();
  }

  await createNotification(startupId, `Repayment of ${principalPaid} processed. Outstanding debt remaining: ${loan.outstandingBalance}.`, 'LoanRepayment', principalPaid);

  return loan;
};

/**
 * Monthly Loans Ticker bound to the Economic Engine month change.
 */
export const processMonthlyLoans = async (clockData) => {
  setupMockStorage();
  console.log(`[Banking Service] Running monthly loan ticker for: ${clockData.formatted}`);

  let activeLoans = [];
  if (global.useMockDb) {
    activeLoans = global.mockLoans.filter(l => l.status === 'Active');
  } else {
    activeLoans = await Loan.find({ status: 'Active' });
  }

  for (const loan of activeLoans) {
    let startup;
    if (global.useMockDb) {
      startup = global.mockStartups.find(s => String(s._id) === String(loan.startupId));
    } else {
      startup = await Startup.findById(loan.startupId);
    }

    if (!startup) continue;

    const emiAmount = loan.monthlyEmi;
    const now = new Date();
    const nextMonth = new Date(now);
    nextMonth.setUTCMonth(nextMonth.getUTCMonth() + 1);

    if (startup.currentBalance >= emiAmount) {
      // 1. Success EMI payment
      startup.currentBalance -= emiAmount;
      loan.outstandingBalance = Math.max(0, loan.outstandingBalance - emiAmount);
      loan.remainingDuration -= 1;
      loan.missedPaymentsCount = 0;

      // Approximate interest vs principal
      const monthlyRate = (loan.interestRate / 12) / 100;
      const interestPaid = Math.min(Math.round(loan.outstandingBalance * monthlyRate), emiAmount);
      const principalPaid = emiAmount - interestPaid;

      loan.history.push({
        paymentDate: new Date(),
        type: 'EMI',
        amount: emiAmount,
        principalPaid,
        interestPaid,
        status: 'Paid',
        balanceAfter: loan.outstandingBalance
      });

      if (loan.outstandingBalance <= 0 || loan.remainingDuration <= 0) {
        loan.status = 'Fully Repaid';
        loan.outstandingBalance = 0;
        loan.remainingDuration = 0;

        // Upgrade rating notch
        const index = RATINGS_ORDER.indexOf(startup.creditRating || 'BBB');
        if (index < RATINGS_ORDER.length - 1) {
          startup.creditRating = RATINGS_ORDER[index + 1];
        }
      } else {
        // Upgrade credit rating rating progress (every 3 successful payments)
        const onTimeCount = loan.history.filter(h => h.status === 'Paid').length;
        if (onTimeCount > 0 && onTimeCount % 3 === 0) {
          const index = RATINGS_ORDER.indexOf(startup.creditRating || 'BBB');
          if (index < RATINGS_ORDER.length - 1) {
            startup.creditRating = RATINGS_ORDER[index + 1];
          }
        }
      }
    } else {
      // 2. Missed Payment!
      loan.missedPaymentsCount += 1;
      
      // Apply late fee (10% of EMI)
      const lateFee = Math.round(emiAmount * 0.10);
      loan.outstandingBalance += lateFee;

      loan.history.push({
        paymentDate: new Date(),
        type: 'Late Fee',
        amount: lateFee,
        principalPaid: 0,
        interestPaid: lateFee,
        status: 'Missed',
        balanceAfter: loan.outstandingBalance
      });

      // Downgrade credit rating by 1 notch
      const index = RATINGS_ORDER.indexOf(startup.creditRating || 'BBB');
      let newRating = startup.creditRating;
      if (index > 0) {
        newRating = RATINGS_ORDER[index - 1];
        startup.creditRating = newRating;
      }

      await createNotification(
        loan.startupId,
        `Missed monthly Loan EMI of ${emiAmount}. Downgraded credit rating to ${newRating}.`,
        'LoanEmiMissed',
        emiAmount
      );

      // Check Default conditions
      if (loan.missedPaymentsCount >= 3) {
        loan.status = 'Defaulted';
        startup.creditRating = 'D';

        await createNotification(
          loan.startupId,
          `CRITICAL: Loan defaulted after 3 consecutive missed payments. Credit rating set to D.`,
          'LoanDefaulted'
        );
      }
    }

    loan.nextEmiDate = nextMonth;
    loan.updatedAt = new Date();

    if (!global.useMockDb) {
      await loan.save();
      await startup.save();
    }
  }
};
