// Build a single self-contained .mjs (server + inlined frontend + in-memory seed).
// Frontend files are read from disk so the standalone always matches public/.
import { readFileSync, writeFileSync } from 'node:fs';

const INDEX = readFileSync('public/index.html', 'utf8');
const WA = readFileSync('public/whatsapp.html', 'utf8');
const CSS = readFileSync('public/styles.css', 'utf8');
const APP = readFileSync('public/app.js', 'utf8');

const out = `// Balance Ta Livraison — VERSION AUTONOME (un seul fichier).
// Lancer :  node btl-standalone.mjs      puis ouvrir http://localhost:4000
// Aucune dépendance, aucune base : données de démo en mémoire (réinitialisées à chaque lancement).
import { createServer } from 'node:http';
import { createHash } from 'node:crypto';

const PORT = process.env.PORT || 4000;
const WA_VERIFY_TOKEN = process.env.BTL_WA_VERIFY_TOKEN || 'btl-verify';
const PEPPER = process.env.BTL_PEPPER || 'btl-mvp-pepper-change-me';
const RETENTION_MONTHS = 12;
const CREDIT_TND = 0.4;

const REPORT_TYPES = ${JSON.stringify((await import('./src/domain.js')).REPORT_TYPES, null, 2)};

const isValidType = (t) => Object.prototype.hasOwnProperty.call(REPORT_TYPES, t);
function normalizePhone(input){ if(typeof input!=='string')return null; let d=input.replace(/[^\\d+]/g,'').replace(/^\\+/,''); if(d.startsWith('00'))d=d.slice(2); if(d.startsWith('216'))d=d.slice(3); if(!/^\\d{8}$/.test(d))return null; if(!/^[2459]/.test(d))return null; return '+216'+d; }
const hashPhone = (c) => createHash('sha256').update(PEPPER+'|'+c).digest('hex');
function maskPhone(c){ const l=c.replace('+216',''); return '+216 '+l[0]+'X XXX X'+l.slice(6); }
const newId = (p) => p+'_'+Date.now().toString(36)+Math.random().toString(36).slice(2,8);
function monthsBetween(a,b){ return Math.abs(b-a)/(1000*60*60*24*30.4375); }
function computeReputation(reports, now=Date.now()){
  const active=reports.filter(r=>r.status==='confirmed'&&monthsBetween(new Date(r.createdAt).getTime(),now)<=RETENTION_MONTHS);
  let score=100,byType={},lastReportAt=null;
  for(const r of active){ const def=REPORT_TYPES[r.type]; if(!def)continue; const rec=Math.max(0,1-monthsBetween(new Date(r.createdAt).getTime(),now)/RETENTION_MONTHS); score-=def.weight*rec; byType[r.type]=(byType[r.type]||0)+1; const t=new Date(r.createdAt).getTime(); if(!lastReportAt||t>lastReportAt)lastReportAt=t; }
  score=Math.max(0,Math.min(100,Math.round(score)));
  let band='low'; if(score<40)band='high'; else if(score<70)band='medium';
  const known=active.length>0;
  return { score:known?score:null, band:known?band:'unknown', reportCount:active.length, breakdown:byType, lastReportAt:lastReportAt?new Date(lastReportAt).toISOString():null, known };
}

// ---- In-memory DB seeded at startup ----
const db = { merchants:[], reports:[], lookups:[], contestations:[] };
function seed(){
  const merchant={id:'mch_demo_merchant',name:'Boutique Amine (démo)',matriculeFiscal:'1234567A',type:'merchant',apiKey:'demo-merchant-key',credits:200,whatsappNumber:'+21650000001',createdAt:new Date().toISOString()};
  const carrier={id:'mch_demo_carrier',name:'Transporteur Rapide (démo)',matriculeFiscal:'7654321B',type:'carrier',apiKey:'demo-carrier-key',credits:1000,whatsappNumber:'+21650000002',createdAt:new Date().toISOString()};
  db.merchants.push(merchant,carrier);
  const add=(phone,type,authorId,monthsAgo,ref)=>{ const c=normalizePhone(phone); db.reports.push({id:newId('rep'),phoneHash:hashPhone(c),phoneMasked:maskPhone(c),type,subject:REPORT_TYPES[type].subject,orderRef:ref,note:'',authorId,status:'confirmed',createdAt:new Date(Date.now()-monthsAgo*30.4375*24*3600*1000).toISOString()}); };
  add('+21620111222','no_answer',merchant.id,1,'CMD-1001'); add('+21620111222','refused_delivery',merchant.id,2,'CMD-1042'); add('+21620111222','fake_number',carrier.id,0.5,'BL-88771'); add('+21620111222','no_answer',carrier.id,3,'BL-88012'); add('+21620111222','refused_delivery',merchant.id,4,'CMD-0980');
  add('+21624333444','no_answer',merchant.id,1,'CMD-1200');
  add('+21655777888','delivered_ok',merchant.id,1,'CMD-1300'); add('+21655777888','delivered_ok',carrier.id,3,'BL-90001');
  add('+21629888777','courier_no_show',merchant.id,1,'BL-5000'); add('+21629888777','courier_rude',merchant.id,2,'BL-5023');
}
seed();

// ---- WhatsApp bot ----
function bandLabelFr(b){ return {low:'RISQUE FAIBLE ✅',medium:'RISQUE MOYEN ⚠️',high:'RISQUE ÉLEVÉ ⛔',unknown:'INCONNU'}[b]||b; }
function reputationText(c){ const rep=computeReputation(db.reports.filter(r=>r.phoneHash===hashPhone(c))); if(!rep.known)return '📇 '+maskPhone(c)+'\\nAucun historique — numéro inconnu de la base.'; return '📇 '+maskPhone(c)+'\\nScore : '+rep.score+'/100 — '+bandLabelFr(rep.band)+'\\n'+rep.reportCount+' signalement(s) confirmé(s).'; }
const HELP='🤖 *Balance Ta Livraison*\\nEnvoyez :\\n• un *numéro* (ex. 20111222) → score\\n• *SIGNALER <numéro> <type> <réf>* → signaler\\n• *AIDE* → menu\\n\\nTypes : '+Object.keys(REPORT_TYPES).join(', ');
function handleMessage(from,text){
  const me=db.merchants.find(m=>m.whatsappNumber&&normalizePhone(m.whatsappNumber)===normalizePhone(from));
  if(!me)return "👋 Bienvenue sur *Balance Ta Livraison*.\\nCe numéro n'est pas encore rattaché à un compte pro.";
  const body=String(text||'').trim(), up=body.toUpperCase();
  if(!body||up==='AIDE'||up==='HELP'||up==='MENU')return HELP+'\\n\\n💳 Crédits : '+me.credits;
  if(up.startsWith('SIGNALER')){ const [rawPhone,type,...ref]=body.split(/\\s+/).slice(1); const orderRef=ref.join(' '); const c=normalizePhone(rawPhone); if(!c)return '❌ Numéro invalide.'; if(!isValidType(type))return '❌ Type invalide.'; if(!orderRef||orderRef.length<3)return '❌ Réf. commande requise. Ex : SIGNALER 20111222 no_answer CMD-123'; db.reports.push({id:newId('rep'),phoneHash:hashPhone(c),phoneMasked:maskPhone(c),type,subject:REPORT_TYPES[type].subject,orderRef,note:'',authorId:me.id,status:'confirmed',createdAt:new Date().toISOString()}); return '✅ Signalement enregistré pour '+maskPhone(c)+' ('+REPORT_TYPES[type].label+').'; }
  const c=normalizePhone(body.replace(/^SCORE\\s+/i,'')); if(!c)return "Je n'ai pas compris. Envoyez *AIDE*."; if(me.credits<1)return '💳 Crédits insuffisants.'; me.credits-=1; db.lookups.push({id:newId('lkp'),merchantId:me.id,channel:'whatsapp',createdAt:new Date().toISOString()}); return reputationText(c)+'\\n\\n(–1 crédit · reste '+me.credits+')';
}
function parseMeta(p){ try{ const m=p.entry?.[0]?.changes?.[0]?.value?.messages?.[0]; if(!m)return null; return {from:m.from,text:m.text?.body||''}; }catch{return null;} }

// ---- HTTP helpers ----
function send(res,status,body,headers={}){ const p=typeof body==='string'?body:JSON.stringify(body); res.writeHead(status,{'Content-Type':'application/json; charset=utf-8',...headers}); res.end(p); }
function readBody(req){ return new Promise(r=>{ let d=''; req.on('data',c=>{d+=c;if(d.length>1e6)req.destroy();}); req.on('end',()=>{try{r(d?JSON.parse(d):{});}catch{r(null);}}); }); }
const auth=(req)=>{ const k=req.headers['x-api-key']; return k?db.merchants.find(m=>m.apiKey===k)||null:null; };

const PAGES = {
  '/index.html': [${JSON.stringify(INDEX)}, 'text/html; charset=utf-8'],
  '/whatsapp.html': [${JSON.stringify(WA)}, 'text/html; charset=utf-8'],
  '/styles.css': [${JSON.stringify(CSS)}, 'text/css; charset=utf-8'],
  '/app.js': [${JSON.stringify(APP)}, 'text/javascript; charset=utf-8'],
};
const NOTFOUND_HTML='<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"><title>Introuvable</title><style>body{font-family:system-ui,sans-serif;background:#0f172a;color:#e2e8f0;display:flex;min-height:100vh;align-items:center;justify-content:center;margin:0}.box{text-align:center}a{display:inline-block;margin:8px;padding:12px 20px;background:#38bdf8;color:#04212e;border-radius:8px;text-decoration:none;font-weight:600}</style></head><body><div class="box"><h1>📦 Page introuvable</h1><p>Choisissez une page :</p><a href="/">Console pro</a><a href="/whatsapp.html">Bot WhatsApp</a></div></body></html>';

const server=createServer(async(req,res)=>{
 try{
  const url=req.url.split('?')[0];
  if(req.method==='GET'&&url==='/api/health')return send(res,200,{ok:true,ts:Date.now()});
  if(req.method==='GET'&&url==='/api/report-types')return send(res,200,Object.entries(REPORT_TYPES).map(([k,v])=>({type:k,...v})));
  if(req.method==='POST'&&url==='/api/merchants'){ const b=await readBody(req); if(!b?.name||!b?.matriculeFiscal)return send(res,400,{error:'name et matriculeFiscal requis'}); const m={id:newId('mch'),name:b.name,matriculeFiscal:b.matriculeFiscal,type:b.type||'merchant',apiKey:newId('key'),credits:20,createdAt:new Date().toISOString()}; db.merchants.push(m); return send(res,201,{id:m.id,name:m.name,type:m.type,apiKey:m.apiKey,credits:m.credits}); }
  if(req.method==='GET'&&url==='/webhook/whatsapp'){ const q=new URL(req.url,'http://x').searchParams; if(q.get('hub.mode')==='subscribe'&&q.get('hub.verify_token')===WA_VERIFY_TOKEN){res.writeHead(200,{'Content-Type':'text/plain'});return res.end(q.get('hub.challenge')||'');} return send(res,403,{error:'verify token mismatch'}); }
  if(req.method==='POST'&&url==='/webhook/whatsapp'){ const p=await readBody(req); const msg=parseMeta(p)||(p?.from?{from:p.from,text:p.text}:null); if(!msg)return send(res,200,{status:'ignored'}); return send(res,200,{reply:handleMessage(msg.from,msg.text)}); }

  if(!url.startsWith('/api/')){ let key=url==='/'?'/index.html':url; if(!PAGES[key]&&!key.includes('.')&&PAGES[key+'.html'])key=key+'.html'; if(PAGES[key]){res.writeHead(200,{'Content-Type':PAGES[key][1]});return res.end(PAGES[key][0]);} res.writeHead(404,{'Content-Type':'text/html; charset=utf-8'});return res.end(NOTFOUND_HTML); }

  const me=auth(req); if(!me)return send(res,401,{error:'Clé API invalide ou absente'});
  if(req.method==='GET'&&url==='/api/me')return send(res,200,{id:me.id,name:me.name,type:me.type,credits:me.credits,creditValueTND:CREDIT_TND});
  const b=await readBody(req); if(b===null)return send(res,400,{error:'JSON invalide'});
  if(req.method==='POST'&&url==='/api/reports'){ const c=normalizePhone(b.phone); if(!c)return send(res,400,{error:'Numéro invalide'}); if(!isValidType(b.type))return send(res,400,{error:'Type invalide'}); if(!b.orderRef||String(b.orderRef).trim().length<3)return send(res,400,{error:'orderRef requis'}); db.reports.push({id:newId('rep'),phoneHash:hashPhone(c),phoneMasked:maskPhone(c),type:b.type,subject:REPORT_TYPES[b.type].subject,orderRef:String(b.orderRef).trim(),note:(b.note||'').slice(0,280),authorId:me.id,status:'confirmed',createdAt:new Date().toISOString()}); return send(res,201,{status:'confirmed'}); }
  if(req.method==='POST'&&url==='/api/lookup'){ const c=normalizePhone(b.phone); if(!c)return send(res,400,{error:'Numéro invalide'}); if(me.credits<1)return send(res,402,{error:'Crédits insuffisants',credits:me.credits}); me.credits-=1; db.lookups.push({id:newId('lkp'),merchantId:me.id,createdAt:new Date().toISOString()}); const rep=computeReputation(db.reports.filter(r=>r.phoneHash===hashPhone(c))); return send(res,200,{result:{phone:maskPhone(c),...rep},creditsLeft:me.credits,costCredits:1}); }
  if(req.method==='POST'&&url==='/api/lookup/batch'){ const raw=Array.isArray(b.phones)?b.phones:[]; if(!raw.length)return send(res,400,{error:'phones requis'}); if(raw.length>5000)return send(res,400,{error:'Max 5000'}); const seen=new Map(),invalid=[]; for(const p of raw){const c=normalizePhone(p); if(!c){invalid.push(String(p));continue;} seen.set(c,true);} const uniques=[...seen.keys()]; if(uniques.length>me.credits)return send(res,402,{error:'Crédits insuffisants',need:uniques.length,credits:me.credits}); const results=uniques.map(c=>({phone:maskPhone(c),...computeReputation(db.reports.filter(r=>r.phoneHash===hashPhone(c)))})); me.credits-=uniques.length; uniques.forEach(()=>db.lookups.push({id:newId('lkp'),merchantId:me.id,createdAt:new Date().toISOString()})); const summary={submitted:raw.length,unique:uniques.length,invalid:invalid.length,flagged:results.filter(r=>r.band==='high'||r.band==='medium').length,high:results.filter(r=>r.band==='high').length}; return send(res,200,{summary,results,invalidSamples:invalid.slice(0,10),creditsLeft:me.credits,costCredits:uniques.length}); }
  if(req.method==='POST'&&url==='/api/contestations'){ const c=normalizePhone(b.phone); if(!c)return send(res,400,{error:'Numéro invalide'}); db.contestations.push({id:newId('cnt'),phoneHash:hashPhone(c),phoneMasked:maskPhone(c),reason:String(b.reason||'').slice(0,500),byId:me.id,status:'open',createdAt:new Date().toISOString()}); return send(res,201,{status:'open',note:'Contestation enregistrée. Les signalements liés seront réexaminés.'}); }
  if(req.method==='POST'&&url==='/api/credits/topup'){ const n=Number(b.credits); if(!Number.isFinite(n)||n<=0||n>100000)return send(res,400,{error:'credits invalide'}); me.credits+=Math.floor(n); return send(res,200,{credits:me.credits}); }
  return send(res,404,{error:'Route inconnue'});
 }catch(e){ return send(res,500,{error:'Erreur serveur',detail:String(e?.message||e)}); }
});
server.listen(PORT,()=>{ console.log('Balance Ta Livraison (autonome) → http://localhost:'+PORT); console.log('Console: http://localhost:'+PORT+'/   |   WhatsApp: http://localhost:'+PORT+'/whatsapp.html'); console.log('Clé démo: demo-merchant-key (marchand) / demo-carrier-key (transporteur)'); });
`;

writeFileSync('btl-standalone.mjs', out);
console.log('btl-standalone.mjs généré (' + (out.length/1024).toFixed(1) + ' Ko)');
