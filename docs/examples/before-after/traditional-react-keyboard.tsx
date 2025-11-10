/**
 * Traditional React Keyboard Navigation
 * 
 * ❌ THE PROBLEMS WITH THIS APPROACH:
 * 
 * 1. TIGHT COUPLING
 *    - Component directly coupled to browser DOM APIs (window.addEventListener)
 *    - Can't easily swap input sources (keyboard → gestures → voice)
 *    - Hard to test without mocking browser globals
 * 
 * 2. MIXED RESPONSIBILITIES
 *    - Input handling mixed with business logic
 *    - Component knows about key codes, event objects, cleanup
 *    - Violates Single Responsibility Principle
 * 
 * 3. DUPLICATION TRAP
 *    - Want gesture support? Add another addEventListener
 *    - Want voice commands? Add another addEventListener
 *    - Same logic duplicated across multiple input handlers
 * 
 * 4. FRAGILE CLEANUP
 *    - Easy to forget removeEventListener
 *    - Memory leaks waiting to happen
 *    - Manual lifecycle management
 * 
 * 5. TESTING NIGHTMARE
 *    - Must mock window.addEventListener
 *    - Simulating keyboard events is verbose
 *    - Integration tests require browser automation
 */

import { useState, useEffect } from 'react';

function TraditionalKeyboardCounter() {
  const [count, setCount] = useState(0);
  const [lastKey, setLastKey] = useState<string | null>(null);
  
  useEffect(() => {
    // ❌ COUPLING POINT #1: Direct DOM dependency
    const handleKeyDown = (event: KeyboardEvent) => {
      setLastKey(event.key);
      
      // ❌ COUPLING POINT #2: Business logic mixed with input handling
      // This logic is now TRAPPED inside this event handler
      // Can't reuse it for gesture input without copy-paste
      if (event.key === 'ArrowLeft') {
        setCount(prev => prev - 1);
      } else if (event.key === 'ArrowRight') {
        setCount(prev => prev + 1);
      } else if (event.key === 'ArrowUp') {
        setCount(prev => prev + 10);
      } else if (event.key === 'ArrowDown') {
        setCount(prev => prev - 10);
      }
      
      // ❌ COUPLING POINT #3: What about gesture support?
      // To add swipe gestures, you'd need ANOTHER event listener
      // with DUPLICATED logic:
      // 
      // const handleTouchEnd = (event: TouchEvent) => {
      //   const swipe = detectSwipeDirection(event);
      //   if (swipe === 'left') setCount(prev => prev - 1);  // DUPLICATE!
      //   if (swipe === 'right') setCount(prev => prev + 1); // DUPLICATE!
      // }
      // window.addEventListener('touchend', handleTouchEnd);
    };
    
    // ❌ COUPLING POINT #4: Manual cleanup (easy to forget!)
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      // ❌ COUPLING POINT #5: Must remember to clean up
      // Forget this? Memory leak.
      window.removeEventListener('keydown', handleKeyDown);
      
      // And if you added gesture support:
      // window.removeEventListener('touchend', handleTouchEnd);
      // More cleanup to remember!
    };
  }, []); // ❌ COUPLING POINT #6: Empty deps array hides dependencies
  
  return (
    <div style={{ padding: '2rem', fontFamily: 'system-ui' }}>
      <h1>Traditional Approach</h1>
      <div style={{ 
        marginTop: '2rem', 
        padding: '1.5rem', 
        background: '#ffebee', 
        borderRadius: '8px',
        border: '2px solid #ef5350'
      }}>
        <p><strong>Count:</strong> {count}</p>
        <p><strong>Last Key:</strong> {lastKey || 'none'}</p>
        <p style={{ marginTop: '1rem', fontSize: '0.9em', color: '#666' }}>
          Press arrow keys to change count
        </p>
      </div>
      
      <div style={{ marginTop: '2rem', padding: '1rem', background: '#fff3e0', borderRadius: '4px' }}>
        <h3>Problems with this code:</h3>
        <ul style={{ fontSize: '0.9em' }}>
          <li>🔴 Tightly coupled to browser DOM</li>
          <li>🔴 Business logic mixed with input handling</li>
          <li>🔴 Adding gesture support requires code duplication</li>
          <li>🔴 Manual cleanup (memory leak risk)</li>
          <li>🔴 Hard to test (requires mocking window)</li>
        </ul>
      </div>
    </div>
  );
}

export default TraditionalKeyboardCounter;
