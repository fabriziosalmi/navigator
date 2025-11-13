# NavigatorCore Architecture - Executive Summary

**Last Updated:** November 11, 2025  
**Status:** Complete Architecture Analysis  
**Next Step:** Redux-like Store Migration

---

## Quick Navigation

- **[ARCHITECTURE_ANALYSIS.md](./ARCHITECTURE_ANALYSIS.md)** - Detailed technical reference (779 lines)
  - Complete file structure and API documentation
  - Plugin interface and existing implementations
  - Test patterns and configuration
  - Migration checklist

- **[ARCHITECTURE_DIAGRAMS.md](./ARCHITECTURE_DIAGRAMS.md)** - Visual flows and sequences (890 lines)
  - High-level system architecture
  - Plugin lifecycle sequence diagrams
  - Event-driven data flows
  - State update mechanisms
  - Full request lifecycle examples

---

## Core Components Overview

### 1. NavigatorCore (`packages/core/src/NavigatorCore.ts`)
- **607 lines** - Main orchestrator
- **Responsibilities:**
  - Plugin lifecycle management (init → start → stop → destroy)
  - Plugin registration with priority-based loading
  - Critical plugins (priority ≥ 100): Parallel initialization
  - Deferred plugins (priority < 100): Background initialization
  - Action recording for cognitive modeling

**Key Methods:**
```typescript
init()              // Initialize core + plugins (parallel critical, deferred in bg)
start()             // Start all plugins sequentially
stop()              // Stop all plugins in reverse order
destroy()           // Cleanup everything
registerPlugin()    // Register with priority
getPlugin(name)     // Retrieve plugin
recordAction()      // Log to UserSessionHistory
```

**Public Properties:**
```
eventBus          // Read-only EventBus instance
state             // Read-only AppState instance  
history           // Read-only UserSessionHistory
isInitialized     // Lifecycle flag
isRunning         // Lifecycle flag
config            // Configuration object
```

---

### 2. AppState (`packages/core/src/AppState.ts`)
- **519 lines** - Centralized state container
- **Features:**
  - Immutable state updates via setState()
  - Deep path support: `get('navigation.currentLayer')`
  - State watchers with sync/debounce modes (Sprint 2 Task 2)
  - State history (max 50, circular buffer)
  - Time-travel debugging
  - localStorage persistence

**State Structure:**
```
navigation    {currentLayer, totalLayers, isTransitioning, ...}
user          {level, experiencePoints, achievements, cognitive_state, ...}
system        {isIdle, cameraActive, handDetected, mediaPipeReady, ...}
ui            {startScreenVisible, hudVisible, fullscreenCard, ...}
input         {lastGesture, keyboardEnabled, gestureEnabled, ...}
performance   {fps, averageFps, frameCount, ...}
plugins       {[pluginName]: pluginState}
```

**Key Methods:**
```typescript
get(path, default?)           // Read nested value
setState(path/obj, value?)    // Write with deep merge
watch(path, callback, opts?)  // Subscribe to changes
getState()                    // Get full copy
reset()                       // Reset to default
getHistory(limit?)            // Get past states
timeTravel(stepsBack?)        // Go back N states
persist(key?)                 // Save to localStorage
restore(key?)                 // Load from localStorage
```

**Watcher Modes:**
```typescript
// Sync mode: Call immediately on every change
state.watch('nav.layer', callback, { mode: 'sync' })

// Debounce mode: Call after N ms of inactivity
state.watch('nav.layer', callback, { 
  mode: 'debounce', 
  debounceMs: 100 
})
```

---

### 3. EventBus (`packages/core/src/EventBus.ts`)
- **440 lines** - Pub-sub event system with circuit breaker
- **Features:**
  - Event emission with type safety
  - Handler priority (higher = called first)
  - Wildcard subscriptions ('*' for all events)
  - Middleware/interceptors
  - Event history (max 100)
  - Circuit breaker for loop detection
  - Event statistics

**Circuit Breaker Protection:**
- **maxCallDepth:** 100 (prevent deep recursion)
- **maxChainLength:** 50 (detect cycles in event chain)
- Emits `system:circuit-breaker` when violated

**Key Methods:**
```typescript
on(name, handler, {priority?, once?})   // Subscribe
off(name, handler?)                     // Unsubscribe
once(name, handler)                     // Subscribe once
emit(name, payload)                     // Emit event
waitFor(name, timeout?)                 // Promise-based wait
use(middleware)                         // Add middleware
getHistory(name?, limit?)               // Get event log
getStats()                              // Get metrics
```

---

