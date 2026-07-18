// ─── Boucle de jeu : démarrage, chrono, fin de partie ────────────

// Correction d'audit : chaque mode posait des styles inline sur le plateau
// (hauteur fixe, position, overflow…) jamais nettoyés, qui polluaient le
// mode suivant. Remise à zéro centrale ici.
function resetBoard() {
    board.removeAttribute('style');
    board.className = '';
    board.id = 'game-board';
    board.innerHTML = '';
    board.onpointerdown = null;
    const oldTargetUI = document.getElementById('dynamic-target-ui');
    if (oldTargetUI) oldTargetUI.remove();
}

function startGame() {
    const cfg = dayConfig[currentDayConfig.id];
    activeItemCount = (cfg && cfg.count) ? cfg.count : 10;
    const mode = GAME_MODES[currentDayConfig.modeId];

    timeElapsed = 0;
    isPaused = false;
    selectionOrder = [];
    flipped = [];
    matched = 0;
    hasSharedThisGame = false;
    clearInterval(window.speedTimer);

    resultPanel.classList.add('hidden');
    resultDisplay.textContent = '';
    leaderboardSection.classList.add('hidden');
    dbMessage.textContent = '';
    document.getElementById('comment-zone').classList.add('hidden');

    if (mode.isSort) {
        checkBtn.textContent = 'Valider mon ordre';
        checkBtn.classList.remove('hidden');
    } else {
        checkBtn.classList.add('hidden');
    }

    timerDisplay.classList.remove('late');
    resetBoard();
    board.style.opacity = '';
    board.style.transform = '';
    board.style.transition = '';
    board.classList.remove('hidden');
    board.style.animation = 'screenIn .3s cubic-bezier(.22,.8,.3,1) both';
    board.addEventListener('animationend', function h() { board.removeEventListener('animationend', h); board.style.animation = ''; }, { once: true });

    // Animer la sortie de l'intro (si elle est visible)
    if (!introPanel.classList.contains('hidden')) {
        introPanel.style.animation = 'screenOut .22s ease-in forwards';
        introPanel.addEventListener('animationend', function h() {
            introPanel.removeEventListener('animationend', h);
            introPanel.classList.add('hidden');
            introPanel.style.animation = '';
        }, { once: true });
    }

    // Modes à manches : 3 manches progressives + 1 joker (une erreur pardonnée)
    baseItemCount = activeItemCount;
    currentRound = 1;
    totalRounds = mode.rounds || 1;
    shieldAvailable = !!mode.rounds;

    if (mode.isOrderChain) {
        startGameOrderChain();
    } else if (mode.isInsertion) {
        startGameInsertion();
    } else if (mode.isCascade) {
        startGameCascade();
    } else if (mode.isFontaine) {
        startGameFontaine();
    } else if (mode.isMetronome) {
        startGameMetronome();
    } else if (mode.isCode) {
        startGameCode();
    } else if (mode.isMemoCroissant) {
        startGameMemoCroissant();
    } else if (mode.isSolitaire) {
        startGameSolitaire();
    } else if (mode.isBlocs) {
        startGameBlocs();
    } else if (mode.isDominosa) {
        startGameDominosa();
    } else if (mode.isPaires) {
        startGamePaires();
    } else if (mode.isTubes) {
        startGameTubes();
    } else if (mode.isSwapSort) {
        startGameSwapSort();
    } else if (mode.isBoulons) {
        startGameBoulons();
    } else if (mode.isHanoi) {
        startGameHanoi();
    } else if (mode.isFileBloquee) {
        startGameFileBloquee();
    } else if (mode.isMahjong) {
        startGameMahjong();
    } else if (mode.isGrille) {
        startGameGrille();
    } else if (mode.isRangement) {
        startGameRangement();
    } else if (mode.isFutoshiki) {
        startGameFutoshiki();
    } else if (mode.isBalance) {
        startGameBalance();
    } else if (mode.isOrdreCache) {
        startGameOrdreCache();
    } else if (mode.isIndices) {
        startGameIndices();
    } else if (mode.isChronologie) {
        startGameChronologie();
    } else if (mode.isDeux048) {
        startGameDeux048();
    } else if (mode.isEmbouteillage) {
        startGameEmbouteillage();
    } else if (mode.isTripleOrdre) {
        startGameTripleOrdre();
    } else if (mode.isPhotoClasse) {
        startGamePhotoClasse();
    } else if (mode.isTaquin) {
        startGameTaquin();
    } else if (mode.isNonogramme) {
        startGameNonogramme();
    } else if (mode.isFusion) {
        startGameFusion();
    } else if (mode.isReflex) {
        startGameReflex();
    } else if (mode.isTyping) {
        startGameTyping();
    } else if (mode.isConnectDots) {
        startGameConnectDots();
    } else if (mode.isMathQuiz) {
        startGameMathQuiz(mode);
    } else if (mode.isSpeedLetters) {
        startGameSpeedLetters();
    } else if (mode.isDragDrop) {
        startGameDragDrop();
    } else if (mode.isSuites) {
        startGameSuites();
    } else if (mode.isSpeedQuiz) {
        startGameSpeedQuiz();
    } else if (mode.isGuessNumber) {
        startGameGuessNumber();
    } else if (mode.isDobble) {
        startGameDobble();
    } else {
        board.style.flexDirection = 'row';
        board.style.alignItems = 'flex-start';
        board.style.display = 'flex';

        // Le corps est relançable : pour les modes `rounds`, chaque manche
        // régénère un plateau plus fourni que la précédente.
        window.startGenericRound = function () {
        board.innerHTML = '';
        const oldTarget = document.getElementById('dynamic-target-ui');
        if (oldTarget) oldTarget.remove();
        clearInterval(envInterval);
        selectionOrder = [];
        flipped = [];
        matched = 0;

        if (mode.rounds) {
            const ladder = [
                Math.max(4, Math.round(baseItemCount * 0.6)),
                baseItemCount,
                Math.round(baseItemCount * 1.4)
            ];
            activeItemCount = ladder[Math.min(currentRound, ladder.length) - 1];

            const hud = document.createElement('div');
            hud.id = 'round-hud';
            hud.style.cssText = 'width:100%;text-align:center;font-weight:bold;color:#8B90A0;font-size:.95rem;margin-bottom:6px;';
            hud.innerHTML = `Manche ${currentRound}/${totalRounds} · Joker <span style="color:${shieldAvailable ? '#F5B227' : '#B9BDC9'};font-size:1.1em">${shieldAvailable ? '●' : '○'}</span>`;
            board.appendChild(hud);
        }

        let values = [];
        if (mode.specialGen === 'odd') {
            // Large panel de valeurs pour piocher
            let v = generateValues(currentDayConfig.type, Math.max(10, activeItemCount));
            let shuffledV = [...v].sort(() => Math.random() - 0.5);

            // L'intrus : le seul élément unique
            values.push(shuffledV[0]);

            // Le reste : groupes de 2 à 4 éléments identiques
            let remaining = activeItemCount - 1;
            let vIndex = 1;

            if (remaining === 1) {
                values.push(shuffledV[1]);
            } else {
                while (remaining > 0) {
                    let copies;
                    if (remaining > 5) copies = Math.floor(Math.random() * 3) + 2;
                    else if (remaining === 5) copies = Math.floor(Math.random() * 2) + 2;
                    else if (remaining === 4) copies = 2;
                    else copies = remaining;

                    for (let i = 0; i < copies; i++) {
                        values.push(shuffledV[vIndex]);
                    }
                    remaining -= copies;
                    vIndex++;
                    if (vIndex >= shuffledV.length) vIndex = 1;
                }
            }
        } else if (mode.specialGen === 'pair') {
            let v = generateValues(currentDayConfig.type, activeItemCount - 1);
            let randomDup = v[Math.floor(Math.random() * v.length)];
            values = [...v]; values.push(randomDup);
        } else if (mode.specialGen === 'pairs') {
            let pc = Math.floor(activeItemCount / 2);
            activeItemCount = pc * 2;
            let v = generateValues(currentDayConfig.type, pc);
            values = [...v, ...v];
        } else {
            values = generateValues(currentDayConfig.type, activeItemCount * (mode.filter ? 3 : 1));
            if (mode.filter === 'even') values = values.filter(x => Math.floor(x) % 2 === 0).slice(0, activeItemCount);
            if (mode.filter === 'odd') values = values.filter(x => Math.floor(x) % 2 !== 0).slice(0, activeItemCount);
            activeItemCount = values.length;
        }

        let shuf = [...values].sort(() => Math.random() - 0.5);

        if (mode.isSum) {
            targetSum = parseFloat((shuf[0] + shuf[1]).toFixed(4));
        }
        if (mode.isDiff) {
            targetDiff = parseFloat(Math.abs(shuf[0] - shuf[1]).toFixed(4));
        }
        if (mode.isTargetMatch) {
            exactTarget = shuf[Math.floor(Math.random() * shuf.length)];
        }
        if (mode.isSequence) {
            let uniqueVals = [...new Set(shuf)];
            targetSequence = uniqueVals.slice(0, Math.min(mode.sequenceLength || 5, uniqueVals.length));
            currentSequenceIdx = 0;
        }

        // Cible visuelle au-dessus du plateau (additions, recherche, séquence)
        if (mode.isSum || mode.isDiff || mode.isTargetMatch || mode.isSequence) {
            const targetUI = document.createElement('div');
            targetUI.id = 'dynamic-target-ui';
            targetUI.style.cssText = 'display:flex; justify-content:center; align-items:center; width:100%; margin:14px 0 6px; gap:15px; font-weight:bold; font-size:1.05rem; color:#8B90A0;';

            const lbl = document.createElement('span');
            if (mode.isSequence) lbl.textContent = `Étape 1/${targetSequence.length} — Trouvez :`;
            else lbl.textContent = mode.isTargetMatch ? 'Modèle à trouver :' : 'Cible à obtenir :';
            targetUI.appendChild(lbl);

            const visualTarget = document.createElement('div');
            visualTarget.className = `item type-${currentDayConfig.type}`;
            visualTarget.style.margin = '0';
            visualTarget.style.pointerEvents = 'none';
            visualTarget.style.boxShadow = '0 0 0 3px #FFFFFF, 0 0 0 6px #4A6CFA';

            let tVal = mode.isSequence ? targetSequence[0] : (mode.isTargetMatch ? exactTarget : (mode.isSum ? targetSum : targetDiff));
            applyStyle(visualTarget, currentDayConfig.type, tVal);

            targetUI.appendChild(visualTarget);
            board.parentNode.insertBefore(targetUI, board);
        }

        let tMax = Math.max(...values);
        let tMin = Math.min(...values);
        let targetVal = mode.findTarget === 'max' ? tMax : (mode.findTarget === 'min' ? tMin : (mode.findTarget === 'median' ? [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)] : null));

        const itemFrag = document.createDocumentFragment();
        shuf.forEach(val => {
            const item = document.createElement('div');
            item.className = `item type-${currentDayConfig.type}`;
            if (mode.cssClass) item.classList.add(mode.cssClass);
            item.dataset.value = val;

            if (mode.hidden || mode.peekHide) item.classList.add('peek-hidden');
            else applyStyle(item, currentDayConfig.type, val);

            let pressTimer, lastTap = 0;

            if (!mode.useCursor) {
                item.addEventListener('click', () => {
                    if (isPaused) return;
                    if (mode.requireDbTap) {
                        let now = Date.now();
                        if (now - lastTap < 300) { clearTimeout(pressTimer); handleLogic(item, val, targetVal, mode, values); }
                        else { item.classList.add('error'); setTimeout(() => item.classList.remove('error'), 200); }
                        lastTap = now;
                        return;
                    }
                    if (mode.requireLong) return;
                    handleLogic(item, val, targetVal, mode, values);
                });

                if (mode.requireLong) {
                    item.addEventListener('pointerdown', () => { pressTimer = setTimeout(() => handleLogic(item, val, targetVal, mode, values), 600); });
                    item.addEventListener('pointerup', () => clearTimeout(pressTimer));
                    item.addEventListener('pointerleave', () => clearTimeout(pressTimer));
                    item.addEventListener('pointercancel', () => clearTimeout(pressTimer));
                }
            }
            itemFrag.appendChild(item);
        });
        board.appendChild(itemFrag);

        if (mode.flashHide) setTimeout(() => document.querySelectorAll('#game-board .item').forEach(el => el.classList.add('peek-hidden')), 2000);
        if (mode.shuffleTick) {
            // Jauge de tension : temps restant avant le prochain mélange
            const shuffleHud = document.createElement('div');
            shuffleHud.style.cssText = 'width:100%;display:flex;flex-direction:column;align-items:center;gap:3px;margin-bottom:8px;order:-1;';
            const shuffleLbl = document.createElement('div');
            shuffleLbl.style.cssText = 'font-size:.7rem;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#8B90A0;';
            shuffleLbl.textContent = 'Prochain mélange';
            const shuffleBarWrap = document.createElement('div');
            shuffleBarWrap.className = 'timebar-wrap';
            shuffleBarWrap.style.margin = '0';
            const shuffleBar = document.createElement('div');
            shuffleBar.className = 'timebar';
            shuffleBarWrap.appendChild(shuffleBar);
            shuffleHud.append(shuffleLbl, shuffleBarWrap);
            board.insertBefore(shuffleHud, board.firstChild);

            let shuffleElapsed = 0;
            const shuffleStep = 50;
            envInterval = setInterval(() => {
                if (isPaused) return;
                shuffleElapsed += shuffleStep;
                shuffleBar.style.width = (Math.max(0, mode.shuffleTick - shuffleElapsed) / mode.shuffleTick * 100) + '%';
                if (shuffleElapsed >= mode.shuffleTick) {
                    shuffleElapsed = 0;
                    haptic(15);
                    // style.order laisse la jauge en tête (order:-1), les items se mélangent
                    document.querySelectorAll('#game-board .item').forEach(el => el.style.order = Math.floor(Math.random() * 100));
                }
            }, shuffleStep);
        }
        if (mode.blackout) envInterval = setInterval(() => { if (!isPaused) board.classList.toggle('blackout-mode'); }, 1500);

        // Curseur ping-pong : on touche l'écran quand le halo entoure le modèle
        if (mode.useCursor) {
            let cursorIdx = 0;
            let cursorDir = 1;
            const domItems = Array.from(board.querySelectorAll('.item'));
            if (domItems.length > 0) domItems[0].classList.add('cursor-active');

            envInterval = setInterval(() => {
                if (isPaused || domItems.length === 0) return;
                domItems[cursorIdx].classList.remove('cursor-active');
                cursorIdx += cursorDir;

                if (cursorIdx >= domItems.length) {
                    cursorIdx = Math.max(0, domItems.length - 2);
                    cursorDir = -1;
                } else if (cursorIdx < 0) {
                    cursorIdx = Math.min(1, domItems.length - 1);
                    cursorDir = 1;
                }
                domItems[cursorIdx].classList.add('cursor-active');
            }, 200);

            board.onpointerdown = (e) => {
                if (isPaused) return;
                e.preventDefault();
                const activeItem = domItems[cursorIdx];
                if (activeItem) handleLogic(activeItem, parseFloat(activeItem.dataset.value), targetVal, mode, values);
            };
        }
        }; // fin de startGenericRound
        window.startGenericRound();
    }

    clearInterval(timerInterval);
    lastTime = Date.now();
    timerInterval = setInterval(gameTick, 10);

    gameInProgress = true;
    history.pushState({ orderixGame: true }, '');

    // Marqueur de partie en cours (récupération en cas de fermeture brutale)
    let userLoc = 'Unknown';
    try { userLoc = Intl.DateTimeFormat().resolvedOptions().timeZone; } catch (e) { }
    setStorage('orderix_pending_game', JSON.stringify({
        dayId: currentDayConfig.id,
        itemCount: activeItemCount,
        location: userLoc,
        modeId: currentDayConfig.modeId,
        type: currentDayConfig.type
    }));
}

