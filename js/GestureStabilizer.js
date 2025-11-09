/**
 * GestureStabilizer Module
 * Sistema di soppressione intelligente dei glitch per gesti affidabili
 * Mantiene i gesti attivi anche quando MediaPipe perde traccia per qualche frame
 */

export class GestureStabilizer {
    constructor(config = {}) {
        // Configurazione
        this.minStabilityThreshold = config.minStabilityThreshold || 0.95; // 95%
        this.maxStabilityThreshold = config.maxStabilityThreshold || 0.99; // 99%
        this.historySize = config.historySize || 20; // Frame da analizzare
        this.maxGlitchFrames = config.maxGlitchFrames || 3; // Max frame consecutivi di glitch tollerati
        this.adaptiveMode = config.adaptiveMode !== undefined ? config.adaptiveMode : true;

        // State tracking per ogni gesto
        this.gestures = {
            pinch: this.createGestureState(),
            fist: this.createGestureState(),
            thumbsUp: this.createGestureState(),
            open: this.createGestureState()
        };
    }

    /**
     * Crea stato iniziale per un gesto
     */
    createGestureState() {
        return {
            history: [],              // Storia di detection (true/false)
            currentStreak: 0,         // Frame consecutivi di detection
            glitchFrames: 0,          // Frame consecutivi di perdita traccia
            stability: 0,             // Stability score (0-1)
            isStabilized: false,      // Se il gesto è considerato stabile
            lastDetectedTime: 0,      // Ultimo timestamp di detection
            totalFrames: 0,           // Frame totali processati
            successFrames: 0          // Frame con detection positiva
        };
    }

    /**
     * Aggiorna stato di un gesto e determina se è affidabile
     * @param {string} gestureName - Nome del gesto (pinch, fist, thumbsUp, open)
     * @param {boolean} detected - Se il gesto è stato rilevato nel frame corrente
     * @param {number} timestamp - Timestamp corrente
     * @returns {boolean} - True se il gesto deve essere considerato attivo
     */
    updateGesture(gestureName, detected, timestamp = Date.now()) {
        const state = this.gestures[gestureName];
        if (!state) return detected;

        // Aggiorna storia
        state.history.push(detected);
        if (state.history.length > this.historySize) {
            state.history.shift();
        }

        state.totalFrames++;
        if (detected) {
            state.successFrames++;
            state.currentStreak++;
            state.glitchFrames = 0;
            state.lastDetectedTime = timestamp;
        } else {
            state.currentStreak = 0;
            state.glitchFrames++;
        }

        // Calcola stability score
        state.stability = this.calculateStability(state);

        // Determina se il gesto è stabilizzato
        state.isStabilized = state.stability >= this.minStabilityThreshold;

        // Intelligent glitch suppression
        if (!detected && state.isStabilized) {
            // Il gesto non è rilevato MA è stato stabile

            // Calcola tolleranza glitch basata su stability (adattivo)
            const maxGlitchTolerance = this.calculateGlitchTolerance(state.stability);

            // Se siamo entro la tolleranza, considera il gesto ancora attivo
            if (state.glitchFrames <= maxGlitchTolerance) {
                // Glitch suppression attiva - mantieni gesto
                return true;
            } else {
                // Troppi frame persi - gesto realmente terminato
                state.isStabilized = false;
                return false;
            }
        }

        return detected;
    }

    /**
     * Calcola stability score basato sulla storia
     * @returns {number} - Stability score (0-1)
     */
    calculateStability(state) {
        if (state.history.length < 5) {
            return 0; // Non abbastanza dati
        }

        // Metodo 1: Percentuale di successo nella storia recente
        const successRate = state.history.filter(d => d).length / state.history.length;

        // Metodo 2: Consistenza (penalizza alternanze rapide)
        let consistency = 1.0;
        for (let i = 1; i < state.history.length; i++) {
            if (state.history[i] !== state.history[i - 1]) {
                consistency -= 0.05; // Penalità per ogni cambio
            }
        }
        consistency = Math.max(0, consistency);

        // Metodo 3: Recent streak bonus
        const recentBonus = state.currentStreak > 5 ? 0.1 : 0;

        // Combina metriche
        const stability = (successRate * 0.6 + consistency * 0.3 + recentBonus);

        return Math.max(0, Math.min(1, stability));
    }

