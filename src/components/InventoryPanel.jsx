import React from 'react';

// Icon map matching product IDs to Font Awesome icons
const PRODUCT_ICONS = {
  wheat: 'fa-solid fa-wheat-awn',
  rice: 'fa-solid fa-bowl-rice',
  cotton: 'fa-solid fa-cloud',
  milk: 'fa-solid fa-glass-water',
  coal: 'fa-solid fa-mountain',
  shirts: 'fa-solid fa-shirt',
  jeans: 'fa-solid fa-scissors',
  jackets: 'fa-solid fa-vest-patches',
  bread: 'fa-solid fa-bread-slice',
  biscuits: 'fa-solid fa-cookie',
  cheese: 'fa-solid fa-cheese',
  cement: 'fa-solid fa-cubes-stacked',
  bricks: 'fa-solid fa-cubes',
  steel_beams: 'fa-solid fa-bars',
  cars: 'fa-solid fa-car-side',
  phones: 'fa-solid fa-mobile-screen-button',
  laptops: 'fa-solid fa-laptop',
  tvs: 'fa-solid fa-tv'
};

/**
 * InventoryPanel — displays the startup's current inventory in a grid format.
 *
 * Props:
 *   inventory: Array<{ productId, productName, quantity }>
 */
export default function InventoryPanel({ inventory }) {
  const hasItems = inventory && inventory.length > 0;
  const totalUnits = hasItems
    ? inventory.reduce((sum, item) => sum + item.quantity, 0)
    : 0;

  return (
    <div className="glass-card p-6 border border-white/5 relative">
      <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-greenGlow/30 to-transparent"></div>

      <div className="flex items-center justify-between mb-5">
        <h3 className="font-display text-xs font-bold uppercase tracking-wider text-text-secondary flex items-center gap-2">
          <i className="fa-solid fa-boxes-stacked text-greenGlow"></i>
          Inventory Warehouse
        </h3>
        {hasItems && (
          <span className="text-[9px] font-display uppercase tracking-widest text-text-muted bg-white/3 border border-white/5 px-2 py-0.5 rounded">
            {totalUnits} total units
          </span>
        )}
      </div>

      {!hasItems ? (
        <div className="p-6 bg-black/30 border border-white/5 rounded text-center">
          <i className="fa-solid fa-box-open text-2xl text-text-muted/40 mb-3"></i>
          <p className="text-xs text-text-muted">
            Warehouse is empty. Produce goods to begin stockpiling inventory.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {inventory.map((item) => (
            <div
              key={item.productId}
              className="p-3 bg-black/30 border border-white/5 rounded hover:border-greenGlow/20 transition-all group"
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-greenGlow/5 border border-greenGlow/15 flex items-center justify-center text-greenGlow text-sm group-hover:bg-greenGlow/10 transition-colors">
                  <i className={PRODUCT_ICONS[item.productId] || 'fa-solid fa-cube'}></i>
                </div>
                <span className="font-display text-[10px] font-bold uppercase tracking-wider text-white truncate">
                  {item.productName}
                </span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="font-display text-2xl font-black text-greenGlow tabular-nums">
                  {item.quantity.toLocaleString()}
                </span>
                <span className="text-[9px] text-text-muted font-display uppercase tracking-widest">
                  units
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
