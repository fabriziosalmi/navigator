/**
 * Store Module - Public API
 *
 * This is the main entry point for the Redux-like store system.
 * It exports everything needed to use the store throughout the application.
 */

// Core store functions
export { createStore } from './createStore';
export { combineReducers, assertReducerShape } from './combineReducers';

// Types
export type {
  Action,
  Reducer,
  Store,
  Dispatch,
  Listener,
  Unsubscribe,
  Middleware,
  MiddlewareAPI,
  StoreEnhancer,
  StoreCreator,
  ActionCreator,
  ReducersMapObject,
} from './types';

export { isAction } from './types';

// Root reducer and state
export { rootReducer, type RootState } from './reducers';

// History reducer and utilities
export {
  historyReducer,
  historyActions,
  historySelectors,
  HISTORY_ACTION_TYPES,
  type HistoryState,
  type HistoryEntry,
} from './reducers/historyReducer';

// Navigation reducer and actions (Sprint 2)
export {
  navigationReducer,
  navigationActions,
  type NavigationState,
} from './reducers/navigationReducer';

// Placeholder reducers (will be replaced in future sprints)
export {
  cognitiveReducer,
  uiReducer,
  sessionReducer,
  uiActions, // Example actions to test the system
  type CognitiveState,
  type UIState,
  type SessionState,
} from './reducers/placeholderReducer';
