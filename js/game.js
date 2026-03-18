import { state, dom } from './state.js';
import { GAME_MODES } from './config.js';
import { generateValues, applyStyle } from './renderer.js';
import { startTimer } from './timer.js';
import { setStorage } from './storage.js';

// Gamemodes
import { startReflex,      previewReflex }      from './gamemodes/reflex.js';
import { startTyping,      previewTyping }      from './gamemodes/typing.js';
import { startConnectDots, previewConnectDots } from './gamemodes/connectdots.js';
import { startMathQuiz,    previewMathQuiz }    from './gamemodes/mathquiz.js';
import { startSpeedLetters,previewSpeedLetters} from './gamemodes/speedletters.js';
import { startDragDrop,    previewDragDrop }    from './gamemodes/dragdrop.js';
import { startConveyor,    previewConveyor }    from './gamemodes/conveyor.js';
import { startSpeedQuiz,   previewSpeedQuiz }   from './gamemodes/speedquiz.js';
import { startDefault }                         from './gamemodes/default.js';

// ── showExample ───────────────────────────────────────────────────────────────
export function showExample(day, boardEl) {
    boardEl.innerHTML = '';
    boardEl.classList.remove('hidden');
    Object.assign(boardEl.style, { flexDirection: 'column', alignItems: 'center', display: 'flex', position: 'static', height: 'auto' });

    const exTitle = document.createElement('h3');
    exTitle.textContent   = 'Exemple de l\'objectif :';
    exTitle.style.cssText = 'margin:0 0 15px 0;color:#555;';
    boardEl.appendChild(exTitle);

    const row = document.createElement('div');
    row.style.cssText = 'display:flex;gap:15px;flex-wrap:wrap;justify-content:center;align-items:center;';

    const mode = GAME_MODES[day.modeId];
    let exCount = 5;
    let vals = generateValues(day.type, exCount * 3);
    if (mode.filter === 'even') vals = vals.filter(x => Math.floor(x) % 2 === 0);
    if (mode.filter === 'odd')  vals = vals.filter(x => Math.floor(x) % 2 !== 0);
    let uniqueVals = [...new Set(vals)];
    let spreadVals = uniqueVals.length <= exCount ? uniqueVals : [];
    if (!spreadVals.length) { for (let i = 0; i < exCount; i++) spreadVals.push(uniqueVals[Math.round(i * (uniqueVals.length - 1) / (exCount - 1))]); }
    vals = spreadVals;

    if (mode.isReflex)       { previewReflex(day, row); }
    else if (mode.isTyping)      { previewTyping(row); }
    else if (mode.isConnectDots) { previewConnectDots(row); }
    else if (mode.isMathQuiz)    { previewMathQuiz(mode, row); }
    else if (mode.isSpeedLetters){ previewSpeedLetters(row); }
    else if (mode.isDragDrop)    { previewDragDrop(row); }
    else if (mode.isConveyor)    { previewConveyor(day, boardEl, row); return; } // manages board itself
    else if (mode.isSpeedQuiz)   { previewSpeedQuiz(row); }
    else if (mode.isSort) {
        vals.sort((a, b) => mode.order === 1 ? a - b : b - a);
        vals.forEach((val, i) => {
            const item = document.createElement('div'); item.className = `item type-${day.type}`; applyStyle(item, day.type, val);
            const badge = document.createElement('div'); badge.className = 'badge'; badge.textContent = i + 1; item.appendChild(badge);
            row.appendChild(item);
        });
    } else if (mode.specialGen === 'odd') {
        let v = generateValues(day.type, 5);
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
        if (mode.isDiff && v1 < v2) { let t = v1; v1 = v2; v2 = t; }
        const i1 = document.createElement('div'); i1.className = `item type-${day.type}`; applyStyle(i1, day.type, v1);
        const op = document.createElement('div'); op.style.cssText = 'font-size:24px;font-weight:bold;color:#333;'; op.textContent = mode.isSum ? '+' : '−';
        const i2 = document.createElement('div'); i2.className = `item type-${day.type}`; applyStyle(i2, day.type, v2);
        const eq = document.createElement('div'); eq.style.cssText = 'font-size:24px;font-weight:bold;color:#333;'; eq.textContent = '=';
        const res = document.createElement('div'); res.className = `item type-${day.type}`;
        applyStyle(res, day.type, mode.isSum ? parseFloat((v1 + v2).toFixed(4)) : parseFloat((v1 - v2).toFixed(4)));
        res.style.boxShadow = '0 0 0 4px #28a745';
        row.append(i1, op, i2, eq, res);
    } else {
        let targetVal;
        if      (mode.findTarget === 'max')   targetVal = Math.max(...vals);
        else if (mode.findTarget === 'min' || mode.avoidTarget === 'min') targetVal = Math.min(...vals);
        else if (mode.findTarget === 'median') targetVal = [...vals].sort((a, b) => a - b)[Math.floor(vals.length / 2)];
        else if (mode.isTargetMatch)           targetVal = vals[0];
        if (mode.isTargetMatch) {
            const tg = document.createElement('div'); tg.className = `item type-${day.type}`; applyStyle(tg, day.type, targetVal); tg.style.boxShadow = '0 0 0 4px #007bff';
            const arrow = document.createElement('div'); arrow.style.fontSize = '24px'; arrow.textContent = '➡️';
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

// ── startGame ─────────────────────────────────────────────────────────────────
export function startGame() {
    if (!state.isNameValid) { alert("Veuillez valider un pseudo disponible dans les paramètres avant de jouer."); return; }

    const cfg = state.dayConfig[state.currentDayConfig.id];
    state.activeItemCount = (cfg && cfg.count) ? cfg.count : 10;
    const mode = GAME_MODES[state.currentDayConfig.modeId];

    dom.leaderboardTitle.textContent = `Top 10 - ${state.currentDayConfig.title} (${state.activeItemCount} éléments)`;

    // Reset transient state
    state.timeElapsed = 0; state.isPaused = false;
    state.selectionOrder = []; state.flipped = []; state.matched = 0;
    state.hasSharedThisGame = false;
    clearInterval(window.speedTimer);
    dom.resultDisplay.textContent = '';
    dom.leaderboardSection.classList.add('hidden');
    dom.startBtn.classList.add('hidden');
    dom.menuBtn.classList.add('hidden');
    dom.timerDisplay.textContent = '0.000';
    dom.timerDisplay.style.color = '#333';
    dom.timerDisplay.classList.remove('hidden');

    if (mode.isSort) dom.checkBtn.classList.remove('hidden');
    else             dom.checkBtn.classList.add('hidden');

    dom.board.classList.remove('hidden');
    dom.board.innerHTML = '';
    dom.board.className = 'board';
    dom.leaderboardList.innerHTML = '<li style="padding:10px;text-align:center;">Chargement...</li>';
    dom.dbMessage.textContent = '';

    const oldTargetUI = document.getElementById('dynamic-target-ui');
    if (oldTargetUI) oldTargetUI.remove();

    // Dispatch to correct gamemode
    if      (mode.isReflex)       startReflex();
    else if (mode.isTyping)       startTyping();
    else if (mode.isConnectDots)  startConnectDots();
    else if (mode.isMathQuiz)     startMathQuiz(mode);
    else if (mode.isSpeedLetters) startSpeedLetters();
    else if (mode.isDragDrop)     startDragDrop();
    else if (mode.isConveyor)     startConveyor();
    else if (mode.isSpeedQuiz)    startSpeedQuiz();
    else                          startDefault(mode);

    // Start timer & mark game in progress
    startTimer();
    state.gameInProgress = true;
    history.pushState({ orderixGame: true }, '');

    // Rage-quit recovery beacon
    const userLoc = Intl.DateTimeFormat().resolvedOptions().timeZone;
    setStorage('orderix_pending_game', JSON.stringify({
        dayId:     state.currentDayConfig.id,
        itemCount: state.activeItemCount,
        location:  userLoc,
        modeId:    state.currentDayConfig.modeId,
        type:      state.currentDayConfig.type,
    }));
}
