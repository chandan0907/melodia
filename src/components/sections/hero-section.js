// PURPOSE: Programmatically constructs the redesigned Hero landing section.
// INTEGRATION: First viewport section introducing Beat Records with calls-to-action to explore records,
// launch synchronized listening rooms, and interact with the 3D spinning turntable showcase.
// INPUT: Navigation and modal opening callbacks.
// OUTPUT: Semantic HTMLElement (<section id="hero" class="screen-section hero-section">).
// SEO: Contains the primary <h1> semantic heading for the web application.

import { createElement, createSvg, createSvgPath } from '../common/dom.js';

/**
 * Creates the Hero screen section.
 * @param {Object} [handlers] - Event callbacks
 * @param {Function} [handlers.onExploreRecords] - Called when "Explore Records" is clicked
 * @param {Function} [handlers.onOpenPlayer] - Called when "Studio Session" is clicked
 * @param {Function} [handlers.onPlaySpotlight] - Called when "Play Spotlight Master" is clicked
 * @param {Function} [handlers.onStartRoom] - Called when "Start Listening Room" is clicked
 * @returns {HTMLElement} The hero section element
 */
export function createHeroSection(handlers = {}) {
  // 1. Top animated status badge
  const statusDot = createElement('span', { className: 'hero-status-dot' });
  const statusText = createElement('span', { text: 'PULLMAN ACOUSTICS · 24-BIT HI-RES ROOMS' });
  const statusBadge = createElement('div', {
    className: 'hero-status-badge',
    children: [statusDot, statusText]
  });

  // 2. Giant Typography
  const lineSub = createElement('span', {
    className: 'line-sub',
    text: 'RECORDS'
  });

  const mainTitle = createElement('h1', {
    className: 'hero-main-title',
    children: [
      document.createTextNode('BEAT '),
      lineSub
    ]
  });

  const tagline = createElement('p', {
    className: 'hero-tagline',
    text: 'ANALOG WARMTH. REAL-TIME SYNC.'
  });

  const subtitle = createElement('p', {
    className: 'hero-subtitle',
    text: 'Experience master tape sessions with acoustic fidelity. Host private synchronized listening rooms and stream with friends in real time.'
  });

  // 3. CTA Buttons
  const playSvg = createSvg('svg', {
    attrs: { viewBox: '0 0 24 24', width: '18', height: '18', fill: 'currentColor' },
    children: [createSvgPath('M8 5v14l11-7z')]
  });

  const playBtn = createElement('button', {
    className: 'btn-pill-primary hero-btn-play',
    props: { type: 'button' },
    children: [
      playSvg,
      createElement('span', { text: 'Play Spotlight Master' })
    ],
    events: {
      click: (e) => {
        if (typeof handlers.onPlaySpotlight === 'function') {
          handlers.onPlaySpotlight(e);
        } else if (typeof handlers.onExploreRecords === 'function') {
          handlers.onExploreRecords(e);
        }
      }
    }
  });

  const roomSvg = createSvg('svg', {
    attrs: {
      viewBox: '0 0 24 24',
      width: '18',
      height: '18',
      fill: 'none',
      stroke: 'currentColor',
      'stroke-width': '2',
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round'
    },
    children: [
      createSvgPath('M3 18v-6a9 9 0 0 1 18 0v6'),
      createSvgPath('M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z')
    ]
  });

  const roomBtn = createElement('button', {
    className: 'btn-pill-glass hero-btn-room',
    props: { type: 'button' },
    children: [
      roomSvg,
      createElement('span', { text: 'Start Listening Room' })
    ],
    events: {
      click: (e) => {
        if (typeof handlers.onStartRoom === 'function') {
          handlers.onStartRoom(e);
        } else if (typeof handlers.onOpenPlayer === 'function') {
          handlers.onOpenPlayer(e);
        }
      }
    }
  });

  const ctaGroup = createElement('div', {
    className: 'hero-cta-group',
    children: [playBtn, roomBtn]
  });

  // Telemetry row
  const telemetry = createElement('div', {
    className: 'hero-telemetry-row',
    children: [
      createElement('span', { className: 'telemetry-item', text: '● 24-BIT / 96kHz MASTER' }),
      createElement('span', { className: 'telemetry-item', text: '● WEBRTC LOW-LATENCY MESH' }),
      createElement('span', { className: 'telemetry-item', text: '● DUAL YOUTUBE / SYNTH' })
    ]
  });

  const leftContent = createElement('div', {
    className: 'hero-left-content',
    children: [statusBadge, mainTitle, tagline, subtitle, ctaGroup, telemetry]
  });

  // 4. Hero Showcase Turntable Glass Card
  const vinylImg = createElement('img', {
    attrs: {
      src: './assets/images/album_awarapan.jpg',
      alt: 'Awarapan 2 Master Disc Cover',
      loading: 'eager'
    }
  });

  const vinylDisc = createElement('div', {
    id: 'hero-vinyl-disc',
    className: 'hero-turntable-vinyl spinning',
    children: [
      createElement('div', {
        className: 'hero-vinyl-center',
        children: [vinylImg]
      })
    ]
  });

  const playOverlayBtn = createElement('div', {
    className: 'hero-turntable-play-trigger',
    attrs: { title: 'Play / Pause Master Session' },
    children: [
      createSvg('svg', {
        attrs: { viewBox: '0 0 24 24', width: '26', height: '26', fill: '#0f130a' },
        children: [createSvgPath('M8 5v14l11-7z')]
      })
    ]
  });

  // Equalizer visualizer wave bars
  const eqBars = Array.from({ length: 16 }, (_, i) =>
    createElement('span', { className: `hero-eq-bar bar-${(i % 5) + 1}` })
  );

  const eqWave = createElement('div', {
    className: 'hero-eq-wave',
    children: eqBars
  });

  const nowPlayingLabel = createElement('div', {
    className: 'hero-turntable-nowplaying',
    children: [
      createElement('span', { className: 'nowplaying-tag', text: 'FEATURED MASTER RELEASE' }),
      createElement('h4', { text: 'Toh Phir Aao · Awarapan 2' }),
      createElement('p', { text: 'Mustafa Zahid · Sufi Rock / Melodic Noir' })
    ]
  });

  const turntableCard = createElement('div', {
    className: 'hero-turntable-card tilt-card',
    children: [vinylDisc, playOverlayBtn, nowPlayingLabel, eqWave],
    events: {
      click: () => {
        if (typeof handlers.onPlaySpotlight === 'function') {
          handlers.onPlaySpotlight();
        } else if (typeof handlers.onOpenPlayer === 'function') {
          handlers.onOpenPlayer();
        }
      }
    }
  });

  const heroGrid = createElement('div', {
    className: 'hero-grid',
    children: [leftContent, turntableCard]
  });

  return createElement('section', {
    id: 'hero',
    className: 'screen-section hero-section',
    attrs: { 'aria-label': 'Hero Section' },
    children: [heroGrid]
  });
}
