# Navigator SDK - Architecture Transition Plan

**UPDATED**: November 10, 2024 - Phase 2 Optimizations Applied ✅  
**See**: [PHASE2_OPTIMIZATION.md](./PHASE2_OPTIMIZATION.md) for acceleration strategies

---

## Phase 1: Foundation (Current Sprint) ✅ **COMPLETE**

### Deliverables
- [x] Monorepo structure (pnpm workspaces)
- [x] @navigator.menu/types - TypeScript definitions
- [x] NIP v1.0 Protocol specification
- [x] @navigator.menu/pdk - Plugin Development Kit
- [x] @navigator.menu/cli - Scaffolding tools
- [x] Implementation Report P2

### Artifacts
- ✅ `pnpm-workspace.yaml` - Workspace configuration
- ✅ `packages/*/` - Package structure (5 packages)
- ✅ `NIP.md` - Protocol specification (40+ events)
- ✅ `IMPLEMENTATION_REPORT_P2.md` - Architecture documentation
- ✅ `docs/COOKBOOK.md` - Practical recipes (5 complete examples)
- ✅ `PHASE1_COMPLETE.md` - Phase 1 summary
- ✅ `PHASE2_OPTIMIZATION.md` - **NEW**: Acceleration strategies

**Status**: 🎉 **ALL PHASE 1 TASKS COMPLETE** (8/8)

---

## Phase 2: Core Migration (Next Sprint)

### Objectives
Extract framework-agnostic logic from monolith to `@navigator.menu/core`:

1. **EventBus.js → @navigator.menu/core/EventBus**
   - Pure event system
   - No DOM dependencies
   - Type-safe with TypeScript
   - Node.js testable

2. **AppState.js → @navigator.menu/core/AppState**
   - Centralized state management
   - Observable pattern
   - Framework-agnostic

3. **NavigatorCore.js → @navigator.menu/core/NavigatorCore**
   - Plugin lifecycle management
   - Dependency injection
   - Performance monitoring

### Strategy: **Strangler Fig Pattern** 🌳

Instead of maintaining dual versions (monolith + packages), **progressively replace** monolith code with package imports:

1. **Extract** module to `@navigator.menu/core`
2. **Delete** old monolith file
3. **Replace** with import: `import { EventBus } from '@navigator.menu/core'`
4. **Repeat** until monolith is just an assembly shell

**Benefits**:
- ✅ No duplicate code to maintain
- ✅ No complex compatibility layers
- ✅ Clear migration path (delete old → import new)
- ✅ Monolith becomes progressively thinner

### Test-Driven Extraction Workflow

For each module (e.g., EventBus):

```bash
# STEP 1: Write integration tests for CURRENT monolith behavior
vitest tests/legacy/EventBus.spec.js

# STEP 2: Extract to @navigator.menu/core
mv js/EventBus.js packages/core/src/EventBus.ts
# Convert to TypeScript, add types

# STEP 3: Build package
cd packages/core && pnpm build

# STEP 4: Replace monolith import
# OLD: import { EventBus } from './EventBus.js'
# NEW: import { EventBus } from '@navigator.menu/core'

# STEP 5: Run same tests → MUST PASS
vitest tests/legacy/EventBus.spec.js

# STEP 6: Delete old file
rm js/EventBus.js  # Now fully replaced
```

**Safety Net**: Tests written in STEP 1 become regression tests that verify extraction didn't break behavior.

### Phase 2 Quick Wins 🎯

**Week 1: EventBus Extraction**
- Day 1-2: Write comprehensive tests for current EventBus behavior
- Day 3-4: Extract to TypeScript, add type definitions
- Day 5: Replace monolith imports, verify tests pass

**Week 2: AppState Extraction**
- Day 1-2: Write tests for reactive state management
- Day 3-4: Extract to TypeScript with improved type safety
- Day 5: Replace monolith imports, verify tests pass

**Outcome**: By Week 2, monolith already using `@navigator.menu/core` for 2/3 core modules ✅

## Phase 3: Plugin Extraction

### Extraction Order: **Bottom-Up by Dependencies** 📊

Extract plugins in dependency order (least dependent → most dependent):

#### Tier 1: Input Plugins (No Dependencies)
1. **@navigator.menu/plugin-keyboard** - Emits input events only
2. **@navigator.menu/plugin-gesture** - Emits gesture events only
   - Dependencies: `@navigator.menu/core` only
   - Complexity: Low ⭐
   - Risk: Minimal

#### Tier 2: Logic Plugins (Depend on Core + Input)
3. **@navigator.menu/plugin-cognitive** - Cognitive state analyzer
4. **@navigator.menu/plugin-intent-predictor** - Intent prediction
   - Dependencies: `@navigator.menu/core` + listen to input events
   - Complexity: Medium ⭐⭐
   - Risk: Low

