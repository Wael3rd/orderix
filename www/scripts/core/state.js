// ─── État global, stockage, calendrier ───────────────────────────

// Backend — URLs injectées par environnement (set-env.js → env.js).
// GAS reste le backend actif tant que Supabase n'est pas branché (phase 2).
const GAS_URL = (typeof ORDERIX_ENV !== 'undefined' && ORDERIX_ENV.gasUrl) || '';
const SUPABASE_URL = (typeof ORDERIX_ENV !== 'undefined' && ORDERIX_ENV.supabaseUrl) || '';
const SUPABASE_ANON_KEY = (typeof ORDERIX_ENV !== 'undefined' && ORDERIX_ENV.supabaseAnonKey) || '';
const ENV_NAME = (typeof ORDERIX_ENV !== 'undefined' && ORDERIX_ENV.envName) || 'staging';

// Variables d'état de partie
let timerInterval, lastTime, gameTimeout, envInterval;
let timeElapsed = 0;
let selectionOrder = [];
let isPaused = false;
let currentDayConfig = null;
let activeItemCount = 10;
let exactTarget = 0, targetSum = 0, targetDiff = 0, flipped = [], matched = 0,
    targetSequence = [], currentSequenceIdx = 0, currentRound = 1, totalRounds = 3, currentMathTarget = 0;
let shieldAvailable = false; // joker : une erreur pardonnée (modes à manches)
let baseItemCount = 0;       // compte d'éléments de référence (les manches le font varier)
let sessionReferredBy = '';
try { sessionReferredBy = new URLSearchParams(window.location.search).get('ref') || ''; } catch (e) { }
let hasSharedThisGame = false;
let pendingTimeVal = 0;
let dayConfig = {};
let gameInProgress = false;
let serverPlayedDays = {};
let localResults = {};
let currentScreen = 'home';
let returnScreen = 'home'; // écran d'origine avant d'entrer dans un jour (retour cohérent)

// ─── Compilation des 365 jours ───────────────────────────────────
// JANVIER (jours 1-30) : la vitrine — les 30 gameplays d'ordonnancement,
// un par jour, dans l'ordre de la liste validée (session de test).
// Jour 31 + FÉVRIER→DÉCEMBRE : rotation de tous les anciens modes
// (rien n'est supprimé du roster).
// v2.3 (retours de test du 18/07) : laSuite→tripeaks, aiguillage→deux048,
// ascenseur→laFoule, guichet→tripleOrdre, memoryChain→filsEmmeles,
// + jour 31 inédit (chemin). Janvier fait désormais 31 jours d'originaux.
// v2.4 (retours #40/#43/#47) : patience→degrade (I Love Hue),
// rummy→blocs (Block Blast), escalier→paires (Tile Connect).
// v2.5 (retours #58/#60) : tripeaks→cadenas (cadenas à combinaison),
// degrade→memoCroissant (mémoire), sur demande explicite du produit.
// Jour 15 : La File retirée sans remplacement (retour #120 « pas au
// niveau des autres ») — journée laissée vide, le mode reste dans le code.
const JANUARY_LINEUP = [
    'orderChain', 'cascade', 'insertion', 'fontaine', 'metronome',
    'code', 'memoCroissant', 'solitaire', 'blocs', 'dominosa',
    'paires', 'tubes', 'swapSort', 'boulons', null,
    'grille', 'hanoi', 'mahjong', 'futoshiki', 'balance',
    'ordreCache', 'indices', 'chronologie', 'suites', 'deux048',
    'embouteillage', 'tripleOrdre', 'photoClasse', 'taquin', 'fusion',
    'nonogramme'
];
// Retirés du calendrier sur demande, mais PAS de la campagne de re-test
// (le filtre ci-dessous les exclut pour ne pas décaler les jours déjà testés)
const CALENDAR_REMOVED = ['fileBloquee'];
// FÉVRIER (et début mars) : campagne de re-test des ANCIENS gameplays
// — un par jour, SANS variation de thème (type neutre), pour les
// revalider un à un. Ils reçoivent rev:1 → badge « ! » en staging.
const LEGACY_RETEST = Object.keys(GAME_MODES).filter(k => !JANUARY_LINEUP.includes(k) && !CALENDAR_REMOVED.includes(k));
LEGACY_RETEST.forEach(k => { if (!GAME_MODES[k].rev) GAME_MODES[k].rev = 1; });

