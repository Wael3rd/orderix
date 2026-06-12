// ─── Catalogue des modes de jeu ──────────────────────────────────
// Modes supprimés lors de l'audit mobile (juin 2026) :
//   hideHover (dépendait de :hover), chaseMin (dépendait de mousemove),
//   blurMax (le :active de révélation déclenchait le clic au tactile).
// `desc` : consigne affichée sur l'écran d'introduction.
// `typeAgnostic` : le mode n'utilise pas le type visuel du jour (titre simplifié).

const GAME_MODES = {
    sortAsc: { name: "Tri Croissant", isSort: true, order: 1, desc: "Touchez les éléments du plus petit au plus grand, puis validez." },
    sortDesc: { name: "Tri Décroissant", isSort: true, order: -1, desc: "Touchez les éléments du plus grand au plus petit, puis validez." },
    findMax: { name: "Chasse au Max", findTarget: 'max', desc: "Touchez l'élément le plus grand. Un seul essai !" },
    findMin: { name: "Chasse au Min", findTarget: 'min', desc: "Touchez l'élément le plus petit. Un seul essai !" },
    findOdd: { name: "L'Intrus", specialGen: 'odd', winOnOdd: true, desc: "Un seul élément n'a aucun jumeau : démasquez-le." },
    findPair: { name: "Les Jumeaux", specialGen: 'pair', winOnPairs: true, desc: "Deux éléments sont identiques : touchez-les tous les deux." },
    pairs: { name: "Paires", specialGen: 'pairs', isPairsMatch: true, desc: "Associez tous les éléments deux par deux." },
    reflex: { name: "Cibles Mobiles", isReflex: true, typeAgnostic: false, desc: "Touchez chaque cible dès qu'elle apparaît." },
    flashMax: { name: "Mémoire Flash", findTarget: 'max', flashHide: true, desc: "Mémorisez vite : tout se cache après 2 secondes. Touchez le plus grand." },
    flashSort: { name: "Tri Flash", isSort: true, order: 1, flashHide: true, desc: "Observez bien : tout se cache après 2 secondes. Triez de mémoire, du plus petit au plus grand." },
    spinSort: { name: "Tourbillon", isSort: true, order: 1, cssClass: 'spin-anim', desc: "Triez du plus petit au plus grand… pendant que tout tournoie." },
    invertMin: { name: "Inversion", findTarget: 'min', cssClass: 'invert-color', desc: "Les couleurs sont inversées. Touchez le plus petit." },
    sumTarget: { name: "Addition Cible", isSum: true, forceType: 'numbers', desc: "Touchez les 2 nombres dont la somme égale la cible." },
    evensAsc: { name: "Pairs Uniquement", isSort: true, order: 1, filter: 'even', desc: "Triez ces valeurs paires du plus petit au plus grand." },
    oddsDesc: { name: "Impairs Uniquement", isSort: true, order: -1, filter: 'odd', desc: "Triez ces valeurs impaires du plus grand au plus petit." },
    median: { name: "La Médiane", findTarget: 'median', desc: "Touchez la valeur du milieu : ni la plus petite, ni la plus grande." },
    shuffleSort: { name: "Tremblement", isSort: true, order: 1, shuffleTick: 2500, desc: "Triez du plus petit au plus grand… mais tout se mélange régulièrement !" },
    blackout: { name: "Coupure de Courant", isSort: true, order: 1, blackout: true, desc: "Triez du plus petit au plus grand malgré les coupures de lumière." },
    shrinkSort: { name: "Rétrécissement", isSort: true, order: 1, cssClass: 'shrink-anim', desc: "Triez vite : tout rétrécit et finira par disparaître !" },
    flickerMax: { name: "Stroboscope", findTarget: 'max', cssClass: 'flicker-anim', desc: "Touchez le plus grand malgré le clignotement." },
    mirrorSort: { name: "Monde Miroir", isSort: true, order: 1, cssClass: 'mirror-view', desc: "Tout est inversé en miroir. Triez du plus petit au plus grand." },
    doubleTapMax: { name: "Double Frappe", findTarget: 'max', requireDbTap: true, desc: "Touchez DEUX FOIS rapidement l'élément le plus grand." },
    longPressMin: { name: "Pression Longue", findTarget: 'min', requireLong: true, desc: "Maintenez le doigt appuyé sur l'élément le plus petit." },
    blindSort: { name: "Tri à l'Aveugle", isSort: true, order: 1, peekHide: true, desc: "Touchez une carte pour la révéler 1 seconde. Triez de mémoire." },
    mathDiff: { name: "Soustraction Cible", isDiff: true, forceType: 'numbers', desc: "Touchez les 2 nombres dont la différence égale la cible." },
    avoidMin: { name: "Survie", avoidTarget: 'min', desc: "Touchez tous les éléments SAUF le plus petit. Ne le touchez jamais !" },
    pulseSort: { name: "Pulsation", isSort: true, order: 1, cssClass: 'pulse-anim', desc: "Triez du plus petit au plus grand pendant que tout palpite." },
    wobbleMax: { name: "Instabilité", findTarget: 'max', cssClass: 'wobble-anim', desc: "Touchez le plus grand malgré les secousses." },
    findTargetUI: { name: "Recherche Exacte", isTargetMatch: true, desc: "Retrouvez l'élément identique au modèle affiché." },
    gravitySort: { name: "Gravité", isSort: true, order: 1, cssClass: 'gravity-anim', desc: "Triez du plus petit au plus grand." },
    colorSort: { name: "Technicolor", isSort: true, order: 1, cssClass: 'hue-shift', desc: "Triez du plus petit au plus grand… les couleurs, elles, n'arrêtent pas de changer." },
    danceSort: { name: "La Danse", isSort: true, order: 1, cssClass: 'dance-anim', desc: "Triez du plus petit au plus grand pendant que tout danse." },
    cursorSort: { name: "Curseur Fou", isTargetMatch: true, useCursor: true, desc: "Le halo doré va et vient. Touchez l'écran quand il entoure le modèle." },
    sequenceHunt: { name: "Chasse en Série", isSequence: true, sequenceLength: 5, desc: "Retrouvez les éléments demandés, dans l'ordre, un par un." },
    typingTest: { name: "Dactylographie", isTyping: true, typeAgnostic: true, desc: "Recopiez la suite de lettres avec le clavier à l'écran, le plus vite possible." },
    connectDots: { name: "Relier les Points", isConnectDots: true, typeAgnostic: true, desc: "Reliez les points dans l'ordre, sans lever le doigt." },
    mathQuizAdd: { name: "Calcul · Additions", isMathQuiz: true, mathOp: '+', typeAgnostic: true, desc: "3 calculs à résoudre : touchez la bonne réponse." },
    mathQuizSub: { name: "Calcul · Soustractions", isMathQuiz: true, mathOp: '-', typeAgnostic: true, desc: "3 calculs à résoudre : touchez la bonne réponse." },
    mathQuizMul: { name: "Calcul · Multiplications", isMathQuiz: true, mathOp: '*', typeAgnostic: true, desc: "3 calculs à résoudre : touchez la bonne réponse." },
    mathQuizDiv: { name: "Calcul · Divisions", isMathQuiz: true, mathOp: '/', typeAgnostic: true, desc: "3 calculs à résoudre : touchez la bonne réponse." },
    speedLetters: { name: "Lettres Chrono", isSpeedLetters: true, typeAgnostic: true, desc: "Recopiez les lettres avant la fin du temps. Plusieurs manches !" },
    dragDropMath: { name: "Pair ou Impair", isDragDrop: true, typeAgnostic: true, desc: "Touchez un nombre, puis sa boîte : PAIR ou IMPAIR." },
    conveyorBelt: { name: "Tapis Roulant", isConveyor: true, desc: "Touchez en bas l'objet qui se présente dans le cadre doré." },
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
