// ─── Mode : Quiz Rapide (5 manches) ──────────────────────────────
// Correction d'audit : les règles « commence par / finit par » portaient
// sur la valeur numérique interne, invisible pour les types purement
// visuels (pastilles de couleur…). Elles sont désormais réservées aux
// types affichant du texte lisible (TEXT_TYPES, défini dans data.js).

function showExampleSpeedQuiz(day, row, vals) {
    const ex = document.createElement('div');
    ex.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:10px;margin:6px auto;';

    const q = document.createElement('div');
    q.style.cssText = 'font-weight:bold;color:#4A6CFA;font-size:1.05rem;';
    q.textContent = 'Ex : « Les 3 plus grands ? »';

    const items = document.createElement('div');
    items.style.cssText = 'display:flex;gap:10px;';
    const sample = vals.slice(0, 5);
    const sorted = [...sample].sort((a, b) => a - b);
    const targets = sorted.slice(-3);
    sample.forEach(val => {
        const item = document.createElement('div');
        item.className = `item type-${day.type}`;
        item.style.margin = '0';
        applyStyle(item, day.type, val);
        if (targets.includes(val)) item.style.boxShadow = '0 0 0 3px #FFFFFF, 0 0 0 5px #34B871';
        items.appendChild(item);
    });

    ex.append(q, items);
    row.style.flexDirection = 'column';
    row.append(ex);
}

