// --- Game Logic ---
        function handleLogic(item, val, targetVal, mode, values) {
            if (item.classList.contains('matched')) return;

            // --- DE-SELECTION LOGIC ---
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
            // --------------------------

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

                // Display badge instead of border (without number)
                const badge = document.createElement('div');
                badge.className = 'badge';
                badge.textContent = '';
                item.appendChild(badge);

                if (flipped.length === 2) {
                    if (Math.abs(parseFloat(flipped[0].dataset.value) - parseFloat(flipped[1].dataset.value)) < 0.0001) {
                        flipped.forEach(f => {
                            const b = f.querySelector('.badge'); if (b) b.remove();
                            f.classList.add('matched');
                        });
                        matched += 2;
                        flipped = [];
                        if (matched >= activeItemCount) endGame('Paires trouvées !', true);
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
                }
                renderBadges();
                return;
            }

            if (mode.findTarget) {
                if (Math.abs(val - targetVal) < 0.0001) endGame('Cible atteinte !', true);
                else {
                    item.classList.add('error');
                    showSolutionHighlight([targetVal]);
                    endGame('Mauvaise cible !', false);
                }
                return;
            }

            if (mode.winOnOdd || mode.winOnPairs) {
                let c = values.filter(v => Math.abs(v - val) < 0.0001).length;
                if (mode.winOnOdd && c === 1) endGame('Intrus trouvé !', true);
                else if (mode.winOnPairs && c === 2) {
                    matched++;
                    const badge = document.createElement('div');
                    badge.className = 'badge';
                    badge.textContent = '';
                    item.appendChild(badge);
                    item.classList.add('matched');
                    if (matched === 2) endGame('Jumeaux trouvés !', true);
                }
                else {
                    item.classList.add('error');
                    let correctVals = [];
                    if (mode.winOnOdd) correctVals = [values.find(v => values.filter(x => Math.abs(x - v) < 0.0001).length === 1)];
                    if (mode.winOnPairs) correctVals = [values.find(v => values.filter(x => Math.abs(x - v) < 0.0001).length === 2)];
                    showSolutionHighlight(correctVals);
                    endGame('Erreur !', false);
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
                        endGame('Calcul exact !', true);
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
                        endGame('Erreur de calcul !', false);
                    }
                }
                return;
            }

            if (mode.avoidTarget) {
                if (Math.abs(val - Math.min(...values)) < 0.0001) {
                    item.classList.add('error');
                    showSolutionHighlight([Math.min(...values)]);
                    endGame('Cible touchée !', false);
                } else {
                    item.classList.add('matched'); matched++;
                    if (matched >= activeItemCount - 1) endGame('Survie réussie !', true);
                }
                return;
            }

            if (mode.isTargetMatch) {
                if (Math.abs(val - exactTarget) < 0.0001) endGame('Correspondance parfaite !', true);
                else {
                    item.classList.add('error');
                    showSolutionHighlight([exactTarget]);
                    endGame('Erreur !', false);
                }
                return;
            }

            if (mode.isSequence) {
                if (Math.abs(val - targetSequence[currentSequenceIdx]) < 0.0001) {
                    item.classList.add('matched');
                    currentSequenceIdx++;

                    if (currentSequenceIdx >= targetSequence.length) {
                        endGame('Séquence complétée !', true);
                    } else {
                        const targetUI = document.getElementById('dynamic-target-ui');
                        if (targetUI) {
                            targetUI.querySelector('span').textContent = `Étape ${currentSequenceIdx + 1}/${targetSequence.length} - Trouvez :`;
                            const visualTarget = targetUI.querySelector('.item');
                            visualTarget.innerHTML = '';
                            visualTarget.className = `item type-${currentDayConfig.type}`;
                            visualTarget.style.cssText = 'margin:0; pointer-events:none; box-shadow:0 0 0 4px #007bff;';
                            applyStyle(visualTarget, currentDayConfig.type, targetSequence[currentSequenceIdx]);
                        }
                    }
                } else {
                    item.classList.add('error');
                    showSolutionHighlight([targetSequence[currentSequenceIdx]]);
                    endGame('Erreur de séquence !', false);
                }
                return;
            }

            if (mode.isMathQuiz) {
                if (Math.abs(val - currentMathTarget) < 0.0001) {
                    item.classList.add('matched');
                    currentRound++;
                    if (currentRound > totalRounds) {
                        endGame('Calculs validés !', true);
                    } else {
                        // Next round delay for visual feedback
                        setTimeout(() => { if (!isPaused) window.startMathRound(); }, 400);
                    }
                } else {
                    item.classList.add('error');
                    showSolutionHighlight([currentMathTarget]);
                    endGame('Erreur de calcul !', false);
                }
                return;
            }
        }

        function verifyOrder() {
            if (isPaused) return;

            if (selectionOrder.length < activeItemCount) {
                resultDisplay.textContent = `Sélectionnez les ${activeItemCount} éléments d'abord.`;
                resultDisplay.style.color = '#ff9800';
                setTimeout(() => { if (!isPaused) resultDisplay.textContent = ''; }, 1500);
                return;
            }

            const mode = GAME_MODES[currentDayConfig.modeId];
            const values = selectionOrder.map(el => parseFloat(el.dataset.value));
            const sortedValues = [...values].sort((a, b) => mode.order === 1 ? a - b : b - a);
            const isCorrect = values.every((val, i) => val === sortedValues[i]);

            if (isCorrect) {
                endGame(`Bravo ! Jour terminé.`, true);
            } else {
                isPaused = true;
                clearInterval(timerInterval);
                clearInterval(envInterval);
                board.classList.remove('blackout-mode');

                timerDisplay.textContent = (timeElapsed / 1000).toFixed(3);
                timerDisplay.style.color = '#dc3545';

                board.innerHTML = '';
                board.style.flexDirection = 'column';
                board.style.alignItems = 'center';

                // Build sorted solution items
                const solItems = Array.from(selectionOrder).slice();
                solItems.sort((a, b) => mode.order === 1 ? parseFloat(a.dataset.value) - parseFloat(b.dataset.value) : parseFloat(b.dataset.value) - parseFloat(a.dataset.value));

                // Build value-to-solution-index mapping for connecting lines
                const solValueToIndex = {};
                solItems.forEach((item, idx) => { solValueToIndex[parseFloat(item.dataset.value)] = idx; });

                const colW = 70; // 60px item + 10px gap
                const n = selectionOrder.length;

                // Container
                const container = document.createElement('div');
                container.style.cssText = 'width:100%;overflow-x:auto;padding:10px 0;';

                // Inner wrapper for safe scrolling and centering
                const innerWrap = document.createElement('div');
                innerWrap.style.cssText = 'display:flex;flex-direction:column;align-items:center;width:max-content;margin:0 auto;padding:0 15px;';

                // Label: your answer
                const lblYou = document.createElement('div');
                lblYou.style.cssText = 'font-weight:bold;font-size:1rem;color:#555;text-align:center;margin-bottom:8px;';
                lblYou.textContent = 'Votre réponse :';
                innerWrap.appendChild(lblYou);

                // Row 1: player's answer (badges below, red if wrong)
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

                // SVG connecting lines
                const svgH = 66; // 13px overlap top + 40px gap + 13px overlap bottom
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
                    line.setAttribute('stroke', isWrong ? '#dc3545' : '#28a745');
                    line.setAttribute('stroke-width', isWrong ? '2.5' : '1.5');
                    line.setAttribute('stroke-opacity', isWrong ? '0.8' : '0.4');
                    svg.appendChild(line);
                });

                // "Solution" label centered inside the SVG
                const svgTxt = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                svgTxt.setAttribute('x', svgW / 2);
                svgTxt.setAttribute('y', svgH / 2 + 5);
                svgTxt.setAttribute('text-anchor', 'middle');
                svgTxt.setAttribute('fill', '#555');
                svgTxt.setAttribute('font-size', '13');
                svgTxt.setAttribute('font-weight', 'bold');
                svgTxt.setAttribute('font-family', 'Arial, sans-serif');
                svgTxt.textContent = '↓ Solution ↓';
                svg.appendChild(svgTxt);

                innerWrap.appendChild(svg);

                // Row 2: correct order (badges ABOVE, z-index above SVG lines)
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

                endGame(`Erreur ! Voici la correction.`, false);
            }
        }

        function handleSelection(item) {
            const index = selectionOrder.indexOf(item);
            if (index > -1) {
                selectionOrder.splice(index, 1);
                item.classList.remove('selected');
            } else {
                if (selectionOrder.length >= activeItemCount) return;
                selectionOrder.push(item);
                item.classList.add('selected');
            }
            renderBadges();
        }
