
        // Fetch played days from server for a given player name


        if (savedName) fetchPlayedDays(savedName);

        // Build sidebar buttons


        // Refresh sidebar ticks only


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







        // generateValues() has been moved to scripts/generators.js

        // Helper: Génère un exemple visuel du gameplay


        // Initialize game session


        // Logic Dispatcher for Game Modes
 // Fin de la fonction handleLogic


        // Timer increment


        // ——— Lookup tables for knowledge/text types ———
        // Handle item clicks


        // Update numbering UI


        // Check logic and UI response


        // Wrap up game UI and wait for feedback


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


        // Network: Fetch top 10 (filtered by day AND item count)


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
    



