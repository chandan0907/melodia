// PURPOSE: Central application coordinator orchestrating programmatic DOM mounting, state synchronization,
// 3D card tilt physics, audio visualizers, Spotify OAuth, and Listen Together real-time music rooms.
// INTEGRATION: Mounts the entire UI into #app, connects services (AudioEngine, RealtimeRoomSync, SpotifyService),
// and bridges user gestures with authoritative state mutations.
// SECURITY: Zero authored HTML or JSX markup; zero innerHTML; builds all DOM nodes via safe native DOM APIs.

import { createElement } from '../components/common/dom.js';
import { artworkUrl } from '../components/common/artwork.js';
import { createToast } from '../components/common/toast.js';
import { createInviteBanner } from '../components/common/banner.js';
import { createHeader } from '../components/layout/header.js';
import { createLeftRail, createRightRail } from '../components/layout/rails.js';
import { createMobileNav } from '../components/layout/mobile-nav.js';
import { createHeroSection } from '../components/sections/hero-section.js';
import { createRecordsSection } from '../components/sections/records-section.js';
import { createArtistsSection } from '../components/sections/artists-section.js';
import { createContactSection } from '../components/sections/contact-section.js';
import { createMiniDock } from '../components/player/mini-dock.js';
import { createMasterModal } from '../components/player/master-modal.js';
import { createCatalogueModal } from '../components/modals/catalogue-modal.js';
import { createArtistsModal } from '../components/modals/artists-modal.js';

import { audio } from '../services/audio-service.js';
import { sync } from '../services/realtime-sync.js';
import { spotify } from '../services/spotify-service.js';
import { router } from './router.js';
import { BackgroundAtmosphere, SpectrumVisualizer } from '../utils/visualizer.js';

export class TunoraApp {
  constructor() {
    this.atmosphere = null;
    this.dockSpectrum = null;
    this.modalSpectrum = null;
    this.deferredPrompt = null;
    this.toastTimeout = null;
    this.pendingInviteRoomId = null;
  }

