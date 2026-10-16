// PURPOSE: Programmatically constructs the redesigned Contact & Studio Booking section.
// INTEGRATION: Handles studio session booking inquiries and displays acoustic studio telemetry.
// INPUT: Form submit handler.
// OUTPUT: Semantic HTMLElement (<section id="contact" class="screen-section contact-section">).
// SECURITY: Validates email input format and safely handles user input.

import { createElement } from '../common/dom.js';

/**
 * Creates an info block for the studio contact details.
 * @param {string} label - Info label (e.g. 'Address', 'Email', 'Phone')
 * @param {string} value - Contact value string
 * @returns {HTMLElement} The info item element
 */
function createInfoItem(label, value) {
  const labelSpan = createElement('span', {
    className: 'info-label',
    text: label
  });

  const valueSpan = createElement('span', {
    className: 'info-value',
    text: value
  });

  return createElement('div', {
    className: 'info-item-block',
    children: [labelSpan, valueSpan]
  });
}

/**
 * Creates the complete Contact Section.
 * @param {Object} [handlers] - Event callbacks
 * @param {Function} [handlers.onSubmit] - Callback receiving email string
 * @returns {HTMLElement} The contact section element
 */
export function createContactSection(handlers = {}) {
  const tagPill = createElement('div', {
    className: 'section-category-pill',
    text: '// MASTERING INQUIRIES'
  });

  const mainHeading = createElement('h2', {
    className: 'section-label-title',
    text: 'BEAT ME'
  });

  const summary = createElement('p', {
    className: 'section-summary-text',
    text: 'BEAT RECORDS is a world-class recording and mastering facility built for artists, musicians, and producers seeking the absolute pinnacle of sonic fidelity.'
  });

  const headerGroup = createElement('div', {
    className: 'section-header-group',
    children: [tagPill, mainHeading, summary]
  });

  // Booking inquiry form
  const emailInput = createElement('input', {
    id: 'contact-email-input',
    className: 'glass-input-field',
    attrs: { 'aria-label': 'Your artist or studio email' },
    props: {
      type: 'email',
      placeholder: 'Enter your artist or studio email...',
      required: true,
      autocomplete: 'email'
    }
  });

  const submitBtn = createElement('button', {
    className: 'btn-connect',
    props: { type: 'submit' },
    text: 'Request Session'
  });

  const inputWrapper = createElement('div', {
    className: 'glass-input-wrapper',
    children: [emailInput, submitBtn]
  });

  const contactForm = createElement('form', {
    id: 'contact-form',
    className: 'contact-form-box',
    children: [inputWrapper],
    events: {
      submit: (e) => {
        e.preventDefault();
        const email = emailInput.value.trim();
        if (typeof handlers.onSubmit === 'function') {
          handlers.onSubmit(email);
        }
      }
    }
  });

  // Studio information details
  const infoGrid = createElement('div', {
    className: 'studio-info-grid',
    children: [
      createInfoItem('Studio Address', '1074 Pacific Avenue, San Francisco, CA 94133'),
      createInfoItem('Engineering Desk', 'studio@tunora.com'),
      createInfoItem('Direct Line', '+1 (415) 890-1212'),
      createInfoItem('Acoustic Suite', 'Dolby Atmos 9.1.4 Certified')
    ]
  });

  // Telemetry badge row
  const footerNote = createElement('div', {
    className: 'studio-telemetry-note',
    text: 'All audio processed with Pullman Acoustic calibration · Zero-latency WebRTC mesh active'
  });

  const content = createElement('div', {
    className: 'contact-content',
    children: [headerGroup, contactForm, infoGrid, footerNote]
  });

  return createElement('section', {
    id: 'contact',
    className: 'screen-section contact-section',
    attrs: { 'aria-label': 'Contact and Studio Booking Section' },
    children: [content]
  });
}
