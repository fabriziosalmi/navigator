import { PredictiveTracker } from './PredictiveTracker.js';

/**
 * GridLockSystem - Sistema di aggancio a griglia per gesture fluide senza sfarfallii
 * Con intelligent direction control per distinguere intent da reset naturale
 * Con threshold separate per movimenti verticali e orizzontali
 * Con predictive tracking per anticipare i movimenti
 */
export class GridLockSystem {
    constructor(config = {}) {
        this.enabled = config.enabled !== undefined ? config.enabled : true;
        this.threshold = config.threshold || 0.12;
        this.thresholdVertical = config.thresholdVertical || config.threshold || 0.10;
        this.damping = config.damping || 0.85;
        this.snapSpeed = config.snapSpeed || 0.3;
        this.lockDuration = config.lockDuration || 400; // ms

        this.gestureAccumulator = { x: 0, y: 0 };
        this.isSnapping = false;
        this.previousHandPos = null;

        // Intelligent direction control
        this.lastIntentDirection = { x: 0, y: 0 }; // Ultima direzione intenzionale
        this.directionChangeDelay = config.directionChangeDelay || 800; // ms
        this.lastDirectionChangeTime = 0;
        this.velocityHistory = [];
        this.maxVelocityHistory = 5;
        this.minIntentVelocity = config.minIntentVelocity || 0.015;
        this.minIntentVelocityVertical = config.minIntentVelocityVertical || this.minIntentVelocity;

        // Predictive Tracking
        this.predictiveEnabled = config.predictiveEnabled !== undefined ? config.predictiveEnabled : true;
        this.predictor = new PredictiveTracker(config.predictiveConfig || {});

        // Cognitive state awareness
        this.cognitiveState = 'neutral';
        this.baseThreshold = this.threshold;
        this.baseThresholdVertical = this.thresholdVertical;
        this.baseLockDuration = this.lockDuration;
    }

    /**
     * Adapt parameters based on cognitive state
     */
    setCognitiveState(state) {
        if (state === this.cognitiveState) {
            return;
        }

        const oldState = this.cognitiveState;
        this.cognitiveState = state;

        // console.log(`[GridLock] Adapting for cognitive state: ${oldState} → ${state}`);

        switch (state) {
            case 'frustrated':
                // More forgiving - lower thresholds, longer cooldown
                this.threshold = this.baseThreshold * 0.7;
                this.thresholdVertical = this.baseThresholdVertical * 0.7;
                this.lockDuration = this.baseLockDuration * 1.5;
                this.directionChangeDelay = 500; // Allow faster direction changes
                // console.log('[GridLock] Frustrated mode: -30% threshold, +50% cooldown');
                break;

            case 'concentrated':
                // More responsive - lower thresholds, shorter cooldown
                this.threshold = this.baseThreshold * 0.8;
                this.thresholdVertical = this.baseThresholdVertical * 0.8;
                this.lockDuration = this.baseLockDuration * 0.7;
                this.directionChangeDelay = 600;
                // console.log('[GridLock] Concentrated mode: -20% threshold, -30% cooldown');
                break;

            case 'exploring':
                // Very permissive - much lower thresholds
                this.threshold = this.baseThreshold * 0.6;
                this.thresholdVertical = this.baseThresholdVertical * 0.6;
                this.lockDuration = this.baseLockDuration;
                this.directionChangeDelay = 400; // Very responsive
                // console.log('[GridLock] Exploring mode: -40% threshold, fast direction changes');
                break;

            case 'learning':
                // Normal but slightly forgiving
                this.threshold = this.baseThreshold * 0.9;
                this.thresholdVertical = this.baseThresholdVertical * 0.9;
                this.lockDuration = this.baseLockDuration * 1.1;
                this.directionChangeDelay = 700;
                // console.log('[GridLock] Learning mode: -10% threshold, +10% cooldown');
                break;

            default: // neutral
                // Reset to base values
                this.threshold = this.baseThreshold;
                this.thresholdVertical = this.baseThresholdVertical;
                this.lockDuration = this.baseLockDuration;
                this.directionChangeDelay = 800;
        }
    }

    reset() {
        this.gestureAccumulator = { x: 0, y: 0 };
        this.previousHandPos = null;
        this.isSnapping = false;
        this.velocityHistory = [];
        if (this.predictor) {
            this.predictor.reset();
        }
    }

    resetAccumulator() {
        this.gestureAccumulator = { x: 0, y: 0 };
    }

