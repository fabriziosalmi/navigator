# 🌌 Navigator - Pathfinding Demo

> **Next-Generation Gesture-Controlled Interface**
> 
> Experience the future of hands-free navigation with real-time hand tracking, adaptive intelligence, and multi-layer content organization.

[![Live Demo](https://img.shields.io/badge/Live-Demo-00ffff?style=for-the-badge)]()
[![MediaPipe](https://img.shields.io/badge/MediaPipe-Hands-00ff88?style=for-the-badge)](https://google.github.io/mediapipe/)
[![Vite](https://img.shields.io/badge/Vite-6.4-646CFF?style=for-the-badge&logo=vite)](https://vitejs.dev)

---

## ✨ Features

### 🖐️ **Gesture Control**
- **Real-time hand tracking** powered by MediaPipe Hands
- **Natural gestures**: Swipe, point, pinch, and more
- **Grid-lock stabilization** for precise control
- **Sub-100ms response time**

### 🎯 **Smart Navigation**
- **6-layer system**: Videos, News, Images, Games, Apps, Settings
- **3D carousel** with momentum-based scrolling
- **Adaptive difficulty** that learns from your behavior
- **Position memory** across sessions

### 🎨 **Premium UX/UI**
- **Glassmorphism design** with dynamic gradients
- **Smooth animations** using cubic-bezier curves
- **Responsive layout** for desktop, tablet, and mobile
- **Accessibility-first** (WCAG AA compliant)
- **Interactive help system** with floating button

### 🧠 **Cognitive Intelligence**
- **State detection**: Neutral, Exploring, Concentrated, Frustrated
- **Adaptive feedback** based on user behavior
- **Progressive complexity** levels (1-5)
- **Performance optimization** with LOD system

## 🚀 Quick Start

### Prerequisites
```bash
node >= 18.0.0
pnpm >= 8.0.0
```

### Installation
```bash
# From repository root
cd apps/pathfinding-demo

# Install dependencies (from monorepo root)
cd ../.. && pnpm install

# Start development server
cd apps/pathfinding-demo && pnpm dev
```

The demo will be available at `http://localhost:5175`

### Production Build
```bash
pnpm build
```

### Preview Production Build
```bash
pnpm preview
```

---

## 🎮 How to Use

### **Gesture Controls**

| Gesture | Action | Duration |
|---------|--------|----------|
| 👈 **Swipe Left** | Navigate to previous card | - |
| 👉 **Swipe Right** | Navigate to next card | - |
| 👆 **Swipe Up** | Move to upper layer | - |
| 👇 **Swipe Down** | Move to lower layer | - |
| 👆 **Point & Hold** | Focus on card | 2 seconds |
| 🤏 **Pinch** | Zoom/Grab content | - |
| ✊ **Fist** | Collapse view | - |
| 🖐️ **Open Hand** | Expand/Reset view | - |

### **Keyboard Shortcuts**

| Key | Action |
|-----|--------|
| `←` `→` | Navigate cards |
| `↑` `↓` | Switch layers |
| `Space` | Select/Activate |
| `Escape` | Exit focus mode |
| `?` | Toggle help |

### **Touch Controls** (Mobile/Tablet)

| Touch | Action |
|-------|--------|
| **Swipe Left/Right** | Navigate cards |
| **Swipe Up/Down** | Switch layers |
| **Tap** | Select card |
| **Long Press** | Focus mode |

---

## 🏗️ Architecture

### **Tech Stack**
- **Frontend**: Vanilla JavaScript (ES6 modules)
- **Build Tool**: Vite 6.4
- **Hand Tracking**: MediaPipe Hands
- **Styling**: Modular CSS (27 files)
- **Deployment**: Vercel-ready

### **Project Structure**
```
pathfinding-demo/
├── index.html              # Main entry point
├── vite.config.js          # Vite configuration
├── vercel.json             # Deployment config
├── css/                    # 27 modular CSS files
│   ├── base.css            # Design tokens
│   ├── cards.css           # Card components
│   ├── interactive-elements.css  # Buttons, tooltips, help
│   └── ...
├── js/                     # 48 JavaScript modules
│   ├── main-init.js        # Main initialization
│   ├── GestureDetector.js  # MediaPipe integration
│   └── ...
└── README.md
```

---

## 🎨 UX/UI Highlights

### **Modern Hero Section**
- Animated gradient background
- Feature highlights with hover effects
- Smooth floating animations
- Clear call-to-action button

### **Simplified HUD**
- Single bottom HUD (removed top duplication)
- Clear information hierarchy
- Enhanced readability with proper contrast
- Responsive grid layout

### **Interactive Help System**
- Floating help button (bottom-right)
- Comprehensive modal with sections:
  - Hand gesture guide
  - Keyboard shortcuts reference
  - Layer descriptions
- Smooth animations and transitions

### **Enhanced Feedback**
- Smooth card transitions (elastic easing)
- Hover states with glow effects
- Active state animations
- Visual feedback for all interactions

---

## 📊 Performance

### **Metrics**
- **Bundle Size**: 114.51 KB (gzipped)
- **First Contentful Paint**: < 1.5s
- **Gesture Latency**: < 100ms
- **Frame Rate**: 60 FPS

### **Optimization**
- ✅ Code splitting with Vite
- ✅ CSS containment
- ✅ GPU acceleration
- ✅ LOD system
- ✅ Debounced processing

---

## ♿ Accessibility

### **WCAG 2.1 AA Compliance**
- ✅ Keyboard navigation
- ✅ ARIA labels and roles
- ✅ Focus indicators
- ✅ Color contrast > 4.5:1
- ✅ Screen reader support

---

## 🐛 Troubleshooting

### **Camera not working**
- Ensure HTTPS connection
- Grant camera permissions
- Try Chrome/Edge browser

### **Gestures not detected**
- Good lighting required
- Keep hand in frame
- Check browser console

### **Performance issues**
- Reduce video resolution
- Disable visual effects
- Update graphics drivers

## 📦 Tech Stack

- **Vanilla JavaScript** (ES6 Modules)
- **MediaPipe Hands** for gesture detection
- **Vite** for build tooling
- **Custom CSS** with modular architecture

## 🔧 Configuration

Edit `js/config.js` to customize:
- Grid-lock sensitivity
- Gesture thresholds
- Camera settings
- Audio levels
- Performance options

## 🌐 Deployment

Deployed on Vercel at: [pathfinding-demo.vercel.app](https://pathfinding-demo.vercel.app)

## 📝 License

MIT License - see [LICENSE](../../LICENSE) for details