### 4. UserSessionHistory (`packages/core/src/intelligence/UserSessionHistory.ts`)
- **~150 lines** - Circular buffer for ML/analytics
- **Purpose:** Track user actions for cognitive modeling
- **Features:**
  - Rolling window of recent actions
  - Configurable max size (default: 100)
  - Metrics calculation: error rate, avg duration, action variety

**Key Methods:**
```typescript
add(action)         // Add action to buffer
getLatest(count)    // Get N most recent actions
getMetrics(window)  // Calculate metrics for sliding window
```

**Action Recording:**
```typescript
core.recordAction({
  id: 'uuid',
  timestamp: performance.now(),
  type: 'keyboard:navigate_left',
  success: true,
  duration_ms: 350
})
```

---

## Plugin Architecture

### Plugin Interface
```typescript
interface INavigatorPlugin {
  name: string;                       // Unique ID
  init(core: NavigatorCore): Promise<void> | void;  // REQUIRED
  start?(): Promise<void> | void;     // Optional
  stop?(): Promise<void> | void;      // Optional
  destroy?(): Promise<void> | void;   // Optional
  _priority?: number;                 // Load order
  _config?: any;                      // Plugin config
  _initTimeout?: number;              // Timeout (default: 5000ms)
}
```

### Existing Plugins

| Plugin | Location | Purpose |
|--------|----------|---------|
| **KeyboardPlugin** | `/plugin-keyboard` | Keyboard input → navigation intents |
| **DomRendererPlugin** | `/plugin-dom-renderer` | Cognitive state → DOM updates |
| **LoggerPlugin** | `/plugin-logger` | Centralized logging utility |

### Plugin Lifecycle

```
registerPlugin(plugin, {priority, config})
  ↓ isInitialized = false
  
core.init()
  Critical plugins (priority ≥ 100): Promise.all() - PARALLEL
  Emit: core:init:complete
  Deferred plugins (priority < 100): Promise.all() - BACKGROUND
  Later: Emit: core:deferred:ready
  ↓ isInitialized = true
  
core.start()
  All plugins: Sequential (in priority order)
  Emit: core:start:complete
  ↓ isRunning = true
  
core.stop()
  All plugins: Sequential REVERSE order
  ↓ isRunning = false
  
core.destroy()
  All plugins: Sequential REVERSE order
  Clear all state
```

---

## Event Flow

### Current Data Flow

```
[Plugin]
  ↓
core.state.setState()
  ├─ Snapshot previous state
  ├─ Apply updates via _deepMerge()
  ├─ Add to history (max 50)
  ├─ Emit 'state:changed'
  ├─ Emit 'state:{key}:changed'
  ├─ Call watchers (sync or debounce)
  └─ Update computed properties
  ↓
[Watchers can call setState() → potential loops]
  
BUT: Circuit breaker in EventBus prevents infinite loops
  (maxCallDepth: 100, maxChainLength: 50)
```

### Key Events

**Lifecycle Events:**
```
core:init:start
core:init:complete
core:deferred:ready
core:start:begin
core:start:complete
core:stop:begin
core:stop:complete
core:destroy:begin
core:destroy:complete
core:error
```

**State Events:**
```
state:changed              {previous, current, updates}
state:{key}:changed        {previous, current}
state:computed:updated     {computed properties}
state:reset
state:timetravel
state:restored
```

**Plugin Events:**
```
core:plugin:registered     {pluginName, priority}
core:plugin:initialized    {pluginName}
core:plugin:started        {pluginName}
core:plugin:stopped        {pluginName}
core:plugin:destroyed      {pluginName}
```

**User Action Events:**
```
history:action:recorded    {action, historySize}
```

---

## Test Structure

### Test Files
```
packages/core/tests/
├── NavigatorCore.spec.ts               # Lifecycle, plugins (17.6KB)
├── AppState.spec.ts                    # State ops, watchers (18.5KB)
├── EventBus.spec.ts                    # Events, priority (11.4KB)
├── NavigatorCore.plugins.spec.ts       # Plugin lifecycle (12.8KB)
├── UserSessionHistory.spec.ts          # Metrics (9.1KB)
└── integration/
    ├── cognitive-intelligence.spec.ts
    ├── CognitiveLoop.integration.spec.ts
    └── CoreStress.integration.spec.ts
```

### Test Configuration
```typescript
// vitest.config.ts
environment: 'jsdom'        // For DOM APIs
fakeTimers: { toFake: [] }  // No fake timers by default
coverage thresholds: 80%    // lines, functions, branches, statements
```

### Common Test Patterns
```typescript
// Setup
beforeEach(() => {
  core = new NavigatorCore();
});

// Mock plugins
class MockPlugin implements INavigatorPlugin {
  name = 'test';
  async init(core: NavigatorCore) { ... }
}

// Event testing
const events: string[] = [];
core.eventBus.on('core:init:start', () => events.push('start'));

// State testing
appState.watch('navigation.currentLayer', (v) => values.push(v));
appState.setState('navigation.currentLayer', 1);
```

