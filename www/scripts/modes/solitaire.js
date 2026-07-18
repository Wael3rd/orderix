// ─── Mode : Le Solitaire (jour 8) ────────────────────────────────
// Le vrai Klondike, ultra-simplifié (retour #41 : « il faudrait que ça
// ressemble bcp plus à du solitaire, même ultra simplifié »).
// 24 cartes (2 couleurs × 1..12) · 4 colonnes · pioche recyclable ·
// 2 fondations à monter 1→12. Sur le tableau : pose descendante en
// ALTERNANT les couleurs. Aucun coup surligné — c'est à vous de voir.
// Annulation illimitée. Donne vérifiée gagnable par solveur.

const _SOL_MAX = 12;
const _SOL_SUITS = [
    { color: '#E0533D', soft: '#FCE9E5', symbol: '♦' },
    { color: '#3553D1', soft: '#EEF2FF', symbol: '♣' }
];

function _solCard(card, opts) {
    const o = opts || {};
    const el = document.createElement('div');
    const suit = card ? _SOL_SUITS[card.s] : null;
    el.style.cssText = 'width:56px;height:74px;border-radius:8px;flex-shrink:0;user-select:none;position:relative;' +
        'touch-action:manipulation;transition:transform .1s,box-shadow .1s;box-sizing:border-box;' +
        (o.faceDown
            ? 'background:repeating-linear-gradient(45deg,#3553D1,#3553D1 4px,#4A6CFA 4px,#4A6CFA 8px);box-shadow:0 1px 3px rgba(35,38,47,.25);'
            : card
                ? `background:#fff;border:2px solid ${suit.color};box-shadow:0 1px 3px rgba(35,38,47,.18);`
                : 'background:transparent;border:2px dashed #C2C7D6;');
    if (card && !o.faceDown) {
        const top = document.createElement('div');
        top.style.cssText = `position:absolute;top:3px;left:6px;font-weight:900;font-size:1.05rem;color:${suit.color};`;
        top.textContent = card.v;
        const sym = document.createElement('div');
        sym.style.cssText = `position:absolute;bottom:3px;right:6px;font-size:.95rem;color:${suit.color};`;
        sym.textContent = suit.symbol;
        el.append(top, sym);
    }
    if (o.label) {
        const lb = document.createElement('div');
        lb.style.cssText = 'position:absolute;inset:0;display:flex;align-items:center;justify-content:center;' +
            'font-weight:900;font-size:.8rem;color:#9AA0AE;';
        lb.textContent = o.label;
        el.appendChild(lb);
    }
    if (o.selected) el.style.cssText += 'box-shadow:0 0 0 3px #FFFFFF, 0 0 0 6px #F5B227;transform:translateY(-3px);z-index:20;';
    return el;
}

function showExampleSolitaire(day, row, vals) {
    const ex = document.createElement('div');
    ex.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:10px;margin:6px auto;';

    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;gap:10px;align-items:center;';
    const c1 = _solCard({ v: 7, s: 0 });
    const arrow = document.createElement('span');
    arrow.style.cssText = 'font-weight:900;color:#8B90A0;font-size:1.1rem;';
    arrow.textContent = '→';
    const c2 = _solCard({ v: 8, s: 1 });
    const pile = document.createElement('div');
    pile.style.cssText = 'position:relative;width:56px;height:88px;';
    const under = _solCard({ v: 8, s: 1 });
    under.style.cssText += 'position:absolute;top:0;left:0;';
    const over = _solCard({ v: 7, s: 0 });
    over.style.cssText += 'position:absolute;top:22px;left:0;';
    pile.append(under, over);
    wrap.append(c1, arrow, c2, document.createTextNode('='), pile);

    const note = document.createElement('div');
    note.style.cssText = 'font-weight:bold;color:#8B90A0;font-size:.8rem;text-align:center;max-width:270px;';
    note.textContent = 'Le 7 rouge se pose sur le 8 bleu (descendant, couleurs alternées). Montez les 1→12 aux fondations.';

    ex.append(wrap, note);
    row.style.flexDirection = 'column';
    row.append(ex);
}

