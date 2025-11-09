/**
 * Card.js
 * 
 * Represents a single data card in the 3D space.
 * Combines a Three.js mesh for 3D positioning with an HTML overlay for content display.
 */

import * as THREE from 'three';

export class Card {
    constructor(id, title, initialValue = 0) {
        this.id = id;
        this.title = title;
        this.value = initialValue;
        this.lastTrigger = 'Init';
        
        // Three.js components
        this.group = new THREE.Group();
        this.mesh = null;
        
        // HTML overlay element
        this.htmlElement = null;
        
        // State
        this.highlighted = false;
        this.grabbed = false;
        this.baseScale = 1.0;
        this.currentScale = 1.0;
        this.targetScale = 1.0;
        
        // Animation
        this.floatOffset = Math.random() * Math.PI * 2; // Random phase for floating
        this.floatSpeed = 0.5 + Math.random() * 0.5; // Random speed
        this.floatAmplitude = 0.1;
        
        this.init();
    }
    
    /**
     * Initialize the card's 3D mesh and HTML overlay
     */
    init() {
        // Create card mesh (plane geometry)
        const geometry = new THREE.PlaneGeometry(2.5, 3);
        const material = new THREE.MeshStandardMaterial({
            color: 0x1a1a2e,
            emissive: 0x0a0a1a,
            side: THREE.DoubleSide,
            metalness: 0.3,
            roughness: 0.7
        });
        
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;
        
        // Store reference to this card on the mesh for raycasting
        this.mesh.userData.card = this;
        
        // Add glow outline
        const outlineGeometry = new THREE.PlaneGeometry(2.6, 3.1);
        const outlineMaterial = new THREE.MeshBasicMaterial({
            color: 0x00ffff,
            transparent: true,
            opacity: 0.0,
            side: THREE.DoubleSide
        });
        this.outline = new THREE.Mesh(outlineGeometry, outlineMaterial);
        this.outline.position.z = -0.01;
        
        // Add mesh and outline to group
        this.group.add(this.mesh);
        this.group.add(this.outline);
        
        // Create HTML overlay
        this.createHTMLOverlay();
        
        console.log(`Card ${this.id} initialized`);
    }
    
    /**
     * Create the HTML overlay element for displaying card data
     */
    createHTMLOverlay() {
        const overlay = document.createElement('div');
        overlay.className = 'card-overlay';
        overlay.innerHTML = `
            <div class="card-id">Card #${this.id}</div>
            <div class="card-title">${this.title}</div>
            <div class="card-value">${this.value.toFixed(2)}</div>
            <div class="card-trigger">Trigger: ${this.lastTrigger}</div>
        `;
        
        this.htmlElement = overlay;
        
        // Add to overlay container
        const container = document.getElementById('card-overlays');
        if (container) {
            container.appendChild(overlay);
        }
    }
    
    /**
     * Set the 3D position of the card
     * @param {number} x
     * @param {number} y
     * @param {number} z
     */
    setPosition(x, y, z) {
        this.group.position.set(x, y, z);
    }
    
    /**
     * Update the card's data and refresh the HTML overlay
     * @param {Object} newData - Object containing value and/or lastTrigger
     */
    updateData(newData) {
        if (newData.value !== undefined) {
            this.value = newData.value;
        }
        if (newData.lastTrigger !== undefined) {
            this.lastTrigger = newData.lastTrigger;
        }
        
        // Update HTML content
        const valueElement = this.htmlElement.querySelector('.card-value');
        const triggerElement = this.htmlElement.querySelector('.card-trigger');
        
        if (valueElement) {
            valueElement.textContent = this.value.toFixed(2);
        }
        if (triggerElement) {
            triggerElement.textContent = `Trigger: ${this.lastTrigger}`;
        }
        
        // Add flash animation
        this.htmlElement.classList.add('updating');
        setTimeout(() => {
            this.htmlElement.classList.remove('updating');
        }, 600);
        
        // Pulse the 3D card
        this.targetScale = 1.2;
    }
    
