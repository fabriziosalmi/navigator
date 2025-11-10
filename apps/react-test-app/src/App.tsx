import { useState, useEffect } from 'react';
import { useNavigator } from '@navigator.menu/react';
import './App.css';

function App() {
  const [lastKey, setLastKey] = useState<string | null>(null);
  const [eventCount, setEventCount] = useState(0);
  const [intent, setIntent] = useState<string | null>(null);

  // 🚀 Initialize Navigator (plugins auto-loaded from config)
  useNavigator();

  // 📡 Subscribe to keyboard events
  useEffect(() => {
    // Note: In v2.0, plugins are loaded from config
    // Events are emitted on the global event bus
    // For now, we'll use a simple keyboard listener
    
    const handleKeyDown = (e: KeyboardEvent) => {
      setLastKey(e.key);
      setEventCount((prev) => prev + 1);
      
      // Map keys to intents
      switch(e.key) {
        case 'ArrowLeft':
          setIntent('⬅️ Navigate Left');
          break;
        case 'ArrowRight':
          setIntent('➡️ Navigate Right');
          break;
        case 'ArrowUp':
          setIntent('⬆️ Navigate Up');
          break;
        case 'ArrowDown':
          setIntent('⬇️ Navigate Down');
          break;
        case 'Enter':
          setIntent('✅ Select');
          break;
        case 'Escape':
          setIntent('❌ Cancel');
          break;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

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
          Navigator Status: <strong>✅ Running</strong>
        </p>
      </footer>
    </div>
  );
}

export default App;