    processHandMovement(currentPos, timestamp = Date.now()) {
        if (!this.enabled || this.isSnapping) {
            this.previousHandPos = currentPos;
            if (this.predictor) {
                this.predictor.update(currentPos, timestamp);
            }
            return null;
        }

        if (!this.previousHandPos) {
            this.previousHandPos = currentPos;
            if (this.predictor) {
                this.predictor.update(currentPos, timestamp);
            }
            return null;
        }

        // Usa predictive tracking se abilitato
        let workingPos = currentPos;
        if (this.predictiveEnabled && this.predictor) {
            const prediction = this.predictor.getAdaptivePrediction(currentPos, timestamp);
            // Usa posizione predetta se confidence è alta
            if (prediction.confidence > 0.6) {
                workingPos = { x: prediction.x, y: prediction.y };
            }
        }

        // Calcola delta e velocità usando posizione predetta
        const deltaX = workingPos.x - this.previousHandPos.x;
        const deltaY = workingPos.y - this.previousHandPos.y;
        const velocity = { x: Math.abs(deltaX), y: Math.abs(deltaY) };

        // Aggiorna history velocità
        this.velocityHistory.push(velocity);
        if (this.velocityHistory.length > this.maxVelocityHistory) {
            this.velocityHistory.shift();
        }

        // Calcola velocità media
        const avgVelocity = this.getAverageVelocity();

        // Intelligent direction control
        const isIntentionalMovement = this.isIntentionalMovement(deltaX, deltaY, avgVelocity);
        
        if (!isIntentionalMovement) {
            // Movimento lento/ritorno naturale - ignora o damping forte
            this.gestureAccumulator.x *= 0.5; // Heavy damping
            this.gestureAccumulator.y *= 0.5;
            this.previousHandPos = currentPos;
            return null;
        }

        // Controlla cambio direzione
        const currentDirection = { 
            x: deltaX > 0 ? 1 : -1, 
            y: deltaY > 0 ? 1 : -1 
        };

        const now = Date.now();
        const timeSinceLastChange = now - this.lastDirectionChangeTime;

        // Se la direzione è opposta all'intent recente, richiedi delay
        if (this.lastIntentDirection.x !== 0) {
            if (currentDirection.x !== this.lastIntentDirection.x && 
                timeSinceLastChange < this.directionChangeDelay) {
                // Troppo presto per cambiare direzione - ignora
                this.previousHandPos = currentPos;
                return null;
            }
        }

        if (this.lastIntentDirection.y !== 0) {
            if (currentDirection.y !== this.lastIntentDirection.y && 
                timeSinceLastChange < this.directionChangeDelay) {
                // Troppo presto per cambiare direzione - ignora
                this.previousHandPos = currentPos;
                return null;
            }
        }

        // Accumula con damping
        this.gestureAccumulator.x += deltaX;
        this.gestureAccumulator.y += deltaY;
        this.gestureAccumulator.x *= this.damping;
        this.gestureAccumulator.y *= this.damping;

        // Salva posizione predetta come riferimento
        this.previousHandPos = workingPos;

        // Determina direzione
        const absX = Math.abs(this.gestureAccumulator.x);
        const absY = Math.abs(this.gestureAccumulator.y);

        let gesture = null;

        // Movimento orizzontale (navigazione card) - usa threshold standard
        if (absX > this.threshold && absX > absY) {
            const direction = this.gestureAccumulator.x > 0 ? 1 : -1;
            gesture = {
                type: 'horizontal',
                direction: direction,
                intensity: absX
            };
            this.lastIntentDirection = { x: direction, y: 0 };
            this.lastDirectionChangeTime = now;
            this.lockSnap();
        }
        // Movimento verticale (navigazione layer) - usa thresholdVertical ridotta
        else if (absY > this.thresholdVertical && absY > absX) {
            const direction = this.gestureAccumulator.y > 0 ? 1 : -1;
            gesture = {
                type: 'vertical',
                direction: direction,
                intensity: absY
            };
            this.lastIntentDirection = { x: 0, y: direction };
            this.lastDirectionChangeTime = now;
            this.lockSnap();
        }

        return gesture;
    }

    isIntentionalMovement(deltaX, deltaY, avgVelocity) {
        // Movimento è intenzionale se:
        // 1. Velocità supera soglia minima (differenziata per vertical/horizontal)
        // 2. Movimento è consistente (non jitter)

        const absX = Math.abs(deltaX);
        const absY = Math.abs(deltaY);

        // Determina threshold velocità in base alla direzione prevalente
        const isVerticalMovement = absY > absX;
        const velocityThreshold = isVerticalMovement ? this.minIntentVelocityVertical : this.minIntentVelocity;

        const velocity = Math.max(absX, absY);

        // Check velocità minima
        if (velocity < velocityThreshold) {
            return false;
        }

        // Check consistenza velocità (con threshold appropriata)
        const avgThresholdX = this.minIntentVelocity * 0.7;
        const avgThresholdY = this.minIntentVelocityVertical * 0.7;

        if (avgVelocity.x < avgThresholdX && avgVelocity.y < avgThresholdY) {
            return false;
        }

        return true;
    }

    getAverageVelocity() {
        if (this.velocityHistory.length === 0) {
            return { x: 0, y: 0 };
        }

        const sum = this.velocityHistory.reduce((acc, v) => ({
            x: acc.x + v.x,
            y: acc.y + v.y
        }), { x: 0, y: 0 });

        return {
            x: sum.x / this.velocityHistory.length,
            y: sum.y / this.velocityHistory.length
        };
    }

    lockSnap() {
        this.isSnapping = true;
        this.resetAccumulator();
        
        setTimeout(() => {
            this.isSnapping = false;
        }, this.lockDuration);
    }

    getAccumulator() {
        return { ...this.gestureAccumulator };
    }

    getLastIntent() {
        return { ...this.lastIntentDirection };
    }

    isLocked() {
        return this.isSnapping;
    }

    setEnabled(enabled) {
        this.enabled = enabled;
        if (!enabled) {
            this.reset();
        }
    }

    /**
     * Ottieni info debug sul predictive tracker
     */
    getPredictiveDebugInfo() {
        if (!this.predictor) {
            return null;
        }
        return this.predictor.getDebugInfo();
    }

    /**
     * Abilita/disabilita predictive tracking
     */
    setPredictiveEnabled(enabled) {
        this.predictiveEnabled = enabled;
        if (!enabled && this.predictor) {
            this.predictor.reset();
        }
    }
}
