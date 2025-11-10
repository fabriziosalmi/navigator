/**
 * GestureInputPlugin.js
 * 
 * Captures hand gesture input from MediaPipe and emits raw gesture events.
 * Wraps the existing GestureDetector.js functionality.
 * Completely decoupled from navigation logic.
 * 
 * Events emitted:
 * - input:gesture:hand_detected
 * - input:gesture:hand_lost
 * - input:gesture:swipe_left
 * - input:gesture:swipe_right
 * - input:gesture:swipe_up
 * - input:gesture:swipe_down
 * - input:gesture:pinch
 * - input:gesture:fist
 * - input:gesture:point
 * - input:gesture:open_hand
 */

import { BasePlugin } from '../../core/BasePlugin.js';
import { GestureDetector } from '../../GestureDetector.js';

export class GestureInputPlugin extends BasePlugin {
    constructor(config = {}) {
        super('GestureInput', {
            enabled: true,
            camera: {
                width: 640,
                height: 480,
                facingMode: 'user',
                frameRate: 30
            },
            mediapipe: {
                static_image_mode: false,
                max_num_hands: 1,
                model_complexity: 1,
                min_detection_confidence: 0.7,
                min_tracking_confidence: 0.5
            },
            swipe: {
                min_distance: 0.08,
                max_time_ms: 800,
                cooldown_ms: 300
            },
            ...config
        });

        this.gestureDetector = null;
        this.hands = null;
        this.camera = null;
        this.videoElement = null;
        this.canvasElement = null;
        this.canvasCtx = null;
        this.animationFrameId = null;

        // Gesture state
        this.lastHandPosition = null;
        this.swipeStartPosition = null;
        this.swipeStartTime = 0;
        this.lastSwipeTime = 0;
        this.handDetected = false;
    }

    async onInit() {
        this.log('Initializing gesture input');

        // Create gesture detector
        this.gestureDetector = new GestureDetector();

        // Setup video elements if not provided
        this._setupVideoElements();

        // Listen for idle system events
        this.on('idle:start', () => this._pauseTracking());
        this.on('idle:end', () => this._resumeTracking());
    }

    async onStart() {
        if (!this.getConfig('enabled', true)) {
            this.log('Gesture input disabled by config');
            return;
        }

        this.log('Starting gesture input');

        try {
            // Initialize MediaPipe Hands
            await this._initMediaPipe();

            // Start camera
            await this._startCamera();

            // Start detection loop
            this._startDetectionLoop();

            this.setPluginState('enabled', true);
            this.emit('input:gesture:started', {});

        } catch (error) {
            this.error('Failed to start gesture input:', error);
            this.emit('system:error', {
                message: 'Failed to start camera/gesture detection',
                error
            });
        }
    }

    async onStop() {
        this.log('Stopping gesture input');

        // Stop detection loop
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }

        // Stop camera
        this._stopCamera();

        // Close MediaPipe
        if (this.hands) {
            await this.hands.close();
            this.hands = null;
        }

