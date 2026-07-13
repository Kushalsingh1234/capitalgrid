import React, { useState, useEffect } from 'react';
import { 
  getAgreementsList, 
  acceptAgreement, 
  rejectAgreement, 
  cancelAgreement,
  sendAgreementDelivery,
  acceptAgreementDelivery,
  rejectAgreementDelivery,
  retractAgreement,
  terminateAgreement,
  getAgreementDeliveries
} from '../services/agreementService';
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
  if (!code) return <span className="text-[10px] shrink-0">🌐</span>;
  return (
    <img 
      src={`https://flagcdn.com/w40/${code}.png`} 
      alt={countryName} 
      className="w-4 h-2.5 object-cover rounded-sm border border-white/10 shrink-0" 
      title={countryName}
    />
  );
};

const getCountryName = (code) => {
  if (!code) return 'Global';
  const codes = {
    'IN': 'India', 'in': 'India', 'IND': 'India',
    'US': 'United States', 'us': 'United States', 'USA': 'United States',
    'GB': 'United Kingdom', 'gb': 'United Kingdom', 'UK': 'United Kingdom',
    'DE': 'Germany', 'de': 'Germany',
    'JP': 'Japan', 'jp': 'Japan',
    'BR': 'Brazil', 'br': 'Brazil',
    'AU': 'Australia', 'au': 'Australia'
  };
  return codes[code] || code;
};

const getProductIdFromCommodity = (commodityName) => {
  if (!commodityName) return '';
  const name = commodityName.trim().toLowerCase();
  const customMap = {
    'seeds': 'seeds',
    'wheat': 'wheat',
    'rice': 'rice',
    'cotton': 'cotton',
    'grains': 'grains',
    'vegetables': 'vegetables',
    'fodder': 'fodder',
    'milk': 'milk',
    'eggs': 'eggs',
    'coal': 'coal',
    'iron ore': 'iron_ore',
    'bauxite ore': 'bauxite_ore',
    'limestone': 'limestone',
    'gypsum': 'gypsum',
    'crude oil': 'crude_oil',
    'minerals': 'minerals',
    'sand': 'sand',
    'clay': 'clay',
    'shirts': 'shirts',
    'jeans': 'jeans',
    'jackets': 'jackets',
    'fabric': 'fabric',
    'bread': 'bread',
    'biscuits': 'biscuits',
    'cheese': 'cheese',
    'steel': 'steel',
    'aluminium': 'aluminium',
    'cement': 'cement',
    'bricks': 'bricks',
    'steel beams': 'steel_beams',
    'glass': 'glass',
    'silicon': 'silicon',
    'plastics': 'plastics',
    'chemicals': 'chemicals',
    'processors': 'processor',
    'processor': 'processor',
    'displays': 'display',
    'display': 'display',
    'electronic components': 'electronic_components',
    'batteries': 'battery',
    'battery': 'battery',
    'on-board computers': 'on_board_computer',
    'on_board_computer': 'on_board_computer',
    'phones': 'phones',
    'laptops': 'laptops',
    'tvs': 'tvs',
    'combustion engines': 'combustion_engine',
    'combustion_engine': 'combustion_engine',
    'cars': 'cars'
  };
  return customMap[name] || name.replace(/ /g, '_');
};

const formatDeliveryInterval = (interval, unit) => {
  const num = Number(interval || 1);
  const u = String(unit || 'Days').toLowerCase();
  
  if (u === 'days' || u === 'day') {
    if (num === 1) return 'Every 24 Hours';
    return `Every ${num} Days`;
  }
  if (u === 'weeks' || u === 'week') {
    if (num === 1) return 'Every 7 Days';
    return `Every ${num * 7} Days`;
  }
  if (u === 'hours' || u === 'hour') {
    return `Every ${num} Hours`;
  }
  if (u === 'minutes' || u === 'minute') {
    return `Every ${num} Minutes`;
  }
  return `Every ${num} ${unit}`;
};

const getIntervalMs = (value, unit) => {
  const val = Number(value || 1);
  const u = String(unit || 'Days').toLowerCase();
  if (u === 'minutes' || u === 'minute') return val * 60 * 1000;
  if (u === 'hours' || u === 'hour') return val * 60 * 60 * 1000;
  if (u === 'weeks' || u === 'week') return val * 7 * 24 * 60 * 60 * 1000;
  return val * 24 * 60 * 60 * 1000; // default Days
};

const formatCountdown = (ms) => {
  if (ms <= 0) return '00:00:00';
  const totalSecs = Math.floor(ms / 1000);
  const secs = totalSecs % 60;
  const totalMins = Math.floor(totalSecs / 60);
  const mins = totalMins % 60;
  const totalHours = Math.floor(totalMins / 60);
  const hours = totalHours % 24;
  const days = Math.floor(totalHours / 24);

  const pad = (num) => String(num).padStart(2, '0');
  
  if (days > 0) {
    return `${days}d ${pad(hours)}:${pad(mins)}:${pad(secs)}`;
  }
  return `${pad(hours)}:${pad(mins)}:${pad(secs)}`;
};

