// RECESS REVENGE - Input Manager

class InputManager {
    constructor(canvas) {
        this.keys = new Set();
        this.mouseX = 0;
        this.mouseY = 0;
        this.mouseDown = false;
        this.mouseClicked = false;
        this.canvas = canvas;

        this.setupEventListeners();
    }

    setupEventListeners() {
        // Keyboard events
        window.addEventListener('keydown', (e) => {
            this.keys.add(e.key);
            // Prevent default browser behavior for game keys
            if (this.isGameKey(e.key)) {
                e.preventDefault();
            }
        });

        window.addEventListener('keyup', (e) => {
            this.keys.delete(e.key);
        });

        // Mouse events - use canvas for accurate positioning
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            this.mouseX = e.clientX - rect.left;
            this.mouseY = e.clientY - rect.top;
        });

        this.canvas.addEventListener('mousedown', (e) => {
            this.mouseDown = true;
            this.mouseClicked = true;
            e.preventDefault();
        });

        this.canvas.addEventListener('mouseup', (e) => {
            this.mouseDown = false;
        });

        // Prevent context menu on right click
        this.canvas.addEventListener('contextmenu', (e) => {
            e.preventDefault();
        });

        // Handle window focus loss
        window.addEventListener('blur', () => {
            this.keys.clear();
            this.mouseDown = false;
        });
    }

    /**
     * Check if a key is currently pressed
     */
    isKeyDown(keyName) {
        const keys = CONFIG.KEYS[keyName];
        if (!keys) return false;
        return keys.some(key => this.keys.has(key));
    }

    /**
     * Check if specific key string is pressed
     */
    isKeyPressed(key) {
        return this.keys.has(key);
    }

    /**
     * Get mouse position
     */
    getMousePosition() {
        return { x: this.mouseX, y: this.mouseY };
    }

    /**
     * Check if mouse was clicked this frame (consumes the click)
     */
    wasMouseClicked() {
        const clicked = this.mouseClicked;
        this.mouseClicked = false;
        return clicked;
    }

    /**
     * Check if mouse is currently down
     */
    isMouseDown() {
        return this.mouseDown;
    }

    /**
     * Reset click state (call each frame)
     */
    resetFrameState() {
        this.mouseClicked = false;
    }

    /**
     * Check if a key is a game control key
     */
    isGameKey(key) {
        const gameKeys = [
            ...CONFIG.KEYS.UP,
            ...CONFIG.KEYS.DOWN,
            ...CONFIG.KEYS.LEFT,
            ...CONFIG.KEYS.RIGHT,
            ...CONFIG.KEYS.SPRINT,
            ...CONFIG.KEYS.PAUSE,
            ...CONFIG.KEYS.RESTART
        ];
        return gameKeys.includes(key);
    }

    /**
     * Get movement direction from keyboard input
     */
    getMovementDirection() {
        let x = 0;
        let y = 0;

        if (this.isKeyDown('UP')) y -= 1;
        if (this.isKeyDown('DOWN')) y += 1;
        if (this.isKeyDown('LEFT')) x -= 1;
        if (this.isKeyDown('RIGHT')) x += 1;

        // Normalize diagonal movement
        if (x !== 0 && y !== 0) {
            const length = Math.sqrt(x * x + y * y);
            x /= length;
            y /= length;
        }

        return { x, y };
    }

    /**
     * Check if sprint key is held
     */
    isSprintPressed() {
        return this.isKeyDown('SPRINT');
    }

    /**
     * Check if pause key was pressed
     */
    isPausePressed() {
        return this.isKeyDown('PAUSE');
    }

    /**
     * Check if restart key was pressed
     */
    isRestartPressed() {
        return this.isKeyDown('RESTART');
    }
}
