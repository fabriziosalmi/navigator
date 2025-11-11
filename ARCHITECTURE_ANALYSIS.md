# NavigatorCore Architecture Analysis
## Redux-like Store Migration Planning Guide

**Document Version:** 1.0  
**Target:** NavigatorCore Refactoring for Redux-like State Management  
**Date:** November 11, 2025

---

## EXECUTIVE SUMMARY

The NavigatorCore follows a **plugin-based event-driven architecture** with:
- **Central EventBus**: Decoupled pub-sub system with circuit breaker protection
- **AppState**: Immutable state container with watchers and time-travel debugging
- **NavigatorCore**: Plugin orchestrator managing lifecycle and initialization
- **UserSessionHistory**: Circular buffer for cognitive modeling

For a Redux-like Store migration, you need to:
1. **Preserve** the plugin architecture (core strength)
2. **Replace** direct AppState mutations with dispatched actions
3. **Integrate** Redux concepts (reducers, actions, selectors) alongside EventBus
4. **Maintain** backward compatibility during transition

---

## 1. CURRENT NAVIGATORCORE IMPLEMENTATION

### 1.1 File Structure

```
packages/core/src/
├── NavigatorCore.ts           # Main orchestrator (607 lines)
├── AppState.ts               # State container (519 lines)
├── EventBus.ts               # Event system (440 lines)
├── types.ts                  # Event types (79 lines)
├── index.ts                  # Public exports
└── intelligence/
    └── UserSessionHistory.ts # Action history for ML (circular buffer)
```

### 1.2 NavigatorCore.ts - Key Architecture

**Constructor & Initialization:**
```typescript
constructor(config: NavigatorCoreConfig = {}) {
  this.config = { debugMode, autoStart, initialState, historyMaxSize };
  this.eventBus = new EventBus({ debugMode, maxHistorySize: 200 });
  this.state = new AppState(this.eventBus, initialState);
  this.history = new UserSessionHistory(historyMaxSize);
  this.plugins = new Map();
  this.pluginOrder = [];
  this.pluginStates = new Map();
}
```

**Public API Methods:**

| Method | Purpose | Returns |
|--------|---------|---------|
| `init()` | Initialize core and all plugins | `Promise<void>` |
| `start()` | Start core and all plugins | `Promise<void>` |
| `stop()` | Pause core and all plugins | `Promise<void>` |
| `destroy()` | Cleanup and destroy everything | `Promise<void>` |
| `registerPlugin(plugin, options)` | Register a plugin with priority | `NavigatorCore` (chainable) |
| `getPlugin(name)` | Retrieve plugin instance | `INavigatorPlugin \| null` |
| `recordAction(action)` | Record user action in history | `void` |
| **Public Properties** | | |
| `eventBus` (read-only) | Event pub-sub system | `EventBus` |
| `state` (read-only) | Centralized state | `AppState` |
| `history` (read-only) | Session history for ML | `UserSessionHistory` |
| `isInitialized` | Lifecycle flag | `boolean` |
| `isRunning` | Lifecycle flag | `boolean` |
| `config` (read-only) | Runtime configuration | `Required<NavigatorCoreConfig>` |

**Plugin Lifecycle (Sprint 2 Enhancement):**
```
1. registerPlugin() → Plugin stored in Map, ordered by priority
2. init() → 
   - Critical plugins (priority >= 100) initialized in parallel via Promise.all()
   - Deferred plugins (priority < 100) init in background (non-blocking)
   - core:init:complete emitted before deferred start
3. start() → All plugins started sequentially
4. stop() → All plugins stopped in reverse order
5. destroy() → All plugins destroyed in reverse order, then core cleanup
```

**Key Event Emissions:**
```
core:init:start              → Emitted before init
core:init:complete           → All critical plugins ready
core:deferred:ready          → All deferred plugins ready
core:start:begin/complete    → Lifecycle
core:stop:begin/complete     → Lifecycle
core:destroy:begin/complete  → Lifecycle
core:plugin:registered       → When plugin registered
core:plugin:initialized      → After plugin init
core:plugin:started          → After plugin start
core:plugin:stopped          → After plugin stop
core:error                   → On any error
history:action:recorded      → When action recorded
```

