/**
 * combineReducers - Utility to combine multiple reducers
 *
 * Turns an object whose values are different reducer functions
 * into a single reducer function.
 */

import type { Reducer, ReducersMapObject, Action } from './types';

/**
 * Combines multiple reducers into a single reducer function
 *
 * @param reducers An object whose values correspond to different reducer functions
 * @returns A reducer function that invokes every reducer inside the reducers object
 *
 * @example
 * ```ts
 * const rootReducer = combineReducers({
 *   history: historyReducer,
 *   navigation: navigationReducer,
 *   cognitive: cognitiveReducer
 * });
 *
 * // The resulting state will be:
 * // {
 * //   history: { ... },
 * //   navigation: { ... },
 * //   cognitive: { ... }
 * // }
 * ```
 */
export function combineReducers<S>(
  reducers: ReducersMapObject<S, any>
): Reducer<S> {
  const reducerKeys = Object.keys(reducers);
  const finalReducers: any = {};

  // Filter out non-function values
  for (let i = 0; i < reducerKeys.length; i++) {
    const key = reducerKeys[i] as keyof S;

    if (typeof reducers[key] === 'function') {
      finalReducers[key] = reducers[key];
    } else {
      console.warn(
        `combineReducers: Expected reducer for key "${String(key)}" to be a function. Skipping.`
      );
    }
  }

  const finalReducerKeys = Object.keys(finalReducers) as (keyof S)[];

  // Return combined reducer
  return function combination(
    state: S | undefined = {} as S,
    action: Action
  ): S {
    let hasChanged = false;
    const nextState: any = {};

    for (let i = 0; i < finalReducerKeys.length; i++) {
      const key = finalReducerKeys[i];
      const reducer = finalReducers[key];
      const previousStateForKey = state[key];
      const nextStateForKey = reducer(previousStateForKey, action);

      if (typeof nextStateForKey === 'undefined') {
        const errorMessage = getUndefinedStateErrorMessage(key as string, action);
        throw new Error(errorMessage);
      }

      nextState[key] = nextStateForKey;
      hasChanged = hasChanged || nextStateForKey !== previousStateForKey;
    }

    // Preserve keys that aren't managed by reducers
    hasChanged =
      hasChanged || finalReducerKeys.length !== Object.keys(state as object).length;

    return hasChanged ? nextState : state;
  };
}

/**
 * Helper to generate error messages
 */
function getUndefinedStateErrorMessage(key: string, action: Action): string {
  const actionType = action && action.type;
  const actionDescription =
    (actionType && `action "${String(actionType)}"`) || 'an action';

  return (
    `Given ${actionDescription}, reducer "${key}" returned undefined. ` +
    `To ignore an action, you must explicitly return the previous state. ` +
    `If you want this reducer to hold no value, you can return null instead of undefined.`
  );
}

/**
 * Helper to validate the shape of the state
 * Useful in development to catch common mistakes
 */
export function assertReducerShape(reducers: ReducersMapObject<any>): void {
  Object.keys(reducers).forEach((key) => {
    const reducer = reducers[key];
    const initialState = reducer(undefined, { type: '@@INIT' });

    if (typeof initialState === 'undefined') {
      throw new Error(
        `Reducer "${key}" returned undefined during initialization. ` +
        `If the state passed to the reducer is undefined, you must ` +
        `explicitly return the initial state. The initial state may ` +
        `not be undefined. If you don't want to set a value for this reducer, ` +
        `you can use null instead of undefined.`
      );
    }

    const type = '@@PROBE_UNKNOWN_ACTION_' + Math.random().toString(36).substring(7);
    if (typeof reducer(undefined, { type }) === 'undefined') {
      throw new Error(
        `Reducer "${key}" returned undefined when probed with a random type. ` +
        `Don't try to handle ${type} or other actions in "redux/*" namespace. They are considered private. ` +
        `Instead, you must return the current state for any unknown actions, unless it is undefined, ` +
        `in which case you must return the initial state, regardless of the action type. ` +
        `The initial state may not be undefined, but can be null.`
      );
    }
  });
}
