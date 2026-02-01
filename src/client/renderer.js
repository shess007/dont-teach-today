// RECESS REVENGE - Client Renderer (PixiJS rendering orchestrator)

import { CONFIG, GAME_STATE, WINNER } from '../shared/config.js';
import { AudioManager } from './audio.js';

// PixiJS loaded via CDN globally
const PIXI = window.PIXI;

// Texture caches
let TEACHER_SPRITESHEET = null;
let PUPIL_SPRITESHEET = null;
let TREE_TEXTURES = [];
let BUSH_TEXTURE = null;
let BENCH_TEXTURE = null;
let COOP_TEXTURE = null;

export class GameRenderer {
    constructor() {
        this.app = null;
        this.audio = new AudioManager();

        // Layers
        this.backgroundLayer = null;
        this.obstaclesLayer = null;
        this.gameLayer = null;
        this.effectsLayer = null;
        this.uiLayer = null;

        // Game object renderers
        this.teacherSprite = null;
        this.pupilSprite = null;
        this.crosshairSprite = null;
        this.trajectoryGraphics = null;
        this.projectileSprites = new Map(); // id -> sprite

        // UI
        this.timerText = null;
        this.eggCountText = null;
        this.sprintMeterGraphics = null;
        this.sprintMeterText = null;

        // State tracking for animation changes
        this.currentTeacherAnim = null;
        this.currentPupilAnim = null;
        this.teacherFacingRight = true;

        // Effects
        this.splats = [];
        this.screenShake = null;

        // Obstacles reference
        this.obstacles = [];
        this.obstacleSprites = [];
    }

    async init() {
        this.app = new PIXI.Application();
        await this.app.init({
            width: CONFIG.SCREEN.WIDTH,
            height: CONFIG.SCREEN.HEIGHT,
            background: CONFIG.SCREEN.BACKGROUND_COLOR,
            antialias: false,
            resolution: 1,
        });

        document.getElementById('pixi-container').appendChild(this.app.canvas);

        this.createLayers();
        await this.preloadAssets();
        this.drawBackground();
        this.drawSchool();

        return this.app.canvas;
    }

    createLayers() {
        this.backgroundLayer = new PIXI.Container();
        this.app.stage.addChild(this.backgroundLayer);
        this.obstaclesLayer = new PIXI.Container();
        this.app.stage.addChild(this.obstaclesLayer);
        this.gameLayer = new PIXI.Container();
        this.app.stage.addChild(this.gameLayer);
        this.effectsLayer = new PIXI.Container();
        this.app.stage.addChild(this.effectsLayer);
        this.uiLayer = new PIXI.Container();
        this.app.stage.addChild(this.uiLayer);
    }

    async preloadAssets() {
        try {
            TEACHER_SPRITESHEET = await PIXI.Assets.load('assets/models/teacher-spritesheet.json');
        } catch (e) { console.warn('Teacher spritesheet failed:', e); }

        try {
            PUPIL_SPRITESHEET = await PIXI.Assets.load('assets/models/pupil-spritesheet.json');
        } catch (e) { console.warn('Pupil spritesheet failed:', e); }

        try {
            for (const path of ['assets/models/tree1.png', 'assets/models/tree2.png']) {
                TREE_TEXTURES.push(await PIXI.Assets.load(path));
            }
            BUSH_TEXTURE = await PIXI.Assets.load('assets/models/bush1.png');
            BENCH_TEXTURE = await PIXI.Assets.load('assets/models/bench1.png');
            COOP_TEXTURE = await PIXI.Assets.load('assets/models/chicken-coop.png');
            await PIXI.Assets.load('assets/models/schoolyard-tile.png');
        } catch (e) { console.warn('Obstacle assets failed:', e); }
    }

    drawBackground() {
        const texture = PIXI.Assets.get('assets/models/schoolyard-tile.png');
        if (texture) {
            this.backgroundLayer.addChild(new PIXI.TilingSprite(texture, CONFIG.SCREEN.WIDTH, CONFIG.SCREEN.HEIGHT));
        } else {
            const fallback = new PIXI.Graphics();
            fallback.beginFill(CONFIG.COLORS.ASPHALT);
            fallback.drawRect(0, 0, CONFIG.SCREEN.WIDTH, CONFIG.SCREEN.HEIGHT);
            fallback.endFill();
            this.backgroundLayer.addChild(fallback);
        }

        const markings = new PIXI.Graphics();
        // Safe zone line
        markings.beginFill(0xffff00, 0.9);
        for (let y = 0; y < CONFIG.SCREEN.HEIGHT; y += 40) {
            markings.drawRect(CONFIG.TEACHER.SPAWN_X + 40, y, 5, 20);
        }
        markings.endFill();
        // Finish line
        markings.beginFill(0xffff00, 0.9);
        for (let y = 0; y < CONFIG.SCREEN.HEIGHT; y += 40) {
            markings.drawRect(CONFIG.TEACHER.GOAL_X, y, 5, 20);
        }
        markings.endFill();
        // Court lines
        markings.lineStyle(3, 0xffffff, 0.6);
        markings.moveTo(0, CONFIG.SCREEN.HEIGHT / 2);
        markings.lineTo(CONFIG.SCREEN.WIDTH, CONFIG.SCREEN.HEIGHT / 2);
        markings.moveTo(CONFIG.SCREEN.WIDTH / 2, 0);
        markings.lineTo(CONFIG.SCREEN.WIDTH / 2, CONFIG.SCREEN.HEIGHT);
        this.backgroundLayer.addChild(markings);
    }

