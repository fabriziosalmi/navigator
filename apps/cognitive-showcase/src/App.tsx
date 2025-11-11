import { useState, useEffect } from 'react';
import { useNavigator } from '@navigator.menu/react';
import { KeyboardPlugin } from '@navigator.menu/plugin-keyboard';
import ImageCarousel from './components/ImageCarousel';
import CognitiveHUD from './components/CognitiveHUD';
import './App.css';

interface CognitiveMetrics {
  errorRate: number;
  averageSpeed: number;
  totalActions: number;
  successRate: number;
}

interface Action {
  type: string;
  success: boolean;
  timestamp: number;
  duration: number;
}

function App() {
  const [cognitiveState, setCognitiveState] = useState<string>('neutral');
  const [metrics, setMetrics] = useState<CognitiveMetrics>({
    errorRate: 0,
    averageSpeed: 0,
    totalActions: 0,
    successRate: 100,
  });
  const [lastAction, setLastAction] = useState<Action | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const { core } = useNavigator({
    autoStart: true,
    debugMode: false,
    plugins: [
      // CognitiveModelPlugin removed - cognitive analysis is now automatic via middleware
      new KeyboardPlugin(),
    ],
  });

  useEffect(() => {
    if (!core) return;

    // Subscribe to cognitive state changes via store
    const unsubscribe = core.store.subscribe(() => {
      const state = core.store.getState();
      const cognitiveSlice = state.cognitive;
      
      console.log('[App] Cognitive state changed:', cognitiveSlice);
      setCognitiveState(cognitiveSlice.currentState);
    });

    // Subscribe to action history
    const unsubHistory = core.eventBus.on('history:action:recorded', (payload: any) => {
      console.log('[App] Action recorded:', payload);
      
      // The payload structure is { action: {...}, historySize: number }
      const actionData = payload.action || payload;
      
      setLastAction({
        type: actionData.type || 'unknown',
        success: actionData.success ?? true,
        timestamp: actionData.timestamp || Date.now(),
        duration: actionData.duration || 0,
      });

      // Update metrics
      const history = core.history.getAll();
      const totalActions = history.length;
      const successfulActions = history.filter((a: any) => a.success).length;
      const failedActions = totalActions - successfulActions;
      
      const errorRate = totalActions > 0 ? (failedActions / totalActions) * 100 : 0;
      const successRate = totalActions > 0 ? (successfulActions / totalActions) * 100 : 100;
      
      const speeds = history
        .filter((a: any) => a.duration && a.duration > 0)
        .map((a: any) => a.duration);
      const averageSpeed = speeds.length > 0
        ? speeds.reduce((sum: number, speed: number) => sum + speed, 0) / speeds.length
        : 0;

      setMetrics({
        errorRate: Math.round(errorRate),
        averageSpeed: Math.round(averageSpeed),
        totalActions,
        successRate: Math.round(successRate),
      });
    });

    // Subscribe to keyboard events for carousel navigation
    const unsubKeyDown = core.eventBus.on('keyboard:keydown', (payload: any) => {
      // The payload might be wrapped, extract the key
      const key = payload.key || payload.payload?.key;
      console.log('[App] Key pressed:', key, 'Full payload:', payload);
      
      const startTime = Date.now();
      
      if (key === 'ArrowRight') {
        setCurrentImageIndex((prev) => (prev + 1) % 5);
        core.history.add({
          type: 'intent:navigate_right',
          success: true,
          timestamp: startTime,
        } as any);
      } else if (key === 'ArrowLeft') {
        setCurrentImageIndex((prev) => (prev - 1 + 5) % 5);
        core.history.add({
          type: 'intent:navigate_left',
          success: true,
          timestamp: startTime,
        } as any);
      } else if (key && !['Shift', 'Control', 'Alt', 'Meta', 'Tab'].includes(key)) {
        // Invalid key - simulate error (ignore modifier keys)
        core.history.add({
          type: 'intent:invalid',
          success: false,
          timestamp: startTime,
        } as any);
      }
    });

    return () => {
      unsubscribe();
      unsubHistory();
      unsubKeyDown();
    };
  }, [core]);

  return (
    <div className="app">
      <header className="app-header">
        <h1 className="app-title">
          <span className="gradient-text">Navigator</span>
          <span className="subtitle">Cognitive Showcase</span>
        </h1>
        <div className="status-badge" data-status={core ? 'running' : 'initializing'}>
          {core ? 'running' : 'initializing'}
        </div>
      </header>

      <div className="main-content">
        {/* Left Column - The Action */}
        <div className="action-panel" data-testid="carousel-wrapper">
          <div className="panel-header">
            <h2>🎯 The Action</h2>
            <p className="panel-description">
              Use <kbd>←</kbd> <kbd>→</kbd> to navigate. Press invalid keys to simulate errors.
            </p>
          </div>
          <ImageCarousel 
            currentIndex={currentImageIndex}
            cognitiveState={cognitiveState}
          />
        </div>

        {/* Right Column - The Reaction (Cognitive HUD) */}
        <div className="hud-panel">
          <CognitiveHUD
            cognitiveState={cognitiveState}
            metrics={metrics}
            lastAction={lastAction}
          />
        </div>
      </div>

      <footer className="app-footer">
        <p>
          Press <kbd>←</kbd> <kbd>→</kbd> repeatedly to show concentration.
          Press random keys to trigger frustration state.
        </p>
      </footer>
    </div>
  );
}

export default App;
