// PURPOSE: Programmatically constructs the redesigned Resident Artists & Producers showcase section.
// INTEGRATION: Features luxury glass portrait cards, role badges in Icky Green, and triggers the artists roster modal.
// INPUT: Artist selection and modal open handlers.
// OUTPUT: Semantic HTMLElement (<section id="artists" class="screen-section artists-section">).

import { createElement } from '../common/dom.js';

/**
 * Creates an individual luxury glass artist portrait card.
 * @param {Object} artist - Artist data
 * @param {Function} [onOpen] - Click handler
 * @returns {HTMLElement} The artist card element
 */
function createLuxuryArtistCard(artist, onOpen) {
  const img = createElement('img', {
    attrs: {
      src: artist.photo,
      alt: `${artist.name} Portrait`,
      loading: 'lazy'
    }
  });

  const roleTag = createElement('span', {
    className: 'artist-role-badge',
    text: artist.role
  });

  const nameDiv = createElement('h3', {
    className: 'artist-name',
    text: artist.name
  });

  const gearSpan = createElement('span', {
    className: 'artist-gear-text',
    text: `🎙 ${artist.gear}`
  });

  const listenersSpan = createElement('span', {
    className: 'artist-listeners-text',
    text: `● ${artist.listeners} monthly`
  });

  const metaRow = createElement('div', {
    className: 'artist-meta-row',
    children: [gearSpan, listenersSpan]
  });

  const overlay = createElement('div', {
    className: 'artist-glass-overlay',
    children: [roleTag, nameDiv, metaRow]
  });

  return createElement('div', {
    className: 'luxury-artist-card tilt-card',
    dataset: { modalOpen: 'modal-artists' },
    attrs: { title: `View profile for ${artist.name}` },
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
  const tagPill = createElement('div', {
    className: 'section-category-pill',
    text: '// STUDIO COLLECTIVE'
  });

  const labelTitle = createElement('h2', {
    className: 'section-label-title',
    text: 'RESIDENT ARTISTS'
  });

  const summary = createElement('p', {
    className: 'section-summary-text',
    text: 'Visionary songwriters, sound designers, and multi-instrumentalists shaping contemporary electronic and acoustic frontiers.'
  });

  const headerGroup = createElement('div', {
    className: 'section-header-group',
    children: [tagPill, labelTitle, summary]
  });

  const artists = [
    {
      id: 'marcus-vance',
      name: 'Marcus Vance',
      role: 'Saxophone & Sound Design',
      gear: 'Neve 8048 / Selmer Mark VI',
      listeners: '3.4M',
      photo: './assets/images/artist_marcus.jpg'
    },
    {
      id: 'kai-sterling',
      name: 'Kai Sterling',
      role: 'Vocals & Analog Synths',
      gear: 'Studer A820 / Prophet-5',
      listeners: '5.2M',
      photo: './assets/images/artist_kai.jpg'
    },
    {
      id: 'elena-cruz',
      name: 'Elena Cruz',
      role: 'Electronic Composer',
      gear: 'Moog One / Telefunken U47',
      listeners: '2.8M',
      photo: './assets/images/artist_elena.jpg'
    }
  ];

  const cards = artists.map((art) =>
    createLuxuryArtistCard(art, handlers.onOpenArtists)
  );

  const cardGrid = createElement('div', {
    className: 'luxury-artist-grid',
    children: cards
  });

  const viewArtistsBtn = createElement('button', {
    className: 'btn-pill-glass',
    props: { type: 'button' },
    dataset: { modalOpen: 'modal-artists' },
    children: [createElement('span', { text: 'View Full Artist Roster ↗' })],
    events: {
      click: () => {
        if (typeof handlers.onOpenArtists === 'function') handlers.onOpenArtists();
      }
    }
  });

  const content = createElement('div', {
    className: 'artists-content',
    children: [headerGroup, cardGrid, viewArtistsBtn]
  });

  return createElement('section', {
    id: 'artists',
    className: 'screen-section artists-section',
    attrs: { 'aria-label': 'Resident Artists Section' },
    children: [content]
  });
}
