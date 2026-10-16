# Red theme refinement — 16 October 2026

Replaced the green UI palette with black and crimson throughout the existing website. Shared colors now cover navigation, glass cards, selected states, all playback/volume controls, progress, focus outlines, rooms, scrollbars, and decorative canvas. Existing artwork and branding remain intact.

Current palette: background #000000; secondary #0A0506; solid surface #14090B; glass rgba(32,16,19,.70); deep accent #6E2634; accent text #D95757; main accent #EF6464; hover #FF8882; primary text #F8F3F2; secondary text #B8A4A2. These values supersede the previous green palette reports. Legacy component token names resolve to the new shared red roles.

Removed remaining green UI fallbacks and updated decorative canvas fallback colors. Navigation highlight styling now follows its existing aria-current state, preserving the same actions and destinations.

Verification: production build PASS; 17 existing interaction checks PASS; whitespace check PASS. Browser confirmed rgb(0,0,0) body, rgb(20,9,11) card surfaces, rgb(239,100,100) playback/room accents, and no horizontal document overflow. No playback or application behavior was changed or initiated.

Contrast: black on main accent 6.68:1; accent text on opaque glass 4.76:1; primary text on cards 17.78:1; secondary text on opaque glass 7.75:1.

Changed source files: src/styles/tokens.css, global.css, layout.css, sections.css, player.css, modals.css; src/utils/visualizer.js; src/components/sections/records-section.js. Hash comparison against the pre-refinement source snapshot confirms all other source files are unchanged.

Current screenshots: red-theme-home.jpg and red-theme-player.jpg.
