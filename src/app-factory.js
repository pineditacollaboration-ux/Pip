import zlib from 'node:zlib';
import express from 'express';
import cookieParser from 'cookie-parser';
import bcrypt from 'bcryptjs';
import { createHash, createHmac, randomBytes } from 'node:crypto';
import { mkdirSync, rmSync, writeFileSync, readFileSync, existsSync, renameSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderProfile } from './profile-page.js';
import { SPEC, DEFAULTS, sanitize, designChanged } from './settings-spec.js';
import { evalBadges, BADGES, styleOf, rarityOf } from './badges.js';
import BADGE_ICONS from './badge-icons.json' with { type: 'json' };
import { createQueries } from './supabase-queries.js';
import { recordProfileVisit } from './visits.js';

// Load icons.json with fallback to empty object
let ICONS = {};
try {
  ICONS = JSON.parse(readFileSync(fileURLToPath(new URL('./icons.json', import.meta.url)), 'utf8'));
} catch (e) {
  console.warn('icons.json not found, using empty object');
}

const PUBLIC = fileURLToPath(new URL('../public', import.meta.url));
const RESERVED = new Set(['api','go','login','register','confirm','dashboard','static','assets','admin','settings','pip','u','top','help','vendor']);
const BACKGROUNDS = ['aurora', 'grid', 'noir', 'sunset', 'forest', 'void'];
const sha = (s) => createHash('sha256').update(s).digest('hex');
const SESSION_DAYS = 30;

// ── Profile HTML cache (TTL: 5 s) ────────────────────────────────────────────
const _profileCache = new Map(); // username → { html, ts }
const CACHE_TTL = 5_000;
const profileCacheGet = (u) => { const e = _profileCache.get(u); return e && Date.now() - e.ts < CACHE_TTL ? e.html : null; };
const profileCacheSet = (u, html) => _profileCache.set(u, { html, ts: Date.now() });

// ── Preview base cache (user's profile+links+stats, invalidated on any mutation)
const _previewCache = new Map();
// ── Discord presence cache (TTL: 30 s, independent of mutations)
const _presenceCache = new Map();

const profileCacheDel = () => { _profileCache.clear(); _previewCache.clear(); }; // invalidate on any mutation

const UPLOADS = { avatar: { max: 2e6, col: 'avatar', img: true }, banner: { max: 4e6, col: 'banner', img: true }, background: { max: 20e6, col: 'bg_media', img: true, video: true } };
function sniff(b) {
  if (!Buffer.isBuffer(b) || b.length < 12) return null;
  const h = (o, ...x) => x.every((v, i) => b[o + i] === v);
  if (h(0, 0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a)) return ['png', 'img'];
  if (h(0, 0xff, 0xd8, 0xff)) return ['jpg', 'img'];
  if (h(0, 0x47, 0x49, 0x46, 0x38)) return ['gif', 'img'];
  if (h(0, 0x52, 0x49, 0x46, 0x46) && h(8, 0x57, 0x45, 0x42, 0x50)) return ['webp', 'img'];
  if (h(4, 0x66, 0x74, 0x79, 0x70)) return ['mp4', 'video'];
  if (h(0, 0x1a, 0x45, 0xdf, 0xa3)) return ['webm', 'video'];
  return null;
}

