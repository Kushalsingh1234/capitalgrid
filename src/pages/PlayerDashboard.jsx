import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import * as startupService from '../services/startupService';
import ProductionCenter from '../components/ProductionCenter';
import InventoryPanel from '../components/InventoryPanel';
import * as transactionService from '../services/transactionService';
import * as employeeService from '../services/employeeService';
import { getProductsForBusiness, isRetailBusiness } from '../data/products';
import { PRODUCT_DEPENDENCIES } from '../data/dependencies';

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
  return `${symbol}${amount?.toLocaleString()}`;
};

const getTransactionDisplayDetails = (tx, countryName) => {
  const symbol = CURRENCY_SYMBOLS[countryName] || '$';
  
  // Format Time
  const date = new Date(tx.createdAt);
  const timeStr = date.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });

  let icon = 'fa-solid fa-gears text-cyanGlow';
  let iconBg = 'bg-cyanGlow/5 border-cyanGlow/25 text-cyanGlow';
  let actionText = '';
  let amount = null;
  let amountColor = '';

  if (tx.transactionType === 'Production') {
    icon = 'fa-solid fa-industry text-cyanGlow';
    iconBg = 'bg-cyanGlow/5 border-cyanGlow/25 text-cyanGlow';
    actionText = `Produced ${tx.quantity} ${tx.productName}`;
  } else if (tx.transactionType === 'Sale') {
    icon = 'fa-solid fa-store text-greenGlow';
    iconBg = 'bg-greenGlow/5 border-greenGlow/25 text-greenGlow';
    actionText = `Sold ${tx.quantity} ${tx.productName} to ${tx.buyerStartupName}`;
    amount = `+${symbol}${tx.totalAmount?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    amountColor = 'text-greenGlow';
  } else if (tx.transactionType === 'Purchase') {
    icon = 'fa-solid fa-cart-shopping text-red-400';
    iconBg = 'bg-red-950/20 border-red-500/20 text-red-400';
    actionText = `Bought ${tx.quantity} ${tx.productName} from ${tx.sellerStartupName}`;
    amount = `-${symbol}${tx.totalAmount?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    amountColor = 'text-red-400';
  }

  return {
    icon,
    iconBg,
    actionText,
    time: timeStr,
    amount,
    amountColor
  };
};

