import Phaser from 'phaser';
import WorldManager from '../managers/WorldManager';
import BuildingRenderer from '../objects/BuildingRenderer';

export default class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
  }

  preload() {
    // All geometry and textures in Phase 3 are procedural; no external assets required
  }

  create() {
    // 1. Initialize data-driven layouts for plots, roads, and decorations
    this.initLayoutData();

    // 2. Generate repeating grass tile texture
    this.createGrassTexture();

    // Ground plane repeated across 5000x5000 map boundaries
    this.grassBackground = this.add.tileSprite(2500, 2500, 5000, 5000, 'grass_tile');

    // 3. Render natural terrain tone patches to add visual depth to the ground
    this.terrainPatchesGraphics = this.add.graphics().setDepth(1);
    this.drawTerrainPatches();

    // 4. Subtle build grid lines (visible only when zoomed in)
    this.grid = this.add.grid(2500, 2500, 5000, 5000, 100, 100, null, null, 0xffffff, 0.04);
    this.grid.setDepth(2);

    // Create rendering graphics layers
    this.roadShadowGraphics = this.add.graphics().setDepth(3);
    this.plotShadowGraphics = this.add.graphics().setDepth(4);
    this.roadGraphics = this.add.graphics().setDepth(5);
    this.plotGraphics = this.add.graphics().setDepth(6);
    this.decoShadowGraphics = this.add.graphics().setDepth(7);
    this.decoGraphics = this.add.graphics().setDepth(8);

    // 5. Draw the structures from data collections
    this.drawPlotsAndDriveways();
    this.drawRoadNetwork();
    this.drawDecorations();

    // Initialize building from startup registry data
    let focusX = 2200;
    let focusY = 2200;

    const startup = this.registry.get('startup');
    if (startup) {
      this.worldManager = new WorldManager(this);
      const buildingData = this.worldManager.getBuildingForStartup(startup);
      if (buildingData) {
        focusX = buildingData.x;
        focusY = buildingData.y;
        this.playerBuilding = BuildingRenderer.create(this, buildingData);
      }
    }

    // 6. Camera System & Inertia parameters
    this.cameras.main.setBounds(0, 0, 5000, 5000);
    
    // Focus camera on the building location
    this.cameras.main.scrollX = focusX - this.scale.width / 2;
    this.cameras.main.scrollY = focusY - this.scale.height / 2;
    
    // Camera scroll target variables for smooth linear interpolation (lerp)
    this.targetScrollX = this.cameras.main.scrollX;
    this.targetScrollY = this.cameras.main.scrollY;
    
    // Camera zoom target variables (zoom out slightly on mobile/tablet screens)
    const isMobile = this.scale.width < 768;
    const defaultZoom = isMobile ? 0.75 : 1.0;
    this.targetZoom = defaultZoom;
    this.cameras.main.setZoom(defaultZoom);

    // Glide scroll physics velocities
    this.velocityX = 0;
    this.velocityY = 0;
    this.isPanning = false;

    // Track dragging speed
    this.lastPointerX = 0;
    this.lastPointerY = 0;

    // Event listeners for panning and zooming
    this.input.on('pointerdown', this.handlePointerDown, this);
    this.input.on('pointermove', this.handlePointerMove, this);
    this.input.on('pointerup', this.handlePointerUp, this);
    this.input.on('wheel', this.handleWheelZoom, this);
  }

  // Define structured arrays for roads, plots, and procedural landscaping
  initLayoutData() {
    // 10 scattered plots, each with an internal ID and road access coordinates
    this.plotsData = [
      { plotId: 'plot_0', x: 1200, y: 1200, width: 240, height: 160, connectX: 1200, connectY: 2200 },
      { plotId: 'plot_1', x: 1800, y: 1500, width: 280, height: 180, connectX: 1800, connectY: 2200 },
      { plotId: 'plot_2', x: 2600, y: 1100, width: 220, height: 150, connectX: 2200, connectY: 1100 },
      { plotId: 'plot_3', x: 3400, y: 1600, width: 300, height: 200, connectX: 2200, connectY: 1600 },
      { plotId: 'plot_4', x: 1500, y: 2800, width: 260, height: 170, connectX: 2200, connectY: 2800 },
      { plotId: 'plot_5', x: 2200, y: 2200, width: 240, height: 160, connectX: 2200, connectY: 2200 }, // Central plot
      { plotId: 'plot_6', x: 2800, y: 3200, width: 280, height: 180, connectX: 2200, connectY: 3200 },
      { plotId: 'plot_7', x: 3800, y: 2600, width: 320, height: 200, connectX: 3800, connectY: 2200 },
      { plotId: 'plot_8', x: 1900, y: 3800, width: 240, height: 160, connectX: 2200, connectY: 3800 },
      { plotId: 'plot_9', x: 3200, y: 3900, width: 300, height: 200, connectX: 2200, connectY: 3900 }
    ];

    // Road network hierarchy (Primary arterial, Secondary connecting, and local Service segments)
    this.roadsData = [
      // Primary main arterials crossing map
      { x1: 2200, y1: 500, x2: 2200, y2: 4500, type: 'primary' },
      { x1: 500, y1: 2200, x2: 4500, y2: 2200, type: 'primary' },
      // Secondary routes connecting plots to primary lines
      { x1: 1200, y1: 1200, x2: 1200, y2: 2200, type: 'secondary' },
      { x1: 1800, y1: 1500, x2: 1800, y2: 2200, type: 'secondary' },
      { x1: 2600, y1: 1100, x2: 2200, y2: 1100, type: 'secondary' },
      { x1: 3400, y1: 1600, x2: 2200, y2: 1600, type: 'secondary' },
      { x1: 1500, y1: 2800, x2: 2200, y2: 2800, type: 'secondary' },
      { x1: 2800, y1: 3200, x2: 2200, y2: 3200, type: 'secondary' },
      { x1: 3800, y1: 2600, x2: 3800, y2: 2200, type: 'secondary' },
      { x1: 1900, y1: 3800, x2: 2200, y2: 3800, type: 'secondary' },
      { x1: 3200, y1: 3900, x2: 2200, y2: 3900, type: 'secondary' }
    ];

    // Array containing all static environmental details, generated procedurally inside create()
    this.decorationsData = [];
    this.generateDecorationData();
  }

  // Draw dynamically created grass patch variations
  createGrassTexture() {
    const canvas = this.textures.createCanvas('grass_tile', 64, 64);
    const ctx = canvas.getContext();

    ctx.fillStyle = '#2d6a31';
    ctx.fillRect(0, 0, 64, 64);

    // Add noise patterns
    for (let i = 0; i < 60; i++) {
      const x = Math.floor(Math.random() * 64);
      const y = Math.floor(Math.random() * 64);
      const val = Math.random();
      ctx.fillStyle = val > 0.6 ? '#388e3c' : (val > 0.3 ? '#1b5e20' : '#275d2b');
      ctx.fillRect(x, y, 2, 2);
    }
    canvas.refresh();
  }

  // Bake soft variations directly to terrain patches layer
  drawTerrainPatches() {
    const patchColors = [0x1f4a21, 0x183d1a, 0x3d5c3f, 0x544036]; // Dark green, lighter grass green, dirt brown
    
    // Seed 140 soft, large organic patches across the grid
    const patchCount = 140;
    const seed = 42; // Deterministic pseudo-random coordinates
    let state = seed;
    const nextRand = () => {
      state = (state * 1664525 + 1013904223) % 4294967296;
      return state / 4294967296;
    };

    for (let i = 0; i < patchCount; i++) {
      const x = nextRand() * 5000;
      const y = nextRand() * 5000;
      const radiusX = 120 + nextRand() * 260;
      const radiusY = 80 + nextRand() * 180;
      const color = patchColors[Math.floor(nextRand() * patchColors.length)];
      const alpha = 0.04 + nextRand() * 0.08;

      this.terrainPatchesGraphics.fillStyle(color, alpha);
      this.terrainPatchesGraphics.fillEllipse(x, y, radiusX, radiusY);
    }
  }

  // Render plots with concrete stone edging and service driveways
  drawPlotsAndDriveways() {
    this.plotsData.forEach(plot => {
      const halfW = plot.width / 2;
      const halfH = plot.height / 2;
      const x1 = plot.x - halfW;
      const y1 = plot.y - halfH;

      // 1. Draw Plot Base Shadow for visual depth (recessed look)
      this.plotShadowGraphics.fillStyle(0x0a100c, 0.4);
      this.plotShadowGraphics.fillRoundedRect(x1 + 3, y1 + 3, plot.width, plot.height, 8);

      // 2. Draw gravel/dirt texture inside plot boundaries
      this.plotGraphics.fillStyle(0xd7ccc8, 0.22); // Gravel washed color
      this.plotGraphics.fillRoundedRect(x1, y1, plot.width, plot.height, 8);

      // 3. Draw 3D Concrete Edging Borders
      // Shaded borders (bottom-right: dark blue-gray, top-left: bright highlight)
      this.plotGraphics.lineStyle(2, 0x4B6B8F, 0.45); // Concrete edge shadow
      this.plotGraphics.strokeRoundedRect(x1, y1, plot.width, plot.height, 8);

      this.plotGraphics.lineStyle(1.5, 0xffffff, 0.22); // Highlight top-left curb edge
      this.plotGraphics.strokeLineShape(new Phaser.Geom.Line(x1 + 4, y1, x1 + plot.width - 4, y1));
      this.plotGraphics.strokeLineShape(new Phaser.Geom.Line(x1, y1 + 4, x1, y1 + plot.height - 4));

      // 4. Draw Service Paved Entrance/Driveway connecting directly to its road junction
      this.drawPlotDriveway(plot);
    });
  }

  // Draw access driveway from plots to road coordinates
  drawPlotDriveway(plot) {
    const dx = plot.connectX - plot.x;
    const dy = plot.connectY - plot.y;

    // Calculate plot border intersection coordinates
    let startX = plot.x;
    let startY = plot.y;

    if (Math.abs(dx) > Math.abs(dy)) {
      startX = plot.x + Math.sign(dx) * (plot.width / 2);
    } else {
      startY = plot.y + Math.sign(dy) * (plot.height / 2);
    }

    // Driveway Base Shadow
    this.roadShadowGraphics.lineStyle(20, 0x111827, 0.2);
    this.roadShadowGraphics.lineBetween(startX + 2, startY + 2, plot.connectX + 2, plot.connectY + 2);

    // Driveway Curb
    this.roadGraphics.lineStyle(20, 0x1f2937, 0.9);
    this.roadGraphics.lineBetween(startX, startY, plot.connectX, plot.connectY);

    // Driveway Asphalt base
    this.roadGraphics.lineStyle(16, 0x4b5563, 1);
    this.roadGraphics.lineBetween(startX, startY, plot.connectX, plot.connectY);
  }

  // Draw road network based on tier classifications
  drawRoadNetwork() {
    // 1. Draw Road Shadows (adds visual elevation depth)
    this.roadsData.forEach(road => {
      let shadowWidth = 64;
      if (road.type === 'secondary') shadowWidth = 46;
      this.roadShadowGraphics.lineStyle(shadowWidth, 0x081009, 0.35);
      this.roadShadowGraphics.lineBetween(road.x1 + 4, road.y1 + 4, road.x2 + 4, road.y2 + 4);
    });

    // 2. Draw Junction Underlays to smooth crossings
    this.roadsData.forEach(road => {
      this.drawJunctionUnderlay(road.x1, road.y1, road.type);
      this.drawJunctionUnderlay(road.x2, road.y2, road.type);
    });

    // 3. Draw Curb/Shoulder Bases
    this.roadsData.forEach(road => {
      const curbWidth = road.type === 'primary' ? 58 : 40;
      const curbColor = road.type === 'primary' ? 0x0f172a : 0x1f2937;
      this.roadGraphics.lineStyle(curbWidth, curbColor, 0.95);
      this.roadGraphics.lineBetween(road.x1, road.y1, road.x2, road.y2);
    });

    // 4. Draw Asphalt Lanes
    this.roadsData.forEach(road => {
      const asphaltWidth = road.type === 'primary' ? 52 : 34;
      const asphaltColor = road.type === 'primary' ? 0x1e293b : 0x374151;
      this.roadGraphics.lineStyle(asphaltWidth, asphaltColor, 1);
      this.roadGraphics.lineBetween(road.x1, road.y1, road.x2, road.y2);
    });

    // 5. Draw Double Yellow / Dashed White Markings
    this.roadsData.forEach(road => {
      if (road.type === 'primary') {
        // Double Yellow lines
        this.roadGraphics.lineStyle(1.5, 0xf59e0b, 0.7);
        const angle = Phaser.Math.Angle.Between(road.x1, road.y1, road.x2, road.y2);
        const dx = Math.sin(angle) * 2;
        const dy = Math.cos(angle) * 2;

        this.roadGraphics.lineBetween(road.x1 - dx, road.y1 + dy, road.x2 - dx, road.y2 + dy);
        this.roadGraphics.lineBetween(road.x1 + dx, road.y1 - dy, road.x2 + dx, road.y2 - dy);
      } else {
        // Dashed Lane Markings
        this.roadGraphics.lineStyle(2, 0x9ca3af, 0.55);
        const length = Phaser.Math.Distance.Between(road.x1, road.y1, road.x2, road.y2);
        const steps = Math.floor(length / 20);
        const angle = Phaser.Math.Angle.Between(road.x1, road.y1, road.x2, road.y2);
        const dx = Math.cos(angle);
        const dy = Math.sin(angle);

        for (let i = 0; i < steps; i++) {
          const startX = road.x1 + dx * (i * 20);
          const startY = road.y1 + dy * (i * 20);
          const endX = road.x1 + dx * (i * 20 + 10);
          const endY = road.y1 + dy * (i * 20 + 10);
          this.roadGraphics.lineBetween(startX, startY, endX, endY);
        }
      }
    });
  }

  // Draw smooth circular road crossings
  drawJunctionUnderlay(x, y, type) {
    const size = type === 'primary' ? 29 : 20;
    const curbColor = type === 'primary' ? 0x0f172a : 0x1f2937;
    const asphaltColor = type === 'primary' ? 0x1e293b : 0x374151;

    this.roadGraphics.fillStyle(curbColor, 0.95);
    this.roadGraphics.fillCircle(x, y, size);

    this.roadGraphics.fillStyle(asphaltColor, 1);
    this.roadGraphics.fillCircle(x, y, size - 3);
  }

  // Procedurally seed coordinates for clustered trees, poles, and lamps
  generateDecorationData() {
    const seed = 88;
    let state = seed;
    const nextRand = () => {
      state = (state * 1664525 + 1013904223) % 4294967296;
      return state / 4294967296;
    };

    // 1. Generate 10 dense forest groves (clustered)
    const groveCount = 10;
    for (let g = 0; g < groveCount; g++) {
      const gx = 400 + nextRand() * 4200;
      const gy = 400 + nextRand() * 4200;

      // Seed 14 trees/bushes closely grouped in each forest grove
      const groveSize = 12 + Math.floor(nextRand() * 6);
      for (let t = 0; t < groveSize; t++) {
        const offsetR = nextRand() * 120;
        const offsetA = nextRand() * Math.PI * 2;
        const tx = gx + Math.cos(offsetA) * offsetR;
        const ty = gy + Math.sin(offsetA) * offsetR;

        if (this.isAreaClear(tx, ty, 60)) {
          const type = nextRand() > 0.35 ? 'tree' : 'bush';
          this.decorationsData.push({ x: tx, y: ty, type });
        }
      }
    }

    // 2. Generate roadside elements along Primary Highways
    this.roadsData.forEach(road => {
      if (road.type !== 'primary') return;

      const isVertical = road.x1 === road.x2;
      const length = Math.abs(isVertical ? road.y2 - road.y1 : road.x2 - road.x1);
      const step = 220; // Distance interval between trees/lamps
      const count = Math.floor(length / step);

      for (let i = 1; i < count; i++) {
        const progress = road.y1 + i * step * Math.sign(road.y2 - road.y1);
        const rx = isVertical ? road.x1 : road.x1 + i * step * Math.sign(road.x2 - road.x1);
        const ry = isVertical ? progress : road.y1;

        // Draw roadside props on both sides
        const offsetDist = 38;
        const leftX = isVertical ? rx - offsetDist : rx;
        const leftY = isVertical ? ry : ry - offsetDist;
        const rightX = isVertical ? rx + offsetDist : rx;
        const rightY = isVertical ? ry : ry + offsetDist;

        // Left side landscaping
        if (this.isAreaClear(leftX, leftY, 20)) {
          this.decorationsData.push({ x: leftX, y: leftY, type: 'tree' });
        }
        // Right side utilities (Street Lamps)
        if (this.isAreaClear(rightX, rightY, 20)) {
          this.decorationsData.push({ x: rightX, y: rightY, type: 'lamp' });
        }
      }
    });

    // 3. Generate utility poles along Secondary roads
    this.roadsData.forEach(road => {
      if (road.type !== 'secondary') return;

      const length = Phaser.Math.Distance.Between(road.x1, road.y1, road.x2, road.y2);
      const step = 200;
      const count = Math.floor(length / step);
      const angle = Phaser.Math.Angle.Between(road.x1, road.y1, road.x2, road.y2);
      const dx = Math.cos(angle);
      const dy = Math.sin(angle);

      for (let i = 1; i < count; i++) {
        // Place poles offset to side of secondary lanes
        const px = road.x1 + dx * (i * step) - dy * 26;
        const py = road.y1 + dy * (i * step) + dx * 26;

        if (this.isAreaClear(px, py, 20)) {
          this.decorationsData.push({ x: px, y: py, type: 'pole' });
        }
      }
    });
  }

  // Ensure decorations don't spawn on roads, driveways, or plot sites
  isAreaClear(x, y, radius = 40) {
    if (x < 100 || x > 4900 || y < 100 || y > 4900) return false;

    // Check roads & junctions
    for (const road of this.roadsData) {
      if (Phaser.Math.Distance.Between(x, y, road.x1, road.y1) < (radius + 20)) return false;
      if (Phaser.Math.Distance.Between(x, y, road.x2, road.y2) < (radius + 20)) return false;

      const minX = Math.min(road.x1, road.x2) - radius;
      const maxX = Math.max(road.x1, road.x2) + radius;
      const minY = Math.min(road.y1, road.y2) - radius;
      const maxY = Math.max(road.y1, road.y2) + radius;

      if (x >= minX && x <= maxX && y >= minY && y <= maxY) return false;
    }

    // Check plots
    for (const plot of this.plotsData) {
      const left = plot.x - plot.width / 2 - radius - 20;
      const right = plot.x + plot.width / 2 + radius + 20;
      const top = plot.y - plot.height / 2 - radius - 20;
      const bottom = plot.y + plot.height / 2 + radius + 20;

      if (x >= left && x <= right && y >= top && y <= bottom) return false;
    }

    return true;
  }

  // Iterate over data collections to draw natural elements
  drawDecorations() {
    // 1. Draw shadows underneath trees and poles first
    this.decorationsData.forEach(dec => {
      if (dec.type === 'tree') {
        this.decoShadowGraphics.fillStyle(0x0f2210, 0.45);
        this.decoShadowGraphics.fillEllipse(dec.x, dec.y + 6, 12, 6);
      } else if (dec.type === 'pole' || dec.type === 'lamp') {
        this.decoShadowGraphics.fillStyle(0x0f2210, 0.35);
        this.decoShadowGraphics.fillEllipse(dec.x, dec.y + 3, 5, 2.5);
      }
    });

    // 2. Draw Vector Models
    this.decorationsData.forEach(dec => {
      if (dec.type === 'tree') {
        // Trunk
        this.decoGraphics.fillStyle(0x3e2723, 1);
        this.decoGraphics.fillRect(dec.x - 2, dec.y + 1, 4, 8);
        // Foliage layers
        this.decoGraphics.fillStyle(0x275929, 1);
        this.decoGraphics.fillCircle(dec.x, dec.y - 4, 11);
        this.decoGraphics.fillStyle(0x2e7d32, 1);
        this.decoGraphics.fillCircle(dec.x - 3, dec.y - 8, 8);
        this.decoGraphics.fillStyle(0x4caf50, 1);
        this.decoGraphics.fillCircle(dec.x + 3, dec.y - 7, 8);
      } 
      else if (dec.type === 'bush') {
        this.decoGraphics.fillStyle(0x1b5e20, 1);
        this.decoGraphics.fillCircle(dec.x - 2, dec.y, 6);
        this.decoGraphics.fillStyle(0x2e7d32, 1);
        this.decoGraphics.fillCircle(dec.x + 2, dec.y, 6);
        this.decoGraphics.fillStyle(0x45a049, 1);
        this.decoGraphics.fillCircle(dec.x, dec.y - 2, 5);
      } 
      else if (dec.type === 'lamp') {
        // Metal post
        this.decoGraphics.lineStyle(2, 0x475569, 1);
        this.decoGraphics.strokeLineShape(new Phaser.Geom.Line(dec.x, dec.y, dec.x, dec.y - 18));
        this.decoGraphics.strokeLineShape(new Phaser.Geom.Line(dec.x, dec.y - 18, dec.x + 4, dec.y - 18));

        // Soft yellow bulb glow
        this.decoGraphics.fillStyle(0xfef08a, 0.8);
        this.decoGraphics.fillCircle(dec.x + 4, dec.y - 17, 3);
        this.decoGraphics.fillStyle(0xfef08a, 0.22);
        this.decoGraphics.fillCircle(dec.x + 4, dec.y - 17, 8);
      } 
      else if (dec.type === 'pole') {
        // Wood post
        this.decoGraphics.lineStyle(2, 0x4e342e, 1);
        this.decoGraphics.strokeLineShape(new Phaser.Geom.Line(dec.x, dec.y, dec.x, dec.y - 24));
        this.decoGraphics.strokeLineShape(new Phaser.Geom.Line(dec.x - 4, dec.y - 20, dec.x + 4, dec.y - 20));

        // Glass insulators
        this.decoGraphics.fillStyle(0x00bcd4, 0.85);
        this.decoGraphics.fillCircle(dec.x - 4, dec.y - 21, 1.5);
        this.decoGraphics.fillCircle(dec.x + 4, dec.y - 21, 1.5);
      }
    });

    // 3. Connect Utility wire lines between adjacent poles
    this.drawUtilityWires();
  }

  // Draw wire paths between nearby poles in the dataset
  drawUtilityWires() {
    const poles = this.decorationsData.filter(d => d.type === 'pole');
    this.decoGraphics.lineStyle(0.7, 0x1e293b, 0.45); // Black thin sag wire

    for (let i = 0; i < poles.length; i++) {
      for (let j = i + 1; j < poles.length; j++) {
        const dist = Phaser.Math.Distance.Between(poles[i].x, poles[i].y, poles[j].x, poles[j].y);
        
        // Connect poles if they sit within 220px of each other (road sequence)
        if (dist < 220) {
          const x1 = poles[i].x;
          const y1 = poles[i].y - 20;
          const x2 = poles[j].x;
          const y2 = poles[j].y - 20;

          // Render a simple quadratic Bezier curve to represent wire sag
          const midX = (x1 + x2) / 2;
          const midY = (y1 + y2) / 2 + 5; // Sag offset

          const curve = new Phaser.Curves.QuadraticBezier(
            new Phaser.Math.Vector2(x1, y1),
            new Phaser.Math.Vector2(midX, midY),
            new Phaser.Math.Vector2(x2, y2)
          );
          
          curve.draw(this.decoGraphics);
        }
      }
    }
  }

  // Camera pan pointer handlers with drag speeds
  handlePointerDown(pointer) {
    if (pointer.rightButtonDown()) return;
    this.isPanning = true;
    this.dragStartX = pointer.x;
    this.dragStartY = pointer.y;
    this.cameraDragStartX = this.targetScrollX;
    this.cameraDragStartY = this.targetScrollY;

    // Reset speeds
    this.velocityX = 0;
    this.velocityY = 0;
    this.lastPointerX = pointer.x;
    this.lastPointerY = pointer.y;
  }

  handlePointerMove(pointer) {
    if (!this.isPanning) return;
    const zoom = this.cameras.main.zoom;
    const dx = (pointer.x - this.dragStartX) / zoom;
    const dy = (pointer.y - this.dragStartY) / zoom;
    this.targetScrollX = this.cameraDragStartX - dx;
    this.targetScrollY = this.cameraDragStartY - dy;

    // Calculate drag velocity delta
    this.velocityX = -(pointer.x - this.lastPointerX) / zoom;
    this.velocityY = -(pointer.y - this.lastPointerY) / zoom;

    this.lastPointerX = pointer.x;
    this.lastPointerY = pointer.y;
  }

  handlePointerUp() {
    this.isPanning = false;
  }

  // Mouse wheel zoom to cursor targeting
  handleWheelZoom(pointer, gameObjects, deltaX, deltaY, deltaZ) {
    const zoomSpeed = 0.08;
    let nextZoom = this.targetZoom - Math.sign(deltaY) * zoomSpeed;
    this.targetZoom = Phaser.Math.Clamp(nextZoom, 0.5, 2.5);

    // Get pointer world position before zoom scales
    const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);

    // Dynamic readjustment to center zoom targeting on pointer coordinates
    const newWorldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
    this.targetScrollX += (worldPoint.x - newWorldPoint.x);
    this.targetScrollY += (worldPoint.y - newWorldPoint.y);
  }

  update() {
    // 1. Decelerate panning velocities for gliding inertia when pointer is released
    if (!this.isPanning) {
      this.targetScrollX += this.velocityX;
      this.targetScrollY += this.velocityY;
      this.velocityX *= 0.90;
      this.velocityY *= 0.90;

      // Nullify velocities when they fall below threshold
      if (Math.abs(this.velocityX) < 0.05) this.velocityX = 0;
      if (Math.abs(this.velocityY) < 0.05) this.velocityY = 0;
    }

    // 2. Interpolate Camera Panning Scroll positions (lerp factor 0.1)
    const lerpScroll = 0.12;
    this.cameras.main.scrollX = Phaser.Math.Linear(this.cameras.main.scrollX, this.targetScrollX, lerpScroll);
    this.cameras.main.scrollY = Phaser.Math.Linear(this.cameras.main.scrollY, this.targetScrollY, lerpScroll);

    // Clamp coordinates inside map limits
    const maxScrollX = 5000 - this.scale.width;
    const maxScrollY = 5000 - this.scale.height;
    this.targetScrollX = Phaser.Math.Clamp(this.targetScrollX, 0, Math.max(0, maxScrollX));
    this.targetScrollY = Phaser.Math.Clamp(this.targetScrollY, 0, Math.max(0, maxScrollY));

    // 3. Interpolate Zoom Levels for smooth transition
    const lerpZoom = 0.10;
    const currentZoom = this.cameras.main.zoom;
    const interpolatedZoom = Phaser.Math.Linear(currentZoom, this.targetZoom, lerpZoom);
    this.cameras.main.setZoom(interpolatedZoom);

    // 4. Adjust Build Grid visibility based on zoom factor
    const zoom = this.cameras.main.zoom;
    if (zoom < 0.7) {
      this.grid.setVisible(false);
    } else {
      this.grid.setVisible(true);
      const lineAlpha = Phaser.Math.Clamp((zoom - 0.7) * 0.15, 0.0, 0.04);
      this.grid.setAlpha(lineAlpha);
    }
  }
}
