/**
 * NavigatorCore.js
 * 
 * The heart of the Navigator ecosystem.
 * Minimal, framework-agnostic core that manages:
 * - Plugin lifecycle
 * - Event-driven communication
 * - Centralized state
 * - System lifecycle
 * 
 * The Core knows NOTHING about:
 * - DOM manipulation
 * - Input devices (hands, keyboard, voice)
 * - Output rendering
 * 
 * Everything is handled by plugins!
 */

import { EventBus } from './EventBus.js';
import { AppState } from './AppState.js';

export class NavigatorCore {
    constructor(config = {}) {
        this.config = {
            debugMode: config.debugMode || false,
            autoStart: config.autoStart || false,
            ...config
        };

        // Core systems
        this.eventBus = new EventBus({
            debugMode: this.config.debugMode,
            maxHistorySize: 200
        });

        this.state = new AppState(this.eventBus, config.initialState);

        // Plugin management
        this.plugins = new Map(); // name -> plugin instance
        this.pluginOrder = []; // Ordered list for init/start/stop
        this.pluginStates = new Map(); // name -> 'initialized' | 'started' | 'stopped'

        // Lifecycle state
        this.isInitialized = false;
        this.isRunning = false;

        // Performance monitoring
        this.startTime = null;
        this.frameCount = 0;
        this.lastFpsUpdate = 0;

        // Setup core event listeners
        this._setupCoreListeners();

        // Log initialization
        if (this.config.debugMode) {
            // console.log('🚀 NavigatorCore initialized', {
                plugins: this.plugins.size,
                config: this.config
            });
        }
    }

    // ========================================
    // Lifecycle Management
    // ========================================

    /**
     * Initialize the core and all plugins
     * @returns {Promise<void>}
     */
    async init() {
        if (this.isInitialized) {
            console.warn('NavigatorCore: Already initialized');
            return;
        }

        this.eventBus.emit('core:init:start', { source: 'NavigatorCore' });

        try {
            // Initialize plugins in order
            for (const name of this.pluginOrder) {
                const plugin = this.plugins.get(name);
                await this._initPlugin(name, plugin);
            }

            this.isInitialized = true;
            this.eventBus.emit('core:init:complete', { source: 'NavigatorCore' });

            if (this.config.debugMode) {
                // console.log('✅ NavigatorCore initialized successfully');
            }

            // Auto-start if configured
            if (this.config.autoStart) {
                await this.start();
            }

        } catch (error) {
            this.eventBus.emit('core:error', {
                message: 'Core initialization failed',
                error,
                source: 'NavigatorCore'
            });
            throw error;
        }
    }

    /**
     * Start the core and all plugins
     * @returns {Promise<void>}
     */
    async start() {
        if (!this.isInitialized) {
            throw new Error('NavigatorCore: Must call init() before start()');
        }

        if (this.isRunning) {
            console.warn('NavigatorCore: Already running');
            return;
        }

        this.eventBus.emit('core:start:begin', { source: 'NavigatorCore' });

        try {
            this.startTime = performance.now();

            // Start plugins in order
            for (const name of this.pluginOrder) {
                const plugin = this.plugins.get(name);
                await this._startPlugin(name, plugin);
            }

            this.isRunning = true;
            this.eventBus.emit('core:start:complete', { source: 'NavigatorCore' });

            // Start performance monitoring
            this._startPerformanceMonitoring();

            if (this.config.debugMode) {
                // console.log('▶️ NavigatorCore started');
            }

        } catch (error) {
            this.eventBus.emit('core:error', {
                message: 'Core start failed',
                error,
                source: 'NavigatorCore'
            });
            throw error;
        }
    }

    /**
     * Pause/stop the core and all plugins
     * @returns {Promise<void>}
     */
    async stop() {
        if (!this.isRunning) {
            console.warn('NavigatorCore: Not running');
            return;
        }

        this.eventBus.emit('core:stop:begin', { source: 'NavigatorCore' });

        try {
            // Stop plugins in reverse order
            for (let i = this.pluginOrder.length - 1; i >= 0; i--) {
                const name = this.pluginOrder[i];
                const plugin = this.plugins.get(name);
                await this._stopPlugin(name, plugin);
            }

            this.isRunning = false;
            this.eventBus.emit('core:stop:complete', { source: 'NavigatorCore' });

            if (this.config.debugMode) {
                // console.log('⏸️ NavigatorCore stopped');
            }

        } catch (error) {
            this.eventBus.emit('core:error', {
                message: 'Core stop failed',
                error,
                source: 'NavigatorCore'
            });
            throw error;
        }
    }

    /**
     * Completely destroy the core and cleanup
     * @returns {Promise<void>}
     */
    async destroy() {
        this.eventBus.emit('core:destroy:begin', { source: 'NavigatorCore' });

        try {
            // Stop if running
            if (this.isRunning) {
                await this.stop();
            }

            // Destroy plugins in reverse order
            for (let i = this.pluginOrder.length - 1; i >= 0; i--) {
                const name = this.pluginOrder[i];
                const plugin = this.plugins.get(name);
                await this._destroyPlugin(name, plugin);
            }

            // Clear everything
            this.plugins.clear();
            this.pluginStates.clear();
            this.pluginOrder = [];
            this.eventBus.clear();

            this.isInitialized = false;
            this.eventBus.emit('core:destroy:complete', { source: 'NavigatorCore' });

            if (this.config.debugMode) {
                // console.log('🗑️ NavigatorCore destroyed');
            }

        } catch (error) {
            console.error('NavigatorCore: Destroy failed', error);
            throw error;
        }
    }

    // ========================================
    // Plugin Management
    // ========================================

    /**
     * Register a plugin
     * @param {Object} plugin - Plugin instance with { name, init, start, stop }
     * @param {Object} options - { priority: number, config: {} }
     * @returns {NavigatorCore} For chaining
     */
    registerPlugin(plugin, options = {}) {
        // Validate plugin
        if (!plugin || !plugin.name) {
            throw new Error('NavigatorCore: Plugin must have a name property');
        }

        if (this.plugins.has(plugin.name)) {
            throw new Error(`NavigatorCore: Plugin "${plugin.name}" already registered`);
        }

        // Validate plugin interface
        const requiredMethods = ['init'];
        for (const method of requiredMethods) {
            if (typeof plugin[method] !== 'function') {
                throw new Error(`NavigatorCore: Plugin "${plugin.name}" missing required method: ${method}`);
            }
        }

        // Store plugin
        this.plugins.set(plugin.name, plugin);
        this.pluginStates.set(plugin.name, 'registered');

        // Add to order (respecting priority)
        const priority = options.priority || 0;
        plugin._priority = priority;

        let inserted = false;
        for (let i = 0; i < this.pluginOrder.length; i++) {
            const existingPlugin = this.plugins.get(this.pluginOrder[i]);
            if (priority > (existingPlugin._priority || 0)) {
                this.pluginOrder.splice(i, 0, plugin.name);
                inserted = true;
                break;
            }
        }
        if (!inserted) {
            this.pluginOrder.push(plugin.name);
        }

        // Pass plugin-specific config
        if (options.config) {
            plugin._config = options.config;
        }

        this.eventBus.emit('core:plugin:registered', {
            pluginName: plugin.name,
            priority,
            source: 'NavigatorCore'
        });

        if (this.config.debugMode) {
            // console.log(`🔌 Plugin registered: ${plugin.name}`, { priority });
        }

        return this; // For chaining
    }

    /**
     * Get a plugin instance by name
     * @param {string} name - Plugin name
     * @returns {Object|null} Plugin instance
     */
    getPlugin(name) {
        return this.plugins.get(name) || null;
    }

    /**
     * Check if plugin is registered
     * @param {string} name - Plugin name
     * @returns {boolean}
     */
    hasPlugin(name) {
        return this.plugins.has(name);
    }

    /**
     * Get all registered plugin names
     * @returns {Array<string>}
     */
    getPluginNames() {
        return Array.from(this.plugins.keys());
    }

    /**
     * Unregister a plugin (must be stopped first)
     * @param {string} name - Plugin name
     */
    async unregisterPlugin(name) {
        const plugin = this.plugins.get(name);
        if (!plugin) {
            console.warn(`NavigatorCore: Plugin "${name}" not found`);
            return;
        }

        const state = this.pluginStates.get(name);
        if (state === 'started') {
            throw new Error(`NavigatorCore: Cannot unregister running plugin "${name}". Stop it first.`);
        }

        // Destroy if needed
        if (state === 'initialized') {
            await this._destroyPlugin(name, plugin);
        }

        // Remove from registry
        this.plugins.delete(name);
        this.pluginStates.delete(name);
        this.pluginOrder = this.pluginOrder.filter(n => n !== name);

        this.eventBus.emit('core:plugin:unregistered', {
            pluginName: name,
            source: 'NavigatorCore'
        });

        if (this.config.debugMode) {
            // console.log(`🔌 Plugin unregistered: ${name}`);
        }
    }

    // ========================================
    // Utility Methods
    // ========================================

    /**
     * Get core statistics
     * @returns {Object}
     */
    getStats() {
        return {
            uptime: this.startTime ? performance.now() - this.startTime : 0,
            isInitialized: this.isInitialized,
            isRunning: this.isRunning,
            plugins: {
                total: this.plugins.size,
                byState: this._getPluginsByState(),
                order: this.pluginOrder
            },
            events: this.eventBus.getStats(),
            state: {
                historySize: this.state.getHistory().length
            }
        };
    }

    /**
     * Enable/disable debug mode at runtime
     * @param {boolean} enabled
     */
    setDebugMode(enabled) {
        this.config.debugMode = enabled;
        this.eventBus.debugMode = enabled;
        
        if (enabled) {
            // console.log('🐛 Debug mode enabled');
        }
    }

    // ========================================
    // Private Methods
    // ========================================

    async _initPlugin(name, plugin) {
        try {
            if (this.config.debugMode) {
                // console.log(`🔧 Initializing plugin: ${name}`);
            }

            // Pass core interface to plugin
            await plugin.init(this);

            this.pluginStates.set(name, 'initialized');
            this.eventBus.emit('core:plugin:initialized', {
                pluginName: name,
                source: 'NavigatorCore'
            });

        } catch (error) {
            console.error(`NavigatorCore: Failed to initialize plugin "${name}"`, error);
            this.eventBus.emit('core:plugin:error', {
                pluginName: name,
                phase: 'init',
                error,
                source: 'NavigatorCore'
            });
            throw error;
        }
    }

    async _startPlugin(name, plugin) {
        try {
            if (typeof plugin.start === 'function') {
                if (this.config.debugMode) {
                    // console.log(`▶️ Starting plugin: ${name}`);
                }
                await plugin.start();
            }

            this.pluginStates.set(name, 'started');
            this.eventBus.emit('core:plugin:started', {
                pluginName: name,
                source: 'NavigatorCore'
            });

        } catch (error) {
            console.error(`NavigatorCore: Failed to start plugin "${name}"`, error);
            this.eventBus.emit('core:plugin:error', {
                pluginName: name,
                phase: 'start',
                error,
                source: 'NavigatorCore'
            });
            throw error;
        }
    }

    async _stopPlugin(name, plugin) {
        try {
            if (typeof plugin.stop === 'function') {
                if (this.config.debugMode) {
                    // console.log(`⏸️ Stopping plugin: ${name}`);
                }
                await plugin.stop();
            }

            this.pluginStates.set(name, 'stopped');
            this.eventBus.emit('core:plugin:stopped', {
                pluginName: name,
                source: 'NavigatorCore'
            });

        } catch (error) {
            console.error(`NavigatorCore: Failed to stop plugin "${name}"`, error);
            this.eventBus.emit('core:plugin:error', {
                pluginName: name,
                phase: 'stop',
                error,
                source: 'NavigatorCore'
            });
        }
    }

    async _destroyPlugin(name, plugin) {
        try {
            if (typeof plugin.destroy === 'function') {
                if (this.config.debugMode) {
                    // console.log(`🗑️ Destroying plugin: ${name}`);
                }
                await plugin.destroy();
            }

            this.eventBus.emit('core:plugin:destroyed', {
                pluginName: name,
                source: 'NavigatorCore'
            });

        } catch (error) {
            console.error(`NavigatorCore: Failed to destroy plugin "${name}"`, error);
        }
    }

    _setupCoreListeners() {
        // Listen for errors
        this.eventBus.on('system:error', (event) => {
            console.error('System Error:', event.payload);
        });

        // Listen for state changes to update performance metrics
        this.eventBus.on('state:performance:changed', (event) => {
            // Update FPS in state if needed
        });
    }

    _startPerformanceMonitoring() {
        const updateFps = () => {
            if (!this.isRunning) {
                return;
            }

            const now = performance.now();
            this.frameCount++;

            if (now - this.lastFpsUpdate >= 1000) {
                const fps = Math.round(this.frameCount * 1000 / (now - this.lastFpsUpdate));
                
                this.state.setState('performance.fps', fps, { silent: true });
                this.state.setState('performance.frameCount', this.frameCount, { silent: true });

                this.frameCount = 0;
                this.lastFpsUpdate = now;
            }

            requestAnimationFrame(updateFps);
        };

        this.lastFpsUpdate = performance.now();
        requestAnimationFrame(updateFps);
    }

    _getPluginsByState() {
        const byState = {
            registered: 0,
            initialized: 0,
            started: 0,
            stopped: 0
        };

        for (const state of this.pluginStates.values()) {
            byState[state] = (byState[state] || 0) + 1;
        }

        return byState;
    }
}

export default NavigatorCore;
