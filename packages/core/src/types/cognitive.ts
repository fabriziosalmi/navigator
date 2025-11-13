/**
 * Cognitive Model Types
 * 
 * Type definitions for the cognitive modeling system.
 * These track user state and behavior patterns.
 */

/**
 * User cognitive states for adaptive UX
 */
export type CognitiveState = 
  | 'frustrated'     // High error rate, slow
  | 'concentrated'   // Low error rate, fast
  | 'exploring'      // Varied actions, moderate speed
  | 'learning'       // Initial phase, inconsistent
  | 'neutral';       // Baseline state

/**
 * Cognitive state change event payload
 */
export interface CognitiveStateChangePayload {
  /** Previous cognitive state */
  from: CognitiveState;
  
  /** New cognitive state */
  to: CognitiveState;
  
  /** Confidence in the state detection (0-1) */
  confidence: number;
  
  /** Metrics that triggered the change */
  metrics?: {
    errorRate?: number;
    avgSpeed?: number;
    actionVariety?: number;
  };
  
  /** Signal strength for each cognitive state */
  signals?: {
    frustrated?: number;
    concentrated?: number;
    exploring?: number;
    learning?: number;
  };
}

/**
 * Intent prediction payload
 */
export interface IntentPredictionPayload {
  /** Predicted target element ID */
  targetId?: string;
  
  /** Confidence in the prediction (0-1) */
  confidence: number;
  
  /** Probability distribution over possible targets */
  probabilities?: Record<string, number>;
  
  /** Predicted action type */
  intent?: string;
}
