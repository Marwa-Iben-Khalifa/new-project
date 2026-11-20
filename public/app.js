const $ = (id) => document.getElementById(id);
let apiKey = localStorage.getItem('btl_key') || '';

async function api(path, { method = 'GET', body } = {}) {
  const res = await fetch(path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(apiKey ? { 'x-api-key': apiKey } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}

function bandLabel(band) {
  return { low: 'Risque faible', medium: 'Risque moyen', high: 'Risque élevé', unknown: 'Inconnu' }[band] || band;
}

function repCard(r) {
  const scoreTxt = r.known ? r.score : '—';
  const facts = r.known
    ? `${r.reportCount} signalement(s) confirmé(s) · dernier : ${r.lastReportAt ? new Date(r.lastReportAt).toLocaleDateString('fr-FR') : '—'}`
    : 'Aucun historique — numéro non connu de la base.';
  return `<div class="rep">
    <div class="score ${r.band}">${scoreTxt}</div>
    <div>
      <span class="band ${r.band}">${bandLabel(r.band)}</span>
      <div class="rep-facts" style="margin-top:8px">${r.phone}<br/>${facts}</div>
    </div>
  </div>`;
}

async function refreshAccount() {
  const { ok, data } = await api('/api/me');
  if (!ok) return logout();
  $('acc-name').textContent = data.name + (data.type === 'carrier' ? ' (transporteur)' : ' (marchand)');
  $('acc-credits').textContent = data.credits;
  $('login').classList.add('hidden');
  $('app').classList.remove('hidden');
  $('account').classList.remove('hidden');
}

function logout() {
  apiKey = ''; localStorage.removeItem('btl_key');
  $('app').classList.add('hidden'); $('account').classList.add('hidden');
  $('login').classList.remove('hidden');
}

async function loadReportTypes() {
  const { data } = await api('/api/report-types');
  const sel = $('report-type');
  sel.innerHTML = (data || []).map((t) => `<option value="${t.type}">${t.label} (${t.subject})</option>`).join('');
}

// ---- events ----
$('btn-login').onclick = async () => {
  apiKey = $('apikey').value.trim();
  if (!apiKey) return;
  localStorage.setItem('btl_key', apiKey);
  const { ok } = await api('/api/me');
  if (ok) { await loadReportTypes(); refreshAccount(); }
  else { alert('Clé API invalide'); logout(); }
};
$('btn-logout').onclick = logout;
$('btn-topup').onclick = async () => {
  const { data } = await api('/api/credits/topup', { method: 'POST', body: { credits: 100 } });
  if (data.credits != null) $('acc-credits').textContent = data.credits;
};

document.querySelectorAll('.tab').forEach((t) => {
  t.onclick = () => {
    document.querySelectorAll('.tab').forEach((x) => x.classList.remove('active'));
    document.querySelectorAll('.panel').forEach((x) => x.classList.remove('active'));
    t.classList.add('active');
    $('tab-' + t.dataset.tab).classList.add('active');
  };
});

$('btn-single').onclick = async () => {
  const phone = $('single-phone').value.trim();
  const { ok, data } = await api('/api/lookup', { method: 'POST', body: { phone } });
  if (!ok) return ($('single-result').innerHTML = `<div class="notice err">${data.error || 'Erreur'}</div>`);
  $('acc-credits').textContent = data.creditsLeft;
  $('single-result').innerHTML = repCard(data.result);
};

$('btn-batch').onclick = async () => {
  const phones = $('batch-input').value.split(/[\n,;]+/).map((s) => s.trim()).filter(Boolean);
  if (!phones.length) return;
  const { ok, data } = await api('/api/lookup/batch', { method: 'POST', body: { phones } });
  if (!ok) return ($('batch-summary').innerHTML = `<div class="notice err">${data.error || 'Erreur'}</div>`);
  $('acc-credits').textContent = data.creditsLeft;
  const s = data.summary;
  $('batch-summary').innerHTML = `<div class="summary-grid">
    <div class="stat"><b>${s.unique}</b>numéros uniques</div>
    <div class="stat"><b style="color:var(--red)">${s.high}</b>risque élevé</div>
    <div class="stat"><b style="color:var(--amber)">${s.flagged}</b>à surveiller</div>
    <div class="stat"><b>${s.invalid}</b>invalides</div>
    <div class="stat"><b>${data.costCredits}</b>crédits utilisés</div>
  </div>`;
  const rows = data.results
    .sort((a, b) => (a.score ?? 101) - (b.score ?? 101))
    .map((r) => `<tr>
      <td>${r.phone}</td>
      <td>${r.known ? r.score : '—'}</td>
      <td><span class="pill ${r.band}">${bandLabel(r.band)}</span></td>
      <td>${r.reportCount}</td>
    </tr>`).join('');
  $('batch-result').innerHTML = `<table><thead><tr><th>Numéro</th><th>Score</th><th>Évaluation</th><th>Signalements</th></tr></thead><tbody>${rows}</tbody></table>`;
};

$('btn-report').onclick = async () => {
  const body = {
    phone: $('report-phone').value.trim(), type: $('report-type').value,
    orderRef: $('report-order').value.trim(), note: $('report-note').value.trim(),
  };
  const { ok, data } = await api('/api/reports', { method: 'POST', body });
  $('report-result').innerHTML = ok
    ? `<div class="notice ok">Signalement enregistré (${data.id}).</div>`
    : `<div class="notice err">${data.error || 'Erreur'}</div>`;
};

$('btn-contest').onclick = async () => {
  const body = { phone: $('contest-phone').value.trim(), reason: $('contest-reason').value.trim() };
  const { ok, data } = await api('/api/contestations', { method: 'POST', body });
  $('contest-result').innerHTML = ok
    ? `<div class="notice ok">${data.note}</div>`
    : `<div class="notice err">${data.error || 'Erreur'}</div>`;
};

// auto-login if key stored
if (apiKey) { loadReportTypes().then(refreshAccount); }
