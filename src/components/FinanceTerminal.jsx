import React, { useState, useEffect } from 'react';

const CURRENCY_SYMBOLS = {
  'India': '₹',
  'United States': '$',
  'United Kingdom': '£',
  'Germany': '€',
  'Japan': '¥',
  'Brazil': 'R$',
  'Australia': 'A$'
};

const formatCurrency = (amount, countryName) => {
  const symbol = CURRENCY_SYMBOLS[countryName] || '$';
  return `${symbol}${amount?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export default function FinanceTerminal({
  startup,
  inventory = [],
  transactions = [],
  employees = [],
  token,
  onClose
}) {
  // Sub-view selection state
  const [activeSubTab, setActiveSubTab] = useState('Income Statement');
  const [newsHeadlineIdx, setNewsHeadlineIdx] = useState(0);

  // Collapsible nav group states
  const [groupsExpanded, setGroupsExpanded] = useState({
    accounting: true,
    debtTax: true,
    audit: true
  });

  // Ticker text headlines
  const headlines = [
    'Interest rates expected to rise following monetary policy committee update.',
    'Steel industry profits increasing as factory infrastructure demand surges.',
    'Construction sector indices slowing down globally amid high raw material pricing.',
    'Fuel prices stable following production quota settlements.'
  ];

  // Headline rotation effect
  useEffect(() => {
    const timer = setInterval(() => {
      setNewsHeadlineIdx(prev => (prev + 1) % headlines.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const [nextTaxDateStr, setNextTaxDateStr] = useState('01 of Next Month');

  useEffect(() => {
    const fetchClock = async () => {
      try {
        const res = await fetch('/api/world-clock');
        const data = await res.json();
        if (data.success && data.data) {
          const clock = data.data;
          let nextMonth = clock.month + 1;
          let nextYear = clock.year;
          if (nextMonth > 12) {
            nextMonth = 1;
            nextYear += 1;
          }
          const monthNames = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
          ];
          setNextTaxDateStr(`01 ${monthNames[nextMonth - 1]} ${nextYear}`);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchClock();
  }, []);

  const TAX_CONFIG = {
    'India': { corporateTaxRate: 0.25 },
    'United States': { corporateTaxRate: 0.21 },
    'United Kingdom': { corporateTaxRate: 0.25 },
    'Germany': { corporateTaxRate: 0.30 },
    'Brazil': { corporateTaxRate: 0.20 },
    'Japan': { corporateTaxRate: 0.23 },
    'Australia': { corporateTaxRate: 0.30 }
  };

  const currentCash = startup?.currentBalance || 0;
  const monthlyRevenue = startup?.financials?.revenue || 0;
  const payrollExpense = startup?.financials?.payrollExpense || 0;
  const morale = startup?.employeeMorale !== undefined ? startup.employeeMorale : 100;
  const country = startup?.country || 'United States';
  const taxConfig = TAX_CONFIG[country] || TAX_CONFIG['United States'];
  const taxRate = taxConfig.corporateTaxRate;

  // 1. PROJECTED Calculations from Current Workforce (regardless of whether payroll has run yet)
  const totalEmployees = employees.reduce((sum, e) => sum + e.quantity, 0);
  const monthlyPayrollOutflow = employees.reduce((sum, e) => sum + (e.quantity * e.salary), 0);
  const annualPayrollProjection = monthlyPayrollOutflow * 12;
  const averageSalaryPerEmployee = totalEmployees > 0 ? monthlyPayrollOutflow / totalEmployees : 0;

  // 2. Calculations from Inventory Stocks
  const localPrices = startup?.localPrices || {};
  const inventoryAssetValuation = inventory.reduce((sum, item) => {
    const price = localPrices[item.productId] || 0;
    return sum + (item.quantity * price);
  }, 0);
  const totalInventoryQuantity = inventory.reduce((sum, item) => sum + item.quantity, 0);

  // 3. Derived indicators from Ledger Transactions & Financials
  // COGS is calculated directly from actual marketplace and production expenses
  const costOfGoodsSold = (startup?.financials?.marketplaceExpense || 0) + (startup?.financials?.productionExpense || 0);

  // Total monthly expenses include raw materials/COGS plus the actual payroll (or projected payroll if cycle has not executed yet)
  const monthlyExpenses = costOfGoodsSold + Math.max(payrollExpense, monthlyPayrollOutflow);
  
  // Net profit is monthly revenue minus total monthly expenses
  const netProfitLoss = monthlyRevenue - monthlyExpenses;
  const retainedEarnings = netProfitLoss;
  const taxableProfit = Math.max(0, netProfitLoss);

  const netWorth = currentCash + inventoryAssetValuation;
  const companyValuation = (startup?.startingCapital || 50000) + currentCash + (totalEmployees * 5000) + (inventoryAssetValuation * 1.5);

  // Cash flow stats (Actual Cash Flow includes payroll expense)
  const cashIn = monthlyRevenue;
  const cashOut = monthlyExpenses;
  const salesTx = transactions.filter(t => t.transactionType === 'Sale');
  const purchaseTx = transactions.filter(t => t.transactionType === 'Purchase');
  const largestExpenseValue = purchaseTx.length > 0 
    ? Math.max(...purchaseTx.map(t => t.totalAmount)) 
    : 0;
  const maxExpenseAmt = Math.max(largestExpenseValue, payrollExpense);
  const maxIncomeAmt = salesTx.length > 0 ? Math.max(...salesTx.map(t => t.totalAmount)) : 0;

  // Projected Payroll percentage of revenue
  const payrollRevenuePct = monthlyRevenue > 0 
    ? ((monthlyPayrollOutflow / monthlyRevenue) * 100).toFixed(1) + '%' 
    : 'No revenue this month';

  // Dynamic Financial Alerts
  const alerts = [];
  if (currentCash < 10000) {
    alerts.push({
      type: 'error',
      icon: 'fa-wallet text-red-400',
      text: 'Cash reserves low: Maintain liquidity balance above €10,000.'
    });
  }
  if (netProfitLoss < 0) {
    alerts.push({
      type: 'warning',
      icon: 'fa-chart-line-down text-red-400',
      text: 'Factory operating at loss: Cash outlays exceed exchange revenues.'
    });
  }
  if (totalInventoryQuantity > 100) {
    alerts.push({
      type: 'info',
      icon: 'fa-warehouse text-cyan-400',
      text: 'Inventory volume increasing: Verify marketplace listings are active.'
    });
  }
  if (payrollExpense > 0) {
    alerts.push({
      type: 'info',
      icon: 'fa-wallet text-greenGlow',
      text: `Monthly payroll executed: Actual opex outflow was ${formatCurrency(payrollExpense, startup?.country)}.`
    });
  }
  if (monthlyPayrollOutflow > 0) {
    alerts.push({
      type: 'info',
      icon: 'fa-users-gear text-amber-500',
      text: `Projected payroll commitment: Future monthly commitment is ${formatCurrency(monthlyPayrollOutflow, startup?.country)}.`
    });
  }
  if (alerts.length === 0) {
    alerts.push({
      type: 'success',
      icon: 'fa-circle-check text-greenGlow',
      text: 'No financial alerts.'
    });
  }

  // Toggle collapsible groups
  const toggleGroup = (group) => {
    setGroupsExpanded(prev => ({ ...prev, [group]: !prev[group] }));
  };

  return (
    <div className="w-full h-full flex flex-col justify-start bg-[#090e17] text-white p-6 relative font-body select-none">
      
      {/* Finance Header */}
      <div className="mb-6 p-4 bg-white/2 border border-white/5 rounded-lg flex justify-between items-center gap-4 bg-gradient-to-b from-glassBg to-black/30 shrink-0">
        <div>
          <h2 className="font-display font-extrabold text-lg uppercase tracking-wider text-white">
            Corporate Treasury Ledger
          </h2>
          <div className="flex items-center gap-3 mt-1.5 flex-wrap">
            <span className="flex items-center gap-1 text-[9px] font-mono text-cyanGlow uppercase tracking-widest bg-cyan-950/20 px-2 py-0.5 rounded border border-cyanGlow/10">
              <span className="w-1.5 h-1.5 rounded-full bg-cyanGlow animate-ping"></span>
              Secure Network Connected
            </span>
            <span className="text-[10px] text-text-secondary">
              Auditor Grade: <span className="text-white font-mono font-bold">AAA+</span>
            </span>
          </div>
        </div>

        {onClose && (
          <button 
            onClick={onClose}
            className="w-6 h-6 border border-white/5 hover:border-white/20 rounded flex items-center justify-center text-text-muted hover:text-white transition-colors cursor-pointer"
            title="Return to Game Map"
          >
            <i className="fa-solid fa-xmark text-xs"></i>
          </button>
        )}
      </div>
      
      {/* 1. TOP FINANCIAL SUMMARY */}
      <div className="grid grid-cols-2 md:grid-cols-5 lg:grid-cols-9 gap-3 mb-6">
        {[
          { label: 'Current Cash Balance', val: formatCurrency(currentCash, startup?.country), icon: 'fa-sack-dollar text-greenGlow' },
          { label: 'Net Worth', val: formatCurrency(netWorth, startup?.country), icon: 'fa-chart-pie text-white' },
          { label: 'Company Valuation', val: formatCurrency(companyValuation, startup?.country), icon: 'fa-award text-cyanGlow' },
          { label: 'Monthly Revenue', val: formatCurrency(monthlyRevenue, startup?.country), icon: 'fa-arrow-trend-up text-emerald-400' },
          { label: 'Monthly Expenses', val: formatCurrency(monthlyExpenses, startup?.country), icon: 'fa-arrow-trend-down text-red-400' },
          { label: 'Projected Payroll', val: formatCurrency(monthlyPayrollOutflow, startup?.country), icon: 'fa-users text-amber-500' },
          { label: 'Executed Payroll', val: formatCurrency(payrollExpense, startup?.country), icon: 'fa-user-check text-greenGlow' },
          { label: 'Effective Tax Rate', val: `${(taxRate * 100).toFixed(0)}%`, icon: 'fa-percent text-cyanGlow' },
          { 
            label: 'Net Profit', 
            val: formatCurrency(netProfitLoss, startup?.country), 
            icon: `fa-scale-balanced ${netProfitLoss >= 0 ? 'text-greenGlow' : 'text-red-400'}` 
          }
        ].map((card, idx) => (
          <div key={idx} className="p-4 bg-white/2 border border-white/5 rounded-lg flex flex-col gap-1.5 bg-gradient-to-b from-glassBg to-black/25">
            <div className="flex justify-between items-center text-[9px] font-display uppercase tracking-widest text-text-muted">
              <span>{card.label}</span>
              <i className={`fa-solid ${card.icon} text-[10px]`}></i>
            </div>
            <span className="block font-mono font-bold text-xs text-white truncate mt-0.5">
              {card.val}
            </span>
          </div>
        ))}
      </div>

      {/* Main Responsive Grid Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start flex-1 min-h-0">
        
        {/* LEFT PANEL - Financial Navigation (lg:col-span-2) */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="glass-card p-4 border border-white/5 rounded-lg bg-gradient-to-b from-glassBg to-black/30 flex flex-col gap-4">
            
            {/* Group 1: Cash & Accounting */}
            <div>
              <button 
                onClick={() => toggleGroup('accounting')}
                className="w-full flex justify-between items-center text-[10px] font-display uppercase tracking-widest text-text-muted mb-2 border-b border-white/5 pb-1 text-left"
              >
                <span>Cash & Accounting</span>
                <i className={`fa-solid ${groupsExpanded.accounting ? 'fa-chevron-down' : 'fa-chevron-right'} text-[8px]`}></i>
              </button>
              {groupsExpanded.accounting && (
                <div className="flex flex-col gap-1 mt-1">
                  {[
                    { id: 'Income Statement', label: 'Income Statement' },
                    { id: 'Financial Dashboard', label: 'Overview Dashboard' },
                    { id: 'Balance Sheet', label: 'Balance Sheet' },
                    { id: 'Payroll Summary', label: 'Payroll Ledger' }
                  ].map((sub, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveSubTab(sub.id)}
                      className={`w-full text-left px-2.5 py-1.5 rounded text-xs font-mono transition-colors ${
                        activeSubTab === sub.id
                          ? 'bg-cyanGlow/10 text-cyanGlow font-bold border-l-2 border-cyanGlow pl-2'
                          : 'text-text-secondary hover:bg-white/2 hover:text-white pl-2'
                      }`}
                    >
                      {sub.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Group 2: Debt & Taxes */}
            <div>
              <button 
                onClick={() => toggleGroup('debtTax')}
                className="w-full flex justify-between items-center text-[10px] font-display uppercase tracking-widest text-text-muted mb-2 border-b border-white/5 pb-1 text-left"
              >
                <span>Debt & Taxes</span>
                <i className={`fa-solid ${groupsExpanded.debtTax ? 'fa-chevron-down' : 'fa-chevron-right'} text-[8px]`}></i>
              </button>
              {groupsExpanded.debtTax && (
                <div className="flex flex-col gap-1 mt-1">
                  {[
                    { id: 'Loan Center', label: 'Loan Center' },
                    { id: 'Tax Center', label: 'Tax Center' }
                  ].map((sub, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveSubTab(sub.id)}
                      className={`w-full text-left px-2.5 py-1.5 rounded text-xs font-mono transition-colors ${
                        activeSubTab === sub.id
                          ? 'bg-cyanGlow/10 text-cyanGlow font-bold border-l-2 border-cyanGlow pl-2'
                          : 'text-text-secondary hover:bg-white/2 hover:text-white pl-2'
                      }`}
                    >
                      {sub.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Group 3: Auditing & Forecasting */}
            <div>
              <button 
                onClick={() => toggleGroup('audit')}
                className="w-full flex justify-between items-center text-[10px] font-display uppercase tracking-widest text-text-muted mb-2 border-b border-white/5 pb-1 text-left"
              >
                <span>Audits & Reports</span>
                <i className={`fa-solid ${groupsExpanded.audit ? 'fa-chevron-down' : 'fa-chevron-right'} text-[8px]`}></i>
              </button>
              {groupsExpanded.audit && (
                <div className="flex flex-col gap-1 mt-1">
                  {[
                    { id: 'Financial Reports', label: 'Corporate Reports' }
                  ].map((sub, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveSubTab(sub.id)}
                      className={`w-full text-left px-2.5 py-1.5 rounded text-xs font-mono transition-colors ${
                        activeSubTab === sub.id
                          ? 'bg-cyanGlow/10 text-cyanGlow font-bold border-l-2 border-cyanGlow pl-2'
                          : 'text-text-secondary hover:bg-white/2 hover:text-white pl-2'
                      }`}
                    >
                      {sub.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>

        {/* CENTER PANEL - Dynamic Sub-View Details (lg:col-span-6) */}
        <div className="lg:col-span-6 flex flex-col gap-4 min-h-[350px]">
          <div className="glass-card p-5 border border-white/5 rounded-lg bg-gradient-to-b from-glassBg to-black/30 flex-1 flex flex-col gap-4">
            
            {/* View 1: Financial Dashboard */}
            {activeSubTab === 'Financial Dashboard' && (
              <div className="flex flex-col gap-4">
                <h3 className="font-display font-extrabold text-xs uppercase text-white pb-2 border-b border-white/5 tracking-wider">
                  Corporate Finance Dashboard
                </h3>
                <div className="grid grid-cols-2 gap-4 font-mono text-xs">
                  <div className="p-3 bg-black/20 rounded border border-white/5">
                    <span className="text-[9px] text-text-secondary uppercase">Gross Sales Revenue</span>
                    <span className="block font-bold text-greenGlow mt-1">{formatCurrency(monthlyRevenue, startup?.country)}</span>
                  </div>
                  <div className="p-3 bg-black/20 rounded border border-white/5">
                    <span className="text-[9px] text-text-secondary uppercase">Operational Outlays</span>
                    <span className="block font-bold text-red-400 mt-1">{formatCurrency(monthlyExpenses, startup?.country)}</span>
                  </div>
                  <div className="p-3 bg-black/20 rounded border border-white/5">
                    <span className="text-[9px] text-text-secondary uppercase">Operating Profit margin</span>
                    <span className={`block font-bold mt-1 ${netProfitLoss >= 0 ? 'text-greenGlow' : 'text-red-400'}`}>
                      {formatCurrency(netProfitLoss, startup?.country)}
                    </span>
                  </div>
                  <div className="p-3 bg-black/20 rounded border border-white/5">
                    <span className="text-[9px] text-text-secondary uppercase">Workforce Payroll</span>
                    <span className="block font-bold text-white mt-1">{formatCurrency(payrollExpense, startup?.country)}</span>
                  </div>
                  <div className="p-3 bg-black/20 rounded border border-white/5">
                    <span className="text-[9px] text-text-secondary uppercase">Employee Morale</span>
                    <span className="block font-bold text-white mt-1">{morale}%</span>
                  </div>
                  <div className="p-3 bg-black/20 rounded border border-white/5 col-span-2">
                    <span className="text-[9px] text-text-secondary uppercase">Inventory Warehouse Stock Value</span>
                    <span className="block font-bold text-white mt-1">{formatCurrency(inventoryAssetValuation, startup?.country)}</span>
                  </div>
                  <div className="p-3 bg-black/20 rounded border border-white/5">
                    <span className="text-[9px] text-text-secondary uppercase">Total Fixed Assets</span>
                    <span className="block font-bold text-white mt-1">{formatCurrency(startup?.startingCapital || 50000, startup?.country)}</span>
                  </div>
                  <div className="p-3 bg-black/20 rounded border border-white/5">
                    <span className="text-[9px] text-text-secondary uppercase">Current Liquidity Balance</span>
                    <span className="block font-bold text-greenGlow mt-1">{formatCurrency(currentCash, startup?.country)}</span>
                  </div>
                  <div className="p-3 bg-black/20 rounded border border-white/5">
                    <span className="text-[9px] text-text-secondary uppercase">Net Working Capital</span>
                    <span className="block font-bold text-cyanGlow mt-1">{formatCurrency(netWorth, startup?.country)}</span>
                  </div>
                </div>
                
                {/* Simulated Chart Placeholder */}
                <div className="mt-2 p-6 bg-black/45 border border-white/5 rounded-lg flex flex-col justify-center items-center gap-2 h-[120px] text-center border-dashed border-cyanGlow/20">
                  <i className="fa-solid fa-chart-line text-cyanGlow/30 text-2xl animate-pulse"></i>
                  <span className="text-[10px] font-mono text-cyanGlow/50 uppercase tracking-widest">
                    Real-time Balance Flow Analytics Dashboard Coming Soon
                  </span>
                </div>
              </div>
            )}

            {/* View 2: Income Statement */}
            {activeSubTab === 'Income Statement' && (
              <div className="flex flex-col gap-4 font-mono text-xs">
                <h3 className="font-display font-extrabold text-xs uppercase text-white pb-2 border-b border-white/5 tracking-wider">
                  Corporate Income Statement (USD equivalent)
                </h3>
                <div className="flex flex-col gap-3">
                  
                  <div className="flex justify-between items-center text-white font-bold py-1 border-b border-white/10">
                    <span>Revenues</span>
                    <span>{formatCurrency(monthlyRevenue, startup?.country)}</span>
                  </div>
                  <div className="flex justify-between items-center text-text-secondary pl-4">
                    <span>Product Marketplace Sales</span>
                    <span>{formatCurrency(monthlyRevenue, startup?.country)}</span>
                  </div>

                  <div className="flex justify-between items-center text-white font-bold py-1 border-b border-white/10 mt-2">
                    <span>Cost of Goods Sold (COGS)</span>
                    <span className="text-red-400">({formatCurrency(costOfGoodsSold, startup?.country)})</span>
                  </div>
                  <div className="flex justify-between items-center text-text-secondary pl-4">
                    <span>Raw Materials Purchases</span>
                    <span>{formatCurrency(costOfGoodsSold, startup?.country)}</span>
                  </div>

                  <div className="flex justify-between items-center text-greenGlow font-bold py-2 border-t border-b border-white/10 mt-2 bg-greenGlow/5 px-2">
                    <span>Gross Profit / Margin</span>
                    <span>{formatCurrency(monthlyRevenue - costOfGoodsSold, startup?.country)}</span>
                  </div>

                  <div className="flex justify-between items-center text-white font-bold py-1 border-b border-white/10 mt-2">
                    <span>Operating Expenses (OPEX)</span>
                    <span className="text-red-400">({formatCurrency(payrollExpense, startup?.country)})</span>
                  </div>
                  <div className="flex justify-between items-center text-text-secondary pl-4">
                    <span>Personnel Salaries (HR Payroll)</span>
                    <span>{formatCurrency(payrollExpense, startup?.country)}</span>
                  </div>
                  <div className="flex justify-between items-center text-text-secondary pl-4">
                    <span>Corporate Tax Liabilities</span>
                    <span className="text-text-muted italic">Coming Soon</span>
                  </div>

                  <div className={`flex justify-between items-center font-bold py-2 border-t-2 border-white/20 mt-4 px-2 ${netProfitLoss >= 0 ? 'text-greenGlow bg-greenGlow/10' : 'text-red-400 bg-red-950/20'}`}>
                    <span>Net Corporate Income</span>
                    <span>{formatCurrency(netProfitLoss, startup?.country)}</span>
                  </div>

                </div>
              </div>
            )}

            {/* View 3: Balance Sheet */}
            {activeSubTab === 'Balance Sheet' && (
              <div className="flex flex-col gap-4 font-mono text-xs">
                <h3 className="font-display font-extrabold text-xs uppercase text-white pb-2 border-b border-white/5 tracking-wider">
                  Corporate Balance Sheet
                </h3>
                <div className="flex flex-col gap-4">
                  
                  {/* Assets */}
                  <div>
                    <div className="text-[10px] font-display uppercase tracking-widest text-text-muted mb-2 pb-1 border-b border-white/5">
                      Assets
                    </div>
                    <div className="flex flex-col gap-2 pl-3">
                      <div className="flex justify-between items-center">
                        <span className="text-text-secondary">Cash Liquidity reserves</span>
                        <span className="text-white">{formatCurrency(currentCash, startup?.country)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-text-secondary">Inventory holdings valuation</span>
                        <span className="text-white">{formatCurrency(inventoryAssetValuation, startup?.country)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-text-secondary">Fixed Production Infrastructure (Plot 5)</span>
                        <span className="text-white">{formatCurrency(startup?.startingCapital || 50000, startup?.country)}</span>
                      </div>
                      <div className="flex justify-between items-center font-bold text-cyanGlow border-t border-white/10 pt-1.5 mt-1">
                        <span>Total Assets</span>
                        <span>{formatCurrency(netWorth + (startup?.startingCapital || 50000), startup?.country)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Liabilities */}
                  <div>
                    <div className="text-[10px] font-display uppercase tracking-widest text-text-muted mb-2 pb-1 border-b border-white/5">
                      Liabilities
                    </div>
                    <div className="flex flex-col gap-2 pl-3">
                      <div className="flex justify-between items-center">
                        <span className="text-text-secondary">Active Bank Loans</span>
                        <span className="text-white font-bold">{formatCurrency(0, startup?.country)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-text-secondary">Accrued Tax Due</span>
                        <span className="text-text-muted italic">Coming Soon</span>
                      </div>
                      <div className="flex justify-between items-center font-bold text-red-400 border-t border-white/10 pt-1.5 mt-1">
                        <span>Total Liabilities</span>
                        <span>{formatCurrency(0, startup?.country)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Equity */}
                  <div>
                    <div className="text-[10px] font-display uppercase tracking-widest text-text-muted mb-2 pb-1 border-b border-white/5">
                      Shareholders Equity
                    </div>
                    <div className="flex flex-col gap-2 pl-3">
                      <div className="flex justify-between items-center">
                        <span className="text-text-secondary">Share Capital / Starting Capital</span>
                        <span className="text-white">{formatCurrency(startup?.startingCapital || 50000, startup?.country)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-text-secondary">Net Worth Surplus</span>
                        <span className="text-white">{formatCurrency(netWorth, startup?.country)}</span>
                      </div>
                      <div className="flex justify-between items-center font-bold text-white border-t border-white/10 pt-1.5 mt-1">
                        <span>Total Equity</span>
                        <span>{formatCurrency(netWorth + (startup?.startingCapital || 50000), startup?.country)}</span>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            )}

            {/* View 4: Loan Center */}
            {activeSubTab === 'Loan Center' && (
              <div className="flex flex-col gap-4 font-mono text-xs">
                <h3 className="font-display font-extrabold text-xs uppercase text-white pb-2 border-b border-white/5 tracking-wider">
                  Commercial Bank Debt Portal
                </h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-black/25 rounded border border-white/5">
                    <span className="text-[9px] text-text-secondary uppercase block mb-1">Outstanding Loans</span>
                    <span className="font-bold text-white text-sm">{formatCurrency(0, startup?.country)}</span>
                  </div>
                  <div className="p-3 bg-black/25 rounded border border-white/5">
                    <span className="text-[9px] text-text-secondary uppercase block mb-1">Annual Interest Rate</span>
                    <span className="font-bold text-white text-sm">4.5%</span>
                  </div>
                  <div className="p-3 bg-black/25 rounded border border-white/5">
                    <span className="text-[9px] text-text-secondary uppercase block mb-1">Monthly Loan Payment</span>
                    <span className="font-bold text-white text-sm">{formatCurrency(0, startup?.country)}</span>
                  </div>
                  <div className="p-3 bg-black/25 rounded border border-white/5">
                    <span className="text-[9px] text-text-secondary uppercase block mb-1">Available Borrowing Limit</span>
                    <span className="font-bold text-cyanGlow text-sm">{formatCurrency(250000, startup?.country)}</span>
                  </div>
                </div>

                <div className="flex gap-3 mt-2">
                  <button 
                    disabled 
                    className="flex-1 py-2 rounded bg-white/2 border border-white/5 text-text-muted hover:text-white transition-all opacity-50 relative group cursor-not-allowed text-center uppercase tracking-widest font-display text-[10px] font-bold"
                  >
                    <span>Borrow Funds</span>
                    <span className="absolute inset-0 flex items-center justify-center bg-black/95 opacity-0 group-hover:opacity-100 transition-opacity rounded">
                      <span className="text-[8px] font-mono text-cyanGlow uppercase tracking-widest">
                        Future Update
                      </span>
                    </span>
                  </button>
                  <button 
                    disabled 
                    className="flex-1 py-2 rounded bg-white/2 border border-white/5 text-text-muted hover:text-white transition-all opacity-50 relative group cursor-not-allowed text-center uppercase tracking-widest font-display text-[10px] font-bold"
                  >
                    <span>Repay Debt</span>
                    <span className="absolute inset-0 flex items-center justify-center bg-black/95 opacity-0 group-hover:opacity-100 transition-opacity rounded">
                      <span className="text-[8px] font-mono text-cyanGlow uppercase tracking-widest">
                        Future Update
                      </span>
                    </span>
                  </button>
                </div>

                <div className="p-3.5 bg-cyan-950/15 border border-cyanGlow/15 rounded-lg text-cyanGlow flex items-center gap-3 mt-2">
                  <i className="fa-solid fa-circle-info"></i>
                  <span>Debt Financing features will be unlocked in a future application release.</span>
                </div>
              </div>
            )}

            {/* View 5: Tax Center */}
            {activeSubTab === 'Tax Center' && (
              <div className="flex flex-col gap-4 font-mono text-xs">
                <h3 className="font-display font-extrabold text-xs uppercase text-white pb-2 border-b border-white/5 tracking-wider">
                  Corporate Tax Center
                </h3>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-black/25 rounded border border-white/5">
                    <span className="text-[9px] text-text-secondary uppercase block mb-1">Corporate Tax Rate</span>
                    <span className="font-bold text-white text-sm">{(taxRate * 100).toFixed(0)}%</span>
                  </div>
                  <div className="p-3 bg-black/25 rounded border border-white/5">
                    <span className="text-[9px] text-text-secondary uppercase block mb-1">Taxable Profit (This Month)</span>
                    <span className="font-bold text-cyanGlow text-sm">{formatCurrency(taxableProfit, startup?.country)}</span>
                  </div>
                  <div className="p-3 bg-black/25 rounded border border-white/5">
                    <span className="text-[9px] text-text-secondary uppercase block mb-1">Corporate Tax Paid</span>
                    <span className="font-bold text-greenGlow text-sm">{formatCurrency(startup?.financials?.taxExpense || 0, startup?.country)}</span>
                  </div>
                  <div className="p-3 bg-black/25 rounded border border-white/5">
                    <span className="text-[9px] text-text-secondary uppercase block mb-1">Outstanding Tax Liability</span>
                    <span className={`font-bold text-sm ${startup?.outstandingTax > 0 ? 'text-red-400 font-bold' : 'text-white'}`}>
                      {formatCurrency(startup?.outstandingTax || 0, startup?.country)}
                    </span>
                  </div>
                  <div className="p-3 bg-black/25 rounded border border-white/5 col-span-2">
                    <span className="text-[9px] text-text-secondary uppercase block mb-1">Filing & Payment Deadline</span>
                    <span className="font-bold text-white text-sm">{nextTaxDateStr}</span>
                  </div>
                </div>

                <div className="p-3.5 bg-cyan-950/15 border border-cyanGlow/15 rounded-lg text-cyanGlow flex items-center gap-3 mt-2">
                  <i className="fa-solid fa-circle-info"></i>
                  <span>Taxes are calculated based on closed-month taxable profits. Outstanding balances must accumulate and reduce automatically as payments are made.</span>
                </div>
              </div>
            )}

            {/* View 6: Payroll Summary */}
            {activeSubTab === 'Payroll Summary' && (
              <div className="flex flex-col gap-4 font-mono text-xs">
                <h3 className="font-display font-extrabold text-xs uppercase text-white pb-2 border-b border-white/5 tracking-wider">
                  Personnel Payroll Ledger
                </h3>

                {/* Section A: Projected commitments */}
                <div className="text-[10px] font-display uppercase tracking-widest text-text-muted mb-1 font-sans">
                  Workforce Projections (Current Commitment)
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-black/25 rounded border border-white/5">
                    <span className="text-[9px] text-text-secondary uppercase block mb-1">Hired Employees</span>
                    <span className="font-bold text-white text-sm">{totalEmployees} personnel</span>
                  </div>
                  <div className="p-3 bg-black/25 rounded border border-white/5">
                    <span className="text-[9px] text-text-secondary uppercase block mb-1">Projected Monthly Outflow</span>
                    <span className="font-bold text-amber-500 text-sm">{formatCurrency(monthlyPayrollOutflow, startup?.country)}</span>
                  </div>
                  <div className="p-3 bg-black/25 rounded border border-white/5">
                    <span className="text-[9px] text-text-secondary uppercase block mb-1">Projected Annual Commitment</span>
                    <span className="font-bold text-white text-sm">{formatCurrency(annualPayrollProjection, startup?.country)}</span>
                  </div>
                  <div className="p-3 bg-black/25 rounded border border-white/5">
                    <span className="text-[9px] text-text-secondary uppercase block mb-1">Payroll Pct of Revenue</span>
                    <span className="font-bold text-white text-sm">{payrollRevenuePct}</span>
                  </div>
                  <div className="p-3 bg-black/25 rounded border border-white/5 col-span-2">
                    <span className="text-[9px] text-text-secondary uppercase block mb-1">Projected Average Salary</span>
                    <span className="font-bold text-cyanGlow text-sm">{formatCurrency(averageSalaryPerEmployee, startup?.country)}/month</span>
                  </div>
                </div>

                {/* Section B: Executed history */}
                <div className="text-[10px] font-display uppercase tracking-widest text-text-muted mt-2 mb-1 font-sans">
                  Executed Payroll History (Financial Accounts)
                </div>
                {startup?.recentPayroll ? (
                  <div className={`p-4 rounded border ${
                    startup.recentPayroll.status === 'Success'
                      ? 'bg-green-950/15 border-green-500/20 text-greenGlow'
                      : 'bg-red-950/15 border-red-500/20 text-red-400'
                  }`}>
                    <div className="flex justify-between items-center font-bold text-xs uppercase mb-2">
                      <span>{startup.recentPayroll.status === 'Success' ? 'Monthly Payroll Completed' : 'Payroll Failed'}</span>
                      <span className="text-[9px] font-mono opacity-80">{startup.recentPayroll.month}</span>
                    </div>
                    <div className="flex flex-col gap-1.5 font-mono text-[10.5px] text-text-secondary">
                      <div className="flex justify-between">
                        <span>Employees Paid:</span>
                        <span className="text-white font-bold">{startup.recentPayroll.employeesPaid}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Paid Salaries Amount:</span>
                        <span className="text-white font-bold">{formatCurrency(startup.recentPayroll.amount, startup?.country)}</span>
                      </div>
                      <div className="flex justify-between border-t border-white/5 pt-1.5 mt-1">
                        <span>Cash Balance Remaining:</span>
                        <span className="text-white font-bold">{formatCurrency(startup.recentPayroll.cashRemaining, startup?.country)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Payroll Processed Date:</span>
                        <span className="text-white font-bold">
                          {startup.recentPayroll.date ? new Date(startup.recentPayroll.date).toLocaleDateString() : 'N/A'}
                        </span>
                      </div>
                      {startup.recentPayroll.status === 'Failed' && (
                        <div className="mt-2 text-red-400 font-sans italic text-[9.5px]">
                          Reason: Insufficient company funds. Employee morale decreased.
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-black/20 border border-white/5 rounded text-center text-text-muted italic text-xs">
                    No payroll operations executed yet.
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 mt-2">
                  <div className="p-3 bg-black/25 rounded border border-white/5">
                    <span className="text-[9px] text-text-secondary uppercase block mb-1">Total Executed Expense</span>
                    <span className="font-bold text-greenGlow text-sm">{formatCurrency(payrollExpense, startup?.country)}</span>
                  </div>
                  <div className="p-3 bg-black/25 rounded border border-white/5">
                    <span className="text-[9px] text-text-secondary uppercase block mb-1">Last Paid Amount</span>
                    <span className="font-bold text-white text-sm">
                      {startup?.recentPayroll ? formatCurrency(startup.recentPayroll.amount, startup?.country) : 'N/A'}
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-black/20 border border-white/5 rounded text-[10px] text-text-secondary leading-relaxed mt-2">
                  Monthly payroll commitments are determined dynamically by your active team size. Payout checks run automatically once per virtual month.
                </div>
              </div>
            )}

            {/* View 7: Financial Reports */}
            {activeSubTab === 'Financial Reports' && (
              <div className="flex flex-col gap-4 font-mono text-xs">
                <h3 className="font-display font-extrabold text-xs uppercase text-white pb-2 border-b border-white/5 tracking-wider">
                  Corporate Audit Statements
                </h3>

                <div className="grid grid-cols-2 gap-3.5">
                  {[
                    { name: 'Quarterly Report', desc: 'Publish Q1 strategic summary.' },
                    { name: 'Annual Statement', desc: 'Export audited annual spreadsheet.' },
                    { name: 'Investor Ledger', desc: 'Prepare equity distribution sheet.' },
                    { name: 'Audit Certification', desc: 'Verify regulatory transaction records.' }
                  ].map((report, idx) => (
                    <button
                      key={idx}
                      disabled
                      className="p-3 bg-white/2 border border-white/5 rounded text-left flex flex-col gap-1 relative group cursor-not-allowed opacity-50"
                    >
                      <span className="font-display font-bold text-xs text-white uppercase tracking-wider">{report.name}</span>
                      <span className="text-[9px] text-text-secondary font-mono">{report.desc}</span>
                      <span className="absolute inset-0 flex items-center justify-center bg-black/90 opacity-0 group-hover:opacity-100 transition-opacity rounded">
                        <span className="text-[8px] font-mono text-cyanGlow uppercase tracking-widest font-sans">
                          Future Update
                        </span>
                      </span>
                    </button>
                  ))}
                </div>

                <button 
                  disabled 
                  className="w-full py-2 bg-gradient-to-r from-cyanGlow/20 to-cyanGlow/5 border border-cyanGlow/20 text-cyanGlow font-display font-extrabold uppercase tracking-widest rounded transition-all opacity-50 relative group cursor-not-allowed text-center text-xs mt-2"
                >
                  <span>Export Financial PDF</span>
                  <span className="absolute inset-0 flex items-center justify-center bg-black/95 opacity-0 group-hover:opacity-100 transition-opacity rounded">
                    <span className="text-[8px] font-mono text-cyanGlow uppercase tracking-widest font-sans">
                      Future Update
                    </span>
                  </span>
                </button>
              </div>
            )}

          </div>
        </div>

        {/* RIGHT PANEL (lg:col-span-4) */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          
          {/* Card 1: Cash Flow */}
          <div className="glass-card p-5 border border-white/5 rounded-lg bg-gradient-to-b from-glassBg to-black/35 font-mono text-xs">
            <div className="text-[10px] font-display uppercase tracking-widest text-text-muted mb-3 font-sans">
              Cash Flow Analysis
            </div>
            <div className="flex flex-col gap-2.5">
              <div className="flex justify-between items-center">
                <span className="text-text-secondary">Current Balance</span>
                <span className="text-greenGlow font-bold">{formatCurrency(currentCash, startup?.country)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-text-secondary">Cash Inflow (Sales)</span>
                <span className="text-emerald-400">{formatCurrency(cashIn, startup?.country)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-text-secondary">Cash Outflow (OPEX/COGS)</span>
                <span className="text-red-400">({formatCurrency(cashOut, startup?.country)})</span>
              </div>
              <div className="flex justify-between items-center border-t border-white/10 pt-2 mt-1">
                <span className="text-text-secondary">Largest Income</span>
                <span className="text-white font-bold">{formatCurrency(maxIncomeAmt, startup?.country)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-text-secondary">Largest Expense</span>
                <span className="text-white font-bold">({formatCurrency(maxExpenseAmt, startup?.country)})</span>
              </div>
            </div>
          </div>

          {/* Card 2: Financial Alerts */}
          <div className="glass-card p-5 border border-white/5 rounded-lg bg-gradient-to-b from-glassBg to-black/35 font-mono text-xs">
            <div className="text-[10px] font-display uppercase tracking-widest text-text-muted mb-3 font-sans">
              Corporate Financial Alerts
            </div>
            <div className="flex flex-col gap-2">
              {alerts.map((alt, idx) => (
                <div key={idx} className="p-3.5 bg-black/25 rounded border border-white/5 flex items-center gap-3">
                  <i className={`fa-solid ${alt.icon} text-xs`}></i>
                  <span className="text-text-secondary text-[10.5px] leading-normal">{alt.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Card 3: Financial News & Broadcasts */}
          <div className="glass-card p-5 border border-white/5 rounded-lg bg-gradient-to-b from-glassBg to-black/35 font-mono text-xs flex flex-col gap-3">
            <div className="text-[10px] font-display uppercase tracking-widest text-text-muted flex justify-between items-center font-sans">
              <span>Financial Broadcast Ticker</span>
              <span className="w-1.5 h-1.5 rounded-full bg-cyanGlow animate-ping"></span>
            </div>
            <div className="p-3 bg-black/30 border border-white/5 rounded-lg flex flex-col gap-1 font-mono text-[10px] text-text-secondary h-[80px] justify-center relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-[5px] bg-gradient-to-b from-black/15 to-transparent"></div>
              <div className="flex gap-2.5 items-start text-cyanGlow transition-opacity duration-500">
                <i className="fa-solid fa-satellite-dish text-xs shrink-0 mt-0.5 animate-pulse"></i>
                <span className="leading-relaxed">{headlines[newsHeadlineIdx]}</span>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
