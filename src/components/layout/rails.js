// PURPOSE: Programmatically constructs the left viewport slide tracker rail and right social links rail.
// INTEGRATION: Communicates with the section scroll observer to update slide indices (01/04 through 04/04).
// INPUT: None.
// OUTPUT: Two semantic HTMLElement instances (<aside class="rail-left"> and <aside class="rail-right">).

import { createElement, createSvg, createSvgPath } from '../common/dom.js';

/**
 * Creates the left vertical slide position tracker.
 * @returns {HTMLElement} The left rail element
 */
export function createLeftRail() {
  const indicatorFill = createElement('div', {
    id: 'indicator-fill',
    className: 'indicator-line-fill'
  });

  const indicatorLine = createElement('div', {
    className: 'indicator-line',
    children: [indicatorFill]
  });

  const numSpan = createElement('span', { text: '01' });
  const indicatorNum = createElement('div', {
    id: 'indicator-num',
    className: 'indicator-text',
    children: [
      document.createTextNode('— '),
      numSpan,
      document.createTextNode(' / 04 —')
    ]
  });

  return createElement('aside', {
    className: 'rail-left',
    attrs: { 'aria-hidden': 'true' },
    children: [indicatorLine, indicatorNum]
  });
}

/**
 * Creates the right social links rail with external studio profiles.
 * @returns {HTMLElement} The right rail element
 */
export function createRightRail() {
  // Facebook Icon
  const fbSvg = createSvg('svg', {
    attrs: { viewBox: '0 0 24 24', width: '16', height: '16', fill: 'currentColor' },
    children: [createSvgPath('M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z')]
  });

  const fbLink = createElement('a', {
    className: 'social-link',
    attrs: {
      href: 'https://facebook.com',
      target: '_blank',
      rel: 'noopener noreferrer',
      title: 'Facebook',
      'aria-label': 'Facebook'
    },
    children: [fbSvg]
  });

  // X / Twitter Icon
  const xSvg = createSvg('svg', {
    attrs: { viewBox: '0 0 24 24', width: '15', height: '15', fill: 'currentColor' },
    children: [createSvgPath('M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z')]
  });

  const xLink = createElement('a', {
    className: 'social-link',
    attrs: {
      href: 'https://x.com',
      target: '_blank',
      rel: 'noopener noreferrer',
      title: 'X / Twitter',
      'aria-label': 'Twitter'
    },
    children: [xSvg]
  });

  // Instagram Icon
  const instaRect = createSvg('rect', {
    attrs: { x: '2', y: '2', width: '20', height: '20', rx: '5', ry: '5' }
  });
  const instaCircle = createSvg('path', {
    attrs: { d: 'M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z' }
  });
  const instaDot = createSvg('line', {
    attrs: { x1: '17.5', y1: '6.5', x2: '17.51', y2: '6.5' }
  });

  const instaSvg = createSvg('svg', {
    attrs: { viewBox: '0 0 24 24', width: '16', height: '16', fill: 'none', stroke: 'currentColor', 'stroke-width': '2' },
    children: [instaRect, instaCircle, instaDot]
  });

  const instaLink = createElement('a', {
    className: 'social-link',
    attrs: {
      href: 'https://instagram.com',
      target: '_blank',
      rel: 'noopener noreferrer',
      title: 'Instagram',
      'aria-label': 'Instagram'
    },
    children: [instaSvg]
  });

  // Spotify Icon
  const spotifySvg = createSvg('svg', {
    attrs: { viewBox: '0 0 24 24', width: '16', height: '16', fill: 'currentColor' },
    children: [createSvgPath('M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm4.586 14.424a.623.623 0 0 1-.857.206c-2.348-1.435-5.304-1.76-8.785-.964a.624.624 0 0 1-.277-1.218c3.808-.87 7.076-.496 9.713 1.119a.623.623 0 0 1 .206.857zm1.225-2.723a.78.78 0 0 1-1.072.257c-2.687-1.652-6.785-2.131-9.965-1.166a.78.78 0 0 1-.462-1.492c3.633-1.103 8.147-.568 11.242 1.33a.78.78 0 0 1 .257 1.071zm.105-2.835C14.693 8.92 9.4 8.745 6.32 9.68a.936.936 0 1 1-.546-1.792c3.526-1.07 9.38-.868 13.11 1.346a.936.936 0 1 1-.968 1.632z')]
  });

  const spotifyLink = createElement('a', {
    className: 'social-link',
    attrs: {
      href: 'https://spotify.com',
      target: '_blank',
      rel: 'noopener noreferrer',
      title: 'Spotify',
      'aria-label': 'Spotify'
    },
    children: [spotifySvg]
  });

  return createElement('aside', {
    className: 'rail-right',
    attrs: { 'aria-label': 'Social links' },
    children: [fbLink, xLink, instaLink, spotifyLink]
  });
}
