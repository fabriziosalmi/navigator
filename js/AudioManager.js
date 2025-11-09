/**
 * AudioManager.js
 * 
 * Gestisce tutti gli effetti audio sci-fi per l'esperienza immersiva
 */

export class AudioManager {
    constructor() {
        this.audioContext = null;
        this.sounds = {};
        this.masterVolume = 0.3;
        this.isEnabled = true;
        
        // Background ambient
        this.ambientOscillator = null;
        this.ambientGain = null;
        
        this.init();
    }
    
    /**
     * Initialize Web Audio API
     */
    init() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            console.log('AudioManager initialized');
            
            // Start ambient background
            this.startAmbient();
        } catch (error) {
            console.error('Web Audio API not supported:', error);
            this.isEnabled = false;
        }
    }
    
    /**
     * Start ambient background sound (drum breakbeat/drumnbass loop)
     */
    startAmbient() {
        if (!this.audioContext || !this.isEnabled) return;

        // Create master gain for the beat
        this.ambientGain = this.audioContext.createGain();
        this.ambientGain.gain.setValueAtTime(0, this.audioContext.currentTime);
        this.ambientGain.gain.linearRampToValueAtTime(0.12 * this.masterVolume, this.audioContext.currentTime + 2);
        this.ambientGain.connect(this.audioContext.destination);

        // Drum breakbeat pattern (BPM: 174 for DnB feel)
        const bpm = 174;
        const beatInterval = 60 / bpm; // Time per beat in seconds
        const patternLength = beatInterval * 16; // 16-beat pattern

        // Start the drum loop
        this.scheduleDrumLoop(beatInterval, patternLength);
    }

    /**
     * Schedule recursive drum loop
     */
    scheduleDrumLoop(beatInterval, patternLength) {
        if (!this.audioContext || !this.isEnabled) return;

        const now = this.audioContext.currentTime;

        // Drum and Bass breakbeat pattern (16-step)
        const kickPattern =    [1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0];
        const snarePattern =   [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0];
        const hihatPattern =   [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1];
        const bassPattern =    [1, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0];

        // Schedule each step in the pattern
        for (let step = 0; step < 16; step++) {
            const time = now + (step * beatInterval);

            if (kickPattern[step]) {
                this.playKick(time);
            }
            if (snarePattern[step]) {
                this.playSnare(time);
            }
            if (hihatPattern[step]) {
                this.playHiHat(time, step % 4 === 0 ? 0.15 : 0.08);
            }
            if (bassPattern[step]) {
                this.playBassline(time);
            }
        }

        // Schedule next loop
        setTimeout(() => {
            this.scheduleDrumLoop(beatInterval, patternLength);
        }, patternLength * 1000 - 50); // Schedule slightly before to prevent gaps
    }

    /**
     * Play kick drum (low punch)
     */
    playKick(time) {
        if (!this.audioContext || !this.ambientGain) return;

        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(150, time);
        osc.frequency.exponentialRampToValueAtTime(50, time + 0.1);

        gain.gain.setValueAtTime(1, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.15);

        osc.connect(gain);
        gain.connect(this.ambientGain);

        osc.start(time);
        osc.stop(time + 0.15);
    }

    /**
     * Play snare drum (sharp crack)
     */
    playSnare(time) {
        if (!this.audioContext || !this.ambientGain) return;

        // Noise component
        const bufferSize = this.audioContext.sampleRate * 0.1;
        const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const noise = this.audioContext.createBufferSource();
        noise.buffer = buffer;

        const noiseFilter = this.audioContext.createBiquadFilter();
        noiseFilter.type = 'highpass';
        noiseFilter.frequency.setValueAtTime(1000, time);

        const noiseGain = this.audioContext.createGain();
        noiseGain.gain.setValueAtTime(0.8, time);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, time + 0.08);

        noise.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(this.ambientGain);

        noise.start(time);
        noise.stop(time + 0.08);

        // Tone component
        const osc = this.audioContext.createOscillator();
        const oscGain = this.audioContext.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(200, time);

        oscGain.gain.setValueAtTime(0.5, time);
        oscGain.gain.exponentialRampToValueAtTime(0.001, time + 0.05);

        osc.connect(oscGain);
        oscGain.connect(this.ambientGain);

        osc.start(time);
        osc.stop(time + 0.05);
    }

    /**
     * Play hi-hat (crisp metallic)
     */
    playHiHat(time, volume = 0.1) {
        if (!this.audioContext || !this.ambientGain) return;

        const bufferSize = this.audioContext.sampleRate * 0.03;
        const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const noise = this.audioContext.createBufferSource();
        noise.buffer = buffer;

        const filter = this.audioContext.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.setValueAtTime(8000, time);

        const gain = this.audioContext.createGain();
        gain.gain.setValueAtTime(volume, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.03);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.ambientGain);

        noise.start(time);
        noise.stop(time + 0.03);
    }

    /**
     * Play bassline (sub bass)
     */
    playBassline(time) {
        if (!this.audioContext || !this.ambientGain) return;

        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(80, time);

        gain.gain.setValueAtTime(0.3, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.2);

        osc.connect(gain);
        gain.connect(this.ambientGain);

        osc.start(time);
        osc.stop(time + 0.2);
    }
    
    /**
     * Play hand detected sound
     */
    playHandDetected() {
        this.playFrequencySweep(400, 800, 0.3, 'sine', 0.1);
    }
    
    /**
     * Play hand lost sound
     */
    playHandLost() {
        this.playFrequencySweep(800, 200, 0.3, 'sine', 0.05);
    }
    
    /**
     * Play gesture change sound
     */
    playGestureChange(gestureName) {
        const frequencies = {
            'open': [300, 500],
            'point': [500, 700],
            'pinch': [600, 900],
            'fist': [200, 400]
        };
        
        const [freq1, freq2] = frequencies[gestureName] || [400, 600];
        this.playBeep(freq1, 0.08, 'triangle', 0.15);
        setTimeout(() => this.playBeep(freq2, 0.08, 'triangle', 0.1), 50);
    }
    
    /**
     * Play pinch start (grab)
     */
    playPinchStart() {
        this.playBeep(800, 0.15, 'square', 0.2);
        setTimeout(() => this.playBeep(1000, 0.1, 'square', 0.15), 80);
    }
    
    /**
     * Play pinch end (release)
     */
    playPinchEnd() {
        this.playFrequencySweep(1000, 500, 0.2, 'sine', 0.15);
    }
    
    /**
     * Play fist detected
     */
    playFist() {
        this.playBeep(150, 0.2, 'sawtooth', 0.2);
    }
    
    /**
     * Play cursor move (subtle tick)
     */
    playCursorMove() {
        if (Math.random() > 0.95) { // Only occasionally to avoid spam
            this.playBeep(1200, 0.02, 'sine', 0.03);
        }
    }
    
    /**
     * Play card hover
     */
    playCardHover() {
        this.playBeep(600, 0.1, 'sine', 0.15);
    }
    
    /**
     * Play card select
     */
    playCardSelect() {
        this.playBeep(800, 0.1, 'triangle', 0.2);
        setTimeout(() => this.playBeep(1000, 0.08, 'triangle', 0.15), 60);
    }
    
    /**
     * Play data update
     */
    playDataUpdate() {
        const freq = 400 + Math.random() * 400;
        this.playBeep(freq, 0.15, 'sine', 0.12);
    }
    
    /**
     * Play camera pan (continuous subtle sound)
     */
    playCameraPan(intensity) {
        if (!this.audioContext || !this.isEnabled) return;
        
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(200 + intensity * 200, this.audioContext.currentTime);
        
        gain.gain.setValueAtTime(0.05 * this.masterVolume, this.audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.1);
        
        osc.connect(gain);
        gain.connect(this.audioContext.destination);
        
        osc.start();
        osc.stop(this.audioContext.currentTime + 0.1);
    }
    
    /**
     * Play a simple beep
     */
    playBeep(frequency, duration, type = 'sine', volume = 0.1) {
        if (!this.audioContext || !this.isEnabled) return;
        
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        
        osc.type = type;
        osc.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
        
        gain.gain.setValueAtTime(volume * this.masterVolume, this.audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration);
        
        osc.connect(gain);
        gain.connect(this.audioContext.destination);
        
        osc.start();
        osc.stop(this.audioContext.currentTime + duration);
    }
    
    /**
     * Play frequency sweep
     */
    playFrequencySweep(startFreq, endFreq, duration, type = 'sine', volume = 0.1) {
        if (!this.audioContext || !this.isEnabled) return;
        
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        
        osc.type = type;
        osc.frequency.setValueAtTime(startFreq, this.audioContext.currentTime);
        osc.frequency.exponentialRampToValueAtTime(endFreq, this.audioContext.currentTime + duration);
        
        gain.gain.setValueAtTime(volume * this.masterVolume, this.audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration);
        
        osc.connect(gain);
        gain.connect(this.audioContext.destination);
        
        osc.start();
        osc.stop(this.audioContext.currentTime + duration);
    }
    
    /**
     * Play success sound
     */
    playSuccess() {
        this.playBeep(600, 0.1, 'sine', 0.15);
        setTimeout(() => this.playBeep(800, 0.1, 'sine', 0.15), 100);
        setTimeout(() => this.playBeep(1000, 0.15, 'sine', 0.2), 200);
    }
    
    /**
     * Play error sound
     */
    playError() {
        this.playBeep(200, 0.2, 'sawtooth', 0.2);
        setTimeout(() => this.playBeep(150, 0.3, 'sawtooth', 0.15), 150);
    }
    
    /**
     * Set master volume
     */
    setVolume(volume) {
        this.masterVolume = Math.max(0, Math.min(1, volume));
        if (this.ambientGain) {
            this.ambientGain.gain.setValueAtTime(0.12 * this.masterVolume, this.audioContext.currentTime);
        }
    }
    
    /**
     * Toggle audio on/off
     */
    toggle() {
        this.isEnabled = !this.isEnabled;
        if (!this.isEnabled && this.ambientGain) {
            this.ambientGain.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + 0.5);
        } else if (this.isEnabled && this.ambientGain) {
            this.ambientGain.gain.linearRampToValueAtTime(0.12 * this.masterVolume, this.audioContext.currentTime + 0.5);
        } else if (this.isEnabled && !this.ambientGain) {
            // Restart ambient if it wasn't playing
            this.startAmbient();
        }
        return this.isEnabled;
    }
    
    /**
     * Resume audio context (needed for user interaction)
     */
    async resume() {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            await this.audioContext.resume();
            console.log('Audio context resumed');
        }
    }
}
