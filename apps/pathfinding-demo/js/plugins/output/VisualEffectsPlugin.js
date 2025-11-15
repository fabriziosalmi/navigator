/**
 * VisualEffectsPlugin.js
 * 
 * Output plugin that renders visual effects for navigation and gestures.
 * Listens to intent and renderer events to trigger effects.
 * Wraps existing VisualEffects and LightBeamSystem.
 * 
 * Listens for:
 * - renderer:card_changed
 * - renderer:layer_changed
 * - input:gesture:swipe_*
 * - intent:select_card
 */

import { BasePlugin } from '../../core/BasePlugin.js';
import { VisualEffects } from '../../VisualEffects.js';
import { LightBeamSystem } from '../../LightBeamSystem.js';

export class VisualEffectsPlugin extends BasePlugin {
    constructor(config = {}) {
        super('VisualEffects', {
            enabled: true,
            performanceMode: 'medium', // 'low' | 'medium' | 'high'
            particles: {
                enabled: false,
                maxParticles: 100
            },
            lightBeams: {
                enabled: false,
                duration: 600
            },
            blur: {
                enabled: true,
                inactiveBlur: 12,
                inactiveBrightness: 0.6,
                inactiveSaturation: 0.3
            },
            gestureLED: {
                enabled: true,
                pulseDuration: 300
            },
            ...config
        });

        this.visualEffects = null;
        this.lightBeamSystem = null;
    }

    async onInit() {
        this.log('Initializing visual effects');

        // Initialize VisualEffects system
        const performanceMode = this.getConfig('performanceMode', 'medium');
        this.visualEffects = new VisualEffects({
            performanceMode,
            particlesEnabled: this.getConfig('particles.enabled', false),
            lightBeamsEnabled: this.getConfig('lightBeams.enabled', false)
        });

        // Initialize LightBeamSystem if enabled
        if (this.getConfig('lightBeams.enabled', false)) {
            this.lightBeamSystem = new LightBeamSystem();
        }

        // Listen to renderer events
        this.on('renderer:card_changed', (event) => this._onCardChanged(event));
        this.on('renderer:layer_changed', (event) => this._onLayerChanged(event));
        this.on('renderer:card_selected', (event) => this._onCardSelected(event));

        // Listen to gesture events for immediate visual feedback
        this.on('input:gesture:swipe_left', (event) => this._onSwipe('left', event));
        this.on('input:gesture:swipe_right', (event) => this._onSwipe('right', event));
        this.on('input:gesture:swipe_up', (event) => this._onSwipe('up', event));
        this.on('input:gesture:swipe_down', (event) => this._onSwipe('down', event));

        // Gesture LED indicator
        this.on('input:gesture:hand_detected', () => this._updateGestureLED('detecting'));
        this.on('input:gesture:hand_lost', () => this._updateGestureLED('idle'));
        this.on('intent:navigate_left', () => this._updateGestureLED('success'));
        this.on('intent:navigate_right', () => this._updateGestureLED('success'));
        this.on('system:error', () => this._updateGestureLED('error'));
    }

    async onStart() {
        if (!this.getConfig('enabled', true)) {
            this.log('Visual effects disabled by config');
            return;
        }

        this.log('Starting visual effects');

        // Start visual effects
        if (this.visualEffects) {
            this.visualEffects.start();
        }

        // Apply blur to inactive cards
        if (this.getConfig('blur.enabled', true)) {
            this._applyCardBlur();
        }

        this.setPluginState('enabled', true);
    }

    async onStop() {
        this.log('Stopping visual effects');

        // Stop visual effects
        if (this.visualEffects) {
            this.visualEffects.stop();
        }

        this.setPluginState('enabled', false);
    }

    async onDestroy() {
        // Cleanup visual effects
        if (this.visualEffects) {
            this.visualEffects.destroy();
            this.visualEffects = null;
        }

        if (this.lightBeamSystem) {
            this.lightBeamSystem.destroy();
            this.lightBeamSystem = null;
        }
    }

    // ========================================
    // Effect Handlers
    // ========================================

    _onCardChanged(event) {
        const { direction, currentIndex } = event.payload;

        // Apply blur update
        if (this.getConfig('blur.enabled', true)) {
            this._applyCardBlur();
        }

        // Trigger light beam if enabled
        if (this.lightBeamSystem) {
            const beamDirection = direction > 0 ? 'right' : 'left';
            this.lightBeamSystem.trigger(beamDirection);
        }

        // Particle effect if enabled
        if (this.getConfig('particles.enabled', false)) {
            this.visualEffects.triggerParticles('navigation');
        }

        this.log('Card changed effect:', direction);
    }