export function createApp(db, { uploadDir = process.env.UPLOAD_DIR || 'uploads', discord, devEmail = false, owner = { userId: process.env.PINEDA_USER_ID, discordId: process.env.PINEDA_DISCORD_ID } } = {}) {
  const env = process.env, PUBLIC_URL = env.PUBLIC_URL || 'http://localhost:3000';
  const dc = discord ?? (env.DISCORD_CLIENT_ID && env.DISCORD_CLIENT_SECRET ? {
    clientId: env.DISCORD_CLIENT_ID,
    clientSecret: env.DISCORD_CLIENT_SECRET,
    redirectUri: env.DISCORD_REDIRECT_URI || `${PUBLIC_URL}/auth/discord/callback`,
    guildId: env.DISCORD_GUILD_ID,
    botToken: env.DISCORD_BOT_TOKEN,
  } : null);
  const dfetch = dc?.fetch ?? fetch;
  const allowEmail = devEmail || env.ALLOW_EMAIL_LOGIN === '1';
  const isOwner = (u) => {
    if (!u || !owner.userId || !owner.discordId) return false;
    const userIdMatches = String(u.id) === String(owner.userId);
    const discordMatches = String(u.discord_id) === String(owner.discordId);
    return discordMatches || userIdMatches;
  };
  const SECRET = process.env.PIP_SECRET || randomBytes(16).toString('hex');
  mkdirSync(uploadDir, { recursive: true });
  const app = express();
  app.disable('x-powered-by');

  app.use(cookieParser());
  app.use((req, res, next) => {
    const isProd = process.env.NODE_ENV === 'production';
    const headers = {
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'X-Frame-Options': 'SAMEORIGIN',
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',
      'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: https: blob:; media-src 'self' data: https: blob:; connect-src 'self' https://discord.com; frame-src 'self'; frame-ancestors 'self';"
    };
    if (isProd) headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains; preload';
    res.set(headers);
    next();
  });
  app.use((req, res, next) => {
    if (!['GET','HEAD','OPTIONS'].includes(req.method)) {
      const origin = req.get('origin');
      if (req.get('sec-fetch-site') === 'cross-site' || (origin && origin !== new URL(PUBLIC_URL).origin)) return res.status(403).json({ error: 'Origen no permitido' });
      if (!origin && !['same-origin','none'].includes(req.get('sec-fetch-site'))) return res.status(403).json({ error: 'Falta el origen de la solicitud' });
    }
    next();
  });
  app.use(express.json({ limit: '20kb', inflate: false }));
  app.use('/api', (req, res, next) => (req.method !== 'GET' && !(req.get('content-type') || '').startsWith('application/json') && !(req.path.startsWith('/upload/') && req.get('x-pip') === '1') ? res.status(415).json({ error: 'Se requiere JSON' }) : next()));

  const hits = new Map();
  const limit = (max) => (req, res, next) => {
    const k = req.ip + req.path, now = Date.now(), h = (hits.get(k) || []).filter((t) => now - t < 60000);
    if (h.length >= max) return res.status(429).json({ error: 'Demasiados intentos, espera un minuto' });
    h.push(now); hits.set(k, h);
    if (hits.size > 2000) {
      for (const [key, timestamps] of hits.entries()) {
        const fresh = timestamps.filter((t) => now - t < 60000);
        if (!fresh.length) hits.delete(key);
        else hits.set(key, fresh);
      }
    }
    next();
  };

  app.use('/api', limit(240));
  app.use('/auth', limit(30));
  const q = createQueries(db);

  const startSession = async (res, userId) => {
    const token = randomBytes(32).toString('base64url');
    await q.insSession(sha(token), userId, Math.floor(Date.now() / 1000) + SESSION_DAYS * 86400);
    res.cookie('pip_session', token, { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', maxAge: SESSION_DAYS * 864e5, path: '/' });
  };
  const auth = async (req, res, next) => {
    const t = req.cookies.pip_session;
    const u = t ? await q.session(sha(t)) : null;
    if (!isOwner(u)) return res.status(401).json({ error: 'No has iniciado sesión' });
    res.set('Cache-Control', 'no-store'); req.user = u; next();
  };
  const removeMedia = (old, id) => {
    if (typeof old !== 'string' || !old.startsWith('/uploads/')) return;
    const base = resolve(uploadDir, String(id)), target = resolve(uploadDir, old.slice(9));
    if (!target.startsWith(base + sep)) throw new Error('Ruta multimedia no permitida');
    rmSync(target, {force:true});
  };
  const cleanUrl = (s) => { try { const u = new URL(String(s).trim()); return ['http:', 'https:'].includes(u.protocol) && !u.username && !u.password && u.href.length <= 2048 ? u.href : null; } catch { return null; } };

  // El registro solo está permitido en desarrollo o cuando el propietario opta explícitamente por email.
  app.post('/api/register', limit(10), async (req, res) => {
    if (!allowEmail) return res.status(403).json({ error: 'El registro no está disponible' });
    const { username = '', email = '', password = '' } = req.body ?? {};
    if (typeof username !== 'string' || typeof email !== 'string' || typeof password !== 'string') return res.status(400).json({ error: 'Datos de registro inválidos' });
    const cleanUser = String(username).trim();
    const cleanEmail = String(email).trim().toLowerCase();
    if (!cleanUser || cleanUser.length > 24 || !/^[a-z0-9_-]+$/i.test(cleanUser) || cleanUser.toLowerCase() === 'pineda') return res.status(400).json({ error: 'Nombre de usuario no válido' });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail) || cleanEmail.length > 120) return res.status(400).json({ error: 'Correo inválido' });
    if (password.length < 8 || password.length > 200) return res.status(400).json({ error: 'La contraseña debe tener entre 8 y 200 caracteres' });
    const exists = await q.userByName(cleanUser) || await q.userByEmail(cleanEmail);
    if (exists) return res.status(409).json({ error: 'Ya existe una cuenta con ese usuario o correo' });
    const hash = await bcrypt.hash(password, 11);
    const user = await q.insUser(cleanUser, cleanEmail, hash);
    await q.insProfile(user.lastInsertRowid, cleanUser);
    await startSession(res, user.lastInsertRowid);
    res.status(201).json({ username: cleanUser, userId: user.lastInsertRowid });
  });

  app.post('/api/login', limit(10), async (req, res) => {
    if (!allowEmail) return res.status(403).json({ error: 'Entra con Discord' });
    const { login = '', password = '' } = req.body ?? {};
    const u = (await q.userByName(String(login))) || (await q.userByEmail(String(login)));
    if (!isOwner(u) || typeof password !== 'string' || password.length > 200 || !await bcrypt.compare(password, u.password_hash)) return res.status(401).json({ error: 'Credenciales incorrectas' });
    await startSession(res, u.id); res.json({ username: u.username });
  });

  app.post('/api/logout', async (req, res) => {
    if (req.cookies.pip_session) await q.delSession(sha(req.cookies.pip_session));
    res.clearCookie('pip_session'); res.json({ ok: true });
  });

  const parseSettings = (val) => {
    if (!val) return {};
    if (typeof val === 'object') return val;
    try { return JSON.parse(val); } catch { return {}; }
  };

  // Migrate old default values to new ones silently (non-destructive: only changes if value == old default)
  const migrateSettings = (s) => {
    const m = { ...s };
    if (m.card_bg === 96) m.card_bg = 12;      // old solid default → new glass default
    if (m.card_glass === 0 && m.card_bg <= 30) m.card_glass = 14; // add glass blur when transparent
    if (m.tilt === false && !Object.prototype.hasOwnProperty.call(s, '_tilt_set')) m.tilt = true; // enable 3D tilt
    return m;
  };

  const settingsOf = async (uid) => {
    let s = {};
    try {
      const p = await q.profile(uid);
      s = parseSettings(p?.settings);
    } catch {}
    return sanitize(migrateSettings(s), { ...DEFAULTS, ...migrateSettings(s) });
  };
  // Cached stats for instantaneous dashboard and preview responses
  const _statsCache = new Map();
  const stats = async (uid) => {
    const cached = _statsCache.get(uid);
    if (cached && Date.now() - cached.ts < 60_000) return cached.data;
    const [tot, unq, days, hours] = await Promise.all([
      q.viewsTotal(uid),
      q.uniq(uid),
      q.viewsDays(uid),
      q.hours(uid),
    ]);
    const res = {
      views: Number(tot.n || 0),
      unique30: Number(unq.n || 0),
      days: days || [],
      hours: Array.from({ length: 24 }, (_, h) => Number(hours.find((r) => r.hour === h)?.count || 0))
    };
    _statsCache.set(uid, { data: res, ts: Date.now() });
    return res;
  };
  const badgesOf = (u, p, s, links, st) => evalBadges({
    id: u.id, username: u.username, discord: !!u.discord_id, avatar: !!p.avatar, links: links.length, video: /\.(mp4|webm)$/.test(p.bg_media), designed: designChanged(s),
    shiny: s.trail !== 'none' && s.particles_type !== 'none', views: st.views, clicks: links.reduce((n, l) => n + l.clicks, 0), days: Math.floor((Date.now() / 1000 - Number(u.created_at)) / 86400)
  });
  const discordPresence = async (u, { skipCache = false } = {}) => {
    if (!u?.discord_id) return null;
    if (!dc?.guildId || !dc.botToken) return { status: null, activity: null, spotify: null, diagnostics: { state: 'configuration_missing' } };
    // Return cached presence during live-preview to avoid Gateway round-trips
    const cEntry = _presenceCache.get(u.discord_id);
    if (!skipCache && cEntry && Date.now() - cEntry.ts < 30_000) return cEntry.data;
    try {
      const { getUserPresence } = await import('./discord-bot.js');
      const result = await getUserPresence(u.discord_id, dc.guildId);
      _presenceCache.set(u.discord_id, { data: result, ts: Date.now() });
      return result;
    } catch (e) {
      console.warn('Error obteniendo presencia vía Gateway:', e?.message || e);
      return cEntry?.data ?? null; // serve stale data rather than null on error
    }
  };
  const me = async (u0) => {
    const [u, profile, links, st] = await Promise.all([
      q.userById(u0.id),
      q.profile(u0.id),
      q.links(u0.id),
      stats(u0.id)
    ]);
    // Repopulate _previewCache with fresh data so the next preview is instant
    _previewCache.set(u0.id, { u, p: profile, links, st, presence: _presenceCache.get(u?.discord_id)?.data ?? null, ts: Date.now() });
    // Fetch presence in background to refresh _presenceCache without blocking me()
    if (u?.discord_id) discordPresence(u).catch(() => {});
    let s = {};
    try { s = JSON.parse(profile.settings || '{}'); } catch {}
    const finalSettings = sanitize(migrateSettings(s), { ...DEFAULTS, ...migrateSettings(s) });
    const presence = _presenceCache.get(u?.discord_id)?.data ?? null;
    return {
      user: { username: u.username, email: u.email, discord: u.discord_id ? { name: u.discord_name, avatar: u.discord_avatar, banner: u.discord_banner, decoration: u.discord_decoration, presence } : null },
      profile, settings: finalSettings, links, stats: st, badges: badgesOf(u, profile, finalSettings, links, st)
    };
  };
  const pageData = async (u, over = {}) => {
    // Run profile, links, stats and discord presence all in parallel
    const [p, links, st, presence] = await Promise.all([
      q.profile(u.id),
      q.links(u.id),
      stats(u.id),
      discordPresence(u),
    ]);
    let s = {};
    if (over.settings) {
      s = over.settings;
    } else {
      s = parseSettings(p?.settings);
      s = sanitize(migrateSettings(s), { ...DEFAULTS, ...migrateSettings(s) });
    }
    console.log('DEBUG: Rendering profile with settings:', s);
    const { settings: _s, ...prof } = p;
    return {
      username: u.username, ...prof, ...over,
      discord: u.discord_id ? { name: u.discord_name, avatar: u.discord_avatar, decoration: u.discord_decoration, presence } : null,
      settings: s, links, views: s.show_views ? st.views : null,
      badges: s.badges_show ? badgesOf(u, { ...prof, ...over }, s, links, st).filter((b) => b.earned && !String(s.badge_hidden || '').split(',').includes(b.id)) : []
    };
  };

  // /api/me is called at dashboard startup — me() now also warms _previewCache
  app.get('/api/me', auth, async (req, res) => res.json(await me(req.user)));
  app.get('/api/discord/presence', auth, async (req, res) => {
    const user = await q.userById(req.user.id);
    if (!user?.discord_id) return res.status(404).json({ error: 'No hay una cuenta de Discord vinculada.' });
    res.set('Cache-Control', 'no-store');
    res.json({ presence: await discordPresence(user) });
  });

  app.put('/api/profile', auth, async (req, res) => {
    const { display_name = '', bio = '', accent = '#F2F2F2', background = 'aurora', splash_text = 'Haz clic para entrar' } = req.body ?? {};
    const num = (v, lo, hi, d) => (Number.isFinite(+v) ? Math.min(hi, Math.max(lo, Math.round(+v))) : d);
    const b = req.body ?? {};
    if (String(display_name).length > 40 || String(bio).length > 280) return res.status(400).json({ error: 'Nombre máx. 40 y bio máx. 280 caracteres' });
    if (!/^#[0-9a-fA-F]{6}$/.test(accent) || !BACKGROUNDS.includes(background)) return res.status(400).json({ error: 'Color o fondo no válido' });
    if (String(splash_text).length > 40) return res.status(400).json({ error: 'Texto de entrada: máx. 40' });
    console.log('DEBUG: Saving settings:', b.settings);
    const currentSettings = await settingsOf(req.user.id);
    const sanitizedSettings = sanitize(b.settings || {}, currentSettings);
    console.log('DEBUG: Sanitized settings:', sanitizedSettings);
    await q.updProfile(String(display_name).trim(), String(bio).trim(), accent, background, num(b.bg_blur, 0, 30, 0), num(b.bg_opacity, 20, 100, 100), num(b.bg_vignette, 0, 100, 40), b.particles === false || b.particles === 0 ? 0 : 1, b.splash ? 1 : 0, String(splash_text).trim() || 'Haz clic para entrar', req.user.id);
    await q.setSettings(sanitizedSettings, req.user.id);
    _profileCache.clear(); // invalidate public profile HTML cache
    res.json(await me(req.user)); // me() repopulates _previewCache with fresh data
  });

  app.post('/api/links', auth, async (req, res) => {
    const label = String(req.body?.label ?? '').trim(); const url = cleanUrl(req.body?.url);
    if (!label || label.length > 40) return res.status(400).json({ error: 'Título obligatorio (máx. 40)' });
    if (!url) return res.status(400).json({ error: 'La URL debe empezar por http:// o https://' });
    const n = (await q.countLinks(req.user.id)).n; if (n >= 30) return res.status(400).json({ error: 'Máximo 30 enlaces' });
    await q.insLink(req.user.id, label, url, n); _profileCache.clear(); res.status(201).json(await me(req.user));
  });
  app.put('/api/links/:id', auth, async (req, res) => {
    const id = Number(req.params.id), label = String(req.body?.label ?? '').trim(), url = cleanUrl(req.body?.url);
    if (!Number.isSafeInteger(id) || id <= 0 || !label || label.length > 40 || !url) return res.status(400).json({ error: 'Indica un título de hasta 40 caracteres y una URL http o https válida.' });
    const link = await q.linkById(id);
    if (!link || String(link.user_id) !== String(req.user.id)) return res.status(404).json({ error: 'Enlace no encontrado' });
    await q.updLink(id, req.user.id, label, url);
    _profileCache.clear();
    res.json(await me(req.user));
  });
  app.delete('/api/links/:id', auth, async (req, res) => { await q.delLink(Number(req.params.id), req.user.id); _profileCache.clear(); res.json(await me(req.user)); });

  app.post('/api/upload/:kind', auth, express.raw({ type: () => true, limit: '25mb', inflate: false }), async (req, res) => {
    const spec = Object.hasOwn(UPLOADS,req.params.kind) ? UPLOADS[req.params.kind] : null; const buf = req.body;
    if (!spec) return res.status(404).json({ error: 'Tipo desconocido' });
    if (!Buffer.isBuffer(buf) || !buf.length) return res.status(400).json({ error: 'Archivo vacío' });
    if (buf.length > spec.max) return res.status(413).json({ error: `Máximo ${spec.max / 1e6} MB` });
    const t = sniff(buf);
    if (!t || (t[1] === 'video' && !spec.video)) return res.status(400).json({ error: spec.video ? 'Formato no válido (PNG, JPG, GIF, WEBP, MP4 o WEBM)' : 'Formato no válido (PNG, JPG, GIF o WEBP)' });
    const dir = join(uploadDir, String(req.user.id)); mkdirSync(dir, { recursive: true });
    const name = `${req.params.kind}-${randomBytes(6).toString('hex')}.${t[0]}`;
    const filePath = join(dir, name);
    writeFileSync(filePath, buf);
    if (t[0] === 'mp4') {
      try {
        const optPath = join(dir, `opt-${name}`);
        const resFf = spawnSync('ffmpeg', ['-y', '-i', filePath, '-c', 'copy', '-movflags', '+faststart', optPath]);
        if (resFf.status === 0 && existsSync(optPath)) {
          rmSync(filePath, { force: true });
          renameSync(optPath, filePath);
        }
      } catch {}
    }
    const prof = await q.profile(req.user.id);
    const old = prof[spec.col] || '';
    try { await q.setMedia(spec.col, `/uploads/${req.user.id}/${name}`, req.user.id); } catch (error) { rmSync(join(dir,name),{force:true}); throw error; }
    removeMedia(old, req.user.id);
    _profileCache.clear();
    res.json(await me(req.user)); // me() repopulates _previewCache with fresh data
  });
  app.delete('/api/upload/:kind', auth, async (req, res) => {
    const spec = Object.hasOwn(UPLOADS,req.params.kind) ? UPLOADS[req.params.kind] : null; if (!spec) return res.status(404).json({ error: 'Tipo desconocido' });
    const prof = await q.profile(req.user.id);
    const old = prof[spec.col] || '';
    await q.setMedia(spec.col, '', req.user.id);
    removeMedia(old, req.user.id); _profileCache.clear(); res.json(await me(req.user));
  });
  app.post('/api/preview', auth, async (req, res) => {
    const b = req.body ?? {}, num = (v, lo, hi, d) => (Number.isFinite(+v) ? Math.min(hi, Math.max(lo, Math.round(+v))) : d);

    // Module-level cache; invalidated on every profile/links mutation.
    // TTL 60 s acts as a safety net only — normally invalidation keeps it fresh.
    let base = _previewCache.get(req.user.id);
    if (!base || Date.now() - base.ts > 60_000) {
      const [u, p, links, st, presence] = await Promise.all([
        q.userById(req.user.id),
        q.profile(req.user.id),
        q.links(req.user.id),
        stats(req.user.id),
        discordPresence(req.user) // served from _presenceCache if warm
      ]);
      base = { u, p, links, st, presence, ts: Date.now() };
      _previewCache.set(req.user.id, base);
    }

    const { u, p, links, st, presence } = base;
    const over = {
      display_name: String(b.display_name ?? p.display_name).slice(0, 40),
      bio: String(b.bio ?? p.bio).slice(0, 280),
      accent: /^#[0-9a-fA-F]{6}$/.test(b.accent) ? b.accent : p.accent,
      background: BACKGROUNDS.includes(b.background) ? b.background : p.background,
      bg_blur: num(b.bg_blur, 0, 30, p.bg_blur),
      bg_opacity: num(b.bg_opacity, 20, 100, p.bg_opacity),
      bg_vignette: num(b.bg_vignette, 0, 100, p.bg_vignette),
      splash: 0,
      settings: sanitize(b.settings, { ...DEFAULTS, ...migrateSettings(parseSettings(p?.settings)) })
    };

    const { settings: _s, ...prof } = p;
    const data = {
      username: u.username,
      ...prof,
      ...over,
      discord: u.discord_id ? { name: u.discord_name, avatar: u.discord_avatar, decoration: u.discord_decoration, presence } : null,
      settings: over.settings,
      links,
      views: over.settings.show_views ? st.views : null,
      badges: over.settings.badges_show ? badgesOf(u, { ...prof, ...over }, over.settings, links, st).filter((bd) => bd.earned && !String(over.settings.badge_hidden || '').split(',').includes(bd.id)) : []
    };

    res.type('html').send(renderProfile({ ...data, preview: true }));
  });

  app.get('/api/config', (req, res) => res.json({ discord: !!dc, email: allowEmail }));
  app.get('/api/badges', (req, res) => res.json(BADGES.map((b) => ({ id: b.id, name: b.n, desc: b.d, tier: b.tier, style: styleOf(b.id, b.tier), rarity: rarityOf(b.id, b.tier), icon: BADGE_ICONS[b.i], goal: b.goal ?? null }))));
  app.get('/api/spec', (req, res) => res.json(SPEC));
  app.get('/api/platforms', (req, res) => res.json(Object.entries(ICONS).map(([slug, i]) => ({ slug, n: i.n, c: i.c, b: i.b, p: i.p, h: i.h }))));

  // ---- Discord OAuth2
  const handleDiscordAuth = async (req, res) => {
    if (!dc) return res.status(404).send('Discord no está configurado');
    if (!owner.userId || !owner.discordId) return res.status(503).send('Acceso del propietario sin configurar');
    const stateToken = randomBytes(32).toString('hex');
    res.cookie('pip_oauth', stateToken, { httpOnly: true, sameSite: 'lax', secure: env.NODE_ENV === 'production', maxAge: 600000, path: '/' });
    const scopes = 'identify';
    res.redirect('https://discord.com/oauth2/authorize?' + new URLSearchParams({ client_id: dc.clientId, response_type: 'code', redirect_uri: dc.redirectUri, scope: scopes, state: stateToken, prompt: 'none' }));
  };
  app.get('/auth/discord', handleDiscordAuth);
  app.get('/api/auth/discord', handleDiscordAuth);

  const handleDiscordCallback = async (req, res) => {
    if (!dc) return res.status(404).send('Discord no está configurado');
    const { code, state } = req.query, saved = req.cookies.pip_oauth; res.clearCookie('pip_oauth');
    if (!code || !state || !saved || state !== saved) return res.redirect('/login?error=state');
    try {

      const tr = await dfetch('https://discord.com/api/oauth2/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ client_id: dc.clientId, client_secret: dc.clientSecret, grant_type: 'authorization_code', code: String(code), redirect_uri: dc.redirectUri }) });
      if (!tr.ok) throw new Error('token');
      const { access_token } = await tr.json();
      const ur = await dfetch('https://discord.com/api/users/@me', { headers: { Authorization: `Bearer ${access_token}` } });
      if (!ur.ok) throw new Error('user');
      const d = await ur.json(); if (!d.id) throw new Error('id');

      const permitted = await q.userByDiscord(String(d.id));
      if (!permitted || !isOwner(permitted) || String(d.id) !== String(owner.discordId)) return res.redirect('/login?error=unauthorized');
      const cdn = (k, h, sz) => (h ? `https://cdn.discordapp.com/${k}/${d.id}/${h}.${String(h).startsWith('a_') ? 'gif' : 'png'}?size=${sz}` : null);
      const defaultAvatar = `https://cdn.discordapp.com/embed/avatars/${Number((BigInt(d.id) >> 22n) % 6n)}.png`;
      const av = cdn('avatars', d.avatar, 256) || defaultAvatar, bn = cdn('banners', d.banner, 600);
      // avatar_decoration_data.asset es el preset ID (puede ser animado si empieza con a_)
      const decoAsset = d.avatar_decoration_data?.asset ?? null;
      const name = d.global_name || d.username;

      let u = await q.userByDiscord(String(d.id));
      if (isOwner(u)) {
        await q.updDiscord(name, av, bn, decoAsset, u.id);
        const currentProfile = await q.profile(u.id);
        if (!currentProfile.avatar || currentProfile.avatar === u.discord_avatar) {
          await q.setMedia('avatar', av || '', u.id);
        }
        if (req.cookies.pip_session) await q.delSession(sha(req.cookies.pip_session));
        await startSession(res, u.id);
        return res.redirect('/dashboard');
      }

      return res.redirect('/login?error=unauthorized');
    } catch (err) {
      console.error('Discord auth error:', err);
      res.redirect('/login?error=discord');
    }
  };
  app.get('/auth/discord/callback', handleDiscordCallback);
  app.get('/api/auth/discord/callback', handleDiscordCallback);

  app.get('/api/pending-reg', (req,res) => res.status(403).json({error:'Registro desactivado'}));
  app.get('/api/avatar-proxy', (req,res) => res.status(410).json({error:'Proxy retirado; se usan imágenes del CDN directamente'}));
  app.get('/api/username-available/:name', (req,res) => res.json({available:false,reason:'Instancia privada de Pineda'}));
  app.post('/api/auth/discord/confirm', (req,res) => res.status(403).json({error:'Registro desactivado'}));

  // ── Admin: ajuste de vistas (solo Pineda) ────────────────────────────────
  app.post('/api/admin/set-views', auth, async (req, res) => {
    if (String(req.user.username || '').toLowerCase() !== 'pineda') {
      return res.status(403).json({ error: 'No autorizado' });
    }
    const target = req.body?.target;
    if (!Number.isSafeInteger(target) || target < 0 || target > 10_000_000) {
      return res.status(400).json({ error: 'Valor no válido' });
    }
    const cur = await q.viewsTotal(req.user.id);
    const current = Number(cur.n || 0);
    let delta = 0;
    if (Number.isSafeInteger(req.body?.add) && req.body.add > 0) {
      delta = req.body.add;
    } else {
      if (target <= current) return res.status(400).json({ error: 'El total debe ser mayor que el actual' });
      delta = target - current;
    }
    if (delta > 0) {
      const today = new Date().toISOString().slice(0, 10);
      const { data: existing, error: readError } = await db.from('views').select('count').eq('user_id', req.user.id).eq('day', today).maybeSingle();
      if(readError) throw readError;
      if (existing) {
        const {error}=await db.from('views').update({ count: existing.count + delta }).eq('user_id', req.user.id).eq('day', today);
        if(error) throw error;
      } else {
        const {error}=await db.from('views').insert({ user_id: req.user.id, day: today, count: delta });
        if(error) throw error;
      }
    }
    const updated = await q.viewsTotal(req.user.id);
    res.json({ ok: true, views: Number(updated.n || 0), stats: await stats(req.user.id) });
  });

  app.post('/api/discord/use/:kind', auth, async (req, res) => {
    const u = await q.userById(req.user.id), kind = req.params.kind, url = kind === 'avatar' ? u.discord_avatar : kind === 'banner' ? u.discord_banner : null;
    if (!url) return res.status(404).json({ error: 'Tu cuenta de Discord no tiene esa imagen' });
    const prof = await q.profile(u.id);
    const old = prof[kind] || '';
    await q.setMedia(kind, url, u.id);
    removeMedia(old, req.user.id); res.json(await me(req.user));
  });
  app.delete('/api/account', auth, (req,res) => res.status(403).json({error:'La cuenta propietaria está protegida contra eliminación desde el panel.'}));
  app.post('/api/sessions/revoke', auth, async (req,res) => {
    const {error}=await db.from('sessions').delete().eq('user_id',req.user.id).neq('token_hash',sha(req.cookies.pip_session));
    if(error) throw error;
    res.json({ok:true});
  });

  app.get('/api/presence/:username', async (req, res) => {
    const u = await q.userByName(req.params.username);
    if (!isOwner(u)) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    const presence = await discordPresence(u);
    res.json({ presence });
  });

  app.get('/go/:id', limit(60), async (req, res) => {
    const l = await q.linkById(Number(req.params.id));
    if (!l || String(l.user_id) !== String(owner.userId) || !cleanUrl(l.url)) return res.status(404).send('Enlace no encontrado');
    const s = await settingsOf(l.user_id);
    if (s.count_clicks) await q.clickLink(Number(req.params.id));
    res.redirect(l.url);
  });

  // Middleware de compresión desactivado para evitar conflictos con Content-Length y errores de pantalla negra
  app.use((req, res, next) => next());
  app.use('/uploads', express.static(uploadDir, { maxAge: '7d', immutable: true, setHeaders: (r) => r.set('X-Content-Type-Options', 'nosniff') }));
  const noCache = (req, res, next) => { res.set('Cache-Control','no-store'); next(); };
  app.use((req,res,next) => /\.html$/i.test(req.path) ? res.redirect('/login') : next());
  // Servir archivos estáticos SIN index automático
  app.use(express.static(PUBLIC, { index: false, dotfiles: 'deny', setHeaders: (r, f) => { if (/\.(webp|svg|png|jpe?g|woff2?)$/i.test(f) || f.includes('/vendor/')) r.set('Cache-Control', 'public, max-age=604800'); } }));
  // Ruta raíz: redirige siempre al login (instancia de uso personal)
  app.get('/', noCache, (req, res) => res.redirect('/login'));
  app.get('/login', noCache, (req, res) => res.type('html').send(readFileSync(PUBLIC + '/auth.html','utf8')));
  // /register y /confirm desactivados — instancia de un solo perfil
  app.get('/register', noCache, (req, res) => res.redirect('/login'));
  app.get('/confirm', noCache, (req, res) => res.redirect('/login'));
  app.get('/dashboard', noCache, async (req,res) => { const u=req.cookies.pip_session ? await q.session(sha(req.cookies.pip_session)) : null; if(!isOwner(u)) return res.redirect('/login'); res.type('html').send(readFileSync(PUBLIC+'/dashboard.html','utf8')); });

  app.get('/:username', noCache, limit(120), async (req, res, next) => {
    const uname = req.params.username;
    const u = !RESERVED.has(uname.toLowerCase()) && (await q.userByName(uname));
    if (!isOwner(u)) return next();
    if (req.method === 'HEAD') return res.type('html').end();

    // Fire visit recording in background — never blocks the response
    recordProfileVisit(req, res, u, q).catch(() => {});

    // Serve from cache if available
    const cached = profileCacheGet(uname.toLowerCase());
    if (cached) return res.type('html').send(cached);

    // Render fresh and cache it
    const data = await pageData(u);
    const html = renderProfile(data);
    profileCacheSet(uname.toLowerCase(), html);
    res.type('html').send(html);
  });
  app.use((req, res) => res.status(404).type('html').send('<meta name="viewport" content="width=device-width"><body style="background:#05070A;color:#DDF4FF;font-family:system-ui;display:grid;place-items:center;height:100vh;margin:0"><div><h1>404</h1><p>Esta página no existe. <a style="color:#7DD3FC" href="/">Volver</a></p></div>'));
  app.use((err,req,res,next) => {
    if(res.headersSent) return next(err);
    const status = [400,413,415].includes(err.status) ? err.status : 500;
    console.error('Solicitud fallida:', status);
    res.status(status).json({error: status === 413 ? 'Archivo o solicitud demasiado grande' : status === 415 ? 'Formato o compresión no admitidos' : status === 400 ? 'JSON no válido' : 'No se pudo completar la solicitud'});
  });
  return app;
}
