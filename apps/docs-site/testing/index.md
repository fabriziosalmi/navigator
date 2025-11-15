# Testing Guide

Navigator SDK provides comprehensive testing utilities and best practices for ensuring your navigation implementation works correctly.

## Test Coverage

✅ **252 tests passing** with comprehensive coverage:
- Unit tests for core functionality
- Integration tests for plugin system
- E2E tests for user interactions
- Performance benchmarks

## Running Tests

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:coverage

# Run specific test file
pnpm test navigation.test.ts
```

## Test Structure

```
tests/
├── unit/                    # Unit tests
│   ├── store/              # Store and reducers
│   ├── plugins/            # Plugin system
│   └── core/               # Core functionality
├── integration/            # Integration tests
│   ├── gesture/            # Gesture integration
│   └── keyboard/           # Keyboard integration
└── e2e/                    # End-to-end tests
    ├── navigation.spec.js
    └── cognitive.spec.js
```

## Writing Tests

### Unit Tests

```javascript
import { describe, it, expect } from 'vitest';
import { NavigatorCore } from '@navigator/core';

describe('NavigatorCore', () => {
  it('should initialize with default config', () => {
    const nav = new NavigatorCore();
    expect(nav.config).toBeDefined();
    expect(nav.config.enableGestures).toBe(true);
  });

  it('should dispatch navigation action', () => {
    const nav = new NavigatorCore();
    nav.init();
    
    const action = { type: 'NAVIGATE_LEFT', payload: { to: 1 } };
    nav.store.dispatch(action);
    
    const state = nav.store.getState();
    expect(state.navigation.currentIndex).toBe(1);
  });
});
```

### Integration Tests

```javascript
import { describe, it, expect } from 'vitest';
import { NavigatorCore } from '@navigator/core';
import { GesturePlugin } from '@navigator/plugin-gesture';

describe('Gesture Integration', () => {
  it('should handle gesture navigation', async () => {
    const nav = new NavigatorCore();
    const gesturePlugin = new GesturePlugin();
    
    nav.registerPlugin(gesturePlugin);
    await nav.init();
    
    // Simulate gesture
    gesturePlugin.handleGesture('swipe_left');
    
    const state = nav.store.getState();
    expect(state.navigation.direction).toBe('left');
  });
});
```

### E2E Tests

```javascript
import { test, expect } from '@playwright/test';

test('keyboard navigation works', async ({ page }) => {
  await page.goto('http://localhost:5173');
  
  // Press arrow key
  await page.keyboard.press('ArrowRight');
  
  // Verify navigation occurred
  const currentIndex = await page.evaluate(() => {
    return window.navigator.getCurrentIndex();
  });
  
  expect(currentIndex).toBe(1);
});
```

## Testing Reducers

Reducers are pure functions - perfect for testing:

```javascript
import { navigationReducer } from '@navigator/core/store/reducers';

describe('navigationReducer', () => {
  it('handles NAVIGATE_LEFT action', () => {
    const initialState = { currentIndex: 0 };
    const action = { type: 'NAVIGATE_LEFT', payload: { to: 1 } };
    
    const newState = navigationReducer(initialState, action);
    
    expect(newState.currentIndex).toBe(1);
    expect(initialState.currentIndex).toBe(0); // Immutability
  });
});
```

## Mocking

### Mock Gesture Plugin

```javascript
import { MockGesturePlugin } from '@navigator/plugin-mock-gesture';

const mockPlugin = new MockGesturePlugin();
mockPlugin.simulateGesture('swipe_left');
```

### Mock Store

```javascript
import { createStore } from '@navigator/core/store';

const mockStore = createStore(reducer, {
  navigation: { currentIndex: 0 },
  cognitive: { patterns: new Map() }
});
```

## Performance Testing

```javascript
import { performance } from 'perf_hooks';

test('navigation completes in under 16ms', () => {
  const nav = new NavigatorCore();
  nav.init();
  
  const start = performance.now();
  nav.navigate('left');
  const end = performance.now();
  
  expect(end - start).toBeLessThan(16); // 60fps
});
```

## CI/CD Integration

Tests run automatically on:
- ✅ Pull requests
- ✅ Commits to main
- ✅ Pre-deploy checks

```yaml
# .github/workflows/test.yml
name: Test
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: pnpm install
      - run: pnpm test
```

## Debugging Tests

### Visual Debugging (E2E)

```bash
# Run Playwright in headed mode
pnpm playwright test --headed

# Open Playwright UI
pnpm playwright test --ui
```

### VS Code Debugging

Add to `.vscode/launch.json`:

```json
{
  "type": "node",
  "request": "launch",
  "name": "Vitest Tests",
  "runtimeExecutable": "pnpm",
  "runtimeArgs": ["test"],
  "console": "integratedTerminal"
}
```

## Best Practices

1. **Test Behavior, Not Implementation**
   - ✅ Test what the user experiences
   - ❌ Don't test internal implementation details

2. **Keep Tests Isolated**
   - Each test should run independently
   - Use `beforeEach` for setup

3. **Use Meaningful Descriptions**
   ```javascript
   // ✅ Good
   it('should navigate to next card when swiping left', ...)
   
   // ❌ Bad
   it('test1', ...)
   ```

4. **Test Edge Cases**
   - Boundary conditions
   - Error states
   - Race conditions

## Related Documentation

- [E2E Timeout Debugging](./e2e-timeout-debugging-plan)
- [GitHub Test Results](https://github.com/fabriziosalmi/navigator/tree/main/test-results)

## Resources

- [Vitest Documentation](https://vitest.dev)
- [Playwright Documentation](https://playwright.dev)
- [Testing Library](https://testing-library.com)
