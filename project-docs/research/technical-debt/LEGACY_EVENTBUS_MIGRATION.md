# Legacy EventBus Migration Plan

**Status**: In Progress (Sprint 3 completed, Sprint 4+ remaining)  
**Target Completion**: v4.0.0  
**Last Updated**: November 12, 2025

---

## Executive Summary

Navigator v3.0 introduced a **Redux-like Unidirectional Data Flow** architecture with a centralized Store. The legacy `EventBus` and `AppState` systems are now **deprecated** but maintained for backward compatibility during the migration phase.

This document tracks all remaining dependencies on the legacy system and provides a clear migration path for each component.

---

## Migration Strategy: The "Strangler Fig" Pattern

We're using a **gradual migration** approach:

1. ✅ **New code uses Store-first**: All new features dispatch Actions and read from Store
2. 🔄 **Legacy Bridge active**: Translates EventBus events → Store actions automatically
3. 🎯 **Component-by-component migration**: Migrate plugins one sprint at a time
4. 🗑️ **Remove legacy in v4.0**: Once all dependencies cleared, delete EventBus/AppState

---

## Migration Progress

### ✅ Completed (Sprint 1-3)

| Component | Status | Sprint | Details |
|-----------|--------|--------|---------|
| **Store Infrastructure** | ✅ Complete | Sprint 1 | createStore, combineReducers, applyMiddleware |
| **Core State Slices** | ✅ Complete | Sprint 1 | navigation, cognitive, input, ui, history, session |
| **Middleware Pipeline** | ✅ Complete | Sprint 1 | cognitiveMiddleware, historyMiddleware, loggerMiddleware |
| **Navigation Actions** | ✅ Complete | Sprint 2 | navigate(), setAnimating(), setLayer() |
| **KeyboardPlugin (partial)** | ✅ Complete | Sprint 2 | Dispatches select/cancel actions |
| **DomRendererPlugin (cognitive)** | ✅ Complete | Sprint 3 | Subscribes to Store for cognitive state |
| **Test Coverage** | ✅ Complete | All | 386 tests passing |

---

## Remaining Work

### 🔴 HIGH PRIORITY: Core Lifecycle Events

**Component**: `NavigatorCore.ts`

**Current State**: Emits lifecycle events via EventBus

**Events**:
- `core:init:start`, `core:init:complete`
- `core:start:begin`, `core:start:complete`
- `core:stop:begin`, `core:stop:complete`
- `core:destroy:begin`, `core:destroy:complete`
- `core:plugin:registered`, `core:plugin:initialized`, `core:plugin:started`, `core:plugin:stopped`, `core:plugin:destroyed`
- `core:deferred:ready`
- `core:error`

**Migration Strategy**:
1. Create new `system` state slice:
   ```typescript
   interface SystemState {
     lifecycle: 'uninitialized' | 'initializing' | 'ready' | 'starting' | 'running' | 'stopping' | 'stopped' | 'error';
     plugins: {
       registered: string[];
       initialized: string[];
       started: string[];
       deferred: { ready: boolean; count: number };
     };
     error: { message: string; timestamp: number } | null;
   }
   ```

2. Create action creators:
   ```typescript
   // packages/core/src/actions/system.ts
   export const setLifecycleState = (state) => ({ type: 'system/SET_LIFECYCLE', payload: state });
   export const registerPlugin = (name) => ({ type: 'system/PLUGIN_REGISTERED', payload: name });
   ```

3. Replace `eventBus.emit('core:*')` with `store.dispatch(setLifecycleState(...))`

4. Update consumers to subscribe to `state.system` instead of EventBus

**Affected Code**:
- `packages/core/src/NavigatorCore.ts` (lines 196, 225, 235, 268, 296, 308, 318, 336, 347, 354, 367, 390, 433, 495, 528, 554, 570, 591, 612)

**Estimated Effort**: 1 sprint

---

### 🟡 MEDIUM PRIORITY: Keyboard Combinations

**Component**: `KeyboardPlugin.ts`

**Current State**: Emits `keyboard:combo` events

**Migration Strategy**:
1. Create action creator:
   ```typescript
   // packages/plugin-keyboard/src/actions.ts
   export const keyboardCombo = (keys: string[], modifiers: object) => ({
     type: 'input/KEYBOARD_COMBO',
     payload: { keys, modifiers }
   });
   ```

2. Update `input` reducer to handle combos:
   ```typescript
   case 'input/KEYBOARD_COMBO':
     return {
       ...state,
       keyboard: {
         ...state.keyboard,
         lastCombo: action.payload,
         lastComboTimestamp: Date.now()
       }
     };
   ```

3. Replace `eventBus.emit('keyboard:combo')` with `store.dispatch(keyboardCombo(...))`

**Affected Code**:
- `packages/plugin-keyboard/src/KeyboardPlugin.ts` (line 136)

**Estimated Effort**: 1-2 days

---

### 🟡 MEDIUM PRIORITY: Predictive Intent System

**Component**: `DomRendererPlugin.ts`

**Current State**: Listens to `intent:prediction` events

