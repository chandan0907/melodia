// Application Orchestrator: UI, Router, 3D Tilt, Modals & PWA
import { audio } from './audio.js';
import { BackgroundAtmosphere, SpectrumVisualizer } from './visualizer.js';
import { RECORDS, ARTISTS, STUDIO_INFO, PLAYLISTS } from './data.js';

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
    // 1. Initialize Visualizers & Audio
    this.atmosphere = new BackgroundAtmosphere('bg-canvas');
    this.dockSpectrum = new SpectrumVisualizer('dock-spectrum');
    this.modalSpectrum = new SpectrumVisualizer('modal-spectrum');
    audio.init();

    // 2. Setup Subscriptions & State Sync
    audio.subscribe((state) => this.renderPlaybackState(state));

    // 3. UI Interactions
    this.setupSectionObserver();
    this.setup3DTilt();
    this.setupModals();
    this.setupMiniPlayer();
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
    const dockPlayBtn = document.getElementById('dock-play-btn');
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

    if (playBtn) playBtn.addEventListener('click', () => audio.toggle());
    if (nextBtn) nextBtn.addEventListener('click', () => audio.next());
    if (prevBtn) prevBtn.addEventListener('click', () => audio.prev());
    if (expandBtn) expandBtn.addEventListener('click', () => this.openModal('modal-player'));

    // Album cover clicks directly on the screen
    document.querySelectorAll('[data-play-album]').forEach((el) => {
      el.addEventListener('click', () => {
        const albumId = el.getAttribute('data-play-album');
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
    const copyLinkBtn = document.getElementById('copy-room-link-btn');

    if (mPlayBtn) mPlayBtn.addEventListener('click', () => audio.toggle());
    if (mNextBtn) mNextBtn.addEventListener('click', () => audio.next());
    if (mPrevBtn) mPrevBtn.addEventListener('click', () => audio.prev());

    if (mProgress) {
      mProgress.addEventListener('click', (e) => {
        const rect = mProgress.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const percent = clickX / rect.width;
        audio.currentTrack.currentTimeSeconds = percent * audio.currentTrack.durationSeconds;
        audio.notify();
      });
    }

    if (copyLinkBtn) {
      copyLinkBtn.addEventListener('click', () => {
        const shareUrl = window.location.origin + window.location.pathname + '#join-studio-session';
        navigator.clipboard.writeText(shareUrl).then(() => {
          this.showToast('Room link copied! Share with friends to sync music.');
        }).catch(() => {
          this.showToast('Link ready: ' + shareUrl);
        });
      });
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
        audio.toggle();
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
