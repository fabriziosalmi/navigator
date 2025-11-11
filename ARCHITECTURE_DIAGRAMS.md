# NavigatorCore Architecture - Visual Diagrams & Detailed Flows

---

## 1. HIGH-LEVEL SYSTEM ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          NAVIGATORCORE                                  │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                    PLUGIN ORCHESTRATION                         │   │
│  │                                                                 │   │
│  │  [KeyboardPlugin] ──┐                                          │   │
│  │  [DomRendererPlugin]├──→ [NavigatorCore] ←─── Plugin Manager   │   │
│  │  [LoggerPlugin]    ──┘    - registerPlugin()                  │   │
│  │  [...custom]            - getPlugin()                         │   │
│  │                          - Plugin lifecycle                    │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                              ▲                                          │
│                              │ init/start/stop/destroy                  │
│                              │                                          │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                         EVENTBUS                               │   │
│  │                    (Pub-Sub System)                             │   │
│  │                                                                 │   │
│  │  .on()  ──┐                                                    │   │
│  │  .off()  ├──→ Event Listeners Map                              │   │
│  │  .emit() ├──→ Event History (max 100)                          │   │
│  │  .once() ├──→ Middleware Chain                                 │   │
│  │  .waitFor()  │ Circuit Breaker (loop detection)               │   │
│  │              │ Event Stats & Debug                             │   │
│  │              └→ Wildcard Subscriptions ('*')                   │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                              ▲                                          │
│                              │ state:changed, action:*, core:*          │
│                              │                                          │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                       APPSTATE                                  │   │
│  │                  (Centralized State)                            │   │
│  │                                                                 │   │
│  │  .get()      ──┐                                               │   │
│  │  .setState() ├──→ NavigatorState object                        │   │
│  │  .watch()    ├──→ State History (max 50)                       │   │
│  │  .reset()    ├──→ Computed Properties                          │   │
│  │  .getState() └──→ Time-Travel debugging                        │   │
│  │                  Persist/Restore (localStorage)               │   │
│  │                  Watchers (sync & debounce modes)             │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                              ▲                                          │
│                              │ recordAction()                           │
│                              │                                          │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                   USERSESSIONHISTORY                            │   │
│  │              (Circular Buffer for ML)                           │   │
│  │                                                                 │   │
│  │  .add(action)      ──→ Circular buffer (max 100)              │   │
│  │  .getLatest(count) ──→ Most recent actions                    │   │
│  │  .getMetrics()     ──→ Sliding window analytics               │   │
│  │                       (error rate, duration, variety)         │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 2. PLUGIN LIFECYCLE SEQUENCE DIAGRAM

```
User Code           NavigatorCore           Plugins         EventBus
    │                   │                     │               │
    │ .registerPlugin() │                     │               │
    ├──────────────────►│                     │               │
    │                   │ Validate            │               │
    │                   │ Store in Map        │               │
    │                   │ Order by priority   │               │
    │                   │ Emit:core:plugin:registered
    │                   ├───────────────────────────────────►│
    │                   │                     │               │
    │ .init()           │                     │               │
    ├──────────────────►│                     │               │
    │                   │ Emit:core:init:start               │
    │                   ├───────────────────────────────────►│
    │                   │                     │               │
    │                   │ CRITICAL PLUGINS (priority >= 100) │
    │                   │ Parallel init via Promise.all()    │
    │                   ├─────────────────────────────────┐  │
    │                   │                     │           │  │
    │                   │ .init(core)         │           │  │
    │                   ├────────────────────►│           │  │
    │                   │                     ├─────────┐ │  │
    │                   │                     │ Returns │ │  │
    │                   │                     │◄────────┘ │  │
    │                   │◄─────────────────────────────────┘  │
    │                   │                     │               │
    │                   │ Emit:core:plugin:initialized (x N) │
    │                   ├───────────────────────────────────►│
    │                   │                     │               │
    │                   │ Emit:core:init:complete
    │                   ├───────────────────────────────────►│
    │                   │                     │               │
    │                   │ DEFERRED PLUGINS (priority < 100)   │
    │                   │ Background init (non-blocking)      │
    │                   ├─────────────────────────────────┐  │
    │                   │                     │           │  │
    │                   │ .init(core)         │           │  │
    │                   ├────────────────────►│           │  │
    │                   │   (async, don't wait)  Returns  │  │
    │                   │                     │◄──────────┘  │
    │                   │                     │               │
    │                   │ Later: Emit:core:deferred:ready
    │                   ├───────────────────────────────────►│
    │                   │                     │               │
    │ .start()          │                     │               │
    ├──────────────────►│                     │               │
    │                   │ Emit:core:start:begin              │
    │                   ├───────────────────────────────────►│
    │                   │                     │               │
    │                   │ SEQUENTIAL start (all plugins)      │
    │                   ├─────────────────────────────────┐  │
    │                   │                     │           │  │
    │                   │ .start()            │           │  │
    │                   ├────────────────────►│           │  │
    │                   │                     ├─────────┐ │  │
    │                   │                     │ Returns │ │  │
    │                   │                     │◄────────┘ │  │
    │                   │ Emit:core:plugin:started        │  │
    │                   ├──────────────────────────────────┤►│
    │                   │◄─────────────────────────────────┘  │
    │                   │                     │               │
    │                   │ Emit:core:start:complete
    │                   ├───────────────────────────────────►│
    │                   │                     │               │
    │ .stop()           │                     │               │
    ├──────────────────►│                     │               │
    │                   │ [Similar to start, reverse order]  │
    │                   │                     │               │
    │ .destroy()        │                     │               │
    ├──────────────────►│                     │               │
    │                   │ [Similar, cleanup & clear]         │
    │                   │                     │               │
```