  // PURPOSE: Programmatically builds and mounts the complete application DOM tree into #app.
  // INTEGRATION: Replaces static HTML markup entirely with programmatic element trees.
  // OUTPUT: Fully rendered and interactive DOM tree attached to the root container.
  mount() {
    const root = document.getElementById('app') || document.body;
    root.replaceChildren(); // Safely clear any existing nodes

    // 1. Dynamic Background Canvas & Ambient Noise Texture
    const bgCanvas = createElement('canvas', { id: 'bg-canvas' });
    const noiseOverlay = createElement('div', {
      className: 'noise-overlay',
      attrs: { 'aria-hidden': 'true' }
    });

    // 2. Hidden YouTube Player Container (must have non-zero dimensions to avoid browser autoplay throttling)
    const ytHost = createElement('div', { id: 'yt-host' });

    // 3. Top Listen Together Invite Banner
    const inviteBanner = createInviteBanner({
      onJoin: async () => {
        if (!this.pendingInviteRoomId) return;
        const banner = document.getElementById('invite-banner');
        if (banner) banner.hidden = true;
        try {
          audio.ensureAudioContext();
          await sync.joinRoom(this.pendingInviteRoomId);
          this.openModal('modal-player');
        } catch (e) {
          this.showToast('Could not join room. Check connection.');
        }
      },
      onDismiss: () => {
        const banner = document.getElementById('invite-banner');
        if (banner) banner.hidden = true;
      }
    });

    // 4. Header Bar
    const header = createHeader({
      onNavigate: (sectionId) => router.scrollToSection(sectionId),
      onInstall: () => this.triggerAppInstall(),
      onOpenPlayer: () => this.openModal('modal-player')
    });

    // 5. Rails (Slide Tracker & Social Links)
    const leftRail = createLeftRail();
    const rightRail = createRightRail();

    // 6. Main Viewport Scroll Snap Container & Sections
    const heroSection = createHeroSection({
      onExploreRecords: () => router.scrollToSection('records'),
      onOpenPlayer: () => this.openModal('modal-player'),
      onPlaySpotlight: () => {
        audio.ensureAudioContext();
        sync.selectRecord('awarapan-2', 0);
        this.showToast('Playing Toh Phir Aao from Awarapan 2');
      },
      onTogglePlay: () => {
        audio.ensureAudioContext();
        sync.togglePlay();
      },
      onNext: () => sync.next(),
      onPrev: () => sync.prev(),
      onSeek: (pct) => {
        const dur = audio.currentTrack?.durationSeconds || 240;
        sync.seek(pct * dur);
      },
      onSelectTrack: (albumId, trackIndex) => {
        audio.ensureAudioContext();
        sync.selectRecord(albumId, trackIndex);
        this.showToast('Playing selected master track...');
      },
      onStartRoom: async () => {
        audio.ensureAudioContext();
        try {
          await sync.createRoom();
          this.openModal('modal-player');
          this.showToast(`🎉 Room ${sync.roomId} created! Link ready.`);
        } catch (e) {
          this.openModal('modal-player');
        }
      }
    });

    const recordsSection = createRecordsSection({
      onPlayAlbum: (albumId) => {
        sync.selectRecord(albumId, 0);
        this.showToast(`Loaded ${albumId.toUpperCase()} master disc`);
      },
      onOpenDiscography: () => this.openModal('modal-records'),
      onPlayAwarapan: () => {
        sync.selectRecord('awarapan-2', 0);
        this.showToast('Playing Toh Phir Aao from Awarapan 2');
      },
      onToggleEmbed: () => {
        const embedContainer = document.getElementById('spotify-embed-container');
        const toggleBtn = document.getElementById('btn-toggle-spotify-embed');
        if (embedContainer) {
          const isHidden = embedContainer.hidden;
          embedContainer.hidden = !isHidden;
          if (toggleBtn) toggleBtn.classList.toggle('active', !isHidden);
          this.showToast(isHidden ? 'Spotify Web Player expanded' : 'Spotify Web Player collapsed');
        }
      },
      onSpotifyLogin: () => {
        if (spotify.accessToken) {
          if (window.confirm('Disconnect Spotify account?')) {
            spotify.logout();
            this.showToast('Spotify disconnected');
          }
        } else {
          this.showToast('Redirecting to Spotify authorization...');
          spotify.login();
        }
      }
    });

    const artistsSection = createArtistsSection({
      onOpenArtists: () => this.openModal('modal-artists')
    });

    const contactSection = createContactSection({
      onSubmit: (email) => {
        if (!email || !email.includes('@')) {
          this.showToast('Please enter a valid email address.');
          return;
        }
        this.showToast('Request received! The studio mastering team will reach out.');
        const emailInput = document.getElementById('contact-email-input');
        if (emailInput) emailInput.value = '';
      }
    });

    const snapContainer = createElement('main', {
      id: 'snap-container',
      className: 'snap-container',
      children: [heroSection, recordsSection, artistsSection, contactSection]
    });

    // 7. Mini Player Dock
    const miniDock = createMiniDock({
      onTogglePlay: () => sync.togglePlay(),
      onNext: () => sync.next(),
      onPrev: () => sync.prev(),
      onExpand: () => this.openModal('modal-player'),
      onVolumeChange: (val) => audio.setVolume(val / 100),
      onToggleMute: () => audio.toggleMute()
    });

    // 8. Modals
    const masterModal = createMasterModal({
      onClose: () => this.closeModal('modal-player'),
      onTogglePlay: () => sync.togglePlay(),
      onNext: () => sync.next(),
      onPrev: () => sync.prev(),
      onSeek: (pct) => {
        const dur = audio.currentTrack.durationSeconds || 240;
        sync.seek(pct * dur);
      },
      onVolumeChange: (val) => audio.setVolume(val / 100),
      onToggleMute: () => audio.toggleMute(),
      onSelectPlaylist: (plId) => {
        document.querySelectorAll('[data-play-playlist]').forEach((b) => {
          b.classList.toggle('active', b.dataset.playPlaylist === plId);
        });
        sync.selectPlaylist(plId);
        this.showToast(`Playing playlist: ${plId.replace(/-/g, ' ').toUpperCase()}`);
      },
      onInviteFriends: async () => {
        if (sync.role === 'solo') {
          const copyBtn = document.getElementById('copy-room-link-btn');
          if (copyBtn) {
            copyBtn.disabled = true;
            copyBtn.textContent = 'Creating Room...';
          }
          try {
            audio.ensureAudioContext();
            const shareUrl = await sync.createRoom();
            const linkInput = document.getElementById('room-link-input');
            if (linkInput) linkInput.value = shareUrl;
            try {
              await navigator.clipboard.writeText(shareUrl);
              this.showToast(`🎉 Room ${sync.roomId} created! Link copied.`);
            } catch (e) {
              this.showToast(`🎉 Room ${sync.roomId} created! Share the link below.`);
            }
          } catch (err) {
            this.showToast('Could not create room. Check connection.');
          } finally {
            if (copyBtn) copyBtn.disabled = false;
          }
        } else {
          const shareUrl = sync.getShareUrl();
          if (shareUrl) {
            try {
              await navigator.clipboard.writeText(shareUrl);
              this.showToast('🎧 Room link copied to clipboard!');
            } catch (e) {
              this.showToast(`Room link: ${shareUrl}`);
            }
          }
        }
      },
      onCopyLink: async () => {
        const linkInput = document.getElementById('room-link-input');
        const val = linkInput?.value || sync.getShareUrl();
        if (val) {
          try {
            await navigator.clipboard.writeText(val);
            const directCopy = document.getElementById('copy-room-link-direct');
            if (directCopy) {
              directCopy.textContent = 'Copied!';
              setTimeout(() => { directCopy.textContent = 'Copy'; }, 2000);
            }
            this.showToast('🎧 Room link copied to clipboard!');
          } catch (e) {
            if (linkInput) linkInput.select();
            this.showToast('Press Ctrl+C to copy room link.');
          }
        }
      },
      onJoinCode: async (code) => {
        if (!code || !code.trim()) {
          this.showToast('Please enter a room code (e.g. MEL-8K9X)');
          return;
        }
        try {
          audio.ensureAudioContext();
          await sync.joinRoom(code.trim());
          const codeInput = document.getElementById('join-code-input');
          if (codeInput) codeInput.value = '';
        } catch (e) {
          this.showToast('Could not join room.');
        }
      },
      onShareWhatsapp: () => {
        const text = sync.getShareText();
        window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
      },
      onShareTelegram: () => {
        const url = sync.getShareUrl();
        const text = '🎧 Join my Tunora synchronized music room!';
        window.open(`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`, '_blank');
      },
      onShareNative: async () => {
        const url = sync.getShareUrl();
        const text = sync.getShareText();
        if (navigator.share) {
          try {
            await navigator.share({ title: 'Tunora Studio Session', text, url });
          } catch (e) {}
        } else {
          try {
            await navigator.clipboard.writeText(url);
            this.showToast('Room link copied!');
          } catch (e) {}
        }
      },
      onLeaveRoom: () => sync.leaveRoom()
    });

    const catalogueModal = createCatalogueModal({
      onClose: () => this.closeModal('modal-records'),
      onSelectRecord: (recordId) => {
        sync.selectRecord(recordId, 0);
        this.showToast(`Loaded ${recordId.toUpperCase()} master disc`);
        this.closeModal('modal-records');
      }
    });

    const artistsModal = createArtistsModal({
      onClose: () => this.closeModal('modal-artists')
    });

    // 9. Mobile Bottom Navigation
    const mobileNav = createMobileNav({
      onNavigate: (secId) => router.scrollToSection(secId),
      onOpenPlayer: () => this.openModal('modal-player')
    });

    // 10. Global Toast Container
    const toast = createToast();

    // Append all top-level programmatic components
    root.append(
      bgCanvas,
      noiseOverlay,
      ytHost,
      inviteBanner,
      header,
      leftRail,
      rightRail,
      snapContainer,
      miniDock,
      masterModal,
      catalogueModal,
      artistsModal,
      mobileNav,
      toast
    );
  }

