// RECESS REVENGE - Utility Functions

const Utils = {
    /**
     * Debug logging (only logs if DEBUG_MODE is enabled)
     */
    log(...args) {
        if (CONFIG.GAME.DEBUG_MODE) {
            console.log(...args);
        }
    },

    /**
     * Calculate distance between two points
     */
    distance(x1, y1, x2, y2) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        return Math.sqrt(dx * dx + dy * dy);
    },

    /**
     * Check circle-circle collision
     */
    circleCollision(x1, y1, r1, x2, y2, r2) {
        const dist = this.distance(x1, y1, x2, y2);
        return dist < (r1 + r2);
    },

    /**
     * Check circle-rectangle collision
     */
    circleRectCollision(cx, cy, radius, rx, ry, rw, rh) {
        // Find the closest point on the rectangle to the circle
        const closestX = Math.max(rx, Math.min(cx, rx + rw));
        const closestY = Math.max(ry, Math.min(cy, ry + rh));

        // Calculate distance between circle center and closest point
        const distanceX = cx - closestX;
        const distanceY = cy - closestY;
        const distanceSquared = (distanceX * distanceX) + (distanceY * distanceY);

        return distanceSquared < (radius * radius);
    },

    /**
     * Check point-rectangle collision
     */
    pointRectCollision(px, py, rx, ry, rw, rh) {
        return px >= rx && px <= rx + rw && py >= ry && py <= ry + rh;
    },

    /**
     * Clamp a value between min and max
     */
    clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    },

    /**
     * Linear interpolation
     */
    lerp(start, end, t) {
        return start + (end - start) * t;
    },

    /**
     * Normalize a vector
     */
    normalize(x, y) {
        const length = Math.sqrt(x * x + y * y);
        if (length === 0) return { x: 0, y: 0 };
        return {
            x: x / length,
            y: y / length
        };
    },

    /**
     * Format time as MM:SS
     */
    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    },

    /**
     * Create a simple rectangle graphic (placeholder)
     */
    createRectGraphic(width, height, color, alpha = 1) {
        const graphics = new PIXI.Graphics();
        graphics.beginFill(color, alpha);
        graphics.drawRect(0, 0, width, height);
        graphics.endFill();
        return graphics;
    },

    /**
     * Create a simple circle graphic (placeholder)
     */
    createCircleGraphic(radius, color, alpha = 1) {
        const graphics = new PIXI.Graphics();
        graphics.beginFill(color, alpha);
        graphics.drawCircle(0, 0, radius);
        graphics.endFill();
        return graphics;
    },

    /**
     * Draw a dashed line (for trajectory preview)
     */
    drawDashedLine(graphics, points, color, dashLength = 10, gapLength = 5) {
        graphics.lineStyle(2, color, 1);

        let totalDistance = 0;
        let drawing = true;

        for (let i = 0; i < points.length - 1; i++) {
            const p1 = points[i];
            const p2 = points[i + 1];

            const dx = p2.x - p1.x;
            const dy = p2.y - p1.y;
            const segmentLength = Math.sqrt(dx * dx + dy * dy);

            let segmentDistance = 0;

            while (segmentDistance < segmentLength) {
                const remainingInSegment = segmentLength - segmentDistance;
                const currentLength = drawing ? dashLength : gapLength;
                const step = Math.min(currentLength - (totalDistance % currentLength), remainingInSegment);

                const t1 = segmentDistance / segmentLength;
                const t2 = (segmentDistance + step) / segmentLength;

                const x1 = p1.x + dx * t1;
                const y1 = p1.y + dy * t1;
                const x2 = p1.x + dx * t2;
                const y2 = p1.y + dy * t2;

                if (drawing) {
                    graphics.moveTo(x1, y1);
                    graphics.lineTo(x2, y2);
                }

                totalDistance += step;
                segmentDistance += step;

                if (totalDistance % (dashLength + gapLength) < 0.01) {
                    drawing = !drawing;
                }
            }
        }
    }
};
