// ─── Exemple visuel d'un mode (panneau d'introduction) ───────────
function showExample(day, container) {
    container.innerHTML = '';

    const row = document.createElement('div');
    row.style.cssText = 'display:flex;gap:15px;flex-wrap:wrap;justify-content:center;align-items:center;width:100%;';

    const mode = GAME_MODES[day.modeId];
    let exCount = 5;
    let vals = generateValues(day.type, exCount * 3);

    if (mode.filter === 'even') vals = vals.filter(x => Math.floor(x) % 2 === 0);
    if (mode.filter === 'odd') vals = vals.filter(x => Math.floor(x) % 2 !== 0);

    // Échantillon étalé sur toute la plage pour montrer les extrêmes
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
        // Exemple : 2 paires + 1 intrus surligné
        let exVals = [v[0], v[0], v[1], v[1], v[2]].sort(() => Math.random() - 0.5);
        exVals.forEach(val => {
            const item = document.createElement('div'); item.className = `item type-${day.type}`; applyStyle(item, day.type, val);
            if (val === v[2]) item.style.boxShadow = '0 0 0 3px #FFFFFF, 0 0 0 6px #34B871';
            row.appendChild(item);
        });
    } else if (mode.specialGen === 'pair' || mode.specialGen === 'pairs') {
        let v = generateValues(day.type, 3);
        let exVals = mode.specialGen === 'pair' ? [v[0], v[1], v[2], v[0]] : [v[0], v[0], v[1], v[1]];
        exVals.sort(() => Math.random() - 0.5).forEach(val => {
            const item = document.createElement('div'); item.className = `item type-${day.type}`; applyStyle(item, day.type, val);
            if (val === v[0] || (mode.specialGen === 'pairs' && val === v[1])) item.style.boxShadow = '0 0 0 3px #FFFFFF, 0 0 0 6px #34B871';
            row.appendChild(item);
        });
    } else if (mode.isSum || mode.isDiff) {
        let v1 = vals[0], v2 = vals[1];
        if (mode.isDiff && v1 < v2) { let temp = v1; v1 = v2; v2 = temp; }

        const i1 = document.createElement('div'); i1.className = `item type-${day.type}`; applyStyle(i1, day.type, v1);
        const op = document.createElement('div'); op.style.cssText = 'font-size:24px;font-weight:bold;color:#23262F;'; op.textContent = mode.isSum ? '+' : '−';
        const i2 = document.createElement('div'); i2.className = `item type-${day.type}`; applyStyle(i2, day.type, v2);
        const eq = document.createElement('div'); eq.style.cssText = 'font-size:24px;font-weight:bold;color:#23262F;'; eq.textContent = '=';

        const targetVal = mode.isSum ? parseFloat((v1 + v2).toFixed(4)) : parseFloat((v1 - v2).toFixed(4));
        const res = document.createElement('div');
        res.className = `item type-${day.type}`;
        applyStyle(res, day.type, targetVal);
        res.style.boxShadow = '0 0 0 3px #FFFFFF, 0 0 0 6px #34B871';

        row.append(i1, op, i2, eq, res);
    } else if (mode.isOrderChain) {
        showExampleOrderChain(day, row, vals);
    } else if (mode.isInsertion) {
        showExampleInsertion(day, row, vals);
    } else if (mode.isCascade) {
        showExampleCascade(day, row, vals);
    } else if (mode.isFontaine) {
        showExampleFontaine(day, row, vals);
    } else if (mode.isMetronome) {
        showExampleMetronome(day, row, vals);
    } else if (mode.isTripeaks) {
        showExampleTripeaks(day, row, vals);
    } else if (mode.isDegrade) {
        showExampleDegrade(day, row, vals);
    } else if (mode.isDuel) {
        showExampleDuel(day, row, vals);
    } else if (mode.isBlocs) {
        showExampleBlocs(day, row, vals);
    } else if (mode.isDominoOrder) {
        showExampleDominoOrder(day, row, vals);
    } else if (mode.isPaires) {
        showExamplePaires(day, row, vals);
    } else if (mode.isTubes) {
        showExampleTubes(day, row, vals);
    } else if (mode.isSwapSort) {
        showExampleSwapSort(day, row, vals);
    } else if (mode.isBoulons) {
        showExampleBoulons(day, row, vals);
    } else if (mode.isHanoi) {
        showExampleHanoi(day, row, vals);
    } else if (mode.isFileBloquee) {
        showExampleFileBloquee(day, row, vals);
    } else if (mode.isEtageres) {
        showExampleEtageres(day, row, vals);
    } else if (mode.isGrille) {
        showExampleGrille(day, row, vals);
    } else if (mode.isRangement) {
        showExampleRangement(day, row, vals);
    } else if (mode.isFutoshiki) {
        showExampleFutoshiki(day, row, vals);
    } else if (mode.isBalance) {
        showExampleBalance(day, row, vals);
    } else if (mode.isOrdreCache) {
        showExampleOrdreCache(day, row, vals);
    } else if (mode.isIndices) {
        showExampleIndices(day, row, vals);
    } else if (mode.isChronologie) {
        showExampleChronologie(day, row, vals);
    } else if (mode.isDeux048) {
        showExampleDeux048(day, row, vals);
    } else if (mode.isLaFoule) {
        showExampleLaFoule(day, row, vals);
    } else if (mode.isTripleOrdre) {
        showExampleTripleOrdre(day, row, vals);
    } else if (mode.isPhotoClasse) {
        showExamplePhotoClasse(day, row, vals);
    } else if (mode.isFilsEmmeles) {
        showExampleFilsEmmeles(day, row, vals);
    } else if (mode.isChemin) {
        showExampleChemin(day, row, vals);
    } else if (mode.isFusion) {
        showExampleFusion(day, row, vals);
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
            const tg = document.createElement('div'); tg.className = `item type-${day.type}`; applyStyle(tg, day.type, targetVal);
            tg.style.boxShadow = '0 0 0 3px #FFFFFF, 0 0 0 6px #4A6CFA';
            const arrow = document.createElement('div'); arrow.style.cssText = 'font-size:24px;font-weight:bold;color:#8B90A0;'; arrow.textContent = '➡';
            row.append(tg, arrow);
        }

        vals.forEach(val => {
            const item = document.createElement('div'); item.className = `item type-${day.type}`; applyStyle(item, day.type, val);
            if (val === targetVal) item.style.boxShadow = mode.avoidTarget
                ? '0 0 0 3px #FFFFFF, 0 0 0 6px #E0533D'
                : '0 0 0 3px #FFFFFF, 0 0 0 6px #34B871';
            row.appendChild(item);
        });
    }
    container.appendChild(row);
}

// ─── Pastilles de numérotation pendant la sélection ──────────────
function renderBadges() {
    document.querySelectorAll('#game-board .badge').forEach(b => b.remove());
    const mode = GAME_MODES[currentDayConfig.modeId];
    selectionOrder.forEach((item, index) => {
        const badge = document.createElement('div');
        badge.className = 'badge';
        // Le numéro n'a de sens que pour les modes de tri ordonné
        badge.textContent = (mode && mode.isSort) ? (index + 1) : '';
        item.appendChild(badge);
    });
}