---

## 2. APPSTATE.TS - CURRENT IMPLEMENTATION

### 2.1 State Structure

```typescript
interface NavigatorState {
  navigation: {
    currentLayer: number;
    totalLayers: number;
    layerName: string;
    currentCardIndex: number;
    totalCards: number;
    isTransitioning: boolean;
  };
  user: {
    level: number;
    experiencePoints: number;
    navigationCount: number;
    gesturesDetected: number;
    achievements: string[];
    cognitive_state?: 'frustrated' | 'concentrated' | 'exploring' | 'learning' | 'neutral';
  };
  system: {
    isIdle: boolean;
    idleStartTime: number | null;
    cameraActive: boolean;
    handDetected: boolean;
    mediaPipeReady: boolean;
    performanceMode: 'high' | 'medium' | 'low';
  };
  ui: {
    startScreenVisible: boolean;
    hudVisible: boolean;
    fullscreenCard: string | null;
    debugPanelVisible: boolean;
  };
  input: {
    lastGesture: string | null;
    lastGestureTime: number;
    keyboardEnabled: boolean;
    gestureEnabled: boolean;
    voiceEnabled: boolean;
  };
  performance: {
    fps: number;
    lastFrameTime: number;
    averageFps: number;
    frameCount: number;
  };
  plugins: Record<string, any>;  // Plugin-specific state
}
```

### 2.2 AppState Public API

| Method | Signature | Purpose |
|--------|-----------|---------|
| `get(path, defaultValue?)` | `<T>(path: string, default?: T): T` | Retrieve nested value via dot notation |
| `setState(path/updates, value?, options?)` | Overloaded | Set state with path string or object |
| `watch(path, callback, options?)` | `(path: string, cb: WatcherCallback, opts?: WatchOptions): () => void` | Subscribe to path changes |
| `getState()` | `(): NavigatorState` | Get deep copy of entire state |
| `reset(silent?)` | `(silent?: boolean): void` | Reset to default state |
| `getHistory(limit?)` | `(limit?: number): NavigatorState[]` | Get state history (max 50) |
| `timeTravel(stepsBack?)` | `(stepsBack?: number): void` | Restore previous state |
| `persist(key?)` | `(key?: string): void` | Save to localStorage |
| `restore(key?)` | `(key?: string): boolean` | Load from localStorage |
| **Public Property** | | |
| `computed` | `ComputedProperties` | Read-only computed values |

### 2.3 State Watchers (Sprint 2 Task 2: Debounce Support)

```typescript
interface WatchOptions {
  mode?: 'sync' | 'debounce';
  debounceMs?: number;  // Default: 16ms (60fps)
}

// Usage
const unwatch = state.watch('navigation.currentLayer', (newValue) => {
  console.log('Layer changed to:', newValue);
}, { mode: 'debounce', debounceMs: 100 });

// Cleanup
unwatch();
```

**Implementation Details:**
- `'sync'` mode: Immediate callback execution
- `'debounce'` mode: Callback fires after debounceMs of inactivity
- Watchers tracked in `Map<string, Set<WatcherCallback>>`
- Debounce metadata stored in `debouncedWatchers` Map

### 2.4 State Emission Pattern

When state changes via `setState()`:
```
1. Snapshot previous state
2. Apply updates via _deepMerge() (respects merge flag)
3. Add previous to history (circular buffer, max 50)
4. Emit 'state:changed' event with {previous, current, updates}
5. Emit specific 'state:{key}:changed' events
6. Call registered watchers (sync or debounced)
7. Update computed properties
```

---

## 3. EVENTBUS.TS - EVENT-DRIVEN COMMUNICATION

### 3.1 Event System Architecture

```typescript
interface NavigatorEvent<T = any> {
  name: string;              // Event name (e.g., 'intent:navigate_left')
  payload: T;                // Custom data
  timestamp: number;         // performance.now()
  source: string;            // Plugin name or 'user'
}

type EventHandler<T = any> = (event: NavigatorEvent<T>) => void;
```

### 3.2 EventBus Public API

