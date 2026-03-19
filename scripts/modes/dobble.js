function showExampleDobble(day, row, vals) {
    const desc = document.createElement('div');
    desc.innerHTML = 'Trouvez le symbole commun<br>présent dans les 4 colonnes !';
    desc.style.textAlign = 'center';
    desc.style.fontWeight = 'bold';
    desc.style.color = '#333';
    row.style.flexDirection = 'column';
    row.append(desc);
}

function startGameDobble() {
    board.style.display = 'flex';
    board.style.flexDirection = 'column';
    board.style.alignItems = 'center';

    currentRound = 1;
    totalRounds = 3;
    checkBtn.classList.remove('hidden'); // Force validate button

    window.startDobbleRound = function () {
        board.innerHTML = '';
        selectionOrder = [];

        const header = document.createElement('div');
        header.style.cssText = 'font-size: 1.5rem; font-weight: bold; margin-bottom: 15px; color: #333; text-align: center;';
        header.innerHTML = `Round ${currentRound}/${totalRounds}<br><span style="color:#007bff">Trouvez l'élément commun aux 4 colonnes !</span>`;
        board.appendChild(header);

        const tType = currentDayConfig.type || 'numbers';
        let allVals = [...new Set(generateValues(tType, 200))].sort(() => Math.random() - 0.5);

        // Increase column size by 1 each round
        const baseColSize = parseInt(activeItemCount) || 5;
        const targetColSize = baseColSize + (currentRound - 1);

        // Dynamically reduce column size if the pool is very small
        const maxSafeColSize = Math.floor((3 * (allVals.length - 1)) / 4) + 1;
        const colSize = Math.min(targetColSize, maxSafeColSize);

        const targetVal = allVals[0];
        const fillers = allVals.slice(1);

        // Track usage to prevent any filler from being placed in all 4 columns
        let usageCounts = {};
        fillers.forEach(f => usageCounts[f] = 0);

        let colsData = [];
        let targetIndices = []; // Track target's vertical position

        for (let c = 0; c < 4; c++) {
            let validFillers = fillers.filter(f => usageCounts[f] < 3).sort(() => Math.random() - 0.5);
            let selectedFillers = validFillers.slice(0, colSize - 1);

            selectedFillers.forEach(f => usageCounts[f]++);

            // Pick a random index for the target, ensuring it's never on the same line as the previous column
            let targetPos;
            do {
                targetPos = Math.floor(Math.random() * colSize);
            } while (c > 0 && targetIndices[c - 1] === targetPos && colSize > 1);
            targetIndices.push(targetPos);

            // Insert target at the exact calculated position to prevent horizontal alignments
            let colVals = [...selectedFillers];
            colVals.splice(targetPos, 0, targetVal);

            colsData.push(colVals);
        }

        window.validDobbleTargets = [targetVal]; // Target is mathematically unique now

        const wrapper = document.createElement('div');
        wrapper.style.cssText = 'display:flex; flex-direction:row; gap:20px; justify-content:center; flex-wrap:wrap; width:100%;';

        for (let c = 0; c < 4; c++) {
            const colCont = document.createElement('div');
            colCont.style.cssText = 'display:flex; flex-direction:column; gap:10px; align-items:center;';

            colsData[c].forEach(val => {
                const item = document.createElement('div');
                item.className = `item type-${tType}`;
                item.dataset.value = val;
                item.style.margin = '0';
                item.style.cursor = 'pointer';
                applyStyle(item, tType, val);

                item.addEventListener('click', () => {
                    if (isPaused) return;
                    if (selectionOrder.includes(item)) {
                        selectionOrder.splice(selectionOrder.indexOf(item), 1);
                        item.classList.remove('selected');
                        item.style.boxShadow = '';
                    } else {
                        const existingInCol = selectionOrder.find(el => el.parentElement === colCont);
                        if (existingInCol) {
                            selectionOrder.splice(selectionOrder.indexOf(existingInCol), 1);
                            existingInCol.classList.remove('selected');
                            existingInCol.style.boxShadow = '';
                        }

                        selectionOrder.push(item);
                        item.classList.add('selected');
                        item.style.boxShadow = '0 0 0 4px #007bff';
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