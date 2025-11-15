# Configuration System

## Overview

Navigator now uses a centralized YAML configuration file (`config.yaml`) for all tunable parameters. This enables:
- ✅ Configuration-driven tuning without code changes
- ✅ Multiple presets for different use cases
- ✅ Easy parameter discovery and documentation
- ✅ Runtime config reloading (development)
- ✅ Validation and range checking

## File Structure

```
navigator/
├── config.yaml              # Main configuration file
├── js/
│   ├── ConfigLoader.js      # YAML parser and loader
│   ├── main-init.js         # Applies config on startup
│   └── config.js            # Legacy CONFIG object (deprecated)
└── docs/
    └── CONFIGURATION.md     # This file
```

## Usage

### Basic Usage

The configuration is loaded automatically when you start the app:

```javascript
// In main-init.js, called on startup:
await configLoader.load();
configLoader.validate();
applyConfigValues();
```

### Getting Configuration Values

```javascript
// In any JS module:
import { getConfig } from './ConfigLoader.js';

const fps = getConfig('performance.target_fps', 60); // Default: 60
const confidence = getConfig('gestures.detection.min_detection_confidence');
const volume = getConfig('audio.master_volume');
```

### Setting Configuration Values (Runtime)

```javascript
// Access global configLoader
window.configLoader.set('audio.master_volume', 0.5);
window.configLoader.set('gestures.detection.min_detection_confidence', 0.8);

// Hot reload during development
await window.configLoader.reload();
```

## Configuration Sections

### 1. Performance
Controls FPS, idle detection, and LOD (Level of Detail):

```yaml
performance:
  target_fps: 60
  idle_timeout_ms: 15000
  idle_enabled: true
  lod:
    enabled: true
    near_distance: 2
    medium_distance: 4
```

**Key Parameters:**
- `target_fps`: Target frame rate (30-120 recommended)
- `idle_timeout_ms`: Time before idle mode activates
- `lod.near_distance`: Cards within this distance get full detail
- `lod.medium_distance`: Cards beyond this are simplified

### 2. Gesture Detection
MediaPipe Hand Tracking parameters:

```yaml
gestures:
  detection:
    min_detection_confidence: 0.7
    min_tracking_confidence: 0.5
    model_complexity: 1
    max_num_hands: 1
```

**Key Parameters:**
- `min_detection_confidence`: 0.5-0.95 (higher = fewer false positives)
- `min_tracking_confidence`: 0.5-0.95 (higher = smoother tracking)
- `model_complexity`: 0 (fast), 1 (balanced), 2 (accurate)

### 3. Gesture Recognition
Swipe, shake, and confirmation gestures:

```yaml
gestures:
  recognition:
    swipe:
      min_distance: 0.08        # Minimum hand movement
      max_time_ms: 800          # Maximum swipe duration
      cooldown_ms: 300          # Time between swipes
    thumbs_up:
      hold_duration_ms: 1000    # Hold time to confirm YES
      cooldown_ms: 2000         # Prevent spam
    shake:
      threshold_count: 3        # Shakes needed for NO
      time_window_ms: 1500      # Time window for shakes
```

**Tuning Tips:**
- ⬆️ Increase `min_distance` if accidental swipes occur
- ⬇️ Decrease `min_distance` for more sensitive detection
- ⬆️ Increase `cooldown_ms` to prevent rapid-fire gestures
- ⬇️ Decrease `hold_duration_ms` for faster confirmations

### 4. Grid Lock System
Prevents jittery navigation by filtering micro-movements:

```yaml
gestures:
  grid_lock:
    enabled: true
    cell_size: 0.15              # Grid cell size (0-1 screen)
    accumulator_decay: 0.85      # Movement accumulation decay
    intent_threshold: 0.3        # Minimum intent to trigger
    dead_zone: 0.05              # Center dead zone
```

**Tuning Tips:**
- ⬆️ Increase `cell_size` for more forgiving detection
- ⬆️ Increase `intent_threshold` to require more deliberate movement
- ⬆️ Increase `dead_zone` to reduce micro-jitter

### 5. Navigation Behavior
Card transitions and momentum:

```yaml
navigation:
  cards:
    transition_duration_ms: 600
    carousel_mode: true
  momentum:
    enabled: true
    friction: 0.92
    velocity_threshold: 0.01
```

