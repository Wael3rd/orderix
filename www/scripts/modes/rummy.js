// ─── Mode : Suites ───────────────────────────────────────────────
// Inspiré de Rummikub : 9 tuiles = 3 suites de 3 valeurs consécutives,
// mélangées. Taper 3 tuiles ; si elles forment une suite (ordre de
// tap indifférent), elles se verrouillent en vert et s'alignent
// triées. Sinon : secousse rouge et −1 vie (2 vies). Les suites sont
// générées avec un écart d'au moins 2 pour éviter toute suite
// « à cheval » ambiguë.

function _rummyTileEl(val, small) {
    const t = document.createElement('div');
    const s = small ? 40 : 54;
    t.style.cssText = `width:${s}px;height:${s}px;border-radius:10px;background:#4A6CFA;color:#FFFFFF;` +
        `font-weight:900;font-size:${small ? '1rem' : '1.2rem'};display:flex;align-items:center;` +
        `justify-content:center;flex-shrink:0;user-select:none;touch-action:manipulation;` +
        `transition:transform .12s ease,box-shadow .12s ease;`;
    t.textContent = val;
    return t;
}

function showExampleRummy(day, row, vals) {
    const ex = document.createElement('div');
    ex.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:10px;margin:6px auto;';

    const grid = document.createElement('div');
    grid.style.cssText = 'display:flex;gap:8px;';
    [5, 9, 4, 6].forEach(v => {
        const t = _rummyTileEl(v, true);
        if (v !== 9) t.style.boxShadow = '0 0 0 3px #FFFFFF, 0 0 0 5px #F5B227';
        grid.appendChild(t);
    });

    const lbl = document.createElement('div');
    lbl.style.cssText = 'font-weight:bold;color:#8B90A0;font-size:.85rem;';
    lbl.textContent = '4 · 5 · 6 forment une suite ✓';

    ex.append(grid, lbl);
    row.style.flexDirection = 'column';
    row.append(ex);
}

function startGameRummy() {
    board.style.display = 'flex';
    board.style.flexDirection = 'column';
    board.style.alignItems = 'center';

    let lives = 2;
    // 3 suites disjointes, écart >= 2 entre elles (pas de suite à cheval possible)
    const s0 = 1 + Math.floor(Math.random() * 4);
    const s1 = s0 + 5 + Math.floor(Math.random() * 4);
    const s2 = s1 + 5 + Math.floor(Math.random() * 4);
    const runs = [s0, s1, s2].map(s => [s, s + 1, s + 2]);
    const tiles = runs.flat().map(v => ({ val: v, locked: false }));
    tiles.sort(() => Math.random() - 0.5);

    const lockedRuns = [];
    let selection = [];

    const hud = document.createElement('div');
    hud.style.cssText = 'display:flex;gap:18px;align-items:center;justify-content:center;font-weight:bold;color:#8B90A0;font-size:.95rem;margin-bottom:12px;';
    board.appendChild(hud);

    const lockedZone = document.createElement('div');
    lockedZone.style.cssText = 'display:flex;flex-direction:column;gap:8px;align-items:center;margin-bottom:14px;';
    board.appendChild(lockedZone);

    const grid = document.createElement('div');
    grid.style.cssText = 'display:flex;flex-wrap:wrap;gap:12px;justify-content:center;max-width:340px;';
    board.appendChild(grid);

    function renderHud() {
        hud.innerHTML = `<span>Suites <b style="color:#4A6CFA">${lockedRuns.length}/3</b></span>` +
            `<span style="color:#E0533D;letter-spacing:2px">${'♥'.repeat(lives)}${'♡'.repeat(2 - lives)}</span>`;
    }

    function renderLocked() {
        lockedZone.innerHTML = '';
        lockedRuns.forEach(run => {
            const rowEl = document.createElement('div');
            rowEl.style.cssText = 'display:flex;gap:6px;';
            run.forEach(v => {
                const t = _rummyTileEl(v, true);
                t.style.background = '#34B871';
                rowEl.appendChild(t);
            });
            lockedZone.appendChild(rowEl);
        });
    }

    function findValidRun(vals) {
        const sorted = [...vals].sort((a, b) => a - b);
        for (let i = 0; i + 2 < sorted.length; i++) {
            if (sorted[i + 1] === sorted[i] + 1 && sorted[i + 2] === sorted[i] + 2) {
                return [sorted[i], sorted[i + 1], sorted[i + 2]];
            }
        }
        return null;
    }

    function renderGrid() {
        grid.innerHTML = '';
        tiles.forEach(tile => {
            if (tile.locked) return;
            const t = _rummyTileEl(tile.val, false);
            tile.el = t;
            if (selection.includes(tile)) {
                t.style.boxShadow = '0 0 0 3px #FFFFFF, 0 0 0 6px #F5B227';
                t.style.transform = 'translateY(-4px)';
            }
            t.addEventListener('pointerdown', (e) => {
                e.preventDefault();
                if (isPaused || tile.locked) return;
                const already = selection.indexOf(tile);
                if (already >= 0) {
                    selection.splice(already, 1);
                    haptic(6);
                    renderGrid();
                    return;
                }
                selection.push(tile);
                haptic(6);
                if (selection.length < 3) { renderGrid(); return; }

                // 3e sélection : vérification automatique
                const vals = selection.map(s => s.val).sort((a, b) => a - b);
                if (vals[1] === vals[0] + 1 && vals[2] === vals[0] + 2) {
                    selection.forEach(s => { s.locked = true; });
                    lockedRuns.push(vals);
                    selection = [];
                    haptic([12, 40, 12]);
                    renderHud();
                    renderLocked();
                    renderGrid();
                    if (lockedRuns.length >= 3) {
                        endGame('Les trois suites sont reconstituées !', true);
                    }
                } else {
                    lives--;
                    haptic(50);
                    const wrong = [...selection];
                    selection = [];
                    wrong.forEach(s => {
                        if (!s.el) return;
                        s.el.style.animation = 'wobble .3s';
                        s.el.style.boxShadow = '0 0 0 3px #FFFFFF, 0 0 0 6px #E0533D';
                    });
                    renderHud();
                    if (lives <= 0) {
                        // Montre une suite valide restante avant de conclure
                        const remaining = tiles.filter(t2 => !t2.locked).map(t2 => t2.val);
                        const hint = findValidRun(remaining);
                        if (hint) {
                            tiles.forEach(t2 => {
                                if (!t2.locked && hint.includes(t2.val) && t2.el) {
                                    t2.el.style.animation = '';
                                    t2.el.style.boxShadow = '0 0 0 3px #FFFFFF, 0 0 0 6px #34B871';
                                }
                            });
                        }
                        endGame('Plus de vies — une suite valide est entourée en vert.', false);
                    } else {
                        setTimeout(() => { if (!isPaused) renderGrid(); }, 380);
                    }
                }
            });
            grid.appendChild(t);
        });
    }

    renderHud();
    renderGrid();
}
