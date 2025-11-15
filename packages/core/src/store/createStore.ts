/**
 * createStore - Core Redux-like Store Implementation
 *
 * Creates a store that holds the complete state tree.
 * The only way to change data in the store is to dispatch actions on it.
 */

import type {
    Action,
    Reducer,
    Store,
    Listener,
    Unsubscribe,
    StoreEnhancer
} from './types';

/**
 * Internal action types
 */
const ActionTypes = {
    INIT: '@@redux/INIT' as const,
    REPLACE: '@@redux/REPLACE' as const
};

/**
 * Creates a Redux store that holds the state tree.
 *
 * @param reducer The reducer function that returns the next state tree
 * @param preloadedState The initial state (optional)
 * @param enhancer The store enhancer (optional)
 * @returns A Redux store that lets you read the state, dispatch actions and subscribe to changes
 *
 * @example
 * ```ts
 * const store = createStore(rootReducer, { count: 0 });
 *
 * store.subscribe(() => {
 *   console.log('State changed:', store.getState());
 * });
 *
 * store.dispatch({ type: 'INCREMENT' });
 * ```
 */
export function createStore<S, A extends Action>(
    reducer: Reducer<S, A>,
    preloadedState?: S,
    enhancer?: StoreEnhancer
): Store<S, A> {
    // Handle optional preloadedState parameter
    if (typeof preloadedState === 'function' && typeof enhancer === 'undefined') {
        enhancer = preloadedState as StoreEnhancer;
        preloadedState = undefined;
    }

    // Apply enhancer if provided
    if (typeof enhancer !== 'undefined') {
        if (typeof enhancer !== 'function') {
            throw new Error('Expected the enhancer to be a function.');
        }
        return enhancer(createStore as any)(reducer, preloadedState as S) as Store<S, A>;
    }

    if (typeof reducer !== 'function') {
        throw new Error('Expected the reducer to be a function.');
    }

    let currentReducer = reducer;
    let currentState = preloadedState as S;
    let currentListeners: Listener[] = [];
    let nextListeners = currentListeners;
    let isDispatching = false;

    /**
   * Ensures we can safely mutate nextListeners
   */
    function ensureCanMutateNextListeners() {
        if (nextListeners === currentListeners) {
            nextListeners = currentListeners.slice();
        }
    }

    /**
   * Reads the state tree managed by the store
   */
    function getState(): S {
        if (isDispatching) {
            throw new Error(
                'You may not call store.getState() while the reducer is executing. ' +
        'The reducer has already received the state as an argument. ' +
        'Pass it down from the top reducer instead of reading it from the store.'
            );
        }

        return currentState;
    }

    /**
   * Adds a change listener
   * @returns A function to remove this change listener
   */
    function subscribe(listener: Listener): Unsubscribe {
        if (typeof listener !== 'function') {
            throw new Error('Expected the listener to be a function.');
        }

        if (isDispatching) {
            throw new Error(
                'You may not call store.subscribe() while the reducer is executing. ' +
        'If you would like to be notified after the store has been updated, subscribe from a component and invoke store.getState() in the callback to access the latest state.'
            );
        }

        let isSubscribed = true;

        ensureCanMutateNextListeners();
        nextListeners.push(listener);

        return function unsubscribe() {
            if (!isSubscribed) {
                return;
            }

            if (isDispatching) {
                throw new Error(
                    'You may not unsubscribe from a store listener while the reducer is executing.'
                );
            }

            isSubscribed = false;

            ensureCanMutateNextListeners();
            const index = nextListeners.indexOf(listener);
            nextListeners.splice(index, 1);
            currentListeners = [];
        };
    }

    /**
   * Dispatches an action to trigger a state change
   */
    function dispatch(action: A): A {
        if (!action || typeof action.type !== 'string') {
            throw new Error(
                'Actions must be plain objects with a string type property.'
            );
        }

        if (isDispatching) {
            throw new Error('Reducers may not dispatch actions.');
        }

        try {
            isDispatching = true;
            currentState = currentReducer(currentState, action);
        } finally {
            isDispatching = false;
        }

        // Notify all listeners
        const listeners = (currentListeners = nextListeners);
        for (let i = 0; i < listeners.length; i++) {
            const listener = listeners[i];
            listener();
        }

        return action;
    }

    /**
   * Replaces the reducer currently used by the store
   * Useful for code splitting and hot reloading
   */
    function replaceReducer(nextReducer: Reducer<S, A>): void {
        if (typeof nextReducer !== 'function') {
            throw new Error('Expected the nextReducer to be a function.');
        }

        currentReducer = nextReducer;
        dispatch({ type: ActionTypes.REPLACE } as A);
    }

    // Initialize the store with a dummy dispatch
    dispatch({ type: ActionTypes.INIT } as A);

    const store: Store<S, A> = {
        getState,
        dispatch,
        subscribe,
        replaceReducer
    };

    return store;
}