**Key Parameters:**
- `transition_duration_ms`: Animation speed (lower = faster)
- `friction`: Momentum decay rate (0-1, higher = slower decay)
- `velocity_threshold`: Minimum speed before stopping

### 6. Adaptive System
Level progression and XP rewards:

```yaml
adaptive:
  progression:
    levels:
      - name: "Novice"
        xp_required: 0
        difficulty_multiplier: 1.0
      - name: "Adept"
        xp_required: 100
        difficulty_multiplier: 0.9
```

**XP Rewards:**
- Successful gesture: 10 XP
- Perfect timing: 25 XP
- Combo actions: 50 XP

### 7. Audio Feedback
Volume levels and spatial audio:

```yaml
audio:
  enabled: true
  master_volume: 0.3
  spatial_audio:
    enabled: true
    rolloff_factor: 1.5
```

**Tuning Tips:**
- `master_volume`: 0.0 (muted) to 1.0 (full)
- `rolloff_factor`: Higher = faster distance attenuation

### 8. Visual Effects
Particles, blur, and LED indicators:

```yaml
visual_effects:
  enabled: true
  performance_mode: "medium"
  particles:
    max_count: 100
    lifetime_ms: 2000
  blur:
    inactive_cards_px: 12
  led:
    enabled: true
    pulse_duration_ms: 500
```

**Performance Modes:**
- `low`: Minimal effects (30 particles)
- `medium`: Balanced (100 particles)
- `high`: Maximum visual fidelity (200 particles)

## Presets

Navigator includes 5 tuning presets optimized for different scenarios:

### 1. Performance (`performance`)
**For low-end devices or prioritizing FPS:**
```yaml
performance.target_fps: 30
visual_effects.performance_mode: "low"
gestures.detection.model_complexity: 0
```

### 2. Quality (`quality`)
**For high-end devices prioritizing visual fidelity:**
```yaml
performance.target_fps: 60
visual_effects.performance_mode: "high"
gestures.detection.model_complexity: 2
```

### 3. Accessible (`accessible`)
**For users needing easier gesture detection:**
```yaml
gestures.recognition.swipe.min_distance: 0.15
gestures.recognition.swipe.max_time_ms: 1200
gestures.grid_lock.cell_size: 0.20
```

### 4. Precision (`precision`) ⭐ *DEFAULT*
**For expert users wanting tight control:**
```yaml
gestures.recognition.swipe.min_distance: 0.06
gestures.recognition.swipe.cooldown_ms: 200
gestures.grid_lock.intent_threshold: 0.25
```

### 5. Development (`development`)
**For debugging and testing:**
```yaml
ui.debug.enabled: true
ui.debug.show_fps: true
ui.debug.show_grid: true
```

### Applying Presets

Edit `config.yaml` and change the `active_preset`:

```yaml
# Active preset to apply on load
active_preset: "precision"  # Change to: performance, quality, accessible, development
```

Or at runtime:

```javascript
window.configLoader.applyPreset('quality');
await window.configLoader.reload();
```

## Validation

The configuration is validated on load. Warnings are logged for out-of-range values:

```
⚠️ Configuration validation warnings:
  - target_fps 120 outside recommended range [30-120]
  - min_detection_confidence 0.95 outside range [0.5-0.95]
```

**Common Ranges:**
- FPS: 30-120
- Confidence: 0.5-0.95
- Volume: 0.0-1.0
- Distance/Size: 0.0-1.0 (normalized screen space)
- Friction: 0.0-1.0 (decay rates)

## Hot Reload (Development)

During development, you can reload the configuration without restarting:

```javascript
// In browser console:
await window.configLoader.reload();
```

This will:
1. Re-parse `config.yaml`
2. Validate new values
3. Emit `config:reloaded` event
4. Components can listen and react to changes

## Migration from CONFIG.js

The legacy `config.js` is now **deprecated**. Values are migrated automatically:

**Before:**
```javascript
// config.js
const CONFIG = {
    camera: {
        minDetectionConfidence: 0.7
    }
};
```

**After:**
```yaml
# config.yaml
gestures:
  detection:
    min_detection_confidence: 0.7
```

