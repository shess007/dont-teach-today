// RECESS REVENGE - Teacher (Player 1)

class Teacher {
    constructor(container) {
        this.container = container;

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

        // Visual
        this.sprite = null;
        this.createSprite();
    }

    /**
     * Create placeholder sprite (blue circle)
     */
    createSprite() {
        // Use legacy Graphics API for compatibility (will show deprecation warning but works)
        const graphics = new PIXI.Graphics();

        // Draw main body (blue circle)
        graphics.beginFill(CONFIG.COLORS.TEACHER);
        graphics.drawCircle(0, 0, CONFIG.TEACHER.HITBOX_RADIUS);
        graphics.endFill();

        // Add a direction indicator (small white circle)
        graphics.beginFill(0xffffff);
        graphics.drawCircle(CONFIG.TEACHER.HITBOX_RADIUS / 2, 0, 4);
        graphics.endFill();

        this.sprite = graphics;
        this.sprite.x = this.x;
        this.sprite.y = this.y;

        this.container.addChild(this.sprite);
    }

    /**
     * Update teacher state
     */
    update(deltaTime, input) {
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

        // Update position
        this.x += this.velocityX * deltaTime;
        this.y += this.velocityY * deltaTime;

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

        // Update sprite position
        this.sprite.x = this.x;
        this.sprite.y = this.y;

        // Rotate sprite slightly based on movement direction (visual feedback)
        if (direction.x !== 0 || direction.y !== 0) {
            const angle = Math.atan2(direction.y, direction.x);
            this.sprite.rotation = angle;
        }
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
        if (this.isSprinting) {
            this.sprite.scale.set(1.15);
        } else {
            this.sprite.scale.set(1.0);
        }
    }

    /**
     * Start sprinting
     */
    startSprinting() {
        this.isSprinting = true;
        this.sprintTimer = CONFIG.TEACHER.SPRINT_DURATION;
        this.sprintAvailable = false;
        console.log('Sprint started!');
    }

    /**
     * Stop sprinting and start cooldown
     */
    stopSprinting() {
        this.isSprinting = false;
        this.sprintTimer = 0;
        this.sprintCooldownTimer = CONFIG.TEACHER.SPRINT_COOLDOWN;
        console.log('Sprint ended, cooldown started');
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

        console.log('Teacher respawned at starting position');
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
