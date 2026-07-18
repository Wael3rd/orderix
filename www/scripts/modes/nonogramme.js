// ─── Mode : Le Nonogramme (jour 31) ──────────────────────────────
// Picross 7×7 inspiré de Nonogram.com (Easybrain). Un motif secret
// est généré ; seuls les indices classiques (longueurs des blocs
// consécutifs remplis, par ligne et par colonne) sont affichés.
// Deux outils : ■ Remplir et ✕ Marquer vide. Les indices passent au
// vert quand leur ligne/colonne est satisfaite. Victoire dès que les
// 7 lignes ET les 7 colonnes correspondent — toute solution valide
// compte, même différente du motif d'origine. Pas de défaite : le
// chrono départage.

const _NONO_N = 7;

// Longueurs des blocs consécutifs remplis d'une ligne/colonne ([0] si vide)
function _nonoClues(cells) {
    const clues = [];
    let run = 0;
    for (let i = 0; i < cells.length; i++) {
        if (cells[i]) { run++; }
        else if (run) { clues.push(run); run = 0; }
    }
    if (run) clues.push(run);
    return clues.length ? clues : [0];
}

function _nonoSameClues(a, b) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
    return true;
}

// Motif secret : ~62% de cases remplies, aucune ligne/colonne vide et
// JAMAIS plus de 2 blocs par ligne/colonne (retour #105 : le 7×7 était
// trop dur — moins de blocs = indices plus longs, déduction plus douce)
function _nonoBlocsOk(cells) {
    return _nonoClues(cells).length <= 2;
}

function _nonoSecret() {
    for (let attempt = 0; attempt < 2000; attempt++) {
        const g = [];
        for (let r = 0; r < _NONO_N; r++) {
            g.push([]);
            for (let c = 0; c < _NONO_N; c++) g[r].push(Math.random() < 0.62 ? 1 : 0);
        }
        let ok = true;
        for (let i = 0; i < _NONO_N; i++) {
            const col = g.map(row => row[i]);
            if (!g[i].some(v => v) || !col.some(v => v)) { ok = false; break; }
            if (!_nonoBlocsOk(g[i]) || !_nonoBlocsOk(col)) { ok = false; break; }
        }
        if (ok) return g;
    }
    // Filet de sécurité (jamais atteint en pratique) : diagonale remplie
    const g = [];
    for (let r = 0; r < _NONO_N; r++) {
        g.push([]);
        for (let c = 0; c < _NONO_N; c++) g[r].push(r === c ? 1 : 0);
    }
    return g;
}

function showExampleNonogramme(day, row, vals) {
    const ex = document.createElement('div');
    ex.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:10px;margin:6px auto;';

    // Mini-grille 3×3 statique : motif « L » (col 1 pleine + bas rempli)
    const mini = [
        [1, 0, 0],
        [1, 0, 0],
        [1, 1, 1]
    ];
    const rowClues = mini.map(r => _nonoClues(r));
    const colClues = [0, 1, 2].map(c => _nonoClues(mini.map(r => r[c])));

    const cell = 24;
    const table = document.createElement('div');
    table.style.cssText = `display:grid;grid-template-columns:auto repeat(3,${cell}px);` +
        `grid-template-rows:auto repeat(3,${cell}px);gap:3px;align-items:end;`;

    table.appendChild(document.createElement('div')); // coin vide
    colClues.forEach(clues => {
        const el = document.createElement('div');
        el.style.cssText = 'display:flex;flex-direction:column;align-items:center;justify-content:flex-end;' +
            'font-weight:900;font-size:.62rem;color:#8B90A0;line-height:1.1;';
        clues.forEach(n => {
            const d = document.createElement('div');
            d.textContent = n;
            el.appendChild(d);
        });
        table.appendChild(el);
    });
    mini.forEach((r, ri) => {
        const rc = document.createElement('div');
        rc.style.cssText = 'display:flex;align-items:center;justify-content:flex-end;gap:3px;' +
            'font-weight:900;font-size:.62rem;color:#8B90A0;padding-right:4px;align-self:center;';
        rc.textContent = rowClues[ri].join(' ');
        table.appendChild(rc);
        r.forEach(v => {
            const c = document.createElement('div');
            c.style.cssText = `width:${cell}px;height:${cell}px;border-radius:5px;` +
                (v ? 'background:#4A6CFA;' : 'background:#E8EAF1;');
            table.appendChild(c);
        });
    });

    const note = document.createElement('div');
    note.style.cssText = 'font-weight:bold;color:#8B90A0;font-size:.8rem;text-align:center;max-width:270px;';
    note.textContent = 'Les chiffres donnent les longueurs des blocs de cases remplies, dans l\'ordre. ' +
        '« 3 » = trois cases d\'affilée, « 1 1 » = deux blocs séparés d\'au moins une case vide, « 0 » = ligne vide.';

    ex.append(table, note);
    row.style.flexDirection = 'column';
    row.append(ex);
}

