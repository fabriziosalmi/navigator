import { useState, useEffect } from 'react';
import { useNavigator } from '@navigator.menu/react';
import { KeyboardPlugin } from '@navigator.menu/plugin-keyboard';
import ImageCarousel from './components/ImageCarousel';
import CognitiveHUD from './components/CognitiveHUD';
import OnboardingWizard from './components/OnboardingWizard';
import InputModeToggle from './components/InputModeToggle';
import './App.css';

interface CognitiveMetrics {
  errorRate: number;
  averageSpeed: number;
  totalActions: number;
  successRate: number;
  errorCount: number;
  successCount: number;
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
    errorCount: 0,
    successCount: 0,
  });
  const [lastAction, setLastAction] = useState<Action | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [, setOnboardingComplete] = useState(false);
  const [gestureEnabled, setGestureEnabled] = useState(false);

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

    // Track last processed key timestamp to avoid duplicate dispatches
    let lastProcessedTimestamp: number | undefined = undefined;

    // Subscribe to Store state changes (unidirectional flow)
    const unsubscribe = core.store.subscribe(() => {
      const state = core.store.getState();
      
      // Update cognitive state display
      const cognitiveSlice = state.cognitive;
      setCognitiveState(cognitiveSlice.currentState);

      // React to keyboard input changes
      const inputSlice = state.input?.keyboard;
      const currentKey = inputSlice?.lastKey;
      const currentTimestamp = inputSlice?.lastTimestamp;

      // Process new key press (check timestamp to avoid duplicates)
      if (currentKey && currentTimestamp && currentTimestamp !== lastProcessedTimestamp) {
        lastProcessedTimestamp = currentTimestamp;
        
        console.log('[App] Key pressed:', currentKey);

        const navigationKeys = ['ArrowLeft', 'ArrowRight'];
        const modifierKeys = ['Shift', 'Control', 'Alt', 'Meta', 'Tab'];

        if (navigationKeys.includes(currentKey)) {
          // Valid navigation key - update carousel
          if (currentKey === 'ArrowRight') {
            setCurrentImageIndex((prev) => (prev + 1) % 5);
          } else if (currentKey === 'ArrowLeft') {
            setCurrentImageIndex((prev) => (prev - 1 + 5) % 5);
          }
          
          // Dispatch semantic success action
          core.store.dispatch({
            type: 'carousel/NAVIGATE',
            payload: { key: currentKey, direction: currentKey === 'ArrowRight' ? 'next' : 'prev' }
          });
        } else if (!modifierKeys.includes(currentKey)) {
          // Invalid key - dispatch semantic error action
          console.log('[App] Invalid key pressed:', currentKey);
          core.store.dispatch({
            type: 'carousel/INVALID_KEY',
            payload: { key: currentKey }
          });
        }
      }
    });

    // Subscribe to action history for metrics display
    const unsubHistory = core.eventBus.on('history:action:recorded', (payload: any) => {
      console.log('[App] Action recorded:', payload);
      
      // The payload structure is { action: {...}, historySize: number }
      const actionData = payload.action || payload;
      
      // Determine if this is a valid action or an error
      // Valid actions: navigation, interaction, combos
      // Invalid actions: random keypresses like X, Y, Z, A, S, D, etc.
      const isValidAction = 
        actionData.type?.startsWith('navigation:') ||
        actionData.type?.startsWith('interaction:') ||
        actionData.type?.startsWith('keyboard:combo:') ||
        actionData.type === 'unknown';
      
      setLastAction({
        type: actionData.type || 'unknown',
        success: isValidAction,
        timestamp: actionData.timestamp || Date.now(),
        duration: actionData.duration || 0,
      });

      // Update metrics - count invalid keypresses as errors
      const history = core.history.getAll();
      const totalActions = history.length;
      
      // Count successful actions (navigation, interaction)
      const successfulActions = history.filter((a: any) => {
        return a.type?.startsWith('navigation:') ||
               a.type?.startsWith('interaction:') ||
               a.type?.startsWith('keyboard:combo:');
      }).length;
      
      // Count error actions (invalid keypresses)
      const failedActions = history.filter((a: any) => {
        return a.type?.startsWith('keyboard:keypress:');
      }).length;
      
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
        errorCount: failedActions,
        successCount: successfulActions,
      });
    });

    return () => {
      unsubscribe();
      unsubHistory();
    };
  }, [core]);

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-left">
          <h1 className="app-title">
            <span className="gradient-text">Navigator</span>
            <span className="subtitle">Cognitive Showcase</span>
          </h1>
          <div className="status-badge" data-status={core ? 'running' : 'initializing'}>
            {core ? 'running' : 'initializing'}
          </div>
        </div>
        
        {/* Onboarding Wizard in Header */}
        <div className="header-right">
          <OnboardingWizard
            metrics={metrics}
            cognitiveState={cognitiveState}
            onComplete={() => setOnboardingComplete(true)}
          />
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
          
          {/* Input Mode Toggle */}
          <div style={{ marginTop: '1.5rem' }}>
            <InputModeToggle
              gestureEnabled={gestureEnabled}
              onToggle={setGestureEnabled}
            />
          </div>
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
