import { state, dom } from './state.js';
import { GAME_MODES } from './config.js';
import { applyStyle } from './renderer.js';
import { endGame } from './endgame.js';

// ── Badge rendering ───────────────────────────────────────────────────────────
export function renderBadges() {
    document.querySelectorAll('.badge').forEach(b => b.remove());
    const mode = GAME_MODES[state.currentDayConfig.modeId];
    state.selectionOrder.forEach((item, index) => {
        const badge = document.createElement('div');
        badge.className = 'badge';
        badge.textContent = (mode && mode.isSort) ? (index + 1) : '';
        item.appendChild(badge);
    });
}

// ── Solution highlight ────────────────────────────────────────────────────────
export function showSolutionHighlight(correctValues) {
    if (!correctValues || correctValues.length === 0) return;
    const domItems = document.querySelectorAll('#game-board .item');
    let valuesToHighlight = [...correctValues];

    domItems.forEach(item => {
        const v   = parseFloat(item.dataset.value);
        const idx = valuesToHighlight.findIndex(cv => Math.abs(cv - v) < 0.0001);
        if (idx !== -1) {
            item.classList.remove('error', 'peek-hidden');
            item.style.boxShadow = '0 0 0 6px #28a745';
            item.style.transform = 'scale(1.15)';
            item.style.zIndex    = '100';
            item.style.opacity   = '1';
            valuesToHighlight.splice(idx, 1);
        } else {
            if (!item.classList.contains('error')) item.style.opacity = '0.3';
        }
    });
}

