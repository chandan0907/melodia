// PURPOSE: Programmatically constructs the top invite banner for synchronized Listen Together music rooms.
// INTEGRATION: Displayed when a user navigates to a /room/:id URL or receives a room invitation.
// INPUT: Optional callbacks for joining and dismissing invitations.
// OUTPUT: Reusable HTMLElement (#invite-banner).
// SECURITY: Fully programmatic DOM structure using textContent.

import { createElement } from './dom.js';

/**
 * Creates the top Listen Together invitation banner.
 * @param {Object} [callbacks] - Event callbacks
 * @param {Function} [callbacks.onJoin] - Called when user clicks "Join & Listen"
 * @param {Function} [callbacks.onDismiss] - Called when user clicks dismiss button
 * @returns {HTMLElement} The invite banner element
 */
export function createInviteBanner(callbacks = {}) {
  const pulseSpan = createElement('span', { className: 'invite-pulse' });

  const titleStrong = createElement('strong', {
    id: 'invite-banner-title',
    text: "You've been invited to Listen Together!"
  });

  const subtitleSpan = createElement('span', {
    text: 'Join the studio room to sync playback with your friend.'
  });

  const inviteTextDiv = createElement('div', {
    className: 'invite-text',
    children: [titleStrong, subtitleSpan]
  });

  const bannerContentDiv = createElement('div', {
    className: 'invite-banner-content',
    children: [pulseSpan, inviteTextDiv]
  });

  const joinBtn = createElement('button', {
    id: 'join-room-btn',
    className: 'btn-pill-primary',
    text: 'Join & Listen',
    props: { type: 'button' },
    attrs: { style: 'padding: 8px 20px; font-size: 0.82rem;' },
    events: {
      click: (e) => {
        if (typeof callbacks.onJoin === 'function') callbacks.onJoin(e);
      }
    }
  });

  const dismissBtn = createElement('button', {
    id: 'dismiss-invite-btn',
    className: 'btn-invite-dismiss',
    text: '×',
    props: { type: 'button' },
    attrs: { 'aria-label': 'Dismiss' },
    events: {
      click: (e) => {
        if (typeof callbacks.onDismiss === 'function') callbacks.onDismiss(e);
      }
    }
  });

  const actionsDiv = createElement('div', {
    className: 'invite-actions',
    children: [joinBtn, dismissBtn]
  });

  const innerDiv = createElement('div', {
    className: 'invite-banner-inner',
    children: [bannerContentDiv, actionsDiv]
  });

  return createElement('aside', {
    id: 'invite-banner',
    className: 'invite-banner',
    props: { hidden: true },
    children: [innerDiv]
  });
}
