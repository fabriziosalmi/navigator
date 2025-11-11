/**
 * @file inputReducer.ts
 * @description Input State Slice Reducer
 * 
 * Manages the unified input state for keyboard, gesture, and voice inputs.
 * Tracks which input sources are enabled, their last interactions, and quality metrics.
 */

import type { Action, Reducer } from '../types';

/**
 * Navigation Source (from actions/navigation.ts)
 */
export type NavigationSource = 'keyboard' | 'gesture' | 'voice' | 'system';

/**
 * Keyboard Input State
 */
export interface KeyboardInputState {
  readonly enabled: boolean;
  readonly lastKey: string | null;
  readonly lastTimestamp: number | null;
  readonly activeKeys: readonly string[];
}

/**
 * Gesture Input State
 */
export interface GestureInputState {
  readonly enabled: boolean;
  readonly lastGesture: string | null;
  readonly lastTimestamp: number | null;
  readonly confidence: number;
}

/**
 * Voice Input State
 */
export interface VoiceInputState {
  readonly enabled: boolean;
  readonly lastCommand: string | null;
  readonly lastTimestamp: number | null;
  readonly confidence: number;
  readonly isListening: boolean;
}

/**
 * Input State
 */
export interface InputState {
  readonly keyboard: KeyboardInputState;
  readonly gesture: GestureInputState;
  readonly voice: VoiceInputState;
  readonly activeSource: NavigationSource | null;
}

/**
 * Input Actions
 */
export const INPUT_ACTIONS = {
  // Keyboard
  KEYBOARD_ENABLED: 'input/KEYBOARD_ENABLED' as const,
  KEYBOARD_DISABLED: 'input/KEYBOARD_DISABLED' as const,
  KEYBOARD_KEY_PRESS: 'input/KEYBOARD_KEY_PRESS' as const,
  KEYBOARD_KEY_RELEASE: 'input/KEYBOARD_KEY_RELEASE' as const,
  
  // Gesture
  GESTURE_ENABLED: 'input/GESTURE_ENABLED' as const,
  GESTURE_DISABLED: 'input/GESTURE_DISABLED' as const,
  GESTURE_DETECTED: 'input/GESTURE_DETECTED' as const,
  
  // Voice
  VOICE_ENABLED: 'input/VOICE_ENABLED' as const,
  VOICE_DISABLED: 'input/VOICE_DISABLED' as const,
  VOICE_COMMAND: 'input/VOICE_COMMAND' as const,
  VOICE_LISTENING_STARTED: 'input/VOICE_LISTENING_STARTED' as const,
  VOICE_LISTENING_STOPPED: 'input/VOICE_LISTENING_STOPPED' as const,
  
  // General
  SET_ACTIVE_SOURCE: 'input/SET_ACTIVE_SOURCE' as const,
  RESET: 'input/RESET' as const,
} as const;

/**
 * Action Creators for Input Events
 */

// Keyboard action creators
export const keyPress = (key: string, timestamp: number = Date.now()) => ({
  type: INPUT_ACTIONS.KEYBOARD_KEY_PRESS,
  payload: { key, timestamp },
} as const);

export const keyRelease = (key: string, timestamp: number = Date.now()) => ({
  type: INPUT_ACTIONS.KEYBOARD_KEY_RELEASE,
  payload: { key, timestamp },
} as const);

// Gesture action creators
export const gestureDetected = (
  gesture: string, 
  confidence: number, 
  timestamp: number = Date.now()
) => ({
  type: INPUT_ACTIONS.GESTURE_DETECTED,
  payload: { gesture, confidence, timestamp },
} as const);

// Voice action creators
export const voiceCommand = (
  command: string,
  confidence: number,
  timestamp: number = Date.now()
) => ({
  type: INPUT_ACTIONS.VOICE_COMMAND,
  payload: { command, confidence, timestamp },
} as const);

/**
 * Initial keyboard state
 */
const keyboardInitialState: KeyboardInputState = {
  enabled: false,
  lastKey: null,
  lastTimestamp: null,
  activeKeys: [],
};

/**
 * Initial gesture state
 */
const gestureInitialState: GestureInputState = {
  enabled: false,
  lastGesture: null,
  lastTimestamp: null,
  confidence: 0,
};

/**
 * Initial voice state
 */
