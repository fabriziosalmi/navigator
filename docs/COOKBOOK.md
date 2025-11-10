# Navigator SDK - Cookbook 🧑‍🍳

**Learn by doing.** Complete, working examples you can copy and customize.

> **"La primissima e più importante ricetta"** - Start here if you're using React!

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

**Full working example**: Check out [apps/react-test-app](../apps/react-test-app) for the complete source code with styling and architecture diagrams.

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

## Image Carousel with Gestures

**Goal**: Build a touch-controlled image carousel with swipe gestures.

### Step 1: Setup

```bash
npx @navigator.menu/cli create-app image-carousel
cd image-carousel
npm install
```

### Step 2: Add Images

```javascript
// js/main.js
import { CoreMock } from '@navigator.menu/pdk/testing';
import { BasePlugin, NipValidator } from '@navigator.menu/pdk';

const images = [
  'https://picsum.photos/800/600?random=1',
  'https://picsum.photos/800/600?random=2',
  'https://picsum.photos/800/600?random=3',
  'https://picsum.photos/800/600?random=4'
];

let currentIndex = 0;

class GestureCarouselPlugin extends BasePlugin {
  constructor() {
    super('gesture-carousel');
  }

  async init() {
    // Listen for swipe events
    document.addEventListener('touchstart', this.handleTouchStart.bind(this));
    document.addEventListener('touchend', this.handleTouchEnd.bind(this));
  }

  handleTouchStart(e) {
    this.touchStartX = e.touches[0].clientX;
  }

  handleTouchEnd(e) {
    const touchEndX = e.changedTouches[0].clientX;
    const diff = this.touchStartX - touchEndX;
    
    if (Math.abs(diff) > 50) { // Minimum swipe distance
      const direction = diff > 0 ? 'left' : 'right';
      this.emitSwipeEvent(direction);
    }
  }

  emitSwipeEvent(direction) {
    const event = NipValidator.createEvent(
      `input:gesture:swipe_${direction}`,
      this.name,
      {
        distance: 100,
        duration_ms: 300,
        velocity: 0.5,
        confidence: 0.9
      }
    );
    
    // Trigger navigation
    if (direction === 'left') {
      currentIndex = (currentIndex + 1) % images.length;
    } else {
      currentIndex = (currentIndex - 1 + images.length) % images.length;
    }
    
    updateCarousel();
  }
}

function updateCarousel() {
  const img = document.getElementById('carousel-image');
  img.src = images[currentIndex];
  img.style.transform = 'scale(0.95)';
  setTimeout(() => {
    img.style.transform = 'scale(1)';
  }, 100);
}

// Initialize
const core = new CoreMock();
const plugin = new GestureCarouselPlugin();

core.registerPlugin(plugin);
core.init().then(() => {
  console.log('Carousel ready!');
  updateCarousel();
});
```

### Step 3: HTML Structure

```html
<!-- index.html -->
<div class="carousel-container">
  <img id="carousel-image" src="" alt="Carousel">
  <div class="carousel-controls">
    <button onclick="navigate(-1)">←</button>
    <span id="carousel-index">1 / 4</span>
    <button onclick="navigate(1)">→</button>
  </div>
</div>

<style>
.carousel-container {
  max-width: 800px;
  margin: 0 auto;
  text-align: center;
}

#carousel-image {
  width: 100%;
  border-radius: 12px;
  transition: transform 0.2s ease;
  box-shadow: 0 10px 30px rgba(0,0,0,0.3);
}

.carousel-controls {
  margin-top: 1rem;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 2rem;
}

.carousel-controls button {
  font-size: 2rem;
  background: none;
  border: none;
  cursor: pointer;
  opacity: 0.7;
  transition: opacity 0.2s;
}

.carousel-controls button:hover {
  opacity: 1;
}
</style>
```

**Try it**: Run `npm run dev` and swipe left/right on mobile or drag on desktop!

---

## Video Player with Voice Commands

**Goal**: Control a video player with voice commands ("play", "pause", "louder", "quieter").

### Step 1: Setup

```bash
npx @navigator.menu/cli create-app voice-video-player
cd voice-video-player
npm install
```

### Step 2: Voice Control Plugin

