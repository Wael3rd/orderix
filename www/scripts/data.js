// ─── Catalogue des modes de jeu ──────────────────────────────────
// Audit gameplay (juin 2026, v2.1) — voir docs/gameplay-audit.md :
//  · SUPPRIMÉS (reskins « par irritation » d'un même jeu, fausse variété) :
//    spinSort, pulseSort, danceSort, colorSort, gravitySort (clones de sortAsc),
//    wobbleMax, flickerMax, invertMin (clones de findMax).
//  · `rounds: 3` : les modes « une seule touche » deviennent 3 manches
//    progressives avec 1 joker (une erreur pardonnée) — fin du « perdu en 0,8 s ».
//  · NOUVEAUX modes phares : orderChain (Schulte), insertion (Timeline),
//    cascade (tri de flux façon Speed Match).
// `desc` : consigne affichée sur l'écran d'introduction.
// `typeAgnostic` : le mode n'utilise pas le type visuel du jour (titre simplifié).

const GAME_MODES = {
    // ── Modes phares « l'art d'ordonner » ──
    orderChain: { name: "La Chaîne", isOrderChain: true, desc: "Touchez les éléments du plus petit au plus grand, sans casser la chaîne. 3 manches, 3 vies." },
    insertion: { rev: 1, name: "L'Insertion", isInsertion: true, desc: "Un élément arrive : touchez l'emplacement exact où il s'insère dans la rangée ordonnée, avant la fin de la barre de temps. 2 vies." },
    cascade: { name: "Tri Cascade", isCascade: true, desc: "Plus petit ou plus grand que la référence ? Triez le flux avant la fin du temps — ça accélère ! 3 vies." },

    // ── Vague janvier 2027 : les 30 gameplays d'ordonnancement (audit v2.2) ──
    fontaine: { name: "La Fontaine", isFontaine: true, typeAgnostic: true, desc: "Les balles rebondissent dans la boîte : éclatez-les de la plus petite à la plus grande. 2 manches, 3 vies." },
    metronome: { name: "Le Métronome", isMetronome: true, typeAgnostic: true, desc: "Touchez les nombres du plus petit au plus grand avant la fin de chaque barre de temps. Le rythme accélère doucement. 2 vies." },
    code: { rev: 1, name: "Le Code", isCode: true, typeAgnostic: true, desc: "Trouvez le code secret de 4 chiffres en 6 essais : après chaque essai, VERT = bien placé, OR = présent ailleurs, GRIS = absent. Façon Wordle !" },
    memoCroissant: { rev: 2, name: "Mémo Croissant", isMemoCroissant: true, typeAgnostic: true, desc: "Retournez deux cartes à la fois pour retrouver les paires, dans l'ordre : d'abord la paire 1, puis la 2, puis la 3… Sans pression : pas de vies, seul le chrono compte." },
    solitaire: { rev: 2, name: "Le Solitaire", isSolitaire: true, typeAgnostic: true, desc: "Un vrai solitaire, en petit : descendez les cartes en alternant les couleurs, retournez les cartes cachées, et montez les 1→10 aux deux fondations. Donne toujours gagnable, annulation illimitée." },
    blocs: { rev: 2, name: "Blocs", isBlocs: true, typeAgnostic: true, desc: "GLISSEZ les pièces sur la grille : chaque ligne ou colonne complète s'efface. Effacez 6 lignes sans saturer la grille !" },
    dominoOrder: { rev: 1, name: "Dominos", isDominoOrder: true, typeAgnostic: true, desc: "Prolongez la chaîne par ses extrémités. Attention : l'ordre de pose compte, ne vous retrouvez pas bloquée !" },
    paires: { rev: 2, name: "Paires Reliées", isPaires: true, typeAgnostic: true, desc: "Reliez les deux tuiles de même numéro par un chemin d'au plus 2 virages, dans l'ordre que vous voulez. Le tour du plateau compte comme passage." },
    tubes: { rev: 1, name: "Les Tubes", isTubes: true, typeAgnostic: true, desc: "Reversez les jetons pour reconstituer HUIT piles parfaitement ordonnées, sur dix tubes. Annulation illimitée." },
    swapSort: { rev: 1, name: "Échange Minimal", isSwapSort: true, typeAgnostic: true, desc: "Triez la colonne (petit en haut) en échangeant deux VOISINES à la fois — les échanges possibles s'illuminent. Budget limité !" },
    boulons: { name: "Les Boulons", isBoulons: true, typeAgnostic: true, desc: "Réempilez les écrous du plus large au plus fin sur chaque vis. Annulation illimitée." },
    grille: { name: "La Grille", isGrille: true, typeAgnostic: true, desc: "Remettez les nombres dans l'ordre : on n'échange qu'avec les cases qui se touchent, diagonales comprises. 2 manches." },
    hanoi: { name: "La Tour", isHanoi: true, typeAgnostic: true, desc: "Déplacez la tour entière vers la droite — jamais un grand disque sur un petit. 22 coups maximum." },
    fileBloquee: { name: "La File", isFileBloquee: true, typeAgnostic: true, desc: "Faites passer les clientes au guichet dans l'ordre des tickets, grâce aux sièges d'attente." },
    mahjong: { rev: 1, name: "Le Mahjong", isMahjong: true, typeAgnostic: true, desc: "Tapez deux tuiles LIBRES identiques pour les faire s'envoler. Une tuile est libre si rien ne la recouvre. Videz tout le plateau !" },
    rangement: { name: "Le Rangement", isRangement: true, typeAgnostic: true, desc: "Trois petites scènes à ranger : crayons, livres, pots d'épices — chacun à sa place, dans l'ordre. 3 vies." },
    futoshiki: { name: "Plus Petit, Plus Grand", isFutoshiki: true, typeAgnostic: true, desc: "Chaque ligne et colonne contient 1-2-3-4, en respectant les signes. Un indice apparaît toutes les 8 secondes. 2 vies." },
    balance: { name: "La Balance", isBalance: true, typeAgnostic: true, desc: "Quatre pesées sous vos yeux : déduisez l'ordre du plus léger au plus lourd. 2 vies." },
    ordreCache: { name: "L'Ordre Caché", isOrdreCache: true, typeAgnostic: true, desc: "Devinez l'ordre secret des 5 gemmes en 6 essais. Les ✓ marquent les positions justes." },
    indices: { rev: 1, name: "Les Indices", isIndices: true, typeAgnostic: true, desc: "Lisez les indices, GLISSEZ les personnages pour reconstituer l'ordre exact, puis validez. 2 essais." },
    chronologie: { rev: 2, name: "Chronologie", isChronologie: true, typeAgnostic: true, desc: "Composez votre ordre, validez : les bonnes positions se verrouillent en vert, les autres reviennent. Recommencez jusqu'au sans-faute !" },
    deux048: { name: "2048", isDeux048: true, typeAgnostic: true, desc: "Glissez la grille : deux tuiles égales fusionnent en une plus grande (2+2=4, 4+4=8…). Créez la tuile 128 !" },
    embouteillage: { rev: 2, name: "L'Embouteillage", isEmbouteillage: true, typeAgnostic: true, desc: "Faites glisser les véhicules pour sortir les trois voitures dorées DANS L'ORDRE : la n°1, puis la 2, puis la 3. Annulation illimitée." },
    tripleOrdre: { name: "Triple Suite", isTripleOrdre: true, typeAgnostic: true, desc: "Prenez les tuiles libres pour réunir les trios de nombres qui se suivent (même couleur). Si la barre déborde à 7, c'est perdu !" },
    photoClasse: { name: "Photo de Classe", isPhotoClasse: true, typeAgnostic: true, desc: "Mémorisez qui est où, puis reformez le rang d'origine après le mélange. 2 vies." },
    bulles: { rev: 1, name: "Les Bulles", isBulles: true, typeAgnostic: true, desc: "Touchez un groupe d'au moins 3 bulles de la même couleur pour l'éclater — les bulles décrochées tombent aussi. Dégagez le ciel !" },
    piles: { rev: 1, name: "Les Piles", isPiles: true, typeAgnostic: true, desc: "Posez chaque pile de jetons sur l'un des 5 emplacements : les couleurs identiques qui se touchent fusionnent, et 7 jetons pareils s'envolent. 4 envols pour gagner !" },
    fusion: { name: "Fusion", isFusion: true, typeAgnostic: true, desc: "Glissez le doigt pour relier des nombres qui SE SUIVENT (1→2→3…) : la chaîne fusionne en une seule tuile plus grande. Fabriquez la tuile 8 !" },
    nonogramme: { rev: 1, name: "Le Nonogramme", isNonogramme: true, typeAgnostic: true, desc: "Les chiffres indiquent les blocs de cases à remplir sur chaque ligne et colonne. Remplissez la grille — les indices passent au vert quand c'est juste." },

    // ── Tris (validation par bouton) ──
    sortAsc: { name: "Tri Croissant", isSort: true, order: 1, desc: "Touchez les éléments du plus petit au plus grand, puis validez." },
    sortDesc: { name: "Tri Décroissant", isSort: true, order: -1, desc: "Touchez les éléments du plus grand au plus petit, puis validez." },
    evensAsc: { name: "Pairs Uniquement", isSort: true, order: 1, filter: 'even', desc: "Triez ces valeurs paires du plus petit au plus grand." },
    oddsDesc: { name: "Impairs Uniquement", isSort: true, order: -1, filter: 'odd', desc: "Triez ces valeurs impaires du plus grand au plus petit." },
    flashSort: { name: "Tri Flash", isSort: true, order: 1, flashHide: true, desc: "Observez bien : tout se cache après 2 secondes. Triez de mémoire, du plus petit au plus grand." },
    blindSort: { name: "Tri à l'Aveugle", isSort: true, order: 1, peekHide: true, desc: "Touchez une carte pour la révéler 1 seconde. Triez de mémoire." },
    mirrorSort: { name: "Monde Miroir", isSort: true, order: 1, cssClass: 'mirror-view', desc: "Tout est inversé en miroir. Triez du plus petit au plus grand." },
    shuffleSort: { name: "Tremblement", isSort: true, order: 1, shuffleTick: 2500, desc: "Triez du plus petit au plus grand… mais tout se mélange régulièrement !" },
    blackout: { name: "Coupure de Courant", isSort: true, order: 1, blackout: true, desc: "Triez du plus petit au plus grand malgré les coupures de lumière." },
    shrinkSort: { name: "Rétrécissement", isSort: true, order: 1, cssClass: 'shrink-anim', desc: "Triez vite : tout rétrécit et finira par disparaître !" },

    // ── Chasses (3 manches · 1 joker) ──
    findMax: { name: "Chasse au Max", findTarget: 'max', rounds: 3, desc: "Touchez l'élément le plus grand. 3 manches de plus en plus fournies, 1 joker." },
    findMin: { name: "Chasse au Min", findTarget: 'min', rounds: 3, desc: "Touchez l'élément le plus petit. 3 manches de plus en plus fournies, 1 joker." },
    median: { name: "La Médiane", findTarget: 'median', rounds: 3, desc: "Touchez la valeur du milieu : ni la plus petite, ni la plus grande. 3 manches, 1 joker." },
    flashMax: { name: "Mémoire Flash", findTarget: 'max', flashHide: true, rounds: 3, desc: "Mémorisez vite : tout se cache après 2 secondes. Touchez le plus grand. 3 manches, 1 joker." },
    doubleTapMax: { name: "Double Frappe", findTarget: 'max', requireDbTap: true, rounds: 3, desc: "Touchez DEUX FOIS rapidement l'élément le plus grand. 3 manches, 1 joker." },
    longPressMin: { name: "Pression Longue", findTarget: 'min', requireLong: true, rounds: 3, desc: "Maintenez le doigt appuyé sur l'élément le plus petit. 3 manches, 1 joker." },
    findOdd: { name: "L'Intrus", specialGen: 'odd', winOnOdd: true, rounds: 3, desc: "Un seul élément n'a aucun jumeau : démasquez-le. 3 manches, 1 joker." },
    findPair: { name: "Les Jumeaux", specialGen: 'pair', winOnPairs: true, rounds: 3, desc: "Deux éléments sont identiques : touchez-les tous les deux. 3 manches, 1 joker." },
    findTargetUI: { name: "Recherche Exacte", isTargetMatch: true, rounds: 3, desc: "Retrouvez l'élément identique au modèle affiché. 3 manches, 1 joker." },
    cursorSort: { name: "Curseur Fou", isTargetMatch: true, useCursor: true, desc: "Le halo doré va et vient. Touchez l'écran quand il entoure le modèle." },
    sumTarget: { name: "Addition Cible", isSum: true, forceType: 'numbers', rounds: 3, desc: "Touchez les 2 nombres dont la somme égale la cible. 3 manches, 1 joker." },
    mathDiff: { name: "Soustraction Cible", isDiff: true, forceType: 'numbers', rounds: 3, desc: "Touchez les 2 nombres dont la différence égale la cible. 3 manches, 1 joker." },

    // ── Parcours multi-étapes ──
    pairs: { name: "Paires", specialGen: 'pairs', isPairsMatch: true, desc: "Associez tous les éléments deux par deux." },
    avoidMin: { name: "Survie", avoidTarget: 'min', desc: "Touchez tous les éléments SAUF le plus petit. Ne le touchez jamais !" },
    sequenceHunt: { name: "Chasse en Série", isSequence: true, sequenceLength: 5, desc: "Retrouvez les éléments demandés, dans l'ordre, un par un." },
    reflex: { name: "Cibles Mobiles", isReflex: true, desc: "Touchez chaque cible dès qu'elle apparaît." },

    // ── Moteurs dédiés ──
    typingTest: { name: "Dactylographie", isTyping: true, typeAgnostic: true, desc: "Recopiez la suite de lettres avec le clavier à l'écran, le plus vite possible." },
    connectDots: { name: "Relier les Points", isConnectDots: true, typeAgnostic: true, desc: "Reliez les points dans l'ordre, sans lever le doigt." },
    mathQuizAdd: { name: "Calcul · Additions", isMathQuiz: true, mathOp: '+', typeAgnostic: true, desc: "3 calculs à résoudre : touchez la bonne réponse." },
    mathQuizSub: { name: "Calcul · Soustractions", isMathQuiz: true, mathOp: '-', typeAgnostic: true, desc: "3 calculs à résoudre : touchez la bonne réponse." },
    mathQuizMul: { name: "Calcul · Multiplications", isMathQuiz: true, mathOp: '*', typeAgnostic: true, desc: "3 calculs à résoudre : touchez la bonne réponse." },
    mathQuizDiv: { name: "Calcul · Divisions", isMathQuiz: true, mathOp: '/', typeAgnostic: true, desc: "3 calculs à résoudre : touchez la bonne réponse." },
    speedLetters: { name: "Lettres Chrono", isSpeedLetters: true, typeAgnostic: true, desc: "Recopiez les lettres avant la fin du temps. Plusieurs manches !" },
    dragDropMath: { name: "Pair ou Impair", isDragDrop: true, typeAgnostic: true, desc: "Touchez un nombre, puis sa boîte : PAIR ou IMPAIR." },
    speedQuiz: { name: "Quiz Rapide", isSpeedQuiz: true, desc: "5 manches : trouvez toutes les bonnes réponses à chaque question." },
    guessNumber: { name: "Le Juste Prix", isGuessNumber: true, typeAgnostic: true, desc: "Devinez le nombre caché grâce aux indices « plus » et « moins »." },
    dobble: { name: "Symbole Commun", isDobble: true, desc: "Un seul élément figure dans les 4 colonnes : sélectionnez-le dans chacune." }
};

