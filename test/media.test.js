import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, existsSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createApp } from '../src/app-factory.js';
import { openDb } from '../src/db.js';

const dir = mkdtempSync(join(tmpdir(), 'pip-up-'));
const server = createApp(openDb(':memory:'), { uploadDir: dir, devEmail: true }).listen(0);
const base = `http://127.0.0.1:${server.address().port}`;
test.after(() => { server.close(); rmSync(dir, { recursive: true, force: true }); });
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');
const MP4 = Buffer.concat([Buffer.from([0, 0, 0, 24]), Buffer.from('ftypisom'), Buffer.alloc(40)]);
let cookie;
const J = (p, m = 'GET', b) => fetch(base + p, { method: m, headers: { 'Content-Type': 'application/json', cookie }, body: b && JSON.stringify(b) });
const up = (kind, body, h = { 'x-pip': '1' }) => fetch(`${base}/api/upload/${kind}`, { method: 'POST', headers: { cookie, 'Content-Type': 'application/octet-stream', ...h }, body });

test('preparación: registro', async () => {
  const r = await fetch(base + '/api/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: 'pineda', email: 'p@mail.com', password: 'secreta123' }) });
  cookie = r.headers.get('set-cookie').split(';')[0]; assert.equal(r.status, 201);
});
test('sube un avatar PNG válido y lo sirve', async () => {
  const r = await up('avatar', PNG); assert.equal(r.status, 200);
  const url = (await r.json()).profile.avatar; assert.match(url, /^\/uploads\/1\/avatar-[0-9a-f]+\.png$/);
  const f = await fetch(base + url); assert.equal(f.status, 200); assert.equal(f.headers.get('x-content-type-options'), 'nosniff');
});
test('rechaza archivos falsos, vídeo en avatar, vacíos y sin cabecera CSRF', async () => {
  assert.equal((await up('avatar', Buffer.from('<script>alert(1)</script>'))).status, 400);
  assert.equal((await up('avatar', MP4)).status, 400);
  assert.equal((await up('avatar', Buffer.alloc(0))).status, 400);
  assert.equal((await up('avatar', PNG, {})).status, 415);
  assert.equal((await up('otro', PNG)).status, 404);
  assert.equal((await fetch(`${base}/api/upload/avatar`, { method: 'POST', headers: { 'x-pip': '1' }, body: PNG })).status, 401);
});
test('el vídeo se acepta como fondo y reemplazar borra el anterior', async () => {
  const a = (await (await up('background', MP4)).json()).profile.bg_media; assert.match(a, /\.mp4$/);
  const b = (await (await up('background', PNG)).json()).profile.bg_media;
  assert.notEqual(a, b); assert.equal(existsSync(join(dir, a.replace('/uploads/', ''))), false);
});
test('límite de tamaño del avatar (2 MB)', async () => {
  assert.equal((await up('avatar', Buffer.concat([PNG, Buffer.alloc(2.1e6)]))).status, 413);
});
test('borrar medio, ajustes y vista previa sin guardar', async () => {
  const r = await J('/api/upload/avatar', 'DELETE'); assert.equal((await r.json()).profile.avatar, '');
  assert.equal((await J('/api/profile', 'PUT', { display_name: 'Pineda', accent: '#38bdf8', background: 'grid', bg_blur: 999, bg_opacity: 5, splash: true, splash_text: 'Entra' })).status, 200);
  const me = await (await J('/api/me')).json(); assert.equal(me.profile.bg_blur, 30); assert.equal(me.profile.bg_opacity, 20); assert.equal(me.profile.splash, 1);
  await J('/api/links', 'POST', { label: 'IG', url: 'https://instagram.com/pineda' });
  const html = await (await J('/api/preview', 'POST', { display_name: '<i>X</i>', accent: '#ff0000' })).text();
  assert.ok(html.includes('--a:#ff0000') && html.includes('&lt;i&gt;X&lt;/i&gt;') && html.includes('class="ic"') && !html.includes('class="sp"'));
  assert.equal((await J('/api/profile', 'PUT', { accent: '#ff0000', splash_text: 'x'.repeat(41) })).status, 400);
});
test('visitantes únicos: la misma persona cuenta una vez, y no se guarda la IP', async () => {
  await fetch(base + '/pineda'); await fetch(base + '/pineda'); await fetch(base + '/pineda');
  const s = (await (await J('/api/me')).json()).stats; assert.equal(s.views, 3); assert.equal(s.unique30, 1); assert.equal(s.hours.reduce((a, b) => a + b, 0), 3);
  const html = await (await fetch(base + '/pineda')).text(); assert.ok(html.includes('class="sp"'));
});
