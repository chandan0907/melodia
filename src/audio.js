// Unified Audio Engine: Web Audio API Synthesizer & YouTube Iframe Player + PeerJS Sync
import { RECORDS, PLAYLISTS } from './data.js';

class AudioEngine {
  constructor() {
    this.audioCtx = null;
    this.analyser = null;
    this.synthGain = null;
    this.synthTimer = null;
    this.isPlaying = false;
    this.volume = 0.8;
    this.mode = 'synth'; // 'synth' | 'youtube'
    
    // Current track info
    this.currentTrack = {
      title: 'The Ghost Sessions',
      artist: 'Kai Sterling & Sarah Preston',
      album: 'love',
      cover: './assets/images/album_love.jpg',
      duration: '4:15',
      durationSeconds: 255,
      currentTimeSeconds: 0,
      ytId: 'lp-EO5I60KA'
    };

    // YouTube state
    this.ytPlayer = null;
    this.ytReady = false;
    this.queue = [];
    this.queueIndex = 0;
    
    // Sync / PeerJS
    this.role = 'solo'; // 'solo' | 'host' | 'guest'
    this.peer = null;
    this.hostConn = null;
    this.guestConns = [];
    
    this.subscribers = new Set();
    this.progressInterval = null;

    // Load saved volume
    try {
      const saved = localStorage.getItem('mel_volume');
      if (saved) this.volume = parseFloat(saved);
    } catch (e) {}
  }

  init() {
    this.initYouTube();
    this.startProgressTicker();
  }

  subscribe(callback) {
    this.subscribers.add(callback);
    callback(this.getState());
    return () => this.subscribers.delete(callback);
  }

  notify() {
    const state = this.getState();
    this.subscribers.forEach((cb) => {
      try { cb(state); } catch (e) { console.error(e); }
    });
    this.updateMediaSession();
  }

  getState() {
    return {
      isPlaying: this.isPlaying,
      volume: this.volume,
      mode: this.mode,
      track: { ...this.currentTrack },
      progress: this.currentTrack.durationSeconds > 0 
        ? (this.currentTrack.currentTimeSeconds / this.currentTrack.durationSeconds) * 100 
        : 0,
      role: this.role,
      listenersCount: this.role === 'host' ? this.guestConns.length + 1 : (this.role === 'guest' ? 2 : 1)
    };
  }

  /* ------------------------------------------------ Web Audio Synthesizer */
  ensureAudioContext() {
    if (!this.audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.audioCtx = new AudioContext();
      this.analyser = this.audioCtx.createAnalyser();
      this.analyser.fftSize = 128;
      this.analyser.smoothingTimeConstant = 0.85;

      this.synthGain = this.audioCtx.createGain();
      this.synthGain.gain.setValueAtTime(this.volume, this.audioCtx.currentTime);

      this.synthGain.connect(this.analyser);
      this.analyser.connect(this.audioCtx.destination);
    }

    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  startSynthSequence() {
    this.ensureAudioContext();
    if (this.synthTimer) clearInterval(this.synthTimer);

    // Ambient chord progression: Cm9 -> Abmaj7 -> Fm9 -> G7b9
    const chords = [
      [130.81, 155.56, 196.00, 233.08, 293.66], // C3, Eb3, G3, Bb3, D4
      [103.83, 130.81, 155.56, 207.65, 261.63], // Ab2, C3, Eb3, Ab3, C4
      [87.31, 130.81, 155.56, 174.61, 220.00],  // F2, C3, Eb3, F3, A3
      [98.00, 123.47, 146.83, 196.00, 246.94]   // G2, B2, D3, G3, B3
    ];
    let step = 0;

    const playChordStep = () => {
      if (!this.isPlaying || this.mode !== 'synth') return;
      const chord = chords[step % chords.length];
      const now = this.audioCtx.currentTime;

      // Play soft warm chord notes
      chord.forEach((freq, idx) => {
        const osc = this.audioCtx.createOscillator();
        const noteGain = this.audioCtx.createGain();
        const filter = this.audioCtx.createBiquadFilter();

        osc.type = idx === 0 ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(freq, now);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(500 + Math.sin(now * 0.5) * 200, now);
        filter.Q.value = 2.0;

        // Envelope
        const attack = 0.4 + idx * 0.05;
        const decay = 2.4;
        noteGain.gain.setValueAtTime(0.0001, now);
        noteGain.gain.exponentialRampToValueAtTime(0.08 / (idx + 1), now + attack);
        noteGain.gain.exponentialRampToValueAtTime(0.0001, now + attack + decay);

        osc.connect(filter);
        filter.connect(noteGain);
        noteGain.connect(this.synthGain);

        osc.start(now);
        osc.stop(now + attack + decay + 0.1);
      });

      // Sub-bass hit
      const sub = this.audioCtx.createOscillator();
      const subGain = this.audioCtx.createGain();
      sub.type = 'sine';
      sub.frequency.setValueAtTime(chord[0] / 2, now);
      subGain.gain.setValueAtTime(0.18, now);
      subGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.8);
      sub.connect(subGain);
      subGain.connect(this.synthGain);
      sub.start(now);
      sub.stop(now + 1.9);

      step++;
    };

    playChordStep();
    this.synthTimer = setInterval(playChordStep, 2400);
  }

