import React, { useState } from 'react';
import BuildingRenderer from './BuildingRenderer';

export default function WorldMap({ businessType, industry }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPlot, setSelectedPlot] = useState(null);
  const [hoveredPlot, setHoveredPlot] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  // Check if manufacturing sector to enable smoke particles
  const isManufacturing = (industry || '').toLowerCase().includes('manuf') || 
                          ['garment factory', 'food processing factory', 'construction factory', 'automobile manufacturing', 'electronics manufacturing'].includes((businessType || '').toLowerCase());

  // Isometric diamond polygons mapping to the divided squares on empty_campus_grid.png
  const expansionPlots = [
    { id: 1, label: 'Plot Alpha (South-West)', points: "340,300 420,340 340,380 260,340" },
    { id: 2, label: 'Plot Beta (North-East)', points: "660,180 740,220 660,260 580,220" },
    { id: 3, label: 'Plot Gamma (South-East)', points: "580,300 660,340 580,380 500,340" },
    { id: 4, label: 'Plot Delta (North-West)', points: "420,180 500,220 420,260 340,220" },
    { id: 5, label: 'Plot Epsilon (West)', points: "260,240 340,280 260,320 180,280" },
    { id: 6, label: 'Plot Zeta (East)', points: "740,240 820,280 740,320 660,280" },
  ];

  const triggerToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  return (
    <div className="relative w-full h-full bg-[#0d131f] flex items-center justify-center overflow-hidden">
      {/* Background Subtle Grid Texture */}
      <div className="absolute inset-0 opacity-10 pointer-events-none" style={{
        backgroundImage: 'radial-gradient(rgba(0, 102, 255, 0.15) 1.5px, transparent 1.5px)',
        backgroundSize: '30px 30px'
      }}></div>

      {/* Main Isometric Campus Viewport Container (Stretches to 100% full screen) */}
      <div className="absolute inset-0 w-full h-full overflow-hidden">
        
        {/* Photo-Realistic 3D Isometric Empty Landscape Background (Stretched to fill full viewport) */}
        <img 
          src="/assets/empty_campus_grid.png" 
          alt="Corporate Strategy Campus" 
          className="absolute inset-0 w-full h-full object-fill select-none pointer-events-none" 
        />

        {/* Interactive SVG Overlay Layer (Aligned exactly with stretched background) */}
        <svg 
          viewBox="0 0 1000 600" 
          className="absolute inset-0 w-full h-full select-none z-15"
          preserveAspectRatio="none"
        >
          {/* Ambient Chimney Smoke Particles */}
          {isManufacturing && (
            <g className="smoke-particles" transform="translate(500, 200)">
              <circle cx="0" cy="0" r="4.5" fill="#94A3B8" opacity="0.6" className="smoke-p1" />
              <circle cx="8" cy="-12" r="6" fill="#CBD5E1" opacity="0.4" className="smoke-p2" />
            </g>
          )}

          {/* Divided Empty plots (Isometric diamonds matching the background grass squares) */}
          {expansionPlots.map((plot) => (
            <polygon 
              key={plot.id}
              points={plot.points}
              fill="rgba(0, 102, 255, 0.02)" 
              stroke="rgba(0, 102, 255, 0.35)" 
              strokeWidth="2" 
              className="cursor-pointer pointer-events-auto transition-all duration-300 hover:fill-cyanGlow/10 hover:stroke-cyanGlow/80"
              onMouseEnter={() => setHoveredPlot(plot.id)}
              onMouseLeave={() => setHoveredPlot(null)}
              onClick={() => setSelectedPlot(plot)}
            />
          ))}

          {/* Central Active Plot highlighting zone (Plot 1: center) */}
          <polygon 
            points="500,240 580,280 500,320 420,280"
            fill="rgba(0, 102, 255, 0.05)" 
            stroke="var(--color-primary)" 
            strokeWidth="3" 
            className="cursor-pointer pointer-events-auto transition-all duration-300 hover:fill-cyanGlow/15 hover:stroke-cyanGlow/90"
            onClick={() => setIsModalOpen(true)}
          />

          {/* Dynamic player building rendered inside foreignObject scaled along with SVG */}
          <foreignObject 
            x="425" 
            y="145" 
            width="150" 
            height="140" 
            className="pointer-events-none z-20"
          >
            <BuildingRenderer 
              businessType={businessType} 
              className="w-full h-full filter drop-shadow-[0_16px_28px_rgba(0,0,0,0.7)]" 
            />
          </foreignObject>
        </svg>

        {/* Ambient Floating Weather Clouds Layer */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-25">
          <svg viewBox="0 0 1000 600" className="w-full h-full opacity-35" preserveAspectRatio="none">
            <g fill="rgba(255, 255, 255, 0.15)">
              <path d="M 50,50 Q 80,30 110,40 Q 130,40 Q 140,60 Q 110,80 50,50 Z" className="cloud-item-1" />
              <path d="M 700,80 Q 730,50 760,70 Q 790,70 Q 800,90 Q 770,110 700,80 Z" className="cloud-item-2" />
            </g>
          </svg>
        </div>

        {/* Visual overlay alerts for plot selection */}
        {hoveredPlot && !selectedPlot && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 glass-card border border-white/10 rounded-full text-[10px] uppercase font-display tracking-widest text-cyanGlow shadow-lg z-30 pointer-events-none transition-all duration-300">
            <i className="fa-solid fa-map-pin text-cyanGlow animate-bounce mr-1.5"></i> Click to Establish Division at {expansionPlots.find(p => p.id === hoveredPlot)?.label}
          </div>
        )}

        {/* Active Toast Alerts */}
        {toastMessage && (
          <div className="absolute top-6 left-1/2 -translate-x-1/2 px-4 py-2 bg-green-950/90 border border-green-500/40 rounded text-green-400 font-display text-[10px] uppercase tracking-widest shadow-lg z-55 animate-fade-in flex items-center gap-2">
            <i className="fa-solid fa-circle-check text-greenGlow"></i> {toastMessage}
          </div>
        )}

        {/* Modal alert on building interaction */}
        {isModalOpen && (
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-40 p-4">
            <div className="glass-card max-w-sm w-full p-6 border border-cyanGlow/25 text-center relative animate-fade-in shadow-cyanHeavy">
              {/* Scanner line animation inside popup */}
              <div className="hud-scanner-line absolute top-0 left-0 w-full h-[1px] bg-cyanGlow/30 pointer-events-none"></div>

              <div className="w-12 h-12 bg-cyanGlow/10 border border-cyanGlow/30 text-cyanGlow rounded-full flex items-center justify-center mx-auto mb-4 text-lg">
                <i className="fa-solid fa-building-circle-check"></i>
              </div>
              
              <h4 className="font-display font-black text-sm uppercase tracking-widest text-white mb-2">
                Facility Node Active
              </h4>
              
              <p className="text-xs text-text-secondary mb-5 leading-relaxed">
                Building management, blueprint upgrades, and production layout details will be available in the next phase.
              </p>
              
              <button 
                onClick={() => setIsModalOpen(false)}
                className="w-full py-2 bg-cyanGlow hover:bg-blue-600 text-white font-display text-xs uppercase tracking-widest rounded transition-all"
              >
                Acknowledge node
              </button>
            </div>
          </div>
        )}

        {/* Modal for setting up a new company branch in the empty plots */}
        {selectedPlot && (
          <div className="absolute inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-40 p-4">
            <div className="glass-card max-w-md w-full p-6 border border-cyanGlow/20 relative animate-fade-in shadow-cyanHeavy">
              <div className="hud-scanner-line absolute top-0 left-0 w-full h-[1px] bg-cyanGlow/30 pointer-events-none"></div>
              
              <div className="flex justify-between items-center mb-4 pb-2 border-b border-white/5">
                <h4 className="font-display font-black text-xs uppercase tracking-widest text-white flex items-center gap-2">
                  <i className="fa-solid fa-map-location-dot text-cyanGlow"></i>
                  Establish Division: {selectedPlot.label}
                </h4>
                <button 
                  onClick={() => setSelectedPlot(null)}
                  className="text-text-muted hover:text-white transition-colors"
                >
                  <i className="fa-solid fa-xmark text-sm"></i>
                </button>
              </div>

              <p className="text-xs text-text-secondary mb-4 leading-relaxed">
                Configure a new startup node to expand your corporate footprint. Select from available industry sectors:
              </p>

              <div className="grid grid-cols-3 gap-3 mb-6">
                {[
                  { name: 'Agriculture', icon: 'fa-wheat-awn', desc: 'Farming, Dairy, Forestry' },
                  { name: 'Manufacturing', icon: 'fa-gears', desc: 'Factories, Production mills' },
                  { name: 'Retail / Services', icon: 'fa-shop', desc: 'Showrooms, Cafes, Outlets' },
                ].map((sec) => (
                  <button 
                    key={sec.name}
                    onClick={() => {
                      setSelectedPlot(null);
                      triggerToast(`${sec.name} coordinates reserved for Phase B deployment.`);
                    }}
                    className="p-3 bg-black/40 border border-white/5 hover:border-cyanGlow/40 hover:bg-cyanGlow/5 rounded text-center transition-all group flex flex-col items-center justify-between"
                  >
                    <i className={`fa-solid ${sec.icon} text-base text-text-secondary group-hover:text-cyanGlow mb-2`}></i>
                    <span className="text-[9px] font-display font-bold uppercase tracking-wider text-white block">{sec.name}</span>
                  </button>
                ))}
              </div>

              <div className="p-3 bg-cyanGlow/5 border border-cyanGlow/10 rounded mb-4 text-[10px] text-text-secondary leading-relaxed font-mono">
                <strong className="text-white">Note:</strong> Multiple branch coordination, land leasing, and production chains routing will become available in Phase B.
              </div>

              <button
                onClick={() => setSelectedPlot(null)}
                className="w-full py-2 border border-white/10 hover:border-white/20 text-white font-display text-xs uppercase tracking-widest rounded transition-all"
              >
                Close Blueprint Interface
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
