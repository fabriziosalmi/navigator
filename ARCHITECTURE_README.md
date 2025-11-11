# NavigatorCore Architecture Documentation

Complete architectural analysis of the NavigatorCore plugin-based event-driven system, with detailed guidance for Redux-like Store migration.

**Generated:** November 11, 2025  
**Total Documentation:** 2,159 lines across 3 comprehensive documents  
**Status:** Ready for implementation

---

## Documentation Files

### 1. ARCHITECTURE_SUMMARY.md (Quick Start)
**Read this first** - 490 lines of executive summary

- Quick navigation to detailed docs
- Core components overview (NavigatorCore, AppState, EventBus, UserSessionHistory)
- Plugin architecture and lifecycle
- Event flow diagrams
- Test structure overview
- Redux migration plan overview
- Architecture strengths and weaknesses
- Key takeaways for migration

**Best for:** Getting a high-level understanding, planning, presentations

---

### 2. ARCHITECTURE_ANALYSIS.md (Deep Dive)
**Read this for details** - 779 lines of technical reference

**Sections:**
1. **NavigatorCore.ts** (607 lines)
   - Constructor and initialization flow
   - Lifecycle methods (init, start, stop, destroy)
   - Plugin management API
   - Event emissions reference
   - Sprint 2 parallel initialization details

2. **AppState.ts** (519 lines)
   - Complete state structure
   - Public API methods with signatures
   - Watcher system (sync vs debounce modes - Sprint 2 Task 2)
   - State emission pattern
   - History and time-travel mechanisms

3. **EventBus.ts** (440 lines)
   - Event system architecture
   - Public API reference
   - Subscription options and priority
   - Wildcard subscriptions
   - Circuit breaker (loop detection)
   - Event middleware/interceptors

4. **Existing Plugins**
   - Plugin interface specification
   - KeyboardPlugin implementation pattern
   - DomRendererPlugin implementation pattern
   - LoggerPlugin implementation pattern

5. **UserSessionHistory**
   - Circular buffer for ML/analytics
   - Action recording pattern
   - Metrics calculation

6. **Test Structure**
   - File organization
   - Test configuration (vitest)
   - Common testing patterns
   - Mock plugin creation

7. **Redux Migration Points**
   - Current data flow problems
   - Proposed Redux-like flow
   - Backward compatibility strategy
   - Pre-migration, during, and post-migration checklists

8. **Quick Reference APIs**
   - NavigatorCore methods
   - AppState methods
   - EventBus methods

**Best for:** Implementation, API documentation, plugin development, migration planning

---

### 3. ARCHITECTURE_DIAGRAMS.md (Visual Reference)
**Read this for flows** - 890 lines of ASCII diagrams and flowcharts

**Diagrams Included:**

1. **High-Level System Architecture**
   - All components and their relationships
   - Plugin orchestration
   - EventBus at the center
   - AppState integration
   - UserSessionHistory connectivity

2. **Plugin Lifecycle Sequence Diagram**
   - registerPlugin() flow
   - Parallel vs sequential initialization
   - Critical vs deferred plugins
   - Start/stop/destroy sequences
   - Event emissions at each stage

3. **Event-Driven Data Flow**
   - User input to DOM update
   - KeyboardPlugin event chain
   - EventBus dispatch
   - Multiple handler execution
   - AppState updates
   - Watcher execution

4. **State Watcher Flow (Sync vs Debounce)**
   - Immediate (sync) mode execution
   - Debounced mode with timeouts
   - Use cases for each mode
   - Performance implications

5. **AppState Internal Update Mechanism**
   - setState() call breakdown
   - Update object creation
   - State merging process
   - History management
   - Event emission sequence
   - Watcher notification
   - Computed property updates

6. **Circuit Breaker Loop Detection**
   - Problem: infinite event loops
   - Solution: circuit breaker implementation
   - maxCallDepth checking
   - Event chain cycle detection
   - Protection against system crash

7. **Plugin Priority System**
   - Registration ordering
   - Priority-based sorting
   - Parallel init (critical plugins)
   - Background init (deferred plugins)
   - Sequential start
   - Timing examples