// ── Main logic dispatcher ─────────────────────────────────────────────────────
export function handleLogic(item, val, targetVal, mode, values) {
    if (item.classList.contains('matched')) return;

    // De-selection
    if (mode.isPairsMatch && state.flipped.includes(item)) {
        state.flipped.splice(state.flipped.indexOf(item), 1);
        const b = item.querySelector('.badge'); if (b) b.remove();
        return;
    }
    if ((mode.isSum || mode.isDiff) && state.selectionOrder.includes(item)) {
        state.selectionOrder.splice(state.selectionOrder.indexOf(item), 1);
        item.classList.remove('selected');
        renderBadges();
        return;
    }

    // Peek reveal
    if (mode.peekHide) {
        item.classList.remove('peek-hidden');
        applyStyle(item, state.currentDayConfig.type, val);
        setTimeout(() => {
            if (!state.selectionOrder.includes(item)) {
                item.innerHTML = '';
                item.className = `item type-${state.currentDayConfig.type} peek-hidden`;
            }
        }, 1000);
    }

    // ── Pairs match ──
    if (mode.isPairsMatch) {
        state.flipped.push(item);
        const badge = document.createElement('div');
        badge.className  = 'badge';
        badge.textContent = '';
        item.appendChild(badge);

        if (state.flipped.length === 2) {
            if (Math.abs(parseFloat(state.flipped[0].dataset.value) - parseFloat(state.flipped[1].dataset.value)) < 0.0001) {
                state.flipped.forEach(f => { const b = f.querySelector('.badge'); if (b) b.remove(); f.classList.add('matched'); });
                state.matched += 2;
                state.flipped = [];
                if (state.matched >= state.activeItemCount) endGame('Paires trouvées !', true);
            } else {
                state.flipped.forEach(f => f.classList.add('error'));
                setTimeout(() => {
                    if (state.isPaused) return;
                    state.flipped.forEach(f => { f.classList.remove('error'); const b = f.querySelector('.badge'); if (b) b.remove(); });
                    state.flipped = [];
                }, 300);
            }
        }
        return;
    }

    // ── Sort ──
    if (mode.isSort) {
        const index = state.selectionOrder.indexOf(item);
        if (index > -1) { state.selectionOrder.splice(index, 1); item.classList.remove('selected'); }
        else            { if (state.selectionOrder.length >= state.activeItemCount) return; state.selectionOrder.push(item); item.classList.add('selected'); }
        renderBadges();
        return;
    }

    // ── Find target ──
    if (mode.findTarget) {
        if (Math.abs(val - targetVal) < 0.0001) endGame('Cible atteinte !', true);
        else { item.classList.add('error'); showSolutionHighlight([targetVal]); endGame('Mauvaise cible !', false); }
        return;
    }

    // ── Odd / Pairs ──
    if (mode.winOnOdd || mode.winOnPairs) {
        const c = values.filter(v => Math.abs(v - val) < 0.0001).length;
        if (mode.winOnOdd && c === 1) endGame('Intrus trouvé !', true);
        else if (mode.winOnPairs && c === 2) {
            state.matched++;
            const badge = document.createElement('div'); badge.className = 'badge'; badge.textContent = '';
            item.appendChild(badge); item.classList.add('matched');
            if (state.matched === 2) endGame('Jumeaux trouvés !', true);
        } else {
            item.classList.add('error');
            let correctVals = [];
            if (mode.winOnOdd)   correctVals = [values.find(v => values.filter(x => Math.abs(x - v) < 0.0001).length === 1)];
            if (mode.winOnPairs) correctVals = [values.find(v => values.filter(x => Math.abs(x - v) < 0.0001).length === 2)];
            showSolutionHighlight(correctVals);
            endGame('Erreur !', false);
        }
        return;
    }

    // ── Sum / Diff ──
    if (mode.isSum || mode.isDiff) {
        item.classList.add('selected');
        state.selectionOrder.push(item);
        renderBadges();
        if (state.selectionOrder.length === 2) {
            const v1 = parseFloat(state.selectionOrder[0].dataset.value);
            const v2 = parseFloat(state.selectionOrder[1].dataset.value);
            if ((mode.isSum && Math.abs((v1 + v2) - state.targetSum) < 0.001) ||
                (mode.isDiff && Math.abs(Math.abs(v1 - v2) - state.targetDiff) < 0.001)) {
                endGame('Calcul exact !', true);
            } else {
                state.selectionOrder.forEach(i => i.classList.add('error'));
                let correctVals = [];
                for (let i = 0; i < values.length; i++) {
                    for (let j = i + 1; j < values.length; j++) {
                        if (mode.isSum  && Math.abs((values[i] + values[j]) - state.targetSum) < 0.001) { correctVals = [values[i], values[j]]; break; }
                        if (mode.isDiff && Math.abs(Math.abs(values[i] - values[j]) - state.targetDiff) < 0.001) { correctVals = [values[i], values[j]]; break; }
                    }
                    if (correctVals.length) break;
                }
                showSolutionHighlight(correctVals);
                endGame('Erreur de calcul !', false);
            }
        }
        return;
    }

    // ── Avoid ──
    if (mode.avoidTarget) {
        if (Math.abs(val - Math.min(...values)) < 0.0001) {
            item.classList.add('error'); showSolutionHighlight([Math.min(...values)]); endGame('Cible touchée !', false);
        } else {
            item.classList.add('matched'); state.matched++;
            if (state.matched >= state.activeItemCount - 1) endGame('Survie réussie !', true);
        }
        return;
    }

    // ── Exact target match ──
    if (mode.isTargetMatch) {
        if (Math.abs(val - state.exactTarget) < 0.0001) endGame('Correspondance parfaite !', true);
        else { item.classList.add('error'); showSolutionHighlight([state.exactTarget]); endGame('Erreur !', false); }
        return;
    }

    // ── Sequence ──
    if (mode.isSequence) {
        if (Math.abs(val - state.targetSequence[state.currentSequenceIdx]) < 0.0001) {
            item.classList.add('matched');
            state.currentSequenceIdx++;
            if (state.currentSequenceIdx >= state.targetSequence.length) {
                endGame('Séquence complétée !', true);
            } else {
                const targetUI = document.getElementById('dynamic-target-ui');
                if (targetUI) {
                    targetUI.querySelector('span').textContent = `Étape ${state.currentSequenceIdx + 1}/${state.targetSequence.length} - Trouvez :`;
                    const visualTarget = targetUI.querySelector('.item');
                    visualTarget.innerHTML = ''; visualTarget.className = `item type-${state.currentDayConfig.type}`;
                    visualTarget.style.cssText = 'margin:0; pointer-events:none; box-shadow:0 0 0 4px #007bff;';
                    applyStyle(visualTarget, state.currentDayConfig.type, state.targetSequence[state.currentSequenceIdx]);
                }
            }
        } else {
            item.classList.add('error');
            showSolutionHighlight([state.targetSequence[state.currentSequenceIdx]]);
            endGame('Erreur de séquence !', false);
        }
        return;
    }

    // ── Math quiz ──
    if (mode.isMathQuiz) {
        if (Math.abs(val - state.currentMathTarget) < 0.0001) {
            item.classList.add('matched');
            state.currentRound++;
            if (state.currentRound > state.totalRounds) endGame('Calculs validés !', true);
            else setTimeout(() => { if (!state.isPaused) window.startMathRound(); }, 400);
        } else {
            item.classList.add('error');
            showSolutionHighlight([state.currentMathTarget]);
            endGame('Erreur de calcul !', false);
        }
        return;
    }
}

