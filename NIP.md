# Navigator Intent Protocol (NIP) v1.0

**Status:** Draft  
**Version:** 1.0.0  
**Last Updated:** January 2025

## 📋 Executive Summary

The Navigator Intent Protocol (NIP) is a **formal, semantic, JSON-based event protocol** that defines the communication language between Navigator components. NIP ensures type safety, version compatibility, and predictable behavior across the entire ecosystem.

**Design Principles:**
1. **Semantic:** Events describe *intent* not *implementation*
2. **JSON-based:** Portable, language-agnostic
3. **Versioned:** Forward/backward compatibility
4. **Intent vs Action:** Clear separation of "what user wants" vs "what system does"
5. **Discoverable:** Self-documenting schemas

---

## 🏗️ Event Anatomy

Every NIP event follows this structure:

```typescript
interface NipEvent {
  type: string;           // Namespaced event type (e.g., "input:gesture:swipe_left")
  version: string;        // Protocol version (e.g., "1.0.0")
  timestamp: number;      // performance.now() when emitted
  source: string;         // Plugin/component that emitted it
  payload: any;           // Event-specific data
  metadata?: {            // Optional metadata
    traceId?: string;     // For distributed tracing
    userId?: string;      // For analytics
    sessionId?: string;   // Session identifier
  };
}
```

---

## 📚 Event Catalog

### Namespace: `core`

Core lifecycle and system events.

#### `core:init:start`
**Intent:** Core initialization has begun  
**Emitted by:** NavigatorCore  
**Payload:**
```typescript
{
  version: string;        // Navigator version
  config: object;         // Sanitized config (no secrets)
}
```

#### `core:init:complete`
**Intent:** Core initialization succeeded  
**Emitted by:** NavigatorCore  
**Payload:**
```typescript
{
  duration_ms: number;
  plugins_loaded: string[];
}
```

#### `core:start:begin`
**Intent:** Core starting all plugins  
**Emitted by:** NavigatorCore  
**Payload:** `{}`

#### `core:start:complete`
**Intent:** All plugins started successfully  
**Emitted by:** NavigatorCore  
**Payload:**
```typescript
{
  duration_ms: number;
  plugins_started: string[];
}
```

#### `core:stop:begin`
**Intent:** Core stopping all plugins  
**Emitted by:** NavigatorCore  
**Payload:** `{}`

#### `core:stop:complete`
**Intent:** All plugins stopped  
**Emitted by:** NavigatorCore  
**Payload:**
```typescript
{
  duration_ms: number;
}
```

#### `core:error`
**Intent:** Fatal error in core  
**Emitted by:** NavigatorCore, Plugins  
**Payload:**
```typescript
{
  message: string;
  error: Error;         // Serialized error object
  severity: 'critical' | 'warning' | 'info';
  context?: any;        // Additional debug info
}
```

---

### Namespace: `input`

User input events (gestures, keyboard, voice).

#### `input:gesture:hand_detected`
**Intent:** Hand entered camera view  
**Emitted by:** GestureInputPlugin  
**Payload:**
```typescript
{
  hand_index: number;   // 0 or 1
  confidence: number;   // 0.0 - 1.0
}
```

#### `input:gesture:hand_lost`
**Intent:** Hand left camera view  
**Emitted by:** GestureInputPlugin  
**Payload:**
```typescript
{
  hand_index: number;
  duration_tracked_ms: number;
}
```

#### `input:gesture:swipe_left`
**Intent:** User performed leftward swipe  
**Emitted by:** GestureInputPlugin  
**Payload:**
```typescript
{
  distance: number;         // Normalized 0-1
  duration_ms: number;      // Time to complete
  velocity: number;         // pixels/ms
  start_pos: { x: number; y: number };
  end_pos: { x: number; y: number };
  confidence: number;       // 0.0 - 1.0
}
```

#### `input:gesture:swipe_right`
**Intent:** User performed rightward swipe  
**Emitted by:** GestureInputPlugin  
**Payload:** Same as `swipe_left`

