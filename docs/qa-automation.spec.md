# Orderix — Spécification QA automatisée par IA

## Objectif

Permettre à Claude Code de tester l'app Orderix de bout en bout sur un émulateur Android,
de manière autonome : naviguer dans chaque écran, jouer des parties, vérifier la cohérence
visuelle, mesurer la performance, et produire un rapport sans intervention humaine.

---

## 1. Infrastructure requise

### 1.1 · Émulateur Android (AVD)

| Élément | Valeur |
|---|---|
| SDK déjà installé | `C:\Android\sdk` (platform 34, build-tools 34, JDK 17) |
| À ajouter | `system-images;android-34;google_apis;x86_64` + un AVD nommé `orderix_test` |
| Config AVD | Pixel 6a, 1080×2400, RAM 2 Go, 4 Go de stockage interne |
| Headless | `emulator -avd orderix_test -no-window -no-audio -gpu swiftshader_indirect` |
| Vérification | `adb devices` doit lister l'émulateur, `adb shell getprop ro.build.version.sdk` = 34 |

### 1.2 · Serveur MCP : claude-in-mobile

| Élément | Valeur |
|---|---|
| Repo | https://github.com/AlexGladkov/claude-in-mobile |
| Installation | `npm install -g claude-in-mobile` (ou local dans le projet) |
| Config Claude Code | Ajouter dans `.claude/settings.json` → `mcpServers` |
| Outils exposés | `device`, `input`, `screen`, `ui`, `app`, `system`, `flow_batch`, `flow_run` |
| Dépendances | adb dans le PATH, émulateur démarré |

### 1.3 · Baselines visuelles

| Élément | Valeur |
|---|---|
| Dossier | `tests/baselines/` (versionné dans git) |
| Format | PNG, nommé par écran : `home.png`, `calendar.png`, `game-intro-sortAsc.png`… |
| Génération initiale | Un premier run « golden » qui capture et enregistre les baselines |
| Seuil de diff | 2 % de pixels différents = avertissement, 5 % = échec |

---

## 2. Scénarios de test

### 2.1 · Navigation et structure (priorité haute)

| # | Scénario | Actions | Vérification |
|---|---|---|---|
| N1 | Démarrage à froid | Installer APK, lancer, attendre boot loader | Boot loader visible ≥ 1 s, écran d'accueil affiché, HUD joueuse visible |
| N2 | Onglets | Tapper Jour → Année → Classement → Profil → Jour | Chaque écran s'affiche, l'onglet actif change, pas de crash |
| N3 | Calendrier → jour → retour | Tapper Année, tapper une case, vérifier l'intro du jour, tapper ←  | Retour au calendrier (pas à l'accueil) — régression du bug corrigé |
| N4 | Accueil → jour → retour | Tapper « Jouer » sur la carte du jour, tapper ← | Retour à l'accueil |
| N5 | Profil : pseudo | Tapper Profil, tapper le champ, taper « TestBot », tapper Valider | Message de vérification affiché (réseau ou erreur — peu importe, pas de crash) |
| N6 | Jour déjà joué | Après N7 (victoire), retourner au même jour | Panneau « Réussi » affiché, pas de bouton « Commencer » |

### 2.2 · Gameplay complet (priorité haute)

