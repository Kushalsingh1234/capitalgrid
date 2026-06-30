import React, { useState, useEffect, useRef, useCallback } from 'react';
import { getProductsForBusiness, isRetailBusiness } from '../data/products';
import * as productionService from '../services/productionService';
import { PRODUCT_DEPENDENCIES } from '../data/dependencies';

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

/**
 * ProductionCenter — renders the production panel for the player's business type.
 * Shows available products with quantity selectors, produce buttons, and countdown timers.
 * Retail businesses see a placeholder message instead.
 *
 * Props:
 *   businessType: string — the startup's businessType
 *   token: string — JWT auth token
 *   onProductionComplete: (inventory) => void — called when a batch finishes
 */
export default function ProductionCenter({ businessType, token, onProductionComplete, employees = [], inventory = [], onProducingStateChange }) {
  const [quantities, setQuantities] = useState({});
  const [producing, setProducing] = useState({}); // { productId: { remaining, total, qty, name } }
  
  useEffect(() => {
    if (onProducingStateChange) {
      onProducingStateChange(producing);
    }
  }, [producing, onProducingStateChange]);
  const timerRefs = useRef({});

  const products = getProductsForBusiness(businessType);
  const isRetail = isRetailBusiness(businessType);

  // Compute required employees missing count
  const requiredRoles = BUSINESS_REQUIRED_ROLES[businessType] || [];
  const missingRoles = requiredRoles.filter(role => {
    const emp = employees.find(e => e.employeeType === role);
    return !emp || emp.quantity <= 0;
  });
  const isBlocked = missingRoles.length > 0;

  // Initialize quantities to 1 for each product
  useEffect(() => {
    if (products) {
      const initial = {};
      products.forEach(p => { initial[p.id] = 1; });
      setQuantities(initial);
    }
  }, [businessType]);

  // Cleanup all timers on unmount
  useEffect(() => {
    return () => {
      Object.values(timerRefs.current).forEach(clearInterval);
    };
  }, []);

  const adjustQty = (productId, delta) => {
    setQuantities(prev => {
      const current = prev[productId] || 1;
      const next = Math.max(1, Math.min(100, current + delta));
      return { ...prev, [productId]: next };
    });
  };

  const handleProduce = useCallback((product) => {
    const qty = quantities[product.id] || 1;

    // Don't allow starting production if already in progress for this product
    if (producing[product.id]) return;

    const totalSeconds = product.duration;

    // Set producing state
    setProducing(prev => ({
      ...prev,
      [product.id]: { remaining: totalSeconds, total: totalSeconds, qty, name: product.name }
    }));

    // Start countdown interval
    let remaining = totalSeconds;
    timerRefs.current[product.id] = setInterval(() => {
      remaining -= 1;

      if (remaining <= 0) {
        // Production complete — call API
        clearInterval(timerRefs.current[product.id]);
        delete timerRefs.current[product.id];

        // Remove from producing state
        setProducing(prev => {
          const { [product.id]: removed, ...rest } = prev;
          return rest;
        });

        // Trigger API Call
        productionService.completeProduction({
          productId: product.id,
          productName: product.name,
          quantity: qty
        }, token).then(response => {
          if (response.success && onProductionComplete) {
            onProductionComplete(response.inventory);
          }
        }).catch(err => {
          console.error('[Production API Error]', err.message);
        });

      } else {
        // Just update the remaining time
        setProducing(prev => {
          if (!prev[product.id]) return prev;
          return {
            ...prev,
            [product.id]: { ...prev[product.id], remaining }
          };
        });
      }
    }, 1000);
  }, [quantities, token, onProductionComplete]);

  // --- Retail: No Production ---
  if (isRetail) {
    return (
      <div className="glass-card p-6 border border-white/5 relative">
        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-warningGlow/30 to-transparent"></div>
        <h3 className="font-display text-xs font-bold uppercase tracking-wider text-text-secondary mb-4 flex items-center gap-2">
          <i className="fa-solid fa-industry text-warningGlow"></i>
          Production Center
        </h3>
        <div className="p-6 bg-white/2 border border-white/5 rounded text-center">
          <i className="fa-solid fa-store text-3xl text-warningGlow/50 mb-3"></i>
          <p className="text-sm text-text-secondary leading-relaxed font-semibold">
            This business cannot produce goods. Purchase products from Marketplace.
          </p>
        </div>
      </div>
    );
  }

  // --- No products available ---
  if (!products || products.length === 0) {
    return (
      <div className="glass-card p-6 border border-white/5">
        <h3 className="font-display text-xs font-bold uppercase tracking-wider text-text-secondary mb-4 flex items-center gap-2">
          <i className="fa-solid fa-industry text-cyanGlow"></i>
          Production Center
        </h3>
        <p className="text-xs text-text-muted text-center py-4">No product blueprints available for this business type.</p>
      </div>
    );
  }

  // --- Active Production Panel ---
  return (
    <div className="glass-card p-6 border border-white/5 relative">
      <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-cyanGlow/30 to-transparent"></div>

      <h3 className="font-display text-xs font-bold uppercase tracking-wider text-text-secondary mb-6 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-cyanGlow animate-ping"></span>
        <i className="fa-solid fa-industry text-cyanGlow"></i>
        Production Center
      </h3>

      {isBlocked && (
        <div className="mb-6 p-4 bg-red-950/35 border border-red-500/30 rounded text-red-400 text-xs flex items-center gap-3">
          <i className="fa-solid fa-triangle-exclamation"></i>
          <span>Hire {missingRoles.map(r => r === 'Farmer' || r === 'Builder' || r === 'Labourer' || r === 'Engineer' || r === 'Manager' || r === 'Chief' || r === 'Fashion Designer' ? r + 's' : r).join(' and ')} before production can begin.</span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4">
        {products.map((product) => {
          const isProducing = !!producing[product.id];
          const prodState = producing[product.id];
          const progressPct = prodState
            ? ((prodState.total - prodState.remaining) / prodState.total) * 100
            : 0;

          // Compute product dependencies dynamically based on selected batch size
          const selectedQty = quantities[product.id] || 1;
          const dep = PRODUCT_DEPENDENCIES[product.id];
          const missingResources = [];

          if (dep) {
            // Check employees
            if (dep.employees) {
              for (const [role, reqQty] of Object.entries(dep.employees)) {
                const hired = employees.find(e => e.employeeType === role)?.quantity || 0;
                if (hired < reqQty) {
                  missingResources.push({
                    name: role,
                    needed: reqQty,
                    available: hired,
                    type: 'employee'
                  });
                }
              }
            }

            // Check materials
            if (dep.materials) {
              for (const [matId, qtyPerUnit] of Object.entries(dep.materials)) {
                const needed = qtyPerUnit * selectedQty;
                const available = inventory.find(i => i.productId === matId)?.quantity || 0;
                if (available < needed) {
                  const matName = matId.charAt(0).toUpperCase() + matId.slice(1).replace('_', ' ');
                  missingResources.push({
                    name: matName,
                    needed,
                    available,
                    type: 'material'
                  });
                }
              }
            }
          }

          const hasMissing = missingResources.length > 0;

          return (
            <div
              key={product.id}
              className={`p-4 bg-black/30 border rounded relative overflow-hidden transition-all duration-300 ${
                isProducing
                  ? 'border-cyanGlow/30 shadow-cyan'
                  : 'border-white/5 hover:border-white/10'
              }`}
            >
              {/* Progress bar background */}
              {isProducing && (
                <div
                  className="absolute bottom-0 left-0 h-[3px] bg-gradient-to-r from-cyanGlow to-blueGlow transition-all duration-1000 ease-linear"
                  style={{ width: `${progressPct}%` }}
                ></div>
              )}

              {/* Product Header */}
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg border transition-colors ${
                  isProducing
                    ? 'bg-cyanGlow/10 border-cyanGlow/30 text-cyanGlow'
                    : 'bg-white/3 border-white/8 text-text-secondary'
                }`}>
                  <i className={product.icon}></i>
                </div>
                <div>
                  <h4 className="font-display text-sm font-bold uppercase tracking-wider text-white">
                    {product.name}
                  </h4>
                  <span className="text-[9px] text-text-muted font-display uppercase tracking-widest">
                    {product.duration}s per batch
                  </span>
                </div>
              </div>

              {/* Producing State */}
              {isProducing ? (
                <div className="text-center py-2">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <i className="fa-solid fa-gear animate-spin text-cyanGlow text-xs"></i>
                    <span className="text-[10px] font-display uppercase tracking-widest text-cyanGlow">
                      Producing {prodState.qty}x {prodState.name}...
                    </span>
                  </div>
                  <div className="font-display text-3xl font-black text-cyanGlow tabular-nums">
                    {prodState.remaining}
                  </div>
                  <span className="text-[9px] text-text-muted font-display uppercase tracking-widest">
                    seconds remaining
                  </span>
                </div>
              ) : (
                <>
                  {/* Quantity Selector */}
                  <div className="flex items-center justify-center gap-3 mb-3">
                    <button
                      onClick={() => adjustQty(product.id, -1)}
                      className="w-8 h-8 flex items-center justify-center bg-white/3 border border-white/10 rounded hover:bg-white/8 hover:border-cyanGlow/30 text-text-secondary hover:text-white transition-all text-sm font-bold"
                    >
                      −
                    </button>
                    <span className="font-display text-xl font-black text-white w-12 text-center tabular-nums">
                      {quantities[product.id] || 1}
                    </span>
                    <button
                      onClick={() => adjustQty(product.id, 1)}
                      className="w-8 h-8 flex items-center justify-center bg-white/3 border border-white/10 rounded hover:bg-white/8 hover:border-cyanGlow/30 text-text-secondary hover:text-white transition-all text-sm font-bold"
                    >
                      +
                    </button>
                  </div>

                  {/* Warning Card */}
                  {hasMissing && (
                    <div className="mb-3 p-3 bg-red-950/20 border border-red-500/20 rounded text-[11px] text-red-400">
                      <div className="font-display font-bold uppercase tracking-wider text-[10px] text-red-400 mb-1 flex items-center gap-1">
                        <i className="fa-solid fa-triangle-exclamation animate-pulse"></i>
                        <span>Missing Resources</span>
                      </div>
                      <ul className="space-y-0.5 list-disc pl-4 font-mono text-[10px] text-red-300">
                        {missingResources.map((res, index) => (
                          <li key={index}>
                            - {res.name} ({res.needed} needed)
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Produce Button */}
                  <button
                    onClick={() => handleProduce(product)}
                    disabled={isBlocked || hasMissing}
                    className={`w-full py-2.5 font-display text-[10px] font-bold uppercase tracking-widest rounded transition-all flex items-center justify-center gap-2 border ${
                      isBlocked || hasMissing
                        ? 'bg-white/2 border-white/5 text-text-muted cursor-not-allowed'
                        : 'bg-gradient-to-r from-cyanGlow/10 to-blueGlow/10 border-cyanGlow/25 hover:border-cyanGlow/50 hover:from-cyanGlow/20 hover:to-blueGlow/20 text-cyanGlow'
                    }`}
                  >
                    <i className="fa-solid fa-play text-[8px]"></i>
                    Produce
                  </button>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