    drawSchool() {
        const school = new PIXI.Graphics();
        const x = CONFIG.SCHOOL.X, y = CONFIG.SCHOOL.Y;
        const w = CONFIG.SCHOOL.WIDTH, h = CONFIG.SCHOOL.HEIGHT;

        school.beginFill(CONFIG.SCHOOL.COLOR);
        school.drawRect(x, y, w, h);
        school.endFill();

        school.beginFill(0x660000);
        for (let py = y + 10; py < y + h; py += 20) {
            for (let px = x + 10; px < x + w; px += 30) {
                school.drawRect(px, py, 25, 8);
            }
        }
        school.endFill();

        const windowColor = 0x87CEEB;
        school.beginFill(windowColor);
        for (let row = 0; row < 3; row++) {
            for (let col = 0; col < 3; col++) {
                school.drawRect(x + 20 + col * 40, y + 40 + row * 60, 30, 40);
            }
        }
        school.endFill();

        school.beginFill(0x654321);
        school.drawRect(x + 55, y + 220, 40, 70);
        school.endFill();
        school.beginFill(0xFFD700);
        school.drawRect(x + 85, y + 255, 4, 4);
        school.endFill();
        school.beginFill(0x333333);
        school.drawRect(x - 10, y - 20, w + 20, 25);
        school.endFill();
        school.beginFill(CONFIG.SCHOOL.COLOR);
        school.drawRect(x + 110, y - 40, 20, 25);
        school.endFill();

        const text = new PIXI.Text('SCHOOL', {
            fontFamily: CONFIG.UI.FONT_FAMILY, fontSize: 20,
            fill: 0xffffff, align: 'center', fontWeight: 'bold',
            stroke: 0x000000, strokeThickness: 3
        });
        text.anchor.set(0.5);
        text.x = x + w / 2; text.y = y + 15;

        this.obstaclesLayer.addChild(school);
        this.obstaclesLayer.addChild(text);
    }

    // --- Obstacle rendering ---
    createObstacles(obstacleData) {
        // Clear previous
        for (const s of this.obstacleSprites) {
            this.obstaclesLayer.removeChild(s);
            s.destroy();
        }
        this.obstacleSprites = [];
        this.obstacles = obstacleData;

        for (const obs of obstacleData) {
            let sprite;
            if (obs.type === 'BUSH' && BUSH_TEXTURE) {
                sprite = new PIXI.Sprite(BUSH_TEXTURE);
                const scale = obs.height / BUSH_TEXTURE.height;
                sprite.width = BUSH_TEXTURE.width * scale;
                sprite.height = obs.height;
            } else if (obs.type === 'BENCH' && BENCH_TEXTURE) {
                sprite = new PIXI.Sprite(BENCH_TEXTURE);
                const scale = obs.height / BENCH_TEXTURE.height;
                sprite.width = BENCH_TEXTURE.width * scale;
                sprite.height = obs.height;
            } else if (obs.type === 'CHICKEN_COOP' && COOP_TEXTURE) {
                sprite = new PIXI.Sprite(COOP_TEXTURE);
                const scale = obs.height / COOP_TEXTURE.height;
                sprite.width = COOP_TEXTURE.width * scale;
                sprite.height = obs.height;
            } else if (obs.type === 'TREE' && TREE_TEXTURES.length > 0) {
                const tex = TREE_TEXTURES[Math.floor(Math.random() * TREE_TEXTURES.length)];
                sprite = new PIXI.Sprite(tex);
                const scale = obs.height / tex.height;
                sprite.width = tex.width * scale;
                sprite.height = obs.height;
            } else {
                sprite = this.drawFallbackObstacle(obs);
            }
            sprite.x = obs.x;
            sprite.y = obs.y;
            this.obstaclesLayer.addChild(sprite);
            this.obstacleSprites.push(sprite);
        }
    }

