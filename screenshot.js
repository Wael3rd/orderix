// Captures d'écran mobiles de l'app via Edge headless.
const http = require('http');
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-core');

const ROOT = path.join(__dirname, 'www');
const MIME = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.woff2': 'font/woff2', '.svg': 'image/svg+xml', '.png': 'image/png' };

const server = http.createServer((req, res) => {
    let p = req.url.split('?')[0];
    if (p === '/') p = '/index.html';
    const file = path.join(ROOT, p);
    if (!file.startsWith(ROOT) || !fs.existsSync(file)) { res.writeHead(404); res.end(); return; }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' });
    res.end(fs.readFileSync(file));
});

(async () => {
    await new Promise(r => server.listen(8765, r));
    const browser = await puppeteer.launch({
        executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
        headless: 'new',
        args: ['--no-first-run', '--disable-gpu']
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });

    const errors = [];
    page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));
    page.on('console', m => { if (m.type() === 'error') errors.push('CONSOLE: ' + m.text()); });

    // Bloque le backend GAS pour simuler le hors-ligne
    await page.setRequestInterception(true);
    page.on('request', r => {
        if (r.url().includes('script.google.com')) r.abort();
        else r.continue();
    });

    await page.goto('http://localhost:8765/', { waitUntil: 'networkidle0', timeout: 20000 });
    await new Promise(r => setTimeout(r, 1400));
    fs.mkdirSync('shots', { recursive: true });
    await page.screenshot({ path: 'shots/01-home.png' });

    await page.evaluate(`showScreen('calendar')`);
    await new Promise(r => setTimeout(r, 600));
    await page.screenshot({ path: 'shots/02-calendar.png' });

    await page.evaluate(`showScreen('profile')`);
    await new Promise(r => setTimeout(r, 500));
    await page.screenshot({ path: 'shots/03-profile.png' });

    // Écran de jeu : intro d'un tri
    await page.evaluate(`selectDay(DAYS.find(d => d.modeId === 'sortAsc'))`);
    await new Promise(r => setTimeout(r, 600));
    await page.screenshot({ path: 'shots/04-game-intro.png' });

    // Partie en cours
    await page.evaluate(`startGame()`);
    await new Promise(r => setTimeout(r, 500));
    await page.screenshot({ path: 'shots/05-game-board.png' });

    // Victoire (tri automatique) → panneau de résultat
    await page.evaluate(`
        const items = Array.from(board.querySelectorAll('.item'));
        items.sort((a, b) => parseFloat(a.dataset.value) - parseFloat(b.dataset.value));
        items.forEach(it => it.click());
        verifyOrder();
    `);
    await new Promise(r => setTimeout(r, 900));
    await page.screenshot({ path: 'shots/06-result.png' });

    // Mode clavier (dactylographie)
    await page.evaluate(`goHome(); localResults = {}; selectDay(DAYS.find(d => d.modeId === 'typingTest')); startGame();`);
    await new Promise(r => setTimeout(r, 500));
    await page.screenshot({ path: 'shots/07-typing.png' });

    await browser.close();
    server.close();
    if (errors.length) { console.log('ERREURS:'); errors.forEach(e => console.log('  ' + e)); }
    else console.log('Aucune erreur console. 7 captures dans shots/');
})();