    /**
     * Calcola tolleranza glitch adattiva basata su stability
     * Più il gesto è stabile, più frame di glitch tolleriamo
     */
    calculateGlitchTolerance(stability) {
        if (!this.adaptiveMode) {
            return this.maxGlitchFrames;
        }

        // Mapping adattivo:
        // Stability 95% → 2 frames tollerati
        // Stability 97% → 3 frames tollerati
        // Stability 99% → 4 frames tollerati

        if (stability >= this.maxStabilityThreshold) {
            // Super stabile - tolleranza massima
            return this.maxGlitchFrames + 1;
        } else if (stability >= 0.97) {
            // Molto stabile
            return this.maxGlitchFrames;
        } else if (stability >= this.minStabilityThreshold) {
            // Stabile
            return Math.max(2, this.maxGlitchFrames - 1);
        } else {
            // Instabile - nessuna tolleranza
            return 0;
        }
    }

    /**
     * Ottieni stato debug di un gesto
     */
    getGestureDebugInfo(gestureName) {
        const state = this.gestures[gestureName];
        if (!state) return null;

        return {
            stability: (state.stability * 100).toFixed(1) + '%',
            isStabilized: state.isStabilized,
            currentStreak: state.currentStreak,
            glitchFrames: state.glitchFrames,
            glitchTolerance: this.calculateGlitchTolerance(state.stability),
            successRate: state.totalFrames > 0
                ? ((state.successFrames / state.totalFrames) * 100).toFixed(1) + '%'
                : '0%'
        };
    }

    /**
     * Ottieni info debug di tutti i gesti
     */
    getAllDebugInfo() {
        return {
            pinch: this.getGestureDebugInfo('pinch'),
            fist: this.getGestureDebugInfo('fist'),
            thumbsUp: this.getGestureDebugInfo('thumbsUp'),
            open: this.getGestureDebugInfo('open')
        };
    }

    /**
     * Reset stato di un gesto specifico
     */
    resetGesture(gestureName) {
        if (this.gestures[gestureName]) {
            this.gestures[gestureName] = this.createGestureState();
        }
    }

    /**
     * Reset tutti i gesti
     */
    resetAll() {
        Object.keys(this.gestures).forEach(name => {
            this.resetGesture(name);
        });
    }

    /**
     * Ottieni stability score di un gesto
     */
    getStability(gestureName) {
        return this.gestures[gestureName]?.stability || 0;
    }

    /**
     * Verifica se un gesto è stabilizzato
     */
    isStabilized(gestureName) {
        return this.gestures[gestureName]?.isStabilized || false;
    }

    /**
     * Force stabilization per un gesto (per debug/testing)
     */
    forceStabilize(gestureName, stabilized = true) {
        if (this.gestures[gestureName]) {
            this.gestures[gestureName].isStabilized = stabilized;
            if (stabilized) {
                this.gestures[gestureName].stability = 1.0;
            }
        }
    }

    /**
     * Aggiorna configurazione runtime
     */
    updateConfig(config) {
        if (config.minStabilityThreshold !== undefined) {
            this.minStabilityThreshold = config.minStabilityThreshold;
        }
        if (config.maxStabilityThreshold !== undefined) {
            this.maxStabilityThreshold = config.maxStabilityThreshold;
        }
        if (config.maxGlitchFrames !== undefined) {
            this.maxGlitchFrames = config.maxGlitchFrames;
        }
        if (config.adaptiveMode !== undefined) {
            this.adaptiveMode = config.adaptiveMode;
        }
    }

    /**
     * Ottieni statistiche aggregate
     */
    getStats() {
        const stats = {};
        Object.keys(this.gestures).forEach(name => {
            const state = this.gestures[name];
            stats[name] = {
                totalFrames: state.totalFrames,
                successFrames: state.successFrames,
                stability: state.stability,
                isStabilized: state.isStabilized,
                successRate: state.totalFrames > 0
                    ? state.successFrames / state.totalFrames
                    : 0
            };
        });
        return stats;
    }
}

export default GestureStabilizer;
