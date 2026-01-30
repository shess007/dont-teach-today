// RECESS REVENGE - Audio Manager
// Uses Web Audio API for procedurally generated sounds

class AudioManager {
    constructor() {
        // Create audio context (Web Audio API)
        this.audioContext = null;
        this.masterVolume = 0.3; // Lower volume for comfort
        this.enabled = true;

        // Initialize on user interaction (required by browsers)
        this.initialized = false;
    }

    /**
     * Initialize audio context (must be called after user interaction)
     */
    init() {
        if (this.initialized) return;

        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.initialized = true;
            console.log('Audio system initialized');
        } catch (e) {
            console.warn('Web Audio API not supported', e);
            this.enabled = false;
        }
    }

    /**
     * Play a sound effect
     */
    playSound(soundName) {
        if (!this.enabled || !this.initialized) return;

        switch (soundName) {
            case 'eggThrow':
                this.playEggThrow();
                break;
            case 'eggHit':
                this.playEggHit();
                break;
            case 'eggSplat':
                this.playEggSplat();
                break;
            case 'sprint':
                this.playSprint();
                break;
            case 'refill':
                this.playRefill();
                break;
            case 'teacherWin':
                this.playTeacherWin();
                break;
            case 'pupilWin':
                this.playPupilWin();
                break;
            default:
                console.warn('Unknown sound:', soundName);
        }
    }

    /**
     * Create oscillator for tone generation
     */
    createOscillator(frequency, type = 'sine') {
        const oscillator = this.audioContext.createOscillator();
        oscillator.type = type;
        oscillator.frequency.value = frequency;
        return oscillator;
    }

    /**
     * Create gain node for volume control
     */
    createGain(volume = 1.0) {
        const gainNode = this.audioContext.createGain();
        gainNode.gain.value = volume * this.masterVolume;
        return gainNode;
    }

    /**
     * Egg throw sound (whoosh)
     */
    playEggThrow() {
        const now = this.audioContext.currentTime;
        const duration = 0.2;

        // Descending pitch for whoosh effect
        const osc = this.createOscillator(400, 'sawtooth');
        const gain = this.createGain(0.15);

        osc.frequency.exponentialRampToValueAtTime(200, now + duration);
        gain.gain.exponentialRampToValueAtTime(0.01, now + duration);

        osc.connect(gain);
        gain.connect(this.audioContext.destination);

        osc.start(now);
        osc.stop(now + duration);
    }

    /**
     * Egg hit sound (impact)
     */
    playEggHit() {
        const now = this.audioContext.currentTime;
        const duration = 0.15;

        // Low thud sound
        const osc = this.createOscillator(80, 'sine');
        const gain = this.createGain(0.3);

        gain.gain.exponentialRampToValueAtTime(0.01, now + duration);

        osc.connect(gain);
        gain.connect(this.audioContext.destination);

        osc.start(now);
        osc.stop(now + duration);
    }

    /**
     * Egg splat sound (wet impact)
     */
    playEggSplat() {
        const now = this.audioContext.currentTime;
        const duration = 0.25;

        // Noise burst for splat effect
        const bufferSize = this.audioContext.sampleRate * duration;
        const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const data = buffer.getChannelData(0);

        // Generate pink noise
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
        }

        const source = this.audioContext.createBufferSource();
        source.buffer = buffer;

        const filter = this.audioContext.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 800;

        const gain = this.createGain(0.2);
        gain.gain.exponentialRampToValueAtTime(0.01, now + duration);

        source.connect(filter);
        filter.connect(gain);
        gain.connect(this.audioContext.destination);

        source.start(now);
    }

    /**
     * Sprint activation sound (power up)
     */
    playSprint() {
        const now = this.audioContext.currentTime;
        const duration = 0.3;

        // Rising pitch for activation
        const osc = this.createOscillator(200, 'square');
        const gain = this.createGain(0.1);

        osc.frequency.exponentialRampToValueAtTime(600, now + duration);
        gain.gain.exponentialRampToValueAtTime(0.01, now + duration);

        osc.connect(gain);
        gain.connect(this.audioContext.destination);

        osc.start(now);
        osc.stop(now + duration);
    }

    /**
     * Egg refill sound (pickup)
     */
    playRefill() {
        const now = this.audioContext.currentTime;

        // Pleasant ascending arpeggio
        const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
        notes.forEach((freq, index) => {
            const startTime = now + index * 0.08;
            const osc = this.createOscillator(freq, 'sine');
            const gain = this.createGain(0.15);

            gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.15);

            osc.connect(gain);
            gain.connect(this.audioContext.destination);

            osc.start(startTime);
            osc.stop(startTime + 0.15);
        });
    }

    /**
     * Teacher win sound (victory)
     */
    playTeacherWin() {
        const now = this.audioContext.currentTime;

        // Triumphant ascending melody
        const melody = [
            { freq: 523.25, time: 0 },     // C5
            { freq: 659.25, time: 0.15 },  // E5
            { freq: 783.99, time: 0.3 },   // G5
            { freq: 1046.50, time: 0.45 }  // C6
        ];

        melody.forEach(note => {
            const startTime = now + note.time;
            const osc = this.createOscillator(note.freq, 'sine');
            const gain = this.createGain(0.2);

            gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.4);

            osc.connect(gain);
            gain.connect(this.audioContext.destination);

            osc.start(startTime);
            osc.stop(startTime + 0.4);
        });
    }

    /**
     * Pupil win sound (playful victory)
     */
    playPupilWin() {
        const now = this.audioContext.currentTime;

        // Playful descending melody
        const melody = [
            { freq: 783.99, time: 0 },     // G5
            { freq: 659.25, time: 0.12 },  // E5
            { freq: 523.25, time: 0.24 },  // C5
            { freq: 659.25, time: 0.36 },  // E5
            { freq: 523.25, time: 0.48 }   // C5
        ];

        melody.forEach(note => {
            const startTime = now + note.time;
            const osc = this.createOscillator(note.freq, 'triangle');
            const gain = this.createGain(0.2);

            gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.3);

            osc.connect(gain);
            gain.connect(this.audioContext.destination);

            osc.start(startTime);
            osc.stop(startTime + 0.3);
        });
    }

    /**
     * Toggle audio on/off
     */
    toggleAudio() {
        this.enabled = !this.enabled;
        console.log('Audio', this.enabled ? 'enabled' : 'disabled');
        return this.enabled;
    }

    /**
     * Set master volume (0.0 to 1.0)
     */
    setVolume(volume) {
        this.masterVolume = Math.max(0, Math.min(1, volume));
    }
}
