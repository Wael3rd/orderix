// --- Game Core Loop ---
function startGame() {

    if (!isNameValid) {
        alert("Veuillez valider un pseudo disponible dans les paramètres avant de jouer.");
        returnToMenu();
        return;
    }

    const cfg = dayConfig[currentDayConfig.id];
    activeItemCount = (cfg && cfg.count) ? cfg.count : 10;
    const mode = GAME_MODES[currentDayConfig.modeId];

    leaderboardTitle.textContent = `Top 10 - ${currentDayConfig.title} (${activeItemCount} éléments)`;

    timeElapsed = 0;
    isPaused = false;
    selectionOrder = [];
    flipped = [];
    matched = 0;
    hasSharedThisGame = false;
    clearInterval(window.speedTimer); // Ensure fast-timer is killed on restart
    resultDisplay.textContent = '';
    leaderboardSection.classList.add('hidden');

    startBtn.classList.add('hidden');
    menuBtn.classList.add('hidden');

    if (mode.isSort) checkBtn.classList.remove('hidden');
    else checkBtn.classList.add('hidden');

    timerDisplay.classList.remove('hidden');
    timerDisplay.style.color = '#333';

    board.classList.remove('hidden');
    board.innerHTML = '';
    leaderboardList.innerHTML = '<li style="padding: 10px; text-align: center;">Chargement...</li>'; // Clear previous ghost leaderboard
    dbMessage.textContent = ''; // Clear previous messages
    board.className = 'board';
    board.onpointerdown = null; // Clean up cursor-mode listener from previous game

    // Clear any lingering target UI from previous games
    const oldTargetUI = document.getElementById('dynamic-target-ui');
    if (oldTargetUI) oldTargetUI.remove();

    if (mode.isReflex) {
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
    } else if (mode.isConveyor) {
        startGameConveyor();
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
        board.style.position = 'static';

        let values = [];
        if (mode.specialGen === 'odd') {
            // Génère un large panel de valeurs pour piocher dedans
            let v = generateValues(currentDayConfig.type, Math.max(10, activeItemCount));
            let shuffledV = [...v].sort(() => Math.random() - 0.5);

            // Ajout de l'intrus (Le seul élément unique)
            values.push(shuffledV[0]);

            // Remplissage du reste avec des groupes de 2, 3 ou 4 éléments identiques
            let remaining = activeItemCount - 1;
            let vIndex = 1;

            if (remaining === 1) {
                values.push(shuffledV[1]); // Failsafe au cas où la config demande 2 éléments
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
                    // On boucle sur les valeurs si on a besoin de plus de variété sans jamais retoucher l'index 0 (l'intrus)
                    if (vIndex >= shuffledV.length) vIndex = 1;
                }
            }
        } else if (mode.specialGen === 'pair') {
            let v = generateValues(currentDayConfig.type, activeItemCount - 1);
            // Pick a random element to duplicate instead of always index 0
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

        // Clear any existing target UI before creating a new one
        const existingTargetUI = document.getElementById('dynamic-target-ui');
        if (existingTargetUI) existingTargetUI.remove();

        if (mode.isSum) {
            targetSum = parseFloat((shuf[0] + shuf[1]).toFixed(4));
            levelTitle.textContent += ` (Addition)`;
        }
        if (mode.isDiff) {
            targetDiff = parseFloat(Math.abs(shuf[0] - shuf[1]).toFixed(4));
            levelTitle.textContent += ` (Soustraction)`;
        }
        if (mode.isTargetMatch) {
            exactTarget = shuf[Math.floor(Math.random() * shuf.length)];
            resultDisplay.textContent = `Trouvez ce modèle !`;
            resultDisplay.style.color = "#333";
        }
        if (mode.isSequence) {
            let uniqueVals = [...new Set(shuf)];
            targetSequence = uniqueVals.slice(0, Math.min(mode.sequenceLength || 5, uniqueVals.length));
            currentSequenceIdx = 0;
            resultDisplay.textContent = `Trouvez la séquence !`;
            resultDisplay.style.color = "#333";
        }

        // Inject visual target for math operations and target matching
        if (mode.isSum || mode.isDiff || mode.isTargetMatch || mode.isSequence) {
            const targetUI = document.createElement('div');
            targetUI.id = 'dynamic-target-ui';
            targetUI.style.cssText = 'display:flex; justify-content:center; align-items:center; width:100%; margin-bottom:20px; gap:15px; font-weight:bold; font-size:1.2rem; color:#555;';

            const lbl = document.createElement('span');
            if (mode.isSequence) lbl.textContent = `Étape 1/${targetSequence.length} - Trouvez :`;
            else lbl.textContent = mode.isTargetMatch ? 'Modèle à trouver :' : 'Cible à obtenir :';
            targetUI.appendChild(lbl);

            const visualTarget = document.createElement('div');
            visualTarget.className = `item type-${currentDayConfig.type}`;
            visualTarget.style.margin = '0'; // override default margin
            visualTarget.style.pointerEvents = 'none'; // non-clickable
            visualTarget.style.boxShadow = '0 0 0 4px #007bff';

            let tVal = mode.isSequence ? targetSequence[0] : (mode.isTargetMatch ? exactTarget : (mode.isSum ? targetSum : targetDiff));
            applyStyle(visualTarget, currentDayConfig.type, tVal);

            targetUI.appendChild(visualTarget);
            board.parentNode.insertBefore(targetUI, board);
        }

        let tMax = Math.max(...values);
        let tMin = Math.min(...values);
        let targetVal = mode.findTarget === 'max' ? tMax : (mode.findTarget === 'min' ? tMin : (mode.findTarget === 'median' ? [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)] : null));

        shuf.forEach(val => {
            const item = document.createElement('div');
            item.className = `item type-${currentDayConfig.type}`;
            if (mode.cssClass) item.classList.add(mode.cssClass);
            item.dataset.value = val;

            if (mode.hidden || mode.peekHide) item.classList.add('peek-hidden');
            else applyStyle(item, currentDayConfig.type, val);

            let pressTimer, lastTap = 0;

            // Disable direct item clicking if cursor mode is active
            if (!mode.useCursor) {
                item.addEventListener('click', (e) => {
                    if (isPaused) return;
                    if (mode.requireDbTap) {
                        let now = Date.now();
                        if (now - lastTap < 300) { clearTimeout(pressTimer); handleLogic(item, val, targetVal, mode, values); }
                        else { item.classList.add('error'); setTimeout(() => item.classList.remove('error'), 200); }
                        lastTap = now;
                        return;
                    }
                    if (mode.requireLong) return; // Handled by mousedown/touchstart
                    handleLogic(item, val, targetVal, mode, values);
                });

                if (mode.requireLong) {
                    item.addEventListener('mousedown', () => { pressTimer = setTimeout(() => handleLogic(item, val, targetVal, mode, values), 800); });
                    item.addEventListener('mouseup', () => clearTimeout(pressTimer));
                    item.addEventListener('mouseleave', () => clearTimeout(pressTimer));
                    item.addEventListener('touchstart', () => { pressTimer = setTimeout(() => handleLogic(item, val, targetVal, mode, values), 800); }, { passive: true });
                    item.addEventListener('touchend', () => clearTimeout(pressTimer));
                }

                if (mode.runAway) {
                    item.addEventListener('mousemove', () => {
                        if (Math.abs(val - tMin) < 0.0001) {
                            item.style.transform = `translate(${(Math.random() - 0.5) * 150}px, ${(Math.random() - 0.5) * 150}px)`;
                        }
                    });
                }
            }
            board.appendChild(item);
        });

        if (mode.flashHide) setTimeout(() => document.querySelectorAll('.item').forEach(el => el.classList.add('peek-hidden')), 2000);
        if (mode.shuffleTick) envInterval = setInterval(() => { if (!isPaused) document.querySelectorAll('.item').forEach(el => el.style.order = Math.floor(Math.random() * 100)); }, mode.shuffleTick);
        if (mode.blackout) envInterval = setInterval(() => { if (!isPaused) board.classList.toggle('blackout-mode'); }, 1500);

        // Ping-pong cursor logic
        if (mode.useCursor) {
            let cursorIdx = 0;
            let cursorDir = 1;
            const domItems = Array.from(board.querySelectorAll('.item'));
            if (domItems.length > 0) domItems[0].classList.add('cursor-active');

            envInterval = setInterval(() => {
                if (isPaused || domItems.length === 0) return;
                domItems[cursorIdx].classList.remove('cursor-active');
                cursorIdx += cursorDir;

                // Bounce back and forth
                if (cursorIdx >= domItems.length) {
                    cursorIdx = Math.max(0, domItems.length - 2);
                    cursorDir = -1;
                } else if (cursorIdx < 0) {
                    cursorIdx = Math.min(1, domItems.length - 1);
                    cursorDir = 1;
                }
                domItems[cursorIdx].classList.add('cursor-active');
            }, 200); // Speed of the cursor (in milliseconds)

            // Click anywhere on the board to catch the current item
            board.onpointerdown = (e) => {
                if (isPaused) return;
                e.preventDefault();
                const activeItem = domItems[cursorIdx];
                if (activeItem) handleLogic(activeItem, parseFloat(activeItem.dataset.value), targetVal, mode, values);
            };
        } else {
            board.onpointerdown = null; // Clean up listener for non-cursor modes
        }
    }

    clearInterval(timerInterval);
    lastTime = Date.now();
    timerInterval = setInterval(gameTick, 10);

    gameInProgress = true;
    history.pushState({ orderixGame: true }, '');

    // Store pending game with location, mode and type for Rage Quit recovery
    const userLoc = Intl.DateTimeFormat().resolvedOptions().timeZone;
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

