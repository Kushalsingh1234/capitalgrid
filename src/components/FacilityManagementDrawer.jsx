import React, { useState, useEffect } from 'react';
import { DrawerWrapper, SectionHeader, InfoCard, FutureFeatureCard, PlaceholderCard } from './SharedUI';
import ProductionCenter from './ProductionCenter';
import InventoryPanel from './InventoryPanel';
import { getProductsForBusiness, isRetailBusiness } from '../data/products';
import { PRODUCT_DEPENDENCIES } from '../data/dependencies';
import { formatDuration } from '../utils/timeFormatter';

const CURRENCY_SYMBOLS = {
  'India': '₹',
  'United States': '$',
  'United Kingdom': '£',
  'Germany': '€',
  'Japan': '¥',
  'Brazil': 'R$',
  'Australia': 'A$'
};

const BUSINESS_REQUIRED_ROLES = {
  'Farming': ['Farmer'],
  'Dairy': ['Farmer'],
  'Mining': ['Labourer'],
  'Garment Factory': ['Fashion Designer', 'Labourer'],
  'Food Processing Factory': ['Labourer'],
  'Construction Factory': ['Labourer'],
  'Automobile Manufacturing': ['Engineer', 'Labourer'],
  'Electronics Manufacturing': ['Engineer', 'Labourer']
};

