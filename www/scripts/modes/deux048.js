// ─── Mode : 2048 (jour 25) ───────────────────────────────────────
// Le classique absolu du casual (top charts depuis 2014, famille
// Block Blast/merge n°1 des téléchargements). Glissez pour fusionner
// les tuiles égales ; objectif du jour : créer la tuile 128.
// Contrôles : glissement sur la grille OU flèches à l'écran.

const _D48_COLORS = {
    2: ['#EEF2FF', '#3553D1'], 4: ['#D9E0FB', '#3553D1'], 8: ['#B9C8FB', '#23262F'],
    16: ['#8FA4FB', '#fff'], 32: ['#6C86FA', '#fff'], 64: ['#4A6CFA', '#fff'],
    128: ['#F5B227', '#fff'], 256: ['#E89A0C', '#fff']
};

function _d48Tile(v, size) {
    const el = document.createElement('div');
    const [bg, fg] = _D48_COLORS[v] || ['#23262F', '#fff'];
    el.style.cssText = `width:${size}px;height:${size}px;border-radius:10px;background:${bg};color:${fg};` +
        'display:flex;align-items:center;justify-content:center;font-weight:900;' +
        `font-size:${v >= 128 ? Math.round(size * 0.34) : Math.round(size * 0.4)}px;`;
    el.textContent = v;
    return el;
}

function showExampleDeux048(day, row, vals) {
    const ex = document.createElement('div');
    ex.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:10px;margin:6px auto;';

    const line = document.createElement('div');
    line.style.cssText = 'display:flex;align-items:center;gap:8px;';
    line.append(_d48Tile(4, 42), _d48Tile(4, 42));
    const arrow = document.createElement('span');
    arrow.style.cssText = 'font-weight:900;color:#8B90A0;font-size:1.2rem;';
    arrow.textContent = '→';
    line.append(arrow, _d48Tile(8, 42));

    const goal = document.createElement('div');
    goal.style.cssText = 'display:flex;align-items:center;gap:8px;font-weight:bold;color:#8B90A0;font-size:.85rem;';
    goal.append(document.createTextNode('Objectif du jour :'), _d48Tile(128, 44));

    ex.append(line, goal);
    row.style.flexDirection = 'column';
    row.append(ex);
}

