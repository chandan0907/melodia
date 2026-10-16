// PURPOSE: Programmatically constructs the glassmorphic application header bar.
// INTEGRATION: Houses brand navigation, PWA installation trigger, and studio player modal launcher.
// INPUT: Navigation callbacks and modal open requests.
// OUTPUT: Semantic HTMLElement (<header class="app-header">).
// ACCESSIBILITY: Includes accessible navigation landmarks, focusable controls, and aria-labels.

import { createElement, createSvg, createSvgPath } from '../common/dom.js';

/**
 * Creates the top glassmorphic application header.
 * @param {Object} [handlers] - Event callbacks
 * @param {Function} [handlers.onNavigate] - Callback when navigation link is clicked
 * @param {Function} [handlers.onInstall] - Callback for PWA install button
 * @param {Function} [handlers.onOpenPlayer] - Callback to open studio player modal
 * @returns {HTMLElement} The header element
 */
export function createHeader(handlers = {}) {
  // 1. Brand Logo
  const logoIcon = createElement('div', {
    className: 'logo-icon',
    attrs: { 'aria-hidden': 'true' }
  });

  const brandTitle = createElement('span', {
    className: 'brand-title',
    text: 'TUNORA'
  });

  const brandSub = createElement('span', {
    className: 'brand-sub',
    text: 'STUDIO'
  });

  const brandText = createElement('div', {
    className: 'brand-text',
    children: [brandTitle, brandSub]
  });

  const brandLogo = createElement('button', {
    className: 'brand-logo',
    props: { type: 'button' },
    attrs: { 'aria-label': 'TUNORA home' },
    dataset: { goto: 'hero' },
    children: [logoIcon, brandText],
    events: {
      click: (e) => {
        if (typeof handlers.onNavigate === 'function') handlers.onNavigate('hero', e);
      }
    }
  });

  // 2. Navigation Links
  const navSections = [
    { id: 'hero', label: 'Home', active: true },
    { id: 'contact', label: 'Contact', active: false }
  ];

  const navItems = navSections.map((sec) => {
    const anchor = createElement('a', {
      attrs: { href: `#${sec.id}` },
      dataset: { goto: sec.id },
      text: sec.label,
      events: {
        click: (e) => {
          e.preventDefault();
          if (typeof handlers.onNavigate === 'function') handlers.onNavigate(sec.id, e);
        }
      }
    });

    return createElement('li', {
      className: `nav-item${sec.active ? ' active' : ''}`,
      dataset: { section: sec.id },
      children: [anchor]
    });
  });

  const navList = createElement('ul', {
    className: 'nav-links',
    children: navItems
  });

  const mainNav = createElement('nav', {
    attrs: { 'aria-label': 'Main Navigation' },
    children: [navList]
  });

  // 3. Action Buttons (Install App + Studio Player Sync)
  const installSvg = createSvg('svg', {
    attrs: {
      viewBox: '0 0 24 24',
      width: '15',
      height: '15',
      fill: 'none',
      stroke: 'currentColor',
      'stroke-width': '2.2',
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round'
    },
    children: [
      createSvgPath('M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4'),
      createSvg('polyline', { attrs: { points: '7 10 12 15 17 10' } }),
      createSvg('line', { attrs: { x1: '12', y1: '15', x2: '12', y2: '3' } })
    ]
  });

  const installSpan = createElement('span', { text: 'Install App' });

  const installBtn = createElement('button', {
    className: 'btn-app-install',
    props: { type: 'button' },
    attrs: { 'aria-label': 'Install App' },
    children: [installSvg, installSpan],
    events: {
      click: (e) => {
        if (typeof handlers.onInstall === 'function') handlers.onInstall(e);
      }
    }
  });

  const playerCircle = createSvg('circle', {
    attrs: { cx: '12', cy: '12', r: '10' }
  });

  const playerPoly = createSvg('polygon', {
    attrs: { points: '10 8 16 12 10 16 10 8', fill: 'currentColor' }
  });

  const playerSvg = createSvg('svg', {
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
    children: [playerCircle, playerPoly]
  });

  const playerBtn = createElement('button', {
    className: 'btn-header-sync',
    props: { type: 'button' },
    dataset: { modalOpen: 'modal-player' },
    attrs: {
      title: 'Studio Player & Listen Together',
      'aria-label': 'Open Studio Player'
    },
    children: [playerSvg, createElement('span', { text: 'Player' })],
    events: {
      click: (e) => {
        if (typeof handlers.onOpenPlayer === 'function') handlers.onOpenPlayer(e);
      }
    }
  });

  const navActions = createElement('div', {
    className: 'nav-actions',
    children: [installBtn, playerBtn]
  });

  return createElement('header', {
    className: 'app-header',
    children: [brandLogo, mainNav, navActions]
  });
}