// Après la campagne (11 mars et au-delà) : RIEN — le reste de l'année
// est vide tant que le roster définitif n'est pas arrêté.
// Retour #118 : jour 32 (Le Rangement) jugé redondant avec un autre jour
// de la campagne déjà validé → journée retirée sans remplacement, sur
// demande explicite ; le mode reste dans le roster (rien n'est supprimé),
// simplement pas assigné ce jour-là.
// Jour 35 (retour #119) : Pairs Uniquement retiré comme le Rangement
const RETEST_SKIP_DAYS = new Set([32, 35]);
let ALL_DAYS = [];
for (let id = 1; id <= 365; id++) {
    let mKey;
    let retest = false;
    if (id <= 31) {
        mKey = JANUARY_LINEUP[id - 1];
        if (!mKey) { ALL_DAYS.push({ id: id, empty: true, modeId: null, type: 'numbers', title: '' }); continue; }
    }
    else if (RETEST_SKIP_DAYS.has(id)) { ALL_DAYS.push({ id: id, empty: true, modeId: null, type: 'numbers', title: '' }); continue; }
    else if (id - 32 < LEGACY_RETEST.length) { mKey = LEGACY_RETEST[id - 32]; retest = true; }
    else { ALL_DAYS.push({ id: id, empty: true, modeId: null, type: 'numbers', title: '' }); continue; }

    const mode = GAME_MODES[mKey];
    // Certains modes exigent un type précis (ex. additions → nombres lisibles)
    // ou refusent les types illisibles dans leur contexte (ex. tapis roulant
    // × ombre, issue #26) → repli sur des nombres.
    const base = BASE_TYPES[(id * 13) % BASE_TYPES.length];
    let type = retest ? (mode.forceType || 'numbers') : (mode.forceType || base.type);
    if (mode.avoidTypes && mode.avoidTypes.indexOf(type) !== -1) type = 'numbers';
    ALL_DAYS.push({ id: id, type: type, modeId: mKey });
}
ALL_DAYS.forEach(d => { if (!d.empty) d.title = buildDayTitle(d); });
const DAYS = ALL_DAYS;

// ─── Cache DOM ───────────────────────────────────────────────────
const board = document.getElementById('game-board');
const timerDisplay = document.getElementById('timer-display');
const startBtn = document.getElementById('start-btn');
const checkBtn = document.getElementById('check-btn');
const backBtn = document.getElementById('back-btn');
const shareBtn = document.getElementById('share-btn');
const homeBtn = document.getElementById('home-btn');
const resultDisplay = document.getElementById('result');
const resultPanel = document.getElementById('result-panel');
const resultStatus = document.getElementById('result-status');
const resultTime = document.getElementById('result-time');
const resultPhrase = document.getElementById('result-phrase');
const feedbackContainer = document.getElementById('feedback-container');
const feedbackQ = document.getElementById('feedback-q');
const resultActions = document.getElementById('result-actions');
const btnLike = document.getElementById('btn-like');
const btnDislike = document.getElementById('btn-dislike');
const btnSkip = document.getElementById('btn-skip');
const levelTitle = document.getElementById('level-title');
const levelType = document.getElementById('level-type');
const gameDayLabel = document.getElementById('game-day-label');
const introPanel = document.getElementById('intro-panel');
const introRule = document.getElementById('intro-rule');
const exampleZone = document.getElementById('example-zone');

const playerNameMainInput = document.getElementById('player-name-main');
const verifyNameBtn = document.getElementById('verify-name-btn');
const nameStatus = document.getElementById('name-status');
const nameInputContainer = document.getElementById('name-input-container');
const lockedNameDisplay = document.getElementById('locked-name-display');

const leaderboardSection = document.getElementById('leaderboard-section');
const dbMessage = document.getElementById('db-message');
const leaderboardList = document.getElementById('leaderboard-list');
const leaderboardTitle = document.getElementById('leaderboard-title');

// ─── Stockage (localStorage + cookie de secours) ─────────────────
function setStorage(key, value) {
    try { localStorage.setItem(key, value); } catch (e) { }
    try { document.cookie = `${key}=${encodeURIComponent(value)}; max-age=31536000; path=/; SameSite=Lax`; } catch (e) { }
}
function getStorage(key) {
    try { if (localStorage.getItem(key) !== null) return localStorage.getItem(key); } catch (e) { }
    const match = document.cookie.match(new RegExp('(^| )' + key + '=([^;]+)'));
    if (match) return decodeURIComponent(match[2]);
    return null;
}

