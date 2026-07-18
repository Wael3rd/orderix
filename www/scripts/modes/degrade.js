// ─── Mode : Dégradé (jour 7) ─────────────────────────────────────
// Inspiré d'I Love Hue / Color Puzzle (genre culte auprès des 35+).
// Une grille de tuiles issues d'un dégradé 2D parfait, mélangées :
// échangez deux tuiles pour reconstituer le dégradé. Les coins
// (marqués d'un point) sont fixes. Budget d'échanges généreux mais
// limité. Ordonner des couleurs dans l'espace — l'ADN d'Orderix.

function showExampleDegrade(day, row, vals) {
    const ex = document.createElement('div');
    ex.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:10px;margin:6px auto;';

    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;gap:16px;align-items:center;';
    const mk = (shuffled) => {
        const g = document.createElement('div');
        g.style.cssText = 'display:grid;grid-template-columns:repeat(3,26px);gap:3px;';
        const cells = [];
        for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) {
            cells.push(`hsl(${200 + c * 25 + r * 12}, ${60 + r * 10}%, ${65 - r * 12}%)`);
        }
        const order = shuffled ? [0, 5, 2, 3, 4, 1, 6, 7, 8] : [0, 1, 2, 3, 4, 5, 6, 7, 8];
        order.forEach(i => {
            const t = document.createElement('div');
            t.style.cssText = `width:26px;height:26px;border-radius:5px;background:${cells[i]};`;
            g.appendChild(t);
        });
        return g;
    };
    const arrow = document.createElement('span');
    arrow.style.cssText = 'font-weight:900;color:#8B90A0;font-size:1.2rem;';
    arrow.textContent = '→';
    wrap.append(mk(true), arrow, mk(false));

    const note = document.createElement('div');
    note.style.cssText = 'font-weight:bold;color:#8B90A0;font-size:.8rem;text-align:center;max-width:250px;';
    note.textContent = 'Échangez les tuiles jusqu’à ce que le dégradé coule parfaitement.';

    ex.append(wrap, note);
    row.style.flexDirection = 'column';
    row.append(ex);
}

