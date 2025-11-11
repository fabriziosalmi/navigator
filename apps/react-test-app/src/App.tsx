import { useState, useEffect } from 'react';
import { useNavigator } from '@navigator.menu/react';
import { KeyboardPlugin } from '@navigator.menu/plugin-keyboard';

function App() {
  // 📊 State management
  const [lastKey, setLastKey] = useState<string>('none');
  const [eventCount, setEventCount] = useState(0);
  const [keyHistory, setKeyHistory] = useState<string[]>([]);
  const [navigatorStatus, setNavigatorStatus] = useState<string>('Initializing...');

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

    // Subscribe to keyboard events from the plugin
    const unsubscribeKeyboard = core.eventBus.on('keyboard:keydown', (event: any) => {
      const key = event.payload.key;  // Access key from payload!
      setLastKey(key);
      setEventCount((prev) => prev + 1);
      setKeyHistory((prev) => [...prev.slice(-9), key]); // Keep last 10 keys
    });

    return () => {
      unsubscribeStart();
      unsubscribeStop();
      unsubscribeKeyboard();
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
