// RECESS REVENGE - Game Simulation (server-authoritative, no PixiJS)

import { CONFIG, GAME_STATE, WINNER } from './config.js';
import { TeacherSimulation } from './teacher-sim.js';
import { PupilSimulation } from './pupil-sim.js';
import { ProjectileSimulation } from './projectile-sim.js';
import { CollisionManager } from './collision.js';

// Deterministic obstacle layout (same for all games)
function createObstacleLayout() {
    const obstacles = [];
    const width = CONFIG.SCREEN.WIDTH;
    const height = CONFIG.SCREEN.HEIGHT;

    const isValidPosition = (x, y, w, h) => {
        if (x < 200 || x + w > width - 200) return false;
        if (y < 50 || y + h > height - 50) return false;
        for (const obs of obstacles) {
            if (!(x + w < obs.x || x > obs.x + obs.width ||
                  y + h < obs.y || y > obs.y + obs.height)) {
                return false;
            }
        }
        return true;
    };

    // Chicken coop (always top-center for determinism)
    const coopX = width / 2 - CONFIG.OBSTACLES.CHICKEN_COOP.WIDTH / 2;
    const coopY = 20;
    obstacles.push({
        type: 'CHICKEN_COOP', x: coopX, y: coopY,
        width: CONFIG.OBSTACLES.CHICKEN_COOP.WIDTH,
        height: CONFIG.OBSTACLES.CHICKEN_COOP.HEIGHT,
        canHide: false
    });

    // Bushes
    const bushPositions = [
        { x: 350, y: 200 }, { x: 600, y: 400 }, { x: 450, y: 550 },
        { x: 800, y: 150 }, { x: 700, y: 500 }
    ];
    for (const pos of bushPositions) {
        if (isValidPosition(pos.x, pos.y, CONFIG.OBSTACLES.BUSH.WIDTH, CONFIG.OBSTACLES.BUSH.HEIGHT)) {
            obstacles.push({
                type: 'BUSH', x: pos.x, y: pos.y,
                width: CONFIG.OBSTACLES.BUSH.WIDTH,
                height: CONFIG.OBSTACLES.BUSH.HEIGHT,
                canHide: CONFIG.OBSTACLES.BUSH.CAN_HIDE
            });
        }
    }

    // Benches
    const benchPositions = [
        { x: 400, y: 350 }, { x: 650, y: 250 }, { x: 500, y: 150 }
    ];
    for (const pos of benchPositions) {
        if (isValidPosition(pos.x, pos.y, CONFIG.OBSTACLES.BENCH.WIDTH, CONFIG.OBSTACLES.BENCH.HEIGHT)) {
            obstacles.push({
                type: 'BENCH', x: pos.x, y: pos.y,
                width: CONFIG.OBSTACLES.BENCH.WIDTH,
                height: CONFIG.OBSTACLES.BENCH.HEIGHT,
                canHide: false
            });
        }
    }

    // Trees
    const treePositions = [
        { x: 300, y: 450 }, { x: 850, y: 350 }, { x: 550, y: 80 }
    ];
    for (const pos of treePositions) {
        if (isValidPosition(pos.x, pos.y, CONFIG.OBSTACLES.TREE.WIDTH, CONFIG.OBSTACLES.TREE.HEIGHT)) {
            obstacles.push({
                type: 'TREE', x: pos.x, y: pos.y,
                width: CONFIG.OBSTACLES.TREE.WIDTH,
                height: CONFIG.OBSTACLES.TREE.HEIGHT,
                canHide: false
            });
        }
    }

    // Swing set
    if (isValidPosition(750, 500, CONFIG.OBSTACLES.SWING_SET.WIDTH, CONFIG.OBSTACLES.SWING_SET.HEIGHT)) {
        obstacles.push({
            type: 'SWING_SET', x: 750, y: 500,
            width: CONFIG.OBSTACLES.SWING_SET.WIDTH,
            height: CONFIG.OBSTACLES.SWING_SET.HEIGHT,
            canHide: false
        });
    }

    return obstacles;
}

