// Seed demo data so lookups return meaningful scores when testing locally.
import { load, save, resetFile } from './store.js';
import { hashPhone, maskPhone, normalizePhone, newId, REPORT_TYPES } from './domain.js';

resetFile();
const db = load();

// Two demo pro accounts with fixed API keys (easy to test).
const merchant = {
  id: 'mch_demo_merchant', name: 'Boutique Amine (démo)', matriculeFiscal: '1234567A',
  type: 'merchant', apiKey: 'demo-merchant-key', credits: 200,
  whatsappNumber: '+21650000001', createdAt: new Date().toISOString(),
};
const carrier = {
  id: 'mch_demo_carrier', name: 'Transporteur Rapide (démo)', matriculeFiscal: '7654321B',
  type: 'carrier', apiKey: 'demo-carrier-key', credits: 1000,
  whatsappNumber: '+21650000002', createdAt: new Date().toISOString(),
};
db.merchants.push(merchant, carrier);

function addReport(phone, type, authorId, monthsAgo = 1, orderRef = 'CMD-DEMO') {
  const canonical = normalizePhone(phone);
  const created = new Date(Date.now() - monthsAgo * 30.4375 * 24 * 3600 * 1000).toISOString();
  db.reports.push({
    id: newId('rep'), phoneHash: hashPhone(canonical), phoneMasked: maskPhone(canonical),
    type, subject: REPORT_TYPES[type].subject, orderRef, note: '', authorId,
    status: 'confirmed', createdAt: created,
  });
}

// A clearly high-risk client (multiple recent negatives from several pros)
addReport('+21620111222', 'no_answer', merchant.id, 1, 'CMD-1001');
addReport('+21620111222', 'refused_delivery', merchant.id, 2, 'CMD-1042');
addReport('+21620111222', 'fake_number', carrier.id, 0.5, 'BL-88771');
addReport('+21620111222', 'no_answer', carrier.id, 3, 'BL-88012');
addReport('+21620111222', 'refused_delivery', merchant.id, 4, 'CMD-0980');

// A medium-risk client (one recent negative)
addReport('+21624333444', 'no_answer', merchant.id, 1, 'CMD-1200');

// A reliable client (positive signals)
addReport('+21655777888', 'delivered_ok', merchant.id, 1, 'CMD-1300');
addReport('+21655777888', 'delivered_ok', carrier.id, 3, 'BL-90001');

// A problematic courier
addReport('+21629888777', 'courier_no_show', merchant.id, 1, 'BL-5000');
addReport('+21629888777', 'courier_rude', merchant.id, 2, 'BL-5023');

save(db);
console.log('Seed OK. Comptes démo :');
console.log('  - Marchand  : x-api-key = demo-merchant-key  (200 crédits)');
console.log('  - Transporteur: x-api-key = demo-carrier-key (1000 crédits)');
console.log('Numéros démo : 20111222 (risqué), 24333444 (moyen), 55777888 (fiable), 29888777 (livreur problématique)');
console.log('WhatsApp démo : le marchand écrit depuis +21650000001, le transporteur depuis +21650000002');
