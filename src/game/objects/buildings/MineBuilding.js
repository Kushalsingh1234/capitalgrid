import BaseBuilding from './BaseBuilding';

export default class MineBuilding extends BaseBuilding {
  drawStructure() {
    const g = this.graphics;
    const w = this.width;
    const h = this.height;

    g.clear();

    // 1. Excavated/soil floor base
    g.fillStyle(0x795548, 0.45); // dirt floor brown
    g.fillRoundedRect(-w / 2, -h / 2, w, h, 8);

    // 2. Rock wall outcrop background (the mine hill)
    g.fillStyle(0x90a4ae, 1); // stone gray rock face
    g.fillEllipse(-w / 3.5, -h / 4, w * 0.45, h * 0.45);
    
    // Rock details (polygonal facets for depth)
    g.fillStyle(0x78909c, 1); // shadowed rock face
    g.fillTriangle(-w / 2.2, -h / 3, -w / 3, -h / 2, -w / 4, -h / 3);
    g.fillStyle(0xb0bec5, 1); // highlighted rock face
    g.fillTriangle(-w / 4, -h / 3, -w / 5, -h / 2, -w / 8, -h / 3);

    // 3. Mine Tunnel Entrance
    // Dark tunnel interior
    g.fillStyle(0x212121, 1);
    g.fillRoundedRect(-w / 3.5 - 12, -h / 5 - 4, 24, 28, 4);
    // Wooden structural beams framing the tunnel
    g.lineStyle(2.5, 0x4e342e, 1); // dark timber
    g.strokeRoundedRect(-w / 3.5 - 12, -h / 5 - 4, 24, 28, 4);
    // Extra wooden lintel
    g.lineStyle(3, 0x5d4037, 1);
    g.lineBetween(-w / 3.5 - 15, -h / 5 - 4, -w / 3.5 + 15, -h / 5 - 4);

    // 4. Ore / Rock Piles
    g.fillStyle(0x607d8b, 1); // raw iron/gray ore pile
    g.fillTriangle(w / 4, -h / 6, w / 3, -h / 3, w / 2.2, -h / 6);
    g.fillStyle(0x546e7a, 1);
    g.fillTriangle(w / 4 - 8, -h / 6, w / 4 + 10, -h / 3 + 8, w / 4 + 20, -h / 6);
    
    g.fillStyle(0x8d6e63, 1); // gravel pile
    g.fillTriangle(w / 12, h / 12, w / 6, -h / 12, w / 4, h / 12);

    // 5. Parked Excavator
    const exX = -w / 3.8;
    const exY = h / 4;
    // Tracks
    g.fillStyle(0x37474f, 1);
    g.fillRect(exX - 16, exY + 4, 32, 6);
    // Cabin (yellow construction color)
    g.fillStyle(0xffca28, 1);
    g.fillRect(exX - 10, exY - 8, 18, 12);
    // Arm/Boom (yellow lines)
    g.lineStyle(3, 0xffca28, 1);
    g.lineBetween(exX + 6, exY - 2, exX + 22, exY - 14);
    g.lineBetween(exX + 22, exY - 14, exX + 26, exY);
    // Bucket
    g.fillStyle(0x37474f, 1);
    g.fillTriangle(exX + 24, exY, exX + 28, exY + 4, exX + 28, exY - 2);

    // 6. Conveyor Belt Structure
    // Iron structural legs
    g.lineStyle(1.5, 0x455a64, 0.85);
    g.lineBetween(-w / 3.5, -h / 12, -w / 3.5, h / 8);
    g.lineBetween(0, 0, 0, h / 6);
    g.lineBetween(w / 4.5, h / 10, w / 4.5, h / 4);
    // The conveyor frame
    g.lineStyle(4, 0x37474f, 1);
    g.lineBetween(-w / 3.5, -h / 12, w / 4.5, h / 10);
  }

  initAnimation() {
    // Signature Animation: Moving conveyor items (rocks/ore moving on the belt)
    const scene = this.scene;
    const w = this.width;
    const h = this.height;

    // Conveyor start and end points
    const startX = -w / 3.5;
    const startY = -h / 12;
    const endX = w / 4.5;
    const endY = h / 10;

    this.conveyorItems = [];
    const itemCount = 5;

    for (let i = 0; i < itemCount; i++) {
      // Draw a tiny rock/ore pellet
      const rock = scene.add.graphics();
      rock.fillStyle(0x455a64, 1);
      rock.fillCircle(0, 0, 2.5);
      
      this.contentContainer.add(rock);
      this.conveyorItems.push(rock);

      // Distribute progress along the path initially
      const progress = i / itemCount;
      rock.x = Phaser.Math.Linear(startX, endX, progress);
      rock.y = Phaser.Math.Linear(startY, endY, progress);

      // Add repeating loop tween
      const distance = Phaser.Math.Distance.Between(startX, startY, endX, endY);
      const remainingProgress = 1.0 - progress;

      scene.tweens.add({
        targets: rock,
        x: { from: rock.x, to: endX },
        y: { from: rock.y, to: endY },
        duration: 3000 * remainingProgress,
        ease: 'Linear',
        onComplete: () => {
          this.loopConveyorItem(rock, startX, startY, endX, endY);
        }
      });
    }
  }

  loopConveyorItem(item, startX, startY, endX, endY) {
    if (!this.scene) return;
    
    // Reset to start of conveyor
    item.x = startX;
    item.y = startY;

    this.scene.tweens.add({
      targets: item,
      x: endX,
      y: endY,
      duration: 3000,
      ease: 'Linear',
      repeat: -1
    });
  }

  destroy(fromScene) {
    if (this.conveyorItems) {
      this.conveyorItems.forEach(item => item.destroy());
    }
    super.destroy(fromScene);
  }
}
