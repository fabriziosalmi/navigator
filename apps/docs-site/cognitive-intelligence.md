# Behavioral State Middleware - Architecture & Implementation

**Version:** 1.0.0  
**Status:** Implemented  
**Package:** `@navigator.menu/core` (built-in middleware)

## Overview

The behavioral state middleware analyzes user interaction patterns in real-time and classifies them into one of five states: `neutral`, `frustrated`, `concentrated`, `exploring`, or `learning`. These classifications are based on rule-based analysis of action history — error rates, timing, and action variety — not machine learning or AI models.

**Data flow:** Actions dispatched → Middleware intercepts → Session history updated → Metrics analyzed → If state changes, `cognitive/STATE_CHANGE` action is dispatched → Reducers update `state.cognitive.currentState`

---

## Architecture Overview

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                    COGNITIVE INTELLIGENCE                    │
│                                                              │
│  ┌────────────────────┐         ┌────────────────────┐     │
│  │ UserSessionHistory │────────▶│ CognitiveModel     │     │
│  │ (Circular Buffer)  │         │ Plugin             │     │
│  │                    │         │                    │     │
│  │ • 50 actions max   │         │ • Frustration ✓    │     │
│  │ • Metrics API      │         │ • Concentration ✓  │     │
│  │ • Error clustering │         │ • Exploration ✓    │     │
│  └────────────────────┘         │ • Learning ✓       │     │
│                                 └──────┬─────────────┘     │
│                                        │                    │
│                                        │ cognitive_state:   │
│                                        │ change event       │
│                                        │                    │
│         ┌──────────────────────────────┴──────────┐        │
│         │                                         │        │
│         ▼                                         ▼        │
│  ┌──────────────┐                         ┌──────────────┐│
│  │ DomRenderer  │                         │ GridLock     ││
│  │ Plugin       │                         │ System       ││
│  │              │                         │              ││
│  │ • Animation  │                         │ • Thresholds ││
│  │   speed      │                         │ • Cooldowns  ││
│  │ • CSS states │                         │ • Dead zones ││
│  └──────────────┘                         └──────────────┘│
│                                                             │
│  ┌────────────────────────────────────────────────────┐   │
│  │        IntentPredictorPlugin                       │   │
│  │                                                     │   │
│  │ • Gesture signature matching                       │   │
│  │ • Trajectory analysis (velocity, direction, accel) │   │
│  │ • Probability output (85% = pre-render)            │   │
│  │ • Adaptive to cognitive state                      │   │
│  └────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## Component 1: UserSessionHistory

**File:** `packages/core/src/intelligence/UserSessionHistory.ts`  
**Purpose:** Circular buffer that stores the last N user actions for pattern analysis.

### Data Structure

Each action stored:
```javascript
{
    type: "swipe_left" | "navigate_card" | "keyboard",
    timestamp: performance.now(),
    duration_ms: 350,
    success: true,
    start_pos: { x: 0.2, y: 0.5 },
    end_pos: { x: 0.8, y: 0.5 },
    metadata: { ... }
}
```

### API Methods

| Method | Purpose | Returns |
|--------|---------|---------|
| `add(action)` | Add action to buffer | void |
| `getLatest(count)` | Get N most recent | Array |
| `getMetrics(windowSize)` | Calculate performance stats | Metrics object |
| `getErrorClusters(timeWindowMs)` | Detect error bursts | Cluster stats |
| `clear()` | Reset buffer | void |

### Metrics Calculated

```javascript
{
    errorRate: 0.15,              // 15% failure rate
    averageDuration: 450,         // Avg 450ms per action
    averageSpeed: 1.2,            // Normalized speed
    actionVariety: 0.7,           // 70% unique action types
    actionTypes: Map,             // Type frequency distribution
    recentErrors: 3,              // Last 10 actions
    velocityProfile: "fast",      // "slow" | "medium" | "fast"
    total: 50
}
```

---

## Component 2: Cognitive Middleware

**File:** `packages/core/src/store/middleware/cognitiveMiddleware.ts`  
**Priority:** 60 (middleware runs in order)  
**Purpose:** Intercepts all Store actions, records them in UserSessionHistory, analyzes recent metrics, and dispatches `cognitive/STATE_CHANGE` if the inferred state changes.

