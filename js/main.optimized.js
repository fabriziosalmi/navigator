/**
 * main.js (OPTIMIZED)
 * 
 * REFACTOR: Complete architectural overhaul with centralized state management
 * OPTIMIZATION: Read-Update-Render loop, batch processing, zero CustomEvents
 * 
 * Main application orchestrator implementing all performance best practices:
 * - Centralized AppStateManager for predictable state
 * - Separated animation loop phases (Read-Update-Render)
 * - GPU offloading with instanced rendering
 * - One-Euro Filter for smooth gestures
 * - Batch DOM/data updates
 * - Critically-damped spring camera
 * - Memory management and cleanup
 */

import AppStateManager from './AppStateManager.js';
import SceneManager from './SceneManager.optimized.js';
import GestureController from './GestureController.optimized.js';
import CardManager from './CardManager.js';
import DataStream from './DataStream.optimized.js';
import * as THREE from 'three';

class AetheriumCortexOptimized {
    constructor() {
        // REFACTOR: Centralized state management
        this.appState = new AppStateManager();
        
        // Core components (all receive appState reference)
        this.sceneManager = null;
        this.gestureController = null;
        this.cardManager = null;
        this.dataStream = null;
        
        // UI elements
        this.statusElement = document.getElementById('status');
        this.fpsDisplay = this.createFPSDisplay();
        
        // OPTIMIZATION: Performance monitoring
        this.performanceMonitor = {
            frameCount: 0,
            lastTime: performance.now(),
            fps: 60,
            frameTime: 16.67
        };
    }
    
    /**
     * Initialize the application
     */
    async init() {
        try {
            this.updateStatus('Initializing optimized system...', false);
            
            // REFACTOR: Initialize SceneManager with appState
            this.sceneManager = new SceneManager('canvas-container', this.appState);
            
            // OPTIMIZATION: Setup instanced rendering for cards (if > 10 cards)
            const NUM_CARDS = 8;
            if (NUM_CARDS > 10) {
                this.sceneManager.setupInstancedCards(NUM_CARDS);
            }
            
            // REFACTOR: Initialize CardManager
            this.cardManager = new CardManager(this.sceneManager, this.appState);
            
            // Create cards
            this.createCards(NUM_CARDS);
            
            // REFACTOR: Initialize GestureController with appState
            this.updateStatus('Requesting camera access...', false);
            this.gestureController = new GestureController(this.appState);
            const gestureReady = await this.gestureController.init();
            
            if (!gestureReady) {
                throw new Error('Failed to initialize gesture controller');
            }
            
            // REFACTOR: Initialize DataStream with direct CardManager reference
            this.dataStream = new DataStream(this.cardManager, this.appState, 3000);
            this.dataStream.start();
            
            // REFACTOR: Setup separated update callbacks
            this.setupUpdateCallbacks();
            
            // REFACTOR: Setup state observers (replaces CustomEvent listeners)
            this.setupStateObservers();
            
            // Setup keyboard shortcuts
            this.setupKeyboardControls();
            
            this.updateStatus('Optimized system ready!', true);
            
            // Enable debug mode (optional)
            if (window.location.search.includes('debug')) {
                this.appState.enableDebugMode();
                console.log('Debug mode enabled');
            }
            
            console.log('Aetherium Cortex Optimized initialized successfully');
            console.log('Performance features:');
            console.log('  ✓ Centralized state management');
            console.log('  ✓ Read-Update-Render loop');
            console.log('  ✓ Critically-damped spring camera');
            console.log('  ✓ One-Euro Filter gesture smoothing');
            console.log('  ✓ Batch DOM updates');
            console.log('  ✓ Batch data updates');
            console.log('  ✓ Optimized raycasting');
            console.log('  ✓ Memory management');
            
        } catch (error) {
            console.error('Initialization error:', error);
            this.updateStatus(`Error: ${error.message}`, false, true);
        }
    }
    
    /**
     * Create cards with efficient positioning
     */
    createCards(numCards) {
        const cardTitles = [
            'Neural Node Alpha',
            'Data Stream Beta',
            'Sensor Gamma',
            'Network Delta',
            'Cache Epsilon',
            'API Zeta',
            'Module Eta',
            'System Theta'
        ];
        
        // Arrange cards in a grid
        const rows = 2;
        const cols = Math.ceil(numCards / rows);
        const spacing = 4;
        const offsetX = -(cols - 1) * spacing / 2;
        const offsetY = -(rows - 1) * spacing / 2;
        
        for (let i = 0; i < numCards; i++) {
            const row = Math.floor(i / cols);
            const col = i % cols;
            
            const x = offsetX + col * spacing;
            const y = offsetY + row * spacing;
            const z = 0;
            
            this.cardManager.createCard(
                cardTitles[i] || `Card ${i}`,
                Math.random() * 50,
                { x, y, z }
            );
        }
        
        console.log(`Created ${numCards} cards (optimized)`);
    }
    