// ─── Solveur (information parfaite, modèle « pioche accessible ») ─
// Avec une pioche recyclable à l'infini tirée carte par carte, toute
// carte du talon est atteignable : le solveur traite pioche+défausse
// comme un réservoir. Conservateur sur les déplacements de tableau
// (suffixes complets) : s'il valide, la donne est gagnable.
function _solSolvable(deal) {
    const memo = new Set();
    let nodes = 0;

    function key(cols, found, pool) {
        return cols.map(c => c.down.map(x => x.v + '' + x.s).join('.') + '|' + c.up.map(x => x.v + '' + x.s).join('.')).join('/') +
            '#' + found.join(',') + '#' + pool.map(x => x.v + '' + x.s).sort().join('.');
    }

    function dfs(cols, found, pool) {
        if (found[0] === _SOL_MAX && found[1] === _SOL_MAX) return true;
        if (++nodes > 80000) return false;
        const k = key(cols, found, pool);
        if (memo.has(k)) return false;
        memo.add(k);

        const clone = () => ({
            cols: cols.map(c => ({ down: c.down.slice(), up: c.up.slice() })),
            found: found.slice(),
            pool: pool.slice()
        });

        // 1. Sommets de colonnes → fondation (prioritaire)
        for (let i = 0; i < cols.length; i++) {
            const up = cols[i].up;
            if (!up.length) continue;
            const top = up[up.length - 1];
            if (found[top.s] === top.v - 1) {
                const s = clone();
                s.cols[i].up.pop();
                if (!s.cols[i].up.length && s.cols[i].down.length) s.cols[i].up.push(s.cols[i].down.pop());
                s.found[top.s]++;
                if (dfs(s.cols, s.found, s.pool)) return true;
            }
        }
        // 2. Réservoir → fondation
        for (let p = 0; p < pool.length; p++) {
            const card = pool[p];
            if (found[card.s] === card.v - 1) {
                const s = clone();
                s.pool.splice(p, 1);
                s.found[card.s]++;
                if (dfs(s.cols, s.found, s.pool)) return true;
            }
        }
        // 3. Suffixe complet de face visible → autre colonne (déterre une carte)
        for (let i = 0; i < cols.length; i++) {
            const up = cols[i].up;
            if (!up.length) continue;
            const head = up[0];
            for (let j = 0; j < cols.length; j++) {
                if (i === j) continue;
                const dst = cols[j].up;
                const ok = dst.length
                    ? (dst[dst.length - 1].v === head.v + 1 && dst[dst.length - 1].s !== head.s)
                    : true;
                if (!ok) continue;
                // Inutile de déplacer une pile entière vers une colonne vide si rien à déterrer
                if (!dst.length && !cols[i].down.length) continue;
                const s = clone();
                const run = s.cols[i].up.splice(0);
                s.cols[j].up.push(...run);
                if (!s.cols[i].up.length && s.cols[i].down.length) s.cols[i].up.push(s.cols[i].down.pop());
                if (dfs(s.cols, s.found, s.pool)) return true;
            }
        }
        // 4. Réservoir → colonne (pour débloquer une alternance)
        for (let p = 0; p < pool.length; p++) {
            const card = pool[p];
            for (let j = 0; j < cols.length; j++) {
                const dst = cols[j].up;
                const ok = dst.length
                    ? (dst[dst.length - 1].v === card.v + 1 && dst[dst.length - 1].s !== card.s)
                    : true;
                if (!ok) continue;
                const s = clone();
                s.pool.splice(p, 1);
                s.cols[j].up.push(card);
                if (dfs(s.cols, s.found, s.pool)) return true;
            }
        }
        return false;
    }

    return dfs(deal.cols, [0, 0], deal.pool);
}