function startGameDeux048() {
    board.style.display = 'flex';
    board.style.flexDirection = 'column';
    board.style.alignItems = 'center';
    board.style.gap = '14px';
    board.style.touchAction = 'none';

    const S = 4, GOAL = 128, CELL = 66, GAP = 8;
    let grid = Array.from({ length: S }, () => new Array(S).fill(0));
    let over = false;

    const hud = document.createElement('div');
    hud.style.cssText = 'display:flex;gap:18px;font-weight:bold;color:#8B90A0;font-size:.95rem;';
    board.appendChild(hud);

    const wrap = document.createElement('div');
    wrap.style.cssText = `position:relative;width:${S * CELL + (S + 1) * GAP}px;height:${S * CELL + (S + 1) * GAP}px;` +
        'background:#D8DCE8;border-radius:14px;';
    board.appendChild(wrap);

    // Flèches à l'écran (accessibilité + précision)
    const pad = document.createElement('div');
    pad.style.cssText = 'display:grid;grid-template-columns:repeat(3,54px);gap:6px;justify-content:center;';
    const mkArrow = (txt, dir, col, rowPos) => {
        const b = document.createElement('button');
        b.style.cssText = `grid-column:${col};grid-row:${rowPos};height:46px;border-radius:12px;background:#EEF2FF;` +
            'border:2px solid #D9E0FB;color:#3553D1;font-weight:900;font-size:1.15rem;touch-action:manipulation;';
        b.textContent = txt;
        b.addEventListener('pointerdown', (e) => { e.preventDefault(); doMove(dir); });
        pad.appendChild(b);
    };
    mkArrow('↑', 'up', 2, 1); mkArrow('←', 'left', 1, 2); mkArrow('↓', 'down', 2, 2); mkArrow('→', 'right', 3, 2);
    board.appendChild(pad);

    function spawn() {
        const empties = [];
        for (let r = 0; r < S; r++) for (let c = 0; c < S; c++) if (!grid[r][c]) empties.push([r, c]);
        if (!empties.length) return;
        const [r, c] = empties[Math.floor(Math.random() * empties.length)];
        grid[r][c] = Math.random() < 0.9 ? 2 : 4;
    }

    // Fait glisser+fusionner une ligne vers la gauche ; renvoie [ligne, bougé, max]
    function slide(line) {
        const vals = line.filter(v => v);
        const out = [];
        let moved = vals.length !== line.filter((v, i) => v && line.indexOf(v) === i).length; // recalculé plus bas
        moved = false;
        let maxMerged = 0;
        for (let i = 0; i < vals.length; i++) {
            if (i + 1 < vals.length && vals[i] === vals[i + 1]) {
                out.push(vals[i] * 2);
                maxMerged = Math.max(maxMerged, vals[i] * 2);
                i++;
            } else out.push(vals[i]);
        }
        while (out.length < S) out.push(0);
        for (let i = 0; i < S; i++) if (out[i] !== line[i]) moved = true;
        return [out, moved, maxMerged];
    }

    function doMove(dir) {
        if (isPaused || over) return;
        let moved = false, best = 0;
        const get = (i, j) =>
            dir === 'left' ? grid[i][j] : dir === 'right' ? grid[i][S - 1 - j] :
            dir === 'up' ? grid[j][i] : grid[S - 1 - j][i];
        const set = (i, j, v) => {
            if (dir === 'left') grid[i][j] = v;
            else if (dir === 'right') grid[i][S - 1 - j] = v;
            else if (dir === 'up') grid[j][i] = v;
            else grid[S - 1 - j][i] = v;
        };
        for (let i = 0; i < S; i++) {
            const line = Array.from({ length: S }, (_, j) => get(i, j));
            const [out, m, mx] = slide(line);
            if (m) moved = true;
            best = Math.max(best, mx);
            for (let j = 0; j < S; j++) set(i, j, out[j]);
        }
        if (!moved) return;
        haptic(8);
        spawn();
        render();
        if (best >= GOAL) {
            over = true;
            endGame(`Tuile ${GOAL} créée — fusion magistrale !`, true);
            return;
        }
        if (!anyMovePossible()) {
            over = true;
            endGame('Grille pleine, plus aucune fusion possible.', false);
        }
    }

    function anyMovePossible() {
        for (let r = 0; r < S; r++) for (let c = 0; c < S; c++) {
            if (!grid[r][c]) return true;
            if (c + 1 < S && grid[r][c] === grid[r][c + 1]) return true;
            if (r + 1 < S && grid[r][c] === grid[r + 1][c]) return true;
        }
        return false;
    }

    function render() {
        let maxTile = 0;
        wrap.innerHTML = '';
        for (let r = 0; r < S; r++) for (let c = 0; c < S; c++) {
            const cell = document.createElement('div');
            cell.style.cssText = `position:absolute;left:${GAP + c * (CELL + GAP)}px;top:${GAP + r * (CELL + GAP)}px;` +
                `width:${CELL}px;height:${CELL}px;border-radius:10px;background:#E8EAF1;`;
            wrap.appendChild(cell);
            if (grid[r][c]) {
                maxTile = Math.max(maxTile, grid[r][c]);
                const t = _d48Tile(grid[r][c], CELL);
                t.style.position = 'absolute';
                t.style.left = (GAP + c * (CELL + GAP)) + 'px';
                t.style.top = (GAP + r * (CELL + GAP)) + 'px';
                wrap.appendChild(t);
            }
        }
        hud.innerHTML = `<span>Meilleure tuile : <b style="color:#4A6CFA">${maxTile || 0}</b></span>` +
            `<span>Objectif : <b style="color:#F5B227">${GOAL}</b></span>`;
    }

    // Glissement tactile sur la grille
    let swipeStart = null;
    wrap.addEventListener('pointerdown', (e) => { e.preventDefault(); swipeStart = [e.clientX, e.clientY]; });
    wrap.addEventListener('pointerup', (e) => {
        if (!swipeStart) return;
        const dx = e.clientX - swipeStart[0], dy = e.clientY - swipeStart[1];
        swipeStart = null;
        if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return;
        doMove(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up'));
    });

    spawn(); spawn();
    render();
}
