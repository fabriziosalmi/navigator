/**
 * PredictiveTracker Module
 * Sistema di tracking predittivo che anticipa i movimenti dell'utente
 * basato su analisi di velocità e accelerazione
 */

export class PredictiveTracker {
    constructor(config = {}) {
        // Configurazione
        this.historySize = config.historySize || 10;
        this.predictionTime = config.predictionTime || 50; // ms nel futuro
        this.smoothingFactor = config.smoothingFactor || 0.3;
        this.minVelocityThreshold = config.minVelocityThreshold || 0.001;

        // State
        this.positionHistory = [];
        this.velocityHistory = [];
        this.accelerationHistory = [];
        this.lastTimestamp = null;
        this.predictedPosition = null;
        this.smoothedPosition = null;
    }

    /**
     * Aggiorna il tracker con nuova posizione
     * @param {Object} position - { x, y } posizione corrente
     * @param {number} timestamp - timestamp corrente in ms
     * @returns {Object} posizione predetta { x, y, velocity, acceleration, confidence }
     */
    update(position, timestamp = Date.now()) {
        // Prima posizione - inizializza
        if (this.positionHistory.length === 0) {
            this.positionHistory.push({ ...position, time: timestamp });
            this.lastTimestamp = timestamp;
            this.smoothedPosition = { ...position };
            return {
                x: position.x,
                y: position.y,
                velocity: { x: 0, y: 0 },
                acceleration: { x: 0, y: 0 },
                confidence: 0
            };
        }

        // Calcola delta time
        const deltaTime = (timestamp - this.lastTimestamp) / 1000; // secondi
        if (deltaTime <= 0) {
            return this.predictedPosition || { ...position, velocity: { x: 0, y: 0 }, acceleration: { x: 0, y: 0 }, confidence: 0 };
        }

        // Aggiungi posizione allo storico
        this.positionHistory.push({ ...position, time: timestamp });
        if (this.positionHistory.length > this.historySize) {
            this.positionHistory.shift();
        }

        // Calcola velocità
        const velocity = this.calculateVelocity(deltaTime);
        this.velocityHistory.push(velocity);
        if (this.velocityHistory.length > this.historySize) {
            this.velocityHistory.shift();
        }

        // Calcola accelerazione
        const acceleration = this.calculateAcceleration(deltaTime);
        this.accelerationHistory.push(acceleration);
        if (this.accelerationHistory.length > this.historySize) {
            this.accelerationHistory.shift();
        }

        // Calcola velocità e accelerazione medie (smoothed)
        const avgVelocity = this.getAverageVelocity();
        const avgAcceleration = this.getAverageAcceleration();

        // Predizione della posizione futura
        const predictionDelta = this.predictionTime / 1000; // secondi
        const predicted = this.predictPosition(position, avgVelocity, avgAcceleration, predictionDelta);

        // Calcola confidence basato su consistenza del movimento
        const confidence = this.calculateConfidence();

        // Applica smoothing alla posizione predetta
        this.smoothedPosition = this.applySmoothing(predicted, this.smoothedPosition);

        // Salva stato
        this.lastTimestamp = timestamp;
        this.predictedPosition = {
            x: this.smoothedPosition.x,
            y: this.smoothedPosition.y,
            velocity: avgVelocity,
            acceleration: avgAcceleration,
            confidence: confidence,
            rawPosition: { ...position }
        };

        return this.predictedPosition;
    }

    /**
     * Calcola velocità istantanea
     */
    calculateVelocity(deltaTime) {
        if (this.positionHistory.length < 2) {
            return { x: 0, y: 0 };
        }

        const current = this.positionHistory[this.positionHistory.length - 1];
        const previous = this.positionHistory[this.positionHistory.length - 2];

        const vx = (current.x - previous.x) / deltaTime;
        const vy = (current.y - previous.y) / deltaTime;

        return { x: vx, y: vy };
    }

    /**
     * Calcola accelerazione istantanea
     */
    calculateAcceleration(deltaTime) {
        if (this.velocityHistory.length < 2) {
            return { x: 0, y: 0 };
        }

        const currentV = this.velocityHistory[this.velocityHistory.length - 1];
        const previousV = this.velocityHistory[this.velocityHistory.length - 2];

        const ax = (currentV.x - previousV.x) / deltaTime;
        const ay = (currentV.y - previousV.y) / deltaTime;

        return { x: ax, y: ay };
    }

    /**
     * Calcola velocità media (smoothed)
     */
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