function startGameSolitaire() {
    board.style.display = 'flex';
    board.style.flexDirection = 'column';
    board.style.alignItems = 'center';
    board.style.gap = '14px';

    // Donne vérifiée gagnable
    let deal;
    for (let attempt = 0; attempt < 40; attempt++) {
        const deck = [];
        for (let s = 0; s < 2; s++) for (let v = 1; v <= _SOL_MAX; v++) deck.push({ v: v, s: s });
        deck.sort(() => Math.random() - 0.5);
        const cols = [];
        let idx = 0;
        [2, 3, 4, 5].forEach(n => {
            cols.push({ down: deck.slice(idx, idx + n - 1), up: [deck[idx + n - 1]] });
            idx += n;
        });
        deal = { cols: cols, pool: deck.slice(idx) };
        if (_solSolvable({ cols: cols.map(c => ({ down: c.down.slice(), up: c.up.slice() })), pool: deal.pool.slice() })) break;
    }

    let cols = deal.cols;
    let stock = deal.pool.slice();
    let waste = [];
    let found = [null, null]; // valeur au sommet de chaque fondation (null = vide)
    let foundV = [0, 0];
    let selected = null; // {type:'waste'} | {type:'col', col, idx}
    let history = [];
    let over = false;

    const snapshot = () => JSON.stringify({ cols, stock, waste, foundV });
    const restore = (snap) => {
        const s = JSON.parse(snap);
        cols = s.cols; stock = s.stock; waste = s.waste; foundV = s.foundV;
    };

    const topRow = document.createElement('div');
    topRow.style.cssText = 'display:flex;gap:10px;align-items:flex-start;';
    board.appendChild(topRow);

    const tableau = document.createElement('div');
    tableau.style.cssText = 'display:flex;gap:12px;align-items:flex-start;min-height:280px;';
    board.appendChild(tableau);

    const undoBtn = document.createElement('button');
    undoBtn.className = 'btn btn-ghost';
    undoBtn.textContent = '↩ Annuler';
    undoBtn.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        if (isPaused || over || !history.length) return;
        restore(history.pop());
        selected = null;
        haptic(8);
        render();
    });
    board.appendChild(undoBtn);

    function push() { history.push(snapshot()); if (history.length > 200) history.shift(); }

    function shake(el) {
        haptic(30);
        el.style.animation = 'wobble .25s';
        setTimeout(() => { el.style.animation = ''; }, 300);
    }

    function tryFoundation(card) { return foundV[card.s] === card.v - 1; }

    function afterMove() {
        selected = null;
        haptic(10);
        render();
        if (foundV[0] === _SOL_MAX && foundV[1] === _SOL_MAX) {
            over = true;
            endGame('Les deux fondations sont complètes — un vrai solitaire, une vraie victoire !', true);
        }
    }

    function render() {
        // Pioche · défausse · fondations
        topRow.innerHTML = '';
        const stockEl = _solCard(null, stock.length ? { faceDown: true } : { label: '↻' });
        stockEl.addEventListener('pointerdown', (e) => {
            e.preventDefault();
            if (isPaused || over) return;
            push();
            if (!stock.length) { stock = waste; waste = []; }
            if (stock.length) waste.push(stock.shift());
            selected = null;
            haptic(8);
            render();
        });
        const cnt = document.createElement('div');
        cnt.style.cssText = 'text-align:center;font-weight:900;font-size:.7rem;color:#9AA0AE;margin-top:3px;';
        cnt.textContent = stock.length;
        const stockWrap = document.createElement('div');
        stockWrap.append(stockEl, cnt);

        const wasteTop = waste.length ? waste[waste.length - 1] : null;
        const wasteEl = _solCard(wasteTop, wasteTop ? { selected: selected && selected.type === 'waste' } : { label: '—' });
        if (wasteTop) wasteEl.addEventListener('pointerdown', (e) => {
            e.preventDefault();
            if (isPaused || over) return;
            selected = (selected && selected.type === 'waste') ? null : { type: 'waste' };
            haptic(8);
            render();
        });

        const gapEl = document.createElement('div');
        gapEl.style.cssText = 'width:14px;';

        topRow.append(stockWrap, wasteEl, gapEl);
        for (let s = 0; s < 2; s++) {
            const suit = _SOL_SUITS[s];
            const fEl = foundV[s] > 0
                ? _solCard({ v: foundV[s], s: s })
                : _solCard(null, { label: suit.symbol + '1' });
            if (foundV[s] === 0) fEl.style.borderColor = suit.color;
            const si = s;
            fEl.addEventListener('pointerdown', (e) => {
                e.preventDefault();
                if (isPaused || over || !selected) return;
                dropOnFoundation(si, fEl);
            });
            topRow.appendChild(fEl);
        }

        // Tableau
        tableau.innerHTML = '';
        cols.forEach((col, ci) => {
            const colEl = document.createElement('div');
            colEl.style.cssText = 'position:relative;width:56px;min-height:96px;';
            let y = 0;
            col.down.forEach(() => {
                const c = _solCard(null, { faceDown: true });
                c.style.cssText += `position:absolute;top:${y}px;left:0;`;
                colEl.appendChild(c);
                y += 14;
            });
            col.up.forEach((card, ui) => {
                const isSel = selected && selected.type === 'col' && selected.col === ci && selected.idx <= ui;
                const c = _solCard(card, { selected: isSel });
                c.style.cssText += `position:absolute;top:${y}px;left:0;z-index:${5 + ui};`;
                const uidx = ui;
                c.addEventListener('pointerdown', (e) => {
                    e.preventDefault();
                    if (isPaused || over) return;
                    tapCol(ci, uidx, c);
                });
                colEl.appendChild(c);
                y += 24;
            });
            if (!col.down.length && !col.up.length) {
                const empty = _solCard(null, {});
                empty.addEventListener('pointerdown', (e) => {
                    e.preventDefault();
                    if (isPaused || over || !selected) return;
                    dropOnCol(ci, empty);
                });
                colEl.appendChild(empty);
            }
            colEl.style.height = Math.max(96, y + 74) + 'px';
            tableau.appendChild(colEl);
        });
    }

    function tapCol(ci, ui, el) {
        const col = cols[ci];
        const top = col.up[col.up.length - 1];
        if (selected) {
            // Tentative de dépôt sur cette colonne
            if (selected.type === 'col' && selected.col === ci) { selected = null; render(); return; }
            dropOnCol(ci, el);
            return;
        }
        // Sélection : la carte tapée + tout ce qui est dessus
        selected = { type: 'col', col: ci, idx: ui };
        haptic(8);
        render();
    }

    function movingCards() {
        if (!selected) return [];
        if (selected.type === 'waste') return [waste[waste.length - 1]];
        return cols[selected.col].up.slice(selected.idx);
    }

    function removeMoving() {
        if (selected.type === 'waste') { waste.pop(); return; }
        const col = cols[selected.col];
        col.up.splice(selected.idx);
        if (!col.up.length && col.down.length) col.up.push(col.down.pop());
    }

    function dropOnCol(ci, el) {
        const cards = movingCards();
        if (!cards.length) return;
        const head = cards[0];
        const dst = cols[ci].up;
        const legal = dst.length
            ? (dst[dst.length - 1].v === head.v + 1 && dst[dst.length - 1].s !== head.s)
            : true;
        if (!legal) { shake(el); selected = null; render(); return; }
        push();
        removeMoving();
        cols[ci].up.push(...cards);
        afterMove();
    }

    function dropOnFoundation(s, el) {
        const cards = movingCards();
        if (cards.length !== 1) { shake(el); selected = null; render(); return; }
        const card = cards[0];
        if (card.s !== s || foundV[s] !== card.v - 1) { shake(el); selected = null; render(); return; }
        push();
        removeMoving();
        foundV[s]++;
        afterMove();
    }

    render();
}
