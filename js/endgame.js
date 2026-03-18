import { state, dom } from './state.js';
import { stopTimer } from './timer.js';
import { refreshSidebar } from './sidebar.js';
import { submitScore, fetchLeaderboard } from './network.js';
import { getStorage } from './storage.js';

export function endGame(message, isWin, isRageQuit = false) {
    stopTimer();
    clearTimeout(state.gameTimeout);
    clearInterval(state.envInterval);
    dom.board.classList.remove('blackout-mode');

    state.isPaused      = true;
    state.gameInProgress = false;
    dom.checkBtn.classList.add('hidden');
    dom.startBtn.classList.add('hidden');

    // Clear pending game marker
    try { localStorage.setItem('orderix_pending_game', ''); } catch (e) {}

    state.pendingTimeVal = (state.timeElapsed / 1000).toFixed(3);
    if (!isWin)      state.pendingTimeVal = -state.pendingTimeVal;
    if (isRageQuit)  state.pendingTimeVal = -999999;

    // Optimistic UI update
    state.serverPlayedDays[state.currentDayConfig.id] = {
        count:  state.activeItemCount,
        time:   parseFloat(state.pendingTimeVal),
        isWin,
    };
    refreshSidebar();

    let timeStr;
    if (isRageQuit)  timeStr = 'RAGE QUIT';
    else             timeStr = (state.timeElapsed / 1000).toFixed(3) + 's';

    dom.resultDisplay.innerHTML = `${message}<br>Temps : <span style="color:${isWin ? '#28a745' : '#dc3545'}">${timeStr}</span>`;
    dom.resultDisplay.style.color = '#333';

    dom.leaderboardSection.classList.add('hidden');
    dom.feedbackContainer.classList.remove('hidden');

    submitScore(state.pendingTimeVal, '', false);
}

export function handleFeedback(feedbackValue) {
    dom.feedbackContainer.classList.add('hidden');
    dom.leaderboardSection.classList.remove('hidden');
    dom.menuBtn.classList.remove('hidden');
    dom.shareBtn.classList.remove('hidden');
    dom.dbMessage.textContent = 'Envoi de votre avis...';
    dom.dbMessage.style.color = '#333';
    submitScore(state.pendingTimeVal, feedbackValue, true);
}
