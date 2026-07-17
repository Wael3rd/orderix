// Construit le catalogue des modes, le chiffre (AES-GCM, clé dérivée du mot
// de passe via PBKDF2) et génère pages/index.html : un déverrouilleur qui
// déchiffre dans le navigateur. Le contenu est illisible sans le mot de passe.
// Usage : node showcase-build.js <motdepasse>
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');
const { webcrypto } = require('crypto');

const PASSWORD = process.argv[2];
if (!PASSWORD) { console.error('Usage : node showcase-build.js <motdepasse>'); process.exit(1); }

// ── Métadonnées des modes depuis data.js ──
const dom = new JSDOM('<body></body>', { url: 'https://x/', runScripts: 'outside-only' });
dom.window.eval(fs.readFileSync('www/scripts/data.js', 'utf8') + ';window.__M = GAME_MODES;');
const MODES = dom.window.__M;

const GROUPS = [
    ['⭐ Modes phares (janvier 1-3)', ['orderChain', 'cascade', 'insertion']],
    ['🗓️ La vague de janvier (4-30)', ['fontaine', 'metronome', 'laSuite', 'patience', 'duel', 'rummy', 'dominoOrder', 'escalier', 'tubes', 'swapSort', 'boulons', 'fileBloquee', 'etageres', 'hanoi', 'rangement', 'futoshiki', 'balance', 'ordreCache', 'indices', 'chronologie', 'aiguillage', 'ascenseur', 'guichet', 'photoClasse', 'memoryChain', 'fusion']],
    ['Tris', ['sortAsc', 'sortDesc', 'evensAsc', 'oddsDesc', 'flashSort', 'blindSort', 'mirrorSort', 'shuffleSort', 'blackout', 'shrinkSort']],
    ['Chasses — 3 manches + 1 joker', ['findMax', 'findMin', 'median', 'flashMax', 'doubleTapMax', 'longPressMin', 'findOdd', 'findPair', 'findTargetUI', 'cursorSort', 'sumTarget', 'mathDiff']],
    ['Parcours multi-étapes', ['pairs', 'avoidMin', 'sequenceHunt', 'reflex']],
    ['Moteurs dédiés', ['typingTest', 'connectDots', 'mathQuizAdd', 'mathQuizSub', 'mathQuizMul', 'mathQuizDiv', 'speedLetters', 'dragDropMath', 'conveyorBelt', 'speedQuiz', 'guessNumber', 'dobble']],
];

// ── Corps du catalogue ──
let sections = '';
let count = 0;
for (const [title, keys] of GROUPS) {
    let cards = '';
    for (const k of keys) {
        const m = MODES[k];
        if (!m) continue;
        const imgPath = path.join('shots', 'modes', k + '.jpg');
        const img = fs.existsSync(imgPath)
            ? `<img src="data:image/jpeg;base64,${fs.readFileSync(imgPath).toString('base64')}" alt="${m.name}" loading="lazy">`
            : '';
        cards += `<div class="card">${img}<div class="cb"><h3>${m.name}</h3><p>${m.desc || ''}</p></div></div>`;
        count++;
    }
    sections += `<h2>${title}</h2><div class="grid">${cards}</div>`;
}

const showcase = `
<style>
:root{--bleu:#4A6CFA;--encre:#23262F;--gris:#8B90A0;--fond:#F4F6FA;--ligne:#E8EAF1}
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Segoe UI',Roboto,sans-serif;background:var(--fond);color:var(--encre);padding:30px 18px 60px;max-width:1100px;margin:0 auto}
h1{font-size:1.9rem;font-weight:900;text-align:center}
h1 b{color:var(--bleu)}
.sub{text-align:center;color:var(--gris);margin:4px 0 8px;font-size:.95rem}
h2{font-size:1.1rem;font-weight:900;margin:34px 0 14px;padding-bottom:6px;border-bottom:2px solid var(--ligne)}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:16px}
.card{background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(35,38,47,.08),0 8px 24px rgba(35,38,47,.06)}
.card img{width:100%;display:block;border-bottom:1px solid var(--ligne)}
.cb{padding:12px 14px 14px}
.cb h3{font-size:1rem;font-weight:900;margin-bottom:4px}
.cb p{font-size:.84rem;color:var(--gris);line-height:1.45}
.foot{text-align:center;color:#B9BDC9;font-size:.8rem;margin-top:40px}
</style>
<h1>Order<b>ix</b> — Catalogue des modes</h1>
<p class="sub">${count} modes · accès privé · généré le ${new Date().toLocaleDateString('fr-FR')}</p>
${sections}
<p class="foot">Orderix — 365 jours d'agilité mentale.</p>
`;

