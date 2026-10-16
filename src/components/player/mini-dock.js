// PURPOSE: Programmatically constructs the persistent floating mini player dock.
// INTEGRATION: Binds directly to audioState for reactive metadata, playback status, waveform visualizer,
// and individual user volume slider.
// INPUT: Audio state observer and user interaction handlers.
// OUTPUT: Semantic HTMLElement (<aside class="mini-player-dock">).
// ACCESSIBILITY: Proper button labels, ARIA landmarks, and keyboard focus states.

import { createElement, createSvg, createSvgPath } from '../common/dom.js';

/**
 * Creates the floating mini player dock.
 * @param {Object} [handlers] - Event callbacks
 * @param {Function} [handlers.onTogglePlay] - Play/pause callback
 * @param {Function} [handlers.onNext] - Next track callback
 * @param {Function} [handlers.onPrev] - Previous track callback
 * @param {Function} [handlers.onExpand] - Expand studio player modal callback
 * @param {Function} [handlers.onVolumeChange] - Individual volume change callback (0-100)
 * @param {Function} [handlers.onToggleMute] - Mute toggle callback
 * @returns {HTMLElement} The mini player dock element
 */
export function createMiniDock(handlers = {}) {
  // 1. Dock Left (Vinyl Cover + Title & Artist)
  const dockCover = createElement('img', {
    id: 'dock-cover',
    attrs: {
      src: './assets/images/album_love.jpg',
      alt: 'Now Playing'
    }
  });

  const dockVinyl = createElement('button', {
    id: 'dock-vinyl',
    className: 'dock-vinyl',
    props: { type: 'button' },
    dataset: { modalOpen: 'modal-player' },
    attrs: { title: 'Open Music Studio', 'aria-label': 'Open Music Studio' },
    children: [dockCover],
    events: {
      click: () => {
        if (typeof handlers.onExpand === 'function') handlers.onExpand();
      }
    }
  });

  const dockTitle = createElement('span', {
    id: 'dock-title',
    className: 'dock-title',
    text: 'The Ghost Sessions'
  });

  const dockArtist = createElement('span', {
    id: 'dock-artist',
    className: 'dock-artist',
    text: 'Kai Sterling & Sarah Preston'
  });

  const dockMeta = createElement('button', {
    className: 'dock-meta',
    props: { type: 'button' },
    dataset: { modalOpen: 'modal-player' },
    attrs: { title: 'Open Music Studio' },
    children: [dockTitle, dockArtist],
    events: {
      click: () => {
        if (typeof handlers.onExpand === 'function') handlers.onExpand();
      }
    }
  });

  const dockLeft = createElement('div', {
    className: 'dock-left',
    children: [dockVinyl, dockMeta]
  });

  // 2. Mini Frequency Spectrum Canvas
  const dockSpectrum = createElement('canvas', {
    id: 'dock-spectrum',
    className: 'dock-visualizer',
    attrs: { 'aria-hidden': 'true' }
  });

  // 3. Dock Controls (Prev, Play/Pause, Next, Volume, Expand)
  const prevSvg = createSvg('svg', {
    attrs: { viewBox: '0 0 24 24', width: '18', height: '18', fill: 'currentColor' },
    children: [createSvgPath('M6 6h2v12H6zm3.5 6 8.5 6V6z')]
  });

  const prevBtn = createElement('button', {
    id: 'dock-prev-btn',
    className: 'btn-dock-icon',
    props: { type: 'button' },
    attrs: { 'aria-label': 'Previous Track', title: 'Previous Track' },
    children: [prevSvg],
    events: {
      click: () => {
        if (typeof handlers.onPrev === 'function') handlers.onPrev();
      }
    }
  });

  const playSvg = createSvg('svg', {
    id: 'dock-play-icon',
    attrs: { viewBox: '0 0 24 24', width: '22', height: '22', fill: 'currentColor' },
    children: [createSvgPath('M8 5v14l11-7z')]
  });

  const pauseSvg = createSvg('svg', {
    id: 'dock-pause-icon',
    attrs: { viewBox: '0 0 24 24', width: '22', height: '22', fill: 'currentColor', style: 'display:none;' },
    children: [createSvgPath('M6 5h4v14H6zm8 0h4v14h-4z')]
  });

  const playBtn = createElement('button', {
    id: 'dock-play-btn',
    className: 'btn-dock-play',
    props: { type: 'button' },
    attrs: { 'aria-label': 'Play or Pause', title: 'Play / Pause' },
    children: [playSvg, pauseSvg],
    events: {
      click: () => {
        if (typeof handlers.onTogglePlay === 'function') handlers.onTogglePlay();
      }
    }
  });

  const nextSvg = createSvg('svg', {
    attrs: { viewBox: '0 0 24 24', width: '18', height: '18', fill: 'currentColor' },
    children: [createSvgPath('m6 18 8.5-6L6 6v12zm10-12v12h2V6h-2z')]
  });

  const nextBtn = createElement('button', {
    id: 'dock-next-btn',
    className: 'btn-dock-icon',
    props: { type: 'button' },
    attrs: { 'aria-label': 'Next Track', title: 'Next Track' },
    children: [nextSvg],
    events: {
      click: () => {
        if (typeof handlers.onNext === 'function') handlers.onNext();
      }
    }
  });

  // Individual Device Volume Slider Box
  const volHighSvg = createSvg('svg', {
    id: 'dock-vol-icon-high',
    attrs: { viewBox: '0 0 24 24', width: '18', height: '18', fill: 'none', stroke: 'currentColor', 'stroke-width': '2' },
    children: [
      createSvgPath('M11 5L6 9H2v6h4l5 4V5z'),
      createSvgPath('M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07')
    ]
  });

  const volMutedSvg = createSvg('svg', {
    id: 'dock-vol-icon-muted',
    attrs: { viewBox: '0 0 24 24', width: '18', height: '18', fill: 'none', stroke: 'currentColor', 'stroke-width': '2', style: 'display:none;' },
    children: [
      createSvgPath('M11 5L6 9H2v6h4l5 4V5z'),
      createSvgPath('M23 9l-6 6m0-6l6 6')
    ]
  });

  const volBtn = createElement('button', {
    id: 'dock-volume-btn',
    className: 'btn-dock-icon',
    props: { type: 'button' },
    attrs: { 'aria-label': 'Toggle Mute', title: 'Individual Volume' },
    children: [volHighSvg, volMutedSvg],
    events: {
      click: () => {
        if (typeof handlers.onToggleMute === 'function') handlers.onToggleMute();
      }
    }
  });

  const volSlider = createElement('input', {
    id: 'dock-volume-slider',
    className: 'volume-slider-dock',
    props: {
      type: 'range',
      min: '0',
      max: '100',
      value: '85'
    },
    attrs: {
      'aria-label': 'Individual Volume',
      title: 'Individual Volume'
    },
    events: {
      input: (e) => {
        if (typeof handlers.onVolumeChange === 'function') {
          handlers.onVolumeChange(parseFloat(e.target.value));
        }
      }
    }
  });

  const volSliderBox = createElement('div', {
    className: 'dock-volume-slider-box',
    children: [volSlider]
  });

  const volWrap = createElement('div', {
    className: 'dock-volume-wrap',
    children: [volBtn, volSliderBox]
  });

  // Expand Player Modal Button
  const expandSvg = createSvg('svg', {
    attrs: {
      viewBox: '0 0 24 24',
      width: '16',
      height: '16',
      fill: 'none',
      stroke: 'currentColor',
      'stroke-width': '2',
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round'
    },
    children: [
      createSvg('polyline', { attrs: { points: '15 3 21 3 21 9' } }),
      createSvg('polyline', { attrs: { points: '9 21 3 21 3 15' } }),
      createSvg('line', { attrs: { x1: '21', y1: '3', x2: '14', y2: '10' } }),
      createSvg('line', { attrs: { x1: '3', y1: '21', x2: '10', y2: '14' } })
    ]
  });

  const expandBtn = createElement('button', {
    id: 'dock-expand-btn',
    className: 'btn-dock-expand',
    props: { type: 'button' },
    dataset: { modalOpen: 'modal-player' },
    attrs: { 'aria-label': 'Expand Player', title: 'Full Studio Player' },
    children: [expandSvg],
    events: {
      click: () => {
        if (typeof handlers.onExpand === 'function') handlers.onExpand();
      }
    }
  });

  const controls = createElement('div', {
    className: 'dock-controls',
    children: [prevBtn, playBtn, nextBtn, volWrap, expandBtn]
  });

  return createElement('aside', {
    className: 'mini-player-dock',
    attrs: { 'aria-label': 'Persistent Audio Player' },
    children: [dockLeft, dockSpectrum, controls]
  });
}
