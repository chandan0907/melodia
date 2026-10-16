// PURPOSE: Real-time visual rendering engines for background bokeh atmosphere and audio spectrum wave analyzers.
// INTEGRATION: Listens to AudioEngine state to dynamically adjust particle agitation and frequency spectrum bars.
// INPUT: Target HTML5 Canvas element IDs and frequency audio data.
// OUTPUT: 60 FPS GPU-accelerated canvas animations with fluid mouse parallax.
// THEME: Shared crimson presentation tokens, with motion preferences respected.

import { audio } from '../services/audio-service.js';

// Canvas colors follow the same centralized palette as the surrounding interface.
function readTheme() {
  const styles = getComputedStyle(document.documentElement);
  const color = (name, fallback) => styles.getPropertyValue(name).trim() || fallback;
  return {
    background: color('--color-background', '#000000'),
    surface: color('--color-surface', '#14090B'),
    olive: color('--color-accent-deep', '#6E2634'),
    sage: color('--color-accent', '#D95757'),
    leaf: color('--color-highlight', '#EF6464')
  };
}

function colorChannels(hex) {
  const value = hex.replace('#', '');
  return {
    r: parseInt(value.slice(0, 2), 16),
    g: parseInt(value.slice(2, 4), 16),
    b: parseInt(value.slice(4, 6), 16)
  };
}

function listenToMedia(query, listener, remove = false) {
  if (typeof query.addEventListener === 'function') {
    query[remove ? 'removeEventListener' : 'addEventListener']('change', listener);
  } else {
    query[remove ? 'removeListener' : 'addListener'](listener);
  }
}

/**
 * BackgroundAtmosphere handles deep ambient bokeh particle rendering with mouse parallax.
 */
export class BackgroundAtmosphere {
  constructor(canvasId) {
    this.canvas = typeof canvasId === 'string' ? document.getElementById(canvasId) : canvasId;
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.particles = [];
    this.numParticles = 48;
    this.mouse = {
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
      targetX: window.innerWidth / 2,
      targetY: window.innerHeight / 2
    };
    this.time = 0;
    this.running = false;
    this.frameId = null;
    this.theme = readTheme();
    this.motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    this.mobileQuery = window.matchMedia('(max-width: 700px)');

    this.resize = this.resize.bind(this);
    this.loop = this.loop.bind(this);
    this.onMouseMove = this.onMouseMove.bind(this);
    this.onTouchMove = this.onTouchMove.bind(this);
    this.updateMotion = this.updateMotion.bind(this);

    this.init();
  }

  // PURPOSE: Sets up particle pools, event listeners, and starts the render loop.
  init() {
    this.resize();
    window.addEventListener('resize', this.resize);
    window.addEventListener('mousemove', this.onMouseMove);
    window.addEventListener('touchmove', this.onTouchMove, { passive: true });
    listenToMedia(this.motionQuery, this.updateMotion);
    listenToMedia(this.mobileQuery, this.updateMotion);

    const colors = [this.theme.surface, this.theme.olive, this.theme.sage, this.theme.leaf].map(colorChannels);

    for (let i = 0; i < this.numParticles; i++) {
      const c = colors[Math.floor(Math.random() * colors.length)];
      this.particles.push({
        x: Math.random() * (this.canvas.width || window.innerWidth),
        y: Math.random() * (this.canvas.height || window.innerHeight),
        vx: (Math.random() - 0.5) * 0.45,
        vy: (Math.random() - 0.5) * 0.38,
        radius: Math.random() * 95 + 40,
        baseRadius: Math.random() * 95 + 40,
        color: c,
        alpha: Math.random() * 0.32 + 0.09,
        pulseSpeed: Math.random() * 0.02 + 0.008,
        offset: Math.random() * Math.PI * 2
      });
    }

    this.updateMotion();
  }

  // Only one pending frame is allowed; hidden mobile and reduced-motion canvases stay idle.
  updateMotion() {
    this.running = Boolean(this.ctx) && !this.motionQuery.matches && !this.mobileQuery.matches;
    if (!this.running) {
      if (this.frameId !== null) cancelAnimationFrame(this.frameId);
      this.frameId = null;
      this.ctx?.clearRect(0, 0, this.width, this.height);
    } else if (this.frameId === null) {
      this.frameId = requestAnimationFrame(this.loop);
    }
  }

