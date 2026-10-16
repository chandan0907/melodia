// Presentation only: all transport and record controls delegate to existing handlers.
import { createElement, createSvg, createSvgPath } from '../common/dom.js';
import { RECORDS, STUDIO_INFO } from '../../data.js';
import { createPlaylistCarousel } from './playlist-carousel.js';

function icon(path, size = 20, filled = false) {
  return createSvg('svg', {
    attrs: { viewBox: '0 0 24 24', width: size, height: size, fill: filled ? 'currentColor' : 'none', stroke: filled ? 'none' : 'currentColor', 'stroke-width': 1.6, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'aria-hidden': 'true' },
    children: [createSvgPath(path)]
  });
}

function action(label, className, onClick, children, extra = {}) {
  return createElement('button', { className, props: { type: 'button' }, attrs: { 'aria-label': label }, children, events: { click: onClick }, ...extra });
}

function createNowPlaying(handlers) {
  const progressFill = createElement('div', { id: 'hero-progress-fill', className: 'spotify-timeline-fill' });
  const progressDot = createElement('div', { id: 'hero-scrubber-dot', className: 'spotify-timeline-dot' });
  const progress = createElement('div', {
    id: 'hero-progress-bar', className: 'spotify-timeline-track',
    attrs: { role: 'slider', tabindex: '0', 'aria-label': 'Seek track', 'aria-valuemin': '0', 'aria-valuemax': '100', 'aria-valuenow': '0', 'aria-valuetext': '0:00' },
    children: [progressFill, progressDot],
    events: {
      click: (event) => {
        const rect = progress.getBoundingClientRect();
        handlers.onSeek?.(Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width)));
      },
      keydown: (event) => {
        const current = Number(progress.getAttribute('aria-valuenow')) || 0;
        const values = { ArrowRight: current + 5, ArrowUp: current + 5, ArrowLeft: current - 5, ArrowDown: current - 5, Home: 0, End: 100 };
        if (!(event.key in values)) return;
        event.preventDefault();
        event.stopPropagation();
        handlers.onSeek?.(Math.max(0, Math.min(100, values[event.key])) / 100);
      }
    }
  });
  const playIcon = icon('M8 5v14l11-7z', 25, true);
  playIcon.id = 'hero-play-icon';
  const pauseIcon = icon('M6 5h4v14H6zm8 0h4v14h-4z', 25, true);
  pauseIcon.id = 'hero-pause-icon';
  pauseIcon.style.display = 'none';
  const unsupported = (label, path) => action(label + ' unavailable', 'spotify-ctrl-btn', null, [icon(path)], {
    props: { type: 'button', disabled: true }, attrs: { 'aria-label': label + ' unavailable', title: `${label} is not supported by the current player` }
  });
  return createElement('section', {
    className: 'home-now-playing glass-panel', attrs: { 'aria-label': 'Now Playing' },
    children: [
      createElement('div', { className: 'panel-heading', children: [createElement('span', { className: 'eyebrow', text: 'Now playing' }), action('Open Studio Player', 'panel-link', () => handlers.onOpenPlayer?.(), [document.createTextNode('Music Studio'), icon('M7 17 17 7M7 7h10v10', 15)])] }),
      createElement('div', { className: 'now-playing-body', children: [
        createElement('div', { className: 'now-playing-art', children: [createElement('img', { id: 'hero-track-cover', attrs: { src: RECORDS[0].cover, alt: 'Current record artwork', width: '144', height: '144' } })] }),
        createElement('div', { className: 'now-playing-details', children: [
          createElement('span', { id: 'hero-track-album', className: 'now-playing-album', text: RECORDS[0].title }),
          createElement('h2', { id: 'hero-player-title', className: 'spotify-track-title', text: RECORDS[0].tracks[0].title }),
          createElement('p', { id: 'hero-player-artist', className: 'spotify-artist-name', text: RECORDS[0].artist }),
          progress,
          createElement('div', { className: 'spotify-time-row', children: [createElement('span', { id: 'hero-time-cur', text: '0:00' }), createElement('span', { id: 'hero-time-dur', text: RECORDS[0].tracks[0].duration })] }),
          createElement('div', { className: 'spotify-transport-row', children: [
            unsupported('Shuffle', 'M16 3h5v5M4 20 21 3M21 16v5h-5M15 15l6 6M4 4l5 5'),
            action('Previous Track', 'spotify-ctrl-btn', () => handlers.onPrev?.(), [icon('M6 6h2v12H6zm3.5 6 8.5 6V6z', 20, true)]),
            action('Play', 'spotify-play-ring-btn', () => handlers.onTogglePlay?.(), [playIcon, pauseIcon], { id: 'hero-play-pause-btn' }),
            action('Next Track', 'spotify-ctrl-btn', () => handlers.onNext?.(), [icon('m6 18 8.5-6L6 6v12zm10-12v12h2V6h-2z', 20, true)]),
            unsupported('Repeat', 'm17 2 4 4-4 4M3 11V9a3 3 0 0 1 3-3h15M7 22l-4-4 4-4m14-1v2a3 3 0 0 1-3 3H3')
          ] })
        ] })
      ] })
    ]
  });
}

