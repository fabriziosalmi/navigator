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

// ============================================
// SPRINT 1: Plugin Init Timeout (TDD)
// ============================================

describe('SPRINT 1: Plugin Init Timeout', () => {
  let core: NavigatorCore;

  beforeEach(() => {
    core = new NavigatorCore({ debugMode: false });
  });

  describe('Plugin initialization timeout', () => {
    it('should timeout if a plugin takes too long to initialize', async () => {
      const slowPlugin = {
        name: 'slow-plugin',
        _initTimeout: 100,
        async init() {
          // Promise che non si risolve mai -> timeout garantito
          await new Promise(() => {});
        }
      };

      core.registerPlugin(slowPlugin);

      // L'init deve fallire con un errore di timeout
      await expect(core.init()).rejects.toThrow(/timeout/i);
    }, 500);

    it('should successfully init a plugin that completes within timeout', async () => {
      const fastPlugin = {
        name: 'fast-plugin',
        _initTimeout: 1000,
        async init() {
          await new Promise(r => setTimeout(r, 50)); // Completa in tempo
        }
      };

      core.registerPlugin(fastPlugin);

      await expect(core.init()).resolves.not.toThrow();
      expect(core.isInitialized).toBe(true);
    });

    it('should use default timeout (5000ms) if _initTimeout is not specified', async () => {
      const pluginWithoutTimeout = {
        name: 'no-timeout-plugin',
        async init() {
          await new Promise(r => setTimeout(r, 10)); // Veloce
        }
      };

      core.registerPlugin(pluginWithoutTimeout);

      const startTime = performance.now();
      await core.init();
      const duration = performance.now() - startTime;

      expect(core.isInitialized).toBe(true);
      expect(duration).toBeLessThan(1000); // Completa velocemente
    });

    it('should provide clear error message with plugin name on timeout', async () => {
      const slowPlugin = {
        name: 'my-slow-plugin',
        _initTimeout: 50,
        async init() {
          await new Promise(r => setTimeout(r, 200));
        }
      };

      core.registerPlugin(slowPlugin);

      try {
        await core.init();
        expect.fail('Should have thrown timeout error');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toContain('my-slow-plugin');
        expect((error as Error).message).toMatch(/timeout|50ms/i);
      }
    });

    it('should timeout multiple slow plugins independently', async () => {
      const slowPlugin1 = {
        name: 'slow-plugin-1',
        _initTimeout: 100,
        async init() {
          await new Promise(r => setTimeout(r, 200));
        }
      };

      const slowPlugin2 = {
        name: 'slow-plugin-2',
        _initTimeout: 100,
        async init() {
          await new Promise(r => setTimeout(r, 50)); // Questo dovrebbe passare
        }
      };

      core.registerPlugin(slowPlugin1);
      core.registerPlugin(slowPlugin2);

      // Il primo plugin lento dovrebbe causare il fallimento
      await expect(core.init()).rejects.toThrow(/slow-plugin-1/);
      expect(core.isInitialized).toBe(false);
    });

    it('should allow very long timeouts for heavy plugins (e.g., ML models)', async () => {
      const heavyPlugin = {
        name: 'ml-plugin',
        _initTimeout: 30000, // 30 secondi
        async init() {
          await new Promise(r => setTimeout(r, 100)); // Simula caricamento pesante
        }
      };

      core.registerPlugin(heavyPlugin);

      await expect(core.init()).resolves.not.toThrow();
      expect(core.isInitialized).toBe(true);
    });

    it('should handle synchronous init without timeout issues', async () => {
      const syncPlugin = {
        name: 'sync-plugin',
        _initTimeout: 100,
        init() {
          // Init sincrono - dovrebbe completare istantaneamente
        }
      };

      core.registerPlugin(syncPlugin);

      await expect(core.init()).resolves.not.toThrow();
      expect(core.isInitialized).toBe(true);
    });

    it('should emit error event when plugin init times out', async () => {
      let errorEmitted = false;
      let errorDetails: any = null;

      core.eventBus.on('core:error', (event) => {
        errorEmitted = true;
        errorDetails = event.payload;
      });

      const slowPlugin = {
        name: 'timeout-plugin',
        _initTimeout: 50,
        async init() {
          await new Promise(r => setTimeout(r, 200));
        }
      };

      core.registerPlugin(slowPlugin);

      try {
        await core.init();
      } catch (error) {
        // Errore atteso
      }

      expect(errorEmitted).toBe(true);
      expect(errorDetails).toHaveProperty('message');
      expect(errorDetails.message).toContain('timeout');
    });
  });

  describe('Parallel Plugin Initialization (Sprint 2 - Task 1)', () => {
    it('should initialize critical plugins in parallel and deferred plugins in background', async () => {
      const executionOrder: string[] = [];

      // Create "gates" that we can manually control
      let resolveSlowCritical: () => void;
      const slowCriticalPromise = new Promise<void>(resolve => { 
        resolveSlowCritical = resolve; 
      });

      let resolveDeferred: () => void;
      const deferredPromise = new Promise<void>(resolve => { 
        resolveDeferred = resolve; 
      });

      const slowCriticalPlugin = {
        name: 'slow-critical',
        _priority: 100,
        async init() {
          executionOrder.push('slow-critical-init-start');
          await slowCriticalPromise;
          executionOrder.push('slow-critical-init-end');
        }
      };

      const fastCriticalPlugin = {
        name: 'fast-critical',
        _priority: 100,
        async init() {
          executionOrder.push('fast-critical-init-start');
          executionOrder.push('fast-critical-init-end');
        }
      };

      const deferredPlugin = {
        name: 'deferred',
        _priority: 50,
        async init() {
          executionOrder.push('deferred-init-start');
          await deferredPromise;
          executionOrder.push('deferred-init-end');
        }
      };

      core.registerPlugin(slowCriticalPlugin);
      core.registerPlugin(fastCriticalPlugin);
      core.registerPlugin(deferredPlugin);

      // --- EXECUTION ---
      const initPromise = core.init();

      // Wait a moment for async calls to start
      await new Promise(r => setImmediate(r));

      // --- PARALLELISM ASSERTIONS ---
      // Both critical plugins must have *started* their init,
      // but the slow one hasn't finished yet
      expect(executionOrder).toContain('slow-critical-init-start');
      expect(executionOrder).toContain('fast-critical-init-start');
      expect(executionOrder).toContain('fast-critical-init-end');
      
      // Slow critical is still blocked, so core.init() hasn't resolved yet
      // Deferred plugins CAN'T have started because core:init:complete hasn't fired yet
      expect(executionOrder).not.toContain('slow-critical-init-end');
      expect(executionOrder).not.toContain('core-init-resolved');

      // Now "unlock" the slow plugin
      resolveSlowCritical!();

      // Core init must now resolve
      await initPromise;
      executionOrder.push('core-init-resolved');

      // Now core:init:complete has fired, deferred plugins can start
      await new Promise(r => setImmediate(r));

      // Core init is done
      expect(executionOrder).toContain('slow-critical-init-end');
      expect(executionOrder).toContain('core-init-resolved');
      expect(core.isInitialized).toBe(true);

      // Deferred plugin should have started now (core:init:complete fired)
      expect(executionOrder).toContain('deferred-init-start');
      
      // But NOT finished (still blocked on gate)
      expect(executionOrder).not.toContain('deferred-init-end');

      // Now unlock the deferred plugin and verify it completes
      resolveDeferred!();
      await new Promise(r => setImmediate(r)); // Give it time to complete

      expect(executionOrder).toContain('deferred-init-end');
    });

    it('should separate plugins by priority into critical and deferred groups', async () => {
      const criticalPlugin1 = {
        name: 'critical-1',
        _priority: 100,
        init: vi.fn()
      };

      const criticalPlugin2 = {
        name: 'critical-2',
        _priority: 150,
        init: vi.fn()
      };

      const deferredPlugin = {
        name: 'deferred-1',
        _priority: 50,
        init: vi.fn()
      };

      core.registerPlugin(criticalPlugin1);
      core.registerPlugin(criticalPlugin2);
      core.registerPlugin(deferredPlugin);

      await core.init();

      // Critical plugins should be initialized immediately
      expect(criticalPlugin1.init).toHaveBeenCalled();
      expect(criticalPlugin2.init).toHaveBeenCalled();
      expect(core.isInitialized).toBe(true);

      // Deferred plugin init should be called but runs in background
      await new Promise(resolve => setImmediate(resolve));
      expect(deferredPlugin.init).toHaveBeenCalled();
    });

    it('should initialize plugins without explicit priority as critical (backward compat)', async () => {
      const pluginWithoutPriority = {
        name: 'default-plugin',
        // No _priority set - should default to 100 (critical)
        init: vi.fn()
      };

      core.registerPlugin(pluginWithoutPriority);
      await core.init();

      // Plugin should be initialized (critical)
      expect(pluginWithoutPriority.init).toHaveBeenCalled();
      expect(core.isInitialized).toBe(true);
    });

    it('should emit core:deferred:ready event after deferred plugins initialize', async () => {
      const deferredPlugin1 = {
        name: 'deferred-1',
        _priority: 30,
        init: vi.fn()
      };

      const deferredPlugin2 = {
        name: 'deferred-2',
        _priority: 60,
        init: vi.fn()
      };

      let deferredReadyEvent: any = null;
      core.eventBus.on('core:deferred:ready', (event) => {
        deferredReadyEvent = event.payload;
      });

      core.registerPlugin(deferredPlugin1);
      core.registerPlugin(deferredPlugin2);

      await core.init();

      // Wait for deferred initialization
      await new Promise(resolve => setImmediate(resolve));

      expect(deferredReadyEvent).toBeTruthy();
      expect(deferredReadyEvent).toHaveProperty('source', 'NavigatorCore');
      expect(deferredReadyEvent).toHaveProperty('pluginCount', 2);
    });

    it('should not block init() waiting for deferred plugins', async () => {
      let criticalDone = false;
      let deferredDone = false;

      const criticalPlugin = {
        name: 'critical',
        _priority: 100,
        async init() {
          criticalDone = true;
        }
      };

      const deferredPlugin = {
        name: 'deferred',
        _priority: 50,
        async init() {
          // Simulate slow deferred plugin
          await new Promise(resolve => setTimeout(resolve, 100));
          deferredDone = true;
        }
      };

      core.registerPlugin(criticalPlugin);
      core.registerPlugin(deferredPlugin);

      await core.init();

      // init() should complete with critical plugin initialized
      expect(core.isInitialized).toBe(true);
      expect(criticalDone).toBe(true);
      
      // Deferred should NOT be done yet (background init)
      expect(deferredDone).toBe(false);
    });
  });
});
