# Navigator v3.0+ - Plugin Architecture Documentation

## Overview

Navigator v3.0+ uses a **Core & Plugin Architecture** with a **Redux-like Store** that provides a predictable, unidirectional data flow system.

### Key Principles

1. **Zero Coupling**: Plugins don't know about each other
2. **Unidirectional Data Flow**: All state changes through Store actions (v3.0+)
3. **Framework-Agnostic**: Core has no DOM/input dependencies
4. **Plug & Play**: Easy to add/remove/replace plugins

> **⚠️ IMPORTANT**: EventBus and AppState are **DEPRECATED** since v3.0 and will be removed in v4.0. Use the Store for all state management.

---

## 🏗️ Architecture Overview (v3.0+)

```
┌─────────────────────────────────────────────────────────────┐
│                    NAVIGATOR CORE                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │    Store     │  │   Plugins    │  │  Middleware  │      │
│  │ (Redux-like) │  │  (Registry)  │  │   Pipeline   │      │
│  │   PRIMARY    │  │              │  │              │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                               │
│  ┌──────────────┐  ┌──────────────┐                        │
│  │  EventBus*   │  │  AppState*   │  *DEPRECATED (v4.0)   │
│  │ (@deprecated)│  │ (@deprecated)│                        │
│  └──────────────┘  └──────────────┘                        │
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
│ • Gesture     │─────▶│ Dispatch    │─────▶│ • Audio       │
│ • Voice       │      │  Actions    │      │ • Effects     │
└───────────────┘      └─────────────┘      └───────────────┘
  (Raw Input)         (Store Actions)       (Subscribe to State)
```

---

## 📦 Core Components

### NavigatorCore (`packages/core/src/NavigatorCore.ts`)

The heart of the system. Manages:
- Plugin lifecycle (init → start → stop → destroy)
- Plugin registration and priority ordering
- Store initialization and middleware setup (v3.0+)
- System state (running, initialized)
- Performance monitoring

**Key Methods:**
```typescript
const core = new NavigatorCore({ debugMode: true });

// Register plugins
core.registerPlugin('keyboard', new KeyboardInputPlugin(), { priority: 100 });

// Lifecycle
await core.init();    // Initialize all plugins
await core.start();   // Start all plugins
await core.stop();    // Pause all plugins
await core.destroy(); // Complete cleanup

// Access Store (v3.0+) - PRIMARY
const state = core.store.getState();
core.store.dispatch(navigate({ currentCard: 2 }));
core.store.subscribe((state) => { /* handle state change */ });
```

### Store (`packages/core/src/store/`) - **PRIMARY (v3.0+)**

Redux-like unidirectional data flow:
- Single source of truth
- Immutable state updates
- Action-based state changes
- Middleware pipeline
- Time-travel debugging

**Example:**
```typescript
// Dispatch an action
core.store.dispatch({
  type: 'navigation/NAVIGATE',
  payload: { currentCard: 2, direction: 'right' }
});

// Subscribe to state changes
const unsubscribe = core.store.subscribe((state) => {
  console.log('Navigation state:', state.navigation);
  updateUI(state);
});

// Get current state
const currentState = core.store.getState();
console.log('Current card:', currentState.navigation.currentCard);
```

