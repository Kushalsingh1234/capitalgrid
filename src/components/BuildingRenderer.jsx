import React from 'react';

export default function BuildingRenderer({ businessType, className = '', style = {} }) {
  // Select high-fidelity building image based on business type / industry sector
  const getBuildingAsset = () => {
    const type = (businessType || '').toLowerCase();
    
    // Agriculture & Primary sector
    if (['farming', 'dairy', 'poultry', 'forestry'].includes(type)) {
      return '/assets/farm_building.png';
    }
    // Commercial, Retail & Restaurants
    else if (['clothing retail', 'electronics retail', 'restaurant', 'car showroom'].includes(type)) {
      return '/assets/retail_building.png';
    }
    // Industrial & Manufacturing (Factories, Mining, Assembly)
    else {
      return '/assets/factory_building.png';
    }
  };

  return (
    <div 
      className={`relative w-full h-full flex items-center justify-center group/building-asset ${className}`}
      style={style}
    >
      {/* High-Fidelity 3D Isometric Building Model */}
      <img 
        src={getBuildingAsset()} 
        alt={businessType} 
        className="w-full h-full object-contain filter drop-shadow-[0_8px_16px_rgba(0,0,0,0.6)] group-hover/building-asset:scale-105 transition-transform duration-500 animate-pulse-subtle" 
      />
      
      {/* Dynamic Activity Indicator light */}
      <span className="absolute top-1/4 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-cyanGlow animate-ping opacity-60"></span>
      <span className="absolute top-1/4 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-cyanGlow opacity-80"></span>
    </div>
  );
}
