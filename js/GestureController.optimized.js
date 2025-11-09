/**
 * GestureController.js (OPTIMIZED)
 * 
 * REFACTOR: Gesture Finite State Machine for conflict-free interactions
 * OPTIMIZATION: One-Euro Filter for silky-smooth cursor, adaptive processing frequency
 * 
 * Handles hand tracking with maximum smoothness and minimal CPU usage
 */

export class GestureController {
    constructor(appState) {
        this.appState = appState; // REFACTOR: Use centralized state
        
        this.hands = null;
        this.camera = null;
        this.videoElement = null;
        
        // OPTIMIZATION: One-Euro Filter for landmark smoothing
        this.oneEuroFilter = new OneEuroFilter(60, 1.0, 0.007, 1.0);
        
        // Hand tracking state
        this.handLandmarks = null;
        this.smoothedCursor = { x: 0, y: 0 };
        
        // OPTIMIZATION: Adaptive processing frequency
        this.processingFPS = 30; // Start at 30 FPS
        this.targetFPS = 30;
        this.noHandFrames = 0;
        this.lastProcessTime = 0;
        
        // Virtual cursor element
        this.cursorElement = null;
        
        // Initialization state
        this.isInitialized = false;
    }
    
    /**
     * Initialize MediaPipe Hands and webcam
     */
    async init() {
        try {
            // Get video element
            this.videoElement = document.getElementById('webcam');
            
            // Create virtual cursor element
            this.createVirtualCursor();
            
            // Initialize MediaPipe Hands
            this.hands = new Hands({
                locateFile: (file) => {
                    return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
                }
            });
            
            // OPTIMIZATION: Lower model complexity for better performance
            this.hands.setOptions({
                maxNumHands: 1, // Single hand is enough for most interactions
                modelComplexity: 0, // 0 = lite model, 1 = full model
                minDetectionConfidence: 0.7,
                minTrackingConfidence: 0.5
            });
            
            this.hands.onResults((results) => this.onResults(results));
            
            // Setup webcam
            await this.setupCamera();
            
            // OPTIMIZATION: Start processing with adaptive frequency
            this.startAdaptiveProcessing();
            
            this.isInitialized = true;
            console.log('GestureController initialized (optimized)');
            
            return true;
        } catch (error) {
            console.error('Failed to initialize GestureController:', error);
            return false;
        }
    }
    