---

## 3. EVENT-DRIVEN DATA FLOW

```
┌──────────────────────────────────────────────────────────────────────┐
│                       DATA FLOW: Event-Driven                        │
└──────────────────────────────────────────────────────────────────────┘

[User Input] ──────────┐
                       │
                       ▼
        ┌─────────────────────────────┐
        │   [KeyboardPlugin]          │
        │  (listens to raw keyboard)  │
        │                             │
        │  - Tracks pressed keys      │
        │  - Detects combinations     │
        │  - Records user actions     │
        │  - Emits intent events      │
        └────────────┬────────────────┘
                     │
                     ├─► core.recordAction()
                     │        │
                     │        ▼
                     │   [UserSessionHistory]
                     │   - Add to circular buffer
                     │   - Emit: history:action:recorded
                     │
                     ├─► core.eventBus.emit('intent:navigate_left')
                     │        │
                     │        ▼
        ┌────────────────────────────────────────┐
        │        [EventBus] - Dispatch           │
        │                                        │
        │  1. Check circuit breaker              │
        │  2. Apply middleware chain             │
        │  3. Call all registered handlers       │
        │  4. Update event history               │
        │  5. Update stats                       │
        └────────────┬───────────────────────────┘
                     │
         ┌───────────┼───────────┐
         │           │           │
         ▼           ▼           ▼
    [Handler A]  [Handler B]  [Handler C]
         │           │           │
         └─────┬─────┴─────┬─────┘
               │           │
               ▼           ▼
      [DomRendererPlugin] [other handlers]
      - Listen to intents │
      - Update DOM state │
      - Add CSS classes  │
      - Emit render event│
               │
               ▼
    ┌──────────────────────────┐
    │   [AppState]             │
    │ .setState(path, value)   │
    │                          │
    │ 1. Snapshot prev state   │
    │ 2. Apply updates         │
    │ 3. Add to history        │
    │ 4. Emit state:changed    │
    │ 5. Call watchers         │
    │ 6. Update computed props │
    └──────────────┬───────────┘
                   │
                   ├─► EventBus.emit('state:changed')
                   │        │
                   │        ▼
                   │   [State Watchers]
                   │   - Sync mode: call immediately
                   │   - Debounce mode: wait N ms
                   │        │
                   │        ▼
                   │   [Can dispatch more actions]
                   │
                   └─► EventBus.emit('state:{key}:changed')
                            │
                            ▼
                   [More plugin handlers]
```

---

## 4. STATE WATCHER FLOW (DEBOUNCE vs SYNC)

