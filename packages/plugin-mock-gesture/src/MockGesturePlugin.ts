/**
 * MockGesturePlugin - Demo & Testing Plugin
 * 
 * Purpose: Automatically emits gesture/swipe events for demonstrations
 * and testing without requiring actual user gestures.
 * 
 * Use Cases:
 * - Hot-swap demos (replace KeyboardPlugin with this to show decoupling)
 * - Automated testing of gesture-based UIs
 * - Debug tool for gesture-driven applications
 * 
 * Emits:
 * - gesture:swipe_left every 2 seconds
 * - gesture:swipe_right every 2 seconds (alternating)
 * - intent:navigate_left / intent:navigate_right
 * 
 * @example
 * ```ts
 * import { MockGesturePlugin } from '@navigator.menu/plugin-mock-gesture';
 * 
 * const plugin = new MockGesturePlugin({ interval: 1000 }); // 1 second
 * core.use(plugin);
 * ```
 */

import type { NavigatorCore, INavigatorPlugin } from '@navigator.menu/core';

export interface MockGesturePluginOptions {
  /** Interval between auto-emitted events in milliseconds (default: 2000) */
  interval?: number;
  
  /** Whether to alternate between left/right (default: true) */
  alternate?: boolean;
  
  /** Whether to emit navigation intents (default: true) */
  emitIntents?: boolean;
}

export class MockGesturePlugin implements INavigatorPlugin {
  name = 'mock-gesture';
  
  private core: NavigatorCore | null = null;
  private intervalId: number | null = null;
  private direction: 'left' | 'right' = 'left';
  private options: Required<MockGesturePluginOptions>;
  
  constructor(options: MockGesturePluginOptions = {}) {
    this.options = {
      interval: options.interval ?? 2000,
      alternate: options.alternate ?? true,
      emitIntents: options.emitIntents ?? true,
    };
  }
  
  async init(core: NavigatorCore): Promise<void> {
    this.core = core;
    console.log('[MockGesturePlugin] Initialized');
  }
  
  async start(): Promise<void> {
    if (!this.core) {
      throw new Error('MockGesturePlugin: Cannot start before initialization');
    }
    
    // Start auto-emitting events
    this.intervalId = window.setInterval(() => {
      this.emitGestureEvent();
      
      // Toggle direction if alternating
      if (this.options.alternate) {
        this.direction = this.direction === 'left' ? 'right' : 'left';
      }
    }, this.options.interval);
    
    console.log(
      `[MockGesturePlugin] Started (interval: ${this.options.interval}ms, ` +
      `alternate: ${this.options.alternate})`
    );
  }
  
  async stop(): Promise<void> {
    if (this.intervalId !== null) {
      window.clearInterval(this.intervalId);
      this.intervalId = null;
    }
    console.log('[MockGesturePlugin] Stopped');
  }
  
  async destroy(): Promise<void> {
    await this.stop();
    this.core = null;
    console.log('[MockGesturePlugin] Destroyed');
  }
  
  private emitGestureEvent(): void {
    if (!this.core) return;
    
    const eventName = `gesture:swipe_${this.direction}`;
    const intentName = `intent:navigate_${this.direction}`;
    
    // Emit raw gesture event
    const gestureEvent = {
      type: eventName,
      timestamp: Date.now(),
      payload: {
        direction: this.direction,
        mock: true, // Flag to indicate this is a simulated event
      },
    };
    
    this.core.eventBus.emit(eventName, gestureEvent);
    console.log(`[MockGesturePlugin] Emitted ${eventName}`);
    
    // Emit navigation intent
    if (this.options.emitIntents) {
      const intentEvent = {
        type: intentName,
        timestamp: Date.now(),
        payload: {
          source: 'mock-gesture',
          direction: this.direction,
        },
      };
      
      this.core.eventBus.emit(intentName, intentEvent);
      console.log(`[MockGesturePlugin] Emitted ${intentName}`);
    }
  }
}
