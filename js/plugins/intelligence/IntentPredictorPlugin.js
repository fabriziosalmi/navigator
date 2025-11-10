/**
 * IntentPredictorPlugin.js
 * 
 * Predictive intent system based on gesture signatures.
 * Analyzes partial gestures to predict user intentions before completion.
 * 
 * Features:
 * - Real-time gesture trajectory analysis
 * - Signature matching with confidence scoring
 * - Pre-rendering of likely targets
 * - Adaptive thresholds based on cognitive state
 * 
 * Emits: intent:prediction with probabilities for each action
 */

import { BasePlugin } from '../core/BasePlugin.js';

export class IntentPredictorPlugin extends BasePlugin {
    constructor(config = {}) {
        super('IntentPredictor', {
            enabled: true,
            
            // Prediction confidence thresholds
            min_confidence_to_predict: 0.70,    // 70% minimum
            stable_confidence_threshold: 0.95,  // 95% = very stable
            pre_render_threshold: 0.85,         // 85% = pre-render target
            
            // Trajectory sampling
            sample_rate_ms: 50,                 // Sample every 50ms
            min_samples_for_prediction: 3,      // Need 3+ samples
            
            // Signature parameters
            velocity_weight: 0.4,               // Importance of speed
            direction_weight: 0.4,              // Importance of direction
            acceleration_weight: 0.2,           // Importance of acceleration
            
            // Adaptive adjustments per cognitive state
            adaptive_thresholds: {
                frustrated: {
                    min_confidence: 0.60,       // Lower threshold when frustrated
                    early_prediction_bonus: 0.1
                },
                concentrated: {
                    min_confidence: 0.75,       // Higher threshold when concentrated
                    velocity_weight: 0.5        // Weight speed more
                },
                exploring: {
                    min_confidence: 0.50,       // Very permissive when exploring
                    stable_threshold: 0.90      // Lower stable threshold
                }
            },
            
            ...config
        });

        // Gesture signature database
        this.signatures = this._buildSignatureDatabase();
        
        // Current tracking state
        this.tracking = {
            isTracking: false,
            startTime: 0,
            startPos: null,
            samples: [],
            lastPrediction: null,
            lastEmitTime: 0
        };

        // Cognitive state awareness
        this.cognitiveState = 'neutral';
    }

    async onInit() {
        this.log('Initializing intent predictor');

        // Listen to hand tracking
        this.on('input:hand:detected', (data) => this._onHandDetected(data));
        this.on('input:hand:move', (data) => this._onHandMove(data));
        this.on('input:hand:lost', () => this._onHandLost());

        // Listen to cognitive state changes
        this.on('cognitive_state:change', (data) => {
            this.cognitiveState = data.to;
            this.log(`Adaptive thresholds for state: ${data.to}`);
        });
    }

    async onStart() {
        this.log('Intent predictor active');
    }

    // ========================================
    // Gesture Signature Database
    // ========================================

    _buildSignatureDatabase() {
        return {
            swipe_left: {
                direction: { x: -1, y: 0 },
                velocity_range: [0.3, 2.0],
                acceleration_pattern: 'accelerating',
                typical_duration_ms: 400
            },
            swipe_right: {
                direction: { x: 1, y: 0 },
                velocity_range: [0.3, 2.0],
                acceleration_pattern: 'accelerating',
                typical_duration_ms: 400
            },
            swipe_up: {
                direction: { x: 0, y: -1 },
                velocity_range: [0.3, 2.0],
                acceleration_pattern: 'accelerating',
                typical_duration_ms: 450
            },
            swipe_down: {
                direction: { x: 0, y: 1 },
                velocity_range: [0.3, 2.0],
                acceleration_pattern: 'accelerating',
                typical_duration_ms: 450
            },
            point: {
                direction: { x: 0, y: 0 },
                velocity_range: [0, 0.05],
                acceleration_pattern: 'stable',
                typical_duration_ms: 2000
            },
            pinch: {
                direction: { x: 0, y: 0 },
                velocity_range: [0, 0.1],
                acceleration_pattern: 'decelerating',
                typical_duration_ms: 600
            }
        };
    }

    // ========================================
    // Hand Tracking Events
    // ========================================

    _onHandDetected(data) {
        this.tracking.isTracking = true;
        this.tracking.startTime = performance.now();
        this.tracking.startPos = { x: data.x, y: data.y };
        this.tracking.samples = [{
            pos: { x: data.x, y: data.y },
            timestamp: performance.now(),
            velocity: { x: 0, y: 0 }
        }];
        this.tracking.lastPrediction = null;
    }

