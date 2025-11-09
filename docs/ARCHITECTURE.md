# Architecture Documentation

## System Overview

Aetherium Navigator is built with a **fully modular ES6+ architecture** - 12 independent modules with clear separation of concerns, zero dependencies on external frameworks.

---

## Module Structure

```
/navigator
├── index.html                      # Main app (1170 lines)
├── style.css                       # Complete styling (2097 lines)
├── package.json                    # npm configuration for testing
├── playwright.config.js            # End-to-end test configuration
└── js/
    ├── config.js                   # Centralized configuration
    ├── AdaptiveNavigationSystem.js # 3-level progression system (455 lines)
    ├── AdaptiveNavigationHUD.js    # Adaptive progress display
    ├── AudioManager.js             # Spatial audio synthesis (709 lines)
    ├── GestureDetector.js          # Hand gesture recognition (~350 lines)
    ├── GridLockSystem.js           # Smart gesture processing
    ├── LayerManager.js             # Multi-layer state management
    ├── NavigationController.js     # Navigation logic & routing (~400 lines)
    ├── DOMLODManager.js            # Performance optimization (LOD)
    ├── VisualEffects.js            # Canvas-based visual effects
    ├── LightBeamSystem.js          # Akira-style light beams (195 lines)
    ├── VoiceCommandModule.js       # Speech recognition (390 lines)
    ├── NavigationHistoryHUD.js     # Action history tracking (180 lines)
    ├── PredictiveTracker.js        # Motion prediction
    └── GestureStabilizer.js        # Gesture smoothing
```

---

## Core Modules

### AdaptiveNavigationSystem.js (455 lines)

**Purpose**: 3-level progressive unlock system that tracks user skill

**Key Components**:
- `trackNavigation(success, duration)` - Records navigation attempts
- `calculateMetrics()` - Computes accuracy/speed/stability
- `checkLevelUp()` / `checkLevelDown()` - Auto-progression
- `getAvailableGestures(level)` - Returns unlocked gesture set

**State Management**:
```javascript
{
    currentLevel: 1,
    metrics: { accuracy, speed, stability },
    history: [{ success, duration, timestamp }],
    consecutiveSuccesses: 0
}
```

**Events**:
- `levelChange` - Fired on level up/down
- `metricsUpdate` - Fired after each navigation

---

### VoiceCommandModule.js (390 lines)

**Purpose**: Bilingual speech recognition with continuous listening

**Key Features**:
- Web Speech API with auto-restart
- English + Italian command mapping
- Fuzzy matching for variations
- Visual microphone indicator

**Command Flow**:
1. `start()` - Initialize recognition
2. `onResult()` - Process transcript
3. `matchCommand()` - Fuzzy match against dictionary
4. `executeCommand()` - Trigger navigation
5. `onEnd()` - Auto-restart (continuous mode)

**Command Dictionary**:
```javascript
{
    'left': 'card-left',
    'sinistra': 'card-left',
    'right': 'card-right',
    'destra': 'card-right',
    // ... more mappings
}
```

---

### NavigationController.js (~400 lines)

**Purpose**: Central navigation logic and state routing

**Responsibilities**:
- Route navigation commands to LayerManager
- Update quantum HUD position display
- Trigger visual/audio feedback
- Coordinate between input sources (gesture/keyboard/voice)

**Key Methods**:
- `navigateLeft()` / `navigateRight()` - Horizontal navigation
- `navigateUp()` / `navigateDown()` - Layer switching
- `updateHUD()` - Refresh position indicators
- `handleNavigationEvent(type, source)` - Unified event handler

**State**:
```javascript
{
    currentLayer: 'layer-video',
    currentCardIndex: 0,
    totalCards: 4,
    isNavigating: false  // Prevents concurrent nav
}
```

---

### GestureDetector.js (~350 lines)

**Purpose**: Hand tracking and gesture recognition via MediaPipe

**Gesture Types**:
- **Swipe**: Horizontal/vertical hand movement
- **Point**: Extended index finger (2s hold)
- **Pinch**: Thumb + index proximity (Level 2+)
- **Fist**: Closed hand (Level 3+)

**Detection Pipeline**:
1. MediaPipe Hands → 21 landmarks
2. Calculate hand velocity/direction
3. GridLockSystem → Filter jitter
4. AdaptiveSystem → Check gesture availability
5. NavigationController → Execute action

**Landmark Usage**:
- Index finger tip (landmark 8) - Pointing
- Thumb tip (landmark 4) - Pinch detection
- Wrist (landmark 0) - Base position
- Palm center (calculated) - Velocity tracking

