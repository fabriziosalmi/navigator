/**
 * CognitiveModelPlugin.ts
 * 
 * The "Empathy Engine" - Interprets user behavior and infers cognitive states.
 * 
 * Architecture: State Machine with Heuristic Analyzers
 * - Analyzes session metrics every 500ms
 * - Runs multiple parallel analyzers (frustration, concentration, etc.)
 * - Maintains signal counters that decay over time
 * - Transitions states when signals cross thresholds
 * - Emits NIP events for UI adaptation
 * 
 * States:
 * - neutral: Default state, balanced behavior
 * - frustrated: High error rate, repeated mistakes
 * - concentrated: Fast, accurate actions
 * - exploring: High variety, moderate pace
 * - learning: Increasing performance over time
 */

import type { 
  NavigatorCore, 
  INavigatorPlugin,
  CognitiveState, 
  SessionMetrics,
  CognitiveStateChangePayload 
} from '@navigator.menu/core';

export interface CognitiveModelConfig {
  /** Analysis interval in milliseconds (default: 500) */
  analysisInterval?: number;
  
  /** Size of metrics window to analyze (default: 20) */
  metricsWindow?: number;
  
  /** Threshold for frustrated state (default: 3) */
  frustratedThreshold?: number;
  
  /** Threshold for concentrated state (default: 5) */
  concentratedThreshold?: number;
  
  /** Whether to emit debug logs */
  debugMode?: boolean;
}

/**
 * Internal signal tracking for state transitions
 */
interface CognitiveSignals {
  frustrated: number;
  concentrated: number;
  exploring: number;
  learning: number;
}

export class CognitiveModelPlugin implements INavigatorPlugin {
  public readonly name = 'cognitive-model';
  
  private core: NavigatorCore | null = null;
  private config: Required<CognitiveModelConfig>;
  
  // State machine
  private currentState: CognitiveState = 'neutral';
  private signals: CognitiveSignals = {
    frustrated: 0,
    concentrated: 0,
    exploring: 0,
    learning: 0,
  };
  
  // Analysis loop
  private analysisTimer: ReturnType<typeof setInterval> | null = null;
  
  constructor(config: CognitiveModelConfig = {}) {
    this.config = {
      analysisInterval: config.analysisInterval || 500,
      metricsWindow: config.metricsWindow || 20,
      frustratedThreshold: config.frustratedThreshold || 3,
      concentratedThreshold: config.concentratedThreshold || 5,
      debugMode: config.debugMode || false,
    };
  }

  // ========================================
  // INavigatorPlugin Lifecycle
  // ========================================

  async init(core: NavigatorCore): Promise<void> {
    this.core = core;
    
    // Initialize user.cognitive_state in app state
    core.state.setState('user.cognitive_state', this.currentState);
    
    if (this.config.debugMode) {
      console.log('[CognitiveModel] Initialized', {
        analysisInterval: this.config.analysisInterval,
        metricsWindow: this.config.metricsWindow,
      });
    }
  }

  async start(): Promise<void> {
    if (!this.core) {
      throw new Error('CognitiveModelPlugin: Not initialized');
    }

    // Start analysis loop
    this.analysisTimer = setInterval(
      () => this.analyze(),
      this.config.analysisInterval
    );

    if (this.config.debugMode) {
      console.log('[CognitiveModel] Started analysis loop');
    }
  }

  async stop(): Promise<void> {
    if (this.analysisTimer) {
      clearInterval(this.analysisTimer);
      this.analysisTimer = null;
    }

    if (this.config.debugMode) {
      console.log('[CognitiveModel] Stopped');
    }
  }

  async destroy(): Promise<void> {
    await this.stop();
    this.core = null;
    this.resetSignals();
  }

  // ========================================
  // Analysis Engine
  // ========================================

  /**
   * Main analysis method - runs every analysisInterval
   * Examines recent session metrics and updates cognitive state
   */
  private analyze(): void {
    if (!this.core) return;

    // Get metrics from session history
    const metrics = this.core.history.getMetrics(this.config.metricsWindow);

    // 🔍 SONDA #2: Sempre attiva per debugging
    console.log('[DIAGNOSTIC] Analyzing history...', { 
      totalActions: this.core.history.getAll().length,
      errorRate: metrics.errorRate,
      avgSpeed: metrics.averageDuration,
      recentErrors: metrics.recentErrors,
      actionVariety: metrics.actionVariety
    });

    // Need minimum data for reliable analysis
    if (metrics.totalActions < 3) {
      console.log('[DIAGNOSTIC] Not enough actions for analysis (need 3+, have ' + metrics.totalActions + ')');
      return;
    }

    // Run all analyzers
    this._checkForFrustration(metrics);
    this._checkForConcentration(metrics);
    this._checkForExploration(metrics);

    // Determine new state based on signals
    const newState = this._determineState();

    // Transition if state changed
    if (newState !== this.currentState) {
      this._transitionState(newState, metrics);
    }

    if (this.config.debugMode) {
      console.log('[CognitiveModel] Analysis:', {
        metrics: {
          errorRate: metrics.errorRate.toFixed(2),
          avgDuration: Math.round(metrics.averageDuration),
          variety: metrics.actionVariety,
        },
        signals: { ...this.signals },
        state: this.currentState,
      });
    }
  }

