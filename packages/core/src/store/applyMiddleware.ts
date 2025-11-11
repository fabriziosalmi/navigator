/**
 * applyMiddleware - Redux-style Middleware Composer
 * 
 * Creates a store enhancer that applies middleware to the dispatch method.
 * Middleware is the standard way to extend Redux with custom functionality.
 * 
 * Philosophy: "Intercept, Transform, Forward"
 * - Each middleware can inspect, delay, or transform actions
 * - Middleware forms a pipeline: action → MW1 → MW2 → ... → reducer
 * - Enables cross-cutting concerns (logging, analytics, async, etc.)
 * 
 * @example
 * ```ts
 * const store = createStore(
 *   rootReducer,
 *   applyMiddleware(
 *     loggingMiddleware,
 *     cognitiveMiddleware,
 *     analyticsMiddleware
 *   )
 * );
 * ```
 */

import type { Store, Action, StoreEnhancer } from './types';

/**
 * Middleware function signature
 * store => next => action => result
 */
export type Middleware<S = any, A extends Action = Action> = (
  store: MiddlewareAPI<S, A>
) => (
  next: (action: A) => any
) => (
  action: A
) => any;

/**
 * Middleware API exposed to middleware functions
 */
export interface MiddlewareAPI<S, A extends Action> {
  getState: () => S;
  dispatch: (action: A) => any;
}

/**
 * Composes middleware into a store enhancer
 * 
 * @param middlewares Array of middleware functions
 * @returns A store enhancer that applies the middleware
 * 
 * @example
 * ```ts
 * const logger = store => next => action => {
 *   console.log('dispatching', action);
 *   const result = next(action);
 *   console.log('next state', store.getState());
 *   return result;
 * };
 * 
 * const store = createStore(
 *   reducer,
 *   applyMiddleware(logger)
 * );
 * ```
 */
export function applyMiddleware<S, A extends Action>(
  ...middlewares: Middleware<S, A>[]
): StoreEnhancer {
  return (createStore: any) => (reducer: any, preloadedState?: any) => {
    // Create the base store
    const store = createStore(reducer, preloadedState);
    
    // Temporary dispatch that throws if called during middleware setup
    let dispatch: any = () => {
      throw new Error(
        'Dispatching while constructing your middleware is not allowed. ' +
        'Other middleware would not be applied to this dispatch.'
      );
    };

    // API exposed to middleware
    const middlewareAPI: MiddlewareAPI<S, A> = {
      getState: store.getState,
      dispatch: (action: A, ...args: any[]) => dispatch(action, ...args),
    };

    // Apply each middleware to the chain
    const chain = middlewares.map(middleware => middleware(middlewareAPI));
    
    // Compose middleware chain
    // Right-to-left composition: [MW1, MW2, MW3] => MW1(MW2(MW3(store.dispatch)))
    dispatch = compose(...chain)(store.dispatch);

    return {
      ...store,
      dispatch,
    };
  };
}

/**
 * Right-to-left function composition
 * compose(f, g, h) => (...args) => f(g(h(...args)))
 * 
 * @param funcs Functions to compose
 * @returns Composed function
 * 
 * @example
 * ```ts
 * const add1 = x => x + 1;
 * const mult2 = x => x * 2;
 * const composed = compose(mult2, add1);
 * composed(5); // (5 + 1) * 2 = 12
 * ```
 */
function compose(...funcs: Function[]): Function {
  if (funcs.length === 0) {
    // If no functions, return identity function
    return <T>(arg: T) => arg;
  }

  if (funcs.length === 1) {
    return funcs[0];
  }

  // Right-to-left composition
  return funcs.reduce((a, b) => (...args: any[]) => a(b(...args)));
}
