import React, { useState, useEffect, useCallback } from 'react';
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
import MarketplaceInterface from '../components/MarketplaceInterface';
import FinanceTerminal from '../components/FinanceTerminal';
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
  'India': '🇮🇳', 'india': '🇮🇳', 'IN': '🇮🇳', 'in': '🇮🇳', 'IND': '🇮🇳', 'ind': '🇮🇳',
  'United States': '🇺🇸', 'united states': '🇺🇸', 'US': '🇺🇸', 'us': '🇺🇸', 'USA': '🇺🇸', 'usa': '🇺🇸',
  'United Kingdom': '🇬🇧', 'united kingdom': '🇬🇧', 'UK': '🇬🇧', 'uk': '🇬🇧', 'GB': '🇬🇧', 'gb': '🇬🇧', 'GBR': '🇬🇧', 'gbr': '🇬🇧',
  'Germany': '🇩🇪', 'germany': '🇩🇪', 'DE': '🇩🇪', 'de': '🇩🇪', 'DEU': '🇩🇪', 'deu': '🇩🇪',
  'Japan': '🇯🇵', 'japan': '🇯🇵', 'JP': '🇯🇵', 'jp': '🇯🇵', 'JPN': '🇯🇵', 'jpn': '🇯🇵',
  'Brazil': '🇧🇷', 'brazil': '🇧🇷', 'BR': '🇧🇷', 'br': '🇧🇷', 'BRA': '🇧🇷', 'bra': '🇧🇷',
  'Australia': '🇦🇺', 'australia': '🇦🇺', 'AU': '🇦🇺', 'au': '🇦🇺', 'AUS': '🇦🇺', 'aus': '🇦🇺'
};

const formatCurrency = (amount, countryName) => {
  const symbol = CURRENCY_SYMBOLS[countryName] || '$';
  return `${symbol}${amount?.toLocaleString()}`;
};

