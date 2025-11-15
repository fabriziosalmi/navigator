/**
 * AppState.js (Enhanced for Core & Plugin Architecture)
 * 
 * Centralized state management - single source of truth for Navigator.
 * Now fully integrated with EventBus for reactive state changes.
 * 
 * Features:
 * - Immutable state updates via setState()
 * - Automatic event emission on state changes
 * - State history and time-travel debugging
 * - Computed properties
 * - State persistence
 */

import { EventBus } from './EventBus.js';

export class AppState {
    constructor(eventBus, initialState = {}) {
        if (!eventBus || !(eventBus instanceof EventBus)) {
            throw new Error('AppState requires an EventBus instance');
        }

        this.eventBus = eventBus;
        this.state = this._getDefaultState();
        this.stateHistory = [];
        this.maxHistorySize = 50;
        this.computed = {}; // Computed properties
        this.watchers = new Map(); // Key-specific watchers

        // Merge initial state
        if (initialState && Object.keys(initialState).length > 0) {
            this.state = { ...this.state, ...initialState };
        }

        // Setup computed properties
        this._setupComputedProperties();
    }

    /**
     * Get default initial state
     */
    _getDefaultState() {
        return {
            // Navigation state
            navigation: {
                currentLayer: 0,
                totalLayers: 6,
                layerName: 'video',
                currentCardIndex: 0,
                totalCards: 0,
                isTransitioning: false
            },

            // User progression
            user: {
                level: 1,
                experiencePoints: 0,
                navigationCount: 0,
                gesturesDetected: 0,
                achievements: []
            },

            // System state
            system: {
                isIdle: false,
                idleStartTime: null,
                cameraActive: false,
                handDetected: false,
                mediaPipeReady: false,
                performanceMode: 'high' // 'high' | 'medium' | 'low'
            },

            // UI state
            ui: {
                startScreenVisible: true,
                hudVisible: false,
                fullscreenCard: null,
                debugPanelVisible: false
            },

            // Input state
            input: {
                lastGesture: null,
                lastGestureTime: 0,
                keyboardEnabled: true,
                gestureEnabled: true,
                voiceEnabled: false
            },

            // Performance metrics
            performance: {
                fps: 0,
                lastFrameTime: 0,
                averageFps: 60,
                frameCount: 0
            },

            // Plugins state (for plugin-specific data)
            plugins: {}
        };
    }

    /**
     * Get a value from state using dot notation path
     * @param {string} path - e.g., 'navigation.currentLayer'
     * @param {*} defaultValue - Default if path doesn't exist
     * @returns {*} State value
     */
    get(path, defaultValue = undefined) {
        const keys = path.split('.');
        let value = this.state;

        for (const key of keys) {
            if (value && typeof value === 'object' && key in value) {
                value = value[key];
            } else {
                return defaultValue;
            }
        }

        return value;
    }

    /**
     * Set state values (supports partial updates and deep paths)
     * @param {string|Object} pathOrUpdates - Path string or updates object
     * @param {*} value - Value to set (if path is string)
     * @param {Object} options - { silent: boolean, merge: boolean }
     */
    setState(pathOrUpdates, value, options = {}) {
        const { silent = false, merge = true } = options;
        
        let updates;
        if (typeof pathOrUpdates === 'string') {
            updates = this._pathToObject(pathOrUpdates, value);
        } else {
            updates = pathOrUpdates;
        }

        const previousState = JSON.parse(JSON.stringify(this.state));
        
        // Apply updates
        if (merge) {
            this.state = this._deepMerge(this.state, updates);
        } else {
            this.state = { ...this.state, ...updates };
        }

        // Add to history
        this._addToHistory(previousState);

        // Emit change events
        if (!silent) {
            this._emitStateChanges(previousState, this.state, updates);
        }

        // Call watchers
        this._callWatchers(updates);

        // Update computed properties
        this._updateComputedProperties();
    }

    /**
     * Watch a specific state path for changes
     * @param {string} path - State path to watch
     * @param {Function} callback - (newValue, oldValue) => {}
     * @returns {Function} Unwatch function
     */
    watch(path, callback) {
        if (!this.watchers.has(path)) {
            this.watchers.set(path, new Set());
        }
        this.watchers.get(path).add(callback);

        // Return unwatch function
        return () => {
            const watchers = this.watchers.get(path);
            if (watchers) {
                watchers.delete(callback);
            }
        };
    }

    /**
     * Get entire state (read-only copy)
     * @returns {Object} Deep copy of state
     */
    getState() {
        return JSON.parse(JSON.stringify(this.state));
    }