export default function ContractsDrawer({ isOpen, onClose, startup, token }) {
  const [activeTab, setActiveTab] = useState('Active'); // 'Offers', 'Active', 'History'
  const [agreements, setAgreements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Detail view overlay state
  const [selectedAgreement, setSelectedAgreement] = useState(null);
  // Counter proposal draft overlay state
  const [counterProposalTarget, setCounterProposalTarget] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState(null);

  // Logistics & execution states
  const [b2bToast, setB2bToast] = useState(null);
  const showB2bToast = (message, type = 'success') => {
    setB2bToast({ message, type });
  };
  useEffect(() => {
    if (b2bToast) {
      const timer = setTimeout(() => setB2bToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [b2bToast]);

  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (!isOpen) return;
    setActiveTab('Active');
    const timer = setInterval(() => {
      setTick(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [isOpen]);

  const [offersCount, setOffersCount] = useState(0);
  const [activeDeliveriesCount, setActiveDeliveriesCount] = useState(0);

  const fetchTabCounts = async () => {
    if (!token || !startup) return;
    try {
      const offersRes = await getAgreementsList({ tab: 'Offers', page: 1, limit: 100 }, token);
      if (offersRes.success) {
        const incomingOffers = offersRes.agreements.filter(a => 
          a.status === 'Pending' && 
          String(a.createdBy?._id || a.createdBy) !== String(startup._id)
        );
        setOffersCount(incomingOffers.length);
      }
      
      const activeRes = await getAgreementsList({ tab: 'Active', page: 1, limit: 100 }, token);
      if (activeRes.success) {
        const deliveriesList = activeRes.pendingDeliveries || [];
        const incomingDeliveries = deliveriesList.filter(d => {
          const agreement = activeRes.agreements.find(a => String(a._id) === String(d.agreementId));
          if (!agreement) return false;
          return String(agreement.buyer?._id || agreement.buyer) === String(startup._id);
        });
        setActiveDeliveriesCount(incomingDeliveries.length);
      }
    } catch (err) {
      console.error('Error fetching tab counts inside drawer:', err);
    }
  };

  const [listPendingDeliveries, setListPendingDeliveries] = useState([]);
  const [deliveries, setDeliveries] = useState([]);
  const [loadingDeliveries, setLoadingDeliveries] = useState(false);
  const [rejectingDeliveryId, setRejectingDeliveryId] = useState(null);
  const [rejectionOption, setRejectionOption] = useState('Incorrect Quantity');
  const [customReason, setCustomReason] = useState('');

  const loadDeliveries = async (agreementId) => {
    setLoadingDeliveries(true);
    try {
      const res = await getAgreementDeliveries(agreementId, token);
      if (res.success) {
        setDeliveries(res.deliveries || []);
      }
    } catch (err) {
      console.error('Failed to load deliveries:', err);
    } finally {
      setLoadingDeliveries(false);
    }
  };

  useEffect(() => {
    if (selectedAgreement) {
      loadDeliveries(selectedAgreement._id);
    } else {
      setDeliveries([]);
    }
  }, [selectedAgreement]);

  const handleSendDelivery = async (agreeId) => {
    setLoading(true);
    try {
      const res = await sendAgreementDelivery(agreeId, token);
      if (res.success) {
        showB2bToast(res.message, 'success');
        if (selectedAgreement) {
          await loadDeliveries(agreeId);
        }
        await loadAgreements();
      }
    } catch (err) {
      showB2bToast(err.message || 'Dispatch failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptDelivery = async (delId, agreeId) => {
    setLoading(true);
    try {
      const res = await acceptAgreementDelivery(delId, token);
      if (res.success) {
        showB2bToast(res.message, 'success');
        if (selectedAgreement) {
          const freshDetails = await getAgreementsList({ tab: activeTab, search, page }, token);
          const freshAgree = freshDetails.agreements.find(a => String(a._id) === String(agreeId));
          if (freshAgree) {
            setSelectedAgreement(freshAgree);
          } else {
            setSelectedAgreement(null);
          }
          await loadDeliveries(agreeId);
        }
        await loadAgreements();
        window.dispatchEvent(new CustomEvent('refresh-dashboard-data'));
      }
    } catch (err) {
      showB2bToast(err.message || 'Acceptance failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRejectDeliverySubmit = async () => {
    if (!rejectingDeliveryId) return;
    const finalReason = rejectionOption === 'Other' ? customReason : rejectionOption;
    if (rejectionOption === 'Other' && !customReason.trim()) {
      showB2bToast('Please specify a rejection reason.', 'error');
      return;
    }

    setLoading(true);
    try {
      const res = await rejectAgreementDelivery(rejectingDeliveryId, finalReason, token);
      if (res.success) {
        showB2bToast(res.message, 'success');
        setRejectingDeliveryId(null);
        setCustomReason('');
        if (selectedAgreement) {
          await loadDeliveries(selectedAgreement._id);
        }
        await loadAgreements();
        window.dispatchEvent(new CustomEvent('refresh-dashboard-data'));
      }
    } catch (err) {
      showB2bToast(err.message || 'Rejection failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRetract = (agreeId) => {
    setConfirmDialog({
      type: 'retract',
      id: agreeId,
      message: 'Are you sure you want to retract early from this covenant? The other company will be entitled to close or charge a compensation penalty.'
    });
  };

  const executeRetract = async (agreeId) => {
    setLoading(true);
    try {
      const res = await retractAgreement(agreeId, token);
      if (res.success) {
        showB2bToast(res.message, 'success');
        if (selectedAgreement) {
          setSelectedAgreement(res.agreement);
          await loadDeliveries(agreeId);
        }
        await loadAgreements();
      }
    } catch (err) {
      showB2bToast(err.message || 'Retraction failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleResolveTermination = async (agreeId, charge) => {
    setLoading(true);
    try {
      const res = await terminateAgreement(agreeId, charge, token);
      if (res.success) {
        showB2bToast(res.message, 'success');
        if (selectedAgreement) {
          setSelectedAgreement(res.agreement);
          await loadDeliveries(agreeId);
        }
        await loadAgreements();
        window.dispatchEvent(new CustomEvent('refresh-dashboard-data'));
      }
    } catch (err) {
      showB2bToast(err.message || 'Resolution failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadAgreements();
    }
  }, [isOpen, activeTab, search, page]);

  // Periodic polling check every 15 seconds
  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      loadAgreements(false);
    }, 15000);
    return () => clearInterval(interval);
  }, [isOpen, activeTab, search, page]);

  const loadAgreements = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    fetchTabCounts();
    try {
      const data = await getAgreementsList({
        tab: activeTab,
        search,
        page,
        limit: 8
      }, token);

      if (data.success) {
        setAgreements(data.agreements || []);
        setListPendingDeliveries(data.pendingDeliveries || []);
        setTotalPages(data.pages || 1);
      }
    } catch (err) {
      console.error('Failed to load supply agreements list:', err);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const executeAccept = async (id) => {
    setLoading(true);
    try {
      const res = await acceptAgreement(id, token);
      if (res.success) {
        setSelectedAgreement(null);
        await loadAgreements();
        window.dispatchEvent(new CustomEvent('refresh-dashboard-data'));
      }
    } catch (err) {
      showB2bToast(err.message || 'Acceptance failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const executeReject = async (id) => {
    setLoading(true);
    try {
      const res = await rejectAgreement(id, token);
      if (res.success) {
        setSelectedAgreement(null);
        await loadAgreements();
      }
    } catch (err) {
      showB2bToast(err.message || 'Rejection failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const executeCancel = async (id) => {
    setLoading(true);
    try {
      const res = await cancelAgreement(id, token);
      if (res.success) {
        setSelectedAgreement(null);
        await loadAgreements();
      }
    } catch (err) {
      showB2bToast(err.message || 'Cancellation failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = (id) => {
    setConfirmDialog({
      type: 'accept',
      id,
      message: 'Are you sure you want to accept this supply agreement proposal? This is legally binding.'
    });
  };

  const handleReject = (id) => {
    setConfirmDialog({
      type: 'reject',
      id,
      message: 'Are you sure you want to reject this supply agreement proposal?'
    });
  };

  const handleCancel = (id) => {
    setConfirmDialog({
      type: 'cancel',
      id,
      message: 'Are you sure you want to cancel this supply agreement proposal?'
    });
  };

  const formatCurrency = (val, country) => {
    const sym = CURRENCY_SYMBOLS[country || 'India'] || '₹';
    return `${sym}${Number(val).toLocaleString()}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed top-0 right-0 h-full w-full sm:w-[440px] z-30 flex shadow-2xl animate-slide-in pointer-events-auto font-body select-none bg-gradient-to-b from-[#0b0c10] to-[#050608] border-l border-white/10 text-white flex-col overflow-hidden">
      
      {/* Drawer Header */}
      <header className="px-5 py-4 border-b border-cyanGlow/25 bg-cyanGlow/5 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2 text-cyanGlow">
          <i className="fa-solid fa-file-signature text-xs"></i>
          <span className="font-display font-extrabold text-[10px] uppercase tracking-widest">
            Contracts Center
          </span>
        </div>
        <button 
          onClick={onClose}
          className="w-6 h-6 border border-white/10 hover:border-white/20 rounded flex items-center justify-center text-text-muted hover:text-white transition-colors cursor-pointer"
        >
          <i className="fa-solid fa-xmark text-xs"></i>
        </button>
      </header>

      {/* Tabs list selector */}
      <div className="flex border-b border-white/5 bg-black/15 shrink-0">
        {['Offers', 'Active', 'History'].map(tab => {
          let badgeCount = 0;
          if (tab === 'Offers') badgeCount = offersCount;
          if (tab === 'Active') badgeCount = activeDeliveriesCount;

          return (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                setPage(1);
                setSearch('');
              }}
              className={`flex-1 py-3 text-center text-[10px] font-display uppercase tracking-widest border-b-2 transition-all cursor-pointer relative ${
                activeTab === tab 
                  ? 'border-cyanGlow text-cyanGlow font-extrabold bg-cyanGlow/5' 
                  : 'border-transparent text-text-secondary hover:text-white'
              }`}
            >
              <span className="inline-flex items-center gap-1.5 justify-center">
                {tab}
                {badgeCount > 0 && (
                  <span className="px-1.5 py-0.5 bg-red-500 text-white text-[7.5px] font-bold font-mono rounded-full leading-none border border-black/30 animate-pulse">
                    {badgeCount}
                  </span>
                )}
              </span>
            </button>
          );
        })}
      </div>

      {/* Search Bar */}
      <div className="p-3 border-b border-white/5 bg-black/20 shrink-0">
        <div className="relative">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-text-muted">
            <i className="fa-solid fa-magnifying-glass text-[9px]"></i>
          </span>
          <input
            type="text"
            placeholder="Search by commodity name..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full bg-black/55 border border-white/10 focus:border-cyanGlow/40 rounded pl-8 pr-3 py-1.5 text-[10px] text-white placeholder-text-muted outline-none transition-all font-mono"
          />
        </div>
      </div>

      {/* List content container */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3.5 scrollbar-thin relative min-h-0">
        {loading && agreements.length === 0 && (
          <div className="absolute inset-0 bg-black/40 z-10 flex items-center justify-center font-mono text-[9px] text-cyanGlow">
            <i className="fa-solid fa-circle-notch animate-spin mr-1.5"></i> Syncing Agreements...
          </div>
        )}

        {agreements.length === 0 ? (
          <div className="text-center py-16 text-text-muted font-mono text-[10px]">
            No agreements found in {activeTab}.
          </div>
        ) : (
          agreements.map(agree => {
            const isBuyer = String(agree.buyer._id || agree.buyer) === String(startup?._id);
            const partner = isBuyer ? agree.seller : agree.buyer;
            const isIncoming = String(agree.createdBy) !== String(startup?._id);

            const displayStatusColor = 
              agree.status === 'Active' ? 'text-greenGlow bg-green-500/10 border-green-500/25' :
              agree.status === 'Pending' ? 'text-cyanGlow bg-cyanGlow/10 border-cyanGlow/25' :
              agree.status === 'Countered' ? 'text-amber-400 bg-amber-500/10 border-amber-500/25' :
              agree.status === 'Rejected' ? 'text-red-400 bg-red-500/10 border-red-500/25' :
              'text-text-muted bg-white/5 border-white/5';

            return (
              <div 
                key={agree._id} 
                className="p-4 bg-white/2 border border-white/5 rounded-lg flex flex-col gap-3 font-sans hover:border-white/15 transition-all"
              >
                {/* Partner and status header */}
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-6 h-6 rounded border border-white/10 bg-black/40 flex items-center justify-center shrink-0 overflow-hidden text-[9px]">
                      {partner.logo ? (
                        <div className="w-full h-full" dangerouslySetInnerHTML={{ __html: partner.logo }} />
                      ) : (
                        <i className="fa-solid fa-building"></i>
                      )}
                    </div>
                    <span className="font-bold text-white text-xs truncate max-w-[150px]">
                      {partner.startupName || 'Partner'}
                    </span>
                    {renderFlagImage(partner.country)}
                  </div>
                  <span className={`px-2 py-0.2 rounded text-[7.5px] font-mono tracking-wider border uppercase ${displayStatusColor}`}>
                    {agree.status}
                  </span>
                </div>

                {/* Details layout */}
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-[10px] font-mono">
                  <div>
                    <span className="text-text-muted text-[8px] uppercase block">Commodity</span>
                    <span className="text-white font-bold">{agree.commodity}</span>
                  </div>
                  <div>
                    <span className="text-text-muted text-[8px] uppercase block">Quantity</span>
                    <span className="text-white font-bold">{Number(agree.quantity).toLocaleString()} units</span>
                  </div>
                  <div>
                    <span className="text-text-muted text-[8px] uppercase block">Consignment Value</span>
                    <span className="text-white font-bold">{formatCurrency(agree.offerValue, startup?.country)}</span>
                  </div>
                  <div>
                    <span className="text-text-muted text-[8px] uppercase block">Total Contract Value</span>
                    <span className="text-greenGlow font-bold">{formatCurrency(agree.offerValue * agree.duration, startup?.country)}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-text-muted text-[8px] uppercase block">Delivery Frequency</span>
                    <span className="text-white font-bold">
                      {formatDeliveryInterval(agree.deliveryInterval || agree.intervalValue, agree.deliveryIntervalUnit || 'Days')}
                    </span>
                  </div>
                  {activeTab === 'Active' && (
                    <div className="col-span-2 mt-1">
                      <span className="text-text-muted text-[8px] uppercase block">Contract Duration progress</span>
                      <div className="w-full bg-white/5 rounded-full h-1.5 mt-1 overflow-hidden relative border border-white/5">
                        <div className="bg-greenGlow h-full" style={{ width: `${Math.min(100, (agree.progress / agree.duration) * 100)}%` }} />
                      </div>
                      <span className="text-white font-bold text-[9px] mt-1 block">
                        {agree.progress} / {agree.duration} Deliveries completed
                      </span>
                    </div>
                  )}
                </div>

                {/* Actions line & Operations Tray */}
                <div className="flex flex-col gap-2.5 border-t border-white/5 pt-3 mt-1 shrink-0">
                  {/* Inline Logistics Control Panel for Active Tab */}
                  {activeTab === 'Active' && ['Active', 'Terminated'].includes(agree.status) && (() => {
                    const isSeller = String(agree.seller._id || agree.seller) === String(startup?._id);
                    const isBuyer = String(agree.buyer._id || agree.buyer) === String(startup?._id);
                    
                    if (agree.status === 'Terminated') {
                      const isInitiator = String(agree.terminatedBy) === String(startup?._id);
                      if (isInitiator) {
                        return (
                          <div className="bg-amber-500/5 border border-amber-500/20 rounded p-2 text-[9px] font-mono text-center text-amber-400">
                            <span>⏳ Retraction Protocol Active: Awaiting partner payout resolution...</span>
                          </div>
                        );
                      }
                      
                      const remainingDeliveries = agree.duration - agree.progress;
                      const remainingConsignmentValue = remainingDeliveries * agree.offerValue;
                      const penaltyValue = Math.round(remainingConsignmentValue * 0.50);

                      return (
                        <div className="flex flex-col gap-2 bg-red-500/5 border border-red-500/25 rounded p-2.5 text-[9px] font-mono animate-pulse">
                          <div className="flex items-center gap-1.5 text-red-400 font-bold">
                            <i className="fa-solid fa-triangle-exclamation"></i>
                            <span>CONTRACT TERMINATED EARLY BY PARTNER</span>
                          </div>
                          
                          <p className="text-text-muted text-[8px] leading-relaxed">
                            The partner terminated this contract. You can charge a 50% early termination fee of <strong className="text-white">{formatCurrency(penaltyValue, startup?.country)}</strong> or close peacefully.
                          </p>

                          <div className="flex items-center gap-2 justify-end mt-1">
                            <button
                              onClick={() => handleResolveTermination(agree._id, false)}
                              className="px-2 py-0.5 rounded border border-white/10 hover:border-white/20 text-white bg-white/5 text-[8px] font-bold uppercase cursor-pointer"
                            >
                              Close Peacefully
                            </button>
                            <button
                              onClick={() => handleResolveTermination(agree._id, true)}
                              className="px-2 py-0.5 bg-red-500/20 border border-red-500/40 hover:bg-red-500/30 text-red-400 rounded text-[8px] font-bold uppercase cursor-pointer"
                            >
                              Charge {formatCurrency(penaltyValue, startup?.country)}
                            </button>
                          </div>
                        </div>
                      );
                    }

                    const pendingDel = listPendingDeliveries.find(d => String(d.agreementId) === String(agree._id));
                    const now = new Date();
                    const isWindowOpen = !agree.nextDeliveryAt || new Date(agree.nextDeliveryAt) <= now;
                    
                    const productId = getProductIdFromCommodity(agree.commodity);
                    const invItem = startup?.inventory?.find(i => i.productId === productId);
                    const availableQty = invItem ? (invItem.quantity || 0) : 0;
                    const hasSufficientStock = availableQty >= agree.quantity;

                    if (pendingDel) {
                      return (
                        <div className="bg-cyanGlow/5 border border-cyanGlow/25 rounded p-2 flex items-center justify-between text-[9px] font-mono">
                          <span className="text-cyanGlow font-bold animate-pulse">⏳ Batch #{pendingDel.deliveryNumber} Dispatched</span>
                          {isBuyer ? (
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                onClick={() => setRejectingDeliveryId(pendingDel._id)}
                                className="px-2 py-1 rounded border border-red-500/25 text-red-400 hover:bg-red-500/10 hover:text-white uppercase text-[8px] font-bold cursor-pointer"
                              >
                                Reject
                              </button>
                              <button
                                onClick={() => handleAcceptDelivery(pendingDel._id, agree._id)}
                                className="px-2 py-1 bg-green-500/15 border border-green-500/30 hover:bg-green-500/25 text-greenGlow uppercase text-[8px] font-bold cursor-pointer"
                              >
                                Accept
                              </button>
                            </div>
                          ) : (
                            <span className="text-text-muted text-[8px] italic">Awaiting buyer response...</span>
                          )}
                        </div>
                      );
                    }

                    if (isSeller) {
                      const intervalMs = getIntervalMs(agree.deliveryInterval || agree.intervalValue, agree.deliveryIntervalUnit || 'Days');
                      const nextDelTime = new Date(agree.nextDeliveryAt).getTime();
                      const nowTime = Date.now();
                      const remaining = nextDelTime - nowTime;

                      let timerLabel = '';
                      let timerColor = '';
                      let timerValue = '';

                      if (remaining > 0) {
                        timerLabel = 'Window Opens';
                        timerColor = 'text-cyanGlow';
                        timerValue = formatCountdown(remaining);
                      } else {
                        timerLabel = 'Window Closes';
                        timerColor = 'text-amber-400 animate-pulse';
                        const closeTime = nextDelTime + intervalMs;
                        timerValue = formatCountdown(closeTime - nowTime);
                      }

                      return (
                        <div className="grid grid-cols-3 items-center bg-white/2 border border-white/5 p-2 rounded text-[9px] font-mono gap-1 text-center animate-fade-in">
                          <div className="flex flex-col gap-0.5 text-left pl-1">
                            <span className="text-text-muted text-[7.2px] uppercase block">Warehouse Stock</span>
                            <span className={hasSufficientStock ? 'text-greenGlow font-bold' : 'text-red-400 font-bold'}>
                              {availableQty} / {agree.quantity}
                            </span>
                          </div>

                          <div className="flex flex-col gap-0.5 border-l border-r border-white/5">
                            <span className="text-text-muted text-[7.2px] uppercase block">{timerLabel}</span>
                            <span className={`font-mono font-bold tracking-wider text-[8.5px] ${timerColor}`}>
                              {timerValue}
                            </span>
                          </div>

                          <div className="flex justify-end pr-1">
                            {remaining > 0 ? (
                              <button
                                disabled
                                className="px-2 py-1 bg-white/5 border border-white/10 text-text-muted rounded text-[8px] font-bold uppercase cursor-not-allowed w-full text-center"
                              >
                                Locked
                              </button>
                            ) : (
                              <button
                                disabled={!hasSufficientStock}
                                onClick={() => handleSendDelivery(agree._id)}
                                className="px-2 py-1 bg-green-500/15 border border-green-500/30 hover:bg-green-500/25 text-greenGlow rounded text-[8px] font-bold uppercase disabled:opacity-30 disabled:pointer-events-none cursor-pointer w-full text-center"
                              >
                                Send
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    }

                    // Buyer waiting for dispatch
                    const intervalMs = getIntervalMs(agree.deliveryInterval || agree.intervalValue, agree.deliveryIntervalUnit || 'Days');
                    const nextDelTime = new Date(agree.nextDeliveryAt).getTime();
                    const nowTime = Date.now();
                    const remaining = nextDelTime - nowTime;

                    let timerLabel = '';
                    let timerColor = '';
                    let timerValue = '';

                    if (remaining > 0) {
                      timerLabel = 'Next Window';
                      timerColor = 'text-cyanGlow';
                      timerValue = formatCountdown(remaining);
                    } else {
                      timerLabel = 'Dispatch Deadline';
                      timerColor = 'text-amber-400 animate-pulse';
                      const closeTime = nextDelTime + intervalMs;
                      timerValue = formatCountdown(closeTime - nowTime);
                    }

                    return (
                      <div className="flex items-center justify-between bg-black/35 border border-white/5 p-2 rounded text-[9px] font-mono px-3 animate-fade-in">
                        <span className="text-text-muted text-[7.5px] uppercase">
                          {remaining > 0 ? '🔒 Window Closed' : '🟢 Awaiting Dispatch'}
                        </span>
                        
                        <div className="flex items-center gap-1.5">
                          <span className="text-text-muted text-[7.5px] uppercase">{timerLabel}:</span>
                          <span className={`font-mono font-bold text-[8.5px] ${timerColor}`}>
                            {timerValue}
                          </span>
                        </div>
                      </div>
                    );
                  })()}

                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => setSelectedAgreement(agree)}
                      className="px-3 py-1.5 rounded border border-white/10 hover:border-white/20 text-[9px] font-display uppercase tracking-wider text-text-secondary hover:text-white transition-colors cursor-pointer bg-white/2"
                    >
                      View Details
                    </button>
                  </div>

                  {/* Incoming proposal pending choices */}
                  {activeTab === 'Offers' && agree.status === 'Pending' && isIncoming && (
                    <>
                      <button
                        onClick={() => setCounterProposalTarget(agree)}
                        className="px-3 py-1.5 rounded border border-amber-500/25 text-amber-400 hover:text-white hover:bg-amber-500/10 text-[9px] font-display uppercase tracking-wider transition-colors cursor-pointer"
                      >
                        Counter
                      </button>
                      <button
                        onClick={() => handleReject(agree._id)}
                        className="px-3 py-1.5 rounded border border-red-500/25 text-red-400 hover:text-white hover:bg-red-500/10 text-[9px] font-display uppercase tracking-wider transition-colors cursor-pointer"
                      >
                        Reject
                      </button>
                      <button
                        onClick={() => handleAccept(agree._id)}
                        className="px-3 py-1.5 bg-green-500/10 border border-green-500/25 hover:bg-green-500/25 text-greenGlow text-[9px] font-display uppercase tracking-wider transition-colors cursor-pointer"
                      >
                        Accept
                      </button>
                    </>
                  )}

                  {/* Outgoing proposal pending cancellation */}
                  {activeTab === 'Offers' && agree.status === 'Pending' && !isIncoming && (
                    <button
                      onClick={() => handleCancel(agree._id)}
                      className="px-3 py-1.5 rounded border border-red-500/25 text-red-400 hover:text-white hover:bg-red-500/10 text-[9px] font-display uppercase tracking-wider transition-colors cursor-pointer"
                    >
                      Cancel Offer
                    </button>
                  )}
                </div>

              </div>
            );
          })
        )}
      </div>

      {/* Pagination indicators footer */}
      {totalPages > 1 && (
        <footer className="px-5 py-3 border-t border-white/5 bg-black/25 flex items-center justify-between shrink-0 font-mono text-[9px] text-text-secondary select-none">
          <button 
            disabled={page === 1}
            onClick={() => setPage(prev => Math.max(1, prev - 1))}
            className="px-2 py-1 rounded border border-white/10 hover:border-white/20 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
          >
            Prev
          </button>
          <span>Page {page} of {totalPages}</span>
          <button 
            disabled={page === totalPages}
            onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
            className="px-2 py-1 rounded border border-white/10 hover:border-white/20 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
          >
            Next
          </button>
        </footer>
      )}

      {/* DETAILED AGREEMENT VIEW SUB-MODAL */}
      {selectedAgreement && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-40 animate-fade-in font-sans">
          <div className="bg-[#11141a] border border-cyanGlow/25 rounded-2xl p-6 max-w-lg w-full flex flex-col gap-5 shadow-[0_0_50px_rgba(0,243,255,0.2)] relative text-white max-h-[90vh] overflow-y-auto scrollbar-thin">
            
            {/* Close Button */}
            <button
              onClick={() => setSelectedAgreement(null)}
              className="absolute top-4 right-4 w-6 h-6 border border-white/10 hover:border-red-500/40 rounded flex items-center justify-center text-xs text-text-secondary hover:text-red-400 bg-white/2 transition-colors cursor-pointer"
            >
              <i className="fa-solid fa-xmark"></i>
            </button>

            {/* Document Header */}
            <div className="text-center flex flex-col gap-1 border-b border-white/10 pb-4">
              <h2 className="font-display font-extrabold text-[13px] uppercase tracking-widest text-cyanGlow">
                Mutual Supply & Procurement Covenant
              </h2>
              <span className="text-[7.5px] font-mono text-text-muted tracking-widest uppercase">
                CapitalGrid Network Certified B2B Agreement
              </span>
            </div>

            {/* Document Body (Parchment Paper Styling) */}
            <div className="bg-[#fcfbf7] text-[#1c1d1f] p-6 rounded-lg border-2 border-[#e5dec9] shadow-[inset_0_0_20px_rgba(0,0,0,0.06)] relative flex flex-col gap-4 font-serif text-[11px] leading-relaxed select-text">
              
              {/* Ratification Stamped Background Badge */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none select-none opacity-[0.07] border-4 border-dashed rounded-lg p-3 text-center -rotate-12 border-red-700">
                <span className="font-sans font-black text-4xl uppercase tracking-widest block">
                  {selectedAgreement.status === 'Active' ? 'RATIFIED' : 'PENDING'}
                </span>
                <span className="font-mono text-xs mt-1 block">VER: v{selectedAgreement.version}</span>
              </div>

              {/* Preamble */}
              <div>
                This Supply Covenant is entered into and made effective as of{' '}
                <strong className="underline decoration-[#c8bba6]">{new Date(selectedAgreement.startDate).toLocaleDateString()}</strong>, by and between the following corporate entities:
              </div>

              {/* Contracting Parties */}
              <div className="grid grid-cols-2 gap-4 border-y border-[#e5dec9] py-3 font-sans text-[10px]">
                <div className="border-r border-[#e5dec9] pr-3 flex flex-col gap-1">
                  <span className="text-text-muted text-[8px] uppercase font-mono tracking-wider">The Buyer (Purchaser)</span>
                  <strong className="text-black text-xs leading-none mt-1 block">{selectedAgreement.buyer.startupName || 'Buyer Partner'}</strong>
                  <span className="text-text-muted mt-1 leading-none">{getCountryName(selectedAgreement.buyer.country)} ({selectedAgreement.buyer.businessType})</span>
                </div>
                <div className="pl-1 flex flex-col gap-1">
                  <span className="text-text-muted text-[8px] uppercase font-mono tracking-wider">The Seller (Supplier)</span>
                  <strong className="text-black text-xs leading-none mt-1 block">{selectedAgreement.seller.startupName || 'Seller Partner'}</strong>
                  <span className="text-text-muted mt-1 leading-none">{getCountryName(selectedAgreement.seller.country)} ({selectedAgreement.seller.businessType})</span>
                </div>
              </div>

              {/* Recitals */}
              <div>
                WHEREAS, the Seller is a registered producer of <strong className="text-black font-extrabold">{selectedAgreement.commodity}</strong>; and
                WHEREAS, the Buyer requires a steady inventory stream of said commodity for operations;
                NOW, THEREFORE, both parties agree to execute the following delivery schedules:
              </div>

              {/* Certified Schedule Table */}
              <div className="bg-[#f6f2e5] border border-[#dcd1b4] rounded p-3 font-mono text-[9.5px] text-black flex flex-col gap-1.5 shadow-sm">
                <div className="flex justify-between border-b border-[#dcd1b4] pb-1">
                  <span>I. Lot Product Type</span>
                  <strong className="text-cyan-900">{selectedAgreement.commodity}</strong>
                </div>
                <div className="flex justify-between border-b border-[#dcd1b4] pb-1">
                  <span>II. Lot Batch Quantity</span>
                  <strong>{Number(selectedAgreement.quantity).toLocaleString()} Units</strong>
                </div>
                <div className="flex justify-between border-b border-[#dcd1b4] pb-1">
                  <span>III. Batch Valuation Offer (Consignment)</span>
                  <strong className="text-green-800">{formatCurrency(selectedAgreement.offerValue, startup?.country)}</strong>
                </div>
                <div className="flex justify-between border-b border-[#dcd1b4] pb-1">
                  <span>IV. Total Contract Value</span>
                  <strong className="text-green-800 font-extrabold">{formatCurrency(selectedAgreement.offerValue * selectedAgreement.duration, startup?.country)}</strong>
                </div>
                <div className="flex justify-between border-b border-[#dcd1b4] pb-1">
                  <span>V. Delivery Frequency</span>
                  <strong>Every {selectedAgreement.intervalValue} Day(s) ({selectedAgreement.intervalType})</strong>
                </div>
                <div className="flex justify-between border-[#dcd1b4] pb-0.5">
                  <span>VI. Term Duration Cycles</span>
                  <strong>{selectedAgreement.duration} Deliveries Total</strong>
                </div>
              </div>

              {/* Sections / Clauses */}
              <div className="flex flex-col gap-2 font-serif text-[10px]">
                <div>
                  <strong>Section 1 (Late Delivery Penalty):</strong> In the event of a delayed shipment cycle, the Seller shall pay an automated penalty sum of{' '}
                  <span className="underline font-bold text-red-900">{formatCurrency(selectedAgreement.lateDeliveryPenalty, startup?.country)}</span> per delayed cycle to the Buyer.
                </div>
                <div>
                  <strong>Section 2 (Termination Indemnity):</strong> Premature cancellation of this covenant by either party triggers an early termination compensation of{' '}
                  <span className="underline font-bold text-red-900">{formatCurrency(selectedAgreement.earlyTerminationCompensation, startup?.country)}</span> paid to the injured party.
                </div>
                {selectedAgreement.specialNotes && (
                  <div>
                    <strong>Section 3 (Custom Covenants):</strong> {selectedAgreement.specialNotes}
                  </div>
                )}
              </div>

              {/* Signature Blocks */}
              <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-dashed border-[#c8bba6] font-sans text-[8.5px] text-text-muted">
                <div className="flex flex-col gap-1">
                  <div className="h-6 border-b border-black/30 font-mono text-[9px] text-[#4f555e] italic flex items-end pb-0.5 pl-1 select-none">
                    {selectedAgreement.status === 'Active' ? `Digitally Signed` : 'Pending Ratification'}
                  </div>
                  <span>Authorized Signature (Buyer)</span>
                </div>
                <div className="flex flex-col gap-1">
                  <div className="h-6 border-b border-black/30 font-mono text-[9px] text-[#4f555e] italic flex items-end pb-0.5 pl-1 select-none">
                    {selectedAgreement.status === 'Active' ? `Digitally Signed` : 'Pending Ratification'}
                  </div>
                  <span>Authorized Signature (Seller)</span>
                </div>
              </div>

            </div>

            {/* Logistics Execution & Operations Console */}
            {['Active', 'Terminated', 'Completed'].includes(selectedAgreement.status) && (
              <div className="bg-black/40 border border-white/10 rounded-xl p-4 flex flex-col gap-3 font-mono text-[10px] text-white">
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                  <span className="text-cyanGlow uppercase font-bold tracking-wider text-[9px]">Logistics Execution Console</span>
                </div>

                {/* Progress Stats */}
                <div className="grid grid-cols-2 gap-2 border-b border-white/5 pb-3">
                  <div>
                    <span className="text-text-muted text-[8px] uppercase block">Contract Progress</span>
                    <strong className="text-white text-xs">{selectedAgreement.progress} / {selectedAgreement.duration} Deliveries</strong>
                  </div>
                  <div>
                    <span className="text-text-muted text-[8px] uppercase block">Interval Cycle</span>
                    <strong className="text-white text-xs">
                      {formatDeliveryInterval(selectedAgreement.deliveryInterval, selectedAgreement.deliveryIntervalUnit)}
                    </strong>
                  </div>
                </div>

                {/* Logistics Controls and Inventory Display */}
                {(() => {
                  const isBuyer = String(selectedAgreement.buyer._id || selectedAgreement.buyer) === String(startup?._id);
                  const isSeller = String(selectedAgreement.seller._id || selectedAgreement.seller) === String(startup?._id);
                  
                  const productId = getProductIdFromCommodity(selectedAgreement.commodity);
                  const invItem = startup?.inventory?.find(i => i.productId === productId);
                  const availableQty = invItem ? (invItem.quantity || 0) : 0;
                  const requiredQty = selectedAgreement.quantity;
                  const missingQty = Math.max(0, requiredQty - availableQty);

                  const pendingDelivery = deliveries.find(d => d.status === 'Pending');
                  const now = new Date();
                  const isWindowOpen = !selectedAgreement.nextDeliveryAt || new Date(selectedAgreement.nextDeliveryAt) <= now;

                  if (selectedAgreement.status === 'Active') {
                    return (
                      <div className="flex flex-col gap-3">
                        {isSeller && (
                          <div className="bg-white/2 p-2.5 rounded border border-white/5 flex flex-col gap-1.5">
                            <span className="text-text-muted text-[8px] uppercase block">Supplier Warehouse Stock Check</span>
                            <div className="grid grid-cols-3 gap-1 text-center font-bold">
                              <div className="border-r border-white/5">
                                <span className="text-text-muted text-[7.5px] block font-normal">REQUIRED</span>
                                <span className="text-cyanGlow">{requiredQty}</span>
                              </div>
                              <div className="border-r border-white/5">
                                <span className="text-text-muted text-[7.5px] block font-normal">AVAILABLE</span>
                                <span className={availableQty >= requiredQty ? 'text-greenGlow' : 'text-red-400'}>{availableQty}</span>
                              </div>
                              <div>
                                <span className="text-text-muted text-[7.5px] block font-normal">MISSING</span>
                                <span className={missingQty > 0 ? 'text-red-400' : 'text-text-muted'}>{missingQty}</span>
                              </div>
                            </div>
                          </div>
                        )}

                        <div className="flex flex-col gap-2">
                          {pendingDelivery ? (
                            <div className="bg-cyanGlow/5 border border-cyanGlow/25 rounded p-3 text-center flex flex-col gap-2">
                              <span className="text-cyanGlow font-bold block animate-pulse">
                                ⏳ Batch #{pendingDelivery.deliveryNumber} Dispatched
                              </span>
                              <span className="text-text-muted text-[8px] block">
                                Sent At: {new Date(pendingDelivery.sentAt).toLocaleString()}
                                <br />
                                Auto-Accepts in: {Math.max(0, Math.round((new Date(pendingDelivery.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60)))} real hours
                              </span>
                              {isBuyer && (
                                <div className="flex items-center gap-2 mt-1">
                                  <button
                                    onClick={() => setRejectingDeliveryId(pendingDelivery._id)}
                                    className="flex-1 py-1.5 rounded border border-red-500/25 text-red-400 hover:bg-red-500/10 hover:text-white uppercase tracking-wider text-[8px] font-bold cursor-pointer"
                                  >
                                    Reject Delivery
                                  </button>
                                  <button
                                    onClick={() => handleAcceptDelivery(pendingDelivery._id, selectedAgreement._id)}
                                    className="flex-1 py-1.5 bg-green-500/15 border border-green-500/30 hover:bg-green-500/25 text-greenGlow uppercase tracking-wider text-[8px] font-bold cursor-pointer"
                                  >
                                    Accept Delivery
                                  </button>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="text-center py-2">
                              {isWindowOpen ? (
                                <div className="flex flex-col gap-2">
                                  <span className="text-greenGlow text-[8px] uppercase font-bold block">🟢 Delivery Window Open</span>
                                  {isSeller ? (
                                    <button
                                      disabled={availableQty < requiredQty}
                                      onClick={() => handleSendDelivery(selectedAgreement._id)}
                                      className="w-full py-2 bg-green-500/15 hover:bg-green-500/25 border border-green-500/30 rounded text-[9px] font-bold uppercase tracking-widest text-greenGlow disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                                    >
                                      Send Delivery Batch
                                    </button>
                                  ) : (
                                    <span className="text-text-muted text-[8px]">Waiting for Supplier to dispatch shipment...</span>
                                  )}
                                </div>
                              ) : (
                                <div className="text-center font-sans py-1 text-text-muted text-[8px]">
                                  🔒 Next delivery window opens: {new Date(selectedAgreement.nextDeliveryAt).toLocaleString()}
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Early Retract Button */}
                        <div className="border-t border-white/5 pt-2 flex justify-end">
                          <button
                            onClick={() => handleRetract(selectedAgreement._id)}
                            className="px-2.5 py-1 rounded border border-red-500/10 hover:border-red-500/35 text-red-500 hover:text-white hover:bg-red-500/5 text-[8px] uppercase tracking-wider cursor-pointer font-bold"
                          >
                            Retract Contract Early
                          </button>
                        </div>
                      </div>
                    );
                  }

                  if (selectedAgreement.status === 'Terminated') {
                    return (
                      <div className="bg-red-950/20 border border-red-500/20 rounded p-3 flex flex-col gap-2">
                        <span className="text-red-400 font-bold text-center block">❌ Early Termination Protocol Active</span>
                        <div className="text-text-muted text-[8.5px] leading-relaxed flex flex-col gap-1">
                          <span>Initiated By: {String(selectedAgreement.terminatedBy) === String(startup?._id) ? 'Your Startup' : 'Partner Startup'}</span>
                          <span>Remaining Contract Value: {formatCurrency(selectedAgreement.remainingContractValue, startup?.country)}</span>
                          <span>Retraction Penalty: {formatCurrency(Math.round(selectedAgreement.remainingContractValue * 0.5), startup?.country)} (50% defaults)</span>
                        </div>

                        {selectedAgreement.compensationStatus === 'Pending' ? (
                          String(selectedAgreement.terminatedBy) !== String(startup?._id) ? (
                            <div className="flex items-center gap-2 mt-2">
                              <button
                                onClick={() => handleResolveTermination(selectedAgreement._id, false)}
                                className="flex-1 py-1.5 rounded border border-white/10 hover:bg-white/5 text-white uppercase tracking-wider text-[8px] font-bold cursor-pointer"
                              >
                                Close Peacefully (No Fees)
                              </button>
                              <button
                                onClick={() => handleResolveTermination(selectedAgreement._id, true)}
                                className="flex-1 py-1.5 bg-red-500/15 border border-red-500/35 hover:bg-red-500/25 text-red-400 uppercase tracking-wider text-[8px] font-bold cursor-pointer"
                              >
                                Charge Payout Fees (50%)
                              </button>
                            </div>
                          ) : (
                            <span className="text-text-secondary text-center text-[8px] italic block mt-1">
                              Waiting for partner startup to choose settlement terms...
                            </span>
                          )
                        ) : (
                          <div className="text-center font-bold text-[8.5px] text-greenGlow mt-1">
                            Settlement: {selectedAgreement.compensationStatus} 
                            <br />
                            Compensation Transferred: {formatCurrency(selectedAgreement.compensationPaid, startup?.country)}
                          </div>
                        )}
                      </div>
                    );
                  }

                  if (selectedAgreement.status === 'Completed') {
                    return (
                      <div className="bg-green-950/20 border border-green-500/20 rounded p-3 text-center text-greenGlow font-bold">
                        ✔ Covenant Fulfilled & Completed Successfully
                      </div>
                    );
                  }
                  
                  return null;
                })()}

                {/* Deliveries Timeline Attempts History */}
                {deliveries.length > 0 && (
                  <div className="mt-2 border-t border-white/5 pt-3">
                    <span className="text-text-muted text-[8px] uppercase block mb-2">Delivery Run History</span>
                    <div className="flex flex-col gap-1.5 max-h-[140px] overflow-y-auto scrollbar-thin pr-1">
                      {deliveries.map(del => (
                        <div key={del._id} className="flex items-center justify-between bg-white/2 border border-white/5 p-2 rounded">
                          <div className="flex flex-col">
                            <span className="text-white font-bold">Delivery Cycle #{del.deliveryNumber}</span>
                            <span className="text-text-muted text-[7.5px]">Dispatched: {new Date(del.sentAt).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            {del.status === 'Accepted' && <span className="text-greenGlow font-bold text-[8px] uppercase">Accepted ✔</span>}
                            {del.status === 'AutoAccepted' && <span className="text-greenGlow font-bold text-[8px] uppercase">Auto-Accepted ✔</span>}
                            {del.status === 'Rejected' && (
                              <span className="text-red-400 text-[8px] font-bold uppercase" title={`Reason: ${del.rejectionReason}`}>
                                Rejected ❌
                              </span>
                            )}
                            {del.status === 'Pending' && <span className="text-cyanGlow text-[8px] font-bold uppercase animate-pulse">Pending ⏳</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Document metadata info panel */}
            <div className="flex items-center justify-between text-[8px] font-mono text-text-muted border-t border-white/5 pt-3">
              <span>EXPIRES: {new Date(selectedAgreement.expiresAt).toLocaleString()}</span>
              <span>VER: {selectedAgreement.version}.0</span>
            </div>

            {/* Acknowledgement Action Button */}
            <button
              onClick={() => setSelectedAgreement(null)}
              className="w-full py-2.5 bg-cyanGlow/15 border border-cyanGlow/25 hover:bg-cyanGlow/25 text-cyanGlow hover:text-white text-[10px] font-display uppercase tracking-wider rounded-lg transition-all cursor-pointer shadow-[0_0_15px_rgba(0,243,255,0.05)]"
            >
              Close Covenants View
            </button>
          </div>
        </div>
      )}

      {/* REJECTION REASON DIALOG MODAL */}
      {rejectingDeliveryId && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center p-6 z-50 animate-fade-in">
          <div className="bg-[#121620] border border-red-500/20 max-w-xs w-full p-5 rounded-xl shadow-[0_0_40px_rgba(239,68,68,0.15)] flex flex-col gap-4 text-left font-sans animate-scale-up">
            <div>
              <h3 className="font-display font-extrabold text-[11px] uppercase tracking-widest text-red-400">
                Reject Delivery Batch
              </h3>
              <p className="text-[9.5px] text-text-secondary mt-1.5 leading-relaxed">
                Please select a valid commercial reason for rejecting this supply delivery batch:
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[8px] text-text-muted uppercase font-mono">Rejection Category</label>
              <select
                value={rejectionOption}
                onChange={(e) => setRejectionOption(e.target.value)}
                className="w-full bg-black/50 border border-white/10 rounded px-2.5 py-1.5 text-white text-[10px] outline-none font-mono"
              >
                <option value="Incorrect Quantity">Incorrect Quantity</option>
                <option value="Delivery Not Received">Delivery Not Received</option>
                <option value="Other">Other (Specify Custom Reason)</option>
              </select>

              {rejectionOption === 'Other' && (
                <div className="flex flex-col gap-1 mt-1">
                  <label className="text-[8px] text-text-muted uppercase font-mono">Custom Explanation</label>
                  <textarea
                    rows={3}
                    placeholder="Provide details about why the delivery was rejected..."
                    value={customReason}
                    onChange={(e) => setCustomReason(e.target.value)}
                    className="w-full bg-black/60 border border-white/10 rounded px-2 py-1.5 text-white text-[9.5px] outline-none font-mono resize-none"
                  />
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 justify-end mt-1">
              <button
                onClick={() => {
                  setRejectingDeliveryId(null);
                  setCustomReason('');
                }}
                className="px-3 py-1.5 rounded border border-white/10 hover:bg-white/5 text-[9px] font-display uppercase tracking-wider text-text-secondary hover:text-white transition-all cursor-pointer font-bold"
              >
                Cancel
              </button>
              <button
                onClick={handleRejectDeliverySubmit}
                className="px-3 py-1.5 bg-red-500/15 border border-red-500/35 hover:bg-red-500/25 text-red-400 rounded text-[9px] font-display uppercase tracking-wider transition-all cursor-pointer font-bold"
              >
                Submit Rejection
              </button>
            </div>
          </div>
        </div>
      )}


      {/* COUNTER PROPOSAL MODAL DRAFT */}
      {counterProposalTarget && (
        <AgreementDraftModal
          isOpen={true}
          onClose={() => setCounterProposalTarget(null)}
          counteringAgreement={counterProposalTarget}
          startup={startup}
          token={token}
          onSubmitSuccess={async () => {
            setCounterProposalTarget(null);
            await loadAgreements();
          }}
        />
      )}

      {confirmDialog && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6 z-50 animate-fade-in">
          <div className={`glass-card max-w-xs w-full p-5 border bg-gradient-to-b from-[#0e1017] to-[#050608] rounded-xl flex flex-col gap-4 text-center font-sans animate-scale-up ${
            confirmDialog.type === 'retract' ? 'border-red-500/25 shadow-[0_0_30px_rgba(239,68,68,0.15)]' : 'border-cyanGlow/25 shadow-[0_0_30px_rgba(0,243,255,0.15)]'
          }`}>
            
            <div className={`w-12 h-12 rounded-full border flex items-center justify-center text-lg mx-auto shadow-[0_0_15px_rgba(0,243,255,0.1)] ${
              confirmDialog.type === 'retract' 
                ? 'border-red-500/30 bg-red-500/5 text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.1)]' 
                : 'border-cyanGlow/30 bg-cyanGlow/5 text-cyanGlow'
            }`}>
              <i className="fa-solid fa-circle-exclamation animate-pulse"></i>
            </div>

            <div>
              <h3 className="font-display font-extrabold text-[11px] uppercase tracking-widest text-white">
                {confirmDialog.type === 'retract' ? 'Warning: Early Retraction' : 'Confirm Operation'}
              </h3>
              <p className="text-[10px] text-text-secondary mt-2 leading-relaxed font-sans">
                {confirmDialog.message}
              </p>
            </div>

            <div className="flex items-center gap-2 justify-center mt-1">
              <button
                onClick={() => setConfirmDialog(null)}
                className="flex-1 py-2 rounded border border-white/10 hover:border-white/20 text-[9px] font-display uppercase tracking-wider text-text-secondary hover:text-white transition-all cursor-pointer bg-white/2"
              >
                No, Back
              </button>
              <button
                onClick={async () => {
                  const { type, id } = confirmDialog;
                  setConfirmDialog(null);
                  if (type === 'accept') await executeAccept(id);
                  else if (type === 'reject') await executeReject(id);
                  else if (type === 'cancel') await executeCancel(id);
                  else if (type === 'retract') await executeRetract(id);
                }}
                className={`flex-1 py-2 rounded text-[9px] font-display uppercase tracking-wider transition-all cursor-pointer font-bold ${
                  confirmDialog.type === 'retract'
                    ? 'bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-400 hover:text-white shadow-[0_0_10px_rgba(239,68,68,0.05)]'
                    : 'bg-cyanGlow/25 hover:bg-cyanGlow/35 border border-cyanGlow/40 text-cyanGlow hover:text-white shadow-[0_0_10px_rgba(0,243,255,0.05)]'
                }`}
              >
                Yes, Proceed
              </button>
            </div>

          </div>
        </div>
      )}

      {/* B2B CUSTOM TOAST SYSTEM */}
      {b2bToast && (
        <div className="fixed bottom-20 right-6 z-50 animate-fade-in pointer-events-none">
          <div className={`px-4 py-3 rounded-lg border font-mono text-[9.5px] text-white flex items-center gap-2.5 shadow-[0_0_20px_rgba(0,0,0,0.5)] ${
            b2bToast.type === 'error'
              ? 'bg-[#1a0f12] border-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.1)]'
              : 'bg-[#0b1615] border-green-500/30 shadow-[0_0_15px_rgba(34,197,94,0.1)]'
          }`}>
            <i className={`fa-solid ${b2bToast.type === 'error' ? 'fa-triangle-exclamation text-red-400' : 'fa-circle-check text-greenGlow'} text-xs`}></i>
            <span>{b2bToast.message}</span>
          </div>
        </div>
      )}

    </div>
  );
}
