import React, { useState } from 'react';

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

export default function ContractDetailsModal({ contract, onClose }) {
  const [placeholderAlert, setPlaceholderAlert] = useState(null); // 'propose', 'negotiate'

  if (!contract) return null;

  const impliedUnitPrice = contract.quantity > 0 ? (contract.offerValue / contract.quantity) : 0;

  return (
    <div className="fixed inset-0 bg-black/85 z-40 flex items-center justify-center p-4 animate-fadeIn font-mono">
      <div className="bg-[#0b0c10] border border-cyanGlow/30 rounded-lg max-w-lg w-full flex flex-col overflow-hidden shadow-[0_0_40px_rgba(0,243,255,0.15)] max-h-[90vh]">
        
        {/* HEADER */}
        <header className="bg-black/90 px-5 py-4 border-b border-white/5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${contract.contractType === 'Buying' ? 'bg-red-500' : 'bg-green-500'} animate-pulse`}></span>
            <span className="text-[10px] text-white font-bold uppercase tracking-wider">
              {contract.contractType} B2B requirement details
            </span>
          </div>
          <button 
            onClick={onClose}
            className="w-5 h-5 border border-white/10 hover:border-red-500/50 rounded flex items-center justify-center text-[10px] text-text-secondary hover:text-red-400 bg-white/2 transition-colors cursor-pointer"
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        </header>

        {/* DETAILS BODY */}
        <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-5 text-xs select-none">
          
          {/* Company identity card */}
          <div className="bg-white/2 border border-white/5 rounded-lg p-4 flex items-center justify-between">
            <div className="flex flex-col gap-1.5">
              <span className="text-[9px] text-text-muted uppercase">Publishing Company</span>
              <span className="text-white font-bold text-sm leading-none">{contract.startupName}</span>
              <span className="text-[9.5px] text-text-secondary flex items-center gap-1.5 mt-0.5">
                {renderFlagImage(contract.country)}
                <span>{getCountryName(contract.country)}</span>
                <span>•</span>
                <span>{contract.businessType}</span>
              </span>
            </div>
            <div className="px-2.5 py-1 rounded bg-cyanGlow/5 border border-cyanGlow/15 text-[9px] text-cyanGlow uppercase">
              {contract.status}
            </div>
          </div>

          {/* Commodity Details grid */}
          <div className="grid grid-cols-2 gap-4">
            
            <div className="bg-black/40 border border-white/5 p-3 rounded">
              <span className="text-[8.5px] text-text-muted uppercase block mb-1">Target Commodity</span>
              <span className="text-white font-bold">{contract.commodity}</span>
            </div>

            <div className="bg-black/40 border border-white/5 p-3 rounded">
              <span className="text-[8.5px] text-text-muted uppercase block mb-1">Consignment Volume</span>
              <span className="text-white font-bold">{Number(contract.quantity).toLocaleString()} Units</span>
            </div>

            <div className="bg-black/40 border border-white/5 p-3 rounded">
              <span className="text-[8.5px] text-text-muted uppercase block mb-1">Consignment Value</span>
              <span className="text-greenGlow font-bold">{formatCurrency(contract.offerValue, contract.country)}</span>
            </div>

            <div className="bg-cyanGlow/5 border border-cyanGlow/15 p-3 rounded">
              <span className="text-[8.5px] text-cyanGlow uppercase block mb-1">Implied unit rate</span>
              <span className="text-white font-bold">{formatCurrency(impliedUnitPrice, contract.country)} / Unit</span>
            </div>

            <div className="bg-cyanGlow/5 border border-cyanGlow/15 p-3 rounded col-span-2 flex items-center justify-between font-mono">
              <div>
                <span className="text-[8.5px] text-cyanGlow uppercase block mb-1">Total Contract Value</span>
                <span className="text-greenGlow font-bold text-xs">
                  {formatCurrency(contract.offerValue * contract.duration, contract.country)}
                </span>
              </div>
              <span className="text-text-muted text-[8px] italic">({contract.duration} deliveries of {formatCurrency(contract.offerValue, contract.country)} each)</span>
            </div>

          </div>

          {/* Logistics and Delivery grids */}
          <div className="grid grid-cols-3 gap-3">
            
            <div className="bg-white/2 border border-white/5 p-2.5 rounded text-center">
              <span className="text-[8px] text-text-muted uppercase block mb-1">Interval</span>
              <span className="text-white font-bold text-[10px]">
                {formatDeliveryInterval(contract.deliveryInterval || contract.intervalValue, contract.deliveryIntervalUnit || 'Days')}
              </span>
            </div>

            <div className="bg-white/2 border border-white/5 p-2.5 rounded text-center">
              <span className="text-[8px] text-text-muted uppercase block mb-1">Duration</span>
              <span className="text-white font-bold text-[10px]">{contract.duration} Days</span>
            </div>

            <div className="bg-white/2 border border-white/5 p-2.5 rounded text-center">
              <span className="text-[8px] text-text-muted uppercase block mb-1">Late Penalty</span>
              <span className="text-red-400 font-bold text-[10px]">{contract.lateDeliveryPenalty}% Penalty</span>
            </div>

          </div>

          {/* Timestamps */}
          <div className="flex flex-col gap-2 font-mono text-[10px] bg-black/20 p-3 rounded border border-white/5">
            <div className="flex justify-between">
              <span className="text-text-muted">Posted Date:</span>
              <span className="text-white">{new Date(contract.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-muted">Contract Expiry:</span>
              <span className="text-white font-bold">{new Date(contract.expiryDate).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</span>
            </div>
          </div>

          {/* Description */}
          <div className="flex flex-col gap-2">
            <span className="text-[9px] text-text-muted uppercase tracking-wider">Specifications / Instructions</span>
            <div className="bg-black/40 border border-white/5 rounded p-3 text-text-secondary leading-relaxed font-sans text-[11px] h-20 overflow-y-auto">
              {contract.description || 'No special supply chain specifications provided.'}
            </div>
          </div>

        </div>

        {/* BOTTOM ACTIONS DRAWER */}
        <footer className="bg-black/90 border-t border-white/5 p-4 flex items-center justify-end gap-3 shrink-0 z-10">
          <button 
            onClick={() => {
              const targetCompanyId = contract.startupId?._id || contract.startupId;
              if (targetCompanyId) {
                window.dispatchEvent(new CustomEvent('start-b2b-conversation', {
                  detail: {
                    targetCompanyId,
                    category: 'Contract Inquiry',
                    contractRef: contract
                  }
                }));
                onClose();
              }
            }}
            className="px-4 py-2 border border-white/10 hover:border-cyanGlow/40 rounded text-[10px] font-display uppercase tracking-wider text-text-secondary hover:text-cyanGlow bg-white/2 hover:bg-cyanGlow/5 transition-all cursor-pointer"
          >
            <i className="fa-solid fa-message mr-1.5"></i> Negotiate
          </button>
          <button 
            onClick={() => {
              window.dispatchEvent(new CustomEvent('start-agreement-draft', {
                detail: { contract }
              }));
              onClose();
            }}
            className="px-4 py-2 border border-cyanGlow/30 hover:border-cyanGlow rounded text-[10px] font-display uppercase tracking-wider text-cyanGlow hover:text-white bg-cyanGlow/10 hover:bg-cyanGlow/25 transition-all cursor-pointer shadow-[0_0_15px_rgba(0,243,255,0.05)]"
          >
            <i className="fa-solid fa-file-signature mr-1.5"></i> Propose Agreement
          </button>
        </footer>

      </div>

      {/* MODAL PLACEHOLDER ALERT */}
      {placeholderAlert && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-black border border-cyanGlow/30 rounded-lg p-6 max-w-sm w-full text-center relative shadow-[0_0_40px_rgba(0,243,255,0.2)] flex flex-col gap-4 font-sans">
            
            <button 
              onClick={() => setPlaceholderAlert(null)}
              className="absolute top-3 right-3 w-5 h-5 border border-white/10 hover:border-red-500/50 rounded flex items-center justify-center text-[10px] text-text-secondary hover:text-red-400 bg-white/2 transition-colors cursor-pointer"
            >
              <i className="fa-solid fa-xmark"></i>
            </button>

            <div className="w-12 h-12 rounded-full border border-cyanGlow/20 bg-cyanGlow/5 flex items-center justify-center text-cyanGlow text-lg mx-auto shadow-[0_0_15px_rgba(0,243,255,0.05)]">
              <i className={placeholderAlert === 'negotiate' ? "fa-solid fa-comments" : "fa-solid fa-handshake"}></i>
            </div>

            <div>
              <h3 className="font-display font-extrabold text-xs uppercase text-white tracking-widest leading-none">
                {placeholderAlert === 'negotiate' ? 'Business Messaging' : 'Business Agreements'}
              </h3>
              <p className="text-[9.5px] text-text-muted mt-2 font-mono">
                B2B Contract Module
              </p>
            </div>

            <p className="text-[10px] text-text-secondary leading-relaxed bg-white/2 p-3 rounded border border-white/5">
              {placeholderAlert === 'negotiate' 
                ? 'Business Messaging will be available in Phase 27.' 
                : 'Business Agreements will be available in Phase 28.'
              }
            </p>

            <button
              onClick={() => setPlaceholderAlert(null)}
              className="px-4 py-1.5 border border-cyanGlow/25 hover:border-cyanGlow rounded text-[10px] font-display uppercase tracking-wider text-cyanGlow hover:text-white bg-cyanGlow/5 hover:bg-cyanGlow/10 transition-all cursor-pointer mx-auto"
            >
              Acknowledge
            </button>

          </div>
        </div>
      )}

    </div>
  );
}