### State Machine

```
┌─────────────┐
│   NEUTRAL   │ ◀─── Starting state
└──────┬──────┘
       │
       ├─── 40% error rate + clusters ────▶ FRUSTRATED
       │
       ├─── Fast actions (<400ms) + 90% success ────▶ CONCENTRATED
       │
       ├─── 60% action variety + pauses ────▶ EXPLORING
       │
       └─── 15% success improvement ────▶ LEARNING
```

### Analyzers

#### 1. Frustration Analyzer
**Triggers when:**
- Error rate > 40% (configurable)
- 3+ errors within 5 seconds (error cluster)

**Detection Logic:**
```javascript
checkForFrustration() {
    const metrics = this.history.getMetrics(10); // Last 10 actions
    const errorClusters = this.history.getErrorClusters(5000); // 5s window
    
    if (metrics.errorRate > 0.40 && errorClusters.maxClusterSize >= 3) {
        this.signals.frustrated += 1; // Vote for frustrated state
    }
}
```

**Adaptations Triggered:**
- DomRenderer: Slower animations (+50%)
- GridLock: Lower thresholds (-30%), longer cooldowns (+50%)
- CSS: `.state-frustrated` class, helpful hints shown

#### 2. Concentration Analyzer
**Triggers when:**
- Average action duration < 400ms
- Success rate > 90%
- Low variance in timing (consistent speed)

**Detection Logic:**
```javascript
checkForConcentration() {
    const metrics = this.history.getMetrics(15); // Last 15 actions
    const actions = this.history.getLatest(15);
    
    const fastActions = metrics.averageDuration < 400;
    const highSuccess = (1 - metrics.errorRate) > 0.90;
    const variance = this._calculateVariance(actions.map(a => a.duration_ms));
    const consistentTiming = variance < 50000;
    
    if (fastActions && highSuccess && consistentTiming) {
        this.signals.concentrated += 1;
    }
}
```

**Adaptations Triggered:**
- DomRenderer: Faster animations (-40%)
- GridLock: Lower thresholds (-20%), shorter cooldowns (-30%)
- CSS: `.state-concentrated` class, distractions hidden

#### 3. Exploration Analyzer
**Triggers when:**
- Action variety > 60% (many different gesture types)
- Thinking pauses (3+ gaps > 1 second between actions)
- Moderate success rate (10%-40% errors = experimenting)

**Detection Logic:**
```javascript
checkForExploration() {
    const metrics = this.history.getMetrics(20);
    const actions = this.history.getLatest(20);
    
    const highVariety = metrics.actionVariety > 0.60;
    const pauseCount = this._countPauses(actions, 1000); // 1s threshold
    const hasPauses = pauseCount >= 3;
    
    if (highVariety && hasPauses) {
        this.signals.exploring += 1;
    }
}
```

**Adaptations Triggered:**
- DomRenderer: Normal speed
- GridLock: Very low thresholds (-40%), fast direction changes
- CSS: `.state-exploring` class, all features visible, tooltips shown

#### 4. Learning Analyzer
**Triggers when:**
- Success rate improves by 15%+ between first/second half of 20-action window

**Detection Logic:**
```javascript
checkForLearning() {
    const actions = this.history.getLatest(20);
    const mid = 10;
    
    const firstHalfSuccess = this._calculateSuccess(actions.slice(10, 20));
    const secondHalfSuccess = this._calculateSuccess(actions.slice(0, 10));
    
    const improvement = secondHalfSuccess - firstHalfSuccess;
    
    if (improvement > 0.15) {
        this.signals.learning += 1;
    }
}
```

**Adaptations Triggered:**
- DomRenderer: Slightly slower animations (+20%)
- GridLock: Moderately lower thresholds (-10%)
- CSS: `.state-learning` class, progress indicators, positive feedback

### State Switching

**Signal Accumulation:**
- Each analyzer runs every 500ms
- Signals increment/decrement based on conditions
- Threshold = 3 consecutive votes required

**Priority Order:**
1. Frustrated (highest - safety first)
2. Concentrated
3. Learning
4. Exploring
5. Neutral (default)

