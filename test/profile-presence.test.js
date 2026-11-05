import test from 'node:test';
import assert from 'node:assert/strict';
import { renderProfile } from '../src/profile-page.js';

test('el perfil muestra presencia, Spotify y decoración de Discord', () => {
  const html = renderProfile({
    username: 'pineda', display_name: 'Pineda', bio: '', accent: '#7DD3FC', background: 'aurora',
    links: [], avatar: 'https://cdn.discordapp.com/avatars/111/avatar.png',
    discord: {
      decoration: 'decoration-hash',
      presence: {
        status: 'online',
        activity: { name: 'Minecraft', details: 'En una partida' },
        spotify: { title: 'Song title', artist: 'Artist', album: 'Album', image: 'https://i.scdn.co/image/cover' },
      },
    },
  });

  assert.match(html, /avatar-decoration-presets\/decoration-hash\.png/);
  assert.match(html, /dc-dot online/);
  assert.match(html, /En línea/);
  assert.match(html, /Minecraft · En una partida/);
  assert.match(html, /Song title/);
  assert.match(html, /Artist · Album/);
  assert.match(html, /https:\/\/i\.scdn\.co\/image\/cover/);
});

test('el perfil no inventa estado ni actividad si Discord no está disponible', () => {
  const html = renderProfile({
    username: 'pineda', accent: '#7DD3FC', background: 'aurora', links: [], discord: null,
  });

  const body = html.slice(html.indexOf('</style>'));
  assert.doesNotMatch(body, /class="dc-presence|class="dc-spotify|avatar-decoration-presets/);
});

test('las insignias públicas incluyen metadatos para las tarjetas modernas', () => {
  const html = renderProfile({
    username: 'pineda', accent: '#7DD3FC', background: 'aurora', links: [],
    badges: [{ name: 'Premium', desc: 'Plan activo.', rarity: 'Exclusiva', style: 'fundador', icon: '<path d="M2 2h20v20H2z" />' }],
  });

    assert.match(html, /title="Premium: Plan activo\."/);
  assert.match(html, /class="bdg-rarity">Exclusiva/);
  assert.match(html, /class="bd-grid" role="list"/);
  assert.match(html, /Logros conseguidos/);
    assert.match(html, /\.bdg \{[^}]*width: 48px/);
    assert.match(html, /\.bdg-desc\{display:none\}/);
});
