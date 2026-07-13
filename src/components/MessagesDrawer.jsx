import React, { useState, useEffect, useRef } from 'react';
import { 
  getConversations, 
  startConversation, 
  getMessages, 
  sendMessage, 
  markAsRead 
} from '../services/messageService';
import ContractDetailsModal from './ContractDetailsModal';

const COUNTRY_FLAGS = {
  'India': '🇮🇳', 'india': '🇮🇳', 'IN': '🇮🇳', 'in': '🇮🇳', 'IND': '🇮🇳', 'ind': '🇮🇳',
  'United States': '🇺🇸', 'united states': '🇺🇸', 'US': '🇺🇸', 'us': '🇺🇸', 'USA': '🇺🇸', 'usa': '🇺🇸',
  'United Kingdom': '🇬🇧', 'united kingdom': '🇬🇧', 'UK': '🇬🇧', 'uk': '🇬🇧', 'GB': '🇬🇧', 'gb': '🇬🇧',
  'Germany': '🇩🇪', 'germany': '🇩🇪', 'DE': '🇩🇪', 'de': '🇩🇪', 'DEU': '🇩🇪', 'deu': '🇩🇪',
  'Japan': '🇯🇵', 'japan': '🇯🇵', 'JP': '🇯🇵', 'jp': '🇯🇵', 'JPN': '🇯🇵', 'jpn': '🇯🇵',
  'Brazil': '🇧🇷', 'brazil': '🇧🇷', 'BR': '🇧🇷', 'br': '🇧🇷', 'BRA': '🇧🇷', 'bra': '🇧🇷',
  'Australia': '🇦🇺', 'australia': '🇦🇺', 'AU': '🇦🇺', 'au': '🇦🇺', 'AUS': '🇦🇺', 'aus': '🇦🇺'
};

const CURRENCY_SYMBOLS = {
  'India': '₹', 'india': '₹', 'IN': '₹', 'in': '₹',
  'United States': '$', 'US': '$', 'us': '$',
  'United Kingdom': '£', 'UK': '£', 'uk': '£',
  'Germany': '€', 'DE': '€', 'de': '€',
  'Japan': '¥', 'JP': '¥', 'jp': '¥',
  'Brazil': 'R$', 'BR': 'R$', 'br': 'R$',
  'Australia': 'A$', 'AU': 'A$', 'au': 'A$'
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
  if (!code) return <span className="text-xs shrink-0">🌐</span>;
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

const formatTimeAgo = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} hr ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return 'Yesterday';
  return `${diffDays} days ago`;
};