#### Tier 3: Output Plugins (Depend on Core + Logic)
5. **@navigator.menu/plugin-dom-renderer** - DOM manipulation
6. **@navigator.menu/plugin-audio** - Audio feedback
   - Dependencies: `@navigator.menu/core` + listen to intent events
   - Complexity: Medium ⭐⭐
   - Risk: Medium (DOM/Audio API interactions)

#### Tier 4: Feature Orchestration (Depend on Everything)
7. **@navigator.menu/plugin-onboarding** - User onboarding flow
8. **@navigator.menu/plugin-idle** - Idle system detection
   - Dependencies: `@navigator.menu/core` + multiple event types
   - Complexity: High ⭐⭐⭐
   - Risk: High (orchestration logic)

### Extraction Template

Each plugin follows this structure:

```json
{
  "name": "@navigator.menu/plugin-keyboard",
  "peerDependencies": {
    "@navigator.menu/core": "^2.0.0"
  },
  "exports": {
    ".": "./dist/index.js",
    "./types": "./dist/types.d.ts"
  }
}
```

### Pattern
```typescript
// packages/plugin-keyboard/src/index.ts
import { BasePlugin } from '@navigator.menu/pdk';

export class KeyboardPlugin extends BasePlugin {
  constructor() {
    super('keyboard-input');
  }

  async init() {
    // Setup keyboard listeners
  }
}
```

**Benefits of Bottom-Up Order**:
- ✅ Each extraction is isolated
- ✅ No circular dependencies
- ✅ Earlier extractions test infrastructure for later ones
- ✅ Can ship Tier 1 plugins while Tier 4 still in monolith

## Phase 4: Framework Wrappers

### Strategy: **"Bring Your Own State" (v0.1)**

First version focuses on **lifecycle management only**. User manages reactive state.

### @navigator.menu/react (v0.1)
```typescript
import { useRef, useEffect } from 'react';
import { NavigatorCore } from '@navigator.menu/core';

/**
 * Minimal React hook - manages lifecycle only
 * User is responsible for state management
 */
export function useNavigator(config?: NavigatorConfig) {
  const coreRef = useRef<NavigatorCore>();
  
  useEffect(() => {
    coreRef.current = new NavigatorCore(config);
    coreRef.current.init();
    coreRef.current.start();
    
    return () => {
      coreRef.current?.destroy();
    };
  }, []);
  
  return { core: coreRef.current };
}

// Usage (user manages state):
function MyApp() {
  const [layer, setLayer] = useState(0);
  const { core } = useNavigator({ plugins: [...] });
  
  useEffect(() => {
    if (!core) return;
    const unsubscribe = core.state.watch('currentLayer', (newLayer) => {
      setLayer(newLayer);
    });
    return unsubscribe;
  }, [core]);
  
  return <div>Layer: {layer}</div>;
}
```

**Benefits**:
- ✅ Ships in days, not weeks
- ✅ Gives full control to advanced users
- ✅ Easy to understand and debug

**Future (v0.2)**: Add built-in reactive state management

### @navigator.menu/vue (v0.1)
```typescript
import { ref, shallowRef, onMounted, onUnmounted } from 'vue';
import { NavigatorCore } from '@navigator.menu/core';

/**
 * Minimal Vue composable - manages lifecycle only
 */
export function useNavigator(config?: NavigatorConfig) {
  const core = shallowRef<NavigatorCore>();
  
  onMounted(() => {
    core.value = new NavigatorCore(config);
    core.value.init();
    core.value.start();
  });
  
  onUnmounted(() => {
    core.value?.destroy();
  });
  
  return { core };
}

// Usage (user manages state):
const MyComponent = {
  setup() {
    const layer = ref(0);
    const { core } = useNavigator({ plugins: [...] });
    
    watchEffect(() => {
      if (!core.value) return;
      core.value.state.watch('currentLayer', (newLayer) => {
        layer.value = newLayer;
      });
    });
    
    return { layer };
  }
};
```

## Phase 5: Tooling & Developer Experience

### @navigator.menu/cli (Already Implemented ✅)
```bash
# Create new app
npx @navigator.menu/cli create-app my-app

# Create plugin (Future v0.2)
npx @navigator.menu/cli create-plugin my-plugin

# Add to existing project (Future v0.2)
npx @navigator.menu/cli add
```

### @navigator.menu/pdk (Already Implemented ✅)
- ✅ Plugin templates
- ✅ Testing utilities (CoreMock, EventBusMock, AppStateMock)
- ✅ TypeScript definitions
- ✅ Utility functions (debounce, throttle, math helpers)

### Documentation Strategy: **Cookbook > API Reference**

**Priority 1: Recipes (80% of effort)** ✅ **CREATED: [docs/COOKBOOK.md](./docs/COOKBOOK.md)**

People copy working examples, not API docs. Focus on practical recipes:

