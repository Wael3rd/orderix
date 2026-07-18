// ─── Mode : Le Code (jour 6) ─────────────────────────────────────
// Façon Wordle avec une combinaison à trouver (retour #61 : « on garde
// ceux qui sont bons, on dit ce qui est pas bon du tout et ce qui est
// pas bon mais quand même existant »).
// Code secret de 4 chiffres DISTINCTS parmi 1..8 · 6 essais.
// Après validation : VERT = bien placé, OR = présent mais mal placé,
// GRIS = absent. Le pavé de touches mémorise ce qu'on sait déjà.

const _CODE_LEN = 4;      // longueur du code
const _CODE_MAX = 8;      // chiffres de 1 à 8
const _CODE_TRIES = 6;    // nombre d'essais

// Couleurs des trois états (façon Wordle)
const _CODE_COLORS = {
    good:   { bg: '#34B871', fg: '#FFFFFF' },  // bien placé
    almost: { bg: '#F5B227', fg: '#FFFFFF' },  // présent, mal placé
    absent: { bg: '#D8DCE8', fg: '#9AA0AE' }   // absent du code
};

// Une case de la grille (chiffre coloré, ou vide en pointillés)
function _codeCell(digit, state, size) {
    const s = size || 48;
    const el = document.createElement('div');
    el.style.cssText = `width:${s}px;height:${s}px;border-radius:10px;flex-shrink:0;` +
        'display:flex;align-items:center;justify-content:center;user-select:none;' +
        `font-weight:900;font-size:${Math.round(s * 0.45)}px;box-sizing:border-box;`;
    if (digit === null) {
        // Case vide en pointillés
        el.style.cssText += 'background:transparent;border:2px dashed #D8DCE8;color:#8B90A0;';
    } else if (state) {
        const c = _CODE_COLORS[state];
        el.style.cssText += `background:${c.bg};color:${c.fg};box-shadow:0 1px 3px rgba(35,38,47,.12);`;
    } else {
        // Chiffre saisi mais pas encore validé
        el.style.cssText += 'background:#FFFFFF;border:2px solid #4A6CFA;color:#23262F;' +
            'box-shadow:0 1px 3px rgba(35,38,47,.12);';
        el.textContent = digit;
        return el;
    }
    if (digit !== null) el.textContent = digit;
    return el;
}

function showExampleCode(day, row, vals) {
    const ex = document.createElement('div');
    ex.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:8px;margin:6px auto;';

    // Un essai d'exemple avec les 3 couleurs
    const line = document.createElement('div');
    line.style.cssText = 'display:flex;gap:8px;';
    line.append(
        _codeCell(3, 'good', 36),
        _codeCell(7, 'almost', 36),
        _codeCell(1, 'absent', 36),
        _codeCell(5, 'good', 36)
    );

    const note = document.createElement('div');
    note.style.cssText = 'font-weight:bold;color:#8B90A0;font-size:.78rem;text-align:center;max-width:270px;';
    note.textContent = 'Vert : bien placé · Or : présent mais mal placé · Gris : absent. Trouvez le code en 6 essais.';

    ex.append(line, note);
    row.style.flexDirection = 'column';
    row.append(ex);
}

