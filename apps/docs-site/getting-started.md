# Getting Started Guide

## Quick Start (5 minutes)

### Prerequisites

- **Modern Browser**: Chrome 90+, Edge 90+, Firefox 88+, or Safari 14+
- **Webcam**: For hand gesture tracking
- **Microphone**: For voice commands (optional)
- **Local Server**: Required for ES6 modules and media permissions

### Installation

1. **Clone or Download**:
```bash
git clone https://github.com/yourusername/navigator.git
cd navigator
```

2. **Start Local Server**:

**Python (recommended)**:
```bash
python3 -m http.server 8080
```

**Node.js**:
```bash
npx http-server -p 8080
```

**PHP**:
```bash
php -S localhost:8080
```

3. **Open in Browser**:
```
http://localhost:8080
```

### First Launch

1. Click **"🚀 Start Experience"** button
2. Grant camera + microphone permissions when prompted
3. Position your hand clearly in webcam view
4. See green hand icon ✅ in quantum HUD (bottom) when detected

**That's it!** You're ready to navigate.

---

## Basic Navigation

### Using Gestures 🖐️

**Swipe Left/Right** (Card Navigation):
1. Hold hand flat, palm facing camera
2. Move hand horizontally (left or right)
3. Move deliberately (~10cm minimum)
4. See light beam flash when detected

**Swipe Up/Down** (Layer Switching):
1. Hold hand flat, palm facing camera
2. Move hand vertically (up or down)
3. Threshold is lower - easier than horizontal
4. Layer name changes in HUD

**Point to Focus** (2-second hold):
1. Extend index finger only
2. Point at screen for 2 seconds
3. Kamehameha effect triggers
4. Returns to normal after explosion

### Using Keyboard ⌨️

**Dual Key Bindings** - choose your preference:

**WASD Style**:
- `W` - Layer up
- `A` - Card left
- `S` - Layer down
- `D` - Card right

**Arrow Keys**:
- `↑` - Layer up
- `←` - Card left
- `↓` - Layer down
- `→` - Card right

**Utility Keys**:
- `M` - Toggle voice commands
- `F` - Fullscreen mode
- `V` - Toggle webcam view

### Using Voice 🎤

1. Press `M` to activate voice recognition
2. Look for green 🎤 icon (top-right corner)
3. Speak commands clearly:

**English**:
- "left" or "right" - Navigate cards
- "up" or "down" - Change layers
- "next" or "back" - Alternative navigation

**Italian**:
- "sinistra" or "destra" - Navigate cards
- "su" or "giù" - Change layers
- "avanti" or "indietro" - Alternative navigation

4. System auto-restarts listening after each command

---

## Understanding the Interface

### Quantum HUD (Bottom Panel)

**5 Sections** from left to right:

1. **Position Info** (far left):
   - Layer name: "Videos", "News", "Apps", "Settings"
   - Card counter: "1/4", "2/4", etc.
   - Color matches current layer category

2. **Navigation Buttons** (left-center):
   - ← → buttons for card navigation
   - ↑ ↓ buttons for layer navigation
   - Clickable with mouse/touch

3. **Adaptive Progress** (center):
   - Level indicator: I, II, or III
   - Progress bar to next level
   - Shows % completion

4. **Status Panel** (right-center):
   - Hand detection icon (green = OK)
   - Gesture legend (✅ active, 🔒 locked)
   - Debug ticker (last navigation event)

5. **Navigation History** (far right):
   - Last 5 actions
   - Color-coded icons:
     - 🔵 Cyan = Card navigation
     - 🟣 Magenta = Layer navigation
     - 🟢 Green = Voice command
     - 🟠 Orange = Keyboard

### Content Layers

**4 Layers** in vertical stack:

1. **Videos** (Cyan):
   - YouTube-style video cards
   - Example content: Tech reviews, tutorials

2. **News** (Magenta):
   - News article cards
   - Example: Tech news, announcements

3. **Apps** (Green):
   - Application cards
   - Example: Productivity tools, utilities

4. **Settings** (Orange):
   - Configuration cards
   - Example: Profile, preferences, system

