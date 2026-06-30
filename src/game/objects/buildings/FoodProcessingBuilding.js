import BaseBuilding from './BaseBuilding';

export default class FoodProcessingBuilding extends BaseBuilding {
  drawStructure() {
    const g = this.graphics;
    const w = this.width;
    const h = this.height;

    g.clear();

    // 1. Paved concrete yard base
    g.fillStyle(0x90a4ae, 0.35); // paved grey floor
    g.fillRoundedRect(-w / 2, -h / 2, w, h, 8);

    // 2. Large Storage Warehouse Block (back of plant)
    const whX = -w / 2.3;
    const whY = -h / 2.5;
    const whW = w * 0.45;
    const whH = h * 0.42;
    // Shadow
    g.fillStyle(0x0a100c, 0.2);
    g.fillRect(whX + 3, whY + 3, whW, whH);
    // Building structure (dark steel grey)
    g.fillStyle(0x455a64, 1);
    g.fillRect(whX, whY, whW, whH);
    // Vertical corrugated lines
    g.lineStyle(1.5, 0x37474f, 0.5);
    for (let lx = whX + 8; lx < whX + whW; lx += 12) {
      g.lineBetween(lx, whY, lx, whY + whH);
    }

    // 3. Processing Plant Hall (main building with blue roof)
    const hallX = -w / 12;
    const hallY = -h / 4;
    const hallW = w * 0.5;
    const hallH = h * 0.55;
    // Shadow
    g.fillStyle(0x0a100c, 0.2);
    g.fillRect(hallX + 3, hallY + 3, hallW, hallH);
    // Walls (clean cream-white)
    g.fillStyle(0xfafafa, 1);
    g.fillRect(hallX, hallY, hallW, hallH);
    // Horizontal highlight strip
    g.fillStyle(0x0288d1, 1); // bright hygienic blue strip
    g.fillRect(hallX, hallY + hallH - 12, hallW, 5);
    // Flat blue roof cap
    g.fillStyle(0x1976d2, 1);
    g.fillRect(hallX - 3, hallY - 4, hallW + 6, 8);

    // 4. Delivery Dock & Service Ramp
    const dockX = -w / 2.3;
    const dockY = h / 8;
    // Paved bay area
    g.fillStyle(0x37474f, 0.85); // asphalt dark pit
    g.fillRect(dockX, dockY, w * 0.38, h * 0.28);
    // Yellow hazard lines
    g.lineStyle(1.5, 0xffca28, 0.8);
    for (let lx = dockX + 4; lx < dockX + w * 0.38; lx += 15) {
      g.lineBetween(lx, dockY, lx + 6, dockY + 4);
    }
    // Delivery trailer parked at dock
    g.fillStyle(0xffffff, 1);
    g.fillRect(dockX + 10, dockY + 4, 18, 22);
    g.fillStyle(0x212121, 1); // truck wheels
    g.fillCircle(dockX + 13, dockY + 26, 3);
    g.fillCircle(dockX + 25, dockY + 26, 3);

    // 5. Utility Piping System on roof (food processing conduits)
    g.lineStyle(2, 0xe0e0e0, 1);
    g.lineBetween(hallX + 15, hallY + 10, hallX + 15, hallY - 14);
    g.lineBetween(hallX + 15, hallY - 14, hallX + 45, hallY - 14);
    g.lineBetween(hallX + 45, hallY - 14, hallX + 45, hallY + 10);
  }

  initAnimation() {
    // Signature Animation: Spinning rooftop exhaust vent fan
    const scene = this.scene;
    const hallX = -this.width / 12;
    const hallY = -this.height / 4;
    
    // Position of the vent on the processing plant roof
    const ventX = hallX + this.width * 0.28;
    const ventY = hallY + 15;

    // Draw the static vent background/ring
    this.graphics.fillStyle(0x212121, 1); // dark interior cavity
    this.graphics.fillCircle(ventX, ventY, 7);
    this.graphics.lineStyle(1.5, 0xb0bec5, 1); // metallic outer casing ring
    this.graphics.strokeCircle(ventX, ventY, 7);

    // Create the rotating fan blades graphics inside the contentContainer
    this.fanBlades = scene.add.graphics({ x: ventX, y: ventY });
    
    // Draw 3 fan blades (line shapes radiating from center)
    this.fanBlades.lineStyle(2.2, 0x90a4ae, 1);
    this.fanBlades.lineBetween(0, 0, 0, -5);
    this.fanBlades.lineBetween(0, 0, 4.3, 2.5);
    this.fanBlades.lineBetween(0, 0, -4.3, 2.5);

    this.contentContainer.add(this.fanBlades);

    // Continuous rotation tween
    scene.tweens.add({
      targets: this.fanBlades,
      angle: 360,
      duration: 1200,
      repeat: -1,
      ease: 'Linear'
    });
  }

  destroy(fromScene) {
    if (this.fanBlades) {
      this.fanBlades.destroy();
    }
    super.destroy(fromScene);
  }
}
