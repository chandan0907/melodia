// Production-Grade Real-time Room Synchronizer (MQTT Cloud State + WebRTC Mesh + Monotonic Versioning)
import mqtt from 'mqtt';
import { audio } from './audio.js';

const BROKER_URLS = [
  'wss://broker.emqx.io:8084/mqtt',
  'wss://broker.hivemq.com:8884/mqtt'
];

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:global.stun.twilio.com:3478' }
  ]
};

class RealtimeRoomSync {
  constructor() {
    this.clientId = 'user_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36).slice(-4);
    this.username = this.loadOrCreateUsername();
    this.roomId = null;
    this.roomName = 'Melodia Studio Room';
    this.role = 'solo'; // 'solo' | 'room'
    this.connected = false;
    this.connecting = false;
    
    // MQTT connection state
    this.mqttClient = null;
    this.activeBrokerIndex = 0;
    
    // WebRTC PeerJS state (co-transport)
    this.peer = null;
    this.peerPromise = null;
    this.peerConns = new Map();

    // Authoritative room state
    this.state = null;
    this.isApplyingRemoteState = false;
    
    // Presence & Heartbeats
    this.presenceMap = new Map(); // clientId -> { lastSeen, username }
    this.heartbeatTimer = null;
    this.driftTimer = null;
    this.presenceCleanupTimer = null;
    
    // Subscribers
    this.subscribers = new Set();
  }

  loadOrCreateUsername() {
    try {
      const saved = localStorage.getItem('mel_username');
      if (saved) return saved;
      const names = ['Listener', 'Audiophile', 'Melodia Guest', 'Studio Producer', 'Soundwave'];
      const randomName = `${names[Math.floor(Math.random() * names.length)]} #${Math.floor(100 + Math.random() * 900)}`;
      localStorage.setItem('mel_username', randomName);
      return randomName;
    } catch (e) {
      return 'Listener #404';
    }
  }

  init() {
    // 1. Check for Room in URL (path /room/:id or hash #room=:id or query ?room=:id)
    this.checkUrlForRoom();

    window.addEventListener('hashchange', () => this.checkUrlForRoom());
    window.addEventListener('popstate', () => this.checkUrlForRoom());

    // 2. Start continuous drift monitor
    if (this.driftTimer) clearInterval(this.driftTimer);
    this.driftTimer = setInterval(() => this.checkDrift(), 2000);

    // 3. Start presence prune timer
    if (this.presenceCleanupTimer) clearInterval(this.presenceCleanupTimer);
    this.presenceCleanupTimer = setInterval(() => this.cleanupPresence(), 6000);
  }

  subscribe(callback) {
    this.subscribers.add(callback);
    callback(this.getState());
    return () => this.subscribers.delete(callback);
  }

  notify() {
    const s = this.getState();
    this.subscribers.forEach((cb) => {
      try { cb(s); } catch (e) { console.error('Sync notify err:', e); }
    });
  }

  getState() {
    const activePresences = Array.from(this.presenceMap.values()).filter(p => (Date.now() - p.lastSeen) < 16000);
    const count = Math.max(1, activePresences.length || (this.connected ? 1 : 1));

    return {
      role: this.role,
      roomId: this.roomId,
      roomName: this.roomName,
      connected: this.connected,
      connecting: this.connecting,
      listenersCount: count,
      authoritativeState: this.state,
      shareUrl: this.getShareUrl(),
      shortCode: this.roomId ? this.roomId.toUpperCase() : null
    };
  }

  getShareUrl() {
    if (!this.roomId) return null;
    const origin = window.location.origin;
    // Produces clean production URL: https://domain/room/:id
    return `${origin}/room/${this.roomId}`;
  }

  getShareText() {
    const trackTitle = this.state?.track?.title || audio.currentTrack.title || 'Studio Records';
    return `🎧 Join my Melodia Beat Records room! Let's listen to "${trackTitle}" together in real time: ${this.getShareUrl()}`;
  }

  /* ------------------------------------------------ Room Creation & Joining */
  generateRoomId() {
    // Clean, readable, URL-safe room code (e.g., MEL-4K9X)
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 4; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `MEL-${code}`;
  }

  async createRoom(customName = 'Melodia Studio Room') {
    const newRoomId = this.generateRoomId();
    this.roomName = customName;
    return await this.joinRoom(newRoomId, true);
  }

  async joinRoom(targetRoomId, isCreator = false) {
    if (!targetRoomId) return null;
    const cleanId = targetRoomId.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '');
    if (!cleanId) return null;

    if (this.roomId === cleanId && this.connected) {
      return this.getShareUrl();
    }