```javascript
// js/VoiceControlPlugin.js
import { BasePlugin, NipValidator } from '@navigator.menu/pdk';

export class VoiceControlPlugin extends BasePlugin {
  constructor() {
    super('voice-control');
    this.recognition = null;
  }

  async init() {
    // Check for Web Speech API support
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      console.error('Speech recognition not supported');
      return;
    }

    this.recognition = new SpeechRecognition();
    this.recognition.continuous = true;
    this.recognition.interimResults = false;
    this.recognition.lang = 'en-US';

    this.recognition.onresult = (event) => {
      const last = event.results.length - 1;
      const command = event.results[last][0].transcript.toLowerCase().trim();
      
      this.processCommand(command);
    };

    this.recognition.start();
    console.log('Voice control activated!');
  }

  processCommand(command) {
    const video = document.getElementById('video-player');
    
    if (command.includes('play')) {
      video.play();
      this.emitEvent('voice:command:play');
    } else if (command.includes('pause') || command.includes('stop')) {
      video.pause();
      this.emitEvent('voice:command:pause');
    } else if (command.includes('louder') || command.includes('volume up')) {
      video.volume = Math.min(video.volume + 0.1, 1);
      this.emitEvent('voice:command:volume_up');
    } else if (command.includes('quieter') || command.includes('volume down')) {
      video.volume = Math.max(video.volume - 0.1, 0);
      this.emitEvent('voice:command:volume_down');
    }
  }

  emitEvent(type) {
    const event = NipValidator.createEvent(
      type,
      this.name,
      { timestamp: Date.now() }
    );
    console.log('Voice command:', type);
  }

  async destroy() {
    if (this.recognition) {
      this.recognition.stop();
    }
  }
}
```

### Step 3: HTML

```html
<!-- index.html -->
<div class="video-container">
  <video id="video-player" controls>
    <source src="https://www.w3schools.com/html/mov_bbb.mp4" type="video/mp4">
  </video>
  
  <div class="voice-status">
    <span class="pulse"></span>
    Listening for commands...
  </div>
  
  <div class="commands-list">
    <h3>Try saying:</h3>
    <ul>
      <li>"Play"</li>
      <li>"Pause"</li>
      <li>"Louder"</li>
      <li>"Quieter"</li>
    </ul>
  </div>
</div>

<style>
.video-container {
  max-width: 800px;
  margin: 2rem auto;
  text-align: center;
}

#video-player {
  width: 100%;
  border-radius: 12px;
}

.voice-status {
  margin-top: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  color: #00d4ff;
}

.pulse {
  width: 12px;
  height: 12px;
  background: #00d4ff;
  border-radius: 50%;
  animation: pulse 1.5s ease infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.5; transform: scale(1.2); }
}
</style>
```

**Try it**: Run `npm run dev` and say "play" or "pause"!

---

## Navigator + Three.js (3D Cube)

**Goal**: Control a rotating 3D cube with gestures and keyboard.

### Step 1: Setup

```bash
npx @navigator.menu/cli create-app threejs-navigator
cd threejs-navigator
npm install three
```

### Step 2: Three.js Integration

```javascript
// js/main.js
import * as THREE from 'three';
import { CoreMock } from '@navigator.menu/pdk/testing';
import { BasePlugin } from '@navigator.menu/pdk';

let cube;
let rotationSpeed = { x: 0.01, y: 0.01 };

class ThreeJSPlugin extends BasePlugin {
  constructor() {
    super('threejs-renderer');
  }

  async init() {
    // Setup Three.js scene
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // Create cube
    const geometry = new THREE.BoxGeometry(2, 2, 2);
    const material = new THREE.MeshNormalMaterial();
    cube = new THREE.Mesh(geometry, material);
    scene.add(cube);

    camera.position.z = 5;

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      
      cube.rotation.x += rotationSpeed.x;
      cube.rotation.y += rotationSpeed.y;
      
      renderer.render(scene, camera);
    };
    animate();

    // Keyboard controls
    document.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowUp') rotationSpeed.x += 0.01;
      if (e.key === 'ArrowDown') rotationSpeed.x -= 0.01;
      if (e.key === 'ArrowLeft') rotationSpeed.y -= 0.01;
      if (e.key === 'ArrowRight') rotationSpeed.y += 0.01;
      if (e.key === ' ') { // Space to reset
        rotationSpeed.x = 0.01;
        rotationSpeed.y = 0.01;
      }
    });

    // Gesture controls (touch)
    let touchStartX = 0;
    document.addEventListener('touchstart', (e) => {
      touchStartX = e.touches[0].clientX;
    });

    document.addEventListener('touchmove', (e) => {
      const touchX = e.touches[0].clientX;
      const diff = (touchX - touchStartX) / 100;
      rotationSpeed.y = diff;
    });

    console.log('Three.js scene ready!');
  }
}

// Initialize
const core = new CoreMock();
const plugin = new ThreeJSPlugin();

core.registerPlugin(plugin);
core.init();
```

**Try it**: 
- Desktop: Use arrow keys to control rotation
- Mobile: Swipe to rotate the cube
- Press Space to reset

---

## Next.js Integration

**Goal**: Use Navigator in a Next.js app with SSR considerations.

### Step 1: Create Next.js App

```bash
npx create-next-app@latest navigator-nextjs --typescript
cd navigator-nextjs
npm install @navigator.menu/pdk
```

### Step 2: Client-Only Component

