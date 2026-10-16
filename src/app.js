// Application Orchestrator: UI, Router, 3D Tilt, Modals, Spotify & Production Real-time Music Room Sync
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
    // 1. Initialize Visualizers, Audio & Realtime Sync Engine
    this.atmosphere = new BackgroundAtmosphere('bg-canvas');
    this.dockSpectrum = new SpectrumVisualizer('dock-spectrum');
    this.modalSpectrum = new SpectrumVisualizer('modal-spectrum');
    audio.init();
    sync.init();

    // 2. Setup Subscriptions & State Sync
    audio.subscribe((state) => this.renderPlaybackState(state));
    sync.subscribe((syncState) => this.renderSyncState(syncState));

    // 3. UI Interactions & Controllers
    this.setupSectionObserver();
    this.setup3DTilt();
    this.setupModals();
    this.setupMiniPlayer();
    this.setupVolumeControls();
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
    const { isPlaying, track, progress, volume } = state;

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

    // Individual Volume Controls Sync
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

    const sliderGradient = (pct) => `linear-gradient(90deg, #ff3366 0%, #fb7185 ${pct}%, rgba(255, 255, 255, 0.12) ${pct}%, rgba(255, 255, 255, 0.12) 100%)`;

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

  /* ------------------------------------------------ Mini Player Controls */
  setupMiniPlayer() {
    const playBtn = document.getElementById('dock-play-btn');
    const nextBtn = document.getElementById('dock-next-btn');
    const prevBtn = document.getElementById('dock-prev-btn');
    const expandBtn = document.getElementById('dock-expand-btn');

    if (playBtn) playBtn.addEventListener('click', () => sync.togglePlay());
    if (nextBtn) nextBtn.addEventListener('click', () => sync.next());
    if (prevBtn) prevBtn.addEventListener('click', () => sync.prev());
    if (expandBtn) expandBtn.addEventListener('click', () => this.openModal('modal-player'));

    // Album cover clicks directly on the screen
    document.querySelectorAll('[data-play-album]').forEach((el) => {
      el.addEventListener('click', () => {
        const albumId = el.getAttribute('data-play-album');
        sync.selectRecord(albumId, 0);
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
        sync.selectPlaylist(plId);
        this.showToast(`Playing playlist: ${btn.textContent.trim()}`);
      });
    });
  }

  /* ------------------------------------------------ Individual Volume Controls */
  setupVolumeControls() {
    const dockVolSlider = document.getElementById('dock-volume-slider');
    const dockVolBtn = document.getElementById('dock-volume-btn');
    const modalVolSlider = document.getElementById('modal-volume-slider');
    const modalMuteBtn = document.getElementById('modal-volume-mute-btn');

    const updateSliderFill = (slider, val) => {
      slider.style.background = `linear-gradient(90deg, #ff3366 0%, #fb7185 ${val}%, rgba(255, 255, 255, 0.12) ${val}%, rgba(255, 255, 255, 0.12) 100%)`;
    };

    if (dockVolSlider) {
      dockVolSlider.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        updateSliderFill(dockVolSlider, val);
        audio.setVolume(val / 100);
      });
    }

    if (modalVolSlider) {
      modalVolSlider.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        updateSliderFill(modalVolSlider, val);
        audio.setVolume(val / 100);
      });
    }

    if (dockVolBtn) {
      dockVolBtn.addEventListener('click', () => {
        audio.toggleMute();
      });
    }

    if (modalMuteBtn) {
      modalMuteBtn.addEventListener('click', () => {
        audio.toggleMute();
      });
    }
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

    if (mPlayBtn) mPlayBtn.addEventListener('click', () => sync.togglePlay());
    if (mNextBtn) mNextBtn.addEventListener('click', () => sync.next());
    if (mPrevBtn) mPrevBtn.addEventListener('click', () => sync.prev());

    if (mProgress) {
      mProgress.addEventListener('click', (e) => {
        const rect = mProgress.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const percent = Math.max(0, Math.min(1, clickX / rect.width));
        const targetSeconds = percent * (audio.currentTrack.durationSeconds || 240);
        sync.seek(targetSeconds);
      });
    }
  }

  /* ------------------------------------------------ Synchronized Music Room Hub */
  setupListenTogether() {
    const inviteBanner = document.getElementById('invite-banner');
    const inviteBannerTitle = document.getElementById('invite-banner-title');
    const joinRoomBtn = document.getElementById('join-room-btn');
    const dismissInviteBtn = document.getElementById('dismiss-invite-btn');

    const copyLinkBtn = document.getElementById('copy-room-link-btn');
    const directCopyBtn = document.getElementById('copy-room-link-direct');
    const leaveRoomBtn = document.getElementById('leave-room-btn');
    const roomLinkWrap = document.getElementById('room-link-wrap');
    const roomLinkInput = document.getElementById('room-link-input');

    const shareWhatsappBtn = document.getElementById('btn-share-whatsapp');
    const shareTelegramBtn = document.getElementById('btn-share-telegram');
    const shareNativeBtn = document.getElementById('btn-share-native');

    const joinCodeInput = document.getElementById('join-code-input');
    const joinCodeSubmit = document.getElementById('btn-join-code-submit');

    let pendingInviteRoomId = null;

    // 1. URL Room Detection (/room/:id or #room=:id or ?room=:id)
    window.addEventListener('sync:invite', (e) => {
      pendingInviteRoomId = e.detail?.roomId;
      if (inviteBanner && pendingInviteRoomId) {
        if (inviteBannerTitle) {
          inviteBannerTitle.textContent = `You've been invited to Room ${pendingInviteRoomId}!`;
        }
        inviteBanner.hidden = false;
      }
    });

    // 2. Global Toast Listener
    window.addEventListener('app:toast', (e) => {
      if (e.detail) this.showToast(e.detail);
    });

    // 3. Banner Join Click (acts as required user interaction for browser autoplay permission)
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
          this.showToast('Could not join room. Check connection.');
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

    // 4. Create Room / Invite Friends button
    if (copyLinkBtn) {
      copyLinkBtn.addEventListener('click', async () => {
        if (sync.role === 'solo') {
          copyLinkBtn.disabled = true;
          copyLinkBtn.textContent = 'Creating Room...';
          try {
            audio.ensureAudioContext();
            const shareUrl = await sync.createRoom();
            if (roomLinkInput) {
              roomLinkInput.value = shareUrl;
            }
            try {
              await navigator.clipboard.writeText(shareUrl);
              this.showToast(`🎉 Room ${sync.roomId} created! Link copied to clipboard.`);
            } catch (e) {
              this.showToast(`🎉 Room ${sync.roomId} created! Share the link below.`);
            }
          } catch (err) {
            console.error(err);
            this.showToast('Could not create room. Check connection.');
          } finally {
            copyLinkBtn.disabled = false;
          }
        } else {
          // Already in room: copy share link
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
      });
    }

    // 5. Direct Copy Button inside input group
    if (directCopyBtn && roomLinkInput) {
      directCopyBtn.addEventListener('click', async () => {
        const val = roomLinkInput.value || sync.getShareUrl();
        if (val) {
          try {
            await navigator.clipboard.writeText(val);
            directCopyBtn.textContent = 'Copied!';
            this.showToast('🎧 Room link copied to clipboard!');
            setTimeout(() => { directCopyBtn.textContent = 'Copy'; }, 2000);
          } catch (e) {
            roomLinkInput.select();
            this.showToast('Press Ctrl+C to copy room link.');
          }
        }
      });
    }

    // 6. Direct WhatsApp Share
    if (shareWhatsappBtn) {
      shareWhatsappBtn.addEventListener('click', () => {
        const text = sync.getShareText();
        window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
      });
    }

    // 7. Direct Telegram Share
    if (shareTelegramBtn) {
      shareTelegramBtn.addEventListener('click', () => {
        const url = sync.getShareUrl();
        const text = `🎧 Join my Melodia synchronized music room!`;
        window.open(`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`, '_blank');
      });
    }

    // 8. Native Device Share
    if (shareNativeBtn) {
      shareNativeBtn.addEventListener('click', async () => {
        const url = sync.getShareUrl();
        const text = sync.getShareText();
        if (navigator.share) {
          try {
            await navigator.share({
              title: 'Melodia Studio Session',
              text: text,
              url: url
            });
          } catch (e) {}
        } else {
          try {
            await navigator.clipboard.writeText(url);
            this.showToast('Room link copied!');
          } catch (e) {}
        }
      });
    }

    // 9. Join by Room Code
    const handleJoinCode = async () => {
      if (!joinCodeInput) return;
      const code = joinCodeInput.value.trim().toUpperCase();
      if (!code) {
        this.showToast('Please enter a room code (e.g. MEL-4K9X)');
        return;
      }
      try {
        audio.ensureAudioContext();
        await sync.joinRoom(code);
        joinCodeInput.value = '';
      } catch (e) {
        this.showToast('Could not join room.');
      }
    };

    if (joinCodeSubmit) joinCodeSubmit.addEventListener('click', handleJoinCode);
    if (joinCodeInput) {
      joinCodeInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') handleJoinCode();
      });
    }

    // 10. Leave Room
    if (leaveRoomBtn) {
      leaveRoomBtn.addEventListener('click', () => {
        sync.leaveRoom();
      });
    }
  }

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
        sync.selectRecord(id, 0);
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
        sync.togglePlay();
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
