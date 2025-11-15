/**
 * DOMLODManager Module
 * Adaptive Detail Rendering for DOM-based cards
 * Optimizes performance by reducing detail/visibility of non-visible cards
 */

import CONFIG from './config.js';

export const DOM_LOD_LEVELS = {
    ACTIVE: 'active',       // Current card - full detail
    ADJACENT: 'adjacent',   // Next/prev cards - reduced detail
    NEARBY: 'nearby',       // Cards 2-3 positions away - minimal detail
    DISTANT: 'distant',     // Cards 4+ away - hidden/culled
    HIDDEN: 'hidden'        // Off-screen - display: none
};

export class DOMLODManager {
    constructor(config = {}) {
        // Configuration
        this.enabled = config.enabled !== undefined ? config.enabled : true;
        this.activeRadius = config.activeRadius || 0;     // 0 = only current card
        this.adjacentRadius = config.adjacentRadius || 2; // 2 = 2 cards per side (5 total visible)
        this.nearbyRadius = config.nearbyRadius || 3;     // 3-4 positions
        this.distantRadius = config.distantRadius || 5;   // 5+ positions
        this.updateThrottle = config.updateInterval || 50; // ms

        // State
        this.currentCardIndex = 0;
        this.totalCards = 0;
        this.lastUpdateTime = 0;
        this.initialized = false;
        this.cards = []; // DOM card elements

        // Statistics
        this.stats = {
            activeCards: 0,
            adjacentCards: 0,
            nearbyCards: 0,
            distantCards: 0,
            hiddenCards: 0
        };
    }

    /**
     * Initialize LOD manager with card elements
     * @param {Array<HTMLElement>} cardElements - Array of DOM card elements
     */
    init(cardElements) {
        this.cards = Array.from(cardElements);
        this.totalCards = this.cards.length;
        // Reduce console spam - only log once
        if (!this.initialized) {
            // console.log(`DOMLODManager initialized with ${this.totalCards} cards`);
            this.initialized = true;
        }
    }

    /**
     * Update LOD levels for all cards based on current position
     * @param {number} currentIndex - Index of currently active card
     * @param {number} timestamp - Current timestamp
     */
    update(currentIndex, timestamp = Date.now()) {
        if (!this.enabled) {
            return;
        }

        // Throttle updates
        if (timestamp - this.lastUpdateTime < this.updateThrottle) {
            return;
        }

        this.currentCardIndex = currentIndex;
        this.lastUpdateTime = timestamp;

        // Reset stats
        this.stats = {
            activeCards: 0,
            adjacentCards: 0,
            nearbyCards: 0,
            distantCards: 0,
            hiddenCards: 0
        };

        // Update each card's LOD level
        this.cards.forEach((card, index) => {
            const distance = this.calculateDistance(index, currentIndex);
            const lodLevel = this.calculateLODLevel(distance);
            this.applyLODLevel(card, lodLevel, distance);
            this.updateStats(lodLevel);
        });
    }

    /**
     * Calculate circular distance between two card indices
     * Accounts for wrap-around in circular navigation
     * @param {number} cardIndex - Index of card
     * @param {number} currentIndex - Index of current card
     * @returns {number} - Minimum distance (accounting for wrap-around)
     */
    calculateDistance(cardIndex, currentIndex) {
        if (this.totalCards === 0) {
            return Infinity;
        }

        // Calculate direct distance
        const directDistance = Math.abs(cardIndex - currentIndex);

        // Calculate wrap-around distance (circular navigation)
        const wrapDistance = this.totalCards - directDistance;

        // Return minimum distance
        return Math.min(directDistance, wrapDistance);
    }

    /**
     * Determine LOD level based on distance from current card
     * @param {number} distance - Distance from current card
     * @returns {string} - LOD level constant
     */
    calculateLODLevel(distance) {
        if (distance === 0) {
            return DOM_LOD_LEVELS.ACTIVE;
        } else if (distance <= this.adjacentRadius) {
            return DOM_LOD_LEVELS.ADJACENT;
        } else if (distance <= this.nearbyRadius) {
            return DOM_LOD_LEVELS.NEARBY;
        } else if (distance <= this.distantRadius) {
            return DOM_LOD_LEVELS.DISTANT;
        } else {
            return DOM_LOD_LEVELS.HIDDEN;
        }
    }

