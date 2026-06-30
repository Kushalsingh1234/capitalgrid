import BaseBuilding from './BaseBuilding';

export default class RetailBuilding extends BaseBuilding {
  drawStructure() {
    const g = this.graphics;
    const w = this.width;
    const h = this.height;

    g.clear();

    // 1. Paved parking lot ground base (dark asphalt)
    g.fillStyle(0x374151, 0.4); // dark asphalt base
    g.fillRoundedRect(-w / 2, -h / 2, w, h, 8);

    // 2. Customer Parking Spaces (bottom half)
    const parkY = h / 5;
    g.lineStyle(1.5, 0xffeb3b, 0.45); // yellow parking grids
    g.lineBetween(-w / 2.3, parkY, w / 2.3, parkY);
    for (let px = -w / 2.3; px < w / 2.3; px += 24) {
      g.lineBetween(px, parkY, px, parkY + h * 0.22);
      
      // Draw tiny customer cars
      if ((px + 12) % 48 === 0) {
        g.fillStyle((px + 12) % 96 === 0 ? 0x00e676 : 0xff1744, 1); // green or red sporty car
        g.fillRect(px + 4, parkY + 3, 15, 20);
        g.fillStyle(0x212121, 0.7); // car wind-shield
        g.fillRect(px + 5, parkY + 5, 13, 4);
      }
    }

    // 3. Back Service Delivery Entrance
    const backX = -w / 2.3;
    const backY = -h / 2.5;
    g.fillStyle(0x1f2937, 1); // metal loading door
    g.fillRect(backX, backY, 14, 18);
    g.lineStyle(1.2, 0x4b5563, 1);
    g.strokeRect(backX, backY, 14, 18);

    // 4. Commercial Storefront Building (center-top)
    const storeX = -w / 2.5;
    const storeY = -h / 3;
    const storeW = w * 0.8;
    const storeH = h * 0.45;
    
    // Shadow
    g.fillStyle(0x0a100c, 0.2);
    g.fillRect(storeX + 3, storeY + 3, storeW, storeH);
    // Walls (modern navy blue facade)
    g.fillStyle(0x1a237e, 1);
    g.fillRect(storeX, storeY, storeW, storeH);
    g.lineStyle(2, 0x0d47a1, 1);
    g.strokeRect(storeX, storeY, storeW, storeH);

    // Large glass display windows (warm interior yellow glow)
    g.fillStyle(0xfff59d, 0.95);
    const winW = w * 0.26;
    const winH = h * 0.22;
    const winY = storeY + h * 0.16;
    g.fillRect(storeX + 12, winY, winW, winH);
    g.fillRect(storeX + storeW - 12 - winW, winY, winW, winH);

    // Glass frames
    g.lineStyle(1.5, 0x3e2723, 0.8);
    g.strokeRect(storeX + 12, winY, winW, winH);
    g.strokeRect(storeX + storeW - 12 - winW, winY, winW, winH);

    // Store center door (double glass doors)
    g.fillStyle(0xeeeeee, 0.9);
    g.fillRect(storeX + storeW / 2 - 12, winY - 2, 24, winH + 2);
    g.lineStyle(1.5, 0x3e2723, 0.8);
    g.strokeRect(storeX + storeW / 2 - 12, winY - 2, 24, winH + 2);
    g.lineBetween(storeX + storeW / 2, winY - 2, storeX + storeW / 2, winY + winH);

    // Striped Fabric Awning (red & white stripes)
    const awnY = winY - 6;
    const awnW = storeW - 8;
    const awnH = 10;
    const awnX = storeX + 4;
    g.fillStyle(0xd50000, 1); // red base
    g.fillRect(awnX, awnY, awnW, awnH);
    g.fillStyle(0xffffff, 1); // white stripes
    for (let ax = awnX + 6; ax < awnX + awnW; ax += 16) {
      g.fillRect(ax, awnY, 8, awnH);
    }
    // Awning border shadow
    g.lineStyle(1.5, 0x9e0000, 1);
    g.lineBetween(awnX, awnY + awnH, awnX + awnW, awnY + awnH);
  }

  initAnimation() {
    // Signature Animation: Glowing storefront neon sign (pulsing sign color/alpha)
    const scene = this.scene;
    const storeX = -this.width / 2.5;
    const storeY = -this.height / 3;
    const storeW = this.width * 0.8;
    
    // Position sign centered above the awning
    const signX = storeX + storeW / 2;
    const signY = storeY + 12;

    // Create sign graphics inside the contentContainer
    this.neonSign = scene.add.graphics({ x: signX, y: signY });
    
    // Draw sign backing box
    this.neonSign.fillStyle(0x212121, 1);
    this.neonSign.fillRoundedRect(-24, -7, 48, 14, 3);
    this.neonSign.lineStyle(1, 0x37474f, 1);
    this.neonSign.strokeRoundedRect(-24, -7, 48, 14, 3);

    // Draw glowing neon letters / bar
    this.neonSign.lineStyle(2, 0xff007f, 1); // hot pink neon color
    this.neonSign.strokeRoundedRect(-20, -4, 40, 8, 2);
    
    // Outer neon glow
    this.neonGlow = scene.add.graphics({ x: signX, y: signY });
    this.neonGlow.lineStyle(4, 0xff007f, 0.4);
    this.neonGlow.strokeRoundedRect(-20, -4, 40, 8, 2);
    this.neonGlow.fillStyle(0xff007f, 0.15);
    this.neonGlow.fillRoundedRect(-20, -4, 40, 8, 2);

    this.contentContainer.add(this.neonSign);
    this.contentContainer.add(this.neonGlow);

    // Neon pulsing animation
    scene.tweens.add({
      targets: this.neonGlow,
      alpha: { from: 0.8, to: 0.15 },
      scaleX: { from: 1.05, to: 0.95 },
      scaleY: { from: 1.05, to: 0.95 },
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.InOut'
    });
  }

  destroy(fromScene) {
    if (this.neonSign) {
      this.neonSign.destroy();
    }
    if (this.neonGlow) {
      this.neonGlow.destroy();
    }
    super.destroy(fromScene);
  }
}
