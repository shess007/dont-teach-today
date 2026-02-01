// RECESS REVENGE - Client Input Manager

import { CONFIG } from '../shared/config.js';

export class InputManager {
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
        window.addEventListener('keydown', (e) => {
            this.keys.add(e.key);
            if (this.isGameKey(e.key)) e.preventDefault();
        });

        window.addEventListener('keyup', (e) => {
            this.keys.delete(e.key);
        });

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

        this.canvas.addEventListener('mouseup', () => {
            this.mouseDown = false;
        });

        this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());

        window.addEventListener('blur', () => {
            this.keys.clear();
            this.mouseDown = false;
        });
    }

    isGameKey(key) {
        const gameKeys = [
            ...CONFIG.KEYS.UP, ...CONFIG.KEYS.DOWN,
            ...CONFIG.KEYS.LEFT, ...CONFIG.KEYS.RIGHT,
            ...CONFIG.KEYS.SPRINT, ...CONFIG.KEYS.PAUSE,
            ...CONFIG.KEYS.RESTART
        ];
        return gameKeys.includes(key);
    }

    isKeyDown(keyName) {
        const keys = CONFIG.KEYS[keyName];
        if (!keys) return false;
        return keys.some(key => this.keys.has(key));
    }

    // Serialize teacher inputs for network
    getTeacherInput() {
        return {
            up: this.isKeyDown('UP'),
            down: this.isKeyDown('DOWN'),
            left: this.isKeyDown('LEFT'),
            right: this.isKeyDown('RIGHT'),
            sprint: this.isKeyDown('SPRINT'),
        };
    }

    // Serialize pupil inputs for network
    getPupilInput() {
        const clicked = this.mouseClicked;
        this.mouseClicked = false; // consume click
        return {
            mouseX: this.mouseX,
            mouseY: this.mouseY,
            click: clicked,
        };
    }

    isRestartPressed() {
        return this.isKeyDown('RESTART');
    }

    resetFrameState() {
        // mouseClicked is consumed in getPupilInput
    }
}
