import Phaser from 'phaser';
import BuildablePlot from './BuildablePlot';

/**
 * IsometricTile - Reusable Modular 3D Platform Block (Phase 33D Centerpiece Building Integration)
 * Houses the permanent ground shadow, the 3D concrete block, and either the empty plot or player building.
 */
export default class IsometricTile extends Phaser.GameObjects.Container {
  /**
   * @param {Phaser.Scene} scene - The active GameScene
   * @param {Object} tileData - The decoupled metadata record
   */
  constructor(scene, tileData) {
    // Positioning container at calculated world coordinates
    super(scene, tileData.x, tileData.y);
    this.scene = scene;
    this.tileData = tileData;

    // 1. Soft ground shadow at y=0 (stays on ground plane)
    this.shadow = scene.add.image(0, 0, 'iso-shadow').setOrigin(0.5, 0.5);
    this.shadow.setAlpha(0.6);
    this.add(this.shadow);

    // 2. Visual elements group (rises together on pointerover for flawless layering)
    this.contentGroup = scene.add.container(0, 0);
    this.add(this.contentGroup);

    // 3. 3D Extruded Block Sprite
    this.block = scene.add.image(0, 0, 'iso-block').setOrigin(0.5, 0.5);
    this.contentGroup.add(this.block);

    // Apply a slight per-tile brightness variation (±3% around a 96% base tint)
    const base = 245;
    const diff = Math.floor(Math.random() * 16) - 8;
    const tintVal = base + diff;
    const tintColor = Phaser.Display.Color.GetColor(tintVal, tintVal, tintVal);
    this.block.setTint(tintColor);

    // 4. Instantiate centerpiece player building or empty plot layer
    const isCenterpiece = (tileData.row === 2 && tileData.col === 2);
    if (isCenterpiece) {
      // Fetch the registered account startup information
      const startup = scene.game.registry.get('startup');
      const businessType = startup ? startup.businessType : 'Farming';
      
      const getBuildingKey = (bType) => {
        const type = (bType || '').toLowerCase();
        if (['farming', 'dairy'].includes(type)) {
          return 'building_farming';
        } else if (type === 'mining') {
          return 'building_mining';
        } else if (['clothing store', 'electronics store', 'restaurant', 'car showroom'].includes(type)) {
          return 'building_retail';
        } else {
          return 'building_factory';
        }
      };

      const buildingKey = getBuildingKey(businessType);
      
      // Instantiate and display 3D building covering the entire block top face
      // Origin (0.5, 0.7333) centers the base diamond perfectly at local (0, -20)
      this.buildingSprite = scene.add.image(0, -20, buildingKey).setOrigin(0.5, 0.7333);
      this.contentGroup.add(this.buildingSprite);
    } else if (tileData.buildable) {
      this.plot = new BuildablePlot(scene, tileData).setPosition(0, -20);
      this.contentGroup.add(this.plot);
    }

    // 5. Define diamond-shaped input hit area matching the top flat face of the block.
    // In Phaser 3, hit areas are always relative to the top-left (0, 0) of the sprite's texture frame.
    // - Top: (240, 0)
    // - Right: (480, 80)
    // - Bottom: (240, 160)
    // - Left: (0, 80)
    const localDiamond = new Phaser.Geom.Polygon([
      240, 0,
      480, 80,
      240, 160,
      0, 80
    ]);

    // Make block interactive using the custom polygon detector
    this.block.setInteractive(localDiamond, Phaser.Geom.Polygon.Contains);

    // Register hover animations
    this.block.on('pointerover', () => {
      this.liftUp();
    });

    this.block.on('pointerout', () => {
      this.dropDown();
    });

    // Emits building-click to open React drawer (if centerpiece is clicked and not dragging)
    this.block.on('pointerup', (pointer) => {
      if (scene.isDragging || !pointer.wasTouch && pointer.button !== 0) return;
      if (isCenterpiece) {
        scene.game.events.emit('building-click', tileData);
      }
    });

    // Z-ordering: Depth sorted back-to-front by grid distance
    const depth = tileData.row + tileData.col;
    this.setDepth(depth);

    // Add this container to the active scene
    scene.add.existing(this);
  }

  /**
   * Rises all visual content group elements upwards and scales down the shadow
   */
  liftUp() {
    this.scene.tweens.killTweensOf([this.contentGroup, this.shadow]);

    // Elevate content group by 8 pixels (easing Back.easeOut for a springy feel)
    this.scene.tweens.add({
      targets: this.contentGroup,
      y: -8,
      duration: 180,
      ease: 'Back.easeOut'
    });

    // Shrink and fade ground shadow to simulate height elevation
    this.scene.tweens.add({
      targets: this.shadow,
      scaleX: 0.8,
      scaleY: 0.8,
      alpha: 0.15,
      duration: 180,
      ease: 'Back.easeOut'
    });
  }

  /**
   * Drops the content group back to the ground plane
   */
  dropDown() {
    this.scene.tweens.killTweensOf([this.contentGroup, this.shadow]);

    // Lower visual content back to zero plane
    this.scene.tweens.add({
      targets: this.contentGroup,
      y: 0,
      duration: 180,
      ease: 'Back.easeOut'
    });

    // Restore shadow size and opacity
    this.scene.tweens.add({
      targets: this.shadow,
      scaleX: 1.0,
      scaleY: 1.0,
      alpha: 0.6,
      duration: 180,
      ease: 'Back.easeOut'
    });
  }
}
