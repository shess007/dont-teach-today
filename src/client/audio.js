// RECESS REVENGE - Client Audio Manager (same as original)

export class AudioManager {
    constructor() {
        this.audioContext = null;
        this.masterVolume = 0.3;
        this.enabled = true;
        this.initialized = false;
        this.musicElement = null;
        this.musicVolume = 0.3;
        this.musicMuted = false;
    }

    init() {
        if (this.initialized) return;
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.initialized = true;
        } catch (e) {
            console.warn('Web Audio API not supported', e);
            this.enabled = false;
        }
    }

    playSound(soundName) {
        if (!this.enabled || !this.initialized) return;
        switch (soundName) {
            case 'eggThrow': this.playEggThrow(); break;
            case 'eggHit': this.playEggHit(); break;
            case 'eggSplat': this.playEggSplat(); break;
            case 'sprint': this.playSprint(); break;
            case 'refill': this.playRefill(); break;
            case 'teacherWin': this.playTeacherWin(); break;
            case 'pupilWin': this.playPupilWin(); break;
        }
    }

    createOscillator(frequency, type = 'sine') {
        const osc = this.audioContext.createOscillator();
        osc.type = type;
        osc.frequency.value = frequency;
        return osc;
    }

    createGain(volume = 1.0) {
        const gain = this.audioContext.createGain();
        gain.gain.value = volume * this.masterVolume;
        return gain;
    }

    playEggThrow() {
        const now = this.audioContext.currentTime;
        const osc = this.createOscillator(400, 'sawtooth');
        const gain = this.createGain(0.15);
        osc.frequency.exponentialRampToValueAtTime(200, now + 0.2);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        osc.connect(gain); gain.connect(this.audioContext.destination);
        osc.start(now); osc.stop(now + 0.2);
    }

    playEggHit() {
        const now = this.audioContext.currentTime;
        const osc = this.createOscillator(80, 'sine');
        const gain = this.createGain(0.3);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
        osc.connect(gain); gain.connect(this.audioContext.destination);
        osc.start(now); osc.stop(now + 0.15);
    }

    playEggSplat() {
        const now = this.audioContext.currentTime;
        const bufferSize = this.audioContext.sampleRate * 0.25;
        const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
        }
        const source = this.audioContext.createBufferSource();
        source.buffer = buffer;
        const filter = this.audioContext.createBiquadFilter();
        filter.type = 'lowpass'; filter.frequency.value = 800;
        const gain = this.createGain(0.2);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
        source.connect(filter); filter.connect(gain); gain.connect(this.audioContext.destination);
        source.start(now);
    }

    playSprint() {
        const now = this.audioContext.currentTime;
        const osc = this.createOscillator(200, 'square');
        const gain = this.createGain(0.1);
        osc.frequency.exponentialRampToValueAtTime(600, now + 0.3);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        osc.connect(gain); gain.connect(this.audioContext.destination);
        osc.start(now); osc.stop(now + 0.3);
    }

    playRefill() {
        const now = this.audioContext.currentTime;
        [523.25, 659.25, 783.99].forEach((freq, i) => {
            const t = now + i * 0.08;
            const osc = this.createOscillator(freq, 'sine');
            const gain = this.createGain(0.15);
            gain.gain.exponentialRampToValueAtTime(0.01, t + 0.15);
            osc.connect(gain); gain.connect(this.audioContext.destination);
            osc.start(t); osc.stop(t + 0.15);
        });
    }

    playTeacherWin() {
        const now = this.audioContext.currentTime;
        [{ f: 523.25, t: 0 }, { f: 659.25, t: 0.15 }, { f: 783.99, t: 0.3 }, { f: 1046.5, t: 0.45 }].forEach(n => {
            const t = now + n.t;
            const osc = this.createOscillator(n.f, 'sine');
            const gain = this.createGain(0.2);
            gain.gain.exponentialRampToValueAtTime(0.01, t + 0.4);
            osc.connect(gain); gain.connect(this.audioContext.destination);
            osc.start(t); osc.stop(t + 0.4);
        });
    }

    playPupilWin() {
        const now = this.audioContext.currentTime;
        [{ f: 783.99, t: 0 }, { f: 659.25, t: 0.12 }, { f: 523.25, t: 0.24 }, { f: 659.25, t: 0.36 }, { f: 523.25, t: 0.48 }].forEach(n => {
            const t = now + n.t;
            const osc = this.createOscillator(n.f, 'triangle');
            const gain = this.createGain(0.2);
            gain.gain.exponentialRampToValueAtTime(0.01, t + 0.3);
            osc.connect(gain); gain.connect(this.audioContext.destination);
            osc.start(t); osc.stop(t + 0.3);
        });
    }

    startMusic() {
        if (!this.enabled) return;
        if (!this.musicElement) {
            this.musicElement = new Audio('assets/music/background-music1.mp3');
            this.musicElement.loop = true;
            this.musicElement.volume = this.musicMuted ? 0 : this.musicVolume * this.masterVolume;
        }
        this.musicElement.currentTime = 0;
        this.musicElement.play().catch(() => {});
    }

    stopMusic() {
        if (!this.musicElement) return;
        this.musicElement.pause();
        this.musicElement.currentTime = 0;
    }

    pauseMusic() {
        if (this.musicElement) this.musicElement.pause();
    }

    resumeMusic() {
        if (this.musicElement) this.musicElement.play().catch(() => {});
    }

    toggleMusic() {
        this.musicMuted = !this.musicMuted;
        if (this.musicElement) {
            this.musicElement.volume = this.musicMuted ? 0 : this.musicVolume * this.masterVolume;
        }
        return this.musicMuted;
    }
}
