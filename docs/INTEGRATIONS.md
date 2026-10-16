# Melodia Beat Records — External Integrations & Service Boundaries

This document details all external service integrations, network protocols, authentication flows, environment variables, error handling, and failure mitigation strategies.

---

## 1. Enterprise MQTT Realtime Cluster

- **Purpose**: Global, low-latency, real-time message exchange and authoritative room synchronization for multi-user listening sessions ("Listen Together").
- **Implementation File**: [`src/services/realtime-sync.js`](file:///d:/GITHUB/melodia/src/services/realtime-sync.js)
- **Calling Modules**: [`src/app/app.js`](file:///d:/GITHUB/melodia/src/app/app.js), [`src/components/player/master-modal.js`](file:///d:/GITHUB/melodia/src/components/player/master-modal.js)
- **Broker Endpoints**:
  1. `wss://broker.emqx.io:8084/mqtt` (Primary)
  2. `wss://broker.hivemq.com:8884/mqtt` (Secondary Failover)
- **Authentication**: Anonymous client connection via TLS WebSockets (`wss://`). Client ID generated dynamically: `user_{random}_{timestamp}`.
- **Environment Variables**: None required (public multi-tenant MQTT broker cluster).
- **Topic Hierarchy**:
  - `melodia/v1/rooms/{roomId}/state`: Retained authoritative room playback state (QoS 1).
  - `melodia/v1/rooms/{roomId}/events`: Ephemeral broadcast notifications (toasts, actions) (QoS 0).
  - `melodia/v1/rooms/{roomId}/presence/{clientId}`: Retained heartbeat presence with Last Will and Testament (LWT) (QoS 1).
- **Failure Handling & Failover**:
  - Automatically fails over to secondary broker if connection fails or times out after 8 seconds.
  - Automatically reconnects with exponential backoff on intermittent network disconnects.
  - State messages employ monotonic version numbers (`version: N`); out-of-order packets are discarded.
- **Cleanup & Teardown**: Upon calling `leaveRoom()`, a retained `{ offline: true }` presence packet is published, subscriptions are cleared, and the WebSocket connection is gracefully terminated (`mqttClient.end(true)`).

---

## 2. WebRTC Peer Mesh Co-Transport

- **Purpose**: Secondary peer-to-peer data channel mesh for sub-10ms state updates directly between browser instances.
- **Implementation File**: [`src/services/realtime-sync.js`](file:///d:/GITHUB/melodia/src/services/realtime-sync.js)
- **Signaling Service**: PeerJS cloud server (`https://unpkg.com/peerjs@1.5.4/dist/peerjs.min.js`).
- **STUN Infrastructure**:
  - `stun:stun.l.google.com:19302`
  - `stun:stun1.l.google.com:19302`
  - `stun:stun2.l.google.com:19302`
  - `stun:global.stun.twilio.com:3478`
- **Failure Handling**: Designed as an auxiliary co-transport. If WebRTC fails due to NAT/firewall constraints, the application operates uninterrupted using the primary MQTT cluster without degradation.
- **Cleanup**: Calling `peer.destroy()` tears down all active peer channels and releases STUN/ICE resources.

---

## 3. YouTube Iframe Streaming Engine

- **Purpose**: High-fidelity audio and video streaming of studio tracks and curated playlists.
- **Implementation File**: [`src/services/audio-service.js`](file:///d:/GITHUB/melodia/src/services/audio-service.js)
- **Calling Modules**: [`src/app/app.js`](file:///d:/GITHUB/melodia/src/app/app.js), [`src/services/realtime-sync.js`](file:///d:/GITHUB/melodia/src/services/realtime-sync.js)
- **Container**: Hidden DOM container (`#yt-host`, dimensioned at 240px × 140px to satisfy browser autoplay requirements).
- **Authentication**: None required (standard public YouTube embed protocol).
- **Environment Variables**: None required.
- **Failure Handling**:
  - If a video is region-restricted or blocked, the `onError` listener automatically catches the error and advances to the next track within 600ms.
  - If the YouTube API script fails to load (e.g. offline mode), the engine transparently activates the Web Audio Ambient Synthesizer fallback.
- **Cleanup**: The player ticker interval is cleared, and `stopVideo()` is invoked on teardown.

---

## 4. Web Audio API Ambient Synthesizer

- **Purpose**: Algorithmic ambient chord synthesizer providing atmospheric studio soundscapes and buffering fallback.
- **Implementation File**: [`src/services/audio-service.js`](file:///d:/GITHUB/melodia/src/services/audio-service.js)
- **Audio Routing Graph**:
  ```text
  Oscillators (Sine / Triangle) 
      -> Lowpass Biquad Filter (650Hz - 1400Hz sweep) 
      -> Voice Gain Nodes (ADSR Envelope) 
      -> Synth Master Gain (Volume Scaler) 
      -> AnalyserNode (FFT Size 64) 
      -> AudioDestinationNode (Speakers / Headphones)
  ```
- **Inputs**: Frequency arrays in Hz (e.g. Dm9, Cmaj9, Bbmaj7, Am7).
- **Failure Handling**: Ensures `AudioContext` is created only on user gesture and safely resumes from suspended state.
- **Cleanup**: `stopSynthSequence()` clears active timeout timers; oscillators automatically disconnect and terminate after their release envelope.

---

## 5. Spotify Web API & OAuth 2.0 Integration

- **Purpose**: Spotify account connection and spotlight playlist metadata retrieval for the Awarapan 2 playlist (`0qRsizDqcvjuBkpbLZkL69`).
- **Implementation File**: [`src/services/spotify-service.js`](file:///d:/GITHUB/melodia/src/services/spotify-service.js)
- **Calling Modules**: [`src/components/sections/records-section.js`](file:///d:/GITHUB/melodia/src/components/sections/records-section.js), [`src/app/app.js`](file:///d:/GITHUB/melodia/src/app/app.js)
- **Required Environment Variables**:
  ```bash
  VITE_SPOTIFY_CLIENT_ID=0514468aa4bb497fb4cfc8c5fe503c1a
  VITE_SPOTIFY_CLIENT_SECRET=895c0b6b43f3463ba100ce255ec1784c
  VITE_SPOTIFY_PLAYLIST_ID=0qRsizDqcvjuBkpbLZkL69
  VITE_APP_URL=https://melodia-phi-lac.vercel.app/
  ```
- **Authorization Flow**:
  - **Implicit Grant Flow**: Directs user to `https://accounts.spotify.com/authorize` with scopes: `streaming`, `user-read-email`, `user-read-private`, `user-read-playback-state`, `user-modify-playback-state`.
  - **Redirect URI**: Automatically adapts between `http://localhost:5173/` during local development and `https://melodia-phi-lac.vercel.app/` in production.
  - **Token Consumption**: Extracts `access_token` from `window.location.hash`, stores in `localStorage`, and cleanly strips hash fragments from browser history.
  - **Client Credentials Flow**: Queries public playlist metadata without requiring user login by querying `/api/token`.
- **Failure Handling**: Network failures log warnings and fallback gracefully without impeding local audio playback.
- **Cleanup**: `logout()` clears stored tokens from `localStorage` and emits `spotify:disconnected`.

---

## 6. Progressive Web App (PWA) & Service Worker

- **Purpose**: Offline caching of critical assets, standalone mobile installation, and app shortcuts.
- **Files**: [`sw.js`](file:///d:/GITHUB/melodia/sw.js), [`manifest.webmanifest`](file:///d:/GITHUB/melodia/manifest.webmanifest)
- **Scope**: Entire application origin.
- **Install Prompt Handling**: Captures `beforeinstallprompt` event and surfaces native install triggers via the header and mobile navigation bars.

---

## 7. Production Deployment & Vercel SPA Routing

- **Configuration File**: [`vercel.json`](file:///d:/GITHUB/melodia/vercel.json)
- **Routing Rules**:
  - Clean URL rewrites map all `/room/:roomId` requests to `/index.html` to ensure direct link joins load the Single Page Application without 404 errors.
- **Security Headers**:
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: SAMEORIGIN`
  - `X-XSS-Protection: 1; mode=block`
  - `Referrer-Policy: strict-origin-when-cross-origin`
