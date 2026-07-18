// ─── Mode : Les Bulles (jour 29) ─────────────────────────────────
// Grappe de bulles accrochées au plafond (grille hexagonale 6×7,
// rangées impaires décalées d'une demi-case), 4 couleurs.
// TAP sur une bulle d'un groupe d'au moins 3 connectées de même
// couleur → tout le groupe éclate. Les bulles détachées de la
// rangée du haut tombent et comptent aussi. Objectif : dégager
// au moins 90 % de la grappe. Grille vérifiée « videable » par
// simulation gloutonne (max 50 essais).

const _BUL_ROWS = 6;
const _BUL_COLS = 7;
const _BUL_SIZE = 44;                 // diamètre d'une bulle
const _BUL_STEP = _BUL_SIZE + 2;      // pas horizontal
const _BUL_VSTEP = Math.round(_BUL_STEP * 0.87); // pas vertical (hexagonal)
const _BUL_SEUIL = 0.9;               // 90 % pour gagner
const _BUL_COULEURS = ['#4A6CFA', '#34B871', '#F5B227', '#E0533D'];

// Voisins hexagonaux (offset « odd-r » : rangées impaires décalées à droite)
function _bulVoisins(r, c) {
    const deltas = (r % 2)
        ? [[0, -1], [0, 1], [-1, 0], [-1, 1], [1, 0], [1, 1]]
        : [[0, -1], [0, 1], [-1, -1], [-1, 0], [1, -1], [1, 0]];
    const out = [];
    for (let i = 0; i < deltas.length; i++) {
        const nr = r + deltas[i][0], nc = c + deltas[i][1];
        if (nr >= 0 && nr < _BUL_ROWS && nc >= 0 && nc < _BUL_COLS) out.push([nr, nc]);
    }
    return out;
}

// Groupe de même couleur connecté à (r,c) — grid[r][c] = index couleur ou null
function _bulGroupe(grid, r, c) {
    const color = grid[r][c];
    if (color === null) return [];
    const seen = new Set([r + ',' + c]);
    const stack = [[r, c]];
    const group = [];
    while (stack.length) {
        const cur = stack.pop();
        group.push(cur);
        const vs = _bulVoisins(cur[0], cur[1]);
        for (let i = 0; i < vs.length; i++) {
            const k = vs[i][0] + ',' + vs[i][1];
            if (!seen.has(k) && grid[vs[i][0]][vs[i][1]] === color) {
                seen.add(k);
                stack.push(vs[i]);
            }
        }
    }
    return group;
}

// Bulles encore vivantes mais plus reliées à la rangée du haut
function _bulFlottantes(grid) {
    const seen = new Set();
    const stack = [];
    for (let c = 0; c < _BUL_COLS; c++) {
        if (grid[0][c] !== null) { seen.add('0,' + c); stack.push([0, c]); }
    }
    while (stack.length) {
        const cur = stack.pop();
        const vs = _bulVoisins(cur[0], cur[1]);
        for (let i = 0; i < vs.length; i++) {
            const k = vs[i][0] + ',' + vs[i][1];
            if (!seen.has(k) && grid[vs[i][0]][vs[i][1]] !== null) {
                seen.add(k);
                stack.push(vs[i]);
            }
        }
    }
    const out = [];
    for (let r = 0; r < _BUL_ROWS; r++) for (let c = 0; c < _BUL_COLS; c++) {
        if (grid[r][c] !== null && !seen.has(r + ',' + c)) out.push([r, c]);
    }
    return out;
}

// Tous les groupes éclatables (taille ≥ 3) de la grille
function _bulGroupesJouables(grid) {
    const seen = new Set();
    const groups = [];
    for (let r = 0; r < _BUL_ROWS; r++) for (let c = 0; c < _BUL_COLS; c++) {
        const k = r + ',' + c;
        if (grid[r][c] === null || seen.has(k)) continue;
        const g = _bulGroupe(grid, r, c);
        g.forEach(p => seen.add(p[0] + ',' + p[1]));
        if (g.length >= 3) groups.push(g);
    }
    return groups;
}

// Simulation gloutonne : éclate toujours le plus grand groupe.
// Retourne la fraction de bulles éliminées.
function _bulSimule(grid) {
    const g = grid.map(row => row.slice());
    const total = _BUL_ROWS * _BUL_COLS;
    let popped = 0;
    for (;;) {
        const groups = _bulGroupesJouables(g);
        if (!groups.length) break;
        let best = groups[0];
        for (let i = 1; i < groups.length; i++) if (groups[i].length > best.length) best = groups[i];
        best.forEach(p => { g[p[0]][p[1]] = null; });
        popped += best.length;
        const falling = _bulFlottantes(g);
        falling.forEach(p => { g[p[0]][p[1]] = null; });
        popped += falling.length;
    }
    return popped / total;
}

// Génère une grille dont la simulation gloutonne vide ≥ 90 % (max 50 essais)
function _bulGenere() {
    let bestGrid = null, bestScore = -1;
    for (let t = 0; t < 50; t++) {
        const g = [];
        for (let r = 0; r < _BUL_ROWS; r++) {
            const row = [];
            for (let c = 0; c < _BUL_COLS; c++) row.push(Math.floor(Math.random() * _BUL_COULEURS.length));
            g.push(row);
        }
        const score = _bulSimule(g);
        if (score > bestScore) { bestScore = score; bestGrid = g; }
        if (score >= _BUL_SEUIL) return g;
    }
    return bestGrid; // meilleur essai en secours (très rare)
}

