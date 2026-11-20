# Brancher WhatsApp (guide)

Le serveur expose déjà un **webhook prêt à l'emploi** : `POST /webhook/whatsapp`.
La logique du bot est dans `src/whatsapp.js`. Il ne reste qu'à connecter un
fournisseur WhatsApp qui appelle ce webhook et envoie les réponses.

## Ce que fait le bot

| Message reçu | Réponse |
|---|---|
| un numéro (ex. `20111222`) | score de fiabilité (–1 crédit) |
| `SIGNALER <num> <type> <réf>` | enregistre un signalement (réf. obligatoire) |
| `AIDE` | menu + crédits |
| numéro non inscrit | message d'onboarding |

Le pro est identifié par son **numéro WhatsApp** (champ `whatsappNumber`).

## Option A — WhatsApp Cloud API (Meta, officiel, recommandé)
1. Compte **Meta Business** + app sur developers.facebook.com.
2. Ajouter **WhatsApp**, obtenir un numéro d'expéditeur.
3. Webhook : URL `https://TON_DOMAINE/webhook/whatsapp`, verify token =
   `BTL_WA_VERIFY_TOKEN` (défaut `btl-verify`). Le `GET` de vérification est déjà
   implémenté.
4. Meta envoie les messages en `POST` — `parseMetaWebhook()` les lit déjà.
5. **Envoi de la réponse** : appeler l'API Graph (voir TODO).

## Option B — Twilio (démarrage le plus rapide)
1. Activer le **WhatsApp Sandbox** Twilio (minutes, gratuit).
2. Webhook « When a message comes in » → `https://TON_DOMAINE/webhook/whatsapp`.
3. Adapter le mapping du corps (Twilio envoie `From`/`Body` en form-urlencoded).

## TODO production
- [ ] **Envoi sortant** (Graph API Meta ou API Twilio) pour renvoyer `reply`.
- [ ] HTTPS public (Meta l'exige). Test rapide : `ngrok http 4000`.
- [ ] Jetons dans des variables d'environnement.
- [ ] Rattacher chaque pro à son `whatsappNumber` à l'inscription.

## Tester en local
Ouvre **http://localhost:4000/whatsapp.html** — le simulateur envoie
`{from, text}` au webhook, comme le ferait un fournisseur.
