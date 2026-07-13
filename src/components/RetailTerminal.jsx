import React, { useState, useEffect } from 'react';
import * as retailService from '../services/retailService';

const BASE_DEMAND = {
  'Clothing Store': {
    'shirts': { name: 'Shirts', base: 180, icon: 'fa-solid fa-shirt' },
    'jeans': { name: 'Jeans', base: 160, icon: 'fa-solid fa-scissors' },
    'jackets': { name: 'Jackets', base: 90, icon: 'fa-solid fa-vest-patches' }
  },
  'Electronics Store': {
    'tvs': { name: 'TVs', base: 65, icon: 'fa-solid fa-tv' },
    'laptops': { name: 'Laptops', base: 90, icon: 'fa-solid fa-laptop' },
    'phones': { name: 'Phones', base: 170, icon: 'fa-solid fa-mobile-screen-button' }
  },
  'Restaurant': {
    'bread': { name: 'Bread', base: 280, icon: 'fa-solid fa-bread-slice' },
    'biscuits': { name: 'Biscuits', base: 200, icon: 'fa-solid fa-cookie' },
    'cheese': { name: 'Cheese', base: 140, icon: 'fa-solid fa-cheese' }
  },
  'Car Showroom': {
    'cars': { name: 'Cars', base: 25, icon: 'fa-solid fa-car-side' }
  }
};

const BASE_DURATION = {
  'Clothing Store': 3600,
  'Electronics Store': 7200,
  'Restaurant': 1800,
  'Car Showroom': 14400
};

const CURRENCY_SYMBOLS = {
  'India': '₹',
  'United States': '$',
  'United Kingdom': '£',
  'Germany': '€',
  'Japan': '¥',
  'Brazil': 'R$',
  'Australia': 'A$'
};

