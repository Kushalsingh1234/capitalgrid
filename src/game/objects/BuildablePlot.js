import Phaser from 'phaser';

/**
 * BuildablePlot - Permanent visual and logical layout layer above the concrete block (Phase 33C)
 * Stores plot metadata and renders the grass variant with edge decorations.
 */
export default class BuildablePlot extends Phaser.GameObjects.Container {
  /**
   * @param {Phaser.Scene} scene - The active GameScene
   * @param {Object} tileData - The dynamic coordinate and config metadata
   */
  constructor(scene, tileData) {
    super(scene, 0, 0);
    this.scene = scene;

    // 1. Expose metadata fields for future building/economy system linkage
    this.id = tileData.id;
    this.row = tileData.row;
    this.col = tileData.col;
    this.occupied = tileData.occupied || false;
    this.locked = tileData.locked || false;
    this.reserved = tileData.reserved || false;
    this.tileType = tileData.tileType || 'concrete';
    this.buildable = tileData.buildable !== false;
    this.plotVariant = tileData.plotVariant || 'grass';

    // 2. Select corresponding variant key
    const assetKey = `plot_${this.plotVariant}`;

    // 3. Render the plot image.
    // Origin (0.5, 0.630859375) centers the grass diamond exactly at local (0, 0)
    this.sprite = scene.add.image(0, 0, assetKey).setOrigin(0.5, 0.630859375).setScale(0.5);
    this.add(this.sprite);

    // Add container to the scene
    scene.add.existing(this);
  }

  /**
   * Returns the world space build anchor coordinates for future building alignments
   * @returns {Object} { x, y }
   */
  getBuildAnchor() {
    return {
      x: this.parentContainer ? this.parentContainer.x : 0,
      y: this.parentContainer ? this.parentContainer.y : 0
    };
  }
}
