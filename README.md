# 🎧 TUNORA — Luxury Studio Audio & Real-Time Synchronized Music Rooms

[![Vercel Deployment](https://img.shields.io/badge/Live%20App-tunora.vercel.app-1ed760?style=for-the-badge&logo=vercel)](https://melodia-phi-lac.vercel.app/)
[![JavaScript](https://img.shields.io/badge/JavaScript-Programmatic%20DOM%20%2B%20Vite-f7df1e?style=for-the-badge&logo=javascript&logoColor=000)](https://vitejs.dev/)
[![Realtime Sync](https://img.shields.io/badge/Realtime-MQTT%20WSS%20%2B%20WebRTC-e11d48?style=for-the-badge)](https://melodia-phi-lac.vercel.app/)
[![PWA Ready](https://img.shields.io/badge/PWA-Installable%20%2B%20Capacitor-3b82f6?style=for-the-badge&logo=pwa)](https://capacitorjs.com/)

A world-class, futuristic recording studio web application and installable mobile app featuring Pullman Green & Icky Green glassmorphism, authentic Spotify frosted glass music poster player card, dual Web Audio / YouTube playback engines, and **production-grade real-time synchronized music rooms ("Listen Together")** allowing users anywhere worldwide to listen to music simultaneously in lockstep.

**🌐 Live Production App:** [https://melodia-phi-lac.vercel.app/](https://melodia-phi-lac.vercel.app/)

---

## ✦ Table of Contents

- [Architectural Highlights](#-architectural-highlights)
- [Key Features](#-key-features)
- [Project Documentation](#-project-documentation)
- [Project Structure](#-project-structure)
- [Installation & Development](#-installation--development)
- [Production Build & Verification](#-production-build--verification)
- [Environment Variables](#-environment-variables)
- [Deployment (Vercel SPA)](#-deployment-vercel-spa)

---

## ✦ Architectural Highlights

- **100% Programmatic DOM Construction**: The user interface contains **zero authored HTML markup and zero JSX/TSX**. Every component, SVG icon, modal dialog, and control is created programmatically using safe DOM APIs (`createElement`, `createSvg`, `replaceChildren`, `textContent`), completely eliminating XSS and HTML injection risks.
- **Minimal Vite Bootstrap**: Adheres strictly to the unavoidable build-system requirement by using a minimal `index.html` shell (`<div id="app"></div>` + script/meta tags), with 100% of the UI mounted dynamically by `src/main.js`.
- **Modular CSS Separation**: Complete visual presentation resides in dedicated `.css` sheets within `src/styles/` (`tokens.css`, `global.css`, `layout.css`, `sections.css`, `player.css`, `volume.css`, `room.css`, `modals.css`).
- **Reactive State Management**: Decoupled, observable state stores (`audioState` and `roomState`) provide predictable, uni-directional updates to all listening components.
- **Server-Authoritative Real-Time Sync**: Multi-broker MQTT WebSocket cluster (`broker.emqx.io` & `broker.hivemq.com`) with secondary WebRTC mesh channels, monotonic version counters, and sub-2-second continuous drift correction.

---

## ✦ Key Features

### 1. Production-Grade Synchronized Music Rooms
- **Universal Multi-User Controls**: Any member in the room can play, pause, scrub, or switch tracks with instant global synchronization.
- **Retained Authoritative State**: Incoming listeners receive the current elapsed playback position and active track immediately upon joining.
- **Monotonic Version Sequencing**: Discards stale or out-of-order network updates deterministically.
- **Active Listener Presence**: Heartbeat system with MQTT Last Will and Testament (LWT) ensures presence counts reflect real-time participants accurately.

### 2. Worldwide Shareable Room Links
- **Clean URLs**: Direct links in the format `https://melodia-phi-lac.vercel.app/room/MEL-8K9X`.
- **Instant Sharing**: One-click Copy, direct WhatsApp formatting, Telegram sharing, and native mobile share drawer integration.
- **Code Join**: 4-character room codes (`MEL-XXXX`) for quick manual joining.

### 3. Individual Device Volume Control
- **100% Local Volume**: In room sessions, playback and position are synchronized globally, while **volume remains completely personal to each user's device**. Adjusting your volume never impacts peers!
- **Dual Volume Sliders**: Accessible in both the floating mini dock and the master turntable modal with custom gradient tracks, decibel badges, and mute toggles.
- **Persistent Preference**: Saved automatically to `localStorage('mel_volume')`.

### 4. Spotify Web API & Awarapan 2 Spotlight
- **Curated Spotlight**: 89-song rock masterpiece playlist with YouTube streaming audio engine and expandable embedded web player drawer.
- **OAuth Authorization**: Secure implicit grant flow with clean URL hash cleanup to protect user tokens.

### 5. Dual-Engine Audio & Live Visualizers
- **YouTube Iframe Streamer**: Background YouTube player streaming studio master tracks.
- **Web Audio Ambient Synth**: Algorithmic analog synthesizer playing warm Rhodes chords (Dm9 / Cmaj9 / Bbmaj7 / Am7) as atmospheric background and offline fallback.
- **Atmospheric Bokeh Canvas**: 60 FPS GPU-accelerated canvas animation with mouse/touch parallax.
- **Neon Spectrum Analyzers**: Real-time frequency equalizer bars in both mini dock and master player modal.

---

## ✦ Project Documentation

Comprehensive architectural blueprints and integration specifications are located in the `docs/` directory:

- 📘 [**docs/ARCHITECTURE.md**](file:///d:/GITHUB/melodia/docs/ARCHITECTURE.md) — System architecture, Mermaid topology diagrams, state domain breakdown, and security boundaries.
- 🗺️ [**docs/PROJECT-MAP.md**](file:///d:/GITHUB/melodia/docs/PROJECT-MAP.md) — File-by-file inventory of responsibilities, exports, imports, and component interactions.
- 🔌 [**docs/INTEGRATIONS.md**](file:///d:/GITHUB/melodia/docs/INTEGRATIONS.md) — External service specifications: MQTT cluster, WebRTC STUN/ICE, YouTube API, Web Audio API, Spotify OAuth, and PWA setup.

---

## ✦ Project Structure

```text
melodia/
├── index.html                   # Minimal Vite bootstrap container (<div id="app"></div>)
├── package.json                 # Project dependencies & build scripts
├── vite.config.js               # Vite bundler configuration
├── vercel.json                  # Single-Page Application rewrites & security headers
├── .env.example                 # Safe environment variable placeholders
│
├── docs/                        # Complete technical documentation
│   ├── ARCHITECTURE.md          # Architecture, state flows, and diagrams
│   ├── PROJECT-MAP.md           # File-by-file responsibilities and dependencies
│   └── INTEGRATIONS.md          # Protocol specifications and external service boundaries
│
└── src/
    ├── main.js                  # Application entry point; boots app on DOM ready
    ├── data.js                  # Studio discography, tracklists, artists, and playlists
    │
    ├── app/
    │   ├── app.js               # Central application coordinator; mounts UI into #app
    │   └── router.js            # Viewport scroll observer & URL room routing (/room/:id)
    │
    ├── components/
    │   ├── common/
    │   │   ├── dom.js           # Safe programmatic DOM & SVG builders (zero innerHTML)
    │   │   ├── banner.js        # Listen Together invitation banner
    │   │   └── toast.js         # Non-intrusive toast notifications
    │   │
    │   ├── layout/
    │   │   ├── header.js        # Top glassmorphic header, navigation, install button
    │   │   ├── rails.js         # Vertical slide tracker (01/04) & social profiles rail
    │   │   └── mobile-nav.js    # Responsive bottom navigation bar
    │   │
    │   ├── sections/
    │   │   ├── hero-section.js     # Hero landing with semantic <h1> and CTAs
    │   │   ├── records-section.js  # 3D album cover showcase & Spotify spotlight
    │   │   ├── artists-section.js  # 3D resident artist cards & bio summaries
    │   │   └── contact-section.js  # Studio booking contact form & address info
    │   │
    │   ├── player/
    │   │   ├── mini-dock.js     # Floating mini player dock with volume slider
    │   │   └── master-modal.js  # Studio Master Player modal with room controls
    │   │
    │   └── modals/
    │       ├── catalogue-modal.js  # Discography catalogue card grid modal
    │       └── artists-modal.js    # Studio artists roster card grid modal
    │
    ├── services/
    │   ├── audio-service.js     # Unified YouTube streaming player + Web Audio synth
    │   ├── realtime-sync.js     # Enterprise MQTT + WebRTC room synchronization
    │   └── spotify-service.js   # Spotify OAuth implicit grant & playlist metadata
    │
    ├── state/
    │   ├── audio-state.js       # Observable reactive playback state manager
    │   └── room-state.js        # Observable reactive synchronized room state manager
    │
    ├── styles/
    │   ├── tokens.css           # Custom properties, colors, typography scales, radii
    │   ├── global.css           # Base resets, background canvas, noise overlay
    │   ├── layout.css           # Header, rails, snap container, mobile nav styles
    │   ├── sections.css         # Hero, records showcase, artists, contact styles
    │   ├── player.css           # Mini dock, master player modal, spinning vinyl
    │   ├── volume.css           # Individual device volume controls & range sliders
    │   ├── room.css             # Listen Together hub, invite banner, presence pills
    │   ├── modals.css           # Glassmorphic modal backdrops, catalogue grids
    │   └── main.css             # Master CSS entry point importing all modular sheets
    │
    └── utils/
        └── visualizer.js        # BackgroundAtmosphere bokeh canvas & SpectrumVisualizer
```

---

## ✦ Installation & Development

### Prerequisites
- Node.js >= 18.x
- npm >= 9.x

### Install Dependencies
```bash
npm install
```

### Start Development Server
```bash
npm run dev
```
Open [http://localhost:5173/](http://localhost:5173/) in your browser.

---

## ✦ Production Build & Verification

```bash
# Build optimized production bundle
npm run build

# Preview production build locally
npm run preview
```

### Verification Checklist:
- `✓` Production build completes cleanly with zero errors.
- `✓` Zero authored HTML/JSX in UI modules; programmatic DOM construction verified.
- `✓` Zero `innerHTML` or string injection anywhere in the component tree.
- `✓` Dual MQTT broker cluster failover tested.
- `✓` Clean URL room routing (`/room/:roomId`) configured via `vercel.json`.
- `✓` Individual device volume control persisted in `localStorage`.

---

## ✦ Environment Variables

Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

| Variable | Description | Default / Example |
| :--- | :--- | :--- |
| `VITE_SPOTIFY_CLIENT_ID` | Spotify Developer Client ID | `0514468aa4bb497fb4cfc8c5fe503c1a` |
| `VITE_SPOTIFY_CLIENT_SECRET`| Spotify Developer Client Secret | `895c0b6b43f3463ba100ce255ec1784c` |
| `VITE_SPOTIFY_PLAYLIST_ID` | Default Spotlight Playlist ID | `0qRsizDqcvjuBkpbLZkL69` |
| `VITE_APP_URL` | Canonical Production URL | `https://melodia-phi-lac.vercel.app/` |

---

## ✦ Deployment (Vercel SPA)

The project is pre-configured for instant zero-configuration deployment to Vercel:

1. Push your changes to GitHub:
   ```bash
   git add .
   git commit -m "Refactor: programmatic UI architecture and modular separation"
   git push origin main
   ```
2. Vercel automatically detects Vite and executes `npm run build`.
3. `vercel.json` provides SPA rewrites ensuring `/room/:roomId` links routes cleanly without 404 errors.

---

**© 2026 Tunora Audio Studio · World Class Recording & Production**
