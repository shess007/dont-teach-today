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

    checkAllProjectileCollisions(projectiles, teachers) {
        const hits = [];
        for (const projectile of projectiles) {
            if (!projectile.isActive && !projectile.hasLanded) continue;
            for (const teacher of teachers) {
                if (this.checkEggTeacherCollision(projectile, teacher)) {
                    hits.push({ projectile, teacher });
                    break; // each egg can only hit one teacher
                }
            }
        }
        return hits;
    }
}