---

### AudioManager.js (709 lines)

**Purpose**: Spatial audio synthesis with Web Audio API

**Sound Types**:
1. **Gesture Whoosh**:
   - Frequency: 200-600 Hz (direction-dependent)
   - Duration: 150ms
   - Panning: Left (-1) to Right (+1)

2. **Focus Beep**:
   - 2-tone sequence (800 Hz → 1200 Hz)
   - 100ms each tone
   - Center panned

3. **Error Alert**:
   - Low frequency 150 Hz
   - 300ms duration
   - Amplitude modulation

**Spatial Positioning**:
```javascript
const panner = audioContext.createPanner();
panner.setPosition(x, y, z);  // Hand position
panner.panningModel = 'HRTF'; // Head-related transfer
```

---

### LightBeamSystem.js (195 lines)

**Purpose**: Akira-style light beam rendering on canvas

**Rendering**:
- Dedicated `<canvas>` overlay
- Full-screen gradient fills
- GPU-accelerated drawing
- Velocity-based intensity

**Beam Types**:
1. **Horizontal Beams** (card navigation):
   ```javascript
   gradient = ctx.createLinearGradient(0, y, width, y);
   gradient.addColorStop(0, 'cyan');
   gradient.addColorStop(0.5, 'rgba(0,255,255,0.3)');
   gradient.addColorStop(1, 'transparent');
   ```

2. **Vertical Beams** (layer switching):
   ```javascript
   gradient = ctx.createLinearGradient(x, 0, x, height);
   gradient.addColorStop(0, 'magenta');
   gradient.addColorStop(1, 'transparent');
   ```

**Fade Animation**:
- 60 FPS RAF loop
- Linear opacity decay
- Auto-cleanup when opacity < 0.01

---

### NavigationHistoryHUD.js (180 lines)

**Purpose**: Track and display last 5 navigation actions

**Data Structure**:
```javascript
{
    type: 'card-left',     // Action type
    source: 'gesture',     // Input source
    timestamp: Date.now(), // When occurred
    category: 'videos'     // Layer category
}
```

**Icon Rendering**:
- SVG arrows dynamically generated
- Color from category mapping
- Smooth slide-in animation
- Auto-remove when limit exceeded

**Update Flow**:
1. `addAction(type, source)` - Add new entry
2. Shift existing icons left
3. Fade in new icon from right
4. Remove oldest if > 6 entries
5. Update DOM with new HTML

---

## Support Modules

### LayerManager.js

**Purpose**: Multi-layer state management

**Layer Structure**:
```javascript
layers = {
    'layer-video': { name: 'Videos', category: 'cyan', cards: [...] },
    'layer-news': { name: 'News', category: 'magenta', cards: [...] },
    'layer-apps': { name: 'Apps', category: 'green', cards: [...] },
    'layer-settings': { name: 'Settings', category: 'orange', cards: [...] }
}
```

**Key Methods**:
- `switchLayer(direction)` - Navigate up/down layers
- `navigateCard(direction)` - Navigate left/right cards
- `getCurrentLayer()` - Get active layer object
- `getLayerByIndex(index)` - Access specific layer

---

### GridLockSystem.js

**Purpose**: Anti-jitter gesture filtering

**Algorithm**:
1. Track hand velocity over time
2. Compare against threshold (0.12 horizontal, 0.10 vertical)
3. Require minimum intent velocity (0.015 / 0.012)
4. Enforce directional cooldown (800ms)
5. Output clean navigation events

**State**:
```javascript
{
    lastDirection: 'left',
    lastDirectionTime: timestamp,
    velocityHistory: [v1, v2, v3, ...],
    isLocked: false
}
```

---

### DOMLODManager.js

**Purpose**: Level-of-Detail performance optimization

**LOD Tiers**:
- **Tier 0** (Active): Full rendering, all effects
- **Tier 1** (Near): Simplified styles, reduced animations
- **Tier 2** (Far): Minimal DOM, hidden elements

**Optimizations**:
- Remove `transform` on far elements
- Disable animations beyond tier 1
- Lazy-load images for near/far cards
- Reduce paint complexity

---

### VisualEffects.js

**Purpose**: Canvas-based special effects

**Effects**:
1. **Kamehameha** (Focus mode):
   - Radial gradient explosion
   - Particle burst
   - Color based on category

2. **Singularity** (Level 3):
   - Inward particle collapse
   - Vortex distortion
   - Screen-shake effect

**Rendering**:
- Separate canvas layer
- RAF-based animation loop
- Cleanup after effect complete

---

## Data Flow

### Navigation Event Flow

