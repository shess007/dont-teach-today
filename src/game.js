// RECESS REVENGE - Main Game Controller

class Game {
    constructor() {
        this.app = null;
        this.state = GAME_STATE.MENU;
        this.winner = WINNER.NONE;

        // Game objects (will be initialized later)
        this.teacher = null;
        this.pupil = null;
        this.obstacles = [];
        this.projectiles = [];
        this.splats = [];
        this.screenShake = null;
        this.ui = null;
        this.input = null;
        this.audio = new AudioManager();

        // Game timer
        this.timeRemaining = CONFIG.GAME.MATCH_DURATION;
        this.lastTime = 0;

        // UI elements
        this.timerText = null;
        this.eggCountText = null;
        this.sprintMeterGraphics = null;
        this.sprintMeterText = null;

        // Note: init() is called separately since it's async
    }

    /**
     * Initialize PixiJS application (async for v8+)
     */
    async init() {
        // Create PixiJS application using v8 init pattern
        this.app = new PIXI.Application();

        await this.app.init({
            width: CONFIG.SCREEN.WIDTH,
            height: CONFIG.SCREEN.HEIGHT,
            background: CONFIG.SCREEN.BACKGROUND_COLOR, // Changed from backgroundColor
            antialias: false, // Pixel art looks better without antialiasing
            resolution: 1
        });

        // Add canvas to DOM (use canvas instead of view in v8)
        document.getElementById('pixi-container').appendChild(this.app.canvas);

        // Initialize input manager
        this.input = new InputManager(this.app.canvas);

        // Create container layers for organized rendering
        this.createLayers();

        // Preload obstacle PNG assets before creating obstacles
        await preloadObstacleAssets();

        // Create placeholder graphics and UI
        this.createPlaceholderGraphics();

        // Start game loop
        this.app.ticker.add((delta) => this.gameLoop(delta));

        console.log('RECESS REVENGE initialized!');
        console.log('Press SPACE to start');
    }

    /**
     * Create rendering layers for proper z-ordering
     */
    createLayers() {
        // Background layer (grass, paths)
        this.backgroundLayer = new PIXI.Container();
        this.app.stage.addChild(this.backgroundLayer);

        // Obstacles layer (bushes, benches, etc.)
        this.obstaclesLayer = new PIXI.Container();
        this.app.stage.addChild(this.obstaclesLayer);

        // Game objects layer (teacher, eggs, splats)
        this.gameLayer = new PIXI.Container();
        this.app.stage.addChild(this.gameLayer);

        // Effects layer (particles, screen effects)
        this.effectsLayer = new PIXI.Container();
        this.app.stage.addChild(this.effectsLayer);

        // UI layer (always on top)
        this.uiLayer = new PIXI.Container();
        this.app.stage.addChild(this.uiLayer);
    }

    /**
     * Create placeholder graphics before real assets are ready
     */
    createPlaceholderGraphics() {
        // Draw background
        this.drawBackground();

        // Draw school building (goal)
        this.drawSchool();

        // Create start screen
        this.showStartScreen();
    }

