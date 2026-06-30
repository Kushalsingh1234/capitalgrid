import React from 'react';

const CURRENCY_SYMBOLS = {
  'India': '₹',
  'United States': '$',
  'United Kingdom': '£',
  'Germany': '€',
  'Japan': '¥',
  'Brazil': 'R$',
  'Australia': 'A$'
};

const COUNTRY_FLAGS = {
  'India': '🇮🇳',
  'United States': '🇺🇸',
  'United Kingdom': '🇬🇧',
  'Germany': '🇩🇪',
  'Japan': '🇯🇵',
  'Brazil': '🇧🇷',
  'Australia': '🇦🇺'
};

const formatCurrency = (amount, countryName) => {
  const symbol = CURRENCY_SYMBOLS[countryName] || '$';
  return `${symbol}${amount?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export default function DashboardDrawer({ 
  activeTab, 
  isOpen, 
  onClose, 
  startup, 
  inventory = [], 
  transactions = [], 
  employees = [] 
}) {
  if (!isOpen) return null;

  // Render company logo
  const renderLogo = (logoStr) => {
    if (!logoStr) {
      return (
        <div className="w-full h-full flex items-center justify-center text-cyanGlow/40">
          <i className="fa-solid fa-building text-3xl"></i>
        </div>
      );
    }
    if (logoStr.trim().startsWith('<svg') || logoStr.trim().startsWith('<img')) {
      return <div className="w-full h-full flex items-center justify-center" dangerouslySetInnerHTML={{ __html: logoStr }} />;
    }
    return (
      <img
        src={logoStr}
        alt="Corporate Logo"
        className="w-full h-full object-contain rounded"
        onError={(e) => { e.target.onerror = null; e.target.src = '/assets/logo.svg'; }}
      />
    );
  };

  // Helper calculations for Net Worth & Valuation
  const totalInventoryQuantity = inventory.reduce((sum, item) => sum + item.quantity, 0);
  const inventoryAssetValuation = totalInventoryQuantity * 250; // Estimated value per unit
  const currentCash = startup?.currentBalance || 0;
  const netWorth = currentCash + inventoryAssetValuation;
  
  const totalEmployees = employees.reduce((sum, e) => sum + e.quantity, 0);
  const monthlyPayroll = employees.reduce((sum, e) => sum + (e.quantity * e.salary), 0);
  const companyValuation = (startup?.startingCapital || 50000) + currentCash + (totalEmployees * 5000) + (inventoryAssetValuation * 1.5);

  const renderContent = () => {
    switch (activeTab) {
      case 'Dashboard':
        return (
          <div className="flex flex-col gap-6 text-sm">
            {/* Brand Card */}
            <div className="p-5 bg-white/2 border border-white/5 rounded-lg flex items-center gap-4 bg-gradient-to-b from-glassBg to-black/30">
              <div className="w-16 h-16 p-2 rounded-lg bg-black/40 border border-white/10 flex items-center justify-center">
                {renderLogo(startup?.logo)}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-display font-extrabold text-base uppercase text-white truncate">
                  {startup?.startupName}
                </h3>
                <p className="text-[10px] text-cyanGlow font-mono mt-0.5 uppercase tracking-wider">
                  ID: {startup?.startupId}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-[9px] font-display text-greenGlow uppercase tracking-widest px-1.5 py-0.5 bg-green-950/20 border border-green-500/20 rounded flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-greenGlow animate-pulse"></span>
                    {startup?.status}
                  </span>
                </div>
              </div>
            </div>

            {/* Financial Ledger Section */}
            <div>
              <div className="text-[10px] font-display uppercase tracking-widest text-text-muted mb-3">
                Financial Ledger
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-black/30 border border-white/5 rounded-lg">
                  <span className="text-[9px] font-display uppercase tracking-widest text-text-muted">Current Balance</span>
                  <span className="block font-display font-bold text-greenGlow text-sm mt-1">
                    {formatCurrency(currentCash, startup?.country)}
                  </span>
                </div>
                <div className="p-3 bg-black/30 border border-white/5 rounded-lg">
                  <span className="text-[9px] font-display uppercase tracking-widest text-text-muted">Calculated Valuation</span>
                  <span className="block font-display font-bold text-cyanGlow text-sm mt-1">
                    {formatCurrency(companyValuation, startup?.country)}
                  </span>
                </div>
                <div className="p-3 bg-black/30 border border-white/5 rounded-lg">
                  <span className="text-[9px] font-display uppercase tracking-widest text-text-muted">Inventory Assets</span>
                  <span className="block font-display font-bold text-white text-sm mt-1">
                    {formatCurrency(inventoryAssetValuation, startup?.country)}
                  </span>
                </div>
                <div className="p-3 bg-black/30 border border-white/5 rounded-lg">
                  <span className="text-[9px] font-display uppercase tracking-widest text-text-muted">Net Corporate Worth</span>
                  <span className="block font-display font-bold text-white text-sm mt-1">
                    {formatCurrency(netWorth, startup?.country)}
                  </span>
                </div>
              </div>
            </div>

            {/* Organization Stats */}
            <div>
              <div className="text-[10px] font-display uppercase tracking-widest text-text-muted mb-3">
                Operations & Workforce
              </div>
              <div className="p-4 bg-black/30 border border-white/5 rounded-lg flex flex-col gap-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-text-secondary">Headquarters</span>
                  <span className="text-white font-bold flex items-center gap-1.5">
                    <span>{COUNTRY_FLAGS[startup?.country] || '🌐'}</span>
                    <span>{startup?.country}</span>
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-text-secondary">Industry Sector</span>
                  <span className="text-white font-bold uppercase">{startup?.industry}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-text-secondary">Business Type</span>
                  <span className="text-cyanGlow font-bold uppercase">{startup?.businessType}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-text-secondary">Active Employee Count</span>
                  <span className="text-white font-bold">{totalEmployees}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-text-secondary">Monthly Payroll Budget</span>
                  <span className="text-red-400 font-bold">{formatCurrency(monthlyPayroll, startup?.country)}/mo</span>
                </div>
              </div>
            </div>

            {/* Recent Corporate Activity Log */}
            <div>
              <div className="text-[10px] font-display uppercase tracking-widest text-text-muted mb-3">
                Recent Corporate Activity
              </div>
              <div className="flex flex-col gap-2 max-h-[180px] overflow-y-auto pr-1">
                {transactions.length > 0 ? (
                  transactions.slice(0, 5).map((tx, idx) => (
                    <div key={idx} className="p-2.5 bg-black/20 border border-white/5 rounded flex justify-between items-center text-[11px]">
                      <div className="flex items-center gap-2">
                        <i className={`fa-solid ${
                          tx.transactionType === 'Sale' ? 'fa-store text-greenGlow' :
                          tx.transactionType === 'Purchase' ? 'fa-cart-shopping text-red-400' :
                          'fa-gears text-cyanGlow'
                        }`}></i>
                        <span className="text-text-secondary">
                          {tx.transactionType === 'Sale' ? `Sold ${tx.quantity} units to client` :
                           tx.transactionType === 'Purchase' ? `Purchased ${tx.quantity} units` :
                           `Processed batch of ${tx.quantity}`}
                        </span>
                      </div>
                      <span className={`font-bold ${tx.transactionType === 'Sale' ? 'text-greenGlow' : 'text-red-400'}`}>
                        {tx.transactionType === 'Sale' ? '+' : '-'}{formatCurrency(tx.totalAmount, startup?.country)}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="p-4 bg-black/20 border border-white/5 rounded text-center text-xs text-text-muted font-mono">
                    No active transaction signatures detected
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      case 'Company':
        return (
          <div className="flex flex-col items-center justify-center text-center h-[350px] gap-4">
            <div className="w-12 h-12 rounded-full border border-cyanGlow/30 bg-cyanGlow/10 flex items-center justify-center text-cyanGlow text-lg">
              <i className="fa-solid fa-network-wired"></i>
            </div>
            <div>
              <h4 className="font-display font-black text-sm uppercase tracking-widest text-white">Company Facility Node</h4>
              <p className="text-xs text-text-muted mt-2 max-w-[240px] leading-relaxed">
                Building management, asset upgrading, raw material logs, and warehouse expansion modules are scheduled for Phase B.
              </p>
            </div>
          </div>
        );

      case 'Employees':
        return (
          <div className="flex flex-col items-center justify-center text-center h-[350px] gap-4">
            <div className="w-12 h-12 rounded-full border border-cyanGlow/30 bg-cyanGlow/10 flex items-center justify-center text-cyanGlow text-lg">
              <i className="fa-solid fa-users-gear"></i>
            </div>
            <div>
              <h4 className="font-display font-black text-sm uppercase tracking-widest text-white">Workforce Management</h4>
              <p className="text-xs text-text-muted mt-2 max-w-[240px] leading-relaxed">
                Staff hiring channels, payroll cost adjustments, productivity multipliers, and specialized roles management are scheduled for Phase B.
              </p>
            </div>
          </div>
        );

      case 'Marketplace':
        return (
          <div className="flex flex-col items-center justify-center text-center h-[350px] gap-4">
            <div className="w-12 h-12 rounded-full border border-cyanGlow/30 bg-cyanGlow/10 flex items-center justify-center text-cyanGlow text-lg">
              <i className="fa-solid fa-comments-dollar"></i>
            </div>
            <div>
              <h4 className="font-display font-black text-sm uppercase tracking-widest text-white">Logistics & Trade</h4>
              <p className="text-xs text-text-muted mt-2 max-w-[240px] leading-relaxed">
                Open market trading lists, automated contract negotiation, shipping logs, and cross-border tariff charts are scheduled for Phase B.
              </p>
            </div>
          </div>
        );

      case 'Finance':
        return (
          <div className="flex flex-col items-center justify-center text-center h-[350px] gap-4">
            <div className="w-12 h-12 rounded-full border border-cyanGlow/30 bg-cyanGlow/10 flex items-center justify-center text-cyanGlow text-lg">
              <i className="fa-solid fa-scale-balanced"></i>
            </div>
            <div>
              <h4 className="font-display font-black text-sm uppercase tracking-widest text-white">Treasury & Audits</h4>
              <p className="text-xs text-text-muted mt-2 max-w-[240px] leading-relaxed">
                Company ledger sheets, tax rates, corporate credit lines, and cash flow reports are scheduled for Phase B.
              </p>
            </div>
          </div>
        );

      case 'Profile':
        return (
          <div className="flex flex-col items-center justify-center text-center h-[350px] gap-4">
            <div className="w-12 h-12 rounded-full border border-cyanGlow/30 bg-cyanGlow/10 flex items-center justify-center text-cyanGlow text-lg">
              <i className="fa-solid fa-id-card-clip"></i>
            </div>
            <div>
              <h4 className="font-display font-black text-sm uppercase tracking-widest text-white">Founder Identity</h4>
              <p className="text-xs text-text-muted mt-2 max-w-[240px] leading-relaxed">
                Player achievements, custom corporate avatars, board directorships, and server configuration nodes are scheduled for Phase B.
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="absolute top-0 right-0 h-full w-[360px] max-w-full z-20 flex transition-transform duration-300 transform translate-x-0 shadow-2xl">
      {/* Slide-out Background Board Panel */}
      <div className="w-full h-full glass-card border-l border-white/5 p-6 flex flex-col justify-start overflow-y-auto bg-gradient-to-b from-glassBg to-black/90">
        
        {/* Drawer Header */}
        <div className="flex justify-between items-center mb-6 pb-3 border-b border-white/5">
          <div className="flex items-center gap-2 text-cyanGlow">
            <i className={`fa-solid ${
              activeTab === 'Dashboard' ? 'fa-chart-pie' :
              activeTab === 'Company' ? 'fa-building' :
              activeTab === 'Employees' ? 'fa-user-gear' :
              activeTab === 'Marketplace' ? 'fa-shop' :
              activeTab === 'Finance' ? 'fa-wallet' :
              'fa-user'
            }`}></i>
            <span className="font-display font-extrabold text-xs uppercase tracking-widest">
              {activeTab} Panel
            </span>
          </div>
          <button 
            onClick={onClose}
            className="w-6 h-6 border border-white/5 hover:border-white/20 rounded flex items-center justify-center text-text-muted hover:text-white transition-colors"
          >
            <i className="fa-solid fa-xmark text-xs"></i>
          </button>
        </div>

        {/* Drawer Content */}
        <div className="flex-1">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}
