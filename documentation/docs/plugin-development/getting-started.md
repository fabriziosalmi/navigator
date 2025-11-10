---
sidebar_position: 1
---

# Plugin Development - Getting Started

Learn how to extend Navigator with custom plugins.

## Why Build a Plugin?

Navigator's plugin system allows you to:

- 🎮 **Add Input Methods** - VR controllers, gamepads, eye tracking, etc.
- 🎨 **Create Visual Effects** - Custom animations, overlays, themes
- 🔊 **Integrate Audio** - Spatial audio, music, sound effects
- 🌐 **Connect External Services** - APIs, IoT devices, smart home
- 🧩 **Extend Functionality** - Analytics, logging, debugging tools

## Plugin Architecture

Every plugin extends the `BasePlugin` class:

```javascript
import { BasePlugin } from '@navigator/core';

class MyPlugin extends BasePlugin {
    constructor() {
        super('my-plugin');  // Unique plugin ID
    }

    // Lifecycle hooks
    onInit() { /* Setup */ }
    onStart() { /* Start */ }
    onStop() { /* Pause */ }
    onDestroy() { /* Cleanup */ }
}
```

## Your First Plugin

Let's create a simple plugin that logs navigation events.

### 1. Create Plugin File

`plugins/LoggerPlugin.js`:

```javascript
import { BasePlugin } from '../core/BasePlugin.js';

export class LoggerPlugin extends BasePlugin {
    constructor() {
        super('logger');
        this.logs = [];
    }

    onInit() {
        // Subscribe to navigation events
        this.on('navigate:next', this.logNavigation);
        this.on('navigate:prev', this.logNavigation);
        this.on('layer:change', this.logLayerChange);

        console.log('[LoggerPlugin] Initialized');
    }

    logNavigation(data) {
        const log = {
            type: 'navigation',
            timestamp: Date.now(),
            data
        };
        this.logs.push(log);
        console.log('[LoggerPlugin] Navigation:', data);
    }

    logLayerChange(data) {
        const log = {
            type: 'layer_change',
            timestamp: Date.now(),
            data
        };
        this.logs.push(log);
        console.log('[LoggerPlugin] Layer changed:', data);
    }

    getLogs() {
        return this.logs;
    }

    clearLogs() {
        this.logs = [];
    }

    onDestroy() {
        console.log('[LoggerPlugin] Destroyed. Total logs:', this.logs.length);
    }
}
```

### 2. Register Plugin

`main-init.js`:

```javascript
import { LoggerPlugin } from './plugins/LoggerPlugin.js';

// Initialize navigator
const navigator = new Navigator();

// Register custom plugin
const loggerPlugin = new LoggerPlugin();
navigator.registerPlugin(loggerPlugin);

// Start navigator
navigator.start();
```

### 3. Configure Plugin

`config.yaml`:

```yaml
plugins:
  logger:
    enabled: true
    maxLogs: 1000
    logToConsole: true
```

### 4. Use Plugin

```javascript
// Get logs programmatically
const logger = navigator.getPlugin('logger');
const recentLogs = logger.getLogs().slice(-10);

// Clear logs
logger.clearLogs();
```

## Plugin Types

### Input Plugins

Handle user input and emit navigation events.

**Example: Gamepad Plugin**

```javascript
class GamepadPlugin extends BasePlugin {
    constructor() {
        super('gamepad');
        this.gamepadIndex = null;
    }

    onInit() {
        window.addEventListener('gamepadconnected', this.onGamepadConnect.bind(this));
        this.startPolling();
    }

    onGamepadConnect(event) {
        this.gamepadIndex = event.gamepad.index;
        console.log('Gamepad connected:', event.gamepad.id);
    }

    startPolling() {
        setInterval(() => {
            if (this.gamepadIndex === null) {
                return;
            }

            const gamepad = navigator.getGamepads()[this.gamepadIndex];
            if (!gamepad) {
                return;
            }

            // Check button presses
            if (gamepad.buttons[0].pressed) {
                this.emit('navigate:next');
            }

            // Check joystick movement
            const axis0 = gamepad.axes[0];
            if (axis0 > 0.5) {
                this.emit('navigate:next');
            } else if (axis0 < -0.5) {
                this.emit('navigate:prev');
            }
        }, 100);
    }
}
```

### Output Plugins

Respond to navigation events with visual/audio feedback.

**Example: Vibration Feedback Plugin**

```javascript
class VibrationPlugin extends BasePlugin {
    constructor() {
        super('vibration');
    }

    onInit() {
        this.on('navigate:next', () => this.vibrate([50]));
        this.on('navigate:prev', () => this.vibrate([50]));
        this.on('layer:change', () => this.vibrate([100, 50, 100]));
    }

    vibrate(pattern) {
        if ('vibrate' in navigator) {
            navigator.vibrate(pattern);
        }
    }
}
```

