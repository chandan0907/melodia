// PURPOSE: Provides safe, programmatic DOM and SVG element construction utilities.
// INTEGRATION: Used by all UI components to construct interfaces without authored HTML strings or innerHTML.
// INPUT: Tag names, attribute dictionaries, event listener maps, and child elements.
// OUTPUT: Native DOM and SVG element instances with registered event listeners and attributes.
// SECURITY: Strictly uses textContent and setAttribute; completely eliminates cross-site scripting (XSS) risks.

/**
 * Creates a standard HTML element with attributes, properties, event listeners, and children.
 * @param {string} tag - HTML tag name (e.g. 'div', 'button', 'input')
 * @param {Object} [options] - Configuration options
 * @param {string} [options.className] - CSS class names
 * @param {string} [options.id] - Element ID
 * @param {string} [options.text] - Text content (safe, non-HTML)
 * @param {Object} [options.attrs] - Attribute key-value pairs
 * @param {Object} [options.props] - Direct property assignments (e.g. { type: 'button', value: '...' })
 * @param {Object} [options.dataset] - Data attributes (e.g. { goto: 'hero' })
 * @param {Object} [options.events] - Event listeners (e.g. { click: (e) => ... })
 * @param {Array<Node|string>} [options.children] - Child nodes or text strings to append
 * @returns {HTMLElement} The created DOM element
 */
export function createElement(tag, options = {}) {
  const el = document.createElement(tag);

  if (options.className) {
    el.className = options.className;
  }

  if (options.id) {
    el.id = options.id;
  }

  if (options.text !== undefined && options.text !== null) {
    el.textContent = options.text;
  }

  if (options.props) {
    Object.assign(el, options.props);
  }

  if (options.attrs) {
    Object.entries(options.attrs).forEach(([key, val]) => {
      if (val !== undefined && val !== null) {
        el.setAttribute(key, String(val));
      }
    });
  }

  if (options.dataset) {
    Object.entries(options.dataset).forEach(([key, val]) => {
      if (val !== undefined && val !== null) {
        el.dataset[key] = String(val);
      }
    });
  }

  if (options.events) {
    Object.entries(options.events).forEach(([evt, handler]) => {
      if (typeof handler === 'function') {
        el.addEventListener(evt, handler);
      }
    });
  }

  if (options.children && Array.isArray(options.children)) {
    options.children.forEach((child) => {
      if (child instanceof Node) {
        el.appendChild(child);
      } else if (typeof child === 'string' && child.length > 0) {
        el.appendChild(document.createTextNode(child));
      }
    });
  }

  return el;
}

/**
 * Creates an SVG element with correct SVG namespace and attributes.
 * @param {string} tag - SVG tag name (e.g. 'svg', 'path', 'circle', 'polygon')
 * @param {Object} [options] - SVG configuration options
 * @returns {SVGElement} The created SVG element
 */
export function createSvg(tag, options = {}) {
  const ns = 'http://www.w3.org/2000/svg';
  const el = document.createElementNS(ns, tag);

  if (options.className) {
    el.setAttribute('class', options.className);
  }

  if (options.id) {
    el.id = options.id;
  }

  if (options.attrs) {
    Object.entries(options.attrs).forEach(([key, val]) => {
      if (val !== undefined && val !== null) {
        el.setAttribute(key, String(val));
      }
    });
  }

  if (options.children && Array.isArray(options.children)) {
    options.children.forEach((child) => {
      if (child instanceof Node) {
        el.appendChild(child);
      }
    });
  }

  return el;
}

/**
 * Convenience helper to create an SVG icon container.
 * @param {number} width - Icon width in pixels
 * @param {number} height - Icon height in pixels
 * @param {string} viewBox - SVG viewBox attribute
 * @param {Array<SVGElement>} children - Child SVG elements (paths, circles, etc.)
 * @param {Object} [extraAttrs] - Additional attributes
 * @returns {SVGSVGElement} The SVG container element
 */
export function createSvgIcon(width, height, viewBox, children = [], extraAttrs = {}) {
  return createSvg('svg', {
    attrs: {
      width: String(width),
      height: String(height),
      viewBox: viewBox,
      fill: extraAttrs.fill || 'currentColor',
      stroke: extraAttrs.stroke || 'none',
      ...extraAttrs
    },
    children
  });
}

/**
 * Convenience helper to create an SVG path element.
 * @param {string} d - SVG path data string
 * @param {Object} [attrs] - Path attributes (e.g. fill, stroke)
 * @returns {SVGPathElement}
 */
export function createSvgPath(d, attrs = {}) {
  return createSvg('path', {
    attrs: {
      d,
      ...attrs
    }
  });
}

/**
 * Safely removes all child elements from a parent container.
 * @param {HTMLElement} element - The container element to empty
 */
export function clearElement(element) {
  if (element && typeof element.replaceChildren === 'function') {
    element.replaceChildren();
  } else if (element) {
    while (element.firstChild) {
      element.removeChild(element.firstChild);
    }
  }
}