function _bulX(r, c) { return c * _BUL_STEP + (r % 2 ? _BUL_STEP / 2 : 0); }
function _bulY(r) { return r * _BUL_VSTEP; }

function showExampleBulles(day, row, vals) {
    const ex = document.createElement('div');
    ex.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:8px;margin:6px auto;';

    // Mini-grappe statique 3×4, un groupe de 3 vertes surligné
    const S = 26, STEP = 28, VSTEP = 24;
    const zone = document.createElement('div');
    zone.style.cssText = `position:relative;width:${3 * STEP + STEP / 2 + S}px;height:${2 * VSTEP + S}px;`;
    const mini = [
        [0, 1, 1, 2],
        [3, 1, 0, 2],
        [0, 3, 2, 0]
    ];
    const groupe = ['0,1', '0,2', '1,1']; // les 3 vertes connectées
    for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) {
        const b = document.createElement('div');
        const x = c * STEP + (r % 2 ? STEP / 2 : 0);
        b.style.cssText = `position:absolute;left:${x}px;top:${r * VSTEP}px;width:${S}px;height:${S}px;` +
            `border-radius:50%;background:${_BUL_COULEURS[mini[r][c]]};box-shadow:0 1px 3px rgba(35,38,47,.2);`;
        if (groupe.indexOf(r + ',' + c) !== -1) b.style.boxShadow = '0 0 0 2px #FFFFFF, 0 0 0 4px #F5B227';
        zone.appendChild(b);
    }

    const note = document.createElement('div');
    note.style.cssText = 'font-weight:bold;color:#8B90A0;font-size:.8rem;text-align:center;max-width:260px;';
    note.textContent = 'Touchez un groupe d\'au moins 3 bulles de même couleur pour l\'éclater. Les bulles détachées tombent !';

    ex.append(zone, note);
    row.style.flexDirection = 'column';
    row.append(ex);
}

function startGameBulles() {
    board.style.display = 'flex';
    board.style.flexDirection = 'column';
    board.style.alignItems = 'center';
    board.style.gap = '12px';

    const grid = _bulGenere();           // grid[r][c] = index couleur ou null
    const els = [];                      // éléments DOM des bulles
    const total = _BUL_ROWS * _BUL_COLS;
    let popped = 0;
    let over = false;

    // HUD de progression
    const hud = document.createElement('div');
    hud.style.cssText = 'font-weight:bold;font-size:.95rem;color:#8B90A0;';
    board.appendChild(hud);

    function renderHud() {
        const pct = Math.floor((popped / total) * 100);
        hud.innerHTML = `Éclatées : <b style="color:#4A6CFA">${pct} %</b>`;
    }

    // Grappe (positions calculées, pas de mesure DOM)
    const W = (_BUL_COLS - 1) * _BUL_STEP + _BUL_STEP / 2 + _BUL_SIZE;
    const H = (_BUL_ROWS - 1) * _BUL_VSTEP + _BUL_SIZE;
    const zone = document.createElement('div');
    zone.style.cssText = `position:relative;width:${W}px;height:${H}px;`;
    board.appendChild(zone);

    function popEl(el, delay) {
        setTimeout(() => {
            el.style.transition = 'transform .2s ease, opacity .2s ease';
            el.style.transform = 'scale(0)';
            el.style.opacity = '0';
            el.style.pointerEvents = 'none';
            setTimeout(() => { if (el.parentNode) el.remove(); }, 220);
        }, delay);
    }

    function shake(el) {
        haptic(30);
        el.style.animation = 'wobble .25s';
        setTimeout(() => { el.style.animation = ''; }, 300);
    }

    function onTap(r, c, e) {
        e.preventDefault();
        if (isPaused || over || grid[r][c] === null) return;

        const group = _bulGroupe(grid, r, c);
        if (group.length < 3) { shake(els[r][c]); return; } // isolée : rien, pas de pénalité

        // 1. Le groupe éclate
        haptic(10);
        group.forEach(p => {
            grid[p[0]][p[1]] = null;
            popEl(els[p[0]][p[1]], 0);
        });
        popped += group.length;

        // 2. Les bulles détachées du haut tombent (léger décalage d'animation)
        const falling = _bulFlottantes(grid);
        falling.forEach((p, i) => {
            grid[p[0]][p[1]] = null;
            popEl(els[p[0]][p[1]], 120 + i * 60);
        });
        popped += falling.length;
        if (falling.length) haptic([8, 40, 8]);

        renderHud();

        // 3. Fin de partie
        if (popped / total >= _BUL_SEUIL) {
            over = true;
            endGame('Le ciel est dégagé — quelle pluie de bulles !', true);
            return;
        }
        if (!_bulGroupesJouables(grid).length) {
            over = true;
            endGame('Plus aucun groupe à éclater…', false);
        }
    }

    for (let r = 0; r < _BUL_ROWS; r++) {
        els.push([]);
        for (let c = 0; c < _BUL_COLS; c++) {
            const el = document.createElement('div');
            el.style.cssText = `position:absolute;left:${_bulX(r, c)}px;top:${_bulY(r)}px;` +
                `width:${_BUL_SIZE}px;height:${_BUL_SIZE}px;border-radius:50%;` +
                `background:${_BUL_COULEURS[grid[r][c]]};box-shadow:0 2px 6px rgba(35,38,47,.2);` +
                'touch-action:manipulation;user-select:none;';
            (function (rr, cc) {
                el.addEventListener('pointerdown', (e) => onTap(rr, cc, e));
            })(r, c);
            els[r].push(el);
            zone.appendChild(el);
        }
    }

    renderHud();
}
