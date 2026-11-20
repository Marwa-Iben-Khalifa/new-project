# « Balance Ta Livraison » — Étude de marché & stratégie de monétisation

> Document de cadrage — Marché : Tunisie
> Objectif : évaluer la faisabilité d'une plateforme de signalement/réputation
> des numéros de téléphone (clients « no-show » et livreurs non fiables) dans
> l'écosystème du paiement à la livraison (COD), et définir un modèle de
> monétisation rapide et défendable.

---

## 1. Résumé exécutif (à lire en premier)

**Le besoin est réel et douloureux.** En Tunisie, ~70 % des commandes e-commerce
sont encore payées **à la livraison (Cash On Delivery / COD)**. Le retour de
colis (client absent, injoignable, refus au dernier moment) est *le* premier
poste de perte de rentabilité des e-commerçants : ils paient l'aller-retour de
livraison sans jamais vendre. Un outil qui réduit ce risque a une vraie valeur
économique. **C'est le bon problème.**

**Mais l'angle « balancer un numéro » en mode public est le mauvais véhicule.**
Publier un numéro de téléphone associé à la mention « malveillant / mauvais
payeur » est un **traitement de données personnelles** encadré par la
**loi organique 2004-63** (autorité : l'**INPDP**). Fait en accès public et sans
base légale, cela t'expose à : fermeture administrative, plaintes pour
**diffamation** (décret-loi 2022-54 sur la cybercriminalité), et à la perte de
confiance dès la première contestation. C'est aussi le plus facile à copier.

**Le pivot gagnant : passer de « pilori public » à « registre de réputation
B2B fermé ».** Même idée, même donnée, mais :
- réservé aux **professionnels** (e-commerçants, sociétés de livraison) qui ont
  un **intérêt légitime** à évaluer un risque avant expédition ;
- pas de mur public de la honte : on renvoie un **score de fiabilité**, pas une
  accusation nominative publiée ;
- droit de **rectification / contestation** intégré dès le départ.

Ce pivot est à la fois **plus défendable juridiquement** et **plus monétisable**.

**Monétisation la plus rapide :** un système de **crédits prépayés** pour la
consultation à l'acte, complété par des **abonnements** pour les gros volumes.
Le tarif « 10 le numéro » est jouable comme prix d'appel, mais je recommande de
le baisser fortement à l'unité (0,3–0,5 TND) et de gagner sur le **volume +
l'abonnement** (voir §6).

> ⚠️ La monnaie tunisienne est le **dinar (TND)**, pas le franc. Tous les tarifs
> ci-dessous sont en TND. 1 TND ≈ 1000 millimes.

---

## 2. Le problème que l'on résout

### 2.1 Le contexte COD tunisien
- ~**70 %** des commandes e-commerce payées à la livraison (contre ~82 % en 2022).
- Le paiement en ligne reste freiné (confiance, bancarisation, habitudes).
- Beaucoup de ventes passent par **Facebook/Instagram** sans site ni facture.

### 2.2 Les deux douleurs symétriques
| Côté vendeur / livreur | Côté client / consommateur |
|---|---|
| Client qui commande puis ne répond plus | Livreur en retard, impoli, agressif |
| Refus au dernier moment | Livreur qui déclare « absent » sans se déplacer |
| Fausse adresse, faux numéro | Colis non conforme, arnaque du vendeur |
| Coût = double frais de livraison | Aucun recours, pas de traçabilité |

**Conséquence chiffrée :** si un retour coûte ~7–12 TND et que 15–30 % des colis
COD reviennent, 100 colis expédiés génèrent **150–360 TND de pertes sèches**.

---

## 3. Étude de marché

### 3.1 Taille et dynamique
- Plus de **1 300 sites e-commerce actifs** + une longue traîne de vendeurs
  sociaux (Facebook shops) non recensés.
- **56 %** des internautes tunisiens ont déjà acheté en ligne.
- Écosystème logistique COD dense : **Intigo, Aramex, Beep Delivery, IZO,
  First Delivery, la Poste (Rapid-Poste)** → autant de partenaires potentiels.

### 3.2 Segments clients (par ordre de valeur)
1. **Sociétés de livraison** — portent le coût du retour. **Cible n°1.**
2. **E-commerçants moyens/gros** — volume régulier, capables de payer.
3. **Petits vendeurs sociaux** — nombreux, faible willingness-to-pay (freemium).
4. **Consommateurs** — utiles pour alimenter la base (gratuit).

### 3.3 Concurrence & signaux
- **Pas de plateforme structurée dédiée** identifiée en Tunisie à ce jour.
- Besoin aujourd'hui « bricolé » sur des **groupes Facebook** → preuve de la
  demande, mais non fiable, non recherchable, juridiquement exposé.
- Analogie : les **fichiers de mauvais payeurs** (France) sont légaux uniquement
  sous autorisation de la CNIL et à accès restreint → confirme la direction B2B.

### 3.4 SWOT
- **Forces :** besoin chiffrable, premier entrant, effet de réseau.
- **Faiblesses :** qualité des signalements, démarrage à froid.
- **Opportunités :** partenariats transporteurs, extension Maghreb.
- **Menaces :** juridique (INPDP/diffamation), image « délation », copie facile.

---

## 4. L'angle recommandé : « réputation » plutôt que « délation »

| Concept initial (risqué) | Pivot recommandé (défendable) |
|---|---|
| « Balancer » un numéro publiquement | Interroger un **score de fiabilité** (0–100) |
| Accès ouvert à tous | Accès **pro vérifié** (registre fermé) |
| Fiche « X est un arnaqueur » | « N signalements confirmés, taux de refus élevé » |
| Aucun recours | **Droit de contestation** intégré |
| Signalement libre | Signalement **rattaché à une transaction** |

Le double sens (noter aussi les livreurs) reste souhaitable : deux registres
symétriques, le second désamorçant l'image de délation unilatérale.

---

## 5. ⚠️ Contrainte juridique — à traiter AVANT le code

- **Loi organique 2004-63** : un numéro est une **donnée personnelle** ;
  traitement à déclarer/autoriser auprès de l'**INPDP**, droits d'accès et
  rectification à respecter.
- **Décret-loi 2022-54** (cybercriminalité) : la diffusion d'imputations peut
  tomber sous des qualifications pénales.
- **Diffamation** : publier « ce numéro = arnaqueur » sans preuve est attaquable.

**Mesures intégrées dès le MVP (et arguments de vente) :** accès pro only ;
résultat = score + faits ; signalement traçable ; droit de réponse ; CGU +
déclaration INPDP ; conservation limitée. Budgète **une consultation juridique**
avant d'ouvrir au public — meilleur ROI du projet.

---

## 6. Monétisation — le moyen simple et rapide

### 6.1 Pourquoi 10 TND/numéro à l'unité est trop cher
Un vendeur qui expédie 500 colis/mois paierait 5 000 TND → inutilisable. Le
paiement à l'acte crée de la friction. Le levier, c'est le **volume** : un prix
unitaire **bas** rend la vérification **systématique**.

### 6.2 Modèle recommandé : crédits prépayés + abonnements
**a) Crédits prépayés** : 1 consultation ≈ 0,3–0,5 TND. Packs : 100 = 40 TND,
500 = 175 TND, 2000 = 600 TND. **Offre d'entrée rapide.**

