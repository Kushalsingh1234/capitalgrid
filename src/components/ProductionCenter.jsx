import React, { useState, useEffect, useRef, useCallback } from 'react';
import { getProductsForBusiness, isRetailBusiness } from '../data/products';
import * as productionService from '../services/productionService';

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
export default function ProductionCenter({ businessType, token, onProductionComplete }) {
  const [quantities, setQuantities] = useState({});
  const [producing, setProducing] = useState({}); // { productId: { remaining, total, qty, name } }
  const timerRefs = useRef({});

  const products = getProductsForBusiness(businessType);
  const isRetail = isRetailBusiness(businessType);

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
    timerRefs.current[product.id] = setInterval(() => {
      setProducing(prev => {
        const current = prev[product.id];
        if (!current) {
          clearInterval(timerRefs.current[product.id]);
          return prev;
        }

        const newRemaining = current.remaining - 1;

        if (newRemaining <= 0) {
          // Production complete — call API
          clearInterval(timerRefs.current[product.id]);
          delete timerRefs.current[product.id];

          productionService.completeProduction({
            productId: product.id,
            productName: product.name,
            quantity: current.qty
          }, token).then(response => {
            if (response.success && onProductionComplete) {
              onProductionComplete(response.inventory);
            }
          }).catch(err => {
            console.error('[Production API Error]', err.message);
          });

          // Remove from producing state
          const { [product.id]: removed, ...rest } = prev;
          return rest;
        }

        return {
          ...prev,
          [product.id]: { ...current, remaining: newRemaining }
        };
      });
    }, 1000);
  }, [quantities, producing, token, onProductionComplete]);

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
          <p className="text-sm text-text-secondary leading-relaxed">
            This business does not manufacture products.
          </p>
          <p className="text-xs text-text-muted mt-1">
            Products will later be purchased from the marketplace.
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {products.map((product) => {
          const isProducing = !!producing[product.id];
          const prodState = producing[product.id];
          const progressPct = prodState
            ? ((prodState.total - prodState.remaining) / prodState.total) * 100
            : 0;

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

                  {/* Produce Button */}
                  <button
                    onClick={() => handleProduce(product)}
                    className="w-full py-2.5 bg-gradient-to-r from-cyanGlow/10 to-blueGlow/10 border border-cyanGlow/25 hover:border-cyanGlow/50 hover:from-cyanGlow/20 hover:to-blueGlow/20 text-cyanGlow font-display text-[10px] font-bold uppercase tracking-widest rounded transition-all flex items-center justify-center gap-2"
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
