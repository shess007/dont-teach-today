// RECESS REVENGE - Obstacles

// Textures loaded via preloadObstacleAssets()
const TREE_TEXTURES = [];
let BUSH_TEXTURE = null;
let BENCH_TEXTURE = null;
let COOP_TEXTURE = null;

async function preloadObstacleAssets() {
    const treePaths = ['assets/models/tree1.png', 'assets/models/tree2.png'];
    for (const path of treePaths) {
        const texture = await PIXI.Assets.load(path);
        TREE_TEXTURES.push(texture);
    }
    BUSH_TEXTURE = await PIXI.Assets.load('assets/models/bush1.png');
    BENCH_TEXTURE = await PIXI.Assets.load('assets/models/bench1.png');
    COOP_TEXTURE = await PIXI.Assets.load('assets/models/chicken-coop.png');
    await PIXI.Assets.load('assets/models/schoolyard-tile.png');
    Utils.log(`Loaded obstacle textures`);
}

class Obstacle {
    constructor(type, x, y, container) {
        this.type = type;
        this.x = x;
        this.y = y;
        this.container = container;

        // Get config for this type
        const config = CONFIG.OBSTACLES[type];
        this.width = config.WIDTH;
        this.height = config.HEIGHT;
        this.canHide = config.CAN_HIDE || false;
        this.color = config.COLOR;

        // Visual
        this.sprite = null;
        this.createSprite();
    }

    /**
     * Create pixel art obstacle sprite
     */
    createSprite() {
        if (this.type === 'BUSH' && BUSH_TEXTURE) {
            // Use bush PNG texture, scaled proportionally to fit height
            const sprite = new PIXI.Sprite(BUSH_TEXTURE);
            const scale = this.height / BUSH_TEXTURE.height;
            sprite.width = BUSH_TEXTURE.width * scale;
            sprite.height = this.height;
            this.width = sprite.width;
            this.sprite = sprite;
        } else if (this.type === 'BENCH' && BENCH_TEXTURE) {
            // Use bench PNG texture, scaled proportionally to fit height
            const sprite = new PIXI.Sprite(BENCH_TEXTURE);
            const scale = this.height / BENCH_TEXTURE.height;
            sprite.width = BENCH_TEXTURE.width * scale;
            sprite.height = this.height;
            this.width = sprite.width;
            this.sprite = sprite;
        } else if (this.type === 'CHICKEN_COOP' && COOP_TEXTURE) {
            // Use chicken coop PNG texture, scaled proportionally to fit height
            const sprite = new PIXI.Sprite(COOP_TEXTURE);
            const scale = this.height / COOP_TEXTURE.height;
            sprite.width = COOP_TEXTURE.width * scale;
            sprite.height = this.height;
            this.width = sprite.width;
            this.sprite = sprite;
        } else if (this.type === 'TREE' && TREE_TEXTURES.length > 0) {
            // Use a random tree PNG texture, scaled proportionally to fit height
            const texture = TREE_TEXTURES[Math.floor(Math.random() * TREE_TEXTURES.length)];
            const sprite = new PIXI.Sprite(texture);
            const scale = this.height / texture.height;
            sprite.width = texture.width * scale;
            sprite.height = this.height;
            // Update collision width to match the displayed sprite
            this.width = sprite.width;
            this.sprite = sprite;
        } else {
            const graphics = new PIXI.Graphics();

            switch (this.type) {
                case 'BUSH':
                    this.drawBush(graphics);
                    break;
                case 'BENCH':
                    this.drawBench(graphics);
                    break;
                case 'TREE':
                    this.drawTree(graphics);
                    break;
                case 'SWING_SET':
                    this.drawSwingSet(graphics);
                    break;
                case 'CHICKEN_COOP':
                    this.drawChickenCoop(graphics);
                    break;
                default:
                    graphics.beginFill(this.color);
                    graphics.drawRect(0, 0, this.width, this.height);
                    graphics.endFill();
            }

            this.sprite = graphics;
        }

        this.sprite.x = this.x;
        this.sprite.y = this.y;

        this.container.addChild(this.sprite);
    }

    /**
     * Draw pixel art bush
     */
    drawBush(graphics) {
        // Dark green bush with foliage texture
        graphics.beginFill(0x1a5f1a);
        graphics.drawRect(5, 10, 50, 45);
        graphics.endFill();

        // Lighter green highlights
        graphics.beginFill(this.color);
        graphics.drawRect(10, 15, 15, 15);
        graphics.drawRect(30, 15, 15, 15);
        graphics.drawRect(20, 30, 20, 15);
        graphics.endFill();

        // Very light highlights
        graphics.beginFill(0x4CAF50);
        graphics.drawRect(15, 20, 8, 8);
        graphics.drawRect(35, 20, 8, 8);
        graphics.endFill();
    }

