import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  historyReducer,
  historyActions,
  historySelectors,
  type HistoryState,
} from '../../src/store/reducers/historyReducer';
import {
  navigationReducer,
  type NavigationState,
} from '../../src/store/reducers/navigationReducer';
import {
  cognitiveReducer,
  uiReducer,
  sessionReducer,
  uiActions,
  type CognitiveState,
  type UIState,
  type SessionState,
} from '../../src/store/reducers/placeholderReducer';

describe('historyReducer', () => {
  let initialState: HistoryState;

  beforeEach(() => {
    initialState = {
      entries: [],
      maxEntries: 50,
      totalActions: 0,
      enabled: true,
    };
  });

  describe('initialization', () => {
    it('should return initial state when state is undefined', () => {
      const state = historyReducer(undefined, { type: '@@redux/INIT' });

      // Should not track internal Redux actions
      expect(state.entries).toHaveLength(0);
      expect(state.totalActions).toBe(0);
      expect(state.enabled).toBe(true);
      expect(state.maxEntries).toBe(50);
    });

    it('should preserve existing state for unknown actions', () => {
      const existingState: HistoryState = {
        ...initialState,
        totalActions: 5,
      };

      const state = historyReducer(existingState, { type: 'UNKNOWN' });

      // Unknown action should be added to history
      expect(state.totalActions).toBe(6);
      expect(state.entries).toHaveLength(1);
    });
  });

  describe('history tracking', () => {
    it('should add actions to history', () => {
      let state = historyReducer(initialState, { type: 'ACTION_1' });

      expect(state.entries).toHaveLength(1);
      expect(state.entries[0].action.type).toBe('ACTION_1');
      expect(state.totalActions).toBe(1);

      state = historyReducer(state, { type: 'ACTION_2', payload: 'data' });

      expect(state.entries).toHaveLength(2);
      expect(state.entries[1].action.type).toBe('ACTION_2');
      expect(state.entries[1].action.payload).toBe('data');
      expect(state.totalActions).toBe(2);
    });

    it('should add timestamps to history entries', () => {
      const before = Date.now();
      const state = historyReducer(initialState, { type: 'ACTION_1' });
      const after = Date.now();

      expect(state.entries[0].timestamp).toBeGreaterThanOrEqual(before);
      expect(state.entries[0].timestamp).toBeLessThanOrEqual(after);
    });

    it('should implement circular buffer when max entries exceeded', () => {
      let state: HistoryState = { ...initialState, maxEntries: 3 };

      state = historyReducer(state, { type: 'ACTION_1' });
      state = historyReducer(state, { type: 'ACTION_2' });
      state = historyReducer(state, { type: 'ACTION_3' });
      state = historyReducer(state, { type: 'ACTION_4' });

      expect(state.entries).toHaveLength(3);
      expect(state.entries[0].action.type).toBe('ACTION_2'); // ACTION_1 was dropped
      expect(state.entries[1].action.type).toBe('ACTION_3');
      expect(state.entries[2].action.type).toBe('ACTION_4');
      expect(state.totalActions).toBe(4); // Total count never resets
    });

    it('should not track internal Redux actions', () => {
      const state = historyReducer(initialState, { type: '@@redux/INIT' });

      expect(state.entries).toHaveLength(0);
      expect(state.totalActions).toBe(0);
    });

    it('should not track history control actions', () => {
      const state = historyReducer(initialState, historyActions.enable());

      expect(state.entries).toHaveLength(0);
      // Total actions should not increment for control actions
    });
  });

  describe('history control actions', () => {
    it('should handle ENABLE action', () => {
      const disabledState: HistoryState = { ...initialState, enabled: false };

      const state = historyReducer(disabledState, historyActions.enable());

      expect(state.enabled).toBe(true);
    });

    it('should handle DISABLE action', () => {
      const state = historyReducer(initialState, historyActions.disable());

      expect(state.enabled).toBe(false);
    });

    it('should not add entries when disabled', () => {
      let state: HistoryState = { ...initialState, enabled: false };

      state = historyReducer(state, { type: 'ACTION_1' });

      expect(state.entries).toHaveLength(0);
      expect(state.totalActions).toBe(1); // Still counts actions
    });

    it('should handle CLEAR action', () => {
      let state = historyReducer(initialState, { type: 'ACTION_1' });
      state = historyReducer(state, { type: 'ACTION_2' });

      expect(state.entries).toHaveLength(2);
      expect(state.totalActions).toBe(2);

      state = historyReducer(state, historyActions.clear());

      expect(state.entries).toHaveLength(0);
      expect(state.totalActions).toBe(0);
    });

    it('should handle SET_MAX_ENTRIES action', () => {
      let state = historyReducer(initialState, historyActions.setMaxEntries(10));

      expect(state.maxEntries).toBe(10);

      // Add 15 actions
      for (let i = 0; i < 15; i++) {
        state = historyReducer(state, { type: `ACTION_${i}` });
      }

      expect(state.entries).toHaveLength(10);

      // Reduce max entries to 5
      state = historyReducer(state, historyActions.setMaxEntries(5));

      expect(state.maxEntries).toBe(5);
      expect(state.entries).toHaveLength(5);
      // Should keep the last 5 entries
      expect(state.entries[0].action.type).toBe('ACTION_10');
      expect(state.entries[4].action.type).toBe('ACTION_14');
    });

    it('should ignore invalid maxEntries values', () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      let state = historyReducer(initialState, historyActions.setMaxEntries(0));
      expect(state.maxEntries).toBe(50); // Unchanged

      state = historyReducer(initialState, historyActions.setMaxEntries(-1));
      expect(state.maxEntries).toBe(50); // Unchanged

      expect(consoleWarnSpy).toHaveBeenCalledTimes(2);

      consoleWarnSpy.mockRestore();
    });
  });

  describe('historySelectors', () => {
    let stateWithHistory: HistoryState;

    beforeEach(() => {
      stateWithHistory = initialState;
      for (let i = 1; i <= 5; i++) {
        stateWithHistory = historyReducer(stateWithHistory, {
          type: `ACTION_${i}`,
          payload: i,
        });
      }
    });

    it('getEntries should return all entries', () => {
      const entries = historySelectors.getEntries(stateWithHistory);

      expect(entries).toHaveLength(5);
      expect(entries[0].action.type).toBe('ACTION_1');
      expect(entries[4].action.type).toBe('ACTION_5');
    });

    it('getLastActions should return last N actions', () => {
      const lastTwo = historySelectors.getLastActions(stateWithHistory, 2);

      expect(lastTwo).toHaveLength(2);
      expect(lastTwo[0].action.type).toBe('ACTION_4');
      expect(lastTwo[1].action.type).toBe('ACTION_5');
    });

    it('getTotalActions should return total count', () => {
      expect(historySelectors.getTotalActions(stateWithHistory)).toBe(5);
    });

    it('isEnabled should return enabled status', () => {
      expect(historySelectors.isEnabled(stateWithHistory)).toBe(true);

      const disabledState = historyReducer(stateWithHistory, historyActions.disable());
      expect(historySelectors.isEnabled(disabledState)).toBe(false);
    });

    it('getActionsByType should filter actions by type', () => {
      let state = historyReducer(initialState, { type: 'CLICK' });
      state = historyReducer(state, { type: 'HOVER' });
      state = historyReducer(state, { type: 'CLICK' });
      state = historyReducer(state, { type: 'CLICK' });

      const clicks = historySelectors.getActionsByType(state, 'CLICK');

      expect(clicks).toHaveLength(3);
      expect(clicks.every(entry => entry.action.type === 'CLICK')).toBe(true);
    });

    it('getActionsInRange should filter actions by time range', () => {
      let state = historyReducer(initialState, { type: 'ACTION_1' });

      // Wait a bit
      const middle = Date.now();

      state = historyReducer(state, { type: 'ACTION_2' });
      state = historyReducer(state, { type: 'ACTION_3' });

      const end = Date.now() + 1000;

      const actionsInRange = historySelectors.getActionsInRange(state, middle, end);

      expect(actionsInRange.length).toBeGreaterThanOrEqual(2);
      expect(actionsInRange.every(entry => entry.timestamp >= middle)).toBe(true);
    });
  });
});

