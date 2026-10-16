// PURPOSE: Integrates with Spotify Web API and OAuth authorization services.
// INTEGRATION: Used by the Records Section for the Awarapan 2 playlist spotlight, account login, and playback metadata.
// INPUT: OAuth implicit tokens, playlist IDs, and client credentials.
// OUTPUT: Authenticated Spotify user profiles and playlist track listings.
// SECURITY: Safely clears token fragments from URL history to prevent token leakage in browser history.

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
  }

  // PURPOSE: Restores cached Spotify credentials or checks for OAuth redirect hash fragments.
  // INTEGRATION: Called during app startup.
  init() {
    this.checkOAuthCallback();
  }

  // PURPOSE: Initiates the Spotify OAuth implicit grant redirect.
  // SIDE EFFECTS: Navigates browser to accounts.spotify.com.
  login() {
    if (typeof window === 'undefined') return;
    const authEndpoint = 'https://accounts.spotify.com/authorize';
    const redirectUri = encodeURIComponent(SPOTIFY_CONFIG.redirectUri);
    const scope = encodeURIComponent(SPOTIFY_CONFIG.scopes.join(' '));
    const url = `${authEndpoint}?client_id=${SPOTIFY_CONFIG.clientId}&redirect_uri=${redirectUri}&scope=${scope}&response_type=token&show_dialog=true`;
    window.location.href = url;
  }

  // PURPOSE: Inspects window.location.hash for Spotify access token response and stores it.
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
        // Clean URL hash without triggering navigation
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

  // PURPOSE: Fetches the authenticated user profile from Spotify API (/v1/me).
  // OUTPUT: User profile object or null on error.
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

  // PURPOSE: Obtains a client credentials bearer token for querying public playlist data.
  // OUTPUT: Access token string or null on failure.
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

  // PURPOSE: Fetches playlist track details from Spotify API.
  // INPUT: playlistId (string).
  // OUTPUT: Playlist JSON metadata.
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

  // PURPOSE: Clears authenticated Spotify session and dispatches disconnect event.
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
