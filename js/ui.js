import { state, dom } from './state.js';
import { GAME_MODES } from './config.js';
import { generateValues, applyStyle } from './renderer.js';
import { fetchLeaderboard } from './network.js';
import { showExample } from './game.js';

export function returnToMenu() {
    state.gameInProgress = false;
    state.isPaused       = true;
    dom.sidebar.classList.remove('hidden');
    dom.menuBtn.classList.add('hidden');
    dom.shareBtn.classList.add('hidden');
    dom.startBtn.classList.add('hidden');
    dom.checkBtn.classList.add('hidden');
    state.pendingTimeVal = 0;
    dom.board.classList.add('hidden');
    dom.board.classList.remove('blackout-mode');
    dom.feedbackContainer.classList.add('hidden');
    dom.leaderboardSection.classList.add('hidden');
    dom.timerDisplay.classList.add('hidden');

    const dynTarget = document.getElementById('dynamic-target-ui');
    if (dynTarget) dynTarget.remove();

    clearInterval(state.timerInterval);
    clearTimeout(state.gameTimeout);
    clearInterval(state.envInterval);

    state.timeElapsed = 0;
    dom.timerDisplay.textContent = '0.000';
    dom.timerDisplay.style.color = '#333';
    dom.resultDisplay.textContent = '';
    dom.dbMessage.textContent    = '';
    dom.levelTitle.textContent   = 'Sélectionnez un jour pour commencer';
    document.querySelectorAll('.day-btn').forEach(b => b.classList.remove('active'));
    state.currentDayConfig = null;
}

export function selectDay(day, btnElement) {
    dom.sidebar.classList.add('hidden');
    dom.menuBtn.classList.remove('hidden');
    dom.shareBtn.classList.add('hidden');
    dom.leaderboardSection.classList.add('hidden');
    dom.timerDisplay.classList.add('hidden');

    const dynTarget = document.getElementById('dynamic-target-ui');
    if (dynTarget) dynTarget.remove();

    document.querySelectorAll('.day-btn').forEach(b => b.classList.remove('active'));
    btnElement.classList.add('active');

    clearInterval(state.timerInterval);
    clearTimeout(state.gameTimeout);
    clearInterval(state.envInterval);
    state.timeElapsed = 0;
    dom.timerDisplay.textContent = '0.000';
    dom.timerDisplay.style.color = '#333';
    dom.board.classList.add('hidden');
    dom.board.classList.remove('blackout-mode');
    dom.checkBtn.classList.add('hidden');
    dom.resultDisplay.textContent = '';
    dom.dbMessage.textContent    = '';

    state.currentDayConfig = day;
    dom.levelTitle.textContent = day.title;

    const cfg = state.dayConfig[day.id];
    state.activeItemCount = (cfg && cfg.count) ? cfg.count : 10;
    const playedInfo = state.serverPlayedDays[day.id] || null;

    if (playedInfo) {
        dom.startBtn.classList.add('hidden');
        dom.shareBtn.classList.remove('hidden');
        state.activeItemCount = playedInfo.count;
        dom.leaderboardTitle.textContent = `Top 10 - ${day.title} (${state.activeItemCount} éléments)`;

        let timeDisplay;
        if      (playedInfo.isWin)             timeDisplay = parseFloat(playedInfo.time).toFixed(3) + 's';
        else if (playedInfo.time === -999999)  timeDisplay = 'RAGE QUIT';
        else                                   timeDisplay = `FAIL (${Math.abs(playedInfo.time).toFixed(3)}s)`;

        dom.resultDisplay.innerHTML = `Niveau déjà complété.<br>Votre résultat : <span style="color:${playedInfo.isWin ? '#28a745' : '#dc3545'}">${timeDisplay}</span>`;
        dom.resultDisplay.style.color = '#333';

        dom.board.innerHTML = '';
        dom.board.classList.remove('hidden');

        const mode = GAME_MODES[day.modeId];
        if (mode && mode.isSort) {
            dom.board.style.flexDirection = 'column';
            dom.board.style.alignItems    = 'center';
            const solTitle = document.createElement('h3');
            solTitle.textContent = 'Solution :'; solTitle.style.margin = '0 0 10px 0';
            dom.board.appendChild(solTitle);
            const solRow = document.createElement('div');
            solRow.style.cssText = 'display:flex;gap:20px;flex-wrap:wrap;justify-content:center;';
            let vals = generateValues(day.type, state.activeItemCount);
            if (mode.filter === 'even') vals = vals.filter(x => Math.floor(x) % 2 === 0).slice(0, state.activeItemCount);
            if (mode.filter === 'odd')  vals = vals.filter(x => Math.floor(x) % 2 !== 0).slice(0, state.activeItemCount);
            vals.sort((a, b) => mode.order === 1 ? a - b : b - a).forEach((val, i) => {
                const item = document.createElement('div');
                item.className = `item type-${day.type}`; applyStyle(item, day.type, val);
                const badge = document.createElement('div'); badge.className = 'badge'; badge.textContent = i + 1;
                item.appendChild(badge); solRow.appendChild(item);
            });
            dom.board.appendChild(solRow);
        } else {
            dom.board.style.flexDirection = 'row';
            dom.board.style.justifyContent = 'center';
            const msg = document.createElement('div');
            msg.style.cssText = 'padding:20px;color:#555;font-weight:bold;text-align:center;';
            msg.innerHTML = 'Mode dynamique.<br>Pas de solution fixe à afficher.';
            dom.board.appendChild(msg);
        }

        dom.leaderboardSection.classList.remove('hidden');
        fetchLeaderboard();
    } else {
        dom.startBtn.classList.remove('hidden');
        dom.startBtn.textContent = 'Jouer';
        dom.leaderboardTitle.textContent = `Top 10 - ${day.title} (${state.activeItemCount} éléments)`;
        showExample(day, dom.board);
    }
}