function startGameDegrade() {
    board.style.display = 'flex';
    board.style.flexDirection = 'column';
    board.style.alignItems = 'center';
    board.style.gap = '12px';

    const C = 4, R = 5, TILE = 64, GAP = 5;

    // Dégradé 2D : 4 couleurs de coins interpolées bilinéairement (en RGB).
    // Retour #52 (« impossible ») : teintes des coins resserrées (span ~110°)
    // pour un dégradé lisible et progressif, sans couleurs parasites.
    const baseHue = Math.floor(Math.random() * 360);
    const corners = [
        `hsl(${baseHue}, 75%, 68%)`,
        `hsl(${(baseHue + 40) % 360}, 72%, 55%)`,
        `hsl(${(baseHue + 70) % 360}, 62%, 40%)`,
        `hsl(${(baseHue + 110) % 360}, 68%, 50%)`
    ].map(h => {
        // hsl → rgb via un élément fantôme n'est pas fiable en jsdom : conversion manuelle
        const m = h.match(/hsl\((\d+), (\d+)%, (\d+)%\)/);
        const [hh, ss, ll] = [+m[1] / 360, +m[2] / 100, +m[3] / 100];
        const q = ll < 0.5 ? ll * (1 + ss) : ll + ss - ll * ss;
        const p = 2 * ll - q;
        const f = t => {
            if (t < 0) t += 1; if (t > 1) t -= 1;
            if (t < 1 / 6) return p + (q - p) * 6 * t;
            if (t < 1 / 2) return q;
            if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
            return p;
        };
        return [f(hh + 1 / 3), f(hh), f(hh - 1 / 3)].map(x => Math.round(x * 255));
    });

    function colorAt(r, c) {
        const u = c / (C - 1), v = r / (R - 1);
        const mix = (i) => Math.round(
            corners[0][i] * (1 - u) * (1 - v) + corners[1][i] * u * (1 - v) +
            corners[2][i] * (1 - u) * v + corners[3][i] * u * v);
        return `rgb(${mix(0)}, ${mix(1)}, ${mix(2)})`;
    }

    // perm[pos] = indice de la tuile actuellement à cette position.
    // Retour #52 : toute la BORDURE est fixe — seules les 6 tuiles du
    // centre sont mélangées. Abordable, mais l'œil doit encore juger.
    const N = C * R;
    const fixed = new Set();
    for (let i = 0; i < N; i++) {
        const r = Math.floor(i / C), c = i % C;
        if (r === 0 || r === R - 1 || c === 0 || c === C - 1) fixed.add(i);
    }
    const free = [];
    for (let i = 0; i < N; i++) if (!fixed.has(i)) free.push(i);

    const perm = Array.from({ length: N }, (_, i) => i);
    let shuffledFree;
    do {
        shuffledFree = [...free].sort(() => Math.random() - 0.5);
    } while (shuffledFree.every((v, k) => v === free[k]));
    free.forEach((pos, k) => { perm[pos] = shuffledFree[k]; });

    function minSwaps() {
        const seen = new Set();
        let cycles = 0, misplaced = 0;
        for (const pos of free) {
            if (perm[pos] !== pos) misplaced++;
            if (seen.has(pos) || perm[pos] === pos) continue;
            cycles++;
            let j = pos;
            while (!seen.has(j)) { seen.add(j); j = perm[j]; }
        }
        return [misplaced - cycles, misplaced];
    }
    let budget = minSwaps()[0] + Math.max(3, Math.ceil(minSwaps()[0] * 0.75));
    let selected = -1;
    let over = false;

    const hud = document.createElement('div');
    hud.style.cssText = 'display:flex;gap:18px;font-weight:bold;color:#8B90A0;font-size:.95rem;';
    board.appendChild(hud);

    const grid = document.createElement('div');
    grid.style.cssText = `display:grid;grid-template-columns:repeat(${C},${TILE}px);gap:${GAP}px;`;
    board.appendChild(grid);

    function render() {
        const [, misplaced] = minSwaps();
        hud.innerHTML = `<span>Mal placées : <b style="color:${misplaced ? '#E0533D' : '#34B871'}">${misplaced}</b></span>` +
            `<span>Échanges restants : <b style="color:${budget <= 2 ? '#E0533D' : '#4A6CFA'}">${budget}</b></span>`;

        grid.innerHTML = '';
        for (let pos = 0; pos < N; pos++) {
            const p = pos;
            const tileIdx = perm[pos];
            const el = document.createElement('div');
            el.style.cssText = `width:${TILE}px;height:${TILE}px;border-radius:10px;position:relative;` +
                `background:${colorAt(Math.floor(tileIdx / C), tileIdx % C)};user-select:none;` +
                'touch-action:manipulation;transition:transform .12s,box-shadow .12s;';
            if (fixed.has(pos)) {
                const dot = document.createElement('div');
                dot.style.cssText = 'position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);' +
                    'width:6px;height:6px;border-radius:50%;background:rgba(255,255,255,.65);';
                el.appendChild(dot);
            } else {
                if (selected === pos) el.style.cssText += 'box-shadow:0 0 0 3px #FFFFFF, 0 0 0 6px #F5B227;transform:scale(1.06);z-index:5;';
                el.addEventListener('pointerdown', (e) => {
                    e.preventDefault();
                    if (isPaused || over) return;
                    tap(p);
                });
            }
            grid.appendChild(el);
        }
    }

    function tap(pos) {
        if (selected === -1) { selected = pos; haptic(8); render(); return; }
        if (selected === pos) { selected = -1; render(); return; }
        const t = perm[selected]; perm[selected] = perm[pos]; perm[pos] = t;
        selected = -1;
        budget--;
        haptic(10);
        render();
        const [, misplaced] = minSwaps();
        if (misplaced === 0) {
            over = true;
            endGame('Le dégradé coule parfaitement — quel œil !', true);
        } else if (budget <= 0) {
            over = true;
            // Révèle la solution : remet chaque tuile à sa place
            for (let i = 0; i < N; i++) perm[i] = i;
            render();
            endGame('Plus d’échanges — voici le dégradé qu’il fallait retrouver.', false);
        }
    }

    render();
}
