/**
 * CapitalGrid Financial Accounting Helper
 * Centralizes all adjustments to corporate financial statements.
 */

const setFinancialField = (startup, path, value) => {
  if (typeof startup.set === 'function') {
    startup.set(path, value);
  } else {
    // Fallback for mock/plain JS object
    const parts = path.split('.');
    let obj = startup;
    for (let i = 0; i < parts.length - 1; i++) {
      if (!obj[parts[i]]) obj[parts[i]] = {};
      obj = obj[parts[i]];
    }
    obj[parts[parts.length - 1]] = value;
  }
};

const ensureFinancials = (startup) => {
  if (!startup.financials) {
    startup.financials = {};
  }
  const fields = [
    'revenue', 
    'operatingExpenses', 
    'payrollExpense', 
    'productionExpense', 
    'marketplaceExpense', 
    'taxExpense', 
    'netProfit', 
    'retainedEarnings'
  ];
  fields.forEach(f => {
    if (startup.financials[f] === undefined || startup.financials[f] === null) {
      setFinancialField(startup, `financials.${f}`, 0);
    }
  });
};

const updateMargins = (startup) => {
  ensureFinancials(startup);
  const revenue = startup.financials.revenue || 0;
  const opex = startup.financials.operatingExpenses || 0;
  const net = revenue - opex;

  setFinancialField(startup, 'financials.netProfit', net);
  setFinancialField(startup, 'financials.retainedEarnings', net);

  // Mark financials as modified if it is a Mongoose document
  if (typeof startup.markModified === 'function') {
    startup.markModified('financials');
  }
};

export const recordPayroll = (startup, amount) => {
  ensureFinancials(startup);
  const currentPayroll = startup.financials.payrollExpense || 0;
  const currentOpex = startup.financials.operatingExpenses || 0;
  
  setFinancialField(startup, 'financials.payrollExpense', currentPayroll + amount);
  setFinancialField(startup, 'financials.operatingExpenses', currentOpex + amount);
  startup.currentBalance -= amount;
  updateMargins(startup);
};

export const recordRevenue = (startup, amount) => {
  ensureFinancials(startup);
  const currentRev = startup.financials.revenue || 0;
  
  setFinancialField(startup, 'financials.revenue', currentRev + amount);
  startup.currentBalance += amount;
  updateMargins(startup);
};

export const recordMarketplaceExpense = (startup, amount) => {
  ensureFinancials(startup);
  const currentMarket = startup.financials.marketplaceExpense || 0;
  const currentOpex = startup.financials.operatingExpenses || 0;
  
  setFinancialField(startup, 'financials.marketplaceExpense', currentMarket + amount);
  setFinancialField(startup, 'financials.operatingExpenses', currentOpex + amount);
  startup.currentBalance -= amount;
  updateMargins(startup);
};

export const recordProductionExpense = (startup, amount) => {
  ensureFinancials(startup);
  const currentProd = startup.financials.productionExpense || 0;
  const currentOpex = startup.financials.operatingExpenses || 0;
  
  setFinancialField(startup, 'financials.productionExpense', currentProd + amount);
  setFinancialField(startup, 'financials.operatingExpenses', currentOpex + amount);
  startup.currentBalance -= amount;
  updateMargins(startup);
};

export const recordTaxExpense = (startup, amount) => {
  ensureFinancials(startup);
  const currentTax = startup.financials.taxExpense || 0;
  const currentOpex = startup.financials.operatingExpenses || 0;
  
  setFinancialField(startup, 'financials.taxExpense', currentTax + amount);
  setFinancialField(startup, 'financials.operatingExpenses', currentOpex + amount);
  updateMargins(startup);
};

export const resetMonthlyCounters = (startup) => {
  ensureFinancials(startup);
  setFinancialField(startup, 'financials.revenue', 0);
  setFinancialField(startup, 'financials.operatingExpenses', 0);
  setFinancialField(startup, 'financials.payrollExpense', 0);
  setFinancialField(startup, 'financials.productionExpense', 0);
  setFinancialField(startup, 'financials.marketplaceExpense', 0);
  setFinancialField(startup, 'financials.taxExpense', 0);
  setFinancialField(startup, 'financials.netProfit', 0);
  setFinancialField(startup, 'financials.retainedEarnings', 0);
};
