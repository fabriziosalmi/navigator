/**
 * @file interaction.ts
 * @description User Interaction Actions
 * 
 * Actions for user interactions like selection, cancellation, confirmation.
 * These replace legacy intent:select and intent:cancel events.
 */

/**
 * Interaction action types
 */
export const SELECT = 'interaction/SELECT' as const;
export const CANCEL = 'interaction/CANCEL' as const;
export const CONFIRM = 'interaction/CONFIRM' as const;

/**
 * Select action payload
 */
export interface SelectPayload {
  /**
   * The target element or context being selected
   */
  target?: string;

  /**
   * Source of the interaction
   */
  source: 'keyboard' | 'mouse' | 'touch' | 'voice';

  /**
   * Metadata about the selection
   */
  metadata?: {
    timestamp: number;
    [key: string]: any;
  };
}

/**
 * Cancel action payload
 */
export interface CancelPayload {
  /**
   * What is being cancelled
   */
  context?: string;

  /**
   * Source of the interaction
   */
  source: 'keyboard' | 'mouse' | 'touch' | 'voice';

  /**
   * Metadata about the cancellation
   */
  metadata?: {
    timestamp: number;
    [key: string]: any;
  };
}

/**
 * Confirm action payload
 */
export interface ConfirmPayload {
  /**
   * What is being confirmed
   */
  action: string;

  /**
   * Source of the interaction
   */
  source: 'keyboard' | 'mouse' | 'touch' | 'voice';

  /**
   * Metadata about the confirmation
   */
  metadata?: {
    timestamp: number;
    [key: string]: any;
  };
}

/**
 * Select action type
 */
export interface SelectAction {
  type: typeof SELECT;
  payload: SelectPayload;
}

/**
 * Cancel action type
 */
export interface CancelAction {
  type: typeof CANCEL;
  payload: CancelPayload;
}

/**
 * Confirm action type
 */
export interface ConfirmAction {
  type: typeof CONFIRM;
  payload: ConfirmPayload;
}

/**
 * Union of all interaction actions
 */
export type InteractionAction = SelectAction | CancelAction | ConfirmAction;

/**
 * Action creator for SELECT
 * 
 * @param source - The source of the selection
 * @param target - Optional target being selected
 * @returns Select action
 * 
 * @example
 * ```ts
 * store.dispatch(select('keyboard'));
 * store.dispatch(select('mouse', 'card-3'));
 * ```
 */
export function select(
    source: SelectPayload['source'],
    target?: string
): SelectAction {
    return {
        type: SELECT,
        payload: {
            target,
            source,
            metadata: {
                timestamp: Date.now()
            }
        }
    };
}

/**
 * Action creator for CANCEL
 * 
 * @param source - The source of the cancellation
 * @param context - Optional context being cancelled
 * @returns Cancel action
 * 
 * @example
 * ```ts
 * store.dispatch(cancel('keyboard'));
 * store.dispatch(cancel('keyboard', 'modal'));
 * ```
 */
export function cancel(
    source: CancelPayload['source'],
    context?: string
): CancelAction {
    return {
        type: CANCEL,
        payload: {
            context,
            source,
            metadata: {
                timestamp: Date.now()
            }
        }
    };
}

/**
 * Action creator for CONFIRM
 * 
 * @param source - The source of the confirmation
 * @param action - The action being confirmed
 * @returns Confirm action
 * 
 * @example
 * ```ts
 * store.dispatch(confirm('keyboard', 'delete-item'));
 * ```
 */
export function confirm(
    source: ConfirmPayload['source'],
    action: string
): ConfirmAction {
    return {
        type: CONFIRM,
        payload: {
            action,
            source,
            metadata: {
                timestamp: Date.now()
            }
        }
    };
}
