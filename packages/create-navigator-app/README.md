# create-navigator-app

Scaffold a Navigator app with zero configuration.

## Usage

### With npx (Recommended)

```bash
npx create-navigator-app my-app
```

### With npm

```bash
npm create navigator-app my-app
```

### With yarn

```bash
yarn create navigator-app my-app
```

## Interactive Setup

The CLI will guide you through the setup:

1. **Project name** - Enter your project name
2. **Plugin selection** - Choose input plugins (keyboard, gesture, voice)
3. **Scaffold** - Creates project structure with Vite and config

## What's Included

The generated project includes:

- ✅ **Vite** - Lightning-fast dev server with HMR
- ✅ **Navigator Core** - Minimal Navigator setup
- ✅ **Configuration** - Pre-configured `config.yaml`
- ✅ **Example** - Working navigation example
- ✅ **Scripts** - Dev, build, and preview scripts

## Project Structure

```
my-app/
├── index.html         # Main HTML file
├── config.yaml        # Navigator configuration
├── vite.config.js     # Vite configuration
├── package.json       # Dependencies and scripts
└── README.md          # Getting started guide
```

## Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Examples

```bash
# Create app with default settings
npx create-navigator-app my-app

# Create app in current directory
npx create-navigator-app .

# Create app with specific name
npx create-navigator-app awesome-navigator
```

## Next Steps

After creating your app:

1. **Install dependencies**
   ```bash
   cd my-app
   npm install
   ```

2. **Start development**
   ```bash
   npm run dev
   ```

3. **Customize**
   - Edit `config.yaml` to add more layers/cards
   - Modify `index.html` for custom UI
   - Enable/disable plugins

4. **Learn more**
   - [Documentation](https://fabriziosalmi.github.io/navigator/)
   - [Examples](https://github.com/fabriziosalmi/navigator/tree/main/examples)

## Plugin Options

During setup, you can choose:

- **Keyboard** (recommended) - Arrow keys and WASD navigation
- **Gesture** - MediaPipe hand tracking (requires webcam)
- **Voice** - Speech recognition commands (experimental)

## Requirements

- Node.js 20.0 or higher
- npm, yarn, or pnpm

## Documentation

- [Quick Start](https://fabriziosalmi.github.io/navigator/docs/quick-start)
- [Core Concepts](https://fabriziosalmi.github.io/navigator/docs/core-concepts)
- [Plugin Development](https://fabriziosalmi.github.io/navigator/docs/plugin-development/getting-started)

## License

ISC © Navigator Project
