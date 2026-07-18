import Phaser from 'phaser';

export default class Decoration extends Phaser.GameObjects.Container {
  constructor(scene, x, y, type) {
    super(scene, x, y);
    this.type = type;

    // 1. Soft shadow layer
    this.shadowGraphics = scene.add.graphics();
    this.add(this.shadowGraphics);

    // 2. Main structure graphics
    this.graphics = scene.add.graphics();
    this.add(this.graphics);

    this.drawDecoration();
    scene.add.existing(this);
  }

  drawDecoration() {
    const s = this.shadowGraphics;
    const g = this.graphics;

    s.clear();
    g.clear();

    switch (this.type) {
      case 'tree':
        // Tree foliage drop shadow
        s.fillStyle(0x0a140a, 0.4);
        s.fillEllipse(0, 6, 12, 6);

        // Trunk
        g.fillStyle(0x3e2723, 1);
        g.fillRect(-2, 1, 4, 8);

        // Clustered vector foliage
        g.fillStyle(0x275929, 1);
        g.fillCircle(0, -4, 11);
        g.fillStyle(0x2e7d32, 1);
        g.fillCircle(-3, -8, 8);
        g.fillStyle(0x4caf50, 1);
        g.fillCircle(3, -7, 8);
        break;

      case 'bush':
        s.fillStyle(0x0a140a, 0.35);
        s.fillEllipse(0, 3, 9, 4.5);

        g.fillStyle(0x1b5e20, 1);
        g.fillCircle(-2, 0, 6);
        g.fillStyle(0x2e7d32, 1);
        g.fillCircle(2, 0, 6);
        g.fillStyle(0x45a049, 1);
        g.fillCircle(0, -2, 5);
        break;

      case 'lamp':
        s.fillStyle(0x090e0a, 0.4);
        s.fillEllipse(0, 3, 5, 2.5);

        // Pole armature
        g.lineStyle(2, 0x475569, 1);
        g.strokeLineShape(new Phaser.Geom.Line(0, 0, 0, -18));
        g.strokeLineShape(new Phaser.Geom.Line(0, -18, 4, -18));

        // Glass bulb structure and light glow
        g.fillStyle(0xfef08a, 0.85);
        g.fillCircle(4, -17, 3);
        g.fillStyle(0xfef08a, 0.2);
        g.fillCircle(4, -17, 8);
        break;

      case 'pole':
        s.fillStyle(0x090e0a, 0.4);
        s.fillEllipse(0, 3, 5, 2.5);

        // Utility wood pole
        g.lineStyle(2, 0x4e342e, 1);
        g.strokeLineShape(new Phaser.Geom.Line(0, 0, 0, -24));
        g.strokeLineShape(new Phaser.Geom.Line(-4, -20, 4, -20));

        // Electrical glass insulators
        g.fillStyle(0x00bcd4, 0.85);
        g.fillCircle(-4, -21, 1.5);
        g.fillCircle(4, -21, 1.5);
        break;

      case 'rock':
        s.fillStyle(0x090e0a, 0.35);
        s.fillEllipse(0, 1.5, 7, 3);

        g.fillStyle(0x64748b, 1);
        g.fillRoundedRect(-4, -2, 8, 4, 1.5);
        g.fillStyle(0x94a3b8, 1);
        g.fillCircle(-1, -1, 1.5);
        break;

      case 'flower':
        g.fillStyle(0xec4899, 1); // pink center
        g.fillCircle(0, 0, 1.8);
        g.fillStyle(0xfacc15, 1); // yellow petals
        g.fillCircle(-1.5, -1.5, 1.2);
        g.fillCircle(1.5, -1.5, 1.2);
        g.fillCircle(-1.5, 1.5, 1.2);
        g.fillCircle(1.5, 1.5, 1.2);
        break;
    }
  }
}
