// ─── Mode : Le Mahjong (jour 18) ─────────────────────────────────
// Inspiré de Vita Mahjong / Tile Club (vague tile-match n°7 mondiale).
// 24 tuiles = 12 paires de symboles réparties sur 3 couches qui se
// chevauchent. Tapez DEUX tuiles LIBRES identiques pour les faire
// disparaître. Une tuile est libre si aucune tuile d'une couche
// supérieure ne la recouvre à plus de 30 %. Pas de défaite : le chrono
// départage, et un bouton « Mélanger » débloque les impasses.
// La disposition est vérifiée résoluble par un solveur glouton.

const _MJ_SYMBOLS = ['🌸', '🍀', '🌙', '⭐', '🍎', '🦋', '🌈', '🎀', '🍄', '🐚', '🌻', '❄️'];
const _MJ_TW = 46, _MJ_TH = 54;

function _mjTile(sym, opts) {
    const o = opts || {};
    const el = document.createElement('div');
    el.style.cssText = `width:${_MJ_TW}px;height:${_MJ_TH}px;border-radius:9px;flex-shrink:0;box-sizing:border-box;` +
        'display:flex;align-items:center;justify-content:center;font-size:22px;user-select:none;' +
        'touch-action:manipulation;transition:transform .15s,opacity .15s;' +
        (o.blocked
            ? 'background:#D8DCE8;border:1px solid #C2C7D6;box-shadow:0 1px 0 #C2C7D6;filter:grayscale(.55);opacity:.75;'
            : 'background:#fff;border:1px solid #E3E6EF;box-shadow:0 2px 0 rgba(35,38,47,.14), 0 3px 8px rgba(35,38,47,.10);');
    if (o.selected) el.style.cssText +=
        'box-shadow:0 0 0 3px #FFFFFF, 0 0 0 6px #F5B227, 0 3px 8px rgba(35,38,47,.12);transform:translateY(-2px);';
    el.textContent = sym;
    return el;
}

// Positions fixes en pixels (aucune mesure DOM) : 12 + 8 + 4 = 24 tuiles
function _mjPositions() {
    const pos = [];
    for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++)
        pos.push({ x: c * 54, y: r * 62, layer: 0 });
    for (let r = 0; r < 2; r++) for (let c = 0; c < 4; c++)
        pos.push({ x: c * 54 + 27, y: r * 62 + 8, layer: 1 });
    for (let r = 0; r < 2; r++) for (let c = 0; c < 2; c++)
        pos.push({ x: c * 54 + 54, y: r * 62 + 16, layer: 2 });
    return pos;
}

// Fraction de la surface de b recouverte par a (tuiles de même taille)
function _mjOverlapFrac(a, b) {
    const w = Math.min(a.x + _MJ_TW, b.x + _MJ_TW) - Math.max(a.x, b.x);
    const h = Math.min(a.y + _MJ_TH, b.y + _MJ_TH) - Math.max(a.y, b.y);
    if (w <= 0 || h <= 0) return 0;
    return (w * h) / (_MJ_TW * _MJ_TH);
}

// Libre = aucune tuile restante d'une couche supérieure ne la recouvre à plus de 30 %
function _mjIsFree(tiles, tile) {
    if (tile.gone) return false;
    return !tiles.some(o => !o.gone && o.layer > tile.layer && _mjOverlapFrac(o, tile) > 0.3);
}

// Solveur glouton : retire une paire libre identique tant que possible.
// S'il vide tout le plateau, la disposition est résoluble.
function _mjSolvable(tiles) {
    const sim = tiles.map(t => ({ ...t }));
    let guard = 0;
    while (sim.some(t => !t.gone) && guard++ < 30) {
        const free = sim.filter(t => _mjIsFree(sim, t));
        let a = null, b = null;
        outer:
        for (let i = 0; i < free.length; i++)
            for (let j = i + 1; j < free.length; j++)
                if (free[i].sym === free[j].sym) { a = free[i]; b = free[j]; break outer; }
        if (!a) return false;
        a.gone = true;
        b.gone = true;
    }
    return sim.every(t => t.gone);
}

function showExampleMahjong(day, row, vals) {
    const ex = document.createElement('div');
    ex.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:10px;margin:6px auto;';

    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;gap:8px;align-items:center;';
    const pop = document.createElement('span');
    pop.style.cssText = 'font-weight:900;color:#34B871;font-size:1.05rem;';
    pop.textContent = '→ ✨';
    wrap.append(
        _mjTile('🌸', { selected: true }),
        _mjTile('🍀', { blocked: true }),
        _mjTile('🌸', { selected: true }),
        _mjTile('⭐'),
        pop
    );

    const note = document.createElement('div');
    note.style.cssText = 'font-weight:bold;color:#8B90A0;font-size:.8rem;text-align:center;max-width:270px;';
    note.textContent = 'Deux 🌸 libres = la paire s\'envole ! Les tuiles grisées sont recouvertes : libérez-les d\'abord.';

    ex.append(wrap, note);
    row.style.flexDirection = 'column';
    row.append(ex);
}

