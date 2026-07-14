import React, { useState, useEffect } from 'react';
import { getRankings, getMyRankingSummary } from '../services/rankingsService';
import PublicCompanyProfile from './PublicCompanyProfile';
import { getContracts } from '../services/contractService';
import PublishContractModal from './PublishContractModal';
import ContractDetailsModal from './ContractDetailsModal';

const COUNTRY_FLAGS = {
  'India': '🇮🇳', 'india': '🇮🇳', 'IN': '🇮🇳', 'in': '🇮🇳', 'IND': '🇮🇳', 'ind': '🇮🇳',
  'United States': '🇺🇸', 'united states': '🇺🇸', 'US': '🇺🇸', 'us': '🇺🇸', 'USA': '🇺🇸', 'usa': '🇺🇸',
  'United Kingdom': '🇬🇧', 'united kingdom': '🇬🇧', 'UK': '🇬🇧', 'uk': '🇬🇧', 'GB': '🇬🇧', 'gb': '🇬🇧', 'GBR': '🇬🇧', 'gbr': '🇬🇧',
  'Germany': '🇩🇪', 'germany': '🇩🇪', 'DE': '🇩🇪', 'de': '🇩🇪', 'DEU': '🇩🇪', 'deu': '🇩🇪',
  'Japan': '🇯🇵', 'japan': '🇯🇵', 'JP': '🇯🇵', 'jp': '🇯🇵', 'JPN': '🇯🇵', 'jpn': '🇯🇵',
  'Brazil': '🇧🇷', 'brazil': '🇧🇷', 'BR': '🇧🇷', 'br': '🇧🇷', 'BRA': '🇧🇷', 'bra': '🇧🇷',
  'Australia': '🇦🇺', 'australia': '🇦🇺', 'AU': '🇦🇺', 'au': '🇦🇺', 'AUS': '🇦🇺', 'aus': '🇦🇺'
};

const getCountryName = (countryKey) => {
  if (!countryKey) return '';
  const key = countryKey.toLowerCase();
  if (key === 'in' || key === 'ind' || key === 'india') return 'India';
  if (key === 'us' || key === 'usa' || key === 'united states') return 'United States';
  if (key === 'uk' || key === 'gbr' || key === 'united kingdom' || key === 'gb') return 'United Kingdom';
  if (key === 'de' || key === 'deu' || key === 'germany') return 'Germany';
  if (key === 'jp' || key === 'jpn' || key === 'japan') return 'Japan';
  if (key === 'br' || key === 'bra' || key === 'brazil') return 'Brazil';
  if (key === 'au' || key === 'aus' || key === 'australia') return 'Australia';
  return countryKey;
};

const renderFlagImage = (countryName) => {
  const codeMap = {
    'india': 'in', 'ind': 'in',
    'united states': 'us', 'usa': 'us',
    'united kingdom': 'gb', 'uk': 'gb',
    'germany': 'de',
    'japan': 'jp',
    'brazil': 'br',
    'australia': 'au'
  };
  const key = String(countryName || '').toLowerCase();
  const code = codeMap[key] || 'in';
  return (
    <img 
      src={`https://flagcdn.com/w40/${code}.png`} 
      alt={countryName} 
      className="w-5 h-3.5 object-cover rounded-[2px] border border-white/10 inline-block align-middle" 
    />
  );
};

const renderCompanyLogo = (logoStr, fallbackIconClass = "fa-building text-text-muted text-[10px]") => {
  if (!logoStr) {
    return <i className={`fa-solid ${fallbackIconClass}`}></i>;
  }
  if (logoStr.startsWith('data:image') || logoStr.startsWith('http') || logoStr.startsWith('/')) {
    return <img src={logoStr} alt="" className="w-full h-full object-cover" />;
  }
  return (
    <div 
      className="w-full h-full flex items-center justify-center [&>svg]:w-full [&>svg]:h-full [&>svg]:max-w-full [&>svg]:max-h-full" 
      dangerouslySetInnerHTML={{ __html: logoStr }} 
    />
  );
};

const COUNTRIES = [
  'India',
  'United States',
  'United Kingdom',
  'Germany',
  'Japan',
  'Brazil',
  'Australia'
];

const INDUSTRIES = [
  'Farming', 'Dairy', 'Mining', 'Food Processing', 'Garment Factory',
  'Construction Factory', 'Electronics Manufacturing', 'Automobile Manufacturing',
  'Restaurant', 'Electronics Store', 'Clothing Store', 'Car Showroom'
];

const COMMODITIES = [
  'Top Wheat Producers', 'Top Rice Producers', 'Top Cotton Producers', 'Top Coal Producers',
  'Top Bread Producers', 'Top Steel Beam Producers', 'Top Phone Manufacturers', 'Top Car Manufacturers',
  'Top Wheat Sellers', 'Top Wheat Buyers', 'Top Coal Sellers', 'Top Coal Buyers'
];

const CURRENCY_SYMBOLS = {
  'India': '₹',
  'United States': '$',
  'United Kingdom': '£',
  'Germany': '€',
  'Japan': '¥',
  'Brazil': 'R$',
  'Australia': 'A$'
};

