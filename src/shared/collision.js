// RECESS REVENGE - Shared Collision Detection (no PixiJS)

import { Utils } from './utils.js';
import { CONFIG } from './config.js';

export class CollisionManager {
    checkEggTeacherCollision(egg, teacher) {
        if (teacher.isInvulnerable) return false;
        if (teacher.isHidden) return false;

        return Utils.circleCollision(
            egg.x, egg.y, CONFIG.EGG.HITBOX_RADIUS,
            teacher.x, teacher.y, CONFIG.TEACHER.HITBOX_RADIUS
        );
    }

    checkAllProjectileCollisions(projectiles, teacher) {
        const hits = [];
        for (const projectile of projectiles) {
            // Check both in-flight and just-landed eggs (hasLanded means it reached target this tick)
            if ((projectile.isActive || projectile.hasLanded) && this.checkEggTeacherCollision(projectile, teacher)) {
                hits.push(projectile);
            }
        }
        return hits;
    }
}
