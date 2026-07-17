// Capture l'écran d'introduction (consigne + exemple) de chaque mode.
// Rechargement complet entre chaque mode : isolation totale des états.
const http = require('http');
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-core');

const ROOT = path.join(__dirname, 'www');
const MIME = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.woff2': 'font/woff2' };
const server = http.createServer((req, res) => {
    let p = req.url.split('?')[0]; if (p === '/') p = '/index.html';
    const file = path.join(ROOT, p);
    if (!fs.existsSync(file)) { res.writeHead(404); res.end(); return; }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' });
    res.end(fs.readFileSync(file));
});

(async () => {
    fs.mkdirSync(path.join(__dirname, 'shots', 'modes'), { recursive: true });
    await new Promise(r => server.listen(8765, r));
    const browser = await puppeteer.launch({
        executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
        headless: 'new', args: ['--no-first-run', '--disable-gpu']
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 390, height: 900, deviceScaleFactor: 1.5, isMobile: true, hasTouch: true });
    await page.setRequestInterception(true);
    page.on('request', r => r.url().includes('script.google.com') ? r.abort() : r.continue());

    // Récupère la liste des modes depuis l'app elle-même
    await page.goto('http://localhost:8765/', { waitUntil: 'networkidle0', timeout: 20000 });
    const modeIds = await page.evaluate(`Object.keys(GAME_MODES)`);
    console.log(modeIds.length + ' modes à capturer');

    for (const modeId of modeIds) {
        await page.goto('http://localhost:8765/', { waitUntil: 'networkidle0', timeout: 20000 });
        await new Promise(r => setTimeout(r, 700));
        const ok = await page.evaluate(`
            (function() {
                localResults = {}; serverPlayedDays = {};
                const day = DAYS.find(d => d.modeId === '${modeId}');
                if (!day) return 'aucun jour';
                selectDay(day);
                return 'ok';
            })()
        `);
        if (ok !== 'ok') { console.log('✗ ' + modeId + ' : ' + ok); continue; }
        await new Promise(r => setTimeout(r, 550));
        const el = await page.$('#intro-panel');
        await el.screenshot({ path: path.join(__dirname, 'shots', 'modes', modeId + '.jpg'), type: 'jpeg', quality: 72 });
        console.log('✓ ' + modeId);
    }

    await browser.close();
    server.close();
})();