    drawFallbackObstacle(obs) {
        const g = new PIXI.Graphics();
        const color = CONFIG.OBSTACLES[obs.type]?.COLOR || 0x888888;
        g.beginFill(color);
        g.drawRect(0, 0, obs.width, obs.height);
        g.endFill();
        return g;
    }

    // --- Teacher rendering ---
    createTeacher() {
        if (this.teacherSprite) {
            this.gameLayer.removeChild(this.teacherSprite);
            this.teacherSprite.destroy();
        }

        if (TEACHER_SPRITESHEET) {
            const textures = TEACHER_SPRITESHEET.animations.idle;
            this.teacherSprite = new PIXI.AnimatedSprite(textures);
            this.teacherSprite.anchor.set(0.5, 0.5);
            this.teacherSprite.animationSpeed = 0.1;
            this.teacherSprite.loop = true;
            this.teacherSprite.play();
            const scale = (CONFIG.TEACHER.SIZE * 2) / 64;
            this.teacherSprite.scale.set(scale, scale);
        } else {
            const g = new PIXI.Graphics();
            g.beginFill(CONFIG.COLORS.TEACHER);
            g.drawCircle(0, 0, CONFIG.TEACHER.HITBOX_RADIUS);
            g.endFill();
            this.teacherSprite = g;
        }

        this.currentTeacherAnim = 'idle';
        this.gameLayer.addChild(this.teacherSprite);
    }

    renderTeacher(state) {
        if (!this.teacherSprite || !state) return;

        this.teacherSprite.x = state.x;
        this.teacherSprite.y = state.y;

        // Animation switch
        if (state.anim !== this.currentTeacherAnim && TEACHER_SPRITESHEET) {
            this.currentTeacherAnim = state.anim;
            const newTextures = TEACHER_SPRITESHEET.animations[state.anim];
            if (newTextures && this.teacherSprite.textures) {
                this.teacherSprite.textures = newTextures;
                this.teacherSprite.animationSpeed = state.anim === 'sprint' ? 0.2 : state.anim === 'walk' ? 0.15 : 0.1;
                this.teacherSprite.play();
            }
        }

        // Facing direction
        if (this.teacherSprite.textures) {
            const baseScale = (CONFIG.TEACHER.SIZE * 2) / 64;
            const mult = state.sprint ? 1.15 : 1.0;
            const scaleX = state.facing ? baseScale * mult : -baseScale * mult;
            this.teacherSprite.scale.set(scaleX, baseScale * mult);
        }

        // Invulnerability flashing
        if (state.invuln) {
            this.teacherSprite.alpha = Math.sin(Date.now() * 0.02) * 0.5 + 0.5;
        } else if (state.hidden) {
            this.teacherSprite.alpha = 0.6;
            this.teacherSprite.tint = CONFIG.COLORS.TEACHER_HIDDEN;
        } else {
            this.teacherSprite.alpha = 1.0;
            this.teacherSprite.tint = 0xffffff;
        }
    }

    // --- Pupil rendering ---
    createPupil() {
        if (this.pupilSprite) {
            this.gameLayer.removeChild(this.pupilSprite);
            this.pupilSprite.destroy();
        }

        if (PUPIL_SPRITESHEET) {
            const textures = PUPIL_SPRITESHEET.animations.idle;
            this.pupilSprite = new PIXI.AnimatedSprite(textures);
            this.pupilSprite.anchor.set(0.5, 0.5);
            this.pupilSprite.animationSpeed = 0.1;
            this.pupilSprite.loop = true;
            this.pupilSprite.play();
            this.pupilSprite.x = CONFIG.SCREEN.WIDTH - 60;
            this.pupilSprite.y = CONFIG.SCREEN.HEIGHT - 60;
            this.gameLayer.addChild(this.pupilSprite);
        }

        // Crosshair
        if (this.crosshairSprite) {
            this.gameLayer.removeChild(this.crosshairSprite);
            this.crosshairSprite.destroy();
        }
        const ch = new PIXI.Graphics();
        ch.lineStyle(2, CONFIG.COLORS.CROSSHAIR, 1);
        ch.drawCircle(0, 0, 12);
        ch.moveTo(-16, 0); ch.lineTo(-4, 0);
        ch.moveTo(4, 0); ch.lineTo(16, 0);
        ch.moveTo(0, -16); ch.lineTo(0, -4);
        ch.moveTo(0, 4); ch.lineTo(0, 16);
        ch.beginFill(CONFIG.COLORS.CROSSHAIR);
        ch.drawCircle(0, 0, 2);
        ch.endFill();
        this.crosshairSprite = ch;
        this.gameLayer.addChild(this.crosshairSprite);

        // Trajectory
        if (this.trajectoryGraphics) {
            this.gameLayer.removeChild(this.trajectoryGraphics);
            this.trajectoryGraphics.destroy();
        }
        this.trajectoryGraphics = new PIXI.Graphics();
        this.gameLayer.addChild(this.trajectoryGraphics);

        this.currentPupilAnim = 'idle';
    }

