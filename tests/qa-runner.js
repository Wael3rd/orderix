// ─── Orderix QA Runner ───────────────────────────────────────────
// Pilote l'émulateur Android via adb + Chrome DevTools Protocol
// (WebView Capacitor), exécute les scénarios du spec, et produit
// un rapport JSON + Markdown.
//
// Usage : node tests/qa-runner.js [--update-baselines]
// Prérequis : émulateur orderix_test démarré, APK installé.

const { execSync, exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const http = require('http');

const ADB = 'C:\\Android\\sdk\\platform-tools\\adb.exe';
const PKG = 'com.orderix.app.dev';
const ACTIVITY = PKG + '/com.orderix.app.MainActivity';
const BASELINE_DIR = path.join(__dirname, 'baselines');
const SCREENSHOT_DIR = path.join(__dirname, 'screenshots');
const UPDATE_BASELINES = process.argv.includes('--update-baselines');

fs.mkdirSync(BASELINE_DIR, { recursive: true });
fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

const results = [];
let cdpWs = null;
let cmdId = 1;

// ─── Helpers adb ─────────────────────────────────────────────────
function adb(args) {
    return execSync(`"${ADB}" ${args}`, { encoding: 'utf8', timeout: 30000 }).trim();
}

function sleep(ms) {
    return new Promise(r => setTimeout(r, ms));
}

function screenshot(name) {
    adb('shell screencap -p /sdcard/orderix_test.png');
    adb(`pull /sdcard/orderix_test.png "${path.join(SCREENSHOT_DIR, name)}"`);
    return path.join(SCREENSHOT_DIR, name);
}

function tap(x, y) {
    adb(`shell input tap ${x} ${y}`);
}

function back() {
    adb('shell input keyevent KEYCODE_BACK');
}

// ─── Helpers CDP (Chrome DevTools Protocol via WebView) ──────────
function cdpSend(method, params = {}) {
    return new Promise((resolve, reject) => {
        const id = cmdId++;
        const msg = JSON.stringify({ id, method, params });
        cdpWs.send(msg);
        const handler = (data) => {
            const resp = JSON.parse(data.toString());
            if (resp.id === id) {
                cdpWs.removeListener('message', handler);
                if (resp.error) reject(new Error(resp.error.message));
                else resolve(resp.result);
            }
        };
        cdpWs.on('message', handler);
        setTimeout(() => reject(new Error('CDP timeout')), 10000);
    });
}

async function evaluate(expr) {
    const res = await cdpSend('Runtime.evaluate', {
        expression: expr,
        returnByValue: true,
        awaitPromise: false
    });
    if (res.exceptionDetails) throw new Error(res.exceptionDetails.text || 'JS error');
    return res.result.value;
}

async function connectCDP() {
    // Forward le port de debug WebView
    try { adb('forward tcp:9222 localabstract:webview_devtools_remote_' + adb('shell pidof ' + PKG)); }
    catch (e) {
        // Fallback : cherche le socket webview générique
        adb('forward tcp:9222 localabstract:webview_devtools_remote');
    }

    // Récupère l'URL du websocket
    const json = await new Promise((resolve, reject) => {
        http.get('http://127.0.0.1:9222/json', res => {
            let d = '';
            res.on('data', c => d += c);
            res.on('end', () => resolve(JSON.parse(d)));
        }).on('error', reject);
    });

    const wsUrl = json[0].webSocketDebuggerUrl;
    const WebSocket = require('ws');
    cdpWs = new WebSocket(wsUrl);
    await new Promise((resolve, reject) => {
        cdpWs.on('open', resolve);
        cdpWs.on('error', reject);
    });
    await cdpSend('Runtime.enable');
}

// ─── Comparaison visuelle ────────────────────────────────────────
async function compareBaseline(name, threshold = 0.02) {
    const shot = screenshot(name + '.png');
    const baseFile = path.join(BASELINE_DIR, name + '.png');

    if (UPDATE_BASELINES) {
        fs.copyFileSync(shot, baseFile);
        return { status: 'baseline_updated', diff_pct: 0 };
    }

    if (!fs.existsSync(baseFile)) {
        return { status: 'no_baseline', diff_pct: -1 };
    }

    // Comparaison pixel par pixel via sharp
    const sharp = require('sharp');
    const [a, b] = await Promise.all([
        sharp(baseFile).raw().toBuffer({ resolveWithObject: true }),
        sharp(shot).resize({ width: undefined, height: undefined, fit: 'fill' }).raw().toBuffer({ resolveWithObject: true })
    ]);

    // Si les tailles diffèrent, c'est un échec
    if (a.info.width !== b.info.width || a.info.height !== b.info.height) {
        return { status: 'fail', diff_pct: 100, reason: 'size_mismatch' };
    }

    let diffPixels = 0;
    const total = a.info.width * a.info.height;
    for (let i = 0; i < a.data.length; i += a.info.channels) {
        const dr = Math.abs(a.data[i] - b.data[i]);
        const dg = Math.abs(a.data[i + 1] - b.data[i + 1]);
        const db = Math.abs(a.data[i + 2] - b.data[i + 2]);
        if (dr + dg + db > 30) diffPixels++;  // seuil de bruit
    }
    const pct = diffPixels / total;

    if (pct > threshold) return { status: 'fail', diff_pct: +(pct * 100).toFixed(2) };
    if (pct > threshold * 0.5) return { status: 'warn', diff_pct: +(pct * 100).toFixed(2) };
    return { status: 'pass', diff_pct: +(pct * 100).toFixed(2) };
}

// ─── Performance ─────────────────────────────────────────────────
function getJankyFrames() {
    adb(`shell dumpsys gfxinfo ${PKG} reset`);
    return function measure() {
        const out = adb(`shell dumpsys gfxinfo ${PKG}`);
        const match = out.match(/Janky frames:\s*(\d+)\s*\((\d+\.\d+)%\)/);
        const total = out.match(/Total frames rendered:\s*(\d+)/);
        return {
            janky_pct: match ? parseFloat(match[2]) : -1,
            total_frames: total ? parseInt(total[1]) : 0
        };
    };
}

function getMemory() {
    const out = adb(`shell dumpsys meminfo ${PKG}`);
    const match = out.match(/TOTAL\s+(\d+)/);
    return match ? Math.round(parseInt(match[1]) / 1024) : -1; // Mo
}

function getColdStartTime() {
    adb(`shell am force-stop ${PKG}`);
    const out = adb(`shell am start -W -n ${ACTIVITY}`);
    const match = out.match(/TotalTime:\s*(\d+)/);
    return match ? parseInt(match[1]) : -1;
}

// ─── Enregistrement des résultats ────────────────────────────────
function record(id, name, status, extra = {}) {
    results.push({ id, name, status, ...extra });
    const icon = (status === 'pass' || status === 'baseline_updated') ? '✓' : (status === 'warn' || status === 'no_baseline' ? '⚠' : '✗');
    console.log(`${icon} ${id} — ${name}${extra.diff_pct !== undefined ? ` (${extra.diff_pct}%)` : ''}`);
}

// ─── Scénarios ───────────────────────────────────────────────────
async function runTests() {
    const start = Date.now();

    console.log('═══ Orderix QA Runner ═══\n');

    // Attendre que l'émulateur soit prêt
    console.log('En attente de l\'émulateur...');
    try { adb('wait-for-device'); } catch (e) { console.error('Pas d\'émulateur détecté.'); process.exit(1); }

    // Installer l'APK
    const apkDev = path.join(__dirname, '..', 'android', 'app', 'build', 'outputs', 'apk', 'dev', 'debug', 'app-dev-debug.apk');
    const apkProd = path.join(__dirname, '..', 'Orderix-debug.apk');
    const apk = fs.existsSync(apkDev) ? apkDev : apkProd;
    console.log('Installation de l\'APK...');
    adb(`install -r "${apk}"`);

    // ── N1 : Démarrage à froid ──
    const coldStart = getColdStartTime();
    // Seuil élargi pour l'émulateur swiftshader (2-3× plus lent qu'un vrai téléphone)
    record('N1', 'Démarrage à froid', coldStart <= 4000 ? 'pass' : (coldStart <= 6000 ? 'warn' : 'fail'),
        { duration_ms: coldStart });
    await sleep(2500);  // laisser le boot loader + animations

    // Connecter CDP
    try {
        await connectCDP();
        console.log('CDP connecté à la WebView.\n');
    } catch (e) {
        console.error('Impossible de connecter CDP :', e.message);
        console.error('Vérifiez que l\'app est en mode debug (flavor dev).');
        process.exit(1);
    }

    // ── V1 : Baseline accueil ──
    const v1 = await compareBaseline('home-fresh', 0.02);
    record('V1', 'Régression accueil', v1.status, { diff_pct: v1.diff_pct });

    // ── N2 : Navigation entre onglets ──
    try {
        await evaluate(`showScreen('calendar')`);
        await sleep(600);
        const isCal = await evaluate(`currentScreen`);

        await evaluate(`showScreen('league')`);
        await sleep(600);
        const isLeague = await evaluate(`currentScreen`);

        await evaluate(`showScreen('profile')`);
        await sleep(600);
        const isProfile = await evaluate(`currentScreen`);

        await evaluate(`showScreen('home')`);
        await sleep(600);
        const isHome = await evaluate(`currentScreen`);

        record('N2', 'Navigation onglets',
            (isCal === 'calendar' && isLeague === 'league' && isProfile === 'profile' && isHome === 'home') ? 'pass' : 'fail');
    } catch (e) {
        record('N2', 'Navigation onglets', 'fail', { error: e.message });
    }

    // ── V2 : Baseline calendrier ──
    await evaluate(`showScreen('calendar')`);
    await sleep(600);
    const v2 = await compareBaseline('calendar-empty', 0.05); // le marqueur « today » change chaque jour
    record('V2', 'Régression calendrier', v2.status, { diff_pct: v2.diff_pct });

    // ── V3 : Baseline profil ──
    await evaluate(`showScreen('profile')`);
    await sleep(600);
    const v3 = await compareBaseline('profile-empty', 0.02);
    record('V3', 'Régression profil', v3.status, { diff_pct: v3.diff_pct });

    // ── N3 : Calendrier → jour → retour ──
    try {
        await evaluate(`showScreen('calendar')`);
        await sleep(400);
        await evaluate(`localResults = {}; serverPlayedDays = {};`);
        await evaluate(`selectDay(DAYS[5])`);
        await sleep(600);
        const onGame = await evaluate(`currentScreen`);
        await evaluate(`goBack()`);
        await sleep(600);
        const backToCal = await evaluate(`currentScreen`);
        record('N3', 'Calendrier → jour → retour', (onGame === 'game' && backToCal === 'calendar') ? 'pass' : 'fail');
    } catch (e) {
        record('N3', 'Calendrier → jour → retour', 'fail', { error: e.message });
    }

    // ── N4 : Accueil → jour → retour ──
    try {
        await evaluate(`showScreen('home')`);
        await sleep(400);
        await evaluate(`localResults = {}; serverPlayedDays = {};`);
        await evaluate(`selectDay(DAYS.find(d => d.id === todayDayId()))`);
        await sleep(600);
        await evaluate(`goBack()`);
        await sleep(600);
        const backToHome = await evaluate(`currentScreen`);
        record('N4', 'Accueil → jour → retour', backToHome === 'home' ? 'pass' : 'fail');
    } catch (e) {
        record('N4', 'Accueil → jour → retour', 'fail', { error: e.message });
    }

    // ── G1 : Tri croissant — victoire ──
    try {
        await evaluate(`localResults = {}; serverPlayedDays = {};`);
        await evaluate(`selectDay(DAYS.find(d => d.modeId === 'sortAsc'))`);
        await sleep(500);

        // V4 : Baseline intro
        const v4 = await compareBaseline('game-intro-day1', 0.03);
        record('V4', 'Régression intro jeu', v4.status, { diff_pct: v4.diff_pct });

        await evaluate(`startGame()`);
        await sleep(800);

        // Jouer : trier les items par valeur croissante et cliquer
        const won = await evaluate(`
            (function() {
                const items = Array.from(board.querySelectorAll('.item'));
                if (!items.length) return false;
                items.sort((a, b) => parseFloat(a.dataset.value) - parseFloat(b.dataset.value));
                items.forEach(it => it.click());
                verifyOrder();
                return resultPanel && !resultPanel.classList.contains('hidden') && localResults[currentDayConfig.id] && localResults[currentDayConfig.id].isWin;
            })()
        `);
        await sleep(1000);

        record('G1', 'Tri croissant — victoire', won ? 'pass' : 'fail');

        // V6 : Baseline résultat
        const v6 = await compareBaseline('result-win', 0.12); // confettis aléatoires + temps variable
        record('V6', 'Régression résultat victoire', v6.status, { diff_pct: v6.diff_pct });
    } catch (e) {
        record('G1', 'Tri croissant — victoire', 'fail', { error: e.message });
    }

    // ── G2 : Tri croissant — défaite ──
    try {
        await evaluate(`localResults = {}; serverPlayedDays = {};`);
        await evaluate(`selectDay(DAYS.find(d => d.modeId === 'sortDesc'))`);
        await sleep(500);
        await evaluate(`startGame()`);
        await sleep(800);

        const lost = await evaluate(`
            (function() {
                const items = Array.from(board.querySelectorAll('.item'));
                if (!items.length) return false;
                items.sort((a, b) => parseFloat(a.dataset.value) - parseFloat(b.dataset.value));
                items.forEach(it => it.click());
                verifyOrder();
                return resultPanel && !resultPanel.classList.contains('hidden') && localResults[currentDayConfig.id] && !localResults[currentDayConfig.id].isWin;
            })()
        `);
        record('G2', 'Tri décroissant — défaite (ordre inverse)', lost ? 'pass' : 'fail');
        await evaluate(`goHome()`);
        await sleep(500);
    } catch (e) {
        record('G2', 'Tri décroissant — défaite', 'fail', { error: e.message });
    }

    // ── G3 : Chasse au Max — victoire ──
    try {
        await evaluate(`localResults = {}; serverPlayedDays = {};`);
        await evaluate(`selectDay(DAYS.find(d => d.modeId === 'findMax'))`);
        await sleep(500);
        await evaluate(`startGame()`);
        await sleep(800);

        const wonMax = await evaluate(`
            (function() {
                const items = Array.from(board.querySelectorAll('.item'));
                if (!items.length) return false;
                let best = items[0]; let bestVal = parseFloat(best.dataset.value);
                items.forEach(it => { const v = parseFloat(it.dataset.value); if (v > bestVal) { bestVal = v; best = it; } });
                best.click();
                return localResults[currentDayConfig.id] && localResults[currentDayConfig.id].isWin;
            })()
        `);
        record('G3', 'Chasse au Max — victoire', wonMax ? 'pass' : 'fail');
        await evaluate(`goHome()`);
        await sleep(500);
    } catch (e) {
        record('G3', 'Chasse au Max — victoire', 'fail', { error: e.message });
    }

    // ── G4 : Chasse au Max — défaite ──
    try {
        await evaluate(`localResults = {}; serverPlayedDays = {};`);
        await evaluate(`selectDay(DAYS.find(d => d.modeId === 'findMin'))`);
        await sleep(500);
        await evaluate(`startGame()`);
        await sleep(800);

        const lostMin = await evaluate(`
            (function() {
                const items = Array.from(board.querySelectorAll('.item'));
                if (!items.length) return false;
                let worst = items[0]; let worstVal = parseFloat(worst.dataset.value);
                items.forEach(it => { const v = parseFloat(it.dataset.value); if (v > worstVal) { worstVal = v; worst = it; } });
                worst.click(); // le plus grand au lieu du plus petit = erreur
                return localResults[currentDayConfig.id] && !localResults[currentDayConfig.id].isWin;
            })()
        `);
        record('G4', 'Chasse au Min — défaite (mauvais item)', lostMin ? 'pass' : 'fail');
        await evaluate(`goHome()`);
        await sleep(500);
    } catch (e) {
        record('G4', 'Chasse au Min — défaite', 'fail', { error: e.message });
    }

    // ── N6 : Jour déjà joué ──
    try {
        // Simuler un jour déjà joué (comme le ferait une vraie partie)
        await evaluate(`
            var testDay = DAYS.find(d => d.modeId === 'sortAsc');
            saveLocalResult(testDay.id, 10, 1.5, true);
            selectDay(testDay);
        `);
        await sleep(600);
        const noRetry = await evaluate(`introPanel.classList.contains('hidden') && !resultPanel.classList.contains('hidden')`);
        record('N6', 'Jour déjà joué — pas de rejeu', noRetry ? 'pass' : 'fail');
        await evaluate(`goHome()`);
        await sleep(500);
    } catch (e) {
        record('N6', 'Jour déjà joué', 'fail', { error: e.message });
    }

    // ── P4 : Mémoire au repos ──
    const memIdle = getMemory();
    record('P4', 'Mémoire au repos', memIdle <= 120 ? 'pass' : (memIdle <= 180 ? 'warn' : 'fail'),
        { memory_mb: memIdle });

    // ── P6 : Temps de démarrage (déjà mesuré en N1) ──
    record('P6', 'Cold start', coldStart <= 4000 ? 'pass' : 'warn', { cold_start_ms: coldStart });

    // ─── Rapport ─────────────────────────────────────────────────
    const duration = Math.round((Date.now() - start) / 1000);
    const summary = {
        total: results.length,
        pass: results.filter(r => r.status === 'pass' || r.status === 'baseline_updated').length,
        warn: results.filter(r => r.status === 'warn' || r.status === 'no_baseline').length,
        fail: results.filter(r => r.status === 'fail').length
    };

    const report = {
        timestamp: new Date().toISOString(),
        device: 'orderix_test (emulator, API 34)',
        package: PKG,
        duration_s: duration,
        results: results,
        summary: summary,
        performance: { cold_start_ms: coldStart, memory_idle_mb: memIdle }
    };

    fs.writeFileSync(path.join(__dirname, 'report.json'), JSON.stringify(report, null, 2));

    // Rapport Markdown
    let md = `# Orderix — Rapport QA\n\n`;
    md += `**Date** : ${report.timestamp}  \n`;
    md += `**Appareil** : ${report.device}  \n`;
    md += `**Durée** : ${duration} s  \n\n`;
    md += `## Résumé : ${summary.pass} ✓ · ${summary.warn} ⚠ · ${summary.fail} ✗ / ${summary.total}\n\n`;
    md += `| # | Test | Résultat | Détails |\n|---|---|---|---|\n`;
    results.forEach(r => {
        const icon = r.status === 'pass' ? '✓' : (r.status === 'warn' ? '⚠' : '✗');
        const details = [];
        if (r.diff_pct !== undefined) details.push(`diff ${r.diff_pct}%`);
        if (r.duration_ms !== undefined) details.push(`${r.duration_ms} ms`);
        if (r.memory_mb !== undefined) details.push(`${r.memory_mb} Mo`);
        if (r.janky_pct !== undefined) details.push(`janky ${r.janky_pct}%`);
        if (r.error) details.push(r.error);
        md += `| ${r.id} | ${r.name} | ${icon} ${r.status} | ${details.join(', ')} |\n`;
    });
    md += `\n**Performance** : cold start ${coldStart} ms · mémoire repos ${memIdle} Mo\n`;
    fs.writeFileSync(path.join(__dirname, 'report.md'), md);

    console.log(`\n═══ ${summary.pass} ✓ · ${summary.warn} ⚠ · ${summary.fail} ✗ / ${summary.total} (${duration} s) ═══`);

    cdpWs.close();
    process.exit(summary.fail > 0 ? 1 : 0);
}

runTests().catch(e => { console.error('FATAL:', e); process.exit(1); });
