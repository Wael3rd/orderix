# Orderix — Architecture « PRO » (plan validé juin 2026)

Objectif : comptes utilisateurs (anonyme → e-mail/Google/Facebook), progression
synchronisée, conformité RGPD, environnements staging/prod, lancement mondial.

## Décisions

| Sujet | Décision | Pourquoi |
|---|---|---|
| Backend | **Supabase, région UE** (Francfort/Paris) | Postgres + Auth + RLS intégrés ; résidence UE = pilier RGPD ; pas de lock-in (export SQL standard) |
| Auth | **Anonyme d'abord, compte ensuite** (account linking, même UID) | Préserve « jouable sans compte » ; la progression n'est jamais perdue |
| RGPD | Pseudonymisation par construction + export/suppression in-app | PII uniquement dans `auth.users` ; tables de jeu = UID + pseudo |
| Mondial | Une seule région UE | Légal partout (sauf Chine — non distribuée ; Russie — à exclure ou ignorer) ; RGPD = régime le plus strict, couvre LGPD/CCPA/etc. ; gameplay 100 % local → latence indolore |
| Environnements | 2 projets Supabase + 2 flavors Android (`dev`/`prod`) | `Orderix Dev` (`com.orderix.app.dev`) installable à côté de la prod |
| Anti-triche | Validations dans `submit_score()` (RPC security definer) | Tue la triche console triviale : jours futurs, temps < 300 ms, rejeu, usurpation d'UID |

## Phases

1. ✅ **Fondations** (ce commit) — schéma SQL (`supabase/migrations/0001_init.sql`),
   config par environnement (`config/*.json` → `set-env.js` → `www/scripts/env.js`),
   flavors Android, scripts npm (`android:dev`, `android:prod`, `android:release`).
2. ⬜ **Auth anonyme + sync** — client Supabase dans l'app, UID au premier lancement,
   `orderix_local_results` devient un cache synchronisé (le local reste la source hors-ligne).
3. ⬜ **Comptes & RGPD** — linking e-mail/Google/Facebook, écran compte,
   export (`export_my_data()`) et suppression in-app + page web (exigence Play Store),
   politique de confidentialité FR/EN, import des données Google Sheets.
4. ⬜ **Industrialisation** — CI GitHub Actions (smoke-test + APK staging sur push,
   `.aab` signé sur tag), keystore dans les secrets, montée de version automatique.

## Prérequis côté propriétaire (non délégables)

- Créer le compte Supabase + les 2 projets (voir `supabase/README.md`) et coller
  URL/clé anon dans `config/orderix.{staging,prod}.json`.
- Phase 3 : apps OAuth dans Google Cloud Console et Meta for Developers.
- Phase 4 : keystore de signature (`keytool`), compte Play Console (25 $ une fois).

## Build par environnement

```powershell
npm test                 # smoke-test jsdom (55 vérifications)
npm run android:dev      # APK staging  → android/app/build/outputs/apk/dev/debug/
npm run android:prod     # APK prod     → android/app/build/outputs/apk/prod/debug/
npm run android:release  # AAB signé prod (après config du keystore)
```

`www/scripts/env.js` est **généré** (ne pas éditer) ; il expose `ORDERIX_ENV`
(gasUrl tant que GAS est le backend actif, supabaseUrl/Key ensuite).