function gameTick() {
    if (isPaused) {
        lastTime = Date.now();
        return;
    }
    const now = Date.now();
    timeElapsed += (now - lastTime);
    lastTime = now;
    timerDisplay.textContent = (timeElapsed / 1000).toFixed(3);
}

function endGame(message, isWin, isAbandon = false) {
    // Les modes à manches font varier activeItemCount : le résultat est
    // toujours enregistré sur le compte de base (classements cohérents)
    if (baseItemCount) activeItemCount = baseItemCount;
    clearInterval(timerInterval);
    clearTimeout(gameTimeout);
    clearInterval(envInterval);
    clearInterval(window.speedTimer);
    board.classList.remove('blackout-mode');

    // Tamisage du plateau pendant que le panneau de résultat monte
    board.style.transition = 'opacity .3s ease, transform .3s ease';
    board.style.opacity = '0.3';
    board.style.transform = 'scale(.97)';

    window.scrollTo({ top: 0, behavior: 'smooth' });

    isPaused = true;
    gameInProgress = false;
    checkBtn.classList.add('hidden');

    setStorage('orderix_pending_game', '');

    pendingTimeVal = (timeElapsed / 1000).toFixed(3);
    if (!isWin) pendingTimeVal = -pendingTimeVal;
    if (isAbandon) pendingTimeVal = -999999;

    // Progression locale (sans pseudo) + cache serveur optimiste
    saveLocalResult(currentDayConfig.id, activeItemCount, parseFloat(pendingTimeVal), isWin);
    serverPlayedDays[currentDayConfig.id] = {
        count: activeItemCount,
        time: parseFloat(pendingTimeVal),
        isWin: isWin
    };

    // Panneau de résultat
    resultPanel.classList.remove('hidden');
    resultStatus.textContent = isWin ? 'Réussi' : (isAbandon ? 'Abandonné' : 'Raté');
    resultStatus.className = 'result-status ' + (isWin ? 'win' : 'fail');
    resultTime.innerHTML = isAbandon ? '<small>Partie abandonnée</small>'
        : `${(timeElapsed / 1000).toFixed(3)}<small> s</small>`;
    resultPhrase.textContent = isWin ? pickPhrase(WIN_PHRASES) : pickPhrase(FAIL_PHRASES);
    resultDisplay.style.color = '';
    resultDisplay.textContent = message || '';

    // L'avis sur le puzzle d'abord, puis classement et partage
    feedbackQ.classList.remove('hidden');
    feedbackContainer.classList.remove('hidden');
    resultActions.classList.add('hidden');
    leaderboardSection.classList.add('hidden');

    if (isWin) {
        celebrate();
        haptic([18, 40, 24]);
    } else {
        haptic(60);
    }

    // Première soumission immédiate (sans avis)
    submitScore(pendingTimeVal, '', false);
}

function abandonGame() {
    if (!gameInProgress) return;
    endGame('Partie abandonnée.', false, true);
}

// Quitte l'écran de jeu vers un écran cible (nettoyage complet)
function leaveGame(target) {
    gameInProgress = false;
    isPaused = true;
    clearInterval(timerInterval);
    clearTimeout(gameTimeout);
    clearInterval(envInterval);
    clearInterval(window.speedTimer);
    timeElapsed = 0;
    pendingTimeVal = 0;
    resetBoard();
    board.style.opacity = '';
    board.style.transform = '';
    board.style.transition = '';
    board.classList.add('hidden');
    timerDisplay.textContent = '0.000';
    resultDisplay.textContent = '';
    dbMessage.textContent = '';
    currentDayConfig = null;
    showScreen(target || 'home');
}

function goHome() { leaveGame('home'); }

// Retour : revient à l'écran d'où le jour a été ouvert (accueil OU calendrier…)
function goBack() { leaveGame(returnScreen); }
