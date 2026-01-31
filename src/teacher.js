// RECESS REVENGE - Teacher (Player 1)

// Spritesheet data
let TEACHER_SPRITESHEET = null;
let TEACHER_SPRITESHEET_LOADED = false;

/**
 * Preload teacher spritesheet assets
 */
async function preloadTeacherAssets() {
    try {
        // Load spritesheet JSON and texture
        TEACHER_SPRITESHEET = await PIXI.Assets.load('assets/models/teacher-spritesheet.json');
        TEACHER_SPRITESHEET_LOADED = true;
        Utils.log('Teacher spritesheet loaded successfully');
    } catch (error) {
        console.warn('Failed to load teacher spritesheet, using fallback graphics:', error);
        TEACHER_SPRITESHEET_LOADED = false;
    }
}

class Teacher {
    constructor(container, audio = null) {
        this.container = container;
        this.audio = audio;

        // Position and movement
        this.x = CONFIG.TEACHER.SPAWN_X;
        this.y = CONFIG.TEACHER.SPAWN_Y;
        this.velocityX = 0;
        this.velocityY = 0;

        // State
        this.isInvulnerable = false;
        this.invulnerabilityTimer = 0;
        this.isHidden = false; // For hiding in bushes (Phase 8)
        this.isSprinting = false; // For sprint (Phase 5)

        // Sprint system (will be fully implemented in Phase 5)
        this.sprintAvailable = true;
        this.sprintTimer = 0;
        this.sprintCooldownTimer = 0;

        // Animation state
        this.currentAnimation = 'idle';
        this.facingRight = true; // Track direction for sprite flipping

        // Visual
        this.sprite = null;
        this.createSprite();
    }

    /**
     * Create animated teacher sprite
     */
    createSprite() {
        if (TEACHER_SPRITESHEET_LOADED && TEACHER_SPRITESHEET) {
            try {
                // Create AnimatedSprite from the spritesheet
                const textures = TEACHER_SPRITESHEET.animations.idle;
                this.sprite = new PIXI.AnimatedSprite(textures);

                // Set animation properties
                this.sprite.anchor.set(0.5, 0.5);
                this.sprite.animationSpeed = 0.1; // Idle speed
                this.sprite.loop = true;
                this.sprite.play();

                // Scale from 64x64 to display size (2x CONFIG.TEACHER.SIZE for visibility)
                const scale = (CONFIG.TEACHER.SIZE * 2) / 64;
                this.sprite.scale.set(scale, scale);

                this.sprite.x = this.x;
                this.sprite.y = this.y;

                this.container.addChild(this.sprite);
                Utils.log('Created animated teacher sprite');
                return;
            } catch (error) {
                console.warn('Failed to create animated sprite, using fallback:', error);
            }
        }

        // Fallback to Graphics if spritesheet didn't load
        const graphics = new PIXI.Graphics();

        // Simple pixel art person shape
        // Head (tan/skin color)
        graphics.beginFill(0xFFCC99);
        graphics.drawRect(-4, -10, 8, 8);
        graphics.endFill();

        // Body (blue shirt)
        graphics.beginFill(CONFIG.COLORS.TEACHER);
        graphics.drawRect(-6, -2, 12, 10);
        graphics.endFill();

        // Arms (blue)
        graphics.beginFill(CONFIG.COLORS.TEACHER);
        graphics.drawRect(-8, 0, 2, 6); // Left arm
        graphics.drawRect(6, 0, 2, 6);  // Right arm
        graphics.endFill();

        // Legs (dark pants)
        graphics.beginFill(0x333333);
        graphics.drawRect(-5, 8, 4, 6);  // Left leg
        graphics.drawRect(1, 8, 4, 6);   // Right leg
        graphics.endFill();

        // Briefcase (brown) - held in right hand
        graphics.beginFill(0x8B4513);
        graphics.drawRect(8, 4, 4, 6);
        graphics.endFill();

        // Eyes/face detail
        graphics.beginFill(0x000000);
        graphics.drawRect(-3, -8, 2, 2); // Left eye
        graphics.drawRect(1, -8, 2, 2);  // Right eye
        graphics.endFill();

        this.sprite = graphics;
        this.sprite.x = this.x;
        this.sprite.y = this.y;

        this.container.addChild(this.sprite);
        Utils.log('Created fallback teacher graphics');
    }

