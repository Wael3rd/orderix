// ─── Mode : L'Escalier ───────────────────────────────────────────
// Marché de 4 tuiles (valeurs 1..40 uniques, pioche totale de 14).
// Chaque tuile prise doit être STRICTEMENT supérieure à la dernière
// marche ; l'escalier s'affiche en marches montantes. Bouton
// « Défausser » (2 max) : Défausser PUIS une tuile du marché la jette
// et la remplace. Victoire : 8 marches. Défaite : plus aucun coup.
// Génération vérifiée solvable (recherche mémoïsée bornée sur le
// marché + pioche + 2 défausses) : un tirage 100% aléatoire pouvait
// être injouable par pure malchance, sans faute de la joueuse.

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

// Recherche mémoïsée : le marché est-il gagnable (8 marches, ≤ 2
// défausses) en jouant du mieux possible ? État = marché courant +
// index dans la pioche + défausses restantes + dernière marche.
function _escalierSolvable(pool) {
    const deck = pool.slice(4);
    const memo = new Map();
    let appels = 0;
    function rec(marche, idxPioche, defausses, derniere, marches) {
        if (marches >= 8) return true;
        const cle = marche.slice().sort((a, b) => a - b).join(',') + '|' + idxPioche + '|' + defausses + '|' + derniere;
        if (memo.has(cle)) return memo.get(cle);
        if (++appels > 120000) return false;
        let ok = false;
        for (let i = 0; i < marche.length && !ok; i++) {
            const val = marche[i];
            const reste = marche.slice(0, i).concat(marche.slice(i + 1));
            const pioche = idxPioche < deck.length ? deck[idxPioche] : null;
            const nextMarche = pioche !== null ? reste.concat([pioche]) : reste;
            const nextIdx = pioche !== null ? idxPioche + 1 : idxPioche;
            if (val > derniere && rec(nextMarche, nextIdx, defausses, val, marches + 1)) ok = true;
            else if (defausses > 0 && rec(nextMarche, nextIdx, defausses - 1, derniere, marches)) ok = true;
        }
        memo.set(cle, ok);
        return ok;
    }
    return rec(pool.slice(0, 4), 0, 2, 0, 0);
}

function _escalierGenerer() {
    for (let essai = 0; essai < 50; essai++) {
        const all = [];
        for (let i = 1; i <= 40; i++) all.push(i);
        all.sort(() => Math.random() - 0.5);
        const pool = all.slice(0, 14);
        if (_escalierSolvable(pool)) return pool;
    }
    // Secours (théorique) : ordre croissant, toujours jouable sans défausse
    const all = [];
    for (let i = 1; i <= 40; i++) all.push(i);
    all.sort(() => Math.random() - 0.5);
    return all.slice(0, 14).sort((a, b) => a - b);
}

function startGameEscalier() {
    board.style.display = 'flex';
    board.style.flexDirection = 'column';
    board.style.alignItems = 'center';

    // Pioche : 14 valeurs uniques de 1..40, vérifiées solvables
    const pool = _escalierGenerer();
    const market = pool.splice(0, 4);
    const deck = pool; // 10 restantes
    const stairs = [];
    let discards = 2;
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
    discardBtn.textContent = 'Défausser (2)';
    discardBtn.style.cssText = 'padding:11px 24px;border-radius:999px;border:2px solid #E0533D;background:#FFFFFF;' +
        'color:#E0533D;font-weight:900;font-size:.95rem;touch-action:manipulation;transition:background .12s,color .12s;';
    board.appendChild(discardBtn);

    const lastStep = () => (stairs.length ? stairs[stairs.length - 1] : 0);

    function renderHud() {
        hud.innerHTML = `<span>Marches <b style="color:#4A6CFA">${stairs.length}/8</b></span>` +
            `<span>Pioche restante : <b style="color:#4A6CFA">${deck.length}</b></span>`;
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