| Method | Purpose | Features |
|--------|---------|----------|
| `on(eventName, handler, options?)` | Subscribe to event | Returns unsubscribe fn; supports priority |
| `off(eventName, handler?)` | Unsubscribe from event | Can remove all handlers |
| `once(eventName, handler)` | Subscribe once | Auto-unsubscribes after first trigger |
| `emit(eventName, payload)` | Emit event | Returns true if handlers called |
| `waitFor(eventName, timeout?)` | Wait for event | Returns Promise<NavigatorEvent<T>> |
| `use(middleware)` | Add middleware | `(event) => event \| null` |
| `getHistory(eventName?, limit?)` | Get event history | Max 100 events (configurable) |
| `getStats()` | Get statistics | Returns event counts and top events |
| `clear()` | Remove all listeners | Use with caution |
| `reset()` | Clear history & stats | Keeps listeners intact |

### 3.3 Event Features

**Subscription Options:**
```typescript
interface SubscriptionOptions {
  once?: boolean;           // Auto-unsubscribe
  priority?: number;        // Higher = called first
}
```

**Wildcard Subscriptions:**
```typescript
eventBus.on('*', (event) => {
  console.log('Any event:', event.name);
});
```

**Handler Priority:**
```typescript
eventBus.on('state:changed', handler1, { priority: 10 });
eventBus.on('state:changed', handler2, { priority: 5 });
// handler1 called first (priority 10 > 5)
```

### 3.4 Circuit Breaker (Protection Against Event Loops)

**Problem:** EventBus can create infinite loops if handlers emit events that trigger themselves.

**Solution:**
```typescript
interface CircuitBreaker {
  enabled?: boolean;        // Default: true
  maxCallDepth?: number;    // Default: 100 (calls to same event)
  maxChainLength?: number;  // Default: 50 (events in sequence)
}

// When violated:
emit('system:circuit-breaker', {
  eventName,
  type: 'max_depth_exceeded' | 'cycle_detected'
})
```

**Implementation:**
- Tracks `callDepthMap<eventName, depth>` during emit
- Maintains `eventChain: string[]` of recent events
- Detects if event appears multiple times in chain
- Rejects emit if limits exceeded

---

## 4. EXISTING PLUGINS - ARCHITECTURE PATTERNS

### 4.1 Plugin Interface

All plugins must implement `INavigatorPlugin`:

```typescript
interface INavigatorPlugin {
  name: string;                          // Unique identifier
  init(core: NavigatorCore): Promise<void> | void;  // REQUIRED
  start?(): Promise<void> | void;        // Optional
  stop?(): Promise<void> | void;         // Optional
  destroy?(): Promise<void> | void;      // Optional
  _priority?: number;                    // Internal: load order
  _config?: any;                         // Internal: plugin config
  _initTimeout?: number;                 // Internal: init timeout (ms)
}
```

### 4.2 KeyboardPlugin (/plugin-keyboard)

**Location:** `/packages/plugin-keyboard/src/KeyboardPlugin.ts`

**Purpose:** Capture keyboard input and emit navigation intents

**Key Features:**
- Emits: `keyboard:keydown`, `keyboard:keyup`, `keyboard:combo`
- Emits intents: `intent:navigate_left`, `intent:navigate_right`, `intent:select`, etc.
- Records user actions in `core.history`
- Configurable key combinations (Ctrl+d → toggle_debug)

**Implementation Pattern:**
```typescript
export class KeyboardPlugin implements INavigatorPlugin {
  public readonly name = 'keyboard';
  private core: NavigatorCore | null = null;
  private pressedKeys: Set<string> = new Set();
  private handleKeyDown: ((event: KeyboardEvent) => void) | null = null;

  async init(core: NavigatorCore): Promise<void> {
    this.core = core;
    this.handleKeyDown = this._onKeyDown.bind(this);
    // Bind handlers here, attach in start()
  }

  async start(): Promise<void> {
    window.addEventListener('keydown', this.handleKeyDown);
  }

  async stop(): Promise<void> {
    window.removeEventListener('keydown', this.handleKeyDown);
    this.pressedKeys.clear();
  }

  async destroy(): Promise<void> {
    await this.stop();
    this.core = null;
  }

  private _onKeyDown(event: KeyboardEvent): void {
    const timestamp = performance.now();
    
    // Record action
    this.core!.recordAction({
      id: nanoid(),
      timestamp,
      type: 'keyboard:navigation',
      success: true,
      duration_ms: timestamp - this.actionStartTime
    });
    
    // Emit intent
    this.core!.eventBus.emit('intent:navigate_left', { /* ... */ });
  }
}
```

