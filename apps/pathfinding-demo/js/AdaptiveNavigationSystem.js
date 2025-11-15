/**
 * ADAPTIVE NAVIGATION SYSTEM
 * Automatically adjusts navigation level (L1/L2/L3) based on user performance
 * 
 * FEATURES:
 * - Auto-upgrade on successful navigation patterns
 * - Auto-downgrade on excessive errors
 * - Performance tracking (speed, accuracy, stability)
 * - Smooth transitions between levels
 * - User feedback on level changes
 */

export class AdaptiveNavigationSystem {
    constructor() {
        // Current navigation level (1, 2, or 3)
        this.currentLevel = 1;
        
        // Performance metrics
        this.metrics = {
            consecutiveSuccesses: 0,
            consecutiveErrors: 0,
            totalGestures: 0,
            successfulGestures: 0,
            averageGestureSpeed: 0,
            gestureStability: 1.0, // 0-1, higher is better
            lastGestureTime: 0
        };
        
        // Thresholds for level changes
        this.thresholds = {
            // Upgrade from L1 to L2
            L1_to_L2: {
                consecutiveSuccesses: 8,
                minAccuracy: 0.75,
                minSpeed: 0.6,
                minStability: 0.7
            },
            // Upgrade from L2 to L3
            L2_to_L3: {
                consecutiveSuccesses: 12,
                minAccuracy: 0.85,
                minSpeed: 0.75,
                minStability: 0.8
            },
            // Downgrade thresholds
            downgrade: {
                consecutiveErrors: 5,
                maxAccuracy: 0.5,
                minStability: 0.4
            }
        };
        
        // Gesture timing for speed calculation
        this.gestureTimings = [];
        this.maxTimingHistory = 10;
        
        // Callbacks
        this.onLevelChange = null;
        this.onMetricsUpdate = null;
        
        // Performance tracking
        this.performanceWindow = [];
        this.windowSize = 20; // Last 20 gestures
        
        // Stability tracking (variance in gesture execution)
        this.stabilityBuffer = [];
        this.stabilityWindowSize = 5;
        
        // console.log('🎯 Adaptive Navigation System initialized at Level 1');
    }
    
    /**
     * Record a successful gesture
     * @param {string} gestureType - Type of gesture (point, pinch, fist, open)
     * @param {number} executionTime - Time taken to complete gesture (ms)
     * @param {number} confidence - Confidence score (0-1)
     */
    recordSuccess(gestureType, executionTime = 0, confidence = 1.0) {
        this.metrics.consecutiveSuccesses++;
        this.metrics.consecutiveErrors = 0;
        this.metrics.totalGestures++;
        this.metrics.successfulGestures++;
        
        // Track timing for speed calculation
        const now = performance.now();
        if (this.metrics.lastGestureTime > 0) {
            const timeSinceLastGesture = now - this.metrics.lastGestureTime;
            this.gestureTimings.push(timeSinceLastGesture);
            if (this.gestureTimings.length > this.maxTimingHistory) {
                this.gestureTimings.shift();
            }
            this.updateAverageSpeed();
        }
        this.metrics.lastGestureTime = now;
        
        // Track stability (consistency in execution time)
        if (executionTime > 0) {
            this.stabilityBuffer.push(executionTime);
            if (this.stabilityBuffer.length > this.stabilityWindowSize) {
                this.stabilityBuffer.shift();
            }
            this.updateStability();
        }
        
        // Update performance window
        this.performanceWindow.push({
            success: true,
            timestamp: now,
            gestureType,
            executionTime,
            confidence
        });
        if (this.performanceWindow.length > this.windowSize) {
            this.performanceWindow.shift();
        }
        
        // Check for upgrade
        this.checkForUpgrade();
        
        // Notify metrics update
        if (this.onMetricsUpdate) {
            this.onMetricsUpdate(this.getMetrics());
        }
        
        // console.log(`✅ Success! ${gestureType} | Consecutive: ${this.metrics.consecutiveSuccesses} | Level: L${this.currentLevel}`);
    }
    
    /**
     * Record a failed/erroneous gesture
     * @param {string} errorType - Type of error (timeout, wrong_gesture, unstable, locked_gesture, etc.)
     * @param {string} gestureType - Type of gesture that failed
     */
    recordError(errorType, gestureType = 'unknown') {
        // Ignore locked gestures - they're expected behavior, not errors
        if (errorType === 'locked_gesture') {
            return; // Don't count locked gestures as errors
        }
        
        this.metrics.consecutiveErrors++;
        this.metrics.consecutiveSuccesses = 0;
        this.metrics.totalGestures++;
        
        const now = performance.now();
        
        // Update performance window
        this.performanceWindow.push({
            success: false,
            timestamp: now,
            errorType,
            gestureType
        });
        if (this.performanceWindow.length > this.windowSize) {
            this.performanceWindow.shift();
        }
        
        // Check for downgrade
        this.checkForDowngrade();
        
        // Notify metrics update
        if (this.onMetricsUpdate) {
            this.onMetricsUpdate(this.getMetrics());
        }
        
        // console.log(`❌ Error! ${errorType} (${gestureType}) | Consecutive errors: ${this.metrics.consecutiveErrors} | Level: L${this.currentLevel}`);
    }
    