export default function RetailTerminal({ startup: initialStartup, employees = [], token, onClose, onRetailAction }) {
  const [startup, setStartup] = useState(initialStartup);
  const [activeTab, setActiveTab] = useState('overview');
  const [isTabDropdownOpen, setIsTabDropdownOpen] = useState(false);
  const [retailInventory, setRetailInventory] = useState(initialStartup?.retailInventory || []);
  const [retailState, setRetailState] = useState(initialStartup?.retailState || {});
  
  // Local price registry overrides (Selling Price)
  const [localPrices, setLocalPrices] = useState({});
  // Local Quantity Selected overrides (Quantity Selected to put on sale)
  const [selectedQuantities, setSelectedQuantities] = useState({});

  const [actionInProgress, setActionInProgress] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [showCompletionSummary, setShowCompletionSummary] = useState(null);

  // Pricing Simulator State
  const [selectedSimProductId, setSelectedSimProductId] = useState('');
  const [simPrice, setSimPrice] = useState(0);

  if (!startup) {
    return (
      <div className="absolute inset-0 bg-gameBg z-30 flex items-center justify-center text-white font-body">
        <div className="text-center relative z-10">
          <div className="w-10 h-10 border-4 border-t-cyanGlow border-r-cyanGlow/40 border-b-cyanGlow/10 border-l-cyanGlow/20 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-xs text-text-secondary">Loading Retail Systems...</p>
        </div>
      </div>
    );
  }

  const formatCurrency = (amount) => {
    const symbol = CURRENCY_SYMBOLS[startup.country] || '$';
    return `${symbol}${Math.round(amount || 0).toLocaleString()}`;
  };

  const formatDurationStr = (seconds) => {
    if (!seconds || seconds <= 0) return '0s';
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    const parts = [];
    if (hrs > 0) parts.push(`${hrs}h`);
    if (mins > 0) parts.push(`${mins}m`);
    if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);
    
    return parts.join(' ');
  };

  const [timeRemaining, setTimeRemaining] = useState(0);

  useEffect(() => {
    setStartup(initialStartup);
    setRetailInventory(initialStartup?.retailInventory || []);
    setRetailState(initialStartup?.retailState || {});
  }, [initialStartup]);

  // Sync initial pricing and quantity limits
  useEffect(() => {
    if (initialStartup?.retailInventory) {
      const initialPrices = {};
      initialStartup.retailInventory.forEach(item => {
        initialPrices[item.productId] = item.sellingPrice;
      });
      setLocalPrices(initialPrices);
    }
  }, [initialStartup?.retailInventory]);

  // Sync timer countdown
  useEffect(() => {
    if (retailState.activeCycle?.status === 'Running' && retailState.activeCycle.endTime) {
      const timer = setInterval(async () => {
        const remaining = Math.max(0, Math.ceil((new Date(retailState.activeCycle.endTime).getTime() - Date.now()) / 1000));
        setTimeRemaining(remaining);
        
        if (remaining <= 0) {
          clearInterval(timer);
          setActionInProgress(true);
          try {
            const res = await retailService.completeSalesCycle(token);
            if (res.success && res.startup) {
              setStartup(res.startup);
              setRetailInventory(res.startup.retailInventory);
              setRetailState(res.startup.retailState);
              
              const lastHistory = res.startup.retailState.history?.[0] || null;
              if (lastHistory) {
                setShowCompletionSummary(lastHistory);
              }
              if (onRetailAction) onRetailAction();
            }
          } catch (err) {
            console.error(err);
          } finally {
            setActionInProgress(false);
          }
        }
      }, 1000);
      return () => clearInterval(timer);
    } else {
      setTimeRemaining(0);
    }
  }, [retailState.activeCycle, token]);

  const handleStartCycle = async () => {
    setActionInProgress(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = await retailService.startSalesCycle(selectedQuantities, token);
      if (res.success && res.startup) {
        setStartup(res.startup);
        setRetailInventory(res.startup.retailInventory);
        setRetailState(res.startup.retailState);
        setSuccessMsg('Sales cycle started successfully.');
        // Reset selected quantities to 0 for next input cycle
        setSelectedQuantities({});
        if (onRetailAction) onRetailAction();
      } else {
        setErrorMsg(res.message || 'Failed to start cycle.');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to start cycle.');
    } finally {
      setActionInProgress(false);
    }
  };

  const handleStopCycle = async () => {
    setActionInProgress(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = await retailService.stopSalesCycle(token);
      if (res.success && res.startup) {
        setStartup(res.startup);
        setRetailInventory(res.startup.retailInventory);
        setRetailState(res.startup.retailState);
        setSuccessMsg('Sales cycle aborted.');
        if (onRetailAction) onRetailAction();
      } else {
        setErrorMsg(res.message || 'Failed to stop cycle.');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to stop cycle.');
    } finally {
      setActionInProgress(false);
    }
  };

  const handlePriceChange = async (productId, newPrice) => {
    const val = parseFloat(newPrice) || 0;
    setLocalPrices(prev => ({ ...prev, [productId]: val }));
    try {
      const res = await retailService.updatePricing(productId, val, token);
      if (res.success && res.retailInventory) {
        setRetailInventory(res.retailInventory);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleQtyChange = (productId, val, maxVal) => {
    const qty = Math.max(0, Math.min(maxVal, parseInt(val) || 0));
    setSelectedQuantities(prev => ({ ...prev, [productId]: qty }));
  };

  // Computes active price ratio demand & duration projections
  const calculateProjections = () => {
    const demands = BASE_DEMAND[startup.businessType] || {};
    const baseCycleDuration = BASE_DURATION[startup.businessType] || 3600;

    let totalCustomers = 0;
    let totalUnitsSold = 0;
    let totalRevenue = 0;
    let totalCost = 0;
    let totalDuration = 0;

    const productsDetails = [];

    Object.entries(demands).forEach(([pId, config]) => {
      const pricingObj = retailInventory.find(i => i.productId === pId) || {};
      const basePrice = pricingObj.basePrice || 100;
      const sellingPrice = localPrices[pId] !== undefined ? localPrices[pId] : (pricingObj.sellingPrice || basePrice);

      // V1 pricing elasticity: 1 / (sellingPrice / (basePrice * 1.08)) ^ 2
      const marketAveragePrice = basePrice * 1.08;
      const priceRatio = marketAveragePrice > 0 ? (sellingPrice / marketAveragePrice) : 1;
      let priceModifier = 1.0;
      if (priceRatio > 0) {
        priceModifier = 1 / Math.pow(priceRatio, 2);
      }
      priceModifier = Math.max(0.001, Math.min(3.0, priceModifier || 1.0));
      const expectedCustomers = Math.ceil(config.base * priceModifier);

      // Read stock directly from Player Inventory
      const whItem = (startup.inventory || []).find(i => i.productId === pId);
      const availableStock = whItem ? whItem.quantity : 0;

      // Quantity selected (either local input override or running cycle quantity)
      let quantitySelected = 0;
      if (isRunning) {
        quantitySelected = retailState.activeCycle?.lockedQuantities?.[pId] || 0;
      } else {
        quantitySelected = selectedQuantities[pId] !== undefined ? selectedQuantities[pId] : 0;
      }
      quantitySelected = parseInt(quantitySelected, 10);
      if (isNaN(quantitySelected) || quantitySelected < 0) {
        quantitySelected = 0;
      }

      // Expected units sold = min(quantitySelected, expectedCustomers)
      const unitsSold = isRunning 
        ? (retailState.activeCycle?.expectedSales?.[pId] || 0)
        : Math.min(quantitySelected, expectedCustomers);

      const revenue = unitsSold * sellingPrice;
      const avgPurchaseCost = pricingObj.avgPurchaseCost !== undefined ? pricingObj.avgPurchaseCost : Math.round(basePrice * 0.75);
      const cost = unitsSold * avgPurchaseCost;
      const profit = revenue - cost;

      // Dynamic duration = Base Duration * (Quantity Selected / Base Demand) * Price Ratio
      let duration = 0;
      if (quantitySelected > 0) {
        duration = Math.round(baseCycleDuration * (quantitySelected / config.base) * priceRatio);
        duration = Math.max(10, Math.min(28800, duration)); // Clamp duration bounds
      }

      totalCustomers += expectedCustomers;
      totalUnitsSold += unitsSold;
      totalRevenue += revenue;
      totalCost += cost;

      totalDuration += duration;

      productsDetails.push({
        productId: pId,
        productName: config.name,
        icon: config.icon,
        availableStock,
        avgPurchaseCost,
        sellingPrice,
        basePrice,
        expectedCustomers,
        quantitySelected,
        expectedUnitsSold: unitsSold,
        duration,
        expectedRevenue: revenue,
        expectedProfit: profit
      });
    });

    const totalProfit = totalRevenue - totalCost;
    const cycleDuration = isRunning ? (retailState.activeCycle?.duration || 0) : totalDuration;

    const totalSelectedQty = productsDetails.reduce((sum, item) => sum + item.quantitySelected, 0);
    const maxCapacity = (startup.level || 1) * 1000;
    const labourersNeeded = totalSelectedQty > 0 ? Math.ceil(totalSelectedQty / (maxCapacity * 0.1)) : 0;
    const managersNeeded = totalSelectedQty > 0 ? 1 : 0;

    const hiredManagers = (employees || []).find(e => e.employeeType === 'Manager')?.quantity || 0;
    const hiredLabourers = (employees || []).find(e => e.employeeType === 'Labourer')?.quantity || 0;

    const hasEnoughWorkforce = hiredManagers >= managersNeeded && hiredLabourers >= labourersNeeded;

    return {
      totalCustomers: isRunning ? (retailState.activeCycle?.expectedCustomers || 0) : totalCustomers,
      totalUnitsSold,
      totalRevenue: isRunning ? (retailState.activeCycle?.expectedRevenue || 0) : totalRevenue,
      totalCost,
      totalProfit: isRunning ? (retailState.activeCycle?.expectedProfit || 0) : totalProfit,
      cycleDuration,
      productsDetails,
      totalSelectedQty,
      managersNeeded,
      labourersNeeded,
      hasEnoughWorkforce,
      hiredManagers,
      hiredLabourers
    };
  };

  const isRunning = retailState.activeCycle?.status === 'Running';
  const projections = calculateProjections();
  const reputationPercent = Math.round((retailState.reputation || 0.82) * 100);

  // Capacity calculations
  const eligibleIds = Object.keys(BASE_DEMAND[startup.businessType] || {});
  const totalStocked = (startup.inventory || [])
    .filter(i => eligibleIds.includes(i.productId))
    .reduce((sum, item) => sum + item.quantity, 0);

  const storeCapacityLimit = (startup.level || 1) * 1000;
  const storeCapacityPercent = Math.min(100, Math.round((totalStocked / storeCapacityLimit) * 100));

  const historyEntries = retailState.history || [];
  const todayRevenue = historyEntries.reduce((sum, h) => sum + h.revenue, 0);
  const todayProfit = historyEntries.reduce((sum, h) => sum + h.profit, 0);

  return (
    <div className="absolute inset-0 bg-gameBg z-30 overflow-y-auto font-body p-6 flex flex-col gap-6 select-text text-white">
      {/* Background patterns */}
      <div className="grid-overlay opacity-25"></div>
      <div className="glow-radial-overlay opacity-20"></div>

      {/* Corporate Header HUD */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 relative z-10 font-sans pr-12 lg:pr-0">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-display font-black uppercase tracking-wider text-white">
              {startup.startupName}
            </h1>
            <span className="px-2 py-0.5 border border-cyanGlow/35 bg-cyan-950/20 text-cyanGlow text-[10px] font-mono rounded uppercase tracking-wider">
              Level {startup.level || 1}
            </span>
          </div>
          <p className="text-xs text-text-secondary mt-0.5">
            {startup.businessType} Management Terminal &bull; {startup.country}
          </p>
        </div>

        <div className="flex items-center gap-3 w-full lg:w-auto">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-3.5 bg-black/40 border border-white/5 rounded-lg w-full lg:w-auto font-mono text-xs">
            <div>
              <span className="text-[10px] text-text-muted uppercase tracking-wider block">Status</span>
              <span className="text-greenGlow font-bold uppercase mt-0.5 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-greenGlow animate-pulse"></span>
                Open
              </span>
            </div>
            <div className="border-l border-white/5 pl-4">
              <span className="text-[10px] text-text-muted uppercase tracking-wider block">Reputation</span>
              <span className="text-cyanGlow font-bold mt-0.5">{reputationPercent}%</span>
            </div>
            <div className="border-l border-white/5 pl-4">
              <span className="text-[10px] text-text-muted uppercase tracking-wider block">Today's Revenue</span>
              <span className="text-white font-bold mt-0.5">{formatCurrency(todayRevenue)}</span>
            </div>
            <div className="border-l border-white/5 pl-4">
              <span className="text-[10px] text-text-muted uppercase tracking-wider block">Today's Profit</span>
              <span className="text-greenGlow font-bold mt-0.5">{formatCurrency(todayProfit)}</span>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="absolute top-4 right-4 lg:static w-6 h-6 border border-white/5 hover:border-white/20 rounded flex items-center justify-center text-text-muted hover:text-white transition-colors cursor-pointer shrink-0 z-50"
            title="Close Management Terminal"
          >
            <i className="fa-solid fa-xmark text-xs"></i>
          </button>
        </div>
      </div>

      {/* ALL SIX TABS */}
      {/* Mobile Tab Dropdown Ledge */}
      <div className="lg:hidden relative z-20">
        <button
          onClick={() => setIsTabDropdownOpen(!isTabDropdownOpen)}
          className="w-full flex items-center justify-between px-4 py-3 bg-black/60 border border-white/10 rounded-lg font-display text-xs font-bold uppercase tracking-widest text-cyanGlow hover:border-cyanGlow/40 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <i className={`fa-solid ${
              activeTab === 'overview' ? 'fa-chart-pie' :
              activeTab === 'inventory' ? 'fa-warehouse' :
              activeTab === 'pricing' ? 'fa-tags' :
              activeTab === 'sales' ? 'fa-cash-register' :
              activeTab === 'analytics' ? 'fa-chart-column' :
              'fa-clock-rotate-left'
            } text-xs`}></i>
            <span>
              {activeTab === 'overview' ? 'Overview' :
               activeTab === 'inventory' ? 'Inventory' :
               activeTab === 'pricing' ? 'Pricing' :
               activeTab === 'sales' ? 'Sales Center' :
               activeTab === 'analytics' ? 'Analytics' :
               'History'}
            </span>
          </div>
          <i className={`fa-solid ${isTabDropdownOpen ? 'fa-chevron-up' : 'fa-chevron-down'} text-text-muted text-[10px]`}></i>
        </button>

        {isTabDropdownOpen && (
          <div className="absolute top-full left-0 w-full mt-1.5 bg-[#090e17] border border-white/10 rounded-lg shadow-2xl overflow-hidden flex flex-col z-50">
            {[
              { id: 'overview', label: 'Overview', icon: 'fa-chart-pie' },
              { id: 'inventory', label: 'Inventory', icon: 'fa-warehouse' },
              { id: 'pricing', label: 'Pricing', icon: 'fa-tags' },
              { id: 'sales', label: 'Sales Center', icon: 'fa-cash-register' },
              { id: 'analytics', label: 'Analytics', icon: 'fa-chart-column' },
              { id: 'history', label: 'History', icon: 'fa-clock-rotate-left' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setIsTabDropdownOpen(false);
                  setErrorMsg('');
                  setSuccessMsg('');
                }}
                className={`w-full text-left px-4 py-3 text-[10px] font-display font-bold uppercase tracking-widest flex items-center gap-2 cursor-pointer transition-colors border-b border-white/5 last:border-0 ${
                  activeTab === tab.id
                    ? 'bg-cyanGlow/10 text-cyanGlow'
                    : 'text-text-secondary hover:text-white hover:bg-white/2'
                }`}
              >
                <i className={`fa-solid ${tab.icon} text-xs`}></i>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Desktop Tabs */}
      <div className="hidden lg:flex border-b border-white/5 gap-1 relative z-10 overflow-x-auto whitespace-nowrap scrollbar-none">
        {[
          { id: 'overview', label: 'Overview', icon: 'fa-chart-pie' },
          { id: 'inventory', label: 'Inventory', icon: 'fa-warehouse' },
          { id: 'pricing', label: 'Pricing', icon: 'fa-tags' },
          { id: 'sales', label: 'Sales Center', icon: 'fa-cash-register' },
          { id: 'analytics', label: 'Analytics', icon: 'fa-chart-column' },
          { id: 'history', label: 'History', icon: 'fa-clock-rotate-left' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id);
              setErrorMsg('');
              setSuccessMsg('');
            }}
            className={`px-4 py-3 border-b-2 font-display text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 cursor-pointer transition-colors ${
              activeTab === tab.id
                ? 'border-cyanGlow text-cyanGlow bg-cyanGlow/5'
                : 'border-transparent text-text-secondary hover:text-white hover:bg-white/2'
            }`}
          >
            <i className={`fa-solid ${tab.icon} text-xs`}></i>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Messages */}
      {errorMsg && (
        <div className="p-3 bg-red-950/35 border border-red-500/20 text-red-400 rounded text-xs font-mono flex items-center gap-2 animate-fade-in relative z-10">
          <i className="fa-solid fa-circle-exclamation"></i>
          <span>{errorMsg}</span>
        </div>
      )}
      {successMsg && (
        <div className="p-3 bg-green-950/35 border border-greenGlow/20 text-greenGlow rounded text-xs font-mono flex items-center gap-2 animate-fade-in relative z-10">
          <i className="fa-solid fa-circle-check"></i>
          <span>{successMsg}</span>
        </div>
      )}

      {/* TAB SWITCHBOARD VIEWPORT */}
      <div className="flex-1 min-h-0 relative z-10">
        
        {/* TAB 1 - OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="flex flex-col gap-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="glass-card p-4 border border-white/5 bg-gradient-to-b from-glassBg to-black/25 flex flex-col gap-1">
                <span className="text-[10px] text-text-secondary uppercase font-display tracking-wider">Store Status</span>
                <span className="text-greenGlow font-display uppercase font-bold text-sm tracking-wide flex items-center gap-1.5 mt-0.5">
                  <span className="w-2 h-2 rounded-full bg-greenGlow animate-pulse"></span>
                  Open
                </span>
              </div>
              <div className="glass-card p-4 border border-white/5 bg-gradient-to-b from-glassBg to-black/25 flex flex-col gap-1">
                <span className="text-[10px] text-text-secondary uppercase font-display tracking-wider">Reputation</span>
                <span className="text-white font-display font-black text-sm tracking-wide mt-0.5">{reputationPercent}%</span>
              </div>
              <div className="glass-card p-4 border border-white/5 bg-gradient-to-b from-glassBg to-black/25 flex flex-col gap-1">
                <span className="text-[10px] text-text-secondary uppercase font-display tracking-wider">Active Cycle</span>
                <span className={`text-sm font-display font-bold uppercase mt-0.5 ${isRunning ? 'text-cyanGlow' : 'text-text-muted'}`}>
                  {isRunning ? 'Active' : 'Idle'}
                </span>
              </div>
              <div className="glass-card p-4 border border-white/5 bg-gradient-to-b from-glassBg to-black/25 flex flex-col gap-1">
                <span className="text-[10px] text-text-secondary uppercase font-display tracking-wider">Storage Capacity</span>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex-1 h-1.5 bg-black/45 rounded-full overflow-hidden border border-white/5">
                    <div className="h-full bg-cyanGlow rounded-full transition-all duration-500" style={{ width: `${storeCapacityPercent}%` }}></div>
                  </div>
                  <span className="text-[10px] font-mono text-white font-bold">{storeCapacityPercent}%</span>
                </div>
              </div>
            </div>

            <div className="glass-card p-6 border border-cyanGlow/10 bg-gradient-to-b from-glassBg via-black/45 to-black/40 rounded-lg flex flex-col gap-6">
              <div>
                <h3 className="font-display font-extrabold text-sm uppercase tracking-wider text-white mb-1">
                  Corporate Register overview
                </h3>
                <p className="text-xs text-text-secondary">
                  Specify unit pricing targets inside the **Pricing** tab and allocate manual sales counts in the **Sales Center** to trigger customer buy cycles.
                </p>
              </div>

              {isRunning ? (
                <div className="p-4 bg-cyanGlow/5 border border-cyanGlow/10 rounded flex justify-between items-center text-xs font-mono text-cyanGlow leading-relaxed">
                  <div>
                    <span className="font-bold block text-sm uppercase">Active Sales Cycle running</span>
                    <span className="text-text-secondary text-[11px] block mt-0.5">Time Remaining: {formatDurationStr(timeRemaining)}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-text-secondary text-[10px] uppercase block">Customers</span>
                    <span className="text-white font-bold text-sm">{retailState.activeCycle?.expectedCustomers}</span>
                  </div>
                </div>
              ) : (
                <div className="p-8 border border-white/5 bg-black/35 rounded-lg text-center flex flex-col items-center justify-center gap-3">
                  <i className="fa-solid fa-cash-register text-3xl text-text-muted animate-pulse"></i>
                  <h4 className="font-display uppercase text-xs tracking-wider text-text-secondary font-bold">Register Terminals Ready</h4>
                  <p className="text-[11px] text-text-muted max-w-sm">No sales cycle currently active. Select start inside the Sales Center tab.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2 - INVENTORY */}
        {activeTab === 'inventory' && (
          <div className="flex flex-col gap-4">
            <div className="glass-card p-4 border border-white/5 bg-black/25 rounded-lg">
              <span className="text-xs font-mono text-text-muted leading-relaxed block mb-2">
                &bull; Eligible Store Inventory is read directly from your Player Warehouse stock ledger. This screen is read-only.
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {projections.productsDetails.map(item => {
                const isOutOfStock = item.availableStock === 0;
                return (
                  <div 
                    key={item.productId}
                    className={`glass-card p-5 border rounded-lg bg-gradient-to-b from-glassBg to-black/20 flex items-center justify-between relative ${
                      isOutOfStock ? 'border-red-500/10 opacity-75' : 'border-white/5'
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-12 h-12 bg-black/40 border border-white/10 rounded flex items-center justify-center text-cyanGlow">
                        <i className={`${item.icon} text-lg`}></i>
                      </div>
                      <div>
                        <h4 className="font-display font-extrabold text-sm uppercase text-white tracking-wide">{item.productName}</h4>
                        <span className="text-[10px] text-text-secondary font-mono block mt-0.5">Warehouse Inventory</span>
                      </div>
                    </div>

                    <div className="text-right font-mono">
                      {isOutOfStock ? (
                        <span className="px-2 py-0.5 bg-red-950/40 border border-red-500/20 text-red-400 text-[9px] font-bold rounded uppercase tracking-wider">
                          Out of Stock
                        </span>
                      ) : (
                        <span className="text-white font-bold text-sm">{item.availableStock.toLocaleString()} unit(s)</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 3 - PRICING */}
        {activeTab === 'pricing' && (
          <div className="glass-card border border-white/5 rounded-lg bg-black/25 overflow-x-auto scrollbar-none">
            <table className="w-full text-left border-collapse font-sans text-xs">
              <thead>
                <tr className="bg-white/3 text-[10px] uppercase font-display text-text-secondary tracking-wider border-b border-white/5">
                  <th className="p-3.5">Product</th>
                  <th className="p-3.5 text-right">Avg Purchase Cost</th>
                  <th className="p-3.5 text-center">Current Selling Price</th>
                  <th className="p-3.5 text-right">Market Average Price</th>
                  <th className="p-3.5 text-right">Profit Margin</th>
                  <th className="p-3.5 text-right">Demand Modifier</th>
                </tr>
              </thead>
              <tbody>
                {projections.productsDetails.map(item => {
                  const isOutOfStock = item.availableStock === 0;
                  const marginPercent = (!isOutOfStock && item.sellingPrice > 0)
                    ? ((item.sellingPrice - item.avgPurchaseCost) / item.sellingPrice) * 100 
                    : 0;

                  // Demand modifier percentage value
                  const marketAveragePrice = item.basePrice * 1.08;
                  const demandRatio = marketAveragePrice > 0 ? (item.sellingPrice / marketAveragePrice) : 1;
                  const demandMod = demandRatio > 0 ? (1 / Math.pow(demandRatio, 2)) : 1.0;
                  const demandModPercent = Math.round(Math.max(0.001, Math.min(3.0, demandMod)) * 100);

                  return (
                    <tr key={item.productId} className="border-b border-white/5 hover:bg-white/1 transition-colors">
                      <td className="p-3.5 text-white font-semibold flex items-center gap-2.5">
                        <i className={`${item.icon} text-cyanGlow/75 text-[11px] w-4 text-center`}></i>
                        <span>{item.productName}</span>
                      </td>
                      <td className="p-3.5 text-right font-mono">
                        {isOutOfStock ? (
                          <span className="text-red-400/90 text-[10px] font-mono font-semibold">Out of Stock</span>
                        ) : (
                          <span className="text-text-secondary">{formatCurrency(item.avgPurchaseCost)}</span>
                        )}
                      </td>
                      <td className="p-3.5 text-center font-mono">
                        <input
                          type="number"
                          disabled={isRunning}
                          min="1"
                          value={item.sellingPrice}
                          onChange={(e) => handlePriceChange(item.productId, e.target.value)}
                          className={`w-24 bg-black/60 border rounded px-2.5 py-1 text-center text-xs font-bold font-mono focus:outline-none ${
                            isRunning 
                              ? 'border-white/5 text-text-muted cursor-not-allowed' 
                              : 'border-white/15 text-white focus:border-cyanGlow/40'
                          }`}
                        />
                      </td>
                      <td className="p-3.5 text-right font-mono text-text-secondary">{formatCurrency(marketAveragePrice)}</td>
                      <td className={`p-3.5 text-right font-mono font-bold ${isOutOfStock ? 'text-text-muted' : (marginPercent >= 0 ? 'text-greenGlow' : 'text-red-400')}`}>
                        {isOutOfStock ? '-' : `${marginPercent.toFixed(1)}%`}
                      </td>
                      <td className="p-3.5 text-right font-mono font-semibold text-cyanGlow">
                        {demandModPercent}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 4 - SALES CENTER */}
        {activeTab === 'sales' && (
          <div className="flex flex-col gap-6">
            
            {/* Products cards grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {projections.productsDetails.map(item => {
                const isOutOfStock = item.availableStock === 0;
                return (
                  <div key={item.productId} className="glass-card p-5 border border-white/5 bg-gradient-to-b from-glassBg to-black/25 rounded-lg flex flex-col gap-4 font-mono text-xs">
                    <div className="flex items-center gap-3 border-b border-white/5 pb-2.5">
                      <div className="w-10 h-10 bg-black/40 border border-white/10 rounded flex items-center justify-center text-cyanGlow text-sm">
                        <i className={item.icon}></i>
                      </div>
                      <h4 className="font-display font-extrabold text-sm uppercase text-white tracking-wide">{item.productName}</h4>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-text-secondary">Available Stock:</span>
                      <span className="text-white font-bold">{item.availableStock} units</span>
                    </div>

                    {/* Quantity Selected selector input slider */}
                    <div className="flex flex-col gap-1.5 mt-1">
                      <div className="flex justify-between items-center text-[10px] text-text-secondary uppercase">
                        <span>Quantity Selected</span>
                        <span className="text-cyanGlow font-bold">{item.quantitySelected} units</span>
                      </div>
                      <input
                        type="range"
                        disabled={isRunning || isOutOfStock}
                        min="0"
                        max={item.availableStock}
                        value={item.quantitySelected}
                        onChange={(e) => handleQtyChange(item.productId, e.target.value, item.availableStock)}
                        className={`w-full h-1.5 rounded-lg appearance-none cursor-pointer bg-black/50 ${
                          isRunning ? 'opacity-40 cursor-not-allowed' : ''
                        }`}
                      />
                      <input
                        type="number"
                        disabled={isRunning || isOutOfStock}
                        min="0"
                        max={item.availableStock}
                        value={item.quantitySelected}
                        onChange={(e) => handleQtyChange(item.productId, e.target.value, item.availableStock)}
                        className={`w-20 mt-1 bg-black/60 border text-center font-bold px-2 py-0.5 rounded focus:outline-none ${
                          isRunning || isOutOfStock ? 'border-white/5 text-text-muted cursor-not-allowed' : 'border-white/15 text-white focus:border-cyanGlow/40'
                        }`}
                      />
                    </div>

                    <div className="flex justify-between border-t border-white/5 pt-2 mt-2">
                      <span className="text-text-secondary">Expected Customers:</span>
                      <span className="text-white">{item.expectedCustomers}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-secondary">Expected Units Sold:</span>
                      <span className="text-white font-bold">{item.expectedUnitsSold}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-secondary">Expected Revenue:</span>
                      <span className="text-cyanGlow font-black">{formatCurrency(item.expectedRevenue)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-secondary">Est. Item Duration:</span>
                      <span className="text-white font-bold">{formatDurationStr(item.duration)}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Workforce Requirements Card */}
            {!isRunning && (
              <div className="glass-card p-5 border border-white/5 bg-gradient-to-b from-glassBg via-black/25 to-black/35 rounded-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-cyanGlow/5 border border-cyanGlow/20 rounded-lg flex items-center justify-center text-cyanGlow">
                    <i className="fa-solid fa-id-card-clip text-sm"></i>
                  </div>
                  <div>
                    <h4 className="font-display font-extrabold text-xs uppercase text-white tracking-wider">
                      Workforce Requirements
                    </h4>
                    <p className="text-[10px] text-text-secondary font-mono mt-0.5">
                      Operational checklist for active sales registers (Ceiling based on total selected units: {projections.totalSelectedQty}).
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 font-mono text-xs w-full md:w-auto">
                  {/* Manager Requirement */}
                  <div className="flex items-center gap-3 bg-black/40 border border-white/5 px-4 py-2.5 rounded-lg flex-1 md:flex-none justify-between md:justify-start min-w-[160px]">
                    <div className="flex items-center gap-2">
                      <i className="fa-solid fa-user-tie text-cyanGlow text-[11px]"></i>
                      <span className="text-text-secondary text-[10px] uppercase">Manager</span>
                    </div>
                    <span className={`font-bold ${projections.hiredManagers >= projections.managersNeeded ? 'text-greenGlow' : 'text-red-400'}`}>
                      {projections.hiredManagers} hired / {projections.managersNeeded} req
                    </span>
                  </div>

                  {/* Labourers Requirement */}
                  <div className="flex items-center gap-3 bg-black/40 border border-white/5 px-4 py-2.5 rounded-lg flex-1 md:flex-none justify-between md:justify-start min-w-[160px]">
                    <div className="flex items-center gap-2">
                      <i className="fa-solid fa-users text-cyanGlow text-[11px]"></i>
                      <span className="text-text-secondary text-[10px] uppercase">Labourers</span>
                    </div>
                    <span className={`font-bold ${projections.hiredLabourers >= projections.labourersNeeded ? 'text-greenGlow' : 'text-red-400'}`}>
                      {projections.hiredLabourers} hired / {projections.labourersNeeded} req
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Bottom Store Summary block */}
            <div className="glass-card p-6 border border-greenGlow/10 bg-gradient-to-b from-glassBg to-black/45 rounded-lg flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 relative">
              <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-greenGlow/20 to-transparent"></div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-6 font-mono text-xs w-full lg:w-auto">
                <div>
                  <span className="text-[10px] text-text-secondary uppercase tracking-wider block">Expected Customers</span>
                  <span className="text-white font-bold text-sm mt-0.5 block">{projections.totalCustomers}</span>
                </div>
                <div className="border-l border-white/5 pl-4">
                  <span className="text-[10px] text-text-secondary uppercase tracking-wider block">Total Expected Sold</span>
                  <span className="text-white font-bold text-sm mt-0.5 block">{projections.totalUnitsSold}</span>
                </div>
                <div className="border-l border-white/5 pl-4">
                  <span className="text-[10px] text-text-secondary uppercase tracking-wider block">Expected Revenue</span>
                  <span className="text-cyanGlow font-bold text-sm mt-0.5 block">{formatCurrency(projections.totalRevenue)}</span>
                </div>
                <div className="border-l border-white/5 pl-4">
                  <span className="text-[10px] text-text-secondary uppercase tracking-wider block">Expected Profit</span>
                  <span className="text-greenGlow font-bold text-sm mt-0.5 block">{formatCurrency(projections.totalProfit)}</span>
                </div>
                <div className="border-l border-white/5 pl-4">
                  <span className="text-[10px] text-text-secondary uppercase tracking-wider block">Estimated Duration</span>
                  <span className="text-white font-bold text-sm mt-0.5 block">{formatDurationStr(projections.cycleDuration)}</span>
                </div>
              </div>

              {isRunning ? (
                <div className="flex items-center gap-4 w-full lg:w-auto justify-end">
                  <div className="text-right text-xs font-mono">
                    <span className="text-text-muted block text-[10px] uppercase">Active remaining time</span>
                    <span className="text-cyanGlow font-bold text-sm">{formatDurationStr(timeRemaining)}</span>
                  </div>
                  <button 
                    disabled={actionInProgress}
                    onClick={handleStopCycle}
                    className="px-5 py-2.5 border border-red-500/20 bg-red-950/20 text-red-400 hover:bg-red-950/30 hover:border-red-500/35 text-[10px] font-display uppercase tracking-widest rounded cursor-pointer"
                  >
                    Abort Cycle
                  </button>
                </div>
              ) : (
                <button
                  disabled={actionInProgress || projections.totalUnitsSold === 0 || !projections.hasEnoughWorkforce}
                  onClick={handleStartCycle}
                  className={`px-6 py-2.5 font-display text-[10px] font-bold uppercase tracking-widest rounded border transition-all cursor-pointer flex items-center gap-2 ${
                    (projections.totalUnitsSold > 0 && projections.hasEnoughWorkforce)
                      ? 'bg-cyanGlow border-cyanGlow text-black hover:bg-cyanGlow/85' 
                      : 'border-white/10 bg-white/3 text-text-muted cursor-not-allowed'
                  }`}
                >
                  <i className="fa-solid fa-play"></i>
                  Start Sales Cycle
                </button>
              )}
            </div>
          </div>
        )}

        {/* TAB 5 - ANALYTICS */}
        {activeTab === 'analytics' && (() => {
          const activeSimProductId = selectedSimProductId || projections.productsDetails[0]?.productId || '';
          const simProduct = projections.productsDetails.find(p => p.productId === activeSimProductId);
          const activeSimPrice = simPrice || simProduct?.sellingPrice || simProduct?.basePrice || 0;
          
          let simDemandModPercent = 100;
          let simExpectedCustomers = 0;
          let simUnitsSold = 0;
          let simRevenue = 0;
          let simCost = 0;
          let simProfit = 0;
          let simMarketAveragePrice = 108;
          let simPriceRatio = 1.0;
          
          if (simProduct) {
            const basePrice = simProduct.basePrice || 100;
            simMarketAveragePrice = basePrice * 1.08;
            
            // Calculate simulated elasticity
            simPriceRatio = simMarketAveragePrice > 0 ? (activeSimPrice / simMarketAveragePrice) : 1;
            let simPriceModifier = 1.0;
            if (simPriceRatio > 0) {
              simPriceModifier = 1 / Math.pow(simPriceRatio, 2);
            }
            simPriceModifier = Math.max(0.001, Math.min(3.0, simPriceModifier || 1.0));
            simDemandModPercent = Math.round(simPriceModifier * 100);
            
            const demandConfig = BASE_DEMAND[startup.businessType]?.[simProduct.productId] || { base: 100 };
            simExpectedCustomers = Math.ceil(demandConfig.base * simPriceModifier);
            
            // Assume simulated volume is either their current available stock or a standard batch size of 200 (if stock is 0)
            const simulatedVolume = simProduct.availableStock > 0 ? simProduct.availableStock : 200;
            simUnitsSold = Math.min(simulatedVolume, simExpectedCustomers);
            
            simRevenue = simUnitsSold * activeSimPrice;
            simCost = simUnitsSold * simProduct.avgPurchaseCost;
            simProfit = simRevenue - simCost;
          }

          const getSimScenario = (priceMultiplier, label) => {
            if (!simProduct) return null;
            const targetPrice = Math.round(simProduct.basePrice * priceMultiplier);
            const priceRatio = simMarketAveragePrice > 0 ? (targetPrice / simMarketAveragePrice) : 1;
            let modifier = 1.0;
            if (priceRatio > 0) {
              modifier = 1 / Math.pow(priceRatio, 2);
            }
            modifier = Math.max(0.001, Math.min(3.0, modifier));
            
            const demandConfig = BASE_DEMAND[startup.businessType]?.[simProduct.productId] || { base: 100 };
            const customers = Math.ceil(demandConfig.base * modifier);
            const simulatedVolume = simProduct.availableStock > 0 ? simProduct.availableStock : 200;
            const sold = Math.min(simulatedVolume, customers);
            const revenue = sold * targetPrice;
            const cost = sold * simProduct.avgPurchaseCost;
            const profit = revenue - cost;
            
            return {
              label,
              price: targetPrice,
              modifier: Math.round(modifier * 100),
              customers,
              sold,
              revenue,
              profit
            };
          };

          const getOptimalScenario = () => {
            if (!simProduct) return null;
            const optimalPrice = Math.round(simProduct.avgPurchaseCost * 2);
            const priceRatio = simMarketAveragePrice > 0 ? (optimalPrice / simMarketAveragePrice) : 1;
            let modifier = 1.0;
            if (priceRatio > 0) {
              modifier = 1 / Math.pow(priceRatio, 2);
            }
            modifier = Math.max(0.001, Math.min(3.0, modifier));
            
            const demandConfig = BASE_DEMAND[startup.businessType]?.[simProduct.productId] || { base: 100 };
            const customers = Math.ceil(demandConfig.base * modifier);
            const simulatedVolume = simProduct.availableStock > 0 ? simProduct.availableStock : 200;
            const sold = Math.min(simulatedVolume, customers);
            const revenue = sold * optimalPrice;
            const cost = sold * simProduct.avgPurchaseCost;
            const profit = revenue - cost;
            
            return {
              label: 'Optimal Profit Maximizer',
              price: optimalPrice,
              modifier: Math.round(modifier * 100),
              customers,
              sold,
              revenue,
              profit,
              isOptimal: true
            };
          };

          const scenarios = simProduct ? [
            getSimScenario(0.8, 'Discount Strategy (0.8x base)'),
            getSimScenario(1.0, 'Market Balanced (1.0x base)'),
            getSimScenario(1.2, 'Premium Strategy (1.2x base)'),
            getOptimalScenario()
          ].filter(Boolean) : [];

          const historyEntries = retailState.history || [];
          const totalRevLast20 = historyEntries.reduce((sum, h) => sum + (h.revenue || 0), 0);
          const totalProfitLast20 = historyEntries.reduce((sum, h) => sum + (h.profit || 0), 0);
          const avgMarginLast20 = totalRevLast20 > 0 ? (totalProfitLast20 / totalRevLast20) * 100 : 0;
          
          const productUnitsMap = {};
          historyEntries.forEach(h => {
            Object.entries(h.productsSold || {}).forEach(([pId, qty]) => {
              productUnitsMap[pId] = (productUnitsMap[pId] || 0) + qty;
            });
          });
          
          let bestSellingProduct = 'None';
          let maxUnits = 0;
          Object.entries(productUnitsMap).forEach(([pId, qty]) => {
            if (qty > maxUnits) {
              maxUnits = qty;
              const config = BASE_DEMAND[startup.businessType]?.[pId];
              bestSellingProduct = config ? config.name : pId;
            }
          });

          const applyPriceToStore = async (productId, price) => {
            setSimPrice(price);
            await handlePriceChange(productId, price);
          };

          return (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full text-white">
              
              {/* Left Column (col-span-2): Simulator + Strategy Recommendations */}
              <div className="lg:col-span-2 flex flex-col gap-6">
                
                {/* 1. Price Elasticity Simulator */}
                <div className="glass-card p-5 border border-white/5 bg-gradient-to-b from-glassBg to-black/25 rounded-lg flex flex-col gap-4">
                  <div className="flex items-center justify-between border-b border-white/5 pb-3">
                    <h3 className="font-display font-extrabold text-sm uppercase text-cyanGlow tracking-wide flex items-center gap-2">
                      <i className="fa-solid fa-sliders text-cyanGlow"></i>
                      Pricing Elasticity Simulator
                    </h3>
                    
                    {simProduct && (
                      <select
                        value={activeSimProductId}
                        onChange={(e) => {
                          const pId = e.target.value;
                          setSelectedSimProductId(pId);
                          setSimPrice(0);
                        }}
                        className="bg-black/60 text-white border border-white/10 rounded px-2 py-1 text-[10px] font-mono focus:outline-none focus:border-cyanGlow/40"
                      >
                        {projections.productsDetails.map(p => (
                          <option key={p.productId} value={p.productId}>{p.productName}</option>
                        ))}
                      </select>
                    )}
                  </div>

                  {simProduct ? (
                    <div className="flex flex-col gap-4 font-mono text-xs">
                      <p className="text-[10px] text-text-secondary leading-relaxed">
                        Drag the slider to preview how changing the selling price of <strong>{simProduct.productName}</strong> impacts market demand modifiers and cycle margins.
                      </p>

                      {/* Slider Input */}
                      <div className="flex flex-col gap-2 bg-black/35 p-4 rounded border border-white/5">
                        <div className="flex justify-between items-center text-[10px] uppercase text-text-secondary">
                          <span>Simulated Price</span>
                          <span className="text-cyanGlow font-black text-xs">{formatCurrency(activeSimPrice)}</span>
                        </div>
                        <input
                          type="range"
                          min={Math.round(simProduct.basePrice * 0.5)}
                          max={Math.round(simProduct.basePrice * 2.5)}
                          value={activeSimPrice}
                          onChange={(e) => setSimPrice(parseFloat(e.target.value) || 0)}
                          className="w-full h-1.5 rounded-lg appearance-none cursor-pointer bg-black/50"
                        />
                        <div className="flex justify-between text-[8px] text-text-muted">
                          <span>0.5x Base ({formatCurrency(simProduct.basePrice * 0.5)})</span>
                          <span>2.5x Base ({formatCurrency(simProduct.basePrice * 2.5)})</span>
                        </div>
                      </div>

                      {/* Live Outcomes Grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-black/25 p-4 rounded border border-white/5">
                        <div>
                          <span className="text-[8px] text-text-secondary uppercase tracking-wider block">Demand Modifier</span>
                          <span className={`text-sm font-bold mt-1 block ${simDemandModPercent > 100 ? 'text-greenGlow' : simDemandModPercent < 50 ? 'text-red-400' : 'text-cyanGlow'}`}>
                            {simDemandModPercent}%
                          </span>
                        </div>
                        <div>
                          <span className="text-[8px] text-text-secondary uppercase tracking-wider block">Expected Customers</span>
                          <span className="text-white text-sm font-bold mt-1 block">{simExpectedCustomers}</span>
                        </div>
                        <div>
                          <span className="text-[8px] text-text-secondary uppercase tracking-wider block">Est. Units Sold</span>
                          <span className="text-white text-sm font-bold mt-1 block">
                            {simUnitsSold} <span className="text-[9px] text-text-muted">/{simProduct.availableStock > 0 ? `${simProduct.availableStock} stock` : '200 est'}</span>
                          </span>
                        </div>
                        <div>
                          <span className="text-[8px] text-text-secondary uppercase tracking-wider block">Projected Profit</span>
                          <span className={`text-sm font-black mt-1 block ${simProfit >= 0 ? 'text-greenGlow' : 'text-red-400'}`}>
                            {formatCurrency(simProfit)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-8 text-center text-text-muted font-mono">No simulation metrics available.</div>
                  )}
                </div>

                {/* 2. Pricing Optimization Advisor */}
                {simProduct && (
                  <div className="glass-card p-5 border border-white/5 bg-gradient-to-b from-glassBg to-black/25 rounded-lg flex flex-col gap-4">
                    <h3 className="font-display font-extrabold text-sm uppercase text-cyanGlow tracking-wide border-b border-white/5 pb-3 flex items-center gap-2">
                      <i className="fa-solid fa-graduation-cap text-cyanGlow"></i>
                      Pricing Optimization Advisor ({simProduct.productName})
                    </h3>
                    
                    <p className="text-[10px] text-text-secondary leading-relaxed font-mono">
                      Calibrate your target pricing based on strategic objectives. Click <strong>"Apply to Store"</strong> to save the price to your pricing registry.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono text-xs mt-1">
                      
                      {/* Strategy 1: Peak Profit */}
                      <div className="p-3.5 rounded border border-white/5 bg-black/25 flex flex-col justify-between gap-3">
                        <div className="flex flex-col gap-1">
                          <span className="text-[9px] bg-greenGlow/10 text-greenGlow px-2 py-0.5 rounded font-black uppercase tracking-wider self-start font-sans">Peak Profit Margin</span>
                          <span className="text-white font-extrabold text-xs mt-1">Optimal High Margin</span>
                          <p className="text-[9px] text-text-muted mt-1 leading-relaxed">
                            Targets maximum total net profit. Calibrated at a 50% operating margin.
                          </p>
                        </div>
                        <div className="flex flex-col gap-2 pt-2.5 border-t border-white/5">
                          <div className="flex justify-between text-[11px]">
                            <span className="text-text-secondary">Price:</span>
                            <span className="text-cyanGlow font-bold">{formatCurrency(simProduct.avgPurchaseCost * 2)}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => applyPriceToStore(simProduct.productId, Math.round(simProduct.avgPurchaseCost * 2))}
                            className="w-full text-center py-1.5 rounded bg-cyanGlow/10 hover:bg-cyanGlow/25 text-cyanGlow text-[10px] font-black uppercase transition-all tracking-wider"
                          >
                            Apply to Store
                          </button>
                        </div>
                      </div>

                      {/* Strategy 2: Max Volume */}
                      <div className="p-3.5 rounded border border-white/5 bg-black/25 flex flex-col justify-between gap-3">
                        <div className="flex flex-col gap-1">
                          <span className="text-[9px] bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded font-black uppercase tracking-wider self-start font-sans">Max Volume (No Loss)</span>
                          <span className="text-white font-extrabold text-xs mt-1">At-Cost Clearance</span>
                          <p className="text-[9px] text-text-muted mt-1 leading-relaxed">
                            Clears warehouse stock fastest without registering a loss on cost of goods.
                          </p>
                        </div>
                        <div className="flex flex-col gap-2 pt-2.5 border-t border-white/5">
                          <div className="flex justify-between text-[11px]">
                            <span className="text-text-secondary">Price:</span>
                            <span className="text-cyanGlow font-bold">{formatCurrency(simProduct.avgPurchaseCost)}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => applyPriceToStore(simProduct.productId, Math.round(simProduct.avgPurchaseCost))}
                            className="w-full text-center py-1.5 rounded bg-cyanGlow/10 hover:bg-cyanGlow/25 text-cyanGlow text-[10px] font-black uppercase transition-all tracking-wider"
                          >
                            Apply to Store
                          </button>
                        </div>
                      </div>

                      {/* Strategy 3: Middle Ground */}
                      <div className="p-3.5 rounded border border-white/5 bg-black/25 flex flex-col justify-between gap-3">
                        <div className="flex flex-col gap-1">
                          <span className="text-[9px] bg-cyanGlow/10 text-cyanGlow px-2 py-0.5 rounded font-black uppercase tracking-wider self-start font-sans">Balanced Compromise</span>
                          <span className="text-white font-extrabold text-xs mt-1">Middle Ground Peak</span>
                          <p className="text-[9px] text-text-muted mt-1 leading-relaxed">
                            Achieves a strong blend: high client volume combined with a solid 33% profit margin.
                          </p>
                        </div>
                        <div className="flex flex-col gap-2 pt-2.5 border-t border-white/5">
                          <div className="flex justify-between text-[11px]">
                            <span className="text-text-secondary">Price:</span>
                            <span className="text-cyanGlow font-bold">{formatCurrency(simProduct.avgPurchaseCost * 1.5)}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => applyPriceToStore(simProduct.productId, Math.round(simProduct.avgPurchaseCost * 1.5))}
                            className="w-full text-center py-1.5 rounded bg-cyanGlow/10 hover:bg-cyanGlow/25 text-cyanGlow text-[10px] font-black uppercase transition-all tracking-wider"
                          >
                            Apply to Store
                          </button>
                        </div>
                      </div>

                    </div>
                  </div>
                )}

              </div>

              {/* Right Column (col-span-1): Price Diagnostics + Store Cumulative Ledger */}
              <div className="lg:col-span-1 flex flex-col gap-6">
                
                {/* 2. Strategy Diagnostics */}
                <div className="glass-card p-5 border border-white/5 bg-gradient-to-b from-glassBg to-black/25 rounded-lg flex flex-col gap-4">
                  <h3 className="font-display font-extrabold text-sm uppercase text-cyanGlow tracking-wide border-b border-white/5 pb-3 flex items-center gap-2">
                    <i className="fa-solid fa-clipboard-question text-cyanGlow"></i>
                    Price Diagnostics
                  </h3>

                  <div className="flex flex-col gap-3 font-mono text-xs overflow-y-auto max-h-[360px] scrollbar-none pr-1">
                    {projections.productsDetails.map(item => {
                      const isOutOfStock = item.availableStock === 0;
                      const marginPercent = (!isOutOfStock && item.sellingPrice > 0)
                        ? ((item.sellingPrice - item.avgPurchaseCost) / item.sellingPrice) * 100 
                        : 0;
                      
                      const marketAveragePrice = item.basePrice * 1.08;
                      const priceRatio = marketAveragePrice > 0 ? (item.sellingPrice / marketAveragePrice) : 1;
                      let modifier = 1.0;
                      if (priceRatio > 0) {
                        modifier = 1 / Math.pow(priceRatio, 2);
                      }
                      modifier = Math.max(0.001, Math.min(3.0, modifier));
                      const demandPct = Math.round(modifier * 100);

                      let stateColor = 'border-white/5 bg-black/15';
                      let statusBadge = 'Balanced';
                      let badgeColor = 'bg-white/10 text-white';
                      let recommendation = 'Pricing is aligned with average retail parameters.';

                      if (isOutOfStock) {
                        stateColor = 'border-red-500/10 bg-red-950/5';
                        statusBadge = 'No Stock';
                        badgeColor = 'bg-red-950 text-red-400 border border-red-500/20';
                        recommendation = 'Product out of stock. Manufacture or buy units to enable retail sales.';
                      } else if (marginPercent < 15) {
                        stateColor = 'border-red-500/20 bg-red-950/10';
                        statusBadge = 'Low Margin';
                        badgeColor = 'bg-red-500/20 text-red-400';
                        recommendation = `Increase price closer to ${formatCurrency(item.avgPurchaseCost * 2)} (Optimal Profit Maximizer) to prevent operating losses.`;
                      } else if (demandPct < 40) {
                        stateColor = 'border-amber-500/20 bg-amber-950/10';
                        statusBadge = 'High Price';
                        badgeColor = 'bg-amber-500/20 text-amber-400';
                        recommendation = `Decrease price to boost visitor foot traffic and clear shelf inventory faster.`;
                      } else if (marginPercent >= 45 && marginPercent <= 55) {
                        stateColor = 'border-green-500/25 bg-green-950/15';
                        statusBadge = 'Optimal';
                        badgeColor = 'bg-greenGlow/25 text-greenGlow border border-greenGlow/30';
                        recommendation = 'Pricing is perfectly calibrated for profit maximization peak!';
                      }

                      return (
                        <div key={item.productId} className={`p-3 rounded border flex flex-col gap-2 ${stateColor}`}>
                          <div className="flex justify-between items-center">
                            <span className="font-extrabold text-white flex items-center gap-1.5">
                              <i className={item.icon}></i>
                              {item.productName}
                            </span>
                            <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${badgeColor}`}>{statusBadge}</span>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-2 text-[10px] text-text-secondary py-1 border-y border-white/5">
                            <span>Margin: <strong className="text-white">{marginPercent.toFixed(0)}%</strong></span>
                            <span>Demand: <strong className="text-white">{demandPct}%</strong></span>
                          </div>

                          <p className="text-[9px] text-text-muted leading-relaxed italic">{recommendation}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 4. Store Cumulative Ledger */}
                <div className="glass-card p-5 border border-white/5 bg-gradient-to-b from-glassBg to-black/25 rounded-lg flex flex-col gap-4 font-mono">
                  <h3 className="font-display font-extrabold text-xs uppercase text-cyanGlow tracking-wide border-b border-white/5 pb-3 flex items-center gap-2">
                    <i className="fa-solid fa-scale-balanced text-cyanGlow"></i>
                    Ledger (Last 20 Cycles)
                  </h3>

                  <div className="grid grid-cols-2 gap-3 text-[10px]">
                    <div className="p-2.5 bg-black/25 rounded border border-white/5">
                      <span className="text-[8px] text-text-secondary uppercase">Revenue</span>
                      <span className="text-cyanGlow font-black text-[11px] mt-0.5 block truncate">{formatCurrency(totalRevLast20)}</span>
                    </div>
                    <div className="p-2.5 bg-black/25 rounded border border-white/5">
                      <span className="text-[8px] text-text-secondary uppercase">Net Profit</span>
                      <span className="text-greenGlow font-black text-[11px] mt-0.5 block truncate">{formatCurrency(totalProfitLast20)}</span>
                    </div>
                    <div className="p-2.5 bg-black/25 rounded border border-white/5">
                      <span className="text-[8px] text-text-secondary uppercase">Avg Margin</span>
                      <span className="text-white font-bold text-[11px] mt-0.5 block">{avgMarginLast20.toFixed(1)}%</span>
                    </div>
                    <div className="p-2.5 bg-black/25 rounded border border-white/5">
                      <span className="text-[8px] text-text-secondary uppercase">Best Seller</span>
                      <span className="text-white font-bold text-[11px] mt-0.5 block truncate">{bestSellingProduct}</span>
                    </div>
                  </div>
                </div>

              </div>

            </div>
          );
        })()}

        {/* TAB 6 - HISTORY */}
        {activeTab === 'history' && (
          <div className="glass-card border border-white/5 rounded-lg bg-black/25 overflow-x-auto scrollbar-none">
            <table className="w-full text-left border-collapse font-sans text-xs">
              <thead>
                <tr className="bg-white/3 text-[10px] uppercase font-display text-text-secondary tracking-wider border-b border-white/5">
                  <th className="p-3.5">Completion Time</th>
                  <th className="p-3.5 text-right">NPC Customers Served</th>
                  <th className="p-3.5 text-right">Gross Revenue</th>
                  <th className="p-3.5 text-right">Net Profit</th>
                  <th className="p-3.5">Products Sold</th>
                </tr>
              </thead>
              <tbody>
                {historyEntries.length > 0 ? (
                  historyEntries.map((hist, idx) => {
                    const formattedDate = new Date(hist.completionTime).toLocaleString();
                    return (
                      <tr key={idx} className="border-b border-white/5 hover:bg-white/1 transition-colors font-mono">
                        <td className="p-3.5 text-white font-semibold">{formattedDate}</td>
                        <td className="p-3.5 text-right text-white">{hist.customers} customers</td>
                        <td className="p-3.5 text-right text-white">{formatCurrency(hist.revenue)}</td>
                        <td className="p-3.5 text-right text-greenGlow font-bold">{formatCurrency(hist.profit)}</td>
                        <td className="p-3.5 text-text-secondary text-[11px] font-sans">
                          {Object.entries(hist.productsSold || {}).map(([pId, qty]) => {
                            const name = pId.charAt(0).toUpperCase() + pId.slice(1);
                            return `${name}: ${qty} unit(s)`;
                          }).join(', ')}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="5" className="p-8 text-center text-xs text-text-muted">
                      No sales cycle history logged yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

      </div>

      {/* Completion summary popup */}
      {showCompletionSummary && (
        <div className="fixed inset-0 bg-black/75 z-40 flex items-center justify-center p-4">
          <div className="glass-card max-w-sm w-full p-6 border border-greenGlow/20 bg-gradient-to-b from-glassBg to-black/40 rounded-lg flex flex-col gap-4 font-mono text-xs relative text-center">
            <div className="w-12 h-12 bg-greenGlow/10 border border-greenGlow/25 rounded-full flex items-center justify-center mx-auto text-greenGlow text-lg animate-pulse mb-2">
              <i className="fa-solid fa-circle-check"></i>
            </div>
            
            <h3 className="font-display font-black text-sm uppercase text-white tracking-wider border-b border-white/5 pb-2.5">
              Sales Cycle Complete
            </h3>

            <div className="flex flex-col gap-2 border-b border-white/5 pb-3 text-left">
              {Object.entries(showCompletionSummary.productsSold || {}).map(([pId, qty]) => {
                const name = pId.charAt(0).toUpperCase() + pId.slice(1);
                return (
                  <div key={pId} className="flex justify-between text-text-secondary">
                    <span>{name} Sold:</span>
                    <span className="text-white font-bold">{qty} unit(s)</span>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-between">
              <span className="text-text-secondary">Customers Served:</span>
              <span className="text-white font-bold">{showCompletionSummary.customers}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-secondary">Revenue Generated:</span>
              <span className="text-cyanGlow font-bold">{formatCurrency(showCompletionSummary.revenue)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-greenGlow font-bold">Net Profit Deposited:</span>
              <span className="text-greenGlow font-black">{formatCurrency(showCompletionSummary.profit)}</span>
            </div>

            <button 
              onClick={() => setShowCompletionSummary(null)}
              className="mt-4 w-full py-2 bg-greenGlow text-black font-display font-bold uppercase tracking-widest rounded hover:bg-greenGlow/85 cursor-pointer text-[10px]"
            >
              Close Summary
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