        this.handDetected = false;
        this.setPluginState('enabled', false);
        this.emit('input:gesture:stopped', {});
    }

    async onDestroy() {
        // Cleanup video elements
        if (this.videoElement) {
            this.videoElement.srcObject = null;
            this.videoElement = null;
        }

        this.canvasElement = null;
        this.canvasCtx = null;
        this.gestureDetector = null;
    }

    // ========================================
    // MediaPipe Setup
    // ========================================

    async _initMediaPipe() {
        // Check if MediaPipe is available
        if (typeof window.Hands === 'undefined') {
            throw new Error('MediaPipe Hands not loaded');
        }

        const mediapipeConfig = this.getConfig('mediapipe', {});

        this.hands = new window.Hands({
            locateFile: (file) => {
                return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
            }
        });

        this.hands.setOptions({
            selfieMode: true,
            maxNumHands: mediapipeConfig.max_num_hands || 1,
            modelComplexity: mediapipeConfig.model_complexity || 1,
            minDetectionConfidence: mediapipeConfig.min_detection_confidence || 0.7,
            minTrackingConfidence: mediapipeConfig.min_tracking_confidence || 0.5
        });

        this.hands.onResults((results) => this._onMediaPipeResults(results));

        this.log('MediaPipe initialized');
    }

    async _startCamera() {
        const cameraConfig = this.getConfig('camera', {});

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: cameraConfig.width || 640,
                    height: cameraConfig.height || 480,
                    facingMode: cameraConfig.facingMode || 'user',
                    frameRate: cameraConfig.frameRate || 30
                }
            });

            this.camera = new window.Camera(this.videoElement, {
                onFrame: async () => {
                    if (this.hands) {
                        await this.hands.send({ image: this.videoElement });
                    }
                },
                width: cameraConfig.width || 640,
                height: cameraConfig.height || 480
            });

            await this.camera.start();

            this.setState('system.cameraActive', true);
            this.log('Camera started');

        } catch (error) {
            throw new Error(`Failed to start camera: ${error.message}`);
        }
    }

    _stopCamera() {
        if (this.camera) {
            this.camera.stop();
            this.camera = null;
        }

        if (this.videoElement && this.videoElement.srcObject) {
            const tracks = this.videoElement.srcObject.getTracks();
            tracks.forEach(track => track.stop());
            this.videoElement.srcObject = null;
        }

        this.setState('system.cameraActive', false);
        this.log('Camera stopped');
    }

    // ========================================
    // Idle Integration
    // ========================================

    _pauseTracking() {
        this.log('Pausing tracking (idle mode)');
        
        // Stop MediaPipe processing by setting empty callback
        if (this.hands) {
            this.hands.onResults(() => {
                // No-op during idle - saves CPU
            });
        }

        // Stop animation frame loop
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }

        this.setPluginState('paused', true);
    }

    _resumeTracking() {
        this.log('Resuming tracking (active mode)');
        
        // Restore MediaPipe results callback
        if (this.hands) {
            this.hands.onResults((results) => this._onMediaPipeResults(results));
        }

        // Restart detection loop
        if (!this.animationFrameId) {
            this._startDetectionLoop();
        }

        this.setPluginState('paused', false);
    }

    // ========================================
    // Detection Loop
    // ========================================

    _startDetectionLoop() {
        const detect = () => {
            if (!this.isRunning) {
                return;
            }

            // Detection happens in MediaPipe callback
            // This is just for frame counting and performance

            this.animationFrameId = requestAnimationFrame(detect);
        };

        detect();
    }

    _onMediaPipeResults(results) {
        const now = performance.now();

        // Update canvas
        if (this.canvasCtx && this.canvasElement) {
            this._drawResults(results);
        }

        // Process hand landmarks
        if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
            const landmarks = results.multiHandLandmarks[0];

            // Emit hand detected event (once per detection)
            if (!this.handDetected) {
                this.handDetected = true;
                this.setState('system.handDetected', true);
                this.emit('input:gesture:hand_detected', { timestamp: now });
            }

            // Track hand position for swipes
            this._trackHandPosition(landmarks, now);

            // Detect gestures
            this._detectGestures(landmarks, now);

        } else {
            // No hand detected
            if (this.handDetected) {
                this.handDetected = false;
                this.setState('system.handDetected', false);
                this.emit('input:gesture:hand_lost', { timestamp: now });
            }

            // Reset swipe tracking
            this.swipeStartPosition = null;
            this.lastHandPosition = null;
        }
    }

    // ========================================
    // Gesture Detection
    // ========================================

    _trackHandPosition(landmarks, timestamp) {
        // Use wrist (landmark 0) for swipe detection
        const wrist = landmarks[0];
        const currentPosition = { x: wrist.x, y: wrist.y };

        // Start swipe tracking
        if (!this.swipeStartPosition) {
            this.swipeStartPosition = currentPosition;
            this.swipeStartTime = timestamp;
        }

        // Check for swipe completion
        if (this.swipeStartPosition) {
            const dx = currentPosition.x - this.swipeStartPosition.x;
            const dy = currentPosition.y - this.swipeStartPosition.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const duration = timestamp - this.swipeStartTime;

            const minDistance = this.getConfig('swipe.min_distance', 0.08);
            const maxTime = this.getConfig('swipe.max_time_ms', 800);
            const cooldown = this.getConfig('swipe.cooldown_ms', 300);

            if (distance >= minDistance && duration <= maxTime) {
                // Valid swipe - determine direction
                if (timestamp - this.lastSwipeTime >= cooldown) {
                    const direction = this._getSwipeDirection(dx, dy);
                    
                    this.emit(`input:gesture:swipe_${direction}`, {
                        distance,
                        duration,
                        velocity: distance / duration,
                        timestamp
                    });

                    this.setPluginState('lastGesture', `swipe_${direction}`);
                    this.setPluginState('lastGestureTime', timestamp);
                    this.lastSwipeTime = timestamp;
                }

                // Reset swipe
                this.swipeStartPosition = null;
            } else if (duration > maxTime) {
                // Timeout - reset
                this.swipeStartPosition = currentPosition;
                this.swipeStartTime = timestamp;
            }
        }

        this.lastHandPosition = currentPosition;
    }

    _detectGestures(landmarks, timestamp) {
        // Use existing GestureDetector
        
        // Pinch
        if (this.gestureDetector.detectPinch(landmarks, timestamp)) {
            this.emit('input:gesture:pinch', { timestamp, landmarks });
        }

        // Fist
        if (this.gestureDetector.detectFist(landmarks, timestamp)) {
            this.emit('input:gesture:fist', { timestamp, landmarks });
        }

        // Point (if method exists)
        if (typeof this.gestureDetector.detectPoint === 'function') {
            const pointing = this.gestureDetector.detectPoint(landmarks, timestamp);
            if (pointing) {
                this.emit('input:gesture:point', { timestamp, landmarks });
            }
        }

        // Open hand (if method exists)
        if (typeof this.gestureDetector.detectOpenHand === 'function') {
            const openHand = this.gestureDetector.detectOpenHand(landmarks, timestamp);
            if (openHand) {
                this.emit('input:gesture:open_hand', { timestamp, landmarks });
            }
        }
    }

    _getSwipeDirection(dx, dy) {
        const absDx = Math.abs(dx);
        const absDy = Math.abs(dy);

        if (absDx > absDy) {
            return dx > 0 ? 'right' : 'left';
        } else {
            return dy > 0 ? 'down' : 'up';
        }
    }

    // ========================================
    // Video Elements Setup
    // ========================================

    _setupVideoElements() {
        // Look for existing elements
        this.videoElement = document.getElementById('input-video');
        this.canvasElement = document.getElementById('output-canvas');

        // Create if not found
        if (!this.videoElement) {
            this.videoElement = document.createElement('video');
            this.videoElement.id = 'input-video';
            this.videoElement.style.display = 'none';
            document.body.appendChild(this.videoElement);
        }

        if (!this.canvasElement) {
            this.canvasElement = document.createElement('canvas');
            this.canvasElement.id = 'output-canvas';
            this.canvasElement.style.display = 'none';
            document.body.appendChild(this.canvasElement);
        }

        this.canvasCtx = this.canvasElement.getContext('2d');
    }

    _drawResults(results) {
        if (!this.canvasElement || !this.canvasCtx) {
            return;
        }

        this.canvasCtx.save();
        this.canvasCtx.clearRect(0, 0, this.canvasElement.width, this.canvasElement.height);

        // Draw landmarks if available
        if (results.multiHandLandmarks) {
            for (const landmarks of results.multiHandLandmarks) {
                window.drawConnectors(this.canvasCtx, landmarks, window.HAND_CONNECTIONS, {
                    color: '#00ff00',
                    lineWidth: 2
                });
                window.drawLandmarks(this.canvasCtx, landmarks, {
                    color: '#00ffff',
                    lineWidth: 1,
                    radius: 3
                });
            }
        }

        this.canvasCtx.restore();
    }
}

export default GestureInputPlugin;
