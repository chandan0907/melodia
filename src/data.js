// Melodia Beat Records — Studio Discography, Artists & Playlists Data

export const STUDIO_INFO = {
  name: 'BEAT RECORDS',
  brand: 'MELODIA',
  tagline: 'World Class Recording & Production',
  subtitle: 'A premier sonic sanctum dedicated to acoustic purity, cutting-edge analog-digital hybrid mastering, and boundary-pushing musical innovation.',
  address: '1074 Pacific Avenue, San Francisco, CA 94133',
  email: 'beatme@melodiarecords.com',
  phone: '+1 (415) 890-1212',
  bookingHours: 'Mon - Sun: 24/7 Studio Access for Residents',
  gear: [
    'Vintage 1974 Neve 8078 40-Channel Console',
    'Dolby Atmos 9.1.4 Certified Mastering Room',
    'Custom PMC BB6-A Active Reference Monitors',
    'Neumann U47 & U67 Vintage Valve Microphones',
    'Studer A827 24-Track 2-inch Analog Tape'
  ]
};

export const FEATURED_SPOTIFY = {
  id: 'awarapan-2',
  title: 'Awarapan 2 (All Songs)',
  subtitle: 'Toh Phir Aao Dobara · Tera Mera Rishta · Ve Mera Piya Ghar Aaya · Tumhare Liye',
  artist: 'Mustafa Zahid, Pritam & Roxen',
  curator: 'Rashmi Baid 🌼',
  trackCount: 89,
  cover: './assets/images/album_awarapan.jpg',
  spotifyUrl: 'https://open.spotify.com/playlist/0qRsizDqcvjuBkpbLZkL69?si=596dc0215bb648f1',
  spotifyEmbedUrl: 'https://open.spotify.com/embed/playlist/0qRsizDqcvjuBkpbLZkL69?utm_source=generator&theme=0',
  description: 'The timeless cult soundtrack of deep yearning, acoustic sufi-rock guitars, and soaring emotional vocals.'
};

