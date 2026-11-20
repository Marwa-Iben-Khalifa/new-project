# Conformité « by-design » — mesures intégrées au produit

L'objectif : rester dans la légalité **sans histoires juridiques compliquées**.
La stratégie tient en une idée : **ne jamais publier d'accusation nominative**,
seulement fournir un **score** à des professionnels. Les garde-fous ci-dessous
sont codés dans le MVP.

## Mesures déjà implémentées dans le code

| Mesure | Où | Effet |
|---|---|---|
| **Accès pro uniquement** | clé API (`x-api-key`), matricule fiscal | pas d'accès public anonyme |
| **Résultat = score, pas d'accusation** | `computeReputation()` | limite le risque de diffamation |
| **Numéros hachés** | `hashPhone()` (SHA-256 + pepper) | pas de numéros en clair en base |
| **Affichage masqué** | `maskPhone()` → `+216 2X XXX X22` | minimisation des données |
| **Signalement rattaché à une commande** | champ `orderRef` obligatoire | anti-vengeance, traçabilité |
| **Droit de contestation** | endpoint `/api/contestations` | droit de réponse |
| **Conservation limitée** | `RETENTION_MONTHS = 12` | pas de fichage à vie |
| **Journal des consultations** | table `lookups` | traçabilité des accès |

## Ce qui reste à faire côté « administratif » (une fois)

1. **Déclaration/autorisation INPDP** avant le lancement public.
2. **CGU + politique de confidentialité** (finalité B2B, base légale, droits,
   durée de conservation).
3. **Une consultation avocat/DPO tunisien** pour valider (investissement modeste).

> Cette posture est non négociable : elle distingue un service sérieux d'un groupe
> Facebook exposé, et c'est aussi un **argument commercial**.

## Ce qu'on évite volontairement
- ❌ Mur public de numéros « balancés ».
- ❌ Étiquettes accusatoires (« voleur », « arnaqueur »).
- ❌ Accès grand public anonyme.
- ❌ Conservation illimitée.
- ❌ Signalement libre sans commande associée.
