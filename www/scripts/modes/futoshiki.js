// ─── Mode : Plus Petit, Plus Grand (Futoshiki 4×4) ───────────────
// Grille 4×4 : chaque ligne et colonne contient 1-2-3-4 sans
// répétition, et les signes < > (∧ ∨ en vertical) entre certaines
// cases doivent être respectés. Taper une case vide fait cycler sa
// valeur (vide→1→2→3→4→vide), puis « Vérifier ». 2 vies.
// Génération : carré latin permuté + contraintes/pré-remplies,
// unicité garantie par backtracking.
// Aide progressive : toutes les 8 s (gelées en pause), un signe
// supplémentaire VRAI est révélé (flash or), maximum 6 indices.

function _futoShuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

// Compte les solutions d'une grille partielle (s'arrête à `limit`)
function _futoCountSolutions(given, cons, limit) {
    const grid = Array.from({ length: 4 }, () => [0, 0, 0, 0]);
    given.forEach(g => { grid[g.r][g.c] = g.v; });

    function respects(r, c, v) {
        for (let i = 0; i < 4; i++) {
            if (grid[r][i] === v || grid[i][c] === v) return false;
        }
        grid[r][c] = v;
        let ok = true;
        for (const con of cons) {
            const lo = grid[con.lo.r][con.lo.c];
            const hi = grid[con.hi.r][con.hi.c];
            if (lo !== 0 && hi !== 0 && lo >= hi) { ok = false; break; }
        }
        grid[r][c] = 0;
        return ok;
    }

    let count = 0;
    function solve(idx) {
        if (count >= limit) return;
        if (idx === 16) { count++; return; }
        const r = Math.floor(idx / 4), c = idx % 4;
        if (grid[r][c] !== 0) { solve(idx + 1); return; }
        for (let v = 1; v <= 4; v++) {
            if (respects(r, c, v)) {
                grid[r][c] = v;
                solve(idx + 1);
                grid[r][c] = 0;
                if (count >= limit) return;
            }
        }
    }
    solve(0);
    return count;
}

function _futoGeneratePuzzle() {
    // Carré latin 4×4 : base permutée (lignes, colonnes, symboles)
    const base = [[1, 2, 3, 4], [2, 3, 4, 1], [3, 4, 1, 2], [4, 1, 2, 3]];
    const pr = _futoShuffle([0, 1, 2, 3]);
    const pc = _futoShuffle([0, 1, 2, 3]);
    const ps = _futoShuffle([1, 2, 3, 4]);
    const sol = pr.map(r => pc.map(c => ps[base[r][c] - 1]));

    // Toutes les paires adjacentes (horizontales et verticales)
    const pairs = [];
    for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 4; c++) {
            if (c < 3) pairs.push([{ r, c }, { r, c: c + 1 }]);
            if (r < 3) pairs.push([{ r, c }, { r: r + 1, c }]);
        }
    }
    const pairOrder = _futoShuffle(pairs);
    const toCon = pair => {
        const [a, b] = pair;
        return sol[a.r][a.c] < sol[b.r][b.c]
            ? { lo: a, hi: b, a, b }
            : { lo: b, hi: a, a, b };
    };

    const cellOrder = _futoShuffle(
        Array.from({ length: 16 }, (_, i) => ({ r: Math.floor(i / 4), c: i % 4 }))
    );

    let nCons = 5 + Math.floor(Math.random() * 3);   // 5 à 7 contraintes
    let nGiven = 3 + Math.floor(Math.random() * 2);  // 3 à 4 pré-remplies
    const cons = pairOrder.slice(0, nCons).map(toCon);
    const given = cellOrder.slice(0, nGiven).map(p => ({ r: p.r, c: p.c, v: sol[p.r][p.c] }));

    // Boucle d'unicité : on ajoute contrainte puis case pré-remplie en alternance
    let addCon = true;
    while (_futoCountSolutions(given, cons, 2) > 1) {
        if (addCon && nCons < pairOrder.length) {
            cons.push(toCon(pairOrder[nCons++]));
        } else if (nGiven < 16) {
            const p = cellOrder[nGiven++];
            given.push({ r: p.r, c: p.c, v: sol[p.r][p.c] });
        }
        addCon = !addCon;
    }
    // Réserve d'indices : les inégalités vraies restantes (paires
    // adjacentes de la solution non encore affichées)
    const reserve = pairOrder.slice(nCons).map(toCon);
    return { sol, cons, given, reserve };
}

function _futoCellDiv(size, txt, fixed) {
    const d = document.createElement('div');
    d.style.cssText = `width:${size}px;height:${size}px;border-radius:8px;` +
        `display:flex;align-items:center;justify-content:center;` +
        `font-weight:900;font-size:${Math.round(size * 0.42)}px;` +
        `border:2px solid #8B90A0;user-select:none;` +
        (fixed
            ? 'background:#EEF2FF;color:#23262F;'
            : 'background:#FFFFFF;color:#4A6CFA;');
    d.textContent = txt;
    return d;
}

