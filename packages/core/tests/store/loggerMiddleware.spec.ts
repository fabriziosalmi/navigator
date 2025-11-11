/**
 * @vitest-environment node
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createStore } from '../../src/store/createStore';
import { applyMiddleware } from '../../src/store/applyMiddleware';
import {
  loggerMiddleware,
  createLoggerMiddleware,
} from '../../src/store/middleware/loggerMiddleware';
import type { Reducer, Action } from '../../src/store/types';

// Test state and reducer
interface TestState {
  count: number;
  name: string;
}

const initialState: TestState = {
  count: 0,
  name: 'test',
};

const testReducer: Reducer<TestState> = (
  state = initialState,
  action: Action
): TestState => {
  switch (action.type) {
    case 'INCREMENT':
      return { ...state, count: state.count + 1 };
    case 'SET_NAME':
      return { ...state, name: (action as any).payload };
    default:
      return state;
  }
};

describe('loggerMiddleware', () => {
  let consoleGroupSpy: any;
  let consoleGroupCollapsedSpy: any;
  let consoleLogSpy: any;
  let consoleGroupEndSpy: any;

  beforeEach(() => {
    // Spy on console methods
    consoleGroupSpy = vi.spyOn(console, 'group').mockImplementation(() => {});
    consoleGroupCollapsedSpy = vi
      .spyOn(console, 'groupCollapsed')
      .mockImplementation(() => {});
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    consoleGroupEndSpy = vi
      .spyOn(console, 'groupEnd')
      .mockImplementation(() => {});
  });

  afterEach(() => {
    // Restore console methods
    consoleGroupSpy.mockRestore();
    consoleGroupCollapsedSpy.mockRestore();
    consoleLogSpy.mockRestore();
    consoleGroupEndSpy.mockRestore();
  });

  describe('Basic Logging', () => {
    it('should log actions with correct structure', () => {
      const middleware = createLoggerMiddleware();
      const store = createStore(testReducer, initialState, applyMiddleware(middleware));

      store.dispatch({ type: 'INCREMENT' });

      // Should create a console group
      expect(consoleGroupSpy).toHaveBeenCalledWith('Action: INCREMENT');

      // Should log 3 times: Previous State, Action, Next State
      expect(consoleLogSpy).toHaveBeenCalledTimes(3);

      // Check log calls in order
      const calls = consoleLogSpy.mock.calls;

      // Previous State log
      expect(calls[0][0]).toContain('Previous State');
      expect(calls[0][2]).toEqual({ count: 0, name: 'test' });

      // Action log
      expect(calls[1][0]).toContain('Action');
      expect(calls[1][2]).toEqual({ type: 'INCREMENT' });

      // Next State log
      expect(calls[2][0]).toContain('Next State');
      expect(calls[2][2]).toEqual({ count: 1, name: 'test' });

      // Should close the group
      expect(consoleGroupEndSpy).toHaveBeenCalled();
    });

    it('should use colored console output', () => {
      const middleware = createLoggerMiddleware();
      const store = createStore(testReducer, initialState, applyMiddleware(middleware));

      store.dispatch({ type: 'INCREMENT' });

      const calls = consoleLogSpy.mock.calls;

      // Check that color styles are applied
      expect(calls[0][1]).toContain('color'); // Previous State color
      expect(calls[1][1]).toContain('color'); // Action color
      expect(calls[2][1]).toContain('color'); // Next State color
    });
  });

  describe('Collapsed Groups', () => {
    it('should use groupCollapsed when collapsed option is true', () => {
      const middleware = createLoggerMiddleware({ collapsed: true });
      const store = createStore(testReducer, initialState, applyMiddleware(middleware));

      store.dispatch({ type: 'INCREMENT' });

      expect(consoleGroupCollapsedSpy).toHaveBeenCalledWith('Action: INCREMENT');
      expect(consoleGroupSpy).not.toHaveBeenCalled();
    });

    it('should use regular group when collapsed is false', () => {
      const middleware = createLoggerMiddleware({ collapsed: false });
      const store = createStore(testReducer, initialState, applyMiddleware(middleware));

      store.dispatch({ type: 'INCREMENT' });

      expect(consoleGroupSpy).toHaveBeenCalledWith('Action: INCREMENT');
      expect(consoleGroupCollapsedSpy).not.toHaveBeenCalled();
    });
  });

  describe('Predicate Filtering', () => {
    it('should only log actions that pass the predicate', () => {
      // Only log INCREMENT actions
      const middleware = createLoggerMiddleware({
        predicate: (_state, action) => action.type === 'INCREMENT',
      });
      const store = createStore(testReducer, initialState, applyMiddleware(middleware));

      store.dispatch({ type: 'INCREMENT' });
      store.dispatch({ type: 'SET_NAME', payload: 'new-name' });
      store.dispatch({ type: 'INCREMENT' });

      // Should only log twice (two INCREMENT actions)
      expect(consoleGroupSpy).toHaveBeenCalledTimes(2);
      expect(consoleGroupSpy).toHaveBeenCalledWith('Action: INCREMENT');
    });

    it('should have access to current state in predicate', () => {
      let capturedState: any = null;

      const middleware = createLoggerMiddleware({
        predicate: (state) => {
          capturedState = state;
          return true;
        },
      });
      const store = createStore(testReducer, initialState, applyMiddleware(middleware));

      store.dispatch({ type: 'INCREMENT' });

      expect(capturedState).toEqual({ count: 0, name: 'test' });
    });
  });

  describe('Custom Logger', () => {
    it('should use custom logger when provided', () => {
      const customLogger = {
        group: vi.fn(),
        groupCollapsed: vi.fn(),
        log: vi.fn(),
        groupEnd: vi.fn(),
      } as any;

      const middleware = createLoggerMiddleware({
        logger: customLogger,
      });
      const store = createStore(testReducer, initialState, applyMiddleware(middleware));

      store.dispatch({ type: 'INCREMENT' });

      // Should use custom logger instead of console
      expect(customLogger.group).toHaveBeenCalled();
      expect(customLogger.log).toHaveBeenCalled();
      expect(customLogger.groupEnd).toHaveBeenCalled();

      // Should NOT use console
      expect(consoleGroupSpy).not.toHaveBeenCalled();
    });
  });

  describe('State Diff', () => {
    it('should log state diff when diff option is true', () => {
      const middleware = createLoggerMiddleware({ diff: true });
      const store = createStore(testReducer, initialState, applyMiddleware(middleware));

      store.dispatch({ type: 'INCREMENT' });

      // Should log 4 times: Previous State, Action, Next State, Diff
      expect(consoleLogSpy).toHaveBeenCalledTimes(4);

      // Check diff log
      const calls = consoleLogSpy.mock.calls;
      expect(calls[3][0]).toContain('Diff');

      // Diff should show count changed
      const diff = calls[3][2];
      expect(diff.count).toBeDefined();
      expect(diff.count.type).toBe('updated');
    });

    it('should not log diff when diff option is false', () => {
      const middleware = createLoggerMiddleware({ diff: false });
      const store = createStore(testReducer, initialState, applyMiddleware(middleware));

      store.dispatch({ type: 'INCREMENT' });

      // Should log 3 times only (no diff)
      expect(consoleLogSpy).toHaveBeenCalledTimes(3);
    });
  });

  describe('Multiple Actions', () => {
    it('should log each action in separate groups', () => {
      const middleware = createLoggerMiddleware();
      const store = createStore(testReducer, initialState, applyMiddleware(middleware));

      store.dispatch({ type: 'INCREMENT' });
      store.dispatch({ type: 'INCREMENT' });
      store.dispatch({ type: 'SET_NAME', payload: 'test2' });

      // 3 actions = 3 groups
      expect(consoleGroupSpy).toHaveBeenCalledTimes(3);
      expect(consoleGroupEndSpy).toHaveBeenCalledTimes(3);
    });
  });

  describe('Integration with Store', () => {
    it('should not interfere with action flow', () => {
      const middleware = createLoggerMiddleware();
      const store = createStore(testReducer, initialState, applyMiddleware(middleware));

      store.dispatch({ type: 'INCREMENT' });
      expect(store.getState().count).toBe(1);

      store.dispatch({ type: 'INCREMENT' });
      expect(store.getState().count).toBe(2);

      store.dispatch({ type: 'SET_NAME', payload: 'modified' });
      expect(store.getState().name).toBe('modified');
    });

    it('should work with multiple middleware', () => {
      const trackingMiddleware = () => (next: any) => (action: any) => {
        // Just pass through
        return next(action);
      };

      const middleware = createLoggerMiddleware();
      const store = createStore(
        testReducer,
        initialState,
        applyMiddleware(trackingMiddleware, middleware)
      );

      store.dispatch({ type: 'INCREMENT' });

      // Logger should still work
      expect(consoleGroupSpy).toHaveBeenCalled();
      expect(store.getState().count).toBe(1);
    });
  });

  describe('Default loggerMiddleware', () => {
    it('should export a default instance', () => {
      expect(loggerMiddleware).toBeDefined();
      expect(typeof loggerMiddleware).toBe('function');
    });

    it('should respect NODE_ENV for production filtering', () => {
      // Save original NODE_ENV
      const originalEnv = process.env.NODE_ENV;

      // Test production mode
      process.env.NODE_ENV = 'production';

      // Create new middleware instance (predicate is evaluated at creation)
      const prodMiddleware = createLoggerMiddleware({
        predicate: () => {
          return process.env.NODE_ENV !== 'production';
        },
      });

      const store = createStore(
        testReducer,
        initialState,
        applyMiddleware(prodMiddleware)
      );

      store.dispatch({ type: 'INCREMENT' });

      // Should NOT log in production
      expect(consoleGroupSpy).not.toHaveBeenCalled();

      // Restore NODE_ENV
      process.env.NODE_ENV = originalEnv;
    });
  });
});