| # | Scénario | Actions | Vérification |
|---|---|---|---|
| G1 | Tri croissant — victoire | Ouvrir jour 1, « Commencer », tapper les items du plus clair au plus foncé (luminosité), « Valider » | Message « Ordre parfait ! », panneau résultat visible, temps > 0, confettis (optionnel : vérifier visuellement) |
| G2 | Tri croissant — défaite | Ouvrir un jour de tri non joué, « Commencer », tapper dans un ordre volontairement faux, « Valider » | Correction affichée (lignes entre réponse et solution), panneau résultat « Raté » |
| G3 | Chasse au Max — victoire | Ouvrir un jour findMax, « Commencer », identifier visuellement le plus grand (ou tricher : lire `dataset.value`), tapper | Message victoire |
| G4 | Chasse au Max — défaite | Tapper le plus petit | Message défaite, bonne réponse entourée |
| G5 | Mode Reflex | Ouvrir un jour reflex, « Commencer », tapper chaque cible dès qu'elle apparaît | Toutes touchées → victoire. Vérifier : **aucun lag perceptible** (< 100 ms entre touch et disparition) |
| G6 | Dactylographie | Ouvrir un jour typingTest, « Commencer », tapper les lettres du clavier AZERTY dans l'ordre demandé | Texte recopié → victoire. Vérifier : le clavier est bien à l'écran (pas de clavier système Android) |
| G7 | Tapis Roulant | Ouvrir un jour conveyor, « Commencer », tapper les bonnes réponses | 3 premiers corrects → vérifier que le compteur avance et le tapis défile. Vérifier : **≤ 7 cellules DOM** dans le belt |
| G8 | Abandon | Ouvrir un jour non joué, « Commencer », tapper ←, confirmer « Oui » | Marqué comme abandonné, jour consommé (pas de seconde tentative) |

### 2.3 · Feedback et classement (priorité moyenne)

