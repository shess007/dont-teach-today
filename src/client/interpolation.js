// RECESS REVENGE - State Interpolation

export class StateInterpolator {
    constructor() {
        this.states = []; // { state, time }
        this.maxBuffer = 4;
        this.renderDelay = 60; // ms behind server (slightly more than 1 tick at 20Hz)
    }

    addState(state) {
        this.states.push({ state, time: Date.now() });
        if (this.states.length > this.maxBuffer) {
            this.states.shift();
        }
    }

    getState() {
        if (this.states.length === 0) return null;
        if (this.states.length === 1) return this.states[0].state;

        const renderTime = Date.now() - this.renderDelay;

        // Find two states to interpolate between
        let a = this.states[0];
        let b = this.states[1];

        for (let i = 1; i < this.states.length; i++) {
            if (this.states[i].time > renderTime) {
                a = this.states[i - 1];
                b = this.states[i];
                break;
            }
            // If all states are older than renderTime, use the latest
            if (i === this.states.length - 1) {
                return this.states[i].state;
            }
        }

        const timeDiff = b.time - a.time;
        if (timeDiff === 0) return b.state;

        const t = Math.max(0, Math.min(1, (renderTime - a.time) / timeDiff));
        return this.interpolate(a.state, b.state, t);
    }

    interpolate(stateA, stateB, t) {
        const lerp = (a, b, t) => a + (b - a) * t;

        // Deep copy stateB as base
        const result = JSON.parse(JSON.stringify(stateB));

        // Interpolate teacher position
        if (stateA.teacher && stateB.teacher) {
            result.teacher.x = lerp(stateA.teacher.x, stateB.teacher.x, t);
            result.teacher.y = lerp(stateA.teacher.y, stateB.teacher.y, t);
        }

        // Interpolate pupil crosshair
        if (stateA.pupil && stateB.pupil) {
            result.pupil.crossX = lerp(stateA.pupil.crossX, stateB.pupil.crossX, t);
            result.pupil.crossY = lerp(stateA.pupil.crossY, stateB.pupil.crossY, t);
        }

        // Interpolate projectile positions
        if (stateA.projectiles && stateB.projectiles) {
            for (let i = 0; i < result.projectiles.length; i++) {
                const projA = stateA.projectiles.find(p => p.id === result.projectiles[i].id);
                if (projA) {
                    result.projectiles[i].x = lerp(projA.x, result.projectiles[i].x, t);
                    result.projectiles[i].y = lerp(projA.y, result.projectiles[i].y, t);
                }
            }
        }

        return result;
    }
}
