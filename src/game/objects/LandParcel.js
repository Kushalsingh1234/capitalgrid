import Phaser from 'phaser';

export default class LandParcel extends Phaser.GameObjects.Container {
  constructor(scene, plotData) {
    super(scene, plotData.x, plotData.y);
    this.plotData = plotData;
    this.plotId = plotData.id;
    this.width = plotData.width;
    this.height = plotData.height;

    const halfW = this.width / 2;
    const halfH = this.height / 2;

    // 1. Base drop shadow
    this.shadow = scene.add.graphics();
    this.shadow.fillStyle(0x0a100c, 0.45);
    this.shadow.fillRoundedRect(-halfW + 3, -halfH + 3, this.width, this.height, 8);
    this.add(this.shadow);

    // 2. Main graphics container
    this.graphics = scene.add.graphics();
    this.add(this.graphics);

    this.drawParcel();
    scene.add.existing(this);
  }

  drawParcel() {
    const halfW = this.width / 2;
    const halfH = this.height / 2;
    const g = this.graphics;
    g.clear();

    // A. Grass terrain base inside the parcel (slightly darker and richer tone to pop)
    g.fillStyle(0x1e4620, 1);
    g.fillRoundedRect(-halfW, -halfH, this.width, this.height, 8);

    // B. Gravel overlay for construction readiness
    g.fillStyle(0xd7ccc8, 0.14);
    g.fillRoundedRect(-halfW + 8, -halfH + 8, this.width - 16, this.height - 16, 6);

    // Subtle construction grid lines inside the empty parcel
    g.lineStyle(1, 0xffffff, 0.05);
    const step = 20;
    for (let x = -halfW + step; x < halfW - 8; x += step) {
      g.strokeLineShape(new Phaser.Geom.Line(x, -halfH + 8, x, halfH - 8));
    }
    for (let y = -halfH + step; y < halfH - 8; y += step) {
      g.strokeLineShape(new Phaser.Geom.Line(-halfW + 8, y, halfW - 8, y));
    }

    // C. Strong stone/concrete border
    g.lineStyle(3, 0x475569, 1); // Slate gray concrete curb
    g.strokeRoundedRect(-halfW, -halfH, this.width, this.height, 8);

    // D. White highlight on top-left edges
    g.lineStyle(1.5, 0xffffff, 0.25);
    g.strokeLineShape(new Phaser.Geom.Line(-halfW + 4, -halfH, halfW - 4, -halfH));
    g.strokeLineShape(new Phaser.Geom.Line(-halfW, -halfH + 4, -halfW, halfH - 4));
  }

  /**
   * Returns the world space anchor coordinates for attaching buildings.
   * @returns {Object} { x, y }
   */
  getAnchorPoint() {
    const offset = this.plotData.anchorOffset || { x: 0, y: 0 };
    return {
      x: this.x + offset.x,
      y: this.y + offset.y
    };
  }
}
