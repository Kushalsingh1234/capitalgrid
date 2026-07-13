import React, { useState, useEffect } from 'react';
import { publishContract } from '../services/contractService';

const VALID_COMMODITIES = [
  { id: 'seeds', name: 'Seeds' },
  { id: 'wheat', name: 'Wheat' },
  { id: 'rice', name: 'Rice' },
  { id: 'cotton', name: 'Cotton' },
  { id: 'grains', name: 'Grains' },
  { id: 'vegetables', name: 'Vegetables' },
  { id: 'fodder', name: 'Fodder' },
  { id: 'milk', name: 'Milk' },
  { id: 'eggs', name: 'Eggs' },
  { id: 'coal', name: 'Coal' },
  { id: 'iron_ore', name: 'Iron Ore' },
  { id: 'bauxite_ore', name: 'Bauxite Ore' },
  { id: 'limestone', name: 'Limestone' },
  { id: 'gypsum', name: 'Gypsum' },
  { id: 'crude_oil', name: 'Crude Oil' },
  { id: 'minerals', name: 'Minerals' },
  { id: 'sand', name: 'Sand' },
  { id: 'clay', name: 'Clay' },
  { id: 'shirts', name: 'Shirts' },
  { id: 'jeans', name: 'Jeans' },
  { id: 'jackets', name: 'Jackets' },
  { id: 'fabric', name: 'Fabric' },
  { id: 'bread', name: 'Bread' },
  { id: 'biscuits', name: 'Biscuits' },
  { id: 'cheese', name: 'Cheese' },
  { id: 'steel', name: 'Steel' },
  { id: 'aluminium', name: 'Aluminium' },
  { id: 'cement', name: 'Cement' },
  { id: 'bricks', name: 'Bricks' },
  { id: 'steel_beams', name: 'Steel Beams' },
  { id: 'glass', name: 'Glass' },
  { id: 'silicon', name: 'Silicon' },
  { id: 'plastics', name: 'Plastics' },
  { id: 'chemicals', name: 'Chemicals' },
  { id: 'processor', name: 'Processors' },
  { id: 'display', name: 'Displays' },
  { id: 'electronic_components', name: 'Electronic Components' },
  { id: 'battery', name: 'Batteries' },
  { id: 'on_board_computer', name: 'On-Board Computers' },
  { id: 'phones', name: 'Phones' },
  { id: 'laptops', name: 'Laptops' },
  { id: 'tvs', name: 'TVs' },
  { id: 'combustion_engine', name: 'Combustion Engines' },
  { id: 'cars', name: 'Cars' }
];