    renderPupil(state, role) {
        if (!state) return;

        // Pupil sprite animation
        if (this.pupilSprite && PUPIL_SPRITESHEET) {
            if (state.anim !== this.currentPupilAnim) {
                this.currentPupilAnim = state.anim;
                const newTextures = PUPIL_SPRITESHEET.animations[state.anim];
                if (newTextures) {
                    this.pupilSprite.textures = newTextures;
                    this.pupilSprite.animationSpeed = state.anim === 'throw' ? 0.2 : 0.1;
                    this.pupilSprite.loop = state.anim !== 'throw';
                    this.pupilSprite.play();
                }
            }
        }

        // Crosshair (only visible for pupil player)
        if (this.crosshairSprite) {
            this.crosshairSprite.visible = true;
            this.crosshairSprite.x = state.crossX;
            this.crosshairSprite.y = state.crossY;

            if (role === 'pupil') {
                if (state.refilling) {
                    const pulse = Math.sin(Date.now() / 100) * 0.2 + 1.0;
                    this.crosshairSprite.scale.set(pulse);
                    this.crosshairSprite.tint = 0x00ff00;
                    this.crosshairSprite.alpha = 0.8;
                } else {
                    this.crosshairSprite.tint = 0xff4444;
                    this.crosshairSprite.alpha = 0.5;
                    this.crosshairSprite.scale.set(1.0);
                }
            } else {
                this.crosshairSprite.tint = 0xff4444;
                this.crosshairSprite.alpha = 0.5;
                this.crosshairSprite.scale.set(1.0);
            }
        }

        // Trajectory preview (only for pupil)
        if (this.trajectoryGraphics) {
            this.trajectoryGraphics.clear();
            if (role === 'pupil' && state.eggs > 0 && state.canThrow) {
                const startX = CONFIG.SCREEN.WIDTH - 40;
                const startY = CONFIG.SCREEN.HEIGHT - 40;
                const numPoints = 15;
                for (let i = 0; i <= numPoints; i++) {
                    const t = i / numPoints;
                    const dx = state.crossX - startX;
                    const dy = state.crossY - startY;
                    const x = startX + dx * t;
                    const linearY = startY + dy * t;
                    const arcOffset = CONFIG.EGG.ARC_HEIGHT * 4 * t * (1 - t);
                    const y = linearY - arcOffset;
                    this.trajectoryGraphics.beginFill(CONFIG.COLORS.TRAJECTORY, 0.6);
                    this.trajectoryGraphics.drawCircle(x, y, 3);
                    this.trajectoryGraphics.endFill();
                }
            }
        }
    }

    // --- Projectile rendering ---
    renderProjectiles(projectiles) {
        if (!projectiles) return;

        const activeIds = new Set(projectiles.map(p => p.id));

        // Remove old projectile sprites
        for (const [id, sprite] of this.projectileSprites) {
            if (!activeIds.has(id)) {
                this.gameLayer.removeChild(sprite);
                sprite.destroy();
                this.projectileSprites.delete(id);
            }
        }

        // Update/create projectile sprites
        for (const proj of projectiles) {
            let sprite = this.projectileSprites.get(proj.id);
            if (!sprite) {
                sprite = this.createEggSprite();
                this.gameLayer.addChild(sprite);
                this.projectileSprites.set(proj.id, sprite);
            }
            sprite.x = proj.x;
            sprite.y = proj.y;
        }
    }

    createEggSprite() {
        const g = new PIXI.Graphics();
        g.beginFill(CONFIG.COLORS.EGG);
        g.drawRect(-5, -6, 10, 12);
        g.drawRect(-6, -4, 12, 8);
        g.endFill();
        g.beginFill(0xFFEEAA);
        g.drawRect(-4, -5, 8, 10);
        g.endFill();
        g.beginFill(0xFFFFFF);
        g.drawRect(-2, -4, 3, 3);
        g.endFill();
        return g;
    }

    // --- Effects ---
    createSplat(x, y) {
        const g = new PIXI.Graphics();
        g.beginFill(CONFIG.COLORS.EGG_SPLAT, 0.8);
        g.drawCircle(0, 0, 20);
        g.drawCircle(15, -10, 8);
        g.drawCircle(-12, 8, 6);
        g.drawCircle(10, 12, 7);
        g.drawCircle(-15, -5, 5);
        g.drawCircle(5, -15, 6);
        g.endFill();
        g.x = x; g.y = y;
        g.rotation = Math.random() * Math.PI * 2;
        this.gameLayer.addChild(g);
        this.splats.push({ sprite: g, age: 0, lifetime: CONFIG.EGG.SPLAT_DURATION });
    }

