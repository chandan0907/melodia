// PURPOSE: Programmatically constructs the full Master Studio Player modal with Listen Together room hub.
// INTEGRATION: Integrates AudioEngine playback, SpectrumVisualizer, playlist switching,
// individual device volume control, and production real-time music room synchronization.
// INPUT: Full player event handlers.
// OUTPUT: Semantic HTMLElement (<div id="modal-player" class="glass-modal-backdrop">).
// ACCESSIBILITY: Full keyboard navigation, modal role="dialog", aria-modal="true", and focusable controls.

import { createElement, createSvg, createSvgPath } from '../common/dom.js';

/**
 * Creates the complete Studio Master Player modal.
 * @param {Object} [handlers] - Event callbacks
 * @returns {HTMLElement} The modal backdrop element
 */
export function createMasterModal(handlers = {}) {
  // 1. Close Button
  const closeBtn = createElement('button', {
    className: 'modal-close-btn',
    dataset: { modalClose: '' },
    attrs: { 'aria-label': 'Close Modal' },
    text: '×',
    events: {
      click: () => {
        if (typeof handlers.onClose === 'function') handlers.onClose();
      }
    }
  });

  // 2. Spinning Big Vinyl Stage
  const trackCover = createElement('img', {
    id: 'modal-track-cover',
    attrs: {
      src: './assets/images/album_love.jpg',
      alt: 'Record Cover'
    }
  });

  const vinylCenter = createElement('div', {
    className: 'big-vinyl-center',
    children: [trackCover]
  });

  const bigVinyl = createElement('div', {
    id: 'modal-big-vinyl',
    className: 'big-vinyl',
    children: [vinylCenter]
  });

  const vinylStage = createElement('div', {
    className: 'player-vinyl-stage',
    children: [bigVinyl]
  });

  // 3. Player Details Stage
  const tapeTag = createElement('div', {
    attrs: {
      style: 'font-size:0.75rem; letter-spacing:0.2em; text-transform:uppercase; color:var(--accent-peach); font-weight:700;'
    },
    text: 'Master Tape Playback'
  });

  const trackTitle = createElement('h3', {
    id: 'modal-track-title',
    attrs: { style: 'font-size: 1.85rem; font-weight:800; margin-top:4px;' },
    text: 'The Ghost Sessions'
  });

  const trackArtist = createElement('p', {
    id: 'modal-track-artist',
    attrs: { style: 'color:var(--text-mute); font-size:1.05rem;' },
    text: 'Kai Sterling & Sarah Preston'
  });

  const trackAlbum = createElement('p', {
    id: 'modal-track-album',
    attrs: { style: 'color:rgba(255,255,255,0.45); font-size:0.85rem; margin-top:2px;' },
    text: 'Album: love (2026 Master)'
  });

  // Modal Audio Spectrum Canvas
  const modalSpectrum = createElement('canvas', {
    id: 'modal-spectrum',
    attrs: { style: 'width: 100%; height: 50px; margin-top: 18px;' }
  });

  // Progress Bar
  const progressFill = createElement('div', {
    id: 'modal-progress-fill',
    className: 'player-progress-fill'
  });

  const progressBar = createElement('div', {
    id: 'modal-progress-bar',
    className: 'player-progress-bar',
    children: [progressFill],
    events: {
      click: (e) => {
        if (typeof handlers.onSeek === 'function') {
          const rect = progressBar.getBoundingClientRect();
          const clickX = e.clientX - rect.left;
          const pct = Math.max(0, Math.min(1, clickX / rect.width));
          handlers.onSeek(pct);
        }
      }
    }
  });

  const timeCur = createElement('span', { id: 'modal-time-cur', text: '0:00' });
  const timeDur = createElement('span', { id: 'modal-time-dur', text: '4:15' });

  const timeRow = createElement('div', {
    className: 'player-time-row',
    children: [timeCur, timeDur]
  });

  // Controls Row (Prev, Play/Pause, Next)
  const prevSvg = createSvg('svg', {
    attrs: { viewBox: '0 0 24 24', width: '24', height: '24', fill: 'currentColor' },
    children: [createSvgPath('M6 6h2v12H6zm3.5 6 8.5 6V6z')]
  });

  const prevBtn = createElement('button', {
    id: 'modal-prev-btn',
    className: 'btn-dock-icon',
    props: { type: 'button' },
    attrs: { 'aria-label': 'Previous' },
    children: [prevSvg],
    events: {
      click: () => {
        if (typeof handlers.onPrev === 'function') handlers.onPrev();
      }
    }
  });

  const playSvg = createSvg('svg', {
    id: 'modal-play-icon',
    attrs: { viewBox: '0 0 24 24', width: '28', height: '28', fill: 'currentColor' },
    children: [createSvgPath('M8 5v14l11-7z')]
  });

  const pauseSvg = createSvg('svg', {
    id: 'modal-pause-icon',
    attrs: { viewBox: '0 0 24 24', width: '28', height: '28', fill: 'currentColor', style: 'display:none;' },
    children: [createSvgPath('M6 5h4v14H6zm8 0h4v14h-4z')]
  });

  const playBtn = createElement('button', {
    id: 'modal-play-btn',
    className: 'btn-dock-play',
    props: { type: 'button' },
    attrs: { style: 'width: 58px; height: 58px;', 'aria-label': 'Play or Pause' },
    children: [playSvg, pauseSvg],
    events: {
      click: () => {
        if (typeof handlers.onTogglePlay === 'function') handlers.onTogglePlay();
      }
    }
  });

  const nextSvg = createSvg('svg', {
    attrs: { viewBox: '0 0 24 24', width: '24', height: '24', fill: 'currentColor' },
    children: [createSvgPath('m6 18 8.5-6L6 6v12zm10-12v12h2V6h-2z')]
  });

  const nextBtn = createElement('button', {
    id: 'modal-next-btn',
    className: 'btn-dock-icon',
    props: { type: 'button' },
    attrs: { 'aria-label': 'Next' },
    children: [nextSvg],
    events: {
      click: () => {
        if (typeof handlers.onNext === 'function') handlers.onNext();
      }
    }
  });

  const actionRow = createElement('div', {
    className: 'player-action-row',
    children: [prevBtn, playBtn, nextBtn]
  });

  // Individual Device Volume Controls Card
  const volMuteSvg = createSvg('svg', {
    id: 'modal-vol-icon-high',
    attrs: { viewBox: '0 0 24 24', width: '18', height: '18', fill: 'none', stroke: 'currentColor', 'stroke-width': '2' },
    children: [
      createSvgPath('M11 5L6 9H2v6h4l5 4V5z'),
      createSvgPath('M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07')
    ]
  });

  const volMutedSvg = createSvg('svg', {
    id: 'modal-vol-icon-muted',
    attrs: { viewBox: '0 0 24 24', width: '18', height: '18', fill: 'none', stroke: 'currentColor', 'stroke-width': '2', style: 'display:none;' },
    children: [
      createSvgPath('M11 5L6 9H2v6h4l5 4V5z'),
      createSvgPath('M23 9l-6 6m0-6l6 6')
    ]
  });

  const muteBtn = createElement('button', {
    id: 'modal-volume-mute-btn',
    className: 'btn-dock-icon',
    props: { type: 'button' },
    attrs: { 'aria-label': 'Toggle Mute', title: 'Toggle Mute' },
    children: [volMuteSvg, volMutedSvg],
    events: {
      click: () => {
        if (typeof handlers.onToggleMute === 'function') handlers.onToggleMute();
      }
    }
  });

  const volSlider = createElement('input', {
    id: 'modal-volume-slider',
    className: 'volume-slider-modal',
    props: {
      type: 'range',
      min: '0',
      max: '100',
      value: '85'
    },
    attrs: {
      'aria-label': 'Device Volume',
      title: 'Device Volume'
    },
    events: {
      input: (e) => {
        if (typeof handlers.onVolumeChange === 'function') {
          handlers.onVolumeChange(parseFloat(e.target.value));
        }
      }
    }
  });

  const volVal = createElement('span', {
    id: 'modal-volume-val',
    className: 'modal-volume-val',
    text: '85%'
  });

  const volCard = createElement('div', {
    className: 'modal-volume-card',
    children: [muteBtn, volSlider, volVal]
  });

  // Studio Playlists Row
  const playlists = [
    { id: 'awarapan-2-playlist', label: '🌼 Awarapan 2', active: true },
    { id: 'late-night', label: '🌙 Late Night Chill', active: false },
    { id: 'power-up', label: '⚡ Power Up', active: false },
    { id: 'pop-pulse', label: '✨ Pop Pulse', active: false },
    { id: 'rock-legends', label: '🎸 Rock Legends', active: false }
  ];

  const playlistButtons = playlists.map((pl) => {
    return createElement('button', {
      className: `btn-playlist-pill${pl.active ? ' active' : ''}`,
      props: { type: 'button' },
      dataset: { playPlaylist: pl.id },
      children: [createElement('span', { text: pl.label })],
      events: {
        click: () => {
          if (typeof handlers.onSelectPlaylist === 'function') handlers.onSelectPlaylist(pl.id);
        }
      }
    });
  });

  const playlistsRow = createElement('div', {
    className: 'player-playlists-row',
    attrs: {
      style: 'margin-top:20px; display:flex; gap:8px; flex-wrap:wrap; justify-content:center;'
    },
    children: playlistButtons
  });

  // 4. Listen Together Box
  const statusDot = createElement('span', {
    id: 'room-status-dot',
    className: 'status-dot'
  });

  const statusTitle = createElement('strong', {
    id: 'room-status-title',
    text: 'Listen Together with Friends'
  });

  const badgePill = createElement('span', {
    id: 'room-badge-pill',
    className: 'room-badge-pill',
    props: { hidden: true }
  });

  const statusBadge = createElement('div', {
    className: 'room-status-badge',
    children: [statusDot, statusTitle, badgePill]
  });

  const statusDesc = createElement('span', {
    id: 'room-status-desc',
    text: 'Invite friends to sync and hear the exact same music in real time.'
  });

  // Share URL Input Container
  const roomLinkInput = createElement('input', {
    id: 'room-link-input',
    className: 'room-link-field',
    props: {
      readOnly: true,
      value: '',
      placeholder: 'Generating room link...'
    }
  });

  const copyDirectBtn = createElement('button', {
    id: 'copy-room-link-direct',
    className: 'btn-room-copy',
    props: { type: 'button' },
    text: 'Copy',
    events: {
      click: () => {
        if (typeof handlers.onCopyLink === 'function') handlers.onCopyLink();
      }
    }
  });

  const roomLinkWrap = createElement('div', {
    id: 'room-link-wrap',
    className: 'room-link-container',
    props: { hidden: true },
    children: [roomLinkInput, copyDirectBtn]
  });

  // Join by Room Code
  const joinCodeInput = createElement('input', {
    id: 'join-code-input',
    className: 'join-code-field',
    props: {
      type: 'text',
      placeholder: 'Enter Code (e.g. MEL-8K9X)',
      maxLength: 12
    }
  });

  const joinCodeSubmit = createElement('button', {
    id: 'btn-join-code-submit',
    className: 'btn-room-code-join',
    props: { type: 'button' },
    text: 'Join',
    events: {
      click: () => {
        if (typeof handlers.onJoinCode === 'function') {
          handlers.onJoinCode(joinCodeInput.value);
        }
      }
    }
  });

  const joinCodeWrap = createElement('div', {
    id: 'join-code-wrap',
    className: 'join-code-wrap',
    children: [joinCodeInput, joinCodeSubmit]
  });

  // Social Share Buttons (WhatsApp, Telegram, Native)
  const shareWhatsapp = createElement('button', {
    id: 'btn-share-whatsapp',
    className: 'btn-share-social',
    props: { type: 'button' },
    children: [createElement('span', { text: '💬 WhatsApp' })],
    events: {
      click: () => {
        if (typeof handlers.onShareWhatsapp === 'function') handlers.onShareWhatsapp();
      }
    }
  });

  const shareTelegram = createElement('button', {
    id: 'btn-share-telegram',
    className: 'btn-share-social',
    props: { type: 'button' },
    children: [createElement('span', { text: '✈️ Telegram' })],
    events: {
      click: () => {
        if (typeof handlers.onShareTelegram === 'function') handlers.onShareTelegram();
      }
    }
  });

  const shareNative = createElement('button', {
    id: 'btn-share-native',
    className: 'btn-share-social',
    props: { type: 'button' },
    children: [createElement('span', { text: '🔗 Share...' })],
    events: {
      click: () => {
        if (typeof handlers.onShareNative === 'function') handlers.onShareNative();
      }
    }
  });

  const socialShareRow = createElement('div', {
    id: 'room-social-share-row',
    className: 'room-social-share-row',
    props: { hidden: true },
    children: [shareWhatsapp, shareTelegram, shareNative]
  });

  const roomInfo = createElement('div', {
    className: 'listen-together-info',
    children: [statusBadge, statusDesc, roomLinkWrap, joinCodeWrap, socialShareRow]
  });

  // Action Buttons (Invite Friends / Leave Room)
  const copyLinkBtn = createElement('button', {
    id: 'copy-room-link-btn',
    className: 'btn-pill-primary',
    props: { type: 'button' },
    attrs: { style: 'padding: 9px 18px; font-size: 0.8rem;' },
    text: 'Invite Friends',
    events: {
      click: () => {
        if (typeof handlers.onInviteFriends === 'function') handlers.onInviteFriends();
      }
    }
  });

  const leaveRoomBtn = createElement('button', {
    id: 'leave-room-btn',
    className: 'btn-room-leave',
    props: { type: 'button', hidden: true },
    text: 'Leave Room',
    events: {
      click: () => {
        if (typeof handlers.onLeaveRoom === 'function') handlers.onLeaveRoom();
      }
    }
  });

  const roomActions = createElement('div', {
    className: 'room-actions-group',
    children: [copyLinkBtn, leaveRoomBtn]
  });

  const listenTogetherBox = createElement('div', {
    className: 'listen-together-box',
    children: [roomInfo, roomActions]
  });

  // Assemble Details Stage
  const detailsStage = createElement('div', {
    className: 'player-details-stage',
    children: [
      tapeTag,
      trackTitle,
      trackArtist,
      trackAlbum,
      modalSpectrum,
      progressBar,
      timeRow,
      actionRow,
      volCard,
      playlistsRow,
      listenTogetherBox
    ]
  });

  // 5. Card Container
  const playerGrid = createElement('div', {
    className: 'full-player-grid',
    children: [vinylStage, detailsStage]
  });

  const modalCard = createElement('div', {
    className: 'glass-modal-card',
    children: [closeBtn, playerGrid]
  });

  // 6. Modal Backdrop
  const modalBackdrop = createElement('div', {
    id: 'modal-player',
    className: 'glass-modal-backdrop',
    attrs: {
      role: 'dialog',
      'aria-modal': 'true',
      'aria-label': 'Studio Master Player'
    },
    children: [modalCard],
    events: {
      click: (e) => {
        if (e.target === modalBackdrop && typeof handlers.onClose === 'function') {
          handlers.onClose();
        }
      }
    }
  });

  return modalBackdrop;
}