const voiceInitialState: VoiceInputState = {
  enabled: false,
  lastCommand: null,
  lastTimestamp: null,
  confidence: 0,
  isListening: false,
};

/**
 * Initial input state
 */
export const inputInitialState: InputState = {
  keyboard: keyboardInitialState,
  gesture: gestureInitialState,
  voice: voiceInitialState,
  activeSource: null,
};

/**
 * Input Reducer
 * 
 * Handles all input-related actions across keyboard, gesture, and voice.
 * Maintains immutability and tracks active input source.
 */
export const inputReducer: Reducer<InputState, Action> = (
  state = inputInitialState,
  action
) => {
  switch (action.type) {
    // ========================================
    // KEYBOARD ACTIONS
    // ========================================
    
    case INPUT_ACTIONS.KEYBOARD_ENABLED:
      return {
        ...state,
        keyboard: { ...state.keyboard, enabled: true },
      };
    
    case INPUT_ACTIONS.KEYBOARD_DISABLED:
      return {
        ...state,
        keyboard: { ...state.keyboard, enabled: false, activeKeys: [] },
      };
    
    case INPUT_ACTIONS.KEYBOARD_KEY_PRESS: {
      const { key, timestamp = Date.now() } = action.payload as { key: string; timestamp?: number };
      const activeKeys = state.keyboard.activeKeys.includes(key)
        ? state.keyboard.activeKeys
        : [...state.keyboard.activeKeys, key];
      
      return {
        ...state,
        keyboard: {
          ...state.keyboard,
          lastKey: key,
          lastTimestamp: timestamp,
          activeKeys,
        },
        activeSource: 'keyboard',
      };
    }
    
    case INPUT_ACTIONS.KEYBOARD_KEY_RELEASE: {
      const { key } = action.payload as { key: string };
      const activeKeys = state.keyboard.activeKeys.filter((k: string) => k !== key);
      
      return {
        ...state,
        keyboard: {
          ...state.keyboard,
          activeKeys,
        },
      };
    }
    
    // ========================================
    // GESTURE ACTIONS
    // ========================================
    
    case INPUT_ACTIONS.GESTURE_ENABLED:
      return {
        ...state,
        gesture: { ...state.gesture, enabled: true },
      };
    
    case INPUT_ACTIONS.GESTURE_DISABLED:
      return {
        ...state,
        gesture: { ...state.gesture, enabled: false },
      };
    
    case INPUT_ACTIONS.GESTURE_DETECTED: {
      const { gesture, confidence = 0, timestamp = Date.now() } = action.payload as {
        gesture: string;
        confidence?: number;
        timestamp?: number;
      };
      
      return {
        ...state,
        gesture: {
          ...state.gesture,
          lastGesture: gesture,
          lastTimestamp: timestamp,
          confidence,
        },
        activeSource: 'gesture',
      };
    }
    
    // ========================================
    // VOICE ACTIONS
    // ========================================
    
    case INPUT_ACTIONS.VOICE_ENABLED:
      return {
        ...state,
        voice: { ...state.voice, enabled: true },
      };
    
    case INPUT_ACTIONS.VOICE_DISABLED:
      return {
        ...state,
        voice: { ...state.voice, enabled: false, isListening: false },
      };
    
    case INPUT_ACTIONS.VOICE_COMMAND: {
      const { command, confidence = 0, timestamp = Date.now() } = action.payload as {
        command: string;
        confidence?: number;
        timestamp?: number;
      };
      
      return {
        ...state,
        voice: {
          ...state.voice,
          lastCommand: command,
          lastTimestamp: timestamp,
          confidence,
        },
        activeSource: 'voice',
      };
    }
    
    case INPUT_ACTIONS.VOICE_LISTENING_STARTED:
      return {
        ...state,
        voice: { ...state.voice, isListening: true },
      };
    
    case INPUT_ACTIONS.VOICE_LISTENING_STOPPED:
      return {
        ...state,
        voice: { ...state.voice, isListening: false },
      };
    
    // ========================================
    // GENERAL ACTIONS
    // ========================================
    
    case INPUT_ACTIONS.SET_ACTIVE_SOURCE: {
      const { source } = action.payload as { source: NavigationSource | null };
      return {
        ...state,
        activeSource: source,
      };
    }
    
    case INPUT_ACTIONS.RESET:
      return inputInitialState;
    
    default:
      return state;
  }
};
