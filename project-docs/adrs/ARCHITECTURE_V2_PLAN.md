# Navigator v2.0 - Architettura Core & Plugin

## Vision Statement

Trasformare Navigator da applicazione monolitica in un **ecosistema modulare event-driven** che permette di creare esperienze web immersive usando qualsiasi modalità di input (gesture, voce, tastiera, VR) e qualsiasi sistema di output (DOM, Three.js, Canvas, dispositivi IoT).

## Principi Architetturali

### 1. **Separation of Concerns**
- **Core**: Gestisce lifecycle, eventi, stato, plugin registry
- **Input Plugins**: Catturano dati (mani, tastiera, voce) → emettono eventi raw
- **Logic Plugins**: Traducono eventi raw → eventi di intent (navigate_left, zoom_in)
- **Output Plugins**: Ascoltano intent → eseguono azioni (muovere DOM, suonare audio, disegnare effetti)

### 2. **Zero Knowledge**
Il Core non sa nulla di:
- Come vengono rilevate le gesture (MediaPipe/TensorFlow/Custom)
- Come viene renderizzato il contenuto (HTML/Canvas/WebGL)
- Quali input sono disponibili (mani/tastiera/mouse/VR)

### 3. **Plug & Play**
```javascript
// Esempio: Navigator con solo tastiera
const navigator = new NavigatorCore();
navigator.registerPlugin(new KeyboardInputPlugin());
navigator.registerPlugin(new NavigationLogicPlugin());
navigator.registerPlugin(new DomRendererPlugin());
navigator.start();

// Esempio: Navigator con gesture + Three.js
const navigator = new NavigatorCore();
navigator.registerPlugin(new GestureInputPlugin());
navigator.registerPlugin(new NavigationLogicPlugin());
navigator.registerPlugin(new ThreeJsRendererPlugin());
navigator.start();
```

---

## Architettura Attuale vs Target

### Stato Attuale (Monolitico)
```
┌─────────────────────────────────────────────────┐
│              main-init.js (1074 righe)          │
│  ┌──────────────────────────────────────────┐   │
│  │  GestureDetector → NavigationController  │   │
│  │          ↓               ↓                │   │
│  │    LayerManager    AudioManager          │   │
│  │          ↓               ↓                │   │
│  │    DOM Updates      Audio Playback       │   │
│  └──────────────────────────────────────────┘   │
│                                                  │
│  Problemi:                                       │
│  - Tight coupling tra gesture detection e DOM   │
│  - Logica di navigazione mista con rendering    │
│  - Impossibile sostituire un componente         │
└─────────────────────────────────────────────────┘
```

### Target v2.0 (Core & Plugin)
```
┌──────────────────────────────────────────────────────────┐
│                    NavigatorCore                         │
│  ┌────────────┐  ┌──────────┐  ┌────────────────────┐   │
│  │  Lifecycle │  │ EventBus │  │ Plugin Registry    │   │
│  │  Manager   │  │          │  │ (registerPlugin)   │   │
│  └────────────┘  └──────────┘  └────────────────────┘   │
│         │              │                   │              │
│         └──────────────┴───────────────────┘              │
│                        │                                  │
└────────────────────────┼──────────────────────────────────┘
                         │ Event Bus (pub/sub)
         ┌───────────────┼───────────────┐
         │               │               │
    ┌────▼────┐    ┌────▼────┐    ┌────▼────┐
    │ INPUT   │    │ LOGIC   │    │ OUTPUT  │
    │ PLUGINS │    │ PLUGINS │    │ PLUGINS │
    └─────────┘    └─────────┘    └─────────┘
         │               │               │
    ┌────┴────┐    ┌────┴────┐    ┌────┴────┐
    │ Gesture │    │  Nav    │    │   DOM   │
    │ Input   │    │ Logic   │    │ Renderer│
    └─────────┘    └─────────┘    └─────────┘
    │ Keyboard│    │         │    │  Audio  │
    │ Input   │    │         │    │ Feedback│
    └─────────┘    └─────────┘    └─────────┘
    │  Voice  │                   │ Visual  │
    │  Input  │                   │ Effects │
    └─────────┘                   └─────────┘

Vantaggi:
✅ Ogni plugin è isolato e testabile
✅ Facile aggiungere nuovi input (VR controller)
✅ Facile cambiare renderer (Three.js, Babylon.js)
✅ Zero breaking changes quando si sostituisce un plugin
```

