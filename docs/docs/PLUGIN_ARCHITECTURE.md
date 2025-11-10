# Navigator v2.0 - Plugin Architecture Documentation

## 🎯 Overview

Navigator v2.0 introduces a revolutionary **Core & Plugin Architecture** that transforms the application from a monolithic system into a modular, event-driven ecosystem.

### Key Principles

1. **Zero Coupling**: Plugins don't know about each other
2. **Event-Driven**: All communication through events
3. **Framework-Agnostic**: Core has no DOM/input dependencies
4. **Plug & Play**: Easy to add/remove/replace plugins

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    NAVIGATOR CORE                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  EventBus    │  │   AppState   │  │   Plugins    │      │
│  │  (PubSub)    │  │   (Store)    │  │  (Registry)  │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
           │                    │                    │
           └────────────────────┴────────────────────┘
                               │
        ┌──────────────────────┼──────────────────────┐
        │                      │                      │
┌───────▼───────┐      ┌──────▼──────┐      ┌───────▼───────┐
│ INPUT PLUGINS │      │   LOGIC     │      │ OUTPUT PLUGINS│
│               │      │  PLUGINS    │      │               │
│ • Keyboard    │      │             │      │ • DomRenderer │
│ • Gesture     │─────▶│ Navigation  │─────▶│ • Audio       │
│ • Voice       │      │   Logic     │      │ • Effects     │
└───────────────┘      └─────────────┘      └───────────────┘
   (Raw Events)       (Intent Events)        (Visual/Audio)
```

---

## 📦 Core Components

### NavigatorCore (`js/core/NavigatorCore.js`)

The heart of the system. Manages:
- Plugin lifecycle (init → start → stop → destroy)
- Plugin registration and priority ordering
- System state (running, initialized)
- Performance monitoring

**Key Methods:**
```javascript
const core = new NavigatorCore({ debugMode: true });

// Register plugins
core.registerPlugin(new KeyboardInputPlugin(), { priority: 100 });

// Lifecycle
await core.init();    // Initialize all plugins
await core.start();   // Start all plugins
await core.stop();    // Pause all plugins
await core.destroy(); // Complete cleanup
```

### EventBus (`js/core/EventBus.js`)

Decoupled event system with:
- Type-safe event emission
- Wildcard subscriptions (`*`)
- Event history for debugging
- Middleware/interceptors
- Priority-based handlers

**Example:**
```javascript
// Subscribe
core.eventBus.on('intent:navigate_left', (event) => {
    console.log('Navigate left!', event.payload);
});

// Emit
core.eventBus.emit('intent:navigate_left', {
    source: 'KeyboardInput',
    timestamp: Date.now()
});

// Wildcard listener (all events)
core.eventBus.on('*', (event) => {
    console.log('Event:', event.name);
});
```

### AppState (`js/core/AppState.js`)

Centralized state management:
- Immutable state updates
- Automatic event emission on changes
- State history & time-travel
- Computed properties
- LocalStorage persistence

**Example:**
```javascript
// Get state
const currentLayer = core.state.get('navigation.currentLayer');

// Set state (deep merge)
core.state.setState('navigation.currentCardIndex', 2);

// Watch for changes
core.state.watch('navigation.currentLayer', (newValue) => {
    console.log('Layer changed to:', newValue);
});

// Time travel
core.state.timeTravel(5); // Go back 5 states
```

### BasePlugin (`js/core/BasePlugin.js`)

Abstract base class for all plugins:
```javascript
class MyPlugin extends BasePlugin {
    constructor() {
        super('MyPlugin', { /* config */ });
    }

    async onInit() {
        // Initialize resources
        this.on('some:event', this._handleEvent);
    }

    async onStart() {
        // Start processing
    }

    async onStop() {
        // Pause processing
    }

    async onDestroy() {
        // Cleanup (auto-unsubscribes events)
    }

    _handleEvent(event) {
        this.emit('my:response', { data: 'hello' });
    }
}
```

---

## 🔌 Plugin Types

### Input Plugins

Capture raw input and emit events. **No navigation logic!**

#### KeyboardInputPlugin
```javascript
// Emits:
- input:keyboard:keydown
- input:keyboard:keyup
- input:keyboard:combo (e.g., "Ctrl+d")
```

#### GestureInputPlugin
```javascript
// Emits:
- input:gesture:hand_detected
- input:gesture:hand_lost
- input:gesture:swipe_left/right/up/down
- input:gesture:pinch
- input:gesture:fist
- input:gesture:point
```

### Logic Plugins

Translate raw inputs into high-level intents.

#### NavigationLogicPlugin
```javascript
// Listens to:
- input:keyboard:keydown
- input:gesture:swipe_*

