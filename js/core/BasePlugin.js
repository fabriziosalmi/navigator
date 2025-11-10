/**
 * BasePlugin.js
 * 
 * Abstract base class for Navigator plugins.
 * Provides standard interface and helper methods.
 * 
 * All plugins should extend this class or implement its interface:
 * - name: string (required)
 * - init(core): Promise<void> (required)
 * - start(): Promise<void> (optional)
 * - stop(): Promise<void> (optional)
 * - destroy(): Promise<void> (optional)
 */

export class BasePlugin {
    constructor(name, config = {}) {
        if (!name) {
            throw new Error('BasePlugin: name is required');
        }

        this.name = name;
        this.config = config;
        this.core = null;
        this.eventBus = null;
        this.state = null;
        this.isInitialized = false;
        this.isRunning = false;

        // Subscriptions for cleanup
        this._eventSubscriptions = [];
        this._stateWatchers = [];
    }

    /**
     * Initialize the plugin
     * @param {NavigatorCore} core - Core instance
     */
    async init(core) {
        if (this.isInitialized) {
            console.warn(`${this.name}: Already initialized`);
            return;
        }

        this.core = core;
        this.eventBus = core.eventBus;
        this.state = core.state;

        // Merge plugin-specific config
        if (core.config.plugins && core.config.plugins[this.name]) {
            this.config = {
                ...this.config,
                ...core.config.plugins[this.name]
            };
        }

        this.isInitialized = true;

        // Call subclass implementation
        if (typeof this.onInit === 'function') {
            await this.onInit();
        }
    }

    /**
     * Start the plugin
     */
    async start() {
        if (!this.isInitialized) {
            throw new Error(`${this.name}: Cannot start before init`);
        }

        if (this.isRunning) {
            console.warn(`${this.name}: Already running`);
            return;
        }

        this.isRunning = true;

        // Call subclass implementation
        if (typeof this.onStart === 'function') {
            await this.onStart();
        }
    }

    /**
     * Stop the plugin
     */
    async stop() {
        if (!this.isRunning) {
            console.warn(`${this.name}: Not running`);
            return;
        }

        this.isRunning = false;

        // Call subclass implementation
        if (typeof this.onStop === 'function') {
            await this.onStop();
        }
    }

    /**
     * Destroy the plugin and cleanup
     */
    async destroy() {
        // Stop if running
        if (this.isRunning) {
            await this.stop();
        }

        // Cleanup subscriptions
        this._cleanupSubscriptions();

        // Call subclass implementation
        if (typeof this.onDestroy === 'function') {
            await this.onDestroy();
        }

        this.isInitialized = false;
        this.core = null;
        this.eventBus = null;
        this.state = null;
    }

    // ========================================
    // Helper Methods (available to subclasses)
    // ========================================

    /**
     * Subscribe to an event (auto-cleanup on destroy)
     * @param {string} eventName - Event to listen for
     * @param {Function} handler - Event handler
     * @param {Object} options - Event options
     */
    on(eventName, handler, options) {
        if (!this.eventBus) {
            throw new Error(`${this.name}: Cannot subscribe before init`);
        }

        const unsubscribe = this.eventBus.on(eventName, handler, options);
        this._eventSubscriptions.push(unsubscribe);
        return unsubscribe;
    }

    /**
     * Emit an event
     * @param {string} eventName - Event name
     * @param {*} payload - Event data
     */
    emit(eventName, payload = {}) {
        if (!this.eventBus) {
            throw new Error(`${this.name}: Cannot emit before init`);
        }

        // Add source to payload
        const eventPayload = {
            ...payload,
            source: this.name
        };

        return this.eventBus.emit(eventName, eventPayload);
    }

    /**
     * Get state value
     * @param {string} path - State path
     * @param {*} defaultValue - Default value
     */
    getState(path, defaultValue) {
        if (!this.state) {
            throw new Error(`${this.name}: Cannot get state before init`);
        }
        return this.state.get(path, defaultValue);
    }

    /**
     * Set state value
     * @param {string|Object} pathOrUpdates - Path or updates object
     * @param {*} value - Value (if path is string)
     * @param {Object} options - State options
     */
    setState(pathOrUpdates, value, options) {
        if (!this.state) {
            throw new Error(`${this.name}: Cannot set state before init`);
        }
        return this.state.setState(pathOrUpdates, value, options);
    }

    /**
     * Watch state path (auto-cleanup on destroy)
     * @param {string} path - State path to watch
     * @param {Function} callback - Change callback
     */
    watchState(path, callback) {
        if (!this.state) {
            throw new Error(`${this.name}: Cannot watch state before init`);
        }

        const unwatch = this.state.watch(path, callback);
        this._stateWatchers.push(unwatch);
        return unwatch;
    }

    /**
     * Get plugin-specific state namespace
     * @param {string} key - Key within plugin state
     * @param {*} defaultValue - Default value
     */
    getPluginState(key, defaultValue) {
        return this.getState(`plugins.${this.name}.${key}`, defaultValue);
    }

    /**
     * Set plugin-specific state
     * @param {string} key - Key within plugin state
     * @param {*} value - Value
     */
    setPluginState(key, value) {
        return this.setState(`plugins.${this.name}.${key}`, value);
    }

    /**
     * Get config value
     * @param {string} path - Config path
     * @param {*} defaultValue - Default value
     */
    getConfig(path, defaultValue) {
        const keys = path.split('.');
        let value = this.config;

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
     * Log message (respects debug mode)
     * @param  {...any} args - Log arguments
     */
    log(...args) {
        if (this.core && this.core.config.debugMode) {
            // console.log(`[${this.name}]`, ...args);
        }
    }

    /**
     * Log warning
     * @param  {...any} args - Warning arguments
     */
    warn(...args) {
        console.warn(`[${this.name}]`, ...args);
    }

    /**
     * Log error
     * @param  {...any} args - Error arguments
     */
    error(...args) {
        console.error(`[${this.name}]`, ...args);
        
        // Emit error event
        if (this.eventBus) {
            this.emit('system:error', {
                message: args[0],
                plugin: this.name,
                args
            });
        }
    }

    // ========================================
    // Private Methods
    // ========================================

    _cleanupSubscriptions() {
        // Unsubscribe from all events
        for (const unsubscribe of this._eventSubscriptions) {
            try {
                unsubscribe();
            } catch (error) {
                console.error(`${this.name}: Error unsubscribing`, error);
            }
        }
        this._eventSubscriptions = [];

        // Remove all state watchers
        for (const unwatch of this._stateWatchers) {
            try {
                unwatch();
            } catch (error) {
                console.error(`${this.name}: Error unwatching state`, error);
            }
        }
        this._stateWatchers = [];
    }
}

export default BasePlugin;
