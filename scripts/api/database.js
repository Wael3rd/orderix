// --- API & Database ---
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
