/**
 * @file State.ts
 * @description Store State Shape definitions
 * 
 * Defines the complete state tree structure for the Navigator Redux store.
 * Every slice of state is immutable, serializable, and type-safe.
 * 
 * State Design Principles:
 * 1. Normalization: Avoid nested/duplicated data
 * 2. Immutability: All properties readonly
 * 3. Serializability: No functions, Symbols, class instances
 * 4. Type Safety: Explicit types for all fields
 */

// Import shared types from actions
import type { NavigationDirection, NavigationSource } from '../actions/navigation';

/**
 * ============================================================================
 * NAVIGATION STATE SLICE
 * ============================================================================
 * 
 * Manages carousel navigation state.
 * Tracks current position, navigation history, and animation state.
 */

/**
 * History entry for navigation tracking
 */
export interface NavigationHistoryEntry {
  /** Index navigated to */
  readonly index: number;
  
  /** Direction of navigation */
  readonly direction: NavigationDirection;
  
  /** Source of navigation */
  readonly source: NavigationSource;
  
  /** Timestamp (performance.now()) */
  readonly timestamp: number;
}

/**
 * Navigation State Slice
 */
export interface NavigationState {
  /** Current carousel index */
  readonly currentIndex: number;
  
  /** Last navigation direction */
  readonly lastDirection: NavigationDirection | null;
  
  /** Last navigation source */
  readonly lastSource: NavigationSource | null;
  
  /** Navigation history (max 50 entries) */
  readonly history: readonly NavigationHistoryEntry[];
  
  /** Is navigation currently animating */
  readonly isAnimating: boolean;
  
  /** Total number of items in carousel */
  readonly totalItems: number;
  
  /** Enable wrap-around navigation */
  readonly wrapAround: boolean;
}

/**
 * Initial navigation state
 */
export const navigationInitialState: NavigationState = {
  currentIndex: 0,
  lastDirection: null,
  lastSource: null,
  history: [],
  isAnimating: false,
  totalItems: 0,
  wrapAround: true,
};

/**
 * ============================================================================
 * COGNITIVE STATE SLICE
 * ============================================================================
 * 
 * Manages user cognitive/mental state detection.
 * Tracks user's concentration, frustration, exploration patterns.
 */

/**
 * Cognitive state types
 */
export type CognitiveStateType = 'neutral' | 'concentrated' | 'frustrated' | 'exploring';

/**
 * Signal that contributed to cognitive state detection
 */
export interface CognitiveSignal {
  /** Signal name (e.g., 'errorRate', 'avgDuration') */
  readonly name: string;
  
  /** Signal value */
  readonly value: number;
  
  /** Signal weight in decision */
  readonly weight: number;
}

/**
 * Cognitive metrics snapshot
 */
export interface CognitiveMetrics {
  /** Error rate (0-1) */
  readonly errorRate: number;
  
  /** Average action duration (ms) */
  readonly avgDuration: number;
  
  /** Number of recent errors */
  readonly recentErrors: number;
  
  /** Action variety score (0-1) */
  readonly actionVariety: number;
  
  /** Total actions processed */
  readonly totalActions: number;
}

/**
 * Cognitive State Slice
 */
export interface CognitiveState {
  /** Current detected state */
  readonly currentState: CognitiveStateType;
  
  /** Previous state (for transition tracking) */
  readonly previousState: CognitiveStateType | null;
  
  /** Confidence score (0-1) */
  readonly confidence: number;
  
  /** Timestamp of last state change */
  readonly lastUpdate: number | null;
  
  /** Signals that led to current state */
  readonly signals: readonly CognitiveSignal[];
  
  /** Current cognitive metrics */
  readonly metrics: CognitiveMetrics;
}

/**
 * Initial cognitive state
 */
export const cognitiveInitialState: CognitiveState = {
  currentState: 'neutral',
  previousState: null,
  confidence: 0,
  lastUpdate: null,
  signals: [],
  metrics: {
    errorRate: 0,
    avgDuration: 0,
    recentErrors: 0,
    actionVariety: 0,
    totalActions: 0,
  },
};

/**
 * ============================================================================
 * INPUT STATE SLICE
 * ============================================================================
 * 
 * Manages input device states (keyboard, gesture, voice).
 * Tracks active inputs, recent interactions, input quality.
 */

/**
 * Keyboard input state
 */
export interface KeyboardInputState {
  /** Is keyboard input enabled */
  readonly enabled: boolean;
  
  /** Last key pressed */
  readonly lastKey: string | null;
  
  /** Timestamp of last key press */
  readonly lastTimestamp: number | null;
  
  /** Keys currently held down */
  readonly activeKeys: readonly string[];
}

/**
 * Gesture input state
 */
export interface GestureInputState {
  /** Is gesture input enabled */
  readonly enabled: boolean;
  
