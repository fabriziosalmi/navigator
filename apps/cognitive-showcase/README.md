# 🧠 Cognitive Showcase - The Ultimate Navigator Demo

> **The mind-blowing interactive demo that showcases Navigator's cognitive intelligence**

This is not just a demo—it's an **experience**. A live, interactive showcase that demonstrates how Navigator's cognitive engine adapts to user behavior in real-time.

---

## ✨ What Makes This Special?

### 🎯 Two-Panel Experience

**LEFT: "THE ACTION"** - An interactive space carousel
- Navigate with ◀️ ▶️ arrow keys
- Beautiful cosmic imagery
- Smooth transitions that adapt to your behavior

**RIGHT: "THE REACTION"** - The Cognitive HUD (Brain Dashboard)
- Real-time state visualization (😐 Neutral, 🎯 Concentrated, 😤 Frustrated, 🧠 Learning)
- Live performance metrics with animated charts
- Action history log
- AI insights explaining what Navigator is thinking

### 🎮 Gamified Onboarding

Forget boring tutorials! This demo **teaches by playing**:

1. **Step 1**: "Use arrow keys to navigate" → Navigate 3 times correctly
2. **Step 2**: "Press random keys to simulate errors" → Make 3 errors
3. **Step 3**: "Watch Navigator detect your frustration and slow down to help" → Experience the AI adaptation
4. **Step 4**: "Keep navigating and see how Navigator learns from you" → 15+ total actions

Each step is visually stunning with animated overlays, progress indicators, and contextual arrows pointing to relevant UI elements.

### 🎨 Visual Effects

- **Particle explosions** on every cognitive state change
- **Real-time animated charts** tracking error rate and speed
- **Pulsing glow effects** synchronized with cognitive states
- **Smooth transitions** with dynamic timing based on user state

---

## 🚀 Run the Demo Locally

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Start the Dev Server

```bash
pnpm dev
```

### 3. Open Your Browser

Navigate to: `http://localhost:5174/`

### 4. Interact and Watch the Magic

- Press **←** **→** repeatedly to trigger CONCENTRATED state (fast UI)
- Press random keys (**X**, **Y**, **Z**) to trigger FRUSTRATED state (slow UI)
- Watch the Cognitive HUD analyze and adapt in real-time

---

## 🎬 Automated Demo Recording

Want a perfect promotional video? We've got you covered!

The `record-demo.spec.ts` script automatically:

1. ✅ Launches the Cognitive Showcase app
2. 🎭 Simulates different user behaviors (concentrated, frustrated, learning)
3. 📹 Records the entire session in Full HD (1920x1080)
4. 💾 Saves a professional promotional video

**No manual recording needed!** Just run the script and get a perfect 30-second demo video every time.

---

## 🚀 Quick Start

### 1. Install Dependencies

```bash
pnpm install
npx playwright install chromium
```

### 2. Record the Demo Video

```bash
pnpm test:record
```

**Important:** Don't touch your mouse or keyboard during recording! Playwright will automatically:
- Open a browser window
- Navigate through the demo
- Simulate all user interactions
- Record everything in high quality

### 3. Find Your Video

After the test completes, find your video in:

```
test-results/record-demo-The-Sentient-Interface-in-Action-30-Second-Demo-chromium/video.webm
```

---

## 🎬 The Recording Script

The script follows this "screenplay":

### **ACT 0: OPENING (0-2.5s)**
- App loads
- Shows initial NEUTRAL state
- Dramatic pause for viewers

### **ACT 1: CONCENTRATION (2.5s-12.5s)**
- Simulates 18 rapid, precise arrow key presses
- Navigator detects CONCENTRATED state
- UI adapts with faster animations (200ms)
- Metrics show: 0% error rate, <400ms avg speed

### **ACT 2: FRUSTRATION (12.5s-22.5s)**
- Simulates 15 random invalid key presses (q, w, e, r, a, s, d...)
- Navigator detects FRUSTRATED state
- UI adapts with slower animations (1200ms) to help user
- Metrics show: >50% error rate, increased avg speed

### **ACT 3: RECOVERY (22.5s-30s)**
- Simulates 10 slower, deliberate arrow key presses
- Navigator helps user recover
- State returns to NEUTRAL or LEARNING
- Metrics stabilize
- Final dramatic pause

---

## 🎨 Post-Production (Optional)

The generated `.webm` file is ready to use, but you can polish it further:

### Recommended Tools:
- **macOS**: iMovie, Final Cut Pro
- **Windows**: DaVinci Resolve (free), Clipchamp
- **Cross-platform**: DaVinci Resolve, Shotcut

### Suggested Edits:
1. **Trim** start/end if needed
2. **Add Music** (synthwave/electronic, royalty-free)
3. **Add Text Overlays** (optional):
   - "Simulating Perfect User..." (during Act 1)
   - "Detecting Frustration..." (during Act 2)
   - "AI Adapting in Real-Time" (during Act 3)
4. **Export** as:
   - `.mp4` (H.264, 1080p) for maximum compatibility
   - `.gif` (optimized) for GitHub/Twitter

---

## ⚙️ Configuration

Edit `playwright.config.ts` to customize:

```typescript
{
  viewport: { width: 1920, height: 1080 }, // Change resolution
  slowMo: 50, // Slow down actions (ms)
  video: {
    mode: 'on', // Always record
    size: { width: 1920, height: 1080 },
  },
}
```

Edit `tests/record-demo.spec.ts` to customize the screenplay:

```typescript
// Change number of repetitions
await actConcentrated(page, 18); // Default: 18

// Change timing
await dramaticPause(page, 2500); // Default: 2500ms

// Add new scenes
await actCustomBehavior(page);
```

---

## 🐛 Troubleshooting

### "Video not created"
- Make sure the app is running on `http://localhost:5174`
- Check that Chromium is installed: `npx playwright install chromium`

### "State didn't change"
- The CognitiveModelPlugin needs multiple actions to detect patterns
- Increase repetitions in the script if needed

### "Recording too fast/slow"
- Adjust `slowMo` in `playwright.config.ts`
- Modify `waitForTimeout` values in the script

---

## 📚 Learn More

- [Playwright Documentation](https://playwright.dev/docs/intro)
- [Navigator Documentation](https://github.com/fabriziosalmi/navigator)
- [Cognitive Showcase Architecture](../README.md)

---

## 🎯 Pro Tips

1. **Run in Dark Mode** for better contrast
2. **Close other windows** to avoid distractions in the recording
3. **Disable notifications** before recording
4. **Use a clean browser profile** (Playwright does this automatically)
5. **Re-run if needed** - the script is 100% reproducible!

---

**Made with ❤️ by the Navigator Team**
