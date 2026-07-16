// ─── Logique de jeu : clics sur items et vérification des tris ───

// Consomme le joker s'il est disponible : l'erreur est pardonnée une fois.
function consumeShield() {
    if (!shieldAvailable) return false;
    shieldAvailable = false;
    haptic(50);
    resultDisplay.textContent = 'Joker utilisé — plus le droit à l\'erreur !';
    resultDisplay.style.color = '#F5B227';
    const hud = document.getElementById('round-hud');
    if (hud) hud.innerHTML = `Manche ${currentRound}/${totalRounds} · Joker <span style="color:#B9BDC9;font-size:1.1em">○</span>`;
    setTimeout(() => {
        if (!isPaused && resultDisplay.textContent.indexOf('Joker') === 0) resultDisplay.textContent = '';
    }, 1600);
    return true;
}

// Succès d'une manche (modes `rounds`) : manche suivante, ou victoire finale
function genericRoundWin(winMessage) {
    if (currentRound < totalRounds) {
        currentRound++;
        haptic(12);
        resultDisplay.textContent = 'Bien vu — manche suivante !';
        resultDisplay.style.color = '#34B871';
        setTimeout(() => {
            if (isPaused) return;
            resultDisplay.textContent = '';
            window.startGenericRound();
        }, 550);
    } else {
        endGame(winMessage, true);
    }
}

// Erreur sur un item : joker si disponible (l'item fautif est neutralisé),
// sinon défaite avec mise en évidence de la solution.
function genericRoundFail(item, correctVals, failMessage) {
    if (GAME_MODES[currentDayConfig.modeId].rounds && consumeShield()) {
        item.classList.add('error');
        item.style.pointerEvents = 'none';
        return;
    }
    item.classList.add('error');
    showSolutionHighlight(correctVals);
    endGame(failMessage, false);
}

