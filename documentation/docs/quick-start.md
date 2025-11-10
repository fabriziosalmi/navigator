---
sidebar_position: 2
---

# Quick Start

Get Navigator running in your project in **5 minutes**.

## Prerequisites

- Node.js 20.0 or higher
- npm or yarn
- A modern browser (Chrome, Firefox, Edge)
- Webcam (optional, for gesture control)

## Installation

### Option 1: Create New App (Recommended)

The fastest way to get started is using `create-navigator-app`:

```bash
npx create-navigator-app my-app
cd my-app
npm run dev
```

This creates a new Navigator project with:
- ✅ Pre-configured Vite setup
- ✅ Example configuration
- ✅ Development server with HMR
- ✅ Basic plugin examples

### Option 2: Add to Existing Project

Install Navigator in your existing project:

```bash
npm install @navigator/core
```

Create a basic `index.html`:

```html
<!DOCTYPE html>
<html>
<head>
    <title>My Navigator App</title>
    <link rel="stylesheet" href="node_modules/@navigator/core/dist/navigator.css">
</head>
<body>
    <div id="navigator-root"></div>
    <script type="module">
        import { Navigator } from '@navigator/core';

        const nav = new Navigator({
            root: '#navigator-root',
            plugins: ['keyboard', 'gesture']
        });

        nav.init();
    </script>
</body>
</html>
```

### Option 3: Clone and Run

Clone the repository and run locally:

```bash
git clone https://github.com/fabriziosalmi/navigator.git
cd navigator
npm install
npm run dev
```

## Basic Configuration

Create a `config.yaml` file:

```yaml
navigator:
  version: "2.0"

  # Layers configuration
  layers:
    - id: "main"
      name: "Main Layer"
      cards:
        - title: "Welcome"
          type: "video"
          mediaUrl: "https://example.com/video.mp4"

  # Plugins configuration
  plugins:
    keyboard:
      enabled: true
    gesture:
      enabled: true
      confidence: 0.7
    voice:
      enabled: false
```

## Your First Navigation

1. **Start the dev server:**
   ```bash
   npm run dev
   ```

2. **Open your browser:** Navigate to `http://localhost:3000`

3. **Try different input methods:**
   - **Keyboard**: Use arrow keys or WASD
   - **Gestures**: Wave your hand left/right
   - **Voice**: Say "next" or "previous"

## Next Steps

### Understand Core Concepts

Learn about Navigator's architecture:
- [Core Concepts](./core-concepts) - Plugin system, Event Bus, State
- [Configuration](./configuration) - YAML configuration guide
- [Architecture](./architecture) - Deep dive into design

### Customize Your Navigator

- **Add more layers and cards** in `config.yaml`
- **Enable/disable plugins** based on your needs
- **Customize the UI** with CSS variables

### Build Your Own Plugin

Create a custom input or output plugin:
- [Plugin Development](./plugin-development/getting-started) - Getting started guide
- [Input Plugin Tutorial](./plugin-development/input-plugin-tutorial) - Build a VR controller plugin
- [Output Plugin Tutorial](./plugin-development/output-plugin-tutorial) - Build a Philips Hue plugin

## Troubleshooting

### Camera permission denied

If gesture control doesn't work:

1. Check browser permissions (should show camera icon in address bar)
2. Grant camera access when prompted
3. On HTTPS-only browsers, use `https://localhost:3000` or deploy to a domain

### Module not found errors

Ensure dependencies are installed:

```bash
npm install
```

### Port already in use

Change the port in `vite.config.js`:

```js
export default {
  server: {
    port: 3001  // Use a different port
  }
}
```

### Gesture control not detecting hand

- Ensure good lighting conditions
- Keep hand within camera frame
- Try adjusting `confidence` threshold in config
- Check browser console for MediaPipe errors

## Example Projects

Check out these example projects:

- **[Basic Setup](https://github.com/fabriziosalmi/navigator/tree/main/examples/basic)** - Minimal Navigator setup
- **[Custom Plugins](https://github.com/fabriziosalmi/navigator/tree/main/examples/plugins)** - Example plugins
- **[Full App](https://github.com/fabriziosalmi/navigator/tree/main/examples/full-app)** - Complete application

## Get Help

- **Documentation**: [Full docs](https://fabriziosalmi.github.io/navigator/)
- **GitHub Issues**: [Report a bug](https://github.com/fabriziosalmi/navigator/issues)
- **Discussions**: [Ask questions](https://github.com/fabriziosalmi/navigator/discussions)

---

**Ready to build?** Continue to [Core Concepts](./core-concepts) to understand Navigator's architecture.
