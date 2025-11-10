---
sidebar_position: 3
---

# Core Concepts

Understanding Navigator's architecture and design patterns.

## Architecture Overview

Navigator is built on three core principles:

1. **Plugin-Based Architecture** - Extensible by design
2. **Event-Driven Communication** - Decoupled components
3. **Centralized State** - Predictable state management

```
┌─────────────────────────────────────────────────┐
│              Navigator Core                      │
│  ┌──────────────┐  ┌──────────────┐            │
│  │  Event Bus   │  │  App State   │            │
│  └──────────────┘  └──────────────┘            │
│  ┌──────────────────────────────────────┐      │
│  │      Configuration Loader             │      │
│  └──────────────────────────────────────┘      │
└─────────────────────────────────────────────────┘
                      │
        ┌─────────────┼─────────────┐
        │             │             │
┌───────▼──────┐ ┌───▼────────┐ ┌──▼────────────┐
│ Input Plugins│ │Output Plug.│ │ Core Modules  │
│              │ │            │ │               │
│ - Keyboard   │ │ - Audio    │ │ - Navigation  │
│ - Gesture    │ │ - Visual   │ │ - LOD Manager │
│ - Voice      │ │ - HUD      │ │ - History     │
│ - Custom...  │ │ - Custom...│ │               │
└──────────────┘ └────────────┘ └───────────────┘
```

## Plugin Architecture

Navigator uses a modular plugin system that separates concerns and enables extensibility.

### Plugin Types

#### 1. Input Plugins
Handle user input from various sources:

```javascript
class KeyboardPlugin extends BasePlugin {
    constructor() {
        super('keyboard');
    }

    onInit() {
        document.addEventListener('keydown', this.handleKey.bind(this));
    }

    handleKey(event) {
        if (event.key === 'ArrowRight') {
            this.emit('navigate:next');
        }
    }
}
```

**Built-in Input Plugins:**
- `KeyboardPlugin` - Keyboard navigation
- `GesturePlugin` - MediaPipe hand tracking
- `VoicePlugin` - Speech recognition

#### 2. Output Plugins
Respond to navigation events:

```javascript
class AudioPlugin extends BasePlugin {
    constructor() {
        super('audio');
    }

    onInit() {
        this.on('navigate:next', this.playNavigationSound);
    }

    playNavigationSound() {
        // Play spatial audio feedback
        this.audioContext.playSound('navigation');
    }
}
```

**Built-in Output Plugins:**
- `AudioManager` - Spatial audio feedback
- `LightBeamSystem` - Visual effects
- `AdaptiveNavigationHUD` - UI feedback

#### 3. Plugin Lifecycle

```javascript
class MyPlugin extends BasePlugin {
    // Called when plugin is registered
    onInit() {
        console.log('Plugin initialized');
    }

    // Called when navigator starts
    onStart() {
        this.setupResources();
    }

    // Called when configuration changes
    onConfigUpdate(config) {
        this.applyConfig(config);
    }

    // Called when navigator stops
    onStop() {
        this.cleanup();
    }

    // Called when plugin is destroyed
    onDestroy() {
        this.removeListeners();
    }
}
```

## Event Bus

The Event Bus enables loose coupling between components.

### Publishing Events

```javascript
// From any component
this.emit('navigate:next', { layer: 'videos', index: 2 });
```

### Subscribing to Events

```javascript
// In your plugin or component
this.on('navigate:next', (data) => {
    console.log(`Navigating to ${data.layer}:${data.index}`);
});
```

### Event Naming Convention

Events follow a hierarchical naming pattern:

```
<domain>:<action>:<detail>
```

Examples:
- `navigate:next` - Navigate to next card
- `navigate:layer:change` - Change layer
- `gesture:detected` - Gesture detected
- `voice:command:next` - Voice command received
- `state:update:position` - Position state updated

### Core Events

| Event | Payload | Description |
|-------|---------|-------------|
| `navigate:next` | `{ layer, index }` | Navigate to next card |
| `navigate:prev` | `{ layer, index }` | Navigate to previous card |
| `layer:change` | `{ from, to }` | Layer changed |
| `card:focus` | `{ card }` | Card focused |
| `gesture:detected` | `{ type, confidence }` | Gesture detected |
| `voice:command` | `{ command, transcript }` | Voice command |
| `state:update` | `{ key, value }` | State updated |

## State Management

Navigator uses a centralized state management system (AppState) for predictable state updates.

### AppState Structure

