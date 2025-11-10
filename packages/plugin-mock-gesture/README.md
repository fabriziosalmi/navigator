# @navigator.menu/plugin-mock-gesture

> **Mock Gesture Plugin** - Auto-emit gesture events for demos and testing

## Purpose

This plugin automatically emits simulated gesture/swipe events without requiring actual user interaction. Perfect for:

- 🎬 **Demos**: Show plugin hot-swapping in action
- 🧪 **Testing**: Automate gesture-based UI tests
- 🐛 **Debugging**: Test gesture logic without physical devices

## Installation

```bash
pnpm add @navigator.menu/plugin-mock-gesture
# or
npm install @navigator.menu/plugin-mock-gesture
```

## Basic Usage

```ts
import { MockGesturePlugin } from '@navigator.menu/plugin-mock-gesture';
import { useNavigator } from '@navigator.menu/react';

function App() {
  const { core } = useNavigator({
    plugins: [
      new MockGesturePlugin({ interval: 1000 }) // Emit every 1 second
    ],
  });
  
  // Your component will receive gesture events automatically!
}
```

## Configuration

```ts
new MockGesturePlugin({
  interval: 2000,      // Time between events (ms) - default: 2000
  alternate: true,     // Toggle left/right - default: true
  emitIntents: true,   // Emit navigation intents - default: true
});
```

## Events Emitted

### Gesture Events
- `gesture:swipe_left` - Swipe left detected
- `gesture:swipe_right` - Swipe right detected

### Navigation Intents (if `emitIntents: true`)
- `intent:navigate_left` - Navigate left intent
- `intent:navigate_right` - Navigate right intent

## Demo Use Case: Hot-Swap

The killer feature - swap from keyboard to mock gestures **without changing your component**:

```tsx
// Before (keyboard input)
const { core } = useNavigator({
  plugins: [new KeyboardPlugin()],
});

// After (auto gestures) - COMPONENT CODE STAYS THE SAME!
const { core } = useNavigator({
  plugins: [new MockGesturePlugin({ interval: 1000 })],
});
```

Your UI will now update automatically every second, **proving complete decoupling**!

## Event Payload Structure

```ts
{
  type: 'gesture:swipe_left',
  timestamp: 1734800000000,
  payload: {
    direction: 'left',
    mock: true  // ← Flag indicating simulated event
  }
}
```

The `mock: true` flag lets you differentiate simulated events from real gestures in your app.

## Testing Example

```ts
import { MockGesturePlugin } from '@navigator.menu/plugin-mock-gesture';
import { NavigatorCore } from '@navigator.menu/core';

test('component responds to gestures', async () => {
  const core = new NavigatorCore();
  const plugin = new MockGesturePlugin({ interval: 100 });
  
  await core.use(plugin);
  await core.start();
  
  // Wait for auto-emitted event
  const event = await waitForEvent(core.eventBus, 'gesture:swipe_left');
  
  expect(event.payload.mock).toBe(true);
  expect(event.payload.direction).toBe('left');
});
```

## Architecture

```
MockGesturePlugin (timer-based)
    ↓
    emits events every {interval}ms
    ↓
EventBus (Navigator Core)
    ↓
Your React Component (receives events)
```

**Zero coupling**: Your component doesn't know this is a mock plugin!

## Limitations

- **Browser only**: Uses `window.setInterval` (not for Node.js)
- **Fixed patterns**: Only alternates left/right (extendable in future)
- **Demo/test focused**: Not for production gesture handling

For real gesture detection, use `@navigator.menu/plugin-gesture` (coming soon).

## License

MIT © Navigator SDK Team
