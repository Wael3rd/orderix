// ─── Mode : À Bord ! (jour 26) ───────────────────────────────────
// Inspiré de Bus Jam (top téléchargements 2024-25). Une foule en
// colonnes : seule la passagère de TÊTE de chaque colonne est
// accessible. Faites-les monter dans le bus dans l'ordre 1..12 ;
// 3 sièges d'attente servent de tampon. La donne est vérifiée
// gagnable par un solveur avant d'être servie.

const _FOULE_EMOJIS = ['👩', '👩‍🦰', '👱‍♀️', '👵', '👩‍🦱', '🧕', '👧', '👩‍🦳', '👸', '🙆‍♀️', '💁‍♀️', '🧏‍♀️'];

function _foulePerso(num, size, opts) {
    const o = opts || {};
    const el = document.createElement('div');
    const s = size || 52;
    el.style.cssText = `position:relative;width:${s}px;height:${s}px;border-radius:50%;flex-shrink:0;` +
        `background:${o.dim ? '#E8EAF1' : '#EEF2FF'};display:flex;align-items:center;justify-content:center;` +
        `font-size:${Math.round(s * 0.52)}px;user-select:none;touch-action:manipulation;transition:transform .12s;` +
        (o.dim ? 'opacity:.55;' : 'box-shadow:0 2px 0 #C9D4FB;');
    el.textContent = _FOULE_EMOJIS[(num - 1) % _FOULE_EMOJIS.length];
    const b = document.createElement('div');
    b.style.cssText = `position:absolute;bottom:-6px;right:-6px;min-width:${Math.round(s * 0.42)}px;height:${Math.round(s * 0.42)}px;` +
        'border-radius:999px;background:#4A6CFA;color:#fff;display:flex;align-items:center;justify-content:center;' +
        `font-weight:900;font-size:${Math.round(s * 0.24)}px;padding:0 4px;box-shadow:0 1px 0 #3553D1;`;
    b.textContent = num;
    el.appendChild(b);
    return el;
}

function showExampleLaFoule(day, row, vals) {
    const ex = document.createElement('div');
    ex.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:10px;margin:6px auto;';

    const cols = document.createElement('div');
    cols.style.cssText = 'display:flex;gap:14px;';
    [[3, 1], [4, 2]].forEach(col => {
        const c = document.createElement('div');
        c.style.cssText = 'display:flex;flex-direction:column;gap:6px;align-items:center;';
        col.forEach((n, i) => c.appendChild(_foulePerso(n, 40, { dim: i === 0 })));
        cols.appendChild(c);
    });

    const note = document.createElement('div');
    note.style.cssText = 'font-weight:bold;color:#8B90A0;font-size:.8rem;text-align:center;max-width:250px;';
    note.textContent = 'Seule la tête de colonne monte : la n°1 d’abord, la n°2 attend sur un siège.';

    ex.append(cols, note);
    row.style.flexDirection = 'column';
    row.append(ex);
}

// Solveur : la répartition en colonnes est-elle gagnable avec `seats` sièges ?
function _fouleSolvable(cols, seats) {
    const memo = new Set();
    function dfs(tops, bench, next) {
        // Embarquements automatiques depuis les sièges
        bench = bench.slice();
        let n = next;
        let changed = true;
        while (changed) {
            changed = false;
            const bi = bench.indexOf(n);
            if (bi !== -1) { bench.splice(bi, 1); n++; changed = true; }
        }
        const total = cols.reduce((a, c) => a + c.length, 0);
        if (n > total) return true;
        const key = tops.join(',') + '|' + bench.slice().sort((a, b) => a - b).join(',') + '|' + n;
        if (memo.has(key)) return false;
        memo.add(key);
        for (let i = 0; i < cols.length; i++) {
            if (tops[i] >= cols[i].length) continue;
            const v = cols[i][tops[i]];
            const t2 = tops.slice(); t2[i]++;
            if (v === n) {
                if (dfs(t2, bench, n + 1)) return true;
            } else if (bench.length < seats) {
                if (dfs(t2, bench.concat(v), n)) return true;
            }
        }
        return false;
    }
    return dfs(cols.map(() => 0), [], 1);
}

