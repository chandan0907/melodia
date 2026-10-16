// PURPOSE: Programmatically constructs the Resident Artists & Producers roster modal dialogue.
// INTEGRATION: Populates the artist profiles from data.js.
// INPUT: Modal close callback.
// OUTPUT: Semantic HTMLElement (<div id="modal-artists" class="glass-modal-backdrop">).
// SECURITY: Builds every artist card item programmatically using safe DOM APIs; zero innerHTML.

import { createElement } from '../common/dom.js';
import { ARTISTS } from '../../data.js';

/**
 * Creates an individual artist profile card element.
 * @param {Object} artist - Artist metadata from data.js
 * @returns {HTMLElement} The artist card element
 */
function createArtistRosterCard(artist) {
  const img = createElement('img', {
    attrs: {
      src: artist.photo,
      alt: artist.name,
      loading: 'lazy',
      style: 'height: 220px; object-fit: cover;'
    }
  });

  const name = createElement('h4', {
    attrs: { style: 'font-size:1.2rem;' },
    text: artist.name
  });

  const role = createElement('p', {
    attrs: { style: 'color: #bcd643; font-size:0.85rem; font-weight:600;' },
    text: artist.role
  });

  const bio = createElement('p', {
    attrs: { style: 'margin-top:8px; line-height: 1.5; font-size:0.82rem;' },
    text: artist.bio
  });

  const gearDiv = createElement('div', {
    text: `🎙 Preferred: ${artist.favoriteGear}`
  });

  const listenersDiv = createElement('div', {
    attrs: { style: 'margin-top:4px;' },
    text: `🎧 ${artist.listeners}`
  });

  const footer = createElement('div', {
    attrs: {
      style: 'margin-top:12px; padding-top:10px; border-top:1px solid rgba(255,255,255,0.08); font-size:0.75rem; color: #9e96b3;'
    },
    children: [gearDiv, listenersDiv]
  });

  return createElement('div', {
    className: 'catalogue-card',
    attrs: { style: 'cursor: default;' },
    children: [img, name, role, bio, footer]
  });
}

/**
 * Creates the complete Artists Roster Modal.
 * @param {Object} [handlers] - Event callbacks
 * @param {Function} [handlers.onClose] - Called when modal is closed
 * @returns {HTMLElement} The modal backdrop element
 */
export function createArtistsModal(handlers = {}) {
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

  const headerTitle = createElement('h3', {
    className: 'modal-header-title',
    text: 'RESIDENT ARTISTS & PRODUCERS'
  });

  const headerDesc = createElement('p', {
    className: 'modal-header-desc',
    text: 'Meet the sonic pioneers crafting music at Beat Records & Melodia Studio.'
  });

  const artistCards = ARTISTS.map((artist) =>
    createArtistRosterCard(artist)
  );

  const catalogueList = createElement('div', {
    id: 'artists-catalogue-list',
    className: 'catalogue-grid',
    children: artistCards
  });

  const modalCard = createElement('div', {
    className: 'glass-modal-card',
    children: [closeBtn, headerTitle, headerDesc, catalogueList]
  });

  const modalBackdrop = createElement('div', {
    id: 'modal-artists',
    className: 'glass-modal-backdrop',
    attrs: {
      role: 'dialog',
      'aria-modal': 'true',
      'aria-label': 'Studio Artists Roster'
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
