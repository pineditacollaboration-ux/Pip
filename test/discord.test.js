import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createApp } from '../src/app-factory.js';
import { openDb } from '../src/db.js';

// Discord simulado: se prueba NUESTRA lógica del flujo OAuth, no el servidor real de Discord.
const calls = []; let profile = { id: '111', username: 'Pineda_Mighty', global_name: 'Pineda', avatar: 'abc123', banner: 'bnr9', email: 'p@mail.com', avatar_decoration_data: { asset: 'a_deco' } };
const dfetch = async (url, init) => { calls.push([String(url), init]);
  if (String(url).endsWith('/oauth2/token')) return init.body.get('code') === 'bad' ? { ok: false } : { ok: true, json: async () => ({ access_token: 'tok' }) };
  if (String(url).endsWith('/users/@me')) return { ok: true, json: async () => profile };
  throw new Error('url inesperada'); };
const dir = mkdtempSync(join(tmpdir(), 'pip-dc-'));
const server = createApp(openDb(':memory:'), { uploadDir: dir, discord: { clientId: 'cid', clientSecret: 'sec', redirectUri: 'http://x/cb', fetch: dfetch } }).listen(0);
const base = `http://127.0.0.1:${server.address().port}`;
test.after(() => { server.close(); rmSync(dir, { recursive: true, force: true }); });
const get = (p, cookie) => fetch(base + p, { redirect: 'manual', headers: cookie ? { cookie } : {} });
const ck = (r) => (r.headers.getSetCookie?.() ?? []).map((c) => c.split(';')[0]).join('; ');
async function login() {
  const r1 = await get('/auth/discord'); const loc = new URL(r1.headers.get('location')), state = loc.searchParams.get('state');
  assert.equal(r1.status, 302); assert.equal(loc.host, 'discord.com'); assert.equal(loc.searchParams.get('client_id'), 'cid'); assert.equal(loc.searchParams.get('scope'), 'identify email');
  const r2 = await get(`/auth/discord/callback?code=ok&state=${state}`, ck(r1)); return { r2, cookie: ck(r2) };
}
// Usuario nuevo: el callback lleva a /confirm y la cuenta se crea al confirmar el nombre.
async function loginConfirm(username) {
  const { r2, cookie } = await login();
  if (r2.headers.get('location') !== '/confirm') return { r2, cookie };
  const pend = await (await get('/api/pending-reg', cookie)).json();
  const r = await fetch(base + '/api/auth/discord/confirm', { method: 'POST', headers: { 'Content-Type': 'application/json', cookie }, body: JSON.stringify({ username: username ?? pend.suggestedUsername }) });
  assert.equal(r.status, 201); return { r2, cookie: ck(r) };
}

