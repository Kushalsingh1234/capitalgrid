import Phaser from 'phaser';
import BaseBuilding from './BaseBuilding';

export default class ElectronicsCampusBuilding extends BaseBuilding {
  drawStructure() {
    const g = this.graphics;
    const w = this.width;
    const h = this.height;

    g.clear();

    // 1. Sleek corporate campus base (with pathways and lawns)
    g.fillStyle(0xe2e8f0, 0.45); // light concrete grey campus floor
    g.fillRoundedRect(-w / 2, -h / 2, w, h, 8);

    // Green grass lawn zones
    g.fillStyle(0x81c784, 0.7); // clean grass green
    g.fillRoundedRect(-w / 2.2, -h / 2.2, w * 0.4, h * 0.35, 6);
    g.fillRoundedRect(w / 12, h / 12, w * 0.35, h * 0.3, 6);

    // Pathways
    g.lineStyle(3, 0xffffff, 0.95);
    g.lineBetween(-w / 4, -h / 12, w / 4, -h / 12);
    g.lineBetween(0, -h / 2.2, 0, h / 2.2);

    // 2. Cleanroom Industrial block (left side)
    const crX = -w / 2.3;
    const crY = h / 24;
    const crW = w * 0.45;
    const crH = h * 0.38;
    // Shadow
    g.fillStyle(0x0a100c, 0.2);
    g.fillRect(crX + 3, crY + 3, crW, crH);
    // Building structure (sleek scientific white)
    g.fillStyle(0xf8fafc, 1);
    g.fillRect(crX, crY, crW, crH);
    g.lineStyle(1.5, 0xcbd5e1, 1);
    g.strokeRect(crX, crY, crW, crH);
    // High-tech yellow piping conduits on the roof
    g.lineStyle(2, 0xfdd835, 1); // bright yellow pipe
    g.lineBetween(crX + 10, crY + 6, crX + crW - 10, crY + 6);
    g.lineBetween(crX + 25, crY + 6, crX + 25, crY + crH - 12);

    // 3. Glass Office Building Skyscraper (right side)
    const ofX = w / 12;
    const ofY = -h / 2.3;
    const ofW = w * 0.38;
    const ofH = h * 0.58;
    // Shadow
    g.fillStyle(0x0a100c, 0.2);
    g.fillRect(ofX + 3, ofY + 3, ofW, ofH);
    // Core structure (sleek blue/grey)
    g.fillStyle(0x37474f, 1);
    g.fillRect(ofX, ofY, ofW, ofH);
    // Translucent blue glass curtain wall panels
    g.fillStyle(0x00b0ff, 0.45); // glass blue panels
    g.fillRect(ofX + 3, ofY + 3, ofW - 6, ofH - 6);
    
    // Grid horizontal floor lines
    g.lineStyle(1.2, 0xe0f7fa, 0.3);
    for (let fy = ofY + 12; fy < ofY + ofH; fy += 14) {
      g.lineBetween(ofX + 3, fy, ofX + ofW - 3, fy);
    }
  }

  initAnimation() {
    // Signature Animation: Blinking office campus windows (random panels glowing yellow/cyan)
    const scene = this.scene;
    const w = this.width;
    const h = this.height;

    // Glass tower positions
    const ofX = w / 12;
    const ofY = -h / 2.3;
    const ofW = w * 0.38;
    const ofH = h * 0.58;

    this.windowNodes = [];
    
    // Create a grid of small windows that can glow
    const cols = 3;
    const rows = 4;
    const colStep = (ofW - 10) / cols;
    const rowStep = (ofH - 10) / rows;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const wx = ofX + 5 + c * colStep + colStep / 4;
        const wy = ofY + 5 + r * rowStep + rowStep / 4;

        // Create window node graphics
        const win = scene.add.graphics({ x: wx, y: wy });
        
        // Glow panel (yellow or cyan)
        const glowColor = (r + c) % 2 === 0 ? 0xffeb3b : 0x00e5ff;
        win.fillStyle(glowColor, 0.95);
        win.fillRect(0, 0, colStep / 2, rowStep / 2);
        
        // Outer halo
        win.fillStyle(glowColor, 0.3);
        win.fillRect(-1.5, -1.5, colStep / 2 + 3, rowStep / 2 + 3);

        this.contentContainer.add(win);
        this.windowNodes.push(win);

        // Initial state (some on, some off)
        win.setAlpha(Math.random() > 0.4 ? 1.0 : 0.0);
      }
    }

    // Set up a repeating timer event to randomly blink individual windows
    this.blinkTimer = scene.time.addEvent({
      delay: 500,
      callback: () => {
        if (!this.windowNodes || this.windowNodes.length === 0) return;
        
        // Randomly pick 2-3 windows to toggle
        for (let i = 0; i < 3; i++) {
          const randWin = Phaser.Utils.Array.GetRandom(this.windowNodes);
          if (randWin) {
            scene.tweens.add({
              targets: randWin,
              alpha: randWin.alpha > 0.5 ? 0 : 1,
              duration: 300,
              ease: 'Sine.InOut'
            });
          }
        }
      },
      callbackScope: this,
      loop: true
    });
  }

  destroy(fromScene) {
    if (this.blinkTimer) {
      this.blinkTimer.remove();
    }
    if (this.windowNodes) {
      this.windowNodes.forEach(w => w.destroy());
    }
    super.destroy(fromScene);
  }
}
