/**
 * @navigator.menu/core
 * 
 * Core event-driven architecture for Navigator
 * 
 * @module @navigator.menu/core
 */

export { EventBus } from './EventBus';
export { AppState } from './AppState';
export { NavigatorCore } from './NavigatorCore';
export { UserSessionHistory } from './intelligence/UserSessionHistory';
export type { Action, SessionMetrics } from './intelligence/UserSessionHistory';

// Store (Sprint 1)
export { createStore, combineReducers } from './store';
export { rootReducer, historyActions, historySelectors, uiActions, navigationActions } from './store';
export { keyPress, keyRelease, gestureDetected, voiceCommand, INPUT_ACTIONS } from './store';

// Actions (Sprint 2 & 3)
export { navigate, NAVIGATE } from './actions/navigation';
export type { NavigateAction, NavigatePayload, NavigationDirection, NavigationSource } from './actions/navigation';

// Cognitive Model Types
export type { CognitiveState, CognitiveStateChangePayload, IntentPredictionPayload } from './types/cognitive';

// Core-specific types
export type {
  NavigatorEvent,
  EventHandler,
  EventMiddleware,
  UnsubscribeFunction,
  SubscriptionOptions,
  EventBusOptions,
  EventStats
} from './types';
export type {
  NavigatorState,
  ComputedProperties
} from './AppState';
export type {
  NavigatorCoreConfig,
  INavigatorPlugin,
  PluginOptions
} from './NavigatorCore';

// Redux-like Store types (v3.1+)
export type {
  Action as StoreAction,
  Reducer,
  Store,
  Dispatch,
  Listener,
  Unsubscribe,
  Middleware,
  MiddlewareAPI,
  StoreEnhancer,
  RootState,
  HistoryState,
  HistoryEntry,
  NavigationState,
  CognitiveState as CognitiveStoreState,
  UIState,
  SessionState,
} from './store';

