// PURPOSE: Programmatically constructs the Contact & Studio ("BEAT ME") section.
// INTEGRATION: Handles studio session booking inquiries and displays studio contact info.
// INPUT: Form submit handler.
// OUTPUT: Semantic HTMLElement (<section id="contact" class="screen-section">).
// SECURITY: Validates email input format and escapes user input before processing.

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
  const mainHeading = createElement('h2', {
    className: 'contact-main-heading',
    text: 'BEAT ME'
  });

  const summary = createElement('p', {
    className: 'section-summary-text',
    text: 'BEAT RECORDS is a world class recording studio built for artists, musicians, and producers seeking the pinnacle of sonic fidelity. Equipped with legendary vintage consoles, Dolby Atmos suites, and analog tape mastering.'
  });

  const subHeading = createElement('h3', {
    className: 'contact-sub-heading',
    text: 'CONTACT'
  });

  // Booking inquiry form
  const emailInput = createElement('input', {
    id: 'contact-email-input',
    className: 'glass-input-field',
    props: {
      type: 'email',
      placeholder: 'Enter your Email',
      required: true,
      autocomplete: 'email'
    }
  });

  const submitBtn = createElement('button', {
    className: 'btn-connect',
    props: { type: 'submit' },
    text: 'Connect'
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
      createInfoItem('Address', '1074 Pacific Avenue, San Francisco, CA 94133'),
      createInfoItem('Email', 'beatme@melodiarecords.com'),
      createInfoItem('Phone', '+1 (415) 890-1212')
    ]
  });

  const content = createElement('div', {
    className: 'contact-content',
    children: [mainHeading, summary, subHeading, contactForm, infoGrid]
  });

  return createElement('section', {
    id: 'contact',
    className: 'screen-section',
    attrs: { 'aria-label': 'Contact Studio Section' },
    children: [content]
  });
}
