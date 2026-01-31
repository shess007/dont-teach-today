// RECESS REVENGE - Pupil (Player 2)

let PUPIL_SPRITESHEET = null;
let PUPIL_SPRITESHEET_LOADED = false;

async function preloadPupilAssets() {
    try {
        PUPIL_SPRITESHEET = await PIXI.Assets.load('assets/models/pupil-spritesheet.json');
        PUPIL_SPRITESHEET_LOADED = true;
        Utils.log('Pupil spritesheet loaded successfully');
    } catch (error) {
        console.warn('Failed to load pupil spritesheet, using fallback graphics:', error);
        PUPIL_SPRITESHEET_LOADED = false;
    }
}

class Pupil {
    constructor(container, input, audio = null) {
        this.container = container;
        this.input = input;
        this.audio = audio;

        // Egg inventory
        this.eggCount = CONFIG.PUPIL.STARTING_EGGS;
        this.maxEggs = CONFIG.PUPIL.MAX_EGGS;

        // Cooldown system
        this.throwCooldown = 0;
        this.canThrow = true;

        // Refill system
        this.isRefilling = false;
        this.refillTimer = 0;
        this.chickenCoop = null; // Reference to chicken coop obstacle

        // Crosshair position (follows mouse)
        this.crosshairX = CONFIG.SCREEN.WIDTH / 2;
        this.crosshairY = CONFIG.SCREEN.HEIGHT / 2;

        // Visual elements
        this.crosshairSprite = null;
        this.trajectoryGraphics = null;

        // Animation state
        this.currentAnimation = 'idle';
        this.pupilSprite = null; // The visible pupil character sprite in bottom-right

        this.createCrosshair();
        this.createTrajectoryPreview();
        this.createPupilSprite();
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
     * Create pupil character sprite in bottom-right corner
     */
    createPupilSprite() {
        if (PUPIL_SPRITESHEET_LOADED && PUPIL_SPRITESHEET) {
            try {
                const textures = PUPIL_SPRITESHEET.animations.idle;
                this.pupilSprite = new PIXI.AnimatedSprite(textures);
                this.pupilSprite.anchor.set(0.5, 0.5);
                this.pupilSprite.animationSpeed = 0.1;
                this.pupilSprite.loop = true;
                this.pupilSprite.play();

                // Position in bottom-right corner
                this.pupilSprite.x = CONFIG.SCREEN.WIDTH - 60;
                this.pupilSprite.y = CONFIG.SCREEN.HEIGHT - 60;

                this.container.addChild(this.pupilSprite);
                Utils.log('Created animated pupil sprite');
                return;
            } catch (error) {
                console.warn('Failed to create animated pupil sprite:', error);
            }
        }
        // No fallback needed - pupil was previously invisible
    }

    /**
     * Set pupil animation
     */
    setPupilAnimation(animName) {
        if (!this.pupilSprite || !this.pupilSprite.textures || !PUPIL_SPRITESHEET_LOADED) return;
        if (this.currentAnimation === animName) return;

        this.currentAnimation = animName;
        const newTextures = PUPIL_SPRITESHEET.animations[animName];
        if (newTextures) {
            this.pupilSprite.textures = newTextures;
            this.pupilSprite.animationSpeed = animName === 'throw' ? 0.2 : 0.1;
            this.pupilSprite.loop = animName !== 'throw';
            this.pupilSprite.play();

            if (animName === 'throw') {
                this.pupilSprite.onComplete = () => {
                    this.setPupilAnimation('idle');
                };
            }
        }
    }

    /**
     * Celebrate animation (public method)
     */
    celebrate() {
        this.setPupilAnimation('celebrate');
        // Return to idle after 2 seconds
        setTimeout(() => this.setPupilAnimation('idle'), 2000);
    }

    /**
     * Update pupil state
     */
    update(deltaTime, teacher, obstacles = []) {
        // Update cooldown
        if (this.throwCooldown > 0) {
            this.throwCooldown -= deltaTime;
            if (this.throwCooldown <= 0) {
                this.throwCooldown = 0;
                this.canThrow = true;
            }
        }

        // Update refill timer
        if (this.isRefilling) {
            this.refillTimer -= deltaTime;
            if (this.refillTimer <= 0) {
                this.completeRefill();
            }
        }

        // Find chicken coop in obstacles (do this once per update)
        this.chickenCoop = obstacles.find(obs => obs.type === 'CHICKEN_COOP');

        // Update crosshair position from mouse (restricted to danger zone)
        const mousePos = this.input.getMousePosition();
        const safeZoneX = CONFIG.TEACHER.SPAWN_X + 40;
        this.crosshairX = Math.max(mousePos.x, safeZoneX);
        this.crosshairY = mousePos.y;

        // Update crosshair sprite position and color
        if (this.crosshairSprite) {
            this.crosshairSprite.x = this.crosshairX;
            this.crosshairSprite.y = this.crosshairY;

            // Change color and scale based on state
            if (this.isRefilling) {
                // Pulse effect during refill
                const pulse = Math.sin(Date.now() / 100) * 0.2 + 1.0;
                this.crosshairSprite.scale.set(pulse);
                this.crosshairSprite.tint = 0x00ff00; // Green during refill
            } else if (this.isClickingChickenCoop()) {
                // Green when over chicken coop (can refill)
                this.crosshairSprite.tint = this.eggCount >= this.maxEggs ? 0xaaaaaa : 0x00ff00;
                this.crosshairSprite.scale.set(1.0);
            } else {
                // Normal white when aiming
                this.crosshairSprite.tint = 0xffffff;
                this.crosshairSprite.scale.set(1.0);
            }
        }

        // Draw trajectory preview
        this.drawTrajectoryPreview();

        // Check for mouse click
        if (this.input.wasMouseClicked()) {
            // Check if clicking on chicken coop for refill
            if (this.isClickingChickenCoop()) {
                this.startRefill();
                return null;
            }

            // Otherwise try to throw egg
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
        const startX = CONFIG.SCREEN.WIDTH - 40; // Eggs come from bottom-right
        const startY = CONFIG.SCREEN.HEIGHT - 40;
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
            Utils.log('Egg throw on cooldown');
            return null;
        }

        if (this.eggCount <= 0) {
            Utils.log('No eggs left!');
            return null;
        }

        // Create projectile from bottom-right corner
        const startX = CONFIG.SCREEN.WIDTH - 40;
        const startY = CONFIG.SCREEN.HEIGHT - 40;
        const targetX = this.crosshairX;
        const targetY = this.crosshairY;

        const projectile = new Projectile(startX, startY, targetX, targetY, this.container);

        // Consume egg and start cooldown
        this.eggCount--;
        this.canThrow = false;
        this.throwCooldown = CONFIG.PUPIL.EGG_COOLDOWN;

        // Play throw animation
        this.setPupilAnimation('throw');

        // Play throw sound
        if (this.audio) {
            this.audio.playSound('eggThrow');
        }

        Utils.log(`Egg thrown! ${this.eggCount} eggs remaining`);

        return projectile;
    }

    /**
     * Check if crosshair is over chicken coop
     */
    isClickingChickenCoop() {
        if (!this.chickenCoop) return false;

        // Check if crosshair position is inside chicken coop bounds
        return this.crosshairX >= this.chickenCoop.x &&
               this.crosshairX <= this.chickenCoop.x + this.chickenCoop.width &&
               this.crosshairY >= this.chickenCoop.y &&
               this.crosshairY <= this.chickenCoop.y + this.chickenCoop.height;
    }

    /**
     * Start refilling eggs at chicken coop
     */
    startRefill() {
        // Can't refill if already full or already refilling
        if (this.eggCount >= this.maxEggs) {
            Utils.log('Eggs already full!');
            return;
        }

        if (this.isRefilling) {
            Utils.log('Already refilling...');
            return;
        }

        // Start refill timer
        this.isRefilling = true;
        this.refillTimer = CONFIG.PUPIL.REFILL_DELAY;
        Utils.log('Refilling eggs at chicken coop...');
    }

    /**
     * Complete the refill and add eggs
     */
    completeRefill() {
        this.isRefilling = false;
        this.refillTimer = 0;

        // Add eggs (based on config)
        const eggsToAdd = CONFIG.PUPIL.REFILL_AMOUNT;
        const eggsAdded = Math.min(eggsToAdd, this.maxEggs - this.eggCount);
        this.eggCount += eggsAdded;

        // Play refill sound
        if (this.audio) {
            this.audio.playSound('refill');
        }

        Utils.log(`Refill complete! +${eggsAdded} egg(s). Total: ${this.eggCount}/${this.maxEggs}`);
    }

    /**
     * Add eggs to inventory (legacy method for compatibility)
     */
    addEgg() {
        if (this.eggCount < this.maxEggs) {
            this.eggCount++;
            Utils.log(`Egg refilled! ${this.eggCount}/${this.maxEggs} eggs`);
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
        if (this.pupilSprite) {
            this.container.removeChild(this.pupilSprite);
            this.pupilSprite.destroy();
        }
    }
}