#### `input:gesture:swipe_up`
**Intent:** User performed upward swipe  
**Emitted by:** GestureInputPlugin  
**Payload:** Same as `swipe_left`

#### `input:gesture:swipe_down`
**Intent:** User performed downward swipe  
**Emitted by:** GestureInputPlugin  
**Payload:** Same as `swipe_left`

#### `input:gesture:pinch`
**Intent:** User performed pinch gesture  
**Emitted by:** GestureInputPlugin  
**Payload:**
```typescript
{
  distance: number;         // Thumb-index distance
  confidence: number;
}
```

#### `input:gesture:fist`
**Intent:** User made fist gesture  
**Emitted by:** GestureInputPlugin  
**Payload:**
```typescript
{
  confidence: number;
}
```

#### `input:gesture:point`
**Intent:** User pointing (held for duration)  
**Emitted by:** GestureInputPlugin  
**Payload:**
```typescript
{
  position: { x: number; y: number };
  hold_duration_ms: number;
  stability: number;        // 0-1, lower = more stable
}
```

#### `input:keyboard:keydown`
**Intent:** Keyboard key pressed  
**Emitted by:** KeyboardInputPlugin  
**Payload:**
```typescript
{
  key: string;              // e.g., "ArrowLeft"
  code: string;             // e.g., "ArrowLeft"
  ctrlKey: boolean;
  shiftKey: boolean;
  altKey: boolean;
  metaKey: boolean;
}
```

#### `input:voice:command`
**Intent:** Voice command recognized  
**Emitted by:** VoiceInputPlugin  
**Payload:**
```typescript
{
  transcript: string;       // Raw speech-to-text
  command: string;          // Parsed command (e.g., "navigate_left")
  confidence: number;
  language: string;         // e.g., "en-US"
}
```

---

### Namespace: `intent`

High-level user intentions (what user wants to do).

#### `intent:navigate_left`
**Intent:** User wants to navigate left  
**Emitted by:** NavigationLogicPlugin  
**Payload:**
```typescript
{
  source: 'gesture' | 'keyboard' | 'voice';
  confidence: number;
}
```

#### `intent:navigate_right`
**Intent:** User wants to navigate right  
**Emitted by:** NavigationLogicPlugin  
**Payload:** Same as `navigate_left`

#### `intent:navigate_up`
**Intent:** User wants to navigate up (layer change)  
**Emitted by:** NavigationLogicPlugin  
**Payload:** Same as `navigate_left`

#### `intent:navigate_down`
**Intent:** User wants to navigate down (layer change)  
**Emitted by:** NavigationLogicPlugin  
**Payload:** Same as `navigate_left`

#### `intent:select_card`
**Intent:** User wants to select current card  
**Emitted by:** NavigationLogicPlugin  
**Payload:**
```typescript
{
  card_index: number;
  source: 'gesture' | 'keyboard' | 'voice';
}
```

#### `intent:prediction`
**Intent:** System predicts user's next action  
**Emitted by:** IntentPredictorPlugin  
**Payload:**
```typescript
{
  gesture: string;          // Predicted gesture
  confidence: number;       // 0.0 - 1.0
  probabilities: {          // All gesture probabilities
    [gesture: string]: number;
  };
}
```

#### `intent:stable`
**Intent:** Prediction is very stable (>95% confidence)  
**Emitted by:** IntentPredictorPlugin  
**Payload:**
```typescript
{
  gesture: string;
  confidence: number;       // >= 0.95
}
```

#### `intent:pre_render`
**Intent:** Pre-render target for predicted action  
**Emitted by:** IntentPredictorPlugin  
**Payload:**
```typescript
{
  gesture: string;
  confidence: number;       // >= 0.85
  target: any;              // Predicted navigation target
}
```

---

### Namespace: `navigation`

Navigation state changes (actual navigation events).

#### `navigation:card:change`
**Intent:** Active card changed  
**Emitted by:** DomRendererPlugin  
**Payload:**
```typescript
{
  previous_index: number;
  current_index: number;
  layer: string;            // Layer name
  direction: 1 | -1;        // 1=right, -1=left
  transition_duration_ms: number;
}
```

