import Phaser from 'phaser';

export default class Road extends Phaser.GameObjects.Container {
  constructor(scene, roadData) {
    super(scene, 0, 0);
    this.roadData = roadData;
    this.type = roadData.type;

    // 1. Drop shadow graphics
    this.shadowGraphics = scene.add.graphics();
    this.add(this.shadowGraphics);

    // 2. Main road surface graphics
    this.roadGraphics = scene.add.graphics();
    this.add(this.roadGraphics);

    this.drawRoad();
    scene.add.existing(this);
  }

  drawRoad() {
    const sg = this.shadowGraphics;
    const rg = this.roadGraphics;
    const r = this.roadData;

    // A. Draw Segment Shadow
    let shadowWidth = this.type === 'primary' ? 64 : 46;
    sg.lineStyle(shadowWidth, 0x081009, 0.35);
    sg.lineBetween(r.x1 + 4, r.y1 + 4, r.x2 + 4, r.y2 + 4);

    // B. Draw Curb/Shoulder Base
    const curbWidth = this.type === 'primary' ? 58 : 40;
    const curbColor = this.type === 'primary' ? 0x0f172a : 0x1f2937;
    rg.lineStyle(curbWidth, curbColor, 0.95);
    rg.lineBetween(r.x1, r.y1, r.x2, r.y2);

    // C. Draw Asphalt Lane
    const asphaltWidth = this.type === 'primary' ? 52 : 34;
    const asphaltColor = this.type === 'primary' ? 0x1e293b : 0x374151;
    rg.lineStyle(asphaltWidth, asphaltColor, 1);
    rg.lineBetween(r.x1, r.y1, r.x2, r.y2);

    // D. Draw Road Markings
    if (this.type === 'primary') {
      // Double Yellow arterial line markings
      rg.lineStyle(1.5, 0xf59e0b, 0.7);
      const angle = Phaser.Math.Angle.Between(r.x1, r.y1, r.x2, r.y2);
      const dx = Math.sin(angle) * 2;
      const dy = Math.cos(angle) * 2;

      rg.lineBetween(r.x1 - dx, r.y1 + dy, r.x2 - dx, r.y2 + dy);
      rg.lineBetween(r.x1 + dx, r.y1 - dy, r.x2 + dx, r.y2 - dy);
    } else {
      // Dashed lane divider lines
      rg.lineStyle(2, 0x9ca3af, 0.55);
      const length = Phaser.Math.Distance.Between(r.x1, r.y1, r.x2, r.y2);
      const steps = Math.floor(length / 20);
      const angle = Phaser.Math.Angle.Between(r.x1, r.y1, r.x2, r.y2);
      const dx = Math.cos(angle);
      const dy = Math.sin(angle);

      for (let i = 0; i < steps; i++) {
        const startX = r.x1 + dx * (i * 20);
        const startY = r.y1 + dy * (i * 20);
        const endX = r.x1 + dx * (i * 20 + 10);
        const endY = r.y1 + dy * (i * 20 + 10);
        rg.lineBetween(startX, startY, endX, endY);
      }
    }
  }
}
