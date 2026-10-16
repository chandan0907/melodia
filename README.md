# MELODIA BEAT RECORDS — Luxury Studio Audio Web & Mobile App

A world-class, ultra-modern music recording studio web application and installable app built with JavaScript, Vite, Web Audio API, and PWA capabilities. Featuring deep crimson glassmorphism, 3D interactive vinyl showcases, real-time audio visualizers, and synchronized "Listen Together" rooms.

---

## ✦ Key Features

- **Cinematic Dark Glassy Design**: Deep black and midnight surfaces paired with glowing crimson, ruby, and peach embers, frosted glass panels (`backdrop-filter: blur(28px)`), and dynamic atmospheric bokeh particles.
- **4 Signature Sections (from Concept Art)**:
  1. **Hero**: Big condensed typography (`BEAT RECORDS`), tagline (`World Class Recording & Production`), animated glowing particle field, and instant call-to-actions.
  2. **Records / Projects**: 3D interactive cover flow showcase featuring *IMAGINATION*, *LOVE*, and *DREAMER* with mouse tilt-parallax, dynamic glare, and one-click playback.
  3. **Artists**: Resident artist cards (*Marcus Vance*, *Kai Sterling*, *Elena Cruz*) with glowing glass frames, bios, favorite studio gear, and monthly listener stats.
  4. **Contact / "BEAT ME"**: Studio facilities intro, sleek frosted email input with animated toast feedback, and full studio contact details.
- **Unified Audio Engine**:
  - **Procedural Studio Ambient Synthesizer**: Built with the Web Audio API (warm Rhodes chords, analog filter sweeps, deep 808 sub bass, and vinyl warmth) that plays instantly offline.
  - **YouTube Iframe Streamer**: Plays full YouTube audio/video tracks with automatic metadata and album artwork.
  - **Live Audio Frequency Visualizer**: Canvas visualizer directly connected to an `AnalyserNode` for real-time waveform and bar animations.
- **Installable App & Mobile Ready (PWA + Capacitor)**:
  - **Progressive Web App**: Complete with `manifest.webmanifest`, `sw.js` (Service Worker caching), and a built-in "Install App" button.
  - **Mobile App Shell**: Dedicated bottom navigation bar (`Home`, `Records`, `Artists`, `Contact`, `Player`) and responsive touch-first layout.
  - **Capacitor Mobile App Ready**: Configured with `capacitor.config.json` for seamless packaging into native iOS and Android apps.
- **Persistent Floating Mini-Player & Studio Master Modal**:
  - Floating glassy dock with spinning vinyl record, live mini-spectrum, play/pause, volume, and track info.
  - Full-screen Studio Master Player modal with big turntable, scrubbable progress bar, and "Listen Together" PeerJS room link generator.

---

## ✦ Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Local Development Server
```bash
npm run dev
```
The server will start at `http://localhost:3000` or `http://localhost:5173`.

### 3. Build for Production
```bash
npm run build
```
Generates an optimized, production-ready bundle in the `dist/` directory.

### 4. Preview Production Build
```bash
npm run preview
```

---

## ✦ Making it a Mobile App (iOS / Android)

The project includes `capacitor.config.json` and a full PWA manifest. To create native mobile apps:

```bash
# 1. Build the web app
npm run build

# 2. Install Capacitor CLI & Core
npm install @capacitor/core @capacitor/cli --save-dev

# 3. Add iOS or Android platform
npx cap add android
npx cap add ios

# 4. Sync web assets into the native project
npx cap sync

# 5. Open in Android Studio or Xcode
npx cap open android
npx cap open ios
```

---

## ✦ Project Structure

```
melodia/
├── index.html                  # Main application structure with 4 full sections & modals
├── package.json                # Project configuration, scripts, and dependencies
├── vite.config.js              # Vite bundler & dev server config
├── capacitor.config.json       # Mobile app compilation config
├── manifest.webmanifest        # PWA Web Manifest (icons, standalone display)
├── sw.js                       # Service Worker for offline asset caching
├── assets/
│   ├── images/                 # High-resolution album covers & artist portraits
│   │   ├── album_love.jpg
│   │   ├── album_imagination.jpg
│   │   ├── album_dreamer.jpg
│   │   ├── artist_marcus.jpg
│   │   ├── artist_kai.jpg
│   │   └── artist_elena.jpg
│   └── icons/
│       └── icon.svg            # Glowing vinyl app icon
└── src/
    ├── app.js                  # Main controller: 3D tilt, PWA prompt, modals, navigation
    ├── audio.js                # Dual-engine audio manager (Web Audio synth + YouTube + sync)
    ├── visualizer.js           # Dynamic bokeh particles canvas & real-time spectrum visualizer
    ├── data.js                 # Discography, artists, playlists, and studio data
    └── styles.css              # Glassmorphism design system & responsive app styling
```
