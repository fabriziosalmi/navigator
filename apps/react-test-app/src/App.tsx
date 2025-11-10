import { useState, useEffect } from 'react';
import { useNavigator } from '@navigator.menu/react';
import { KeyboardPlugin } from '@navigator.menu/plugin-keyboard';
import './App.css';

function App() {
  const [lastKey, setLastKey] = useState<string | null>(null);
  const [eventCount, setEventCount] = useState(0);
  const [intent, setIntent] = useState<string | null>(null);

  // 🚀 Initialize Navigator with KeyboardPlugin
  const { core } = useNavigator({
    plugins: [new KeyboardPlugin()],
  });

  // 📡 Subscribe to keyboard events
  useEffect(() => {
    if (!core) return;

    // Listen to raw keydown events
    const unsubKeydown = core.eventBus.on('keyboard:keydown', (event) => {
      setLastKey(event.key);
      setEventCount((prev) => prev + 1);
    });

    // Listen to navigation intents
    const unsubIntents = [
      core.eventBus.on('intent:navigate_left', () => setIntent('⬅️ Navigate Left')),
      core.eventBus.on('intent:navigate_right', () => setIntent('➡️ Navigate Right')),
      core.eventBus.on('intent:navigate_up', () => setIntent('⬆️ Navigate Up')),
      core.eventBus.on('intent:navigate_down', () => setIntent('⬇️ Navigate Down')),
      core.eventBus.on('intent:select', () => setIntent('✅ Select')),
      core.eventBus.on('intent:cancel', () => setIntent('❌ Cancel')),
    ];

    return () => {
      unsubKeydown();
      unsubIntents.forEach((unsub) => unsub());
    };
  }, [core]);

  return (
    <div className="app">
      <header>
        <h1>🎯 Navigator.Menu - React Test App</h1>
        <p>End-to-End Architecture Validation</p>
      </header>

      <main>
        <div className="demo-card">
          <h2>🎹 Keyboard Plugin Demo</h2>
          <p>Press any key to see the decoupled architecture in action!</p>

          <div className="status-grid">
            <div className="status-item">
              <span className="label">Last Key:</span>
              <span className="value">{lastKey || 'none'}</span>
            </div>
            <div className="status-item">
              <span className="label">Event Count:</span>
              <span className="value">{eventCount}</span>
            </div>
            <div className="status-item full-width">
              <span className="label">Intent:</span>
              <span className="value intent">{intent || 'waiting...'}</span>
            </div>
          </div>

          <div className="instructions">
            <h3>Try these keys:</h3>
            <ul>
              <li><kbd>Arrow Keys</kbd> - Navigation intents</li>
              <li><kbd>Enter</kbd> - Select intent</li>
              <li><kbd>Escape</kbd> - Cancel intent</li>
              <li><kbd>Ctrl+D</kbd> - Key combo (if configured)</li>
            </ul>
          </div>
        </div>

        <div className="architecture-info">
          <h3>🏗️ Architecture Flow</h3>
          <div className="flow">
            <div className="flow-step">KeyboardPlugin</div>
            <div className="flow-arrow">→</div>
            <div className="flow-step">EventBus</div>
            <div className="flow-arrow">→</div>
            <div className="flow-step">React Component</div>
          </div>
          <p className="flow-description">
            ✨ <strong>Decoupled Design:</strong> KeyboardPlugin emette un evento e il componente React lo riceve, 
            senza che si conoscano a vicenda.
          </p>
        </div>
      </main>

      <footer>
        <p>
          Core Status: <strong>{core ? '✅ Running' : '⏳ Initializing...'}</strong>
        </p>
      </footer>
    </div>
  );
}

export default App;