// ─── Progression locale (jouable sans pseudo, hors-ligne) ────────
// Le registre des revs testées (badges « ! ») est SÉPARÉ de la
// progression : « reset progression » vide le calendrier sans faire
// réapparaître les points d'exclamation des gameplays déjà testés.
let testedRevs = {};
function loadLocalResults() {
    try { localResults = JSON.parse(getStorage('orderix_local_results') || '{}') || {}; }
    catch (e) { localResults = {}; }
    try { testedRevs = JSON.parse(getStorage('orderix_tested_revs') || '{}') || {}; }
    catch (e) { testedRevs = {}; }
    // Migration : récupère les revs déjà jouées avant ce registre
    let migrated = false;
    for (const dayId in localResults) {
        const res = localResults[dayId];
        if (!res || !res.rev) continue;
        const day = DAYS.find(d => d.id === parseInt(dayId));
        if (!day) continue;
        if ((testedRevs[day.modeId] || 0) < res.rev) {
            testedRevs[day.modeId] = res.rev;
            migrated = true;
        }
    }
    if (migrated) setStorage('orderix_tested_revs', JSON.stringify(testedRevs));
}
// ─── Événements calendaires (décision produit du 19/07, docs/produit.md)
// · weekend : sam-dim, les victoires du jour valent 2 étoiles
// · premier : le 1er du mois, gagner le puzzle du jour offre 1 gel 🧊
function activeEvent() {
    const now = new Date();
    if (now.getDate() === 1) return { id: 'premier', label: '🧊 Défi du 1er : un gel de série à gagner !' };
    const d = now.getDay();
    if (d === 0 || d === 6) return { id: 'weekend', label: '⭐⭐ Week-end Double Étoiles !' };
    return null;
}
let lastEventReward = ''; // message affiché par endGame après une victoire

function saveLocalResult(dayId, count, time, isWin) {
    // `rev` mémorise la révision du gameplay jouée : si le mode est ensuite
    // retouché (rev incrémentée dans GAME_MODES), le badge « ! » réapparaît.
    // `late` marque un RATTRAPAGE : jour joué après sa date — il complète
    // l'album (médailles) mais ne nourrit pas la série.
    const day = DAYS.find(d => d.id === dayId);
    const rev = (day && !day.empty) ? (GAME_MODES[day.modeId].rev || 0) : 0;
    const late = dayId !== todayDayId();

    // Événements : uniquement sur la victoire DU JOUR, jouée le jour même
    lastEventReward = '';
    let stars = 1;
    const ev = (isWin && !late) ? activeEvent() : null;
    if (ev && ev.id === 'weekend') {
        stars = 2;
        lastEventReward = '⭐⭐ Victoire double étoiles !';
    } else if (ev && ev.id === 'premier') {
        if (streakData.freezes < GELS_MAX) {
            streakData.freezes++;
            saveStreakData();
            lastEventReward = '🧊 Défi du 1er réussi — un gel de série gagné !';
        } else {
            lastEventReward = '🧊 Défi du 1er réussi — gels déjà au maximum !';
        }
        if (typeof logEvent === 'function') logEvent('event_premier_gagne');
    }

    // `saison` = mois réel de la partie : nourrit le Carnet de Saison
    const now = new Date();
    localResults[dayId] = {
        count: count, time: time, isWin: isWin, rev: rev, late: late,
        stars: isWin ? stars : 0, saison: now.getFullYear() + '-' + (now.getMonth() + 1)
    };
    setStorage('orderix_local_results', JSON.stringify(localResults));
    if (isWin && typeof claimPassRewards === 'function') claimPassRewards();
    if (day && !day.empty && rev > (testedRevs[day.modeId] || 0)) {
        testedRevs[day.modeId] = rev;
        setStorage('orderix_tested_revs', JSON.stringify(testedRevs));
    }
    // La série ne bouge que sur la victoire DU JOUR, jouée le jour même
    if (isWin && !late) updateStreakOnWin();
    if (typeof logEvent === 'function') {
        logEvent('game_result', {
            jour: dayId, mode: day && day.modeId, win: isWin, late: late,
            temps: Math.abs(parseFloat(time)) || 0
        });
    }
}
// Résultat connu pour un jour : priorité au serveur, sinon local
function getPlayedInfo(dayId) {
    return serverPlayedDays[dayId] || localResults[dayId] || null;
}
// Badge « ! » (version de test) : le gameplay de ce jour a changé depuis
// le dernier test — registre `testedRevs`, indépendant de la progression
// (survit au « reset progression »).
function needsTest(day) {
    if (ENV_NAME !== 'staging' || day.empty) return false;
    const rev = GAME_MODES[day.modeId].rev || 0;
    if (rev === 0) return false;
    return rev > (testedRevs[day.modeId] || 0);
}

// ─── Calendrier : jour 1..365 ↔ date de l'année courante ─────────
function todayDayId() {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 1);
    const id = Math.floor((now - start) / 86400000) + 1;
    return Math.min(365, id);
}
function dateOfDayId(id) {
    return new Date(new Date().getFullYear(), 0, id);
}