**Navigation**:
- Swipe/arrow up/down to switch layers
- Swipe/arrow left/right to navigate cards within layer
- Infinite wrapping on all axes (no dead ends)

---

## Adaptive System Progression

### Level 1 (Default - Start Here)

**Available Gestures**:
- ✅ Swipe left/right (card navigation)
- ✅ Swipe up/down (layer switching)
- ✅ Point to focus (2s hold)

**Unlock Requirement**: Start navigating!

### Level 2 (Intermediate - 85% Accuracy)

**New Gestures**:
- ✅ Pinch gesture (thumb + index)
- ✅ Fan cards interaction
- ✅ Enhanced visual feedback

**How to Unlock**:
1. Navigate successfully 15-20 times
2. Maintain >85% accuracy
3. Watch progress bar in HUD
4. System auto-upgrades when ready

### Level 3 (Expert - 90% Accuracy)

**New Gestures**:
- ✅ Fist collapse (close hand)
- ✅ Explosion effects
- ✅ Expert-level interactions

**How to Unlock**:
1. Maintain Level 2 performance
2. Achieve >90% accuracy
3. Consistent gesture quality
4. Auto-upgrade after 5+ successful navigations

### Performance Metrics

**Accuracy**:
- Successful gestures ÷ Total attempts
- Target: >75% (Level 1), >85% (Level 2), >90% (Level 3)

**Speed**:
- Average gesture completion time
- Faster = better (but not rushed)

**Stability**:
- Consistency of hand movements
- Smooth = higher score

**Tracking**:
- Real-time display in HUD
- Auto-adjust level based on performance
- Can downgrade if accuracy drops

---

## Troubleshooting

### Gestures Not Detected

**Check**:
1. Hand is in webcam frame
2. Good lighting (not backlit)
3. Palm facing camera
4. Hand is clearly visible
5. Green hand icon in HUD

**Fix**:
- Press `V` to see webcam view
- Move closer to camera
- Improve lighting
- Check browser console (F12) for errors

### Voice Commands Not Working

**Check**:
1. Microphone permission granted
2. `M` key pressed to activate
3. Green 🎤 icon visible (top-right)
4. Speaking clearly in English or Italian

**Fix**:
- Check browser mic permissions
- Use Chrome/Edge (best Web Speech support)
- Speak louder and clearer
- Try keyboard navigation as fallback

### Camera Permission Denied

**Fix**:
1. Reload page
2. Click "Start Experience" again
3. Allow camera in browser prompt
4. Check browser settings:
   - Chrome: `chrome://settings/content/camera`
   - Firefox: Preferences → Privacy → Camera
   - Safari: Preferences → Websites → Camera

### Performance Issues (Lag/Stutter)

**Fix**:
1. Close other browser tabs
2. Disable dynamic background:
   - Edit `js/config.js`
   - Set `dynamicBackgroundEnabled: false`
3. Reduce MediaPipe complexity:
   - Edit `js/config.js`
   - Set `modelComplexity: 0` (lite mode)
4. Use Chrome/Edge (best GPU support)

### Navigation Too Sensitive

**Fix** - Adjust thresholds in `js/config.js`:
```javascript
CONFIG.gridLock = {
    threshold: 0.15,              // Increase for less sensitivity
    thresholdVertical: 0.12,      // Increase for harder layer switching
    minIntentVelocity: 0.020,     // Increase to require faster movement
    minIntentVelocityVertical: 0.015
}
```

### Navigation Too Difficult

**Fix** - Lower thresholds in `js/config.js`:
```javascript
CONFIG.gridLock = {
    threshold: 0.08,              // Decrease for more sensitivity
    thresholdVertical: 0.06,      // Decrease for easier layer switching
    minIntentVelocity: 0.010,     // Decrease to allow slower movement
    minIntentVelocityVertical: 0.008
}
```

---

## Advanced Usage

### Customizing Audio

**Edit `js/config.js`**:
```javascript
CONFIG.audio = {
    masterVolume: 0.5,           // Adjust 0-1 (0=silent, 1=max)
    spatialEnabled: true,        // 3D audio positioning
    gestureEffectsEnabled: true, // Whoosh/beep sounds
    musicEnabled: false          // Ambient loops (keep false)
}
```

