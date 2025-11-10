/**
 * CognitiveModelPlugin.js
 * 
 * Advanced cognitive state detection system.
 * Analyzes user interaction patterns to detect mental states:
 * - Frustrated: High error rate, erratic movements
 * - Concentrated: Fast, precise, successful actions
 * - Exploring: High variety, slower pace, experimental
 * - Learning: Improving success rate over time
 * 
 * Uses multiple analyzers that vote on state transitions.
 * Other plugins adapt their behavior based on detected state.
 */

import { BasePlugin } from '../core/BasePlugin.js';
import { UserSessionHistory } from '../core/UserSessionHistory.js';

export class CognitiveModelPlugin extends BasePlugin {
    constructor(config = {}) {
        super('CognitiveModel', {
            enabled: true,
            history_window_size: 50,
            state_switch_threshold: 3,
            
            // Frustration detection
            frustration_error_rate: 0.40,
            frustration_time_window_ms: 5000,
            frustration_cluster_size: 3,
            
            // Concentration detection
            concentration_speed_threshold_ms: 400,
            concentration_success_rate: 0.90,
            concentration_consistency: 0.85,
            
            // Exploration detection
            exploration_variety_threshold: 0.60,
            exploration_pause_threshold_ms: 1000,
            
            // Learning detection
            learning_improvement_window: 20,
            learning_improvement_threshold: 0.15,
            
            ...config
        });

        this.history = null;
        this.currentState = 'neutral';
        this.previousState = 'neutral';
        
        // Signal counters for state switching
        this.signals = {
            frustrated: 0,
            concentrated: 0,
            exploring: 0,
            learning: 0
        };
        
        this.lastAnalysisTime = 0;
        this.analysisInterval = 500; // Analyze every 500ms
    }

    async onInit() {
        this.log('Initializing cognitive model');

        // Create session history
        this.history = new UserSessionHistory(this.getConfig('history_window_size'));

        // Listen to all interaction events
        this._setupEventListeners();

        // Set initial state
        this.setState('user.cognitive_state', 'neutral');
    }

    async onStart() {
        this.log('Cognitive model active');
    }

    // ========================================
    // Event Listeners
    // ========================================

    _setupEventListeners() {
        // Gesture events
        this.on('input:gesture:swipe_left', (data) => this._recordAction('swipe_left', data));
        this.on('input:gesture:swipe_right', (data) => this._recordAction('swipe_right', data));
        this.on('input:gesture:swipe_up', (data) => this._recordAction('swipe_up', data));
        this.on('input:gesture:swipe_down', (data) => this._recordAction('swipe_down', data));
        this.on('input:gesture:pinch', (data) => this._recordAction('pinch', data));
        this.on('input:gesture:fist', (data) => this._recordAction('fist', data));
        this.on('input:gesture:point', (data) => this._recordAction('point', data));

        // Navigation events (success indicators)
        this.on('navigation:card:change', (data) => this._recordSuccess('navigate_card', data));
        this.on('navigation:layer:change', (data) => this._recordSuccess('navigate_layer', data));

        // Error/failure events
        this.on('navigation:error', (data) => this._recordError('navigation_failed', data));
        this.on('gesture:timeout', (data) => this._recordError('gesture_timeout', data));
        this.on('gesture:unstable', (data) => this._recordError('gesture_unstable', data));

        // Keyboard events
        this.on('input:keyboard:keydown', (data) => this._recordAction('keyboard', data));
    }

    _recordAction(type, data = {}) {
        const action = {
            type: type,
            timestamp: performance.now(),
            duration_ms: data.duration_ms || 0,
            success: data.success !== undefined ? data.success : true,
            start_pos: data.start_pos || { x: 0, y: 0 },
            end_pos: data.end_pos || { x: 0, y: 0 },
            metadata: data
        };

        this.history.add(action);
        this._maybeAnalyze();
    }

    _recordSuccess(type, data = {}) {
        this._recordAction(type, { ...data, success: true });
    }

    _recordError(type, data = {}) {
        this._recordAction(type, { ...data, success: false });
    }

    // ========================================
    // Cognitive State Analysis
    // ========================================

    _maybeAnalyze() {
        const now = performance.now();
        
        // Rate limit analysis
        if (now - this.lastAnalysisTime < this.analysisInterval) {
            return;
        }

        this.lastAnalysisTime = now;
        this.updateCognitiveState();
    }

    updateCognitiveState() {
        // Run all analyzers
        this.checkForFrustration();
        this.checkForConcentration();
        this.checkForExploration();
        this.checkForLearning();

        // Determine new state based on signals
        this._evaluateStateChange();
    }