// Emits:
- intent:navigate_left/right/up/down
- intent:select_card
- intent:toggle_fullscreen
- intent:go_back
```

### Output Plugins

React to intents and update the UI/audio/effects.

#### DomRendererPlugin
```javascript
// Listens to:
- intent:navigate_left/right/up/down
- intent:select_card

// Emits:
- renderer:card_changed
- renderer:layer_changed
- renderer:card_selected
```

#### AudioFeedbackPlugin
```javascript
// Listens to:
- intent:navigate_*
- renderer:card_changed
- system:error

// Actions:
- Plays spatial audio
- Direction-based panning
```

#### VisualEffectsPlugin
```javascript
// Listens to:
- renderer:card_changed
- renderer:layer_changed
- input:gesture:swipe_*

// Actions:
- Light beams
- Particle effects
- Card blur
- LED indicators
```

---

## 🎮 Usage Examples

### Basic Setup

```javascript
import { NavigatorCore } from './core/NavigatorCore.js';
import { KeyboardInputPlugin } from './plugins/input/KeyboardInputPlugin.js';
import { NavigationLogicPlugin } from './plugins/logic/NavigationLogicPlugin.js';
import { DomRendererPlugin } from './plugins/output/DomRendererPlugin.js';

const core = new NavigatorCore({ debugMode: true });

// Register plugins in priority order
core.registerPlugin(new KeyboardInputPlugin(), { priority: 100 });
core.registerPlugin(new NavigationLogicPlugin(), { priority: 50 });
core.registerPlugin(new DomRendererPlugin(), { priority: 10 });

// Start the system
await core.init();
await core.start();
```

### Keyboard-Only Build

```javascript
// No gesture input needed!
const core = new NavigatorCore();

core.registerPlugin(new KeyboardInputPlugin());
core.registerPlugin(new NavigationLogicPlugin());
core.registerPlugin(new DomRendererPlugin());
core.registerPlugin(new AudioFeedbackPlugin());

await core.init();
await core.start();
```

### Custom Plugin Example

```javascript
class ThreeJsRendererPlugin extends BasePlugin {
    constructor() {
        super('ThreeJsRenderer', {});
        this.scene = null;
        this.camera = null;
        this.renderer = null;
    }

    async onInit() {
        // Setup Three.js
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer();

        // Listen to navigation intents
        this.on('intent:navigate_left', () => {
            this._rotateScene(-Math.PI / 4);
        });

        this.on('intent:navigate_right', () => {
            this._rotateScene(Math.PI / 4);
        });
    }

    _rotateScene(angle) {
        // Rotate 3D scene instead of DOM cards
        this.scene.rotation.y += angle;
    }
}

// Use it!
core.registerPlugin(new ThreeJsRendererPlugin());
```

---

## 📝 Configuration

### YAML Configuration (`config.yaml`)

The system still uses `config.yaml` for centralized configuration:

```yaml
# Plugin-specific configuration
plugins:
  KeyboardInput:
    enabled: true
    preventDefaults: true
  
  GestureInput:
    enabled: true
    camera:
      width: 640
      height: 480
  
  AudioFeedback:
    masterVolume: 0.3
    spatial:
      enabled: true
```

### Per-Plugin Config

```javascript
core.registerPlugin(new MyPlugin(), {
    priority: 75,
    config: {
        customSetting: 'value'
    }
});

// In plugin:
this.getConfig('customSetting'); // 'value'
```

---

## 🔍 Debugging

### Event History

```javascript
// Get all events
const history = core.eventBus.getHistory();

// Get specific event
const navEvents = core.eventBus.getHistory('intent:navigate_left');

// Event statistics
const stats = core.eventBus.getStats();
console.log(stats.topEvents); // Most frequent events
```

### State Time-Travel

```javascript
// Undo last 3 state changes
core.state.timeTravel(3);

// View state history
const history = core.state.getHistory(10);
```

### Performance Stats

```javascript
const stats = core.getStats();
console.log(stats);
// {
//   uptime: 12345,
//   plugins: { total: 6, byState: {...} },
//   events: { totalEvents: 1234, topEvents: [...] }
// }
```

---

## 🚀 Migration from v1

### Old Way (v1 - Monolithic)

```javascript
import { GestureDetector } from './GestureDetector.js';
import { NavigationController } from './NavigationController.js';
import { AudioManager } from './AudioManager.js';

const gestureDetector = new GestureDetector();
const navController = new NavigationController();
const audioManager = new AudioManager();