**Bridge Function:**
```javascript
// main-init.js - automatically syncs YAML → CONFIG
applyConfigValues();
```

## Best Practices

### 1. Start with a Preset
Choose the preset closest to your needs, then fine-tune:
```yaml
active_preset: "precision"
```

### 2. Document Changes
Add comments to explain custom values:
```yaml
gestures:
  recognition:
    swipe:
      min_distance: 0.10  # Increased for wheelchair users
```

### 3. Test Incrementally
Change one parameter at a time, test, then adjust:
1. Modify `config.yaml`
2. Reload page
3. Test gesture behavior
4. Iterate

### 4. Use Validation
Check console for warnings:
```javascript
configLoader.validate(); // Returns true if all OK
```

### 5. Export Configs
Save working configurations:
```javascript
const yaml = window.configLoader.exportYAML();
console.log(yaml); // Copy to file
```

## Troubleshooting

### Config Not Loading
**Symptom:** Changes to `config.yaml` don't apply

**Solutions:**
1. Check browser console for errors
2. Verify YAML syntax (no tabs, proper indentation)
3. Hard refresh (Cmd+Shift+R / Ctrl+Shift+F5)
4. Check file path: `./config.yaml` relative to `index.html`

### Gestures Too Sensitive
**Symptom:** Accidental swipes, jittery navigation

**Solutions:**
```yaml
gestures:
  recognition:
    swipe:
      min_distance: 0.12  # Increase from 0.08
      cooldown_ms: 500     # Increase from 300
  grid_lock:
    intent_threshold: 0.4  # Increase from 0.3
    dead_zone: 0.08        # Increase from 0.05
```

### Gestures Too Sluggish
**Symptom:** Gestures not detected, slow response

**Solutions:**
```yaml
gestures:
  recognition:
    swipe:
      min_distance: 0.05   # Decrease from 0.08
      cooldown_ms: 200     # Decrease from 300
  detection:
    min_detection_confidence: 0.6  # Decrease from 0.7
```

### Poor Performance
**Symptom:** Low FPS, stuttering animations

**Solutions:**
```yaml
active_preset: "performance"

# Or manually:
performance:
  target_fps: 30
visual_effects:
  performance_mode: "low"
  particles:
    max_count: 30
gestures:
  detection:
    model_complexity: 0
```

## Advanced Usage

### Creating Custom Presets

Add your own preset to `config.yaml`:

```yaml
presets:
  my_custom:
    "performance.target_fps": 45
    "gestures.recognition.swipe.min_distance": 0.10
    "audio.master_volume": 0.2
    "visual_effects.performance_mode": "medium"
```

Activate it:
```yaml
active_preset: "my_custom"
```

### Runtime Config Editor

Create a UI panel to edit config in real-time:

```javascript
// Example: Slider for detection confidence
const slider = document.getElementById('confidence-slider');
slider.addEventListener('input', (e) => {
    const value = parseFloat(e.target.value);
    window.configLoader.set('gestures.detection.min_detection_confidence', value);
});
```

### Persistent User Preferences

Save user's custom config to localStorage:

```javascript
// Save
const yaml = window.configLoader.exportYAML();
localStorage.setItem('navigator_config', yaml);

// Load
const savedConfig = localStorage.getItem('navigator_config');
if (savedConfig) {
    // Load custom config instead of default
}
```

## Related Documentation

- **[OPTIMIZATION_GUIDE.md](./OPTIMIZATION_GUIDE.md)** - Performance tuning strategies
- **[FEATURES.md](./FEATURES.md)** - Feature descriptions and usage
- **[UX_UI_FIXES.md](./UX_UI_FIXES.md)** - UI improvements and gesture refinements

## Changelog

### v1.0.0 (Current)
- ✅ Created centralized `config.yaml` with 400+ parameters
- ✅ Built `ConfigLoader.js` with YAML parser
- ✅ Integrated with `main-init.js` startup
- ✅ Added 5 presets (performance, quality, accessible, precision, development)
- ✅ Implemented validation system
- ✅ Added hot reload support
- ✅ Migrated from legacy `CONFIG.js`

---

**Last Updated:** 2025-01-25  
**Version:** 1.0.0  
**Status:** Production Ready
