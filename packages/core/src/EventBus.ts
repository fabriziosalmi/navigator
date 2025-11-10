/**
 * EventBus.ts
 * 
 * Central event-driven communication system for Navigator ecosystem.
 * Provides a decoupled way for plugins to communicate without direct dependencies.
 * 
 * Features:
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
  }

  /**
   * Subscribe to an event
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
   * @param eventName - Event name
   * @param payload - Event data
   * @returns Whether any handlers were called
   */
  emit<T = any>(eventName: string, payload: T = {} as T): boolean {
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

    let handlersCalled = 0;

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
