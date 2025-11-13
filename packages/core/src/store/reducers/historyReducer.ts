/**
 * History Reducer
 *
 * Manages action history and time-travel debugging capabilities.
 * This is a critical reducer for debugging and understanding state changes.
 */

import type { Action, Reducer } from '../types';

/**
 * History entry capturing an action and timestamp
 */
export interface HistoryEntry {
  action: Action;
  timestamp: number;
}

/**
 * History state shape
 */
export interface HistoryState {
  /**
   * List of all actions dispatched (circular buffer, max 50 entries)
   */
  entries: HistoryEntry[];

  /**
   * Maximum number of entries to keep
   */
  maxEntries: number;

  /**
   * Total number of actions dispatched (never resets)
   */
  totalActions: number;

  /**
   * Flag to enable/disable history tracking
   */
  enabled: boolean;
}

/**
 * History action types
 */
export const HISTORY_ACTION_TYPES = {
  ENABLE: '@@history/ENABLE',
  DISABLE: '@@history/DISABLE',
  CLEAR: '@@history/CLEAR',
  SET_MAX_ENTRIES: '@@history/SET_MAX_ENTRIES',
} as const;

/**
 * Action creators for history management
 */
export const historyActions = {
  enable: () => ({ type: HISTORY_ACTION_TYPES.ENABLE } as const),
  disable: () => ({ type: HISTORY_ACTION_TYPES.DISABLE } as const),
  clear: () => ({ type: HISTORY_ACTION_TYPES.CLEAR } as const),
  setMaxEntries: (maxEntries: number) => ({
    type: HISTORY_ACTION_TYPES.SET_MAX_ENTRIES,
    payload: maxEntries,
  } as const),
};

/**
 * Initial state for history
 */
const initialState: HistoryState = {
  entries: [],
  maxEntries: 50, // Match AppState's history limit
  totalActions: 0,
  enabled: true, // Enabled by default for debugging
};

/**
 * History reducer
 *
 * Captures all actions passing through the system (except its own control actions).
 * Maintains a circular buffer of recent actions for debugging and time-travel.
 */
export const historyReducer: Reducer<HistoryState, Action> = (
  state = initialState,
  action
) => {
  // Handle history-specific actions
  switch (action.type) {
    case HISTORY_ACTION_TYPES.ENABLE:
      return {
        ...state,
        enabled: true,
      };

    case HISTORY_ACTION_TYPES.DISABLE:
      return {
        ...state,
        enabled: false,
      };

    case HISTORY_ACTION_TYPES.CLEAR:
      return {
        ...state,
        entries: [],
        totalActions: 0,
      };

    case HISTORY_ACTION_TYPES.SET_MAX_ENTRIES:
      const newMaxEntries = action.payload as number;
      if (typeof newMaxEntries !== 'number' || newMaxEntries < 1) {
        console.warn('Invalid maxEntries value, ignoring:', newMaxEntries);
        return state;
      }

      return {
        ...state,
        maxEntries: newMaxEntries,
        // Trim entries if new max is smaller
        entries: state.entries.slice(-newMaxEntries),
      };

    default:
      // Don't track internal Redux actions or history control actions
      if (
        action.type.startsWith('@@redux/') ||
        action.type.startsWith('@@history/')
      ) {
        return state;
      }

      // If history is disabled, just increment counter
      if (!state.enabled) {
        return {
          ...state,
          totalActions: state.totalActions + 1,
        };
      }

      // Add action to history
      const entry: HistoryEntry = {
        action,
        timestamp: Date.now(),
      };

      // Implement circular buffer
      const newEntries = [...state.entries, entry];
      if (newEntries.length > state.maxEntries) {
        newEntries.shift(); // Remove oldest entry
      }

      return {
        ...state,
        entries: newEntries,
        totalActions: state.totalActions + 1,
      };
  }
};

/**
 * Selectors for history state
 */
export const historySelectors = {
  /**
   * Get all history entries
   */
  getEntries: (state: HistoryState): HistoryEntry[] => state.entries,

  /**
   * Get the last N actions
   */
  getLastActions: (state: HistoryState, count: number): HistoryEntry[] =>
    state.entries.slice(-count),

  /**
   * Get total actions count
   */
  getTotalActions: (state: HistoryState): number => state.totalActions,

  /**
   * Check if history is enabled
   */
  isEnabled: (state: HistoryState): boolean => state.enabled,

  /**
   * Get actions by type
   */
  getActionsByType: (state: HistoryState, type: string): HistoryEntry[] =>
    state.entries.filter(entry => entry.action.type === type),

  /**
   * Get actions in time range
   */
  getActionsInRange: (
    state: HistoryState,
    startTime: number,
    endTime: number
  ): HistoryEntry[] =>
    state.entries.filter(
      entry => entry.timestamp >= startTime && entry.timestamp <= endTime
    ),
};
