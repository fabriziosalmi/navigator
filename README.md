# Navigator

A gesture-controlled, real-time data visualization prototype built with Three.js and MediaPipe Hands. This interactive web application displays floating data cards in a 3D space that you can navigate and manipulate using hand gestures captured via webcam.

![Aetherium Cortex Lite](https://img.shields.io/badge/Status-Prototype-blue) ![Three.js](https://img.shields.io/badge/Three.js-r157-green) ![MediaPipe](https://img.shields.io/badge/MediaPipe-Hands-orange)

## ✨ Features

- **3D Data Visualization**: Floating cards in a 3D space rendered with Three.js
- **Real-time Data Updates**: Cards update automatically with simulated data streams
- **Gesture Control**: Navigate and interact using hand gestures:
  - 🖐️ **Open Hand Pan**: Move your hand to navigate the camera
  - 👆 **Point**: Use your index finger to highlight cards
  - 🤏 **Pinch**: Grab and move cards around
  - ✊ **Fist**: Alternative interaction mode
- **HTML Overlays**: Card content rendered as HTML for flexibility and clarity
- **Event-Driven Architecture**: Decoupled components communicating via CustomEvents

## 🛠️ Technology Stack

- **HTML5** - Document structure
- **CSS3** - Styling and animations
- **JavaScript (ES6+ Modules)** - Application logic
- **Three.js** - 3D scene management and rendering
- **MediaPipe Hands** - Real-time hand tracking and gesture recognition

## 📋 Prerequisites

- A modern web browser (Chrome, Firefox, Edge, or Safari)
- A webcam for gesture input
- A local web server (required for ES6 modules and webcam access)

## 🚀 Getting Started

### Option 1: Using Python's HTTP Server

If you have Python installed:

```bash
# Navigate to the project directory
cd /path/to/navigator

# Python 3.x
python3 -m http.server 8000

# Python 2.x
python -m SimpleHTTPServer 8000
```

Then open your browser and navigate to: `http://localhost:8000`

### Option 2: Using Node.js HTTP Server

If you have Node.js installed:

```bash
# Install http-server globally (one-time)
npm install -g http-server

# Navigate to the project directory
cd /path/to/navigator

# Start the server
http-server -p 8000
```

Then open your browser and navigate to: `http://localhost:8000`

### Option 3: Using VS Code Live Server Extension

1. Install the "Live Server" extension in VS Code
2. Right-click on `index.html`
3. Select "Open with Live Server"

### Option 4: Using PHP

If you have PHP installed:

```bash
# Navigate to the project directory
cd /path/to/navigator

# Start the server
php -S localhost:8000
```

Then open your browser and navigate to: `http://localhost:8000`

## 🎮 How to Use

1. **Grant Camera Access**: When the page loads, you'll be prompted to allow webcam access. Click "Allow".

2. **Wait for Initialization**: The status indicator will show "Ready! Wave your hand to begin." when everything is loaded.

3. **Start Gesturing**:
   - Hold your hand in front of the camera
   - Move your open hand to pan the camera view
   - Point at cards with your index finger to highlight them
   - Make a pinch gesture (thumb and index finger together) while pointing at a card to grab it
   - Move your hand while pinching to reposition the grabbed card

4. **Watch the Data**: Cards will automatically update every few seconds with new simulated data.

5. **Keyboard Shortcuts** (for debugging):
   - Press `d` to toggle debug mode (shows webcam feed and hand landmarks)
   - Press `r` to reset camera to initial position
   - Press `s` to log data stream status to console

## 📁 Project Structure

```
navigator/
├── index.html              # Main HTML file
├── style.css              # Styles for cards and UI
├── js/
│   ├── main.js            # Application orchestrator
│   ├── SceneManager.js    # Three.js scene management
│   ├── Card.js            # Card component (3D mesh + HTML overlay)
│   ├── DataStream.js      # Real-time data simulator
│   └── GestureController.js # MediaPipe hand tracking
└── README.md              # This file
```

## 🔧 Component Details

### SceneManager.js
Manages the Three.js environment including scene, camera, renderer, and lighting. Handles the animation loop and camera movement with smooth damping for natural motion.

### Card.js
Represents individual data cards. Each card consists of:
- A Three.js mesh (PlaneGeometry) for 3D positioning
- An HTML overlay for displaying text content
- Methods for updating data, highlighting, and animations
- A subtle floating animation for visual appeal

### DataStream.js
Simulates real-time data updates:
- Generates random data every few seconds
- Selects random cards to update
- Dispatches CustomEvents that other components can listen to
- Completely decoupled from the UI

### GestureController.js
Handles hand tracking and gesture recognition:
- Initializes MediaPipe Hands with webcam access
- Detects gestures: pan, pinch, fist, and cursor position
- Dispatches CustomEvents for each gesture
- Provides virtual cursor visualization

### main.js
The application orchestrator that:
- Initializes all components
- Creates and positions cards in a grid layout
- Sets up event listeners for gestures and data updates
- Performs raycasting to detect card interactions
- Manages the application state

## 🎨 Customization

### Change Number of Cards
Edit `main.js`:
```javascript
this.numCards = 8; // Change to desired number
```

### Adjust Data Update Frequency
Edit `main.js`:
```javascript
this.dataStream = new DataStream(this.numCards, 3000); // milliseconds
```

### Modify Card Layout
Edit the grid layout in `main.js` → `createCards()`:
```javascript
const rows = 2;
const cols = Math.ceil(this.numCards / rows);
const spacing = 4; // Distance between cards
```

### Change Camera Sensitivity
Edit `SceneManager.js` → `panCamera()`:
```javascript
const sensitivity = 0.02; // Adjust this value
```

### Style Cards
Edit `style.css` → `.card-overlay` section to customize appearance.

## 🐛 Troubleshooting

### "Camera access denied" or webcam not working
- Make sure you're accessing the page via `http://` or `https://` (not `file://`)
- Check browser permissions and allow camera access
- Try a different browser (Chrome and Edge work best)

### Cards not visible
- Press `r` to reset camera position
- Check browser console for errors
- Make sure you're running from a local server

### Gestures not responding
- Ensure your hand is clearly visible in the webcam
- Try adjusting lighting conditions
- Move your hand more slowly for better tracking
- Press `d` to enable debug mode and see hand landmarks

### Script loading errors
- Make sure you have an active internet connection (CDN resources)
- Check that all files are in the correct directories
- Clear browser cache and reload

## 🔐 Security Notes

- The webcam feed is processed entirely client-side
- No data is sent to external servers
- MediaPipe models are loaded from CDN
- Camera access requires HTTPS or localhost

## 🚧 Future Enhancements

- [ ] Add more gesture types (swipe, rotate)
- [ ] Implement card filtering and search
- [ ] Save/load card layouts
- [ ] Export data visualizations
- [ ] Multi-user collaboration
- [ ] Voice commands integration
- [ ] AR/VR support

## 📝 License

This is a prototype project for educational and demonstration purposes.

## 🙏 Acknowledgments

- **Three.js** - 3D graphics library
- **MediaPipe** - Google's ML framework for hand tracking
- **Font Awesome** - Icons (if added later)

## 📧 Contact

For questions or feedback about this prototype, please open an issue in the repository.

---

**Note**: This is a prototype application designed to demonstrate gesture-controlled 3D data visualization. It requires a webcam and modern browser to function properly.
