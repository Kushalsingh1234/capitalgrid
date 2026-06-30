import React from 'react';

// Reusable standard Slide-in Drawer wrapper
export function DrawerWrapper({ isOpen, onClose, title, icon, children }) {
  if (!isOpen) return null;

  return (
    <div className="absolute top-0 right-0 h-full w-full sm:w-[440px] z-30 flex shadow-2xl animate-slide-in pointer-events-auto font-body select-none">
      {/* Slide-out Background Board Panel */}
      <div className="w-full h-full glass-card border-l border-white/5 p-6 flex flex-col justify-start overflow-y-auto bg-gradient-to-b from-glassBg to-black/95">
        
        {/* Drawer Header */}
        <div className="flex justify-between items-center mb-6 pb-3 border-b border-white/5 shrink-0">
          <div className="flex items-center gap-2 text-cyanGlow">
            {icon && <i className={`fa-solid ${icon} text-sm`}></i>}
            <span className="font-display font-extrabold text-xs uppercase tracking-widest">
              {title}
            </span>
          </div>
          <button 
            onClick={onClose}
            className="w-6 h-6 border border-white/5 hover:border-white/20 rounded flex items-center justify-center text-text-muted hover:text-white transition-colors cursor-pointer"
          >
            <i className="fa-solid fa-xmark text-xs"></i>
          </button>
        </div>

        {/* Drawer Content */}
        <div className="flex-1 min-h-0">
          {children}
        </div>
      </div>
    </div>
  );
}

// Reusable standard Section Header component
export function SectionHeader({ icon, title, subtitle, divider = true }) {
  return (
    <div className="mb-4 shrink-0">
      <div className="flex items-center gap-2 text-cyanGlow">
        {icon && <i className={`fa-solid ${icon} text-xs`}></i>}
        <span className="font-display font-extrabold text-[10px] uppercase tracking-widest text-cyanGlow">
          {title}
        </span>
      </div>
      {subtitle && (
        <span className="text-[9px] text-text-secondary font-mono block mt-0.5 uppercase tracking-wide">
          {subtitle}
        </span>
      )}
      {divider && <div className="border-b border-white/5 mt-2" />}
    </div>
  );
}

// Reusable grid statistics card
export function StatCard({ label, value, icon, color = 'text-white' }) {
  return (
    <div className="p-3 bg-white/2 border border-white/5 rounded-lg bg-gradient-to-b from-glassBg to-black/25 flex flex-col gap-1">
      <div className="flex justify-between items-center text-[9px] font-display uppercase tracking-widest text-text-muted">
        <span className="truncate mr-1">{label}</span>
        {icon && <i className={`fa-solid ${icon} text-[9px]`}></i>}
      </div>
      <span className={`block font-mono font-bold text-xs ${color} truncate mt-0.5`}>
        {value}
      </span>
    </div>
  );
}

// Reusable metadata value list card
export function InfoCard({ label, value, color = 'text-white' }) {
  return (
    <div className="p-2.5 bg-black/20 border border-white/5 rounded flex justify-between items-center text-xs font-mono">
      <span className="text-text-secondary">{label}</span>
      <span className={`font-bold ${color}`}>{value}</span>
    </div>
  );
}

// Reusable main content container card
export function SectionCard({ children, className = '' }) {
  return (
    <div className={`glass-card p-5 border border-white/5 rounded-lg bg-gradient-to-b from-glassBg to-black/30 ${className}`}>
      {children}
    </div>
  );
}

// Reusable vertical chronological timeline card node
export function TimelineCard({ title, description, date, icon, completed }) {
  return (
    <div className="relative pl-6">
      <div className={`absolute left-0 top-1 w-2.5 h-2.5 rounded-full border bg-black flex items-center justify-center text-[5px] ${
        completed ? 'border-cyanGlow text-cyanGlow' : 'border-white/10 text-text-muted'
      }`}>
        <span className={`w-1.5 h-1.5 rounded-full ${completed ? 'bg-cyanGlow animate-pulse' : 'bg-white/10'}`}></span>
      </div>
      <div className="flex justify-between items-start gap-4 font-mono">
        <div>
          <h4 className={`font-display font-bold text-[11px] uppercase tracking-wide leading-tight ${completed ? 'text-white' : 'text-text-muted'}`}>
            {title}
          </h4>
          <p className="text-[9px] text-text-secondary leading-relaxed mt-0.5">
            {description}
          </p>
        </div>
        <span className="text-[9px] text-text-muted whitespace-nowrap">
          {date}
        </span>
      </div>
    </div>
  );
}

// Reusable alerts system banner card (info, success, warning, error)
export function AlertCard({ type, icon, text }) {
  const styles = {
    error: 'bg-red-950/20 border-red-500/15 text-red-400',
    warning: 'bg-amber-950/20 border-amber-500/20 text-amber-400',
    info: 'bg-cyan-950/15 border-cyanGlow/15 text-cyanGlow',
    success: 'bg-green-950/20 border-greenGlow/10 text-greenGlow'
  };

  const defaultIcons = {
    error: 'fa-circle-xmark',
    warning: 'fa-triangle-exclamation',
    info: 'fa-circle-info',
    success: 'fa-circle-check'
  };

  return (
    <div className={`p-3.5 border rounded-lg flex items-start gap-3 text-xs font-mono ${styles[type] || styles.info}`}>
      <i className={`fa-solid ${icon || defaultIcons[type]} shrink-0 mt-0.5`}></i>
      <span className="leading-normal">{text}</span>
    </div>
  );
}

// Reusable Locked future content details card
export function FutureFeatureCard({ title, description, icon, className = '' }) {
  return (
    <div className={`p-3 bg-white/2 border border-white/5 rounded text-left flex flex-col gap-1 relative group cursor-not-allowed opacity-50 ${className}`}>
      <span className="font-display font-bold text-xs text-white uppercase tracking-wider">
        {icon && <i className={`fa-solid ${icon} mr-1.5`}></i>}
        {title}
      </span>
      <span className="text-[9px] text-text-secondary font-mono leading-tight">{description}</span>
      <span className="absolute inset-0 flex items-center justify-center bg-black/95 opacity-0 group-hover:opacity-100 transition-opacity rounded">
        <span className="text-[8px] font-mono text-cyanGlow uppercase tracking-widest font-sans">
          Future Update
        </span>
      </span>
    </div>
  );
}

// Reusable standard empty state card fallback
export function PlaceholderCard({ title, description, icon }) {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 bg-black/20 border border-white/5 border-dashed rounded-lg gap-3">
      <div className="w-10 h-10 rounded-full border border-cyanGlow/25 bg-cyanGlow/5 flex items-center justify-center text-cyanGlow text-sm">
        <i className={`fa-solid ${icon}`}></i>
      </div>
      <div>
        <h4 className="font-display font-bold text-xs uppercase tracking-widest text-white">{title}</h4>
        <p className="text-[10px] text-text-muted mt-1.5 max-w-[220px] leading-relaxed font-mono">
          {description}
        </p>
      </div>
    </div>
  );
}

// Reusable loaders / skeletons widgets
export function LoadingCard({ lines = 3 }) {
  return (
    <div className="p-4 border border-white/5 rounded-lg bg-black/20 flex flex-col gap-3 animate-pulse">
      <div className="h-2.5 bg-white/10 rounded w-1/3"></div>
      <div className="flex flex-col gap-2">
        {Array.from({ length: lines }).map((_, i) => (
          <div key={i} className="h-2 bg-white/5 rounded w-full"></div>
        ))}
      </div>
    </div>
  );
}