  stopSynthSequence() {
    if (this.synthTimer) {
      clearInterval(this.synthTimer);
      this.synthTimer = null;
    }
  }

  /* ------------------------------------------------ YouTube Player */
  initYouTube() {
    if (window.YT && window.YT.Player) {
      this.setupYTPlayer();
    } else {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      document.head.appendChild(tag);
      window.onYouTubeIframeAPIReady = () => this.setupYTPlayer();
    }
  }

  setupYTPlayer() {
    const container = document.getElementById('yt-host');
    if (!container) return;

    this.ytPlayer = new window.YT.Player('yt-host', {
      width: '100%',
      height: '100%',
      playerVars: {
        controls: 0,
        disablekb: 1,
        fs: 0,
        modestbranding: 1,
        rel: 0,
        iv_load_policy: 3,
        playsinline: 1,
        cc_load_policy: 0,
        origin: window.location.origin
      },
      events: {
        onReady: () => {
          this.ytReady = true;
          this.ytPlayer.setVolume(this.volume * 100);
        },
        onStateChange: (e) => {
          if (e.data === window.YT.PlayerState.PLAYING) {
            this.isPlaying = true;
            this.notify();
          } else if (e.data === window.YT.PlayerState.PAUSED) {
            this.isPlaying = false;
            this.notify();
          } else if (e.data === window.YT.PlayerState.ENDED) {
            this.handleEnded();
          }
        }
      }
    });
  }

  /* ------------------------------------------------ Playback Controls */
  playRecord(recordId, trackIdx = 0) {
    const record = RECORDS.find((r) => r.id === recordId) || RECORDS[0];
    const track = record.tracks[trackIdx] || record.tracks[0];

    this.currentTrack = {
      title: track.title,
      artist: record.artist,
      album: record.title,
      cover: record.cover,
      duration: track.duration,
      durationSeconds: this.parseDuration(track.duration),
      currentTimeSeconds: 0,
      ytId: track.ytId,
      recordId: record.id,
      trackIdx: trackIdx
    };

    this.mode = 'synth'; // Default to instant high-res procedural synth
    this.isPlaying = true;
    this.startSynthSequence();
    this.notify();
    this.broadcastSync();
  }

  playPlaylist(playlistId) {
    const pl = PLAYLISTS.find((p) => p.id === playlistId) || PLAYLISTS[0];
    this.queue = [...pl.tracks];
    this.queueIndex = 0;
    const firstId = this.queue[0];

    this.currentTrack = {
      title: pl.name,
      artist: 'Melodia Studio Session',
      album: pl.name,
      cover: './assets/images/album_love.jpg',
      duration: '3:30',
      durationSeconds: 210,
      currentTimeSeconds: 0,
      ytId: firstId,
      playlistId: pl.id
    };

    this.mode = 'youtube';
    this.isPlaying = true;

    if (this.ytReady && this.ytPlayer) {
      this.ytPlayer.loadVideoById(firstId);
      this.ytPlayer.playVideo();
    } else {
      this.mode = 'synth';
      this.startSynthSequence();
    }

    this.notify();
    this.broadcastSync();
  }

  playYouTubeTrack(ytId, title, artist, cover) {
    this.mode = 'youtube';
    this.currentTrack = {
      title: title || 'Studio Broadcast',
      artist: artist || 'Melodia Records',
      album: 'Live Session',
      cover: cover || './assets/images/album_love.jpg',
      duration: '3:45',
      durationSeconds: 225,
      currentTimeSeconds: 0,
      ytId: ytId
    };

    this.isPlaying = true;
    if (this.ytReady && this.ytPlayer) {
      this.ytPlayer.loadVideoById(ytId);
      this.ytPlayer.playVideo();
    } else {
      this.mode = 'synth';
      this.startSynthSequence();
    }

    this.notify();
    this.broadcastSync();
  }

  toggle() {
    this.ensureAudioContext();
    this.isPlaying = !this.isPlaying;

    if (this.isPlaying) {
      if (this.mode === 'synth') {
        this.startSynthSequence();
      } else if (this.ytPlayer && this.ytReady) {
        this.ytPlayer.playVideo();
      }
    } else {
      if (this.mode === 'synth') {
        this.stopSynthSequence();
      } else if (this.ytPlayer && this.ytReady) {
        this.ytPlayer.pauseVideo();
      }
    }

    this.notify();
    this.broadcastSync();
  }

