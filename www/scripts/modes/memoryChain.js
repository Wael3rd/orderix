// ─── Mode : Tri de Mémoire ───────────────────────────────────────
// Refonte du Tri Flash sur l'interaction chaîne : des cartes-nombres
// sont visibles quelques secondes (barre de temps), puis masquées.
// Taper les cartes masquées dans l'ordre croissant : chaque tap
// révèle la carte — bonne, elle reste ; mauvaise, elle se re-masque
// après 800 ms et coûte une vie. Manche 1 : 6 cartes / 2,5 s.
// Manche 2 : 8 cartes / 3 s. 3 vies.

function _memoryChainCard(val) {
    const c = document.createElement('div');
    c.style.cssText = 'position:relative;width:58px;height:74px;border-radius:12px;flex-shrink:0;' +
        'display:flex;align-items:center;justify-content:center;font-weight:900;font-size:1.35rem;' +
        'user-select:none;touch-action:manipulation;transition:transform .12s;';
    c.dataset.value = val;
    _memoryChainShow(c, val);
    return c;
}

function _memoryChainShow(card, val) {
    card.textContent = val;
    card.style.background = '#FFFFFF';
    card.style.border = '2px solid #C9D4FB';
    card.style.color = '#23262F';
}

function _memoryChainMask(card) {
    card.textContent = '?';
    card.style.background = '#3553D1';
    card.style.border = '2px solid #3553D1';
    card.style.color = 'rgba(255,255,255,.55)';
}

function showExampleMemoryChain(day, row, vals) {
    const ex = document.createElement('div');
    ex.style.cssText = 'display:flex;gap:10px;justify-content:center;align-items:center;margin:6px auto;padding-bottom:20px;';
    const nums = [12, 34, 57, 80];
    nums.forEach((v, i) => {
        const card = _memoryChainCard(v);
        if (i === 0) {
            const badge = document.createElement('div');
            badge.className = 'badge';
            badge.textContent = '1';
            card.appendChild(badge);
            card.style.borderColor = '#34B871';
        } else {
            _memoryChainMask(card);
        }
        ex.appendChild(card);
    });
    row.style.flexDirection = 'column';
    row.append(ex);
}

function startGameMemoryChain() {
    board.style.display = 'flex';
    board.style.flexDirection = 'column';
    board.style.alignItems = 'center';

    let lives = 3;
    let round = 1;
    const totalRoundsMemo = 2;

    const hud = document.createElement('div');
    hud.style.cssText = 'display:flex;gap:18px;align-items:center;justify-content:center;font-weight:bold;color:#8B90A0;font-size:.95rem;margin-bottom:10px;';
    board.appendChild(hud);

    const consigne = document.createElement('div');
    consigne.style.cssText = 'font-weight:bold;font-size:.85rem;letter-spacing:.1em;text-transform:uppercase;color:#8B90A0;margin-bottom:10px;text-align:center;';
    board.appendChild(consigne);

    const barWrap = document.createElement('div');
    barWrap.className = 'timebar-wrap';
    const bar = document.createElement('div');
    bar.className = 'timebar';
    barWrap.appendChild(bar);
    board.appendChild(barWrap);

    const grid = document.createElement('div');
    grid.style.cssText = 'display:flex;flex-wrap:wrap;gap:12px;row-gap:32px;justify-content:center;max-width:320px;padding-bottom:24px;';
    board.appendChild(grid);

    function renderHud(found, total) {
        hud.innerHTML = `<span>Manche <b style="color:#23262F">${round}/${totalRoundsMemo}</b></span>` +
            `<span>Trouvées <b style="color:#4A6CFA">${found}/${total}</b></span>` +
            `<span style="color:#E0533D;letter-spacing:2px">${'♥'.repeat(lives)}${'♡'.repeat(3 - lives)}</span>`;
    }

    function startRound() {
        const count = round === 1 ? 6 : 8;
        const memoMs = round === 1 ? 2500 : 3000;

        // Valeurs uniques 1..99
        const pool = [];
        for (let i = 1; i <= 99; i++) pool.push(i);
        pool.sort(() => Math.random() - 0.5);
        const vals = pool.slice(0, count);
        const sorted = [...vals].sort((a, b) => a - b);
        let nextIdx = 0;
        let locked = true; // verrouillé pendant la mémorisation

        renderHud(0, count);
        consigne.textContent = 'Mémorisez les nombres !';
        barWrap.style.display = '';
        grid.innerHTML = '';
        const cards = vals.map(v => {
            const card = _memoryChainCard(v);
            grid.appendChild(card);
            return card;
        });

        cards.forEach(card => {
            const val = parseInt(card.dataset.value, 10);
            card.addEventListener('click', () => {
                if (isPaused || locked || card.dataset.done === '1') return;

                _memoryChainShow(card, val);
                if (val === sorted[nextIdx]) {
                    // Bonne carte : elle reste révélée, badge vert
                    card.dataset.done = '1';
                    card.style.borderColor = '#34B871';
                    const badge = document.createElement('div');
                    badge.className = 'badge';
                    badge.textContent = nextIdx + 1;
                    card.appendChild(badge);
                    nextIdx++;
                    haptic(8);
                    renderHud(nextIdx, count);

                    if (nextIdx >= count) {
                        if (round < totalRoundsMemo) {
                            round++;
                            resultDisplay.textContent = 'Toutes retrouvées — manche suivante !';
                            resultDisplay.style.color = '#34B871';
                            haptic([12, 40, 12]);
                            gameTimeout = setTimeout(() => {
                                if (isPaused) return;
                                resultDisplay.textContent = '';
                                startRound();
                            }, 900);
                        } else {
                            endGame('Mémoire sans faille !', true);
                        }
                    }
                } else {
                    // Mauvaise carte : elle se re-masque après 800 ms
                    lives--;
                    haptic(50);
                    card.style.animation = 'wobble .3s';
                    card.style.borderColor = '#E0533D';
                    renderHud(nextIdx, count);

                    if (lives <= 0) {
                        // Tout révéler, entourer la bonne
                        cards.forEach(c2 => {
                            _memoryChainShow(c2, parseInt(c2.dataset.value, 10));
                            if (parseInt(c2.dataset.value, 10) === sorted[nextIdx]) {
                                c2.style.boxShadow = '0 0 0 3px #FFFFFF, 0 0 0 6px #34B871';
                            }
                        });
                        endGame('Plus de vies — la bonne carte est entourée.', false);
                        return;
                    }
                    locked = true;
                    gameTimeout = setTimeout(() => {
                        card.style.animation = '';
                        _memoryChainMask(card);
                        locked = false;
                    }, 800);
                }
            });
        });

        // Phase de mémorisation : barre de temps qui se vide
        let left = memoMs;
        bar.style.width = '100%';
        clearInterval(window.speedTimer);
        window.speedTimer = setInterval(() => {
            if (isPaused) return;
            left -= 50;
            bar.style.width = `${Math.max(0, (left / memoMs) * 100)}%`;
            if (left <= 0) {
                clearInterval(window.speedTimer);
                barWrap.style.display = 'none';
                consigne.textContent = 'Tapez les cartes dans l’ordre croissant !';
                cards.forEach(c => _memoryChainMask(c));
                locked = false;
            }
        }, 50);
    }

    startRound();
}