function createTrackList(handlers) {
  // Preserve existing row destinations/order; display their actual record metadata.
  const destinations = [[0, 0], [1, 0], [2, 0], [3, 0], [0, 1]];
  const rows = destinations.map(([recordIndex, trackIndex], index) => {
    const record = RECORDS[recordIndex];
    const track = record.tracks[trackIndex];
    return action(`Play ${track.title} by ${track.singer || record.artist}`, 'spotify-queue-row', () => handlers.onSelectTrack?.(record.id, trackIndex), [
      createElement('span', { className: 'queue-number', text: String(index + 1).padStart(2, '0') }),
      createElement('img', { className: 'spotify-queue-thumb', attrs: { src: record.cover, alt: '', width: '36', height: '36', loading: 'lazy' } }),
      createElement('span', { className: 'spotify-queue-meta', children: [createElement('span', { className: 'spotify-queue-title', text: track.title }), createElement('span', { className: 'spotify-queue-artist', text: track.singer || record.artist })] }),
      createElement('span', { className: 'queue-duration', text: track.duration })
    ], { dataset: { playQueueAlbum: record.id, playQueueIndex: String(trackIndex) } });
  });
  return createElement('section', { className: 'home-track-list glass-panel', attrs: { 'aria-label': 'Tracks from the collection' }, children: [
    createElement('div', { className: 'panel-heading', children: [createElement('h2', { className: 'eyebrow', text: 'On rotation' }), createElement('span', { className: 'panel-meta', text: 'From the collection' })] }),
    createElement('div', { className: 'spotify-queue-container', children: rows })
  ] });
}

export function createHeroSection(handlers = {}) {
  return createElement('section', {
    id: 'hero', className: 'screen-section hero-section', attrs: { 'aria-label': `${STUDIO_INFO.name} music home` },
    children: [
      createElement('div', { className: 'home-brand-area', children: [
        createElement('p', { className: 'eyebrow home-kicker', children: [createElement('span', { className: 'home-status-dot', attrs: { 'aria-hidden': 'true' } }), document.createTextNode('A space for good music')] }),
        createElement('h1', { className: 'hero-main-title', text: STUDIO_INFO.name }),
        createElement('p', { className: 'hero-subtitle', text: 'Find your sound. Stay a little longer.' })
      ] }),
      createPlaylistCarousel({ records: RECORDS, onActivate: (record) => handlers.onSelectTrack?.(record.id, 0) }),
      createElement('div', { className: 'home-listening-grid', children: [createNowPlaying(handlers), createTrackList(handlers)] }),
      createElement('div', { className: 'home-together-strip', children: [
        createElement('div', { className: 'home-together-copy', children: [icon('M3 14v-3a9 9 0 0 1 18 0v3M3 13h3v7H3zm15 0h3v7h-3'), createElement('div', { children: [createElement('h2', { text: 'Better, together.' }), createElement('p', { text: 'One room. The same song. Your people.' })] })] }),
        action('Start Listening Room', 'btn-pill-glass', () => handlers.onStartRoom?.(), [document.createTextNode('Listen Together'), icon('M5 12h14m-5-5 5 5-5 5', 17)])
      ] })
    ]
  });
}
