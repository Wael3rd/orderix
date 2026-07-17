// Aperçu des puzzles quotidiens (réplique la construction de DAYS de state.js).
// Usage : node preview-week.js [premierJour] [dernierJour]
const fs = require('fs');
const { JSDOM } = require('jsdom');
const dom = new JSDOM('<body></body>', { url: 'https://x/', runScripts: 'outside-only' });
const w = dom.window;
w.eval(fs.readFileSync('www/scripts/data.js', 'utf8') + `
const JANUARY_LINEUP = [
    'orderChain', 'cascade', 'insertion', 'fontaine', 'metronome',
    'laSuite', 'patience', 'duel', 'rummy', 'dominoOrder',
    'escalier', 'tubes', 'swapSort', 'boulons', 'fileBloquee',
    'etageres', 'hanoi', 'rangement', 'futoshiki', 'balance',
    'ordreCache', 'indices', 'chronologie', 'conveyorBelt', 'aiguillage',
    'ascenseur', 'guichet', 'photoClasse', 'memoryChain', 'fusion'
];
const LEGACY_MODES = Object.keys(GAME_MODES)
    .filter(k => !JANUARY_LINEUP.includes(k) || ['orderChain', 'cascade', 'insertion', 'conveyorBelt'].includes(k));
let out = [], legacyIdx = 0;
for (let id = 1; id <= 365; id++) {
    let mKey;
    if (id <= 30) mKey = JANUARY_LINEUP[id - 1];
    else mKey = LEGACY_MODES[legacyIdx++ % LEGACY_MODES.length];
    const mode = GAME_MODES[mKey];
    const base = BASE_TYPES[(id * 13) % BASE_TYPES.length];
    out.push({ id, title: buildDayTitle({ modeId: mKey, type: mode.forceType || base.type }) });
}
const start = new Date(Date.UTC(2026, 0, 1));
const from = ${parseInt(process.argv[2] || '1', 10)}, to = ${parseInt(process.argv[3] || '31', 10)};
console.log(out.slice(from - 1, to).map(d => {
    const dt = new Date(start.getTime() + (d.id - 1) * 86400000);
    return 'Jour ' + String(d.id).padStart(3) + ' (' + dt.getUTCDate() + '/' + (dt.getUTCMonth() + 1) + ') : ' + d.title;
}).join('\\n'));
`);
