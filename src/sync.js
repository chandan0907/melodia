// PeerJS Real-time "Listen Together" Synchronizer
import { audio } from './audio.js';

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:global.stun.twilio.com:3478' }
  ]
};

class ListenTogetherSync {
  constructor() {
    this.peer = null;
    this.peerPromise = null;
    this.role = 'solo'; // 'solo' | 'host' | 'guest'
    this.roomId = null;
    this.guestConns = [];
    this.hostConn = null;
    this.heartbeatTimer = null;
    this.subscribers = new Set();
    this.isApplyingHostSync = false;
  }

  init() {
    this.checkUrlForRoom();

    window.addEventListener('hashchange', () => {
      this.checkUrlForRoom();
    });

    // When host changes track/state, broadcast immediately to all guests
    audio.subscribe(() => {
      if (this.role === 'host' && this.guestConns.length > 0 && !this.isApplyingHostSync) {
        this.broadcastCurrentState();
      }
    });
  }

  subscribe(callback) {
    this.subscribers.add(callback);
    callback(this.getState());
    return () => this.subscribers.delete(callback);
  }

  notify() {
    const state = this.getState();
    this.subscribers.forEach((cb) => {
      try { cb(state); } catch (e) { console.error('Sync subscriber error:', e); }
    });
  }

  getState() {
    let count = 1;
    if (this.role === 'host') {
      count = this.guestConns.filter(c => c && c.open).length + 1;
    } else if (this.role === 'guest' && this.hostConn && this.hostConn.open) {
      count = 2;
    }

    return {
      role: this.role,
      roomId: this.roomId,
      listenersCount: count,
      inviteLink: this.roomId 
        ? `${window.location.origin}${window.location.pathname}#room=${this.roomId}` 
        : null
    };
  }

  async ensurePeer() {
    if (this.peer && !this.peer.destroyed) {
      if (this.peer.id) return this.peer.id;
      if (this.peerPromise) return this.peerPromise;
    }

    this.peerPromise = new Promise(async (resolve, reject) => {
      // 1. Wait for PeerJS CDN script if still downloading
      if (typeof window.Peer === 'undefined') {
        for (let i = 0; i < 35; i++) {
          await new Promise((r) => setTimeout(r, 100));
          if (typeof window.Peer !== 'undefined') break;
        }
      }

      if (typeof window.Peer === 'undefined') {
        const err = new Error('PeerJS library is not available');
        window.dispatchEvent(new CustomEvent('app:toast', {
          detail: '⚠️ P2P library not loaded. Check internet connection.'
        }));
        reject(err);
        return;
      }

      try {
        const p = new window.Peer(undefined, { config: ICE_SERVERS });
        this.peer = p;

        p.on('open', (id) => {
          this.roomId = id;
          resolve(id);
        });

        p.on('disconnected', () => {
          // Reconnect to signaling server if disconnected
          try { p.reconnect(); } catch (e) {}
        });

        p.on('error', (err) => {
          console.warn('PeerJS notice:', err);
          if (err.type === 'peer-unavailable') {
            window.dispatchEvent(new CustomEvent('app:toast', {
              detail: 'Room not found or host has disconnected.'
            }));
          } else {
            window.dispatchEvent(new CustomEvent('app:toast', {
              detail: `P2P status: ${err.type || 'network'}`
            }));
          }
          reject(err);
        });

        p.on('connection', (conn) => this.handleIncomingConnection(conn));
      } catch (e) {
        reject(e);
      }
    });

    this.peerPromise.catch(() => {
      this.peerPromise = null;
    });

    return this.peerPromise;
  }

  /* ------------------------------------------------ Host Actions */
  async startHosting() {
    if (this.role === 'host' && this.roomId) {
      return this.getState().inviteLink;
    }

    try {
      const id = await this.ensurePeer();
      this.role = 'host';
      this.roomId = id;

      // Update URL hash without reload so host can also copy from address bar
      window.history.replaceState(null, '', `${window.location.pathname}#room=${id}`);

      // Start periodic sync heartbeat (every 3 seconds)
      if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = setInterval(() => {
        if (this.role === 'host' && this.guestConns.length > 0) {
          this.broadcastCurrentState();
        }
      }, 3000);

      this.notify();
      return this.getState().inviteLink;
    } catch (e) {
      console.error('Failed to start hosting:', e);
      throw e;
    }
  }

  handleIncomingConnection(conn) {
    conn.on('open', () => {
      this.guestConns.push(conn);
      this.notify();

      window.dispatchEvent(new CustomEvent('app:toast', {
        detail: '🎉 A friend joined your Listen Together room!'
      }));

      // Immediately send current playing state
      this.broadcastCurrentState(conn);
    });

    conn.on('data', (data) => {
      if (!data) return;
      if (data.action === 'toggle') {
        audio.toggle();
      } else if (data.action === 'play') {
        audio.play();
      } else if (data.action === 'pause') {
        audio.pause();
      } else if (data.action === 'seek') {
        audio.seek(data.time || 0);
      } else if (data.action === 'select-record') {
        audio.playRecord(data.recordId, data.trackIdx || 0);
      } else if (data.action === 'select-playlist') {
        audio.playPlaylist(data.playlistId);
      } else if (data.action === 'next') {
        audio.next();
      } else if (data.action === 'prev') {
        audio.prev();
      }
    });

    const drop = () => {
      this.guestConns = this.guestConns.filter((c) => c !== conn);
      this.notify();
      this.broadcastCurrentState();
    };

    conn.on('close', drop);
    conn.on('error', drop);
  }

