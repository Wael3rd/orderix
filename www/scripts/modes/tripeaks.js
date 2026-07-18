// ─── Mode : Le Sommet (jour 6) ───────────────────────────────────
// Inspiré de TriPeaks / Solitaire Grand Harvest (top grossing casual).
// Pyramide de 15 cartes (1..9) : on enchaîne les valeurs à ±1 de la
// carte active. Une carte est libre si les deux cartes qui la couvrent
// sont parties. Pioche de secours limitée. La donne est vérifiée
// gagnable par un solveur avant d'être servie.

const _TRI_ROWS = 5; // pyramide 1+2+3+4+5 = 15 cartes

function _triIdx(r, c) { return r * (r + 1) / 2 + c; }

function _triCard(val, size, opts) {
    const o = opts || {};
    const el = document.createElement('div');
    const s = size || 46;
    el.style.cssText = `width:${s}px;height:${Math.round(s * 1.3)}px;border-radius:8px;display:flex;` +
        'align-items:center;justify-content:center;font-weight:900;flex-shrink:0;user-select:none;' +
        `font-size:${Math.round(s * 0.44)}px;transition:transform .12s,opacity .2s;touch-action:manipulation;` +
        (o.blocked
            ? 'background:#D8DCE8;color:#B9BDC9;box-shadow:0 2px 0 #C2C7D6;'
            : 'background:#FFFFFF;color:#23262F;box-shadow:0 2px 0 #D8DCE8, 0 3px 8px rgba(35,38,47,.10);');
    // Retour #51 (« incompréhensible ») : les cartes réellement JOUABLES
    // (libres ET à ±1 de l'active) brillent en vert — on voit quoi faire.
    if (o.playable) el.style.cssText += 'box-shadow:0 2px 0 #1E7A4A, 0 0 0 2.5px #34B871;color:#1E7A4A;';
    if (o.active) el.style.cssText += 'background:#4A6CFA;color:#fff;box-shadow:0 3px 0 #3553D1, 0 0 0 3px #FFFFFF, 0 0 0 5px #F5B227;';
    el.textContent = val;
    return el;
}

function showExampleTripeaks(day, row, vals) {
    const ex = document.createElement('div');
    ex.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:10px;margin:6px auto;';

    const mini = document.createElement('div');
    mini.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:4px;';
    const r1 = document.createElement('div'); r1.style.cssText = 'display:flex;gap:6px;';
    r1.appendChild(_triCard(7, 34, { blocked: true }));
    const r2 = document.createElement('div'); r2.style.cssText = 'display:flex;gap:6px;';
    r2.append(_triCard(4, 34), _triCard(6, 34));
    mini.append(r1, r2);

    const chain = document.createElement('div');
    chain.style.cssText = 'display:flex;align-items:center;gap:8px;font-weight:bold;color:#8B90A0;font-size:.85rem;';
    chain.append(document.createTextNode('Carte active :'), _triCard(5, 38, { active: true }),
        document.createTextNode('→ 4 ou 6 jouables'));

    ex.append(mini, chain);
    row.style.flexDirection = 'column';
    row.append(ex);
}

// Solveur : la donne est-elle gagnable ? DFS mémoïsé.
function _triSolvable(cards, draw) {
    const N = cards.length;
    const FULL = (1 << N) - 1;
    const memo = new Set();
    let visited = 0;

    function free(mask, i) {
        if (mask & (1 << i)) return false;
        const r = Math.floor((Math.sqrt(8 * i + 1) - 1) / 2);
        if (r >= _TRI_ROWS - 1) return true;
        const c = i - r * (r + 1) / 2;
        const l = _triIdx(r + 1, c), rr = _triIdx(r + 1, c + 1);
        return (mask & (1 << l)) !== 0 && (mask & (1 << rr)) !== 0;
    }

    function dfs(mask, active, di) {
        if (mask === FULL) return true;
        if (++visited > 150000) return false;
        const key = mask + '|' + active + '|' + di;
        if (memo.has(key)) return false;
        memo.add(key);
        for (let i = 0; i < N; i++) {
            if (free(mask, i) && Math.abs(cards[i] - active) === 1) {
                if (dfs(mask | (1 << i), cards[i], di)) return true;
            }
        }
        if (di < draw.length && dfs(mask, draw[di], di + 1)) return true;
        return false;
    }
    return dfs(0, draw.length ? -99 : -99, 0) || false;
}