    /**
     * Calcola accelerazione media (smoothed)
     */
    getAverageAcceleration() {
        if (this.accelerationHistory.length === 0) {
            return { x: 0, y: 0 };
        }

        const sum = this.accelerationHistory.reduce((acc, a) => ({
            x: acc.x + a.x,
            y: acc.y + a.y
        }), { x: 0, y: 0 });

        return {
            x: sum.x / this.accelerationHistory.length,
            y: sum.y / this.accelerationHistory.length
        };
    }

    /**
     * Predice posizione futura usando fisica
     * Formula: p_future = p_current + v * dt + 0.5 * a * dt^2
     */
    predictPosition(currentPos, velocity, acceleration, deltaTime) {
        // Se velocità è troppo bassa, non predire (evita jitter)
        const velocityMagnitude = Math.sqrt(velocity.x ** 2 + velocity.y ** 2);
        if (velocityMagnitude < this.minVelocityThreshold) {
            return { ...currentPos };
        }

        const x = currentPos.x +
                  velocity.x * deltaTime +
                  0.5 * acceleration.x * deltaTime ** 2;

        const y = currentPos.y +
                  velocity.y * deltaTime +
                  0.5 * acceleration.y * deltaTime ** 2;

        return { x, y };
    }

    /**
     * Applica exponential smoothing per ridurre jitter
     */
    applySmoothing(targetPos, currentPos) {
        if (!currentPos) {
            return { ...targetPos };
        }

        const x = currentPos.x + (targetPos.x - currentPos.x) * this.smoothingFactor;
        const y = currentPos.y + (targetPos.y - currentPos.y) * this.smoothingFactor;

        return { x, y };
    }

    /**
     * Calcola confidence della predizione basato su consistenza movimento
     * Ritorna valore 0-1 (1 = alta confidenza)
     */
    calculateConfidence() {
        if (this.velocityHistory.length < 3) {
            return 0.5;
        }

        // Calcola varianza della velocità (bassa varianza = movimento consistente)
        const avgVel = this.getAverageVelocity();
        const variance = this.velocityHistory.reduce((acc, v) => {
            const dx = v.x - avgVel.x;
            const dy = v.y - avgVel.y;
            return acc + (dx ** 2 + dy ** 2);
        }, 0) / this.velocityHistory.length;

        // Converti varianza in confidence (0-1)
        // Varianza bassa = alta confidence
        const maxVariance = 0.1; // threshold
        const confidence = Math.max(0, Math.min(1, 1 - (variance / maxVariance)));

        return confidence;
    }

    /**
     * Ottieni predizione con adaptive prediction time basato su velocità
     */
    getAdaptivePrediction(position, timestamp = Date.now()) {
        const result = this.update(position, timestamp);

        // Adatta prediction time basato su velocità
        const velocityMagnitude = Math.sqrt(
            result.velocity.x ** 2 + result.velocity.y ** 2
        );

        // Più veloce = predici più avanti
        const adaptivePredictionTime = Math.min(
            100, // max 100ms
            this.predictionTime * (1 + velocityMagnitude * 2)
        );

        // Ricalcola con prediction time adattivo
        if (velocityMagnitude > this.minVelocityThreshold) {
            const predictionDelta = adaptivePredictionTime / 1000;
            const adaptivePos = this.predictPosition(
                position,
                result.velocity,
                result.acceleration,
                predictionDelta
            );

            return {
                ...result,
                x: adaptivePos.x,
                y: adaptivePos.y,
                adaptivePredictionTime: adaptivePredictionTime
            };
        }

        return result;
    }

    /**
     * Reset tracker
     */
    reset() {
        this.positionHistory = [];
        this.velocityHistory = [];
        this.accelerationHistory = [];
        this.lastTimestamp = null;
        this.predictedPosition = null;
        this.smoothedPosition = null;
    }

    /**
     * Ottieni stato debug
     */
    getDebugInfo() {
        return {
            historySize: this.positionHistory.length,
            currentVelocity: this.velocityHistory[this.velocityHistory.length - 1] || { x: 0, y: 0 },
            currentAcceleration: this.accelerationHistory[this.accelerationHistory.length - 1] || { x: 0, y: 0 },
            avgVelocity: this.getAverageVelocity(),
            avgAcceleration: this.getAverageAcceleration(),
            confidence: this.calculateConfidence(),
            predictedPosition: this.predictedPosition
        };
    }
}

export default PredictiveTracker;
