/**
 * GestureDetector Module
 * Contiene tutte le funzioni di rilevamento gesture
 * Con intelligent glitch suppression per gesti affidabili
 */

import CONFIG from './config.js';
import { GestureStabilizer } from './GestureStabilizer.js';

export class GestureDetector {
    constructor() {
        // Gesture state tracking
        this.thumbsUpStartTime = null;
        this.lastConfirmTime = 0;
        this.indexShakes = [];
        this.lastIndexX = null;
        this.lastDirection = null;

        // Kamehameha Focus mode
        this.pointStartTime = null;
        this.pointTarget = null;
        this.focusModeActive = false;

        // Singularity mode
        this.fistStartTime = null;
        this.singularityActive = false;
        this.singularityCollapsed = false;

        // Gesture stabilizer (glitch suppression)
        this.stabilizer = new GestureStabilizer(CONFIG.gestureStabilization);
        this.stabilizationEnabled = CONFIG.gestureStabilization.enabled;
    }

    /**
     * Detect pinch gesture (thumb and index finger close together)
     * Con glitch suppression
     */
    detectPinch(landmarks, timestamp = Date.now()) {
        const thumbTip = landmarks[4];
        const indexTip = landmarks[8];
        const distance = Math.sqrt(
            Math.pow(thumbTip.x - indexTip.x, 2) +
            Math.pow(thumbTip.y - indexTip.y, 2)
        );

        const rawDetection = distance < CONFIG.gestures.pinchThreshold;

        // Applica glitch suppression se abilitato
        if (this.stabilizationEnabled) {
            return this.stabilizer.updateGesture('pinch', rawDetection, timestamp);
        }

        return rawDetection;
    }

    /**
     * Detect fist gesture (all fingers curled)
     * Con glitch suppression
     */
    detectFist(landmarks, timestamp = Date.now()) {
        const fingerTips = [8, 12, 16, 20];
        const palmBase = landmarks[0];
        let curledCount = 0;

        fingerTips.forEach(tipIndex => {
            const tip = landmarks[tipIndex];
            const distanceToPalm = Math.sqrt(
                Math.pow(tip.x - palmBase.x, 2) +
                Math.pow(tip.y - palmBase.y, 2)
            );
            if (distanceToPalm < CONFIG.gestures.fistThreshold) {
                curledCount++;
            }
        });

        const rawDetection = curledCount >= 3;

        // Applica glitch suppression se abilitato
        if (this.stabilizationEnabled) {
            return this.stabilizer.updateGesture('fist', rawDetection, timestamp);
        }

        return rawDetection;
    }

    /**
     * Detect thumbs up gesture
     * Con glitch suppression
     */
    detectThumbsUp(landmarks, timestamp = Date.now()) {
        const thumbTip = landmarks[4];
        const thumbIP = landmarks[3];
        const indexMCP = landmarks[5];
        const wrist = landmarks[0];

        // Pollice deve puntare verso l'alto
        const thumbPointingUp = thumbTip.y < thumbIP.y && thumbTip.y < wrist.y;

        // Altre dita devono essere chiuse
        const fingerTips = [8, 12, 16, 20];
        let curledCount = 0;

        fingerTips.forEach(tipIndex => {
            const tip = landmarks[tipIndex];
            if (tip.y > indexMCP.y) {
                curledCount++;
            }
        });

        const rawDetection = thumbPointingUp && curledCount >= 3;

        // Applica glitch suppression se abilitato
        if (this.stabilizationEnabled) {
            return this.stabilizer.updateGesture('thumbsUp', rawDetection, timestamp);
        }

        return rawDetection;
    }

    /**
     * Get index finger position
     */
    getIndexFingerPosition(landmarks) {
        const indexTip = landmarks[8];
        return { x: indexTip.x, y: indexTip.y, time: Date.now() };
    }

