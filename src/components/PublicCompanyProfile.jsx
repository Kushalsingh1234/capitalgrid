import React, { useState, useEffect } from 'react';
import { getPublicProfile } from '../services/profileService';
import { getUnreadWithCompany } from '../services/messageService';
import AgreementDraftModal from './AgreementDraftModal';

const CURRENCY_SYMBOLS = {
  'India': '₹',
  'United States': '$',
  'United Kingdom': '£',
  'Germany': '€',
  'Japan': '¥',
  'Brazil': 'R$',
  'Australia': 'A$'
};

const formatCurrency = (amount, country = 'India') => {
  const symbol = CURRENCY_SYMBOLS[country] || '$';
  return `${symbol}${Number(amount || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
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

export default function PublicCompanyProfile({ companyId, token, startup, onClose }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'production', 'achievements'
  const [placeholderModal, setPlaceholderModal] = useState(null); // 'message', 'contract'
  const [isDraftOpen, setIsDraftOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);
  const [hasUnread, setHasUnread] = useState(false);

  useEffect(() => {
    const checkUnread = async () => {
      if (!token || !companyId) return;
      try {
        const res = await getUnreadWithCompany(companyId, token);
        if (res.success) {
          setHasUnread(res.unread);
        }
      } catch (err) {
        console.error(err);
      }
    };
    checkUnread();
  }, [companyId, token]);

  const handleMessageCompany = () => {
    window.dispatchEvent(new CustomEvent('start-b2b-conversation', {
      detail: { 
        targetCompanyId: companyId, 
        category: 'Business Inquiry' 
      }
    }));
    onClose();
  };

  useEffect(() => {
    let active = true;
    const fetchProfile = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await getPublicProfile(companyId, token);
        if (active) {
          setProfile(res.profile);
        }
      } catch (err) {
        if (active) {
          setError(err.response?.data?.message || 'Failed to retrieve company profile.');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };
    if (companyId) {
      fetchProfile();
    }
    return () => {
      active = false;
    };
  }, [companyId, token]);

  if (loading) {
    return (
      <div className="absolute inset-0 bg-[#0b0c10] z-20 flex flex-col items-center justify-center gap-3">
        <i className="fa-solid fa-circle-notch animate-spin text-cyanGlow text-3xl"></i>
        <span className="text-xs text-text-secondary font-mono">Syncing secure profile connection...</span>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="absolute inset-0 bg-[#0b0c10] z-20 flex flex-col items-center justify-center gap-4 text-center p-6">
        <i className="fa-solid fa-triangle-exclamation text-red-500 text-3xl"></i>
        <div className="max-w-xs">
          <h3 className="text-white font-bold text-sm">Connection Refused</h3>
          <p className="text-xs text-text-secondary mt-1">{error || 'Could not load company details.'}</p>
        </div>
        <button 
          onClick={onClose}
          className="px-4 py-1.5 border border-white/10 hover:border-cyanGlow/50 rounded text-xs text-white bg-white/5 hover:bg-cyanGlow/5 transition-all cursor-pointer font-mono"
        >
          Return to Rankings
        </button>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 bg-[#0b0c10] z-20 flex flex-col select-none overflow-hidden">
      
      {/* HEADER SECTION */}
      <header className="bg-black/85 border-b border-white/5 px-6 py-4 flex items-center justify-between shrink-0">
        <button 
          onClick={onClose}
          className="px-3.5 py-1.5 border border-white/10 hover:border-cyanGlow/50 rounded text-[10px] font-display uppercase tracking-wider text-text-secondary hover:text-cyanGlow bg-black/40 hover:bg-cyanGlow/5 transition-all cursor-pointer flex items-center gap-1.5"
        >
          <i className="fa-solid fa-arrow-left"></i> Back to Rankings
        </button>
      </header>

      {/* VIEWPORT SCROLLABLE BODY */}
      <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-6 pb-24">
        
        {/* HERO BANNER & BASIC IDENTIFIERS CARD */}
        <div className="bg-black/60 border border-white/5 rounded-lg overflow-hidden shrink-0 relative shadow-[0_4px_20px_rgba(0,0,0,0.4)]">
          {/* Banner area */}
          <div className="h-24 sm:h-32 bg-gradient-to-r from-cyan-950/40 via-red-950/20 to-emerald-950/40 relative border-b border-white/5 overflow-hidden">
            <div className="absolute inset-0 opacity-15 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyanGlow via-transparent to-transparent"></div>
          </div>

          {/* Profile details wrapper */}
          <div className="px-6 pb-6 relative pt-12 flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-4 sm:gap-6">
            {/* Logo overlay */}
            <div className="w-20 h-20 rounded-lg border-2 border-cyanGlow/30 bg-black flex items-center justify-center overflow-hidden absolute -top-10 left-1/2 -translate-x-1/2 sm:left-6 sm:translate-x-0 shadow-[0_0_15px_rgba(0,243,255,0.1)] shrink-0">
              {renderCompanyLogo(profile.logo, "fa-building text-cyanGlow text-3xl")}
            </div>

            {/* Basic textual metrics */}
            <div className="flex-1 flex flex-col gap-1.5 mt-2 sm:mt-0">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 justify-center sm:justify-start">
                <h1 className="text-lg font-bold text-white leading-tight">{profile.startupName}</h1>
                <span className="px-2 py-0.5 rounded bg-cyanGlow/10 border border-cyanGlow/25 text-[9px] text-cyanGlow font-mono font-bold w-fit mx-auto sm:mx-0">
                  Lvl {profile.level}
                </span>
              </div>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-2 gap-y-1 text-[10px] text-text-muted font-mono">
                <span className="flex items-center gap-1">
                  {renderFlagImage(profile.country)}
                  <span>{getCountryName(profile.country)}</span>
                </span>
                <span>•</span>
                <span>{profile.businessType}</span>
                <span>•</span>
                <span>Est. {new Date(profile.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short' })}</span>
              </div>
            </div>

            {/* Micro standalone stats blocks */}
            <div className="flex items-center gap-6 font-mono text-right shrink-0 mt-3 sm:mt-0">
              <div className="flex flex-col gap-0.5 items-center sm:items-end">
                <span className="text-[9px] text-text-muted uppercase">Public Valuation</span>
                <span className="text-sm font-bold text-greenGlow">{formatCurrency(profile.companyValuation, profile.country)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* PROFILE ABOUT BOX */}
        <div className="bg-white/2 border border-white/5 p-4 rounded-lg flex flex-col gap-2 shrink-0">
          <span className="text-[9px] text-text-muted font-mono uppercase tracking-wider">About Company</span>
          <p className="text-xs text-text-secondary leading-relaxed font-sans max-w-3xl">
            {profile.description ? profile.description.substring(0, 200) : 'No company description provided.'}
          </p>
        </div>

        {/* TABS CONTAINER */}
        <div className="flex flex-col gap-4">
          {/* Menu triggers */}
          <div className="flex items-center border-b border-white/5 pb-1 select-none w-full">
            {[
              { id: 'overview', label: 'Company Overview & Stats', icon: 'fa-chart-pie' },
              { id: 'production', label: 'Production Output', icon: 'fa-industry' },
              { id: 'achievements', label: 'Milestones & Standings', icon: 'fa-trophy' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 sm:flex-none justify-center sm:justify-start px-2 sm:px-4 py-2 border-b-2 text-[9px] sm:text-[10px] font-display uppercase tracking-wider flex items-center gap-1.5 cursor-pointer transition-all ${
                  activeTab === tab.id
                    ? 'border-cyanGlow text-cyanGlow font-bold bg-cyanGlow/5'
                    : 'border-transparent text-text-secondary hover:text-white'
                }`}
              >
                <i className={`fa-solid ${tab.icon} text-[10px]`}></i>
                {tab.label}
              </button>
            ))}
          </div>

          {/* ACTIVE TAB CONTENT */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { label: 'Public Valuation', value: formatCurrency(profile.companyValuation, profile.country), icon: 'fa-award', color: 'text-greenGlow' },
                { label: 'Total Employees Hired', value: `${profile.employees} Active Staff`, icon: 'fa-users', color: 'text-white' },
                { label: 'Corporate Level Status', value: `Level ${profile.level}`, icon: 'fa-circle-chevron-up', color: 'text-cyanGlow' },
                { label: 'Primary Sector category', value: profile.industry, icon: 'fa-building-columns', color: 'text-white' },
                { label: 'Total Products Produced', value: `${profile.totalProduced.toLocaleString()} Units`, icon: 'fa-industry', color: 'text-white' },
                { label: 'Marketplace Volume Sold', value: `${profile.totalSales.toLocaleString()} Units`, icon: 'fa-arrow-up-right-from-square', color: 'text-white' },
                { label: 'Marketplace Volume Purchased', value: `${profile.totalPurchases.toLocaleString()} Units`, icon: 'fa-arrow-down-left-and-arrow-up-right-to-card', color: 'text-white' },
                { label: 'Trade Exports volume', value: `${profile.totalExports.toLocaleString()} Units`, icon: 'fa-plane-departure', color: 'text-cyanGlow' },
                { label: 'Trade Imports volume', value: `${profile.totalImports.toLocaleString()} Units`, icon: 'fa-plane-arrival', color: 'text-cyanGlow' },
                { label: 'Contracts Completed', value: `${profile.contractsCompleted} Trades`, icon: 'fa-file-signature', color: 'text-text-muted' }
              ].map((item, idx) => (
                <div key={idx} className="bg-black/40 border border-white/5 p-4 rounded-lg flex items-center justify-between font-mono">
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[8.5px] text-text-muted uppercase">{item.label}</span>
                    <span className={`text-xs font-bold ${item.color}`}>{item.value}</span>
                  </div>
                  <div className="w-8 h-8 rounded bg-white/2 border border-white/5 flex items-center justify-center text-text-secondary text-[11px]">
                    <i className={`fa-solid ${item.icon}`}></i>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'production' && (
            <div className="bg-black/30 border border-white/5 rounded-lg p-6">
              <span className="text-[10px] text-text-muted font-mono uppercase tracking-wider block mb-4">Relevant Commodity Output</span>
              
              {profile.productionStatistics.length === 0 ? (
                <div className="text-center py-8 text-text-muted text-xs font-mono">
                  This enterprise sector type does not yield public commodity assets.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {profile.productionStatistics.map((stat, idx) => (
                    <div key={idx} className="bg-white/2 border border-white/5 p-4 rounded-lg flex items-center justify-between font-mono">
                      <div className="flex flex-col gap-1">
                        <span className="text-[9px] text-text-secondary uppercase">{stat.productName}</span>
                        <span className="text-xs text-white font-bold">{stat.quantity.toLocaleString()} <span className="text-[9px] text-text-muted">Units</span></span>
                      </div>
                      <div className="w-8 h-8 rounded-full bg-cyanGlow/5 border border-cyanGlow/10 flex items-center justify-center text-cyanGlow text-[10px]">
                        <i className="fa-solid fa-box-open"></i>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'achievements' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Standings block */}
              <div className="bg-black/30 border border-white/5 rounded-lg p-5 flex flex-col gap-4">
                <span className="text-[10px] text-text-muted font-mono uppercase tracking-wider">National & Sector Rankings</span>
                
                <div className="flex flex-col gap-3 font-mono">
                  <div className="flex items-center justify-between p-3 bg-white/2 rounded border border-white/5">
                    <span className="text-[10px] text-text-secondary uppercase">Global Rank</span>
                    <span className="text-xs text-white font-bold">#{profile.globalRank}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-white/2 rounded border border-white/5">
                    <span className="text-[10px] text-text-secondary uppercase">Country Rank</span>
                    <span className="text-xs text-white font-bold">#{profile.countryRank}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-white/2 rounded border border-white/5">
                    <span className="text-[10px] text-text-secondary uppercase">Industry Rank</span>
                    <span className="text-xs text-white font-bold">#{profile.industryRank}</span>
                  </div>
                  
                  {/* Commodity standing lines */}
                  {profile.commodityRankings.map((cr, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-cyanGlow/5 rounded border border-cyanGlow/15">
                      <span className="text-[10px] text-cyanGlow uppercase">{cr.label}</span>
                      <span className="text-xs text-white font-bold">#{cr.rank}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Achievements block */}
              <div className="bg-black/30 border border-white/5 rounded-lg p-5 flex flex-col gap-4">
                <span className="text-[10px] text-text-muted font-mono uppercase tracking-wider">Corporate Accomplishments</span>
                
                {profile.achievements.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center text-text-muted py-12 gap-2">
                    <i className="fa-solid fa-award text-lg"></i>
                    <span className="text-xs font-mono">No achievements unlocked yet.</span>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3 font-mono">
                    {profile.achievements.map((ach, idx) => (
                      <div key={idx} className="p-3 bg-white/2 rounded border border-white/5 flex items-start gap-3">
                        <div className="w-8 h-8 rounded bg-cyanGlow/10 border border-cyanGlow/20 flex items-center justify-center text-cyanGlow text-[11px] shrink-0 mt-0.5">
                          <i className={`fa-solid ${ach.icon}`}></i>
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[10px] text-white font-bold">{ach.title}</span>
                          <span className="text-[9px] text-text-secondary leading-normal">{ach.description}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

      </div>

      {/* FOOTER ACTIONS BAR (PRIVATE CHAT & CONTRACT PLACEHOLDERS) */}
      <footer className="absolute bottom-0 inset-x-0 bg-black/90 border-t border-white/5 px-6 py-4 flex items-center justify-end gap-3 shrink-0 z-10">
        <button 
          onClick={handleMessageCompany}
          className="px-4 py-2 border border-white/10 hover:border-cyanGlow/40 rounded text-[10px] font-display uppercase tracking-wider text-text-secondary hover:text-cyanGlow bg-white/2 hover:bg-cyanGlow/5 transition-all cursor-pointer relative"
        >
          <i className="fa-solid fa-message mr-1.5"></i> Message Company
          {hasUnread && (
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-cyanGlow animate-pulse border border-black" />
          )}
        </button>
        <button 
          onClick={() => setIsDraftOpen(true)}
          className="px-4 py-2 border border-cyanGlow/30 hover:border-cyanGlow rounded text-[10px] font-display uppercase tracking-wider text-cyanGlow hover:text-white bg-cyanGlow/10 hover:bg-cyanGlow/25 transition-all cursor-pointer shadow-[0_0_15px_rgba(0,243,255,0.05)]"
        >
          <i className="fa-solid fa-file-contract mr-1.5"></i> Send Contract
        </button>
      </footer>

      {/* PLACEHOLDER ALERTS DIALOG MODAL */}
      {placeholderModal && (
        <div className="fixed inset-0 bg-black/85 flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-black/95 border border-cyanGlow/30 rounded-lg p-6 max-w-sm w-full text-center relative shadow-[0_0_40px_rgba(0,243,255,0.15)] flex flex-col gap-4 font-sans">
            
            <button 
              onClick={() => setPlaceholderModal(null)}
              className="absolute top-3 right-3 w-5 h-5 border border-white/10 hover:border-red-500/50 rounded flex items-center justify-center text-[10px] text-text-secondary hover:text-red-400 bg-white/2 transition-all cursor-pointer"
            >
              <i className="fa-solid fa-xmark"></i>
            </button>

            <div className="w-12 h-12 rounded-full border border-cyanGlow/20 bg-cyanGlow/5 flex items-center justify-center text-cyanGlow text-lg mx-auto shadow-[0_0_15px_rgba(0,243,255,0.05)]">
              <i className={placeholderModal === 'message' ? "fa-solid fa-comments" : "fa-solid fa-handshake"}></i>
            </div>

            <div>
              <h3 className="font-display font-extrabold text-xs uppercase text-white tracking-widest leading-none">
                {placeholderModal === 'message' ? 'Direct Messaging' : 'Contract Negotiations'}
              </h3>
              <p className="text-[9.5px] text-text-muted mt-2 font-mono">
                {profile.startupName}
              </p>
            </div>

            <p className="text-[10px] text-text-secondary leading-relaxed bg-white/2 p-3 rounded border border-white/5">
              {placeholderModal === 'message' 
                ? 'Direct player communication & messaging channels will arrive in Phase 26.' 
                : 'Custom trade contracts, raw material requests, and pricing negotiations will arrive in Phase 28.'
              }
            </p>

            <button
              onClick={() => setPlaceholderModal(null)}
              className="px-4 py-1.5 border border-cyanGlow/25 hover:border-cyanGlow rounded text-[10px] font-display uppercase tracking-wider text-cyanGlow hover:text-white bg-cyanGlow/5 hover:bg-cyanGlow/10 transition-all cursor-pointer mx-auto"
            >
              Acknowledge
            </button>

          </div>
        </div>
      )}

      {successMessage && (
        <div className="fixed inset-0 bg-black/85 flex items-center justify-center p-4 z-50 animate-fadeIn font-mono">
          <div className="bg-black/95 border border-greenGlow/30 rounded-lg p-6 max-w-sm w-full text-center relative shadow-[0_0_40px_rgba(0,255,100,0.15)] flex flex-col gap-4">
            
            <button 
              onClick={() => setSuccessMessage(null)}
              className="absolute top-3 right-3 w-5 h-5 border border-white/10 hover:border-red-500/50 rounded flex items-center justify-center text-[10px] text-text-secondary hover:text-red-400 bg-white/2 transition-all cursor-pointer"
            >
              <i className="fa-solid fa-xmark"></i>
            </button>

            <div className="w-12 h-12 rounded-full border border-greenGlow/20 bg-greenGlow/5 flex items-center justify-center text-greenGlow text-lg mx-auto shadow-[0_0_15px_rgba(0,255,100,0.05)] animate-pulse">
              <i className="fa-solid fa-paper-plane"></i>
            </div>

            <div>
              <h3 className="font-display font-extrabold text-xs uppercase text-white tracking-widest leading-none">
                Proposal Transmitted
              </h3>
              <p className="text-[9.5px] text-text-muted mt-2">
                {profile?.startupName}
              </p>
            </div>

            <p className="text-[10px] text-text-secondary leading-relaxed bg-white/2 p-3 rounded border border-white/5">
              {successMessage}
            </p>

            <button
              onClick={() => setSuccessMessage(null)}
              className="px-4 py-1.5 border border-greenGlow/25 hover:border-greenGlow rounded text-[10px] font-display uppercase tracking-wider text-greenGlow hover:text-white bg-greenGlow/5 hover:bg-greenGlow/10 transition-all cursor-pointer mx-auto"
            >
              Acknowledge
            </button>
          </div>
        </div>
      )}

      <AgreementDraftModal
        isOpen={isDraftOpen}
        onClose={() => setIsDraftOpen(false)}
        partner={profile}
        startup={startup}
        token={token}
        onSubmitSuccess={() => {
          setIsDraftOpen(false);
          setSuccessMessage(`Supply agreement proposal sent to ${profile?.startupName || 'them'} successfully! You can review and negotiate it in the Business Messages tab.`);
        }}
      />

    </div>
  );
}
