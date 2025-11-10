/**
 * Centralized Application State Management
 * Single source of truth for Navigator app state
 * Implements event-driven architecture for state changes
 */

export class AppState extends EventTarget {
    constructor() {
        super();
        
        // Core navigation state
        this.state = {
            // Layer system
            currentLayer: 0,
            totalLayers: 6,
            layerName: 'videos',
            
            // Card navigation
            currentCardIndex: 0,
            totalCards: 0,
            
            // User progression
            userLevel: 1,
            experiencePoints: 0,
            navigationCount: 0,
            gesturesDetected: 0,
            
            // System state
            isIdle: false,
            idleTimeout: null,
            idleThreshold: 15000, // 15 seconds
            
            // Camera & MediaPipe
            cameraActive: false,
            handDetected: false,
            mediaPipeReady: false,
            
            // UI state
            startScreenVisible: true,
            hudVisible: false,
            fullscreenCard: null,
            
            // Performance metrics
            fps: 0,
            lastFrameTime: 0,
            performanceMode: 'high' // 'high' | 'medium' | 'low'
        };

        // History tracking
        this.history = [];
        this.maxHistorySize = 100;
        
        console.log('✅ AppState: Initialized with default state');
    }

    /**
     * Get current state (read-only copy)
     */
    getState() {
        return { ...this.state };
    }

    /**
     * Get specific state value
     */
    get(key) {
        return this.state[key];
    }

    /**
     * Set state value(s) and emit change event
     */
    setState(updates, skipEvent = false) {
        const oldState = { ...this.state };
        
        // Apply updates
        if (typeof updates === 'function') {
            // Updater function pattern
            this.state = { ...this.state, ...updates(this.state) };
        } else {
            // Direct object merge
            this.state = { ...this.state, ...updates };
        }

        // Track in history
        this.addToHistory(updates);

        // Emit change event
        if (!skipEvent) {
            this.dispatchEvent(new CustomEvent('statechange', {
                detail: {
                    updates,
                    oldState,
                    newState: { ...this.state }
                }
            }));
        }

        return this.state;
    }

    /**
     * Navigation actions
     */
    nextCard() {
        const newIndex = Math.min(this.state.currentCardIndex + 1, this.state.totalCards - 1);
        if (newIndex !== this.state.currentCardIndex) {
            this.setState({
                currentCardIndex: newIndex,
                navigationCount: this.state.navigationCount + 1
            });
            this.dispatchEvent(new CustomEvent('card:next', { detail: { index: newIndex } }));
            this.resetIdleTimer();
        }
    }

    previousCard() {
        const newIndex = Math.max(this.state.currentCardIndex - 1, 0);
        if (newIndex !== this.state.currentCardIndex) {
            this.setState({
                currentCardIndex: newIndex,
                navigationCount: this.state.navigationCount + 1
            });
            this.dispatchEvent(new CustomEvent('card:previous', { detail: { index: newIndex } }));
            this.resetIdleTimer();
        }
    }

    setCard(index) {
        if (index >= 0 && index < this.state.totalCards && index !== this.state.currentCardIndex) {
            this.setState({
                currentCardIndex: index,
                navigationCount: this.state.navigationCount + 1
            });
            this.dispatchEvent(new CustomEvent('card:set', { detail: { index } }));
            this.resetIdleTimer();
        }
    }

    nextLayer() {
        const newLayer = Math.min(this.state.currentLayer + 1, this.state.totalLayers - 1);
        if (newLayer !== this.state.currentLayer) {
            this.setState({ currentLayer: newLayer, currentCardIndex: 0 });
            this.dispatchEvent(new CustomEvent('layer:next', { detail: { layer: newLayer } }));
            this.resetIdleTimer();
        }
    }

    previousLayer() {
        const newLayer = Math.max(this.state.currentLayer - 1, 0);
        if (newLayer !== this.state.currentLayer) {
            this.setState({ currentLayer: newLayer, currentCardIndex: 0 });
            this.dispatchEvent(new CustomEvent('layer:previous', { detail: { layer: newLayer } }));
            this.resetIdleTimer();
        }
    }

