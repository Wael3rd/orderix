// ─── Mode : Duel ─────────────────────────────────────────────────
// Duel contre la montre (aucun adversaire CPU) : 2 piles centrales,
// on pose une carte de sa main si sa valeur = pile ±1 (pas de
// bouclage 12↔1). Un tap sur une carte jouable la pose sur la
// première pile compatible ; la main se recomplète depuis la pioche.
// Lisibilité : cartes jouables en anneau vert pulsant, injouables
// estompées, rappel « pose N-1 ou N+1 » sous chaque pile.
// Blocage : bouton or « Changer les piles (-3 s) ».
// Victoire : pioche + main vidées avant la fin des 45 secondes.

function _duelCardEl(val, big) {
    const c = document.createElement('div');
    const w = big ? 70 : 54, h = big ? 92 : 70;
    c.style.cssText = `width:${w}px;height:${h}px;border-radius:12px;background:#4A6CFA;color:#FFFFFF;` +
        `font-weight:900;font-size:${big ? '1.8rem' : '1.35rem'};display:flex;align-items:center;` +
        `justify-content:center;flex-shrink:0;user-select:none;touch-action:manipulation;` +
        `box-shadow:0 2px 6px rgba(35,38,47,.18);transition:opacity .15s ease,box-shadow .15s ease;`;
    c.textContent = val;
    return c;
}

// Rappel sous une pile : « pose 5 ou 7 » (bords 1 et 12 gérés)
function _duelHintText(v) {
    if (v <= 1) return 'pose 2';
    if (v >= 12) return 'pose 11';
    return `pose ${v - 1} ou ${v + 1}`;
}

function showExampleDuel(day, row, vals) {
    const ex = document.createElement('div');
    ex.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:10px;margin:6px auto;';

    // Une pile « 6 » avec son rappel
    const pileCol = document.createElement('div');
    pileCol.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:4px;';
    const pile = _duelCardEl(6, false);
    pile.style.width = '50px';
    pile.style.height = '64px';
    pile.style.fontSize = '1.2rem';
    const hint = document.createElement('div');
    hint.style.cssText = 'font-size:.72rem;color:#8B90A0;font-weight:bold;';
    hint.textContent = _duelHintText(6);
    pileCol.append(pile, hint);

    // 3 cartes de main : 5 et 7 jouables (vert), 9 estompée
    const hand = document.createElement('div');
    hand.style.cssText = 'display:flex;gap:8px;';
    [5, 7, 9].forEach(v => {
        const c = _duelCardEl(v, false);
        c.style.width = '42px';
        c.style.height = '54px';
        c.style.fontSize = '1.05rem';
        if (v === 9) {
            c.style.opacity = '0.45';
        } else {
            c.style.boxShadow = '0 0 0 3px #FFFFFF, 0 0 0 6px #34B871';
        }
        hand.appendChild(c);
    });

    const lbl = document.createElement('div');
    lbl.style.cssText = 'font-size:.8rem;color:#8B90A0;font-weight:bold;';
    lbl.textContent = 'Tape une carte verte pour la poser';

    ex.append(pileCol, hand, lbl);
    row.style.flexDirection = 'column';
    row.append(ex);
}

