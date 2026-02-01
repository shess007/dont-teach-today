// RECESS REVENGE - Shared Utility Functions (no PixiJS)

export const Utils = {
    log(...args) {
        // Only log in debug mode (client can override)
        if (typeof CONFIG !== 'undefined' && CONFIG.GAME && CONFIG.GAME.DEBUG_MODE) {
            console.log(...args);
        }
    },

    distance(x1, y1, x2, y2) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        return Math.sqrt(dx * dx + dy * dy);
    },

    circleCollision(x1, y1, r1, x2, y2, r2) {
        const dist = this.distance(x1, y1, x2, y2);
        return dist < (r1 + r2);
    },

    circleRectCollision(cx, cy, radius, rx, ry, rw, rh) {
        const closestX = Math.max(rx, Math.min(cx, rx + rw));
        const closestY = Math.max(ry, Math.min(cy, ry + rh));
        const distanceX = cx - closestX;
        const distanceY = cy - closestY;
        const distanceSquared = (distanceX * distanceX) + (distanceY * distanceY);
        return distanceSquared < (radius * radius);
    },

    pointRectCollision(px, py, rx, ry, rw, rh) {
        return px >= rx && px <= rx + rw && py >= ry && py <= ry + rh;
    },

    clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    },

    lerp(start, end, t) {
        return start + (end - start) * t;
    },

    normalize(x, y) {
        const length = Math.sqrt(x * x + y * y);
        if (length === 0) return { x: 0, y: 0 };
        return { x: x / length, y: y / length };
    },

    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
};
