// ─── Mode : La Suite ─────────────────────────────────────────────
// Inspiré de « The Game » : 4 piles centrales — 2 montantes (↑, on ne
// peut poser que plus grand, démarrent à 1) et 2 descendantes (↓, on
// ne peut poser que plus petit, démarrent à 100). Règle magique :
// l'écart exact de 10 dans l'autre sens est permis. Pioche de 18
// cartes uniques (2..99), main de 6. Victoire : tout poser.
// Défaite : plus aucun coup possible.

function _laSuiteCardEl(val, small) {
    const c = document.createElement('div');
    const w = small ? 42 : 54, h = small ? 54 : 68;
    c.style.cssText = `width:${w}px;height:${h}px;border-radius:10px;background:#4A6CFA;color:#FFFFFF;` +
        `font-weight:900;font-size:${small ? '1.05rem' : '1.25rem'};display:flex;align-items:center;` +
        `justify-content:center;flex-shrink:0;user-select:none;touch-action:manipulation;` +
        `transition:transform .12s ease,box-shadow .12s ease;`;
    c.textContent = val;
    return c;
}

function _laSuitePileEl(dir) {
    const col = dir === 1 ? '#4A6CFA' : '#E0533D';
    const p = document.createElement('button');
    p.style.cssText = `width:62px;height:80px;border-radius:12px;background:#EEF2FF;border:2px solid ${col};` +
        `display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1px;` +
        `font-weight:900;color:#23262F;font-size:1.25rem;flex-shrink:0;touch-action:manipulation;` +
        `transition:transform .1s,box-shadow .12s;`;
    const arrow = document.createElement('span');
    arrow.style.cssText = `font-size:.85rem;color:${col};line-height:1;pointer-events:none;`;
    arrow.textContent = dir === 1 ? '↑' : '↓';
    const num = document.createElement('span');
    num.style.pointerEvents = 'none';
    p.append(arrow, num);
    p._num = num;
    return p;
}

function _laSuiteShake(el) {
    el.style.animation = 'wobble .3s';
    el.style.boxShadow = '0 0 0 3px #FFFFFF, 0 0 0 6px #E0533D';
    setTimeout(() => { el.style.animation = ''; el.style.boxShadow = ''; }, 320);
}

function showExampleLaSuite(day, row, vals) {
    const ex = document.createElement('div');
    ex.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:10px;margin:6px auto;';

    const piles = document.createElement('div');
    piles.style.cssText = 'display:flex;gap:8px;';
    [[1, 1], [1, 14], [-1, 100], [-1, 87]].forEach(([dir, v]) => {
        const p = _laSuitePileEl(dir);
        p.style.width = '48px';
        p.style.height = '62px';
        p.style.fontSize = '1rem';
        p.style.pointerEvents = 'none';
        p._num.textContent = v;
        piles.appendChild(p);
    });

    const hand = document.createElement('div');
    hand.style.cssText = 'display:flex;gap:8px;align-items:center;font-weight:bold;color:#8B90A0;font-size:.85rem;';
    const c = _laSuiteCardEl(23, true);
    c.style.boxShadow = '0 0 0 3px #FFFFFF, 0 0 0 5px #F5B227';
    hand.append(c, document.createTextNode('→ pose-la sur une pile'));

    ex.append(piles, hand);
    row.style.flexDirection = 'column';
    row.append(ex);
}

