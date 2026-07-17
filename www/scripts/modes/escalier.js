// ─── Mode : L'Escalier ───────────────────────────────────────────
// Marché de 5 tuiles (valeurs 1..40 uniques, pioche totale de 18).
// Chaque tuile prise doit être STRICTEMENT supérieure à la dernière
// marche ; l'escalier s'affiche en marches montantes. Bouton
// « Défausser » (3 max) : Défausser PUIS une tuile du marché la jette
// et la remplace. Victoire : 8 marches. Défaite : plus aucun coup.

function _escalierTileEl(val) {
    const t = document.createElement('div');
    t.style.cssText = 'width:52px;height:64px;border-radius:10px;background:#4A6CFA;color:#FFFFFF;' +
        'font-weight:900;font-size:1.15rem;display:flex;align-items:center;justify-content:center;' +
        'flex-shrink:0;user-select:none;touch-action:manipulation;' +
        'transition:transform .12s ease,box-shadow .12s ease,opacity .15s;';
    t.textContent = val;
    return t;
}

function _escalierStepEl(val, idx) {
    const s = document.createElement('div');
    s.style.cssText = `width:40px;height:${26 + idx * 8}px;border-radius:8px 8px 3px 3px;background:#34B871;` +
        'color:#FFFFFF;font-weight:900;font-size:.95rem;display:flex;align-items:flex-start;' +
        'justify-content:center;padding-top:4px;flex-shrink:0;user-select:none;';
    s.textContent = val;
    return s;
}

function showExampleEscalier(day, row, vals) {
    const ex = document.createElement('div');
    ex.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:10px;margin:6px auto;';

    const stairs = document.createElement('div');
    stairs.style.cssText = 'display:flex;align-items:flex-end;gap:4px;';
    [3, 11, 24].forEach((v, i) => stairs.appendChild(_escalierStepEl(v, i)));

    const hint = document.createElement('div');
    hint.style.cssText = 'display:flex;gap:8px;align-items:center;font-weight:bold;color:#8B90A0;font-size:.85rem;';
    const t = _escalierTileEl(31);
    t.style.width = '40px';
    t.style.height = '50px';
    t.style.fontSize = '.95rem';
    t.style.boxShadow = '0 0 0 3px #FFFFFF, 0 0 0 5px #F5B227';
    hint.append(t, document.createTextNode('→ toujours plus haut !'));

    ex.append(stairs, hint);
    row.style.flexDirection = 'column';
    row.append(ex);
}

