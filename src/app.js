// Application Orchestrator: UI, Router, 3D Tilt, Modals, Spotify & Listen Together P2P
import { audio } from './audio.js';
import { BackgroundAtmosphere, SpectrumVisualizer } from './visualizer.js';
import { RECORDS, ARTISTS, STUDIO_INFO, PLAYLISTS } from './data.js';
import { spotify } from './spotify.js';
import { sync } from './sync.js';

class MelodiaApp {
  constructor() {
    this.currentSection = 'hero';
    this.atmosphere = null;
    this.dockSpectrum = null;
    this.modalSpectrum = null;
    this.deferredPrompt = null;
    this.toastTimeout = null;
  }

  init() {
    // 1. Initialize Visualizers, Audio & P2P Sync
    this.atmosphere = new BackgroundAtmosphere('bg-canvas');
    this.dockSpectrum = new SpectrumVisualizer('dock-spectrum');
    this.modalSpectrum = new SpectrumVisualizer('modal-spectrum');
    audio.init();
    sync.init();

    // 2. Setup Subscriptions & State Sync
    audio.subscribe((state) => this.renderPlaybackState(state));
    sync.subscribe((syncState) => this.renderSyncState(syncState));

    // 3. UI Interactions
    this.setupSectionObserver();
    this.setup3DTilt();
    this.setupModals();
    this.setupMiniPlayer();
    this.setupListenTogether();
    this.setupContactForm();
    this.setupPWA();
    this.setupKeyboardControls();

    // 4. Render Dynamic Catalogues
    this.renderRecordsCatalogue();
    this.renderArtistsCatalogue();
  }

