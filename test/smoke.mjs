// Smoke test: boots nothing itself — assumes server on PORT (default 4000) after seed.
const BASE = process.env.BASE || 'http://localhost:4000';
let pass = 0, fail = 0;
function check(name, cond) {
  if (cond) { pass++; console.log('  ✓', name); }
  else { fail++; console.log('  ✗', name); }
}
async function api(path, { method = 'GET', key, body } = {}) {
  const res = await fetch(BASE + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(key ? { 'x-api-key': key } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: res.status, data: await res.json().catch(() => ({})) };
}

console.log('Smoke test →', BASE);

// health
check('health ok', (await api('/api/health')).data.ok === true);

// auth required
check('lookup without key → 401', (await api('/api/lookup', { method: 'POST', body: { phone: '20111222' } })).status === 401);

// single lookup high-risk demo number
const r1 = await api('/api/lookup', { method: 'POST', key: 'demo-merchant-key', body: { phone: '20111222' } });
check('high-risk number returns high band', r1.data?.result?.band === 'high');
check('high-risk score < 40', r1.data?.result?.score < 40);
check('lookup costs 1 credit', r1.data?.costCredits === 1);

// reliable number
const r2 = await api('/api/lookup', { method: 'POST', key: 'demo-merchant-key', body: { phone: '55777888' } });
check('reliable number band low', r2.data?.result?.band === 'low');

// unknown number
const r3 = await api('/api/lookup', { method: 'POST', key: 'demo-merchant-key', body: { phone: '99000000' } });
check('unknown number band=unknown, score null', r3.data?.result?.band === 'unknown' && r3.data?.result?.score === null);

// invalid number
const r4 = await api('/api/lookup', { method: 'POST', key: 'demo-merchant-key', body: { phone: '123' } });
check('invalid number → 400', r4.status === 400);

// batch lookup (dedup + billing)
const rb = await api('/api/lookup/batch', {
  method: 'POST', key: 'demo-carrier-key',
  body: { phones: ['20111222', '20111222', '55777888', '29888777', 'garbage', '24333444'] },
});
check('batch dedupes to 4 unique', rb.data?.summary?.unique === 4);
check('batch flags 1 invalid', rb.data?.summary?.invalid === 1);
check('batch charges per unique', rb.data?.costCredits === 4);
check('batch detects high risk', rb.data?.summary?.high >= 1);

// report requires orderRef
const rep1 = await api('/api/reports', { method: 'POST', key: 'demo-merchant-key', body: { phone: '21000000', type: 'no_answer' } });
check('report without orderRef → 400', rep1.status === 400);
const rep2 = await api('/api/reports', { method: 'POST', key: 'demo-merchant-key', body: { phone: '21000000', type: 'no_answer', orderRef: 'CMD-TEST-1' } });
check('valid report → 201', rep2.status === 201);

// invalid report type
const rep3 = await api('/api/reports', { method: 'POST', key: 'demo-merchant-key', body: { phone: '21000000', type: 'hack', orderRef: 'X-1' } });
check('invalid report type → 400', rep3.status === 400);

// contestation
const c = await api('/api/contestations', { method: 'POST', key: 'demo-merchant-key', body: { phone: '20111222', reason: 'erreur' } });
check('contestation → 201', c.status === 201);

// --- WhatsApp webhook ---
async function wa(from, text) {
  const res = await fetch(BASE + '/webhook/whatsapp', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ from, text }),
  });
  return (await res.json()).reply || '';
}
check('WA verify handshake', (await (await fetch(BASE + '/webhook/whatsapp?hub.mode=subscribe&hub.verify_token=btl-verify&hub.challenge=42')).text()) === '42');
check('WA unknown sender → onboarding', (await wa('+21651111111', '20111222')).includes('pas encore rattaché'));
check('WA AIDE → menu', (await wa('+21650000001', 'AIDE')).includes('💳 Crédits'));
check('WA lookup high-risk', (await wa('+21650000001', '20111222')).includes('RISQUE ÉLEVÉ'));
check('WA lookup reliable', (await wa('+21650000001', '55777888')).includes('RISQUE FAIBLE'));
check('WA report needs ref', (await wa('+21650000001', 'SIGNALER 21000000 no_answer')).includes('requise'));
check('WA report ok', (await wa('+21650000001', 'SIGNALER 21000000 no_answer CMD-9')).includes('enregistré'));

console.log(`\nRésultat : ${pass} réussis, ${fail} échoués`);
process.exit(fail ? 1 : 0);