    /**
     * Set the highlighted state
     * @param {boolean} isHighlighted
     */
    setHighlighted(isHighlighted) {
        this.highlighted = isHighlighted;
        
        if (isHighlighted) {
            this.htmlElement.classList.add('highlighted');
            this.outline.material.opacity = 0.3;
            this.targetScale = 1.1;
        } else {
            this.htmlElement.classList.remove('highlighted');
            this.outline.material.opacity = 0.0;
            if (!this.grabbed) {
                this.targetScale = 1.0;
            }
        }
    }
    
    /**
     * Set the grabbed state
     * @param {boolean} isGrabbed
     */
    setGrabbed(isGrabbed) {
        this.grabbed = isGrabbed;
        
        if (isGrabbed) {
            this.htmlElement.classList.add('grabbed');
            this.outline.material.opacity = 0.5;
            this.outline.material.color.setHex(0xff00ff);
            this.targetScale = 1.15;
        } else {
            this.htmlElement.classList.remove('grabbed');
            this.outline.material.color.setHex(0x00ffff);
            if (!this.highlighted) {
                this.outline.material.opacity = 0.0;
                this.targetScale = 1.0;
            }
        }
    }
    
    /**
     * Update the card's position and HTML overlay position
     * Called every frame
     * @param {number} deltaTime
     * @param {number} elapsedTime
     * @param {THREE.Camera} camera
     */
    update(deltaTime, elapsedTime, camera) {
        // Floating animation
        const floatY = Math.sin(elapsedTime * this.floatSpeed + this.floatOffset) * this.floatAmplitude;
        this.mesh.position.y = floatY;
        
        // Smooth scale transition
        this.currentScale += (this.targetScale - this.currentScale) * 0.1;
        this.group.scale.set(this.currentScale, this.currentScale, this.currentScale);
        
        // Decay target scale back to base
        this.targetScale += (this.baseScale - this.targetScale) * 0.05;
        
        // Update HTML overlay position to match 3D position
        this.updateHTMLPosition(camera);
    }
    
    /**
     * Convert 3D position to 2D screen coordinates and update HTML overlay
     * @param {THREE.Camera} camera
     */
    updateHTMLPosition(camera) {
        // Get world position of the card
        const worldPosition = new THREE.Vector3();
        this.group.getWorldPosition(worldPosition);
        
        // Project 3D position to 2D screen coordinates
        const screenPosition = worldPosition.clone();
        screenPosition.project(camera);
        
        // Convert to pixel coordinates
        const x = (screenPosition.x * 0.5 + 0.5) * window.innerWidth;
        const y = (screenPosition.y * -0.5 + 0.5) * window.innerHeight;
        
        // Check if card is behind camera
        if (screenPosition.z > 1) {
            this.htmlElement.style.display = 'none';
            return;
        }
        
        // Update HTML element position
        this.htmlElement.style.display = 'block';
        this.htmlElement.style.left = `${x}px`;
        this.htmlElement.style.top = `${y}px`;
        this.htmlElement.style.transform = `translate(-50%, -50%) scale(${this.currentScale})`;
        
        // Adjust opacity based on distance from camera
        const distance = camera.position.distanceTo(worldPosition);
        const opacity = Math.max(0.3, Math.min(1, 1 - (distance - 10) / 40));
        this.htmlElement.style.opacity = opacity;
    }
    
    /**
     * Get the Three.js group containing the card mesh
     * @returns {THREE.Group}
     */
    getGroup() {
        return this.group;
    }
    
    /**
     * Get the card mesh for raycasting
     * @returns {THREE.Mesh}
     */
    getMesh() {
        return this.mesh;
    }
    
    /**
     * Clean up resources
     */
    dispose() {
        // Remove HTML element
        if (this.htmlElement && this.htmlElement.parentNode) {
            this.htmlElement.parentNode.removeChild(this.htmlElement);
        }
        
        // Dispose Three.js resources
        if (this.mesh) {
            this.mesh.geometry.dispose();
            this.mesh.material.dispose();
        }
        if (this.outline) {
            this.outline.geometry.dispose();
            this.outline.material.dispose();
        }
    }
}
