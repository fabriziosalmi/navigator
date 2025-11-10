# Navigator v2.0 - File Cleanup Analysis


## 📊 Current Status

### ✅ NEW FILES (Core & Plugin Architecture)

**Core System:**
- `js/core/NavigatorCore.js` - Main engine
- `js/core/EventBus.js` - Event system
- `js/core/AppState.js` - State management (enhanced)
- `js/core/BasePlugin.js` - Plugin base class

**Plugins:**
- `js/plugins/input/KeyboardInputPlugin.js`
- `js/plugins/input/GestureInputPlugin.js`
- `js/plugins/logic/NavigationLogicPlugin.js`
- `js/plugins/output/DomRendererPlugin.js`
- `js/plugins/output/AudioFeedbackPlugin.js`
- `js/plugins/output/VisualEffectsPlugin.js`

**Entry Point:**
- `js/main-navigator-v2.js` - New initialization

**Configuration:**
- `config.yaml` - Centralized YAML config ✅ **STILL USED**
- `js/ConfigLoader.js` - YAML loader ✅ **STILL USED**

**Documentation:**
- `docs/PLUGIN_ARCHITECTURE.md` - New architecture guide
- `docs/CONFIGURATION.md` - Config guide
- `docs/ARCHITECTURE_V2_PLAN.md` - Migration plan
- `CONFIG_IMPLEMENTATION.md` - Implementation notes

---

## 🔧 LEGACY FILES - STILL USED (Wrapped by Plugins)

These files are **NOT** unused - they are wrapped by plugins:

✅ `js/GestureDetector.js` - Used by GestureInputPlugin  
✅ `js/GestureStabilizer.js` - Used by GestureDetector  
✅ `js/AudioManager.js` - Used by AudioFeedbackPlugin  
✅ `js/LayerManager.js` - Used by DomRendererPlugin  
✅ `js/VisualEffects.js` - Used by VisualEffectsPlugin  
✅ `js/LightBeamSystem.js` - Used by VisualEffectsPlugin  
✅ `js/NavigationController.js` - Data structures used by DomRendererPlugin  
✅ `js/config.js` - Still used by legacy modules  

---

## ❌ POTENTIALLY UNUSED FILES

These files might be unused in v2 architecture:

### Likely Unused:
- `js/main-init.js` - **OLD entry point** (replaced by main-navigator-v2.js)
  - ⚠️ **Still referenced in index.html**
  
- `js/AppState.js` (OLD) - **Replaced** by js/core/AppState.js
  - ⚠️ Different implementation

### Files to Investigate:
- `js/AdaptiveNavigationSystem.js` - Level progression system
- `js/AdaptiveNavigationHUD.js` - HUD display
- `js/NavigationHistoryHUD.js` - History tracking
- `js/InterfaceStatusHUD.js` - Status display
- `js/GestureLED.js` - LED indicator
- `js/CarouselMomentum.js` - Momentum physics
- `js/GridLockSystem.js` - Gesture stabilization
- `js/PredictiveTracker.js` - Motion prediction
- `js/VoiceCommandModule.js` - Voice commands
- `js/DOMLODManager.js` - Performance optimization
- `js/ErrorHandler.js` - Error handling

**Note:** These could be converted into plugins in the future!

---

## 🎯 RECOMMENDATION

### DO NOT DELETE ANY FILES YET

**Reason:** The new v2 architecture is **additive**, not **replacement**.

### Migration Strategy:

1. **Phase 1 - Parallel Operation** ✅ CURRENT
   - v1 (main-init.js) and v2 (main-navigator-v2.js) coexist
   - Both use the same legacy modules
   - Users can choose which to use

2. **Phase 2 - Testing** (Next)
   - Update index.html to use main-navigator-v2.js
   - Test all functionality in v2
   - Keep v1 as fallback

3. **Phase 3 - Deprecation** (Future)
   - After v2 is stable and tested
   - Mark v1 files as deprecated
   - Eventually remove when safe

### Files That Can Be Safely Ignored (Already Backed Up):

According to `FILE_INVENTORY.md`, these were already removed and backed up:

```
.backup/
├── js/main.js
├── js/main.optimized.js
├── js/SceneManager.js
├── js/SceneManager.optimized.js
├── js/Card.js
├── js/CardManager.js
├── js/LODManager.js
├── js/DataStream.js
├── js/DataStream.optimized.js
├── js/GestureController.js
├── js/GestureController.optimized.js
└── js/UIManager.js
```

---

## 🚀 NEXT STEPS

### To Use v2 Architecture:

1. **Update index.html:**
   ```html
   <!-- OLD -->
   <script type="module" src="./js/main-init.js"></script>
   
   <!-- NEW -->
   <script type="module" src="./js/main-navigator-v2.js"></script>
   ```

2. **Test thoroughly:**
   - Keyboard navigation
   - Gesture navigation
   - Audio feedback
   - Visual effects
   - All features work

3. **Keep both versions** until v2 is proven stable

---

## 📦 config.yaml Status

### ✅ YES, WE ARE STILL USING config.yaml

**Why:**
- Centralized configuration for the entire system
- Used by both v1 and v2
- Loaded by `ConfigLoader.js`
- Plugin configurations pulled from it
- Performance settings
- Feature flags

**Usage in v2:**
```javascript
// In main-navigator-v2.js
await configLoader.loadConfig('/config.yaml');

// Plugins get config from it
const enabled = getConfig('features.keyboard_navigation', true);
```

**Important:** `config.yaml` is the **single source of truth** for all configurations!

---

## 🎓 Summary

| File Type | Status | Action |
|-----------|--------|--------|
| New v2 Core & Plugins | ✅ Active | Keep |
| config.yaml | ✅ Active | Keep |
| ConfigLoader.js | ✅ Active | Keep |
| Legacy wrapped by plugins | ✅ Active | Keep |
| main-init.js (v1) | ⚠️ Parallel | Keep for now |
| Old AppState.js | ⚠️ Superseded | Keep until tested |
| HUD/UI modules | 🤔 TBD | Convert to plugins later |
| Backed up files | ❌ Deleted | Already in .backup/ |

**Recommendation: Don't delete anything yet. Test v2 first.**