  broadcastCurrentState(targetConn = null) {
    if (this.role !== 'host') return;

    const audioState = audio.getState();
    const payload = {
      type: 'sync-state',
      track: audioState.track,
      isPlaying: audioState.isPlaying,
      time: audioState.track.currentTimeSeconds || 0,
      timestamp: Date.now(),
      listenersCount: this.guestConns.filter(c => c && c.open).length + 1
    };

    if (targetConn && targetConn.open) {
      try { targetConn.send(payload); } catch (e) {}
    } else {
      this.guestConns.forEach((c) => {
        if (c && c.open) {
          try { c.send(payload); } catch (e) {}
        }
      });
    }
  }

  /* ------------------------------------------------ Guest Actions */
  async joinRoom(roomId) {
    if (!roomId) return;
    this.roomId = roomId;

    window.dispatchEvent(new CustomEvent('app:toast', {
      detail: 'Connecting to studio room...'
    }));

    try {
      await this.ensurePeer();
      const conn = this.peer.connect(roomId, { reliable: true });

      const timeout = setTimeout(() => {
        if (!conn.open) {
          window.dispatchEvent(new CustomEvent('app:toast', {
            detail: 'Room host offline or busy. Please check with your friend.'
          }));
        }
      }, 12000);

      conn.on('open', () => {
        clearTimeout(timeout);
        this.role = 'guest';
        this.hostConn = conn;
        this.notify();

        window.dispatchEvent(new CustomEvent('app:toast', {
          detail: '🎧 Connected! Music is now synchronized.'
        }));
      });

      conn.on('data', (data) => {
        if (data && data.type === 'sync-state') {
          this.applyHostSync(data);
        }
      });

      const onHostDisconnect = () => {
        if (this.role !== 'guest') return;
        this.role = 'solo';
        this.hostConn = null;
        this.notify();

        window.dispatchEvent(new CustomEvent('app:toast', {
          detail: 'The host has ended the session. Resuming solo mode.'
        }));
      };

      conn.on('close', onHostDisconnect);
      conn.on('error', onHostDisconnect);
    } catch (e) {
      console.error('Failed to join room:', e);
    }
  }

  applyHostSync(data) {
    this.isApplyingHostSync = true;
    try {
      const currentAudio = audio.getState();
      const track = data.track;
      if (!track) return;

      // 1. Check if track changed
      const trackChanged = !currentAudio.track || currentAudio.track.ytId !== track.ytId;
      if (trackChanged) {
        if (track.recordId) {
          audio.playRecord(track.recordId, track.trackIdx || 0);
        } else if (track.playlistId) {
          audio.playPlaylist(track.playlistId);
        } else if (track.ytId) {
          audio.playYouTubeVideo(track.ytId, data.time || 0);
        }
      }

      // 2. Sync play / pause state
      if (data.isPlaying && !audio.isPlaying) {
        audio.play();
      } else if (!data.isPlaying && audio.isPlaying) {
        audio.pause();
      }

      // 3. Drift correction (seek only if drift > 2.5s to prevent audio glitches)
      if (audio.ytPlayer && audio.ytReady && typeof audio.ytPlayer.getCurrentTime === 'function') {
        try {
          const curTime = audio.ytPlayer.getCurrentTime() || 0;
          const targetTime = data.time || 0;
          if (Math.abs(curTime - targetTime) > 2.5) {
            audio.ytPlayer.seekTo(targetTime, true);
          }
        } catch (e) {}
      }
    } finally {
      setTimeout(() => {
        this.isApplyingHostSync = false;
      }, 300);
    }
  }

  sendGuestCommand(action, payload = {}) {
    if (this.role === 'guest' && this.hostConn && this.hostConn.open) {
      try {
        this.hostConn.send({ action, ...payload });
        return true;
      } catch (e) {
        console.warn('Error sending guest command:', e);
      }
    }
    return false;
  }

  leaveRoom() {
    if (this.hostConn) {
      try { this.hostConn.close(); } catch (e) {}
      this.hostConn = null;
    }
    this.guestConns.forEach((c) => {
      try { c.close(); } catch (e) {}
    });
    this.guestConns = [];

    if (this.peer) {
      try { this.peer.destroy(); } catch (e) {}
      this.peer = null;
      this.peerPromise = null;
    }

    this.role = 'solo';
    this.roomId = null;
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
    this.notify();

    window.history.replaceState(null, '', window.location.pathname);
    window.dispatchEvent(new CustomEvent('app:toast', {
      detail: 'Left Listen Together room'
    }));
  }

  checkUrlForRoom() {
    if (typeof window === 'undefined') return;
    const url = window.location.href;
    const match = url.match(/[#?]room=([a-zA-Z0-9_-]+)/);

    if (match && match[1]) {
      const targetRoomId = match[1];
      // If we are already connected or hosting this room, skip
      if (this.roomId === targetRoomId && this.role !== 'solo') return;

      window.dispatchEvent(new CustomEvent('sync:invite', {
        detail: { roomId: targetRoomId }
      }));
    }
  }
}

export const sync = new ListenTogetherSync();
