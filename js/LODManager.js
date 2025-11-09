/**
 * LODManager Module
 * Adaptive Detail Rendering - Level of Detail management
 * Optimizes performance by rendering center cards with full detail
 * and peripheral cards with progressively lower quality
 */

import CONFIG from './config.js';

export const LOD_LEVELS = {
    HIGH: 'HIGH',       // Full detail - center cards
    MEDIUM: 'MEDIUM',   // Reduced detail - near cards
    LOW: 'LOW',         // Minimal detail - far cards
    CULLED: 'CULLED'    // Hidden - very far or off-screen cards
};

export class LODManager {
    constructor(config = {}) {
        // Configuration
        this.enabled = config.enabled !== undefined ? config.enabled : true;
        this.highDetailRadius = config.highDetailRadius || 8;
        this.mediumDetailRadius = config.mediumDetailRadius || 15;
        this.lowDetailRadius = config.lowDetailRadius || 25;
        this.cullRadius = config.cullRadius || 35;
        this.updateInterval = config.updateInterval || 100; // ms
        this.hysteresis = config.hysteresis || 1.2; // Prevent flickering

        // State
        this.cards = new Map(); // cardId -> cardState
        this.lastUpdateTime = 0;
        this.camera = null;

        // Statistics
        this.stats = {
            totalCards: 0,
            highDetail: 0,
            mediumDetail: 0,
            lowDetail: 0,
            culled: 0,
            lastUpdateDuration: 0
        };
    }

    /**
     * Register a card for LOD management
     * @param {Card} card - Card instance to manage
     */
    registerCard(card) {
        if (!this.enabled) return;

        this.cards.set(card.id, {
            card: card,
            currentLOD: LOD_LEVELS.HIGH,
            targetLOD: LOD_LEVELS.HIGH,
            lastDistance: 0,
            transitionProgress: 1.0
        });
    }

    /**
     * Unregister a card from LOD management
     * @param {Card} card - Card instance to remove
     */
    unregisterCard(card) {
        this.cards.delete(card.id);
    }

    /**
     * Set camera reference for distance calculations
     * @param {THREE.Camera} camera - Three.js camera
     */
    setCamera(camera) {
        this.camera = camera;
    }

    /**
     * Update LOD levels for all cards
     * Called from main update loop
     * @param {number} timestamp - Current timestamp
     */
    update(timestamp = Date.now()) {
        if (!this.enabled || !this.camera) return;

        // Throttle updates to updateInterval
        if (timestamp - this.lastUpdateTime < this.updateInterval) {
            return;
        }

        const startTime = performance.now();

        // Reset stats
        this.stats.totalCards = this.cards.size;
        this.stats.highDetail = 0;
        this.stats.mediumDetail = 0;
        this.stats.lowDetail = 0;
        this.stats.culled = 0;

        // Update each card
        this.cards.forEach((cardState) => {
            this.updateCardLOD(cardState);
        });

        this.lastUpdateTime = timestamp;
        this.stats.lastUpdateDuration = performance.now() - startTime;
    }

    /**
     * Update LOD level for a single card
     * @param {Object} cardState - Card state object
     */
    updateCardLOD(cardState) {
        const card = cardState.card;
        const distance = this.calculateDistance(card);

        cardState.lastDistance = distance;

        // Determine target LOD based on distance
        const targetLOD = this.calculateTargetLOD(distance, cardState.currentLOD);

        // Only transition if LOD level changed
        if (targetLOD !== cardState.currentLOD) {
            cardState.targetLOD = targetLOD;
            cardState.currentLOD = targetLOD;

            // Apply LOD to card
            if (card.setLODLevel) {
                card.setLODLevel(targetLOD);
            }
        }

        // Update stats
        switch (cardState.currentLOD) {
            case LOD_LEVELS.HIGH:
                this.stats.highDetail++;
                break;
            case LOD_LEVELS.MEDIUM:
                this.stats.mediumDetail++;
                break;
            case LOD_LEVELS.LOW:
                this.stats.lowDetail++;
                break;
            case LOD_LEVELS.CULLED:
                this.stats.culled++;
                break;
        }
    }

    /**
     * Calculate distance from camera to card
     * @param {Card} card - Card instance
     * @returns {number} - Distance in world units
     */
    calculateDistance(card) {
        if (!this.camera || !card.group) return Infinity;

        const cardPosition = card.group.position;
        const cameraPosition = this.camera.position;

        return cameraPosition.distanceTo(cardPosition);
    }

    /**
     * Calculate target LOD level based on distance
     * Uses hysteresis to prevent flickering at boundaries
     * @param {number} distance - Distance from camera
     * @param {string} currentLOD - Current LOD level
     * @returns {string} - Target LOD level
     */
    calculateTargetLOD(distance, currentLOD) {
        // Apply hysteresis based on current LOD
        const hysteresisMultiplier = this.getHysteresisMultiplier(currentLOD, distance);

        // Determine LOD based on distance thresholds
        if (distance < this.highDetailRadius * hysteresisMultiplier) {
            return LOD_LEVELS.HIGH;
        } else if (distance < this.mediumDetailRadius * hysteresisMultiplier) {
            return LOD_LEVELS.MEDIUM;
        } else if (distance < this.lowDetailRadius * hysteresisMultiplier) {
            return LOD_LEVELS.LOW;
        } else if (distance < this.cullRadius * hysteresisMultiplier) {
            return LOD_LEVELS.CULLED;
        } else {
            return LOD_LEVELS.CULLED;
        }
    }

