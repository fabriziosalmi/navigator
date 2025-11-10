# Navigator

> A next-generation **multi-modal gesture-controlled navigation system** with adaptive intelligence, voice commands, and immersive visual feedback.

![CI Status](https://github.com/fabriziosalmi/navigator/workflows/CI%20Pipeline/badge.svg) ![Status](https://img.shields.io/badge/Status-Production_Ready-green) ![Version](https://img.shields.io/badge/Version-0.1.0-blue) ![Tests](https://img.shields.io/badge/Tests-36%2F43_Passing-brightgreen) ![MediaPipe](https://img.shields.io/badge/MediaPipe-Hands-orange) ![Voice](https://img.shields.io/badge/Voice_Commands-EN%2FIT-blue)

---

## ✨ Features

- 🖐️ **Hand Gesture Control** - MediaPipe Hands tracking with 21 landmarks
- ⌨️ **Keyboard Navigation** - Full WASD + Arrow keys support
- 🎤 **Voice Commands** - Bilingual (English/Italian) speech recognition
- 🧠 **Adaptive System** - 3-level progressive unlock based on skill
- 🎨 **Quantum HUD** - Glassmorphism interface with live metrics
- 🌈 **Light Beams** - Akira-style visual feedback on navigation
- 🔊 **Spatial Audio** - 3D sound synthesis with Web Audio API
- 📊 **Navigation History** - Color-coded action tracking widget
- ⚡ **Zero Dependencies** - Pure ES6+ modules, no frameworks

---

## 🚀 Quick Start

### Modern Development (Recommended)

```bash
# Install dependencies
npm install

# Start dev server with HMR (Hot Module Replacement)
npm run dev
# → Opens at http://localhost:3000

# Run tests
npm test

# Build for production
npm run build

# Preview production build
npm run preview
```

### Traditional Static Server

```bash
# Python
python3 -m http.server 8080

# Node.js
npx http-server -p 8080

# PHP
php -S localhost:8080
```

### Start Navigating

1. Click **"🚀 Start Experience"**
2. Grant camera/microphone permissions
3. Hold hand in front of webcam
4. Swipe left/right to navigate!

**Full guide**: [docs/docs/GETTING_STARTED.md](docs/docs/GETTING_STARTED.md)

---

## 📖 Documentation

- **[Getting Started](docs/docs/GETTING_STARTED.md)** - Installation, first steps, troubleshooting
- **[Features](docs/docs/FEATURES.md)** - Complete feature breakdown and configuration
- **[Architecture](docs/docs/ARCHITECTURE.md)** - Technical deep-dive, module reference
- **[Testing](docs/docs/TEST_RESULTS.md)** - Playwright test suite results (36/43 passing)
- **[Optimization](docs/docs/OPTIMIZATION_GUIDE.md)** - Performance tuning guide

---

## 🎮 Navigation Methods

### Gestures 🖐️
- **Swipe Left/Right** → Navigate cards
- **Swipe Up/Down** → Change layers
- **Point (2s)** → Focus mode (Kamehameha effect)

### Keyboard ⌨️
- `A`/`D` or `←`/`→` → Navigate cards
- `W`/`S` or `↑`/`↓` → Navigate layers
- `M` → Toggle voice commands
- `F` → Fullscreen, `V` → Webcam view

### Voice 🎤
- English: "left", "right", "up", "down"
- Italian: "sinistra", "destra", "su", "giù"

---

## 🧠 Adaptive System

**3-Level Progressive Unlock**:
- **Level 1** (Default): Basic gestures
- **Level 2** (85% accuracy): Pinch, fan cards
- **Level 3** (90% accuracy): Fist collapse, explosions

System tracks accuracy, speed, and stability - auto-upgrades when ready!

---

## 🛠️ Technology

- **HTML5 + CSS3** - Glassmorphism, GPU-accelerated animations
- **JavaScript ES6+** - 12 modular components, zero dependencies
- **MediaPipe Hands** - 30 FPS hand tracking
- **Web Speech API** - Continuous voice recognition
- **Web Audio API** - Spatial sound synthesis
- **Canvas API** - Light beams and visual effects

---

## 🎯 Browser Support

| Browser | Version | Support |
|---------|---------|---------|
| Chrome  | 90+     | ✅ Full |
| Edge    | 90+     | ✅ Full |
| Opera   | 76+     | ✅ Full |
| Firefox | 88+     | ⚠️ Partial (voice limited) |
| Safari  | 14+     | ⚠️ Partial (voice may fail) |

**Requirements**: ES6 modules, MediaPipe WASM, Web Audio API, webcam access

---

## ⚙️ Configuration

All settings in `js/config.js`:

```javascript
// Grid Lock Sensitivity
CONFIG.gridLock = {
    threshold: 0.12,              // Horizontal (higher = less sensitive)
    thresholdVertical: 0.10       // Vertical (lower = easier)
}

// Audio
CONFIG.audio = {
    masterVolume: 0.3,            // 0-1 scale
    spatialEnabled: true          // 3D positioning
}

// Adaptive System
CONFIG.adaptiveNavigation = {
    enabled: true,
    levels: { /* difficulty settings */ }
}
```

---

## 🧪 Testing

```bash
npm install
npm test              # Run all tests (Playwright)
npm run test:ui       # Interactive test UI
npm run test:headed   # See browser execution
```

**Results**: 36/43 tests passing (83.7%)
- ✅ Keyboard navigation (100%)
- ✅ Adaptive system (90.9%)
- ✅ Navigation history (80%)
- ⚠️ Visual refinements (63.6% - CSS limitations in headless)

See [docs/TEST_RESULTS.md](docs/TEST_RESULTS.md) for details.

---

## 📦 Project Structure

```
/navigator
├── index.html                      # Main app (1170 lines)
├── style.css                       # Complete styling (2097 lines)
├── package.json                    # npm config for testing
├── playwright.config.js            # Test configuration
├── docs/                           # Documentation
│   ├── GETTING_STARTED.md          # Quick start guide
│   ├── FEATURES.md                 # Feature breakdown
│   ├── ARCHITECTURE.md             # Technical reference
│   ├── TEST_RESULTS.md             # Test suite results
│   └── OPTIMIZATION_GUIDE.md       # Performance tuning
├── tests/                          # Playwright test suites
│   ├── keyboard-navigation.spec.js
│   ├── adaptive-system.spec.js
│   ├── navigation-history.spec.js
│   └── visual-refinements.spec.js
└── js/                             # Modular ES6+ components
    ├── config.js                   # Centralized configuration
    ├── AdaptiveNavigationSystem.js # 3-level progression (455 lines)
    ├── VoiceCommandModule.js       # Speech recognition (390 lines)
    ├── AudioManager.js             # Spatial audio (709 lines)
    ├── NavigationController.js     # Navigation logic (~400 lines)
    ├── GestureDetector.js          # Hand tracking (~350 lines)
    ├── LightBeamSystem.js          # Akira beams (195 lines)
    ├── NavigationHistoryHUD.js     # Action tracking (180 lines)
    └── ... (5 more modules)
```

---

## 🔐 Security & Privacy

- **100% Client-Side** - All processing in browser
- **No Data Transmission** - Webcam/mic never leaves device
- **No Tracking** - Zero analytics or external services
- **No Storage** - No cookies, localStorage, or persistence
- **Open Source** - Full code transparency

---

## 🐛 Troubleshooting

### Gestures Not Working
- Check webcam permissions
- Ensure good lighting
- Hold hand clearly in frame
- Press `V` to see webcam view
- Look for green hand icon in HUD

### Voice Not Responding
- Press `M` to activate
- Check microphone permissions
- Look for green 🎤 icon (top-right)
- Use Chrome/Edge (best support)

### Performance Issues
- Close other browser tabs
- Disable dynamic background in `config.js`
- Reduce MediaPipe complexity to `modelComplexity: 0`

**Full guide**: [docs/GETTING_STARTED.md#troubleshooting](docs/GETTING_STARTED.md#troubleshooting)

---

## 🤝 Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

---

## 📄 License

MIT License - Free to use, modify, and distribute.

See [LICENSE](LICENSE) for full text.

---

## 🙏 Acknowledgments

**Technologies**:
- [MediaPipe Hands](https://google.github.io/mediapipe/solutions/hands) - Google's hand tracking ML
- [Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API) - Browser voice recognition
- [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API) - Spatial audio synthesis

**Design Inspiration**:
- Akira - Light beam aesthetics
- Blade Runner - Cyber UI elements
- Apple Vision Pro - Glassmorphism design

---

## 📧 Contact

Questions or feedback? Open an issue or discussion on GitHub!

---

**Built with ❤️ using modern web standards - no frameworks, just pure JavaScript magic.** ✨


1. **Position Info**: Current layer name + card counter (1/4)
2. **Navigation Controls**: 4 SVG buttons (prev/next cards, up/down layers)
3. **Adaptive Display**: Level progress bar + metrics
4. **Status Panel**: Hand detection, gesture legend, debug ticker
5. **Navigation History**: Last 5 actions with color-coded icons

**Design**:
- Convex glassmorphism with `backdrop-filter: blur(40px)`
- Inter font family, 72px height, 36px border-radius
- Translucent background `rgba(20,20,35,0.85)`
- Floating 20px from bottom edge
- Category-specific accent colors (cyan, magenta, green, orange)

### � Navigation History Widget

**Live action tracking** - see your last 5 navigation moves:

- **Color-coded icons**:
  - � Cyan: Card navigation (left/right swipes)
  - 🟣 Magenta: Layer navigation (up/down)
  - 🟢 Green: Voice commands
  - 🟠 Orange: Keyboard inputs
  
- **Smooth animations**: Icons fade in from right, scroll left, fade out
- **Auto-cleanup**: Oldest actions removed when new ones arrive
- **Source tracking**: Distinguishes gesture/keyboard/voice input

### 🎨 Visual Feedback

**Akira-Style Light Beams**:
- Horizontal cyan/magenta beams for card navigation
- Vertical pink/cyan beams for layer switching
- Gradient trails with velocity-based intensity
- Rendered on dedicated canvas layer

**3D Vanishing Point Perspective**:
- Active layer at z-depth 0 (full focus)
- Back layers at -500px, -1000px (visible, blurred)
- Front layers hidden (opacity 0) until gesture reveals
- Smooth blur transitions with CSS `filter`

**Dynamic Background**:
- Three animated glow orbs
- React to navigation velocity
- High-speed mode: Intense pulsing
- Auto-fade when idle (2s timeout)

### 🎵 Spatial Audio System

**Web Audio API** procedural sound synthesis:

- **Gesture Sounds**: Whoosh (swipe), beep (focus), grab (confirm)
- **Spatial Positioning**: 3D audio based on hand/card position
- **Navigation Feedback**: Success tones, error alerts
- **No Music**: Ambient loops disabled (gesture effects only)
- **Configurable**: Volume/type in `AudioManager.js`

### 🔒 Smart Grid Lock

Prevents accidental navigation and jitter:

- **Separate thresholds**: Vertical (0.10) easier than horizontal (0.12)
- **Velocity tracking**: Only responds to intentional movements
- **Direction cooldown**: 800ms delay before reversing
- **Infinite wrapping**: Seamless loops on all axes
- **Predictive intent**: Anticipates gesture completion

### ⚙️ Modular Architecture

```
/navigator
├── index.html                      # Main app (1170 lines, fully integrated)
├── style.css                       # Complete styling (2097 lines)
└── js/
    ├── config.js                   # Centralized configuration
    ├── AdaptiveNavigationSystem.js # ⭐ 3-level progression system
    ├── AdaptiveNavigationHUD.js    # Adaptive progress display
    ├── AudioManager.js             # Spatial audio synthesis
    ├── GestureDetector.js          # Hand gesture recognition
    ├── GridLockSystem.js           # Smart gesture processing
    ├── LayerManager.js             # Multi-layer state management
    ├── NavigationController.js     # Navigation logic & routing
    ├── DOMLODManager.js            # Performance optimization (LOD)
    ├── VisualEffects.js            # Canvas-based visual effects
    ├── LightBeamSystem.js          # ⭐ Akira-style light beams
    ├── VoiceCommandModule.js       # ⭐ Speech recognition (EN/IT)
    └── NavigationHistoryHUD.js     # ⭐ Action history tracking
```

---

## 🛠️ Technology Stack

- **HTML5** - Semantic structure
- **CSS3** - Glassmorphism, GPU-accelerated animations, backdrop filters
- **JavaScript (ES6+ Modules)** - Fully modular, 12 independent modules
- **MediaPipe Hands** - Real-time 21-landmark hand tracking
- **Web Speech API** - Continuous voice recognition (bilingual)
- **Web Audio API** - Spatial sound synthesis
- **Canvas API** - Light beams and visual effects rendering

---

## 📋 Prerequisites

- **Modern browser**: Chrome 90+, Edge 90+ (best), Firefox 88+, Safari 14+
- **Webcam**: For gesture input
- **Microphone**: For voice commands (optional)
- **Local server**: Required for ES6 modules and media access

---

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

---

## 🎮 How to Use

### First Launch

1. **Click "🚀 Start Experience"** - Grants camera/audio/microphone permissions
2. **Position your hand** - Hold hand clearly in front of webcam
3. **See the green hand icon** in quantum HUD (bottom) when detected

### Navigation Methods

**🖐️ Hand Gestures**:
- **Swipe left/right**: Navigate cards horizontally
- **Swipe up/down**: Change layers vertically
- **Point (hold 2s)**: Focus mode (Kamehameha effect)
- **Advanced gestures** unlock at Level 2 and Level 3

**⌨️ Keyboard**:
- `A` / `D` or `←` / `→`: Navigate cards
- `W` / `S` or `↑` / `↓`: Navigate layers
- `M`: Toggle voice commands
- `F`: Fullscreen toggle
- `V`: Toggle webcam view
- `D`: Delete current card

**🎤 Voice Commands** (press `M` to activate):
- **English**: "left", "right", "up", "down", "next", "back"
- **Italian**: "sinistra", "destra", "su", "giù", "avanti", "indietro"
- Look for 🎤 icon (top-right) when listening

### Understanding the HUD

**Bottom quantum HUD shows**:
- **Left**: Layer name + card position (e.g., "Videos 1/4")
- **Center**: 4 navigation buttons (clickable)
- **Middle**: Adaptive level progress bar
- **Right**: Hand status + gesture legend
- **Far right**: Last 5 navigation actions (color-coded history)

### Adaptive Level System

Start at **Level 1** with basic gestures. System tracks your:
- **Accuracy**: Successful vs failed gestures
- **Speed**: Average gesture completion time
- **Stability**: Consistency of movements

**Unlock progression**:
- **Level 2** (85% accuracy): Pinch gestures, fan cards
- **Level 3** (90% accuracy): Fist collapse, explosion effects

Watch the progress bar in HUD - green = ready to upgrade!

---

## ⚙️ Configuration

All settings in `js/config.js` - modify without breaking anything!

### Adjust Grid Lock Sensitivity

```javascript
CONFIG.gridLock = {
    threshold: 0.12,              // Horizontal sensitivity (higher = less sensitive)
    thresholdVertical: 0.10,      // Vertical sensitivity (lower = easier)
    minIntentVelocity: 0.015,     // Horizontal movement speed threshold
    minIntentVelocityVertical: 0.012 // Vertical movement speed threshold
}
```

### Adjust Adaptive System

```javascript
CONFIG.adaptiveNavigation = {
    enabled: true,
    levels: {
        1: { accuracyThreshold: 0.75, speedThreshold: 60, stabilityThreshold: 0.70 },
        2: { accuracyThreshold: 0.85, speedThreshold: 75, stabilityThreshold: 0.80 },
        3: { accuracyThreshold: 0.90, speedThreshold: 90, stabilityThreshold: 0.85 }
    }
```

### Audio Settings

```javascript
CONFIG.audio = {
    masterVolume: 0.3,           // Overall volume (0-1)
    spatialEnabled: true,        // 3D spatial positioning
    gestureEffectsEnabled: true  // Whoosh/beep sounds
}
```

### Camera & Hand Tracking

```javascript
CONFIG.camera = {
    maxNumHands: 1,              // Track one hand
    modelComplexity: 1,          // 0=lite, 1=full (recommended)
    minDetectionConfidence: 0.7, // Detection threshold
    minTrackingConfidence: 0.6   // Tracking threshold
}
```

---

## 🐛 Troubleshooting

### Camera Not Working
- Use `http://` or `https://` (not `file://`)
- Allow camera permissions in browser settings
- Try Chrome/Edge (best MediaPipe compatibility)
- Press `V` to toggle webcam view and verify feed

### Voice Commands Not Responding
- Press `M` to toggle voice recognition on
- Look for 🎤 icon (top-right) - green = listening
- Speak clearly in English or Italian
- Chrome/Edge have best Web Speech API support
- Check browser microphone permissions

### Gestures Not Detected
- Ensure good lighting conditions
- Position hand clearly in webcam frame
- Move hand slowly and deliberately
- Check quantum HUD for green hand icon
- Locked gestures show 🔒 hints - level up to unlock

### Performance Issues
- Close other browser tabs
- Reduce camera resolution in MediaPipe settings
- Disable dynamic background: set `CONFIG.effects.dynamicBackgroundEnabled = false`
- Check browser console for errors (F12)

### Navigation History Not Showing
- Widget appears far-right in quantum HUD
- Requires at least one navigation action to populate
- Color-coded: cyan (cards), magenta (layers), green (voice), orange (keyboard)

---

## 🎯 Performance Metrics

- **Hand Tracking**: 30 FPS (MediaPipe Hands)
- **Gesture Response**: <100ms with grid lock optimization
- **Frame Rate**: Target 60 FPS (browser-dependent)
- **Memory**: ~80MB (including MediaPipe + Web Speech)
- **Startup Time**: ~2-3s (MediaPipe model loading)

---

## 🔐 Security & Privacy

- **100% Client-Side**: All processing in browser
- **No Data Transmission**: Webcam/microphone data never leaves device
- **No Tracking**: Zero analytics or external services
- **No Storage**: No cookies, localStorage, or persistent data
- **Open Source**: Full code transparency

---

## 🚀 Advanced Features

### Voice Command Customization

Add custom voice commands in `VoiceCommandModule.js`:

```javascript
// Add new command mapping
voiceCommands.addCommand('home', 'layer-up');
voiceCommands.addCommand('casa', 'layer-up'); // Italian
```

### Navigation History API

Access history programmatically:

```javascript
const history = navHistory.getHistory();      // Get all entries
const count = navHistory.getCount();           // Get count
navHistory.clear();                            // Clear all history
navHistory.addAction('card-left', 'custom');   // Add custom action
```

### Adaptive System Callbacks

Hook into level changes:

```javascript
adaptiveNav.on('levelChange', (newLevel) => {
    console.log(`Unlocked Level ${newLevel}!`);
    // Custom actions when user levels up
});
```

### Light Beam Customization

Trigger custom light beams:

```javascript
lightBeams.createBeam('left', 0.8);           // Horizontal beam (intensity 0-1)
lightBeams.createVerticalBeam('up', 0.5);     // Vertical beam
```

---

## 📝 Module Reference

### Core Modules

| Module | Lines | Purpose |
|--------|-------|---------|
| `AdaptiveNavigationSystem.js` | 455 | 3-level progression tracking |
| `VoiceCommandModule.js` | 390 | Bilingual speech recognition |
| `AudioManager.js` | 709 | Spatial audio synthesis |
| `NavigationController.js` | ~400 | Navigation state management |
| `GestureDetector.js` | ~350 | Hand gesture recognition |
| `LightBeamSystem.js` | 195 | Akira-style visual beams |
| `NavigationHistoryHUD.js` | 180 | Action history tracking |

### Support Modules

| Module | Purpose |
|--------|---------|
| `LayerManager.js` | Multi-layer state management |
| `GridLockSystem.js` | Gesture smoothing & thresholds |
| `DOMLODManager.js` | Performance optimization (LOD) |
| `VisualEffects.js` | Canvas effects (Kamehameha, singularity) |
| `AdaptiveNavigationHUD.js` | Progress bar UI |

---

## 🎨 Design Philosophy

**Principles**:
1. **Content First**: Cards are hero element, UI is minimal
2. **Progressive Disclosure**: Advanced features unlock with skill
3. **Multi-Modal**: Support all input types (gesture/keyboard/voice)
4. **Immediate Feedback**: Every action has visual/audio response
5. **Zero Learning Curve**: Start navigating immediately

**Visual Language**:
- **Glassmorphism**: Translucent surfaces with blur
- **Cyber Aesthetics**: Akira-inspired light beams
- **Color Coding**: Consistent color = consistent meaning
- **Spatial Audio**: Sound follows visual position

---

## 🏆 Credits & Acknowledgments

**Technologies**:
- **[MediaPipe Hands](https://google.github.io/mediapipe/solutions/hands)** - Google's hand tracking
- **[Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API)** - Browser voice recognition
- **[Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)** - Spatial audio synthesis

**Design Inspiration**:
- **Akira** - Light beam aesthetics
- **Blade Runner** - Cyber UI elements
- **Apple Vision Pro** - Glassmorphism design

---

## 📄 License

MIT License - Free to use, modify, and distribute

---

## 📧 Contact

Questions? Open an issue or PR on GitHub!

---

**Built with ❤️ using modern web standards - no frameworks, just pure JavaScript magic.** ✨

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