---

## Redux-like Store Migration Plan

### Current Problems with Direct setState()
1. **No action history** - Only state snapshots, not actions
2. **No middleware** - Hard to insert cross-cutting logic
3. **Hard to test** - State updates scattered across plugins
4. **Poor time-travel** - Restores state, not actions
5. **Loop risks** - Watchers can trigger more setState calls

### Proposed Solution: Redux-like Dispatch

```typescript
// Before (current)
core.state.setState('navigation.currentLayer', layer - 1)

// After (Redux-like)
core.dispatch({
  type: 'NAVIGATE_LEFT',
  payload: { previousLayer: 1, newLayer: 0 }
})
```

### Integration Points

1. **Add redux library to dependencies**
   ```json
   {
     "redux": "^4.x.x",
     "redux-thunk": "^2.x.x"
   }
   ```

2. **Create Store class**
   ```typescript
   class Store {
     dispatch(action)          // Send action
     subscribe(listener)       // React to state changes
     getState()               // Get current state
   }
   ```

3. **Implement reducers**
   ```typescript
   const navigationReducer = (state, action) => {
     switch (action.type) {
       case 'NAVIGATE_LEFT':
         return { ...state, currentLayer: state.currentLayer - 1 }
       default:
         return state
     }
   }
   ```

4. **Add middleware**
   ```typescript
   const loggingMiddleware = store => next => action => {
     console.log('Action:', action)
     return next(action)
   }
   ```

5. **Integrate with AppState**
   - Middleware calls `appState.setState(reducerOutput)`
   - Emit `action:dispatched` events
   - Watchers react to state changes as before

### Migration Strategy (Phased)

**Phase 1: Add alongside existing**
- Implement dispatch() method
- Keep setState() working
- Both update AppState
- Add integration tests

**Phase 2: Migrate plugins**
- KeyboardPlugin → dispatch instead of setState
- DomRendererPlugin → dispatch
- One at a time with tests

**Phase 3: Complete transition**
- Deprecate setState() in plugins
- Maintain legacy support in AppState
- Update documentation

---

## Architecture Strengths

✅ **Plugin System** - Easy to extend with custom behavior  
✅ **Event-Driven** - Loose coupling between components  
✅ **Circuit Breaker** - Protection against event loops  
✅ **State History** - Built-in time-travel debugging  
✅ **Watchers** - Both sync and debounce modes (Sprint 2)  
✅ **Parallel Init** - Fast startup with priority-based loading  
✅ **Type-Safe** - Full TypeScript support  
✅ **Well-Tested** - 80% coverage threshold  

---

## Architecture Weaknesses (Redux migration will fix)

❌ **No action history** - Hard to debug state changes  
❌ **No middleware** - Can't intercept/transform actions  
❌ **Direct mutations** - setState() scattered across code  
❌ **Watchers can loop** - Even with circuit breaker, risky  
❌ **Hard to test** - No clear reducers to unit test  
❌ **No time-travel** - Can't replay actions  

---

## Key Takeaways for Migration

1. **Preserve plugin architecture** - It's the core strength
2. **Keep EventBus** - Already has middleware support
3. **Keep AppState** - Just add reducer layer on top
4. **Gradual adoption** - Add dispatch() alongside setState()
5. **Backward compatible** - Support both old and new approaches during transition
6. **Leverage circuit breaker** - EventBus already prevents loops
7. **Test incrementally** - Each plugin migrated with tests
8. **Use existing patterns** - Follow KeyboardPlugin/DomRendererPlugin models

---

## Files Generated

1. **ARCHITECTURE_ANALYSIS.md** (779 lines)
   - Complete technical reference
   - API documentation
   - Code examples
   - Migration checklist

2. **ARCHITECTURE_DIAGRAMS.md** (890 lines)
   - Visual system architecture
   - Sequence diagrams
   - State flow diagrams
   - Full lifecycle examples

3. **ARCHITECTURE_SUMMARY.md** (this file)
   - Quick reference
   - Navigation guide
   - Executive overview

---

## Next Steps

1. **Review** the detailed architecture docs
2. **Decide** on Redux vs alternative (Redux Toolkit, Zustand, Jotai)
3. **Design** action types and reducers for each state domain
4. **Implement** Store class with middleware chain
5. **Migrate** plugins one by one
6. **Test** thoroughly at each phase
7. **Document** usage patterns for plugin developers

---

**Document Status:** Complete  
**Last Updated:** November 11, 2025  
**Ready for:** Redux-like Store Migration Implementation

