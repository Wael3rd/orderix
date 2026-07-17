// ─── Mode : Duel ─────────────────────────────────────────────────
// Inspiré de Speed / Ligretto : 2 piles centrales (1..12), on pose
// une carte si sa valeur = pile ±1 (pas de bouclage 12↔1). L'IA pose
// une carte légale toutes les 2200 ms (accélère de 60 ms par pose,
// plancher 1200 ms). Blocage des deux camps : les piles se
// réinitialisent après 1 s. Victoire : vider pioche + main avant elle.

function _duelCardEl(val, small) {
    const c = document.createElement('div');
    const w = small ? 42 : 54, h = small ? 54 : 68;
    c.style.cssText = `width:${w}px;height:${h}px;border-radius:10px;background:#4A6CFA;color:#FFFFFF;` +
        `font-weight:900;font-size:${small ? '1.05rem' : '1.25rem'};display:flex;align-items:center;` +
        `justify-content:center;flex-shrink:0;user-select:none;touch-action:manipulation;` +
        `transition:transform .12s ease,box-shadow .12s ease;`;
    c.textContent = val;
    return c;
}

function _duelPileEl(val) {
    const p = document.createElement('div');
    p.style.cssText = 'width:64px;height:82px;border-radius:12px;background:#EEF2FF;border:2px solid #3553D1;' +
        'display:flex;align-items:center;justify-content:center;font-weight:900;color:#23262F;' +
        'font-size:1.5rem;flex-shrink:0;transition:box-shadow .15s;';
    p.textContent = val;
    return p;
}

function showExampleDuel(day, row, vals) {
    const ex = document.createElement('div');
    ex.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:10px;margin:6px auto;';

    const piles = document.createElement('div');
    piles.style.cssText = 'display:flex;gap:12px;';
    [7, 3].forEach(v => {
        const p = _duelPileEl(v);
        p.style.width = '50px';
        p.style.height = '64px';
        p.style.fontSize = '1.15rem';
        piles.appendChild(p);
    });

    const hand = document.createElement('div');
    hand.style.cssText = 'display:flex;gap:8px;align-items:center;font-weight:bold;color:#8B90A0;font-size:.85rem;';
    const c = _duelCardEl(8, true);
    c.style.boxShadow = '0 0 0 3px #FFFFFF, 0 0 0 5px #F5B227';
    hand.append(c, document.createTextNode('→ pose sur 7 (±1), plus vite qu’elle !'));

    ex.append(piles, hand);
    row.style.flexDirection = 'column';
    row.append(ex);
}

function startGameDuel() {
    board.style.display = 'flex';
    board.style.flexDirection = 'column';
    board.style.alignItems = 'center';

    const r12 = () => 1 + Math.floor(Math.random() * 12);
    let playerDeck = Array.from({ length: 12 }, r12);
    let hand = playerDeck.splice(0, 4);
    let aiCards = Array.from({ length: 12 }, r12);
    const piles = [r12(), r12()];
    let aiDelay = 2200;
    let blocking = false;

    const hud = document.createElement('div');
    hud.style.cssText = 'display:flex;gap:18px;align-items:center;justify-content:center;font-weight:bold;color:#8B90A0;font-size:.95rem;margin-bottom:12px;';
    board.appendChild(hud);

    const pileZone = document.createElement('div');
    pileZone.style.cssText = 'display:flex;gap:14px;justify-content:center;margin-bottom:16px;';
    board.appendChild(pileZone);

    const handLbl = document.createElement('div');
    handLbl.style.cssText = 'font-weight:bold;font-size:.8rem;letter-spacing:.14em;text-transform:uppercase;color:#8B90A0;margin-bottom:6px;';
    handLbl.textContent = 'Votre main :';
    board.appendChild(handLbl);

    const handZone = document.createElement('div');
    handZone.style.cssText = 'display:flex;gap:10px;justify-content:center;flex-wrap:wrap;max-width:420px;';
    board.appendChild(handZone);

    const pileEls = piles.map(v => {
        const el = _duelPileEl(v);
        pileZone.appendChild(el);
        return el;
    });

    function renderHud() {
        hud.innerHTML = `<span>Vous : <b style="color:#4A6CFA">${playerDeck.length + hand.length}</b></span>` +
            `<span>Elle : <b style="color:#E0533D">${aiCards.length}</b></span>`;
    }
    function renderPiles() {
        piles.forEach((v, i) => { pileEls[i].textContent = v; });
    }

    function legalPile(card) {
        if (Math.abs(card - piles[0]) === 1) return 0;
        if (Math.abs(card - piles[1]) === 1) return 1;
        return -1;
    }

    function flashPile(i, color) {
        pileEls[i].style.boxShadow = `0 0 0 3px #FFFFFF, 0 0 0 6px ${color}`;
        setTimeout(() => { pileEls[i].style.boxShadow = ''; }, 400);
    }

    function renderHand() {
        handZone.innerHTML = '';
        hand.forEach((card, i) => {
            const c = _duelCardEl(card, false);
            c.addEventListener('pointerdown', (e) => {
                e.preventDefault();
                if (isPaused) return;
                const pi = legalPile(card);
                if (pi >= 0) {
                    piles[pi] = card;
                    hand.splice(i, 1);
                    if (playerDeck.length > 0) hand.push(playerDeck.shift());
                    haptic(10);
                    flashPile(pi, '#34B871');
                    renderAll();
                    if (playerDeck.length === 0 && hand.length === 0) {
                        clearInterval(window.speedTimer);
                        endGame('Pioche vidée avant elle — duel remporté !', true);
                        return;
                    }
                    checkBlock();
                } else {
                    haptic(50);
                    c.style.animation = 'wobble .3s';
                    c.style.boxShadow = '0 0 0 3px #FFFFFF, 0 0 0 6px #E0533D';
                    setTimeout(() => { c.style.animation = ''; c.style.boxShadow = ''; }, 320);
                }
            });
            handZone.appendChild(c);
        });
    }

    function renderAll() {
        renderHud();
        renderPiles();
        renderHand();
    }

    function aiTick() {
        if (isPaused || blocking) return;
        const i = aiCards.findIndex(c => legalPile(c) >= 0);
        if (i >= 0) {
            const card = aiCards.splice(i, 1)[0];
            const pi = legalPile(card);
            piles[pi] = card;
            flashPile(pi, '#F5B227');
            aiDelay = Math.max(1200, aiDelay - 60);
            scheduleAI();
            renderAll();
            if (aiCards.length === 0) {
                clearInterval(window.speedTimer);
                endGame('Elle a vidé sa pioche juste avant vous — revanche demain !', false);
                return;
            }
        }
        checkBlock();
    }

    function scheduleAI() {
        clearInterval(window.speedTimer);
        window.speedTimer = setInterval(aiTick, aiDelay);
    }

    function checkBlock() {
        if (blocking) return;
        const pCan = hand.some(c => legalPile(c) >= 0);
        const aCan = aiCards.some(c => legalPile(c) >= 0);
        if (pCan || aCan) return;
        blocking = true;
        resultDisplay.textContent = 'Blocage — nouvelles piles !';
        resultDisplay.style.color = '#F5B227';
        gameTimeout = setTimeout(function resetPiles() {
            if (isPaused) { gameTimeout = setTimeout(resetPiles, 400); return; }
            piles[0] = r12();
            piles[1] = r12();
            blocking = false;
            if (resultDisplay.textContent === 'Blocage — nouvelles piles !') resultDisplay.textContent = '';
            renderAll();
            checkBlock();
        }, 1000);
    }

    renderAll();
    scheduleAI();
}
