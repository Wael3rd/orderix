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
let ALL_DAYS = [];
// Les 50 premiers jours : rotation des modes phares sur chaque type de base
// (la première semaine d'une joueuse doit montrer le meilleur du jeu)
BASE_TYPES.forEach((d, i) => {
    const mKey = STARTER_ROTATION[i % STARTER_ROTATION.length];
    const mode = GAME_MODES[mKey];
    ALL_DAYS.push({ id: d.id, type: mode.forceType || d.type, modeId: mKey });
});
// Remplissage jusqu'à 365 par croisement procédural mode × type
const MKEYS = Object.keys(GAME_MODES);
let cId = ALL_DAYS.length + 1, mIdx = 0;
while (ALL_DAYS.length < 365) {
    const mKey = MKEYS[mIdx % MKEYS.length];
    const mode = GAME_MODES[mKey];
    // Certains modes exigent un type précis (ex. additions → nombres lisibles)
    let base = BASE_TYPES[(cId * 13) % BASE_TYPES.length];
    let type = mode.forceType || base.type;
    ALL_DAYS.push({ id: cId, type: type, modeId: mKey });
    cId++; mIdx++;
}
ALL_DAYS.forEach(d => { d.title = buildDayTitle(d); });
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
function loadLocalResults() {
    try { localResults = JSON.parse(getStorage('orderix_local_results') || '{}') || {}; }
    catch (e) { localResults = {}; }
}
function saveLocalResult(dayId, count, time, isWin) {
    localResults[dayId] = { count: count, time: time, isWin: isWin };
    setStorage('orderix_local_results', JSON.stringify(localResults));
}
// Résultat connu pour un jour : priorité au serveur, sinon local
function getPlayedInfo(dayId) {
    return serverPlayedDays[dayId] || localResults[dayId] || null;
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

function computeStats() {
    let played = 0, won = 0, best = null;
    DAYS.forEach(d => {
        const info = getPlayedInfo(d.id);
        if (!info) return;
        played++;
        if (info.isWin) {
            won++;
            const t = Math.abs(parseFloat(info.time));
            if (best === null || t < best) best = t;
        }
    });
    // Série : jours calendaires consécutifs réussis, en remontant depuis
    // aujourd'hui (ou hier si le puzzle du jour n'est pas encore joué)
    let streak = 0;
    let d = todayDayId();
    const todayInfo = getPlayedInfo(d);
    if (!todayInfo || !todayInfo.isWin) d--;
    while (d >= 1) {
        const info = getPlayedInfo(d);
        if (info && info.isWin) { streak++; d--; }
        else break;
    }
    return { played: played, won: won, best: best, streak: streak };
}

// Nom sauvegardé
const savedName = getStorage('orderix_player_name');
loadLocalResults();
