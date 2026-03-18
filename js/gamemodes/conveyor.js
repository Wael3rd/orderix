import { state, dom } from '../state.js';
import { generateValues, applyStyle } from '../renderer.js';
import { endGame } from '../endgame.js';

export function startConveyor() {
    dom.board.style.display       = 'flex';
    dom.board.style.flexDirection = 'column';
    dom.board.style.alignItems    = 'center';
    dom.board.style.overflow      = 'hidden';
    dom.board.style.width         = '100%';

    const tType = state.currentDayConfig.type || 'numbers';
    let pool = generateValues(tType, 5);
    let vals = []; for (let i = 0; i < state.activeItemCount; i++) vals.push(pool[Math.floor(Math.random() * pool.length)]);

    const beltWrapper = document.createElement('div');
    beltWrapper.style.cssText = 'position:relative;width:340px;height:100px;display:flex;justify-content:flex-start;align-items:center;overflow:hidden;margin-bottom:30px;border-radius:8px;background:rgba(0,0,0,0.05);-webkit-mask-image:linear-gradient(to right,transparent 0%,black 15%,black 85%,transparent 100%);mask-image:linear-gradient(to right,transparent 0%,black 15%,black 85%,transparent 100%);';
    const beltContainer = document.createElement('div');
    beltContainer.style.cssText = 'display:flex;align-items:center;height:100%;transition:transform 0.15s cubic-bezier(0.4,0,0.2,1);width:max-content;padding-left:130px;';
    const centerMark = document.createElement('div');
    centerMark.style.cssText = 'position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:64px;height:64px;border:4px solid #ffc107;border-radius:10px;z-index:5;pointer-events:none;box-shadow:0 0 10px rgba(0,0,0,0.3);';

    vals.forEach(val => {
        const item = document.createElement('div');
        item.className = `item type-${tType}`;
        item.style.margin = '0 10px'; item.style.flexShrink = '0'; item.style.transition = 'opacity 0.2s,transform 0.2s';
        applyStyle(item, tType, val); beltContainer.appendChild(item);
    });
    beltWrapper.appendChild(beltContainer); beltWrapper.appendChild(centerMark); dom.board.appendChild(beltWrapper);

    const btnContainer = document.createElement('div');
    btnContainer.style.cssText = 'display:flex;gap:15px;flex-wrap:wrap;justify-content:center;padding:10px;';
    let cIdx = 0;
    const uniqueVals = [...new Set(vals)].sort(() => Math.random() - 0.5);
    uniqueVals.forEach(uVal => {
        const btn = document.createElement('div');
        btn.className = `item type-${tType}`; btn.style.cursor = 'pointer';
        applyStyle(btn, tType, uVal);
        btn.addEventListener('pointerdown', (e) => {
            e.preventDefault(); if (state.isPaused) return;
            if (vals[cIdx] === uVal) {
                beltContainer.children[cIdx].style.opacity   = '0';
                beltContainer.children[cIdx].style.transform = 'scale(0.5)';
                cIdx++;
                beltContainer.style.transform = `translateX(-${cIdx * 80}px)`;
                if (cIdx >= vals.length) endGame('Tapis vidé !', true);
            } else { endGame('Erreur, mauvais objet chargé !', false); }
        });
        btnContainer.appendChild(btn);
    });
    dom.board.appendChild(btnContainer);
}

export function previewConveyor(day, board, row) {
    // Reuse the full conveyor preview (it's animated and self-contained)
    board.style.cssText = 'display:flex;flex-direction:column;align-items:center;overflow:hidden;width:100%;';
    const tType = day.type || 'numbers';
    const beltLength = 8;
    let pool = generateValues(tType, 5);
    let vals = []; for (let i = 0; i < beltLength; i++) vals.push(pool[Math.floor(Math.random() * pool.length)]);

    const beltWrapper = document.createElement('div');
    beltWrapper.style.cssText = 'position:relative;width:340px;height:100px;display:flex;justify-content:flex-start;align-items:center;overflow:hidden;margin-bottom:30px;border-radius:8px;background:rgba(0,0,0,0.05);-webkit-mask-image:linear-gradient(to right,transparent 0%,black 15%,black 85%,transparent 100%);mask-image:linear-gradient(to right,transparent 0%,black 15%,black 85%,transparent 100%);';
    const beltContainer = document.createElement('div');
    beltContainer.style.cssText = 'display:flex;align-items:center;height:100%;transition:transform 0.15s cubic-bezier(0.4,0,0.2,1);width:max-content;padding-left:130px;';
    const centerMark = document.createElement('div');
    centerMark.style.cssText = 'position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:64px;height:64px;border:4px solid #ffc107;border-radius:10px;z-index:5;pointer-events:none;box-shadow:0 0 10px rgba(0,0,0,0.3);';

    vals.forEach(val => {
        const item = document.createElement('div');
        item.className = `item type-${tType}`;
        item.style.margin = '0 10px'; item.style.flexShrink = '0'; item.style.transition = 'opacity 0.2s,transform 0.2s';
        applyStyle(item, tType, val); beltContainer.appendChild(item);
    });
    beltWrapper.appendChild(beltContainer); beltWrapper.appendChild(centerMark); board.appendChild(beltWrapper);

    const btnContainer = document.createElement('div');
    btnContainer.style.cssText = 'display:flex;gap:15px;flex-wrap:wrap;justify-content:center;padding:10px;';
    let cIdx = 0;
    const uniqueVals = [...new Set(vals)].sort(() => Math.random() - 0.5);
    uniqueVals.forEach(uVal => {
        const btn = document.createElement('div');
        btn.className = `item type-${tType}`; btn.style.cursor = 'pointer';
        applyStyle(btn, tType, uVal);
        btn.addEventListener('pointerdown', (e) => {
            e.preventDefault();
            if (vals[cIdx] === uVal) {
                beltContainer.children[cIdx].style.opacity   = '0';
                beltContainer.children[cIdx].style.transform = 'scale(0.5)';
                cIdx++;
                beltContainer.style.transform = `translateX(-${cIdx * 80}px)`;
            } else { endGame('Erreur, mauvais objet chargé !', false); }
        });
        btnContainer.appendChild(btn);
    });
    board.appendChild(btnContainer);
}
