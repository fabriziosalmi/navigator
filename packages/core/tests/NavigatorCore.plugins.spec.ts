import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NavigatorCore, INavigatorPlugin } from '../src/NavigatorCore';

// Mock plugin implementations for testing
class MockPlugin implements INavigatorPlugin {
  name: string;
  initCalled = false;
  startCalled = false;
  stopCalled = false;
  destroyCalled = false;
  receivedCore: NavigatorCore | null = null;
  _priority?: number;
  _config?: any;

  constructor(name: string) {
    this.name = name;
  }

  async init(core: NavigatorCore): Promise<void> {
    this.initCalled = true;
    this.receivedCore = core;
  }

  async start(): Promise<void> {
    this.startCalled = true;
  }

  async stop(): Promise<void> {
    this.stopCalled = true;
  }

  async destroy(): Promise<void> {
    this.destroyCalled = true;
  }
}

class FailingPlugin implements INavigatorPlugin {
  name = 'failing-plugin';
  failOn: 'init' | 'start' | 'stop' | 'destroy';

  constructor(failOn: 'init' | 'start' | 'stop' | 'destroy') {
    this.failOn = failOn;
  }

  async init(): Promise<void> {
    if (this.failOn === 'init') {
      throw new Error('Init failed intentionally');
    }
  }

  async start(): Promise<void> {
    if (this.failOn === 'start') {
      throw new Error('Start failed intentionally');
    }
  }

  async stop(): Promise<void> {
    if (this.failOn === 'stop') {
      throw new Error('Stop failed intentionally');
    }
  }

  async destroy(): Promise<void> {
    if (this.failOn === 'destroy') {
      throw new Error('Destroy failed intentionally');
    }
  }
}

