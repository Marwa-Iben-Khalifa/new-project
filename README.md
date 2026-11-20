# Balance Ta Livraison

Service de **score de fiabilité des numéros de téléphone** pour la livraison en
**paiement à la livraison (COD)** en Tunisie. Avant d'expédier, un professionnel
(e-commerçant ou société de livraison) vérifie un numéro — seul ou **par lot** —
et reçoit un **score 0–100** + des faits agrégés. On note aussi la fiabilité des
**livreurs**.

> Ce n'est **pas** une liste noire publique : accès pro uniquement, résultat =
> score (jamais une accusation nominative), numéros hachés, droit de
> contestation, conservation limitée. Conçu « légal-by-design »
> (voir [`docs/conformite.md`](docs/conformite.md)).

## ⚡ Démo instantanée (sans rien installer)

Le fichier [`demo/index.html`](demo/index.html) est une **démo autonome** qui
tourne entièrement dans le navigateur (console + bot WhatsApp, données fictives).
Double-clique-le, ou glisse-le sur [app.netlify.com/drop](https://app.netlify.com/drop)
pour une URL publique partageable.

## 🚀 Lancer le vrai MVP en local

Aucune dépendance à installer (Node.js ≥ 22, stockage JSON).

```bash
npm run seed     # crée des comptes + numéros de démo
npm start        # démarre http://localhost:4000
```

Clés démo : `demo-merchant-key` (marchand, 200 crédits) ·
`demo-carrier-key` (transporteur, 1000 crédits).

| Numéro | Profil |
|---|---|
| `20111222` | Client à **risque élevé** |
| `24333444` | Client à **risque moyen** |
| `55777888` | Client **fiable** |
| `29888777` | **Livreur** problématique |
| `99000000` | **Inconnu** |

### Version autonome (un seul fichier)

```bash
npm run build:standalone   # génère btl-standalone.mjs
node btl-standalone.mjs    # tout-en-un, données en mémoire
```

### Bot WhatsApp (simulateur local)
Ouvre **http://localhost:4000/whatsapp.html**. Le branchement réel (Meta/Twilio)
est décrit dans [`docs/whatsapp.md`](docs/whatsapp.md) ; webhook : `POST /webhook/whatsapp`.

### Tests
```bash
npm test         # 23 tests de fumée (serveur doit tourner)
```

## 🧩 API (extrait)

| Méthode | Route | Rôle |
|---|---|---|
| POST | `/api/merchants` | Inscription pro (retourne une clé API) |
| GET | `/api/me` | Compte + crédits |
| POST | `/api/lookup` | Consulter **un** numéro (1 crédit) |
| POST | `/api/lookup/batch` | Consulter **un lot** (1 crédit/numéro unique) |
| POST | `/api/reports` | Signaler (orderRef obligatoire) |
| POST | `/api/contestations` | Droit de réponse |
| POST | `/api/credits/topup` | Recharger (démo) |

## 🏗️ Architecture

```
src/        server.js (API+statique), domain.js (score), store.js (JSON),
            whatsapp.js (bot), seed.js (démo)
public/     console web pro + simulateur WhatsApp
demo/       démo statique autonome (navigateur seul)
test/       tests de fumée
docs/       étude de marché, produit & pitch, conformité, whatsapp
build-standalone.mjs   génère la version un-fichier
```

## 📚 Documents
- [Étude de marché & monétisation](docs/etude-marche-balance-ta-livraison.md)
- [Produit final & argumentaire](docs/produit-final-et-pitch.md)
- [Conformité by-design](docs/conformite.md)
- [Brancher WhatsApp](docs/whatsapp.md)

## Statut
MVP fonctionnel pour tests/démos. Stockage JSON à remplacer par PostgreSQL en
production ; envoi WhatsApp sortant et paiement (Flouci/Clictopay) en v2.
