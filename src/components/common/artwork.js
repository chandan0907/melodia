// Presentation assets are statically discoverable by Vite and independent of room URLs.
// Playback metadata and provider URLs remain untouched.
const artwork = {
  './assets/images/album_awarapan.jpg': new URL('../../../assets/images/album_awarapan.jpg', import.meta.url).href,
  './assets/images/album_love.jpg': new URL('../../../assets/images/album_love.jpg', import.meta.url).href,
  './assets/images/album_imagination.jpg': new URL('../../../assets/images/album_imagination.jpg', import.meta.url).href,
  './assets/images/album_dreamer.jpg': new URL('../../../assets/images/album_dreamer.jpg', import.meta.url).href,
  './assets/images/artist_marcus.jpg': new URL('../../../assets/images/artist_marcus.jpg', import.meta.url).href,
  './assets/images/artist_kai.jpg': new URL('../../../assets/images/artist_kai.jpg', import.meta.url).href,
  './assets/images/artist_elena.jpg': new URL('../../../assets/images/artist_elena.jpg', import.meta.url).href
};

export function artworkUrl(source) {
  return artwork[source] || source;
}