export class GameSimulation {
    constructor() {
        this.state = GAME_STATE.LOBBY;
        this.winner = WINNER.NONE;
        this.timeRemaining = CONFIG.GAME.MATCH_DURATION;

        this.teacher = null;
        this.pupil = null;
        this.projectiles = [];
        this.obstacles = createObstacleLayout();
        this.collisionManager = new CollisionManager();

        this.tick = 0;

        // Events buffer - cleared after each serialize
        this.events = [];
    }

    startGame() {
        this.state = GAME_STATE.PLAYING;
        this.winner = WINNER.NONE;
        this.timeRemaining = CONFIG.GAME.MATCH_DURATION;
        this.teacher = new TeacherSimulation();
        this.pupil = new PupilSimulation();
        this.projectiles = [];
        this.tick = 0;
        this.events = [];
    }

    update(deltaTime, teacherInputs, pupilInputs) {
        if (this.state !== GAME_STATE.PLAYING) return;

        this.tick++;

        // Update timer
        this.timeRemaining -= deltaTime;
        if (this.timeRemaining <= 0) {
            this.timeRemaining = 0;
            this.endGame(WINNER.PUPIL);
            return;
        }

        // Update teacher
        if (this.teacher) {
            this.teacher.update(deltaTime, teacherInputs, this.obstacles);
            if (this.teacher.hasReachedGoal()) {
                this.endGame(WINNER.TEACHER);
                return;
            }
        }

        // Update pupil
        if (this.pupil) {
            const newProjectile = this.pupil.update(deltaTime, pupilInputs, this.obstacles);
            if (newProjectile) {
                const proj = new ProjectileSimulation(
                    newProjectile.startX, newProjectile.startY,
                    newProjectile.targetX, newProjectile.targetY
                );
                this.projectiles.push(proj);
                this.events.push({ type: 'throw', id: proj.id });
            }

            // Return to idle after throw animation frame
            if (this.pupil.currentAnimation === 'throw' && this.pupil.throwCooldown < CONFIG.PUPIL.EGG_COOLDOWN - 0.3) {
                this.pupil.currentAnimation = 'idle';
            }
        }

        // Update projectiles
        for (const proj of this.projectiles) {
            proj.update(deltaTime);
        }

        // Check collisions BEFORE removing landed projectiles
        this.checkCollisions();

        // Remove inactive projectiles
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const proj = this.projectiles[i];
            if (!proj.isActive) {
                if (proj.hasLanded) {
                    this.events.push({ type: 'splat', x: Math.round(proj.x), y: Math.round(proj.y) });
                }
                this.projectiles.splice(i, 1);
            }
        }
    }

    checkCollisions() {
        if (!this.teacher) return;

        const hits = this.collisionManager.checkAllProjectileCollisions(
            this.projectiles, this.teacher
        );

        for (const egg of hits) {
            this.handleEggHit(egg);
        }
    }

    handleEggHit(egg) {
        const hitX = Math.round(egg.x);
        const hitY = Math.round(egg.y);

        this.events.push({ type: 'hit', x: hitX, y: hitY, eggId: egg.id });

        this.teacher.respawn();

        // Pupil celebrates
        if (this.pupil) {
            this.pupil.currentAnimation = 'celebrate';
        }

        const index = this.projectiles.indexOf(egg);
        if (index > -1) {
            this.projectiles.splice(index, 1);
        }
    }

    endGame(winner) {
        this.state = GAME_STATE.GAME_OVER;
        this.winner = winner;
        if (winner === WINNER.PUPIL && this.pupil) {
            this.pupil.currentAnimation = 'celebrate';
        }
        this.events.push({ type: 'gameover', winner });
    }

    serialize() {
        const data = {
            type: 'state',
            tick: this.tick,
            gameState: this.state,
            winner: this.winner,
            time: Math.round(this.timeRemaining * 10) / 10,
            teacher: this.teacher ? this.teacher.serialize() : null,
            pupil: this.pupil ? this.pupil.serialize() : null,
            projectiles: this.projectiles.map(p => p.serialize()),
            events: this.events
        };
        // Clear events after sending
        this.events = [];
        return data;
    }

    serializeInit() {
        return {
            type: 'init',
            obstacles: this.obstacles.map(o => ({
                type: o.type, x: o.x, y: o.y,
                width: o.width, height: o.height,
                canHide: o.canHide
            }))
        };
    }
}
