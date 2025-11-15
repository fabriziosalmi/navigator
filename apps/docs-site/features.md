# Aetherium Navigator - Features Documentation

## Multi-Modal Navigation

### 🖐️ Hand Gestures
Powered by MediaPipe Hands with 21-landmark tracking:

- **Swipe Left/Right**: Navigate cards horizontally
- **Swipe Up/Down**: Change layers vertically
- **Point (2s hold)**: Focus mode with Kamehameha effect
- **Advanced Gestures**: Unlock at Level 2 & 3 (pinch, fan, fist collapse)

**Technical Details**:
- 30 FPS hand tracking
- Smart Grid Lock prevents accidental inputs
- Separate vertical (0.10) and horizontal (0.12) thresholds
- Velocity tracking for intentional movements
- 800ms cooldown before direction reversal

### ⌨️ Keyboard Controls
Full navigation support with dual key bindings:

- `A` / `D` or `←` / `→`: Navigate cards horizontally
- `W` / `S` or `↑` / `↓`: Navigate layers vertically
- `M`: Toggle voice commands on/off
- `F`: Fullscreen mode toggle
- `V`: Toggle webcam view

**Note**: Delete card shortcut (`D` key) disabled in v0.1.0 to prevent conflict with WASD navigation.

### 🎤 Voice Commands
Bilingual speech recognition (English + Italian):

**English Commands**:
- "left" / "right" - Card navigation
- "up" / "down" - Layer navigation
- "next" / "back" - Alternative navigation

**Italian Commands**:
- "sinistra" / "destra" - Card navigation
- "su" / "giù" - Layer navigation
- "avanti" / "indietro" - Alternative navigation

**Features**:
- Continuous listening with auto-restart
- Visual microphone indicator (top-right, green when active)
- Toggle with `M` key
- Fuzzy matching for natural speech variations

---

## Adaptive Navigation System

### 3-Level Progressive Unlock

**Level 1 (Default)**:
- Basic gestures: swipe left/right/up/down
- Point to focus (2s hold)
- Unlocked from start

**Level 2 (85% Accuracy)**:
- Pinch gestures
- Fan cards interaction
- Advanced visual feedback

**Level 3 (90% Accuracy)**:
- Fist collapse gesture
- Explosion effects
- Expert-level interactions

### Performance Tracking

System monitors three key metrics:

1. **Accuracy**: Successful gestures / Total attempts
2. **Speed**: Average gesture completion time
3. **Stability**: Consistency of movements

**Auto-Adjustment**:
- Upgrade when thresholds met for 5+ consecutive navigations
- Downgrade if performance drops below level requirements
- Visual progress bar in quantum HUD shows next level progress

### Gesture Legend

HUD displays available gestures:
- ✅ Active: Available at current level
- 🔒 Locked: Requires higher level (shows unlock hint)

---

## Quantum HUD Interface

### Bottom-Aligned Control Panel

**5 Section Layout** (left to right):

1. **Position Info**
   - Current layer name (Videos, News, Apps, Settings)
   - Card counter (e.g., "1/4")
   - Category color accent

2. **Navigation Controls**
   - 4 SVG buttons: ← → ↑ ↓
   - Clickable for mouse/touch navigation
   - Visual hover feedback

3. **Adaptive Display**
   - Level indicator (I, II, III)
   - Progress bar to next level
   - Real-time metrics display

4. **Status Panel**
   - Hand detection icon (green = detected)
   - Gesture legend (active/locked)
   - Debug ticker (navigation events)

5. **Navigation History**
   - Last 5 navigation actions
   - Color-coded icons (see below)
   - Smooth slide-in animations

### Design Specifications

- **Height**: 72px
- **Border Radius**: 36px (fully rounded ends)
- **Background**: `rgba(20, 20, 35, 0.85)` with `backdrop-filter: blur(40px)`
- **Font**: Inter, weight 600
- **Position**: Fixed bottom, 20px from edge
- **Max Width**: 95vw (responsive)

---

## Navigation History Widget

### Color-Coded Action Tracking

**Icon Colors**:
- 🔵 **Cyan**: Card navigation (left/right swipes)
- 🟣 **Magenta**: Layer navigation (up/down)
- 🟢 **Green**: Voice commands
- 🟠 **Orange**: Keyboard inputs

### Visual Design

**Icons**:
- SVG arrows (→ ← ↑ ↓)
- 20px × 20px size
- Stroke width 2.5
- Category-specific glow effect

**Animations**:
- Fade in from right (0.3s)
- Slide left when new entry arrives
- Fade out when removed (0.2s)
- Maximum 6 visible entries

### Source Attribution

System distinguishes between:
- **Gesture**: Hand swipe detected
- **Keyboard**: Key press captured
- **Voice**: Speech command recognized

---

## Visual Feedback Systems

### Akira-Style Light Beams

**Horizontal Beams** (card navigation):
- Cyan (left) / Magenta (right)
- Full-screen gradient trail
- Velocity-based intensity
- 0.6s fade-out

**Vertical Beams** (layer switching):
- Pink (up) / Cyan (down)
- Top-to-bottom gradient
- Faster fade (0.4s)