    /**
     * REFACTOR: Setup separated Read-Update-Render callbacks
     * Prevents layout thrashing by batching operations
     */
    setupUpdateCallbacks() {
        // ============================================================
        // PHASE 1: READ - Gather all inputs and DOM reads
        // ============================================================
        this.sceneManager.addReadCallback((deltaTime, elapsedTime) => {
            // Read gesture inputs (already handled by GestureController)
            // Read any other DOM properties needed
        });
        
        // ============================================================
        // PHASE 2: UPDATE - All game logic and state changes
        // ============================================================
        this.sceneManager.addUpdateCallback((deltaTime, elapsedTime) => {
            // Update performance monitoring
            this.updatePerformanceMonitor(deltaTime);
            
            // Perform raycasting (only when needed based on gesture state)
            this.performOptimizedRaycasting();
            
            // Update grabbed card position
            this.updateGrabbedCard();
            
            // Update cards (animations, floating effects)
            this.cardManager.update(deltaTime, elapsedTime);
            
            // Handle panning gesture
            this.handlePanning(deltaTime);
            
            // OPTIMIZATION: Flush batched data updates from appState
            const pendingUpdates = this.appState.flushDataUpdates();
            if (pendingUpdates.length > 0) {
                // Already handled by DataStream -> CardManager direct call
            }
        });
        
        // ============================================================
        // PHASE 3: RENDER - All DOM writes and visual updates
        // ============================================================
        this.sceneManager.addRenderCallback((deltaTime, elapsedTime) => {
            // Batch DOM updates (already handled in CardManager.update)
            
            // Update FPS display
            this.updateFPSDisplay();
        });
    }
    
    /**
     * REFACTOR: Setup state observers (replaces CustomEvent system)
     * More efficient for high-frequency updates
     */
    setupStateObservers() {
        this.appState.addObserver((path, value, state) => {
            // React to specific state changes
            
            if (path === 'cards.highlighted') {
                // Clear previous highlight
                if (value.previous !== null) {
                    this.cardManager.setCardHighlighted(value.previous, false);
                }
                // Set new highlight
                if (value.cardId !== null) {
                    this.cardManager.setCardHighlighted(value.cardId, true);
                }
            }
            
            if (path === 'cards.grabbed') {
                // Update grabbed card visual state
                if (value !== null) {
                    this.cardManager.setCardGrabbed(value, true);
                    console.log(`Grabbed card ${value}`);
                } else {
                    // Released
                    const prevGrabbed = state.cards.grabbed;
                    if (prevGrabbed !== null) {
                        this.cardManager.setCardGrabbed(prevGrabbed, false);
                        console.log(`Released card`);
                    }
                }
            }
            
            if (path === 'gesture.state') {
                console.log(`Gesture state: ${value}`);
            }
        });
    }
    
    /**
     * OPTIMIZATION: Raycasting only when gesture state allows
     */
    performOptimizedRaycasting() {
        const gestureState = this.appState.getGestureState();
        
        // Only raycast when it makes sense
        if (gestureState !== 'IDLE' && 
            gestureState !== 'PRE_GRAB' && 
            gestureState !== 'POINTING') {
            return;
        }
        
        const cursor = this.appState.getCursorPosition();
        
        // Convert to normalized device coordinates
        const x = (cursor.x * 2) - 1;
        const y = -(cursor.y * 2) + 1;
        
        // OPTIMIZATION: Use CardManager's optimized raycasting
        const hitCardId = this.cardManager.raycastCards(x, y);
        
        // Update highlighted card in state
        this.appState.setHighlightedCard(hitCardId);
    }
    
    /**
     * Handle panning gesture
     */
    handlePanning(deltaTime) {
        const gestureState = this.appState.getGestureState();
        
        if (gestureState === 'PANNING') {
            // Get cursor velocity (would need to track previous position)
            // For now, use a simple implementation
            // In production, this would use velocity from gesture tracking
            
            // Example: Pan based on cursor position deviation from center
            const cursor = this.appState.getCursorPosition();
            const dx = (cursor.x - 0.5) * deltaTime * 10;
            const dy = (cursor.y - 0.5) * deltaTime * 10;
            
            this.sceneManager.panCamera(dx, dy);
        }
    }
    
