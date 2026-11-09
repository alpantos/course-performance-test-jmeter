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
  const id = parseCookies(req.headers.cookie)[COOKIE] || new URL(req.url, 'http://x').searchParams.get('sid');
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

const fs = require('fs');
const nodePath = require('path');
const STATIC = { '/static/app.css': ['app.css', 'text/css; charset=utf-8'], '/static/logo.svg': ['logo.svg', 'image/svg+xml'], '/favicon.svg': ['logo.svg', 'image/svg+xml'] };

const escHtml = (v) => String(v).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const logoutForm = '<form method="POST" action="/logout"><button type="submit" class="ghost">Logout</button></form>';

// ctx: { user, active } -> full app shell; no user -> centred auth layout
const page = (title, body, ctx = {}) => `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title} · Alpantos Performance Lab</title>
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="/static/app.css"></head>
<body class="${ctx.user ? 'app' : 'auth'}">
${ctx.user ? `<header class="topbar"><div class="topbar-inner">
<a class="brand" href="/dashboard"><img src="/static/logo.svg" alt=""><span>Alpantos<small>Performance Lab</small></span></a>
<nav class="nav"><a href="/dashboard"${ctx.active === 'dashboard' ? ' class="active"' : ''}>Dashboard</a><a href="/items"${ctx.active === 'items' ? ' class="active"' : ''}>Items</a></nav>
<div class="user-chip"><span class="avatar">${escHtml(ctx.user[0])}</span><span>${escHtml(ctx.user)}</span>${logoutForm}</div></div></header>` : ''}
<main>${body}</main>
<footer class="footer">Alpantos JMeter course · local training app – not for production</footer>
</body></html>`;

