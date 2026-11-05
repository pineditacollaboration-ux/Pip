import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import cookieParser from 'cookie-parser';
import { recordProfileVisit } from '../src/visits.js';
import { createQueries } from '../src/supabase-queries.js';

function fixture() {
  const entries = new Set(); const counts = { views: 0, hours: 0 };
  const q = {
    session: async () => ({ id: 1 }),
    async addVisitor(id, hash, day) { const key = `${id}:${hash}:${day}`; if (entries.has(key)) return false; entries.add(key); return true; },
    async addView() { counts.views++; }, async addHour() { counts.hours++; },
  };
  return { q, counts };
}
const req = (cookie = 'a'.repeat(64)) => ({ method: 'GET', cookies: { pip_visitor: cookie } });
const res = { cookie() {} };
const date = d => ({ now: new Date(d + 'T12:00:00Z') });

test('refreshes and concurrent requests count once per browser and day', async () => {
  const { q, counts } = fixture();
  await Promise.all(Array.from({ length: 15 }, () => recordProfileVisit(req(), res, { id: 1 }, q, date('2026-10-29'))));
  assert.deepEqual(counts, { views: 1, hours: 1 });
  await recordProfileVisit(req(), res, { id: 1 }, q, date('2026-10-30'));
  assert.equal(counts.views, 2);
});
test('different browsers and profiles are counted independently', async () => {
  const { q, counts } = fixture();
  await recordProfileVisit(req(), res, { id: 1 }, q);
  await recordProfileVisit(req('b'.repeat(64)), res, { id: 1 }, q);
  await recordProfileVisit(req(), res, { id: 2 }, q);
  assert.equal(counts.views, 3);
});
test('owner, HEAD and preview traffic do not count', async () => {
  const { q, counts } = fixture();
  await recordProfileVisit({ method: 'GET', cookies: { pip_session: 'owner' } }, res, { id: '1' }, q);
  await recordProfileVisit({ method: 'HEAD', cookies: {} }, res, { id: 1 }, q);
  await recordProfileVisit({ method: 'POST', cookies: {} }, res, { id: 1 }, q);
  assert.equal(counts.views, 0);
});
test('a signed-in visitor to another profile still counts', async () => {
  const { q, counts } = fixture();
  await recordProfileVisit({ ...req(), cookies: { ...req().cookies, pip_session: 'viewer' } }, res, { id: 2 }, q);
  assert.equal(counts.views, 1);
});
test('HTTP cookie survives reloads and server recreation without a process secret', async t => {
  const { q, counts } = fixture();
  async function start() {
    const app = express(); app.use(cookieParser());
    app.get('/profile', async (request, response) => { await recordProfileVisit(request, response, { id: 1 }, q); response.json(counts); });
    const server = app.listen(0); t.after(() => server.close());
    return { server, url: `http://127.0.0.1:${server.address().port}/profile` };
  }
  const first = await start(); const response = await fetch(first.url);
  const setCookie = response.headers.get('set-cookie');
  assert.match(setCookie, /HttpOnly/); assert.match(setCookie, /SameSite=Lax/);
  const cookie = setCookie.split(';')[0];
  for (let i = 0; i < 3; i++) await fetch(first.url, { headers: { cookie } });
  first.server.close();
  const second = await start(); await fetch(second.url, { headers: { cookie } });
  assert.equal(counts.views, 1);
});
test('duplicate database entries are ignored, real errors propagate', async () => {
  const q = result => createQueries({ from: () => ({ insert: async () => result }) });
  assert.equal(await q({ error: null }).addVisitor(1, 'hash'), true);
  assert.equal(await q({ error: { code: '23505' } }).addVisitor(1, 'hash'), false);
  await assert.rejects(q({ error: new Error('database unavailable') }).addVisitor(1, 'hash'), /database unavailable/);
});