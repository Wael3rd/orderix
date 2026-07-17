// Capture rapide du mode Tremblement (jauge de mélange), jour 12.
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
    await page.evaluate(`
        localResults = {}; serverPlayedDays = {};
        selectDay(DAYS.find(d => d.modeId === 'shuffleSort'));
        startGame();
    `);
    await new Promise(r => setTimeout(r, 1400)); // jauge à ~55%
    await page.screenshot({ path: 'shots/shuffle-gauge.png' });
    console.log('ok jour ' + await page.evaluate(`currentDayConfig.id`));
    await browser.close();
    server.close();
})();