    /**
     * Update average gesture speed (gestures per minute)
     */
    updateAverageSpeed() {
        if (this.gestureTimings.length < 2) {
            return;
        }
        
        const avgInterval = this.gestureTimings.reduce((a, b) => a + b, 0) / this.gestureTimings.length;
        const gesturesPerMinute = (60000 / avgInterval);
        
        // Normalize to 0-1 scale (assume 30 gestures/min is "expert" speed)
        this.metrics.averageGestureSpeed = Math.min(1.0, gesturesPerMinute / 30);
    }
    
    /**
     * Update gesture stability based on execution time variance
     */
    updateStability() {
        if (this.stabilityBuffer.length < 2) {
            return;
        }
        
        const mean = this.stabilityBuffer.reduce((a, b) => a + b, 0) / this.stabilityBuffer.length;
        const variance = this.stabilityBuffer.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / this.stabilityBuffer.length;
        const stdDev = Math.sqrt(variance);
        
        // Lower variance = higher stability (invert and normalize)
        // Assume stdDev > 200ms is unstable
        this.metrics.gestureStability = Math.max(0, 1 - (stdDev / 200));
    }
    
    /**
     * Get current accuracy (successful gestures / total gestures)
     */
    getAccuracy() {
        if (this.metrics.totalGestures === 0) {
            return 1.0;
        }
        return this.metrics.successfulGestures / this.metrics.totalGestures;
    }
    
    /**
     * Get recent accuracy (last N gestures)
     */
    getRecentAccuracy() {
        if (this.performanceWindow.length === 0) {
            return 1.0;
        }
        const successes = this.performanceWindow.filter(g => g.success).length;
        return successes / this.performanceWindow.length;
    }
    
    /**
     * Check if user qualifies for level upgrade
     */
    checkForUpgrade() {
        const accuracy = this.getRecentAccuracy();
        const speed = this.metrics.averageGestureSpeed;
        const stability = this.metrics.gestureStability;
        
        // L1 → L2 upgrade
        if (this.currentLevel === 1) {
            const threshold = this.thresholds.L1_to_L2;
            if (
                this.metrics.consecutiveSuccesses >= threshold.consecutiveSuccesses &&
                accuracy >= threshold.minAccuracy &&
                speed >= threshold.minSpeed &&
                stability >= threshold.minStability
            ) {
                this.upgradeLevel(2);
            }
        }
        
        // L2 → L3 upgrade
        else if (this.currentLevel === 2) {
            const threshold = this.thresholds.L2_to_L3;
            if (
                this.metrics.consecutiveSuccesses >= threshold.consecutiveSuccesses &&
                accuracy >= threshold.minAccuracy &&
                speed >= threshold.minSpeed &&
                stability >= threshold.minStability
            ) {
                this.upgradeLevel(3);
            }
        }
    }
    
    /**
     * Check if user should be downgraded
     */
    checkForDowngrade() {
        const accuracy = this.getRecentAccuracy();
        const stability = this.metrics.gestureStability;
        const threshold = this.thresholds.downgrade;
        
        // Don't downgrade from L1
        if (this.currentLevel === 1) {
            return;
        }
        
        // Downgrade on excessive errors or poor performance
        if (
            this.metrics.consecutiveErrors >= threshold.consecutiveErrors ||
            (accuracy < threshold.maxAccuracy && stability < threshold.minStability)
        ) {
            this.downgradeLevel();
        }
    }
    
    /**
     * Upgrade to specified level
     */
    upgradeLevel(newLevel) {
        if (newLevel <= this.currentLevel || newLevel > 3) {
            return;
        }
        
        const oldLevel = this.currentLevel;
        this.currentLevel = newLevel;
        
        // Reset consecutive counters
        this.metrics.consecutiveSuccesses = 0;
        this.metrics.consecutiveErrors = 0;
        
        // console.log(`🚀 LEVEL UPGRADE: L${oldLevel} → L${newLevel}`);
        
        // Notify level change
        if (this.onLevelChange) {
            this.onLevelChange(newLevel, oldLevel, 'upgrade');
        }
        
        // Show notification to user
        this.showLevelChangeNotification(newLevel, 'upgrade');
    }
    