#### `navigation:layer:change`
**Intent:** Active layer changed  
**Emitted by:** DomRendererPlugin  
**Payload:**
```typescript
{
  previous_layer: string;
  current_layer: string;
  previous_index: number;
  current_index: number;
  direction: 1 | -1;        // 1=up, -1=down
}
```

#### `navigation:error`
**Intent:** Navigation failed  
**Emitted by:** DomRendererPlugin  
**Payload:**
```typescript
{
  message: string;
  attempted_action: string;
  reason: string;
}
```

---

### Namespace: `cognitive_state`

Cognitive intelligence events.

#### `cognitive_state:change`
**Intent:** User's cognitive state changed  
**Emitted by:** CognitiveModelPlugin  
**Payload:**
```typescript
{
  from: 'neutral' | 'frustrated' | 'concentrated' | 'exploring' | 'learning';
  to: 'neutral' | 'frustrated' | 'concentrated' | 'exploring' | 'learning';
  signals: {
    frustrated: number;
    concentrated: number;
    exploring: number;
    learning: number;
  };
  confidence: number;
}
```

#### `cognitive_state:frustrated`
**Intent:** User entered frustrated state  
**Emitted by:** CognitiveModelPlugin  
**Payload:**
```typescript
{
  from: string;
  error_rate: number;
  error_clusters: number;
}
```

#### `cognitive_state:concentrated`
**Intent:** User entered concentrated/flow state  
**Emitted by:** CognitiveModelPlugin  
**Payload:**
```typescript
{
  from: string;
  average_speed_ms: number;
  success_rate: number;
}
```

#### `cognitive_state:exploring`
**Intent:** User entered exploration state  
**Emitted by:** CognitiveModelPlugin  
**Payload:**
```typescript
{
  from: string;
  action_variety: number;
  pause_count: number;
}
```

#### `cognitive_state:learning`
**Intent:** User is learning (improving)  
**Emitted by:** CognitiveModelPlugin  
**Payload:**
```typescript
{
  from: string;
  improvement_rate: number;
  baseline_success: number;
  current_success: number;
}
```

---

### Namespace: `system`

System-level events.

#### `system:ready`
**Intent:** System fully initialized and ready  
**Emitted by:** NavigatorCore  
**Payload:**
```typescript
{
  startup_time_ms: number;
  plugins_active: string[];
}
```

#### `system:pause`
**Intent:** System pausing (onboarding, idle)  
**Emitted by:** OnboardingPlugin, IdleSystemPlugin  
**Payload:**
```typescript
{
  reason: 'onboarding' | 'idle' | 'user_request';
}
```

#### `system:resume`
**Intent:** System resuming  
**Emitted by:** OnboardingPlugin, IdleSystemPlugin  
**Payload:**
```typescript
{
  pause_duration_ms: number;
}
```

#### `idle:start`
**Intent:** User became idle  
**Emitted by:** IdleSystemPlugin  
**Payload:**
```typescript
{
  idle_duration_ms: number;
  last_activity: string;    // Event type of last activity
}
```

#### `idle:end`
**Intent:** User became active again  
**Emitted by:** IdleSystemPlugin  
**Payload:**
```typescript
{
  idle_duration_ms: number;
  resume_trigger: string;   // What triggered resume
}
```

---

## 🔒 Schema Validation

All NIP events MUST validate against their JSON schemas. Validation is enforced in development mode.

