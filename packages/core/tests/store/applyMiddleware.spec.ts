/**
 * @vitest-environment node
 */
import { describe, it, expect } from 'vitest';
import { applyMiddleware } from '../../src/store/applyMiddleware';
import { createStore } from '../../src/store/createStore';
import type { Store, Reducer, Action, Middleware } from '../../src/store/types';

// Simple test reducer
interface TestState {
  count: number;
  actions: string[];
}

const initialState: TestState = {
  count: 0,
  actions: [],
};

const testReducer: Reducer<TestState> = (
  state = initialState,
  action: Action
): TestState => {
  switch (action.type) {
    case 'INCREMENT':
      return { ...state, count: state.count + 1 };
    case 'DECREMENT':
      return { ...state, count: state.count - 1 };
    case 'TRACK_ACTION':
      return { ...state, actions: [...state.actions, action.type] };
    default:
      return state;
  }
};

describe('applyMiddleware', () => {
  describe('Store Enhancer Pattern', () => {
    it('should return a store enhancer function', () => {
      const enhancer = applyMiddleware();
      expect(typeof enhancer).toBe('function');
    });

    it('should accept createStore as argument and return enhanced createStore', () => {
      const enhancer = applyMiddleware();
      const enhancedCreateStore = enhancer(createStore);
      expect(typeof enhancedCreateStore).toBe('function');
    });

    it('should create a valid store when no middleware is provided', () => {
      const enhancer = applyMiddleware();
      const store = enhancer(createStore)(testReducer, initialState);

      expect(store).toHaveProperty('dispatch');
      expect(store).toHaveProperty('subscribe');
      expect(store).toHaveProperty('getState');
      expect(store.getState()).toEqual(initialState);
    });
  });

  describe('Single Middleware', () => {
    it('should pass actions through a single middleware', () => {
      const actionsSeen: Action[] = [];

      // Spy middleware that tracks all actions
      const spyMiddleware: Middleware = () => (next) => (action) => {
        actionsSeen.push(action);
        return next(action);
      };

      const store = createStore(
        testReducer,
        initialState,
        applyMiddleware(spyMiddleware)
      );

      store.dispatch({ type: 'INCREMENT' });
      store.dispatch({ type: 'DECREMENT' });

      expect(actionsSeen).toHaveLength(2);
      expect(actionsSeen[0].type).toBe('INCREMENT');
      expect(actionsSeen[1].type).toBe('DECREMENT');
    });

    it('middleware should receive correct store API (getState, dispatch)', () => {
      let capturedAPI: any = null;

      const apiCaptureMiddleware: Middleware = (storeAPI) => {
        capturedAPI = storeAPI;
        return (next) => (action) => next(action);
      };

      const store = createStore(
        testReducer,
        initialState,
        applyMiddleware(apiCaptureMiddleware)
      );

      expect(capturedAPI).not.toBeNull();
      expect(typeof capturedAPI.getState).toBe('function');
      expect(typeof capturedAPI.dispatch).toBe('function');

      // Verify getState returns current state
      expect(capturedAPI.getState()).toEqual(initialState);
    });

    it('middleware can modify actions before they reach the reducer', () => {
      // Middleware that transforms INCREMENT to DOUBLE_INCREMENT
      const transformMiddleware: Middleware = () => (next) => (action) => {
        if (action.type === 'INCREMENT') {
          // Dispatch twice instead of once
          next(action);
          return next(action);
        }
        return next(action);
      };

      const store = createStore(
        testReducer,
        initialState,
        applyMiddleware(transformMiddleware)
      );

      store.dispatch({ type: 'INCREMENT' });

      // Should increment twice due to middleware
      expect(store.getState().count).toBe(2);
    });
  });

  describe('Multiple Middlewares', () => {
    it('should pass actions through multiple middlewares in correct order', () => {
      const executionOrder: string[] = [];

      const middleware1: Middleware = () => (next) => (action) => {
        executionOrder.push('MW1-before');
        const result = next(action);
        executionOrder.push('MW1-after');
        return result;
      };

      const middleware2: Middleware = () => (next) => (action) => {
        executionOrder.push('MW2-before');
        const result = next(action);
        executionOrder.push('MW2-after');
        return result;
      };

      const middleware3: Middleware = () => (next) => (action) => {
        executionOrder.push('MW3-before');
        const result = next(action);
        executionOrder.push('MW3-after');
        return result;
      };

      const store = createStore(
        testReducer,
        initialState,
        applyMiddleware(middleware1, middleware2, middleware3)
      );

      store.dispatch({ type: 'INCREMENT' });

      // Expected order: MW1 -> MW2 -> MW3 -> reducer -> MW3 <- MW2 <- MW1
      expect(executionOrder).toEqual([
        'MW1-before',
        'MW2-before',
        'MW3-before',
        'MW3-after',
        'MW2-after',
        'MW1-after',
      ]);
    });

    it('middleware chain should allow early termination', () => {
      let reducerCalled = false;

      const blockingMiddleware: Middleware = () => (next) => (action) => {
        if (action.type === 'BLOCKED') {
          // Don't call next(), action doesn't reach reducer
          return { type: 'BLOCKED', blocked: true };
        }
        return next(action);
      };

      const trackingReducer: Reducer<TestState> = (
        state = initialState,
        action
      ) => {
        reducerCalled = true;
        return testReducer(state, action);
      };

      const store = createStore(
        trackingReducer,
        initialState,
        applyMiddleware(blockingMiddleware)
      );

      reducerCalled = false;
      store.dispatch({ type: 'BLOCKED' });
      expect(reducerCalled).toBe(false);

      reducerCalled = false;
      store.dispatch({ type: 'INCREMENT' });
      expect(reducerCalled).toBe(true);
    });
  });

  describe('Middleware getState Access', () => {
    it('middleware should see updated state after action', () => {
      const stateSnapshots: TestState[] = [];

      const snapshotMiddleware: Middleware = (storeAPI) => (next) => (action) => {
        // State before action
        const stateBefore = storeAPI.getState() as TestState;

        const result = next(action);

        // State after action
        const stateAfter = storeAPI.getState() as TestState;
        stateSnapshots.push(stateBefore, stateAfter);

        return result;
      };

      const store = createStore(
        testReducer,
        initialState,
        applyMiddleware(snapshotMiddleware)
      );

      store.dispatch({ type: 'INCREMENT' });

      expect(stateSnapshots).toHaveLength(2);
      expect(stateSnapshots[0].count).toBe(0); // Before
      expect(stateSnapshots[1].count).toBe(1); // After
    });
  });

  describe('Middleware dispatch Access', () => {
    it('middleware can dispatch actions recursively', () => {
      const dispatchingMiddleware: Middleware = (storeAPI) => (next) => (action) => {
        const result = next(action);

        // After INCREMENT, automatically dispatch TRACK_ACTION
        if (action.type === 'INCREMENT') {
          storeAPI.dispatch({ type: 'TRACK_ACTION' });
        }

        return result;
      };

      const store = createStore(
        testReducer,
        initialState,
        applyMiddleware(dispatchingMiddleware)
      );

      store.dispatch({ type: 'INCREMENT' });

      const state = store.getState();
      expect(state.count).toBe(1);
      expect(state.actions).toContain('TRACK_ACTION');
    });
  });

  describe('Error Handling', () => {
    it('should throw error if dispatching while constructing middleware', () => {
      const eagerDispatchMiddleware: Middleware = (storeAPI) => {
        // This should throw - dispatching during middleware setup
        expect(() => {
          storeAPI.dispatch({ type: 'EAGER' });
        }).toThrow('Dispatching while constructing your middleware is not allowed');

        return (next) => (action) => next(action);
      };

      createStore(testReducer, initialState, applyMiddleware(eagerDispatchMiddleware));
    });

    it('should handle middleware throwing errors gracefully', () => {
      const errorMiddleware: Middleware = () => (next) => (action) => {
        if (action.type === 'ERROR') {
          throw new Error('Middleware error');
        }
        return next(action);
      };

      const store = createStore(
        testReducer,
        initialState,
        applyMiddleware(errorMiddleware)
      );

      expect(() => {
        store.dispatch({ type: 'ERROR' });
      }).toThrow('Middleware error');

      // Store should still work after error
      store.dispatch({ type: 'INCREMENT' });
      expect(store.getState().count).toBe(1);
    });
  });
});