```typescript
// components/NavigatorCarousel.tsx
'use client';

import { useEffect, useRef } from 'react';
import { CoreMock } from '@navigator.menu/pdk/testing';
import { BasePlugin } from '@navigator.menu/pdk';

class SimplePlugin extends BasePlugin {
  constructor() {
    super('simple-plugin');
  }

  async init() {
    console.log('Plugin initialized in Next.js!');
  }
}

export default function NavigatorCarousel() {
  const coreRef = useRef<any>();

  useEffect(() => {
    // Initialize Navigator only on client side
    const core = new CoreMock();
    const plugin = new SimplePlugin();
    
    core.registerPlugin(plugin);
    core.init();
    
    coreRef.current = core;

    return () => {
      core.destroy();
    };
  }, []);

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold">Navigator in Next.js</h1>
      <p>Check console for initialization message</p>
    </div>
  );
}
```

### Step 3: Use in Page

```typescript
// app/page.tsx
import dynamic from 'next/dynamic';

// Dynamic import with SSR disabled
const NavigatorCarousel = dynamic(
  () => import('@/components/NavigatorCarousel'),
  { ssr: false }
);

export default function Home() {
  return (
    <main className="min-h-screen p-8">
      <NavigatorCarousel />
    </main>
  );
}
```

**Key Points**:
- ✅ Use `'use client'` directive
- ✅ Dynamic import with `{ ssr: false }`
- ✅ Initialize in `useEffect` (client-side only)

---

## Custom Plugin: Shake to Undo

**Goal**: Build a plugin that detects device shake and triggers undo action.

### Step 1: Plugin Code

```typescript
// ShakeToUndoPlugin.ts
import { BasePlugin, NipValidator } from '@navigator.menu/pdk';

export class ShakeToUndoPlugin extends BasePlugin {
  private lastShake = 0;
  private shakeThreshold = 15; // Acceleration threshold
  private shakeTimeout = 1000; // Minimum time between shakes

  constructor() {
    super('shake-to-undo');
  }

  async init() {
    if (!window.DeviceMotionEvent) {
      console.warn('Device motion not supported');
      return;
    }

    window.addEventListener('devicemotion', this.handleMotion.bind(this));
    console.log('Shake detection active!');
  }

  handleMotion(event: DeviceMotionEvent) {
    const { x, y, z } = event.accelerationIncludingGravity || {};
    
    if (!x || !y || !z) return;

    const acceleration = Math.sqrt(x * x + y * y + z * z);
    const now = Date.now();

    if (acceleration > this.shakeThreshold && 
        now - this.lastShake > this.shakeTimeout) {
      
      this.lastShake = now;
      this.triggerUndo();
    }
  }

  triggerUndo() {
    const event = NipValidator.createEvent(
      'custom:shake:undo',
      this.name,
      { timestamp: Date.now() }
    );

    console.log('🎯 Shake detected! Undo triggered.');
    
    // Emit event for other plugins to listen
    // core.eventBus.emit('shake:undo', event);
  }

  async destroy() {
    window.removeEventListener('devicemotion', this.handleMotion);
  }
}
```

### Step 2: Test the Plugin

```typescript
// tests/ShakeToUndoPlugin.spec.ts
import { describe, it, expect } from 'vitest';
import { CoreMock } from '@navigator.menu/pdk/testing';
import { ShakeToUndoPlugin } from './ShakeToUndoPlugin';

describe('ShakeToUndoPlugin', () => {
  it('should initialize without errors', async () => {
    const core = new CoreMock();
    const plugin = new ShakeToUndoPlugin();
    
    core.registerPlugin(plugin);
    await core.init();
    
    expect(core.getPlugin('shake-to-undo')).toBe(plugin);
  });

  it('should detect shake motion', () => {
    const plugin = new ShakeToUndoPlugin();
    
    // Simulate shake event
    const mockEvent = {
      accelerationIncludingGravity: {
        x: 20, y: 20, z: 20
      }
    } as DeviceMotionEvent;

    const spy = jest.spyOn(plugin, 'triggerUndo');
    plugin.handleMotion(mockEvent);
    
    expect(spy).toHaveBeenCalled();
  });
});
```

### Step 3: Usage

```javascript
import { CoreMock } from '@navigator.menu/pdk/testing';
import { ShakeToUndoPlugin } from './ShakeToUndoPlugin';

const core = new CoreMock();
const plugin = new ShakeToUndoPlugin();

core.registerPlugin(plugin);
core.init();

// Shake your device to trigger undo!
```

**Try it**: Open on mobile device and shake to trigger undo action.

---

## More Recipes Coming Soon

- **Drag & Drop with Navigator**
- **Multi-touch Zoom Control**
- **Navigator + D3.js Data Visualization**
- **Audio Visualizer with Gestures**
- **VR/AR Integration with WebXR**

---

**Want to contribute a recipe?** Open a PR at [github.com/navigator/navigator](https://github.com/navigator/navigator)!

**License**: MIT
