// RECESS REVENGE - Client Entry Point

import { GAME_STATE, WINNER, roleTeam } from '../shared/config.js';
import { NetworkManager } from './network.js';
import { GameRenderer } from './renderer.js';
import { InputManager } from './input.js';
import { StateInterpolator } from './interpolation.js';

class GameClient {
    constructor() {
        this.network = null;
        this.renderer = null;
        this.input = null;
        this.interpolator = new StateInterpolator();

        this.playerId = null;
        this.role = null;
        this.gameState = GAME_STATE.LOBBY;
        this.lastInputSendTime = 0;
        this.inputSendInterval = 1000 / 60; // Send inputs at 60Hz
        this.lastState = null;
        this.lobbyState = null;
        this.prevMusicToggle = false;
        this.teacherCount = 1;
        this.pupilCount = 1;
    }

    async init() {
        this.renderer = new GameRenderer();
        const canvas = await this.renderer.init();

        this.input = new InputManager(canvas);

        // Get room ID from URL
        const urlParams = new URLSearchParams(window.location.search);
        let roomId = urlParams.get('room');
        if (!roomId) {
            roomId = this.generateRoomId();
            const newUrl = `${window.location.pathname}?room=${roomId}`;
            window.history.replaceState({}, '', newUrl);
        }

        this.network = new NetworkManager({
            onRole: (role, playerId) => this.onRole(role, playerId),
            onLobby: (data) => this.onLobby(data),
            onInit: (data) => this.onInit(data),
            onCountdown: (count) => this.onCountdown(count),
            onStart: (data) => this.onGameStart(data),
            onState: (state) => this.onState(state),
            onDisconnected: (data) => this.onDisconnected(data),
        });

        this.network.connect(roomId);

        // Start render loop
        this.renderer.app.ticker.add((ticker) => this.clientLoop(ticker));

        console.log(`RECESS REVENGE - Room: ${roomId}`);
    }

    generateRoomId() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let id = '';
        for (let i = 0; i < 6; i++) {
            id += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return id;
    }

    clientLoop(ticker) {
        const deltaTime = ticker.deltaMS / 1000;
        const now = Date.now();

        // Send inputs if playing
        if (this.gameState === GAME_STATE.PLAYING && this.role && now - this.lastInputSendTime > this.inputSendInterval) {
            this.sendInputs();
            this.lastInputSendTime = now;
        }

        // Handle music toggle (M key, edge-detected)
        const musicKeyDown = this.input.isKeyDown('MUSIC_TOGGLE');
        if (musicKeyDown && !this.prevMusicToggle) {
            this.renderer.audio.toggleMusic();
        }
        this.prevMusicToggle = musicKeyDown;

        // Handle restart — go back to lobby
        if (this.gameState === GAME_STATE.GAME_OVER && this.input.isRestartPressed()) {
            this.network.sendRestart();
        }

        // Get interpolated state and render
        if (this.gameState === GAME_STATE.PLAYING) {
            const state = this.interpolator.getState();
            if (state) {
                this.renderGameState(state, deltaTime);
            }
        }

        // Update effects regardless of state
        this.renderer.updateEffects(deltaTime);
    }

    sendInputs() {
        const team = roleTeam(this.role);
        if (team === 'teacher') {
            this.network.sendInput(this.input.getTeacherInput());
        } else if (team === 'pupil') {
            this.network.sendInput(this.input.getPupilInput());
        }
    }

    renderGameState(state, deltaTime) {
        this.renderer.renderTeachers(state.teachers);
        this.renderer.renderPupils(state.pupils, this.role, state.eggPool);
        this.renderer.renderProjectiles(state.projectiles);
        this.renderer.renderUI(state, this.role);

        // Process events
        if (state.events) {
            for (const event of state.events) {
                this.handleGameEvent(event);
            }
        }
    }

