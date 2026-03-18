import { state, dom } from './state.js';
import { DAYS } from './config.js';

export function buildSidebar(selectDay) {
    dom.dayButtonsContainer.innerHTML = '';
    const enabledDays = DAYS.filter(day => {
        const cfg = state.dayConfig[day.id];
        return !(cfg && cfg.enabled === false);
    });
    const daysToShow = Object.keys(state.dayConfig).length > 0 ? enabledDays : DAYS;

    daysToShow.forEach(day => {
        const btn = document.createElement('button');
        btn.className = 'day-btn';
        btn.dataset.dayId = day.id;

        const label = document.createElement('span');
        label.textContent = `Jour ${day.id}`;
        btn.appendChild(label);

        if (state.serverPlayedDays[day.id]) {
            const tick = document.createElement('span');
            tick.className = state.serverPlayedDays[day.id].isWin ? 'tick' : 'tick fail';
            tick.textContent = state.serverPlayedDays[day.id].isWin ? '✓' : '✗';
            btn.appendChild(tick);
        }

        btn.addEventListener('click', () => selectDay(day, btn));
        dom.dayButtonsContainer.appendChild(btn);
    });
}

export function refreshSidebar() {
    document.querySelectorAll('.day-btn').forEach(btn => {
        const id = parseInt(btn.dataset.dayId);
        let existingTick = btn.querySelector('.tick');
        if (state.serverPlayedDays[id]) {
            const isWin = state.serverPlayedDays[id].isWin;
            if (existingTick) {
                existingTick.className = isWin ? 'tick' : 'tick fail';
                existingTick.textContent = isWin ? '✓' : '✗';
            } else {
                const tick = document.createElement('span');
                tick.className = isWin ? 'tick' : 'tick fail';
                tick.textContent = isWin ? '✓' : '✗';
                btn.appendChild(tick);
            }
        } else if (existingTick) {
            existingTick.remove();
        }
    });
}

export function autoSelectDayFromUrl(selectDay) {
    const urlDay = parseInt(new URLSearchParams(window.location.search).get('day'));
    if (!urlDay) return;
    const day = DAYS.find(d => d.id === urlDay);
    if (!day) return;
    const btn = document.querySelector(`.day-btn[data-day-id="${urlDay}"]`);
    if (btn) selectDay(day, btn);
}
