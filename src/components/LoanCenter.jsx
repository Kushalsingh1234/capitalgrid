import React, { useState, useEffect } from 'react';
import { 
  getLoanEligibility, 
  getActiveLoans, 
  getLoanHistory, 
  applyForLoan, 
  repayLoan 
} from '../services/loanService';
import { getWorldClock } from '../services/worldClockService';

const CURRENCY_SYMBOLS = {
  'India': '₹',
  'United States': '$',
  'United Kingdom': '£',
  'Germany': '€',
  'Japan': '¥',
  'Brazil': 'R$',
  'Australia': 'A$'
};

const INTEREST_RATES = {
  'AAA': 5,
  'AA': 6,
  'A': 7,
  'BBB': 8,
  'BB': 10,
  'B': 12,
  'CCC': 15,
  'CC': 18,
  'C': 20,
  'D': 0
};

const RATING_COLORS = {
  'AAA': 'text-greenGlow border-green-500/35 bg-green-500/10 shadow-[0_0_8px_rgba(34,197,94,0.2)]',
  'AA': 'text-green-400 border-green-500/25 bg-green-500/5',
  'A': 'text-emerald-400 border-emerald-500/25 bg-emerald-500/5',
  'BBB': 'text-cyanGlow border-cyanGlow/25 bg-cyanGlow/5 shadow-[0_0_8px_rgba(6,182,212,0.15)]',
  'BB': 'text-blue-400 border-blue-500/25 bg-blue-500/5',
  'B': 'text-sky-400 border-sky-500/25 bg-sky-500/5',
  'CCC': 'text-amber-400 border-amber-500/25 bg-amber-500/5',
  'CC': 'text-orange-400 border-orange-500/25 bg-orange-500/5',
  'C': 'text-red-400 border-red-500/25 bg-red-500/5',
  'D': 'text-red-500 border-red-600/35 bg-red-600/10 animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.25)]'
};

