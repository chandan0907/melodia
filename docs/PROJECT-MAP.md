# Melodia Beat Records — File-by-File Project Map

This document provides a comprehensive, file-by-file map of the entire codebase detailing responsibility, exported APIs, imported modules, consumers, and integrated features.

---

## 1. Application Core & Bootstrap

### [`src/main.js`](file:///d:/GITHUB/melodia/src/main.js)
- **Responsibility**: Application bootstrap entry point loaded by the Vite HTML shell.
- **Main Functions**: `bootstrap()`
- **Imports**: [`src/styles/main.css`](file:///d:/GITHUB/melodia/src/styles/main.css), [`src/app/app.js`](file:///d:/GITHUB/melodia/src/app/app.js)
- **Used By**: [`index.html`](file:///d:/GITHUB/melodia/index.html)
- **Integrations**: Initiates DOM mounting and state subscriptions on DOM ready.
- **Features Dependent**: Entire application boot sequence.

### [`src/app/app.js`](file:///d:/GITHUB/melodia/src/app/app.js)
- **Responsibility**: Central application coordinator orchestrating programmatic DOM mounting, 3D card tilt, modal lifecycle, and reactive playback/room updates.
- **Main Functions / Classes**: `MelodiaApp`, `app`
  - `mount()`: Constructs and appends the entire programmatic DOM tree into `#app`.
  - `init()`: Connects services, visualizers, routers, keyboard controls, and PWA prompts.
  - `renderPlaybackState(state)`: Updates DOM with track title, cover, vinyl animation, and volume slider.
  - `renderSyncState(syncState)`: Updates room status badge, presence counts, and link fields.
  - `setup3DTilt()`: Calculates perspective rotation for album and artist cards.
- **Imports**:
  - `../components/common/dom.js`
  - `../components/common/toast.js`
  - `../components/common/banner.js`
  - `../components/layout/header.js`
  - `../components/layout/rails.js`
  - `../components/layout/mobile-nav.js`
  - `../components/sections/hero-section.js`
  - `../components/sections/records-section.js`
  - `../components/sections/artists-section.js`
  - `../components/sections/contact-section.js`
  - `../components/player/mini-dock.js`
  - `../components/player/master-modal.js`
  - `../components/modals/catalogue-modal.js`
  - `../components/modals/artists-modal.js`
  - `../services/audio-service.js`
  - `../services/realtime-sync.js`
  - `../services/spotify-service.js`
  - `./router.js`
  - `../utils/visualizer.js`
- **Used By**: [`src/main.js`](file:///d:/GITHUB/melodia/src/main.js)
- **Integrations**: Coordinates all internal services with native browser DOM APIs.

### [`src/app/router.js`](file:///d:/GITHUB/melodia/src/app/router.js)
- **Responsibility**: Viewport section navigation, scroll intersection observation, and URL room code routing.
- **Main Functions / Classes**: `AppRouter`, `router`
  - `initSectionObserver()`: Binds IntersectionObserver to screen sections and updates slide indicators (01/04).
  - `scrollToSection(targetId)`: Smoothly scrolls viewport to designated section.
  - `parseRoomUrl()`: Extracts room ID from path (`/room/:id`), hash (`#room=id`), or query parameters.
- **Imports**: None (pure browser DOM & Location APIs).
- **Used By**: [`src/app/app.js`](file:///d:/GITHUB/melodia/src/app/app.js)
- **Features Dependent**: Viewport slide tracker, desktop nav links, mobile nav, URL room detection.

---

## 2. Programmatic UI Components

### [`src/components/common/dom.js`](file:///d:/GITHUB/melodia/src/components/common/dom.js)
- **Responsibility**: Safe programmatic DOM and SVG element construction factory functions. Completely eliminates `innerHTML` and XSS risks.
- **Main Functions**:
  - `createElement(tag, options)`: Creates HTML elements with attributes, event listeners, and children.
  - `createSvg(tag, options)`: Creates SVG namespace elements with attributes.
  - `createSvgIcon(w, h, viewBox, children)`: Convenience wrapper for SVG icons.
  - `createSvgPath(d, attrs)`: Convenience wrapper for SVG paths.
  - `clearElement(el)`: Safely clears child nodes using `replaceChildren()`.
- **Used By**: All modules in `src/components/` and `src/app/app.js`.
- **Features Dependent**: Every visual UI element in the application.

### [`src/components/common/banner.js`](file:///d:/GITHUB/melodia/src/components/common/banner.js)
- **Responsibility**: Programmatically constructs the top Listen Together invitation banner (`#invite-banner`).
- **Main Functions**: `createInviteBanner(callbacks)`
- **Used By**: [`src/app/app.js`](file:///d:/GITHUB/melodia/src/app/app.js)
- **Features Dependent**: Room invitations, join actions on incoming shareable links.

### [`src/components/common/toast.js`](file:///d:/GITHUB/melodia/src/components/common/toast.js)
- **Responsibility**: Programmatically constructs the global toast notification element (`#app-toast`).
- **Main Functions**: `createToast()`
- **Used By**: [`src/app/app.js`](file:///d:/GITHUB/melodia/src/app/app.js)
- **Features Dependent**: User action feedback (link copied, album loaded, Spotify connected).

### [`src/components/layout/header.js`](file:///d:/GITHUB/melodia/src/components/layout/header.js)
- **Responsibility**: Top glassmorphic header containing brand logo, desktop navigation links, install app button, and player launcher.
- **Main Functions**: `createHeader(handlers)`
- **Used By**: [`src/app/app.js`](file:///d:/GITHUB/melodia/src/app/app.js)
- **Features Dependent**: Branding, navigation, PWA install prompt trigger.

### [`src/components/layout/rails.js`](file:///d:/GITHUB/melodia/src/components/layout/rails.js)
- **Responsibility**: Left slide tracker rail (`#indicator-fill`, `#indicator-num`) and right social links rail.
- **Main Functions**: `createLeftRail()`, `createRightRail()`
- **Used By**: [`src/app/app.js`](file:///d:/GITHUB/melodia/src/app/app.js)
- **Features Dependent**: Viewport slide position indicators and external social profiles.

### [`src/components/layout/mobile-nav.js`](file:///d:/GITHUB/melodia/src/components/layout/mobile-nav.js)
- **Responsibility**: Responsive bottom mobile navigation bar for smartphones and tablets.
- **Main Functions**: `createMobileNav(handlers)`
- **Used By**: [`src/app/app.js`](file:///d:/GITHUB/melodia/src/app/app.js)
- **Features Dependent**: Mobile navigation.

### [`src/components/sections/hero-section.js`](file:///d:/GITHUB/melodia/src/components/sections/hero-section.js)
- **Responsibility**: Landing hero screen with primary semantic `<h1>` title, subtitle, and CTA buttons.
- **Main Functions**: `createHeroSection(handlers)`
- **Used By**: [`src/app/app.js`](file:///d:/GITHUB/melodia/src/app/app.js)
- **Features Dependent**: Hero section, call to actions.

### [`src/components/sections/records-section.js`](file:///d:/GITHUB/melodia/src/components/sections/records-section.js)
- **Responsibility**: 3D album cover showcase cards and the Spotify Featured Spotlight bar with OAuth connect and embedded web player.
- **Main Functions**: `createRecordsSection(handlers)`
- **Used By**: [`src/app/app.js`](file:///d:/GITHUB/melodia/src/app/app.js)
- **Features Dependent**: Album playback triggers, Spotify OAuth login, Spotify embedded player drawer.

### [`src/components/sections/artists-section.js`](file:///d:/GITHUB/melodia/src/components/sections/artists-section.js)
- **Responsibility**: 3D resident artist cards (Marcus Vance, Kai Sterling, Elena Cruz) and roster modal trigger.
- **Main Functions**: `createArtistsSection(handlers)`
- **Used By**: [`src/app/app.js`](file:///d:/GITHUB/melodia/src/app/app.js)
- **Features Dependent**: Artist profiles.

### [`src/components/sections/contact-section.js`](file:///d:/GITHUB/melodia/src/components/sections/contact-section.js)
- **Responsibility**: "BEAT ME" studio contact section with email booking form and studio location info.
- **Main Functions**: `createContactSection(handlers)`
- **Used By**: [`src/app/app.js`](file:///d:/GITHUB/melodia/src/app/app.js)
- **Features Dependent**: Studio session inquiries and contact information.

### [`src/components/player/mini-dock.js`](file:///d:/GITHUB/melodia/src/components/player/mini-dock.js)
- **Responsibility**: Persistent floating bottom mini player dock with spinning vinyl, title/artist meta, waveform visualizer, playback buttons, and individual device volume popout slider.
- **Main Functions**: `createMiniDock(handlers)`
- **Used By**: [`src/app/app.js`](file:///d:/GITHUB/melodia/src/app/app.js)
- **Features Dependent**: Universal audio playback controls and local volume management.

### [`src/components/player/master-modal.js`](file:///d:/GITHUB/melodia/src/components/player/master-modal.js)
- **Responsibility**: Full Master Studio Player modal dialogue featuring spinning big vinyl, frequency spectrum analyzer, progress seek bar, playlist switch pills, individual volume card, and Listen Together real-time room hub.
- **Main Functions**: `createMasterModal(handlers)`
- **Used By**: [`src/app/app.js`](file:///d:/GITHUB/melodia/src/app/app.js)
- **Features Dependent**: Master tape playback, room creation/joining, shareable URLs, social share links.

### [`src/components/modals/catalogue-modal.js`](file:///d:/GITHUB/melodia/src/components/modals/catalogue-modal.js)
- **Responsibility**: Discography catalogue modal displaying all master record releases programmatically with zero innerHTML.
- **Main Functions**: `createCatalogueModal(handlers)`
- **Imports**: `../../data.js`
- **Used By**: [`src/app/app.js`](file:///d:/GITHUB/melodia/src/app/app.js)
- **Features Dependent**: Full studio discography inspection and instant playback loading.

### [`src/components/modals/artists-modal.js`](file:///d:/GITHUB/melodia/src/components/modals/artists-modal.js)
- **Responsibility**: Resident artists roster modal displaying artist profiles, gear specifications, and bios.
- **Main Functions**: `createArtistsModal(handlers)`
- **Imports**: `../../data.js`
- **Used By**: [`src/app/app.js`](file:///d:/GITHUB/melodia/src/app/app.js)
- **Features Dependent**: Artist roster browsing.

---

## 3. Services & Data Modules

### [`src/services/audio-service.js`](file:///d:/GITHUB/melodia/src/services/audio-service.js)
- **Responsibility**: Unified audio playback engine managing YouTube audio streaming, Web Audio ambient synthesis fallback, MediaSession API, and individual volume management.
- **Main Functions / Classes**: `AudioEngine`, `audio`
  - `playYouTubeVideo(ytId, startSeconds)`: Streams audio via YouTube iframe API.
  - `playRecord(recordId, trackIdx)`: Loads track from studio discography.
  - `playPlaylist(playlistId)`: Queues and plays curated studio playlists.
  - `setVolume(val)`: Adjusts local device volume (0.0 to 1.0) and persists to localStorage.
  - `startSynthSequence()`: Synthesizes warm analog ambient polysynth tones via Web Audio API.
- **Imports**: `../data.js`, `../state/audio-state.js`
- **Used By**: `src/app/app.js`, `src/services/realtime-sync.js`, `src/utils/visualizer.js`
- **Features Dependent**: All audio playback, individual device volume control, MediaSession metadata.

### [`src/services/realtime-sync.js`](file:///d:/GITHUB/melodia/src/services/realtime-sync.js)
- **Responsibility**: Production-grade real-time room synchronization across multiple devices using dual MQTT broker cluster and WebRTC mesh.
- **Main Functions / Classes**: `RealtimeRoomSync`, `sync`
  - `createRoom(customName)`: Creates new room with clean code (e.g. `MEL-8K9X`) and broadcasts initial authoritative state.
  - `joinRoom(targetRoomId)`: Joins existing room and establishes MQTT and WebRTC transports.
  - `togglePlay()`, `play()`, `pause()`, `seek()`, `next()`, `prev()`: Synchronous actions broadcast globally.
  - `checkDrift()`: Background reconciliation correcting cumulative drift greater than 2 seconds.
- **Imports**: `mqtt`, `./audio-service.js`, `../state/room-state.js`
- **Used By**: `src/app/app.js`
- **Features Dependent**: Listen Together synchronized listening, room creation, joining, and link generation.

### [`src/services/spotify-service.js`](file:///d:/GITHUB/melodia/src/services/spotify-service.js)
- **Responsibility**: Spotify Web API integration and OAuth implicit grant authorization service.
- **Main Functions / Classes**: `SpotifyService`, `spotify`
  - `login()`: Redirects user to Spotify Accounts authorization.
  - `checkOAuthCallback()`: Extracts and persists access token from URL hash.
  - `fetchCurrentUser()`: Queries user profile (`/v1/me`).
  - `getPlaylist(playlistId)`: Queries public playlist tracks using Client Credentials token.
- **Used By**: `src/app/app.js`, `src/components/sections/records-section.js`
- **Features Dependent**: Spotify user connection and Awarapan 2 spotlight playlist metadata.

### [`src/state/audio-state.js`](file:///d:/GITHUB/melodia/src/state/audio-state.js)
- **Responsibility**: Reactive observable state manager for audio playback status, active track, progress %, and volume.
- **Main Functions / Classes**: `AudioStateManager`, `audioState`
- **Used By**: `src/services/audio-service.js`

### [`src/state/room-state.js`](file:///d:/GITHUB/melodia/src/state/room-state.js)
- **Responsibility**: Reactive observable state manager for music rooms, presence counts, and authoritative state snapshots.
- **Main Functions / Classes**: `RoomStateManager`, `roomState`
- **Used By**: `src/services/realtime-sync.js`

### [`src/utils/visualizer.js`](file:///d:/GITHUB/melodia/src/utils/visualizer.js)
- **Responsibility**: Real-time rendering engines for GPU-accelerated atmospheric bokeh canvas and neon audio spectrum analyzers.
- **Main Functions / Classes**: `BackgroundAtmosphere`, `SpectrumVisualizer`
- **Imports**: `../services/audio-service.js`
- **Used By**: `src/app/app.js`
- **Features Dependent**: Background visual effects and audio spectrum equalizer displays.

### [`src/data.js`](file:///d:/GITHUB/melodia/src/data.js)
- **Responsibility**: Authoritative data records for studio discography (`RECORDS`), resident artists (`ARTISTS`), curated playlists (`PLAYLISTS`), and studio specifications (`STUDIO_INFO`).
- **Used By**: `src/services/audio-service.js`, `src/components/modals/catalogue-modal.js`, `src/components/modals/artists-modal.js`

---

## 4. Styling System (`src/styles/`)

- [`src/styles/tokens.css`](file:///d:/GITHUB/melodia/src/styles/tokens.css): Design tokens, custom properties, color palette, typography scales, radii, and easing curves.
- [`src/styles/global.css`](file:///d:/GITHUB/melodia/src/styles/global.css): Base resets, typography, `#bg-canvas`, `.noise-overlay`, and accessibility foundations.
- [`src/styles/layout.css`](file:///d:/GITHUB/melodia/src/styles/layout.css): App header, navigation links, slide indicator rail, social links rail, and mobile bottom nav.
- [`src/styles/sections.css`](file:///d:/GITHUB/melodia/src/styles/sections.css): Hero section, 3D records showcase & cards, Spotify spotlight widget, artists section, and contact form.
- [`src/styles/player.css`](file:///d:/GITHUB/melodia/src/styles/player.css): Mini dock, master player modal, vinyl spinning keyframe animation, and spectrum visualizers.
- [`src/styles/volume.css`](file:///d:/GITHUB/melodia/src/styles/volume.css): Individual device volume controls, range sliders, and dock hover popout.
- [`src/styles/room.css`](file:///d:/GITHUB/melodia/src/styles/room.css): Listen Together room box, invitation banner, presence indicators, and shareable link fields.
- [`src/styles/modals.css`](file:///d:/GITHUB/melodia/src/styles/modals.css): Glass modal backdrops, catalogue grid cards, and toast notification styles.
- [`src/styles/main.css`](file:///d:/GITHUB/melodia/src/styles/main.css): Master CSS entry point importing all modular style sheets.
