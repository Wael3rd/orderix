// ─── Mode : Blocs (jour 9) ───────────────────────────────────────
// Inspiré de Block Blast, jeu le plus téléchargé au monde (366 M en
// 2025). Posez les pièces proposées sur la grille 8×8 : chaque ligne
// ou colonne complète s'efface. Objectif du jour : effacer 6 lignes.
// Défaite si plus aucune pièce proposée ne rentre.

const _BLOCS_SHAPES = [
    [[0, 0], [0, 1]],                          // domino
    [[0, 0], [0, 1], [0, 2]],                  // ligne 3
    [[0, 0], [1, 0], [2, 0]],                  // colonne 3
    [[0, 0], [0, 1], [0, 2], [0, 3]],          // ligne 4
    [[0, 0], [1, 0], [2, 0], [3, 0]],          // colonne 4
    [[0, 0], [0, 1], [1, 0], [1, 1]],          // carré 2×2
    [[0, 0], [1, 0], [1, 1]],                  // petit L
    [[0, 0], [0, 1], [1, 1]],                  // petit J
    [[0, 0], [0, 1], [0, 2], [1, 1]],          // T
    [[0, 0], [1, 0], [2, 0], [2, 1]],          // L
    [[0, 1], [1, 1], [2, 1], [2, 0]],          // J
    [[0, 0], [0, 1], [1, 0], [1, 1], [0, 2], [1, 2]] // rectangle 2×3
];

function _blocsMini(shape, cell, color) {
    const maxR = Math.max(...shape.map(s => s[0])), maxC = Math.max(...shape.map(s => s[1]));
    const g = document.createElement('div');
    g.style.cssText = `position:relative;width:${(maxC + 1) * cell}px;height:${(maxR + 1) * cell}px;`;
    shape.forEach(([r, c]) => {
        const b = document.createElement('div');
        b.style.cssText = `position:absolute;left:${c * cell}px;top:${r * cell}px;width:${cell - 2}px;height:${cell - 2}px;` +
            `border-radius:4px;background:${color || '#4A6CFA'};box-shadow:inset 0 -2px 0 rgba(0,0,0,.18);`;
        g.appendChild(b);
    });
    return g;
}

function showExampleBlocs(day, row, vals) {
    const ex = document.createElement('div');
    ex.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:10px;margin:6px auto;';

    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;gap:14px;align-items:center;';
    const mini = document.createElement('div');
    mini.style.cssText = 'display:grid;grid-template-columns:repeat(4,20px);gap:2px;';
    const filled = [0, 1, 2, 4, 5, 6, 8, 9, 10];
    for (let i = 0; i < 16; i++) {
        const c = document.createElement('div');
        c.style.cssText = 'width:20px;height:20px;border-radius:4px;background:' +
            (filled.includes(i) ? '#4A6CFA' : '#E8EAF1') + ';';
        mini.appendChild(c);
    }
    const plus = document.createElement('span');
    plus.style.cssText = 'font-weight:900;color:#8B90A0;font-size:1.1rem;';
    plus.textContent = '+';
    wrap.append(mini, plus, _blocsMini([[0, 0], [1, 0], [2, 0]], 20, '#F5B227'));

    const note = document.createElement('div');
    note.style.cssText = 'font-weight:bold;color:#8B90A0;font-size:.8rem;text-align:center;max-width:260px;';
    note.textContent = 'La pièce jaune complète la colonne → la ligne s’efface !';

    ex.append(wrap, note);
    row.style.flexDirection = 'column';
    row.append(ex);
}

