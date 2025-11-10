/**
 * main-navigator-v2.js
 * 
 * NEW Core & Plugin Architecture Initialization
 * 
 * This is the new entry point that demonstrates the modular,
 * event-driven architecture of Navigator v2.
 * 
 * Features:
 * - Zero coupling between plugins
 * - Easy to add/remove plugins
 * - Framework-agnostic core
 * - Event-driven communication
 */

import { NavigatorCore } from './core/NavigatorCore.js';
import { configLoader, getConfig } from './ConfigLoader.js';

// Input Plugins
import { KeyboardInputPlugin } from './plugins/input/KeyboardInputPlugin.js';
import { GestureInputPlugin } from './plugins/input/GestureInputPlugin.js';

// Logic Plugins
import { NavigationLogicPlugin } from './plugins/logic/NavigationLogicPlugin.js';

// Output Plugins
import { DomRendererPlugin } from './plugins/output/DomRendererPlugin.js';
import { AudioFeedbackPlugin } from './plugins/output/AudioFeedbackPlugin.js';
import { VisualEffectsPlugin } from './plugins/output/VisualEffectsPlugin.js';

// ============================================
// Global Navigator Instance
// ============================================
window.navigator_v2 = null;

// ============================================
// Initialization
// ============================================

async function initNavigator() {
    console.log('🚀 Initializing Navigator v2.0 - Core & Plugin Architecture');

    try {
        // Load configuration
        await configLoader.loadConfig('/config.yaml');
        console.log('✅ Configuration loaded');

        // Create Core instance
        const core = new NavigatorCore({
            debugMode: getConfig('developer.monitor_performance', true),
            autoStart: getConfig('ui.start_screen.auto_start', false),
            initialState: {
                navigation: {
                    currentLayer: 0,
                    totalLayers: 6,
                    layerName: getConfig('navigation.initial_layer', 'video'),
                    currentCardIndex: getConfig('navigation.initial_card_index', 0),
                    totalCards: 0,
                    isTransitioning: false
                }
            }
        });

        // ========================================
        // Register Plugins
        // ========================================

        console.log('🔌 Registering plugins...');

        // INPUT PLUGINS (Priority: 100+)
        // These capture raw input from devices

        if (getConfig('features.keyboard_navigation', true)) {
            core.registerPlugin(new KeyboardInputPlugin({
                enabled: getConfig('input.keyboardEnabled', true),
                preventDefaults: true
            }), { priority: 150 });
        }

        if (getConfig('features.gesture_navigation', true)) {
            core.registerPlugin(new GestureInputPlugin({
                enabled: getConfig('input.gestureEnabled', true),
                camera: getConfig('camera', {}),
                mediapipe: getConfig('gestures.detection', {}),
                swipe: getConfig('gestures.recognition.swipe', {})
            }), { priority: 100 });
        }

        // LOGIC PLUGINS (Priority: 50-99)
        // These interpret inputs and emit intents

        core.registerPlugin(new NavigationLogicPlugin({
            enabled: true,
            keyMapping: {
                ArrowLeft: 'navigate_left',
                ArrowRight: 'navigate_right',
                ArrowUp: 'navigate_up',
                ArrowDown: 'navigate_down',
                Enter: 'select_card',
                Escape: 'go_back',
                f: 'toggle_fullscreen'
            }
        }), { priority: 75 });

        // OUTPUT PLUGINS (Priority: 0-49)
        // These react to intents and update the UI

        core.registerPlugin(new DomRendererPlugin({
            enabled: true,
            containerSelector: '#layer-system',
            transitionDuration: getConfig('navigation.cards.transition_duration_ms', 600),
            carousel3d: {
                enabled: true,
                activeScale: getConfig('navigation.cards.active_scale', 1.0),
                sideScale: getConfig('navigation.cards.side_cards_scale', 0.75),
                sideOpacity: getConfig('navigation.cards.side_cards_opacity', 0.5)
            }
        }), { priority: 40 });

        if (getConfig('audio.enabled', true)) {
            core.registerPlugin(new AudioFeedbackPlugin({
                enabled: true,
                masterVolume: getConfig('audio.master_volume', 0.3),
                sounds: getConfig('audio.volumes', {}),
                spatial: getConfig('audio.spatial', {})
            }), { priority: 30 });
        }

        if (getConfig('visual_effects.enabled', true)) {
            core.registerPlugin(new VisualEffectsPlugin({
                enabled: true,
                performanceMode: getConfig('visual_effects.performance_mode', 'medium'),
                particles: getConfig('visual_effects.particles', {}),
                lightBeams: getConfig('visual_effects.light_beams', {}),
                blur: getConfig('visual_effects.blur', {}),
                gestureLED: getConfig('visual_effects.gesture_led', {})
            }), { priority: 20 });
        }

        // ========================================
        // Initialize Core
        // ========================================

        console.log('⚙️ Initializing core and plugins...');
        await core.init();
        console.log('✅ Core initialized');

        // ========================================
        // Setup Event Listeners for Debugging
        // ========================================

        if (getConfig('ui.debug.enabled', false)) {
            setupDebugListeners(core);
        }

        // ========================================
        // Handle Start Screen
        // ========================================

        const autoStart = getConfig('ui.start_screen.auto_start', false);
        const showStartScreen = getConfig('ui.start_screen.show_tutorial', true);

        if (autoStart || !showStartScreen) {
            // Start immediately
            await core.start();
            console.log('▶️ Navigator started');
        } else {
            // Wait for user to click "Start"
            setupStartScreen(core);
        }

        // Store global reference
        window.navigator_v2 = core;

        // Expose for debugging
        if (getConfig('developer.monitor_performance', true)) {
            window.navigatorDebug = {
                core,
                getStats: () => core.getStats(),
                getEventHistory: () => core.eventBus.getHistory(),
                getState: () => core.state.getState(),
                plugins: core.getPluginNames()
            };
        }

        console.log('✅ Navigator v2.0 initialized successfully!');
        console.log('📊 Plugins loaded:', core.getPluginNames());

    } catch (error) {
        console.error('❌ Failed to initialize Navigator:', error);
        showErrorScreen(error);
    }
}

