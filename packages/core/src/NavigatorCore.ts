/**
 * NavigatorCore.ts
 * 
 * The heart of the Navigator ecosystem.
 * Minimal, framework-agnostic core that manages:
 * - Plugin lifecycle
 * - Event-driven communication
 * - Centralized state
 * - System lifecycle
 */

import { EventBus } from './EventBus';
import { AppState, NavigatorState } from './AppState';
import { UserSessionHistory } from './intelligence/UserSessionHistory';
import type { DeepPartial } from './AppState';
import type { Action } from '@navigator.menu/types';

/**
 * Core configuration options
 */
export interface NavigatorCoreConfig {
  /** Enable debug logging */
  debugMode?: boolean;
  /** Automatically start after init */
  autoStart?: boolean;
  /** Initial state to pass to AppState */
  initialState?: DeepPartial<NavigatorState>;
  /** Maximum size of session history buffer */
  historyMaxSize?: number;
}

/**
 * Plugin interface that all plugins must implement
 */
export interface INavigatorPlugin {
  /** Unique plugin name */
  name: string;
  /** Initialize plugin (required) */
  init(core: NavigatorCore): Promise<void> | void;
  /** Start plugin (optional) */
  start?(): Promise<void> | void;
  /** Stop plugin (optional) */
  stop?(): Promise<void> | void;
  /** Destroy plugin (optional) */
  destroy?(): Promise<void> | void;
  /** Internal priority for load order */
  _priority?: number;
  /** Internal plugin-specific config */
  _config?: any;
}

/**
 * Plugin registration options
 */
export interface PluginOptions {
  /** Load priority (higher = loads first) */
  priority?: number;
  /** Plugin-specific configuration */
  config?: any;
}

/**
 * Plugin state tracking
 */
type PluginState = 'registered' | 'initialized' | 'started' | 'stopped' | 'destroyed';

/**
 * NavigatorCore - The central orchestrator
 */
export class NavigatorCore {
  /** Configuration */
  public readonly config: Required<NavigatorCoreConfig>;
  
  /** Event bus instance (read-only access) */
  public readonly eventBus: EventBus;
  
  /** App state instance (read-only access) */
  public readonly state: AppState;
  
  /** User session history tracker */
  public readonly history: UserSessionHistory;
  
  /** Initialization status */
  public isInitialized: boolean;
  
  /** Running status */
  public isRunning: boolean;

  /** Registered plugins */
  private plugins: Map<string, INavigatorPlugin>;
  
  /** Plugin load order */
  private pluginOrder: string[];
  
  /** Plugin state tracking */
  private pluginStates: Map<string, PluginState>;
  
  /** Performance tracking */
  private startTime: number | null;
  private frameCount: number;
  private lastFpsUpdate: number;