    handleGameEvent(event) {
        switch (event.type) {
            case 'hit':
                this.renderer.audio.playSound('eggHit');
                this.renderer.audio.playSound('eggSplat');
                this.renderer.createSplat(event.x, event.y);
                this.renderer.createScreenShake(15, 0.4);
                this.renderer.createImpactParticles(event.x, event.y);
                break;
            case 'throw':
                this.renderer.audio.playSound('eggThrow');
                break;
            case 'splat':
                this.renderer.createSplat(event.x, event.y);
                break;
            case 'gameover':
                this.gameState = GAME_STATE.GAME_OVER;
                this.renderer.app.canvas.style.cursor = '';
                if (event.winner === WINNER.TEACHER) {
                    this.renderer.audio.playSound('teacherWin');
                } else {
                    this.renderer.audio.playSound('pupilWin');
                }
                this.renderer.showGameOver(event.winner);
                break;
        }
    }

    getLobbyCallbacks() {
        return {
            onSelectRole: (role) => {
                this.network.sendSelectRole(role);
            },
            onStart: () => {
                this.network.sendStart();
            }
        };
    }

    renderLobby() {
        if (!this.lobbyState) return;
        const state = {
            ...this.lobbyState,
            myId: this.playerId,
            myRole: this.role,
        };
        this.renderer.showLobby(state, this.getLobbyCallbacks());
    }

    // --- Network callbacks ---
    onRole(role, playerId) {
        this.playerId = playerId;
        this.role = role;
        // Don't render lobby yet — wait for lobby state broadcast
    }

    onLobby(data) {
        this.lobbyState = data;

        // Derive own role from the 4 slot fields
        const slots = ['teacher1', 'teacher2', 'pupil1', 'pupil2'];
        this.role = 'unassigned';
        for (const slotName of slots) {
            if (data[slotName] && data[slotName].playerId === this.playerId) {
                this.role = slotName;
                break;
            }
        }

        // If we're in lobby or just got reset from game over, re-render lobby
        if (this.gameState === GAME_STATE.LOBBY || this.gameState === GAME_STATE.GAME_OVER) {
            this.gameState = GAME_STATE.LOBBY;
            this.renderer.app.canvas.style.cursor = '';
            this.renderer.cleanupGame();
            this.renderLobby();
        }
    }

    onInit(data) {
        this.renderer.createObstacles(data.obstacles);
    }

    onCountdown(count) {
        this.renderer.showCountdown(count);
    }

    onGameStart(data) {
        this.gameState = GAME_STATE.PLAYING;
        this.teacherCount = data?.teacherCount || 1;
        this.pupilCount = data?.pupilCount || 1;
        this.renderer.audio.init();
        this.renderer.audio.startMusic();
        this.renderer.setupGame(this.role, this.teacherCount, this.pupilCount);
        // Hide cursor for pupil (crosshair replaces it)
        if (roleTeam(this.role) === 'pupil') {
            this.renderer.app.canvas.style.cursor = 'none';
        }
    }

    onState(state) {
        this.lastState = state;
        this.interpolator.addState(state);

        // Check if game over via state
        if (state.gameState === GAME_STATE.GAME_OVER && this.gameState !== GAME_STATE.GAME_OVER) {
            this.gameState = GAME_STATE.GAME_OVER;
            this.renderer.app.canvas.style.cursor = '';
            this.renderer.audio.stopMusic();
            if (state.winner === WINNER.TEACHER) {
                this.renderer.audio.playSound('teacherWin');
            } else {
                this.renderer.audio.playSound('pupilWin');
            }
            this.renderer.showGameOver(state.winner);
        }
    }

    onDisconnected(data) {
        this.gameState = GAME_STATE.LOBBY;
        this.renderer.app.canvas.style.cursor = '';
        this.renderer.audio.stopMusic();
        this.renderer.cleanupGame();
        this.renderer.showDisconnected(data.message);
    }
}

// Start
window.addEventListener('load', async () => {
    const client = new GameClient();
    await client.init();
    window.game = client;
});
