/**
 * @file Action.ts
 * @description Core Action type definitions for Redux-style store
 * 
 * Defines the foundational types for all actions in the Navigator system.
 * Every action in the system must conform to these interfaces.
 * 
 * @see https://redux.js.org/usage/usage-with-typescript
 */

/**
 * Base Action Interface (FSA - Flux Standard Action)
 * 
 * All actions MUST have a type property.
 * Actions SHOULD be serializable.
 * 
 * @template T - The action type string literal
 */
export interface BaseAction<T extends string = string> {
  /**
   * Action type identifier (MUST be unique across the system)
   * Convention: 'domain/ACTION_NAME' (e.g., 'navigation/NAVIGATE', 'cognitive/STATE_CHANGE')
   */
  type: T;
}

/**
 * Action with Payload (FSA-compliant)
 * 
 * Used for actions that carry data.
 * Payload SHOULD be serializable (no functions, Symbols, etc.)
 * 
 * @template T - Action type string literal
 * @template P - Payload type
 * 
 * @example
 * ```ts
 * type NavigateAction = PayloadAction<'navigation/NAVIGATE', { direction: 'left' }>;
 * ```
 */
export interface PayloadAction<T extends string = string, P = any> extends BaseAction<T> {
  /**
   * Action data
   */
  payload: P;
}

/**
 * Action with Error (FSA-compliant)
 * 
 * Used for actions that represent errors or failures.
 * 
 * @template T - Action type string literal
 * @template E - Error payload type
 */
export interface ErrorAction<T extends string = string, E = Error> extends BaseAction<T> {
  /**
   * Error flag (MUST be true for error actions)
   */
  error: true;
  
  /**
   * Error information
   */
  payload: E;
}

/**
 * Action with Metadata (FSA-compliant)
 * 
 * Used for actions that need additional context without polluting the payload.
 * 
 * @template T - Action type string literal
 * @template P - Payload type
 * @template M - Metadata type
 */
export interface MetaAction<T extends string = string, P = any, M = any> extends PayloadAction<T, P> {
  /**
   * Additional metadata (for tracing, analytics, debugging)
   */
  meta: M;
}

/**
 * Generic Action Type
 * 
 * Union of all possible action shapes.
 * Use this when you need to accept any action type.
 */
export type Action = 
  | BaseAction
  | PayloadAction
  | ErrorAction
  | MetaAction;

/**
 * Action Creator Function
 * 
 * A function that creates an action.
 * 
 * @template A - The action type it creates
 * 
 * @example
 * ```ts
 * const navigate: ActionCreator<NavigateAction> = (direction) => ({
 *   type: 'navigation/NAVIGATE',
 *   payload: { direction }
 * });
 * ```
 */
export type ActionCreator<A extends Action = Action> = (...args: any[]) => A;

/**
 * Async Action Creator (for middleware like thunks)
 * 
 * A function that returns a promise of an action.
 * Used by middleware to handle async operations.
 * 
 * @template A - The action type it eventually creates
 */
export type AsyncActionCreator<A extends Action = Action> = (...args: any[]) => Promise<A>;

/**
 * Action Type Helper
 * 
 * Extracts the type string from an action creator.
 * 
 * @example
 * ```ts
 * type NavType = ActionType<typeof navigate>; // 'navigation/NAVIGATE'
 * ```
 */
export type ActionType<AC extends ActionCreator> = ReturnType<AC>['type'];

/**
 * Action Union Helper
 * 
 * Creates a union type from multiple action creators.
 * Useful for reducer type definitions.
 * 
 * @example
 * ```ts
 * type NavigationActions = ActionsUnion<typeof navigate | typeof reset>;
 * ```
 */
export type ActionsUnion<AC extends ActionCreator> = ReturnType<AC>;

/**
 * Type guard for payload actions
 */
export function isPayloadAction<T extends string, P>(
  action: Action
): action is PayloadAction<T, P> {
  return 'payload' in action && !('error' in action);
}

/**
 * Type guard for error actions
 */
export function isErrorAction<T extends string, E>(
  action: Action
): action is ErrorAction<T, E> {
  return 'error' in action && action.error === true;
}

/**
 * Type guard for meta actions
 */
export function isMetaAction<T extends string, P, M>(
  action: Action
): action is MetaAction<T, P, M> {
  return 'payload' in action && 'meta' in action;
}
