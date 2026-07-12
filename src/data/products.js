/**
 * CapitalGrid Product Catalog
 * Maps each businessType to its available products with production durations.
 * Retail businesses do not produce — they will purchase from the marketplace.
 */

const PRODUCTS = {
  // --- Primary Sector ---
  'Farming': [
    { id: 'seeds', name: 'Seeds', icon: 'fa-solid fa-seedling', duration: 15 },
    { id: 'wheat', name: 'Wheat', icon: 'fa-solid fa-wheat-awn', duration: 20 },
    { id: 'rice', name: 'Rice', icon: 'fa-solid fa-bowl-rice', duration: 25 },
    { id: 'cotton', name: 'Cotton', icon: 'fa-solid fa-cloud', duration: 30 },
    { id: 'grains', name: 'Grains', icon: 'fa-solid fa-wheat-awn', duration: 22 },
    { id: 'vegetables', name: 'Vegetables', icon: 'fa-solid fa-carrot', duration: 25 }
  ],
  'Dairy': [
    { id: 'milk', name: 'Milk', icon: 'fa-solid fa-glass-water', duration: 35 },
    { id: 'fodder', name: 'Fodder', icon: 'fa-solid fa-leaf', duration: 30 },
    { id: 'eggs', name: 'Eggs', icon: 'fa-solid fa-egg', duration: 28 }
  ],
  'Mining': [
    { id: 'coal', name: 'Coal', icon: 'fa-solid fa-mountain', duration: 45 },
    { id: 'iron_ore', name: 'Iron Ore', icon: 'fa-solid fa-cubes', duration: 35 },
    { id: 'bauxite_ore', name: 'Bauxite Ore', icon: 'fa-solid fa-fill-drip', duration: 40 },
    { id: 'limestone', name: 'Limestone', icon: 'fa-solid fa-hill-rockslide', duration: 30 },
    { id: 'gypsum', name: 'Gypsum', icon: 'fa-solid fa-flask', duration: 32 },
    { id: 'crude_oil', name: 'Crude Oil', icon: 'fa-solid fa-oil-can', duration: 50 },
    { id: 'minerals', name: 'Minerals', icon: 'fa-solid fa-diamond', duration: 45 },
    { id: 'sand', name: 'Sand', icon: 'fa-solid fa-trowel', duration: 20 },
    { id: 'clay', name: 'Clay', icon: 'fa-solid fa-shapes', duration: 25 }
  ],

  // --- Factories ---
  'Garment Factory': [
    { id: 'shirts', name: 'Shirts', icon: 'fa-solid fa-shirt', duration: 90 },
    { id: 'jeans', name: 'Jeans', icon: 'fa-solid fa-scissors', duration: 120 },
    { id: 'jackets', name: 'Jackets', icon: 'fa-solid fa-vest-patches', duration: 180 },
    { id: 'fabric', name: 'Fabric', icon: 'fa-solid fa-scroll', duration: 60 }
  ],
  'Food Processing Factory': [
    { id: 'bread', name: 'Bread', icon: 'fa-solid fa-bread-slice', duration: 60 },
    { id: 'biscuits', name: 'Biscuits', icon: 'fa-solid fa-cookie', duration: 90 },
    { id: 'cheese', name: 'Cheese', icon: 'fa-solid fa-cheese', duration: 120 }
  ],
  'Construction Factory': [
    { id: 'steel', name: 'Steel', icon: 'fa-solid fa-layer-group', duration: 100 },
    { id: 'aluminium', name: 'Aluminium', icon: 'fa-solid fa-cubes', duration: 110 },
    { id: 'cement', name: 'Cement', icon: 'fa-solid fa-cubes-stacked', duration: 120 },
    { id: 'bricks', name: 'Bricks', icon: 'fa-solid fa-cubes', duration: 90 },
    { id: 'steel_beams', name: 'Steel Beams', icon: 'fa-solid fa-bars', duration: 240 },
    { id: 'glass', name: 'Glass', icon: 'fa-solid fa-window-restore', duration: 35 },
    { id: 'silicon', name: 'Silicon', icon: 'fa-solid fa-microchip', duration: 40 },
    { id: 'plastics', name: 'Plastics', icon: 'fa-solid fa-bottle-water', duration: 120 },
    { id: 'chemicals', name: 'Chemicals', icon: 'fa-solid fa-flask-vial', duration: 110 }
  ],

  // --- Manufacturing ---
  'Automobile Manufacturing': [
    { id: 'combustion_engine', name: 'Combustion Engine', icon: 'fa-solid fa-gauge-high', duration: 180 },
    { id: 'cars', name: 'Cars', icon: 'fa-solid fa-car-side', duration: 1800 }
  ],
  'Electronics Manufacturing': [
    { id: 'processor', name: 'Processor', icon: 'fa-solid fa-microchip', duration: 120 },
    { id: 'display', name: 'Display', icon: 'fa-solid fa-desktop', duration: 120 },
    { id: 'electronic_components', name: 'Electronic Components', icon: 'fa-solid fa-network-wired', duration: 100 },
    { id: 'battery', name: 'Battery', icon: 'fa-solid fa-battery-three-quarters', duration: 80 },
    { id: 'on_board_computer', name: 'On-board Computer', icon: 'fa-solid fa-car-battery', duration: 200 },
    { id: 'phones', name: 'Phones', icon: 'fa-solid fa-mobile-screen-button', duration: 300 },
    { id: 'laptops', name: 'Laptops', icon: 'fa-solid fa-laptop', duration: 480 },
    { id: 'tvs', name: 'TVs', icon: 'fa-solid fa-tv', duration: 600 }
  ]
};

// Retail businesses that don't produce
const RETAIL_TYPES = [
  'Clothing Store',
  'Electronics Store',
  'Restaurant',
  'Car Showroom'
];

/**
 * Returns the product catalog for a given business type.
 * Returns null for retail businesses (they don't produce).
 */
export const getProductsForBusiness = (businessType) => {
  if (RETAIL_TYPES.includes(businessType)) return null;
  return PRODUCTS[businessType] || [];
};

/**
 * Returns true if the business type is retail (no production).
 */
export const isRetailBusiness = (businessType) => {
  return RETAIL_TYPES.includes(businessType);
};

export default PRODUCTS;