    /**
     * Setup webcam access
     */
    async setupCamera() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    facingMode: 'user'
                }
            });
            
            this.videoElement.srcObject = stream;
            
            return new Promise((resolve) => {
                this.videoElement.onloadedmetadata = () => {
                    this.videoElement.play();
                    resolve();
                };
            });
        } catch (error) {
            throw new Error('Could not access webcam: ' + error.message);
        }
    }
    
    /**
     * OPTIMIZATION: Adaptive processing frequency
     * Runs at low FPS when no hand detected, ramps up when hand appears
     */
    async startAdaptiveProcessing() {
        const processFrame = async () => {
            const now = performance.now();
            const interval = 1000 / this.processingFPS;
            
            if (now - this.lastProcessTime >= interval) {
                await this.hands.send({ image: this.videoElement });
                this.lastProcessTime = now;
            }
            
            requestAnimationFrame(processFrame);
        };
        
        processFrame();
        
        console.log('Adaptive processing started');
    }
    
    /**
     * Create virtual cursor element for index finger
     */
    createVirtualCursor() {
        this.cursorElement = document.createElement('div');
        this.cursorElement.id = 'virtual-cursor';
        this.cursorElement.style.cssText = `
            position: fixed;
            width: 20px;
            height: 20px;
            border-radius: 50%;
            background: rgba(0, 255, 255, 0.5);
            border: 2px solid cyan;
            pointer-events: none;
            z-index: 10000;
            transform: translate(-50%, -50%);
            transition: opacity 0.2s;
        `;
        document.body.appendChild(this.cursorElement);
    }
    
    /**
     * REFACTOR: Process hand tracking results with FSM
     * @param {Object} results - MediaPipe results object
     */
    onResults(results) {
        if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
            // Hand detected
            this.noHandFrames = 0;
            this.handLandmarks = results.multiHandLandmarks[0];
            
            // OPTIMIZATION: Ramp up to full processing speed
            this.targetFPS = 60;
            this.processingFPS += (this.targetFPS - this.processingFPS) * 0.1;
            
            // Update cursor position with smoothing
            this.updateSmoothedCursor();
            
            // Detect gestures and update FSM
            this.detectGestures();
            
            // Update appState
            this.appState.setHandDetected(true, results.multiHandLandmarks[0].confidence || 1.0);
            
        } else {
            // No hand detected
            this.noHandFrames++;
            this.handLandmarks = null;
            
            // OPTIMIZATION: Reduce processing frequency when no hand
            if (this.noHandFrames > 30) {
                this.targetFPS = 10; // Drop to 10 FPS
                this.processingFPS += (this.targetFPS - this.processingFPS) * 0.1;
            }
            
            // Reset to IDLE state
            if (this.appState.getGestureState() !== 'IDLE') {
                this.appState.setGestureState('IDLE');
            }
            
            // Hide cursor
            if (this.cursorElement) {
                this.cursorElement.style.opacity = '0';
            }
            
            this.appState.setHandDetected(false, 0);
        }
    }
    
    /**
     * OPTIMIZATION: Update cursor with One-Euro Filter for smooth motion
     */
    updateSmoothedCursor() {
        if (!this.handLandmarks) return;
        
        // Get index finger tip (landmark 8)
        const indexTip = this.handLandmarks[8];
        
        // Convert to screen coordinates
        const rawX = indexTip.x;
        const rawY = indexTip.y;
        
        // Apply One-Euro Filter
        const smoothedX = this.oneEuroFilter.filter(rawX, performance.now());
        const smoothedY = this.oneEuroFilter.filter(rawY, performance.now());
        
        this.smoothedCursor.x = smoothedX;
        this.smoothedCursor.y = smoothedY;
        
        // Update appState
        this.appState.updateCursorPosition(smoothedX, smoothedY);
        
        // Update visual cursor
        if (this.cursorElement) {
            this.cursorElement.style.left = (smoothedX * window.innerWidth) + 'px';
            this.cursorElement.style.top = (smoothedY * window.innerHeight) + 'px';
            this.cursorElement.style.opacity = '1';
        }
    }
    
    /**
     * REFACTOR: Detect gestures and update FSM
     * Uses state machine to prevent conflicting gestures
     */
    detectGestures() {
        if (!this.handLandmarks) return;
        
        const currentState = this.appState.getGestureState();
        
        // Detect basic gestures
        const isPinching = this.detectPinch(this.handLandmarks);
        const isFist = this.detectFist(this.handLandmarks);
        const isPanning = this.detectPan(this.handLandmarks);
        
        // FSM transition logic
        switch (currentState) {
            case 'IDLE':
                if (isPinching) {
                    this.appState.setGestureState('PRE_GRAB');
                } else if (isPanning) {
                    this.appState.setGestureState('PANNING');
                }
                break;
                
            case 'PANNING':
                if (!isPanning) {
                    this.appState.setGestureState('IDLE');
                }
                break;
                
            case 'PRE_GRAB':
                if (isPinching) {
                    // Check if cursor is over a card
                    const highlightedCard = this.appState.getHighlightedCard();
                    if (highlightedCard !== null) {
                        this.appState.setGestureState('GRABBING');
                        this.appState.setGrabbedCard(highlightedCard);
                    }
                } else {
                    this.appState.setGestureState('IDLE');
                }
                break;
                
            case 'GRABBING':
                if (!isPinching) {
                    this.appState.setGestureState('IDLE');
                    this.appState.setGrabbedCard(null);
                }
                break;
        }
    }
    
    /**
     * Detect pinch gesture (thumb and index finger close together)
     */
    detectPinch(landmarks) {
        const thumb = landmarks[4];
        const index = landmarks[8];
        
        const distance = Math.sqrt(
            Math.pow(thumb.x - index.x, 2) +
            Math.pow(thumb.y - index.y, 2) +
            Math.pow(thumb.z - index.z, 2)
        );
        
        return distance < 0.05; // Threshold for pinch
    }
    
    /**
     * Detect fist gesture (all fingers curled)
     */
    detectFist(landmarks) {
        const palm = landmarks[0];
        const fingerTips = [4, 8, 12, 16, 20]; // Thumb, index, middle, ring, pinky
        
        let closedFingers = 0;
        fingerTips.forEach(tipIndex => {
            const tip = landmarks[tipIndex];
            const distance = Math.sqrt(
                Math.pow(tip.x - palm.x, 2) +
                Math.pow(tip.y - palm.y, 2) +
                Math.pow(tip.z - palm.z, 2)
            );
            if (distance < 0.15) closedFingers++;
        });
        
        return closedFingers >= 4;
    }
    
    /**
     * Detect panning gesture (open hand moving)
     */
    detectPan(landmarks) {
        const palm = landmarks[0];
        const fingerTips = [8, 12, 16, 20]; // Index, middle, ring, pinky
        
        let openFingers = 0;
        fingerTips.forEach(tipIndex => {
            const tip = landmarks[tipIndex];
            const distance = Math.sqrt(
                Math.pow(tip.x - palm.x, 2) +
                Math.pow(tip.y - palm.y, 2) +
                Math.pow(tip.z - palm.z, 2)
            );
            if (distance > 0.15) openFingers++;
        });
        
        return openFingers >= 3;
    }
    
    /**
     * Get current cursor position
     */
    getCursorPosition() {
        return this.smoothedCursor;
    }
    
    /**
     * MEMORY: Cleanup resources
     */
    dispose() {
        if (this.videoElement && this.videoElement.srcObject) {
            this.videoElement.srcObject.getTracks().forEach(track => track.stop());
        }
        
        if (this.cursorElement) {
            this.cursorElement.remove();
        }
        
        console.log('GestureController disposed');
    }
}

