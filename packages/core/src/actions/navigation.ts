/**
 * Navigation Action Creators
 * 
 * Sprint 2: These are action creators for the unidirectional navigation flow.
 * They are used by input plugins (keyboard, gesture, voice) to dispatch
 * navigation actions to the store.
 */

/**
 * Action type constant for navigation
 */
export const NAVIGATE = 'navigation/NAVIGATE' as const;

/**
 * Direction type for navigation actions
 */
export type NavigationDirection = 'left' | 'right' | 'up' | 'down';

/**
 * Input source for tracking where the navigation came from
 */
export type NavigationSource = 'keyboard' | 'gesture' | 'voice' | 'system';

/**
 * Navigation action payload
 */
export interface NavigatePayload {
  /** Direction of navigation */
  direction: NavigationDirection;
  
  /** Source of the input (for analytics/debugging) */
  source: NavigationSource;
  
  /** Optional metadata */
  metadata?: {
    timestamp?: number;
    [key: string]: any;
  };
}

/**
 * Navigate action interface
 */
export interface NavigateAction {
  type: typeof NAVIGATE;
  payload: NavigatePayload;
}

/**
 * Action creator for navigation
 * 
 * @param direction - Direction to navigate
 * @param source - Source of the navigation input
 * @returns NavigateAction
 * 
 * @example
 * ```ts
 * const action = navigate('right', 'keyboard');
 * store.dispatch(action);
 * ```
 */
export function navigate(
  direction: NavigationDirection,
  source: NavigationSource,
  metadata?: NavigatePayload['metadata']
): NavigateAction {
  return {
    type: NAVIGATE,
    payload: {
      direction,
      source,
      metadata: {
        timestamp: performance.now(),
        ...metadata,
      },
    },
  };
}