function showExampleFutoshiki(day, row, vals) {
    const ex = document.createElement('div');
    ex.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:8px;margin:6px auto;';

    const mini = document.createElement('div');
    mini.style.cssText = 'display:grid;grid-template-columns:34px 18px 34px;grid-template-rows:34px 18px 34px;align-items:center;justify-items:center;';
    const place = (el, col, rw) => { el.style.gridColumn = String(col); el.style.gridRow = String(rw); mini.appendChild(el); };

    place(_futoCellDiv(34, '1', true), 1, 1);
    const s1 = document.createElement('div');
    s1.style.cssText = 'font-weight:900;color:#8B90A0;font-size:.95rem;';
    s1.textContent = '<';
    place(s1, 2, 1);
    place(_futoCellDiv(34, '3', false), 3, 1);
    const s2 = document.createElement('div');
    s2.style.cssText = 'font-weight:900;color:#8B90A0;font-size:.95rem;';
    s2.textContent = '∧';
    place(s2, 1, 2);
    place(_futoCellDiv(34, '2', false), 1, 3);
    const q = _futoCellDiv(34, '', false);
    q.textContent = '?';
    q.style.color = '#8B90A0';
    place(q, 3, 3);

    const note = document.createElement('div');
    note.style.cssText = 'font-size:.78rem;color:#8B90A0;font-weight:bold;text-align:center;';
    note.textContent = 'Touchez une case pour changer sa valeur';

    ex.append(mini, note);
    row.style.flexDirection = 'column';
    row.append(ex);
}

