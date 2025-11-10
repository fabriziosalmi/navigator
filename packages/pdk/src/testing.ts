/**
 * @navigator.menu/pdk/testing
 * Mock Implementations for Testing Plugins
 */

import type {
  IEventBus,
  IAppState,
  INavigatorCore,
  NavigatorConfig,
  IPlugin,
  EventListener
} from '@navigator.menu/types';

/**
 * Mock Event Bus for Testing
 */
export class EventBusMock implements IEventBus {
  private listeners: Map<string, Set<EventListener>> = new Map();
  private history: any[] = [];
  
  on<T = any>(eventName: string, listener: EventListener<T>): () => void {
    if (!this.listeners.has(eventName)) {
      this.listeners.set(eventName, new Set());
    }
    this.listeners.get(eventName)!.add(listener as EventListener);
    
    return () => this.off(eventName, listener as EventListener);
  }
  
  off(eventName: string, listener: EventListener): void {
    this.listeners.get(eventName)?.delete(listener);
  }
  
  emit<T = any>(eventName: string, payload: T): void {
    const event = { eventName, payload, timestamp: Date.now() };
    this.history.push(event);
    
    this.listeners.get(eventName)?.forEach(listener => {
      try {
        listener(payload);
      } catch (error) {
        console.error('EventBus listener error:', error);
      }
    });
  }
  
  once<T = any>(eventName: string, listener: EventListener<T>): void {
    const wrappedListener = (payload: T) => {
      listener(payload);
      this.off(eventName, wrappedListener as EventListener);
    };
    this.on(eventName, wrappedListener as EventListener);
  }
  
  clear(): void {
    this.listeners.clear();
    this.history = [];
  }
  
  getHistory(): any[] {
    return [...this.history];
  }
  
  /**
   * Testing utility: Get all listeners for an event
   */
  getListeners(eventName: string): Set<EventListener> | undefined {
    return this.listeners.get(eventName);
  }
  
  /**
   * Testing utility: Check if event was emitted
   */
  wasEmitted(eventName: string): boolean {
    return this.history.some(e => e.eventName === eventName);
  }
}

/**
 * Mock App State for Testing
 */
export class AppStateMock implements IAppState {
  private state: Record<string, any> = {};
  private watchers: Map<string, Set<(newValue: any, oldValue: any) => void>> = new Map();
  
  get<T = any>(path: string, defaultValue?: T): T {
    const keys = path.split('.');
    let value: any = this.state;
    
    for (const key of keys) {
      if (value === null || value === undefined) {
        return defaultValue as T;
      }
      value = value[key];
    }
    
    return (value !== undefined ? value : defaultValue) as T;
  }
  
  set(path: string, value: any): void {
    const oldValue = this.get(path);
    
    const keys = path.split('.');
    const lastKey = keys.pop()!;
    let target = this.state;
    
    for (const key of keys) {
      if (!(key in target)) {
        target[key] = {};
      }
      target = target[key];
    }
    
    target[lastKey] = value;
    
    // Trigger watchers
    this.watchers.get(path)?.forEach(callback => {
      callback(value, oldValue);
    });
  }
  
  watch(path: string, callback: (newValue: any, oldValue: any) => void): () => void {
    if (!this.watchers.has(path)) {
      this.watchers.set(path, new Set());
    }
    this.watchers.get(path)!.add(callback);
    
    return () => {
      this.watchers.get(path)?.delete(callback);
    };
  }
  
  getState(): Record<string, any> {
    return { ...this.state };
  }
  
  reset(): void {
    this.state = {};
    this.watchers.clear();
  }
}

/**
 * Mock Navigator Core for Testing
 */
export class CoreMock implements INavigatorCore {
  public config: NavigatorConfig;
  public eventBus: IEventBus;
  public state: IAppState;
  public plugins: Map<string, IPlugin> = new Map();
  
  private initialized = false;
  private started = false;
  
  constructor(config: NavigatorConfig = {}) {
    this.config = config;
    this.eventBus = new EventBusMock();
    this.state = new AppStateMock();
  }
  
  async init(): Promise<void> {
    if (this.initialized) return;
    
    // Initialize all plugins
    for (const plugin of this.plugins.values()) {
      await plugin.init();
    }
    
    this.initialized = true;
  }
  
  async start(): Promise<void> {
    if (!this.initialized) await this.init();
    if (this.started) return;
    
    // Start all plugins
    for (const plugin of this.plugins.values()) {
      if (plugin.start) {
        await plugin.start();
      }
    }
    
    this.started = true;
  }
  
  async stop(): Promise<void> {
    if (!this.started) return;
    
    // Stop all plugins
    for (const plugin of this.plugins.values()) {
      if (plugin.stop) {
        await plugin.stop();
      }
    }
    
    this.started = false;
  }
  
  async destroy(): Promise<void> {
    await this.stop();
    
    // Destroy all plugins
    for (const plugin of this.plugins.values()) {
      if (plugin.destroy) {
        await plugin.destroy();
      }
    }
    
    this.plugins.clear();
    this.eventBus.clear();
    this.state.reset();
    this.initialized = false;
  }
  
  registerPlugin(
    plugin: IPlugin,
    options?: { priority?: number; config?: Record<string, any> }
  ): INavigatorCore {
    if (options?.priority !== undefined) {
      (plugin as any)._priority = options.priority;
    }
    if (options?.config) {
      (plugin as any)._config = options.config;
    }
    
    this.plugins.set(plugin.name, plugin);
    return this;
  }
  
  getPlugin(name: string): IPlugin | null {
    return this.plugins.get(name) || null;
  }
  
  /**
   * Testing utility: Check if core is initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }
  
  /**
   * Testing utility: Check if core is started
   */
  isStarted(): boolean {
    return this.started;
  }
}
