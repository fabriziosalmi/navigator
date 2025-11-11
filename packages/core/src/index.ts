/**
 * @navigator.menu/core
 * 
 * Core event-driven architecture for Navigator
 * 
 * @module @navigator.menu/core
 */

export { EventBus } from './EventBus';
export { AppState } from './AppState';
export { NavigatorCore } from './NavigatorCore';
export { UserSessionHistory } from './intelligence/UserSessionHistory';

// --- ARCHITECTURAL FIX: RE-EXPORT PUBLIC TYPES ---
// Core acts as the single source of truth for all SDK types.
// Plugins should import from @navigator.menu/core, not @navigator.menu/types directly.
export type {
  // Core SDK Types
  Action,
  SessionMetrics,
  
  // Event Protocol
  NipEvent,
  EventListener,
  
  // Configuration
  NavigatorConfig,
  PluginConfig,
  
  // Plugin Interfaces
  IPlugin,
  IEventBus,
  IAppState,
  INavigatorCore,
  
  // Cognitive Intelligence
  CognitiveState,
  CognitiveStateChangePayload,
  IntentPredictionPayload,
  
  // Gesture System
  InputSource,
  Position,
  GestureEventPayload,
  RawGestureUpdatePayload,
  
  // Navigation
  IntentEventPayload,
  NavigationChangePayload,
  
  // Utilities
  DeepPartial,
  ExtractPayload,
} from '@navigator.menu/types';

// Core-specific types
export type {
  NavigatorEvent,
  EventHandler,
  EventMiddleware,
  UnsubscribeFunction,
  SubscriptionOptions,
  EventBusOptions,
  EventStats
} from './types';
export type {
  NavigatorState,
  ComputedProperties
} from './AppState';
export type {
  NavigatorCoreConfig,
  INavigatorPlugin,
  PluginOptions
} from './NavigatorCore';

