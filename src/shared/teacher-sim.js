// RECESS REVENGE - Teacher Simulation (no PixiJS)

import { CONFIG } from './config.js';
import { Utils } from './utils.js';

export class TeacherSimulation {
    constructor() {
        this.x = CONFIG.TEACHER.SPAWN_X;
        this.y = CONFIG.TEACHER.SPAWN_Y;
        this.velocityX = 0;
        this.velocityY = 0;

        this.isInvulnerable = false;
        this.invulnerabilityTimer = 0;
        this.isHidden = false;
        this.isSprinting = false;

        this.sprintAvailable = true;
        this.sprintTimer = 0;
        this.sprintCooldownTimer = 0;

        this.currentAnimation = 'idle';
        this.facingRight = true;
    }

    update(deltaTime, inputs, obstacles) {
        // inputs = { up, down, left, right, sprint }
        this.updateInvulnerability(deltaTime);
        this.updateSprint(deltaTime, inputs);

        const direction = this.calculateDirection(inputs);

        let speed = CONFIG.TEACHER.SPEED;
        if (this.isSprinting) {
            speed *= CONFIG.TEACHER.SPRINT_SPEED_MULTIPLIER;
        }

        this.velocityX = direction.x * speed;
        this.velocityY = direction.y * speed;

        let nextX = this.x + this.velocityX * deltaTime;
        let nextY = this.y + this.velocityY * deltaTime;

        // Check obstacle collision
        let canMove = true;
        for (const obstacle of obstacles) {
            if (obstacle.type === 'BUSH') continue;
            if (Utils.circleRectCollision(
                nextX, nextY, CONFIG.TEACHER.HITBOX_RADIUS,
                obstacle.x, obstacle.y, obstacle.width, obstacle.height
            )) {
                canMove = false;
                break;
            }
        }

        if (canMove) {
            this.x = nextX;
            this.y = nextY;
        }

        // Boundary collision
        this.x = Utils.clamp(this.x, CONFIG.TEACHER.HITBOX_RADIUS, CONFIG.SCREEN.WIDTH - CONFIG.TEACHER.HITBOX_RADIUS);
        this.y = Utils.clamp(this.y, CONFIG.TEACHER.HITBOX_RADIUS, CONFIG.SCREEN.HEIGHT - CONFIG.TEACHER.HITBOX_RADIUS);

        // Bush hiding
        this.updateHidingState(obstacles);

        // Animation
        this.updateAnimation(direction);
        if (direction.x > 0) this.facingRight = true;
        else if (direction.x < 0) this.facingRight = false;
    }

    calculateDirection(inputs) {
        let x = 0, y = 0;
        if (inputs.up) y -= 1;
        if (inputs.down) y += 1;
        if (inputs.left) x -= 1;
        if (inputs.right) x += 1;

        if (x !== 0 && y !== 0) {
            const len = Math.sqrt(x * x + y * y);
            x /= len;
            y /= len;
        }
        return { x, y };
    }

    updateInvulnerability(deltaTime) {
        if (this.isInvulnerable) {
            this.invulnerabilityTimer -= deltaTime;
            if (this.invulnerabilityTimer <= 0) {
                this.isInvulnerable = false;
                this.invulnerabilityTimer = 0;
            }
        }
    }

    updateSprint(deltaTime, inputs) {
        if (this.sprintCooldownTimer > 0) {
            this.sprintCooldownTimer -= deltaTime;
            if (this.sprintCooldownTimer <= 0) {
                this.sprintCooldownTimer = 0;
                this.sprintAvailable = true;
            }
        }

        const wantsToSprint = inputs.sprint;

        if (this.isSprinting) {
            this.sprintTimer -= deltaTime;
            if (!wantsToSprint || this.sprintTimer <= 0) {
                this.stopSprinting();
            }
        } else {
            if (wantsToSprint && this.sprintAvailable) {
                this.startSprinting();
            }
        }
    }

    startSprinting() {
        this.isSprinting = true;
        this.sprintTimer = CONFIG.TEACHER.SPRINT_DURATION;
        this.sprintAvailable = false;
    }

    stopSprinting() {
        this.isSprinting = false;
        this.sprintTimer = 0;
        this.sprintCooldownTimer = CONFIG.TEACHER.SPRINT_COOLDOWN;
    }

    updateHidingState(obstacles) {
        let inBush = false;
        const hideMargin = CONFIG.TEACHER.HITBOX_RADIUS * 0.7;
        for (const obstacle of obstacles) {
            if (obstacle.type === 'BUSH' && obstacle.canHide) {
                if (this.x - hideMargin >= obstacle.x &&
                    this.x + hideMargin <= obstacle.x + obstacle.width &&
                    this.y - hideMargin >= obstacle.y &&
                    this.y + hideMargin <= obstacle.y + obstacle.height) {
                    inBush = true;
                    break;
                }
            }
        }
        this.isHidden = inBush;
    }

    updateAnimation(direction) {
        if (direction.x !== 0 || direction.y !== 0) {
            this.currentAnimation = this.isSprinting ? 'sprint' : 'walk';
        } else {
            this.currentAnimation = 'idle';
        }
    }

    hasReachedGoal() {
        return this.x >= CONFIG.TEACHER.GOAL_X;
    }

    respawn() {
        this.x = CONFIG.TEACHER.SPAWN_X;
        this.y = CONFIG.TEACHER.SPAWN_Y;
        this.velocityX = 0;
        this.velocityY = 0;
        this.isInvulnerable = true;
        this.invulnerabilityTimer = CONFIG.GAME.RESPAWN_INVULNERABILITY;
        this.isSprinting = false;
        this.sprintTimer = 0;
    }

    getSprintStatus() {
        return {
            available: this.sprintAvailable,
            sprinting: this.isSprinting,
            cooldownPercent: this.sprintCooldownTimer / CONFIG.TEACHER.SPRINT_COOLDOWN,
            durationPercent: this.sprintTimer / CONFIG.TEACHER.SPRINT_DURATION
        };
    }

    serialize() {
        return {
            x: Math.round(this.x * 10) / 10,
            y: Math.round(this.y * 10) / 10,
            vx: Math.round(this.velocityX * 10) / 10,
            vy: Math.round(this.velocityY * 10) / 10,
            invuln: this.isInvulnerable,
            invulnT: Math.round(this.invulnerabilityTimer * 100) / 100,
            hidden: this.isHidden,
            sprint: this.isSprinting,
            sprintT: Math.round(this.sprintTimer * 100) / 100,
            sprintCD: Math.round(this.sprintCooldownTimer * 100) / 100,
            sprintAvail: this.sprintAvailable,
            anim: this.currentAnimation,
            facing: this.facingRight
        };
    }
}
