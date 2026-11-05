import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { JSDOM, VirtualConsole } from 'jsdom';
import { createApp } from '../src/app-factory.js';
import { openDb } from '../src/db.js';

const dir = mkdtempSync(join(tmpdir(), 'pip-ui-'));
const server = createApp(openDb(':memory:'), { uploadDir: dir, devEmail: true }).listen(0);
const base = `http://127.0.0.1:${server.address().port}`;
test.after(() => { server.close(); rmSync(dir, { recursive: true, force: true }); });

test('el panel carga, recorre todas las secciones, edita y guarda sin errores', async () => {
  const reg = await fetch(base + '/api/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: 'pineda', email: 'p@mail.com', password: 'secreta123' }) });
  const cookie = reg.headers.get('set-cookie').split(';')[0];
  await fetch(base + '/api/links', { method: 'POST', headers: { 'Content-Type': 'application/json', cookie }, body: JSON.stringify({ label: 'Instagram', url: 'https://instagram.com/pineda' }) });
  const errors = []; const vc = new VirtualConsole(); vc.on('jsdomError', (e) => { if (!/Could not parse CSS|Not implemented/.test(e.message)) errors.push(e.message); });
  const dom = new JSDOM(readFileSync(new URL('../public/dashboard.html', import.meta.url), 'utf8'), { runScripts: 'dangerously', url: base + '/dashboard', pretendToBeVisual: true, virtualConsole: vc,
    beforeParse(w) { w.fetch = (u, o = {}) => fetch(new URL(u, base), { ...o, headers: { ...(o.headers || {}), cookie } }); w.addEventListener('error', (e) => errors.push(e.message)); } });
  const w = dom.window, $ = (s) => w.document.querySelector(s), wait = (ms = 80) => new Promise((r) => setTimeout(r, ms));
  await wait(400);
  const navs = [...w.document.querySelectorAll('.nv')]; assert.equal(navs.length, 10);
  assert.match($('h1.t').textContent, /Resumen/); assert.ok($('.pr'), 'barra de progreso');
  for (const n of navs) { n.click(); await wait(30); assert.ok($('#view').children.length > 1, 'sección vacía: ' + n.textContent); }
  navs.find((n) => /Efectos/.test(n.textContent)).click(); await wait(30);
  const sw = [...w.document.querySelectorAll('.tg')][1]; const was = sw.getAttribute('aria-checked'); sw.click();
  assert.notEqual(sw.getAttribute('aria-checked'), was); assert.equal($('#save').disabled, false);
  navs.find((n) => /Enlaces/.test(n.textContent)).click(); await wait(30);
  assert.ok(w.document.querySelectorAll('.gr button').length >= 20, 'rejilla de logos'); assert.match($('#view').textContent, /Instagram/);
  await wait(500); assert.ok($('#pv').getAttribute('srcdoc')?.includes('pineda'), 'vista previa renderizada');
  $('#save').click(); await wait(300); assert.equal($('#save').textContent, 'Guardado');
  const me = await (await fetch(base + '/api/me', { headers: { cookie } })).json(); assert.equal(me.settings.avatar_show === true || me.settings.avatar_show === false, true);
  assert.deepEqual(errors, []);
});

test('la vista pública refleja cambios de diseño guardados sin reutilizar HTML en caché', async () => {
  const reg = await fetch(base + '/api/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: 'profina', email: 'profina@mail.com', password: 'secreta123' }) });
  const cookie = reg.headers.get('set-cookie').split(';')[0];
  const warm = await fetch(base + '/profina', { headers: { cookie } });
  assert.equal(warm.status, 200);
  const warmHtml = await warm.text();
  assert.match(warmHtml, /rgba\(10,12,18,0\.12\)/);

  const updated = await fetch(base + '/api/profile', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', cookie },
    body: JSON.stringify({
      display_name: 'Profina',
      bio: 'Bio nueva',
      accent: '#F2F2F2',
      background: 'aurora',
      splash_text: 'Haz clic para entrar',
      settings: {
        card_bg: 0,
        card_glass: 24,
        card_radius: 18,
        card_width: 460,
        card_border: true,
        card_border_w: 1,
        avatar_show: true,
        name_show: true,
        bio_show: true,
        badges_show: false,
        spotify_show: false,
        discord_activity_show: false,
        particles_type: 'none'
      }
    })
  });
  assert.equal(updated.status, 200, 'guardar perfil debe responder OK');
  const refreshed = await fetch(base + '/profina', { headers: { cookie } });
  const refreshedHtml = await refreshed.text();
  assert.match(refreshedHtml, /background:\s*transparent/);
  assert.match(refreshedHtml, /backdrop-filter:blur\(24px\)/);
  assert.doesNotMatch(refreshedHtml, /rgba\(10,12,18,0\.12\)/);
});
