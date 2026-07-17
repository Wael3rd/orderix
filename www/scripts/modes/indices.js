// ─── Mode : Les Indices ──────────────────────────────────────────
// 5 personnages de couleurs à remettre dans le bon ordre gauche→
// droite grâce à 4-5 indices textuels (avant / juste après /
// position exacte / ni premier ni dernier). Réarrangement par
// échanges (taper 2 personnages) puis « Valider ». 2 essais ; après
// un échec, les positions correctes sont cochées ✓.
// Unicité de la solution vérifiée par force brute (120 permutations).

const _IND_PERSOS = [
    { name: 'Bleu',   c: '#4A6CFA', l: 'B'  },
    { name: 'Vert',   c: '#34B871', l: 'V'  },
    { name: 'Jaune',  c: '#F5B227', l: 'J'  },
    { name: 'Rouge',  c: '#E0533D', l: 'R'  },
    { name: 'Violet', c: '#8B5CF6', l: 'Vi' }
];

function _indShuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

function _indAllPerms() {
    const res = [];
    const a = [0, 1, 2, 3, 4];
    (function rec(k) {
        if (k === a.length) { res.push([...a]); return; }
        for (let i = k; i < a.length; i++) {
            [a[k], a[i]] = [a[i], a[k]];
            rec(k + 1);
            [a[k], a[i]] = [a[i], a[k]];
        }
    })(0);
    return res;
}

// Combien de permutations satisfont tous les indices ? (arrêt à 2)
function _indCountMatch(clues, perms) {
    let count = 0;
    for (const p of perms) {
        if (clues.every(cl => cl.test(p))) {
            if (++count > 1) return count;
        }
    }
    return count;
}

// Construit le vivier d'indices VRAIS pour une solution donnée.
// solution[pos] = index du personnage à cette position.
function _indBuildPool(solution) {
    const posOf = [];
    solution.forEach((ch, pos) => { posOf[ch] = pos; });
    const N = i => _IND_PERSOS[i].name;
    const avant = [], apres = [], milieu = [], exact = [];

    for (let x = 0; x < 5; x++) {
        for (let y = 0; y < 5; y++) {
            if (x === y) continue;
            if (posOf[x] < posOf[y]) {
                avant.push({
                    text: `${N(x)} est quelque part avant ${N(y)}`,
                    test: p => p.indexOf(x) < p.indexOf(y)
                });
            }
            if (posOf[y] === posOf[x] + 1) {
                apres.push({
                    text: `${N(y)} est juste après ${N(x)}`,
                    test: p => p.indexOf(y) === p.indexOf(x) + 1
                });
            }
        }
        if (posOf[x] >= 1 && posOf[x] <= 3) {
            milieu.push({
                text: `${N(x)} n'est ni premier ni dernier`,
                test: p => p.indexOf(x) >= 1 && p.indexOf(x) <= 3
            });
        }
        exact.push({
            text: `${N(x)} est en position ${posOf[x] + 1}`,
            test: (px => p => p.indexOf(x) === px)(posOf[x])
        });
    }
    return { avant, apres, milieu, exact };
}

function _indGenerate() {
    const perms = _indAllPerms();

    for (let attempt = 0; attempt < 200; attempt++) {
        const sol = _indShuffle([0, 1, 2, 3, 4]);
        const groups = _indBuildPool(sol);
        // Variété : un indice de chaque gabarit d'abord, puis le reste mélangé
        const head = [];
        [groups.exact, groups.avant, groups.apres, groups.milieu].forEach(g => {
            const s = _indShuffle(g);
            if (s.length) head.push(s.shift());
            s.forEach(cl => head.push(cl));
        });
        const pool = _indShuffle(head.slice(0, 4)).concat(_indShuffle(head.slice(4)));

        const clues = [];
        let unique = false;
        let k = 0;
        while (k < pool.length && clues.length < 5) {
            clues.push(pool[k++]);
            if (_indCountMatch(clues, perms) === 1) { unique = true; break; }
        }
        if (!unique) continue;
        while (clues.length < 4 && k < pool.length) clues.push(pool[k++]); // complète à 4 mini
        if (clues.length >= 4 && clues.length <= 5) return { sol, clues: _indShuffle(clues) };
    }

    // Repli garanti : 4 positions exactes → solution forcément unique
    const sol = _indShuffle([0, 1, 2, 3, 4]);
    const groups = _indBuildPool(sol);
    return { sol, clues: _indShuffle(groups.exact.slice(0, 4)) };
}

function _indCircle(idx, size) {
    const c = _IND_PERSOS[idx];
    const d = document.createElement('div');
    d.style.cssText = `width:${size}px;height:${size}px;border-radius:50%;flex-shrink:0;` +
        `background:${c.c};display:flex;align-items:center;justify-content:center;` +
        `font-weight:900;font-size:${Math.round(size * 0.36)}px;color:#FFFFFF;user-select:none;`;
    d.textContent = c.l;
    return d;
}