    _onLayerChanged(event) {
        const { direction, currentLayer } = event.payload;

        // Apply blur update
        if (this.getConfig('blur.enabled', true)) {
            this._applyCardBlur();
        }

        // Trigger light beam
        if (this.lightBeamSystem) {
            const beamDirection = direction > 0 ? 'down' : 'up';
            this.lightBeamSystem.trigger(beamDirection);
        }

        // Larger particle effect for layer change
        if (this.getConfig('particles.enabled', false)) {
            this.visualEffects.triggerParticles('layer_change');
        }

        this.log('Layer changed effect:', currentLayer);
    }

    _onCardSelected(event) {
        const { cardIndex } = event.payload;

        // Selection effect
        if (this.visualEffects) {
            this.visualEffects.triggerSelection(cardIndex);
        }

        // Radial light beam
        if (this.lightBeamSystem) {
            this.lightBeamSystem.trigger('radial');
        }

        this.log('Card selected effect:', cardIndex);
    }

    _onSwipe(direction, event) {
        // Immediate visual feedback on swipe gesture (before intent)
        this.log(`Swipe ${direction} visual feedback`);

        // Quick particle trail following swipe
        if (this.getConfig('particles.enabled', false)) {
            this.visualEffects.triggerSwipeTrail(direction);
        }
    }

    // ========================================
    // Blur System
    // ========================================

    _applyCardBlur() {
        const container = document.querySelector('#layer-system');
        if (!container) {
            return;
        }

        const activeLayer = container.querySelector('.layer-container.active');
        if (!activeLayer) {
            return;
        }

        const cards = activeLayer.querySelectorAll('.card');
        const currentIndex = this.getState('navigation.currentCardIndex', 0);

        const blurAmount = this.getConfig('blur.inactiveBlur', 12);
        const brightness = this.getConfig('blur.inactiveBrightness', 0.6);
        const saturation = this.getConfig('blur.inactiveSaturation', 0.3);

        cards.forEach((card, index) => {
            const media = card.querySelector('.card-media');
            if (!media) {
                return;
            }

            if (index === currentIndex) {
                // Active card - no blur
                media.style.filter = 'none';
            } else {
                // Inactive card - apply blur
                media.style.filter = `blur(${blurAmount}px) brightness(${brightness}) saturate(${saturation})`;
            }
        });
    }

    // ========================================
    // Gesture LED Indicator
    // ========================================

    _updateGestureLED(state) {
        if (!this.getConfig('gestureLED.enabled', true)) {
            return;
        }

        const led = document.querySelector('.gesture-led');
        if (!led) {
            return;
        }

        // Remove all state classes
        led.classList.remove('idle', 'detecting', 'success', 'error');

        // Add current state
        led.classList.add(state);

        // Pulse animation
        const pulseDuration = this.getConfig('gestureLED.pulseDuration', 300);
        
        led.style.animation = 'none';
        setTimeout(() => {
            led.style.animation = `led-pulse ${pulseDuration}ms ease-out`;
        }, 10);

        this.log('Gesture LED updated:', state);
    }

    // ========================================
    // Performance Management
    // ========================================

    /**
     * Adjust performance mode at runtime
     * @param {string} mode - 'low' | 'medium' | 'high'
     */
    setPerformanceMode(mode) {
        if (!['low', 'medium', 'high'].includes(mode)) {
            this.warn('Invalid performance mode:', mode);
            return;
        }

        this.config.performanceMode = mode;

        // Adjust effects based on mode
        switch (mode) {
            case 'low':
                this.config.particles.enabled = false;
                this.config.lightBeams.enabled = false;
                this.config.blur.enabled = false;
                break;
            case 'medium':
                this.config.particles.enabled = false;
                this.config.lightBeams.enabled = false;
                this.config.blur.enabled = true;
                break;
            case 'high':
                this.config.particles.enabled = true;
                this.config.lightBeams.enabled = true;
                this.config.blur.enabled = true;
                break;
        }

        if (this.visualEffects) {
            this.visualEffects.setPerformanceMode(mode);
        }

        this.log('Performance mode set to:', mode);
    }
}

export default VisualEffectsPlugin;
