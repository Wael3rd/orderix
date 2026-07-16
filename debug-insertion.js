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
    await page.goto('http://localhost:8765/', { waitUntil: 'networkidle0', timeout: 20000 });
    await new Promise(r => setTimeout(r, 900));

    const out = await page.evaluate(`
        (function() {
            try {
                const day = DAYS.find(d => d.modeId === 'insertion');
                if (!day) return 'PAS DE JOUR insertion. Jours 1-12: ' + DAYS.slice(0,12).map(d => d.id + ':' + d.modeId).join(', ');
                selectDay(day);
                const introVisible = !introPanel.classList.contains('hidden');
                startGame();
                return JSON.stringify({ dayId: day.id, type: day.type, screen: currentScreen, introVisible, boardChildren: board.children.length });
            } catch (e) {
                return 'EXCEPTION: ' + e.message + ' | ' + (e.stack || '').split('\\n')[1];
            }
        })()
    `);
    console.log(out);
    await browser.close();
    server.close();
})();
