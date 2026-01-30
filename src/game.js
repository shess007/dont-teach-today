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
        this.effects = [];
        this.ui = null;
        this.input = null;

        // Game timer
        this.timeRemaining = CONFIG.GAME.MATCH_DURATION;
        this.lastTime = 0;

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
     * Draw simple background
     */
    drawBackground() {
        const bg = new PIXI.Graphics();

        // Grass field
        bg.beginFill(CONFIG.COLORS.GRASS);
        bg.drawRect(0, 0, CONFIG.SCREEN.WIDTH, CONFIG.SCREEN.HEIGHT);
        bg.endFill();

        // Optional: Add some path texture
        bg.beginFill(CONFIG.COLORS.PATH, 0.3);
        bg.drawRect(0, CONFIG.SCREEN.HEIGHT / 2 - 50, CONFIG.SCREEN.WIDTH, 100);
        bg.endFill();

        this.backgroundLayer.addChild(bg);
    }

    /**
     * Draw school building
     */
    drawSchool() {
        const school = new PIXI.Graphics();
        school.beginFill(CONFIG.SCHOOL.COLOR);
        school.drawRect(
            CONFIG.SCHOOL.X,
            CONFIG.SCHOOL.Y,
            CONFIG.SCHOOL.WIDTH,
            CONFIG.SCHOOL.HEIGHT
        );
        school.endFill();

        // Add "SCHOOL" text
        const text = new PIXI.Text('SCHOOL', {
            fontFamily: CONFIG.UI.FONT_FAMILY,
            fontSize: 24,
            fill: 0xffffff,
            align: 'center'
        });
        text.anchor.set(0.5);
        text.x = CONFIG.SCHOOL.X + CONFIG.SCHOOL.WIDTH / 2;
        text.y = CONFIG.SCHOOL.Y + CONFIG.SCHOOL.HEIGHT / 2;

        this.obstaclesLayer.addChild(school);
        this.obstaclesLayer.addChild(text);
    }

    /**
     * Show start screen
     */
    showStartScreen() {
        // Clear UI layer
        this.uiLayer.removeChildren();

        // Title
        const title = new PIXI.Text('RECESS REVENGE', {
            fontFamily: CONFIG.UI.FONT_FAMILY,
            fontSize: CONFIG.UI.FONT_SIZE_LARGE,
            fill: 0xffffff,
            align: 'center',
            fontWeight: 'bold'
        });
        title.anchor.set(0.5);
        title.x = CONFIG.SCREEN.WIDTH / 2;
        title.y = 150;
        this.uiLayer.addChild(title);

        // Instructions
        const instructions = new PIXI.Text(
            'Player 1 (Teacher): WASD/Arrows + SHIFT to sprint\n' +
            'Player 2 (Pupil): Mouse to aim, Click to throw eggs\n\n' +
            'Teacher: Reach the school building!\n' +
            'Pupil: Stop the teacher before time runs out!\n\n' +
            'Press SPACE to start',
            {
                fontFamily: CONFIG.UI.FONT_FAMILY,
                fontSize: CONFIG.UI.FONT_SIZE_SMALL,
                fill: 0xffffff,
                align: 'center',
                lineHeight: 30
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
        console.log('Game starting...');

        this.state = GAME_STATE.PLAYING;
        this.winner = WINNER.NONE;
        this.timeRemaining = CONFIG.GAME.MATCH_DURATION;

        // Clear previous game objects
        if (this.teacher) this.teacher.destroy();
        if (this.pupil) this.pupil.destroy();

        // Clear UI layer for new game
        this.uiLayer.removeChildren();

        // Initialize game objects
        this.teacher = new Teacher(this.gameLayer);
        this.pupil = new Pupil(this.gameLayer, this.input);
        this.projectiles = []; // Array to track active eggs
        this.collisionManager = new CollisionManager();
        // this.obstacles = createObstacles(this.obstaclesLayer); // Phase 7

        console.log('Game started! Use WASD to move teacher, Mouse to aim and click to throw eggs!');
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

        // Check for time up
        if (this.timeRemaining <= 0) {
            this.timeRemaining = 0;
            this.endGame(WINNER.PUPIL);
            return;
        }

        // Update game objects
        if (this.teacher) {
            this.teacher.update(deltaTime, this.input);

            // Check if teacher reached the goal
            if (this.teacher.hasReachedGoal()) {
                this.endGame(WINNER.TEACHER);
                return;
            }
        }

        // Update pupil and handle egg throwing
        if (this.pupil) {
            const newProjectile = this.pupil.update(deltaTime, this.teacher);

            // Add new projectile to list if one was created
            if (newProjectile) {
                this.projectiles.push(newProjectile);
            }
        }

        // Update all projectiles
        this.updateProjectiles(deltaTime);

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

            // Remove inactive projectiles (landed or destroyed)
            if (!projectile.isProjectileActive()) {
                projectile.destroy();
                this.projectiles.splice(i, 1);
            }
        }
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
        console.log('Teacher hit by egg!');

        // Respawn teacher at starting position
        this.teacher.respawn();

        // Remove the egg
        const index = this.projectiles.indexOf(egg);
        if (index > -1) {
            egg.destroy();
            this.projectiles.splice(index, 1);
        }

        // TODO Phase 12: Add screen shake and splat effect
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
            fill: 0xffffff,
            align: 'center'
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

        // Clear UI
        this.uiLayer.removeChildren();

        // Show winner
        const winnerText = winner === WINNER.TEACHER
            ? 'TEACHER WINS!\nReached the school!'
            : 'PUPIL WINS!\nTime ran out!';

        const text = new PIXI.Text(winnerText + '\n\nPress SPACE to play again', {
            fontFamily: CONFIG.UI.FONT_FAMILY,
            fontSize: CONFIG.UI.FONT_SIZE_LARGE,
            fill: 0xffffff,
            align: 'center'
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
