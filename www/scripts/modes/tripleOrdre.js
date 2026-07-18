// ─── Mode : Triple Suite (jour 27) ───────────────────────────────
// Inspiré de la vague tile-match (Vita Mahjong 7e mondial, Triple Tile,
// Tile Club). Des tuiles en couches : prenez les tuiles LIBRES pour
// former des trios de nombres qui se suivent (1-2-3, 4-5-6…, une
// couleur par trio). La barre déborde à 7 tuiles = perdu.
// La disposition est vérifiée gagnable par un solveur glouton.

const _TRIO_COLORS = [
    ['#EEF2FF', '#3553D1'], ['#E3F7ED', '#1E7A4A'], ['#FFF6E3', '#B07E0A'],
    ['#FCE9E5', '#A93A29'], ['#F2E7FB', '#7A3AA9'], ['#E2F3F1', '#1E7A74'],
    ['#FBDFF0', '#A9297A'], ['#E8EAF1', '#3A4252']
];

function _trioTile(val, trio, size, opts) {
    const o = opts || {};
    const el = document.createElement('div');
    const s = size || 48;
    const [bg, fg] = _TRIO_COLORS[trio % _TRIO_COLORS.length];
    el.style.cssText = `width:${s}px;height:${Math.round(s * 1.16)}px;border-radius:9px;flex-shrink:0;` +
        `background:${o.blocked ? '#D8DCE8' : bg};color:${o.blocked ? '#9AA0AE' : fg};` +
        'display:flex;align-items:center;justify-content:center;font-weight:900;user-select:none;' +
        `font-size:${Math.round(s * 0.42)}px;touch-action:manipulation;transition:transform .12s;` +
        (o.blocked ? 'box-shadow:0 2px 0 #C2C7D6;' : 'box-shadow:0 2px 0 rgba(35,38,47,.14), 0 3px 8px rgba(35,38,47,.08);');
    el.textContent = val;
    return el;
}

function showExampleTripleOrdre(day, row, vals) {
    const ex = document.createElement('div');
    ex.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:10px;margin:6px auto;';

    const bar = document.createElement('div');
    bar.style.cssText = 'display:flex;gap:6px;padding:8px;background:#fff;border-radius:12px;box-shadow:0 2px 6px rgba(35,38,47,.1);';
    [[4, 1], [5, 1], [6, 1]].forEach(([v, t]) => bar.appendChild(_trioTile(v, t, 36)));
    const pop = document.createElement('span');
    pop.style.cssText = 'font-weight:900;color:#34B871;font-size:1.1rem;align-self:center;';
    pop.textContent = '→ ✨ le trio s’envole !';
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;gap:10px;align-items:center;';
    wrap.append(bar, pop);

    ex.append(wrap);
    row.style.flexDirection = 'column';
    row.append(ex);
}