test('config: con Discord activo el login por correo queda cerrado', async () => {
  assert.deepEqual(await (await get('/api/config')).json(), { discord: true, email: false });
  const r = await fetch(base + '/api/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: 'abc', email: 'a@b.co', password: '12345678' }) });
  assert.equal(r.status, 403);
});
test('callback rechaza estado falso o ausente y códigos inválidos', async () => {
  assert.match((await get('/auth/discord/callback?code=ok&state=x')).headers.get('location'), /error=state/);
  const r1 = await get('/auth/discord'), st = new URL(r1.headers.get('location')).searchParams.get('state');
  assert.match((await get(`/auth/discord/callback?code=ok&state=otro`, ck(r1))).headers.get('location'), /error=state/);
  const r3 = await get(`/auth/discord/callback?code=bad&state=${st}`, ck(r1)); assert.equal(r3.status, 302); assert.match(r3.headers.get('location'), /error=discord/);
});
test('primer acceso crea la cuenta, el perfil y usa el avatar de Discord', async () => {
  const { r2, cookie } = await loginConfirm(); assert.equal(r2.status, 302); assert.equal(r2.headers.get('location'), '/confirm');
  const me = await (await get('/api/me', cookie)).json();
  assert.equal(me.user.username, 'pineda_mighty'); assert.equal(me.user.discord.name, 'Pineda'); assert.match(me.profile.avatar, /cdn\.discordapp\.com\/avatars\/111\/abc123\.png/);
  assert.match(me.user.discord.banner, /banners\/111\/bnr9/); assert.equal(me.profile.display_name, 'Pineda');
  assert.ok(me.badges.find((b) => b.id === 'conectado').earned && me.badges.find((b) => b.id === 'veterano').earned);
});
test('segundo acceso reutiliza la misma cuenta y actualiza datos', async () => {
  profile = { ...profile, global_name: 'Pineda 2' }; const { r2, cookie } = await login(); assert.equal(r2.headers.get('location'), '/dashboard');
  const me = await (await get('/api/me', cookie)).json(); assert.equal(me.user.username, 'pineda_mighty'); assert.equal(me.user.discord.name, 'Pineda 2');
});
test('otro usuario con el mismo nombre recibe un nombre libre; admin queda reservado', async () => {
  profile = { id: '222', username: 'Pineda_Mighty', global_name: 'Otro', avatar: null, banner: null, email: 'p@mail.com' };
  const me = await (await get('/api/me', (await loginConfirm()).cookie)).json(); assert.notEqual(me.user.username, 'pineda_mighty'); assert.match(me.user.username, /^pineda_might/); assert.match(me.user.email, /@users\.pip\.invalid$/);
  profile = { id: '333', username: 'admin', global_name: 'A', avatar: null, banner: null }; const m2 = await (await get('/api/me', (await loginConfirm()).cookie)).json(); assert.notEqual(m2.user.username, 'admin');
});
test('usar el banner de Discord, ajustes validados, insignias y borrado de cuenta', async () => {
  profile = { id: '111', username: 'Pineda_Mighty', global_name: 'Pineda', avatar: 'abc123', banner: 'bnr9', email: 'p@mail.com' }; const { cookie } = await loginConfirm();
  const J = (p, m, b) => fetch(base + p, { method: m, headers: { 'Content-Type': 'application/json', cookie }, body: b && JSON.stringify(b) });
  let me = await (await J('/api/discord/use/banner', 'POST', {})).json(); assert.match(me.profile.banner, /banners\/111/);
  assert.equal((await J('/api/discord/use/foo', 'POST', {})).status, 404);
  const put = await J('/api/profile', 'PUT', { display_name: 'P', accent: '#38bdf8', background: 'aurora', settings: { trail: 'sparks', particles_type: 'snow', card_width: 99999, avatar_pos: 'hack', badges_show: true, show_views: true } });
  assert.equal(put.status, 200); me = await put.json(); assert.equal(me.settings.card_width, 640); assert.equal(me.settings.avatar_pos, 'center'); assert.equal(me.settings.trail, 'sparks');
  assert.ok(me.badges.find((b) => b.id === 'brillante').earned && me.badges.find((b) => b.id === 'artista').earned);
  const page = await (await get('/pineda_mighty')).text(); assert.ok(page.includes('Conectado') && page.includes('visitas') && page.includes('"tr":"sparks"'));
  assert.equal((await J('/api/account', 'DELETE', { confirm: 'nadie' })).status, 400);
  assert.equal((await J('/api/account', 'DELETE', { confirm: 'pineda_mighty' })).status, 200);
  assert.equal((await get('/pineda_mighty')).status, 404); assert.equal((await get('/api/me', cookie)).status, 401);
});

test('la cookie de registro pendiente no se puede falsificar', async () => {
  const forged = Buffer.from(JSON.stringify({ discordId: '999', email: 'x@y.co', suggestedUsername: 'hack', displayName: 'h', discordName: 'h' })).toString('base64url');
  for (const c of [`pip_pending_reg=${forged}`, `pip_pending_reg=${forged}.firmafalsa`]) {
    assert.equal((await get('/api/pending-reg', c)).status, 404);
    const r = await fetch(base + '/api/auth/discord/confirm', { method: 'POST', headers: { 'Content-Type': 'application/json', cookie: c }, body: JSON.stringify({ username: 'hacker' }) });
    assert.equal(r.status, 400);
  }
});
test('comprobar nombre libre no cuenta como visita', async () => {
  assert.equal((await (await get('/api/username-available/admin')).json()).available, false);
  assert.equal((await (await get('/api/username-available/nombre_libre')).json()).available, true);
});
