/**
 * EventBus.ts
 * 
 * Central event-driven communication system for Navigator ecosystem.
 * 
 * @deprecated Since v3.0. The EventBus is being phased out in favor of the Redux-like Store.
 * Use `core.store.subscribe()` for state changes and `core.store.dispatch()` for actions.
 * This class will be removed in v4.0.
 * 
 * Migration Guide: docs/technical-debt/LEGACY_EVENTBUS_MIGRATION.md
 * 
 * Features (legacy):
 * - Type-safe event emission and listening
 * - Wildcard event subscriptions
 * - Event history and debugging
 * - Performance monitoring
 * - Event middleware/interceptors
 */

import type {
  NavigatorEvent,
  EventHandler,
  EventMiddleware,
  UnsubscribeFunction,
  SubscriptionOptions,
  EventBusOptions,
  EventStats
} from './types';

interface InternalHandler extends EventHandler {
  _priority?: number;
}

export class EventBus {
  private listeners: Map<string, Set<InternalHandler>>;
  private wildcardListeners: Set<InternalHandler>;
  private eventHistory: NavigatorEvent[];
  private maxHistorySize: number;
  private debugMode: boolean;
  private middleware: EventMiddleware[];
  private stats: {
    totalEvents: number;
    eventCounts: Map<string, number>;
  };
  
  // Circuit Breaker state
  private circuitBreakerEnabled: boolean;
  private maxCallDepth: number;
  private maxChainLength: number;
  private callDepthMap: Map<string, number>;
  private eventChain: string[];

  constructor(options: EventBusOptions = {}) {
    this.listeners = new Map();
    this.wildcardListeners = new Set();
    this.eventHistory = [];
    this.maxHistorySize = options.maxHistorySize || 100;
    this.debugMode = options.debugMode || false;
    this.middleware = [];
    this.stats = {
      totalEvents: 0,
      eventCounts: new Map()
    };
    
    // Initialize circuit breaker
    const circuitBreaker = options.circuitBreaker || {};
    this.circuitBreakerEnabled = circuitBreaker.enabled !== false; // Default: true
    this.maxCallDepth = circuitBreaker.maxCallDepth || 100;
    this.maxChainLength = circuitBreaker.maxChainLength || 50;
    this.callDepthMap = new Map();
    this.eventChain = [];
  }

  /**
   * Subscribe to an event
   * 
   * @deprecated Since v3.0. Use `core.store.subscribe()` to react to state changes instead.
   * Example: `core.store.subscribe(() => { const state = core.store.getState(); ... })`
   * 
   * @param eventName - Event name (use '*' for all events)
   * @param handler - Callback function (event) => {}
   * @param options - { once: boolean, priority: number }
   * @returns Unsubscribe function
   */
  on<T = any>(
    eventName: string,
    handler: EventHandler<T>,
    options: SubscriptionOptions = {}
  ): UnsubscribeFunction {
    if (this.debugMode) {
      console.warn(
        `[DEPRECATION] EventBus.on('${eventName}') is deprecated. ` +
        `Use Store.subscribe() instead. See: docs/technical-debt/LEGACY_EVENTBUS_MIGRATION.md`
      );
    }

    if (typeof handler !== 'function') {
      throw new Error('EventBus.on: handler must be a function');
    }

    const wrappedHandler: InternalHandler = options.once
      ? this._createOnceHandler(eventName, handler)
      : handler;

    // Store priority if specified
    if (options.priority !== undefined) {
      wrappedHandler._priority = options.priority;
    }

    if (eventName === '*') {
      this.wildcardListeners.add(wrappedHandler);
    } else {
      if (!this.listeners.has(eventName)) {
        this.listeners.set(eventName, new Set());
      }
      const handlers = this.listeners.get(eventName)!;
      handlers.add(wrappedHandler);

      // Sort by priority if needed
      if (options.priority !== undefined) {
        this._sortHandlersByPriority(eventName);
      }
    }

    if (this.debugMode) {
      console.log(`[EventBus] Subscribed to "${eventName}"`, handler.name || 'anonymous');
    }

    // Return unsubscribe function
    return () => this.off(eventName, wrappedHandler);
  }

