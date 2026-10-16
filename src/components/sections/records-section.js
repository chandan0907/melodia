// PURPOSE: Programmatically constructs the redesigned Records & Featured Discography section.
// INTEGRATION: Features an interactive 4-album glass grid with sliding vinyl hover physics,
// studio playback triggers, discography modal launcher, and the Spotify Spotlight console.
// INPUT: Album selection callbacks, Spotify login trigger, and embed toggling.
// OUTPUT: Semantic HTMLElement (<section id="records" class="screen-section records-section">).

import { createElement, createSvg, createSvgPath } from '../common/dom.js';

/**
 * Creates an individual interactive glass album card with a sliding vinyl record.
 * @param {Object} record - Record data object
 * @param {Function} [onPlay] - Play callback
 * @returns {HTMLElement} The record card element
 */
function createInteractiveRecordCard(record, onPlay) {
  // 1. Vinyl disc that slides out from behind the sleeve on hover
  const vinylGroove = createElement('div', {
    className: 'album-vinyl-groove',
    children: [
      createElement('div', {
        className: 'album-vinyl-label',
        children: [
          createElement('img', {
            attrs: { src: record.cover, alt: `${record.title} Label`, loading: 'lazy' }
          })
        ]
      })
    ]
  });

  // 2. Sleeve Jacket Cover
  const sleeveImg = createElement('img', {
    attrs: {
      src: record.cover,
      alt: `${record.title} Album Cover`,
      loading: 'lazy'
    }
  });

  const playSvg = createSvg('svg', {
    attrs: { viewBox: '0 0 24 24', width: '24', height: '24', fill: '#0f130a' },
    children: [createSvgPath('M8 5v14l11-7z')]
  });

  const playRing = createElement('div', {
    className: 'card-play-ring',
    attrs: { title: `Play ${record.title}` },
    children: [playSvg]
  });

  const sleeveCover = createElement('div', {
    className: 'album-sleeve-jacket',
    children: [sleeveImg, playRing]
  });

  // 3. Album Meta Information
  const genreTag = createElement('span', {
    className: 'album-card-genre',
    text: record.genre
  });

  const albumTitle = createElement('h3', {
    className: 'album-card-title',
    text: record.title
  });

  const albumArtist = createElement('p', {
    className: 'album-card-artist',
    text: record.artist
  });

  const tracksCount = createElement('span', {
    className: 'album-card-tracks',
    text: `▶ ${record.tracks ? record.tracks.length : 4} Tracks`
  });

  const footerRow = createElement('div', {
    className: 'album-card-footer',
    children: [genreTag, tracksCount]
  });

  const metaBox = createElement('div', {
    className: 'album-card-meta',
    children: [albumTitle, albumArtist, footerRow]
  });

  return createElement('div', {
    className: 'interactive-album-card tilt-card',
    dataset: { playAlbum: record.id },
    children: [vinylGroove, sleeveCover, metaBox],
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
  // 1. Section Headings
  const tagPill = createElement('div', {
    className: 'section-category-pill',
    text: '// MASTER DISCOGRAPHY'
  });

  const labelTitle = createElement('h2', {
    className: 'section-label-title',
    text: 'STUDIO RELEASES'
  });

  const summary = createElement('p', {
    className: 'section-summary-text',
    text: 'Direct transfers from 2-inch multi-track master tapes. Tap any album to play immediately in studio fidelity or preview the sliding vinyl.'
  });

  const headerGroup = createElement('div', {
    className: 'section-header-group',
    children: [tagPill, labelTitle, summary]
  });

  // 2. Showcase grid of 4 albums
  const albums = [
    {
      id: 'awarapan-2',
      title: 'Awarapan 2',
      artist: 'Mustafa Zahid · Pritam',
      genre: 'Sufi Rock / Cinematic',
      cover: './assets/images/album_awarapan.jpg',
      tracks: [1, 2, 3, 4, 5]
    },
    {
      id: 'love',
      title: 'love',
      artist: 'Kai Sterling & Sarah Preston',
      genre: 'Ambient R&B / Neo-Soul',
      cover: './assets/images/album_love.jpg',
      tracks: [1, 2, 3, 4]
    },
    {
      id: 'imagination',
      title: 'IMAGINATION',
      artist: 'Marcus Vance',
      genre: 'Cosmic Funk / Neo-Soul',
      cover: './assets/images/album_imagination.jpg',
      tracks: [1, 2, 3, 4]
    },
    {
      id: 'dreamer',
      title: 'The Dreamer',
      artist: 'Elena Rostova',
      genre: 'Atmospheric Modular Synth',
      cover: './assets/images/album_dreamer.jpg',
      tracks: [1, 2, 3, 4]
    }
  ];

  const albumCards = albums.map((alb) =>
    createInteractiveRecordCard(alb, handlers.onPlayAlbum)
  );

  const albumGrid = createElement('div', {
    className: 'interactive-album-grid',
    children: albumCards
  });

  // 3. View Discography Button
  const discographyBtn = createElement('button', {
    className: 'btn-pill-glass',
    props: { type: 'button' },
    dataset: { modalOpen: 'modal-records' },
    children: [createElement('span', { text: 'View Full Master Vault ↗' })],
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
    children: [headerGroup, albumGrid, discographyBtn, spotlightBar]
  });

  return createElement('section', {
    id: 'records',
    className: 'screen-section records-section',
    attrs: { 'aria-label': 'Featured Records Section' },
    children: [content]
  });
}
