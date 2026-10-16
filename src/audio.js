// Unified Audio Engine: YouTube Streaming Player + Web Audio Ambient Synth + PeerJS Sync
import { RECORDS, PLAYLISTS } from './data.js';

class AudioEngine {
  constructor() {
    this.audioCtx = null;
    this.analyser = null;
    this.synthGain = null;
    this.synthTimer = null;
    this.isPlaying = false;
    this.volume = 0.85;
    this.mode = 'youtube'; // 'youtube' | 'synth'
    
    // Default current track: Awarapan 2 - Toh Phir Aao
    this.currentTrack = {
      title: 'Toh Phir Aao',
      artist: 'Mustafa Zahid & Pritam',
      album: 'Awarapan 2',
      cover: './assets/images/album_awarapan.jpg',
      duration: '5:48',
      durationSeconds: 348,
      currentTimeSeconds: 0,
      ytId: 'n_VrRuNkbrE',
      recordId: 'awarapan-2',
      trackIdx: 0
    };

    // YouTube state
    this.ytPlayer = null;
    this.ytReady = false;
    this.queued = null; // { ytId, startSeconds }
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

  /* ------------------------------------------------ YouTube Player */
  initYouTube() {
    if (window.YT && window.YT.Player) {
      this.setupYTPlayer();
    } else {
      const existingScript = document.querySelector('script[src*="youtube.com/iframe_api"]');
      if (!existingScript) {
        const tag = document.createElement('script');
        tag.src = 'https://www.youtube.com/iframe_api';
        document.head.appendChild(tag);
      }
      const prevCallback = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        if (typeof prevCallback === 'function') prevCallback();
        this.setupYTPlayer();
      };
    }
  }

  setupYTPlayer() {
    const container = document.getElementById('yt-host');
    if (!container || this.ytPlayer) return;

    try {
      this.ytPlayer = new window.YT.Player('yt-host', {
        width: '100%',
        height: '100%',
        playerVars: {
          autoplay: 1,
          controls: 0,
          disablekb: 1,
          fs: 0,
          modestbranding: 1,
          rel: 0,
          iv_load_policy: 3,
          playsinline: 1,
          cc_load_policy: 0
        },
        events: {
          onReady: () => {
            this.ytReady = true;
            this.ytPlayer.setVolume(this.volume * 100);
            if (this.queued) {
              const q = this.queued;
              this.queued = null;
              this.playYouTubeVideo(q.ytId, q.startSeconds || 0);
            }
          },
          onStateChange: (e) => {
            if (e.data === window.YT.PlayerState.PLAYING) {
              this.isPlaying = true;
              this.stopSynthSequence();
              this.notify();
            } else if (e.data === window.YT.PlayerState.PAUSED) {
              this.isPlaying = false;
              this.notify();
            } else if (e.data === window.YT.PlayerState.ENDED) {
              this.handleEnded();
            }
          },
          onError: (err) => {
            console.warn('YouTube playback notice:', err);
            // Move to next track or ambient fallback
            setTimeout(() => this.next(), 500);
          }
        }
      });
    } catch (e) {
      console.warn('Error instantiating YouTube player:', e);
    }
  }

  playYouTubeVideo(ytId, startSeconds = 0) {
    this.mode = 'youtube';
    this.isPlaying = true;
    this.stopSynthSequence();

    if (this.ytReady && this.ytPlayer && typeof this.ytPlayer.loadVideoById === 'function') {
      try {
        this.ytPlayer.loadVideoById({
          videoId: ytId,
          startSeconds: Math.max(0, startSeconds || 0)
        });
        this.ytPlayer.playVideo();
      } catch (e) {
        console.warn('Error loading YouTube video:', e);
      }
    } else {
      this.queued = { ytId, startSeconds };
      // Play ambient sound while buffering/connecting
      this.startSynthSequence();
    }

    this.notify();
    this.broadcastSync();
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

    if (track.ytId) {
      this.playYouTubeVideo(track.ytId, 0);
    } else {
      this.mode = 'synth';
      this.isPlaying = true;
      this.startSynthSequence();
      this.notify();
    }
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
      cover: pl.id.includes('awarapan') ? './assets/images/album_awarapan.jpg' : './assets/images/album_love.jpg',
      duration: '4:30',
      durationSeconds: 270,
      currentTimeSeconds: 0,
      ytId: firstId,
      playlistId: pl.id
    };

