// Sample app for the JMeter course. LOCAL USE ONLY - static credentials, in-memory data.
// Zero dependencies: just `node server.js`.
const http = require('http');
const crypto = require('crypto');

const PORT = process.env.PORT || 3000;
const SESSION_TTL_MS = (process.env.SESSION_TTL_SECONDS || 900) * 1000; // idle timeout
const COOKIE = 'SESSIONID';
const USERS = { admin: 'password123', user1: 'password1', user2: 'password2' };

const sessions = new Map(); // id -> { user, csrf, lastSeen }
let items = [
  { id: 1, name: 'Laptop', price: 1200, stock: 10 },
  { id: 2, name: 'Mouse', price: 25, stock: 100 },
  { id: 3, name: 'Keyboard', price: 70, stock: 50 },
];
let nextId = 4;

const rid = () => crypto.randomBytes(16).toString('hex');
const parseCookies = (h = '') =>
  Object.fromEntries(h.split(';').map((c) => c.trim().split('=')).filter((p) => p[0]).map(([k, ...v]) => [k, v.join('=')]));

function getSession(req) {
  const id = parseCookies(req.headers.cookie)[COOKIE];
  const s = id && sessions.get(id);
  if (!s) return null;
  if (Date.now() - s.lastSeen > SESSION_TTL_MS) { sessions.delete(id); return null; }
  s.lastSeen = Date.now();
  s.id = id;
  return s;
}
function newSession(res, data) {
  const id = rid();
  sessions.set(id, { csrf: rid(), lastSeen: Date.now(), ...data });
  res.setHeader('Set-Cookie', `${COOKIE}=${id}; Path=/; HttpOnly; SameSite=Lax`);
  return sessions.get(id);
}
const clearCookie = (res) => res.setHeader('Set-Cookie', `${COOKIE}=; Path=/; Max-Age=0`);

const send = (res, code, body, type = 'text/html; charset=utf-8', headers = {}) => {
  res.writeHead(code, { 'Content-Type': type, ...headers });
  res.end(body);
};
const json = (res, code, obj) => send(res, code, JSON.stringify(obj), 'application/json');
const readBody = (req) => new Promise((resolve) => {
  let d = '';
  req.on('data', (c) => (d += c));
  req.on('end', () => resolve(d));
});
async function parseBody(req) {
  const raw = await readBody(req);
  const type = req.headers['content-type'] || '';
  try {
    if (type.includes('application/json')) return raw ? JSON.parse(raw) : {};
    return Object.fromEntries(new URLSearchParams(raw));
  } catch { return null; }
}

const page = (title, body) => `<!doctype html><html><head><meta charset="utf-8"><title>${title}</title>
<style>body{font-family:sans-serif;max-width:640px;margin:40px auto}input{margin:4px 0;padding:6px}
table{border-collapse:collapse}td,th{border:1px solid #ccc;padding:4px 10px}.err{color:#b00}</style></head><body>${body}</body></html>`;

const logoutForm = '<form method="POST" action="/logout"><button type="submit">Logout</button></form>';