  // ========================================
  // Heuristic Analyzers
  // ========================================

  /**
   * Detect frustrated user pattern:
   * - High error rate (>40%)
   * - Multiple recent errors (≥3)
   * Signal increments when condition met, resets when not
   */
  private _checkForFrustration(metrics: SessionMetrics): void {
    const frustrated = metrics.errorRate > 0.4 && metrics.recentErrors >= 3;
    
    if (frustrated) {
      this.signals.frustrated++;
    } else {
      this.signals.frustrated = 0;
    }
  }

  /**
   * Detect concentrated user pattern:
   * - Fast actions (<400ms average)
   * - Low error rate (<10%)
   * Signal increments when condition met, resets when not
   */
  private _checkForConcentration(metrics: SessionMetrics): void {
    const concentrated = 
      metrics.averageDuration < 400 && 
      metrics.errorRate < 0.1;
    
    if (concentrated) {
      this.signals.concentrated++;
    } else {
      this.signals.concentrated = 0;
    }
  }

  /**
   * Detect exploring user pattern:
   * - High action variety (≥3 unique types)
   * - Moderate pace
   */
  private _checkForExploration(metrics: SessionMetrics): void {
    const exploring = metrics.actionVariety >= 3 && metrics.errorRate < 0.5;
    
    if (exploring) {
      this.signals.exploring++;
    } else {
      this.signals.exploring = 0;
    }
  }

  // ========================================
  // State Machine
  // ========================================

  /**
   * Determine cognitive state based on signal strengths
   * Priority: frustrated > concentrated > exploring > neutral
   */
  private _determineState(): CognitiveState {
    // Frustrated takes priority (most important for UX)
    if (this.signals.frustrated >= this.config.frustratedThreshold) {
      return 'frustrated';
    }

    // Concentrated state
    if (this.signals.concentrated >= this.config.concentratedThreshold) {
      return 'concentrated';
    }

    // Exploring state
    if (this.signals.exploring >= 4) {
      return 'exploring';
    }

    // Default to neutral
    return 'neutral';
  }

  /**
   * Transition to a new cognitive state
   * Updates app state and emits NIP event
   */
  private _transitionState(newState: CognitiveState, metrics: SessionMetrics): void {
    if (!this.core) return;

    const oldState = this.currentState;
    
    // 🔍 SONDA #3: Sempre attiva per debugging
    console.log(`[DIAGNOSTIC] STATE TRANSITION DETECTED! From: ${oldState}, To: ${newState}`, {
      signals: { ...this.signals },
      metrics: {
        errorRate: metrics.errorRate,
        avgDuration: metrics.averageDuration,
        recentErrors: metrics.recentErrors
      }
    });
    
    this.currentState = newState;

    // Update app state
    this.core.state.setState('user.cognitive_state', newState);

    // Calculate confidence based on signal strength
    const maxSignal = Math.max(...Object.values(this.signals));
    const confidence = Math.min(maxSignal / 10, 1.0);

    // Emit NIP event for UI adaptation
    const payload: CognitiveStateChangePayload = {
      from: oldState,
      to: newState,
      signals: { ...this.signals },
      confidence,
      metrics,
    };

    this.core.eventBus.emit('system_state:change', {
      property: 'cognitive_state',
      ...payload,
    });

    if (this.config.debugMode) {
      console.log(`[CognitiveModel] State transition: ${oldState} → ${newState}`, {
        confidence: confidence.toFixed(2),
        signals: this.signals,
      });
    }
  }

  /**
   * Reset all signal counters
   */
  private resetSignals(): void {
    this.signals = {
      frustrated: 0,
      concentrated: 0,
      exploring: 0,
      learning: 0,
    };
  }

  // ========================================
  // Public API
  // ========================================

  /**
   * Get current cognitive state
   */
  getCurrentState(): CognitiveState {
    return this.currentState;
  }

  /**
   * Get current signal strengths
   */
  getSignals(): Readonly<CognitiveSignals> {
    return { ...this.signals };
  }
}
