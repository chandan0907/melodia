// PURPOSE: Programmatically constructs the Hero landing section.
// INTEGRATION: First viewport section introducing Beat Records with calls-to-action to explore records or open the studio session player.
// INPUT: Navigation and modal opening callbacks.
// OUTPUT: Semantic HTMLElement (<section id="hero" class="screen-section">).
// SEO: Contains the primary <h1> semantic heading for the web application.

import { createElement, createSvg, createSvgPath } from '../common/dom.js';

/**
 * Creates the Hero screen section.
 * @param {Object} [handlers] - Event callbacks
 * @param {Function} [handlers.onExploreRecords] - Called when "Explore Records" is clicked
 * @param {Function} [handlers.onOpenPlayer] - Called when "Studio Session" is clicked
 * @returns {HTMLElement} The hero section element
 */
export function createHeroSection(handlers = {}) {
  // Primary <h1> Title
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

  // Subtitle
  const subtitle = createElement('p', {
    className: 'hero-subtitle',
    text: 'World Class Recording & Production'
  });

  // Action Buttons
  const playSvg = createSvg('svg', {
    attrs: { viewBox: '0 0 24 24', width: '18', height: '18', fill: 'currentColor' },
    children: [createSvgPath('M8 5v14l11-7z')]
  });

  const exploreBtn = createElement('button', {
    className: 'btn-pill-primary',
    props: { type: 'button' },
    dataset: { goto: 'records' },
    children: [
      playSvg,
      createElement('span', { text: 'Explore Records' })
    ],
    events: {
      click: (e) => {
        if (typeof handlers.onExploreRecords === 'function') handlers.onExploreRecords(e);
      }
    }
  });

  const sessionBtn = createElement('button', {
    className: 'btn-pill-glass',
    props: { type: 'button' },
    dataset: { modalOpen: 'modal-player' },
    children: [createElement('span', { text: 'Studio Session' })],
    events: {
      click: (e) => {
        if (typeof handlers.onOpenPlayer === 'function') handlers.onOpenPlayer(e);
      }
    }
  });

  const ctaGroup = createElement('div', {
    className: 'hero-cta-group',
    children: [exploreBtn, sessionBtn]
  });

  const content = createElement('div', {
    className: 'hero-content',
    children: [mainTitle, subtitle, ctaGroup]
  });

  return createElement('section', {
    id: 'hero',
    className: 'screen-section',
    attrs: { 'aria-label': 'Hero Section' },
    children: [content]
  });
}