    /**
     * Update grabbed card position to follow cursor
     */
    updateGrabbedCard() {
        const grabbedCardId = this.appState.getGrabbedCard();
        if (grabbedCardId === null) return;
        
        const cursor = this.appState.getCursorPosition();
        const camera = this.sceneManager.getCamera();
        
        // Convert screen space to world space (simplified)
        const x = (cursor.x - 0.5) * 20;
        const y = -(cursor.y - 0.5) * 15;
        const z = 0;
        
        this.cardManager.updateCardPosition(grabbedCardId, x, y, z);
    }
    
    /**
     * Setup keyboard controls
     */
    setupKeyboardControls() {
        window.addEventListener('keydown', (event) => {
            if (event.key === 'd') {
                // Toggle debug mode
                if (this.appState._debugMode) {
                    console.log('Debug mode disabled');
                    this.appState._debugMode = false;
                } else {
                    this.appState.enableDebugMode();
                }
            }
            
            if (event.key === 's') {
                // Show state
                console.log('Current state:', this.appState.getState());
                console.log('State diff:', this.appState.getStateDiff());
            }
            
            if (event.key === 'p') {
                // Performance stats
                console.log('Performance:');
                console.log(`  FPS: ${this.performanceMonitor.fps.toFixed(1)}`);
                console.log(`  Frame time: ${this.performanceMonitor.frameTime.toFixed(2)}ms`);
                console.log(`  Cards: ${this.cardManager.getCardCount()}`);
                console.log('DataStream:', this.dataStream.getStatus());
            }
            
            if (event.key === 'r') {
                // Reset camera
                this.sceneManager.setCameraTarget(0, 0, 0);
            }
            
            if (event.key === 'm') {
                // Show mutation log
                console.log('Mutation log:', this.appState.getMutationLog());
            }
        });
        
        console.log('Keyboard controls registered (d=debug, s=state, p=performance, r=reset, m=mutations)');
    }
    
    /**
     * OPTIMIZATION: Performance monitoring
     */
    updatePerformanceMonitor(deltaTime) {
        this.performanceMonitor.frameCount++;
        this.performanceMonitor.frameTime = deltaTime * 1000;
        
        const now = performance.now();
        const elapsed = (now - this.performanceMonitor.lastTime) / 1000;
        
        if (elapsed >= 1.0) {
            this.performanceMonitor.fps = this.performanceMonitor.frameCount / elapsed;
            this.performanceMonitor.frameCount = 0;
            this.performanceMonitor.lastTime = now;
        }
    }
    
    /**
     * Create FPS display element
     */
    createFPSDisplay() {
        const fps = document.createElement('div');
        fps.id = 'fps-display';
        fps.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            background: rgba(0, 0, 0, 0.7);
            color: #0f0;
            padding: 5px 10px;
            font-family: monospace;
            font-size: 14px;
            border-radius: 4px;
            z-index: 10000;
        `;
        document.body.appendChild(fps);
        return fps;
    }
    
    /**
     * Update FPS display
     */
    updateFPSDisplay() {
        if (!this.fpsDisplay) return;
        
        const fps = this.performanceMonitor.fps;
        const frameTime = this.performanceMonitor.frameTime;
        
        // Color code based on performance
        let color = '#0f0'; // Green (good)
        if (fps < 30) color = '#f00'; // Red (bad)
        else if (fps < 50) color = '#ff0'; // Yellow (ok)
        
        this.fpsDisplay.style.color = color;
        this.fpsDisplay.textContent = `${fps.toFixed(1)} FPS (${frameTime.toFixed(2)}ms)`;
    }
    
    /**
     * Update status message
     */
    updateStatus(message, success = true, error = false) {
        if (!this.statusElement) return;
        
        this.statusElement.textContent = message;
        this.statusElement.className = error ? 'error' : (success ? 'success' : '');
    }
    
    /**
     * MEMORY: Cleanup all resources
     */
    dispose() {
        console.log('Disposing application...');
        
        if (this.dataStream) {
            this.dataStream.dispose();
        }
        
        if (this.cardManager) {
            this.cardManager.dispose();
        }
        
        if (this.gestureController) {
            this.gestureController.dispose();
        }
        
        if (this.sceneManager) {
            this.sceneManager.dispose();
        }
        
        if (this.fpsDisplay) {
            this.fpsDisplay.remove();
        }
        
        console.log('Application disposed');
    }
}

// ============================================================
// APPLICATION ENTRY POINT
// ============================================================

// Initialize application when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        const app = new AetheriumCortexOptimized();
        app.init();
        
        // Expose to window for debugging
        window.app = app;
    });
} else {
    const app = new AetheriumCortexOptimized();
    app.init();
    window.app = app;
}

export default AetheriumCortexOptimized;
