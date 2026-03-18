import { initDom, dom, state } from './state.js';
import { getStorage, setStorage } from './storage.js';
import { fetchConfig, fetchPlayedDays, verifyPlayerName, submitScore, recoverPendingFail } from './network.js';
import { buildSidebar, autoSelectDayFromUrl } from './sidebar.js';
import { selectDay, returnToMenu } from './ui.js';
import { startGame } from './game.js';
import { verifyOrder } from './logic.js';
import { handleFeedback } from './endgame.js';
import { GAS_URL } from './config.js';

// ── Boot ──────────────────────────────────────────────────────────────────────
initDom();
recoverPendingFail();

// Restore saved name
const savedName = getStorage('orderix_player_name');
if (savedName) {
    state.isNameValid = true;
    if (dom.nameInputContainer)  dom.nameInputContainer.classList.add('hidden');
    if (dom.nameStatus)          dom.nameStatus.classList.add('hidden');
    if (dom.lockedNameDisplay) {
        dom.lockedNameDisplay.textContent = savedName;
        dom.lockedNameDisplay.classList.remove('hidden');
    }
    fetchPlayedDays(savedName);
}

// Load config then build sidebar + auto-select URL day
fetchConfig(() => {
    buildSidebar(selectDay);
    autoSelectDayFromUrl(selectDay);
});

// ── Button wiring ─────────────────────────────────────────────────────────────
dom.startBtn.addEventListener('click', startGame);
dom.checkBtn.addEventListener('click', verifyOrder);
dom.menuBtn.addEventListener('click', returnToMenu);
dom.verifyNameBtn.addEventListener('click', verifyPlayerName);

dom.btnLike.onclick    = () => handleFeedback('like');
dom.btnDislike.onclick = () => handleFeedback('dislike');
dom.btnSkip.onclick    = () => handleFeedback('none');

// ── Share button ──────────────────────────────────────────────────────────────
dom.shareBtn.addEventListener('click', () => {
    let isWin = false, timeVal = 0;
    if (state.pendingTimeVal !== 0) {
        isWin    = state.pendingTimeVal > 0;
        timeVal  = Math.abs(state.pendingTimeVal);
    } else if (state.currentDayConfig && state.serverPlayedDays[state.currentDayConfig.id]) {
        isWin   = state.serverPlayedDays[state.currentDayConfig.id].isWin;
        timeVal = Math.abs(state.serverPlayedDays[state.currentDayConfig.id].time);
    } else return;

    const status   = isWin ? "réussi" : "raté";
    const timeStr  = timeVal == 999999 ? "RAGE QUIT" : timeVal;
    const player   = getStorage('orderix_player_name') || dom.playerNameMainInput.value.trim() || '';
    const url      = window.location.href.split('?')[0] + '?ref=' + encodeURIComponent(player) + '&day=' + state.currentDayConfig.id;
    const text     = `J'ai ${status} le jeu ${state.currentDayConfig.title} avec un temps de ${timeStr}s clique ici ${url} pour essayer de me battre !`;

    navigator.clipboard.writeText(text).then(() => {
        dom.shareBtn.textContent = "COPIÉ !";
        setTimeout(() => dom.shareBtn.textContent = "PARTAGE", 2000);
        if (!state.hasSharedThisGame && state.pendingTimeVal !== 0) {
            state.hasSharedThisGame = true;
            submitScore(state.pendingTimeVal, '', true);
        }
    });
});

// ── Anti-cheat: back button ───────────────────────────────────────────────────
window.addEventListener('popstate', () => {
    if (state.gameInProgress && state.currentDayConfig && !state.isPaused) {
        
        import('./endgame.js').then(m => m.endGame('Retour détecté ! Partie abandonnée.', false, true));
    }
});

// ── Anti-cheat: tab close ─────────────────────────────────────────────────────
window.addEventListener('beforeunload', (e) => {
    if (state.gameInProgress && state.currentDayConfig && !state.isPaused) {
        document.body.style.display = 'none';
        e.preventDefault(); e.returnValue = '';
    }
});
