import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { DomRendererPlugin } from '../src/DomRendererPlugin';
import { NavigatorCore } from '@navigator.menu/core';
import type { IntentPredictionPayload } from '@navigator.menu/types';

describe('DomRendererPlugin', () => {
  let core: NavigatorCore;
  let plugin: DomRendererPlugin;
  let documentBody: HTMLElement;

  beforeEach(() => {
    core = new NavigatorCore({ debugMode: false });
    plugin = new DomRendererPlugin({ 
      debugMode: false,
      target: document.body, // v17.1: Use HTMLElement directly
    });
    documentBody = document.body;
    
    // Clean body classes and styles
    documentBody.className = '';
    documentBody.removeAttribute('style');
  });

  afterEach(async () => {
    await plugin.destroy?.();
    documentBody.className = '';
    documentBody.removeAttribute('style');
  });

  describe('Plugin Lifecycle', () => {
    it('should have correct plugin name', () => {
      expect(plugin.name).toBe('dom-renderer');
    });

    it('should initialize successfully', async () => {
      await plugin.init(core);
      expect(plugin.name).toBe('dom-renderer');
    });

    it('should subscribe to events on start', async () => {
      await plugin.init(core);
      await plugin.start();
      
      // Plugin should be ready
      expect(plugin.name).toBe('dom-renderer');
    });

    it('should cleanup on destroy', async () => {
      await plugin.init(core);
      await plugin.start();
      await plugin.destroy();
      
      // Body should be cleaned
      expect(documentBody.className).toBe('');
    });
  });

  describe('Cognitive State Rendering', () => {
    it('should add state-frustrated class on frustrated state', async () => {
      await core.init();
      await plugin.init(core);
      await plugin.start();

      // Dispatch cognitive state change via Store
      core.store.dispatch({
        type: 'cognitive/STATE_CHANGE',
        payload: {
          currentState: 'frustrated',
          confidence: 0.8,
        },
      });

      // Wait for store subscription processing
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(documentBody.classList.contains('state-frustrated')).toBe(true);
      expect(documentBody.classList.contains('state-neutral')).toBe(false);
    });

    it('should add state-concentrated class on concentrated state', async () => {
      await core.init();
      await plugin.init(core);
      await plugin.start();

      // Dispatch cognitive state change via Store
      core.store.dispatch({
        type: 'cognitive/STATE_CHANGE',
        payload: {
          currentState: 'concentrated',
          confidence: 0.9,
        },
      });

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(documentBody.classList.contains('state-concentrated')).toBe(true);
    });

    it('should add state-exploring class on exploring state', async () => {
      await core.init();
      await plugin.init(core);
      await plugin.start();

      // Dispatch cognitive state change via Store
      core.store.dispatch({
        type: 'cognitive/STATE_CHANGE',
        payload: {
          currentState: 'exploring',
          confidence: 0.7,
        },
      });

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(documentBody.classList.contains('state-exploring')).toBe(true);
    });

    it('should remove old state class when transitioning', async () => {
      await core.init();
      await plugin.init(core);
      await plugin.start();

      // First state: frustrated
      core.store.dispatch({
        type: 'cognitive/STATE_CHANGE',
        payload: {
          currentState: 'frustrated',
          confidence: 0.8,
        },
      });
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(documentBody.classList.contains('state-frustrated')).toBe(true);

      // Transition to concentrated
      core.store.dispatch({
        type: 'cognitive/STATE_CHANGE',
        payload: {
          currentState: 'concentrated',
          confidence: 0.9,
        },
      });
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(documentBody.classList.contains('state-frustrated')).toBe(false);
      expect(documentBody.classList.contains('state-concentrated')).toBe(true);
    });
  });

  describe('Intent Prediction Rendering', () => {
    it('should add preloading class to predicted target', async () => {
      await core.init();
      await plugin.init(core);
      await plugin.start();

      // Create target element
      const targetCard = document.createElement('div');
      targetCard.id = 'card-5';
      targetCard.className = 'card';
      document.body.appendChild(targetCard);

      // Emit intent prediction
      const payload: IntentPredictionPayload = {
        intent: 'navigate',
        targetCardId: 'card-5',
        confidence: 0.85,
        trajectory: [
          { x: 100, y: 100, timestamp: performance.now() - 200 },
          { x: 150, y: 120, timestamp: performance.now() - 100 },
          { x: 200, y: 140, timestamp: performance.now() },
        ],
      };

      core.eventBus.emit('intent:prediction', payload);
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(targetCard.classList.contains('card--preloading')).toBe(true);

      // Cleanup
      targetCard.remove();
    });

    it('should handle prediction for non-existent element gracefully', async () => {
      await core.init();
      await plugin.init(core);
      await plugin.start();

      const payload: IntentPredictionPayload = {
        intent: 'navigate',
        targetCardId: 'non-existent-card',
        confidence: 0.9,
        trajectory: [],
      };

      // Should not throw
      expect(() => {
        core.eventBus.emit('intent:prediction', payload);
      }).not.toThrow();
    });

    it('should remove preloading class from previous target', async () => {
      await core.init();
      await plugin.init(core);
      await plugin.start();

      const card1 = document.createElement('div');
      card1.id = 'card-1';
      card1.className = 'card';
      document.body.appendChild(card1);

      const card2 = document.createElement('div');
      card2.id = 'card-2';
      card2.className = 'card';
      document.body.appendChild(card2);

      // Predict card-1
      core.eventBus.emit('intent:prediction', {
        targetCardId: 'card-1',
        confidence: 0.8,
        trajectory: [],
      });
      await new Promise(resolve => setTimeout(resolve, 100));
      expect(card1.classList.contains('card--preloading')).toBe(true);

      // Predict card-2
      core.eventBus.emit('intent:prediction', {
        targetCardId: 'card-2',
        confidence: 0.85,
        trajectory: [],
      });
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(card1.classList.contains('card--preloading')).toBe(false);
      expect(card2.classList.contains('card--preloading')).toBe(true);

      // Cleanup
      card1.remove();
      card2.remove();
    });
  });

  describe('Debug Mode', () => {
    it('should set data-cognitive-state attribute in debug mode', async () => {
      const debugPlugin = new DomRendererPlugin({ debugMode: true });
      
      await core.init();
      await debugPlugin.init(core);
      await debugPlugin.start();

      core.store.dispatch({
        type: 'cognitive/STATE_CHANGE',
        payload: {
          currentState: 'frustrated',
          confidence: 0.8,
        },
      });
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(documentBody.dataset.cognitiveState).toBe('frustrated');

      await debugPlugin.destroy();
    });

    it('should not set data attribute when debug mode is off', async () => {
      await core.init();
      await plugin.init(core);
      await plugin.start();

      core.store.dispatch({
        type: 'cognitive/STATE_CHANGE',
        payload: {
          currentState: 'concentrated',
          confidence: 0.9,
        },
      });
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(documentBody.dataset.cognitiveState).toBeUndefined();
    });
  });

  describe('Custom DOM Events', () => {
    it('should dispatch custom navigatorStateChange event', async () => {
      await core.init();
      await plugin.init(core);
      await plugin.start();

      const eventSpy = vi.fn();
      document.addEventListener('navigatorStateChange', eventSpy);

      core.store.dispatch({
        type: 'cognitive/STATE_CHANGE',
        payload: {
          currentState: 'frustrated',
          confidence: 0.8,
        },
      });
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(eventSpy).toHaveBeenCalled();
      
      const customEvent = eventSpy.mock.calls[0][0] as CustomEvent;
      expect(customEvent.detail.state).toBe('frustrated');
      expect(customEvent.detail.confidence).toBe(0.8);

      document.removeEventListener('navigatorStateChange', eventSpy);
    });

    it('should dispatch custom navigatorIntentPrediction event', async () => {
      await core.init();
      await plugin.init(core);
      await plugin.start();

      const eventSpy = vi.fn();
      document.addEventListener('navigatorIntentPrediction', eventSpy);

      const payload: IntentPredictionPayload = {
        intent: 'navigate',
        targetCardId: 'card-5',
        confidence: 0.85,
        trajectory: [],
      };

      core.eventBus.emit('intent:prediction', payload);
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(eventSpy).toHaveBeenCalled();
      
      const customEvent = eventSpy.mock.calls[0][0] as CustomEvent;
      expect(customEvent.detail.targetId).toBe('card-5'); // v17.1: Changed to targetId
      expect(customEvent.detail.confidence).toBe(0.85);

      document.removeEventListener('navigatorIntentPrediction', eventSpy);
    });
  });

  describe('v17.1: CSS Custom Properties', () => {
    it('should set --animation-speed-multiplier on state change', async () => {
      await core.init();
      await plugin.init(core);
      await plugin.start();

      core.store.dispatch({
        type: 'cognitive/STATE_CHANGE',
        payload: {
          currentState: 'frustrated',
          confidence: 0.8,
        },
      });
      await new Promise(resolve => setTimeout(resolve, 100));

      const multiplier = documentBody.style.getPropertyValue('--animation-speed-multiplier');
      expect(multiplier).toBe('1.5'); // frustrated = slower
    });

    it('should use concentrated speed multiplier', async () => {
      await core.init();
      await plugin.init(core);
      await plugin.start();

      core.store.dispatch({
        type: 'cognitive/STATE_CHANGE',
        payload: {
          currentState: 'concentrated',
          confidence: 0.9,
        },
      });
      await new Promise(resolve => setTimeout(resolve, 100));

      const multiplier = documentBody.style.getPropertyValue('--animation-speed-multiplier');
      expect(multiplier).toBe('0.6'); // concentrated = faster
    });

    it('should support custom speed multipliers', async () => {
      const customPlugin = new DomRendererPlugin({
        target: documentBody,
        speedMultipliers: {
          frustrated: 2.0, // Custom value
        },
      });

      await core.init();
      await customPlugin.init(core);
      await customPlugin.start();

      core.store.dispatch({
        type: 'cognitive/STATE_CHANGE',
        payload: {
          currentState: 'frustrated',
          confidence: 0.8,
        },
      });
      await new Promise(resolve => setTimeout(resolve, 100));

      const multiplier = documentBody.style.getPropertyValue('--animation-speed-multiplier');
      expect(multiplier).toBe('2'); // toString() removes trailing .0

      await customPlugin.destroy();
    });

    it('should clean up CSS property on destroy', async () => {
      await core.init();
      await plugin.init(core);
      await plugin.start();

      core.store.dispatch({
        type: 'cognitive/STATE_CHANGE',
        payload: {
          currentState: 'frustrated',
          confidence: 0.8,
        },
      });
      await new Promise(resolve => setTimeout(resolve, 100));

      await plugin.destroy();

      const multiplier = documentBody.style.getPropertyValue('--animation-speed-multiplier');
      expect(multiplier).toBe(''); // Cleaned up
    });
  });

  describe('v17.1: Configurable Target', () => {
    it('should accept HTMLElement as target', async () => {
      const customDiv = document.createElement('div');
      customDiv.id = 'custom-container';
      document.body.appendChild(customDiv);

      const customPlugin = new DomRendererPlugin({
        target: customDiv,
      });

      await core.init();
      await customPlugin.init(core);
      await customPlugin.start();

      core.store.dispatch({
        type: 'cognitive/STATE_CHANGE',
        payload: {
          currentState: 'concentrated',
          confidence: 0.9,
        },
      });
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(customDiv.classList.contains('state-concentrated')).toBe(true);
      expect(documentBody.classList.contains('state-concentrated')).toBe(false);

      await customPlugin.destroy();
      customDiv.remove();
    });

    it('should accept selector string as target', async () => {
      const customDiv = document.createElement('div');
      customDiv.id = 'another-container';
      document.body.appendChild(customDiv);

      const customPlugin = new DomRendererPlugin({
        target: '#another-container',
      });

      await core.init();
      await customPlugin.init(core);
      await customPlugin.start();

      core.store.dispatch({
        type: 'cognitive/STATE_CHANGE',
        payload: {
          currentState: 'exploring',
          confidence: 0.7,
        },
      });
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(customDiv.classList.contains('state-exploring')).toBe(true);

      await customPlugin.destroy();
      customDiv.remove();
    });

    it('should throw error if target not found', async () => {
      const customPlugin = new DomRendererPlugin({
        target: '#non-existent-element',
      });

      await core.init();
      
      await expect(customPlugin.init(core)).rejects.toThrow(
        '[DomRenderer] Target element "#non-existent-element" not found.'
      );
    });
  });

  describe('v17.1: Prediction Threshold', () => {
    it('should respect custom prediction threshold', async () => {
      const customPlugin = new DomRendererPlugin({
        target: documentBody,
        predictionThreshold: 0.90, // Higher threshold
      });

      await core.init();
      await customPlugin.init(core);
      await customPlugin.start();

      const card = document.createElement('div');
      card.id = 'card-test';
      document.body.appendChild(card);

      // Low confidence (below custom threshold)
      core.eventBus.emit('intent:prediction', {
        intent: 'navigate',
        targetCardId: 'card-test',
        confidence: 0.85, // Below 0.90
        trajectory: [],
      });
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(card.classList.contains('card--preloading')).toBe(false);

      // High confidence (above threshold)
      core.eventBus.emit('intent:prediction', {
        intent: 'navigate',
        targetCardId: 'card-test',
        confidence: 0.95,
        trajectory: [],
      });
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(card.classList.contains('card--preloading')).toBe(true);

      await customPlugin.destroy();
      card.remove();
    });
  });
});
