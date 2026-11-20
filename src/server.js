// Balance Ta Livraison — MVP API + static dashboard. Zero external dependencies.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
import { load, save } from './store.js';
import {
  normalizePhone, hashPhone, maskPhone, computeReputation,
  isValidType, REPORT_TYPES, newId,
} from './domain.js';
import { handleMessage, parseMetaWebhook } from './whatsapp.js';

const WA_VERIFY_TOKEN = process.env.BTL_WA_VERIFY_TOKEN || 'btl-verify';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = join(__dirname, '..', 'public');
const PORT = process.env.PORT || 4000;
const CREDIT_TND = 0.4; // 1 lookup credit ≈ 0,4 TND (prix indicatif)

const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml', '.ico': 'image/x-icon',
};

function send(res, status, body, headers = {}) {
  const payload = typeof body === 'string' ? body : JSON.stringify(body);
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', ...headers });
  res.end(payload);
}

function readBody(req) {
  return new Promise((resolve) => {
    let data = '';
    req.on('data', (c) => { data += c; if (data.length > 1e6) req.destroy(); });
    req.on('end', () => { try { resolve(data ? JSON.parse(data) : {}); } catch { resolve(null); } });
  });
}

function auth(req, db) {
  const key = req.headers['x-api-key'];
  if (!key) return null;
  return db.merchants.find((m) => m.apiKey === key) || null;
}

async function serveStatic(req, res) {
  let urlPath = req.url.split('?')[0];
  if (urlPath === '/') urlPath = '/index.html';
  let filePath = normalize(join(PUBLIC_DIR, urlPath));
  // Friendly fallback: /whatsapp → /whatsapp.html
  if (!existsSync(filePath) && !extname(filePath)) {
    const withHtml = filePath + '.html';
    if (withHtml.startsWith(PUBLIC_DIR) && existsSync(withHtml)) filePath = withHtml;
  }
  if (!filePath.startsWith(PUBLIC_DIR) || !existsSync(filePath)) {
    // Friendly HTML 404 with clickable links instead of a dead-end JSON error.
    res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
    return res.end(`<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8">
<title>Page introuvable</title>
<style>body{font-family:system-ui,sans-serif;background:#0f172a;color:#e2e8f0;display:flex;
min-height:100vh;align-items:center;justify-content:center;margin:0}
.box{text-align:center}a{display:inline-block;margin:8px;padding:12px 20px;background:#38bdf8;
color:#04212e;border-radius:8px;text-decoration:none;font-weight:600}h1{font-size:20px}</style>
</head><body><div class="box"><h1>📦 Page introuvable</h1>
<p>Cette adresse n'existe pas. Choisissez une page :</p>
<a href="/">Console pro</a><a href="/whatsapp.html">Bot WhatsApp</a></div></body></html>`);
  }
  const body = await readFile(filePath);
  res.writeHead(200, { 'Content-Type': MIME[extname(filePath)] || 'application/octet-stream' });
  res.end(body);
}

// ---- Route handlers ----

function registerMerchant(body, db) {
  const { name, matriculeFiscal, type } = body || {};
  if (!name || !matriculeFiscal) return { status: 400, body: { error: 'name et matriculeFiscal requis' } };
  if (type && !['merchant', 'carrier'].includes(type)) return { status: 400, body: { error: 'type invalide' } };
  const m = {
    id: newId('mch'), name, matriculeFiscal,
    type: type || 'merchant',
    apiKey: newId('key'),
    credits: 20, // crédits offerts à l'inscription (essai)
    createdAt: new Date().toISOString(),
  };
  db.merchants.push(m);
  save(db);
  return { status: 201, body: { id: m.id, name: m.name, type: m.type, apiKey: m.apiKey, credits: m.credits } };
}

function submitReport(body, db, me) {
  const { phone, type, orderRef, note } = body || {};
  const canonical = normalizePhone(phone);
  if (!canonical) return { status: 400, body: { error: 'Numéro invalide (format tunisien attendu)' } };
  if (!isValidType(type)) return { status: 400, body: { error: 'Type de signalement invalide' } };
  // Legal-by-design: a report MUST be tied to a real order/delivery reference.
  if (!orderRef || String(orderRef).trim().length < 3) {
    return { status: 400, body: { error: 'orderRef requis (référence commande/bon de livraison) — anti-abus' } };
  }
  const report = {
    id: newId('rep'),
    phoneHash: hashPhone(canonical),
    phoneMasked: maskPhone(canonical),
    type,
    subject: REPORT_TYPES[type].subject,
    orderRef: String(orderRef).trim(),
    note: note ? String(note).slice(0, 280) : '',
    authorId: me.id,
    status: 'confirmed',
    createdAt: new Date().toISOString(),
  };
  db.reports.push(report);
  save(db);
  return { status: 201, body: { id: report.id, status: report.status } };
}

function reputationFor(canonical, db) {
  const hash = hashPhone(canonical);
  const reports = db.reports.filter((r) => r.phoneHash === hash);
  const rep = computeReputation(reports);
  return { phone: maskPhone(canonical), ...rep };
}

function chargeLookups(db, me, count) {
  me.credits -= count;
  for (let i = 0; i < count; i++) {
    db.lookups.push({ id: newId('lkp'), merchantId: me.id, createdAt: new Date().toISOString() });
  }
}

function lookupSingle(body, db, me) {
  const canonical = normalizePhone(body?.phone);
  if (!canonical) return { status: 400, body: { error: 'Numéro invalide' } };
  if (me.credits < 1) return { status: 402, body: { error: 'Crédits insuffisants', credits: me.credits } };
  chargeLookups(db, me, 1);
  const result = reputationFor(canonical, db);
  save(db);
  return { status: 200, body: { result, creditsLeft: me.credits, costCredits: 1 } };
}

