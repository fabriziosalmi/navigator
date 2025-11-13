import { useState, useEffect, useRef } from 'react';
import { useNavigator } from '@navigator.menu/react';
import { KeyboardPlugin } from '@navigator.menu/plugin-keyboard';

function App() {
  // 📊 State management
  const [lastKey, setLastKey] = useState<string>('none');
  const [eventCount, setEventCount] = useState(0);
  const [keyHistory, setKeyHistory] = useState<string[]>([]);
  const [navigatorStatus, setNavigatorStatus] = useState<string>('Initializing...');
  const [cognitiveState, setCognitiveState] = useState<string>('neutral');
  
  // Track last processed timestamp to avoid duplicate counts on same event
  const lastProcessedTimestampRef = useRef<number | null>(null);

  // 🚀 Initialize Navigator with KeyboardPlugin
  const { core } = useNavigator({
    plugins: [new KeyboardPlugin()],
    autoStart: true,
    debugMode: true
  });

  // 📡 Subscribe to Navigator events
  useEffect(() => {
    if (!core) return;

    // Check if already running and update status immediately
    if (core.isRunning) {
      setNavigatorStatus('Running');
    }

    // Track Navigator status changes
    const unsubscribeStart = core.eventBus.on('core:start:complete', () => {
      setNavigatorStatus('Running');
    });

    const unsubscribeStop = core.eventBus.on('core:stop:complete', () => {
      setNavigatorStatus('Stopped');
    });

    // ✨ NEW: Subscribe to Store for ALL state changes (unidirectional flow)
    const unsubscribeStore = core.store.subscribe(() => {
      const state = core.store.getState();
      
      // Get keyboard state from Store
      const currentKey = state.input?.keyboard?.lastKey;
      const currentTimestamp = state.input?.keyboard?.lastTimestamp;
      
      // Only update if we have a new event (different timestamp)
      if (currentKey && currentTimestamp && currentTimestamp !== lastProcessedTimestampRef.current) {
        lastProcessedTimestampRef.current = currentTimestamp;
        
        console.log('[App] KEYPRESS DETECTED:', { currentKey, timestamp: currentTimestamp });
        
        setLastKey(currentKey);
        setEventCount((prev) => prev + 1);
        setKeyHistory((prev) => [...prev.slice(-9), currentKey]); // Keep last 10 keys
        
        // Dispatch error action for non-navigation keys (cognitive tracking)
        // Navigation keys: arrows, Enter, Space, Tab
        // Modifier keys: Shift, Control, Alt, Meta - ignored
        const navigationKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter', ' ', 'Tab'];
        const modifierKeys = ['Shift', 'Control', 'Alt', 'Meta'];
        
        console.log('[App] Key check:', { currentKey, isNav: navigationKeys.includes(currentKey), isMod: modifierKeys.includes(currentKey) });
        
        if (!navigationKeys.includes(currentKey) && !modifierKeys.includes(currentKey)) {
          console.log('[App] Dispatching INVALID_KEY for:', currentKey);
          core.store.dispatch({
            type: 'test-app/INVALID_KEY',
            payload: {
              key: currentKey,
              timestamp: currentTimestamp,
              metadata: {
                reason: 'not_a_navigation_key',
                validKeys: navigationKeys
              }
            }
          });
        }
      }
      
      // Update cognitive state from Store
      if (state.cognitive?.currentState) {
        setCognitiveState(state.cognitive.currentState);
      }
    });

    return () => {
      unsubscribeStart();
      unsubscribeStop();
      unsubscribeStore();
    };
  }, [core]);

  return (
    <div className="container" tabIndex={0}>
      <h1>Navigator E2E Test App</h1>
      <p className="subtitle">Testing Navigator Core Functionality</p>

      <div className="status-card">
        <div className="status-label">Navigator Status</div>
        <div className="status-value" data-testid="navigator-status">
          {navigatorStatus}
        </div>
      </div>

      <div className="status-card">
        <div className="status-label">Cognitive State</div>
        <div className="status-value" data-testid="cognitive-state">
          {cognitiveState}
        </div>
      </div>

      <div className="status-card">
        <div className="status-label">Last Key Pressed</div>
        <div className="status-value" data-testid="last-key">
          {lastKey}
        </div>
      </div>

      <div className="status-card">
        <div className="status-label">Total Events</div>
        <div className="status-value" data-testid="event-count">
          {eventCount}
        </div>
      </div>

      <div className="status-card">
        <div className="status-label">Key History</div>
        <div className="status-value" data-testid="key-history">
          {keyHistory.length > 0 ? keyHistory.join(', ') : 'No keys pressed yet'}
        </div>
      </div>

      <div className="instructions">
        <h3>E2E Test Instructions</h3>
        <p>Press any key to test keyboard event capture:</p>
        <p>
          <span className="key-hint">Arrow Keys</span>
          <span className="key-hint">Enter</span>
          <span className="key-hint">Space</span>
          <span className="key-hint">Any Key</span>
        </p>
      </div>
    </div>
  );
}

export default App;
