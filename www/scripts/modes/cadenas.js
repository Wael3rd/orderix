// ─── Mode : Le Cadenas (jour 6) ──────────────────────────────────
// Remplace Le Sommet (TriPeaks) — deux retours « incompréhensible »
// malgré le correctif #51. Inspiré du cadenas à combinaison / cryptex :
// chaque molette défile en boucle sur les mêmes valeurs, dans le même
// ordre pour toutes ; il suffit de la faire tourner (▲/▼) jusqu'à ce
// que sa valeur cible apparaisse. Toujours résoluble par construction,
// zéro notion de case « bloquée ».

function showExampleCadenas(day, row, vals) {
    const ex = document.createElement('div');
    ex.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:10px;margin:6px auto;';

    const mini = document.createElement('div');
    mini.style.cssText = 'display:flex;gap:8px;align-items:center;';
    [3, 1, 4].forEach((v, i) => {
        const col = document.createElement('div');
        col.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:3px;';
        const up = document.createElement('div');
        up.textContent = '▲'; up.style.cssText = 'color:#8B90A0;font-size:.7rem;font-weight:900;';
        const cell = document.createElement('div');
        cell.style.cssText = 'width:34px;height:34px;border-radius:8px;background:#4A6CFA;color:#fff;font-weight:900;' +
            'display:flex;align-items:center;justify-content:center;font-size:1rem;';
        cell.textContent = v;
        if (i === 1) cell.style.cssText += 'background:#34B871;box-shadow:0 0 0 2px #FFFFFF, 0 0 0 4px #34B871;';
        const dn = document.createElement('div');
        dn.textContent = '▼'; dn.style.cssText = up.style.cssText;
        col.append(up, cell, dn);
        mini.appendChild(col);
    });

    const note = document.createElement('div');
    note.style.cssText = 'font-weight:bold;color:#8B90A0;font-size:.8rem;text-align:center;max-width:250px;';
    note.textContent = 'Tournez chaque molette pour former la suite croissante sur la ligne du milieu.';

    ex.append(mini, note);
    row.style.flexDirection = 'column';
    row.append(ex);
}

function startGameCadenas() {
    board.style.display = 'flex';
    board.style.flexDirection = 'column';
    board.style.alignItems = 'center';
    board.style.gap = '16px';

    const N = 5;
    // N valeurs uniques, croissantes : la molette i doit finir sur target[i]
    const pool = new Set();
    while (pool.size < N) pool.add(1 + Math.floor(Math.random() * 30));
    const target = [...pool].sort((a, b) => a - b);

    // Chaque molette démarre décalée d'au moins un cran de sa position gagnante
    const pos = target.map((_, i) => {
        let p;
        do { p = Math.floor(Math.random() * N); } while (p === i);
        return p;
    });
    let over = false;

    const hud = document.createElement('div');
    hud.style.cssText = 'font-weight:bold;color:#8B90A0;font-size:.9rem;text-align:center;';
    board.appendChild(hud);

    const rack = document.createElement('div');
    rack.style.cssText = 'display:flex;gap:10px;justify-content:center;flex-wrap:wrap;';
    board.appendChild(rack);

    function isWin() { return pos.every((p, i) => p === i); }

    function render() {
        const done = pos.filter((p, i) => p === i).length;
        hud.innerHTML = `Molettes alignées : <b style="color:#4A6CFA">${done}/${N}</b>`;

        rack.innerHTML = '';
        pos.forEach((p, i) => {
            const col = document.createElement('div');
            col.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:6px;';

            const aligned = p === i;
            const btnStyle = 'width:44px;height:34px;border:none;border-radius:8px;background:#EEF2FF;color:#3553D1;' +
                'font-weight:900;font-size:1rem;touch-action:manipulation;';

            const up = document.createElement('button');
            up.textContent = '▲'; up.style.cssText = btnStyle;
            up.addEventListener('pointerdown', e => { e.preventDefault(); spin(i, 1); });

            const cell = document.createElement('div');
            cell.style.cssText = 'width:56px;height:56px;border-radius:10px;display:flex;align-items:center;justify-content:center;' +
                'font-weight:900;font-size:1.35rem;transition:transform .12s;' +
                (aligned ? 'background:#34B871;color:#fff;box-shadow:0 3px 0 #1E7A4A;'
                    : 'background:#4A6CFA;color:#fff;box-shadow:0 3px 0 #3553D1;');
            cell.textContent = target[p];

            const dn = document.createElement('button');
            dn.textContent = '▼'; dn.style.cssText = btnStyle;
            dn.addEventListener('pointerdown', e => { e.preventDefault(); spin(i, -1); });

            col.append(up, cell, dn);
            rack.appendChild(col);
        });
    }

    function spin(i, dir) {
        if (isPaused || over) return;
        pos[i] = (pos[i] + dir + N) % N;
        haptic(8);
        render();
        if (isWin()) {
            over = true;
            haptic([18, 40, 24]);
            endGame('Cadenas ouvert — toutes les molettes sont alignées !', true);
        }
    }

    render();
}