    /**
     * Downgrade by one level
     */
    downgradeLevel() {
        if (this.currentLevel === 1) {
            return;
        }
        
        const oldLevel = this.currentLevel;
        this.currentLevel = Math.max(1, this.currentLevel - 1);
        
        // Reset consecutive counters
        this.metrics.consecutiveSuccesses = 0;
        this.metrics.consecutiveErrors = 0;
        
        // console.log(`⬇️ LEVEL DOWNGRADE: L${oldLevel} → L${this.currentLevel}`);
        
        // Notify level change
        if (this.onLevelChange) {
            this.onLevelChange(this.currentLevel, oldLevel, 'downgrade');
        }
        
        // Show notification to user
        this.showLevelChangeNotification(this.currentLevel, 'downgrade');
    }
    
    /**
     * Show visual notification of level change
     */
    showLevelChangeNotification(newLevel, direction) {
        const notification = document.createElement('div');
        notification.className = `adaptive-level-notification ${direction}`;
        
        const emoji = direction === 'upgrade' ? '🚀' : '⬇️';
        const message = direction === 'upgrade' 
            ? `Level Unlocked: L${newLevel}!`
            : `Adjusted to L${newLevel}`;
        
        const description = this.getLevelDescription(newLevel);
        
        notification.innerHTML = `
            <div class="notification-content">
                <div class="notification-emoji">${emoji}</div>
                <div class="notification-text">
                    <div class="notification-title">${message}</div>
                    <div class="notification-desc">${description}</div>
                </div>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Animate in
        requestAnimationFrame(() => {
            notification.classList.add('show');
        });
        
        // Remove after 4 seconds
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 500);
        }, 4000);
    }
    
    /**
     * Get description for each level
     */
    getLevelDescription(level) {
        const descriptions = {
            1: 'Basic navigation - Point & Hold',
            2: 'Pinch & Zoom enabled',
            3: 'Full gesture control - Fist & Open Palm'
        };
        return descriptions[level] || '';
    }
    
    /**
     * Get current metrics
     */
    getMetrics() {
        return {
            level: this.currentLevel,
            accuracy: this.getAccuracy(),
            recentAccuracy: this.getRecentAccuracy(),
            speed: this.metrics.averageGestureSpeed,
            stability: this.metrics.gestureStability,
            consecutiveSuccesses: this.metrics.consecutiveSuccesses,
            consecutiveErrors: this.metrics.consecutiveErrors,
            totalGestures: this.metrics.totalGestures,
            progressToNextLevel: this.getProgressToNextLevel()
        };
    }
    
    /**
     * Get progress toward next level (0-1)
     */
    getProgressToNextLevel() {
        if (this.currentLevel === 3) {
            return 1.0;
        } // Max level
        
        const threshold = this.currentLevel === 1 
            ? this.thresholds.L1_to_L2 
            : this.thresholds.L2_to_L3;
        
        const successProgress = this.metrics.consecutiveSuccesses / threshold.consecutiveSuccesses;
        const accuracyProgress = this.getRecentAccuracy() / threshold.minAccuracy;
        const speedProgress = this.metrics.averageGestureSpeed / threshold.minSpeed;
        const stabilityProgress = this.metrics.gestureStability / threshold.minStability;
        
        // Average of all criteria
        return Math.min(1.0, (successProgress + accuracyProgress + speedProgress + stabilityProgress) / 4);
    }
    
    /**
     * Manually set level (for testing or user override)
     */
    setLevel(level) {
        if (level < 1 || level > 3) {
            return;
        }
        const oldLevel = this.currentLevel;
        this.currentLevel = level;
        
        if (this.onLevelChange) {
            this.onLevelChange(level, oldLevel, 'manual');
        }
    }
    
    /**
     * Reset all metrics
     */
    reset() {
        this.currentLevel = 1;
        this.metrics = {
            consecutiveSuccesses: 0,
            consecutiveErrors: 0,
            totalGestures: 0,
            successfulGestures: 0,
            averageGestureSpeed: 0,
            gestureStability: 1.0,
            lastGestureTime: 0
        };
        this.gestureTimings = [];
        this.performanceWindow = [];
        this.stabilityBuffer = [];
        
        // console.log('🔄 Adaptive Navigation System reset to Level 1');
    }
    
    /**
     * Get current level
     */
    getCurrentLevel() {
        return this.currentLevel;
    }
    
    /**
     * Check if a specific gesture is available at current level
     */
    isGestureAvailable(gestureType) {
        const gestureLevel = {
            'point': 1,
            'pinch': 2,
            'fist': 3,
            'open': 3
        };
        
        return this.currentLevel >= (gestureLevel[gestureType] || 1);
    }
}
