/**
 * Core Types for Navigator Event System
 */

/**
 * Event object structure passed to handlers
 */
export interface NavigatorEvent<T = any> {
  /** Event name (e.g., 'intent:navigate_left') */
  name: string;
  /** Event payload data */
  payload: T;
  /** Timestamp when event was emitted (performance.now()) */
  timestamp: number;
  /** Source of the event (plugin name, 'user', etc.) */
  source: string;
}

/**
 * Event handler function type
 */
export type EventHandler<T = any> = (event: NavigatorEvent<T>) => void;

/**
 * Event middleware function type
 * Return null to cancel event propagation
 */
export type EventMiddleware = (event: NavigatorEvent) => NavigatorEvent | null;

/**
 * Unsubscribe function returned by on() and once()
 */
export type UnsubscribeFunction = () => void;

/**
 * Options for event subscription
 */
export interface SubscriptionOptions {
  /** Auto-unsubscribe after first trigger */
  once?: boolean;
  /** Handler priority (higher = called first) */
  priority?: number;
}

/**
 * EventBus constructor options
 */
export interface EventBusOptions {
  /** Maximum number of events to keep in history */
  maxHistorySize?: number;
  /** Enable debug logging */
  debugMode?: boolean;
}

/**
 * Event statistics
 */
export interface EventStats {
  /** Total number of events emitted */
  totalEvents: number;
  /** Number of unique event names */
  uniqueEvents: number;
  /** Top 10 most frequent events */
  topEvents: Array<{ name: string; count: number }>;
  /** Listener counts per event */
  listeners: Array<{ name: string; count: number }>;
  /** Number of wildcard listeners */
  wildcardListeners: number;
}