  constructor(config: NavigatorCoreConfig = {}) {
    this.config = {
      debugMode: config.debugMode || false,
      autoStart: config.autoStart || false,
      initialState: config.initialState || {},
      historyMaxSize: config.historyMaxSize || 100
    };

    // Initialize core systems
    this.eventBus = new EventBus({
      debugMode: this.config.debugMode,
      maxHistorySize: 200
    });

    this.state = new AppState(this.eventBus, this.config.initialState);
    
    this.history = new UserSessionHistory(this.config.historyMaxSize);

    // Plugin management
    this.plugins = new Map();
    this.pluginOrder = [];
    this.pluginStates = new Map();

    // Lifecycle state
    this.isInitialized = false;
    this.isRunning = false;

    // Performance tracking
    this.startTime = null;
    this.frameCount = 0;
    this.lastFpsUpdate = 0;

    // Setup core event listeners
    this._setupCoreListeners();

    if (this.config.debugMode) {
      console.log('🚀 NavigatorCore initialized', {
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
   */
  async init(): Promise<void> {
    if (this.isInitialized) {
      console.warn('NavigatorCore: Already initialized');
      return;
    }

    this.eventBus.emit('core:init:start', { source: 'NavigatorCore' });

    try {
      // Initialize plugins in order
      for (const name of this.pluginOrder) {
        const plugin = this.plugins.get(name)!;
        await this._initPlugin(name, plugin);
      }

      this.isInitialized = true;
      this.eventBus.emit('core:init:complete', { source: 'NavigatorCore' });

      if (this.config.debugMode) {
        console.log('✅ NavigatorCore initialized successfully');
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
   */
  async start(): Promise<void> {
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
        const plugin = this.plugins.get(name)!;
        await this._startPlugin(name, plugin);
      }

      this.isRunning = true;
      this.eventBus.emit('core:start:complete', { source: 'NavigatorCore' });

      // Start performance monitoring
      this._startPerformanceMonitoring();

      if (this.config.debugMode) {
        console.log('▶️ NavigatorCore started');
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
   */
  async stop(): Promise<void> {
    if (!this.isRunning) {
      console.warn('NavigatorCore: Not running');
      return;
    }

    this.eventBus.emit('core:stop:begin', { source: 'NavigatorCore' });

    try {
      // Stop plugins in reverse order
      for (let i = this.pluginOrder.length - 1; i >= 0; i--) {
        const name = this.pluginOrder[i];
        const plugin = this.plugins.get(name)!;
        await this._stopPlugin(name, plugin);
      }

      this.isRunning = false;
      this.eventBus.emit('core:stop:complete', { source: 'NavigatorCore' });

      if (this.config.debugMode) {
        console.log('⏸️ NavigatorCore stopped');
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
   */
  async destroy(): Promise<void> {
    this.eventBus.emit('core:destroy:begin', { source: 'NavigatorCore' });

    try {
      // Stop if running
      if (this.isRunning) {
        await this.stop();
      }

      // Destroy plugins in reverse order
      for (let i = this.pluginOrder.length - 1; i >= 0; i--) {
        const name = this.pluginOrder[i];
        const plugin = this.plugins.get(name)!;
        await this._destroyPlugin(name, plugin);
      }

      // Clear plugin data
      this.plugins.clear();
      this.pluginStates.clear();
      this.pluginOrder = [];

      this.isInitialized = false;
      
      // Emit completion BEFORE clearing event bus
      this.eventBus.emit('core:destroy:complete', { source: 'NavigatorCore' });
      
      // Clear event bus last
      this.eventBus.clear();

      if (this.config.debugMode) {
        console.log('🗑️ NavigatorCore destroyed');
      }

    } catch (error) {
      console.error('NavigatorCore: Destroy failed', error);
      throw error;
    }
  }

  // ========================================
  // Session History Management
  // ========================================

  /**
   * Record a user action in the session history
   * This is the key method for cognitive modeling
   * 
   * @param action The action to record
   * 
   * @example
   * ```ts
   * core.recordAction({
   *   id: nanoid(),
   *   timestamp: performance.now(),
   *   type: 'intent:navigate',
   *   success: true,
   *   duration_ms: 350
   * });
   * ```
   */
  recordAction(action: Action): void {
    this.history.add(action);
    
    // Emit event for potential listeners (analytics, debugging)
    this.eventBus.emit('history:action:recorded', {
      action,
      historySize: this.history.size()
    });
    
    if (this.config.debugMode) {
      console.log('📝 Action recorded:', action.type, {
        success: action.success,
        duration: action.duration_ms
      });
    }
  }

  // ========================================
  // Plugin Management (Stub for now)
  // ========================================

  /**
   * Register a plugin
   */
  registerPlugin(plugin: INavigatorPlugin, options: PluginOptions = {}): NavigatorCore {
    // Validate plugin
    if (!plugin || !plugin.name) {
      throw new Error('NavigatorCore: Plugin must have a name property');
    }

    if (this.plugins.has(plugin.name)) {
      throw new Error(`NavigatorCore: Plugin "${plugin.name}" already registered`);
    }

    // Validate plugin interface
    if (typeof plugin.init !== 'function') {
      throw new Error(`NavigatorCore: Plugin "${plugin.name}" missing required method: init`);
    }

    // Store plugin
    this.plugins.set(plugin.name, plugin);
    this.pluginStates.set(plugin.name, 'registered');

    // Add to order (respecting priority)
    const priority = options.priority || 0;
    plugin._priority = priority;

    let inserted = false;
    for (let i = 0; i < this.pluginOrder.length; i++) {
      const existingPlugin = this.plugins.get(this.pluginOrder[i])!;
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
      console.log(`🔌 Plugin registered: ${plugin.name}`, { priority });
    }

    return this; // For chaining
  }

  /**
   * Get a plugin instance by name
   */
  getPlugin(name: string): INavigatorPlugin | null {
    return this.plugins.get(name) || null;
  }

  // ========================================
  // Private Methods
  // ========================================

  private async _initPlugin(name: string, plugin: INavigatorPlugin): Promise<void> {
    try {
      await plugin.init(this);
      this.pluginStates.set(name, 'initialized');
      
      this.eventBus.emit('core:plugin:initialized', {
        pluginName: name,
        source: 'NavigatorCore'
      });

      if (this.config.debugMode) {
        console.log(`✓ Plugin initialized: ${name}`);
      }
    } catch (error) {
      console.error(`NavigatorCore: Plugin "${name}" init failed`, error);
      throw error;
    }
  }

  private async _startPlugin(name: string, plugin: INavigatorPlugin): Promise<void> {
    try {
      if (plugin.start) {
        await plugin.start();
      }
      this.pluginStates.set(name, 'started');
      
      this.eventBus.emit('core:plugin:started', {
        pluginName: name,
        source: 'NavigatorCore'
      });

      if (this.config.debugMode) {
        console.log(`▶ Plugin started: ${name}`);
      }
    } catch (error) {
      console.error(`NavigatorCore: Plugin "${name}" start failed`, error);
      throw error;
    }
  }

  private async _stopPlugin(name: string, plugin: INavigatorPlugin): Promise<void> {
    try {
      if (plugin.stop) {
        await plugin.stop();
      }
      this.pluginStates.set(name, 'stopped');
      
      this.eventBus.emit('core:plugin:stopped', {
        pluginName: name,
        source: 'NavigatorCore'
      });

      if (this.config.debugMode) {
        console.log(`⏸ Plugin stopped: ${name}`);
      }
    } catch (error) {
      console.error(`NavigatorCore: Plugin "${name}" stop failed`, error);
      throw error;
    }
  }

  private async _destroyPlugin(name: string, plugin: INavigatorPlugin): Promise<void> {
    try {
      if (plugin.destroy) {
        await plugin.destroy();
      }
      this.pluginStates.set(name, 'destroyed');
      
      this.eventBus.emit('core:plugin:destroyed', {
        pluginName: name,
        source: 'NavigatorCore'
      });

      if (this.config.debugMode) {
        console.log(`🗑 Plugin destroyed: ${name}`);
      }
    } catch (error) {
      console.error(`NavigatorCore: Plugin "${name}" destroy failed`, error);
      // Don't throw - allow cleanup to continue
    }
  }

  private _setupCoreListeners(): void {
    // Setup system-level event listeners
    this.eventBus.on('system:error', (event) => {
      if (this.config.debugMode) {
        console.error('System Error:', event.payload);
      }
    });
  }

  private _startPerformanceMonitoring(): void {
    // Placeholder for performance monitoring
    // Will be implemented when needed
  }
}

export default NavigatorCore;
