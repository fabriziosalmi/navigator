import { describe, it, expect, beforeEach } from 'vitest';
import { UserSessionHistory } from '../src/intelligence/UserSessionHistory';
import type { Action } from '@navigator.menu/types';

describe('UserSessionHistory', () => {
  let history: UserSessionHistory;

  beforeEach(() => {
    history = new UserSessionHistory(10);
  });

  describe('Buffer Management', () => {
    it('should initialize with empty buffer', () => {
      expect(history.size()).toBe(0);
      expect(history.getAll()).toEqual([]);
    });

    it('should add actions to buffer', () => {
      const action: Action = {
        id: 'test-1',
        timestamp: performance.now(),
        type: 'intent:navigate',
        success: true,
      };

      history.add(action);
      expect(history.size()).toBe(1);
      expect(history.getAll()[0]).toEqual(action);
    });

    it('should maintain FIFO order when adding actions', () => {
      const actions: Action[] = [
        { id: '1', timestamp: 100, type: 'test', success: true },
        { id: '2', timestamp: 200, type: 'test', success: true },
        { id: '3', timestamp: 300, type: 'test', success: true },
      ];

      actions.forEach(a => history.add(a));
      const stored = history.getAll();
      
      expect(stored[0].id).toBe('1');
      expect(stored[1].id).toBe('2');
      expect(stored[2].id).toBe('3');
    });

    it('should enforce maximum buffer size', () => {
      const smallHistory = new UserSessionHistory(5);

      // Add 10 actions to buffer with max size 5
      for (let i = 0; i < 10; i++) {
        smallHistory.add({
          id: `action-${i}`,
          timestamp: performance.now() + i,
          type: 'test',
          success: true,
        });
      }

      expect(smallHistory.size()).toBe(5);
      
      // Should contain actions 5-9 (oldest removed)
      const all = smallHistory.getAll();
      expect(all[0].id).toBe('action-5');
      expect(all[4].id).toBe('action-9');
    });

    it('should remove oldest action when buffer exceeds maxSize', () => {
      const smallHistory = new UserSessionHistory(3);

      const actions = [
        { id: 'oldest', timestamp: 100, type: 'test', success: true },
        { id: 'middle', timestamp: 200, type: 'test', success: true },
        { id: 'recent', timestamp: 300, type: 'test', success: true },
        { id: 'newest', timestamp: 400, type: 'test', success: true },
      ];

      actions.forEach(a => smallHistory.add(a));

      const stored = smallHistory.getAll();
      expect(stored.length).toBe(3);
      expect(stored.find(a => a.id === 'oldest')).toBeUndefined();
      expect(stored[0].id).toBe('middle');
    });

    it('should get latest N actions', () => {
      for (let i = 0; i < 10; i++) {
        history.add({
          id: `action-${i}`,
          timestamp: performance.now() + i,
          type: 'test',
          success: true,
        });
      }

      const latest3 = history.getLatest(3);
      expect(latest3.length).toBe(3);
      expect(latest3[0].id).toBe('action-7');
      expect(latest3[1].id).toBe('action-8');
      expect(latest3[2].id).toBe('action-9');
    });

    it('should clear all history', () => {
      history.add({ id: '1', timestamp: 100, type: 'test', success: true });
      history.add({ id: '2', timestamp: 200, type: 'test', success: true });
      
      expect(history.size()).toBe(2);
      
      history.clear();
      
      expect(history.size()).toBe(0);
      expect(history.getAll()).toEqual([]);
    });
  });

  describe('Metrics Calculation', () => {
    it('should return zero metrics for empty buffer', () => {
      const metrics = history.getMetrics(10);
      
      expect(metrics.errorRate).toBe(0);
      expect(metrics.recentErrors).toBe(0);
      expect(metrics.averageDuration).toBe(0);
      expect(metrics.actionVariety).toBe(0);
      expect(metrics.totalActions).toBe(0);
      expect(metrics.timeWindow).toBe(0);
    });

    it('should calculate error rate correctly', () => {
      const actions: Action[] = [
        { id: '1', timestamp: 100, type: 'test', success: true },
        { id: '2', timestamp: 200, type: 'test', success: false },
        { id: '3', timestamp: 300, type: 'test', success: false },
        { id: '4', timestamp: 400, type: 'test', success: true },
        { id: '5', timestamp: 500, type: 'test', success: false },
      ];

      actions.forEach(a => history.add(a));
      const metrics = history.getMetrics(5);

      expect(metrics.errorRate).toBe(0.6); // 3 errors out of 5
      expect(metrics.recentErrors).toBe(3);
    });

    it('should calculate average duration correctly', () => {
      const actions: Action[] = [
        { id: '1', timestamp: 100, type: 'test', success: true, duration_ms: 100 },
        { id: '2', timestamp: 200, type: 'test', success: true, duration_ms: 200 },
        { id: '3', timestamp: 300, type: 'test', success: true, duration_ms: 300 },
      ];

      actions.forEach(a => history.add(a));
      const metrics = history.getMetrics(3);

      expect(metrics.averageDuration).toBe(200); // (100 + 200 + 300) / 3
    });

    it('should handle actions without duration', () => {
      const actions: Action[] = [
        { id: '1', timestamp: 100, type: 'test', success: true, duration_ms: 100 },
        { id: '2', timestamp: 200, type: 'test', success: true }, // No duration
        { id: '3', timestamp: 300, type: 'test', success: true, duration_ms: 300 },
      ];

      actions.forEach(a => history.add(a));
      const metrics = history.getMetrics(3);

      expect(metrics.averageDuration).toBe(200); // (100 + 300) / 2
    });

    it('should calculate action variety correctly', () => {
      const actions: Action[] = [
        { id: '1', timestamp: 100, type: 'intent:navigate', success: true },
        { id: '2', timestamp: 200, type: 'gesture:swipe', success: true },
        { id: '3', timestamp: 300, type: 'intent:navigate', success: true },
        { id: '4', timestamp: 400, type: 'keyboard:press', success: true },
        { id: '5', timestamp: 500, type: 'gesture:swipe', success: true },
      ];

      actions.forEach(a => history.add(a));
      const metrics = history.getMetrics(5);

      expect(metrics.actionVariety).toBe(3); // 3 unique types
    });

    it('should calculate time window correctly', () => {
      const actions: Action[] = [
        { id: '1', timestamp: 1000, type: 'test', success: true },
        { id: '2', timestamp: 2000, type: 'test', success: true },
        { id: '3', timestamp: 5000, type: 'test', success: true },
      ];

      actions.forEach(a => history.add(a));
      const metrics = history.getMetrics(3);

      expect(metrics.timeWindow).toBe(4000); // 5000 - 1000
    });

    it('should handle window size larger than buffer', () => {
      const actions: Action[] = [
        { id: '1', timestamp: 100, type: 'test', success: true },
        { id: '2', timestamp: 200, type: 'test', success: false },
      ];

      actions.forEach(a => history.add(a));
      const metrics = history.getMetrics(10); // Requesting more than available

      expect(metrics.totalActions).toBe(2);
      expect(metrics.errorRate).toBe(0.5);
    });

    it('should calculate metrics for sliding window', () => {
      // Add 10 actions
      for (let i = 0; i < 10; i++) {
        history.add({
          id: `action-${i}`,
          timestamp: performance.now() + i * 100,
          type: 'test',
          success: i < 8, // Last 2 are failures
          duration_ms: 100 + i * 10,
        });
      }

      // Get metrics for last 5 actions
      const metrics = history.getMetrics(5);
      
      expect(metrics.totalActions).toBe(5);
      expect(metrics.recentErrors).toBe(2); // Actions 8 and 9 failed
      expect(metrics.errorRate).toBe(0.4); // 2/5
    });
  });

  describe('Real-world Scenarios', () => {
    it('should detect frustrated user pattern', () => {
      // Simulate user making many errors quickly
      const now = performance.now();
      
      for (let i = 0; i < 10; i++) {
        history.add({
          id: `action-${i}`,
          timestamp: now + i * 100,
          type: 'intent:navigate',
          success: i % 2 === 0, // 50% error rate
          duration_ms: 150,
        });
      }

      const metrics = history.getMetrics(10);
      
      expect(metrics.errorRate).toBeGreaterThan(0.4);
      expect(metrics.recentErrors).toBeGreaterThan(3);
    });

    it('should detect concentrated user pattern', () => {
      // Simulate user acting quickly and accurately
      const now = performance.now();
      
      for (let i = 0; i < 10; i++) {
        history.add({
          id: `action-${i}`,
          timestamp: now + i * 100,
          type: 'intent:navigate',
          success: true, // All successful
          duration_ms: 250 + Math.random() * 100, // Fast actions
        });
      }

      const metrics = history.getMetrics(10);
      
      expect(metrics.errorRate).toBeLessThan(0.1);
      expect(metrics.averageDuration).toBeLessThan(400);
    });
  });
});
