function showExampleGuessNumber(day, row, vals) {
    // UI Preview in menu
    const desc = document.createElement('div');
    desc.innerHTML = 'Trouvez le nombre caché !<br>Aidez-vous des indices Plus/Moins.';
    desc.style.textAlign = 'center';
    desc.style.fontWeight = 'bold';
    desc.style.color = '#333';

    row.style.flexDirection = 'column';
    row.append(desc);
}

function startGameGuessNumber() {
    board.style.display = 'flex';
    board.style.flexDirection = 'column';
    board.style.alignItems = 'center';

    currentRound = 1;
    totalRounds = 3;
    const roundMaxes = [10, 20, 50]; // Limits for the 3 rounds

    window.startGuessRound = function () {
        board.innerHTML = '';

        const currentMax = roundMaxes[currentRound - 1];
        const targetNum = Math.floor(Math.random() * currentMax) + 1;

        const header = document.createElement('div');
        header.style.cssText = 'font-size: 1.5rem; font-weight: bold; margin-bottom: 10px; color: #333; text-align: center;';
        header.innerHTML = `Round ${currentRound}/3<br><span style="color:#007bff">Trouvez le nombre entre 1 et ${currentMax}</span>`;
        board.appendChild(header);

        const hintSpan = document.createElement('div');
        hintSpan.style.cssText = 'font-size: 1.2rem; font-weight: bold; color: #ff9800; margin-bottom: 20px; height: 1.5em;';
        hintSpan.textContent = 'Faites une proposition !';
        board.appendChild(hintSpan);

        const itemsCont = document.createElement('div');
        itemsCont.style.cssText = 'display:flex; gap:10px; flex-wrap:wrap; justify-content:center; max-width: 800px;';

        // Generate integer items from 1 to currentMax
        let vals = Array.from({ length: currentMax }, (_, i) => i + 1);

        vals.forEach(val => {
            const item = document.createElement('div');
            item.className = 'item type-numbers';
            item.style.cursor = 'pointer';
            item.style.margin = '0';
            applyStyle(item, 'numbers', val);

            item.addEventListener('pointerdown', (e) => {
                e.preventDefault();
                // Prevent clicking if paused, already matched, or already clicked (error)
                if (isPaused || item.classList.contains('matched') || item.classList.contains('error')) return;

                if (val === targetNum) {
                    item.style.boxShadow = '0 0 0 4px #28a745';
                    item.classList.add('matched');
                    hintSpan.textContent = 'Correct !';
                    hintSpan.style.color = '#28a745';

                    // Lock all remaining items
                    Array.from(itemsCont.children).forEach(child => child.style.pointerEvents = 'none');

                    currentRound++;
                    if (currentRound > totalRounds) {
                        setTimeout(() => endGame('Gagné !', true), 800);
                    } else {
                        setTimeout(() => window.startGuessRound(), 1200);
                    }
                } else if (val < targetNum) {
                    item.classList.add('error');
                    item.style.opacity = '0.3';
                    hintSpan.textContent = "C'est PLUS ! ⬆️";
                } else {
                    item.classList.add('error');
                    item.style.opacity = '0.3';
                    hintSpan.textContent = "C'est MOINS ! ⬇️";
                }
            });
            itemsCont.appendChild(item);
        });

        board.appendChild(itemsCont);
    };

    window.startGuessRound();
}