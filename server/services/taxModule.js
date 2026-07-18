import Startup from '../models/Startup.js';
import GovernmentAccount from '../models/GovernmentAccount.js';
import Transaction from '../models/Transaction.js';
import MonthlyExecutionLedger from '../models/MonthlyExecutionLedger.js';
import { TAX_CONFIG } from '../config/taxConfig.js';
import * as accountingHelper from './accountingHelper.js';
import { createNotification, formatCurrency } from './notificationService.js';

// Helper to format currency for console and description logs
const formatCurrencyLog = (amount, country) => {
  const symbols = {
    'India': '₹',
    'United States': '$',
    'United Kingdom': '£',
    'Germany': '€',
    'Japan': '¥',
    'Brazil': 'R$',
    'Australia': 'A$'
  };
  const sym = symbols[country] || '$';
  return `${sym}${amount.toLocaleString()}`;
};

// Helper to get or create government account
const getOrCreateGovAccount = async (country) => {
  if (global.useMockDb) {
    if (!global.mockGovernmentAccounts) {
      global.mockGovernmentAccounts = [];
    }
    let acc = global.mockGovernmentAccounts.find(a => a.country === country);
    if (!acc) {
      acc = {
        country,
        corporateTaxCollected: 0,
        payrollTaxCollected: 0,
        vatCollected: 0,
        governmentBalance: 0,
        subsidiesPaid: 0,
        lastUpdated: new Date()
      };
      global.mockGovernmentAccounts.push(acc);
    }
    return acc;
  } else {
    let acc = await GovernmentAccount.findOne({ country });
    if (!acc) {
      acc = await GovernmentAccount.create({ country });
    }
    return acc;
  }
};

const saveGovAccount = async (acc) => {
  if (global.useMockDb) {
    acc.lastUpdated = new Date();
  } else {
    acc.lastUpdated = new Date();
    await acc.save();
  }
};