function endGame(message, isWin, isRageQuit = false) {
    clearInterval(timerInterval);
    clearTimeout(gameTimeout);
    clearInterval(envInterval);
    clearInterval(window.speedTimer);
    board.classList.remove('blackout-mode');

    // Scroll vers le haut pour afficher le résultat
    window.scrollTo({ top: 0, behavior: 'smooth' });

    isPaused = true;
    gameInProgress = false;
    checkBtn.classList.add('hidden');
    startBtn.classList.add('hidden');
    // menuBtn remains hidden to force feedback interaction

    // Clear pending game marker
    setStorage('orderix_pending_game', '');

    pendingTimeVal = (timeElapsed / 1000).toFixed(3);
    if (!isWin) pendingTimeVal = -pendingTimeVal;
    if (isRageQuit) pendingTimeVal = -999999;

    // Optimistic update of server played days (for instant UI)
    serverPlayedDays[currentDayConfig.id] = {
        count: activeItemCount,
        time: parseFloat(pendingTimeVal),
        isWin: isWin
    };

    // Refresh sidebar ticks
    refreshSidebar();

    let timeStr;
    if (isWin) timeStr = (timeElapsed / 1000).toFixed(3) + 's';
    else if (isRageQuit) timeStr = 'RAGE QUIT';
    else timeStr = (timeElapsed / 1000).toFixed(3) + 's';

    resultDisplay.innerHTML = `${message}<br>Temps : <span style="color:${isWin ? '#28a745' : '#dc3545'}">${timeStr}</span>`;
    resultDisplay.style.color = '#333';

    // Show feedback UI instead of leaderboard
    leaderboardSection.classList.add('hidden');
    feedbackContainer.classList.remove('hidden');

    // Fire initial score submission immediately (without feedback)
    submitScore(pendingTimeVal, '', false);
}

