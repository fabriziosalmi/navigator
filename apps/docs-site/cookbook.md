# Navigator SDK - Cookbook 🧑‍🍳

**Learn by doing.** Complete, working examples you can copy and customize.

> **"La primissima e più importante ricetta"** - Start here if you're using React!

---

## 🧭 The Navigator Way: Three Core Principles

Before diving into the recipes, understand the **architectural philosophy** that makes Navigator different from every other UI framework:

### Principle #1: Input Plugins Capture, They Don't Act

**What This Means**: Input plugins (keyboard, gesture, voice) have **one job only**: translate physical world inputs into standardized digital events on the Event Bus.

- ✅ **They DO**: Detect keypresses, touches, voice commands
- ✅ **They DO**: Emit standardized NIP (Navigator Intent Protocol) events
- ❌ **They DON'T**: Know what your application does
- ❌ **They DON'T**: Manipulate DOM or application state
- ❌ **They DON'T**: Contain business logic

**Example**: A `KeyboardPlugin` doesn't know if pressing "ArrowLeft" will navigate a carousel, move a 3D camera, or undo text. It just emits `intent:navigate({ direction: 'left' })`.

### Principle #2: Your Application Listens to Intents, Not Inputs

**What This Means**: Your application code **never** directly listens to `keydown`, `touchstart`, or `voice` events. Instead, it subscribes to **intent events** from the Event Bus.

- ✅ **You DO**: Listen to `intent:navigate`, `intent:select`, `intent:media_play`
- ✅ **You DO**: Update your application state in response to intents
- ❌ **You DON'T**: Use `document.addEventListener('keydown', ...)`
- ❌ **You DON'T**: Put input detection logic in your components

**Why This Matters**: Your carousel component works identically whether controlled by keyboard, gestures, or voice. Change input method = **zero code changes** in your app.

### Principle #3: The Core is the Decoupled Heart

**What This Means**: All communication flows through the `NavigatorCore` Event Bus. Input plugins and your application **never directly communicate**.

```
┌─────────────────┐
│  Keyboard      │───┐
│  Plugin        │   │
└─────────────────┘   │
                      ▼
┌─────────────────┐   ┌──────────────┐   ┌─────────────────┐
│  Gesture       │──▶│ Navigator    │──▶│  Your App      │
│  Plugin        │   │ Core         │   │  (React/Vue/   │
└─────────────────┘   │ (Event Bus)  │   │   Vanilla)     │
                      └──────────────┘   └─────────────────┘
┌─────────────────┐   ▲
│  Voice         │───┘
│  Plugin        │
└─────────────────┘
```

**The Result**: 
- 🔄 **Hot-swappable inputs**: Change `KeyboardPlugin` to `GesturePlugin` without touching app code
- 🧪 **Testable**: Mock the Event Bus to test your app without real input devices
- 🎯 **Maintainable**: Each layer has a single responsibility
- 🚀 **Scalable**: Add new input methods (gamepad, eye-tracking) without refactoring

---

## 📚 The Three-Layer Architecture in Every Recipe

Every recipe in this cookbook follows the same pattern:

```typescript
// LAYER 1: Input Plugins (Capture)
const keyboardPlugin = new KeyboardPlugin();  // Captures keypresses
const gesturePlugin = new GesturePlugin();    // Captures touch/swipes

// LAYER 2: Core (Orchestrate)
const core = new NavigatorCore();
core.registerPlugin(keyboardPlugin);
core.registerPlugin(gesturePlugin);

// LAYER 3: Application (Act)
core.eventBus.on('intent:navigate', (payload) => {
  // YOUR business logic here
  // Could be: navigate carousel, rotate 3D object, change video timestamp
});

core.start();
```

**This is not just a pattern. It's a philosophy.** Once you internalize this, you'll see how it makes complex UIs trivial to build and maintain.

---

## Table of Contents