    /**
     * Draw pixel art bench
     */
    drawBench(graphics) {
        // Seat (brown)
        graphics.beginFill(this.color);
        graphics.drawRect(0, 20, 80, 10);
        graphics.endFill();

        // Backrest
        graphics.beginFill(this.color);
        graphics.drawRect(5, 5, 5, 20);
        graphics.drawRect(35, 5, 5, 20);
        graphics.drawRect(70, 5, 5, 20);
        graphics.endFill();

        // Legs
        graphics.beginFill(0x654321);
        graphics.drawRect(10, 30, 8, 10);
        graphics.drawRect(60, 30, 8, 10);
        graphics.endFill();
    }

    /**
     * Draw pixel art tree
     */
    drawTree(graphics) {
        // Trunk (brown)
        graphics.beginFill(0x654321);
        graphics.drawRect(15, 30, 20, 50);
        graphics.endFill();

        // Foliage (dark green base)
        graphics.beginFill(0x1a5f1a);
        graphics.drawRect(0, 10, 50, 35);
        graphics.endFill();

        // Lighter green highlights
        graphics.beginFill(0x228B22);
        graphics.drawRect(5, 15, 40, 25);
        graphics.endFill();

        // Brightest highlights
        graphics.beginFill(0x32CD32);
        graphics.drawRect(15, 20, 20, 15);
        graphics.endFill();
    }

    /**
     * Draw pixel art swing set
     */
    drawSwingSet(graphics) {
        // Frame (silver/gray)
        graphics.beginFill(this.color);
        graphics.drawRect(10, 0, 8, 100);  // Left pole
        graphics.drawRect(82, 0, 8, 100);  // Right pole
        graphics.drawRect(10, 0, 80, 8);   // Top bar
        graphics.endFill();

        // Swings (chains and seats)
        graphics.beginFill(0x666666);
        graphics.drawRect(30, 8, 2, 60);   // Left chain
        graphics.drawRect(68, 8, 2, 60);   // Right chain
        graphics.endFill();

        graphics.beginFill(this.color);
        graphics.drawRect(25, 68, 12, 6);  // Left seat
        graphics.drawRect(63, 68, 12, 6);  // Right seat
        graphics.endFill();
    }

    /**
     * Draw pixel art chicken coop
     */
    drawChickenCoop(graphics) {
        // Main structure (red/crimson)
        graphics.beginFill(this.color);
        graphics.drawRect(0, 20, 80, 50);
        graphics.endFill();

        // Roof (darker red)
        graphics.beginFill(0x8B0000);
        graphics.drawRect(0, 10, 10, 15);
        graphics.drawRect(10, 5, 10, 20);
        graphics.drawRect(20, 0, 40, 25);
        graphics.drawRect(60, 5, 10, 20);
        graphics.drawRect(70, 10, 10, 15);
        graphics.endFill();

        // Door (brown)
        graphics.beginFill(0x654321);
        graphics.drawRect(30, 35, 20, 30);
        graphics.endFill();

        // Window (yellow - light from inside)
        graphics.beginFill(0xFFFF00);
        graphics.drawRect(10, 30, 12, 12);
        graphics.endFill();

        // Chicken silhouette in window
        graphics.beginFill(0xFFFFFF);
        graphics.drawRect(14, 34, 4, 4);
        graphics.endFill();
    }

    /**
     * Check if point is inside obstacle
     */
    containsPoint(x, y) {
        return x >= this.x && x <= this.x + this.width &&
               y >= this.y && y <= this.y + this.height;
    }

    /**
     * Cleanup
     */
    destroy() {
        if (this.sprite) {
            this.container.removeChild(this.sprite);
            this.sprite.destroy();
        }
    }
}

/**
 * Create obstacles for the schoolyard
 * Returns array of Obstacle objects
 */
async function createObstacles(container) {
    const obstacles = [];

    // Screen dimensions
    const width = CONFIG.SCREEN.WIDTH;
    const height = CONFIG.SCREEN.HEIGHT;

    // Helper to check if position overlaps with existing obstacles or spawn/goal areas
    const isValidPosition = (x, y, w, h) => {
        // Check spawn area (left side)
        if (x < 200) return false;

        // Check goal area (right side)
        if (x + w > width - 200) return false;

        // Check top/bottom edges
        if (y < 50 || y + h > height - 50) return false;

        // Check overlap with existing obstacles
        for (const obs of obstacles) {
            if (!(x + w < obs.x || x > obs.x + obs.width ||
                  y + h < obs.y || y > obs.y + obs.height)) {
                return false;
            }
        }

        return true;
    };

    // Load obstacle positions from level.json (embedded at build time or fetched)
    let levelData;
    try {
        const response = await fetch('src/shared/level.json');
        levelData = await response.json();
    } catch (e) {
        console.warn('Failed to load level.json, using empty layout');
        levelData = { obstacles: [] };
    }

    for (const entry of levelData.obstacles) {
        const cfg = CONFIG.OBSTACLES[entry.type];
        if (cfg && isValidPosition(entry.x, entry.y, cfg.WIDTH, cfg.HEIGHT)) {
            obstacles.push(new Obstacle(entry.type, entry.x, entry.y, container));
        }
    }

    Utils.log(`Created ${obstacles.length} obstacles`);
    return obstacles;
}
