// Captures de l'ANCIENNE version (worktree git de HEAD) en format mobile.
const http = require('http');
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-core');

const ROOT = 'C:\\Users\\w.hadjmouldi\\Documents\\GitHub\\orderix-old';
const MIME = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript' };
const server = http.createServer((req, res) => {
    let p = req.url.split('?')[0]; if (p === '/') p = '/index.html';
    const file = path.join(ROOT, p);
    if (!fs.existsSync(file)) { res.writeHead(404); res.end(); return; }
    res.writeHead(200, { 'Content-Type': (MIME[path.extname(file)] || 'application/octet-stream') + '; charset=utf-8' });
    res.end(fs.readFileSync(file));
});

(async () => {
    await new Promise(r => server.listen(8767, r));
    const browser = await puppeteer.launch({
        executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
        headless: 'new', args: ['--no-first-run', '--disable-gpu']
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    await page.setRequestInterception(true);
    page.on('request', r => r.url().includes('script.google.com') ? r.abort() : r.continue());

    await page.goto('http://localhost:8767/', { waitUntil: 'networkidle0', timeout: 20000 });
    await new Promise(r => setTimeout(r, 1200));
    fs.mkdirSync('shots', { recursive: true });
    await page.screenshot({ path: 'shots/old-01-home.png' });

    // Sélection du jour 1 (aperçu de l'exemple)
    await page.evaluate(`
        const day = DAYS[0];
        const btn = document.querySelector('.day-btn');
        if (btn) selectDay(day, btn);
    `);
    await new Promise(r => setTimeout(r, 600));
    await page.screenshot({ path: 'shots/old-02-day.png' });
    console.log('ok');
    await browser.close();
    server.close();
})();
