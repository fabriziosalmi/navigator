/**
 * @file store-types.spec.ts
 * @description Type validation tests for Redux-style store types
 * 
 * These tests use TypeScript's type system to verify:
 * - Type inference works correctly
 * - Type constraints are enforced
 * - Generic parameters flow properly
 * 
 * Note: These are compile-time tests. If this file compiles, tests pass.
 */

import { describe, it, expectTypeOf } from 'vitest';
import type {
  Action,
  BaseAction,
  PayloadAction,
  ErrorAction,
  MetaAction,
  ActionCreator,
  Reducer,
  Store,
  Dispatch,
  Middleware,
  MiddlewareAPI,
  ThunkAction,
} from '../src/store';

describe('Store Type System', () => {
  describe('Action Types', () => {
    it('should enforce BaseAction structure', () => {
      type TestAction = BaseAction<'test/ACTION'>;
      
      const action: TestAction = { type: 'test/ACTION' };
      
      expectTypeOf(action).toHaveProperty('type');
      expectTypeOf(action.type).toEqualTypeOf<'test/ACTION'>();
    });

    it('should enforce PayloadAction structure', () => {
      type TestPayload = { value: number };
      type TestAction = PayloadAction<'test/ACTION', TestPayload>;
      
      const action: TestAction = {
        type: 'test/ACTION',
        payload: { value: 42 },
      };
      
      expectTypeOf(action).toHaveProperty('type');
      expectTypeOf(action).toHaveProperty('payload');
      expectTypeOf(action.payload).toEqualTypeOf<TestPayload>();
    });

    it('should enforce ErrorAction structure', () => {
      type TestAction = ErrorAction<'test/ERROR', Error>;
      
      const action: TestAction = {
        type: 'test/ERROR',
        error: true,
        payload: new Error('Test error'),
      };
      
      expectTypeOf(action).toHaveProperty('error');
      expectTypeOf(action.error).toEqualTypeOf<true>();
      expectTypeOf(action.payload).toMatchTypeOf<Error>();
    });

    it('should enforce MetaAction structure', () => {
      type TestMeta = { timestamp: number };
      type TestAction = MetaAction<'test/ACTION', { value: string }, TestMeta>;
      
      const action: TestAction = {
        type: 'test/ACTION',
        payload: { value: 'test' },
        meta: { timestamp: Date.now() },
      };
      
      expectTypeOf(action).toHaveProperty('meta');
      expectTypeOf(action.meta).toEqualTypeOf<TestMeta>();
    });

    it('should infer action creator return type', () => {
      const createAction: ActionCreator<PayloadAction<'test/CREATE', number>> = (value: number) => ({
        type: 'test/CREATE',
        payload: value,
      });
      
      const result = createAction(123);
      
      expectTypeOf(result).toHaveProperty('type');
      expectTypeOf(result.type).toEqualTypeOf<'test/CREATE'>();
      expectTypeOf(result.payload).toEqualTypeOf<number>();
    });
  });

  describe('Reducer Types', () => {
    it('should enforce reducer signature', () => {
      type State = { count: number };
      type Actions = PayloadAction<'INCREMENT', number> | BaseAction<'RESET'>;
      
      const reducer: Reducer<State, Actions> = (state = { count: 0 }, action) => {
        switch (action.type) {
          case 'INCREMENT':
            return { count: state.count + action.payload };
          case 'RESET':
            return { count: 0 };
          default:
            return state;
        }
      };
      
      expectTypeOf(reducer).toBeFunction();
      expectTypeOf(reducer).parameter(0).toMatchTypeOf<State | undefined>();
      expectTypeOf(reducer).parameter(1).toMatchTypeOf<Actions>();
      expectTypeOf(reducer).returns.toEqualTypeOf<State>();
    });

    it('should handle undefined initial state', () => {
      type State = { value: string };
      
      const reducer: Reducer<State> = (state, _action) => {
        if (!state) {
          return { value: 'initial' };
        }
        return state;
      };
      
      const result = reducer(undefined, { type: 'INIT' });
      
      expectTypeOf(result).toEqualTypeOf<State>();
    });

    it('should preserve immutability in type system', () => {
      type State = { readonly count: number };
      
      const reducer: Reducer<State> = (state = { count: 0 }, _action) => {
        // This should be a type error if uncommented:
        // state.count = 1; // Cannot assign to 'count' because it is a read-only property
        
        return { count: state.count + 1 };
      };
      
      expectTypeOf(reducer).toBeFunction();
    });
  });

  describe('Store Types', () => {
    it('should enforce store interface', () => {
      type State = { value: number };
      type Actions = PayloadAction<'UPDATE', number>;
      
      const mockStore: Store<State, Actions> = {
        getState: () => ({ value: 0 }),
        dispatch: (action) => action,
        subscribe: () => () => {},
        replaceReducer: () => {},
      };
      
      expectTypeOf(mockStore.getState).toBeFunction();
      expectTypeOf(mockStore.getState).returns.toEqualTypeOf<State>();
      
      expectTypeOf(mockStore.dispatch).toBeFunction();
      expectTypeOf(mockStore.dispatch).parameter(0).toMatchTypeOf<Actions>();
      
      expectTypeOf(mockStore.subscribe).toBeFunction();
      expectTypeOf(mockStore.subscribe).returns.toBeFunction();
    });

    it('should type dispatch correctly', () => {
      type Actions = PayloadAction<'TEST', string>;
      
      const dispatch: Dispatch<Actions> = (action) => action;
      
      const result = dispatch({ type: 'TEST', payload: 'hello' });
      
      expectTypeOf(result).toHaveProperty('type');
      expectTypeOf(result.type).toEqualTypeOf<'TEST'>();
    });

    it('should enforce unsubscribe function', () => {
      type State = { count: number };
      
      const store: Store<State> = {
        getState: () => ({ count: 0 }),
        dispatch: (action) => action,
        subscribe: (_listener) => {
          // listener is called on state change
          const unsubscribe = () => {
            // cleanup
          };
          return unsubscribe;
        },
        replaceReducer: () => {},
      };
      
      const unsubscribe = store.subscribe(() => {});
      
      expectTypeOf(unsubscribe).toBeFunction();
      expectTypeOf(unsubscribe).returns.toEqualTypeOf<void>();
    });
  });

  describe('Middleware Types', () => {
    it('should enforce middleware signature', () => {
      type State = { count: number };
      type Actions = PayloadAction<'INCREMENT'>;
      
      const logger: Middleware<State, Actions> = (api) => (next) => (action) => {
        console.log('Before:', api.getState());
        const result = next(action);
        console.log('After:', api.getState());
        return result;
      };
      
      expectTypeOf(logger).toBeFunction();
      expectTypeOf(logger).parameter(0).toMatchTypeOf<MiddlewareAPI<State, Actions>>();
    });

    it('should provide correct MiddlewareAPI types', () => {
      type State = { value: string };
      type Actions = BaseAction<'TEST'>;
      
      const middleware: Middleware<State, Actions> = (api) => {
        expectTypeOf(api.getState).toBeFunction();
        expectTypeOf(api.getState).returns.toEqualTypeOf<State>();
        
        expectTypeOf(api.dispatch).toBeFunction();
        expectTypeOf(api.dispatch).parameter(0).toMatchTypeOf<Actions>();
        
        return (next) => (action) => next(action);
      };
      
      expectTypeOf(middleware).toBeFunction();
    });

    it('should support thunk actions', () => {
      type State = { count: number };
      type Actions = PayloadAction<'INCREMENT', number>;
      
      const thunk: ThunkAction<void, State, undefined, Actions> = (dispatch, getState) => {
        const currentCount = getState().count;
        dispatch({ type: 'INCREMENT', payload: currentCount + 1 });
      };
      
      expectTypeOf(thunk).toBeFunction();
      expectTypeOf(thunk).parameter(0).toMatchTypeOf<Dispatch<Actions>>();
      expectTypeOf(thunk).parameter(1).toBeFunction();
      expectTypeOf(thunk).returns.toEqualTypeOf<void>();
    });

    it('should support async thunks', () => {
      type State = { data: string | null };
      type Actions = PayloadAction<'SET_DATA', string>;
      
      const fetchData: ThunkAction<Promise<void>, State, undefined, Actions> = async (dispatch) => {
        const data = await Promise.resolve('fetched');
        dispatch({ type: 'SET_DATA', payload: data });
      };
      
      expectTypeOf(fetchData).toBeFunction();
      expectTypeOf(fetchData).returns.toMatchTypeOf<Promise<void>>();
    });
  });

  describe('Type Inference', () => {
    it('should infer combined state from reducers', () => {
      const counterReducer: Reducer<number> = (state = 0) => state;
      const textReducer: Reducer<string> = (state = '') => state;
      
      type RootState = {
        counter: ReturnType<typeof counterReducer extends Reducer<infer S> ? () => S : never>;
        text: ReturnType<typeof textReducer extends Reducer<infer S> ? () => S : never>;
      };
      
      expectTypeOf<RootState>().toEqualTypeOf<{ counter: number; text: string }>();
    });

    it('should support action union types', () => {
      type Action1 = PayloadAction<'ACTION_1', number>;
      type Action2 = PayloadAction<'ACTION_2', string>;
      type Action3 = BaseAction<'ACTION_3'>;
      
      type AllActions = Action1 | Action2 | Action3;
      
      const reducer: Reducer<any, AllActions> = (state, action) => {
        switch (action.type) {
          case 'ACTION_1':
            expectTypeOf(action.payload).toEqualTypeOf<number>();
            return state;
          case 'ACTION_2':
            expectTypeOf(action.payload).toEqualTypeOf<string>();
            return state;
          case 'ACTION_3':
            expectTypeOf(action).not.toHaveProperty('payload');
            return state;
          default:
            return state;
        }
      };
      
      expectTypeOf(reducer).toBeFunction();
    });
  });

  describe('Type Guards', () => {
    it('should narrow action types with type guards', () => {
      const action: Action = { type: 'TEST', payload: 123 };
      
      if ('payload' in action && !('error' in action)) {
        // Type narrowed to PayloadAction
        expectTypeOf(action).toHaveProperty('payload');
      }
    });

    it('should identify error actions', () => {
      const action: Action = { type: 'ERROR', error: true, payload: new Error() };
      
      if ('error' in action && action.error === true) {
        // Type narrowed to ErrorAction
        expectTypeOf(action).toHaveProperty('error');
        expectTypeOf(action.error).toEqualTypeOf<true>();
      }
    });
  });
});