**Registration:**
```typescript
const keyboard = new KeyboardPlugin({ enabled: true });
core.registerPlugin(keyboard, { priority: 100 });
```

### 4.3 DomRendererPlugin (/plugin-dom-renderer)

**Location:** `/packages/plugin-dom-renderer/src/DomRendererPlugin.ts`

**Purpose:** Translate cognitive state and intents into DOM updates

**Key Features:**
- Listens to: `system_state:change`, `intent:prediction`, `intent:navigate`
- Updates CSS classes: `state-{cognitiveState}` (neutral, frustrated, concentrated, etc.)
- Preloads cards based on intent predictions
- Configurable speed multipliers per cognitive state
- CSS custom property: `--animation-speed-multiplier`

**Configuration:**
```typescript
interface DomRendererConfig {
  target?: string | HTMLElement;           // '.card', 'body'
  cardSelector?: string;                   // '.card'
  layerSelector?: string;                  // '.layer'
  predictionThreshold?: number;            // 0.70
  debugMode?: boolean;
  enableCognitiveStates?: boolean;
  enableIntentPreloading?: boolean;
  speedMultipliers?: { frustrated: 1.5, ... };
}
```

**Event Handlers:**
```typescript
private onCognitiveStateChange(event: any): void {
  const { to: newState, from: oldState } = event.payload;
  
  // Remove old state class
  this.container.classList.remove(`state-${oldState}`);
  // Add new state class
  this.container.classList.add(`state-${newState}`);
  // Update speed multiplier
  this.updateSpeedMultiplier(newState);
}

private onIntentPrediction(event: any): void {
  // Add 'card--preloading' class to likely target
}

private onNavigate(event: any): void {
  // Execute navigation animation
}
```

### 4.4 LoggerPlugin (/plugin-logger)

**Location:** `/packages/plugin-logger/src/index.ts`

**Purpose:** Centralized, configurable logging

**Key Features:**
- Log levels: DEBUG, INFO, WARN, ERROR, NONE
- Configurable minimum level
- Optional timestamps
- Custom prefix

**Usage:**
```typescript
const logger = new LoggerPlugin({ 
  level: LogLevel.WARN,
  timestamps: true 
});
core.registerPlugin(logger, { priority: 50 });
logger.debug('Won\'t show');
logger.warn('Will show');
```

**Note:** LoggerPlugin doesn't subscribe to events; it's just a utility injected into the core.

---

## 5. USERSESSIONHISTORY - CIRCULAR BUFFER FOR ML

### 5.1 Implementation

```typescript
export class UserSessionHistory {
  private buffer: Action[] = [];
  private maxSize: number;

  constructor(maxSize: number = 100) {
    this.maxSize = maxSize;
  }

  add(action: Action): void {
    this.buffer.push(action);
    if (this.buffer.length > this.maxSize) {
      this.buffer.shift();
    }
  }

  getLatest(count: number): Action[] {
    return this.buffer.slice(-count);
  }

  getMetrics(windowSize: number): SessionMetrics {
    // Calculate error rate, avg duration, action variety, etc.
  }
}
```

### 5.2 Recording Actions

```typescript
core.recordAction({
  id: nanoid(),
  timestamp: performance.now(),
  type: 'intent:navigate',
  success: true,
  duration_ms: 350
});

// Emits: history:action:recorded event
```

---

## 6. TEST STRUCTURE AND PATTERNS

### 6.1 Test File Organization