    /**
     * Update teacher state
     */
    update(deltaTime, input, obstacles = []) {
        // Update invulnerability timer
        if (this.isInvulnerable) {
            this.invulnerabilityTimer -= deltaTime;
            if (this.invulnerabilityTimer <= 0) {
                this.isInvulnerable = false;
                this.sprite.alpha = 1.0; // Restore full opacity
            } else {
                // Flashing effect during invulnerability
                this.sprite.alpha = Math.sin(this.invulnerabilityTimer * 20) * 0.5 + 0.5;
            }
        }

        // Update sprint system
        this.updateSprint(deltaTime, input);

        // Get movement input
        const direction = input.getMovementDirection();

        // Calculate speed with sprint multiplier
        let speed = CONFIG.TEACHER.SPEED;
        if (this.isSprinting) {
            speed *= CONFIG.TEACHER.SPRINT_SPEED_MULTIPLIER;
        }

        // Update velocity based on input
        this.velocityX = direction.x * speed;
        this.velocityY = direction.y * speed;

        // Calculate next position
        let nextX = this.x + this.velocityX * deltaTime;
        let nextY = this.y + this.velocityY * deltaTime;

        // Check obstacle collision at next position
        let canMove = true;
        for (const obstacle of obstacles) {
            // Skip bushes - they are passable for hiding
            if (obstacle.type === 'BUSH') {
                continue;
            }

            if (Utils.circleRectCollision(
                nextX, nextY, CONFIG.TEACHER.HITBOX_RADIUS,
                obstacle.x, obstacle.y, obstacle.width, obstacle.height
            )) {
                canMove = false;
                break;
            }
        }

        // Apply movement if no collision
        if (canMove) {
            this.x = nextX;
            this.y = nextY;
        }

        // Boundary collision - keep teacher on screen
        this.x = Utils.clamp(
            this.x,
            CONFIG.TEACHER.HITBOX_RADIUS,
            CONFIG.SCREEN.WIDTH - CONFIG.TEACHER.HITBOX_RADIUS
        );
        this.y = Utils.clamp(
            this.y,
            CONFIG.TEACHER.HITBOX_RADIUS,
            CONFIG.SCREEN.HEIGHT - CONFIG.TEACHER.HITBOX_RADIUS
        );

        // Check if hiding in a bush
        this.updateHidingState(obstacles);

        // Update sprite position
        this.sprite.x = this.x;
        this.sprite.y = this.y;

        // Update animation and direction
        this.updateAnimation(direction);

        // Update sprite flipping based on horizontal movement
        if (direction.x > 0) {
            this.facingRight = true;
        } else if (direction.x < 0) {
            this.facingRight = false;
        }

        // Apply horizontal flip (only for AnimatedSprite, not Graphics fallback)
        if (this.sprite.textures) {
            const baseScale = (CONFIG.TEACHER.SIZE * 2) / 64;
            const scaleMultiplier = this.isSprinting ? 1.15 : 1.0;
            const scaleX = this.facingRight ? baseScale * scaleMultiplier : -baseScale * scaleMultiplier;
            this.sprite.scale.set(scaleX, baseScale * scaleMultiplier);
        } else {
            // Fallback Graphics rotation (old behavior)
            if (direction.x !== 0 || direction.y !== 0) {
                const angle = Math.atan2(direction.y, direction.x);
                this.sprite.rotation = angle;
            }
        }
    }

    /**
     * Update animation based on movement state
     */
    updateAnimation(direction) {
        // Only update if using AnimatedSprite
        if (!this.sprite.textures || !TEACHER_SPRITESHEET_LOADED) {
            return;
        }

        let targetAnim = 'idle';
        let animSpeed = 0.1;

        // Determine animation based on movement
        if (direction.x !== 0 || direction.y !== 0) {
            if (this.isSprinting) {
                targetAnim = 'sprint';
                animSpeed = 0.2;
            } else {
                targetAnim = 'walk';
                animSpeed = 0.15;
            }
        } else {
            targetAnim = 'idle';
            animSpeed = 0.1;
        }

        // Switch animation if changed
        if (this.currentAnimation !== targetAnim) {
            this.currentAnimation = targetAnim;
            const newTextures = TEACHER_SPRITESHEET.animations[targetAnim];
            this.sprite.textures = newTextures;
            this.sprite.animationSpeed = animSpeed;
            this.sprite.play();
        }
    }

