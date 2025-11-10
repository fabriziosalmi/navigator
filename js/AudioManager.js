/**
 * AudioManager.js
 * 
 * Gestisce tutti gli effetti audio sci-fi con spazializzazione 3D
 * Audio posizionale per feedback multisensoriale immersivo
 */

export class AudioManager {
    constructor() {
        this.audioContext = null;
        this.sounds = {};
        this.masterVolume = 0.3;
        this.isEnabled = true;
        this.isInitialized = false; // Track initialization state
        
        // 3D Audio Spaziale
        this.listener = null;
        
        // Background ambient
        this.ambientOscillator = null;
        this.ambientGain = null;

        // Cached resources for performance
        this.snareNoiseBuffer = null;
        this.hihatNoiseBuffer = null;

        // Nodes for continuous sounds
        this.cameraPanNodes = null;
        
        // Don't initialize audio context yet - wait for user interaction
        // console.log('AudioManager ready (waiting for user interaction)');
    }
    
    /**
     * Initialize Web Audio API with spatial audio support
     * MUST be called after user interaction (e.g., button click)
     */
    init() {
        if (this.isInitialized) {
            return;
        }
        
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // Setup 3D audio listener (user's position)
            this.listener = this.audioContext.listener;
            if (this.listener.positionX) {
                // Modern API
                this.listener.positionX.setValueAtTime(0, this.audioContext.currentTime);
                this.listener.positionY.setValueAtTime(0, this.audioContext.currentTime);
                this.listener.positionZ.setValueAtTime(0, this.audioContext.currentTime);
                this.listener.forwardX.setValueAtTime(0, this.audioContext.currentTime);
                this.listener.forwardY.setValueAtTime(0, this.audioContext.currentTime);
                this.listener.forwardZ.setValueAtTime(-1, this.audioContext.currentTime);
                this.listener.upX.setValueAtTime(0, this.audioContext.currentTime);
                this.listener.upY.setValueAtTime(1, this.audioContext.currentTime);
                this.listener.upZ.setValueAtTime(0, this.audioContext.currentTime);
            } else {
                // Legacy API
                this.listener.setPosition(0, 0, 0);
                this.listener.setOrientation(0, 0, -1, 0, 1, 0);
            }

            // Pre-generate and cache noise buffers to avoid creating them on every beat
            this.createNoiseBuffers();
            
            this.isInitialized = true;
            // console.log('AudioManager initialized with 3D spatial audio');
            
            // Ambient background disabled - keeping only gesture/navigation effects
            // this.startAmbient();
        } catch (error) {
            console.error('Web Audio API not supported:', error);
            this.isEnabled = false;
        }
    }
    
    /**
     * Resume audio context (required after user interaction)
     */
    async resume() {
        if (!this.audioContext) {
            this.init();
        }
        
        if (this.audioContext && this.audioContext.state === 'suspended') {
            await this.audioContext.resume();
            // console.log('Audio context resumed');
        }
    }
    
    /**
     * Check if audio is ready to play
     */
    isReady() {
        return this.isInitialized && this.audioContext && this.isEnabled;
    }

    /**
     * Creates and caches noise buffers for snare and hi-hat sounds.
     */
    createNoiseBuffers() {
        if (!this.audioContext) {
            return;
        }
        const sampleRate = this.audioContext.sampleRate;

        // Snare buffer
        const snareBufferSize = sampleRate * 0.1;
        this.snareNoiseBuffer = this.audioContext.createBuffer(1, snareBufferSize, sampleRate);
        const snareData = this.snareNoiseBuffer.getChannelData(0);
        for (let i = 0; i < snareBufferSize; i++) {
            snareData[i] = Math.random() * 2 - 1;
        }

        // Hi-hat buffer
        const hihatBufferSize = sampleRate * 0.03;
        this.hihatNoiseBuffer = this.audioContext.createBuffer(1, hihatBufferSize, sampleRate);
        const hihatData = this.hihatNoiseBuffer.getChannelData(0);
        for (let i = 0; i < hihatBufferSize; i++) {
            hihatData[i] = Math.random() * 2 - 1;
        }
    }
    
    /**
     * Start ambient background sound (drum breakbeat/drumnbass loop)
     */
    startAmbient() {
        if (!this.isReady()) {
            return;
        }

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
        if (!this.isReady()) {
            return;
        }

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
        if (!this.audioContext || !this.ambientGain || !this.isInitialized) {
            return;
        }

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
        if (!this.isReady() || !this.ambientGain || !this.snareNoiseBuffer) {
            return;
        }

        // Noise component from cached buffer
        const noise = this.audioContext.createBufferSource();
        noise.buffer = this.snareNoiseBuffer;

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
        if (!this.isReady() || !this.ambientGain || !this.hihatNoiseBuffer) {
            return;
        }

        // Noise component from cached buffer
        const noise = this.audioContext.createBufferSource();
        noise.buffer = this.hihatNoiseBuffer;

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
    playBassline() {
        if (!this.isReady()) {
            return;
        }

        const time = this.audioContext.currentTime;
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
     * @param {number} intensity - The intensity of the pan (e.g., 0 to 1)
     * @param {boolean} isPanning - True if panning is active, false to stop.
     */
    playCameraPan(intensity, isPanning) {
        if (!this.isReady()) {
            return;
        }

        const now = this.audioContext.currentTime;

        if (isPanning) {
            if (!this.cameraPanNodes) {
                // Create and start nodes if they don't exist
                const osc = this.audioContext.createOscillator();
                const gain = this.audioContext.createGain();
                
                osc.type = 'sine';
                osc.frequency.setValueAtTime(200, now);
                
                gain.gain.setValueAtTime(0, now);
                
                osc.connect(gain);
                gain.connect(this.audioContext.destination);
                osc.start();

                this.cameraPanNodes = { osc, gain };
            }
            
            // Modulate parameters based on intensity
            const targetFreq = 200 + intensity * 200;
            const targetGain = 0.05 * this.masterVolume;
            
            this.cameraPanNodes.osc.frequency.linearRampToValueAtTime(targetFreq, now + 0.05);
            this.cameraPanNodes.gain.gain.linearRampToValueAtTime(targetGain, now + 0.05);

        } else if (this.cameraPanNodes) {
            // Fade out and stop the sound
            this.cameraPanNodes.gain.gain.cancelScheduledValues(now);
            this.cameraPanNodes.gain.gain.linearRampToValueAtTime(0, now + 0.2);
            this.cameraPanNodes.osc.stop(now + 0.2);
            this.cameraPanNodes = null;
        }
    }
    
    /**
     * Play a simple beep
     */
    playBeep(frequency, duration, type = 'sine', volume = 0.1) {
        if (!this.isReady()) {
            return;
        }
        
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
        if (!this.isReady()) {
            return;
        }
        
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
        if (this.cameraPanNodes) {
            const targetGain = 0.05 * this.masterVolume;
            this.cameraPanNodes.gain.gain.linearRampToValueAtTime(targetGain, this.audioContext.currentTime + 0.05);
        }
    }
    
    /**
     * Toggle audio on/off
     */
    toggle() {
        this.isEnabled = !this.isEnabled;
        if (this.cameraPanNodes) {
            this.playCameraPan(0, false); // Stop panning sound
        }
        if (!this.isEnabled && this.ambientGain) {
            this.ambientGain.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + 0.5);
        } else if (this.isEnabled && this.ambientGain) {
            this.ambientGain.gain.linearRampToValueAtTime(0.12 * this.masterVolume, this.audioContext.currentTime + 0.5);
        }
        // Ambient restart disabled - gesture/navigation effects only
        // else if (this.isEnabled && !this.ambientGain) {
        //     this.startAmbient();
        // }
        return this.isEnabled;
    }

    /**
     * 3D SPATIAL AUDIO - Highlight sound (ronzio energetico)
     * Suona quando una card viene evidenziata
     * @param {number} x - Position X (-1 to 1, left to right)
     * @param {number} y - Position Y (-1 to 1, bottom to top)
     */
    playHighlight(x = 0, y = 0) {
        if (!this.isReady()) {
            return;
        }

        const panner = this.create3DPanner(x, y, -2);

        // Create energetic hum (dual oscillators for richness)
        const osc1 = this.audioContext.createOscillator();
        const osc2 = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();

        osc1.type = 'sine';
        osc2.type = 'sine';
        osc1.frequency.setValueAtTime(220, this.audioContext.currentTime);
        osc2.frequency.setValueAtTime(440, this.audioContext.currentTime);

        gain.gain.setValueAtTime(0.08 * this.masterVolume, this.audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.15);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(panner);
        panner.connect(this.audioContext.destination);

        osc1.start();
        osc2.start();
        osc1.stop(this.audioContext.currentTime + 0.15);
        osc2.stop(this.audioContext.currentTime + 0.15);
    }

    /**
     * 3D SPATIAL AUDIO - Grab sound (click materico)
     * Suono soddisfacente quando l'utente afferra una card
     * @param {number} x - Position X
     * @param {number} y - Position Y
     */
    playGrab(x = 0, y = 0) {
        if (!this.isReady()) {
            return;
        }

        const panner = this.create3DPanner(x, y, -1);

        // Short, punchy click with noise
        const osc = this.audioContext.createOscillator();
        const noise = this.audioContext.createBufferSource();
        const gain = this.audioContext.createGain();

        // Create white noise buffer
        const bufferSize = this.audioContext.sampleRate * 0.05;
        const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const output = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            output[i] = Math.random() * 2 - 1;
        }
        noise.buffer = buffer;

        osc.type = 'square';
        osc.frequency.setValueAtTime(150, this.audioContext.currentTime);
        osc.frequency.exponentialRampToValueAtTime(50, this.audioContext.currentTime + 0.05);

        gain.gain.setValueAtTime(0.15 * this.masterVolume, this.audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.05);

        osc.connect(gain);
        noise.connect(gain);
        gain.connect(panner);
        panner.connect(this.audioContext.destination);

        osc.start();
        noise.start();
        osc.stop(this.audioContext.currentTime + 0.05);
        noise.stop(this.audioContext.currentTime + 0.05);
    }

    /**
     * 3D SPATIAL AUDIO - Whoosh sound (spostamento veloce)
     * Volume e pitch seguono la velocità del movimento
     * @param {number} x - Position X
     * @param {number} y - Position Y
     * @param {number} velocity - Movement velocity (0-1)
     */
    playWhoosh(x = 0, y = 0, velocity = 0.5) {
        if (!this.isReady()) {
            return;
        }

        const panner = this.create3DPanner(x, y, -1);

        // Velocity affects pitch and duration
        const basePitch = 200;
        const pitchRange = 600;
        const pitch = basePitch + (velocity * pitchRange);
        const duration = 0.1 + (velocity * 0.3);
        const volume = 0.1 + (velocity * 0.15);

        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        const filter = this.audioContext.createBiquadFilter();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(pitch, this.audioContext.currentTime);
        osc.frequency.exponentialRampToValueAtTime(pitch * 0.5, this.audioContext.currentTime + duration);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(2000, this.audioContext.currentTime);
        filter.frequency.exponentialRampToValueAtTime(500, this.audioContext.currentTime + duration);

        gain.gain.setValueAtTime(volume * this.masterVolume, this.audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(panner);
        panner.connect(this.audioContext.destination);

        osc.start();
        osc.stop(this.audioContext.currentTime + duration);
    }

    /**
     * 3D SPATIAL AUDIO - Data update ping (cristallino digitale)
     * Suono quando i dati vengono aggiornati
     * @param {number} x - Position X
     * @param {number} y - Position Y
     */
    playDataPing(x = 0, y = 0) {
        if (!this.isReady()) {
            return;
        }

        const panner = this.create3DPanner(x, y, -1);

        // Crystalline digital ping (multiple harmonics)
        const frequencies = [800, 1200, 1600];

        frequencies.forEach((freq, index) => {
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, this.audioContext.currentTime);

            const vol = (0.08 / (index + 1)) * this.masterVolume;
            gain.gain.setValueAtTime(vol, this.audioContext.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.2);

            osc.connect(gain);
            gain.connect(panner);

            osc.start();
            osc.stop(this.audioContext.currentTime + 0.2);
        });

        panner.connect(this.audioContext.destination);
    }

    /**
     * Helper: Create 3D panner node
     * @param {number} x - Position X (-1 to 1)
     * @param {number} y - Position Y (-1 to 1)
     * @param {number} z - Position Z (depth)
     * @returns {PannerNode}
     */
    create3DPanner(x, y, z) {
        const panner = this.audioContext.createPanner();
        panner.panningModel = 'HRTF';
        panner.distanceModel = 'inverse';
        panner.refDistance = 1;
        panner.maxDistance = 10;
        panner.rolloffFactor = 1;

        if (panner.positionX) {
            panner.positionX.setValueAtTime(x * 5, this.audioContext.currentTime);
            panner.positionY.setValueAtTime(y * 5, this.audioContext.currentTime);
            panner.positionZ.setValueAtTime(z, this.audioContext.currentTime);
        } else {
            panner.setPosition(x * 5, y * 5, z);
        }

        return panner;
    }
}
