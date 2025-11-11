/**
 * Root Reducer
 *
 * Combines all reducers into a single root reducer that manages
 * the entire application state tree.
 */

import { combineReducers } from '../combineReducers';
import { historyReducer, type HistoryState } from './historyReducer';
import { 
  navigationReducer, 
  navigationActions,
  type NavigationState 
} from './navigationReducer';
import {
  cognitiveReducer,
  uiReducer,
  sessionReducer,
  type CognitiveStateSlice,
  type UIState,
  type SessionState,
} from './placeholderReducer';

/**
 * Root state shape
 *
 * This represents the complete state tree of the application.
 * Each key corresponds to a slice managed by a specific reducer.
 */
export interface RootState {
  /**
   * Action history for debugging and time-travel
   */
  history: HistoryState;

  /**
   * Navigation state (card position, layer, etc.)
   */
  navigation: NavigationState;

  /**
   * Cognitive model state (user profiling, adaptation)
   */
  cognitive: CognitiveStateSlice;

  /**
   * UI state (theme, debug mode, overlays)
   */
  ui: UIState;

  /**
   * Session state (tracking, analytics)
   */
  session: SessionState;
}

/**
 * Root reducer combining all slice reducers
 */
export const rootReducer = combineReducers<RootState>({
  history: historyReducer,
  navigation: navigationReducer,
  cognitive: cognitiveReducer,
  ui: uiReducer,
  session: sessionReducer,
});

/**
 * Export all state types for convenience
 */
export type {
  HistoryState,
  NavigationState,
  CognitiveStateSlice,
  UIState,
  SessionState,
};

/**
 * Export individual reducers (useful for testing)
 */
export {
  historyReducer,
  navigationReducer,
  navigationActions,
  cognitiveReducer,
  uiReducer,
  sessionReducer,
};