```
User modifies state multiple times:

setState('nav.layer', 1)  ─┐
setState('nav.layer', 2)  ─┼─► state.setState() called
setState('nav.layer', 3)  ─┤   (all synchronously)
                          ─┘

                ▼

        [WatcherCallback registered]
        with options: { mode: 'debounce', debounceMs: 100 }

        ┌─────────────────────────────────┐
        │   SYNC MODE (default)           │
        │                                 │
        │ .setState('nav.layer', 1)       │
        │ ├─► Call watcher immediately    │
        │ │   watcher(1)                  │
        │ └─► Emit 'state:changed'        │
        │                                 │
        │ .setState('nav.layer', 2)       │
        │ ├─► Call watcher immediately    │
        │ │   watcher(2)                  │
        │ └─► Emit 'state:changed'        │
        │                                 │
        │ .setState('nav.layer', 3)       │
        │ ├─► Call watcher immediately    │
        │ │   watcher(3)                  │
        │ └─► Emit 'state:changed'        │
        │                                 │
        │ Result: Watcher called 3 times  │
        └─────────────────────────────────┘

        ┌─────────────────────────────────┐
        │  DEBOUNCE MODE                  │
        │                                 │
        │ .setState('nav.layer', 1)       │
        │ ├─► Schedule callback in 100ms  │
        │ │   timeout1 = setTimeout(...)  │
        │ └─► Emit 'state:changed'        │
        │     (watcher not called yet)    │
        │                                 │
        │ .setState('nav.layer', 2) [20ms later]
        │ ├─► Clear timeout1              │
        │ ├─► Schedule new timeout in 100ms
        │ │   timeout2 = setTimeout(...)  │
        │ └─► Emit 'state:changed'        │
        │     (watcher still not called)  │
        │                                 │
        │ .setState('nav.layer', 3) [40ms later]
        │ ├─► Clear timeout2              │
        │ ├─► Schedule new timeout in 100ms
        │ │   timeout3 = setTimeout(...)  │
        │ └─► Emit 'state:changed'        │
        │     (watcher still not called)  │
        │                                 │
        │ [After 100ms of no updates]     │
        │ ├─► timeout3 fires              │
        │ └─► Call watcher with value 3   │
        │     watcher(3)                  │
        │                                 │
        │ Result: Watcher called 1 time   │
        │ with the LAST value             │
        └─────────────────────────────────┘

Use case:
  SYNC: When you need immediate reaction (UI rendering)
  DEBOUNCE: When you want to batch updates (expensive calculations)
```

---

## 5. APPSTATE INTERNAL UPDATE MECHANISM

```
Call: state.setState('navigation.currentLayer', 5, { merge: true })

        ▼

    Parse input:
    - pathOrUpdates = 'navigation.currentLayer'
    - value = 5
    - options = { merge: true }

        ▼

    Convert to updates object:
    {
      navigation: {
        currentLayer: 5
      }
    }

        ▼

    Snapshot previous state (for history & events)
    previousState = JSON.parse(JSON.stringify(this.state))

        ▼

    Apply updates via _deepMerge():
    this.state = _deepMerge(currentState, updates)
    
    Result: Only navigation.currentLayer changes,
            other navigation properties preserved

        ▼

    Add to history (circular buffer):
    stateHistory.unshift(previousState)
    if (stateHistory.length > 50) {
      stateHistory.pop()
    }

        ▼

    Emit 'state:changed' event:
    eventBus.emit('state:changed', {
      previous: previousState,
      current: newState,
      updates: updates,
      source: 'AppState'
    })

        ▼

    Emit domain-specific events:
    eventBus.emit('state:navigation:changed', {
      previous: previousState.navigation,
      current: newState.navigation,
      source: 'AppState'
    })

        ▼

    Call registered watchers:
    for each watcher on 'navigation.currentLayer':
      if mode === 'debounce':
        schedule callback after debounceMs
      else:
        call callback immediately with new value

        ▼

    Update computed properties:
    computed.isNavigating = !state.navigation.isTransitioning
    computed.canNavigate = !isTransitioning && !isIdle
    etc.
    
    Emit 'state:computed:updated' event

        ▼

    (Optional) Watchers may call setState() again,
    triggering the entire flow recursively
    (Circuit breaker in EventBus prevents infinite loops)
```

---

## 6. CIRCUIT BREAKER: LOOP DETECTION

