/**
 * EventBus.js
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

export class EventBus {
    constructor(options = {}) {
        this.listeners = new Map(); // Map<eventName, Set<handler>>
        this.wildcardListeners = new Set(); // Handlers for '*' events
        this.eventHistory = []; // Recent events for debugging
        this.maxHistorySize = options.maxHistorySize || 100;
        this.debugMode = options.debugMode || false;
        this.middleware = []; // Event interceptors/middleware
        this.stats = {
            totalEvents: 0,
            eventCounts: new Map()
        };
    }

    /**
     * Subscribe to an event
     * @param {string} eventName - Event name (use '*' for all events)
     * @param {Function} handler - Callback function (event) => {}
     * @param {Object} options - { once: boolean, priority: number }
     * @returns {Function} Unsubscribe function
     */
    on(eventName, handler, options = {}) {
        if (typeof handler !== 'function') {
            throw new Error('EventBus.on: handler must be a function');
        }

        const wrappedHandler = options.once 
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
            const handlers = this.listeners.get(eventName);
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
     * @param {string} eventName - Event name
     * @param {Function} handler - Handler to remove (optional, removes all if not provided)
     */
    off(eventName, handler) {
        if (eventName === '*') {
            if (handler) {
                this.wildcardListeners.delete(handler);
            } else {
                this.wildcardListeners.clear();
            }
        } else {
            const handlers = this.listeners.get(eventName);
            if (handlers) {
                if (handler) {
                    handlers.delete(handler);
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
     * @param {string} eventName - Event name
     * @param {Function} handler - Callback function
     * @returns {Function} Unsubscribe function
     */
    once(eventName, handler) {
        return this.on(eventName, handler, { once: true });
    }

    /**
     * Emit an event to all subscribers
     * @param {string} eventName - Event name
     * @param {*} payload - Event data
     * @returns {boolean} Whether any handlers were called
     */
    emit(eventName, payload = {}) {
        const event = {
            name: eventName,
            payload,
            timestamp: performance.now(),
            source: payload.source || 'unknown'
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
     * @param {string} eventName - Event to wait for
     * @param {number} timeout - Timeout in ms (optional)
     * @returns {Promise} Resolves with event data
     */
    waitFor(eventName, timeout) {
        return new Promise((resolve, reject) => {
            let timeoutId;

            const unsubscribe = this.once(eventName, (event) => {
                if (timeoutId) clearTimeout(timeoutId);
                resolve(event);
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
     * @param {Function} middleware - (event) => event | null
     */
    use(middleware) {
        if (typeof middleware !== 'function') {
            throw new Error('EventBus.use: middleware must be a function');
        }
        this.middleware.push(middleware);
    }

    /**
     * Get event history for debugging
     * @param {string} eventName - Filter by event name (optional)
     * @param {number} limit - Max number of events to return
     * @returns {Array} Array of events
     */
    getHistory(eventName, limit = 50) {
        let history = this.eventHistory;
        
        if (eventName) {
            history = history.filter(e => e.name === eventName);
        }

        return history.slice(0, limit);
    }

    /**
     * Get statistics about events
     * @returns {Object} Stats object
     */
    getStats() {
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
    clear() {
        this.listeners.clear();
        this.wildcardListeners.clear();
        if (this.debugMode) {
            console.log('[EventBus] All listeners cleared');
        }
    }

    /**
     * Reset event history and stats
     */
    reset() {
        this.eventHistory = [];
        this.stats.totalEvents = 0;
        this.stats.eventCounts.clear();
    }

    // ========================================
    // Private Methods
    // ========================================

    _createOnceHandler(eventName, handler) {
        const onceHandler = (event) => {
            handler(event);
            this.off(eventName, onceHandler);
        };
        return onceHandler;
    }

    _sortHandlersByPriority(eventName) {
        const handlers = this.listeners.get(eventName);
        if (!handlers) return;

        const handlersArray = Array.from(handlers)
            .sort((a, b) => (b._priority || 0) - (a._priority || 0));
        
        this.listeners.set(eventName, new Set(handlersArray));
    }

    _applyMiddleware(event) {
        let processedEvent = event;

        for (const middleware of this.middleware) {
            try {
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

    _addToHistory(event) {
        this.eventHistory.unshift(event);
        if (this.eventHistory.length > this.maxHistorySize) {
            this.eventHistory.pop();
        }
    }
}

export default EventBus;