  // PURPOSE: Resizes canvas buffer with device pixel ratio scaling for crisp retina display.
  resize() {
    if (!this.canvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.canvas.width = this.width * dpr;
    this.canvas.height = this.height * dpr;
    if (this.ctx) {
      this.ctx.scale(dpr, dpr);
    }
  }

  // PURPOSE: Tracks mouse position for interactive inertia parallax.
  onMouseMove(e) {
    this.mouse.targetX = e.clientX;
    this.mouse.targetY = e.clientY;
  }

  onTouchMove(e) {
    if (e.touches[0]) {
      this.mouse.targetX = e.touches[0].clientX;
      this.mouse.targetY = e.touches[0].clientY;
    }
  }

  // PURPOSE: Main requestAnimationFrame render loop drawing blurred bokeh particles.
  loop() {
    this.frameId = null;
    if (!this.running || !this.ctx) return;
    this.time += 0.015;

    // Smooth mouse interpolation
    this.mouse.x += (this.mouse.targetX - this.mouse.x) * 0.05;
    this.mouse.y += (this.mouse.targetY - this.mouse.y) * 0.05;

    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;

    ctx.clearRect(0, 0, w, h);

    // Dynamic boost when audio is actively playing
    const audioState = audio.getState();
    const boost = audioState.isPlaying ? 1.4 : 1.0;

    this.particles.forEach((p) => {
      p.x += p.vx;
      p.y += p.vy;

      const margin = 120;
      if (p.x < -margin) p.x = w + margin;
      if (p.x > w + margin) p.x = -margin;
      if (p.y < -margin) p.y = h + margin;
      if (p.y > h + margin) p.y = -margin;

      const dx = (this.mouse.x - w / 2) * 0.025;
      const dy = (this.mouse.y - h / 2) * 0.025;

      const currentRadius = p.baseRadius * (1 + Math.sin(this.time * 2 + p.offset) * 0.2) * boost;
      const currentAlpha = p.alpha * (0.8 + Math.sin(this.time * 1.5 + p.offset) * 0.2) * boost;

      const grad = ctx.createRadialGradient(
        p.x + dx, p.y + dy, 0,
        p.x + dx, p.y + dy, currentRadius
      );
      grad.addColorStop(0, `rgba(${p.color.r}, ${p.color.g}, ${p.color.b}, ${currentAlpha})`);
      grad.addColorStop(0.45, `rgba(${p.color.r}, ${p.color.g}, ${p.color.b}, ${currentAlpha * 0.45})`);
      grad.addColorStop(1, `rgba(${p.color.r}, ${p.color.g}, ${p.color.b}, 0)`);

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(p.x + dx, p.y + dy, currentRadius, 0, Math.PI * 2);
      ctx.fill();
    });

    // Dark vignette follows the shared background color.
    const vig = ctx.createRadialGradient(
      w / 2, h / 2, Math.min(w, h) * 0.25,
      w / 2, h / 2, Math.max(w, h) * 0.88
    );
    const base = colorChannels(this.theme.background);
    vig.addColorStop(0, `rgba(${base.r}, ${base.g}, ${base.b}, 0)`);
    vig.addColorStop(0.65, `rgba(${base.r}, ${base.g}, ${base.b}, 0.48)`);
    vig.addColorStop(1, `rgba(${base.r}, ${base.g}, ${base.b}, 0.94)`);
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, w, h);

    this.frameId = requestAnimationFrame(this.loop);
  }

  // PURPOSE: Stops canvas animation and cleans up listeners.
  destroy() {
    if (!this.canvas) return;
    this.running = false;
    if (this.frameId !== null) cancelAnimationFrame(this.frameId);
    this.frameId = null;
    window.removeEventListener('resize', this.resize);
    window.removeEventListener('mousemove', this.onMouseMove);
    window.removeEventListener('touchmove', this.onTouchMove);
    listenToMedia(this.motionQuery, this.updateMotion, true);
    listenToMedia(this.mobileQuery, this.updateMotion, true);
  }
}

/**
 * SpectrumVisualizer renders audio frequency bars with the shared olive and sage gradient.
 */