8. **Redux-like Store Integration**
   - Current flow vs proposed flow
   - Middleware chain
   - Reducer application
   - AppState integration
   - Event emission
   - Computed properties update
   - Benefits summary

9. **Computed Properties**
   - Definition and implementation
   - Getter pattern
   - On-the-fly computation
   - State dependency tracking
   - Benefits

10. **Full Request Lifecycle Example**
    - User keyboard input
    - KeyboardPlugin handling
    - UserSessionHistory recording
    - EventBus dispatch
    - Multiple handler execution
    - AppState update
    - Final state + history

**Best for:** Understanding flows, debugging, presentations, teaching

---

## Quick Facts

### Core Statistics
- **NavigatorCore:** 607 lines
- **AppState:** 519 lines  
- **EventBus:** 440 lines
- **Total core code:** ~2,000 lines of production code
- **Tests:** 5 test files + 3 integration suites
- **Coverage:** 80% threshold

### Key Architectural Decisions
- **Plugin initialization:** Parallel critical (≥100 priority), background deferred (<100)
- **State watchers:** Both sync (immediate) and debounce modes
- **Circuit breaker:** maxCallDepth=100, maxChainLength=50
- **State history:** Max 50 states (hardcoded)
- **Session history:** Configurable circular buffer (default: 100 actions)

### Event Architecture
- **Event structure:** {name, payload, timestamp, source}
- **Handler priority:** Higher = called first
- **Wildcard support:** '*' subscriptions for all events
- **Middleware chain:** Can intercept/transform/block events
- **History:** Max 100 events (configurable)

---

## How to Use This Documentation

### For Architecture Review
1. Read ARCHITECTURE_SUMMARY.md sections: "Core Components Overview" & "Architecture Strengths"
2. Review ARCHITECTURE_DIAGRAMS.md: "High-Level System Architecture"
3. Reference ARCHITECTURE_ANALYSIS.md as needed for details

### For Plugin Development
1. Read ARCHITECTURE_ANALYSIS.md: "Existing Plugins - Architecture Patterns"
2. Review ARCHITECTURE_SUMMARY.md: "Plugin Architecture"
3. Study ARCHITECTURE_DIAGRAMS.md: "Plugin Lifecycle Sequence Diagram"
4. Look at KeyboardPlugin or DomRendererPlugin source code
5. Follow the test patterns from ARCHITECTURE_ANALYSIS.md

### For Redux Migration
1. Read ARCHITECTURE_SUMMARY.md: "Redux-like Store Migration Plan"
2. Review ARCHITECTURE_ANALYSIS.md: "Integration Points for Redux-like Store"
3. Study ARCHITECTURE_DIAGRAMS.md: "Redux-like Store Integration"
4. Review the "Migration Checklist" in ARCHITECTURE_ANALYSIS.md
5. Plan phases using the "Backward Compatibility Strategy"

### For Understanding Event Flow
1. Start with ARCHITECTURE_DIAGRAMS.md: "Event-Driven Data Flow"
2. Trace through "Full Request Lifecycle Example"
3. Reference ARCHITECTURE_ANALYSIS.md: "EventBus.ts" section
4. Check circuit breaker details in ARCHITECTURE_DIAGRAMS.md

### For Testing
1. Read ARCHITECTURE_ANALYSIS.md: "Test Structure and Patterns"
2. Reference ARCHITECTURE_SUMMARY.md: "Test Structure"
3. Look at test files: `/packages/core/tests/*.spec.ts`

---

## Key Integration Points for Redux Migration

### Phase 1: Minimal Impact
- Add `core.dispatch(action)` method
- Keep `core.state.setState()` working
- Both update AppState
- Add action history tracking
- New tests for dispatch flow

### Phase 2: Plugin Migration
- Update KeyboardPlugin to use dispatch
- Update DomRendererPlugin to use dispatch
- Other plugins follow same pattern
- Maintain backward compatibility

### Phase 3: Complete Transition
- Deprecate setState() in plugin API
- Make dispatch the only way to update state
- Redux DevTools integration
- Time-travel replay from actions (not state snapshots)