1. [**Getting Started with React**](#getting-started-with-react) ⭐ **START HERE**
2. [Image Carousel with Gestures](#image-carousel-with-gestures)
3. [Video Player with Voice Commands](#video-player-with-voice-commands)
4. [Navigator + Three.js (3D Cube)](#navigator--threejs-3d-cube)
5. [Next.js Integration](#nextjs-integration)
6. [Custom Plugin: Shake to Undo](#custom-plugin-shake-to-undo)

---

## Recipe #1: Building a Keyboard-Controlled Counter in React in Under 5 Minutes

> **What We're Building**: A real-time keyboard event display that reacts to every keypress—completely decoupled from the input layer. By the end of this recipe, you'll understand why Navigator's architecture is a game-changer.

---

### 🎬 The Result (What You'll Get)

Imagine this: You press a key, and your React component instantly updates—**without a single `addEventListener` in sight**. No tight coupling. No spaghetti code. Just clean, testable architecture.

```
┌─────────────────────────────────────┐
│  🎯 Navigator + React Demo          │
│                                     │
│  Press any key to see events!       │
│                                     │
│  Last Key:     ArrowLeft            │
│  Events:       47                   │
│  Core:         ✅ Running           │
└─────────────────────────────────────┘
```

**The Magic**: Change `KeyboardPlugin` to `GesturePlugin` later, and this component won't need a single line changed. **That's the power of decoupled architecture.**

---

### 🧂 Ingredients (What You'll Need)

```bash
@navigator.menu/core           # The orchestrator
@navigator.menu/react          # React lifecycle hook (722 bytes!)
@navigator.menu/plugin-keyboard # Keyboard input sensor
```

**Time**: 5 minutes  
**Difficulty**: ⭐ Beginner  
**Prerequisites**: Basic React knowledge (useState, useEffect)

---

### 👨‍🍳 Preparation (Step-by-Step)

#### Step 1: Create Your React Project

```bash
# Using Vite (recommended for speed)
npx create-vite@latest my-navigator-app --template react-ts
cd my-navigator-app
```

#### Step 2: Install Navigator Packages

```bash
pnpm add @navigator.menu/core @navigator.menu/react @navigator.menu/plugin-keyboard
# or npm install ...
```

#### Step 3: The Complete Component (Copy-Paste Ready!)

Replace your `src/App.tsx` with this complete, working code:

```tsx
// src/App.tsx
import { useState, useEffect } from 'react';
import { useNavigator } from '@navigator.menu/react';
import { KeyboardPlugin } from '@navigator.menu/plugin-keyboard';

function App() {
  // Your component's state (YOU manage this, not Navigator)
  const [lastKey, setLastKey] = useState<string | null>(null);
  const [eventCount, setEventCount] = useState(0);

  // 🎯 STEP 1: Initialize the Navigator engine
  // This is where we tell Navigator which "senses" to use.
  // In this case, we're only using the keyboard sensor.
  const { core } = useNavigator({
    plugins: [new KeyboardPlugin()],
  });

  // 🎯 STEP 2: Subscribe to navigation intents
  // This is the MAGIC part. Your component doesn't know WHO is emitting
  // these events. It could be a keyboard, a game controller, or even
  // a gesture system. Your component just listens and reacts.
  useEffect(() => {
    if (!core) return; // Wait for Navigator to initialize

    // Subscribe to raw keyboard events
    const unsubscribe = core.eventBus.on('keyboard:keydown', (event) => {
      setLastKey(event.key);
      setEventCount((prev) => prev + 1);
    });

    // 🎯 STEP 3: Cleanup (CRITICAL for preventing memory leaks!)
    // When this component unmounts, we unsubscribe from events.
    // useNavigator handles the Core lifecycle, YOU handle subscriptions.
    return unsubscribe;
  }, [core]);

  return (
    <div style={{ padding: '2rem', fontFamily: 'system-ui' }}>
      <h1>🎯 Navigator + React Demo</h1>
      <p>Press any key to see events in action!</p>

      <div style={{ 
        marginTop: '2rem', 
        padding: '1.5rem', 
        background: '#f5f5f5', 
        borderRadius: '8px' 
      }}>
        <p>
          <strong>Last Key:</strong> 
          <code style={{ marginLeft: '1rem', fontSize: '1.2em' }}>
            {lastKey || 'none'}
          </code>
        </p>
        <p>
          <strong>Events:</strong> 
          <span style={{ marginLeft: '1rem', fontSize: '1.2em' }}>
            {eventCount}
          </span>
        </p>
        <p>
          <strong>Core Status:</strong> 
          <span style={{ marginLeft: '1rem' }}>
            {core ? '✅ Running' : '⏳ Initializing...'}
          </span>
        </p>
      </div>
    </div>
  );
}

export default App;
```

#### Step 4: Run It!

```bash
pnpm dev  # or npm run dev
```

Open your browser, **press any key**, and watch the magic happen! ✨

---

### 🎓 Understanding the Magic (The "Why" Behind the Code)

#### Part 1: `useNavigator` - Your Connection to the Engine

```tsx
const { core } = useNavigator({
  plugins: [new KeyboardPlugin()],
});
```

**What's happening here?**
- `useNavigator` initializes Navigator's core engine
- We pass `KeyboardPlugin` as our input "sensor"
- The hook manages the **entire lifecycle** (start, stop, cleanup) for us
- We get back `core`, which gives us access to the EventBus

**Why this matters**: You never touch window.addEventListener. Navigator handles that.

---

#### Part 2: `useEffect` - The Event Subscription

```tsx
useEffect(() => {
  if (!core) return;
  
  const unsubscribe = core.eventBus.on('keyboard:keydown', (event) => {
    setLastKey(event.key);
    setEventCount((prev) => prev + 1);
  });
  
  return unsubscribe;
}, [core]);
```

**What's happening here?**
- We subscribe to `keyboard:keydown` events via the EventBus
- When an event arrives, we update our React state
- We return the `unsubscribe` function for cleanup

**The magic**: Your component has **ZERO knowledge** of KeyboardPlugin. It just listens to events. This is **pure decoupling**.

---

#### Part 3: Cleanup - The Unsung Hero

```tsx
return unsubscribe;  // ← THIS LINE PREVENTS MEMORY LEAKS!
```

**What's happening here?**
- When your component unmounts, React calls this cleanup function
- `unsubscribe()` removes our event listener from the EventBus
- This prevents memory leaks and stale subscriptions

**Why this matters**: useNavigator handles Core lifecycle, but **YOU** handle subscription cleanup. Clean separation of concerns.

---

### 🍽️ The Final Dish (What You Just Built)

Congratulations! You've just built a React app that responds to keyboard input through a **completely decoupled architecture**.

**Here's the power move**: 

```tsx
// Original (keyboard input)
const { core } = useNavigator({
  plugins: [new KeyboardPlugin()],
});

// Later... (gesture input)
const { core } = useNavigator({
  plugins: [new GesturePlugin()],  // ← Only line that changed!
});
```

**Your component stays EXACTLY the same**. No rewrites. No refactoring. Just swap the plugin.

**This is the power of Navigator**:
- 🔌 **Plugins are hot-swappable** (keyboard → gestures → voice)
- 🎨 **UI is framework-agnostic** (React today, Vue tomorrow)
- 🧪 **Every layer is independently testable**
- 📦 **True modularity** (change one piece without breaking others)

---

### 🚀 Next Steps

Now that you've mastered the basics, try these challenges:

1. **Add Navigation Intents**: Listen to `intent:navigate_left` instead of raw key events
2. **Build a Menu**: Create a navigable menu using arrow keys
3. **Go Multi-Modal**: Combine KeyboardPlugin + GesturePlugin in the same app

**Full working example**: Check out [apps/react-test-app on GitHub](https://github.com/fabriziosalmi/navigator/tree/main/apps/react-test-app) for the complete source code with styling and architecture diagrams.

---

### 💡 Troubleshooting

**"I see errors about missing peer dependencies"**
- Make sure you installed all three packages: core, react, and plugin-keyboard

**"Events aren't firing"**
- Check that `core` is truthy before subscribing (add the `if (!core) return` guard)
- Make sure your browser tab has focus (keyboard events need focus!)

**"Memory leaks warning in console"**
- Ensure you're returning `unsubscribe` from your useEffect cleanup function

---

**Time to completion**: 4 minutes 37 seconds ✅  
**Lines of code you wrote**: 25 (the rest is boilerplate)  
**Lines of coupling**: 0 🎉

---

### 🎓 Advanced Pattern: Using the Store (Redux-like Unidirectional Flow)

> **NEW in Navigator v3.0**: In addition to EventBus subscriptions, Navigator now provides a **Redux-like Store** for state management. This pattern is recommended for production applications.

#### Why Use the Store Pattern?

- ✅ **Single Source of Truth**: All state lives in one place
- ✅ **Predictable Updates**: State can only be changed via actions
- ✅ **Time-Travel Debugging**: Full history of state changes
- ✅ **Better Testing**: Pure functions are easier to test
- ✅ **React-Friendly**: Mimics Redux patterns React devs know

#### The Store-Based Version

Replace the EventBus subscription with a Store subscription:

```tsx
import { useState, useEffect } from 'react';
import { useNavigator } from '@navigator.menu/react';
import { KeyboardPlugin } from '@navigator.menu/plugin-keyboard';

function App() {
  const [currentCard, setCurrentCard] = useState(0);
  const [cognitiveState, setCognitiveState] = useState('neutral');

  // Initialize Navigator with KeyboardPlugin
  const { core, isReady } = useNavigator({
    plugins: [new KeyboardPlugin()],
    autoStart: true
  });

  // 🎯 STORE PATTERN: Subscribe to state changes (not events)
  useEffect(() => {
    if (!core) return;

    // This is the magic: Your UI is now a PURE FUNCTION of state
    const unsubscribe = core.store.subscribe(() => {
      const state = core.store.getState();
      
      // Update React state from Navigator state
      setCurrentCard(state.navigation.currentCard);
      setCognitiveState(state.cognitive.currentState);
    });

    return unsubscribe;
  }, [core]);

  return (
    <div style={{ padding: '2rem', fontFamily: 'system-ui' }}>
      <h1>🎯 Navigator + Store Pattern</h1>
      <p>Use Arrow Keys to navigate!</p>

      <div style={{ 
        marginTop: '2rem', 
        padding: '1.5rem', 
        background: '#f5f5f5', 
        borderRadius: '8px' 
      }}>
        <p><strong>Current Card:</strong> <code>{currentCard}</code></p>
        <p><strong>Cognitive State:</strong> <code>{cognitiveState}</code></p>
        <p>✨ Your UI is a <em>pure function of state</em></p>
      </div>
    </div>
  );
}
```

#### What Changed?

**EventBus Pattern (Events):**
```tsx
core.eventBus.on('keyboard:keydown', (event) => {
  // React to individual events
  setLastKey(event.key);
});
```

**Store Pattern (State):**
```tsx
core.store.subscribe(() => {
  const state = core.store.getState();
  // React to complete state snapshots
  setCurrentCard(state.navigation.currentCard);
});
```

#### The Store State Structure

```typescript
interface NavigatorState {
  navigation: {
    currentCard: number;
    currentLayer: number;
    direction: 'left' | 'right' | 'up' | 'down' | null;
    isAnimating: boolean;
  };
  cognitive: {
    currentState: 'neutral' | 'concentrated' | 'frustrated' | 'flow';
    confidence: number;
    lastUpdate: number;
  };
  input: {
    keyboard: { enabled: boolean; lastKey: string; ... };
    gesture: { enabled: boolean; lastGesture: string; ... };
  };
  ui: {
    theme: 'light' | 'dark';
    focusMode: boolean;
  };
  // ... and more
}
```

#### When to Use Which Pattern?

| Pattern | Use When | Example |
|---------|----------|---------|
| **EventBus** | Reacting to specific actions | "When user presses Enter, submit form" |
| **Store** | Rendering UI based on state | "Show current card number" |
| **Both** | Complex apps with side effects | "Listen to events for side effects, read Store for rendering" |

**Pro Tip**: Modern Navigator apps use **Store for UI rendering** and **EventBus for side effects** (analytics, logging, external API calls).

---

## Recipe #2: Image Carousel with Touch Gestures

**Goal**: Build a touch-controlled image carousel that demonstrates the Navigator Way—plugins capture, core orchestrates, app acts.

> **Architectural Focus**: This recipe shows how to separate **input detection** (swipe gestures) from **business logic** (carousel navigation). The `TouchGesturePlugin` is completely reusable—it could control a carousel, a menu, or a 3D scene without modification.

---

### 🎬 The Result

A smooth, gesture-controlled carousel where:
- ← **Swipe left** = Next image
- → **Swipe right** = Previous image
- 🎯 **Plugin** = Generic touch detector (knows nothing about carousels)
- 🧠 **App** = Carousel logic (knows nothing about touch events)

---

### 🧂 Ingredients

```bash
@navigator.menu/core                    # The orchestrator
@navigator.menu/plugin-touch-gesture    # Generic swipe detector (we'll create this!)
```

---

### 👨‍🍳 Step 1: Create the Generic TouchGesturePlugin

This plugin's **only responsibility** is detecting swipes and emitting standardized navigation intents.

```javascript
// plugins/TouchGesturePlugin.js
import { BasePlugin } from '@navigator.menu/pdk';

export class TouchGesturePlugin extends BasePlugin {
  constructor() {
    super('touch-gesture');
    this.touchStartX = 0;
    this.touchStartY = 0;
    this.minSwipeDistance = 50;
  }

  async init(core) {
    this.core = core;
    
    // LAYER 1: Capture raw input
    document.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: true });
    document.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: true });
    
    return Promise.resolve();
  }

  handleTouchStart(e) {
    this.touchStartX = e.touches[0].clientX;
    this.touchStartY = e.touches[0].clientY;
  }

  handleTouchEnd(e) {
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    
    const diffX = this.touchStartX - touchEndX;
    const diffY = this.touchStartY - touchEndY;
    
    // Detect horizontal swipe (ignore vertical scrolling)
    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > this.minSwipeDistance) {
      const direction = diffX > 0 ? 'left' : 'right';
      
      // LAYER 2: Emit standardized intent (NOT carousel-specific!)
      this.core.eventBus.emit('intent:navigate', {
        target: 'element',
        direction: direction,
        source: 'touch_swipe',
        distance: Math.abs(diffX),
        timestamp: Date.now()
      });
    }
  }

  async destroy() {
    document.removeEventListener('touchstart', this.handleTouchStart);
    document.removeEventListener('touchend', this.handleTouchEnd);
  }
}
```

**🎯 Notice**: This plugin doesn't know what a "carousel" is. It just detects swipes and emits `intent:navigate`. You could use this same plugin to control a 3D scene, a menu, or a game.

---

### 👨‍🍳 Step 2: Build the Carousel Application Layer

Now the **business logic**—this is where carousel-specific code lives.

```javascript
// main.js
import { NavigatorCore } from '@navigator.menu/core';
import { TouchGesturePlugin } from './plugins/TouchGesturePlugin.js';

// ==========================================
// LAYER 3: APPLICATION LOGIC (Carousel-specific)
// ==========================================

const images = [
  'https://picsum.photos/800/600?random=1',
  'https://picsum.photos/800/600?random=2',
  'https://picsum.photos/800/600?random=3',
  'https://picsum.photos/800/600?random=4'
];

let currentIndex = 0;

function navigate(direction) {
  if (direction === 'left') {
    currentIndex = (currentIndex + 1) % images.length;
  } else if (direction === 'right') {
    currentIndex = (currentIndex - 1 + images.length) % images.length;
  }
  updateCarousel();
}

function updateCarousel() {
  const img = document.getElementById('carousel-image');
  const indexDisplay = document.getElementById('carousel-index');
  
  img.src = images[currentIndex];
  indexDisplay.textContent = `${currentIndex + 1} / ${images.length}`;
  
  // Nice animation effect
  img.style.transform = 'scale(0.95)';
  setTimeout(() => {
    img.style.transform = 'scale(1)';
  }, 100);
}

// ==========================================
// INITIALIZE NAVIGATOR
// ==========================================

const core = new NavigatorCore();
core.registerPlugin(new TouchGesturePlugin());

// LAYER 3: Subscribe to intents (not raw touch events!)
core.eventBus.on('intent:navigate', (payload) => {
  if (payload.source === 'touch_swipe') {
    navigate(payload.direction);
  }
});

// Start the engine
core.start().then(() => {
  console.log('✅ Carousel ready! Swipe left/right to navigate.');
  updateCarousel();
});

// Optional: Add keyboard support by just registering another plugin!
// import { KeyboardPlugin } from '@navigator.menu/plugin-keyboard';
// core.registerPlugin(new KeyboardPlugin());
// 
// core.eventBus.on('intent:navigate', (payload) => {
//   if (payload.source === 'keyboard') {
//     navigate(payload.direction);
//   }
// });
```

---

### 👨‍🍳 Step 3: HTML Structure

```html
<!-- index.html -->
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Navigator Carousel</title>
  <style>
    body {
      margin: 0;
      padding: 2rem;
      font-family: system-ui, -apple-system, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .carousel-container {
      max-width: 800px;
      width: 100%;
      text-align: center;
    }

    #carousel-image {
      width: 100%;
      border-radius: 16px;
      transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
      box-shadow: 0 20px 60px rgba(0,0,0,0.4);
      user-select: none;
    }

    .carousel-controls {
      margin-top: 2rem;
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 2rem;
      color: white;
      font-size: 1.2rem;
    }

    .carousel-controls button {
      font-size: 2rem;
      background: rgba(255,255,255,0.2);
      backdrop-filter: blur(10px);
      border: 2px solid rgba(255,255,255,0.3);
      border-radius: 12px;
      padding: 0.5rem 1rem;
      cursor: pointer;
      color: white;
      transition: all 0.2s;
    }

    .carousel-controls button:hover {
      background: rgba(255,255,255,0.3);
      transform: scale(1.1);
    }

    #carousel-index {
      font-weight: 600;
      min-width: 80px;
    }

    .hint {
      margin-top: 1rem;
      color: rgba(255,255,255,0.8);
      font-size: 0.9rem;
    }
  </style>
</head>
<body>
  <div class="carousel-container">
    <img id="carousel-image" src="" alt="Carousel">
    <div class="carousel-controls">
      <button onclick="navigate('right')">←</button>
      <span id="carousel-index">1 / 4</span>
      <button onclick="navigate('left')">→</button>
    </div>
    <div class="hint">
      💡 Try swiping left/right on mobile!
    </div>
  </div>
  
  <script type="module" src="./main.js"></script>
</body>
</html>
```

---

### 🍽️ What You Just Built

Congratulations! You've built a carousel following **The Navigator Way**:

1. ✅ **TouchGesturePlugin** (Input Layer): Detects swipes, emits `intent:navigate`
2. ✅ **NavigatorCore** (Orchestration Layer): Routes events via Event Bus
3. ✅ **Carousel Logic** (Application Layer): Listens to intents, updates images

**The Power Move**: Want to add keyboard support?

```javascript
// Just add this - carousel code stays unchanged!
import { KeyboardPlugin } from '@navigator.menu/plugin-keyboard';
core.registerPlugin(new KeyboardPlugin());

core.eventBus.on('intent:navigate', (payload) => {
  navigate(payload.direction);  // Works for BOTH touch and keyboard!
});
```

**Zero refactoring needed**. That's the magic of decoupled architecture.

---

### 💡 Key Takeaways

- 🔌 **Plugin is generic**: `TouchGesturePlugin` knows nothing about carousels
- 🧠 **App owns logic**: Carousel navigation lives in application layer
- 🎯 **Intent-based**: App listens to `intent:navigate`, not `touchend`
- 🔄 **Multi-modal ready**: Add keyboard/voice without touching carousel code

---

## Recipe #3: Video Player with Voice Commands

**Goal**: Control a video player with voice commands—demonstrates how voice input becomes just another plugin in the Navigator ecosystem.

> **Architectural Focus**: This recipe shows how to separate **voice recognition** (input layer) from **media control** (application layer). The `VoiceInputPlugin` is generic—it could control videos, music players, or smart home devices.

---

### 🎬 The Result

A voice-controlled video player where:
- 🎤 **"Play"** = Start video
- 🎤 **"Pause"** = Stop video
- 🎤 **"Louder"** = Increase volume
- 🎤 **"Quieter"** = Decrease volume
- 🎯 **Plugin** = Generic voice command detector (knows nothing about videos)
- 🧠 **App** = Video control logic (knows nothing about Web Speech API)

---

### 🧂 Ingredients

```bash
@navigator.menu/core              # The orchestrator
Web Speech API                    # Browser built-in (no install needed!)
```

**Browser Support**: Chrome, Edge, Safari (check [caniuse.com](https://caniuse.com/speech-recognition))

---

### 👨‍🍳 Step 1: Create the Generic VoiceInputPlugin

This plugin's **only responsibility** is detecting voice commands and emitting standardized media intents.

```javascript
// plugins/VoiceInputPlugin.js
import { BasePlugin } from '@navigator.menu/pdk';

export class VoiceInputPlugin extends BasePlugin {
  constructor() {
    super('voice-input');
    this.recognition = null;
  }

  async init(core) {
    this.core = core;
    
    // Check for Web Speech API support
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      console.error('❌ Speech recognition not supported in this browser');
      return Promise.reject('Speech recognition not available');
    }

    // LAYER 1: Setup raw input capture
    this.recognition = new SpeechRecognition();
    this.recognition.continuous = true;
    this.recognition.interimResults = false;
    this.recognition.lang = 'en-US';

    this.recognition.onresult = (event) => {
      const last = event.results.length - 1;
      const command = event.results[last][0].transcript.toLowerCase().trim();
      const confidence = event.results[last][0].confidence;
      
      this.processCommand(command, confidence);
    };

    this.recognition.onerror = (event) => {
      console.error('Voice recognition error:', event.error);
    };

    this.recognition.start();
    console.log('🎤 Voice recognition activated!');
    
    return Promise.resolve();
  }

  processCommand(command, confidence) {
    // LAYER 2: Translate voice to standardized intents (NOT media-specific!)
    
    if (command.includes('play')) {
      this.core.eventBus.emit('intent:media_play', {
        source: 'voice',
        command: command,
        confidence: confidence,
        timestamp: Date.now()
      });
    } 
    else if (command.includes('pause') || command.includes('stop')) {
      this.core.eventBus.emit('intent:media_pause', {
        source: 'voice',
        command: command,
        confidence: confidence,
        timestamp: Date.now()
      });
    } 
    else if (command.includes('louder') || command.includes('volume up')) {
      this.core.eventBus.emit('intent:media_volume', {
        source: 'voice',
        direction: 'up',
        amount: 0.1,
        command: command,
        confidence: confidence,
        timestamp: Date.now()
      });
    } 
    else if (command.includes('quieter') || command.includes('volume down')) {
      this.core.eventBus.emit('intent:media_volume', {
        source: 'voice',
        direction: 'down',
        amount: 0.1,
        command: command,
        confidence: confidence,
        timestamp: Date.now()
      });
    }
    else {
      console.log('🎤 Unrecognized command:', command);
    }
  }

  async destroy() {
    if (this.recognition) {
      this.recognition.stop();
    }
  }
}
```

**🎯 Notice**: This plugin doesn't know what a "video player" is. It detects voice commands and emits `intent:media_*` events. You could use this same plugin to control Spotify, YouTube, or a podcast app.

---

### 👨‍🍳 Step 2: Build the Video Player Application Layer

Now the **business logic**—this is where video-specific code lives.

```javascript
// main.js
import { NavigatorCore } from '@navigator.menu/core';
import { VoiceInputPlugin } from './plugins/VoiceInputPlugin.js';

// ==========================================
// LAYER 3: APPLICATION LOGIC (Video-specific)
// ==========================================

const video = document.getElementById('video-player');
const statusDisplay = document.getElementById('status-display');

function updateStatus(message) {
  statusDisplay.textContent = message;
  setTimeout(() => {
    statusDisplay.textContent = 'Listening for commands...';
  }, 2000);
}

// ==========================================
// INITIALIZE NAVIGATOR
// ==========================================

const core = new NavigatorCore();
core.registerPlugin(new VoiceInputPlugin());

// LAYER 3: Subscribe to intents (not raw voice events!)
core.eventBus.on('intent:media_play', (payload) => {
  if (payload.source === 'voice') {
    video.play();
    updateStatus(`✅ Playing (${Math.round(payload.confidence * 100)}% confident)`);
  }
});

core.eventBus.on('intent:media_pause', (payload) => {
  if (payload.source === 'voice') {
    video.pause();
    updateStatus(`✅ Paused (${Math.round(payload.confidence * 100)}% confident)`);
  }
});

core.eventBus.on('intent:media_volume', (payload) => {
  if (payload.source === 'voice') {
    if (payload.direction === 'up') {
      video.volume = Math.min(video.volume + payload.amount, 1);
      updateStatus(`🔊 Volume: ${Math.round(video.volume * 100)}%`);
    } else {
      video.volume = Math.max(video.volume - payload.amount, 0);
      updateStatus(`🔉 Volume: ${Math.round(video.volume * 100)}%`);
    }
  }
});

// Start the engine
core.start().then(() => {
  console.log('✅ Voice-controlled video player ready!');
  updateStatus('Listening for commands...');
}).catch((error) => {
  updateStatus('❌ Voice recognition not available');
  console.error(error);
});

// Optional: Add keyboard support by just registering another plugin!
// import { KeyboardPlugin } from '@navigator.menu/plugin-keyboard';
// core.registerPlugin(new KeyboardPlugin());
// 
// core.eventBus.on('intent:media_play', (payload) => {
//   if (payload.source === 'keyboard' && payload.key === ' ') {
//     video.paused ? video.play() : video.pause();
//   }
// });
```

---

### 👨‍🍳 Step 3: HTML Structure

```html
<!-- index.html -->
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Navigator Voice Player</title>
  <style>
    body {
      margin: 0;
      padding: 2rem;
      font-family: system-ui, -apple-system, sans-serif;
      background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
    }

    .video-container {
      max-width: 800px;
      width: 100%;
      text-align: center;
    }

    #video-player {
      width: 100%;
      border-radius: 16px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.4);
    }

    .voice-status {
      margin-top: 2rem;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.75rem;
      font-size: 1.2rem;
      padding: 1rem;
      background: rgba(255,255,255,0.1);
      backdrop-filter: blur(10px);
      border-radius: 12px;
      border: 2px solid rgba(255,255,255,0.2);
    }

    .pulse {
      width: 16px;
      height: 16px;
      background: #00d4ff;
      border-radius: 50%;
      animation: pulse 1.5s ease infinite;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.5; transform: scale(1.3); }
    }

    .commands-list {
      margin-top: 2rem;
      text-align: left;
      background: rgba(255,255,255,0.1);
      padding: 1.5rem;
      border-radius: 12px;
      border: 2px solid rgba(255,255,255,0.2);
    }

    .commands-list h3 {
      margin-top: 0;
      color: #00d4ff;
    }

    .commands-list ul {
      list-style: none;
      padding: 0;
      margin: 0;
    }

    .commands-list li {
      padding: 0.5rem 0;
      border-bottom: 1px solid rgba(255,255,255,0.1);
    }

    .commands-list li:last-child {
      border-bottom: none;
    }

    .commands-list li::before {
      content: '🎤';
      margin-right: 0.5rem;
    }
  </style>
</head>
<body>
  <div class="video-container">
    <video id="video-player" controls>
      <source src="https://www.w3schools.com/html/mov_bbb.mp4" type="video/mp4">
      Your browser does not support the video tag.
    </video>
    
    <div class="voice-status">
      <span class="pulse"></span>
      <span id="status-display">Initializing...</span>
    </div>
    
    <div class="commands-list">
      <h3>💡 Try saying:</h3>
      <ul>
        <li><strong>"Play"</strong> - Start the video</li>
        <li><strong>"Pause"</strong> or <strong>"Stop"</strong> - Pause the video</li>
        <li><strong>"Louder"</strong> or <strong>"Volume up"</strong> - Increase volume</li>
        <li><strong>"Quieter"</strong> or <strong>"Volume down"</strong> - Decrease volume</li>
      </ul>
    </div>
  </div>
  
  <script type="module" src="./main.js"></script>
</body>
</html>
```

---

### 🍽️ What You Just Built

Congratulations! You've built a voice-controlled video player following **The Navigator Way**:

1. ✅ **VoiceInputPlugin** (Input Layer): Detects voice, emits `intent:media_*`
2. ✅ **NavigatorCore** (Orchestration Layer): Routes events via Event Bus
3. ✅ **Video Control** (Application Layer): Listens to intents, controls video element

**The Power Move**: Want to add keyboard shortcuts?

```javascript
// Just add this - video control code stays unchanged!
import { KeyboardPlugin } from '@navigator.menu/plugin-keyboard';
core.registerPlugin(new KeyboardPlugin());

core.eventBus.on('intent:media_play', (payload) => {
  video.paused ? video.play() : video.pause();  // Works for BOTH voice and keyboard!
});
```

**Zero refactoring needed**. Voice and keyboard control the same video through the same intents.

---

### 💡 Key Takeaways

- 🔌 **Plugin is generic**: `VoiceInputPlugin` knows nothing about video players
- 🧠 **App owns logic**: Video control lives in application layer
- 🎯 **Intent-based**: App listens to `intent:media_play`, not raw speech events
- 🔄 **Multi-modal ready**: Add keyboard/gesture without touching video code
- 📊 **Confidence scores**: Plugin passes recognition confidence to app layer

---

## Recipe #4: Navigator + Three.js (3D Rotating Cube)

**Goal**: Control a 3D rotating cube with keyboard and gestures—demonstrates Navigator's power in 3D interactive applications.

> **Architectural Focus**: This recipe shows how to separate **input detection** (keyboard/touch) from **3D rendering logic**. Plugins emit rotation intents, application layer owns the rotation speed state.

---

### 🎬 The Result

An interactive 3D cube where:
- ⌨️ **Arrow keys** = Adjust rotation speed
- 👆 **Touch swipe** = Control Y-axis rotation
- 🔄 **Space** = Reset to default rotation
- 🎯 **Plugins** = Generic input detectors (reusable for any 3D scene)
- 🧠 **App** = Three.js scene + rotation logic

---

### 🧂 Ingredients

```bash
@navigator.menu/core              # The orchestrator
@navigator.menu/plugin-keyboard   # Keyboard input
three                             # 3D rendering library
```

---

### 👨‍🍳 Step 1: Install Dependencies

```bash
npm install @navigator.menu/core @navigator.menu/plugin-keyboard three
```

---

### 👨‍🍳 Step 2: Build the Application Layer

The **business logic**—Three.js scene setup and rotation control.

```javascript
// main.js
import * as THREE from 'three';
import { NavigatorCore } from '@navigator.menu/core';
import { KeyboardPlugin } from '@navigator.menu/plugin-keyboard';

// ==========================================
// LAYER 3: APPLICATION LOGIC (Three.js-specific)
// ==========================================

let cube;
let rotationSpeed = { x: 0.01, y: 0.01 };
const SPEED_INCREMENT = 0.01;

// Setup Three.js scene
function initThreeJS() {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  // Create colorful cube
  const geometry = new THREE.BoxGeometry(2, 2, 2);
  const material = new THREE.MeshNormalMaterial();
  cube = new THREE.Mesh(geometry, material);
  scene.add(cube);

  camera.position.z = 5;

  // Handle window resize
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  return { scene, camera, renderer };
}

// Application-level rotation control
function adjustRotation(axis, direction) {
  const delta = direction === 'increase' ? SPEED_INCREMENT : -SPEED_INCREMENT;
  
  if (axis === 'x') {
    rotationSpeed.x += delta;
  } else if (axis === 'y') {
    rotationSpeed.y += delta;
  }
  
  console.log(`🎮 Rotation speed: X=${rotationSpeed.x.toFixed(3)}, Y=${rotationSpeed.y.toFixed(3)}`);
}

function resetRotation() {
  rotationSpeed.x = 0.01;
  rotationSpeed.y = 0.01;
  console.log('🔄 Rotation reset to default');
}

// ==========================================
// INITIALIZE NAVIGATOR
// ==========================================

const core = new NavigatorCore();
core.registerPlugin(new KeyboardPlugin());

// LAYER 3: Subscribe to intents (not raw keyboard events!)
core.eventBus.on('intent:navigate', (payload) => {
  if (payload.source === 'keyboard') {
    switch (payload.direction) {
      case 'up':
        adjustRotation('x', 'increase');
        break;
      case 'down':
        adjustRotation('x', 'decrease');
        break;
      case 'left':
        adjustRotation('y', 'decrease');
        break;
      case 'right':
        adjustRotation('y', 'increase');
        break;
    }
  }
});

core.eventBus.on('intent:select', (payload) => {
  if (payload.source === 'keyboard' && payload.key === ' ') {
    resetRotation();
  }
});

// Start Navigator and Three.js
core.start().then(() => {
  console.log('✅ Navigator initialized!');
  
  const { scene, camera, renderer } = initThreeJS();
  
  // Animation loop
  function animate() {
    requestAnimationFrame(animate);
    
    // Apply rotation (controlled by Navigator intents)
    cube.rotation.x += rotationSpeed.x;
    cube.rotation.y += rotationSpeed.y;
    
    renderer.render(scene, camera);
  }
  
  animate();
  console.log('🎨 Three.js scene ready! Use arrow keys to control rotation.');
});

// Optional: Add touch support by registering TouchGesturePlugin!
// import { TouchGesturePlugin } from './plugins/TouchGesturePlugin.js';
// core.registerPlugin(new TouchGesturePlugin());
// 
// core.eventBus.on('intent:navigate', (payload) => {
//   if (payload.source === 'touch_swipe') {
//     adjustRotation('y', payload.direction === 'left' ? 'increase' : 'decrease');
//   }
// });
```

---

### 👨‍🍳 Step 3: HTML Structure

```html
<!-- index.html -->
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Navigator + Three.js</title>
  <style>
    body {
      margin: 0;
      overflow: hidden;
      font-family: system-ui, -apple-system, sans-serif;
      background: #000;
    }

    .controls-hint {
      position: fixed;
      top: 20px;
      left: 20px;
      color: white;
      background: rgba(0, 0, 0, 0.7);
      backdrop-filter: blur(10px);
      padding: 1.5rem;
      border-radius: 12px;
      border: 2px solid rgba(255, 255, 255, 0.2);
      z-index: 100;
    }

    .controls-hint h3 {
      margin: 0 0 1rem 0;
      color: #00d4ff;
      font-size: 1.2rem;
    }

    .controls-hint ul {
      list-style: none;
      padding: 0;
      margin: 0;
    }

    .controls-hint li {
      padding: 0.5rem 0;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .key {
      background: rgba(255, 255, 255, 0.1);
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      font-family: monospace;
      border: 1px solid rgba(255, 255, 255, 0.3);
      min-width: 60px;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="controls-hint">
    <h3>🎮 Controls</h3>
    <ul>
      <li><span class="key">↑ ↓</span> Rotate X-axis</li>
      <li><span class="key">← →</span> Rotate Y-axis</li>
      <li><span class="key">Space</span> Reset rotation</li>
    </ul>
  </div>
  
  <script type="module" src="./main.js"></script>
</body>
</html>
```

---

### 🍽️ What You Just Built

Congratulations! You've built an interactive 3D scene following **The Navigator Way**:

1. ✅ **KeyboardPlugin** (Input Layer): Detects keypresses, emits `intent:navigate`
2. ✅ **NavigatorCore** (Orchestration Layer): Routes events via Event Bus
3. ✅ **Three.js Scene** (Application Layer): Listens to intents, updates rotation

**The Power Move**: Want to add touch/gesture control?

```javascript
// Just add this - Three.js code stays unchanged!
import { TouchGesturePlugin } from './plugins/TouchGesturePlugin.js';
core.registerPlugin(new TouchGesturePlugin());

core.eventBus.on('intent:navigate', (payload) => {
  if (payload.source === 'touch_swipe') {
    adjustRotation('y', payload.direction === 'left' ? 'increase' : 'decrease');
  }
});
```

**Zero changes to Three.js code**. Touch and keyboard both control rotation through the same intents.

---

### 💡 Key Takeaways

- 🔌 **Plugins are generic**: KeyboardPlugin knows nothing about 3D or Three.js
- 🧠 **App owns state**: `rotationSpeed` lives in application layer, not plugin
- 🎯 **Intent-based**: Scene reacts to `intent:navigate`, not `keydown` events
- 🔄 **Multi-modal ready**: Add touch/voice/gamepad with minimal code
- 🎨 **Framework agnostic**: Same pattern works with Babylon.js, PlayCanvas, etc.

---

---

## Recipe #5: Navigator + Next.js (SSR-Compatible Integration)

**Goal**: Use Navigator in a Next.js app with proper SSR/client-side handling—demonstrates framework integration best practices.

> **Architectural Focus**: This recipe shows how to integrate Navigator into **server-rendered React applications** while maintaining clean architecture. The plugin initializes client-side only, emits intents, and the React component owns state.

---

### 🎬 The Result

A Next.js application where:
- ⚡ **SSR-safe**: Navigator initializes only on client side
- 🎯 **React Hooks**: useNavigator custom hook for clean integration
- 🔄 **Intent-based state**: Component reacts to Navigator intents
- 📦 **Dynamic imports**: Proper code splitting with `next/dynamic`
- 🧠 **App owns logic**: React state driven by Navigator events

---

### 🧂 Ingredients

```bash
@navigator.menu/core              # The orchestrator
@navigator.menu/plugin-keyboard   # Example input plugin
next                              # React framework
react                             # UI library
```

---

### 👨‍🍳 Step 1: Create Next.js App

```bash
npx create-next-app@latest navigator-nextjs --typescript
cd navigator-nextjs
npm install @navigator.menu/core @navigator.menu/plugin-keyboard
```

---

### 👨‍🍳 Step 2: Custom Hook (Client-Side Navigator)

Create a reusable hook that handles Navigator lifecycle:

```typescript
// hooks/useNavigator.ts
'use client';

import { useEffect, useRef, useState } from 'react';
import { NavigatorCore } from '@navigator.menu/core';
import { KeyboardPlugin } from '@navigator.menu/plugin-keyboard';

export function useNavigator() {
  const coreRef = useRef<NavigatorCore | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // ==========================================
    // LAYER 2: Initialize NavigatorCore (client-side only)
    // ==========================================
    const core = new NavigatorCore();
    
    // LAYER 1: Register input plugins
    core.registerPlugin(new KeyboardPlugin());

    // LAYER 3: Subscribe to intents (app logic)
    core.eventBus.on('intent:navigate', (payload) => {
      if (payload.source === 'keyboard') {
        setCurrentIndex((prev) => {
          if (payload.direction === 'right') return (prev + 1) % 5;
          if (payload.direction === 'left') return (prev - 1 + 5) % 5;
          return prev;
        });
      }
    });

    core.start().then(() => {
      coreRef.current = core;
      setIsReady(true);
      console.log('✅ Navigator initialized in Next.js!');
    });

    // Cleanup on unmount
    return () => {
      core.destroy();
    };
  }, []);

  return { core: coreRef.current, currentIndex, isReady };
}
```

---

### 👨‍🍳 Step 3: Client Component (UI Layer)

```typescript
// components/NavigatorCarousel.tsx
'use client';

import { useNavigator } from '@/hooks/useNavigator';

const ITEMS = [
  { id: 1, title: 'Slide 1', color: 'bg-blue-500' },
  { id: 2, title: 'Slide 2', color: 'bg-purple-500' },
  { id: 3, title: 'Slide 3', color: 'bg-pink-500' },
  { id: 4, title: 'Slide 4', color: 'bg-orange-500' },
  { id: 5, title: 'Slide 5', color: 'bg-green-500' },
];

export default function NavigatorCarousel() {
  // ==========================================
  // LAYER 3: Application state driven by Navigator intents
  // ==========================================
  const { currentIndex, isReady } = useNavigator();

  if (!isReady) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl text-gray-500">Initializing Navigator...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-gray-50">
      <div className="max-w-2xl w-full">
        <h1 className="text-4xl font-bold text-center mb-8 text-gray-800">
          Navigator + Next.js
        </h1>

        {/* Carousel Display */}
        <div className="relative h-64 rounded-2xl overflow-hidden shadow-2xl">
          {ITEMS.map((item, idx) => (
            <div
              key={item.id}
              className={`absolute inset-0 flex items-center justify-center transition-all duration-500 ${item.color} ${
                idx === currentIndex
                  ? 'opacity-100 scale-100'
                  : 'opacity-0 scale-95 pointer-events-none'
              }`}
            >
              <h2 className="text-5xl font-bold text-white">{item.title}</h2>
            </div>
          ))}
        </div>

        {/* Controls Hint */}
        <div className="mt-8 p-6 bg-white rounded-xl shadow-lg border-2 border-gray-200">
          <h3 className="text-lg font-semibold mb-3 text-gray-700">
            🎮 Controls
          </h3>
          <ul className="space-y-2 text-gray-600">
            <li className="flex items-center gap-2">
              <kbd className="px-3 py-1 bg-gray-100 rounded border border-gray-300 font-mono text-sm">
                ←
              </kbd>
              <span>Previous slide</span>
            </li>
            <li className="flex items-center gap-2">
              <kbd className="px-3 py-1 bg-gray-100 rounded border border-gray-300 font-mono text-sm">
                →
              </kbd>
              <span>Next slide</span>
            </li>
          </ul>
        </div>

        {/* Current Index Display */}
        <div className="mt-4 text-center text-gray-500">
          Slide {currentIndex + 1} of {ITEMS.length}
        </div>
      </div>
    </div>
  );
}
```

---

### 👨‍🍳 Step 4: Page with Dynamic Import

```typescript
// app/page.tsx
import dynamic from 'next/dynamic';

// ==========================================
// SSR-safe: Disable server-side rendering for Navigator
// ==========================================
const NavigatorCarousel = dynamic(
  () => import('@/components/NavigatorCarousel'),
  { ssr: false }
);

export default function Home() {
  return (
    <main>
      <NavigatorCarousel />
    </main>
  );
}
```

---

### 🍽️ What You Just Built

Congratulations! You've integrated Navigator into Next.js following **The Navigator Way**:

1. ✅ **useNavigator Hook** (Orchestration): Manages NavigatorCore lifecycle
2. ✅ **KeyboardPlugin** (Input Layer): Detects arrow keys, emits `intent:navigate`
3. ✅ **React Component** (Application Layer): Listens to intents, updates `currentIndex` state
4. ✅ **SSR-Safe**: Dynamic import + client-side initialization

**The Power Move**: Want to add touch swipe support?

```typescript
// In useNavigator.ts, add:
import { TouchGesturePlugin } from '@navigator.menu/plugin-touch-gesture';

// Register plugin
core.registerPlugin(new TouchGesturePlugin());

// Existing listener already handles it!
core.eventBus.on('intent:navigate', (payload) => {
  if (payload.source === 'keyboard' || payload.source === 'touch_swipe') {
    setCurrentIndex((prev) => {
      if (payload.direction === 'right') return (prev + 1) % 5;
      if (payload.direction === 'left') return (prev - 1 + 5) % 5;
      return prev;
    });
  }
});
```

**Zero changes to React component**. Touch and keyboard both drive the same state.

---

### 💡 Key Takeaways

- 🔌 **SSR-safe pattern**: `'use client'` + dynamic imports + `useEffect` initialization
- 🎯 **Intent-driven React**: State updates via Navigator events, not raw DOM events
- 🧠 **Hook encapsulation**: `useNavigator` manages complexity, components stay simple
- 🔄 **Multi-modal ready**: Add input plugins without changing component code
- ⚡ **Next.js optimized**: Proper code splitting and client-side hydration

---

---

## Recipe #6: Shake to Undo Plugin (DeviceMotion API)

**Goal**: Build a reusable plugin that detects device shake gestures and triggers undo actions—demonstrates sensor-based input handling.

> **Architectural Focus**: This recipe shows how to create a **sensor-based input plugin** that emits standardized intents. The plugin detects accelerometer data, the app decides what "undo" means in its context.

---

### 🎬 The Result

A mobile-ready plugin where:
- 📱 **Shake detection**: Uses DeviceMotion API to detect device shaking
- 🎯 **Intent emission**: Emits `intent:undo` when shake threshold exceeded
- ⚙️ **Configurable**: Customizable threshold and cooldown period
- 🔌 **Generic**: Plugin knows nothing about what "undo" does
- 🧠 **App decides**: Application layer implements undo logic

---

### 🧂 Ingredients

```bash
@navigator.menu/core              # The orchestrator
@navigator.menu/pdk               # BasePlugin class
```

---

### 👨‍🍳 Step 1: Create the Plugin

The **input layer**—detects shake motion, emits intent.

```typescript
// plugins/ShakeDetectionPlugin.ts
import { BasePlugin } from '@navigator.menu/pdk';

// ==========================================
// LAYER 1: INPUT PLUGIN (Generic Shake Detector)
// ==========================================

export class ShakeDetectionPlugin extends BasePlugin {
  private lastShake = 0;
  private shakeThreshold: number;
  private shakeCooldown: number;
  private boundHandler: ((e: DeviceMotionEvent) => void) | null = null;

  constructor(config = { threshold: 15, cooldown: 1000 }) {
    super('shake-detection');
    this.shakeThreshold = config.threshold;  // Acceleration threshold
    this.shakeCooldown = config.cooldown;    // Min ms between shakes
  }

  async init() {
    // Check if DeviceMotion API is available
    if (!window.DeviceMotionEvent) {
      console.warn('⚠️  DeviceMotion API not supported on this device');
      return;
    }

    // Request permission on iOS 13+
    if (typeof (DeviceMotionEvent as any).requestPermission === 'function') {
      try {
        const permission = await (DeviceMotionEvent as any).requestPermission();
        if (permission !== 'granted') {
          console.warn('⚠️  DeviceMotion permission denied');
          return;
        }
      } catch (error) {
        console.error('❌ Error requesting DeviceMotion permission:', error);
        return;
      }
    }

    // Bind event handler
    this.boundHandler = this.handleMotion.bind(this);
    window.addEventListener('devicemotion', this.boundHandler);
    
    console.log('✅ Shake detection active! (threshold:', this.shakeThreshold, ')');
  }

  handleMotion(event: DeviceMotionEvent) {
    const { x, y, z } = event.accelerationIncludingGravity || {};
    
    if (!x || !y || !z) return;

    // Calculate total acceleration
    const acceleration = Math.sqrt(x * x + y * y + z * z);
    const now = Date.now();

    // Check if threshold exceeded and cooldown period passed
    if (acceleration > this.shakeThreshold && 
        now - this.lastShake > this.shakeCooldown) {
      
      this.lastShake = now;
      this.emitShakeIntent(acceleration);
    }
  }

  emitShakeIntent(acceleration: number) {
    // ==========================================
    // EMIT INTENT: Plugin doesn't know what "undo" means!
    // ==========================================
    this.core.eventBus.emit('intent:undo', {
      source: 'shake',
      strength: acceleration,
      timestamp: Date.now()
    });

    console.log('🎯 Shake detected! Acceleration:', acceleration.toFixed(2));
  }

  async destroy() {
    if (this.boundHandler) {
      window.removeEventListener('devicemotion', this.boundHandler);
      this.boundHandler = null;
    }
  }
}
```

---

### 👨‍🍳 Step 2: Application Layer (Undo Logic)

The **business logic**—implements what "undo" means in this app.

```javascript
// main.js
import { NavigatorCore } from '@navigator.menu/core';
import { ShakeDetectionPlugin } from './plugins/ShakeDetectionPlugin.js';

// ==========================================
// LAYER 3: APPLICATION LOGIC (Drawing App Example)
// ==========================================

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Drawing state
let isDrawing = false;
let history = [];
let currentPath = [];

// Drawing handlers
canvas.addEventListener('mousedown', (e) => {
  isDrawing = true;
  currentPath = [{ x: e.clientX, y: e.clientY }];
});

canvas.addEventListener('mousemove', (e) => {
  if (!isDrawing) return;
  
  const point = { x: e.clientX, y: e.clientY };
  currentPath.push(point);
  
  // Draw line
  ctx.beginPath();
  ctx.moveTo(currentPath[currentPath.length - 2].x, currentPath[currentPath.length - 2].y);
  ctx.lineTo(point.x, point.y);
  ctx.strokeStyle = '#00d4ff';
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.stroke();
});

canvas.addEventListener('mouseup', () => {
  if (currentPath.length > 0) {
    history.push([...currentPath]);
    console.log('📝 Stroke saved. History size:', history.length);
  }
  isDrawing = false;
  currentPath = [];
});

// Application-level undo function
function undoLastStroke() {
  if (history.length === 0) {
    console.log('❌ Nothing to undo');
    return;
  }

  // Remove last stroke
  history.pop();
  
  // Redraw entire canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  history.forEach(path => {
    ctx.beginPath();
    ctx.moveTo(path[0].x, path[0].y);
    for (let i = 1; i < path.length; i++) {
      ctx.lineTo(path[i].x, path[i].y);
    }
    ctx.strokeStyle = '#00d4ff';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.stroke();
  });

  console.log('↩️  Undo! History size:', history.length);
}

// ==========================================
// INITIALIZE NAVIGATOR
// ==========================================

const core = new NavigatorCore();

// LAYER 1: Register shake detection plugin
core.registerPlugin(new ShakeDetectionPlugin({
  threshold: 20,  // Higher = less sensitive
  cooldown: 1000  // 1 second between shakes
}));

// LAYER 3: Subscribe to undo intent
core.eventBus.on('intent:undo', (payload) => {
  if (payload.source === 'shake') {
    undoLastStroke();
    
    // Visual feedback
    canvas.classList.add('shake-feedback');
    setTimeout(() => canvas.classList.remove('shake-feedback'), 300);
  }
});

core.start().then(() => {
  console.log('✅ Shake-to-undo ready! Draw and shake to undo.');
});

// Optional: Add keyboard undo support!
// import { KeyboardPlugin } from '@navigator.menu/plugin-keyboard';
// core.registerPlugin(new KeyboardPlugin());
// 
// core.eventBus.on('intent:undo', (payload) => {
//   if (payload.source === 'keyboard' && payload.key === 'z' && payload.ctrlKey) {
//     undoLastStroke();
//   }
// });
```

---

### 👨‍🍳 Step 3: HTML + Styling

```html
<!-- index.html -->
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Shake to Undo Drawing</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      overflow: hidden;
      font-family: system-ui, -apple-system, sans-serif;
      background: #1a1a1a;
    }

    #canvas {
      display: block;
      background: #2a2a2a;
      cursor: crosshair;
      transition: transform 0.3s ease;
    }

    #canvas.shake-feedback {
      transform: scale(0.98);
      filter: brightness(1.2);
    }

    .instructions {
      position: fixed;
      top: 20px;
      left: 20px;
      background: rgba(0, 0, 0, 0.8);
      backdrop-filter: blur(10px);
      color: white;
      padding: 1.5rem;
      border-radius: 12px;
      border: 2px solid rgba(0, 212, 255, 0.3);
      max-width: 300px;
      z-index: 100;
    }

    .instructions h2 {
      margin: 0 0 1rem 0;
      color: #00d4ff;
      font-size: 1.2rem;
    }

    .instructions ul {
      list-style: none;
      padding: 0;
    }

    .instructions li {
      padding: 0.5rem 0;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .icon {
      font-size: 1.5rem;
    }
  </style>
</head>
<body>
  <div class="instructions">
    <h2>🎨 Drawing App</h2>
    <ul>
      <li><span class="icon">🖱️</span> Draw with mouse/touch</li>
      <li><span class="icon">📱</span> Shake device to undo</li>
      <li><span class="icon">↩️</span> Last stroke removed</li>
    </ul>
  </div>

  <canvas id="canvas"></canvas>
  
  <script type="module" src="./main.js"></script>
</body>
</html>
```

---

### 🍽️ What You Just Built

Congratulations! You've built a sensor-based input system following **The Navigator Way**:

1. ✅ **ShakeDetectionPlugin** (Input Layer): Detects motion, emits `intent:undo`
2. ✅ **NavigatorCore** (Orchestration Layer): Routes shake events via Event Bus
3. ✅ **Drawing App** (Application Layer): Implements `undoLastStroke()` business logic

**The Power Move**: Want to add keyboard undo (Ctrl+Z)?

```javascript
// Just register KeyboardPlugin - no changes to shake plugin!
import { KeyboardPlugin } from '@navigator.menu/plugin-keyboard';
core.registerPlugin(new KeyboardPlugin());

core.eventBus.on('intent:undo', (payload) => {
  // Works for BOTH shake and keyboard!
  if (payload.source === 'shake' || 
      (payload.source === 'keyboard' && payload.ctrlKey && payload.key === 'z')) {
    undoLastStroke();
  }
});
```

**Zero changes to existing code**. Shake and Ctrl+Z both trigger the same undo function.

---

### 🧪 Testing the Plugin

```typescript
// tests/ShakeDetectionPlugin.spec.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { NavigatorCore } from '@navigator.menu/core';
import { ShakeDetectionPlugin } from './ShakeDetectionPlugin';

describe('ShakeDetectionPlugin', () => {
  let core: NavigatorCore;
  let plugin: ShakeDetectionPlugin;

  beforeEach(async () => {
    core = new NavigatorCore();
    plugin = new ShakeDetectionPlugin({ threshold: 15, cooldown: 1000 });
    core.registerPlugin(plugin);
    await core.start();
  });

  it('should register successfully', () => {
    expect(core.getPlugin('shake-detection')).toBe(plugin);
  });

  it('should emit intent:undo when shake detected', (done) => {
    core.eventBus.on('intent:undo', (payload) => {
      expect(payload.source).toBe('shake');
      expect(payload.strength).toBeGreaterThan(0);
      done();
    });

    // Simulate strong shake
    const mockEvent = {
      accelerationIncludingGravity: { x: 20, y: 20, z: 20 }
    } as DeviceMotionEvent;

    plugin.handleMotion(mockEvent);
  });

  it('should respect cooldown period', () => {
    const plugin = new ShakeDetectionPlugin({ threshold: 10, cooldown: 5000 });
    
    let emitCount = 0;
    core.eventBus.on('intent:undo', () => emitCount++);

    // First shake
    plugin.handleMotion({
      accelerationIncludingGravity: { x: 15, y: 15, z: 15 }
    } as DeviceMotionEvent);

    // Immediate second shake (should be ignored)
    plugin.handleMotion({
      accelerationIncludingGravity: { x: 15, y: 15, z: 15 }
    } as DeviceMotionEvent);

    expect(emitCount).toBe(1);  // Only first shake counted
  });
});
```

---

### 💡 Key Takeaways

- 🔌 **Generic plugin**: ShakeDetectionPlugin knows nothing about drawing or undo logic
- 🎯 **Intent-based**: Plugin emits `intent:undo`, app defines what undo means
- ⚙️ **Configurable**: Threshold and cooldown are constructor parameters
- 🧪 **Testable**: Plugin can be tested in isolation without DOM/canvas
- 🔄 **Multi-modal ready**: Add keyboard/voice undo without changing shake plugin
- 📱 **iOS-compatible**: Handles iOS 13+ permission requirements

---

## More Recipes Coming Soon

- **Drag & Drop with Navigator**
- **Multi-touch Zoom Control**
- **Navigator + D3.js Data Visualization**
- **Audio Visualizer with Gestures**
- **VR/AR Integration with WebXR**

---

**Want to contribute a recipe?** Open a PR at [github.com/fabriziosalmi/navigator](https://github.com/fabriziosalmi/navigator)!

**License**: MIT