function startGameBlocs() {
    board.style.display = 'flex';
    board.style.flexDirection = 'column';
    board.style.alignItems = 'center';
    board.style.gap = '12px';

    const S = 8, CELL = 36, GOAL = 6;
    const COLORS = ['#4A6CFA', '#34B871', '#F5B227', '#8B5CF6', '#E0533D'];
    let grid = Array.from({ length: S }, () => new Array(S).fill(null)); // null | couleur
    let lines = 0;
    let selected = -1;
    let over = false;
    let tray = [];

    function newTray() {
        tray = [0, 1, 2].map(() => ({
            shape: _BLOCS_SHAPES[Math.floor(Math.random() * _BLOCS_SHAPES.length)],
            color: COLORS[Math.floor(Math.random() * COLORS.length)],
            used: false
        }));
    }
    newTray();

    const hud = document.createElement('div');
    hud.style.cssText = 'display:flex;gap:18px;font-weight:bold;color:#8B90A0;font-size:.95rem;';
    board.appendChild(hud);

    const gridEl = document.createElement('div');
    gridEl.style.cssText = `position:relative;display:grid;grid-template-columns:repeat(${S},${CELL}px);gap:3px;` +
        'background:#D8DCE8;padding:6px;border-radius:12px;';
    board.appendChild(gridEl);

    const trayEl = document.createElement('div');
    trayEl.style.cssText = 'display:flex;gap:22px;align-items:center;justify-content:center;min-height:90px;';
    board.appendChild(trayEl);

    const hint = document.createElement('div');
    hint.style.cssText = 'font-weight:bold;color:#9AA0AE;font-size:.78rem;';
    hint.textContent = 'Touchez une pièce, puis une case verte : elle se pose dessus.';
    board.appendChild(hint);

    function canPlace(shape, r0, c0) {
        return shape.every(([r, c]) => {
            const rr = r0 + r, cc = c0 + c;
            return rr >= 0 && rr < S && cc >= 0 && cc < S && !grid[rr][cc];
        });
    }
    function anyPlacement(shape) {
        for (let r = 0; r < S; r++) for (let c = 0; c < S; c++) if (canPlace(shape, r, c)) return true;
        return false;
    }
    // Retour #53 (« bugs de détection ») : on ne pose plus par le coin
    // haut-gauche — la pièce se pose de façon à COUVRIR la case touchée.
    // Renvoie l'ancrage [r0, c0] d'un placement valide couvrant (r, c).
    function placementCovering(shape, r, c) {
        for (const [dr, dc] of shape) {
            const r0 = r - dr, c0 = c - dc;
            if (canPlace(shape, r0, c0)) return [r0, c0];
        }
        return null;
    }

    function render() {
        hud.innerHTML = `<span>Lignes effacées : <b style="color:#34B871">${lines}</b> / <b style="color:#F5B227">${GOAL}</b></span>`;

        gridEl.innerHTML = '';
        for (let r = 0; r < S; r++) for (let c = 0; c < S; c++) {
            const rr = r, cc = c;
            const cell = document.createElement('div');
            const valid = selected !== -1 && !tray[selected].used && !grid[r][c] &&
                placementCovering(tray[selected].shape, r, c) !== null;
            cell.style.cssText = `width:${CELL}px;height:${CELL}px;border-radius:6px;touch-action:manipulation;` +
                `background:${grid[r][c] ? grid[r][c] : (valid ? '#C9E7D4' : '#F4F6FA')};` +
                (grid[r][c] ? 'box-shadow:inset 0 -2px 0 rgba(0,0,0,.18);' : '');
            cell.addEventListener('pointerdown', (e) => {
                e.preventDefault();
                if (isPaused || over || selected === -1) return;
                place(rr, cc);
            });
            gridEl.appendChild(cell);
        }

        trayEl.innerHTML = '';
        tray.forEach((p, i) => {
            const slot = document.createElement('button');
            const placeable = !p.used && anyPlacement(p.shape);
            slot.style.cssText = 'padding:8px;border-radius:12px;background:#fff;border:2px solid ' +
                (selected === i ? '#F5B227' : 'var(--ligne,#E8EAF1)') + ';touch-action:manipulation;' +
                (p.used ? 'opacity:.15;pointer-events:none;' : (placeable ? '' : 'opacity:.35;')) +
                (selected === i ? 'box-shadow:0 0 0 3px #FFF6E3;' : '');
            slot.appendChild(_blocsMini(p.shape, 14, p.color));
            slot.addEventListener('pointerdown', (e) => {
                e.preventDefault();
                if (isPaused || over || p.used) return;
                selected = selected === i ? -1 : i;
                haptic(8);
                render();
            });
            trayEl.appendChild(slot);
        });
    }

    function place(rt, ct) {
        const p = tray[selected];
        const anchor = placementCovering(p.shape, rt, ct);
        if (!anchor) {
            haptic(30);
            gridEl.style.animation = 'wobble .25s';
            setTimeout(() => { gridEl.style.animation = ''; }, 300);
            return;
        }
        const [r0, c0] = anchor;
        p.shape.forEach(([r, c]) => { grid[r0 + r][c0 + c] = p.color; });
        p.used = true;
        selected = -1;
        haptic(10);

        // Efface lignes et colonnes complètes
        const fullRows = [], fullCols = [];
        for (let r = 0; r < S; r++) if (grid[r].every(x => x)) fullRows.push(r);
        for (let c = 0; c < S; c++) if (grid.every(row => row[c])) fullCols.push(c);
        fullRows.forEach(r => { for (let c = 0; c < S; c++) grid[r][c] = null; });
        fullCols.forEach(c => { for (let r = 0; r < S; r++) grid[r][c] = null; });
        const cleared = fullRows.length + fullCols.length;
        if (cleared) {
            lines += cleared;
            haptic([12, 40, 14]);
            resultDisplay.textContent = cleared > 1 ? `${cleared} lignes d'un coup, superbe !` : 'Ligne effacée !';
            resultDisplay.style.color = '#34B871';
            setTimeout(() => { if (!isPaused) resultDisplay.textContent = ''; }, 1000);
        }

        if (tray.every(x => x.used)) newTray();
        render();

        if (lines >= GOAL) {
            over = true;
            endGame(`${lines} lignes effacées — objectif atteint !`, true);
            return;
        }
        if (!tray.some(x => !x.used && anyPlacement(x.shape))) {
            over = true;
            endGame('Plus aucune pièce ne rentre — la grille est saturée.', false);
        }
    }

    render();
}