function startGameCode() {
    board.style.display = 'flex';
    board.style.flexDirection = 'column';
    board.style.alignItems = 'center';
    board.style.gap = '12px';

    // Code secret : 4 chiffres distincts parmi 1..8
    const pool = [];
    for (let d = 1; d <= _CODE_MAX; d++) pool.push(d);
    for (let i = pool.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    const secret = pool.slice(0, _CODE_LEN);

    let essai = 0;          // index de l'essai en cours (0..5)
    let current = [];       // chiffres saisis pour l'essai en cours
    let finished = false;
    const keyState = {};    // état connu de chaque touche : 'good' | 'almost' | 'absent'
    const _RANK = { absent: 1, almost: 2, good: 3 }; // vert > or > gris

    // ── HUD « Essai N/6 » ────────────────────────────────────────
    const hud = document.createElement('div');
    hud.style.cssText = 'font-weight:bold;color:#8B90A0;font-size:.95rem;';
    board.appendChild(hud);
    function renderHud() {
        hud.innerHTML = `Essai <b style="color:#4A6CFA">${Math.min(essai + 1, _CODE_TRIES)}/${_CODE_TRIES}</b>`;
    }
    renderHud();

    // ── Grille des essais : 6 lignes × 4 cases ───────────────────
    const grid = document.createElement('div');
    grid.style.cssText = 'display:flex;flex-direction:column;gap:8px;';
    board.appendChild(grid);
    const rows = []; // [{el, cells:[digit|null], states:[state|null]}]
    for (let r = 0; r < _CODE_TRIES; r++) {
        const line = document.createElement('div');
        line.style.cssText = 'display:flex;gap:8px;';
        grid.appendChild(line);
        rows.push({ el: line, cells: [null, null, null, null], states: [null, null, null, null] });
    }

    function renderRow(r) {
        const row = rows[r];
        row.el.innerHTML = '';
        for (let i = 0; i < _CODE_LEN; i++) {
            row.el.appendChild(_codeCell(row.cells[i], row.states[i]));
        }
    }
    for (let r = 0; r < _CODE_TRIES; r++) renderRow(r);

    // ── Pavé de touches 1..8 + ⌫ + Valider ───────────────────────
    const pad = document.createElement('div');
    pad.style.cssText = 'display:flex;flex-direction:column;gap:8px;align-items:center;margin-top:4px;';
    board.appendChild(pad);

    const keyEls = {}; // touche chiffre → élément DOM (pour refléter keyState)

    function makeKey(label, wide) {
        const k = document.createElement('button');
        k.type = 'button';
        k.textContent = label;
        k.style.cssText = `min-width:${wide ? 96 : 44}px;height:48px;border-radius:10px;border:none;` +
            'background:#FFFFFF;color:#23262F;font-weight:900;font-size:1.05rem;' +
            'box-shadow:0 1px 3px rgba(35,38,47,.18);touch-action:manipulation;user-select:none;padding:0 10px;';
        return k;
    }

    const digitRow1 = document.createElement('div');
    digitRow1.style.cssText = 'display:flex;gap:8px;';
    const digitRow2 = document.createElement('div');
    digitRow2.style.cssText = 'display:flex;gap:8px;';
    pad.append(digitRow1, digitRow2);

    for (let d = 1; d <= _CODE_MAX; d++) {
        const k = makeKey(d);
        const digit = d;
        k.addEventListener('pointerdown', (e) => {
            e.preventDefault();
            if (isPaused || finished) return;
            // Pas de répétition dans un essai, 4 chiffres max
            if (current.length >= _CODE_LEN || current.includes(digit)) { haptic(20); return; }
            current.push(digit);
            haptic(8);
            syncCurrent();
        });
        keyEls[d] = k;
        (d <= 4 ? digitRow1 : digitRow2).appendChild(k);
    }

    const actionRow = document.createElement('div');
    actionRow.style.cssText = 'display:flex;gap:8px;';
    pad.appendChild(actionRow);

    const eraseKey = makeKey('⌫');
    eraseKey.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        if (isPaused || finished) return;
        if (!current.length) return;
        current.pop();
        haptic(8);
        syncCurrent();
    });

    const okKey = makeKey('Valider', true);
    okKey.style.background = '#4A6CFA';
    okKey.style.color = '#FFFFFF';
    okKey.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        if (isPaused || finished) return;
        if (current.length !== _CODE_LEN) return;
        submit();
    });
    actionRow.append(eraseKey, okKey);

    // Reflète la saisie en cours dans la grille + l'état du bouton Valider
    function syncCurrent() {
        const row = rows[essai];
        for (let i = 0; i < _CODE_LEN; i++) row.cells[i] = i < current.length ? current[i] : null;
        renderRow(essai);
        const ready = current.length === _CODE_LEN;
        okKey.disabled = !ready;
        okKey.style.opacity = ready ? '1' : '.45';
    }
    syncCurrent();

    // Met à jour l'état connu d'une touche (le vert écrase l'or, l'or écrase le gris)
    function upgradeKey(digit, state) {
        const prev = keyState[digit];
        if (prev && _RANK[prev] >= _RANK[state]) return;
        keyState[digit] = state;
        const c = _CODE_COLORS[state];
        keyEls[digit].style.background = c.bg;
        keyEls[digit].style.color = c.fg;
        keyEls[digit].style.boxShadow = state === 'absent' ? 'none' : '0 1px 3px rgba(35,38,47,.18)';
    }

    // Affiche le code secret en vert au-dessus du pavé (défaite)
    function revealSecret() {
        const line = document.createElement('div');
        line.style.cssText = 'display:flex;align-items:center;gap:8px;margin-top:4px;';
        const lbl = document.createElement('span');
        lbl.style.cssText = 'font-size:.8rem;font-weight:bold;color:#8B90A0;';
        lbl.textContent = 'Le code était :';
        line.appendChild(lbl);
        secret.forEach(d => line.appendChild(_codeCell(d, 'good', 36)));
        board.insertBefore(line, pad);
    }

    function submit() {
        const row = rows[essai];
        // Coloration façon Wordle (chiffres distincts : pas d'ambiguïté de doublons)
        for (let i = 0; i < _CODE_LEN; i++) {
            const d = current[i];
            const state = secret[i] === d ? 'good' : (secret.includes(d) ? 'almost' : 'absent');
            row.states[i] = state;
            upgradeKey(d, state);
        }
        renderRow(essai);

        const win = row.states.every(s => s === 'good');
        essai++;
        renderHud();

        if (win) {
            finished = true;
            haptic([12, 40, 12]);
            endGame(`Code percé en ${essai} essai${essai > 1 ? 's' : ''} !`, true);
            return;
        }
        if (essai >= _CODE_TRIES) {
            finished = true;
            haptic(60);
            revealSecret();
            endGame('Le code restera secret… il était affiché ci-dessus.', false);
            return;
        }
        // Essai suivant
        current = [];
        haptic(20);
        syncCurrent();
    }
}
