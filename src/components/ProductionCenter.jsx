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
export default function ProductionCenter({
  businessType,
  token,
  onProductionComplete,
  employees = [],
  inventory = [],
  onProducingStateChange,
  tasks = [],
  serverTime = null,
  fetchedAt = null
}) {
  const [quantities, setQuantities] = useState({});
  const [producing, setProducing] = useState({}); // { productId: { remaining, total, qty, name } }
  
  useEffect(() => {
    if (onProducingStateChange) {
      onProducingStateChange(producing);
    }
  }, [producing, onProducingStateChange]);

  const timerRefs = useRef({});
  const runningTaskRef = useRef(null);

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

  // Handle server-synced countdown timer initialization
  useEffect(() => {
    if (!serverTime) return;

    const activeTasks = tasks?.filter(t => t.status === 'Producing') || [];
    
    setProducing(prev => {
      const next = { ...prev };
      let changed = false;

      // Remove products that are no longer producing
      Object.keys(next).forEach(pId => {
        if (!activeTasks.some(t => t.productId === pId)) {
          delete next[pId];
          changed = true;
        }
      });

      // Add or update active tasks
      activeTasks.forEach(task => {
        const pId = task.productId;
        const endsTime = new Date(task.endsAt).getTime();
        const serverTimeMs = new Date(serverTime).getTime();
        const remainingAtFetch = (endsTime - serverTimeMs) / 1000;
        const elapsedSeconds = fetchedAt ? (Date.now() - fetchedAt) / 1000 : 0;
        const remaining = Math.max(0, Math.ceil(remainingAtFetch - elapsedSeconds));

        // Only initialize/update if not already present or if endsTime changed
        if (remaining > 0) {
          const existing = next[pId];
          if (!existing || runningTaskRef.current?.[pId] !== endsTime) {
            next[pId] = {
              remaining,
              total: task.duration || 30,
              qty: task.quantity,
              name: task.productName
            };
            if (!runningTaskRef.current) runningTaskRef.current = {};
            runningTaskRef.current[pId] = endsTime;
            changed = true;
          }
        }
      });

      return changed ? next : prev;
    });
  }, [tasks, serverTime, fetchedAt]);

  // Local clock decrement tick
  useEffect(() => {
    const activeProductIds = Object.keys(producing);
    if (activeProductIds.length === 0) return;

    const intervalId = setInterval(() => {
      setProducing(prev => {
        const next = { ...prev };
        let changed = false;

        Object.keys(next).forEach(pId => {
          const item = next[pId];
          if (item.remaining <= 1) {
            delete next[pId];
            changed = true;

            // Trigger completion on server
            const task = tasks?.find(t => t.productId === pId);
            productionService.completeProduction({
              productId: pId,
              productName: item.name,
              quantity: item.qty
            }, token).then(response => {
              if (response.success && onProductionComplete) {
                const remainingTasks = tasks.filter(t => t.productId !== pId);
                onProductionComplete(response.inventory, remainingTasks, response.serverTime);
              }
            }).catch(err => {
              console.error('[Production Complete API Error]', err.message);
            });
          } else {
            next[pId] = {
              ...item,
              remaining: item.remaining - 1
            };
            changed = true;
          }
        });

        return changed ? next : prev;
      });
    }, 1000);

    return () => clearInterval(intervalId);
  }, [producing, tasks, token, onProductionComplete]);

  const adjustQty = (productId, delta) => {
    setQuantities(prev => {
      const current = prev[productId] || 1;
      const next = Math.max(1, Math.min(100, current + delta));
      return { ...prev, [productId]: next };
    });
  };

  const handleProduce = useCallback((product) => {
    const qty = quantities[product.id] || 1;

    // Don't allow starting production if already producing this product
    if (producing[product.id]) return;

    // Trigger Server API Call
    productionService.startProduction({
      productId: product.id,
      quantity: qty
    }, token).then(response => {
      if (response.success && onProductionComplete) {
        // Collect current tasks and append the new task
        const currentTasks = tasks || [];
        onProductionComplete(response.inventory, [...currentTasks, response.task], response.serverTime);
      }
    }).catch(err => {
      console.error('[Production Start API Error]', err.message);
    });
  }, [quantities, token, producing, tasks, onProductionComplete]);

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
