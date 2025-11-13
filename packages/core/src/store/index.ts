/**
 * Store Module - Public API
 *
 * This is the main entry point for the Redux-like store system.
 * It exports everything needed to use the store throughout the application.
 */

// Core store functions
export { createStore } from './createStore';
export { combineReducers, assertReducerShape } from './combineReducers';
export { applyMiddleware } from './applyMiddleware';
export type { Middleware, MiddlewareAPI } from './applyMiddleware';

// Middleware implementations
export { createCognitiveMiddleware } from './middleware/cognitiveMiddleware';
export type { 
  CognitiveState,
  CognitiveStateChangeAction,
  CognitiveMiddlewareConfig
} from './middleware/cognitiveMiddleware';

export { 
  loggerMiddleware, 
  createLoggerMiddleware 
} from './middleware/loggerMiddleware';
export type { LoggerMiddlewareOptions } from './middleware/loggerMiddleware';

// Types
export type {
  Action,
  Reducer,
  Store,
  Dispatch,
  Listener,
  Unsubscribe,
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

// Input reducer and actions (Sprint 3)
export {
  inputReducer,
  INPUT_ACTIONS,
  keyPress,
  keyRelease,
  gestureDetected,
  voiceCommand,
  type InputState,
  type KeyboardInputState,
  type GestureInputState,
  type VoiceInputState,
} from './reducers/inputReducer';

// Placeholder reducers (will be replaced in future sprints)
export {
  cognitiveReducer,
  uiReducer,
  sessionReducer,
  uiActions, // Example actions to test the system
  type CognitiveStateSlice,
  type UIState,
  type SessionState,
} from './reducers/placeholderReducer';