function startGameLaFoule() {
    board.style.display = 'flex';
    board.style.flexDirection = 'column';
    board.style.alignItems = 'center';
    board.style.gap = '14px';

    const TOTAL = 12, COLS = 4, SEATS = 3;
    let cols;
    for (let attempt = 0; attempt < 60; attempt++) {
        const order = Array.from({ length: TOTAL }, (_, i) => i + 1).sort(() => Math.random() - 0.5);
        cols = Array.from({ length: COLS }, () => []);
        order.forEach((v, i) => cols[i % COLS].push(v));
        if (_fouleSolvable(cols, SEATS)) break;
    }

    let tops = cols.map(() => 0);
    let bench = [];
    let next = 1;
    let over = false;

    const hud = document.createElement('div');
    hud.style.cssText = 'display:flex;gap:18px;font-weight:bold;color:#8B90A0;font-size:.95rem;';
    board.appendChild(hud);

    const busRow = document.createElement('div');
    busRow.style.cssText = 'display:flex;align-items:center;gap:8px;font-size:1.6rem;';
    board.appendChild(busRow);

    const crowd = document.createElement('div');
    crowd.style.cssText = 'display:flex;gap:16px;justify-content:center;align-items:flex-start;min-height:200px;';
    board.appendChild(crowd);

    const benchWrap = document.createElement('div');
    benchWrap.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:6px;';
    board.appendChild(benchWrap);

    function render() {
        hud.innerHTML = `<span>On attend la <b style="color:#4A6CFA">n°${next}</b></span>` +
            `<span>À bord : <b style="color:#34B871">${next - 1}/${TOTAL}</b></span>`;

        busRow.innerHTML = '';
        busRow.append('🚌');
        const boarded = document.createElement('span');
        boarded.style.cssText = 'font-weight:900;font-size:.9rem;color:#34B871;';
        boarded.textContent = next - 1 > 0 ? `${next - 1} à bord` : 'vide';
        busRow.appendChild(boarded);

        crowd.innerHTML = '';
        cols.forEach((col, i) => {
            const c = document.createElement('div');
            c.style.cssText = 'display:flex;flex-direction:column;gap:8px;align-items:center;';
            for (let k = col.length - 1; k >= tops[i]; k--) {
                const isHead = k === tops[i];
                const el = _foulePerso(col[k], isHead ? 56 : 46, { dim: !isHead });
                if (isHead) el.addEventListener('pointerdown', (e) => {
                    e.preventDefault();
                    if (isPaused || over) return;
                    pick(i);
                });
                c.appendChild(el);
            }
            if (tops[i] >= col.length) {
                const empty = document.createElement('div');
                empty.style.cssText = 'width:56px;height:56px;border-radius:50%;border:2px dashed #D8DCE8;';
                c.appendChild(empty);
            }
            crowd.appendChild(c);
        });

        benchWrap.innerHTML = '';
        const lbl = document.createElement('div');
        lbl.style.cssText = 'font-weight:bold;font-size:.72rem;letter-spacing:.14em;text-transform:uppercase;color:#8B90A0;';
        lbl.textContent = 'Sièges d’attente';
        const seatsRow = document.createElement('div');
        seatsRow.style.cssText = 'display:flex;gap:10px;';
        for (let s = 0; s < SEATS; s++) {
            if (s < bench.length) seatsRow.appendChild(_foulePerso(bench[s], 48));
            else {
                const empty = document.createElement('div');
                empty.style.cssText = 'width:48px;height:48px;border-radius:12px;border:2px dashed #C9D4FB;background:#F4F6FA;';
                seatsRow.appendChild(empty);
            }
        }
        benchWrap.append(lbl, seatsRow);
    }

    function flushBench() {
        let moved = true;
        while (moved) {
            moved = false;
            const bi = bench.indexOf(next);
            if (bi !== -1) { bench.splice(bi, 1); next++; moved = true; haptic(8); }
        }
    }

    function pick(i) {
        const v = cols[i][tops[i]];
        if (v === next) {
            tops[i]++;
            next++;
            haptic(10);
            flushBench();
        } else if (bench.length < SEATS) {
            tops[i]++;
            bench.push(v);
            haptic(8);
        } else {
            haptic(50);
            over = true;
            render();
            endGame(`Les sièges sont pleins et la n°${next} est introuvable — le bus est parti sans tout le monde.`, false);
            return;
        }
        render();
        if (next > TOTAL) {
            over = true;
            endGame('Tout le monde à bord, dans un ordre parfait !', true);
        }
    }

    render();
}
