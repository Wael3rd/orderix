// ─── Mode : Les Dominos (Dominosa 4×5) ───────────────────────────
// Grille 4×5 remplie de chiffres 0..3. Elle cache un pavage complet
// par les 10 dominos uniques {a,b} (0 ≤ a ≤ b ≤ 3). Le joueur relie
// les cases deux par deux (voisines horizontales/verticales) pour
// reconstituer un pavage où chaque paire n'apparaît qu'une fois.
// Toute solution valide est acceptée. Annulation illimitée : taper
// une case couverte retire son domino. Pas de condition de défaite.

function _domiShuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

// Les 10 paires uniques {a,b} avec 0 ≤ a ≤ b ≤ 3
function _domiAllPairs() {
    const pairs = [];
    for (let a = 0; a <= 3; a++) {
        for (let b = a; b <= 3; b++) pairs.push([a, b]);
    }
    return pairs;
}

// Génère une grille : pavage aléatoire 4×5 en 10 dominos par
// backtracking, puis assignation aléatoire des 10 paires (orientation
// des deux chiffres aléatoire). Renvoie { values, placements }.
function _domiGenerate() {
    const owner = new Array(20).fill(-1);
    const placements = [];

    function solve(count) {
        if (count === 10) return true;
        const i = owner.indexOf(-1);
        const r = Math.floor(i / 5), c = i % 5;
        const options = [];
        if (c < 4 && owner[i + 1] === -1) options.push(i + 1);
        if (r < 3 && owner[i + 5] === -1) options.push(i + 5);
        for (const j of _domiShuffle(options)) {
            owner[i] = count; owner[j] = count;
            placements[count] = [i, j];
            if (solve(count + 1)) return true;
            owner[i] = -1; owner[j] = -1;
        }
        placements.length = count;
        return false;
    }
    solve(0);

    const values = new Array(20).fill(0);
    _domiShuffle(_domiAllPairs()).forEach((p, k) => {
        const [i, j] = placements[k];
        if (Math.random() < 0.5) { values[i] = p[0]; values[j] = p[1]; }
        else { values[i] = p[1]; values[j] = p[0]; }
    });
    return { values, placements };
}

function showExampleDominosa(day, row, vals) {
    const ex = document.createElement('div');
    ex.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:8px;margin:6px auto;';

    // Mini-grille 2×3 : trois dominos verticaux posés, celui du milieu entouré en bleu
    const mini = document.createElement('div');
    mini.style.cssText = 'display:grid;grid-template-columns:repeat(3,28px);grid-template-rows:repeat(2,28px);gap:4px;';
    const chiffres = [1, 0, 3, 2, 0, 3];
    chiffres.forEach((v, i) => {
        const cell = document.createElement('div');
        cell.style.cssText = 'width:28px;height:28px;border-radius:7px;background:#FFFFFF;' +
            'border:2px solid #D8DCE8;box-sizing:border-box;display:flex;align-items:center;' +
            'justify-content:center;font-weight:900;font-size:.8rem;color:#23262F;' +
            'grid-column:' + (i % 3 + 1) + ';grid-row:' + (Math.floor(i / 3) + 1) + ';';
        cell.textContent = v;
        mini.appendChild(cell);
    });
    for (let c = 1; c <= 3; c++) {
        const cadre = document.createElement('div');
        cadre.style.cssText = 'grid-column:' + c + ';grid-row:1 / span 2;box-sizing:border-box;' +
            'border-radius:9px;pointer-events:none;' +
            (c === 2
                ? 'border:3px solid #4A6CFA;background:rgba(74,108,250,.12);'
                : 'border:2px solid #8B90A0;');
        mini.appendChild(cadre);
    }

    const note = document.createElement('div');
    note.style.cssText = 'font-size:.78rem;color:#8B90A0;font-weight:bold;text-align:center;';
    note.textContent = 'Reliez les cases deux par deux — chaque paire une seule fois';

    ex.append(mini, note);
    row.style.flexDirection = 'column';
    row.append(ex);
}