export default function PlayerDashboard() {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();

  const [startup, setStartup] = useState(null);
  const [loadingStartup, setLoadingStartup] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [inventory, setInventory] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loadingTransactions, setLoadingTransactions] = useState(true);
  const [employees, setEmployees] = useState([]);
  const [loadingEmployees, setLoadingEmployees] = useState(true);
  const [actionInProgress, setActionInProgress] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  useEffect(() => {
    const fetchStartupDetails = async () => {
      try {
        if (!token) return;
        const response = await startupService.getMyStartup(token);
        if (response.success && response.startup) {
          setStartup(response.startup);
          setInventory(response.startup.inventory || []);
        } else {
          setErrorMsg('Failed to load active corporate data.');
        }
      } catch (err) {
        console.error(err);
        setErrorMsg('Network error loading startup details.');
      } finally {
        setLoadingStartup(false);
      }
    };

    const fetchTransactions = async () => {
      try {
        if (!token) return;
        const response = await transactionService.getMyTransactions(token);
        if (response.success && response.transactions) {
          setTransactions(response.transactions);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingTransactions(false);
      }
    };

    const fetchEmployees = async () => {
      try {
        if (!token) return;
        const response = await employeeService.getMyEmployees(token);
        if (response.success && response.employees) {
          setEmployees(response.employees);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingEmployees(false);
      }
    };

    fetchStartupDetails();
    fetchTransactions();
    fetchEmployees();
  }, [token]);

  // Called by ProductionCenter when a batch completes
  const handleProductionComplete = async (updatedInventory) => {
    setInventory(updatedInventory);
    // Also update the local startup reference
    if (startup) {
      setStartup(prev => ({ ...prev, inventory: updatedInventory }));
    }
    // Fetch updated transactions list
    try {
      const response = await transactionService.getMyTransactions(token);
      if (response.success && response.transactions) {
        setTransactions(response.transactions);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleHire = async (employeeType) => {
    setActionInProgress(true);
    setErrorMsg('');
    try {
      const response = await employeeService.hireEmployee(employeeType, token);
      if (response.success && response.employees) {
        setEmployees(response.employees);
      }
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || 'Failed to hire employee.');
    } finally {
      setActionInProgress(false);
    }
  };

  const handleFire = async (employeeType) => {
    setActionInProgress(true);
    setErrorMsg('');
    try {
      const response = await employeeService.fireEmployee(employeeType, token);
      if (response.success && response.employees) {
        setEmployees(response.employees);
      }
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || 'Failed to fire employee.');
    } finally {
      setActionInProgress(false);
    }
  };

  // Compute workforce summary details
  const totalEmployees = employees.reduce((sum, e) => sum + e.quantity, 0);
  const monthlyPayroll = employees.reduce((sum, e) => sum + (e.quantity * e.salary), 0);

  // Find most expensive role among hired roles
  const hiredRoles = employees.filter(e => e.quantity > 0);
  const mostExpensiveRoleObj = hiredRoles.reduce((max, e) => {
    if (!max || e.salary > max.salary) return e;
    return max;
  }, null);
  const mostExpensiveRole = mostExpensiveRoleObj ? `${mostExpensiveRoleObj.employeeType} (${formatCurrency(mostExpensiveRoleObj.salary, startup?.country)}/mo)` : 'None';

  const renderLogo = (logoStr) => {
    if (!logoStr) {
      return (
        <div className="w-full h-full flex items-center justify-center text-cyanGlow/40">
          <i className="fa-solid fa-industry text-4xl"></i>
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

  if (loadingStartup) {
    return (
      <div className="bg-gameBg min-h-screen text-white flex items-center justify-center relative font-body">
        <div className="grid-overlay"></div>
        <div className="glow-radial-overlay"></div>
        <div className="glass-card max-w-sm w-full p-8 text-center border border-cyanGlow/20 relative z-10">
          <div className="w-16 h-16 border-4 border-t-cyanGlow border-r-cyanGlow/40 border-b-cyanGlow/10 border-l-cyanGlow/20 rounded-full animate-spin mx-auto mb-6"></div>
          <h3 className="font-display text-sm tracking-widest text-cyanGlow uppercase animate-pulse">
            Accessing Core Systems
          </h3>
          <p className="text-xs text-text-secondary mt-2">
            Verifying corporate ledger node...
          </p>
        </div>
      </div>
    );
  }

  const products = startup ? getProductsForBusiness(startup.businessType) : null;
  const isRetail = startup ? isRetailBusiness(startup.businessType) : false;

  return (
    <div className="bg-gameBg min-h-screen text-white relative overflow-hidden font-body px-4 py-8 md:py-12">
      {/* Background Overlays */}
      <div className="grid-overlay"></div>
      <div className="glow-radial-overlay"></div>

      {/* Futuristic Ambient Glow Circles */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyanGlow/5 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blueGlow/5 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-5xl mx-auto relative z-10">

        {/* Navigation / Header Brand */}
        <div className="flex justify-between items-center mb-8 pb-4 border-b border-white/5">
          <Link to="/" className="h-8 hover:opacity-80 transition-opacity">
            <img src="/assets/logo.svg" alt="CapitalGrid Logo" className="h-full" />
          </Link>
          <div className="flex items-center gap-4">
            {user?.profilePicture && (
              <img src={user.profilePicture} alt="Profile" className="w-8 h-8 rounded-full border border-cyanGlow/30 hidden sm:block" />
            )}
            <span className="text-xs text-text-secondary hidden md:inline">
              Session Node: <strong className="text-white">{user?.fullName}</strong>
            </span>
            <button
              onClick={handleLogout}
              className="px-3 py-1.5 bg-red-950/20 border border-red-500/30 hover:bg-red-900/40 text-red-400 text-xs font-display uppercase tracking-widest rounded transition-all"
            >
              Logout <i className="fa-solid fa-power-off ml-1"></i>
            </button>
          </div>
        </div>

        {/* Welcome HUD Panel */}
        <div className="glass-card p-6 md:p-8 border border-white/5 shadow-2xl relative mb-8 overflow-hidden bg-gradient-to-b from-glassBg to-black/80">
          <div className="absolute top-0 right-0 w-24 h-24 border-t-2 border-r-2 border-cyanGlow/10 pointer-events-none"></div>

          <div className="badge neon-text-blue mb-4">
            <i className="fa-solid fa-chart-line"></i> Operations Dashboard
          </div>

          <h1 className="font-display text-2xl md:text-3xl font-extrabold uppercase tracking-widest text-white mb-2">
            Welcome Back, Founder.
          </h1>
          <p className="text-sm text-text-secondary max-w-xl leading-relaxed">
            Your conglomerate system nodes are fully synced. Monitor production indices, liquidity channels, and supply chains from the command interface.
          </p>
        </div>

        {errorMsg && (
          <div className="mb-6 p-4 bg-red-950/35 border border-red-500/30 rounded text-red-400 text-xs flex items-center gap-3">
            <i className="fa-solid fa-triangle-exclamation"></i>
            <span>{errorMsg}</span>
          </div>
        )}

        {startup && (
          <>
            {/* ===== ROW 1: Company Info + Financial Ledger ===== */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">

              {/* Startup Info Summary HUD Card */}
              <div className="lg:col-span-2 md:col-span-2 glass-card p-6 border border-white/5 flex flex-col justify-between relative bg-black/40">
                <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center">
                  <div className="w-20 h-20 p-3 rounded-lg bg-white/2 border border-white/15 flex items-center justify-center shadow-inner">
                    {renderLogo(startup.logo)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="font-display text-2xl font-black tracking-widest text-white uppercase break-all">
                        {startup.startupName}
                      </h2>
                      <span className="text-[10px] font-display text-greenGlow uppercase tracking-widest px-2 py-0.5 bg-green-950/30 border border-green-500/20 rounded flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-greenGlow animate-pulse"></span>
                        {startup.status}
                      </span>
                    </div>
                    <p className="text-xs text-cyanGlow font-mono mt-1 tracking-wider uppercase">
                      ID: {startup.startupId}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-8 pt-6 border-t border-white/5 text-sm">
                  <div>
                    <span className="text-[10px] font-display uppercase tracking-widest text-text-muted block mb-1">HQ Location</span>
                    <span className="font-bold text-white flex items-center gap-1.5">
                      <span>{COUNTRY_FLAGS[startup.country] || '🌐'}</span>
                      <span>{startup.country}</span>
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-display uppercase tracking-widest text-text-muted block mb-1">Industry Sector</span>
                    <span className="font-bold text-white uppercase tracking-wider text-xs">{startup.industry}</span>
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <span className="text-[10px] font-display uppercase tracking-widest text-text-muted block mb-1">Operation Type</span>
                    <span className="font-bold text-cyanGlow uppercase tracking-widest text-xs">{startup.businessType}</span>
                  </div>
                </div>
              </div>

              {/* Financial Ledger Balance HUD Card */}
              <div className="glass-card p-6 border border-white/5 bg-gradient-to-b from-glassBg to-cyanGlow/5 flex flex-col justify-between relative overflow-hidden">
                <div className="absolute -right-8 -top-8 w-24 h-24 bg-cyanGlow/10 rounded-full blur-2xl pointer-events-none"></div>

                <div>
                  <span className="text-[10px] font-display uppercase tracking-widest text-text-muted block mb-1">Liquidity reserves</span>
                  <h3 className="font-display font-black text-3xl text-greenGlow mt-2 tracking-wide">
                    {formatCurrency(startup.currentBalance, startup.country)}
                  </h3>
                  <p className="text-[10px] text-text-secondary mt-1">
                    Initial Capital: {formatCurrency(startup.startingCapital, startup.country)}
                  </p>
                </div>

                <div className="border-t border-white/5 pt-4 mt-6">
                  <span className="text-[10px] font-display uppercase tracking-widest text-text-muted block mb-2">Warehouse Status</span>
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${inventory.length > 0 ? 'bg-greenGlow animate-pulse' : 'bg-text-muted'}`}></span>
                    <span className="text-xs text-text-secondary">
                      {inventory.length > 0
                        ? `${inventory.reduce((s, i) => s + i.quantity, 0)} items across ${inventory.length} product${inventory.length > 1 ? 's' : ''}`
                        : 'Empty — begin production to stockpile'
                      }
                    </span>
                  </div>
                </div>
              </div>

              {/* Workforce Summary card */}
              <div className="glass-card p-6 border border-white/5 bg-gradient-to-b from-glassBg to-blueGlow/5 flex flex-col justify-between relative overflow-hidden">
                <div className="absolute -right-8 -top-8 w-24 h-24 bg-blueGlow/10 rounded-full blur-2xl pointer-events-none"></div>
                <div>
                  <span className="text-[10px] font-display uppercase tracking-widest text-text-muted block mb-1">Workforce Summary</span>
                  <h3 className="font-display font-black text-3xl text-cyanGlow mt-2 tracking-wide">
                    {totalEmployees}
                  </h3>
                  <p className="text-[10px] text-text-secondary mt-1">
                    Active Staff Members
                  </p>
                </div>
                
                <div className="border-t border-white/5 pt-4 mt-6 space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-text-muted">Monthly Payroll:</span>
                    <span className="font-bold text-red-400 font-mono">-{formatCurrency(monthlyPayroll, startup.country)}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-text-muted">Highest Salary:</span>
                    <span className="font-bold text-white uppercase tracking-wider text-[10px] truncate max-w-[120px]" title={mostExpensiveRole}>{mostExpensiveRoleObj ? mostExpensiveRoleObj.employeeType : 'None'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* ===== ROW 2: Production Center ===== */}
            <div className="mb-8">
              <ProductionCenter
                businessType={startup.businessType}
                token={token}
                onProductionComplete={handleProductionComplete}
                employees={employees}
                inventory={inventory}
              />
            </div>

             {/* ===== ROW 3: Inventory Warehouse ===== */}
            <div className="mb-8">
              <InventoryPanel inventory={inventory} />
            </div>

            {/* ===== ROW 3.5: Supply Chain Status ===== */}
            {!isRetail && products && products.length > 0 && (
              <div className="mb-8">
                <div className="glass-card p-6 border border-white/5 relative bg-black/40">
                  <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-cyanGlow/30 to-transparent"></div>

                  <h3 className="font-display text-xs font-bold uppercase tracking-wider text-text-secondary mb-6 flex items-center gap-2">
                    <i className="fa-solid fa-network-wired text-cyanGlow"></i>
                    Supply Chain Status
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {products.map((product) => {
                      const dep = PRODUCT_DEPENDENCIES[product.id];
                      if (!dep) return null;

                      const inputs = [];
                      let allMet = true;

                      // Check employees
                      if (dep.employees) {
                        for (const [role, reqQty] of Object.entries(dep.employees)) {
                          const hired = employees.find(e => e.employeeType === role)?.quantity || 0;
                          const met = hired >= reqQty;
                          if (!met) allMet = false;
                          inputs.push({
                            name: role,
                            available: hired,
                            required: reqQty,
                            met,
                            type: 'Employee'
                          });
                        }
                      }

                      // Check materials
                      if (dep.materials) {
                        for (const [matId, qtyPerUnit] of Object.entries(dep.materials)) {
                          const needed = qtyPerUnit;
                          const available = inventory.find(i => i.productId === matId)?.quantity || 0;
                          const met = available >= needed;
                          if (!met) allMet = false;
                          const matName = matId.charAt(0).toUpperCase() + matId.slice(1).replace('_', ' ');
                          inputs.push({
                            name: matName,
                            available,
                            required: needed,
                            met,
                            type: 'Material'
                          });
                        }
                      }

                      return (
                        <div key={product.id} className="p-4 bg-black/30 border border-white/5 rounded flex flex-col justify-between hover:border-white/10 transition-colors">
                          <div>
                            <div className="flex items-center gap-3 mb-4">
                              <div className="w-8 h-8 rounded bg-white/2 border border-white/10 flex items-center justify-center text-sm text-text-secondary">
                                <i className={product.icon}></i>
                              </div>
                              <h4 className="font-display text-sm font-bold uppercase tracking-wider text-white">
                                {product.name}
                              </h4>
                            </div>

                            <div className="space-y-2 mb-4">
                              {inputs.map((inp, idx) => (
                                <div key={idx} className="flex justify-between items-center text-xs font-mono">
                                  <span className="text-text-muted flex items-center gap-1">
                                    <i className={inp.type === 'Employee' ? 'fa-solid fa-user-tie text-[9px] text-cyanGlow/70' : 'fa-solid fa-box text-[9px] text-blueGlow/70'}></i>
                                    {inp.name}
                                  </span>
                                  <span className="flex items-center gap-1.5 font-bold">
                                    <span className="text-white">{inp.available}/{inp.required}</span>
                                    {inp.met ? (
                                      <span className="text-greenGlow text-[10px]">✅</span>
                                    ) : (
                                      <span className="text-red-400 text-[10px]">❌</span>
                                    )}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="pt-3 border-t border-white/5 mt-auto">
                            {allMet ? (
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-display uppercase tracking-widest text-greenGlow font-bold flex items-center gap-1.5">
                                  <span className="w-1.5 h-1.5 rounded-full bg-greenGlow animate-ping"></span>
                                  Ready To Produce
                                </span>
                              </div>
                            ) : (
                              <div>
                                <span className="text-[10px] font-display uppercase tracking-widest text-red-400 font-bold block mb-0.5">
                                  Waiting For Suppliers
                                </span>
                                <p className="text-[9px] text-text-muted leading-tight">
                                  This company depends on other businesses in the economy.
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* ===== ROW 4: Workforce Management ===== */}
            <div className="mb-8">
              <div className="glass-card p-6 border border-white/5 relative bg-black/40">
                <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-blueGlow/30 to-transparent"></div>

                <h3 className="font-display text-xs font-bold uppercase tracking-wider text-text-secondary mb-6 flex items-center gap-2">
                  <i className="fa-solid fa-users-gear text-cyanGlow"></i>
                  Workforce Management
                </h3>

                {loadingEmployees ? (
                  <div className="text-center py-6">
                    <i className="fa-solid fa-spinner animate-spin text-cyanGlow text-sm"></i>
                  </div>
                ) : employees.length === 0 ? (
                  <p className="text-xs text-text-muted text-center py-4">No employees required for this business sector.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {employees.map((emp) => (
                      <div key={emp.employeeType} className="p-4 bg-black/30 border border-white/5 rounded flex justify-between items-center hover:border-white/10 transition-colors">
                        <div>
                          <h4 className="font-display text-xs font-bold uppercase tracking-wider text-white">
                            {emp.employeeType}
                          </h4>
                          <span className="text-[10px] text-text-secondary font-mono block mt-1">
                            Salary: {formatCurrency(emp.salary, startup.country)}/month
                          </span>
                          <span className="text-[10px] text-text-muted mt-0.5 block">
                            Currently Hired: <strong className="text-cyanGlow font-mono">{emp.quantity}</strong>
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleFire(emp.employeeType)}
                            disabled={emp.quantity <= 0 || actionInProgress}
                            className={`w-8 h-8 flex items-center justify-center rounded text-sm font-bold border transition-all ${
                              emp.quantity <= 0
                                ? 'bg-white/2 border-white/5 text-text-muted cursor-not-allowed'
                                : 'bg-red-950/20 border-red-500/20 hover:bg-red-900/40 text-red-400'
                            }`}
                          >
                            −
                          </button>
                          <button
                            onClick={() => handleHire(emp.employeeType)}
                            disabled={actionInProgress}
                            className="w-8 h-8 flex items-center justify-center bg-cyanGlow/10 border border-cyanGlow/25 hover:border-cyanGlow/50 hover:bg-cyanGlow/20 text-cyanGlow rounded text-sm font-bold transition-all"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* ===== ROW 4: Business Activity History ===== */}
            <div className="mb-8">
              <div className="glass-card p-6 border border-white/5 relative bg-black/40">
                <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-cyanGlow/30 to-transparent"></div>

                <h3 className="font-display text-xs font-bold uppercase tracking-wider text-text-secondary mb-6 flex items-center gap-2">
                  <i className="fa-solid fa-clock-rotate-left text-cyanGlow"></i>
                  Business Activity History
                </h3>

                {loadingTransactions ? (
                  <div className="text-center py-6">
                    <i className="fa-solid fa-spinner animate-spin text-cyanGlow text-sm"></i>
                  </div>
                ) : transactions.length === 0 ? (
                  <div className="text-center py-8 bg-white/2 border border-white/5 rounded">
                    <i className="fa-solid fa-receipt text-3xl text-text-muted/40 mb-2"></i>
                    <p className="text-xs text-text-secondary">No recent activities recorded.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-white/5">
                    {transactions.slice(0, 10).map((tx) => {
                      const details = getTransactionDisplayDetails(tx, startup?.country);
                      return (
                        <div key={tx._id || tx.createdAt} className="py-4 flex items-center justify-between text-xs hover:bg-white/2 transition-colors px-2 rounded">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs border ${details.iconBg}`}>
                              <i className={details.icon}></i>
                            </div>
                            <div>
                              <div className="font-bold text-white uppercase tracking-wider text-[11px]">
                                {details.actionText}
                              </div>
                              <div className="text-[9px] text-text-muted font-display uppercase tracking-widest mt-0.5">
                                {details.time}
                              </div>
                            </div>
                          </div>
                          {details.amount && (
                            <div className={`font-mono text-xs font-black tabular-nums ${details.amountColor}`}>
                              {details.amount}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* Feature Lock Roadmap Preview Block */}
        <div className="glass-card p-6 border border-white/5 relative bg-white/1">
          <h3 className="font-display text-xs font-bold uppercase tracking-wider text-text-secondary mb-4">
            System Operations Roadmap
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <Link to="/app/marketplace" className="p-4 bg-black/20 border border-cyanGlow/15 hover:border-cyanGlow/40 rounded transition-all block group">
              <div className="flex justify-between items-start">
                <i className="fa-solid fa-store text-lg text-cyanGlow mb-2 group-hover:scale-110 transition-transform"></i>
                <span className="text-[8px] font-display uppercase tracking-widest text-greenGlow">✓ Active</span>
              </div>
              <h4 className="font-display text-xs font-bold uppercase tracking-wider text-white group-hover:text-cyanGlow transition-colors">Marketplace</h4>
              <p className="text-[10px] text-text-secondary mt-1">Trade assets on public exchange lines.</p>
            </Link>
            <div className="p-4 bg-black/20 border border-cyanGlow/15 rounded opacity-100">
              <i className="fa-solid fa-boxes-stacked text-lg text-cyanGlow mb-2"></i>
              <h4 className="font-display text-xs font-bold uppercase tracking-wider text-cyanGlow">Production Engine</h4>
              <p className="text-[10px] text-text-secondary mt-1">Process raw goods into finished products.</p>
              <span className="text-[8px] font-display uppercase tracking-widest text-greenGlow mt-2 inline-block">✓ Active</span>
            </div>
            <div className="p-4 bg-black/20 border border-cyanGlow/15 rounded opacity-100">
              <div className="flex justify-between items-start">
                <i className="fa-solid fa-users text-lg text-cyanGlow mb-2"></i>
                <span className="text-[8px] font-display uppercase tracking-widest text-greenGlow">✓ Active</span>
              </div>
              <h4 className="font-display text-xs font-bold uppercase tracking-wider text-cyanGlow">Employees</h4>
              <p className="text-[10px] text-text-secondary mt-1">Recruit and manage operations crews.</p>
            </div>
            <div className="p-4 bg-black/20 border border-white/5 rounded opacity-40 hover:opacity-60 transition-opacity">
              <i className="fa-solid fa-percent text-lg text-cyanGlow mb-2"></i>
              <h4 className="font-display text-xs font-bold uppercase tracking-wider text-white">Tax Authority</h4>
              <p className="text-[10px] text-text-secondary mt-1">Fulfill tax requirements for HQ country.</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