    /**
     * Apply LOD level to a card element
     * @param {HTMLElement} card - Card element
     * @param {string} lodLevel - LOD level
     * @param {number} distance - Distance from current
     */
    applyLODLevel(card, lodLevel, distance) {
        // Remove all LOD classes
        Object.values(DOM_LOD_LEVELS).forEach(level => {
            card.classList.remove(`lod-${level}`);
        });

        // Add new LOD class
        card.classList.add(`lod-${lodLevel}`);

        // Store distance as data attribute for debugging
        card.dataset.lodDistance = distance;
        card.dataset.lodLevel = lodLevel;

        // Apply performance optimizations based on LOD level
        switch (lodLevel) {
            case DOM_LOD_LEVELS.ACTIVE:
                // Full quality - no optimizations
                card.style.willChange = 'transform, opacity';
                card.style.display = '';
                break;

            case DOM_LOD_LEVELS.ADJACENT:
                // Reduced quality - keep visible but optimize
                card.style.willChange = 'transform';
                card.style.display = '';
                break;

            case DOM_LOD_LEVELS.NEARBY:
                // Minimal quality - visible but heavily optimized
                card.style.willChange = 'auto';
                card.style.display = '';
                break;

            case DOM_LOD_LEVELS.DISTANT:
                // Low priority - minimal rendering
                card.style.willChange = 'auto';
                card.style.display = '';
                break;

            case DOM_LOD_LEVELS.HIDDEN:
                // Hidden - display: none for maximum performance
                card.style.willChange = 'auto';
                card.style.display = 'none';
                break;
        }
    }

    /**
     * Update statistics
     * @param {string} lodLevel - LOD level
     */
    updateStats(lodLevel) {
        switch (lodLevel) {
            case DOM_LOD_LEVELS.ACTIVE:
                this.stats.activeCards++;
                break;
            case DOM_LOD_LEVELS.ADJACENT:
                this.stats.adjacentCards++;
                break;
            case DOM_LOD_LEVELS.NEARBY:
                this.stats.nearbyCards++;
                break;
            case DOM_LOD_LEVELS.DISTANT:
                this.stats.distantCards++;
                break;
            case DOM_LOD_LEVELS.HIDDEN:
                this.stats.hiddenCards++;
                break;
        }
    }

    /**
     * Force immediate update (bypass throttling)
     */
    forceUpdate() {
        this.lastUpdateTime = 0;
        this.update(this.currentCardIndex, Date.now());
    }

    /**
     * Get LOD statistics
     * @returns {Object} - Statistics object
     */
    getStats() {
        const total = this.totalCards;
        return {
            ...this.stats,
            totalCards: total,
            activePercent: total > 0 ? ((this.stats.activeCards / total) * 100).toFixed(1) + '%' : '0%',
            adjacentPercent: total > 0 ? ((this.stats.adjacentCards / total) * 100).toFixed(1) + '%' : '0%',
            nearbyPercent: total > 0 ? ((this.stats.nearbyCards / total) * 100).toFixed(1) + '%' : '0%',
            distantPercent: total > 0 ? ((this.stats.distantCards / total) * 100).toFixed(1) + '%' : '0%',
            hiddenPercent: total > 0 ? ((this.stats.hiddenCards / total) * 100).toFixed(1) + '%' : '0%',
            renderingCards: this.stats.activeCards + this.stats.adjacentCards + this.stats.nearbyCards + this.stats.distantCards,
            hiddenCards: this.stats.hiddenCards
        };
    }

    /**
     * Enable/disable LOD system
     * @param {boolean} enabled - Enable state
     */
    setEnabled(enabled) {
        this.enabled = enabled;

        if (!enabled) {
            // Reset all cards to full quality
            this.cards.forEach(card => {
                Object.values(DOM_LOD_LEVELS).forEach(level => {
                    card.classList.remove(`lod-${level}`);
                });
                card.style.willChange = 'transform, opacity';
                card.style.display = '';
            });
        } else {
            // Re-apply LOD
            this.forceUpdate();
        }
    }

    /**
     * Update configuration at runtime
     * @param {Object} config - Configuration object
     */
    updateConfig(config) {
        if (config.activeRadius !== undefined) {
            this.activeRadius = config.activeRadius;
        }
        if (config.adjacentRadius !== undefined) {
            this.adjacentRadius = config.adjacentRadius;
        }
        if (config.nearbyRadius !== undefined) {
            this.nearbyRadius = config.nearbyRadius;
        }
        if (config.distantRadius !== undefined) {
            this.distantRadius = config.distantRadius;
        }

        this.forceUpdate();
    }
}

export default DOMLODManager;