**Disable All Audio**:
```javascript
CONFIG.audio.gestureEffectsEnabled = false;
```

### Customizing Visual Effects

**Edit `js/config.js`**:
```javascript
CONFIG.effects = {
    lightBeamsEnabled: true,         // Akira-style beams
    dynamicBackgroundEnabled: true,  // Animated orbs
    kamikazeEnabled: true,           // Kamehameha focus effect
    particlesEnabled: true           // Particle systems
}
```

**Performance Mode** (disable all effects):
```javascript
CONFIG.effects = {
    lightBeamsEnabled: false,
    dynamicBackgroundEnabled: false,
    kamikazeEnabled: false,
    particlesEnabled: false
}
```

### Adjusting Adaptive System

**Make it Easier** (unlock levels faster):
```javascript
CONFIG.adaptiveNavigation.levels = {
    1: { accuracyThreshold: 0.60, speedThreshold: 50 },  // Lower bars
    2: { accuracyThreshold: 0.70, speedThreshold: 60 },
    3: { accuracyThreshold: 0.80, speedThreshold: 70 }
}
```

**Make it Harder** (require more skill):
```javascript
CONFIG.adaptiveNavigation.levels = {
    1: { accuracyThreshold: 0.80, speedThreshold: 70 },  // Higher bars
    2: { accuracyThreshold: 0.90, speedThreshold: 85 },
    3: { accuracyThreshold: 0.95, speedThreshold: 95 }
}
```

### Disable Adaptive System

```javascript
CONFIG.adaptiveNavigation.enabled = false;
```

All gestures unlocked immediately.

---

## Testing Your Installation

### Run Automated Tests

**Install Playwright**:
```bash
npm install
```

**Run Tests**:
```bash
npm test              # Run all 43 tests
npm run test:ui       # Interactive test UI
npm run test:headed   # See browser execution
npm run test:debug    # Debug failed tests
```

**Expected Results**:
- ✅ 36+ tests passed
- ⚠️ 7 tests may fail (CSS assertions in headless mode)
- Total runtime: ~2-3 minutes

See `TEST_RESULTS.md` for detailed breakdown.

### Manual Testing Checklist

- [ ] Camera permission granted
- [ ] Hand detected (green icon in HUD)
- [ ] Swipe left/right navigates cards
- [ ] Swipe up/down changes layers
- [ ] Keyboard arrows work
- [ ] WASD keys work
- [ ] Voice commands respond (press `M` first)
- [ ] HUD shows correct layer/position
- [ ] Navigation history updates
- [ ] Adaptive progress bar visible
- [ ] Light beams flash on navigation
- [ ] Audio plays (whoosh/beep sounds)

---

## Next Steps

### Explore Features

1. **Try all input methods**: Gestures, keyboard, voice
2. **Unlock Level 2**: Navigate 15-20 times with >85% accuracy
3. **Unlock Level 3**: Maintain >90% accuracy
4. **Experiment with effects**: Try point-to-focus Kamehameha
5. **Check history widget**: See your navigation pattern

### Read Documentation

- **FEATURES.md**: Complete feature breakdown
- **ARCHITECTURE.md**: Technical deep-dive
- **API.md**: Module reference and extension points
- **TESTING.md**: Playwright test suite details

### Customize

1. Edit `js/config.js` for all settings
2. Modify thresholds to match your preference
3. Enable/disable visual effects
4. Adjust audio volumes
5. Tweak adaptive system difficulty

### Contribute

- Report bugs: Open GitHub issue
- Suggest features: Open GitHub discussion
- Submit improvements: Create pull request
- Share feedback: Star the repo!

---

## Support

**Having Issues?**

1. Check this guide's Troubleshooting section
2. Review browser console for errors (F12)
3. Ensure local server is running
4. Try Chrome/Edge for best compatibility
5. Open GitHub issue with:
   - Browser version
   - Operating system
   - Error messages
   - Steps to reproduce

**Feature Requests?**

Open a GitHub issue with:
- Clear description of desired feature
- Use case / why it's needed
- Any implementation ideas

---

**Happy Navigating!** 🚀✨