// ============================================
// Start Screen
// ============================================

function setupStartScreen(core) {
    const startButton = document.getElementById('start-button');
    
    if (startButton) {
        startButton.addEventListener('click', async () => {
            console.log('▶️ Starting Navigator...');
            
            // Hide start screen
            const startScreen = document.querySelector('.start-screen');
            if (startScreen) {
                startScreen.classList.add('hidden');
            }

            // Start core
            await core.start();
            
            // Show HUD
            core.state.setState('ui.hudVisible', true);
            core.state.setState('ui.startScreenVisible', false);
        });
    }
}

// ============================================
// Debug Listeners
// ============================================

function setupDebugListeners(core) {
    // Log all events
    core.eventBus.on('*', (event) => {
        if (getConfig('ui.debug.console_logging', true)) {
            console.log(`[Event] ${event.name}`, event.payload);
        }
    });

    // Monitor performance
    setInterval(() => {
        const stats = core.getStats();
        const state = core.state.get('performance', {});
        
        if (getConfig('ui.debug.show_fps', false)) {
            console.log('FPS:', state.fps);
        }

        // Update debug panel if it exists
        updateDebugPanel(stats, state);
    }, 1000);

    // Listen for specific events to log
    core.eventBus.on('intent:navigate_left', () => {
        console.log('🔄 Navigate Left');
    });

    core.eventBus.on('intent:navigate_right', () => {
        console.log('🔄 Navigate Right');
    });

    core.eventBus.on('renderer:card_changed', (event) => {
        console.log('📇 Card Changed:', event.payload.currentIndex);
    });

    core.eventBus.on('renderer:layer_changed', (event) => {
        console.log('📚 Layer Changed:', event.payload.layerName);
    });
}

function updateDebugPanel(stats, performanceState) {
    const debugPanel = document.getElementById('debug-panel');
    if (!debugPanel) {
        return;
    }

    debugPanel.innerHTML = `
        <h3>Navigator v2.0 Debug</h3>
        <div>
            <strong>Uptime:</strong> ${Math.round(stats.uptime / 1000)}s<br>
            <strong>FPS:</strong> ${performanceState.fps || 0}<br>
            <strong>Plugins:</strong> ${stats.plugins.total}<br>
            <strong>Events Total:</strong> ${stats.events.totalEvents}<br>
            <strong>Running:</strong> ${stats.isRunning ? '✅' : '❌'}
        </div>
        <div>
            <strong>Top Events:</strong><br>
            ${stats.events.topEvents.slice(0, 5).map(e => `${e.name}: ${e.count}`).join('<br>')}
        </div>
    `;
}

// ============================================
// Error Screen
// ============================================

function showErrorScreen(error) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-screen';
    errorDiv.innerHTML = `
        <div class="error-content">
            <h1>⚠️ Navigator Initialization Failed</h1>
            <p>${error.message}</p>
            <pre>${error.stack}</pre>
            <button onclick="location.reload()">Reload</button>
        </div>
    `;
    document.body.appendChild(errorDiv);
}

// ============================================
// Start when DOM is ready
// ============================================

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initNavigator);
} else {
    initNavigator();
}

// ============================================
// Export for modules
// ============================================

export { initNavigator };