export const RECORDS = [
  {
    id: 'awarapan-2',
    title: 'Awarapan 2',
    subtitle: 'All Songs · Soul Rock Sessions',
    artist: 'Mustafa Zahid, Pritam & Roxen',
    curator: 'Rashmi Baid',
    year: '2026',
    genre: 'Sufi Rock / Acoustic Soul',
    cover: './assets/images/album_awarapan.jpg',
    accentColor: '#eab308',
    glowColor: 'rgba(234, 179, 8, 0.45)',
    spotifyUrl: 'https://open.spotify.com/playlist/0qRsizDqcvjuBkpbLZkL69?si=596dc0215bb648f1',
    spotifyEmbedUrl: 'https://open.spotify.com/embed/playlist/0qRsizDqcvjuBkpbLZkL69?utm_source=generator&theme=0',
    description: 'The iconic emotional rock anthems featuring Toh Phir Aao, Tera Mera Rishta Purana, Mahiya, and Mera Piya Ghar Aaya.',
    tracks: [
      { id: 'aw-1', title: 'Toh Phir Aao', duration: '5:48', ytId: 'n_VrRuNkbrE', tempo: 80, key: 'Dm', singer: 'Mustafa Zahid' },
      { id: 'aw-2', title: 'Tera Mera Rishta Purana', duration: '4:58', ytId: 'Tn37jjI-dlI', tempo: 78, key: 'Gm', singer: 'Mustafa Zahid' },
      { id: 'aw-3', title: 'Mahiya', duration: '4:42', ytId: 'FJzE1p3mvw8', tempo: 120, key: 'Fm', singer: 'Suzanne D\'Mello' },
      { id: 'aw-4', title: 'Toh Phir Aao (Lounge Version)', duration: '5:22', ytId: 'kF5oZgK5p8s', tempo: 76, key: 'Dm', singer: 'Mustafa Zahid' },
      { id: 'aw-5', title: 'Ve Mera Piya Ghar Aaya', duration: '4:15', ytId: '6LYfwNkkrplbxbheWtkBL2', tempo: 85, key: 'Am', singer: 'Faridkot' }
    ]
  },
  {
    id: 'love',
    title: 'love',
    subtitle: 'The Ghost Sessions',
    artist: 'Kai Sterling & Sarah Preston',
    year: '2026',
    genre: 'Cinematic Ambient / R&B',
    cover: './assets/images/album_love.jpg',
    accentColor: '#e11d48',
    glowColor: 'rgba(225, 29, 72, 0.45)',
    description: 'A velvet twilight journey blending tape-saturated vocals, atmospheric Rhodes chords, and hypnotic subsonic grooves.',
    tracks: [
      { id: 'love-1', title: 'Crimson Sky', duration: '3:42', ytId: '2Vv-BfVoq4g', tempo: 74, key: 'Cm' },
      { id: 'love-2', title: 'The Ghost Sessions', duration: '4:15', ytId: 'lp-EO5I60KA', tempo: 80, key: 'Fm' },
      { id: 'love-3', title: 'Velvet Embers', duration: '3:18', ytId: '450p7goxZqg', tempo: 68, key: 'Ab' },
      { id: 'love-4', title: 'Dusk Whispers', duration: '4:02', ytId: 'RBumgq5yVrA', tempo: 72, key: 'Eb' }
    ]
  },
  {
    id: 'imagination',
    title: 'IMAGINATION',
    subtitle: 'Cosmic Turntable Odyssey',
    artist: 'Marcus Vance',
    year: '2026',
    genre: 'Cosmic Neo-Soul / Deep Funk',
    cover: './assets/images/album_imagination.jpg',
    accentColor: '#f97316',
    glowColor: 'rgba(249, 115, 22, 0.45)',
    description: 'Live analog brass meets celestial synthesized atmospheres, engineered directly from 2-inch master tape reels.',
    tracks: [
      { id: 'img-1', title: 'Cosmic Horizon', duration: '4:21', ytId: 'YQHsXMglC9A', tempo: 92, key: 'Dm' },
      { id: 'img-2', title: 'Analog Nebulae', duration: '3:50', ytId: 'rYEDA3JcQqw', tempo: 88, key: 'Gm' },
      { id: 'img-3', title: 'Pacific Brass Nocturne', duration: '5:05', ytId: '4NRXx6U8ABQ', tempo: 96, key: 'Am' },
      { id: 'img-4', title: 'Fire & Stardust', duration: '3:34', ytId: '09R8_2nJtjg', tempo: 104, key: 'C' }
    ]
  },
  {
    id: 'dreamer',
    title: 'DREAMER',
    subtitle: 'Revolt Against Riot | Vol. 1',
    artist: 'Elena Cruz & The Vanguard',
    year: '2026',
    genre: 'Alt-Rock / Industrial Electronic',
    cover: './assets/images/album_dreamer.jpg',
    accentColor: '#dc2626',
    glowColor: 'rgba(220, 38, 38, 0.5)',
    description: 'Raw, gritty tape overdrive paired with uncompromising rhythmic fury and subversive harmonic tension.',
    tracks: [
      { id: 'drm-1', title: 'Static Vanguard', duration: '3:12', ytId: '7wtfhZwyrcc', tempo: 138, key: 'Em' },
      { id: 'drm-2', title: 'Revolt Against Riot', duration: '3:55', ytId: 'fKopy74weus', tempo: 142, key: 'B' },
      { id: 'drm-3', title: 'Anarchy Pulse', duration: '2:48', ytId: 'mWRsgZuwf_8', tempo: 150, key: 'A' },
      { id: 'drm-4', title: 'Concrete Echoes', duration: '4:10', ytId: 'kXYiU_JCYtU', tempo: 128, key: 'F#' }
    ]
  }
];

export const ARTISTS = [
  {
    id: 'mustafa-zahid',
    name: 'Mustafa Zahid',
    role: 'Iconic Vocalist & Roxen Frontman',
    genre: 'Sufi Rock / Bollywood Acoustic',
    listeners: '4,210,000 monthly listeners',
    photo: './assets/images/album_awarapan.jpg',
    bio: 'The raw, soulful voice behind the era-defining masterpieces "Toh Phir Aao" and "Tera Mera Rishta", blending passionate sufi vocals with atmospheric electric guitars.',
    favoriteGear: 'Vintage Gibson Les Paul Standard & Shure SM7B',
    topTracks: [
      { title: 'Toh Phir Aao', duration: '5:48', plays: '98.5M' },
      { title: 'Tera Mera Rishta Purana', duration: '4:58', plays: '76.2M' },
      { title: 'Toh Phir Aao (Lounge Version)', duration: '5:22', plays: '42.1M' }
    ]
  },
  {
    id: 'marcus-vance',
    name: 'Marcus Vance',
    role: 'Resident Saxophonist & Sound Sculptor',
    genre: 'Neo-Soul / Ambient Jazz',
    listeners: '1,420,800 monthly listeners',
    photo: './assets/images/artist_marcus.jpg',
    bio: 'Renowned for his smoky tenor saxophone timbre and cinematic arrangements, Marcus Vance merges acoustic warmth with modern sub-frequencies.',
    favoriteGear: '1954 Selmer Mark VI Saxophone & Teletronix LA-2A',
    topTracks: [
      { title: 'Midnight Resonance', duration: '4:30', plays: '3.4M' },
      { title: 'Pacific Nocturne', duration: '5:05', plays: '2.1M' },
      { title: 'Analog Nebulae', duration: '3:50', plays: '1.8M' }
    ]
  },
  {
    id: 'kai-sterling',
    name: 'Kai Sterling',
    role: 'Vocalist, Multi-Instrumentalist & Producer',
    genre: 'Cinematic R&B / Synthwave',
    listeners: '2,890,500 monthly listeners',
    photo: './assets/images/artist_kai.jpg',
    bio: 'Crafting lush harmonic soundscapes from his vintage analog synthesizer collection, Kai brings heartfelt vocal dynamics and cinematic scope to every record.',
    favoriteGear: 'Neumann U67 Tube Mic & Moog Memorymoog',
    topTracks: [
      { title: 'The Ghost Sessions', duration: '4:15', plays: '8.2M' },
      { title: 'Crimson Sky', duration: '3:42', plays: '6.7M' },
      { title: 'Dusk Whispers', duration: '4:02', plays: '4.5M' }
    ]
  },
  {
    id: 'elena-cruz',
    name: 'Elena Cruz',
    role: 'Electronic Composer & Sound Designer',
    genre: 'Industrial Electronic / Alt-Rock',
    listeners: '984,300 monthly listeners',
    photo: './assets/images/artist_elena.jpg',
    bio: 'Elena breaks traditional sonic structures by feeding modular synthesizers through custom tube amplifiers and distorted spring reverbs.',
    favoriteGear: 'Buchla 200e Modular & Sherman Filterbank 2',
    topTracks: [
      { title: 'Revolt Against Riot', duration: '3:55', plays: '4.9M' },
      { title: 'Static Vanguard', duration: '3:12', plays: '2.8M' },
      { title: 'Anarchy Pulse', duration: '2:48', plays: '1.9M' }
    ]
  }
];

