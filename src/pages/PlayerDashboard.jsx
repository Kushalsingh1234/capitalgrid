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
import RetailTerminal from '../components/RetailTerminal';
import GlobalRankingsTerminal from '../components/GlobalRankingsTerminal';
import * as transactionService from '../services/transactionService';
import * as employeeService from '../services/employeeService';
import { getProductsForBusiness, isRetailBusiness } from '../data/products';
import { PRODUCT_DEPENDENCIES } from '../data/dependencies';
import { getWorldClock } from '../services/worldClockService';
import MessagesDrawer from '../components/MessagesDrawer';
import ContractsDrawer from '../components/ContractsDrawer';
import AgreementDraftModal from '../components/AgreementDraftModal';
import { getUnreadCount } from '../services/messageService';
import { getAgreementsList } from '../services/agreementService';

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
  const [employeeToFire, setEmployeeToFire] = useState(null);
  const [loadingEmployees, setLoadingEmployees] = useState(true);
  const [actionInProgress, setActionInProgress] = useState(false);
  const [activeTab, setActiveTab] = useState(null);
  const [isFacilityDrawerOpen, setIsFacilityDrawerOpen] = useState(false);
  const [selectedBuilding, setSelectedBuilding] = useState(null);
  const [producingState, setProducingState] = useState({});
  const [currentView, setCurrentView] = useState('world');

  // World Clock state definitions
  const [worldClockSnapshot, setWorldClockSnapshot] = useState(null);
  const [lastSyncRealTime, setLastSyncRealTime] = useState(0);
  const [interpolatedTimeStr, setInterpolatedTimeStr] = useState('Loading Clock...');
  const [marketStatus, setMarketStatus] = useState('CLOSED');
  const [currentGameTime, setCurrentGameTime] = useState(null);

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

  const fetchDashboardData = useCallback(async () => {
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
      
      const txResponse = await transactionService.getMyTransactions(token);
      if (txResponse.success && txResponse.transactions) {
        setTransactions(txResponse.transactions);
      }
      
      const empResponse = await employeeService.getMyEmployees(token);
      if (empResponse.success && empResponse.employees) {
        setEmployees(empResponse.employees);
      }
    } catch (err) {
      console.error('[Dashboard Fetch Error]', err);
      setErrorMsg('Network error loading startup details.');
    } finally {
      setLoadingStartup(false);
      setLoadingTransactions(false);
      setLoadingEmployees(false);
    }
  }, [token]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  const [pendingAgreementsCount, setPendingAgreementsCount] = useState(0);
  const [agreementDraftContract, setAgreementDraftContract] = useState(null);
  const [isAgreementDraftOpen, setIsAgreementDraftOpen] = useState(false);

  const fetchUnreadCount = async () => {
    if (!token) return;
    try {
      const data = await getUnreadCount(token);
      if (data.success) {
        setUnreadMessagesCount(data.count || 0);
      }
    } catch (err) {
      console.error('Error fetching B2B unread counter:', err);
    }
  };

  const fetchPendingAgreementsCount = async () => {
    if (!token || !startup) return;
    try {
      const offersData = await getAgreementsList({ tab: 'Offers', page: 1, limit: 100 }, token);
      let offersCount = 0;
      if (offersData.success) {
        const incomingPending = offersData.agreements.filter(a => 
          a.status === 'Pending' && 
          String(a.createdBy?._id || a.createdBy) !== String(startup._id)
        );
        offersCount = incomingPending.length;
      }

      const activeData = await getAgreementsList({ tab: 'Active', page: 1, limit: 100 }, token);
      let deliveriesCount = 0;
      if (activeData.success) {
        const deliveries = activeData.pendingDeliveries || [];
        const incomingDeliveries = deliveries.filter(d => {
          const agreement = activeData.agreements.find(a => String(a._id) === String(d.agreementId));
          if (!agreement) return false;
          return String(agreement.buyer?._id || agreement.buyer) === String(startup._id);
        });
        deliveriesCount = incomingDeliveries.length;
      }

      setPendingAgreementsCount(offersCount + deliveriesCount);
    } catch (err) {
      console.error('Error fetching pending agreements count:', err);
    }
  };

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 15000);
    return () => clearInterval(interval);
  }, [token]);

  useEffect(() => {
    fetchPendingAgreementsCount();
    const interval = setInterval(fetchPendingAgreementsCount, 20000);
    return () => clearInterval(interval);
  }, [token, startup]);

  useEffect(() => {
    if (activeTab === 'Messages') {
      fetchUnreadCount();
    }
    if (activeTab === 'Contracts') {
      fetchPendingAgreementsCount();
    }
  }, [activeTab]);

  // Handle start-conversation external triggers
  useEffect(() => {
    const handleStartB2B = (e) => {
      const { targetCompanyId, category, contractRef } = e.detail;
      setCurrentView('world');
      setActiveTab('Messages');
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('trigger-start-conversation', { 
          detail: { targetCompanyId, category, contractRef } 
        }));
      }, 50);
    };

    const handleStartDraft = (e) => {
      const { contract } = e.detail;
      setAgreementDraftContract(contract);
      setIsAgreementDraftOpen(true);
    };

    const handleRefresh = () => {
      fetchDashboardData();
      fetchPendingAgreementsCount();
      fetchUnreadCount();
    };

    window.addEventListener('start-b2b-conversation', handleStartB2B);
    window.addEventListener('start-agreement-draft', handleStartDraft);
    window.addEventListener('refresh-dashboard-data', handleRefresh);
    
    return () => {
      window.removeEventListener('start-b2b-conversation', handleStartB2B);
      window.removeEventListener('start-agreement-draft', handleStartDraft);
      window.removeEventListener('refresh-dashboard-data', handleRefresh);
    };
  }, [fetchDashboardData, startup]);

  // World Clock Sync & Interpolation loops
  useEffect(() => {
    const syncClock = async () => {
      try {
        const res = await getWorldClock();
        if (res.success && res.data) {
          setWorldClockSnapshot(res.data);
          setLastSyncRealTime(Date.now());
          setMarketStatus(res.data.marketStatus);
        }
      } catch (err) {
        console.error('[World Clock Sync Error]', err);
      }
    };

    syncClock();
    const syncInterval = setInterval(syncClock, 10000);
    return () => clearInterval(syncInterval);
  }, []);

  useEffect(() => {
    if (!worldClockSnapshot) return;

    const updateInterpolation = () => {
      const elapsedRealMs = Date.now() - lastSyncRealTime;
      const elapsedGameMs = elapsedRealMs * worldClockSnapshot.speedMultiplier;
      const interpolatedTimestamp = worldClockSnapshot.timestamp + elapsedGameMs;
      
      const gameDate = new Date(interpolatedTimestamp);
      const year = gameDate.getFullYear();
      const monthNum = gameDate.getMonth() + 1;
      const day = gameDate.getDate();
      const hour = gameDate.getHours();
      const minute = gameDate.getMinutes();
      
      const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];
      const monthName = monthNames[gameDate.getMonth()];
      const format2Digits = (num) => String(num).padStart(2, '0');
      const formatted = `${day} ${monthName} ${year} | ${format2Digits(hour)}:${format2Digits(minute)}`;
      
      setInterpolatedTimeStr(formatted);
      setMarketStatus((hour >= 8 && hour < 20) ? 'OPEN' : 'CLOSED');
      setCurrentGameTime(gameDate);
    };

    updateInterpolation();
    const tickInterval = setInterval(updateInterpolation, 1000);
    return () => clearInterval(tickInterval);
  }, [worldClockSnapshot, lastSyncRealTime]);



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

  const monthAbbrs = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const shortTimeStr = currentGameTime 
    ? `${currentGameTime.getDate()} ${monthAbbrs[currentGameTime.getMonth()]} | ${String(currentGameTime.getHours()).padStart(2, '0')}:${String(currentGameTime.getMinutes()).padStart(2, '0')}`
    : 'Loading...';

  // Production and inventory are now actively bound inside the FacilityManagementDrawer

  return (
    <div className="game-world-container text-white font-body select-none">
      {/* Background Grid Pattern Overlay */}
      <div className="grid-overlay opacity-30"></div>
      <div className="glow-radial-overlay opacity-20"></div>

      {/* TOP BAR HUD */}
      <header className="topbar-horizontal">
        <div className="flex items-center gap-2 sm:gap-4">
          <div 
            onClick={handleLogoClick} 
            className="h-6 sm:h-7 hover:opacity-85 transition-opacity cursor-pointer"
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

        <div className="flex items-center gap-1.5 sm:gap-4 md:gap-6">
          {/* WORLD CLOCK */}
          <div className="flex items-center gap-1 sm:gap-2 px-1.5 sm:px-3 py-0.5 sm:py-1.5 bg-black/40 border border-white/5 rounded-md font-mono text-[9px] sm:text-[11px] tracking-wide text-text-secondary select-none">
            <span className="text-[10px] sm:text-xs shrink-0">🌍</span>
            <span className="hidden md:inline font-bold text-white whitespace-nowrap">
              {interpolatedTimeStr}
            </span>
            <span className="inline md:hidden font-bold text-white whitespace-nowrap">
              {shortTimeStr}
            </span>
            <span className={`hidden md:inline-block text-[7.5px] md:text-[9.5px] font-display font-extrabold uppercase px-1 md:px-1.5 py-0.2 md:py-0.5 rounded border ${
              marketStatus === 'OPEN'
                ? 'bg-green-950/20 text-greenGlow border-green-500/20'
                : 'bg-red-950/20 text-red-400 border-red-500/20'
            }`}>
              {marketStatus}
            </span>
          </div>

          {/* CURRENT BALANCE */}
          {startup && (
            <div className="flex items-center gap-1.5 px-1.5 sm:px-3 py-1 sm:py-1.5 bg-green-950/20 border border-green-500/20 rounded-md">
              <span className="hidden md:inline text-[9px] font-display uppercase tracking-widest text-text-secondary">Current Balance</span>
              <i className="fa-solid fa-wallet text-greenGlow text-[10px] sm:text-xs"></i>
              <span className="font-display font-black text-[10px] sm:text-xs md:text-sm text-greenGlow leading-none">
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
            className="flex md:hidden w-7 h-7 rounded border border-white/5 hover:border-white/15 items-center justify-center text-text-muted hover:text-white transition-colors cursor-pointer"
            title="Notifications"
          >
            <i className="fa-solid fa-bell text-[10px]"></i>
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
        {currentView !== 'marketplace' && currentView !== 'finance' && currentView !== 'retail' && currentView !== 'global' && (
          <nav className="sidebar-bottom">
            {[
              { id: 'Dashboard', icon: 'fa-chart-pie', label: 'Overview' },
              { id: 'Company', icon: 'fa-building', label: 'Company' },
              { id: 'Employees', icon: 'fa-users', label: 'Employees' },
              { id: 'Marketplace', icon: 'fa-shop', label: 'Market' },
              { id: 'Finance', icon: 'fa-wallet', label: 'Finance' },
              { id: 'Global', icon: 'fa-globe', label: 'Global' },
              { id: 'Contracts', icon: 'fa-file-signature', label: 'Contracts' },
              { id: 'Messages', icon: 'fa-comments', label: 'Messages' },
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
                  } else if (tab.id === 'Global') {
                    setActiveTab(null);
                    setCurrentView(currentView === 'global' ? 'world' : 'global');
                  } else {
                    setCurrentView('world');
                    setActiveTab(activeTab === tab.id ? null : tab.id);
                  }
                }}
                className={`sidebar-nav-item relative ${
                  tab.id === 'Marketplace'
                    ? (currentView === 'marketplace' ? 'active' : '')
                    : tab.id === 'Finance'
                    ? (currentView === 'finance' ? 'active' : '')
                    : tab.id === 'Global'
                    ? (currentView === 'global' ? 'active' : '')
                    : (activeTab === tab.id ? 'active' : '')
                }`}
                title={tab.label}
              >
                <i className={`fa-solid ${tab.icon}`}></i>
                {tab.id === 'Messages' && unreadMessagesCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full text-[8px] min-w-3.5 h-3.5 px-0.5 flex items-center justify-center font-mono font-bold leading-none select-none border border-black/40">
                    {unreadMessagesCount}
                  </span>
                )}
                {tab.id === 'Contracts' && pendingAgreementsCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full text-[8px] min-w-3.5 h-3.5 px-0.5 flex items-center justify-center font-mono font-bold leading-none select-none border border-black/40">
                    {pendingAgreementsCount}
                  </span>
                )}
              </button>
            ))}
          </nav>
        )}

        {/* MAIN GAME WORLD AREA */}
        <main 
          className={`world-viewport ${activeTab || isFacilityDrawerOpen ? 'drawer-open' : ''}`}
          style={currentView === 'marketplace' || currentView === 'finance' || currentView === 'retail' || currentView === 'global' ? { overflow: 'auto', alignItems: 'flex-start', justifyContent: 'flex-start', padding: 0 } : {}}
        >
          {/* GameWorld wrapper for hiding but maintaining mounted state */}
          <div className={`w-full h-full ${currentView === 'marketplace' || currentView === 'finance' || currentView === 'retail' || currentView === 'global' ? 'absolute pointer-events-none invisible opacity-0' : ''}`}>
            {startup ? (
              <GameWorld 
                startup={startup} 
                onBuildingClick={(buildingData) => {
                  setActiveTab(null);
                  setSelectedBuilding(buildingData);
                  if (isRetail) {
                    setCurrentView('retail');
                    setIsFacilityDrawerOpen(false);
                  } else {
                    setIsFacilityDrawerOpen(true);
                    setCurrentView('world');
                  }
                  fetchDashboardData();
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

          {/* Full Screen Retail Dashboard Terminal */}
          {currentView === 'retail' && (
            <RetailTerminal
              startup={startup}
              employees={employees}
              token={token}
              onClose={() => setCurrentView('world')}
              onRetailAction={fetchDashboardData}
            />
          )}

          {/* Full Screen Global Company Rankings Terminal */}
          {currentView === 'global' && (
            <GlobalRankingsTerminal
              startup={startup}
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
          employeeToFire={employeeToFire}
          setEmployeeToFire={setEmployeeToFire}
          user={user}
          onLogout={handleLogout}
          token={token}
        />

        {/* MESSAGES DRAWER */}
        <MessagesDrawer
          isOpen={activeTab === 'Messages'}
          onClose={() => setActiveTab(null)}
          startup={startup}
          token={token}
        />

        {/* CONTRACTS DRAWER */}
        <ContractsDrawer
          isOpen={activeTab === 'Contracts'}
          onClose={() => setActiveTab(null)}
          startup={startup}
          token={token}
        />

        {/* AGREEMENT DRAFT MODAL */}
        <AgreementDraftModal
          isOpen={isAgreementDraftOpen}
          onClose={() => {
            setIsAgreementDraftOpen(false);
            setAgreementDraftContract(null);
          }}
          contract={agreementDraftContract}
          startup={startup}
          token={token}
          onSubmitSuccess={() => {
            setIsAgreementDraftOpen(false);
            setAgreementDraftContract(null);
            fetchPendingAgreementsCount();
            setActiveTab('Contracts');
          }}
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
          worldClockSnapshot={worldClockSnapshot}
          currentGameTime={currentGameTime}
        />

        {/* Severance Package Warning Dialog Overlay (Centered on the entire screen) */}
        {employeeToFire && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6 z-[999] animate-fade-in">
            <div className="glass-card max-w-sm w-full p-6 border border-red-500/20 bg-gradient-to-b from-[#130708] to-[#0a0505] rounded-xl shadow-2xl flex flex-col gap-4 text-center">
              <div className="w-12 h-12 bg-red-950/30 border border-red-500/30 rounded-full flex items-center justify-center text-red-400 mx-auto animate-pulse">
                <i className="fa-solid fa-triangle-exclamation text-lg"></i>
              </div>
              <div>
                <h3 className="font-display font-extrabold text-sm uppercase text-white tracking-wider">
                  Severance Package Warning
                </h3>
                <p className="text-xs text-text-secondary mt-2 leading-relaxed font-body">
                  Firing 1 <strong className="text-white">{employeeToFire.employeeType}</strong> requires paying a severance fee equal to one month's salary:
                </p>
                <div className="mt-3 bg-black/45 border border-white/5 py-2 px-4 rounded-lg inline-block font-mono">
                  <span className="text-red-400 font-bold text-sm">
                    -{formatCurrency(employeeToFire.salary, startup?.country)}
                  </span>
                </div>
                <p className="text-[10px] text-text-muted mt-3 italic font-body">
                  This action is irreversible and the amount will be immediately deducted from your cash balance.
                </p>
              </div>
              <div className="flex gap-3 mt-2">
                <button
                  onClick={() => setEmployeeToFire(null)}
                  className="flex-1 py-2 border border-white/10 hover:border-white/20 bg-white/2 hover:bg-white/5 text-text-secondary hover:text-white text-xs font-display font-bold uppercase tracking-wider rounded transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    handleFire(employeeToFire.employeeType);
                    setEmployeeToFire(null);
                  }}
                  className="flex-1 py-2 bg-red-950/20 border border-red-500/25 hover:bg-red-900/30 text-red-400 text-xs font-display font-bold uppercase tracking-wider rounded transition-all cursor-pointer"
                >
                  Fire Employee
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