// Tight coupling!
gestureDetector.onSwipeLeft = () => {
    navController.previousCard();
    audioManager.playNavigationSound();
};
```

### New Way (v2 - Modular)

```javascript
import { NavigatorCore } from './core/NavigatorCore.js';
import { GestureInputPlugin } from './plugins/input/GestureInputPlugin.js';
import { NavigationLogicPlugin } from './plugins/logic/NavigationLogicPlugin.js';
import { DomRendererPlugin } from './plugins/output/DomRendererPlugin.js';
import { AudioFeedbackPlugin } from './plugins/output/AudioFeedbackPlugin.js';

const core = new NavigatorCore();

// Zero coupling! Events connect them
core.registerPlugin(new GestureInputPlugin());
core.registerPlugin(new NavigationLogicPlugin());
core.registerPlugin(new DomRendererPlugin());
core.registerPlugin(new AudioFeedbackPlugin());

await core.init();
await core.start();
```

### Event Flow Comparison

**v1 (Direct Calls):**
```
GestureDetector → NavigationController.previousCard()
                → AudioManager.playSound()
                → LayerManager.updateDOM()
```

**v2 (Event-Driven):**
```
GestureInputPlugin
  ↓ emit('input:gesture:swipe_left')
NavigationLogicPlugin
  ↓ emit('intent:navigate_left')
DomRendererPlugin (listens, updates DOM)
AudioFeedbackPlugin (listens, plays sound)
```

---

## 🎯 Benefits

### 1. **Testability**
Each plugin can be tested in isolation:
```javascript
const plugin = new NavigationLogicPlugin();
await plugin.init(mockCore);

mockCore.eventBus.emit('input:keyboard:keydown', { key: 'ArrowLeft' });
// Verify 'intent:navigate_left' was emitted
```

### 2. **Flexibility**
Replace any plugin without touching others:
```javascript
// Swap DOM renderer for Canvas renderer
core.unregisterPlugin('DomRenderer');
core.registerPlugin(new CanvasRendererPlugin());
```

### 3. **Performance**
Disable expensive plugins:
```javascript
// Low-end devices: disable effects
if (lowEndDevice) {
    core.registerPlugin(new VisualEffectsPlugin(), {
        config: { enabled: false }
    });
}
```

### 4. **Extensibility**
Add new features without modifying core:
```javascript
// Add haptic feedback without touching existing code
class HapticFeedbackPlugin extends BasePlugin {
    async onInit() {
        this.on('intent:navigate_left', () => {
            navigator.vibrate(50);
        });
    }
}
```

---

## 📚 File Structure

```
js/
├── core/
│   ├── NavigatorCore.js      # Core engine
│   ├── EventBus.js            # Event system
│   ├── AppState.js            # State management
│   └── BasePlugin.js          # Plugin base class
│
├── plugins/
│   ├── input/
│   │   ├── KeyboardInputPlugin.js
│   │   ├── GestureInputPlugin.js
│   │   └── VoiceInputPlugin.js (TODO)
│   │
│   ├── logic/
│   │   └── NavigationLogicPlugin.js
│   │
│   └── output/
│       ├── DomRendererPlugin.js
│       ├── AudioFeedbackPlugin.js
│       └── VisualEffectsPlugin.js
│
├── main-navigator-v2.js      # New entry point
│
└── [legacy files]             # Still used by plugins
    ├── GestureDetector.js
    ├── AudioManager.js
    ├── LayerManager.js
    ├── VisualEffects.js
    └── ...
```

---

## 🔄 Legacy Files Usage

These legacy files are **still used** but now **wrapped by plugins**:

- `GestureDetector.js` → Used by `GestureInputPlugin`
- `AudioManager.js` → Used by `AudioFeedbackPlugin`
- `LayerManager.js` → Used by `DomRendererPlugin`
- `VisualEffects.js` → Used by `VisualEffectsPlugin`
- `LightBeamSystem.js` → Used by `VisualEffectsPlugin`
- `ConfigLoader.js` → Used by `main-navigator-v2.js`

---

## 🎓 Next Steps

1. **Use v2 in Production**: Update `index.html` to load `main-navigator-v2.js`
2. **Create Custom Plugins**: Build your own input/output plugins
3. **Deprecate v1**: Phase out `main-init.js` after testing
4. **Add Tests**: Write plugin-specific unit tests
5. **Document Events**: Create event catalog for all event types

---

## 🌟 Conclusion

Navigator v2.0's Core & Plugin Architecture is a **game-changer**:

✅ **Fully Decoupled** - No plugin knows about others  
✅ **Event-Driven** - Clean communication via events  
✅ **Framework-Agnostic** - Core has zero DOM/input dependencies  
✅ **Extensible** - Add features without modifying core  
✅ **Testable** - Isolate and test each plugin  
✅ **Flexible** - Mix and match plugins for any use case  

**This is the future of Navigator!** 🚀