---

## Event Flow Architecture

### Flusso Eventi (Event-Driven Communication)

```javascript
// INPUT LAYER: Raw data capture
GestureInputPlugin.onHandDetected((landmarks) => {
    eventBus.emit('gesture:hand_detected', { landmarks });
});

KeyboardInputPlugin.onKeyPress((key) => {
    eventBus.emit('keyboard:key_pressed', { key });
});

// LOGIC LAYER: Intent interpretation
NavigationLogicPlugin.init(core) {
    core.on('gesture:hand_detected', (data) => {
        const swipe = this.detectSwipe(data.landmarks);
        if (swipe.direction === 'left') {
            core.emit('intent:navigate_left', { velocity: swipe.speed });
        }
    });
    
    core.on('keyboard:key_pressed', (data) => {
        if (data.key === 'ArrowLeft') {
            core.emit('intent:navigate_left', { velocity: 1.0 });
        }
    });
}

// OUTPUT LAYER: Action execution
DomRendererPlugin.init(core) {
    core.on('intent:navigate_left', (data) => {
        this.animateCardLeft(data.velocity);
    });
}

AudioFeedbackPlugin.init(core) {
    core.on('intent:navigate_left', (data) => {
        this.playWhooshSound(-0.3, 0, data.velocity);
    });
}
```

### Event Naming Convention

**Pattern**: `<layer>:<noun>_<verb>`

**Input Events** (raw data):
- `gesture:hand_detected`
- `gesture:hand_lost`
- `gesture:landmarks_updated`
- `keyboard:key_pressed`
- `keyboard:key_released`
- `voice:command_detected`
- `mouse:click`
- `mouse:drag`

**Intent Events** (interpreted actions):
- `intent:navigate_left`
- `intent:navigate_right`
- `intent:navigate_up`
- `intent:navigate_down`
- `intent:zoom_in`
- `intent:zoom_out`
- `intent:confirm`
- `intent:cancel`

**System Events** (lifecycle/state):
- `system:ready`
- `system:started`
- `system:paused`
- `system:error`
- `state:card_changed`
- `state:layer_changed`
- `state:idle`
- `state:active`

---

## Plugin Interface Standard

### Base Plugin Interface

```javascript
/**
 * Standard plugin interface
 * All plugins must implement this contract
 */
class BasePlugin {
    /**
     * Plugin metadata
     */
    get name() { return 'BasePlugin'; }
    get version() { return '1.0.0'; }
    get type() { return 'input|logic|output'; }
    
    /**
     * Plugin dependencies (optional)
     * @returns {string[]} Array of required plugin names
     */
    get dependencies() { return []; }
    
    /**
     * Initialize plugin with core reference
     * Register event listeners here
     * @param {NavigatorCore} core - Core instance
     */
    init(core) {
        this.core = core;
        this.state = core.state;
        this.eventBus = core.eventBus;
    }
    
    /**
     * Start plugin (begin processing)
     * Start timers, streams, etc.
     */
    start() {}
    
    /**
     * Stop plugin (pause processing)
     * Cleanup temporary resources
     */
    stop() {}
    
    /**
     * Destroy plugin (full cleanup)
     * Remove all listeners, free all resources
     */
    destroy() {
        this.eventBus.off('*', this);
    }
}
```

### Example: GestureInputPlugin

```javascript
class GestureInputPlugin extends BasePlugin {
    get name() { return 'GestureInputPlugin'; }
    get version() { return '2.0.0'; }
    get type() { return 'input'; }
    
    init(core) {
        super.init(core);
        
        // Get config
        this.config = core.config.get('gestures.detection');
        
        // Setup MediaPipe (internal detail)
        this.hands = new Hands({
            locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
        });
        
        this.hands.setOptions({
            modelComplexity: this.config.model_complexity,
            minDetectionConfidence: this.config.min_detection_confidence,
            minTrackingConfidence: this.config.min_tracking_confidence
        });
        
        this.hands.onResults(this.onResults.bind(this));
    }
    
    start() {
        // Start camera
        this.camera = new Camera(this.webcamElement, {
            onFrame: async () => {
                await this.hands.send({ image: this.webcamElement });
            },
            width: 640,
            height: 480
        });
        this.camera.start();
    }
    
    onResults(results) {
        if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
            const landmarks = results.multiHandLandmarks[0];
            
            // Emit raw event (NO interpretation here)
            this.eventBus.emit('gesture:hand_detected', {
                landmarks: landmarks,
                timestamp: Date.now()
            });
        } else {
            this.eventBus.emit('gesture:hand_lost', {
                timestamp: Date.now()
            });
        }
    }
    
    stop() {
        this.camera.stop();
    }
    
    destroy() {
        super.destroy();
        this.hands.close();
        this.camera = null;
    }
}
```

