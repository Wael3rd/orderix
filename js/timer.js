import { state, dom } from './state.js';

export function gameTick() {
    if (state.isPaused) {
        state.lastTime = Date.now();
        return;
    }
    const now = Date.now();
    state.timeElapsed += (now - state.lastTime);
    state.lastTime = now;
    dom.timerDisplay.textContent = (state.timeElapsed / 1000).toFixed(3);
}

export function startTimer() {
    clearInterval(state.timerInterval);
    state.lastTime = Date.now();
    state.timerInterval = setInterval(gameTick, 10);
}

export function stopTimer() {
    clearInterval(state.timerInterval);
}
