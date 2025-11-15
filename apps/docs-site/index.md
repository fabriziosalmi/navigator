---
layout: home

hero:
  name: "Navigator SDK"
  text: "Advanced Navigation for Web Apps"
  tagline: Gesture and keyboard navigation with cognitive intelligence
  actions:
    - theme: brand
      text: Get Started
      link: /getting-started
    - theme: alt
      text: View on GitHub
      link: https://github.com/fabriziosalmi/navigator
  image:
    src: /logo.svg
    alt: Navigator SDK

features:
  - icon: 🎯
    title: Unidirectional Data Flow
    details: Redux-like architecture with predictable state management and time-travel debugging
  
  - icon: 🤖
    title: Cognitive Intelligence
    details: ML-powered navigation that learns from user behavior and adapts to preferences
  
  - icon: 🔌
    title: Plugin Architecture
    details: Extensible plugin system for gestures, keyboard, rendering, and custom behaviors
  
  - icon: ⚡
    title: High Performance
    details: Optimized for 60fps, minimal memory footprint, and efficient event handling
  
  - icon: 🎨
    title: Framework Agnostic
    details: Works with React, Vue, vanilla JS, or any web framework
  
  - icon: 🧪
    title: Battle Tested
    details: 250+ tests with comprehensive coverage for reliability
---

## Quick Start

```bash
# Install
npm install @navigator/core

# Or with pnpm
pnpm add @navigator/core
```

```javascript
import { NavigatorCore } from '@navigator/core';

const nav = new NavigatorCore({
  enableGestures: true,
  enableKeyboard: true,
  cognitiveEnabled: true
});

nav.init();
```

## Why Navigator?

Navigator SDK transforms how users interact with web applications by providing:

- **Natural Interaction**: Combine keyboard shortcuts, hand gestures, and voice commands
- **Smart Adaptation**: Machine learning adapts to user behavior patterns
- **Developer Friendly**: Simple API, TypeScript support, extensive documentation
- **Production Ready**: Used in production apps with proven reliability

## Architecture Highlights

Built on a modern **unidirectional data flow** architecture (since November 2025):

- **Single Source of Truth**: Redux-like Store manages all state
- **Predictable Updates**: Actions → Reducers → State → UI
- **Time-Travel Debugging**: Track and replay every state change
- **Backward Compatible**: Legacy EventBus/AppState still supported

[Learn more about the architecture →](/architecture)
