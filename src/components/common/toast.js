// PURPOSE: Programmatically constructs the persistent toast notification element.
// INTEGRATION: Listens to application toast events and displays feedback to the user.
// INPUT: None.
// OUTPUT: HTMLElement (#app-toast).
// SECURITY: Uses safe DOM creation with textContent; zero innerHTML or HTML-string interpolation.

import { createElement } from './dom.js';

/**
 * Creates the toast notification container.
 * @returns {HTMLElement} The created toast element
 */
export function createToast() {
  return createElement('div', {
    id: 'app-toast',
    className: 'app-toast',
    attrs: {
      role: 'status',
      'aria-live': 'polite'
    }
  });
}
