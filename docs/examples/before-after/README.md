# Before/After Code Examples

This folder contains side-by-side comparisons demonstrating the difference between traditional tightly-coupled code and Navigator's decoupled architecture.

## Files

### `traditional-react-keyboard.tsx`
**The Problem**: Shows how most developers build keyboard navigation in React today.

**Issues demonstrated**:
- Direct coupling to browser DOM (`window.addEventListener`)
- Business logic mixed with input handling
- Duplication required for multi-modal support (keyboard + gestures)
- Manual cleanup (memory leak risk)
- Difficult to test (requires mocking browser globals)

---

### `navigator-react-keyboard.tsx`
**The Solution**: Same functionality using Navigator's architecture.

**Solutions demonstrated**:
- Decoupled from browser APIs (component doesn't know about KeyboardPlugin)
- Business logic separated from input handling
- Hot-swappable input sources (change plugin, not component)
- Automatic cleanup (useNavigator handles lifecycle)
- Easy to test (use MockGesturePlugin)

---

## Usage in Demos

These examples are designed for **Scene 1** of the demo script:

1. **Show** `traditional-react-keyboard.tsx` first
2. **Point out** the coupling points (highlighted with `// ❌ COUPLING POINT #N` comments)
3. **Explain** the pain developers feel (fragile, duplicative, hard to test)
4. **Transition** to Navigator approach
5. **Show** `navigator-react-keyboard.tsx`
6. **Highlight** the solutions (marked with `// ✅ SOLUTION #N` comments)
7. **Emphasize** the power move: "Change the plugin, not the component"

---

## Side-by-Side Comparison

| Aspect | Traditional | Navigator |
|--------|-------------|-----------|
| **Coupling** | Tight (window API) | Loose (EventBus) |
| **Multi-modal** | Duplicate code | Swap plugin |
| **Testing** | Mock browser | Use MockPlugin |
| **Cleanup** | Manual | Automatic |
| **Responsibility** | Mixed | Separated |

---

## Key Talking Points

### Traditional Code
> "This is how we usually do it. Direct addEventListener. Business logic mixed in. Want gesture support? You'll need to duplicate this entire pattern."

### Navigator Code
> "Now watch this. Same functionality. But the component has ZERO knowledge of KeyboardPlugin. Tomorrow, swap to GesturePlugin. This code? Doesn't change."

---

## Live Demo Flow

1. **Copy-Paste Ready**: Both files are complete, working examples
2. **Visual Diff**: Use a diff tool to show side-by-side
3. **Hot-Swap Demo**: Use Navigator version, then swap KeyboardPlugin → MockGesturePlugin
4. **The Reveal**: Component code stays identical, behavior changes

---

**Purpose**: These examples should make developers say *"I've written that first code. I hate that first code. I want the second code."*
