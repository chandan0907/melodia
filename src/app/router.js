// PURPOSE: Client-side routing and section scroll intersection controller.
// INTEGRATION: Observes screen sections inside #snap-container, synchronizes slide indicators (01/04),
// and handles clean URL room routing (/room/:roomId).
// INPUT: DOM element references, intersection entries, and URL change events.
// OUTPUT: Smooth scrolling navigation, active nav indicators, and parsed room identifiers.

export class AppRouter {
  constructor() {
    this.currentSection = 'hero';
    this.sectionMap = ['hero', 'records', 'artists', 'contact'];
    this.observer = null;
  }

  // PURPOSE: Sets up IntersectionObserver on screen sections to dynamically update slide indicators and nav states.
  // INTEGRATION: Binds to #snap-container and updates #indicator-fill and #indicator-num.
  initSectionObserver() {
    const container = document.getElementById('snap-container');
    const sections = document.querySelectorAll('.screen-section');
    const indicatorText = document.getElementById('indicator-num');
    const indicatorFill = document.getElementById('indicator-fill');
    const navItems = document.querySelectorAll('.nav-item');
    const mobileItems = document.querySelectorAll('.mobile-nav-item');

    const updateIndicator = (index) => {
      const num = index + 1;
      if (indicatorText) {
        // Safe programmatic DOM update without innerHTML
        const numSpan = indicatorText.querySelector('span');
        if (numSpan) {
          numSpan.textContent = `0${num}`;
        } else {
          indicatorText.textContent = `— 0${num} / 04 —`;
        }
      }
      if (indicatorFill) {
        indicatorFill.style.height = `${num * 25}%`;
      }

      const activeId = this.sectionMap[index];
      this.currentSection = activeId;

      // Update Header Navigation Active State
      navItems.forEach((item) => {
        const target = item.dataset.section;
        item.classList.toggle('active', target === activeId);
      });

      // Update Mobile Navigation Active State
      mobileItems.forEach((item) => {
        const target = item.dataset.section;
        item.classList.toggle('active', target === activeId);
      });
    };

    if ('IntersectionObserver' in window && container && sections.length > 0) {
      this.observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const idx = Array.from(sections).indexOf(entry.target);
              if (idx !== -1) updateIndicator(idx);
            }
          });
        },
        { root: container, threshold: 0.55 }
      );

      sections.forEach((s) => this.observer.observe(s));
    }
  }

  // PURPOSE: Smoothly scrolls the viewport to a target section by ID.
  // INPUT: targetId ('hero' | 'records' | 'artists' | 'contact').
  scrollToSection(targetId) {
    const targetEl = document.getElementById(targetId);
    if (targetEl) {
      targetEl.scrollIntoView({ behavior: 'smooth' });
    }
  }

  // PURPOSE: Extracts room ID from current URL pathname, hash, or query parameter.
  // OUTPUT: Room ID string or null.
  parseRoomUrl() {
    if (typeof window === 'undefined') return null;
    const path = window.location.pathname;
    const hash = window.location.hash;
    const search = window.location.search;

    const pathMatch = path.match(/\/room\/([a-zA-Z0-9_-]+)/);
    if (pathMatch && pathMatch[1]) return pathMatch[1].toUpperCase();

    const hashMatch = hash.match(/[#?]room=([a-zA-Z0-9_-]+)/);
    if (hashMatch && hashMatch[1]) return hashMatch[1].toUpperCase();

    const params = new URLSearchParams(search);
    if (params.get('room')) return params.get('room').toUpperCase();

    return null;
  }

  // PURPOSE: Cleans up observer on application teardown.
  destroy() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
  }
}

export const router = new AppRouter();