    // ========================================
    // Analyzer: Frustration
    // ========================================

    checkForFrustration() {
        const windowSize = 10;
        const metrics = this.history.getMetrics(windowSize);
        
        if (metrics.total < 5) {
            // Not enough data
            return;
        }

        const errorRate = metrics.errorRate;
        const errorClusters = this.history.getErrorClusters(
            this.getConfig('frustration_time_window_ms')
        );

        const highErrorRate = errorRate > this.getConfig('frustration_error_rate');
        const hasErrorClusters = errorClusters.maxClusterSize >= this.getConfig('frustration_cluster_size');

        if (highErrorRate && hasErrorClusters) {
            // Strong frustration signal
            this.signals.frustrated = Math.min(this.signals.frustrated + 1, 5);
            this.log(`Frustration signal +1 (${this.signals.frustrated}) - Error rate: ${(errorRate * 100).toFixed(1)}%, Clusters: ${errorClusters.totalClusters}`);
        } else {
            // Decay frustration signal
            this.signals.frustrated = Math.max(this.signals.frustrated - 1, 0);
        }

        // Reset competing signals
        if (this.signals.frustrated > 2) {
            this.signals.concentrated = Math.max(this.signals.concentrated - 1, 0);
        }
    }

    // ========================================
    // Analyzer: Concentration
    // ========================================

    checkForConcentration() {
        const windowSize = 15;
        const metrics = this.history.getMetrics(windowSize);

        if (metrics.total < 8) {
            return;
        }

        const fastActions = metrics.averageDuration < this.getConfig('concentration_speed_threshold_ms');
        const highSuccess = (1 - metrics.errorRate) > this.getConfig('concentration_success_rate');
        
        // Check consistency (low variance in duration)
        const actions = this.history.getLatest(windowSize);
        const durations = actions.map(a => a.duration_ms);
        const variance = this._calculateVariance(durations);
        const consistentTiming = variance < 50000; // Low variance

        if (fastActions && highSuccess && consistentTiming) {
            this.signals.concentrated = Math.min(this.signals.concentrated + 1, 5);
            this.log(`Concentration signal +1 (${this.signals.concentrated}) - Avg duration: ${metrics.averageDuration.toFixed(0)}ms, Success: ${((1-metrics.errorRate)*100).toFixed(1)}%`);
        } else {
            this.signals.concentrated = Math.max(this.signals.concentrated - 1, 0);
        }

        // Reset competing signals
        if (this.signals.concentrated > 2) {
            this.signals.frustrated = Math.max(this.signals.frustrated - 1, 0);
            this.signals.exploring = Math.max(this.signals.exploring - 1, 0);
        }
    }

    // ========================================
    // Analyzer: Exploration
    // ========================================

    checkForExploration() {
        const windowSize = 20;
        const metrics = this.history.getMetrics(windowSize);

        if (metrics.total < 10) {
            return;
        }

        const highVariety = metrics.actionVariety > this.getConfig('exploration_variety_threshold');
        
        // Check for pauses (exploration involves thinking)
        const actions = this.history.getLatest(windowSize);
        let pauseCount = 0;
        for (let i = 1; i < actions.length; i++) {
            const gap = actions[i - 1].timestamp - actions[i].timestamp;
            if (gap > this.getConfig('exploration_pause_threshold_ms')) {
                pauseCount++;
            }
        }
        const hasPauses = pauseCount >= 3;

        // Moderate success rate (not frustrated, not perfect)
        const moderateSuccess = metrics.errorRate > 0.1 && metrics.errorRate < 0.4;

        if (highVariety && (hasPauses || moderateSuccess)) {
            this.signals.exploring = Math.min(this.signals.exploring + 1, 5);
            this.log(`Exploration signal +1 (${this.signals.exploring}) - Variety: ${(metrics.actionVariety*100).toFixed(1)}%, Pauses: ${pauseCount}`);
        } else {
            this.signals.exploring = Math.max(this.signals.exploring - 1, 0);
        }

        // Reset concentrated if exploring
        if (this.signals.exploring > 2) {
            this.signals.concentrated = Math.max(this.signals.concentrated - 1, 0);
        }
    }

    // ========================================
    // Analyzer: Learning
    // ========================================

