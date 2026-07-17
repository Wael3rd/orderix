// Aperçu des puzzles quotidiens à venir (réplique la construction de DAYS).
const fs = require('fs');
const { JSDOM } = require('jsdom');
const dom = new JSDOM('<body></body>', { url: 'https://x/', runScripts: 'outside-only' });
const w = dom.window;
w.eval(fs.readFileSync('www/scripts/data.js', 'utf8') + `
const FLAGSHIP_MODES = ['orderChain', 'insertion', 'cascade'];
const QUALITY_MODES = ['sortAsc', 'pairs', 'connectDots', 'guessNumber', 'flashSort',
    'dobble', 'speedQuiz', 'conveyorBelt', 'blindSort', 'speedLetters', 'sortDesc',
    'findMax', 'findMin'];
const REST_MODES = Object.keys(GAME_MODES)
    .filter(k => !FLAGSHIP_MODES.includes(k) && !QUALITY_MODES.includes(k));
let out = [], qIdx = 0, rIdx = 0;
for (let id = 1; id <= 365; id++) {
    let mKey;
    if (id % 3 === 1) mKey = FLAGSHIP_MODES[Math.floor(id / 3) % 3];
    else if (id % 3 === 2) mKey = QUALITY_MODES[qIdx++ % QUALITY_MODES.length];
    else mKey = REST_MODES[rIdx++ % REST_MODES.length];
    const mode = GAME_MODES[mKey];
    const base = BASE_TYPES[(id * 13) % BASE_TYPES.length];
    out.push({ id, title: buildDayTitle({ modeId: mKey, type: mode.forceType || base.type }) });
}
const start = new Date(Date.UTC(2026, 0, 1));
const from = ${process.argv[2] || 198}, to = ${process.argv[3] || 206};
console.log(out.slice(from - 1, to).map(d => {
    const dt = new Date(start.getTime() + (d.id - 1) * 86400000);
    return 'Jour ' + d.id + ' (' + dt.getUTCDate() + '/' + (dt.getUTCMonth() + 1) + ') : ' + d.title;
}).join('\\n'));
`);