### Example Schema (input:gesture:swipe_left)

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "$id": "https://navigator.menu/nip/v1/input/gesture/swipe_left.json",
  "type": "object",
  "required": ["type", "version", "timestamp", "source", "payload"],
  "properties": {
    "type": {
      "type": "string",
      "const": "input:gesture:swipe_left"
    },
    "version": {
      "type": "string",
      "pattern": "^\\d+\\.\\d+\\.\\d+$"
    },
    "timestamp": {
      "type": "number",
      "minimum": 0
    },
    "source": {
      "type": "string"
    },
    "payload": {
      "type": "object",
      "required": ["distance", "duration_ms", "velocity", "start_pos", "end_pos", "confidence"],
      "properties": {
        "distance": {
          "type": "number",
          "minimum": 0,
          "maximum": 1
        },
        "duration_ms": {
          "type": "number",
          "minimum": 0
        },
        "velocity": {
          "type": "number",
          "minimum": 0
        },
        "start_pos": {
          "type": "object",
          "required": ["x", "y"],
          "properties": {
            "x": { "type": "number" },
            "y": { "type": "number" }
          }
        },
        "end_pos": {
          "type": "object",
          "required": ["x", "y"],
          "properties": {
            "x": { "type": "number" },
            "y": { "type": "number" }
          }
        },
        "confidence": {
          "type": "number",
          "minimum": 0,
          "maximum": 1
        }
      }
    }
  }
}
```

---

## 🛠️ Implementation Guide

### EventBus Integration

```javascript
import { EventBus } from '@navigator.menu/core';
import { NipValidator } from '@navigator.menu/pdk';

const eventBus = new EventBus({
  validateEvents: process.env.NODE_ENV === 'development'
});

// Emit NIP-compliant event
eventBus.emit('input:gesture:swipe_left', {
  distance: 0.5,
  duration_ms: 350,
  velocity: 1.43,
  start_pos: { x: 0.2, y: 0.5 },
  end_pos: { x: 0.8, y: 0.5 },
  confidence: 0.95
});

// Validation happens automatically in dev mode
```

### Plugin Implementation

```typescript
import { BasePlugin } from '@navigator.menu/core';

export class MyPlugin extends BasePlugin {
  async onInit() {
    // Listen to NIP events
    this.on('input:gesture:swipe_left', (payload) => {
      // Type-safe payload access
      const { distance, velocity } = payload;
    });
  }

  handleUserAction() {
    // Emit NIP-compliant event
    this.emit('intent:navigate_left', {
      source: 'gesture',
      confidence: 0.9
    });
  }
}
```

---

## 📖 Versioning Strategy

NIP follows Semantic Versioning:

- **Major (1.x.x):** Breaking changes to event structure
- **Minor (x.1.x):** New events added (backward compatible)
- **Patch (x.x.1):** Documentation, schema fixes

### Backward Compatibility

Plugins SHOULD handle missing fields gracefully:

```typescript
this.on('input:gesture:swipe_left', (payload) => {
  const confidence = payload.confidence ?? 1.0; // Default if missing
  const velocity = payload.velocity ?? 0; // Default if missing
});
```

---

## 🎯 Best Practices

### DO
✅ Use semantic event names (`intent:*` for intentions)  
✅ Include confidence scores for ambiguous inputs  
✅ Add `source` to trace event origin  
✅ Use `timestamp` for analytics/debugging  
✅ Validate payloads in development mode  

### DON'T
❌ Emit events with arbitrary payloads  
❌ Mix intent and action in same event  
❌ Include sensitive data in payloads  
❌ Create events for implementation details  
❌ Break backward compatibility without major version bump  

---

## 🔮 Future Enhancements (v2.0)

- **Event Batching:** Batch multiple events for performance
- **Event Replay:** Record/replay for debugging
- **Distributed Tracing:** Cross-component trace IDs
- **Analytics Integration:** Built-in telemetry
- **Custom Events:** Plugins can register custom schemas

---

## 📚 Resources

- **JSON Schemas:** `https://navigator.menu/nip/v1/schemas/`
- **TypeScript Types:** `@navigator.menu/types`
- **Validator:** `@navigator.menu/pdk/NipValidator`
- **Examples:** `https://github.com/navigator-menu/examples`

---

## 📝 Change Log

### v1.0.0 (January 2025)
- Initial protocol specification
- Core, input, intent, navigation namespaces
- Cognitive state events
- System lifecycle events
- JSON schema validation

---

**License:** ISC  
**Maintained by:** Navigator Team  
**Contact:** https://github.com/fabriziosalmi/navigator