function startGameDuel() {
    board.style.display = 'flex';
    board.style.flexDirection = 'column';
    board.style.alignItems = 'center';

    // ── Cartes : pioche de 14 (valeurs 1..12, répétitions OK), main de 5 ──
    const rCard = () => 1 + Math.floor(Math.random() * 12);
    const rPile = () => 3 + Math.floor(Math.random() * 8); // 3..10
    let deck = Array.from({ length: 14 }, rCard);
    let hand = deck.splice(0, 5);
    const piles = [rPile(), rPile()];
    let over = false;

    // ── Chrono : 45 s au total ──
    const TOTAL = 45000;
    let timeLeft = TOTAL;

    // ── Interface (rendu synchrone dans board) ──
    const hud = document.createElement('div');
    hud.style.cssText = 'font-weight:bold;color:#8B90A0;font-size:.95rem;margin-bottom:8px;';
    board.appendChild(hud);

    const barWrap = document.createElement('div');
    barWrap.className = 'timebar-wrap';
    const bar = document.createElement('div');
    bar.className = 'timebar';
    barWrap.appendChild(bar);
    board.appendChild(barWrap);

    const pileZone = document.createElement('div');
    pileZone.style.cssText = 'display:flex;gap:18px;justify-content:center;margin-bottom:14px;';
    board.appendChild(pileZone);

    const pileEls = [];
    const hintEls = [];
    piles.forEach(() => {
        const col = document.createElement('div');
        col.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:5px;';
        const p = _duelCardEl(0, true);
        p.style.pointerEvents = 'none';
        const h = document.createElement('div');
        h.style.cssText = 'font-size:.78rem;color:#8B90A0;font-weight:bold;';
        col.append(p, h);
        pileZone.appendChild(col);
        pileEls.push(p);
        hintEls.push(h);
    });

    // Bouton de déblocage (or), masqué par défaut
    const swapBtn = document.createElement('button');
    swapBtn.style.cssText = 'display:none;border:none;border-radius:12px;background:#F5B227;color:#23262F;' +
        'font-weight:900;font-size:.95rem;padding:12px 18px;margin-bottom:12px;cursor:pointer;' +
        'box-shadow:0 3px 0 #C88F12;touch-action:manipulation;user-select:none;font-family:inherit;';
    swapBtn.textContent = 'Changer les piles (-3 s)';
    board.appendChild(swapBtn);

    const handLbl = document.createElement('div');
    handLbl.style.cssText = 'font-weight:bold;font-size:.78rem;letter-spacing:.14em;text-transform:uppercase;color:#8B90A0;margin-bottom:6px;';
    handLbl.textContent = 'Votre main';
    board.appendChild(handLbl);

    const handZone = document.createElement('div');
    handZone.style.cssText = 'display:flex;gap:10px;justify-content:center;flex-wrap:wrap;max-width:420px;min-height:74px;';
    board.appendChild(handZone);

    // ── Logique ──
    function legalPile(card) {
        if (Math.abs(card - piles[0]) === 1) return 0;
        if (Math.abs(card - piles[1]) === 1) return 1;
        return -1;
    }
    const isBlocked = () => hand.length > 0 && !hand.some(c => legalPile(c) >= 0);

    function renderHud() {
        hud.innerHTML = `Pioche : <b style="color:#4A6CFA">${deck.length}</b>`;
    }
    function renderPiles() {
        piles.forEach((v, i) => {
            pileEls[i].textContent = v;
            hintEls[i].textContent = _duelHintText(v);
        });
    }
    function renderHand() {
        handZone.innerHTML = '';
        hand.forEach((card, i) => {
            const c = _duelCardEl(card, false);
            const playable = legalPile(card) >= 0;
            if (playable) {
                c.style.boxShadow = '0 0 0 3px #FFFFFF, 0 0 0 6px #34B871';
                c.classList.add('pulse-anim');
            } else {
                c.style.opacity = '0.45';
            }
            c.addEventListener('pointerdown', (e) => {
                e.preventDefault();
                if (isPaused || over) return;
                playCard(i, c);
            });
            handZone.appendChild(c);
        });
    }
    function renderAll() {
        renderHud();
        renderPiles();
        renderHand();
        swapBtn.style.display = isBlocked() ? 'block' : 'none';
    }

    function playCard(i, el) {
        const card = hand[i];
        const pi = legalPile(card);
        if (pi < 0) {
            // Carte injouable : petit rappel visuel, aucune pénalité
            el.style.animation = 'wobble .3s';
            setTimeout(() => { el.style.animation = ''; }, 320);
            return;
        }
        piles[pi] = card;
        hand.splice(i, 1);
        if (deck.length > 0) hand.push(deck.shift());
        haptic(8);
        pileEls[pi].style.boxShadow = '0 0 0 3px #FFFFFF, 0 0 0 6px #34B871';
        setTimeout(() => { pileEls[pi].style.boxShadow = ''; }, 300);
        renderAll();
        if (deck.length === 0 && hand.length === 0) {
            over = true;
            clearInterval(window.speedTimer);
            endGame('Toutes les cartes posées avant la fin du chrono — bravo !', true);
        }
    }

    // Re-tire les 2 piles (garantit au moins une carte jouable pour éviter tout blocage définitif)
    function swapPiles() {
        if (isPaused || over) return;
        haptic(50);
        timeLeft -= 3000;
        let ok = false;
        for (let t = 0; t < 30 && !ok; t++) {
            piles[0] = rPile();
            piles[1] = rPile();
            ok = hand.some(c => legalPile(c) >= 0);
        }
        if (!ok && hand.length > 0) {
            // Filet de sécurité : forcer une pile compatible avec la 1re carte
            piles[0] = hand[0] > 1 ? hand[0] - 1 : hand[0] + 1;
        }
        renderAll();
        if (timeLeft <= 0) loseOnTime();
    }
    swapBtn.addEventListener('pointerdown', (e) => { e.preventDefault(); swapPiles(); });

    function loseOnTime() {
        if (over) return;
        over = true;
        clearInterval(window.speedTimer);
        const rest = deck.length + hand.length;
        endGame(`Temps écoulé — plus que ${rest} carte${rest > 1 ? 's' : ''}, la victoire était toute proche !`, false);
    }

    // ── Chrono (pas de décrément en pause) ──
    const step = 100;
    clearInterval(window.speedTimer);
    window.speedTimer = setInterval(() => {
        if (isPaused || over) return;
        timeLeft -= step;
        bar.style.width = `${Math.max(0, (timeLeft / TOTAL) * 100)}%`;
        if (timeLeft <= 0) loseOnTime();
    }, step);

    renderAll();
}
