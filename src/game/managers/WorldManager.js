import { PARCELS } from '../../gameConfig/mapConfig.js';

export default class WorldManager {
  constructor(scene) {
    this.scene = scene;
    this.plots = PARCELS;
  }

  /**
   * Resolves raw startup details into a future-proof building object
   * mapped to an assigned plot with positioning and rotation.
   * @param {Object} startup - The logged in user's startup object.
   * @returns {Object} buildingData
   */
  getBuildingForStartup(startup) {
    if (!startup) return null;

    // Dynamically find the centerpiece plot marked as owned in the configuration
    const plot = this.plots.find(p => p.ownershipStatus === 'owned') || this.plots[0];
    const plotId = plot ? plot.id : 'parcel_012';

    // Default coordinates in case plot lookup fails
    const defaultX = 1200;
    const defaultY = 1100;
    
    // Position using the parcel's buildingFootprint anchor offset
    const anchorX = (plot && plot.buildingFootprint) ? (plot.buildingFootprint.anchorX || 0) : 0;
    const anchorY = (plot && plot.buildingFootprint) ? (plot.buildingFootprint.anchorY || 0) : 0;
    const x = plot ? (plot.x + anchorX) : defaultX;
    const y = plot ? (plot.y + anchorY) : defaultY;

    // Calculate rotation/orientation based on its connection to the road
    let rotation = 0;
    if (plot) {
      const dx = plot.connectX - plot.x;
      const dy = plot.connectY - plot.y;

      // Determine road direction relative to plot center
      if (dx > 0 && Math.abs(dx) > Math.abs(dy)) {
        rotation = Math.PI / 2; // Road is to the right, face right
      } else if (dx < 0 && Math.abs(dx) > Math.abs(dy)) {
        rotation = -Math.PI / 2; // Road is to the left, face left
      } else if (dy < 0 && Math.abs(dy) >= Math.abs(dx)) {
        rotation = Math.PI; // Road is above, face up
      } else {
        rotation = 0; // Road is below, face down (default)
      }
    }

    return {
      id: `bld_${startup._id || startup.startupId}`,
      startupId: startup._id || startup.startupId,
      ownerId: startup.owner,
      plotId: plotId,
      businessType: startup.businessType,
      level: 1, // Standard level for Phase 4
      x: x,
      y: y,
      rotation: rotation
    };
  }
}