// ============================================================
// ONE-EURO FILTER FOR SMOOTH CURSOR TRACKING
// ============================================================

/**
 * OPTIMIZATION: One-Euro Filter implementation
 * Reference: http://cristal.univ-lille.fr/~casiez/1euro/
 * 
 * Provides lag-free smoothing with minimal jitter
 * - Adapts to movement speed (fast = less smoothing)
 * - Eliminates high-frequency noise (jitter)
 */
class OneEuroFilter {
    constructor(freq, mincutoff = 1.0, beta = 0.007, dcutoff = 1.0) {
        this.freq = freq;
        this.mincutoff = mincutoff;
        this.beta = beta;
        this.dcutoff = dcutoff;
        this.x = new LowPassFilter(this.alpha(mincutoff));
        this.dx = new LowPassFilter(this.alpha(dcutoff));
        this.lasttime = null;
    }
    
    alpha(cutoff) {
        const te = 1.0 / this.freq;
        const tau = 1.0 / (2 * Math.PI * cutoff);
        return 1.0 / (1.0 + tau / te);
    }
    
    filter(value, timestamp = null) {
        // Update sampling frequency based on timestamp
        if (this.lasttime && timestamp) {
            this.freq = 1000.0 / (timestamp - this.lasttime);
        }
        this.lasttime = timestamp;
        
        // Estimate velocity
        const dvalue = this.x.hasLastRawValue() ? 
            (value - this.x.lastRawValue()) * this.freq : 
            0.0;
        
        const edvalue = this.dx.filterWithAlpha(dvalue, this.alpha(this.dcutoff));
        
        // Calculate adaptive cutoff
        const cutoff = this.mincutoff + this.beta * Math.abs(edvalue);
        
        // Filter with adaptive cutoff
        return this.x.filterWithAlpha(value, this.alpha(cutoff));
    }
}

/**
 * Low-pass filter helper for One-Euro Filter
 */
class LowPassFilter {
    constructor(alpha) {
        this.setAlpha(alpha);
        this.y = null;
        this.s = null;
    }
    
    setAlpha(alpha) {
        if (alpha <= 0.0 || alpha > 1.0) {
            throw new Error('Alpha must be in (0.0, 1.0]');
        }
        this.alpha = alpha;
    }
    
    filter(value, timestamp = null, alpha = null) {
        if (alpha !== null) {
            this.setAlpha(alpha);
        }
        
        let result;
        if (this.y === null) {
            result = value;
        } else {
            result = this.alpha * value + (1.0 - this.alpha) * this.y;
        }
        
        this.y = result;
        this.s = value;
        return result;
    }
    
    filterWithAlpha(value, alpha) {
        this.setAlpha(alpha);
        return this.filter(value);
    }
    
    hasLastRawValue() {
        return this.s !== null;
    }
    
    lastRawValue() {
        return this.s;
    }
}

export default GestureController;