  /**
   * Unsubscribe from an event
   * @param eventName - Event name
   * @param handler - Handler to remove (optional, removes all if not provided)
   */
  off(eventName: string, handler?: EventHandler): void {
    if (eventName === '*') {
      if (handler) {
        this.wildcardListeners.delete(handler as InternalHandler);
      } else {
        this.wildcardListeners.clear();
      }
    } else {
      const handlers = this.listeners.get(eventName);
      if (handlers) {
        if (handler) {
          handlers.delete(handler as InternalHandler);
        } else {
          handlers.clear();
        }
      }
    }

    if (this.debugMode) {
      console.log(`[EventBus] Unsubscribed from "${eventName}"`);
    }
  }

  /**
   * Subscribe to an event once (auto-unsubscribes after first trigger)
   * @param eventName - Event name
   * @param handler - Callback function
   * @returns Unsubscribe function
   */
  once<T = any>(eventName: string, handler: EventHandler<T>): UnsubscribeFunction {
    return this.on(eventName, handler, { once: true });
  }

  /**
   * Emit an event to all subscribers
   * 
   * @deprecated Since v3.0. Use `core.store.dispatch(action)` to trigger state changes instead.
   * Example: `core.store.dispatch(navigate({ currentCard: 1, direction: 'right' }))`
   * 
   * @param eventName - Event name
   * @param payload - Event data
   * @returns Whether any handlers were called
   */
  emit<T = any>(eventName: string, payload: T = {} as T): boolean {
    if (this.debugMode && !eventName.startsWith('legacy/') && !eventName.startsWith('system:')) {
      console.warn(
        `[DEPRECATION] EventBus.emit('${eventName}') is deprecated. ` +
        `Use Store.dispatch() instead. See: docs/technical-debt/LEGACY_EVENTBUS_MIGRATION.md`
      );
    }

    // ==========================================
    // CIRCUIT BREAKER: Loop Detection
    // ==========================================
    if (this.circuitBreakerEnabled && eventName !== 'system:circuit-breaker') {
      // Check call depth for this specific event
      const currentDepth = this.callDepthMap.get(eventName) || 0;
      
      if (currentDepth >= this.maxCallDepth) {
        if (this.debugMode) {
          console.error(
            `[EventBus] Circuit breaker: "${eventName}" exceeded max call depth (${this.maxCallDepth})`
          );
        }
        
        // Emit circuit breaker event (non-recursive)
        this.emit('system:circuit-breaker', {
          eventName,
          depth: currentDepth,
          type: 'max_depth_exceeded',
          source: 'EventBus'
        });
        
        return false; // Stop propagation
      }
      
      // Check for cycles in the event chain
      const cycleIndex = this.eventChain.lastIndexOf(eventName);
      const hasCycle = cycleIndex !== -1;
      
      if (hasCycle && this.eventChain.length >= this.maxChainLength) {
        const cycle = this.eventChain.slice(cycleIndex);
        
        if (this.debugMode) {
          console.error(
            `[EventBus] Circuit breaker: Cycle detected`,
            { eventName, cycle, chainLength: this.eventChain.length }
          );
        }
        
        // Emit circuit breaker event
        this.emit('system:circuit-breaker', {
          eventName,
          cycle,
          chain: [...this.eventChain],
          type: 'cycle_detected',
          source: 'EventBus'
        });
        
        return false; // Stop propagation
      }
    }
    
    const event: NavigatorEvent<T> = {
      name: eventName,
      payload,
      timestamp: performance.now(),
      source: (payload as any)?.source || 'unknown'
    };

    // Apply middleware/interceptors
    const processedEvent = this._applyMiddleware(event);
    if (processedEvent === null) {
      // Event was cancelled by middleware
      return false;
    }

    // Update stats
    this.stats.totalEvents++;
    const count = this.stats.eventCounts.get(eventName) || 0;
    this.stats.eventCounts.set(eventName, count + 1);

    // Add to history
    this._addToHistory(processedEvent);

    if (this.debugMode) {
      console.log(`[EventBus] Emit "${eventName}"`, payload);
    }

    // ==========================================
    // Track call depth and event chain
    // ==========================================
    if (this.circuitBreakerEnabled) {
      const depth = this.callDepthMap.get(eventName) || 0;
      this.callDepthMap.set(eventName, depth + 1);
      this.eventChain.push(eventName);
    }

    let handlersCalled = 0;

    try {
      // Call specific event handlers
      const handlers = this.listeners.get(eventName);
      if (handlers && handlers.size > 0) {
        // Convert to array to safely iterate (handlers might remove themselves)
        const handlersArray = Array.from(handlers);
        for (const handler of handlersArray) {
          try {
            handler(processedEvent);
            handlersCalled++;
          } catch (error) {
            console.error(`[EventBus] Error in handler for "${eventName}":`, error);
            this.emit('system:error', {
              message: `Event handler error for "${eventName}"`,
              error,
              source: 'EventBus'
            });
          }
        }
      }

      // Call wildcard handlers
      for (const handler of this.wildcardListeners) {
        try {
          handler(processedEvent);
          handlersCalled++;
        } catch (error) {
          console.error(`[EventBus] Error in wildcard handler for "${eventName}":`, error);
        }
      }

      return handlersCalled > 0;
    } finally {
      // ==========================================
      // Cleanup call depth and event chain
      // ==========================================
      if (this.circuitBreakerEnabled) {
        const depth = this.callDepthMap.get(eventName) || 0;
        this.callDepthMap.set(eventName, depth - 1);
        this.eventChain.pop();
      }
    }
  }

