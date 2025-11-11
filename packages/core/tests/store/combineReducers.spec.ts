import { describe, it, expect, beforeEach, vi } from 'vitest';
import { combineReducers, assertReducerShape } from '../../src/store/combineReducers';
import type { Reducer, Action } from '../../src/store/types';

describe('combineReducers', () => {
  interface CounterState {
    count: number;
  }

  interface TodosState {
    items: string[];
  }

  interface RootState {
    counter: CounterState;
    todos: TodosState;
  }

  let counterReducer: Reducer<CounterState, Action>;
  let todosReducer: Reducer<TodosState, Action>;

  beforeEach(() => {
    counterReducer = (state = { count: 0 }, action) => {
      switch (action.type) {
        case 'INCREMENT':
          return { count: state.count + 1 };
        case 'DECREMENT':
          return { count: state.count - 1 };
        default:
          return state;
      }
    };

    todosReducer = (state = { items: [] }, action) => {
      switch (action.type) {
        case 'ADD_TODO':
          return { items: [...state.items, action.payload as string] };
        case 'CLEAR_TODOS':
          return { items: [] };
        default:
          return state;
      }
    };
  });

  describe('basic functionality', () => {
    it('should combine multiple reducers', () => {
      const rootReducer = combineReducers<RootState>({
        counter: counterReducer,
        todos: todosReducer,
      });

      const state = rootReducer(undefined, { type: '@@INIT' });

      expect(state).toEqual({
        counter: { count: 0 },
        todos: { items: [] },
      });
    });

    it('should handle actions for individual reducers', () => {
      const rootReducer = combineReducers<RootState>({
        counter: counterReducer,
        todos: todosReducer,
      });

      let state = rootReducer(undefined, { type: '@@INIT' });

      state = rootReducer(state, { type: 'INCREMENT' });
      expect(state.counter.count).toBe(1);
      expect(state.todos.items).toEqual([]);

      state = rootReducer(state, { type: 'ADD_TODO', payload: 'Buy milk' });
      expect(state.counter.count).toBe(1);
      expect(state.todos.items).toEqual(['Buy milk']);
    });

    it('should preserve state slices that did not change', () => {
      const rootReducer = combineReducers<RootState>({
        counter: counterReducer,
        todos: todosReducer,
      });

      const state1 = rootReducer(undefined, { type: '@@INIT' });
      const state2 = rootReducer(state1, { type: 'INCREMENT' });

      // Counter changed, so counter slice should be a new object
      expect(state2.counter).not.toBe(state1.counter);
      // Todos did not change, so todos slice should be the same object
      expect(state2.todos).toBe(state1.todos);
    });

    it('should return the same state object if nothing changed', () => {
      const rootReducer = combineReducers<RootState>({
        counter: counterReducer,
        todos: todosReducer,
      });

      const state1 = rootReducer(undefined, { type: '@@INIT' });
      const state2 = rootReducer(state1, { type: 'UNKNOWN_ACTION' });

      // No reducer changed state, so root state should be the same object
      expect(state2).toBe(state1);
    });
  });

  describe('edge cases', () => {
    it('should filter out non-function values', () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const rootReducer = combineReducers({
        counter: counterReducer,
        // @ts-expect-error - testing invalid input
        invalid: 'not a function',
        todos: todosReducer,
      });

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Expected reducer for key "invalid" to be a function')
      );

      const state = rootReducer(undefined, { type: '@@INIT' });
      expect(state).toHaveProperty('counter');
      expect(state).toHaveProperty('todos');
      expect(state).not.toHaveProperty('invalid');

      consoleWarnSpy.mockRestore();
    });

    it('should throw error if reducer returns undefined', () => {
      const badReducer: Reducer<any> = () => undefined;

      const rootReducer = combineReducers({
        bad: badReducer,
      });

      expect(() => {
        rootReducer(undefined, { type: '@@INIT' });
      }).toThrow('reducer "bad" returned undefined');
    });

    it('should handle empty reducers object', () => {
      const rootReducer = combineReducers({});
      const state = rootReducer(undefined, { type: '@@INIT' });

      expect(state).toEqual({});
    });

    it('should handle single reducer', () => {
      const rootReducer = combineReducers({
        counter: counterReducer,
      });

      let state = rootReducer(undefined, { type: '@@INIT' });
      expect(state).toEqual({ counter: { count: 0 } });

      state = rootReducer(state, { type: 'INCREMENT' });
      expect(state).toEqual({ counter: { count: 1 } });
    });
  });

  describe('nested state', () => {
    it('should work with deeply nested reducers', () => {
      interface NestedState {
        ui: {
          theme: string;
        };
        data: {
          users: string[];
        };
      }

      const uiReducer: Reducer<{ theme: string }> = (
        state = { theme: 'light' },
        action
      ) => {
        if (action.type === 'SET_THEME') {
          return { theme: action.payload as string };
        }
        return state;
      };

      const dataReducer: Reducer<{ users: string[] }> = (
        state = { users: [] },
        action
      ) => {
        if (action.type === 'ADD_USER') {
          return { users: [...state.users, action.payload as string] };
        }
        return state;
      };

      const rootReducer = combineReducers<NestedState>({
        ui: uiReducer,
        data: dataReducer,
      });

      let state = rootReducer(undefined, { type: '@@INIT' });
      expect(state).toEqual({
        ui: { theme: 'light' },
        data: { users: [] },
      });

      state = rootReducer(state, { type: 'SET_THEME', payload: 'dark' });
      expect(state.ui.theme).toBe('dark');

      state = rootReducer(state, { type: 'ADD_USER', payload: 'Alice' });
      expect(state.data.users).toEqual(['Alice']);
    });
  });

  describe('assertReducerShape', () => {
    it('should not throw for valid reducers', () => {
      expect(() => {
        assertReducerShape({
          counter: counterReducer,
          todos: todosReducer,
        });
      }).not.toThrow();
    });

    it('should throw if reducer returns undefined during initialization', () => {
      const badReducer: Reducer<any> = () => undefined;

      expect(() => {
        assertReducerShape({
          bad: badReducer,
        });
      }).toThrow('Reducer "bad" returned undefined during initialization');
    });

    it('should throw if reducer returns undefined for unknown action', () => {
      const badReducer: Reducer<any> = (state, action) => {
        if (action.type === '@@INIT') {
          return { value: 0 };
        }
        return undefined; // Bad: should return state
      };

      expect(() => {
        assertReducerShape({
          bad: badReducer,
        });
      }).toThrow('Reducer "bad" returned undefined when probed with a random type');
    });

    it('should accept reducers that return null', () => {
      const nullReducer: Reducer<any> = () => null;

      expect(() => {
        assertReducerShape({
          nullReducer,
        });
      }).not.toThrow();
    });
  });

  describe('performance', () => {
    it('should only call reducers once per dispatch', () => {
      const counterSpy = vi.fn(counterReducer);
      const todosSpy = vi.fn(todosReducer);

      const rootReducer = combineReducers({
        counter: counterSpy,
        todos: todosSpy,
      });

      rootReducer(undefined, { type: 'INCREMENT' });

      expect(counterSpy).toHaveBeenCalledTimes(1);
      expect(todosSpy).toHaveBeenCalledTimes(1);
    });

    it('should handle large number of reducers efficiently', () => {
      const reducers: Record<string, Reducer<any>> = {};

      for (let i = 0; i < 100; i++) {
        reducers[`slice${i}`] = (state = { value: i }) => state;
      }

      const rootReducer = combineReducers(reducers);
      const state = rootReducer(undefined, { type: '@@INIT' });

      expect(Object.keys(state)).toHaveLength(100);
      expect(state.slice0).toEqual({ value: 0 });
      expect(state.slice99).toEqual({ value: 99 });
    });
  });
});
