import Phaser from 'phaser';

export default class BaseBuilding extends Phaser.GameObjects.Container {
  constructor(scene, buildingData) {
    super(scene, buildingData.x, buildingData.y);
    this.buildingData = buildingData;

    // Find the plot from the scene to determine scaling bounds
    const plot = scene.plotsData?.find(p => p.plotId === buildingData.plotId);
    this.plotWidth = plot ? plot.width : 240;
    this.plotHeight = plot ? plot.height : 160;

    // The building should occupy approximately 60-70% of the plot
    this.width = this.plotWidth * 0.65;
    this.height = this.plotHeight * 0.65;

    // 1. Create a Graphics object for the unrotated Ground Shadow (light angle matches environment)
    this.shadowGraphics = scene.add.graphics();
    this.add(this.shadowGraphics);

    // 2. Create a Container for the rotated Building Content (faces the road)
    this.contentContainer = scene.add.container(0, 0);
    this.contentContainer.setRotation(buildingData.rotation);
    this.add(this.contentContainer);

    // 3. Create a Graphics object inside contentContainer for drawing components
    this.graphics = scene.add.graphics();
    this.contentContainer.add(this.graphics);

    // 4. Create a Graphics object inside contentContainer for the hover highlights
    this.highlightGraphics = scene.add.graphics();
    this.highlightGraphics.setVisible(false);
    this.contentContainer.add(this.highlightGraphics);

    // Add this container to the scene and set depth above map lines/driveways
    scene.add.existing(this);
    this.setDepth(10);

    // Enable interaction
    this.setSize(this.width, this.height);
    this.setInteractive({ useHandCursor: true });

    // Event bindings
    this.on('pointerover', this.onPointerOver, this);
    this.on('pointerout', this.onPointerOut, this);
    this.on('pointerdown', this.onPointerDown, this);

    // Draw elements
    this.drawShadow();
    this.drawStructure();
    this.drawHighlight();
    this.initAnimation();
  }

  drawShadow() {
    this.shadowGraphics.clear();
    // Soft, realistic offset shadow matching sunlight angle from top-left
    this.shadowGraphics.fillStyle(0x09120a, 0.35);
    this.shadowGraphics.fillEllipse(8, 12, this.width * 1.15, this.height * 0.85);
  }

  drawStructure() {
    // To be overridden in building subclasses
  }

  drawHighlight() {
    this.highlightGraphics.clear();
    
    // Cyan glow outline just outside the building bounds
    this.highlightGraphics.lineStyle(3, 0x00f0ff, 0.8);
    this.highlightGraphics.strokeRoundedRect(
      -this.width / 2 - 3, 
      -this.height / 2 - 3, 
      this.width + 6, 
      this.height + 6, 
      8
    );

    // Subtle brightness increase overlay
    this.highlightGraphics.fillStyle(0xffffff, 0.08);
    this.highlightGraphics.fillRoundedRect(
      -this.width / 2 - 3, 
      -this.height / 2 - 3, 
      this.width + 6, 
      this.height + 6, 
      8
    );
  }

  onPointerOver() {
    this.highlightGraphics.setVisible(true);
    
    // Slight scale-up bounce for micro-animation feel
    this.scene.tweens.add({
      targets: this.contentContainer,
      scale: 1.04,
      duration: 150,
      ease: 'Cubic.Out'
    });
  }

  onPointerOut() {
    this.highlightGraphics.setVisible(false);
    
    this.scene.tweens.add({
      targets: this.contentContainer,
      scale: 1.0,
      duration: 150,
      ease: 'Cubic.Out'
    });
  }

  onPointerDown(pointer) {
    // Consume pointer click so camera panning does not trigger
    if (pointer.button === 0) {
      pointer.event.stopPropagation();
      this.scene.game.events.emit('building-click', this.buildingData);
    }
  }

  initAnimation() {
    // Signature animation initialization (overridden in subclasses)
  }
}
