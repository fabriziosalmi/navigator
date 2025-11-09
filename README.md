# Aetherium Navigator

A next-generation gesture-controlled navigation system with **predictive tracking**, multi-layer navigation, and real-time procedural drum & bass audio. Built with Three.js, MediaPipe Hands, and fully modular ES6+ architecture.

![Status](https://img.shields.io/badge/Status-Production_Ready-green) ![Three.js](https://img.shields.io/badge/Three.js-r157-blue) ![MediaPipe](https://img.shields.io/badge/MediaPipe-Hands-orange) ![Predictive](https://img.shields.io/badge/Predictive_Tracking-Enabled-purple)

## ✨ Features

### 🚀 Core Navigation

- **Multi-Layer System**: Navigate through 6 categorized layers (Videos, News, Images, Games, Apps, Settings)
- **Infinite Scroll**: Seamless horizontal and vertical looping - never get stuck at edges
- **Predictive Tracking**: AI-powered motion prediction that anticipates movements 50ms in the future
  - Analyzes velocity and acceleration from last 10 frames
  - Physics-based prediction: `position = current + velocity * dt + 0.5 * acceleration * dt²`
  - Adaptive prediction time based on movement speed
  - Confidence scoring for reliable anticipation
- **Smart Grid Lock**: Intelligent gesture detection with:
  - Separate thresholds for vertical (0.10) vs horizontal (0.12) movement
  - Velocity-based intent detection
  - Direction change delay to prevent accidental reversals
  - Infinite loop wrapping on all axes

### 🎨 Visual Excellence

- **Dynamic WOW Label**: Animated category indicator in top-left corner
  - Real-time layer identification
  - Pulsing gradient effects
  - Layer-specific color schemes
- **Velocity-Based Background Effects**: Three animated glows that react to navigation speed
  - Normal mode: Subtle pulsing
  - High-velocity mode: Intense animations when navigating rapidly
  - Auto-fade when idle
- **Enhanced Card Design**:
  - Glassmorphism with backdrop blur
  - Gradient text effects
  - Hover interactions
  - Shadow depth and glow effects
- **3D Layer Depth**: Perspective-based positioning with progressive blur
- **GPU-Accelerated**: Optimized with `will-change`, `contain`, hardware compositing

### 🎵 Procedural Audio System

- **Real-time Drum & Bass**: Generated breakbeat at 174 BPM
  - Kick drum: Synthesized low punch (150→50Hz sweep)
  - Snare: Noise + tone hybrid (1000Hz highpass + 200Hz triangle)
  - Hi-hat: Metallic noise (8000Hz highpass)
  - Bassline: Sub bass (80Hz sawtooth)
- **100% Web Audio API**: No external audio files
- **16-step Pattern**: Authentic breakbeat rhythm
- **Configurable**: Adjust BPM, volume, patterns via `config.js`

### 🖐️ Gesture Control

- **🖐️ Open Hand Pan**: Swipe horizontally/vertically to navigate
- **👍 Thumbs Up (1s hold)**: Confirm actions (with cooldown)
- **☝️ Shake Index (3x)**: Cancel/deny actions
- **✊ Fist**: Exit fullscreen mode
- **Real-time Tracking**: MediaPipe Hands with 21 landmarks
- **Predictive Cursor**: Cursor anticipates hand movement

### ⚙️ Modular Architecture

```
/navigator
├── index.html                     # Clean HTML (only ~180 lines)
├── style.css                      # All styles externalized
└── js/
    ├── config.js                  # ⭐ Centralized configuration
    ├── PredictiveTracker.js       # ⭐ Motion prediction engine
    ├── GestureDetector.js         # ⭐ Gesture recognition
    ├── UIManager.js               # ⭐ UI updates & effects
    ├── GridLockSystem.js          # Smart gesture processing
    ├── AudioManager.js            # Procedural audio engine
    ├── LayerManager.js            # Multi-layer navigation
    ├── NavigationController.js    # DOM updates & routing
    ├── Card.js                    # 3D card components
    ├── DataStream.js              # Real-time data simulation
    └── SceneManager.js            # Three.js rendering
```

## 🛠️ Technology Stack

- **HTML5** - Semantic structure
- **CSS3** - Advanced animations, glassmorphism, GPU acceleration
- **JavaScript (ES6+ Modules)** - Fully modular architecture
- **Three.js (r157+)** - 3D scene rendering
- **MediaPipe Hands** - Real-time hand tracking (21 landmarks)
- **Web Audio API** - Procedural sound synthesis

## 📋 Prerequisites

- Modern browser (Chrome 90+, Firefox 88+, Edge 90+, Safari 14+)
- Webcam for gesture input
- Local web server (required for ES6 modules and webcam access)

## 🚀 Getting Started

### Quick Start with Python

```bash
cd /path/to/navigator
python3 -m http.server 8000
```

Open: `http://localhost:8000`

### Alternative Servers

**Node.js:**
```bash
npx http-server -p 8000
```

**PHP:**
```bash
php -S localhost:8000
```

**VS Code:** Install "Live Server" extension → Right-click `index.html` → "Open with Live Server"

## 🎮 How to Use

1. **Click "Start Experience"** - Grants camera/audio permissions
2. **Position your hand** - Hold hand in front of webcam
3. **Navigate**:
   - **Swipe left/right**: Navigate between cards (infinite loop)
   - **Swipe up/down**: Navigate between layers (infinite loop)
   - Watch the **WOW label** change as you switch layers
4. **Confirm actions**:
   - **Thumbs up (hold 1s)**: Confirm
   - **Shake index finger (3x)**: Cancel
5. **Exit fullscreen**: Make a fist gesture

### Keyboard Shortcuts

- `←→`: Navigate cards
- `↑↓`: Navigate layers
- `F`: Toggle fullscreen
- `D`: Delete current card
- `V`: Toggle webcam view

## ⚙️ Configuration

All settings in `js/config.js` - modify atomically without breaking anything!

### Adjust Predictive Tracking

```javascript
// js/config.js
CONFIG.predictiveTracking = {
    enabled: true,
    historySize: 10,           // Frames to analyze
    predictionTime: 50,        // ms in future (latency compensation)
    smoothingFactor: 0.3,      // 0-1, higher = more reactive
    minVelocityThreshold: 0.001 // Minimum speed for prediction
}
```

### Adjust Navigation Sensitivity

```javascript
CONFIG.gridLock = {
    threshold: 0.12,              // Horizontal sensitivity
    thresholdVertical: 0.10,      // Vertical sensitivity (lower = easier)
    minIntentVelocity: 0.015,     // Horizontal intent threshold
    minIntentVelocityVertical: 0.012  // Vertical intent threshold
}
```

### Change Audio Settings

```javascript
CONFIG.audio = {
    masterVolume: 0.3,
    drumBPM: 174,    // Try 165 for slower, 180 for faster
    drumVolume: 0.12
}
```

### Modify Visual Effects

```javascript
CONFIG.effects = {
    dynamicBackgroundEnabled: true,
    wowLabelEnabled: true,
    cardHoverEffects: true
}

CONFIG.performance = {
    highVelocityThreshold: 5,      // Speed for intense effects
    mediumVelocityThreshold: 2,    // Speed for normal effects
    velocityDecayTime: 2000        // ms before effects fade
}
```

## 🔧 Advanced Features

### Predictive Tracking System

The system analyzes the last 10 frames of hand movement to predict future position:

1. **Velocity Calculation**: `v = Δposition / Δtime`
2. **Acceleration Calculation**: `a = Δvelocity / Δtime`
3. **Position Prediction**: `p_future = p_current + v * dt + 0.5 * a * dt²`
4. **Confidence Scoring**: Based on movement consistency (0-1 scale)
5. **Adaptive Mode**: Prediction time scales with velocity

**Result**: The interface responds BEFORE you finish your gesture - feels telepathic!

### Grid Lock System

Prevents accidental navigation and jitter:

- **Accumulator with damping**: Smooths out small movements
- **Velocity tracking**: Only reacts to intentional movements
- **Direction change delay**: 800ms cooldown before reversing direction
- **Separate thresholds**: Easier vertical navigation (layer switching)

### Infinite Scroll

Both horizontal (cards) and vertical (layers) navigation wraps seamlessly:
- At last card → wraps to first
- At first card → wraps to last
- Same for layers

## 🐛 Troubleshooting

### Camera Access Issues
- Use `http://` or `https://` (not `file://`)
- Allow camera permissions in browser
- Try Chrome/Edge (best compatibility)

### Gesture Not Responding
- Ensure good lighting
- Move hand more slowly
- Position hand clearly in frame
- Press `V` to see webcam view
- Check gesture info panel (top-left)

### Audio Not Playing
- Click "Start Experience" button (required for Web Audio API)
- Check browser audio is not muted
- Adjust `CONFIG.audio.masterVolume` if too quiet

### Performance Issues
- Disable dynamic background: `CONFIG.effects.dynamicBackgroundEnabled = false`
- Reduce prediction history: `CONFIG.predictiveTracking.historySize = 5`
- Close other browser tabs

## 🎯 Performance Metrics

- **Prediction Latency**: ~50ms compensation
- **Frame Rate**: Target 60 FPS
- **GPU Acceleration**: Full hardware compositing
- **Gesture Response**: <100ms with predictive tracking
- **Memory Footprint**: ~50MB (including Three.js + MediaPipe)

## 🔐 Security & Privacy

- **100% Client-Side**: All processing happens in your browser
- **No Data Transmission**: Webcam feed never leaves your device
- **No Tracking**: No analytics or external services
- **Open Source**: Inspect all code

## 📝 License

MIT License - Free to use, modify, and distribute

## 🙏 Acknowledgments

- **Three.js** - 3D graphics engine
- **MediaPipe** - Google's hand tracking ML
- **Web Audio API** - Procedural audio synthesis

## 📧 Contact

Questions? Open an issue or PR on GitHub!

---

**Powered by predictive AI, procedural audio, and pure JavaScript magic.** ✨