    createImpactParticles(x, y) {
        const particles = [];
        for (let i = 0; i < 8; i++) {
            const angle = (Math.PI * 2 * i) / 8;
            const speed = 100 + Math.random() * 100;
            const p = new PIXI.Graphics();
            p.beginFill(CONFIG.COLORS.EGG_SPLAT);
            p.drawCircle(0, 0, 4);
            p.endFill();
            p.x = x; p.y = y;
            this.effectsLayer.addChild(p);
            particles.push({ sprite: p, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, age: 0 });
        }
        this.splats.push({ particles, age: 0, lifetime: 0.5, isParticles: true });
    }

    createScreenShake(intensity, duration) {
        if (this.screenShake) {
            this.app.stage.x = 0;
            this.app.stage.y = 0;
        }
        this.screenShake = { intensity, duration, elapsed: 0 };
    }

    updateEffects(deltaTime) {
        // Screen shake
        if (this.screenShake) {
            this.screenShake.elapsed += deltaTime;
            if (this.screenShake.elapsed < this.screenShake.duration) {
                const amount = this.screenShake.intensity * (1 - this.screenShake.elapsed / this.screenShake.duration);
                this.app.stage.x = (Math.random() - 0.5) * amount * 2;
                this.app.stage.y = (Math.random() - 0.5) * amount * 2;
            } else {
                this.app.stage.x = 0;
                this.app.stage.y = 0;
                this.screenShake = null;
            }
        }

        // Splats and particles
        for (let i = this.splats.length - 1; i >= 0; i--) {
            const s = this.splats[i];
            s.age += deltaTime;

            if (s.isParticles) {
                for (const p of s.particles) {
                    p.sprite.x += p.vx * deltaTime;
                    p.sprite.y += p.vy * deltaTime;
                    p.vy += 400 * deltaTime;
                    p.sprite.alpha = Math.max(0, 1 - s.age / s.lifetime);
                }
            } else {
                s.sprite.alpha = Math.max(0, (1 - s.age / s.lifetime) * 0.8);
            }

            if (s.age >= s.lifetime) {
                if (s.isParticles) {
                    for (const p of s.particles) {
                        this.effectsLayer.removeChild(p.sprite);
                        p.sprite.destroy();
                    }
                } else {
                    this.gameLayer.removeChild(s.sprite);
                    s.sprite.destroy();
                }
                this.splats.splice(i, 1);
            }
        }
    }

    // --- UI ---
    createGameUI() {
        this.uiLayer.removeChildren();

        this.timerText = new PIXI.Text('', {
            fontFamily: CONFIG.UI.FONT_FAMILY, fontSize: CONFIG.UI.FONT_SIZE_LARGE,
            fill: 0xffffff, align: 'center', fontWeight: 'bold',
            stroke: 0x000000, strokeThickness: 4,
            dropShadow: true, dropShadowColor: 0x000000, dropShadowBlur: 6, dropShadowDistance: 3
        });
        this.timerText.anchor.set(0.5, 0);
        this.timerText.x = CONFIG.SCREEN.WIDTH / 2;
        this.timerText.y = 20;
        this.uiLayer.addChild(this.timerText);

        this.eggCountText = new PIXI.Text('', {
            fontFamily: CONFIG.UI.FONT_FAMILY, fontSize: CONFIG.UI.FONT_SIZE_MEDIUM,
            fill: 0xffffff, align: 'right', fontWeight: 'bold',
            stroke: 0x000000, strokeThickness: 3,
            dropShadow: true, dropShadowColor: 0x000000, dropShadowBlur: 4, dropShadowDistance: 2
        });
        this.eggCountText.anchor.set(1, 0);
        this.eggCountText.x = CONFIG.SCREEN.WIDTH - 20;
        this.eggCountText.y = 20;
        this.uiLayer.addChild(this.eggCountText);

        this.sprintMeterGraphics = new PIXI.Graphics();
        this.uiLayer.addChild(this.sprintMeterGraphics);

        this.sprintMeterText = new PIXI.Text('SPRINT', {
            fontFamily: CONFIG.UI.FONT_FAMILY, fontSize: CONFIG.UI.FONT_SIZE_SMALL,
            fill: 0xffffff, fontWeight: 'bold',
            stroke: 0x000000, strokeThickness: 3,
            dropShadow: true, dropShadowColor: 0x000000, dropShadowBlur: 4, dropShadowDistance: 2
        });
        this.sprintMeterText.x = 20;
        this.sprintMeterText.y = 20;
        this.uiLayer.addChild(this.sprintMeterText);
    }