    this.playYouTubeVideo(firstId, 0);
  }

  toggle() {
    this.isPlaying = !this.isPlaying;

    if (this.isPlaying) {
      if (this.mode === 'youtube' && this.ytPlayer && this.ytReady && typeof this.ytPlayer.playVideo === 'function') {
        this.stopSynthSequence();
        this.ytPlayer.playVideo();
      } else {
        this.startSynthSequence();
      }
    } else {
      if (this.ytPlayer && this.ytReady && typeof this.ytPlayer.pauseVideo === 'function') {
        this.ytPlayer.pauseVideo();
      }
      this.stopSynthSequence();
    }

    this.notify();
    this.broadcastSync();
  }

  next() {
    // If playing record with tracklist
    if (this.currentTrack.recordId) {
      const record = RECORDS.find((r) => r.id === this.currentTrack.recordId);
      if (record && record.tracks.length > 0) {
        const nextIdx = (this.currentTrack.trackIdx + 1) % record.tracks.length;
        this.playRecord(record.id, nextIdx);
        return;
      }
    }
    // Next in playlist queue
    if (this.queue.length > 0) {
      this.queueIndex = (this.queueIndex + 1) % this.queue.length;
      const nextId = this.queue[this.queueIndex];
      this.currentTrack.ytId = nextId;
      this.currentTrack.title = `Track #${this.queueIndex + 1}`;
      this.playYouTubeVideo(nextId, 0);
      return;
    }
    // Advance to next album
    const currentIdx = RECORDS.findIndex((r) => r.id === this.currentTrack.recordId);
    const nextRec = RECORDS[(currentIdx + 1) % RECORDS.length] || RECORDS[0];
    this.playRecord(nextRec.id, 0);
  }

  prev() {
    if (this.currentTrack.recordId) {
      const record = RECORDS.find((r) => r.id === this.currentTrack.recordId);
      if (record && record.tracks.length > 0) {
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
    if (this.ytPlayer && this.ytReady && typeof this.ytPlayer.setVolume === 'function') {
      this.ytPlayer.setVolume(this.volume * 100);
    }
    try {
      localStorage.setItem('mel_volume', this.volume.toString());
    } catch (e) {}
    this.notify();
  }

  handleEnded() {
    this.next();
  }

  startProgressTicker() {
    if (this.progressInterval) clearInterval(this.progressInterval);

    this.progressInterval = setInterval(() => {
      if (!this.isPlaying) return;

      if (this.mode === 'youtube' && this.ytPlayer && this.ytReady && typeof this.ytPlayer.getCurrentTime === 'function') {
        try {
          const cur = this.ytPlayer.getCurrentTime() || 0;
          const dur = this.ytPlayer.getDuration() || this.currentTrack.durationSeconds;
          if (dur > 0) {
            this.currentTrack.currentTimeSeconds = cur;
            this.currentTrack.durationSeconds = dur;
            this.currentTrack.duration = this.formatTime(dur);
          }
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

  /* ------------------------------------------------ Web Audio Synthesizer */
  ensureAudioContext() {
    if (!this.audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.audioCtx = new AudioContext();
      this.analyser = this.audioCtx.createAnalyser();
      this.analyser.fftSize = 128;
      this.analyser.smoothingTimeConstant = 0.85;

      this.synthGain = this.audioCtx.createGain();
      this.synthGain.gain.setValueAtTime(this.volume * 0.5, this.audioCtx.currentTime);

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

    // Warm chord progression (Dm -> Bb -> Gm -> A7)
    const chords = [
      [146.83, 174.61, 220.00, 261.63], // Dm7
      [116.54, 146.83, 174.61, 233.08], // Bbmaj7
      [98.00, 116.54, 146.83, 196.00],  // Gm7
      [110.00, 138.59, 164.81, 220.00]  // A7
    ];
    let step = 0;

    const playChordStep = () => {
      if (!this.isPlaying) return;
      const chord = chords[step % chords.length];
      const now = this.audioCtx.currentTime;

      chord.forEach((freq, idx) => {
        const osc = this.audioCtx.createOscillator();
        const noteGain = this.audioCtx.createGain();
        const filter = this.audioCtx.createBiquadFilter();

        osc.type = idx === 0 ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(freq, now);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(450 + Math.sin(now * 0.4) * 150, now);
        filter.Q.value = 1.5;

        const attack = 0.35 + idx * 0.05;
        const decay = 2.2;
        noteGain.gain.setValueAtTime(0.0001, now);
        noteGain.gain.exponentialRampToValueAtTime(0.06 / (idx + 1), now + attack);
        noteGain.gain.exponentialRampToValueAtTime(0.0001, now + attack + decay);

        osc.connect(filter);
        filter.connect(noteGain);
        noteGain.connect(this.synthGain);

        osc.start(now);
        osc.stop(now + attack + decay + 0.1);
      });

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

  getFrequencyData(array) {
    if (this.analyser && this.mode === 'synth') {
      this.analyser.getByteFrequencyData(array);
    } else {
      // Procedural animated energy during YouTube streaming
      const time = Date.now() * 0.004;
      for (let i = 0; i < array.length; i++) {
        if (this.isPlaying) {
          const wave = Math.sin(time + i * 0.3) * 0.5 + Math.sin(time * 1.8 + i * 0.15) * 0.3 + 0.5;
          array[i] = Math.floor(wave * 140 + 40);
        } else {
          array[i] = 6;
        }
      }
    }
  }

  parseDuration(str) {
    if (!str) return 210;
    const parts = str.split(':').map(Number);
    if (parts.length === 2) return parts[0] * 60 + parts[1];
    return 210;
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
