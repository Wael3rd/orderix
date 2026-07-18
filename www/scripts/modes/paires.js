// ─── Mode : Paires Reliées (jour 11) ─────────────────────────────
// Inspiré de la vague Tile Connect / Onet (Tile Club : 86 M+ de
// téléchargements). Reliez les deux tuiles de même numéro par un
// chemin d'au plus 2 virages passant par des cases vides (le tour
// extérieur du plateau compte comme vide) — et dans l'ordre croissant :
// les 1 d'abord, puis les 2… La disposition est vérifiée entièrement
// résoluble avant d'être servie. Pas de défaite : seul le chrono juge.

function _pairesTuile(val, size, opts) {
    const o = opts || {};
    const el = document.createElement('div');
    const s = size || 44;
    el.style.cssText = `width:${s}px;height:${s}px;border-radius:9px;user-select:none;touch-action:manipulation;` +
        'display:flex;align-items:center;justify-content:center;font-weight:900;transition:transform .12s,box-shadow .12s;' +
        `font-size:${Math.round(s * 0.4)}px;` +
        (o.done ? 'background:transparent;color:transparent;' :
            o.next ? 'background:#4A6CFA;color:#fff;box-shadow:0 2px 0 #3553D1;' :
                'background:#fff;color:#8B90A0;box-shadow:0 2px 0 #D8DCE8;');
    if (o.selected) el.style.cssText += 'box-shadow:0 2px 0 #3553D1, 0 0 0 3px #FFFFFF, 0 0 0 6px #F5B227;transform:scale(1.08);';
    el.textContent = o.done ? '' : val;
    return el;
}

function showExamplePaires(day, row, vals) {
    const ex = document.createElement('div');
    ex.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:10px;margin:6px auto;';

    const wrap = document.createElement('div');
    wrap.style.cssText = 'position:relative;display:grid;grid-template-columns:repeat(3,38px);gap:5px;';
    const cells = [[1, 'next'], [3, ''], [2, ''], [null, ''], [null, ''], [null, ''], [2, ''], [3, ''], [1, 'next']];
    cells.forEach(([v, k]) => {
        if (v === null) {
            const e = document.createElement('div');
            e.style.cssText = 'width:38px;height:38px;';
            wrap.appendChild(e);
        } else {
            wrap.appendChild(_pairesTuile(v, 38, { next: k === 'next' }));
        }
    });
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', 124); svg.setAttribute('height', 124);
    svg.style.cssText = 'position:absolute;inset:0;pointer-events:none;';
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
    path.setAttribute('points', '19,19 19,105 105,105');
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke', '#34B871');
    path.setAttribute('stroke-width', 4);
    path.setAttribute('stroke-linecap', 'round');
    path.setAttribute('stroke-dasharray', '6,5');
    svg.appendChild(path);
    wrap.appendChild(svg);

    const note = document.createElement('div');
    note.style.cssText = 'font-weight:bold;color:#8B90A0;font-size:.8rem;text-align:center;max-width:260px;';
    note.textContent = 'Les deux 1 se relient en 1 virage par les cases vides. Aux 2 ensuite !';

    ex.append(wrap, note);
    row.style.flexDirection = 'column';
    row.append(ex);
}

