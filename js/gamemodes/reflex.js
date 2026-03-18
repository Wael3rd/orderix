import { state, dom } from '../state.js';
import { generateValues, applyStyle } from '../renderer.js';
import { endGame } from '../endgame.js';

export function startReflex() {
    dom.board.style.display   = 'block';
    dom.board.style.position  = 'relative';
    dom.board.style.height    = '350px';
    dom.board.style.width     = '100%';

    let spawned = 0, clicked = 0;

    function spawn() {
        if (spawned >= state.activeItemCount || state.isPaused) return;
        const item = document.createElement('div');
        item.className    = `item type-${state.currentDayConfig.type}`;
        item.style.position = 'absolute';

        const bw = Math.min(dom.board.clientWidth || 300, 800) - 60;
        item.style.left = Math.max(0, Math.random() * bw) + 'px';
        item.style.top  = Math.max(0, Math.random() * (350 - 60)) + 'px';

        const vals = generateValues(state.currentDayConfig.type, 10);
        applyStyle(item, state.currentDayConfig.type, vals[Math.floor(Math.random() * vals.length)]);

        item.addEventListener('touchstart', (e) => {
            e.preventDefault();
            if (state.isPaused) return;
            item.remove(); clicked++;
            if (clicked >= state.activeItemCount) endGame('Cibles détruites !', true);
        });
        item.addEventListener('mousedown', () => {
            if (state.isPaused) return;
            item.remove(); clicked++;
            if (clicked >= state.activeItemCount) endGame('Cibles détruites !', true);
        });

        dom.board.appendChild(item);
        spawned++;
        state.gameTimeout = setTimeout(spawn, 300 + Math.random() * 500);
    }
    spawn();
}

export function previewReflex(day, row) {
    const desc = document.createElement('div');
    desc.innerHTML = 'Cliquez vite sur les éléments<br>qui apparaissent !';
    desc.style.cssText = 'text-align:center;font-weight:bold;color:#333;';
    const vals = [1]; // dummy
    const { generateValues: gv, applyStyle: as } = { generateValues, applyStyle };
    const item = document.createElement('div');
    item.className = `item type-${day.type}`;
    const v = generateValues(day.type, 5);
    applyStyle(item, day.type, v[0]);
    item.style.margin = '0 20px';
    item.style.boxShadow = '0 0 0 4px #ffc107';
    row.append(desc, item);
}
