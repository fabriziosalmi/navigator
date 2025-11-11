/**
 * @file index.ts
 * @description Store types barrel export
 * 
 * Central export point for all Redux-style store type definitions.
 * Import from here to access Action, Reducer, Store, State, and Middleware types.
 * 
 * @example
 * ```ts
 * import type { Store, Action, Reducer, RootState, Middleware } from '@navigator.menu/types/store';
 * ```
 */

// Action types
export type {
  BaseAction,
  PayloadAction,
  ErrorAction,
  MetaAction,
  Action,
  ActionCreator,
  AsyncActionCreator,
  ActionType,
  ActionsUnion,
} from './Action';

export {
  isPayloadAction,
  isErrorAction,
  isMetaAction,
} from './Action';

// Reducer types
export type {
  Reducer,
  ReducersMapObject,
  SliceReducer,
  CombinedState,
  ReducerAction,
  ReducerState,
  PreloadedState,
  ReducerEnhancer,
  ReducerBuilder,
  Immutable,
  Draft,
  CaseReducer,
  CaseReducersMapObject,
} from './Reducer';

// Store types
export type {
  Dispatch,
  Unsubscribe,
  StoreListener,
  Store,
  Observable,
  Observer,
  MiddlewareAPI,
  Middleware,
  StoreEnhancer,
  StoreEnhancerStoreCreator,
  StoreConfig,
  StoreCreator,
  ThunkAction,
  ThunkMiddleware,
} from './Store';

// State types
export type {
  // Navigation (direction and source are re-exported from actions/navigation.ts)
  NavigationHistoryEntry,
  NavigationState,
  
  // Cognitive
  CognitiveStateType,
  CognitiveSignal,
  CognitiveMetrics,
  CognitiveState,
  
  // Input
  KeyboardInputState,
  GestureInputState,
  VoiceInputState,
  InputState,
  
  // UI
  UIError,
  ThemeType,
  UIState,
  
  // Root
  RootState,
  SliceState,
  DeepPartial,
  PreloadedRootState,
} from './State';

export {
  // Initial states
  navigationInitialState,
  cognitiveInitialState,
  inputInitialState,
  uiInitialState,
  rootInitialState,
  
  // Type guards
  isRootState,
} from './State';