    renderUI(state) {
        if (!state) return;

        // Timer
        if (this.timerText) {
            const mins = Math.floor(state.time / 60);
            const secs = Math.floor(state.time % 60);
            this.timerText.text = `${mins}:${secs.toString().padStart(2, '0')}`;

            if (state.time <= 10) {
                this.timerText.style.fill = 0xff0000;
                const pulse = Math.sin(Date.now() / 200) * 0.3 + 1.0;
                this.timerText.scale.set(pulse);
            } else if (state.time <= 30) {
                this.timerText.style.fill = 0xffaa00;
                this.timerText.scale.set(1.0);
            } else {
                this.timerText.style.fill = 0xffffff;
                this.timerText.scale.set(1.0);
            }
        }

        // Egg count
        if (this.eggCountText && state.pupil) {
            this.eggCountText.text = `Eggs: ${state.pupil.eggs}/${state.pupil.maxEggs}`;
            if (state.pupil.eggs === 0) this.eggCountText.style.fill = 0xff0000;
            else if (state.pupil.eggs === 1) this.eggCountText.style.fill = 0xffaa00;
            else this.eggCountText.style.fill = 0xffffff;
        }

        // Sprint meter
        if (this.sprintMeterGraphics && state.teacher) {
            const meterX = 20, meterY = 55, meterW = 150, meterH = 20;
            this.sprintMeterGraphics.clear();
            this.sprintMeterGraphics.beginFill(0x000000, 0.5);
            this.sprintMeterGraphics.drawRect(meterX, meterY, meterW, meterH);
            this.sprintMeterGraphics.endFill();
            this.sprintMeterGraphics.lineStyle(2, 0xffffff, 1);
            this.sprintMeterGraphics.drawRect(meterX, meterY, meterW, meterH);

            const t = state.teacher;
            if (t.sprint) {
                const fill = meterW * (t.sprintT / CONFIG.TEACHER.SPRINT_DURATION);
                this.sprintMeterGraphics.beginFill(0x00ff00, 0.8);
                this.sprintMeterGraphics.drawRect(meterX + 2, meterY + 2, Math.max(0, fill - 4), meterH - 4);
                this.sprintMeterGraphics.endFill();
            } else if (!t.sprintAvail) {
                const cd = t.sprintCD / CONFIG.TEACHER.SPRINT_COOLDOWN;
                const fill = meterW * (1 - cd);
                this.sprintMeterGraphics.beginFill(0xff0000, 0.8);
                this.sprintMeterGraphics.drawRect(meterX + 2, meterY + 2, Math.max(0, fill - 4), meterH - 4);
                this.sprintMeterGraphics.endFill();
            } else {
                this.sprintMeterGraphics.beginFill(0xffff00, 0.8);
                this.sprintMeterGraphics.drawRect(meterX + 2, meterY + 2, meterW - 4, meterH - 4);
                this.sprintMeterGraphics.endFill();
            }
        }
    }