function returnToMenu() {
    gameInProgress = false;
    isPaused = true;
    sidebar.classList.remove('hidden');
    menuBtn.classList.add('hidden');
    shareBtn.classList.add('hidden');
    startBtn.classList.add('hidden');
    checkBtn.classList.add('hidden');

    // Nettoyer l'URL pour ne pas garder le lien vers le niveau
    const cleanUrl = window.location.href.split('?')[0];
    history.replaceState(null, '', cleanUrl);
    pendingTimeVal = 0; // Réinitialise le temps en attente
    board.classList.add('hidden');
    board.classList.remove('blackout-mode');
    feedbackContainer.classList.add('hidden');
    leaderboardSection.classList.add('hidden');
    board.classList.remove('blackout-mode');
    leaderboardSection.classList.add('hidden');
    timerDisplay.classList.add('hidden');

    const dynTarget1 = document.getElementById('dynamic-target-ui');
    if (dynTarget1) dynTarget1.remove();

    clearInterval(timerInterval);
    clearTimeout(gameTimeout);
    clearInterval(envInterval);
    timeElapsed = 0;
    timerDisplay.textContent = '0.000';
    timerDisplay.style.color = '#333';
    resultDisplay.textContent = '';
    dbMessage.textContent = '';
    levelTitle.textContent = 'Sélectionnez un jour pour commencer';
    document.querySelectorAll('.day-btn').forEach(b => b.classList.remove('active'));
    currentDayConfig = null;
}