function handleLogic(item, val, targetVal, mode, values) {
    if (item.classList.contains('matched')) return;

    // Désélection
    if (mode.isPairsMatch && flipped.includes(item)) {
        flipped.splice(flipped.indexOf(item), 1);
        const b = item.querySelector('.badge'); if (b) b.remove();
        return;
    }
    if ((mode.isSum || mode.isDiff) && selectionOrder.includes(item)) {
        const index = selectionOrder.indexOf(item);
        selectionOrder.splice(index, 1);
        item.classList.remove('selected');
        renderBadges();
        return;
    }

    if (mode.peekHide) {
        item.classList.remove('peek-hidden');
        applyStyle(item, currentDayConfig.type, val);
        setTimeout(() => {
            if (!selectionOrder.includes(item)) {
                item.innerHTML = '';
                item.className = `item type-${currentDayConfig.type} peek-hidden`;
            }
        }, 1000);
    }

    if (mode.isPairsMatch) {
        flipped.push(item);

        const badge = document.createElement('div');
        badge.className = 'badge';
        item.appendChild(badge);

        if (flipped.length === 2) {
            if (Math.abs(parseFloat(flipped[0].dataset.value) - parseFloat(flipped[1].dataset.value)) < 0.0001) {
                flipped.forEach(f => {
                    const b = f.querySelector('.badge'); if (b) b.remove();
                    f.classList.add('matched');
                });
                matched += 2;
                flipped = [];
                haptic(12);
                if (matched >= activeItemCount) endGame('Toutes les paires sont réunies !', true);
            } else {
                flipped.forEach(f => f.classList.add('error'));
                setTimeout(() => {
                    if (isPaused) return;
                    flipped.forEach(f => {
                        f.classList.remove('error');
                        const b = f.querySelector('.badge'); if (b) b.remove();
                    });
                    flipped = [];
                }, 300);
            }
        }
        return;
    }

    if (mode.isSort) {
        const index = selectionOrder.indexOf(item);
        if (index > -1) {
            selectionOrder.splice(index, 1);
            item.classList.remove('selected');
        } else {
            if (selectionOrder.length >= activeItemCount) return;
            selectionOrder.push(item);
            item.classList.add('selected');
            haptic(8);
        }
        renderBadges();
        return;
    }

    if (mode.findTarget) {
        if (Math.abs(val - targetVal) < 0.0001) {
            item.classList.add('matched');
            genericRoundWin('Toutes les cibles atteintes !');
        } else {
            genericRoundFail(item, [targetVal], 'Ce n\'était pas celui-là — la bonne réponse est entourée.');
        }
        return;
    }

    if (mode.winOnOdd || mode.winOnPairs) {
        let c = values.filter(v => Math.abs(v - val) < 0.0001).length;
        if (mode.winOnOdd && c === 1) {
            item.classList.add('matched');
            genericRoundWin('Intrus démasqué !');
        }
        else if (mode.winOnPairs && c === 2) {
            matched++;
            const badge = document.createElement('div');
            badge.className = 'badge';
            item.appendChild(badge);
            item.classList.add('matched');
            haptic(12);
            if (matched === 2) genericRoundWin('Jumeaux réunis !');
        }
        else {
            let correctVals = [];
            if (mode.winOnOdd) correctVals = [values.find(v => values.filter(x => Math.abs(x - v) < 0.0001).length === 1)];
            if (mode.winOnPairs) correctVals = [values.find(v => values.filter(x => Math.abs(x - v) < 0.0001).length === 2)];
            genericRoundFail(item, correctVals, 'Raté — la bonne réponse est entourée.');
        }
        return;
    }

    if (mode.isSum || mode.isDiff) {
        item.classList.add('selected');
        selectionOrder.push(item);
        renderBadges();

        if (selectionOrder.length === 2) {
            let v1 = parseFloat(selectionOrder[0].dataset.value);
            let v2 = parseFloat(selectionOrder[1].dataset.value);
            if ((mode.isSum && Math.abs((v1 + v2) - targetSum) < 0.001) || (mode.isDiff && Math.abs(Math.abs(v1 - v2) - targetDiff) < 0.001)) {
                genericRoundWin('Calcul exact !');
            } else if (mode.rounds && consumeShield()) {
                // Joker : la paire fautive clignote puis se désélectionne
                const sel = selectionOrder.slice();
                sel.forEach(i => i.classList.add('error'));
                selectionOrder = [];
                setTimeout(() => {
                    if (isPaused) return;
                    sel.forEach(i => { i.classList.remove('error'); i.classList.remove('selected'); });
                    renderBadges();
                }, 700);
            } else {
                selectionOrder.forEach(i => i.classList.add('error'));
                let correctVals = [];
                for (let i = 0; i < values.length; i++) {
                    for (let j = i + 1; j < values.length; j++) {
                        if (mode.isSum && Math.abs((values[i] + values[j]) - targetSum) < 0.001) { correctVals = [values[i], values[j]]; break; }
                        if (mode.isDiff && Math.abs(Math.abs(values[i] - values[j]) - targetDiff) < 0.001) { correctVals = [values[i], values[j]]; break; }
                    }
                    if (correctVals.length) break;
                }
                showSolutionHighlight(correctVals);
                endGame('Pas le bon compte — la solution est entourée.', false);
            }
        }
        return;
    }

    if (mode.avoidTarget) {
        if (Math.abs(val - Math.min(...values)) < 0.0001) {
            item.classList.add('error');
            showSolutionHighlight([Math.min(...values)]);
            endGame('Vous avez touché l\'élément interdit !', false);
        } else {
            item.classList.add('matched'); matched++;
            haptic(8);
            if (matched >= activeItemCount - 1) endGame('Survie réussie !', true);
        }
        return;
    }

    if (mode.isTargetMatch) {
        if (Math.abs(val - exactTarget) < 0.0001) {
            item.classList.add('matched');
            genericRoundWin('Correspondance parfaite !');
        } else {
            genericRoundFail(item, [exactTarget], 'Ce n\'était pas le bon — le modèle est entouré.');
        }
        return;
    }

    if (mode.isSequence) {
        if (Math.abs(val - targetSequence[currentSequenceIdx]) < 0.0001) {
            item.classList.add('matched');
            currentSequenceIdx++;
            haptic(10);

            if (currentSequenceIdx >= targetSequence.length) {
                endGame('Séquence complétée !', true);
            } else {
                const targetUI = document.getElementById('dynamic-target-ui');
                if (targetUI) {
                    targetUI.querySelector('span').textContent = `Étape ${currentSequenceIdx + 1}/${targetSequence.length} — Trouvez :`;
                    const visualTarget = targetUI.querySelector('.item');
                    visualTarget.innerHTML = '';
                    visualTarget.className = `item type-${currentDayConfig.type}`;
                    visualTarget.style.cssText = 'margin:0; pointer-events:none; box-shadow:0 0 0 3px #FFFFFF, 0 0 0 6px #4A6CFA;';
                    applyStyle(visualTarget, currentDayConfig.type, targetSequence[currentSequenceIdx]);
                }
            }
        } else {
            item.classList.add('error');
            showSolutionHighlight([targetSequence[currentSequenceIdx]]);
            endGame('Mauvaise étape — la bonne réponse est entourée.', false);
        }
        return;
    }

    if (mode.isMathQuiz) {
        if (Math.abs(val - currentMathTarget) < 0.0001) {
            item.classList.add('matched');
            currentRound++;
            haptic(10);
            if (currentRound > totalRounds) {
                endGame('Tous les calculs sont justes !', true);
            } else {
                setTimeout(() => { if (!isPaused) window.startMathRound(); }, 400);
            }
        } else {
            item.classList.add('error');
            showSolutionHighlight([currentMathTarget]);
            endGame('Erreur de calcul — la bonne réponse est entourée.', false);
        }
        return;
    }
}

