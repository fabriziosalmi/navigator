# Navigator ✨

**The Sentient Interface SDK.** Navigate the web with gesture, voice, and predictive AI.

[![CI/CD Pipeline](https://github.com/fabriziosalmi/navigator/actions/workflows/validation.yml/badge.svg)](https://github.com/fabriziosalmi/navigator/actions/workflows/validation.yml)
[![Test Coverage](https://img.shields.io/badge/Coverage-95%25%2B-brightgreen)](./packages/core)
[![Tests](https://img.shields.io/badge/Tests-386%2B%20Passing-success)](./packages)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0%2B-blue)](https://www.typescriptlang.org/)

**[🚀 Live Showcase](https://navigator-showcase.vercel.app)** | **[📦 SDK Demo](https://navigator-pdk-demo.vercel.app)** | **[📚 Documentation](https://github.com/fabriziosalmi/navigator/tree/main/apps/docs-site)** | **[🧑‍🍳 Cookbook](https://navigator-docs.vercel.app/cookbook)**

Navigator is a **decoupled, plugin-based SDK** for building next-generation web interfaces. It's a context-aware perception platform that understands user intent, predicts actions, and adapts the UI in real-time.

## 📑 Table of Contents

- [🌟 Key Features](#-key-features)
- [🚀 Quick Start (React)](#-quick-start-react)
- [⚡ Performance Optimizations](#-performance-optimizations-sprint-2)
- [📖 Documentation](#-documentation)
- [🏗️ Architecture](#️-architecture)
- [🧪 Quality & Validation](#-quality--validation)
- [📦 Available Packages](#-available-packages)
- [🎯 Use Cases](#-use-cases)
- [🤝 Contributing](#-contributing)
- [🌐 Community & Support](#-community--support)
- [📄 License](#-license)
- [🙏 Acknowledgments](#-acknowledgments)

---

## 🌟 Key Features

*   🧠 **Cognitive AI Engine:** An intelligent core that understands user behavior in real-time, detecting cognitive states like frustration or deep concentration. Features a context-aware state machine with "recovery cooldown" logic that adapts more humanly to user patterns, distinguishing genuine exploration from post-frustration recovery.
*   🔮 **Predictive Intent System:** Predicts user actions *before* they are completed, enabling zero-latency interactions.
*   🔌 **Fully Plugin-Based:** The entire architecture is modular. Add or remove capabilities like gesture, voice, or keyboard input by simply adding a plugin.
*   ⚡ **High-Performance Core:** Redux-like unidirectional data flow ensures **predictable state management** with time-travel debugging. Parallel plugin initialization (55-93% faster startup).
*   ⚛️ **Framework Agnostic:** Works with any framework. Comes with an official wrapper for **React** (`@navigator.menu/react`).
*   🛡️ **Robust & Tested:** Built with TypeScript, with **386+ tests** and **95%+ code coverage** across all packages.
*   🧑‍💻 **World-Class DX:** A powerful CLI (`create-app`), a Plugin Development Kit (PDK), and a "Cookbook" full of practical recipes get you started in minutes.

---

## 🚀 Quick Start (React)

Get a keyboard-controlled app running in under 5 minutes.

### Prerequisites

- Node.js 18.0.0 or higher
- npm, yarn, or pnpm

### 1. Install Dependencies

Using npm:
```bash
npm install @navigator.menu/core @navigator.menu/react @navigator.menu/plugin-keyboard
```

Using pnpm:
```bash
pnpm add @navigator.menu/core @navigator.menu/react @navigator.menu/plugin-keyboard
```

Using yarn:
```bash
yarn add @navigator.menu/core @navigator.menu/react @navigator.menu/plugin-keyboard
```

### 2. Add to Your React App

```tsx
import { useState, useEffect } from 'react';
import { useNavigator } from '@navigator.menu/react';
import { KeyboardPlugin } from '@navigator.menu/plugin-keyboard';

function App() {
  const [currentCard, setCurrentCard] = useState(0);
  const [cognitiveState, setCognitiveState] = useState('neutral');

  // 🚀 Initialize Navigator with KeyboardPlugin
  const { core, isReady } = useNavigator({
    plugins: [new KeyboardPlugin()],
    autoStart: true
  });

  // 📡 Subscribe to Store state changes (Redux-like pattern)
  useEffect(() => {
    if (!core) return;

    const unsubscribe = core.store.subscribe(() => {
      const state = core.store.getState();
      setCurrentCard(state.navigation.currentCard);
      setCognitiveState(state.cognitive.currentState);
    });

    return unsubscribe;
  }, [core]);

  return (
    <div>
      <h1>🎯 Navigator Demo</h1>
      <p>Use Arrow Keys to navigate!</p>
      <div>Current Card: <strong>{currentCard}</strong></div>
      <div>Cognitive State: <strong>{cognitiveState}</strong></div>
      <p>✨ Your UI is now a <em>pure function of state</em></p>
    </div>
  );
}
```

### 3. Run it!

```bash
npm run dev
```

**🎉 That's it!** You now have a **predictable, unidirectional data flow** powering your app. The UI is a pure function of state, and Navigator's Store manages everything with Redux-like patterns.

> **Why this matters:** With a single source of truth (the Store), you get time-travel debugging, predictable updates, and effortless testing. Change `KeyboardPlugin` to `GesturePlugin` later, and your app code **doesn't change at all**.

> For more examples, including **Gesture Control, Voice Commands, and Three.js integration**, check out our **[Cookbook Recipes](./apps/docs-site/cookbook.md)**.

---

## ⚡ Performance Optimizations (Sprint 2)

Navigator Core includes advanced performance features to ensure smooth, responsive UIs:

### 🚀 Parallel Plugin Initialization

Plugins are initialized in parallel based on priority, dramatically reducing startup time:

```typescript
// Critical plugins (priority >= 100) load in parallel
// Deferred plugins (priority < 100) load in background

const core = new NavigatorCore();
core.registerPlugin('keyboard', new KeyboardPlugin(), { priority: 100 });
core.registerPlugin('analytics', new AnalyticsPlugin(), { priority: 50 });

await core.init(); // ⚡ 55-93% faster startup!
```

**Performance Impact:**
- **3 critical plugins**: 93% faster (2850ms → 200ms)
- **Mixed workload**: 55% faster (400ms → 180ms)

### 🎯 Debounced State Watchers

Prevent main thread blocking from high-frequency state updates:

```typescript
// Default: sync mode (immediate callbacks)
appState.watch('user.level', (level) => {
  updateUI(level);
});

// High-frequency updates: debounce mode (60fps)
appState.watch('user.mousePosition', (pos) => {
  renderCursor(pos);
}, { mode: 'debounce', debounceMs: 16 });

// Custom debounce delay
appState.watch('search.query', performSearch, { 
  mode: 'debounce', 
  debounceMs: 300 
});
```

**Performance Impact:**
- **99% callback reduction** in burst scenarios
- **Protected main thread** from scroll/mouse events
- **100% backward compatible** (opt-in feature)

---

## 📖 Documentation

- **[Getting Started Guide](./apps/docs-site/getting-started.md)** - Installation and first steps
- **[Cookbook](./apps/docs-site/cookbook.md)** - Complete working examples
- **[Architecture Deep-Dive](./apps/docs-site/architecture.md)** - Understand the design philosophy
- **[Plugin Development](./apps/docs-site/plugin-architecture.md)** - Build your own plugins
- **[Features](./apps/docs-site/features.md)** - Complete feature breakdown and configuration
- **[Optimization Guide](./apps/docs-site/optimization-guide.md)** - Performance tips and best practices
- **[Cognitive Intelligence](./apps/docs-site/cognitive-intelligence.md)** - AI-powered user behavior modeling

---

## 🏗️ Architecture

Navigator is a **monorepo** containing the core SDK, official plugins, framework wrappers, and demo applications.

```
/navigator
├── packages/                # 📦 The SDK (published to NPM)
│   ├── core/                # Core engine (EventBus, AppState, Lifecycle)
│   ├── types/               # TypeScript definitions & NIP Protocol
│   ├── pdk/                 # Plugin Development Kit
│   ├── cli/                 # Scaffolding tool: `create-app`
│   ├── create-navigator-app/ # App scaffolding tool: `create-navigator-app`
│   ├── plugin-keyboard/     # ⌨️  Keyboard input sensor
│   ├── plugin-logger/       # 📝 Configurable logging system
│   ├── plugin-dom-renderer/ # 🎨 DOM manipulation helpers
│   ├── plugin-mock-gesture/ # 🧪 Testing utilities
│   └── react/               # ⚛️  React wrapper (`useNavigator` hook)
│
├── apps/                    # 🚀 Example Applications
│   ├── showcase/            # Main showcase application
│   ├── docs-site/           # Documentation site
│   ├── pdk-demo/            # PDK demonstration
│   └── react-test-app/      # E2E validation app
│
└── project-docs/            # 📚 Project Documentation
    ├── adrs/                # Architecture Decision Records
    ├── reports/             # Project reports
    └── research/            # Research documents
```

### The Navigator Way: Three Core Principles

Navigator is built on a **philosophy**, not just a pattern:

1. **🎤 Input Plugins Capture, They Don't Act**
   Plugins translate physical inputs into standardized events. They never manipulate your app.

2. **👂 Your App Listens to Intents, Not Inputs**
   Subscribe to `intent:navigate`, not `keydown`. Change input method with zero app code changes.

3. **💫 The Core is the Decoupled Heart**
   All communication flows through the Event Bus. Plugins and your app never directly talk.

**[Learn more in our documentation →](./apps/docs-site/architecture.md)**

---

## 🧪 Quality & Validation

We take quality seriously. Every commit pushed to `main` must pass our **Ecosystem Validation System**, which includes:

-   ✅ **Dependency & Security Audit** (0 vulnerabilities)
-   ✅ **Code Linting & Quality Checks** (ESLint, Complexity Analysis)
-   ✅ **Unit & Integration Tests** (207+ tests, 96%+ coverage)
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
| [`@navigator.menu/core`](./packages/core) | 3.0.3 | 3.25 KB | Core engine with Event Bus |
| [`@navigator.menu/react`](./packages/react) | 1.0.3 | 6.28 KB | React integration hooks |
| [`@navigator.menu/pdk`](./packages/pdk) | 3.0.1 | - | Plugin Development Kit |
| [`@navigator.menu/types`](./packages/types) | 3.0.1 | - | TypeScript definitions |
| [`@navigator.menu/cli`](./packages/cli) | 3.0.0 | - | Scaffolding CLI tool |
| [`create-navigator-app`](./packages/create-navigator-app) | 2.0.0 | - | App scaffolding tool |
| [`@navigator.menu/plugin-keyboard`](./packages/plugin-keyboard) | 2.0.3 | 1.07 KB | Keyboard input plugin |
| [`@navigator.menu/plugin-dom-renderer`](./packages/plugin-dom-renderer) | 2.0.3 | - | DOM manipulation helpers |
| [`@navigator.menu/plugin-logger`](./packages/plugin-logger) | 2.0.1 | - | Configurable logging |
| [`@navigator.menu/plugin-mock-gesture`](./packages/plugin-mock-gesture) | 3.0.3 | - | Testing utilities |

---

## 🎯 Use Cases

Navigator is perfect for building:

- 🎮 **Interactive Experiences:** Games, 3D viewers, immersive storytelling
- 🎬 **Media Players:** Video/audio players with gesture/voice control
- 🖼️ **Image Galleries:** Carousels, lightboxes with multi-input support
- 🏢 **Enterprise Dashboards:** Keyboard-first navigation for power users
- ♿ **Accessible Interfaces:** Multi-modal input for better accessibility
- 🧪 **Prototypes:** Quickly test different input methods without refactoring

### Browser Requirements

- Modern browsers with ES6 module support
- Chrome 90+, Firefox 88+, Safari 14+, Edge 90+

### Optional Features

Some plugins may require additional browser APIs:
- **MediaPipe WASM** - For advanced gesture recognition
- **Web Audio API** - For voice/audio features
- **Webcam access** - For camera-based input methods

---

## 🤝 Contributing

Contributions are welcome! Whether it's a bug report, a new feature, or a new recipe for the cookbook, we'd love to have your help.

### Getting Started

1. **Fork the repository**
2. **Clone your fork:**
   ```bash
   git clone https://github.com/YOUR_USERNAME/navigator.git
   cd navigator
   ```
3. **Install dependencies:**
   ```bash
   pnpm install
   ```
4. **Create a feature branch:**
   ```bash
   git checkout -b feat/amazing-feature
   ```
5. **Make your changes and add tests**
6. **Run validation:**
   ```bash
   pnpm validate
   ```
7. **Commit your changes:**
   ```bash
   git commit -m "feat: add amazing feature"
   ```
8. **Push to your fork:**
   ```bash
   git push origin feat/amazing-feature
   ```
9. **Submit a Pull Request**

### Local Development Commands

- `pnpm dev` - Start the demo application
- `pnpm build` - Build all packages
- `pnpm test` - Run all tests
- `pnpm lint` - Run linting
- `pnpm validate` - Run full validation suite (lint, test, build)

Please read our **[Contributing Guide](./CONTRIBUTING.md)** and **[Code of Conduct](./CODE_OF_CONDUCT.md)** for more details.

---

## 🌐 Community & Support

- **[GitHub Discussions](https://github.com/fabriziosalmi/navigator/discussions)** - Ask questions, share ideas
- **[Issues](https://github.com/fabriziosalmi/navigator/issues)** - Report bugs, request features

---

## 📄 License

Navigator is open-source software licensed under the **[MIT License](./LICENSE)**.

---

## 🙏 Acknowledgments

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
