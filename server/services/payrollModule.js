import Startup from '../models/Startup.js';
import Employee from '../models/Employee.js';
import Transaction from '../models/Transaction.js';
import MonthlyExecutionLedger from '../models/MonthlyExecutionLedger.js';
import { getSalary } from '../config/countryEconomy.js';
import * as accountingHelper from './accountingHelper.js';
import { createNotification, formatCurrency } from './notificationService.js';

const getMonthName = (monthNum) => {
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return monthNames[monthNum - 1] || 'Month';
};

const processMonthlyPayroll = async (clockData) => {
  console.log(`[Payroll] Beginning Monthly Payroll run for: ${clockData.formatted}`);
  
  let startupsList = [];
  if (global.useMockDb) {
    startupsList = global.mockStartups || [];
  } else {
    try {
      startupsList = await Startup.find();
    } catch (err) {
      console.error(`[Payroll Error] Failed to fetch active startups: ${err.message}`);
      return {
        processedCount: 0,
        successCount: 0,
        failedCount: 0,
        skippedCount: 0,
        skippedReasons: [{ startupName: 'ALL', reason: `Database error: ${err.message}` }]
      };
    }
  }

  let successCount = 0;
  let failedCount = 0;
  let skippedCount = 0;
  const skippedReasons = [];

  for (const startup of startupsList) {
    // 1. Idempotency Check using MonthlyExecutionLedger
    let ledgerExists = false;
    if (global.useMockDb) {
      if (!global.mockMonthlyExecutionLedgers) {
        global.mockMonthlyExecutionLedgers = [];
      }
      ledgerExists = global.mockMonthlyExecutionLedgers.some(
        l => String(l.startupId) === String(startup._id) &&
             l.gameMonth === clockData.month &&
             l.gameYear === clockData.year &&
             l.action === 'Payroll'
      );
    } else {
      try {
        ledgerExists = await MonthlyExecutionLedger.exists({
          startupId: startup._id,
          gameMonth: clockData.month,
          gameYear: clockData.year,
          action: 'Payroll'
        });
      } catch (err) {
        console.error(`[Payroll Ledger Error] Failed to check ledger for ${startup.startupName}: ${err.message}`);
        continue;
      }
    }

    if (ledgerExists) {
      console.log(`[Payroll] Skipping startup ${startup.startupName} - already processed for this game month.`);
      skippedCount++;
      skippedReasons.push({ startupName: startup.startupName, reason: 'Already processed' });
      continue;
    }

    let activeEmployees = [];
    if (global.useMockDb) {
      activeEmployees = (global.mockEmployees || []).filter(e => String(e.startupId) === String(startup._id));
    } else {
      try {
        activeEmployees = await Employee.find({ startupId: startup._id });
      } catch (err) {
        console.error(`[Payroll Error] Failed to fetch employees for startup ${startup.startupName}: ${err.message}`);
        continue;
      }
    }

    const totalEmployees = activeEmployees.reduce((sum, e) => sum + e.quantity, 0);
    if (totalEmployees === 0) {
      // Create execution ledger record
      if (global.useMockDb) {
        global.mockMonthlyExecutionLedgers.push({
          startupId: startup._id,
          gameMonth: clockData.month,
          gameYear: clockData.year,
          action: 'Payroll',
          processedAt: new Date()
        });
      } else {
        try {
          await MonthlyExecutionLedger.create({
            startupId: startup._id,
            gameMonth: clockData.month,
            gameYear: clockData.year,
            action: 'Payroll'
          });
        } catch (err) {
          console.error(`[Payroll Ledger Error] Failed to write ledger for ${startup.startupName}: ${err.message}`);
          continue;
        }
      }

      startup.recentPayroll = {
        status: 'Success',
        month: `${getMonthName(clockData.month)} ${clockData.year}`,
        employeesPaid: 0,
        amount: 0,
        cashRemaining: startup.currentBalance,
        date: new Date()
      };
      if (!global.useMockDb) {
        try {
          await startup.save();
        } catch (err) {
          console.error(`[Payroll Error] Failed to save startup ${startup.startupName}: ${err.message}`);
        }
      }
      skippedCount++;
      skippedReasons.push({ startupName: startup.startupName, reason: 'No active employees' });
      continue;
    }

    const groups = [];
    let totalPayroll = 0;

    for (const e of activeEmployees) {
      const salaryRate = getSalary(startup.country, e.employeeType);
      const groupCost = e.quantity * salaryRate;
      totalPayroll += groupCost;

      groups.push({
        employeeType: e.employeeType,
        quantity: e.quantity,
        salaryRate,
        totalAmount: groupCost
      });
    }

    if (startup.currentBalance >= totalPayroll) {
      // SUCCESSFUL PAYROLL POSTING
      accountingHelper.recordPayroll(startup, totalPayroll);
      
      startup.employeeMorale = Math.min(100, (startup.employeeMorale !== undefined ? startup.employeeMorale : 100) + 25);

      for (const group of groups) {
        const txPayload = {
          startup: startup._id,
          transactionType: 'Payroll',
          productName: 'Labour Outlay',
          quantity: group.quantity,
          pricePerUnit: group.salaryRate,
          totalAmount: group.totalAmount,
          category: 'Payroll',
          description: `Monthly ${group.employeeType} Salaries`,
          reference: 'Payroll Module'
        };

        if (global.useMockDb) {
          global.mockTransactions.push({
            _id: 'mock-tx-pr-' + Date.now() + Math.random(),
            ...txPayload,
            createdAt: new Date()
          });
        } else {
          try {
            await Transaction.create(txPayload);
          } catch (err) {
            console.error(`[Payroll Error] Failed to write ledger row for startup ${startup.startupName}: ${err.message}`);
          }
        }
      }

      startup.recentPayroll = {
        status: 'Success',
        month: `${getMonthName(clockData.month)} ${clockData.year}`,
        employeesPaid: totalEmployees,
        amount: totalPayroll,
        cashRemaining: startup.currentBalance,
        date: new Date()
      };

      await createNotification(
        startup._id,
        `Monthly Payroll Processed: Paid ${formatCurrency(totalPayroll, startup.country)} to ${totalEmployees} employees.`,
        'Payroll',
        -totalPayroll
      );

      // Create execution ledger record
      if (global.useMockDb) {
        global.mockMonthlyExecutionLedgers.push({
          startupId: startup._id,
          gameMonth: clockData.month,
          gameYear: clockData.year,
          action: 'Payroll',
          processedAt: new Date()
        });
      } else {
        try {
          await MonthlyExecutionLedger.create({
            startupId: startup._id,
            gameMonth: clockData.month,
            gameYear: clockData.year,
            action: 'Payroll'
          });
        } catch (err) {
          console.error(`[Payroll Ledger Error] Failed to write ledger for ${startup.startupName}: ${err.message}`);
        }
      }

      successCount++;
      console.log(`[Payroll] Startup: ${startup.startupName} | Employees: ${totalEmployees} | Payroll: ${totalPayroll} | Status: Success`);

    } else {
      // FAILED PAYROLL POSTING
      startup.employeeMorale = Math.max(0, (startup.employeeMorale !== undefined ? startup.employeeMorale : 100) - 25);

      await createNotification(
        startup._id,
        `Monthly Payroll FAILED: Insufficient funds to pay ${formatCurrency(totalPayroll, startup.country)} to ${totalEmployees} employees.`,
        'Payroll',
        0
      );

      const failTxPayload = {
        startup: startup._id,
        transactionType: 'Payroll',
        productName: 'Labour Outlay',
        quantity: totalEmployees,
        pricePerUnit: 0,
        totalAmount: 0,
        category: 'Payroll',
        description: `Monthly Payroll FAILED - Insufficient Funds`,
        reference: 'Payroll Module'
      };

      if (global.useMockDb) {
        global.mockTransactions.push({
          _id: 'mock-tx-pr-fail-' + Date.now() + Math.random(),
          ...failTxPayload,
          createdAt: new Date()
        });
      } else {
        try {
          await Transaction.create(failTxPayload);
        } catch (err) {
          console.error(`[Payroll Error] Failed to write failure ledger row: ${err.message}`);
        }
      }

      startup.recentPayroll = {
        status: 'Failed',
        month: `${getMonthName(clockData.month)} ${clockData.year}`,
        employeesPaid: 0,
        amount: totalPayroll,
        cashRemaining: startup.currentBalance,
        error: 'Insufficient company funds. Employee morale decreased.',
        date: new Date()
      };

      // Create execution ledger record
      if (global.useMockDb) {
        global.mockMonthlyExecutionLedgers.push({
          startupId: startup._id,
          gameMonth: clockData.month,
          gameYear: clockData.year,
          action: 'Payroll',
          processedAt: new Date()
        });
      } else {
        try {
          await MonthlyExecutionLedger.create({
            startupId: startup._id,
            gameMonth: clockData.month,
            gameYear: clockData.year,
            action: 'Payroll'
          });
        } catch (err) {
          console.error(`[Payroll Ledger Error] Failed to write ledger for ${startup.startupName}: ${err.message}`);
        }
      }

      failedCount++;
      console.warn(`[Payroll] Startup: ${startup.startupName} | Employees: ${totalEmployees} | Payroll: ${totalPayroll} | Status: Failed`);
    }

    if (!global.useMockDb) {
      try {
        startup.markModified('financials');
        startup.markModified('recentPayroll');
        await startup.save();
      } catch (err) {
        console.error(`[Payroll Error] Failed to persist startup ledger details: ${err.message}`);
      }
    }
  }

  return {
    processedCount: startupsList.length,
    successCount,
    failedCount,
    skippedCount,
    skippedReasons
  };
};

export const payrollModuleHooks = {
  onMonth: processMonthlyPayroll
};

