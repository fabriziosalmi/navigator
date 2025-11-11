/**
 * @file Store.ts
 * @description Core Store type definitions for Redux-style architecture
 * 
 * Defines the Store interface, Middleware API, and related types.
 * The Store is the single source of truth for application state.
 * 
 * @see https://redux.js.org/usage/usage-with-typescript
 */

import type { Action } from './Action';
import type { Reducer } from './Reducer';

/**
 * Dispatch Function
 * 
 * Function that accepts an action and triggers state update.
 * Can be extended by middleware to accept other types (e.g., thunks).
 * 
 * @template A - Action type
 */
export interface Dispatch<A extends Action = Action> {
  <T extends A>(action: T): T;
}

/**
 * Unsubscribe Function
 * 
 * Function returned by store.subscribe() to remove the listener.
 */
export type Unsubscribe = () => void;

/**
 * Store Listener
 * 
 * Callback function invoked whenever state changes.
 */
export type StoreListener = () => void;

/**
 * Store Interface
 * 
 * The central state container.
 * Holds the application state and provides methods to interact with it.
 * 
 * @template S - State type
 * @template A - Action type
 * @template E - Extension types (for enhanced stores)
 * 
 * @example
 * ```ts
 * const store: Store<RootState, RootAction> = createStore(rootReducer);
 * 
 * // Get current state
 * const state = store.getState();
 * 
 * // Dispatch action
 * store.dispatch({ type: 'navigation/NAVIGATE', payload: { direction: 'left' } });
 * 
 * // Subscribe to changes
 * const unsubscribe = store.subscribe(() => {
 *   console.log('State changed:', store.getState());
 * });
 * ```
 */
export interface Store<S = any, A extends Action = Action, E = {}> {
  /**
   * Get current state snapshot
   * 
   * @returns Current state (MUST NOT be mutated)
   */
  getState(): S;

  /**
   * Dispatch an action to trigger state update
   * 
   * @param action - Action to dispatch
   * @returns The dispatched action (for middleware chaining)
   */
  dispatch: Dispatch<A>;

  /**
   * Subscribe to state changes
   * 
   * Listener is called AFTER state has been updated.
   * Listeners are called in the order they were added.
   * 
   * @param listener - Callback to invoke on state change
   * @returns Unsubscribe function
   */
  subscribe(listener: StoreListener): Unsubscribe;

  /**
   * Replace the current reducer
   * 
   * Used for hot module replacement and code splitting.
   * 
   * @param nextReducer - New reducer to use
   */
  replaceReducer(nextReducer: Reducer<S, A>): void;

  /**
   * Extension point for store enhancers
   * Note: Symbol.observable is an ES proposal, typed as string for compatibility
   */
  ['@@observable']?: () => Observable<S>;
}

/**
 * Observable Interface (for RxJS integration)
 */
export interface Observable<T> {
  subscribe(observer: Observer<T>): { unsubscribe: Unsubscribe };
}

export interface Observer<T> {
  next?(value: T): void;
}

/**
 * Middleware API
 * 
 * Object passed to middleware with access to dispatch and getState.
 * 
 * @template S - State type
 * @template A - Action type
 */
export interface MiddlewareAPI<S = any, A extends Action = Action> {
  /**
   * Dispatch function (can dispatch to other middleware)
   */
  dispatch: Dispatch<A>;

  /**
   * Get current state
   */
  getState(): S;
}

/**
 * Middleware Function
 * 
 * A composable function that intercepts actions before they reach the reducer.
 * Can:
 * - Inspect actions
 * - Dispatch other actions
 * - Delay/skip actions
 * - Transform actions
 * - Add side effects
 * 
 * @template S - State type
 * @template A - Action type
 * 
 * Signature: (store) => (next) => (action) => result
 * 
 * @example
 * ```ts
 * const logger: Middleware = (store) => (next) => (action) => {
 *   console.log('Dispatching:', action);
 *   const result = next(action);
 *   console.log('New state:', store.getState());
 *   return result;
 * };
 * ```
 */
export interface Middleware<S = any, A extends Action = Action> {
  (api: MiddlewareAPI<S, A>): (next: Dispatch<A>) => (action: A) => any;
}

/**
 * Store Enhancer
 * 
 * A higher-order function that enhances the store creator.
 * Used to add capabilities like middleware, dev tools, etc.
 * 
 * @example
 * ```ts
 * const enhancer: StoreEnhancer = (createStore) => (reducer, preloadedState) => {
 *   const store = createStore(reducer, preloadedState);
 *   // Add enhancements...
 *   return store;
 * };
 * ```
 */
export type StoreEnhancer<E = {}> = (
  next: StoreEnhancerStoreCreator
) => StoreEnhancerStoreCreator<E>;

/**
 * Store Creator Function
 */
export interface StoreEnhancerStoreCreator<E = {}> {
  <S = any, A extends Action = Action>(
    reducer: Reducer<S, A>,
    preloadedState?: PreloadedState<S>
  ): Store<S, A, E>;
}

/**
 * Preloaded State (from Reducer.ts for convenience)
 */
export type PreloadedState<S> = {
  [K in keyof S]?: S[K] extends object ? Partial<S[K]> : S[K];
};

/**
 * Store Configuration
 * 
 * Options for creating a store.
 */
export interface StoreConfig<S = any, A extends Action = Action> {
  /**
   * Root reducer
   */
  reducer: Reducer<S, A>;

  /**
   * Initial state (for hydration)
   */
  preloadedState?: PreloadedState<S>;

  /**
   * Middleware array
   */
  middleware?: Middleware<S, A>[];

  /**
   * Store enhancers
   */
  enhancers?: StoreEnhancer[];

  /**
   * Enable Redux DevTools
   */
  devTools?: boolean;
}

/**
 * Store Creator
 * 
 * Function that creates a store instance.
 */
export interface StoreCreator {
  <S, A extends Action = Action>(
    config: StoreConfig<S, A>
  ): Store<S, A>;
}

/**
 * Thunk Action (for async operations)
 * 
 * A function that can be dispatched if thunk middleware is applied.
 * Has access to dispatch and getState.
 * 
 * @template S - State type
 * @template A - Action type
 * @template R - Return type
 */
export type ThunkAction<
  R = void,
  S = any,
  E = undefined,
  A extends Action = Action
> = (
  dispatch: Dispatch<A>,
  getState: () => S,
  extraArgument: E
) => R;

/**
 * Thunk Middleware Type
 */
export interface ThunkMiddleware<S = any, A extends Action = Action, E = undefined> {
  (api: MiddlewareAPI<S, A>): (
    next: Dispatch<A>
  ) => (action: A | ThunkAction<any, S, E, A>) => any;
}