export default function PublishContractModal({ token, startup, onClose, onRefresh }) {
  const [contractType, setContractType] = useState('Buying');
  const [commodity, setCommodity] = useState(VALID_COMMODITIES[0].name);
  const [quantity, setQuantity] = useState('');
  const [offerValue, setOfferValue] = useState('');
  const [deliveryInterval, setDeliveryInterval] = useState('Daily');
  const [duration, setDuration] = useState('7'); // '3', '7', '14', '30'
  const [penalty, setPenalty] = useState('10'); // '10', '20', '30', '50'
  const [description, setDescription] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Expiry calculation display
  const [expiryDisplay, setExpiryDisplay] = useState('');

  useEffect(() => {
    const days = Number(duration);
    const expDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
    setExpiryDisplay(expDate.toLocaleDateString(undefined, { 
      weekday: 'short', 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    }));
  }, [duration]);

  // Derived unit price calculation
  const getImpliedUnitPrice = () => {
    const qty = Number(quantity);
    const val = Number(offerValue);
    if (!qty || !val || qty <= 0 || val <= 0) return 0;
    return val / qty;
  };

  const formatCurrency = (amount) => {
    const sym = startup?.country === 'India' ? '₹' : '$';
    return `${sym}${Number(amount || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    // Validation
    const qty = Number(quantity);
    const value = Number(offerValue);

    if (!qty || qty <= 0) {
      setError('Please provide a positive quantity count.');
      return;
    }
    if (!value || value <= 0) {
      setError('Please provide a positive offer consignment value.');
      return;
    }
    if (description.length > 500) {
      setError('Description length exceeds maximum 500 character limit.');
      return;
    }

    // Map interval dropdown selection to internal schema values
    let intervalType = 'Daily';
    let intervalValue = 1;
    let deliveryIntervalVal = 1;
    let deliveryIntervalUnitVal = 'Days';

    if (deliveryInterval === 'Every 2 Days') {
      intervalType = 'Daily';
      intervalValue = 2;
      deliveryIntervalVal = 2;
      deliveryIntervalUnitVal = 'Days';
    } else if (deliveryInterval === 'Weekly') {
      intervalType = 'Weekly';
      intervalValue = 1;
      deliveryIntervalVal = 1;
      deliveryIntervalUnitVal = 'Weeks';
    }

    setLoading(true);

    try {
      const payload = {
        contractType,
        commodity,
        quantity: qty,
        offerValue: value,
        intervalType,
        intervalValue,
        deliveryInterval: deliveryIntervalVal,
        deliveryIntervalUnit: deliveryIntervalUnitVal,
        duration: Number(duration),
        lateDeliveryPenalty: Number(penalty),
        description
      };

      await publishContract(payload, token);
      setSuccessMsg('B2B Contract requirements published successfully.');
      setTimeout(() => {
        onRefresh();
        onClose();
      }, 1500);
    } catch (err) {
      setError(err.message || 'Failed to submit contract publishing details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#0b0c10] border border-cyanGlow/25 rounded-lg p-6 flex flex-col gap-6 select-none animate-fadeIn w-full max-w-3xl mx-auto shadow-[0_4px_25px_rgba(0,0,0,0.5)]">
      
      {/* HEADER SECTION */}
      <div className="flex items-center justify-between border-b border-white/10 pb-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded border border-cyanGlow/30 flex items-center justify-center text-cyanGlow text-base bg-black/60 shadow-[0_0_10px_rgba(0,243,255,0.1)]">
            <i className="fa-solid fa-file-signature"></i>
          </div>
          <div>
            <h2 className="text-sm font-display font-extrabold uppercase text-white tracking-widest leading-none">
              Publish Contract Requirement
            </h2>
            <p className="text-[10px] text-text-muted mt-1 leading-none font-mono">
              Create a B2B Buying or Selling Tender
            </p>
          </div>
        </div>

        <button 
          type="button"
          onClick={onClose}
          disabled={loading}
          className="px-3.5 py-1.5 border border-white/10 hover:border-red-500/50 rounded text-[10px] font-display uppercase tracking-wider text-text-secondary hover:text-red-400 bg-white/2 hover:bg-red-950/20 transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
        >
          <i className="fa-solid fa-chevron-left"></i> Back to Marketplace
        </button>
      </div>

      {/* FORM BODY */}
      <div className="flex-1 w-full">
        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-6 font-mono text-xs">
          
          {error && (
            <div className="bg-red-950/30 border border-red-500/30 p-3 rounded text-[11px] text-red-400 flex items-center gap-2">
              <i className="fa-solid fa-triangle-exclamation"></i>
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="bg-green-950/30 border border-green-500/30 p-3 rounded text-[11px] text-green-400 flex items-center gap-2">
              <i className="fa-solid fa-circle-check"></i>
              <span>{successMsg}</span>
            </div>
          )}

          {/* TWO COLUMNS INPUT */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

            {/* Contract Type Toggle */}
            <div className="flex flex-col gap-2">
              <label className="text-[10px] text-text-muted uppercase tracking-wider">Contract Action Type</label>
              <div className="flex bg-black/40 border border-white/10 rounded p-0.5">
                <button
                  type="button"
                  onClick={() => setContractType('Buying')}
                  className={`flex-1 py-2 text-center rounded text-[10px] uppercase font-display tracking-wider transition-all cursor-pointer ${
                    contractType === 'Buying'
                      ? 'bg-red-500/20 text-red-400 border border-red-500/20 font-bold'
                      : 'text-text-secondary hover:text-white'
                  }`}
                >
                  <i className="fa-solid fa-cart-shopping mr-1.5"></i>
                  Buying Requirement
                </button>
                <button
                  type="button"
                  onClick={() => setContractType('Selling')}
                  className={`flex-1 py-2 text-center rounded text-[10px] uppercase font-display tracking-wider transition-all cursor-pointer ${
                    contractType === 'Selling'
                      ? 'bg-green-500/20 text-green-400 border border-green-500/20 font-bold'
                      : 'text-text-secondary hover:text-white'
                  }`}
                >
                  <i className="fa-solid fa-truck-ramp-box mr-1.5"></i>
                  Selling Requirement
                </button>
              </div>
            </div>

            {/* Commodity Type Selection */}
            <div className="flex flex-col gap-2">
              <label className="text-[10px] text-text-muted uppercase tracking-wider">Target Commodity</label>
              <select
                value={commodity}
                onChange={(e) => setCommodity(e.target.value)}
                className="w-full bg-black/60 border border-white/10 hover:border-cyanGlow/40 rounded p-2 text-white outline-none cursor-pointer focus:border-cyanGlow transition-colors"
              >
                {VALID_COMMODITIES.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Consignment Count (Quantity) */}
            <div className="flex flex-col gap-2">
              <label className="text-[10px] text-text-muted uppercase tracking-wider">Consignment Quantity (Units)</label>
              <input
                type="number"
                min="1"
                placeholder="e.g. 1000"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                required
                className="w-full bg-black/60 border border-white/10 hover:border-cyanGlow/40 rounded p-2 text-white outline-none focus:border-cyanGlow transition-colors"
              />
            </div>

            {/* Total Consignment Offer Value */}
            <div className="flex flex-col gap-2">
              <label className="text-[10px] text-text-muted uppercase tracking-wider">
                Total Consignment Value ({startup?.country === 'India' ? '₹' : '$'})
              </label>
              <input
                type="number"
                min="1"
                placeholder="e.g. 90000"
                value={offerValue}
                onChange={(e) => setOfferValue(e.target.value)}
                required
                className="w-full bg-black/60 border border-white/10 hover:border-cyanGlow/40 rounded p-2 text-white outline-none focus:border-cyanGlow transition-colors"
              />
            </div>

          </div>

          {/* DYNAMIC CALCULATED VALUE PANEL */}
          <div className="bg-cyanGlow/5 border border-cyanGlow/25 p-3 rounded grid grid-cols-2 gap-4 shrink-0 font-mono text-[9.5px]">
            <div className="flex flex-col gap-1">
              <span className="text-[8.5px] text-cyanGlow uppercase">Derived Implied Rate</span>
              <span className="text-white font-bold">
                {getImpliedUnitPrice() > 0 
                  ? `${formatCurrency(getImpliedUnitPrice())} / Unit` 
                  : '—'
                }
              </span>
            </div>
            <div className="flex flex-col gap-1 text-right">
              <span className="text-[8.5px] text-cyanGlow uppercase">Total Contract Value</span>
              <span className="text-white font-bold">
                {Number(offerValue || 0) > 0 
                  ? formatCurrency(Number(offerValue || 0) * Number(duration || 3))
                  : '—'
                }
              </span>
            </div>
          </div>

          {/* DELIVERIES & LOGISTICS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            
            {/* Delivery Interval */}
            <div className="flex flex-col gap-2">
              <label className="text-[10px] text-text-muted uppercase tracking-wider">Delivery Interval</label>
              <select
                value={deliveryInterval}
                onChange={(e) => setDeliveryInterval(e.target.value)}
                className="w-full bg-black/60 border border-white/10 hover:border-cyanGlow/40 rounded p-2 text-white outline-none cursor-pointer focus:border-cyanGlow transition-colors"
              >
                <option value="Daily">Daily</option>
                <option value="Every 2 Days">Every 2 Days</option>
                <option value="Weekly">Weekly</option>
              </select>
            </div>

            {/* Contract Duration */}
            <div className="flex flex-col gap-2">
              <label className="text-[10px] text-text-muted uppercase tracking-wider">Contract Duration</label>
              <select
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full bg-black/60 border border-white/10 hover:border-cyanGlow/40 rounded p-2 text-white outline-none cursor-pointer focus:border-cyanGlow transition-colors"
              >
                <option value="3">3 Days</option>
                <option value="7">7 Days</option>
                <option value="14">14 Days</option>
                <option value="30">30 Days</option>
              </select>
            </div>

            {/* Penalty */}
            <div className="flex flex-col gap-2">
              <label className="text-[10px] text-text-muted uppercase tracking-wider">Late Delivery Penalty</label>
              <select
                value={penalty}
                onChange={(e) => setPenalty(e.target.value)}
                className="w-full bg-black/60 border border-white/10 hover:border-cyanGlow/40 rounded p-2 text-white outline-none cursor-pointer focus:border-cyanGlow transition-colors"
              >
                <option value="10">10% Penalty</option>
                <option value="20">20% Penalty</option>
                <option value="30">30% Penalty</option>
                <option value="50">50% Penalty</option>
              </select>
            </div>

          </div>

          {/* DYNAMIC CALCULATED EXPIRY PANEL */}
          <div className="bg-black/40 border border-white/5 p-3 rounded flex items-center justify-between">
            <span className="text-[10px] text-text-secondary uppercase">Projected Expiry Timestamp</span>
            <span className="text-white font-bold">{expiryDisplay}</span>
          </div>

          {/* DESCRIPTION */}
          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <label className="text-[10px] text-text-muted uppercase tracking-wider">Contract description / specifications</label>
              <span className="text-[9px] text-text-muted">{description.length}/500</span>
            </div>
            <textarea
              maxLength="500"
              placeholder="Provide special instructions, payment targets, or delivery routing requirements..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-black/60 border border-white/10 hover:border-cyanGlow/40 rounded p-3 text-white outline-none focus:border-cyanGlow transition-colors h-24 resize-none font-sans leading-relaxed"
            />
          </div>

          {/* ACTIONS ROW */}
          <div className="flex justify-end gap-3 mt-4 shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-5 py-2 border border-white/10 hover:border-white/20 rounded uppercase text-[10px] font-display tracking-wider text-text-secondary hover:text-white transition-colors cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 border border-cyanGlow/35 hover:border-cyanGlow rounded uppercase text-[10px] font-display tracking-wider text-cyanGlow hover:text-white bg-cyanGlow/10 hover:bg-cyanGlow/25 transition-all cursor-pointer shadow-[0_0_15px_rgba(0,243,255,0.05)] disabled:opacity-50 font-bold"
            >
              {loading ? (
                <span className="flex items-center gap-1.5">
                  <i className="fa-solid fa-circle-notch animate-spin"></i>
                  Publishing...
                </span>
              ) : (
                'Publish Contract'
              )}
            </button>
          </div>

        </form>
      </div>

    </div>
  );
}
