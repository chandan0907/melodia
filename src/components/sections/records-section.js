// PURPOSE: Programmatically constructs the Records & Featured Discography section.
// INTEGRATION: Features 3D tilt album covers that trigger studio playback, discography modal trigger,
// and the Spotify Featured Spotlight bar with OAuth connect and embedded web player.
// INPUT: Album selection callbacks, Spotify login trigger, and embed toggling.
// OUTPUT: Semantic HTMLElement (<section id="records" class="screen-section">).

import { createElement, createSvg, createSvgPath } from '../common/dom.js';

/**
 * Creates an individual 3D album cover showcase card.
 * @param {Object} record - Record data object
 * @param {string} positionClass - 'card-side-left' | 'card-center' | 'card-side-right'
 * @param {Function} [onPlay] - Play callback
 * @returns {HTMLElement} The record card element
 */
function createRecordCoverCard(record, positionClass, onPlay) {
  const img = createElement('img', {
    attrs: {
      src: record.cover,
      alt: `${record.title} Album Cover`,
      loading: 'lazy'
    }
  });

  const playSvg = createSvg('svg', {
    attrs: { viewBox: '0 0 24 24', width: positionClass === 'card-center' ? '28' : '26', height: positionClass === 'card-center' ? '28' : '26', fill: '#fff' },
    children: [createSvgPath('M8 5v14l11-7z')]
  });

  const ringStyle = positionClass === 'card-center'
    ? 'background: linear-gradient(135deg, #1ed760, #15803d); box-shadow: 0 8px 25px rgba(30, 215, 96, 0.6);'
    : '';

  const playRing = createElement('div', {
    className: 'play-ring-btn',
    attrs: ringStyle ? { style: ringStyle } : {},
    children: [playSvg]
  });

  const overlay = createElement('div', {
    className: 'record-play-overlay',
    children: [playRing]
  });

  return createElement('div', {
    className: `record-cover-card ${positionClass} tilt-card`,
    dataset: { playAlbum: record.id },
    attrs: { title: `Play ${record.title}` },
    children: [img, overlay],
    events: {
      click: () => {
        if (typeof onPlay === 'function') onPlay(record.id);
      }
    }
  });
}

/**
 * Creates the Spotify Featured Spotlight Bar.
 * @param {Object} [handlers] - Event callbacks
 * @returns {HTMLElement} The spotlight bar element
 */