export default function LoanCenter({ startup, token, onBalanceChange }) {
  const [eligibilityData, setEligibilityData] = useState(null);
  const [activeLoans, setActiveLoans] = useState([]);
  const [historyLoans, setHistoryLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [nextEmiDateStr, setNextEmiDateStr] = useState('01 of Next Month');

  // Application form states
  const [showApplyForm, setShowApplyForm] = useState(false);
  const [loanProduct, setLoanProduct] = useState('Working Capital Loan');
  const [amount, setAmount] = useState('');
  const [duration, setDuration] = useState('6');
  const [purpose, setPurpose] = useState('Working Capital');

  // Repayment modal/form state
  const [selectedRepayLoan, setSelectedRepayLoan] = useState(null);
  const [repayAmount, setRepayAmount] = useState('');
  const [repayType, setRepayType] = useState('full'); // 'full' or 'partial'

  const country = startup?.country || 'United States';

  const formatCurrency = (val) => {
    const symbol = CURRENCY_SYMBOLS[country] || '$';
    return `${symbol}${Math.round(val || 0).toLocaleString()}`;
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [eligRes, activeRes, historyRes, clockRes] = await Promise.all([
        getLoanEligibility(token),
        getActiveLoans(token),
        getLoanHistory(token),
        getWorldClock()
      ]);

      if (eligRes.success) setEligibilityData(eligRes);
      if (activeRes.success) setActiveLoans(activeRes.loans || []);
      if (historyRes.success) setHistoryLoans(historyRes.loans || []);
      
      if (clockRes.success && clockRes.data) {
        const clock = clockRes.data;
        let nextMonth = clock.month + 1;
        let nextYear = clock.year;
        if (nextMonth > 12) {
          nextMonth = 1;
          nextYear += 1;
        }
        const monthNames = [
          'January', 'February', 'March', 'April', 'May', 'June',
          'July', 'August', 'September', 'October', 'November', 'December'
        ];
        setNextEmiDateStr(`01 ${monthNames[nextMonth - 1]} ${nextYear}`);
      }
    } catch (err) {
      setErrorMessage(err.message || 'Failed to sync banking records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [token]);

  const handleApply = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    setSubmitting(true);

    try {
      const res = await applyForLoan({
        loanType: loanProduct,
        amount: Number(amount),
        duration: Number(duration),
        purpose
      }, token);

      if (res.success) {
        setSuccessMessage(res.message || 'Loan approved successfully.');
        setAmount('');
        setShowApplyForm(false);
        if (onBalanceChange) onBalanceChange(); // Notify parent window of balance adjustment
        await loadData();
      }
    } catch (err) {
      setErrorMessage(err.message || 'Application rejected.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRepay = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    setSubmitting(true);

    try {
      const amtToPay = repayType === 'full' 
        ? selectedRepayLoan.outstandingBalance 
        : Number(repayAmount);

      const res = await repayLoan(selectedRepayLoan._id, amtToPay, token);
      if (res.success) {
        setSuccessMessage(res.message || 'Repayment completed successfully.');
        setSelectedRepayLoan(null);
        setRepayAmount('');
        if (onBalanceChange) onBalanceChange();
        await loadData();
      }
    } catch (err) {
      setErrorMessage(err.message || 'Repayment failed.');
    } finally {
      setSubmitting(false);
    }
  };

  // Preview calculations
  const creditRating = eligibilityData?.creditRating || 'BBB';
  const interestRate = INTEREST_RATES[creditRating] || 8;
  const previewInterest = Number(amount || 0) * (interestRate / 100) * (Number(duration) / 12);
  const previewTotalRepayment = Number(amount || 0) + previewInterest;
  const previewEmi = duration > 0 ? Math.round(previewTotalRepayment / Number(duration)) : 0;
  const totalEmiSum = activeLoans.reduce((sum, l) => sum + (l.monthlyEmi || 0), 0);
  const totalDebtSum = activeLoans.reduce((sum, l) => sum + (l.outstandingBalance || 0), 0);

  return (
    <div className="flex flex-col gap-4 font-mono text-xs text-text-secondary select-none">
      
      {/* Toast Alerts */}
      {errorMessage && (
        <div className="p-3 bg-red-500/10 border border-red-500/35 text-red-400 rounded-lg flex items-center gap-2.5 shadow-[0_0_8px_rgba(239,68,68,0.15)] animate-pulse">
          <i className="fa-solid fa-triangle-exclamation"></i>
          <span>{errorMessage}</span>
          <button onClick={() => setErrorMessage('')} className="ml-auto text-red-400 hover:text-white"><i className="fa-solid fa-xmark"></i></button>
        </div>
      )}

      {successMessage && (
        <div className="p-3 bg-green-500/10 border border-greenGlow/35 text-greenGlow rounded-lg flex items-center gap-2.5 shadow-[0_0_8px_rgba(34,197,94,0.15)]">
          <i className="fa-solid fa-circle-check"></i>
          <span>{successMessage}</span>
          <button onClick={() => setSuccessMessage('')} className="ml-auto text-greenGlow hover:text-white"><i className="fa-solid fa-xmark"></i></button>
        </div>
      )}

      {/* Credit HUD Header */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-3.5 bg-black/30 border border-white/5 rounded-lg flex flex-col justify-between items-start gap-1">
          <span className="text-[8.5px] text-text-muted uppercase tracking-wider">Credit Rating</span>
          <span className={`px-3 py-0.5 mt-1 border text-sm font-bold font-display tracking-widest rounded-md uppercase ${RATING_COLORS[creditRating]}`}>
            {creditRating}
          </span>
        </div>
        <div className="p-3.5 bg-black/30 border border-white/5 rounded-lg flex flex-col justify-between items-start gap-1">
          <span className="text-[8.5px] text-text-muted uppercase tracking-wider">Available Credit Limit</span>
          <span className="font-extrabold text-cyanGlow text-sm mt-1">
            {formatCurrency(eligibilityData?.eligibility || 0)}
          </span>
        </div>
        <div className="p-3.5 bg-black/30 border border-white/5 rounded-lg flex flex-col justify-between items-start gap-1">
          <span className="text-[8.5px] text-text-muted uppercase tracking-wider">Total Outstanding Debt</span>
          <span className="font-extrabold text-white text-sm mt-1">
            {formatCurrency(totalDebtSum)}
          </span>
        </div>
        <div className="p-3.5 bg-black/30 border border-white/5 rounded-lg flex flex-col justify-between items-start gap-1">
          <span className="text-[8.5px] text-text-muted uppercase tracking-wider">Total Monthly EMIs</span>
          <span className="font-extrabold text-amber-400 text-sm mt-1">
            {formatCurrency(totalEmiSum)}
          </span>
        </div>
      </div>

      {/* Action Buttons & Next Payment Window */}
      <div className="flex flex-col md:flex-row items-center gap-3 bg-white/2 border border-white/5 p-3 rounded-lg">
        <div className="flex items-center gap-2">
          <i className="fa-solid fa-calendar-days text-amber-400 text-xs"></i>
          <span className="text-[10px] text-text-secondary uppercase">
            Next Monthly EMI Cycle: <strong className="text-white">{nextEmiDateStr}</strong>
          </span>
        </div>
        <div className="flex gap-2 w-full md:w-auto md:ml-auto">
          <button
            onClick={() => setShowApplyForm(!showApplyForm)}
            className="flex-1 md:flex-none px-4 py-2 border border-cyanGlow/35 hover:border-cyanGlow text-cyanGlow bg-cyanGlow/5 rounded hover:bg-cyanGlow/10 transition-colors uppercase font-display text-[9.5px] font-bold tracking-widest cursor-pointer"
          >
            {showApplyForm ? 'Close Application Form' : 'Apply For Loan'}
          </button>
        </div>
      </div>

      {/* Application Form */}
      {showApplyForm && (
        <form onSubmit={handleApply} className="p-4 bg-black/45 border border-cyanGlow/25 rounded-lg flex flex-col gap-4">
          <div className="flex items-center gap-2 border-b border-white/5 pb-2 text-cyanGlow">
            <i className="fa-solid fa-file-signature text-xs"></i>
            <span className="font-display font-extrabold uppercase tracking-widest text-[9.5px]">Loan Application portal</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Loan Product */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[9px] text-text-muted uppercase tracking-wider">Loan Product</label>
              <select
                value={loanProduct}
                onChange={(e) => setLoanProduct(e.target.value)}
                className="bg-black/60 border border-white/10 hover:border-cyanGlow/40 rounded p-2 text-white outline-none cursor-pointer focus:border-cyanGlow transition-colors"
              >
                <option value="Working Capital Loan">Working Capital Loan</option>
                <option value="Expansion Loan">Expansion Loan</option>
                <option value="Emergency Loan">Emergency Loan</option>
                <option disabled value="Equipment Loan">Equipment Loan (Future)</option>
                <option disabled value="Research Loan">Research Loan (Future)</option>
                <option disabled value="Government Subsidized Loan">Subsidized Loan (Future)</option>
              </select>
            </div>

            {/* Loan Amount */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[9px] text-text-muted uppercase tracking-wider">Loan Amount ({CURRENCY_SYMBOLS[country]})</label>
              <input
                type="number"
                min="1"
                placeholder="e.g. 50000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                className="bg-black/60 border border-white/10 hover:border-cyanGlow/40 rounded p-2 text-white outline-none focus:border-cyanGlow transition-colors font-mono"
              />
            </div>

            {/* Duration */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[9px] text-text-muted uppercase tracking-wider">Repayment Duration</label>
              <select
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="bg-black/60 border border-white/10 hover:border-cyanGlow/40 rounded p-2 text-white outline-none cursor-pointer focus:border-cyanGlow transition-colors"
              >
                <option value="3">3 Game Months</option>
                <option value="6">6 Game Months</option>
                <option value="12">12 Game Months</option>
                <option value="24">24 Game Months</option>
              </select>
            </div>

            {/* Purpose */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[9px] text-text-muted uppercase tracking-wider">Purpose of Funds</label>
              <select
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                className="bg-black/60 border border-white/10 hover:border-cyanGlow/40 rounded p-2 text-white outline-none cursor-pointer focus:border-cyanGlow transition-colors"
              >
                <option value="Working Capital">Working Capital Support</option>
                <option value="Expansion">Business Expansion</option>
                <option value="Inventory">Inventory Purchase</option>
                <option value="Research">Research & Development</option>
                <option value="Other">Other corporate usage</option>
              </select>
            </div>

          </div>

          {/* dynamic calculations panel */}
          {Number(amount || 0) > 0 && (
            <div className="bg-cyanGlow/5 border border-cyanGlow/20 rounded p-3 grid grid-cols-2 md:grid-cols-4 gap-3 text-[10px]">
              <div>
                <span className="text-[8px] text-text-muted uppercase block">Interest Rate</span>
                <span className="text-white font-bold">{interestRate}% Annual</span>
              </div>
              <div>
                <span className="text-[8px] text-text-muted uppercase block">Monthly EMI</span>
                <span className="text-cyanGlow font-bold">{formatCurrency(previewEmi)}</span>
              </div>
              <div>
                <span className="text-[8px] text-text-muted uppercase block">Total Repayment</span>
                <span className="text-white font-bold">{formatCurrency(previewTotalRepayment)}</span>
              </div>
              <div>
                <span className="text-[8px] text-text-muted uppercase block">Approval Status</span>
                {Number(amount) <= (eligibilityData?.eligibility || 0) ? (
                  <span className="text-greenGlow font-bold uppercase tracking-wider">Approved (Eligible)</span>
                ) : (
                  <span className="text-red-400 font-bold uppercase tracking-wider">Exceeds Credit capacity</span>
                )}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2.5">
            <button
              type="button"
              onClick={() => setShowApplyForm(false)}
              className="px-3 py-1.5 rounded border border-white/10 hover:bg-white/5 text-white font-display text-[9px] uppercase font-bold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || Number(amount || 0) <= 0 || Number(amount) > (eligibilityData?.eligibility || 0)}
              className="px-4 py-1.5 bg-cyanGlow/20 border border-cyanGlow/35 hover:bg-cyanGlow/30 disabled:opacity-40 disabled:cursor-not-allowed text-cyanGlow rounded font-display text-[9px] uppercase font-bold cursor-pointer"
            >
              {submitting ? 'Processing Application...' : 'Confirm Loan Payout'}
            </button>
          </div>
        </form>
      )}

      {/* Repay Modal Overlay */}
      {selectedRepayLoan && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <form onSubmit={handleRepay} className="w-full max-w-sm p-5 bg-black/90 border border-cyanGlow/25 rounded-lg flex flex-col gap-4 shadow-[0_0_20px_rgba(0,0,0,0.8)] font-mono">
            <div className="flex items-center justify-between border-b border-white/5 pb-2 text-cyanGlow">
              <span className="font-display font-extrabold uppercase tracking-widest text-[9.5px]">Loan Repayment Console</span>
              <button type="button" onClick={() => setSelectedRepayLoan(null)} className="text-text-secondary hover:text-white"><i className="fa-solid fa-xmark text-xs"></i></button>
            </div>

            <p className="text-[10px] text-text-muted leading-relaxed">
              Verify terms for <strong className="text-white">{selectedRepayLoan.loanType}</strong> outstanding debt repayment.
            </p>

            <div className="bg-white/2 border border-white/5 rounded p-2.5 flex flex-col gap-1.5 text-[10px]">
              <div className="flex justify-between">
                <span className="text-text-muted">Remaining Balance:</span>
                <span className="text-white font-bold">{formatCurrency(selectedRepayLoan.outstandingBalance)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Monthly EMI:</span>
                <span className="text-cyanGlow font-bold">{formatCurrency(selectedRepayLoan.monthlyEmi)}</span>
              </div>
            </div>

            {/* Repayment Option */}
            <div className="flex flex-col gap-2">
              <label className="text-[9px] text-text-muted uppercase tracking-wider">Repayment Method</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="repayType"
                    checked={repayType === 'full'}
                    onChange={() => setRepayType('full')}
                  />
                  <span>Full Payoff ({formatCurrency(selectedRepayLoan.outstandingBalance)})</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="repayType"
                    checked={repayType === 'partial'}
                    onChange={() => setRepayType('partial')}
                  />
                  <span>Partial Repay</span>
                </label>
              </div>
            </div>

            {repayType === 'partial' && (
              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] text-text-muted uppercase tracking-wider">Payment Amount ({CURRENCY_SYMBOLS[country]})</label>
                <input
                  type="number"
                  min="1"
                  max={selectedRepayLoan.outstandingBalance}
                  placeholder="Enter payout value"
                  value={repayAmount}
                  onChange={(e) => setRepayAmount(e.target.value)}
                  required
                  className="w-full bg-black/60 border border-white/10 hover:border-cyanGlow/40 rounded p-2 text-white outline-none focus:border-cyanGlow transition-colors font-mono"
                />
              </div>
            )}

            <div className="flex justify-end gap-2.5 mt-2 border-t border-white/5 pt-3">
              <button
                type="button"
                onClick={() => setSelectedRepayLoan(null)}
                className="px-3 py-1.5 rounded border border-white/10 hover:bg-white/5 text-white font-display text-[9px] uppercase font-bold cursor-pointer"
              >
                Close
              </button>
              <button
                type="submit"
                disabled={submitting || (repayType === 'partial' && (!repayAmount || Number(repayAmount) <= 0 || Number(repayAmount) > selectedRepayLoan.outstandingBalance))}
                className="px-4 py-1.5 bg-green-500/20 border border-green-500/40 hover:bg-green-500/30 text-greenGlow rounded font-display text-[9px] uppercase font-bold cursor-pointer"
              >
                {submitting ? 'Paying...' : 'Verify Payout'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Active Loans grid */}
      <div className="flex flex-col gap-3">
        <h4 className="font-display font-extrabold text-[10px] uppercase text-white pb-1.5 border-b border-white/5 tracking-widest flex items-center gap-1.5">
          <i className="fa-solid fa-list-check text-cyanGlow text-xs"></i>
          <span>Active Company Loans ({activeLoans.length})</span>
        </h4>

        {activeLoans.length === 0 ? (
          <div className="text-center py-10 bg-black/10 border border-white/5 rounded-lg text-text-muted italic text-[10.5px]">
            No outstanding loans or corporate debt found. Your company credit limit is clean.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {activeLoans.map(loan => {
              const paidAmount = loan.amount + (loan.amount * (loan.interestRate / 100) * (loan.duration / 12)) - loan.outstandingBalance;
              const totalAmount = loan.amount + (loan.amount * (loan.interestRate / 100) * (loan.duration / 12));
              const progressPct = Math.min(100, Math.round((paidAmount / totalAmount) * 100));

              return (
                <div key={loan._id} className="p-4 bg-white/2 border border-white/5 rounded-lg flex flex-col gap-3 hover:border-white/15 transition-all">
                  <div className="flex justify-between items-center border-b border-white/5 pb-2">
                    <div className="flex flex-col gap-0.5">
                      <span className="font-bold text-white text-xs">{loan.loanType}</span>
                      <span className="text-[8px] text-text-muted uppercase">Purpose: {loan.purpose}</span>
                    </div>
                    <span className={`px-2 py-0.2 rounded text-[7.5px] font-mono tracking-wider border uppercase ${
                      loan.status === 'Active' ? 'text-greenGlow border-green-500/25 bg-green-500/5' : 'text-red-500 border-red-500/25 bg-red-500/5'
                    }`}>
                      {loan.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-[10px] font-mono">
                    <div>
                      <span className="text-[8px] text-text-muted uppercase block">Principal Amount</span>
                      <span className="text-white font-bold">{formatCurrency(loan.amount)}</span>
                    </div>
                    <div>
                      <span className="text-[8px] text-text-muted uppercase block">Outstanding Debt</span>
                      <span className="text-cyanGlow font-bold">{formatCurrency(loan.outstandingBalance)}</span>
                    </div>
                    <div>
                      <span className="text-[8px] text-text-muted uppercase block">Interest rate</span>
                      <span className="text-white font-bold">{loan.interestRate}% APR</span>
                    </div>
                    <div>
                      <span className="text-[8px] text-text-muted uppercase block">Monthly EMI</span>
                      <span className="text-amber-400 font-bold">{formatCurrency(loan.monthlyEmi)}</span>
                    </div>
                  </div>

                  {/* progress bar */}
                  <div className="mt-1">
                    <div className="flex justify-between text-[8px] text-text-muted mb-1">
                      <span>REPAID PROGRESS</span>
                      <span>{progressPct}% ({formatCurrency(paidAmount)} paid)</span>
                    </div>
                    <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden border border-white/5">
                      <div className="bg-greenGlow h-full" style={{ width: `${progressPct}%` }} />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 mt-1 pt-2.5 border-t border-white/5">
                    <button
                      onClick={() => {
                        setSelectedRepayLoan(loan);
                        setRepayType('full');
                      }}
                      className="px-3 py-1 rounded bg-white/5 border border-white/10 hover:border-white/20 text-white text-[9.5px] uppercase font-bold cursor-pointer"
                    >
                      Quick Repay
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* History table */}
      <div className="flex flex-col gap-3 mt-2">
        <h4 className="font-display font-extrabold text-[10px] uppercase text-white pb-1.5 border-b border-white/5 tracking-widest flex items-center gap-1.5">
          <i className="fa-solid fa-history text-text-muted text-xs"></i>
          <span>Loan Settlement Audit Logs</span>
        </h4>

        {historyLoans.length === 0 ? (
          <div className="text-center py-6 bg-black/5 border border-white/5 rounded text-text-muted italic text-[10px]">
            No historical settled records found.
          </div>
        ) : (
          <div className="overflow-x-auto border border-white/5 rounded-lg bg-black/15">
            <table className="w-full border-collapse text-[10px] text-left font-mono">
              <thead>
                <tr className="border-b border-white/5 bg-white/2 text-text-muted uppercase tracking-wider text-[8.5px]">
                  <th className="p-2.5 pl-3">Loan Product</th>
                  <th className="p-2.5">Principal</th>
                  <th className="p-2.5">Duration</th>
                  <th className="p-2.5">Settled Status</th>
                  <th className="p-2.5 pr-3 text-right">Settled Date</th>
                </tr>
              </thead>
              <tbody>
                {historyLoans.map(loan => (
                  <tr key={loan._id} className="border-b border-white/5 hover:bg-white/2 transition-colors">
                    <td className="p-2.5 pl-3 font-bold text-white">{loan.loanType}</td>
                    <td className="p-2.5">{formatCurrency(loan.amount)}</td>
                    <td className="p-2.5">{loan.duration} mos</td>
                    <td className="p-2.5">
                      <span className={`px-2 py-0.2 rounded text-[7.5px] font-mono tracking-wider border uppercase ${
                        loan.status === 'Fully Repaid' ? 'text-greenGlow border-green-500/25 bg-green-500/5' : 'text-red-500 border-red-500/25 bg-red-500/5'
                      }`}>
                        {loan.status}
                      </span>
                    </td>
                    <td className="p-2.5 pr-3 text-right text-text-muted">
                      {new Date(loan.updatedAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
