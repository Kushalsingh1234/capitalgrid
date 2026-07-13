import React, { useState, useEffect } from 'react';
import { createProposal, counterProposal } from '../services/agreementService';

const VALID_COMMODITIES = [
  'Seeds', 'Wheat', 'Rice', 'Cotton', 'Grains', 'Vegetables', 'Fodder', 'Milk', 'Eggs',
  'Coal', 'Iron Ore', 'Bauxite Ore', 'Limestone', 'Gypsum', 'Crude Oil', 'Minerals', 'Sand', 'Clay',
  'Shirts', 'Jeans', 'Jackets', 'Fabric', 'Bread', 'Biscuits', 'Cheese',
  'Steel', 'Aluminium', 'Cement', 'Bricks', 'Steel Beams', 'Glass', 'Silicon', 'Plastics', 'Chemicals',
  'Processors', 'Displays', 'Electronic Components', 'Batteries', 'On-Board Computers', 'Phones', 'Laptops', 'TVs',
  'Combustion Engines', 'Cars'
];

export default function AgreementDraftModal({
  isOpen,
  onClose,
  contract = null,
  counteringAgreement = null,
  partner = null,
  onSubmitSuccess,
  startup,
  token
}) {
  // Pre-fill calculation logic
  const getInitialValues = () => {
    if (counteringAgreement) {
      const getInitialEndDate = (item) => {
        let factor = 1;
        const unit = item.deliveryIntervalUnit || (item.intervalType === 'Weekly' ? 'Weeks' : 'Days');
        if (unit === 'Weeks') factor = 7;
        else if (unit === 'Hours') factor = 1 / 24;
        else if (unit === 'Minutes') factor = 1 / (24 * 60);

        const intervalVal = Number(item.deliveryInterval || item.intervalValue || 1);
        const durationVal = Number(item.duration || 7);
        const totalDays = durationVal * intervalVal * factor;
        const start = item.startDate ? new Date(item.startDate) : new Date();
        return new Date(start.getTime() + totalDays * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      };

      return {
        buyer: counteringAgreement.buyer._id || counteringAgreement.buyer,
        seller: counteringAgreement.seller._id || counteringAgreement.seller,
        commodity: counteringAgreement.commodity,
        quantity: String(counteringAgreement.quantity),
        offerValue: String(counteringAgreement.offerValue),
        intervalType: counteringAgreement.intervalType || 'Daily',
        intervalValue: String(counteringAgreement.intervalValue || 1),
        duration: String(counteringAgreement.duration),
        startDate: counteringAgreement.startDate ? new Date(counteringAgreement.startDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        endDate: counteringAgreement.endDate ? new Date(counteringAgreement.endDate).toISOString().split('T')[0] : getInitialEndDate(counteringAgreement),
        lateDeliveryPenalty: String(counteringAgreement.lateDeliveryPenalty || 0),
        earlyTerminationCompensation: String(Math.floor(Number(counteringAgreement.offerValue || 0) * 0.5)),
        specialNotes: counteringAgreement.specialNotes || '',
        contractRef: counteringAgreement.contractRef?._id || counteringAgreement.contractRef || null,
        version: counteringAgreement.version,
        timeZone: counteringAgreement.timeZone || 'UTC',
        deliveryInterval: String(counteringAgreement.deliveryInterval || counteringAgreement.intervalValue || 1),
        deliveryIntervalUnit: counteringAgreement.deliveryIntervalUnit || 'Days'
      };
    } else if (contract) {
      // Determine buyer/seller based on contract type and publisher
      const publisherId = contract.startupId?._id || contract.startupId || contract.startup;
      const isBuyer = contract.contractType === 'Buying';

      const getInitialEndDate = (item) => {
        let factor = 1;
        const unit = item.deliveryIntervalUnit || (item.intervalType === 'Weekly' ? 'Weeks' : 'Days');
        if (unit === 'Weeks') factor = 7;
        else if (unit === 'Hours') factor = 1 / 24;
        else if (unit === 'Minutes') factor = 1 / (24 * 60);

        const intervalVal = Number(item.deliveryInterval || item.intervalValue || 1);
        const durationVal = Number(item.duration || 7);
        const totalDays = durationVal * intervalVal * factor;
        const start = new Date();
        return new Date(start.getTime() + totalDays * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      };

      return {
        buyer: isBuyer ? publisherId : startup._id,
        seller: isBuyer ? startup._id : publisherId,
        commodity: contract.commodity,
        quantity: String(contract.quantity),
        offerValue: String(contract.offerValue),
        intervalType: contract.intervalType || 'Daily',
        intervalValue: String(contract.intervalValue || 1),
        duration: String(contract.duration || 7),
        startDate: new Date().toISOString().split('T')[0],
        endDate: getInitialEndDate(contract),
        lateDeliveryPenalty: String(contract.lateDeliveryPenalty || 0),
        earlyTerminationCompensation: String(Math.floor(Number(contract.offerValue || 0) * 0.5)), // 50% defaults
        specialNotes: '',
        contractRef: contract._id,
        version: 1,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
        deliveryInterval: String(contract.deliveryInterval || (contract.intervalType === 'Weekly' ? contract.intervalValue * 7 : contract.intervalValue || 1)),
        deliveryIntervalUnit: contract.deliveryIntervalUnit || 'Days'
      };
    }

    // Fully manual draft fallback (e.g. if created from chat blank draft or partner profile)
    return {
      buyer: startup?._id,
      seller: partner?._id || partner || '',
      commodity: VALID_COMMODITIES[0],
      quantity: '',
      offerValue: '',
      intervalType: 'Daily',
      intervalValue: '1',
      duration: '7',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      lateDeliveryPenalty: '0',
      earlyTerminationCompensation: '0',
      specialNotes: '',
      contractRef: null,
      version: 1,
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
      deliveryInterval: '1',
      deliveryIntervalUnit: 'Days'
    };
  };

  const [contractMode, setContractMode] = useState('Buy');
  const [formData, setFormData] = useState(getInitialValues());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Recalculate if props change
  useEffect(() => {
    setFormData(getInitialValues());
    if (partner) {
      setContractMode('Buy');
    }
  }, [contract, counteringAgreement, partner, isOpen]);

  // Recalculate end date if start date, duration, intervalValue, or intervalType changes
  useEffect(() => {
    if (formData.startDate && formData.duration) {
      const dur = Number(formData.duration) || 1;
      const val = Number(formData.intervalValue) || 1;
      const type = formData.intervalType || 'Daily';
      
      let factor = 1; // scale factor in days
      if (type === 'Weekly') factor = 7;
      else if (type === 'Hours') factor = 1 / 24;
      else if (type === 'Minutes') factor = 1 / (24 * 60);

      const totalDays = dur * val * factor;
      const start = new Date(formData.startDate);
      const end = new Date(start.getTime() + totalDays * 24 * 60 * 60 * 1000);
      
      setFormData(prev => ({
        ...prev,
        endDate: end.toISOString().split('T')[0]
      }));
    }
  }, [formData.startDate, formData.duration, formData.intervalValue, formData.intervalType]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const updated = {
        ...prev,
        [name]: value
      };
      if (name === 'offerValue') {
        updated.earlyTerminationCompensation = String(Math.floor((Number(value) || 0) * 0.5));
      }
      return updated;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const qty = Number(formData.quantity);
    const val = Number(formData.offerValue);
    const dur = Number(formData.duration);

    if (!qty || qty <= 0) {
      setError('Quantity must be greater than zero.');
      setLoading(false);
      return;
    }
    if (!val || val <= 0) {
      setError('Offer Value must be greater than zero.');
      setLoading(false);
      return;
    }
    if (!dur || dur <= 0) {
      setError('Contract Duration must be greater than zero.');
      setLoading(false);
      return;
    }

    try {
      const payload = {
        ...formData,
        earlyTerminationCompensation: String(Math.floor((Number(formData.offerValue) || 0) * 0.5)),
        deliveryInterval: Number(formData.intervalValue || 1),
        deliveryIntervalUnit: 
          formData.intervalType === 'Weekly' ? 'Weeks' :
          formData.intervalType === 'Hours' ? 'Hours' :
          formData.intervalType === 'Minutes' ? 'Minutes' : 'Days'
      };

      let res;
      if (counteringAgreement) {
        // Counter proposal version increment
        res = await counterProposal(counteringAgreement._id, payload, token);
      } else {
        // Create initial proposal
        res = await createProposal(payload, token);
      }

      if (res.success) {
        if (onSubmitSuccess) onSubmitSuccess(res.agreement);
        onClose();
      }
    } catch (err) {
      setError(err.message || 'Operation failed. Verify input details.');
    } finally {
      setLoading(false);
    }
  };

  const getImpliedUnitPrice = () => {
    const qty = Number(formData.quantity);
    const val = Number(formData.offerValue);
    if (!qty || !val || qty <= 0 || val <= 0) return 0;
    return val / qty;
  };

  const formatCurrency = (amount) => {
    const sym = startup?.country === 'India' ? '₹' : '$';
    return `${sym}${Number(amount || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in font-sans">
      <div className="bg-[#0b0c10] border border-cyanGlow/30 rounded-xl max-w-xl w-full flex flex-col overflow-hidden shadow-[0_0_40px_rgba(0,243,255,0.15)] max-h-[90vh]">

        {/* Header */}
        <header className="bg-black/90 px-6 py-4 border-b border-white/10 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyanGlow animate-pulse"></span>
            <span className="text-[10px] font-display font-extrabold uppercase tracking-widest text-white">
              {counteringAgreement ? `Agreement Counter Draft (v${formData.version})` : 'Private Supply Agreement Draft'}
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-6 h-6 border border-white/10 hover:border-red-500/50 rounded flex items-center justify-center text-[10px] text-text-secondary hover:text-red-400 bg-white/2 transition-colors cursor-pointer"
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        </header>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 flex flex-col gap-5 text-xs">

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded p-3 text-red-400 font-mono text-[10px]">
              <i className="fa-solid fa-triangle-exclamation mr-1.5"></i>
              {error}
            </div>
          )}

          {partner && (
            <div className="flex flex-col gap-1.5">
              <label className="text-[9px] text-text-muted uppercase tracking-wider font-mono">Agreement Type</label>
              <select
                value={contractMode}
                onChange={(e) => {
                  const mode = e.target.value;
                  setContractMode(mode);
                  setFormData(prev => ({
                    ...prev,
                    buyer: mode === 'Buy' ? startup?._id : partner?._id || partner,
                    seller: mode === 'Buy' ? partner?._id || partner : startup?._id
                  }));
                }}
                className="w-full bg-black/60 border border-white/10 focus:border-cyanGlow/40 rounded px-3 py-2 text-white outline-none font-mono"
              >
                <option value="Buy">Buy products from {partner.startupName || 'this company'}</option>
                <option value="Sell">Sell products to {partner.startupName || 'this company'}</option>
              </select>
            </div>
          )}

          {/* Commodity and Quantity details */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[9px] text-text-muted uppercase tracking-wider font-mono">Commodity Product</label>
              <select
                name="commodity"
                value={formData.commodity}
                onChange={handleChange}
                disabled={!!contract || !!counteringAgreement}
                className="w-full bg-black/60 border border-white/10 focus:border-cyanGlow/40 rounded px-3 py-2 text-white outline-none font-mono disabled:opacity-60"
              >
                {VALID_COMMODITIES.map(item => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[9px] text-text-muted uppercase tracking-wider font-mono">Quantity per batch</label>
              <input
                type="number"
                name="quantity"
                required
                placeholder="e.g. 1000"
                value={formData.quantity}
                onChange={handleChange}
                className="w-full bg-black/60 border border-white/10 focus:border-cyanGlow/40 rounded px-3 py-2 text-white outline-none font-mono"
              />
            </div>
          </div>

          {/* Pricing Value */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[9px] text-text-muted uppercase tracking-wider font-mono">Value Offer amount</label>
              <input
                type="number"
                name="offerValue"
                required
                placeholder="e.g. 80000"
                value={formData.offerValue}
                onChange={handleChange}
                className="w-full bg-black/60 border border-white/10 focus:border-cyanGlow/40 rounded px-3 py-2 text-white outline-none font-mono"
              />
            </div>

            <div className="flex flex-col gap-1.5 justify-end">
              <div className="bg-cyanGlow/5 border border-cyanGlow/10 rounded px-3 py-1.5 text-center text-cyanGlow font-mono leading-relaxed flex flex-col gap-1">
                <div>Implied Unit Price: {formatCurrency(getImpliedUnitPrice())} / unit</div>
                <div className="text-[9px] text-white">
                  Total Contract Value: {formatCurrency(Number(formData.offerValue || 0) * Number(formData.duration || 1))}
                </div>
              </div>
            </div>
          </div>

          {/* Schedule Configuration */}
          <div className="grid grid-cols-3 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[9px] text-text-muted uppercase tracking-wider font-mono">Delivery Interval</label>
              <select
                name="intervalType"
                value={formData.intervalType}
                onChange={handleChange}
                className="w-full bg-black/60 border border-white/10 focus:border-cyanGlow/40 rounded px-3 py-2 text-white outline-none font-mono"
              >
                <option value="Daily">Daily</option>
                <option value="Weekly">Weekly</option>
                <option value="Hours">Hours</option>
                <option value="Minutes">Minutes</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[9px] text-text-muted uppercase tracking-wider font-mono">
                Frequency (Every X {
                  formData.intervalType === 'Weekly' ? 'Weeks' :
                  formData.intervalType === 'Hours' ? 'Hours' :
                  formData.intervalType === 'Minutes' ? 'Minutes' : 'Days'
                })
              </label>
              <input
                type="number"
                name="intervalValue"
                min="1"
                required
                value={formData.intervalValue}
                onChange={handleChange}
                className="w-full bg-black/60 border border-white/10 focus:border-cyanGlow/40 rounded px-3 py-2 text-white outline-none font-mono"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[9px] text-text-muted uppercase tracking-wider font-mono">Total Deliveries</label>
              <input
                type="number"
                name="duration"
                min="1"
                required
                value={formData.duration}
                onChange={handleChange}
                className="w-full bg-black/60 border border-white/10 focus:border-cyanGlow/40 rounded px-3 py-2 text-white outline-none font-mono"
              />
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[9px] text-text-muted uppercase tracking-wider font-mono">Start Date</label>
              <input
                type="date"
                name="startDate"
                required
                value={formData.startDate}
                onChange={handleChange}
                className="w-full bg-black/60 border border-white/10 focus:border-cyanGlow/40 rounded px-3 py-2 text-white outline-none font-mono"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[9px] text-text-muted uppercase tracking-wider font-mono">End Date</label>
              <input
                type="date"
                name="endDate"
                readOnly
                value={formData.endDate}
                className="w-full bg-black/40 border border-white/5 rounded px-3 py-2 text-text-muted outline-none font-mono cursor-not-allowed"
              />
            </div>
          </div>

          {/* Penalties & Compensation terms */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[9px] text-text-muted uppercase tracking-wider font-mono">Late Delivery Penalty</label>
            <input
              type="number"
              name="lateDeliveryPenalty"
              placeholder="e.g. 5000"
              value={formData.lateDeliveryPenalty}
              onChange={handleChange}
              className="w-full bg-black/60 border border-white/10 focus:border-cyanGlow/40 rounded px-3 py-2 text-white outline-none font-mono"
            />
          </div>

          {/* Special notes */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[9px] text-text-muted uppercase tracking-wider font-mono">Special procurement notes</label>
            <textarea
              name="specialNotes"
              rows="3"
              placeholder="Provide context, shipping schedules, quality parameters..."
              value={formData.specialNotes}
              onChange={handleChange}
              className="w-full bg-black/60 border border-white/10 focus:border-cyanGlow/40 rounded px-3 py-2 text-white outline-none font-sans leading-relaxed resize-none"
            />
          </div>

          {/* Action triggers */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/5 shrink-0 mt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-white/10 hover:border-red-500/30 rounded text-[10px] font-display uppercase tracking-wider text-text-secondary hover:text-red-400 transition-colors cursor-pointer bg-white/2"
            >
              Cancel Draft
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-cyanGlow/20 hover:bg-cyanGlow/35 border border-cyanGlow/30 hover:border-cyanGlow rounded text-[10px] font-display uppercase tracking-widest text-cyanGlow hover:text-white transition-all cursor-pointer disabled:opacity-40"
            >
              {loading ? (
                <span>
                  <i className="fa-solid fa-spinner animate-spin mr-1.5"></i>
                  Submitting Proposal...
                </span>
              ) : counteringAgreement ? (
                'Submit Counter Proposal'
              ) : (
                'Propose Supply Agreement'
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
