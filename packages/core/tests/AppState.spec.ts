import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EventBus } from '../src/EventBus';
import { AppState } from '../src/AppState';

describe('AppState', () => {
  let eventBus: EventBus;
  let appState: AppState;

  beforeEach(() => {
    eventBus = new EventBus();
    appState = new AppState(eventBus);
  });

  describe('constructor', () => {
    it('should create an AppState instance with default state', () => {
      expect(appState).toBeInstanceOf(AppState);
      expect(appState.getState()).toHaveProperty('navigation');
      expect(appState.getState()).toHaveProperty('user');
      expect(appState.getState()).toHaveProperty('system');
      expect(appState.getState()).toHaveProperty('ui');
      expect(appState.getState()).toHaveProperty('input');
      expect(appState.getState()).toHaveProperty('performance');
      expect(appState.getState()).toHaveProperty('plugins');
    });

    it('should throw error if eventBus is not provided', () => {
      expect(() => {
        // @ts-expect-error Testing invalid input
        new AppState();
      }).toThrow('AppState requires an EventBus instance');
    });

    it('should throw error if eventBus is not EventBus instance', () => {
      expect(() => {
        // @ts-expect-error Testing invalid input
        new AppState({});
      }).toThrow('AppState requires an EventBus instance');
    });

    it('should accept initial state', () => {
      const customState = new AppState(eventBus, {
        custom: { data: 'test' }
      });

      expect(customState.get('custom.data')).toBe('test');
    });
  });

  describe('get()', () => {
    it('should get top-level state value', () => {
      const nav = appState.get('navigation');
      expect(nav).toHaveProperty('currentLayer');
      expect(nav).toHaveProperty('totalLayers');
    });

    it('should get nested state value using dot notation', () => {
      const currentLayer = appState.get('navigation.currentLayer');
      expect(currentLayer).toBe(0);
    });

    it('should return default value for non-existent path', () => {
      const value = appState.get('nonexistent.path', 'default');
      expect(value).toBe('default');
    });

    it('should return undefined for non-existent path without default', () => {
      const value = appState.get('nonexistent.path');
      expect(value).toBeUndefined();
    });

    it('should handle deeply nested paths', () => {
      appState.setState('deep.nested.path.value', 42);
      expect(appState.get('deep.nested.path.value')).toBe(42);
    });
  });

  describe('setState()', () => {
    it('should update state using path string', () => {
      appState.setState('navigation.currentLayer', 2);
      expect(appState.get('navigation.currentLayer')).toBe(2);
    });

    it('should update state using object', () => {
      appState.setState({
        navigation: {
          currentLayer: 3,
          layerName: 'audio'
        }
      });

      expect(appState.get('navigation.currentLayer')).toBe(3);
      expect(appState.get('navigation.layerName')).toBe('audio');
    });

    it('should merge updates by default', () => {
      appState.setState('user.level', 5);
      appState.setState('user.experiencePoints', 100);

      expect(appState.get('user.level')).toBe(5);
      expect(appState.get('user.experiencePoints')).toBe(100);
    });

    it('should support non-merge updates', () => {
      appState.setState('user', { level: 10 });
      
      // With merge: false, should replace entire user object
      appState.setState('user', { newProp: 'test' }, { merge: false });
      
      expect(appState.get('user.newProp')).toBe('test');
      expect(appState.get('user.level')).toBeUndefined();
    });

    it('should emit state:changed event', () => {
      const handler = vi.fn();
      eventBus.on('state:changed', handler);

      appState.setState('navigation.currentLayer', 5);

      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: expect.objectContaining({
            source: 'AppState'
          })
        })
      );
    });

    it('should emit specific state change events', () => {
      const handler = vi.fn();
      eventBus.on('state:navigation:changed', handler);

      appState.setState('navigation.currentLayer', 5);

      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('should not emit events when silent option is true', () => {
      const handler = vi.fn();
      eventBus.on('state:changed', handler);

      appState.setState('navigation.currentLayer', 5, { silent: true });

      expect(handler).not.toHaveBeenCalled();
    });

    it('should add state to history', () => {
      appState.setState('user.level', 1);
      appState.setState('user.level', 2);

      const history = appState.getHistory(2);
      expect(history).toHaveLength(2);
      expect(history[0].user.level).toBe(1); // Previous state
      expect(history[1].user.level).toBe(1); // State before previous
    });

    it('should call watchers on relevant updates', () => {
      const watcher = vi.fn();
      appState.watch('navigation.currentLayer', watcher);

      appState.setState('navigation.currentLayer', 10);

      expect(watcher).toHaveBeenCalledWith(10);
    });
  });

  describe('watch()', () => {
    it('should call watcher when watched path changes', () => {
      const watcher = vi.fn();
      appState.watch('user.level', watcher);

      appState.setState('user.level', 5);

      expect(watcher).toHaveBeenCalledWith(5);
    });

    it('should return unwatch function', () => {
      const watcher = vi.fn();
      const unwatch = appState.watch('user.level', watcher);

      appState.setState('user.level', 5);
      expect(watcher).toHaveBeenCalledTimes(1);

      unwatch();
      appState.setState('user.level', 10);
      expect(watcher).toHaveBeenCalledTimes(1); // Still 1, not called again
    });

    it('should support multiple watchers on same path', () => {
      const watcher1 = vi.fn();
      const watcher2 = vi.fn();

      appState.watch('user.level', watcher1);
      appState.watch('user.level', watcher2);

      appState.setState('user.level', 5);

      expect(watcher1).toHaveBeenCalledWith(5);
      expect(watcher2).toHaveBeenCalledWith(5);
    });

    it('should handle watcher errors gracefully', () => {
      const errorWatcher = vi.fn(() => {
        throw new Error('Watcher error');
      });
      const normalWatcher = vi.fn();

      appState.watch('user.level', errorWatcher);
      appState.watch('user.level', normalWatcher);

      // Should not throw, but continue calling other watchers
      expect(() => appState.setState('user.level', 5)).not.toThrow();
      expect(normalWatcher).toHaveBeenCalledWith(5);
    });

    // Sprint 2 Task 2: Async State Watchers (Debounce Mode)
    describe('debounce mode', () => {
      it('should debounce rapid state updates', async () => {
        const watcher = vi.fn();
        appState.watch('user.level', watcher, { mode: 'debounce', debounceMs: 50 });

        // Rapid updates
        appState.setState('user.level', 1);
        appState.setState('user.level', 2);
        appState.setState('user.level', 3);
        appState.setState('user.level', 4);
        appState.setState('user.level', 5);

        // Watcher should not be called immediately
        expect(watcher).not.toHaveBeenCalled();

        // Wait for debounce to fire
        await new Promise(resolve => setTimeout(resolve, 60));

        // Watcher should be called only once with the last value
        expect(watcher).toHaveBeenCalledTimes(1);
        expect(watcher).toHaveBeenCalledWith(5);
      });

      it('should support default debounceMs of 16ms (~60fps)', async () => {
        const watcher = vi.fn();
        appState.watch('user.level', watcher, { mode: 'debounce' });

        appState.setState('user.level', 1);
        appState.setState('user.level', 2);
        appState.setState('user.level', 3);

        expect(watcher).not.toHaveBeenCalled();

        await new Promise(resolve => setTimeout(resolve, 20));

        expect(watcher).toHaveBeenCalledTimes(1);
        expect(watcher).toHaveBeenCalledWith(3);
      });

      it('should maintain backward compatibility with sync mode by default', () => {
        const watcher = vi.fn();
        appState.watch('user.level', watcher); // No options = sync mode

        appState.setState('user.level', 42);

        // Should be called immediately
        expect(watcher).toHaveBeenCalledTimes(1);
        expect(watcher).toHaveBeenCalledWith(42);
      });

      it('should explicitly support sync mode', () => {
        const watcher = vi.fn();
        appState.watch('user.level', watcher, { mode: 'sync' });

        appState.setState('user.level', 42);

        expect(watcher).toHaveBeenCalledTimes(1);
        expect(watcher).toHaveBeenCalledWith(42);
      });

      it('should cleanup debounce timeout on unwatch', async () => {
        const watcher = vi.fn();
        const unwatch = appState.watch('user.level', watcher, { mode: 'debounce', debounceMs: 50 });

        appState.setState('user.level', 1);
        appState.setState('user.level', 2);

        // Unwatch before debounce fires
        unwatch();

        await new Promise(resolve => setTimeout(resolve, 60));

        // Watcher should never be called
        expect(watcher).not.toHaveBeenCalled();
      });

      it('should allow multiple watchers with different modes on same path', async () => {
        const syncWatcher = vi.fn();
        const debounceWatcher = vi.fn();

        appState.watch('user.level', syncWatcher, { mode: 'sync' });
        appState.watch('user.level', debounceWatcher, { mode: 'debounce', debounceMs: 50 });

        appState.setState('user.level', 1);
        appState.setState('user.level', 2);
        appState.setState('user.level', 3);

        // Sync watcher called immediately for each update
        expect(syncWatcher).toHaveBeenCalledTimes(3);
        expect(syncWatcher).toHaveBeenLastCalledWith(3);

        // Debounce watcher not called yet
        expect(debounceWatcher).not.toHaveBeenCalled();

        await new Promise(resolve => setTimeout(resolve, 60));

        // Debounce watcher called once with last value
        expect(debounceWatcher).toHaveBeenCalledTimes(1);
        expect(debounceWatcher).toHaveBeenCalledWith(3);
      });

      it('should reset debounce timer on each new update', async () => {
        const watcher = vi.fn();
        appState.watch('user.level', watcher, { mode: 'debounce', debounceMs: 50 });

        appState.setState('user.level', 1);
        await new Promise(resolve => setTimeout(resolve, 30)); // Wait 30ms (not enough)

        appState.setState('user.level', 2); // Reset timer
        await new Promise(resolve => setTimeout(resolve, 30)); // Wait another 30ms (still not enough)

        // Watcher still not called (timer keeps resetting)
        expect(watcher).not.toHaveBeenCalled();

        await new Promise(resolve => setTimeout(resolve, 25)); // Wait final 25ms (total 55ms from last update)

        // Now it should fire with the last value
        expect(watcher).toHaveBeenCalledTimes(1);
        expect(watcher).toHaveBeenCalledWith(2);
      });
    });
  });

  describe('getState()', () => {
    it('should return a deep copy of state', () => {
      const state = appState.getState();
      state.navigation.currentLayer = 999;

      // Original state should be unchanged
      expect(appState.get('navigation.currentLayer')).toBe(0);
    });

    it('should include all default state properties', () => {
      const state = appState.getState();

      expect(state).toHaveProperty('navigation');
      expect(state).toHaveProperty('user');
      expect(state).toHaveProperty('system');
      expect(state).toHaveProperty('ui');
      expect(state).toHaveProperty('input');
      expect(state).toHaveProperty('performance');
      expect(state).toHaveProperty('plugins');
    });
  });

  describe('reset()', () => {
    it('should reset state to default', () => {
      appState.setState('user.level', 10);
      appState.setState('navigation.currentLayer', 5);

      appState.reset();

      expect(appState.get('user.level')).toBe(1);
      expect(appState.get('navigation.currentLayer')).toBe(0);
    });

    it('should emit state:reset event', () => {
      const handler = vi.fn();
      eventBus.on('state:reset', handler);

      appState.reset();

      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: expect.objectContaining({
            source: 'AppState'
          })
        })
      );
    });

    it('should not emit event when silent is true', () => {
      const handler = vi.fn();
      eventBus.on('state:reset', handler);

      appState.reset(true);

      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe('getHistory()', () => {
    it('should return state history', () => {
      appState.setState('user.level', 1);
      appState.setState('user.level', 2);
      appState.setState('user.level', 3);

      const history = appState.getHistory(3);
      
      expect(history).toHaveLength(3);
      expect(history[0].user.level).toBe(2); // Previous state
      expect(history[1].user.level).toBe(1);
      expect(history[2].user.level).toBe(1); // Initial
    });

    it('should limit returned history', () => {
      for (let i = 0; i < 20; i++) {
        appState.setState('user.level', i);
      }

      const history = appState.getHistory(5);
      expect(history).toHaveLength(5);
    });

    it('should respect maxHistorySize', () => {
      // Make 60 updates (maxHistorySize is 50)
      for (let i = 0; i < 60; i++) {
        appState.setState('user.level', i);
      }

      const history = appState.getHistory(100);
      expect(history.length).toBeLessThanOrEqual(50);
    });
  });

  describe('timeTravel()', () => {
    it('should restore previous state', () => {
      appState.setState('user.level', 1);
      appState.setState('user.level', 2);
      appState.setState('user.level', 3);

      appState.timeTravel(1); // Go back 1 step

      expect(appState.get('user.level')).toBe(2);
    });

    it('should emit state:timetravel event', () => {
      const handler = vi.fn();
      eventBus.on('state:timetravel', handler);

      appState.setState('user.level', 1);
      appState.setState('user.level', 2);
      appState.timeTravel(1);

      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: expect.objectContaining({
            stepsBack: 1,
            source: 'AppState'
          })
        })
      );
    });

    it('should warn on invalid stepsBack', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      appState.timeTravel(0); // Invalid
      appState.timeTravel(100); // Too far back

      expect(consoleSpy).toHaveBeenCalledTimes(2);
      consoleSpy.mockRestore();
    });
  });

  describe('persist() and restore()', () => {
    beforeEach(() => {
      // Mock localStorage
      global.localStorage = {
        getItem: vi.fn(),
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn(),
        length: 0,
        key: vi.fn()
      };
    });

    it('should persist state to localStorage', () => {
      appState.setState('user.level', 10);
      appState.persist('test_key');

      expect(localStorage.setItem).toHaveBeenCalledWith(
        'test_key',
        expect.stringContaining('"level":10')
      );
    });

    it('should restore state from localStorage', () => {
      const savedState = JSON.stringify({
        user: { level: 20 },
        navigation: { currentLayer: 3 }
      });

      vi.mocked(localStorage.getItem).mockReturnValue(savedState);

      const result = appState.restore('test_key');

      expect(result).toBe(true);
      expect(appState.get('user.level')).toBe(20);
      expect(appState.get('navigation.currentLayer')).toBe(3);
    });

    it('should emit state:restored event on successful restore', () => {
      const handler = vi.fn();
      eventBus.on('state:restored', handler);

      vi.mocked(localStorage.getItem).mockReturnValue(JSON.stringify({ test: 'data' }));

      appState.restore('test_key');

      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: expect.objectContaining({
            source: 'AppState',
            key: 'test_key'
          })
        })
      );
    });

    it('should return false if restore fails', () => {
      vi.mocked(localStorage.getItem).mockReturnValue(null);

      const result = appState.restore('nonexistent_key');

      expect(result).toBe(false);
    });

    it('should handle localStorage errors gracefully', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      vi.mocked(localStorage.setItem).mockImplementation(() => {
        throw new Error('Storage full');
      });

      expect(() => appState.persist('test_key')).not.toThrow();
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });
  });

  describe('computed properties', () => {
    it('should have isNavigating computed property', () => {
      expect(appState.computed.isNavigating).toBe(false);

      appState.setState('navigation.isTransitioning', true);
      expect(appState.computed.isNavigating).toBe(true);
    });

    it('should have canNavigate computed property', () => {
      expect(appState.computed.canNavigate).toBe(true);

      appState.setState('navigation.isTransitioning', true);
      expect(appState.computed.canNavigate).toBe(false);

      appState.setState('navigation.isTransitioning', false);
      appState.setState('system.isIdle', true);
      expect(appState.computed.canNavigate).toBe(false);
    });

    it('should have isInputReady computed property', () => {
      expect(appState.computed.isInputReady).toBe(true); // keyboard enabled by default

      appState.setState('input.keyboardEnabled', false);
      appState.setState('system.mediaPipeReady', true);
      expect(appState.computed.isInputReady).toBe(true); // mediaPipe ready
    });

    it('should emit computed:updated event on state changes', () => {
      const handler = vi.fn();
      eventBus.on('state:computed:updated', handler);

      appState.setState('navigation.currentLayer', 1);

      expect(handler).toHaveBeenCalled();
    });
  });
});
