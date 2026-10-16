// Local presentation state only. Browsing never calls a playback action.
import { createElement, createSvg, createSvgPath } from '../common/dom.js';
import { artworkUrl } from '../common/artwork.js';

function arrow(direction) {
  return createSvg('svg', { attrs: { viewBox: '0 0 24 24', width: '18', height: '18', fill: 'none', stroke: 'currentColor', 'stroke-width': '1.7', 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'aria-hidden': 'true' }, children: [createSvgPath(direction < 0 ? 'm14 6-6 6 6 6' : 'm10 6 6 6-6 6')] });
}

export function createPlaylistCarousel({ records = [], onActivate } = {}) {
  if (!records.length) return createElement('p', { className: 'ui-empty-state', text: 'No collections available yet.' });
  let selectedIndex = 0;
  let pointerStart = null;
  let suppressClick = false;
  const cards = [];
  const pages = [];
  const thumbnail = createElement('img', { className: 'carousel-pill-thumb', attrs: { src: records[0].cover, alt: '', width: '34', height: '34' } });
  const selectedTitle = createElement('span', { className: 'carousel-pill-title', text: records[0].title });
  const status = createElement('p', { className: 'sr-only', attrs: { 'aria-live': 'polite', 'aria-atomic': 'true' } });

  function select(index, focus = false) {
    selectedIndex = (index + records.length) % records.length;
    cards.forEach((card, cardIndex) => {
      let offset = (cardIndex - selectedIndex + records.length) % records.length;
      if (offset > records.length / 2) offset -= records.length;
      card.dataset.position = String(offset);
      card.classList.toggle('is-selected', cardIndex === selectedIndex);
      if (cardIndex === selectedIndex) card.setAttribute('aria-current', 'true');
      else card.removeAttribute('aria-current');
    });
    pages.forEach((page, i) => page.setAttribute('aria-pressed', String(i === selectedIndex)));
    thumbnail.src = artworkUrl(records[selectedIndex].cover);
    selectedTitle.textContent = records[selectedIndex].title;
    status.textContent = `${records[selectedIndex].title}, collection ${selectedIndex + 1} of ${records.length}`;
    if (focus) cards[selectedIndex].focus({ preventScroll: true });
  }

  records.forEach((record, index) => {
    const card = createElement('button', {
      className: 'playlist-card', props: { type: 'button' }, dataset: { carouselIndex: String(index) },
      attrs: { 'aria-label': `Play ${record.title} by ${record.artist}`, 'aria-roledescription': 'slide' },
      children: [
        createElement('img', { className: 'playlist-card-art', attrs: { src: record.cover, alt: '', width: '300', height: '300', draggable: 'false', loading: index < 2 ? 'eager' : 'lazy' } }),
        createElement('span', { className: 'playlist-card-caption', children: [
          createElement('span', { className: 'playlist-card-category', text: record.genre }),
          createElement('span', { className: 'playlist-card-title', text: record.title }),
          createElement('span', { className: 'playlist-card-meta', text: `${record.tracks.length} tracks · ${record.year}` }),
          createElement('span', { className: 'playlist-card-play', attrs: { 'aria-hidden': 'true' }, children: [createSvg('svg', { attrs: { viewBox: '0 0 24 24', width: '18', height: '18', fill: 'currentColor' }, children: [createSvgPath('M9 5v14l11-7z')] })] })
        ] })
      ],
      events: { click: (event) => {
        if (suppressClick && event.detail !== 0) { suppressClick = false; event.preventDefault(); event.stopPropagation(); return; }
        select(index);
        onActivate?.(record);
      } }
    });
    cards.push(card);
    pages.push(createElement('button', {
      className: 'carousel-page', props: { type: 'button' }, dataset: { carouselPage: String(index) },
      attrs: { 'aria-label': `Browse ${record.title}`, 'aria-pressed': String(index === 0) },
      children: [createElement('span', { attrs: { 'aria-hidden': 'true' } })], events: { click: () => select(index) }
    }));
  });

  const stage = createElement('div', {
    className: 'playlist-carousel-stage', children: cards,
    events: {
      pointerdown: (event) => {
        if (!event.isPrimary || event.button !== 0) return;
        pointerStart = { x: event.clientX, y: event.clientY, id: event.pointerId, dragging: false };
        suppressClick = false;
      },
      pointermove: (event) => {
        if (!pointerStart || event.pointerId !== pointerStart.id) return;
        const dx = event.clientX - pointerStart.x;
        const dy = event.clientY - pointerStart.y;
        if (!pointerStart.dragging && Math.abs(dx) > 12 && Math.abs(dx) > Math.abs(dy) * 1.3) {
          pointerStart.dragging = true;
          stage.setPointerCapture(event.pointerId);
        }
      },
      pointerup: (event) => {
        if (!pointerStart || event.pointerId !== pointerStart.id) return;
        const dx = event.clientX - pointerStart.x;
        if (pointerStart.dragging) {
          suppressClick = true;
          if (Math.abs(dx) > 40) select(selectedIndex + (dx < 0 ? 1 : -1));
          if (stage.hasPointerCapture(event.pointerId)) stage.releasePointerCapture(event.pointerId);
        }
        pointerStart = null;
      },
      pointercancel: () => { pointerStart = null; suppressClick = false; }
    }
  });
  const browseButton = (direction) => createElement('button', {
    className: direction < 0 ? 'carousel-arrow carousel-prev' : 'carousel-arrow carousel-next', props: { type: 'button' },
    attrs: { 'aria-label': direction < 0 ? 'Browse previous collection' : 'Browse next collection' }, children: [arrow(direction)], events: { click: () => select(selectedIndex + direction) }
  });
  const root = createElement('section', {
    className: 'playlist-carousel', attrs: { 'aria-label': 'Featured playlists', 'aria-roledescription': 'carousel' },
    children: [
      createElement('div', { className: 'collection-heading', children: [createElement('h2', { className: 'eyebrow', text: 'In the spotlight' }), createElement('span', { text: 'Selected sounds, from our studio to you.' })] }),
      stage,
      createElement('div', { className: 'carousel-bottom', children: [
        createElement('div', { className: 'carousel-navigation-pill', children: [thumbnail, createElement('span', { className: 'carousel-pill-copy', children: [createElement('span', { className: 'carousel-pill-label', text: 'Explore the collection' }), selectedTitle] }), browseButton(-1), browseButton(1)] }),
        createElement('div', { className: 'carousel-pagination', attrs: { 'aria-label': 'Browse collections' }, children: pages })
      ] }), status
    ],
    events: { keydown: (event) => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault(); event.stopPropagation();
      select(event.key === 'Home' ? 0 : event.key === 'End' ? records.length - 1 : selectedIndex + (event.key === 'ArrowLeft' ? -1 : 1), true);
    } }
  });
  select(0);
  return root;
}
