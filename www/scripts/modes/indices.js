// ─── Mode : Les Indices ──────────────────────────────────────────
// 5 personnages de couleurs à remettre dans le bon ordre gauche→
// droite grâce à 4-5 indices textuels RELATIONNELS (avant / juste
// après / ni premier ni dernier / quelque part entre / pas côte à
// côte). Au plus UN indice « position exacte », en dernier recours.
// Réarrangement par échanges (taper 2 personnages) puis « Valider ».
// 2 essais ; après un échec, les positions correctes sont cochées ✓.
// Force brute (120 permutations) : solution UNIQUE et jeu d'indices
// MINIMAL (aucun indice retirable sans perdre l'unicité).

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
    const avant = [], apres = [], milieu = [], entre = [], ecart = [], exact = [];

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
            // « A et B ne sont pas côte à côte » (une fois par paire)
            if (x < y && Math.abs(posOf[x] - posOf[y]) > 1) {
                ecart.push({
                    text: `${N(x)} et ${N(y)} ne sont pas côte à côte`,
                    test: p => Math.abs(p.indexOf(x) - p.indexOf(y)) !== 1
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
    // « A est quelque part entre B et C » (ordre B..A..C ou C..A..B)
    for (let a = 0; a < 5; a++) {
        for (let b = 0; b < 5; b++) {
            for (let c = b + 1; c < 5; c++) {
                if (a === b || a === c) continue;
                const lo = Math.min(posOf[b], posOf[c]);
                const hi = Math.max(posOf[b], posOf[c]);
                if (posOf[a] > lo && posOf[a] < hi) {
                    entre.push({
                        text: `${N(a)} est quelque part entre ${N(b)} et ${N(c)}`,
                        test: p => {
                            const pa = p.indexOf(a), pb = p.indexOf(b), pc = p.indexOf(c);
                            return (pb < pa && pa < pc) || (pc < pa && pa < pb);
                        }
                    });
                }
            }
        }
    }
    return { avant, apres, milieu, entre, ecart, exact };
}

// Retire un à un les indices redondants : à la fin, aucun indice ne
// peut être enlevé sans perdre l'unicité. Les tests étant monotones
// (ajouter un indice ne peut que réduire les solutions), une seule
// passe suffit et garantit qu'aucun sous-ensemble strict ne suffit.
function _indMinimize(clues, perms) {
    const kept = [...clues];
    for (let i = kept.length - 1; i >= 0; i--) {
        const without = kept.slice(0, i).concat(kept.slice(i + 1));
        if (_indCountMatch(without, perms) === 1) {
            kept.splice(i, 1);
        }
    }
    return kept;
}

function _indGenerate() {
    const perms = _indAllPerms();

    for (let attempt = 0; attempt < 300; attempt++) {
        const sol = _indShuffle([0, 1, 2, 3, 4]);
        const groups = _indBuildPool(sol);
        // Vivier 100 % relationnel. Variété : un indice de chaque
        // gabarit d'abord (mélangés entre eux), puis le reste mélangé.
        const head = [], rest = [];
        [groups.entre, groups.ecart, groups.avant, groups.apres, groups.milieu].forEach(g => {
            const s = _indShuffle(g);
            if (s.length) head.push(s.shift());
            s.forEach(cl => rest.push(cl));
        });
        const pool = _indShuffle(head).concat(_indShuffle(rest));

        // Ajoute des indices relationnels jusqu'à unicité
        const clues = [];
        let unique = false;
        for (const cl of pool) {
            clues.push(cl);
            if (_indCountMatch(clues, perms) === 1) { unique = true; break; }
        }
        // Dernier recours seulement : UN indice « position exacte »
        if (!unique) {
            for (const ex of _indShuffle(groups.exact)) {
                if (_indCountMatch(clues.concat([ex]), perms) === 1) {
                    clues.push(ex);
                    unique = true;
                    break;
                }
            }
        }
        if (!unique) continue;

        // Minimalité : aucun sous-ensemble strict ne doit suffire
        const minimal = _indMinimize(clues, perms);
        const nExact = minimal.filter(cl => groups.exact.includes(cl)).length;
        if (minimal.length >= 4 && minimal.length <= 5 && nExact <= 1) {
            return { sol, clues: _indShuffle(minimal) };
        }
    }

    // Repli garanti (jamais atteint en pratique) : tous les indices
    // « avant » déterminent l'ordre à eux seuls, puis minimisation.
    const sol = _indShuffle([0, 1, 2, 3, 4]);
    const groups = _indBuildPool(sol);
    const minimal = _indMinimize(_indShuffle(groups.avant), perms);
    return { sol, clues: _indShuffle(minimal) };
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
    clueCard.innerHTML = '• Jaune est quelque part entre Bleu et Rouge<br>• Bleu et Rouge ne sont pas côte à côte';

    const rowEx = document.createElement('div');
    rowEx.style.cssText = 'display:flex;gap:10px;';
    [0, 2, 4, 3].forEach(idx => rowEx.appendChild(_indCircle(idx, 34)));

    const note = document.createElement('div');
    note.style.cssText = 'font-size:.78rem;color:#8B90A0;font-weight:bold;text-align:center;';
    note.textContent = 'Glissez les personnages pour les réordonner';

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
    let marks = null; // positions correctes cochées après un échec
    // Drag & drop natif (retour #67) : état du glissement en cours
    let drag = null;  // { ch, insertIdx, clone }

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

    // Rendu de la rangée. Pendant un glissement, `current` ne contient
    // plus le personnage saisi : un emplacement en pointillés marque le
    // point d'insertion (drag.insertIdx).
    function renderRow() {
        rowZone.innerHTML = '';
        const display = drag
            ? current.slice(0, drag.insertIdx).concat([null]).concat(current.slice(drag.insertIdx))
            : current;
        display.forEach((chIdx, pos) => {
            const col = document.createElement('div');
            col.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:4px;';
            if (chIdx === null) {
                const ph = document.createElement('div');
                ph.style.cssText = 'width:56px;height:56px;border-radius:50%;border:3px dashed #C9D4FB;background:#EEF2FF;flex-shrink:0;';
                col.appendChild(ph);
            } else {
                const circle = _indCircle(chIdx, 56);
                circle.style.cssText += 'cursor:grab;touch-action:none;';
                circle.addEventListener('pointerdown', (e) => {
                    e.preventDefault();
                    if (isPaused || finished || drag) return;
                    startDrag(chIdx, e, circle);
                });
                col.appendChild(circle);
            }
            const mark = document.createElement('div');
            mark.style.cssText = 'font-weight:900;font-size:1.05rem;min-height:1.2em;color:#34B871;';
            mark.textContent = (marks && marks[pos]) ? '✓' : '';
            col.appendChild(mark);
            rowZone.appendChild(col);
        });
    }
    renderRow();

    // ─── Drag & drop natif (Pointer Events, retour #67) ──────────────
    function insertIdxFromX(clientX) {
        // Point d'insertion = nombre de cercles dont le centre est à
        // gauche du doigt (positions mesurées en direct)
        const circles = [...rowZone.querySelectorAll('div')]
            .filter(el => el.style.borderRadius === '50%' && el.style.borderStyle !== 'dashed');
        let idx = 0;
        for (const c of circles) {
            const r = c.getBoundingClientRect();
            if (clientX > r.left + r.width / 2) idx++;
        }
        return Math.min(idx, current.length);
    }

    function startDrag(ch, e, circleEl) {
        const pos = current.indexOf(ch);
        current.splice(pos, 1);
        const clone = circleEl.cloneNode(true);
        clone.style.cssText += 'position:fixed;z-index:300;pointer-events:none;transform:scale(1.15);' +
            'box-shadow:0 8px 22px rgba(35,38,47,.35);margin:0;';
        clone.style.left = (e.clientX - 28) + 'px';
        clone.style.top = (e.clientY - 40) + 'px';
        document.body.appendChild(clone);
        drag = { ch: ch, insertIdx: pos, clone: clone };
        haptic(8);
        // Écouteurs sur document : renderRow() reconstruit la rangée en
        // cours de glissement, l'élément d'origine ne survit pas.
        document.addEventListener('pointermove', onDragMove);
        document.addEventListener('pointerup', onDragEnd);
        document.addEventListener('pointercancel', onDragEnd);
        renderRow();
    }

    function onDragMove(e) {
        if (!drag) return;
        drag.clone.style.left = (e.clientX - 28) + 'px';
        drag.clone.style.top = (e.clientY - 40) + 'px';
        const idx = insertIdxFromX(e.clientX);
        if (idx !== drag.insertIdx) {
            drag.insertIdx = idx;
            renderRow();
        }
    }

    function onDragEnd() {
        if (!drag) return;
        document.removeEventListener('pointermove', onDragMove);
        document.removeEventListener('pointerup', onDragEnd);
        document.removeEventListener('pointercancel', onDragEnd);
        current.splice(drag.insertIdx, 0, drag.ch);
        drag.clone.remove();
        drag = null;
        haptic(10);
        renderRow();
    }

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
        if (isPaused || finished || drag) return;

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
