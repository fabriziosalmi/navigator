/**
 * Placeholder Reducers
 *
 * These are temporary reducers for parts of the state that will be migrated
 * in future sprints. They maintain the state structure but don't handle any
 * actions yet.
 *
 * As we migrate each domain (navigation, cognitive, etc.), we'll replace these
 * with full implementations.
 * 
 * NOTE: NavigationState and navigationReducer migrated to navigationReducer.ts in Sprint 2
 * NOTE: CognitiveState migrated to cognitiveMiddleware.ts in Sprint 3
 */

import type { Action, Reducer } from '../types';
import type { CognitiveState, CognitiveStateChangeAction } from '../middleware/cognitiveMiddleware';

/**
 * Cognitive state shape - now a simple wrapper for middleware-managed state
 */
export interface CognitiveStateSlice {
  currentState: CognitiveState;
  confidence: number;
  lastUpdate: number | null;
}

/**
 * UI state shape (to be implemented in Sprint 3+)
 */
export interface UIState {
  theme: 'light' | 'dark';
  focusMode: boolean;
  debugMode: boolean;
  overlaysVisible: boolean;
}

/**
 * Session state shape (to be implemented in Sprint 3+)
 */
export interface SessionState {
  startTime: number;
  interactions: number;
  currentSessionId: string | null;
}

/**
 * Cognitive reducer - now handles COGNITIVE_STATE_CHANGE from middleware
 */
const cognitiveInitialState: CognitiveStateSlice = {
  currentState: 'neutral',
  confidence: 0,
  lastUpdate: null,
};

export const cognitiveReducer: Reducer<CognitiveStateSlice, Action> = (
  state = cognitiveInitialState,
  action
) => {
  switch (action.type) {
    case 'cognitive/STATE_CHANGE': {
      const payload = action.payload as any;
      // Support both middleware format (newState) and test format (currentState)
      const newState = payload.newState || payload.currentState;
      const confidence = payload.confidence ?? 0;
      const timestamp = payload.timestamp ?? (typeof performance !== 'undefined' ? performance.now() : Date.now());
      
      return {
        currentState: newState,
        confidence: confidence,
        lastUpdate: timestamp,
      };
    }

    case '@@cognitive/RESET':
      return { ...cognitiveInitialState };

    default:
      return state;
  }
};/**
 * UI reducer (placeholder)
 */
const uiInitialState: UIState = {
  theme: 'light',
  focusMode: false,
  debugMode: false,
  overlaysVisible: true,
};

export const uiReducer: Reducer<UIState, Action> = (
  state = uiInitialState,
  action
) => {
  // Placeholder - will be implemented in Sprint 3+
  switch (action.type) {
    case '@@ui/INIT':
      return { ...uiInitialState };

    case '@@ui/SET_THEME':
      return {
        ...state,
        theme: action.payload as 'light' | 'dark',
      };

    case '@@ui/TOGGLE_DEBUG':
      return {
        ...state,
        debugMode: !state.debugMode,
      };

    default:
      return state;
  }
};

/**
 * Session reducer (placeholder)
 */
const sessionInitialState: SessionState = {
  startTime: Date.now(),
  interactions: 0,
  currentSessionId: null,
};

export const sessionReducer: Reducer<SessionState, Action> = (
  state = sessionInitialState,
  action
) => {
  // Placeholder - will be implemented in Sprint 3+
  switch (action.type) {
    case '@@session/INIT':
      return {
        ...sessionInitialState,
        startTime: Date.now(),
      };

    case '@@session/INCREMENT_INTERACTIONS':
      return {
        ...state,
        interactions: state.interactions + 1,
      };

    default:
      return state;
  }
};

/**
 * Placeholder actions for UI (to demonstrate the system works)
 */
export const uiActions = {
  setTheme: (theme: 'light' | 'dark') => ({
    type: '@@ui/SET_THEME',
    payload: theme,
  } as const),

  toggleDebug: () => ({
    type: '@@ui/TOGGLE_DEBUG',
  } as const),
};
