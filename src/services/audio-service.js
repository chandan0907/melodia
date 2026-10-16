// PURPOSE: Unified audio playback engine managing YouTube audio streaming, Web Audio ambient synthesis fallback, and individual volume management.
// INTEGRATION: Communicates with RealtimeRoomSync for synchronized room playback, and audioState for reactive UI updates across all components.
// INPUT: Track metadata, record IDs, playlist identifiers, seek offsets, and user volume levels.
// OUTPUT: High-fidelity audio playback via YouTube iframe API or HTML5 Web Audio API synthesizer.

import { RECORDS, PLAYLISTS } from '../data.js';
import { audioState } from '../state/audio-state.js';

class AudioEngine {
  constructor() {
    // Web Audio API context and synthesizer nodes
    this.audioCtx = null;
    this.analyser = null;
    this.synthGain = null;
    this.synthTimer = null;

    // Playback state flags
    this.isPlaying = false;
    this.volume = 0.85;
    this.prevVolume = 0.85;
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

    // YouTube Iframe Player state
    this.ytPlayer = null;
    this.ytReady = false;
    this.queued = null; // { ytId, startSeconds }
    this.queue = [];
    this.queueIndex = 0;

    // Observers and intervals
    this.subscribers = new Set();
    this.progressInterval = null;

    // Restore individual device volume from persistent local storage
    this.loadSavedVolume();
  }

  // PURPOSE: Restores previously saved individual user volume preferences from localStorage.
  // INTEGRATION: Called during AudioEngine initialization.
  // INPUT: None.
  // OUTPUT: Updates internal volume state.
  loadSavedVolume() {
    try {
      const saved = localStorage.getItem('mel_volume');
      if (saved) {
        const parsed = parseFloat(saved);
        if (!isNaN(parsed)) {
          this.volume = Math.max(0, Math.min(1, parsed));
          if (this.volume > 0) this.prevVolume = this.volume;
        }
      }
    } catch (e) {
      // Ignore localStorage access failures in sandboxed environments
    }
  }

  // PURPOSE: Initializes the YouTube Iframe API and starts the high-resolution progress ticker.
  // INTEGRATION: Invoked by the main application orchestrator during bootstrap.
  // SIDE EFFECTS: Injects YouTube iframe API script tag into document head and starts a 250ms interval.
  init() {
    this.initYouTube();
    this.startProgressTicker();
    this.notify();
  }

  // PURPOSE: Registers an observer callback for audio state changes.
  // INPUT: callback function receiving (stateSnapshot).
  // OUTPUT: Teardown unsubscribe function.
  subscribe(callback) {
    if (typeof callback !== 'function') return () => {};
    this.subscribers.add(callback);
    callback(this.getState());
    return () => this.subscribers.delete(callback);
  }

  // PURPOSE: Dispatches current playback state to subscribers and syncs to audioState.
  // INTEGRATION: Updates native MediaSession metadata and triggers UI re-renders.
  notify() {
    const state = this.getState();
    audioState.update({
      isPlaying: state.isPlaying,
      volume: state.volume,
      mode: state.mode,
      track: state.track,
      progress: state.progress
    });

    this.subscribers.forEach((cb) => {
      try { cb(state); } catch (e) { console.error('AudioEngine notify error:', e); }
    });
    this.updateMediaSession();
  }

  // PURPOSE: Returns an immutable snapshot of the current audio playback state.
  // OUTPUT: State snapshot object.
  getState() {
    return {
      isPlaying: this.isPlaying,
      volume: this.volume,
      mode: this.mode,
      track: { ...this.currentTrack },
      progress: this.currentTrack.durationSeconds > 0
        ? (this.currentTrack.currentTimeSeconds / this.currentTrack.durationSeconds) * 100
        : 0
    };
  }

  /* ------------------------------------------------ YouTube Player Engine */

