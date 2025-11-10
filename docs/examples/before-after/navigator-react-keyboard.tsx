/**
 * Navigator React Keyboard Navigation
 * 
 * ✅ THE SOLUTIONS IN THIS APPROACH:
 * 
 * 1. LOOSE COUPLING
 *    - Component decoupled from browser APIs
 *    - Input source is hot-swappable (keyboard → gestures → voice)
 *    - Easy to test with mock plugins (no browser globals needed)
 * 
 * 2. SEPARATED RESPONSIBILITIES
 *    - Input handling: KeyboardPlugin's job
 *    - Business logic: Component's job
 *    - Communication: EventBus's job
 *    - Each layer has one responsibility
 * 
 * 3. NO DUPLICATION
 *    - Want gesture support? Just swap the plugin
 *    - Want voice commands? Just swap the plugin
 *    - Same business logic works with ANY input source
 * 
 * 4. AUTOMATIC CLEANUP
 *    - useNavigator handles Core lifecycle
 *    - unsubscribe functions returned automatically
 *    - Memory leaks prevented by design
 * 
 * 5. TESTING PARADISE
 *    - Use MockGesturePlugin for automated tests
 *    - No browser automation needed
 *    - Pure JavaScript testing
 */

import { useState, useEffect } from 'react';
import { useNavigator } from '@navigator.menu/react';
import { KeyboardPlugin } from '@navigator.menu/plugin-keyboard';

function NavigatorKeyboardCounter() {
  const [count, setCount] = useState(0);
  const [lastKey, setLastKey] = useState<string | null>(null);
  
  // ✅ SOLUTION #1: Single source of initialization
  // useNavigator handles Core lifecycle (init, start, cleanup)
  // We just declare which inputs we want to use
  const { core } = useNavigator({
    plugins: [new KeyboardPlugin()],
    // Tomorrow, swap to: plugins: [new GesturePlugin()]
    // Component code below STAYS THE SAME!
  });
  
  // ✅ SOLUTION #2: Business logic separated from input handling
  useEffect(() => {
    if (!core) return;
    
    // Subscribe to INTENTS, not raw key codes
    // KeyboardPlugin translates keys → intents
    // GesturePlugin would translate swipes → same intents
    // VoicePlugin would translate commands → same intents
    const unsubscribers = [
      // ✅ SOLUTION #3: Intent-based, not event-based
      // "navigate_left" could come from:
      //   - ArrowLeft key (keyboard)
      //   - Swipe left gesture (touch)
      //   - "go left" voice command (voice)
      // This component doesn't care!
      core.eventBus.on('intent:navigate_left', () => {
        setCount(prev => prev - 1);
      }),
      
      core.eventBus.on('intent:navigate_right', () => {
        setCount(prev => prev + 1);
      }),
      
      core.eventBus.on('intent:navigate_up', () => {
        setCount(prev => prev + 10);
      }),
      
      core.eventBus.on('intent:navigate_down', () => {
        setCount(prev => prev - 10);
      }),
      
      // Still want raw events? No problem!
      core.eventBus.on('keyboard:keydown', (event) => {
        setLastKey(event.key);
      }),
    ];
    
    // ✅ SOLUTION #4: Functional, clean cleanup
    // One line. Works every time. No memory leaks.
    return () => unsubscribers.forEach(unsub => unsub());
  }, [core]);
  
  return (
    <div style={{ padding: '2rem', fontFamily: 'system-ui' }}>
      <h1>Navigator Approach</h1>
      <div style={{ 
        marginTop: '2rem', 
        padding: '1.5rem', 
        background: '#e8f5e9', 
        borderRadius: '8px',
        border: '2px solid #66bb6a'
      }}>
        <p><strong>Count:</strong> {count}</p>
        <p><strong>Last Key:</strong> {lastKey || 'none'}</p>
        <p style={{ marginTop: '1rem', fontSize: '0.9em', color: '#666' }}>
          Press arrow keys to change count
        </p>
      </div>
      
      <div style={{ marginTop: '2rem', padding: '1rem', background: '#e3f2fd', borderRadius: '4px' }}>
        <h3>Benefits of this code:</h3>
        <ul style={{ fontSize: '0.9em' }}>
          <li>✅ Decoupled from browser APIs</li>
          <li>✅ Business logic separated from input handling</li>
          <li>✅ Hot-swappable input sources (no code changes)</li>
          <li>✅ Automatic cleanup (no memory leaks)</li>
          <li>✅ Easy to test (use MockGesturePlugin)</li>
        </ul>
      </div>
      
      <div style={{ marginTop: '1rem', padding: '1rem', background: '#fff9c4', borderRadius: '4px' }}>
        <h4>🎯 The Power Move:</h4>
        <p style={{ fontSize: '0.9em' }}>
          Change <code>new KeyboardPlugin()</code> to <code>new GesturePlugin()</code><br/>
          <strong>Zero other changes needed.</strong> That's decoupled architecture.
        </p>
      </div>
    </div>
  );
}

export default NavigatorKeyboardCounter;