```
Problem: Event handlers can emit events that trigger themselves

Example:
  eventBus.on('state:changed', () => {
    state.setState(...)  // Triggers 'state:changed' again!
  })

        ▼

Solution: Circuit Breaker (built into EventBus)

    emit('state:changed')
        │
        ▼
    ┌──────────────────────────────┐
    │ Check circuit breaker        │
    ├──────────────────────────────┤
    │ currentDepth = 0             │
    │ eventChain = []              │
    │ maxCallDepth = 100           │
    │ maxChainLength = 50          │
    └──────────────┬───────────────┘
                   │
                   ├─ callDepthMap['state:changed'] = 0
                   ├─ currentDepth >= maxCallDepth? NO ─► Continue
                   │
                   └─ eventChain = ['state:changed']
                      lastIndexOf('state:changed') = 0
                      hasCycle? NO ─► Continue
        │
        ▼
    Call all handlers for 'state:changed'
    
    Handler: eventBus.emit('state:changed')
        │
        ▼
    callDepthMap['state:changed']++  // 0 -> 1
    eventChain.push('state:changed') // ['state:changed', 'state:changed']
        │
        ▼
    ┌──────────────────────────────┐
    │ Check circuit breaker again  │
    ├──────────────────────────────┤
    │ currentDepth = 1             │
    │ eventChain.length = 2        │
    │ maxCallDepth exceeded? NO    │
    │ Cycle detected?              │
    │   lastIndexOf = 0            │
    │   length >= maxChainLength?  │
    │   2 >= 50? NO ─► Continue    │
    └──────────────┬───────────────┘
                   │
                   ▼
    [Many more nested emits...]
    
    Eventually:
    ┌──────────────────────────────┐
    │ Check circuit breaker        │
    ├──────────────────────────────┤
    │ currentDepth = 100           │
    │ currentDepth >= maxCallDepth?│
    │ YES! ─► REJECT               │
    │                              │
    │ Emit('system:circuit-breaker', {
    │   type: 'max_depth_exceeded',
    │   eventName: 'state:changed',
    │   depth: 100
    │ })                           │
    │                              │
    │ Return false (stop propagation)
    └──────────────┬───────────────┘
                   │
                   ▼
    [Prevents system crash]
```

---

## 7. PLUGIN PRIORITY: PARALLEL vs SEQUENTIAL

```
Registration Order:
  register(KeyboardPlugin, priority: 100)
  register(DomRendererPlugin, priority: 100)
  register(LoggerPlugin, priority: 50)
  register(AnalyticsPlugin, priority: 20)

After sorting by priority (highest first):
  [
    KeyboardPlugin (100),
    DomRendererPlugin (100),
    LoggerPlugin (50),
    AnalyticsPlugin (20)
  ]

During .init():

  ┌─────────────────────────────────────┐
  │ CRITICAL PLUGINS (priority >= 100)  │
  │ Initialized in PARALLEL             │
  └─────────────────────────────────────┘
  
  Promise.all([
    KeyboardPlugin.init(core),
    DomRendererPlugin.init(core)
  ])
  
  ┌──────────────────┬──────────────────┐
  │ KeyboardPlugin   │  DomRendererPlugin│
  │ .init()          │  .init()         │
  │  │               │   │              │
  │  ├─ Bind events  │   ├─ Find target │
  │  │               │   │              │
  │  └─ Ready        │   └─ Ready       │
  │   (300ms)        │    (100ms)       │
  └──────────────────┴──────────────────┘
  
  Both finish in max(300, 100) = 300ms
  
  ┌─────────────────────────────────────┐
  │ core:init:complete emitted          │
  │ (application is now initialized)    │
  └─────────────────────────────────────┘
  
  ┌─────────────────────────────────────┐
  │ DEFERRED PLUGINS (priority < 100)   │
  │ Initialized in BACKGROUND           │
  │ (Non-blocking, parallel)            │
  └─────────────────────────────────────┘
  
  Promise.all([
    LoggerPlugin.init(core),
    AnalyticsPlugin.init(core)
  ])
    (running in background, app continues)
  
  ┌──────────────────┬──────────────────┐
  │ LoggerPlugin     │  AnalyticsPlugin │
  │ .init()          │  .init()         │
  │  │               │   │              │
  │  ├─ Setup        │   ├─ Load model  │
  │  │               │   │              │
  │  └─ Ready        │   └─ Ready       │
  │   (50ms)         │    (2000ms)      │
  └──────────────────┴──────────────────┘
  
  ┌─────────────────────────────────────┐
  │ core:deferred:ready emitted         │
  │ (after both complete)               │
  └─────────────────────────────────────┘

During .start():

  ┌─────────────────────────────────────┐
  │ ALL PLUGINS started SEQUENTIALLY    │
  │ (in order of priority)              │
  └─────────────────────────────────────┘
  
  await KeyboardPlugin.start()
    │
    ├─ Attach window listeners
    └─ Ready (10ms)
  
  await DomRendererPlugin.start()
    │
    ├─ Find DOM elements
    └─ Ready (20ms)
  
  await LoggerPlugin.start()
    │
    └─ Ready (5ms)
  
  await AnalyticsPlugin.start()
    │
    └─ Ready (10ms)
  
  Total: 10 + 20 + 5 + 10 = 45ms
  (Sequential, but fast)

Why?
  - init() parallel: Maximize startup speed
  - start() sequential: Ensure clean ordering
  - Deferred init: Non-critical work doesn't block app
```

