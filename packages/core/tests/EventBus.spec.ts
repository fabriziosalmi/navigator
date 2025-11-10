import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EventBus } from '../src/EventBus';

describe('EventBus', () => {
  let eventBus: EventBus;

  beforeEach(() => {
    eventBus = new EventBus();
  });

  describe('constructor', () => {
    it('should create an EventBus instance with default options', () => {
      expect(eventBus).toBeInstanceOf(EventBus);
      expect(eventBus.getHistory()).toEqual([]);
    });

    it('should accept custom options', () => {
      const customBus = new EventBus({
        maxHistorySize: 50,
        debugMode: true
      });
      expect(customBus).toBeInstanceOf(EventBus);
    });
  });

  describe('on()', () => {
    it('should subscribe to an event', () => {
      const handler = vi.fn();
      eventBus.on('test:event', handler);
      
      eventBus.emit('test:event', { data: 'test' });
      
      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'test:event',
          payload: { data: 'test' }
        })
      );
    });

    it('should return an unsubscribe function', () => {
      const handler = vi.fn();
      const unsubscribe = eventBus.on('test:event', handler);
      
      eventBus.emit('test:event');
      expect(handler).toHaveBeenCalledTimes(1);
      
      unsubscribe();
      eventBus.emit('test:event');
      expect(handler).toHaveBeenCalledTimes(1); // Still 1, not called again
    });

    it('should throw error if handler is not a function', () => {
      expect(() => {
        // @ts-expect-error Testing invalid input
        eventBus.on('test:event', 'not a function');
      }).toThrow('handler must be a function');
    });

    it('should support wildcard subscriptions', () => {
      const handler = vi.fn();
      eventBus.on('*', handler);
      
      eventBus.emit('event1', { data: 1 });
      eventBus.emit('event2', { data: 2 });
      
      expect(handler).toHaveBeenCalledTimes(2);
    });

    it('should support priority option', () => {
      const results: number[] = [];
      
      eventBus.on('test:priority', () => results.push(1), { priority: 1 });
      eventBus.on('test:priority', () => results.push(10), { priority: 10 });
      eventBus.on('test:priority', () => results.push(5), { priority: 5 });
      
      eventBus.emit('test:priority');
      
      expect(results).toEqual([10, 5, 1]); // Highest priority first
    });
  });

  describe('off()', () => {
    it('should unsubscribe a specific handler', () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();
      
      eventBus.on('test:event', handler1);
      eventBus.on('test:event', handler2);
      
      eventBus.off('test:event', handler1);
      eventBus.emit('test:event');
      
      expect(handler1).not.toHaveBeenCalled();
      expect(handler2).toHaveBeenCalledTimes(1);
    });

    it('should unsubscribe all handlers if no handler specified', () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();
      
      eventBus.on('test:event', handler1);
      eventBus.on('test:event', handler2);
      
      eventBus.off('test:event');
      eventBus.emit('test:event');
      
      expect(handler1).not.toHaveBeenCalled();
      expect(handler2).not.toHaveBeenCalled();
    });

    it('should unsubscribe wildcard handlers', () => {
      const handler = vi.fn();
      eventBus.on('*', handler);
      
      eventBus.off('*', handler);
      eventBus.emit('any:event');
      
      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe('once()', () => {
    it('should auto-unsubscribe after first trigger', () => {
      const handler = vi.fn();
      eventBus.once('test:event', handler);
      
      eventBus.emit('test:event', { data: 1 });
      eventBus.emit('test:event', { data: 2 });
      
      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: { data: 1 }
        })
      );
    });
  });

  describe('emit()', () => {
    it('should emit event to all subscribers', () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();
      
      eventBus.on('test:event', handler1);
      eventBus.on('test:event', handler2);
      
      const result = eventBus.emit('test:event', { data: 'test' });
      
      expect(result).toBe(true);
      expect(handler1).toHaveBeenCalledTimes(1);
      expect(handler2).toHaveBeenCalledTimes(1);
    });

    it('should return false if no handlers were called', () => {
      const result = eventBus.emit('nonexistent:event');
      expect(result).toBe(false);
    });

    it('should include event metadata', () => {
      const handler = vi.fn();
      eventBus.on('test:event', handler);
      
      eventBus.emit('test:event', { data: 'test' });
      
      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'test:event',
          payload: expect.objectContaining({ data: 'test' }),
          timestamp: expect.any(Number),
          source: expect.any(String)
        })
      );
    });

    it('should handle errors in event handlers gracefully', () => {
      const errorHandler = vi.fn(() => {
        throw new Error('Test error');
      });
      const normalHandler = vi.fn();
      
      eventBus.on('test:event', errorHandler);
      eventBus.on('test:event', normalHandler);
      
      // Should not throw, but continue calling other handlers
      expect(() => eventBus.emit('test:event')).not.toThrow();
      expect(normalHandler).toHaveBeenCalledTimes(1);
    });

    it('should emit system:error when handler throws', () => {
      const errorListener = vi.fn();
      eventBus.on('system:error', errorListener);
      
      eventBus.on('test:event', () => {
        throw new Error('Handler error');
      });
      
      eventBus.emit('test:event');
      
      expect(errorListener).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'system:error',
          payload: expect.objectContaining({
            message: expect.stringContaining('Event handler error'),
            error: expect.any(Error),
            source: 'EventBus'
          })
        })
      );
    });
  });

  describe('waitFor()', () => {
    it('should resolve when event is emitted', async () => {
      setTimeout(() => {
        eventBus.emit('test:event', { data: 'async' });
      }, 10);
      
      const event = await eventBus.waitFor('test:event');
      
      expect(event).toMatchObject({
        name: 'test:event',
        payload: { data: 'async' }
      });
    });

    it('should reject on timeout', async () => {
      await expect(
        eventBus.waitFor('never:emitted', 50)
      ).rejects.toThrow('Timeout waiting for "never:emitted"');
    });
  });

  describe('use() - middleware', () => {
    it('should apply middleware to events', () => {
      const handler = vi.fn();
      
      // Middleware that adds a timestamp
      eventBus.use((event) => ({
        ...event,
        payload: {
          ...event.payload,
          middlewareProcessed: true
        }
      }));
      
      eventBus.on('test:event', handler);
      eventBus.emit('test:event', { data: 'test' });
      
      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: expect.objectContaining({
            data: 'test',
            middlewareProcessed: true
          })
        })
      );
    });

    it('should cancel event if middleware returns null', () => {
      const handler = vi.fn();
      
      // Middleware that cancels events
      eventBus.use((event) => {
        if (event.name === 'blocked:event') {
          return null;
        }
        return event;
      });
      
      eventBus.on('blocked:event', handler);
      const result = eventBus.emit('blocked:event');
      
      expect(result).toBe(false);
      expect(handler).not.toHaveBeenCalled();
    });

    it('should throw if middleware is not a function', () => {
      expect(() => {
        // @ts-expect-error Testing invalid input
        eventBus.use('not a function');
      }).toThrow('middleware must be a function');
    });
  });

  describe('getHistory()', () => {
    it('should return event history', () => {
      eventBus.emit('event1', { data: 1 });
      eventBus.emit('event2', { data: 2 });
      
      const history = eventBus.getHistory();
      
      expect(history).toHaveLength(2);
      expect(history[0].name).toBe('event2'); // Most recent first
      expect(history[1].name).toBe('event1');
    });

    it('should filter by event name', () => {
      eventBus.emit('event1', { data: 1 });
      eventBus.emit('event2', { data: 2 });
      eventBus.emit('event1', { data: 3 });
      
      const history = eventBus.getHistory('event1');
      
      expect(history).toHaveLength(2);
      expect(history.every(e => e.name === 'event1')).toBe(true);
    });

    it('should limit results', () => {
      for (let i = 0; i < 100; i++) {
        eventBus.emit('test:event', { index: i });
      }
      
      const history = eventBus.getHistory(undefined, 10);
      
      expect(history).toHaveLength(10);
    });

    it('should respect maxHistorySize option', () => {
      const smallBus = new EventBus({ maxHistorySize: 5 });
      
      for (let i = 0; i < 10; i++) {
        smallBus.emit('test:event', { index: i });
      }
      
      const history = smallBus.getHistory();
      
      expect(history.length).toBeLessThanOrEqual(5);
    });
  });

  describe('getStats()', () => {
    it('should return event statistics', () => {
      eventBus.emit('event1');
      eventBus.emit('event2');
      eventBus.emit('event1');
      
      const stats = eventBus.getStats();
      
      expect(stats.totalEvents).toBe(3);
      expect(stats.uniqueEvents).toBe(2);
      expect(stats.topEvents).toContainEqual({ name: 'event1', count: 2 });
    });

    it('should include listener counts', () => {
      eventBus.on('event1', () => {});
      eventBus.on('event1', () => {});
      eventBus.on('event2', () => {});
      
      const stats = eventBus.getStats();
      
      expect(stats.listeners).toContainEqual({ name: 'event1', count: 2 });
      expect(stats.listeners).toContainEqual({ name: 'event2', count: 1 });
    });

    it('should include wildcard listener count', () => {
      eventBus.on('*', () => {});
      eventBus.on('*', () => {});
      
      const stats = eventBus.getStats();
      
      expect(stats.wildcardListeners).toBe(2);
    });
  });

  describe('clear()', () => {
    it('should remove all listeners', () => {
      const handler = vi.fn();
      
      eventBus.on('event1', handler);
      eventBus.on('event2', handler);
      eventBus.on('*', handler);
      
      eventBus.clear();
      
      eventBus.emit('event1');
      eventBus.emit('event2');
      
      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe('reset()', () => {
    it('should clear history and stats', () => {
      eventBus.emit('event1');
      eventBus.emit('event2');
      
      eventBus.reset();
      
      const history = eventBus.getHistory();
      const stats = eventBus.getStats();
      
      expect(history).toHaveLength(0);
      expect(stats.totalEvents).toBe(0);
      expect(stats.uniqueEvents).toBe(0);
    });
  });
});
