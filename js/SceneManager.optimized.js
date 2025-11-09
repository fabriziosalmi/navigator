/**
 * SceneManager.js (OPTIMIZED)
 * 
 * REFACTOR: Separated animation loop into Read-Update-Render phases
 * OPTIMIZATION: Critically-damped spring camera, GPU offloading, instanced rendering
 * 
 * Manages the Three.js scene with maximum performance:
 * - Prevents layout thrashing by batching DOM reads/writes
 * - Uses physics-based camera for natural motion
 * - Supports instanced rendering for card geometry
 */

import * as THREE from 'three';

export class SceneManager {
    constructor(containerId = 'canvas-container', appState) {
        this.container = document.getElementById(containerId);
        this.appState = appState; // REFACTOR: Centralized state management
        
        // Core Three.js components
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        
        // OPTIMIZATION: Critically-damped spring camera system
        // Formula: x'' + 2*zeta*omega*x' + omega^2*x = omega^2*target
        // where zeta = 1 (critical damping), omega = angular frequency
        this.cameraSpring = {
            position: new THREE.Vector3(0, 0, 15),
            velocity: new THREE.Vector3(0, 0, 0),
            target: new THREE.Vector3(0, 0, 0),
            omega: 8.0, // Spring stiffness (higher = faster response)
            zeta: 1.0   // Damping ratio (1 = critical damping, no overshoot)
        };
        
        // OPTIMIZATION: Instanced rendering for cards
        this.instancedMesh = null;
        this.instanceCount = 0;
        this.instanceMatrices = [];
        
        // Animation
        this.clock = new THREE.Clock();
        this.frameCount = 0;
        this.lastFPSUpdate = 0;
        this.currentFPS = 60;
        
        // REFACTOR: Separate update phases
        this.readCallbacks = [];   // Phase 1: Read inputs/state
        this.updateCallbacks = []; // Phase 2: Update logic
        this.renderCallbacks = []; // Phase 3: Pre-render effects
        
        // OPTIMIZATION: Render-on-demand flag
        this.needsRender = true;
        this.continuousRendering = true;
        
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
        this.camera.position.copy(this.cameraSpring.position);
        this.camera.lookAt(this.cameraSpring.target);
        
        // OPTIMIZATION: Create renderer with optimized settings
        this.renderer = new THREE.WebGLRenderer({ 
            antialias: window.devicePixelRatio === 1, // Only on 1x displays
            alpha: false, // Opaque background is faster
            powerPreference: 'high-performance',
            stencil: false // Disable if not needed
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Cap at 2x
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        
        // OPTIMIZATION: Enable auto-clear for better performance
        this.renderer.autoClear = true;
        
        // Append renderer to container
        this.container.appendChild(this.renderer.domElement);
        
        // Setup lighting
        this.setupLights();
        
        // Handle window resize
        window.addEventListener('resize', () => this.onWindowResize());
        
        // OPTIMIZATION: Start animation loop with performance monitoring
        this.animate();
        
        console.log('SceneManager initialized (optimized)');
    }
    
    /**
     * Setup scene lighting
     */
    setupLights() {
        // OPTIMIZATION: Minimize number of lights (fewer = faster)
        
        // Ambient light for general illumination
        const ambientLight = new THREE.AmbientLight(0x404040, 1.5);
        this.scene.add(ambientLight);
        
        // Main directional light
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(5, 10, 7);
        directionalLight.castShadow = true;
        
        // OPTIMIZATION: Reduce shadow map resolution if performance is critical
        directionalLight.shadow.mapSize.width = 1024;
        directionalLight.shadow.mapSize.height = 1024;
        directionalLight.shadow.camera.near = 0.1;
        directionalLight.shadow.camera.far = 50;
        
        this.scene.add(directionalLight);
        
        // OPTIMIZATION: Use fewer accent lights (combine into ambient if possible)
        const accentLight = new THREE.PointLight(0x00ffff, 0.3, 20);
        accentLight.position.set(-10, 5, 5);
        this.scene.add(accentLight);
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
        this.needsRender = true;
    }
    
    // ============================================================
    // CRITICALLY-DAMPED SPRING CAMERA SYSTEM
    // ============================================================
    
    /**
     * OPTIMIZATION: Physics-based spring camera for ultra-smooth, natural motion
     * Reference: https://www.ryanjuckett.com/damped-springs/
     * 
     * @param {number} dx - Delta X input
     * @param {number} dy - Delta Y input
     */
    panCamera(dx, dy) {
        // OPTIMIZATION: Directly modify target position
        const sensitivity = 0.02;
        this.cameraSpring.target.x -= dx * sensitivity;
        this.cameraSpring.target.y += dy * sensitivity;
        
        this.needsRender = true;
    }
    
    /**
     * Move camera along Z-axis with spring physics
     * @param {number} dz - Delta Z movement
     */
    zoomCamera(dz) {
        const sensitivity = 0.05;
        this.cameraSpring.target.z += dz * sensitivity;
        
        // Clamp camera distance
        const minZ = 5;
        const maxZ = 30;
        this.cameraSpring.target.z = Math.max(minZ, Math.min(maxZ, this.cameraSpring.target.z));
        
        this.needsRender = true;
    }
    
    /**
     * OPTIMIZATION: Update camera using critically-damped spring
     * Provides perfect balance: responsive but no overshoot/oscillation
     * 
     * Mathematical model:
     * acceleration = omega^2 * (target - position) - 2 * omega * velocity
     */
    updateCameraSpring(deltaTime) {
        const { position, velocity, target, omega, zeta } = this.cameraSpring;
        
        // Compute spring force using critically-damped formula
        const displacement = new THREE.Vector3().subVectors(target, position);
        const springForce = displacement.multiplyScalar(omega * omega);
        
        // Compute damping force
        const dampingForce = velocity.clone().multiplyScalar(2 * omega * zeta);
        
        // Total acceleration
        const acceleration = springForce.sub(dampingForce);
        
        // Semi-implicit Euler integration (more stable than explicit)
        velocity.addScaledVector(acceleration, deltaTime);
        position.addScaledVector(velocity, deltaTime);
        
        // OPTIMIZATION: Stop updating when motion is negligible
        const velocityMag = velocity.length();
        const displacementMag = displacement.length();
        
        if (velocityMag < 0.001 && displacementMag < 0.001) {
            position.copy(target);
            velocity.set(0, 0, 0);
            return false; // No more updates needed
        }
        
        // Sync with appState
        if (this.appState) {
            this.appState.updateCameraPosition(position.x, position.y, position.z);
            this.appState.updateCameraVelocity(velocity.x, velocity.y, velocity.z);
        }
        
        return true; // Continue updating
    }
    
    // ============================================================
    // INSTANCED RENDERING FOR CARDS
    // ============================================================
    
    /**
     * OPTIMIZATION: Setup instanced mesh for card geometry
     * Reduces draw calls from N to 1 (massive performance gain for many cards)
     * 
     * @param {number} count - Number of card instances
     */
    setupInstancedCards(count) {
        this.instanceCount = count;
        
        // Create shared geometry
        const geometry = new THREE.PlaneGeometry(2.5, 3);
        
        // Create shared material (customize as needed)
        const material = new THREE.MeshStandardMaterial({
            color: 0x1a1a2e,
            emissive: 0x0a0a1a,
            side: THREE.DoubleSide,
            metalness: 0.3,
            roughness: 0.7
        });
        
        // Create instanced mesh
        this.instancedMesh = new THREE.InstancedMesh(geometry, material, count);
        this.instancedMesh.castShadow = true;
        this.instancedMesh.receiveShadow = true;
        
        // Initialize instance matrices
        const matrix = new THREE.Matrix4();
        for (let i = 0; i < count; i++) {
            matrix.identity();
            this.instancedMesh.setMatrixAt(i, matrix);
        }
        this.instancedMesh.instanceMatrix.needsUpdate = true;
        
        this.scene.add(this.instancedMesh);
        
        console.log(`Instanced rendering enabled for ${count} cards`);
    }
    
    /**
     * OPTIMIZATION: Update instance matrix for a specific card
     * Much faster than updating individual meshes
     * 
     * @param {number} index - Card instance index
     * @param {THREE.Vector3} position
     * @param {THREE.Quaternion} rotation
     * @param {THREE.Vector3} scale
     */
    updateInstanceTransform(index, position, rotation, scale) {
        if (!this.instancedMesh || index >= this.instanceCount) return;
        
        const matrix = new THREE.Matrix4();
        matrix.compose(position, rotation, scale);
        this.instancedMesh.setMatrixAt(index, matrix);
        this.instancedMesh.instanceMatrix.needsUpdate = true;
        
        this.needsRender = true;
    }
    
    // ============================================================
    // SEPARATED UPDATE CALLBACKS (Read-Update-Render)
    // ============================================================
    
    /**
     * REFACTOR: Register callback for READ phase
     * Use for: Reading DOM properties, gathering input state
     */
    addReadCallback(callback) {
        this.readCallbacks.push(callback);
    }
    
    /**
     * REFACTOR: Register callback for UPDATE phase
     * Use for: Game logic, physics, state updates
     */
    addUpdateCallback(callback) {
        this.updateCallbacks.push(callback);
    }
    
    /**
     * REFACTOR: Register callback for RENDER phase
     * Use for: Visual effects, shader updates, GPU operations
     */
    addRenderCallback(callback) {
        this.renderCallbacks.push(callback);
    }
    
    // ============================================================
    // MAIN ANIMATION LOOP (OPTIMIZED)
    // ============================================================
    
    /**
     * OPTIMIZATION: Separated animation loop prevents layout thrashing
     * 
     * Phase 1 (READ): Batch all DOM reads
     * Phase 2 (UPDATE): Update game logic and state
     * Phase 3 (RENDER): Batch all DOM writes and Three.js rendering
     */
    animate() {
        requestAnimationFrame(() => this.animate());
        
        const deltaTime = this.clock.getDelta();
        const elapsedTime = this.clock.getElapsedTime();
        
        // OPTIMIZATION: Track FPS for performance monitoring
        this.frameCount++;
        if (elapsedTime - this.lastFPSUpdate >= 1.0) {
            this.currentFPS = this.frameCount / (elapsedTime - this.lastFPSUpdate);
            this.frameCount = 0;
            this.lastFPSUpdate = elapsedTime;
            
            if (this.appState) {
                this.appState.updatePerformanceMetrics(this.currentFPS, deltaTime * 1000);
            }
        }
        
        // ============================================================
        // PHASE 1: READ
        // ============================================================
        this.readCallbacks.forEach(callback => {
            callback(deltaTime, elapsedTime);
        });
        
        // ============================================================
        // PHASE 2: UPDATE
        // ============================================================
        
        // Update camera spring physics
        const cameraMoving = this.updateCameraSpring(deltaTime);
        
        // Update game logic
        this.updateCallbacks.forEach(callback => {
            callback(deltaTime, elapsedTime);
        });
        
        // ============================================================
        // PHASE 3: RENDER
        // ============================================================
        
        // Pre-render effects
        this.renderCallbacks.forEach(callback => {
            callback(deltaTime, elapsedTime);
        });
        
        // OPTIMIZATION: Only render if something changed
        if (this.needsRender || this.continuousRendering || cameraMoving) {
            // Update camera transform
            this.camera.position.copy(this.cameraSpring.position);
            this.camera.lookAt(this.cameraSpring.target);
            
            // Render the scene
            this.renderer.render(this.scene, this.camera);
            
            this.needsRender = false;
        }
    }
    
    // ============================================================
    // GETTERS & UTILITIES
    // ============================================================
    
    getScene() {
        return this.scene;
    }
    
    getCamera() {
        return this.camera;
    }
    
    getRenderer() {
        return this.renderer;
    }
    
    getCameraPosition() {
        return this.cameraSpring.position.clone();
    }
    
    setCameraTarget(x, y, z) {
        this.cameraSpring.target.set(x, y, z);
        this.needsRender = true;
    }
    
    /**
     * OPTIMIZATION: Enable/disable continuous rendering
     * Set to false for render-on-demand (better for static scenes)
     */
    setContinuousRendering(enabled) {
        this.continuousRendering = enabled;
    }
    
    /**
     * Force a render on the next frame
     */
    requestRender() {
        this.needsRender = true;
    }
    
    /**
     * Get current FPS
     */
    getFPS() {
        return this.currentFPS;
    }
    
    /**
     * MEMORY: Dispose of all resources
     */
    dispose() {
        // Dispose instanced mesh
        if (this.instancedMesh) {
            this.instancedMesh.geometry.dispose();
            this.instancedMesh.material.dispose();
            this.scene.remove(this.instancedMesh);
        }
        
        // Dispose renderer
        this.renderer.dispose();
        
        console.log('SceneManager disposed');
    }
}

export default SceneManager;
