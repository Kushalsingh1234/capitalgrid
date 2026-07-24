/**
 * CapitalGrid Center View Map Configuration (Phase 33C Modular Isometric System)
 * Configures the modular 3D isometric terrain parameters, dynamic parcel generation, and buildable plots.
 */

export const MAP_SIZE = {
  width: 2800,
  height: 2000
};

// Camera bounds mapping the panned drag viewport boundaries
export const CAMERA_BOUNDS = {
  x: 0,
  y: 0,
  width: 2800,
  height: 2000
};

export const GRID_ROWS = 5;
export const GRID_COLS = 5;
export const TILE_WIDTH = 480;
export const TILE_HEIGHT = 160;
export const TILE_DEPTH = 40;
export const TILE_SPACING = 160; // Road-width spacing between blocks
export const PLOT_SCALE = 0.83; // Plot occupies 83% of the tile's top surface

export const ASSET_KEYS = {
  ISO_BLOCK: 'iso-block',
  ISO_SHADOW: 'iso-shadow',
  BUILDING_FARMING: 'building_farming',
  BUILDING_AUTOMOBILE: 'building_automobile',
  BUILDING_MINING: 'building_mining',
  BUILDING_CONSTRUCTION: 'building_construction',
  BUILDING_FOOD_PROCESSING: 'building_food_processing',
  BUILDING_GARMENT: 'building_garment',
  BUILDING_ELECTRONICS: 'building_electronics',
  BUILDING_RETAIL: 'building_retail'
};

// Procedural dynamic generation of 5x5 isometric grid tiles (25 total blocks)
const generateIsometricParcels = () => {
  const list = [];
  const worldCenterX = 1400; // Centered inside 2800 width
  const worldCenterY = 1000; // Centered inside 2000 height
  const W = TILE_WIDTH + TILE_SPACING;
  const H = TILE_HEIGHT + Math.round(TILE_SPACING * (TILE_HEIGHT / TILE_WIDTH));

  const makeFootprint = (w, h) => ({
    width: Math.floor(w * 0.65),
    height: Math.floor(h * 0.65),
    anchorX: 0,
    anchorY: 0
  });

  for (let r = 0; r < GRID_ROWS; r++) {
    for (let c = 0; c < GRID_COLS; c++) {
      // Seamless isometric coordinate math with TILE_SPACING offset
      const worldX = worldCenterX + (c - r) * (W / 2);
      const worldY = worldCenterY + (c + r - (GRID_ROWS + GRID_COLS - 2) / 2) * (H / 2);

      // District classifications
      let district = 'Industrial';
      if (r < 1) {
        district = 'Agriculture';
      } else if (r >= 4) {
        district = 'Commercial';
      } else if (r === 1 && c < 1) {
        district = 'Reserved';
      }

      // Metadata flags
      const isOwnedCenter = (r === 2 && c === 2);
      const isReserved = (district === 'Reserved');
      const isLocked = (r === 0 && c === 4); // Example locked parcel

      // 10 weighted handcrafted variants:
      // - Grass Only (grass): 30% (0.00-0.30)
      // - Flower Corner (flowers): 15% (0.30-0.45)
      // - Hedge Corner (hedge): 12% (0.45-0.57)
      // - Ornamental Tree (tree): 12% (0.57-0.69)
      // - Stone Garden (stone): 8% (0.69-0.77)
      // - Shrubs Only (shrubs): 10% (0.77-0.87)
      // - Flower Island (flower-island): 5% (0.87-0.92)
      // - Landscaped Corner (landscaped): 5% (0.92-0.97)
      // - Mixed Vegetation (mixed): 2% (0.97-0.99)
      // - Premium Landscaped (premium): 1% (0.99-1.00)
      const variantRoll = Math.random();
      let plotVariant = 'grass';
      
      if (r === 3 && c === 3) {
        plotVariant = 'tree';
      } else if (isReserved) {
        plotVariant = 'grass';
      } else {
        if (variantRoll < 0.30) {
          plotVariant = 'grass';
        } else if (variantRoll < 0.45) {
          plotVariant = 'flowers';
        } else if (variantRoll < 0.57) {
          plotVariant = 'hedge';
        } else if (variantRoll < 0.69) {
          plotVariant = 'tree';
        } else if (variantRoll < 0.77) {
          plotVariant = 'stone';
        } else if (variantRoll < 0.87) {
          plotVariant = 'shrubs';
        } else if (variantRoll < 0.92) {
          plotVariant = 'flower-island';
        } else if (variantRoll < 0.97) {
          plotVariant = 'landscaped';
        } else if (variantRoll < 0.99) {
          plotVariant = 'mixed';
        } else {
          plotVariant = 'premium';
        }
      }

      list.push({
        id: `tile_${r}_${c}`,
        row: r,
        col: c,
        x: Math.round(worldX),
        y: Math.round(worldY),
        width: TILE_WIDTH,
        height: TILE_HEIGHT,
        connectX: Math.round(worldX),
        connectY: Math.round(worldY + TILE_HEIGHT / 2),
        adjacentParcels: [
          `tile_${Math.max(0, r-1)}_${c}`,
          `tile_${Math.min(GRID_ROWS-1, r+1)}_${c}`,
          `tile_${r}_${Math.max(0, c-1)}`,
          `tile_${r}_${Math.min(GRID_COLS-1, c+1)}`
        ],
        ownershipStatus: isOwnedCenter ? 'owned' : 'unowned',
        occupied: false,
        locked: isLocked,
        reserved: isReserved,
        tileType: 'concrete',
        buildable: true,
        plotVariant: plotVariant,
        buildAnchor: { x: 0, y: -20 }, // Offset from center matching block top surface center
        plotSize: TILE_WIDTH * TILE_HEIGHT,
        district: district,
        buildingOccupancy: null,
        buildingFootprint: makeFootprint(TILE_WIDTH, TILE_HEIGHT)
      });
    }
  }
  return list;
};

export const PARCELS = generateIsometricParcels();
export const ROADS = []; // All old 2D roads are disabled for Phase 33C
export const DECORATIONS = []; // All old 2D vegetation/lights are disabled for Phase 33C
