// ─── Mode phare : La Chaîne ──────────────────────────────────────
// Table de Schulte × Orderix : toucher les éléments dans l'ordre
// croissant, sans casser la chaîne. Les éléments trouvés restent
// visibles (balayage visuel parmi le « bruit », principe Schulte).
// 3 manches de plus en plus denses, 3 vies pour toute la partie.

function showExampleOrderChain(day, row, vals) {
    const ex = document.createElement('div');
    ex.style.cssText = 'display:flex;gap:12px;justify-content:center;align-items:center;margin:6px auto;';
    const sorted = [...vals].sort((a, b) => a - b).slice(0, 4);
    // ordre d'affichage mélangé, les 2 premiers maillons déjà trouvés
    const display = [sorted[2], sorted[0], sorted[3], sorted[1]];
    display.forEach(val => {
        const item = document.createElement('div');
        item.className = `item type-${day.type}`;
        item.style.margin = '0';
        applyStyle(item, day.type, val);
        const rank = sorted.indexOf(val);
        if (rank <= 1) {
            item.classList.add('chain-done');
            const badge = document.createElement('div');
            badge.className = 'badge';
            badge.textContent = rank + 1;
            item.appendChild(badge);
        }
        if (rank === 2) item.style.boxShadow = '0 0 0 3px #FFFFFF, 0 0 0 6px #4A6CFA';
        ex.appendChild(item);
    });
    row.style.flexDirection = 'column';
    row.append(ex);
}

function startGameOrderChain() {
    board.style.display = 'flex';
    board.style.flexDirection = 'column';
    board.style.alignItems = 'center';

    let lives = 3;
    currentRound = 1;
    totalRounds = 3;
    const tType = currentDayConfig.type;

    // Densité croissante par manche (bornée par la taille du pool du type)
    const targetCounts = [
        Math.max(5, Math.round(activeItemCount * 0.8)),
        Math.max(6, Math.round(activeItemCount * 1.1)),
        Math.max(7, Math.round(activeItemCount * 1.5))
    ];

    const hud = document.createElement('div');
    hud.style.cssText = 'display:flex;gap:18px;align-items:center;justify-content:center;font-weight:bold;color:#8B90A0;font-size:.95rem;margin-bottom:12px;';
    board.appendChild(hud);

    const grid = document.createElement('div');
    grid.style.cssText = 'display:flex;flex-wrap:wrap;column-gap:14px;row-gap:32px;justify-content:center;max-width:420px;';
    board.appendChild(grid);

    function renderHud(nextIdx, total) {
        hud.innerHTML = `<span>Manche <b style="color:#23262F">${currentRound}/${totalRounds}</b></span>` +
            `<span>Chaîne <b style="color:#4A6CFA">${nextIdx}/${total}</b></span>` +
            `<span style="color:#E0533D;letter-spacing:2px">${'♥'.repeat(lives)}${'♡'.repeat(3 - lives)}</span>`;
    }

    window.startChainRound = function () {
        grid.innerHTML = '';
        const vals = generateValues(tType, targetCounts[currentRound - 1]);
        const sorted = [...vals].sort((a, b) => a - b);
        const shuffled = [...vals].sort(() => Math.random() - 0.5);
        let nextIdx = 0;
        renderHud(0, sorted.length);

        shuffled.forEach(val => {
            const item = document.createElement('div');
            item.className = `item type-${tType}`;
            item.style.margin = '0';
            item.dataset.value = val;
            applyStyle(item, tType, val);

            item.addEventListener('click', () => {
                if (isPaused || item.classList.contains('chain-done')) return;

                if (Math.abs(val - sorted[nextIdx]) < 0.0001) {
                    // Maillon suivant trouvé : l'élément reste visible mais s'éteint
                    item.classList.add('chain-done');
                    const badge = document.createElement('div');
                    badge.className = 'badge';
                    badge.textContent = nextIdx + 1;
                    item.appendChild(badge);
                    nextIdx++;
                    haptic(8);
                    renderHud(nextIdx, sorted.length);

                    if (nextIdx >= sorted.length) {
                        if (currentRound < totalRounds) {
                            currentRound++;
                            resultDisplay.textContent = 'Chaîne complète — manche suivante !';
                            resultDisplay.style.color = '#34B871';
                            haptic([12, 40, 12]);
                            setTimeout(() => {
                                if (isPaused) return;
                                resultDisplay.textContent = '';
                                window.startChainRound();
                            }, 650);
                        } else {
                            endGame('Les trois chaînes sont complètes !', true);
                        }
                    }
                } else {
                    // Chaîne cassée : une vie en moins, la partie continue
                    lives--;
                    haptic(50);
                    item.classList.add('error');
                    setTimeout(() => item.classList.remove('error'), 350);
                    renderHud(nextIdx, sorted.length);

                    if (lives <= 0) {
                        showSolutionHighlight([sorted[nextIdx]]);
                        endGame('Plus de vies — le maillon suivant est entouré.', false);
                    }
                }
            });
            grid.appendChild(item);
        });
    };

    window.startChainRound();
}
