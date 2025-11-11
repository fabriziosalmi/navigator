/**
 * Session History Integration Test
 * 
 * Tests UserSessionHistory integration with NavigatorCore:
 * 1. User actions → recordAction() → UserSessionHistory
 * 2. UserSessionHistory provides metrics
 * 3. Metrics ready for consumption by cognitive plugins
 * 
 * Validates FASE 1 integration
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { NavigatorCore } from '../../src/NavigatorCore';

describe('Session History Integration', () => {
  let core: NavigatorCore;

  beforeEach(async () => {
    core = new NavigatorCore({
      debugMode: false,
      historyMaxSize: 50,
    });
    
    await core.init();
  });

  afterEach(async () => {
    await core.destroy();
  });

  it('should record actions through NavigatorCore', () => {
    const now = performance.now();
    
    core.recordAction({
      id: 'test-1',
      timestamp: now,
      type: 'intent:navigate',
      success: true,
      duration_ms: 200,
    });
    
    core.recordAction({
      id: 'test-2',
      timestamp: now + 100,
      type: 'intent:navigate',
      success: false,
      duration_ms: 300,
    });

    // Verify history captured actions
    expect(core.history.size()).toBe(2);
    
    const latest = core.history.getLatest(2);
    expect(latest).toHaveLength(2);
    expect(latest[0].id).toBe('test-1'); // Oldest in slice
    expect(latest[1].id).toBe('test-2'); // Most recent last
  });

  it('should calculate session metrics correctly', () => {
    const now = performance.now();
    
    // Add mix of successful and failed actions
    core.recordAction({
      id: 'success-1',
      timestamp: now,
      type: 'test',
      success: true,
      duration_ms: 200,
    });
    
    core.recordAction({
      id: 'error-1',
      timestamp: now + 100,
      type: 'test',
      success: false,
      duration_ms: 300,
    });
    
    core.recordAction({
      id: 'success-2',
      timestamp: now + 200,
      type: 'another',
      success: true,
      duration_ms: 150,
    });

    const metrics = core.history.getMetrics(3);
    
    expect(metrics.totalActions).toBe(3);
    expect(metrics.errorRate).toBeCloseTo(1 / 3, 2); // 33%
    expect(metrics.averageDuration).toBeCloseTo((200 + 300 + 150) / 3, 1);
    expect(metrics.actionVariety).toBe(2); // 'test' and 'another'
    expect(metrics.recentErrors).toBe(1);
  });

  it('should handle rapid action sequences', () => {
    const now = performance.now();
    
    // Rapid-fire 50 actions
    for (let i = 0; i < 50; i++) {
      core.recordAction({
        id: `rapid-${i}`,
        timestamp: now + i * 10,
        type: 'rapid:test',
        success: Math.random() > 0.3, // 70% success rate
        duration_ms: 100 + Math.random() * 200,
      });
    }

    // History should be bounded by maxSize
    expect(core.history.size()).toBeLessThanOrEqual(50);
    
    const metrics = core.history.getMetrics(50);
    expect(metrics.totalActions).toBeGreaterThan(0);
    expect(metrics.errorRate).toBeGreaterThan(0);
    expect(metrics.errorRate).toBeLessThan(0.5);
  });

  it('should maintain circular buffer correctly', () => {
    const smallCore = new NavigatorCore({
      debugMode: false,
      historyMaxSize: 5,
    });

    const now = performance.now();
    
    // Add 10 actions to 5-capacity buffer
    for (let i = 0; i < 10; i++) {
      smallCore.recordAction({
        id: `action-${i}`,
        timestamp: now + i * 100,
        type: 'test',
        success: true,
      });
    }

    // Should only have last 5
    expect(smallCore.history.size()).toBe(5);
    
    const all = smallCore.history.getAll();
    expect(all[0].id).toBe('action-5'); // Oldest in buffer
    expect(all[4].id).toBe('action-9'); // Newest in buffer
  });

  it('should detect frustration pattern in metrics', () => {
    const now = performance.now();
    
    // Simulate frustrated user: high error rate
    for (let i = 0; i < 10; i++) {
      core.recordAction({
        id: `frustrated-${i}`,
        timestamp: now + i * 50,
        type: 'intent:navigate',
        success: i % 3 === 0, // 67% error rate
        duration_ms: 250,
      });
    }

    const metrics = core.history.getMetrics(10);
    
    // High error rate indicates frustration
    expect(metrics.errorRate).toBeGreaterThan(0.5);
    expect(metrics.recentErrors).toBeGreaterThan(3);
    
    // This pattern would trigger CognitiveModelPlugin to emit 'frustrated' state
  });

  it('should detect concentration pattern in metrics', () => {
    const now = performance.now();
    
    // Simulate concentrated user: fast and accurate
    for (let i = 0; i < 20; i++) {
      core.recordAction({
        id: `concentrated-${i}`,
        timestamp: now + i * 30,
        type: 'intent:navigate',
        success: true, // All successful
        duration_ms: 180, // Fast
      });
    }

    const metrics = core.history.getMetrics(20);
    
    // Low error rate + fast actions = concentration
    expect(metrics.errorRate).toBe(0);
    expect(metrics.averageDuration).toBeLessThan(400);
    expect(metrics.recentErrors).toBe(0);
    
    // This pattern would trigger CognitiveModelPlugin to emit 'concentrated' state
  });

  it('should detect exploration pattern in metrics', () => {
    const now = performance.now();
    
    // Simulate exploring user: variety of action types
    const actionTypes = [
      'intent:navigate',
      'keyboard:press',
      'gesture:swipe',
      'intent:select',
      'test:action',
    ];
    
    for (let i = 0; i < 15; i++) {
      core.recordAction({
        id: `exploring-${i}`,
        timestamp: now + i * 80,
        type: actionTypes[i % actionTypes.length],
        success: true,
        duration_ms: 350,
      });
    }

    const metrics = core.history.getMetrics(15);
    
    // High action variety = exploration
    expect(metrics.actionVariety).toBeGreaterThanOrEqual(4);
    
    // This pattern would trigger CognitiveModelPlugin to emit 'exploring' state
  });

  it('should work with plugins accessing history', async () => {
    // Mock plugin that reads history
    const mockPlugin = {
      name: 'history-reader',
      async init(pluginCore: NavigatorCore) {
        // Plugin can access history
        const metrics = pluginCore.history.getMetrics(10);
        expect(metrics).toBeDefined();
        expect(metrics).toHaveProperty('totalActions');
        expect(metrics).toHaveProperty('errorRate');
      },
      async start() {},
    };

    const testCore = new NavigatorCore({ debugMode: false });
    testCore.registerPlugin(mockPlugin);
    await testCore.init();

    // Add some actions
    const now = performance.now();
    testCore.recordAction({
      id: 'plugin-test',
      timestamp: now,
      type: 'test',
      success: true,
    });

    // Plugin should have accessed history during init
    expect(testCore.history.size()).toBe(1);
    
    await testCore.destroy();
  });
});
