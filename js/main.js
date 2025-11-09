/**
 * main.js
 * 
 * Main application orchestrator for Aetherium Cortex Lite.
 * Initializes all components, creates cards, and handles event-driven interactions.
 */

import { SceneManager } from './SceneManager.js';
import { Card } from './Card.js';
import { DataStream } from './DataStream.js';
import { GestureController } from './GestureController.js';
import * as THREE from 'three';

class AetheriumCortexLite {
    constructor() {
        // Core components
        this.sceneManager = null;
        this.gestureController = null;
        this.dataStream = null;
        
        // Cards
        this.cards = [];
        this.numCards = 8;
        
        // Raycasting for card selection
        this.raycaster = new THREE.Raycaster();
        this.mousePosition = new THREE.Vector2();
        
        // Selection state
        this.selectedCard = null;
        this.grabbedCard = null;
        
        // UI elements
        this.statusElement = document.getElementById('status');
        this.instructionsElement = document.getElementById('instructions');
    }
    
    /**
     * Initialize the application
     */
    async init() {
        try {
            this.updateStatus('Initializing scene...', false);
            
            // Initialize scene manager
            this.sceneManager = new SceneManager();
            
            // Create cards
            this.createCards();
            
            // Initialize gesture controller
            this.updateStatus('Requesting camera access...', false);
            this.gestureController = new GestureController();
            const gestureReady = await this.gestureController.init();
            
            if (!gestureReady) {
                throw new Error('Failed to initialize gesture controller');
            }
            
            // Initialize data stream
            this.dataStream = new DataStream(this.numCards, 3000);
            this.dataStream.start();
            
            // Setup event listeners
            this.setupEventListeners();
            
            // Register update callback
            this.sceneManager.addUpdateCallback((deltaTime, elapsedTime) => {
                this.update(deltaTime, elapsedTime);
            });
            
            this.updateStatus('Ready! Wave your hand to begin.', true);
            
            // Fade out instructions after 10 seconds
            setTimeout(() => {
                this.instructionsElement.classList.add('fade-out');
            }, 10000);
            
            console.log('Aetherium Cortex Lite initialized successfully');
            
        } catch (error) {
            console.error('Initialization error:', error);
            this.updateStatus(`Error: ${error.message}`, false, true);
        }
    }
    
    /**
     * Create and position cards in the scene
     */
    createCards() {
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
        const cols = Math.ceil(this.numCards / rows);
        const spacing = 4;
        const offsetX = -(cols - 1) * spacing / 2;
        const offsetY = -(rows - 1) * spacing / 2;
        
        for (let i = 0; i < this.numCards; i++) {
            const row = Math.floor(i / cols);
            const col = i % cols;
            
            const x = offsetX + col * spacing;
            const y = offsetY + row * spacing;
            const z = 0;
            
            const card = new Card(i, cardTitles[i] || `Card ${i}`, Math.random() * 50);
            card.setPosition(x, y, z);
            
            this.sceneManager.getScene().add(card.getGroup());
            this.cards.push(card);
        }
        
        console.log(`Created ${this.numCards} cards`);
    }
    
    /**
     * Setup event listeners for gesture events and data updates
     */
    setupEventListeners() {
        // Data stream events
        window.addEventListener('newData', (event) => {
            const { cardId, value, lastTrigger } = event.detail;
            if (this.cards[cardId]) {
                this.cards[cardId].updateData({ value, lastTrigger });
            }
        });
        
        // Gesture events - Pan
        window.addEventListener('pan', (event) => {
            const { dx, dy } = event.detail;
            this.sceneManager.panCamera(dx, dy);
        });
        
        // Gesture events - Cursor movement
        window.addEventListener('cursorMove', (event) => {
            const { x, y } = event.detail;
            // Convert to normalized device coordinates (-1 to +1)
            this.mousePosition.x = (x * 2) - 1;
            this.mousePosition.y = -(y * 2) + 1;
        });
        
        // Gesture events - Pinch (grab card)
        window.addEventListener('pinchStart', (event) => {
            if (this.selectedCard) {
                this.grabbedCard = this.selectedCard;
                this.grabbedCard.setGrabbed(true);
                console.log(`Grabbed card ${this.grabbedCard.id}`);
            }
        });
        
        window.addEventListener('pinchEnd', (event) => {
            if (this.grabbedCard) {
                this.grabbedCard.setGrabbed(false);
                console.log(`Released card ${this.grabbedCard.id}`);
                this.grabbedCard = null;
            }
        });
        
        // Gesture events - Fist (could be used for other interactions)
        window.addEventListener('fistStart', (event) => {
            console.log('Fist gesture detected');
        });
        
        window.addEventListener('fistEnd', (event) => {
            console.log('Fist gesture released');
        });
        
        // Keyboard shortcuts for debugging
        window.addEventListener('keydown', (event) => {
            if (event.key === 'd') {
                document.body.classList.toggle('debug');
                console.log('Debug mode toggled');
            }
            if (event.key === 'r') {
                this.resetCameraPosition();
            }
            if (event.key === 's') {
                console.log('Stream status:', this.dataStream.getStatus());
            }
        });
        
        console.log('Event listeners registered');
    }
    
