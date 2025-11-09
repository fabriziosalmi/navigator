/**
 * GestureController.js
 * 
 * Handles hand tracking using MediaPipe Hands and translates hand landmarks
 * into gestures that can control the application.
 * Dispatches CustomEvents for gesture actions.
 */

export class GestureController {
    constructor() {
        this.hands = null;
        this.camera = null;
        this.videoElement = null;
        this.canvasElement = null;
        this.canvasCtx = null;
        
        // Hand tracking state
        this.previousHandPosition = null;
        this.currentHandPosition = null;
        this.handLandmarks = null;
        
        // Gesture state
        this.isPinching = false;
        this.isFist = false;
        this.cursorPosition = { x: 0, y: 0 };
        
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
            this.canvasElement = document.getElementById('gesture-canvas');
            this.canvasCtx = this.canvasElement?.getContext('2d');
            
            // Create virtual cursor element
            this.createVirtualCursor();
            
            // Initialize MediaPipe Hands
            this.hands = new Hands({
                locateFile: (file) => {
                    return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
                }
            });
            
            this.hands.setOptions({
                maxNumHands: 2,
                modelComplexity: 1,
                minDetectionConfidence: 0.5,
                minTrackingConfidence: 0.5
            });
            
            this.hands.onResults((results) => this.onResults(results));
            
            // Setup webcam
            await this.setupCamera();
            
            // Start processing
            this.startProcessing();
            
            this.isInitialized = true;
            console.log('GestureController initialized');
            
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
                    height: { ideal: 720 }
                }
            });
            
            this.videoElement.srcObject = stream;
            
            return new Promise((resolve) => {
                this.videoElement.onloadedmetadata = () => {
                    resolve();
                };
            });
        } catch (error) {
            throw new Error('Could not access webcam: ' + error.message);
        }
    }
    
    /**
     * Start processing video frames
     */
    async startProcessing() {
        this.camera = new Camera(this.videoElement, {
            onFrame: async () => {
                await this.hands.send({ image: this.videoElement });
            },
            width: 1280,
            height: 720
        });
        
        await this.camera.start();
    }
    
    /**
     * Create virtual cursor element for index finger
     */
    createVirtualCursor() {
        this.cursorElement = document.createElement('div');
        this.cursorElement.id = 'virtual-cursor';
        document.body.appendChild(this.cursorElement);
    }
    
    /**
     * Process hand tracking results from MediaPipe
     * @param {Object} results - MediaPipe results object
     */
    onResults(results) {
        // Optional: Draw landmarks on canvas for debugging
        if (this.canvasCtx && document.body.classList.contains('debug')) {
            this.drawLandmarks(results);
        }
        
        if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
            // Process first detected hand
            const landmarks = results.multiHandLandmarks[0];
            this.handLandmarks = landmarks;
            
            // Detect gestures
            this.detectPan(landmarks);
            this.detectPinch(landmarks);
            this.detectFist(landmarks);
            this.updateCursor(landmarks);
        } else {
            // No hand detected
            this.handLandmarks = null;
            this.previousHandPosition = null;
            this.cursorElement.classList.remove('active');
        }
    }
    
    /**
     * Detect pan gesture (open hand movement)
     * @param {Array} landmarks - Hand landmarks
     */
    detectPan(landmarks) {
        // Use palm base (wrist) for pan tracking
        const palmBase = landmarks[0]; // Wrist landmark
        
        this.currentHandPosition = {
            x: palmBase.x,
            y: palmBase.y
        };
        
        if (this.previousHandPosition && !this.isFist) {
            // Calculate movement delta
            const dx = (this.currentHandPosition.x - this.previousHandPosition.x) * window.innerWidth;
            const dy = (this.currentHandPosition.y - this.previousHandPosition.y) * window.innerHeight;
            
            // Only dispatch if movement is significant
            if (Math.abs(dx) > 2 || Math.abs(dy) > 2) {
                const event = new CustomEvent('pan', {
                    detail: { dx, dy }
                });
                window.dispatchEvent(event);
            }
        }
        
        this.previousHandPosition = { ...this.currentHandPosition };
    }
    
    /**
     * Detect pinch gesture (thumb and index finger touching)
     * @param {Array} landmarks - Hand landmarks
     */
    detectPinch(landmarks) {
        const thumbTip = landmarks[4];
        const indexTip = landmarks[8];
        
        // Calculate distance between thumb and index finger
        const distance = Math.sqrt(
            Math.pow(thumbTip.x - indexTip.x, 2) +
            Math.pow(thumbTip.y - indexTip.y, 2)
        );
        
        const pinchThreshold = 0.05;
        const wasPinching = this.isPinching;
        this.isPinching = distance < pinchThreshold;
        
        // Dispatch pinch events
        if (this.isPinching && !wasPinching) {
            const event = new CustomEvent('pinchStart', {
                detail: { position: { x: indexTip.x, y: indexTip.y } }
            });
            window.dispatchEvent(event);
        } else if (!this.isPinching && wasPinching) {
            const event = new CustomEvent('pinchEnd', {
                detail: { position: { x: indexTip.x, y: indexTip.y } }
            });
            window.dispatchEvent(event);
        }
    }
    
    /**
     * Detect fist gesture (all fingers curled)
     * @param {Array} landmarks - Hand landmarks
     */
    detectFist(landmarks) {
        // Check if all fingertips are below their respective middle joints
        const fingers = [
            { tip: 8, mid: 6 },   // Index
            { tip: 12, mid: 10 }, // Middle
            { tip: 16, mid: 14 }, // Ring
            { tip: 20, mid: 18 }  // Pinky
        ];
        
        let curledCount = 0;
        fingers.forEach(finger => {
            if (landmarks[finger.tip].y > landmarks[finger.mid].y) {
                curledCount++;
            }
        });
        
        const wasFist = this.isFist;
        this.isFist = curledCount >= 3;
        
        // Dispatch fist events
        if (this.isFist && !wasFist) {
            const event = new CustomEvent('fistStart');
            window.dispatchEvent(event);
        } else if (!this.isFist && wasFist) {
            const event = new CustomEvent('fistEnd');
            window.dispatchEvent(event);
        }
    }
    
    /**
     * Update virtual cursor position based on index finger
     * @param {Array} landmarks - Hand landmarks
     */
    updateCursor(landmarks) {
        const indexTip = landmarks[8];
        
        this.cursorPosition = {
            x: indexTip.x * window.innerWidth,
            y: indexTip.y * window.innerHeight
        };
        
        // Update cursor element
        this.cursorElement.style.left = `${this.cursorPosition.x}px`;
        this.cursorElement.style.top = `${this.cursorPosition.y}px`;
        this.cursorElement.classList.add('active');
        
        // Dispatch cursor move event
        const event = new CustomEvent('cursorMove', {
            detail: {
                x: indexTip.x,
                y: indexTip.y,
                screenX: this.cursorPosition.x,
                screenY: this.cursorPosition.y
            }
        });
        window.dispatchEvent(event);
    }
    
    /**
     * Draw hand landmarks on canvas for debugging
     * @param {Object} results - MediaPipe results
     */
    drawLandmarks(results) {
        this.canvasCtx.save();
        this.canvasCtx.clearRect(0, 0, this.canvasElement.width, this.canvasElement.height);
        
        if (results.multiHandLandmarks) {
            for (const landmarks of results.multiHandLandmarks) {
                drawConnectors(this.canvasCtx, landmarks, HAND_CONNECTIONS, {
                    color: '#00FF00',
                    lineWidth: 2
                });
                drawLandmarks(this.canvasCtx, landmarks, {
                    color: '#FF0000',
                    lineWidth: 1,
                    radius: 3
                });
            }
        }
        
        this.canvasCtx.restore();
    }
    
    /**
     * Get current cursor position in normalized coordinates (0-1)
     * @returns {Object} { x, y }
     */
    getCursorPosition() {
        if (!this.handLandmarks) return null;
        
        const indexTip = this.handLandmarks[8];
        return {
            x: indexTip.x,
            y: indexTip.y
        };
    }
    
    /**
     * Check if gesture controller is ready
     * @returns {boolean}
     */
    isReady() {
        return this.isInitialized;
    }
    
    /**
     * Stop the gesture controller and release resources
     */
    stop() {
        if (this.camera) {
            this.camera.stop();
        }
        
        if (this.videoElement && this.videoElement.srcObject) {
            const tracks = this.videoElement.srcObject.getTracks();
            tracks.forEach(track => track.stop());
        }
        
        console.log('GestureController stopped');
    }
}
