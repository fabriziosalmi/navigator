# @navigator.menu/react

React integration for Navigator.Menu - **BYOS v0.1** (Bring Your Own State).

## Installation

```bash
npm install @navigator.menu/react @navigator.menu/core
# or
pnpm add @navigator.menu/react @navigator.menu/core
```

## Usage

This minimal version focuses on **lifecycle management only**. You manage your own state and event subscriptions.

```tsx
import { useState, useEffect } from 'react';
import { useNavigator } from '@navigator.menu/react';
import { KeyboardPlugin } from '@navigator.menu/plugin-keyboard';

function App() {
  const [lastKey, setLastKey] = useState<string | null>(null);
  
  // Initialize Navigator with plugins
  const { core } = useNavigator({
    plugins: [new KeyboardPlugin()],
  });

  // Subscribe to events manually
  useEffect(() => {
    if (!core) return;
    
    const unsubscribe = core.eventBus.on('keyboard:keydown', (event) => {
      setLastKey(event.key);
    });
    
    return unsubscribe;
  }, [core]);

  return (
    <div>
      <h1>Last key pressed: {lastKey || 'none'}</h1>
    </div>
  );
}
```

## API

### `useNavigator(config?)`

React hook that manages NavigatorCore lifecycle.

**Parameters:**
- `config` (optional): NavigatorCore configuration
  - `plugins?: INavigatorPlugin[]` - Array of plugins to register
  - `autoStart?: boolean` - Auto-start core after init (default: `true`)
  - `initialState?: object` - Initial application state
  - `debugMode?: boolean` - Enable debug logging

**Returns:**
- `core: NavigatorCore | null` - The core instance (null until initialized)

## Philosophy

**BYOS v0.1** gives you:
- ✅ Automatic lifecycle management (init, start, destroy)
- ✅ Full control over state and events
- ✅ SSR-safe with dynamic imports
- ✅ Minimal footprint (<1KB)

**Future v0.2** will add:
- Built-in reactive state management
- Automatic event-to-state bindings
- React-specific optimizations

## License

MIT