### Example: NavigationLogicPlugin

```javascript
class NavigationLogicPlugin extends BasePlugin {
    get name() { return 'NavigationLogicPlugin'; }
    get version() { return '2.0.0'; }
    get type() { return 'logic'; }
    
    init(core) {
        super.init(core);
        
        this.config = core.config.get('gestures.recognition');
        this.gridLock = new GridLockSystem(core.config.get('gestures.grid_lock'));
        
        // Listen to RAW input events
        this.eventBus.on('gesture:hand_detected', this.onHandDetected.bind(this));
        this.eventBus.on('keyboard:key_pressed', this.onKeyPressed.bind(this));
    }
    
    onHandDetected(data) {
        const { landmarks, timestamp } = data;
        
        // Gesture interpretation logic
        const palmBase = landmarks[0];
        const currentPos = { x: palmBase.x, y: palmBase.y };
        
        const gesture = this.gridLock.processHandMovement(currentPos, timestamp);
        
        if (gesture) {
            // Emit INTENT event
            if (gesture.type === 'horizontal') {
                const intent = gesture.direction > 0 ? 'intent:navigate_right' : 'intent:navigate_left';
                this.eventBus.emit(intent, {
                    velocity: Math.abs(gesture.direction),
                    source: 'gesture',
                    timestamp
                });
            } else if (gesture.type === 'vertical') {
                const intent = gesture.direction > 0 ? 'intent:navigate_down' : 'intent:navigate_up';
                this.eventBus.emit(intent, {
                    velocity: Math.abs(gesture.direction),
                    source: 'gesture',
                    timestamp
                });
            }
        }
    }
    
    onKeyPressed(data) {
        const { key } = data;
        
        // Translate keyboard to intents
        const keyMap = {
            'ArrowLeft': 'intent:navigate_left',
            'ArrowRight': 'intent:navigate_right',
            'ArrowUp': 'intent:navigate_up',
            'ArrowDown': 'intent:navigate_down',
            'Enter': 'intent:confirm',
            'Escape': 'intent:cancel'
        };
        
        if (keyMap[key]) {
            this.eventBus.emit(keyMap[key], {
                velocity: 1.0,
                source: 'keyboard',
                timestamp: Date.now()
            });
        }
    }
}
```

### Example: DomRendererPlugin

```javascript
class DomRendererPlugin extends BasePlugin {
    get name() { return 'DomRendererPlugin'; }
    get version() { return '2.0.0'; }
    get type() { return 'output'; }
    
    init(core) {
        super.init(core);
        
        this.config = core.config.get('navigation.cards');
        this.layerManager = new LayerManager(core.config.get('navigation'));
        
        // Listen to INTENT events (not raw input)
        this.eventBus.on('intent:navigate_left', this.navigateLeft.bind(this));
        this.eventBus.on('intent:navigate_right', this.navigateRight.bind(this));
        this.eventBus.on('intent:navigate_up', this.navigateUp.bind(this));
        this.eventBus.on('intent:navigate_down', this.navigateDown.bind(this));
    }
    
    navigateLeft(data) {
        const { velocity } = data;
        
        // Update DOM
        this.layerManager.previousCard();
        
        // Update app state
        this.state.set('currentCard', this.layerManager.currentCardIndex);
        
        // Emit state change event
        this.eventBus.emit('state:card_changed', {
            direction: 'left',
            index: this.layerManager.currentCardIndex,
            velocity
        });
    }
    
    navigateRight(data) {
        const { velocity } = data;
        
        this.layerManager.nextCard();
        this.state.set('currentCard', this.layerManager.currentCardIndex);
        
        this.eventBus.emit('state:card_changed', {
            direction: 'right',
            index: this.layerManager.currentCardIndex,
            velocity
        });
    }
    
    // ... navigateUp/Down similar
}
```

---

