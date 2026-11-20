// Business logic: phone normalization/hashing, reputation scoring.
// Legal-by-design choices live here:
//  - phone numbers are stored HASHED (never in clear) + a MASKED display form
//  - the public result is a SCORE + aggregated facts, never an accusation
//  - reports older than RETENTION_MONTHS are ignored (data retention limit)
import { createHash } from 'node:crypto';

// A static pepper. In production, load from an environment secret.
const PEPPER = process.env.BTL_PEPPER || 'btl-mvp-pepper-change-me';

export const RETENTION_MONTHS = 12;

// Report types with severity weights (impact on reputation).
// Positive types (delivered_ok) IMPROVE the score → supports the "reliable" badge.
export const REPORT_TYPES = {
  // subject: client (the person who orders)
  no_answer:        { subject: 'client',  weight: 15, label: 'Injoignable après sortie livraison' },
  refused_delivery: { subject: 'client',  weight: 20, label: 'Refus du colis au dernier moment' },
  wrong_address:    { subject: 'client',  weight: 10, label: 'Adresse erronée / introuvable' },
  fake_number:      { subject: 'client',  weight: 25, label: 'Faux numéro / injoignable dès le départ' },
  delivered_ok:     { subject: 'client',  weight: -12, label: 'Livraison réussie et payée' },
  // subject: courier (the delivery person)
  courier_no_show:  { subject: 'courier', weight: 25, label: 'Livreur ne s\'est pas présenté' },
  courier_rude:     { subject: 'courier', weight: 15, label: 'Livreur impoli / agressif' },
  courier_late:     { subject: 'courier', weight: 8,  label: 'Livreur en retard répété' },
  courier_reliable: { subject: 'courier', weight: -12, label: 'Livreur fiable et ponctuel' },
};

export function isValidType(t) {
  return Object.prototype.hasOwnProperty.call(REPORT_TYPES, t);
}

// Normalize a Tunisian phone number to canonical +216XXXXXXXX.
// Accepts: 8 local digits, 216XXXXXXXX, +216XXXXXXXX, spaces/dashes.
export function normalizePhone(input) {
  if (typeof input !== 'string') return null;
  let d = input.replace(/[^\d+]/g, '');
  d = d.replace(/^\+/, '');
  if (d.startsWith('00')) d = d.slice(2);
  if (d.startsWith('216')) d = d.slice(3);
  if (!/^\d{8}$/.test(d)) return null;      // Tunisian mobiles/landlines: 8 digits
  if (!/^[2459]/.test(d)) return null;      // valid leading digits in TN
  return '+216' + d;
}

export function hashPhone(canonical) {
  return createHash('sha256').update(PEPPER + '|' + canonical).digest('hex');
}

// Masked display form, e.g. +216 2X XXX X89 (data minimization).
export function maskPhone(canonical) {
  const local = canonical.replace('+216', '');
  return `+216 ${local[0]}X XXX X${local.slice(6)}`;
}

function monthsBetween(a, b) {
  return Math.abs(b - a) / (1000 * 60 * 60 * 24 * 30.4375);
}

// Compute reputation from the reports concerning one phone hash.
// Returns a factual, non-accusatory summary.
export function computeReputation(reports, now = Date.now()) {
  const active = reports.filter(
    (r) => r.status === 'confirmed' && monthsBetween(new Date(r.createdAt).getTime(), now) <= RETENTION_MONTHS
  );

  let score = 100;
  const byType = {};
  let lastReportAt = null;

  for (const r of active) {
    const def = REPORT_TYPES[r.type];
    if (!def) continue;
    const ageMonths = monthsBetween(new Date(r.createdAt).getTime(), now);
    const recency = Math.max(0, 1 - ageMonths / RETENTION_MONTHS); // linear decay
    score -= def.weight * recency;
    byType[r.type] = (byType[r.type] || 0) + 1;
    const t = new Date(r.createdAt).getTime();
    if (!lastReportAt || t > lastReportAt) lastReportAt = t;
  }

  score = Math.max(0, Math.min(100, Math.round(score)));

  let band = 'low';       // low risk
  if (score < 40) band = 'high';
  else if (score < 70) band = 'medium';

  // If there is no history at all, it's "unknown", not "good".
  const known = active.length > 0;

  return {
    score: known ? score : null,
    band: known ? band : 'unknown',
    reportCount: active.length,
    breakdown: byType,
    lastReportAt: lastReportAt ? new Date(lastReportAt).toISOString() : null,
    known,
  };
}

export function newId(prefix) {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}