    _onHandMove(data) {
        if (!this.tracking.isTracking) {
            return;
        }

        const now = performance.now();
        const lastSample = this.tracking.samples[this.tracking.samples.length - 1];
        
        // Sample rate limiting
        if (now - lastSample.timestamp < this.getConfig('sample_rate_ms')) {
            return;
        }

        // Calculate velocity
        const dt = (now - lastSample.timestamp) / 1000; // seconds
        const dx = data.x - lastSample.pos.x;
        const dy = data.y - lastSample.pos.y;
        const velocity = {
            x: dx / dt,
            y: dy / dt
        };

        // Add sample
        this.tracking.samples.push({
            pos: { x: data.x, y: data.y },
            timestamp: now,
            velocity: velocity
        });

        // Limit sample buffer
        if (this.tracking.samples.length > 20) {
            this.tracking.samples.shift();
        }

        // Attempt prediction
        this._predictIntent();
    }

    _onHandLost() {
        this.tracking.isTracking = false;
        this.tracking.samples = [];
        this.tracking.lastPrediction = null;
    }

    // ========================================
    // Intent Prediction
    // ========================================

    _predictIntent() {
        const minSamples = this.getConfig('min_samples_for_prediction');
        
        if (this.tracking.samples.length < minSamples) {
            return;
        }

        // Extract trajectory features
        const features = this._extractFeatures();

        // Match against all signatures
        const predictions = {};
        for (const [gestureType, signature] of Object.entries(this.signatures)) {
            predictions[gestureType] = this._matchSignature(features, signature);
        }

        // Normalize to probabilities (sum = 1.0)
        const total = Object.values(predictions).reduce((sum, p) => sum + p, 0);
        const probabilities = {};
        for (const [gestureType, score] of Object.entries(predictions)) {
            probabilities[gestureType] = total > 0 ? score / total : 0;
        }

        // Apply cognitive state adjustments
        this._applyCognitiveAdjustments(probabilities, features);

        // Find best prediction
        const sorted = Object.entries(probabilities)
            .sort((a, b) => b[1] - a[1]);
        
        const bestGesture = sorted[0][0];
        const bestConfidence = sorted[0][1];

        // Emit prediction if confident enough
        const minConfidence = this._getAdaptiveThreshold('min_confidence');
        if (bestConfidence >= minConfidence) {
            this._emitPrediction(bestGesture, bestConfidence, probabilities);
        }
    }

    _extractFeatures() {
        const samples = this.tracking.samples;
        const first = samples[0];
        const last = samples[samples.length - 1];

        // Overall displacement
        const displacement = {
            x: last.pos.x - first.pos.x,
            y: last.pos.y - first.pos.y
        };
        const distance = Math.sqrt(displacement.x ** 2 + displacement.y ** 2);

        // Average velocity
        const velocities = samples.slice(1).map(s => s.velocity);
        const avgVelocity = {
            x: velocities.reduce((sum, v) => sum + v.x, 0) / velocities.length,
            y: velocities.reduce((sum, v) => sum + v.y, 0) / velocities.length
        };
        const speed = Math.sqrt(avgVelocity.x ** 2 + avgVelocity.y ** 2);

        // Direction (normalized)
        const direction = distance > 0 ? {
            x: displacement.x / distance,
            y: displacement.y / distance
        } : { x: 0, y: 0 };

        // Acceleration pattern
        const accelerationPattern = this._detectAccelerationPattern(velocities);

        // Duration so far
        const duration = last.timestamp - first.timestamp;

        return {
            displacement,
            distance,
            direction,
            avgVelocity,
            speed,
            accelerationPattern,
            duration
        };
    }

    _detectAccelerationPattern(velocities) {
        if (velocities.length < 3) {
            return 'stable';
        }

        // Calculate speeds
        const speeds = velocities.map(v => Math.sqrt(v.x ** 2 + v.y ** 2));
        
        // Check trend
        let increasing = 0;
        let decreasing = 0;
        for (let i = 1; i < speeds.length; i++) {
            if (speeds[i] > speeds[i - 1]) increasing++;
            if (speeds[i] < speeds[i - 1]) decreasing++;
        }

        if (increasing > decreasing * 1.5) return 'accelerating';
        if (decreasing > increasing * 1.5) return 'decelerating';
        return 'stable';
    }