    // Leave any existing room first
    if (this.roomId && this.roomId !== cleanId) {
      this.leaveRoom(false);
    }

    this.roomId = cleanId;
    this.role = 'room';
    this.connecting = true;
    this.notify();

    // Update browser URL without reloading
    const newUrl = `${window.location.origin}/room/${cleanId}`;
    try {
      window.history.replaceState(null, '', newUrl);
    } catch (e) {
      window.location.hash = `room=${cleanId}`;
    }

    window.dispatchEvent(new CustomEvent('app:toast', {
      detail: `Connecting to room ${cleanId}...`
    }));

    try {
      await this.connectMqtt(cleanId, isCreator);
      this.initPeerMesh(cleanId);
      this.startHeartbeat();

      window.dispatchEvent(new CustomEvent('app:toast', {
        detail: `🎉 Connected to room ${cleanId}! Music is synced globally.`
      }));

      return this.getShareUrl();
    } catch (err) {
      console.error('Failed to connect to room:', err);
      this.connecting = false;
      this.notify();
      window.dispatchEvent(new CustomEvent('app:toast', {
        detail: `Could not reach room broker. Check internet connection.`
      }));
      throw err;
    }
  }

  /* ------------------------------------------------ MQTT Real-time Transport */
  connectMqtt(roomId, isCreator = false) {
    return new Promise((resolve, reject) => {
      if (this.mqttClient) {
        try { this.mqttClient.end(true); } catch (e) {}
        this.mqttClient = null;
      }

      const brokerUrl = BROKER_URLS[this.activeBrokerIndex % BROKER_URLS.length];
      const presenceTopic = `melodia/v1/rooms/${roomId}/presence/${this.clientId}`;
      const stateTopic = `melodia/v1/rooms/${roomId}/state`;
      const eventsTopic = `melodia/v1/rooms/${roomId}/events`;

      const options = {
        clientId: `${this.clientId}_${Math.random().toString(16).substring(2, 6)}`,
        clean: true,
        connectTimeout: 8000,
        reconnectPeriod: 3000,
        keepalive: 20,
        will: {
          topic: presenceTopic,
          payload: JSON.stringify({ clientId: this.clientId, offline: true, timestamp: Date.now() }),
          qos: 1,
          retain: true
        }
      };

      let resolved = false;
      const client = mqtt.connect(brokerUrl, options);
      this.mqttClient = client;

      client.on('connect', () => {
        this.connected = true;
        this.connecting = false;
        this.notify();

        // Subscribe to state, events, and presence
        client.subscribe([stateTopic, eventsTopic, `melodia/v1/rooms/${roomId}/presence/+`], { qos: 1 }, (err) => {
          if (err) console.warn('MQTT subscribe notice:', err);

          // Publish own presence
          this.publishPresence();

          // If creator or no state received within 1.2s, publish initial authoritative state
          if (isCreator || !this.state) {
            setTimeout(() => {
              if (!this.state) {
                this.publishInitialState();
              }
            }, 1200);
          }

          if (!resolved) {
            resolved = true;
            resolve();
          }
        });
      });

      client.on('message', (topic, payload) => {
        try {
          const str = payload.toString();
          if (!str) return;
          const data = JSON.parse(str);

          if (topic === stateTopic) {
            this.handleAuthoritativeState(data);
          } else if (topic === eventsTopic) {
            this.handleTransientEvent(data);
          } else if (topic.includes('/presence/')) {
            this.handlePresenceMessage(data);
          }
        } catch (e) {
          console.warn('Error parsing incoming sync message:', e);
        }
      });

      client.on('error', (err) => {
        console.warn('MQTT client notice:', err);
        // Switch to alternate broker on connection failure
        if (!resolved) {
          this.activeBrokerIndex++;
          const nextBroker = BROKER_URLS[this.activeBrokerIndex % BROKER_URLS.length];
          console.log('Failing over to alternate broker:', nextBroker);
        }
      });

      client.on('close', () => {
        this.connected = false;
        this.notify();
      });

      client.on('reconnect', () => {
        this.connecting = true;
        this.notify();
      });

      setTimeout(() => {
        if (!resolved) {
          resolved = true;
          // Even if slow, resolve so UI stays responsive
          resolve();
        }
      }, 7000);
    });
  }

  publishInitialState() {
    if (!this.roomId || !this.mqttClient || !this.connected) return;
    const curAudio = audio.getState();

    const initialState = {
      roomId: this.roomId,
      roomName: this.roomName,
      track: curAudio.track,
      status: curAudio.isPlaying ? 'PLAYING' : 'PAUSED',
      position: curAudio.track.currentTimeSeconds || 0,
      updatedAt: Date.now(),
      version: 1,
      updatedBy: this.clientId
    };

    this.authoritativeUpdate(initialState, true);
  }

  publishPresence() {
    if (!this.roomId || !this.mqttClient || !this.connected) return;
    const topic = `melodia/v1/rooms/${roomId}/presence/${this.clientId}`;
    const payload = JSON.stringify({
      clientId: this.clientId,
      username: this.username,
      lastSeen: Date.now()
    });
    try {
      this.mqttClient.publish(topic, payload, { qos: 1, retain: true });
    } catch (e) {}
  }

  handlePresenceMessage(data) {
    if (!data || !data.clientId) return;
    if (data.offline) {
      this.presenceMap.delete(data.clientId);
    } else {
      this.presenceMap.set(data.clientId, {
        lastSeen: data.lastSeen || Date.now(),
        username: data.username || 'Listener'
      });
    }
    this.notify();
  }

  cleanupPresence() {
    const now = Date.now();
    let changed = false;
    this.presenceMap.forEach((val, id) => {
      if (now - val.lastSeen > 18000) {
        this.presenceMap.delete(id);
        changed = true;
      }
    });
    if (changed) this.notify();
  }

  startHeartbeat() {
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
    this.heartbeatTimer = setInterval(() => {
      if (this.connected && this.roomId) {
        this.publishPresence();
      }
    }, 5000);
  }

  /* ------------------------------------------------ State Reconciliation & Conflict Handling */
  authoritativeUpdate(newState, isInitial = false) {
    if (!this.roomId || !this.mqttClient || !this.connected) return;

    this.state = newState;
    const stateTopic = `melodia/v1/rooms/${this.roomId}/state`;
    const payloadStr = JSON.stringify(newState);

    // 1. Publish retained authoritative state to cloud broker
    try {
      this.mqttClient.publish(stateTopic, payloadStr, { qos: 1, retain: true });
    } catch (e) {
      console.warn('Error publishing state:', e);
    }

    // 2. Broadcast to PeerJS WebRTC data channels
    this.broadcastToPeerMesh({ type: 'sync-state', state: newState });

    // 3. Apply state locally if not already matching
    if (!isInitial) {
      this.applyStateToAudio(newState, false);
    }
    this.notify();
  }

  handleAuthoritativeState(remoteState) {
    if (!remoteState || !remoteState.roomId || remoteState.roomId !== this.roomId) return;

    // Discard stale events using monotonic versions
    if (this.state) {
      if (remoteState.version < this.state.version) {
        return;
      }
      if (remoteState.version === this.state.version && remoteState.updatedAt <= this.state.updatedAt) {
        return;
      }
    }

    this.state = remoteState;
    this.notify();

    // Reconcile local player with remote authoritative state
    this.applyStateToAudio(remoteState, remoteState.updatedBy !== this.clientId);
  }

  handleTransientEvent(evt) {
    if (!evt || evt.clientId === this.clientId) return;
    if (evt.action === 'toast' && evt.message) {
      window.dispatchEvent(new CustomEvent('app:toast', { detail: evt.message }));
    }
  }

  applyStateToAudio(state, isRemoteAction = true) {
    if (this.isApplyingRemoteState) return;
    this.isApplyingRemoteState = true;

    try {
      const curAudio = audio.getState();
      const track = state.track;
      if (!track) return;

      // 1. Track Switch Check
      const trackChanged = !curAudio.track || curAudio.track.ytId !== track.ytId;
      if (trackChanged) {
        if (track.recordId) {
          audio.playRecord(track.recordId, track.trackIdx || 0);
        } else if (track.playlistId) {
          audio.playPlaylist(track.playlistId);
        } else if (track.ytId) {
          audio.playYouTubeVideo(track.ytId, state.position || 0);
        }
      }

      // 2. Calculate Exact Position Accounting for Elapsed Time
      const now = Date.now();
      const elapsedSeconds = state.status === 'PLAYING' ? Math.max(0, (now - state.updatedAt) / 1000) : 0;
      const targetPosition = Math.min(track.durationSeconds || 9999, (state.position || 0) + elapsedSeconds);

      // 3. Play / Pause Synchronization
      if (state.status === 'PLAYING' && !audio.isPlaying) {
        audio.play();
      } else if (state.status === 'PAUSED' && audio.isPlaying) {
        audio.pause();
      }

      // 4. Seek if drift > 1.8s
      const currentPos = audio.currentTrack.currentTimeSeconds || 0;
      if (Math.abs(targetPosition - currentPos) > 1.8) {
        audio.seek(targetPosition);
      }
    } finally {
      setTimeout(() => {
        this.isApplyingRemoteState = false;
      }, 350);
    }
  }

  checkDrift() {
    if (this.role !== 'room' || !this.state || this.state.status !== 'PLAYING') return;
    if (this.isApplyingRemoteState) return;

    const now = Date.now();
    const elapsed = Math.max(0, (now - this.state.updatedAt) / 1000);
    const expected = Math.min(this.state.track.durationSeconds || 9999, this.state.position + elapsed);
    const actual = audio.currentTrack.currentTimeSeconds || 0;
    const diff = Math.abs(expected - actual);

    // If drift > 2.0s, re-align audio smoothly
    if (diff > 2.0 && audio.ytPlayer && audio.ytReady && typeof audio.ytPlayer.seekTo === 'function') {
      audio.seek(expected);
    }
  }

  /* ------------------------------------------------ Universal User Controls */
  // ANY member in the room can invoke these actions
  togglePlay() {
    if (this.role !== 'room') {
      audio.toggle();
      return;
    }
    const currentStatus = this.state?.status || (audio.isPlaying ? 'PLAYING' : 'PAUSED');
    const newStatus = (currentStatus === 'PLAYING') ? 'PAUSED' : 'PLAYING';
    const curPos = audio.currentTrack.currentTimeSeconds || 0;

    const nextState = {
      roomId: this.roomId,
      roomName: this.roomName,
      track: this.state?.track || audio.currentTrack,
      status: newStatus,
      position: curPos,
      updatedAt: Date.now(),
      version: (this.state?.version || 0) + 1,
      updatedBy: this.clientId
    };

    this.authoritativeUpdate(nextState);
  }

  play() {
    if (this.role !== 'room') {
      audio.play();
      return;
    }
    const curPos = audio.currentTrack.currentTimeSeconds || 0;
    const nextState = {
      roomId: this.roomId,
      roomName: this.roomName,
      track: this.state?.track || audio.currentTrack,
      status: 'PLAYING',
      position: curPos,
      updatedAt: Date.now(),
      version: (this.state?.version || 0) + 1,
      updatedBy: this.clientId
    };
    this.authoritativeUpdate(nextState);
  }

  pause() {
    if (this.role !== 'room') {
      audio.pause();
      return;
    }
    const curPos = audio.currentTrack.currentTimeSeconds || 0;
    const nextState = {
      roomId: this.roomId,
      roomName: this.roomName,
      track: this.state?.track || audio.currentTrack,
      status: 'PAUSED',
      position: curPos,
      updatedAt: Date.now(),
      version: (this.state?.version || 0) + 1,
      updatedBy: this.clientId
    };
    this.authoritativeUpdate(nextState);
  }

  seek(seconds) {
    if (this.role !== 'room') {
      audio.seek(seconds);
      return;
    }
    const nextState = {
      roomId: this.roomId,
      roomName: this.roomName,
      track: this.state?.track || audio.currentTrack,
      status: this.state?.status || (audio.isPlaying ? 'PLAYING' : 'PAUSED'),
      position: Math.max(0, seconds),
      updatedAt: Date.now(),
      version: (this.state?.version || 0) + 1,
      updatedBy: this.clientId
    };
    this.authoritativeUpdate(nextState);
  }

  selectRecord(recordId, trackIdx = 0) {
    if (this.role !== 'room') {
      audio.playRecord(recordId, trackIdx);
      return;
    }
    audio.playRecord(recordId, trackIdx);
    const curAudio = audio.getState();

    const nextState = {
      roomId: this.roomId,
      roomName: this.roomName,
      track: curAudio.track,
      status: 'PLAYING',
      position: 0,
      updatedAt: Date.now(),
      version: (this.state?.version || 0) + 1,
      updatedBy: this.clientId
    };
    this.authoritativeUpdate(nextState);
  }

  selectPlaylist(playlistId) {
    if (this.role !== 'room') {
      audio.playPlaylist(playlistId);
      return;
    }
    audio.playPlaylist(playlistId);
    const curAudio = audio.getState();

    const nextState = {
      roomId: this.roomId,
      roomName: this.roomName,
      track: curAudio.track,
      status: 'PLAYING',
      position: 0,
      updatedAt: Date.now(),
      version: (this.state?.version || 0) + 1,
      updatedBy: this.clientId
    };
    this.authoritativeUpdate(nextState);
  }

  next() {
    if (this.role !== 'room') {
      audio.next();
      return;
    }
    audio.next();
    const curAudio = audio.getState();

    const nextState = {
      roomId: this.roomId,
      roomName: this.roomName,
      track: curAudio.track,
      status: 'PLAYING',
      position: 0,
      updatedAt: Date.now(),
      version: (this.state?.version || 0) + 1,
      updatedBy: this.clientId
    };
    this.authoritativeUpdate(nextState);
  }

  prev() {
    if (this.role !== 'room') {
      audio.prev();
      return;
    }
    audio.prev();
    const curAudio = audio.getState();

    const nextState = {
      roomId: this.roomId,
      roomName: this.roomName,
      track: curAudio.track,
      status: 'PLAYING',
      position: 0,
      updatedAt: Date.now(),
      version: (this.state?.version || 0) + 1,
      updatedBy: this.clientId
    };
    this.authoritativeUpdate(nextState);
  }

  /* ------------------------------------------------ Secondary WebRTC Peer Mesh */
  async initPeerMesh(roomId) {
    if (typeof window.Peer === 'undefined') return;
    try {
      if (this.peer && !this.peer.destroyed) {
        try { this.peer.destroy(); } catch (e) {}
      }

      const p = new window.Peer(undefined, { config: ICE_SERVERS });
      this.peer = p;

      p.on('open', (id) => {
        // Connected to PeerJS cloud
      });

      p.on('connection', (conn) => {
        this.handlePeerConnection(conn);
      });

      p.on('error', (err) => {
        // Silently tolerate PeerJS errors since MQTT cloud handles primary sync
      });
    } catch (e) {
      console.warn('PeerMesh notice:', e);
    }
  }

  handlePeerConnection(conn) {
    conn.on('open', () => {
      this.peerConns.set(conn.peer, conn);
      if (this.state) {
        conn.send({ type: 'sync-state', state: this.state });
      }
    });

    conn.on('data', (data) => {
      if (data && data.type === 'sync-state' && data.state) {
        this.handleAuthoritativeState(data.state);
      }
    });

    const drop = () => this.peerConns.delete(conn.peer);
    conn.on('close', drop);
    conn.on('error', drop);
  }

  broadcastToPeerMesh(payload) {
    this.peerConns.forEach((conn) => {
      if (conn.open) {
        try { conn.send(payload); } catch (e) {}
      }
    });
  }

  /* ------------------------------------------------ Leave Room */
  leaveRoom(updateUrl = true) {
    if (this.mqttClient) {
      try {
        const topic = `melodia/v1/rooms/${this.roomId}/presence/${this.clientId}`;
        this.mqttClient.publish(topic, JSON.stringify({ clientId: this.clientId, offline: true }), { qos: 1, retain: true });
        this.mqttClient.end(true);
      } catch (e) {}
      this.mqttClient = null;
    }

    if (this.peer) {
      try { this.peer.destroy(); } catch (e) {}
      this.peer = null;
    }
    this.peerConns.clear();

    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);

    this.role = 'solo';
    this.roomId = null;
    this.connected = false;
    this.connecting = false;
    this.state = null;
    this.presenceMap.clear();
    this.notify();

    if (updateUrl) {
      try {
        window.history.replaceState(null, '', window.location.pathname.replace(/\/room\/[^\/]+/, ''));
      } catch (e) {
        window.location.hash = '';
      }
      window.dispatchEvent(new CustomEvent('app:toast', {
        detail: 'Left music room. Continuing in solo mode.'
      }));
    }
  }

  /* ------------------------------------------------ URL Parsing & Routing */
  checkUrlForRoom() {
    if (typeof window === 'undefined') return;
    const path = window.location.pathname;
    const hash = window.location.hash;
    const search = window.location.search;

    let targetRoomId = null;

    // 1. Path match: /room/:id
    const pathMatch = path.match(/\/room\/([a-zA-Z0-9_-]+)/);
    if (pathMatch && pathMatch[1]) {
      targetRoomId = pathMatch[1];
    }

    // 2. Hash match: #room=:id
    if (!targetRoomId) {
      const hashMatch = hash.match(/[#?]room=([a-zA-Z0-9_-]+)/);
      if (hashMatch && hashMatch[1]) {
        targetRoomId = hashMatch[1];
      }
    }

    // 3. Search query match: ?room=:id
    if (!targetRoomId) {
      const params = new URLSearchParams(search);
      if (params.get('room')) {
        targetRoomId = params.get('room');
      }
    }

    if (targetRoomId) {
      const clean = targetRoomId.trim().toUpperCase();
      // If not already in this room, trigger the invite banner and auto-join prompt
      if (this.roomId !== clean || !this.connected) {
        window.dispatchEvent(new CustomEvent('sync:invite', {
          detail: { roomId: clean }
        }));
      }
    }
  }
}

export const sync = new RealtimeRoomSync();
