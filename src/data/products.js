/**
 * CapitalGrid Product Catalog
 * Maps each businessType to its available products with production durations.
 * Retail businesses do not produce — they will purchase from the marketplace.
 */

const PRODUCTS = {
  // --- Primary Sector ---
  'Farming': [
    { id: 'wheat', name: 'Wheat', icon: 'fa-solid fa-wheat-awn', duration: 15 },
    { id: 'rice', name: 'Rice', icon: 'fa-solid fa-bowl-rice', duration: 20 },
    { id: 'cotton', name: 'Cotton', icon: 'fa-solid fa-cloud', duration: 25 }
  ],
  'Dairy': [
    { id: 'milk', name: 'Milk', icon: 'fa-solid fa-glass-water', duration: 20 }
  ],
  'Mining': [
    { id: 'coal', name: 'Coal', icon: 'fa-solid fa-mountain', duration: 30 }
  ],

  // --- Factories ---
  'Garment Factory': [
    { id: 'shirts', name: 'Shirts', icon: 'fa-solid fa-shirt', duration: 30 },
    { id: 'jeans', name: 'Jeans', icon: 'fa-solid fa-scissors', duration: 30 },
    { id: 'jackets', name: 'Jackets', icon: 'fa-solid fa-vest-patches', duration: 30 }
  ],
  'Food Processing Factory': [
    { id: 'bread', name: 'Bread', icon: 'fa-solid fa-bread-slice', duration: 30 },
    { id: 'biscuits', name: 'Biscuits', icon: 'fa-solid fa-cookie', duration: 30 },
    { id: 'cheese', name: 'Cheese', icon: 'fa-solid fa-cheese', duration: 30 }
  ],
  'Construction Factory': [
    { id: 'cement', name: 'Cement', icon: 'fa-solid fa-cubes-stacked', duration: 30 },
    { id: 'bricks', name: 'Bricks', icon: 'fa-solid fa-cubes', duration: 30 },
    { id: 'steel_beams', name: 'Steel Beams', icon: 'fa-solid fa-bars', duration: 30 }
  ],

  // --- Manufacturing ---
  'Automobile Manufacturing': [
    { id: 'cars', name: 'Cars', icon: 'fa-solid fa-car-side', duration: 30 }
  ],
  'Electronics Manufacturing': [
    { id: 'phones', name: 'Phones', icon: 'fa-solid fa-mobile-screen-button', duration: 30 },
    { id: 'laptops', name: 'Laptops', icon: 'fa-solid fa-laptop', duration: 30 },
    { id: 'tvs', name: 'TVs', icon: 'fa-solid fa-tv', duration: 30 }
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
