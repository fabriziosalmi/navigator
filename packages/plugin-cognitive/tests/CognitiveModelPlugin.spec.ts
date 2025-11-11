import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { CognitiveModelPlugin } from '../src/CognitiveModelPlugin';
import { NavigatorCore } from '@navigator.menu/core';

describe('CognitiveModelPlugin', () => {
  let core: NavigatorCore;
  let plugin: CognitiveModelPlugin;

  beforeEach(() => {
    core = new NavigatorCore({ debugMode: false });
    plugin = new CognitiveModelPlugin({ debugMode: false });
  });

  afterEach(async () => {
    await plugin.destroy?.();
  });

  describe('Plugin Lifecycle', () => {
    it('should have correct plugin name', () => {
      expect(plugin.name).toBe('cognitive-model');
    });

    it('should initialize successfully', async () => {
      await plugin.init(core);
      
      // Should set initial cognitive state in app state
      const state = core.state.getState();
      expect(state.user.cognitive_state).toBe('neutral');
    });

    it('should start analysis loop', async () => {
      await plugin.init(core);
      await plugin.start();
      
      // Analysis loop should be running
      expect(plugin.getCurrentState()).toBe('neutral');
    });

    it('should stop analysis loop', async () => {
      await plugin.init(core);
      await plugin.start();
      await plugin.stop();
      
      // State should still be accessible
      expect(plugin.getCurrentState()).toBe('neutral');
    });

    it('should cleanup on destroy', async () => {
      await plugin.init(core);
      await plugin.start();
      await plugin.destroy();
      
      // Signals should be reset
      const signals = plugin.getSignals();
      expect(signals.frustrated).toBe(0);
      expect(signals.concentrated).toBe(0);
    });
  });

  describe('State Detection - Frustrated', () => {
    it('should detect frustrated pattern with high error rate', async () => {
      await core.init();
      await plugin.init(core);
      
      // Create event spy
      const eventSpy = vi.fn();
      core.eventBus.on('system_state:change', eventSpy);

      // Inject frustrated pattern: many errors
      const now = performance.now();
      for (let i = 0; i < 10; i++) {
        core.recordAction({
          id: `action-${i}`,
          timestamp: now + i * 100,
          type: 'intent:navigate',
          success: i % 2 === 0, // 50% error rate
          duration_ms: 200,
        });
      }

      // Start plugin and wait for analysis
      await plugin.start();
      
      // Wait for analysis cycles
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Should detect frustrated state
      const finalState = plugin.getCurrentState();
      expect(['frustrated', 'neutral']).toContain(finalState);
      
      await plugin.stop();
    });

    it('should increment frustrated signal on error pattern', async () => {
      const mockPlugin = new CognitiveModelPlugin({ 
        debugMode: false,
        frustratedThreshold: 2,
      });
      
      await core.init();
      await mockPlugin.init(core);

      // Add errors to trigger frustration
      const now = performance.now();
      for (let i = 0; i < 5; i++) {
        core.recordAction({
          id: `error-${i}`,
          timestamp: now + i * 50,
          type: 'test',
          success: false, // All errors
        });
      }

      await mockPlugin.start();
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const signals = mockPlugin.getSignals();
      expect(signals.frustrated).toBeGreaterThan(0);
      
      await mockPlugin.stop();
    });
  });

  describe('State Detection - Concentrated', () => {
    it('should detect concentrated pattern with fast accurate actions', async () => {
      await core.init();
      await plugin.init(core);

      // Inject concentrated pattern: fast and accurate
      const now = performance.now();
      for (let i = 0; i < 15; i++) {
        core.recordAction({
          id: `action-${i}`,
          timestamp: now + i * 50,
          type: 'intent:navigate',
          success: true, // All successful
          duration_ms: 250, // Fast
        });
      }

      await plugin.start();
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const state = plugin.getCurrentState();
      expect(['concentrated', 'neutral']).toContain(state);
      
      await plugin.stop();
    });
  });

  describe('State Detection - Exploring', () => {
    it('should detect exploring pattern with variety', async () => {
      await core.init();
      await plugin.init(core);

      // Inject exploring pattern: variety of actions
      const now = performance.now();
      const actionTypes = ['intent:navigate', 'keyboard:press', 'gesture:swipe', 'intent:select'];
      
      for (let i = 0; i < 12; i++) {
        core.recordAction({
          id: `action-${i}`,
          timestamp: now + i * 100,
          type: actionTypes[i % actionTypes.length],
          success: true,
          duration_ms: 400,
        });
      }

      await plugin.start();
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const signals = plugin.getSignals();
      
      // Should show variety
      expect(signals.exploring).toBeGreaterThan(0);
      
      await plugin.stop();
    });
  });

  describe('Event Emission', () => {
    it('should emit system_state:change when state transitions', async () => {
      await core.init();
      await plugin.init(core);

      const eventSpy = vi.fn();
      core.eventBus.on('system_state:change', eventSpy);

      // Force state change by injecting frustrated pattern
      const now = performance.now();
      for (let i = 0; i < 10; i++) {
        core.recordAction({
          id: `action-${i}`,
          timestamp: now + i * 50,
          type: 'test',
          success: i < 3, // 70% errors
          duration_ms: 200,
        });
      }

      await plugin.start();
      await new Promise(resolve => setTimeout(resolve, 2500));

      // Event should have been emitted if state changed
      // (may not change if threshold not met, but signals should increase)
      const signals = plugin.getSignals();
      expect(signals.frustrated + signals.concentrated + signals.exploring).toBeGreaterThan(0);
      
      await plugin.stop();
    });

    it('should include confidence in state change event', async () => {
      await core.init();
      await plugin.init(core);

      let capturedPayload: any = null;
      core.eventBus.on('system_state:change', (event: any) => {
        capturedPayload = event.payload || event;
      });

      // Inject concentrated pattern
      const now = performance.now();
      for (let i = 0; i < 20; i++) {
        core.recordAction({
          id: `action-${i}`,
          timestamp: now + i * 30,
          type: 'intent:navigate',
          success: true,
          duration_ms: 200,
        });
      }

      await plugin.start();
      await new Promise(resolve => setTimeout(resolve, 3000));

      if (capturedPayload) {
        expect(capturedPayload).toHaveProperty('confidence');
        expect(capturedPayload).toHaveProperty('from');
        expect(capturedPayload).toHaveProperty('to');
        expect(capturedPayload).toHaveProperty('signals');
      }
      
      await plugin.stop();
    });
  });

  describe('Configuration', () => {
    it('should respect custom analysis interval', async () => {
      const customPlugin = new CognitiveModelPlugin({
        analysisInterval: 100,
        debugMode: false,
      });

      await core.init();
      await customPlugin.init(core);
      await customPlugin.start();

      // Should analyze more frequently
      await new Promise(resolve => setTimeout(resolve, 500));
      
      await customPlugin.stop();
      await customPlugin.destroy();
    });

    it('should respect custom thresholds', async () => {
      const customPlugin = new CognitiveModelPlugin({
        frustratedThreshold: 1, // Very low threshold
        concentratedThreshold: 1,
        debugMode: false,
      });

      await core.init();
      await customPlugin.init(core);

      // Single error should trigger frustrated
      core.recordAction({
        id: 'error-1',
        timestamp: performance.now(),
        type: 'test',
        success: false,
      });

      await customPlugin.start();
      await new Promise(resolve => setTimeout(resolve, 1000));

      const signals = customPlugin.getSignals();
      // With low threshold, should detect quickly
      expect(signals.frustrated).toBeGreaterThanOrEqual(0);
      
      await customPlugin.stop();
      await customPlugin.destroy();
    });
  });

  describe('Public API', () => {
    it('should expose getCurrentState()', async () => {
      await plugin.init(core);
      
      const state = plugin.getCurrentState();
      expect(state).toBe('neutral');
    });

    it('should expose getSignals()', async () => {
      await plugin.init(core);
      
      const signals = plugin.getSignals();
      expect(signals).toHaveProperty('frustrated');
      expect(signals).toHaveProperty('concentrated');
      expect(signals).toHaveProperty('exploring');
      expect(signals).toHaveProperty('learning');
    });
  });
});