### Service Plugins

Provide utility functions to other plugins.

**Example: Analytics Plugin**

```javascript
class AnalyticsPlugin extends BasePlugin {
    constructor(apiKey) {
        super('analytics');
        this.apiKey = apiKey;
        this.events = [];
    }

    onInit() {
        // Track all navigation events
        this.on('navigate:*', (data) => {
            this.track('navigation', data);
        });

        // Flush events every 30 seconds
        setInterval(() => this.flush(), 30000);
    }

    track(event, data) {
        this.events.push({
            event,
            data,
            timestamp: Date.now()
        });
    }

    async flush() {
        if (this.events.length === 0) {
            return;
        }

        try {
            await fetch('https://api.analytics.com/events', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'API-Key': this.apiKey
                },
                body: JSON.stringify(this.events)
            });

            this.events = [];
        } catch (error) {
            console.error('Failed to flush analytics:', error);
        }
    }
}
```

## Plugin API Reference

### BasePlugin Class

```javascript
class BasePlugin {
    constructor(id: string)

    // Lifecycle methods (override these)
    onInit(): void
    onStart(): void
    onStop(): void
    onDestroy(): void
    onConfigUpdate(config: object): void

    // Event Bus methods
    emit(event: string, data?: any): void
    on(event: string, handler: Function): Function
    once(event: string, handler: Function): Function
    off(event: string, handler?: Function): void

    // State management
    getState(key: string): any
    setState(key: string, value: any): void

    // Configuration
    getConfig(): object
    updateConfig(config: object): void
}
```

### Event Bus Patterns

```javascript
// Subscribe to specific event
this.on('navigate:next', handler);

// Subscribe to all navigation events
this.on('navigate:*', handler);

// Subscribe to all events
this.on('*', handler);

// Subscribe once
this.once('navigate:next', handler);

// Unsubscribe
const unsubscribe = this.on('navigate:next', handler);
unsubscribe();

// Emit event
this.emit('custom:event', { data: 'value' });
```

## Best Practices

### 1. Clean Resource Management

```javascript
class MyPlugin extends BasePlugin {
    onInit() {
        this.interval = setInterval(this.poll.bind(this), 1000);
        this.listeners = [];
    }

    onDestroy() {
        // Clean up interval
        clearInterval(this.interval);

        // Remove event listeners
        this.listeners.forEach(unsub => unsub());
    }
}
```

### 2. Error Handling

```javascript
async onInit() {
    try {
        await this.connect();
    } catch (error) {
        errorHandler.report(error, {
            plugin: this.id,
            action: 'init'
        });

        // Graceful degradation
        this.enabled = false;
    }
}
```

### 3. Configuration Validation

```javascript
onConfigUpdate(config) {
    // Validate configuration
    if (!config.apiKey) {
        console.warn('[MyPlugin] Missing API key');
        return;
    }

    if (config.maxRetries < 1) {
        console.warn('[MyPlugin] Invalid maxRetries, using default');
        config.maxRetries = 3;
    }

    this.config = config;
}
```

### 4. Performance Optimization

```javascript
class MyPlugin extends BasePlugin {
    onInit() {
        // Throttle expensive operations
        this.on('mousemove', this.throttle(this.handleMove, 100));

        // Debounce user input
        this.on('input', this.debounce(this.handleInput, 300));
    }

    throttle(fn, delay) {
        let lastCall = 0;
        return (...args) => {
            const now = Date.now();
            if (now - lastCall >= delay) {
                lastCall = now;
                fn(...args);
            }
        };
    }

    debounce(fn, delay) {
        let timeout;
        return (...args) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => fn(...args), delay);
        };
    }
}
```

## Next Steps

### Tutorials

- [Input Plugin Tutorial](./input-plugin-tutorial) - Build a VR controller plugin
- [Output Plugin Tutorial](./output-plugin-tutorial) - Build a Philips Hue integration

### Examples

- [Gamepad Plugin](./examples/gamepad) - Complete gamepad integration
- [MQTT Plugin](./examples/mqtt) - IoT device communication
- [WebSocket Plugin](./examples/websocket) - Real-time multiplayer

### Reference

- [Plugin API](./plugin-api) - Complete API reference
- [Event Reference](./event-reference) - All available events
- [Configuration Schema](./config-schema) - Plugin configuration options

---

Ready to build? Start with the [Input Plugin Tutorial](./input-plugin-tutorial).
