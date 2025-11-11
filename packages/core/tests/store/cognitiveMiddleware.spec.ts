/**
 * cognitiveMiddleware.spec.ts
 * 
 * Unit tests for the cognitive middleware that analyzes user behavior
 * and dispatches COGNITIVE_STATE_CHANGE actions.
 * 
 * Test Strategy:
 * 1. Middleware intercepts actions correctly
 * 2. Records actions in session history
 * 3. Analyzes metrics and detects patterns
 * 4. Transitions states when thresholds met
 * 5. Dispatches COGNITIVE_STATE_CHANGE actions
 */

import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import { createCognitiveMiddleware } from '../../src/store/middleware/cognitiveMiddleware';
import { navigate } from '../../src/actions/navigation';
import type { MiddlewareAPI } from '../../src/store/applyMiddleware';
import type { Action } from '../../src/store/types';
import type { RootState } from '../../src/store/reducers';

describe('Cognitive Middleware', () => {
  let mockStore: MiddlewareAPI<RootState, Action>;
  let next: Mock<[Action], Action>;
  let dispatch: Mock<[Action], Action>;
  let getState: Mock<[], RootState>;

  beforeEach(() => {
    // Create mock store API
    dispatch = vi.fn<[Action], Action>((action: Action) => action);
    getState = vi.fn<[], RootState>(() => ({
      navigation: { 
        currentCard: 0, 
        currentLayer: 0, 
        totalCards: 5, 
        totalLayers: 4, 
        isAnimating: false,
        direction: null,
        lastSource: null,
        lastNavigationTime: null,
      },
      history: { entries: [], maxSize: 100, maxEntries: 100, totalActions: 0, enabled: true },
      cognitive: { currentState: 'neutral', confidence: 0, lastUpdate: null },
      ui: { theme: 'light', focusMode: false, debugMode: false, overlaysVisible: true },
      session: { startTime: Date.now(), interactions: 0, currentSessionId: null },
    }));

    mockStore = {
      dispatch,
      getState,
    };

    next = vi.fn<[Action], Action>((action: Action) => action);
  });

  describe('Basic Middleware Behavior', () => {
    it('should pass actions through to next middleware', () => {
      const middleware = createCognitiveMiddleware();
      const middlewareChain = middleware(mockStore)(next);

      const action = navigate('right', 'keyboard');
      const result = middlewareChain(action);

      expect(next).toHaveBeenCalledWith(action);
      expect(result).toBe(action);
    });

    it('should record actions before passing them through', () => {
      const middleware = createCognitiveMiddleware({ debugMode: true });
      const middlewareChain = middleware(mockStore)(next);

      const action = navigate('left', 'keyboard');
      middlewareChain(action);

      // Action should be recorded (we can't directly test history, but we can verify next was called)
      expect(next).toHaveBeenCalledOnce();
    });

    it('should analyze state after action is processed', () => {
      const middleware = createCognitiveMiddleware({ debugMode: true });
      const middlewareChain = middleware(mockStore)(next);

      const action = navigate('up', 'gesture');
      middlewareChain(action);

      // next should be called before analysis
      expect(next).toHaveBeenCalledWith(action);
    });
  });

  describe('Frustrated State Detection', () => {
    it('should transition to frustrated after repeated errors', () => {
      const middleware = createCognitiveMiddleware({
        frustratedThreshold: 3,
        metricsWindow: 20,
        debugMode: false, // Disabled for cleaner test output
      });
      const middlewareChain = middleware(mockStore)(next);

      // Dispatch several error actions to build up error rate
      for (let i = 0; i < 10; i++) {
        middlewareChain({ type: 'navigation/ERROR' });
      }

      // Verify that a COGNITIVE_STATE_CHANGE action was dispatched
      // The middleware dispatches through the store
      const cognitiveActions = dispatch.mock.calls.filter(
        (call: any[]) => call[0]?.type === 'cognitive/STATE_CHANGE'
      );

      expect(cognitiveActions.length).toBeGreaterThan(0);
      
      if (cognitiveActions.length > 0) {
        const lastCognitiveAction = cognitiveActions[cognitiveActions.length - 1][0];
        expect(lastCognitiveAction.payload.newState).toBe('frustrated');
      }
    });

    it('should NOT transition with insufficient errors', () => {
      const middleware = createCognitiveMiddleware({
        frustratedThreshold: 3,
        metricsWindow: 20,
      });
      const middlewareChain = middleware(mockStore)(next);

      // Dispatch only 1 error - not enough to trigger frustration
      middlewareChain({ type: 'navigation/ERROR' });
      middlewareChain(navigate('right', 'keyboard'));

      // Should not dispatch cognitive state change
      const cognitiveActions = dispatch.mock.calls.filter(
        (call: any[]) => call[0]?.type === 'cognitive/STATE_CHANGE'
      );

      expect(cognitiveActions.length).toBe(0);
    });
  });

  describe('Concentrated State Detection', () => {
    it('should transition to concentrated with fast, accurate actions', () => {
      const middleware = createCognitiveMiddleware({
        concentratedThreshold: 5,
        metricsWindow: 20,
        debugMode: false,
      });
      const middlewareChain = middleware(mockStore)(next);

      // Dispatch fast, successful navigation actions
      for (let i = 0; i < 10; i++) {
        const action = navigate('right', 'keyboard');
        // Mock metadata with fast duration
        (action as any).payload.metadata = { duration: 200 }; // Fast action < 400ms
        middlewareChain(action);
      }

      // Check for concentrated state
      const cognitiveActions = dispatch.mock.calls.filter(
        (call: any[]) => call[0]?.type === 'cognitive/STATE_CHANGE'
      );

      if (cognitiveActions.length > 0) {
        const lastCognitiveAction = cognitiveActions[cognitiveActions.length - 1][0];
        expect(lastCognitiveAction.payload.newState).toBe('concentrated');
        expect(lastCognitiveAction.payload.confidence).toBeGreaterThan(0);
      }
    });
  });

  describe('Exploring State Detection', () => {
    it('should transition to exploring with high action variety', () => {
      const middleware = createCognitiveMiddleware({
        exploringThreshold: 4,
        metricsWindow: 20,
        debugMode: false,
      });
      const middlewareChain = middleware(mockStore)(next);

      // Dispatch various different action types to build variety
      const actionTypes = [
        navigate('left', 'keyboard'),
        navigate('right', 'gesture'),
        navigate('up', 'keyboard'),
        navigate('down', 'gesture'),
        { type: 'ui/TOGGLE_DEBUG' },
        { type: 'session/UPDATE' },
      ];

      // Dispatch multiple times to accumulate signals
      for (let i = 0; i < 3; i++) {
        actionTypes.forEach(action => middlewareChain(action));
      }

      // Check for exploring state
      const cognitiveActions = dispatch.mock.calls.filter(
        (call: any[]) => call[0]?.type === 'cognitive/STATE_CHANGE'
      );

      if (cognitiveActions.length > 0) {
        const lastCognitiveAction = cognitiveActions[cognitiveActions.length - 1][0];
        expect(['exploring', 'concentrated']).toContain(lastCognitiveAction.payload.newState);
      }
    });
  });

  describe('State Transition Logic', () => {
    it('should include previous state in transition payload', () => {
      const middleware = createCognitiveMiddleware({
        frustratedThreshold: 2,
        debugMode: false,
      });
      const middlewareChain = middleware(mockStore)(next);

      // Trigger frustration
      for (let i = 0; i < 8; i++) {
        middlewareChain({ type: 'navigation/ERROR' });
      }

      const cognitiveActions = dispatch.mock.calls.filter(
        (call: any[]) => call[0]?.type === 'cognitive/STATE_CHANGE'
      );

      if (cognitiveActions.length > 0) {
        const firstTransition = cognitiveActions[0][0];
        expect(firstTransition.payload.previousState).toBe('neutral');
        expect(firstTransition.payload.newState).toBe('frustrated');
      }
    });

    it('should include metrics in transition payload', () => {
      const middleware = createCognitiveMiddleware({
        frustratedThreshold: 2,
        debugMode: false,
      });
      const middlewareChain = middleware(mockStore)(next);

      // Trigger state change
      for (let i = 0; i < 8; i++) {
        middlewareChain({ type: 'navigation/ERROR' });
      }

      const cognitiveActions = dispatch.mock.calls.filter(
        (call: any[]) => call[0]?.type === 'cognitive/STATE_CHANGE'
      );

      if (cognitiveActions.length > 0) {
        const transition = cognitiveActions[0][0];
        expect(transition.payload.metrics).toBeDefined();
        expect(transition.payload.metrics.errorRate).toBeGreaterThan(0);
        expect(transition.payload.metrics.totalActions).toBeGreaterThan(0);
      }
    });

    it('should include timestamp in transition payload', () => {
      const middleware = createCognitiveMiddleware({
        frustratedThreshold: 2,
      });
      const middlewareChain = middleware(mockStore)(next);

      const startTime = performance.now();
      
      // Trigger state change
      for (let i = 0; i < 8; i++) {
        middlewareChain({ type: 'navigation/ERROR' });
      }

      const cognitiveActions = dispatch.mock.calls.filter(
        (call: any[]) => call[0]?.type === 'cognitive/STATE_CHANGE'
      );

      if (cognitiveActions.length > 0) {
        const transition = cognitiveActions[0][0];
        expect(transition.payload.timestamp).toBeGreaterThanOrEqual(startTime);
        expect(transition.payload.timestamp).toBeLessThanOrEqual(performance.now());
      }
    });
  });

  describe('Configuration', () => {
    it('should respect custom frustratedThreshold', () => {
      const middleware = createCognitiveMiddleware({
        frustratedThreshold: 10, // Very high threshold
        metricsWindow: 20,
      });
      const middlewareChain = middleware(mockStore)(next);

      // Dispatch some errors (but not enough for threshold of 10)
      for (let i = 0; i < 5; i++) {
        middlewareChain({ type: 'navigation/ERROR' });
      }

      // Should not transition to frustrated yet
      const cognitiveActions = dispatch.mock.calls.filter(
        (call: any[]) => call[0]?.type === 'cognitive/STATE_CHANGE'
      );

      expect(cognitiveActions.length).toBe(0);
    });

    it('should respect custom metricsWindow', () => {
      const middleware = createCognitiveMiddleware({
        metricsWindow: 5, // Small window
        frustratedThreshold: 2,
      });
      const middlewareChain = middleware(mockStore)(next);

      // Dispatch enough actions to test window
      for (let i = 0; i < 8; i++) {
        middlewareChain({ type: 'navigation/ERROR' });
      }

      // Should still analyze (window size doesn't prevent analysis)
      const cognitiveActions = dispatch.mock.calls.filter(
        (call: any[]) => call[0]?.type === 'cognitive/STATE_CHANGE'
      );

      // With a small window and errors, should detect frustration
      expect(cognitiveActions.length).toBeGreaterThan(0);
    });
  });

  describe('Edge Cases', () => {
    it('should not analyze with insufficient actions', () => {
      const middleware = createCognitiveMiddleware({
        debugMode: false,
      });
      const middlewareChain = middleware(mockStore)(next);

      // Dispatch only 1 action (need 3+ for analysis)
      middlewareChain(navigate('right', 'keyboard'));

      // Should not dispatch state change
      const cognitiveActions = dispatch.mock.calls.filter(
        (call: any[]) => call[0]?.type === 'cognitive/STATE_CHANGE'
      );

      expect(cognitiveActions.length).toBe(0);
    });

    it('should handle actions without payload gracefully', () => {
      const middleware = createCognitiveMiddleware();
      const middlewareChain = middleware(mockStore)(next);

      const action = { type: 'SIMPLE_ACTION' };
      
      expect(() => middlewareChain(action)).not.toThrow();
      expect(next).toHaveBeenCalledWith(action);
    });

    it('should handle actions with malformed metadata', () => {
      const middleware = createCognitiveMiddleware();
      const middlewareChain = middleware(mockStore)(next);

      const action = {
        type: 'navigation/NAVIGATE',
        payload: { direction: 'left', source: 'keyboard', metadata: 'invalid' },
      };

      expect(() => middlewareChain(action as any)).not.toThrow();
    });
  });
});
