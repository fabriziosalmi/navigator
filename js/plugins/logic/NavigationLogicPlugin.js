/**
 * NavigationLogicPlugin.js
 * 
 * The "interpreter" layer that translates raw input events into high-level
 * navigation intents. This is the bridge between input and output.
 * 
 * Listens for:
 * - input:keyboard:keydown
 * - input:gesture:swipe_*
 * - input:gesture:pinch
 * 
 * Emits:
 * - intent:navigate_left
 * - intent:navigate_right
 * - intent:navigate_up (change layer up)
 * - intent:navigate_down (change layer down)
 * - intent:select_card
 * - intent:toggle_fullscreen
 * - intent:go_back
 */

import { BasePlugin } from '../../core/BasePlugin.js';

export class NavigationLogicPlugin extends BasePlugin {
    constructor(config = {}) {
        super('NavigationLogic', {
            enabled: true,
            keyMapping: {
                ArrowLeft: 'navigate_left',
                ArrowRight: 'navigate_right',
                ArrowUp: 'navigate_up',
                ArrowDown: 'navigate_down',
                Enter: 'select_card',
                Escape: 'go_back',
                f: 'toggle_fullscreen'
            },
            gestureMapping: {
                swipe_left: 'navigate_left',
                swipe_right: 'navigate_right',
                swipe_up: 'navigate_up',
                swipe_down: 'navigate_down',
                pinch: 'select_card',
                fist: 'go_back'
            },
            ...config
        });

        this.navigationCooldown = 200; // ms between navigation actions
        this.lastNavigationTime = 0;
    }

    async onInit() {
        this.log('Initializing navigation logic');

        // Listen to keyboard events
        this.on('input:keyboard:keydown', (event) => {
            this._handleKeyboardInput(event);
        });

        this.on('input:keyboard:combo', (event) => {
            this._handleKeyboardCombo(event);
        });

        // Listen to gesture events
        this.on('input:gesture:swipe_left', (event) => {
            this._handleGestureInput('swipe_left', event);
        });

        this.on('input:gesture:swipe_right', (event) => {
            this._handleGestureInput('swipe_right', event);
        });

        this.on('input:gesture:swipe_up', (event) => {
            this._handleGestureInput('swipe_up', event);
        });

        this.on('input:gesture:swipe_down', (event) => {
            this._handleGestureInput('swipe_down', event);
        });

        this.on('input:gesture:pinch', (event) => {
            this._handleGestureInput('pinch', event);
        });

        this.on('input:gesture:fist', (event) => {
            this._handleGestureInput('fist', event);
        });

        this.on('input:gesture:point', (event) => {
            this._handleGestureInput('point', event);
        });

        // Listen for state changes that might affect navigation
        this.watchState('navigation.isTransitioning', (isTransitioning) => {
            this.setPluginState('canNavigate', !isTransitioning);
        });
    }

    async onStart() {
        if (!this.getConfig('enabled', true)) {
            this.log('Navigation logic disabled by config');
            return;
        }

        this.log('Starting navigation logic');
        this.setPluginState('enabled', true);
    }

    async onStop() {
        this.log('Stopping navigation logic');
        this.setPluginState('enabled', false);
    }

    // ========================================
    // Input Handlers
    // ========================================

    _handleKeyboardInput(event) {
        const { key } = event.payload;
        
        // Check key mapping
        const keyMapping = this.getConfig('keyMapping', {});
        const intent = keyMapping[key];

        if (intent) {
            this._emitIntent(intent, {
                inputType: 'keyboard',
                key,
                timestamp: event.timestamp
            });
        }
    }

    _handleKeyboardCombo(event) {
        const { combo, action } = event.payload;

        this.log('Keyboard combo detected:', combo, action);

        // Map combo actions to intents
        switch (action) {
            case 'toggle_debug':
                this.emit('intent:toggle_debug', { inputType: 'keyboard' });
                break;
            case 'toggle_hud':
                this.emit('intent:toggle_hud', { inputType: 'keyboard' });
                break;
        }
    }

    _handleGestureInput(gestureType, event) {
        // Check gesture mapping
        const gestureMapping = this.getConfig('gestureMapping', {});
        const intent = gestureMapping[gestureType];

        if (intent) {
            this._emitIntent(intent, {
                inputType: 'gesture',
                gestureType,
                timestamp: event.timestamp,
                data: event.payload
            });
        }
    }

    // ========================================
    // Intent Emission
    // ========================================

    _emitIntent(intent, metadata = {}) {
        const now = performance.now();

        // Check if we can navigate (cooldown + state)
        if (!this._canNavigate(now)) {
            this.log('Navigation blocked (cooldown or transitioning)');
            return;
        }

        // Check current state
        const isTransitioning = this.getState('navigation.isTransitioning', false);
        if (isTransitioning) {
            this.log('Navigation blocked (already transitioning)');
            return;
        }

        // Emit the intent event
        this.emit(`intent:${intent}`, {
            ...metadata,
            timestamp: now
        });

        // Update last navigation time
        this.lastNavigationTime = now;
        this.setPluginState('lastIntent', intent);
        this.setPluginState('lastIntentTime', now);

        this.log(`Intent emitted: ${intent}`, metadata);
    }

    _canNavigate(timestamp) {
        // Check cooldown
        if (timestamp - this.lastNavigationTime < this.navigationCooldown) {
            return false;
        }

        // Check state
        const canNavigate = this.getPluginState('canNavigate', true);
        if (!canNavigate) {
            return false;
        }

        return true;
    }

    // ========================================
    // Advanced Logic (Future)
    // ========================================

    /**
     * Contextual intent mapping based on current state
     * Example: In fullscreen mode, swipe_down means exit fullscreen instead of change layer
     */
    _getContextualIntent(baseIntent) {
        const fullscreenCard = this.getState('ui.fullscreenCard', null);

        if (fullscreenCard) {
            // In fullscreen mode, remap some intents
            if (baseIntent === 'navigate_down' || baseIntent === 'go_back') {
                return 'toggle_fullscreen';
            }
        }

        return baseIntent;
    }

    /**
     * Gesture combinations/sequences
     * Example: Swipe left + swipe right quickly = special action
     */
    _detectGestureSequence() {
        // TODO: Implement gesture sequence detection
        // Track recent gestures and detect patterns
    }
}

export default NavigationLogicPlugin;
