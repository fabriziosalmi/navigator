# Navigator

A plugin-based SDK for building keyboard-navigable web interfaces with a Redux-like state management layer.

[![CI/CD Pipeline](https://github.com/fabriziosalmi/navigator/actions/workflows/validation.yml/badge.svg)](https://github.com/fabriziosalmi/navigator/actions/workflows/validation.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0%2B-blue)](https://www.typescriptlang.org/)

**[Documentation](https://github.com/fabriziosalmi/navigator/tree/main/apps/docs-site)** | **[Cookbook](./apps/docs-site/cookbook.md)**

Navigator is a **decoupled, plugin-based SDK** for building web interfaces driven by pluggable input sources. The core provides lifecycle management, a Redux-like Store, and a cognitive middleware that classifies user interaction patterns into behavioral states (neutral, frustrated, concentrated, exploring, learning).

## Table of Contents

- [Key Features](#key-features)
- [Quick Start (React)](#quick-start-react)
- [Performance Optimizations](#performance-optimizations)
- [Documentation](#documentation)
- [Architecture](#architecture)
- [Quality & Validation](#quality--validation)
- [Available Packages](#available-packages)
- [Use Cases](#use-cases)
- [Contributing](#contributing)
- [Community & Support](#community--support)
- [License](#license)
- [Acknowledgments](#acknowledgments)

---

## Key Features

*   **Plugin-Based Architecture:** The entire system is modular. Register input plugins (e.g., keyboard) or output plugins (e.g., DOM renderer) independently. Plugins communicate through a central Store rather than talking directly to each other.
*   **Redux-Like Store:** Unidirectional data flow with actions, reducers, and middleware. State is read-only and updated only through dispatched actions.
*   **Behavioral State Middleware:** A built-in cognitive middleware tracks user interaction patterns (error rate, action variety, timing) and classifies behavior into states. Plugins can subscribe to these states to adapt the UI.
*   **Parallel Plugin Initialization:** Plugins with higher priority are initialized in parallel, reducing startup time for setups with multiple critical plugins.
*   **Framework Agnostic:** The core has no DOM or framework dependencies. An official React wrapper (`@navigator.menu/react`) is included.
*   **TypeScript First:** All packages are written in TypeScript with full type definitions exported.
*   **Scaffolding Tools:** A CLI (`@navigator.menu/cli`) and `create-navigator-app` help you bootstrap new projects quickly.

---

## Quick Start (React)

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
  const [behavioralState, setBehavioralState] = useState('neutral');

  // Initialize Navigator with KeyboardPlugin
  const { core } = useNavigator({
    plugins: [new KeyboardPlugin()],
    autoStart: true
  });

  // Subscribe to Store state changes
  useEffect(() => {
    if (!core) return;

    const unsubscribe = core.store.subscribe(() => {
      const state = core.store.getState();
      setCurrentCard(state.navigation.currentCard);
      setBehavioralState(state.cognitive.currentState);
    });

    return unsubscribe;
  }, [core]);

  return (
    <div>
      <h1>Navigator Demo</h1>
      <p>Use Arrow Keys to navigate!</p>
      <div>Current Card: <strong>{currentCard}</strong></div>
      <div>Behavioral State: <strong>{behavioralState}</strong></div>
    </div>
  );
}
```

### 3. Run it!

```bash
npm run dev
```

The UI reacts to state changes dispatched through the Store. Swap `KeyboardPlugin` for a different input plugin and your application code remains unchanged.

> For more examples, see the **[Cookbook](./apps/docs-site/cookbook.md)**.

---

## Performance Optimizations

Navigator Core includes performance features to reduce startup overhead:

### Parallel Plugin Initialization

Plugins are initialized in parallel based on priority, reducing startup time when multiple critical plugins are registered:

```typescript
// Critical plugins (priority >= 100) load in parallel
// Deferred plugins (priority < 100) load in background

const core = new NavigatorCore();
core.registerPlugin('keyboard', new KeyboardPlugin(), { priority: 100 });
core.registerPlugin('analytics', new AnalyticsPlugin(), { priority: 50 });

await core.init();
```

Critical plugins with high priority are initialized concurrently; lower-priority plugins are deferred to the background.

### Debounced State Watchers

The legacy `AppState` API (deprecated, see [Architecture](./apps/docs-site/architecture.md)) supports opt-in debouncing to reduce callback frequency for high-frequency updates:

```typescript
// High-frequency updates: debounce mode
appState.watch('user.mousePosition', (pos) => {
  renderCursor(pos);
}, { mode: 'debounce', debounceMs: 16 });
```

Note: `AppState` is deprecated in v3.0. New code should use `store.subscribe()`.

---

## Documentation

- **[Cookbook](./apps/docs-site/cookbook.md)** - Working examples
- **[Architecture](./apps/docs-site/architecture.md)** - Design and data flow
- **[Plugin Development](./apps/docs-site/plugin-architecture.md)** - Build your own plugins
- **[Behavioral State Middleware](./apps/docs-site/cognitive-intelligence.md)** - How user behavior classification works
- **[Optimization Guide](./apps/docs-site/optimization-guide.md)** - Performance tips

---

## Architecture

Navigator is a **monorepo** containing the core SDK, official plugins, framework wrappers, and demo applications.

```
/navigator
├── packages/                # The SDK (published to npm)
│   ├── core/                # Core engine (Store, EventBus, AppState, Lifecycle)
│   ├── types/               # TypeScript definitions
│   ├── pdk/                 # Plugin Development Kit
│   ├── cli/                 # Scaffolding tool (`create-app`)
│   ├── create-navigator-app/ # App scaffolding tool
│   ├── plugin-keyboard/     # Keyboard input plugin
│   ├── plugin-logger/       # Configurable logging plugin
│   ├── plugin-dom-renderer/ # DOM manipulation helpers
│   ├── plugin-mock-gesture/ # Testing utilities
│   └── react/               # React wrapper (`useNavigator` hook)
│
├── apps/                    # Example applications
│   ├── showcase/            # Demo showcase application
│   ├── docs-site/           # Documentation
│   ├── pdk-demo/            # PDK demonstration
│   └── react-test-app/      # E2E validation app
│
└── project-docs/            # Project documentation
    ├── adrs/                # Architecture Decision Records
    ├── reports/             # Project reports
    └── research/            # Research documents
```

### Core Principles

1. **Input Plugins Capture, They Don't Act**
   Plugins translate physical inputs into Store actions. They never manipulate your application directly.

2. **Your App Subscribes to State, Not Raw Events**
   Subscribe to `store.subscribe()` for state changes. Changing the input plugin doesn't require changing your application code.

3. **The Store is the Single Source of Truth**
   All state changes flow through the Redux-like Store. Plugins and your application code communicate only through dispatched actions.

**[Learn more in our documentation](./apps/docs-site/architecture.md)**

---

## Quality & Validation

Every commit pushed to `main` must pass the Ecosystem Validation System, which includes:

-   Dependency & Security Audit
-   Code Linting (ESLint)
-   Unit & Integration Tests
-   Production Build for all packages
-   End-to-End Tests (Playwright)
-   Bundle Size Checks

You can run the full validation suite locally:

```bash
pnpm validate
```

---

## Available Packages

| Package | Version | Description |
|---------|---------|-------------|
| [`@navigator.menu/core`](./packages/core) | 3.0.3 | Core engine (Store, EventBus, AppState, lifecycle management) |
| [`@navigator.menu/react`](./packages/react) | 1.0.3 | React integration hook (`useNavigator`) |
| [`@navigator.menu/pdk`](./packages/pdk) | 3.0.1 | Plugin Development Kit |
| [`@navigator.menu/types`](./packages/types) | 3.0.1 | TypeScript definitions |
| [`@navigator.menu/cli`](./packages/cli) | 3.0.0 | Scaffolding CLI tool |
| [`create-navigator-app`](./packages/create-navigator-app) | 2.0.0 | App scaffolding tool |
| [`@navigator.menu/plugin-keyboard`](./packages/plugin-keyboard) | 2.0.3 | Keyboard input plugin |
| [`@navigator.menu/plugin-dom-renderer`](./packages/plugin-dom-renderer) | 2.0.3 | DOM manipulation helpers |
| [`@navigator.menu/plugin-logger`](./packages/plugin-logger) | 2.0.1 | Configurable logging plugin |
| [`@navigator.menu/plugin-mock-gesture`](./packages/plugin-mock-gesture) | 3.0.3 | Testing utilities |

---

## Use Cases

Navigator is suitable for building:

- **Keyboard-driven interfaces:** Power-user dashboards, data-heavy applications
- **Accessible interfaces:** Support multiple input modalities without changing application logic
- **Navigable carousels and galleries:** Card-based UIs that respond to pluggable input sources
- **Prototypes:** Test different input methods without refactoring application code

### Browser Requirements

- Modern browsers with ES6 module support
- Chrome 90+, Firefox 88+, Safari 14+, Edge 90+

---

## Contributing

Contributions are welcome. See the [Contributing Guide](./CONTRIBUTING.md) and [Code of Conduct](./CODE_OF_CONDUCT.md) for details.

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
   git checkout -b feat/my-feature
   ```
5. **Make your changes and add tests**
6. **Run validation:**
   ```bash
   pnpm validate
   ```
7. **Commit your changes:**
   ```bash
   git commit -m "feat: add my feature"
   ```
8. **Push to your fork:**
   ```bash
   git push origin feat/my-feature
   ```
9. **Submit a Pull Request**

### Local Development Commands

- `pnpm dev` - Start the demo application
- `pnpm build` - Build all packages
- `pnpm test` - Run all tests
- `pnpm lint` - Run linting
- `pnpm validate` - Run full validation suite (lint, test, build)

---

## Community & Support

- **[GitHub Discussions](https://github.com/fabriziosalmi/navigator/discussions)** - Ask questions, share ideas
- **[Issues](https://github.com/fabriziosalmi/navigator/issues)** - Report bugs, request features

---

## License

Navigator is open-source software licensed under the **[MIT License](./LICENSE)**.

---

## Acknowledgments

Navigator is built with:

- **TypeScript** - Type safety and developer experience
- **Vite** - Build tooling
- **Vitest** - Testing framework
- **Playwright** - E2E testing
- **pnpm** - Package management
