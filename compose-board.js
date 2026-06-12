// Planche comparative : toutes les versions côte à côte, étiquetées.
const sharp = require('sharp');

const CELLS = [
    { file: 'shots/old-01-home.png', label: '0 · HTML original (avant refonte)' },
    { file: 'shots/01-home.png', label: '1 · Version actuelle — Papeterie éditoriale' },
    { file: 'mockups/1-jardin-aquarelle.png', label: '2 · Jardin d’aquarelle' },
    { file: 'mockups/2-heure-bleue.png', label: '3 · Heure bleue' },
    { file: 'mockups/3-sorbet-pop.png', label: '4 · Sorbet pop' },
    { file: 'mockups/4-encre-papier.png', label: '5 · Encre & papier' },
    { file: 'mockups/5-style-easybrain.png', label: '6 · Style Easybrain (Sudoku.com)' },
    { file: 'mockups/6-style-tripledot.png', label: '7 · Style Tripledot (Woodoku)' },
    { file: 'mockups/7-style-sng.png', label: '8 · Style SNG (101 Okey Plus)' },
];

const COLS = 3, PAD = 28, CW = 400, IH = Math.round(1688 * (CW / 780)); // 866
const LABEL_H = 54, TITLE_H = 90;
const CELL_H = LABEL_H + IH;
const ROWS = Math.ceil(CELLS.length / COLS);
const W = COLS * CW + (COLS + 1) * PAD;
const H = TITLE_H + ROWS * CELL_H + (ROWS + 1) * PAD;

const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');

(async () => {
    let svgLabels = '';
    CELLS.forEach((c, i) => {
        const col = i % COLS, row = Math.floor(i / COLS);
        const x = PAD + col * (CW + PAD) + CW / 2;
        const y = TITLE_H + PAD + row * (CELL_H + PAD) + 36;
        svgLabels += `<text x="${x}" y="${y}" text-anchor="middle" font-family="Georgia, serif" font-size="19" font-weight="bold" fill="#352A33">${esc(c.label)}</text>`;
    });
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
      <rect width="${W}" height="${H}" fill="#F2EDE3"/>
      <text x="${W / 2}" y="58" text-anchor="middle" font-family="Georgia, serif" font-size="34" font-weight="bold" fill="#43293F">Orderix — toutes les pistes graphiques</text>
      ${svgLabels}
    </svg>`;

    const composites = [{ input: Buffer.from(svg), top: 0, left: 0 }];
    for (let i = 0; i < CELLS.length; i++) {
        const col = i % COLS, row = Math.floor(i / COLS);
        const x = PAD + col * (CW + PAD);
        const y = TITLE_H + PAD + row * (CELL_H + PAD) + LABEL_H;
        const img = await sharp(CELLS[i].file).resize(CW, IH, { fit: 'cover', position: 'top' }).png().toBuffer();
        composites.push({ input: img, top: y, left: x });
    }

    await sharp({ create: { width: W, height: H, channels: 4, background: '#F2EDE3' } })
        .composite(composites)
        .png()
        .toFile('shots/planche-comparative.png');
    console.log(`ok ${W}x${H}`);
})();
