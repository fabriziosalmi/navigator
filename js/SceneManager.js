/**
 * SceneManager.js
 * 
 * Manages the Three.js scene, camera, renderer, and animation loop.
 * Handles window resizing and provides methods for camera manipulation.
 */

import * as THREE from 'three';

export class SceneManager {
    constructor(containerId = 'canvas-container') {
        this.container = document.getElementById(containerId);
        
        // Core Three.js components
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        
        // Camera controls
        this.cameraTarget = new THREE.Vector3(0, 0, 0);
        this.cameraPosition = new THREE.Vector3(0, 0, 15);
        this.cameraVelocity = new THREE.Vector3(0, 0, 0);
        this.cameraDamping = 0.92; // Smooth camera movement
        
        // Animation
        this.clock = new THREE.Clock();
        this.updateCallbacks = [];
        
        this.init();
    }
    
    /**
     * Initialize the Three.js scene, camera, renderer, and lighting
     */
    init() {
        // Create scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x000000);
        this.scene.fog = new THREE.Fog(0x000000, 10, 50);
        
        // Create camera
        const aspect = window.innerWidth / window.innerHeight;
        this.camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 1000);
        this.camera.position.copy(this.cameraPosition);
        this.camera.lookAt(this.cameraTarget);
        
        // Create renderer
        this.renderer = new THREE.WebGLRenderer({ 
            antialias: true,
            alpha: true 
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        
        // Append renderer to container
        this.container.appendChild(this.renderer.domElement);
        
        // Setup lighting
        this.setupLights();
        
        // Handle window resize
        window.addEventListener('resize', () => this.onWindowResize());
        
        // Start animation loop
        this.animate();
        
        console.log('SceneManager initialized');
    }
    
    /**
     * Setup scene lighting
     */
    setupLights() {
        // Ambient light for general illumination
        const ambientLight = new THREE.AmbientLight(0x404040, 1.5);
        this.scene.add(ambientLight);
        
        // Main directional light
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(5, 10, 7);
        directionalLight.castShadow = true;
        directionalLight.shadow.camera.near = 0.1;
        directionalLight.shadow.camera.far = 50;
        this.scene.add(directionalLight);
        
        // Accent lights for atmospheric effect
        const accentLight1 = new THREE.PointLight(0x00ffff, 0.5, 20);
        accentLight1.position.set(-10, 5, 5);
        this.scene.add(accentLight1);
        
        const accentLight2 = new THREE.PointLight(0xff00ff, 0.5, 20);
        accentLight2.position.set(10, 5, -5);
        this.scene.add(accentLight2);
    }
    
    /**
     * Handle window resize events
     */
    onWindowResize() {
        const width = window.innerWidth;
        const height = window.innerHeight;
        
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        
        this.renderer.setSize(width, height);
    }
    
    /**
     * Pan the camera based on gesture input
     * @param {number} dx - Delta X movement
     * @param {number} dy - Delta Y movement
     */
    panCamera(dx, dy) {
        // Convert screen-space delta to world-space movement
        // Negative to make movement feel natural (hand moves right, view pans right)
        const sensitivity = 0.02;
        this.cameraVelocity.x -= dx * sensitivity;
        this.cameraVelocity.y += dy * sensitivity;
    }
    
    /**
     * Move camera along Z-axis (push/pull)
     * @param {number} dz - Delta Z movement
     */
    zoomCamera(dz) {
        const sensitivity = 0.05;
        this.cameraVelocity.z += dz * sensitivity;
        
        // Clamp camera distance
        const minZ = 5;
        const maxZ = 30;
        if (this.cameraPosition.z + this.cameraVelocity.z < minZ) {
            this.cameraVelocity.z = 0;
        }
        if (this.cameraPosition.z + this.cameraVelocity.z > maxZ) {
            this.cameraVelocity.z = 0;
        }
    }
    
    /**
     * Update camera position with smooth damping
     */
    updateCamera() {
        // Apply velocity to position
        this.cameraPosition.add(this.cameraVelocity);
        
        // Apply damping to velocity
        this.cameraVelocity.multiplyScalar(this.cameraDamping);
        
        // Update camera
        this.camera.position.copy(this.cameraPosition);
        this.camera.lookAt(this.cameraTarget);
    }
    
    /**
     * Register a callback to be called on each frame
     * @param {Function} callback - Function to call with (deltaTime, elapsedTime)
     */
    addUpdateCallback(callback) {
        this.updateCallbacks.push(callback);
    }
    
    /**
     * Main animation loop
     */
    animate() {
        requestAnimationFrame(() => this.animate());
        
        const deltaTime = this.clock.getDelta();
        const elapsedTime = this.clock.getElapsedTime();
        
        // Update camera
        this.updateCamera();
        
        // Call all registered update callbacks
        this.updateCallbacks.forEach(callback => {
            callback(deltaTime, elapsedTime);
        });
        
        // Render the scene
        this.renderer.render(this.scene, this.camera);
    }
    
    /**
     * Get the scene for adding objects
     * @returns {THREE.Scene}
     */
    getScene() {
        return this.scene;
    }
    
    /**
     * Get the camera for raycasting
     * @returns {THREE.Camera}
     */
    getCamera() {
        return this.camera;
    }
    
    /**
     * Get the renderer for additional configuration
     * @returns {THREE.WebGLRenderer}
     */
    getRenderer() {
        return this.renderer;
    }
}
