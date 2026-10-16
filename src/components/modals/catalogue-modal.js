// PURPOSE: Programmatically constructs the Discography & Master Records modal dialogue.
// INTEGRATION: Populates the discography catalogue from data.js and allows users to click and load releases.
// INPUT: Record selection callback and modal close handler.
// OUTPUT: Semantic HTMLElement (<div id="modal-records" class="glass-modal-backdrop">).
// SECURITY: Builds every catalogue card item programmatically with safe DOM methods; zero innerHTML.

import { createElement } from '../common/dom.js';
import { RECORDS } from '../../data.js';

/**
 * Creates an individual catalogue card element for a record release.
 * @param {Object} rec - Record metadata from data.js
 * @param {Function} [onSelectRecord] - Click callback receiving record ID
 * @returns {HTMLElement} The catalogue card element
 */
function createRecordCard(rec, onSelectRecord) {
  const img = createElement('img', {
    attrs: {
      src: rec.cover,
      alt: rec.title,
      loading: 'lazy'
    }
  });

  const title = createElement('h4', { text: rec.title });
  const artist = createElement('p', { text: rec.artist });

  const metaSpan = createElement('span', {
    attrs: { style: 'font-size:0.8rem; color:var(--color-sage); font-weight:400;' },
    text: `▶ ${rec.tracks ? rec.tracks.length : 0} Master Tracks · ${rec.genre || 'Master Tape'}`
  });

  const footer = createElement('div', {
    attrs: {
      style: 'display:flex; justify-content:space-between; align-items:center; margin-top:6px; flex-wrap:wrap; gap:4px;'
    },
    children: [metaSpan]
  });

  if (rec.spotifyUrl) {
    const spotifyBadge = createElement('span', {
      attrs: {
        style: 'font-size:0.75rem; color:var(--color-leaf); font-weight:500; background:var(--glass-bg); padding:2px 8px; border-radius:999px;'
      },
      text: '● Spotify'
    });
    footer.appendChild(spotifyBadge);
  }

  return createElement('button', {
    className: 'catalogue-card',
    props: { type: 'button' },
    attrs: { 'aria-label': `Play ${rec.title} by ${rec.artist}` },
    dataset: { playRecord: rec.id },
    children: [img, title, artist, footer],
    events: {
      click: () => {
        if (typeof onSelectRecord === 'function') onSelectRecord(rec.id);
      }
    }
  });
}

/**
 * Creates the complete Discography Catalogue Modal.
 * @param {Object} [handlers] - Event callbacks
 * @param {Function} [handlers.onSelectRecord] - Called when a record card is clicked
 * @param {Function} [handlers.onClose] - Called when modal is closed
 * @returns {HTMLElement} The modal backdrop element
 */
export function createCatalogueModal(handlers = {}) {
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
    text: 'Discography & master records'
  });

  const headerDesc = createElement('p', {
    className: 'modal-header-desc',
    text: 'Click any release below to load directly into the studio playback engine.'
  });

  // Build catalogue card grid programmatically
  const recordCards = RECORDS.map((rec) =>
    createRecordCard(rec, handlers.onSelectRecord)
  );

  const catalogueList = createElement('div', {
    id: 'records-catalogue-list',
    className: 'catalogue-grid',
    children: recordCards
  });

  const modalCard = createElement('div', {
    className: 'glass-modal-card',
    children: [closeBtn, headerTitle, headerDesc, catalogueList]
  });

  const modalBackdrop = createElement('div', {
    id: 'modal-records',
    className: 'glass-modal-backdrop',
    attrs: {
      role: 'dialog',
      'aria-modal': 'true',
      'aria-label': 'Master Records Catalogue'
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
