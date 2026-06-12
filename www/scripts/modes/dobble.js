// ─── Mode : Symbole Commun ───────────────────────────────────────
function showExampleDobble(day, row, vals) {
    const tType = day.type || 'numbers';
    const v = generateValues(tType, 4);

    const ex = document.createElement('div');
    ex.style.cssText = 'display:flex;gap:12px;justify-content:center;margin:6px auto;';

    // 3 mini-colonnes, le symbole commun (v[0]) surligné dans chacune
    for (let c = 0; c < 3; c++) {
        const col = document.createElement('div');
        col.style.cssText = 'display:flex;flex-direction:column;gap:8px;align-items:center;';
        const colVals = c === 0 ? [v[0], v[1]] : (c === 1 ? [v[2], v[0]] : [v[0], v[3]]);
        colVals.forEach(val => {
            const item = document.createElement('div');
            item.className = `item type-${tType}`;
            item.style.margin = '0';
            applyStyle(item, tType, val);
            if (val === v[0]) item.style.boxShadow = '0 0 0 3px #FFFFFF, 0 0 0 5px #34B871';
            col.appendChild(item);
        });
        ex.appendChild(col);
    }
    row.append(ex);
}

function startGameDobble() {
    board.style.display = 'flex';
    board.style.flexDirection = 'column';
    board.style.alignItems = 'center';

    currentRound = 1;
    totalRounds = 3;
    checkBtn.classList.remove('hidden'); // bouton valider visible
    checkBtn.textContent = 'Valider ma sélection';

    window.startDobbleRound = function () {
        board.innerHTML = '';
        selectionOrder = [];

        const header = document.createElement('div');
        header.style.cssText = 'font-size: 1.2rem; font-weight: bold; margin-bottom: 15px; color: #23262F; text-align: center;';
        header.innerHTML = `<span style="font-size:.9rem;color:#9AA0AE;letter-spacing:.15em;text-transform:uppercase;">Manche ${currentRound}/${totalRounds}</span><br><span style="color:#4A6CFA">Trouvez l'élément commun aux 4 colonnes</span>`;
        board.appendChild(header);

        const tType = currentDayConfig.type || 'numbers';
        let allVals = [...new Set(generateValues(tType, 200))].sort(() => Math.random() - 0.5);

        // La taille des colonnes augmente d'une unité par manche
        const baseColSize = parseInt(activeItemCount) || 5;
        const targetColSize = baseColSize + (currentRound - 1);

        // Réduction dynamique si le pool de valeurs est petit
        const maxSafeColSize = Math.floor((3 * (allVals.length - 1)) / 4) + 1;
        const colSize = Math.min(targetColSize, maxSafeColSize);

        const targetVal = allVals[0];
        const fillers = allVals.slice(1);

        // Aucun figurant ne doit apparaître dans les 4 colonnes
        let usageCounts = {};
        fillers.forEach(f => usageCounts[f] = 0);

        let colsData = [];
        let targetIndices = []; // position verticale de la cible

        for (let c = 0; c < 4; c++) {
            let validFillers = fillers.filter(f => usageCounts[f] < 3).sort(() => Math.random() - 0.5);
            let selectedFillers = validFillers.slice(0, colSize - 1);

            selectedFillers.forEach(f => usageCounts[f]++);

            // Jamais la cible sur la même ligne que la colonne précédente
            let targetPos;
            do {
                targetPos = Math.floor(Math.random() * colSize);
            } while (c > 0 && targetIndices[c - 1] === targetPos && colSize > 1);
            targetIndices.push(targetPos);

            let colVals = [...selectedFillers];
            colVals.splice(targetPos, 0, targetVal);

            colsData.push(colVals);
        }

        window.validDobbleTargets = [targetVal];

        const wrapper = document.createElement('div');
        wrapper.style.cssText = 'display:flex; flex-direction:row; gap:16px; justify-content:center; flex-wrap:wrap; width:100%;';

        for (let c = 0; c < 4; c++) {
            const colCont = document.createElement('div');
            colCont.style.cssText = 'display:flex; flex-direction:column; gap:10px; align-items:center;';

            colsData[c].forEach(val => {
                const item = document.createElement('div');
                item.className = `item type-${currentDayConfig.type}`;
                item.dataset.value = val;
                item.style.margin = '0';
                item.style.cursor = 'pointer';
                applyStyle(item, currentDayConfig.type, val);

                item.addEventListener('click', () => {
                    if (isPaused) return;
                    if (selectionOrder.includes(item)) {
                        selectionOrder.splice(selectionOrder.indexOf(item), 1);
                        item.classList.remove('selected');
                        item.style.boxShadow = '';
                    } else {
                        // Une seule sélection par colonne
                        const existingInCol = selectionOrder.find(el => el.parentElement === colCont);
                        if (existingInCol) {
                            selectionOrder.splice(selectionOrder.indexOf(existingInCol), 1);
                            existingInCol.classList.remove('selected');
                            existingInCol.style.boxShadow = '';
                        }

                        selectionOrder.push(item);
                        item.classList.add('selected');
                        item.style.boxShadow = '0 0 0 3px #FFFFFF, 0 0 0 6px #4A6CFA';
                        haptic(8);
                    }

                    // Validation automatique dès 4 sélections (une par colonne)
                    if (selectionOrder.length === 4) {
                        setTimeout(() => verifyOrder(), 150);
                    }
                });
                colCont.appendChild(item);
            });
            wrapper.appendChild(colCont);
        }
        board.appendChild(wrapper);
    };

    window.startDobbleRound();
}
