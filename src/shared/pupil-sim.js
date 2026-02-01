// RECESS REVENGE - Pupil Simulation (no PixiJS)

import { CONFIG } from './config.js';
import { Utils } from './utils.js';

export class PupilSimulation {
    constructor() {
        this.eggCount = CONFIG.PUPIL.STARTING_EGGS;
        this.maxEggs = CONFIG.PUPIL.MAX_EGGS;

        this.throwCooldown = 0;
        this.canThrow = true;

        this.isRefilling = false;
        this.refillTimer = 0;

        this.crosshairX = CONFIG.SCREEN.WIDTH / 2;
        this.crosshairY = CONFIG.SCREEN.HEIGHT / 2;

        this.currentAnimation = 'idle';
    }

    // Returns a new projectile descriptor or null
    update(deltaTime, inputs, obstacles) {
        // inputs = { mouseX, mouseY, click }

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

        // Find chicken coop
        const chickenCoop = obstacles.find(obs => obs.type === 'CHICKEN_COOP');

        // Update crosshair (restricted to danger zone)
        const safeZoneX = CONFIG.TEACHER.SPAWN_X + 40;
        this.crosshairX = Math.max(inputs.mouseX || 0, safeZoneX);
        this.crosshairY = Utils.clamp(inputs.mouseY || 0, 0, CONFIG.SCREEN.HEIGHT);

        // Handle click
        if (inputs.click) {
            // Check if clicking on chicken coop
            if (chickenCoop && this.isOverChickenCoop(chickenCoop)) {
                this.startRefill();
                return null;
            }
            // Try to throw egg
            return this.tryThrowEgg();
        }

        return null;
    }

    isOverChickenCoop(coop) {
        return this.crosshairX >= coop.x &&
               this.crosshairX <= coop.x + coop.width &&
               this.crosshairY >= coop.y &&
               this.crosshairY <= coop.y + coop.height;
    }

    tryThrowEgg() {
        if (!this.canThrow || this.eggCount <= 0) return null;

        const startX = CONFIG.SCREEN.WIDTH - 40;
        const startY = CONFIG.SCREEN.HEIGHT - 40;
        const targetX = this.crosshairX;
        const targetY = this.crosshairY;

        this.eggCount--;
        this.canThrow = false;
        this.throwCooldown = CONFIG.PUPIL.EGG_COOLDOWN;
        this.currentAnimation = 'throw';

        // Return projectile descriptor (server will create the ProjectileSimulation)
        return { startX, startY, targetX, targetY };
    }

    startRefill() {
        if (this.eggCount >= this.maxEggs || this.isRefilling) return;
        this.isRefilling = true;
        this.refillTimer = CONFIG.PUPIL.REFILL_DELAY;
    }

    completeRefill() {
        this.isRefilling = false;
        this.refillTimer = 0;
        const eggsToAdd = CONFIG.PUPIL.REFILL_AMOUNT;
        this.eggCount = Math.min(this.maxEggs, this.eggCount + eggsToAdd);
    }

    serialize() {
        return {
            eggs: this.eggCount,
            maxEggs: this.maxEggs,
            cooldown: Math.round(this.throwCooldown * 100) / 100,
            canThrow: this.canThrow,
            refilling: this.isRefilling,
            refillT: Math.round(this.refillTimer * 100) / 100,
            crossX: Math.round(this.crosshairX),
            crossY: Math.round(this.crosshairY),
            anim: this.currentAnimation
        };
    }
}