    checkForLearning() {
        const windowSize = this.getConfig('learning_improvement_window');
        const actions = this.history.getLatest(windowSize);

        if (actions.length < windowSize) {
            return;
        }

        // Split into two halves and compare success rates
        const mid = Math.floor(actions.length / 2);
        const firstHalf = actions.slice(mid); // Older
        const secondHalf = actions.slice(0, mid); // Newer

        const firstSuccess = 1 - (firstHalf.filter(a => !a.success).length / firstHalf.length);
        const secondSuccess = 1 - (secondHalf.filter(a => !a.success).length / secondHalf.length);

        const improvement = secondSuccess - firstSuccess;
        const isImproving = improvement > this.getConfig('learning_improvement_threshold');

        if (isImproving) {
            this.signals.learning = Math.min(this.signals.learning + 1, 5);
            this.log(`Learning signal +1 (${this.signals.learning}) - Improvement: ${(improvement*100).toFixed(1)}%`);
        } else {
            this.signals.learning = Math.max(this.signals.learning - 1, 0);
        }
    }

    // ========================================
    // State Evaluation
    // ========================================

    _evaluateStateChange() {
        const threshold = this.getConfig('state_switch_threshold');
        let newState = this.currentState;

        // Priority order: frustrated > concentrated > learning > exploring > neutral
        if (this.signals.frustrated >= threshold) {
            newState = 'frustrated';
        } else if (this.signals.concentrated >= threshold) {
            newState = 'concentrated';
        } else if (this.signals.learning >= threshold) {
            newState = 'learning';
        } else if (this.signals.exploring >= threshold) {
            newState = 'exploring';
        } else {
            // All signals low, return to neutral
            const allLow = Object.values(this.signals).every(s => s < 2);
            if (allLow) {
                newState = 'neutral';
            }
        }

        // State changed?
        if (newState !== this.currentState) {
            this._transitionState(newState);
        }
    }

    _transitionState(newState) {
        const oldState = this.currentState;
        this.previousState = oldState;
        this.currentState = newState;

        this.log(`🧠 State transition: ${oldState} → ${newState}`);

        // Update AppState
        this.setState('user.cognitive_state', newState);

        // Emit global event
        this.emit('cognitive_state:change', {
            from: oldState,
            to: newState,
            signals: { ...this.signals },
            timestamp: performance.now()
        });

        // Emit state-specific event
        this.emit(`cognitive_state:${newState}`, {
            from: oldState,
            timestamp: performance.now()
        });
    }

    // ========================================
    // Utilities
    // ========================================

    _calculateVariance(numbers) {
        if (numbers.length === 0) return 0;
        
        const mean = numbers.reduce((sum, n) => sum + n, 0) / numbers.length;
        const squaredDiffs = numbers.map(n => Math.pow(n - mean, 2));
        return squaredDiffs.reduce((sum, d) => sum + d, 0) / numbers.length;
    }

    // ========================================
    // Public API
    // ========================================

    getCurrentState() {
        return {
            state: this.currentState,
            previousState: this.previousState,
            signals: { ...this.signals },
            history: this.history.getStats()
        };
    }

    getDetailedAnalysis() {
        const metrics = this.history.getMetrics();
        const errorClusters = this.history.getErrorClusters();

        return {
            currentState: this.currentState,
            signals: { ...this.signals },
            metrics: metrics,
            errorClusters: errorClusters,
            recommendations: this._getRecommendations()
        };
    }

    _getRecommendations() {
        const recommendations = [];

        if (this.currentState === 'frustrated') {
            recommendations.push('Slow down interface animations');
            recommendations.push('Increase gesture tolerance zones');
            recommendations.push('Show helpful hints');
            recommendations.push('Reduce complexity of available actions');
        } else if (this.currentState === 'concentrated') {
            recommendations.push('Speed up animations');
            recommendations.push('Reduce dead zones for faster response');
            recommendations.push('Enable advanced gestures');
            recommendations.push('Minimize UI distractions');
        } else if (this.currentState === 'exploring') {
            recommendations.push('Show all available actions');
            recommendations.push('Provide contextual help');
            recommendations.push('Enable experimental features');
            recommendations.push('Allow more time for decisions');
        } else if (this.currentState === 'learning') {
            recommendations.push('Show progress indicators');
            recommendations.push('Provide positive feedback');
            recommendations.push('Gradually introduce new features');
            recommendations.push('Maintain consistent patterns');
        }

        return recommendations;
    }

    /**
     * Force a specific state (for testing/debugging)
     */
    forceState(state) {
        this.log(`Forcing state: ${state}`);
        this._transitionState(state);
    }

    /**
     * Reset cognitive model
     */
    reset() {
        this.history.clear();
        this.signals = {
            frustrated: 0,
            concentrated: 0,
            exploring: 0,
            learning: 0
        };
        this._transitionState('neutral');
    }
}

export default CognitiveModelPlugin;
