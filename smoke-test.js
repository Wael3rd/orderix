// Smoke test : charge l'app dans jsdom et démarre chaque mode de jeu.
// Tout est évalué en un seul appel (les const top-level ne survivent pas entre evals).
const fs = require('fs');
const path = require('path');
const { JSDOM, VirtualConsole } = require('jsdom');

const html = fs.readFileSync(path.join(__dirname, 'www', 'index.html'), 'utf8');
const vc = new VirtualConsole();
const jsErrors = [];
vc.on('jsdomError', (e) => {
    if (/Not implemented/.test(e.message)) return;
    jsErrors.push(e.message + (e.detail ? ' :: ' + e.detail : ''));
});
vc.on('error', (m) => jsErrors.push(String(m)));

const dom = new JSDOM(html, {
    url: 'https://localhost/',
    runScripts: 'outside-only',
    pretendToBeVisual: true,
    virtualConsole: vc
});
const { window } = dom;

window.fetch = () => new Promise(() => { }); // hors-ligne simulé
window.scrollTo = () => { };
window.confirm = () => true;
window.navigator.vibrate = () => true;
if (!window.AbortController) window.AbortController = AbortController;

// Horloge contrôlable : aucun timer réel ne tourne pendant les tests,
// __clock.tick(ms) fait avancer le temps de façon déterministe.
window.eval(`;(function(){
    let now = 0, seq = 1;
    const timers = new Map();
    window.setTimeout = (fn, d) => { timers.set(seq, { fn, at: now + (d || 0), interval: null }); return seq++; };
    window.setInterval = (fn, d) => { timers.set(seq, { fn, at: now + (d || 1), interval: d || 1 }); return seq++; };
    window.clearTimeout = window.clearInterval = (id) => { timers.delete(id); };
    window.__clock = { tick(ms) {
        const end = now + ms;
        let guard = 0;
        while (guard++ < 10000) {
            let next = null, nid = null;
            for (const [id, t] of timers) if (t.at <= end && (next === null || t.at < next.at)) { next = t; nid = id; }
            if (!next) break;
            now = next.at;
            if (next.interval) next.at = now + next.interval; else timers.delete(nid);
            try { next.fn(); } catch (e) { }
        }
        now = end;
    } };
})();`);

const scriptSrcs = [...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m => m[1]);
let bundle = '';
for (const src of scriptSrcs) {
    const file = path.join(__dirname, 'www', src);
    if (!fs.existsSync(file) && src.endsWith('env.js')) {
        // env.js est généré par set-env.js et gitignoré (il peut contenir un
        // jeton local) : stub minimal pour les environnements de CI/routine.
        bundle += `\n;/* ===== ${src} (stub) ===== */\nconst ORDERIX_ENV = { envName: 'staging', gasUrl: '', supabaseUrl: '', supabaseAnonKey: '', githubToken: '' };\n`;
        continue;
    }
    bundle += `\n;/* ===== ${src} ===== */\n` + fs.readFileSync(file, 'utf8');
}

