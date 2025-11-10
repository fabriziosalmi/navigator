/**
 * AudioFeedbackPlugin.js
 * 
 * Output plugin that provides audio feedback for navigation events.
 * Listens to intent events and plays corresponding sounds.
 * Wraps existing AudioManager functionality.
 * 
 * Listens for:
 * - intent:navigate_left/right/up/down
 * - intent:select_card
 * - renderer:card_changed
 * - renderer:layer_changed
 * - system:error
 * - input:gesture:hand_detected
 */

import { BasePlugin } from '../../core/BasePlugin.js';
import { AudioManager } from '../../AudioManager.js';

export class AudioFeedbackPlugin extends BasePlugin {
    constructor(config = {}) {
        super('AudioFeedback', {
            enabled: true,
            masterVolume: 0.3,
            sounds: {
                navigation: 0.4,
                success: 0.5,
                error: 0.3,
                ambient: 0.2
            },
            spatial: {
                enabled: true,
                panRange: 0.7
            },
            events: {
                card_navigate: true,
                layer_change: true,
                gesture_detect: true,
                error_sound: true
            },
            ...config
        });

        this.audioManager = null;
    }

    async onInit() {
        this.log('Initializing audio feedback');

        // Initialize AudioManager
        this.audioManager = new AudioManager();

        // Configure from settings
        const enabled = this.getConfig('enabled', true);
        const masterVolume = this.getConfig('masterVolume', 0.3);
        
        if (enabled) {
            this.audioManager.setVolume(masterVolume);
        } else {
            this.audioManager.setVolume(0);
        }

        // Listen to navigation intents
        this.on('intent:navigate_left', () => this._playNavigationSound('left'));
        this.on('intent:navigate_right', () => this._playNavigationSound('right'));
        this.on('intent:navigate_up', () => this._playNavigationSound('up'));
        this.on('intent:navigate_down', () => this._playNavigationSound('down'));
        this.on('intent:select_card', () => this._playSuccessSound());

        // Listen to renderer events
        this.on('renderer:card_changed', (event) => this._onCardChanged(event));
        this.on('renderer:layer_changed', (event) => this._onLayerChanged(event));
        this.on('renderer:card_selected', () => this._playSuccessSound());

        // Listen to system events
        this.on('system:error', () => this._playErrorSound());

        // Listen to gesture events
        this.on('input:gesture:hand_detected', () => this._playDetectionSound());
        this.on('input:gesture:hand_lost', () => this._playDetectionSound('lost'));
    }

    async onStart() {
        if (!this.getConfig('enabled', true)) {
            this.log('Audio feedback disabled by config');
            return;
        }

        this.log('Starting audio feedback');
        this.setPluginState('enabled', true);
    }

    async onStop() {
        this.log('Stopping audio feedback');
        
        // Stop all sounds
        if (this.audioManager) {
            this.audioManager.stopAll();
        }

        this.setPluginState('enabled', false);
    }

    async onDestroy() {
        if (this.audioManager) {
            this.audioManager.stopAll();
            this.audioManager = null;
        }
    }

    // ========================================
    // Sound Playback
    // ========================================

    _playNavigationSound(direction) {
        if (!this._shouldPlaySound('card_navigate')) return;

        const volume = this.getConfig('sounds.navigation', 0.4);
        const spatialEnabled = this.getConfig('spatial.enabled', true);

        if (spatialEnabled) {
            // Spatial audio based on direction
            let pan = 0;
            const panRange = this.getConfig('spatial.panRange', 0.7);

            switch (direction) {
                case 'left':
                    pan = -panRange;
                    break;
                case 'right':
                    pan = panRange;
                    break;
                case 'up':
                    pan = 0;
                    break;
                case 'down':
                    pan = 0;
                    break;
            }

            this.audioManager.playNavigationSound(volume, pan);
        } else {
            this.audioManager.playNavigationSound(volume);
        }

        this.log(`Navigation sound: ${direction}`);
    }

    _playSuccessSound() {
        if (!this._shouldPlaySound('success')) return;

        const volume = this.getConfig('sounds.success', 0.5);
        this.audioManager.playSuccessSound(volume);

        this.log('Success sound');
    }

    _playErrorSound() {
        if (!this._shouldPlaySound('error_sound')) return;

        const volume = this.getConfig('sounds.error', 0.3);
        this.audioManager.playErrorSound(volume);

        this.log('Error sound');
    }

    _playDetectionSound(type = 'detected') {
        if (!this._shouldPlaySound('gesture_detect')) return;

        const volume = this.getConfig('sounds.navigation', 0.4) * 0.5; // Quieter
        
        if (type === 'detected') {
            // Play subtle beep for hand detected
            this.audioManager.playBeep(880, 100, volume); // A5 note, 100ms
        } else {
            // Play different tone for hand lost
            this.audioManager.playBeep(440, 100, volume * 0.7); // A4 note
        }

        this.log(`Detection sound: ${type}`);
    }

    _playLayerChangeSound() {
        if (!this._shouldPlaySound('layer_change')) return;

        const volume = this.getConfig('sounds.navigation', 0.4);
        // Layer change is more significant - play a different sound
        this.audioManager.playLayerSound(volume);

        this.log('Layer change sound');
    }

    // ========================================
    // Event Handlers
    // ========================================

    _onCardChanged(event) {
        // Sound already played via intent
        this.log('Card changed audio feedback');
    }

    _onLayerChanged(event) {
        this._playLayerChangeSound();
        this.log('Layer changed audio feedback');
    }

    // ========================================
    // Helpers
    // ========================================

    _shouldPlaySound(eventType) {
        const enabled = this.getConfig('enabled', true);
        const eventEnabled = this.getConfig(`events.${eventType}`, true);
        const pluginEnabled = this.getPluginState('enabled', false);

        return enabled && eventEnabled && pluginEnabled;
    }

    /**
     * Update master volume at runtime
     * @param {number} volume - 0.0 to 1.0
     */
    setMasterVolume(volume) {
        if (this.audioManager) {
            this.audioManager.setVolume(volume);
            this.log(`Master volume set to ${volume}`);
        }
    }

    /**
     * Mute/unmute all audio
     * @param {boolean} muted
     */
    setMuted(muted) {
        if (this.audioManager) {
            this.audioManager.setVolume(muted ? 0 : this.getConfig('masterVolume', 0.3));
            this.log(`Audio ${muted ? 'muted' : 'unmuted'}`);
        }
    }
}

export default AudioFeedbackPlugin;