// ─── Série & gels (Epic méta : rétention) ────────────────────────
// Modèle Duolingo : la série compte les victoires « du jour, le jour
// même ». Les jours manqués sont absorbés par les GELS (stock max 2) :
// 1 offert chaque mois + 1 gagné par semaine parfaite (7 victoires
// d'affilée). Sans gel suffisant, la série repart à 1.
const GELS_MAX = 2;
let streakData = { count: 0, lastDay: 0, freezes: 0, grantMonth: '', frozenUsed: 0 };

function loadStreakData() {
    try {
        const raw = JSON.parse(getStorage('orderix_streak') || 'null');
        if (raw && typeof raw.count === 'number') streakData = raw;
    } catch (e) { }
    // Octroi mensuel : 1 gel offert au premier lancement du mois
    const mois = new Date().getFullYear() + '-' + new Date().getMonth();
    if (streakData.grantMonth !== mois) {
        streakData.grantMonth = mois;
        streakData.freezes = Math.min(GELS_MAX, (streakData.freezes || 0) + 1);
        saveStreakData();
    }
}
function saveStreakData() { setStorage('orderix_streak', JSON.stringify(streakData)); }

function updateStreakOnWin() {
    const today = todayDayId();
    if (streakData.lastDay === today) return; // déjà comptée aujourd'hui
    const gap = streakData.lastDay > 0 ? today - streakData.lastDay : 0;
    streakData.frozenUsed = 0;
    if (streakData.lastDay === 0 || gap > 1) {
        // Jours manqués : les gels les absorbent (1 gel = 1 jour manqué)
        const manques = streakData.lastDay === 0 ? 0 : gap - 1;
        if (manques > 0 && streakData.freezes >= manques) {
            streakData.freezes -= manques;
            streakData.frozenUsed = manques;
            streakData.count++;
        } else if (manques > 0) {
            streakData.count = 1; // série repartie
        } else {
            streakData.count = 1; // toute première victoire
        }
    } else {
        streakData.count++;
    }
    // Semaine parfaite : tous les 7 jours de série, +1 gel (plafonné)
    if (streakData.count > 0 && streakData.count % 7 === 0) {
        streakData.freezes = Math.min(GELS_MAX, streakData.freezes + 1);
    }
    streakData.lastDay = today;
    saveStreakData();
    if (streakData.frozenUsed > 0 && typeof logEvent === 'function') {
        logEvent('gel_utilise', { nb: streakData.frozenUsed, serie: streakData.count });
    }
}

// Série affichée : celle du registre, éteinte si trop de jours ont
// passé sans victoire et sans gels pour les couvrir
function currentStreak() {
    if (!streakData.lastDay) return 0;
    const gap = todayDayId() - streakData.lastDay;
    if (gap <= 1) return streakData.count;
    return (gap - 1 <= streakData.freezes) ? streakData.count : 0;
}

// ─── Médailles mensuelles (album) ────────────────────────────────
// Or = tous les jours actifs du mois réussis · Argent = 20 réussis
// (ou 2/3 des jours actifs si le mois en compte moins de 30).
function monthMedals() {
    const year = new Date().getFullYear();
    const medals = [];
    let dayId = 1;
    for (let m = 0; m < 12; m++) {
        const daysInMonth = new Date(year, m + 1, 0).getDate();
        let active = 0, won = 0;
        for (let d = 1; d <= daysInMonth && dayId <= 365; d++, dayId++) {
            const day = DAYS.find(x => x.id === dayId);
            if (!day || day.empty) continue;
            const cfg = dayConfig[dayId];
            if (cfg && cfg.enabled === false) continue;
            active++;
            const info = getPlayedInfo(dayId);
            if (info && info.isWin) won++;
        }
        const seuilArgent = Math.min(20, Math.ceil(active * 2 / 3));
        let medal = null;
        if (active > 0 && won >= active) medal = 'or';
        else if (active > 0 && won >= seuilArgent) medal = 'argent';
        medals.push({ month: m, active: active, won: won, medal: medal });
    }
    return medals;
}

function computeStats() {
    let played = 0, won = 0, best = null, stars = 0;
    DAYS.forEach(d => {
        const info = getPlayedInfo(d.id);
        if (!info) return;
        played++;
        if (info.isWin) {
            won++;
            stars += info.stars || 1; // étoiles (double le week-end)
            const t = Math.abs(parseFloat(info.time));
            if (best === null || t < best) best = t;
        }
    });
    return { played: played, won: won, best: best, stars: stars, streak: currentStreak(), freezes: streakData.freezes };
}

// Nom sauvegardé
const savedName = getStorage('orderix_player_name');
loadLocalResults();
loadStreakData();