function startGameDominosa() {
    board.innerHTML = '';
    board.style.display = 'flex';
    board.style.flexDirection = 'column';
    board.style.alignItems = 'center';

    const puzzle = _domiGenerate();
    const values = puzzle.values;
    const placed = [];   // dominos posés : { a, b } (indices de cases)
    let sel = null;      // index de la case sélectionnée, ou null
    let finished = false;

    const hud = document.createElement('div');
    hud.style.cssText = 'font-weight:900;color:#23262F;font-size:1.05rem;margin-bottom:10px;text-align:center;';
    board.appendChild(hud);

    const grid = document.createElement('div');
    grid.style.cssText = 'display:grid;grid-template-columns:repeat(5,60px);' +
        'grid-template-rows:repeat(4,60px);gap:6px;justify-content:center;';
    board.appendChild(grid);

    const pillsBox = document.createElement('div');
    pillsBox.style.cssText = 'display:flex;flex-wrap:wrap;gap:6px;justify-content:center;' +
        'max-width:340px;margin-top:14px;';
    board.appendChild(pillsBox);

    const messageBox = document.createElement('div');
    messageBox.style.cssText = 'min-height:22px;margin-top:10px;font-size:.85rem;font-weight:bold;' +
        'color:#E0533D;text-align:center;max-width:340px;';
    board.appendChild(messageBox);

    const pairKey = (a, b) => Math.min(values[a], values[b]) + '|' + Math.max(values[a], values[b]);
    const coveredBy = i => placed.findIndex(d => d.a === i || d.b === i);
    const adjacents = (i, j) => {
        const ri = Math.floor(i / 5), ci = i % 5;
        const rj = Math.floor(j / 5), cj = j % 5;
        return Math.abs(ri - rj) + Math.abs(ci - cj) === 1;
    };

    function render() {
        hud.innerHTML = 'Dominos posés : <b style="color:#4A6CFA">' + placed.length + '</b>/10';

        // Comptage des paires posées pour repérer les doublons
        const counts = {};
        placed.forEach(d => {
            const k = pairKey(d.a, d.b);
            counts[k] = (counts[k] || 0) + 1;
        });

        // Cases
        grid.innerHTML = '';
        for (let i = 0; i < 20; i++) {
            const r = Math.floor(i / 5), c = i % 5;
            const cell = document.createElement('div');
            cell.style.cssText = 'grid-column:' + (c + 1) + ';grid-row:' + (r + 1) + ';' +
                'width:60px;height:60px;border-radius:10px;background:#FFFFFF;' +
                'border:2px solid #D8DCE8;box-sizing:border-box;display:flex;align-items:center;' +
                'justify-content:center;font-weight:900;font-size:1.6rem;color:#23262F;' +
                'touch-action:manipulation;user-select:none;';
            cell.textContent = values[i];
            if (sel === i) {
                cell.style.boxShadow = '0 0 0 3px #FFFFFF, 0 0 0 6px #4A6CFA';
                cell.style.borderColor = '#4A6CFA';
                cell.style.transform = 'scale(1.05)';
            }
            cell.addEventListener('pointerdown', e => { e.preventDefault(); tap(i); });
            grid.appendChild(cell);
        }

        // Cadres des dominos (par-dessus les cases, taps traversants)
        placed.forEach(d => {
            const dup = counts[pairKey(d.a, d.b)] > 1;
            const lo = Math.min(d.a, d.b), hi = Math.max(d.a, d.b);
            const r = Math.floor(lo / 5), c = lo % 5;
            const horizontal = (hi === lo + 1);
            const cadre = document.createElement('div');
            cadre.style.cssText = 'box-sizing:border-box;border-radius:14px;pointer-events:none;' +
                'grid-column:' + (c + 1) + (horizontal ? ' / span 2' : '') + ';' +
                'grid-row:' + (r + 1) + (horizontal ? '' : ' / span 2') + ';' +
                (dup
                    ? 'border:4px solid #E0533D;background:rgba(224,83,61,.12);'
                    : 'border:4px solid #4A6CFA;background:rgba(74,108,250,.10);');
            grid.appendChild(cadre);
        });

        // Pastilles des 10 paires à former
        pillsBox.innerHTML = '';
        _domiAllPairs().forEach(p => {
            const k = p[0] + '|' + p[1];
            const n = counts[k] || 0;
            const pill = document.createElement('div');
            let style = 'min-width:44px;padding:4px 8px;border-radius:999px;box-sizing:border-box;' +
                'font-weight:900;font-size:.85rem;text-align:center;user-select:none;';
            if (n === 0) {
                style += 'background:#FFFFFF;border:2px solid #D8DCE8;color:#23262F;';
                pill.textContent = p[0] + '|' + p[1];
            } else if (n === 1) {
                style += 'background:#F1F3F7;border:2px solid #F1F3F7;color:#8B90A0;';
                pill.textContent = p[0] + '|' + p[1] + ' ✓';
            } else {
                style += 'background:rgba(224,83,61,.12);border:2px solid #E0533D;color:#E0533D;';
                pill.textContent = p[0] + '|' + p[1] + ' ×' + n;
            }
            pill.style.cssText = style;
            pillsBox.appendChild(pill);
        });

        // Message et victoire
        if (placed.length === 10) {
            const perfect = Object.values(counts).every(n => n === 1);
            if (perfect) {
                messageBox.textContent = '';
                finished = true;
                haptic([12, 40, 12]);
                endGame('Bravo ! Pavage parfait !', true);
            } else {
                messageBox.textContent = 'Des dominos sont en double (en rouge) — corrigez-les';
            }
        } else {
            messageBox.textContent = '';
        }
    }

    function tap(i) {
        if (isPaused || finished) return;

        // Case déjà couverte : on retire son domino (annulation illimitée)
        const idx = coveredBy(i);
        if (idx !== -1) {
            placed.splice(idx, 1);
            sel = null;
            haptic(6);
            render();
            return;
        }

        if (sel === null) {           // première sélection
            sel = i;
            haptic(6);
        } else if (sel === i) {       // re-taper la case sélectionnée : désélection
            sel = null;
        } else if (adjacents(sel, i)) { // voisine libre : pose du domino
            placed.push({ a: sel, b: i });
            sel = null;
            haptic(10);
        } else {                      // non adjacente : la sélection se déplace
            sel = i;
            haptic(6);
        }
        render();
    }

    render();
}
