# Audit complet — Orderix (juin 2026)

Périmètre : 100 % du code lu (24 fichiers JS/CSS/HTML, ~130 Ko). Constat global :
le moteur de jeu est fonctionnel et astucieux (50 types visuels × ~40 modes = 365 niveaux
procéduraux), mais l'app est une page web de bureau adaptée tant bien que mal au mobile,
avec plusieurs gameplays cassés sur écran tactile et une UX agressive.

---

## 1. Gameplays cassés ou injouables sur mobile (bloquant pour un APK)

| Mode | Problème | Décision |
|---|---|---|
| `hideHover` (Fantômes) | Repose sur `:hover` — n'existe pas au tactile. Les items restent invisibles, taper = sélectionner à l'aveugle. | **Supprimé** |
| `chaseMin` (Le Fuyard) | Repose sur `mousemove` — au tactile l'item ne fuit jamais, le défi disparaît. | **Supprimé** |
| `blurMax` (Myope Max) | Le dé-floutage utilise `:active` : au tactile, presser pour « voir » déclenche aussi le clic = défaite quasi garantie. | **Supprimé** |
| `typingTest` (Dactylographie) | 30+ `<input maxlength=1>` : clavier virtuel Android instable (autocorrection, focus perdu, zoom). | **Refait** : clavier tactile à l'écran |
| `speedLetters` (Lettres Chrono) | Même problème d'inputs physiques + chrono 5 s incompatible avec l'ouverture du clavier virtuel. | **Refait** : clavier tactile à l'écran |
| `sumTarget` / `mathDiff` | La « cible » (somme de 2 valeurs) est rendue visuellement : pour les types visuels (luminosité, teinte, opacité…) la somme sort de la plage affichable (ex. opacité 0,8 + 0,6 = 1,4 → cible irreprésentable). | **Corrigé** : ces modes sont forcés sur des types numériques lisibles |
| `speedQuiz` règles « commence par / finit par » | Appliquées à des types purement visuels (pastilles de couleur…) : la question porte sur la valeur numérique interne que le joueur ne voit pas. Injouable. | **Corrigé** : règles texte réservées aux types affichant du texte |
| `longPressMin` | L'appui long déclenche le menu contextuel/sélection de texte dans la WebView. | **Corrigé** : `contextmenu` neutralisé globalement |

## 2. Bugs techniques

- **Styles du plateau jamais réinitialisés** : chaque mode pose des styles inline sur
  `#game-board` (`height:350px`, `position:relative`, `overflow:hidden`, `touchAction`…)
  que `startGame()` ne nettoie pas tous → un mode « pollue » le suivant
  (ex. après Cibles Mobiles, un tri hérite d'une hauteur fixe de 350 px).
  → Corrigé : fonction centrale `resetBoard()`.
- **`beforeunload` masque la page** (`document.body.style.display='none'`) : si
  l'utilisateur annule la fermeture, la page reste **blanche définitivement** — rien ne
  restaure l'affichage. → Supprimé (sans objet dans une app native).
- **`generateValues()` est déterministe** : pour un type et un nombre d'éléments donnés,
  les valeurs sont toujours identiques (seul l'ordre change). Tous les joueurs, toutes
  les parties : mêmes valeurs → triche facile, rejouabilité nulle. → Corrigé : jitter
  aléatoire en conservant l'espacement perceptif minimal.
- **`main.js` est un fichier éventré** : restes de commentaires orphelins, code mort,
  indentation d'un ancien fichier monolithique (`backup_index.html`, 165 Ko, encore
  dans le repo). → Réécrit ; backup supprimé.
- **Médiane fausse pour un nombre pair d'éléments** (prend l'élément `n/2` au lieu de la
  moyenne des deux centraux) — acceptable en jeu, mais le libellé est trompeur. Conservé
  (toujours un élément cliquable), documenté.
- **`conveyor`** : le tapis avance par pas fixes de 80 px alors que les types « taille /
  largeur / hauteur » changent la largeur réelle des items → désalignement progressif du
  cadre de visée. → Corrigé : taille de cellule verrouillée.

## 3. UX / produit

- **Pseudo obligatoire + vérification serveur avant de pouvoir jouer** : friction
  maximale au premier lancement. → Le jeu devient jouable immédiatement ; le pseudo
  n'est demandé que pour publier au classement. Progression stockée en local.
- **Vocabulaire punitif** : « RAGE QUIT », score `-999999`, « Danse Macabre »…
  inadapté à la cible. → Reformulé (« Partie abandonnée », etc.).
- **Aucune identité visuelle** : Arial, bleu Bootstrap (#007bff), sidebar gris
  administratif, 365 boutons identiques empilés. → Refonte complète (voir README).
- **Pas d'écran d'accueil, pas de notion de « puzzle du jour »**, pas de progression
  visible (série, statistiques) alors que la structure « 365 jours » s'y prête.
- **Anti-triche côté client uniquement** : le score est calculé et envoyé par le client
  (`fetch` vers Google Apps Script, URL en clair). Toute personne ouvrant la console
  peut soumettre n'importe quel temps. Non corrigeable sans backend réel — connu, assumé.

## 4. Architecture

- 100 % variables globales, ordre de chargement des `<script>` critique, collisions de
  noms silencieuses. Conservé (pas de build step = simplicité assumée) mais réorganisé
  par écrans/­responsabilités, et chaque fichier documenté.
- Le fetch de config GAS bloque la construction de la liste des jours ; le fallback
  `.catch` existe mais l'app affichait « Chargement… » sans timeout. → Timeout + cache
  local de la config pour un démarrage hors-ligne instantané (indispensable en APK).

## 5. Ce qui marche bien (conservé tel quel)

- Le système 50 types × modes → 365 jours procéduraux (`data.js`) : excellente idée.
- `applyStyle()` (rendu visuel des 50 types) : robuste, autonome, réutilisé tel quel
  (recoloré à la nouvelle palette).
- `connectDots`, `conveyor`, `dobble`, `guessNumber`, `mathQuiz`, `speedQuiz` (règles
  min/max), `dragDrop` (déjà tap-compatible), `reflex` : sains sur tactile.
- La récupération de partie abandonnée (`orderix_pending_game`) et l'écriture
  localStorage+cookie.
