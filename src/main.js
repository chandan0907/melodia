// PURPOSE: Application bootstrap entry point.
// INTEGRATION: Loaded by index.html as the primary JavaScript module; initializes MelodiaApp.
// INPUT: DOM lifecycle events.
// OUTPUT: Instantiated and mounted Melodia application.

import './styles/main.css';
import { app } from './app/app.js';

// PURPOSE: Safely boots the application once the browser DOM is ready.
function bootstrap() {
  app.init();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrap);
} else {
  bootstrap();
}
