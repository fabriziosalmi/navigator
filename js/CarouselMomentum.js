/**
 * CAROUSEL MOMENTUM CONTROLLER
 * Handles long swipe gestures with physics-based momentum
 * Creates "beyond" carousel experience with intelligent auto-scroll
 */

export class CarouselMomentum {
    constructor(navigationController) {
        this.navController = navigationController;
        
        // Gesture tracking
        this.isTracking = false;
        this.startX = 0;
        this.startY = 0;
        this.currentX = 0;
        this.currentY = 0;
        this.velocityX = 0;
        this.velocityY = 0;
        this.lastTime = 0;
        this.lastX = 0;
        
        // Momentum state
        this.isMomentumActive = false;
        this.momentumVelocity = 0;
        this.animationFrame = null;
        
        // Configuration
        this.config = {
            longSwipeThreshold: 150, // pixels - minimum distance for long swipe
            velocityThreshold: 0.5,  // pixels/ms - minimum velocity for momentum
            friction: 0.95,          // deceleration factor (0-1)
            snapThreshold: 0.2,      // velocity below which we snap to card
            maxVelocity: 3.0,        // max velocity cap
            swipeTimeout: 300        // ms - time window for swipe detection
        };
        
        // Timing
        this.gestureStartTime = 0;
        this.velocityHistory = [];
        this.maxHistoryLength = 5;
        
        console.log('🎡 Carousel Momentum Controller initialized');
    }
    
    /**
     * Start tracking gesture
     */
    startGesture(x, y) {
        this.isTracking = true;
        this.startX = x;
        this.startY = y;
        this.currentX = x;
        this.currentY = y;
        this.lastX = x;
        this.lastTime = Date.now();
        this.gestureStartTime = Date.now();
        this.velocityHistory = [];
        
        // Stop any ongoing momentum
        this.stopMomentum();
    }
    
    /**
     * Update gesture position and calculate velocity
     */
    updateGesture(x, y) {
        if (!this.isTracking) return;
        
        const now = Date.now();
        const deltaTime = now - this.lastTime;
        
        if (deltaTime > 0) {
            // Calculate instantaneous velocity
            const deltaX = x - this.lastX;
            const velocity = deltaX / deltaTime;
            
            // Store in history for smoothing
            this.velocityHistory.push(velocity);
            if (this.velocityHistory.length > this.maxHistoryLength) {
                this.velocityHistory.shift();
            }
            
            // Update current state
            this.currentX = x;
            this.currentY = y;
            this.lastX = x;
            this.lastTime = now;
        }
    }
    
    /**
     * End gesture and determine if momentum should activate
     */
    endGesture() {
        if (!this.isTracking) return;
        
        const totalDistance = Math.abs(this.currentX - this.startX);
        const totalTime = Date.now() - this.gestureStartTime;
        const isHorizontal = Math.abs(this.currentX - this.startX) > Math.abs(this.currentY - this.startY);
        
        // Calculate average velocity from history
        let avgVelocity = 0;
        if (this.velocityHistory.length > 0) {
            avgVelocity = this.velocityHistory.reduce((sum, v) => sum + v, 0) / this.velocityHistory.length;
        }
        
        // Determine if this is a long swipe worthy of momentum
        const isLongSwipe = totalDistance >= this.config.longSwipeThreshold;
        const isFastSwipe = Math.abs(avgVelocity) >= this.config.velocityThreshold;
        const isQuickSwipe = totalTime <= this.config.swipeTimeout;
        
        console.log('🎡 Swipe detected:', {
            distance: totalDistance.toFixed(0),
            velocity: avgVelocity.toFixed(3),
            time: totalTime,
            isLong: isLongSwipe,
            isFast: isFastSwipe
        });
        
        if (isHorizontal && (isLongSwipe || (isFastSwipe && isQuickSwipe))) {
            // Activate momentum!
            this.startMomentum(avgVelocity);
        } else {
            // Normal single card navigation
            const direction = this.currentX > this.startX ? -1 : 1;
            if (totalDistance > 50) { // minimum swipe distance
                this.navController.navigateCard(direction);
            }
        }
        
        this.isTracking = false;
    }
    
    /**
     * Start momentum-based continuous scroll
     */
    startMomentum(velocity) {
        // Cap velocity
        this.momentumVelocity = Math.max(-this.config.maxVelocity, 
                                         Math.min(this.config.maxVelocity, velocity));
        
        this.isMomentumActive = true;
        
        console.log('🎡 Momentum activated! Initial velocity:', this.momentumVelocity.toFixed(3));
        
        // Start animation loop
        this.animateMomentum();
    }
    
    /**
     * Stop momentum animation
     */
    stopMomentum() {
        this.isMomentumActive = false;
        this.momentumVelocity = 0;
        
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
            this.animationFrame = null;
        }
    }
    
    /**
     * Momentum animation loop with physics
     */
    animateMomentum() {
        if (!this.isMomentumActive) return;
        
        // Apply friction (deceleration)
        this.momentumVelocity *= this.config.friction;
        
        // Check if we should stop (velocity too low)
        if (Math.abs(this.momentumVelocity) < this.config.snapThreshold) {
            console.log('🎡 Momentum stopped - snapping to card');
            this.stopMomentum();
            return;
        }
        
        // Determine navigation direction and trigger
        // Velocity is in pixels/ms, we want to navigate when we've "accumulated" enough
        const cardNavigationThreshold = 0.8; // cards per frame at peak velocity
        
        if (Math.abs(this.momentumVelocity) > cardNavigationThreshold) {
            const direction = this.momentumVelocity > 0 ? -1 : 1;
            this.navController.navigateCard(direction);
            
            // Reduce velocity after navigation (feels more natural)
            this.momentumVelocity *= 0.7;
        }
        
        // Continue animation
        this.animationFrame = requestAnimationFrame(() => this.animateMomentum());
    }
    
    /**
     * Get current momentum status for UI feedback
     */
    getMomentumStatus() {
        return {
            active: this.isMomentumActive,
            velocity: this.momentumVelocity,
            direction: this.momentumVelocity > 0 ? 'left' : 'right'
        };
    }
    
    /**
     * Cancel any ongoing gestures or momentum
     */
    cancel() {
        this.isTracking = false;
        this.stopMomentum();
    }
}

export default CarouselMomentum;
