# @navigator.menu/pdk

**Plugin Development Kit for Navigator**

Utilities, types, mocks, and base classes for building Navigator plugins.

## 📦 Installation

```bash
npm install @navigator.menu/pdk
# or
pnpm add @navigator.menu/pdk
# or
yarn add @navigator.menu/pdk
```

## 🚀 Quick Start

### Creating a Plugin

```typescript
import { BasePlugin, NipValidator } from '@navigator.menu/pdk';

export class MyPlugin extends BasePlugin {
  constructor() {
    super('my-plugin');
  }

  async init() {
    // Setup plugin
    console.log('MyPlugin initialized!');
    
    // Emit NIP event
    const event = NipValidator.createEvent(
      'custom:my_event',
      this.name,
      { message: 'Hello from my plugin!' }
    );
    
    // Use event with EventBus (injected by Navigator Core)
  }

  async start() {
    console.log('MyPlugin started!');
  }

  async destroy() {
    console.log('MyPlugin destroyed!');
  }
}
```

### Using Utilities

```typescript
import { debounce, clamp, getProperty, setProperty } from '@navigator.menu/pdk/utils';

// Debounce function
const handleResize = debounce(() => {
  console.log('Resized!');
}, 300);

// Clamp values
const speed = clamp(velocity, 0, 100);

// Deep object access
const value = getProperty(config, 'ui.theme.colors.primary', '#000');
setProperty(config, 'ui.theme.colors.primary', '#00d4ff');
```

### Testing Plugins

```typescript
import { CoreMock, EventBusMock, AppStateMock } from '@navigator.menu/pdk/testing';
import { MyPlugin } from './MyPlugin';

describe('MyPlugin', () => {
  it('should initialize correctly', async () => {
    const core = new CoreMock();
    const plugin = new MyPlugin();
    
    core.registerPlugin(plugin);
    await core.init();
    
    expect(core.isInitialized()).toBe(true);
    expect(core.getPlugin('my-plugin')).toBe(plugin);
  });
  
  it('should emit events', async () => {
    const eventBus = new EventBusMock();
    
    eventBus.on('custom:my_event', (payload) => {
      console.log('Event received:', payload);
    });
    
    eventBus.emit('custom:my_event', { message: 'Test' });
    
    expect(eventBus.wasEmitted('custom:my_event')).toBe(true);
  });
});
```

## 📖 API Reference

### BasePlugin

Abstract base class for plugins with standard lifecycle methods.

**Methods:**
- `init()` - Initialize plugin (required, must implement)
- `start()` - Start plugin (optional)
- `stop()` - Stop plugin (optional)
- `destroy()` - Cleanup resources (optional)
- `setPriority(priority: number)` - Set plugin load priority
- `setConfig(config: object)` - Set plugin configuration
- `getConfig<T>(key: string, defaultValue?: T)` - Get config value

### NipValidator

Validate and create NIP v1.0 compliant events.

**Static Methods:**
- `validate(event: any)` - Validate event structure
- `createEvent<T>(type, source, payload, metadata?)` - Create valid NIP event

### Utilities (`@navigator.menu/pdk/utils`)

**Object Utilities:**
- `deepMerge<T>(target, ...sources)` - Deep merge objects
- `getProperty<T>(obj, path, defaultValue?)` - Get nested property
- `setProperty(obj, path, value)` - Set nested property

**Function Utilities:**
- `debounce<T>(func, wait)` - Debounce function calls
- `throttle<T>(func, limit)` - Throttle function calls
- `retry<T>(fn, options)` - Retry async function with backoff

**Math Utilities:**
- `clamp(value, min, max)` - Clamp number between min/max
- `lerp(start, end, t)` - Linear interpolation
- `mapRange(value, inMin, inMax, outMin, outMax)` - Map value between ranges
- `distance(x1, y1, x2, y2)` - Calculate distance between points

**Misc Utilities:**
- `createId(prefix?)` - Generate unique ID
- `wait(ms)` - Promise-based delay

### Testing Mocks (`@navigator.menu/pdk/testing`)

**CoreMock:**
- Full `INavigatorCore` implementation for testing
- Methods: `init()`, `start()`, `stop()`, `destroy()`, `registerPlugin()`, `getPlugin()`
- Test helpers: `isInitialized()`, `isStarted()`

**EventBusMock:**
- Full `IEventBus` implementation for testing
- Methods: `on()`, `off()`, `emit()`, `once()`, `clear()`, `getHistory()`
- Test helpers: `getListeners()`, `wasEmitted()`

**AppStateMock:**
- Full `IAppState` implementation for testing
- Methods: `get()`, `set()`, `watch()`, `getState()`, `reset()`

## 🧪 Testing Best Practices

1. **Use Mocks**: Always use `CoreMock`, `EventBusMock`, and `AppStateMock` for unit tests
2. **Test Lifecycle**: Verify all lifecycle methods (`init`, `start`, `stop`, `destroy`)
3. **Test Events**: Check that plugins emit correct NIP events
4. **Validate Events**: Use `NipValidator.validate()` to ensure event compliance
5. **Isolate Tests**: Reset mocks between tests using `.clear()` or `.reset()`

## 📚 Learn More

- [NIP Protocol Specification](../../NIP.md)
- [Plugin Development Guide](../../docs/PLUGIN_DEVELOPMENT.md)
- [Type Definitions](@navigator.menu/types)

## 📝 License

MIT