function startGameTripeaks() {
    board.style.display = 'flex';
    board.style.flexDirection = 'column';
    board.style.alignItems = 'center';
    board.style.gap = '14px';

    const N = 15, DRAW = 9;
    let cards, draw;
    // Génération vérifiée gagnable (le 1er tirage de la pioche sert de carte active)
    for (let attempt = 0; attempt < 40; attempt++) {
        cards = Array.from({ length: N }, () => 1 + Math.floor(Math.random() * 9));
        draw = Array.from({ length: DRAW }, () => 1 + Math.floor(Math.random() * 9));
        // Simule : la 1re carte de pioche devient active d'office
        if (_triSolvable(cards, draw)) break;
    }

    let removed = new Array(N).fill(false);
    let active = draw.shift();
    let over = false;

    const hud = document.createElement('div');
    hud.style.cssText = 'display:flex;gap:18px;font-weight:bold;color:#8B90A0;font-size:.95rem;';
    board.appendChild(hud);

    const pyramid = document.createElement('div');
    pyramid.style.cssText = 'position:relative;width:300px;height:250px;';
    board.appendChild(pyramid);

    const bottom = document.createElement('div');
    bottom.style.cssText = 'display:flex;align-items:center;gap:22px;';
    board.appendChild(bottom);

    const activeWrap = document.createElement('div');
    activeWrap.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:4px;font-weight:bold;color:#8B90A0;font-size:.72rem;';
    const drawBtn = document.createElement('button');
    drawBtn.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:4px;font-weight:bold;color:#8B90A0;font-size:.72rem;touch-action:manipulation;';
    bottom.append(activeWrap, drawBtn);

    function isFree(i) {
        if (removed[i]) return false;
        const r = Math.floor((Math.sqrt(8 * i + 1) - 1) / 2);
        if (r >= _TRI_ROWS - 1) return true;
        const c = i - r * (r + 1) / 2;
        return removed[_triIdx(r + 1, c)] && removed[_triIdx(r + 1, c + 1)];
    }

    function anyMove() {
        for (let i = 0; i < N; i++) if (isFree(i) && Math.abs(cards[i] - active) === 1) return true;
        return false;
    }

    function render() {
        const left = removed.filter(x => !x).length;
        const lo = active - 1, hi = active + 1;
        hud.innerHTML = `<span>Cartes restantes : <b style="color:#4A6CFA">${left}</b></span>` +
            `<span>Jouez un <b style="color:#34B871">${lo >= 1 ? lo : '—'}</b> ou un <b style="color:#34B871">${hi <= 9 ? hi : '—'}</b></span>`;

        pyramid.innerHTML = '';
        let idx = 0;
        for (let r = 0; r < _TRI_ROWS; r++) {
            for (let c = 0; c <= r; c++, idx++) {
                if (removed[idx]) continue;
                const i = idx;
                const freeNow = isFree(i);
                const playable = freeNow && Math.abs(cards[i] - active) === 1;
                const el = _triCard(cards[i], 46, { blocked: !freeNow, playable: playable });
                el.style.position = 'absolute';
                el.style.left = (150 - 26 + (c - r / 2) * 56) + 'px';
                el.style.top = (r * 47) + 'px';
                el.style.zIndex = r;
                if (freeNow) el.addEventListener('pointerdown', (e) => {
                    e.preventDefault();
                    if (isPaused || over) return;
                    if (Math.abs(cards[i] - active) === 1) {
                        removed[i] = true;
                        active = cards[i];
                        haptic(10);
                        render();
                        if (removed.every(x => x)) { over = true; endGame('Sommet conquis — toute la pyramide y est passée !', true); }
                        else checkStuck();
                    } else {
                        haptic(30);
                        el.style.animation = 'wobble .3s';
                        setTimeout(() => { el.style.animation = ''; }, 350);
                    }
                });
                pyramid.appendChild(el);
            }
        }

        activeWrap.innerHTML = '';
        activeWrap.append(document.createTextNode('ACTIVE'), _triCard(active, 52, { active: true }));

        drawBtn.innerHTML = '';
        const pile = _triCard(draw.length ? '↻' : '—', 52, { blocked: draw.length === 0 });
        if (draw.length) { pile.style.background = '#EEF2FF'; pile.style.color = '#3553D1'; }
        drawBtn.append(document.createTextNode(`PIOCHE (${draw.length})`), pile);
    }

    drawBtn.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        if (isPaused || over || draw.length === 0) return;
        active = draw.shift();
        haptic(10);
        render();
        checkStuck();
    });

    function checkStuck() {
        if (!over && draw.length === 0 && !anyMove()) {
            over = true;
            endGame('Plus aucun enchaînement possible et la pioche est vide.', false);
        }
    }

    render();
}
