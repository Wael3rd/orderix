// Génère les 6 captures Google Play (1080×1920) en headless.
// Usage : node docs/store/gen-captures.js  (depuis la racine du repo)
const http = require('http');
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..', '..');
const puppeteer = require(path.join(ROOT, 'node_modules', 'puppeteer-core'));
const WWW = path.join(ROOT, 'www');
const OUT = path.join(__dirname, 'captures');
const MIME = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.woff2': 'font/woff2' };

const EDGE = process.env.EDGE_PATH || 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

const server = http.createServer((req, res) => {
    let p = req.url.split('?')[0]; if (p === '/') p = '/index.html';
    const file = path.join(WWW, p);
    if (!fs.existsSync(file)) { res.writeHead(404); res.end(); return; }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' });
    res.end(fs.readFileSync(file));
});

(async () => {
    if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });
    await new Promise(r => server.listen(8790, r));
    const browser = await puppeteer.launch({
        executablePath: EDGE, headless: 'new', args: ['--no-first-run', '--disable-gpu']
    });
    const page = await browser.newPage();
    // 360×640 @3x = exactement 1080×1920
    await page.setViewport({ width: 360, height: 640, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
    await page.setRequestInterception(true);
    page.on('request', r => r.url().includes('script.google.com') ? r.abort() : r.continue());
    await page.goto('http://localhost:8790/', { waitUntil: 'networkidle0', timeout: 20000 });
    await new Promise(r => setTimeout(r, 900));

    // Progression simulée flatteuse : janvier en or, série 12, niveau 4
    await page.evaluate(`
        document.getElementById('onboarding').classList.add('hidden');
        localResults = {};
        for (let id = 1; id <= 31; id++) { const d = DAYS.find(x => x.id === id); if (d && !d.empty) localResults[id] = { isWin: true, time: 6 + id % 9, rev: 99 }; }
        for (let id = 33; id <= 40; id++) localResults[id] = { isWin: true, time: 11, rev: 99 };
        streakData = { count: 12, lastDay: todayDayId(), freezes: 2, grantMonth: 'x', frozenUsed: 0 };
        setStorage('orderix_player_name', 'Camille');
    `);

    async function shot(nom, prep, delai) {
        await page.evaluate(prep);
        await new Promise(r => setTimeout(r, delai || 450));
        await page.screenshot({ path: path.join(OUT, nom) });
        console.log('✓ ' + nom);
    }

    await shot('1-calendrier.png', "showScreen('calendar'); setCalendarView('list'); window.scrollTo(0,0)");
    await shot('2-jeu-dominosa.png', "localResults={}; selectDay(DAYS.find(d=>d.modeId==='dominosa')); startGame()");
    await page.evaluate('goHome()');
    await shot('3-jeu-suites.png', "selectDay(DAYS.find(d=>d.modeId==='suites')); startGame()");
    await page.evaluate('goHome()');
    await shot('4-profil-medailles.png',
        "for (let id = 1; id <= 31; id++) { const d = DAYS.find(x => x.id === id); if (d && !d.empty) localResults[id] = { isWin: true, time: 6, rev: 99 }; } showScreen('profile'); window.scrollTo(0,0)");
    await shot('5-mon-annee.png',
        "document.getElementById('year-fresque').scrollIntoView({block:'center'})");
    await shot('6-personnalisation.png',
        "selectTheme('amethyste'); document.getElementById('cosmetics-zone').scrollIntoView({block:'center'})");

    await browser.close();
    server.close();
    console.log('Captures dans docs/store/captures/');
})();
