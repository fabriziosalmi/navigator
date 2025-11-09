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
        minIntentVelocityVertical: 0.012  // Ridotta per facilitare layer up
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
    console.log(`Config updated: ${path} = ${value}`);
}

// Export default
export default CONFIG;
