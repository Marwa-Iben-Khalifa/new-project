# Produit final & argumentaire commercial

> Comment se présente le produit une fois abouti, et comment le vendre aux
> **e-commerçants** et aux **plateformes de livraison**.

## 1. Ce qu'est le produit final (en une phrase)

**Un service de score de fiabilité des numéros de téléphone pour la livraison en
paiement à la livraison (COD)** : avant d'expédier, un professionnel vérifie le
numéro du client (seul ou **par lot**) et reçoit un **score 0–100** + des faits
agrégés. Symétriquement, on note aussi la fiabilité des **livreurs**.

Ce n'est **pas** une liste noire publique. C'est un **outil d'aide à la
décision B2B** : on renvoie un score et des faits, jamais une accusation.

## 2. Les composants du produit abouti

| Brique | Description | État MVP |
|---|---|---|
| **Console web pro** | Connexion, consultation simple, **par lot**, signalement, contestation | ✅ livré |
| **API** | Intégration back-office marchand / dispatch transporteur | ✅ (REST) |
| **Consultation par lot** | Liste → scores triés + synthèse | ✅ livré |
| **Bot WhatsApp** | Taper un numéro → score (les vendeurs vivent sur WhatsApp) | ✅ webhook + simulateur (voir `docs/whatsapp.md`) |
| **Porte-monnaie de crédits** | Prépayé, 1 crédit ≈ 0,4 TND | ✅ (simulé) |
| **Score livreur** | Réputation des livreurs | ✅ |
| **Badge « fiable »** | Réputation positive | ✅ (signaux positifs) |
| **Conformité** | Accès pro, hachage, contestation, rétention 12 mois | ✅ by-design |

## 3. La proposition de valeur

**E-commerçant :** chaque colis retourné coûte 7–12 TND. Filtrer les commandes à
risque **avant expédition** réduit les retours. Rentable dès qu'il évite **1
retour pour ~20–30 consultations**.

**Plateforme de livraison :** les retours plombent les tournées. La **consultation
par lot** en début de tournée permet de prioriser et de réduire le taux d'échec
— un KPI directement lié à leur marge.

## 4. Argumentaire e-commerçant

> « Tu paies la livraison aller-retour à chaque client qui ne répond plus une
> fois le colis sorti. Avec Balance Ta Livraison, tu vérifies le numéro en 2
> secondes avant d'expédier : s'il a un historique de refus chez d'autres
> vendeurs, tu le sais. Tu confirmes par appel, demandes une avance, ou refuses.
> Quelques centimes par vérification, gratuit pour commencer. »

**Chiffré :** « 1 commande sur 5 revient à 10 TND = 200 TND perdus sur 100.
En éviter la moitié = 100 TND récupérés pour ~40 TND de crédits. »

**Objection « délation ? »** → « Non : aucun nom publié, juste un score. Comme un
score de solvabilité pour la livraison. Et ça marche dans les deux sens. »

## 5. Argumentaire plateforme de livraison (le gros compte)

> « Vos retours coûtent cher. On vous donne une **API** qui score chaque numéro
> au dispatch, et une **consultation par lot** pour préparer les tournées. Vos
> livreurs priorisent, rappellent les numéros à risque, vous baissez le taux
> d'échec. En échange, vos signalements enrichissent la base. »

**Modèle partenaire :** API + tarif dégressif à l'appel. Argument massue :
**effet de réseau**. Cibles : Intigo, Aramex, Beep, First Delivery, IZO,
Rapid-Poste. Commencer par **1 pilote** → étude de cas chiffrée → dérouler.

## 6. Go-to-market
1. **Pilote transporteur** (volume + données).
2. **E-commerçants Instagram/Facebook** (freemium, viralité).
3. **E-shops établis** (abonnement + API).
4. **Extension Maghreb**.

## 7. Grille tarifaire
- Gratuit : 5–10 consultations/mois.
- Crédits : ~0,4 TND/numéro, packs dégressifs.
- Pro : 29–49 TND/mois · Business : 99–149 TND/mois.
- Transporteur : API, sur devis.

> Prix unitaire bas = vérification systématique. Revenu = volume + abonnements +
> API transporteurs.

## 8. Positionnement « dans la légalité »
Défendable par construction (voir `docs/conformite.md`) : accès pro, score + faits,
numéros hachés/masqués, signalement rattaché à une commande, contestation,
rétention 12 mois. Ces choix sont aussi des **arguments de vente** et une
**barrière à l'entrée** face à un simple groupe Facebook.
