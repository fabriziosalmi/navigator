/**
 * GestureDetector Module
 * Contiene tutte le funzioni di rilevamento gesture
 */

import CONFIG from './config.js';

export class GestureDetector {
    constructor() {
        // Gesture state tracking
        this.thumbsUpStartTime = null;
        this.lastConfirmTime = 0;
        this.indexShakes = [];
        this.lastIndexX = null;
        this.lastDirection = null;
    }

    /**
     * Detect pinch gesture (thumb and index finger close together)
     */
    detectPinch(landmarks) {
        const thumbTip = landmarks[4];
        const indexTip = landmarks[8];
        const distance = Math.sqrt(
            Math.pow(thumbTip.x - indexTip.x, 2) +
            Math.pow(thumbTip.y - indexTip.y, 2)
        );
        return distance < CONFIG.gestures.pinchThreshold;
    }

    /**
     * Detect fist gesture (all fingers curled)
     */
    detectFist(landmarks) {
        const fingerTips = [8, 12, 16, 20];
        const palmBase = landmarks[0];
        let curledCount = 0;

        fingerTips.forEach(tipIndex => {
            const tip = landmarks[tipIndex];
            const distanceToPalm = Math.sqrt(
                Math.pow(tip.x - palmBase.x, 2) +
                Math.pow(tip.y - palmBase.y, 2)
            );
            if (distanceToPalm < CONFIG.gestures.fistThreshold) curledCount++;
        });

        return curledCount >= 3;
    }

    /**
     * Detect thumbs up gesture
     */
    detectThumbsUp(landmarks) {
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
            if (tip.y > indexMCP.y) curledCount++;
        });

        return thumbPointingUp && curledCount >= 3;
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
        if (!this.thumbsUpStartTime) return 0;
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
}

export default GestureDetector;