```
packages/core/tests/
├── NavigatorCore.spec.ts                # 17,626 bytes (lifecycle, plugins)
├── AppState.spec.ts                     # 18,543 bytes (state ops, watchers)
├── EventBus.spec.ts                     # 11,415 bytes (events, priority)
├── NavigatorCore.plugins.spec.ts        # 12,851 bytes (plugin lifecycle)
├── UserSessionHistory.spec.ts           # 9,077 bytes (metrics)
└── integration/
    ├── cognitive-intelligence.spec.ts
    ├── CognitiveLoop.integration.spec.ts
    └── CoreStress.integration.spec.ts
```

### 6.2 Test Configuration

**File:** `vitest.config.ts`

```typescript
export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    globals: true,
    environment: 'jsdom',  // For DOM APIs
    fakeTimers: { toFake: [] },  // No fake timers by default
    coverage: {
      provider: 'v8',
      thresholds: { lines: 80, functions: 80, branches: 80 }
    }
  }
});
```

### 6.3 Common Test Patterns

**1. Basic Setup:**
```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NavigatorCore } from '../src/NavigatorCore';

describe('Feature Group', () => {
  let core: NavigatorCore;
  
  beforeEach(() => {
    core = new NavigatorCore();
  });

  it('should do something', () => {
    expect(core.isInitialized).toBe(false);
  });
});
```

**2. Mock Plugins:**
```typescript
class MockPlugin implements INavigatorPlugin {
  name: string;
  initCalled = false;
  
  constructor(name: string) {
    this.name = name;
  }
  
  async init(core: NavigatorCore): Promise<void> {
    this.initCalled = true;
  }
}
```

**3. Event Testing:**
```typescript
it('should emit lifecycle events', async () => {
  const events: string[] = [];
  
  core.eventBus.on('core:init:start', () => events.push('start'));
  core.eventBus.on('core:init:complete', () => events.push('complete'));
  
  await core.init();
  
  expect(events).toEqual(['start', 'complete']);
});
```

**4. State Testing:**
```typescript
it('should update state with watchers', async () => {
  const values: number[] = [];
  
  appState.watch('navigation.currentLayer', (v) => values.push(v));
  
  appState.setState('navigation.currentLayer', 1);
  appState.setState('navigation.currentLayer', 2);
  
  expect(values).toEqual([1, 2]);
});
```

---

## 7. INTEGRATION POINTS FOR REDUX-LIKE STORE

### 7.1 Current Data Flow

```
[Plugin] 
  └─> core.state.setState() 
      └─> AppState mutates state
          └─> Emit 'state:changed'
              └─> [Watcher/Plugin] calls setState() again (potential loops)
```

**Problem:** 
- Direct mutations bypass action history
- Watchers can trigger more setState calls
- Hard to track action origin and middleware

### 7.2 Proposed Redux-like Flow

```
[Plugin]
  └─> core.dispatch({ type: 'ACTION_NAME', payload: {...} })
      └─> [Redux Middleware/Async thunks]
          └─> [Reducer] applies action
              └─> AppState updates state
                  └─> Emit 'action:dispatched' + 'state:changed'
                      └─> [Watcher/Plugin] dispatches new actions
                          └─> [Logs to history]
```

**Benefits:**
1. **Action History:** Track all dispatches, not just state snapshots
2. **Middleware:** Insert custom logic (logging, analytics, async)
3. **Time Travel:** Replay actions instead of restoring states
4. **Testability:** Test reducers in isolation
5. **DevTools:** Redux DevTools for debugging

### 7.3 Backward Compatibility Strategy

**Phase 1 (Current):**
- Keep `core.state.setState()` working
- Add new `core.dispatch()` method
- Both update AppState

**Phase 2:**
- Deprecate `state.setState()` in favor of dispatch
- Migrate plugins one by one
- Maintain dual-mode operation

**Phase 3:**
- Remove direct state mutations
- Force dispatch-only approach

---

## 8. KEY ARCHITECTURAL DECISIONS

### 8.1 Plugin Priority System

- **Priority >= 100:** "Critical" - Initialized in parallel via `Promise.all()`
- **Priority < 100:** "Deferred" - Initialized in background after critical
- **Default:** 100 (critical)

**Why?** Some plugins need MediaPipe/DOM ready before expensive initialization.

### 8.2 EventBus Circuit Breaker

- **maxCallDepth:** 100 calls to same event before abort
- **maxChainLength:** 50 events in sequence before cycle detection