function showExampleIndices(day, row, vals) {
    const ex = document.createElement('div');
    ex.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:8px;margin:6px auto;';

    const clueCard = document.createElement('div');
    clueCard.style.cssText = 'background:#EEF2FF;border-radius:10px;padding:8px 14px;' +
        'font-size:.8rem;color:#23262F;font-weight:bold;text-align:left;';
    clueCard.innerHTML = '• Bleu est quelque part avant Rouge<br>• Jaune est en position 2';

    const rowEx = document.createElement('div');
    rowEx.style.cssText = 'display:flex;gap:10px;';
    [0, 2, 4, 3].forEach(idx => rowEx.appendChild(_indCircle(idx, 34)));

    const note = document.createElement('div');
    note.style.cssText = 'font-size:.78rem;color:#8B90A0;font-weight:bold;text-align:center;';
    note.textContent = 'Touchez 2 personnages pour les échanger';

    ex.append(clueCard, rowEx, note);
    row.style.flexDirection = 'column';
    row.append(ex);
}

function startGameIndices() {
    board.style.display = 'flex';
    board.style.flexDirection = 'column';
    board.style.alignItems = 'center';

    let essais = 2;
    let finished = false;
    let selected = null;
    let marks = null; // positions correctes cochées après un échec

    const { sol, clues } = _indGenerate();
    let current = _indShuffle([0, 1, 2, 3, 4]);
    while (current.every((v, i) => v === sol[i])) current = _indShuffle([0, 1, 2, 3, 4]);

    const hud = document.createElement('div');
    hud.style.cssText = 'font-weight:bold;color:#8B90A0;font-size:.95rem;margin-bottom:10px;';
    board.appendChild(hud);
    function renderHud() {
        hud.innerHTML = `Essais restants : <b style="color:${essais > 1 ? '#4A6CFA' : '#E0533D'}">${essais}</b>`;
    }
    renderHud();

    const clueCard = document.createElement('div');
    clueCard.style.cssText = 'background:#FFFFFF;border:2px solid #EEF2FF;border-radius:12px;' +
        'padding:12px 16px;margin-bottom:16px;max-width:340px;' +
        'font-size:.9rem;color:#23262F;font-weight:bold;line-height:1.7;text-align:left;';
    clues.forEach(cl => {
        const line = document.createElement('div');
        line.textContent = `• ${cl.text}`;
        clueCard.appendChild(line);
    });
    board.appendChild(clueCard);

    const rowZone = document.createElement('div');
    rowZone.style.cssText = 'display:flex;gap:10px;justify-content:center;margin-bottom:16px;';
    board.appendChild(rowZone);

    const validBtn = document.createElement('button');
    validBtn.className = 'btn btn-primary';
    validBtn.textContent = 'Valider';
    validBtn.style.minWidth = '200px';
    board.appendChild(validBtn);

    function renderRow() {
        rowZone.innerHTML = '';
        current.forEach((chIdx, pos) => {
            const col = document.createElement('div');
            col.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:4px;';
            const circle = _indCircle(chIdx, 56);
            circle.style.cursor = 'pointer';
            if (selected === pos) circle.style.boxShadow = '0 0 0 3px #FFFFFF, 0 0 0 6px #3553D1';
            circle.addEventListener('click', () => {
                if (isPaused || finished) return;
                if (selected === null) {
                    selected = pos;
                    haptic(6);
                } else if (selected === pos) {
                    selected = null;
                } else {
                    [current[selected], current[pos]] = [current[pos], current[selected]];
                    selected = null;
                    haptic(10);
                }
                renderRow();
            });
            col.appendChild(circle);
            const mark = document.createElement('div');
            mark.style.cssText = 'font-weight:900;font-size:1.05rem;min-height:1.2em;color:#34B871;';
            mark.textContent = (marks && marks[pos]) ? '✓' : '';
            col.appendChild(mark);
            rowZone.appendChild(col);
        });
    }
    renderRow();

    function revealSolution() {
        const line = document.createElement('div');
        line.style.cssText = 'display:flex;align-items:center;gap:8px;margin-top:12px;';
        const lbl = document.createElement('span');
        lbl.style.cssText = 'font-size:.8rem;font-weight:bold;color:#8B90A0;';
        lbl.textContent = 'Ordre exact :';
        line.appendChild(lbl);
        sol.forEach(chIdx => line.appendChild(_indCircle(chIdx, 34)));
        board.appendChild(line);
    }

    validBtn.addEventListener('click', () => {
        if (isPaused || finished) return;
        selected = null;

        if (current.every((v, i) => v === sol[i])) {
            finished = true;
            marks = [true, true, true, true, true];
            renderRow();
            haptic([12, 40, 12]);
            endGame('Ordre exact — indices parfaitement décodés !', true);
            return;
        }

        essais--;
        haptic(50);
        renderHud();
        if (essais <= 0) {
            finished = true;
            revealSolution();
            endGame('Raté — l’ordre exact est affiché.', false);
        } else {
            marks = current.map((v, i) => v === sol[i]);
            renderRow();
            resultDisplay.textContent = 'Presque ! Les positions correctes sont cochées ✓';
            resultDisplay.style.color = '#F5B227';
            setTimeout(() => {
                if (!isPaused && !finished) resultDisplay.textContent = '';
            }, 1800);
        }
    });
}
