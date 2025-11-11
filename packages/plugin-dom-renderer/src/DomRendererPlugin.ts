/**
 * DomRendererPlugin.ts - v17.1 COGNITIVE INTERPRETER
 * 
 * Visual interpreter of user cognitive state. Translates abstract intelligence
 * into clear, fluid visual feedback.
 * 
 * Responsibilities:
 * - Listen to intent:navigate → move cards/layers
 * - Listen to system_state:change → modify global interface appearance
 * - Listen to intent:prediction → apply pre-rendering effects
 * - Manage configurable DOM target for reusability
 * 
 * Architecture:
 * - CSS custom property --animation-speed-multiplier for performance
 * - Class-based state management (state-{cognitiveState})
 * - Configurable selectors for multi-carousel support
 */

import type { NavigatorCore, INavigatorPlugin, CognitiveState } from '@navigator.menu/core';

export interface DomRendererConfig {
  /** Root element selector or HTMLElement (default: 'body') */
  target?: string | HTMLElement;
  
  /** Selector for card elements (default: '.card') */
  cardSelector?: string;
  
  /** Selector for layer elements (default: '.layer') */
  layerSelector?: string;
  
  /** Confidence threshold for preloading (default: 0.70) */
  predictionThreshold?: number;
  
  /** Enable debug mode visual indicators */
  debugMode?: boolean;
  
  /** Enable cognitive state CSS classes */
  enableCognitiveStates?: boolean;
  
  /** Enable intent prediction preloading */
  enableIntentPreloading?: boolean;
  
  /** Enable navigation handling */
  enableNavigation?: boolean;
  
  /** Animation speed multipliers per cognitive state */
  speedMultipliers?: {
    frustrated?: number;
    concentrated?: number;
    exploring?: number;
    learning?: number;
    neutral?: number;
  };
}

export class DomRendererPlugin implements INavigatorPlugin {
  public readonly name = 'dom-renderer';
  
  private config: DomRendererConfig;
  private container: HTMLElement | null = null;
  private core: NavigatorCore | null = null;
  
  // State tracking
  private currentCognitiveState: CognitiveState = 'neutral';
  private unsubscribers: Array<() => void> = [];
  private lastPreloadedElement: HTMLElement | null = null;
  
  // Sprint 2: Navigation state tracking for unidirectional flow
  private previousNavigationState: any = null;
  
  // Sprint 3: Cognitive state tracking for unidirectional flow
  private previousCognitiveState: CognitiveState = 'neutral';

  constructor(config: DomRendererConfig = {}) {
    this.config = {
      target: config.target || 'body',
      cardSelector: config.cardSelector || '.card',
      layerSelector: config.layerSelector || '.layer',
      predictionThreshold: config.predictionThreshold ?? 0.70,
      debugMode: config.debugMode || false,
      enableCognitiveStates: config.enableCognitiveStates !== false,
      enableIntentPreloading: config.enableIntentPreloading !== false,
      enableNavigation: config.enableNavigation !== false,
      speedMultipliers: {
        frustrated: 1.5,    // Slow down (calming)
        concentrated: 0.6,  // Speed up (snappy)
        exploring: 1.0,     // Normal (encouraging)
        learning: 0.8,      // Slightly faster
        neutral: 1.0,       // Baseline
        ...config.speedMultipliers,
      },
    };
  }

  // ========================================
  // INavigatorPlugin Lifecycle
  // ========================================

