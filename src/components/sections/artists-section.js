// PURPOSE: Programmatically constructs the Resident Artists & Producers showcase section.
// INTEGRATION: Features 3D tilt artist profile cards and triggers the artists roster modal.
// INPUT: Artist selection and modal open handlers.
// OUTPUT: Semantic HTMLElement (<section id="artists" class="screen-section">).

import { createElement } from '../common/dom.js';

/**
 * Creates an individual 3D artist card.
 * @param {Object} artist - Artist data
 * @param {string} posClass - Position modifier class
 * @param {Function} [onOpen] - Click handler
 * @returns {HTMLElement} The artist card element
 */
function createArtistCard(artist, posClass, onOpen) {
  const img = createElement('img', {
    attrs: {
      src: artist.photo,
      alt: artist.name,
      loading: 'lazy'
    }
  });

  const nameDiv = createElement('div', {
    className: 'artist-name',
    text: artist.name
  });

  const roleTag = createElement('div', {
    className: 'artist-role-tag',
    text: artist.role
  });

  const overlay = createElement('div', {
    className: 'artist-info-overlay',
    children: [nameDiv, roleTag]
  });

  return createElement('div', {
    className: `artist-card ${posClass} tilt-card`,
    dataset: { modalOpen: 'modal-artists' },
    attrs: { title: artist.name },
    children: [img, overlay],
    events: {
      click: () => {
        if (typeof onOpen === 'function') onOpen(artist.id);
      }
    }
  });
}

/**
 * Creates the complete Artists Section.
 * @param {Object} [handlers] - Event callbacks
 * @returns {HTMLElement} The artists section element
 */
export function createArtistsSection(handlers = {}) {
  const artists = [
    { id: 'marcus-vance', name: 'Marcus Vance', role: 'Saxophone & Sound Design', photo: './assets/images/artist_marcus.jpg', pos: 'card-side-left' },
    { id: 'kai-sterling', name: 'Kai Sterling', role: 'Vocals & Analog Synths', photo: './assets/images/artist_kai.jpg', pos: 'card-center' },
    { id: 'elena-cruz', name: 'Elena Cruz', role: 'Electronic Composer', photo: './assets/images/artist_elena.jpg', pos: 'card-side-right' }
  ];

  const cards = artists.map((art) =>
    createArtistCard(art, art.pos, handlers.onOpenArtists)
  );

  const cardGrid = createElement('div', {
    className: 'artist-card-grid',
    children: cards
  });

  const labelTitle = createElement('h2', {
    className: 'section-label-title',
    text: 'ARTISTS'
  });

  const summary = createElement('p', {
    className: 'section-summary-text',
    text: 'Visionary songwriters, sound designers, and multi-instrumentalists shaping contemporary electronic and acoustic frontiers.'
  });

  const viewArtistsBtn = createElement('button', {
    className: 'btn-pill-glass',
    props: { type: 'button' },
    dataset: { modalOpen: 'modal-artists' },
    children: [createElement('span', { text: 'View Artists' })],
    events: {
      click: () => {
        if (typeof handlers.onOpenArtists === 'function') handlers.onOpenArtists();
      }
    }
  });

  const content = createElement('div', {
    className: 'artists-content',
    children: [cardGrid, labelTitle, summary, viewArtistsBtn]
  });

  return createElement('section', {
    id: 'artists',
    className: 'screen-section',
    attrs: { 'aria-label': 'Studio Artists Section' },
    children: [content]
  });
}