    /**
     * Draw pixel art asphalt background
     */
    drawBackground() {
        const bg = new PIXI.Graphics();

        // Base asphalt surface
        bg.beginFill(CONFIG.COLORS.ASPHALT);
        bg.drawRect(0, 0, CONFIG.SCREEN.WIDTH, CONFIG.SCREEN.HEIGHT);
        bg.endFill();

        // Asphalt texture (lighter patches and variations)
        bg.beginFill(0x454545, 0.3);
        for (let y = 0; y < CONFIG.SCREEN.HEIGHT; y += 40) {
            for (let x = 0; x < CONFIG.SCREEN.WIDTH; x += 60) {
                const offsetX = (y % 80 === 0) ? 30 : 0;
                bg.drawRect(x + offsetX + Math.random() * 15, y + Math.random() * 15, 25, 25);
            }
        }
        bg.endFill();

        // Darker asphalt patches
        bg.beginFill(0x2a2a2a, 0.4);
        for (let y = 0; y < CONFIG.SCREEN.HEIGHT; y += 50) {
            for (let x = 0; x < CONFIG.SCREEN.WIDTH; x += 70) {
                const offsetX = (y % 100 === 0) ? 35 : 0;
                bg.drawRect(x + offsetX + Math.random() * 10, y + Math.random() * 10, 30, 30);
            }
        }
        bg.endFill();

        // Asphalt cracks (thin dark lines)
        bg.lineStyle(2, 0x1a1a1a, 0.5);
        for (let i = 0; i < 15; i++) {
            const startX = Math.random() * CONFIG.SCREEN.WIDTH;
            const startY = Math.random() * CONFIG.SCREEN.HEIGHT;
            const length = 40 + Math.random() * 60;
            const angle = Math.random() * Math.PI * 2;
            const endX = startX + Math.cos(angle) * length;
            const endY = startY + Math.sin(angle) * length;
            bg.moveTo(startX, startY);
            bg.lineTo(endX, endY);
        }

        // Horizontal path marking (lighter gray)
        bg.beginFill(CONFIG.COLORS.PATH);
        bg.drawRect(0, CONFIG.SCREEN.HEIGHT / 2 - 50, CONFIG.SCREEN.WIDTH, 100);
        bg.endFill();

        // Path texture (small stones/aggregate)
        bg.beginFill(0x5a5a5a, 0.4);
        for (let x = 0; x < CONFIG.SCREEN.WIDTH; x += 25) {
            const y = CONFIG.SCREEN.HEIGHT / 2 - 40 + Math.random() * 80;
            bg.drawRect(x + Math.random() * 15, y, 6, 6);
        }
        bg.endFill();

        // Goal line (yellow dashed line on left - like playground markings)
        bg.beginFill(0xffff00, 0.9);
        for (let y = 0; y < CONFIG.SCREEN.HEIGHT; y += 40) {
            bg.drawRect(CONFIG.TEACHER.SPAWN_X - 30, y, 5, 20);
        }
        bg.endFill();

        // Finish line (yellow dashed line near school)
        bg.beginFill(0xffff00, 0.9);
        for (let y = 0; y < CONFIG.SCREEN.HEIGHT; y += 40) {
            bg.drawRect(CONFIG.TEACHER.GOAL_X, y, 5, 20);
        }
        bg.endFill();

        // Add some white painted lines (like sports court markings)
        bg.lineStyle(3, 0xffffff, 0.6);
        // Horizontal center line
        bg.moveTo(0, CONFIG.SCREEN.HEIGHT / 2);
        bg.lineTo(CONFIG.SCREEN.WIDTH, CONFIG.SCREEN.HEIGHT / 2);
        // Vertical center line
        bg.moveTo(CONFIG.SCREEN.WIDTH / 2, 0);
        bg.lineTo(CONFIG.SCREEN.WIDTH / 2, CONFIG.SCREEN.HEIGHT);

        this.backgroundLayer.addChild(bg);
    }

