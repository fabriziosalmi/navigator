/**
 * AppState.ts (Enhanced for Core & Plugin Architecture)
 * 
 * Centralized state management - single source of truth for Navigator.
 * Fully integrated with EventBus for reactive state changes.
 * 
 * Features:
 * - Immutable state updates via setState()
 * - Automatic event emission on state changes
 * - State history and time-travel debugging
 * - Computed properties
 * - State persistence
 */

import { EventBus } from './EventBus';

/**
 * Deep partial type - makes all properties optional recursively
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/**
 * Navigator state structure
 */
export interface NavigatorState {
  navigation: {
    currentLayer: number;
    totalLayers: number;
    layerName: string;
    currentCardIndex: number;
    totalCards: number;
    isTransitioning: boolean;
  };
  user: {
    level: number;
    experiencePoints: number;
    navigationCount: number;
    gesturesDetected: number;
    achievements: string[];
    cognitive_state?: 'frustrated' | 'concentrated' | 'exploring' | 'learning' | 'neutral';
  };
  system: {
    isIdle: boolean;
    idleStartTime: number | null;
    cameraActive: boolean;
    handDetected: boolean;
    mediaPipeReady: boolean;
    performanceMode: 'high' | 'medium' | 'low';
  };
  ui: {
    startScreenVisible: boolean;
    hudVisible: boolean;
    fullscreenCard: string | null;
    debugPanelVisible: boolean;
  };
  input: {
    lastGesture: string | null;
    lastGestureTime: number;
    keyboardEnabled: boolean;
    gestureEnabled: boolean;
    voiceEnabled: boolean;
  };
  performance: {
    fps: number;
    lastFrameTime: number;
    averageFps: number;
    frameCount: number;
  };
  plugins: Record<string, any>;
}

/**
 * Computed properties type
 */
export interface ComputedProperties {
  isNavigating: boolean;
  canNavigate: boolean;
  isInputReady: boolean;
}

/**
 * State watcher callback
 */
type WatcherCallback = (newValue: any) => void;

/**
 * State update options
 */
interface SetStateOptions {
  /** Don't emit events */
  silent?: boolean;
  /** Deep merge vs shallow merge */
  merge?: boolean;
}

export class AppState {
  private eventBus: EventBus;
  private state: NavigatorState;
  private stateHistory: NavigatorState[];
  private maxHistorySize: number;
  public computed: ComputedProperties;
  private watchers: Map<string, Set<WatcherCallback>>;

  constructor(eventBus: EventBus, initialState: DeepPartial<NavigatorState> = {}) {
    if (!eventBus || !(eventBus instanceof EventBus)) {
      throw new Error('AppState requires an EventBus instance');
    }

    this.eventBus = eventBus;
    this.state = this._getDefaultState();
    this.stateHistory = [];
    this.maxHistorySize = 50;
    this.watchers = new Map();

    // Setup computed properties object
    this.computed = {} as ComputedProperties;
    this._setupComputedProperties();

    // Merge initial state
    if (initialState && Object.keys(initialState).length > 0) {
      this.state = { ...this.state, ...initialState } as NavigatorState;
    }
  }

  /**
   * Get default initial state
   */
  private _getDefaultState(): NavigatorState {
    return {
      navigation: {
        currentLayer: 0,
        totalLayers: 6,
        layerName: 'video',
        currentCardIndex: 0,
        totalCards: 0,
        isTransitioning: false
      },
      user: {
        level: 1,
        experiencePoints: 0,
        navigationCount: 0,
        gesturesDetected: 0,
        achievements: []
      },
      system: {
        isIdle: false,
        idleStartTime: null,
        cameraActive: false,
        handDetected: false,
        mediaPipeReady: false,
        performanceMode: 'high'
      },
      ui: {
        startScreenVisible: true,
        hudVisible: false,
        fullscreenCard: null,
        debugPanelVisible: false
      },
      input: {
        lastGesture: null,
        lastGestureTime: 0,
        keyboardEnabled: true,
        gestureEnabled: true,
        voiceEnabled: false
      },
      performance: {
        fps: 0,
        lastFrameTime: 0,
        averageFps: 60,
        frameCount: 0
      },
      plugins: {}
    };
  }

