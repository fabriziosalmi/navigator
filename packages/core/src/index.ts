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
  ComputedProperties,
  DeepPartial
} from './AppState';
export type {
  NavigatorCoreConfig,
  INavigatorPlugin,
  PluginOptions
} from './NavigatorCore';
