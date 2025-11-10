/**
 * KeyboardInputPlugin.js
 * 
 * Captures keyboard input and emits raw input events.
 * Completely decoupled from navigation logic.
 * 
 * Events emitted:
 * - input:keyboard:keydown
 * - input:keyboard:keyup
 * - input:keyboard:combo (for key combinations)
 */

import { BasePlugin } from '../../core/BasePlugin.js';

export class KeyboardInputPlugin extends BasePlugin {
    constructor(config = {}) {
        super('KeyboardInput', {
            enabled: true,
            preventDefaults: true,
            keyCombos: {
                'Ctrl+d': 'toggle_debug',
                'Ctrl+h': 'toggle_hud'
            },
            ...config
        });

        this.pressedKeys = new Set();
        this.lastKeyTime = 0;
        this.keyRepeatDelay = 150; // ms between repeats
    }

    async onInit() {
        this.log('Initializing keyboard input');
        
        // Bind event handlers
        this._handleKeyDown = this._handleKeyDown.bind(this);
        this._handleKeyUp = this._handleKeyUp.bind(this);
    }

    async onStart() {
        if (!this.getConfig('enabled', true)) {
            this.log('Keyboard input disabled by config');
            return;
        }

        this.log('Starting keyboard input');

        // Attach keyboard listeners
        window.addEventListener('keydown', this._handleKeyDown);
        window.addEventListener('keyup', this._handleKeyUp);

        this.setPluginState('enabled', true);
    }

    async onStop() {
        this.log('Stopping keyboard input');

        // Remove keyboard listeners
        window.removeEventListener('keydown', this._handleKeyDown);
        window.removeEventListener('keyup', this._handleKeyUp);

        this.pressedKeys.clear();
        this.setPluginState('enabled', false);
    }

    async onDestroy() {
        this.pressedKeys.clear();
    }

    // ========================================
    // Event Handlers
    // ========================================

    _handleKeyDown(event) {
        const now = performance.now();
        
        // Prevent default for configured keys
        if (this.getConfig('preventDefaults', true)) {
            const preventKeys = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space'];
            if (preventKeys.includes(event.key)) {
                event.preventDefault();
            }
        }

        // Track pressed keys
        this.pressedKeys.add(event.key);

        // Check for key combinations
        const combo = this._getKeyCombo();
        if (combo) {
            const comboAction = this.getConfig(`keyCombos.${combo}`);
            if (comboAction) {
                event.preventDefault();
                this.emit('input:keyboard:combo', {
                    combo,
                    action: comboAction,
                    event: this._sanitizeEvent(event)
                });
                return;
            }
        }

        // Rate limit key repeats
        if (now - this.lastKeyTime < this.keyRepeatDelay) {
            return;
        }
        this.lastKeyTime = now;

        // Emit raw keydown event
        this.emit('input:keyboard:keydown', {
            key: event.key,
            code: event.code,
            altKey: event.altKey,
            ctrlKey: event.ctrlKey,
            shiftKey: event.shiftKey,
            metaKey: event.metaKey,
            repeat: event.repeat,
            timestamp: now,
            event: this._sanitizeEvent(event)
        });

        // Update state
        this.setPluginState('lastKey', event.key);
        this.setPluginState('lastKeyTime', now);
    }

    _handleKeyUp(event) {
        this.pressedKeys.delete(event.key);

        this.emit('input:keyboard:keyup', {
            key: event.key,
            code: event.code,
            timestamp: performance.now(),
            event: this._sanitizeEvent(event)
        });
    }

    // ========================================
    // Helper Methods
    // ========================================

    _getKeyCombo() {
        const keys = Array.from(this.pressedKeys).sort();
        if (keys.length < 2) return null;

        // Build combo string (e.g., "Ctrl+d")
        const modifiers = [];
        const regular = [];

        for (const key of keys) {
            if (['Control', 'Alt', 'Shift', 'Meta'].includes(key)) {
                modifiers.push(key === 'Control' ? 'Ctrl' : key);
            } else {
                regular.push(key);
            }
        }

        if (regular.length === 0) return null;

        return [...modifiers, ...regular].join('+');
    }

    _sanitizeEvent(event) {
        // Return a serializable subset of the event
        return {
            type: event.type,
            key: event.key,
            code: event.code,
            timeStamp: event.timeStamp
        };
    }
}

export default KeyboardInputPlugin;