## Migration Strategy (Phased Approach)

### Phase 1: Foundation (Week 1)
**Goal**: Create core infrastructure without breaking current app

- [ ] Create `js/core/` directory
- [ ] Implement `NavigatorCore.js` (lifecycle, plugin registry)
- [ ] Implement `EventBus.js` (pub/sub system)
- [ ] Refactor `AppState.js` to integrate with Core
- [ ] Create `BasePlugin.js` (interface definition)
- [ ] **Validation**: Core can load and initialize plugins

### Phase 2: Input Layer (Week 2)
**Goal**: Convert input systems to plugins

- [ ] Create `js/plugins/input/GestureInputPlugin.js` (wrap existing GestureDetector)
- [ ] Create `js/plugins/input/KeyboardInputPlugin.js` (new)
- [ ] Create `js/plugins/input/MouseInputPlugin.js` (optional)
- [ ] **Validation**: Gesture detection emits events without DOM coupling

### Phase 3: Logic Layer (Week 2-3)
**Goal**: Separate interpretation from input/output

- [ ] Create `js/plugins/logic/NavigationLogicPlugin.js`
- [ ] Move GridLockSystem into NavigationLogicPlugin
- [ ] Move gesture recognition logic (swipe/pinch/fist) into plugin
- [ ] **Validation**: Can navigate using keyboard OR gestures interchangeably

### Phase 4: Output Layer (Week 3)
**Goal**: Decouple rendering from navigation logic

- [ ] Create `js/plugins/output/DomRendererPlugin.js` (wrap LayerManager)
- [ ] Create `js/plugins/output/AudioFeedbackPlugin.js` (wrap AudioManager)
- [ ] Create `js/plugins/output/VisualEffectsPlugin.js` (wrap VisualEffects)
- [ ] **Validation**: Can disable any output plugin without breaking navigation

### Phase 5: Integration & Testing (Week 4)
**Goal**: Refactor main-init.js to use plugin system

- [ ] Replace direct module instantiation with plugin registration
- [ ] Create plugin configuration in `config.yaml` (enable/disable per plugin)
- [ ] Test all input combinations (gesture-only, keyboard-only, both)
- [ ] Test output combinations (DOM-only, audio-only, effects-only)
- [ ] **Validation**: Build "keyboard-only" version works perfectly

### Phase 6: Ecosystem Tools (Week 5-6)
**Goal**: Enable external developers

- [ ] Setup Vite bundler with HMR
- [ ] Create ESLint configuration
- [ ] Setup GitHub Actions CI/CD
- [ ] Create VitePress documentation site
- [ ] Create `create-navigator-app` CLI
- [ ] Publish roadmap and contribution guidelines

---

## File Structure (Target v2.0)

```
navigator/
├── config.yaml                         # User configuration
├── package.json                        # Dependencies & scripts
├── vite.config.js                      # Build configuration
├── .eslintrc.js                        # Code quality rules
│
├── .github/
│   └── workflows/
│       ├── ci.yml                      # Continuous Integration
│       └── deploy.yml                  # Continuous Deployment
│
├── src/                                # Source files (post-bundler)
│   ├── core/
│   │   ├── NavigatorCore.js           # Main engine
│   │   ├── EventBus.js                # Pub/sub system
│   │   ├── AppState.js                # State management
│   │   ├── PluginRegistry.js          # Plugin loader
│   │   └── BasePlugin.js              # Plugin interface
│   │
│   ├── plugins/
│   │   ├── input/
│   │   │   ├── GestureInputPlugin.js  # MediaPipe wrapper
│   │   │   ├── KeyboardInputPlugin.js # Keyboard events
│   │   │   ├── MouseInputPlugin.js    # Mouse/touch events
│   │   │   └── VoiceInputPlugin.js    # Speech recognition
│   │   │
│   │   ├── logic/
│   │   │   ├── NavigationLogicPlugin.js
│   │   │   └── AdaptiveSystemPlugin.js
│   │   │
│   │   └── output/
│   │       ├── DomRendererPlugin.js   # HTML/CSS renderer
│   │       ├── AudioFeedbackPlugin.js # Spatial audio
│   │       ├── VisualEffectsPlugin.js # Canvas effects
│   │       └── HudPlugin.js           # Status display
│   │
│   ├── utils/
│   │   ├── GridLockSystem.js          # Shared utilities
│   │   └── ConfigLoader.js            # YAML loader
│   │
│   └── main.js                         # App entry point
│
├── public/                             # Static assets
│   ├── index.html
│   └── css/
│
├── docs/                               # Documentation
│   ├── guide/
│   │   ├── getting-started.md
│   │   ├── core-concepts.md
│   │   └── creating-plugins.md
│   ├── api/
│   │   ├── core.md
│   │   └── plugins.md
│   └── .vitepress/
│       └── config.js
│
├── examples/                           # Example implementations
│   ├── keyboard-only/
│   ├── gesture-only/
│   └── three-js-renderer/
│
└── tests/
    ├── unit/
    ├── integration/
    └── e2e/
```

