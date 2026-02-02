// RECESS REVENGE - Game Simulation (server-authoritative, no PixiJS)

import { CONFIG, GAME_STATE, WINNER } from './config.js';
import { TeacherSimulation } from './teacher-sim.js';
import { PupilSimulation, SharedEggPool } from './pupil-sim.js';
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

const DEFAULT_TEACHER_INPUT = { up: false, down: false, left: false, right: false, sprint: false };
const DEFAULT_PUPIL_INPUT = { mouseX: 0, mouseY: 0, click: false };

export class GameSimulation {
    constructor() {
        this.state = GAME_STATE.LOBBY;
        this.winner = WINNER.NONE;
        this.timeRemaining = CONFIG.GAME.MATCH_DURATION;

        this.teachers = [];
        this.pupils = [];
        this.eggPool = null;
        this.projectiles = [];
        this.obstacles = createObstacleLayout();
        this.collisionManager = new CollisionManager();

        this.tick = 0;

        // Events buffer - cleared after each serialize
        this.events = [];
    }

    startGame(teacherCount = 1, pupilCount = 1) {
        this.state = GAME_STATE.PLAYING;
        this.winner = WINNER.NONE;
        this.timeRemaining = CONFIG.GAME.MATCH_DURATION;

        this.teachers = [];
        for (let i = 0; i < teacherCount; i++) {
            this.teachers.push(new TeacherSimulation(i));
        }

        this.eggPool = new SharedEggPool();
        this.pupils = [];
        for (let i = 0; i < pupilCount; i++) {
            this.pupils.push(new PupilSimulation(i, this.eggPool));
        }

        this.projectiles = [];
        this.tick = 0;
        this.events = [];
    }

    update(deltaTime, teacherInputsMap, pupilInputsMap) {
        if (this.state !== GAME_STATE.PLAYING) return;

        this.tick++;

        // Update timer
        this.timeRemaining -= deltaTime;
        if (this.timeRemaining <= 0) {
            this.timeRemaining = 0;
            this.endGame(WINNER.PUPIL);
            return;
        }

        // Update teachers
        for (const teacher of this.teachers) {
            const input = teacherInputsMap[teacher.slotIndex] || DEFAULT_TEACHER_INPUT;
            teacher.update(deltaTime, input, this.obstacles);
        }

        // Win check: ALL teachers must have reached goal
        if (this.teachers.length > 0 && this.teachers.every(t => t.hasReachedGoal())) {
            this.endGame(WINNER.TEACHER);
            return;
        }

        // Update egg pool
        this.eggPool.update(deltaTime);

        // Update pupils
        for (const pupil of this.pupils) {
            const input = pupilInputsMap[pupil.slotIndex] || DEFAULT_PUPIL_INPUT;
            const newProjectile = pupil.update(deltaTime, input, this.obstacles);
            if (newProjectile) {
                const proj = new ProjectileSimulation(
                    newProjectile.startX, newProjectile.startY,
                    newProjectile.targetX, newProjectile.targetY
                );
                this.projectiles.push(proj);
                this.events.push({ type: 'throw', id: proj.id });
            }

            // Return to idle after throw animation frame
            if (pupil.currentAnimation === 'throw' && pupil.throwCooldown < CONFIG.PUPIL.EGG_COOLDOWN - 0.3) {
                pupil.currentAnimation = 'idle';
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
        if (this.teachers.length === 0) return;

        const hits = this.collisionManager.checkAllProjectileCollisions(
            this.projectiles, this.teachers
        );

        for (const { projectile, teacher } of hits) {
            this.handleEggHit(projectile, teacher);
        }
    }

    handleEggHit(egg, teacher) {
        const hitX = Math.round(egg.x);
        const hitY = Math.round(egg.y);

        this.events.push({ type: 'hit', x: hitX, y: hitY, eggId: egg.id, teacherSlot: teacher.slotIndex });

        teacher.respawn();

        // Pupils celebrate
        for (const pupil of this.pupils) {
            pupil.currentAnimation = 'celebrate';
        }

        const index = this.projectiles.indexOf(egg);
        if (index > -1) {
            this.projectiles.splice(index, 1);
        }
    }

    endGame(winner) {
        this.state = GAME_STATE.GAME_OVER;
        this.winner = winner;
        if (winner === WINNER.PUPIL) {
            for (const pupil of this.pupils) {
                pupil.currentAnimation = 'celebrate';
            }
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
            teachers: this.teachers.map(t => t.serialize()),
            pupils: this.pupils.map(p => p.serialize()),
            eggPool: this.eggPool ? this.eggPool.serialize() : null,
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
