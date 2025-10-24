# tom.monster

> A living, breathing homepage powered by biometric chaos

An unhinged, interactive web experience that visualizes real-time biometric data through generative art. Your heartbeat becomes the pulse of cosmic simulations, cellular automata, and particle fields.

## 🧬 Features

### Three Reality Engines

1. **Cellular Automata** - Modified Game of Life that evolves based on your heart rate
2. **N-Body Physics** - Gravitational dance of celestial bodies modulated by biometric variance
3. **Particle Field** - Swirling, morphing particle system synchronized to your pulse

### Biometric Integration

- **Web Bluetooth API** support for heart rate monitors (Polar H10, Wahoo TICKR, etc.)
- **Synthetic data mode** for testing without hardware
- Real-time visualization updates based on:
  - Heart rate (BPM)
  - Heart rate variability
  - Beat-to-beat variance

### Technical Highlights

- Pure vanilla JavaScript (no framework dependencies)
- Modular architecture for easy extension
- Canvas-based rendering with 60+ FPS
- Responsive design (desktop, tablet, mobile)
- Keyboard shortcuts for power users
- Zero-plugin, modern browser only

## 🚀 Quick Start

### Basic Setup

1. Clone or download this repository
2. Serve via any static web server:

```bash
# Python 3
python -m http.server 8000

# Node.js (http-server)
npx http-server

# PHP
php -S localhost:8000
```

3. Open `http://localhost:8000` in a modern browser

### Requirements

- Modern browser with Web Bluetooth support:
  - Chrome 56+ (desktop & Android)
  - Edge 79+
  - Opera 43+
  - **Note:** Safari and Firefox don't support Web Bluetooth yet

### Connecting a Heart Rate Monitor

1. Make sure your Bluetooth heart rate monitor is powered on
2. Click "connect biometric sensor"
3. Select your device from the pairing dialog
4. Watch reality bend to your heartbeat

Supported devices:
- Any Bluetooth LE heart rate monitor using standard GATT services
- Polar H10, H9, H7
- Wahoo TICKR, TICKR X
- Garmin HRM-Dual
- Most fitness tracker chest straps

## 🎮 Controls

### Keyboard Shortcuts

- `1` - Switch to Cellular Automata mode
- `2` - Switch to N-Body Physics mode
- `3` - Switch to Particle Field mode
- `Space` - Pause/Resume simulation
- `r` - Reset current mode

### Mouse/Touch

- Click mode buttons to switch visualizations
- Click "connect biometric sensor" to pair Bluetooth device

## 🔧 Architecture

### File Structure

```
tom.monster/
├── index.html              # Main page
├── css/
│   └── style.css          # Futuristic styling
├── js/
│   ├── engine.js          # Core visualization engine
│   ├── biometric.js       # Web Bluetooth integration
│   └── modes/
│       ├── cellular-automata.js
│       ├── nbody.js
│       └── particles.js
└── README.md
```

### Extending the System

#### Adding a New Visualization Mode

1. Create a new file in `js/modes/`:

```javascript
export default class YourMode {
    constructor(ctx) {
        this.ctx = ctx;
    }

    init(width, height) {
        // Initialize your simulation
    }

    update(dataStream) {
        // Update based on dataStream.heartRate and dataStream.variance
    }

    render(width, height) {
        // Draw to canvas
    }

    resize(width, height) {
        // Handle window resize
    }
}
```

2. Import and register in `js/engine.js`:

```javascript
import YourMode from './modes/your-mode.js';

this.modes = {
    cellular: new CellularAutomata(this.ctx),
    nbody: new NBodyPhysics(this.ctx),
    particles: new ParticleField(this.ctx),
    yourmode: new YourMode(this.ctx)  // Add here
};
```

3. Add UI button in `index.html`:

```html
<button class="mode-btn" data-mode="yourmode">your mode</button>
```

#### Using Different Data Sources

The `dataStream` object passed to each mode contains:

```javascript
{
    heartRate: 75,        // Current BPM
    variance: 5,          // Beat-to-beat variability
    timestamp: 1234567890 // Unix timestamp
}
```

To add new sensor types:

1. Extend `biometric.js` with new service UUIDs
2. Emit additional data fields via the event system
3. Update `engine.js` to merge new data into `dataStream`

## 🎨 Customization

### Visual Styling

All colors and design tokens are defined in CSS variables at the top of `css/style.css`:

```css
:root {
    --cosmic-black: #000510;
    --electric-cyan: #00d9ff;
    --plasma-pink: #ff006e;
    --neural-purple: #b967ff;
    /* ... */
}
```

### Simulation Parameters

Each mode has tunable parameters in its source file:

**Cellular Automata** (`cellular-automata.js`):
- `cellSize` - Grid resolution (line 11)
- `density` - Initial randomization (line 22)
- Rule modifications based on heart rate (lines 58-63)

**N-Body Physics** (`nbody.js`):
- `G` - Gravitational constant (line 9)
- `maxTrailLength` - Trail history (line 11)
- Number of bodies (line 19)

**Particle Field** (`particles.js`):
- Particle count (line 18)
- Connection distance (line 135)
- Flow field parameters (lines 91-95)

## 🌐 Deployment

### GitHub Pages

```bash
git add .
git commit -m "Launch cosmic chaos"
git push origin main
```

Enable GitHub Pages in repository settings → Pages → Source: main branch

### Other Platforms

This is a static site. Deploy anywhere:
- Netlify (drag & drop)
- Vercel
- Cloudflare Pages
- AWS S3
- Your own server

### HTTPS Required

Web Bluetooth requires HTTPS in production. All modern hosting platforms provide this automatically.

## 🧪 Testing Without Hardware

The system runs in synthetic data mode by default, simulating realistic heart rate patterns with natural variability. Perfect for development and testing.

## 🔒 Privacy

- All biometric data stays local (never leaves your browser)
- No analytics or tracking
- No external dependencies or CDNs
- Open source - audit the code yourself

## 🐛 Troubleshooting

### "Web Bluetooth is not supported"

- Use Chrome/Edge on desktop or Android
- Ensure you're on HTTPS (or localhost)
- Update your browser to the latest version

### Bluetooth device won't connect

- Check device battery
- Ensure device isn't paired with another app
- Try turning Bluetooth off/on
- Some devices require an initial pairing in OS settings

### Performance issues

- Reduce particle count in `particles.js`
- Increase cell size in `cellular-automata.js`
- Close other browser tabs
- Check if hardware acceleration is enabled

## 📚 References

- [Web Bluetooth API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Bluetooth_API)
- [Bluetooth Heart Rate Service](https://www.bluetooth.com/specifications/specs/heart-rate-service-1-0/)
- [HTML Canvas API](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API)
- [Game of Life](https://en.wikipedia.org/wiki/Conway%27s_Game_of_Life)
- [N-body simulation](https://en.wikipedia.org/wiki/N-body_simulation)

## 🎭 Philosophy

This project embraces the beautiful chaos at the intersection of biology, physics, and computation. It's a reminder that we're all just self-organizing systems running on wetware, trying to make sense of the cosmos.

The aesthetic is intentionally unhinged—because the most interesting discoveries happen when you let things get a little weird.

## 📜 License

MIT License - Do whatever you want, just don't blame me if reality starts glitching.

## 🤝 Contributing

Found a bug? Want to add a new visualization mode? PRs welcome!

This is a personal art project, so I might be opinionated about design decisions. But hey, fork it and make it your own cosmic chaos.

---

**Built with curiosity and an unhealthy amount of caffeine by Tom Pickard**

*⚠ Warning: Prolonged exposure may cause existential questioning and a sudden urge to buy synthesizers*