**For details**, see [Architecture Documentation](/architecture#the-unidirectional-data-flow-architecture-v30).

---

## DEPRECATED Components (Removed in v4.0)

### EventBus (`packages/core/src/EventBus.ts`) - **@deprecated**

> **WARNING**: EventBus is deprecated since v3.0 and will be removed in v4.0. Use `store.subscribe()` and `store.dispatch()` instead.

Legacy decoupled event system (maintained for backward compatibility):

**Migration Example:**
```typescript
// ❌ Old (EventBus - DEPRECATED)
core.eventBus.on('intent:navigate_left', (event) => {
  console.log('Navigate left!', event.payload);
});
core.eventBus.emit('intent:navigate_left', { source: 'KeyboardInput' });

// ✅ New (Store - v3.0+)
core.store.subscribe((state) => {
  if (state.navigation.direction === 'left') {
    console.log('Navigated left!');
  }
});
core.store.dispatch(navigate({ direction: 'left', source: 'keyboard' }));
```

### AppState (`packages/core/src/AppState.ts`) - **@deprecated**

> **WARNING**: AppState is deprecated since v3.0 and will be removed in v4.0. Use `store.getState()` and `store.dispatch()` instead.

Legacy centralized state management (maintained for backward compatibility):

**Migration Example:**
```typescript
// ❌ Old (AppState - DEPRECATED)
const currentLayer = core.state.get('navigation.currentLayer');
core.state.setState('navigation.currentCardIndex', 2);
core.state.watch('navigation.currentLayer', (newValue) => {
  console.log('Layer changed:', newValue);
});

// ✅ New (Store - v3.0+)
const currentLayer = core.store.getState().navigation.currentLayer;
core.store.dispatch(navigate({ currentCard: 2 }));
core.store.subscribe((state) => {
  console.log('Layer changed:', state.navigation.currentLayer);
});
```

**Migration Guide**: See [Legacy EventBus Migration Plan](https://github.com/fabriziosalmi/navigator/blob/main/project-docs/research/technical-debt/LEGACY_EVENTBUS_MIGRATION.md)

---
---

## Plugin Interface

All plugins must implement the `INavigatorPlugin` interface:

```typescript
interface INavigatorPlugin {
  readonly name: string
  readonly version: string
  _priority?: number
  
  init?(core: NavigatorCore): Promise<void> | void
  start?(core: NavigatorCore): Promise<void> | void
  stop?(): Promise<void> | void
  destroy?(): Promise<void> | void
}
```

### Example Plugin (v3.0+)

```typescript
import { INavigatorPlugin, NavigatorCore } from '@navigator.menu/core';
import { navigate } from '@navigator.menu/core/actions';

class MyPlugin implements INavigatorPlugin {
  name = 'MyPlugin';
  version = '1.0.0';
  _priority = 100;
  
  private core?: NavigatorCore;
  private unsubscribe?: () => void;

  async init(core: NavigatorCore): Promise<void> {
    this.core = core;
    
    // Subscribe to Store state changes (v3.0+)
    this.unsubscribe = core.store.subscribe((state) => {
      console.log('State changed:', state.navigation.currentCard);
    });
  }

  async start(): Promise<void> {
    // Dispatch an action to the Store (v3.0+)
    this.core?.store.dispatch(navigate({
      currentCard: 0,
      direction: 'right',
      source: 'MyPlugin'
    }));
  }

  async stop(): Promise<void> {
    // Pause processing
  }

  async destroy(): Promise<void> {
    // Cleanup
    this.unsubscribe?.();
  }
}
```

---

## Plugin Types

### Input Plugins

Capture raw input and dispatch actions. **No navigation logic!**

#### KeyboardPlugin (`@navigator.menu/plugin-keyboard`)
```typescript
// Dispatches actions (v3.0+):
core.store.dispatch(keyPressed({ key: 'ArrowLeft', timestamp: Date.now() }));
core.store.dispatch(select({ source: 'keyboard' }));
core.store.dispatch(cancel({ source: 'keyboard' }));
```

**Legacy (deprecated)**:
```typescript
// Old: emitted events
core.eventBus.emit('input:keyboard:keydown', { key: 'ArrowLeft' });
```

#### GesturePlugin (v3.0+)
```typescript
// Dispatches actions (v3.0+):
core.store.dispatch(gestureDetected({ 
  type: 'swipe', 
  direction: 'left',
  confidence: 0.95 
}));
```

### Output Plugins

Subscribe to Store state and update UI/audio/effects.

#### DomRendererPlugin (`@navigator.menu/plugin-dom-renderer`)
```typescript
// Subscribes to Store (v3.0+):
core.store.subscribe((state) => {
  if (state.cognitive.state === 'frustrated') {
    updateCognitiveHUD('frustrated');
  }
});
```

**Legacy (deprecated)**:
```typescript
// Old: listened to events
core.eventBus.on('intent:navigate_left', () => { /* update UI */ });
```

---

## Usage Examples

### Basic Setup (v3.0+)

```typescript
import { NavigatorCore } from '@navigator.menu/core';
import { KeyboardPlugin } from '@navigator.menu/plugin-keyboard';
import { DomRendererPlugin } from '@navigator.menu/plugin-dom-renderer';

const core = new NavigatorCore({ debugMode: true });

// Register plugins in priority order
core.registerPlugin('keyboard', new KeyboardPlugin(), { priority: 100 });
core.registerPlugin('dom-renderer', new DomRendererPlugin(), { priority: 10 });

// Start the system
await core.init();
await core.start();

// Subscribe to state changes
core.store.subscribe((state) => {
  console.log('Current card:', state.navigation.currentCard);
});

// Dispatch actions
core.store.dispatch(navigate({ currentCard: 2, direction: 'right' }));
```

### React Integration (v3.0+)

```typescript
import { useNavigator } from '@navigator.menu/react';
import { KeyboardPlugin } from '@navigator.menu/plugin-keyboard';
import { navigate } from '@navigator.menu/core/actions';

function App() {
  const { core } = useNavigator({
    plugins: [
      new KeyboardPlugin()
    ],
    autoStart: true
  });

  // Subscribe to Store state
  useEffect(() => {
    if (!core) return;
    return core.store.subscribe((state) => {
      setCurrentCard(state.navigation.currentCard);
    });
  }, [core]);

  // Dispatch actions
  const handleNext = () => {
    core?.store.dispatch(navigate({ 
      currentCard: currentCard + 1, 
      direction: 'right' 
    }));
  };

  return <div>...</div>;
}
```

---

## Debugging (v3.0+)

### Action History & Time-Travel

```typescript
// Get action history from Store
const history = core.store.getState().history.past;

// View all dispatched actions
console.log('Action history:', history);

// Time-travel debugging (if middleware supports it)
// Navigate through state history to debug issues
history.forEach(action => {
  console.log(`${action.type}:`, action.payload);
});
```

### Logger Middleware

```typescript
// Enabled in dev mode
const core = new NavigatorCore({ debugMode: true });

// Logs every action and state change:
// [Logger] Action: navigation/NAVIGATE { currentCard: 2, direction: 'right' }
// [Logger] New State: { navigation: { currentCard: 2, ... } }
```

### DevTools Integration

```typescript
// Subscribe to state changes for debugging
core.store.subscribe((state) => {
  console.log('State snapshot:', JSON.stringify(state, null, 2));
});

// Track specific state slices
core.store.subscribe((state) => {
  if (state.navigation.currentCard !== previousCard) {
    console.log('Card changed:', previousCard, '->', state.navigation.currentCard);
    previousCard = state.navigation.currentCard;
  }
});
```

---

## DEPRECATED: Legacy Debugging Features

### EventBus History - **@deprecated**

> Use Store action history instead (see above).

```typescript
// ❌ Old (DEPRECATED)
const history = core.eventBus.getHistory();
const stats = core.eventBus.getStats();

// ✅ New (v3.0+)
const history = core.store.getState().history.past;
```

### AppState Time-Travel - **@deprecated**

> Use Store middleware for time-travel debugging instead.

```typescript
// ❌ Old (DEPRECATED)
core.state.timeTravel(3);

// ✅ New (v3.0+)
// Implement time-travel via middleware or DevTools
```
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

## Migration Guide

### From v1 (Monolithic) to v2 (EventBus)

**v1 - Tight Coupling:**
```javascript
const gestureDetector = new GestureDetector();
const navController = new NavigationController();

// Direct method calls
gestureDetector.onSwipeLeft = () => {
  navController.previousCard();
};
```

**v2 - EventBus (DEPRECATED in v3.0):**
```javascript
const core = new NavigatorCore();
core.registerPlugin('gesture', new GestureInputPlugin());
core.registerPlugin('navigation', new NavigationLogicPlugin());

// Event-based communication
core.eventBus.on('intent:navigate_left', () => { /* ... */ });
```

### From v2 (EventBus) to v3 (Store) ⭐ CURRENT

**v2 - EventBus (DEPRECATED):**
```javascript
// ❌ Old way
core.eventBus.on('intent:navigate_left', (event) => {
  console.log('Navigate left');
});
core.eventBus.emit('intent:navigate_left', { source: 'keyboard' });
```

**v3 - Store (RECOMMENDED):**
```typescript
// ✅ New way
core.store.subscribe((state) => {
  if (state.navigation.direction === 'left') {
    console.log('Navigate left');
  }
});
core.store.dispatch(navigate({ direction: 'left', source: 'keyboard' }));
```

### Data Flow Evolution

**v1 (Direct Calls):**
```
GestureDetector → NavigationController.previousCard()
                → AudioManager.playSound()
```

**v2 (EventBus - DEPRECATED):**
```
GestureInputPlugin
  ↓ emit('input:gesture:swipe_left')
NavigationLogicPlugin
  ↓ emit('intent:navigate_left')
DomRendererPlugin (listens, updates DOM)
```

**v3 (Store - CURRENT):**
```
GesturePlugin
  ↓ dispatch(gestureDetected({ type: 'swipe', direction: 'left' }))
Middleware Pipeline (cognitive, history, logger)
  ↓ 
Reducers (compute new state)
  ↓
Store (updates state)
  ↓
Subscribers (DomRenderer, etc.) notified
```

---

## Benefits

### 1. **Predictability** (v3.0+)
State changes are always predictable and traceable:

```typescript
// Every state change goes through actions
core.store.dispatch(navigate({ currentCard: 2 }));

// State is immutable
const state1 = core.store.getState();
core.store.dispatch(navigate({ currentCard: 3 }));
const state2 = core.store.getState();
// state1 !== state2 (new object)
```

### 2. **Testability**
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

## SDK Package Structure

The Navigator SDK is organized as a monorepo. The published packages are:

```
packages/
├── core/                # NavigatorCore, Store, EventBus (deprecated), AppState (deprecated)
├── types/               # Shared TypeScript definitions
├── pdk/                 # Plugin Development Kit (base classes, helpers)
├── cli/                 # Scaffolding CLI
├── create-navigator-app/# App scaffolding tool
├── plugin-keyboard/     # Keyboard input plugin
├── plugin-logger/       # Logging plugin
├── plugin-dom-renderer/ # DOM manipulation helpers
├── plugin-mock-gesture/ # Testing utilities
└── react/               # React wrapper (useNavigator hook)
```

> The `apps/showcase/` directory contains the legacy browser-only demo application, which uses a separate set of JavaScript modules (`GestureDetector.js`, `AudioManager.js`, etc.). Those files are not part of the published SDK packages.

---

## Next Steps

1. **Create Custom Plugins**: Build your own input/output plugins using the PDK
2. **Add Tests**: Write plugin-specific unit tests
3. **Read the Architecture docs**: Understand the Store-based data flow

---

## Summary

Navigator's plugin architecture provides:

- **Fully Decoupled**: No plugin communicates directly with another
- **Store-Based**: All state changes flow through dispatched actions (v3.0+)
- **Framework-Agnostic**: Core has zero DOM or framework dependencies
- **Extensible**: Add capabilities without modifying existing code
- **Testable**: Each plugin can be tested in isolation