    setLayer(layerIndex, layerName = '') {
        if (layerIndex >= 0 && layerIndex < this.state.totalLayers) {
            this.setState({
                currentLayer: layerIndex,
                layerName: layerName || `layer-${layerIndex}`,
                currentCardIndex: 0
            });
            this.dispatchEvent(new CustomEvent('layer:set', { 
                detail: { layer: layerIndex, name: layerName } 
            }));
            this.resetIdleTimer();
        }
    }

    /**
     * Idle detection system
     */
    resetIdleTimer() {
        // Clear existing timer
        if (this.state.idleTimeout) {
            clearTimeout(this.state.idleTimeout);
        }

        // Mark as active if was idle
        if (this.state.isIdle) {
            this.setState({ isIdle: false });
            this.dispatchEvent(new CustomEvent('system:active'));
        }

        // Set new idle timer
        const timeout = setTimeout(() => {
            this.setState({ isIdle: true });
            this.dispatchEvent(new CustomEvent('system:idle'));
        }, this.state.idleThreshold);

        this.setState({ idleTimeout: timeout }, true);
    }

    /**
     * User progression
     */
    addExperience(points) {
        const newXP = this.state.experiencePoints + points;
        const newLevel = Math.floor(newXP / 100) + 1;
        
        const leveledUp = newLevel > this.state.userLevel;
        
        this.setState({
            experiencePoints: newXP,
            userLevel: newLevel
        });

        if (leveledUp) {
            this.dispatchEvent(new CustomEvent('user:levelup', { 
                detail: { level: newLevel, xp: newXP } 
            }));
        }
    }

    /**
     * System status
     */
    setHandDetected(detected) {
        if (this.state.handDetected !== detected) {
            this.setState({ handDetected: detected });
            this.dispatchEvent(new CustomEvent('hand:' + (detected ? 'detected' : 'lost')));
            
            if (detected) {
                this.resetIdleTimer();
            }
        }
    }

    setCameraActive(active) {
        this.setState({ cameraActive: active });
        this.dispatchEvent(new CustomEvent('camera:' + (active ? 'active' : 'inactive')));
    }

    setMediaPipeReady(ready) {
        this.setState({ mediaPipeReady: ready });
        this.dispatchEvent(new CustomEvent('mediapipe:' + (ready ? 'ready' : 'notready')));
    }

    /**
     * Performance tracking
     */
    updateFPS(fps) {
        this.setState({ fps, lastFrameTime: Date.now() }, true);
        
        // Auto-adjust performance mode based on FPS
        if (fps < 30 && this.state.performanceMode === 'high') {
            this.setPerformanceMode('medium');
        } else if (fps < 20 && this.state.performanceMode === 'medium') {
            this.setPerformanceMode('low');
        }
    }

    setPerformanceMode(mode) {
        if (['high', 'medium', 'low'].includes(mode)) {
            this.setState({ performanceMode: mode });
            this.dispatchEvent(new CustomEvent('performance:modechange', { detail: { mode } }));
        }
    }

    /**
     * History tracking
     */
    addToHistory(action) {
        this.history.unshift({
            action,
            timestamp: Date.now(),
            state: { ...this.state }
        });

        if (this.history.length > this.maxHistorySize) {
            this.history.pop();
        }
    }

    getHistory(count = 10) {
        return this.history.slice(0, count);
    }

    /**
     * Subscribe to specific state changes
     */
    subscribe(callback) {
        this.addEventListener('statechange', callback);
        return () => this.removeEventListener('statechange', callback);
    }

    /**
     * Subscribe to specific events
     */
    on(event, callback) {
        this.addEventListener(event, callback);
        return () => this.removeEventListener(event, callback);
    }

    /**
     * Debug: Export state
     */
    exportState() {
        return JSON.stringify({
            state: this.state,
            history: this.history
        }, null, 2);
    }

    /**
     * Debug: Reset to defaults
     */
    reset() {
        const defaultState = new AppState().state;
        this.setState(defaultState);
        this.history = [];
        this.dispatchEvent(new CustomEvent('state:reset'));
    }
}

// Create and export singleton instance
export const appState = new AppState();

// Make available globally for debugging
if (typeof window !== 'undefined') {
    window.appState = appState;
}