function startGameLaSuite() {
    board.style.display = 'flex';
    board.style.flexDirection = 'column';
    board.style.alignItems = 'center';

    // Pioche : 18 valeurs uniques tirées de 2..99
    const all = [];
    for (let i = 2; i <= 99; i++) all.push(i);
    all.sort(() => Math.random() - 0.5);
    let deck = all.slice(0, 18);
    let hand = deck.splice(0, 6);
    const piles = [
        { dir: 1, val: 1 }, { dir: 1, val: 1 },
        { dir: -1, val: 100 }, { dir: -1, val: 100 }
    ];
    let selected = -1;

    const hud = document.createElement('div');
    hud.style.cssText = 'display:flex;gap:18px;align-items:center;justify-content:center;font-weight:bold;color:#8B90A0;font-size:.95rem;margin-bottom:10px;';
    board.appendChild(hud);

    const pileZone = document.createElement('div');
    pileZone.style.cssText = 'display:flex;gap:10px;justify-content:center;margin-bottom:8px;';
    board.appendChild(pileZone);

    const note = document.createElement('div');
    note.style.cssText = 'font-size:.75rem;color:#8B90A0;text-align:center;margin-bottom:14px;';
    note.textContent = 'Règle magique : écart exact de 10 permis dans l’autre sens (↑ accepte −10, ↓ accepte +10).';
    board.appendChild(note);

    const handLbl = document.createElement('div');
    handLbl.style.cssText = 'font-weight:bold;font-size:.8rem;letter-spacing:.14em;text-transform:uppercase;color:#8B90A0;margin-bottom:6px;';
    handLbl.textContent = 'Votre main :';
    board.appendChild(handLbl);

    const handZone = document.createElement('div');
    handZone.style.cssText = 'display:flex;flex-wrap:wrap;gap:10px;justify-content:center;max-width:420px;';
    board.appendChild(handZone);

    function legal(card, pile) {
        return pile.dir === 1
            ? (card > pile.val || card === pile.val - 10)
            : (card < pile.val || card === pile.val + 10);
    }
    function anyMove() {
        return hand.some(c => piles.some(p => legal(c, p)));
    }

    function renderHud() {
        hud.innerHTML = `<span>Pioche : <b style="color:#4A6CFA">${deck.length}</b></span>` +
            `<span>Main : <b style="color:#4A6CFA">${hand.length}</b></span>`;
    }

    const pileEls = piles.map((pile, pi) => {
        const el = _laSuitePileEl(pile.dir);
        el.addEventListener('pointerdown', (e) => {
            e.preventDefault();
            if (isPaused) return;
            if (selected < 0 || selected >= hand.length) {
                resultDisplay.textContent = 'Choisis d’abord une carte de ta main.';
                resultDisplay.style.color = '#8B90A0';
                setTimeout(() => { if (!isPaused && resultDisplay.textContent === 'Choisis d’abord une carte de ta main.') resultDisplay.textContent = ''; }, 1100);
                return;
            }
            const card = hand[selected];
            if (legal(card, pile)) {
                pile.val = card;
                hand.splice(selected, 1);
                if (deck.length > 0) hand.push(deck.shift());
                selected = -1;
                haptic(10);
                el.style.transform = 'scale(1.1)';
                setTimeout(() => { el.style.transform = ''; }, 150);
                render();
                if (deck.length === 0 && hand.length === 0) {
                    endGame('Toutes les cartes sont posées — la suite est parfaite !', true);
                    return;
                }
                if (!anyMove()) {
                    endGame(`Plus aucun coup possible — il restait ${deck.length + hand.length} cartes.`, false);
                }
            } else {
                haptic(50);
                _laSuiteShake(el);
            }
        });
        pileZone.appendChild(el);
        return el;
    });

    function renderPiles() {
        piles.forEach((p, i) => { pileEls[i]._num.textContent = p.val; });
    }

    function renderHand() {
        handZone.innerHTML = '';
        hand.forEach((card, i) => {
            const c = _laSuiteCardEl(card, false);
            if (i === selected) {
                c.style.boxShadow = '0 0 0 3px #FFFFFF, 0 0 0 6px #F5B227';
                c.style.transform = 'translateY(-6px)';
            }
            c.addEventListener('pointerdown', (e) => {
                e.preventDefault();
                if (isPaused) return;
                selected = (selected === i) ? -1 : i;
                haptic(6);
                renderHand();
            });
            handZone.appendChild(c);
        });
    }

    function render() {
        renderHud();
        renderPiles();
        renderHand();
    }

    render();
}
