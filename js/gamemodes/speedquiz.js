import { state, dom } from '../state.js';
import { generateValues, applyStyle } from '../renderer.js';
import { endGame } from '../endgame.js';

export function startSpeedQuiz() {
    dom.board.style.display       = 'flex';
    dom.board.style.flexDirection = 'column';
    dom.board.style.alignItems    = 'center';
    state.currentRound = 1;
    state.totalRounds  = 5;

    const tType = state.currentDayConfig.type || 'numbers';
    let availableRules = ['min', 'max', 'start', 'end'];
    if (tType === 'numbers') availableRules.push('even', 'odd');
    else availableRules.push('start', 'end');
    let roundQuestions = availableRules.sort(() => Math.random() - 0.5).slice(0, 5);

    window.startQuizRound = () => _quizRound(tType, roundQuestions);
    window.startQuizRound();
}

function _quizRound(tType, roundQuestions) {
    dom.board.innerHTML = '';
    const choicesCount = 20, targetK = 5;
    let qType = roundQuestions[state.currentRound - 1];
    let vals = [], conditionFn, qTxt = '';

    let bigPool = [...new Set(generateValues(tType, 400))].sort(() => Math.random() - 0.5);
    if (bigPool.length < choicesCount) qType = 'min';

    if (qType === 'min') {
        vals = bigPool.slice(0, choicesCount);
        const targets = [...vals].sort((a, b) => typeof a === 'string' ? a.localeCompare(b) : a - b).slice(0, targetK);
        conditionFn = v => targets.includes(v);
        qTxt = `Les ${targetK} plus PETITS ?`;
        if (tType === 'size')      qTxt = `Les ${targetK} plus FINS ?`;
        if (tType === 'lightness') qTxt = `Les ${targetK} plus SOMBRES ?`;
        if (tType === 'opacity')   qTxt = `Les ${targetK} plus TRANSPARENTS ?`;

    } else if (qType === 'max') {
        vals = bigPool.slice(0, choicesCount);
        const targets = [...vals].sort((a, b) => typeof a === 'string' ? a.localeCompare(b) : a - b).slice(-targetK);
        conditionFn = v => targets.includes(v);
        qTxt = `Les ${targetK} plus GRANDS ?`;
        if (tType === 'size')      qTxt = `Les ${targetK} plus GROS ?`;
        if (tType === 'lightness') qTxt = `Les ${targetK} plus CLAIRS ?`;
        if (tType === 'opacity')   qTxt = `Les ${targetK} plus OPAQUES ?`;

    } else if (qType === 'even') {
        const evens = bigPool.filter(v => !isNaN(v) && parseInt(v) % 2 === 0);
        const odds  = bigPool.filter(v => !isNaN(v) && parseInt(v) % 2 !== 0);
        vals = [...evens.slice(0, targetK), ...odds.slice(0, choicesCount - targetK)];
        conditionFn = v => !isNaN(v) && parseInt(v) % 2 === 0;
        qTxt = 'Tous les PAIRS ?';

    } else if (qType === 'odd') {
        const odds  = bigPool.filter(v => !isNaN(v) && parseInt(v) % 2 !== 0);
        const evens = bigPool.filter(v => !isNaN(v) && parseInt(v) % 2 === 0);
        vals = [...odds.slice(0, targetK), ...evens.slice(0, choicesCount - targetK)];
        conditionFn = v => !isNaN(v) && parseInt(v) % 2 !== 0;
        qTxt = 'Tous les IMPAIRS ?';

    } else if (qType === 'start') {
        let byChar = {};
        bigPool.forEach(v => { let c = String(v).replace(/^#/, '')[0].toUpperCase(); if (!byChar[c]) byChar[c] = []; byChar[c].push(v); });
        let validChars = Object.keys(byChar).filter(c => byChar[c].length >= targetK && bigPool.length - byChar[c].length >= (choicesCount - targetK));
        if (validChars.length === 0) { qType = 'min'; return _quizRound(tType, roundQuestions); }
        const charTarget = validChars[Math.floor(Math.random() * validChars.length)];
        const targets = byChar[charTarget].slice(0, targetK);
        const others  = bigPool.filter(v => String(v).replace(/^#/, '')[0].toUpperCase() !== charTarget).slice(0, choicesCount - targetK);
        vals = [...targets, ...others];
        conditionFn = v => String(v).replace(/^#/, '')[0].toUpperCase() === charTarget;
        qTxt = `Commencent par "${charTarget}" ?`;

    } else if (qType === 'end') {
        let byChar = {};
        bigPool.forEach(v => { let c = String(v).slice(-1).toUpperCase(); if (!byChar[c]) byChar[c] = []; byChar[c].push(v); });
        let validChars = Object.keys(byChar).filter(c => byChar[c].length >= targetK && bigPool.length - byChar[c].length >= (choicesCount - targetK));
        if (validChars.length === 0) { qType = 'min'; return _quizRound(tType, roundQuestions); }
        const charTarget = validChars[Math.floor(Math.random() * validChars.length)];
        const targets = byChar[charTarget].slice(0, targetK);
        const others  = bigPool.filter(v => String(v).slice(-1).toUpperCase() !== charTarget).slice(0, choicesCount - targetK);
        vals = [...targets, ...others];
        conditionFn = v => String(v).slice(-1).toUpperCase() === charTarget;
        qTxt = `Terminent par "${charTarget}" ?`;
    }

    let foundCount = 0;
    const qDiv = document.createElement('div');
    qDiv.style.cssText = 'font-size:1.5rem;font-weight:bold;margin-bottom:20px;color:#333;text-align:center;';
    qDiv.innerHTML = `Round ${state.currentRound}/${state.totalRounds}<br><span style="color:#007bff">${qTxt}</span><br><span id="quiz-counter" style="font-size:1.1rem;color:#dc3545;display:inline-block;margin-top:5px;">${targetK} à trouver</span>`;
    dom.board.appendChild(qDiv);

    const itemsCont = document.createElement('div');
    itemsCont.style.cssText = 'display:flex;gap:15px;flex-wrap:wrap;justify-content:center;max-width:600px;';
    vals.sort(() => Math.random() - 0.5);
    vals.forEach(val => {
        const item = document.createElement('div');
        item.className = `item type-${tType}`; item.style.cursor = 'pointer';
        applyStyle(item, tType, val);
        item.addEventListener('pointerdown', (e) => {
            e.preventDefault(); if (state.isPaused || item.dataset.found) return;
            if (conditionFn(val)) {
                item.style.boxShadow = '0 0 0 4px #28a745'; item.dataset.found = 'true'; item.style.transform = 'scale(0.9)';
                foundCount++;
                const counter = document.getElementById('quiz-counter');
                if (counter) { let rem = targetK - foundCount; counter.textContent = rem > 0 ? `${rem} à trouver` : 'Parfait !'; counter.style.color = rem > 0 ? '#ff9800' : '#28a745'; }
                if (foundCount >= targetK) {
                    state.currentRound++;
                    if (state.currentRound > state.totalRounds) setTimeout(() => endGame('Quiz terminé !', true), 300);
                    else setTimeout(() => window.startQuizRound(), 400);
                }
            } else { item.style.boxShadow = '0 0 0 4px #dc3545'; endGame('Mauvaise réponse !', false); }
        });
        itemsCont.appendChild(item);
    });
    dom.board.appendChild(itemsCont);
}

export function previewSpeedQuiz(row) {
    const desc = document.createElement('div');
    desc.innerHTML = 'Trouvez TOUTES les bonnes réponses<br>le plus vite possible !';
    desc.style.cssText = 'text-align:center;font-weight:bold;color:#333;';
    row.style.flexDirection = 'column'; row.append(desc);
}
