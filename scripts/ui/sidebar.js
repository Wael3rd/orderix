// --- UI Components ---
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

        function autoSelectDayFromUrl() {
            const urlDay = parseInt(new URLSearchParams(window.location.search).get('day'));
            if (!urlDay) return;
            const day = DAYS.find(d => d.id === urlDay);
            if (!day) return;
            const btn = document.querySelector(`.day-btn[data-day-id="${urlDay}"]`);
            if (btn) selectDay(day, btn);
        }