---

## 8. PROPOSED REDUX-LIKE STORE INTEGRATION

```
Current Flow:
  [Plugin] → state.setState() → [Watcher] → state.setState() (potential loop)

Proposed Flow:
  [Plugin] → dispatch(action) → [Reducer] → state.setState() → [Events]

        ┌─────────────────────────────────────────────┐
        │         Redux-like Integration              │
        └─────────────────────────────────────────────┘

[Plugin]
    │
    │ core.dispatch({
    │   type: 'NAVIGATE_LEFT',
    │   payload: { duration: 350 }
    │ })
    │
    ▼

┌────────────────────────────────────┐
│ [Redux Middleware Chain]           │
│                                    │
│ 1. Logging middleware              │
│    - Log action type & payload     │
│                                    │
│ 2. Analytics middleware            │
│    - Track user behavior           │
│                                    │
│ 3. Async middleware (thunks)       │
│    - Fetch data, async operations  │
│                                    │
│ 4. Time-travel middleware          │
│    - Record actions for replay     │
└────────────┬───────────────────────┘
             │
             ▼

┌────────────────────────────────────┐
│ [Reducer Factory]                  │
│                                    │
│ switch (action.type) {             │
│   case 'NAVIGATE_LEFT':            │
│     return {                       │
│       ...state,                    │
│       navigation: {                │
│         ...state.navigation,       │
│         currentLayer: layer - 1    │
│       }                            │
│     }                              │
│ }                                  │
└────────────┬───────────────────────┘
             │
             ▼

┌────────────────────────────────────┐
│ [AppState.setState()]              │
│                                    │
│ - Apply reducer output             │
│ - Update state                     │
│ - Add to history                   │
│ - Emit 'state:changed'             │
│ - Call watchers                    │
│ - Update computed properties       │
└────────────┬───────────────────────┘
             │
             ▼

┌────────────────────────────────────┐
│ [EventBus - Action Dispatch Event] │
│                                    │
│ emit('action:dispatched', {        │
│   type: 'NAVIGATE_LEFT',           │
│   payload: {...},                  │
│   previous: previousState,         │
│   current: newState,               │
│   timestamp: now,                  │
│   source: 'core'                   │
│ })                                 │
└────────────┬───────────────────────┘
             │
             ▼

[All Event Handlers]
│
├─► DomRendererPlugin listener
│   └─► Updates UI based on state
│
├─► StateWatcher listener
│   └─► Reacts to specific state changes
│
└─► Analytics listener
    └─► Tracks state transitions

Benefits:
  ✓ All state changes go through reducers
  ✓ Clear action history (not just state snapshots)
  ✓ Middleware for cross-cutting concerns
  ✓ Time-travel debugging (replay actions)
  ✓ Redux DevTools integration
  ✓ Testable reducers
```

---

## 9. APPSTATE COMPUTED PROPERTIES

```
┌─────────────────────────────────────────────────────┐
│           COMPUTED PROPERTIES                       │
│                                                     │
│ state.computed: ComputedProperties {               │
│   isNavigating: boolean;                           │
│   canNavigate: boolean;                            │
│   isInputReady: boolean;                           │
│ }                                                   │
└─────────────────────────────────────────────────────┘

These are NOT stored in state, but derived on-the-fly:

state.computed.isNavigating
  = !state.navigation.isTransitioning

state.computed.canNavigate
  = !state.navigation.isTransitioning && !state.system.isIdle

state.computed.isInputReady
  = state.system.mediaPipeReady || state.input.keyboardEnabled

Implementation:
  Object.defineProperty(computed, 'isNavigating', {
    get: () => !this.get('navigation.isTransitioning', false)
  })

Every time you access:
  state.computed.isNavigating

The getter function runs:
  - Reads current state.navigation.isTransitioning
  - Returns opposite value

Benefits:
  ✓ Always up-to-date with state changes
  ✓ No manual synchronization needed
  ✓ Pure logic, easy to test
  ✓ Efficient (only computed when accessed)
```

