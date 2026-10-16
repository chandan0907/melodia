// Spotify Web API & OAuth Service
export const SPOTIFY_CONFIG = {
  clientId: '0514468aa4bb497fb4cfc8c5fe503c1a',
  clientSecret: '895c0b6b43f3463ba100ce255ec1784c',
  playlistId: '0qRsizDqcvjuBkpbLZkL69',
  redirectUri: typeof window !== 'undefined' 
    ? (window.location.hostname === 'localhost' ? `${window.location.origin}/` : 'https://melodia-phi-lac.vercel.app/')
    : 'https://melodia-phi-lac.vercel.app/',
  scopes: [
    'streaming',
    'user-read-email',
    'user-read-private',
    'user-read-playback-state',
    'user-modify-playback-state'
  ]
};

class SpotifyService {
  constructor() {
    this.accessToken = null;
    this.tokenExpiry = 0;
    this.user = null;
    this.init();
  }

  init() {
    this.checkOAuthCallback();
  }

  // 1. Implicit Grant / PKCE Login for Web Player SDK
  login() {
    const authEndpoint = 'https://accounts.spotify.com/authorize';
    const redirectUri = encodeURIComponent(SPOTIFY_CONFIG.redirectUri);
    const scope = encodeURIComponent(SPOTIFY_CONFIG.scopes.join(' '));
    const url = `${authEndpoint}?client_id=${SPOTIFY_CONFIG.clientId}&redirect_uri=${redirectUri}&scope=${scope}&response_type=token&show_dialog=true`;
    window.location.href = url;
  }

  checkOAuthCallback() {
    if (typeof window === 'undefined') return;
    const hash = window.location.hash;
    if (hash && hash.includes('access_token')) {
      const params = new URLSearchParams(hash.substring(1));
      const token = params.get('access_token');
      const expiresIn = params.get('expires_in');
      if (token) {
        this.accessToken = token;
        this.tokenExpiry = Date.now() + parseInt(expiresIn, 10) * 1000;
        try {
          localStorage.setItem('mel_spotify_token', token);
          localStorage.setItem('mel_spotify_expiry', this.tokenExpiry.toString());
        } catch (e) {}
        // Clean URL hash
        window.history.replaceState(null, '', window.location.pathname + window.location.search);
        this.fetchCurrentUser();
      }
    } else {
      try {
        const savedToken = localStorage.getItem('mel_spotify_token');
        const savedExpiry = localStorage.getItem('mel_spotify_expiry');
        if (savedToken && savedExpiry && Date.now() < parseInt(savedExpiry, 10)) {
          this.accessToken = savedToken;
          this.tokenExpiry = parseInt(savedExpiry, 10);
          this.fetchCurrentUser();
        }
      } catch (e) {}
    }
  }

  async fetchCurrentUser() {
    if (!this.accessToken) return null;
    try {
      const res = await fetch('https://api.spotify.com/v1/me', {
        headers: { Authorization: `Bearer ${this.accessToken}` }
      });
      if (res.ok) {
        this.user = await res.json();
        window.dispatchEvent(new CustomEvent('spotify:connected', { detail: this.user }));
        return this.user;
      }
    } catch (e) {
      console.warn('Error fetching Spotify user:', e);
    }
    return null;
  }

  // 2. Client Credentials Token (for reading playlist metadata without user login)
  async getClientCredentialsToken() {
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }
    try {
      const auth = btoa(`${SPOTIFY_CONFIG.clientId}:${SPOTIFY_CONFIG.clientSecret}`);
      const res = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: 'grant_type=client_credentials'
      });
      if (res.ok) {
        const data = await res.json();
        this.accessToken = data.access_token;
        this.tokenExpiry = Date.now() + data.expires_in * 1000;
        return this.accessToken;
      }
    } catch (e) {
      console.warn('Spotify client credentials error:', e);
    }
    return null;
  }

  async getPlaylist(playlistId = SPOTIFY_CONFIG.playlistId) {
    const token = await this.getClientCredentialsToken();
    if (!token) return null;
    try {
      const res = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}?market=IN`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn('Error fetching playlist:', e);
    }
    return null;
  }

  logout() {
    this.accessToken = null;
    this.user = null;
    try {
      localStorage.removeItem('mel_spotify_token');
      localStorage.removeItem('mel_spotify_expiry');
    } catch (e) {}
    window.dispatchEvent(new CustomEvent('spotify:disconnected'));
  }
}

export const spotify = new SpotifyService();