// Batch lookup: dedupe, validate, charge 1 credit per UNIQUE valid number.
function lookupBatch(body, db, me) {
  const raw = Array.isArray(body?.phones) ? body.phones : [];
  if (raw.length === 0) return { status: 400, body: { error: 'phones (array) requis' } };
  if (raw.length > 5000) return { status: 400, body: { error: 'Max 5000 numéros par lot' } };

  const seen = new Map(); // canonical -> true
  const invalid = [];
  for (const p of raw) {
    const c = normalizePhone(p);
    if (!c) { invalid.push(String(p)); continue; }
    seen.set(c, true);
  }
  const uniques = [...seen.keys()];
  if (uniques.length > me.credits) {
    return { status: 402, body: { error: 'Crédits insuffisants pour ce lot', need: uniques.length, credits: me.credits } };
  }
  const results = uniques.map((c) => reputationFor(c, db));
  chargeLookups(db, me, uniques.length);
  save(db);

  const summary = {
    submitted: raw.length,
    unique: uniques.length,
    invalid: invalid.length,
    flagged: results.filter((r) => r.band === 'high' || r.band === 'medium').length,
    high: results.filter((r) => r.band === 'high').length,
  };
  return { status: 200, body: { summary, results, invalidSamples: invalid.slice(0, 10), creditsLeft: me.credits, costCredits: uniques.length } };
}

function fileContestation(body, db, me) {
  const canonical = normalizePhone(body?.phone);
  if (!canonical) return { status: 400, body: { error: 'Numéro invalide' } };
  const reason = String(body?.reason || '').slice(0, 500);
  const c = {
    id: newId('cnt'), phoneHash: hashPhone(canonical), phoneMasked: maskPhone(canonical),
    reason, byId: me.id, status: 'open', createdAt: new Date().toISOString(),
  };
  db.contestations.push(c);
  save(db);
  return { status: 201, body: { id: c.id, status: c.status, note: 'Contestation enregistrée. Les signalements liés seront réexaminés.' } };
}

function topup(body, db, me) {
  const n = Number(body?.credits);
  if (!Number.isFinite(n) || n <= 0 || n > 100000) return { status: 400, body: { error: 'credits invalide' } };
  me.credits += Math.floor(n);
  save(db);
  return { status: 200, body: { credits: me.credits } };
}

const server = createServer(async (req, res) => {
  try {
    const url = req.url.split('?')[0];

    // Public metadata + static assets
    if (req.method === 'GET' && url === '/api/health') return send(res, 200, { ok: true, ts: Date.now() });
    if (req.method === 'GET' && url === '/api/report-types') {
      return send(res, 200, Object.entries(REPORT_TYPES).map(([k, v]) => ({ type: k, ...v })));
    }
    if (req.method === 'POST' && url === '/api/merchants') {
      const body = await readBody(req);
      const r = registerMerchant(body, load());
      return send(res, r.status, r.body);
    }

    // --- WhatsApp webhook (unauthenticated: pro is identified by sender number) ---
    if (req.method === 'GET' && url === '/webhook/whatsapp') {
      // Meta Cloud API verification handshake
      const q = new URL(req.url, 'http://x').searchParams;
      if (q.get('hub.mode') === 'subscribe' && q.get('hub.verify_token') === WA_VERIFY_TOKEN) {
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        return res.end(q.get('hub.challenge') || '');
      }
      return send(res, 403, { error: 'verify token mismatch' });
    }
    if (req.method === 'POST' && url === '/webhook/whatsapp') {
      const payload = await readBody(req);
      // Accept Meta Cloud API shape OR a simple {from, text} for local testing/simulator.
      const msg = parseMetaWebhook(payload) || (payload?.from ? { from: payload.from, text: payload.text } : null);
      if (!msg) return send(res, 200, { status: 'ignored' }); // ack non-message events
      const db = load();
      const { reply, dirty } = handleMessage(db, msg.from, msg.text);
      if (dirty) save(db);
      return send(res, 200, { reply });
    }

    if (!url.startsWith('/api/')) return serveStatic(req, res);

    // Authenticated endpoints
    const db = load();
    const me = auth(req, db);
    if (!me) return send(res, 401, { error: 'Clé API invalide ou absente (header x-api-key)' });

    if (req.method === 'GET' && url === '/api/me') {
      return send(res, 200, { id: me.id, name: me.name, type: me.type, credits: me.credits, creditValueTND: CREDIT_TND });
    }
    const body = await readBody(req);
    if (body === null) return send(res, 400, { error: 'JSON invalide' });

    let r;
    if (req.method === 'POST' && url === '/api/reports') r = submitReport(body, db, me);
    else if (req.method === 'POST' && url === '/api/lookup') r = lookupSingle(body, db, me);
    else if (req.method === 'POST' && url === '/api/lookup/batch') r = lookupBatch(body, db, me);
    else if (req.method === 'POST' && url === '/api/contestations') r = fileContestation(body, db, me);
    else if (req.method === 'POST' && url === '/api/credits/topup') r = topup(body, db, me);
    else r = { status: 404, body: { error: 'Route inconnue' } };

    return send(res, r.status, r.body);
  } catch (err) {
    return send(res, 500, { error: 'Erreur serveur', detail: String(err?.message || err) });
  }
});

server.listen(PORT, () => {
  console.log(`Balance Ta Livraison MVP → http://localhost:${PORT}`);
});
