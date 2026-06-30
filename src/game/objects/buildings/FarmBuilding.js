import BaseBuilding from './BaseBuilding';

export default class FarmBuilding extends BaseBuilding {
  drawStructure() {
    const g = this.graphics;
    const w = this.width;
    const h = this.height;

    g.clear();

    // 1. Base pasture zone
    g.fillStyle(0x558b2f, 0.4); // light soil green base
    g.fillRoundedRect(-w / 2, -h / 2, w, h, 8);

    // 2. Tractor Path (dirt loop)
    g.lineStyle(10, 0x8d6e63, 0.5); // brown dirt track
    g.strokeRoundedRect(-w / 2.5, -h / 2.5, w * 0.8, h * 0.8, 12);

    // 3. Crop Fields Base (grid patches)
    g.fillStyle(0x7cb342, 0.955); // rich soil color
    
    // Left crop field
    g.fillRect(-w / 2.6, h / 8, w * 0.35, h * 0.28);
    // Right crop field
    g.fillRect(w / 12, h / 8, w * 0.35, h * 0.28);

    // Crop rows detail
    g.lineStyle(1.5, 0x33691e, 0.45);
    for (let xOffset = -w / 2.6 + 5; xOffset < -w / 2.6 + w * 0.35; xOffset += 10) {
      g.lineBetween(xOffset, h / 8, xOffset, h / 8 + h * 0.28);
    }
    for (let xOffset = w / 12 + 5; xOffset < w / 12 + w * 0.35; xOffset += 10) {
      g.lineBetween(xOffset, h / 8, xOffset, h / 8 + h * 0.28);
    }

    // 4. Farmhouse
    // Shadow
    g.fillStyle(0x0a100c, 0.2);
    g.fillRect(w / 6 + 3, -h / 3 + 3, 35, 30);
    // Walls (light cream)
    g.fillStyle(0xfff9c4, 1);
    g.fillRect(w / 6, -h / 3, 35, 30);
    // Slanted Roof (terracotta orange)
    g.fillStyle(0xd84315, 1);
    g.fillTriangle(w / 6 - 5, -h / 3, w / 6 + 17.5, -h / 3 - 15, w / 6 + 40, -h / 3);
    // Door (brown)
    g.fillStyle(0x5d4037, 1);
    g.fillRect(w / 6 + 14, -h / 3 + 18, 7, 12);
    // Window (glass blue)
    g.fillStyle(0x80deea, 1);
    g.fillRect(w / 6 + 5, -h / 3 + 6, 8, 8);
    g.fillRect(w / 6 + 22, -h / 3 + 6, 8, 8);

    // 5. Grain Silo
    const siloX = -w / 3.5;
    const siloY = -h / 4;
    // Shadow
    g.fillStyle(0x0a100c, 0.2);
    g.fillRect(siloX - 10 + 3, siloY - 20 + 3, 20, 36);
    // Cylinder body (silver metallic gray)
    g.fillStyle(0xb0bec5, 1);
    g.fillRect(siloX - 10, siloY - 20, 20, 36);
    // Silo dome cap (metallic dark gray)
    g.fillStyle(0x78909c, 1);
    g.fillEllipse(siloX, siloY - 20, 20, 12);
    // Silo lines/banding
    g.lineStyle(1.5, 0x455a64, 0.6);
    g.lineBetween(siloX - 10, siloY - 8, siloX + 10, siloY - 8);
    g.lineBetween(siloX - 10, siloY + 4, siloX + 10, siloY + 4);
    // Silo ladder
    g.lineStyle(1, 0x37474f, 0.5);
    g.lineBetween(siloX - 6, siloY - 20, siloX - 6, siloY + 16);
    g.lineBetween(siloX - 4, siloY - 20, siloX - 4, siloY + 16);
    for (let ly = siloY - 18; ly < siloY + 16; ly += 5) {
      g.lineBetween(siloX - 6, ly, siloX - 4, ly);
    }

    // 6. Landscaping (small tree props inside the container)
    this.drawSmallTree(g, -w / 2.5, -h / 25);
    this.drawSmallTree(g, w / 2.5, -h / 25);
  }

  drawSmallTree(g, tx, ty) {
    // Trunk
    g.fillStyle(0x4e342e, 1);
    g.fillRect(tx - 2, ty, 4, 8);
    // Foliage
    g.fillStyle(0x1b5e20, 1);
    g.fillCircle(tx, ty - 4, 8);
    g.fillStyle(0x388e3c, 1);
    g.fillCircle(tx - 2, ty - 6, 5);
  }

  initAnimation() {
    // Signature Animation: Waving crops (using procedural crop leaf instances)
    this.cropSprouts = [];
    const sproutCount = 16;
    const w = this.width;
    const h = this.height;

    // Distribute sprouts inside the two crop fields
    const scene = this.scene;

    // Field 1 boundaries
    const f1XStart = -w / 2.6;
    const f1XEnd = -w / 2.6 + w * 0.35;
    const fYStart = h / 8;
    const fYEnd = h / 8 + h * 0.28;

    // Field 2 boundaries
    const f2XStart = w / 12;
    const f2XEnd = w / 12 + w * 0.35;

    for (let i = 0; i < sproutCount; i++) {
      const isField1 = i < sproutCount / 2;
      const xStart = isField1 ? f1XStart : f2XStart;
      const xEnd = isField1 ? f1XEnd : f2XEnd;

      const px = xStart + (Math.random() * (xEnd - xStart - 6)) + 3;
      const py = fYStart + (Math.random() * (fYEnd - fYStart - 6)) + 3;

      // Draw a tiny crop sprout graphics inside contentContainer
      const crop = scene.add.graphics({ x: px, y: py });
      crop.fillStyle(0x9ccc65, 1); // bright green leaf
      crop.fillTriangle(-2, 0, 0, -5, 2, 0);
      crop.fillTriangle(-1, 0, 2, -4, 4, 0);

      this.contentContainer.add(crop);
      this.cropSprouts.push(crop);
    }

    // Tween the crop sprouts to wave left-right
    this.cropSprouts.forEach((crop, idx) => {
      scene.tweens.add({
        targets: crop,
        angle: { from: -8, to: 8 },
        duration: 1200 + (idx % 4) * 150,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.InOut',
        delay: idx * 80
      });
    });
  }

  destroy(fromScene) {
    if (this.cropSprouts) {
      this.cropSprouts.forEach(c => c.destroy());
    }
    super.destroy(fromScene);
  }
}