  /** Last detected gesture */
  readonly lastGesture: string | null;
  
  /** Timestamp of last gesture */
  readonly lastTimestamp: number | null;
  
  /** Gesture confidence (0-1) */
  readonly confidence: number;
}

/**
 * Voice input state
 */
export interface VoiceInputState {
  /** Is voice input enabled */
  readonly enabled: boolean;
  
  /** Last recognized command */
  readonly lastCommand: string | null;
  
  /** Timestamp of last command */
  readonly lastTimestamp: number | null;
  
  /** Recognition confidence (0-1) */
  readonly confidence: number;
  
  /** Is currently listening */
  readonly isListening: boolean;
}

/**
 * Input State Slice
 */
export interface InputState {
  /** Keyboard input state */
  readonly keyboard: KeyboardInputState;
  
  /** Gesture input state */
  readonly gesture: GestureInputState;
  
  /** Voice input state */
  readonly voice: VoiceInputState;
  
  /** Currently active input source */
  readonly activeSource: NavigationSource | null;
}

/**
 * Initial input state
 */
export const inputInitialState: InputState = {
  keyboard: {
    enabled: false,
    lastKey: null,
    lastTimestamp: null,
    activeKeys: [],
  },
  gesture: {
    enabled: false,
    lastGesture: null,
    lastTimestamp: null,
    confidence: 0,
  },
  voice: {
    enabled: false,
    lastCommand: null,
    lastTimestamp: null,
    confidence: 0,
    isListening: false,
  },
  activeSource: null,
};

/**
 * ============================================================================
 * UI STATE SLICE
 * ============================================================================
 * 
 * Manages UI-specific state (loading, errors, theme, debug mode).
 * This state is purely presentational and ephemeral.
 */

/**
 * Error entry in UI
 */
export interface UIError {
  /** Unique error ID */
  readonly id: string;
  
  /** Error message */
  readonly message: string;
  
  /** Error severity */
  readonly severity: 'info' | 'warning' | 'error';
  
  /** Timestamp when error occurred */
  readonly timestamp: number;
  
  /** Is error dismissed */
  readonly dismissed: boolean;
}

/**
 * Theme type
 */
export type ThemeType = 'light' | 'dark' | 'auto';

/**
 * UI State Slice
 */
export interface UIState {
  /** Global loading state */
  readonly isLoading: boolean;
  
  /** Active errors/notifications */
  readonly errors: readonly UIError[];
  
  /** Current theme */
  readonly theme: ThemeType;
  
  /** Is debug mode enabled */
  readonly debugMode: boolean;
  
  /** Is DevTools open */
  readonly devToolsOpen: boolean;
  
  /** UI animation speed multiplier (0.1-2.0) */
  readonly animationSpeed: number;
}

/**
 * Initial UI state
 */
export const uiInitialState: UIState = {
  isLoading: false,
  errors: [],
  theme: 'auto',
  debugMode: false,
  devToolsOpen: false,
  animationSpeed: 1.0,
};

/**
 * ============================================================================
 * ROOT STATE
 * ============================================================================
 * 
 * Complete application state tree.
 * Combination of all state slices.
 */

/**
 * Root State Interface
 * 
 * This is the complete state shape for the Navigator store.
 * Every field is readonly and serializable.
 * 
 * @example
 * ```ts
 * const state: RootState = store.getState();
 * console.log(state.navigation.currentIndex);
 * console.log(state.cognitive.currentState);
 * ```
 */
export interface RootState {
  /** Navigation state slice */
  readonly navigation: NavigationState;
  
  /** Cognitive state slice */
  readonly cognitive: CognitiveState;
  
  /** Input state slice */
  readonly input: InputState;
  
  /** UI state slice */
  readonly ui: UIState;
}

/**
 * Initial root state
 * 
 * Used when creating the store without preloaded state.
 */
export const rootInitialState: RootState = {
  navigation: navigationInitialState,
  cognitive: cognitiveInitialState,
  input: inputInitialState,
  ui: uiInitialState,
};

/**
 * ============================================================================
 * STATE SELECTORS (Type Helpers)
 * ============================================================================
 */

/**
 * Extract slice state type from RootState
 * 
 * @example
 * ```ts
 * type NavState = SliceState<'navigation'>; // NavigationState
 * ```
 */
export type SliceState<K extends keyof RootState> = RootState[K];

/**
 * Type guard for checking if state is RootState
 */
export function isRootState(state: any): state is RootState {
  return (
    state !== null &&
    typeof state === 'object' &&
    'navigation' in state &&
    'cognitive' in state &&
    'input' in state &&
    'ui' in state
  );
}

/**
 * Deep partial type for state hydration
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/**
 * Preloaded state type (for hydration from localStorage, etc.)
 */
export type PreloadedRootState = DeepPartial<RootState>;
