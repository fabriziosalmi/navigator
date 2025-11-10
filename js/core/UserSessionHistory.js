/**
 * UserSessionHistory.js
 * 
 * Circular buffer for storing user interaction history.
 * Provides metrics and analysis methods for cognitive state detection.
 * 
 * Action object structure:
 * {
 *   type: string,           // 'swipe_left', 'swipe_right', 'layer_up', etc.
 *   timestamp: number,       // performance.now()
 *   duration_ms: number,     // How long the gesture took
 *   success: boolean,        // Was the intent executed successfully?
 *   start_pos: {x, y},      // Starting position (normalized 0-1)
 *   end_pos: {x, y},        // Ending position (normalized 0-1)
 *   metadata: object        // Additional context
 * }
 */

export class UserSessionHistory {
    constructor(maxSize = 50) {
        this.maxSize = maxSize;
        this.buffer = [];
        this.writeIndex = 0;
        this.totalActions = 0;
    }

    /**
     * Add a new action to the history
     */
    add(action) {
        // Validate required fields
        if (!action.type || !action.timestamp) {
            console.warn('Invalid action object:', action);
            return;
        }

        // Ensure all required fields exist
        const fullAction = {
            type: action.type,
            timestamp: action.timestamp,
            duration_ms: action.duration_ms || 0,
            success: action.success !== undefined ? action.success : true,
            start_pos: action.start_pos || { x: 0, y: 0 },
            end_pos: action.end_pos || { x: 0, y: 0 },
            metadata: action.metadata || {}
        };

        // Circular buffer logic
        if (this.buffer.length < this.maxSize) {
            this.buffer.push(fullAction);
        } else {
            this.buffer[this.writeIndex] = fullAction;
        }

        this.writeIndex = (this.writeIndex + 1) % this.maxSize;
        this.totalActions++;
    }

    /**
     * Get the last N actions (most recent first)
     */
    getLatest(count = 10) {
        const size = Math.min(count, this.buffer.length);
        const result = [];

        // Get items in reverse chronological order
        for (let i = 0; i < size; i++) {
            const index = (this.writeIndex - 1 - i + this.maxSize) % this.maxSize;
            if (index < this.buffer.length) {
                result.push(this.buffer[index]);
            }
        }

        return result;
    }

    /**
     * Get all actions in chronological order
     */
    getAll() {
        if (this.buffer.length < this.maxSize) {
            // Buffer not full yet, return in order
            return [...this.buffer];
        }

        // Buffer is full, need to reorder
        const result = [];
        for (let i = 0; i < this.maxSize; i++) {
            const index = (this.writeIndex + i) % this.maxSize;
            result.push(this.buffer[index]);
        }
        return result;
    }

    /**
     * Calculate comprehensive metrics from history
     */
    getMetrics(windowSize = null) {
        const actions = windowSize ? this.getLatest(windowSize) : this.getAll();
        
        if (actions.length === 0) {
            return {
                total: 0,
                errorRate: 0,
                averageDuration: 0,
                averageSpeed: 0,
                actionVariety: 0,
                actionTypes: {},
                recentErrors: [],
                velocityProfile: []
            };
        }

        // Error rate
        const errors = actions.filter(a => !a.success);
        const errorRate = errors.length / actions.length;

        // Average duration
        const totalDuration = actions.reduce((sum, a) => sum + a.duration_ms, 0);
        const averageDuration = totalDuration / actions.length;

        // Action variety (Shannon entropy)
        const actionTypes = {};
        actions.forEach(a => {
            actionTypes[a.type] = (actionTypes[a.type] || 0) + 1;
        });
        const uniqueTypes = Object.keys(actionTypes).length;
        const actionVariety = uniqueTypes / actions.length;

        // Average speed (distance / time)
        const speeds = actions.map(a => {
            const dx = a.end_pos.x - a.start_pos.x;
            const dy = a.end_pos.y - a.start_pos.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            return a.duration_ms > 0 ? distance / a.duration_ms : 0;
        });
        const averageSpeed = speeds.reduce((sum, s) => sum + s, 0) / speeds.length;

        // Recent errors with timestamps
        const recentErrors = errors.map(e => ({
            type: e.type,
            timestamp: e.timestamp,
            timeSinceLast: 0
        }));

        // Calculate time between consecutive errors
        for (let i = 1; i < recentErrors.length; i++) {
            recentErrors[i].timeSinceLast = 
                recentErrors[i].timestamp - recentErrors[i - 1].timestamp;
        }

        // Velocity profile for gesture analysis
        const velocityProfile = actions.map((a, i) => {
            if (i === 0) return { velocity: 0, acceleration: 0 };
            
            const prev = actions[i - 1];
            const timeDelta = a.timestamp - prev.timestamp;
            
            const dx = a.end_pos.x - a.start_pos.x;
            const dy = a.end_pos.y - a.start_pos.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            const velocity = timeDelta > 0 ? distance / timeDelta : 0;
            
            // Acceleration (change in velocity)
            const prevDx = prev.end_pos.x - prev.start_pos.x;
            const prevDy = prev.end_pos.y - prev.start_pos.y;
            const prevDistance = Math.sqrt(prevDx * prevDx + prevDy * prevDy);
            const prevTimeDelta = i > 1 ? prev.timestamp - actions[i - 2].timestamp : timeDelta;
            const prevVelocity = prevTimeDelta > 0 ? prevDistance / prevTimeDelta : 0;
            
            const acceleration = timeDelta > 0 ? (velocity - prevVelocity) / timeDelta : 0;
            
            return { velocity, acceleration };
        });

        return {
            total: actions.length,
            errorRate,
            averageDuration,
            averageSpeed,
            actionVariety,
            actionTypes,
            recentErrors,
            velocityProfile
        };
    }

    /**
     * Get error clustering metrics
     * Returns info about consecutive errors and error bursts
     */
    getErrorClusters(timeWindowMs = 5000) {
        const actions = this.getAll();
        const errors = actions.filter(a => !a.success);
        
        if (errors.length === 0) {
            return {
                clusters: [],
                maxClusterSize: 0,
                averageClusterSize: 0,
                totalClusters: 0
            };
        }

        const clusters = [];
        let currentCluster = [errors[0]];

        for (let i = 1; i < errors.length; i++) {
            const timeSinceLast = errors[i].timestamp - errors[i - 1].timestamp;
            
            if (timeSinceLast <= timeWindowMs) {
                // Error is part of current cluster
                currentCluster.push(errors[i]);
            } else {
                // Start new cluster
                if (currentCluster.length > 1) {
                    clusters.push(currentCluster);
                }
                currentCluster = [errors[i]];
            }
        }

        // Add last cluster if it has multiple errors
        if (currentCluster.length > 1) {
            clusters.push(currentCluster);
        }

        const clusterSizes = clusters.map(c => c.length);
        const maxClusterSize = Math.max(...clusterSizes, 0);
        const averageClusterSize = clusterSizes.length > 0
            ? clusterSizes.reduce((sum, s) => sum + s, 0) / clusterSizes.length
            : 0;

        return {
            clusters,
            maxClusterSize,
            averageClusterSize,
            totalClusters: clusters.length
        };
    }

    /**
     * Clear all history
     */
    clear() {
        this.buffer = [];
        this.writeIndex = 0;
        this.totalActions = 0;
    }

    /**
     * Get buffer statistics
     */
    getStats() {
        return {
            maxSize: this.maxSize,
            currentSize: this.buffer.length,
            totalActions: this.totalActions,
            isFull: this.buffer.length >= this.maxSize
        };
    }
}

export default UserSessionHistory;
