// RECESS REVENGE - Pupil Simulation (no PixiJS)

import { CONFIG } from './config.js';
import { Utils } from './utils.js';

export class SharedEggPool {
    constructor() {
        this.eggCount = CONFIG.PUPIL.STARTING_EGGS;
        this.maxEggs = CONFIG.PUPIL.MAX_EGGS;
        this.isRefilling = false;
        this.refillTimer = 0;
    }

    update(deltaTime) {
        if (this.isRefilling) {
            this.refillTimer -= deltaTime;
            if (this.refillTimer <= 0) {
                this.completeRefill();
            }
        }
    }

    tryConsume() {
        if (this.eggCount <= 0) return false;
        this.eggCount--;
        return true;
    }

    startRefill() {
        if (this.eggCount >= this.maxEggs || this.isRefilling) return;
        this.isRefilling = true;
        this.refillTimer = CONFIG.PUPIL.REFILL_DELAY;
    }

    completeRefill() {
        this.isRefilling = false;
        this.refillTimer = 0;
        this.eggCount = Math.min(this.maxEggs, this.eggCount + CONFIG.PUPIL.REFILL_AMOUNT);
    }

    serialize() {
        return {
            eggs: this.eggCount,
            maxEggs: this.maxEggs,
            refilling: this.isRefilling,
            refillT: Math.round(this.refillTimer * 100) / 100,
        };
    }
}

export class PupilSimulation {
    constructor(slotIndex = 0, eggPool) {
        this.slotIndex = slotIndex;
        this.eggPool = eggPool;

        this.throwCooldown = 0;
        this.canThrow = true;

        const throwPos = CONFIG.PUPIL.THROW_POSITIONS[slotIndex] || { x: CONFIG.SCREEN.WIDTH - 40, y: CONFIG.SCREEN.HEIGHT - 40 };
        this.throwX = throwPos.x;
        this.throwY = throwPos.y;

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
                this.eggPool.startRefill();
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
        if (!this.canThrow || !this.eggPool.tryConsume()) return null;

        this.canThrow = false;
        this.throwCooldown = CONFIG.PUPIL.EGG_COOLDOWN;
        this.currentAnimation = 'throw';

        // Return projectile descriptor (server will create the ProjectileSimulation)
        return { startX: this.throwX, startY: this.throwY, targetX: this.crosshairX, targetY: this.crosshairY };
    }

    serialize() {
        return {
            slot: this.slotIndex,
            cooldown: Math.round(this.throwCooldown * 100) / 100,
            canThrow: this.canThrow,
            crossX: Math.round(this.crosshairX),
            crossY: Math.round(this.crosshairY),
            anim: this.currentAnimation,
            throwX: this.throwX,
            throwY: this.throwY,
        };
    }
}