  /* ------------------------------------------------ Section Navigation & Indicator */
  setupSectionObserver() {
    const container = document.getElementById('snap-container');
    const sections = document.querySelectorAll('.screen-section');
    const indicatorText = document.getElementById('indicator-num');
    const indicatorFill = document.getElementById('indicator-fill');
    const navItems = document.querySelectorAll('.nav-item');
    const mobileItems = document.querySelectorAll('.mobile-nav-item');

    const sectionMap = ['hero', 'records', 'artists', 'contact'];

    const updateIndicator = (index) => {
      const num = index + 1;
      if (indicatorText) {
        indicatorText.innerHTML = `— <span>0${num}</span> / 04 —`;
      }
      if (indicatorFill) {
        indicatorFill.style.height = `${num * 25}%`;
      }

      const activeId = sectionMap[index];
      this.currentSection = activeId;

      // Update Top Nav
      navItems.forEach((item) => {
        const target = item.dataset.section;
        item.classList.toggle('active', target === activeId);
      });

      // Update Mobile Nav
      mobileItems.forEach((item) => {
        const target = item.dataset.section;
        item.classList.toggle('active', target === activeId);
      });
    };

    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const idx = Array.from(sections).indexOf(entry.target);
              if (idx !== -1) updateIndicator(idx);
            }
          });
        },
        { root: container, threshold: 0.55 }
      );

      sections.forEach((s) => observer.observe(s));
    }

    // Nav Click Handlers
    document.querySelectorAll('[data-goto]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const targetId = btn.getAttribute('data-goto');
        const targetEl = document.getElementById(targetId);
        if (targetEl) {
          targetEl.scrollIntoView({ behavior: 'smooth' });
        }
      });
    });
  }

  /* ------------------------------------------------ 3D Tilt Effect on Cards */
  setup3DTilt() {
    const tiltCards = document.querySelectorAll('.tilt-card');
    tiltCards.forEach((card) => {
      card.addEventListener('mousemove', (e) => {
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

  /* ------------------------------------------------ Playback State Sync */
  renderPlaybackState(state) {
    const { isPlaying, track, progress } = state;

    // Mini Player elements
    const dockTitle = document.getElementById('dock-title');
    const dockArtist = document.getElementById('dock-artist');
    const dockCover = document.getElementById('dock-cover');
    const dockVinyl = document.getElementById('dock-vinyl');
    const dockPlayIco = document.getElementById('dock-play-icon');
    const dockPauseIco = document.getElementById('dock-pause-icon');

    if (dockTitle) dockTitle.textContent = track.title || 'Studio Playback';
    if (dockArtist) dockArtist.textContent = track.artist || 'Melodia Records';
    if (dockCover) dockCover.src = track.cover || './assets/images/album_love.jpg';
    if (dockVinyl) dockVinyl.classList.toggle('spinning', isPlaying);

    if (dockPlayIco && dockPauseIco) {
      dockPlayIco.style.display = isPlaying ? 'none' : 'block';
      dockPauseIco.style.display = isPlaying ? 'block' : 'none';
    }

    // Modal Player elements
    const modalTitle = document.getElementById('modal-track-title');
    const modalArtist = document.getElementById('modal-track-artist');
    const modalAlbum = document.getElementById('modal-track-album');
    const modalCover = document.getElementById('modal-track-cover');
    const modalVinyl = document.getElementById('modal-big-vinyl');
    const modalPlayIco = document.getElementById('modal-play-icon');
    const modalPauseIco = document.getElementById('modal-pause-icon');
    const modalProgressFill = document.getElementById('modal-progress-fill');
    const modalTimeCur = document.getElementById('modal-time-cur');
    const modalTimeDur = document.getElementById('modal-time-dur');

    if (modalTitle) modalTitle.textContent = track.title;
    if (modalArtist) modalArtist.textContent = track.artist;
    if (modalAlbum) modalAlbum.textContent = track.album;
    if (modalCover) modalCover.src = track.cover;
    if (modalVinyl) modalVinyl.classList.toggle('playing', isPlaying);

    if (modalPlayIco && modalPauseIco) {
      modalPlayIco.style.display = isPlaying ? 'none' : 'block';
      modalPauseIco.style.display = isPlaying ? 'block' : 'none';
    }

    if (modalProgressFill) modalProgressFill.style.width = `${progress}%`;
    if (modalTimeCur) modalTimeCur.textContent = audio.formatTime(track.currentTimeSeconds);
    if (modalTimeDur) modalTimeDur.textContent = track.duration || '3:45';
  }

  /* ------------------------------------------------ Mini Player Controls */
  setupMiniPlayer() {
    const playBtn = document.getElementById('dock-play-btn');
    const nextBtn = document.getElementById('dock-next-btn');
    const prevBtn = document.getElementById('dock-prev-btn');
    const expandBtn = document.getElementById('dock-expand-btn');

    const handleToggle = () => {
      if (sync.role === 'guest') {
        sync.sendGuestCommand('toggle');
      } else {
        audio.toggle();
      }
    };

    const handleNext = () => {
      if (sync.role === 'guest') {
        sync.sendGuestCommand('next');
      } else {
        audio.next();
      }
    };

    const handlePrev = () => {
      if (sync.role === 'guest') {
        sync.sendGuestCommand('prev');
      } else {
        audio.prev();
      }
    };

    if (playBtn) playBtn.addEventListener('click', handleToggle);
    if (nextBtn) nextBtn.addEventListener('click', handleNext);
    if (prevBtn) prevBtn.addEventListener('click', handlePrev);
    if (expandBtn) expandBtn.addEventListener('click', () => this.openModal('modal-player'));

    // Album cover clicks directly on the screen
    document.querySelectorAll('[data-play-album]').forEach((el) => {
      el.addEventListener('click', () => {
        const albumId = el.getAttribute('data-play-album');
        if (sync.role === 'guest') {
          sync.sendGuestCommand('select-record', { recordId: albumId, trackIdx: 0 });
        }
        audio.playRecord(albumId, 0);
        if (albumId === 'awarapan-2') {
          this.showToast('Playing Toh Phir Aao from Awarapan 2 (Spotify Master)');
        } else {
          this.showToast(`Playing ${albumId.toUpperCase()} from Beat Records Master Tape`);
        }
      });
    });

    // Toggle Spotify Embed Player Drawer
    const toggleEmbedBtn = document.getElementById('btn-toggle-spotify-embed');
    const embedContainer = document.getElementById('spotify-embed-container');
    if (toggleEmbedBtn && embedContainer) {
      toggleEmbedBtn.addEventListener('click', () => {
        const isHidden = embedContainer.hidden;
        embedContainer.hidden = !isHidden;
        toggleEmbedBtn.classList.toggle('active', !isHidden);
        this.showToast(isHidden ? 'Spotify Web Player expanded' : 'Spotify Web Player collapsed');
      });
    }

    // Spotify Connect / OAuth Login
    const spotifyLoginBtn = document.getElementById('btn-spotify-login');
    const spotifyLoginLabel = document.getElementById('spotify-login-label');

    const updateSpotifyUI = (user) => {
      if (!spotifyLoginBtn || !spotifyLoginLabel) return;
      if (spotify.accessToken) {
        spotifyLoginBtn.classList.add('connected');
        spotifyLoginLabel.textContent = user?.display_name ? `✓ ${user.display_name.split(' ')[0]}` : '✓ Connected';
        spotifyLoginBtn.title = `Connected as ${user?.display_name || 'Spotify User'}. Click to disconnect.`;
      } else {
        spotifyLoginBtn.classList.remove('connected');
        spotifyLoginLabel.textContent = 'Connect Spotify';
        spotifyLoginBtn.title = 'Connect your Spotify Account';
      }
    };

    if (spotifyLoginBtn) {
      updateSpotifyUI(spotify.user);

      spotifyLoginBtn.addEventListener('click', () => {
        if (spotify.accessToken) {
          if (confirm('Disconnect Spotify account?')) {
            spotify.logout();
            updateSpotifyUI(null);
            this.showToast('Spotify disconnected');
          }
        } else {
          this.showToast('Redirecting to Spotify authorization...');
          spotify.login();
        }
      });

      window.addEventListener('spotify:connected', (e) => {
        updateSpotifyUI(e.detail);
        this.showToast(`Connected to Spotify: ${e.detail?.display_name || 'Active'}`);
      });

      window.addEventListener('spotify:disconnected', () => {
        updateSpotifyUI(null);
      });
    }

    // Playlist quick switch buttons in Studio Player Modal
    document.querySelectorAll('[data-play-playlist]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const plId = btn.getAttribute('data-play-playlist');
        document.querySelectorAll('[data-play-playlist]').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        if (sync.role === 'guest') {
          sync.sendGuestCommand('select-playlist', { playlistId: plId });
        }
        audio.playPlaylist(plId);
        this.showToast(`Playing playlist: ${btn.textContent.trim()}`);
      });
    });
  }

  /* ------------------------------------------------ Modals Management */
  setupModals() {
    document.querySelectorAll('[data-modal-open]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const modalId = btn.getAttribute('data-modal-open');
        this.openModal(modalId);
      });
    });

    document.querySelectorAll('[data-modal-close]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const backdrop = btn.closest('.glass-modal-backdrop');
        if (backdrop) backdrop.classList.remove('active');
      });
    });

    // Close on click outside
    document.querySelectorAll('.glass-modal-backdrop').forEach((backdrop) => {
      backdrop.addEventListener('click', (e) => {
        if (e.target === backdrop) backdrop.classList.remove('active');
      });
    });

    // Modal Player Controls
    const mPlayBtn = document.getElementById('modal-play-btn');
    const mNextBtn = document.getElementById('modal-next-btn');
    const mPrevBtn = document.getElementById('modal-prev-btn');
    const mProgress = document.getElementById('modal-progress-bar');

    const handleToggle = () => {
      if (sync.role === 'guest') {
        sync.sendGuestCommand('toggle');
      } else {
        audio.toggle();
      }
    };

    const handleNext = () => {
      if (sync.role === 'guest') {
        sync.sendGuestCommand('next');
      } else {
        audio.next();
      }
    };

    const handlePrev = () => {
      if (sync.role === 'guest') {
        sync.sendGuestCommand('prev');
      } else {
        audio.prev();
      }
    };

    if (mPlayBtn) mPlayBtn.addEventListener('click', handleToggle);
    if (mNextBtn) mNextBtn.addEventListener('click', handleNext);
    if (mPrevBtn) mPrevBtn.addEventListener('click', handlePrev);

    if (mProgress) {
      mProgress.addEventListener('click', (e) => {
        const rect = mProgress.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const percent = Math.max(0, Math.min(1, clickX / rect.width));
        const targetSeconds = percent * (audio.currentTrack.durationSeconds || 240);
        audio.seek(targetSeconds);
        if (sync.role === 'guest') {
          sync.sendGuestCommand('seek', { time: targetSeconds });
        }
      });
    }
  }

  /* ------------------------------------------------ Listen Together P2P Sync */
  setupListenTogether() {
    const inviteBanner = document.getElementById('invite-banner');
    const joinRoomBtn = document.getElementById('join-room-btn');
    const dismissInviteBtn = document.getElementById('dismiss-invite-btn');
    const copyLinkBtn = document.getElementById('copy-room-link-btn');
    const leaveRoomBtn = document.getElementById('leave-room-btn');
    const roomLinkWrap = document.getElementById('room-link-wrap');
    const roomLinkInput = document.getElementById('room-link-input');

    let pendingInviteRoomId = null;

    // Listen for room detection from URL (#room=...)
    window.addEventListener('sync:invite', (e) => {
      pendingInviteRoomId = e.detail?.roomId;
      if (inviteBanner && pendingInviteRoomId) {
        inviteBanner.hidden = false;
      }
    });

    // Listen for custom toasts from sync or any component
    window.addEventListener('app:toast', (e) => {
      if (e.detail) this.showToast(e.detail);
    });

    if (joinRoomBtn) {
      joinRoomBtn.addEventListener('click', async () => {
        if (!pendingInviteRoomId) return;
        joinRoomBtn.disabled = true;
        joinRoomBtn.textContent = 'Joining...';
        try {
          audio.ensureAudioContext();
          if (inviteBanner) inviteBanner.hidden = true;
          await sync.joinRoom(pendingInviteRoomId);
          this.openModal('modal-player');
        } catch (e) {
          console.error(e);
          this.showToast('Could not join room. Host may be offline.');
        } finally {
          joinRoomBtn.disabled = false;
          joinRoomBtn.textContent = 'Join & Listen';
        }
      });
    }

    if (dismissInviteBtn) {
      dismissInviteBtn.addEventListener('click', () => {
        if (inviteBanner) inviteBanner.hidden = true;
      });
    }

    if (copyLinkBtn) {
      copyLinkBtn.addEventListener('click', async () => {
        try {
          copyLinkBtn.disabled = true;
          copyLinkBtn.textContent = 'Connecting...';

          const inviteLink = await sync.startHosting();
          if (roomLinkWrap && roomLinkInput) {
            roomLinkWrap.hidden = false;
            roomLinkInput.value = inviteLink;
            roomLinkInput.select();
          }

          try {
            await navigator.clipboard.writeText(inviteLink);
            this.showToast('🎧 Room link copied! Share with friends to sync music.');
          } catch (clipErr) {
            this.showToast('Room link created! Copy from the box below.');
          }

          copyLinkBtn.textContent = 'Copied Link! ✓';
          setTimeout(() => {
            copyLinkBtn.disabled = false;
            copyLinkBtn.textContent = 'Invite Friends';
          }, 2400);
        } catch (err) {
          console.error(err);
          copyLinkBtn.disabled = false;
          copyLinkBtn.textContent = 'Invite Friends';
          this.showToast('Could not start room. Check connection.');
        }
      });
    }

    if (leaveRoomBtn) {
      leaveRoomBtn.addEventListener('click', () => {
        sync.leaveRoom();
        if (roomLinkWrap) roomLinkWrap.hidden = true;
        if (roomLinkInput) roomLinkInput.value = '';
      });
    }

    if (roomLinkInput) {
      roomLinkInput.addEventListener('click', () => {
        roomLinkInput.select();
        try {
          navigator.clipboard.writeText(roomLinkInput.value);
          this.showToast('Copied room link!');
        } catch (e) {}
      });
    }
  }

  renderSyncState(syncState) {
    const dot = document.getElementById('room-status-dot');
    const title = document.getElementById('room-status-title');
    const desc = document.getElementById('room-status-desc');
    const leaveBtn = document.getElementById('leave-room-btn');
    const roomLinkWrap = document.getElementById('room-link-wrap');
    const roomLinkInput = document.getElementById('room-link-input');

    const isActive = syncState.role !== 'solo';
    if (dot) dot.classList.toggle('active', isActive);

    if (title) {
      if (syncState.role === 'host') {
        title.textContent = `🎧 Host · ${syncState.listenersCount} listening together`;
      } else if (syncState.role === 'guest') {
        title.textContent = '🎧 Connected · Synced with Host';
      } else {
        title.textContent = 'Listen Together with Friends';
      }
    }

    if (desc) {
      if (syncState.role === 'host') {
        desc.textContent = 'Room is live! Share your invite link. Any track or playback change is synced in real time.';
      } else if (syncState.role === 'guest') {
        desc.textContent = 'Synced with host! Enjoy the music together in real time.';
      } else {
        desc.textContent = 'Invite friends to sync and hear the exact same music in real time.';
      }
    }

    if (leaveBtn) {
      leaveBtn.hidden = (syncState.role === 'solo');
    }

    if (roomLinkWrap && roomLinkInput) {
      if (syncState.role === 'host' && syncState.inviteLink) {
        roomLinkWrap.hidden = false;
        roomLinkInput.value = syncState.inviteLink;
      } else if (syncState.role === 'solo') {
        roomLinkWrap.hidden = true;
        roomLinkInput.value = '';
      }
    }
  }

  openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.add('active');
      if (modalId === 'modal-player') {
        this.modalSpectrum.resize();
      }
    }
  }

  /* ------------------------------------------------ Render Dynamic Catalogues */
  renderRecordsCatalogue() {
    const container = document.getElementById('records-catalogue-list');
    if (!container) return;

    container.innerHTML = RECORDS.map((rec) => `
      <div class="catalogue-card" data-play-record="${rec.id}">
        <img src="${rec.cover}" alt="${rec.title}">
        <h4>${rec.title}</h4>
        <p>${rec.artist}</p>
        <div style="display:flex; justify-content:space-between; align-items:center; margin-top:6px; flex-wrap:wrap; gap:4px;">
          <span style="font-size:0.75rem; color: #ff3366; font-weight:600;">
            ▶ ${rec.tracks.length} Master Tracks · ${rec.genre}
          </span>
          ${rec.spotifyUrl ? '<span style="font-size:0.7rem; color:#1ed760; font-weight:700; background:rgba(30,215,96,0.12); padding:2px 8px; border-radius:999px;">● Spotify</span>' : ''}
        </div>
      </div>
    `).join('');

    container.querySelectorAll('[data-play-record]').forEach((card) => {
      card.addEventListener('click', () => {
        const id = card.getAttribute('data-play-record');
        if (sync.role === 'guest') {
          sync.sendGuestCommand('select-record', { recordId: id, trackIdx: 0 });
        }
        audio.playRecord(id, 0);
        this.showToast(`Loaded ${id.toUpperCase()} master disc`);
        const backdrop = card.closest('.glass-modal-backdrop');
        if (backdrop) backdrop.classList.remove('active');
      });
    });
  }

  renderArtistsCatalogue() {
    const container = document.getElementById('artists-catalogue-list');
    if (!container) return;

    container.innerHTML = ARTISTS.map((artist) => `
      <div class="catalogue-card" style="cursor: default;">
        <img src="${artist.photo}" alt="${artist.name}" style="height: 220px; object-fit: cover;">
        <h4 style="font-size:1.2rem;">${artist.name}</h4>
        <p style="color: #fb7185; font-size:0.85rem; font-weight:600;">${artist.role}</p>
        <p style="margin-top:8px; line-height: 1.5; font-size:0.82rem;">${artist.bio}</p>
        <div style="margin-top:12px; padding-top:10px; border-top:1px solid rgba(255,255,255,0.08); font-size:0.75rem; color: #9e96b3;">
          <div>🎙 Preferred: ${artist.favoriteGear}</div>
          <div style="margin-top:4px;">🎧 ${artist.listeners}</div>
        </div>
      </div>
    `).join('');
  }

  /* ------------------------------------------------ Contact Form & Toast */
  setupContactForm() {
    const form = document.getElementById('contact-form');
    const input = document.getElementById('contact-email-input');

    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = input.value.trim();
        if (!email || !email.includes('@')) {
          this.showToast('Please enter a valid email address.');
          return;
        }

        this.showToast('Request received! The studio mastering team will reach out.');
        input.value = '';
      });
    }
  }

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

  /* ------------------------------------------------ PWA App Installation */
  setupPWA() {
    // Register Service Worker
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js').catch((err) => {
          console.log('SW registration note:', err);
        });
      });
    }

    // Capture Install Prompt
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferredPrompt = e;
      const installBtns = document.querySelectorAll('.btn-app-install');
      installBtns.forEach((btn) => {
        btn.style.display = 'inline-flex';
        btn.addEventListener('click', () => {
          if (this.deferredPrompt) {
            this.deferredPrompt.prompt();
            this.deferredPrompt.userChoice.then((choice) => {
              if (choice.outcome === 'accepted') {
                this.showToast('Melodia Beat Records App Installed!');
              }
              this.deferredPrompt = null;
            });
          }
        });
      });
    });

    // Default action if prompt hasn't triggered yet
    document.querySelectorAll('.btn-app-install').forEach((btn) => {
      btn.addEventListener('click', () => {
        if (!this.deferredPrompt) {
          this.showToast('App Ready! Tap Share/Options in browser and select "Add to Home Screen".');
        }
      });
    });
  }

  /* ------------------------------------------------ Keyboard Controls */
  setupKeyboardControls() {
    window.addEventListener('keydown', (e) => {
      // Space to toggle play/pause (when not typing in form)
      if (e.code === 'Space' && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
        e.preventDefault();
        if (sync.role === 'guest') {
          sync.sendGuestCommand('toggle');
        } else {
          audio.toggle();
        }
      }
      // Escape to close modals
      if (e.code === 'Escape') {
        document.querySelectorAll('.glass-modal-backdrop.active').forEach((m) => m.classList.remove('active'));
      }
    });
  }
}

// Bootstrap on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  const app = new MelodiaApp();
  app.init();
});
