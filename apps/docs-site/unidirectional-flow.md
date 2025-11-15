# Unidirectional Data Flow Architecture

> **Since November 2025**, Navigator SDK uses a **Redux-like Unidirectional Data Flow** architecture for predictable, debuggable state management.

## Overview

The Unidirectional Flow pattern ensures that:

- ✅ **Single Source of Truth**: All state lives in the Store
- ✅ **Predictable Updates**: State changes only through dispatched actions
- ✅ **Immutable State**: State is never mutated directly
- ✅ **Time-Travel Debugging**: Full history tracking for debugging
- ✅ **Testability**: Pure reducers are easy to test

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                         UI / Plugins                          │
└────────────┬────────────────────────────────────┬────────────┘
             │                                    │
             │ dispatch(action)                   │ subscribe()
             ▼                                    │
┌─────────────────────────────────────────────────▼────────────┐
│                          STORE                                │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                    ROOT STATE                         │   │
│  │  {                                                    │   │
│  │    navigation: { ... },                              │   │
│  │    cognitive: { ... },                               │   │
│  │    history: { ... },                                 │   │
│  │    ui: { ... },                                      │   │
│  │    session: { ... }                                  │   │
│  │  }                                                    │   │
│  └──────────────────────────────────────────────────────┘   │
│                           ▲                                   │
│                           │                                   │
│                    Reducers Combine                           │
│                           │                                   │
│  ┌────────────┬──────────┼──────────┬──────────────────┐    │
│  │Navigation  │Cognitive │ History  │    UI & Session  │    │
│  │ Reducer    │ Reducer  │ Reducer  │    Reducers      │    │
│  └────────────┴──────────┴──────────┴──────────────────┘    │
└───────────────────────────────────────────────────────────────┘
```

## Data Flow

1. **User Action** → Plugin detects gesture/keyboard input
2. **Dispatch Action** → `store.dispatch({ type: 'NAVIGATE_LEFT', payload: {...} })`
3. **Reducer Processing** → Pure function returns new state
4. **State Update** → Store updates with new immutable state
5. **Subscribers Notified** → UI/plugins receive state update
6. **Re-render** → UI updates based on new state

## Core Concepts

### Store

The **Store** is the single source of truth holding the entire application state.

```typescript
import { createStore } from '@navigator/core/store';

const store = createStore(rootReducer, initialState);
```

### Actions

**Actions** are plain objects describing what happened:

```typescript
// Navigation action
{
  type: 'NAVIGATE_LEFT',
  payload: {
    from: 0,
    to: 1,
    timestamp: Date.now()
  }
}

// Cognitive learning action
{
  type: 'COGNITIVE_LEARN',
  payload: {
    pattern: 'swipe_left',
    confidence: 0.95
  }
}
```

### Reducers

**Reducers** are pure functions that take the current state and an action, returning new state:

```typescript
function navigationReducer(state = initialState, action) {
  switch (action.type) {
    case 'NAVIGATE_LEFT':
      return {
        ...state,
        currentIndex: action.payload.to,
        previousIndex: action.payload.from,
        direction: 'left'
      };
    
    default:
      return state;
  }
}
```

### Subscribers

**Subscribers** listen to state changes:

```typescript
const unsubscribe = store.subscribe((state) => {
  console.log('New state:', state);
  updateUI(state.navigation);
});
```

## State Structure

```typescript
{
  // Navigation state
  navigation: {
    currentIndex: number,
    previousIndex: number,
    direction: 'left' | 'right' | 'up' | 'down',
    isNavigating: boolean
  },

  // Cognitive system state
  cognitive: {
    patterns: Map<string, Pattern>,
    predictions: Prediction[],
    learningRate: number,
    confidenceThreshold: number
  },

  // Action history (for debugging)
  history: {
    past: Action[],
    maxSize: number,
    enabled: boolean
  },

  // UI state
  ui: {
    hudVisible: boolean,
    theme: 'light' | 'dark',
    notifications: Notification[]
  },

  // Session state
  session: {
    startTime: number,
    userId: string,
    preferences: UserPreferences
  }
}
```

## Migration from EventBus

The old EventBus pattern is **deprecated** but still supported for backward compatibility:

### ❌ Old Pattern (EventBus)

```javascript
// Old way - bidirectional, hard to debug
eventBus.on('navigate:left', (data) => {
  // Multiple listeners can modify state
  appState.currentIndex = data.newIndex;
});

eventBus.emit('navigate:left', { newIndex: 5 });
```

### ✅ New Pattern (Store)

```javascript
// New way - unidirectional, predictable
store.dispatch({
  type: 'NAVIGATE_LEFT',
  payload: { to: 5, from: 0 }
});

// Subscribe to changes
store.subscribe((state) => {
  renderUI(state.navigation);
});
```

## Benefits

### 🔍 Debugging

Time-travel debugging with full action history:

```javascript
// Get all past actions
const history = store.getState().history.past;

// Replay actions
history.forEach(action => store.dispatch(action));
```

### 🧪 Testing

Pure reducers are trivial to test:

```javascript
test('navigation reducer handles NAVIGATE_LEFT', () => {
  const state = { currentIndex: 0 };
  const action = { type: 'NAVIGATE_LEFT', payload: { to: 1 } };
  
  const newState = navigationReducer(state, action);
  
  expect(newState.currentIndex).toBe(1);
  expect(state.currentIndex).toBe(0); // Immutability
});
```

### 🎯 Predictability

State changes are:
- **Explicit** - only through actions
- **Traceable** - full audit trail
- **Reversible** - can undo/redo
- **Serializable** - can save/restore state

## Advanced Patterns

### Middleware

Add custom logic between dispatch and reducer:

```javascript
const loggerMiddleware = (store) => (next) => (action) => {
  console.log('Dispatching:', action);
  const result = next(action);
  console.log('New state:', store.getState());
  return result;
};
```

### Async Actions

Handle async operations with thunks:

```javascript
function loadUserPreferences(userId) {
  return async (dispatch) => {
    dispatch({ type: 'LOADING_START' });
    
    const prefs = await fetchPreferences(userId);
    
    dispatch({
      type: 'PREFERENCES_LOADED',
      payload: prefs
    });
  };
}
```

## Implementation Status

✅ **Sprint 1 Complete** (November 2025)
- Mini-Redux implementation
- Core reducers (navigation, cognitive, history, UI, session)
- Legacy Bridge for backward compatibility
- 250+ tests passing

🚀 **Future Enhancements**
- Enhanced middleware support
- DevTools integration
- State persistence
- Hot module replacement

## Learn More

- [Architecture Overview](/architecture)
- [Plugin Architecture](/plugin-architecture)
- [Cookbook Examples](/cookbook)
- [Sprint 1 Completion Report](https://github.com/fabriziosalmi/navigator/blob/main/docs/SPRINT_1_UNIDIRECTIONAL_FLOW_COMPLETION.md)
