import BaseBuilding from './BaseBuilding';

export default class GarmentBuilding extends BaseBuilding {
  drawStructure() {
    const g = this.graphics;
    const w = this.width;
    const h = this.height;

    g.clear();

    // 1. Concrete courtyard base
    g.fillStyle(0x78909c, 0.35); // concrete base
    g.fillRoundedRect(-w / 2, -h / 2, w, h, 8);

    // 2. Paved Delivery Area/Loading Zone
    const delX = w / 4;
    const delY = h / 6;
    g.fillStyle(0x455a64, 0.9); // paved asphalt zone
    g.fillRect(delX - 25, delY - 15, 45, 30);
    // Hatch lines
    g.lineStyle(1.5, 0xffca28, 0.55); // safety stripes
    g.lineBetween(delX - 25, delY + 15, delX + 20, delY + 15);
    g.lineBetween(delX - 25, delY - 15, delX - 25, delY + 15);
    g.lineBetween(delX + 20, delY - 15, delX + 20, delY + 15);

    // 3. Main Textile Mill (vintage red brick factory)
    const millX = -w / 2.3;
    const millY = -h / 2.3;
    const millW = w * 0.65;
    const millH = h * 0.72;
    // Shadow
    g.fillStyle(0x0a100c, 0.2);
    g.fillRect(millX + 3, millY + 3, millW, millH);
    // Walls (brick red/brown tone)
    g.fillStyle(0xa73a3a, 1);
    g.fillRect(millX, millY, millW, millH);
    // Darker brick outline details
    g.lineStyle(2, 0x5c1d1d, 1);
    g.strokeRect(millX, millY, millW, millH);

    // Rows of large factory multi-pane windows (blue-green glass)
    g.fillStyle(0x80deea, 0.8);
    const winW = 12;
    const winH = 16;
    for (let wy = millY + 10; wy < millY + millH - 20; wy += 28) {
      for (let wx = millX + 12; wx < millX + millW - 15; wx += 24) {
        g.fillRect(wx, wy, winW, winH);
        
        // Window grids
        g.lineStyle(0.8, 0x006064, 0.45);
        g.lineBetween(wx + winW / 2, wy, wx + winW / 2, wy + winH);
        g.lineBetween(wx, wy + winH / 2, wx + winW, wy + winH / 2);
      }
    }

    // 4. Large brick smokestack/chimney next to mill
    const stackX = millX + millW + 14;
    const stackY = millY + millH - 20;
    // Shadow
    g.fillStyle(0x0a100c, 0.2);
    g.fillRect(stackX - 6 + 3, stackY - 60 + 3, 12, 60);
    // Brick column
    g.fillStyle(0x8d4f4f, 1);
    g.fillRect(stackX - 6, stackY - 60, 12, 60);
    g.lineStyle(1.5, 0x5c1d1d, 1);
    g.strokeRect(stackX - 6, stackY - 60, 12, 60);
    // Metallic collar on top
    g.fillStyle(0x37474f, 1);
    g.fillRect(stackX - 8, stackY - 60, 16, 4);
  }

  initAnimation() {
    // Signature Animation: Spinning rooftop ventilator turbine
    const scene = this.scene;
    const millX = -this.width / 2.3;
    const millY = -this.height / 2.3;
    const millW = this.width * 0.65;
    
    // Position on mill roof
    const ventX = millX + millW / 2;
    const ventY = millY + 10;

    // Draw ventilator duct base
    this.graphics.fillStyle(0xb0bec5, 1); // galvanized steel base
    this.graphics.fillRect(ventX - 5, ventY - 4, 10, 4);

    // Create the spinning turbine head inside the contentContainer
    this.ventTurbine = scene.add.graphics({ x: ventX, y: ventY - 6 });
    
    // Draw round ventilator hood
    this.ventTurbine.fillStyle(0xcfd8dc, 1);
    this.ventTurbine.fillCircle(0, 0, 5);
    
    // Draw slatted turbine lines
    this.ventTurbine.lineStyle(1.2, 0x78909c, 1);
    this.ventTurbine.lineBetween(-4, 0, 4, 0);
    this.ventTurbine.lineBetween(0, -4, 0, 4);
    this.ventTurbine.lineBetween(-3, -3, 3, 3);
    this.ventTurbine.lineBetween(3, -3, -3, 3);

    this.contentContainer.add(this.ventTurbine);

    // Rotate tween (continuous rotation)
    scene.tweens.add({
      targets: this.ventTurbine,
      angle: 360,
      duration: 1500,
      repeat: -1,
      ease: 'Linear'
    });
  }

  destroy(fromScene) {
    if (this.ventTurbine) {
      this.ventTurbine.destroy();
    }
    super.destroy(fromScene);
  }
}
