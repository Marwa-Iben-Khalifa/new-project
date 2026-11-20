// WhatsApp bot logic — provider-agnostic.
// A pro sends a message; the bot interprets it and returns a reply string.
// Wiring to Meta Cloud API / Twilio happens in server.js (webhook).
import { normalizePhone, isValidType, REPORT_TYPES, hashPhone, maskPhone,
  computeReputation, newId } from './domain.js';

function bandLabelFr(band) {
  return { low: 'RISQUE FAIBLE ✅', medium: 'RISQUE MOYEN ⚠️', high: 'RISQUE ÉLEVÉ ⛔', unknown: 'INCONNU' }[band] || band;
}

function reputationText(canonical, db) {
  const hash = hashPhone(canonical);
  const reports = db.reports.filter((r) => r.phoneHash === hash);
  const rep = computeReputation(reports);
  if (!rep.known) {
    return `📇 ${maskPhone(canonical)}\nAucun historique — numéro inconnu de la base.`;
  }
  return `📇 ${maskPhone(canonical)}\nScore : ${rep.score}/100 — ${bandLabelFr(rep.band)}\n${rep.reportCount} signalement(s) confirmé(s).`;
}

const HELP = [
  '🤖 *Balance Ta Livraison*',
  'Envoyez :',
  '• un *numéro* (ex. 20111222) → score de fiabilité',
  '• *SIGNALER <numéro> <type> <réf>* → signaler un incident',
  '• *AIDE* → ce menu',
  '',
  'Types : ' + Object.keys(REPORT_TYPES).join(', '),
].join('\n');

// db: mutable store object. from: sender phone (E.164-ish). text: message body.
// Returns { reply, dirty } — dirty=true means the caller must persist db.
export function handleMessage(db, from, text) {
  const me = db.merchants.find((m) => m.whatsappNumber && normalizePhone(m.whatsappNumber) === normalizePhone(from));

  if (!me) {
    return { reply: `👋 Bienvenue sur *Balance Ta Livraison*.\nCe numéro n'est pas encore rattaché à un compte pro. Inscrivez-vous sur la console pour obtenir l'accès (nom + matricule fiscal).`, dirty: false };
  }

  const body = String(text || '').trim();
  const upper = body.toUpperCase();

  if (!body || upper === 'AIDE' || upper === 'HELP' || upper === 'MENU') {
    return { reply: HELP + `\n\n💳 Crédits : ${me.credits}`, dirty: false };
  }

  // SIGNALER <numéro> <type> <réf>
  if (upper.startsWith('SIGNALER')) {
    const parts = body.split(/\s+/).slice(1);
    const [rawPhone, type, ...refParts] = parts;
    const orderRef = refParts.join(' ');
    const canonical = normalizePhone(rawPhone);
    if (!canonical) return { reply: '❌ Numéro invalide.', dirty: false };
    if (!isValidType(type)) return { reply: `❌ Type invalide. Types : ${Object.keys(REPORT_TYPES).join(', ')}`, dirty: false };
    if (!orderRef || orderRef.length < 3) return { reply: '❌ Réf. commande/bon de livraison requise (anti-abus). Ex : SIGNALER 20111222 no_answer CMD-123', dirty: false };
    db.reports.push({
      id: newId('rep'), phoneHash: hashPhone(canonical), phoneMasked: maskPhone(canonical),
      type, subject: REPORT_TYPES[type].subject, orderRef, note: '', authorId: me.id,
      status: 'confirmed', createdAt: new Date().toISOString(),
    });
    return { reply: `✅ Signalement enregistré pour ${maskPhone(canonical)} (${REPORT_TYPES[type].label}).`, dirty: true };
  }

  // Otherwise: try to read a phone number (with optional SCORE prefix)
  const cleaned = body.replace(/^SCORE\s+/i, '');
  const canonical = normalizePhone(cleaned);
  if (!canonical) {
    return { reply: `Je n'ai pas compris. Envoyez *AIDE* pour le menu.`, dirty: false };
  }
  if (me.credits < 1) {
    return { reply: `💳 Crédits insuffisants. Rechargez sur la console pour continuer.`, dirty: false };
  }
  me.credits -= 1;
  db.lookups.push({ id: newId('lkp'), merchantId: me.id, createdAt: new Date().toISOString(), channel: 'whatsapp' });
  return { reply: reputationText(canonical, db) + `\n\n(–1 crédit · reste ${me.credits})`, dirty: true };
}

// Parse a Meta Cloud API webhook payload → { from, text } (first message) or null.
export function parseMetaWebhook(payload) {
  try {
    const msg = payload.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
    if (!msg) return null;
    return { from: msg.from, text: msg.text?.body || '' };
  } catch {
    return null;
  }
}
