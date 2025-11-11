# Navigator.Menu ✨

**The Sentient Interface SDK.** Navigate the web with gesture, voice, and predictive AI.

[![CI/CD Pipeline](https://github.com/fabriziosalmi/navigator/actions/workflows/validation.yml/badge.svg)](https://github.com/fabriziosalmi/navigator/actions/workflows/validation.yml)
[![Test Coverage](https://img.shields.io/badge/Coverage-95%25%2B-brightgreen)](./packages/core)
[![Tests](https://img.shields.io/badge/Tests-139%2B%20Passing-success)](./packages)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0%2B-blue)](https://www.typescriptlang.org/)

**[🚀 Live Demo](https://fabriziosalmi.github.io/navigator/)** | **[📚 Full Documentation](https://fabriziosalmi.github.io/navigator/docs/)** | **[🧑‍🍳 Cookbook Recipes](./docs/docs/COOKBOOK.md)**

Navigator is a **decoupled, plugin-based SDK** for building next-generation web interfaces. It's a context-aware perception platform that understands user intent, predicts actions, and adapts the UI in real-time.

---

## 🌟 Key Features

*   🧠 **Cognitive AI Engine:** Automatically detects user's mental state (frustrated, concentrated, etc.) and adapts the UI to help them.
*   🔮 **Predictive Intent System:** Predicts user actions *before* they are completed, enabling zero-latency interactions.
*   🔌 **Fully Plugin-Based:** The entire architecture is modular. Add or remove capabilities like gesture, voice, or keyboard input by simply adding a plugin.
*   ⚛️ **Framework Agnostic:** Works with any framework. Comes with official wrappers for **React** (`@navigator.menu/react`) and **Vue** (`@navigator.menu/vue`).
*   🛡️ **Robust & Tested:** Built with TypeScript, with **139+ tests** and **95%+ code coverage** on the core engine.
*   🧑‍💻 **World-Class DX:** A powerful CLI (`create-app`), a Plugin Development Kit (PDK), and a "Cookbook" full of practical recipes get you started in minutes.

---

## 🚀 Quick Start (React)

Get a keyboard-controlled app running in under 5 minutes.

### 1. Install Dependencies

```bash
npm install @navigator.menu/core @navigator.menu/react @navigator.menu/plugin-keyboard
```

### 2. Add to Your React App

```tsx
import { useState, useEffect } from 'react';
import { useNavigator } from '@navigator.menu/react';
import { KeyboardPlugin } from '@navigator.menu/plugin-keyboard';

function App() {
  const [lastKey, setLastKey] = useState('none');
  const [eventCount, setEventCount] = useState(0);

  // 🚀 Initialize Navigator with KeyboardPlugin
  const { core } = useNavigator({
    plugins: [new KeyboardPlugin()],
    autoStart: true
  });

  // 📡 Subscribe to keyboard events
  useEffect(() => {
    if (!core) return;

    const unsubscribe = core.eventBus.on('keyboard:keydown', (event) => {
      setLastKey(event.key);
      setEventCount(prev => prev + 1);
    });

    return unsubscribe;
  }, [core]);

  return (
    <div>
      <h1>🎯 Navigator Demo</h1>
      <p>Press any key!</p>
      <div>Last Key: <strong>{lastKey}</strong></div>
      <div>Events: <strong>{eventCount}</strong></div>
    </div>
  );
}
```

### 3. Run it!

```

**🎉 That's it!** You now have a fully decoupled keyboard input system. The magic? Change `KeyboardPlugin` to `GesturePlugin` later, and your app code **doesn't change at all**.

> For more examples, including **Gesture Control, Voice Commands, and Three.js integration**, check out our **[Cookbook Recipes](./docs/docs/COOKBOOK.md)**.

---

## 📖 Documentation

📚 **[Complete Documentation Index](docs/docs/INDEX.md)** - Full documentation catalog

### Quick Links
- **[Getting Started](docs/docs/GETTING_STARTED.md)** - Installation, first steps, troubleshooting
- **[Features](docs/docs/FEATURES.md)** - Complete feature breakdown and configuration
- **[Architecture](docs/docs/ARCHITECTURE.md)** - Technical deep-dive, module reference
- **[Cookbook](docs/docs/COOKBOOK.md)** - Recipes and development patterns
- **[Validation System](VALIDATION.md)** - Pre-push quality gates and CI/CD

---

---

## �️ Architecture

Navigator is a **monorepo** containing the core SDK, official plugins, framework wrappers, and demo applications.

```
/navigator
├── packages/                # 📦 The SDK (published to NPM)
│   ├── core/                # Core engine (EventBus, AppState, Lifecycle)
│   ├── types/               # TypeScript definitions & NIP Protocol
│   ├── pdk/                 # Plugin Development Kit
│   ├── cli/                 # Scaffolding tool: `create-app`
│   ├── plugin-keyboard/     # ⌨️  Keyboard input sensor
│   ├── plugin-logger/       # 📝 Configurable logging system
│   ├── plugin-dom-renderer/ # 🎨 DOM manipulation helpers
│   ├── plugin-mock-gesture/ # 🧪 Testing utilities
│   ├── react/               # ⚛️  React wrapper (`useNavigator` hook)
│   └── vue/                 # 💚 Vue wrapper (composables)
│
├── apps/                    # 🚀 Example Applications
│   ├── demo/                # Main demo (navigator.menu)
│   └── react-test-app/      # E2E validation app
│
└── docs/                    # 📚 Documentation & Guides
    ├── COOKBOOK.md          # Complete recipes & examples
    ├── ARCHITECTURE.md      # Deep-dive into design
    └── plugin-development/  # Build your own plugins
```

### The Navigator Way: Three Core Principles

Navigator is built on a **philosophy**, not just a pattern:

1. **🎤 Input Plugins Capture, They Don't Act**  
   Plugins translate physical inputs into standardized events. They never manipulate your app.

2. **👂 Your App Listens to Intents, Not Inputs**  
   Subscribe to `intent:navigate`, not `keydown`. Change input method with zero app code changes.

3. **💫 The Core is the Decoupled Heart**  
   All communication flows through the Event Bus. Plugins and your app never directly talk.

**[Learn more in our documentation →](./docs/docs/ARCHITECTURE.md)**

---

## 🧪 Quality & Validation

We take quality seriously. Every commit pushed to `main` must pass our **Ecosystem Validation System**, which includes:

-   ✅ **Dependency & Security Audit** (0 vulnerabilities)
-   ✅ **Code Linting & Quality Checks** (ESLint, Complexity Analysis)
-   ✅ **Unit & Integration Tests** (139+ tests, 95%+ coverage)
-   ✅ **Production Build** for all packages
-   ✅ **End-to-End Tests** (Playwright, 19+ scenarios)
-   ✅ **Bundle Size Checks** (Core: 3.25 KB gzipped)

You can run the full validation suite locally:

```bash
pnpm validate
```

### Test Results

```
packages/core:              116 tests passing  ✓
packages/plugin-keyboard:    23 tests passing  ✓
packages/react:             E2E validated      ✓
```

---

## 📦 Available Packages

| Package | Version | Size | Description |
|---------|---------|------|-------------|
| [`@navigator.menu/core`](./packages/core) | 2.0.0 | 3.25 KB | Core engine with Event Bus |
| [`@navigator.menu/react`](./packages/react) | 0.1.0 | 5.92 KB | React integration hooks |
| [`@navigator.menu/plugin-keyboard`](./packages/plugin-keyboard) | 1.0.0 | 802 B | Keyboard input plugin |
| [`@navigator.menu/plugin-logger`](./packages/plugin-logger) | 1.0.0 | - | Configurable logging |
| [`@navigator.menu/pdk`](./packages/pdk) | 2.0.0 | - | Plugin Development Kit |
| [`@navigator.menu/types`](./packages/types) | 2.0.0 | - | TypeScript definitions |

---

## 🎯 Use Cases

Navigator is perfect for building:

- 🎮 **Interactive Experiences:** Games, 3D viewers, immersive storytelling
- 🎬 **Media Players:** Video/audio players with gesture/voice control
- 🖼️ **Image Galleries:** Carousels, lightboxes with multi-input support
- 🏢 **Enterprise Dashboards:** Keyboard-first navigation for power users
- ♿ **Accessible Interfaces:** Multi-modal input for better accessibility
- 🧪 **Prototypes:** Quickly test different input methods without refactoring

**Requirements**: ES6 modules, MediaPipe WASM, Web Audio API, webcam access

---

## 🤝 Contributing

Contributions are welcome! Whether it's a bug report, a new feature, or a new recipe for the cookbook, we'd love to have your help.

**Getting Started:**

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/amazing-feature`
3. Make your changes and add tests
4. Run validation: `pnpm validate`
5. Submit a Pull Request

Please read our **[Contributing Guide](./CONTRIBUTING.md)** and **[Code of Conduct](./CODE_OF_CONDUCT.md)** for details.

---

## � Documentation

- **[Getting Started Guide](./docs/docs/GETTING_STARTED.md)** - Installation and first steps
- **[Cookbook](./docs/docs/COOKBOOK.md)** - Complete working examples
- **[Architecture Deep-Dive](./docs/docs/ARCHITECTURE.md)** - Understand the design philosophy
- **[Plugin Development](./docs/docs/PLUGIN_ARCHITECTURE.md)** - Build your own plugins
- **[API Reference](./documentation/docs/core-concepts.md)** - Complete API documentation

---

## 🌐 Community & Support

- **[GitHub Discussions](https://github.com/fabriziosalmi/navigator/discussions)** - Ask questions, share ideas
- **[Issues](https://github.com/fabriziosalmi/navigator/issues)** - Report bugs, request features
- **[Changelog](./CHANGELOG.md)** - See what's new in each release

---

## 📄 License

Navigator is open-source software licensed under the **[MIT License](./LICENSE)**.

---

## � Acknowledgments

Navigator is built with modern tools and inspired by great projects:

- **TypeScript** - Type safety and developer experience
- **Vite** - Lightning-fast builds
- **Vitest** - Delightful testing framework
- **Playwright** - Reliable E2E testing
- **pnpm** - Efficient package management

---

<div align="center">

**Made with ❤️ by the Navigator Team**

[⭐ Star us on GitHub](https://github.com/fabriziosalmi/navigator) • [📖 Read the docs](https://fabriziosalmi.github.io/navigator/docs/)

</div>
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
