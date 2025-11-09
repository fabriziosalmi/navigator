/**
 * UIManager Module
 * Gestisce tutti gli aggiornamenti UI e gli effetti visivi
 */

import CONFIG from './config.js';

export class UIManager {
    constructor() {
        this.dynamicBg = null;
        this.wowLabel = null;
        this.navigationVelocity = 0;
        this.lastNavigationTime = 0;
        this.velocityDecayTimer = null;
    }

    /**
     * Initialize UI elements
     */
    init() {
        this.dynamicBg = document.getElementById('dynamic-background');
        this.wowLabel = document.getElementById('layer-wow-label');
    }

    /**
     * Update WOW label for current layer
     */
    updateWowLabel(layerName) {
        if (!this.wowLabel) return;

        const wowLayerName = this.wowLabel.querySelector('.wow-layer-name');
        const wowIcon = this.wowLabel.querySelector('.wow-icon');

        const config = CONFIG.layers[layerName] || { label: layerName, icon: '❓' };

        // Update text and icon
        wowLayerName.textContent = config.label;
        wowIcon.textContent = config.icon;

        // Remove all layer classes
        this.wowLabel.classList.remove('layer-video', 'layer-news', 'layer-images',
            'layer-games', 'layer-apps', 'layer-settings');

        // Add current layer class
        this.wowLabel.classList.add(`layer-${layerName}`);

        // Trigger animation
        this.wowLabel.style.animation = 'none';
        setTimeout(() => {
            this.wowLabel.style.animation = 'wowPulse 2s ease-in-out infinite';
        }, 10);
    }

    /**
     * Update dynamic background effects based on navigation velocity
     */
    updateDynamicBackground() {
        if (!this.dynamicBg) return;

        const now = Date.now();
        const timeSinceLastNav = now - this.lastNavigationTime;

        // Calculate velocity (navigations per second)
        if (timeSinceLastNav < 1000) {
            this.navigationVelocity = Math.min(10, this.navigationVelocity + 1);
        } else {
            this.navigationVelocity = Math.max(0, this.navigationVelocity - 0.5);
        }

        // Apply effects based on velocity
        if (this.navigationVelocity > CONFIG.performance.highVelocityThreshold) {
            this.dynamicBg.classList.add('high-velocity');
            this.dynamicBg.classList.add('active');
        } else if (this.navigationVelocity > CONFIG.performance.mediumVelocityThreshold) {
            this.dynamicBg.classList.remove('high-velocity');
            this.dynamicBg.classList.add('active');
        } else if (this.navigationVelocity > 0.5) {
            this.dynamicBg.classList.remove('high-velocity');
            this.dynamicBg.classList.add('active');
        } else {
            this.dynamicBg.classList.remove('high-velocity');
            this.dynamicBg.classList.remove('active');
        }

        // Clear existing timer
        if (this.velocityDecayTimer) {
            clearTimeout(this.velocityDecayTimer);
        }

        // Schedule velocity decay
        this.velocityDecayTimer = setTimeout(() => {
            if (Date.now() - this.lastNavigationTime > CONFIG.performance.velocityDecayTime) {
                this.navigationVelocity = 0;
                this.dynamicBg.classList.remove('high-velocity');
                this.dynamicBg.classList.remove('active');
            }
        }, CONFIG.performance.velocityDecayTime);
    }

    /**
     * Trigger on navigation event
     */
    onNavigationEvent() {
        this.lastNavigationTime = Date.now();
        this.updateDynamicBackground();
    }

    /**
     * Add debug entry to debug panel
     */
    addDebugEntry(message, type = 'info', debugLog, updateDebugUI) {
        const timestamp = new Date().toLocaleTimeString();
        const entry = { message, type, timestamp };

        debugLog.unshift(entry);
        if (debugLog.length > CONFIG.performance.maxDebugEntries) {
            debugLog.pop();
        }

        updateDebugUI(debugLog);
    }

    /**
     * Update debug UI display
     */
    static updateDebugUI(debugLog) {
        const logContainer = document.getElementById('debug-log');
        if (!logContainer) return;

        logContainer.innerHTML = debugLog.map(entry => `
            <div class="debug-entry ${entry.type}">
                <span class="debug-timestamp">[${entry.timestamp}]</span> ${entry.message}
            </div>
        `).join('');
    }

    /**
     * Update gesture progress indicators
     */
    updateGestureProgress(isThumbsUp, thumbsUpDuration, shakeCount) {
        const thumbsUpProgress = document.getElementById('thumbs-up-progress');
        const shakeProgress = document.getElementById('shake-progress');
        const shakeCountEl = document.getElementById('shake-count');
        const progressFill = document.getElementById('thumbs-progress-fill');

        if (!thumbsUpProgress || !shakeProgress) return;

        if (isThumbsUp && thumbsUpDuration > 0) {
            const progress = Math.min(100, (thumbsUpDuration / CONFIG.gestures.thumbsUpDuration) * 100);

            thumbsUpProgress.style.display = 'block';
            shakeProgress.style.display = 'none';
            progressFill.style.width = progress + '%';
        } else {
            thumbsUpProgress.style.display = 'none';
        }

        if (shakeCount > 0) {
            shakeProgress.style.display = 'block';
            shakeCountEl.textContent = shakeCount;
        } else {
            shakeProgress.style.display = 'none';
        }
    }

    /**
     * Hide gesture progress indicators
     */
    hideGestureProgress() {
        const thumbsUpProgress = document.getElementById('thumbs-up-progress');
        const shakeProgress = document.getElementById('shake-progress');

        if (thumbsUpProgress) thumbsUpProgress.style.display = 'none';
        if (shakeProgress) shakeProgress.style.display = 'none';
    }
}

export default UIManager;