export class SpectrumVisualizer {
  constructor(canvasId) {
    this.canvas = typeof canvasId === 'string' ? document.getElementById(canvasId) : canvasId;
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.freqData = new Uint8Array(48);
    this.time = 0;
    this.running = false;
    this.frameId = null;
    this.theme = readTheme();
    this.motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    this.initialVisibility = this.canvas.style.visibility;

    this.resize = this.resize.bind(this);
    this.draw = this.draw.bind(this);
    this.updateMotion = this.updateMotion.bind(this);

    this.init();
  }

  // PURPOSE: Resizes canvas and starts drawing loop.
  init() {
    this.resize();
    window.addEventListener('resize', this.resize);
    listenToMedia(this.motionQuery, this.updateMotion);
    this.updateMotion();
  }

  updateMotion() {
    this.running = Boolean(this.ctx) && !this.motionQuery.matches;
    this.canvas.style.visibility = this.motionQuery.matches ? 'hidden' : this.initialVisibility;
    if (!this.running) {
      if (this.frameId !== null) cancelAnimationFrame(this.frameId);
      this.frameId = null;
      this.ctx?.clearRect(0, 0, this.width, this.height);
    } else if (this.frameId === null) {
      this.frameId = requestAnimationFrame(this.draw);
    }
  }

  // PURPOSE: Synchronizes canvas resolution with bounding client dimensions.
  resize() {
    if (!this.canvas) return;
    const rect = this.canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.width = rect.width || 280;
    this.height = rect.height || 48;
    this.canvas.width = this.width * dpr;
    this.canvas.height = this.height * dpr;
    if (this.ctx) {
      this.ctx.scale(dpr, dpr);
    }
  }

  // PURPOSE: Renders the existing frequency bars using shared olive and sage colors.
  draw() {
    this.frameId = null;
    if (!this.running || !this.ctx) return;
    this.time += 0.08;

    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;

    ctx.clearRect(0, 0, w, h);

    const audioState = audio.getState();
    const isPlaying = audioState.isPlaying;

    if (audio.analyser && isPlaying) {
      audio.analyser.getByteFrequencyData(this.freqData);
    } else {
      for (let i = 0; i < this.freqData.length; i++) {
        if (isPlaying) {
          const wave1 = Math.sin(this.time * 2 + i * 0.45) * 45 + 50;
          const wave2 = Math.cos(this.time * 3 + i * 0.8) * 35;
          const val = Math.max(8, Math.min(255, wave1 + wave2));
          this.freqData[i] = val;
        } else {
          this.freqData[i] = Math.max(2, this.freqData[i] * 0.9);
        }
      }
    }

    const barCount = 28;
    const gap = 3;
    const totalGap = gap * (barCount - 1);
    const barWidth = Math.max(2, (w - totalGap) / barCount);

    // Shared olive-to-leaf presentation gradient.
    const grad = ctx.createLinearGradient(0, h, 0, 0);
    grad.addColorStop(0, this.theme.surface);
    grad.addColorStop(0.45, this.theme.olive);
    grad.addColorStop(0.8, this.theme.sage);
    grad.addColorStop(1, this.theme.leaf);

    ctx.fillStyle = grad;

    for (let i = 0; i < barCount; i++) {
      const dataIdx = Math.floor((i / barCount) * (this.freqData.length / 2));
      const val = this.freqData[dataIdx] || 4;
      const barHeight = Math.max(3, (val / 255) * h);
      const x = i * (barWidth + gap);
      const y = h - barHeight;

      ctx.beginPath();
      if (typeof ctx.roundRect === 'function') {
        ctx.roundRect(x, y, barWidth, barHeight, [2, 2, 0, 0]);
      } else {
        ctx.rect(x, y, barWidth, barHeight);
      }
      ctx.fill();
    }

    this.frameId = requestAnimationFrame(this.draw);
  }

  // PURPOSE: Stops spectrum render loop and cleans up event listeners.
  destroy() {
    if (!this.canvas) return;
    this.running = false;
    if (this.frameId !== null) cancelAnimationFrame(this.frameId);
    this.frameId = null;
    this.canvas.style.visibility = this.initialVisibility;
    window.removeEventListener('resize', this.resize);
    listenToMedia(this.motionQuery, this.updateMotion, true);
  }
}
