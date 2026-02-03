// AI Sports Commentator - Commentary Manager
// Displays contextual text commentary during gameplay

import { COMMENTARY_DATA, PRIORITY_CONFIG } from './commentary-data.js';
import { CONFIG } from '../shared/config.js';

const PIXI = window.PIXI;

// Individual commentary line with animation state
class CommentaryLine {
    constructor(sprite, duration, fadeIn, fadeOut) {
        this.sprite = sprite;
        this.state = 'fadeIn';
        this.timer = 0;
        this.fadeInDuration = fadeIn;
        this.displayDuration = duration;
        this.fadeOutDuration = fadeOut;
        this.targetY = sprite.y;
        this.startY = sprite.y + 20; // Slide up effect
        this.sprite.y = this.startY;
    }

    update(deltaTime) {
        this.timer += deltaTime * 1000; // Convert to ms

        switch (this.state) {
            case 'fadeIn': {
                const progress = Math.min(1, this.timer / this.fadeInDuration);
                // Ease out quad
                const eased = 1 - (1 - progress) * (1 - progress);
                this.sprite.alpha = eased;
                this.sprite.y = this.startY + (this.targetY - this.startY) * eased;
                if (progress >= 1) {
                    this.state = 'display';
                    this.timer = 0;
                }
                break;
            }
            case 'display':
                if (this.timer >= this.displayDuration) {
                    this.state = 'fadeOut';
                    this.timer = 0;
                }
                break;
            case 'fadeOut': {
                const progress = Math.min(1, this.timer / this.fadeOutDuration);
                this.sprite.alpha = 1 - progress;
                if (progress >= 1) {
                    this.state = 'finished';
                }
                break;
            }
        }

        return this.state !== 'finished';
    }
}

export class CommentaryManager {
    constructor(uiLayer) {
        this.uiLayer = uiLayer;
        this.activeLines = [];
        this.eventCooldowns = new Map(); // eventType -> last trigger time
        this.recentTexts = []; // Last 5 texts shown (avoid repetition)
        this.enabled = true;
        this.globalLastTrigger = 0;
        this.globalMinInterval = 500; // 500ms between any commentary

        // TTS support
        this.ttsEnabled = true;
        this.currentAudio = null;
        this.networkManager = null;

        // Configuration
        this.config = {
            maxVisibleLines: 2,
            displayDuration: 3000,
            fadeIn: 300,
            fadeOut: 500,
            positionY: 80,
            lineSpacing: 45,
        };
    }

    setNetwork(networkManager) {
        this.networkManager = networkManager;
    }

    requestTTS(text) {
        if (!this.ttsEnabled || !this.networkManager) return;
        this.networkManager.sendTTSRequest(text);
    }