export const PLAYLISTS = [
  {
    id: 'awarapan-2-playlist',
    name: 'Awarapan 2 (All Songs)',
    mood: 'Soulful · Melancholic · Raw',
    description: 'Toh Phir Aao, Tera Mera Rishta, Mera Piya Ghar Aaya, Tumhare Liye.',
    colors: ['#eab308', '#e11d48', '#881337'],
    spotifyUrl: 'https://open.spotify.com/playlist/0qRsizDqcvjuBkpbLZkL69?si=596dc0215bb648f1',
    spotifyEmbedUrl: 'https://open.spotify.com/embed/playlist/0qRsizDqcvjuBkpbLZkL69?utm_source=generator&theme=0',
    tracks: [
      'n_VrRuNkbrE', 'Tn37jjI-dlI', 'FJzE1p3mvw8', 'kF5oZgK5p8s', '6LYfwNkkrplbxbheWtkBL2'
    ]
  },
  {
    id: 'late-night',
    name: 'Late Night Chill',
    mood: 'Soft · Slow · Warm',
    description: 'Low lights and easy melodies for winding down.',
    colors: ['#6d5dfc', '#2bb3ff', '#ff6ec7'],
    tracks: [
      '2Vv-BfVoq4g', 'lp-EO5I60KA', '450p7goxZqg', 'RBumgq5yVrA',
      'YQHsXMglC9A', 'rYEDA3JcQqw', '4NRXx6U8ABQ', '09R8_2nJtjg'
    ]
  },
  {
    id: 'power-up',
    name: 'Power Up',
    mood: 'Loud · Fast · Fearless',
    description: 'High-energy tracks to push through the last set.',
    colors: ['#ff5a36', '#ffb020', '#ff2e63'],
    tracks: [
      '7wtfhZwyrcc', 'fKopy74weus', 'mWRsgZuwf_8', 'kXYiU_JCYtU',
      'eVTXPUF4Oz4', 'hTWKbfoikeg', '1w7OgIMMRc4', 'YlUKcNNmywk'
    ]
  },
  {
    id: 'pop-pulse',
    name: 'Pop Pulse',
    mood: 'Bright · Catchy · Fun',
    description: 'Big choruses you already know the words to.',
    colors: ['#ff4fa3', '#8b5cf6', '#22d3ee'],
    tracks: [
      'OPf0YbXqDm0', 'CevxZvSJLk8', 'e-ORhEE9VVg', 'nfWlot6h_JM',
      '60ItHLz5WEA', 'RgKAFK5djSk', 'kJQP7kiw5Fk', 'JGwWNGJdvx8'
    ]
  },
  {
    id: 'rock-legends',
    name: 'Rock Legends',
    mood: 'Raw · Timeless · Electric',
    description: 'Anthems that never get old.',
    colors: ['#14b8a6', '#f59e0b', '#ef4444'],
    tracks: [
      'fJ9rUzIMcZQ', 'hTWKbfoikeg', '1w7OgIMMRc4', 'YlUKcNNmywk',
      'kXYiU_JCYtU', 'eVTXPUF4Oz4', '7wtfhZwyrcc'
    ]
  }
];
