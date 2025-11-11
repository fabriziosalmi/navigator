# FASE 3: Fix Plan - Issues #1 & #2

## Analisi dei Problemi

### Issue #1: Navigator Auto-Start Failure
**Root Cause:**
1. Il `useNavigator()` hook viene chiamato ma non vengono passati i plugin
2. L'App.tsx non utilizza il `core` restituito da `useNavigator`
3. L'interfaccia mostra uno status hard-coded invece dello status reale del Navigator
4. Non c'è integrazione tra il Navigator Core e l'UI React

### Issue #2: Keyboard Events Not Captured  
**Root Cause:**
1. Il KeyboardPlugin non è registrato nel Navigator Core
2. L'App usa listener nativi `window.addEventListener` invece degli eventi del Navigator
3. Non c'è sottoscrizione all'EventBus del Navigator
4. Il plugin non è configurato né inizializzato

## Piano di Fix

### Step 1: Modificare App.tsx per integrare Navigator Core

**File:** `apps/react-test-app/src/App.tsx`

**Modifiche necessarie:**
1. ✅ Importare `KeyboardPlugin` da `@navigator.menu/plugin-keyboard`
2. ✅ Passare config completa a `useNavigator()` includendo il plugin
3. ✅ Aggiungere stato per tracking dello stato del Navigator
4. ✅ Sottoscriversi agli eventi dell'EventBus invece di `window.addEventListener`
5. ✅ Mostrare lo status reale del Navigator invece di hard-coded

### Step 2: Aggiungere data-testid per i test E2E

**Modifiche necessarie:**
1. ✅ Aggiungere `data-testid="last-key"` al valore lastKey
2. ✅ Aggiungere `data-testid="event-count"` al contatore
3. ✅ Aggiungere `className="status-value"` per il selector CSS
4. ✅ Aggiungere `data-testid="navigator-status"` per lo stato del Navigator

### Step 3: Implementare corretto cleanup

**Modifiche necessarie:**
1. ✅ Assicurare che le sottoscrizioni EventBus vengano cleanup in useEffect
2. ✅ Verificare che `useNavigator` faccia destroy() corretto

## Codice delle Fix

### Fix 1: App.tsx Completa Refactor

```tsx
import { useState, useEffect } from 'react';
import { useNavigator } from '@navigator.menu/react';
import { KeyboardPlugin } from '@navigator.menu/plugin-keyboard';
import './App.css';

function App() {
  // 📊 State management
  const [lastKey, setLastKey] = useState<string>('none');
  const [eventCount, setEventCount] = useState(0);
  const [intent, setIntent] = useState<string>('waiting...');
  const [navigatorStatus, setNavigatorStatus] = useState<string>('Initializing...');

  // 🚀 Initialize Navigator with KeyboardPlugin
  const { core } = useNavigator({
    plugins: [new KeyboardPlugin()],
    autoStart: true, // Auto-start è già default true
    debugMode: true
  });

  // 📡 Subscribe to Navigator events
  useEffect(() => {
    if (!core) return;

    // Track Navigator status changes
    const unsubscribeStateChange = core.eventBus.on('core:state:change', (state) => {
      const status = state.isRunning ? 'Running' : 'Stopped';
      setNavigatorStatus(status);
    });

    // Subscribe to keyboard events from the plugin
    const unsubscribeKeyboard = core.eventBus.on('keyboard:keydown', (event: any) => {
      const key = event.key;
      setLastKey(key);
      setEventCount((prev) => prev + 1);
      
      // Map keys to intents
      switch(key) {
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
        default:
          setIntent(`🔤 Key: ${key}`);
      }
    });

    return () => {
      unsubscribeStateChange();
      unsubscribeKeyboard();
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
              <span className="label">Navigator Status:</span>
              <span className="status-value" data-testid="navigator-status">
                {navigatorStatus}
              </span>
            </div>
            <div className="status-item">
              <span className="label">Last Key:</span>
              <span className="status-value" data-testid="last-key">
                {lastKey}
              </span>
            </div>
            <div className="status-item">
              <span className="label">Event Count:</span>
              <span className="status-value" data-testid="event-count">
                {eventCount}
              </span>
            </div>
            <div className="status-item full-width">
              <span className="label">Intent:</span>
              <span className="value intent">{intent}</span>
            </div>
          </div>

          <div className="instructions">
            <h3>Try these keys:</h3>
            <ul>
              <li><kbd>Arrow Keys</kbd> - Navigation intents</li>
              <li><kbd>Enter</kbd> - Select intent</li>
              <li><kbd>Escape</kbd> - Cancel intent</li>
              <li><kbd>Any Key</kbd> - Trigger event</li>
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
            ✨ <strong>Decoupled Design:</strong> KeyboardPlugin emits events through the EventBus, 
            and React components subscribe without tight coupling.
          </p>
        </div>
      </main>

      <footer>
        <p>
          Powered by <strong>@navigator.menu/core v2.0</strong>
        </p>
      </footer>
    </div>
  );
}

export default App;
```

### Verifiche da Fare Dopo il Fix

1. ✅ Build dell'app: `pnpm --filter @navigator.menu/react-test-app build`
2. ✅ Avvio dev server: `pnpm --filter @navigator.menu/react-test-app dev`
3. ✅ Test manuale: Premere tasti e verificare che l'UI si aggiorni
4. ✅ Eseguire test E2E: `pnpm playwright test issue-01-auto-start.spec.ts`
5. ✅ Eseguire test E2E: `pnpm playwright test issue-02-keyboard-events.spec.ts`
6. ✅ Verificare che i test passino (GREEN phase)

## Eventi del Navigator Core da Verificare

Dobbiamo verificare che il NavigatorCore emetta questi eventi:

1. `core:state:change` - Quando lo stato cambia (running/stopped)
2. `keyboard:keydown` - Dal KeyboardPlugin

Se questi eventi non vengono emessi, dobbiamo fixare il Core e il Plugin.
