// ─── Mode : Le Chemin (jour 31) ──────────────────────────────────
// Inspiré de Flow Free / Hidato (puzzles de chemin, tops perpétuels).
// Une grille 5×5 cache un chemin qui la traverse entièrement, case
// par case (1 → 25). Quelques jalons sont révélés : prolongez le
// chemin case adjacente par case adjacente, en passant sur chaque
// jalon au bon moment. Toucher la dernière case = reculer. 3 vies.

function _cheminCell(size) {
    const el = document.createElement('div');
    el.style.cssText = `width:${size}px;height:${size}px;border-radius:10px;background:#E8EAF1;` +
        'display:flex;align-items:center;justify-content:center;font-weight:900;user-select:none;' +
        `font-size:${Math.round(size * 0.34)}px;color:#8B90A0;touch-action:manipulation;transition:background .12s,transform .12s;`;
    return el;
}

function showExampleChemin(day, row, vals) {
    const ex = document.createElement('div');
    ex.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:8px;margin:6px auto;';

    const grid = document.createElement('div');
    grid.style.cssText = 'display:grid;grid-template-columns:repeat(3,40px);gap:5px;';
    const demo = [['1', true], ['2', true], ['', false], ['', false], ['3', true], ['4', true], ['', false], ['6', false], ['5', true]];
    demo.forEach(([txt, onPath]) => {
        const c = _cheminCell(40);
        c.textContent = txt;
        if (onPath) { c.style.background = '#4A6CFA'; c.style.color = '#fff'; }
        else if (txt) { c.style.background = '#FFF6E3'; c.style.color = '#B07E0A'; }
        grid.appendChild(c);
    });

    const note = document.createElement('div');
    note.style.cssText = 'font-weight:bold;color:#8B90A0;font-size:.8rem;text-align:center;max-width:250px;';
    note.textContent = 'Le 6 (jalon doré) devra être atteint exactement au 6e pas.';

    ex.append(grid, note);
    row.style.flexDirection = 'column';
    row.append(ex);
}

function startGameChemin() {
    board.style.display = 'flex';
    board.style.flexDirection = 'column';
    board.style.alignItems = 'center';
    board.style.gap = '12px';

    const S = 5, TOTAL = S * S, CELL = 56;

    // Génère un chemin hamiltonien aléatoire par backtracking
    function genPath() {
        const path = [];
        const used = new Array(TOTAL).fill(false);
        function nbrs(p) {
            const r = Math.floor(p / S), c = p % S, out = [];
            if (r > 0) out.push(p - S);
            if (r < S - 1) out.push(p + S);
            if (c > 0) out.push(p - 1);
            if (c < S - 1) out.push(p + 1);
            return out.sort(() => Math.random() - 0.5);
        }
        function dfs(p) {
            path.push(p); used[p] = true;
            if (path.length === TOTAL) return true;
            for (const n of nbrs(p)) if (!used[n] && dfs(n)) return true;
            path.pop(); used[p] = false;
            return false;
        }
        dfs(Math.floor(Math.random() * TOTAL));
        return path;
    }

    const solution = genPath();
    // Jalons révélés : départ, arrivée, et un pas sur ~4
    const hints = new Map(); // cellule → numéro de pas (1-based)
    [0, 4, 8, 12, 16, 20, 24].forEach(step => hints.set(solution[step], step + 1));

    let path = [solution[0]]; // le départ est posé
    let lives = 3;
    let over = false;

    const hud = document.createElement('div');
    hud.style.cssText = 'display:flex;gap:18px;font-weight:bold;color:#8B90A0;font-size:.95rem;';
    board.appendChild(hud);

    const grid = document.createElement('div');
    grid.style.cssText = `display:grid;grid-template-columns:repeat(${S},${CELL}px);gap:6px;`;
    board.appendChild(grid);

    const undoNote = document.createElement('div');
    undoNote.style.cssText = 'font-weight:bold;color:#9AA0AE;font-size:.78rem;';
    undoNote.textContent = 'Astuce : touchez votre dernière case pour reculer.';
    board.appendChild(undoNote);

    function adjacent(a, b) {
        const ra = Math.floor(a / S), ca = a % S, rb = Math.floor(b / S), cb = b % S;
        return Math.abs(ra - rb) + Math.abs(ca - cb) === 1;
    }

    function render() {
        hud.innerHTML = `<span>Pas : <b style="color:#4A6CFA">${path.length}/${TOTAL}</b></span>` +
            `<span style="color:#E0533D;letter-spacing:2px">${'♥'.repeat(lives)}${'♡'.repeat(3 - lives)}</span>`;

        grid.innerHTML = '';
        for (let p = 0; p < TOTAL; p++) {
            const cell = _cheminCell(CELL);
            const inPathIdx = path.indexOf(p);
            const head = path[path.length - 1];

            if (inPathIdx !== -1) {
                cell.style.background = p === head ? '#3553D1' : '#4A6CFA';
                cell.style.color = '#fff';
                cell.textContent = inPathIdx + 1;
                if (p === head && path.length > 1) cell.style.boxShadow = '0 0 0 3px #FFFFFF, 0 0 0 5px #F5B227';
            } else if (hints.has(p)) {
                cell.style.background = '#FFF6E3';
                cell.style.color = '#B07E0A';
                cell.textContent = hints.get(p);
            }

            const cellIdx = p;
            cell.addEventListener('pointerdown', (e) => {
                e.preventDefault();
                if (isPaused || over) return;
                tap(cellIdx);
            });
            grid.appendChild(cell);
        }
    }

    function tap(p) {
        const head = path[path.length - 1];
        // Reculer en touchant la tête (jamais le départ)
        if (p === head && path.length > 1) { path.pop(); haptic(8); render(); return; }
        if (path.includes(p)) return;
        if (!adjacent(head, p)) return;

        const step = path.length + 1;
        if (hints.has(p) && hints.get(p) !== step) {
            // Jalon atteint au mauvais moment
            lives--;
            haptic(50);
            render();
            const bad = grid.children[p];
            if (bad) { bad.style.animation = 'wobble .3s'; setTimeout(() => { bad.style.animation = ''; }, 350); }
            resultDisplay.textContent = `Ce jalon doit être le pas n°${hints.get(p)}, pas le n°${step}.`;
            resultDisplay.style.color = '#E0533D';
            setTimeout(() => { if (!isPaused) resultDisplay.textContent = ''; }, 1400);
            if (lives <= 0) {
                over = true;
                endGame('Plus de vies — le chemin gardera son mystère aujourd’hui.', false);
            }
            return;
        }
        // Le jalon suivant non atteint à son pas ? (on a dépassé son heure)
        for (const [cellHint, stepHint] of hints) {
            if (stepHint === step && cellHint !== p) {
                lives--;
                haptic(50);
                render();
                resultDisplay.textContent = `Le pas n°${step} doit tomber sur un jalon doré.`;
                resultDisplay.style.color = '#E0533D';
                setTimeout(() => { if (!isPaused) resultDisplay.textContent = ''; }, 1400);
                if (lives <= 0) {
                    over = true;
                    endGame('Plus de vies — le chemin gardera son mystère aujourd’hui.', false);
                }
                return;
            }
        }

        path.push(p);
        haptic(8);
        render();
        if (path.length === TOTAL) {
            over = true;
            endGame('La grille est traversée de bout en bout — chemin parfait !', true);
        }
    }

    render();
}