export default function MessagesDrawer({ isOpen, onClose, startup, token }) {
  const [conversations, setConversations] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeContractRef, setActiveContractRef] = useState(null);

  // Tracks pending contract attachment when conversation is initialized from Contract details Negotiate button
  const [pendingContract, setPendingContract] = useState(null);

  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      loadConversations();
    }
  }, [isOpen, searchQuery]);

  // Handle start-conversation external events
  useEffect(() => {
    const handleStartEvent = async (e) => {
      const { targetCompanyId, category, contractRef } = e.detail;
      try {
        setLoading(true);
        // Start or reuse conversation
        const res = await startConversation(targetCompanyId, category, token);
        if (res.success && res.conversation) {
          setActiveConversationId(res.conversation._id);
          if (contractRef) {
            // Save contract as pending attachment so player can submit it in chat
            setPendingContract(contractRef);
          }
          await loadConversations();
        }
      } catch (err) {
        console.error('Failed to coordinate starting B2B conversation:', err);
      } finally {
        setLoading(false);
      }
    };

    window.addEventListener('trigger-start-conversation', handleStartEvent);
    return () => {
      window.removeEventListener('trigger-start-conversation', handleStartEvent);
    };
  }, [token]);

  // Background polling for conversations list
  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      loadConversations(false);
    }, 10000);
    return () => clearInterval(interval);
  }, [isOpen, searchQuery]);

  // Background polling for messages
  useEffect(() => {
    if (!isOpen || !activeConversationId) return;
    loadMessages(false);
    const interval = setInterval(() => {
      loadMessages(false);
    }, 5000);
    return () => clearInterval(interval);
  }, [isOpen, activeConversationId]);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadConversations = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const res = await getConversations(searchQuery, token);
      if (res.success) {
        setConversations(res.conversations || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const loadMessages = async (showLoading = true) => {
    if (!activeConversationId) return;
    try {
      const res = await getMessages(activeConversationId, token);
      if (res.success) {
        setMessages(res.messages || []);
        // Auto mark read if viewing
        await markAsRead(activeConversationId, token);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || !activeConversationId) return;

    try {
      const textToSend = inputText;
      setInputText('');
      await sendMessage(activeConversationId, { content: textToSend, type: 'Text' }, token);
      await loadMessages(false);
      await loadConversations(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAttachContract = async () => {
    if (!pendingContract || !activeConversationId) return;
    try {
      const summaryText = `Attached Contract Reference: ${pendingContract.contractType} ${pendingContract.commodity} (${pendingContract.quantity} units)`;
      await sendMessage(activeConversationId, {
        content: summaryText,
        type: 'Contract Reference',
        contractRef: pendingContract._id
      }, token);
      setPendingContract(null);
      await loadMessages(false);
      await loadConversations(false);
    } catch (err) {
      console.error(err);
    }
  };

  const activeConv = conversations.find(c => c._id === activeConversationId);
  const targetCompany = activeConv 
    ? (String(activeConv.companyA._id) === String(startup?._id) ? activeConv.companyB : activeConv.companyA)
    : null;

  const formatCurrency = (val, countryName) => {
    const sym = CURRENCY_SYMBOLS[countryName || 'India'] || '₹';
    return `${sym}${Number(val).toLocaleString()}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed top-0 right-0 h-full w-full sm:w-[440px] z-30 flex shadow-2xl animate-slide-in pointer-events-auto font-body select-none bg-gradient-to-b from-[#0b0c10] to-[#050608] border-l border-white/10 text-white flex-col overflow-hidden">
      
      {/* DRAWER HEADER */}
      <header className="px-5 py-4 border-b border-cyanGlow/25 bg-cyanGlow/5 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2 text-cyanGlow">
          <i className="fa-solid fa-comments text-xs"></i>
          <span className="font-display font-extrabold text-[11.5px] uppercase tracking-widest">
            {activeConversationId ? 'Negotiation Room' : 'Business Messages'}
          </span>
        </div>
        <button 
          onClick={onClose}
          className="w-6 h-6 border border-white/10 hover:border-white/20 rounded flex items-center justify-center text-text-muted hover:text-white transition-colors cursor-pointer"
        >
          <i className="fa-solid fa-xmark text-xs"></i>
        </button>
      </header>

      {/* BODY SECTION */}
      <div className="flex-1 flex flex-col min-h-0 relative">

        {loading && (
          <div className="absolute inset-0 bg-black/60 z-20 flex items-center justify-center gap-2 font-mono text-[11.5px] text-cyanGlow">
            <i className="fa-solid fa-circle-notch animate-spin"></i> Syncing...
          </div>
        )}

        {!activeConversationId ? (
          // --- CONVERSATIONS LIST ---
          <div className="flex-1 flex flex-col min-h-0">
            {/* SEARCH INPUT */}
            <div className="p-4 border-b border-white/5 bg-black/20 shrink-0">
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-text-muted">
                  <i className="fa-solid fa-magnifying-glass text-[11.5px]"></i>
                </span>
                <input
                  type="text"
                  placeholder="Search by company name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-black/55 border border-white/10 focus:border-cyanGlow/40 rounded pl-8 pr-3 py-1.5 text-xs text-white placeholder-text-muted outline-none transition-all font-mono"
                />
              </div>
            </div>

            {/* LIST */}
            <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2 scrollbar-thin">
              {conversations.length === 0 ? (
                <div className="text-center py-16 text-text-muted font-mono text-[11.5px]">
                  No active business communications found.
                </div>
              ) : (
                conversations.map(conv => {
                  const partner = String(conv.companyA._id) === String(startup?._id) ? conv.companyB : conv.companyA;
                  const isUnread = conv.unreadBy.includes(startup?._id);
                  const lastText = conv.lastMessage?.content || 'No messages yet';
                  const timeAgo = formatTimeAgo(conv.updatedAt);
                  const isContractInquiry = conv.category === 'Contract Inquiry';

                  return (
                    <button
                      key={conv._id}
                      onClick={() => {
                        setActiveConversationId(conv._id);
                        loadMessages();
                      }}
                      className={`w-full text-left p-3 border rounded-lg transition-all flex gap-3 relative cursor-pointer ${
                        isUnread 
                          ? 'border-cyanGlow/30 bg-cyanGlow/5 shadow-[0_0_12px_rgba(0,243,255,0.03)]' 
                          : 'border-white/5 bg-white/2 hover:border-white/15 hover:bg-white/4'
                      }`}
                    >
                      {/* Logo indicator */}
                      <div className="w-10 h-10 rounded border border-white/10 bg-black/40 flex items-center justify-center overflow-hidden shrink-0 text-text-secondary">
                        {partner.logo ? (
                          <img src={partner.logo} alt="logo" className="w-full h-full object-cover" />
                        ) : (
                          <i className="fa-solid fa-building text-base"></i>
                        )}
                      </div>

                      {/* Info text */}
                      <div className="flex-1 min-h-0 flex flex-col gap-1">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-white text-xs truncate mr-2">{partner.startupName}</span>
                          <span className="text-[10.5px] text-text-muted whitespace-nowrap font-mono">{timeAgo}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {renderFlagImage(partner.country)}
                          <span className="text-xs uppercase tracking-wider text-text-muted font-mono truncate">{getCountryName(partner.country)}</span>
                          <span className="text-text-muted/30 font-mono">|</span>
                          <span className={`px-1.5 py-0.2 rounded text-[10.5px] font-mono tracking-wider ${
                            isContractInquiry 
                              ? 'bg-red-500/10 border border-red-500/20 text-red-400' 
                              : 'bg-cyan-500/10 border border-cyan-500/20 text-cyan-400'
                          }`}>
                            {conv.category}
                          </span>
                        </div>
                        <p className={`text-[11.5px] truncate mt-1 leading-normal font-sans ${isUnread ? 'text-white font-semibold' : 'text-text-secondary'}`}>
                          {lastText}
                        </p>
                      </div>

                      {/* Green dot unread indicator */}
                      {isUnread && (
                        <span className="absolute top-3.5 right-3 w-2.5 h-2.5 rounded-full bg-cyanGlow animate-pulse" />
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        ) : (
          // --- CHAT INTERFACE ---
          <div className="flex-1 flex flex-col min-h-0 bg-black/25">
            {/* CHAT HEADER / COMPANY PROFILE INFO */}
            {targetCompany && (
              <div className="p-3 border-b border-white/5 bg-black/45 flex flex-col gap-2 shrink-0">
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => {
                      setActiveConversationId(null);
                      setPendingContract(null);
                    }}
                    className="px-2.5 py-1 rounded border border-white/10 hover:border-white/20 text-[10.5px] font-display uppercase tracking-wider text-text-secondary hover:text-white transition-all cursor-pointer flex items-center gap-1"
                  >
                    <i className="fa-solid fa-chevron-left text-xs"></i> Back
                  </button>
                  <span className={`px-2 py-0.5 rounded text-xs font-mono tracking-widest uppercase ${
                    activeConv.category === 'Contract Inquiry' 
                      ? 'bg-red-500/10 border border-red-500/20 text-red-400' 
                      : 'bg-cyan-500/10 border border-cyan-500/20 text-cyan-400'
                  }`}>
                    {activeConv.category}
                  </span>
                </div>

                <div className="flex items-center gap-3 mt-1">
                  <div className="w-10 h-10 rounded border border-white/10 bg-black/40 flex items-center justify-center overflow-hidden shrink-0">
                    {targetCompany.logo ? (
                      <img src={targetCompany.logo} alt="logo" className="w-full h-full object-cover" />
                    ) : (
                      <i className="fa-solid fa-building text-base text-text-secondary"></i>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-white text-xs truncate leading-none">{targetCompany.startupName}</h4>
                    <div className="flex items-center gap-2 mt-1.5 text-[10.5px] font-mono text-text-muted">
                      {renderFlagImage(targetCompany.country)}
                      <span className="truncate">{getCountryName(targetCompany.country)}</span>
                      <span>•</span>
                      <span className="truncate">{targetCompany.businessType}</span>
                    </div>
                  </div>
                  <div className="text-right flex flex-col items-end shrink-0">
                    <span className="text-[10.5px] text-text-muted uppercase tracking-wider font-mono">Valuation</span>
                    <span className="text-xs font-bold text-greenGlow mt-0.5 font-mono">
                      {formatCurrency(targetCompany.companyValuation, targetCompany.country)}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* MESSAGE HISTORY */}
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 scrollbar-thin scrollbar-thumb-white/5">
              {messages.length === 0 ? (
                <div className="flex-1 flex items-center justify-center text-center text-text-muted font-mono text-[11.5px] py-12">
                  Send a B2B message to start negotiations.
                </div>
              ) : (
                messages.map(msg => {
                  const isMe = String(msg.senderCompany) === String(startup?._id);
                  let statusMarker = '';
                  if (isMe) {
                    if (msg.readStatus === 'Read') statusMarker = '✓✓ Read';
                    else if (msg.readStatus === 'Delivered') statusMarker = '✓✓ Delivered';
                    else statusMarker = '✓ Sent';
                  }

                  return (
                    <div 
                      key={msg._id} 
                      className={`flex flex-col max-w-[82%] ${isMe ? 'self-end items-end' : 'self-start items-start'}`}
                    >
                      {/* Sender label */}
                      <span className="text-xs text-text-muted mb-1 font-mono">
                        {isMe ? 'You' : targetCompany?.startupName} • {new Date(msg.createdAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                      </span>

                      {/* Content block */}
                      {msg.type === 'Contract Reference' && msg.contractRef ? (
                        /* CONTRACT REFERENCE SUMMARY CARD */
                        <div className="bg-black/60 border border-cyanGlow/25 rounded-lg p-3 w-72 flex flex-col gap-2 shadow-[0_0_15px_rgba(0,243,255,0.05)] font-sans text-xs">
                          <div className="flex justify-between items-center border-b border-white/5 pb-2">
                            <span className="font-bold text-white text-xs flex items-center gap-1.5">
                              <i className="fa-solid fa-file-contract text-cyanGlow text-[11.5px]"></i>
                              Negotiating Contract Tenders
                            </span>
                            <span className={`px-2 py-0.2 rounded text-xs font-mono tracking-wider ${
                              msg.contractRef.contractType === 'Buying' 
                                ? 'bg-red-500/10 border border-red-500/25 text-red-400' 
                                : 'bg-green-500/10 border border-green-500/25 text-green-400'
                            }`}>
                              {msg.contractRef.contractType.toUpperCase()}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-[11.5px] font-mono mt-1">
                            <div>
                              <span className="text-text-muted block text-xs uppercase">Commodity</span>
                              <span className="text-white font-bold">{msg.contractRef.commodity}</span>
                            </div>
                            <div>
                              <span className="text-text-muted block text-xs uppercase">Quantity</span>
                              <span className="text-white font-bold">{Number(msg.contractRef.quantity).toLocaleString()} units</span>
                            </div>
                            <div>
                              <span className="text-text-muted block text-xs uppercase">Interval</span>
                              <span className="text-white font-bold">
                                {msg.contractRef.intervalType === 'Daily' && msg.contractRef.intervalValue === 2 
                                  ? 'Every 2 Days' 
                                  : `${msg.contractRef.intervalValue}x ${msg.contractRef.intervalType}`}
                              </span>
                            </div>
                            <div>
                              <span className="text-text-muted block text-xs uppercase">Total Value</span>
                              <span className="text-white font-bold">{formatCurrency(msg.contractRef.offerValue, msg.contractRef.country)}</span>
                            </div>
                          </div>

                          <div className="bg-cyanGlow/5 border border-cyanGlow/10 rounded p-1.5 text-center text-[11.5px] font-mono text-cyanGlow mt-1">
                            Implied Price: {formatCurrency((msg.contractRef.offerValue / msg.contractRef.quantity), msg.contractRef.country)} / unit
                          </div>

                          <button
                            type="button"
                            onClick={() => setActiveContractRef(msg.contractRef)}
                            className="mt-2 w-full py-1.5 bg-cyanGlow/15 border border-cyanGlow/25 hover:bg-cyanGlow/25 text-cyanGlow text-[11.5px] font-display uppercase tracking-wider rounded transition-all cursor-pointer"
                          >
                            Open Contract Details
                          </button>
                        </div>
                      ) : (
                        /* TEXT BUBBLE */
                        <div className={`p-2.5 rounded-lg text-xs leading-normal font-sans break-words ${
                          isMe 
                            ? 'bg-cyanGlow/20 text-white rounded-tr-none border border-cyanGlow/25' 
                            : 'bg-white/5 text-text-secondary rounded-tl-none border border-white/5'
                        }`}>
                          {msg.content}
                        </div>
                      )}

                      {/* Status / Checkmarks */}
                      {isMe && (
                        <span className="text-[10.5px] text-text-muted mt-0.5 font-mono uppercase tracking-wide">
                          {statusMarker}
                        </span>
                      )}
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* PENDING CONTRACT ATTACHMENT ACTION */}
            {pendingContract && (
              <div className="px-4 py-2 border-t border-cyanGlow/20 bg-cyanGlow/5 flex justify-between items-center gap-4 shrink-0 font-sans text-xs">
                <div className="flex items-center gap-2">
                  <i className="fa-solid fa-paperclip text-cyanGlow text-[11.5px]"></i>
                  <span className="text-[11.5px] text-text-secondary truncate">
                    Attach Contract: <strong className="text-white">{pendingContract.commodity} ({pendingContract.quantity} units)</strong>
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => setPendingContract(null)}
                    className="px-2.5 py-1 rounded border border-white/10 hover:border-red-500/30 text-[10.5px] font-display uppercase tracking-wider text-text-secondary hover:text-red-400 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAttachContract}
                    className="px-3 py-1 bg-cyanGlow/20 border border-cyanGlow/30 rounded text-[10.5px] font-display uppercase tracking-wider text-cyanGlow hover:text-white transition-colors cursor-pointer"
                  >
                    Attach
                  </button>
                </div>
              </div>
            )}

            {/* INPUT MESSAGE BOX */}
            <form onSubmit={handleSendMessage} className="p-3 border-t border-white/5 bg-black/35 flex items-center gap-2 shrink-0">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 bg-black/55 border border-white/10 focus:border-cyanGlow/40 rounded px-3 py-2 text-xs text-white placeholder-text-muted outline-none transition-all font-sans"
              />
              <button
                type="submit"
                disabled={!inputText.trim()}
                className="px-4 py-2 bg-cyanGlow/20 hover:bg-cyanGlow/35 border border-cyanGlow/30 hover:border-cyanGlow rounded text-[11.5px] font-display uppercase tracking-widest text-cyanGlow hover:text-white transition-all cursor-pointer disabled:opacity-30 disabled:pointer-events-none"
              >
                Send
              </button>
            </form>
          </div>
        )}
      </div>

      {/* NESTED CONTRACT DETAILS MODAL IF REFERENCED CARD IS CLICKED */}
      {activeContractRef && (
        <ContractDetailsModal
          contract={activeContractRef}
          onClose={() => setActiveContractRef(null)}
        />
      )}

    </div>
  );
}
