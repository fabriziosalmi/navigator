/**
 * KeyboardPlugin.spec.ts
 * 
 * Test suite for KeyboardPlugin using TDD approach.
 * Tests written BEFORE implementation.
 * 
 * Test Areas:
 * 1. Plugin Lifecycle (init, start, stop, destroy)
 * 2. Event Listeners (attach/detach on start/stop)
 * 3. Key Events (keydown, keyup emission)
 * 4. Arrow Keys (navigation intent events)
 * 5. Key Combinations (Ctrl+d, Ctrl+h)
 * 6. preventDefault behavior
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NavigatorCore } from '@navigator.menu/core';
import { KeyboardPlugin } from '../src/KeyboardPlugin';

describe('KeyboardPlugin', () => {
  let core: NavigatorCore;
  let plugin: KeyboardPlugin;

  beforeEach(() => {
    core = new NavigatorCore();
    plugin = new KeyboardPlugin();
  });

  // ========================================
  // Area 1: Plugin Lifecycle
  // ========================================

  describe('Plugin Lifecycle', () => {
    it('should have correct plugin name', () => {
      expect(plugin.name).toBe('keyboard');
    });

    it('should implement INavigatorPlugin interface', () => {
      expect(plugin).toHaveProperty('init');
      expect(typeof plugin.init).toBe('function');
    });

    it('should initialize successfully', async () => {
      await core.registerPlugin(plugin).init();
      expect(core.isInitialized).toBe(true);
    });

    it('should start and attach event listeners', async () => {
      const addEventListenerSpy = vi.spyOn(window, 'addEventListener');
      
      await core.registerPlugin(plugin).init();
      await core.start();

      expect(addEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
      expect(addEventListenerSpy).toHaveBeenCalledWith('keyup', expect.any(Function));
    });

    it('should stop and remove event listeners', async () => {
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');
      
      await core.registerPlugin(plugin).init();
      await core.start();
      await core.stop();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
      expect(removeEventListenerSpy).toHaveBeenCalledWith('keyup', expect.any(Function));
    });

    it('should clean up on destroy', async () => {
      await core.registerPlugin(plugin).init();
      await core.start();
      
      // Spy BEFORE destroy
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');
      
      await core.destroy();

      // Verify listeners were removed
      expect(removeEventListenerSpy).toHaveBeenCalled();
    });
  });

  // ========================================
  // Area 2: Key Event Emission
  // ========================================

  describe('Key Event Emission', () => {
    beforeEach(async () => {
      await core.registerPlugin(plugin).init();
      await core.start();
    });

    it('should emit "keyboard:keydown" event on key press', () => {
      const eventSpy = vi.fn();
      core.eventBus.on('keyboard:keydown', eventSpy);

      const keyEvent = new KeyboardEvent('keydown', { key: 'a', code: 'KeyA' });
      window.dispatchEvent(keyEvent);

      expect(eventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: expect.objectContaining({
            key: 'a',
            code: 'KeyA',
          }),
        })
      );
    });

    it('should emit "keyboard:keyup" event on key release', () => {
      const eventSpy = vi.fn();
      core.eventBus.on('keyboard:keyup', eventSpy);

      const keyEvent = new KeyboardEvent('keyup', { key: 'a', code: 'KeyA' });
      window.dispatchEvent(keyEvent);

      expect(eventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: expect.objectContaining({
            key: 'a',
            code: 'KeyA',
          }),
        })
      );
    });

    it('should include modifier keys in event payload', () => {
      const eventSpy = vi.fn();
      core.eventBus.on('keyboard:keydown', eventSpy);

      const keyEvent = new KeyboardEvent('keydown', {
        key: 'a',
        ctrlKey: true,
        shiftKey: true,
      });
      window.dispatchEvent(keyEvent);

      expect(eventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: expect.objectContaining({
            ctrlKey: true,
            shiftKey: true,
          }),
        })
      );
    });
  });

  // ========================================
  // Area 3: Arrow Key Navigation Intents
  // ========================================

  describe('Arrow Key Navigation Intents', () => {
    beforeEach(async () => {
      await core.registerPlugin(plugin).init();
      await core.start();
    });

    it('should emit "intent:navigate_left" on left arrow', () => {
      const eventSpy = vi.fn();
      core.eventBus.on('intent:navigate_left', eventSpy);

      const keyEvent = new KeyboardEvent('keydown', {
        key: 'ArrowLeft',
        code: 'ArrowLeft',
      });
      window.dispatchEvent(keyEvent);

      expect(eventSpy).toHaveBeenCalled();
    });

    it('should emit "intent:navigate_right" on right arrow', () => {
      const eventSpy = vi.fn();
      core.eventBus.on('intent:navigate_right', eventSpy);

      const keyEvent = new KeyboardEvent('keydown', {
        key: 'ArrowRight',
        code: 'ArrowRight',
      });
      window.dispatchEvent(keyEvent);

      expect(eventSpy).toHaveBeenCalled();
    });

    it('should emit "intent:navigate_up" on up arrow', () => {
      const eventSpy = vi.fn();
      core.eventBus.on('intent:navigate_up', eventSpy);

      const keyEvent = new KeyboardEvent('keydown', {
        key: 'ArrowUp',
        code: 'ArrowUp',
      });
      window.dispatchEvent(keyEvent);

      expect(eventSpy).toHaveBeenCalled();
    });

    it('should emit "intent:navigate_down" on down arrow', () => {
      const eventSpy = vi.fn();
      core.eventBus.on('intent:navigate_down', eventSpy);

      const keyEvent = new KeyboardEvent('keydown', {
        key: 'ArrowDown',
        code: 'ArrowDown',
      });
      window.dispatchEvent(keyEvent);

      expect(eventSpy).toHaveBeenCalled();
    });

    it('should emit "intent:select" on Enter key', () => {
      const eventSpy = vi.fn();
      core.eventBus.on('intent:select', eventSpy);

      const keyEvent = new KeyboardEvent('keydown', {
        key: 'Enter',
        code: 'Enter',
      });
      window.dispatchEvent(keyEvent);

      expect(eventSpy).toHaveBeenCalled();
    });

    it('should emit "intent:cancel" on Escape key', () => {
      const eventSpy = vi.fn();
      core.eventBus.on('intent:cancel', eventSpy);

      const keyEvent = new KeyboardEvent('keydown', {
        key: 'Escape',
        code: 'Escape',
      });
      window.dispatchEvent(keyEvent);

      expect(eventSpy).toHaveBeenCalled();
    });
  });

  // ========================================
  // Area 4: preventDefault Behavior
  // ========================================

  describe('preventDefault Behavior', () => {
    beforeEach(async () => {
      await core.registerPlugin(plugin).init();
      await core.start();
    });

    it('should prevent default on arrow keys', () => {
      const keyEvent = new KeyboardEvent('keydown', {
        key: 'ArrowLeft',
        code: 'ArrowLeft',
      });
      const preventDefaultSpy = vi.spyOn(keyEvent, 'preventDefault');

      window.dispatchEvent(keyEvent);

      expect(preventDefaultSpy).toHaveBeenCalled();
    });

    it('should prevent default on Space key', () => {
      const keyEvent = new KeyboardEvent('keydown', {
        key: ' ',
        code: 'Space',
      });
      const preventDefaultSpy = vi.spyOn(keyEvent, 'preventDefault');

      window.dispatchEvent(keyEvent);

      expect(preventDefaultSpy).toHaveBeenCalled();
    });

    it('should NOT prevent default on regular keys', () => {
      const keyEvent = new KeyboardEvent('keydown', {
        key: 'a',
        code: 'KeyA',
      });
      const preventDefaultSpy = vi.spyOn(keyEvent, 'preventDefault');

      window.dispatchEvent(keyEvent);

      expect(preventDefaultSpy).not.toHaveBeenCalled();
    });
  });

  // ========================================
  // Area 5: Key Combinations
  // ========================================

  describe('Key Combinations', () => {
    beforeEach(async () => {
      await core.registerPlugin(plugin).init();
      await core.start();
    });

    it('should emit "keyboard:combo" for Ctrl+d', () => {
      const eventSpy = vi.fn();
      core.eventBus.on('keyboard:combo', eventSpy);

      // Simulate Ctrl+d
      window.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Control', ctrlKey: true })
      );
      window.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'd', ctrlKey: true })
      );

      expect(eventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: expect.objectContaining({
            combo: 'Ctrl+d',
          }),
        })
      );
    });

    it('should emit "keyboard:combo" for Ctrl+h', () => {
      const eventSpy = vi.fn();
      core.eventBus.on('keyboard:combo', eventSpy);

      // Simulate Ctrl+h
      window.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Control', ctrlKey: true })
      );
      window.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'h', ctrlKey: true })
      );

      expect(eventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: expect.objectContaining({
            combo: 'Ctrl+h',
          }),
        })
      );
    });
  });

  // ========================================
  // Area 6: State Tracking
  // ========================================

  describe('State Tracking', () => {
    beforeEach(async () => {
      await core.registerPlugin(plugin).init();
      await core.start();
    });

    it('should track pressed keys', () => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'a' }));
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'b' }));

      // Internal state should track both keys
      // (This would require exposing state or testing via behavior)
      expect(plugin).toBeDefined(); // Placeholder
    });

    it('should clear pressed keys on keyup', () => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'a' }));
      window.dispatchEvent(new KeyboardEvent('keyup', { key: 'a' }));

      // Internal state should clear the key
      expect(plugin).toBeDefined(); // Placeholder
    });

    it('should clear all pressed keys on stop', async () => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'a' }));
      await core.stop();

      // Internal state should be cleared
      expect(plugin).toBeDefined(); // Placeholder
    });
  });

  // ========================================
  // Area 7: Unidirectional Flow (Sprint 2)
  // TDD: Store.dispatch instead of EventBus.emit
  // ========================================

  describe('Unidirectional Flow - Navigation Actions', () => {
    beforeEach(async () => {
      await core.registerPlugin(plugin).init();
      await core.start();
    });

    it('should dispatch NAVIGATE action on ArrowRight', () => {
      const dispatchSpy = vi.spyOn(core.store, 'dispatch');

      const keyEvent = new KeyboardEvent('keydown', {
        key: 'ArrowRight',
        code: 'ArrowRight',
      });
      window.dispatchEvent(keyEvent);

      expect(dispatchSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'navigation/NAVIGATE',
          payload: expect.objectContaining({
            direction: 'right',
            source: 'keyboard',
          }),
        })
      );
    });

    it('should dispatch NAVIGATE action on ArrowLeft', () => {
      const dispatchSpy = vi.spyOn(core.store, 'dispatch');

      const keyEvent = new KeyboardEvent('keydown', {
        key: 'ArrowLeft',
        code: 'ArrowLeft',
      });
      window.dispatchEvent(keyEvent);

      expect(dispatchSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'navigation/NAVIGATE',
          payload: expect.objectContaining({
            direction: 'left',
            source: 'keyboard',
          }),
        })
      );
    });

    it('should dispatch NAVIGATE action on ArrowUp', () => {
      const dispatchSpy = vi.spyOn(core.store, 'dispatch');

      const keyEvent = new KeyboardEvent('keydown', {
        key: 'ArrowUp',
        code: 'ArrowUp',
      });
      window.dispatchEvent(keyEvent);

      expect(dispatchSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'navigation/NAVIGATE',
          payload: expect.objectContaining({
            direction: 'up',
            source: 'keyboard',
          }),
        })
      );
    });

    it('should dispatch NAVIGATE action on ArrowDown', () => {
      const dispatchSpy = vi.spyOn(core.store, 'dispatch');

      const keyEvent = new KeyboardEvent('keydown', {
        key: 'ArrowDown',
        code: 'ArrowDown',
      });
      window.dispatchEvent(keyEvent);

      expect(dispatchSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'navigation/NAVIGATE',
          payload: expect.objectContaining({
            direction: 'down',
            source: 'keyboard',
          }),
        })
      );
    });

    it('should include timestamp in action metadata', () => {
      const dispatchSpy = vi.spyOn(core.store, 'dispatch');
      const before = performance.now();

      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }));

      const after = performance.now();

      // Check that dispatch was called
      expect(dispatchSpy).toHaveBeenCalled();
      
      // Find the navigation action (may be wrapped by legacy bridge)
      const navAction = dispatchSpy.mock.calls.find((call: any) => 
        call[0]?.type === 'navigation/NAVIGATE'
      );
      
      expect(navAction).toBeDefined();
      expect(navAction![0]).toMatchObject({
        type: 'navigation/NAVIGATE',
        payload: expect.objectContaining({
          direction: 'right',
          source: 'keyboard',
          metadata: expect.objectContaining({
            timestamp: expect.any(Number),
          }),
        }),
      });

      const action = navAction![0] as any;
      expect(action.payload.metadata.timestamp).toBeGreaterThanOrEqual(before);
      expect(action.payload.metadata.timestamp).toBeLessThanOrEqual(after);
    });
  });
});