---

## 10. FULL REQUEST LIFECYCLE EXAMPLE

```
User presses LEFT ARROW key

        ▼

    ┌────────────────────────────────────┐
    │ KeyboardPlugin                     │
    │ Window listener: 'keydown' event   │
    └────────────────────┬───────────────┘
                         │
                         ▼
    _onKeyDown(event: KeyboardEvent)
    │
    ├─ key = 'ArrowLeft'
    ├─ timestamp = 1000
    │
    ├─ Check if combo? NO
    │
    ├─ core.eventBus.emit('keyboard:keydown', {
    │   key: 'ArrowLeft',
    │   code: 'ArrowLeft',
    │   ...
    │ })
    │
    └─ Check if navigation intent?
       └─ YES: emit('intent:navigate_left', {
          direction: 'left',
          timestamp: 1000
        })
                         │
                         ▼
    ┌────────────────────────────────────┐
    │ EventBus - intent:navigate_left    │
    │                                    │
    │ 1. Circuit breaker check           │
    │    callDepth = 0, OK              │
    │ 2. Apply middleware               │
    │ 3. Call handlers (if any)         │
    │ 4. Add to history                 │
    │ 5. Update stats                   │
    └────────────┬───────────────────────┘
                 │
                 ├─► DomRendererPlugin listener
                 │    │
                 │    └─ onNavigate(event)
                 │         │
                 │         └─ update DOM, move card
                 │              │
                 │              └─ core.eventBus.emit('intent:accepted')
                 │
                 ├─► LoggerPlugin listener
                 │    │
                 │    └─ logger.info('Navigation intent: left')
                 │
                 └─► App logger listener
                      │
                      └─ Log to console

At same time:
    KeyboardPlugin._onKeyDown continues
    │
    └─ core.recordAction({
         id: 'uuid',
         timestamp: 1000,
         type: 'keyboard:navigate_left',
         success: true,
         duration_ms: 10  // How long intent took to dispatch
       })
                         │
                         ▼
    ┌────────────────────────────────────┐
    │ UserSessionHistory                 │
    │                                    │
    │ buffer.push(action)                │
    │ if (buffer.length > 100)           │
    │   buffer.shift()  // Remove oldest │
    └────────────┬───────────────────────┘
                 │
                 ▼
    ┌────────────────────────────────────┐
    │ EventBus - history:action:recorded │
    │                                    │
    │ Listeners notified of action       │
    └────────────────────────────────────┘

Somewhere, a reducer processes this:
    dispatch({
      type: 'NAVIGATE_LEFT',
      payload: {
        previousLayer: 1,
        newLayer: 0,
        timestamp: 1000
      }
    })
                         │
                         ▼
    ┌────────────────────────────────────┐
    │ Reducer                            │
    │                                    │
    │ return {                           │
    │   ...state,                        │
    │   navigation: {                    │
    │     ...state.navigation,           │
    │     currentLayer: 0,               │
    │     isTransitioning: true          │
    │   }                                │
    │ }                                  │
    └────────────┬───────────────────────┘
                 │
                 ▼
    ┌────────────────────────────────────┐
    │ AppState.setState(reducerOutput)   │
    │                                    │
    │ 1. Snapshot: previousState         │
    │ 2. Merge: state = reducerOutput    │
    │ 3. History: add previousState      │
    │ 4. Emit: state:changed             │
    │ 5. Watchers:                       │
    │    - 'navigation' watchers fire    │
    │    - 'navigation.currentLayer'     │
    │    - 'navigation.isTransitioning'  │
    │ 6. Computed: update canNavigate    │
    └────────────┬───────────────────────┘
                 │
                 ▼
    [All event handlers run again]
         (potential for new actions/state updates)

Final state:
    navigation: {
      currentLayer: 0,     ← Changed!
      isTransitioning: true ← Changed!
      ...other fields unchanged
    }

History recorded:
    [
      { ...previous state },  // Most recent
      { ...before that },
      ...
    ]

Available for time-travel debugging:
    state.timeTravel(1)  // Go back 1 state
    state.getHistory(5)  // Show last 5 states

Total time: ~50ms (depends on handler implementations)
```

---