  next() {
    // If playing record
    if (this.currentTrack.recordId) {
      const record = RECORDS.find((r) => r.id === this.currentTrack.recordId);
      if (record) {
        const nextIdx = (this.currentTrack.trackIdx + 1) % record.tracks.length;
        this.playRecord(record.id, nextIdx);
        return;
      }
    }
    // Next in YouTube queue
    if (this.queue.length > 0) {
      this.queueIndex = (this.queueIndex + 1) % this.queue.length;
      const nextId = this.queue[this.queueIndex];
      this.playYouTubeTrack(nextId, 'Track #' + (this.queueIndex + 1), 'Melodia Session', this.currentTrack.cover);
      return;
    }
    // Advance to next album
    const nextRec = RECORDS[(RECORDS.findIndex((r) => r.id === this.currentTrack.album) + 1) % RECORDS.length] || RECORDS[0];
    this.playRecord(nextRec.id, 0);
  }

  prev() {
    if (this.currentTrack.recordId) {
      const record = RECORDS.find((r) => r.id === this.currentTrack.recordId);
      if (record) {
        const prevIdx = (this.currentTrack.trackIdx - 1 + record.tracks.length) % record.tracks.length;
        this.playRecord(record.id, prevIdx);
        return;
      }
    }
    this.toggle();
  }

  setVolume(val) {
    this.volume = Math.max(0, Math.min(1, val));
    if (this.synthGain && this.audioCtx) {
      this.synthGain.gain.setValueAtTime(this.volume, this.audioCtx.currentTime);
    }
    if (this.ytPlayer && this.ytReady) {
      this.ytPlayer.setVolume(this.volume * 100);
    }
    try {
      localStorage.setItem('mel_volume', this.volume);
    } catch (e) {}
    this.notify();
  }

  handleEnded() {
    this.next();
  }

  startProgressTicker() {
    this.progressInterval = setInterval(() => {
      if (!this.isPlaying) return;

      if (this.mode === 'youtube' && this.ytPlayer && this.ytReady && this.ytPlayer.getCurrentTime) {
        try {
          const cur = this.ytPlayer.getCurrentTime() || 0;
          const dur = this.ytPlayer.getDuration() || this.currentTrack.durationSeconds;
          this.currentTrack.currentTimeSeconds = cur;
          this.currentTrack.durationSeconds = dur;
        } catch (e) {}
      } else {
        this.currentTrack.currentTimeSeconds += 1;
        if (this.currentTrack.currentTimeSeconds >= this.currentTrack.durationSeconds) {
          this.handleEnded();
        }
      }
      this.notify();
    }, 1000);
  }

  getFrequencyData(array) {
    if (this.analyser) {
      this.analyser.getByteFrequencyData(array);
    } else {
      // Procedural synthetic energy if analyser not ready
      for (let i = 0; i < array.length; i++) {
        array[i] = this.isPlaying ? Math.floor(Math.random() * 80 + 30) : 5;
      }
    }
  }

  parseDuration(str) {
    if (!str) return 180;
    const parts = str.split(':').map(Number);
    if (parts.length === 2) return parts[0] * 60 + parts[1];
    return 180;
  }

  formatTime(seconds) {
    if (!isFinite(seconds) || seconds < 0) seconds = 0;
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  }

  updateMediaSession() {
    if (!('mediaSession' in navigator) || !window.MediaMetadata) return;
    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: this.currentTrack.title,
        artist: this.currentTrack.artist,
        album: this.currentTrack.album,
        artwork: [
          { src: this.currentTrack.cover, sizes: '512x512', type: 'image/jpeg' }
        ]
      });

      navigator.mediaSession.setActionHandler('play', () => this.toggle());
      navigator.mediaSession.setActionHandler('pause', () => this.toggle());
      navigator.mediaSession.setActionHandler('nexttrack', () => this.next());
      navigator.mediaSession.setActionHandler('previoustrack', () => this.prev());
    } catch (e) {}
  }

  /* --------------------------------------------- Listen Together (PeerJS) */
  broadcastSync() {
    if (this.role === 'host' && this.guestConns.length > 0) {
      const payload = {
        action: 'sync',
        track: this.currentTrack,
        isPlaying: this.isPlaying,
        time: this.currentTrack.currentTimeSeconds
      };
      this.guestConns.forEach((conn) => {
        if (conn.open) conn.send(payload);
      });
    }
  }
}

export const audio = new AudioEngine();
