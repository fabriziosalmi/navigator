# Navigator - File Inventory

## HTML Files (1)
- `index.html` - Main application entry point

## CSS Files (22) - All in use
1. `css/base.css` - Base styles and CSS variables
2. `css/layers.css` - Layer system styling
3. `css/cards.css` - Card component design
4. `css/categories.css` - Category-specific theming
5. `css/lod.css` - Level of Detail optimizations
6. `css/hud.css` - HUD components base styling
7. `css/adaptive.css` - Adaptive navigation system
8. `css/history.css` - Navigation history styling
9. `css/gestures.css` - Gesture indicators and feedback
10. `css/start-screen.css` - Initial welcome screen
11. `css/effects.css` - Visual effects and animations
12. `css/interface-hud.css` - Interface status HUD
13. `css/unified-hud.css` - Unified HUD components
14. `css/carousel-3d.css` - 3D carousel card layout
15. `css/dual-hud-layout.css` - Top/Bottom HUD layout system
16. `css/performance-optimizations.css` - Performance tweaks
17. `css/ux-refinements.css` - UX improvements
18. `css/viewport-cleanup.css` - Viewport cleanup and visibility
19. `css/card-blur-overlay.css` - Card blur overlay system
20. `css/interface-status-compact.css` - Compact interface status
21. `css/monochrome-minimal.css` - Monochrome theme
22. `css/responsive.css` - Responsive design breakpoints

## JavaScript Files (19) - All in use

### Core Entry Point
- `js/main-init.js` - Main initialization and orchestration

### Direct Dependencies (imported by main-init.js)
1. `js/config.js` - Configuration constants
2. `js/AudioManager.js` - Audio feedback system
3. `js/LayerManager.js` - Layer management and navigation
4. `js/GridLockSystem.js` - Grid lock and navigation stabilization
5. `js/NavigationController.js` - Navigation control logic
6. `js/GestureDetector.js` - Hand gesture detection
7. `js/DOMLODManager.js` - DOM Level of Detail management
8. `js/VisualEffects.js` - Visual effects and animations
9. `js/AdaptiveNavigationSystem.js` - Adaptive difficulty system
10. `js/AdaptiveNavigationHUD.js` - Adaptive HUD display
11. `js/LightBeamSystem.js` - Light beam visual effects
12. `js/VoiceCommandModule.js` - Voice command system
13. `js/NavigationHistoryHUD.js` - Navigation history display
14. `js/GestureLED.js` - Gesture LED feedback
15. `js/InterfaceStatusHUD.js` - Interface status display
16. `js/CarouselMomentum.js` - Carousel momentum physics

### Indirect Dependencies
17. `js/GestureStabilizer.js` - Gesture stabilization (imported by GestureDetector)
18. `js/PredictiveTracker.js` - Predictive tracking (imported by GridLockSystem)

## Removed Files (13 - Backed up in .backup/)
❌ js/main.js - Legacy main script (replaced by main-init.js)
❌ js/main.optimized.js - Optimized version (not used)
❌ js/SceneManager.js - 3D scene manager (not used in current implementation)
❌ js/SceneManager.optimized.js - Optimized version (not used)
❌ js/Card.js - 3D card class (replaced by DOM-based cards)
❌ js/CardManager.js - 3D card manager (not used)
❌ js/LODManager.js - 3D LOD manager (replaced by DOMLODManager)
❌ js/DataStream.js - Data stream visualization (not used)
❌ js/DataStream.optimized.js - Optimized version (not used)
❌ js/GestureController.js - Legacy gesture controller (replaced by GestureDetector)
❌ js/GestureController.optimized.js - Optimized version (not used)
❌ js/UIManager.js - Legacy UI manager (functionality integrated into main-init)
❌ js/AppStateManager.js - App state manager (not used)

## Summary
- **Total HTML**: 1 file
- **Total CSS**: 22 files (all active)
- **Total JS**: 19 files (all active)
- **Removed JS**: 13 files (backed up)
- **Total Active Files**: 42 files

All files are now actively used in the application.
No dead code or unused dependencies remain.
