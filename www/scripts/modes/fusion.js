// ─── Mode : Fusion ───────────────────────────────────────────────
// Inspiré de 2248 : grille 4×4 de tuiles-nombres. Taper des tuiles
// adjacentes pour construire une chaîne strictement consécutive
// croissante (2→3→4…), puis valider (re-taper la dernière tuile ou
// bouton « Fusionner ») : la chaîne disparaît sauf la dernière tuile
// qui devient valeur finale + 1. Gravité par colonne, nouvelles
// tuiles en haut. Budget : 22 fusions. Victoire : une tuile ≥ 8.

function _fusionTileColor(v) {
    const shades = ['#EEF2FF', '#DBE3FD', '#C4D1FB', '#A9BCF9', '#8CA3F7', '#6F8CF4', '#4A6CFA', '#3553D1'];
    const i = Math.min(Math.max(v, 1), 8) - 1;
    return { bg: shades[i], fg: v >= 5 ? '#FFFFFF' : '#23262F' };
}

function _fusionNewValue() {
    // 1..4 pondéré vers les petites valeurs
    const pool = [1, 1, 1, 1, 2, 2, 2, 3, 3, 4];
    return pool[Math.floor(Math.random() * pool.length)];
}

function showExampleFusion(day, row, vals) {
    const ex = document.createElement('div');
    ex.style.cssText = 'display:flex;gap:10px;justify-content:center;align-items:center;margin:6px auto;font-weight:900;color:#8B90A0;';
    [2, 3, 4].forEach(v => {
        const col = _fusionTileColor(v);
        const t = document.createElement('div');
        t.style.cssText = `width:46px;height:46px;border-radius:10px;background:${col.bg};color:${col.fg};` +
            'display:flex;align-items:center;justify-content:center;font-weight:900;font-size:1.1rem;flex-shrink:0;' +
            'box-shadow:0 0 0 2px #FFFFFF, 0 0 0 4px #4A6CFA;';
        t.textContent = v;
        ex.appendChild(t);
    });
    const arrow = document.createElement('span');
    arrow.textContent = '→';
    arrow.style.fontSize = '1.2rem';
    ex.appendChild(arrow);
    const res = _fusionTileColor(5);
    const t5 = document.createElement('div');
    t5.style.cssText = `width:46px;height:46px;border-radius:10px;background:${res.bg};color:${res.fg};` +
        'display:flex;align-items:center;justify-content:center;font-weight:900;font-size:1.1rem;flex-shrink:0;';
    t5.textContent = '5';
    ex.appendChild(t5);
    row.style.flexDirection = 'column';
    row.append(ex);
}