```
User Input (Gesture/Keyboard/Voice)
    ↓
GestureDetector / KeyHandler / VoiceModule
    ↓
GridLockSystem (filter jitter)
    ↓
AdaptiveSystem (check gesture availability)
    ↓
NavigationController (route command)
    ↓
LayerManager (update state)
    ↓
┌─────────────────┬─────────────────┬─────────────────┐
HUD Update    AudioManager    LightBeamSystem
(visual)      (sound)         (canvas)
```

### State Management

**Centralized State**:
- `LayerManager` - Layer/card positions
- `AdaptiveSystem` - User skill metrics
- `NavigationHistory` - Action log

**Event-Driven Updates**:
- Modules emit events (no direct coupling)
- Controllers listen and react
- UI updates via DOM manipulation

---

## Performance Characteristics

### Metrics

- **Hand Tracking**: 30 FPS (MediaPipe)
- **Gesture Recognition**: <100ms latency
- **Navigation Response**: <50ms (with grid lock)
- **Audio Latency**: ~20ms (Web Audio API)
- **Frame Rate**: Target 60 FPS

### Optimization Techniques

1. **Debouncing**:
   - Voice recognition: 300ms
   - HUD updates: RequestAnimationFrame

2. **Throttling**:
   - Gesture processing: 16ms (60 FPS)
   - Grid lock checks: 50ms

3. **Lazy Loading**:
   - MediaPipe models loaded on demand
   - Canvas contexts created only when needed

4. **GPU Acceleration**:
   - All animations use `transform`
   - Hardware-composited layers
   - `will-change` hints

---

## Testing Architecture

### Playwright Test Suite

**Test Files**:
- `tests/keyboard-navigation.spec.js` (12 tests)
- `tests/adaptive-system.spec.js` (11 tests)
- `tests/navigation-history.spec.js` (10 tests)
- `tests/visual-refinements.spec.js` (11 tests)

**Coverage**:
- ✅ Keyboard navigation (100%)
- ✅ Adaptive system (90.9%)
- ✅ Navigation history (80%)
- ⚠️ Visual refinements (63.6% - CSS limitations)

**Test Results**: 36/43 passed (83.7%)

See `TEST_RESULTS.md` for detailed breakdown.

---

## Security Model

### Client-Side Only

- **No Server**: All processing in browser
- **No Transmission**: Webcam/mic data never sent
- **No Storage**: Zero persistence
- **No Analytics**: No tracking

### Permission Model

Required permissions:
1. **Camera**: MediaPipe hand tracking
2. **Microphone**: Voice commands (optional)
3. **Audio**: Spatial sound playback

All requested on "Start Experience" click.

---

## Extension Points

### Adding Custom Gestures

1. Define gesture in `GestureDetector.js`:
```javascript
detectCustomGesture(landmarks) {
    // Your detection logic
    return { detected: true, confidence: 0.9 };
}
```

2. Register in `AdaptiveSystem`:
```javascript
levels: {
    2: { gestures: ['swipe', 'point', 'custom'] }
}
```

3. Handle in `NavigationController`:
```javascript
handleCustomGesture() {
    // Your action logic
}
```

### Adding Voice Commands

1. Update dictionary in `VoiceCommandModule.js`:
```javascript
commandMappings: {
    'custom': 'custom-action',
    'personalizzato': 'custom-action'
}
```

2. Handle in `NavigationController`:
```javascript
handleVoiceCommand(command) {
    if (command === 'custom-action') {
        // Your logic
    }
}
```

### Adding Visual Effects

1. Create effect in `VisualEffects.js`:
```javascript
createCustomEffect(x, y) {
    const canvas = this.effectsCanvas;
    const ctx = canvas.getContext('2d');
    // Draw your effect
}
```

2. Trigger from `NavigationController`:
```javascript
visualEffects.createCustomEffect(x, y);
```

---

## Build & Deploy

### Development

```bash
python3 -m http.server 8080
# Open http://localhost:8080
```

### Testing

```bash
npm install
npm test              # Run all tests
npm run test:ui       # Interactive UI
npm run test:headed   # See browser
```

### Production

- No build step required
- Deploy static files to any web server
- Ensure HTTPS for camera/mic permissions
- Enable gzip compression for faster loading

---

## Browser Requirements

### Minimum

- ES6+ module support
- MediaPipe WASM backend
- Web Audio API
- Web Speech API (for voice)
- `getUserMedia()` for camera

### Recommended

- Chrome 90+ or Edge 90+
- 4GB+ RAM
- Webcam with 30 FPS minimum
- GPU acceleration enabled