function startGamePaires() {
    board.style.display = 'flex';
    board.style.flexDirection = 'column';
    board.style.alignItems = 'center';
    board.style.gap = '12px';

    // Retour #54 (« trop facile ») : plateau agrandi à 6×5 (15 paires) et
    // la paire recherchée n'est PLUS surlignée — c'est à l'œil de chercher.
    const C = 6, R = 5, PAIRS = 15, TILE = 44, GAP = 6;

    // Chemin ≤ 2 virages sur la grille étendue (tour extérieur vide)
    function pathBetween(g, a, b) {
        // g : grille R×C (true = occupé) ; a,b : indices de cases (à ignorer comme obstacles)
        const W = C + 2, H = R + 2;
        const occ = (x, y) => {
            if (x <= 0 || y <= 0 || x > C || y > R) return false; // anneau extérieur libre
            const idx = (y - 1) * C + (x - 1);
            if (idx === a || idx === b) return false;
            return g[idx];
        };
        const ax = a % C + 1, ay = Math.floor(a / C) + 1;
        const bx = b % C + 1, by = Math.floor(b / C) + 1;
        const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
        // BFS sur (x, y, direction) avec compte de virages
        const best = {};
        const queue = [];
        DIRS.forEach((d, di) => queue.push([ax, ay, di, -1, [[ax, ay]]]));
        while (queue.length) {
            const [x, y, di, turns, trail] = queue.shift();
            const nx = x + DIRS[di][0], ny = y + DIRS[di][1];
            if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
            if (nx === bx && ny === by) return trail.concat([[nx, ny]]);
            if (occ(nx, ny)) continue;
            const nturns = turns === -1 ? 0 : turns;
            const key = nx + ',' + ny + ',' + di;
            if (best[key] !== undefined && best[key] <= nturns) continue;
            best[key] = nturns;
            const ntrail = trail.concat([[nx, ny]]);
            DIRS.forEach((d2, di2) => {
                const t2 = nturns + (di2 === di ? 0 : 1);
                if (t2 <= 2) queue.push([nx, ny, di2, t2, di2 === di ? ntrail : ntrail]);
            });
        }
        return null;
    }

    // Génération vérifiée : l'effacement 1→10 doit être possible à chaque étape
    let cells; // cells[idx] = numéro de paire (1..10)
    let ok = false;
    for (let attempt = 0; attempt < 300 && !ok; attempt++) {
        const vals = [];
        for (let v = 1; v <= PAIRS; v++) { vals.push(v, v); }
        vals.sort(() => Math.random() - 0.5);
        cells = vals.slice();
        // Simulation de la partie parfaite
        const g = cells.map(() => true);
        ok = true;
        for (let v = 1; v <= PAIRS; v++) {
            const [i, j] = cells.map((x, k) => x === v ? k : -1).filter(k => k !== -1);
            if (!pathBetween(g, i, j)) { ok = false; break; }
            g[i] = false; g[j] = false;
        }
    }

    const done = cells.map(() => false);
    let next = 1;
    let selected = -1;

    const hud = document.createElement('div');
    hud.style.cssText = 'display:flex;gap:18px;font-weight:bold;color:#8B90A0;font-size:.95rem;';
    board.appendChild(hud);

    const wrap = document.createElement('div');
    wrap.style.cssText = 'position:relative;padding:' + (TILE / 2 + GAP) + 'px;';
    const grid = document.createElement('div');
    grid.style.cssText = `display:grid;grid-template-columns:repeat(${C},${TILE}px);gap:${GAP}px;`;
    wrap.appendChild(grid);
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    const fullW = C * TILE + (C - 1) * GAP + TILE + 2 * GAP, fullH = R * TILE + (R - 1) * GAP + TILE + 2 * GAP;
    svg.setAttribute('width', fullW); svg.setAttribute('height', fullH);
    svg.style.cssText = 'position:absolute;top:0;left:0;pointer-events:none;z-index:10;';
    wrap.appendChild(svg);
    board.appendChild(wrap);

    function render() {
        hud.innerHTML = `<span>Cherchez les <b style="color:#4A6CFA">${next}</b></span>` +
            `<span>Paires : <b style="color:#34B871">${next - 1}/${PAIRS}</b></span>`;
        grid.innerHTML = '';
        cells.forEach((v, idx) => {
            const i = idx;
            const el = _pairesTuile(v, TILE, { done: done[idx], selected: selected === idx });
            if (!done[idx]) el.addEventListener('pointerdown', (e) => {
                e.preventDefault();
                if (isPaused) return;
                tap(i);
            });
            grid.appendChild(el);
        });
    }

    function cellCenter(idx) {
        const x = idx % C, y = Math.floor(idx / C);
        return [TILE / 2 + GAP + x * (TILE + GAP) + TILE / 2, TILE / 2 + GAP + y * (TILE + GAP) + TILE / 2];
    }

    function flashPath(trail) {
        // trail en coordonnées de grille étendue (1..C, 1..R)
        const pts = trail.map(([gx, gy]) => {
            const px = TILE / 2 + GAP + (gx - 1) * (TILE + GAP) + TILE / 2;
            const py = TILE / 2 + GAP + (gy - 1) * (TILE + GAP) + TILE / 2;
            return px + ',' + py;
        }).join(' ');
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
        line.setAttribute('points', pts);
        line.setAttribute('fill', 'none');
        line.setAttribute('stroke', '#34B871');
        line.setAttribute('stroke-width', 5);
        line.setAttribute('stroke-linecap', 'round');
        line.setAttribute('stroke-linejoin', 'round');
        svg.appendChild(line);
        setTimeout(() => line.remove(), 320);
    }

    function tap(idx) {
        const v = cells[idx];
        if (v !== next) {
            // Mauvais numéro : simple secousse, on cherche le `next`
            haptic(30);
            const el = grid.children[idx];
            if (el) { el.style.animation = 'wobble .25s'; setTimeout(() => { el.style.animation = ''; }, 300); }
            return;
        }
        if (selected === -1) { selected = idx; haptic(8); render(); return; }
        if (selected === idx) { selected = -1; render(); return; }

        const g = cells.map((x, k) => !done[k]);
        const trail = pathBetween(g, selected, idx);
        if (trail) {
            done[selected] = true; done[idx] = true;
            flashPath(trail);
            selected = -1;
            next++;
            haptic([10, 30, 10]);
            render();
            if (next > PAIRS) {
                endGame('Toutes les paires reliées, dans l’ordre parfait !', true);
            }
        } else {
            haptic(40);
            resultDisplay.textContent = 'Pas de chemin en 2 virages trouvé — réessayez.';
            resultDisplay.style.color = '#E0533D';
            setTimeout(() => { if (!isPaused) resultDisplay.textContent = ''; }, 1500);
            selected = -1;
            render();
        }
    }

    render();
}