**Example Transition:**
```javascript
// Analysis cycle 1: Error detected
this.signals.frustrated = 1

// Analysis cycle 2: Another error cluster
this.signals.frustrated = 2

// Analysis cycle 3: Still errors
this.signals.frustrated = 3 ← THRESHOLD REACHED
this._transitionState('frustrated')
```

### Events Emitted

```javascript
// General state change
this.emit('cognitive_state:change', {
    from: 'neutral',
    to: 'frustrated',
    signals: { frustrated: 3, concentrated: 0, ... },
    timestamp: performance.now()
});

// State-specific event
this.emit('cognitive_state:frustrated', {
    from: 'neutral',
    timestamp: performance.now()
});
```

---

## Component 3: IntentPredictorPlugin

> **Note:** The `IntentPredictorPlugin` described below was part of an earlier design iteration and is **not currently implemented** as a separate published package. The gesture signature matching and trajectory analysis described here represent planned functionality for future gesture input plugins. Current behavioral state detection is handled entirely by the cognitive middleware.

### Gesture Signature Database

```javascript
signatures = {
    swipe_left: {
        direction: { x: -1, y: 0 },
        velocity_range: [0.3, 2.0],
        acceleration_pattern: 'accelerating',
        typical_duration_ms: 400
    },
    // ... 5 more signatures
}
```

### Prediction Pipeline

```
Hand Detected
    ↓
Sample Position (every 50ms)
    ↓
Calculate Velocity, Direction, Acceleration
    ↓
Match Against Signatures (weighted scoring)
    ↓
Apply Cognitive State Adjustments
    ↓
Emit Prediction if Confidence > Threshold
```

### Matching Algorithm

**Scoring Weights:**
- Direction similarity: 40%
- Velocity match: 40%
- Acceleration pattern: 20%

**Example:**
```javascript
_matchSignature(features, signature) {
    let score = 0;
    
    // Direction (cosine similarity)
    const dirSimilarity = this._cosineSimilarity(
        features.direction, 
        signature.direction
    );
    score += dirSimilarity * 0.4;
    
    // Velocity (range match)
    const velMatch = this._rangeMatch(
        features.speed, 
        signature.velocity_range
    );
    score += velMatch * 0.4;
    
    // Acceleration
    const accelMatch = features.accelerationPattern === 
        signature.acceleration_pattern ? 1.0 : 0.3;
    score += accelMatch * 0.2;
    
    return score; // 0.0 - 1.0
}
```

### Cognitive State Adaptation

| State | Min Confidence | Special Behavior |
|-------|---------------|------------------|
| Frustrated | 60% | +10% early prediction bonus |
| Concentrated | 75% | Weight velocity 50% instead of 40% |
| Exploring | 50% | Very permissive, stable threshold 90% |
| Neutral | 70% | Default settings |

### Events Emitted

```javascript
// General prediction
this.emit('intent:prediction', {
    gesture: 'swipe_left',
    confidence: 0.82,
    probabilities: {
        swipe_left: 0.82,
        swipe_right: 0.10,
        swipe_up: 0.05,
        // ...
    }
});

// Stable prediction (95%+ confidence)
this.emit('intent:stable', {
    gesture: 'swipe_left',
    confidence: 0.96
});

// Pre-render trigger (85%+ confidence)
this.emit('intent:pre_render', {
    gesture: 'swipe_left',
    confidence: 0.87
});
```

---

## Integration with Existing Systems

### DomRendererPlugin Integration

**File:** `packages/core/src/` (DomRendererPlugin, if used)

**Changes:**
1. Listen to `cognitive_state:change` event
2. Apply CSS class to container: `.state-frustrated`, `.state-concentrated`, etc.
3. Adjust animation speed via CSS variable `--transition-duration`

```javascript
_onCognitiveStateChange(data) {
    const { to } = data;
    
    // Update CSS class
    this.container.classList.remove(
        'state-frustrated', 
        'state-concentrated', 
        'state-exploring', 
        'state-learning', 
        'state-neutral'
    );
    this.container.classList.add(`state-${to}`);
    
    // Adjust animation speed
    switch (to) {
        case 'frustrated':
            this.transitionSpeedMultiplier = 1.5; // +50% slower
            break;
        case 'concentrated':
            this.transitionSpeedMultiplier = 0.6; // -40% faster
            break;
        // ...
    }
    
    this._applyAnimationSpeed(this.transitionSpeedMultiplier);
}
```