```javascript
{
  navigation: {
    currentLayer: 'videos',
    currentIndex: 0,
    totalCards: 10,
    history: []
  },
  input: {
    keyboardEnabled: true,
    gestureEnabled: true,
    voiceEnabled: false
  },
  adaptive: {
    level: 1,
    score: 0,
    unlocked: ['basic']
  },
  errors: []
}
```

### Reading State

```javascript
import { appState } from './AppState.js';

// Get current layer
const layer = appState.get('navigation.currentLayer');

// Get entire navigation state
const navState = appState.get('navigation');
```

### Updating State

```javascript
// Update single value
appState.set('navigation.currentIndex', 5);

// Update multiple values
appState.set({
    'navigation.currentIndex': 5,
    'navigation.currentLayer': 'news'
});

// Update with merge
appState.merge('navigation', {
    currentIndex: 5,
    totalCards: 12
});
```

### Observing State Changes

```javascript
// Watch specific key
const unsubscribe = appState.on('navigation.currentIndex', (value) => {
    console.log('Index changed to:', value);
});

// Watch entire subtree
appState.on('navigation', (navState) => {
    console.log('Navigation state updated:', navState);
});

// Unsubscribe when done
unsubscribe();
```

## Configuration System

Navigator uses YAML-based configuration with hot-reload support.

### Configuration File

`config.yaml`:
```yaml
navigator:
  version: "2.0"

  layers:
    - id: "videos"
      name: "Videos"
      cards:
        - title: "Welcome"
          type: "video"
          mediaUrl: "video.mp4"

  plugins:
    keyboard:
      enabled: true
      keys:
        next: ["ArrowRight", "KeyD"]
        prev: ["ArrowLeft", "KeyA"]

    gesture:
      enabled: true
      confidence: 0.7
      smoothing: 3

    voice:
      enabled: true
      language: "en-US"
      commands:
        next: ["next", "forward"]
        prev: ["back", "previous"]
```

### Loading Configuration

```javascript
import { ConfigLoader } from './core/ConfigLoader.js';

const config = await ConfigLoader.load('config.yaml');

// Access configuration
const layers = config.layers;
const pluginConfig = config.plugins.keyboard;
```

### Hot Reload

Configuration changes are automatically detected and applied:

```javascript
ConfigLoader.onChange((newConfig) => {
    console.log('Configuration updated!');
    navigator.applyConfig(newConfig);
});
```

## Core Modules

### Navigation Manager

Handles card and layer navigation:

```javascript
// Navigate to next card
navigator.next();

// Navigate to previous card
navigator.prev();

// Change layer
navigator.setLayer('news');

// Go to specific card
navigator.goToCard(5);
```

### LOD (Level of Detail) Manager

Optimizes performance by managing visibility:

```javascript
// Set current visible card
lodManager.setFocusedCard(cardElement);

// Cards are automatically:
// - Visible: Current card (full detail)
// - Adjacent: ±1 cards (medium detail)
// - Hidden: Other cards (minimal detail)
```

### History Manager

Tracks navigation history:

```javascript
// Add to history
history.add({
    action: 'next',
    layer: 'videos',
    timestamp: Date.now()
});

// Get recent history
const recent = history.getRecent(5);

// Undo last action
history.undo();
```

## Best Practices

### 1. Use Event Bus for Communication

```javascript
// ❌ Bad: Direct coupling
keyboardPlugin.navigation.next();

// ✅ Good: Event-driven
this.emit('navigate:next');
```

### 2. Access State via AppState

```javascript
// ❌ Bad: Local state
this.currentIndex = 5;

// ✅ Good: Centralized state
appState.set('navigation.currentIndex', 5);
```

### 3. Follow Plugin Lifecycle

```javascript
// ✅ Initialize in onInit()
onInit() {
    this.setupEventListeners();
}

// ✅ Cleanup in onDestroy()
onDestroy() {
    this.removeEventListeners();
}
```

### 4. Handle Errors Gracefully

```javascript
try {
    await this.performAction();
} catch (error) {
    errorHandler.report(error, {
        context: 'MyPlugin',
        action: 'performAction'
    });
}
```

## Next Steps

- [Architecture Deep Dive](./architecture) - Detailed architecture documentation
- [Event Bus Reference](./event-bus) - Complete event reference
- [State Management Guide](./state-management) - Advanced state patterns
- [Build a Plugin](./plugin-development/getting-started) - Create your own plugin

---

Ready to build your own plugin? Continue to [Plugin Development](./plugin-development/getting-started).