function startGameFusion() {
    board.style.display = 'flex';
    board.style.flexDirection = 'column';
    board.style.alignItems = 'center';

    const SIZE = 4;
    const BUDGET = 22;
    const TARGET = 8;
    let fusions = 0;
    let best = 0;
    let chain = []; // indices (r * SIZE + c)
    const cells = [];
    for (let i = 0; i < SIZE * SIZE; i++) cells.push(_fusionNewValue());
    best = Math.max(...cells);

    const hud = document.createElement('div');
    hud.style.cssText = 'display:flex;gap:18px;align-items:center;justify-content:center;font-weight:bold;color:#8B90A0;font-size:.95rem;margin-bottom:10px;';
    board.appendChild(hud);

    const chainLabel = document.createElement('div');
    chainLabel.style.cssText = 'min-height:22px;font-weight:900;font-size:.95rem;color:#4A6CFA;margin-bottom:8px;text-align:center;';
    board.appendChild(chainLabel);

    const grid = document.createElement('div');
    grid.style.cssText = `display:grid;grid-template-columns:repeat(${SIZE}, 64px);gap:8px;margin-bottom:16px;`;
    board.appendChild(grid);

    const fuseBtn = document.createElement('button');
    fuseBtn.textContent = 'Fusionner';
    fuseBtn.style.cssText = 'min-width:200px;padding:13px 24px;border-radius:999px;border:none;' +
        'font-weight:900;font-size:1rem;background:#4A6CFA;color:#FFFFFF;transition:transform .1s;' +
        'touch-action:manipulation;';
    board.appendChild(fuseBtn);

    function renderHud() {
        hud.innerHTML = `<span>Fusions <b style="color:#4A6CFA">${fusions}/${BUDGET}</b></span>` +
            `<span>Meilleure tuile <b style="color:#F5B227">${best}</b></span>` +
            `<span>Objectif <b style="color:#34B871">${TARGET}</b></span>`;
    }

    function updateFuseBtn() {
        const ok = chain.length >= 2;
        fuseBtn.style.background = ok ? '#4A6CFA' : '#C9D4FB';
        fuseBtn.style.pointerEvents = ok ? '' : 'none';
    }

    function renderChainLabel() {
        if (chain.length === 0) { chainLabel.textContent = ''; return; }
        const seq = chain.map(i => cells[i]).join(' → ');
        chainLabel.textContent = chain.length >= 2
            ? `${seq} = ${cells[chain[chain.length - 1]] + 1}`
            : seq + ' …';
    }

    function render(withGravityAnim) {
        grid.innerHTML = '';
        for (let i = 0; i < SIZE * SIZE; i++) {
            const v = cells[i];
            const col = _fusionTileColor(v);
            const tile = document.createElement('div');
            tile.style.cssText = `width:64px;height:64px;border-radius:12px;background:${col.bg};color:${col.fg};` +
                'display:flex;align-items:center;justify-content:center;font-weight:900;font-size:1.35rem;' +
                'user-select:none;touch-action:manipulation;transition:transform .12s;';
            tile.textContent = v;
            const pos = chain.indexOf(i);
            if (pos !== -1) {
                tile.style.boxShadow = '0 0 0 3px #FFFFFF, 0 0 0 6px #4A6CFA';
                tile.style.transform = 'scale(1.08)';
            }
            if (withGravityAnim) tile.classList.add('gravity-anim');
            tile.addEventListener('click', () => tapTile(i));
            grid.appendChild(tile);
        }
        renderChainLabel();
        updateFuseBtn();
    }

    function adjacent(a, b) {
        const ra = Math.floor(a / SIZE), ca = a % SIZE;
        const rb = Math.floor(b / SIZE), cb = b % SIZE;
        return Math.abs(ra - rb) + Math.abs(ca - cb) === 1;
    }

    function tapTile(i) {
        if (isPaused) return;
        const last = chain[chain.length - 1];

        if (chain.length && i === last) {
            if (chain.length >= 2) { doFusion(); return; }
            chain = []; // taper l'unique tuile sélectionnée la désélectionne
        } else if (chain.indexOf(i) !== -1) {
            chain = [i]; // tuile déjà dans la chaîne (pas la dernière) : on repart d'elle
        } else if (chain.length === 0) {
            chain = [i];
        } else if (adjacent(last, i) && cells[i] === cells[last] + 1) {
            chain.push(i);
            haptic(6);
        } else {
            // Non adjacente ou non consécutive : la chaîne se réinitialise (pas de pénalité)
            chain = [i];
        }
        render(false);
    }

    function doFusion() {
        const last = chain[chain.length - 1];
        const newVal = cells[last] + 1;
        fusions++;
        haptic([10, 30, 10]);

        // La dernière tuile devient valeur finale + 1, les autres disparaissent
        const removed = new Set(chain.slice(0, -1));
        cells[last] = newVal;
        best = Math.max(best, newVal);
        chain = [];

        // Gravité par colonne + nouvelles tuiles en haut
        for (let c = 0; c < SIZE; c++) {
            const kept = [];
            for (let r = 0; r < SIZE; r++) {
                const idx = r * SIZE + c;
                if (!removed.has(idx)) kept.push(cells[idx]);
            }
            while (kept.length < SIZE) kept.unshift(_fusionNewValue());
            for (let r = 0; r < SIZE; r++) cells[r * SIZE + c] = kept[r];
        }

        render(true);
        renderHud();

        if (newVal >= TARGET) {
            endGame(`Tuile ${newVal} créée — fusion magistrale !`, true);
        } else if (fusions >= BUDGET) {
            endGame(`Budget épuisé — meilleure tuile atteinte : ${best}.`, false);
        }
    }

    fuseBtn.addEventListener('click', () => {
        if (isPaused || chain.length < 2) return;
        doFusion();
    });

    renderHud();
    render(false);
    updateFuseBtn();
}