function createSpotifySpotlightBar(handlers = {}) {
  // 1. Spotify Badge
  const spotifyIco = createSvg('svg', {
    attrs: { viewBox: '0 0 24 24', width: '16', height: '16', fill: '#1ed760' },
    children: [createSvgPath('M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm4.586 14.424a.623.623 0 0 1-.857.206c-2.348-1.435-5.304-1.76-8.785-.964a.624.624 0 0 1-.277-1.218c3.808-.87 7.076-.496 9.713 1.119a.623.623 0 0 1 .206.857zm1.225-2.723a.78.78 0 0 1-1.072.257c-2.687-1.652-6.785-2.131-9.965-1.166a.78.78 0 0 1-.462-1.492c3.633-1.103 8.147-.568 11.242 1.33a.78.78 0 0 1 .257 1.071zm.105-2.835C14.693 8.92 9.4 8.745 6.32 9.68a.936.936 0 1 1-.546-1.792c3.526-1.07 9.38-.868 13.11 1.346a.936.936 0 1 1-.968 1.632z')]
  });

  const badge = createElement('div', {
    className: 'spotify-badge',
    children: [spotifyIco, createElement('span', { text: 'SPOTIFY FEATURED PLAYLIST' })]
  });

  // 2. Title & Subtitle
  const title = createElement('div', {
    className: 'spotify-spotlight-title',
    text: 'Awarapan 2 (All Songs) 🌼🕊️'
  });

  const sub = createElement('div', {
    className: 'spotify-spotlight-sub',
    text: 'Toh Phir Aao · Tera Mera Rishta Purana · Ve Mera Piya Ghar Aaya · Tumhare Liye · 89 Songs'
  });

  // 3. Actions
  const playSvg = createSvg('svg', {
    attrs: { viewBox: '0 0 24 24', width: '16', height: '16', fill: 'currentColor' },
    children: [createSvgPath('M8 5v14l11-7z')]
  });

  const playBtn = createElement('button', {
    id: 'btn-play-awarapan',
    className: 'btn-spotlight-play',
    props: { type: 'button' },
    dataset: { playAlbum: 'awarapan-2' },
    children: [playSvg, createElement('span', { text: 'Play in Melodia' })],
    events: {
      click: () => {
        if (typeof handlers.onPlayAwarapan === 'function') handlers.onPlayAwarapan();
      }
    }
  });

  const spotifyLink = createElement('a', {
    className: 'btn-spotlight-spotify',
    attrs: {
      href: 'https://open.spotify.com/playlist/0qRsizDqcvjuBkpbLZkL69?si=596dc0215bb648f1',
      target: '_blank',
      rel: 'noopener noreferrer'
    },
    children: [createElement('span', { text: 'Open on Spotify ↗' })]
  });

  const embedToggleBtn = createElement('button', {
    id: 'btn-toggle-spotify-embed',
    className: 'btn-spotlight-embed',
    props: { type: 'button' },
    children: [createElement('span', { text: '⚡ Toggle Spotify Player' })],
    events: {
      click: () => {
        if (typeof handlers.onToggleEmbed === 'function') handlers.onToggleEmbed();
      }
    }
  });

  const loginIco = createSvg('svg', {
    attrs: { viewBox: '0 0 24 24', width: '15', height: '15', fill: '#1ed760' },
    children: [createSvgPath('M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm4.586 14.424a.623.623 0 0 1-.857.206c-2.348-1.435-5.304-1.76-8.785-.964a.624.624 0 0 1-.277-1.218c3.808-.87 7.076-.496 9.713 1.119a.623.623 0 0 1 .206.857zm1.225-2.723a.78.78 0 0 1-1.072.257c-2.687-1.652-6.785-2.131-9.965-1.166a.78.78 0 0 1-.462-1.492c3.633-1.103 8.147-.568 11.242 1.33a.78.78 0 0 1 .257 1.071zm.105-2.835C14.693 8.92 9.4 8.745 6.32 9.68a.936.936 0 1 1-.546-1.792c3.526-1.07 9.38-.868 13.11 1.346a.936.936 0 1 1-.968 1.632z')]
  });

  const loginLabel = createElement('span', {
    id: 'spotify-login-label',
    text: 'Connect Spotify'
  });

  const loginBtn = createElement('button', {
    id: 'btn-spotify-login',
    className: 'btn-spotlight-connect',
    props: { type: 'button' },
    attrs: { title: 'Connect your Spotify Account' },
    children: [loginIco, loginLabel],
    events: {
      click: () => {
        if (typeof handlers.onSpotifyLogin === 'function') handlers.onSpotifyLogin();
      }
    }
  });

  const actions = createElement('div', {
    className: 'spotify-spotlight-actions',
    children: [playBtn, spotifyLink, embedToggleBtn, loginBtn]
  });

  // 4. Embedded Iframe Drawer
  const iframe = createElement('iframe', {
    attrs: {
      src: 'https://open.spotify.com/embed/playlist/0qRsizDqcvjuBkpbLZkL69?utm_source=generator&theme=0',
      width: '100%',
      height: '380',
      frameBorder: '0',
      allowfullscreen: '',
      allow: 'autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture',
      loading: 'lazy',
      style: 'border-radius:18px'
    }
  });

  const embedContainer = createElement('div', {
    id: 'spotify-embed-container',
    className: 'spotify-embed-container',
    props: { hidden: true },
    children: [iframe]
  });

  return createElement('div', {
    className: 'spotify-spotlight-bar',
    children: [badge, title, sub, actions, embedContainer]
  });
}

/**
 * Creates the complete Records Section.
 * @param {Object} [handlers] - Event callbacks
 * @returns {HTMLElement} The records section element
 */
export function createRecordsSection(handlers = {}) {
  // 1. Showcase row of 4 albums
  const albums = [
    { id: 'imagination', title: 'IMAGINATION', cover: './assets/images/album_imagination.jpg', pos: 'card-side-left' },
    { id: 'awarapan-2', title: 'Awarapan 2 (Spotify Featured)', cover: './assets/images/album_awarapan.jpg', pos: 'card-center' },
    { id: 'love', title: 'LOVE', cover: './assets/images/album_love.jpg', pos: 'card-side-right' },
    { id: 'dreamer', title: 'DREAMER', cover: './assets/images/album_dreamer.jpg', pos: 'card-side-right' }
  ];

  const showcaseCards = albums.map((alb) =>
    createRecordCoverCard(alb, alb.pos, handlers.onPlayAlbum)
  );

  const showcaseRow = createElement('div', {
    className: 'showcase-row',
    children: showcaseCards
  });

  // 2. Section Headings
  const labelTitle = createElement('h2', {
    className: 'section-label-title',
    text: 'RECORDS'
  });

  const summary = createElement('p', {
    className: 'section-summary-text',
    text: 'Exclusive master tape cuts, analog pressings, and chart-topping productions crafted within our custom acoustic chambers.'
  });

  // 3. View Discography Button
  const discographyBtn = createElement('button', {
    className: 'btn-pill-glass',
    props: { type: 'button' },
    dataset: { modalOpen: 'modal-records' },
    children: [createElement('span', { text: 'View Master Discography' })],
    events: {
      click: () => {
        if (typeof handlers.onOpenDiscography === 'function') handlers.onOpenDiscography();
      }
    }
  });

  // 4. Spotify Spotlight Bar
  const spotlightBar = createSpotifySpotlightBar(handlers);

  const content = createElement('div', {
    className: 'records-content',
    children: [showcaseRow, labelTitle, summary, discographyBtn, spotlightBar]
  });

  return createElement('section', {
    id: 'records',
    className: 'screen-section',
    attrs: { 'aria-label': 'Featured Records Section' },
    children: [content]
  });
}
