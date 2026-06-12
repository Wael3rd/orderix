# Supabase — mise en place des environnements Orderix

Deux projets distincts, même schéma : `orderix-staging` (tests) et `orderix-prod`.

## 1. Créer les projets (à faire une fois, ~10 min)

1. Compte sur [supabase.com](https://supabase.com) → **New project** ×2 :
   - Nom : `orderix-staging` puis `orderix-prod`
   - **Region : Europe (Frankfurt `eu-central-1` ou Paris `eu-west-3`)** — c'est le pilier de la conformité RGPD, ne pas choisir une région US.
   - Mot de passe base : générer et stocker dans un gestionnaire de mots de passe.
2. Dans chaque projet → **SQL Editor** → coller et exécuter `migrations/0001_init.sql`.
3. **Authentication → Sign In / Up** :
   - Activer **Anonymous sign-ins** (le cœur du modèle « jouable sans compte »).
   - Activer **Email** (confirmations : on peut désactiver la confirmation en staging).
   - Google / Facebook : à configurer en phase 3 (nécessite les consoles développeur Google Cloud et Meta).
4. Récupérer pour chaque projet : **Settings → API** → `Project URL` et `anon public key`.

## 2. Brancher l'app

Coller URL + clé anon dans les fichiers de config (ces clés sont *publiques par design*,
la sécurité vient des policies RLS, pas du secret de la clé) :

- `config/orderix.staging.json`
- `config/orderix.prod.json`

Puis générer l'environnement et builder :

```powershell
npm run env:staging   # écrit www/scripts/env.js + cap sync
npm run env:prod
```

## 3. Garanties du schéma

| Exigence | Comment |
|---|---|
| Pseudonymisation | Aucune PII dans les tables de jeu ; l'e-mail reste dans `auth.users` |
| Une tentative / jour | Clé primaire `(user_id, year, day)` — incontournable même en trichant côté client |
| Anti-triche basique | `submit_score()` : refuse jours futurs, temps < 300 ms, usurpation d'identité |
| RGPD art. 17 (effacement) | `on delete cascade` depuis `auth.users` : supprimer le compte efface tout |
| RGPD art. 20 (portabilité) | `export_my_data()` → JSON complet de ses propres données |
| Classement public minimal | `get_leaderboard()` n'expose que pseudo + temps des victoires |

## 4. Migration des données existantes (phase 3)

L'export CSV du Google Sheet pourra être importé dans `results` via le SQL Editor
(les anciens scores n'ayant pas d'UID, ils seront rattachés à des profils « legacy »
créés à la volée, ou simplement conservés dans une table d'archive consultable).