describe('placeholderReducers', () => {
  describe('navigationReducer', () => {
    it('should return initial state', () => {
      const state = navigationReducer(undefined, { type: '@@INIT' });

      expect(state.currentCard).toBe(0);
      expect(state.currentLayer).toBe(0);
      expect(state.totalCards).toBe(5);
      expect(state.totalLayers).toBe(4);
      expect(state.direction).toBeNull();
      expect(state.isAnimating).toBe(false);
    });

    it('should preserve state for unknown actions', () => {
      const existingState: NavigationState = {
        currentCard: 5,
        currentLayer: 2,
        totalCards: 5,
        totalLayers: 4,
        direction: 'right',
        isAnimating: true,
        lastSource: 'keyboard',
        lastNavigationTime: 123456,
      };

      const state = navigationReducer(existingState, { type: 'UNKNOWN' });

      expect(state).toBe(existingState);
    });
  });

  describe('cognitiveReducer', () => {
    it('should return initial state', () => {
      const state = cognitiveReducer(undefined, { type: '@@INIT' });

      expect(state).toEqual({
        currentState: 'neutral',
        confidence: 0,
        lastUpdate: null,
      });
    });

    it('should handle @@cognitive/RESET action', () => {
      const state = cognitiveReducer(undefined, { type: '@@cognitive/RESET' });

      expect(state).toEqual({
        currentState: 'neutral',
        confidence: 0,
        lastUpdate: null,
      });
    });
  });

  describe('uiReducer', () => {
    it('should return initial state', () => {
      const state = uiReducer(undefined, { type: '@@INIT' });

      expect(state).toEqual({
        theme: 'light',
        focusMode: false,
        debugMode: false,
        overlaysVisible: true,
      });
    });

    it('should handle SET_THEME action', () => {
      let state = uiReducer(undefined, { type: '@@INIT' });

      state = uiReducer(state, uiActions.setTheme('dark'));

      expect(state.theme).toBe('dark');
      expect(state.focusMode).toBe(false); // Other properties unchanged
    });

    it('should handle TOGGLE_DEBUG action', () => {
      let state = uiReducer(undefined, { type: '@@INIT' });

      expect(state.debugMode).toBe(false);

      state = uiReducer(state, uiActions.toggleDebug());
      expect(state.debugMode).toBe(true);

      state = uiReducer(state, uiActions.toggleDebug());
      expect(state.debugMode).toBe(false);
    });
  });

  describe('sessionReducer', () => {
    it('should return initial state with current timestamp', () => {
      const state = sessionReducer(undefined, { type: '@@INIT' });

      expect(typeof state.startTime).toBe('number');
      expect(state.startTime).toBeGreaterThan(0);
      expect(state.interactions).toBe(0);
      expect(state.currentSessionId).toBeNull();
    });

    it('should handle @@session/INIT action', () => {
      const before = Date.now();
      const state = sessionReducer(undefined, { type: '@@session/INIT' });
      const after = Date.now();

      expect(state.startTime).toBeGreaterThanOrEqual(before);
      expect(state.startTime).toBeLessThanOrEqual(after);
    });

    it('should handle INCREMENT_INTERACTIONS action', () => {
      let state = sessionReducer(undefined, { type: '@@INIT' });

      state = sessionReducer(state, { type: '@@session/INCREMENT_INTERACTIONS' });
      expect(state.interactions).toBe(1);

      state = sessionReducer(state, { type: '@@session/INCREMENT_INTERACTIONS' });
      expect(state.interactions).toBe(2);
    });
  });
});