    /**
     * Draw pixel art school building
     */
    drawSchool() {
        const school = new PIXI.Graphics();
        const x = CONFIG.SCHOOL.X;
        const y = CONFIG.SCHOOL.Y;
        const w = CONFIG.SCHOOL.WIDTH;
        const h = CONFIG.SCHOOL.HEIGHT;

        // Main building (red brick)
        school.beginFill(CONFIG.SCHOOL.COLOR);
        school.drawRect(x, y, w, h);
        school.endFill();

        // Darker brick pattern
        school.beginFill(0x660000);
        for (let py = y + 10; py < y + h; py += 20) {
            for (let px = x + 10; px < x + w; px += 30) {
                school.drawRect(px, py, 25, 8);
            }
        }
        school.endFill();

        // Windows (blue/glass)
        const windowColor = 0x87CEEB;
        school.beginFill(windowColor);
        // Row 1
        school.drawRect(x + 20, y + 40, 30, 40);
        school.drawRect(x + 60, y + 40, 30, 40);
        school.drawRect(x + 100, y + 40, 30, 40);
        // Row 2
        school.drawRect(x + 20, y + 100, 30, 40);
        school.drawRect(x + 60, y + 100, 30, 40);
        school.drawRect(x + 100, y + 100, 30, 40);
        // Row 3
        school.drawRect(x + 20, y + 160, 30, 40);
        school.drawRect(x + 60, y + 160, 30, 40);
        school.drawRect(x + 100, y + 160, 30, 40);
        school.endFill();

        // Door (brown)
        school.beginFill(0x654321);
        school.drawRect(x + 55, y + 220, 40, 70);
        school.endFill();

        // Door handle
        school.beginFill(0xFFD700);
        school.drawRect(x + 85, y + 255, 4, 4);
        school.endFill();

        // Roof (dark gray)
        school.beginFill(0x333333);
        school.drawRect(x - 10, y - 20, w + 20, 25);
        school.endFill();

        // Chimney
        school.beginFill(CONFIG.SCHOOL.COLOR);
        school.drawRect(x + 110, y - 40, 20, 25);
        school.endFill();

        // Add "SCHOOL" text
        const text = new PIXI.Text('SCHOOL', {
            fontFamily: CONFIG.UI.FONT_FAMILY,
            fontSize: 20,
            fill: 0xffffff,
            align: 'center',
            fontWeight: 'bold',
            stroke: 0x000000,
            strokeThickness: 3
        });
        text.anchor.set(0.5);
        text.x = x + w / 2;
        text.y = y + 15;

        this.obstaclesLayer.addChild(school);
        this.obstaclesLayer.addChild(text);
    }

    /**
     * Create timer display for gameplay
     */
    createTimerDisplay() {
        // Create timer text with drop shadow for better visibility
        this.timerText = new PIXI.Text('', {
            fontFamily: CONFIG.UI.FONT_FAMILY,
            fontSize: CONFIG.UI.FONT_SIZE_LARGE,
            fill: 0xffffff,
            align: 'center',
            fontWeight: 'bold',
            stroke: 0x000000,
            strokeThickness: 4,
            dropShadow: true,
            dropShadowColor: 0x000000,
            dropShadowBlur: 6,
            dropShadowDistance: 3
        });
        this.timerText.anchor.set(0.5, 0);
        this.timerText.x = CONFIG.SCREEN.WIDTH / 2;
        this.timerText.y = 20;
        this.uiLayer.addChild(this.timerText);

        // Update timer text immediately
        this.updateTimerDisplay();
    }