    /**
     * Track index finger shake (for "NO" confirmation)
     */
    trackIndexShake(position) {
        if (this.lastIndexX === null) {
            this.lastIndexX = position.x;
            return;
        }

        const delta = position.x - this.lastIndexX;
        const currentDirection = delta > 0 ? 'right' : 'left';

        // Rileva cambio di direzione (shake)
        if (Math.abs(delta) > 0.03 && this.lastDirection && currentDirection !== this.lastDirection) {
            this.indexShakes.push({ time: position.time, direction: currentDirection });

            // Limita array per performance
            if (this.indexShakes.length > 10) {
                this.indexShakes.shift();
            }
        }

        if (Math.abs(delta) > 0.02) {
            this.lastDirection = currentDirection;
        }

        this.lastIndexX = position.x;
    }

    /**
     * Count recent shakes within time window
     */
    countRecentShakes() {
        const now = Date.now();
        const recentShakes = this.indexShakes.filter(shake =>
            (now - shake.time) < CONFIG.gestures.shakeTimeWindow
        );
        return recentShakes.length;
    }

    /**
     * Reset gesture state
     */
    reset() {
        this.thumbsUpStartTime = null;
        this.indexShakes = [];
        this.lastIndexX = null;
        this.lastDirection = null;
    }

    /**
     * Reset thumbs up timer
     */
    resetThumbsUp() {
        this.thumbsUpStartTime = null;
    }

    /**
     * Start thumbs up timer
     */
    startThumbsUp() {
        if (!this.thumbsUpStartTime) {
            this.thumbsUpStartTime = Date.now();
        }
    }

    /**
     * Get thumbs up duration
     */
    getThumbsUpDuration() {
        if (!this.thumbsUpStartTime) {
            return 0;
        }
        return Date.now() - this.thumbsUpStartTime;
    }

    /**
     * Check if thumbs up duration threshold met
     */
    isThumbsUpConfirmed() {
        return this.getThumbsUpDuration() >= CONFIG.gestures.thumbsUpDuration;
    }

    /**
     * Check if shake threshold met
     */
    isShakeConfirmed() {
        return this.countRecentShakes() >= CONFIG.gestures.shakeThreshold;
    }

    /**
     * Detect point gesture (index finger extended, other fingers curled)
     * Used for Kamehameha Focus mode
     */
    detectPoint(landmarks, timestamp = Date.now()) {
        const indexTip = landmarks[8];
        const indexDIP = landmarks[7];
        const indexPIP = landmarks[6];
        const indexMCP = landmarks[5];
        
        // Index finger must be extended (straight)
        const indexExtended = indexTip.y < indexDIP.y && indexDIP.y < indexPIP.y;
        
        // Other fingers must be curled
        const middleTip = landmarks[12];
        const ringTip = landmarks[16];
        const pinkyTip = landmarks[20];
        const palmBase = landmarks[0];
        
        const middleCurled = middleTip.y > indexMCP.y;
        const ringCurled = ringTip.y > indexMCP.y;
        const pinkyCurled = pinkyTip.y > indexMCP.y;
        
        const rawDetection = indexExtended && middleCurled && ringCurled && pinkyCurled;
        
        if (this.stabilizationEnabled) {
            return this.stabilizer.updateGesture('point', rawDetection, timestamp);
        }
        
        return rawDetection;
    }

    /**
     * Detect open hand gesture (all fingers extended)
     * Used for Singularity explosion
     */
    detectOpenHand(landmarks, timestamp = Date.now()) {
        const fingerTips = [8, 12, 16, 20];
        const fingerMCPs = [5, 9, 13, 17];
        let extendedCount = 0;
        
        fingerTips.forEach((tipIndex, i) => {
            const tip = landmarks[tipIndex];
            const mcp = landmarks[fingerMCPs[i]];
            
            // Finger is extended if tip is above MCP
            if (tip.y < mcp.y) {
                extendedCount++;
            }
        });
        
        // Also check thumb
        const thumbTip = landmarks[4];
        const thumbMCP = landmarks[2];
        const thumbExtended = Math.abs(thumbTip.x - thumbMCP.x) > 0.05;
        
        const rawDetection = extendedCount >= 3 && thumbExtended;
        
        if (this.stabilizationEnabled) {
            return this.stabilizer.updateGesture('openHand', rawDetection, timestamp);
        }
        
        return rawDetection;
    }

