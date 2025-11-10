import { useState } from 'react';
import { useNavigator } from '@navigator.menu/react';

export default function App() {
  const { lastKey, eventCount, isRunning } = useNavigator();
  const [history, setHistory] = useState<string[]>([]);

  // Track key history
  if (lastKey && history[history.length - 1] !== lastKey) {
    setHistory((prev) => [...prev.slice(-9), lastKey]);
  }

  return (
    <div className="container">
      <h1>Navigator E2E Test App</h1>
      <p className="subtitle">Press any key to test keyboard input detection</p>

      <div className="status-card">
        <div className="status-label">Navigator Core Status</div>
        <div className={`status-value ${isRunning ? 'active' : ''}`}>
          {isRunning ? '✅ Running' : '⏸️ Stopped'}
        </div>
      </div>

      <div className="status-card">
        <div className="status-label">Last Key Pressed</div>
        <div className="status-value" data-testid="last-key">
          {lastKey || 'none'}
        </div>
      </div>

      <div className="status-card">
        <div className="status-label">Total Events</div>
        <div className="status-value" data-testid="event-count">
          {eventCount}
        </div>
      </div>

      {history.length > 0 && (
        <div className="status-card">
          <div className="status-label">Recent Keys</div>
          <div className="status-value" data-testid="key-history">
            {history.join(' → ')}
          </div>
        </div>
      )}

      <div className="instructions">
        <p><strong>🎮 E2E Test Instructions:</strong></p>
        <p>
          Press <span className="key-hint">ArrowUp</span>,
          <span className="key-hint">ArrowDown</span>,
          <span className="key-hint">ArrowLeft</span>,
          <span className="key-hint">ArrowRight</span> to test navigation.
        </p>
        <p>
          Press <span className="key-hint">Enter</span> or
          <span className="key-hint">Space</span> to test selection.
        </p>
      </div>
    </div>
  );
}
