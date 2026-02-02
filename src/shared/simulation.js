// RECESS REVENGE - Game Simulation (server-authoritative, no PixiJS)

import { CONFIG, GAME_STATE, WINNER } from './config.js';
import { TeacherSimulation } from './teacher-sim.js';
import { PupilSimulation } from './pupil-sim.js';
import { ProjectileSimulation } from './projectile-sim.js';
import { CollisionManager } from './collision.js';
import levelData from './level.json';

// Build obstacle layout from level.json
function createObstacleLayout() {
    return levelData.obstacles.map(entry => {
        const cfg = CONFIG.OBSTACLES[entry.type];
        return {
            type: entry.type,
            x: entry.x,
            y: entry.y,
            width: cfg.WIDTH,
            height: cfg.HEIGHT,
            canHide: cfg.CAN_HIDE || false
        };
    });
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
