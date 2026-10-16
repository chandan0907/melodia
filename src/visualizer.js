// Visualizer Engine: Atmospheric Bokeh Particles & Real-time Audio Spectrum
import { audio } from './audio.js';

export class BackgroundAtmosphere {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.particles = [];
    this.numParticles = 45;
    this.mouse = { x: window.innerWidth / 2, y: window.innerHeight / 2, targetX: window.innerWidth / 2, targetY: window.innerHeight / 2 };
    this.time = 0;
    this.running = false;

    this.resize = this.resize.bind(this);
    this.loop = this.loop.bind(this);
    this.onMouseMove = this.onMouseMove.bind(this);

    this.init();
  }

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

    // Palette inspired by reference: Deep wine red, crimson embers, peach glow, subtle cyan depth
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
        x: Math.random() * this.canvas.width,
        y: Math.random() * this.canvas.height,
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

  resize() {
    if (!this.canvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.canvas.width = this.width * dpr;
    this.canvas.height = this.height * dpr;
    this.ctx.scale(dpr, dpr);
  }

  onMouseMove(e) {
    this.mouse.targetX = e.clientX;
    this.mouse.targetY = e.clientY;
  }

  loop() {
    if (!this.running) return;
    this.time += 0.015;

    // Smooth mouse interpolation
    this.mouse.x += (this.mouse.targetX - this.mouse.x) * 0.05;
    this.mouse.y += (this.mouse.targetY - this.mouse.y) * 0.05;

    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;

    // Deep dark background clear
    ctx.clearRect(0, 0, w, h);

    // Audio reactivity boost
    const audioState = audio.getState();
    const boost = audioState.isPlaying ? 1.35 : 1.0;

    // Draw blurred bokeh embers
    this.particles.forEach((p) => {
      p.x += p.vx;
      p.y += p.vy;

      // Wrap around edges with margin
      const margin = 120;
      if (p.x < -margin) p.x = w + margin;
      if (p.x > w + margin) p.x = -margin;
      if (p.y < -margin) p.y = h + margin;
      if (p.y > h + margin) p.y = -margin;

      // Interactive gentle parallax toward mouse
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
}

export class SpectrumVisualizer {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.freqData = new Uint8Array(48);
    this.time = 0;
    this.init();
  }

  init() {
    this.resize();
    window.addEventListener('resize', () => this.resize());
    this.loop = this.loop.bind(this);
    requestAnimationFrame(this.loop);
  }

  resize() {
    if (!this.canvas) return;
    const r = this.canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = (r.width || 300) * dpr;
    this.canvas.height = (r.height || 48) * dpr;
    this.ctx.scale(dpr, dpr);
    this.width = r.width || 300;
    this.height = r.height || 48;
  }

  loop() {
    this.time += 0.05;
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;

    ctx.clearRect(0, 0, w, h);
    audio.getFrequencyData(this.freqData);
    const isPlaying = audio.getState().isPlaying;

    const barCount = 36;
    const barWidth = Math.max(2, (w / barCount) * 0.65);
    const gap = (w - barCount * barWidth) / (barCount - 1);

    // Gradient matching theme: Crimson to fiery rose/amber
    const grad = ctx.createLinearGradient(0, h, 0, 0);
    grad.addColorStop(0, '#e11d48');
    grad.addColorStop(0.6, '#f43f5e');
    grad.addColorStop(1, '#fb7185');

    ctx.fillStyle = grad;

    for (let i = 0; i < barCount; i++) {
      let val = this.freqData[i % this.freqData.length] / 255;
      if (!isPlaying) {
        val = 0.08 + Math.sin(this.time * 2 + i * 0.25) * 0.05;
      }

      const barHeight = Math.max(3, val * (h - 6));
      const x = i * (barWidth + gap);
      const y = h - barHeight;

      ctx.beginPath();
      if (ctx.roundRect) {
        ctx.roundRect(x, y, barWidth, barHeight, [barWidth / 2, barWidth / 2, 0, 0]);
      } else {
        ctx.rect(x, y, barWidth, barHeight);
      }
      ctx.fill();
    }

    requestAnimationFrame(this.loop);
  }
}