**Technical**:
- Rendered on dedicated `<canvas>` layer
- GPU-accelerated drawing
- No performance impact on navigation

### 3D Vanishing Point Perspective

**Depth Layers**:
- Active layer: `z-index: 0`, no blur
- Back 1: `z-index: -500px`, `filter: blur(2px)`
- Back 2: `z-index: -1000px`, `filter: blur(4px)`
- Front layers: `opacity: 0` (hidden until gesture)

**Transitions**:
- Smooth blur crossfade (0.5s)
- Staggered reveal animation
- Spring physics on layer switch

### Dynamic Background

**Three Animated Orbs**:
- Large cyan, medium magenta, small green
- Continuous slow drift
- React to navigation velocity
- High-speed mode: intense pulsing

**Auto-Fade**:
- 2-second idle timeout
- Fade to 20% opacity
- Re-activate on navigation

---

## Spatial Audio System

### Web Audio API Synthesis

**Gesture Sounds**:
- **Whoosh**: Swipe navigation (pitch varies by direction)
- **Beep**: Focus mode activation (2-tone sequence)
- **Grab**: Confirmation feedback
- **Error**: Failed gesture alert

**Spatial Positioning**:
- 3D audio based on hand/card position
- Panning left/right follows horizontal movement
- Distance attenuation for depth perception

### Configuration

```javascript
CONFIG.audio = {
    masterVolume: 0.3,           // 0-1 scale
    spatialEnabled: true,        // 3D positioning
    gestureEffectsEnabled: true, // Whoosh/beep sounds
    musicEnabled: false          // Ambient loops (disabled)
}
```

**Note**: Ambient music disabled by default - only gesture effects play.

---

## Smart Grid Lock System

### Anti-Jitter Protection

**Separate Thresholds**:
- Horizontal: 0.12 (more restrictive)
- Vertical: 0.10 (easier layer switching)

**Velocity Tracking**:
- Minimum intent velocity required
- Filters out slow drift
- Only responds to deliberate movements

**Direction Cooldown**:
- 800ms lockout before reversing
- Prevents rapid back-and-forth
- Maintains navigation flow

### Infinite Wrapping

- Cards wrap seamlessly (last → first)
- Layers wrap top-to-bottom
- No dead-end navigation
- Smooth loop transitions

---

## Performance Optimizations

### DOM LOD (Level of Detail) System

**3-Tier Rendering**:
- **Active**: Full rendering, all effects
- **Near**: Reduced complexity, basic styles
- **Far**: Minimal DOM, hidden elements

**Benefits**:
- 40% reduced reflows
- Faster layer transitions
- Lower memory footprint

### GPU Acceleration

All animations use:
- `transform` (not `left`/`top`)
- `opacity` (not `visibility`)
- `will-change` hints
- Hardware-composited layers

### Debouncing & Throttling

- Voice recognition: 300ms debounce
- Gesture processing: 16ms throttle (60 FPS)
- HUD updates: RequestAnimationFrame
- Audio triggers: Cooldown timers

---

## Security & Privacy

### Data Handling

- **100% Client-Side**: All processing in browser
- **No Transmission**: Webcam/mic data never sent
- **No Storage**: Zero cookies or localStorage
- **No Analytics**: No tracking or telemetry

### Permissions

Required permissions:
- **Camera**: For hand gesture tracking
- **Microphone**: For voice commands (optional)
- **Audio**: For spatial sound playback

All permissions requested on "Start Experience" click.

---

## Browser Compatibility

### Recommended

- **Chrome 90+**: Full feature support
- **Edge 90+**: Full feature support
- **Opera 76+**: Full feature support

### Partial Support

- **Firefox 88+**: MediaPipe works, Web Speech limited
- **Safari 14+**: Gesture tracking OK, voice commands may fail

### Requirements

- ES6+ module support
- MediaPipe WASM backend
- Web Audio API
- Webcam access via `getUserMedia()`

---

## Configuration Reference

All settings in `js/config.js`:

### Grid Lock
```javascript
gridLock: {
    threshold: 0.12,              // Horizontal
    thresholdVertical: 0.10,      // Vertical
    minIntentVelocity: 0.015,     // Horizontal speed
    minIntentVelocityVertical: 0.012 // Vertical speed
}
```

### Adaptive System
```javascript
adaptiveNavigation: {
    enabled: true,
    levels: {
        1: { accuracyThreshold: 0.75, speedThreshold: 60 },
        2: { accuracyThreshold: 0.85, speedThreshold: 75 },
        3: { accuracyThreshold: 0.90, speedThreshold: 90 }
    }
}
```

### Camera
```javascript
camera: {
    maxNumHands: 1,
    modelComplexity: 1,           // 0=lite, 1=full
    minDetectionConfidence: 0.7,
    minTrackingConfidence: 0.6
}
```

### Effects
```javascript
effects: {
    lightBeamsEnabled: true,
    dynamicBackgroundEnabled: true,
    kamikazeEnabled: true,
    particlesEnabled: true
}
```