  // PURPOSE: Bootstraps services, observers, listeners, and visualizers after DOM mounting.
  init() {
    // 1. Mount the programmatic DOM elements into #app
    this.mount();

    // 2. Initialize Visualizers & Audio
    this.atmosphere = new BackgroundAtmosphere('bg-canvas');
    this.dockSpectrum = new SpectrumVisualizer('dock-spectrum');
    this.modalSpectrum = new SpectrumVisualizer('modal-spectrum');

    audio.init();
    sync.init();
    spotify.init();

    // 3. Bind Reactive Subscriptions
    audio.subscribe((state) => this.renderPlaybackState(state));
    sync.subscribe((syncState) => this.renderSyncState(syncState));

    // 4. Section Observer & Routing
    router.initSectionObserver();
    this.setupNavigationPresentation();

    // 5. 3D Card Tilt Physics
    this.setup3DTilt();

    // 6. App Listeners
    this.setupAppListeners();
    this.setupKeyboardControls();
    this.setupPWA();
  }

  // PURPOSE: Synchronizes audio playback properties to the UI components.
  // INPUT: state (audio state snapshot).
  renderPlaybackState(state) {
    const { isPlaying, track, progress, volume } = state;
    if (!track) return;

    // Mini Dock Elements
    const dockTitle = document.getElementById('dock-title');
    const dockArtist = document.getElementById('dock-artist');
    const dockCover = document.getElementById('dock-cover');
    const dockVinyl = document.getElementById('dock-vinyl');
    const dockPlayIco = document.getElementById('dock-play-icon');
    const dockPauseIco = document.getElementById('dock-pause-icon');

    if (dockTitle) dockTitle.textContent = track.title || 'Studio Playback';
    if (dockArtist) dockArtist.textContent = track.artist || 'Beat Records';
    if (dockCover) dockCover.src = artworkUrl(track.cover || './assets/images/album_love.jpg');
    if (dockVinyl) dockVinyl.classList.toggle('spinning', isPlaying);

    // Hero Turntable Element
    const heroVinyl = document.getElementById('hero-vinyl-disc');
    if (heroVinyl) heroVinyl.classList.toggle('spinning', isPlaying);

    if (dockPlayIco && dockPauseIco) {
      dockPlayIco.style.display = isPlaying ? 'none' : 'block';
      dockPauseIco.style.display = isPlaying ? 'block' : 'none';
    }

    // Spotify Hero Music Card Elements
    const heroTitle = document.getElementById('hero-player-title');
    const heroArtist = document.getElementById('hero-player-artist');
    const heroPlayIco = document.getElementById('hero-play-icon');
    const heroPauseIco = document.getElementById('hero-pause-icon');
    const heroProgressFill = document.getElementById('hero-progress-fill');
    const heroScrubberDot = document.getElementById('hero-scrubber-dot');
    const heroTimeCur = document.getElementById('hero-time-cur');
    const heroTimeDur = document.getElementById('hero-time-dur');

    if (heroTitle && track.title) {
      heroTitle.textContent = track.title;
    }
    if (heroArtist && track.artist) {
      heroArtist.textContent = track.artist;
    }
    if (heroPlayIco && heroPauseIco) {
      heroPlayIco.style.display = isPlaying ? 'none' : 'block';
      heroPauseIco.style.display = isPlaying ? 'block' : 'none';
    }
    if (heroProgressFill) {
      heroProgressFill.style.width = `${progress}%`;
    }
    if (heroScrubberDot) {
      heroScrubberDot.style.left = `${progress}%`;
    }
    if (heroTimeCur) {
      heroTimeCur.textContent = audio.formatTime(track.currentTimeSeconds);
    }
    if (heroTimeDur) {
      heroTimeDur.textContent = track.duration || '03:38';
    }
    const heroCover = document.getElementById('hero-track-cover');
    const heroAlbum = document.getElementById('hero-track-album');
    if (heroCover) { heroCover.src = artworkUrl(track.cover); heroCover.alt = `${track.album || track.title} artwork`; }
    if (heroAlbum) heroAlbum.textContent = track.album || '';
    ['hero-progress-bar', 'modal-progress-bar'].forEach((id) => {
      const slider = document.getElementById(id);
      if (slider) {
        slider.setAttribute('aria-valuenow', String(Math.round(progress || 0)));
        slider.setAttribute('aria-valuetext', `${audio.formatTime(track.currentTimeSeconds)} of ${track.duration || '0:00'}`);
      }
    });
    ['hero-play-pause-btn', 'modal-play-btn', 'dock-play-btn'].forEach((id) => {
      const button = document.getElementById(id);
      if (button) button.setAttribute('aria-label', isPlaying ? 'Pause' : 'Play');
    });

    // Highlight active track in the Spotify queue
    const queueRows = document.querySelectorAll('.spotify-queue-row');
    queueRows.forEach((r) => {
      const isCurrent = r.dataset.playQueueAlbum === track.recordId &&
                        r.dataset.playQueueIndex === String(track.trackIdx);
      r.classList.toggle('active', isCurrent);
      if (isCurrent) r.setAttribute('aria-current', 'true');
      else r.removeAttribute('aria-current');
    });

    // Modal Player Elements
    const modalTitle = document.getElementById('modal-track-title');
    const modalArtist = document.getElementById('modal-track-artist');
    const modalAlbum = document.getElementById('modal-track-album');
    const modalCover = document.getElementById('modal-track-cover');
    const modalVinyl = document.getElementById('modal-big-vinyl');
    const modalPlayIco = document.getElementById('modal-play-icon');
    const modalPauseIco = document.getElementById('modal-pause-icon');
    const modalProgressFill = document.getElementById('modal-progress-fill');
    const modalProgressDot = document.getElementById('modal-scrubber-dot');
    const modalTimeCur = document.getElementById('modal-time-cur');
    const modalTimeDur = document.getElementById('modal-time-dur');

    if (modalTitle) modalTitle.textContent = track.title;
    if (modalArtist) modalArtist.textContent = track.artist;
    if (modalAlbum) modalAlbum.textContent = track.album;
    if (modalCover) modalCover.src = artworkUrl(track.cover);
    if (modalVinyl) modalVinyl.classList.toggle('playing', isPlaying);

    if (modalPlayIco && modalPauseIco) {
      modalPlayIco.style.display = isPlaying ? 'none' : 'block';
      modalPauseIco.style.display = isPlaying ? 'block' : 'none';
    }

    if (modalProgressFill) modalProgressFill.style.width = `${progress}%`;
    if (modalProgressDot) modalProgressDot.style.left = `${progress}%`;
    if (modalTimeCur) modalTimeCur.textContent = audio.formatTime(track.currentTimeSeconds);
    if (modalTimeDur) modalTimeDur.textContent = track.duration || '3:45';

    // Volume Sliders & Readouts
    const currentVol = typeof volume === 'number' ? volume : 0.85;
    const volPct = Math.round(currentVol * 100);
    const isMuted = volPct === 0;

    const dockVolSlider = document.getElementById('dock-volume-slider');
    const dockVolIconHigh = document.getElementById('dock-vol-icon-high');
    const dockVolIconMuted = document.getElementById('dock-vol-icon-muted');

    const modalVolSlider = document.getElementById('modal-volume-slider');
    const modalVolVal = document.getElementById('modal-volume-val');
    const modalVolIconHigh = document.getElementById('modal-vol-icon-high');
    const modalVolIconMuted = document.getElementById('modal-vol-icon-muted');

    const sliderGradient = (pct) => `linear-gradient(90deg, var(--color-sage) 0%, var(--color-leaf) ${pct}%, var(--glass-border) ${pct}%, var(--glass-border) 100%)`;
    ['dock-volume-btn', 'modal-volume-mute-btn'].forEach((id) => {
      const button = document.getElementById(id);
      if (button) button.setAttribute('aria-label', isMuted ? 'Unmute personal volume' : 'Mute personal volume');
    });

    if (dockVolSlider && document.activeElement !== dockVolSlider) {
      dockVolSlider.value = volPct;
      dockVolSlider.style.background = sliderGradient(volPct);
    }
    if (dockVolIconHigh && dockVolIconMuted) {
      dockVolIconHigh.style.display = isMuted ? 'none' : 'block';
      dockVolIconMuted.style.display = isMuted ? 'block' : 'none';
    }

    if (modalVolSlider && document.activeElement !== modalVolSlider) {
      modalVolSlider.value = volPct;
      modalVolSlider.style.background = sliderGradient(volPct);
    }
    if (modalVolVal) {
      modalVolVal.textContent = isMuted ? '0% (Muted)' : `${volPct}%`;
    }
    if (modalVolIconHigh && modalVolIconMuted) {
      modalVolIconHigh.style.display = isMuted ? 'none' : 'block';
      modalVolIconMuted.style.display = isMuted ? 'block' : 'none';
    }
  }

