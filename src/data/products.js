/**
 * CapitalGrid Product Catalog
 * Maps each businessType to its available products with production durations.
 * Retail businesses do not produce — they will purchase from the marketplace.
 */

const PRODUCTS = {
  // --- Primary Sector ---
  'Farming': [
    { id: 'wheat', name: 'Wheat', icon: 'fa-solid fa-wheat-awn', duration: 20 },
    { id: 'rice', name: 'Rice', icon: 'fa-solid fa-bowl-rice', duration: 25 },
    { id: 'cotton', name: 'Cotton', icon: 'fa-solid fa-cloud', duration: 30 }
  ],
  'Dairy': [
    { id: 'milk', name: 'Milk', icon: 'fa-solid fa-glass-water', duration: 35 }
  ],
  'Mining': [
    { id: 'coal', name: 'Coal', icon: 'fa-solid fa-mountain', duration: 45 }
  ],

  // --- Factories ---
  'Garment Factory': [
    { id: 'shirts', name: 'Shirts', icon: 'fa-solid fa-shirt', duration: 90 },
    { id: 'jeans', name: 'Jeans', icon: 'fa-solid fa-scissors', duration: 120 },
    { id: 'jackets', name: 'Jackets', icon: 'fa-solid fa-vest-patches', duration: 180 }
  ],
  'Food Processing Factory': [
    { id: 'bread', name: 'Bread', icon: 'fa-solid fa-bread-slice', duration: 60 },
    { id: 'biscuits', name: 'Biscuits', icon: 'fa-solid fa-cookie', duration: 90 },
    { id: 'cheese', name: 'Cheese', icon: 'fa-solid fa-cheese', duration: 120 }
  ],
  'Construction Factory': [
    { id: 'cement', name: 'Cement', icon: 'fa-solid fa-cubes-stacked', duration: 120 },
    { id: 'bricks', name: 'Bricks', icon: 'fa-solid fa-cubes', duration: 90 },
    { id: 'steel_beams', name: 'Steel Beams', icon: 'fa-solid fa-bars', duration: 240 }
  ],

  // --- Manufacturing ---
  'Automobile Manufacturing': [
    { id: 'cars', name: 'Cars', icon: 'fa-solid fa-car-side', duration: 1800 }
  ],
  'Electronics Manufacturing': [
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
