import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Logo from '../components/Logo';
import ThemeToggle from '../components/ThemeToggle';
import GameWorld from '../components/GameWorld';
import DashboardDrawer from '../components/DashboardDrawer';
import * as startupService from '../services/startupService';
import ProductionCenter from '../components/ProductionCenter';
import InventoryPanel from '../components/InventoryPanel';
import FacilityManagementDrawer from '../components/FacilityManagementDrawer';
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
  const [activeTab, setActiveTab] = useState(null);
  const [isFacilityDrawerOpen, setIsFacilityDrawerOpen] = useState(false);
  const [selectedBuilding, setSelectedBuilding] = useState(null);

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

    // Production and inventory are now actively bound inside the FacilityManagementDrawer

  return (
    <div className="game-world-container text-white font-body select-none">
      {/* Background Grid Pattern Overlay */}
      <div className="grid-overlay opacity-30"></div>
      <div className="glow-radial-overlay opacity-20"></div>

      {/* TOP BAR HUD */}
      <header className="topbar-horizontal">
        <div className="flex items-center gap-4">
          <Link to="/" className="h-7 hover:opacity-85 transition-opacity">
            <Logo className="h-full" />
          </Link>
          {startup && (
            <div className="flex items-center gap-2 border-l border-white/10 pl-4">
              <span className="text-xs font-display font-extrabold uppercase tracking-widest text-white">
                {startup.startupName}
              </span>
              <span className="text-[10px] text-text-secondary flex items-center gap-1 bg-white/2 px-2 py-0.5 rounded border border-white/5">
                <span>{COUNTRY_FLAGS[startup.country] || '🌐'}</span>
                <span>{startup.country}</span>
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-6">
          {/* LIQUIDITY BALANCE */}
          {startup && (
            <div className="flex items-center gap-2.5 px-3.5 py-1.5 bg-green-950/20 border border-green-500/20 rounded-md">
              <span className="text-[9px] font-display uppercase tracking-widest text-text-secondary">Liquidity Reserves</span>
              <span className="font-display font-black text-sm text-greenGlow leading-none">
                {formatCurrency(startup.currentBalance, startup.country)}
              </span>
            </div>
          )}

          {/* UTILITIES & SETTINGS */}
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <button className="w-8 h-8 rounded border border-white/5 hover:border-white/15 flex items-center justify-center text-text-muted hover:text-white transition-colors cursor-pointer" title="System Notifications (Placeholder)">
              <i className="fa-solid fa-bell text-xs"></i>
            </button>
            <button className="w-8 h-8 rounded border border-white/5 hover:border-white/15 flex items-center justify-center text-text-muted hover:text-white transition-colors cursor-pointer" title="Corporate Settings (Placeholder)">
              <i className="fa-solid fa-sliders text-xs"></i>
            </button>
            {user?.profilePicture && (
              <img src={user.profilePicture} alt="Profile" className="w-7 h-7 rounded-full border border-cyanGlow/30" />
            )}
            <button
              onClick={handleLogout}
              className="px-2.5 py-1.5 bg-red-950/20 border border-red-500/30 hover:bg-red-900/40 text-red-400 text-[10px] font-display uppercase tracking-widest rounded transition-all flex items-center gap-1.5"
            >
              Exit <i className="fa-solid fa-power-off text-[10px]"></i>
            </button>
          </div>
        </div>
      </header>

      <div className="main-game-layout">
        {/* LEFT VERTICAL SIDEBAR */}
        <nav className="sidebar-vertical">
          {[
            { id: 'Dashboard', icon: 'fa-chart-pie', label: 'Overview' },
            { id: 'Company', icon: 'fa-building', label: 'Company' },
            { id: 'Employees', icon: 'fa-users', label: 'Employees' },
            { id: 'Marketplace', icon: 'fa-shop', label: 'Market' },
            { id: 'Finance', icon: 'fa-wallet', label: 'Finance' },
            { id: 'Profile', icon: 'fa-user', label: 'Profile' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setIsFacilityDrawerOpen(false);
                setSelectedBuilding(null);
                setActiveTab(activeTab === tab.id ? null : tab.id);
              }}
              className={`sidebar-nav-item ${activeTab === tab.id ? 'active' : ''}`}
            >
              <i className={`fa-solid ${tab.icon} text-sm`}></i>
              <span className="sidebar-nav-label">{tab.label}</span>
            </button>
          ))}
        </nav>

        {/* MAIN GAME WORLD AREA */}
        <main className={`world-viewport ${activeTab || isFacilityDrawerOpen ? 'drawer-open' : ''}`}>
          {startup ? (
            <GameWorld 
              startup={startup} 
              onBuildingClick={(buildingData) => {
                setActiveTab(null);
                setSelectedBuilding(buildingData);
                setIsFacilityDrawerOpen(true);
              }}
            />
          ) : (
            <div className="flex flex-col items-center justify-center gap-4 text-center">
              <div className="w-10 h-10 border-4 border-t-cyanGlow border-r-cyanGlow/40 border-b-cyanGlow/10 border-l-cyanGlow/20 rounded-full animate-spin mx-auto"></div>
              <p className="text-xs text-text-secondary">Reconnecting virtual map interface...</p>
            </div>
          )}
          {/* Dim Overlay blocking interaction on canvas but keeping Phaser running */}
          {isFacilityDrawerOpen && (
            <div className="absolute inset-0 bg-black/15 z-10 pointer-events-auto cursor-default animate-fade-in" />
          )}
        </main>

        {/* SLIDING PANEL DRAWERS */}
        <DashboardDrawer 
          activeTab={activeTab} 
          isOpen={activeTab !== null} 
          onClose={() => setActiveTab(null)} 
          startup={startup} 
          inventory={inventory} 
          transactions={transactions} 
          employees={employees} 
        />

        {/* FACILITY MANAGEMENT DRAWER */}
        <FacilityManagementDrawer
          isOpen={isFacilityDrawerOpen}
          onClose={() => {
            setIsFacilityDrawerOpen(false);
            setSelectedBuilding(null);
          }}
          building={selectedBuilding}
          startup={startup}
          inventory={inventory}
          employees={employees}
          token={token}
          onProductionComplete={handleProductionComplete}
        />
      </div>
    </div>
  );
}