**Migration Strategy**:
1. Create `prediction` state slice:
   ```typescript
   interface PredictionState {
     intent: string | null;
     confidence: number;
     timestamp: number | null;
   }
   ```

2. Create middleware `predictionMiddleware.ts`:
   - Analyzes action patterns
   - Predicts next likely action
   - Dispatches `prediction/SET_PREDICTION` action

3. DomRendererPlugin subscribes to `state.prediction` instead of EventBus

**Affected Code**:
- `packages/plugin-dom-renderer/src/DomRendererPlugin.ts` (line 116)
- New: `packages/core/src/middleware/predictionMiddleware.ts`

**Estimated Effort**: 3-5 days

---

### 🟢 LOW PRIORITY: Mock Gesture Plugin

**Component**: `MockGesturePlugin.ts`

**Current State**: Emits gesture and intent events via EventBus

**Migration Strategy**:
1. Follow same pattern as real `GesturePlugin` migration (Sprint 3)
2. Dispatch `gestureDetected()` and navigation actions
3. Remove all EventBus emits

**Affected Code**:
- `packages/plugin-mock-gesture/src/MockGesturePlugin.ts` (lines 118, 132)

**Estimated Effort**: 2-3 days

---

### 🟢 LOW PRIORITY: AppState Integration

**Component**: `AppState.ts`

**Current State**: Emits state change events

**Events**:
- `state:changed`
- `state:reset`
- `state:timetravel`
- `state:restored`
- `state:{key}:changed`
- `state:computed:updated`

**Migration Strategy**:
1. **Option A (Recommended)**: Deprecate AppState entirely
   - AppState was a pre-Store state manager
   - All functionality now covered by Store
   - Remove in v4.0

2. **Option B**: Make AppState a Store facade
   - AppState becomes a wrapper around Store
   - `setState()` → `store.dispatch()`
   - `getState()` → `store.getState()`
   - Maintains API compatibility

**Recommendation**: Option A (clean break in v4.0)

**Affected Code**:
- `packages/core/src/AppState.ts` (lines 314, 343, 376, 430, 439, 511)
- Consumers in `js/` legacy codebase

**Estimated Effort**: Deprecation (immediate), Removal (v4.0)

---

### 🔵 INFO: Legacy JavaScript Plugins

**Component**: `js/plugins/*`

**Current State**: Pure JavaScript plugins using EventBus

**Files**:
- `js/plugins/output/DomRendererPlugin.js`
- `js/plugins/output/AudioFeedbackPlugin.js`
- `js/plugins/input/GestureDetector.js` (if exists)

**Migration Strategy**:
1. **Audit**: Determine which plugins are still in use
2. **Rewrite**: Convert active plugins to TypeScript packages
3. **Archive**: Move unused plugins to `js/archived/`
4. **Document**: Update plugin registry to TypeScript-only

**Estimated Effort**: 1-2 weeks (depends on plugin count)

---

## Deprecation Timeline

| Version | Date | Action |
|---------|------|--------|
| **v3.0** | Nov 2025 | ✅ Store introduced, legacy marked @deprecated |
| **v3.1** | Q1 2026 | 🎯 Core lifecycle migrated, keyboard combos migrated |
| **v3.2** | Q2 2026 | 🎯 Prediction system migrated, legacy JS plugins rewritten |
| **v3.3** | Q3 2026 | 🎯 All plugins migrated, EventBus passive (no emits) |
| **v4.0** | Q4 2026 | 🗑️ EventBus.ts and AppState.ts deleted |

---

## Testing Strategy

For each migration:

1. **Before**: Write integration test using EventBus pattern
2. **During**: Ensure Legacy Bridge keeps test passing
3. **After**: Rewrite test using Store pattern
4. **Cleanup**: Remove EventBus assertions

Example:
```typescript
// Before (EventBus)
test('navigation emits event', () => {
  const spy = vi.fn();
  core.eventBus.on('intent:navigate', spy);
  // trigger navigation
  expect(spy).toHaveBeenCalled();
});

// After (Store)
test('navigation updates state', () => {
  const initialState = core.store.getState().navigation.currentCard;
  // trigger navigation
  const newState = core.store.getState().navigation.currentCard;
  expect(newState).not.toBe(initialState);
});
```

---

## Contributing

To help with this migration:

1. Pick an item from "Remaining Work"
2. Create feature branch: `feat/migrate-{component}-to-store`
3. Follow migration strategy outlined above
4. Update this document: move item from "Remaining" to "Completed"
5. Submit PR with tests

**Questions?** Open an issue with label `technical-debt/legacy-migration`

---

## References

- [ARCHITECTURE.md](../docs/ARCHITECTURE.md) - Unidirectional Flow architecture
- [SPRINT_1_UNIDIRECTIONAL_FLOW_COMPLETION.md](../SPRINT_1_UNIDIRECTIONAL_FLOW_COMPLETION.md) - Store implementation details
- [Store API Documentation](../docs/API_STORE.md) (if exists)

---

**Remember**: The goal is not to rush. Each migration must maintain backward compatibility and pass all tests. Quality over speed.