  // PURPOSE: Synchronizes real-time room and presence state to the room hub UI.
  // INPUT: syncState (room synchronization state snapshot).
  renderSyncState(syncState) {
    const dot = document.getElementById('room-status-dot');
    const title = document.getElementById('room-status-title');
    const desc = document.getElementById('room-status-desc');
    const badgePill = document.getElementById('room-badge-pill');
    const leaveBtn = document.getElementById('leave-room-btn');
    const copyLinkBtn = document.getElementById('copy-room-link-btn');
    const roomLinkWrap = document.getElementById('room-link-wrap');
    const roomLinkInput = document.getElementById('room-link-input');
    const joinCodeWrap = document.getElementById('join-code-wrap');
    const socialShareRow = document.getElementById('room-social-share-row');

    const inRoom = syncState.role === 'room';
    if (dot) dot.classList.toggle('active', inRoom);

    if (badgePill) {
      if (inRoom && syncState.shortCode) {
        badgePill.hidden = false;
        badgePill.textContent = syncState.shortCode;
      } else {
        badgePill.hidden = true;
      }
    }

    if (title) {
      if (inRoom) {
        title.textContent = `Live Room: ${syncState.roomId} · ${syncState.listenersCount} listening`;
      } else {
        title.textContent = 'Synchronized Music Room';
      }
    }

    if (desc) {
      if (inRoom) {
        desc.textContent = 'All members share real-time control. Play, pause, seek, and track switches are synchronized globally.';
      } else {
        desc.textContent = 'Create or join a synchronized music room to listen in lockstep with friends worldwide.';
      }
    }
    // Connection feedback reflects existing state; transport/retry behavior stays in the service.
    if (title && syncState.connecting) title.textContent = `Connecting to room ${syncState.roomId || ''}…`;
    if (desc && syncState.connecting) desc.textContent = 'Establishing your listening session. This may take a moment.';
    if (inRoom && !syncState.connected && !syncState.connecting) {
      if (title) title.textContent = 'Room connection unavailable';
      if (desc) desc.textContent = 'Check your connection. You can leave this room and join again using its code.';
    }
    if (dot) dot.classList.toggle('active', inRoom && !!syncState.connected);
    if (title) title.setAttribute('aria-live', 'polite');

    if (copyLinkBtn) {
      copyLinkBtn.textContent = inRoom ? 'Invite Friends' : 'Create Room';
    }

    if (leaveBtn) {
      leaveBtn.hidden = !inRoom;
    }

    if (roomLinkWrap) {
      roomLinkWrap.hidden = !inRoom;
    }

    if (roomLinkInput && inRoom) {
      roomLinkInput.value = syncState.shareUrl || '';
    }

    if (joinCodeWrap) {
      joinCodeWrap.hidden = inRoom;
    }

    if (socialShareRow) {
      socialShareRow.hidden = !inRoom;
    }
  }

