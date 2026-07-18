// ─── Mode : Le Taquin ────────────────────────────────────────────
// Le 15-puzzle classique en version 3×3 : huit tuiles numérotées et
// une case vide. On fait glisser les tuiles voisines du vide pour
// remettre 1..8 dans l'ordre de lecture, case vide en bas à droite.
// Le mélange part de la position résolue et applique 80 coups
// valides : la grille est donc toujours solvable.

// Mélange par coups légaux depuis la position résolue (jamais résolu à l'arrivée).
// cells[position] = valeur de la tuile (0 = case vide).
function _taquinMelanger() {
    let cells;
    do {
        cells = [1, 2, 3, 4, 5, 6, 7, 8, 0];
        let precedent = -1; // ancienne position du vide : interdit d'annuler le coup
        for (let k = 0; k < 80; k++) {
            const b = cells.indexOf(0);
            const rb = Math.floor(b / 3), cb = b % 3;
            const opts = [];
            if (rb > 0) opts.push(b - 3);
            if (rb < 2) opts.push(b + 3);
            if (cb > 0) opts.push(b - 1);
            if (cb < 2) opts.push(b + 1);
            const choix = opts.filter(p => p !== precedent);
            const p = choix[Math.floor(Math.random() * choix.length)];
            cells[b] = cells[p];
            cells[p] = 0;
            precedent = b;
        }
    } while (cells.every((v, i) => v === (i + 1) % 9));
    return cells;
}

function showExampleTaquin(day, row, vals) {
    const ex = document.createElement('div');
    ex.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:8px;margin:6px auto;';

    // Mini-grille presque rangée : le vide au milieu à droite, le 6 en dessous
    const mini = document.createElement('div');
    mini.style.cssText = 'display:grid;grid-template-columns:repeat(3,32px);gap:5px;' +
        'background:#ECEEF4;border-radius:9px;padding:6px;';
    const cellules = [1, 2, 3, 4, 5, 0, 7, 8, 6];
    cellules.forEach((v, i) => {
        const t = document.createElement('div');
        if (v === 0) {
            t.style.cssText = 'width:32px;height:32px;border-radius:7px;background:#DDE1EB;';
        } else {
            t.style.cssText = 'position:relative;width:32px;height:32px;border-radius:7px;background:#4A6CFA;' +
                'color:#FFFFFF;font-weight:900;font-size:.85rem;display:flex;align-items:center;justify-content:center;';
            t.textContent = v;
            if (i === 8) {
                // Le 6 glisse vers le haut, dans la case vide
                const fleche = document.createElement('span');
                fleche.style.cssText = 'position:absolute;top:-4px;right:-3px;font-size:.7rem;' +
                    'font-weight:900;color:#F5B227;text-shadow:0 1px 2px rgba(35,38,47,.35);';
                fleche.textContent = '↑';
                t.appendChild(fleche);
            }
        }
        mini.appendChild(t);
    });

    const note = document.createElement('div');
    note.style.cssText = 'font-size:.78rem;color:#8B90A0;font-weight:bold;text-align:center;';
    note.textContent = 'Tapez une tuile voisine du vide : elle glisse dedans';

    ex.append(mini, note);
    row.style.flexDirection = 'column';
    row.append(ex);
}

function startGameTaquin() {
    board.style.display = 'flex';
    board.style.flexDirection = 'column';
    board.style.alignItems = 'center';

    const TUILE = 96, ECART = 8;
    const COTE = 3 * TUILE + 4 * ECART; // 320 px : tient en 390 px de large

    const hud = document.createElement('div');
    hud.style.cssText = 'font-weight:900;color:#23262F;font-size:1.15rem;margin-bottom:12px;text-align:center;';
    board.appendChild(hud);

    const plateau = document.createElement('div');
    plateau.style.cssText = 'position:relative;width:' + COTE + 'px;height:' + COTE + 'px;' +
        'background:#ECEEF4;border-radius:16px;touch-action:manipulation;';
    board.appendChild(plateau);

    const astuce = document.createElement('div');
    astuce.style.cssText = 'font-size:.85rem;color:#8B90A0;font-style:italic;margin-top:12px;text-align:center;max-width:300px;';
    astuce.textContent = '« Une tuile alignée avec le vide pousse ses voisines d’un cran. »';
    board.appendChild(astuce);

    let cells = _taquinMelanger(); // cells[position] = valeur (0 = vide)
    let coups = 0;
    let fini = false;

    // Une seule tuile DOM par valeur : le glissement est une transition left/top
    const tuiles = {};
    for (let v = 1; v <= 8; v++) {
        const t = document.createElement('div');
        t.style.cssText = 'position:absolute;width:' + TUILE + 'px;height:' + TUILE + 'px;' +
            'border-radius:14px;background:#4A6CFA;color:#FFFFFF;font-weight:900;font-size:2.1rem;' +
            'display:flex;align-items:center;justify-content:center;' +
            'box-shadow:0 3px 8px rgba(35,38,47,.18);user-select:none;touch-action:manipulation;' +
            'transition:left .12s ease,top .12s ease;';
        t.textContent = v;
        t.addEventListener('pointerdown', e => { e.preventDefault(); tap(v); });
        plateau.appendChild(t);
        tuiles[v] = t;
    }

    function renderHud() {
        hud.innerHTML = 'Coups : <b style="color:#4A6CFA">' + coups + '</b>';
    }

    function render() {
        renderHud();
        cells.forEach((v, i) => {
            if (v === 0) return;
            const t = tuiles[v];
            t.style.left = (ECART + (i % 3) * (TUILE + ECART)) + 'px';
            t.style.top = (ECART + Math.floor(i / 3) * (TUILE + ECART)) + 'px';
            // Tuile à sa place définitive : liseré vert
            if (v === i + 1) {
                t.style.boxShadow = '0 3px 8px rgba(35,38,47,.18), inset 0 0 0 3px #34B871';
                t.style.background = '#4A6CFA linear-gradient(rgba(52,184,113,.22),rgba(52,184,113,.22))';
            } else {
                t.style.boxShadow = '0 3px 8px rgba(35,38,47,.18)';
                t.style.background = '#4A6CFA';
            }
        });
    }

    function estRange() {
        return cells.every((v, i) => v === (i + 1) % 9);
    }

    function tap(v) {
        if (isPaused || fini) return;
        const i = cells.indexOf(v);
        const b = cells.indexOf(0);
        const ri = Math.floor(i / 3), ci = i % 3;
        const rb = Math.floor(b / 3), cb = b % 3;
        if (ri !== rb && ci !== cb) return; // ni même ligne ni même colonne
        const dist = Math.abs(ri - rb) + Math.abs(ci - cb);
        if (dist < 1 || dist > 2) return;

        // On pousse la (ou les) tuile(s) entre le vide et celle tapée, d'un cran
        // vers le vide. Le pas va du vide vers la tuile tapée.
        const pas = (Math.sign(ri - rb) * 3) + Math.sign(ci - cb);
        let vide = b;
        while (vide !== i) {
            const suivant = vide + pas;
            cells[vide] = cells[suivant];
            cells[suivant] = 0;
            vide = suivant;
            coups++;
        }
        haptic(8);
        render();

        if (estRange()) {
            fini = true;
            haptic([12, 40, 12]);
            endGame('Bravo ! Tout est dans l\'ordre en ' + coups + ' coups !', true);
        }
    }

    render();
}
