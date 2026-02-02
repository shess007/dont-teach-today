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

        // Interpolate teachers array
        if (stateA.teachers && stateB.teachers) {
            for (let i = 0; i < result.teachers.length; i++) {
                const matchA = stateA.teachers.find(t => t.slot === result.teachers[i].slot);
                if (matchA) {
                    result.teachers[i].x = lerp(matchA.x, result.teachers[i].x, t);
                    result.teachers[i].y = lerp(matchA.y, result.teachers[i].y, t);
                }
            }
        }

        // Interpolate pupils array (crosshairs)
        if (stateA.pupils && stateB.pupils) {
            for (let i = 0; i < result.pupils.length; i++) {
                const matchA = stateA.pupils.find(p => p.slot === result.pupils[i].slot);
                if (matchA) {
                    result.pupils[i].crossX = lerp(matchA.crossX, result.pupils[i].crossX, t);
                    result.pupils[i].crossY = lerp(matchA.crossY, result.pupils[i].crossY, t);
                }
            }
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