export default function FacilityManagementDrawer({
  isOpen,
  onClose,
  building,
  startup,
  inventory = [],
  employees = [],
  token,
  onProductionComplete,
  producingState = {},
  onProducingStateChange,
  worldClockSnapshot,
  currentGameTime
}) {
  const [selectedProductId, setSelectedProductId] = useState(null);

  const products = startup ? getProductsForBusiness(startup.businessType) || [] : [];
  const isRetail = startup ? isRetailBusiness(startup.businessType) : false;

  // Initialize selected product for requirements checklist
  useEffect(() => {
    if (products.length > 0 && !selectedProductId) {
      setSelectedProductId(products[0].id);
    }
  }, [products, selectedProductId]);

  if (!isOpen || !startup || !building) return null;

  // Format currency based on country
  const formatCurrency = (amount) => {
    const symbol = CURRENCY_SYMBOLS[startup.country] || '$';
    return `${symbol}${amount?.toLocaleString()}`;
  };

  // Render company logo helper
  const renderLogo = (logoStr) => {
    if (!logoStr) {
      return (
        <div className="w-full h-full flex items-center justify-center text-cyanGlow/40">
          <i className="fa-solid fa-industry text-3xl"></i>
        </div>
      );
    }
    if (logoStr.trim().startsWith('<svg') || logoStr.trim().startsWith('<img')) {
      return <div className="w-full h-full flex items-center justify-center" dangerouslySetInnerHTML={{ __html: logoStr }} />;
    }
    return (
      <img
        src={logoStr}
        alt="Corporate Logo"
        className="w-full h-full object-contain rounded"
        onError={(e) => { e.target.onerror = null; e.target.src = '/assets/logo.svg'; }}
      />
    );
  };

  // Calculate active building status
  const getActiveStatusText = () => {
    const activeProduction = Object.values(producingState)[0];
    if (activeProduction) {
      return `Producing: ${activeProduction.name} (${formatDuration(activeProduction.remaining)})`;
    }
    
    // Check if staff are hired to run operations
    const requiredRoles = BUSINESS_REQUIRED_ROLES[startup.businessType] || [];
    const missingRoles = requiredRoles.filter(role => {
      const emp = employees.find(e => e.employeeType === role);
      return !emp || emp.quantity <= 0;
    });

    if (missingRoles.length > 0) {
      return 'Idle (Missing Staff)';
    }

    return 'Operational';
  };

  const statusText = getActiveStatusText();
  const isProducing = Object.keys(producingState).length > 0;
  const currentLevel = building.level || 1;

  // Calculate efficiency based on worker availability
  const requiredRoles = BUSINESS_REQUIRED_ROLES[startup.businessType] || [];
  const totalRequiredHired = requiredRoles.every(role => {
    const emp = employees.find(e => e.employeeType === role);
    return emp && emp.quantity > 0;
  });
  const productionEfficiency = totalRequiredHired ? '100%' : '0% (Staff Missing)';

  // Build resource requirements lists for checklist card
  const selectedProduct = products.find(p => p.id === selectedProductId);
  const dependencies = selectedProduct ? PRODUCT_DEPENDENCIES[selectedProductId] : null;

  return (
    <DrawerWrapper isOpen={isOpen} onClose={onClose} title="Facility Management" icon="fa-gears">
      {/* Operational Control Center Area */}
      <div className="flex flex-col gap-6">

          {/* 1. Building Header Info Card */}
          <div className="p-5 bg-white/2 border border-white/5 rounded-lg flex items-center gap-4 bg-gradient-to-b from-glassBg to-black/30">
            <div className="w-16 h-16 p-2 rounded-lg bg-black/40 border border-white/10 flex items-center justify-center">
              {renderLogo(startup.logo)}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-display font-extrabold text-base uppercase text-white truncate">
                {startup.startupName}
              </h3>
              <p className="text-[10px] text-cyanGlow font-mono mt-0.5 uppercase tracking-wider">
                {startup.businessType} &bull; Level {currentLevel}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <span className={`text-[9px] font-display uppercase tracking-widest px-2 py-0.5 border rounded flex items-center gap-1.5 ${
                  isProducing 
                    ? 'text-cyanGlow bg-cyan-950/20 border-cyanGlow/25' 
                    : statusText.includes('Missing Staff') 
                    ? 'text-amber-400 bg-amber-950/20 border-amber-500/20' 
                    : 'text-greenGlow bg-green-950/20 border-greenGlow/20'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    isProducing 
                      ? 'bg-cyanGlow animate-ping' 
                      : statusText.includes('Missing Staff') 
                      ? 'bg-amber-400' 
                      : 'bg-greenGlow animate-pulse'
                  }`}></span>
                  {statusText}
                </span>
              </div>
            </div>
          </div>

          {/* 2. Production Center relocation */}
          <div>
            <ProductionCenter
              businessType={startup.businessType}
              token={token}
              onProductionComplete={onProductionComplete}
              employees={employees}
              inventory={inventory}
              onProducingStateChange={onProducingStateChange}
              tasks={startup.tasks || []}
              serverTime={startup.serverTime}
              fetchedAt={startup.fetchedAt}
              startup={startup}
              worldClockSnapshot={worldClockSnapshot}
              currentGameTime={currentGameTime}
            />
          </div>

          {/* 3. Inventory Warehouse relocation */}
          <div>
            <InventoryPanel inventory={inventory} />
          </div>

          {/* 4. Resources Required Card (dynamic checklist based on selected product) */}
          {!isRetail && products.length > 0 && (
            <div className="glass-card p-5 border border-white/5 relative bg-gradient-to-b from-glassBg to-black/30">
              <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-cyanGlow/30 to-transparent"></div>
              
              <div className="flex items-center justify-between mb-4">
                <SectionHeader icon="fa-clipboard-list" title="Resources Required" divider={false} />
                {/* Product picker */}
                <select 
                  value={selectedProductId || ''} 
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="bg-black/60 text-white border border-white/10 rounded px-2.5 py-1 text-[10px] font-display tracking-wide uppercase focus:outline-none focus:border-cyanGlow/40"
                >
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              {selectedProduct && dependencies ? (
                <div className="space-y-3">
                  <div className="text-[10px] font-mono text-text-muted uppercase tracking-wider border-b border-white/5 pb-1">
                    Checking dependencies for {selectedProduct.name}:
                  </div>
                  <div className="space-y-2">
                    {/* Materials Checklist */}
                    {Object.entries(dependencies.materials || {}).map(([matId, qtyNeeded]) => {
                      const invItem = inventory.find(i => i.productId === matId);
                      const availableQty = invItem ? invItem.quantity : 0;
                      const hasEnough = availableQty >= qtyNeeded;
                      const matName = matId.charAt(0).toUpperCase() + matId.slice(1).replace('_', ' ');

                      return (
                        <div key={matId} className="flex justify-between items-center text-xs font-mono">
                          <span className="text-text-secondary flex items-center gap-2">
                            <i className={`fa-solid fa-cube text-[10px] ${hasEnough ? 'text-greenGlow' : 'text-red-400'}`}></i>
                            {matName} (Requires {qtyNeeded})
                          </span>
                          <span className={`font-bold ${hasEnough ? 'text-greenGlow' : 'text-red-400'}`}>
                            {hasEnough ? '✔ Available' : '❌ Missing'} ({availableQty}/{qtyNeeded})
                          </span>
                        </div>
                      );
                    })}

                    {/* Staff Roles Checklist */}
                    {Object.entries(dependencies.employees || {}).map(([role, qtyNeeded]) => {
                      const empItem = employees.find(e => e.employeeType === role);
                      const hiredQty = empItem ? empItem.quantity : 0;
                      const hasEnough = hiredQty >= qtyNeeded;

                      return (
                        <div key={role} className="flex justify-between items-center text-xs font-mono">
                          <span className="text-text-secondary flex items-center gap-2">
                            <i className={`fa-solid fa-user-gear text-[10px] ${hasEnough ? 'text-greenGlow' : 'text-red-400'}`}></i>
                            {role}s (Requires {qtyNeeded})
                          </span>
                          <span className={`font-bold ${hasEnough ? 'text-greenGlow' : 'text-red-400'}`}>
                            {hasEnough ? '✔ Hired' : '❌ Missing'} ({hiredQty}/{qtyNeeded})
                          </span>
                        </div>
                      );
                    })}

                    {/* If no materials and no staff required */}
                    {Object.keys(dependencies.materials || {}).length === 0 && Object.keys(dependencies.employees || {}).length === 0 && (
                      <div className="text-xs text-text-muted py-1 font-mono italic">
                        No resource requirements for this product.
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <PlaceholderCard 
                  title="Select Product" 
                  description="Select a product to view requirements." 
                  icon="fa-clipboard-list" 
                />
              )}
            </div>
          )}

          {/* 5. Facility Statistics Card */}
          <div className="glass-card p-5 border border-white/5 relative bg-gradient-to-b from-glassBg to-black/30">
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-cyanGlow/30 to-transparent"></div>
            
            <SectionHeader icon="fa-chart-simple" title="Facility Overview" />

            <div className="flex flex-col gap-2 font-mono text-xs">
              <InfoCard label="Facility Level" value={`Level ${currentLevel}`} />
              <InfoCard label="Production Efficiency" value={productionEfficiency} color={totalRequiredHired ? 'text-greenGlow' : 'text-amber-400'} />
              <InfoCard label="Storage Capacity" value="Coming Soon" color="text-text-muted italic" />
              <InfoCard label="Products Produced Today" value="Coming Soon" color="text-text-muted italic" />
              <InfoCard label="Current Queue" value={isProducing ? '1 / 1 batches' : 'Empty'} />
            </div>
          </div>

          {/* 6. Upgrade Area Card */}
          <div className="glass-card p-5 border border-white/5 relative bg-gradient-to-b from-glassBg to-black/30">
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-blue-500/30 to-transparent"></div>
            
            <SectionHeader icon="fa-circle-up" title="Upgrade Facility" />

            <div className="flex justify-between items-start mb-4">
              <div>
                <span className="text-[10px] uppercase font-display text-text-secondary tracking-wider block">Current Level</span>
                <span className="text-sm font-bold text-white uppercase font-display font-mono">Level {currentLevel}</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase font-display text-text-secondary tracking-wider block">Upgrade Cost</span>
                <span className="text-sm font-bold text-blue-400 uppercase font-display font-mono">{formatCurrency(25000)}</span>
              </div>
            </div>

            <div className="mb-4 p-3 bg-blue-950/20 border border-blue-500/10 rounded">
              <span className="text-[9px] font-display uppercase tracking-widest text-blue-400 block mb-1">Upgrade Benefits</span>
              <ul className="text-xs font-mono text-text-secondary space-y-1">
                <li>+10% Production Speed</li>
                <li>+100 Storage</li>
                <li>+2 Worker Capacity</li>
              </ul>
            </div>

            <FutureFeatureCard
              title="Upgrade Facility"
              description="Increase efficiency limits and speed metrics."
            />
          </div>

          {/* 7. Demolish Area Warning Card */}
          <div className="glass-card p-5 border border-red-500/15 relative bg-gradient-to-b from-red-950/5 to-black/30 mb-4">
            <SectionHeader icon="fa-triangle-exclamation" title="Demolish Facility Node" />

            <p className="text-[11px] text-text-secondary leading-relaxed mb-4">
              Decommissioning this node removes it from the world grid. You will receive a refund on materials and start assets.
            </p>

            <div className="flex justify-between items-center mb-4 text-xs font-mono">
              <span className="text-text-secondary">Expected Refund (50%)</span>
              <span className="text-red-400 font-bold">{formatCurrency(12500)}</span>
            </div>

            <FutureFeatureCard
              title="Demolish Facility"
              description="Remove node from grid and refund materials."
            />
          </div>

      </div>
    </DrawerWrapper>
  );
}