  /**
   * Wait for an event (returns a promise)
   * @param eventName - Event to wait for
   * @param timeout - Timeout in ms (optional)
   * @returns Resolves with event data
   */
  waitFor<T = any>(eventName: string, timeout?: number): Promise<NavigatorEvent<T>> {
    return new Promise((resolve, reject) => {
      let timeoutId: NodeJS.Timeout | undefined;

      const unsubscribe = this.once(eventName, (event) => {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        resolve(event as NavigatorEvent<T>);
      });

      if (timeout) {
        timeoutId = setTimeout(() => {
          unsubscribe();
          reject(new Error(`EventBus.waitFor: Timeout waiting for "${eventName}"`));
        }, timeout);
      }
    });
  }

  /**
   * Add middleware/interceptor for events
   * @param middleware - (event) => event | null
   */
  use(middleware: EventMiddleware): void {
    if (typeof middleware !== 'function') {
      throw new Error('EventBus.use: middleware must be a function');
    }
    this.middleware.push(middleware);
  }

  /**
   * Get event history for debugging
   * @param eventName - Filter by event name (optional)
   * @param limit - Max number of events to return
   * @returns Array of events
   */
  getHistory(eventName?: string, limit: number = 50): NavigatorEvent[] {
    let history = this.eventHistory;

    if (eventName) {
      history = history.filter(e => e.name === eventName);
    }

    return history.slice(0, limit);
  }

  /**
   * Get statistics about events
   * @returns Stats object
   */
  getStats(): EventStats {
    return {
      totalEvents: this.stats.totalEvents,
      uniqueEvents: this.stats.eventCounts.size,
      topEvents: Array.from(this.stats.eventCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([name, count]) => ({ name, count })),
      listeners: Array.from(this.listeners.entries())
        .map(([name, handlers]) => ({ name, count: handlers.size })),
      wildcardListeners: this.wildcardListeners.size
    };
  }

  /**
   * Clear all listeners (use with caution)
   */
  clear(): void {
    this.listeners.clear();
    this.wildcardListeners.clear();
    if (this.debugMode) {
      console.log('[EventBus] All listeners cleared');
    }
  }

  /**
   * Reset event history and stats
   */
  reset(): void {
    this.eventHistory = [];
    this.stats.totalEvents = 0;
    this.stats.eventCounts.clear();
  }

  // ========================================
  // Private Methods
  // ========================================

  private _createOnceHandler<T = any>(eventName: string, handler: EventHandler<T>): InternalHandler {
    const onceHandler: InternalHandler = (event) => {
      handler(event);
      this.off(eventName, onceHandler);
    };
    return onceHandler;
  }

  private _sortHandlersByPriority(eventName: string): void {
    const handlers = this.listeners.get(eventName);
    if (!handlers) {
      return;
    }

    const handlersArray = Array.from(handlers)
      .sort((a, b) => (b._priority || 0) - (a._priority || 0));

    this.listeners.set(eventName, new Set(handlersArray));
  }

  private _applyMiddleware(event: NavigatorEvent): NavigatorEvent | null {
    let processedEvent: NavigatorEvent | null = event;

    for (const middleware of this.middleware) {
      try {
        if (processedEvent === null) {
          return null;
        }
        processedEvent = middleware(processedEvent);
        if (processedEvent === null) {
          // Event cancelled
          return null;
        }
      } catch (error) {
        console.error('[EventBus] Middleware error:', error);
      }
    }

    return processedEvent;
  }

  private _addToHistory(event: NavigatorEvent): void {
    this.eventHistory.unshift(event);
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory.pop();
    }
  }
}

export default EventBus;
