import { DEFAULTS } from './settings-spec.js';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

let ICONS = {};
try {
  const iconsPath = fileURLToPath(new URL('./icons.json', import.meta.url));
  ICONS = JSON.parse(readFileSync(iconsPath, 'utf8'));
} catch (e) {
  console.warn('icons.json not found, using empty object');
}

export function iconFor(url) {
  let host = ''; try { host = new URL(url).hostname.replace(/^www\./, ''); } catch { return null; }
  for (const i of Object.values(ICONS)) if (i.hosts.some((h) => host === h || host.endsWith('.' + h))) return i;
  return null;
}
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export const BG_CSS = {
  aurora: 'radial-gradient(ellipse 80% 50% at 50% -20%,rgba(120,119,198,0.22),transparent),radial-gradient(ellipse 60% 50% at 50% 120%,rgba(56,189,248,0.14),transparent),#050508',
  grid: 'linear-gradient(rgba(255,255,255,0.03) 1px,transparent 1px) 0 0/40px 40px,linear-gradient(90deg,rgba(255,255,255,0.03) 1px,transparent 1px) 0 0/40px 40px,#050508',
  noir: '#000',
  sunset: 'radial-gradient(60% 50% at 15% 10%,rgba(251,113,133,.22),transparent 70%),radial-gradient(50% 45% at 90% 90%,rgba(251,146,60,.16),transparent 70%),#07040A',
  forest: 'radial-gradient(60% 50% at 20% 10%,rgba(52,211,153,.18),transparent 70%),radial-gradient(50% 45% at 85% 90%,rgba(16,185,129,.12),transparent 70%),#030907',
  void: 'radial-gradient(circle at 50% 120%,color-mix(in srgb,var(--a) 16%,transparent),transparent 60%),#000',
};

const FONTS = {
  erode: ["Erode:wght@400;500;600", "'Erode', serif"],
  general: ["General+Sans:wght@400;500;700", "'General Sans', sans-serif"],
  inter: ['Inter:wght@600;700;800', 'Inter,system-ui,sans-serif'],
  mono: ['JetBrains+Mono:wght@400;500;600;700;800', "'JetBrains Mono',ui-monospace,monospace"]
};

const PIN = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>';
const CLK = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>';
const CAL = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>';
const SHR = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7M16 6l-4-4-4 4M12 2v13"/></svg>';
const EYE = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>';

// Minimalist Verified Badge (Dark Room)
const VERIFIED_SVG = `
  <span class="verified-wrapper" tabindex="0" data-tt-title="Verificado" data-tt-desc="Cuenta verificada oficial">
    <img class="vb-img" src="/verificado_premium_128.webp" alt="Verificado" width="20" height="20" loading="eager" style="mix-blend-mode: screen; filter: brightness(1.2)">
  </span>`;

const BADGE_CSS = readFileSync(new URL('../public/badges.css', import.meta.url), 'utf8');