    /**
     * Update timer display text with visual effects
     */
    updateTimerDisplay() {
        if (!this.timerText) return;

        const minutes = Math.floor(this.timeRemaining / 60);
        const seconds = Math.floor(this.timeRemaining % 60);
        const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}`;

        this.timerText.text = timeString;

        // Change color based on remaining time with pulse effect
        if (this.timeRemaining <= 10) {
            this.timerText.fill = 0xff0000; // Red when low
            // Pulse effect when time is critical
            const pulse = Math.sin(Date.now() / 200) * 0.3 + 1.0;
            this.timerText.scale.set(pulse);
        } else if (this.timeRemaining <= 30) {
            this.timerText.fill = 0xffaa00; // Orange warning
            this.timerText.scale.set(1.0); // Reset scale
        } else {
            this.timerText.fill = 0xffffff; // White normally
            this.timerText.scale.set(1.0); // Reset scale
        }
    }

    /**
     * Create egg count display for pupil
     */
    createEggCountDisplay() {
        this.eggCountText = new PIXI.Text('', {
            fontFamily: CONFIG.UI.FONT_FAMILY,
            fontSize: CONFIG.UI.FONT_SIZE_MEDIUM,
            fill: 0xffffff,
            align: 'right',
            fontWeight: 'bold',
            stroke: 0x000000,
            strokeThickness: 3,
            dropShadow: true,
            dropShadowColor: 0x000000,
            dropShadowBlur: 4,
            dropShadowDistance: 2
        });
        this.eggCountText.anchor.set(1, 0);
        this.eggCountText.x = CONFIG.SCREEN.WIDTH - 20;
        this.eggCountText.y = 20;
        this.uiLayer.addChild(this.eggCountText);

        // Update immediately
        this.updateEggCountDisplay();
    }

    /**
     * Update egg count display
     */
    updateEggCountDisplay() {
        if (!this.eggCountText || !this.pupil) return;

        const eggCount = this.pupil.getEggCount();
        const maxEggs = this.pupil.maxEggs;
        this.eggCountText.text = `Eggs: ${eggCount}/${maxEggs}`;

        // Change color based on egg count
        if (eggCount === 0) {
            this.eggCountText.fill = 0xff0000; // Red when empty
        } else if (eggCount === 1) {
            this.eggCountText.fill = 0xffaa00; // Orange when low
        } else {
            this.eggCountText.fill = 0xffffff; // White normally
        }
    }

    /**
     * Create sprint meter for teacher
     */
    createSprintMeter() {
        // Create graphics for sprint meter bar
        this.sprintMeterGraphics = new PIXI.Graphics();
        this.uiLayer.addChild(this.sprintMeterGraphics);

        // Create text label with drop shadow
        this.sprintMeterText = new PIXI.Text('SPRINT', {
            fontFamily: CONFIG.UI.FONT_FAMILY,
            fontSize: CONFIG.UI.FONT_SIZE_SMALL,
            fill: 0xffffff,
            align: 'left',
            fontWeight: 'bold',
            stroke: 0x000000,
            strokeThickness: 3,
            dropShadow: true,
            dropShadowColor: 0x000000,
            dropShadowBlur: 4,
            dropShadowDistance: 2
        });
        this.sprintMeterText.anchor.set(0, 0);
        this.sprintMeterText.x = 20;
        this.sprintMeterText.y = 20;
        this.uiLayer.addChild(this.sprintMeterText);

        // Update immediately
        this.updateSprintMeter();
    }

    /**
     * Update sprint meter display
     */
    updateSprintMeter() {
        if (!this.sprintMeterGraphics || !this.teacher) return;

        const status = this.teacher.getSprintStatus();
        const meterX = 20;
        const meterY = 55;
        const meterWidth = 150;
        const meterHeight = 20;

        // Clear previous graphics
        this.sprintMeterGraphics.clear();

        // Draw background
        this.sprintMeterGraphics.beginFill(0x000000, 0.5);
        this.sprintMeterGraphics.drawRect(meterX, meterY, meterWidth, meterHeight);
        this.sprintMeterGraphics.endFill();

        // Draw border
        this.sprintMeterGraphics.lineStyle(2, 0xffffff, 1);
        this.sprintMeterGraphics.drawRect(meterX, meterY, meterWidth, meterHeight);

        // Draw fill based on status
        if (status.sprinting) {
            // Show sprint duration remaining (green, depleting)
            const fillWidth = meterWidth * status.durationPercent;
            this.sprintMeterGraphics.beginFill(0x00ff00, 0.8);
            this.sprintMeterGraphics.drawRect(meterX + 2, meterY + 2, fillWidth - 4, meterHeight - 4);
            this.sprintMeterGraphics.endFill();
        } else if (!status.available) {
            // Show cooldown progress (red, filling up)
            const fillWidth = meterWidth * (1 - status.cooldownPercent);
            this.sprintMeterGraphics.beginFill(0xff0000, 0.8);
            this.sprintMeterGraphics.drawRect(meterX + 2, meterY + 2, fillWidth - 4, meterHeight - 4);
            this.sprintMeterGraphics.endFill();
        } else {
            // Sprint available (full yellow)
            this.sprintMeterGraphics.beginFill(0xffff00, 0.8);
            this.sprintMeterGraphics.drawRect(meterX + 2, meterY + 2, meterWidth - 4, meterHeight - 4);
            this.sprintMeterGraphics.endFill();
        }
    }

    /**
     * Show start screen
     */
    showStartScreen() {
        // Clear UI layer
        this.uiLayer.removeChildren();

        // Title with drop shadow for better visibility
        const title = new PIXI.Text('RECESS REVENGE', {
            fontFamily: CONFIG.UI.FONT_FAMILY,
            fontSize: CONFIG.UI.FONT_SIZE_LARGE + 20, // Larger title
            fill: 0xffff00, // Yellow for emphasis
            align: 'center',
            fontWeight: 'bold',
            stroke: 0x000000,
            strokeThickness: 6,
            dropShadow: true,
            dropShadowColor: 0x000000,
            dropShadowBlur: 8,
            dropShadowDistance: 4
        });
        title.anchor.set(0.5);
        title.x = CONFIG.SCREEN.WIDTH / 2;
        title.y = 120;
        this.uiLayer.addChild(title);

        // Instructions with better readability
        const instructions = new PIXI.Text(
            'Player 1 (Teacher): WASD/Arrows + SHIFT to sprint\n' +
            'Player 2 (Pupil): Mouse to aim, Click to throw eggs\n' +
            'Click the red chicken coop to refill eggs!\n\n' +
            'Teacher: Reach the school building!\n' +
            'Pupil: Stop the teacher before time runs out!\n\n' +
            'Press SPACE to start',
            {
                fontFamily: CONFIG.UI.FONT_FAMILY,
                fontSize: CONFIG.UI.FONT_SIZE_SMALL,
                fill: 0xffffff,
                align: 'center',
                lineHeight: 30,
                stroke: 0x000000,
                strokeThickness: 3,
                dropShadow: true,
                dropShadowColor: 0x000000,
                dropShadowBlur: 4,
                dropShadowDistance: 2
            }
        );
        instructions.anchor.set(0.5);
        instructions.x = CONFIG.SCREEN.WIDTH / 2;
        instructions.y = CONFIG.SCREEN.HEIGHT / 2;
        this.uiLayer.addChild(instructions);
    }

    /**
     * Start the game
     */
    startGame() {
        Utils.log('Game starting...');

        // Initialize audio (requires user interaction)
        this.audio.init();

        this.state = GAME_STATE.PLAYING;
        this.winner = WINNER.NONE;
        this.timeRemaining = CONFIG.GAME.MATCH_DURATION;

        // Clear previous game objects
        if (this.teacher) this.teacher.destroy();
        if (this.pupil) this.pupil.destroy();

        // Clear UI layer for new game
        this.uiLayer.removeChildren();

        // Initialize game objects
        this.teacher = new Teacher(this.gameLayer, this.audio);
        this.pupil = new Pupil(this.gameLayer, this.input, this.audio);
        this.projectiles = []; // Array to track active eggs
        this.splats = []; // Array to track egg splats
        this.screenShake = null;
        this.collisionManager = new CollisionManager();
        this.obstacles = createObstacles(this.obstaclesLayer);

        // Create UI displays
        this.createTimerDisplay();
        this.createEggCountDisplay();
        this.createSprintMeter();

        Utils.log('Game started! Use WASD to move teacher, Mouse to aim and click to throw eggs!');
    }

    /**
     * Main game loop
     */
    gameLoop(ticker) {
        // PixiJS v8: ticker is a Ticker object, use deltaMS property
        // deltaMS is in milliseconds, convert to seconds
        const deltaTime = ticker.deltaMS / 1000;

        // Handle input based on game state
        switch (this.state) {
            case GAME_STATE.MENU:
                this.updateMenu(deltaTime);
                break;
            case GAME_STATE.PLAYING:
                this.updateGame(deltaTime);
                break;
            case GAME_STATE.PAUSED:
                this.updatePause(deltaTime);
                break;
            case GAME_STATE.GAME_OVER:
                this.updateGameOver(deltaTime);
                break;
        }

        // Reset frame-specific input state
        this.input.resetFrameState();
    }

    /**
     * Update menu state
     */
    updateMenu(deltaTime) {
        if (this.input.isRestartPressed()) {
            this.startGame();
        }
    }

    /**
     * Update game state
     */
    updateGame(deltaTime) {
        // Update timer
        this.timeRemaining -= deltaTime;

        // Update UI displays
        this.updateTimerDisplay();
        this.updateEggCountDisplay();
        this.updateSprintMeter();

        // Check for time up
        if (this.timeRemaining <= 0) {
            this.timeRemaining = 0;
            this.endGame(WINNER.PUPIL);
            return;
        }

        // Update game objects
        if (this.teacher) {
            this.teacher.update(deltaTime, this.input, this.obstacles);

            // Check if teacher reached the goal
            if (this.teacher.hasReachedGoal()) {
                this.endGame(WINNER.TEACHER);
                return;
            }
        }

        // Update pupil and handle egg throwing
        if (this.pupil) {
            const newProjectile = this.pupil.update(deltaTime, this.teacher, this.obstacles);

            // Add new projectile to list if one was created
            if (newProjectile) {
                this.projectiles.push(newProjectile);
            }
        }

        // Update all projectiles
        this.updateProjectiles(deltaTime);

        // Update visual effects
        this.updateEffects(deltaTime);

        // Check collisions between eggs and teacher
        this.checkCollisions();

        // Check pause
        if (this.input.isPausePressed()) {
            this.pauseGame();
        }
    }

    /**
     * Update all active projectiles
     */
    updateProjectiles(deltaTime) {
        // Update each projectile
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const projectile = this.projectiles[i];
            projectile.update(deltaTime);

            // Check if projectile just landed (create splat)
            if (!projectile.isProjectileActive() && projectile.hasLanded) {
                const pos = projectile.getPosition();
                this.createSplat(pos.x, pos.y);
            }

            // Remove inactive projectiles (landed or destroyed)
            if (!projectile.isProjectileActive()) {
                projectile.destroy();
                this.projectiles.splice(i, 1);
            }
        }
    }

    /**
     * Update visual effects
     */
    updateEffects(deltaTime) {
        // Update screen shake
        if (this.screenShake) {
            const stillActive = this.screenShake.update(deltaTime);
            if (!stillActive) {
                this.screenShake = null;
            }
        }

        // Update splats
        for (let i = this.splats.length - 1; i >= 0; i--) {
            const splat = this.splats[i];
            const stillActive = splat.update(deltaTime);

            // Remove old splats
            if (!stillActive) {
                splat.destroy();
                this.splats.splice(i, 1);
            }
        }
    }

    /**
     * Create a splat effect at position
     */
    createSplat(x, y) {
        const splat = new Splat(x, y, this.gameLayer);
        this.splats.push(splat);
    }

    /**
     * Create screen shake effect
     */
    createScreenShake(intensity = 10, duration = 0.3) {
        // Stop any existing shake
        if (this.screenShake) {
            this.screenShake.stop();
        }

        // Create new shake affecting the entire stage
        this.screenShake = new ScreenShake(this.app.stage, intensity, duration);
    }

    /**
     * Check collisions between game objects
     */
    checkCollisions() {
        if (!this.teacher || !this.collisionManager) return;

        // Check all projectiles against teacher
        const hits = this.collisionManager.checkAllProjectileCollisions(
            this.projectiles,
            this.teacher
        );

        // Handle each hit
        for (const egg of hits) {
            this.handleEggHit(egg);
        }
    }

    /**
     * Handle when an egg hits the teacher
     */
    handleEggHit(egg) {
        Utils.log('Teacher hit by egg!');

        // Get hit position
        const hitPos = egg.getPosition();

        // Play hit sounds
        this.audio.playSound('eggHit');
        this.audio.playSound('eggSplat');

        // Create visual effects
        this.createSplat(hitPos.x, hitPos.y);
        this.createScreenShake(15, 0.4); // Stronger shake for teacher hit

        // Create impact particles
        const particles = new ImpactParticles(hitPos.x, hitPos.y, this.effectsLayer, CONFIG.COLORS.EGG_SPLAT);
        this.splats.push(particles); // Reuse splats array for particles

        // Respawn teacher at starting position
        this.teacher.respawn();

        // Remove the egg
        const index = this.projectiles.indexOf(egg);
        if (index > -1) {
            egg.destroy();
            this.projectiles.splice(index, 1);
        }
    }

    /**
     * Update pause state
     */
    updatePause(deltaTime) {
        if (this.input.isPausePressed()) {
            this.resumeGame();
        }
    }

    /**
     * Update game over state
     */
    updateGameOver(deltaTime) {
        if (this.input.isRestartPressed()) {
            this.showStartScreen();
            this.state = GAME_STATE.MENU;
        }
    }

    /**
     * Pause the game
     */
    pauseGame() {
        this.state = GAME_STATE.PAUSED;

        const pauseText = new PIXI.Text('PAUSED\nPress ESC to resume', {
            fontFamily: CONFIG.UI.FONT_FAMILY,
            fontSize: CONFIG.UI.FONT_SIZE_LARGE,
            fill: 0xffff00, // Yellow for visibility
            align: 'center',
            fontWeight: 'bold',
            stroke: 0x000000,
            strokeThickness: 6,
            dropShadow: true,
            dropShadowColor: 0x000000,
            dropShadowBlur: 8,
            dropShadowDistance: 4
        });
        pauseText.anchor.set(0.5);
        pauseText.x = CONFIG.SCREEN.WIDTH / 2;
        pauseText.y = CONFIG.SCREEN.HEIGHT / 2;
        pauseText.name = 'pauseText';
        this.uiLayer.addChild(pauseText);
    }

    /**
     * Resume the game
     */
    resumeGame() {
        this.state = GAME_STATE.PLAYING;

        // Remove pause text
        const pauseText = this.uiLayer.getChildByName('pauseText');
        if (pauseText) {
            this.uiLayer.removeChild(pauseText);
        }
    }

    /**
     * End the game
     */
    endGame(winner) {
        this.state = GAME_STATE.GAME_OVER;
        this.winner = winner;

        // Play win sound
        if (winner === WINNER.TEACHER) {
            this.audio.playSound('teacherWin');
        } else {
            this.audio.playSound('pupilWin');
        }

        // Clear UI (including all UI elements)
        this.uiLayer.removeChildren();
        this.timerText = null;
        this.eggCountText = null;
        this.sprintMeterGraphics = null;
        this.sprintMeterText = null;

        // Show winner with color-coded styling
        const winnerText = winner === WINNER.TEACHER
            ? 'TEACHER WINS!\nReached the school!'
            : 'PUPIL WINS!\nTime ran out!';

        const winnerColor = winner === WINNER.TEACHER ? 0x3498db : 0xffd700; // Blue for teacher, gold for pupil

        const text = new PIXI.Text(winnerText + '\n\nPress SPACE to play again', {
            fontFamily: CONFIG.UI.FONT_FAMILY,
            fontSize: CONFIG.UI.FONT_SIZE_LARGE,
            fill: winnerColor,
            align: 'center',
            fontWeight: 'bold',
            stroke: 0x000000,
            strokeThickness: 6,
            dropShadow: true,
            dropShadowColor: 0x000000,
            dropShadowBlur: 10,
            dropShadowDistance: 5
        });
        text.anchor.set(0.5);
        text.x = CONFIG.SCREEN.WIDTH / 2;
        text.y = CONFIG.SCREEN.HEIGHT / 2;
        this.uiLayer.addChild(text);
    }
}

// Start the game when page loads
window.addEventListener('load', async () => {
    const game = new Game();
    await game.init(); // Initialize PixiJS asynchronously
    window.game = game; // Make accessible from console for debugging
});