export default function GlobalRankingsTerminal({ startup, token, onClose }) {
  const [mode, setMode] = useState('global'); // 'global', 'country', 'industry', 'commodity', 'my'
  const [search, setSearch] = useState('');
  const [selectedCountry, setSelectedCountry] = useState(COUNTRIES[0]);
  const [selectedIndustry, setSelectedIndustry] = useState(INDUSTRIES[0]);
  const [selectedCommodity, setSelectedCommodity] = useState(COMMODITIES[0]);

  const [sortBy, setSortBy] = useState('companyValuation');
  const [sortOrder, setSortOrder] = useState('desc');
  const [page, setPage] = useState(1);
  const limit = 10;

  const [rankings, setRankings] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [mySummary, setMySummary] = useState(null);
  const [selectedCompanyProfile, setSelectedCompanyProfile] = useState(null);
  const [viewingProfileId, setViewingProfileId] = useState(null);

  // Contracts specific state
  const [activeSubTab, setActiveSubTab] = useState('rankings'); // 'rankings' | 'contracts'
  const [contracts, setContracts] = useState([]);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [selectedContract, setSelectedContract] = useState(null);

  // Load My Rankings Summary card data
  const loadMySummary = async () => {
    try {
      const data = await getMyRankingSummary(token);
      if (data.success) {
        setMySummary(data.summary);
      }
    } catch (err) {
      console.error('[Rankings] Error loading summary:', err.message);
    }
  };

  // Load Rankings List
  const loadRankings = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        mode,
        page,
        limit,
        sortBy,
        sortOrder,
        search
      };

      if (mode === 'country') {
        params.country = selectedCountry;
      } else if (mode === 'industry') {
        params.industry = selectedIndustry;
      } else if (mode === 'commodity') {
        params.commodity = selectedCommodity;
      } else if (mode === 'my') {
        // 'my' mode displays general global ranking centered around self
        params.mode = 'global';
      }

      const data = await getRankings(params, token);
      if (data.success) {
        setRankings(data.rankings || []);
        setTotalCount(data.totalCount || 0);
        setTotalPages(data.totalPages || 0);
      }
    } catch (err) {
      setError(err.message || 'Failed to sync ranking records.');
    } finally {
      setLoading(false);
    }
  };

  // Load Contracts List
  const loadContracts = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page,
        limit,
        search
      };

      if (mode === 'country') {
        params.country = selectedCountry;
      } else if (mode === 'industry') {
        params.industry = selectedIndustry;
      } else if (mode === 'commodity') {
        params.commodity = selectedCommodity;
      } else if (mode === 'buying') {
        params.contractType = 'Buying';
      } else if (mode === 'selling') {
        params.contractType = 'Selling';
      } else if (mode === 'open') {
        // DefaultOpen
      }

      const data = await getContracts(params, token);
      if (data.success) {
        setContracts(data.contracts || []);
        setTotalCount(data.totalCount || 0);
        setTotalPages(data.totalPages || 0);
      }
    } catch (err) {
      setError(err.message || 'Failed to sync contract records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMySummary();
  }, [token]);

  useEffect(() => {
    setPage(1);
    setSearch('');
    setMode('global');
  }, [activeSubTab]);

  useEffect(() => {
    setPage(1);
  }, [mode, search, selectedCountry, selectedIndustry, selectedCommodity]);

  useEffect(() => {
    if (activeSubTab === 'rankings') {
      loadRankings();
    } else {
      loadContracts();
    }
  }, [activeSubTab, mode, search, selectedCountry, selectedIndustry, selectedCommodity, sortBy, sortOrder, page]);

  const formatCurrency = (val, countryName) => {
    const sym = CURRENCY_SYMBOLS[countryName || 'India'] || '₹';
    return `${sym}${Number(val).toLocaleString()}`;
  };

  const handleHeaderClick = (field) => {
    if (mode === 'commodity') return; // Commodity rankings have fixed score sort order
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  return (
    <div className="w-full h-full bg-black/95 text-white flex flex-col font-sans select-none overflow-hidden relative">
      
      {/* HEADER SECTION */}
      <header className="px-4 py-3 md:px-6 md:py-4 border-b border-cyanGlow/20 bg-cyanGlow/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 z-10 shrink-0">
        
        {/* Row 1: Logo & Title + Close Button (on mobile) */}
        <div className="flex items-center justify-between w-full sm:w-auto gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded border border-cyanGlow/30 flex items-center justify-center text-cyanGlow text-base bg-black/60 shadow-[0_0_10px_rgba(0,243,255,0.1)]">
              <i className="fa-solid fa-globe"></i>
            </div>
            <div>
              <h1 className="text-xs md:text-sm font-display font-extrabold uppercase text-white tracking-widest leading-none">
                CapitalGrid Network <span className="text-cyanGlow font-mono">(CGN)</span>
              </h1>
              <p className="text-[9px] md:text-[10px] text-text-muted mt-1.5 leading-none font-mono">
                Global Company Discovery & Rankings Portal
              </p>
            </div>
          </div>
          
          {/* Close button visible only on mobile/small screens (inside Row 1) */}
          <button 
            onClick={onClose}
            className="sm:hidden w-6 h-6 border border-white/10 hover:border-red-500/50 rounded flex items-center justify-center text-xs text-text-secondary hover:text-red-400 bg-white/2 hover:bg-red-950/20 transition-all cursor-pointer"
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        {/* Row 2 on mobile / Right block on desktop */}
        <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
          {/* TOP WINDOW SEGMENT TOGGLE */}
          <div className="flex items-center gap-1 bg-black/40 border border-white/10 rounded p-0.5 select-none w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setActiveSubTab('rankings')}
              className={`flex-1 sm:flex-none text-center px-3 py-1 rounded text-[10px] uppercase font-display tracking-wider transition-all cursor-pointer ${
                activeSubTab === 'rankings'
                  ? 'bg-cyanGlow/25 text-white border border-cyanGlow/35 font-bold shadow-[0_0_8px_rgba(0,243,255,0.1)]'
                  : 'text-text-secondary hover:text-white border border-transparent'
              }`}
            >
              Global Rankings
            </button>
            <button
              type="button"
              onClick={() => setActiveSubTab('contracts')}
              className={`flex-1 sm:flex-none text-center px-3 py-1 rounded text-[10px] uppercase font-display tracking-wider transition-all cursor-pointer ${
                activeSubTab === 'contracts'
                  ? 'bg-cyanGlow/25 text-white border border-cyanGlow/35 font-bold shadow-[0_0_8px_rgba(0,243,255,0.1)]'
                  : 'text-text-secondary hover:text-white border border-transparent'
              }`}
            >
              Contracts
            </button>
          </div>

          {/* Close button visible only on desktop */}
          <button 
            onClick={onClose}
            className="hidden sm:flex w-6 h-6 border border-white/10 hover:border-red-500/50 rounded items-center justify-center text-xs text-text-secondary hover:text-red-400 bg-white/2 hover:bg-red-950/20 transition-all cursor-pointer"
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

      </header>

      <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-5 pb-6">

        {showPublishModal ? (
          <PublishContractModal 
            token={token} 
            startup={startup} 
            onClose={() => setShowPublishModal(false)} 
            onRefresh={loadContracts} 
          />
        ) : (
          <>
            {/* SEARCH BAR & GENERAL METRICS */}
        <div className="bg-white/2 border border-white/5 p-3 rounded-lg flex flex-col md:flex-row gap-4 items-center justify-between shrink-0">
          <div className="relative w-full md:w-80">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-text-muted">
              <i className="fa-solid fa-magnifying-glass text-xs"></i>
            </span>
            <input
              type="text"
              placeholder={activeSubTab === 'rankings' ? "Search companies by name..." : "Search company or commodity..."}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-black/45 border border-white/10 focus:border-cyanGlow/50 rounded pl-8 pr-3 py-1.5 text-xs text-white placeholder-text-muted font-mono outline-none transition-all"
            />
          </div>

          <div className="flex items-center gap-6 text-[10px] font-mono text-text-muted w-full md:w-auto justify-end">
            {activeSubTab === 'contracts' && (
              <button
                type="button"
                onClick={() => setShowPublishModal(true)}
                className="px-3 py-1.5 bg-cyanGlow/25 hover:bg-cyanGlow/40 border border-cyanGlow/30 hover:border-cyanGlow rounded text-[10px] font-display uppercase tracking-wider text-cyanGlow hover:text-white transition-all cursor-pointer flex items-center gap-1.5 shadow-[0_0_15px_rgba(0,243,255,0.08)] mr-2"
              >
                <i className="fa-solid fa-file-signature"></i>
                Publish Contract
              </button>
            )}
            <div>
              TOTAL LISTINGS: <span className="text-white font-bold">{totalCount}</span>
            </div>
            <div>
              STATUS: <span className="text-greenGlow font-bold">ONLINE</span>
            </div>
          </div>
        </div>

        {/* RANKING FILTER CONTROLS */}
        <div className="flex flex-col gap-3 shrink-0">
          {/* Mobile themed select dropdown for primary mode */}
          {activeSubTab === 'rankings' ? (
            <div className="block md:hidden w-full relative">
              <select
                value={mode}
                onChange={(e) => setMode(e.target.value)}
                className="w-full bg-black/45 border border-cyanGlow/30 text-cyanGlow py-2 px-3.5 pr-8 rounded text-xs font-mono outline-none appearance-none cursor-pointer"
              >
                <option value="global" className="bg-[#0b0c10] text-white">🌍 Global Rankings</option>
                <option value="country" className="bg-[#0b0c10] text-white">🏳️ Country Rankings</option>
                <option value="industry" className="bg-[#0b0c10] text-white">🏭 Industry Rankings</option>
                <option value="commodity" className="bg-[#0b0c10] text-white">📦 Commodity Rankings</option>
                <option value="my" className="bg-[#0b0c10] text-white">👤 My Rankings</option>
              </select>
              <i className="fa-solid fa-chevron-down absolute right-3.5 top-3 text-cyanGlow/70 text-[10px] pointer-events-none"></i>
            </div>
          ) : (
            <div className="block md:hidden w-full relative">
              <select
                value={mode}
                onChange={(e) => setMode(e.target.value)}
                className="w-full bg-black/45 border border-cyanGlow/30 text-cyanGlow py-2 px-3.5 pr-8 rounded text-xs font-mono outline-none appearance-none cursor-pointer"
              >
                <option value="global" className="bg-[#0b0c10] text-white">🌍 Global Contracts</option>
                <option value="country" className="bg-[#0b0c10] text-white">🏳️ Country Contracts</option>
                <option value="industry" className="bg-[#0b0c10] text-white">🏭 Industry Contracts</option>
                <option value="commodity" className="bg-[#0b0c10] text-white">📦 Commodity Contracts</option>
                <option value="buying" className="bg-[#0b0c10] text-white">🛒 Buying Contracts</option>
                <option value="selling" className="bg-[#0b0c10] text-white">🚚 Selling Contracts</option>
                <option value="open" className="bg-[#0b0c10] text-white">🔓 Open Contracts</option>
              </select>
              <i className="fa-solid fa-chevron-down absolute right-3.5 top-3 text-cyanGlow/70 text-[10px] pointer-events-none"></i>
            </div>
          )}

          {/* Desktop horizontal tabs */}
          <div className="hidden md:flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none border-b border-white/5 w-full">
            {activeSubTab === 'rankings' ? (
              [
                { id: 'global', label: 'Global Rankings', icon: 'fa-globe' },
                { id: 'country', label: 'Country Rankings', icon: 'fa-flag' },
                { id: 'industry', label: 'Industry Rankings', icon: 'fa-industry' },
                { id: 'commodity', label: 'Commodity Rankings', icon: 'fa-boxes-stacked' },
                { id: 'my', label: 'My Rankings', icon: 'fa-circle-user' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setMode(tab.id)}
                  className={`px-4 py-2 border-t-2 text-xs font-display uppercase tracking-wider flex items-center gap-2 cursor-pointer transition-all select-none whitespace-nowrap ${
                    mode === tab.id
                      ? 'border-cyanGlow text-cyanGlow bg-cyanGlow/5'
                      : 'border-transparent text-text-secondary hover:text-white hover:bg-white/2'
                  }`}
                >
                  <i className={`fa-solid ${tab.icon} text-[10px]`}></i>
                  {tab.label}
                </button>
              ))
            ) : (
              [
                { id: 'global', label: 'Global Contracts', icon: 'fa-globe' },
                { id: 'country', label: 'Country Contracts', icon: 'fa-flag' },
                { id: 'industry', label: 'Industry Contracts', icon: 'fa-industry' },
                { id: 'commodity', label: 'Commodity Contracts', icon: 'fa-boxes-stacked' },
                { id: 'buying', label: 'Buying Contracts', icon: 'fa-cart-shopping' },
                { id: 'selling', label: 'Selling Contracts', icon: 'fa-truck-ramp-box' },
                { id: 'open', label: 'Open Contracts', icon: 'fa-lock-open' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setMode(tab.id)}
                  className={`px-4 py-2 border-t-2 text-xs font-display uppercase tracking-wider flex items-center gap-2 cursor-pointer transition-all select-none whitespace-nowrap ${
                    mode === tab.id
                      ? 'border-cyanGlow text-cyanGlow bg-cyanGlow/5'
                      : 'border-transparent text-text-secondary hover:text-white hover:bg-white/2'
                  }`}
                >
                  <i className={`fa-solid ${tab.icon} text-[10px]`}></i>
                  {tab.label}
                </button>
              ))
            )}
          </div>

          {/* SECONDARY SELECT FILTER DRAWER */}
          {mode === 'country' && (
            <div className="flex flex-col md:flex-row md:items-center gap-2 bg-white/2 p-2.5 rounded border border-white/5">
              <span className="text-[10px] text-text-muted font-mono uppercase tracking-wider pl-2 shrink-0">Filter by country:</span>
              
              {/* Mobile custom dropdown */}
              <div className="block md:hidden w-full relative">
                <select
                  value={selectedCountry}
                  onChange={(e) => setSelectedCountry(e.target.value)}
                  className="w-full bg-black/45 border border-cyanGlow/30 text-cyanGlow py-2 px-3.5 pr-8 rounded text-xs font-mono outline-none appearance-none cursor-pointer"
                >
                  {COUNTRIES.map(c => (
                    <option key={c} value={c} className="bg-[#0b0c10] text-white">
                      {c}
                    </option>
                  ))}
                </select>
                <i className="fa-solid fa-chevron-down absolute right-3.5 top-3.5 text-cyanGlow/70 text-[10px] pointer-events-none"></i>
              </div>

              {/* Desktop horizontal list */}
              <div className="hidden md:flex flex-wrap gap-1">
                {COUNTRIES.map(c => (
                  <button
                    key={c}
                    onClick={() => setSelectedCountry(c)}
                    className={`px-3 py-1 rounded text-[10px] font-mono flex items-center gap-1.5 border transition-all cursor-pointer ${
                      selectedCountry === c
                        ? 'bg-cyanGlow/10 border-cyanGlow/30 text-cyanGlow'
                        : 'bg-black/40 border-white/5 text-text-secondary hover:text-white'
                    }`}
                  >
                    <span>{renderFlagImage(c)}</span>
                    {c}
                  </button>
                ))}
              </div>
            </div>
          )}

          {mode === 'industry' && (
            <div className="flex flex-col md:flex-row md:items-center gap-2 bg-white/2 p-2.5 rounded border border-white/5">
              <span className="text-[10px] text-text-muted font-mono uppercase tracking-wider pl-2 shrink-0">Select sector:</span>
              
              {/* Mobile custom dropdown */}
              <div className="block md:hidden w-full relative">
                <select
                  value={selectedIndustry}
                  onChange={(e) => setSelectedIndustry(e.target.value)}
                  className="w-full bg-black/45 border border-cyanGlow/30 text-cyanGlow py-2 px-3.5 pr-8 rounded text-xs font-mono outline-none appearance-none cursor-pointer"
                >
                  {INDUSTRIES.map(ind => (
                    <option key={ind} value={ind} className="bg-[#0b0c10] text-white">
                      {ind}
                    </option>
                  ))}
                </select>
                <i className="fa-solid fa-chevron-down absolute right-3.5 top-3.5 text-cyanGlow/70 text-[10px] pointer-events-none"></i>
              </div>

              {/* Desktop list */}
              <div className="hidden md:flex flex-wrap gap-1">
                {INDUSTRIES.map(ind => (
                  <button
                    key={ind}
                    onClick={() => setSelectedIndustry(ind)}
                    className={`px-3 py-1 rounded text-[10px] font-mono border transition-all cursor-pointer ${
                      selectedIndustry === ind
                        ? 'bg-cyanGlow/10 border-cyanGlow/30 text-cyanGlow'
                        : 'bg-black/40 border-white/5 text-text-secondary hover:text-white'
                    }`}
                  >
                    {ind}
                  </button>
                ))}
              </div>
            </div>
          )}

          {mode === 'commodity' && (
            <div className="flex flex-col md:flex-row md:items-center gap-2 bg-white/2 p-2.5 rounded border border-white/5">
              <span className="text-[10px] text-text-muted font-mono uppercase tracking-wider pl-2 shrink-0">Select metric:</span>
              
              {/* Mobile custom dropdown */}
              <div className="block md:hidden w-full relative">
                <select
                  value={selectedCommodity}
                  onChange={(e) => setSelectedCommodity(e.target.value)}
                  className="w-full bg-black/45 border border-cyanGlow/30 text-cyanGlow py-2 px-3.5 pr-8 rounded text-xs font-mono outline-none appearance-none cursor-pointer"
                >
                  {COMMODITIES.map(com => (
                    <option key={com} value={com} className="bg-[#0b0c10] text-white">
                      {com}
                    </option>
                  ))}
                </select>
                <i className="fa-solid fa-chevron-down absolute right-3.5 top-3.5 text-cyanGlow/70 text-[10px] pointer-events-none"></i>
              </div>

              {/* Desktop list */}
              <div className="hidden md:flex flex-wrap gap-1 max-h-36 overflow-y-auto pr-1">
                {COMMODITIES.map(com => (
                  <button
                    key={com}
                    onClick={() => setSelectedCommodity(com)}
                    className={`px-3 py-1 rounded text-[10px] font-mono border transition-all cursor-pointer ${
                      selectedCommodity === com
                        ? 'bg-cyanGlow/10 border-cyanGlow/30 text-cyanGlow'
                        : 'bg-black/40 border-white/5 text-text-secondary hover:text-white'
                    }`}
                  >
                    {com}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* CORE CONTENT CONTAINER */}
        {activeSubTab === 'rankings' ? (
          mode === 'my' ? (
            mySummary ? (
              <div className="bg-gradient-to-b from-cyanGlow/10 to-transparent border border-cyanGlow/30 rounded-lg p-6 flex flex-col gap-6 shadow-[0_0_20px_rgba(0,243,255,0.05)] font-sans">
                {/* Header profile block */}
                <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 border-b border-white/10 pb-6">
                  <div className="w-16 h-16 rounded-lg border-2 border-cyanGlow/40 bg-cyanGlow/5 flex items-center justify-center overflow-hidden shrink-0 shadow-[0_0_15px_rgba(0,243,255,0.15)]">
                    {renderCompanyLogo(mySummary.logo, "fa-building text-cyanGlow text-2xl")}
                  </div>
                  <div className="text-center sm:text-left">
                    <div className="text-[10px] text-cyanGlow font-mono uppercase tracking-widest leading-none">Registered Enterprise</div>
                    <h2 className="text-lg font-bold text-white mt-2 leading-tight">{mySummary.companyName}</h2>
                    <div className="flex items-center gap-2 justify-center sm:justify-start mt-2">
                      <span className="inline-block select-none filter drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)]">
                        {renderFlagImage(mySummary.country)}
                      </span>
                      <span className="text-[10px] text-text-muted font-mono">{getCountryName(mySummary.country)}</span>
                      <span className="text-text-muted/30 font-mono">|</span>
                      <span className="text-[10px] text-text-muted font-mono">{mySummary.businessType}</span>
                    </div>
                  </div>
                </div>

                {/* Ranks detailed grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-black/40 border border-white/5 p-4 rounded-lg flex flex-col gap-2">
                    <span className="text-[9px] text-text-muted font-mono uppercase tracking-wider">Global Standing</span>
                    <div className="flex items-baseline gap-1.5 mt-1">
                      <span className="text-2xl font-bold text-white font-mono">#{mySummary.globalRank}</span>
                      <span className="text-[10px] text-cyanGlow font-mono">Rank</span>
                    </div>
                    <p className="text-[9px] text-text-secondary leading-normal font-sans mt-1">
                      Your company is ranked #{mySummary.globalRank} globally across all active users.
                    </p>
                  </div>

                  <div className="bg-black/40 border border-white/5 p-4 rounded-lg flex flex-col gap-2">
                    <span className="text-[9px] text-text-muted font-mono uppercase tracking-wider">Country Standing</span>
                    <div className="flex items-baseline gap-1.5 mt-1">
                      <span className="text-2xl font-bold text-white font-mono">#{mySummary.countryRank}</span>
                      <span className="text-[10px] text-cyanGlow font-mono">Rank</span>
                    </div>
                    <p className="text-[9px] text-text-secondary leading-normal font-sans mt-1">
                      Your company is ranked #{mySummary.countryRank} within {getCountryName(mySummary.country)}.
                    </p>
                  </div>

                  <div className="bg-black/40 border border-white/5 p-4 rounded-lg flex flex-col gap-2">
                    <span className="text-[9px] text-text-muted font-mono uppercase tracking-wider">Sector Standing</span>
                    <div className="flex items-baseline gap-1.5 mt-1">
                      <span className="text-2xl font-bold text-white font-mono">#{mySummary.industryRank}</span>
                      <span className="text-[10px] text-cyanGlow font-mono">Rank</span>
                    </div>
                    <p className="text-[9px] text-text-secondary leading-normal font-sans mt-1">
                      Your company is ranked #{mySummary.industryRank} in the {mySummary.businessType} sector.
                    </p>
                  </div>
                </div>

                {/* Financial metrics detailed grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-white/10 pt-6 font-mono">
                  <div className="flex items-center justify-between bg-black/30 p-3 rounded border border-white/5">
                    <div className="flex flex-col gap-0.5 font-sans">
                      <span className="text-[9px] text-text-muted uppercase font-mono">Company Valuation</span>
                      <span className="text-sm font-bold text-greenGlow mt-0.5 font-mono">
                        {formatCurrency(mySummary.companyValuation, mySummary.country)}
                      </span>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-green-950/20 border border-green-500/10 flex items-center justify-center text-greenGlow">
                      <i className="fa-solid fa-award text-xs"></i>
                    </div>
                  </div>

                  <div className="flex items-center justify-between bg-black/30 p-3 rounded border border-white/5">
                    <div className="flex flex-col gap-0.5 font-sans">
                      <span className="text-[9px] text-text-muted uppercase font-mono">Percentile Standing</span>
                      <span className="text-sm font-bold text-cyanGlow mt-0.5 font-mono">
                        Top {mySummary.percentile}%
                      </span>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-cyan-950/20 border border-cyanGlow/10 flex items-center justify-center text-cyanGlow">
                      <i className="fa-solid fa-ranking-star text-xs"></i>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-text-muted bg-white/2 border border-white/5 rounded-lg font-mono text-xs">
                <i className="fa-solid fa-circle-notch animate-spin text-cyanGlow text-sm mr-2"></i>
                Syncing enterprise records...
              </div>
            )
          ) : (
            <div className="bg-white/2 border border-white/5 rounded-lg overflow-hidden flex flex-col min-h-[300px]">
              
              {loading ? (
                <div className="flex-1 flex flex-col items-center justify-center py-12 gap-3">
                  <i className="fa-solid fa-circle-notch animate-spin text-cyanGlow text-2xl"></i>
                  <span className="text-xs text-text-secondary font-mono">Syncing global company records...</span>
                </div>
              ) : error ? (
                <div className="flex-1 flex flex-col items-center justify-center py-12 text-center text-red-400 gap-2">
                  <i className="fa-solid fa-triangle-exclamation text-xl"></i>
                  <p className="text-xs">{error}</p>
                </div>
              ) : rankings.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center py-16 text-center text-text-muted gap-2">
                  <i className="fa-solid fa-inbox text-lg"></i>
                  <p className="text-xs font-mono">
                    {mode === 'commodity' ? 'No ranking data available yet.' : 'No matching companies discovered.'}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto scrollbar-thin">
                  <table className="w-full min-w-[650px] text-left border-collapse font-sans text-xs">
                    <thead>
                      <tr className="bg-white/5 border-b border-white/10 font-display uppercase tracking-widest text-[9px] text-text-secondary select-none">
                        <th className="py-3 px-4 w-16">Rank</th>
                        <th className="py-3 px-4">Company</th>
                        <th className="py-3 px-4 text-center w-20">Region</th>
                        <th className="py-3 px-4">Sectors</th>
                        
                        <th 
                          onClick={() => handleHeaderClick('companyValuation')}
                          className={`py-3 px-4 text-right cursor-pointer select-none transition-colors hover:text-white ${mode === 'commodity' ? 'pointer-events-none' : ''}`}
                        >
                          Valuation
                          {sortBy === 'companyValuation' && mode !== 'commodity' && (
                            <i className={`fa-solid fa-chevron-${sortOrder === 'asc' ? 'up' : 'down'} ml-1.5 text-[8px] text-cyanGlow`}></i>
                          )}
                        </th>
                        
                        <th 
                          onClick={() => handleHeaderClick('employees')}
                          className={`py-3 px-4 text-right cursor-pointer select-none transition-colors hover:text-white ${mode === 'commodity' ? 'pointer-events-none' : ''}`}
                        >
                          Staff
                          {sortBy === 'employees' && mode !== 'commodity' && (
                            <i className={`fa-solid fa-chevron-${sortOrder === 'asc' ? 'up' : 'down'} ml-1.5 text-[8px] text-cyanGlow`}></i>
                          )}
                        </th>
                        
                        <th 
                          onClick={() => handleHeaderClick('foundedDate')}
                          className={`py-3 px-4 text-right cursor-pointer select-none transition-colors hover:text-white ${mode === 'commodity' ? 'pointer-events-none' : ''}`}
                        >
                          Established
                          {sortBy === 'foundedDate' && mode !== 'commodity' && (
                            <i className={`fa-solid fa-chevron-${sortOrder === 'asc' ? 'up' : 'down'} ml-1.5 text-[8px] text-cyanGlow`}></i>
                          )}
                        </th>
  
                        {mode === 'commodity' && (
                          <th className="py-3 px-4 text-right text-cyanGlow">Volume</th>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {rankings.map(row => {
                        const isSelf = startup && String(startup._id) === String(row._id);
                        let medal = row.rank;
                        if (row.rank === 1) medal = '🥇';
                        else if (row.rank === 2) medal = '🥈';
                        else if (row.rank === 3) medal = '🥉';
  
                        return (
                          <tr
                            key={row._id}
                            onClick={() => setViewingProfileId(row._id)}
                            className={`border-b border-white/5 hover:bg-cyanGlow/5 transition-all cursor-pointer ${
                              isSelf ? 'bg-cyanGlow/10 border-l-[3px] border-l-cyanGlow' : ''
                            }`}
                          >
                            {/* Rank */}
                            <td className="py-3 px-4 font-mono font-bold">{medal}</td>
                            
                            {/* Company Logo & Name */}
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-3">
                                <div className="w-6 h-6 rounded border border-white/10 bg-black/40 flex items-center justify-center overflow-hidden shrink-0">
                                  {renderCompanyLogo(row.logo)}
                                </div>
                                <span className="font-bold text-white leading-normal hover:text-cyanGlow transition-colors font-sans">
                                  {row.startupName}
                                </span>
                              </div>
                            </td>
  
                            {/* Region Flag Icon */}
                            <td className="py-3 px-4 text-center">
                              <span 
                                className="inline-block select-none filter drop-shadow-[0_1.5px_2px_rgba(0,0,0,0.45)]"
                                title={getCountryName(row.country)}
                              >
                                {renderFlagImage(row.country)}
                              </span>
                            </td>
  
                            {/* Business Type */}
                            <td className="py-3 px-4">
                              <span className="px-2 py-0.5 rounded bg-white/5 text-[10px] border border-white/5 text-text-secondary select-none font-mono">
                                {row.businessType}
                              </span>
                            </td>
  
                            {/* Valuation */}
                            <td className="py-3 px-4 text-right font-mono font-bold text-white">
                              {formatCurrency(row.companyValuation, row.country)}
                            </td>
  
                            {/* Employees */}
                            <td className="py-3 px-4 text-right font-mono text-text-secondary">
                              {row.employees}
                            </td>
  
                            {/* Founded Date */}
                            <td className="py-3 px-4 text-right font-mono text-[10px] text-text-muted">
                              {new Date(row.foundedDate).toLocaleDateString(undefined, {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                              })}
                            </td>
  
                            {/* Commodity Stat Value */}
                            {mode === 'commodity' && (
                              <td className="py-3 px-4 text-right font-mono font-bold text-cyanGlow">
                                {Number(row.commodityStat).toLocaleString()}
                              </td>
                            )}
  
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
  
              {/* PAGINATION PANEL */}
              {!loading && totalCount > 0 && (
                <div className="p-3 bg-black/40 border-t border-white/10 flex items-center justify-between mt-auto select-none font-mono">
                  <button
                    disabled={page === 1}
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    className="px-3 py-1 text-[10px] font-display uppercase tracking-wider rounded border border-white/10 hover:border-cyanGlow/50 hover:bg-cyanGlow/5 disabled:opacity-40 disabled:pointer-events-none transition-all cursor-pointer bg-[#0b0c10]"
                  >
                    Previous
                  </button>
                  <span className="text-[10px] text-text-muted">
                    Page <span className="text-white font-bold">{page}</span> of <span className="text-white font-bold">{totalPages || 1}</span>
                  </span>
                  <button
                    disabled={page === (totalPages || 1)}
                    onClick={() => setPage(p => Math.min(totalPages || 1, p + 1))}
                    className="px-3 py-1 text-[10px] font-display uppercase tracking-wider rounded border border-white/10 hover:border-cyanGlow/50 hover:bg-cyanGlow/5 disabled:opacity-40 disabled:pointer-events-none transition-all cursor-pointer bg-[#0b0c10]"
                  >
                    Next
                  </button>
                </div>
              )}
  
            </div>
          )
        ) : (
          // --- CONTRACTS MARKETPLACE VIEW ---
          <div className="bg-white/2 border border-white/5 rounded-lg overflow-hidden flex flex-col min-h-[300px]">
            
            {loading ? (
              <div className="flex-1 flex flex-col items-center justify-center py-12 gap-3">
                <i className="fa-solid fa-circle-notch animate-spin text-cyanGlow text-2xl"></i>
                <span className="text-xs text-text-secondary font-mono">Syncing global B2B contracts...</span>
              </div>
            ) : error ? (
              <div className="flex-1 flex flex-col items-center justify-center py-12 text-center text-red-400 gap-2">
                <i className="fa-solid fa-triangle-exclamation text-xl"></i>
                <p className="text-xs">{error}</p>
              </div>
            ) : contracts.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center py-16 text-center text-text-muted gap-2">
                <i className="fa-solid fa-inbox text-lg"></i>
                <p className="text-xs font-mono">No open B2B contracts discovered.</p>
              </div>
            ) : (
              <div className="overflow-x-auto scrollbar-thin">
                <table className="w-full min-w-[700px] text-left border-collapse font-sans text-xs">
                  <thead>
                    <tr className="bg-white/5 border-b border-white/10 font-display uppercase tracking-widest text-[9px] text-text-secondary select-none">
                      <th className="py-3 px-4 w-20">Type</th>
                      <th className="py-3 px-4">Company</th>
                      <th className="py-3 px-4 text-center w-24">Region</th>
                      <th className="py-3 px-4">Commodity</th>
                      <th className="py-3 px-4 text-right">Quantity</th>
                      <th className="py-3 px-4 text-center">Interval</th>
                      <th className="py-3 px-4 text-right">Offer Value</th>
                      <th className="py-3 px-4 text-right">Posted Date</th>
                    </tr>
                  </thead>
                  <tbody className="font-mono text-[11px]">
                    {contracts.map(row => {
                      const impliedPrice = row.quantity > 0 ? (row.offerValue / row.quantity) : 0;
                      const formattedImplied = formatCurrency(impliedPrice, row.country);
                      const formattedTotal = formatCurrency(row.offerValue, row.country);
                      
                      return (
                        <tr
                          key={row._id}
                          onClick={() => setSelectedContract(row)}
                          className="border-b border-white/5 hover:bg-cyanGlow/5 transition-all cursor-pointer"
                        >
                          {/* Type */}
                          <td className="py-3 px-4">
                            <span className={`px-2 py-0.5 rounded text-[8.5px] font-bold ${
                              row.contractType === 'Buying' 
                                ? 'bg-red-500/10 border border-red-500/25 text-red-400' 
                                : 'bg-green-500/10 border border-green-500/25 text-green-400'
                            }`}>
                              {row.contractType.toUpperCase()}
                            </span>
                          </td>

                          {/* Company Name */}
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-6 h-6 rounded border border-white/10 bg-black/40 flex items-center justify-center overflow-hidden shrink-0">
                                {renderCompanyLogo(row.startup?.logo || '')}
                              </div>
                              <span className="font-bold text-white hover:text-cyanGlow transition-colors font-sans">
                                {row.startupName}
                              </span>
                            </div>
                          </td>

                          {/* Country Flag */}
                          <td className="py-3 px-4 text-center">
                            <span className="flex items-center justify-center gap-1.5">
                              {renderFlagImage(row.country)}
                              <span className="text-[9.5px] text-text-secondary">{row.country}</span>
                            </span>
                          </td>

                          {/* Commodity */}
                          <td className="py-3 px-4 text-white font-bold">{row.commodity}</td>

                          {/* Quantity */}
                          <td className="py-3 px-4 text-right">{Number(row.quantity).toLocaleString()}</td>

                          {/* Interval */}
                          <td className="py-3 px-4 text-center">
                            {row.intervalType === 'Daily' && row.intervalValue === 2 
                              ? 'Every 2 Days' 
                              : `${row.intervalValue}x ${row.intervalType}`
                            }
                          </td>

                          {/* Offer Value with Implied unit price */}
                          <td className="py-3 px-4 text-right">
                            <div className="flex flex-col items-end">
                              <span className="text-white font-bold">{formattedTotal}</span>
                              <span className="text-[9px] text-text-muted">≈ {formattedImplied}/unit</span>
                            </div>
                          </td>

                          {/* Posted date */}
                          <td className="py-3 px-4 text-right text-[10px] text-text-muted">
                            {new Date(row.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* PAGINATION PANEL */}
            {!loading && totalCount > 0 && (
              <div className="p-3 bg-black/40 border-t border-white/10 flex items-center justify-between mt-auto select-none font-mono">
                <button
                  disabled={page === 1}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  className="px-3 py-1 text-[10px] font-display uppercase tracking-wider rounded border border-white/10 hover:border-cyanGlow/50 hover:bg-cyanGlow/5 disabled:opacity-40 disabled:pointer-events-none transition-all cursor-pointer bg-[#0b0c10]"
                >
                  Previous
                </button>
                <span className="text-[10px] text-text-muted">
                  Page <span className="text-white font-bold">{page}</span> of <span className="text-white font-bold">{totalPages || 1}</span>
                </span>
                <button
                  disabled={page === (totalPages || 1)}
                  onClick={() => setPage(p => Math.min(totalPages || 1, p + 1))}
                  className="px-3 py-1 text-[10px] font-display uppercase tracking-wider rounded border border-white/10 hover:border-cyanGlow/50 hover:bg-cyanGlow/5 disabled:opacity-40 disabled:pointer-events-none transition-all cursor-pointer bg-[#0b0c10]"
                >
                  Next
                </button>
              </div>
            )}

          </div>
        )}
          </>
        )}

      </div>



      {/* PUBLIC COMPANY PROFILE OVERLAY */}
      {viewingProfileId && (
        <PublicCompanyProfile 
          companyId={viewingProfileId} 
          token={token} 
          startup={startup}
          onClose={() => setViewingProfileId(null)} 
        />
      )}



      {/* CONTRACT DETAILS OVERLAY */}
      {selectedContract && (
        <ContractDetailsModal 
          contract={selectedContract} 
          onClose={() => setSelectedContract(null)} 
        />
      )}

    </div>
  );
}
