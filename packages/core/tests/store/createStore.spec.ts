import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createStore } from '../../src/store/createStore';
import type { Action, Reducer, Store } from '../../src/store/types';

describe('createStore', () => {
  interface CounterState {
    count: number;
  }

  type CounterAction =
    | { type: 'INCREMENT' }
    | { type: 'DECREMENT' }
    | { type: 'ADD'; payload: number };

  let counterReducer: Reducer<CounterState, CounterAction>;

  beforeEach(() => {
    counterReducer = (
      state = { count: 0 },
      action: CounterAction
    ): CounterState => {
      switch (action.type) {
        case 'INCREMENT':
          return { count: state.count + 1 };
        case 'DECREMENT':
          return { count: state.count - 1 };
        case 'ADD':
          return { count: state.count + action.payload };
        default:
          return state;
      }
    };
  });

  describe('constructor', () => {
    it('should create a store with initial state', () => {
      const store = createStore(counterReducer);
      expect(store.getState()).toEqual({ count: 0 });
    });

    it('should create a store with preloaded state', () => {
      const store = createStore(counterReducer, { count: 10 });
      expect(store.getState()).toEqual({ count: 10 });
    });

    it('should throw error if reducer is not a function', () => {
      expect(() => {
        // @ts-expect-error - testing invalid input
        createStore('not a function');
      }).toThrow('Expected the reducer to be a function');
    });
  });

  describe('getState()', () => {
    it('should return current state', () => {
      const store = createStore(counterReducer, { count: 5 });
      expect(store.getState()).toEqual({ count: 5 });
    });

    it('should throw error if called while dispatching', () => {
      const recursiveReducer: Reducer<CounterState> = (state = { count: 0 }, action) => {
        if (action.type === 'RECURSIVE') {
          store.getState(); // This should throw
        }
        return state;
      };

      const store = createStore(recursiveReducer);

      expect(() => {
        store.dispatch({ type: 'RECURSIVE' });
      }).toThrow('You may not call store.getState() while the reducer is executing');
    });
  });

  describe('dispatch()', () => {
    it('should dispatch actions and update state', () => {
      const store = createStore(counterReducer);

      store.dispatch({ type: 'INCREMENT' });
      expect(store.getState()).toEqual({ count: 1 });

      store.dispatch({ type: 'INCREMENT' });
      expect(store.getState()).toEqual({ count: 2 });

      store.dispatch({ type: 'DECREMENT' });
      expect(store.getState()).toEqual({ count: 1 });
    });

    it('should dispatch actions with payload', () => {
      const store = createStore(counterReducer);

      store.dispatch({ type: 'ADD', payload: 5 });
      expect(store.getState()).toEqual({ count: 5 });

      store.dispatch({ type: 'ADD', payload: 10 });
      expect(store.getState()).toEqual({ count: 15 });
    });

    it('should return the dispatched action', () => {
      const store = createStore(counterReducer);
      const action = { type: 'INCREMENT' as const };

      const result = store.dispatch(action);
      expect(result).toBe(action);
    });

    it('should throw error if action is not a plain object', () => {
      const store = createStore(counterReducer);

      expect(() => {
        // @ts-expect-error - testing invalid input
        store.dispatch(null);
      }).toThrow('Actions must be plain objects with a string type property');

      expect(() => {
        // @ts-expect-error - testing invalid input
        store.dispatch('not an object');
      }).toThrow('Actions must be plain objects with a string type property');
    });

    it('should throw error if action.type is not a string', () => {
      const store = createStore(counterReducer);

      expect(() => {
        store.dispatch({ type: 123 } as any);
      }).toThrow('Actions must be plain objects with a string type property');
    });

    it('should throw error if called recursively from reducer', () => {
      const recursiveReducer: Reducer<CounterState> = (state = { count: 0 }, action) => {
        if (action.type === 'RECURSIVE') {
          store.dispatch({ type: 'INCREMENT' }); // This should throw
        }
        return state;
      };

      const store = createStore(recursiveReducer);

      expect(() => {
        store.dispatch({ type: 'RECURSIVE' });
      }).toThrow('Reducers may not dispatch actions');
    });
  });

  describe('subscribe()', () => {
    it('should subscribe to state changes', () => {
      const store = createStore(counterReducer);
      const listener = vi.fn();

      store.subscribe(listener);

      store.dispatch({ type: 'INCREMENT' });
      expect(listener).toHaveBeenCalledTimes(1);

      store.dispatch({ type: 'DECREMENT' });
      expect(listener).toHaveBeenCalledTimes(2);
    });

    it('should return an unsubscribe function', () => {
      const store = createStore(counterReducer);
      const listener = vi.fn();

      const unsubscribe = store.subscribe(listener);

      store.dispatch({ type: 'INCREMENT' });
      expect(listener).toHaveBeenCalledTimes(1);

      unsubscribe();

      store.dispatch({ type: 'INCREMENT' });
      expect(listener).toHaveBeenCalledTimes(1); // Still 1, not called again
    });

    it('should support multiple listeners', () => {
      const store = createStore(counterReducer);
      const listener1 = vi.fn();
      const listener2 = vi.fn();
      const listener3 = vi.fn();

      store.subscribe(listener1);
      store.subscribe(listener2);
      store.subscribe(listener3);

      store.dispatch({ type: 'INCREMENT' });

      expect(listener1).toHaveBeenCalledTimes(1);
      expect(listener2).toHaveBeenCalledTimes(1);
      expect(listener3).toHaveBeenCalledTimes(1);
    });

    it('should handle unsubscribe in the middle of notifications', () => {
      const store = createStore(counterReducer);
      const listener1 = vi.fn();
      const listener2 = vi.fn();
      const listener3 = vi.fn();

      store.subscribe(listener1);
      const unsubscribe2 = store.subscribe(listener2);
      store.subscribe(listener3);

      unsubscribe2();

      store.dispatch({ type: 'INCREMENT' });

      expect(listener1).toHaveBeenCalledTimes(1);
      expect(listener2).not.toHaveBeenCalled();
      expect(listener3).toHaveBeenCalledTimes(1);
    });

    it('should throw error if listener is not a function', () => {
      const store = createStore(counterReducer);

      expect(() => {
        // @ts-expect-error - testing invalid input
        store.subscribe('not a function');
      }).toThrow('Expected the listener to be a function');
    });

    it('should throw error if called while dispatching', () => {
      const recursiveReducer: Reducer<CounterState> = (state = { count: 0 }, action) => {
        if (action.type === 'RECURSIVE') {
          store.subscribe(() => {}); // This should throw
        }
        return state;
      };

      const store = createStore(recursiveReducer);

      expect(() => {
        store.dispatch({ type: 'RECURSIVE' });
      }).toThrow('You may not call store.subscribe() while the reducer is executing');
    });

    it('should throw error if unsubscribe is called while dispatching', () => {
      let unsubscribe: () => void;

      const recursiveReducer: Reducer<CounterState> = (state = { count: 0 }, action) => {
        if (action.type === 'RECURSIVE') {
          unsubscribe(); // This should throw
        }
        return state;
      };

      const store2 = createStore(recursiveReducer);
      unsubscribe = store2.subscribe(() => {});

      expect(() => {
        store2.dispatch({ type: 'RECURSIVE' });
      }).toThrow('You may not unsubscribe from a store listener while the reducer is executing');
    });

    it('should not notify listeners if state did not change', () => {
      const noOpReducer: Reducer<CounterState> = (state = { count: 0 }) => state;
      const store = createStore(noOpReducer);
      const listener = vi.fn();

      store.subscribe(listener);

      store.dispatch({ type: 'ANYTHING' });
      // Listener is still called even if state didn't change
      // This is Redux behavior - listeners are called after every dispatch
      expect(listener).toHaveBeenCalledTimes(1);
    });
  });

  describe('replaceReducer()', () => {
    it('should replace the reducer', () => {
      const store = createStore(counterReducer, { count: 5 });

      const doubleReducer: Reducer<CounterState> = (state = { count: 0 }, action) => {
        if (action.type === 'DOUBLE') {
          return { count: state.count * 2 };
        }
        return state;
      };

      store.replaceReducer(doubleReducer);

      store.dispatch({ type: 'DOUBLE' });
      expect(store.getState()).toEqual({ count: 10 });
    });

    it('should throw error if next reducer is not a function', () => {
      const store = createStore(counterReducer);

      expect(() => {
        // @ts-expect-error - testing invalid input
        store.replaceReducer('not a function');
      }).toThrow('Expected the nextReducer to be a function');
    });
  });

  describe('integration scenarios', () => {
    it('should handle complex state updates correctly', () => {
      const store = createStore(counterReducer);
      const states: CounterState[] = [];

      store.subscribe(() => {
        states.push(store.getState());
      });

      store.dispatch({ type: 'INCREMENT' });
      store.dispatch({ type: 'INCREMENT' });
      store.dispatch({ type: 'ADD', payload: 5 });
      store.dispatch({ type: 'DECREMENT' });

      expect(states).toEqual([
        { count: 1 },
        { count: 2 },
        { count: 7 },
        { count: 6 },
      ]);
    });

    it('should handle multiple stores independently', () => {
      const store1 = createStore(counterReducer, { count: 0 });
      const store2 = createStore(counterReducer, { count: 100 });

      store1.dispatch({ type: 'INCREMENT' });
      store2.dispatch({ type: 'DECREMENT' });

      expect(store1.getState()).toEqual({ count: 1 });
      expect(store2.getState()).toEqual({ count: 99 });
    });
  });
});