    /**
     * Main update loop
     * @param {number} deltaTime
     * @param {number} elapsedTime
     */
    update(deltaTime, elapsedTime) {
        const camera = this.sceneManager.getCamera();
        
        // Update all cards
        this.cards.forEach(card => {
            card.update(deltaTime, elapsedTime, camera);
        });
        
        // Perform raycasting to detect card hover
        this.performRaycasting();
        
        // Update grabbed card position
        if (this.grabbedCard && this.gestureController.getCursorPosition()) {
            this.updateGrabbedCardPosition();
        }
    }
    
    /**
     * Perform raycasting to detect which card the cursor is pointing at
     */
    performRaycasting() {
        // Update raycaster with cursor position
        this.raycaster.setFromCamera(this.mousePosition, this.sceneManager.getCamera());
        
        // Get all card meshes
        const cardMeshes = this.cards.map(card => card.getMesh());
        
        // Check for intersections
        const intersects = this.raycaster.intersectObjects(cardMeshes, false);
        
        // Clear previous selection
        if (this.selectedCard && !this.grabbedCard) {
            this.selectedCard.setHighlighted(false);
            this.selectedCard = null;
        }
        
        // Set new selection
        if (intersects.length > 0) {
            const intersectedMesh = intersects[0].object;
            const card = intersectedMesh.userData.card;
            
            if (card && card !== this.grabbedCard) {
                this.selectedCard = card;
                this.selectedCard.setHighlighted(true);
            }
        }
    }
    
    /**
     * Update the position of a grabbed card to follow the cursor
     */
    updateGrabbedCardPosition() {
        const cursorPos = this.gestureController.getCursorPosition();
        if (!cursorPos) return;
        
        // Convert normalized cursor position to world coordinates
        // Keep the card at its current Z depth
        const vector = new THREE.Vector3(
            (cursorPos.x * 2) - 1,
            -(cursorPos.y * 2) + 1,
            0.5
        );
        
        vector.unproject(this.sceneManager.getCamera());
        
        const dir = vector.sub(this.sceneManager.getCamera().position).normalize();
        const distance = this.grabbedCard.getGroup().position.z;
        const pos = this.sceneManager.getCamera().position.clone().add(
            dir.multiplyScalar(
                Math.abs(distance - this.sceneManager.getCamera().position.z)
            )
        );
        
        // Smooth movement
        const currentPos = this.grabbedCard.getGroup().position;
        currentPos.lerp(pos, 0.1);
    }
    
    /**
     * Reset camera to initial position
     */
    resetCameraPosition() {
        this.sceneManager.cameraPosition.set(0, 0, 15);
        this.sceneManager.cameraVelocity.set(0, 0, 0);
        console.log('Camera position reset');
    }
    
    /**
     * Update status message
     * @param {string} message
     * @param {boolean} ready
     * @param {boolean} error
     */
    updateStatus(message, ready = false, error = false) {
        this.statusElement.textContent = message;
        this.statusElement.classList.remove('ready', 'error');
        
        if (ready) {
            this.statusElement.classList.add('ready');
        }
        if (error) {
            this.statusElement.classList.add('error');
        }
    }
}

// Initialize application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const app = new AetheriumCortexLite();
    app.init();
    
    // Make app accessible globally for debugging
    window.app = app;
});