    /**
     * Reset state to default
     * @param {boolean} silent - Don't emit events
     */
    reset(silent = false) {
        const previousState = this.state;
        this.state = this._getDefaultState();
        
        if (!silent) {
            this.eventBus.emit('state:reset', {
                previousState,
                source: 'AppState'
            });
        }
    }

    /**
     * Get state history
     * @param {number} limit - Max entries to return
     * @returns {Array} State history
     */
    getHistory(limit = 10) {
        return this.stateHistory.slice(0, limit);
    }

    /**
     * Time travel - restore previous state
     * @param {number} stepsBack - How many states to go back
     */
    timeTravel(stepsBack = 1) {
        if (stepsBack < 1 || stepsBack > this.stateHistory.length) {
            console.warn('AppState.timeTravel: Invalid stepsBack value');
            return;
        }

        const targetState = this.stateHistory[stepsBack - 1];
        this.state = JSON.parse(JSON.stringify(targetState));

        this.eventBus.emit('state:timetravel', {
            stepsBack,
            state: this.state,
            source: 'AppState'
        });
    }

    /**
     * Persist state to localStorage
     * @param {string} key - Storage key
     */
    persist(key = 'navigator_state') {
        try {
            localStorage.setItem(key, JSON.stringify(this.state));
        } catch (error) {
            console.error('AppState.persist: Failed to save state', error);
        }
    }

    /**
     * Restore state from localStorage
     * @param {string} key - Storage key
     * @returns {boolean} Whether restore was successful
     */
    restore(key = 'navigator_state') {
        try {
            const saved = localStorage.getItem(key);
            if (saved) {
                const restoredState = JSON.parse(saved);
                this.setState(restoredState, null, { merge: false });
                this.eventBus.emit('state:restored', {
                    source: 'AppState',
                    key
                });
                return true;
            }
        } catch (error) {
            console.error('AppState.restore: Failed to restore state', error);
        }
        return false;
    }

    // ========================================
    // Private Methods
    // ========================================

    _pathToObject(path, value) {
        const keys = path.split('.');
        const result = {};
        let current = result;

        for (let i = 0; i < keys.length - 1; i++) {
            current[keys[i]] = {};
            current = current[keys[i]];
        }

        current[keys[keys.length - 1]] = value;
        return result;
    }

    _deepMerge(target, source) {
        const result = { ...target };

        for (const key in source) {
            if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                result[key] = this._deepMerge(result[key] || {}, source[key]);
            } else {
                result[key] = source[key];
            }
        }

        return result;
    }

    _addToHistory(state) {
        this.stateHistory.unshift(state);
        if (this.stateHistory.length > this.maxHistorySize) {
            this.stateHistory.pop();
        }
    }

    _emitStateChanges(previousState, currentState, updates) {
        // Emit general state change
        this.eventBus.emit('state:changed', {
            previous: previousState,
            current: currentState,
            updates,
            source: 'AppState'
        });

        // Emit specific change events for top-level keys
        for (const key in updates) {
            this.eventBus.emit(`state:${key}:changed`, {
                previous: previousState[key],
                current: currentState[key],
                source: 'AppState'
            });
        }
    }

    _callWatchers(updates) {
        for (const [path, watchers] of this.watchers) {
            const newValue = this.get(path);
            const keys = path.split('.');
            
            // Check if this path was affected by the update
            let isAffected = false;
            for (const updateKey in updates) {
                if (path.startsWith(updateKey) || updateKey.startsWith(path)) {
                    isAffected = true;
                    break;
                }
            }

            if (isAffected) {
                for (const callback of watchers) {
                    try {
                        callback(newValue);
                    } catch (error) {
                        console.error('AppState: Watcher error', error);
                    }
                }
            }
        }
    }

    _setupComputedProperties() {
        // Example computed properties
        Object.defineProperty(this.computed, 'isNavigating', {
            get: () => this.get('navigation.isTransitioning', false)
        });

        Object.defineProperty(this.computed, 'canNavigate', {
            get: () => !this.get('navigation.isTransitioning') && 
                       !this.get('system.isIdle')
        });

        Object.defineProperty(this.computed, 'isInputReady', {
            get: () => this.get('system.mediaPipeReady', false) ||
                       this.get('input.keyboardEnabled', true)
        });
    }

    _updateComputedProperties() {
        // Emit event if computed properties changed
        this.eventBus.emit('state:computed:updated', {
            computed: { ...this.computed },
            source: 'AppState'
        });
    }
}

export default AppState;