| # | Scénario | Actions | Vérification |
|---|---|---|---|
| F1 | Avis après partie | Après G1, tapper « ♥ Beaucoup » | Classement affiché (ou « indisponible hors-ligne »), boutons Partager et Accueil visibles |
| F2 | Passer l'avis | Après G2, tapper « Passer » | Même résultat que F1 |
| F3 | Partage | Après F1, tapper « Partager » | Pas de crash (le clipboard ou le share sheet s'ouvre) |

### 2.4 · Régression visuelle (priorité moyenne)

| # | Écran | Baseline | Seuil |
|---|---|---|---|
| V1 | Accueil (premier lancement, pas de pseudo) | `home-fresh.png` | 2 % |
| V2 | Calendrier (vide) | `calendar-empty.png` | 2 % |
| V3 | Profil (vide) | `profile-empty.png` | 2 % |
| V4 | Intro de jeu (jour 1, tri croissant luminosité) | `game-intro-day1.png` | 3 % (les valeurs ont un jitter aléatoire) |
| V5 | Plateau en cours (jour 1) | `game-board-day1.png` | 5 % (items mélangés aléatoirement) |
| V6 | Résultat victoire | `result-win.png` | 3 % |
| V7 | Skeleton loader (classement en chargement) | `skeleton-loading.png` | 2 % |

### 2.5 · Performance (priorité moyenne)

| # | Mesure | Comment | Seuil |
|---|---|---|---|
| P1 | FPS pendant transition d'écran | `adb shell dumpsys gfxinfo com.orderix.app.dev` avant/après changement d'onglet | Janky frames < 10 % |
| P2 | FPS pendant partie Reflex | Même commande pendant le mode cibles mobiles | Janky frames < 15 % |
| P3 | FPS pendant Tapis Roulant | Même commande pendant le défilement | Janky frames < 10 % |
| P4 | Mémoire au repos | `adb shell dumpsys meminfo com.orderix.app.dev` sur l'accueil | RSS < 120 Mo |
| P5 | Mémoire en partie (conveyor) | Même commande en plein tapis roulant | RSS < 180 Mo |
| P6 | Temps de démarrage à froid | `adb shell am start -W` et lire `TotalTime` | < 2500 ms |

### 2.6 · Accessibilité et robustesse (priorité basse)

| # | Scénario | Vérification |
|---|---|---|
| A1 | Rotation d'écran | Verrouillée en portrait (pas de crash si le système tourne quand même) |
| A2 | Multitâche | Mettre en arrière-plan, revenir : l'état est préservé |
| A3 | Taille de texte système × 1.3 | L'UI ne déborde pas, les boutons restent tapables |
| A4 | Mode sombre système | L'app reste en thème clair (pas de styles Android sombres qui cassent la palette) |

---

## 3. Stratégie d'interaction

### Comment l'agent identifie les éléments

Orderix est une WebView Capacitor → deux méthodes complémentaires :

1. **Chrome DevTools Protocol (CDP)** via `adb forward` sur le socket WebView :
   - `document.querySelector('#daily-num').textContent` → lire le numéro du jour
   - `document.querySelector('.btn-primary').click()` → toucher « Jouer »
   - `board.querySelectorAll('.item')` → lire les `dataset.value` pour trier correctement
   - Fiable à 100 % pour tout ce qui a un id ou un sélecteur CSS

2. **Coordonnées écran** (adb input tap x y) pour les interactions bas-niveau :
   - Cibles mobiles en mode Reflex (positions dynamiques)
   - Clavier AZERTY (positions des touches connues par layout)

### Comment l'agent « joue » un tri correctement

```
1. Via CDP : récupérer tous les .item avec leur dataset.value
2. Trier les valeurs par ordre croissant
3. Cliquer chaque item dans cet ordre (via CDP ou coordonnées)
4. Cliquer le bouton « Valider »
5. Vérifier que le panneau résultat affiche « Réussi »
```

Même logique pour findMax (cliquer le plus grand), findMin, etc. — l'agent lit les valeurs
dans le DOM et calcule la bonne réponse. Ce n'est pas de la triche : c'est exactement ce que
ferait un testeur humain avec les DevTools ouverts.

---

## 4. Format du rapport de test

Après chaque run, l'agent génère `tests/report.json` :

```json
{
  "timestamp": "2026-06-24T08:30:00Z",
  "device": "orderix_test (emulator, API 34)",
  "apkVersion": "2.1",
  "duration_s": 120,
  "results": [
    { "id": "N1", "name": "Démarrage à froid", "status": "pass", "duration_ms": 3200 },
    { "id": "G1", "name": "Tri croissant — victoire", "status": "pass", "duration_ms": 8500 },
    { "id": "V1", "name": "Régression accueil", "status": "warn", "diff_pct": 1.8, "screenshot": "screenshots/home.png" },
    { "id": "P1", "name": "FPS transition", "status": "pass", "janky_pct": 4.2, "total_frames": 186 }
  ],
  "summary": { "total": 28, "pass": 26, "warn": 1, "fail": 1 },
  "performance": {
    "cold_start_ms": 2100,
    "memory_idle_mb": 95,
    "memory_peak_mb": 142
  }
}
```

Et un résumé humain lisible dans `tests/report.md`.

---

## 5. Intégration

### 5.1 · Commande unique

```powershell
npm run qa          # lance l'émulateur, installe l'APK, exécute les tests, produit le rapport
```

### 5.2 · CI (phase 4 du plan PRO)

Même pipeline dans GitHub Actions avec un runner qui a l'Android SDK + émulateur :
push sur `main` → build APK staging → `npm run qa` → rapport en artifact.

### 5.3 · Baselines

Les baselines visuelles vivent dans `tests/baselines/` (versionnées).
Quand un changement visuel est intentionnel : `npm run qa -- --update-baselines`.

---

## 6. Prérequis à installer

| Étape | Commande | Durée estimée |
|---|---|---|
| Image système émulateur | `sdkmanager "system-images;android-34;google_apis;x86_64"` | ~5 min (1 Go à télécharger) |
| Créer l'AVD | `avdmanager create avd -n orderix_test -k "system-images;android-34;google_apis;x86_64" -d pixel_6a` | 10 s |
| claude-in-mobile | `npm install -g claude-in-mobile` | 30 s |
| Config MCP | Ajouter dans `.claude/settings.json` | 1 min |
| Premier run (baselines) | `npm run qa -- --update-baselines` | ~3 min |
