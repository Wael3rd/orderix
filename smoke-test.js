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
__check('modes et types valides', () => {
    DAYS.forEach(d => { if (!GAME_MODES[d.modeId]) throw new Error('mode inconnu: ' + d.modeId); });
    DAYS.forEach(d => {
        if (!BASE_TYPES.find(b => b.type === d.type)) throw new Error('type inconnu: ' + d.type);
    });
});

Object.keys(GAME_MODES).forEach(modeId => {
    __check('mode ' + modeId + ' (intro + partie)', () => {
        const day = DAYS.find(d => d.modeId === modeId);
        if (!day) throw new Error('aucun jour pour ce mode');
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
    saveLocalResult(tid, 10, 5.2, true);
    saveLocalResult(tid - 1, 10, 6.1, true);
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
