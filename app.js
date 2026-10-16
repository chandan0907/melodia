(function () {
  'use strict';

  var CFG = window.MELODIA;
  var $ = function (s) { return document.querySelector(s); };

  var S = {
    pl: null,          // active playlist
    order: [],         // shuffled video IDs
    idx: 0,            // position in order
    playing: false,
    want: true,        // should the current track be playing?
    ready: false,      // YouTube player ready
    queued: null,      // load request made before player was ready
    role: 'solo',      // 'solo' | 'host' | 'guest'
    peer: null,
    peerPromise: null,
    conns: [],         // host: connected guests
    hostConn: null,    // guest: connection to host
    room: null,
    listeners: 1,
    errs: 0,
    meta: {}
  };
  var player;

  /* ---------------------------------------------------------- utils */
  function fmt(s) {
    if (!isFinite(s) || s < 0) s = 0;
    var m = Math.floor(s / 60), r = Math.floor(s % 60);
    return m + ':' + (r < 10 ? '0' : '') + r;
  }
  function shuffle(arr, avoidFirst) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    if (avoidFirst && a.length > 1 && a[0] === avoidFirst) {
      var l = a.length - 1, x = a[0]; a[0] = a[l]; a[l] = x;
    }
    return a;
  }
  var toastTimer;
  function toast(msg) {
    var t = $('#toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove('show'); }, 3200);
  }
  function thumb(id, q) { return 'https://img.youtube.com/vi/' + id + '/' + (q || 'hqdefault') + '.jpg'; }
  function cleanTitle(t) {
    return (t || '')
      .replace(/[\(\[][^\)\]]*(official|video|audio|lyric|visuali[sz]er|hd|4k|remaster)[^\)\]]*[\)\]]/ig, '')
      .replace(/\s{2,}/g, ' ').trim();
  }
  function cleanAuthor(a) {
    return (a || '').replace(/ - Topic$/i, '').replace(/VEVO$/i, '').trim();
  }
  function getMeta(id) {
    if (S.meta[id]) return Promise.resolve(S.meta[id]);
    try {
      var c = JSON.parse(localStorage.getItem('mel_meta_' + id));
      if (c && c.title) { S.meta[id] = c; return Promise.resolve(c); }
    } catch (e) { /* ignore */ }
    var url = 'https://www.youtube.com/oembed?format=json&url=' +
      encodeURIComponent('https://www.youtube.com/watch?v=' + id);
    return fetch(url).then(function (r) {
      if (!r.ok) throw new Error('oembed');
      return r.json();
    }).then(function (j) {
      var m = { title: cleanTitle(j.title), author: cleanAuthor(j.author_name) };
      S.meta[id] = m;
      try { localStorage.setItem('mel_meta_' + id, JSON.stringify(m)); } catch (e) { /* ignore */ }
      return m;
    }).catch(function () { return null; });
  }

  /* ------------------------------------------------- playlist cards */
  function renderGrid() {
    var grid = $('#grid');
    grid.innerHTML = '';
    CFG.playlists.forEach(function (pl) {
      pl.tracks = Array.from(new Set(pl.tracks));
      var c = pl.colors || ['#8b5cf6', '#ec4899', '#f59e0b'];
      var card = document.createElement('button');
      card.className = 'card';
      card.type = 'button';
      card.dataset.id = pl.id;
      card.innerHTML =
        '<div class="cover" style="--c1:' + c[0] + ';--c2:' + c[1] + ';--c3:' + c[2] + '">' +
          '<div class="vinyl"><img alt="" loading="lazy" src="' + thumb(pl.tracks[0], 'mqdefault') + '"></div>' +
          '<span class="go"><svg viewBox="0 0 24 24" width="24" height="24"><path fill="#fff" d="M8 5v14l11-7z"/></svg></span>' +
        '</div>' +
        '<h3></h3><p class="mood"></p><p class="desc"></p>' +
        '<div class="meta"><span class="eq"><b></b><b></b><b></b></span><span>' + pl.tracks.length + ' tracks · shuffled</span></div>';
      card.querySelector('h3').textContent = pl.name;
      card.querySelector('.mood').textContent = pl.mood || '';
      card.querySelector('.desc').textContent = pl.description || '';
      card.addEventListener('click', function () { choosePlaylist(pl.id); });
      grid.appendChild(card);
    });
    $('#pl-count').textContent = CFG.playlists.length + ' playlists';
  }
  function markActiveCard() {
    document.querySelectorAll('.card').forEach(function (c) {
      c.classList.toggle('playing', !!S.pl && c.dataset.id === S.pl.id && S.playing);
    });
  }

  /* --------------------------------------------------- YouTube player */
  var tag = document.createElement('script');
  tag.src = 'https://www.youtube.com/iframe_api';
  document.head.appendChild(tag);

  window.onYouTubeIframeAPIReady = function () {
    var vars = {
      controls: 0, disablekb: 1, fs: 0, modestbranding: 1, rel: 0,
      iv_load_policy: 3, playsinline: 1, cc_load_policy: 0
    };
    if (location.protocol.indexOf('http') === 0) vars.origin = location.origin;
    player = new YT.Player('yt', {
      width: '100%', height: '100%', playerVars: vars,
      events: { onReady: onReady, onStateChange: onState, onError: onError }
    });
  };

  function onReady() {
    S.ready = true;
    player.setVolume(+$('#vol').value);
    if (S.queued) {
      var q = S.queued; S.queued = null;
      loadTrack(q[0], q[1], q[2]);
    }
  }

  function onState(e) {
    var st = e.data;
    if (st === YT.PlayerState.PLAYING) {
      S.errs = 0;
      if (!S.want) { player.pauseVideo(); return; }
      S.playing = true;
      fillMetaFromPlayer();
    } else if (st === YT.PlayerState.PAUSED) {
      S.playing = false;
    } else if (st === YT.PlayerState.ENDED) {
      S.playing = false;
      handleEnded();
    }
    updateControls();
  }

  function onError() {
    // Track can't be embedded (removed / blocked). Quietly move on.
    S.errs++;
    if (S.pl && S.errs <= S.pl.tracks.length) {
      if (S.role === 'guest' && S.hostConn && S.hostConn.open) return;
      advance();
    } else {
      toast('Could not play these tracks. Check the video IDs in playlists.js.');
    }
  }

  function fillMetaFromPlayer() {
    try {
      var id = S.order[S.idx], d = player.getVideoData();
      if (d && d.title && (!S.meta[id] || !S.meta[id].title)) {
        S.meta[id] = { title: cleanTitle(d.title), author: cleanAuthor(d.author) };
        renderNow();
      }
    } catch (e) { /* ignore */ }
  }

  function loadTrack(i, start, autoplay) {
    if (!S.ready) { S.queued = [i, start || 0, autoplay !== false]; S.idx = i; renderNow(); return; }
    S.idx = i;
    S.want = autoplay !== false;
    player.loadVideoById({ videoId: S.order[i], startSeconds: Math.max(0, start || 0) });
    renderNow();
  }

  function handleEnded() {
    if (S.role === 'guest' && S.hostConn && S.hostConn.open) return; // host will tell us what's next
    advance();
  }

  function advance() {
    if (!S.pl) return;
    var i = S.idx + 1;
    if (i >= S.order.length) {
      S.order = shuffle(S.pl.tracks, S.order[S.order.length - 1]);
      i = 0;
    }
    loadTrack(i, 0, true);
    broadcast();
  }

  /* ------------------------------------------------------ user actions */
  function choosePlaylist(id) {
    if (S.role === 'guest' && S.hostConn && S.hostConn.open) {
      S.hostConn.send({ t: 'select', id: id });
      toast('Asking the room to switch playlists…');
      return;
    }
    startPlaylist(id);
  }

  function startPlaylist(id) {
    var pl = CFG.playlists.find(function (p) { return p.id === id; });
    if (!pl) return;
    S.pl = pl;
    S.order = shuffle(pl.tracks, S.order[S.idx]);
    S.errs = 0;
    loadTrack(0, 0, true);
    broadcast();
  }

  function toggle() {
    if (!S.pl) return;
    if (S.role === 'guest' && S.hostConn && S.hostConn.open) {
      S.hostConn.send({ t: 'toggle' });
      return;
    }
    if (!S.ready) return;
    if (S.playing) { S.want = false; player.pauseVideo(); }
    else { S.want = true; player.playVideo(); }
    setTimeout(broadcast, 250);
  }

  /* ---------------------------------------------------------------- UI */
  function renderNow() {
    var id = S.order[S.idx];
    $('#empty').classList.toggle('gone', !!S.pl);
    $('#play-btn').disabled = !S.pl;
    if (!S.pl) return;
    $('#now-pl').textContent = S.pl.name;
    var m = S.meta[id];
    $('#now-title').textContent = (m && m.title) || 'Loading…';
    $('#now-artist').textContent = (m && m.author) || '';
    if (!m) {
      getMeta(id).then(function (mm) {
        if (mm && S.order[S.idx] === id) { renderNow(); }
      });
    }
    // Up next: thumbnails only, order stays a surprise
    var rest = S.order.slice(S.idx + 1, S.idx + 5);
    $('#upnext-wrap').hidden = rest.length === 0;
    $('#upnext').innerHTML = rest.map(function (v) {
      return '<img alt="" loading="lazy" src="' + thumb(v, 'mqdefault') + '">';
    }).join('');
    document.title = (m && m.title ? m.title + ' · ' : '') + 'Melodia';
    updateMediaSession(id, m);
    markActiveCard();
  }

  function updateControls() {
    $('#ico-play').hidden = S.playing;
    $('#ico-pause').hidden = !S.playing;
    markActiveCard();
  }

  function updateMediaSession(id, m) {
    if (!('mediaSession' in navigator) || !window.MediaMetadata) return;
    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: (m && m.title) || 'Melodia',
        artist: (m && m.author) || '',
        album: S.pl ? S.pl.name : 'Melodia',
        artwork: [{ src: thumb(id, 'hqdefault'), sizes: '480x360', type: 'image/jpeg' }]
      });
      navigator.mediaSession.setActionHandler('play', toggle);
      navigator.mediaSession.setActionHandler('pause', toggle);
      // No skipping or seeking, anywhere, including lock-screen controls.
      ['nexttrack', 'previoustrack', 'seekto', 'seekforward', 'seekbackward'].forEach(function (a) {
        try { navigator.mediaSession.setActionHandler(a, null); } catch (e) { /* ignore */ }
      });
    } catch (e) { /* ignore */ }
  }

  setInterval(function () {
    if (!S.ready || !S.pl || !player.getDuration) return;
    var cur = player.getCurrentTime() || 0, dur = player.getDuration() || 0;
    $('#t-cur').textContent = fmt(cur);
    $('#t-dur').textContent = fmt(dur);
    $('#bar-fill').style.width = (dur ? Math.min(100, cur / dur * 100) : 0) + '%';
  }, 250);

  /* ------------------------------------------------------- visualizer */
  (function viz() {
    var cv = $('#viz'), ctx = cv.getContext('2d'), N = 56, level = 0, t = 0;
    function size() {
      var r = cv.getBoundingClientRect(), d = window.devicePixelRatio || 1;
      cv.width = Math.max(1, r.width * d); cv.height = 64 * d;
    }
    size(); window.addEventListener('resize', size);
    function frame() {
      t += 0.045;
      level += ((S.playing ? 1 : 0.04) - level) * 0.06;
      var w = cv.width, h = cv.height, bw = w / N;
      ctx.clearRect(0, 0, w, h);
      var g = ctx.createLinearGradient(0, 0, w, 0);
      g.addColorStop(0, '#8b5cf6'); g.addColorStop(.6, '#ec4899'); g.addColorStop(1, '#f59e0b');
      ctx.fillStyle = g;
      for (var i = 0; i < N; i++) {
        var v = (Math.sin(t * 1.6 + i * .42) + Math.sin(t * 2.3 + i * .17) * .7 + Math.sin(t * .9 + i * .9) * .5 + 2.2) / 4.4;
        var bh = Math.max(3, v * h * .95 * level);
        var x = i * bw + bw * .18, ww = bw * .64, y = (h - bh) / 2;
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(x, y, ww, bh, ww / 2); else ctx.rect(x, y, ww, bh);
        ctx.fill();
      }
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  })();

  /* ---------------------------------------------------- volume + keys */
  var savedVol = null;
  try { savedVol = localStorage.getItem('mel_vol'); } catch (e) { /* ignore */ }
  if (savedVol !== null) $('#vol').value = savedVol;
  $('#vol').addEventListener('input', function (e) {
    if (S.ready) player.setVolume(+e.target.value);
    try { localStorage.setItem('mel_vol', e.target.value); } catch (er) { /* ignore */ }
  });
  $('#play-btn').addEventListener('click', toggle);
  document.addEventListener('keydown', function (e) {
    if (e.code === 'Space' && e.target === document.body) { e.preventDefault(); toggle(); }
  });

  /* ------------------------------------- listen-together (PeerJS, P2P) */
  var ICE = { iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:global.stun.twilio.com:3478' }
  ] };

  function ensurePeer() {
    if (S.peerPromise) return S.peerPromise;
    S.peerPromise = new Promise(function (resolve, reject) {
      if (typeof Peer === 'undefined') { reject(new Error('PeerJS did not load')); return; }
      var p = new Peer(undefined, { config: ICE });
      S.peer = p;
      p.on('open', function (id) { resolve(id); });
      p.on('error', function (err) {
        toast('Connection problem: ' + (err.type || 'unknown'));
        reject(err);
      });
      p.on('connection', onIncoming);
    });
    S.peerPromise.catch(function () { S.peerPromise = null; S.peer = null; });
    return S.peerPromise;
  }

  function snapshot() {
    return {
      t: 'state',
      pl: S.pl ? S.pl.id : null,
      order: S.order,
      idx: S.idx,
      pos: S.ready && S.pl ? (player.getCurrentTime() || 0) : 0,
      playing: !!S.want,
      n: S.conns.length + 1
    };
  }
  function broadcast() {
    if (S.role !== 'host') return;
    var m = snapshot();
    S.conns.forEach(function (c) { if (c.open) c.send(m); });
  }
  setInterval(function () { if (S.role === 'host' && S.conns.length) broadcast(); }, 3000);

  // ----- host side
  function onIncoming(conn) {
    conn.on('open', function () {
      S.conns.push(conn);
      S.listeners = S.conns.length + 1;
      renderRoom();
      toast('A friend joined the room');
      broadcast();
    });
    conn.on('data', function (m) {
      if (!m) return;
      if (m.t === 'select') startPlaylist(m.id);
      else if (m.t === 'toggle') toggle();
    });
    var drop = function () {
      S.conns = S.conns.filter(function (c) { return c !== conn; });
      S.listeners = S.conns.length + 1;
      renderRoom();
      broadcast();
    };
    conn.on('close', drop);
    conn.on('error', drop);
  }

  function startHosting() {
    if (S.role === 'host' && S.room) return Promise.resolve(S.room);
    return ensurePeer().then(function (id) {
      S.role = 'host';
      S.room = id;
      renderRoom();
      return id;
    });
  }

  function inviteLink() {
    return location.origin + location.pathname + '#room=' + S.room;
  }

  // ----- guest side
  function joinRoom(roomId) {
    $('#invite-banner').hidden = true;
    toast('Connecting…');
    ensurePeer().then(function () {
      var conn = S.peer.connect(roomId, { reliable: true });
      var timer = setTimeout(function () {
        if (!conn.open) toast('Could not reach the room. Ask your friend to keep their tab open and try again.');
      }, 12000);
      conn.on('open', function () {
        clearTimeout(timer);
        S.role = 'guest';
        S.hostConn = conn;
        S.room = roomId;
        toast('Connected. Listening together');
        renderRoom();
      });
      conn.on('data', function (m) { if (m && m.t === 'state') applyState(m); });
      var gone = function () {
        if (S.role !== 'guest') return;
        S.role = 'solo'; S.hostConn = null; S.listeners = 1;
        renderRoom();
        toast('The host left. You can keep listening on your own.');
      };
      conn.on('close', gone);
      conn.on('error', gone);
    }).catch(function () { /* toast already shown */ });
  }

  function applyState(m) {
    S.listeners = m.n || 1;
    renderRoom();
    if (!m.pl) return;
    var pl = CFG.playlists.find(function (p) { return p.id === m.pl; });
    if (!pl) return;
    var changed = !S.pl || S.pl.id !== m.pl || S.idx !== m.idx || S.order.join() !== m.order.join();
    S.pl = pl; S.order = m.order; S.want = m.playing;
    var target = m.pos + (m.playing ? 0.4 : 0);
    if (changed) {
      loadTrack(m.idx, target, m.playing);
      return;
    }
    if (!S.ready) return;
    var drift = Math.abs((player.getCurrentTime() || 0) - target);
    if (drift > 2.2) player.seekTo(target, true);
    if (m.playing && !S.playing) player.playVideo();
    if (!m.playing && S.playing) player.pauseVideo();
  }

  // ----- room UI
  var AV = ['#8b5cf6', '#ec4899', '#f59e0b', '#22d3ee', '#34d399', '#f43f5e'];
  function renderRoom() {
    var n = Math.max(1, S.listeners), av = $('#avatars'), html = '';
    for (var i = 0; i < Math.min(n, 5); i++) {
      html += '<span style="background:' + AV[i % AV.length] + '">' + (i === 0 ? 'You' : i + 1) + '</span>';
    }
    av.innerHTML = html;
    $('#room-text').textContent = n > 1 ? n + ' listening together' : (S.role === 'host' ? 'Room open, waiting for friends' : 'Listening alone');
    $('#leave-btn').hidden = S.role !== 'guest';
    $('#invite-label').textContent = S.role === 'host' ? 'Invite link' : (S.role === 'guest' ? 'In a room' : 'Listen together');
  }

  $('#invite-btn').addEventListener('click', function () {
    if (S.role === 'guest') { toast('You are in a friend\'s room. Ask them for an invite link to share.'); return; }
    var dlg = $('#invite-dialog'), input = $('#invite-link');
    input.value = 'Creating your room…';
    if (!dlg.open) dlg.showModal();
    startHosting().then(function () {
      input.value = inviteLink();
      $('#share-btn').hidden = !navigator.share;
    }).catch(function () {
      input.value = 'Could not create a room. Check your connection and try again.';
    });
  });
  $('#copy-btn').addEventListener('click', function () {
    var input = $('#invite-link');
    if (input.value.indexOf('http') !== 0) return;
    var done = function () { toast('Link copied'); };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(input.value).then(done, function () { input.select(); document.execCommand('copy'); done(); });
    } else { input.select(); document.execCommand('copy'); done(); }
  });
  $('#share-btn').addEventListener('click', function () {
    navigator.share({ title: 'Listen with me on Melodia', text: 'Join my listening room:', url: $('#invite-link').value }).catch(function () {});
  });
  $('#leave-btn').addEventListener('click', function () {
    if (S.hostConn) S.hostConn.close();
    S.role = 'solo'; S.hostConn = null; S.room = null; S.listeners = 1;
    if (S.want && S.playing) { /* keep playing solo */ }
    history.replaceState(null, '', location.pathname);
    renderRoom();
    toast('You left the room');
  });

  /* ------------------------------------------------------------- boot */
  renderGrid();
  renderRoom();

  var m = location.hash.match(/room=([\w-]+)/);
  if (m) {
    $('#invite-banner').hidden = false;
    $('#join-btn').addEventListener('click', function () { joinRoom(m[1]); });
  }
})();
