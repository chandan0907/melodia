// PURPOSE: Real-time visual rendering engines for background bokeh atmosphere and audio spectrum wave analyzers.
// INTEGRATION: Listens to AudioEngine state to dynamically adjust particle agitation and frequency spectrum bars.
// INPUT: Target HTML5 Canvas element IDs and frequency audio data.
// OUTPUT: 60 FPS GPU-accelerated canvas animations with fluid mouse parallax.

import { audio } from '../services/audio-service.js';

/**
 * BackgroundAtmosphere handles deep ambient bokeh particle rendering with mouse parallax.
 */
export class BackgroundAtmosphere {
  constructor(canvasId) {
    this.canvas = typeof canvasId === 'string' ? document.getElementById(canvasId) : canvasId;
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.particles = [];
    this.numParticles = 45;
    this.mouse = {
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
      targetX: window.innerWidth / 2,
      targetY: window.innerHeight / 2
    };
    this.time = 0;
    this.running = false;

    this.resize = this.resize.bind(this);
    this.loop = this.loop.bind(this);
    this.onMouseMove = this.onMouseMove.bind(this);

    this.init();
  }

  // PURPOSE: Sets up particle pools, event listeners, and starts the render loop.
  init() {
    this.resize();
    window.addEventListener('resize', this.resize);
    window.addEventListener('mousemove', this.onMouseMove);
    window.addEventListener('touchmove', (e) => {
      if (e.touches[0]) {
        this.mouse.targetX = e.touches[0].clientX;
        this.mouse.targetY = e.touches[0].clientY;
      }
    }, { passive: true });

    // Curated studio palette: Deep wine red, crimson embers, peach glow, and subtle cyan depth
    const colors = [
      { r: 225, g: 29, b: 72 },   // Crimson
      { r: 180, g: 18, b: 60 },   // Deep burgundy
      { r: 244, g: 63, b: 94 },   // Rose
      { r: 251, g: 113, b: 133 }, // Peach glow
      { r: 147, g: 51, b: 234 },  // Violet accent
      { r: 56, g: 189, b: 248 }   // Soft cyan mist
    ];

    for (let i = 0; i < this.numParticles; i++) {
      const c = colors[Math.floor(Math.random() * colors.length)];
      this.particles.push({
        x: Math.random() * (this.canvas.width || window.innerWidth),
        y: Math.random() * (this.canvas.height || window.innerHeight),
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.35,
        radius: Math.random() * 90 + 35,
        baseRadius: Math.random() * 90 + 35,
        color: c,
        alpha: Math.random() * 0.28 + 0.08,
        pulseSpeed: Math.random() * 0.02 + 0.008,
        offset: Math.random() * Math.PI * 2
      });
    }

    this.running = true;
    requestAnimationFrame(this.loop);
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

  // PURPOSE: Main requestAnimationFrame render loop drawing blurred bokeh particles.
  loop() {
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
    const boost = audioState.isPlaying ? 1.35 : 1.0;

    this.particles.forEach((p) => {
      p.x += p.vx;
      p.y += p.vy;

      const margin = 120;
      if (p.x < -margin) p.x = w + margin;
      if (p.x > w + margin) p.x = -margin;
      if (p.y < -margin) p.y = h + margin;
      if (p.y > h + margin) p.y = -margin;

      const dx = (this.mouse.x - w / 2) * 0.02;
      const dy = (this.mouse.y - h / 2) * 0.02;

      const currentRadius = p.baseRadius * (1 + Math.sin(this.time * 2 + p.offset) * 0.18) * boost;
      const currentAlpha = p.alpha * (0.8 + Math.sin(this.time * 1.5 + p.offset) * 0.2) * boost;

      const grad = ctx.createRadialGradient(
        p.x + dx, p.y + dy, 0,
        p.x + dx, p.y + dy, currentRadius
      );
      grad.addColorStop(0, `rgba(${p.color.r}, ${p.color.g}, ${p.color.b}, ${currentAlpha})`);
      grad.addColorStop(0.5, `rgba(${p.color.r}, ${p.color.g}, ${p.color.b}, ${currentAlpha * 0.4})`);
      grad.addColorStop(1, `rgba(${p.color.r}, ${p.color.g}, ${p.color.b}, 0)`);

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(p.x + dx, p.y + dy, currentRadius, 0, Math.PI * 2);
      ctx.fill();
    });

    // Dark vignette layer overlay
    const vig = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.25, w / 2, h / 2, Math.max(w, h) * 0.85);
    vig.addColorStop(0, 'rgba(7, 6, 10, 0)');
    vig.addColorStop(0.7, 'rgba(7, 6, 10, 0.4)');
    vig.addColorStop(1, 'rgba(7, 6, 10, 0.88)');
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, w, h);

    requestAnimationFrame(this.loop);
  }

  // PURPOSE: Stops canvas animation and cleans up listeners.
  destroy() {
    this.running = false;
    window.removeEventListener('resize', this.resize);
    window.removeEventListener('mousemove', this.onMouseMove);
  }
}

/**
 * SpectrumVisualizer renders audio frequency bars with neon gradient fills.
 */
export class SpectrumVisualizer {
  constructor(canvasId) {
    this.canvas = typeof canvasId === 'string' ? document.getElementById(canvasId) : canvasId;
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.freqData = new Uint8Array(48);
    this.time = 0;
    this.running = false;

    this.resize = this.resize.bind(this);
    this.draw = this.draw.bind(this);

    this.init();
  }

  // PURPOSE: Resizes canvas and starts drawing loop.
  init() {
    this.resize();
    window.addEventListener('resize', this.resize);
    this.running = true;
    requestAnimationFrame(this.draw);
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

  // PURPOSE: Renders animated vertical equalizer frequency bars.
  draw() {
    if (!this.running || !this.ctx) return;
    this.time += 0.08;

    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;

    ctx.clearRect(0, 0, w, h);

    const audioState = audio.getState();
    const isPlaying = audioState.isPlaying;

    // Use Web Audio analyser data when available; otherwise use harmonic synthesis simulation
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

    const grad = ctx.createLinearGradient(0, h, 0, 0);
    grad.addColorStop(0, '#ff3366');
    grad.addColorStop(0.6, '#fb7185');
    grad.addColorStop(1, '#ffedd5');

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

    requestAnimationFrame(this.draw);
  }

  // PURPOSE: Stops spectrum render loop and cleans up event listeners.
  destroy() {
    this.running = false;
    window.removeEventListener('resize', this.resize);
  }
}