function startGameTripleOrdre() {
    board.style.display = 'flex';
    board.style.flexDirection = 'column';
    board.style.alignItems = 'center';
    board.style.gap = '14px';

    const TRIOS = 7, BAR_MAX = 7;
    const TW = 48, TH = 56; // taille logique d'une tuile sur le plateau

    // Chaque trio t couvre les valeurs 3t+1..3t+3, couleur dédiée
    function buildLayout() {
        const tiles = [];
        let id = 0;
        for (let t = 0; t < TRIOS; t++) {
            for (let k = 0; k < 3; k++) {
                tiles.push({ id: id++, trio: t, val: 3 * t + 1 + k, x: 0, y: 0, layer: 0, gone: false });
            }
        }
        // Placement : 3 couches de 7 tuiles, décalées (la couche 0 en dessous)
        const shuffled = [...tiles].sort(() => Math.random() - 0.5);
        shuffled.forEach((tile, i) => {
            const layer = Math.floor(i / 7);
            const pos = i % 7;
            tile.layer = layer;
            tile.x = (pos % 4) * (TW + 14) + (layer % 2) * Math.round(TW * 0.55) + (pos >= 4 ? Math.round(TW * 0.5) : 0);
            tile.y = Math.floor(pos / 4) * (TH + 16) + layer * Math.round(TH * 0.42);
        });
        return tiles;
    }

    function overlaps(a, b) {
        return Math.abs(a.x - b.x) < TW * 0.7 && Math.abs(a.y - b.y) < TH * 0.7;
    }
    function isFree(tiles, tile) {
        if (tile.gone) return false;
        return !tiles.some(o => !o.gone && o.layer > tile.layer && overlaps(o, tile));
    }

    // Solveur glouton : privilégie toujours le trio le plus avancé dans la barre
    function solvable(tiles) {
        const sim = tiles.map(t => ({ ...t }));
        const bar = [];
        let guard = 0;
        while (sim.some(t => !t.gone) && guard++ < 200) {
            const free = sim.filter(t => isFree(sim, t));
            if (!free.length) return false;
            const counts = {};
            bar.forEach(t => counts[t.trio] = (counts[t.trio] || 0) + 1);
            free.sort((a, b) => (counts[b.trio] || 0) - (counts[a.trio] || 0));
            const pick = free[0];
            if (bar.length >= BAR_MAX - ((counts[pick.trio] || 0) >= 2 ? 0 : 0) && (counts[pick.trio] || 0) < 2 && bar.length >= BAR_MAX) return false;
            pick.gone = true;
            bar.push(pick);
            const mine = bar.filter(t => t.trio === pick.trio);
            if (mine.length === 3) mine.forEach(t => bar.splice(bar.indexOf(t), 1));
            if (bar.length > BAR_MAX) return false;
        }
        return true;
    }

    let tiles;
    for (let attempt = 0; attempt < 50; attempt++) {
        tiles = buildLayout();
        if (solvable(tiles)) break;
    }

    let bar = [];
    let over = false;

    const hud = document.createElement('div');
    hud.style.cssText = 'display:flex;gap:18px;font-weight:bold;color:#8B90A0;font-size:.95rem;';
    board.appendChild(hud);

    const stage = document.createElement('div');
    const maxX = Math.max(...tiles.map(t => t.x)) + TW + 10;
    const maxY = Math.max(...tiles.map(t => t.y)) + TH + 10;
    stage.style.cssText = `position:relative;width:${maxX}px;height:${maxY}px;`;
    board.appendChild(stage);

    const barWrapEl = document.createElement('div');
    barWrapEl.style.cssText = 'display:flex;gap:6px;padding:9px;background:#fff;border-radius:14px;' +
        'box-shadow:0 3px 10px rgba(35,38,47,.12);min-height:66px;align-items:center;';
    board.appendChild(barWrapEl);

    function render() {
        const left = tiles.filter(t => !t.gone).length;
        hud.innerHTML = `<span>Tuiles restantes : <b style="color:#4A6CFA">${left}</b></span>` +
            `<span style="color:${bar.length >= 6 ? '#E0533D' : '#8B90A0'}">Barre : <b>${bar.length}/${BAR_MAX}</b></span>`;

        stage.innerHTML = '';
        [...tiles].sort((a, b) => a.layer - b.layer).forEach(tile => {
            if (tile.gone) return;
            const freeNow = isFree(tiles, tile);
            const el = _trioTile(tile.val, tile.trio, TW, { blocked: !freeNow });
            el.style.position = 'absolute';
            el.style.left = tile.x + 'px';
            el.style.top = tile.y + 'px';
            el.style.zIndex = tile.layer;
            if (freeNow) el.addEventListener('pointerdown', (e) => {
                e.preventDefault();
                if (isPaused || over) return;
                take(tile);
            });
            stage.appendChild(el);
        });

        barWrapEl.innerHTML = '';
        for (let i = 0; i < BAR_MAX; i++) {
            if (i < bar.length) barWrapEl.appendChild(_trioTile(bar[i].val, bar[i].trio, 40));
            else {
                const slot = document.createElement('div');
                slot.style.cssText = 'width:40px;height:46px;border-radius:8px;border:2px dashed #D8DCE8;';
                barWrapEl.appendChild(slot);
            }
        }
    }

    function take(tile) {
        tile.gone = true;
        bar.push(tile);
        bar.sort((a, b) => a.val - b.val);
        haptic(8);
        const mine = bar.filter(t => t.trio === tile.trio);
        if (mine.length === 3) {
            mine.forEach(t => bar.splice(bar.indexOf(t), 1));
            haptic([10, 30, 14]);
        }
        if (bar.length > BAR_MAX) {
            over = true;
            render();
            endGame('La barre a débordé — trop de tuiles orphelines.', false);
            return;
        }
        render();
        if (tiles.every(t => t.gone) && bar.length === 0) {
            over = true;
            endGame('Toutes les suites reconstituées — plateau nettoyé !', true);
        }
    }

    render();
}