// ── Chiffrement AES-GCM ──
(async () => {
    const subtle = webcrypto.subtle;
    const enc = new TextEncoder();
    const salt = webcrypto.getRandomValues(new Uint8Array(16));
    const iv = webcrypto.getRandomValues(new Uint8Array(12));
    const keyMaterial = await subtle.importKey('raw', enc.encode(PASSWORD), 'PBKDF2', false, ['deriveKey']);
    const key = await subtle.deriveKey(
        { name: 'PBKDF2', salt, iterations: 200000, hash: 'SHA-256' },
        keyMaterial, { name: 'AES-GCM', length: 256 }, false, ['encrypt']);
    const cipher = new Uint8Array(await subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(showcase)));

    const payload = Buffer.concat([salt, iv, cipher]).toString('base64');

    const loader = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Orderix — Accès privé</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Segoe UI',Roboto,sans-serif;background:#F4F6FA;color:#23262F;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:20px}
.lock{background:#fff;border-radius:20px;box-shadow:0 1px 3px rgba(35,38,47,.08),0 12px 32px rgba(35,38,47,.1);padding:36px 30px;max-width:380px;width:100%;text-align:center}
h1{font-size:2rem;font-weight:900}
h1 b{color:#4A6CFA}
p{color:#8B90A0;font-size:.9rem;margin:6px 0 22px}
input{width:100%;padding:14px 16px;border:1.5px solid #E8EAF1;border-radius:12px;font-size:1rem;background:#F4F6FA;outline:none;text-align:center}
input:focus{border-color:#4A6CFA}
button{width:100%;margin-top:12px;padding:14px;border:none;border-radius:12px;background:#4A6CFA;color:#fff;font-weight:700;font-size:1rem;cursor:pointer;box-shadow:0 4px 12px rgba(74,108,250,.35)}
button:disabled{opacity:.6}
.err{color:#E0533D;font-size:.85rem;font-weight:700;margin-top:10px;min-height:1.2em}
</style>
</head>
<body>
<div class="lock">
<h1>Order<b>ix</b></h1>
<p>Catalogue des modes — entrez le mot de passe</p>
<input type="password" id="pw" placeholder="Mot de passe" autofocus>
<button id="go">Déverrouiller</button>
<div class="err" id="err"></div>
</div>
<script>
const PAYLOAD = "${payload}";
async function unlock() {
    const pw = document.getElementById('pw').value;
    const btn = document.getElementById('go'), err = document.getElementById('err');
    btn.disabled = true; err.textContent = '';
    try {
        const raw = Uint8Array.from(atob(PAYLOAD), c => c.charCodeAt(0));
        const salt = raw.slice(0, 16), iv = raw.slice(16, 28), data = raw.slice(28);
        const km = await crypto.subtle.importKey('raw', new TextEncoder().encode(pw), 'PBKDF2', false, ['deriveKey']);
        const key = await crypto.subtle.deriveKey({ name: 'PBKDF2', salt, iterations: 200000, hash: 'SHA-256' }, km, { name: 'AES-GCM', length: 256 }, false, ['decrypt']);
        const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, data);
        document.open();
        document.write('<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Orderix — Catalogue des modes</title></head><body>' + new TextDecoder().decode(plain) + '</body></html>');
        document.close();
    } catch (e) {
        err.textContent = 'Mot de passe incorrect.';
        btn.disabled = false;
    }
}
document.getElementById('go').addEventListener('click', unlock);
document.getElementById('pw').addEventListener('keydown', e => { if (e.key === 'Enter') unlock(); });
</${'script'}>
</body>
</html>`;

    fs.mkdirSync('pages', { recursive: true });
    fs.writeFileSync(path.join('pages', 'index.html'), loader, 'utf8');
    console.log('pages/index.html : ' + (loader.length / 1024 / 1024).toFixed(1) + ' MB, ' + count + ' modes');
})();
