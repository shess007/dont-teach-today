// RECESS REVENGE - Visual Effects

/**
 * Splat effect when egg hits something
 */
class Splat {
    constructor(x, y, container) {
        this.x = x;
        this.y = y;
        this.container = container;
        this.sprite = null;
        this.lifetime = CONFIG.EGG.SPLAT_DURATION;
        this.age = 0;

        this.createSprite();
    }

    /**
     * Create splat sprite
     */
    createSprite() {
        const graphics = new PIXI.Graphics();

        // Draw irregular splat shape (yellow egg yolk splatter)
        graphics.beginFill(CONFIG.COLORS.EGG_SPLAT, 0.8);

        // Main splat body (irregular circle)
        graphics.drawCircle(0, 0, 20);

        // Add some splatter droplets around it
        graphics.drawCircle(15, -10, 8);
        graphics.drawCircle(-12, 8, 6);
        graphics.drawCircle(10, 12, 7);
        graphics.drawCircle(-15, -5, 5);
        graphics.drawCircle(5, -15, 6);

        graphics.endFill();

        this.sprite = graphics;
        this.sprite.x = this.x;
        this.sprite.y = this.y;
        this.sprite.rotation = Math.random() * Math.PI * 2; // Random rotation

        this.container.addChild(this.sprite);
    }

    /**
     * Update splat (fade out over time)
     */
    update(deltaTime) {
        this.age += deltaTime;

        // Fade out gradually
        const fadePercent = 1 - (this.age / this.lifetime);
        this.sprite.alpha = Math.max(0, fadePercent * 0.8);

        return this.age < this.lifetime;
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
 * Screen shake effect
 */
class ScreenShake {
    constructor(container, intensity = 10, duration = 0.3) {
        this.container = container;
        this.intensity = intensity;
        this.duration = duration;
        this.elapsed = 0;
        this.originalX = container.x;
        this.originalY = container.y;
    }

    /**
     * Update shake effect
     */
    update(deltaTime) {
        this.elapsed += deltaTime;

        if (this.elapsed < this.duration) {
            // Apply random shake within intensity bounds
            const shakeAmount = this.intensity * (1 - this.elapsed / this.duration);
            this.container.x = this.originalX + (Math.random() - 0.5) * shakeAmount * 2;
            this.container.y = this.originalY + (Math.random() - 0.5) * shakeAmount * 2;
            return true; // Still active
        } else {
            // Reset to original position
            this.container.x = this.originalX;
            this.container.y = this.originalY;
            return false; // Finished
        }
    }

    /**
     * Stop shake immediately
     */
    stop() {
        this.container.x = this.originalX;
        this.container.y = this.originalY;
    }
}

/**
 * Impact particles effect
 */
class ImpactParticles {
    constructor(x, y, container, color = 0xffff00) {
        this.x = x;
        this.y = y;
        this.container = container;
        this.color = color;
        this.particles = [];
        this.lifetime = 0.5; // seconds
        this.age = 0;

        this.createParticles();
    }

    /**
     * Create particle sprites
     */
    createParticles() {
        const particleCount = 8;

        for (let i = 0; i < particleCount; i++) {
            const angle = (Math.PI * 2 * i) / particleCount;
            const speed = 100 + Math.random() * 100; // pixels per second

            const particle = {
                sprite: new PIXI.Graphics(),
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 1.0
            };

            // Draw small circle for particle
            particle.sprite.beginFill(this.color);
            particle.sprite.drawCircle(0, 0, 4);
            particle.sprite.endFill();
            particle.sprite.x = this.x;
            particle.sprite.y = this.y;

            this.container.addChild(particle.sprite);
            this.particles.push(particle);
        }
    }

    /**
     * Update particles
     */
    update(deltaTime) {
        this.age += deltaTime;

        for (const particle of this.particles) {
            // Update position
            particle.sprite.x += particle.vx * deltaTime;
            particle.sprite.y += particle.vy * deltaTime;

            // Apply gravity
            particle.vy += 400 * deltaTime;

            // Fade out
            particle.life = 1 - (this.age / this.lifetime);
            particle.sprite.alpha = Math.max(0, particle.life);
        }

        return this.age < this.lifetime;
    }

    /**
     * Cleanup
     */
    destroy() {
        for (const particle of this.particles) {
            this.container.removeChild(particle.sprite);
            particle.sprite.destroy();
        }
        this.particles = [];
    }
}