    // --- Lobby / status screens ---
    // lobbyState: { myId, myRole, teacherTaken, pupilTaken, teacherId, pupilId, canStart }
    // callbacks: { onSelectRole(role), onStart() }
    showLobby(lobbyState, callbacks) {
        this.uiLayer.removeChildren();
        this.app.stage.eventMode = 'static';

        const cx = CONFIG.SCREEN.WIDTH / 2;

        // Title
        const title = new PIXI.Text('RECESS REVENGE', {
            fontFamily: CONFIG.UI.FONT_FAMILY, fontSize: 68, fill: 0xffff00,
            fontWeight: 'bold', stroke: 0x000000, strokeThickness: 6,
            dropShadow: true, dropShadowColor: 0x000000, dropShadowBlur: 8, dropShadowDistance: 4
        });
        title.anchor.set(0.5);
        title.x = cx; title.y = 80;
        this.uiLayer.addChild(title);

        // Subtitle
        const subtitle = new PIXI.Text('Choose your role', {
            fontFamily: CONFIG.UI.FONT_FAMILY, fontSize: 28, fill: 0xcccccc,
            stroke: 0x000000, strokeThickness: 3
        });
        subtitle.anchor.set(0.5);
        subtitle.x = cx; subtitle.y = 150;
        this.uiLayer.addChild(subtitle);

        // Role cards
        const cardW = 240, cardH = 220, cardGap = 60;
        const cardsY = 220;
        const teacherX = cx - cardW - cardGap / 2;
        const pupilX = cx + cardGap / 2;

        this._createRoleCard(
            teacherX, cardsY, cardW, cardH,
            'TEACHER', 'WASD + Shift\nDodge the eggs!\nReach the school!',
            0x3498db, 0x1a6da8,
            lobbyState, 'teacher', callbacks
        );

        this._createRoleCard(
            pupilX, cardsY, cardW, cardH,
            'PUPIL', 'Mouse + Click\nThrow eggs!\nStop the teacher!',
            0xe74c3c, 0xb33a2e,
            lobbyState, 'pupil', callbacks
        );

        // Start button (only when both roles taken)
        if (lobbyState.canStart) {
            const btnW = 260, btnH = 60;
            const btnX = cx - btnW / 2, btnY = 480;

            const startBtn = new PIXI.Container();
            const btnBg = new PIXI.Graphics();
            btnBg.beginFill(0x27ae60);
            btnBg.drawRoundedRect(0, 0, btnW, btnH, 12);
            btnBg.endFill();
            btnBg.lineStyle(3, 0x2ecc71);
            btnBg.drawRoundedRect(0, 0, btnW, btnH, 12);
            startBtn.addChild(btnBg);

            const btnText = new PIXI.Text('START GAME', {
                fontFamily: CONFIG.UI.FONT_FAMILY, fontSize: 32, fill: 0xffffff,
                fontWeight: 'bold', stroke: 0x000000, strokeThickness: 3
            });
            btnText.anchor.set(0.5);
            btnText.x = btnW / 2; btnText.y = btnH / 2;
            startBtn.addChild(btnText);

            startBtn.x = btnX; startBtn.y = btnY;
            startBtn.eventMode = 'static';
            startBtn.cursor = 'pointer';
            startBtn.on('pointerdown', () => callbacks?.onStart?.());
            startBtn.on('pointerover', () => { btnBg.tint = 0xdddddd; });
            startBtn.on('pointerout', () => { btnBg.tint = 0xffffff; });

            this.uiLayer.addChild(startBtn);
        } else {
            const waitText = new PIXI.Text('Waiting for both players to pick a role...', {
                fontFamily: CONFIG.UI.FONT_FAMILY, fontSize: 22, fill: 0x888888,
                stroke: 0x000000, strokeThickness: 2
            });
            waitText.anchor.set(0.5);
            waitText.x = cx; waitText.y = 500;
            this.uiLayer.addChild(waitText);
        }

        // Room code
        const urlParams = new URLSearchParams(window.location.search);
        const roomId = urlParams.get('room') || 'default';
        const roomText = new PIXI.Text(`Room: ${roomId}  |  Share this URL to invite a friend!`, {
            fontFamily: CONFIG.UI.FONT_FAMILY, fontSize: 18, fill: 0x888888,
            stroke: 0x000000, strokeThickness: 2
        });
        roomText.anchor.set(0.5);
        roomText.x = cx; roomText.y = 580;
        this.uiLayer.addChild(roomText);

        // Player count
        const countText = new PIXI.Text(`Players in room: ${lobbyState.playerCount || 1}`, {
            fontFamily: CONFIG.UI.FONT_FAMILY, fontSize: 18, fill: 0x666666,
            stroke: 0x000000, strokeThickness: 2
        });
        countText.anchor.set(0.5);
        countText.x = cx; countText.y = 615;
        this.uiLayer.addChild(countText);
    }

    _createRoleCard(x, y, w, h, roleName, description, color, darkColor, lobbyState, role, callbacks) {
        const myId = lobbyState.myId;
        const isTaken = role === 'teacher' ? lobbyState.teacherTaken : lobbyState.pupilTaken;
        const takenById = role === 'teacher' ? lobbyState.teacherId : lobbyState.pupilId;
        const isMe = takenById === myId;
        const isAvailable = !isTaken;
        const canClick = isAvailable || isMe; // Can click to select or deselect

        const card = new PIXI.Container();

        // Card background
        const bg = new PIXI.Graphics();
        if (isMe) {
            // Selected by me - bright border
            bg.beginFill(darkColor, 0.9);
            bg.drawRoundedRect(0, 0, w, h, 12);
            bg.endFill();
            bg.lineStyle(4, color);
            bg.drawRoundedRect(0, 0, w, h, 12);
        } else if (isTaken) {
            // Taken by other - grayed out
            bg.beginFill(0x333333, 0.7);
            bg.drawRoundedRect(0, 0, w, h, 12);
            bg.endFill();
            bg.lineStyle(2, 0x555555);
            bg.drawRoundedRect(0, 0, w, h, 12);
        } else {
            // Available
            bg.beginFill(0x222222, 0.8);
            bg.drawRoundedRect(0, 0, w, h, 12);
            bg.endFill();
            bg.lineStyle(3, color, 0.6);
            bg.drawRoundedRect(0, 0, w, h, 12);
        }
        card.addChild(bg);

        // Role name
        const nameText = new PIXI.Text(roleName, {
            fontFamily: CONFIG.UI.FONT_FAMILY, fontSize: 36,
            fill: isMe ? 0xffffff : (isTaken ? 0x666666 : color),
            fontWeight: 'bold', stroke: 0x000000, strokeThickness: 4
        });
        nameText.anchor.set(0.5, 0);
        nameText.x = w / 2; nameText.y = 20;
        card.addChild(nameText);

        // Description
        const descText = new PIXI.Text(description, {
            fontFamily: CONFIG.UI.FONT_FAMILY, fontSize: 16,
            fill: isTaken && !isMe ? 0x555555 : 0xcccccc,
            align: 'center', stroke: 0x000000, strokeThickness: 2,
            lineHeight: 22
        });
        descText.anchor.set(0.5, 0);
        descText.x = w / 2; descText.y = 70;
        card.addChild(descText);

        // Status line
        let statusStr, statusColor;
        if (isMe) {
            statusStr = 'SELECTED';
            statusColor = 0x2ecc71;
        } else if (isTaken) {
            statusStr = 'TAKEN';
            statusColor = 0x666666;
        } else {
            statusStr = 'CLICK TO SELECT';
            statusColor = color;
        }

        const statusText = new PIXI.Text(statusStr, {
            fontFamily: CONFIG.UI.FONT_FAMILY, fontSize: 18,
            fill: statusColor, fontWeight: 'bold',
            stroke: 0x000000, strokeThickness: 2
        });
        statusText.anchor.set(0.5);
        statusText.x = w / 2; statusText.y = h - 30;
        card.addChild(statusText);

        card.x = x; card.y = y;

        if (canClick) {
            card.eventMode = 'static';
            card.cursor = 'pointer';
            card.on('pointerdown', () => callbacks?.onSelectRole?.(role));
            card.on('pointerover', () => { bg.tint = 0xcccccc; });
            card.on('pointerout', () => { bg.tint = 0xffffff; });
        }

        this.uiLayer.addChild(card);
    }