### GridLockSystem Integration

**File:** Legacy showcase app (`GridLockSystem.js`, not part of SDK packages)

**Changes:**
1. Add `setCognitiveState(state)` method
2. Store base values for thresholds/cooldowns
3. Apply state-specific multipliers

```javascript
setCognitiveState(state) {
    switch (state) {
        case 'frustrated':
            this.threshold = this.baseThreshold * 0.7; // -30%
            this.lockDuration = this.baseLockDuration * 1.5; // +50%
            break;
        case 'concentrated':
            this.threshold = this.baseThreshold * 0.8; // -20%
            this.lockDuration = this.baseLockDuration * 0.7; // -30%
            break;
        // ...
    }
}
```

**Propagation Path:**
```
CognitiveModelPlugin
    ↓ (emit cognitive_state:change)
GestureInputPlugin (listener)
    ↓ (call setCognitiveState)
GestureDetector
    ↓ (access gridLock property)
GridLockSystem
```

### CSS Visual Feedback

**File:** `/css/cognitive-states.css` (legacy showcase app only — not part of SDK packages)

**State Classes:**

#### `.state-frustrated`
- Slower transitions (900ms vs 600ms)
- Larger hit areas
- Helpful hints visible
- Calmer hover effects
- Prominent borders

#### `.state-concentrated`
- Faster transitions (360ms vs 600ms)
- Minimal decoration
- Distractions hidden
- Snappier hover effects
- Subtle focus indicators only

#### `.state-exploring`
- Normal transitions (600ms)
- All features visible
- Contextual help shown
- Permissive visual feedback
- Prominent category labels

#### `.state-learning`
- Slightly slower transitions (720ms)
- Progress indicators visible
- Clear active card feedback
- Educational hints
- Positive reinforcement animations

---

## Configuration

**File:** `packages/core/src/store/middleware/cognitiveMiddleware.ts`

The cognitive middleware accepts a configuration object when created:

### CognitiveModelPlugin Settings

```yaml
- name: "CognitiveModelPlugin"
  enabled: true
  priority: 60
  options:
    history_window_size: 50
    state_switch_threshold: 3
    
    # Frustration
    frustration_error_rate: 0.40
    frustration_time_window_ms: 5000
    frustration_cluster_size: 3
    
    # Concentration
    concentration_speed_threshold_ms: 400
    concentration_success_rate: 0.90
    concentration_consistency: 0.85
    
    # Exploration
    exploration_variety_threshold: 0.60
    exploration_pause_threshold_ms: 1000
    
    # Learning
    learning_improvement_window: 20
    learning_improvement_threshold: 0.15
```

### IntentPredictorPlugin Settings

```yaml
- name: "IntentPredictorPlugin"
  enabled: true
  priority: 60
  options:
    min_confidence_to_predict: 0.70
    stable_confidence_threshold: 0.95
    pre_render_threshold: 0.85
    
    sample_rate_ms: 50
    min_samples_for_prediction: 3
    
    velocity_weight: 0.4
    direction_weight: 0.4
    acceleration_weight: 0.2
    
    adaptive_thresholds:
      frustrated:
        min_confidence: 0.60
        early_prediction_bonus: 0.1
      concentrated:
        min_confidence: 0.75
        velocity_weight: 0.5
      exploring:
        min_confidence: 0.50
        stable_threshold: 0.90
```

---

## 📊 Performance Metrics

### Cognitive State Detection Latency
- **Analysis interval:** 500ms
- **State switch delay:** 1.5s (3 cycles × 500ms)
- **Memory overhead:** ~5KB for 50 actions

### Intent Prediction Latency
- **Sample rate:** 50ms
- **Minimum samples:** 3 (150ms to first prediction)
- **Typical prediction time:** 200-300ms after gesture start

### CPU Impact
- **CognitiveModel:** ~1-2% CPU (analysis every 500ms)
- **IntentPredictor:** ~2-3% CPU (real-time sampling)
- **Total overhead:** ~5% CPU during active gestures

---

## 🧪 Testing & Debugging

### Manual Testing

