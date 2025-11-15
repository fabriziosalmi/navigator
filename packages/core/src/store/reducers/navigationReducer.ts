/**
 * Navigation Reducer
 * 
 * Manages the navigation state for the carousel interface.
 * Handles card-to-card navigation (left/right) and layer switching (up/down).
 * 
 * Sprint 2 - Task 2.1: First reducer migrated to unidirectional flow
 */

import type { Action, Reducer } from '../types';
import { NAVIGATE, type NavigateAction } from '../../actions/navigation';

/**
 * Navigation state shape
 */
export interface NavigationState {
  /** Current card index (0-based) */
  currentCard: number;
  
  /** Current layer index (0-based) */
  currentLayer: number;
  
  /** Total number of cards in current layer */
  totalCards: number;
  
  /** Total number of layers */
  totalLayers: number;
  
  /** Last navigation direction (for animation purposes) */
  direction: 'left' | 'right' | 'up' | 'down' | null;
  
  /** Whether navigation animation is in progress */
  isAnimating: boolean;
  
  /** Source of last navigation */
  lastSource: string | null;
  
  /** Timestamp of last navigation */
  lastNavigationTime: number | null;
}

/**
 * Initial navigation state
 * Default configuration for a 4-layer, 5-card-per-layer carousel
 */
const initialState: NavigationState = {
    currentCard: 0,
    currentLayer: 0,
    totalCards: 5,
    totalLayers: 4,
    direction: null,
    isAnimating: false,
    lastSource: null,
    lastNavigationTime: null
};

/**
 * Navigation reducer
 * 
 * Handles NAVIGATE actions and updates the navigation state accordingly.
 * Implements wrap-around behavior for card navigation (carousel effect).
 * Prevents layer navigation beyond boundaries.
 * 
 * @param state - Current navigation state
 * @param action - Action to process
 * @returns New navigation state
 */
export const navigationReducer: Reducer<NavigationState, Action> = (
    state = initialState,
    action
) => {
    // Handle navigation actions
    if (action.type === NAVIGATE) {
        const { direction, source, metadata } = (action as NavigateAction).payload;
    
        const newState = { ...state };
    
        switch (direction) {
            case 'right':
                // Wrap around to first card if at the end
                newState.currentCard = (state.currentCard + 1) % state.totalCards;
                newState.direction = 'right';
                break;
        
            case 'left':
                // Wrap around to last card if at the beginning
                newState.currentCard = 
          state.currentCard === 0 
              ? state.totalCards - 1 
              : state.currentCard - 1;
                newState.direction = 'left';
                break;
        
            case 'down':
                // Move to next layer if not at the last layer
                if (state.currentLayer < state.totalLayers - 1) {
                    newState.currentLayer = state.currentLayer + 1;
                    newState.direction = 'down';
                    // Reset to first card when changing layers
                    newState.currentCard = 0;
                } else {
                    // At last layer, don't navigate but update direction for feedback
                    newState.direction = 'down';
                }
                break;
        
            case 'up':
                // Move to previous layer if not at the first layer
                if (state.currentLayer > 0) {
                    newState.currentLayer = state.currentLayer - 1;
                    newState.direction = 'up';
                    // Reset to first card when changing layers
                    newState.currentCard = 0;
                } else {
                    // At first layer, don't navigate but update direction for feedback
                    newState.direction = 'up';
                }
                break;
        }
    
        // Update metadata
        newState.lastSource = source;
        newState.lastNavigationTime = metadata?.timestamp ?? performance.now();
        newState.isAnimating = true; // Will be set to false by animation completion
    
        return newState;
    }
  
    // Handle animation completion
    if (action.type === '@@navigation/ANIMATION_COMPLETE') {
        return {
            ...state,
            isAnimating: false
        };
    }
  
    // Handle configuration updates
    if (action.type === '@@navigation/SET_CONFIG') {
        const { totalCards, totalLayers } = action.payload as any;
        return {
            ...state,
            totalCards: totalCards ?? state.totalCards,
            totalLayers: totalLayers ?? state.totalLayers
        };
    }
  
    // Handle reset
    if (action.type === '@@navigation/RESET') {
        return {
            ...initialState,
            // Preserve configuration
            totalCards: state.totalCards,
            totalLayers: state.totalLayers
        };
    }
  
    // Default: return state unchanged
    return state;
};

/**
 * Navigation action creators
 * Helper functions to create navigation-related actions
 */
export const navigationActions = {
    /**
   * Mark animation as complete
   */
    animationComplete: () => ({
        type: '@@navigation/ANIMATION_COMPLETE' as const
    }),
  
    /**
   * Update navigation configuration
   */
    setConfig: (totalCards: number, totalLayers: number) => ({
        type: '@@navigation/SET_CONFIG' as const,
        payload: { totalCards, totalLayers }
    }),
  
    /**
   * Reset navigation to initial state
   */
    reset: () => ({
        type: '@@navigation/RESET' as const
    })
};
