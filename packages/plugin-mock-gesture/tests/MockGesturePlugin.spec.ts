/**
 * MockGesturePlugin Tests
 * 
 * Tests for the mock gesture plugin covering:
 * - Plugin lifecycle
 * - EventBus emissions (legacy)
 * - Store dispatch (unidirectional flow)
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { MockGesturePlugin } from '../src/MockGesturePlugin';
import type { NavigatorCore } from '@navigator.menu/core';

describe('MockGesturePlugin', () => {
  let plugin: MockGesturePlugin;
  let mockCore: NavigatorCore;

  beforeEach(() => {
    // Create mock NavigatorCore with store and eventBus
    mockCore = {
      eventBus: {
        emit: vi.fn(),
        on: vi.fn(),
        off: vi.fn(),
      },
      store: {
        dispatch: vi.fn(),
        getState: vi.fn(),
        subscribe: vi.fn(),
      },
    } as unknown as NavigatorCore;

    plugin = new MockGesturePlugin({ interval: 100, alternate: true, emitIntents: true });
  });

  afterEach(async () => {
    if (plugin) {
      await plugin.destroy();
    }
    vi.clearAllTimers();
    vi.clearAllMocks();
  });

  // ========================================
  // Plugin Lifecycle
  // ========================================

  describe('Plugin Lifecycle', () => {
    it('should initialize with core reference', async () => {
      await plugin.init(mockCore);
      expect(plugin.name).toBe('mock-gesture');
    });

    it('should start emitting events at configured interval', async () => {
      vi.useFakeTimers();
      await plugin.init(mockCore);
      await plugin.start();

      // Fast-forward time by interval
      vi.advanceTimersByTime(100);

      // Should have emitted first gesture
      expect(mockCore.eventBus.emit).toHaveBeenCalled();
      
      vi.useRealTimers();
    });

    it('should stop emitting when stopped', async () => {
      vi.useFakeTimers();
      await plugin.init(mockCore);
      await plugin.start();
      
      await plugin.stop();
      
      const callCountAfterStop = (mockCore.eventBus.emit as any).mock.calls.length;
      
      // Advance time - no new events should be emitted
      vi.advanceTimersByTime(1000);
      
      expect((mockCore.eventBus.emit as any).mock.calls.length).toBe(callCountAfterStop);
      
      vi.useRealTimers();
    });

    it('should clean up on destroy', async () => {
      await plugin.init(mockCore);
      await plugin.start();
      await plugin.destroy();
      
      expect((plugin as any).core).toBeNull();
    });
  });

  // ========================================
  // EventBus Emissions (Legacy)
  // ========================================

  describe('EventBus Emissions (Legacy)', () => {
    it('should emit gesture:swipe_left event', async () => {
      vi.useFakeTimers();
      await plugin.init(mockCore);
      await plugin.start();
      
      vi.advanceTimersByTime(100);
      
      expect(mockCore.eventBus.emit).toHaveBeenCalledWith(
        'gesture:swipe_left',
        expect.objectContaining({
          type: 'gesture:swipe_left',
          payload: expect.objectContaining({
            direction: 'left',
            mock: true,
          }),
        })
      );
      
      vi.useRealTimers();
    });

    it('should emit intent:navigate_left when emitIntents is true', async () => {
      vi.useFakeTimers();
      await plugin.init(mockCore);
      await plugin.start();
      
      vi.advanceTimersByTime(100);
      
      expect(mockCore.eventBus.emit).toHaveBeenCalledWith(
        'intent:navigate_left',
        expect.objectContaining({
          type: 'intent:navigate_left',
          payload: expect.objectContaining({
            source: 'mock-gesture',
            direction: 'left',
          }),
        })
      );
      
      vi.useRealTimers();
    });

    it('should alternate between left and right directions', async () => {
      vi.useFakeTimers();
      await plugin.init(mockCore);
      await plugin.start();
      
      // First emission: left
      vi.advanceTimersByTime(100);
      expect(mockCore.eventBus.emit).toHaveBeenCalledWith(
        'gesture:swipe_left',
        expect.anything()
      );
      
      vi.clearAllMocks();
      
      // Second emission: right
      vi.advanceTimersByTime(100);
      expect(mockCore.eventBus.emit).toHaveBeenCalledWith(
        'gesture:swipe_right',
        expect.anything()
      );
      
      vi.useRealTimers();
    });

    it('should not emit intents when emitIntents is false', async () => {
      plugin = new MockGesturePlugin({ interval: 100, emitIntents: false });
      vi.useFakeTimers();
      
      await plugin.init(mockCore);
      await plugin.start();
      
      vi.advanceTimersByTime(100);
      
      // Should only emit gesture events, not intent events
      expect(mockCore.eventBus.emit).toHaveBeenCalledWith(
        'gesture:swipe_left',
        expect.anything()
      );
      
      expect(mockCore.eventBus.emit).not.toHaveBeenCalledWith(
        'intent:navigate_left',
        expect.anything()
      );
      
      vi.useRealTimers();
    });
  });

  // ========================================
  // Unidirectional Flow - Navigation Actions
  // ========================================

  describe('Unidirectional Flow - Navigation Actions', () => {
    it('should dispatch navigate action for left swipe', async () => {
      vi.useFakeTimers();
      await plugin.init(mockCore);
      await plugin.start();
      
      vi.advanceTimersByTime(100);
      
      expect(mockCore.store.dispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'navigation/NAVIGATE',
          payload: expect.objectContaining({
            direction: 'left',
            source: 'gesture',
          }),
        })
      );
      
      vi.useRealTimers();
    });

    it('should dispatch navigate action for right swipe', async () => {
      vi.useFakeTimers();
      await plugin.init(mockCore);
      await plugin.start();
      
      // Skip first emission (left)
      vi.advanceTimersByTime(100);
      vi.clearAllMocks();
      
      // Second emission (right)
      vi.advanceTimersByTime(100);
      
      expect(mockCore.store.dispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'navigation/NAVIGATE',
          payload: expect.objectContaining({
            direction: 'right',
            source: 'gesture',
          }),
        })
      );
      
      vi.useRealTimers();
    });

    it('should include timestamp in dispatched action', async () => {
      vi.useFakeTimers();
      await plugin.init(mockCore);
      await plugin.start();
      
      vi.advanceTimersByTime(100);
      
      const dispatchCall = (mockCore.store.dispatch as any).mock.calls[0][0];
      expect(dispatchCall.payload.metadata).toHaveProperty('timestamp');
      expect(typeof dispatchCall.payload.metadata.timestamp).toBe('number');
      
      vi.useRealTimers();
    });

    it('should dispatch actions at configured interval', async () => {
      vi.useFakeTimers();
      await plugin.init(mockCore);
      await plugin.start();
      
      // First action
      vi.advanceTimersByTime(100);
      expect(mockCore.store.dispatch).toHaveBeenCalledTimes(1);
      
      // Second action
      vi.advanceTimersByTime(100);
      expect(mockCore.store.dispatch).toHaveBeenCalledTimes(2);
      
      // Third action
      vi.advanceTimersByTime(100);
      expect(mockCore.store.dispatch).toHaveBeenCalledTimes(3);
      
      vi.useRealTimers();
    });

    it('should include metadata in dispatched action', async () => {
      vi.useFakeTimers();
      await plugin.init(mockCore);
      await plugin.start();
      
      vi.advanceTimersByTime(100);
      
      const dispatchCall = (mockCore.store.dispatch as any).mock.calls[0][0];
      expect(dispatchCall.payload.metadata).toEqual(
        expect.objectContaining({
          mock: true,
        })
      );
      
      vi.useRealTimers();
    });
  });
});