**Test Frustration Detection:**
1. Make 5+ failed gestures rapidly
2. Watch console: `[CognitiveModel] 🧠 State transition: neutral → frustrated`
3. Observe CSS class on `#layer-system`: `state-frustrated`
4. Animations slow down, hints appear

**Test Concentration Detection:**
1. Perform 15 fast, successful swipes (<400ms each)
2. State should switch to `concentrated`
3. Animations speed up, distractions hidden

**Test Intent Prediction:**
1. Open browser console
2. Start slow swipe left
3. Watch for: `[IntentPredictor] 🎯 Stable prediction: swipe_left (96.5%)`
4. Should predict before gesture completes

### Debug API

**Get Current Cognitive State:**
```javascript
const cognitivePlugin = window.navigatorCore.getPlugin('CognitiveModel');
console.log(cognitivePlugin.getCurrentState());
// {
//     state: 'concentrated',
//     previousState: 'neutral',
//     signals: { concentrated: 4, frustrated: 0, ... }
// }
```

**Get Detailed Analysis:**
```javascript
console.log(cognitivePlugin.getDetailedAnalysis());
// {
//     currentState: 'concentrated',
//     metrics: { errorRate: 0.05, averageDuration: 350, ... },
//     errorClusters: { maxClusterSize: 0, ... },
//     recommendations: ['Speed up animations', ...]
// }
```

**Force State (Testing):**
```javascript
cognitivePlugin.forceState('frustrated');
```

**Get Intent Prediction:**
```javascript
const intentPlugin = window.navigatorCore.getPlugin('IntentPredictor');
console.log(intentPlugin.getCurrentPrediction());
// { gesture: 'swipe_left', confidence: 0.82 }
```

---

## Future Enhancements (Planned)

- **User-specific thresholds:** Learn individual user patterns over time
- **Gesture input integration:** Apply state adjustments to gesture confidence thresholds
- **Fatigue detection:** Detect declining performance over longer sessions

---

## API Reference

### UserSessionHistory

```typescript
class UserSessionHistory {
    constructor(maxSize: number = 50)
    
    add(action: Action): void
    getLatest(count: number): Action[]
    getAll(): Action[]
    getMetrics(windowSize?: number): Metrics
    getErrorClusters(timeWindowMs: number): ClusterStats
    clear(): void
}

interface Action {
    type: string
    timestamp: number
    duration_ms: number
    success: boolean
    start_pos: { x: number, y: number }
    end_pos: { x: number, y: number }
    metadata: any
}

interface Metrics {
    errorRate: number
    averageDuration: number
    averageSpeed: number
    actionVariety: number
    actionTypes: Map<string, number>
    recentErrors: number
    velocityProfile: 'slow' | 'medium' | 'fast'
    total: number
}
```

### Cognitive Middleware State

```typescript
type CognitiveState = 'neutral' | 'frustrated' | 'concentrated' | 'exploring' | 'learning'

// Store state shape (state.cognitive)
interface CognitiveStateSlice {
    currentState: CognitiveState
    confidence: number
    lastUpdate: number | null
}

// Action dispatched on state change
{
  type: 'cognitive/STATE_CHANGE',
  payload: {
    previousState: CognitiveState
    newState: CognitiveState
    confidence: number
    signals: Record<string, number>
    metrics: SessionMetrics
    timestamp: number
  }
}
```

---

## Resources

**SDK source files:**
- `packages/core/src/intelligence/UserSessionHistory.ts` - Circular buffer implementation
- `packages/core/src/store/middleware/cognitiveMiddleware.ts` - State detection middleware
- `packages/core/src/store/reducers/placeholderReducer.ts` - Cognitive state reducer

**Tests:**
- `packages/core/tests/store/cognitiveMiddleware.spec.ts`
- `packages/core/tests/integration/cognitive-intelligence.spec.ts`
- `packages/core/tests/UserSessionHistory.spec.ts`

---

## Summary

The behavioral state middleware classifies user interaction patterns using rule-based analysis of action history. It detects 5 states (neutral, frustrated, concentrated, exploring, learning) based on measurable metrics: error rate, action timing, and action variety. State transitions require multiple consecutive signal votes to prevent false positives.

The middleware integrates directly into the Redux-like Store pipeline — no polling loops, no timers. It reacts to actual user actions as they are dispatched.
