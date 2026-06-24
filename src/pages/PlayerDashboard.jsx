import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import * as startupService from '../services/startupService';
import ProductionCenter from '../components/ProductionCenter';
import InventoryPanel from '../components/InventoryPanel';

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

export default function PlayerDashboard() {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();

  const [startup, setStartup] = useState(null);
  const [loadingStartup, setLoadingStartup] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [inventory, setInventory] = useState([]);

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

    fetchStartupDetails();
  }, [token]);

  // Called by ProductionCenter when a batch completes
  const handleProductionComplete = (updatedInventory) => {
    setInventory(updatedInventory);
    // Also update the local startup reference
    if (startup) {
      setStartup(prev => ({ ...prev, inventory: updatedInventory }));
    }
  };

  const formatCurrency = (amount, countryName) => {
    const symbol = CURRENCY_SYMBOLS[countryName] || '$';
    return `${symbol}${amount?.toLocaleString()}`;
  };

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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">

              {/* Startup Info Summary HUD Card */}
              <div className="md:col-span-2 glass-card p-6 border border-white/5 flex flex-col justify-between relative bg-black/40">
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
            </div>

            {/* ===== ROW 2: Production Center ===== */}
            <div className="mb-8">
              <ProductionCenter
                businessType={startup.businessType}
                token={token}
                onProductionComplete={handleProductionComplete}
              />
            </div>

            {/* ===== ROW 3: Inventory Warehouse ===== */}
            <div className="mb-8">
              <InventoryPanel inventory={inventory} />
            </div>
          </>
        )}

        {/* Feature Lock Roadmap Preview Block */}
        <div className="glass-card p-6 border border-white/5 relative bg-white/1">
          <h3 className="font-display text-xs font-bold uppercase tracking-wider text-text-secondary mb-4">
            System Operations Roadmap
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-black/20 border border-white/5 rounded opacity-40 hover:opacity-60 transition-opacity">
              <i className="fa-solid fa-store text-lg text-cyanGlow mb-2"></i>
              <h4 className="font-display text-xs font-bold uppercase tracking-wider text-white">Marketplace</h4>
              <p className="text-[10px] text-text-secondary mt-1">Trade assets on public exchange lines.</p>
            </div>
            <div className="p-4 bg-black/20 border border-cyanGlow/15 rounded opacity-100">
              <i className="fa-solid fa-boxes-stacked text-lg text-cyanGlow mb-2"></i>
              <h4 className="font-display text-xs font-bold uppercase tracking-wider text-cyanGlow">Production Engine</h4>
              <p className="text-[10px] text-text-secondary mt-1">Process raw goods into finished products.</p>
              <span className="text-[8px] font-display uppercase tracking-widest text-greenGlow mt-2 inline-block">✓ Active</span>
            </div>
            <div className="p-4 bg-black/20 border border-white/5 rounded opacity-40 hover:opacity-60 transition-opacity">
              <i className="fa-solid fa-users text-lg text-cyanGlow mb-2"></i>
              <h4 className="font-display text-xs font-bold uppercase tracking-wider text-white">Employees</h4>
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
