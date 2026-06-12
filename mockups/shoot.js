// Capture les mockups en format mobile (Edge headless).
const http = require('http');
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-core');

const ROOT = __dirname;
const server = http.createServer((req, res) => {
    const file = path.join(ROOT, req.url.split('?')[0]);
    if (!fs.existsSync(file)) { res.writeHead(404); res.end(); return; }
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(fs.readFileSync(file));
});

(async () => {
    await new Promise(r => server.listen(8766, r));
    const browser = await puppeteer.launch({
        executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
        headless: 'new', args: ['--no-first-run', '--disable-gpu']
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true });

    const files = fs.readdirSync(ROOT).filter(f => f.endsWith('.html'));
    for (const f of files) {
        await page.goto('http://localhost:8766/' + f, { waitUntil: 'networkidle0', timeout: 30000 });
        await new Promise(r => setTimeout(r, 700)); // polices
        await page.screenshot({ path: path.join(ROOT, f.replace('.html', '.png')) });
        console.log('✓ ' + f);
    }
    await browser.close();
    server.close();
})();
