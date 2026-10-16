// PURPOSE: Programmatically constructs the responsive bottom mobile navigation bar.
// INTEGRATION: Provides navigation touch targets on mobile devices and triggers the studio player modal.
// INPUT: Navigation handlers.
// OUTPUT: Semantic HTMLElement (<nav class="mobile-nav-bar">).
// ACCESSIBILITY: Proper touch hitboxes, clear aria labels, and active section state classes.

import { createElement, createSvg, createSvgPath } from '../common/dom.js';

/**
 * Creates the bottom mobile navigation bar.
 * @param {Object} [handlers] - Navigation callbacks
 * @param {Function} [handlers.onNavigate] - Callback when section is tapped
 * @param {Function} [handlers.onOpenPlayer] - Callback when player icon is tapped
 * @returns {HTMLElement} The mobile navigation element
 */
export function createMobileNav(handlers = {}) {
  // 1. Home Item
  const homeSvg = createSvg('svg', {
    attrs: { viewBox: '0 0 24 24', width: '20', height: '20', fill: 'none', stroke: 'currentColor', 'stroke-width': '2' },
    children: [createSvgPath('m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z')]
  });
  const homeItem = createElement('a', {
    className: 'mobile-nav-item active',
    dataset: { section: 'hero', goto: 'hero' },
    attrs: { href: '#hero' },
    children: [homeSvg, createElement('span', { text: 'Home' })],
    events: {
      click: (e) => {
        e.preventDefault();
        if (typeof handlers.onNavigate === 'function') handlers.onNavigate('hero', e);
      }
    }
  });

  // 2. Records Item
  const recordsSvg = createSvg('svg', {
    attrs: { viewBox: '0 0 24 24', width: '20', height: '20', fill: 'none', stroke: 'currentColor', 'stroke-width': '2' },
    children: [
      createSvg('circle', { attrs: { cx: '12', cy: '12', r: '10' } }),
      createSvg('polygon', { attrs: { points: '10 8 16 12 10 16 10 8' } })
    ]
  });
  const recordsItem = createElement('a', {
    className: 'mobile-nav-item',
    dataset: { section: 'records', goto: 'records' },
    attrs: { href: '#records' },
    children: [recordsSvg, createElement('span', { text: 'Records' })],
    events: {
      click: (e) => {
        e.preventDefault();
        if (typeof handlers.onNavigate === 'function') handlers.onNavigate('records', e);
      }
    }
  });

  // 3. Artists Item
  const artistsSvg = createSvg('svg', {
    attrs: { viewBox: '0 0 24 24', width: '20', height: '20', fill: 'none', stroke: 'currentColor', 'stroke-width': '2' },
    children: [
      createSvgPath('M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2'),
      createSvg('circle', { attrs: { cx: '12', cy: '7', r: '4' } })
    ]
  });
  const artistsItem = createElement('a', {
    className: 'mobile-nav-item',
    dataset: { section: 'artists', goto: 'artists' },
    attrs: { href: '#artists' },
    children: [artistsSvg, createElement('span', { text: 'Artists' })],
    events: {
      click: (e) => {
        e.preventDefault();
        if (typeof handlers.onNavigate === 'function') handlers.onNavigate('artists', e);
      }
    }
  });

  // 4. Contact Item
  const contactSvg = createSvg('svg', {
    attrs: { viewBox: '0 0 24 24', width: '20', height: '20', fill: 'none', stroke: 'currentColor', 'stroke-width': '2' },
    children: [
      createSvgPath('M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z'),
      createSvg('polyline', { attrs: { points: '22,6 12,13 2,6' } })
    ]
  });
  const contactItem = createElement('a', {
    className: 'mobile-nav-item',
    dataset: { section: 'contact', goto: 'contact' },
    attrs: { href: '#contact' },
    children: [contactSvg, createElement('span', { text: 'Contact' })],
    events: {
      click: (e) => {
        e.preventDefault();
        if (typeof handlers.onNavigate === 'function') handlers.onNavigate('contact', e);
      }
    }
  });

  // 5. Player Item
  const playerSvg = createSvg('svg', {
    attrs: { viewBox: '0 0 24 24', width: '20', height: '20', fill: 'none', stroke: 'currentColor', 'stroke-width': '2' },
    children: [
      createSvg('circle', { attrs: { cx: '12', cy: '12', r: '10' } }),
      createSvgPath('M10 15V9l5 3-5 3z')
    ]
  });
  const playerItem = createElement('button', {
    className: 'mobile-nav-item',
    props: { type: 'button' },
    dataset: { modalOpen: 'modal-player' },
    children: [playerSvg, createElement('span', { text: 'Player' })],
    events: {
      click: (e) => {
        if (typeof handlers.onOpenPlayer === 'function') handlers.onOpenPlayer(e);
      }
    }
  });

  return createElement('nav', {
    className: 'mobile-nav-bar',
    attrs: { 'aria-label': 'Mobile Navigation' },
    children: [homeItem, recordsItem, artistsItem, contactItem, playerItem]
  });
}
