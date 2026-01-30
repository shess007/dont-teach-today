// RECESS REVENGE - Obstacles

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
     * Create obstacle sprite
     */
    createSprite() {
        const graphics = new PIXI.Graphics();

        // Draw rectangle with type color
        graphics.beginFill(this.color);
        graphics.drawRect(0, 0, this.width, this.height);
        graphics.endFill();

        // Add border for visibility
        graphics.lineStyle(2, 0x000000, 0.3);
        graphics.drawRect(0, 0, this.width, this.height);

        this.sprite = graphics;
        this.sprite.x = this.x;
        this.sprite.y = this.y;

        this.container.addChild(this.sprite);
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
function createObstacles(container) {
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

    // Add chicken coop (top or bottom edge)
    const coopY = Math.random() < 0.5 ? 20 : height - 100;
    const coopX = width / 2 - 40;
    obstacles.push(new Obstacle('CHICKEN_COOP', coopX, coopY, container));

    // Add bushes (can hide in these)
    const bushPositions = [
        { x: 350, y: 200 },
        { x: 600, y: 400 },
        { x: 450, y: 550 },
        { x: 800, y: 150 },
        { x: 700, y: 500 }
    ];

    for (const pos of bushPositions) {
        if (isValidPosition(pos.x, pos.y, 60, 60)) {
            obstacles.push(new Obstacle('BUSH', pos.x, pos.y, container));
        }
    }

    // Add benches
    const benchPositions = [
        { x: 400, y: 350 },
        { x: 650, y: 250 },
        { x: 500, y: 150 }
    ];

    for (const pos of benchPositions) {
        if (isValidPosition(pos.x, pos.y, 80, 40)) {
            obstacles.push(new Obstacle('BENCH', pos.x, pos.y, container));
        }
    }

    // Add trees
    const treePositions = [
        { x: 300, y: 450 },
        { x: 850, y: 350 },
        { x: 550, y: 80 }
    ];

    for (const pos of treePositions) {
        if (isValidPosition(pos.x, pos.y, 50, 80)) {
            obstacles.push(new Obstacle('TREE', pos.x, pos.y, container));
        }
    }

    // Add swing set
    if (isValidPosition(750, 500, 100, 120)) {
        obstacles.push(new Obstacle('SWING_SET', 750, 500, container));
    }

    console.log(`Created ${obstacles.length} obstacles`);
    return obstacles;
}