  async init(core: NavigatorCore): Promise<void> {
    // Store core reference
    this.core = core;
    
    // Find container element
    const target = this.config.target;
    const el = typeof target === 'string' 
      ? document.querySelector(target) 
      : target;
    
    if (!el) {
      throw new Error(`[DomRenderer] Target element "${target}" not found.`);
    }
    this.container = el as HTMLElement;

    // Subscribe to events
    if (this.config.enableIntentPreloading) {
      const unsubPrediction = core.eventBus.on('intent:prediction', 
        this.onIntentPrediction.bind(this)
      );
      this.unsubscribers.push(unsubPrediction);
    }

    // SPRINT 2 & 3: Subscribe to store for navigation and cognitive state changes (unidirectional flow)
    if (this.config.enableNavigation || this.config.enableCognitiveStates) {
      // NEW: Subscribe to store changes
      const unsubStore = core.store.subscribe(this.handleStateChange);
      this.unsubscribers.push(unsubStore);
      
      // Initialize previous state
      if (this.config.enableNavigation) {
        this.previousNavigationState = core.store.getState().navigation;
      }
      if (this.config.enableCognitiveStates) {
        this.previousCognitiveState = core.store.getState().cognitive.currentState;
      }
    }

    // Set initial state
    if (this.config.debugMode && this.container) {
      this.container.setAttribute('data-debug', 'true');
      this.container.setAttribute('data-cognitive-state', this.currentCognitiveState);
    }

    // Set initial speed multiplier
    this.updateSpeedMultiplier(this.currentCognitiveState);

    if (this.config.debugMode) {
      console.log('[DomRenderer] Initialized', {
        target: this.config.target,
        cardSelector: this.config.cardSelector,
        layerSelector: this.config.layerSelector,
        enableCognitiveStates: this.config.enableCognitiveStates,
        enableIntentPreloading: this.config.enableIntentPreloading,
        enableNavigation: this.config.enableNavigation,
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
    if (this.container && this.config.enableCognitiveStates) {
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
    if (this.container) {
      this.removeAllCognitiveStateClasses();
      this.container.style.removeProperty('--animation-speed-multiplier');
      
      if (this.config.debugMode) {
        this.container.removeAttribute('data-debug');
        this.container.removeAttribute('data-cognitive-state');
      }
    }
    
    this.container = null;
    this.lastPreloadedElement = null;
  }

  // ========================================
  // Event Handlers
  // ========================================

  /**
   * SPRINT 2 & 3: Handle store state changes (unidirectional flow)
   * React to navigation and cognitive state updates from the store
   */
  private handleStateChange = (): void => {
    if (!this.core) return;
    
    const currentState = this.core.store.getState();
    
    // NAVIGATION: Check if navigation state changed
    if (this.config.enableNavigation) {
      const navState = currentState.navigation;
      
      if (!this.previousNavigationState) {
        this.previousNavigationState = navState;
      } else {
        const hasCardChanged = navState.currentCard !== this.previousNavigationState.currentCard;
        const hasLayerChanged = navState.currentLayer !== this.previousNavigationState.currentLayer;
        
        if (hasCardChanged || hasLayerChanged) {
          if (this.config.debugMode) {
            console.log('[DomRenderer] Navigation detected!', {
              from: {
                card: this.previousNavigationState.currentCard,
                layer: this.previousNavigationState.currentLayer,
              },
              to: {
                card: navState.currentCard,
                layer: navState.currentLayer,
              },
              direction: navState.direction,
            });
          }
          
          // Update carousel/layer DOM
          this.updateCarouselDOM(navState);
          
          // Emit custom DOM event for external listeners
          const domEvent = new CustomEvent('navigatorNavigate', {
            detail: {
              currentCard: navState.currentCard,
              currentLayer: navState.currentLayer,
              direction: navState.direction,
            },
            bubbles: true,
            cancelable: false,
          });
          document.dispatchEvent(domEvent);
        }
        
        // Save current state for next comparison
        this.previousNavigationState = navState;
      }
    }
    
    // COGNITIVE: Check if cognitive state changed
    if (this.config.enableCognitiveStates) {
      const cognitiveState = currentState.cognitive.currentState;

      if (cognitiveState !== this.previousCognitiveState) {
        if (this.config.debugMode) {
          console.log(
            `[DomRenderer] Cognitive state change detected via Store: ${this.previousCognitiveState} -> ${cognitiveState}`
          );
        }

        // Apply cognitive state changes using helper
        this.applyCognitiveStateStyles(cognitiveState, this.previousCognitiveState, currentState.cognitive.confidence);

        // Save current state for next comparison
        this.previousCognitiveState = cognitiveState;
      }
    }
  };

  /**
   * Handle intent predictions from IntentPredictorPlugin
   * Implements v17.1 probabilistic preloading with configurable threshold
   */
  private onIntentPrediction = (event: any): void => {
    if (!this.container) return;

    const payload = event.payload || event;
    
    // v17.1: Support both single prediction and probability map
    let targetId: string | undefined;
    let confidence: number;
    
    if (payload.probabilities) {
      // Find most likely intent from probabilities
      const [mostLikelyIntent, prob] = Object.entries(payload.probabilities as Record<string, number>)
        .reduce((acc, curr) => curr[1] > acc[1] ? curr : acc, ['', 0]);
      
      targetId = this.getPredictedTargetId(mostLikelyIntent);
      confidence = prob;
    } else {
      // Legacy single prediction
      targetId = payload.targetCardId;
      confidence = payload.confidence || 0;
    }

    // Apply configurable threshold
    if (confidence < (this.config.predictionThreshold || 0.70)) {
      return; // Low confidence - don't show preloading
    }

    if (this.config.debugMode) {
      console.log('[DomRenderer] Intent prediction:', {
        targetId,
        confidence: confidence.toFixed(2),
        threshold: this.config.predictionThreshold,
      });
    }

    // Clean previous preload
    if (this.lastPreloadedElement) {
      this.lastPreloadedElement.classList.remove('card--preloading');
      this.lastPreloadedElement = null;
    }

    // Find and mark target element
    if (targetId) {
      const targetElement = this.getPredictedTargetElement(targetId);
      
      if (targetElement) {
        targetElement.classList.add('card--preloading');
        this.lastPreloadedElement = targetElement;

        // Auto-remove after animation
        setTimeout(() => {
          if (targetElement) {
            targetElement.classList.remove('card--preloading');
          }
          if (this.lastPreloadedElement === targetElement) {
            this.lastPreloadedElement = null;
          }
        }, 1000);
      }
    }

    // Emit custom DOM event
    const domEvent = new CustomEvent('navigatorIntentPrediction', {
      detail: { 
        targetId, 
        confidence,
        threshold: this.config.predictionThreshold,
      },
      bubbles: true,
      cancelable: false,
    });
    document.dispatchEvent(domEvent);
  };

  // ========================================
  // Helper Methods
  // ========================================

  /**
   * SPRINT 2: Update carousel DOM based on navigation state
   * This is the core DOM manipulation logic that responds to store changes
   */
  private updateCarouselDOM(navState: any): void {
    if (!this.container) return;
    
    if (this.config.debugMode) {
      console.log('[DomRenderer] Updating carousel DOM:', {
        card: navState.currentCard,
        layer: navState.currentLayer,
        direction: navState.direction,
      });
    }
    
    // Example implementation - this would be customized based on your actual DOM structure
    // In a real implementation, this might:
    // 1. Find all card elements
    // 2. Apply CSS transforms based on currentCard index
    // 3. Add/remove active classes
    // 4. Trigger CSS animations
    
    const cards = this.container.querySelectorAll(this.config.cardSelector || '.card');
    cards.forEach((card, index) => {
      const htmlCard = card as HTMLElement;
      
      if (index === navState.currentCard) {
        htmlCard.classList.add('card--active');
        htmlCard.setAttribute('aria-current', 'true');
      } else {
        htmlCard.classList.remove('card--active');
        htmlCard.removeAttribute('aria-current');
      }
      
      // Apply transform for carousel effect
      const offset = (index - navState.currentCard) * 100;
      htmlCard.style.transform = `translateX(${offset}%)`;
    });
    
    // Handle layer changes if needed
    const layers = this.container.querySelectorAll(this.config.layerSelector || '.layer');
    layers.forEach((layer, index) => {
      const htmlLayer = layer as HTMLElement;
      
      if (index === navState.currentLayer) {
        htmlLayer.classList.add('layer--active');
        htmlLayer.setAttribute('aria-hidden', 'false');
      } else {
        htmlLayer.classList.remove('layer--active');
        htmlLayer.setAttribute('aria-hidden', 'true');
      }
    });
  }

  /**
   * Update CSS custom property for animation speed
   * v17.1 core feature: Performance-optimized via single CSS variable
   */
  private updateSpeedMultiplier(state: CognitiveState): void {
    if (!this.container) return;

    const multipliers = this.config.speedMultipliers!;
    const multiplier = multipliers[state] || 1.0;

    this.container.style.setProperty('--animation-speed-multiplier', multiplier.toString());

    if (this.config.debugMode) {
      console.log(`[DomRenderer] Speed multiplier: ${multiplier} (state: ${state})`);
    }
  }

  /**
   * Apply CSS classes and other side effects for cognitive state changes
   */
  private applyCognitiveStateStyles(currentState: CognitiveState, previousState?: CognitiveState, confidence?: number): void {
    if (!this.container) return;

    // Remove previous state class
    if (previousState) {
      this.container.classList.remove(`state-${previousState}`);
    }

    // Add current state class
    this.container.classList.add(`state-${currentState}`);
    this.currentCognitiveState = currentState;

    // Update animation speed multiplier
    this.updateSpeedMultiplier(currentState);

    // Update debug attributes
    if (this.config.debugMode) {
      this.container.setAttribute('data-cognitive-state', currentState);
    }

    // Emit custom DOM event for external listeners
    const domEvent = new CustomEvent('navigatorStateChange', {
      detail: {
        from: previousState,
        to: currentState,
        state: currentState,
        confidence: confidence ?? null,
      },
      bubbles: true,
      cancelable: false,
    });
    document.dispatchEvent(domEvent);
  }

  /**
   * Get predicted target element by ID
   */
  private getPredictedTargetElement(targetId: string): HTMLElement | null {
    // Try direct ID first
    let element = document.getElementById(targetId);
    
    // Fallback to selector within container
    if (!element && this.container) {
      element = this.container.querySelector(`#${targetId}`) as HTMLElement;
    }
    
    // Fallback to card selector with data-id
    if (!element && this.container && this.config.cardSelector) {
      element = this.container.querySelector(
        `${this.config.cardSelector}[data-id="${targetId}"]`
      ) as HTMLElement;
    }
    
    return element;
  }

  /**
   * Extract target ID from intent string (e.g., "navigate-card-5" → "card-5")
   */
  private getPredictedTargetId(intent: string): string | undefined {
    // Extract ID from intent string (implementation depends on your intent format)
    const match = intent.match(/card-(\d+)/);
    return match ? `card-${match[1]}` : undefined;
  }

  /**
   * Remove all cognitive state CSS classes
   */
  private removeAllCognitiveStateClasses(): void {
    if (!this.container) return;

    const states: CognitiveState[] = ['neutral', 'frustrated', 'concentrated', 'exploring', 'learning'];
    states.forEach(state => {
      this.container!.classList.remove(`state-${state}`);
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
   * Manually set a CSS class on container element
   */
  setContainerClass(className: string, add: boolean = true): void {
    if (!this.container) return;

    if (add) {
      this.container.classList.add(className);
    } else {
      this.container.classList.remove(className);
    }
  }

  /**
   * Get container element (for advanced use cases)
   */
  getContainer(): HTMLElement | null {
    return this.container;
  }
}
