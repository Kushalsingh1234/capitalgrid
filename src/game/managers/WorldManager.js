export default class WorldManager {
  constructor(scene) {
    this.scene = scene;
    this.plots = scene.plotsData || [];
  }

  /**
   * Resolves raw startup details into a future-proof building object
   * mapped to an assigned plot with positioning and rotation.
   * @param {Object} startup - The logged in user's startup object.
   * @returns {Object} buildingData
   */
  getBuildingForStartup(startup) {
    if (!startup) return null;

    // In Phase 4, the player's business is assigned to plot_5 (the visual centerpiece)
    const plotId = 'plot_5';
    const plot = this.plots.find(p => p.plotId === plotId);

    // Default coordinates in case plot lookup fails
    const defaultX = 2200;
    const defaultY = 2200;
    const x = plot ? plot.x : defaultX;
    const y = plot ? plot.y : defaultY;

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