    _matchSignature(features, signature) {
        let score = 0;

        // Direction similarity
        const directionSimilarity = this._cosineSimilarity(
            features.direction,
            signature.direction
        );
        score += directionSimilarity * this.getConfig('direction_weight');

        // Velocity range match
        const velocityMatch = this._rangeMatch(
            features.speed,
            signature.velocity_range
        );
        score += velocityMatch * this.getConfig('velocity_weight');

        // Acceleration pattern match
        const accelMatch = features.accelerationPattern === signature.acceleration_pattern ? 1.0 : 0.3;
        score += accelMatch * this.getConfig('acceleration_weight');

        return Math.max(0, Math.min(1, score));
    }

    _cosineSimilarity(a, b) {
        const dot = a.x * b.x + a.y * b.y;
        const magA = Math.sqrt(a.x ** 2 + a.y ** 2);
        const magB = Math.sqrt(b.x ** 2 + b.y ** 2);
        
        if (magA === 0 || magB === 0) return 0;
        
        // Convert -1..1 to 0..1
        return (dot / (magA * magB) + 1) / 2;
    }

    _rangeMatch(value, [min, max]) {
        if (value < min) {
            return Math.max(0, 1 - (min - value) / min);
        }
        if (value > max) {
            return Math.max(0, 1 - (value - max) / max);
        }
        return 1.0;
    }

    // ========================================
    // Cognitive State Adaptation
    // ========================================

    _applyCognitiveAdjustments(probabilities, features) {
        const state = this.cognitiveState;

        if (state === 'frustrated') {
            // Boost early predictions
            const timeFactor = Math.min(features.duration / 300, 1.0);
            const earlyBonus = this._getAdaptiveConfig('early_prediction_bonus', 0);
            const bestKey = Object.keys(probabilities).reduce((a, b) => 
                probabilities[a] > probabilities[b] ? a : b
            );
            probabilities[bestKey] += earlyBonus * (1 - timeFactor);
        }

        // Normalize again
        const total = Object.values(probabilities).reduce((sum, p) => sum + p, 0);
        for (const key of Object.keys(probabilities)) {
            probabilities[key] = total > 0 ? probabilities[key] / total : 0;
        }
    }

    _getAdaptiveThreshold(key) {
        const baseValue = this.getConfig(key);
        const stateConfig = this.getConfig('adaptive_thresholds')[this.cognitiveState];
        
        if (stateConfig && key in stateConfig) {
            return stateConfig[key];
        }
        
        return baseValue;
    }

    _getAdaptiveConfig(key, defaultValue) {
        const stateConfig = this.getConfig('adaptive_thresholds')[this.cognitiveState];
        return stateConfig?.[key] ?? defaultValue;
    }

    // ========================================
    // Prediction Emission
    // ========================================

    _emitPrediction(gesture, confidence, probabilities) {
        const now = performance.now();

        // Rate limit emissions (every 100ms)
        if (now - this.tracking.lastEmitTime < 100) {
            return;
        }

        this.tracking.lastEmitTime = now;
        this.tracking.lastPrediction = { gesture, confidence };

        // Emit general prediction event
        this.emit('intent:prediction', {
            gesture: gesture,
            confidence: confidence,
            probabilities: probabilities,
            timestamp: now
        });

        // Emit specific gesture prediction
        this.emit(`intent:predict:${gesture}`, {
            confidence: confidence,
            timestamp: now
        });

        // Check if stable enough for pre-rendering
        const stableThreshold = this._getAdaptiveThreshold('stable_confidence_threshold');
        if (confidence >= stableThreshold) {
            this.emit('intent:stable', {
                gesture: gesture,
                confidence: confidence,
                timestamp: now
            });

            this.log(`🎯 Stable prediction: ${gesture} (${(confidence * 100).toFixed(1)}%)`);
        }

        // Check if should pre-render
        const preRenderThreshold = this.getConfig('pre_render_threshold');
        if (confidence >= preRenderThreshold) {
            this.emit('intent:pre_render', {
                gesture: gesture,
                confidence: confidence,
                timestamp: now
            });
        }
    }

    // ========================================
    // Public API
    // ========================================

    getCurrentPrediction() {
        return this.tracking.lastPrediction;
    }

    getTrackingState() {
        return {
            isTracking: this.tracking.isTracking,
            sampleCount: this.tracking.samples.length,
            duration: this.tracking.isTracking 
                ? performance.now() - this.tracking.startTime 
                : 0,
            lastPrediction: this.tracking.lastPrediction
        };
    }

    /**
     * Manually trigger prediction (for testing)
     */
    forcePrediction() {
        if (this.tracking.samples.length >= 3) {
            this._predictIntent();
        }
    }
}

export default IntentPredictorPlugin;