function startGameMahjong() {
    board.style.display = 'flex';
    board.style.flexDirection = 'column';
    board.style.alignItems = 'center';
    board.style.gap = '12px';

    const positions = _mjPositions();

    // Distribution vérifiée résoluble (jusqu'à 100 tentatives)
    function deal() {
        const syms = [];
        _MJ_SYMBOLS.forEach(s => { syms.push(s, s); });
        let tiles = null;
        for (let attempt = 0; attempt < 100; attempt++) {
            syms.sort(() => Math.random() - 0.5);
            tiles = positions.map((p, i) => ({ id: i, sym: syms[i], x: p.x, y: p.y, layer: p.layer, gone: false }));
            if (_mjSolvable(tiles)) break;
        }
        return tiles;
    }

    // Redistribue les symboles restants sur les mêmes positions (résoluble à nouveau)
    function reshuffle() {
        const alive = tiles.filter(t => !t.gone);
        const syms = alive.map(t => t.sym);
        for (let attempt = 0; attempt < 100; attempt++) {
            syms.sort(() => Math.random() - 0.5);
            alive.forEach((t, i) => { t.sym = syms[i]; });
            if (_mjSolvable(tiles)) break;
        }
    }

    function hasMove() {
        const free = tiles.filter(t => _mjIsFree(tiles, t));
        for (let i = 0; i < free.length; i++)
            for (let j = i + 1; j < free.length; j++)
                if (free[i].sym === free[j].sym) return true;
        return false;
    }

    let tiles = deal();
    let selectedId = null;
    let over = false;
    let elById = {};

    const hud = document.createElement('div');
    hud.style.cssText = 'font-weight:bold;color:#8B90A0;font-size:.95rem;';
    board.appendChild(hud);

    const stage = document.createElement('div');
    const maxX = Math.max(...positions.map(p => p.x)) + _MJ_TW;
    const maxY = Math.max(...positions.map(p => p.y)) + _MJ_TH;
    stage.style.cssText = `position:relative;width:${maxX}px;height:${maxY}px;`;
    board.appendChild(stage);

    const shuffleBtn = document.createElement('button');
    shuffleBtn.className = 'btn btn-ghost';
    shuffleBtn.textContent = '🔀 Mélanger les tuiles restantes';
    shuffleBtn.style.display = 'none';
    shuffleBtn.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        if (isPaused || over) return;
        selectedId = null;
        reshuffle();
        haptic([10, 30, 14]);
        render();
    });
    board.appendChild(shuffleBtn);

    function render() {
        const left = tiles.filter(t => !t.gone).length;
        hud.innerHTML = `Paires restantes : <b style="color:#4A6CFA">${left / 2}</b>`;

        stage.innerHTML = '';
        elById = {};
        [...tiles].sort((a, b) => a.layer - b.layer).forEach(tile => {
            if (tile.gone) return;
            const freeNow = _mjIsFree(tiles, tile);
            const el = _mjTile(tile.sym, { blocked: !freeNow, selected: selectedId === tile.id });
            el.style.position = 'absolute';
            el.style.left = tile.x + 'px';
            el.style.top = tile.y + 'px';
            el.style.zIndex = tile.layer * 10 + (selectedId === tile.id ? 5 : 0);
            if (freeNow) el.addEventListener('pointerdown', (e) => {
                e.preventDefault();
                if (isPaused || over) return;
                tap(tile, el);
            });
            elById[tile.id] = el;
            stage.appendChild(el);
        });

        // Impasse : plus aucune paire libre identique → proposer le mélange
        shuffleBtn.style.display = (left > 0 && !hasMove()) ? '' : 'none';
    }

    function tap(tile, el) {
        // Retaper la tuile sélectionnée = désélection
        if (selectedId === tile.id) {
            selectedId = null;
            haptic(8);
            render();
            return;
        }
        // Première tuile = sélection (halo or)
        if (selectedId === null) {
            selectedId = tile.id;
            haptic(8);
            render();
            return;
        }
        const first = tiles.find(t => t.id === selectedId);
        // Tuile différente non-identique → secousse, sans pénalité
        if (!first || first.sym !== tile.sym) {
            haptic(30);
            el.style.animation = 'wobble .25s';
            setTimeout(() => { el.style.animation = ''; }, 300);
            return;
        }
        // Paire trouvée : petit effet d'envol puis re-rendu
        first.gone = true;
        tile.gone = true;
        selectedId = null;
        haptic([10, 30, 14]);
        [elById[first.id], el].forEach(x => {
            if (!x) return;
            x.style.pointerEvents = 'none';
            x.style.transform = 'scale(1.35)';
            x.style.opacity = '0';
        });
        setTimeout(() => {
            if (over) return;
            render();
            if (tiles.every(t => t.gone)) {
                over = true;
                endGame("Toutes les paires envolées — l'esprit du mahjong !", true);
            }
        }, 180);
    }

    render();
}
