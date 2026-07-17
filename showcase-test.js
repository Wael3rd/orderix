// Vérifie le déverrouillage : mauvais mot de passe refusé, bon mot de passe → catalogue.
const http = require('http');
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-core');

const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(fs.readFileSync(path.join(__dirname, 'pages', 'index.html')));
});

(async () => {
    await new Promise(r => server.listen(8768, r));
    const browser = await puppeteer.launch({
        executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
        headless: 'new', args: ['--no-first-run', '--disable-gpu']
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 1000, height: 900, deviceScaleFactor: 1.5 });
    await page.goto('http://localhost:8768/', { waitUntil: 'networkidle0' });

    // Mauvais mot de passe
    await page.type('#pw', 'mauvais');
    await page.click('#go');
    await new Promise(r => setTimeout(r, 1500));
    const err = await page.$eval('#err', e => e.textContent);
    console.log('mauvais mdp → "' + err + '"');

    // Bon mot de passe
    await page.evaluate(`document.getElementById('pw').value = ''`);
    await page.type('#pw', 'WaelOrderix');
    await page.click('#go');
    await new Promise(r => setTimeout(r, 2500));
    const cards = await page.evaluate(`document.querySelectorAll('.card').length`);
    console.log('bon mdp → ' + cards + ' cartes de modes affichées');
    await page.screenshot({ path: 'shots/showcase-unlocked.png', clip: { x: 0, y: 0, width: 1000, height: 900 } });

    await browser.close();
    server.close();
    process.exit(cards >= 41 && err.length > 0 ? 0 : 1);
})();
