import BaseBuilding from './BaseBuilding';

export default class ConstructionBuilding extends BaseBuilding {
  drawStructure() {
    const g = this.graphics;
    const w = this.width;
    const h = this.height;

    g.clear();

    // 1. Excavated construction site base (dirt/gravel mixture)
    g.fillStyle(0x8d6e63, 0.45); // dirt brown base
    g.fillRoundedRect(-w / 2, -h / 2, w, h, 8);

    // 2. Concrete plant mixing silos (cement plant)
    const plantX = -w / 3.5;
    const plantY = -h / 4;
    // Structural legs
    g.lineStyle(2, 0x455a64, 1);
    g.lineBetween(plantX - 12, plantY, plantX - 12, plantY + 36);
    g.lineBetween(plantX + 12, plantY, plantX + 12, plantY + 36);
    g.lineBetween(plantX, plantY, plantX, plantY + 36);
    // Cylindrical mixing silo (light gray)
    g.fillStyle(0xcfd8dc, 1);
    g.fillRect(plantX - 15, plantY - 20, 30, 35);
    // Funnel bottom
    g.fillStyle(0x90a4ae, 1);
    g.fillTriangle(plantX - 15, plantY + 15, plantX + 15, plantY + 15, plantX, plantY + 28);
    // Silo dome
    g.fillStyle(0x78909c, 1);
    g.fillEllipse(plantX, plantY - 20, 30, 10);

    // 3. Storage Yard stacks (pipes & structural iron girders)
    const yardX = -w / 3.2;
    const yardY = h / 6;
    // Pipe stacks (circles)
    g.fillStyle(0xa1887f, 1); // rusty pipes
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 4; c++) {
        g.fillCircle(yardX + c * 10, yardY + r * 8, 4);
        g.lineStyle(0.8, 0x3e2723, 0.7);
        g.strokeCircle(yardX + c * 10, yardY + r * 8, 4);
      }
    }
    // Steel girders stack (gray/blue metallic bars)
    g.fillStyle(0x546e7a, 1);
    g.fillRect(yardX + 50, yardY - 8, 45, 8);
    g.fillRect(yardX + 53, yardY, 45, 8);
    g.fillRect(yardX + 48, yardY + 8, 45, 8);
    g.lineStyle(1, 0x263238, 0.45);
    g.strokeRect(yardX + 50, yardY - 8, 45, 8);
    g.strokeRect(yardX + 53, yardY, 45, 8);
    g.strokeRect(yardX + 48, yardY + 8, 45, 8);

    // 4. Construction crane structure
    // We position the crane base on the right side
    const craneX = w / 4;
    const craneY = -h / 12;

    // Crane concrete foundation block
    g.fillStyle(0x78909c, 1);
    g.fillRect(craneX - 14, craneY + 26, 28, 12);
    g.lineStyle(1.5, 0x455a64, 1);
    g.strokeRect(craneX - 14, craneY + 26, 28, 12);

    // Vertical truss mast (yellow lattice structure)
    g.lineStyle(2, 0xffb300, 1); // construction yellow
    g.lineBetween(craneX - 5, craneY - 45, craneX - 5, craneY + 26);
    g.lineBetween(craneX + 5, craneY - 45, craneX + 5, craneY + 26);
    // Truss cross-bracing diagonals
    for (let my = craneY + 20; my > craneY - 40; my -= 12) {
      g.lineBetween(craneX - 5, my, craneX + 5, my - 12);
      g.lineBetween(craneX + 5, my, craneX - 5, my - 12);
    }

    // Cab (yellow glass cockpit at the top of the mast)
    g.fillStyle(0xffb300, 1);
    g.fillRect(craneX - 9, craneY - 57, 18, 12);
    g.fillStyle(0x80deea, 0.7); // cockpit glass
    g.fillRect(craneX - 6, craneY - 54, 10, 6);

    // Horizontal Jib truss (spans left and right)
    // Left counterweight arm
    g.lineStyle(2, 0xffb300, 1);
    g.lineBetween(craneX - 25, craneY - 57, craneX, craneY - 57);
    g.fillStyle(0x37474f, 1); // counter-weight block
    g.fillRect(craneX - 22, craneY - 56, 12, 10);
    // Right long outreach jib
    g.lineBetween(craneX, craneY - 57, craneX + w * 0.45, craneY - 57);
    g.lineBetween(craneX, craneY - 51, craneX + w * 0.45, craneY - 57); // diagonal support truss
    for (let jx = craneX + 15; jx < craneX + w * 0.45; jx += 20) {
      g.lineBetween(jx, craneY - 57, jx, craneY - 51);
    }
  }

  initAnimation() {
    // Signature Animation: Blinking crane warning light (red blinking dot)
    const scene = this.scene;
    const craneX = this.width / 4;
    const craneY = -this.height / 12;
    
    // Position light at the tip of the crane mast
    const lightX = craneX;
    const lightY = craneY - 59;

    // Create the red warning light beacon graphics
    this.warningBeacon = scene.add.graphics({ x: lightX, y: lightY });
    
    // Inner bright red bulb
    this.warningBeacon.fillStyle(0xff1744, 1);
    this.warningBeacon.fillCircle(0, 0, 3);
    
    // Outer red glow
    this.warningBeacon.fillStyle(0xff1744, 0.4);
    this.warningBeacon.fillCircle(0, 0, 8);

    this.contentContainer.add(this.warningBeacon);

    // Blink tween (infinite fade in/out)
    scene.tweens.add({
      targets: this.warningBeacon,
      alpha: { from: 1, to: 0.1 },
      duration: 650,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.InOut'
    });
  }

  destroy(fromScene) {
    if (this.warningBeacon) {
      this.warningBeacon.destroy();
    }
    super.destroy(fromScene);
  }
}