  // PURPOSE: Adds perspective 3D mouse tilt tracking to album and artist cards.
  setup3DTilt() {
    const tiltCards = document.querySelectorAll('.tilt-card');
    tiltCards.forEach((card) => {
      card.addEventListener('mousemove', (e) => {
        if (window.matchMedia('(prefers-reduced-motion: reduce), (pointer: coarse)').matches) return;
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        const rotateX = ((y - centerY) / centerY) * -12;
        const rotateY = ((x - centerX) / centerX) * 12;

        card.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.06) translateZ(30px)`;
      });

      card.addEventListener('mouseleave', () => {
        card.style.transform = '';
      });
    });
  }

  // PURPOSE: Sets up app-level custom event dispatchers.
  setupAppListeners() {
    window.addEventListener('app:toast', (e) => {
      if (e.detail) this.showToast(e.detail);
    });

    window.addEventListener('sync:invite', (e) => {
      this.pendingInviteRoomId = e.detail?.roomId;
      const inviteBanner = document.getElementById('invite-banner');
      const title = document.getElementById('invite-banner-title');
      if (inviteBanner && this.pendingInviteRoomId) {
        if (title) title.textContent = `You've been invited to Room ${this.pendingInviteRoomId}!`;
        inviteBanner.hidden = false;
      }
    });

    window.addEventListener('spotify:connected', (e) => {
      const user = e.detail;
      const spotifyLoginBtn = document.getElementById('btn-spotify-login');
      const spotifyLoginLabel = document.getElementById('spotify-login-label');
      if (spotifyLoginBtn && spotifyLoginLabel) {
        spotifyLoginBtn.classList.add('connected');
        spotifyLoginLabel.textContent = user?.display_name ? `✓ ${user.display_name.split(' ')[0]}` : '✓ Connected';
        spotifyLoginBtn.title = `Connected as ${user?.display_name || 'Spotify User'}. Click to disconnect.`;
      }
      this.showToast(`Connected to Spotify: ${user?.display_name || 'Active'}`);
    });

    window.addEventListener('spotify:disconnected', () => {
      const spotifyLoginBtn = document.getElementById('btn-spotify-login');
      const spotifyLoginLabel = document.getElementById('spotify-login-label');
      if (spotifyLoginBtn && spotifyLoginLabel) {
        spotifyLoginBtn.classList.remove('connected');
        spotifyLoginLabel.textContent = 'Connect Spotify';
        spotifyLoginBtn.title = 'Connect your Spotify Account';
      }
    });
  }