---

## Architecture Strengths ✅

1. **Plugin System** - Extensible, decoupled architecture
2. **Event-Driven** - Loose coupling via pub-sub
3. **Circuit Breaker** - Built-in protection against event loops
4. **State History** - Time-travel debugging out of the box
5. **Watchers** - Both sync and debounce modes for different use cases
6. **Parallel Init** - Fast startup with priority-based plugin loading
7. **Type-Safe** - Full TypeScript support throughout
8. **Well-Tested** - 80% coverage threshold with integration tests

---

## Architecture Gaps (Redux will fix) ❌

1. **No Action History** - Only state snapshots, not actions
2. **No Middleware Layer** - Hard to insert cross-cutting concerns
3. **Direct Mutations** - setState() scattered across plugins
4. **Watcher Loops** - Even with circuit breaker, watchers can trigger more updates
5. **Hard to Test** - No clear reducer functions to unit test
6. **Limited Time-Travel** - Can only restore previous state, not replay actions
7. **No DevTools** - Can't inspect action/state history in Redux DevTools

---

## Redux Implementation Checklist

- [ ] Choose Redux library (redux, Redux Toolkit, Zustand, Jotai, etc.)
- [ ] Define action types for all domains (navigation, user, system, ui, input, performance)
- [ ] Implement reducer functions for each domain
- [ ] Create Store class with dispatch/subscribe API
- [ ] Add middleware for logging, time-travel, async operations
- [ ] Integrate with EventBus (emit action:dispatched events)
- [ ] Update NavigatorCore.dispatch() method
- [ ] Migrate KeyboardPlugin to use dispatch
- [ ] Migrate DomRendererPlugin to use dispatch
- [ ] Add integration tests for new dispatch flow
- [ ] Update plugin developer documentation
- [ ] Set up Redux DevTools integration (optional but recommended)
- [ ] Deprecate setState() in favor of dispatch (gradual)
- [ ] Complete transition (final cleanup)

---

## File Locations Reference

### Core Source Files
```
packages/core/src/
├── NavigatorCore.ts           (Main orchestrator)
├── AppState.ts                (State management)
├── EventBus.ts                (Event system)
├── types.ts                   (Type definitions)
├── index.ts                   (Public exports)
└── intelligence/
    └── UserSessionHistory.ts  (Action history)
```

### Plugin Examples
```
packages/plugin-keyboard/src/KeyboardPlugin.ts
packages/plugin-dom-renderer/src/DomRendererPlugin.ts
packages/plugin-logger/src/index.ts
```

### Tests
```
packages/core/tests/
├── NavigatorCore.spec.ts
├── AppState.spec.ts
├── EventBus.spec.ts
├── NavigatorCore.plugins.spec.ts
├── UserSessionHistory.spec.ts
└── integration/
    ├── cognitive-intelligence.spec.ts
    ├── CognitiveLoop.integration.spec.ts
    └── CoreStress.integration.spec.ts
```

---

## Document Status

- **ARCHITECTURE_SUMMARY.md** ✅ Complete
- **ARCHITECTURE_ANALYSIS.md** ✅ Complete
- **ARCHITECTURE_DIAGRAMS.md** ✅ Complete
- **ARCHITECTURE_README.md** ✅ Complete (this file)

**All documents are ready for:**
- Architecture review
- Plugin development
- Redux migration planning
- Team presentations
- Future reference

---

## Next Steps

1. **Review** - Read ARCHITECTURE_SUMMARY.md first
2. **Dive Deep** - Reference ARCHITECTURE_ANALYSIS.md as needed
3. **Visualize** - Study ARCHITECTURE_DIAGRAMS.md for flows
4. **Plan** - Use Redux migration checklist to scope work
5. **Implement** - Follow the phased migration strategy
6. **Test** - Use existing test patterns as templates
7. **Document** - Keep plugin developers updated

---

**Generated:** November 11, 2025  
**Ready for:** Production Implementation  
**Maintainer:** Architecture Analysis Team

For questions or clarifications, refer to the source files in `/packages/core/src/` and existing test patterns in `/packages/core/tests/`.
