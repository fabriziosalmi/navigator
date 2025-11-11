/**
 * KeyboardPlugin.ts
 * 
 * Keyboard navigation plugin for Navigator.Menu.
 * Captures keyboard input and emits both raw events and navigation intents.
 * 
 * Sprint 2 Migration: Now dispatches navigation actions to store
 * 
 * Events emitted:
 * - keyboard:keydown - Raw keydown events with full details
 * - keyboard:keyup - Raw keyup events
 * - keyboard:combo - Key combination events (e.g., Ctrl+d)
 * - intent:navigate_* - Legacy events (deprecated, will be removed)
 * 
 * Actions dispatched:
 * - navigation/NAVIGATE - Unidirectional navigation actions
 */

import { nanoid } from 'nanoid';
import type { NavigatorCore, INavigatorPlugin, Action } from '@navigator.menu/core';
import { navigate, keyPress, keyRelease, select, cancel } from '@navigator.menu/core';

export interface KeyboardPluginConfig {
  enabled?: boolean;
  preventDefaults?: boolean;
  keyCombos?: Record<string, string>;
}

export class KeyboardPlugin implements INavigatorPlugin {
  public readonly name = 'keyboard';
  
  private core: NavigatorCore | null = null;
  private config: KeyboardPluginConfig;
  private pressedKeys: Set<string> = new Set();
  private handleKeyDown: ((event: KeyboardEvent) => void) | null = null;
  private handleKeyUp: ((event: KeyboardEvent) => void) | null = null;
  
  // Track action start time for duration calculation
  private actionStartTime: number | null = null;

  constructor(config: KeyboardPluginConfig = {}) {
    this.config = {
      enabled: true,
      preventDefaults: true,
      keyCombos: {
        'Ctrl+d': 'toggle_debug',
        'Ctrl+h': 'toggle_hud',
      },
      ...config,
    };
  }

  // ========================================
  // INavigatorPlugin Lifecycle
  // ========================================

  async init(core: NavigatorCore): Promise<void> {
    this.core = core;
    
    // Bind event handlers (capture 'this' context)
    this.handleKeyDown = this._onKeyDown.bind(this);
    this.handleKeyUp = this._onKeyUp.bind(this);
  }

  async start?(): Promise<void> {
    if (!this.config.enabled) {
      return;
    }

    if (!this.handleKeyDown || !this.handleKeyUp) {
      throw new Error('KeyboardPlugin not initialized');
    }

    // Debug: Log active element
    console.log('[KeyboardPlugin] Attaching listeners. Active element is:', document.activeElement);

    // Attach keyboard listeners
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);

    console.log('[KeyboardPlugin] Keyboard listeners attached to window');
  }

  async stop?(): Promise<void> {
    if (!this.handleKeyDown || !this.handleKeyUp) {
      return;
    }

    // Remove keyboard listeners
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);

    // Clear pressed keys
    this.pressedKeys.clear();
  }

  async destroy?(): Promise<void> {
    // Ensure listeners are removed if still running
    await this.stop?.();
    this.pressedKeys.clear();
    this.core = null;
  }

  // ========================================
  // Event Handlers
  // ========================================

  private _onKeyDown(event: KeyboardEvent): void {
    if (!this.core) return;

    const { key, code } = event;
    const timestamp = performance.now();

    console.log('[KeyboardPlugin] KeyDown event received:', { key, code, target: event.target });

    // Mark action start for duration tracking
    if (!this.actionStartTime) {
      this.actionStartTime = timestamp;
    }

    // Prevent default for navigation keys
    if (this.config.preventDefaults) {
      const preventKeys = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', ' '];
      if (preventKeys.includes(key)) {
        event.preventDefault();
      }
    }

    // Track pressed keys for combos
    this.pressedKeys.add(key);

    // Check for key combinations
    const combo = this._getKeyCombo();
    if (combo && this.config.keyCombos?.[combo]) {
      event.preventDefault();
      this.core.eventBus.emit('keyboard:combo', {
        combo,
        action: this.config.keyCombos[combo],
      });
      
      // Record combo action
      this._recordAction(`keyboard:combo:${combo}`, true, timestamp);
      return;
    }

    // Dispatch raw key press to store (unidirectional flow)
    this.core.store.dispatch(keyPress(key, timestamp));

    // Emit navigation intents and record action
    const intentEmitted = this._emitNavigationIntent(key, timestamp);
    
    // Record keydown action (successful if it's a known navigation key)
    if (!intentEmitted) {
      this._recordAction(`keyboard:keydown:${key}`, true, timestamp);
    }
  }

  private _onKeyUp(event: KeyboardEvent): void {
    if (!this.core) return;

    const { key } = event;
    const timestamp = performance.now();

    // Remove from pressed keys
    this.pressedKeys.delete(key);

    // Dispatch key release to store (unidirectional flow)
    this.core.store.dispatch(keyRelease(key, timestamp));
  }

  // ========================================
  // Helper Methods
  // ========================================

  private _emitNavigationIntent(key: string, timestamp: number): boolean {
    if (!this.core) return false;

    // Map keys to navigation directions
    const navigationMap: Record<string, 'left' | 'right' | 'up' | 'down' | null> = {
      ArrowLeft: 'left',
      ArrowRight: 'right',
      ArrowUp: 'up',
      ArrowDown: 'down',
    };

    const direction = navigationMap[key];
    
    // Handle arrow key navigation with new unidirectional flow
    if (direction) {
      // Dispatch action to store (unidirectional flow)
      this.core.store.dispatch(navigate(direction, 'keyboard'));
      
      // Record navigation action for cognitive tracking
      this._recordAction(`navigation:${direction}`, true, timestamp);
      
      return true;
    }
    
    // Handle interaction keys (Enter, Escape)
    if (key === 'Enter') {
      this.core.store.dispatch(select('keyboard'));
      this._recordAction('interaction:select', true, timestamp);
      return true;
    }
    
    if (key === 'Escape') {
      this.core.store.dispatch(cancel('keyboard'));
      this._recordAction('interaction:cancel', true, timestamp);
      return true;
    }
    
    return false;
  }

  /**
   * Record a user action in the session history
   * This feeds the cognitive modeling system
   */
  private _recordAction(type: string, success: boolean, timestamp: number): void {
    if (!this.core) return;
    
    const duration_ms = this.actionStartTime 
      ? timestamp - this.actionStartTime 
      : undefined;
    
    const action: Action = {
      id: nanoid(),
      timestamp,
      type,
      success,
      duration_ms,
      metadata: {
        plugin: this.name,
      },
    };
    
    // 🔍 SONDA #4: KeyboardPlugin
    console.log(`[DIAGNOSTIC] KeyboardPlugin._recordAction called:`, { type, success, duration_ms });
    
    this.core.recordAction(action);
    
    // Reset action start time
    this.actionStartTime = null;
  }

  private _getKeyCombo(): string | null {
    const keys = Array.from(this.pressedKeys).sort();
    if (keys.length < 2) {
      return null;
    }

    // Separate modifiers from regular keys
    const modifiers: string[] = [];
    const regular: string[] = [];

    for (const key of keys) {
      if (['Control', 'Alt', 'Shift', 'Meta'].includes(key)) {
        modifiers.push(key === 'Control' ? 'Ctrl' : key);
      } else {
        regular.push(key);
      }
    }

    if (regular.length === 0) {
      return null;
    }

    return [...modifiers, ...regular].join('+');
  }
}