function startGameSpeedQuiz() {
    board.style.display = 'flex'; board.style.flexDirection = 'column'; board.style.alignItems = 'center';
    currentRound = 1;
    totalRounds = 5;

    const tType = currentDayConfig.type || 'numbers';
    const isTextType = TEXT_TYPES.indexOf(tType) !== -1;

    // Règles selon le type : texte lisible → règles littérales possibles
    let availableRules = ['min', 'max'];
    if (tType === 'numbers') availableRules.push('even', 'odd');
    if (isTextType) availableRules.push('start', 'end');
    while (availableRules.length < 5) availableRules.push(availableRules[availableRules.length % 2]); // complète avec min/max
    let roundQuestions = availableRules.sort(() => Math.random() - 0.5).slice(0, 5);

    window.startQuizRound = function () {
        board.innerHTML = '';
        const choicesCount = Math.max(parseInt(activeItemCount) || 20, 6);
        const targetK = 5; // nombre exact de bonnes réponses
        let qType = roundQuestions[currentRound - 1];

        let vals = [];
        let conditionFn;
        let qTxt = '';

        // Grande réserve de valeurs uniques
        let bigPool = [...new Set(generateValues(tType, 400))].sort(() => Math.random() - 0.5);

        // Repli : pool trop petit pour la condition → min
        if (bigPool.length < choicesCount) { qType = 'min'; }

        // Pour l'affichage des règles littérales : valeur → texte affiché
        const displayStr = (v) => {
            if (tType === 'roman') return ROMAN_TABLE[v] || String(v);
            if (tType === 'alphabet') return ALPHA_TABLE[v] || '?';
            if (tType === 'months') return MONTH_TABLE[v] || '?';
            if (tType === 'wordLength') return WORD_TABLE[v] || '?';
            if (tType === 'weights') return _formatWeight(v);
            if (tType === 'durations') return _formatDuration(v);
            return String(v);
        };

        if (qType === 'min') {
            vals = bigPool.slice(0, choicesCount);
            let sorted = [...vals].sort((a, b) => a - b);
            let targets = sorted.slice(0, targetK);
            conditionFn = v => targets.includes(v);
            qTxt = `Les ${targetK} plus PETITS ?`;
            if (tType === 'lightness') qTxt = `Les ${targetK} plus SOMBRES ?`;
            if (tType === 'opacity') qTxt = `Les ${targetK} plus TRANSPARENTS ?`;

        } else if (qType === 'max') {
            vals = bigPool.slice(0, choicesCount);
            let sorted = [...vals].sort((a, b) => a - b);
            let targets = sorted.slice(-targetK);
            conditionFn = v => targets.includes(v);
            qTxt = `Les ${targetK} plus GRANDS ?`;
            if (tType === 'lightness') qTxt = `Les ${targetK} plus CLAIRS ?`;
            if (tType === 'opacity') qTxt = `Les ${targetK} plus OPAQUES ?`;

        } else if (qType === 'even') {
            let evens = bigPool.filter(v => !isNaN(v) && parseInt(v) % 2 === 0);
            let odds = bigPool.filter(v => !isNaN(v) && parseInt(v) % 2 !== 0);
            vals = [...evens.slice(0, targetK), ...odds.slice(0, choicesCount - targetK)];
            conditionFn = v => !isNaN(v) && parseInt(v) % 2 === 0;
            qTxt = 'Tous les PAIRS ?';

        } else if (qType === 'odd') {
            let odds = bigPool.filter(v => !isNaN(v) && parseInt(v) % 2 !== 0);
            let evens = bigPool.filter(v => !isNaN(v) && parseInt(v) % 2 === 0);
            vals = [...odds.slice(0, targetK), ...evens.slice(0, choicesCount - targetK)];
            conditionFn = v => !isNaN(v) && parseInt(v) % 2 !== 0;
            qTxt = 'Tous les IMPAIRS ?';

        } else if (qType === 'start' || qType === 'end') {
            // Regroupe par caractère AFFICHÉ (et non valeur interne)
            const charOf = qType === 'start'
                ? (v => displayStr(v)[0].toUpperCase())
                : (v => displayStr(v).slice(-1).toUpperCase());
            let byChar = {};
            bigPool.forEach(v => {
                let c = charOf(v);
                if (!byChar[c]) byChar[c] = [];
                byChar[c].push(v);
            });
            let validChars = Object.keys(byChar).filter(c => byChar[c].length >= targetK && bigPool.length - byChar[c].length >= (choicesCount - targetK));

            if (validChars.length === 0) {
                // Repli min si aucun caractère assez fréquent
                vals = bigPool.slice(0, choicesCount);
                let sorted = [...vals].sort((a, b) => a - b);
                let targets = sorted.slice(0, targetK);
                conditionFn = v => targets.includes(v);
                qTxt = `Les ${targetK} plus PETITS ?`;
            } else {
                let charTarget = validChars[Math.floor(Math.random() * validChars.length)];
                let targets = byChar[charTarget].slice(0, targetK);
                let others = bigPool.filter(v => charOf(v) !== charTarget).slice(0, choicesCount - targetK);
                vals = [...targets, ...others];
                conditionFn = v => charOf(v) === charTarget;
                qTxt = qType === 'start' ? `Commencent par « ${charTarget} » ?` : `Terminent par « ${charTarget} » ?`;
            }
        }

        let foundCount = 0;

        const qDiv = document.createElement('div');
        qDiv.style.cssText = 'font-size: 1.3rem; font-weight: bold; margin-bottom: 20px; color: #23262F; text-align: center;';
        qDiv.innerHTML = `<span style="font-size:.9rem;color:#9AA0AE;letter-spacing:.15em;text-transform:uppercase;">Manche ${currentRound}/${totalRounds}</span><br><span style="color:#4A6CFA">${qTxt}</span><br><span id="quiz-counter" style="font-size:1rem; color:#E0533D; display:inline-block; margin-top:5px;">${targetK} à trouver</span>`;
        board.appendChild(qDiv);

        const itemsCont = document.createElement('div');
        itemsCont.style.cssText = 'display:flex; gap:15px; flex-wrap:wrap; justify-content:center; max-width: 600px;';

        vals.sort(() => Math.random() - 0.5);
        vals.forEach(val => {
            const item = document.createElement('div');
            item.className = `item type-${tType}`; item.style.cursor = 'pointer';
            applyStyle(item, tType, val);

            item.addEventListener('pointerdown', (e) => {
                e.preventDefault();
                if (isPaused || item.dataset.found) return;

                if (conditionFn(val)) {
                    item.style.boxShadow = '0 0 0 3px #FFFFFF, 0 0 0 6px #34B871';
                    item.dataset.found = 'true';
                    item.style.transform = 'scale(0.9)';
                    foundCount++;
                    haptic(8);

                    const counterSpan = document.getElementById('quiz-counter');
                    if (counterSpan) {
                        let rem = targetK - foundCount;
                        counterSpan.textContent = rem > 0 ? `${rem} à trouver` : 'Parfait !';
                        counterSpan.style.color = rem > 0 ? '#E0533D' : '#34B871';
                    }

                    if (foundCount >= targetK) {
                        currentRound++;
                        if (currentRound > totalRounds) {
                            setTimeout(() => endGame('Quiz terminé sans faute !', true), 300);
                        } else {
                            // Pause entre les manches
                            isPaused = true;
                            const nextBtn = document.createElement('button');
                            nextBtn.className = 'btn btn-plum';
                            nextBtn.style.cssText = 'margin-top: 20px;';
                            nextBtn.textContent = `Manche suivante (${currentRound}/${totalRounds})`;
                            nextBtn.addEventListener('click', () => {
                                isPaused = false;
                                window.startQuizRound();
                            });
                            board.appendChild(nextBtn);
                        }
                    }
                } else {
                    item.style.boxShadow = '0 0 0 3px #FFFFFF, 0 0 0 6px #E0533D';
                    endGame('Mauvaise réponse !', false);
                }
            });
            itemsCont.appendChild(item);
        });
        board.appendChild(itemsCont);
    };
    window.startQuizRound();
}
