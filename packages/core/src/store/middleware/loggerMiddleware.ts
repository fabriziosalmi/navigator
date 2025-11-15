/**
 * loggerMiddleware - Development Debugging Middleware
 *
 * Logs every action dispatched to the store with:
 * - Previous state (before action)
 * - The action itself
 * - Next state (after action)
 *
 * Uses color-coded console groups for readability.
 * Should only be used in development environments.
 *
 * @example
 * ```ts
 * const store = createStore(
 *   rootReducer,
 *   applyMiddleware(loggerMiddleware)
 * );
 * ```
 */

import type { Middleware } from '../applyMiddleware';

/**
 * Configuration options for the logger middleware
 */
export interface LoggerMiddlewareOptions {
  /**
   * Whether to collapse the log groups by default
   * @default false
   */
  collapsed?: boolean;

  /**
   * Custom logger instance (useful for testing or custom loggers)
   * @default console
   */
  logger?: Console;

  /**
   * Predicate function to filter which actions to log
   * @default () => true (log all actions)
   */
  predicate?: (state: any, action: any) => boolean;

  /**
   * Whether to log state diffs instead of full state
   * @default false
   */
  diff?: boolean;
}

/**
 * Default logger options
 */
const defaultOptions: LoggerMiddlewareOptions = {
    collapsed: false,
    logger: console,
    predicate: () => true,
    diff: false
};

/**
 * Create a logger middleware with custom options
 *
 * @param options Configuration options
 * @returns Configured logger middleware
 */
export function createLoggerMiddleware(
    options: LoggerMiddlewareOptions = {}
): Middleware {
    const opts = { ...defaultOptions, ...options };
    const logger = opts.logger!;

    return (store) => (next) => (action) => {
    // Check if we should log this action
        if (!opts.predicate!(store.getState(), action)) {
            return next(action);
        }

        // Capture state before action
        const prevState = store.getState();

        // Start console group (collapsed or expanded)
        const groupMethod = opts.collapsed ? logger.groupCollapsed : logger.group;
        groupMethod.call(logger, `Action: ${action.type}`);

        // Log previous state
        logger.log(
            '%c Previous State',
            'color: #9E9E9E; font-weight: bold;',
            prevState
        );

        // Log the action
        logger.log(
            '%c Action',
            'color: #03A9F4; font-weight: bold;',
            action
        );

        // Execute the action
        const result = next(action);

        // Capture state after action
        const nextState = store.getState();

        // Log next state
        logger.log(
            '%c Next State',
            'color: #4CAF50; font-weight: bold;',
            nextState
        );

        // Optional: Log state diff
        if (opts.diff) {
            logger.log(
                '%c Diff',
                'color: #E040FB; font-weight: bold;',
                getStateDiff(prevState, nextState)
            );
        }

        // End console group
        logger.groupEnd();

        return result;
    };
}

/**
 * Default logger middleware instance
 * Uses default options and only logs in development
 */
export const loggerMiddleware: Middleware = createLoggerMiddleware({
    collapsed: false,
    predicate: () => {
    // Only log in development (when process.env.NODE_ENV is not production)
    // In browser environments without process, default to true
        if (typeof process !== 'undefined' && process.env) {
            return process.env.NODE_ENV !== 'production';
        }
        return true;
    }
});

/**
 * Simple state diff calculator
 * Returns an object showing what changed between two states
 *
 * @param prev Previous state
 * @param next Next state
 * @returns Object with added, updated, and deleted keys
 */
function getStateDiff(prev: any, next: any): any {
    if (typeof prev !== 'object' || typeof next !== 'object') {
        return { prev, next };
    }

    const diff: any = {};
    const allKeys = new Set([
        ...Object.keys(prev || {}),
        ...Object.keys(next || {})
    ]);

    allKeys.forEach((key) => {
        const prevValue = prev?.[key];
        const nextValue = next?.[key];

        if (prevValue === nextValue) {
            // No change
            return;
        }

        if (!(key in prev)) {
            // Added
            diff[key] = { type: 'added', value: nextValue };
        } else if (!(key in next)) {
            // Deleted
            diff[key] = { type: 'deleted', value: prevValue };
        } else {
            // Updated
            diff[key] = { type: 'updated', prev: prevValue, next: nextValue };
        }
    });

    return diff;
}

/**
 * Example usage with custom options:
 *
 * ```ts
 * // Log only navigation actions
 * const navLogger = createLoggerMiddleware({
 *   predicate: (state, action) => action.type.startsWith('navigation/'),
 *   collapsed: true,
 * });
 *
 * // Log with state diffs
 * const diffLogger = createLoggerMiddleware({
 *   diff: true,
 * });
 *
 * // Custom logger (for testing)
 * const testLogger = createLoggerMiddleware({
 *   logger: customLogger,
 * });
 * ```
 */
