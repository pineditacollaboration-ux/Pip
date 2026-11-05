import { createHash, randomBytes } from 'node:crypto';

const COOKIE = 'pip_visitor';
const hash = value => createHash('sha256').update(value).digest('hex');

// One anonymous browser per profile per UTC day. No raw IP is stored, and
// identity survives process restarts. This is analytics, not an anti-bot identity.
export async function recordProfileVisit(req, res, user, q, { now = new Date() } = {}) {
  if (req.method !== 'GET') return false;
  const session = req.cookies?.pip_session;
  const viewer = session ? await q.session(hash(session)) : null;
  if (viewer && String(viewer.id) === String(user.id)) return false;

  let visitor = req.cookies?.[COOKIE];
  if (!/^[a-f0-9]{64}$/.test(visitor || '')) {
    visitor = randomBytes(32).toString('hex');
    res.cookie(COOKIE, visitor, {
      httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production',
      maxAge: 365 * 864e5, path: '/',
    });
  }
  const day = now.toISOString().slice(0, 10);
  const isNew = await q.addVisitor(user.id, hash(visitor), day);
  if (!isNew) return false;
  await q.addView(user.id, day);
  await q.addHour(user.id, now.getUTCHours());
  return true;
}