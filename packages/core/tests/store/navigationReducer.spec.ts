/**
 * Navigation Reducer Tests
 * 
 * Comprehensive test suite for the navigationReducer.
 * Validates all navigation scenarios including:
 * - Left/right card navigation with wrap-around
 * - Up/down layer navigation with boundaries
 * - State metadata tracking
 * - Edge cases and error conditions
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { 
  navigationReducer, 
  navigationActions,
  type NavigationState 
} from '../../src/store/reducers/navigationReducer';
import { navigate } from '@navigator.menu/types';

describe('navigationReducer', () => {
  let initialState: NavigationState;

  beforeEach(() => {
    // Reset to default state before each test
    initialState = {
      currentCard: 0,
      currentLayer: 0,
      totalCards: 5,
      totalLayers: 4,
      direction: null,
      isAnimating: false,
      lastSource: null,
      lastNavigationTime: null,
    };
  });

  describe('initialization', () => {
    it('should return initial state when state is undefined', () => {
      const state = navigationReducer(undefined, { type: '@@redux/INIT' });

      expect(state.currentCard).toBe(0);
      expect(state.currentLayer).toBe(0);
      expect(state.totalCards).toBe(5);
      expect(state.totalLayers).toBe(4);
      expect(state.direction).toBeNull();
      expect(state.isAnimating).toBe(false);
      expect(state.lastSource).toBeNull();
      expect(state.lastNavigationTime).toBeNull();
    });

    it('should preserve existing state for unknown actions', () => {
      const existingState: NavigationState = {
        ...initialState,
        currentCard: 2,
        currentLayer: 1,
      };

      const state = navigationReducer(existingState, { type: 'UNKNOWN_ACTION' });

      expect(state).toEqual(existingState);
    });
  });

  describe('right navigation (card)', () => {
    it('should navigate to next card', () => {
      const action = navigate('right', 'keyboard');
      const state = navigationReducer(initialState, action);

      expect(state.currentCard).toBe(1);
      expect(state.direction).toBe('right');
      expect(state.lastSource).toBe('keyboard');
      expect(state.isAnimating).toBe(true);
    });

    it('should wrap around to first card when at the end', () => {
      const startState = { ...initialState, currentCard: 4 }; // Last card (0-indexed)
      const action = navigate('right', 'keyboard');
      const state = navigationReducer(startState, action);

      expect(state.currentCard).toBe(0); // Wrapped to first
      expect(state.direction).toBe('right');
    });

    it('should handle multiple right navigations with wrap-around', () => {
      let state = initialState;

      // Navigate through all 5 cards
      for (let i = 0; i < 5; i++) {
        state = navigationReducer(state, navigate('right', 'keyboard'));
        expect(state.currentCard).toBe((i + 1) % 5);
      }

      // Should be back at card 0
      expect(state.currentCard).toBe(0);
    });
  });

  describe('left navigation (card)', () => {
    it('should navigate to previous card', () => {
      const startState = { ...initialState, currentCard: 2 };
      const action = navigate('left', 'keyboard');
      const state = navigationReducer(startState, action);

      expect(state.currentCard).toBe(1);
      expect(state.direction).toBe('left');
      expect(state.lastSource).toBe('keyboard');
      expect(state.isAnimating).toBe(true);
    });

    it('should wrap around to last card when at the beginning', () => {
      const action = navigate('left', 'keyboard'); // At card 0
      const state = navigationReducer(initialState, action);

      expect(state.currentCard).toBe(4); // Wrapped to last card
      expect(state.direction).toBe('left');
    });

    it('should handle multiple left navigations with wrap-around', () => {
      let state = initialState;

      // Navigate backwards 6 times (more than total cards)
      for (let i = 0; i < 6; i++) {
        state = navigationReducer(state, navigate('left', 'keyboard'));
      }

      // 0 -> 4 -> 3 -> 2 -> 1 -> 0 -> 4
      expect(state.currentCard).toBe(4);
    });
  });

  describe('down navigation (layer)', () => {
    it('should navigate to next layer', () => {
      const action = navigate('down', 'keyboard');
      const state = navigationReducer(initialState, action);

      expect(state.currentLayer).toBe(1);
      expect(state.direction).toBe('down');
      expect(state.currentCard).toBe(0); // Reset to first card
      expect(state.lastSource).toBe('keyboard');
    });

    it('should reset card position when changing layers', () => {
      const startState = { ...initialState, currentCard: 3 };
      const action = navigate('down', 'keyboard');
      const state = navigationReducer(startState, action);

      expect(state.currentLayer).toBe(1);
      expect(state.currentCard).toBe(0); // Reset
    });

    it('should not navigate beyond last layer', () => {
      const startState = { ...initialState, currentLayer: 3 }; // Last layer
      const action = navigate('down', 'keyboard');
      const state = navigationReducer(startState, action);

      expect(state.currentLayer).toBe(3); // Stay on last layer
      expect(state.direction).toBe('down'); // Direction is set for feedback
      expect(state.currentCard).toBe(0); // Card is still reset
    });

    it('should navigate through all layers sequentially', () => {
      let state = initialState;

      for (let i = 0; i < 3; i++) {
        state = navigationReducer(state, navigate('down', 'keyboard'));
        expect(state.currentLayer).toBe(i + 1);
        expect(state.currentCard).toBe(0);
      }

      expect(state.currentLayer).toBe(3); // Last layer
    });
  });

  describe('up navigation (layer)', () => {
    it('should navigate to previous layer', () => {
      const startState = { ...initialState, currentLayer: 2 };
      const action = navigate('up', 'keyboard');
      const state = navigationReducer(startState, action);

      expect(state.currentLayer).toBe(1);
      expect(state.direction).toBe('up');
      expect(state.currentCard).toBe(0); // Reset to first card
    });

    it('should not navigate beyond first layer', () => {
      const action = navigate('up', 'keyboard'); // At layer 0
      const state = navigationReducer(initialState, action);

      expect(state.currentLayer).toBe(0); // Stay on first layer
      expect(state.direction).toBe('up'); // Direction is set for feedback
      expect(state.currentCard).toBe(0); // Card is still reset
    });

    it('should navigate up through all layers', () => {
      let state = { ...initialState, currentLayer: 3 }; // Start at last layer

      for (let i = 3; i > 0; i--) {
        state = navigationReducer(state, navigate('up', 'keyboard'));
        expect(state.currentLayer).toBe(i - 1);
        expect(state.currentCard).toBe(0);
      }

      expect(state.currentLayer).toBe(0); // First layer
    });
  });

  describe('metadata tracking', () => {
    it('should track navigation source', () => {
      const keyboardAction = navigate('right', 'keyboard');
      let state = navigationReducer(initialState, keyboardAction);
      expect(state.lastSource).toBe('keyboard');

      const gestureAction = navigate('left', 'gesture');
      state = navigationReducer(state, gestureAction);
      expect(state.lastSource).toBe('gesture');

      const voiceAction = navigate('up', 'voice');
      state = navigationReducer(state, voiceAction);
      expect(state.lastSource).toBe('voice');
    });

    it('should track navigation timestamp', () => {
      const before = performance.now();
      const action = navigate('right', 'keyboard');
      const state = navigationReducer(initialState, action);
      const after = performance.now();

      expect(state.lastNavigationTime).not.toBeNull();
      expect(state.lastNavigationTime!).toBeGreaterThanOrEqual(before);
      expect(state.lastNavigationTime!).toBeLessThanOrEqual(after);
    });

    it('should set isAnimating flag on navigation', () => {
      const action = navigate('right', 'keyboard');
      const state = navigationReducer(initialState, action);

      expect(state.isAnimating).toBe(true);
    });

    it('should update direction on every navigation', () => {
      let state = initialState;

      state = navigationReducer(state, navigate('right', 'keyboard'));
      expect(state.direction).toBe('right');

      state = navigationReducer(state, navigate('left', 'keyboard'));
      expect(state.direction).toBe('left');

      state = navigationReducer(state, navigate('up', 'keyboard'));
      expect(state.direction).toBe('up');

      state = navigationReducer(state, navigate('down', 'keyboard'));
      expect(state.direction).toBe('down');
    });
  });

  describe('animation completion', () => {
    it('should clear isAnimating flag', () => {
      // First navigate (sets isAnimating = true)
      let state = navigationReducer(initialState, navigate('right', 'keyboard'));
      expect(state.isAnimating).toBe(true);

      // Then complete animation
      state = navigationReducer(state, navigationActions.animationComplete());
      expect(state.isAnimating).toBe(false);
      
      // Other state should be preserved
      expect(state.currentCard).toBe(1);
      expect(state.direction).toBe('right');
    });
  });

  describe('configuration updates', () => {
    it('should update totalCards and totalLayers', () => {
      const action = navigationActions.setConfig(10, 6);
      const state = navigationReducer(initialState, action);

      expect(state.totalCards).toBe(10);
      expect(state.totalLayers).toBe(6);
      expect(state.currentCard).toBe(0); // Position unchanged
      expect(state.currentLayer).toBe(0);
    });

    it('should preserve other state when updating config', () => {
      const startState: NavigationState = {
        ...initialState,
        currentCard: 2,
        currentLayer: 1,
        direction: 'right',
        isAnimating: true,
      };

      const state = navigationReducer(startState, navigationActions.setConfig(8, 5));

      expect(state.totalCards).toBe(8);
      expect(state.totalLayers).toBe(5);
      expect(state.currentCard).toBe(2); // Preserved
      expect(state.currentLayer).toBe(1); // Preserved
      expect(state.direction).toBe('right'); // Preserved
      expect(state.isAnimating).toBe(true); // Preserved
    });
  });

  describe('reset', () => {
    it('should reset navigation state to initial values', () => {
      const startState: NavigationState = {
        currentCard: 3,
        currentLayer: 2,
        totalCards: 5,
        totalLayers: 4,
        direction: 'right',
        isAnimating: true,
        lastSource: 'gesture',
        lastNavigationTime: 123456,
      };

      const state = navigationReducer(startState, navigationActions.reset());

      expect(state.currentCard).toBe(0);
      expect(state.currentLayer).toBe(0);
      expect(state.direction).toBeNull();
      expect(state.isAnimating).toBe(false);
      expect(state.lastSource).toBeNull();
      expect(state.lastNavigationTime).toBeNull();
      
      // Configuration preserved
      expect(state.totalCards).toBe(5);
      expect(state.totalLayers).toBe(4);
    });
  });

  describe('complex navigation sequences', () => {
    it('should handle mixed horizontal and vertical navigation', () => {
      let state = initialState;

      // Right 2 times
      state = navigationReducer(state, navigate('right', 'keyboard'));
      state = navigationReducer(state, navigate('right', 'keyboard'));
      expect(state.currentCard).toBe(2);
      expect(state.currentLayer).toBe(0);

      // Down 1 time (resets card)
      state = navigationReducer(state, navigate('down', 'keyboard'));
      expect(state.currentCard).toBe(0);
      expect(state.currentLayer).toBe(1);

      // Left 1 time
      state = navigationReducer(state, navigate('left', 'keyboard'));
      expect(state.currentCard).toBe(4); // Wrapped
      expect(state.currentLayer).toBe(1);

      // Up 1 time (resets card)
      state = navigationReducer(state, navigate('up', 'keyboard'));
      expect(state.currentCard).toBe(0);
      expect(state.currentLayer).toBe(0);
    });

    it('should track sources through mixed inputs', () => {
      let state = initialState;

      state = navigationReducer(state, navigate('right', 'keyboard'));
      expect(state.lastSource).toBe('keyboard');

      state = navigationReducer(state, navigate('down', 'gesture'));
      expect(state.lastSource).toBe('gesture');

      state = navigationReducer(state, navigate('left', 'voice'));
      expect(state.lastSource).toBe('voice');
    });
  });

  describe('edge cases', () => {
    it('should handle navigation with custom totalCards', () => {
      const customState = { ...initialState, totalCards: 3 };
      let state = customState;

      // Navigate right 4 times (should wrap)
      for (let i = 0; i < 4; i++) {
        state = navigationReducer(state, navigate('right', 'keyboard'));
      }

      expect(state.currentCard).toBe(1); // 0->1->2->0->1
    });

    it('should handle navigation with totalCards = 1', () => {
      const customState = { ...initialState, totalCards: 1 };
      
      let state = navigationReducer(customState, navigate('right', 'keyboard'));
      expect(state.currentCard).toBe(0); // 0 % 1 = 0

      state = navigationReducer(state, navigate('left', 'keyboard'));
      expect(state.currentCard).toBe(0); // Should stay at 0
    });

    it('should handle navigation with totalLayers = 1', () => {
      const customState = { ...initialState, totalLayers: 1 };
      
      let state = navigationReducer(customState, navigate('down', 'keyboard'));
      expect(state.currentLayer).toBe(0); // Can't go down

      state = navigationReducer(state, navigate('up', 'keyboard'));
      expect(state.currentLayer).toBe(0); // Can't go up
    });
  });
});