// ─── 50 types visuels de base ────────────────────────────────────
const BASE_TYPES = [
    { id: 1, title: "Luminosité", type: "lightness" },
    { id: 2, title: "Saturation", type: "saturation" },
    { id: 3, title: "Teinte", type: "hue" },
    { id: 4, title: "Opacité", type: "opacity" },
    { id: 5, title: "Taille", type: "scale" },
    { id: 6, title: "Largeur", type: "length" },
    { id: 7, title: "Hauteur", type: "heightBar" },
    { id: 8, title: "Arrondi", type: "radius" },
    { id: 9, title: "Rotation", type: "rotation" },
    { id: 10, title: "Flou", type: "blur" },
    { id: 11, title: "Bordure", type: "borderWidth" },
    { id: 12, title: "Texte", type: "fontSize" },
    { id: 13, title: "Ombre", type: "shadow" },
    { id: 14, title: "Point central", type: "centerDot" },
    { id: 15, title: "Trait", type: "lineLength" },
    { id: 16, title: "Thermomètre", type: "thermometer" },
    { id: 17, title: "Batterie", type: "battery" },
    { id: 18, title: "Horloge", type: "clocks" },
    { id: 19, title: "Jauge", type: "gauge" },
    { id: 20, title: "WiFi", type: "wifi" },
    { id: 21, title: "Boussole", type: "compass" },
    { id: 22, title: "Position Y", type: "yPosition" },
    { id: 23, title: "Points", type: "dots" },
    { id: 24, title: "Barres", type: "bars" },
    { id: 25, title: "Étoiles ★", type: "stars" },
    { id: 26, title: "Nombres", type: "numbers" },
    { id: 27, title: "Chiffres romains", type: "roman" },
    { id: 28, title: "Dés", type: "dice" },
    { id: 29, title: "Additions", type: "mathAdd" },
    { id: 30, title: "Multiplications", type: "mathMul" },
    { id: 31, title: "Soustractions", type: "mathSub" },
    { id: 32, title: "Fractions", type: "fractions" },
    { id: 33, title: "Code binaire", type: "binary" },
    { id: 34, title: "Alphabet", type: "alphabet" },
    { id: 35, title: "Mois", type: "months" },
    { id: 36, title: "Planètes", type: "planets" },
    { id: 37, title: "Animaux", type: "animals" },
    { id: 38, title: "Longueur de mot", type: "wordLength" },
    { id: 39, title: "Poids", type: "weights" },
    { id: 40, title: "Durées", type: "durations" },
    { id: 41, title: "Emojis", type: "emojis" },
    { id: 42, title: "Polygones", type: "polygons" },
    { id: 43, title: "Notation", type: "rating" },
    { id: 44, title: "Escalier", type: "stairs" },
    { id: 45, title: "Empilement", type: "stack" },
    { id: 46, title: "Damier", type: "checkers" },
    { id: 47, title: "Rayures", type: "stripes" },
    { id: 48, title: "Cible", type: "target" },
    { id: 49, title: "Pixels", type: "pixels" },
    { id: 50, title: "Âges de la vie", type: "ages" }
];

// Types affichant du texte lisible (utilisés par speedQuiz pour les
// règles « commence par / finit par » — injouables sur types purement visuels)
const TEXT_TYPES = ['numbers', 'roman', 'alphabet', 'months', 'wordLength', 'weights', 'durations'];

// ─── Construction du titre d'un jour ─────────────────────────────
function buildDayTitle(day) {
    const mode = GAME_MODES[day.modeId];
    if (mode.typeAgnostic) return mode.name;
    const base = BASE_TYPES.find(b => b.type === day.type);
    return `${mode.name} — ${base ? base.title : day.type}`;
}
