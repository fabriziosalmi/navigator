/**
 * DomRendererPlugin.ts
 * 
 * UI Adaptation Layer - Reacts to cognitive states and intent predictions.
 * 
 * Responsibilities:
 * - Listen to system_state:change events from CognitiveModelPlugin
 * - Apply CSS classes to <body> for cognitive state adaptation
 * - Listen to intent:prediction events from IntentPredictorPlugin
 * - Apply preloading visual hints to predicted targets
 * - Manage debug mode visual indicators
 * 
 * CSS Integration:
 * - Adds .state-{cognitiveState} classes to <body>
 * - cognitive-states.css responds with animation/UI adjustments
 * - Adds .card--preloading to predicted navigation targets
 */

import type { NavigatorCore, INavigatorPlugin } from '@navigator.menu/core';
import type { CognitiveState } from '@navigator.menu/types';

export interface DomRendererConfig {
  /** Root element selector (default: 'body') */
  rootSelector?: string;
  
  /** Enable debug mode visual indicators */
  debugMode?: boolean;
  
  /** Enable cognitive state CSS classes */
  enableCognitiveStates?: boolean;
  
  /** Enable intent prediction preloading */
  enableIntentPreloading?: boolean;
}

export class DomRendererPlugin implements INavigatorPlugin {
  public readonly name = 'dom-renderer';
  
  private config: Required<DomRendererConfig>;
  private rootElement: HTMLElement | null = null;
  
  // State tracking
  private currentCognitiveState: CognitiveState = 'neutral';
  private unsubscribers: Array<() => void> = [];

  constructor(config: DomRendererConfig = {}) {
    this.config = {
      rootSelector: config.rootSelector || 'body',
      debugMode: config.debugMode || false,
      enableCognitiveStates: config.enableCognitiveStates !== false,
      enableIntentPreloading: config.enableIntentPreloading !== false,
    };
  }

  // ========================================
  // INavigatorPlugin Lifecycle
  // ========================================

  async init(core: NavigatorCore): Promise<void> {
    // Find root element
    this.rootElement = document.querySelector(this.config.rootSelector);
    
    if (!this.rootElement) {
      console.warn(`[DomRenderer] Root element "${this.config.rootSelector}" not found`);
      return;
    }

    // Subscribe to events
    if (this.config.enableCognitiveStates) {
      const unsubStateChange = core.eventBus.on('system_state:change', 
        this.handleCognitiveStateChange.bind(this)
      );
      this.unsubscribers.push(unsubStateChange);
    }

    if (this.config.enableIntentPreloading) {
      const unsubPrediction = core.eventBus.on('intent:prediction', 
        this.handleIntentPrediction.bind(this)
      );
      this.unsubscribers.push(unsubPrediction);
    }

    // Set initial state
    if (this.config.debugMode && this.rootElement) {
      this.rootElement.setAttribute('data-debug', 'true');
      this.rootElement.setAttribute('data-cognitive-state', this.currentCognitiveState);
    }

    if (this.config.debugMode) {
      console.log('[DomRenderer] Initialized', {
        rootSelector: this.config.rootSelector,
        enableCognitiveStates: this.config.enableCognitiveStates,
        enableIntentPreloading: this.config.enableIntentPreloading,
      });
    }
  }

  async start(): Promise<void> {
    if (this.config.debugMode) {
      console.log('[DomRenderer] Started');
    }
  }

  async stop(): Promise<void> {
    // Remove all state classes
    if (this.rootElement && this.config.enableCognitiveStates) {
      this.removeAllCognitiveStateClasses();
    }

    if (this.config.debugMode) {
      console.log('[DomRenderer] Stopped');
    }
  }

  async destroy(): Promise<void> {
    // Unsubscribe from all events
    this.unsubscribers.forEach(unsub => unsub());
    this.unsubscribers = [];
    
    // Cleanup DOM
    if (this.rootElement) {
      this.removeAllCognitiveStateClasses();
      
      if (this.config.debugMode) {
        this.rootElement.removeAttribute('data-debug');
        this.rootElement.removeAttribute('data-cognitive-state');
      }
    }
    
    this.rootElement = null;
  }

