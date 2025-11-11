/**
 * @file Reducer.ts
 * @description Core Reducer type definitions for Redux-style store
 * 
 * Defines the foundational types for all reducers in the Navigator system.
 * Reducers are pure functions that take (state, action) and return new state.
 * 
 * @see https://redux.js.org/usage/usage-with-typescript
 */

import type { Action } from './Action';

/**
 * Reducer Function
 * 
 * A pure function that:
 * 1. Takes current state and an action
 * 2. Returns new state (MUST NOT mutate original state)
 * 3. Has NO side effects
 * 
 * @template S - State type
 * @template A - Action type (defaults to any Action)
 * 
 * @param state - Current state (undefined on first call)
 * @param action - Dispatched action
 * @returns New state
 * 
 * @example
 * ```ts
 * const counterReducer: Reducer<number, CounterActions> = (state = 0, action) => {
 *   switch (action.type) {
 *     case 'counter/INCREMENT':
 *       return state + 1;
 *     default:
 *       return state;
 *   }
 * };
 * ```
 */
export type Reducer<S = any, A extends Action = Action> = (
  state: S | undefined,
  action: A
) => S;

/**
 * Reducers Map
 * 
 * Object mapping slice names to their reducers.
 * Used by combineReducers to create the root reducer.
 * 
 * @template S - Combined state shape
 * @template A - Action type
 */
export type ReducersMapObject<S = any, A extends Action = Action> = {
  [K in keyof S]: Reducer<S[K], A>;
};

/**
 * Slice Reducer
 * 
 * A reducer responsible for a single "slice" of the store state.
 * 
 * @template S - Slice state type
 * @template A - Slice action type
 */
export type SliceReducer<S = any, A extends Action = Action> = Reducer<S, A>;

/**
 * Combine Reducers Utility Type
 * 
 * Infers the combined state shape from a map of reducers.
 * 
 * @template R - Reducers map object
 */
export type CombinedState<R extends ReducersMapObject> = {
  [K in keyof R]: R[K] extends Reducer<infer S, any> ? S : never;
};

/**
 * Reducer Action Type
 * 
 * Extracts the action type from a reducer signature.
 */
export type ReducerAction<R extends Reducer> = R extends Reducer<any, infer A> ? A : never;

/**
 * Reducer State Type
 * 
 * Extracts the state type from a reducer signature.
 */
export type ReducerState<R extends Reducer> = R extends Reducer<infer S, any> ? S : never;

/**
 * Preloaded State Type
 * 
 * Partial state used for hydration (e.g., from localStorage).
 * All slices are optional to support partial hydration.
 * 
 * @template S - Full state shape
 */
export type PreloadedState<S> = {
  [K in keyof S]?: S[K] extends object ? Partial<S[K]> : S[K];
};

/**
 * Reducer Enhancement
 * 
 * A higher-order function that wraps a reducer to add functionality.
 * 
 * @template S - State type
 * @template A - Action type
 * 
 * @example
 * ```ts
 * const loggingEnhancer: ReducerEnhancer = (reducer) => {
 *   return (state, action) => {
 *     console.log('Before:', state);
 *     const newState = reducer(state, action);
 *     console.log('After:', newState);
 *     return newState;
 *   };
 * };
 * ```
 */
export type ReducerEnhancer<S = any, A extends Action = Action> = (
  reducer: Reducer<S, A>
) => Reducer<S, A>;

/**
 * Reducer Builder Pattern (for complex slice definitions)
 * 
 * Provides a fluent API for building reducers.
 * Inspired by Redux Toolkit's createSlice.
 */
export interface ReducerBuilder<S, A extends Action = Action> {
  /**
   * Add a case handler for a specific action type
   */
  addCase<T extends A['type']>(
    type: T,
    reducer: (state: S, action: Extract<A, { type: T }>) => S | void
  ): this;

  /**
   * Add a matcher-based handler
   */
  addMatcher<M extends A>(
    matcher: (action: A) => action is M,
    reducer: (state: S, action: M) => S | void
  ): this;

  /**
   * Add a default handler (for unmatched actions)
   */
  addDefaultCase(reducer: (state: S, action: A) => S | void): this;

  /**
   * Build the final reducer function
   */
  build(): Reducer<S, A>;
}

/**
 * Immutability Helper
 * 
 * Marks an object type as deeply readonly to enforce immutability.
 */
export type Immutable<T> = {
  readonly [K in keyof T]: T[K] extends object ? Immutable<T[K]> : T[K];
};

/**
 * Draft State (for Immer-style mutations)
 * 
 * Allows "mutations" that are actually tracked and produce immutable updates.
 * Used by middleware that provides Immer-like APIs.
 */
export type Draft<T> = T;

/**
 * Case Reducer
 * 
 * A reducer function for a specific action type.
 * Allows void return for Immer-style drafts.
 * 
 * @template S - State type
 * @template A - Action type
 */
export type CaseReducer<S = any, A extends Action = Action> = (
  state: Draft<S>,
  action: A
) => S | void;

/**
 * Case Reducers Map
 * 
 * Object mapping action types to their case reducers.
 */
export type CaseReducersMapObject<S, A extends Action = Action> = {
  [T in A['type']]?: CaseReducer<S, Extract<A, { type: T }>>;
};
