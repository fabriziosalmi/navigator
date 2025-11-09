/**
 * CardManager.js (NEW - OPTIMIZED)
 * 
 * REFACTOR: Decouples Card data model from rendering
 * OPTIMIZATION: Batch DOM updates, efficient raycasting, minimal CSS transforms
 * 
 * Manages all card operations with maximum performance:
 * - Single responsibility: card lifecycle and updates
 * - Batch processing to minimize browser reflows
 * - Smart dirty tracking for selective updates
 */

import * as THREE from 'three';

export class CardManager {
    constructor(sceneManager, appState) {
        this.sceneManager = sceneManager;
        this.appState = appState;
        
        // Card storage
        this.cards = new Map(); // cardId -> Card data
        this.nextId = 0;
        
        // OPTIMIZATION: Raycasting objects (reused to prevent allocations)
        this.raycaster = new THREE.Raycaster();
        this.rayDirection = new THREE.Vector2();
        
        // OPTIMIZATION: DOM update batching
        this.domUpdateQueue = new Set();
        this.lastDOMUpdate = 0;
        this.domUpdateInterval = 16; // Update DOM max 60fps
        
        // OPTIMIZATION: Simplified raycasting mesh (invisible bounding volumes)
        this.raycastMeshes = [];
        
        // Card overlay container
        this.overlayContainer = document.getElementById('card-overlays');
        if (!this.overlayContainer) {
            this.overlayContainer = document.createElement('div');
            this.overlayContainer.id = 'card-overlays';
            this.overlayContainer.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                pointer-events: none;
                z-index: 100;
            `;
            document.body.appendChild(this.overlayContainer);
        }
        
        console.log('CardManager initialized');
    }
    
    // ============================================================
    // CARD LIFECYCLE
    // ============================================================
    
    /**
     * Create a new card
     * @param {string} title
     * @param {number} initialValue
     * @param {Object} position - {x, y, z}
     * @returns {number} Card ID
     */
    createCard(title, initialValue = 0, position = { x: 0, y: 0, z: 0 }) {
        const id = this.nextId++;
        
        const cardData = {
            id,
            title,
            value: initialValue,
            lastTrigger: 'Init',
            position: new THREE.Vector3(position.x, position.y, position.z),
            rotation: new THREE.Quaternion(),
            scale: new THREE.Vector3(1, 1, 1),
            highlighted: false,
            grabbed: false,
            visible: true,
            lodLevel: 'HIGH' // HIGH, MEDIUM, LOW, CULLED
        };
        
        this.cards.set(id, cardData);
        
        // Create HTML overlay
        this.createHTMLOverlay(cardData);
        
        // OPTIMIZATION: Use instance index for rendering (if instanced mesh is enabled)
        if (this.sceneManager.instancedMesh) {
            this.sceneManager.updateInstanceTransform(
                id,
                cardData.position,
                cardData.rotation,
                cardData.scale
            );
        } else {
            // Fallback: create individual mesh
            this.createIndividualMesh(cardData);
        }
        
        // Create simplified raycast mesh
        this.createRaycastMesh(cardData);
        
        // Update appState
        this.appState.cards.total++;
        this.appState.setCardVisible(id, true);
        
        console.log(`Card ${id} created: ${title}`);
        return id;
    }
    
    /**
     * OPTIMIZATION: Create simplified mesh for raycasting only
     * Faster than raycasting detailed geometry
     */
    createRaycastMesh(cardData) {
        const geometry = new THREE.PlaneGeometry(2.5, 3);
        const material = new THREE.MeshBasicMaterial({ 
            visible: false, // Invisible but still raycastable
            side: THREE.DoubleSide
        });
        
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.copy(cardData.position);
        mesh.userData.cardId = cardData.id;
        
        this.sceneManager.getScene().add(mesh);
        this.raycastMeshes.push(mesh);
    }
    
    /**
     * Fallback: Create individual mesh if instancing is not available
     */
    createIndividualMesh(cardData) {
        const geometry = new THREE.PlaneGeometry(2.5, 3);
        const material = new THREE.MeshStandardMaterial({
            color: 0x1a1a2e,
            emissive: 0x0a0a1a,
            side: THREE.DoubleSide,
            metalness: 0.3,
            roughness: 0.7
        });
        
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.copy(cardData.position);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        mesh.userData.cardId = cardData.id;
        
        cardData.mesh = mesh;
        this.sceneManager.getScene().add(mesh);
    }
    
    /**
     * REFACTOR: Create HTML overlay (detached from Three.js mesh)
     */
    createHTMLOverlay(cardData) {
        const overlay = document.createElement('div');
        overlay.className = 'card-overlay';
        overlay.dataset.cardId = cardData.id;
        overlay.innerHTML = `
            <div class="card-id">Card #${cardData.id}</div>
            <div class="card-title">${cardData.title}</div>
            <div class="card-value">${cardData.value.toFixed(2)}</div>
            <div class="card-trigger">Trigger: ${cardData.lastTrigger}</div>
        `;
        
        // OPTIMIZATION: Initially position off-screen to prevent flash
        overlay.style.cssText = `
            position: absolute;
            transform: translate(-9999px, -9999px);
        `;
        
        cardData.htmlElement = overlay;
        this.overlayContainer.appendChild(overlay);
    }
    
    /**
     * Delete a card and clean up resources
     */
    deleteCard(id) {
        const cardData = this.cards.get(id);
        if (!cardData) return;
        
        // MEMORY: Remove HTML overlay
        if (cardData.htmlElement) {
            cardData.htmlElement.remove();
        }
        
        // MEMORY: Remove individual mesh if exists
        if (cardData.mesh) {
            cardData.mesh.geometry.dispose();
            cardData.mesh.material.dispose();
            this.sceneManager.getScene().remove(cardData.mesh);
        }
        
        // MEMORY: Remove raycast mesh
        const raycastMesh = this.raycastMeshes.find(m => m.userData.cardId === id);
        if (raycastMesh) {
            raycastMesh.geometry.dispose();
            raycastMesh.material.dispose();
            this.sceneManager.getScene().remove(raycastMesh);
            this.raycastMeshes = this.raycastMeshes.filter(m => m !== raycastMesh);
        }
        
        this.cards.delete(id);
        this.appState.cards.total--;
        
        console.log(`Card ${id} deleted`);
    }
    
    // ============================================================
    // CARD UPDATES
    // ============================================================
    
    /**
     * OPTIMIZATION: Update card data (batched)
     * @param {number} id
     * @param {Object} newData - { value, lastTrigger }
     */
    updateCardData(id, newData) {
        const cardData = this.cards.get(id);
        if (!cardData) return;
        
        let changed = false;
        
        if (newData.value !== undefined && newData.value !== cardData.value) {
            cardData.value = newData.value;
            changed = true;
        }
        
        if (newData.lastTrigger !== undefined && newData.lastTrigger !== cardData.lastTrigger) {
            cardData.lastTrigger = newData.lastTrigger;
            changed = true;
        }
        
        if (changed) {
            // Mark card as dirty for DOM update
            this.appState.markCardDirty(id);
            this.domUpdateQueue.add(id);
        }
    }
    
    /**
     * OPTIMIZATION: Batch update multiple cards at once
     * @param {Array} updates - Array of { cardId, data }
     */
    batchUpdateCards(updates) {
        updates.forEach(({ cardId, data }) => {
            this.updateCardData(cardId, data);
        });
    }
    
    /**
     * Update card position
     */
    updateCardPosition(id, x, y, z) {
        const cardData = this.cards.get(id);
        if (!cardData) return;
        
        cardData.position.set(x, y, z);
        
        // Update instance transform or individual mesh
        if (this.sceneManager.instancedMesh) {
            this.sceneManager.updateInstanceTransform(
                id,
                cardData.position,
                cardData.rotation,
                cardData.scale
            );
        } else if (cardData.mesh) {
            cardData.mesh.position.copy(cardData.position);
        }
        
        // Update raycast mesh
        const raycastMesh = this.raycastMeshes.find(m => m.userData.cardId === id);
        if (raycastMesh) {
            raycastMesh.position.copy(cardData.position);
        }
        
        // Mark for DOM update
        this.domUpdateQueue.add(id);
    }
    
    /**
     * Set card highlighted state
     */
    setCardHighlighted(id, highlighted) {
        const cardData = this.cards.get(id);
        if (!cardData) return;
        
        if (cardData.highlighted !== highlighted) {
            cardData.highlighted = highlighted;
            this.domUpdateQueue.add(id);
            
            // Visual feedback (could add glow effect)
            if (cardData.htmlElement) {
                cardData.htmlElement.classList.toggle('highlighted', highlighted);
            }
        }
    }
    
    /**
     * Set card grabbed state
     */
    setCardGrabbed(id, grabbed) {
        const cardData = this.cards.get(id);
        if (!cardData) return;
        
        if (cardData.grabbed !== grabbed) {
            cardData.grabbed = grabbed;
            this.domUpdateQueue.add(id);
            
            if (cardData.htmlElement) {
                cardData.htmlElement.classList.toggle('grabbed', grabbed);
            }
        }
    }
    
    // ============================================================
    // RAYCASTING (OPTIMIZED)
    // ============================================================
    
    /**
     * OPTIMIZATION: Perform raycasting only when needed
     * Uses simplified invisible meshes for faster intersection tests
     * 
     * @param {number} x - Normalized X (-1 to 1)
     * @param {number} y - Normalized Y (-1 to 1)
     * @returns {number|null} Card ID or null
     */
    raycastCards(x, y) {
        // OPTIMIZATION: Only raycast when gesture allows interaction
        const gestureState = this.appState.getGestureState();
        if (gestureState !== 'IDLE' && gestureState !== 'PRE_GRAB' && gestureState !== 'POINTING') {
            return null;
        }
        
        this.rayDirection.set(x, y);
        this.raycaster.setFromCamera(this.rayDirection, this.sceneManager.getCamera());
        
        // OPTIMIZATION: Raycast against simplified meshes only
        const intersects = this.raycaster.intersectObjects(this.raycastMeshes, false);
        
        if (intersects.length > 0) {
            return intersects[0].object.userData.cardId;
        }
        
        return null;
    }
    
    // ============================================================
    // DOM UPDATE BATCHING (CRITICAL OPTIMIZATION)
    // ============================================================
    
    /**
     * OPTIMIZATION: Batch update HTML overlays to minimize reflows
     * Called once per frame or when batch threshold is reached
     */
    updateDOMBatch() {
        const now = performance.now();
        
        // OPTIMIZATION: Throttle DOM updates to max 60fps
        if (now - this.lastDOMUpdate < this.domUpdateInterval && this.domUpdateQueue.size < 10) {
            return;
        }
        
        if (this.domUpdateQueue.size === 0) return;
        
        const camera = this.sceneManager.getCamera();
        const tempVector = new THREE.Vector3();
        
        // OPTIMIZATION: Batch all DOM reads first, then writes (prevent layout thrashing)
        const updates = [];
        
        this.domUpdateQueue.forEach(id => {
            const cardData = this.cards.get(id);
            if (!cardData || !cardData.visible) return;
            
            // Project 3D position to screen space
            tempVector.copy(cardData.position);
            tempVector.project(camera);
            
            const x = (tempVector.x * 0.5 + 0.5) * window.innerWidth;
            const y = (-tempVector.y * 0.5 + 0.5) * window.innerHeight;
            const z = tempVector.z;
            
            updates.push({ id, x, y, z, cardData });
        });
        
        // OPTIMIZATION: Batch all DOM writes
        updates.forEach(({ id, x, y, z, cardData }) => {
            const overlay = cardData.htmlElement;
            if (!overlay) return;
            
            // Update position
            overlay.style.transform = `translate(${x}px, ${y}px)`;
            
            // Update depth (z-index based on camera distance)
            overlay.style.zIndex = Math.floor((1 - z) * 1000);
            
            // Update content if data changed
            if (this.appState.getDirtyCards().has(id)) {
                const valueEl = overlay.querySelector('.card-value');
                const triggerEl = overlay.querySelector('.card-trigger');
                
                if (valueEl) valueEl.textContent = cardData.value.toFixed(2);
                if (triggerEl) triggerEl.textContent = `Trigger: ${cardData.lastTrigger}`;
            }
        });
        
        this.domUpdateQueue.clear();
        this.appState.clearDirtyCards();
        this.lastDOMUpdate = now;
    }
    
    // ============================================================
    // FRAME UPDATE
    // ============================================================
    
    /**
     * REFACTOR: Main update function (called in UPDATE phase)
     * @param {number} deltaTime
     * @param {number} elapsedTime
     */
    update(deltaTime, elapsedTime) {
        // Update card animations (floating, pulsing, etc.)
        this.cards.forEach((cardData, id) => {
            if (!cardData.visible) return;
            
            // Example: floating animation
            const floatOffset = Math.sin(elapsedTime * 0.5 + id) * 0.1;
            cardData.position.y += floatOffset * deltaTime;
            
            // Update instance transform if using instancing
            if (this.sceneManager.instancedMesh) {
                this.sceneManager.updateInstanceTransform(
                    id,
                    cardData.position,
                    cardData.rotation,
                    cardData.scale
                );
            } else if (cardData.mesh) {
                cardData.mesh.position.copy(cardData.position);
            }
            
            // Mark for DOM update
            this.domUpdateQueue.add(id);
        });
        
        // Batch update DOM
        this.updateDOMBatch();
    }
    
    // ============================================================
    // GETTERS
    // ============================================================
    
    getCard(id) {
        return this.cards.get(id);
    }
    
    getAllCards() {
        return Array.from(this.cards.values());
    }
    
    getCardCount() {
        return this.cards.size;
    }
    
    /**
     * MEMORY: Dispose all cards
     */
    dispose() {
        this.cards.forEach((_, id) => this.deleteCard(id));
        this.cards.clear();
        this.raycastMeshes = [];
        
        console.log('CardManager disposed');
    }
}

export default CardManager;