function loginPage(req, res, err) {
  const cur = getSession(req);
  if (cur && cur.user) { // already logged in: never touch the session
    res.writeHead(302, { Location: '/dashboard' });
    return res.end();
  }
  const s = cur || newSession(res, {}); // anonymous session carrying the CSRF token (reused if present)
  send(res, 200, page('Login', `<h1>Login</h1>${err ? `<p class="err">${err}</p>` : ''}
<form method="POST" action="/login">
<input type="hidden" name="csrf" value="${s.csrf}">
<label>Username <input name="username" id="username"></label><br>
<label>Password <input name="password" id="password" type="password"></label><br>
<button type="submit">Login</button></form>
<p><small>Try admin / password123</small></p>`));
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const path = url.pathname;
  const m = req.method;
  const s = getSession(req);
  const authed = s && s.user;
  if (process.env.LOG_REQUESTS) {
    const c = parseCookies(req.headers.cookie)[COOKIE];
    console.log(`${m} ${req.url} cookie=${c ? c.slice(0, 6) : '-'} session=${s ? (s.user || 'anonymous') : 'none'}`);
  }

  // ---- public ----
  if (path === '/health') return json(res, 200, { status: 'ok' });

  if (path === '/' ) {
    res.writeHead(302, { Location: authed ? '/dashboard' : '/login' });
    return res.end();
  }

  if (path === '/login' && m === 'GET') return loginPage(req, res, url.searchParams.get('error') && 'Invalid credentials or session expired');

  if (path === '/login' && m === 'POST') {
    const b = await parseBody(req);
    if (!b || !s || b.csrf !== s.csrf || USERS[b.username] !== b.password) {
      res.writeHead(302, { Location: '/login?error=1' });
      return res.end();
    }
    sessions.delete(s.id); // new id after login (prevents session fixation)
    newSession(res, { user: b.username });
    res.writeHead(302, { Location: '/dashboard', 'Set-Cookie': res.getHeader('Set-Cookie') });
    return res.end();
  }

  if (path === '/api/login' && m === 'POST') {
    const b = await parseBody(req);
    if (!b || USERS[b.username] !== b.password) return json(res, 401, { error: 'Invalid credentials' });
    if (s) sessions.delete(s.id);
    newSession(res, { user: b.username });
    return json(res, 200, { message: 'Logged in', user: b.username });
  }

  if (path === '/logout' && m === 'POST') {
    if (s) sessions.delete(s.id);
    clearCookie(res);
    if (path === '/logout' && req.headers.accept && req.headers.accept.includes('json')) return json(res, 200, { message: 'Logged out' });
    res.writeHead(302, { Location: '/login', 'Set-Cookie': res.getHeader('Set-Cookie') });
    return res.end();
  }

  // ---- protected ----
  if (!authed) {
    if (path.startsWith('/api/')) return json(res, 401, { error: 'Not authenticated' });
    res.writeHead(302, { Location: '/login' });
    return res.end();
  }

  if (path === '/dashboard' && m === 'GET') {
    return send(res, 200, page('Dashboard', `<h1>Dashboard</h1><p id="welcome">Welcome, ${s.user}!</p>
<p><a href="/items">Items</a></p>${logoutForm}`));
  }

  if (path === '/items' && m === 'GET') {
    const rows = items.map((i) => `<tr><td>${i.id}</td><td>${i.name}</td><td>${i.price}</td><td>${i.stock}</td></tr>`).join('');
    return send(res, 200, page('Items', `<h1>Items</h1><table><tr><th>ID</th><th>Name</th><th>Price</th><th>Stock</th></tr>${rows}</table>
<p><a href="/dashboard">Back</a></p>${logoutForm}`));
  }

  if (path === '/api/me' && m === 'GET') return json(res, 200, { user: s.user });

  if (path === '/api/items' && m === 'GET') {
    const q = (url.searchParams.get('q') || '').toLowerCase();
    return json(res, 200, items.filter((i) => i.name.toLowerCase().includes(q)));
  }
  if (path === '/api/items' && m === 'POST') {
    const b = await parseBody(req);
    if (!b || !b.name || isNaN(Number(b.price))) return json(res, 400, { error: 'name and numeric price required' });
    const item = { id: nextId++, name: String(b.name), price: Number(b.price), stock: Number(b.stock) || 0 };
    items.push(item);
    return json(res, 201, item);
  }

  const mm = path.match(/^\/api\/items\/(\d+)$/);
  if (mm) {
    const id = Number(mm[1]);
    const idx = items.findIndex((i) => i.id === id);
    if (idx < 0) return json(res, 404, { error: 'Item not found' });
    if (m === 'GET') return json(res, 200, items[idx]);
    if (m === 'PUT') {
      const b = await parseBody(req);
      if (!b || !b.name || isNaN(Number(b.price))) return json(res, 400, { error: 'name and numeric price required' });
      items[idx] = { id, name: String(b.name), price: Number(b.price), stock: Number(b.stock) || 0 };
      return json(res, 200, items[idx]);
    }
    if (m === 'DELETE') { items.splice(idx, 1); return json(res, 200, { message: 'Deleted', id }); }
  }

  json(res, 404, { error: 'Not found' });
});

server.listen(PORT, () => console.log(`Sample app on http://localhost:${PORT}  (idle session timeout ${SESSION_TTL_MS / 1000}s)`));
