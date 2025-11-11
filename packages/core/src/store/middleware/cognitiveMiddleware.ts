/**
 * cognitiveMiddleware.ts
 * 
 * Redux-style middleware that intercepts all actions to analyze user behavior
 * and infer cognitive states in real-time.
 * 
 * Philosophy: "Intelligence as Infrastructure"
 * - Cognitive analysis embedded in the data flow itself
 * - No polling loops - reacts to actual user actions
 * - Deterministic and testable state transitions
 * 
 * Flow:
 *   1. Action dispatched (e.g., navigate, select, error)
 *   2. Middleware intercepts before reducers
 *   3. Records action in session history
 *   4. Analyzes recent metrics
 *   5. If cognitive state changes, dispatches COGNITIVE_STATE_CHANGE
 *   6. Original action continues to reducers
 * 
 * Architecture: "The Quantum Leap"
 * - Replaces timer-based CognitiveModelPlugin
 * - Integrates cognitive intelligence directly into Store flow
 * - Enables real-time adaptation without polling overhead
 */

import type { Action } from '../types';
import type { RootState } from '../reducers';
import type { Middleware, MiddlewareAPI } from '../applyMiddleware';
import { UserSessionHistory } from '../../intelligence/UserSessionHistory';

/**
 * Cognitive state types
 */
export type CognitiveState = 'neutral' | 'frustrated' | 'concentrated' | 'exploring' | 'learning';

/**
 * Action dispatched when cognitive state changes
 */
export interface CognitiveStateChangeAction extends Action {
  type: 'cognitive/STATE_CHANGE';
  payload: {
    previousState: CognitiveState;
    newState: CognitiveState;
    confidence: number;
    signals: CognitiveSignals;
    metrics: SessionMetrics;
    timestamp: number;
  };
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

/**
 * Session metrics snapshot
 */
interface SessionMetrics {
  errorRate: number;
  averageDuration: number;
  recentErrors: number;
  actionVariety: number;
  totalActions: number;
}

/**
 * Middleware configuration
 */
export interface CognitiveMiddlewareConfig {
  /** Size of metrics window to analyze (default: 20) */
  metricsWindow?: number;
  
  /** Threshold for frustrated state (default: 3) */
  frustratedThreshold?: number;
  
  /** Threshold for concentrated state (default: 5) */
  concentratedThreshold?: number;
  
  /** Threshold for exploring state (default: 4) */
  exploringThreshold?: number;
  
