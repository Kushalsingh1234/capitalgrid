/**
 * CapitalGrid Product Dependency Schema (Backend)
 * Maps each product ID to its required materials (quantity per produced unit)
 * and required employee counts (flat minimum quantity needed to run production).
 */

export const PRODUCT_DEPENDENCIES = {
  // --- Primary Sector (Farming, Dairy, Mining) ---
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
  grains: {
    materials: { seeds: 1, water: 1 },
    employees: { 'Farmer': 1 }
  },
  vegetables: {
    materials: { seeds: 1, water: 2 },
    employees: { 'Farmer': 1 }
  },
  fodder: {
    materials: { grains: 1, vegetables: 1 },
    employees: { 'Labourer': 1 }
  },
  milk: {
    materials: { water: 1, cows: 1, fodder: 1 },
    employees: { 'Labourer': 1 }
  },
  eggs: {
    materials: { hens: 1, water: 1, grains: 1 },
    employees: { 'Labourer': 1 }
  },
  coal: {
    materials: { energy: 2 },
    employees: { 'Labourer': 1 }
  },
  iron_ore: {
    materials: { energy: 2 },
    employees: { 'Labourer': 1 }
  },
  bauxite_ore: {
    materials: { energy: 2 },
    employees: { 'Labourer': 1 }
  },
  limestone: {
    materials: { energy: 2 },
    employees: { 'Labourer': 1 }
  },
  gypsum: {
    materials: { energy: 2 },
    employees: { 'Labourer': 1 }
  },
  crude_oil: {
    materials: { energy: 2 },
    employees: { 'Labourer': 1 }
  },
  minerals: {
    materials: { energy: 2 },
    employees: { 'Labourer': 1 }
  },
  sand: {
    materials: { energy: 2 },
    employees: { 'Labourer': 1 }
  },
  clay: {
    materials: { energy: 1 },
    employees: { 'Labourer': 1 }
  },

  // --- Garment Factory ---
  shirts: {
    materials: { cotton: 5 },
    employees: {}
  },
  jeans: {
    materials: { cotton: 5 },
    employees: {}
  },
  jackets: {
    materials: { cotton: 8 },
    employees: {}
  },
  fabric: {
    materials: { cotton: 2 },
    employees: {}
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

  // --- Construction Factory (Requires Coal, Builder not required, only Labourers) ---
  steel: {
    materials: { iron_ore: 1, energy: 2 },
    employees: {}
  },
  aluminium: {
    materials: { bauxite_ore: 1, energy: 2 },
    employees: {}
  },
  cement: {
    materials: { limestone: 1, gypsum: 1, energy: 1 },
    employees: {}
  },
  bricks: {
    materials: { clay: 1, gypsum: 1, energy: 1 },
    employees: {}
  },
  steel_beams: {
    materials: { steel: 3, energy: 2 },
    employees: {}
  },
  glass: {
    materials: { sand: 1, energy: 1 },
    employees: {}
  },
  silicon: {
    materials: { sand: 1, energy: 2 },
    employees: {}
  },
  plastics: {
    materials: { crude_oil: 1, energy: 1 },
    employees: {}
  },
  chemicals: {
    materials: { minerals: 1, energy: 1 },
    employees: {}
  },

  processor: {
    materials: { silicon: 3, chemicals: 1 },
    employees: {}
  },
  display: {
    materials: { silicon: 5, chemicals: 1, glass: 1 },
    employees: {}
  },
  electronic_components: {
    materials: { silicon: 2, chemicals: 1 },
    employees: {}
  },
  battery: {
    materials: { chemicals: 2, silicon: 2 },
    employees: {}
  },
  on_board_computer: {
    materials: { processor: 1, electronic_components: 3 },
    employees: {}
  },
  phones: {
    materials: { electronic_components: 2, display: 1, processor: 1, aluminium: 1, battery: 1 },
    employees: {}
  },
  laptops: {
    materials: { display: 1, processor: 2, electronic_components: 3, plastics: 2, battery: 2, aluminium: 1 },
    employees: {}
  },
  tvs: {
    materials: { display: 2, processor: 1, plastics: 3, electronic_components: 2 },
    employees: {}
  },

  // --- Automobile Manufacturing ---
  combustion_engine: {
    materials: { chemicals: 10, electronic_components: 2, steel: 5 },
    employees: {}
  },
  cars: {
    materials: { on_board_computer: 1, combustion_engine: 1, aluminium: 40, steel: 60, glass: 5, plastics: 30, display: 2, fabric: 5 },
    employees: {}
  }
};

export default PRODUCT_DEPENDENCIES;
