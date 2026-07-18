import Phaser from 'phaser';
import { PARCELS, GRID_ROWS, GRID_COLS, TILE_WIDTH, TILE_HEIGHT, TILE_SPACING } from '../../gameConfig/mapConfig';
import IsometricTile from '../objects/IsometricTile';

/**
 * GameScene - Decoupled Viewport Orchestrator (Phase 33D Responsive Centering Pass)
 * Renders the 5x5 campus layout, auto-scales to fit viewport, and restricts viewport controls to centered zoom.
 */
export default class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
  }

  preload() {
    const version = Date.now();

    // Load concrete slab assets with cache busting
    this.load.image('iso-block', `/assets/terrain/iso-block.png?v=${version}`);
    this.load.image('iso-shadow', `/assets/terrain/iso-shadow.png?v=${version}`);

    // Load buildable plot variant assets (Phase 33C)
    this.load.image('plot_grass', '/assets/plots/plot_grass.png');
    this.load.image('plot_flowers', '/assets/plots/plot_flowers.png');
    this.load.image('plot_hedge', '/assets/plots/plot_hedge.png');
    this.load.image('plot_tree', '/assets/plots/plot_tree.png');
    this.load.image('plot_stone', '/assets/plots/plot_stone.png');
    this.load.image('plot_shrubs', '/assets/plots/plot_shrubs.png');
    this.load.image('plot_flower-island', '/assets/plots/plot_flower_island.png');
    this.load.image('plot_landscaped', '/assets/plots/plot_landscaped.png');
    this.load.image('plot_mixed', '/assets/plots/plot_mixed.png');
    this.load.image('plot_premium', '/assets/plots/plot_premium.png');

    // Load 3D isometric building assets (Phase 33D centerpiece)
    this.load.image('building_farming', '/assets/buildings/building_farming.png');
    this.load.image('building_mining', '/assets/buildings/building_mining.png');
    this.load.image('building_factory', '/assets/buildings/building_factory.png');
    this.load.image('building_retail', '/assets/buildings/building_retail.png');

    // Load modern metro road network assets with cache busting (Phase 36)
    this.load.image('road_v', `/assets/terrain/road_v.png?v=${version}`);
    this.load.image('road_h', `/assets/terrain/road_h.png?v=${version}`);
    this.load.image('road_intersection', `/assets/terrain/road_intersection.png?v=${version}`);
  }

  create() {
    // 1. Initialize data-driven display layers
    this.groundLayer = this.add.container(0, 0).setDepth(1);
    this.decorationsLayer = this.add.container(0, 0).setDepth(3);
    this.buildingsLayer = this.add.container(0, 0).setDepth(4);
    this.effectsLayer = this.add.container(0, 0).setDepth(5);

    // 2. Spawn modern metro road sprites in intertile spacing gaps
    const worldCenterX = 1400;
    const worldCenterY = 1000;
    const W = TILE_WIDTH + TILE_SPACING;
    const H = TILE_HEIGHT + Math.round(TILE_SPACING * (TILE_HEIGHT / TILE_WIDTH));

    const getX = (r, c) => worldCenterX + (c - r) * (W / 2);
    const getY = (r, c) => worldCenterY + (c + r - (GRID_ROWS + GRID_COLS - 2) / 2) * (H / 2);

    // Vertical road segments (parallel to col axis)
    for (let r = 0; r < GRID_ROWS; r++) {
      for (let c = 0; c < GRID_COLS - 1; c++) {
        const rx = (getX(r, c) + getX(r, c + 1)) / 2;
        const ry = (getY(r, c) + getY(r, c + 1)) / 2;
        const road = this.add.image(rx, ry, 'road_v');
        road.setDepth(r + c + 0.5); // Fractional depth to interleave between block rows
        this.groundLayer.add(road);
      }
    }

    // Horizontal road segments (parallel to row axis)
    for (let r = 0; r < GRID_ROWS - 1; r++) {
      for (let c = 0; c < GRID_COLS; c++) {
        const rx = (getX(r, c) + getX(r + 1, c)) / 2;
        const ry = (getY(r, c) + getY(r + 1, c)) / 2;
        const road = this.add.image(rx, ry, 'road_h');
        road.setDepth(r + c + 0.5); // Fractional depth to interleave between block rows
        this.groundLayer.add(road);
      }
    }

    // Intersection cross road segments (at crossing centers)
    for (let r = 0; r < GRID_ROWS - 1; r++) {
      for (let c = 0; c < GRID_COLS - 1; c++) {
        const rx = (getX(r, c) + getX(r + 1, c + 1)) / 2;
        const ry = (getY(r, c) + getY(r + 1, c + 1)) / 2;
        const road = this.add.image(rx, ry, 'road_intersection');
        road.setDepth(r + c + 1.0); // Fractional depth to align with crossing block rows
        this.groundLayer.add(road);
      }
    }

    // 3. Spawn 3D modular tiles from decoupled PARCELS configuration
    this.tiles = [];
    PARCELS.forEach(tileData => {
      const tile = new IsometricTile(this, tileData);
      this.groundLayer.add(tile);
      this.tiles.push(tile);
    });

    // Ensure the container children list maintains correct render depth ordering
    this.groundLayer.sort('depth');

    // 4. Compute dynamic center and bounds of assembled tiles
    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;
    PARCELS.forEach(p => {
      const halfW = 240; // TILE_WIDTH / 2
      const halfH = 80;  // TILE_HEIGHT / 2
      if (p.x - halfW < minX) minX = p.x - halfW;
      if (p.x + halfW > maxX) maxX = p.x + halfW;
      if (p.y - halfH < minY) minY = p.y - halfH;
      if (p.y + halfH + 40 > maxY) maxY = p.y + halfH + 40; // depth offset
    });

    this.focusX = (minX + maxX) / 2;
    this.focusY = (minY + maxY) / 2;
    this.terrainWidth = maxX - minX;
    this.terrainHeight = maxY - minY;

    // Glide variables (decoupled drag state)
    this.isPointerDown = false;
    this.isDragging = false;

    // Parallax shifting variables
    this.parallaxX = 0;
    this.parallaxY = 0;
    this.targetParallaxX = 0;
    this.targetParallaxY = 0;

    // Set initial responsive zoom and centering
    this.handleResize(this.scale);

    // Register scale resize listener for mobile responsive layout updates
    this.scale.on('resize', this.handleResize, this);

    // Event listeners
    this.input.on('pointerdown', this.handlePointerDown, this);
    this.input.on('pointermove', this.handlePointerMove, this);
    this.input.on('pointerup', this.handlePointerUp, this);
    this.input.on('wheel', this.handleWheelZoom, this);

    // Reset parallax offset when pointer leaves canvas bounds
    this.input.on('pointerout', () => {
      this.targetParallaxX = 0;
      this.targetParallaxY = 0;
    });

    // Handle centering event on dashboard requests
    const handleCenterEvent = () => {
      this.targetZoom = this.defaultZoom;
    };

    window.addEventListener('center-player-building', handleCenterEvent);
    this.events.once('shutdown', () => {
      window.removeEventListener('center-player-building', handleCenterEvent);
      this.scale.off('resize', this.handleResize, this);
    });
  }

  /**
   * Resizes viewport zoom dynamically to ensure entire grid remains visible on mobile/desktop.
   */
  handleResize(gameSize) {
    const width = gameSize.width;
    const height = gameSize.height;

    // Snug padding to maximize visible layout size on mobile/tablet viewports
    const padding = 60;
    const zoomX = width / (this.terrainWidth + padding);
    const zoomY = height / (this.terrainHeight + padding);

    // Minimum clamp set to 0.05 to prevent grid edge cutoff on vertical mobile aspect ratios
    let defaultZoom = Phaser.Math.Clamp(Math.min(zoomX, zoomY), 0.05, 1.5);

    // On mobile viewports (width < 768px), scale zoom in by 80% to make details larger and visible
    if (width < 768) {
      defaultZoom = defaultZoom * 1.80;
    }

    this.defaultZoom = defaultZoom;

    // Lock initial or current zoom factor if near default
    if (!this.targetZoom || Math.abs(this.targetZoom - this.defaultZoom) < 0.1) {
      this.targetZoom = defaultZoom;
      this.cameras.main.setZoom(defaultZoom);
    }

    // Centered scroll coordinates without dividing by zoom (Phaser 3 center-zoom standard)
    this.targetScrollX = this.focusX - width / 2;
    this.targetScrollY = this.focusY - height / 2;
    
    this.cameras.main.scrollX = this.targetScrollX;
    this.cameras.main.scrollY = this.targetScrollY;
  }

  handlePointerDown(pointer) {
    if (pointer.rightButtonDown()) return;
    this.isPointerDown = true;
    this.isDragging = false;
  }

  handlePointerMove(pointer) {
    // Parallax Shift Offset math based on mouse position relative to window center
    const centerX = this.scale.width / 2;
    const centerY = this.scale.height / 2;
    const dxParallax = (pointer.x - centerX) / centerX;
    const dyParallax = (pointer.y - centerY) / centerY;
    this.targetParallaxX = -dxParallax * 50;
    this.targetParallaxY = -dyParallax * 40;
  }

  handlePointerUp() {
    this.isPointerDown = false;
    this.isDragging = false;
  }

  handleWheelZoom(pointer, gameObjects, deltaX, deltaY) {
    const zoomSpeed = 0.08;
    const nextZoom = this.targetZoom - Math.sign(deltaY) * zoomSpeed;
    // Allow zooming in/out relative to the screen layout limits
    this.targetZoom = Phaser.Math.Clamp(nextZoom, this.defaultZoom, 2.5);
  }

  update() {
    // Interpolate parallax shift offset for smooth tracking slide
    this.parallaxX = Phaser.Math.Linear(this.parallaxX, this.targetParallaxX, 0.08);
    this.parallaxY = Phaser.Math.Linear(this.parallaxY, this.targetParallaxY, 0.08);

    // Apply offset directly to display layers to achieve parallax sliding
    this.groundLayer.setPosition(this.parallaxX, this.parallaxY);
    this.decorationsLayer.setPosition(this.parallaxX, this.parallaxY);
    this.buildingsLayer.setPosition(this.parallaxX, this.parallaxY);
    this.effectsLayer.setPosition(this.parallaxX, this.parallaxY);


    // Smooth zoom interpolation (lerp)
    const lerpZoom = 0.10;
    const currentZoom = this.cameras.main.zoom;
    const interpolatedZoom = Phaser.Math.Linear(currentZoom, this.targetZoom, lerpZoom);
    this.cameras.main.setZoom(interpolatedZoom);

    // Centered scroll coordinates without dividing by zoom (Phaser 3 center-zoom standard)
    this.targetScrollX = this.focusX - this.scale.width / 2;
    this.targetScrollY = this.focusY - this.scale.height / 2;

    // Smooth scroll interpolation (lerp)
    const lerpScroll = 0.12;
    this.cameras.main.scrollX = Phaser.Math.Linear(this.cameras.main.scrollX, this.targetScrollX, lerpScroll);
    this.cameras.main.scrollY = Phaser.Math.Linear(this.cameras.main.scrollY, this.targetScrollY, lerpScroll);
  }
}
