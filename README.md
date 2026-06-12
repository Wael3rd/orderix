# Orderix — 365 jours d'agilité mentale

Jeu mobile Android de puzzles quotidiens : chaque jour de l'année propose un défi
d'observation, de tri, de mémoire ou de calcul, chronométré, avec classement en ligne.

**Cible** : amatrices et amateurs de jeux cérébraux (esprit NYT Games / sudoku).
**Design** : « papeterie éditoriale » — papier crème, encre prune, accents sauge,
terracotta et or, typographies Fraunces & Karla (embarquées, fonctionne hors-ligne).

## Structure

| Dossier | Rôle |
|---|---|
| `www/` | L'application complète (HTML/CSS/JS vanilla, sans build) |
| `android/` | Coquille native générée par Capacitor |
| `assets/` | Sources SVG de l'icône et du splash screen |
| `AUDIT.md` | Audit complet du code d'origine (juin 2026) |

## Développement

```powershell
# Aperçu web : ouvrir www/index.html dans un navigateur

# Test de fumée (démarre les 47 modes dans jsdom)
node smoke-test.js

# Synchroniser www/ vers le projet Android
npx cap sync android

# Construire l'APK de debug
cd android
.\gradlew assembleDebug
# → android/app/build/outputs/apk/debug/app-debug.apk
```

Prérequis APK : JDK 17 et Android SDK (platform 34 + build-tools 34).
Le chemin du SDK se règle dans `android/local.properties` (`sdk.dir=...`).

## Fonctionnalités

- **Puzzle du jour** : le jour de l'année détermine le défi ; une seule tentative par puzzle.
- **Calendrier annuel** : 365 cases regroupées par mois, progression visible.
- **Série et statistiques** : jours consécutifs réussis, record, taux de réussite.
- **Jouable sans compte** : la progression est locale ; le pseudo n'est requis que pour
  publier ses temps au classement (Google Apps Script + Google Sheets).
- **Hors-ligne** : polices embarquées, config serveur mise en cache, démarrage instantané.
- 47 modes de jeu × 50 types visuels, clavier AZERTY tactile pour les épreuves de lettres,
  retours haptiques, pluie de pétales en cas de victoire.

## Publier sur le Play Store (étapes restantes)

1. Créer une clé de signature : `keytool -genkey -v -keystore orderix.keystore -alias orderix -keyalg RSA -keysize 2048 -validity 10000`
2. Configurer la signature dans `android/app/build.gradle` (bloc `signingConfigs`).
3. `cd android && .\gradlew bundleRelease` → fichier `.aab` à téléverser sur la Play Console.
