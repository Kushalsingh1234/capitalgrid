/**
 * CapitalGrid Product Dependency Schema
 * Maps each product ID to its required materials (quantity per produced unit)
 * and required employee counts (flat minimum quantity needed to run production).
 */

export const PRODUCT_DEPENDENCIES = {
  // --- Primary Sector (Farming, Dairy, Mining) ---
  // No materials required, only their respective service sector workers.
  seeds: {
    materials: { water: 1 },
    employees: { 'Farmer': 1 }
  },
  wheat: {
    materials: { seeds: 1, water: 2 },
    employees: { 'Farmer': 1 }
  },
  rice: {
    materials: { seeds: 2, water: 3 },
    employees: { 'Farmer': 1 }
  },
  cotton: {
    materials: { seeds: 3, water: 2 },
    employees: { 'Farmer': 1 }
  },
  milk: {
    materials: {},
    employees: { 'Farmer': 1 }
  },
  coal: {
    materials: {},
    employees: { 'Labourer': 1 }
  },

  // --- Garment Factory ---
  shirts: {
    materials: { cotton: 5 },
    employees: { 'Fashion Designer': 1, 'Labourer': 2 }
  },
  jeans: {
    materials: { cotton: 5 },
    employees: { 'Fashion Designer': 1, 'Labourer': 2 }
  },
  jackets: {
    materials: { cotton: 8 },
    employees: { 'Fashion Designer': 1, 'Labourer': 2 }
  },

  // --- Food Processing Factory ---
  bread: {
    materials: { wheat: 5 },
    employees: { 'Labourer': 1 }
  },
  biscuits: {
    materials: { wheat: 3, milk: 2 },
    employees: { 'Labourer': 1 }
  },
  cheese: {
    materials: { milk: 5 },
    employees: { 'Labourer': 1 }
  },

  // --- Construction Factory (Requires Coal for smelting and processing, only Labourers) ---
  cement: {
    materials: { coal: 3 },
    employees: { 'Labourer': 1 }
  },
  bricks: {
    materials: { coal: 2 },
    employees: { 'Labourer': 1 }
  },
  steel_beams: {
    materials: { coal: 5 },
    employees: { 'Labourer': 2 }
  },

  // --- Electronics Manufacturing ---
  phones: {
    materials: { coal: 5 },
    employees: { 'Engineer': 1, 'Labourer': 1 }
  },
  laptops: {
    materials: { coal: 8 },
    employees: { 'Engineer': 1, 'Labourer': 1 }
  },
  tvs: {
    materials: { coal: 6 },
    employees: { 'Engineer': 1, 'Labourer': 1 }
  },

  // --- Automobile Manufacturing (Requires Steel Beams and Coal) ---
  cars: {
    materials: { steel_beams: 2, coal: 5 },
    employees: { 'Engineer': 2, 'Labourer': 3 }
  }
};

export default PRODUCT_DEPENDENCIES;