  // ========================================
  // Event Handlers
  // ========================================

  /**
   * Handle cognitive state changes from CognitiveModelPlugin
   * Updates body classes for CSS-based UI adaptation
   */
  private handleCognitiveStateChange(event: any): void {
    if (!this.rootElement) return;

    const payload = event.payload || event;
    const { to: newState, from: oldState, confidence } = payload;

    if (this.config.debugMode) {
      console.log('[DomRenderer] Cognitive state change:', {
        from: oldState,
        to: newState,
        confidence: confidence?.toFixed(2),
      });
    }

    // Remove old state class
    if (oldState) {
      this.rootElement.classList.remove(`state-${oldState}`);
    }

    // Add new state class
    this.rootElement.classList.add(`state-${newState}`);
    this.currentCognitiveState = newState;

    // Update debug indicator
    if (this.config.debugMode) {
      this.rootElement.setAttribute('data-cognitive-state', newState);
    }

    // Emit custom DOM event for other listeners
    const domEvent = new CustomEvent('navigatorStateChange', {
      detail: { 
        from: oldState, 
        to: newState, 
        state: newState,
        confidence,
      },
      bubbles: true,
      cancelable: false,
    });
    document.dispatchEvent(domEvent);
  }

  /**
   * Handle intent predictions from IntentPredictorPlugin
   * Adds visual preloading hints to predicted targets
   */
  private lastPreloadedElement: HTMLElement | null = null;

  private handleIntentPrediction(event: any): void {
    if (!this.rootElement) return;

    const payload = event.payload || event;
    const { intent, confidence, target, targetCardId, trajectory } = payload;

    if (confidence < 0.7) {
      // Low confidence - don't show preloading
      return;
    }

    if (this.config.debugMode) {
      console.log('[DomRenderer] Intent prediction:', {
        intent,
        confidence: confidence.toFixed(2),
        target,
        targetCardId,
      });
    }

    // Remove preloading from previous element
    if (this.lastPreloadedElement) {
      this.lastPreloadedElement.classList.remove('card--preloading');
      this.lastPreloadedElement = null;
    }

    // Find target element by ID or index
    let targetElement: HTMLElement | null = null;
    
    if (targetCardId) {
      targetElement = document.getElementById(targetCardId);
    } else if (target !== undefined) {
      targetElement = document.querySelector(`[data-index="${target}"]`);
    }

    if (targetElement) {
      // Add preloading class
      targetElement.classList.add('card--preloading');
      this.lastPreloadedElement = targetElement;

      // Remove after animation completes
      setTimeout(() => {
        if (targetElement) {
          targetElement.classList.remove('card--preloading');
        }
        if (this.lastPreloadedElement === targetElement) {
          this.lastPreloadedElement = null;
        }
      }, 1000);
    }

    // Emit custom DOM event
    const domEvent = new CustomEvent('navigatorIntentPrediction', {
      detail: { 
        intent, 
        confidence, 
        target, 
        targetCardId,
        trajectory,
      },
      bubbles: true,
      cancelable: false,
    });
    document.dispatchEvent(domEvent);
  }

  // ========================================
  // Helper Methods
  // ========================================

  /**
   * Remove all cognitive state CSS classes
   */
  private removeAllCognitiveStateClasses(): void {
    if (!this.rootElement) return;

    const states: CognitiveState[] = ['neutral', 'frustrated', 'concentrated', 'exploring', 'learning'];
    states.forEach(state => {
      this.rootElement!.classList.remove(`state-${state}`);
    });
  }

  // ========================================
  // Public API
  // ========================================

  /**
   * Get current cognitive state
   */
  getCurrentCognitiveState(): CognitiveState {
    return this.currentCognitiveState;
  }

  /**
   * Manually set a CSS class on root element
   */
  setRootClass(className: string, add: boolean = true): void {
    if (!this.rootElement) return;

    if (add) {
      this.rootElement.classList.add(className);
    } else {
      this.rootElement.classList.remove(className);
    }
  }
}
