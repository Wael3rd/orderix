// ─── Mode : Le Juste Prix ────────────────────────────────────────
function showExampleGuessNumber(day, row, vals) {
    const ex = document.createElement('div');
    ex.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:8px;margin:6px auto;';

    const hint = document.createElement('div');
    hint.style.cssText = 'font-weight:bold;color:#E0533D;font-size:1rem;';
    hint.textContent = '« C\'est PLUS ! ⬆ »';

    const items = document.createElement('div');
    items.style.cssText = 'display:flex;gap:8px;';
    [3, 7, 12].forEach((v, idx) => {
        const item = document.createElement('div');
        item.className = 'item type-numbers';
        item.style.margin = '0';
        applyStyle(item, 'numbers', v);
        if (idx === 0) item.style.opacity = '0.3';
        items.appendChild(item);
    });

    ex.append(items, hint);
    row.style.flexDirection = 'column';
    row.append(ex);
}

function startGameGuessNumber() {
    board.style.display = 'flex';
    board.style.flexDirection = 'column';
    board.style.alignItems = 'center';

    currentRound = 1;
    totalRounds = 3;
    const roundMaxes = [10, 20, 50]; // plages des 3 manches

    window.startGuessRound = function () {
        board.innerHTML = '';

        const currentMax = roundMaxes[currentRound - 1];
        const targetNum = Math.floor(Math.random() * currentMax) + 1;

        const header = document.createElement('div');
        header.style.cssText = 'font-size: 1.3rem; font-weight: bold; margin-bottom: 10px; color: #23262F; text-align: center;';
        header.innerHTML = `<span style="font-size:.9rem;color:#9AA0AE;letter-spacing:.15em;text-transform:uppercase;">Manche ${currentRound}/3</span><br><span style="color:#4A6CFA">Trouvez le nombre entre 1 et ${currentMax}</span>`;
        board.appendChild(header);

        const hintSpan = document.createElement('div');
        hintSpan.style.cssText = 'font-size: 1.15rem; font-weight: bold; color: #E0533D; margin-bottom: 20px; height: 1.5em;';
        hintSpan.textContent = 'Faites une proposition !';
        board.appendChild(hintSpan);

        const itemsCont = document.createElement('div');
        itemsCont.style.cssText = 'display:flex; gap:10px; flex-wrap:wrap; justify-content:center; max-width: 800px;';

        let vals = Array.from({ length: currentMax }, (_, i) => i + 1);

        vals.forEach(val => {
            const item = document.createElement('div');
            item.className = 'item type-numbers';
            item.style.cursor = 'pointer';
            item.style.margin = '0';
            applyStyle(item, 'numbers', val);

            item.addEventListener('pointerdown', (e) => {
                e.preventDefault();
                if (isPaused || item.classList.contains('matched') || item.classList.contains('error')) return;

                if (val === targetNum) {
                    item.style.boxShadow = '0 0 0 3px #FFFFFF, 0 0 0 6px #34B871';
                    item.classList.add('matched');
                    item.style.opacity = '1';
                    hintSpan.textContent = 'Trouvé !';
                    hintSpan.style.color = '#34B871';
                    haptic([12, 30, 12]);

                    Array.from(itemsCont.children).forEach(child => child.style.pointerEvents = 'none');

                    currentRound++;
                    if (currentRound > totalRounds) {
                        setTimeout(() => endGame('Les trois nombres sont tombés !', true), 800);
                    } else {
                        setTimeout(() => { if (!isPaused) window.startGuessRound(); }, 1200);
                    }
                } else if (val < targetNum) {
                    item.classList.add('error');
                    item.style.opacity = '0.3';
                    hintSpan.textContent = "C'est PLUS ! ⬆";
                    haptic(20);
                } else {
                    item.classList.add('error');
                    item.style.opacity = '0.3';
                    hintSpan.textContent = "C'est MOINS ! ⬇";
                    haptic(20);
                }
            });
            itemsCont.appendChild(item);
        });

        board.appendChild(itemsCont);
    };

    window.startGuessRound();
}