// ── Verify sort order ─────────────────────────────────────────────────────────
export function verifyOrder() {
    if (state.isPaused) return;

    if (state.selectionOrder.length < state.activeItemCount) {
        dom.resultDisplay.textContent = `Sélectionnez les ${state.activeItemCount} éléments d'abord.`;
        dom.resultDisplay.style.color = '#ff9800';
        setTimeout(() => { if (!state.isPaused) dom.resultDisplay.textContent = ''; }, 1500);
        return;
    }

    const mode        = GAME_MODES[state.currentDayConfig.modeId];
    const values      = state.selectionOrder.map(el => parseFloat(el.dataset.value));
    const sortedValues = [...values].sort((a, b) => mode.order === 1 ? a - b : b - a);
    const isCorrect   = values.every((val, i) => val === sortedValues[i]);

    if (isCorrect) {
        endGame('Bravo ! Jour terminé.', true);
        return;
    }

    // Show incorrect order UI
    state.isPaused = true;
    clearInterval(state.timerInterval);
    clearInterval(state.envInterval);
    dom.board.classList.remove('blackout-mode');
    dom.timerDisplay.textContent = (state.timeElapsed / 1000).toFixed(3);
    dom.timerDisplay.style.color = '#dc3545';

    dom.board.innerHTML = '';
    dom.board.style.flexDirection = 'column';
    dom.board.style.alignItems    = 'center';

    const solItems = Array.from(state.selectionOrder).slice();
    solItems.sort((a, b) => mode.order === 1
        ? parseFloat(a.dataset.value) - parseFloat(b.dataset.value)
        : parseFloat(b.dataset.value) - parseFloat(a.dataset.value));

    const solValueToIndex = {};
    solItems.forEach((item, idx) => { solValueToIndex[parseFloat(item.dataset.value)] = idx; });

    const colW = 70, n = state.selectionOrder.length;

    const container = document.createElement('div');
    container.style.cssText = 'width:100%;overflow-x:auto;padding:10px 0;';
    const innerWrap = document.createElement('div');
    innerWrap.style.cssText = 'display:flex;flex-direction:column;align-items:center;width:max-content;margin:0 auto;padding:0 15px;';

    const lblYou = document.createElement('div');
    lblYou.style.cssText = 'font-weight:bold;font-size:1rem;color:#555;text-align:center;margin-bottom:8px;';
    lblYou.textContent = 'Votre réponse :';
    innerWrap.appendChild(lblYou);

    const playerRow = document.createElement('div');
    playerRow.style.cssText = 'display:flex;gap:10px;justify-content:center;position:relative;z-index:1;';
    state.selectionOrder.forEach((item, index) => {
        const clone = item.cloneNode(true);
        clone.style.marginBottom = '28px';
        if (parseFloat(clone.dataset.value) !== sortedValues[index]) {
            const badge = clone.querySelector('.badge'); if (badge) badge.classList.add('error');
        }
        playerRow.appendChild(clone);
    });
    innerWrap.appendChild(playerRow);

    // SVG connecting lines
    const svgH = 66, svgW = n * colW - 10;
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', svgW); svg.setAttribute('height', svgH);
    svg.style.cssText = 'display:block;margin:-13px auto;flex-shrink:0;position:relative;z-index:0;';
    state.selectionOrder.forEach((item, fromIdx) => {
        const val   = parseFloat(item.dataset.value);
        const toIdx = solValueToIndex[val];
        const isWrong = fromIdx !== toIdx;
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', fromIdx * colW + 30); line.setAttribute('y1', 0);
        line.setAttribute('x2', toIdx   * colW + 30); line.setAttribute('y2', svgH);
        line.setAttribute('stroke',         isWrong ? '#dc3545' : '#28a745');
        line.setAttribute('stroke-width',   isWrong ? '2.5' : '1.5');
        line.setAttribute('stroke-opacity', isWrong ? '0.8' : '0.4');
        svg.appendChild(line);
    });
    const svgTxt = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    svgTxt.setAttribute('x', svgW / 2); svgTxt.setAttribute('y', svgH / 2 + 5);
    svgTxt.setAttribute('text-anchor', 'middle'); svgTxt.setAttribute('fill', '#555');
    svgTxt.setAttribute('font-size', '13'); svgTxt.setAttribute('font-weight', 'bold');
    svgTxt.setAttribute('font-family', 'Arial, sans-serif'); svgTxt.textContent = '↓ Solution ↓';
    svg.appendChild(svgTxt);
    innerWrap.appendChild(svg);

    const solRow = document.createElement('div');
    solRow.style.cssText = 'display:flex;gap:10px;justify-content:center;position:relative;z-index:1;';
    solItems.forEach((item, index) => {
        const clone = item.cloneNode(true);
        clone.style.marginTop = '28px'; clone.style.marginBottom = '0';
        clone.className = `item type-${state.currentDayConfig.type}`;
        const oldBadge = clone.querySelector('.badge'); if (oldBadge) oldBadge.remove();
        const badge = document.createElement('div'); badge.className = 'badge top'; badge.textContent = index + 1;
        clone.appendChild(badge); solRow.appendChild(clone);
    });
    innerWrap.appendChild(solRow);
    container.appendChild(innerWrap);
    dom.board.appendChild(container);

    endGame('Erreur ! Voici la correction.', false);
}