  /** Whether to emit debug logs */
  debugMode?: boolean;
}

/**
 * Creates the cognitive middleware with configuration
 */
export function createCognitiveMiddleware(config: CognitiveMiddlewareConfig = {}): Middleware<RootState> {
  // Merge with defaults
  const mergedConfig: Required<CognitiveMiddlewareConfig> = {
    metricsWindow: config.metricsWindow ?? 20,
    frustratedThreshold: config.frustratedThreshold ?? 3,
    concentratedThreshold: config.concentratedThreshold ?? 5,
    exploringThreshold: config.exploringThreshold ?? 4,
    debugMode: config.debugMode ?? false,
  };

  // Initialize session history tracker
  const history = new UserSessionHistory(100); // Circular buffer size

  // State machine state
  let currentState: CognitiveState = 'neutral';
  let signals: CognitiveSignals = {
    frustrated: 0,
    concentrated: 0,
    exploring: 0,
    learning: 0,
  };

  /**
   * The middleware function itself
   * Signature: store => next => action => result
   */
  return (store: MiddlewareAPI<RootState, Action>) => 
    (next: (action: Action) => any) => 
    (action: Action): any => {
      
      // 1. Record action in history (before reducers run)
      recordActionInHistory(action);

      // 2. Let the action pass through to reducers
      const result = next(action);

      // 3. Analyze cognitive state after action is processed
      analyzeCognitiveState(store, action);

      return result;
    };

  /**
   * Records action in session history for cognitive analysis
   */
  function recordActionInHistory(action: Action): void {
    // Extract action metadata
    const actionType = action.type;
    const timestamp = performance.now();
    
    // Determine if action represents success or failure (case-insensitive)
    const actionTypeLower = actionType.toLowerCase();
    const success = !actionTypeLower.includes('error') && !actionTypeLower.includes('fail');
    
    // Calculate duration if available (for navigation actions)
    const duration_ms = (action as any).payload?.metadata?.duration;

    // Record in history
    history.add({
      id: (action as any).payload?.metadata?.actionId || crypto.randomUUID(),
      timestamp,
      type: actionType,
      success,
      duration_ms,
      metadata: (action as any).payload?.metadata,
    });

    if (mergedConfig.debugMode) {
      console.log('[CognitiveMiddleware] Action recorded:', {
        type: actionType,
        success,
        duration_ms,
      });
    }
  }

  /**
   * Analyzes session metrics and transitions cognitive state if needed
   */
  function analyzeCognitiveState(store: MiddlewareAPI<RootState, Action>, triggerAction: Action): void {
    // Get recent metrics from history
    const metrics = history.getMetrics(mergedConfig.metricsWindow);

    if (mergedConfig.debugMode) {
      console.log('[CognitiveMiddleware] Analyzing...', {
        totalActions: metrics.totalActions,
        errorRate: metrics.errorRate,
        avgDuration: metrics.averageDuration,
        recentErrors: metrics.recentErrors,
        actionVariety: metrics.actionVariety,
      });
    }

    // Need minimum data for reliable analysis
    if (metrics.totalActions < 3) {
      if (mergedConfig.debugMode) {
        console.log('[CognitiveMiddleware] Not enough actions for analysis (need 3+, have ' + metrics.totalActions + ')');
      }
      return;
    }

    // Run heuristic analyzers
    checkForFrustration(metrics);
    checkForConcentration(metrics);
    checkForExploration(metrics);

    if (mergedConfig.debugMode) {
      console.log('[MW-DEBUG] After analysis - signals:', { ...signals });
    }

    // Determine new state based on signal strengths
    const newState = determineState();

    if (mergedConfig.debugMode) {
      console.log(`[MW-DEBUG] State determination: newState="${newState}", currentState="${currentState}"`);
    }

    // Transition if state changed
    if (newState !== currentState) {
      if (mergedConfig.debugMode) {
        console.log('[MW-DEBUG] Transition detected! Dispatching STATE_CHANGE...');
      }
      transitionState(store, newState, metrics);
    } else {
      if (mergedConfig.debugMode) {
        console.log('[MW-DEBUG] No state change - newState === currentState');
      }
    }
  }

  /**
   * Detect frustrated user pattern:
   * - High error rate (>40%)
   * - Multiple recent errors (≥3)
   */
  function checkForFrustration(metrics: SessionMetrics): void {
    const frustrated = metrics.errorRate > 0.4 && metrics.recentErrors >= 3;
    
    if (mergedConfig.debugMode) {
      console.log('[MW-DEBUG] checkForFrustration:', {
        errorRate: metrics.errorRate,
        recentErrors: metrics.recentErrors,
        frustrated,
        signalBefore: signals.frustrated,
      });
    }
    
    if (frustrated) {
      signals.frustrated++;
    } else {
      signals.frustrated = 0;
    }

    if (mergedConfig.debugMode) {
      console.log('[MW-DEBUG] checkForFrustration result: signal =', signals.frustrated);
    }
  }

  /**
   * Detect concentrated user pattern:
   * - Fast actions (<400ms average)
   * - Low error rate (<10%)
   */
  function checkForConcentration(metrics: SessionMetrics): void {
    const concentrated = 
      metrics.averageDuration < 400 && 
      metrics.errorRate < 0.1;
    
    if (mergedConfig.debugMode) {
      console.log('[MW-DEBUG] checkForConcentration:', {
        avgDuration: metrics.averageDuration,
        errorRate: metrics.errorRate,
        concentrated,
      });
    }
    
    if (concentrated) {
      signals.concentrated++;
    } else {
      signals.concentrated = 0;
    }
  }

  /**
   * Detect exploring user pattern:
   * - High action variety (≥3 unique types)
   * - Moderate error rate
   */
  function checkForExploration(metrics: SessionMetrics): void {
    const exploring = metrics.actionVariety >= 3 && metrics.errorRate < 0.5;
    
    if (exploring) {
      signals.exploring++;
    } else {
      signals.exploring = 0;
    }
  }

  /**
   * Determine cognitive state based on signal strengths
   * Priority: frustrated > concentrated > exploring > neutral
   */
  function determineState(): CognitiveState {
    // Frustrated takes priority (most important for UX)
    if (signals.frustrated >= mergedConfig.frustratedThreshold) {
      return 'frustrated';
    }

    // Concentrated state
    if (signals.concentrated >= mergedConfig.concentratedThreshold) {
      return 'concentrated';
    }

    // Exploring state
    if (signals.exploring >= mergedConfig.exploringThreshold) {
      return 'exploring';
    }

    // Default to neutral
    return 'neutral';
  }

  /**
   * Transition to new cognitive state
   * Dispatches COGNITIVE_STATE_CHANGE action
   */
  function transitionState(
    store: MiddlewareAPI<RootState, Action>,
    newState: CognitiveState,
    metrics: SessionMetrics
  ): void {
    const previousState = currentState;

    if (mergedConfig.debugMode) {
      console.log('[CognitiveMiddleware] STATE TRANSITION:', {
        from: previousState,
        to: newState,
        signals: { ...signals },
        metrics,
      });
    }

    // Update internal state
    currentState = newState;

    // Calculate confidence based on signal strength
    const maxSignal = Math.max(...Object.values(signals));
    const confidence = Math.min(maxSignal / 10, 1.0);

    // Dispatch state change action
    const action: CognitiveStateChangeAction = {
      type: 'cognitive/STATE_CHANGE',
      payload: {
        previousState,
        newState,
        confidence,
        signals: { ...signals },
        metrics: {
          errorRate: metrics.errorRate,
          averageDuration: metrics.averageDuration,
          recentErrors: metrics.recentErrors,
          actionVariety: metrics.actionVariety,
          totalActions: metrics.totalActions,
        },
        timestamp: performance.now(),
      },
    };

    // Dispatch the action (this will trigger cognitiveReducer)
    store.dispatch(action);
  }
}

/**
 * Action creator for cognitive state changes
 */
export function cognitiveStateChange(
  previousState: CognitiveState,
  newState: CognitiveState,
  confidence: number,
  signals: CognitiveSignals,
  metrics: SessionMetrics
): CognitiveStateChangeAction {
  return {
    type: 'cognitive/STATE_CHANGE',
    payload: {
      previousState,
      newState,
      confidence,
      signals,
      metrics,
      timestamp: performance.now(),
    },
  };
}