    /**
     * Start Kamehameha Focus mode tracking
     */
    startFocusMode(fingerPos) {
        if (!this.pointStartTime) {
            this.pointStartTime = Date.now();
            this.pointTarget = { x: fingerPos.x, y: fingerPos.y };
        }
    }

    /**
     * Get focus mode duration
     */
    getFocusDuration() {
        if (!this.pointStartTime) {
            return 0;
        }
        return Date.now() - this.pointStartTime;
    }

    /**
     * Check if focus mode should activate (2 seconds)
     */
    shouldActivateFocus() {
        return this.getFocusDuration() >= 2000;
    }

    /**
     * Reset focus mode
     */
    resetFocusMode() {
        this.pointStartTime = null;
        this.pointTarget = null;
        this.focusModeActive = false;
    }

    /**
     * Start Singularity collapse tracking
     */
    startSingularity() {
        if (!this.fistStartTime) {
            this.fistStartTime = Date.now();
        }
    }

    /**
     * Get singularity duration
     */
    getSingularityDuration() {
        if (!this.fistStartTime) {
            return 0;
        }
        return Date.now() - this.fistStartTime;
    }

    /**
     * Check if singularity should collapse (immediate)
     */
    shouldCollapseSingularity() {
        return this.getSingularityDuration() >= 100;
    }

    /**
     * Reset singularity mode
     */
    resetSingularity() {
        this.fistStartTime = null;
        this.singularityActive = false;
        this.singularityCollapsed = false;
    }


    /**
     * Update confirm cooldown
     */
    updateConfirmTime() {
        this.lastConfirmTime = Date.now();
    }

    /**
     * Check if confirm is in cooldown
     */
    isInCooldown() {
        const timeSinceLastConfirm = Date.now() - this.lastConfirmTime;
        return timeSinceLastConfirm < CONFIG.gestures.confirmCooldown;
    }

    /**
     * Get cooldown remaining time
     */
    getCooldownRemaining() {
        const timeSinceLastConfirm = Date.now() - this.lastConfirmTime;
        const remaining = CONFIG.gestures.confirmCooldown - timeSinceLastConfirm;
        return Math.max(0, remaining);
    }

    /**
     * Ottieni info debug dello stabilizer
     */
    getStabilizerDebugInfo(gestureName) {
        if (!this.stabilizer) {
            return null;
        }
        return this.stabilizer.getGestureDebugInfo(gestureName);
    }

    /**
     * Ottieni info debug di tutti i gesti stabilizzati
     */
    getAllStabilizerDebugInfo() {
        if (!this.stabilizer) {
            return null;
        }
        return this.stabilizer.getAllDebugInfo();
    }

    /**
     * Ottieni stability score di un gesto
     */
    getGestureStability(gestureName) {
        if (!this.stabilizer) {
            return 0;
        }
        return this.stabilizer.getStability(gestureName);
    }

    /**
     * Verifica se un gesto è stabilizzato
     */
    isGestureStabilized(gestureName) {
        if (!this.stabilizer) {
            return false;
        }
        return this.stabilizer.isStabilized(gestureName);
    }

    /**
     * Reset stabilizer per un gesto
     */
    resetStabilizer(gestureName) {
        if (this.stabilizer) {
            this.stabilizer.resetGesture(gestureName);
        }
    }

    /**
     * Abilita/disabilita glitch suppression
     */
    setStabilizationEnabled(enabled) {
        this.stabilizationEnabled = enabled;
        if (!enabled && this.stabilizer) {
            this.stabilizer.resetAll();
        }
    }

    /**
     * Ottieni statistiche aggregate stabilizer
     */
    getStabilizerStats() {
        if (!this.stabilizer) {
            return null;
        }
        return this.stabilizer.getStats();
    }
}

export default GestureDetector;