export function renderProfile({
  username, display_name, bio, accent, background, links, avatar = '', banner = '',
  bg_media = '', bg_blur = 0, bg_opacity = 100, bg_vignette = 40, splash = 0,
  splash_text = 'Haz clic para entrar', preview = false, settings = DEFAULTS,
  views = null, badges = [], discord = null
}) {
  const s = { ...DEFAULTS, ...settings }, nm = display_name || username, name = esc(nm), ini = esc(([...nm][0] || '?').toUpperCase());
  const ar = { circle: '50%', rounded: '22%', square: '0' }[s.avatar_shape];
  const dur = preview ? 0.001 : { slow: 1.1, normal: 0.7, fast: 0.4 }[s.enter_speed];
  const cfg = JSON.stringify({ pt: s.particles_type, tr: s.trail, tc: s.trail_color, sn: s.click_sound, tilt: s.tilt, ta: s.title_anim, title: nm, cf: s.click_fx, tz: s.w_tz, cd: s.w_cd_on ? s.w_cd_date : '', cl: s.w_cd_label }).replace(/</g, '\\u003c');
  
  const decorationUrl = discord?.decoration ? `https://cdn.discordapp.com/avatar-decoration-presets/${encodeURIComponent(discord.decoration)}.png?size=256` : '';
  const presence = discord?.presence;
  const statusLabels = { online: 'En línea', idle: 'Ausente', dnd: 'No molestar', offline: 'Desconectado' };
  
  // Discord exact status dot on the avatar with glow
  const statusBadge = presence?.status ? `<span class="dc-dot ${esc(presence.status)}" title="${esc(statusLabels[presence.status] || 'Estado')}"></span>` : '';
  const avatarHtml = s.avatar_show ? `<div class="av"><span class="ini" aria-hidden="true">${ini}</span>${avatar ? `<img src="${esc(avatar)}" alt="${name}" onerror="this.remove()">` : ''}${decorationUrl ? `<img class="av-deco" src="${esc(decorationUrl)}" alt="" aria-hidden="true" onerror="this.remove()">` : ''}${statusBadge}</div>` : '';

  // Whether user has verified badge (verificado or con-cara or admin account pineda)
  const isVerified = String(username || '').toLowerCase() === 'pineda' || badges.some((b) => b.id === 'verificado' || b.id === 'con-cara');
  // Lower badges strip: show remaining badges without duplicating verified
  const lowerBadges = badges.filter((b) => b.id !== 'verificado' && b.id !== 'con-cara');

  // Animated WebP map — one file per badge ID
  const BADGE_ANIM = {
    'owner':            '/corona_animada.webp',
    'fundador':         '/corona_animada.webp',
    'lifetime':         '/insignia_acceso_total_128.webp',
    'architect':        '/insignia_arquitecto_128.webp',
    'developer':        '/insignia_codigo_128.webp',
    'origin':           '/insignia_origen_128.webp',
    'creative-director':'/insignia_pluma_128.webp',
    'first-release':    '/insignia_primera_edicion_128.webp',
    'verificado':       '/verificado_premium_128.webp',
  };

  const badgesHtml = lowerBadges.length ? `
    <div class="badges-bar" role="list" aria-label="Insignias">
      ${lowerBadges.map((b) => {
        const animSrc = BADGE_ANIM[b.id];
        const innerContent = animSrc
          ? `<img class="badge-custom-media" src="${animSrc}" alt="${esc(b.name)}" loading="eager" decoding="async">`
          : `<svg viewBox="0 0 24 24" aria-hidden="true">${b.icon}</svg>`;
        return `
          <button type="button" class="badge-item" data-id="${esc(b.id)}" data-r="${esc(b.style || b.tier)}" data-tt-title="${esc(b.name)}" data-tt-desc="${esc(b.desc)}" aria-label="${esc(`${b.name}: ${b.desc}`)}">
            ${innerContent}
          </button>
        `;
      }).join('')}
    </div>` : '';

  const spotify = presence?.spotify;
  const spotifyArtist = spotify?.artist ? `${spotify.artist}${spotify.album ? ` · ${spotify.album}` : ''}` : 'Spotify';
  // Solo portadas https; la URL se codifica para no poder salir de url(...) en CSS.
  const safeImg = (u) => (typeof u === 'string' && u.startsWith('https://') && u.length < 600) ? u : '';
  const cssUrl = (u) => u.replace(/['"()\\\s<>]/g, (c) => '%' + c.charCodeAt(0).toString(16).toUpperCase().padStart(2, '0'));
  const spImg = safeImg(spotify?.image);
  const spSync = /^[A-Za-z0-9]{22}$/.test(spotify?.syncId || '') ? spotify.syncId : '';
  const jsonJs = (v) => JSON.stringify(v ?? null).replace(/</g, '\\u003c').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');
  const spotifyHtml = s.spotify_show ? `
    <div class="gl-spotify" id="gl-spotify" data-layout="${esc(s.spotify_layout || 'compact')}" data-state="playing" role="link" tabindex="0" aria-label="${esc(spotify?.title ? `Escuchando ${spotify.title}${spotify.artist ? ' de ' + spotify.artist : ''} en Spotify` : 'Spotify')}" style="${spotify?.title ? '' : 'display:none'}" ${spSync ? `data-sync="${spSync}"` : ''}>
      <div class="gl-spotify-ambient" id="sp-ambient" style="${spImg ? `background-image:url('${cssUrl(spImg)}')` : ''}"></div>
      <div class="gl-spotify-content">
        <div class="gl-spotify-cover-wrap" id="sp-cover" data-has="${spImg ? '1' : '0'}">
          <div class="gl-spotify-disc" aria-hidden="true"></div>
          <img src="${esc(spImg)}" alt="" class="gl-spotify-img" id="sp-img" width="72" height="72" decoding="async" referrerpolicy="no-referrer"${spImg ? '' : ' hidden'}>
          <span class="gl-spotify-nocover" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg></span>
        </div>
        <div class="gl-spotify-main">
          <div class="gl-spotify-top">
            <span class="gl-spotify-now">
              <svg class="gl-spotify-icon" viewBox="0 0 24 24" aria-hidden="true"><path fill="#1DB954" d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm4.586 14.424c-.18.295-.563.387-.857.207-2.35-1.435-5.308-1.76-8.793-.963-.335.077-.67-.133-.746-.468-.077-.334.132-.67.467-.746 3.808-.87 7.076-.496 9.722 1.115.294.18.386.562.207.855zm1.224-2.72c-.226.367-.707.483-1.074.257-2.69-1.653-6.79-2.132-9.97-1.166-.413.125-.85-.11-1.026-.522-.126-.413.11-.85.523-1.026 3.633-1.103 8.147-.568 11.233 1.33.367.227.483.708.257 1.075zm.105-2.835C14.692 8.95 9.375 8.775 6.297 9.71c-.494.15-1.02-.13-1.17-.624-.15-.494.13-1.02.624-1.17 3.532-1.073 9.404-.866 13.115 1.338.445.264.59.838.327 1.282-.264.444-.838.59-1.282.327z"/></svg>
              <span id="sp-state">Escuchando en Spotify</span>
            </span>
            <span class="gl-spotify-eq" aria-hidden="true"><i></i><i></i><i></i><i></i></span>
          </div>
          <div class="gl-spotify-title" id="sp-title" title="${esc(spotify?.title || '')}">${esc(spotify?.title || '')}</div>
          <div class="gl-spotify-artist" id="sp-artist" title="${esc(spotifyArtist)}">${esc(spotifyArtist)}</div>
          <div class="gl-spotify-progress-wrap" aria-hidden="true">
            <div class="gl-spotify-track-bar"><div class="gl-spotify-track-fill" id="sp-fill"></div></div>
            <div class="gl-spotify-times"><span id="sp-cur">0:00</span><span id="sp-tot">0:00</span></div>
          </div>
        </div>
      </div>
    </div>` : '';
  const activity = presence?.activity;
  const dcStatus = ['online', 'idle', 'dnd', 'offline'].includes(presence?.status) ? presence.status : 'offline';
  const dcSub = activity?.name ? [activity.name, activity.details].filter(Boolean).join(' · ') : presence?.spotify?.title ? `escuchando ${presence.spotify.title}` : 'no está haciendo nada';
  const dcName = discord?.name || username;
  const hasLiveActivity = Boolean(spotify?.title || activity?.name);
  const discordCardHtml = (discord && s.discord_activity_show) ? `
    <div class="gl-dc" id="gl-dc" role="region" aria-label="Discord" style="${hasLiveActivity ? 'display:none' : 'flex'}">
      <div class="gl-dc-av">
        ${/^https?:/.test(discord.avatar || '') ? `<img src="${esc(discord.avatar)}" alt="" loading="eager">` : `<span>${esc(([...dcName][0] || '?').toUpperCase())}</span>`}
        <i class="gl-dc-status ${dcStatus}" id="dc-status" title="${esc(statusLabels[dcStatus])}"></i>
      </div>
      <div class="gl-dc-main">
        <div class="gl-dc-name" id="dc-name">${esc(dcName)}</div>
        <div class="gl-dc-sub" id="dc-sub">${esc(dcSub)}</div>
      </div>
    </div>` : '';
  const isStreaming = activity?.type === 1 || activity?.type === 'Streaming';
  const discordActivityHtml = s.discord_activity_show ? `
    <div class="gl-activity" id="gl-activity" data-streaming="${isStreaming ? '1' : '0'}" style="${activity?.name ? '' : 'display:none'}">
      <div class="gl-act-content">
        <div class="gl-act-cover-wrap">
          ${activity?.largeImage ? `<img src="${esc(activity.largeImage)}" alt="${esc(activity.name)}" class="gl-act-img" id="act-img" loading="lazy">` : `<div class="gl-act-fallback-icon" id="act-img-fallback"><svg viewBox="0 0 24 24"><path d="M6 12h4m-2-2v4m7-3a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm4 2a1 1 0 1 1-2 0 1 1 0 0 1 2 0z"/><rect width="20" height="12" x="2" y="6" rx="6"/></svg></div>`}
          ${activity?.smallImage ? `<img src="${esc(activity.smallImage)}" alt="${esc(activity.smallText || '')}" class="gl-act-small-badge" id="act-small-img" title="${esc(activity.smallText || '')}">` : ''}
        </div>
        <div class="gl-act-main">
          <div class="gl-act-top">
            <span class="gl-act-badge ${isStreaming ? 'stream' : 'game'}">
              ${isStreaming ? '<svg class="gl-act-pulse-dot" viewBox="0 0 8 8"><circle cx="4" cy="4" r="3" fill="#A855F7"/></svg>' : '<svg class="gl-act-icon" viewBox="0 0 24 24"><path d="M6 12h4m-2-2v4m7-3a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm4 2a1 1 0 1 1-2 0 1 1 0 0 1 2 0z"/><rect width="20" height="12" x="2" y="6" rx="6"/></svg>'}
              <span id="act-type-lbl">${esc(activity?.typeLabel || 'Jugando a')}</span>
            </span>
            ${activity?.url ? `<a href="${esc(activity.url)}" target="_blank" rel="noopener nofollow" class="gl-act-link" id="act-stream-link">Ver stream</a>` : ''}
          </div>
          <div class="gl-act-title" id="act-title">${esc(activity?.name || '')}</div>
          ${activity?.details ? `<div class="gl-act-detail" id="act-details">${esc(activity.details)}</div>` : '<div class="gl-act-detail" id="act-details" style="display:none"></div>'}
          ${activity?.state ? `<div class="gl-act-state" id="act-state">${esc(activity.state)}</div>` : '<div class="gl-act-state" id="act-state" style="display:none"></div>'}
          ${activity?.timestamps?.start ? `<div class="gl-act-timer" id="act-time">Transcurrido: <span id="act-elapsed">00:00</span></div>` : '<div class="gl-act-timer" id="act-time" style="display:none"><span id="act-elapsed"></span></div>'}
        </div>
      </div>
    </div>` : '';

  // Song Showcase Widget (manual "vibing to" — guns.lol signature feature)
  const songHtml = (s.w_song_on && s.w_song_title) ? `
    <div class="gl-song" id="gl-song" ${s.w_song_url ? `data-url="${esc(s.w_song_url)}"` : ''} role="region" aria-label="Canción destacada">
      ${s.w_song_img ? `<div class="gl-song-ambient" style="background-image:url('${esc(s.w_song_img)}')"></div>` : ''}
      <div class="gl-song-content">
        <div class="gl-song-cover-wrap">
          ${s.w_song_img
            ? `<img src="${esc(s.w_song_img)}" alt="${esc(s.w_song_title)}" class="gl-song-img" loading="lazy">`
            : `<div class="gl-song-img-fallback"><svg viewBox="0 0 24 24"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg></div>`}
          <div class="gl-song-disc" aria-hidden="true"></div>
        </div>
        <div class="gl-song-main">
          <div class="gl-song-label">
            <svg class="gl-song-note" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>
            <span>ESCUCHANDO</span>
          </div>
          <div class="gl-song-title">${esc(s.w_song_title)}</div>
          ${s.w_song_artist ? `<div class="gl-song-artist">${esc(s.w_song_artist)}</div>` : ''}
        </div>
        ${s.w_song_url ? `<div class="gl-song-play" aria-hidden="true"><svg viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"/></svg></div>` : ''}
      </div>
    </div>` : '';

  const meta = s.status_text ? `<div class="meta"><span class="mt st">${esc(s.status_text)}</span></div>` : '';
  
  // Header with Verified Badge beside name + name_effect
  const SPARKS = [[6,18,0],[19,-6,.7],[34,84,1.4],[52,-10,.3],[68,92,1.1],[83,2,1.8],[95,70,.5],[12,96,2.1]];
  const sparkHtml = s.name_effect === 'sparkle' ? `<b class="p-sparks" aria-hidden="true">${SPARKS.map(([x, y, d]) => `<i style="left:${x}%;top:${y}%;animation-delay:${d}s"></i>`).join('')}</b>` : '';
  const nameHtml = s.name_show ? `<h1 class="p-name" data-effect="${esc(s.name_effect || 'none')}"><span>${name}</span>${isVerified ? VERIFIED_SVG : ''}${sparkHtml}</h1>` : '';

  // Bento/iOS Social Dock extraction from links
  const socialLinks = links.map(l => { const ic = iconFor(l.url); return ic ? { ...l, ic } : null; }).filter(Boolean);
  const socialDockHtml = (s.social_dock_show && socialLinks.length) ? `
    <nav class="social-dock" data-style="${esc(s.social_dock_style || 'glass')}" aria-label="Redes sociales">
      ${socialLinks.map(l => `
        <a class="dock-item${l.ic.img ? ' dock--img' : ''}" href="${preview ? '#' : '/go/' + l.id}" target="_blank" rel="noopener nofollow ugc" style="--dc:#${l.ic.h}" data-tt-title="${esc(l.ic.n)}" data-tt-desc="${esc(l.label)}" aria-label="${esc(l.label)}">
          ${l.ic.img
            ? `<img src="${esc(l.ic.img)}" alt="${esc(l.ic.n)}" class="dock-icon-img" aria-hidden="true">`
            : `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${l.ic.p}"/></svg>`}
        </a>
      `).join('')}
    </nav>
  ` : '';

  const bioHtml = s.bio_show && bio
    ? `<p class="bio" id="bio" ${s.typewriter_bio ? `data-tw="${esc(bio)}"` : ''} ${s.bio_rotate && !s.typewriter_bio ? `data-rot="${esc([bio, ...String(s.bio_rotate).split('|').map((x) => x.trim()).filter(Boolean)].join('|'))}"` : ''}>${s.typewriter_bio ? '' : esc(bio)}</p>`
    : '';

  const idHtml = `
    ${nameHtml}
    ${bioHtml}
    ${badgesHtml}
    ${meta}
    ${s.social_dock_pos === 'top' ? socialDockHtml : ''}`;

  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${name} · pip</title><meta name="description" content="${esc(s.seo_desc || bio || `Perfil de ${username} en pip`)}">${s.seo_noindex ? '<meta name="robots" content="noindex,nofollow">' : ''}<meta name="theme-color" content="#03050A"><meta property="og:type" content="profile"><meta property="og:title" content="${name} · pip"><meta property="og:description" content="${esc(s.seo_desc || bio || `Perfil de ${username} en pip`)}">${/^https?:/.test(avatar) ? `<meta property="og:image" content="${esc(avatar)}">` : ''}<meta name="twitter:card" content="summary"><link rel="icon" type="image/svg+xml" href="/pip-icono.svg">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;600;700;800&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">${FONTS[s.font]?.[0].includes(':') ? `<link href="https://fonts.googleapis.com/css2?family=${FONTS[s.font][0]}&display=swap" rel="stylesheet">` : ''}
${bg_media && /\.(mp4|webm)$/.test(bg_media) ? `<link rel="preload" href="${esc(bg_media)}" as="video" type="video/${bg_media.endsWith('.webm')?'webm':'mp4'}">` : ''}
<style>
@property --ang{syntax:"<angle>";inherits:false;initial-value:0deg}
:root{
  --hf:${FONTS[s.font]?.[1] || "'General Sans',sans-serif"};
  --df:${FONTS.erode[1]};
  --ns:${Number(s.name_size) || 26}px;
  --lsp:${Number(s.name_spacing) || 0}px;
  --lr:${Number(s.link_radius) || 12}px;
  --a:${esc(accent)};
  --as:${s.avatar_size}px;
  --ar:${ar};
  --bg: #000000;
  --surface: #0a0a0a;
  --ink: #efefef;
  --muted: #8c8c8c;
}
*{box-sizing:border-box}
html{background:var(--bg);color-scheme:dark;height:100%}
body{
  margin:0;min-height:100vh;min-height:100dvh;
  display:flex;flex-direction:column;align-items:center;justify-content:center;
  padding:clamp(20px,4vh,44px) 16px;
  color:var(--ink);
  font:16px/1.6 var(--hf);
  background:${BG_CSS[background] || BG_CSS.noir};
  background-attachment:fixed;
  overflow-x:hidden;
  -webkit-font-smoothing:antialiased;
  ${s.custom_cursor === 'crosshair' ? 'cursor:crosshair;' : ''}
}

/* ── Lit Strip Hero ─────────────────── */
.hero-strip {
  position: fixed;
  top: 50%;
  left: 0;
  width: 100%;
  height: 34vh;
  transform: translateY(-50%);
  display: flex;
  gap: 10px;
  overflow-x: auto;
  padding: 0 10px;
  z-index: 0;
  pointer-events: none;
  opacity: 0.35;
  mask-image: linear-gradient(to right, transparent, black 15%, black 85%, transparent);
  scrollbar-width: none;
}
.hero-strip::-webkit-scrollbar { display: none; }
.hero-strip img {
  height: 100%;
  width: auto;
  object-fit: cover;
  filter: brightness(0.4) grayscale(1);
  transition: filter 0.5s ease;
}

/* ── Four Corners ───────────────────── */
.corner {
  position: fixed;
  font-size: 14px;
  font-weight: 500;
  color: var(--muted);
  z-index: 10;
  padding: 44px 72px;
  pointer-events: none;
}
.tl { top: 0; left: 0; color: var(--ink); }
.tr { top: 0; right: 0; }
.bl { bottom: 0; left: 0; max-width: 36ch; }
.br { bottom: 0; right: 0; pointer-events: auto; }
.br a { color: var(--a); text-decoration: none; border-bottom: 1px solid transparent; transition: border 0.2s; }
.br a:hover { border-bottom-color: var(--a); }

.bgm{position:fixed;inset:0;z-index:0;overflow:hidden;opacity:${Number(bg_opacity) / 100};transform:translate3d(0,0,0);backface-visibility:hidden;contain:strict}
.bgm>img,.bgm>video{filter:saturate(${Number(s.bg_sat)/100}) brightness(${Number(s.bg_bright)/100});width:100%;height:100%;object-fit:cover;transform:${Number(bg_blur) > 0 ? 'scale(1.08) translateZ(0)' : 'translateZ(0)'};will-change:transform}
${Number(bg_blur) > 0 ? `.bgm::after{content:"";position:absolute;inset:0;backdrop-filter:blur(${Number(bg_blur)}px);-webkit-backdrop-filter:blur(${Number(bg_blur)}px);z-index:1;pointer-events:none}` : ''}
.vig{position:fixed;inset:0;z-index:0;pointer-events:none;background:radial-gradient(ellipse at center,transparent 40%,rgba(0,0,0,0.55) 100%)}

/* Ultra-Premium Glassmorphic Volume Capsule Dock */
.vol-wrap{
  position:fixed;bottom:24px;right:24px;z-index:20;
  display:flex;flex-direction:column;align-items:center;gap:10px;
}
.vol-slider-wrap{
  background:rgba(255,255,255,0.03);
  backdrop-filter:blur(16px) saturate(180%);-webkit-backdrop-filter:blur(16px) saturate(180%);
  border:1px solid rgba(255,255,255,0.08);
  border-radius:32px;
  padding:16px 10px;
  box-shadow:0 12px 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05);
  opacity:0;
  pointer-events:none;
  transform:translateY(12px) scale(0.9);
  transform-origin:bottom center;
  transition:all .3s cubic-bezier(0.16,1,0.3,1);
  will-change:opacity,transform;
}
.vol-wrap:hover .vol-slider-wrap,
.vol-wrap:focus-within .vol-slider-wrap,
.vol-wrap.is-active .vol-slider-wrap{
  opacity:1;
  pointer-events:auto;
  transform:translateY(0) scale(1);
}
.vol-track-container{
  position:relative;
  width:24px;
  height:120px;
  display:flex;
  align-items:center;
  justify-content:center;
  cursor:pointer;
  user-select:none;
  touch-action:none;
}
.vol-bar{
  position:relative;
  width:5px;
  height:100%;
  background:rgba(255,255,255,0.1);
  border-radius:99px;
  overflow:hidden;
}
.vol-bar-fill{
  position:absolute;
  bottom:0;
  left:0;
  right:0;
  height:var(--vp,50%);
  background:linear-gradient(to top, #fff, rgba(255,255,255,0.8));
  border-radius:99px;
  box-shadow:0 0 12px rgba(255,255,255,0.4);
  transition:none;
}
.vol-thumb-handle{
  position:absolute;
  left:50%;
  bottom:var(--vp,50%);
  transform:translate(-50%,50%);
  width:14px;
  height:14px;
  border-radius:50%;
  background:#ffffff;
  border:2px solid rgba(255,255,255,0.2);
  box-shadow:0 0 15px rgba(255,255,255,0.8), 0 2px 8px rgba(0,0,0,0.6);
  pointer-events:none;
  transition:transform 0.2s ease;
}
.vol-track-container:hover .vol-thumb-handle{
  transform:translate(-50%,50%) scale(1.2);
}
.vol-btn{
  width:46px;height:46px;border-radius:50%;
  border:1px solid rgba(255,255,255,0.08);
  background:rgba(255,255,255,0.03);
  backdrop-filter:blur(16px) saturate(180%);-webkit-backdrop-filter:blur(16px) saturate(180%);
  display:grid;place-items:center;
  cursor:pointer;color:rgba(255,255,255,0.8);
  transition:all 0.3s cubic-bezier(0.16,1,0.3,1);
  box-shadow:0 8px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05);
  outline:none;padding:0;
  will-change:transform;
  transform:translateZ(0);
}
.vol-btn:hover,.vol-wrap:focus-within .vol-btn{
  background:rgba(255,255,255,0.06);
  border-color:rgba(255,255,255,0.2);
  color:#fff;
  transform:scale(1.08) translateZ(0);
  box-shadow:0 12px 32px rgba(0,0,0,0.6), 0 0 20px -5px rgba(255,255,255,0.3);
}
.vol-btn:active{transform:scale(0.92) translateZ(0)}
.vol-btn svg{width:20px;height:20px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;pointer-events:none}
/* Volume dock: compacto, translúcido y con el mismo lenguaje visual de la tarjeta. */
.vol-wrap{bottom:20px;right:20px;gap:8px}
.vol-slider-wrap{padding:12px 8px;border-radius:22px;background:rgba(14,17,24,.72);border-color:rgba(255,255,255,.16);box-shadow:inset 0 1px 0 rgba(255,255,255,.16),0 14px 34px rgba(0,0,0,.5)}
.vol-track-container{width:20px;height:108px}
.vol-bar{width:4px;background:rgba(255,255,255,.13);box-shadow:inset 0 0 0 1px rgba(255,255,255,.06)}
.vol-bar-fill{background:linear-gradient(to top,var(--a),rgba(255,255,255,.9));box-shadow:0 0 12px color-mix(in srgb,var(--a) 70%,transparent)}
.vol-thumb-handle{width:13px;height:13px;background:#fff;border:2px solid color-mix(in srgb,var(--a) 65%,white);box-shadow:0 0 0 3px color-mix(in srgb,var(--a) 18%,transparent),0 2px 8px rgba(0,0,0,.55)}
.vol-btn{width:42px;height:42px;background:rgba(14,17,24,.72);border-color:rgba(255,255,255,.16);box-shadow:inset 0 1px 0 rgba(255,255,255,.14),0 8px 22px rgba(0,0,0,.45)}
.vol-btn svg{width:18px;height:18px}
canvas{position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:1}#t{z-index:6}
/* El cursor del sistema nunca se sustituye: conserva el feedback nativo sobre
   enlaces, insignias y controles, incluso dentro de la vista previa embebida. */
.fx{position:fixed;inset:0;z-index:5;pointer-events:none}.fx.lines{background:repeating-linear-gradient(0deg,rgba(0,0,0,.28) 0 1px,transparent 1px 3px)}
.fx.crt{background:repeating-linear-gradient(0deg,rgba(0,0,0,.3) 0 1px,transparent 1px 3px),radial-gradient(ellipse at center,transparent 55%,rgba(0,0,0,.55));animation:fk 4s infinite}@keyframes fk{50%{opacity:.86}}
.fx.dots{background:radial-gradient(rgba(0,0,0,.45) 1px,transparent 1.4px) 0 0/4px 4px}
.fx.vignette{background:radial-gradient(ellipse at center, transparent 35%, rgba(0,0,0,0.85) 100%)}
.fx.glitch{background:linear-gradient(rgba(18,16,16,0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.03), rgba(0, 255, 0, 0.01), rgba(0, 0, 255, 0.03));background-size:100% 3px, 6px 100%;pointer-events:none}

.stage{position:relative;z-index:10;width:100%;margin:auto 0;display:flex;justify-content:center;align-items:center;perspective:1100px;transform-style:preserve-3d;pointer-events:auto}

/* Ultra-Premium Glass Card */
.card{
  --mx:50%;--my:50%;
  position:relative;
  width:100%;
  max-width:${Number(s.card_width) || 460}px;
  padding:38px 32px 30px;
  border-radius:${Number(s.card_radius) ?? 22}px;
  background:${Number(s.card_bg) === 0 ? 'rgba(255,255,255,0.02)' : `linear-gradient(135deg, rgba(255,255,255,${((Number(s.card_bg) ?? 12) * 0.45) / 100}) 0%, rgba(12,16,24,${((Number(s.card_bg) ?? 12) * 0.95) / 100}) 100%)`};
  backdrop-filter:blur(${Number(s.card_glass) > 0 ? Number(s.card_glass) : 16}px) saturate(180%);
  -webkit-backdrop-filter:blur(${Number(s.card_glass) > 0 ? Number(s.card_glass) : 16}px) saturate(180%);
  border:${s.card_border ? `${Number(s.card_border_w) || 1}px solid rgba(255,255,255,0.18)` : 'none'};
  box-shadow:
    inset 0 1px 1px 0 rgba(255,255,255,0.35),
    inset 0 -1px 1px 0 rgba(255,255,255,0.06),
    0 24px 60px -12px rgba(0,0,0,0.85),
    0 0 45px -10px color-mix(in srgb, var(--a) 25%, transparent);
  overflow:hidden;
  will-change:transform;
  transform:translateZ(0);
  transform-style:preserve-3d;
  isolation:isolate;
  display:flex;
  flex-direction:column;
  align-items:center;
  transition:border-color 0.25s ease, box-shadow 0.25s ease;
  ${s.card_anim === 'glow' ? 'animation:card-glow 3.5s ease-in-out infinite alternate;' : ''}
  ${s.card_anim === 'holo' ? 'animation:card-holo 4s ease-in-out infinite alternate;' : ''}
  ${s.enter_on && !preview ? `animation:enter-${s.enter_type || 'rise'}-${s.enter_from || 'bottom'} ${dur}s cubic-bezier(0.16,1,0.3,1) both;` : ''}
}
.card::before{
  content:"";
  position:absolute;
  inset:0;
  border-radius:inherit;
  background:radial-gradient(ellipse 90% 45% at 50% 0%, rgba(255,255,255,0.14) 0%, transparent 65%);
  pointer-events:none;
  z-index:1;
}
${s.card_anim === 'glow' ? '@keyframes card-glow{0%{border-color:rgba(255,255,255,0.1);box-shadow:0 0 0 1px rgba(255,255,255,0.05) inset,0 40px 100px -20px rgba(0,0,0,0.75),0 0 35px -10px color-mix(in srgb,var(--a) 30%,transparent)}100%{border-color:color-mix(in srgb,var(--a) 70%,transparent);box-shadow:0 0 0 1px rgba(255,255,255,0.1) inset,0 40px 100px -20px rgba(0,0,0,0.75),0 0 85px 5px color-mix(in srgb,var(--a) 55%,transparent)}}' : ''}
${s.card_anim === 'holo' ? '@keyframes card-holo{0%{border-color:#38bdf8;box-shadow:0 0 0 1px rgba(56,189,248,0.2) inset,0 40px 100px -20px rgba(0,0,0,0.75),0 0 50px -5px rgba(56,189,248,0.45)}50%{border-color:#c084fc;box-shadow:0 0 0 1px rgba(192,132,252,0.2) inset,0 40px 100px -20px rgba(0,0,0,0.75),0 0 60px 0px rgba(192,132,252,0.5)}100%{border-color:#f472b6;box-shadow:0 0 0 1px rgba(244,114,182,0.2) inset,0 40px 100px -20px rgba(0,0,0,0.75),0 0 60px 0px rgba(244,114,182,0.5)}}' : ''}
${s.card_anim === 'spin' ? `.card::after{content:"";position:absolute;inset:-2px;border-radius:calc(${Number(s.card_radius) ?? 22}px + 2px);background:linear-gradient(var(--ang, 0deg), var(--a), transparent 40%, var(--a));z-index:-1;animation:card-spin 4s linear infinite;pointer-events:none}@keyframes card-spin{to{--ang:360deg}}` : ''}
${s.card_anim === 'rainbow' ? `.card::after{content:"";position:absolute;inset:-2px;border-radius:calc(${Number(s.card_radius) ?? 22}px + 2px);background:conic-gradient(from var(--ang, 0deg), #ff4545, #ffa500, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff4545);z-index:-1;animation:card-spin 3s linear infinite;filter:blur(2px);pointer-events:none}` : ''}
@keyframes enter-rise-bottom{from{opacity:0;transform:translateY(28px) translateZ(0)}to{opacity:1;transform:translateY(0) translateZ(0)}}
@keyframes enter-rise-top{from{opacity:0;transform:translateY(-28px) translateZ(0)}to{opacity:1;transform:translateY(0) translateZ(0)}}
@keyframes enter-rise-left{from{opacity:0;transform:translateX(-28px) translateZ(0)}to{opacity:1;transform:translateX(0) translateZ(0)}}
@keyframes enter-rise-right{from{opacity:0;transform:translateX(28px) translateZ(0)}to{opacity:1;transform:translateX(0) translateZ(0)}}
@keyframes enter-fade-bottom{from{opacity:0}to{opacity:1}}
@keyframes enter-fade-top{from{opacity:0}to{opacity:1}}
@keyframes enter-fade-left{from{opacity:0}to{opacity:1}}
@keyframes enter-fade-right{from{opacity:0}to{opacity:1}}
@keyframes enter-zoom-bottom{from{opacity:0;transform:scale(0.92) translateZ(0)}to{opacity:1;transform:scale(1) translateZ(0)}}
@keyframes enter-zoom-top{from{opacity:0;transform:scale(1.08) translateZ(0)}to{opacity:1;transform:scale(1) translateZ(0)}}
@keyframes enter-zoom-left{from{opacity:0;transform:scale(0.95) translateX(-20px) translateZ(0)}to{opacity:1;transform:scale(1) translateX(0) translateZ(0)}}
@keyframes enter-zoom-right{from{opacity:0;transform:scale(0.95) translateX(20px) translateZ(0)}to{opacity:1;transform:scale(1) translateX(0) translateZ(0)}}
/* Top shimmer edge with crystal gradient */
.card-shimmer{
  position:absolute;
  top:0;left:6%;right:6%;
  height:1px;
  background:linear-gradient(90deg,transparent,rgba(255,255,255,0.6) 50%,transparent);
  pointer-events:none;
  z-index:2;
}
.card>*{width:100%}
.card>.bn,.card>.stats-row,.card>.stats,.card>.f,.card>.shr{width:auto}
/* Los adornos son decorativos; el contenido siempre queda por encima y es
   interactivo. Esto evita que una capa de composición bloquee hover/click. */
.card{z-index:10;pointer-events:auto}
.card>header,.card>.links,.card>.badge-wrap,.card>.badges-bar,.card>.gl-dc,.card>.gl-spotify,.card>.gl-activity,.card>.social-dock,.card>.stats-row,.card>.f,.card>.shr,.card>.note,.card>.wg,.card>.cta,.card>.quote,.card>.avail{position:relative;z-index:10;pointer-events:auto}
.card a,.card button,.card [role="button"],.card .badge-item{pointer-events:auto}
.badge-item{appearance:none;-webkit-appearance:none;display:grid;place-items:center;width:42px;height:42px;padding:7px;border:1px solid rgba(255,255,255,.12);border-radius:12px;background:rgba(255,255,255,.055);color:inherit;cursor:pointer;transition:transform .18s ease,background .18s ease,border-color .18s ease,box-shadow .18s ease}
.badge-item:hover,.badge-item:focus-visible{transform:translateY(-3px) scale(1.05);background:rgba(255,255,255,.12);border-color:color-mix(in srgb,var(--a) 70%,rgba(255,255,255,.2));box-shadow:0 8px 20px color-mix(in srgb,var(--a) 22%,transparent);outline:none}
.badge-item:active{transform:translateY(-1px) scale(.98)}
.badge-item svg,.badge-item img{display:block;width:100%;height:100%;object-fit:contain;pointer-events:none}

/* Banner */
.bn{margin:-36px -30px 0;height:140px;background:#090a0f center/cover;-webkit-mask-image:linear-gradient(to bottom,#000 60%,transparent 100%);mask-image:linear-gradient(to bottom,#000 60%,transparent 100%)}

/* Header & Elements Centering */
.hd{
  width:100%;
  display:flex;
  flex-direction:column;
  align-items:center;
  justify-content:center;
  text-align:center;
}
.hd .av{margin:0 auto 14px}
.hd.left{align-items:flex-start;text-align:left}.hd.left .av{margin:0 0 14px}
.hd.right{align-items:flex-end;text-align:right}.hd.right .av{margin:0 0 14px auto}
.hd.side{flex-direction:row;align-items:center;gap:18px;text-align:left}.hd.side .av{margin:0;flex:none}.hd.side h1{margin-top:0}
.bn+.hd:not(.side) .av{margin-top:-52px}

.av{
  width:var(--as);height:var(--as);border-radius:var(--ar);
  display:grid;place-items:center;font:700 calc(var(--as)*.36) 'Plus Jakarta Sans',sans-serif;color:#fff;
  background:#090a0f;position:relative;z-index:1;
}
/* Accent glow ring around avatar — GPU-only border spin (no paint) */
.av::before{
  content:"";
  position:absolute;
  inset:-2px;
  border-radius:calc(var(--ar) + 2px);
  background:linear-gradient(135deg, color-mix(in srgb,var(--a) 80%,#fff) 0%, transparent 50%, color-mix(in srgb,var(--a) 40%,transparent) 100%);
  animation:av-ring-spin 4s linear infinite;
  z-index:0;
  opacity:0.7;
  will-change:transform;
  transform:translateZ(0);
}
.av::after{
  content:"";
  position:absolute;
  inset:0px;
  border-radius:inherit;
  background:#090a0f;
  z-index:0;
}
@keyframes av-ring-spin{to{transform:rotate(360deg) translateZ(0)}}
.av .ini{position:absolute;inset:0;display:grid;place-items:center;border-radius:inherit;background:#090a0f;font-size:calc(var(--as)*.36);color:#fff;z-index:1}
.av img{position:absolute;inset:0;width:100%;height:100%;border-radius:inherit;object-fit:cover;z-index:1}
.av img.av-deco{inset:-17%;width:134%;height:134%;border-radius:0;object-fit:contain;z-index:3;pointer-events:none}

/* Discord official status indicator with glow */
.av-status{
  position:absolute;
  bottom:1px;right:1px;
  width:20px;height:20px;
  border-radius:50%;
  border:3px solid #090a0f;
  background-color:#747f8d;
  z-index:4;
}
.av-status.online{background-color:#23a55a}
.av-status.idle{background-color:#f0b232}
.av-status.dnd{background-color:#f23f43}
.av-status.dnd::after{
  content:"";
  position:absolute;top:50%;left:50%;
  transform:translate(-50%,-50%);
  width:9px;height:2.5px;
  background-color:#090a0f;
  border-radius:1px;
}

/* Typography & Animated Verified Badge */
.p-name{
  display:inline-flex;
  align-items:center;
  justify-content:center;
  gap:5px;
  margin:4px auto 2px;
  text-align:center;
  font-family:var(--hf, 'Plus Jakarta Sans', -apple-system, sans-serif);
  font-weight:800;
  font-size:clamp(22px,5vw,var(--ns));
  line-height:1.15;
  letter-spacing:var(--lsp, -0.04em);
  position:relative;
}
.p-name span{
  display:inline-block;
  line-height:1.15;
  background:linear-gradient(135deg, #ffffff 0%, color-mix(in srgb,var(--a) 40%,#ffffff) 100%);
  -webkit-background-clip:text;
  -webkit-text-fill-color:transparent;
  background-clip:text;
  position:relative;
}

/* Name Effect: Neón Glow (guns.lol top style) */
.p-name[data-effect="glow"] span{
  background:linear-gradient(135deg, #ffffff 10%, color-mix(in srgb,var(--a) 80%,#ffffff) 100%);
  -webkit-background-clip:text;
  background-clip:text;
  filter:drop-shadow(0 0 12px color-mix(in srgb,var(--a) 90%,#ffffff)) drop-shadow(0 0 26px var(--a));
  animation:name-glow-pulse 2.8s ease-in-out infinite alternate;
}
@keyframes name-glow-pulse{
  0%{filter:drop-shadow(0 0 8px color-mix(in srgb,var(--a) 70%,#ffffff)) drop-shadow(0 0 16px var(--a))}
  100%{filter:drop-shadow(0 0 16px color-mix(in srgb,var(--a) 100%,#ffffff)) drop-shadow(0 0 34px var(--a))}
}

/* Name Effect: Living Rainbow / Gradient Sweep (zyo.lol style) */
.p-name[data-effect="gradient"] span{
  background:linear-gradient(90deg, #ffffff, var(--a), #e0e7ff, var(--a), #ffffff);
  background-size:250% 100%;
  -webkit-background-clip:text;
  -webkit-text-fill-color:transparent;
  background-clip:text;
  animation:name-grad-sweep 4s linear infinite;
}
@keyframes name-grad-sweep{
  0%{background-position:0% 50%}
  100%{background-position:200% 50%}
}

/* Name Effect: Cyber Glitch (zyo.se style) */
.p-name[data-effect="glitch"] span{
  text-shadow: 2px 0 0 rgba(255,0,85,0.75), -2px 0 0 rgba(0,229,255,0.75);
  animation:name-cyber-glitch 3.2s infinite;
}
@keyframes name-cyber-glitch{
  0%,85%,100%{transform:none;opacity:1;text-shadow: 2px 0 0 rgba(255,0,85,0.75), -2px 0 0 rgba(0,229,255,0.75)}
  86%{transform:skewX(-8deg) scaleY(0.96);text-shadow: 3px 0 0 rgba(255,0,85,0.9), -3px 0 0 rgba(0,229,255,0.9)}
  88%{transform:skewX(6deg) scaleY(1.02);text-shadow: -2px 0 0 rgba(255,0,85,0.9), 2px 0 0 rgba(0,229,255,0.9)}
  90%{transform:none;text-shadow: 2px 0 0 rgba(255,0,85,0.75), -2px 0 0 rgba(0,229,255,0.75)}
}


/* Name Effect: Destellos (white neon glow + twinkling sparks) */
.p-name[data-effect="sparkle"] span:not(.verified-wrapper):not(.verified-badge-anim){
  -webkit-text-fill-color:#fff;color:#fff;background:none;
  animation:name-spark-glow 3s ease-in-out infinite alternate;
}
@keyframes name-spark-glow{
  0%{text-shadow:0 0 6px rgba(255,255,255,.55),0 0 14px rgba(255,255,255,.25)}
  100%{text-shadow:0 0 10px rgba(255,255,255,.95),0 0 24px rgba(255,255,255,.55),0 0 44px rgba(255,255,255,.28)}
}
.p-sparks{position:absolute;inset:-10px -14px;pointer-events:none}
.p-sparks i{position:absolute;width:3px;height:3px;border-radius:50%;background:#fff;opacity:0;box-shadow:0 0 6px 1px rgba(255,255,255,.9);animation:name-spark-twinkle 2.6s ease-in-out infinite}
@keyframes name-spark-twinkle{0%,100%{opacity:0;transform:scale(.3)}45%,55%{opacity:1;transform:scale(1.15)}}

/* Discord identity card: always visible */
.gl-dc{
  display:flex;align-items:center;gap:14px;width:100%;margin-top:12px;padding:14px 16px;box-sizing:border-box;
  border-radius:20px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);
  backdrop-filter:blur(14px) saturate(160%);-webkit-backdrop-filter:blur(14px) saturate(160%);
  box-shadow:0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06);
  transition: transform 0.25s ease, background 0.25s ease;
}
.gl-dc:hover{
  background:rgba(255,255,255,0.06);
  transform: translateY(-2px);
}
.gl-dc-av{position:relative;flex:none;width:64px;height:64px}
.gl-dc-av img,.gl-dc-av>span{width:100%;height:100%;border-radius:50%;object-fit:cover;display:grid;place-items:center;background:#000;font-weight:800;font-size:24px}
.gl-dc-status{position:absolute;right:-2px;bottom:-2px;width:22px;height:22px;border-radius:50%;box-sizing:border-box;border:4px solid #0c0e16;background:#747f8d}
.gl-dc-status.online{background:#23a55a}
.gl-dc-status.idle{background:#f0b232}
.gl-dc-status.dnd{background:#f23f43}
.gl-dc-status.dnd::after{content:"";position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:8px;height:2.5px;border-radius:1px;background:#fff}
.gl-dc-main{min-width:0;text-align:left}
.gl-dc-name{font-family:var(--hf);font-weight:700;font-size:17px;line-height:1.25;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.gl-dc-sub{font-family:var(--hf);font-size:13px;color:rgba(255,255,255,.55);margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}

/* Typewriter Cursor (guns.lol signature bio feature) */
.bio .tw-cursor{
  display:inline-block;
  font-weight:300;
  color:var(--a);
  margin-left:2px;
  animation:tw-blink 0.8s infinite;
  user-select:none;
}
@keyframes tw-blink{0%,100%{opacity:1}50%{opacity:0}}
.verified-wrapper{
  position:relative;
  display:inline-flex;
  align-items:center;
  justify-content:center;
  cursor:pointer;
  outline:none;
  line-height:0;
  vertical-align:middle;
  align-self:center;
  flex:none;
  margin-left:1px;
  transform:translateY(2px);
}
.verified-badge-anim{
  position:relative;
  display:inline-flex;
  align-items:center;
  justify-content:center;
  width:25px;
  height:25px;
  transition:transform 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}
.verified-wrapper:hover .verified-badge-anim{
  transform:scale(1.15);
}
.vb-img{
  width:25px;
  height:25px;
  display:block;
  object-fit:contain;
  margin:0;
  padding:0;
}
.vb-bg{
  fill:rgba(56,189,248,0.12);
  stroke:none;
}
.vb-ring{
  fill:none;
  stroke:#38bdf8;
  stroke-width:1.6;
  stroke-dasharray:66;
  stroke-dashoffset:0;
  animation:vb-ring-spin 6s linear infinite;
  transform-origin:center;
}
.vb-check{
  fill:none;
  stroke:#ffffff;
  stroke-width:2.2;
  stroke-linecap:round;
  stroke-linejoin:round;
  filter:drop-shadow(0 0 2px rgba(255,255,255,0.7));
}
.vb-glow{
  position:absolute;
  inset:-2px;
  border-radius:50%;
  background:radial-gradient(circle, rgba(56,189,248,0.35) 0%, transparent 70%);
  animation:vb-glow-pulse 2.5s ease-in-out infinite;
  pointer-events:none;
  z-index:1;
}
@keyframes vb-ring-spin{
  0%{stroke-dashoffset:0;transform:rotate(0deg)}
  50%{stroke-dashoffset:33;transform:rotate(180deg)}
  100%{stroke-dashoffset:0;transform:rotate(360deg)}
}
@keyframes vb-glow-pulse{
  0%,100%{opacity:0.4;transform:scale(0.95)}
  50%{opacity:0.9;transform:scale(1.15)}
}


.bio{
  width:100%;
  margin:8px auto 14px;
  font-size:14px;
  color:rgba(226,232,240,0.85);
  line-height:1.6;
  white-space:pre-line;
  max-width:38ch;
  text-align:center;
  font-weight:450;
  letter-spacing:-0.01em;
  text-wrap:pretty;
}
.hd.left .bio{text-align:left;margin-left:0}
.hd.right .bio{text-align:right;margin-right:0}
.hd.side .bio{text-align:left;margin:4px 0 0}
.meta{
  width:100%;
  display:flex;
  justify-content:center;
  align-items:center;
  margin:6px auto;
  text-align:center;
}
.mt.st{
  display:inline-block;
  font-size:12.5px;
  color:rgba(226,232,240,0.7);
  background:rgba(255,255,255,0.04);
  padding:3px 12px;
  border-radius:99px;
  border:1px solid rgba(255,255,255,0.08);
}

.bd-grid{
  width:100%;
  display:grid;
  grid-template-columns:repeat(auto-fit,minmax(120px,1fr));
  gap:10px;
  margin:12px 0 16px;
}
.bd-header{
  grid-column:1/-1;
  font-size:12px;
  letter-spacing:.1em;
  text-transform:uppercase;
  color:rgba(255,255,255,0.6);
}
.bdg {
  display:flex;
  flex-direction:column;
  align-items:center;
  gap:6px;
  width: 48px;
  min-height:76px;
  padding:12px 10px;
  border-radius:16px;
  background:rgba(255,255,255,0.04);
  border:1px solid rgba(255,255,255,0.08);
  box-shadow:inset 0 1px 0 rgba(255,255,255,0.06);
}
.bdg-icon{
  display:grid;
  place-items:center;
  width:48px;
  height:48px;
  border-radius:12px;
  background:rgba(255,255,255,0.05);
  border:1px solid rgba(255,255,255,0.08);
}
.bdg-icon svg{
  width:24px;
  height:24px;
  fill:currentColor;
}
.bdg-name{
  font-size:12px;
  font-weight:700;
  line-height:1.2;
  color:#fff;
}
.bdg-rarity{
  font-size:11px;
  color:rgba(255,255,255,0.72);
}
.bdg-desc{display:none}

${BADGE_CSS}

/* ── Spotify · tarjeta en vivo ───────────────────────────────── */
.gl-spotify{
  position:relative;width:100%;margin-top:16px;border-radius:22px;
  background:rgba(12,14,20,${/\.(mp4|webm)$/.test(bg_media) ? '0.94' : '0.88'});
  border:1px solid rgba(255,255,255,0.1);
  ${/\.(mp4|webm)$/.test(bg_media) ? '' : 'backdrop-filter:blur(18px) saturate(170%);-webkit-backdrop-filter:blur(18px) saturate(170%);'}
  overflow:hidden;contain:layout style;
  box-shadow:0 14px 36px -12px rgba(0,0,0,.9),inset 0 1px 0 rgba(255,255,255,.12);
  transition:transform .3s cubic-bezier(.16,1,.3,1),border-color .3s,box-shadow .3s;
  animation:spotify-in .5s cubic-bezier(.16,1,.3,1) both;
  -webkit-tap-highlight-color:transparent;
}
.gl-spotify[data-sync]{cursor:pointer}
.gl-spotify::before{content:"";position:absolute;inset:0;border-radius:inherit;background:linear-gradient(135deg,rgba(255,255,255,.1),transparent 42%);pointer-events:none;z-index:2}
.gl-spotify:hover,.gl-spotify:focus-visible{transform:translateY(-3px);border-color:rgba(29,185,84,.5);box-shadow:0 22px 50px -14px rgba(0,0,0,.95),0 0 36px -10px rgba(29,185,84,.4),inset 0 1px 0 rgba(255,255,255,.2)}
.gl-spotify:focus-visible{outline:2px solid #1DB954;outline-offset:3px}
.gl-spotify[data-state="syncing"]{border-color:rgba(255,255,255,.08)}
.gl-spotify-ambient{position:absolute;inset:-30%;background-size:cover;background-position:center;filter:blur(34px) saturate(220%);opacity:.34;pointer-events:none;z-index:0;transition:background-image .4s ease}
.gl-spotify-content{position:relative;z-index:1;display:flex;align-items:center;gap:14px;padding:16px 18px;text-align:left}
.gl-spotify-cover-wrap{position:relative;width:72px;height:72px;flex:none;margin-right:12px}
.gl-spotify-img,.gl-spotify-nocover{position:relative;z-index:2;display:block;width:100%;height:100%;border-radius:14px;object-fit:cover;box-shadow:0 8px 22px rgba(0,0,0,.7),0 0 0 1px rgba(255,255,255,.1)}
.gl-spotify-img[hidden]{display:none}
.gl-spotify-nocover{display:grid;place-items:center;background:linear-gradient(140deg,#1b2a21,#0d1410)}
.gl-spotify-nocover svg{width:28px;height:28px;fill:none;stroke:var(--a,#1DB954);stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}
.gl-spotify-cover-wrap[data-has="1"] .gl-spotify-nocover{display:none}
.gl-spotify-disc{position:absolute;top:4px;left:20px;width:64px;height:64px;z-index:1;border-radius:50%;transition:transform .45s cubic-bezier(.34,1.56,.64,1)}
.gl-spotify-disc::before{content:"";position:absolute;inset:0;border-radius:50%;background:conic-gradient(from 0deg,#101113,#1d1e21 20%,#101113 45%,#202124 70%,#101113);box-shadow:0 4px 14px rgba(0,0,0,.8);animation:spindisc 5s linear infinite;animation-play-state:paused}
.gl-spotify-disc::after{content:"";position:absolute;top:50%;left:50%;width:15px;height:15px;margin:-7.5px 0 0 -7.5px;border-radius:50%;background:#090a0f;border:2px solid #1DB954}
.gl-spotify[data-state="playing"] .gl-spotify-disc::before{animation-play-state:running}
.gl-spotify:hover .gl-spotify-disc{transform:translateX(9px)}
@keyframes spindisc{to{transform:rotate(360deg)}}
@keyframes spotify-in{from{opacity:0;transform:translateY(10px) scale(.97)}to{opacity:1;transform:translateY(0) scale(1)}}
.gl-spotify-main{flex:1;min-width:0;display:flex;flex-direction:column;gap:3px}
.gl-spotify-top{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:2px}
.gl-spotify-now{display:inline-flex;align-items:center;gap:6px;min-width:0;color:#1ED760;font-size:10.5px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;white-space:nowrap}
.gl-spotify[data-state="syncing"] .gl-spotify-now{color:#94a3b8}
.gl-spotify-icon{width:14px;height:14px;flex:none}
.gl-spotify-eq{display:inline-flex;align-items:flex-end;gap:2px;height:14px;flex:none}
.gl-spotify-eq i{display:block;width:3px;height:100%;border-radius:2px;background:#1ED760;transform-origin:50% 100%;transform:scaleY(.25);animation:spotify-eq 1s ease-in-out infinite;animation-play-state:paused}
.gl-spotify-eq i:nth-child(2){animation-duration:.8s;animation-delay:-.4s}
.gl-spotify-eq i:nth-child(3){animation-duration:1.15s;animation-delay:-.7s}
.gl-spotify-eq i:nth-child(4){animation-duration:.9s;animation-delay:-.2s}
.gl-spotify[data-state="playing"] .gl-spotify-eq i{animation-play-state:running}
@keyframes spotify-eq{0%,100%{transform:scaleY(.25)}50%{transform:scaleY(1)}}
.gl-spotify-title{color:#fff;font-size:15.5px;font-weight:800;letter-spacing:-.02em;line-height:1.25;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.gl-spotify-artist{color:#cbd5e1;font-size:13px;font-weight:500;line-height:1.3;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.gl-spotify-progress-wrap{margin-top:9px;display:flex;flex-direction:column;gap:5px}
.gl-spotify-track-bar{width:100%;height:4px;border-radius:99px;background:rgba(255,255,255,.13);overflow:hidden;contain:strict}
.gl-spotify-track-fill{width:0;height:100%;border-radius:inherit;background:linear-gradient(90deg,#1DB954,#4ADE80);transition:width 1s linear}
.gl-spotify-times{display:flex;align-items:center;justify-content:space-between;font-size:10.5px;color:#a3b0c2;font-variant-numeric:tabular-nums;font-weight:600;line-height:1}

/* Portada grande */
.gl-spotify[data-layout="cover"] .gl-spotify-content{flex-direction:column;align-items:stretch;gap:14px;padding:18px}
.gl-spotify[data-layout="cover"] .gl-spotify-cover-wrap{width:100%;height:220px;margin:0}
.gl-spotify[data-layout="cover"] .gl-spotify-img,.gl-spotify[data-layout="cover"] .gl-spotify-nocover{border-radius:16px}
.gl-spotify[data-layout="cover"] .gl-spotify-disc{display:none}
.gl-spotify[data-layout="cover"] .gl-spotify-main{width:100%}
@media(max-width:380px){.gl-spotify-content{padding:14px;gap:12px}.gl-spotify-cover-wrap{width:60px;height:60px;margin-right:8px}.gl-spotify-disc{width:54px;height:54px;left:16px}.gl-spotify-title{font-size:14.5px}}
@media(prefers-reduced-motion:reduce){.gl-spotify,.gl-spotify *,.gl-spotify-disc::before{animation:none!important;transition:none!important}}

/* Discord Live Activity Card (Gaming / Streaming) */
.gl-activity{
  position:relative;
  width:100%;
  margin-top:12px;
  border-radius:20px;
  background:rgba(12,14,22,${/\.(mp4|webm)$/.test(bg_media) ? '0.94' : '0.90'});
  border:1px solid rgba(255,255,255,0.11);
  ${/\.(mp4|webm)$/.test(bg_media) ? '' : 'backdrop-filter:blur(18px) saturate(180%);-webkit-backdrop-filter:blur(18px) saturate(180%);'}
  box-shadow:0 12px 36px -8px rgba(0,0,0,0.85), inset 0 1px 0 rgba(255,255,255,0.12);
  transition:all 0.25s cubic-bezier(0.16,1,0.3,1);
  overflow:hidden;
  will-change:transform;
  transform:translateZ(0);
}
.gl-activity[data-streaming="1"]{
  border-color:rgba(168,85,247,0.45);
  box-shadow:0 12px 36px -8px rgba(0,0,0,0.9), 0 0 30px -8px rgba(168,85,247,0.35), inset 0 1px 0 rgba(255,255,255,0.2);
}
.gl-activity:hover{
  transform:translateY(-2.5px);
  border-color:rgba(255,255,255,0.22);
  box-shadow:0 18px 48px -8px rgba(0,0,0,0.95), inset 0 1px 0 rgba(255,255,255,0.2);
}
.gl-act-content{
  display:flex;
  align-items:center;
  gap:16px;
  padding:14px 18px;
  text-align:left;
}
.gl-act-cover-wrap{
  position:relative;
  width:58px;
  height:58px;
  flex:none;
}
.gl-act-img{
  width:100%;
  height:100%;
  border-radius:14px;
  object-fit:cover;
  display:block;
  box-shadow:0 4px 16px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.2);
}
.gl-act-fallback-icon{
  width:100%;
  height:100%;
  border-radius:14px;
  display:grid;
  place-items:center;
  background:linear-gradient(135deg, rgba(88,101,242,0.25), rgba(88,101,242,0.08));
  border:1px solid rgba(88,101,242,0.3);
  color:#5865F2;
}
.gl-act-fallback-icon svg{width:28px;height:28px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
.gl-act-small-badge{
  position:absolute;
  bottom:-4px;
  right:-4px;
  width:22px;
  height:22px;
  border-radius:50%;
  border:2px solid #090a0f;
  object-fit:cover;
  box-shadow:0 2px 8px rgba(0,0,0,0.7);
}
.gl-act-main{
  flex:1;
  min-width:0;
  display:flex;
  flex-direction:column;
  gap:3px;
}
.gl-act-top{
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:8px;
}
.gl-act-badge{
  display:inline-flex;
  align-items:center;
  gap:5px;
  font-size:10px;
  font-weight:800;
  letter-spacing:0.06em;
  text-transform:uppercase;
  padding:2px 8px;
  border-radius:99px;
}
.gl-act-badge.game{
  color:#5865F2;
  background:rgba(88,101,242,0.14);
  border:1px solid rgba(88,101,242,0.3);
}
.gl-act-badge.stream{
  color:#C084FC;
  background:rgba(168,85,247,0.16);
  border:1px solid rgba(168,85,247,0.4);
}
.gl-act-icon{width:12px;height:12px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
.gl-act-pulse-dot{width:8px;height:8px;animation:vb-glow-pulse 1.8s infinite}
.gl-act-link{
  font-size:11px;
  font-weight:700;
  color:#C084FC;
  text-decoration:none;
  display:inline-flex;
  align-items:center;
  transition:color .18s;
}
.gl-act-link:hover{color:#ffffff;text-decoration:underline}
.gl-act-title{
  color:#ffffff;
  font-size:14.5px;
  font-weight:800;
  letter-spacing:-0.02em;
  overflow:hidden;
  text-overflow:ellipsis;
  white-space:nowrap;
}
.gl-act-detail, .gl-act-state{
  color:#cbd5e1;
  font-size:12px;
  font-weight:500;
  overflow:hidden;
  text-overflow:ellipsis;
  white-space:nowrap;
  line-height:1.3;
}
.gl-act-state{color:#94a3b8}
.gl-act-timer{
  font-size:11px;
  color:rgba(148,163,184,0.85);
  font-variant-numeric:tabular-nums;
  margin-top:2px;
  font-weight:600;
}

/* Meta, widgets y enlaces */
.meta{display:flex;flex-wrap:wrap;gap:6px;margin-top:6px;justify-content:center}.hd.left .meta,.hd.side .meta{justify-content:flex-start}.hd.right .meta{justify-content:flex-end}
.mt{display:inline-flex;align-items:center;gap:4px;font-size:11px;font-weight:500;color:#94a3b8;padding:2px 8px;border-radius:99px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.06)}.mt svg{width:11px;height:11px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
.note{
  margin-top:14px;
  padding:12px 16px;
  border-radius:14px;
  font-size:13px;
  font-weight:600;
  text-align:center;
  line-height:1.45;
  --nc:var(--a);
  color:#ffffff;
  background:linear-gradient(135deg, color-mix(in srgb,var(--nc) 14%, rgba(8,10,16,.85)), rgba(10,12,18,.9));
  border:1px solid color-mix(in srgb,var(--nc) 32%, transparent);
  box-shadow:0 8px 24px -6px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.12), 0 0 20px -6px color-mix(in srgb,var(--nc) 25%, transparent);
  backdrop-filter:blur(14px);
  -webkit-backdrop-filter:blur(14px);
}
.note[data-t=hot]{--nc:#FB7185}
.note[data-t=ok]{--nc:#34D399}
.wg{
  margin-top:12px;
  display:flex;
  flex-wrap:wrap;
  gap:8px;
  justify-content:center;
}
.wgi{
  display:inline-flex;
  align-items:center;
  gap:8px;
  padding:7px 14px;
  border-radius:99px;
  font-size:12px;
  color:#cbd5e1;
  background:rgba(255,255,255,0.05);
  border:1px solid rgba(255,255,255,0.1);
  box-shadow:0 4px 14px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.08);
  backdrop-filter:blur(12px);
  -webkit-backdrop-filter:blur(12px);
  transition:all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}
.wgi:hover{
  background:rgba(255,255,255,0.09);
  border-color:color-mix(in srgb,var(--a) 45%,transparent);
  transform:translateY(-1.5px);
  color:#ffffff;
}
.wgi svg{
  width:13px;
  height:13px;
  fill:none;
  stroke:var(--a);
  stroke-width:2.2;
  stroke-linecap:round;
  stroke-linejoin:round;
  flex:none;
}
.wgi b{color:#fff;font-weight:700;font-variant-numeric:tabular-nums}
.wgi small{font-size:11px;opacity:.75}
.shr{position:absolute!important;top:12px;right:12px;width:28px;height:28px;border-radius:8px;display:grid;place-items:center;cursor:pointer;color:#71717a;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);transition:all .18s;z-index:3}.shr:hover{background:rgba(255,255,255,0.08);color:#fff}.shr svg{width:13px;height:13px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
.toast{position:fixed;left:50%;bottom:28px;transform:translate(-50%,20px);padding:7px 13px;border-radius:99px;background:rgba(7,14,21,.95);border:1px solid rgba(255,255,255,.18);color:#F2F2F2;font-size:12px;opacity:0;pointer-events:none;transition:.2s;z-index:30}.toast.on{opacity:1;transform:translate(-50%,0)}
.grain{position:fixed;inset:0;z-index:1;pointer-events:none;opacity:.06;mix-blend-mode:overlay;background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")}
.drift{position:fixed;inset:-15%;z-index:0;pointer-events:none;background:radial-gradient(40% 40% at 30% 30%,color-mix(in srgb,var(--a) 15%,transparent),transparent 70%),radial-gradient(35% 35% at 75% 70%,color-mix(in srgb,var(--a) 10%,transparent),transparent 70%);animation:dr 22s ease-in-out infinite alternate;will-change:transform;contain:strict}@keyframes dr{to{transform:translate(6%,-5%) scale(1.15) rotate(4deg)}}
/* Social Dock — Floating iOS / Bento Pill */
.social-dock{
  display:inline-flex;
  align-items:center;
  justify-content:center;
  gap:10px;
  padding:8px 14px;
  margin:14px auto 6px;
  border-radius:99px;
  background:rgba(255,255,255,0.04);
  border:1px solid rgba(255,255,255,0.08);
  box-shadow:0 8px 24px -6px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1);
  backdrop-filter:blur(18px);
  -webkit-backdrop-filter:blur(18px);
  position:relative;
  z-index:3;
}
.social-dock[data-style="color"] .dock-item{
  color:#ffffff;
  background:color-mix(in srgb, var(--dc, #fff) 22%, rgba(255,255,255,0.04));
  border-color:color-mix(in srgb, var(--dc, #fff) 45%, transparent);
}
.social-dock[data-style="color"] .dock-item:hover{
  background:var(--dc, #fff);
  color:#05070a;
  box-shadow:0 8px 24px var(--dc), 0 0 18px var(--dc) !important;
}
.dock-item{
  display:grid;
  place-items:center;
  width:38px;
  height:38px;
  border-radius:50%;
  color:#cbd5e1;
  background:rgba(255,255,255,0.05);
  border:1px solid rgba(255,255,255,0.09);
  box-shadow:0 4px 12px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.1);
  transition:transform 0.22s cubic-bezier(0.34, 1.56, 0.64, 1),
              background 0.2s ease,
              color 0.2s ease,
              border-color 0.2s ease,
              box-shadow 0.2s ease;
  cursor:pointer;
  outline:none;
}
.dock-item svg{
  width:18px;
  height:18px;
  fill:currentColor;
  transition:transform 0.22s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.dock-item.dock--img{background:none;border:none;box-shadow:none;width:46px;height:46px;border-radius:14px;overflow:hidden}
.dock-icon-img{
  width:46px;
  height:46px;
  object-fit:contain;
  display:block;
  transition:transform 0.22s cubic-bezier(0.34, 1.56, 0.64, 1);
  mix-blend-mode:screen;
}
.dock-item:hover .dock-icon-img{
  transform:scale(1.12);
}
.dock-item:hover{
  transform:translateY(-4px) scale(1.18);
  color:#ffffff;
  background:rgba(255,255,255,0.14);
  border-color:rgba(255,255,255,0.3);
  box-shadow:0 12px 28px rgba(0,0,0,0.65), 0 0 20px -2px var(--dc, #38bdf8);
  z-index:2;
}
.dock-item:hover svg{
  transform:scale(1.1);
}
.dock-item:active{
  transform:scale(0.94);
}
${s.card_float ? '.stage{animation:fl 6s ease-in-out infinite}@keyframes fl{50%{transform:translateY(-6px)}}' : ''}

/* Footer pip link */
.f{margin-top:18px;font-size:11px;color:#3f3f46;text-align:center;display:flex;align-items:center;justify-content:center;gap:4px;letter-spacing:.02em}
.f a{color:#52525b;text-decoration:none;font-weight:700;transition:color .18s}.f a:hover{color:color-mix(in srgb,var(--a) 80%,#38bdf8)}

/* Link rows */
.links{margin-top:14px;display:flex;flex-direction:column;gap:7px}
.links[data-cols="2"]{display:grid;grid-template-columns:1fr 1fr}.links[data-cols="2"] .l em{display:none}.links[data-cols="2"] .l{padding-right:8px}
.links[data-ic="0"] .l i{display:none}
.links[data-ls=solid] .l{background:linear-gradient(135deg,color-mix(in srgb,var(--a) 92%,#fff),color-mix(in srgb,var(--a) 70%,#000));color:#0A0A0A;border-color:transparent}.links[data-ls=solid] .l em{color:#0A0A0A;opacity:.7}.links[data-ls=solid] .l i.ic{background:rgba(3,18,28,.14);border-color:rgba(3,18,28,.2)}.links[data-ls=solid] .l i.ic svg{fill:#0A0A0A}
.links[data-ls=outline] .l{background:transparent;border:1.5px solid color-mix(in srgb,var(--a) 62%,transparent)}.links[data-ls=outline] .l:hover{background:color-mix(in srgb,var(--a) 12%,transparent)}
.links[data-ls=neon] .l{background:rgba(12,14,22,0.7);border:1px solid color-mix(in srgb,var(--a) 65%,transparent);box-shadow:0 0 16px -4px color-mix(in srgb,var(--a) 40%,transparent),inset 0 1px 0 rgba(255,255,255,0.1)}
.links[data-ls=neon] .l:hover{box-shadow:0 0 28px 0px color-mix(in srgb,var(--a) 75%,transparent),0 12px 28px rgba(0,0,0,0.6);border-color:var(--a)}
.links[data-ls=pill] .l{border-radius:99px!important;background:rgba(255,255,255,0.06);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);border:1px solid rgba(255,255,255,0.14);box-shadow:0 4px 18px rgba(0,0,0,0.4),inset 0 1px 0 rgba(255,255,255,0.25)}
.links[data-ls=pill] .l:hover{background:rgba(255,255,255,0.12);border-color:rgba(255,255,255,0.3);box-shadow:0 10px 28px rgba(0,0,0,0.6),0 0 20px -5px color-mix(in srgb,var(--a) 40%,transparent)}
.l{
  display:flex;align-items:center;gap:13px;padding:12px 16px;
  border-radius:var(--lr);text-align:left;font:600 13.5px/1.2 'Plus Jakarta Sans', -apple-system, sans-serif;
  color:#F0F0F2;text-decoration:none;
  background:rgba(255,255,255,0.035);
  border:1px solid rgba(255,255,255,0.08);
  box-shadow:0 4px 14px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.07);
  backdrop-filter:blur(10px);
  -webkit-backdrop-filter:blur(10px);
  transition:transform .18s cubic-bezier(0.16,1,0.3,1), background .18s ease, border-color .18s ease, box-shadow .18s ease;
  position:relative;overflow:hidden;
  will-change:transform;
  transform:translateZ(0);
}
.l::before{
  content:"";
  position:absolute;
  inset:0;
  border-radius:inherit;
  background:linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.08) 50%, transparent 100%);
  transform:translateX(-100%);
  transition:transform 0.45s ease;
  pointer-events:none;
}
.l:hover::before{
  transform:translateX(100%);
}
.l:hover,.l:focus-visible{
  background:rgba(255,255,255,0.075);
  border-color:color-mix(in srgb,var(--a) 45%,rgba(255,255,255,0.25));
  transform:translateY(-2.5px) scale(1.012) translateZ(0);
  box-shadow:0 12px 28px rgba(0,0,0,0.55), 0 0 20px -6px color-mix(in srgb,var(--a) 35%,transparent), inset 0 1px 0 rgba(255,255,255,0.18);
  outline:none;
}
.l:focus-visible{outline:2px solid var(--a,#8B8CFF);outline-offset:3px}
.l:active{
  transform:translateY(-0.5px) scale(0.99) translateZ(0);
}
.l .lbl{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;position:relative;letter-spacing:-0.01em;font-weight:600}
.l em{flex:none;display:grid;font-style:normal;color:var(--a);opacity:.6;transition:transform .18s cubic-bezier(0.16,1,0.3,1),opacity .18s ease}.l em svg{width:14px;height:14px;fill:none!important;stroke:currentColor;stroke-width:2.2;stroke-linecap:round;stroke-linejoin:round}.l:hover em{transform:translateX(3.5px);opacity:1}
.l i{font:700 12px 'Plus Jakarta Sans',sans-serif;font-style:normal;width:34px;height:34px;flex:none;border-radius:10px;display:grid;place-items:center;color:#0A0A0A;background:var(--a);flex-shrink:0;transition:transform .18s cubic-bezier(0.16,1,0.3,1);box-shadow:0 2px 10px rgba(0,0,0,0.3)}
.l:hover i{transform:scale(1.06)}
.l svg{width:18px;height:18px;fill:#F2F2F2}
.l i.ic{color:currentColor;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.11);box-shadow:0 2px 8px rgba(0,0,0,0.3)}
.l i.ic svg{fill:#ffffff}
.l i.ic.ic--img{background:none;border:none;box-shadow:none;width:44px;height:44px;border-radius:12px;overflow:hidden}
.lnk-icon-img{width:44px;height:44px;object-fit:contain;display:block;mix-blend-mode:screen}

/* Stats row: location + view counter pills side by side */
.stats-row{
  margin-top:20px;
  display:flex;
  align-items:center;
  justify-content:center;
  gap:8px;
  flex-wrap:wrap;
  width:100%;
}
.stats{
  display:inline-flex;
  align-items:center;
  gap:10px;
  font-size:13px;
  font-weight:700;
  color:#cbd5e1;
  letter-spacing:.01em;
  min-height:44px;
  padding:8px 18px 8px 12px;
  border-radius:99px;
  background:linear-gradient(135deg,rgba(255,255,255,.13),rgba(255,255,255,.045) 55%,rgba(0,0,0,.18));
  border:1px solid rgba(255,255,255,0.16);
  ${/\.(mp4|webm)$/.test(bg_media) ? '' : 'backdrop-filter:blur(16px) saturate(180%);-webkit-backdrop-filter:blur(16px) saturate(180%);'}
  box-shadow:0 8px 24px rgba(0,0,0,0.48), inset 0 1px 0 rgba(255,255,255,0.24), inset 0 0 0 1px rgba(0,0,0,.12);
  transition:all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  cursor:default;
  will-change:transform;
  transform:translateZ(0);
  position:relative;
  overflow:hidden;
}
.stats:nth-child(1){animation:stat-in .65s cubic-bezier(.16,1,.3,1) .12s both}
.stats:nth-child(2){animation:stat-in .65s cubic-bezier(.16,1,.3,1) .2s both}
@keyframes stat-in{from{opacity:0;transform:translateY(10px) scale(.94)}to{opacity:1;transform:translateY(0) scale(1)}}
.stats-icon{width:25px;height:25px;object-fit:contain;padding:4px;border-radius:9px;background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.16);filter:drop-shadow(0 0 7px color-mix(in srgb,var(--a) 48%,transparent));}
.stats-icon-loc{filter:grayscale(.15) drop-shadow(0 0 7px rgba(226,232,240,.5))}
.stats-icon-views{filter:drop-shadow(0 0 8px color-mix(in srgb,var(--a) 72%,transparent))}
.stats span{font-variant-numeric:tabular-nums;text-shadow:0 1px 8px rgba(0,0,0,.55)}
.stats::before{
  content:"";
  position:absolute;
  inset:0;
  background:linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent);
  transform:translateX(-100%);
  transition:transform 0.6s ease;
  pointer-events:none;
}
.stats:hover::before{
  transform:translateX(100%);
}
.stats:hover{
  background:rgba(255,255,255,0.10);
  border-color:color-mix(in srgb,var(--a) 60%,transparent);
  transform:translateY(-2px) scale(1.025) translateZ(0);
  box-shadow:0 12px 32px rgba(0,0,0,0.7), 0 0 24px -4px color-mix(in srgb,var(--a) 40%,transparent), inset 0 1px 0 rgba(255,255,255,0.25);
  color:#ffffff;
}
.stats.minimal{
  padding:4px 10px;
  background:transparent;
  border:none;
  box-shadow:none;
  backdrop-filter:none;
  -webkit-backdrop-filter:none;
  font-size:12px;
  color:#64748b;
}
.stats.minimal:hover{
  background:rgba(255,255,255,0.04);
  transform:none;
  box-shadow:none;
  color:#94a3b8;
}
.stats svg{
  width:18px;
  height:18px;
  flex:none;
}
.stats .stats-icon{
  flex:none;
  object-fit:contain;
  transition:transform .12s cubic-bezier(0.2, 0, 0, 1), filter .12s ease;
}
.stats .stats-icon-views{
  width:22px;
  height:22px;
  transform:none;
  filter:drop-shadow(0 0 6px color-mix(in srgb,var(--a) 70%,#38bdf8));
}
.stats:hover .stats-icon-views{
  transform:scale(1.08);
  filter:drop-shadow(0 0 10px color-mix(in srgb,var(--a) 90%,#38bdf8));
}
.stats .stats-icon-loc{
  width:38px;
  height:38px;
  margin:-8px -4px -8px -6px;
  transform:translateY(-3.5px) scale(1.9);
  filter:drop-shadow(0 0 4px rgba(255,255,255,0.7)) drop-shadow(0 0 10px color-mix(in srgb,var(--a) 70%,#38bdf8));
}
.stats:hover .stats-icon-loc{
  transform:translateY(-3.5px) scale(1.95);
  filter:drop-shadow(0 0 6px rgba(255,255,255,0.95)) drop-shadow(0 0 14px color-mix(in srgb,var(--a) 90%,#38bdf8));
}
.stats span{
  font-variant-numeric:tabular-nums;
  color:#e2e8f0;
  transition:color .2s;
}
.stats:hover span{color:#ffffff}


/* Global Smart Tooltip Portal */
.gl-tooltip-portal{
  position:fixed;
  z-index:999999;
  pointer-events:none;
  padding:6px 12px;
  border-radius:8px;
  background:#090a0f;
  border:1px solid rgba(255,255,255,0.14);
  box-shadow:0 12px 32px rgba(0,0,0,0.95), 0 0 15px rgba(0,0,0,0.8);
  text-align:center;
  white-space:nowrap;
  opacity:0;
  transform:translate(-50%, -100%) translateY(-8px);
  transition:opacity .15s ease, transform .15s cubic-bezier(0.16, 1, 0.3, 1);
}
.gl-tooltip-portal.visible{
  opacity:1;
  transform:translate(-50%, -100%) translateY(-12px);
}
.gl-tooltip-portal b{
  display:block;
  font:700 12px/1.2 'Plus Jakarta Sans', system-ui, sans-serif;
  color:#ffffff;
}
.gl-tooltip-portal[data-verified="true"] b{
  color:#38bdf8;
}
.gl-tooltip-portal small{
  display:block;
  font:500 11px/1.2 'Inter', system-ui, sans-serif;
  color:#94a3b8;
  margin-top:2px;
}
.badge-dialog{width:min(360px,calc(100vw - 32px));padding:26px;border:1px solid rgba(255,255,255,.18);border-radius:20px;background:rgba(10,12,18,.96);color:#f8fafc;box-shadow:0 24px 80px rgba(0,0,0,.7),0 0 36px -12px color-mix(in srgb,var(--a) 45%,transparent);backdrop-filter:blur(20px);text-align:center}.badge-dialog::backdrop{background:rgba(0,0,0,.6);backdrop-filter:blur(5px)}.badge-dialog h3{margin:0 0 8px;font:750 20px/1.2 var(--hf)}.badge-dialog p{margin:0;color:#aeb7c6;font-size:13px;line-height:1.55}.badge-dialog .badge-close{margin-top:18px;padding:9px 16px;border:1px solid rgba(255,255,255,.16);border-radius:10px;background:rgba(255,255,255,.08);color:#fff;cursor:pointer}

/* Splash screen */
.sp{position:fixed;inset:0;z-index:20;display:grid;place-items:center;border:0;cursor:pointer;color:#F2F2F2;font:600 18px Sora,sans-serif;letter-spacing:.02em;background:rgba(3,5,10,.72);backdrop-filter:blur(22px);transition:opacity .6s,visibility .6s}.sp span{animation:pu 2.2s ease-in-out infinite}.sp.go{opacity:0;visibility:hidden}@keyframes pu{50%{opacity:.45}}

/* Responsive Adaptation — Phones (iOS Safari, Android Chrome), Tablets & Small Screens */
@media(max-width:540px){
  body{padding:clamp(12px, 3vh, 24px) 12px;padding-bottom:calc(clamp(16px, 4vh, 32px) + env(safe-area-inset-bottom, 0px))}
  .card{padding:28px 18px 22px;border-radius:clamp(16px, 5vw, 24px)}
  .p-name{font-size:clamp(22px, 6.5vw, 28px)}
  .bio{font-size:13.5px;line-height:1.55}
  .l{padding:11px 13px;font-size:13px;gap:10px}
  .l i{width:28px;height:28px}
  .l svg{width:15px;height:15px}
  .gl-spotify{margin-top:12px;border-radius:18px}
  .gl-spotify-content{padding:12px 14px;gap:12px}
  .gl-spotify-cover-wrap{width:56px;height:56px}
  .gl-spotify-disc{width:50px;height:50px;left:14px;top:3px}
  .gl-spotify-title{font-size:14px}
  .gl-spotify-artist{font-size:12px}
  .social-dock{gap:8px;padding:6px 10px;margin-top:10px}
  .dock-item{width:34px;height:34px}
  .dock-item svg{width:16px;height:16px}
  .stats{padding:7px 16px;font-size:12px}
  .stats .stats-icon-views{width:18px;height:18px}
  .stats .stats-icon-loc{width:30px}
}
@media(max-width:360px){
  .card{padding:22px 14px 18px}
  .l{padding:9px 11px;font-size:12.5px}
  .links[data-cols="2"]{grid-template-columns:1fr}
}
@media (pointer: coarse) {
  /* Touch screen optimization: disable sticky hover states that freeze on phones */
  .card:hover{transform:translateZ(0)}
  .l:hover{transform:none}
  .dock-item:hover{transform:none}
  .stats:hover{transform:none}
  .gl-spotify:hover{transform:none}
  .gl-song:hover{transform:none}
  .l:active{transform:scale(0.98)}
  .dock-item:active{transform:scale(0.92)}
  .stats:active{transform:scale(0.98)}
  .gl-spotify:active{transform:scale(0.99)}
  .gl-song:active{transform:scale(0.99)}
}

/* Animated gradient banner — when no banner image */
.bn-grad{
  background:linear-gradient(120deg, color-mix(in srgb,var(--a) 55%,#4f46e5) 0%, color-mix(in srgb,var(--a) 30%,#0f172a) 40%, #0f172a 60%, color-mix(in srgb,var(--a) 35%,#7c3aed) 100%);
  background-size:250% 100%;
  animation:bn-sweep 8s ease-in-out infinite alternate;
  will-change:background-position;
}
@keyframes bn-sweep{0%{background-position:0% 50%}100%{background-position:100% 50%}}

/* Song Showcase Card — "Vibing To" — guns.lol signature feature */
.gl-song{
  position:relative;
  width:100%;
  margin-top:12px;
  border-radius:24px;
  background:rgba(12,14,20,${/\.(mp4|webm)$/.test(bg_media) ? '0.94' : '0.90'});
  border:1px solid rgba(255,255,255,0.11);
  ${/\.(mp4|webm)$/.test(bg_media) ? '' : 'backdrop-filter:blur(18px) saturate(190%);-webkit-backdrop-filter:blur(18px) saturate(190%);'}
  overflow:hidden;
  box-shadow:0 16px 44px -8px rgba(0,0,0,0.92), inset 0 1px 0 rgba(255,255,255,0.14);
  transition:all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  cursor:pointer;
  will-change:transform;
  transform:translateZ(0);
}
.gl-song:hover{
  transform:translateY(-4px) scale(1.01);
  border-color:color-mix(in srgb,var(--a) 50%,rgba(255,255,255,0.1));
  box-shadow:0 24px 60px -8px rgba(0,0,0,0.98), 0 0 45px -4px color-mix(in srgb,var(--a) 30%,transparent), inset 0 1px 0 rgba(255,255,255,0.25);
}
.gl-song-ambient{
  position:absolute;inset:0;
  background-size:cover;background-position:center;
  filter:blur(40px) saturate(220%);
  opacity:0.30;pointer-events:none;z-index:0;
}
.gl-song-content{
  position:relative;z-index:1;
  display:flex;align-items:center;gap:18px;padding:16px 20px;text-align:left;
}
.gl-song-cover-wrap{
  position:relative;width:72px;height:72px;flex:none;
}
.gl-song-img{
  position:relative;z-index:2;
  width:100%;height:100%;border-radius:14px;object-fit:cover;display:block;
  box-shadow:0 8px 24px rgba(0,0,0,0.75);
  transition:transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.gl-song:hover .gl-song-img{transform:scale(1.04);}
.gl-song-img-fallback{
  width:100%;height:100%;border-radius:14px;display:grid;place-items:center;
  background:linear-gradient(135deg, color-mix(in srgb,var(--a) 22%,rgba(12,14,20,1)), rgba(12,14,22,0.9));
  border:1px solid color-mix(in srgb,var(--a) 30%,rgba(255,255,255,0.08));
  color:color-mix(in srgb,var(--a) 70%,#ffffff);
}
.gl-song-img-fallback svg{width:30px;height:30px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}
.gl-song-disc{
  position:absolute;top:4px;left:22px;width:64px;height:64px;
  border-radius:50%;
  background:radial-gradient(circle at center, #111 25%, #222 26%, #111 35%, #2a2a2a 45%, #111 60%,  #1a1a1a 70%);
  box-shadow:0 4px 16px rgba(0,0,0,0.85);
  z-index:1;
  animation:spindisc 8s linear infinite;
  opacity:0.90;
  transition:transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.gl-song:hover .gl-song-disc{transform:translateX(16px) rotate(45deg);}
.gl-song-disc::after{
  content:"";position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);
  width:16px;height:16px;border-radius:50%;
  background:#090a0f;border:2px solid color-mix(in srgb,var(--a) 80%,#ffffff);
  box-shadow:0 0 8px color-mix(in srgb,var(--a) 60%,transparent);
}
.gl-song-main{flex:1;min-width:0;display:flex;flex-direction:column;gap:5px;}
.gl-song-label{
  display:inline-flex;align-items:center;gap:6px;
  color:color-mix(in srgb,var(--a) 90%,#ffffff);
  font-size:10.5px;font-weight:800;letter-spacing:0.08em;
  text-shadow:0 0 14px color-mix(in srgb,var(--a) 50%,transparent);
}
.gl-song-note{width:13px;height:13px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;flex:none}
.gl-song-title{
  color:#ffffff;font-size:15.5px;font-weight:800;letter-spacing:-0.02em;
  overflow:hidden;text-overflow:ellipsis;white-space:nowrap;
}
.gl-song-artist{
  color:#cbd5e1;font-size:13px;font-weight:500;
  overflow:hidden;text-overflow:ellipsis;white-space:nowrap;
}
.gl-song-play{
  flex:none;width:36px;height:36px;border-radius:50%;
  display:grid;place-items:center;
  background:color-mix(in srgb,var(--a) 18%,rgba(255,255,255,0.06));
  border:1px solid color-mix(in srgb,var(--a) 40%,rgba(255,255,255,0.1));
  color:color-mix(in srgb,var(--a) 80%,#ffffff);
  transition:all 0.2s cubic-bezier(0.16,1,0.3,1);
  opacity:0;
  transform:scale(0.8);
}
.gl-song:hover .gl-song-play{
  opacity:1;transform:scale(1);
  background:color-mix(in srgb,var(--a) 30%,rgba(255,255,255,0.12));
  box-shadow:0 0 18px -4px color-mix(in srgb,var(--a) 60%,transparent);
}
.gl-song-play svg{width:14px;height:14px;fill:currentColor;margin-left:2px}

/* Premium layer */
.links[data-lh=glow] .l:hover,.links[data-lh=glow] .l:focus-visible{transform:translateY(-1px) translateZ(0);box-shadow:0 0 34px -2px color-mix(in srgb,var(--a) 70%,transparent),0 10px 26px rgba(0,0,0,.55),inset 0 1px 0 rgba(255,255,255,.2);border-color:var(--a)}
.links[data-lh=slide] .l:hover,.links[data-lh=slide] .l:focus-visible{transform:translateX(7px) translateZ(0)}
.links[data-lh=none] .l:hover,.links[data-lh=none] .l:focus-visible{transform:none;box-shadow:none}
.links[data-lh=none] .l::before{display:none}
.links .l{animation:l-in .6s cubic-bezier(.16,1,.3,1) both}
.links .l:nth-child(2){animation-delay:.06s}.links .l:nth-child(3){animation-delay:.12s}.links .l:nth-child(4){animation-delay:.18s}.links .l:nth-child(5){animation-delay:.24s}.links .l:nth-child(n+6){animation-delay:.3s}
@keyframes l-in{from{opacity:0;transform:translateY(14px) scale(.98)}to{opacity:1;transform:none}}
.card::after{content:"";position:absolute;inset:0;border-radius:inherit;pointer-events:none;padding:1px;background:linear-gradient(160deg,rgba(255,255,255,.28),rgba(255,255,255,0) 28%,rgba(255,255,255,0) 72%,color-mix(in srgb,var(--a) 40%,transparent));-webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);-webkit-mask-composite:xor;mask-composite:exclude;opacity:.7}
.bio[data-rot]{transition:opacity .35s ease,transform .35s ease}.bio.rot-out{opacity:0;transform:translateY(5px)}
.p-name[data-effect="shine"] span:not(.verified-wrapper):not(.verified-badge-anim){background:linear-gradient(100deg,#8b93a1 0%,#fff 22%,#9aa3b2 40%,#fff 58%,#8b93a1 78%,#fff 100%);background-size:250% 100%;-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;animation:name-shine 3.6s linear infinite}
@keyframes name-shine{0%{background-position:100% 50%}100%{background-position:-100% 50%}}
.fx.aurora{background:radial-gradient(60% 45% at 20% 15%,color-mix(in srgb,var(--a) 34%,transparent),transparent 70%),radial-gradient(55% 40% at 85% 25%,rgba(168,85,247,.28),transparent 70%),radial-gradient(60% 45% at 50% 100%,rgba(52,211,153,.2),transparent 70%);mix-blend-mode:screen;opacity:.75;animation:fx-aurora 14s ease-in-out infinite alternate}
@keyframes fx-aurora{0%{transform:translate3d(-3%,-2%,0) scale(1.05)}100%{transform:translate3d(3%,3%,0) scale(1.15);filter:hue-rotate(40deg)}}

.fx.spotlight{background:radial-gradient(circle 340px at var(--mx,50%) var(--my,40%),transparent 0,rgba(0,0,0,.78) 100%)}
.fx.sunset{background:linear-gradient(180deg,rgba(255,140,60,0) 0%,rgba(255,90,120,.2) 55%,rgba(110,60,210,.34) 100%);mix-blend-mode:soft-light}
.bgz>img,.bgz>video{animation:bg-zoom 26s ease-in-out infinite alternate}
@keyframes bg-zoom{from{transform:scale(1)}to{transform:scale(1.09)}}
.card-glare{position:absolute;inset:0;border-radius:inherit;pointer-events:none;z-index:3;opacity:0;transition:opacity .35s;background:radial-gradient(260px circle at var(--gx,50%) var(--gy,0%),rgba(255,255,255,.13),transparent 62%)}
.card:hover .card-glare{opacity:1}
.links[data-stg="1"] .l{animation:lk-in .55s both cubic-bezier(.2,.8,.2,1);animation-delay:calc(var(--i,0)*70ms + 120ms)}
@keyframes lk-in{from{opacity:0;transform:translateY(12px) scale(.98)}to{opacity:1;transform:none}}
.avail{display:inline-flex;align-items:center;gap:8px;align-self:center;margin:0 auto 12px;padding:7px 14px;border-radius:999px;font-size:12.5px;font-weight:600;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);color:#e9e9ee;width:fit-content;display:flex}
.avail i{width:8px;height:8px;border-radius:50%;background:var(--ad);box-shadow:0 0 0 0 var(--ad);animation:av-pulse 2s infinite}
.avail[data-s=open]{--ad:#34d399}.avail[data-s=busy]{--ad:#fb7185}.avail[data-s=away]{--ad:#fbbf24}
@keyframes av-pulse{0%{box-shadow:0 0 0 0 color-mix(in srgb,var(--ad) 60%,transparent)}70%,100%{box-shadow:0 0 0 8px transparent}}
.quote{margin:0 0 14px;padding:14px 16px 14px 18px;border-left:2px solid var(--a);border-radius:2px 12px 12px 2px;background:linear-gradient(90deg,color-mix(in srgb,var(--a) 10%,transparent),transparent);font-style:italic;font-size:14px;line-height:1.5;color:#e4e4ea}
.quote cite{display:block;margin-top:6px;font-style:normal;font-size:11.5px;letter-spacing:.06em;text-transform:uppercase;opacity:.6}
.cta{display:block;text-align:center;margin:4px 0 14px;padding:14px 18px;border-radius:14px;font-weight:700;font-size:14.5px;text-decoration:none;transition:transform .2s,box-shadow .2s;color:#0a0a0f;background:var(--a)}
.cta:hover{transform:translateY(-2px) scale(1.01)}
.cta[data-st=glow]{box-shadow:0 0 28px -4px var(--a),0 0 0 1px color-mix(in srgb,var(--a) 50%,transparent)}
.cta[data-st=outline]{background:transparent;color:var(--a);border:1.5px solid var(--a)}
/* Final visual pass for the metric capsules (kept last so legacy theme rules
   cannot flatten the new treatment). */
.stats-row .stats:not(.minimal){
  min-width:0!important;min-height:40px!important;padding:6px 16px 6px 10px!important;gap:8px!important;
  background:rgba(255,255,255,.075)!important;
  border:1px solid rgba(255,255,255,.19)!important;border-radius:999px!important;
  box-shadow:inset 0 1px 0 rgba(255,255,255,.17),inset 0 -1px 0 rgba(0,0,0,.2),0 5px 14px rgba(0,0,0,.3)!important;
  letter-spacing:0!important;transform:translateZ(0);overflow:hidden;
}
.stats-row .stats:not(.minimal)::after{display:none!important}
.stats-row .stats:not(.minimal):hover{transform:translateY(-2px)!important;background:rgba(255,255,255,.12)!important;border-color:rgba(255,255,255,.32)!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.28),0 10px 22px rgba(0,0,0,.4),0 0 18px -8px color-mix(in srgb,var(--a) 45%,transparent)!important}
.stats-row .stats:not(.minimal) .stats-icon{position:relative;z-index:1;padding:0!important;border:0!important;background:transparent!important;border-radius:0!important}
.stats-row .stats:not(.minimal) .stats-icon-views{width:22px!important;height:22px!important;transform:none!important;filter:drop-shadow(0 0 6px color-mix(in srgb,var(--a) 70%,#38bdf8))!important}
.stats-row .stats:not(.minimal) .stats-icon-loc{width:38px!important;height:38px!important;margin:-8px -4px -8px -6px!important;transform:translateY(-3.5px) scale(1.9)!important;filter:drop-shadow(0 0 4px rgba(255,255,255,.7)) drop-shadow(0 0 10px color-mix(in srgb,var(--a) 70%,#38bdf8))!important}
.stats-row .stats:not(.minimal) span{position:relative;z-index:1;color:#f3f4f6;font-family:Inter,var(--hf),system-ui,sans-serif;font-size:13px!important;font-weight:650!important;line-height:1!important;letter-spacing:-.01em!important;text-shadow:0 1px 8px rgba(0,0,0,.6);font-variant-numeric:tabular-nums}
.stats-row .stats:not(.minimal)[aria-label^="Ubicación"] span{font-weight:600!important;letter-spacing:0!important}
@media(prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}}
</style><link rel="stylesheet" href="/studio-refresh.css"></head><body>${bg_media ? `<div class="bgm${s.bg_zoom ? ' bgz' : ''}" aria-hidden="true">${/\.(mp4|webm)$/.test(bg_media) ? `<video src="${esc(bg_media)}" autoplay muted loop playsinline preload="auto" id="bgv" style="will-change:transform"></video>` : `<img src="${esc(bg_media)}" alt="" fetchpriority="high">`}</div>` : ''}<div class="vig"></div>${s.particles_type !== 'none' ? '<canvas id="c" aria-hidden="true"></canvas>' : ''}${s.bg_noise ? '<div class="grain" aria-hidden="true"></div>' : ''}${s.bg_motion === 'drift' ? '<div class="drift" aria-hidden="true"></div>' : ''}${s.screen_fx !== 'none' ? `<div class="fx ${s.screen_fx}" aria-hidden="true"></div>` : ''}${s.trail !== 'none' ? '<canvas id="t" aria-hidden="true"></canvas>' : ''}${splash && !preview ? `<button class="sp" id="sp"><span>${esc(splash_text)}</span></button>` : ''}
<div class="stage"><main class="card" id="card"><div class="card-shimmer" aria-hidden="true"></div>${s.card_glare ? '<div class="card-glare" aria-hidden="true"></div>' : ''}${s.w_share ? `<button class="shr" id="shr" type="button" aria-label="Compartir perfil">${SHR}</button>` : ''}${banner ? `<div class="bn" style="background-image:url('${esc(banner)}')"></div>` : (s.banner_gradient ? `<div class="bn bn-grad" aria-hidden="true"></div>` : '')}
<header class="hd ${s.avatar_pos}">${avatarHtml}${s.avatar_pos === 'side' ? `<div>${idHtml}</div>` : idHtml}</header>
${discordCardHtml}
${spotifyHtml}
${discordActivityHtml}
${songHtml}
${s.w_avail_on && s.w_avail_text ? `<div class="avail" data-s="${esc(s.w_avail_state)}" role="status"><i></i>${esc(s.w_avail_text)}</div>` : ''}
${s.w_quote_on && s.w_quote ? `<blockquote class="quote">“${esc(s.w_quote)}”${s.w_quote_by ? `<cite>${esc(s.w_quote_by)}</cite>` : ''}</blockquote>` : ''}
${s.w_note_on && s.w_note ? `<div class="note" data-t="${esc(s.w_note_tone)}" role="note">${esc(s.w_note)}</div>` : ''}
${s.w_clock || (s.w_cd_on && s.w_cd_date) ? `<div class="wg">${s.w_clock ? `<span class="wgi">${CLK}<b id="clk">--:--</b><small>${esc((s.w_tz.split('/').pop() || s.w_tz).replace(/_/g, ' '))}</small></span>` : ''}${s.w_cd_on && s.w_cd_date ? `<span class="wgi">${CAL}<b id="cdn">…</b><small>${esc(s.w_cd_label)}</small></span>` : ''}</div>` : ''}
${s.w_cta_on && s.w_cta_label && /^https?:\/\//i.test(s.w_cta_url) ? `<a class="cta" data-st="${esc(s.w_cta_style)}" href="${preview ? '#' : esc(s.w_cta_url)}" target="_blank" rel="noopener nofollow ugc">${esc(s.w_cta_label)}</a>` : ''}
<div class="links" data-stg="${s.links_stagger ? 1 : 0}" data-lh="${esc(s.link_hover)}" data-ls="${esc(s.link_style)}" data-cols="${esc(s.link_cols)}" data-ic="${s.link_icons ? 1 : 0}">${links.map((l, li) => { const ic = iconFor(l.url); return `<a class="l" style="--i:${li}" href="${preview ? '#' : '/go/' + l.id}" rel="noopener nofollow ugc" target="_blank">${ic ? `<i class="ic${ic.img ? ' ic--img' : ''}" style="--ib:#${ic.h}">${ic.img ? `<img src="${esc(ic.img)}" alt="${esc(ic.n)}" class="lnk-icon-img" aria-hidden="true">` : `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${ic.p}"/></svg>`}</i>` : `<i>${esc([...l.label][0].toUpperCase())}</i>`}<span class="lbl">${esc(l.label)}</span><em><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 6 6 6-6 6"/></svg></em></a>`; }).join('\n')}</div>
${s.social_dock_pos === 'bottom' ? socialDockHtml : ''}
${(views !== null || s.location) ? `<div class="stats-row">${s.location ? `<div class="stats ${s.views_style === 'minimal' ? 'minimal' : ''}" aria-label="Ubicación: ${esc(s.location)}"><img class="stats-icon stats-icon-loc" src="/ubicacion_128.webp" alt="" aria-hidden="true"><span>${esc(s.location)}</span></div>` : ''}${views !== null ? `<div class="stats ${s.views_style === 'minimal' ? 'minimal' : ''}" id="stats-views" aria-label="${Number(views).toLocaleString('es')} visitas"><img class="stats-icon stats-icon-views" src="/insignia_visitas_128.webp" alt="" aria-hidden="true"><span id="views-count" data-val="${Number(views)}">${Number(views).toLocaleString('es')} visitas</span></div>` : ''}</div>` : ''}
<div class="f"><span>hecho con</span><a href="/" aria-label="pip">pip</a></div></main></div><div class="toast" id="toast" role="status" aria-live="polite"></div>${/\.(mp4|webm)$/.test(bg_media) ? `
<div class="vol-wrap" id="vol-wrap" aria-label="Control de volumen">
  <div class="vol-slider-wrap" id="vol-slider-wrap">
    <div class="vol-track-container" id="vol-track" role="slider" aria-label="Volumen" aria-valuemin="0" aria-valuemax="100" aria-valuenow="50" tabindex="0">
      <div class="vol-bar">
        <div class="vol-bar-fill" id="vol-bar-fill"></div>
      </div>
      <div class="vol-thumb-handle" id="vol-thumb-handle"></div>
    </div>
  </div>
  <button class="vol-btn" id="vol-btn" type="button" aria-label="Volumen" title="Volumen">
    <svg id="vol-icon" viewBox="0 0 24 24"><path d="M11 5 6 9H2v6h4l5 4V5z"/><path id="vol-waves" d="M15.54 8.46a5 5 0 0 1 0 7.07M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>
  </button>
</div>` : ''}
<div class="gl-tooltip-portal" id="gl-tooltip" role="tooltip" aria-hidden="true"><b id="tt-title"></b><small id="tt-desc"></small></div>
<dialog class="badge-dialog" id="badge-dialog" aria-labelledby="badge-dialog-title"><h3 id="badge-dialog-title"></h3><p id="badge-dialog-desc"></p><button class="badge-close" type="button">Cerrar</button></dialog>
<script>
(()=>{const CFG=${cfg},RM=matchMedia('(prefers-reduced-motion:reduce)').matches,col=getComputedStyle(document.documentElement).getPropertyValue('--a').trim()||'#7DD3FC';
let SP = ${jsonJs(spotify)};
let ACT = ${jsonJs(activity)};

// Typewriter bio animation (guns.lol signature effect)
const bioEl=document.getElementById('bio');
const bioRot=document.getElementById('bio');
if(bioRot&&bioRot.dataset.rot&&!RM){const ph=bioRot.dataset.rot.split('|');let ri=0;setInterval(()=>{bioRot.classList.add('rot-out');setTimeout(()=>{ri=(ri+1)%ph.length;bioRot.textContent=ph[ri];bioRot.classList.remove('rot-out')},350)},3600)}
if(bioEl&&bioEl.dataset.tw&&!RM){
  const txt=bioEl.dataset.tw;
  const cur=document.createElement('span');cur.className='tw-cursor';cur.textContent='|';
  let i=0;
  const type=()=>{
    if(i<=txt.length){bioEl.textContent=txt.slice(0,i);bioEl.appendChild(cur);i++;}
    else{clearInterval(twInt);}
  };
  bioEl.textContent='';bioEl.appendChild(cur);
  const twInt=setInterval(type,38);
}

const toast=(m)=>{const t=document.getElementById('toast');if(!t)return;t.textContent=m;t.classList.add('on');setTimeout(()=>t.classList.remove('on'),1800)};

// Song card click-to-open
const songCard=document.getElementById('gl-song');
if(songCard&&songCard.dataset.url){
  songCard.addEventListener('click',()=>window.open(songCard.dataset.url,'_blank','noopener'));
}

// View counter animated roll-up
const vcEl=document.getElementById('views-count');
if(vcEl&&!RM){
  const target=parseInt(vcEl.dataset.val,10)||0;
  if(target>0){
    let cur=0;const dur=1200,start=performance.now();
    const ease=(t)=>t<0.5?2*t*t:1-Math.pow(-2*t+2,2)/2;
    const frame=(now)=>{const p=Math.min(1,(now-start)/dur),val=Math.round(ease(p)*target);vcEl.textContent=val.toLocaleString('es')+' visitas';if(p<1)requestAnimationFrame(frame);}
    requestAnimationFrame(frame);
  }
}

// Global Smart Tooltip Handler
const ttPortal=document.getElementById('gl-tooltip'), ttT=document.getElementById('tt-title'), ttD=document.getElementById('tt-desc');
const badgeDialog=document.getElementById('badge-dialog'), badgeDialogTitle=document.getElementById('badge-dialog-title'), badgeDialogDesc=document.getElementById('badge-dialog-desc');
badgeDialog?.querySelector('.badge-close')?.addEventListener('click',()=>badgeDialog.close());
if(ttPortal){
  document.querySelectorAll('[data-tt-title]').forEach(el=>{
    const show=()=>{
      const rect=el.getBoundingClientRect();
      ttT.textContent=el.dataset.ttTitle||'';
      ttD.textContent=el.dataset.ttDesc||'';
      ttPortal.dataset.verified=el.classList.contains('verified-wrapper')?'true':'false';
      ttPortal.style.left=(rect.left+rect.width/2)+'px';
      ttPortal.style.top=rect.top+'px';
      ttPortal.classList.add('visible');
      ttPortal.setAttribute('aria-hidden','false');
    };
    const hide=()=>{ ttPortal.classList.remove('visible'); ttPortal.setAttribute('aria-hidden','true'); };
    el.addEventListener('mouseenter', show);
    el.addEventListener('mouseleave', hide);
    el.addEventListener('focus', show);
    el.addEventListener('blur', hide);
    el.addEventListener('click', e=>{e.stopPropagation();show();if(badgeDialog&&el.classList.contains('badge-item')){badgeDialogTitle.textContent=el.dataset.ttTitle||'';badgeDialogDesc.textContent=el.dataset.ttDesc||'';badgeDialog.showModal();}});
  });
  document.addEventListener('click',()=>{ttPortal.classList.remove('visible');ttPortal.setAttribute('aria-hidden','true');},{passive:true});
}

// ── Progreso en vivo (Spotify y actividad) ───────────────────────────────
const spCard=document.getElementById('gl-spotify'), spFill=document.getElementById('sp-fill'), spCur=document.getElementById('sp-cur'), spTot=document.getElementById('sp-tot'), spState=document.getElementById('sp-state'), spCover=document.getElementById('sp-cover'), spImgEl=document.getElementById('sp-img'), spAmb=document.getElementById('sp-ambient');
const fmtT=(ms)=>{const t=Math.floor(ms/1000),m=Math.floor(t/60),r=t%60;return m+':'+(r<10?'0':'')+r;};
const okImg=(u)=>typeof u==='string'&&u.indexOf('https://')===0&&u.length<600;
const cssUrl=(u)=>encodeURI(u).split("'").join('%27').split('(').join('%28').split(')').join('%29');
const setText=(el,t)=>{if(el&&el.textContent!==t)el.textContent=t;};
let _lastPct=0;
function updateSpotifyProgress(){
  if(!spCard||!SP||!SP.timestamps||!SP.timestamps.start||!SP.timestamps.end)return;
  const now=Date.now(), start=+SP.timestamps.start, end=+SP.timestamps.end;
  const total=Math.max(1,end-start), cur=Math.min(total,Math.max(0,now-start)), pct=cur/total*100;
  const stale=now>end+10000, st=stale?'syncing':'playing';
  if(spCard.dataset.state!==st)spCard.dataset.state=st;
  setText(spState,stale?'Sincronizando…':'Escuchando en Spotify');
  setText(spCur,fmtT(cur)); setText(spTot,fmtT(total));
  if(spFill){
    if(pct<_lastPct-1)spFill.style.transition='none'; else if(spFill.style.transition)spFill.style.transition='';
    spFill.style.width=pct.toFixed(2)+'%';
  }
  _lastPct=pct;
}
function updateActivityProgress(){
  if(!ACT||!ACT.timestamps||!ACT.timestamps.start)return;
  const elEl=document.getElementById('act-elapsed'), tmEl=document.getElementById('act-time');
  if(!elEl)return;
  const sec=Math.max(0,Math.floor((Date.now()-ACT.timestamps.start)/1000)), m=Math.floor(sec/60), s=sec%60;
  setText(elEl,m+':'+(s<10?'0':'')+s);
  if(tmEl)tmEl.style.display='block';
}
// Un solo temporizador; se detiene mientras la pestaña está oculta.
function tickLive(){ if(document.hidden)return; updateSpotifyProgress(); updateActivityProgress(); }
setInterval(tickLive,1000); tickLive();

// Abrir la canción (clic o teclado)
function openTrack(){
  const id=spCard&&spCard.dataset.sync;
  if(id&&/^[A-Za-z0-9]{22}$/.test(id))window.open('https://open.spotify.com/track/'+id,'_blank','noopener');
}
if(spCard){
  spCard.addEventListener('click',openTrack);
  spCard.addEventListener('keydown',(e)=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();openTrack();}});
}
if(spImgEl)spImgEl.addEventListener('error',()=>{spImgEl.hidden=true;if(spCover)spCover.dataset.has='0';if(spAmb)spAmb.style.backgroundImage='';});

// Aplica una lectura de presencia (desde el servidor o desde el panel en la vista previa)
function applyPresence(p){
  if(!p)return;
  const live=Boolean((p.spotify&&p.spotify.title)||(p.activity&&p.activity.name));
  const dcCard=document.getElementById('gl-dc');
  if(dcCard)dcCard.style.display=live?'none':'flex';
  const dot=document.querySelector('.dc-dot'); if(dot&&p.status)dot.className='dc-dot '+p.status;
  const stEl0=document.querySelector('.av-status'); if(stEl0&&p.status)stEl0.className='av-status '+p.status;
  const dcSt=document.getElementById('dc-status'); if(dcSt&&p.status)dcSt.className='gl-dc-status '+p.status;
  setText(document.getElementById('dc-sub'),(p.activity&&p.activity.name)?((p.activity.type===1||p.activity.type==='Streaming'?'transmitiendo ':'jugando a ')+p.activity.name):(p.spotify&&p.spotify.title)?('escuchando '+p.spotify.title):'no está haciendo nada');

  if(p.spotify&&p.spotify.title){
    SP=p.spotify;
    if(spCard){
      spCard.style.display='block';
      const img=okImg(SP.image)?SP.image:'', artist=(SP.artist||'Spotify')+(SP.artist&&SP.album?' · '+SP.album:'');
      const tEl=document.getElementById('sp-title'), aEl=document.getElementById('sp-artist');
      if(tEl){setText(tEl,SP.title);tEl.title=SP.title;}
      if(aEl){setText(aEl,artist);aEl.title=artist;}
      if(spImgEl){
        if(img){ if(spImgEl.getAttribute('src')!==img)spImgEl.src=img; spImgEl.hidden=false; if(spCover)spCover.dataset.has='1'; }
        else { spImgEl.hidden=true; if(spCover)spCover.dataset.has='0'; }
      }
      if(spAmb){const bg=img?'url('+cssUrl(img)+')':''; if(spAmb.dataset.bg!==bg){spAmb.dataset.bg=bg;spAmb.style.backgroundImage=bg;}}
      if(/^[A-Za-z0-9]{22}$/.test(SP.syncId||''))spCard.dataset.sync=SP.syncId; else delete spCard.dataset.sync;
      spCard.setAttribute('aria-label','Escuchando '+SP.title+(SP.artist?' de '+SP.artist:'')+' en Spotify');
      updateSpotifyProgress();
    }
  } else {
    SP=null;
    if(spCard)spCard.style.display='none';
  }

  const actCard=document.getElementById('gl-activity');
  if(p.activity&&p.activity.name){
    ACT=p.activity;
    if(actCard){
      const isStr=p.activity.type===1||p.activity.type==='Streaming';
      actCard.dataset.streaming=isStr?'1':'0';
      actCard.style.display='block';
      const tEl=document.getElementById('act-title'), lblEl=document.getElementById('act-type-lbl'), detEl=document.getElementById('act-details'), stEl=document.getElementById('act-state'), imgEl=document.getElementById('act-img'), fbEl=document.getElementById('act-img-fallback'), smImgEl=document.getElementById('act-small-img'), lnkEl=document.getElementById('act-stream-link'), tmEl=document.getElementById('act-time'), elEl=document.getElementById('act-elapsed');
      if(tEl)tEl.textContent=p.activity.name;
      if(lblEl)lblEl.textContent=p.activity.typeLabel||(isStr?'Transmitiendo':'Jugando a');
      if(detEl){
        if(p.activity.details){detEl.textContent=p.activity.details;detEl.style.display='block';}else detEl.style.display='none';
      }
      if(stEl){
        if(p.activity.state){stEl.textContent=p.activity.state;stEl.style.display='block';}else stEl.style.display='none';
      }
      if(imgEl&&okImg(p.activity.largeImage)){
        if(imgEl.getAttribute('src')!==p.activity.largeImage)imgEl.src=p.activity.largeImage;
        imgEl.style.display='block';
        if(fbEl)fbEl.style.display='none';
      } else if(fbEl){
        fbEl.style.display='grid';
        if(imgEl)imgEl.style.display='none';
      }
      if(smImgEl){
        if(okImg(p.activity.smallImage)){smImgEl.src=p.activity.smallImage;smImgEl.style.display='block';}else smImgEl.style.display='none';
      }
      if(lnkEl){
        if(p.activity.url&&p.activity.url.indexOf('https://')===0){lnkEl.href=p.activity.url;lnkEl.style.display='inline-flex';}else lnkEl.style.display='none';
      }
      if(tmEl&&elEl&&p.activity.timestamps&&p.activity.timestamps.start){
        updateActivityProgress();
        tmEl.style.display='block';
      } else if(tmEl){
        tmEl.style.display='none';
      }
    }
  } else {
    ACT=null;
    if(actCard)actCard.style.display='none';
  }
}

// Sondeo de presencia: nunca solapado, más lento si no hay nada en vivo, con espera creciente
// si falla y detenido mientras la pestaña está oculta. En la vista previa el panel envía los datos.
let _pBusy=false,_pFail=0,_pT=0;
function _pDelay(){const live=Boolean((SP&&SP.title)||(ACT&&ACT.name));return Math.min(30000,(live?2500:6000)*Math.pow(2,Math.min(_pFail,3)));}
function schedulePoll(){clearTimeout(_pT);if(document.hidden)return;_pT=setTimeout(pollPresence,_pDelay());}
async function pollPresence(){
  if(_pBusy||document.hidden)return;
  _pBusy=true;
  const ac=new AbortController(), to=setTimeout(()=>ac.abort(),6000);
  try{
    const res=await fetch('/api/presence/'+encodeURIComponent(${jsonJs(username)}),{cache:'no-store',signal:ac.signal});
    if(!res.ok)throw new Error('presence');
    applyPresence((await res.json()).presence);
    _pFail=0;
  }catch(e){_pFail++;}
  finally{clearTimeout(to);_pBusy=false;schedulePoll();}
}
${preview
  ? "window.addEventListener('message',(e)=>{if(e.source!==window.parent)return;const d=e.data;if(d&&d.type==='pip:presence')applyPresence(d.presence);});"
  : "pollPresence();document.addEventListener('visibilitychange',()=>{if(!document.hidden){tickLive();pollPresence();}else clearTimeout(_pT);});window.addEventListener('online',pollPresence);"}

// Volume control state & UI (default 50% for balanced volume)
let _volCur = 0.5;
function _updateVolUI(pct){
  const vt=document.getElementById('vol-track'),vi=document.getElementById('vol-icon');
  if(vt){
    vt.style.setProperty('--vp',pct+'%');
    vt.setAttribute('aria-valuenow',Math.round(pct));
  }
  const muted=pct===0;
  if(vi){
    vi.innerHTML=muted
      ? '<path d="M11 5 6 9H2v6h4l5 4V5z"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/>'
      : pct<40
        ? '<path d="M11 5 6 9H2v6h4l5 4V5z"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>'
        : '<path d="M11 5 6 9H2v6h4l5 4V5z"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07M19.07 4.93a10 10 0 0 1 0 14.14"/>';
  }
}

const sp=document.getElementById('sp');const bgv=document.getElementById('bgv');
if(bgv){
  // El perfil solicita audio desde el primer frame. Algunos navegadores pueden
  // bloquear autoplay con sonido; en ese caso no se fuerza mute silencioso.
  bgv.muted = false;
  bgv.volume = _volCur;
  _updateVolUI(50);

  const tryPlay = () => {
    bgv.muted = false;
    bgv.volume = _volCur;
    const p = bgv.play();
    if(p && p.catch){
      p.catch(() => {});
    }
  };

  tryPlay();
  if(bgv.readyState < 3){
    bgv.addEventListener('loadeddata', tryPlay, { once: true });
    bgv.addEventListener('canplay', tryPlay, { once: true });
  }

  const _forceUnmute = () => {
    bgv.muted = false;
    bgv.volume = _volCur;
    bgv.play && bgv.play().catch(() => {});
    _updateVolUI(Math.round(_volCur * 100));
  };
  ['pointerdown', 'mousedown', 'touchstart', 'keydown', 'wheel', 'click', 'focus'].forEach(evt => {
    window.addEventListener(evt, _forceUnmute, { once: true, passive: true, capture: true });
  });
}
if(sp){sp.addEventListener('click',()=>{sp.classList.add('go');if(bgv){bgv.muted=false;bgv.volume=_volCur;bgv.play&&bgv.play().catch(()=>{});}else{document.querySelectorAll('video').forEach(v=>{if(v.muted)v.muted=false;v.play&&v.play().catch(()=>{})});}});}

const volTrack=document.getElementById('vol-track'),volBtn=document.getElementById('vol-btn'),volWrap=document.getElementById('vol-wrap');
if(volTrack){
  _updateVolUI(50);
  let isDragging=false;
  const setVolFromEvent=(e)=>{
    const rect=volTrack.getBoundingClientRect();
    const clientY=e.clientY??(e.touches&&e.touches[0]?e.touches[0].clientY:0);
    const offset=rect.bottom-clientY;
    const pct=Math.max(0,Math.min(100,Math.round((offset/rect.height)*100)));
    _volCur=pct/100;
    if(bgv){
      bgv.muted=(pct===0);
      bgv.volume=_volCur;
      bgv.play&&bgv.play().catch(()=>{});
    }
    _updateVolUI(pct);
  };
  volTrack.addEventListener('pointerdown',e=>{
    isDragging=true;
    if(volWrap)volWrap.classList.add('is-active');
    volTrack.setPointerCapture(e.pointerId);
    setVolFromEvent(e);
  });
  volTrack.addEventListener('pointermove',e=>{
    if(isDragging)setVolFromEvent(e);
  });
  const stopDrag=(e)=>{
    if(isDragging){
      isDragging=false;
      if(volWrap)volWrap.classList.remove('is-active');
      try{volTrack.releasePointerCapture(e.pointerId);}catch(err){}
    }
  };
  volTrack.addEventListener('pointerup',stopDrag);
  volTrack.addEventListener('pointercancel',stopDrag);
  volTrack.addEventListener('keydown',e=>{
    let step=0;
    if(e.key==='ArrowUp'||e.key==='ArrowRight')step=5;
    else if(e.key==='ArrowDown'||e.key==='ArrowLeft')step=-5;
    if(step!==0){
      e.preventDefault();
      const nextPct=Math.max(0,Math.min(100,Math.round(_volCur*100)+step));
      _volCur=nextPct/100;
      if(bgv){bgv.muted=(nextPct===0);bgv.volume=_volCur;}
      _updateVolUI(nextPct);
    }
  });
}
if(volBtn){
  volBtn.addEventListener('click',(e)=>{
    e.stopPropagation();
    if(bgv){
      bgv.muted=!bgv.muted;
      if(!bgv.muted){
        if(_volCur===0)_volCur=0.5;
        bgv.volume=_volCur;
        bgv.play&&bgv.play().catch(()=>{});
      }
      _updateVolUI(bgv.muted?0:Math.round(_volCur*100));
    }
  });
}
const _hasVideo=!!document.getElementById('bgv');
 const cv=document.getElementById('c');if(cv){const c=cv.getContext('2d',{alpha:true,desynchronized:true});let w,h,P=[],m={x:-999,y:-999},_lastP=0;
 function size(){w=cv.width=innerWidth;h=cv.height=innerHeight;
  const base=CFG.pt==='dots'?35:CFG.pt==='snow'?30:CFG.pt==='matrix'?45:CFG.pt==='fireflies'?24:CFG.pt==='sakura'?26:CFG.pt==='bubbles'?22:CFG.pt==='embers'?34:CFG.pt==='rain'?70:CFG.pt==='galaxy'?70:CFG.pt==='confetti'?44:40;
  const n=_hasVideo?Math.floor(base*0.5):base;
  P=Array.from({length:n},()=>({
    x:Math.random()*w,
    y:Math.random()*h,
    vx:CFG.pt==='fireflies'?(Math.random()-.5)*0.8:(Math.random()-.5)*.3,
    vy:CFG.pt==='sakura'?Math.random()*.7+.35:CFG.pt==='bubbles'?-(Math.random()*.5+.2):CFG.pt==='embers'?-(Math.random()*.9+.4):CFG.pt==='snow'?Math.random()*.8+.3:CFG.pt==='matrix'?Math.random()*3+2:CFG.pt==='fireflies'?(Math.random()-.5)*0.8:(Math.random()-.5)*.3,
    r:CFG.pt==='sakura'?Math.random()*3+3.5:CFG.pt==='bubbles'?Math.random()*7+3:CFG.pt==='embers'?Math.random()*1.6+.8:CFG.pt==='fireflies'?Math.random()*2.2+1.5:Math.random()*1.4+.5,
    t:Math.random()*6,
    char:String.fromCharCode(0x30A0 + Math.floor(Math.random()*96))
  }));
  if(CFG.pt==='rain')P.forEach(p=>{p.vy=Math.random()*9+10;p.vx=-1.6;p.len=Math.random()*14+10});
  if(CFG.pt==='galaxy')P.forEach(p=>{p.r=Math.random()*1.8+.6;p.vx=(Math.random()-.5)*.35;p.vy=(Math.random()-.5)*.35});
  if(CFG.pt==='confetti')P.forEach(p=>{p.vy=Math.random()*1.4+.9;p.w=Math.random()*6+4;p.hue=Math.floor(Math.random()*360);p.rot=Math.random()*6})}
 addEventListener('pointermove',e=>{m.x=e.clientX;m.y=e.clientY},{passive:true});addEventListener('resize',size,{passive:true});size();
 function d(now){
  const minGap=_hasVideo?50:30;
  if(now-_lastP<minGap){if(!RM)requestAnimationFrame(d);return;}
  _lastP=now;
  c.clearRect(0,0,w,h);c.fillStyle=col;c.strokeStyle=col;for(let i=0;i<P.length;i++){const p=P[i];
  if(CFG.pt==='rain'){p.y+=p.vy;p.x+=p.vx;if(p.y>h+20){p.y=-20;p.x=Math.random()*(w+80)}c.globalAlpha=.32;c.lineWidth=1;c.beginPath();c.moveTo(p.x,p.y);c.lineTo(p.x-p.vx*2,p.y-p.len);c.stroke();continue}
  if(CFG.pt==='galaxy'){p.x+=p.vx;p.y+=p.vy;if(p.x<-5)p.x=w+5;else if(p.x>w+5)p.x=-5;if(p.y<-5)p.y=h+5;else if(p.y>h+5)p.y=-5;c.globalAlpha=.25+.75*Math.abs(Math.sin(p.t+now/1100));c.shadowColor=col;c.shadowBlur=8;c.beginPath();c.arc(p.x,p.y,p.r,0,7);c.fill();c.shadowBlur=0;continue}
  if(CFG.pt==='confetti'){p.y+=p.vy;p.x+=Math.sin(p.t+now/800)*.8;p.rot+=.05;if(p.y>h+10){p.y=-10;p.x=Math.random()*w}c.save();c.translate(p.x,p.y);c.rotate(p.rot);c.globalAlpha=.85;c.fillStyle='hsl('+p.hue+',85%,62%)';c.fillRect(-p.w/2,-p.w/4,p.w,p.w/2);c.restore();continue}
  if(CFG.pt==='matrix'){
    p.y+=p.vy;if(p.y>h){p.y=-10;p.x=Math.random()*w;p.char=String.fromCharCode(0x30A0 + Math.floor(Math.random()*96));}
    c.font='13px monospace';c.fillStyle=col;c.globalAlpha=0.75;c.fillText(p.char,p.x,p.y);continue;
  }
  if(CFG.pt==='fireflies'){
    p.x+=p.vx+Math.sin(p.t+now/1200)*0.5;p.y+=p.vy+Math.cos(p.t+now/1200)*0.5;
    if(p.x<0)p.x=w;if(p.x>w)p.x=0;if(p.y<0)p.y=h;if(p.y>h)p.y=0;
    c.globalAlpha=0.3+0.7*Math.abs(Math.sin(p.t+now/700));
    c.beginPath();c.arc(p.x,p.y,p.r,0,7);c.fill();continue;
  }
  if(CFG.pt==='sakura'){p.y+=p.vy;p.x+=Math.sin(p.t+now/1300)*.6;p.t+=.004;if(p.y>h+10){p.y=-10;p.x=Math.random()*w}c.save();c.translate(p.x,p.y);c.rotate(p.t*3+now/2400);c.globalAlpha=.8;c.fillStyle='#ffb7d5';c.beginPath();c.ellipse(0,0,p.r,p.r*.55,0,0,7);c.fill();c.restore();continue}
  if(CFG.pt==='bubbles'){p.y+=p.vy;p.x+=Math.sin(p.t+now/1500)*.35;if(p.y<-p.r*2){p.y=h+p.r*2;p.x=Math.random()*w}c.globalAlpha=.4;c.lineWidth=1.2;c.beginPath();c.arc(p.x,p.y,p.r,0,7);c.stroke();c.globalAlpha=.18;c.beginPath();c.arc(p.x-p.r*.3,p.y-p.r*.3,p.r*.25,0,7);c.fill();continue}
  if(CFG.pt==='embers'){p.y+=p.vy;p.x+=Math.sin(p.t+now/700)*.5;if(p.y<-8){p.y=h+8;p.x=Math.random()*w}c.fillStyle=Math.sin(p.t+now/500)>0?'#ff9a3c':'#ffd27a';c.shadowColor='#ff7a1a';c.shadowBlur=8;c.globalAlpha=.55+.45*Math.abs(Math.sin(p.t+now/600));c.beginPath();c.arc(p.x,p.y,p.r,0,7);c.fill();c.shadowBlur=0;continue}
  if(CFG.pt==='snow'){p.y+=p.vy;p.x+=Math.sin(p.t+now/1500)*.3;if(p.y>h){p.y=-5;p.x=Math.random()*w}c.globalAlpha=.7;c.beginPath();c.arc(p.x,p.y,p.r+.4,0,7);c.fill();continue}
  if(CFG.pt==='stars'){c.globalAlpha=.25+.75*Math.abs(Math.sin(p.t+now/900));c.beginPath();c.arc(p.x,p.y,p.r,0,7);c.fill();continue}
  p.x+=p.vx;p.y+=p.vy;if(p.x<0||p.x>w)p.vx*=-1;if(p.y<0||p.y>h)p.vy*=-1;c.globalAlpha=.8;c.beginPath();c.arc(p.x,p.y,p.r,0,7);c.fill()}
  if(!RM)requestAnimationFrame(d)}requestAnimationFrame(d)}
const tc=document.getElementById('t');if(tc&&!RM){const c=tc.getContext('2d');let w,h,T=[],_lastT=0,lastX,lastY;const size=()=>{const d=Math.min(devicePixelRatio||1,2);w=innerWidth;h=innerHeight;tc.width=Math.round(w*d);tc.height=Math.round(h*d);c.setTransform(d,0,0,d,0,0)};size();addEventListener('resize',size,{passive:true});
 addEventListener('pointermove',e=>{if(e.pointerType&&e.pointerType!=='mouse')return;const dx=lastX==null?0:e.clientX-lastX,dy=lastY==null?0:e.clientY-lastY,steps=Math.min(4,Math.max(1,Math.ceil(Math.hypot(dx,dy)/18)));for(let j=1;j<=steps;j++){const x=lastX==null?e.clientX:lastX+dx*j/steps,y=lastY==null?e.clientY:lastY+dy*j/steps;T.push({x,y,vx:(Math.random()-.5)*2,vy:(Math.random()-.5)*2+(CFG.tr==='glow'?0:.3),l:1,r:Math.random()*3+(CFG.tr==='glow'?6:2)})}lastX=e.clientX;lastY=e.clientY;if(T.length>90)T.splice(0,T.length-90)},{passive:true});
 (function f(now){if(now-_lastT<16){requestAnimationFrame(f);return;}_lastT=now;c.clearRect(0,0,w,h);c.fillStyle=CFG.tc;c.font='14px sans-serif';for(let i=0;i<T.length;i++){const p=T[i];p.x+=p.vx;p.y+=p.vy;p.l-=.03;c.globalAlpha=Math.max(0,p.l)*(CFG.tr==='glow'?.35:.9);if(CFG.tr==='stars'){const R=p.r*2.2*Math.max(.3,p.l);c.beginPath();for(let k=0;k<8;k++){const q=k%2?R*.4:R,t=k*Math.PI/4;c.lineTo(p.x+Math.cos(t)*q,p.y+Math.sin(t)*q)}c.closePath();c.fill()}else{c.beginPath();c.arc(p.x,p.y,p.r*Math.max(.2,p.l),0,7);c.fill()}}T=T.filter(p=>p.l>0);requestAnimationFrame(f)})(0)}
let ac;function snd(t){try{ac=ac||new AudioContext();const o=ac.createOscillator(),g=ac.createGain();o.connect(g);g.connect(ac.destination);const n=ac.currentTime;
 if(t==='pop'){o.frequency.setValueAtTime(620,n);o.frequency.exponentialRampToValueAtTime(180,n+.09);g.gain.setValueAtTime(.18,n);g.gain.exponentialRampToValueAtTime(.001,n+.1);o.start(n);o.stop(n+.11)}
 else if(t==='tick'){o.type='square';o.frequency.value=1500;g.gain.setValueAtTime(.05,n);g.gain.exponentialRampToValueAtTime(.001,n+.03);o.start(n);o.stop(n+.04)}
 else{o.frequency.setValueAtTime(880,n);o.frequency.setValueAtTime(1320,n+.09);g.gain.setValueAtTime(.12,n);g.gain.exponentialRampToValueAtTime(.001,n+.4);o.start(n);o.stop(n+.42)}}catch(e){}}
if(CFG.sn!=='none')addEventListener('pointerdown',()=>snd(CFG.sn));
const k=document.getElementById('card'),st=k.parentElement;
let _tx=0,_ty=0,_stx=0,_sty=0,_tiltRaf=false;
/* La inclinación global hacía que la tarjeta se moviese debajo del puntero y
   volvía imposible acertar enlaces/insignias. Se mantiene la opción guardada,
   pero se omite el transform inestable para priorizar interacción fiable. */
if(false && CFG.tilt&&!RM){
  /* High-fidelity smooth lerp-based 3D tilt with depth */
  const lerp=(a,b,t)=>a+(b-a)*t;
  const tiltLoop=()=>{
    _stx=lerp(_stx,_tx,0.09); _sty=lerp(_sty,_ty,0.09);
    k.style.transform='perspective(1200px) rotateY('+(_stx*18).toFixed(3)+'deg) rotateX('+(-_sty*14).toFixed(3)+'deg) scale3d(1.018,1.018,1)';
    const d=Math.abs(_stx-_tx)+Math.abs(_sty-_ty);
    if(d>0.0003) requestAnimationFrame(tiltLoop); else _tiltRaf=false;
  };
  window.addEventListener('pointermove',e=>{
    _tx=(e.clientX/innerWidth)-.5; _ty=(e.clientY/innerHeight)-.5;
    if(!_tiltRaf){_tiltRaf=true;requestAnimationFrame(tiltLoop);}
  },{passive:true});
  document.addEventListener('pointerleave',()=>{
    _tx=0;_ty=0;
    if(!_tiltRaf){_tiltRaf=true;requestAnimationFrame(tiltLoop);}
  },{passive:true});
}

const clk=document.getElementById('clk');if(clk){const f=()=>{try{clk.textContent=new Intl.DateTimeFormat('es',{hour:'2-digit',minute:'2-digit',timeZone:CFG.tz}).format(new Date())}catch(e){clk.textContent='--:--'}};f();setInterval(f,15000)}
const cdn=document.getElementById('cdn');if(cdn&&CFG.cd){const n=Math.round((new Date(CFG.cd+'T00:00:00')-new Date(new Date().toDateString()))/864e5);cdn.textContent=n>1?'Faltan '+n+' días':n===1?'Mañana':n===0?'¡Hoy!':'Hace '+(-n)+(n===-1?' día':' días')}
const shr=document.getElementById('shr');if(shr)shr.addEventListener('click',async()=>{const u=location.href.startsWith('http')?location.href:'';try{if(navigator.share&&u){await navigator.share({title:CFG.title,url:u})}else{await navigator.clipboard.writeText(u||CFG.title);toast('Enlace copiado')}}catch(e){toast(u?'No se pudo compartir':'Disponible en tu perfil público')}});
if(CFG.cf&&CFG.cf!=='none'&&!RM){const cv2=document.createElement('canvas');cv2.style.cssText='position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:7';document.body.append(cv2);const c=cv2.getContext('2d');let w,h,F=[],run=false;const sz=()=>{w=cv2.width=innerWidth;h=cv2.height=innerHeight};sz();addEventListener('resize',sz);
 addEventListener('pointerdown',e=>{if(CFG.cf==='ripple')F.push({x:e.clientX,y:e.clientY,r:4,l:1,t:'r'});else for(let i=0;i<16;i++){const a=Math.PI*2*i/16+Math.random()*.4,v=2+Math.random()*3;F.push({x:e.clientX,y:e.clientY,vx:Math.cos(a)*v,vy:Math.sin(a)*v,l:1,t:'b'})}if(!run){run=true;requestAnimationFrame(L)}});
 function L(){c.clearRect(0,0,w,h);c.strokeStyle=c.fillStyle=col;for(const p of F){if(p.t==='r'){p.r+=3.2;p.l-=.028;c.globalAlpha=Math.max(0,p.l)*.7;c.lineWidth=2;c.beginPath();c.arc(p.x,p.y,p.r,0,7);c.stroke()}else{p.x+=p.vx;p.y+=p.vy;p.vx*=.95;p.vy=p.vy*.95+.06;p.l-=.025;c.globalAlpha=Math.max(0,p.l);c.beginPath();c.arc(p.x,p.y,2.2*Math.max(.3,p.l),0,7);c.fill()}}F=F.filter(p=>p.l>0);if(F.length)requestAnimationFrame(L);else{run=false;c.clearRect(0,0,w,h)}}}
if(CFG.ta&&!RM){let i=0,dir=1;setInterval(()=>{i+=dir;document.title=CFG.title.slice(0,i)||'·';if(i>=CFG.title.length+6)dir=-1;if(i<=0)dir=1},180)}})();
</script><script>(()=>{if(matchMedia('(prefers-reduced-motion:reduce)').matches)return;const d=document.documentElement,k=document.getElementById('card'),sp=document.querySelector('.fx.spotlight'),gl=document.querySelector('.card-glare');if(!sp&&!gl)return;let f=0,ex=0,ey=0;addEventListener('pointermove',e=>{ex=e.clientX;ey=e.clientY;if(f)return;f=requestAnimationFrame(()=>{f=0;if(sp){d.style.setProperty('--mx',ex+'px');d.style.setProperty('--my',ey+'px')}if(gl&&k){const r=k.getBoundingClientRect();k.style.setProperty('--gx',(ex-r.left)+'px');k.style.setProperty('--gy',(ey-r.top)+'px')}})},{passive:true})})()</script></body></html>`;
}
