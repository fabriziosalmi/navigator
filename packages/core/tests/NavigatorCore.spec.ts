import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NavigatorCore } from '../src/NavigatorCore';
import { EventBus } from '../src/EventBus';
import { AppState } from '../src/AppState';

describe('NavigatorCore - Area 1: Initialization & State', () => {
  let core: NavigatorCore;

  beforeEach(() => {
    core = new NavigatorCore();
  });

  describe('constructor', () => {
    it('should initialize with an empty state and event bus', () => {
      expect(core).toBeInstanceOf(NavigatorCore);
      expect(core.eventBus).toBeInstanceOf(EventBus);
      expect(core.state).toBeInstanceOf(AppState);
      expect(core.isInitialized).toBe(false);
      expect(core.isRunning).toBe(false);
    });

    it('should accept configuration options', () => {
      const customCore = new NavigatorCore({
        debugMode: true,
        autoStart: false
      });

      expect(customCore).toBeInstanceOf(NavigatorCore);
    });

    it('should pass initialState to AppState', () => {
      const customCore = new NavigatorCore({
        initialState: {
          custom: { value: 42 }
        }
      });

      expect(customCore.state.get('custom.value')).toBe(42);
    });
  });

  describe('lifecycle transitions', () => {
    it('should transition state from IDLE -> INITIALIZING -> INITIALIZED during init()', async () => {
      const events: string[] = [];
      
      core.eventBus.on('core:init:start', () => events.push('INITIALIZING'));
      core.eventBus.on('core:init:complete', () => events.push('INITIALIZED'));

      await core.init();

      expect(events).toEqual(['INITIALIZING', 'INITIALIZED']);
      expect(core.isInitialized).toBe(true);
    });

    it('should transition to RUNNING during start()', async () => {
      const events: string[] = [];
      
      core.eventBus.on('core:start:begin', () => events.push('STARTING'));
      core.eventBus.on('core:start:complete', () => events.push('RUNNING'));

      await core.init();
      await core.start();

      expect(events).toEqual(['STARTING', 'RUNNING']);
      expect(core.isRunning).toBe(true);
    });

    it('should transition to STOPPED during stop()', async () => {
      const events: string[] = [];
      
      core.eventBus.on('core:stop:begin', () => events.push('STOPPING'));
      core.eventBus.on('core:stop:complete', () => events.push('STOPPED'));

      await core.init();
      await core.start();
      await core.stop();

      expect(events).toEqual(['STOPPING', 'STOPPED']);
      expect(core.isRunning).toBe(false);
    });

    it('should emit lifecycle events during transitions', async () => {
      const eventsSpy = vi.fn();
      
      core.eventBus.on('core:init:start', eventsSpy);
      core.eventBus.on('core:init:complete', eventsSpy);
      core.eventBus.on('core:start:begin', eventsSpy);
      core.eventBus.on('core:start:complete', eventsSpy);

      await core.init();
      await core.start();

      expect(eventsSpy).toHaveBeenCalledTimes(4);
    });
  });

  describe('lifecycle guards', () => {
    it('should warn if init() called multiple times', async () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      await core.init();
      await core.init(); // Second call

      expect(consoleSpy).toHaveBeenCalledWith('NavigatorCore: Already initialized');
      consoleSpy.mockRestore();
    });

    it('should throw if start() called before init()', async () => {
      await expect(core.start()).rejects.toThrow('Must call init() before start()');
    });

    it('should warn if start() called multiple times', async () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      await core.init();
      await core.start();
      await core.start(); // Second call

      expect(consoleSpy).toHaveBeenCalledWith('NavigatorCore: Already running');
      consoleSpy.mockRestore();
    });

    it('should warn if stop() called when not running', async () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      await core.init();
      await core.stop(); // Not started yet

      expect(consoleSpy).toHaveBeenCalledWith('NavigatorCore: Not running');
      consoleSpy.mockRestore();
    });
  });

  describe('destroy()', () => {
    it('should emit destroy events', async () => {
      const events: string[] = [];
      
      core.eventBus.on('core:destroy:begin', () => events.push('DESTROYING'));
      core.eventBus.on('core:destroy:complete', () => events.push('DESTROYED'));

      await core.init();
      await core.destroy();

      expect(events).toEqual(['DESTROYING', 'DESTROYED']);
    });

    it('should reset initialization state', async () => {
      await core.init();
      await core.start();
      await core.destroy();

      expect(core.isInitialized).toBe(false);
      expect(core.isRunning).toBe(false);
    });

    it('should stop before destroying if running', async () => {
      const events: string[] = [];
      
      core.eventBus.on('core:stop:complete', () => events.push('STOPPED'));
      core.eventBus.on('core:destroy:complete', () => events.push('DESTROYED'));

      await core.init();
      await core.start();
      await core.destroy();

      expect(events).toEqual(['STOPPED', 'DESTROYED']);
    });
  });

  describe('autoStart configuration', () => {
    it('should auto-start if autoStart is true', async () => {
      const autoCore = new NavigatorCore({ autoStart: true });
      const startSpy = vi.fn();
      
      autoCore.eventBus.on('core:start:complete', startSpy);

      await autoCore.init();

      expect(startSpy).toHaveBeenCalled();
      expect(autoCore.isRunning).toBe(true);
    });

    it('should not auto-start if autoStart is false', async () => {
      const manualCore = new NavigatorCore({ autoStart: false });
      const startSpy = vi.fn();
      
      manualCore.eventBus.on('core:start:complete', startSpy);

      await manualCore.init();

      expect(startSpy).not.toHaveBeenCalled();
      expect(manualCore.isRunning).toBe(false);
    });
  });
});
