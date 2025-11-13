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
import { UserSessionHistory, type Action } from './intelligence/UserSessionHistory';
import { createStore } from './store/createStore';
import { applyMiddleware } from './store/applyMiddleware';
import { createCognitiveMiddleware } from './store/middleware/cognitiveMiddleware';
import { loggerMiddleware } from './store/middleware/loggerMiddleware';
import { rootReducer, type RootState } from './store/reducers';
import type { DeepPartial } from './AppState';
import type { Store, Action as StoreAction } from './store/types';

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
  /** Max time (ms) for init() to complete (default: 5000) */
  _initTimeout?: number;
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
  
  /**
   * Event bus instance (read-only access)
   * @deprecated Since v3.0. Use `core.store.subscribe()` to react to state changes instead.
   * This will be removed in v4.0. See: docs/technical-debt/LEGACY_EVENTBUS_MIGRATION.md
   */
  public readonly eventBus: EventBus;
  
  /**
   * App state instance (read-only access)
   * @deprecated Since v3.0. Use `core.store.getState()` to read state instead.
   * This will be removed in v4.0. See: docs/technical-debt/LEGACY_EVENTBUS_MIGRATION.md
   */
  public readonly state: AppState;

  /** Redux-like Store (v3.0+ - Primary state management) */
  public readonly store: Store<RootState, StoreAction>;

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

    // Initialize Redux-like Store with Cognitive Middleware (Sprint 3)
    // The cognitive middleware analyzes every action and dispatches COGNITIVE_STATE_CHANGE
    // Create middleware pipeline
    // 1. Logger middleware (first) - logs all actions and state changes
    // 2. Cognitive middleware (last) - analyzes user behavior patterns
    const cognitiveMiddleware = createCognitiveMiddleware({
      metricsWindow: 20,
      frustratedThreshold: 3,
      concentratedThreshold: 5,
      exploringThreshold: 4,
      debugMode: this.config.debugMode,
    });
    
    const middleware = [
      loggerMiddleware,      // Logs actions for debugging
      cognitiveMiddleware,   // Tracks cognitive states
    ];
    
    this.store = createStore(
      rootReducer,
      undefined, // No preloaded state
      applyMiddleware(...middleware)
    );

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

    // Setup Legacy Bridge (EventBus -> Store)
    this._setupLegacyBridge();

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
      // Sprint 2: Parallel Plugin Initialization
      // Separate plugins into critical (priority >= 100) and deferred (priority < 100)
      const criticalPlugins: Array<{ name: string; plugin: INavigatorPlugin }> = [];
      const deferredPlugins: Array<{ name: string; plugin: INavigatorPlugin }> = [];

      for (const name of this.pluginOrder) {
        const plugin = this.plugins.get(name)!;
        // Default priority: 100 (critical) for backward compatibility
        // Plugins must explicitly set priority < 100 to be deferred
        const priority = plugin._priority ?? 100;

        if (priority >= 100) {
          criticalPlugins.push({ name, plugin });
        } else {
          deferredPlugins.push({ name, plugin });
        }
      }

      // Initialize critical plugins in parallel using Promise.all
      if (criticalPlugins.length > 0) {
        await Promise.all(
          criticalPlugins.map(({ name, plugin }) => this._initPlugin(name, plugin))
        );
      }

      this.isInitialized = true;
      this.eventBus.emit('core:init:complete', { source: 'NavigatorCore' });

      if (this.config.debugMode) {
        console.log('✅ NavigatorCore initialized successfully');
      }

      // Initialize deferred plugins in background (non-blocking)
      if (deferredPlugins.length > 0) {
        this._initDeferredPlugins(deferredPlugins).catch((error) => {
          console.error('NavigatorCore: Deferred plugin initialization failed', error);
          this.eventBus.emit('core:error', {
            message: 'Deferred plugin initialization failed',
            error,
            source: 'NavigatorCore'
          });
        });
      }

      // Auto-start if configured
      if (this.config.autoStart) {
        await this.start();
      }

    } catch (error) {
      // L'evento di errore viene già emesso da _initPlugin
      // Non lo riemmettiamo qui per evitare duplicati
      throw error;
    }
  }

  /**
   * Initialize deferred plugins in background (Sprint 2)
   */
  private async _initDeferredPlugins(
    deferredPlugins: Array<{ name: string; plugin: INavigatorPlugin }>
  ): Promise<void> {
    try {
      // Initialize deferred plugins in parallel
      await Promise.all(
        deferredPlugins.map(({ name, plugin }) => this._initPlugin(name, plugin))
      );

      // Emit event when all deferred plugins are ready
      this.eventBus.emit('core:deferred:ready', {
        source: 'NavigatorCore',
        pluginCount: deferredPlugins.length,
        plugins: deferredPlugins.map(({ name }) => name)
      });

      if (this.config.debugMode) {
        console.log(`✅ Deferred plugins initialized (${deferredPlugins.length})`);
      }
    } catch (error) {
      console.error('NavigatorCore: Error initializing deferred plugins', error);
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

    // 🔍 SONDA #1: Commented for production
    // console.log(`[DIAGNOSTIC] Action recorded: ${action.type}, Success: ${action.success}, Duration: ${action.duration_ms}ms`);

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

    // Set priority: use options.priority if provided, otherwise use plugin._priority, otherwise default to 100
    const priority = options.priority ?? plugin._priority ?? 100;
    plugin._priority = priority;

    let inserted = false;
    for (let i = 0; i < this.pluginOrder.length; i++) {
      const existingPlugin = this.plugins.get(this.pluginOrder[i])!;
      const existingPriority = existingPlugin._priority ?? 100;
      if (priority > existingPriority) {
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
    const timeout = plugin._initTimeout || 5000; // Default: 5 secondi

    // Crea promise per l'inizializzazione
    const initPromise = (async () => {
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
    })();

    // Crea promise per il timeout
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Plugin "${name}" init timeout (${timeout}ms)`));
      }, timeout);
    });

    // Race tra init e timeout
    try {
      await Promise.race([initPromise, timeoutPromise]);
    } catch (error) {
      // Emetti evento di errore
      this.eventBus.emit('core:error', {
        message: `Plugin "${name}" initialization failed`,
        error,
        source: 'NavigatorCore'
      });
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

  /**
   * Setup Legacy Bridge - EventBus to Store translation
   *
   * This is the critical migration piece. The Legacy Bridge:
   * 1. Listens to ALL EventBus events
   * 2. Translates them to Store actions
   * 3. Dispatches them to the Store (shadow mode)
   *
   * This allows the new Store to operate in parallel with the old EventBus
   * without breaking any existing functionality.
   * 
   * ---
   * 
   * TODO: [DEPRECATION] This bridge is a temporary compatibility layer.
   * It will be removed in v4.0 once all plugins are migrated to dispatch Actions.
   * 
   * Remaining EventBus emissions to migrate:
   *   - core:* (lifecycle events) - HIGH PRIORITY
   *   - keyboard:combo (KeyboardPlugin) - MEDIUM PRIORITY
   *   - intent:prediction (predictive system) - MEDIUM PRIORITY
   *   - gesture:* events (MockGesturePlugin) - LOW PRIORITY
   *   - All legacy JS plugins (js/plugins/*) - LOW PRIORITY
   * 
   * Migration Tracking: docs/technical-debt/LEGACY_EVENTBUS_MIGRATION.md
   * Target Removal: v4.0.0 (Q4 2026)
   */
  private _setupLegacyBridge(): void {
    // Subscribe to ALL events using wildcard
    this.eventBus.on('*', (event) => {
      const eventName = event.name;
      const payload = event.payload;

      // Skip internal Redux actions (they're already in the Store)
      if (eventName.startsWith('@@redux/') || eventName.startsWith('@@store/')) {
        return;
      }

      // Translate legacy event to Store action
      const storeAction: StoreAction = {
        type: `legacy/${eventName}`,
        payload,
        metadata: {
          source: 'legacy_bridge',
          timestamp: event.timestamp,
          originalEvent: eventName,
        },
      };

      // Dispatch to Store (shadow mode)
      try {
        this.store.dispatch(storeAction);

        if (this.config.debugMode) {
          console.log(
            `[BRIDGE] Translated: ${eventName} → legacy/${eventName}`,
            payload
          );
        }
      } catch (error) {
        console.error('[BRIDGE] Failed to dispatch action:', storeAction, error);
      }
    });

    if (this.config.debugMode) {
      console.log('🌉 Legacy Bridge active: EventBus → Store');
    }
  }

  private _startPerformanceMonitoring(): void {
    // Placeholder for performance monitoring
    // Will be implemented when needed
  }
}

export default NavigatorCore;
