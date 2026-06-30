import BaseBuilding from './BaseBuilding';

export default class AutomobileFactoryBuilding extends BaseBuilding {
  drawStructure() {
    const g = this.graphics;
    const w = this.width;
    const h = this.height;

    g.clear();

    // 1. Concrete factory floor base
    g.fillStyle(0x78909c, 0.4); // light grey pavement
    g.fillRoundedRect(-w / 2, -h / 2, w, h, 8);

    // 2. Parking Lot details
    g.lineStyle(1.5, 0xffffff, 0.5); // white parking lines
    const pkX = -w / 2.3;
    const pkY = h / 4;
    g.lineBetween(pkX, pkY, pkX + w * 0.45, pkY);
    for (let px = pkX; px < pkX + w * 0.45; px += 18) {
      g.lineBetween(px, pkY, px, pkY + h * 0.18);
      
      // Draw tiny parked cars (colorful rectangles)
      if (px % 36 === 0) {
        g.fillStyle(px % 72 === 0 ? 0xd32f2f : 0x1976d2, 1); // red or blue car
        g.fillRect(px + 3, pkY + 4, 12, 18);
        g.fillStyle(0x212121, 0.7); // windshield
        g.fillRect(px + 4, pkY + 6, 10, 4);
      }
    }

    // 3. Security Gate
    const gateX = -w / 2.3;
    const gateY = -h / 12;
    // Guard shack (small white box)
    g.fillStyle(0xffffff, 1);
    g.fillRect(gateX, gateY - 6, 12, 12);
    g.fillStyle(0x0288d1, 0.6); // glass windows
    g.fillRect(gateX + 2, gateY - 4, 8, 4);
    // Gate arm (red/white stripes)
    g.lineStyle(2, 0xd32f2f, 1);
    g.lineBetween(gateX + 12, gateY, gateX + 32, gateY);
    g.lineStyle(2, 0xffffff, 1);
    g.lineBetween(gateX + 16, gateY, gateX + 20, gateY);
    g.lineBetween(gateX + 24, gateY, gateX + 28, gateY);

    // 4. Loading Bay & Delivery Truck
    const bayX = w / 4;
    const bayY = -h / 8;
    // Bay roller shutter door
    g.fillStyle(0x455a64, 1); // shutter gray
    g.fillRect(bayX - 10, bayY, 20, 24);
    g.lineStyle(1.5, 0xb0bec5, 0.6); // metal slats lines
    for (let sy = bayY + 4; sy < bayY + 24; sy += 5) {
      g.lineBetween(bayX - 10, sy, bayX + 10, sy);
    }
    // Truck parked
    // Shadow
    g.fillStyle(0x0a100c, 0.2);
    g.fillRect(bayX - 8 + 3, bayY + 12 + 3, 16, 26);
    // Trailer (white box)
    g.fillStyle(0xffffff, 1);
    g.fillRect(bayX - 8, bayY + 12, 16, 22);
    // Cab (red)
    g.fillStyle(0xd32f2f, 1);
    g.fillRect(bayX - 7, bayY + 34, 14, 6);
    // Windshield
    g.fillStyle(0x212121, 0.8);
    g.fillRect(bayX - 6, bayY + 37, 12, 2);

    // 5. Main Industrial Factory Hall
    const hallX = -w / 12;
    const hallY = -h / 6;
    const hallW = w / 2;
    const hallH = h / 2.2;
    // Shadow
    g.fillStyle(0x0a100c, 0.2);
    g.fillRect(hallX + 3, hallY + 3, hallW, hallH);
    // Walls (industrial corrugated metal blue)
    g.fillStyle(0x37474f, 1);
    g.fillRect(hallX, hallY, hallW, hallH);
    // Sawtooth Roof (three spikes)
    g.fillStyle(0x546e7a, 1);
    for (let rx = hallX; rx < hallX + hallW; rx += hallW / 3) {
      const step = hallW / 3;
      g.fillTriangle(rx, hallY, rx + step, hallY, rx + step, hallY - 14);
      // Skylight windows in sawtooth roof
      g.lineStyle(1, 0x80deea, 0.7);
      g.lineBetween(rx + step, hallY, rx + step, hallY - 10);
    }
    // Horizontal details
    g.lineStyle(2, 0x263238, 0.45);
    g.lineBetween(hallX, hallY + 15, hallX + hallW, hallY + 15);
    g.lineBetween(hallX, hallY + hallH - 15, hallX + hallW, hallY + hallH - 15);

    // 6. Two Smokestacks (Chimneys)
    const chimneyX1 = hallX + 15;
    const chimneyY = hallY;
    const chimneyX2 = hallX + 35;
    // Draw chimney columns
    g.fillStyle(0x263238, 1);
    g.fillRect(chimneyX1 - 5, chimneyY - 24, 10, 24);
    g.fillRect(chimneyX2 - 5, chimneyY - 24, 10, 24);
    // Steel banding lines
    g.lineStyle(1, 0xb0bec5, 0.4);
    g.lineBetween(chimneyX1 - 5, chimneyY - 8, chimneyX1 + 5, chimneyY - 8);
    g.lineBetween(chimneyX1 - 5, chimneyY - 16, chimneyX1 + 5, chimneyY - 16);
    g.lineBetween(chimneyX2 - 5, chimneyY - 8, chimneyX2 + 5, chimneyY - 8);
    g.lineBetween(chimneyX2 - 5, chimneyY - 16, chimneyX2 + 5, chimneyY - 16);
  }

  initAnimation() {
    // Signature Animation: Chimney Smoke (rising/fading procedural particles)
    const scene = this.scene;
    const hallX = -this.width / 12;
    const chimneyY = -this.height / 6 - 24;
    const chimneyX1 = hallX + 15;
    const chimneyX2 = hallX + 35;

    this.smokePuffGroup = [];
    const puffCount = 6;

    // Initialize smoke puff elements
    for (let i = 0; i < puffCount; i++) {
      const puff = scene.add.graphics();
      puff.fillStyle(0xb0bec5, 0.6); // grey translucent smoke
      puff.fillCircle(0, 0, 4);
      
      this.contentContainer.add(puff);
      this.smokePuffGroup.push(puff);

      // Distribute puffs between the two stacks
      const emitterX = i % 2 === 0 ? chimneyX1 : chimneyX2;
      this.animateSmokePuff(puff, emitterX, chimneyY, i * 400);
    }
  }

  animateSmokePuff(puff, startX, startY, delay) {
    if (!this.scene) return;

    puff.x = startX;
    puff.y = startY;
    puff.alpha = 0.65;
    puff.scaleX = 1.0;
    puff.scaleY = 1.0;

    this.scene.tweens.add({
      targets: puff,
      x: startX + 18 + Math.random() * 12, // drift to the right
      y: startY - 35 - Math.random() * 15, // rise upwards
      alpha: 0,
      scaleX: 2.8,
      scaleY: 2.8,
      duration: 2200,
      delay: delay,
      onComplete: () => {
        this.animateSmokePuff(puff, startX, startY, 0); // Loop
      }
    });
  }

  destroy(fromScene) {
    if (this.smokePuffGroup) {
      this.smokePuffGroup.forEach(p => p.destroy());
    }
    super.destroy(fromScene);
  }
}
