// RECESS REVENGE - Client Renderer (PixiJS rendering orchestrator)

import { CONFIG, GAME_STATE, WINNER, roleTeam, roleIndex } from '../shared/config.js';
import { AudioManager } from './audio.js';

// PixiJS loaded via CDN globally
const PIXI = window.PIXI;

// Texture caches (per-slot spritesheets: index 0 = player 1, index 1 = player 2)
let TEACHER_SPRITESHEETS = [null, null];
let PUPIL_SPRITESHEETS = [null, null];
let TREE_TEXTURES = [];
let BUSH_TEXTURE = null;
let BENCH_TEXTURE = null;
let COOP_TEXTURE = null;
let SCHOOL_TEXTURE = null;

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

        // Game object renderers — maps keyed by slot index
        this.teacherSprites = new Map();
        this.teacherAnims = new Map();
        this.crosshairSprites = new Map();
        this.trajectoryGraphicsMap = new Map();
        this.pupilSprites = new Map();
        this.pupilAnims = new Map();
        this.projectileSprites = new Map(); // id -> sprite

        // UI
        this.timerText = null;
        this.eggCountText = null;
        this.sprintMeterGraphics = null;
        this.sprintMeterText = null;

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
            TEACHER_SPRITESHEETS[0] = await PIXI.Assets.load('assets/models/teacher-spritesheet.json');
        } catch (e) { console.warn('Teacher spritesheet failed:', e); }

        try {
            TEACHER_SPRITESHEETS[1] = await PIXI.Assets.load('assets/models/teacher2-spritesheet.json');
        } catch (e) { console.warn('Teacher2 spritesheet failed:', e); }

        try {
            PUPIL_SPRITESHEETS[0] = await PIXI.Assets.load('assets/models/pupil-spritesheet.json');
        } catch (e) { console.warn('Pupil spritesheet failed:', e); }

        try {
            PUPIL_SPRITESHEETS[1] = await PIXI.Assets.load('assets/models/pupil2-spritesheet.json');
        } catch (e) { console.warn('Pupil2 spritesheet failed:', e); }

        try {
            for (const path of ['assets/models/tree1.png', 'assets/models/tree2.png']) {
                TREE_TEXTURES.push(await PIXI.Assets.load(path));
            }
            BUSH_TEXTURE = await PIXI.Assets.load('assets/models/bush1.png');
            BENCH_TEXTURE = await PIXI.Assets.load('assets/models/bench1.png');
            COOP_TEXTURE = await PIXI.Assets.load('assets/models/chicken-coop.png');
            SCHOOL_TEXTURE = await PIXI.Assets.load('assets/models/school-building.png');
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
        const x = CONFIG.SCHOOL.X, y = CONFIG.SCHOOL.Y;
        const w = CONFIG.SCHOOL.WIDTH, h = CONFIG.SCHOOL.HEIGHT;

        if (SCHOOL_TEXTURE) {
            const sprite = new PIXI.Sprite(SCHOOL_TEXTURE);
            const scale = h / SCHOOL_TEXTURE.height;
            sprite.width = SCHOOL_TEXTURE.width * scale;
            sprite.height = h;
            sprite.x = x + (w - sprite.width) / 2;
            sprite.y = y;
            this.obstaclesLayer.addChild(sprite);
        } else {
            // Fallback procedural school
            const school = new PIXI.Graphics();
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
    createTeacher(slot) {
        const sheet = TEACHER_SPRITESHEETS[slot] || TEACHER_SPRITESHEETS[0];
        let sprite;
        if (sheet) {
            const textures = sheet.animations.idle;
            sprite = new PIXI.AnimatedSprite(textures);
            sprite.anchor.set(0.5, 0.5);
            sprite.animationSpeed = 0.1;
            sprite.loop = true;
            sprite.play();
            const scale = (CONFIG.TEACHER.SIZE * 2) / 64;
            sprite.scale.set(scale, scale);
        } else {
            const color = slot === 1 ? CONFIG.COLORS.TEACHER2 : CONFIG.COLORS.TEACHER;
            sprite = new PIXI.Graphics();
            sprite.beginFill(color);
            sprite.drawCircle(0, 0, CONFIG.TEACHER.HITBOX_RADIUS);
            sprite.endFill();
        }

        this.teacherSprites.set(slot, sprite);
        this.teacherAnims.set(slot, 'idle');
        this.gameLayer.addChild(sprite);
    }

    renderTeacher(state, slot) {
        const sprite = this.teacherSprites.get(slot);
        if (!sprite || !state) return;

        sprite.x = state.x;
        sprite.y = state.y;

        // Animation switch
        const sheet = TEACHER_SPRITESHEETS[slot] || TEACHER_SPRITESHEETS[0];
        const currentAnim = this.teacherAnims.get(slot);
        if (state.anim !== currentAnim && sheet) {
            this.teacherAnims.set(slot, state.anim);
            const newTextures = sheet.animations[state.anim];
            if (newTextures && sprite.textures) {
                sprite.textures = newTextures;
                sprite.animationSpeed = state.anim === 'sprint' ? 0.2 : state.anim === 'walk' ? 0.15 : 0.1;
                sprite.play();
            }
        }

        // Facing direction
        if (sprite.textures) {
            const baseScale = (CONFIG.TEACHER.SIZE * 2) / 64;
            const mult = state.sprint ? 1.15 : 1.0;
            const scaleX = state.facing ? baseScale * mult : -baseScale * mult;
            sprite.scale.set(scaleX, baseScale * mult);
        }

        // Invulnerability flashing
        if (state.invuln) {
            sprite.alpha = Math.sin(Date.now() * 0.02) * 0.5 + 0.5;
        } else if (state.hidden) {
            sprite.alpha = 0.6;
            sprite.tint = 0x888888;
        } else {
            sprite.alpha = 1.0;
            sprite.tint = 0xffffff;
        }
    }

    renderTeachers(teachersState) {
        if (!teachersState) return;
        for (const t of teachersState) {
            this.renderTeacher(t, t.slot);
        }
    }

    // --- Pupil rendering ---
    createPupil(slot) {
        const crosshairColor = slot === 1 ? CONFIG.COLORS.CROSSHAIR2 : CONFIG.COLORS.CROSSHAIR;

        // Pupil character sprite
        const sheet = PUPIL_SPRITESHEETS[slot] || PUPIL_SPRITESHEETS[0];
        if (sheet) {
            const textures = sheet.animations.idle;
            const sprite = new PIXI.AnimatedSprite(textures);
            sprite.anchor.set(0.5, 0.5);
            sprite.animationSpeed = 0.1;
            sprite.loop = true;
            sprite.play();
            const throwPos = CONFIG.PUPIL.THROW_POSITIONS[slot] || { x: CONFIG.SCREEN.WIDTH - 60, y: CONFIG.SCREEN.HEIGHT - 60 };
            sprite.x = throwPos.x;
            sprite.y = throwPos.y;
            this.gameLayer.addChild(sprite);
            this.pupilSprites.set(slot, sprite);
        }

        // Crosshair
        const ch = new PIXI.Graphics();
        ch.lineStyle(2, crosshairColor, 1);
        ch.drawCircle(0, 0, 12);
        ch.moveTo(-16, 0); ch.lineTo(-4, 0);
        ch.moveTo(4, 0); ch.lineTo(16, 0);
        ch.moveTo(0, -16); ch.lineTo(0, -4);
        ch.moveTo(0, 4); ch.lineTo(0, 16);
        ch.beginFill(crosshairColor);
        ch.drawCircle(0, 0, 2);
        ch.endFill();
        this.crosshairSprites.set(slot, ch);
        this.gameLayer.addChild(ch);

        // Trajectory
        const traj = new PIXI.Graphics();
        this.trajectoryGraphicsMap.set(slot, traj);
        this.gameLayer.addChild(traj);

        this.pupilAnims.set(slot, 'idle');
    }

    renderPupil(state, slot, isLocal, eggPool) {
        if (!state) return;

        // Pupil sprite animation
        const pupilSprite = this.pupilSprites.get(slot);
        const pSheet = PUPIL_SPRITESHEETS[slot] || PUPIL_SPRITESHEETS[0];
        const currentAnim = this.pupilAnims.get(slot);
        if (pupilSprite && pSheet) {
            if (state.anim !== currentAnim) {
                this.pupilAnims.set(slot, state.anim);
                const newTextures = pSheet.animations[state.anim];
                if (newTextures) {
                    pupilSprite.textures = newTextures;
                    pupilSprite.animationSpeed = state.anim === 'throw' ? 0.2 : 0.1;
                    pupilSprite.loop = state.anim !== 'throw';
                    pupilSprite.play();
                }
            }
        }

        // Crosshair
        const ch = this.crosshairSprites.get(slot);
        if (ch) {
            ch.visible = true;
            ch.x = state.crossX;
            ch.y = state.crossY;

            const localTint = slot === 1 ? 0xff8844 : 0xff4444;
            const remoteTint = slot === 1 ? 0xcc66ff : 0xff8800;
            if (isLocal) {
                if (eggPool && eggPool.refilling) {
                    const pulse = Math.sin(Date.now() / 100) * 0.2 + 1.0;
                    ch.scale.set(pulse);
                    ch.tint = 0x00ff00;
                    ch.alpha = 0.8;
                } else {
                    ch.tint = localTint;
                    ch.alpha = 0.5;
                    ch.scale.set(1.0);
                }
            } else {
                // Other player's crosshair — dimmer and smaller
                ch.tint = remoteTint;
                ch.alpha = 0.3;
                ch.scale.set(0.7);
            }
        }

        // Trajectory preview (only for local pupil)
        const traj = this.trajectoryGraphicsMap.get(slot);
        if (traj) {
            traj.clear();
            if (isLocal && eggPool && eggPool.eggs > 0 && state.canThrow) {
                const startX = state.throwX;
                const startY = state.throwY;
                const numPoints = 15;
                for (let i = 0; i <= numPoints; i++) {
                    const t = i / numPoints;
                    const dx = state.crossX - startX;
                    const dy = state.crossY - startY;
                    const x = startX + dx * t;
                    const linearY = startY + dy * t;
                    const arcOffset = CONFIG.EGG.ARC_HEIGHT * 4 * t * (1 - t);
                    const y = linearY - arcOffset;
                    const trajColor = slot === 1 ? CONFIG.COLORS.TRAJECTORY2 : CONFIG.COLORS.TRAJECTORY;
                    traj.beginFill(trajColor, 0.6);
                    traj.drawCircle(x, y, 3);
                    traj.endFill();
                }
            }
        }
    }

    renderPupils(pupilsState, myRole, eggPool) {
        if (!pupilsState) return;
        const mySlot = roleIndex(myRole);
        const myTeam = roleTeam(myRole);
        for (const p of pupilsState) {
            const isLocal = myTeam === 'pupil' && p.slot === mySlot;
            this.renderPupil(p, p.slot, isLocal, eggPool);
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
    createGameUI(myRole) {
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

        this.musicHintText = new PIXI.Text('[M] Music: ON', {
            fontFamily: CONFIG.UI.FONT_FAMILY, fontSize: 18,
            fill: 0xffffff, stroke: 0x000000, strokeThickness: 4
        });
        this.musicHintText.anchor.set(1, 1);
        this.musicHintText.x = CONFIG.SCREEN.WIDTH - 10;
        this.musicHintText.y = CONFIG.SCREEN.HEIGHT - 10;
        this.uiLayer.addChild(this.musicHintText);

        // Sprint meter (shown for teacher players)
        const team = roleTeam(myRole);
        if (team === 'teacher') {
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
        } else {
            this.sprintMeterGraphics = null;
            this.sprintMeterText = null;
        }
    }

    renderUI(state, myRole) {
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

        // Egg count (from shared pool)
        if (this.eggCountText && state.eggPool) {
            this.eggCountText.text = `Eggs: ${state.eggPool.eggs}/${state.eggPool.maxEggs}`;
            if (state.eggPool.eggs === 0) this.eggCountText.style.fill = 0xff0000;
            else if (state.eggPool.eggs === 1) this.eggCountText.style.fill = 0xffaa00;
            else this.eggCountText.style.fill = 0xffffff;
        }

        // Music hint
        if (this.musicHintText) {
            const muted = this.audio.musicMuted;
            this.musicHintText.text = muted ? '[M] Music: OFF' : '[M] Music: ON';
            this.musicHintText.style.fill = muted ? 0x999999 : 0xffffff;
        }

        // Sprint meter (for local teacher)
        if (this.sprintMeterGraphics && state.teachers) {
            const mySlot = roleIndex(myRole);
            const myTeacher = state.teachers.find(t => t.slot === mySlot);
            if (myTeacher) {
                const meterX = 20, meterY = 55, meterW = 150, meterH = 20;
                this.sprintMeterGraphics.clear();
                this.sprintMeterGraphics.beginFill(0x000000, 0.5);
                this.sprintMeterGraphics.drawRect(meterX, meterY, meterW, meterH);
                this.sprintMeterGraphics.endFill();
                this.sprintMeterGraphics.lineStyle(2, 0xffffff, 1);
                this.sprintMeterGraphics.drawRect(meterX, meterY, meterW, meterH);

                const t = myTeacher;
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
    }

    // --- Lobby / status screens ---
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
        title.x = cx; title.y = 70;
        this.uiLayer.addChild(title);

        // Subtitle
        const subtitle = new PIXI.Text('Choose your role (2-4 players)', {
            fontFamily: CONFIG.UI.FONT_FAMILY, fontSize: 24, fill: 0xcccccc,
            stroke: 0x000000, strokeThickness: 3
        });
        subtitle.anchor.set(0.5);
        subtitle.x = cx; subtitle.y = 130;
        this.uiLayer.addChild(subtitle);

        // Team labels
        const teacherLabel = new PIXI.Text('TEACHERS', {
            fontFamily: CONFIG.UI.FONT_FAMILY, fontSize: 22, fill: 0x3498db,
            fontWeight: 'bold', stroke: 0x000000, strokeThickness: 3
        });
        teacherLabel.anchor.set(0.5);
        teacherLabel.x = cx - 155; teacherLabel.y = 165;
        this.uiLayer.addChild(teacherLabel);

        const pupilLabel = new PIXI.Text('PUPILS', {
            fontFamily: CONFIG.UI.FONT_FAMILY, fontSize: 22, fill: 0xe74c3c,
            fontWeight: 'bold', stroke: 0x000000, strokeThickness: 3
        });
        pupilLabel.anchor.set(0.5);
        pupilLabel.x = cx + 155; pupilLabel.y = 165;
        this.uiLayer.addChild(pupilLabel);

        // Role cards — 2x2 grid
        const cardW = 200, cardH = 160, cardGap = 20, colGap = 60;
        const leftCol = cx - cardW - colGap / 2;
        const rightCol = cx + colGap / 2;
        const row1Y = 190;
        const row2Y = row1Y + cardH + cardGap;

        // Teacher 1
        this._createRoleCard(
            leftCol, row1Y, cardW, cardH,
            'TEACHER 1', 'WASD + Shift\nDodge eggs!\nReach school!',
            0x3498db, 0x1a6da8,
            lobbyState, 'teacher1', callbacks
        );

        // Teacher 2 (green)
        this._createRoleCard(
            leftCol, row2Y, cardW, cardH,
            'TEACHER 2', 'WASD + Shift\nDodge eggs!\nReach school!',
            0x2ecc71, 0x1a9c55,
            lobbyState, 'teacher2', callbacks
        );

        // Pupil 1
        this._createRoleCard(
            rightCol, row1Y, cardW, cardH,
            'PUPIL 1', 'Mouse + Click\nThrow eggs!\nStop teachers!',
            0xe74c3c, 0xb33a2e,
            lobbyState, 'pupil1', callbacks
        );

        // Pupil 2 (purple)
        this._createRoleCard(
            rightCol, row2Y, cardW, cardH,
            'PUPIL 2', 'Mouse + Click\nThrow eggs!\nStop teachers!',
            0x9b59b6, 0x7d3c98,
            lobbyState, 'pupil2', callbacks
        );

        // Start button (when at least 1 teacher + 1 pupil)
        const startY = row2Y + cardH + 30;
        if (lobbyState.canStart) {
            const btnW = 260, btnH = 50;
            const btnX = cx - btnW / 2;

            const startBtn = new PIXI.Container();
            const btnBg = new PIXI.Graphics();
            btnBg.beginFill(0x27ae60);
            btnBg.drawRoundedRect(0, 0, btnW, btnH, 12);
            btnBg.endFill();
            btnBg.lineStyle(3, 0x2ecc71);
            btnBg.drawRoundedRect(0, 0, btnW, btnH, 12);
            startBtn.addChild(btnBg);

            const btnText = new PIXI.Text('START GAME', {
                fontFamily: CONFIG.UI.FONT_FAMILY, fontSize: 28, fill: 0xffffff,
                fontWeight: 'bold', stroke: 0x000000, strokeThickness: 3
            });
            btnText.anchor.set(0.5);
            btnText.x = btnW / 2; btnText.y = btnH / 2;
            startBtn.addChild(btnText);

            startBtn.x = btnX; startBtn.y = startY;
            startBtn.eventMode = 'static';
            startBtn.cursor = 'pointer';
            startBtn.on('pointerdown', () => callbacks?.onStart?.());
            startBtn.on('pointerover', () => { btnBg.tint = 0xdddddd; });
            startBtn.on('pointerout', () => { btnBg.tint = 0xffffff; });

            this.uiLayer.addChild(startBtn);
        } else {
            const waitText = new PIXI.Text('Need at least 1 teacher and 1 pupil to start...', {
                fontFamily: CONFIG.UI.FONT_FAMILY, fontSize: 20, fill: 0xcccccc,
                stroke: 0x000000, strokeThickness: 2
            });
            waitText.anchor.set(0.5);
            waitText.x = cx; waitText.y = startY + 20;
            this.uiLayer.addChild(waitText);
        }

        // Room code
        const urlParams = new URLSearchParams(window.location.search);
        const roomId = urlParams.get('room') || 'default';
        const roomText = new PIXI.Text(`Room: ${roomId}  |  Share this URL to invite friends!`, {
            fontFamily: CONFIG.UI.FONT_FAMILY, fontSize: 16, fill: 0xcccccc,
            stroke: 0x000000, strokeThickness: 2
        });
        roomText.anchor.set(0.5);
        roomText.x = cx; roomText.y = startY + 65;
        this.uiLayer.addChild(roomText);

        // Player count
        const countText = new PIXI.Text(`Players in room: ${lobbyState.playerCount || 1}`, {
            fontFamily: CONFIG.UI.FONT_FAMILY, fontSize: 16, fill: 0xcccccc,
            stroke: 0x000000, strokeThickness: 2
        });
        countText.anchor.set(0.5);
        countText.x = cx; countText.y = startY + 90;
        this.uiLayer.addChild(countText);
    }

    _createRoleCard(x, y, w, h, roleName, description, color, darkColor, lobbyState, role, callbacks) {
        const myId = lobbyState.myId;
        const slotInfo = lobbyState[role]; // { taken, playerId }
        const isTaken = slotInfo && slotInfo.taken;
        const isMe = slotInfo && slotInfo.playerId === myId;
        const canClick = !isTaken || isMe;

        const card = new PIXI.Container();

        // Card background
        const bg = new PIXI.Graphics();
        if (isMe) {
            bg.beginFill(darkColor, 0.9);
            bg.drawRoundedRect(0, 0, w, h, 12);
            bg.endFill();
            bg.lineStyle(4, color);
            bg.drawRoundedRect(0, 0, w, h, 12);
        } else if (isTaken) {
            bg.beginFill(0x333333, 0.7);
            bg.drawRoundedRect(0, 0, w, h, 12);
            bg.endFill();
            bg.lineStyle(2, 0x555555);
            bg.drawRoundedRect(0, 0, w, h, 12);
        } else {
            bg.beginFill(0x222222, 0.8);
            bg.drawRoundedRect(0, 0, w, h, 12);
            bg.endFill();
            bg.lineStyle(3, color, 0.6);
            bg.drawRoundedRect(0, 0, w, h, 12);
        }
        card.addChild(bg);

        // Role name
        const nameText = new PIXI.Text(roleName, {
            fontFamily: CONFIG.UI.FONT_FAMILY, fontSize: 26,
            fill: isMe ? 0xffffff : (isTaken ? 0x666666 : color),
            fontWeight: 'bold', stroke: 0x000000, strokeThickness: 3
        });
        nameText.anchor.set(0.5, 0);
        nameText.x = w / 2; nameText.y = 12;
        card.addChild(nameText);

        // Description
        const descText = new PIXI.Text(description, {
            fontFamily: CONFIG.UI.FONT_FAMILY, fontSize: 14,
            fill: isTaken && !isMe ? 0x555555 : 0xcccccc,
            align: 'center', stroke: 0x000000, strokeThickness: 2,
            lineHeight: 20
        });
        descText.anchor.set(0.5, 0);
        descText.x = w / 2; descText.y = 50;
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
            fontFamily: CONFIG.UI.FONT_FAMILY, fontSize: 16,
            fill: statusColor, fontWeight: 'bold',
            stroke: 0x000000, strokeThickness: 2
        });
        statusText.anchor.set(0.5);
        statusText.x = w / 2; statusText.y = h - 25;
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
        this.musicHintText = null;

        const winnerText = winner === WINNER.TEACHER
            ? 'TEACHERS WIN!\nReached the school!'
            : 'PUPILS WIN!\nTime ran out!';
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
    setupGame(myRole, teacherCount = 1, pupilCount = 1) {
        // Clear previous game objects
        this.gameLayer.removeChildren();
        this.effectsLayer.removeChildren();
        this.projectileSprites.clear();
        this.teacherSprites.clear();
        this.teacherAnims.clear();
        this.crosshairSprites.clear();
        this.trajectoryGraphicsMap.clear();
        this.pupilSprites.clear();
        this.pupilAnims.clear();
        this.splats = [];
        this.screenShake = null;

        for (let i = 0; i < teacherCount; i++) {
            this.createTeacher(i);
        }
        for (let i = 0; i < pupilCount; i++) {
            this.createPupil(i);
        }
        this.createGameUI(myRole);
    }

    cleanupGame() {
        this.gameLayer.removeChildren();
        this.effectsLayer.removeChildren();
        this.projectileSprites.clear();
        this.teacherSprites.clear();
        this.teacherAnims.clear();
        this.crosshairSprites.clear();
        this.trajectoryGraphicsMap.clear();
        this.pupilSprites.clear();
        this.pupilAnims.clear();
        this.splats = [];
    }
}
