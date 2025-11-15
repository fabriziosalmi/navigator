/**
 * Redux-like Store Types for Navigator SDK
 *
 * This module defines the core types for our unidirectional data flow architecture.
 * It provides a lightweight Redux-like implementation tailored for Navigator's needs.
 */

/**
 * Base action interface
 * All actions must have a type property
 */
export interface Action<T = any> {
  type: string;
  payload?: T;
  metadata?: {
    source?: string;
    timestamp?: number;
    [key: string]: any;
  };
}

/**
 * Reducer function type
 * Takes current state and action, returns new state
 */
export type Reducer<S = any, A extends Action = Action> = (
  state: S | undefined,
  action: A
) => S;

/**
 * Map of reducers for combining
 */
export type ReducersMapObject<S = any, A extends Action = Action> = {
  [K in keyof S]: Reducer<S[K], A>;
};

/**
 * Listener function that gets called when state changes
 */
export type Listener = () => void;

/**
 * Unsubscribe function returned by subscribe
 */
export type Unsubscribe = () => void;

/**
 * Middleware function type
 * Can intercept actions before they reach reducers
 */
export type Middleware<S = any> = (
  store: MiddlewareAPI<S>
) => (next: Dispatch) => (action: Action) => any;

/**
 * Middleware API - subset of Store exposed to middleware
 */
export interface MiddlewareAPI<S = any> {
  getState(): S;
  dispatch: Dispatch;
}

/**
 * Dispatch function type
 */
export type Dispatch<A extends Action = Action> = (action: A) => A;

/**
 * Store interface
 * Core of the Redux-like architecture
 */
export interface Store<S = any, A extends Action = Action> {
  /**
   * Get current state
   */
  getState(): S;

  /**
   * Dispatch an action to update state
   */
  dispatch(action: A): A;

  /**
   * Subscribe to state changes
   * Returns unsubscribe function
   */
  subscribe(listener: Listener): Unsubscribe;

  /**
   * Replace the reducer (for hot module replacement, etc.)
   */
  replaceReducer(nextReducer: Reducer<S, A>): void;
}

/**
 * Store enhancer type
 * Can wrap createStore to add capabilities
 */
export type StoreEnhancer<Ext = {}, StateExt = {}> = (
  next: StoreCreator
) => StoreCreator<Ext, StateExt>;

/**
 * Store creator function type
 */
export interface StoreCreator<Ext = {}, StateExt = {}> {
  <S, A extends Action>(
    reducer: Reducer<S, A>,
    preloadedState?: S,
    enhancer?: StoreEnhancer<Ext, StateExt>
  ): Store<S & StateExt, A> & Ext;
}

/**
 * Action creators helper type
 */
export type ActionCreator<T = any> = (...args: any[]) => Action<T>;

/**
 * Type guard for actions
 */
export function isAction(obj: any): obj is Action {
    return (
        typeof obj === 'object' &&
    obj !== null &&
    typeof obj.type === 'string'
    );
}
