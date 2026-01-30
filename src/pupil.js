// RECESS REVENGE - Pupil (Player 2)

class Pupil {
    constructor(container, input) {
        this.container = container;
        this.input = input;

        // Egg inventory
        this.eggCount = CONFIG.PUPIL.STARTING_EGGS;
        this.maxEggs = CONFIG.PUPIL.MAX_EGGS;

        // Cooldown system
        this.throwCooldown = 0;
        this.canThrow = true;

        // Crosshair position (follows mouse)
        this.crosshairX = CONFIG.SCREEN.WIDTH / 2;
        this.crosshairY = CONFIG.SCREEN.HEIGHT / 2;

        // Visual elements
        this.crosshairSprite = null;
        this.trajectoryGraphics = null;

        this.createCrosshair();
        this.createTrajectoryPreview();
    }

    /**
     * Create crosshair sprite
     */
    createCrosshair() {
        const graphics = new PIXI.Graphics();

        // Draw crosshair (red circle with cross)
        graphics.lineStyle(2, CONFIG.COLORS.CROSSHAIR, 1);

        // Outer circle
        graphics.drawCircle(0, 0, 12);

        // Cross lines
        graphics.moveTo(-16, 0);
        graphics.lineTo(-4, 0);
        graphics.moveTo(4, 0);
        graphics.lineTo(16, 0);
        graphics.moveTo(0, -16);
        graphics.lineTo(0, -4);
        graphics.moveTo(0, 4);
        graphics.lineTo(0, 16);

        // Center dot
        graphics.beginFill(CONFIG.COLORS.CROSSHAIR);
        graphics.drawCircle(0, 0, 2);
        graphics.endFill();

        this.crosshairSprite = graphics;
        this.container.addChild(this.crosshairSprite);
    }

    /**
     * Create trajectory preview graphics
     */
    createTrajectoryPreview() {
        this.trajectoryGraphics = new PIXI.Graphics();
        this.container.addChild(this.trajectoryGraphics);
    }

    /**
     * Update pupil state
     */
    update(deltaTime, teacher) {
        // Update cooldown
        if (this.throwCooldown > 0) {
            this.throwCooldown -= deltaTime;
            if (this.throwCooldown <= 0) {
                this.throwCooldown = 0;
                this.canThrow = true;
            }
        }

        // Update crosshair position from mouse
        const mousePos = this.input.getMousePosition();
        this.crosshairX = mousePos.x;
        this.crosshairY = mousePos.y;

        // Update crosshair sprite position
        if (this.crosshairSprite) {
            this.crosshairSprite.x = this.crosshairX;
            this.crosshairSprite.y = this.crosshairY;
        }

        // Draw trajectory preview
        this.drawTrajectoryPreview();

        // Check for throw input and return projectile if created
        if (this.input.wasMouseClicked()) {
            return this.tryThrowEgg();
        }

        return null;
    }

    /**
     * Draw trajectory preview arc
     */
    drawTrajectoryPreview() {
        if (!this.trajectoryGraphics) return;

        // Clear previous preview
        this.trajectoryGraphics.clear();

        // Only show preview if we have eggs and can throw
        if (this.eggCount <= 0 || !this.canThrow) return;

        // Calculate trajectory points
        const startX = CONFIG.SCREEN.WIDTH / 2; // Eggs come from center/top
        const startY = 0;
        const targetX = this.crosshairX;
        const targetY = this.crosshairY;

        // Draw dashed arc line using simple circles
        const numPoints = 15;

        for (let i = 0; i <= numPoints; i++) {
            const t = i / numPoints;
            const pos = this.calculateArcPosition(startX, startY, targetX, targetY, t);

            // Draw small circles along the path (creates dashed effect)
            this.trajectoryGraphics.beginFill(CONFIG.COLORS.TRAJECTORY, 0.6);
            this.trajectoryGraphics.drawCircle(pos.x, pos.y, 3);
            this.trajectoryGraphics.endFill();
        }
    }

    /**
     * Calculate position on arc (same formula as Projectile)
     */
    calculateArcPosition(startX, startY, targetX, targetY, t) {
        const deltaX = targetX - startX;
        const deltaY = targetY - startY;
        const arcHeight = CONFIG.EGG.ARC_HEIGHT;

        const x = startX + deltaX * t;
        const linearY = startY + deltaY * t;
        const arcOffset = arcHeight * 4 * t * (1 - t);
        const y = linearY - arcOffset;

        return { x, y };
    }

    /**
     * Attempt to throw an egg
     */
    tryThrowEgg() {
        // Check if we can throw
        if (!this.canThrow) {
            console.log('Egg throw on cooldown');
            return null;
        }

        if (this.eggCount <= 0) {
            console.log('No eggs left!');
            return null;
        }

        // Create projectile
        const startX = CONFIG.SCREEN.WIDTH / 2;
        const startY = 0;
        const targetX = this.crosshairX;
        const targetY = this.crosshairY;

        const projectile = new Projectile(startX, startY, targetX, targetY, this.container);

        // Consume egg and start cooldown
        this.eggCount--;
        this.canThrow = false;
        this.throwCooldown = CONFIG.PUPIL.EGG_COOLDOWN;

        console.log(`Egg thrown! ${this.eggCount} eggs remaining`);

        return projectile;
    }

    /**
     * Add eggs to inventory (from chicken coop)
     */
    addEgg() {
        if (this.eggCount < this.maxEggs) {
            this.eggCount++;
            console.log(`Egg refilled! ${this.eggCount}/${this.maxEggs} eggs`);
            return true;
        }
        return false;
    }

    /**
     * Get egg count
     */
    getEggCount() {
        return this.eggCount;
    }

    /**
     * Get cooldown status
     */
    getCooldownPercent() {
        return this.throwCooldown / CONFIG.PUPIL.EGG_COOLDOWN;
    }

    /**
     * Check if can throw
     */
    canThrowEgg() {
        return this.canThrow && this.eggCount > 0;
    }

    /**
     * Cleanup
     */
    destroy() {
        if (this.crosshairSprite) {
            this.container.removeChild(this.crosshairSprite);
            this.crosshairSprite.destroy();
        }
        if (this.trajectoryGraphics) {
            this.container.removeChild(this.trajectoryGraphics);
            this.trajectoryGraphics.destroy();
        }
    }
}
