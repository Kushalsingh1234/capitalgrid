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
    // Load concrete slab assets
    this.load.image('iso-block', '/assets/terrain/iso-block.png?v=3');
    this.load.image('iso-shadow', '/assets/terrain/iso-shadow.png?v=3');

    // Load buildable plot variant assets (Phase 33C)
    this.load.image('plot_grass', '/assets/plots/plot_grass.png?v=3');
    this.load.image('plot_flowers', '/assets/plots/plot_flowers.png?v=3');
    this.load.image('plot_hedge', '/assets/plots/plot_hedge.png?v=3');
    this.load.image('plot_tree', '/assets/plots/plot_tree.png?v=3');
    this.load.image('plot_stone', '/assets/plots/plot_stone.png?v=3');
    this.load.image('plot_shrubs', '/assets/plots/plot_shrubs.png?v=3');
    this.load.image('plot_flower-island', '/assets/plots/plot_flower_island.png?v=3');
    this.load.image('plot_landscaped', '/assets/plots/plot_landscaped.png?v=3');
    this.load.image('plot_mixed', '/assets/plots/plot_mixed.png?v=3');
    this.load.image('plot_premium', '/assets/plots/plot_premium.png?v=3');
    this.load.image('plot_fountain', '/assets/plots/plot_fountain.png?v=3');

    // Load 3D isometric building assets (Phase 33D centerpiece, corporate HQ & CGN HQ)
    this.load.image('building_farming', '/assets/buildings/building_farming.png?v=3');
    this.load.image('building_mining', '/assets/buildings/building_mining.png?v=3');
    this.load.image('building_factory', '/assets/buildings/building_factory.png?v=3');
    this.load.image('building_retail', '/assets/buildings/building_retail.png?v=3');
    this.load.image('building_corporate', '/assets/buildings/building_corporate.png?v=3');
    this.load.image('building_cgn', '/assets/buildings/building_cgn.png?v=3');
    this.load.image('building_stock_exchange', '/assets/buildings/building_stock_exchange.png?v=3');
    this.load.image('building_house', '/assets/buildings/building_house.png?v=3');
    this.load.image('building_multicomplex', '/assets/buildings/building_multicomplex.png?v=3');
    this.load.image('building_terminal', '/assets/buildings/building_terminal.png?v=5');
    this.load.image('building_fountain', '/assets/buildings/building_fountain.png?v=3');

    // Load modern metro road network assets (Phase 36)
    this.load.image('road_v', '/assets/terrain/road_v.png?v=3');
    this.load.image('road_h', '/assets/terrain/road_h.png?v=3');
    this.load.image('road_intersection', '/assets/terrain/road_intersection.png?v=3');
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
        const road = this.add.image(rx, ry, 'road_v').setScale(0.5);
        road.setDepth(r + c + 0.5); // Fractional depth to interleave between block rows
        this.groundLayer.add(road);
      }
    }

    // Horizontal road segments (parallel to row axis)
    for (let r = 0; r < GRID_ROWS - 1; r++) {
      for (let c = 0; c < GRID_COLS; c++) {
        const rx = (getX(r, c) + getX(r + 1, c)) / 2;
        const ry = (getY(r, c) + getY(r + 1, c)) / 2;
        const road = this.add.image(rx, ry, 'road_h').setScale(0.5);
        road.setDepth(r + c + 0.5); // Fractional depth to interleave between block rows
        this.groundLayer.add(road);
      }
    }

    // Intersection cross road segments (at crossing centers)
    for (let r = 0; r < GRID_ROWS - 1; r++) {
      for (let c = 0; c < GRID_COLS - 1; c++) {
        const rx = (getX(r, c) + getX(r + 1, c + 1)) / 2;
        const ry = (getY(r, c) + getY(r + 1, c + 1)) / 2;
        const road = this.add.image(rx, ry, 'road_intersection').setScale(0.5);
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

    this.hasZoomedManually = false;
    this.isResizing = false;

    // Set initial responsive zoom and centering
    this.handleResize();

    // Register ResizeObserver on parent container to capture layout changes and React mounts
    const parent = this.scale.parent;
    if (parent) {
      this.resizeObserver = new ResizeObserver(() => {
        this.handleResize();
      });
      this.resizeObserver.observe(parent);
    }

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
      this.hasZoomedManually = false;
    };

    window.addEventListener('center-player-building', handleCenterEvent);
    this.events.once('shutdown', () => {
      window.removeEventListener('center-player-building', handleCenterEvent);
      if (this.resizeObserver) {
        this.resizeObserver.disconnect();
      }
    });
  }

  /**
   * Resizes viewport zoom dynamically to ensure entire grid remains visible on mobile/desktop.
   */
  handleResize() {
    if (this.isResizing) return;

    const parent = this.scale.parent;
    if (!parent) return;

    const dpr = window.devicePixelRatio || 1;
    const targetWidth = parent.clientWidth * dpr;
    const targetHeight = parent.clientHeight * dpr;

    // Prevent rendering or resizing if layout measurements are not yet settled
    if (targetWidth <= 0 || targetHeight <= 0) return;

    // Resize Phaser's canvas container to physical device resolution bounds
    if (this.scale.width !== targetWidth || this.scale.height !== targetHeight) {
      this.isResizing = true;
      this.scale.resize(targetWidth, targetHeight);
      this.isResizing = false;
    }

    // Convert dimensions back to logical game units for layout math
    const logicalWidth = targetWidth / dpr;
    const logicalHeight = targetHeight / dpr;

    // Generous padding margins to account for top/bottom HUD overlay offsets and edge decorations
    const paddingX = 240;
    const paddingY = 320;
    const zoomX = logicalWidth / (this.terrainWidth + paddingX);
    const zoomY = logicalHeight / (this.terrainHeight + paddingY);

    // Minimum clamp set to 0.05 to prevent grid edge cutoff on vertical mobile aspect ratios
    let defaultZoom = Phaser.Math.Clamp(Math.min(zoomX, zoomY), 0.05, 1.5);

    // Multiply logical camera zoom by DPR so sprites map exactly 1-to-1 with screen physical pixels
    defaultZoom = defaultZoom * dpr;

    // Mobile/similar screens: increase default zoom by 121% total (8% more than before) to zoom in closer
    if (window.innerWidth < 768) {
      defaultZoom = defaultZoom * 2.21;
    }

    this.defaultZoom = defaultZoom;

    // Lock initial or current zoom factor if the user has not manually zoomed
    if (!this.hasZoomedManually) {
      this.targetZoom = defaultZoom;
      this.cameras.main.setZoom(defaultZoom);
    }

    // Centered scroll coordinates are computed in physical viewport space
    this.targetScrollX = this.focusX - this.scale.width / 2;
    this.targetScrollY = this.focusY - this.scale.height / 2;
    
    this.cameras.main.scrollX = this.targetScrollX;
    this.cameras.main.scrollY = this.targetScrollY;
  }

  handlePointerDown(pointer) {
    if (pointer.rightButtonDown()) return;
    this.isPointerDown = true;
    this.startX = pointer.x;
    this.startY = pointer.y;
    this.startScrollX = this.cameras.main.scrollX;
    this.startScrollY = this.cameras.main.scrollY;
    this.isDragging = false;
  }

  handlePointerMove(pointer) {
    if (this.isPointerDown && window.innerWidth < 768) {
      const dx = pointer.x - this.startX;
      const dy = pointer.y - this.startY;

      // Classify as dragging if displacement is greater than small threshold
      if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
        this.isDragging = true;
      }

      if (this.isDragging) {
        this.hasZoomedManually = true; // Lock auto-centering

        const zoom = this.cameras.main.zoom;
        this.targetScrollX = this.startScrollX - dx / zoom;
        this.targetScrollY = this.startScrollY - dy / zoom;

        // Clamp scroll coordinate bounds to prevent sliding off the map area
        const viewW = this.scale.width / zoom;
        const viewH = this.scale.height / zoom;
        const minFocalX = this.focusX - this.terrainWidth / 2 - 200;
        const maxFocalX = this.focusX + this.terrainWidth / 2 + 200;
        const minFocalY = this.focusY - this.terrainHeight / 2 - 200;
        const maxFocalY = this.focusY + this.terrainHeight / 2 + 200;

        const minScrollX = minFocalX - viewW / 2;
        const maxScrollX = maxFocalX - viewW / 2;
        const minScrollY = minFocalY - viewH / 2;
        const maxScrollY = maxFocalY - viewH / 2;

        this.targetScrollX = Phaser.Math.Clamp(this.targetScrollX, minScrollX, maxScrollX);
        this.targetScrollY = Phaser.Math.Clamp(this.targetScrollY, minScrollY, maxScrollY);

        // Apply scroll offset instantly for dragging responsiveness
        this.cameras.main.scrollX = this.targetScrollX;
        this.cameras.main.scrollY = this.targetScrollY;
      }
    }

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
    this.hasZoomedManually = true;
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

    // Centered scroll coordinates are based on physical viewport dimensions when not manually zoomed or dragged
    if (!this.hasZoomedManually) {
      this.targetScrollX = this.focusX - this.scale.width / 2;
      this.targetScrollY = this.focusY - this.scale.height / 2;
    }

    // Smooth scroll interpolation (lerp)
    const lerpScroll = 0.12;
    this.cameras.main.scrollX = Phaser.Math.Linear(this.cameras.main.scrollX, this.targetScrollX, lerpScroll);
    this.cameras.main.scrollY = Phaser.Math.Linear(this.cameras.main.scrollY, this.targetScrollY, lerpScroll);
  }
}