**Why?** Prevent event loops from crashing the system.

### 8.3 AppState History

- **maxHistorySize:** 50 states (not configurable, hardcoded)
- **Time travel support:** Can rollback N steps
- **Purpose:** Debugging and cognitive analysis

### 8.4 UserSessionHistory

- **maxSize:** Configurable per instance (default: 100)
- **Purpose:** Rolling window for ML metrics
- **Circular buffer:** Oldest actions dropped automatically

---

## 9. MIGRATION CHECKLIST

### Pre-Migration
- [ ] Add Redux library to dependencies
- [ ] Create `Store` class implementing `IStore` interface
- [ ] Implement action types and creators
- [ ] Implement reducers for each state domain
- [ ] Create middleware layer

### During Migration
- [ ] Add `core.dispatch(action)` method
- [ ] Update AppState to support both mutations and dispatches
- [ ] Add action history tracking
- [ ] Update plugins to use dispatch instead of setState
- [ ] Add integration tests for new dispatch flow

### Post-Migration
- [ ] Deprecate `state.setState()` in favor of `dispatch()`
- [ ] Update plugin examples and documentation
- [ ] Remove circuit breaker for old mutations
- [ ] Clean up legacy state update code

---

## 10. CRITICAL FILES SUMMARY

| File | Lines | Purpose | Key Exports |
|------|-------|---------|-------------|
| `NavigatorCore.ts` | 607 | Plugin orchestration, lifecycle | `NavigatorCore`, `INavigatorPlugin` |
| `AppState.ts` | 519 | State container, watchers | `AppState`, `NavigatorState` |
| `EventBus.ts` | 440 | Event system, circuit breaker | `EventBus`, `NavigatorEvent` |
| `types.ts` | 79 | Event type definitions | `NavigatorEvent`, `EventHandler` |
| `UserSessionHistory.ts` | ~150 | Action history for ML | `UserSessionHistory` |
| `KeyboardPlugin.ts` | ~250 | Keyboard input plugin | `KeyboardPlugin` |
| `DomRendererPlugin.ts` | 441 | DOM state rendering | `DomRendererPlugin` |
| `LoggerPlugin.ts` | 171 | Logging utility | `LoggerPlugin` |

---

## 11. QUICK REFERENCE: PUBLIC API

### NavigatorCore Methods
```typescript
core.init()                              // Initialize
core.start()                             // Start
core.stop()                              // Stop
core.destroy()                           // Cleanup
core.registerPlugin(plugin, options)     // Register
core.getPlugin(name)                     // Retrieve
core.recordAction(action)                // Log action
```

### AppState Methods
```typescript
state.get(path, default?)                // Read
state.setState(path/obj, value?, opts?)  // Write
state.watch(path, callback, opts?)       // Subscribe
state.getState()                         // Full copy
state.reset()                            // Reset
state.getHistory(limit?)                 // History
state.timeTravel(stepsBack?)             // Rollback
state.persist(key?)                      // Save
state.restore(key?)                      // Load
```

### EventBus Methods
```typescript
eventBus.on(name, handler, opts?)        // Subscribe
eventBus.off(name, handler?)             // Unsubscribe
eventBus.once(name, handler)             // Subscribe once
eventBus.emit(name, payload)             // Emit
eventBus.waitFor(name, timeout?)         // Promise
eventBus.use(middleware)                 // Add middleware
eventBus.getHistory(name?, limit?)       // History
eventBus.getStats()                      // Stats
```

---

## CONCLUSION

The NavigatorCore architecture is **well-designed for Redux migration**:
1. ✅ Clear separation between state (AppState) and events (EventBus)
2. ✅ Plugin system provides extension points
3. ✅ EventBus already has middleware support for Redux integration
4. ✅ Comprehensive test coverage ensures safe refactoring
5. ✅ Circuit breaker prevents event loops during transition

For implementation, focus on:
- **Minimal disruption:** Add dispatch alongside setState initially
- **Incremental migration:** One plugin at a time
- **Event middleware:** Leverage existing EventBus.use() for action logging
- **Type safety:** Use discriminated unions for Redux actions

