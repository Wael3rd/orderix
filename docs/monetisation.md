# Orderix — Modèle de monétisation (décision du 19/07/2026)

Décision déléguée à Claude par le propriétaire (« fais comme tu le sens »).

## Le modèle : cosmétiques premium uniquement, zéro publicité

**Ce qu'on vend** — des packs de parure à achat unique (non consommables) :
- **Pack Aurore** · 2,99 € : thème terracotta/rose doré + 2 avatars exclusifs (🦩 🌅)
- **Pack Forêt** · 2,99 € : thème vert profond + 2 avatars exclusifs (🦚 🌲)
- (post-lancement : packs saisonniers 2-4 fois/an, éventuel pack « Tout Orderix » à 6,99 €)

**Ce qu'on ne fera jamais** :
- ❌ Publicité, même « récompensée » — SDK lourd, consentement RGPD publicitaire,
  détestée par la cible, revenu négligeable à notre échelle, et « sans pub »
  est un argument de la fiche store.
- ❌ Avantage payant — les gels de série et tout ce qui touche au jeu restent
  gagnables uniquement en jouant. Un pack = de la beauté, rien d'autre.
- ❌ Consommables / monnaies virtuelles / abonnements — la confiance d'abord.

## Pourquoi ce choix
1. La cible (femmes 35-50, brain games) a un vrai taux de conversion sur le
   cosmétique de qualité et une aversion documentée à la pub.
2. Zéro friction réglementaire : pas de consentement publicitaire, la privacy
   policy reste vraie (« sans pub, sans traqueur »).
3. Aligné avec la boucle méta : les thèmes par niveau créent l'habitude de la
   personnalisation, les packs premium en sont le prolongement naturel.

## État d'implémentation
- ✅ Packs visibles dans l'app (💎 sur les thèmes/avatars verrouillés, message
  boutique au tap), droits stockés localement (`orderix_packs`)
- ✅ Bouton de simulation d'achat dans la zone de test (staging)
- ⏳ Intégration Google Play Billing : au moment de la fiche store (nécessite
  le compte Play + l'app déclarée) — les `productIds` prévus :
  `pack_aurore`, `pack_foret`