function verifyOrder() {
    if (isPaused) return;

    // Cas particulier : Dobble (validation des 4 colonnes)
    if (currentDayConfig && GAME_MODES[currentDayConfig.modeId].isDobble) {
        if (selectionOrder.length !== 4) {
            resultDisplay.textContent = "Sélectionnez un élément dans chacune des 4 colonnes.";
            resultDisplay.style.color = 'var(--terra-deep)';
            setTimeout(() => { if (!isPaused) resultDisplay.textContent = ''; }, 1500);
            return;
        }

        const targetValueClicked = parseFloat(selectionOrder[0].dataset.value);
        const isValidTarget = window.validDobbleTargets.some(t => Math.abs(t - targetValueClicked) < 0.0001);
        const allMatch = selectionOrder.every(item => Math.abs(parseFloat(item.dataset.value) - targetValueClicked) < 0.0001);

        if (isValidTarget && allMatch) {
            currentRound++;
            if (currentRound > totalRounds) {
                endGame('Observation parfaite !', true);
            } else {
                selectionOrder.forEach(item => { item.style.boxShadow = '0 0 0 3px #FFFFFF, 0 0 0 6px #34B871'; item.style.transform = 'scale(1.1)'; });
                setTimeout(() => { if (!isPaused) window.startDobbleRound(); }, 500);
            }
        } else {
            selectionOrder.forEach(item => item.style.boxShadow = '0 0 0 3px #FFFFFF, 0 0 0 6px #E0533D');
            showSolutionHighlight(window.validDobbleTargets);
            endGame('Ce n\'était pas le symbole commun.', false);
        }
        return;
    }

    if (selectionOrder.length < activeItemCount) {
        resultDisplay.textContent = `Sélectionnez d'abord les ${activeItemCount} éléments.`;
        resultDisplay.style.color = 'var(--terra-deep)';
        setTimeout(() => { if (!isPaused) resultDisplay.textContent = ''; }, 1500);
        return;
    }

    const mode = GAME_MODES[currentDayConfig.modeId];
    const values = selectionOrder.map(el => parseFloat(el.dataset.value));
    const sortedValues = [...values].sort((a, b) => mode.order === 1 ? a - b : b - a);
    const isCorrect = values.every((val, i) => val === sortedValues[i]);

    if (isCorrect) {
        endGame('Ordre parfait !', true);
    } else {
        isPaused = true;
        clearInterval(timerInterval);
        clearInterval(envInterval);
        board.classList.remove('blackout-mode');

        timerDisplay.textContent = (timeElapsed / 1000).toFixed(3);
        timerDisplay.classList.add('late');

        board.innerHTML = '';
        board.style.flexDirection = 'column';
        board.style.alignItems = 'center';

        // Correction visuelle : votre réponse ↔ la solution, reliées par des fils
        const solItems = Array.from(selectionOrder).slice();
        solItems.sort((a, b) => mode.order === 1 ? parseFloat(a.dataset.value) - parseFloat(b.dataset.value) : parseFloat(b.dataset.value) - parseFloat(a.dataset.value));

        const solValueToIndex = {};
        solItems.forEach((item, idx) => { solValueToIndex[parseFloat(item.dataset.value)] = idx; });

        const colW = 70; // item 60px + 10px d'espacement
        const n = selectionOrder.length;

        const container = document.createElement('div');
        container.style.cssText = 'width:100%;overflow-x:auto;padding:10px 0;';

        const innerWrap = document.createElement('div');
        innerWrap.style.cssText = 'display:flex;flex-direction:column;align-items:center;width:max-content;margin:0 auto;padding:0 15px;';

        const lblYou = document.createElement('div');
        lblYou.style.cssText = 'font-weight:bold;font-size:1rem;color:#8B90A0;text-align:center;margin-bottom:8px;';
        lblYou.textContent = 'Votre réponse :';
        innerWrap.appendChild(lblYou);

        const playerRow = document.createElement('div');
        playerRow.style.cssText = 'display:flex;gap:10px;justify-content:center;position:relative;z-index:1;';
        selectionOrder.forEach((item, index) => {
            const clone = item.cloneNode(true);
            clone.style.marginBottom = '28px';
            const actualVal = parseFloat(clone.dataset.value);
            const expectedVal = sortedValues[index];
            if (actualVal !== expectedVal) {
                const badge = clone.querySelector('.badge');
                if (badge) badge.classList.add('error');
            }
            playerRow.appendChild(clone);
        });
        innerWrap.appendChild(playerRow);

        const svgH = 66;
        const svgW = n * colW - 10;
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('width', svgW);
        svg.setAttribute('height', svgH);
        svg.style.cssText = 'display:block;margin:-13px auto;flex-shrink:0;position:relative;z-index:0;';

        selectionOrder.forEach((item, fromIdx) => {
            const val = parseFloat(item.dataset.value);
            const toIdx = solValueToIndex[val];
            const x1 = fromIdx * colW + 30;
            const x2 = toIdx * colW + 30;
            const isWrong = fromIdx !== toIdx;
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', x1);
            line.setAttribute('y1', 0);
            line.setAttribute('x2', x2);
            line.setAttribute('y2', svgH);
            line.setAttribute('stroke', isWrong ? '#E0533D' : '#34B871');
            line.setAttribute('stroke-width', isWrong ? '2.5' : '1.5');
            line.setAttribute('stroke-opacity', isWrong ? '0.8' : '0.4');
            svg.appendChild(line);
        });

        const svgTxt = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        svgTxt.setAttribute('x', svgW / 2);
        svgTxt.setAttribute('y', svgH / 2 + 5);
        svgTxt.setAttribute('text-anchor', 'middle');
        svgTxt.setAttribute('fill', '#8B90A0');
        svgTxt.setAttribute('font-size', '13');
        svgTxt.setAttribute('font-weight', 'bold');
        svgTxt.setAttribute('font-family', 'Karla, sans-serif');
        svgTxt.textContent = '↓ Solution ↓';
        svg.appendChild(svgTxt);

        innerWrap.appendChild(svg);

        const solRow = document.createElement('div');
        solRow.style.cssText = 'display:flex;gap:10px;justify-content:center;position:relative;z-index:1;';
        solItems.forEach((item, index) => {
            const clone = item.cloneNode(true);
            clone.style.marginTop = '28px';
            clone.style.marginBottom = '0';
            clone.className = `item type-${currentDayConfig.type}`;
            const oldBadge = clone.querySelector('.badge');
            if (oldBadge) oldBadge.remove();
            const badge = document.createElement('div');
            badge.className = 'badge top';
            badge.textContent = index + 1;
            clone.appendChild(badge);
            solRow.appendChild(clone);
        });
        innerWrap.appendChild(solRow);

        container.appendChild(innerWrap);
        board.appendChild(container);

        endGame('Pas tout à fait — voici la correction.', false);
    }
}
