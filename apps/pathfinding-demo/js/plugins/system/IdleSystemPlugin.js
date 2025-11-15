/**
 * IdleSystemPlugin.js
 * 
 * Monitors user activity and pauses resource-intensive operations
 * (like MediaPipe hand tracking) when the user is idle.
 * Dramatically reduces CPU/battery usage during inactivity.
 * 
 * Events emitted:
 * - idle:start - System enters idle state
 * - idle:end - System exits idle state
 * - activity:detected - Any user activity detected
 * 
 * Events listened:
 * - input:* - Any input event (gesture, keyboard, voice)
 * - navigation:* - Navigation events
 * - user:* - User interactions
 */

import { BasePlugin } from '../../core/BasePlugin.js';

export class IdleSystemPlugin extends BasePlugin {
    constructor(config = {}) {
        super('IdleSystem', {
            enabled: true,
            idle_timeout_ms: 15000,         // 15 seconds default
            check_interval_ms: 1000,        // Check every second
            activity_events: [
                // Gesture events
                'input:gesture:hand_detected',
                'input:gesture:swipe_left',
                'input:gesture:swipe_right',
                'input:gesture:swipe_up',
                'input:gesture:swipe_down',
                'input:gesture:pinch',
                'input:gesture:fist',
                'input:gesture:point',
                
                // Keyboard events
                'input:keyboard:keydown',
                
                // Voice events
                'input:voice:command',
                
                // Navigation events
                'navigation:card:change',
                'navigation:layer:change',
                
                // User interactions
                'ui:button:click',
                'ui:card:click'
            ],
            ...config
        });

        this.lastActivityTime = Date.now();
        this.isIdle = false;
        this.checkInterval = null;
    }

    async onInit() {
        this.log('Initializing idle detection system');

        // Listen to all activity events
        const activityEvents = this.getConfig('activity_events', []);
        
        activityEvents.forEach(eventName => {
            this.on(eventName, () => this._onActivity());
        });

        // Also listen to generic mouse/keyboard activity on document
        this._setupDOMListeners();
    }

    async onStart() {
        if (!this.getConfig('enabled', true)) {
            this.log('Idle system disabled');
            return;
        }

        this.log('Starting idle detection');

        // Reset state
        this.lastActivityTime = Date.now();
        this.isIdle = false;
        this.setState('system.isIdle', false);

        // Start monitoring
        this._startMonitoring();
    }

    async onStop() {
        this._stopMonitoring();
        this._removeDOMListeners();
    }

    async onDestroy() {
        this._stopMonitoring();
        this._removeDOMListeners();
    }

    // ========================================
    // Activity Detection
    // ========================================

    _onActivity() {
        const wasIdle = this.isIdle;
        
        // Reset timer
        this.lastActivityTime = Date.now();

        // If we were idle, exit idle state
        if (wasIdle) {
            this._exitIdle();
        }

        // Emit activity event for other plugins
        this.emit('activity:detected', {
            timestamp: this.lastActivityTime,
            wasIdle: wasIdle
        });
    }

    _setupDOMListeners() {
        // Mouse movement
        this._mouseMoveHandler = () => this._onActivity();
        document.addEventListener('mousemove', this._mouseMoveHandler, { passive: true });

        // Mouse clicks
        this._mouseClickHandler = () => this._onActivity();
        document.addEventListener('click', this._mouseClickHandler);

        // Keyboard
        this._keyboardHandler = () => {
            this._onActivity();
            this.emit('input:keyboard:keydown', {});
        };
        document.addEventListener('keydown', this._keyboardHandler);

        // Touch events (mobile)
        this._touchHandler = () => this._onActivity();
        document.addEventListener('touchstart', this._touchHandler, { passive: true });

        // Scroll
        this._scrollHandler = () => this._onActivity();
        document.addEventListener('scroll', this._scrollHandler, { passive: true });
    }

    _removeDOMListeners() {
        if (this._mouseMoveHandler) {
            document.removeEventListener('mousemove', this._mouseMoveHandler);
        }
        if (this._mouseClickHandler) {
            document.removeEventListener('click', this._mouseClickHandler);
        }
        if (this._keyboardHandler) {
            document.removeEventListener('keydown', this._keyboardHandler);
        }
        if (this._touchHandler) {
            document.removeEventListener('touchstart', this._touchHandler);
        }
        if (this._scrollHandler) {
            document.removeEventListener('scroll', this._scrollHandler);
        }
    }

    // ========================================
    // Idle Monitoring
    // ========================================

    _startMonitoring() {
        const checkInterval = this.getConfig('check_interval_ms', 1000);

        this.checkInterval = setInterval(() => {
            this._checkIdleStatus();
        }, checkInterval);

        this.log('Idle monitoring started');
    }

    _stopMonitoring() {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
            this.checkInterval = null;
            this.log('Idle monitoring stopped');
        }
    }

    _checkIdleStatus() {
        // If already idle, nothing to check
        if (this.isIdle) {
            return;
        }

        const now = Date.now();
        const timeSinceActivity = now - this.lastActivityTime;
        const idleTimeout = this.getConfig('idle_timeout_ms', 15000);

        // Check if we should enter idle state
        if (timeSinceActivity >= idleTimeout) {
            this._enterIdle();
        }
    }

    _enterIdle() {
        if (this.isIdle) {
            return; // Already idle
        }

        this.log('Entering idle state');
        this.isIdle = true;

        // Update state
        this.setState('system.isIdle', true);
        this.setState('system.idleStartTime', Date.now());

        // Emit idle start event
        this.emit('idle:start', {
            timestamp: Date.now(),
            inactivityDuration: Date.now() - this.lastActivityTime
        });
    }

    _exitIdle() {
        if (!this.isIdle) {
            return; // Not idle
        }

        const idleDuration = Date.now() - this.getState('system.idleStartTime', Date.now());
        
        this.log(`Exiting idle state (was idle for ${Math.round(idleDuration / 1000)}s)`);
        this.isIdle = false;

        // Update state
        this.setState('system.isIdle', false);
        this.setState('system.idleStartTime', null);

        // Emit idle end event
        this.emit('idle:end', {
            timestamp: Date.now(),
            idleDuration: idleDuration
        });
    }

    // ========================================
    // Public API
    // ========================================

    /**
     * Manually trigger idle state (for testing/debugging)
     */
    forceIdle() {
        this._enterIdle();
    }

    /**
     * Manually exit idle state
     */
    forceActive() {
        this._exitIdle();
    }

    /**
     * Get current idle status
     */
    getIdleStatus() {
        return {
            isIdle: this.isIdle,
            lastActivityTime: this.lastActivityTime,
            timeSinceActivity: Date.now() - this.lastActivityTime,
            idleTimeout: this.getConfig('idle_timeout_ms', 15000)
        };
    }
}

export default IdleSystemPlugin;
