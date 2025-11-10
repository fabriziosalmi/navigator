/**
 * Configuration Module
 * Centralizza tutte le configurazioni del sistema per modifiche atomiche
 */

export const CONFIG = {
    // Grid Lock System
    gridLock: {
        enabled: true,
        threshold: 0.12,
        thresholdVertical: 0.10,  // Threshold ridotta per vertical (layer up/down)
        damping: 0.85,
        snapSpeed: 0.3,
        lockDuration: 400,
        directionChangeDelay: 800,
        minIntentVelocity: 0.015,
        minIntentVelocityVertical: 0.012,  // Ridotta per facilitare layer up
        predictiveEnabled: true,
        predictiveConfig: {
            historySize: 10,
            predictionTime: 50,
            smoothingFactor: 0.3,
            minVelocityThreshold: 0.001
        }
    },

    // Audio Settings
    audio: {
        masterVolume: 0.3,
        drumBPM: 174,
        drumVolume: 0.12
    },

    // Camera Settings (MediaPipe)
    camera: {
        maxNumHands: 1,
        modelComplexity: 1,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
        videoWidth: 640,
        videoHeight: 480
    },

    // Navigation Settings
    navigation: {
        initialLayer: 'video',
        infiniteScroll: true,
        cardTransitionDuration: '0.4s',
        layerTransitionDuration: '0.8s'
    },

    // Performance Settings
    performance: {
        maxDebugEntries: 50,
        velocityDecayTime: 2000,
        highVelocityThreshold: 5,
        mediumVelocityThreshold: 2
    },

    // Predictive Tracking Settings
    predictiveTracking: {
        enabled: true,
        historySize: 10,              // Numero di frame da analizzare
        predictionTime: 50,            // ms nel futuro (latenza da compensare)
        smoothingFactor: 0.3,          // 0-1, più alto = più reattivo ma jittery
        minVelocityThreshold: 0.001,   // Soglia minima velocità per predizione
        adaptiveMode: true             // Adatta prediction time basato su velocità
    },

    // Visual Effects
    effects: {
        dynamicBackgroundEnabled: true,
        wowLabelEnabled: true,
        cardHoverEffects: true
    },

    // Gesture Detection Thresholds
    gestures: {
        pinchThreshold: 0.05,
        fistThreshold: 0.15,
        thumbsUpDuration: 1000,
        shakeThreshold: 3,
        shakeTimeWindow: 1500,
        confirmCooldown: 2000
    },

    // Gesture Stabilization (Glitch Suppression)
    gestureStabilization: {
        enabled: true,
        minStabilityThreshold: 0.95,    // 95% - Soglia minima per considerare gesto stabile
        maxStabilityThreshold: 0.99,    // 99% - Soglia massima (bonus tolleranza)
        historySize: 20,                 // Frame da analizzare per stability
        maxGlitchFrames: 3,              // Max frame consecutivi di glitch tollerati
        adaptiveMode: true               // Adatta tolleranza basato su stability
    },

    // Adaptive Detail Rendering (LOD System)
    lod: {
        enabled: true,
        highDetailRadius: 8,        // Full quality within 8 units from camera
        mediumDetailRadius: 15,     // Medium quality 8-15 units
        lowDetailRadius: 25,        // Low quality 15-25 units
        cullRadius: 35,             // Cull (hide) beyond 35 units
        updateInterval: 100,        // Update LOD every 100ms (performance optimization)
        hysteresis: 1.2             // Prevent LOD flickering at boundaries
    },

    // DOM LOD (Foveated Rendering for Cards)
    domLOD: {
        enabled: true,
        activeRadius: 0,            // 0 = only current card gets full detail
        adjacentRadius: 1,          // 1 = prev/next cards get reduced detail
        nearbyRadius: 2,            // 2-3 positions away = minimal detail
        distantRadius: 4,           // 4+ positions = low priority
        updateInterval: 50          // Update every 50ms
    },

    // Layer Configuration
    layers: {
        video: { icon: '🎬', label: 'Videos', theme: 'video' },
        news: { icon: '📰', label: 'News', theme: 'news' },
        images: { icon: '🖼️', label: 'Images', theme: 'images' },
        games: { icon: '🎮', label: 'Games', theme: 'games' },
        apps: { icon: '📱', label: 'Apps', theme: 'apps' },
        settings: { icon: '⚙️', label: 'Settings', theme: 'settings' }
    }
};

// Utility per aggiornare configurazione runtime
export function updateConfig(path, value) {
    const keys = path.split('.');
    let obj = CONFIG;

    for (let i = 0; i < keys.length - 1; i++) {
        obj = obj[keys[i]];
    }

    obj[keys[keys.length - 1]] = value;
    // console.log(`Config updated: ${path} = ${value}`);
}

// Export default
export default CONFIG;
