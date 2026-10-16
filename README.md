# 🎧 MELODIA BEAT RECORDS — Luxury Studio Audio & Real-Time Synchronized Music Rooms

[![Vercel Deployment](https://img.shields.io/badge/Live%20App-melodia--phi--lac.vercel.app-1ed760?style=for-the-badge&logo=vercel)](https://melodia-phi-lac.vercel.app/)
[![JavaScript](https://img.shields.io/badge/JavaScript-ESM%20%2B%20Vite-f7df1e?style=for-the-badge&logo=javascript&logoColor=000)](https://vitejs.dev/)
[![Realtime Sync](https://img.shields.io/badge/Realtime-MQTT%20WSS%20%2B%20WebRTC-e11d48?style=for-the-badge)](https://melodia-phi-lac.vercel.app/)
[![PWA Ready](https://img.shields.io/badge/PWA-Installable%20%2B%20Capacitor-3b82f6?style=for-the-badge&logo=pwa)](https://capacitorjs.com/)

A world-class, futuristic recording studio web application and installable mobile app featuring deep crimson glassmorphism, 3D interactive vinyl cover flow, Web Audio ambient synthesizers, and **production-grade real-time synchronized music rooms** that allow users anywhere in the world to listen to the same music together in lockstep.

**🌐 Live Production App:** [https://melodia-phi-lac.vercel.app/](https://melodia-phi-lac.vercel.app/)

---

## ✦ Table of Contents

- [Key Features](#-key-features)
- [Synchronized Music Rooms Architecture](#-synchronized-music-rooms-architecture)
- [Individual Device Volume Control](#-individual-device-volume-control)
- [Spotify Integration](#-spotify-integration)
- [Design Aesthetics](#-design-aesthetics)
- [Quick Start Guide](#-quick-start-guide)
- [Mobile App Build (Capacitor for iOS & Android)](#-mobile-app-build-capacitor-for-ios--android)
- [Production Deployment (Vercel)](#-production-deployment-vercel)
- [Project Structure](#-project-structure)

---

## ✦ Key Features

### 1. Production-Grade Synchronized Music Rooms
- **Universal Multi-User Controls**: Anyone in the room (creator, guest, or friend joining later) has equal, instantaneous control to Play, Pause, Seek, Skip, or change albums/playlists.
- **Retained Authoritative State**: Powered by global MQTT over secure WebSockets with multi-broker failover (`broker.emqx.io` & `broker.hivemq.com`). The latest authoritative room state is stored on the broker, so a user joining **5 minutes or 1 hour later** starts at the exact current elapsed playback position rather than 0:00!
- **Monotonic Version Sequencing**: Discards stale or out-of-order network packets deterministically to eliminate race conditions when multiple users send simultaneous commands.
- **Sub-Second Drift Correction**: Background monitor evaluates timeline alignment every 2 seconds. Small drifts (< 1.8s) are ignored to prevent audio stutter, while larger drifts smoothly re-align to the authoritative room position.
- **Accurate Real-Time Presence**: Heartbeat system with MQTT Last Will and Testament (LWT) guarantees active listener counts update immediately when users join, disconnect, or close their tabs (e.g. `● Live Room: MEL-4K9X · 4 listening`).
- **WebRTC PeerJS Mesh Co-Transport**: Runs alongside MQTT as a zero-latency peer-to-peer data channel relay for local network acceleration.

### 2. Worldwide Shareable Room Links & Sharing Hub
- **Clean Production URLs**: Generates direct shareable links like `https://melodia-phi-lac.vercel.app/room/MEL-4K9X` (with backward compatibility for `#room=MEL-4K9X` and query parameter `?room=MEL-4K9X`).
- **Multi-Channel Sharing**:
  - **Copy Link**: One-click copy with clipboard toast feedback.
  - **WhatsApp Share**: Direct one-tap share formatted with room link and active track metadata.
  - **Telegram Share**: One-tap share to Telegram chats and groups.
  - **Native Device Share**: Invokes native iOS / Android share drawers via `navigator.share`.
- **Join by Room Code**: Users can simply type or paste a 6-character room code (e.g. `MEL-4K9X`) to jump into any active session.
- **Smart Autoplay Handling**: If mobile browsers restrict audio autoplay, a prominent interactive glass banner (`Join & Listen`) allows a single tap to unlock Web Audio & YouTube streams seamlessly.

### 3. Individual Device Volume Controller
- **100% Personal & Local**: In synchronized rooms, song playback, pausing, and scrubbing are synchronized across all devices, but **volume is intentionally kept local to each user's device**. Adjusting your volume never changes your friends' listening level!
- **Dual Controllers**:
  - **Studio Master Modal Controller**: Glass card with live percentage badge (`85%` or `0% (Muted)`), glowing gradient slider, and instant mute toggle.
  - **Mini Dock Expandable Controller**: Floating bottom dock includes a hover/tap-expandable inline volume slider.
- **Persistent Volume**: Saved to `localStorage` (`mel_volume`), preserving user preference across sessions and refreshes.

### 4. Spotify Web API & Featured Playlist
- **Awarapan 2 (All Songs) Spotlight**: Featured playlist with 89 tracks, YouTube streaming audio engine, and embedded Spotify web player drawer.
- **Spotify OAuth Connect**: Client Credentials & User Authorization flow configured with Client ID & Client Secret in `.env`.

### 5. Unified Dual-Engine Audio Player
- **YouTube Audio Streamer**: Background YouTube player (`#yt-host`) streaming master track cuts with accurate timeline, duration, and artwork.
- **Web Audio Ambient Synthesizer**: Procedural offline ambient synthesizer (Rhodes chord progression in Dm7, lowpass filter sweeps, and analog warmth) that plays offline or during buffering.
- **Live Canvas Spectrum Visualizers**: Real-time frequency visualizer in both the floating mini dock and the full turntable modal.

---

## ✦ Synchronized Music Rooms Architecture

```
                  ┌───────────────────────────────────────────────┐
                  │    Global MQTT WebSocket Cluster (EMQX/Hive)  │
                  │  Topic: melodia/v1/rooms/{roomId}/state       │
                  │  (Retained Authoritative State + LWT Presence)│
                  └──────────────────────┬────────────────────────┘
                                         │ WSS (Port 8084/8884)
                   ┌─────────────────────┼─────────────────────┐
                   │                     │                     │
                   ▼                     ▼                     ▼
          ┌────────────────┐    ┌────────────────┐    ┌────────────────┐
          │     User A     │    │     User B     │    │     User C     │
          │ (Creates Room) │    │(Joins 5m Later)│    │(Joins on Phone)│
          └────────┬───────┘    └────────┬───────┘    └────────┬───────┘
                   │                     │                     │
                   └─────────────────────┴─────────────────────┘
                               WebRTC DataChannel Mesh
                             (Peer-to-Peer Fast Path)
```

### Authoritative State Schema
```json
{
  "roomId": "MEL-4K9X",
  "roomName": "Melodia Studio Room",
  "track": {
    "title": "Toh Phir Aao",
    "artist": "Mustafa Zahid & Pritam",
    "album": "Awarapan 2",
    "durationSeconds": 348,
    "ytId": "n_VrRuNkbrE"
  },
  "status": "PLAYING",
  "position": 45.2,
  "updatedAt": 1715000000000,
  "version": 4,
  "updatedBy": "user_7x8k2a"
}
```

### Elapsed Playback Calculation on Join
When any user opens the link while music is playing:
$$\text{elapsed} = \frac{\text{Date.now()} - \text{state.updatedAt}}{1000}$$
$$\text{targetPosition} = \min(\text{track.durationSeconds}, \text{state.position} + \text{elapsed})$$
The client loads the track and seeks to `targetPosition` to achieve instant worldwide synchronization.

---

## ✦ Design Aesthetics

- **Curated Color Palette**:
  - Background: Deep midnight obsidian (`#07060a`, `#0f0b17`)
  - Accent Rose / Crimson: `#e11d48`, `#be123c`, `#ff3366`
  - Peach Highlight: `#fca5a5`, `#fb7185`
  - Neon Live Indicator: `#1ed760` (active room & Spotify green)
- **Glassmorphism**: Multilayered `backdrop-filter: blur(28px)`, subtle borders (`rgba(255, 255, 255, 0.1)`), and specular highlight insets.
- **Interactive 3D Cover Flow**: Dynamic mouse-tilt 3D perspective transforms with lighting reflections on album covers and artist cards.
- **Typography**: Google Fonts pairing — **Syne** (geometric modern display) & **Inter** (clean typographic body).

---

## ✦ Quick Start Guide

### Prerequisites
- Node.js (v18 or higher recommended)
- npm or yarn

### 1. Clone & Install
```bash
git clone https://github.com/chandan0907/melodia.git
cd melodia
npm install
```

### 2. Configure Environment Variables
Create or verify `.env` in the root directory:
```env
VITE_SPOTIFY_CLIENT_ID=your_spotify_client_id
VITE_SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
VITE_SPOTIFY_PLAYLIST_ID=0qRsizDqcvjuBkpbLZkL69
VITE_APP_URL=https://melodia-phi-lac.vercel.app/
```

### 3. Start Local Development Server
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### 4. Build for Production
```bash
npm run build
```
Creates an optimized, tree-shaken production bundle in `dist/`.

---

## ✦ Mobile App Build (Capacitor for iOS & Android)

Melodia includes a complete `capacitor.config.json` and progressive web app manifest for native mobile compilation:

```bash
# 1. Build the production web bundle
npm run build

# 2. Install Capacitor Core & CLI (if not already installed)
npm install @capacitor/core @capacitor/cli --save-dev

# 3. Add mobile platform targets
npx cap add android
npx cap add ios

# 4. Sync web assets into native shells
npx cap sync

# 5. Open in Android Studio or Xcode
npx cap open android
npx cap open ios
```

---

## ✦ Production Deployment (Vercel)

The repository includes a production-ready `vercel.json` configuration with SPA rewrites for clean dynamic routes (`/room/:roomId`):

```json
{
  "rewrites": [
    { "source": "/room/:roomId", "destination": "/index.html" },
    { "source": "/(.*)", "destination": "/index.html" }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "SAMEORIGIN" },
        { "key": "X-XSS-Protection", "value": "1; mode=block" }
      ]
    }
  ]
}
```

Every push to the `main` branch of `chandan0907/melodia` triggers an automatic zero-downtime deployment on Vercel.

---

## ✦ Project Structure

```
melodia/
├── index.html                  # Main application structure, modals, turntable, and room hub
├── package.json                # Project dependencies, scripts (vite, mqtt)
├── vite.config.js              # Bundler configuration
├── vercel.json                 # Vercel SPA routing & security headers
├── capacitor.config.json       # Mobile app packaging configuration
├── manifest.webmanifest        # Progressive Web App manifest
├── sw.js                       # Service Worker for offline caching
├── .env                        # Spotify API credentials & App URL
├── assets/
│   ├── images/                 # Studio album covers & artist portraits
│   │   ├── album_awarapan.jpg
│   │   ├── album_love.jpg
│   │   ├── album_imagination.jpg
│   │   ├── album_dreamer.jpg
│   │   ├── artist_marcus.jpg
│   │   ├── artist_kai.jpg
│   │   └── artist_elena.jpg
│   └── icons/
│       └── icon.svg            # Glowing vinyl app icon
└── src/
    ├── app.js                  # Main UI orchestrator, modal router, 3D tilt, and room controllers
    ├── audio.js                # Dual-engine audio manager (YouTube + Web Audio Synth + Volume)
    ├── sync.js                 # Production Realtime Room Sync (MQTT WSS + WebRTC Mesh)
    ├── spotify.js              # Spotify Web API & OAuth authentication module
    ├── visualizer.js           # Real-time Web Audio spectrum & atmospheric bokeh particle engine
    ├── data.js                 # Master discography, resident artists, and studio playlists
    └── styles.css              # Glassmorphic design system, animations, and responsive layout
```

---

## ✦ License

Private & proprietary recording studio application · Developed for Melodia Beat Records.
