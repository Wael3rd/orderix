# Audit qualité gameplay — Orderix v2.1 (juillet 2026)

Constat de départ (fondé) : « la qualité générale est un peu nulle ». Cet audit
compare les 46 modes existants aux mécaniques de référence du casual, identifie
les défauts **structurels**, et documente les corrections appliquées.

---

## 1. Les 4 maladies structurelles (avant correction)

### A. La « mort en une touche » — le pire défaut
16 modes se jouaient en **un seul tap** : findMax, findMin, median, findOdd,
findTargetUI, sumTarget… Gagné ou perdu en 0,8 seconde. Aucun des jeux de
référence ne fait ça, et pour cause : pas d'arc de session, pas de montée de
tension, pas d'expression de compétence — et combiné à « une tentative par
jour », c'est vécu comme une gifle. Wordle donne 6 essais ; Lumosity enchaîne
des dizaines de micro-décisions ; Royal Match laisse rejouer.

### B. La fausse variété « filtre CSS »
10 des 46 modes étaient **le même jeu** avec une nuisance visuelle par-dessus :
spinSort/pulseSort/danceSort/colorSort/gravitySort = sortAsc qui gigote ;
wobbleMax/flickerMax/invertMin = findMax qui clignote. L'agacement n'est pas de
la difficulté (« fake difficulty ») : le joueur ne devient pas meilleur, il
attend juste que ça s'arrête de bouger.

### C. Zéro courbe de difficulté
Chaque mode se jouait à l'identique au jour 5 et au jour 300. Les références
(Water Sort : tubes et couleurs qui augmentent ; Schulte : grilles qui
grandissent) escaladent TOUJOURS.

### D. Zéro boucle de flow
Les moteurs à dopamine du casual — combo/chaîne à préserver (NYT Tiles),
quasi-victoire, état visible qui se remplit — étaient absents.

## 2. Benchmark : ce que font les meilleurs

| Référence | Mécanique clé | Leçon pour Orderix |
|---|---|---|
| **Water/Ball Sort** (milliards de DL — du TRI !) | état visible, planification, contrainte simple, escalade | le tri est un genre-roi, l'exploiter en profondeur |
| **Table de Schulte** (70 ans de brain training) | toucher 1→N dans l'ordre, balayage visuel, flow | LE jeu d'ordre par excellence → **La Chaîne** |
| **Timeline / jeux d'insertion** | placer un élément dans une suite ordonnée | ordre + déduction calme → **L'Insertion** |
| **Lumosity Speed Match** | décision binaire sous chrono qui accélère, vies | ordre + réflexe → **Tri Cascade** |
| **NYT Tiles** | préserver sa chaîne = tension douce | vies/combo plutôt que mort subite |
| **Goods Sort / triple-shelf** | catégoriser sous contrainte spatiale | piste future (drag & drop d'étagères) |

## 3. Corrections appliquées (v2.1)

### Supprimés — 8 modes « reskins par irritation »
`spinSort, pulseSort, danceSort, colorSort, gravitySort, wobbleMax, flickerMax,
invertMin`. Conservés parmi les variantes car ils ont un VRAI twist cognitif :
flashSort/blindSort (mémoire), mirrorSort (inversion spatiale), shuffleSort/
blackout (replanification), shrinkSort (pression temporelle).

### Système « 3 manches + 1 joker » — fin de la mort en une touche
Tous les modes à touche unique (`rounds: 3` dans data.js) deviennent :
- **3 manches** à plateau croissant (60 % → 100 % → 140 % d'éléments) ;
- **1 joker** : la première erreur est pardonnée (l'élément fautif est neutralisé,
  message « Joker utilisé »), la seconde perd — near-miss au lieu de guillotine ;
- HUD manche/joker au-dessus du plateau.
Implémentation : `startGenericRound()` relançable (gameLoop.js),
`genericRoundWin/Fail` + `consumeShield` (logic.js).

### 3 nouveaux modes phares (100 % « l'art d'ordonner »)
1. **La Chaîne** (`orderChain`) — Schulte × Orderix : toucher les éléments en
   ordre croissant ; les maillons trouvés restent visibles (balayage parmi le
   bruit) ; 3 manches de plus en plus denses ; 3 vies. Flow pur.
2. **L'Insertion** (`insertion`) — Timeline : une rangée ordonnée grandit,
   chaque nouvel élément doit être inséré au bon emplacement ; 2 vies ;
   l'erreur fait réessayer le même élément (on apprend de chaque échec).
3. **Tri Cascade** (`cascade`) — Speed Match : plus petit / plus grand que la
   référence, compte à rebours qui passe de 3,5 s à 1,4 s, la référence change
   aux tiers du flux ; 3 vies.
Les trois fonctionnent avec les 50 types visuels → ~150 combinaisons inédites.

### Premiers jours réparés
Avant : jours 1 à 50 = « Tri Croissant » 50 fois (la première semaine d'une
joueuse = 7× le même jeu !). Maintenant : rotation des 10 meilleurs modes
(`STARTER_ROTATION`) sur les 50 types.

**Bilan : 46 modes inégaux → 41 modes (38 + 3 phares), zéro mode « une touche », zéro reskin.**

## 4. Tier list après v2.1 (pour arbitrages futurs)

- **S** — orderChain, insertion, cascade, connectDots, pairs, dobble
- **A** — guessNumber, conveyorBelt, speedQuiz, flashSort, blindSort, sortAsc/Desc,
  chasse-famille (avec manches+joker), speedLetters
- **B** — mathQuiz×4, typingTest, sequenceHunt, avoidMin, mirrorSort, shuffleSort,
  blackout, shrinkSort, sumTarget/mathDiff, dragDropMath, evensAsc/oddsDesc
- **C (à surveiller via les avis 👍/👎)** — reflex (peu « cérébral »), cursorSort
  (passif), doubleTapMax/longPressMin (le geste est le seul twist)

## 5. Pistes non implémentées (backlog design)

- **Tubes** — adaptation Water Sort : réorganiser des piles de valeurs pour que
  chaque tube soit trié ; gros potentiel, demande un vrai moteur drag & drop.
- **Étagères** — Goods Sort : regrouper des séries ordonnées sur des étagères.
- **Combo chronométré global** : multiplicateur de score sur les enchaînements
  rapides (nécessite un modèle de score au-delà du temps brut).
- **Mode zen quotidien** : une variante sans chrono pour le soir (l'heure bleue…).
- **La File** — plusieurs guichets au lieu d'une seule file (issue #12, à creuser).
- **Dominos** — disposition verticale de la chaîne au lieu d'horizontale, à tester
  (issue #22 ; retour incertain de la joueuse elle-même, pas encore tranché).
- **La Suite** — jugé peu engageant par la testeuse même avec les explications
  (issue #21) ; revoir l'intérêt du mode dans une passe globale sur la vague de
  janvier plutôt qu'un correctif isolé.

Sources benchmark : [AdLock — sorting games](https://adlock.com/blog/sorting-games-without-adds/),
[Capermint — water sort mechanics](https://www.capermint.com/blog/water-sort-puzzle-bottle-game/),
[Schulte table](https://schulte-table.com/), [Lumosity](https://www.lumosity.com/en/brain-games/),
[NYT Tiles](https://www.tilesgame.org/).
