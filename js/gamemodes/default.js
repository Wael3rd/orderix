import { state, dom } from '../state.js';
import { generateValues, applyStyle } from '../renderer.js';
import { handleLogic } from '../logic.js';
import { endGame } from '../endgame.js';

export function startDefault(mode) {
    dom.board.style.flexDirection = 'row';
    dom.board.style.alignItems    = 'flex-start';
    dom.board.style.display       = 'flex';
    dom.board.style.position      = 'static';

    let values = [];
    if (mode.specialGen === 'odd') {
        let v = generateValues(state.currentDayConfig.type, Math.max(10, state.activeItemCount));
        let shuffledV = [...v].sort(() => Math.random() - 0.5);
        values.push(shuffledV[0]);
        let remaining = state.activeItemCount - 1, vIndex = 1;
        if (remaining === 1) { values.push(shuffledV[1]); }
        else {
            while (remaining > 0) {
                let copies = remaining > 5 ? Math.floor(Math.random() * 3) + 2 : remaining > 4 ? Math.floor(Math.random() * 2) + 2 : remaining === 4 ? 2 : remaining;
                for (let i = 0; i < copies; i++) values.push(shuffledV[vIndex]);
                remaining -= copies; vIndex++;
                if (vIndex >= shuffledV.length) vIndex = 1;
            }
        }
    } else if (mode.specialGen === 'pair') {
        let v = generateValues(state.currentDayConfig.type, state.activeItemCount - 1);
        let dup = v[Math.floor(Math.random() * v.length)];
        values = [...v]; values.push(dup);
    } else if (mode.specialGen === 'pairs') {
        let pc = Math.floor(state.activeItemCount / 2);
        state.activeItemCount = pc * 2;
        let v = generateValues(state.currentDayConfig.type, pc);
        values = [...v, ...v];
    } else {
        values = generateValues(state.currentDayConfig.type, state.activeItemCount * (mode.filter ? 3 : 1));
        if (mode.filter === 'even') values = values.filter(x => Math.floor(x) % 2 === 0).slice(0, state.activeItemCount);
        if (mode.filter === 'odd')  values = values.filter(x => Math.floor(x) % 2 !== 0).slice(0, state.activeItemCount);
        state.activeItemCount = values.length;
    }

    let shuf = [...values].sort(() => Math.random() - 0.5);

    // Clear old target UI
    const existingTargetUI = document.getElementById('dynamic-target-ui');
    if (existingTargetUI) existingTargetUI.remove();

    // Initialise mode-specific state
    if (mode.isSum) { state.targetSum  = parseFloat((shuf[0] + shuf[1]).toFixed(4)); dom.levelTitle.textContent += ' (Addition)'; }
    if (mode.isDiff) { state.targetDiff = parseFloat(Math.abs(shuf[0] - shuf[1]).toFixed(4)); dom.levelTitle.textContent += ' (Soustraction)'; }
    if (mode.isTargetMatch) { state.exactTarget = shuf[Math.floor(Math.random() * shuf.length)]; dom.resultDisplay.textContent = 'Trouvez ce modèle !'; dom.resultDisplay.style.color = '#333'; }
    if (mode.isSequence) {
        let u = [...new Set(shuf)];
        state.targetSequence     = u.slice(0, Math.min(mode.sequenceLength || 5, u.length));
        state.currentSequenceIdx = 0;
        dom.resultDisplay.textContent = 'Trouvez la séquence !'; dom.resultDisplay.style.color = '#333';
    }

    // Visual target UI
    if (mode.isSum || mode.isDiff || mode.isTargetMatch || mode.isSequence) {
        const targetUI = document.createElement('div'); targetUI.id = 'dynamic-target-ui';
        targetUI.style.cssText = 'display:flex;justify-content:center;align-items:center;width:100%;margin-bottom:20px;gap:15px;font-weight:bold;font-size:1.2rem;color:#555;';
        const lbl = document.createElement('span');
        if (mode.isSequence) lbl.textContent = `Étape 1/${state.targetSequence.length} - Trouvez :`;
        else lbl.textContent = mode.isTargetMatch ? 'Modèle à trouver :' : 'Cible à obtenir :';
        targetUI.appendChild(lbl);
        const visualTarget = document.createElement('div');
        visualTarget.className = `item type-${state.currentDayConfig.type}`;
        visualTarget.style.cssText = 'margin:0;pointer-events:none;box-shadow:0 0 0 4px #007bff;';
        let tVal = mode.isSequence ? state.targetSequence[0] : (mode.isTargetMatch ? state.exactTarget : (mode.isSum ? state.targetSum : state.targetDiff));
        applyStyle(visualTarget, state.currentDayConfig.type, tVal);
        targetUI.appendChild(visualTarget);
        dom.board.parentNode.insertBefore(targetUI, dom.board);
    }

    const tMax = Math.max(...values);
    const tMin = Math.min(...values);
    const targetVal = mode.findTarget === 'max' ? tMax : (mode.findTarget === 'min' ? tMin : (mode.findTarget === 'median' ? [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)] : null));

    shuf.forEach(val => {
        const item = document.createElement('div');
        item.className = `item type-${state.currentDayConfig.type}`;
        if (mode.cssClass) item.classList.add(mode.cssClass);
        item.dataset.value = val;

        if (mode.hidden || mode.peekHide) item.classList.add('peek-hidden');
        else applyStyle(item, state.currentDayConfig.type, val);

        let pressTimer, lastTap = 0;
        if (!mode.useCursor) {
            item.addEventListener('click', (e) => {
                if (state.isPaused) return;
                if (mode.requireDbTap) {
                    const now = Date.now();
                    if (now - lastTap < 300) { clearTimeout(pressTimer); handleLogic(item, val, targetVal, mode, values); }
                    else { item.classList.add('error'); setTimeout(() => item.classList.remove('error'), 200); }
                    lastTap = now; return;
                }
                if (mode.requireLong) return;
                handleLogic(item, val, targetVal, mode, values);
            });
            if (mode.requireLong) {
                item.addEventListener('mousedown', () => { pressTimer = setTimeout(() => handleLogic(item, val, targetVal, mode, values), 800); });
                item.addEventListener('mouseup',   () => clearTimeout(pressTimer));
                item.addEventListener('mouseleave',() => clearTimeout(pressTimer));
                item.addEventListener('touchstart',() => { pressTimer = setTimeout(() => handleLogic(item, val, targetVal, mode, values), 800); }, { passive: true });
                item.addEventListener('touchend',  () => clearTimeout(pressTimer));
            }
            if (mode.runAway) {
                item.addEventListener('mousemove', () => {
                    if (Math.abs(val - tMin) < 0.0001) item.style.transform = `translate(${(Math.random() - 0.5) * 150}px,${(Math.random() - 0.5) * 150}px)`;
                });
            }
        }
        dom.board.appendChild(item);
    });

    if (mode.flashHide) setTimeout(() => document.querySelectorAll('.item').forEach(el => el.classList.add('peek-hidden')), 2000);
    if (mode.shuffleTick) state.envInterval = setInterval(() => { if (!state.isPaused) document.querySelectorAll('.item').forEach(el => el.style.order = Math.floor(Math.random() * 100)); }, mode.shuffleTick);
    if (mode.blackout)    state.envInterval = setInterval(() => { if (!state.isPaused) dom.board.classList.toggle('blackout-mode'); }, 1500);

    // Cursor mode
    if (mode.useCursor) {
        let cursorIdx = 0, cursorDir = 1;
        const domItems = Array.from(dom.board.querySelectorAll('.item'));
        if (domItems.length > 0) domItems[0].classList.add('cursor-active');
        state.envInterval = setInterval(() => {
            if (state.isPaused || domItems.length === 0) return;
            domItems[cursorIdx].classList.remove('cursor-active');
            cursorIdx += cursorDir;
            if (cursorIdx >= domItems.length) { cursorIdx = Math.max(0, domItems.length - 2); cursorDir = -1; }
            else if (cursorIdx < 0)           { cursorIdx = Math.min(1, domItems.length - 1); cursorDir = 1; }
            domItems[cursorIdx].classList.add('cursor-active');
        }, 100);
        dom.board.onpointerdown = (e) => {
            if (state.isPaused) return; e.preventDefault();
            const activeItem = domItems[cursorIdx];
            if (activeItem) handleLogic(activeItem, parseFloat(activeItem.dataset.value), targetVal, mode, values);
        };
    } else {
        dom.board.onpointerdown = null;
    }
}