---

## Success Metrics

### Technical Metrics

| Metric | Current | Target |
|--------|---------|--------|
| **Modularity** | Monolithic (1074 lines main-init) | 15+ independent plugins |
| **Coupling** | High (direct module dependencies) | Zero (event-driven only) |
| **Testability** | Integration tests only | Unit + Integration + E2E |
| **Build Time** | N/A (no build) | <5s dev, <30s production |
| **Bundle Size** | ~150KB unminified | <50KB minified+gzipped |
| **Plugin API Stability** | N/A | Semver 2.0.0 contract |

### Developer Experience Metrics

| Metric | Current | Target |
|--------|---------|--------|
| **Setup Time** | Clone → open HTML | `npx create-navigator-app` → 30s |
| **Hot Reload** | Manual refresh | Instant HMR (<100ms) |
| **Documentation** | 8 markdown files | Full VitePress site |
| **CI/CD** | Manual deploy | Auto-deploy on merge |
| **Community** | Private | Public roadmap + discussions |

### Validation Tests

**Must Pass Before v2.0 Release:**

1. ✅ **Keyboard-Only Build**: Navigator functions without GestureInputPlugin
2. ✅ **Gesture-Only Build**: Navigator functions without KeyboardInputPlugin
3. ✅ **Headless Build**: Navigation logic works without any output plugins (state changes only)
4. ✅ **Plugin Hot-Swap**: Can replace DomRendererPlugin with ThreeJsRendererPlugin at runtime
5. ✅ **Zero Breaking Changes**: v1.x config.yaml works in v2.0 (backwards compatible)

---

## Next Steps (Implementation Order)

### Immediate (This Week)

1. **Create Core Infrastructure**
   - File: `js/core/NavigatorCore.js`
   - File: `js/core/EventBus.js`
   - File: `js/core/BasePlugin.js`

2. **Create First Plugin**
   - File: `js/plugins/input/KeyboardInputPlugin.js` (simplest to start)
   - Validate event emission works

3. **Setup Development Tools**
   - File: `package.json` with Vite
   - File: `vite.config.js`
   - Test HMR works

### Short-Term (Next 2 Weeks)

4. **Convert Existing Modules to Plugins**
   - GestureInputPlugin (wrap existing code)
   - NavigationLogicPlugin (extract from main-init)
   - DomRendererPlugin (wrap LayerManager)

5. **Integration Testing**
   - Refactor main-init.js to use plugin system
   - Create test builds (keyboard-only, gesture-only)

### Medium-Term (Month 2)

6. **Ecosystem Tools**
   - GitHub Actions CI/CD
   - VitePress documentation
   - Create-navigator-app CLI

7. **Community Launch**
   - Public roadmap
   - Contribution guidelines
   - First external plugin tutorial

---

## Questions for Decision

Before we start implementation, clarify:

1. **Backwards Compatibility**: Do we need to support the current monolithic version alongside v2.0? (Suggestion: Yes, via a `legacy` branch)

2. **Breaking Changes**: Are we OK with v2.0 requiring code changes for existing integrations? (Suggestion: Provide migration guide + automated migration tool)

3. **Timeline**: 6-week aggressive timeline or 12-week conservative? (Affects depth of Phase 6 ecosystem work)

4. **First External Plugin**: What should be the flagship example? Options:
   - VR Controller Input Plugin (Oculus/Vive support)
   - Three.js Renderer Plugin (3D scene navigation)
   - Gamepad Input Plugin (Xbox/PS controller)

---

**Last Updated**: 2025-01-25  
**Status**: 📋 Planning Phase  
**Next Milestone**: Phase 1 - Core Infrastructure

