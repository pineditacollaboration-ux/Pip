/* Live presence: one request at a time, server-aligned clock, no invented loops. */
(() => {
  const seed = document.getElementById('pip-presence-data');
  if (!seed) return;
  let initial; try { initial = JSON.parse(seed.textContent); } catch { return; }
  const card = document.getElementById('gl-spotify');
  if (!card) return;
  const el = id => document.getElementById(id);
  const embedded = window.parent !== window;
  let song = null, offset = 0, received = 0, busy = false, failed = false;
  let lastSnapshot = 0;
  const format = ms => { const n = Math.max(0, Math.floor(ms / 1000)); return Math.floor(n / 60) + ':' + String(n % 60).padStart(2, '0'); };
  function progress() {
    if (!song) return;
    const start = Number(song.timestamps?.start), end = Number(song.timestamps?.end);
    const valid = Number.isFinite(start) && Number.isFinite(end) && end > start && start > 0;
    const now = Date.now() + offset;
    const expired = valid && now >= end;
    const stale = failed || Date.now() - received > 15000 || expired;
    card.dataset.state = stale ? 'syncing' : 'playing';
    el('sp-state').textContent = stale ? 'Sincronizando' : 'Escuchando ahora';
    el('sp-cur').textContent = stale || !valid ? '—:—' : format(now - start);
    el('sp-tot').textContent = valid ? format(end - start) : '—:—';
    el('sp-fill').style.width = stale || !valid ? '0%' : Math.max(0, Math.min(100, (now - start) / (end - start) * 100)) + '%';
    el('sp-progress').setAttribute('aria-label', stale ? 'Esperando la actualización de Discord' : 'Progreso de la canción');
  }
  function apply(p) {
    if (!p) { failed = true; progress(); return; }
    const sampledAt = Number(p.sampledAt) || Date.now();
    if (sampledAt < lastSnapshot) return;
    lastSnapshot = sampledAt; offset = sampledAt - Date.now(); received = Date.now(); failed = false;
    const status = document.querySelector('.av-status');
    if (status) { status.className = 'av-status ' + (p.status || 'offline'); status.title = ({ online:'En línea',idle:'Ausente',dnd:'No molestar',offline:'Desconectado' })[p.status] || 'Estado no disponible'; }
    if (!p.spotify?.title) {
      song = null; card.style.display = 'none'; card.dataset.sync = '';
      el('sp-open').removeAttribute('href'); el('sp-img').removeAttribute('src');
      el('sp-fill').style.width = '0%'; return;
    }
    song = p.spotify;
    card.style.display = initial.enabled === false ? 'none' : 'block';
    el('sp-title').textContent = song.title; el('sp-title').title = song.title;
    el('sp-artist').textContent = [song.artist || 'Spotify', song.album].filter(Boolean).join(' · ');
    const artwork = typeof song.image === 'string' && /^https:\/\//.test(song.image) ? song.image : '';
    if (artwork) { if (el('sp-img').getAttribute('src') !== artwork) el('sp-img').src = artwork; }
    else el('sp-img').removeAttribute('src');
    const ambient = card.querySelector('.gl-spotify-ambient');
    if (ambient) ambient.style.backgroundImage = artwork ? `url("${artwork}")` : '';
    el('sp-img').style.visibility = artwork ? 'visible' : 'hidden';
    const id = /^[a-zA-Z0-9]{22}$/.test(song.syncId || '') ? song.syncId : '';
    card.dataset.sync = id;
    el('sp-open').hidden = !id;
    if (id) el('sp-open').href = 'https://open.spotify.com/track/' + id;
    else el('sp-open').removeAttribute('href');
    progress();
  }
  async function poll() {
    if (embedded || busy || document.hidden) return;
    busy = true; const abort = new AbortController(); const timeout = setTimeout(() => abort.abort(), 7000);
    try {
      const response = await fetch('/api/presence/' + encodeURIComponent(initial.username), { cache:'no-store', signal:abort.signal });
      if (!response.ok) throw new Error('presence unavailable');
      apply((await response.json()).presence);
    } catch { failed = true; progress(); }
    finally { clearTimeout(timeout); busy = false; }
  }
  if (embedded) {
    window.addEventListener('message', event => {
      if (event.source !== window.parent || event.origin !== new URL(document.baseURI).origin || event.data?.type !== 'pip:presence') return;
      apply(event.data.presence);
    });
  }
  apply(initial.presence);
  setInterval(progress, 500);
  if (!embedded) { poll(); setInterval(poll, 2500); document.addEventListener('visibilitychange', () => { if (!document.hidden) poll(); }); window.addEventListener('online', poll); }
})();
