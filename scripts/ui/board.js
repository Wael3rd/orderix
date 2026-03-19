// --- Board & Helpers ---
function showExample(day, boardEl) {
    boardEl.innerHTML = '';
    boardEl.classList.remove('hidden');
    boardEl.style.flexDirection = 'column';
    boardEl.style.alignItems = 'center';
    boardEl.style.display = 'flex';
    boardEl.style.position = 'static';
    boardEl.style.height = 'auto';

    const exTitle = document.createElement('h3');
    exTitle.textContent = 'Exemple de l\'objectif :';
    exTitle.style.margin = '0 0 15px 0';
    exTitle.style.color = '#555';
    boardEl.appendChild(exTitle);

    const row = document.createElement('div');
    row.style.display = 'flex';
    row.style.gap = '15px';
    row.style.flexWrap = 'wrap';
    row.style.justifyContent = 'center';
    row.style.alignItems = 'center';

    const mode = GAME_MODES[day.modeId];
    let exCount = 5;
    let vals = generateValues(day.type, exCount * 3);

    if (mode.filter === 'even') vals = vals.filter(x => Math.floor(x) % 2 === 0);
    if (mode.filter === 'odd') vals = vals.filter(x => Math.floor(x) % 2 !== 0);

    // Spread selection across the entire range to always include game extremes
    let uniqueVals = [...new Set(vals)];
    let spreadVals = [];
    if (uniqueVals.length <= exCount) {
        spreadVals = uniqueVals;
    } else {
        for (let i = 0; i < exCount; i++) {
            spreadVals.push(uniqueVals[Math.round(i * (uniqueVals.length - 1) / (exCount - 1))]);
        }
    }
    vals = spreadVals;

    if (mode.isSort) {
        vals.sort((a, b) => mode.order === 1 ? a - b : b - a);
        vals.forEach((val, i) => {
            const item = document.createElement('div');
            item.className = `item type-${day.type}`;
            applyStyle(item, day.type, val);
            const badge = document.createElement('div');
            badge.className = 'badge'; badge.textContent = i + 1;
            item.appendChild(badge);
            row.appendChild(item);
        });
    } else if (mode.specialGen === 'odd') {
        let v = generateValues(day.type, 5);
        // Création d'un exemple avec 2 paires distinctes et 1 intrus (5 éléments)
        let exVals = [v[0], v[0], v[1], v[1], v[2]].sort(() => Math.random() - 0.5);
        exVals.forEach(val => {
            const item = document.createElement('div'); item.className = `item type-${day.type}`; applyStyle(item, day.type, val);
            if (val === v[2]) item.style.boxShadow = '0 0 0 4px #28a745';
            row.appendChild(item);
        });
    } else if (mode.specialGen === 'pair' || mode.specialGen === 'pairs') {
        let v = generateValues(day.type, 3);
        let exVals = mode.specialGen === 'pair' ? [v[0], v[1], v[2], v[0]] : [v[0], v[0], v[1], v[1]];
        exVals.sort(() => Math.random() - 0.5).forEach(val => {
            const item = document.createElement('div'); item.className = `item type-${day.type}`; applyStyle(item, day.type, val);
            if (val === v[0] || (mode.specialGen === 'pairs' && val === v[1])) item.style.boxShadow = '0 0 0 4px #28a745';
            row.appendChild(item);
        });
    } else if (mode.isSum || mode.isDiff) {
        let v1 = vals[0], v2 = vals[1];

        // Swap values for subtraction to always show max - min
        if (mode.isDiff && v1 < v2) {
            let temp = v1;
            v1 = v2;
            v2 = temp;
        }

        const i1 = document.createElement('div'); i1.className = `item type-${day.type}`; applyStyle(i1, day.type, v1);
        const op = document.createElement('div'); op.style.fontSize = '24px'; op.style.fontWeight = 'bold'; op.style.color = '#333'; op.textContent = mode.isSum ? '+' : '−';
        const i2 = document.createElement('div'); i2.className = `item type-${day.type}`; applyStyle(i2, day.type, v2);
        const eq = document.createElement('div'); eq.style.fontSize = '24px'; eq.style.fontWeight = 'bold'; eq.style.color = '#333'; eq.textContent = '=';

        // Generate visual element for the result
        const targetVal = mode.isSum ? parseFloat((v1 + v2).toFixed(4)) : parseFloat((v1 - v2).toFixed(4));
        const res = document.createElement('div');
        res.className = `item type-${day.type}`;
        applyStyle(res, day.type, targetVal);
        res.style.boxShadow = '0 0 0 4px #28a745'; // Highlight answer

        row.append(i1, op, i2, eq, res);

    } else if (mode.isReflex) {
        showExampleReflex(day, row, vals);
    } else if (mode.isTyping) {
        showExampleTyping(day, row, vals);
    } else if (mode.isConnectDots) {
        showExampleConnectDots(day, row, vals);
    } else if (mode.isMathQuiz) {
        showExampleMathQuiz(day, row, vals, mode);
    } else if (mode.isSpeedLetters) {
        showExampleSpeedLetters(day, row, vals);
    } else if (mode.isDragDrop) {
        showExampleDragDrop(day, row, vals);
    } else if (mode.isConveyor) {
        showExampleConveyor(day, row, vals);
    } else if (mode.isSpeedQuiz) {
        showExampleSpeedQuiz(day, row, vals);
    } else if (mode.isGuessNumber) {
        showExampleGuessNumber(day, row, vals);
    } else if (mode.isDobble) {
        showExampleDobble(day, row, vals);
    } else {
        let targetVal;
        if (mode.findTarget === 'max') targetVal = Math.max(...vals);
        else if (mode.findTarget === 'min' || mode.avoidTarget === 'min') targetVal = Math.min(...vals);
        else if (mode.findTarget === 'median') targetVal = [...vals].sort((a, b) => a - b)[Math.floor(vals.length / 2)];
        else if (mode.isTargetMatch) targetVal = vals[0];

        if (mode.isTargetMatch) {
            const tg = document.createElement('div'); tg.className = `item type-${day.type}`; applyStyle(tg, day.type, targetVal); tg.style.boxShadow = '0 0 0 4px #007bff';
            const arrow = document.createElement('div'); arrow.style.fontSize = '24px'; arrow.style.fontWeight = 'bold'; arrow.textContent = '➡';
            row.append(tg, arrow);
        }

        vals.forEach(val => {
            const item = document.createElement('div'); item.className = `item type-${day.type}`; applyStyle(item, day.type, val);
            if (val === targetVal) item.style.boxShadow = mode.avoidTarget ? '0 0 0 4px #dc3545' : '0 0 0 4px #28a745';
            row.appendChild(item);
        });
    }
    boardEl.appendChild(row);
}

function renderBadges() {
    document.querySelectorAll('.badge').forEach(b => b.remove());
    const mode = GAME_MODES[currentDayConfig.modeId];
    selectionOrder.forEach((item, index) => {
        const badge = document.createElement('div');
        badge.className = 'badge';
        // Only display a number if the mode requires sorting/ordering
        badge.textContent = (mode && mode.isSort) ? (index + 1) : '';
        item.appendChild(badge);
    });
}