describe('NavigatorCore - Area 2: Plugin Lifecycle Management', () => {
  let core: NavigatorCore;

  beforeEach(() => {
    core = new NavigatorCore();
  });

  describe('registerPlugin()', () => {
    it('should register a plugin successfully', () => {
      const plugin = new MockPlugin('test-plugin');
      
      core.registerPlugin(plugin);

      expect(core.getPlugin('test-plugin')).toBe(plugin);
    });

    it('should throw if plugin has no name', () => {
      const invalidPlugin = {} as INavigatorPlugin;

      expect(() => {
        core.registerPlugin(invalidPlugin);
      }).toThrow('Plugin must have a name property');
    });

    it('should throw if plugin is already registered', () => {
      const plugin = new MockPlugin('test-plugin');

      core.registerPlugin(plugin);

      expect(() => {
        core.registerPlugin(plugin);
      }).toThrow('Plugin "test-plugin" already registered');
    });

    it('should throw if plugin missing init method', () => {
      const invalidPlugin = { name: 'invalid' } as INavigatorPlugin;

      expect(() => {
        core.registerPlugin(invalidPlugin);
      }).toThrow('missing required method: init');
    });

    it('should emit plugin:registered event', () => {
      const eventSpy = vi.fn();
      core.eventBus.on('core:plugin:registered', eventSpy);

      const plugin = new MockPlugin('test-plugin');
      core.registerPlugin(plugin);

      expect(eventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: expect.objectContaining({
            pluginName: 'test-plugin',
            source: 'NavigatorCore'
          })
        })
      );
    });

    it('should support plugin chaining', () => {
      const plugin1 = new MockPlugin('plugin1');
      const plugin2 = new MockPlugin('plugin2');

      const result = core
        .registerPlugin(plugin1)
        .registerPlugin(plugin2);

      expect(result).toBe(core);
      expect(core.getPlugin('plugin1')).toBe(plugin1);
      expect(core.getPlugin('plugin2')).toBe(plugin2);
    });

    it('should respect plugin priority order', () => {
      const lowPriority = new MockPlugin('low');
      const highPriority = new MockPlugin('high');
      const mediumPriority = new MockPlugin('medium');

      core.registerPlugin(lowPriority, { priority: 1 });
      core.registerPlugin(highPriority, { priority: 10 });
      core.registerPlugin(mediumPriority, { priority: 5 });

      // Verify they'll be initialized in priority order
      // (We'll verify actual order in init tests)
      expect(highPriority._priority).toBe(10);
      expect(mediumPriority._priority).toBe(5);
      expect(lowPriority._priority).toBe(1);
    });

    it('should store plugin-specific config', () => {
      const plugin = new MockPlugin('test-plugin');
      const config = { setting: 'value' };

      core.registerPlugin(plugin, { config });

      expect(plugin._config).toEqual(config);
    });
  });

  describe('plugin init() lifecycle', () => {
    it('should call init() on all registered plugins during start()', async () => {
      const plugin1 = new MockPlugin('plugin1');
      const plugin2 = new MockPlugin('plugin2');

      core.registerPlugin(plugin1);
      core.registerPlugin(plugin2);

      await core.init();

      expect(plugin1.initCalled).toBe(true);
      expect(plugin2.initCalled).toBe(true);
    });

    it('should pass core instance to plugin.init()', async () => {
      const plugin = new MockPlugin('test-plugin');

      core.registerPlugin(plugin);
      await core.init();

      expect(plugin.receivedCore).toBe(core);
    });

    it('should initialize plugins in priority order (highest first)', async () => {
      const initOrder: string[] = [];

      const plugin1 = new MockPlugin('low');
      plugin1.init = vi.fn(async () => { initOrder.push('low'); });

      const plugin2 = new MockPlugin('high');
      plugin2.init = vi.fn(async () => { initOrder.push('high'); });

      const plugin3 = new MockPlugin('medium');
      plugin3.init = vi.fn(async () => { initOrder.push('medium'); });

      core.registerPlugin(plugin1, { priority: 1 });
      core.registerPlugin(plugin2, { priority: 10 });
      core.registerPlugin(plugin3, { priority: 5 });

      await core.init();

      expect(initOrder).toEqual(['high', 'medium', 'low']);
    });

    it('should emit plugin:initialized event for each plugin', async () => {
      const eventSpy = vi.fn();
      core.eventBus.on('core:plugin:initialized', eventSpy);

      const plugin = new MockPlugin('test-plugin');
      core.registerPlugin(plugin);

      await core.init();

      expect(eventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: expect.objectContaining({
            pluginName: 'test-plugin'
          })
        })
      );
    });

    it('should handle plugins that fail to initialize', async () => {
      const failingPlugin = new FailingPlugin('init');
      core.registerPlugin(failingPlugin);

      await expect(core.init()).rejects.toThrow('Init failed intentionally');
    });
  });

  describe('plugin start() lifecycle', () => {
    it('should call start() on plugins that have it', async () => {
      const plugin = new MockPlugin('test-plugin');

      core.registerPlugin(plugin);
      await core.init();
      await core.start();

      expect(plugin.startCalled).toBe(true);
    });

    it('should not fail if plugin has no start() method', async () => {
      const minimalPlugin: INavigatorPlugin = {
        name: 'minimal',
        init: vi.fn()
      };

      core.registerPlugin(minimalPlugin);
      await core.init();

      await expect(core.start()).resolves.not.toThrow();
    });

    it('should emit plugin:started event for each plugin', async () => {
      const eventSpy = vi.fn();
      core.eventBus.on('core:plugin:started', eventSpy);

      const plugin = new MockPlugin('test-plugin');
      core.registerPlugin(plugin);

      await core.init();
      await core.start();

      expect(eventSpy).toHaveBeenCalled();
    });

    it('should handle plugins that fail to start', async () => {
      const failingPlugin = new FailingPlugin('start');
      core.registerPlugin(failingPlugin);

      await core.init();

      await expect(core.start()).rejects.toThrow('Start failed intentionally');
    });
  });

  describe('plugin stop() and destroy() lifecycle', () => {
    it('should call stop() in reverse order of initialization', async () => {
      const stopOrder: string[] = [];

      const plugin1 = new MockPlugin('first');
      plugin1.stop = vi.fn(async () => { stopOrder.push('first'); });

      const plugin2 = new MockPlugin('second');
      plugin2.stop = vi.fn(async () => { stopOrder.push('second'); });

      core.registerPlugin(plugin1);
      core.registerPlugin(plugin2);

      await core.init();
      await core.start();
      await core.stop();

      expect(stopOrder).toEqual(['second', 'first']); // Reverse order
    });

    it('should call destroy() in reverse order', async () => {
      const destroyOrder: string[] = [];

      const plugin1 = new MockPlugin('first');
      plugin1.destroy = vi.fn(async () => { destroyOrder.push('first'); });

      const plugin2 = new MockPlugin('second');
      plugin2.destroy = vi.fn(async () => { destroyOrder.push('second'); });

      core.registerPlugin(plugin1);
      core.registerPlugin(plugin2);

      await core.init();
      await core.destroy();

      expect(destroyOrder).toEqual(['second', 'first']); // Reverse order
    });

    it('should emit plugin:stopped event for each plugin', async () => {
      const eventSpy = vi.fn();
      core.eventBus.on('core:plugin:stopped', eventSpy);

      const plugin = new MockPlugin('test-plugin');
      core.registerPlugin(plugin);

      await core.init();
      await core.start();
      await core.stop();

      expect(eventSpy).toHaveBeenCalled();
    });

    it('should emit plugin:destroyed event for each plugin', async () => {
      const eventSpy = vi.fn();
      core.eventBus.on('core:plugin:destroyed', eventSpy);

      const plugin = new MockPlugin('test-plugin');
      core.registerPlugin(plugin);

      await core.init();
      await core.destroy();

      expect(eventSpy).toHaveBeenCalled();
    });

    it('should continue cleanup even if plugin destroy() fails', async () => {
      const failingPlugin = new FailingPlugin('destroy');
      const normalPlugin = new MockPlugin('normal');

      core.registerPlugin(failingPlugin);
      core.registerPlugin(normalPlugin);

      await core.init();

      // Should not throw - logs error but continues
      await expect(core.destroy()).resolves.not.toThrow();
      expect(normalPlugin.destroyCalled).toBe(true);
    });
  });

  describe('getPlugin()', () => {
    it('should return plugin instance by name', () => {
      const plugin = new MockPlugin('test-plugin');
      core.registerPlugin(plugin);

      const retrieved = core.getPlugin('test-plugin');

      expect(retrieved).toBe(plugin);
    });

    it('should return null for non-existent plugin', () => {
      const retrieved = core.getPlugin('nonexistent');

      expect(retrieved).toBeNull();
    });
  });

  describe('integration: core modules access from plugins', () => {
    it('should expose read-only EventBus instance to plugins', async () => {
      const plugin = new MockPlugin('test-plugin');
      
      plugin.init = async (core) => {
        expect(core.eventBus).toBeDefined();
        expect(typeof core.eventBus.emit).toBe('function');
        expect(typeof core.eventBus.on).toBe('function');
      };

      core.registerPlugin(plugin);
      await core.init();
    });

    it('should expose read-only AppState instance to plugins', async () => {
      const plugin = new MockPlugin('test-plugin');
      
      plugin.init = async (core) => {
        expect(core.state).toBeDefined();
        expect(typeof core.state.get).toBe('function');
        expect(typeof core.state.setState).toBe('function');
      };

      core.registerPlugin(plugin);
      await core.init();
    });

    it('should allow plugins to communicate via EventBus', async () => {
      const receivedEvents: any[] = [];

      const emitterPlugin: INavigatorPlugin = {
        name: 'emitter',
        init: async (core) => {
          core.eventBus.emit('test:event', { data: 'hello' });
        }
      };

      const listenerPlugin: INavigatorPlugin = {
        name: 'listener',
        init: async (core) => {
          core.eventBus.on('test:event', (event) => {
            receivedEvents.push(event.payload);
          });
        }
      };

      core.registerPlugin(listenerPlugin);
      core.registerPlugin(emitterPlugin);

      await core.init();

      expect(receivedEvents).toHaveLength(1);
      expect(receivedEvents[0]).toEqual({ data: 'hello' });
    });

    it('should allow plugins to read/write AppState', async () => {
      const plugin: INavigatorPlugin = {
        name: 'state-plugin',
        init: async (core) => {
          core.state.setState('plugins.test', { value: 42 });
        }
      };

      core.registerPlugin(plugin);
      await core.init();

      expect(core.state.get('plugins.test.value')).toBe(42);
    });
  });
});
