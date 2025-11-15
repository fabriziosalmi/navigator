# Navigator Pathfinding Demo

**Multi-layer gesture-controlled interface with hand tracking and adaptive navigation**

This is the original Navigator demo showcasing advanced gesture control, pathfinding algorithms, and adaptive UI/UX features.

## 🎯 Features

- **Hand Gesture Control** via MediaPipe Hands
- **Multi-layer Navigation** (Videos, News, Images, Games, Apps, Settings)
- **Adaptive Navigation System** with cognitive state detection
- **Grid-Lock Pathfinding** for smooth navigation
- **Visual Effects** (light beams, particles, 3D carousel)
- **Voice Commands** integration
- **Progressive LOD** (Level of Detail) rendering
- **Audio Feedback** with rhythm synchronization

## 🚀 Quick Start

### Development

```bash
pnpm install
pnpm dev
```

Visit `http://localhost:5175`

### Build

```bash
pnpm build
```

### Preview Production Build

```bash
pnpm preview
```

## 🎮 How to Use

1. **Start Experience** - Click the start button
2. **Grant Camera Permission** - Required for hand tracking
3. **Use Hand Gestures**:
   - **Swipe Left/Right** - Navigate between cards
   - **Swipe Up/Down** - Change layers
   - **Pinch** - Zoom/select (Level 2+)
   - **Fist** - Special action (Level 3+)
   - **Open Hand** - Reset/cancel (Level 3+)

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
