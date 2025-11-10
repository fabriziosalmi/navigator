# VIEWPORT CLEANUP - Elementi Visibili

## 🎯 Obiettivo
**Vedere SOLO**:
1. Card principale (attiva, grande e centrata)
2. Card adiacenti dello stesso layer (previous/next, piccole e ruotate)  
3. Layer dietro (molto sfocato e lontano)
4. HUD top bar (Interface Status + History)
5. HUD bottom bar (Position + Navigation + Adaptive)

**NIENTE ALTRO** - Zero elementi fuori posto!

---

## ✅ Elementi Nascosti

### 1. **Legacy UI Components**
```css
#layer-tabs → display: none
#layer-wow-label → display: none (RIMOSSO dall'HTML)
#dynamic-background → display: none
.bg-glow → display: none
```

### 2. **Particle Effects (già disabilitati)**
```css
#particle-canvas → display: none
#data-stream-canvas → display: none
#light-beam-canvas → display: none
```

### 3. **Gesture Panels Bottom-Left**
```css
.gesture-icon-panel → display: none
.gesture-controls → display: none
.gesture-legend-compact → display: none (già in ux-refinements.css)
```

### 4. **Video Feed**
```css
video#webcam → position: absolute, 1x1px, opacity: 0, z-index: -9999
```
**Motivo**: Webcam serve per MediaPipe ma non va mostrata

### 5. **Snap Indicators**
```html
<!-- RIMOSSI dall'HTML -->
<div class="snap-indicator left">👈</div>
<div class="snap-indicator right">👉</div>
```

### 6. **MediaPipe Canvas**
```css
canvas[class*="mediapipe"] → 1x1px, opacity: 0, z-index: -9999
```
**Motivo**: MediaPipe usa canvas per elaborazione ma non va visualizzato

---

## 🎨 Card Visibility Logic

### Default State
```css
.card {
    display: none;
    opacity: 0;
    pointer-events: none;
}
```

### Active Layer Cards ONLY
```css
/* Card attiva - pienamente visibile */
.card.active {
    display: block;
    opacity: 1;
    z-index: 100;
}

/* Card adiacenti - visibili ma secondarie */
.card.previous,
.card.next {
    display: block;
    opacity: 0.7;
    z-index: 50;
}

/* Card lontane - appena visibili */
.card.far-previous,
.card.far-next {
    display: block;
    opacity: 0.4;
    z-index: 30;
}
```

---

## 🌌 Layer Visibility Logic

### Default State
```css
.layer-container,
.layer {
    display: none;
    opacity: 0;
}
```

### Active Layer
```css
.layer-container.active {
    display: block;
    opacity: 1;
}
```

### Background Layer (dietro)
```css
.layer-container.background {
    display: block;
    opacity: 0.15;
    filter: blur(8px) brightness(0.4) saturate(0.5);
    transform: translateZ(-800px) scale(0.8);
    pointer-events: none;
}
```

### Foreground Layer (davanti)
```css
.layer-container.foreground {
    display: none !important;
}
```

---

## 🧹 File Modificati

### Nuovi File
1. **`css/viewport-cleanup.css`**
   - Hide all non-essential elements
   - Card visibility logic
   - Layer visibility logic
   - Video/canvas cleanup

### File HTML Modificati
1. **`index.html`**
   - Rimosso: `#layer-wow-label` (duplicato)
   - Rimosso: `#dynamic-background`
   - Rimosso: `.snap-indicator` (left/right)
   - Added: `<link>` for `viewport-cleanup.css`

---

## 📋 Checklist Visibilità

- [x] **Card principale**: Visibile, centrata, 65vh
- [x] **Card adiacenti (prev/next)**: Visibili, ruotate ±45°
- [x] **Card lontane (far)**: Visibili, ruotate ±60°
- [x] **Layer dietro**: Molto sfocato, opacity 0.15
- [x] **Top HUD**: Interface Status + History visibili
- [x] **Bottom HUD**: Position + Nav + Adaptive visibili
- [x] **Layer-tabs**: Nascosto ✅
- [x] **Layer-wow-label**: Nascosto ✅
- [x] **Dynamic-background**: Nascosto ✅
- [x] **Video webcam**: Nascosto (1x1px off-screen) ✅
- [x] **MediaPipe canvas**: Nascosto (1x1px off-screen) ✅
- [x] **Gesture icons bottom-left**: Nascosto ✅
- [x] **Snap indicators**: Rimossi dall'HTML ✅

---

## 🚀 Risultato Finale

### Viewport Pulito
```
┌─────────────────────────────────────────────────┐
│  TOP HUD: [Interface] [History] [Gesture]       │
└─────────────────────────────────────────────────┘
│                                                  │
│          [prev]   [ACTIVE]   [next]             │
│                                                  │
│         (Layer dietro molto sfocato)             │
│                                                  │
┌─────────────────────────────────────────────────┐
│  BOTTOM HUD: [Position] [Nav] [Adaptive]        │
└─────────────────────────────────────────────────┘
```

### Elementi NASCOSTI
- ❌ Layer tabs
- ❌ Layer WOW label
- ❌ Background glows
- ❌ Particle canvases
- ❌ Video feed preview
- ❌ MediaPipe processing canvas
- ❌ Gesture icon panels
- ❌ Snap indicators
- ❌ Debug elements

### Elementi VISIBILI
- ✅ Card attiva (principale)
- ✅ 2-4 card adiacenti (stesso layer)
- ✅ Layer dietro (sfocato al 85%)
- ✅ Top HUD bar (2 pannelli)
- ✅ Bottom HUD bar (3 pannelli)

---

## 🔍 Debug Mode

Per vedere elementi nascosti (testing):
```javascript
document.body.classList.add('debug-mode');
```

In debug mode:
- `#dynamic-background` → opacity 0.3
- `video#webcam` → visible

---

**Status**: ✅ VIEWPORT PULITO
**Visibilità**: 🎯 Solo card matrix + HUD bars
**Performance**: 🚀 -8 elementi DOM nascosti = rendering più veloce