    /**
     * Calculate hysteresis multiplier to prevent LOD flickering
     * @param {string} currentLOD - Current LOD level
     * @param {number} distance - Current distance
     * @returns {number} - Hysteresis multiplier
     */
    getHysteresisMultiplier(currentLOD, distance) {
        // If transitioning to lower quality, apply hysteresis
        // This makes boundaries "sticky" to prevent rapid switching

        switch (currentLOD) {
            case LOD_LEVELS.HIGH:
                // Stay in HIGH longer when moving away
                return this.hysteresis;
            case LOD_LEVELS.MEDIUM:
                // Stay in MEDIUM longer when moving away
                return this.hysteresis;
            case LOD_LEVELS.LOW:
                // Stay in LOW longer when moving away
                return this.hysteresis;
            default:
                return 1.0;
        }
    }

    /**
     * Get LOD statistics for debugging
     * @returns {Object} - LOD statistics
     */
    getStats() {
        return {
            ...this.stats,
            highDetailPercent: this.stats.totalCards > 0
                ? ((this.stats.highDetail / this.stats.totalCards) * 100).toFixed(1) + '%'
                : '0%',
            mediumDetailPercent: this.stats.totalCards > 0
                ? ((this.stats.mediumDetail / this.stats.totalCards) * 100).toFixed(1) + '%'
                : '0%',
            lowDetailPercent: this.stats.totalCards > 0
                ? ((this.stats.lowDetail / this.stats.totalCards) * 100).toFixed(1) + '%'
                : '0%',
            culledPercent: this.stats.totalCards > 0
                ? ((this.stats.culled / this.stats.totalCards) * 100).toFixed(1) + '%'
                : '0%'
        };
    }

    /**
     * Get detailed info about a specific card's LOD state
     * @param {number} cardId - Card ID
     * @returns {Object|null} - Card LOD info
     */
    getCardInfo(cardId) {
        const cardState = this.cards.get(cardId);
        if (!cardState) return null;

        return {
            cardId: cardId,
            currentLOD: cardState.currentLOD,
            targetLOD: cardState.targetLOD,
            distance: cardState.lastDistance.toFixed(2),
            transitionProgress: (cardState.transitionProgress * 100).toFixed(1) + '%'
        };
    }

    /**
     * Force update all cards immediately (bypass throttling)
     */
    forceUpdate() {
        this.lastUpdateTime = 0;
        this.update(Date.now());
    }

    /**
     * Update configuration at runtime
     * @param {Object} config - New configuration values
     */
    updateConfig(config) {
        if (config.enabled !== undefined) {
            this.enabled = config.enabled;
        }
        if (config.highDetailRadius !== undefined) {
            this.highDetailRadius = config.highDetailRadius;
        }
        if (config.mediumDetailRadius !== undefined) {
            this.mediumDetailRadius = config.mediumRadius;
        }
        if (config.lowDetailRadius !== undefined) {
            this.lowDetailRadius = config.lowDetailRadius;
        }
        if (config.cullRadius !== undefined) {
            this.cullRadius = config.cullRadius;
        }
        if (config.updateInterval !== undefined) {
            this.updateInterval = config.updateInterval;
        }
        if (config.hysteresis !== undefined) {
            this.hysteresis = config.hysteresis;
        }

        // Force update after config change
        this.forceUpdate();
    }

    /**
     * Enable/disable LOD system
     * @param {boolean} enabled - Enable state
     */
    setEnabled(enabled) {
        this.enabled = enabled;

        if (!enabled) {
            // Reset all cards to HIGH detail
            this.cards.forEach((cardState) => {
                cardState.currentLOD = LOD_LEVELS.HIGH;
                cardState.targetLOD = LOD_LEVELS.HIGH;
                if (cardState.card.setLODLevel) {
                    cardState.card.setLODLevel(LOD_LEVELS.HIGH);
                }
            });
        }
    }

    /**
     * Get LOD level distribution
     * @returns {Object} - Distribution of LOD levels
     */
    getLODDistribution() {
        const distribution = {
            [LOD_LEVELS.HIGH]: [],
            [LOD_LEVELS.MEDIUM]: [],
            [LOD_LEVELS.LOW]: [],
            [LOD_LEVELS.CULLED]: []
        };

        this.cards.forEach((cardState, cardId) => {
            distribution[cardState.currentLOD].push(cardId);
        });

        return distribution;
    }

    /**
     * Reset all card states
     */
    reset() {
        this.cards.clear();
        this.stats = {
            totalCards: 0,
            highDetail: 0,
            mediumDetail: 0,
            lowDetail: 0,
            culled: 0,
            lastUpdateDuration: 0
        };
    }
}

export default LODManager;
