// RECESS REVENGE - Collision Detection

class CollisionManager {
    constructor() {
        // No initialization needed for now
    }

    /**
     * Check collision between an egg and the teacher
     * Returns true if collision detected
     */
    checkEggTeacherCollision(egg, teacher) {
        // Don't check collision if teacher is invulnerable
        if (teacher.isInvulnerableState()) {
            return false;
        }

        // Don't check collision if teacher is hidden in a bush
        if (teacher.isHiddenState()) {
            return false;
        }

        // Get positions and radii
        const eggPos = egg.getPosition();
        const teacherPos = teacher.getPosition();
        const eggRadius = egg.getHitboxRadius();
        const teacherRadius = teacher.getHitboxRadius();

        // Circle-circle collision using Utils
        return Utils.circleCollision(
            eggPos.x, eggPos.y, eggRadius,
            teacherPos.x, teacherPos.y, teacherRadius
        );
    }

    /**
     * Check all active projectiles against the teacher
     * Returns array of eggs that hit
     */
    checkAllProjectileCollisions(projectiles, teacher) {
        const hits = [];

        for (const projectile of projectiles) {
            if (this.checkEggTeacherCollision(projectile, teacher)) {
                hits.push(projectile);
            }
        }

        return hits;
    }

    /**
     * Check if teacher collides with any obstacles
     * Returns the first obstacle collided with, or null
     */
    checkTeacherObstacleCollision(teacher, obstacles) {
        const teacherPos = teacher.getPosition();
        const teacherRadius = teacher.getHitboxRadius();

        for (const obstacle of obstacles) {
            // Check circle-rectangle collision
            if (Utils.circleRectCollision(
                teacherPos.x, teacherPos.y, teacherRadius,
                obstacle.x, obstacle.y, obstacle.width, obstacle.height
            )) {
                return obstacle;
            }
        }

        return null;
    }

    /**
     * Check if teacher has reached the goal (school building)
     */
    checkTeacherGoalCollision(teacher) {
        return teacher.hasReachedGoal();
    }

    /**
     * Check if crosshair is over an object (for chicken coop clicking)
     */
    checkPointObjectCollision(x, y, object) {
        return Utils.pointRectCollision(
            x, y,
            object.x, object.y,
            object.width, object.height
        );
    }
}
