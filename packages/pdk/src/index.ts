/**
 * @navigator.menu/pdk
 * Plugin Development Kit - Main Exports
 */

// Re-export all types from @navigator.menu/types
export type {
  NipEvent,
  NavigatorConfig,
  PluginConfig,
  IPlugin,
  IEventBus,
  IAppState,
  INavigatorCore,
  CognitiveState,
  InputSource,
  Position,
  GestureEventPayload,
  CognitiveStateChangePayload,
  IntentEventPayload,
  NavigationChangePayload,
  TypedEmit,
  TypedOn
} from '@navigator.menu/types';

// Export utilities
export * from './utils.js';

// Export testing utilities
export { CoreMock, EventBusMock, AppStateMock } from './testing.js';

/**
 * Base Plugin Class
 * 
 * Extend this class to create Navigator plugins with standard lifecycle methods.
 * 
 * @example
 * ```typescript
 * import { BasePlugin } from '@navigator.menu/pdk';
 * 
 * export class MyPlugin extends BasePlugin {
 *   async init() {
 *     console.log('Plugin initialized!');
 *   }
 * }
 * ```
 */
export abstract class BasePlugin {
  public readonly name: string;
  protected _priority: number = 0;
  protected _config: Record<string, any> = {};
  
  constructor(name: string) {
    this.name = name;
  }
  
  /**
   * Initialize plugin (required)
   */
  abstract init(): Promise<void>;
  
  /**
   * Start plugin (optional)
   */
  async start?(): Promise<void>;
  
  /**
   * Stop plugin (optional)
   */
  async stop?(): Promise<void>;
  
  /**
   * Destroy plugin and cleanup resources (optional)
   */
  async destroy?(): Promise<void>;
  
  /**
   * Set plugin priority
   */
  setPriority(priority: number): this {
    this._priority = priority;
    return this;
  }
  
  /**
   * Set plugin configuration
   */
  setConfig(config: Record<string, any>): this {
    this._config = { ...this._config, ...config };
    return this;
  }
  
  /**
   * Get configuration value
   */
  protected getConfig<T = any>(key: string, defaultValue?: T): T {
    return (this._config[key] ?? defaultValue) as T;
  }
}

/**
 * Plugin metadata decorator
 */
export function Plugin(metadata: {
  name: string;
  version: string;
  description?: string;
  author?: string;
}) {
  return function <T extends { new (...args: any[]): {} }>(constructor: T) {
    return class extends constructor {
      public readonly metadata = metadata;
    };
  };
}

/**
 * NIP Event Validator
 * 
 * Validates NIP v1.0 events against the protocol specification
 */
export class NipValidator {
  /**
   * Validate event structure
   */
  static validate(event: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!event.type || typeof event.type !== 'string') {
      errors.push('Missing or invalid event.type');
    }
    
    if (!event.version || !/^\d+\.\d+\.\d+$/.test(event.version)) {
      errors.push('Missing or invalid event.version (must be semver)');
    }
    
    if (typeof event.timestamp !== 'number') {
      errors.push('Missing or invalid event.timestamp');
    }
    
    if (!event.source || typeof event.source !== 'string') {
      errors.push('Missing or invalid event.source');
    }
    
    if (event.payload === undefined) {
      errors.push('Missing event.payload');
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
  
  /**
   * Create a valid NIP event
   */
  static createEvent<T = any>(
    type: string,
    source: string,
    payload: T,
    metadata?: Record<string, any>
  ): import('@navigator.menu/types').NipEvent<T> {
    return {
      type,
      version: '1.0.0',
      timestamp: performance.now(),
      source,
      payload,
      ...(metadata && { metadata })
    };
  }
}
