import { randomBytes, createHash } from 'node:crypto';
import { signupSchema, loginSchema } from '../lib/validation.ts';
import { hashPassword, verifyPassword } from './password.mjs';

const SESSION_MS = 7 * 86400000, COOKIE = 'ember_session';
const sha = v => createHash('sha256').update(v).digest('hex');

export function installAuth(db, { secureCookie = false } = {}) {
  db.exec(`CREATE TABLE IF NOT EXISTS users(id TEXT PRIMARY KEY,email TEXT NOT NULL UNIQUE,name TEXT NOT NULL,passHash TEXT NOT NULL,createdAt INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS sessions(tokenHash TEXT PRIMARY KEY,userId TEXT NOT NULL,expiresAt INTEGER NOT NULL);
CREATE INDEX IF NOT EXISTS sessions_user ON sessions(userId);`);
  const attempts = new Map();
  let dummy;
  const cookieOf = req => { for (const part of (req.headers.cookie || '').split(';')) { const [k, ...v] = part.trim().split('='); if (k === COOKIE) return v.join('='); } return null; };
  const setCookie = (res, token, maxAgeS) => res.setHeader('Set-Cookie', `${COOKIE}=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${maxAgeS}${secureCookie ? '; Secure' : ''}`);
  function getSession(req) {
    const t = cookieOf(req); if (!t) return null;
    const row = db.prepare('SELECT u.id,u.name,u.email,s.expiresAt FROM sessions s JOIN users u ON u.id=s.userId WHERE s.tokenHash=?').get(sha(t));
    return row && row.expiresAt >= Date.now() ? { id: row.id, name: row.name, email: row.email } : null;
  }
  function startSession(res, userId) {
    const token = randomBytes(32).toString('hex');
    db.prepare('DELETE FROM sessions WHERE expiresAt<?').run(Date.now());
    db.prepare('INSERT INTO sessions VALUES(?,?,?)').run(sha(token), userId, Date.now() + SESSION_MS);
    setCookie(res, token, SESSION_MS / 1000);
  }
  async function handle(req, res, url, { json, body }) {
    if (!url.pathname.startsWith('/api/auth/')) return false;
    const send = (status, data) => { json(res, status, data); return true; };
    const p = url.pathname.slice('/api/auth/'.length);
    const closed = () => process.env.EMBER_CLOSED_SIGNUP === '1' && db.prepare('SELECT count(*) AS n FROM users').get().n > 0;
    if (p === 'me' && req.method === 'GET') { const user = getSession(req); return user ? send(200, { user, canSignUp: !closed() }) : send(401, { error: 'Not signed in.', canSignUp: !closed() }); }
    if (p === 'signup' && req.method === 'POST') {
      const r = signupSchema.safeParse(await body(req, 2000));
      if (!r.success) return send(400, { error: 'Enter your name, a valid email and a password of at least 10 characters.' });
      if (closed()) return send(403, { error: 'Sign-ups are closed on this installation.' });
      const { name, email, password } = r.data;
      if (db.prepare('SELECT 1 FROM users WHERE email=?').get(email)) return send(409, { error: 'An account with this email already exists. Sign in instead.' });
      const id = crypto.randomUUID();
      try { db.prepare('INSERT INTO users VALUES(?,?,?,?,?)').run(id, email, name, await hashPassword(password), Date.now()); }
      catch { return send(409, { error: 'An account with this email already exists. Sign in instead.' }); }
      startSession(res, id); return send(201, { user: { id, name, email } });
    }
    if (p === 'login' && req.method === 'POST') {
      const r = loginSchema.safeParse(await body(req, 2000));
      if (!r.success) return send(400, { error: 'Enter your email and password.' });
      const key = (req.socket.remoteAddress || '?') + '|' + r.data.email, now = Date.now();
      if (attempts.size > 2000) attempts.clear();
      const hits = (attempts.get(key) || []).filter(t => now - t < 900000);
      if (hits.length >= 5) return send(429, { error: 'Too many attempts. Wait 15 minutes and try again.' });
      const u = db.prepare('SELECT * FROM users WHERE email=?').get(r.data.email);
      dummy ??= await hashPassword('ember-dummy-password'); // equal work whether or not the account exists
      const ok = await verifyPassword(r.data.password, u ? u.passHash : dummy);
      if (!u || !ok) { hits.push(now); attempts.set(key, hits); return send(401, { error: 'Incorrect email or password.' }); }
      attempts.delete(key); startSession(res, u.id); return send(200, { user: { id: u.id, name: u.name, email: u.email } });
    }
    if (p === 'logout' && req.method === 'POST') {
      const t = cookieOf(req); if (t) db.prepare('DELETE FROM sessions WHERE tokenHash=?').run(sha(t));
      setCookie(res, '', 0); return send(200, { ok: true });
    }
    return send(404, { error: 'Endpoint not found.' });
  }
  return { handle, getSession };
}