function loginPage(req, res, err) {
  const cur = getSession(req);
  if (cur && cur.user) { // already logged in: never touch the session
    res.writeHead(302, { Location: '/dashboard' });
    return res.end();
  }
  const s = cur || newSession(res, {}); // anonymous session carrying the CSRF token (reused if present)
  send(res, 200, page('Login', `<div class="card auth-card">
<div class="auth-logo"><img src="/static/logo.svg" alt="Alpantos"><div class="eyebrow">Performance Lab</div></div>
<h1>Login</h1>${err ? `<p class="err">${err}</p>` : ''}
<form method="POST" action="/login">
<input type="hidden" name="csrf" value="${s.csrf}">
<label>Username <input name="username" id="username" autocomplete="username" autofocus></label>
<label>Password <input name="password" id="password" type="password" autocomplete="current-password"></label>
<button type="submit">Sign in</button></form>
<p class="hint">Demo credentials: <code>admin</code> / <code>password123</code></p></div>`));
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
  if (STATIC[path] && m === 'GET') {
    const [file, type] = STATIC[path];
    const full = nodePath.join(__dirname, 'public', file);
    const body = fs.readFileSync(full);
    const etag = '"' + crypto.createHash('md5').update(body).digest('hex') + '"';
    const lastModified = fs.statSync(full).mtime.toUTCString();
    if (req.headers['if-none-match'] === etag) { res.writeHead(304, { ETag: etag }); return res.end(); }
    return send(res, 200, body, type, { ETag: etag, 'Last-Modified': lastModified, 'Cache-Control': 'no-cache' });
  }

  if (path === '/soap/calculator' && m === 'POST') {
    const xml = await readBody(req);
    const ns = 'http://tempuri.org/';
    const env = (inner, code = 200) => send(res, code, `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema"><soap:Body>${inner}</soap:Body></soap:Envelope>`, 'text/xml; charset=utf-8');
    if (!(req.headers['content-type'] || '').includes('xml')) return env('<soap:Fault><faultcode>soap:Client</faultcode><faultstring>Content-Type must be text/xml</faultstring></soap:Fault>', 415);
    const op = (xml.match(/<(?:\w+:)?(Add|Subtract|Multiply|Divide)[\s>]/) || [])[1];
    const num = (n) => Number((xml.match(new RegExp(`<(?:\\w+:)?${n}>\\s*(-?\\d+)\\s*<`)) || [])[1]);
    const a = num('intA'), b = num('intB');
    if (!op || Number.isNaN(a) || Number.isNaN(b)) return env('<soap:Fault><faultcode>soap:Client</faultcode><faultstring>Unknown operation or missing intA/intB</faultstring></soap:Fault>', 500);
    if (op === 'Divide' && b === 0) return env('<soap:Fault><faultcode>soap:Server</faultcode><faultstring>Divide by zero</faultstring></soap:Fault>', 500);
    const r = { Add: a + b, Subtract: a - b, Multiply: a * b, Divide: Math.trunc(a / b) }[op];
    return env(`<${op}Response xmlns="${ns}"><${op}Result>${r}</${op}Result></${op}Response>`);
  }

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
    const ns = newSession(res, { user: b.username });
    const sid = res.getHeader('Set-Cookie').match(/SESSIONID=([a-f0-9]+)/)[1];
    return json(res, 200, { message: 'Logged in', user: b.username, next: `/api/me?sid=${sid}` });
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
    const units = items.reduce((n, i) => n + i.stock, 0);
    const value = items.reduce((n, i) => n + i.stock * i.price, 0);
    return send(res, 200, page('Dashboard', `<div class="card hero"><h1>Dashboard</h1>
<p id="welcome" class="muted">Welcome, ${escHtml(s.user)}!</p>
<div class="actions"><a class="btn primary" href="/items">Manage items</a></div></div>
<div class="stats">
<div class="stat"><div class="label">Items</div><div class="value accent">${items.length}</div></div>
<div class="stat"><div class="label">Units in stock</div><div class="value">${units.toLocaleString('en-US')}</div></div>
<div class="stat"><div class="label">Inventory value</div><div class="value">$${value.toLocaleString('en-US')}</div></div>
<div class="stat"><div class="label">Active sessions</div><div class="value">${[...sessions.values()].filter((x) => x.user).length}</div></div></div>`, { user: s.user, active: 'dashboard' }));
  }

  // ---- HTML items UI (server-rendered forms; every form carries the session CSRF token) ----
  const esc = escHtml;
  const ctx = (active) => ({ user: s.user, active });
  const MSGS = { created: 'Item created', updated: 'Item updated', deleted: 'Item deleted' };
  const redirect = (loc) => { res.writeHead(302, { Location: loc }); res.end(); };
  const fields = (i = {}) => `<label>Name <input name="name" id="name" value="${esc(i.name || '')}" required></label>
<label>Price <input name="price" id="price" type="number" step="any" value="${esc(i.price ?? '')}" required></label>
<label>Stock <input name="stock" id="stock" type="number" value="${esc(i.stock ?? 0)}"></label>`;
  const csrfField = `<input type="hidden" name="csrf" value="${s.csrf}">`;
  const validItem = (b) => b && b.name && String(b.name).trim() && b.price !== '' && !isNaN(Number(b.price));
  const formError = (msg, back) => send(res, 400, page('Error', `<div class="card"><h1>Error</h1><p class="err" id="error">${esc(msg)}</p><a class="btn" href="${back}">Back</a></div>`, ctx('items')));
  const notFound = () => send(res, 404, page('Not found', '<div class="card"><h1>Item not found</h1><a class="btn" href="/items">Back to items</a></div>', ctx('items')));

  if (path === '/items' && m === 'GET') {
    const q = (url.searchParams.get('q') || '').toLowerCase();
    const list = items.filter((i) => i.name.toLowerCase().includes(q));
    const rows = list.map((i) => `<tr class="item-row" id="item-${i.id}"><td class="id">${i.id}</td><td class="name">${esc(i.name)}</td><td>${i.price}</td><td>${i.stock}</td>
<td><a class="edit" href="/items/${i.id}/edit">Edit</a>
<form method="POST" action="/items/${i.id}/delete">${csrfField}<button type="submit" class="delete">Delete</button></form></td></tr>`).join('\n');
    const msg = MSGS[url.searchParams.get('msg')];
    const qv = url.searchParams.get('q') || '';
    return send(res, 200, page('Items', `<div class="page-head"><div><h1>Items</h1><p class="muted">${list.length} item${list.length === 1 ? '' : 's'}${qv ? ` matching “${esc(qv)}”` : ''}</p></div></div>
${msg ? `<p id="flash" class="flash">${msg}</p>` : ''}
<div class="card flush"><div class="card-head"><h2>Inventory</h2>
<form method="GET" action="/items" class="search"><input name="q" value="${esc(qv)}" placeholder="Search by name"><button type="submit">Search</button></form></div>
<table><thead><tr><th>ID</th><th>Name</th><th>Price</th><th>Stock</th><th>Actions</th></tr></thead><tbody>${rows}</tbody></table>${list.length ? '' : '<div class="empty">No items found</div>'}</div>
<div class="card"><h2>Add item</h2>
<form method="POST" action="/items" id="add-form" class="form-grid">${csrfField}${fields()}<button type="submit">Add</button></form></div>`, ctx('items')));
  }

  const ui = path.match(/^\/items\/(\d+)\/(edit|delete)$/);
  const uiUpdate = path.match(/^\/items\/(\d+)$/);
  if ((path === '/items' && m === 'POST') || (ui && ((ui[2] === 'edit' && m === 'GET') || (ui[2] === 'delete' && m === 'POST'))) || (uiUpdate && m === 'POST')) {
    const id = Number((ui || uiUpdate || [])[1]);
    const idx = items.findIndex((i) => i.id === id);
    if (m === 'GET') { // edit form
      if (idx < 0) return notFound();
      return send(res, 200, page('Edit item', `<div class="card"><h1>Edit item ${id}</h1>
<form method="POST" action="/items/${id}" id="edit-form" class="form-grid">${csrfField}${fields(items[idx])}<button type="submit">Save</button></form>
<p><a href="/items">Cancel</a></p></div>`, ctx('items')));
    }
    const b = await parseBody(req);
    if (!b || b.csrf !== s.csrf) return send(res, 403, page('Forbidden', '<div class="card"><h1>Forbidden</h1><p class="err" id="error">Invalid CSRF token</p></div>', ctx('items')));
    if (path === '/items') { // create
      if (!validItem(b)) return formError('Name and numeric price are required', '/items');
      items.push({ id: nextId++, name: String(b.name).trim(), price: Number(b.price), stock: Number(b.stock) || 0 });
      return redirect('/items?msg=created');
    }
    if (idx < 0) return notFound();
    if (ui) { items.splice(idx, 1); return redirect('/items?msg=deleted'); } // delete
    if (!validItem(b)) return formError('Name and numeric price are required', `/items/${id}/edit`); // update
    items[idx] = { id, name: String(b.name).trim(), price: Number(b.price), stock: Number(b.stock) || 0 };
    return redirect('/items?msg=updated');
  }

  if (path === '/api/me' && m === 'GET') return json(res, 200, { user: s.user, next: `/api/items?sid=${s.id}` });

  // ---- endpoints that misbehave on purpose, for the "analyse the results" part of the course ----
  const clamp = (v, max) => Math.min(Math.max(Number(v) || 0, 0), max);
  if (path === '/api/slow' && m === 'GET') { // simulated slow dependency (I/O wait, no CPU)
    const ms = clamp(url.searchParams.get('ms') || 500, 5000);
    await new Promise((r) => setTimeout(r, ms));
    return json(res, 200, { waitedMs: ms });
  }
  if (path === '/api/cpu' && m === 'GET') { // burns CPU on the single Node thread -> queueing under load
    const ms = clamp(url.searchParams.get('ms') || 50, 1000);
    const end = Date.now() + ms;
    while (Date.now() < end) { /* busy loop */ }
    return json(res, 200, { burnedMs: ms });
  }
  if (path === '/api/flaky' && m === 'GET') { // random failures, default 20%
    const rate = clamp(url.searchParams.get('rate') ?? 20, 100);
    return Math.random() * 100 < rate ? json(res, 500, { error: 'Simulated failure' }) : json(res, 200, { ok: true });
  }

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