export const processMonthlyTax = async (clockData) => {
  console.log(`[CorporateTaxModule] Running tax cycle for Month: ${clockData.month}, Year: ${clockData.year}`);
  
  // 1. Fetch all active startups
  let startups = [];
  if (global.useMockDb) {
    startups = (global.mockStartups || []).filter(s => s.status === 'Active');
  } else {
    try {
      startups = await Startup.find({ status: 'Active' });
    } catch (err) {
      console.error(`[CorporateTaxModule Error] Failed to fetch active startups: ${err.message}`);
      return {
        processedCount: 0,
        successCount: 0,
        skippedCount: 0,
        skippedReasons: [{ startupName: 'ALL', reason: `Database error: ${err.message}` }]
      };
    }
  }

  let successCount = 0;
  let skippedCount = 0;
  const skippedReasons = [];

  for (const startup of startups) {
    // 2. Idempotency Check using MonthlyExecutionLedger
    let ledgerExists = false;
    if (global.useMockDb) {
      if (!global.mockMonthlyExecutionLedgers) {
        global.mockMonthlyExecutionLedgers = [];
      }
      ledgerExists = global.mockMonthlyExecutionLedgers.some(
        l => String(l.startupId) === String(startup._id) &&
             l.gameMonth === clockData.month &&
             l.gameYear === clockData.year &&
             l.action === 'Tax'
      );
    } else {
      try {
        ledgerExists = await MonthlyExecutionLedger.exists({
          startupId: startup._id,
          gameMonth: clockData.month,
          gameYear: clockData.year,
          action: 'Tax'
        });
      } catch (err) {
        console.error(`[Tax Ledger Error] Failed to check ledger for ${startup.startupName}: ${err.message}`);
        continue;
      }
    }

    if (ledgerExists) {
      console.log(`[CorporateTaxModule] Skipping startup ${startup.startupName} - already processed for this game month.`);
      skippedCount++;
      skippedReasons.push({ startupName: startup.startupName, reason: 'Already processed' });
      continue;
    }

    const country = startup.country || 'United States';
    const config = TAX_CONFIG[country] || TAX_CONFIG['United States'];
    const taxRate = config.corporateTaxRate;

    // Calculate taxable profit: Taxable Profit = Revenue - Expenses
    const revenue = startup.financials?.revenue || 0;
    const expenses = startup.financials?.operatingExpenses || 0;
    const taxableProfit = Math.max(0, revenue - expenses);

    // Calculate current tax
    const corporateTax = Math.round(taxableProfit * taxRate);

    // Skip if no current tax and no previous outstanding liabilities
    if (corporateTax === 0 && (startup.outstandingTax || 0) === 0) {
      // Still need to reset monthly counters for the new month
      accountingHelper.resetMonthlyCounters(startup);
      if (!global.useMockDb) {
        try {
          startup.markModified('financials');
          await startup.save();
        } catch (err) {
          console.error(`[CorporateTaxModule Error] Failed to save startup ${startup.startupName}: ${err.message}`);
        }
      }

      // Create execution ledger record
      if (global.useMockDb) {
        global.mockMonthlyExecutionLedgers.push({
          startupId: startup._id,
          gameMonth: clockData.month,
          gameYear: clockData.year,
          action: 'Tax',
          processedAt: new Date()
        });
      } else {
        try {
          await MonthlyExecutionLedger.create({
            startupId: startup._id,
            gameMonth: clockData.month,
            gameYear: clockData.year,
            action: 'Tax'
          });
        } catch (err) {
          console.error(`[Tax Ledger Error] Failed to write ledger for ${startup.startupName}: ${err.message}`);
        }
      }

      skippedCount++;
      skippedReasons.push({ startupName: startup.startupName, reason: 'No tax liability (zero profit and zero outstanding)' });
      continue;
    }

    // 1. Record the period accrual tax expense (updates financials & OPEX)
    if (corporateTax > 0) {
      accountingHelper.recordTaxExpense(startup, corporateTax);
    }

    // 2. Perform Cash Settlement
    const previousOutstanding = startup.outstandingTax || 0;
    const totalLiability = corporateTax + previousOutstanding;
    const originalBalance = startup.currentBalance || 0;
    const newBalanceRaw = originalBalance - totalLiability;

    let amountPaid = 0;
    let newOutstanding = 0;

    if (newBalanceRaw >= 0) {
      // Can afford all tax liabilities
      startup.currentBalance = newBalanceRaw;
      amountPaid = totalLiability;
      newOutstanding = 0;
    } else {
      // Cannot afford all tax liabilities; pay up to our balance (leaving 0)
      amountPaid = originalBalance;
      newOutstanding = totalLiability - amountPaid;
      startup.currentBalance = 0;
    }

    // Update outstanding tax property
    if (typeof startup.set === 'function') {
      startup.set('outstandingTax', newOutstanding);
    } else {
      startup.outstandingTax = newOutstanding;
    }

    // 3. Reset the completed month's books
    accountingHelper.resetMonthlyCounters(startup);

    // Save startup
    if (!global.useMockDb) {
      try {
        startup.markModified('financials');
        await startup.save();
      } catch (err) {
        console.error(`[CorporateTaxModule Error] Failed to persist tax updates for ${startup.startupName}: ${err.message}`);
      }
    }

    // 4. Route collected revenue to Government Treasury & record Transaction
    if (amountPaid > 0) {
      await createNotification(
        startup._id,
        `Corporate Tax Deducted: Paid ${formatCurrency(amountPaid, country)} (Outstanding: ${formatCurrency(newOutstanding, country)}).`,
        'Tax',
        -amountPaid
      );

      try {
        const govAcc = await getOrCreateGovAccount(country);
        govAcc.corporateTaxCollected += amountPaid;
        govAcc.governmentBalance += amountPaid;
        await saveGovAccount(govAcc);
      } catch (err) {
        console.error(`[CorporateTaxModule Error] Failed to update treasury: ${err.message}`);
      }

      // Record a rich transaction log description for easy audit
      const description = `Corporate Tax | Taxable Profit: ${formatCurrencyLog(taxableProfit, country)} | Rate: ${(taxRate * 100).toFixed(0)}% | Tax Due: ${formatCurrencyLog(corporateTax, country)} | Paid: ${formatCurrencyLog(amountPaid, country)} | Outstanding: ${formatCurrencyLog(newOutstanding, country)}`;

      const txPayload = {
        startup: startup._id,
        transactionType: 'Tax',
        productName: 'Corporate Tax',
        quantity: 1,
        pricePerUnit: amountPaid,
        totalAmount: amountPaid,
        category: 'Tax',
        description,
        reference: 'Tax Module'
      };

      if (global.useMockDb) {
        if (!global.mockTransactions) {
          global.mockTransactions = [];
        }
        global.mockTransactions.push({
          _id: 'mock-tx-tax-' + Date.now() + Math.random(),
          ...txPayload,
          createdAt: new Date()
        });
      } else {
        try {
          await Transaction.create(txPayload);
        } catch (err) {
          console.error(`[CorporateTaxModule Error] Failed to write tax transaction: ${err.message}`);
        }
      }
    }

    // Create execution ledger record
    if (global.useMockDb) {
      global.mockMonthlyExecutionLedgers.push({
        startupId: startup._id,
        gameMonth: clockData.month,
        gameYear: clockData.year,
        action: 'Tax',
        processedAt: new Date()
      });
    } else {
      try {
        await MonthlyExecutionLedger.create({
          startupId: startup._id,
          gameMonth: clockData.month,
          gameYear: clockData.year,
          action: 'Tax'
        });
      } catch (err) {
        console.error(`[Tax Ledger Error] Failed to write ledger for ${startup.startupName}: ${err.message}`);
      }
    }

    successCount++;
    console.log(`[CorporateTaxModule] Startup: ${startup.startupName} | Taxable Profit: ${taxableProfit} | Tax Paid: ${amountPaid} | New Outstanding: ${newOutstanding}`);
  }

  return {
    processedCount: startups.length,
    successCount,
    skippedCount,
    skippedReasons
  };
};

export const corporateTaxModuleHooks = {
  onMonth: processMonthlyTax
};