function startGameFutoshiki() {
    board.style.display = 'flex';
    board.style.flexDirection = 'column';
    board.style.alignItems = 'center';

    let lives = 2;
    let finished = false;
    const puzzle = _futoGeneratePuzzle();
    const fixed = Array.from({ length: 4 }, () => [false, false, false, false]);
    const entry = Array.from({ length: 4 }, () => [0, 0, 0, 0]);
    puzzle.given.forEach(g => { fixed[g.r][g.c] = true; entry[g.r][g.c] = g.v; });

    const hud = document.createElement('div');
    hud.style.cssText = 'display:flex;gap:18px;align-items:center;justify-content:center;font-weight:bold;color:#8B90A0;font-size:.95rem;margin-bottom:12px;';
    board.appendChild(hud);
    function renderHud() {
        hud.innerHTML = '<span>Lignes et colonnes : <b style="color:#4A6CFA">1-2-3-4</b></span>' +
            `<span style="color:#E0533D;letter-spacing:2px">${'♥'.repeat(lives)}${'♡'.repeat(2 - lives)}</span>`;
    }
    renderHud();

    const grid = document.createElement('div');
    grid.style.cssText = 'display:grid;grid-template-columns:48px 22px 48px 22px 48px 22px 48px;' +
        'grid-template-rows:48px 22px 48px 22px 48px 22px 48px;' +
        'align-items:center;justify-items:center;margin-bottom:16px;';
    board.appendChild(grid);

    const cells = Array.from({ length: 4 }, () => [null, null, null, null]);
    for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 4; c++) {
            const cell = _futoCellDiv(48, entry[r][c] ? String(entry[r][c]) : '', fixed[r][c]);
            cell.style.gridColumn = String(2 * c + 1);
            cell.style.gridRow = String(2 * r + 1);
            if (!fixed[r][c]) {
                cell.style.cursor = 'pointer';
                cell.addEventListener('click', () => {
                    if (isPaused || finished) return;
                    entry[r][c] = (entry[r][c] + 1) % 5; // vide→1→2→3→4→vide
                    cell.textContent = entry[r][c] ? String(entry[r][c]) : '';
                    haptic(6);
                });
            }
            cells[r][c] = cell;
            grid.appendChild(cell);
        }
    }
    // Signes d'inégalité dans les gouttières
    function renderSign(con) {
        const s = document.createElement('div');
        s.style.cssText = 'font-weight:900;color:#23262F;font-size:1.05rem;user-select:none;';
        const { a, b, lo } = con;
        if (a.r === b.r) { // horizontal : entre (r,c) et (r,c+1)
            const c = Math.min(a.c, b.c);
            s.style.gridColumn = String(2 * c + 2);
            s.style.gridRow = String(2 * a.r + 1);
            s.textContent = (lo.c === c) ? '<' : '>';
        } else {           // vertical : entre (r,c) et (r+1,c)
            const r = Math.min(a.r, b.r);
            s.style.gridColumn = String(2 * a.c + 1);
            s.style.gridRow = String(2 * r + 2);
            s.textContent = (lo.r === r) ? '∧' : '∨';
        }
        grid.appendChild(s);
        return s;
    }
    puzzle.cons.forEach(renderSign);

    // ── Indices progressifs : un signe vrai révélé toutes les 8 s ──
    const reserve = _futoShuffle(puzzle.reserve);
    const MAX_HINTS = 6;
    let hintsGiven = 0;
    let hintTick = 0;
    clearInterval(window.speedTimer);
    window.speedTimer = setInterval(() => {
        if (isPaused || finished) return;   // gelé pendant la pause
        hintTick++;
        if (hintTick < 8) return;
        hintTick = 0;
        const con = reserve.shift();
        if (!con) { clearInterval(window.speedTimer); return; }
        puzzle.cons.push(con);              // la vérification en tient compte
        const s = renderSign(con);
        s.style.transition = 'transform .3s ease, color .3s ease';
        s.style.color = '#F5B227';
        s.style.transform = 'scale(1.6)';
        setTimeout(() => {
            s.style.color = '#23262F';
            s.style.transform = 'scale(1)';
        }, 1200);
        resultDisplay.textContent = 'Nouvel indice !';
        resultDisplay.style.color = '#F5B227';
        haptic(12);
        setTimeout(() => {
            if (resultDisplay.textContent === 'Nouvel indice !') resultDisplay.textContent = '';
        }, 1200);
        hintsGiven++;
        if (hintsGiven >= MAX_HINTS || reserve.length === 0) clearInterval(window.speedTimer);
    }, 1000);

    function flashCells(keys) {
        keys.forEach(k => {
            const [r, c] = k.split(',').map(Number);
            const cell = cells[r][c];
            const saved = cell.style.cssText;
            cell.style.borderColor = '#E0533D';
            cell.style.color = '#E0533D';
            cell.classList.add('flicker-anim');
            setTimeout(() => {
                cell.classList.remove('flicker-anim');
                cell.style.cssText = saved;
            }, 900);
        });
    }

    function revealSolution() {
        for (let r = 0; r < 4; r++) {
            for (let c = 0; c < 4; c++) {
                const wrong = entry[r][c] !== puzzle.sol[r][c];
                cells[r][c].textContent = String(puzzle.sol[r][c]);
                if (wrong && !fixed[r][c]) {
                    cells[r][c].style.borderColor = '#34B871';
                    cells[r][c].style.color = '#34B871';
                }
            }
        }
    }

    const checkBtn = document.createElement('button');
    checkBtn.className = 'btn btn-primary';
    checkBtn.textContent = 'Vérifier';
    checkBtn.style.minWidth = '200px';
    board.appendChild(checkBtn);

    checkBtn.addEventListener('click', () => {
        if (isPaused || finished) return;

        for (let r = 0; r < 4; r++) {
            for (let c = 0; c < 4; c++) {
                if (entry[r][c] === 0) {
                    resultDisplay.textContent = 'Complétez la grille';
                    resultDisplay.style.color = '#F5B227';
                    haptic(20);
                    setTimeout(() => {
                        if (!isPaused && resultDisplay.textContent === 'Complétez la grille') resultDisplay.textContent = '';
                    }, 1400);
                    return;
                }
            }
        }

        const faulty = new Set();
        // Répétitions en ligne et en colonne
        for (let r = 0; r < 4; r++) {
            for (let v = 1; v <= 4; v++) {
                const hits = [];
                for (let c = 0; c < 4; c++) if (entry[r][c] === v) hits.push(`${r},${c}`);
                if (hits.length > 1) hits.forEach(k => faulty.add(k));
            }
        }
        for (let c = 0; c < 4; c++) {
            for (let v = 1; v <= 4; v++) {
                const hits = [];
                for (let r = 0; r < 4; r++) if (entry[r][c] === v) hits.push(`${r},${c}`);
                if (hits.length > 1) hits.forEach(k => faulty.add(k));
            }
        }
        // Inégalités
        puzzle.cons.forEach(con => {
            if (entry[con.lo.r][con.lo.c] >= entry[con.hi.r][con.hi.c]) {
                faulty.add(`${con.lo.r},${con.lo.c}`);
                faulty.add(`${con.hi.r},${con.hi.c}`);
            }
        });

        if (faulty.size === 0) {
            finished = true;
            haptic([12, 40, 12]);
            endGame('Grille parfaite — toutes les inégalités sont respectées !', true);
            return;
        }

        lives--;
        haptic(60);
        flashCells([...faulty]);
        renderHud();
        if (lives <= 0) {
            finished = true;
            revealSolution();
            endGame('Plus de vies — la solution est affichée.', false);
        } else {
            resultDisplay.textContent = 'Des cases clignotent en rouge : corrigez-les !';
            resultDisplay.style.color = '#E0533D';
            setTimeout(() => {
                if (!isPaused && !finished) resultDisplay.textContent = '';
            }, 1600);
        }
    });
}