    playTTSAudio(base64Audio) {
        // Stop any currently playing audio
        if (this.currentAudio) {
            this.currentAudio.pause();
            this.currentAudio = null;
        }

        // Create and play new audio
        try {
            const binaryString = atob(base64Audio);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }
            const audioBlob = new Blob([bytes], { type: 'audio/mpeg' });
            const audioUrl = URL.createObjectURL(audioBlob);
            this.currentAudio = new Audio(audioUrl);
            this.currentAudio.volume = 0.8;
            this.currentAudio.play().catch(() => {});

            // Cleanup URL after playback
            this.currentAudio.onended = () => {
                URL.revokeObjectURL(audioUrl);
                this.currentAudio = null;
            };
        } catch (err) {
            console.error('TTS audio playback error:', err);
        }
    }

    toggle() {
        this.enabled = !this.enabled;
        this.ttsEnabled = this.enabled; // Sync TTS with text toggle
        if (!this.enabled) {
            // Clear all active commentary when disabled
            for (const line of this.activeLines) {
                this.uiLayer.removeChild(line.sprite);
                line.sprite.destroy();
            }
            this.activeLines = [];
            // Stop any playing audio
            if (this.currentAudio) {
                this.currentAudio.pause();
                this.currentAudio = null;
            }
        }
    }

    trigger(eventType, context = {}) {
        if (!this.enabled) return;

        const eventData = COMMENTARY_DATA[eventType];
        if (!eventData) {
            console.warn(`Unknown commentary event: ${eventType}`);
            return;
        }

        // Check cooldowns
        if (!this.canTrigger(eventType, eventData)) {
            return;
        }

        // Select appropriate line
        const text = this.selectLine(eventType, eventData, context);
        if (!text) return;

        // Display the commentary
        this.displayCommentary(text, eventData.priority);

        // Request TTS audio
        this.requestTTS(text);

        // Record trigger
        this.recordTrigger(eventType, text);
    }

    canTrigger(eventType, eventData) {
        const now = Date.now();

        // Global rate limit (except for HIGH priority with cooldown 0)
        if (eventData.priority !== 'HIGH' || eventData.cooldown > 0) {
            if (now - this.globalLastTrigger < this.globalMinInterval) {
                return false;
            }
        }

        // Per-event cooldown
        const lastTrigger = this.eventCooldowns.get(eventType) || 0;
        const cooldown = eventData.cooldown;
        if (now - lastTrigger < cooldown) {
            return false;
        }

        return true;
    }

    selectLine(eventType, eventData, context) {
        let pool = [...eventData.lines];

        // Add contextual variants if applicable
        if (context.nearGoal && eventData.nearGoal) {
            pool = [...pool, ...eventData.nearGoal];
        }

        // Filter out recently used lines
        const available = pool.filter(text => !this.recentTexts.includes(text));

        // If all lines were used recently, use full pool
        const finalPool = available.length > 0 ? available : pool;

        // Random selection
        return finalPool[Math.floor(Math.random() * finalPool.length)];
    }

    displayCommentary(text, priority) {
        const priorityConfig = PRIORITY_CONFIG[priority] || PRIORITY_CONFIG.MEDIUM;

        // Create text sprite
        const textSprite = new PIXI.Text({
            text: text,
            style: {
                fontFamily: CONFIG.UI.FONT_FAMILY,
                fontSize: priorityConfig.fontSize,
                fill: priorityConfig.color,
                align: 'center',
                fontWeight: 'bold',
                stroke: { color: 0x000000, width: 4 },
                dropShadow: {
                    color: 0x000000,
                    blur: 6,
                    distance: 3,
                    angle: Math.PI / 4,
                },
            }
        });

        textSprite.anchor.set(0.5, 0.5);
        textSprite.x = CONFIG.SCREEN.WIDTH / 2;
        textSprite.alpha = 0;

        // Calculate Y position - push existing lines up
        const baseY = this.config.positionY;
        textSprite.y = baseY + this.activeLines.length * this.config.lineSpacing;

        // If we have max lines, remove oldest
        if (this.activeLines.length >= this.config.maxVisibleLines) {
            const oldest = this.activeLines.shift();
            this.uiLayer.removeChild(oldest.sprite);
            oldest.sprite.destroy();
        }

        // Add to UI layer
        this.uiLayer.addChild(textSprite);

        // Create line object with animation
        const line = new CommentaryLine(
            textSprite,
            this.config.displayDuration,
            this.config.fadeIn,
            this.config.fadeOut
        );

        this.activeLines.push(line);

        // Shift existing lines up
        this.repositionLines();
    }

    repositionLines() {
        const baseY = this.config.positionY;
        for (let i = 0; i < this.activeLines.length; i++) {
            const line = this.activeLines[i];
            const targetY = baseY + i * this.config.lineSpacing;
            // Only update target if in display/fadeIn state
            if (line.state === 'display' || line.state === 'fadeIn') {
                line.targetY = targetY;
            }
        }
    }

    recordTrigger(eventType, text) {
        const now = Date.now();
        this.eventCooldowns.set(eventType, now);
        this.globalLastTrigger = now;

        // Track recent texts
        this.recentTexts.push(text);
        if (this.recentTexts.length > 5) {
            this.recentTexts.shift();
        }
    }

    update(deltaTime) {
        if (!this.enabled) return;

        // Update all active lines
        for (let i = this.activeLines.length - 1; i >= 0; i--) {
            const line = this.activeLines[i];
            const alive = line.update(deltaTime);

            if (!alive) {
                this.uiLayer.removeChild(line.sprite);
                line.sprite.destroy();
                this.activeLines.splice(i, 1);
            }
        }

        // Reposition remaining lines
        if (this.activeLines.length > 0) {
            this.repositionLines();
        }
    }

    cleanup() {
        for (const line of this.activeLines) {
            this.uiLayer.removeChild(line.sprite);
            line.sprite.destroy();
        }
        this.activeLines = [];
        this.eventCooldowns.clear();
        this.recentTexts = [];
    }
}
