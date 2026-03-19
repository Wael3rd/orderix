// Google Apps Script Web App URL - REPLACE THIS BEFORE PUBLISHING
        const GAS_URL = "https://script.google.com/macros/s/AKfycbwdBn3nmfJzB-uNlGGQ2_u5-6hqRy4urDKOWRTQWmclVwnmjE5NCE8TYPu6Saelwu_y6g/exec";

        // Game state variables
        let timerInterval, lastTime, gameTimeout, envInterval;
        let timeElapsed = 0;
        let selectionOrder = [];
        let isPaused = false;
        let currentDayConfig = null;
        let activeItemCount = 10;
        let isNameValid = false;
        let exactTarget = 0, targetSum = 0, targetDiff = 0, flipped = [], matched = 0, targetSequence = [], currentSequenceIdx = 0, currentRound = 1, totalRounds = 3, currentMathTarget = 0;
        let sessionReferredBy = new URLSearchParams(window.location.search).get('ref') || '';
        let hasSharedThisGame = false;

        // 35 GAME MODES and 50 Base Types have been moved to scripts/data.js


        // Compilation of 365 Days using procedural cross-multiplication
        let ALL_DAYS = [];
        // The first 50 remain original
        BASE_TYPES.forEach(d => {
            ALL_DAYS.push({ id: d.id, title: `Jour ${d.id} : Tri Croissant - ${d.title}`, type: d.type, modeId: 'sortAsc' });
        });

        // Fill up to 365
        const MKEYS = Object.keys(GAME_MODES);
        let cId = ALL_DAYS.length + 1, mIdx = 0;
        while (ALL_DAYS.length < 365) {
            const base = BASE_TYPES[(cId * 13) % BASE_TYPES.length];
            const mKey = MKEYS[mIdx % MKEYS.length];
            ALL_DAYS.push({ id: cId, title: `Jour ${cId} : ${GAME_MODES[mKey].name} - ${base.title}`, type: base.type, modeId: mKey });
            cId++; mIdx++;
        }
        const DAYS = ALL_DAYS;

        // DOM Cache
        const sidebar = document.getElementById('sidebar');
        const board = document.getElementById('game-board');
        const timerDisplay = document.getElementById('timer-display');
        const startBtn = document.getElementById('start-btn');
        const checkBtn = document.getElementById('check-btn');
        const menuBtn = document.getElementById('menu-btn');
        const shareBtn = document.getElementById('share-btn');
        const resultDisplay = document.getElementById('result');
        const feedbackContainer = document.getElementById('feedback-container');
        const btnLike = document.getElementById('btn-like');
        const btnDislike = document.getElementById('btn-dislike');
        const btnSkip = document.getElementById('btn-skip');
        let pendingTimeVal = 0;
        const levelTitle = document.getElementById('level-title');
        const dayButtonsContainer = document.getElementById('day-buttons-container');

        let dayConfig = {};
        let gameInProgress = false;
        let serverPlayedDays = {};

        const playerNameMainInput = document.getElementById('player-name-main');
        const verifyNameBtn = document.getElementById('verify-name-btn');
        const nameStatus = document.getElementById('name-status');
        const nameInputContainer = document.getElementById('name-input-container');
        const lockedNameDisplay = document.getElementById('locked-name-display');

        const leaderboardSection = document.getElementById('leaderboard-section');
        const dbMessage = document.getElementById('db-message');
        const leaderboardList = document.getElementById('leaderboard-list');
        const leaderboardTitle = document.getElementById('leaderboard-title');

        // Storage Helpers (LocalStorage + Secure Cookies)
        function setStorage(key, value) {
            try { localStorage.setItem(key, value); } catch (e) { }
            document.cookie = `${key}=${encodeURIComponent(value)}; max-age=31536000; path=/; SameSite=None; Secure`;
        }
        function getStorage(key) {
            try { if (localStorage.getItem(key)) return localStorage.getItem(key); } catch (e) { }
            const match = document.cookie.match(new RegExp('(^| )' + key + '=([^;]+)'));
            if (match) return decodeURIComponent(match[2]);
            return null;
        }

        // Load saved name and lock UI immediately
        const savedName = getStorage('orderix_player_name');
        if (savedName) {
            isNameValid = true;
            if (nameInputContainer) nameInputContainer.classList.add('hidden');
            if (nameStatus) nameStatus.classList.add('hidden');
            if (lockedNameDisplay) {
                lockedNameDisplay.textContent = savedName;
                lockedNameDisplay.classList.remove('hidden');
            }
        }

        // Fetch played days from server for a given player name
        function fetchPlayedDays(name) {
            if (!name) return;
            fetch(`${GAS_URL}?getPlayed=${encodeURIComponent(name)}&nocache=${Date.now()}`)
                .then(r => r.json())
                .then(data => {
                    serverPlayedDays = data || {};
                    refreshSidebar();
                })
                .catch(() => { });
        }

        if (savedName) fetchPlayedDays(savedName);

        // Build sidebar buttons
        function buildSidebar() {
            dayButtonsContainer.innerHTML = '';
            const enabledDays = DAYS.filter(day => {
                const cfg = dayConfig[day.id];
                if (cfg && cfg.enabled === false) return false;
                return true;
            });
            const daysToShow = Object.keys(dayConfig).length > 0 ? enabledDays : DAYS;

            daysToShow.forEach(day => {
                const btn = document.createElement('button');
                btn.className = 'day-btn';
                btn.dataset.dayId = day.id;
                const label = document.createElement('span');
                label.textContent = `Jour ${day.id}`;
                btn.appendChild(label);
                if (serverPlayedDays[day.id]) {
                    const tick = document.createElement('span');
                    tick.className = serverPlayedDays[day.id].isWin ? 'tick' : 'tick fail';
                    tick.textContent = serverPlayedDays[day.id].isWin ? '✓' : '✗';
                    btn.appendChild(tick);
                }
                btn.addEventListener('click', () => selectDay(day, btn));
                dayButtonsContainer.appendChild(btn);
            });
        }

        // Refresh sidebar ticks only
        function refreshSidebar() {
            document.querySelectorAll('.day-btn').forEach(btn => {
                const id = parseInt(btn.dataset.dayId);
                let existingTick = btn.querySelector('.tick');
                if (serverPlayedDays[id]) {
                    const isWin = serverPlayedDays[id].isWin;
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

        dayButtonsContainer.innerHTML = '<div class="loader"><div class="spinner"></div>Chargement…</div>';

        fetch(`${GAS_URL}?getConfig=1&nocache=${Date.now()}`)
            .then(r => r.json())
            .then(cfg => {
                dayConfig = cfg;

                // Apply manual Google Sheets overrides (Col D: modeId, Col E: type)
                DAYS.forEach(day => {
                    const c = dayConfig[day.id];
                    if (c) {
                        if (c.modeId && GAME_MODES[c.modeId]) day.modeId = c.modeId;
                        if (c.type) {
                            const bType = BASE_TYPES.find(b => b.type === c.type);
                            if (bType) day.type = c.type;
                        }
                        // Update title to match manual config
                        const mName = GAME_MODES[day.modeId].name;
                        const bName = BASE_TYPES.find(b => b.type === day.type).title;
                        day.title = `Jour ${day.id} : ${mName} - ${bName}`;
                    }
                });

                buildSidebar();
                autoSelectDayFromUrl();
            })
            .catch(() => { buildSidebar(); autoSelectDayFromUrl(); });


        function autoSelectDayFromUrl() {
            const urlDay = parseInt(new URLSearchParams(window.location.search).get('day'));
            if (!urlDay) return;
            const day = DAYS.find(d => d.id === urlDay);
            if (!day) return;
            const btn = document.querySelector(`.day-btn[data-day-id="${urlDay}"]`);
            if (btn) selectDay(day, btn);
        }

        startBtn.addEventListener('click', startGame);
        checkBtn.addEventListener('click', verifyOrder);
        menuBtn.addEventListener('click', returnToMenu);

        shareBtn.addEventListener('click', () => {
            let isWin = false, timeVal = 0;
            // Détecte si on partage la partie qui vient de se finir, ou une ancienne partie depuis l'historique
            if (pendingTimeVal !== 0) {
                isWin = pendingTimeVal > 0;
                timeVal = Math.abs(pendingTimeVal);
            } else if (serverPlayedDays[currentDayConfig.id]) {
                isWin = serverPlayedDays[currentDayConfig.id].isWin;
                timeVal = Math.abs(serverPlayedDays[currentDayConfig.id].time);
            } else return;

            const status = isWin ? "réussi" : "raté";
            const timeStr = timeVal == 999999 ? "RAGE QUIT" : timeVal;

            // Ajout du pseudo dans l'URL partagée pour le tracking
            let currentPlayerName = getStorage('orderix_player_name') || playerNameMainInput.value.trim() || '';
            const url = window.location.href.split('?')[0] + '?ref=' + encodeURIComponent(currentPlayerName) + '&day=' + currentDayConfig.id;

            const textToShare = `J'ai ${status} le jeu ${currentDayConfig.title} avec un temps de ${timeStr}s clique ici ${url} pour essayer de me battre !`;

            navigator.clipboard.writeText(textToShare).then(() => {
                shareBtn.textContent = "COPIÉ !";
                setTimeout(() => shareBtn.textContent = "PARTAGE", 2000);

                // Mettre à jour la base de données de manière silencieuse (seulement si on vient de jouer cette partie)
                if (!hasSharedThisGame && pendingTimeVal !== 0) {
                    hasSharedThisGame = true;
                    submitScore(timeVal, '', true); // Lance un update avec isUpdate = true
                }
            });
        });

        verifyNameBtn.addEventListener('click', verifyPlayerName);

        function verifyPlayerName() {
            const name = playerNameMainInput.value.trim();
            if (name.length < 3) {
                nameStatus.textContent = "3 caractères minimum.";
                nameStatus.style.color = "#dc3545";
                isNameValid = false;
                return;
            }

            if (name === getStorage('orderix_player_name')) {
                isNameValid = true;
                nameInputContainer.classList.add('hidden');
                nameStatus.classList.add('hidden');
                lockedNameDisplay.textContent = name;
                lockedNameDisplay.classList.remove('hidden');
                fetchPlayedDays(name);
                return;
            }

            nameStatus.textContent = "Vérification...";
            nameStatus.style.color = "#333";
            verifyNameBtn.disabled = true;

            fetch(`${GAS_URL}?checkName=${encodeURIComponent(name)}`)
                .then(r => r.json())
                .then(data => {
                    verifyNameBtn.disabled = false;
                    if (data.available) {
                        isNameValid = true;
                        setStorage('orderix_player_name', name);
                        nameInputContainer.classList.add('hidden');
                        nameStatus.classList.add('hidden');
                        lockedNameDisplay.textContent = name;
                        lockedNameDisplay.classList.remove('hidden');
                        fetchPlayedDays(name);
                    } else {
                        isNameValid = false;
                        nameStatus.textContent = data.reason;
                        nameStatus.style.color = "#dc3545";
                    }
                })
                .catch(err => {
                    verifyNameBtn.disabled = false;
                    nameStatus.textContent = "Erreur réseau.";
                    nameStatus.style.color = "#dc3545";
                });
        }

        function returnToMenu() {
            gameInProgress = false;
            isPaused = true;
            sidebar.classList.remove('hidden');
            menuBtn.classList.add('hidden');
            shareBtn.classList.add('hidden');
            startBtn.classList.add('hidden');
            checkBtn.classList.add('hidden');
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

        function selectDay(day, btnElement) {
            sidebar.classList.add('hidden');
            menuBtn.classList.remove('hidden');
            shareBtn.classList.add('hidden');
            leaderboardSection.classList.add('hidden');
            timerDisplay.classList.add('hidden');

            const dynTarget2 = document.getElementById('dynamic-target-ui');
            if (dynTarget2) dynTarget2.remove();

            document.querySelectorAll('.day-btn').forEach(b => b.classList.remove('active'));
            btnElement.classList.add('active');

            clearInterval(timerInterval);
            clearTimeout(gameTimeout);
            clearInterval(envInterval);
            timeElapsed = 0;
            timerDisplay.textContent = '0.000';
            timerDisplay.style.color = '#333';
            board.classList.add('hidden');
            board.classList.remove('blackout-mode');
            checkBtn.classList.add('hidden');
            resultDisplay.textContent = '';
            dbMessage.textContent = '';

            currentDayConfig = day;
            levelTitle.textContent = day.title;

            const cfg = dayConfig[day.id];
            activeItemCount = (cfg && cfg.count) ? cfg.count : 10;
            const playedInfo = serverPlayedDays[day.id] || null;

            if (playedInfo) {
                startBtn.classList.add('hidden');
                shareBtn.classList.remove('hidden'); // Permet de partager un ancien score directement
                activeItemCount = playedInfo.count;
                leaderboardTitle.textContent = `Top 10 - ${day.title} (${activeItemCount} éléments)`;

                let timeDisplay;
                if (playedInfo.isWin) {
                    timeDisplay = parseFloat(playedInfo.time).toFixed(3) + 's';
                } else if (playedInfo.time === -999999) {
                    timeDisplay = 'RAGE QUIT';
                } else {
                    timeDisplay = `FAIL (${Math.abs(playedInfo.time).toFixed(3)}s)`;
                }

                resultDisplay.innerHTML = `Niveau déjà complété.<br>Votre résultat : <span style="color:${playedInfo.isWin ? '#28a745' : '#dc3545'}">${timeDisplay}</span>`;
                resultDisplay.style.color = '#333';

                board.innerHTML = '';
                board.classList.remove('hidden');

                const mode = GAME_MODES[currentDayConfig.modeId];
                if (mode && mode.isSort) {
                    board.style.flexDirection = 'column';
                    board.style.alignItems = 'center';

                    const solTitle = document.createElement('h3');
                    solTitle.textContent = 'Solution :';
                    solTitle.style.margin = '0 0 10px 0';
                    board.appendChild(solTitle);

                    const solRow = document.createElement('div');
                    solRow.style.display = 'flex';
                    solRow.style.gap = '20px';
                    solRow.style.flexWrap = 'wrap';
                    solRow.style.justifyContent = 'center';

                    let vals = generateValues(day.type, activeItemCount);
                    if (mode.filter === 'even') vals = vals.filter(x => Math.floor(x) % 2 === 0).slice(0, activeItemCount);
                    if (mode.filter === 'odd') vals = vals.filter(x => Math.floor(x) % 2 !== 0).slice(0, activeItemCount);

                    const sortedValues = vals.sort((a, b) => mode.order === 1 ? a - b : b - a);

                    sortedValues.forEach((val, index) => {
                        const item = document.createElement('div');
                        item.className = `item type-${day.type}`;
                        applyStyle(item, day.type, val);
                        const badge = document.createElement('div');
                        badge.className = 'badge';
                        badge.textContent = index + 1;
                        item.appendChild(badge);
                        solRow.appendChild(item);
                    });
                    board.appendChild(solRow);
                } else {
                    board.style.flexDirection = 'row';
                    board.style.justifyContent = 'center';
                    const msg = document.createElement('div');
                    msg.style.cssText = 'padding:20px;color:#555;font-weight:bold;text-align:center;';
                    msg.innerHTML = 'Mode dynamique.<br>Pas de solution fixe à afficher.';
                    board.appendChild(msg);
                }

                leaderboardSection.classList.remove('hidden');
                fetchLeaderboard();
            } else {
                startBtn.classList.remove('hidden');
                startBtn.textContent = 'Jouer';
                leaderboardTitle.textContent = `Top 10 - ${day.title} (${activeItemCount} éléments)`;

                showExample(day, board);
            }
        }

        // generateValues() has been moved to scripts/generators.js

        // Helper: Génère un exemple visuel du gameplay
        function showExample(day, boardEl) {
            boardEl.innerHTML = '';
            boardEl.classList.remove('hidden');
            boardEl.style.flexDirection = 'column';
            boardEl.style.alignItems = 'center';
            boardEl.style.display = 'flex';
            boardEl.style.position = 'static';
            boardEl.style.height = 'auto';

            const exTitle = document.createElement('h3');
            exTitle.textContent = 'Exemple de l\'objectif :';
            exTitle.style.margin = '0 0 15px 0';
            exTitle.style.color = '#555';
            boardEl.appendChild(exTitle);

            const row = document.createElement('div');
            row.style.display = 'flex';
            row.style.gap = '15px';
            row.style.flexWrap = 'wrap';
            row.style.justifyContent = 'center';
            row.style.alignItems = 'center';

            const mode = GAME_MODES[day.modeId];
            let exCount = 5;
            let vals = generateValues(day.type, exCount * 3);

            if (mode.filter === 'even') vals = vals.filter(x => Math.floor(x) % 2 === 0);
            if (mode.filter === 'odd') vals = vals.filter(x => Math.floor(x) % 2 !== 0);

            // Spread selection across the entire range to always include game extremes
            let uniqueVals = [...new Set(vals)];
            let spreadVals = [];
            if (uniqueVals.length <= exCount) {
                spreadVals = uniqueVals;
            } else {
                for (let i = 0; i < exCount; i++) {
                    spreadVals.push(uniqueVals[Math.round(i * (uniqueVals.length - 1) / (exCount - 1))]);
                }
            }
            vals = spreadVals;

            if (mode.isSort) {
                vals.sort((a, b) => mode.order === 1 ? a - b : b - a);
                vals.forEach((val, i) => {
                    const item = document.createElement('div');
                    item.className = `item type-${day.type}`;
                    applyStyle(item, day.type, val);
                    const badge = document.createElement('div');
                    badge.className = 'badge'; badge.textContent = i + 1;
                    item.appendChild(badge);
                    row.appendChild(item);
                });
            } else if (mode.specialGen === 'odd') {
                let v = generateValues(day.type, 5);
                // Création d'un exemple avec 2 paires distinctes et 1 intrus (5 éléments)
                let exVals = [v[0], v[0], v[1], v[1], v[2]].sort(() => Math.random() - 0.5);
                exVals.forEach(val => {
                    const item = document.createElement('div'); item.className = `item type-${day.type}`; applyStyle(item, day.type, val);
                    if (val === v[2]) item.style.boxShadow = '0 0 0 4px #28a745';
                    row.appendChild(item);
                });
            } else if (mode.specialGen === 'pair' || mode.specialGen === 'pairs') {
                let v = generateValues(day.type, 3);
                let exVals = mode.specialGen === 'pair' ? [v[0], v[1], v[2], v[0]] : [v[0], v[0], v[1], v[1]];
                exVals.sort(() => Math.random() - 0.5).forEach(val => {
                    const item = document.createElement('div'); item.className = `item type-${day.type}`; applyStyle(item, day.type, val);
                    if (val === v[0] || (mode.specialGen === 'pairs' && val === v[1])) item.style.boxShadow = '0 0 0 4px #28a745';
                    row.appendChild(item);
                });
            } else if (mode.isSum || mode.isDiff) {
                let v1 = vals[0], v2 = vals[1];

                // Swap values for subtraction to always show max - min
                if (mode.isDiff && v1 < v2) {
                    let temp = v1;
                    v1 = v2;
                    v2 = temp;
                }

                const i1 = document.createElement('div'); i1.className = `item type-${day.type}`; applyStyle(i1, day.type, v1);
                const op = document.createElement('div'); op.style.fontSize = '24px'; op.style.fontWeight = 'bold'; op.style.color = '#333'; op.textContent = mode.isSum ? '+' : '−';
                const i2 = document.createElement('div'); i2.className = `item type-${day.type}`; applyStyle(i2, day.type, v2);
                const eq = document.createElement('div'); eq.style.fontSize = '24px'; eq.style.fontWeight = 'bold'; eq.style.color = '#333'; eq.textContent = '=';

                // Generate visual element for the result
                const targetVal = mode.isSum ? parseFloat((v1 + v2).toFixed(4)) : parseFloat((v1 - v2).toFixed(4));
                const res = document.createElement('div');
                res.className = `item type-${day.type}`;
                applyStyle(res, day.type, targetVal);
                res.style.boxShadow = '0 0 0 4px #28a745'; // Highlight answer

                row.append(i1, op, i2, eq, res);

            } else if (mode.isReflex) {
                showExampleReflex(day, row, vals);
            } else if (mode.isTyping) {
                showExampleTyping(day, row, vals);
            } else if (mode.isConnectDots) {
                showExampleConnectDots(day, row, vals);
            } else if (mode.isMathQuiz) {
                showExampleMathQuiz(day, row, vals, mode);
            } else if (mode.isSpeedLetters) {
                showExampleSpeedLetters(day, row, vals);
            } else if (mode.isDragDrop) {
                showExampleDragDrop(day, row, vals);
            } else if (mode.isConveyor) {
                showExampleConveyor(day, row, vals);
            } else if (mode.isSpeedQuiz) {
                showExampleSpeedQuiz(day, row, vals);
            } else {
                let targetVal;
                if (mode.findTarget === 'max') targetVal = Math.max(...vals);
                else if (mode.findTarget === 'min' || mode.avoidTarget === 'min') targetVal = Math.min(...vals);
                else if (mode.findTarget === 'median') targetVal = [...vals].sort((a, b) => a - b)[Math.floor(vals.length / 2)];
                else if (mode.isTargetMatch) targetVal = vals[0];

                if (mode.isTargetMatch) {
                    const tg = document.createElement('div'); tg.className = `item type-${day.type}`; applyStyle(tg, day.type, targetVal); tg.style.boxShadow = '0 0 0 4px #007bff';
                    const arrow = document.createElement('div'); arrow.style.fontSize = '24px'; arrow.style.fontWeight = 'bold'; arrow.textContent = '➡';
                    row.append(tg, arrow);
                }

                vals.forEach(val => {
                    const item = document.createElement('div'); item.className = `item type-${day.type}`; applyStyle(item, day.type, val);
                    if (val === targetVal) item.style.boxShadow = mode.avoidTarget ? '0 0 0 4px #dc3545' : '0 0 0 4px #28a745';
                    row.appendChild(item);
                });
            }
            boardEl.appendChild(row);
        }

        // Initialize game session
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
                    }, 100); // Speed of the cursor (in milliseconds)

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

        // Logic Dispatcher for Game Modes
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
        } // Fin de la fonction handleLogic


        // Timer increment
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

        // ——— Lookup tables for knowledge/text types ———
        // Handle item clicks
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

        // Update numbering UI
        function renderBadges() {
            document.querySelectorAll('.badge').forEach(b => b.remove());
            const mode = GAME_MODES[currentDayConfig.modeId];
            selectionOrder.forEach((item, index) => {
                const badge = document.createElement('div');
                badge.className = 'badge';
                // Only display a number if the mode requires sorting/ordering
                badge.textContent = (mode && mode.isSort) ? (index + 1) : '';
                item.appendChild(badge);
            });
        }

        // Check logic and UI response
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

        // Wrap up game UI and wait for feedback
        function endGame(message, isWin, isRageQuit = false) {
            clearInterval(timerInterval);
            clearTimeout(gameTimeout);
            clearInterval(envInterval);
            board.classList.remove('blackout-mode');

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

        // Handle feedback clicks
        btnLike.onclick = () => handleFeedback('like');
        btnDislike.onclick = () => handleFeedback('dislike');
        btnSkip.onclick = () => handleFeedback('none');

        function handleFeedback(feedbackValue) {
            feedbackContainer.classList.add('hidden');
            leaderboardSection.classList.remove('hidden');
            menuBtn.classList.remove('hidden');
            shareBtn.classList.remove('hidden');
            dbMessage.textContent = 'Envoi de votre avis...';
            dbMessage.style.color = '#333';
            // Submit ONLY as an update
            submitScore(pendingTimeVal, feedbackValue, true);
        }

        // Network: Auto Submit score or Update Feedback
        function submitScore(timeVal, feedback, isUpdate = false) {
            let name = playerNameMainInput.value.trim();
            const storedName = getStorage('orderix_player_name');
            if (storedName) name = storedName;

            // Get user's timezone as a proxy for location
            const userLocation = Intl.DateTimeFormat().resolvedOptions().timeZone;

            const payload = {
                name: name,
                time: timeVal,
                day: currentDayConfig.id,
                itemCount: activeItemCount,
                feedback: feedback,
                isUpdate: isUpdate,
                location: userLocation,
                modeId: currentDayConfig.modeId,
                type: currentDayConfig.type,
                sharedClicked: hasSharedThisGame,
                referredBy: sessionReferredBy
            };

            fetch(GAS_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                body: JSON.stringify(payload)
            })
                .then(response => response.json())
                .then(data => {
                    if (data.status === "error") {
                        if (data.message === "Banned word") {
                            dbMessage.textContent = "Ce nom contient un mot interdit.";
                        } else if (data.message === "Name taken for this config") {
                            dbMessage.textContent = isUpdate ? "" : "Score déjà enregistré pour cette difficulté.";
                        } else {
                            dbMessage.textContent = "Erreur serveur.";
                        }
                        if (!isUpdate || data.message !== "Name taken for this config") dbMessage.style.color = "#dc3545";
                    } else {
                        dbMessage.textContent = isUpdate ? "Avis enregistré !" : "Score enregistré avec succès !";
                        dbMessage.style.color = "#28a745";
                    }
                    // Only refresh the leaderboard array if it's the initial submission
                    if (!isUpdate) fetchLeaderboard();
                })
                .catch(err => {
                    dbMessage.textContent = "Erreur de connexion au serveur.";
                    dbMessage.style.color = "#dc3545";
                    console.error(err);
                    if (!isUpdate) fetchLeaderboard();
                });
        }

        // Network: Fetch top 10 (filtered by day AND item count)
        function fetchLeaderboard() {
            leaderboardList.innerHTML = '<li style="padding: 10px; text-align: center;">Chargement...</li>';

            const targetUrl = `${GAS_URL}?day=${currentDayConfig.id}&itemCount=${activeItemCount}&nocache=${Date.now()}`;

            fetch(targetUrl)
                .then(response => response.json())
                .then(data => {
                    leaderboardList.innerHTML = '';
                    if (data.length === 0) {
                        leaderboardList.innerHTML = '<li style="padding: 10px; text-align: center;">Aucun score pour cette configuration.</li>';
                        return;
                    }
                    data.forEach((entry, index) => {
                        const li = document.createElement('li');
                        li.style.padding = '10px';
                        li.style.borderBottom = '1px solid #eee';
                        li.style.display = 'flex';
                        li.style.justifyContent = 'space-between';

                        let rankStyle = "font-weight: bold;";
                        if (index === 0) rankStyle += " color: gold;";
                        else if (index === 1) rankStyle += " color: silver;";
                        else if (index === 2) rankStyle += " color: #cd7f32;";

                        const isWin = entry.time >= 0;
                        const isRQ = entry.time === -999999; // Strict check for rage quit
                        const timeDisplay = isWin ? `${entry.time.toFixed(3)}s` : (isRQ ? "RAGE QUIT" : `FAIL (${Math.abs(entry.time).toFixed(3)}s)`);
                        const colorStyle = isWin ? "" : "color: #dc3545;";

                        li.innerHTML = `
                            <span><span style="${rankStyle}">#${index + 1}</span> ${entry.name}</span>
                            <span style="font-family: monospace; font-weight: bold; ${colorStyle}">${timeDisplay}</span>
                        `;
                        leaderboardList.appendChild(li);
                    });
                })
                .catch(err => {
                    leaderboardList.innerHTML = '<li style="padding: 10px; text-align: center; color: red;">Erreur de chargement.</li>';
                });
        }

        // Browser back button = auto fail if game in progress
        window.addEventListener('popstate', function (e) {
            if (gameInProgress && currentDayConfig && !isPaused) {
                endGame('Retour détecté ! Partie abandonnée.', false, true);
            }
        });

        // Tab/window close = warn and hide content to prevent cheating
        window.addEventListener('beforeunload', function (e) {
            if (gameInProgress && currentDayConfig && !isPaused) {
                document.body.style.display = 'none'; // Cache l'écran pendant la pop-up de confirmation
                e.preventDefault();
                e.returnValue = '';
            }
        });

        // On load: check for unsubmitted pending games (tab was closed mid-game)
        (function recoverPendingFail() {
            try {
                const pending = getStorage('orderix_pending_game');
                if (!pending) return;
                const data = JSON.parse(pending);
                if (!data || !data.dayId) return;
                // Clear it immediately
                setStorage('orderix_pending_game', '');
                // Submit the RAGE QUIT score to the server
                let name = getStorage('orderix_player_name') || '';
                if (!name) return;
                fetch(GAS_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                    body: JSON.stringify({
                        name: name,
                        time: -999999,
                        day: data.dayId,
                        itemCount: data.itemCount,
                        location: data.location || 'Unknown',
                        modeId: data.modeId || '',
                        type: data.type || ''
                    })
                }).then(() => {
                    // Re-fetch played days from server to update sidebar
                    fetchPlayedDays(name);
                }).catch(() => { });
            } catch (e) { }
        })();
    

