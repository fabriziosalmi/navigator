import type { Action, SessionMetrics } from '@navigator.menu/types';

/**
 * UserSessionHistory - The "Memory System"
 * 
 * A circular buffer that maintains a rolling history of user actions.
 * This is the foundation for cognitive modeling and intent prediction.
 * 
 * @example
 * ```ts
 * const history = new UserSessionHistory(100);
 * history.add({
 *   id: nanoid(),
 *   timestamp: performance.now(),
 *   type: 'intent:navigate',
 *   success: true,
 *   duration_ms: 350
 * });
 * 
 * const metrics = history.getMetrics(20);
 * console.log(metrics.errorRate); // 0.15
 * ```
 */
export class UserSessionHistory {
  private buffer: Action[] = [];
  private maxSize: number;

  /**
   * Creates a new session history buffer
   * @param maxSize Maximum number of actions to retain (default: 100)
   */
  constructor(maxSize: number = 100) {
    this.maxSize = maxSize;
  }

  /**
   * Add an action to the history
   * Automatically removes oldest action if buffer exceeds maxSize
   * @param action The action to record
   */
  add(action: Action): void {
    this.buffer.push(action);
    
    // Remove oldest if we exceed max size
    if (this.buffer.length > this.maxSize) {
      this.buffer.shift();
    }
  }

  /**
   * Get the most recent N actions
   * @param count Number of actions to retrieve
   * @returns Array of actions (most recent last)
   */
  getLatest(count: number): Action[] {
    return this.buffer.slice(-count);
  }

  /**
   * Calculate metrics over a sliding window of recent actions
   * This is the key method for cognitive analysis
   * 
   * @param windowSize Number of recent actions to analyze
   * @returns Calculated metrics for the window
   */
  getMetrics(windowSize: number): SessionMetrics {
    const window = this.getLatest(windowSize);
    const total = window.length;

    if (total === 0) {
      return {
        errorRate: 0,
        recentErrors: 0,
        averageDuration: 0,
        actionVariety: 0,
        totalActions: 0,
        timeWindow: 0,
      };
    }

    // Calculate error rate
    const errors = window.filter(a => !a.success);
    const errorRate = errors.length / total;
    const recentErrors = errors.length;

    // Calculate average duration (only for actions with duration)
    const actionsWithDuration = window.filter(a => a.duration_ms !== undefined);
    const averageDuration = actionsWithDuration.length > 0
      ? actionsWithDuration.reduce((sum, a) => sum + (a.duration_ms || 0), 0) / actionsWithDuration.length
      : 0;

    // Calculate action variety (unique action types)
    const uniqueTypes = new Set(window.map(a => a.type));
    const actionVariety = uniqueTypes.size;

    // Calculate time window
    const timeWindow = total > 1
      ? window[window.length - 1].timestamp - window[0].timestamp
      : 0;

    return {
      errorRate,
      recentErrors,
      averageDuration,
      actionVariety,
      totalActions: total,
      timeWindow,
    };
  }

  /**
   * Get all actions in the buffer
   * @returns Complete action history
   */
  getAll(): Action[] {
    return [...this.buffer];
  }

  /**
   * Clear all history
   */
  clear(): void {
    this.buffer = [];
  }

  /**
   * Get current buffer size
   */
  size(): number {
    return this.buffer.length;
  }
}