const renderFlagImage = (countryName) => {
  if (!countryName) return null;
  const normalized = countryName.toLowerCase().trim();
  const codes = {
    'india': 'in', 'in': 'in', 'ind': 'in',
    'united states': 'us', 'us': 'us', 'usa': 'us',
    'united kingdom': 'gb', 'uk': 'gb', 'gb': 'gb', 'gbr': 'gb',
    'germany': 'de', 'de': 'de', 'deu': 'de',
    'japan': 'jp', 'jp': 'jp', 'jpn': 'jp',
    'brazil': 'br', 'br': 'br', 'bra': 'br',
    'australia': 'au', 'au': 'au', 'aus': 'au'
  };
  const code = codes[normalized];
  if (!code) return <span className="text-sm ml-1.5 shrink-0">🌐</span>;
  return (
    <img 
      src={`https://flagcdn.com/w40/${code}.png`} 
      alt={countryName} 
      className="w-5 h-3.5 object-cover rounded-sm border border-white/10 ml-1.5 shrink-0" 
      title={countryName}
    />
  );
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
    if (tx.buyerStartupName === 'National Commodity Reserve') {
      actionText = `Sold ${tx.quantity} ${tx.productName} to NCR`;
    } else {
      actionText = `Sold ${tx.quantity} ${tx.productName} to ${tx.buyerStartupName}`;
    }
    amount = `+${symbol}${tx.totalAmount?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    amountColor = 'text-greenGlow';
  } else if (tx.transactionType === 'Purchase') {
    icon = 'fa-solid fa-cart-shopping text-red-400';
    iconBg = 'bg-red-950/20 border-red-500/20 text-red-400';
    if (tx.sellerStartupName === 'National Commodity Reserve') {
      actionText = `Purchased ${tx.quantity} ${tx.productName} from NCR`;
    } else {
      actionText = `Bought ${tx.quantity} ${tx.productName} from ${tx.sellerStartupName}`;
    }
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
  const [producingState, setProducingState] = useState({});
  const [currentView, setCurrentView] = useState('world');

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleLogoClick = (e) => {
    if (e) e.preventDefault();
    setActiveTab(null);
    setIsFacilityDrawerOpen(false);
    setSelectedBuilding(null);
    setCurrentView('world');
    window.dispatchEvent(new CustomEvent('center-player-building'));
  };

  useEffect(() => {
    const fetchStartupDetails = async () => {
      try {
        if (!token) return;
        const response = await startupService.getMyStartup(token);
        if (response.success && response.startup) {
          const startupData = {
            ...response.startup,
            tasks: response.tasks || [],
            serverTime: response.serverTime,
            fetchedAt: Date.now()
          };
          setStartup(startupData);
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

  // Refresh all dashboard data (called after marketplace trades)
  const fetchDashboardData = async () => {
    try {
      if (!token) return;
      const startupRes = await startupService.getMyStartup(token);
      if (startupRes.success && startupRes.startup) {
        const startupData = {
          ...startupRes.startup,
          tasks: startupRes.tasks || [],
          serverTime: startupRes.serverTime,
          fetchedAt: Date.now()
        };
        setStartup(startupData);
        setInventory(startupRes.startup.inventory || []);
      }
      const txRes = await transactionService.getMyTransactions(token);
      if (txRes.success && txRes.transactions) {
        setTransactions(txRes.transactions);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Called by ProductionCenter when a batch completes or starts
  const handleProductionComplete = useCallback(async (updatedInventory, updatedTasks, responseServerTime) => {
    setInventory(updatedInventory);
    // Also update the local startup reference
    setStartup(prev => {
      if (!prev) return prev;
      const next = { ...prev, inventory: updatedInventory };
      if (updatedTasks) {
        next.tasks = updatedTasks;
      }
      if (responseServerTime) {
        next.serverTime = responseServerTime;
        next.fetchedAt = Date.now();
      }
      return next;
    });
    // Fetch updated transactions list
    try {
      const response = await transactionService.getMyTransactions(token);
      if (response.success && response.transactions) {
        setTransactions(response.transactions);
      }
    } catch (err) {
      console.error(err);
    }
  }, [token]);

  const handleHire = async (employeeType, quantity = 1) => {
    setActionInProgress(true);
    setErrorMsg('');
    try {
      const response = await employeeService.hireEmployee(employeeType, token, quantity);
      if (response.success && response.employees) {
        setEmployees(response.employees);
        await fetchDashboardData();
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
        await fetchDashboardData();
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
          <div 
            onClick={handleLogoClick} 
            className="h-7 hover:opacity-85 transition-opacity cursor-pointer"
            title="Focus corporate headquarters"
          >
            <Logo className="h-full" />
          </div>
          {user && (
            <div className="hidden md:flex items-center gap-2 border-l border-white/10 pl-4">
              <span className="text-xs font-display font-extrabold uppercase tracking-widest text-white">
                {user.fullName || 'Founder'}
              </span>
              {renderFlagImage(user.country || startup?.country)}
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 md:gap-6">
          {/* CURRENT BALANCE */}
          {startup && (
            <div className="flex items-center gap-2 px-2.5 py-1.5 md:px-3.5 md:py-1.5 bg-green-950/20 border border-green-500/20 rounded-md">
              <span className="hidden md:inline text-[9px] font-display uppercase tracking-widest text-text-secondary">Current Balance</span>
              <i className="inline md:hidden fa-solid fa-wallet text-greenGlow text-xs"></i>
              <span className="font-display font-black text-xs md:text-sm text-greenGlow leading-none">
                {formatCurrency(startup.currentBalance, startup.country)}
              </span>
            </div>
          )}

          {/* MOBILE NOTIFICATION BUTTON */}
          <button 
            onClick={() => {
              setIsFacilityDrawerOpen(false);
              setSelectedBuilding(null);
              setActiveTab(activeTab === 'Notifications' ? null : 'Notifications');
              setCurrentView('world');
            }}
            className="flex md:hidden w-8 h-8 rounded border border-white/5 hover:border-white/15 items-center justify-center text-text-muted hover:text-white transition-colors cursor-pointer"
            title="Notifications"
          >
            <i className="fa-solid fa-bell text-xs"></i>
          </button>

          {/* UTILITIES & SETTINGS */}
          <div className="hidden md:flex items-center gap-3">
            <ThemeToggle />
            <button 
              onClick={() => {
                setIsFacilityDrawerOpen(false);
                setSelectedBuilding(null);
                setActiveTab(activeTab === 'Notifications' ? null : 'Notifications');
                setCurrentView('world');
              }}
              className="w-8 h-8 rounded border border-white/5 hover:border-white/15 flex items-center justify-center text-text-muted hover:text-white transition-colors cursor-pointer" 
              title="Notifications"
            >
              <i className="fa-solid fa-bell text-xs"></i>
            </button>
            <button className="w-8 h-8 rounded border border-white/5 hover:border-white/15 flex items-center justify-center text-text-muted hover:text-white transition-colors cursor-pointer" title="Corporate Settings (Placeholder)">
              <i className="fa-solid fa-sliders text-xs"></i>
            </button>
            {user?.profilePicture && (
              <img src={user.profilePicture} alt="Profile" className="w-7 h-7 rounded-full border border-cyanGlow/30" />
            )}
            {/* Exit/Logout relocated to Profile Tab */}
          </div>
        </div>
      </header>

      <div className="main-game-layout relative">
        {/* BOTTOM HORIZONTAL SIDEBAR */}
        {currentView !== 'marketplace' && currentView !== 'finance' && (
          <nav className="sidebar-bottom">
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
                  if (tab.id === 'Marketplace') {
                    setActiveTab(null);
                    setCurrentView(currentView === 'marketplace' ? 'world' : 'marketplace');
                  } else if (tab.id === 'Finance') {
                    setActiveTab(null);
                    setCurrentView(currentView === 'finance' ? 'world' : 'finance');
                  } else {
                    setCurrentView('world');
                    setActiveTab(activeTab === tab.id ? null : tab.id);
                  }
                }}
                className={`sidebar-nav-item ${
                  tab.id === 'Marketplace'
                    ? (currentView === 'marketplace' ? 'active' : '')
                    : tab.id === 'Finance'
                    ? (currentView === 'finance' ? 'active' : '')
                    : (activeTab === tab.id ? 'active' : '')
                }`}
                title={tab.label}
              >
                <i className={`fa-solid ${tab.icon}`}></i>
              </button>
            ))}
          </nav>
        )}

        {/* MAIN GAME WORLD AREA */}
        <main 
          className={`world-viewport ${activeTab || isFacilityDrawerOpen ? 'drawer-open' : ''}`}
          style={currentView === 'marketplace' || currentView === 'finance' ? { overflow: 'auto', alignItems: 'flex-start', justifyContent: 'flex-start', padding: 0 } : {}}
        >
          {/* GameWorld wrapper for hiding but maintaining mounted state */}
          <div className={`w-full h-full ${currentView === 'marketplace' || currentView === 'finance' ? 'absolute pointer-events-none invisible opacity-0' : ''}`}>
            {startup ? (
              <GameWorld 
                startup={startup} 
                onBuildingClick={(buildingData) => {
                  setActiveTab(null);
                  setSelectedBuilding(buildingData);
                  setIsFacilityDrawerOpen(true);
                  setCurrentView('world');
                }}
                disableClicks={currentView !== 'world' || activeTab !== null || isFacilityDrawerOpen}
              />
            ) : (
              <div className="flex flex-col items-center justify-center gap-4 text-center h-full">
                <div className="w-10 h-10 border-4 border-t-cyanGlow border-r-cyanGlow/40 border-b-cyanGlow/10 border-l-cyanGlow/20 rounded-full animate-spin mx-auto animate-pulse"></div>
                <p className="text-xs text-text-secondary">Reconnecting virtual map interface...</p>
              </div>
            )}
          </div>

          {/* Full Screen Trading Exchange Terminal */}
          {currentView === 'marketplace' && (
            <MarketplaceInterface
              startup={startup}
              inventory={inventory}
              transactions={transactions}
              onMarketAction={fetchDashboardData}
              token={token}
              onClose={() => setCurrentView('world')}
            />
          )}

          {/* Full Screen Corporate Finance Terminal */}
          {currentView === 'finance' && (
            <FinanceTerminal
              startup={startup}
              inventory={inventory}
              transactions={transactions}
              employees={employees}
              token={token}
              onClose={() => setCurrentView('world')}
            />
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
          producingState={producingState}
          onHire={handleHire}
          onFire={handleFire}
          user={user}
          onLogout={handleLogout}
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
          producingState={producingState}
          onProducingStateChange={setProducingState}
        />
      </div>
    </div>
  );
}
