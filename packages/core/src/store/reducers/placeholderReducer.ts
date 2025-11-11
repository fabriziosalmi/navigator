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
 */

import type { Action, Reducer } from '../types';

/**
 * Cognitive state shape (to be implemented in Sprint 3+)
 */
export interface CognitiveState {
  profile: {
    speed: number;
    accuracy: number;
    errorRate: number;
    adaptiveLevel: number;
  };
  isLearning: boolean;
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
 * Cognitive reducer (placeholder)
 */
const cognitiveInitialState: CognitiveState = {
  profile: {
    speed: 1.0,
    accuracy: 1.0,
    errorRate: 0.0,
    adaptiveLevel: 1.0,
  },
  isLearning: false,
  lastUpdate: null,
};

export const cognitiveReducer: Reducer<CognitiveState, Action> = (
  state = cognitiveInitialState,
  action
) => {
  // Placeholder - will be implemented in Sprint 3+
  switch (action.type) {
    case '@@cognitive/INIT':
      return { ...cognitiveInitialState };

    default:
      return state;
  }
};

/**
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
