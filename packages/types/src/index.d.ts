/**
 * @navigator.menu/types
 * Core TypeScript definitions for Navigator SDK
 * 
 * This file provides foundational types that will be augmented
 * by auto-generated types from JSDoc annotations.
 */

/**
 * Navigator Intent Protocol (NIP) Event Structure
 */
export interface NipEvent<T = any> {
  /** Namespaced event type (e.g., "input:gesture:swipe_left") */
  type: string;
  
  /** Protocol version (Semantic Versioning) */
  version: string;
  
  /** Timestamp when event was emitted (performance.now()) */
  timestamp: number;
  
  /** Plugin/component that emitted the event */
  source: string;
  
  /** Event-specific payload data */
  payload: T;
  
  /** Optional metadata for tracing, analytics */
  metadata?: {
    traceId?: string;
    userId?: string;
    sessionId?: string;
    [key: string]: any;
  };
}

/**
 * Core Configuration
 */
export interface NavigatorConfig {
  debugMode?: boolean;
  autoStart?: boolean;
  initialState?: Record<string, any>;
  plugins?: PluginConfig[];
  [key: string]: any;
}

/**
 * Plugin Configuration
 */
export interface PluginConfig {
  name: string;
  enabled?: boolean;
  priority?: number;
  options?: Record<string, any>;
}

/**
 * Plugin Interface
 */
export interface IPlugin {
  /** Unique plugin identifier */
  name: string;
  
  /** Plugin priority (higher = loaded first) */
  _priority?: number;
  
  /** Plugin-specific configuration */
  _config?: Record<string, any>;
  
  /** Initialize plugin (required) */
  init(): Promise<void>;
  
  /** Start plugin (optional) */
  start?(): Promise<void>;
  
  /** Stop plugin (optional) */
  stop?(): Promise<void>;
  
  /** Destroy plugin (optional) */
  destroy?(): Promise<void>;
}

/**
 * Event Listener Callback
 */
export type EventListener<T = any> = (payload: T) => void;

/**
 * Event Bus Interface
 */
export interface IEventBus {
  on<T = any>(eventName: string, listener: EventListener<T>): () => void;
  off(eventName: string, listener: EventListener): void;
  emit<T = any>(eventName: string, payload: T): void;
  once<T = any>(eventName: string, listener: EventListener<T>): void;
  clear(): void;
  getHistory(): NipEvent[];
}

/**
 * App State Interface
 */
export interface IAppState {
  get<T = any>(path: string, defaultValue?: T): T;
  set(path: string, value: any): void;
  watch(path: string, callback: (newValue: any, oldValue: any) => void): () => void;
  getState(): Record<string, any>;
  reset(): void;
}

/**
 * Navigator Core Interface
 */
export interface INavigatorCore {
  config: NavigatorConfig;
  eventBus: IEventBus;
  state: IAppState;
  plugins: Map<string, IPlugin>;
  
  init(): Promise<void>;
  start(): Promise<void>;
  stop(): Promise<void>;
  destroy(): Promise<void>;
  
  registerPlugin(plugin: IPlugin, options?: { priority?: number; config?: Record<string, any> }): INavigatorCore;
  getPlugin(name: string): IPlugin | null;
}

/**
 * Cognitive States
 */
export type CognitiveState = 
  | 'neutral'
  | 'frustrated'
  | 'concentrated'
  | 'exploring'
  | 'learning';

/**
 * Input Sources
 */
export type InputSource = 
  | 'gesture'
  | 'keyboard'
  | 'voice'
  | 'system';

/**
 * Position in normalized coordinates (0-1)
 */
export interface Position {
  x: number;
  y: number;
}

/**
 * Gesture Event Payload (Base)
 */
export interface GestureEventPayload {
  distance: number;
  duration_ms: number;
  velocity: number;
  start_pos: Position;
  end_pos: Position;
  confidence: number;
}

/**
 * Cognitive State Change Event Payload
 */
export interface CognitiveStateChangePayload {
  from: CognitiveState;
  to: CognitiveState;
  signals: {
    frustrated: number;
    concentrated: number;
    exploring: number;
    learning: number;
  };
  confidence: number;
}

/**
 * Intent Event Payload
 */
export interface IntentEventPayload {
  source: InputSource;
  confidence: number;
}

/**
 * Navigation Change Event Payload
 */
export interface NavigationChangePayload {
  previous_index: number;
  current_index: number;
  direction: 1 | -1;
  transition_duration_ms?: number;
}

/**
 * Utility Types
 */

/**
 * Make all properties optional recursively
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/**
 * Extract payload type from NIP event type string
 */
export type ExtractPayload<T extends string> =
  T extends 'input:gesture:swipe_left' ? GestureEventPayload :
  T extends 'input:gesture:swipe_right' ? GestureEventPayload :
  T extends 'input:gesture:swipe_up' ? GestureEventPayload :
  T extends 'input:gesture:swipe_down' ? GestureEventPayload :
  T extends 'cognitive_state:change' ? CognitiveStateChangePayload :
  T extends 'intent:navigate_left' ? IntentEventPayload :
  T extends 'intent:navigate_right' ? IntentEventPayload :
  T extends 'navigation:card:change' ? NavigationChangePayload :
  any;

/**
 * Type-safe event emitter
 */
export type TypedEmit = <T extends string>(
  eventName: T,
  payload: ExtractPayload<T>
) => void;

/**
 * Type-safe event listener
 */
export type TypedOn = <T extends string>(
  eventName: T,
  listener: (payload: ExtractPayload<T>) => void
) => () => void;