- ✅ **Image Carousel with Gestures** - Complete swipe-controlled carousel
- ✅ **Video Player with Voice Commands** - Play/pause/volume with voice
- ✅ **Navigator + Three.js** - 3D cube with gesture/keyboard controls
- ✅ **Next.js Integration** - SSR considerations and dynamic imports
- ✅ **Custom Plugin: Shake to Undo** - Device motion API integration

**Coming Soon**:
- Drag & Drop with Navigator
- Multi-touch Zoom Control
- Navigator + D3.js Data Visualization
- Audio Visualizer with Gestures
- VR/AR Integration with WebXR

**Priority 2: API Reference (20% of effort)**

Auto-generate from TypeScript definitions:

```bash
# Use TypeDoc or similar
npx typedoc --out docs/api packages/core/src
```

**Golden Rule**: One working recipe = 100 pages of API docs in terms of value

**See**: [docs/COOKBOOK.md](./docs/COOKBOOK.md) for complete working examples

## Migration Checklist

### Pre-requisites
- [x] Monorepo setup
- [ ] TypeScript configuration
- [ ] Build tooling (tsup, vite)
- [ ] Testing infrastructure (vitest)
- [ ] CI/CD pipelines

### Core Extraction
- [ ] **EventBus** (pure logic)
  - Write legacy tests first
  - Extract to `@navigator.menu/core/EventBus`
  - Replace monolith import
  - Verify tests pass
  - Delete old file
- [ ] **AppState** (state management)
  - Write legacy tests first
  - Extract to `@navigator.menu/core/AppState`
  - Replace monolith import
  - Verify tests pass
  - Delete old file
- [ ] **NavigatorCore** (lifecycle)
  - Write legacy tests first
  - Extract to `@navigator.menu/core/NavigatorCore`
  - Replace monolith import
  - Verify tests pass
  - Delete old file
- [ ] **BasePlugin** (abstract class)
  - Already in PDK ✅
- [ ] **ConfigLoader** (YAML parsing)
  - Write legacy tests first
  - Extract to `@navigator.menu/core/ConfigLoader`
  - Replace monolith import
  - Verify tests pass
  - Delete old file

### Plugin Extraction (Bottom-Up Order)
**Tier 1: Input Plugins** (No dependencies)
1. [ ] **KeyboardInputPlugin** → `@navigator.menu/plugin-keyboard`
2. [ ] **GestureInputPlugin** → `@navigator.menu/plugin-gesture`

**Tier 2: Logic Plugins** (Depend on Core + Input)
3. [ ] **CognitiveModelPlugin** → `@navigator.menu/plugin-cognitive`
4. [ ] **IntentPredictorPlugin** → `@navigator.menu/plugin-intent-predictor`

**Tier 3: Output Plugins** (Depend on Core + Logic)
5. [ ] **DomRendererPlugin** → `@navigator.menu/plugin-dom-renderer`
6. [ ] **AudioFeedbackPlugin** → `@navigator.menu/plugin-audio`

**Tier 4: Feature Orchestration** (Depend on Everything)
7. [ ] **OnboardingPlugin** → `@navigator.menu/plugin-onboarding`
8. [ ] **IdleSystemPlugin** → `@navigator.menu/plugin-idle`

### Validation
- [ ] Each package builds successfully
- [ ] All tests pass
- [ ] Demo apps run with packages
- [ ] External project can use CLI
- [ ] Documentation is complete

## Success Metrics

### Technical
- ✅ Zero breaking changes to existing monolith
- ✅ All packages tree-shakeable (ESM)
- ✅ TypeScript support (d.ts files)
- ✅ <100KB core bundle size
- ✅ 100% test coverage for core

### Developer Experience
- ✅ <5 minutes from `npx` to running app
- ✅ IntelliSense works for all APIs
- ✅ Clear migration path from v1
- ✅ Comprehensive examples
- ✅ Video tutorials

### Ecosystem
- ✅ Published to npm (@navigator.menu/*)
- ✅ Documentation site (docs.navigator.menu)
- ✅ Plugin marketplace
- ✅ Community templates
- ✅ Integration guides (Next.js, Nuxt, SvelteKit)

## Timeline

**Current Sprint (Week 1-2):**
- Foundation setup ✅
- NIP v1.0 specification
- PDK minimum viable version
- CLI scaffolding tools
- Documentation

**Sprint 2 (Week 3-4):**
- Core package extraction
- First plugin migration
- React wrapper
- Integration testing

**Sprint 3 (Week 5-6):**
- Remaining plugins
- Vue/Svelte wrappers
- Performance optimization
- Beta release

**Sprint 4 (Week 7-8):**
- Production hardening
- Security audit
- Documentation finalization
- v2.0.0 release

## Notes

This is an **architectural evolution**, not a rewrite. The monolith remains functional throughout the migration. Each extracted package is independently versioned and published, allowing gradual adoption.

The end goal: **Navigator as a platform**, not just an app.