  /**
   * Get a value from state using dot notation path
   * @param path - e.g., 'navigation.currentLayer'
   * @param defaultValue - Default if path doesn't exist
   * @returns State value
   */
  get<T = any>(path: string, defaultValue?: T): T {
    const keys = path.split('.');
    let value: any = this.state;

    for (const key of keys) {
      if (value && typeof value === 'object' && key in value) {
        value = value[key];
      } else {
        return defaultValue as T;
      }
    }

    return value as T;
  }

  /**
   * Set state values (supports partial updates and deep paths)
   * @param pathOrUpdates - Path string or updates object
   * @param value - Value to set (if path is string)
   * @param options - { silent: boolean, merge: boolean }
   */
  setState(pathOrUpdates: string | DeepPartial<NavigatorState>, value?: any, options: SetStateOptions = {}): void {
    const { silent = false, merge = true } = options;

    let updates: DeepPartial<NavigatorState>;
    if (typeof pathOrUpdates === 'string') {
      updates = this._pathToObject(pathOrUpdates, value);
    } else {
      updates = pathOrUpdates;
    }

    const previousState = JSON.parse(JSON.stringify(this.state));

    // Apply updates
    if (merge) {
      this.state = this._deepMerge(this.state, updates as any) as NavigatorState;
    } else {
      this.state = { ...this.state, ...updates } as NavigatorState;
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
   * @param path - State path to watch
   * @param callback - (newValue) => {}
   * @returns Unwatch function
   */
  watch(path: string, callback: WatcherCallback): () => void {
    if (!this.watchers.has(path)) {
      this.watchers.set(path, new Set());
    }
    this.watchers.get(path)!.add(callback);

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
   * @returns Deep copy of state
   */
  getState(): NavigatorState {
    return JSON.parse(JSON.stringify(this.state));
  }

  /**
   * Reset state to default
   * @param silent - Don't emit events
   */
  reset(silent = false): void {
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
   * @param limit - Max entries to return
   * @returns State history
   */
  getHistory(limit = 10): NavigatorState[] {
    return this.stateHistory.slice(0, limit);
  }

  /**
   * Time travel - restore previous state
   * @param stepsBack - How many states to go back
   */
  timeTravel(stepsBack = 1): void {
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
   * @param key - Storage key
   */
  persist(key = 'navigator_state'): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, JSON.stringify(this.state));
      }
    } catch (error) {
      console.error('AppState.persist: Failed to save state', error);
    }
  }

  /**
   * Restore state from localStorage
   * @param key - Storage key
   * @returns Whether restore was successful
   */
  restore(key = 'navigator_state'): boolean {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const saved = window.localStorage.getItem(key);
        if (saved) {
          const restoredState = JSON.parse(saved);
          this.setState(restoredState, undefined, { merge: false });
          this.eventBus.emit('state:restored', {
            source: 'AppState',
            key
          });
          return true;
        }
      }
    } catch (error) {
      console.error('AppState.restore: Failed to restore state', error);
    }
    return false;
  }

  // ========================================
  // Private Methods
  // ========================================

  private _pathToObject(path: string, value: any): DeepPartial<NavigatorState> {
    const keys = path.split('.');
    const result: any = {};
    let current = result;

    for (let i = 0; i < keys.length - 1; i++) {
      current[keys[i]] = {};
      current = current[keys[i]];
    }

    current[keys[keys.length - 1]] = value;
    return result;
  }

  private _deepMerge(target: any, source: any): any {
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

  private _addToHistory(state: NavigatorState): void {
    this.stateHistory.unshift(state);
    if (this.stateHistory.length > this.maxHistorySize) {
      this.stateHistory.pop();
    }
  }

  private _emitStateChanges(previousState: NavigatorState, currentState: NavigatorState, updates: DeepPartial<NavigatorState>): void {
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
        previous: (previousState as any)[key],
        current: (currentState as any)[key],
        source: 'AppState'
      });
    }
  }

  private _callWatchers(updates: DeepPartial<NavigatorState>): void {
    for (const [path, watchers] of this.watchers) {
      const newValue = this.get(path);

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

  private _setupComputedProperties(): void {
    // Define computed properties as getters
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

  private _updateComputedProperties(): void {
    // Emit event for computed properties update
    this.eventBus.emit('state:computed:updated', {
      computed: { ...this.computed },
      source: 'AppState'
    });
  }
}

export default AppState;