  // PURPOSE: Opens a glassmorphic modal dialogue.
  // INPUT: modalId (string).
  openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      this.modalReturnFocus = document.activeElement;
      modal.classList.add('active');
      document.body.classList.add('has-open-modal');
      document.querySelectorAll('#app > :not(.glass-modal-backdrop):not(.app-toast)').forEach((el) => { el.inert = true; });
      requestAnimationFrame(() => {
        if (modal.classList.contains('active')) modal.querySelector('button, input, [tabindex="0"]')?.focus({ preventScroll: true });
      });
      if (modalId === 'modal-player' && this.modalSpectrum) {
        this.modalSpectrum.resize();
      }
    }
  }

  // PURPOSE: Closes a glassmorphic modal dialogue.
  // INPUT: modalId (string).
  closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.remove('active');
      document.body.classList.remove('has-open-modal');
      document.querySelectorAll('#app > [inert]').forEach((el) => { el.inert = false; });
      this.modalReturnFocus?.focus({ preventScroll: true });
    }
  }

  // Presentation only: reflect the section visible in the viewport without changing routing.
  setupNavigationPresentation() {
    const sections = [...document.querySelectorAll('.screen-section')];
    let scheduled = false;
    const reflectVisibleSection = () => {
      const readingLine = Math.min(window.innerHeight * 0.3, 240);
      const current = sections.find((section) => {
        const rect = section.getBoundingClientRect();
        return rect.top <= readingLine && rect.bottom > readingLine;
      }) || sections[0];
      document.querySelectorAll('.nav-item, .mobile-nav-item[data-section]').forEach((item) => {
        const active = item.dataset.section === current?.id;
        item.classList.toggle('active', active);
        const link = item.matches('a') ? item : item.querySelector('a');
        if (link) {
          if (active) link.setAttribute('aria-current', 'page');
          else link.removeAttribute('aria-current');
        }
      });
      scheduled = false;
    };
    window.addEventListener('scroll', () => {
      if (!scheduled) { scheduled = true; requestAnimationFrame(reflectVisibleSection); }
    }, { passive: true });
    if ('IntersectionObserver' in window) {
      this.navigationPresentationObserver = new IntersectionObserver(reflectVisibleSection, { threshold: [0, 0.1, 0.5, 1] });
      sections.forEach((section) => this.navigationPresentationObserver.observe(section));
    }
    requestAnimationFrame(reflectVisibleSection);
  }

  // PURPOSE: Displays a non-intrusive notification toast.
  // INPUT: message (string).
  showToast(message) {
    const toast = document.getElementById('app-toast');
    if (!toast) return;

    toast.textContent = message;
    toast.classList.add('show');

    if (this.toastTimeout) clearTimeout(this.toastTimeout);
    this.toastTimeout = setTimeout(() => {
      toast.classList.remove('show');
    }, 3800);
  }

  // PURPOSE: Registers service worker and captures PWA install prompts.
  setupPWA() {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js').catch((err) => {
          console.log('SW registration note:', err);
        });
      });
    }

    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferredPrompt = e;
      const installBtns = document.querySelectorAll('.btn-app-install');
      installBtns.forEach((btn) => {
        btn.style.display = 'inline-flex';
      });
    });
  }

  // PURPOSE: Triggers native PWA install prompt.
  triggerAppInstall() {
    if (this.deferredPrompt) {
      this.deferredPrompt.prompt();
      this.deferredPrompt.userChoice.then((choice) => {
        if (choice.outcome === 'accepted') {
          this.showToast('Tunora Studio App Installed!');
        }
        this.deferredPrompt = null;
      });
    } else {
      this.showToast('App Ready! Tap Share/Options in browser and select "Add to Home Screen".');
    }
  }

  // PURPOSE: Binds global keyboard shortcuts (Space for toggle, Escape for modals).
  setupKeyboardControls() {
    window.addEventListener('keydown', (e) => {
      if (e.code === 'Space' && !e.target.closest('button, a, input, textarea, select, [role="slider"], [contenteditable="true"]')) {
        e.preventDefault();
        sync.togglePlay();
      }
      if (e.code === 'Escape') {
        document.querySelectorAll('.glass-modal-backdrop.active').forEach((m) => this.closeModal(m.id));
      }
      if (e.key === 'Tab') {
        const modal = document.querySelector('.glass-modal-backdrop.active');
        if (!modal) return;
        const focusable = [...modal.querySelectorAll('button:not(:disabled), a[href], input, select, textarea, [tabindex="0"]')].filter((el) => el.getClientRects().length && !el.closest('[hidden]'));
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last?.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus(); }
      }
    });
  }
}

export const MelodiaApp = TunoraApp;
export const app = new TunoraApp();
