// ─── Mode : Mémo Croissant (jour 7) ──────────────────────────────
// Remplace Dégradé — rejet en test sans détail exploitable, déjà un
// second remplacement pour ce créneau. Inspiré du jeu de mémoire
// (Concentration), très reconnaissable : retournez deux cartes à la
// fois pour trouver les paires, mais dans l'ordre croissant — la
// valeur recherchée est affichée en toutes lettres, jamais à deviner.

function _memoCarte(val, size, opts) {
    const o = opts || {};
    const el = document.createElement('div');
    const s = size || 54;
    el.style.cssText = `width:${s}px;height:${s}px;border-radius:10px;display:flex;align-items:center;justify-content:center;` +
        `font-weight:900;font-size:${Math.round(s * 0.4)}px;user-select:none;touch-action:manipulation;transition:transform .12s;` +
        (o.solved ? 'background:#E3F7ED;color:#1E7A4A;box-shadow:0 2px 0 #B7E4CB;'
            : o.up ? 'background:#4A6CFA;color:#fff;box-shadow:0 2px 0 #3553D1;'
                : 'background:#D8DCE8;color:transparent;box-shadow:0 2px 0 #C2C7D6;');
    el.textContent = (o.up || o.solved) ? val : '?';
    return el;
}

function showExampleMemoCroissant(day, row, vals) {
    const ex = document.createElement('div');
    ex.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:10px;margin:6px auto;';

    const target = document.createElement('div');
    target.style.cssText = 'font-weight:bold;color:#8B90A0;font-size:.85rem;';
    target.innerHTML = 'Cherchez la paire : <b style="color:#4A6CFA">2</b>';

    // Les 1 sont déjà trouvés (verts), une carte 2 vient d'être retournée
    const grid = document.createElement('div');
    grid.style.cssText = 'display:grid;grid-template-columns:repeat(3,34px);gap:5px;';
    [{ v: 1, solved: true }, { v: '', up: false }, { v: 2, up: true },
    { v: 1, solved: true }, { v: '', up: false }, { v: '', up: false }]
        .forEach(c => grid.appendChild(_memoCarte(c.v, 34, c)));

    const note = document.createElement('div');
    note.style.cssText = 'font-size:.78rem;color:#8B90A0;font-weight:bold;text-align:center;max-width:250px;';
    note.textContent = 'Les 1 sont déjà trouvés (verts). Retournez deux cartes pour chercher les 2.';

    ex.append(target, grid, note);
    row.style.flexDirection = 'column';
    row.append(ex);
}

function startGameMemoCroissant() {
    board.style.display = 'flex';
    board.style.flexDirection = 'column';
    board.style.alignItems = 'center';
    board.style.gap = '12px';

    // Retour #82 : grille 4×4 (8 paires) au lieu de 3×4 (6 paires)
    const PAIRS = 8, COLS = 4;
    const pool = [];
    for (let v = 1; v <= PAIRS; v++) pool.push(v, v);
    const cells = pool.sort(() => Math.random() - 0.5);

    // Retour #62 : plus de vies — la mémoire se travaille sans punition,
    // seul le chrono départage.
    const solved = cells.map(() => false);
    let up = []; // indices actuellement retournés (0, 1 ou 2 pendant la comparaison)
    let lock = false;
    let next = 1;
    let over = false;

    const hud = document.createElement('div');
    hud.style.cssText = 'display:flex;gap:18px;font-weight:bold;color:#8B90A0;font-size:.95rem;';
    board.appendChild(hud);

    const grid = document.createElement('div');
    grid.style.cssText = `display:grid;grid-template-columns:repeat(${COLS},56px);gap:8px;`;
    board.appendChild(grid);

    function render() {
        hud.innerHTML = `<span>Cherchez la paire : <b style="color:#4A6CFA">${next}</b></span>` +
            `<span>Trouvées : <b style="color:#34B871">${next - 1}/${PAIRS}</b></span>`;
        grid.innerHTML = '';
        cells.forEach((v, i) => {
            const el = _memoCarte(v, 56, { solved: solved[i], up: up.includes(i) });
            if (!solved[i] && !lock) el.addEventListener('pointerdown', e => { e.preventDefault(); tap(i); });
            grid.appendChild(el);
        });
    }

    function tap(i) {
        if (isPaused || over || lock || solved[i] || up.includes(i)) return;
        up.push(i);
        haptic(8);
        render();
        if (up.length < 2) return;

        lock = true;
        const [a, b] = up;
        setTimeout(() => {
            if (isPaused) { lock = false; return; }
            if (cells[a] === cells[b]) {
                if (cells[a] === next) {
                    solved[a] = true; solved[b] = true;
                    next++;
                    haptic([10, 30, 10]);
                    up = []; lock = false; render();
                    if (next > PAIRS) {
                        over = true;
                        endGame('Toutes les paires retrouvées, dans l’ordre !', true);
                    }
                } else {
                    // Bonne paire, mais pas encore son tour : on mémorise, pas de vie perdue
                    haptic(15);
                    up = []; lock = false; render();
                }
            } else {
                // Paire manquée : on mémorise et on continue, sans pénalité
                haptic(30);
                up = []; lock = false; render();
            }
        }, 700);
    }

    render();
}