const TEST_CODE = `
;window.__results = [];
function __check(label, fn) {
    try { fn(); window.__results.push(['ok', label]); }
    catch (e) { window.__results.push(['fail', label + ' → ' + e.message]); }
}

__check('écran calendrier', () => showScreen('calendar'));
__check('écran profil', () => showScreen('profile'));
__check('écran accueil', () => showScreen('home'));
__check('365 jours générés', () => { if (DAYS.length !== 365) throw new Error('DAYS=' + DAYS.length); });
// Structure du calendrier : séquence 1→69 (janvier-mars) + son MIROIR
// aux jours 200→268 (« en vrai » depuis le 19/07). Jours retirés sur
// demande (15, 32, 35) vides dans les deux copies. Tout le reste vide.
const KNOWN_EMPTY_VIRTUAL_DAYS = [15, 32, 35];
const vidOf = (id) => id <= 69 ? id : (id >= 200 && id <= 268 ? id - 199 : null);
__check('modes et types valides (calendrier + miroir du 19/07)', () => {
    DAYS.forEach(d => {
        const vid = vidOf(d.id);
        const doitEtreVide = vid === null || KNOWN_EMPTY_VIRTUAL_DAYS.indexOf(vid) !== -1;
        if (doitEtreVide) {
            if (!d.empty) throw new Error('jour ' + d.id + ' devrait être vide');
            return;
        }
        if (d.empty) throw new Error('jour ' + d.id + ' (virtuel ' + vid + ') vide à tort');
        if (!GAME_MODES[d.modeId]) throw new Error('mode inconnu: ' + d.modeId);
        if (!BASE_TYPES.find(b => b.type === d.type)) throw new Error('type inconnu: ' + d.type);
    });
    // Le miroir propose exactement les mêmes puzzles que l'original
    for (let id = 200; id <= 268; id++) {
        const m = DAYS.find(x => x.id === id), o = DAYS.find(x => x.id === id - 199);
        if ((m.modeId || '') !== (o.modeId || '') || (m.empty !== o.empty)) {
            throw new Error('miroir incohérent au jour ' + id);
        }
    }
});

// Modes retirés du calendrier (retours #118/#119/#120) mais conservés
// dans GAME_MODES — plus aucun jour ne les référence.
const MODES_WITHOUT_DAY = ['rangement', 'evensAsc', 'fileBloquee'];
Object.keys(GAME_MODES).forEach(modeId => {
    __check('mode ' + modeId + ' (intro + partie)', () => {
        const day = DAYS.find(d => d.modeId === modeId);
        if (!day) {
            if (MODES_WITHOUT_DAY.indexOf(modeId) !== -1) return;
            throw new Error('aucun jour pour ce mode');
        }
        localResults = {}; serverPlayedDays = {};
        selectDay(day);
        if (introPanel.classList.contains('hidden')) throw new Error('intro absente');
        startGame();
        const boardHasContent = board.children.length > 0 || document.getElementById('dynamic-target-ui');
        if (!boardHasContent) throw new Error('plateau vide après startGame');
        gameInProgress = false; isPaused = true;
        clearInterval(timerInterval); clearTimeout(gameTimeout);
        clearInterval(envInterval); clearInterval(window.speedTimer);
        goHome();
    });
});

__check('partie complète (tri croissant, victoire)', () => {
    localResults = {}; serverPlayedDays = {};
    const day = DAYS.find(d => d.modeId === 'sortAsc');
    selectDay(day);
    startGame();
    const items = Array.from(board.querySelectorAll('.item'));
    if (items.length === 0) throw new Error('pas d items');
    items.sort((a, b) => parseFloat(a.dataset.value) - parseFloat(b.dataset.value));
    items.forEach(it => it.click());
    verifyOrder();
    if (resultPanel.classList.contains('hidden')) throw new Error('panneau de résultat absent');
    if (!localResults[day.id] || !localResults[day.id].isWin) throw new Error('victoire non enregistrée');
    goHome();
});

__check('chasse au max : joker sur la 1re erreur, défaite sur la 2e', () => {
    localResults = {}; serverPlayedDays = {};
    const day = DAYS.find(d => d.modeId === 'findMax');
    selectDay(day);
    startGame();
    const items = Array.from(board.querySelectorAll('.item'));
    items.sort((a, b) => parseFloat(a.dataset.value) - parseFloat(b.dataset.value));
    items[0].click(); // 1re erreur → joker consommé, la partie continue
    if (!resultPanel.classList.contains('hidden')) throw new Error('le joker n a pas pardonné la 1re erreur');
    if (shieldAvailable) throw new Error('joker non consommé');
    items[1].click(); // 2e erreur → défaite
    if (resultPanel.classList.contains('hidden')) throw new Error('panneau de résultat absent');
    if (!localResults[day.id] || localResults[day.id].isWin) throw new Error('défaite non enregistrée');
    goHome();
});

__check('chasse au max : victoire = 3 manches enchaînées', () => {
    localResults = {}; serverPlayedDays = {};
    const day = DAYS.find(d => d.modeId === 'findMax');
    selectDay(day);
    startGame();
    for (let r = 0; r < 3; r++) {
        const items = Array.from(board.querySelectorAll('.item:not(.matched)'))
            .filter(i => i.dataset.value !== undefined);
        if (items.length === 0) throw new Error('plateau vide à la manche ' + (r + 1));
        items.sort((a, b) => parseFloat(a.dataset.value) - parseFloat(b.dataset.value));
        items[items.length - 1].click(); // le max
        __clock.tick(700); // laisse la manche suivante se lancer
    }
    if (resultPanel.classList.contains('hidden')) throw new Error('pas de victoire après 3 manches');
    if (!localResults[day.id] || !localResults[day.id].isWin) throw new Error('victoire non enregistrée');
    goHome();
});

__check('statistiques et série', () => {
    localResults = {}; serverPlayedDays = {};
    const tid = todayDayId();
    // Hier gagné À L'HEURE (simulé via le registre), aujourd'hui gagné → série 2.
    // Un rattrapage (jour passé) compte dans les stats mais PAS dans la série.
    streakData = { count: 1, lastDay: tid - 1, freezes: 0, grantMonth: 'x', frozenUsed: 0 };
    saveLocalResult(tid, 10, 5.2, true);
    saveLocalResult(tid - 1, 10, 6.1, true); // rattrapage
    const s = computeStats();
    if (s.won !== 2) throw new Error('won=' + s.won);
    if (s.streak !== 2) throw new Error('streak=' + s.streak);
    buildHome(); buildCalendar(); buildProfile();
});

__check('retour : calendrier → jour → back ramène au calendrier', () => {
    localResults = {};
    showScreen('calendar');
    selectDay(DAYS[5]);
    if (currentScreen !== 'game') throw new Error('pas sur l écran de jeu');
    goBack();
    if (currentScreen !== 'calendar') throw new Error('retour vers ' + currentScreen + ' au lieu de calendar');
    showScreen('home');
    selectDay(DAYS[6]);
    goBack();
    if (currentScreen !== 'home') throw new Error('retour vers ' + currentScreen + ' au lieu de home');
});

__check('staging : rejouer efface le résultat et rouvre l intro', () => {
    localResults = {}; serverPlayedDays = {};
    const day = DAYS.find(d => d.modeId === 'sortAsc');
    selectDay(day);
    startGame();
    const items = Array.from(board.querySelectorAll('.item'));
    items.sort((a, b) => parseFloat(a.dataset.value) - parseFloat(b.dataset.value));
    items.forEach(it => it.click());
    verifyOrder();
    if (!localResults[day.id]) throw new Error('résultat non enregistré avant rejeu');
    const replayBtn = document.getElementById('replay-btn');
    if (replayBtn.classList.contains('hidden')) throw new Error('bouton rejouer invisible en staging');
    replayBtn.click();
    __clock.tick(500);
    if (localResults[day.id]) throw new Error('résultat non effacé par le rejeu');
    if (introPanel.classList.contains('hidden')) throw new Error('intro non rouverte après rejeu');
    if (currentScreen !== 'game') throw new Error('pas sur l écran de jeu');
    goHome();
});

__check('badges « ! » : système retiré, plus jamais affichés', () => {
    localResults = {}; serverPlayedDays = {}; testedRevs = {};
    buildCalendar();
    const grid = document.querySelectorAll('#calendar-months .totest').length;
    setCalendarView('list');
    const liste = document.querySelectorAll('#calendar-months .dr-totest').length;
    setCalendarView('grid');
    if (grid + liste !== 0) throw new Error('badges encore visibles : ' + (grid + liste));
    if (DAYS.some(d => needsTest(d))) throw new Error('needsTest signale encore des jours');
});

__check('série : gel consommé sur un jour manqué, cassée sans gel', () => {
    localResults = {}; serverPlayedDays = {};
    const today = todayDayId();
    // Victoire hier + aujourd'hui = série de 2
    streakData = { count: 0, lastDay: 0, freezes: 0, grantMonth: 'x', frozenUsed: 0 };
    streakData.lastDay = today - 1; streakData.count = 5;
    updateStreakOnWin();
    if (streakData.count !== 6) throw new Error('série attendue 6, obtenue ' + streakData.count);
    // Un jour manqué AVEC gel : la série continue et consomme le gel
    streakData = { count: 10, lastDay: today - 2, freezes: 1, grantMonth: 'x', frozenUsed: 0 };
    updateStreakOnWin();
    if (streakData.count !== 11) throw new Error('gel non appliqué : ' + streakData.count);
    if (streakData.freezes !== 0) throw new Error('gel non consommé');
    if (streakData.frozenUsed !== 1) throw new Error('frozenUsed attendu');
    // Un jour manqué SANS gel : la série repart à 1
    streakData = { count: 10, lastDay: today - 2, freezes: 0, grantMonth: 'x', frozenUsed: 0 };
    updateStreakOnWin();
    if (streakData.count !== 1) throw new Error('série non cassée : ' + streakData.count);
    // Semaine parfaite : passage à 7 → +1 gel
    streakData = { count: 6, lastDay: today - 1, freezes: 0, grantMonth: 'x', frozenUsed: 0 };
    updateStreakOnWin();
    if (streakData.count !== 7 || streakData.freezes !== 1) throw new Error('bonus semaine parfaite manquant');
});

__check('rattrapage : jour passé marqué late, hors série ; médailles comptées', () => {
    localResults = {}; serverPlayedDays = {};
    streakData = { count: 3, lastDay: 0, freezes: 0, grantMonth: 'x', frozenUsed: 0 };
    const today = todayDayId();
    const pastDay = DAYS.find(d => !d.empty && d.id !== today);
    saveLocalResult(pastDay.id, 10, 8.0, true);
    if (!localResults[pastDay.id].late) throw new Error('rattrapage non marqué late');
    if (streakData.count !== 3) throw new Error('le rattrapage a touché la série');
    const medals = monthMedals();
    if (medals.length !== 12) throw new Error('12 mois attendus');
    const m0 = medals[0];
    if (m0.active < 28 || m0.won !== (pastDay.id <= 31 ? 1 : 0)) throw new Error('comptage janvier incohérent : ' + m0.active + '/' + m0.won);
    // Mois complet simulé → médaille d'or
    localResults = {};
    for (let id = 1; id <= 31; id++) {
        const day = DAYS.find(x => x.id === id);
        if (day && !day.empty) localResults[id] = { isWin: true, time: 5, rev: 0 };
    }
    if (monthMedals()[0].medal !== 'or') throw new Error('médaille d or attendue sur janvier complet');
});

__check('jour déjà joué → pas de seconde tentative', () => {
    localResults = {};
    const day = DAYS[10];
    saveLocalResult(day.id, 10, 4.5, true);
    selectDay(day);
    if (!introPanel.classList.contains('hidden')) throw new Error('intro visible alors que déjà joué');
    if (resultPanel.classList.contains('hidden')) throw new Error('résultat non affiché');
    goHome();
});
`;

try {
    window.eval(bundle + TEST_CODE);
} catch (e) {
    console.error('BUNDLE FAIL: ' + e.message + '\n' + (e.stack || '').split('\n').slice(0, 4).join('\n'));
    process.exit(1);
}

let failures = 0;
for (const [status, label] of window.__results) {
    if (status === 'ok') console.log('✓ ' + label);
    else { failures++; console.error('✗ ' + label); }
}
if (jsErrors.length) {
    console.error('\nErreurs jsdom :');
    jsErrors.forEach(e => console.error('  - ' + e));
}
console.log(failures === 0 && jsErrors.length === 0 ? '\nTOUS LES TESTS PASSENT' : `\n${failures} échec(s), ${jsErrors.length} erreur(s) console`);
process.exit(failures || jsErrors.length ? 1 : 0);
