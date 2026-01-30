// RECESS REVENGE - Projectile (Eggs)

class Projectile {
    constructor(startX, startY, targetX, targetY, container) {
        this.container = container;

        // Starting position
        this.startX = startX;
        this.startY = startY;

        // Target position
        this.targetX = targetX;
        this.targetY = targetY;

        // Current position
        this.x = startX;
        this.y = startY;

        // Calculate trajectory
        this.calculateTrajectory();

        // Flight progress (0 to 1)
        this.progress = 0;

        // Flight duration in seconds (based on distance)
        const distance = Utils.distance(startX, startY, targetX, targetY);
        this.flightDuration = distance / CONFIG.EGG.SPEED;

        // State
        this.isActive = true;
        this.hasLanded = false;

        // Visual
        this.sprite = null;
        this.createSprite();
    }

    /**
     * Calculate parabolic trajectory
     */
    calculateTrajectory() {
        // Calculate horizontal and vertical distances
        this.deltaX = this.targetX - this.startX;
        this.deltaY = this.targetY - this.startY;

        // Arc height (egg goes up then down)
        this.arcHeight = CONFIG.EGG.ARC_HEIGHT;
    }

    /**
     * Get position along parabolic arc at progress t (0 to 1)
     */
    getPositionAtProgress(t) {
        // Linear horizontal movement
        const x = this.startX + this.deltaX * t;

        // Parabolic vertical movement (arc)
        // Uses formula: y = start + (end - start) * t - arcHeight * 4 * t * (1 - t)
        // This creates an arc that peaks at t=0.5
        const linearY = this.startY + this.deltaY * t;
        const arcOffset = this.arcHeight * 4 * t * (1 - t);
        const y = linearY - arcOffset;

        return { x, y };
    }

    /**
     * Create egg sprite
     */
    createSprite() {
        const graphics = new PIXI.Graphics();

        // Draw egg (small yellow circle)
        graphics.beginFill(CONFIG.COLORS.EGG);
        graphics.drawCircle(0, 0, CONFIG.EGG.HITBOX_RADIUS);
        graphics.endFill();

        this.sprite = graphics;
        this.sprite.x = this.x;
        this.sprite.y = this.y;

        this.container.addChild(this.sprite);
    }

    /**
     * Update projectile
     */
    update(deltaTime) {
        if (!this.isActive) return;

        // Update flight progress
        this.progress += deltaTime / this.flightDuration;

        // Check if landed
        if (this.progress >= 1.0) {
            this.progress = 1.0;
            this.hasLanded = true;
            this.isActive = false;
        }

        // Update position along arc
        const pos = this.getPositionAtProgress(this.progress);
        this.x = pos.x;
        this.y = pos.y;

        // Update sprite position
        if (this.sprite) {
            this.sprite.x = this.x;
            this.sprite.y = this.y;
        }
    }

    /**
     * Get current position
     */
    getPosition() {
        return { x: this.x, y: this.y };
    }

    /**
     * Get hitbox radius
     */
    getHitboxRadius() {
        return CONFIG.EGG.HITBOX_RADIUS;
    }

    /**
     * Check if projectile is still active
     */
    isProjectileActive() {
        return this.isActive;
    }

    /**
     * Get landing position
     */
    getLandingPosition() {
        return { x: this.targetX, y: this.targetY };
    }

    /**
     * Cleanup
     */
    destroy() {
        if (this.sprite) {
            this.container.removeChild(this.sprite);
            this.sprite.destroy();
        }
        this.isActive = false;
    }
}