function startGameEscalier() {
    board.style.display = 'flex';
    board.style.flexDirection = 'column';
    board.style.alignItems = 'center';

    // Pioche : 18 valeurs uniques de 1..40
    const all = [];
    for (let i = 1; i <= 40; i++) all.push(i);
    all.sort(() => Math.random() - 0.5);
    const pool = all.slice(0, 18);
    const market = pool.splice(0, 5);
    const deck = pool; // 13 restantes
    const stairs = [];
    let discards = 3;
    let discardMode = false;

    const hud = document.createElement('div');
    hud.style.cssText = 'display:flex;gap:18px;align-items:center;justify-content:center;font-weight:bold;color:#8B90A0;font-size:.95rem;margin-bottom:12px;';
    board.appendChild(hud);

    const stairZone = document.createElement('div');
    stairZone.style.cssText = 'display:flex;align-items:flex-end;justify-content:center;gap:4px;min-height:100px;margin-bottom:16px;';
    board.appendChild(stairZone);

    const marketLbl = document.createElement('div');
    marketLbl.style.cssText = 'font-weight:bold;font-size:.8rem;letter-spacing:.14em;text-transform:uppercase;color:#8B90A0;margin-bottom:6px;';
    marketLbl.textContent = 'Marché :';
    board.appendChild(marketLbl);

    const marketZone = document.createElement('div');
    marketZone.style.cssText = 'display:flex;gap:10px;justify-content:center;flex-wrap:wrap;max-width:420px;margin-bottom:14px;';
    board.appendChild(marketZone);

    const discardBtn = document.createElement('button');
    discardBtn.textContent = 'Défausser (3)';
    discardBtn.style.cssText = 'padding:11px 24px;border-radius:999px;border:2px solid #E0533D;background:#FFFFFF;' +
        'color:#E0533D;font-weight:900;font-size:.95rem;touch-action:manipulation;transition:background .12s,color .12s;';
    board.appendChild(discardBtn);

    const lastStep = () => (stairs.length ? stairs[stairs.length - 1] : 0);

    function renderHud() {
        hud.innerHTML = `<span>Marches <b style="color:#4A6CFA">${stairs.length}/8</b></span>` +
            `<span>Pioche : <b style="color:#4A6CFA">${deck.length}</b></span>`;
    }

    function renderStairs() {
        stairZone.innerHTML = '';
        if (stairs.length === 0) {
            const empty = document.createElement('div');
            empty.style.cssText = 'padding:14px 20px;border:2px dashed #8B90A0;border-radius:12px;color:#8B90A0;font-weight:bold;font-size:.85rem;';
            empty.textContent = 'Escalier vide — prends une tuile';
            stairZone.appendChild(empty);
            return;
        }
        stairs.forEach((v, i) => stairZone.appendChild(_escalierStepEl(v, i)));
    }

    function renderDiscardBtn() {
        discardBtn.textContent = `Défausser (${discards})`;
        if (discardMode) {
            discardBtn.style.background = '#E0533D';
            discardBtn.style.color = '#FFFFFF';
        } else {
            discardBtn.style.background = '#FFFFFF';
            discardBtn.style.color = '#E0533D';
        }
        discardBtn.style.opacity = discards > 0 ? '1' : '.5';
    }

    function renderMarket() {
        marketZone.innerHTML = '';
        market.forEach((val, i) => {
            const t = _escalierTileEl(val);
            const playable = val > lastStep();
            if (!playable) t.style.opacity = '.4'; // grisée mais défaussable
            t.addEventListener('pointerdown', (e) => {
                e.preventDefault();
                if (isPaused) return;
                if (discardMode) {
                    market.splice(i, 1);
                    if (deck.length > 0) market.push(deck.shift());
                    discards--;
                    discardMode = false;
                    haptic(20);
                    if (resultDisplay.textContent === 'Touche la tuile à jeter…') resultDisplay.textContent = '';
                    renderAll();
                    checkEnd();
                } else if (playable) {
                    stairs.push(val);
                    market.splice(i, 1);
                    if (deck.length > 0) market.push(deck.shift());
                    haptic(10);
                    renderAll();
                    checkEnd();
                } else {
                    haptic(50);
                    t.style.animation = 'wobble .3s';
                    t.style.boxShadow = '0 0 0 3px #FFFFFF, 0 0 0 6px #E0533D';
                    setTimeout(() => { t.style.animation = ''; t.style.boxShadow = ''; }, 320);
                }
            });
            marketZone.appendChild(t);
        });
    }

    function renderAll() {
        renderHud();
        renderStairs();
        renderDiscardBtn();
        renderMarket();
    }

    function checkEnd() {
        if (stairs.length >= 8) {
            endGame('Escalier de 8 marches — magnifique montée !', true);
            return;
        }
        if (market.length === 0 && deck.length === 0) {
            endGame(`Plus de tuiles — ${stairs.length} marche${stairs.length > 1 ? 's' : ''} atteinte${stairs.length > 1 ? 's' : ''}.`, false);
            return;
        }
        const playable = market.some(v => v > lastStep());
        if (!playable && (discards <= 0 || deck.length === 0)) {
            endGame(`Plus aucun coup possible — ${stairs.length} marche${stairs.length > 1 ? 's' : ''} atteinte${stairs.length > 1 ? 's' : ''}.`, false);
        }
    }

    discardBtn.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        if (isPaused) return;
        if (discards <= 0) {
            haptic(50);
            discardBtn.style.animation = 'wobble .3s';
            setTimeout(() => { discardBtn.style.animation = ''; }, 320);
            return;
        }
        discardMode = !discardMode;
        haptic(6);
        renderDiscardBtn();
        resultDisplay.textContent = discardMode ? 'Touche la tuile à jeter…' : '';
        resultDisplay.style.color = '#E0533D';
    });

    renderAll();
}