**b) Abonnements :**
| Offre | Prix/mois | Inclus |
|---|---|---|
| Gratuit | 0 | 5–10 lookups |
| Pro | 29–49 TND | 300–800 lookups, API |
| Business | 99–149 TND | gros volume, multi-comptes |
| Transporteur | sur devis | API, SLA |

**c) API transporteurs** : facturation à l'appel dégressive — **le vrai revenu**.

### 6.3 Paiement en Tunisie
**Flouci, D17 (La Poste), e-DINAR, Clictopay/SMT.** Privilégier le **prépayé**
(évite les impayés).

### 6.4 Projection illustrative (an 1, prudente)
300 pros (~35 TND) + 2 transporteurs (~2 000 TND) ≈ **14 000 TND/mois** brut —
à valider par des entretiens clients réels.

---

## 7. MVP technique
Stack simple : Node + stockage (JSON pour le MVP, PostgreSQL ensuite) + console
web + **bot WhatsApp**. Auth pro (matricule fiscal). Paiement Flouci/Clictopay.
Règle anti-abus : un signalement rattaché à une transaction. *(Ce dépôt
contient un MVP fonctionnel de tout cela.)*

---

## 8. Prochaines étapes
1. 10–15 entretiens e-commerçants + 2–3 transporteurs.
2. Consultation juridique INPDP.
3. Landing page + liste d'attente.
4. MVP WhatsApp.
5. Nom : « Balance Ta Livraison » accrocheur mais connoté « délation » ;
   envisager un nom « confiance » (Thiqa, Aman…) pour le B2B.

---

## 9. Verdict
- Problème : réel, chiffrable → ✅ opportunité.
- Idée brute publique : ⚠️ risquée et copiable.
- Pivot B2B + score : ✅ défendable, monétisable, barrière à l'entrée.
- Monétisation rapide : crédits prépayés + abonnements + **API transporteurs**.
- Facteurs décisifs : régler le **juridique (INPDP)** et signer **un
  transporteur** partenaire.

---

### Sources
- Plumes Économiques — paiement à la livraison freine la transition digitale
- Tunisie Numérique — retours e-commerce / bons vs mauvais
- Loi organique 2004-63 (texte officiel) ; DPO Consulting — guide conformité
- Village Justice — décret-loi 54 vs loi 2004-63
- Haas Avocats — fichier des mauvais payeurs / autorisation CNIL