    showCountdown(count) {
        // Remove previous countdown text
        const prev = this.uiLayer.getChildByName('countdownText');
        if (prev) this.uiLayer.removeChild(prev);

        const text = new PIXI.Text(count.toString(), {
            fontFamily: CONFIG.UI.FONT_FAMILY, fontSize: 120, fill: 0xffff00,
            fontWeight: 'bold', stroke: 0x000000, strokeThickness: 8
        });
        text.anchor.set(0.5);
        text.x = CONFIG.SCREEN.WIDTH / 2;
        text.y = CONFIG.SCREEN.HEIGHT / 2;
        text.name = 'countdownText';
        this.uiLayer.addChild(text);
    }

    showGameOver(winner) {
        this.uiLayer.removeChildren();
        this.timerText = null;
        this.eggCountText = null;
        this.sprintMeterGraphics = null;
        this.sprintMeterText = null;

        const winnerText = winner === WINNER.TEACHER
            ? 'TEACHER WINS!\nReached the school!'
            : 'PUPIL WINS!\nTime ran out!';
        const winnerColor = winner === WINNER.TEACHER ? 0x3498db : 0xffd700;

        const text = new PIXI.Text(winnerText + '\n\nPress SPACE to return to lobby', {
            fontFamily: CONFIG.UI.FONT_FAMILY, fontSize: CONFIG.UI.FONT_SIZE_LARGE,
            fill: winnerColor, align: 'center', fontWeight: 'bold',
            stroke: 0x000000, strokeThickness: 6,
            dropShadow: true, dropShadowColor: 0x000000, dropShadowBlur: 10, dropShadowDistance: 5
        });
        text.anchor.set(0.5);
        text.x = CONFIG.SCREEN.WIDTH / 2;
        text.y = CONFIG.SCREEN.HEIGHT / 2;
        this.uiLayer.addChild(text);
    }

    showDisconnected(message) {
        this.uiLayer.removeChildren();
        const text = new PIXI.Text(message + '\n\nRefresh to reconnect.', {
            fontFamily: CONFIG.UI.FONT_FAMILY, fontSize: 36, fill: 0xff4444,
            align: 'center', fontWeight: 'bold',
            stroke: 0x000000, strokeThickness: 4
        });
        text.anchor.set(0.5);
        text.x = CONFIG.SCREEN.WIDTH / 2;
        text.y = CONFIG.SCREEN.HEIGHT / 2;
        this.uiLayer.addChild(text);
    }

    // --- Full game setup/teardown ---
    setupGame() {
        // Clear previous game objects
        this.gameLayer.removeChildren();
        this.effectsLayer.removeChildren();
        this.projectileSprites.clear();
        this.splats = [];
        this.screenShake = null;

        this.createTeacher();
        this.createPupil();
        this.createGameUI();
    }

    cleanupGame() {
        this.gameLayer.removeChildren();
        this.effectsLayer.removeChildren();
        this.projectileSprites.clear();
        this.splats = [];
        this.teacherSprite = null;
        this.pupilSprite = null;
        this.crosshairSprite = null;
        this.trajectoryGraphics = null;
    }
}
