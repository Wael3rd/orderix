// Captures des nouveaux modes (intro + partie en cours).
// Un rechargement complet par mode : isolation totale des états.
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
    await new Promise(r => server.listen(8765, r));
    const browser = await puppeteer.launch({
        executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
        headless: 'new', args: ['--no-first-run', '--disable-gpu']
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    await page.setRequestInterception(true);
    page.on('request', r => r.url().includes('script.google.com') ? r.abort() : r.continue());
    const errors = [];
    page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));

    const list = process.argv.slice(2).length ? process.argv.slice(2) : ['orderChain', 'insertion', 'cascade'];
    for (const modeId of list) {
        await page.goto('http://localhost:8765/', { waitUntil: 'networkidle0', timeout: 20000 });
        await new Promise(r => setTimeout(r, 900));

        await page.evaluate(`
            localResults = {}; serverPlayedDays = {};
            selectDay(DAYS.find(d => d.modeId === '${modeId}'));
        `);
        await new Promise(r => setTimeout(r, 450));
        await page.screenshot({ path: `shots/new-${modeId}-intro.png` });

        await page.evaluate(`startGame()`);
        await new Promise(r => setTimeout(r, 600));
        if (modeId === 'orderChain') {
            await page.evaluate(`
                const items = Array.from(board.querySelectorAll('.item:not(.chain-done)'));
                items.sort((a, b) => parseFloat(a.dataset.value) - parseFloat(b.dataset.value));
                items[0].click(); if (items[1]) items[1].click();
            `);
        }
        await new Promise(r => setTimeout(r, 400));
        await page.screenshot({ path: `shots/new-${modeId}-game.png` });
        console.log('✓ ' + modeId + ' → ' + await page.evaluate(`currentScreen`));
    }

    await browser.close();
    server.close();
    if (errors.length) { console.log('ERREURS:'); errors.forEach(e => console.log('  ' + e)); process.exit(1); }
    console.log('ok');
})();