function startGameNonogramme() {
    board.style.display = 'flex';
    board.style.flexDirection = 'column';
    board.style.alignItems = 'center';
    board.style.gap = '12px';

    const secret = _nonoSecret();
    const rowClues = secret.map(r => _nonoClues(r));
    const colClues = [];
    for (let c = 0; c < _NONO_N; c++) colClues.push(_nonoClues(secret.map(r => r[c])));

    // État du joueur : 0 = vide · 1 = rempli · 2 = marqué vide (✕)
    const grid = [];
    for (let r = 0; r < _NONO_N; r++) grid.push(new Array(_NONO_N).fill(0));
    let tool = 1; // outil actif : 1 = remplir, 2 = marquer vide
    let over = false;

    // ── HUD ──────────────────────────────────────────────────────
    const hud = document.createElement('div');
    hud.style.cssText = 'font-weight:bold;color:#8B90A0;font-size:.95rem;';
    board.appendChild(hud);

    // ── Table : coin vide + indices de colonnes + indices de lignes + cellules ─
    const CELL = 38;
    const table = document.createElement('div');
    table.style.cssText = `display:grid;grid-template-columns:auto repeat(${_NONO_N},${CELL}px);` +
        `grid-template-rows:auto repeat(${_NONO_N},${CELL}px);gap:3px;align-items:stretch;`;
    board.appendChild(table);

    table.appendChild(document.createElement('div')); // coin haut-gauche vide

    const colClueEls = [];
    colClues.forEach(clues => {
        const el = document.createElement('div');
        el.style.cssText = 'display:flex;flex-direction:column;align-items:center;justify-content:flex-end;' +
            'font-weight:900;font-size:.72rem;color:#8B90A0;line-height:1.25;padding-bottom:3px;user-select:none;';
        clues.forEach(n => {
            const d = document.createElement('div');
            d.textContent = n;
            el.appendChild(d);
        });
        colClueEls.push(el);
        table.appendChild(el);
    });

    const rowClueEls = [];
    const cellEls = [];
    for (let r = 0; r < _NONO_N; r++) {
        const rc = document.createElement('div');
        rc.style.cssText = 'display:flex;align-items:center;justify-content:flex-end;' +
            'font-weight:900;font-size:.72rem;color:#8B90A0;padding-right:7px;user-select:none;letter-spacing:2px;';
        rc.textContent = rowClues[r].join(' ');
        rowClueEls.push(rc);
        table.appendChild(rc);

        cellEls.push([]);
        for (let c = 0; c < _NONO_N; c++) {
            const cell = document.createElement('div');
            cell.style.cssText = `width:${CELL}px;height:${CELL}px;border-radius:7px;background:#E8EAF1;` +
                'display:flex;align-items:center;justify-content:center;user-select:none;' +
                'touch-action:manipulation;transition:background .08s;cursor:pointer;';
            const rr = r, cc = c;
            cell.addEventListener('pointerdown', (e) => {
                e.preventDefault();
                if (isPaused || over) return;
                tap(rr, cc);
            });
            cellEls[r].push(cell);
            table.appendChild(cell);
        }
    }

    // ── Outils : ■ Remplir · ✕ Marquer vide ──────────────────────
    const tools = document.createElement('div');
    tools.style.cssText = 'display:flex;gap:10px;justify-content:center;';
    board.appendChild(tools);

    function makeToolBtn(label, value) {
        const b = document.createElement('button');
        b.textContent = label;
        b.style.cssText = 'padding:10px 18px;border-radius:10px;font-weight:900;font-size:.9rem;' +
            'border:2px solid #C2C7D6;background:#fff;color:#8B90A0;touch-action:manipulation;user-select:none;';
        b.addEventListener('pointerdown', (e) => {
            e.preventDefault();
            if (isPaused || over) return;
            tool = value;
            haptic(8);
            renderTools();
        });
        tools.appendChild(b);
        return b;
    }
    const fillBtn = makeToolBtn('■ Remplir', 1);
    const markBtn = makeToolBtn('✕ Marquer vide', 2);

    function renderTools() {
        [[fillBtn, 1], [markBtn, 2]].forEach(([b, v]) => {
            if (tool === v) {
                b.style.borderColor = '#4A6CFA';
                b.style.background = '#EEF2FF';
                b.style.color = '#4A6CFA';
            } else {
                b.style.borderColor = '#C2C7D6';
                b.style.background = '#fff';
                b.style.color = '#8B90A0';
            }
        });
    }

    function renderCell(r, c) {
        const el = cellEls[r][c];
        const v = grid[r][c];
        el.style.background = v === 1 ? '#4A6CFA' : '#E8EAF1';
        if (v === 2) {
            el.innerHTML = '';
            const x = document.createElement('span');
            x.style.cssText = 'font-weight:900;font-size:1rem;color:#9AA0AE;';
            x.textContent = '✕';
            el.appendChild(x);
        } else {
            el.innerHTML = '';
        }
    }

    function check() {
        let okRows = 0, okCols = 0;
        for (let r = 0; r < _NONO_N; r++) {
            const ok = _nonoSameClues(_nonoClues(grid[r].map(v => v === 1 ? 1 : 0)), rowClues[r]);
            rowClueEls[r].style.color = ok ? '#34B871' : '#8B90A0';
            if (ok) okRows++;
        }
        for (let c = 0; c < _NONO_N; c++) {
            const line = grid.map(row => row[c] === 1 ? 1 : 0);
            const ok = _nonoSameClues(_nonoClues(line), colClues[c]);
            colClueEls[c].style.color = ok ? '#34B871' : '#8B90A0';
            if (ok) okCols++;
        }
        hud.innerHTML = `Lignes justes : <b style="color:#4A6CFA">${okRows}/${_NONO_N}</b>` +
            ` · Colonnes justes : <b style="color:#4A6CFA">${okCols}/${_NONO_N}</b>`;
        if (okRows === _NONO_N && okCols === _NONO_N) {
            over = true;
            haptic([40, 60, 40]);
            endGame('Nonogramme résolu — logique impeccable !', true);
        }
    }

    function tap(r, c) {
        // Retaper avec le même outil efface ; sinon on applique l'outil
        grid[r][c] = (grid[r][c] === tool) ? 0 : tool;
        haptic(8);
        renderCell(r, c);
        check();
    }

    renderTools();
    check();
}
