import test from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../src/app-factory.js';
import { openDb } from '../src/db.js';

const app = createApp(openDb(':memory:'), { devEmail: true });
const server = app.listen(0); const base = `http://127.0.0.1:${server.address().port}`;
test.after(() => server.close());
const j = (path, method = 'GET', body, cookie) => fetch(base + path, { method, redirect: 'manual', headers: { 'Content-Type': 'application/json', ...(cookie && { cookie }) }, body: body && JSON.stringify(body) });
let cookie;

test('registro valida datos y crea sesión', async () => {
  assert.equal((await j('/api/register', 'POST', { username: 'a', email: 'x@y.com', password: '12345678' })).status, 400);
  assert.equal((await j('/api/register', 'POST', { username: 'admin', email: 'x@y.com', password: '12345678' })).status, 400);
  assert.equal((await j('/api/register', 'POST', { username: 'ana', email: 'ana@mail.com', password: 'corta' })).status, 400);
  const r = await j('/api/register', 'POST', { username: 'ana', email: 'ana@mail.com', password: 'secreta123' });
  assert.equal(r.status, 201); cookie = r.headers.get('set-cookie').split(';')[0];
  assert.equal((await j('/api/register', 'POST', { username: 'ANA', email: 'otro@mail.com', password: 'secreta123' })).status, 409);
});
test('login correcto, incorrecto y sin sesión', async () => {
  assert.equal((await j('/api/login', 'POST', { login: 'ana', password: 'mala' })).status, 401);
  assert.equal((await j('/api/login', 'POST', { login: 'ana@mail.com', password: 'secreta123' })).status, 200);
  assert.equal((await j('/api/me')).status, 401);
  assert.equal((await j('/api/me', 'GET', null, cookie)).status, 200);
});
test('perfil y enlaces, rechazando datos peligrosos', async () => {
  assert.equal((await j('/api/links', 'POST', { label: 'x', url: 'javascript:alert(1)' }, cookie)).status, 400);
  assert.equal((await j('/api/profile', 'PUT', { display_name: 'Ana', bio: 'hola', accent: 'red', background: 'aurora' }, cookie)).status, 400);
  assert.equal((await j('/api/profile', 'PUT', { display_name: '<b>Ana</b>', bio: 'hola', accent: '#38bdf8', background: 'grid' }, cookie)).status, 200);
  const d = await (await j('/api/links', 'POST', { label: 'Mi web', url: 'https://example.com' }, cookie)).json();
  assert.equal(d.links.length, 1);
});
test('página pública escapa HTML, cuenta visitas y clics', async () => {
  const html = await (await j('/ana')).text();
  assert.ok(html.includes('&lt;b&gt;Ana&lt;/b&gt;') && !html.includes('<b>Ana</b>'));
  const id = (await (await j('/api/me', 'GET', null, cookie)).json()).links[0].id;
  const g = await j('/go/' + id); assert.equal(g.status, 302); assert.equal(g.headers.get('location'), 'https://example.com/');
  const me = await (await j('/api/me', 'GET', null, cookie)).json();
  assert.equal(me.stats.views, 1); assert.equal(me.links[0].clicks, 1);
  assert.equal((await j('/noexiste')).status, 404);
});
test('logout invalida la sesión', async () => {
  await j('/api/logout', 'POST', {}, cookie);
  assert.equal((await j('/api/me', 'GET', null, cookie)).status, 401);
});

test('catálogo público de insignias y landing sin errores de servidor', async () => {
  const b = await (await fetch(base + '/api/badges')).json();
  assert.ok(b.length >= 12 && b.every((x) => x.icon && ['celeste', 'plata', 'oro'].includes(x.tier)));
});
