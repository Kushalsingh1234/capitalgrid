/**
 * Country Economy Configuration Framework
 * Centralized registry for all country-specific economic parameters.
 * Designed for modular expansion (construction, utilities, taxes, tariffs, shipping, etc.).
 */

const countryEconomy = {
  countries: {
    'India': {
      currency: 'INR',
      employees: {
        'Farmer': 18000,
        'Labourer': 16000,
        'Engineer': 55000,
        'Manager': 75000,
        'Chef': 30000,
        'Fashion Designer': 45000
      },
      commodities: {
        'seeds': { name: 'Seeds', price: 18, category: 'Agriculture', producedBy: 'Farming', usedIn: ['Wheat', 'Rice', 'Cotton'] },
        'water': { name: 'Water', price: 8, category: 'Agriculture', producedBy: 'Government', usedIn: ['Seeds', 'Wheat', 'Rice', 'Cotton'] },
        'wheat': { name: 'Wheat', price: 90, category: 'Agriculture', producedBy: 'Farming', usedIn: ['Bread', 'Biscuits'] },
        'rice': { name: 'Rice', price: 80, category: 'Agriculture', producedBy: 'Farming', usedIn: [] },
        'cotton': { name: 'Cotton', price: 100, category: 'Agriculture', producedBy: 'Farming', usedIn: ['Shirts', 'Jeans', 'Jackets'] },
        'milk': { name: 'Milk', price: 60, category: 'Agriculture', producedBy: 'Dairy', usedIn: ['Biscuits', 'Cheese'] },
        'coal': { name: 'Coal', price: 350, category: 'Mining', producedBy: 'Mining', usedIn: ['Cement', 'Bricks', 'Steel Beams', 'Phones', 'Laptops', 'TVs', 'Cars'] },
        'shirts': { name: 'Shirts', price: 850, category: 'Garments', producedBy: 'Garment Factory', usedIn: [] },
        'jeans': { name: 'Jeans', price: 1200, category: 'Garments', producedBy: 'Garment Factory', usedIn: [] },
        'jackets': { name: 'Jackets', price: 2000, category: 'Garments', producedBy: 'Garment Factory', usedIn: [] },
        'bread': { name: 'Bread', price: 600, category: 'Food Processing', producedBy: 'Food Processing Factory', usedIn: [] },
        'biscuits': { name: 'Biscuits', price: 550, category: 'Food Processing', producedBy: 'Food Processing Factory', usedIn: [] },
        'cheese': { name: 'Cheese', price: 900, category: 'Food Processing', producedBy: 'Food Processing Factory', usedIn: [] },
        'cement': { name: 'Cement', price: 700, category: 'Construction Materials', producedBy: 'Construction Factory', usedIn: [] },
        'bricks': { name: 'Bricks', price: 450, category: 'Construction Materials', producedBy: 'Construction Factory', usedIn: [] },
        'steel_beams': { name: 'Steel Beams', price: 1800, category: 'Construction Materials', producedBy: 'Construction Factory', usedIn: ['Cars'] },
        'phones': { name: 'Phones', price: 18000, category: 'Electronics', producedBy: 'Electronics Manufacturing', usedIn: [] },
        'laptops': { name: 'Laptops', price: 48000, category: 'Electronics', producedBy: 'Electronics Manufacturing', usedIn: [] },
        'tvs': { name: 'TVs', price: 32000, category: 'Electronics', producedBy: 'Electronics Manufacturing', usedIn: [] },
        'cars': { name: 'Cars', price: 650000, category: 'Automotive', producedBy: 'Automobile Manufacturing', usedIn: [] }
      },
      construction: {},
      utilities: {},
      taxes: {}
    },
    'United States': {
      currency: 'USD',
      employees: {
        'Farmer': 4000,
        'Labourer': 3600,
        'Engineer': 8500,
        'Manager': 11000,
        'Chef': 4800,
        'Fashion Designer': 7200
      },
      commodities: {
        'seeds': { name: 'Seeds', price: 0.30, category: 'Agriculture', producedBy: 'Farming', usedIn: ['Wheat', 'Rice', 'Cotton'] },
        'water': { name: 'Water', price: 0.12, category: 'Agriculture', producedBy: 'Government', usedIn: ['Seeds', 'Wheat', 'Rice', 'Cotton'] },
        'wheat': { name: 'Wheat', price: 2.40, category: 'Agriculture', producedBy: 'Farming', usedIn: ['Bread', 'Biscuits'] },
        'rice': { name: 'Rice', price: 2.10, category: 'Agriculture', producedBy: 'Farming', usedIn: [] },
        'cotton': { name: 'Cotton', price: 2.80, category: 'Agriculture', producedBy: 'Farming', usedIn: ['Shirts', 'Jeans', 'Jackets'] },
        'milk': { name: 'Milk', price: 1.80, category: 'Agriculture', producedBy: 'Dairy', usedIn: ['Biscuits', 'Cheese'] },
        'coal': { name: 'Coal', price: 9.00, category: 'Mining', producedBy: 'Mining', usedIn: ['Cement', 'Bricks', 'Steel Beams', 'Phones', 'Laptops', 'TVs', 'Cars'] },
        'shirts': { name: 'Shirts', price: 24.00, category: 'Garments', producedBy: 'Garment Factory', usedIn: [] },
        'jeans': { name: 'Jeans', price: 36.00, category: 'Garments', producedBy: 'Garment Factory', usedIn: [] },
        'jackets': { name: 'Jackets', price: 60.00, category: 'Garments', producedBy: 'Garment Factory', usedIn: [] },
        'bread': { name: 'Bread', price: 16.00, category: 'Food Processing', producedBy: 'Food Processing Factory', usedIn: [] },
        'biscuits': { name: 'Biscuits', price: 15.00, category: 'Food Processing', producedBy: 'Food Processing Factory', usedIn: [] },
        'cheese': { name: 'Cheese', price: 25.00, category: 'Food Processing', producedBy: 'Food Processing Factory', usedIn: [] },
        'cement': { name: 'Cement', price: 20.00, category: 'Construction Materials', producedBy: 'Construction Factory', usedIn: [] },
        'bricks': { name: 'Bricks', price: 12.00, category: 'Construction Materials', producedBy: 'Construction Factory', usedIn: [] },
        'steel_beams': { name: 'Steel Beams', price: 52.00, category: 'Construction Materials', producedBy: 'Construction Factory', usedIn: ['Cars'] },
        'phones': { name: 'Phones', price: 520.00, category: 'Electronics', producedBy: 'Electronics Manufacturing', usedIn: [] },
        'laptops': { name: 'Laptops', price: 1350.00, category: 'Electronics', producedBy: 'Electronics Manufacturing', usedIn: [] },
        'tvs': { name: 'TVs', price: 900.00, category: 'Electronics', producedBy: 'Electronics Manufacturing', usedIn: [] },
        'cars': { name: 'Cars', price: 35000.00, category: 'Automotive', producedBy: 'Automobile Manufacturing', usedIn: [] }
      },
      construction: {},
      utilities: {},
      taxes: {}
    },
    'United Kingdom': {
      currency: 'GBP',
      employees: {
        'Farmer': 2600,
        'Labourer': 2400,
        'Engineer': 5600,
        'Manager': 7000,
        'Chef': 3200,
        'Fashion Designer': 4800
      },
      commodities: {
        'seeds': { name: 'Seeds', price: 0.25, category: 'Agriculture', producedBy: 'Farming', usedIn: ['Wheat', 'Rice', 'Cotton'] },
        'water': { name: 'Water', price: 0.10, category: 'Agriculture', producedBy: 'Government', usedIn: ['Seeds', 'Wheat', 'Rice', 'Cotton'] },
        'wheat': { name: 'Wheat', price: 2.00, category: 'Agriculture', producedBy: 'Farming', usedIn: ['Bread', 'Biscuits'] },
        'rice': { name: 'Rice', price: 1.80, category: 'Agriculture', producedBy: 'Farming', usedIn: [] },
        'cotton': { name: 'Cotton', price: 2.30, category: 'Agriculture', producedBy: 'Farming', usedIn: ['Shirts', 'Jeans', 'Jackets'] },
        'milk': { name: 'Milk', price: 1.50, category: 'Agriculture', producedBy: 'Dairy', usedIn: ['Biscuits', 'Cheese'] },
        'coal': { name: 'Coal', price: 7.50, category: 'Mining', producedBy: 'Mining', usedIn: ['Cement', 'Bricks', 'Steel Beams', 'Phones', 'Laptops', 'TVs', 'Cars'] },
        'shirts': { name: 'Shirts', price: 20.00, category: 'Garments', producedBy: 'Garment Factory', usedIn: [] },
        'jeans': { name: 'Jeans', price: 30.00, category: 'Garments', producedBy: 'Garment Factory', usedIn: [] },
        'jackets': { name: 'Jackets', price: 50.00, category: 'Garments', producedBy: 'Garment Factory', usedIn: [] },
        'bread': { name: 'Bread', price: 13.00, category: 'Food Processing', producedBy: 'Food Processing Factory', usedIn: [] },
        'biscuits': { name: 'Biscuits', price: 12.00, category: 'Food Processing', producedBy: 'Food Processing Factory', usedIn: [] },
        'cheese': { name: 'Cheese', price: 21.00, category: 'Food Processing', producedBy: 'Food Processing Factory', usedIn: [] },
        'cement': { name: 'Cement', price: 17.00, category: 'Construction Materials', producedBy: 'Construction Factory', usedIn: [] },
        'bricks': { name: 'Bricks', price: 10.00, category: 'Construction Materials', producedBy: 'Construction Factory', usedIn: [] },
        'steel_beams': { name: 'Steel Beams', price: 44.00, category: 'Construction Materials', producedBy: 'Construction Factory', usedIn: ['Cars'] },
        'phones': { name: 'Phones', price: 430.00, category: 'Electronics', producedBy: 'Electronics Manufacturing', usedIn: [] },
        'laptops': { name: 'Laptops', price: 1120.00, category: 'Electronics', producedBy: 'Electronics Manufacturing', usedIn: [] },
        'tvs': { name: 'TVs', price: 760.00, category: 'Electronics', producedBy: 'Electronics Manufacturing', usedIn: [] },
        'cars': { name: 'Cars', price: 29000.00, category: 'Automotive', producedBy: 'Automobile Manufacturing', usedIn: [] }
      },
      construction: {},
      utilities: {},
      taxes: {}
    },
    'Germany': {
      currency: 'EUR',
      employees: {
        'Farmer': 3000,
        'Labourer': 2800,
        'Engineer': 6200,
        'Manager': 7500,
        'Chef': 3700,
        'Fashion Designer': 5200
      },
      commodities: {
        'seeds': { name: 'Seeds', price: 0.28, category: 'Agriculture', producedBy: 'Farming', usedIn: ['Wheat', 'Rice', 'Cotton'] },
        'water': { name: 'Water', price: 0.11, category: 'Agriculture', producedBy: 'Government', usedIn: ['Seeds', 'Wheat', 'Rice', 'Cotton'] },
        'wheat': { name: 'Wheat', price: 2.20, category: 'Agriculture', producedBy: 'Farming', usedIn: ['Bread', 'Biscuits'] },
        'rice': { name: 'Rice', price: 2.00, category: 'Agriculture', producedBy: 'Farming', usedIn: [] },
        'cotton': { name: 'Cotton', price: 2.50, category: 'Agriculture', producedBy: 'Farming', usedIn: ['Shirts', 'Jeans', 'Jackets'] },
        'milk': { name: 'Milk', price: 1.70, category: 'Agriculture', producedBy: 'Dairy', usedIn: ['Biscuits', 'Cheese'] },
        'coal': { name: 'Coal', price: 8.00, category: 'Mining', producedBy: 'Mining', usedIn: ['Cement', 'Bricks', 'Steel Beams', 'Phones', 'Laptops', 'TVs', 'Cars'] },
        'shirts': { name: 'Shirts', price: 22.00, category: 'Garments', producedBy: 'Garment Factory', usedIn: [] },
        'jeans': { name: 'Jeans', price: 33.00, category: 'Garments', producedBy: 'Garment Factory', usedIn: [] },
        'jackets': { name: 'Jackets', price: 55.00, category: 'Garments', producedBy: 'Garment Factory', usedIn: [] },
        'bread': { name: 'Bread', price: 15.00, category: 'Food Processing', producedBy: 'Food Processing Factory', usedIn: [] },
        'biscuits': { name: 'Biscuits', price: 14.00, category: 'Food Processing', producedBy: 'Food Processing Factory', usedIn: [] },
        'cheese': { name: 'Cheese', price: 23.00, category: 'Food Processing', producedBy: 'Food Processing Factory', usedIn: [] },
        'cement': { name: 'Cement', price: 18.00, category: 'Construction Materials', producedBy: 'Construction Factory', usedIn: [] },
        'bricks': { name: 'Bricks', price: 11.00, category: 'Construction Materials', producedBy: 'Construction Factory', usedIn: [] },
        'steel_beams': { name: 'Steel Beams', price: 48.00, category: 'Construction Materials', producedBy: 'Construction Factory', usedIn: ['Cars'] },
        'phones': { name: 'Phones', price: 470.00, category: 'Electronics', producedBy: 'Electronics Manufacturing', usedIn: [] },
        'laptops': { name: 'Laptops', price: 1220.00, category: 'Electronics', producedBy: 'Electronics Manufacturing', usedIn: [] },
        'tvs': { name: 'TVs', price: 820.00, category: 'Electronics', producedBy: 'Electronics Manufacturing', usedIn: [] },
        'cars': { name: 'Cars', price: 32000.00, category: 'Automotive', producedBy: 'Automobile Manufacturing', usedIn: [] }
      },
      construction: {},
      utilities: {},
      taxes: {}
    },
    'Brazil': {
      currency: 'BRL',
      employees: {
        'Farmer': 5500,
        'Labourer': 5000,
        'Engineer': 11000,
        'Manager': 16000,
        'Chef': 6800,
        'Fashion Designer': 10000
      },
      commodities: {
        'seeds': { name: 'Seeds', price: 1.40, category: 'Agriculture', producedBy: 'Farming', usedIn: ['Wheat', 'Rice', 'Cotton'] },
        'water': { name: 'Water', price: 0.60, category: 'Agriculture', producedBy: 'Government', usedIn: ['Seeds', 'Wheat', 'Rice', 'Cotton'] },
        'wheat': { name: 'Wheat', price: 7.00, category: 'Agriculture', producedBy: 'Farming', usedIn: ['Bread', 'Biscuits'] },
        'rice': { name: 'Rice', price: 6.00, category: 'Agriculture', producedBy: 'Farming', usedIn: [] },
        'cotton': { name: 'Cotton', price: 8.00, category: 'Agriculture', producedBy: 'Farming', usedIn: ['Shirts', 'Jeans', 'Jackets'] },
        'milk': { name: 'Milk', price: 5.00, category: 'Agriculture', producedBy: 'Dairy', usedIn: ['Biscuits', 'Cheese'] },
        'coal': { name: 'Coal', price: 28.00, category: 'Mining', producedBy: 'Mining', usedIn: ['Cement', 'Bricks', 'Steel Beams', 'Phones', 'Laptops', 'TVs', 'Cars'] },
        'shirts': { name: 'Shirts', price: 68.00, category: 'Garments', producedBy: 'Garment Factory', usedIn: [] },
        'jeans': { name: 'Jeans', price: 96.00, category: 'Garments', producedBy: 'Garment Factory', usedIn: [] },
        'jackets': { name: 'Jackets', price: 160.00, category: 'Garments', producedBy: 'Garment Factory', usedIn: [] },
        'bread': { name: 'Bread', price: 48.00, category: 'Food Processing', producedBy: 'Food Processing Factory', usedIn: [] },
        'biscuits': { name: 'Biscuits', price: 44.00, category: 'Food Processing', producedBy: 'Food Processing Factory', usedIn: [] },
        'cheese': { name: 'Cheese', price: 72.00, category: 'Food Processing', producedBy: 'Food Processing Factory', usedIn: [] },
        'cement': { name: 'Cement', price: 56.00, category: 'Construction Materials', producedBy: 'Construction Factory', usedIn: [] },
        'bricks': { name: 'Bricks', price: 36.00, category: 'Construction Materials', producedBy: 'Construction Factory', usedIn: [] },
        'steel_beams': { name: 'Steel Beams', price: 145.00, category: 'Construction Materials', producedBy: 'Construction Factory', usedIn: ['Cars'] },
        'phones': { name: 'Phones', price: 1450.00, category: 'Electronics', producedBy: 'Electronics Manufacturing', usedIn: [] },
        'laptops': { name: 'Laptops', price: 3850.00, category: 'Electronics', producedBy: 'Electronics Manufacturing', usedIn: [] },
        'tvs': { name: 'TVs', price: 2560.00, category: 'Electronics', producedBy: 'Electronics Manufacturing', usedIn: [] },
        'cars': { name: 'Cars', price: 210000.00, category: 'Automotive', producedBy: 'Automobile Manufacturing', usedIn: [] }
      },
      construction: {},
      utilities: {},
      taxes: {}
    },
    'Japan': {
      currency: 'JPY',
      employees: {
        'Farmer': 280000,
        'Labourer': 250000,
        'Engineer': 700000,
        'Manager': 900000,
        'Chef': 400000,
        'Fashion Designer': 620000
      },
      commodities: {
        'seeds': { name: 'Seeds', price: 42, category: 'Agriculture', producedBy: 'Farming', usedIn: ['Wheat', 'Rice', 'Cotton'] },
        'water': { name: 'Water', price: 18, category: 'Agriculture', producedBy: 'Government', usedIn: ['Seeds', 'Wheat', 'Rice', 'Cotton'] },
        'wheat': { name: 'Wheat', price: 320, category: 'Agriculture', producedBy: 'Farming', usedIn: ['Bread', 'Biscuits'] },
        'rice': { name: 'Rice', price: 300, category: 'Agriculture', producedBy: 'Farming', usedIn: [] },
        'cotton': { name: 'Cotton', price: 360, category: 'Agriculture', producedBy: 'Farming', usedIn: ['Shirts', 'Jeans', 'Jackets'] },
        'milk': { name: 'Milk', price: 220, category: 'Agriculture', producedBy: 'Dairy', usedIn: ['Biscuits', 'Cheese'] },
        'coal': { name: 'Coal', price: 1200, category: 'Mining', producedBy: 'Mining', usedIn: ['Cement', 'Bricks', 'Steel Beams', 'Phones', 'Laptops', 'TVs', 'Cars'] },
        'shirts': { name: 'Shirts', price: 3000, category: 'Garments', producedBy: 'Garment Factory', usedIn: [] },
        'jeans': { name: 'Jeans', price: 4200, category: 'Garments', producedBy: 'Garment Factory', usedIn: [] },
        'jackets': { name: 'Jackets', price: 7000, category: 'Garments', producedBy: 'Garment Factory', usedIn: [] },
        'bread': { name: 'Bread', price: 2100, category: 'Food Processing', producedBy: 'Food Processing Factory', usedIn: [] },
        'biscuits': { name: 'Biscuits', price: 1900, category: 'Food Processing', producedBy: 'Food Processing Factory', usedIn: [] },
        'cheese': { name: 'Cheese', price: 3200, category: 'Food Processing', producedBy: 'Food Processing Factory', usedIn: [] },
        'cement': { name: 'Cement', price: 2500, category: 'Construction Materials', producedBy: 'Construction Factory', usedIn: [] },
        'bricks': { name: 'Bricks', price: 1600, category: 'Construction Materials', producedBy: 'Construction Factory', usedIn: [] },
        'steel_beams': { name: 'Steel Beams', price: 6400, category: 'Construction Materials', producedBy: 'Construction Factory', usedIn: ['Cars'] },
        'phones': { name: 'Phones', price: 64000, category: 'Electronics', producedBy: 'Electronics Manufacturing', usedIn: [] },
        'laptops': { name: 'Laptops', price: 170000, category: 'Electronics', producedBy: 'Electronics Manufacturing', usedIn: [] },
        'tvs': { name: 'TVs', price: 112000, category: 'Electronics', producedBy: 'Electronics Manufacturing', usedIn: [] },
        'cars': { name: 'Cars', price: 4600000, category: 'Automotive', producedBy: 'Automobile Manufacturing', usedIn: [] }
      },
      construction: {},
      utilities: {},
      taxes: {}
    },
    'Australia': {
      currency: 'AUD',
      employees: {
        'Farmer': 5000,
        'Labourer': 4700,
        'Engineer': 9000,
        'Manager': 12000,
        'Chef': 5800,
        'Fashion Designer': 8200
      },
      commodities: {
        'seeds': { name: 'Seeds', price: 0.45, category: 'Agriculture', producedBy: 'Farming', usedIn: ['Wheat', 'Rice', 'Cotton'] },
        'water': { name: 'Water', price: 0.18, category: 'Agriculture', producedBy: 'Government', usedIn: ['Seeds', 'Wheat', 'Rice', 'Cotton'] },
        'wheat': { name: 'Wheat', price: 3.40, category: 'Agriculture', producedBy: 'Farming', usedIn: ['Bread', 'Biscuits'] },
        'rice': { name: 'Rice', price: 3.20, category: 'Agriculture', producedBy: 'Farming', usedIn: [] },
        'cotton': { name: 'Cotton', price: 3.90, category: 'Agriculture', producedBy: 'Farming', usedIn: ['Shirts', 'Jeans', 'Jackets'] },
        'milk': { name: 'Milk', price: 2.80, category: 'Agriculture', producedBy: 'Dairy', usedIn: ['Biscuits', 'Cheese'] },
        'coal': { name: 'Coal', price: 11.00, category: 'Mining', producedBy: 'Mining', usedIn: ['Cement', 'Bricks', 'Steel Beams', 'Phones', 'Laptops', 'TVs', 'Cars'] },
        'shirts': { name: 'Shirts', price: 32.00, category: 'Garments', producedBy: 'Garment Factory', usedIn: [] },
        'jeans': { name: 'Jeans', price: 48.00, category: 'Garments', producedBy: 'Garment Factory', usedIn: [] },
        'jackets': { name: 'Jackets', price: 80.00, category: 'Garments', producedBy: 'Garment Factory', usedIn: [] },
        'bread': { name: 'Bread', price: 21.00, category: 'Food Processing', producedBy: 'Food Processing Factory', usedIn: [] },
        'biscuits': { name: 'Biscuits', price: 20.00, category: 'Food Processing', producedBy: 'Food Processing Factory', usedIn: [] },
        'cheese': { name: 'Cheese', price: 34.00, category: 'Food Processing', producedBy: 'Food Processing Factory', usedIn: [] },
        'cement': { name: 'Cement', price: 27.00, category: 'Construction Materials', producedBy: 'Construction Factory', usedIn: [] },
        'bricks': { name: 'Bricks', price: 17.00, category: 'Construction Materials', producedBy: 'Construction Factory', usedIn: [] },
        'steel_beams': { name: 'Steel Beams', price: 70.00, category: 'Construction Materials', producedBy: 'Construction Factory', usedIn: ['Cars'] },
        'phones': { name: 'Phones', price: 700.00, category: 'Electronics', producedBy: 'Electronics Manufacturing', usedIn: [] },
        'laptops': { name: 'Laptops', price: 1820.00, category: 'Electronics', producedBy: 'Electronics Manufacturing', usedIn: [] },
        'tvs': { name: 'TVs', price: 1220.00, category: 'Electronics', producedBy: 'Electronics Manufacturing', usedIn: [] },
        'cars': { name: 'Cars', price: 48000.00, category: 'Automotive', producedBy: 'Automobile Manufacturing', usedIn: [] }
      },
      construction: {},
      utilities: {},
      taxes: {}
    }
  }
};

/**
 * Get salary for a specific employee type in a given country
 * @param {string} country 
 * @param {string} employeeType 
 * @returns {number}
 */
export function getSalary(country, employeeType) {
  let normalizedType = employeeType;
  if (employeeType === 'Chief') {
    normalizedType = 'Chef';
  }
  const countryData = countryEconomy.countries[country] || countryEconomy.countries['United States'];
  return countryData.employees[normalizedType] || 1000;
}

/**
 * Get local price for a specific product in a given country
 * @param {string} country 
 * @param {string} productId 
 * @returns {number}
 */
export function getProductPrice(country, productId) {
  const countryData = countryEconomy.countries[country] || countryEconomy.countries['United States'];
  const commodity = countryData.commodities[productId] || {};
  return commodity.price || 10;
}

export default countryEconomy;
