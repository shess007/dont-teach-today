// RECESS REVENGE - Projectile Simulation (no PixiJS)

import { CONFIG } from './config.js';
import { Utils } from './utils.js';

let nextProjectileId = 1;

export class ProjectileSimulation {
    constructor(startX, startY, targetX, targetY) {
        this.id = 'p' + (nextProjectileId++);
        this.startX = startX;
        this.startY = startY;
        this.targetX = targetX;
        this.targetY = targetY;

        this.x = startX;
        this.y = startY;

        this.deltaX = targetX - startX;
        this.deltaY = targetY - startY;
        this.arcHeight = CONFIG.EGG.ARC_HEIGHT;

        this.progress = 0;
        const distance = Utils.distance(startX, startY, targetX, targetY);
        this.flightDuration = distance / CONFIG.EGG.SPEED;

        this.isActive = true;
        this.hasLanded = false;
    }

    update(deltaTime) {
        if (!this.isActive) return;

        this.progress += deltaTime / this.flightDuration;

        if (this.progress >= 1.0) {
            this.progress = 1.0;
            this.hasLanded = true;
            this.isActive = false;
        }

        // Update position along arc
        const t = this.progress;
        this.x = this.startX + this.deltaX * t;
        const linearY = this.startY + this.deltaY * t;
        const arcOffset = this.arcHeight * 4 * t * (1 - t);
        this.y = linearY - arcOffset;
    }

    serialize() {
        return {
            id: this.id,
            x: Math.round(this.x),
            y: Math.round(this.y),
            sx: this.startX,
            sy: this.startY,
            tx: this.targetX,
            ty: this.targetY,
            progress: Math.round(this.progress * 1000) / 1000,
            active: this.isActive
        };
    }
}