    /**
     * Check if teacher is hiding in a bush
     */
    updateHidingState(obstacles) {
        let inBush = false;

        // Check if teacher is almost fully inside a bush
        const hideMargin = CONFIG.TEACHER.HITBOX_RADIUS * 0.7;
        for (const obstacle of obstacles) {
            if (obstacle.type === 'BUSH' && obstacle.canHide) {
                // Teacher's bounding circle must be contained within the bush
                if (this.x - hideMargin >= obstacle.x &&
                    this.x + hideMargin <= obstacle.x + obstacle.width &&
                    this.y - hideMargin >= obstacle.y &&
                    this.y + hideMargin <= obstacle.y + obstacle.height) {
                    inBush = true;
                    break;
                }
            }
        }

        // Update hidden state
        this.setHidden(inBush);
    }

    /**
     * Update sprint system
     */
    updateSprint(deltaTime, input) {
        // Update sprint cooldown timer
        if (this.sprintCooldownTimer > 0) {
            this.sprintCooldownTimer -= deltaTime;
            if (this.sprintCooldownTimer <= 0) {
                this.sprintCooldownTimer = 0;
                this.sprintAvailable = true;
            }
        }

        // Check if sprint key is pressed
        const wantsToSprint = input.isSprintPressed();

        if (this.isSprinting) {
            // Currently sprinting
            this.sprintTimer -= deltaTime;

            // Stop sprinting if key released or timer runs out
            if (!wantsToSprint || this.sprintTimer <= 0) {
                this.stopSprinting();
            }
        } else {
            // Not sprinting - check if we should start
            if (wantsToSprint && this.sprintAvailable) {
                this.startSprinting();
            }
        }

        // Visual feedback: scale sprite slightly when sprinting
        // (This is now handled in the update method's flip logic to preserve direction)
        // The scale is applied when setting the horizontal flip
    }

    /**
     * Start sprinting
     */
    startSprinting() {
        this.isSprinting = true;
        this.sprintTimer = CONFIG.TEACHER.SPRINT_DURATION;
        this.sprintAvailable = false;

        // Play sprint sound
        if (this.audio) {
            this.audio.playSound('sprint');
        }

        Utils.log('Sprint started!');
    }

    /**
     * Stop sprinting and start cooldown
     */
    stopSprinting() {
        this.isSprinting = false;
        this.sprintTimer = 0;
        this.sprintCooldownTimer = CONFIG.TEACHER.SPRINT_COOLDOWN;
        Utils.log('Sprint ended, cooldown started');
    }

    /**
     * Get sprint availability (for UI)
     */
    getSprintStatus() {
        return {
            available: this.sprintAvailable,
            sprinting: this.isSprinting,
            cooldownPercent: this.sprintCooldownTimer / CONFIG.TEACHER.SPRINT_COOLDOWN,
            durationPercent: this.sprintTimer / CONFIG.TEACHER.SPRINT_DURATION
        };
    }

    /**
     * Respawn teacher at starting position (called when hit by egg)
     */
    respawn() {
        this.x = CONFIG.TEACHER.SPAWN_X;
        this.y = CONFIG.TEACHER.SPAWN_Y;
        this.velocityX = 0;
        this.velocityY = 0;

        // Grant invulnerability
        this.isInvulnerable = true;
        this.invulnerabilityTimer = CONFIG.GAME.RESPAWN_INVULNERABILITY;

        // Reset sprint (but keep cooldown if active)
        this.isSprinting = false;
        this.sprintTimer = 0;

        // Update sprite position
        this.sprite.x = this.x;
        this.sprite.y = this.y;

        Utils.log('Teacher respawned at starting position');
    }

    /**
     * Check if teacher has reached the goal
     */
    hasReachedGoal() {
        return this.x >= CONFIG.TEACHER.GOAL_X;
    }

    /**
     * Get teacher position
     */
    getPosition() {
        return { x: this.x, y: this.y };
    }

    /**
     * Get hitbox radius
     */
    getHitboxRadius() {
        return CONFIG.TEACHER.HITBOX_RADIUS;
    }

    /**
     * Check if teacher is invulnerable
     */
    isInvulnerableState() {
        return this.isInvulnerable;
    }

    /**
     * Check if teacher is hidden in a bush
     */
    isHiddenState() {
        return this.isHidden;
    }

    /**
     * Set hidden state (for bushes - Phase 8)
     */
    setHidden(hidden) {
        this.isHidden = hidden;
        // Visual feedback: make teacher semi-transparent when hidden
        if (hidden) {
            this.sprite.tint = CONFIG.COLORS.TEACHER_HIDDEN;
            this.sprite.alpha = 0.6;
        } else {
            this.sprite.tint = 0xffffff;
            if (!this.isInvulnerable) {
                this.sprite.alpha = 1.0;
            }
        }
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