  // PURPOSE: Asynchronously loads the YouTube Iframe API if not already present.
  // INTEGRATION: Injects script into document.head and hooks window.onYouTubeIframeAPIReady.
  initYouTube() {
    if (typeof window === 'undefined') return;

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

  // PURPOSE: Instantiates the YouTube iframe player inside the programmatic container.
  // INTEGRATION: Binds player state events (playing, paused, ended, error) to the AudioEngine.
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
            if (this.volume === 0) {
              try { this.ytPlayer.mute(); } catch (e) {}
            }
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
            // Move to next track automatically upon video restriction
            setTimeout(() => this.next(), 600);
          }
        }
      });
    } catch (e) {
      console.warn('Error instantiating YouTube player:', e);
    }
  }

  // PURPOSE: Loads and starts video playback on the underlying YouTube player.
  // INPUT: ytId (YouTube Video ID string), startSeconds (seek offset in seconds).
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
      // Play ambient sound while buffering or awaiting API readiness
      this.startSynthSequence();
    }

    this.notify();
  }

  /* ------------------------------------------------ Playback Controls */

  // PURPOSE: Loads and plays a record album track by ID and index.
  // INPUT: recordId (string), trackIdx (number).
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

  // PURPOSE: Loads and plays an entire curated playlist queue.
  // INPUT: playlistId (string).
  playPlaylist(playlistId) {
    const pl = PLAYLISTS.find((p) => p.id === playlistId) || PLAYLISTS[0];
    this.queue = [...pl.tracks];
    this.queueIndex = 0;
    const firstId = this.queue[0];

    this.currentTrack = {
      title: pl.name,
      artist: 'Tunora Studio Session',
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

  // PURPOSE: Resumes current playback.
  play() {
    this.isPlaying = true;
    if (this.mode === 'youtube' && this.ytPlayer && this.ytReady && typeof this.ytPlayer.playVideo === 'function') {
      this.stopSynthSequence();
      this.ytPlayer.playVideo();
    } else {
      this.startSynthSequence();
    }
    this.notify();
  }

  // PURPOSE: Pauses current playback.
  pause() {
    this.isPlaying = false;
    if (this.ytPlayer && this.ytReady && typeof this.ytPlayer.pauseVideo === 'function') {
      this.ytPlayer.pauseVideo();
    }
    this.stopSynthSequence();
    this.notify();
  }

  // PURPOSE: Toggles between play and pause states.
  toggle() {
    if (this.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  }

  // PURPOSE: Seeks playback to a specific offset in seconds.
  // INPUT: seconds (number).
  seek(seconds) {
    this.currentTrack.currentTimeSeconds = Math.max(0, Math.min(seconds, this.currentTrack.durationSeconds || seconds));
    if (this.ytPlayer && this.ytReady && typeof this.ytPlayer.seekTo === 'function') {
      try {
        this.ytPlayer.seekTo(this.currentTrack.currentTimeSeconds, true);
      } catch (e) {
        console.warn('Seek error:', e);
      }
    }
    this.notify();
  }

  // PURPOSE: Advances to the next track in current album or playlist queue.
  next() {
    if (this.currentTrack.recordId) {
      const record = RECORDS.find((r) => r.id === this.currentTrack.recordId);
      if (record && record.tracks.length > 0) {
        const nextIdx = (this.currentTrack.trackIdx + 1) % record.tracks.length;
        this.playRecord(record.id, nextIdx);
        return;
      }
    }
    if (this.queue.length > 0) {
      this.queueIndex = (this.queueIndex + 1) % this.queue.length;
      const nextId = this.queue[this.queueIndex];
      this.currentTrack.ytId = nextId;
      this.currentTrack.title = `Track #${this.queueIndex + 1}`;
      this.playYouTubeVideo(nextId, 0);
      return;
    }
    const currentIdx = RECORDS.findIndex((r) => r.id === this.currentTrack.recordId);
    const nextRec = RECORDS[(currentIdx + 1) % RECORDS.length] || RECORDS[0];
    this.playRecord(nextRec.id, 0);
  }

  // PURPOSE: Returns to previous track in current album or restarts current track.
  prev() {
    if (this.currentTrack.recordId) {
      const record = RECORDS.find((r) => r.id === this.currentTrack.recordId);
      if (record && record.tracks.length > 0) {
        const prevIdx = (this.currentTrack.trackIdx - 1 + record.tracks.length) % record.tracks.length;
        this.playRecord(record.id, prevIdx);
        return;
      }
    }
    this.seek(0);
  }

  // PURPOSE: Handles end-of-track event by advancing to the next queued item.
  handleEnded() {
    this.next();
  }

  /* ------------------------------------------------ Volume Control */

  // PURPOSE: Sets local device audio volume without affecting room peers.
  // INPUT: val (number from 0.0 to 1.0).
  setVolume(val) {
    this.volume = Math.max(0, Math.min(1, val));
    if (this.volume > 0) {
      this.prevVolume = this.volume;
    }
    if (this.synthGain && this.audioCtx) {
      this.synthGain.gain.setValueAtTime(this.volume, this.audioCtx.currentTime);
    }
    if (this.ytPlayer && this.ytReady) {
      try {
        if (typeof this.ytPlayer.setVolume === 'function') {
          this.ytPlayer.setVolume(this.volume * 100);
        }
        if (this.volume === 0 && typeof this.ytPlayer.mute === 'function') {
          this.ytPlayer.mute();
        } else if (this.volume > 0 && typeof this.ytPlayer.unMute === 'function') {
          this.ytPlayer.unMute();
        }
      } catch (e) {}
    }
    try {
      localStorage.setItem('mel_volume', this.volume.toString());
    } catch (e) {}
    this.notify();
  }

  // PURPOSE: Toggles between muted and restored volume.
  toggleMute() {
    if (this.volume > 0) {
      this.prevVolume = this.volume;
      this.setVolume(0);
    } else {
      this.setVolume(this.prevVolume || 0.85);
    }
  }

  /* ------------------------------------------------ Progress & Timing */

  // PURPOSE: Starts an interval timer to continuously track playback position.
  startProgressTicker() {
    if (this.progressInterval) clearInterval(this.progressInterval);
    this.progressInterval = setInterval(() => {
      if (!this.isPlaying) return;

      if (this.mode === 'youtube' && this.ytPlayer && this.ytReady && typeof this.ytPlayer.getCurrentTime === 'function') {
        try {
          const cur = this.ytPlayer.getCurrentTime();
          const dur = this.ytPlayer.getDuration();
          if (typeof cur === 'number' && !isNaN(cur)) {
            this.currentTrack.currentTimeSeconds = cur;
          }
          if (typeof dur === 'number' && !isNaN(dur) && dur > 0) {
            this.currentTrack.durationSeconds = dur;
            this.currentTrack.duration = this.formatTime(dur);
          }
        } catch (e) {}
      } else {
        this.currentTrack.currentTimeSeconds = (this.currentTrack.currentTimeSeconds || 0) + 0.25;
        if (this.currentTrack.durationSeconds && this.currentTrack.currentTimeSeconds >= this.currentTrack.durationSeconds) {
          this.handleEnded();
        }
      }

      this.notify();
    }, 250);
  }

  // PURPOSE: Formats seconds into a human-readable mm:ss string.
  // INPUT: totalSeconds (number).
  // OUTPUT: Formatted time string (e.g. "4:15").
  formatTime(totalSeconds) {
    if (!totalSeconds || isNaN(totalSeconds)) return '0:00';
    const s = Math.floor(totalSeconds);
    const m = Math.floor(s / 60);
    const rem = s % 60;
    return `${m}:${rem < 10 ? '0' : ''}${rem}`;
  }

  // PURPOSE: Parses duration strings ("mm:ss") into seconds.
  // INPUT: durStr (string).
  // OUTPUT: Total seconds (number).
  parseDuration(durStr) {
    if (!durStr) return 240;
    const parts = durStr.split(':').map(Number);
    if (parts.length === 2) return parts[0] * 60 + parts[1];
    return 240;
  }

  /* ------------------------------------------------ Ambient Web Audio Synthesizer */

  // PURPOSE: Initializes or resumes the Web Audio API context for ambient synthesis and audio analysis.
  ensureAudioContext() {
    if (typeof window === 'undefined') return;
    if (!this.audioCtx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      this.audioCtx = new AudioCtx();
      this.analyser = this.audioCtx.createAnalyser();
      this.analyser.fftSize = 64;
      this.analyser.smoothingTimeConstant = 0.8;

      this.synthGain = this.audioCtx.createGain();
      this.synthGain.gain.setValueAtTime(this.volume * 0.45, this.audioCtx.currentTime);

      this.synthGain.connect(this.analyser);
      this.analyser.connect(this.audioCtx.destination);
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  // PURPOSE: Starts algorithmic ambient chord progression playback for atmospheric studio background.
  startSynthSequence() {
    this.ensureAudioContext();
    if (!this.audioCtx) return;
    this.stopSynthSequence();

    const chords = [
      [146.83, 220.00, 261.63, 329.63], // Dm9
      [130.81, 196.00, 261.63, 329.63], // Cmaj9
      [116.54, 174.61, 220.00, 261.63], // Bbmaj7
      [110.00, 164.81, 220.00, 261.63]  // Am7
    ];
    let chordIdx = 0;

    const playNext = () => {
      if (!this.isPlaying) return;
      this.playChord(chords[chordIdx]);
      chordIdx = (chordIdx + 1) % chords.length;
      this.synthTimer = setTimeout(playNext, 4500);
    };

    playNext();
  }

  // PURPOSE: Synthesizes warm analog polysynth tones using filtered harmonic sawtooth oscillators.
  // INPUT: freqs (array of frequency numbers in Hz).
  playChord(freqs) {
    if (!this.audioCtx || this.audioCtx.state !== 'running') return;
    const now = this.audioCtx.currentTime;

    freqs.forEach((freq, idx) => {
      const osc = this.audioCtx.createOscillator();
      const filter = this.audioCtx.createBiquadFilter();
      const gain = this.audioCtx.createGain();

      osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(freq, now);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(650, now);
      filter.frequency.exponentialRampToValueAtTime(1400, now + 1.8);
      filter.frequency.exponentialRampToValueAtTime(450, now + 4.2);

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.08 / freqs.length, now + 0.9);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 4.2);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.synthGain);

      osc.start(now);
      osc.stop(now + 4.4);
    });
  }

  // PURPOSE: Stops active ambient synthesizer sequence.
  stopSynthSequence() {
    if (this.synthTimer) {
      clearTimeout(this.synthTimer);
      this.synthTimer = null;
    }
  }

  /* ------------------------------------------------ MediaSession API */

  // PURPOSE: Updates browser system lockscreen and notification media playback controls.
  updateMediaSession() {
    if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) return;

    try {
      navigator.mediaSession.metadata = new window.MediaMetadata({
        title: this.currentTrack.title || 'Studio Playback',
        artist: this.currentTrack.artist || 'Beat Records',
        album: this.currentTrack.album || 'Tunora',
        artwork: [
          { src: this.currentTrack.cover || './assets/images/album_love.jpg', sizes: '512x512', type: 'image/jpeg' }
        ]
      });

      navigator.mediaSession.setActionHandler('play', () => this.play());
      navigator.mediaSession.setActionHandler('pause', () => this.pause());
      navigator.mediaSession.setActionHandler('previoustrack', () => this.prev());
      navigator.mediaSession.setActionHandler('nexttrack', () => this.next());
    } catch (e) {
      // Ignore unsupported browser handlers
    }
  }
}

export const audio = new AudioEngine();
