// ─── API Google Apps Script : scores, classements, pseudo ────────

function fetchPlayedDays(name) {
    if (!name) return;
    fetch(`${GAS_URL}?getPlayed=${encodeURIComponent(name)}&nocache=${Date.now()}`)
        .then(r => r.json())
        .then(data => {
            serverPlayedDays = data || {};
            if (currentScreen === 'home') buildHome();
            if (currentScreen === 'calendar') buildCalendar();
            if (currentScreen === 'league') buildLeague();
            if (currentScreen === 'profile') buildProfile();
        })
        .catch(() => { });
}

function verifyPlayerName() {
    const name = playerNameMainInput.value.trim();
    if (name.length < 3) {
        nameStatus.textContent = "3 caractères minimum.";
        nameStatus.style.color = "var(--err)";
        return;
    }

    if (name === getStorage('orderix_player_name')) {
        lockName(name);
        fetchPlayedDays(name);
        return;
    }

    nameStatus.textContent = "Vérification…";
    nameStatus.style.color = "var(--ink-2)";
    verifyNameBtn.disabled = true;

    fetch(`${GAS_URL}?checkName=${encodeURIComponent(name)}`)
        .then(r => r.json())
        .then(data => {
            verifyNameBtn.disabled = false;
            if (data.available) {
                setStorage('orderix_player_name', name);
                lockName(name);
                fetchPlayedDays(name);
            } else {
                nameStatus.textContent = data.reason || "Ce pseudo n'est pas disponible.";
                nameStatus.style.color = "var(--err)";
            }
        })
        .catch(() => {
            verifyNameBtn.disabled = false;
            nameStatus.textContent = "Pas de connexion — réessayez plus tard.";
            nameStatus.style.color = "var(--err)";
        });
}

function lockName(name) {
    nameInputContainer.classList.add('hidden');
    nameStatus.textContent = '';
    lockedNameDisplay.innerHTML = '';
    const span = document.createElement('span');
    span.textContent = '✓ ' + name;
    lockedNameDisplay.appendChild(span);
    lockedNameDisplay.classList.remove('hidden');
}

function getPlayerName() {
    return getStorage('orderix_player_name') || '';
}

function submitScore(timeVal, feedback, isUpdate = false) {
    // Version de test : aucun envoi au serveur (le classement réel n'est
    // pas pollué et « Rejouer (test) » reste sans trace).
    if (ENV_NAME === 'staging') {
        dbMessage.textContent = 'Mode test — rien n\'est envoyé au serveur.';
        dbMessage.style.color = 'var(--gris-clair)';
        if (!isUpdate) fetchLeaderboard();
        return;
    }

    const name = getPlayerName();
    if (!name) {
        // Sans pseudo, la partie reste locale : on n'envoie rien au serveur.
        dbMessage.textContent = "Choisissez un pseudo dans Profil pour publier vos temps.";
        dbMessage.style.color = "var(--ink-3)";
        if (!isUpdate) fetchLeaderboard();
        return;
    }

    let userLocation = 'Unknown';
    try { userLocation = Intl.DateTimeFormat().resolvedOptions().timeZone; } catch (e) { }

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
                    dbMessage.textContent = isUpdate ? "" : "Un temps est déjà enregistré pour ce puzzle.";
                } else {
                    dbMessage.textContent = "Erreur serveur.";
                }
                if (!isUpdate || data.message !== "Name taken for this config") dbMessage.style.color = "var(--err)";
            } else {
                dbMessage.textContent = isUpdate ? "Merci pour votre avis !" : "Temps publié au classement.";
                dbMessage.style.color = "var(--sage-deep)";
            }
            if (!isUpdate) fetchLeaderboard();
        })
        .catch(() => {
            dbMessage.textContent = "Hors-ligne : votre résultat est gardé sur cet appareil.";
            dbMessage.style.color = "var(--ink-3)";
            if (!isUpdate) fetchLeaderboard();
        });
}

function _skeletonRows(n) {
    const f = document.createDocumentFragment();
    for (let i = 0; i < n; i++) {
        const li = document.createElement('li');
        li.className = 'lrow';
        li.innerHTML = '<span class="rk skel-block" style="width:20px;height:14px"></span>' +
            '<span class="av skel-block" style="width:32px;height:32px;border-radius:50%"></span>' +
            '<span class="nm skel-block" style="width:80px;height:14px"></span>' +
            '<span class="sc skel-block" style="width:50px;height:14px;margin-left:auto"></span>';
        f.appendChild(li);
    }
    return f;
}

// Classement d'un jour rendu en lignes sociales (.lrow) — accueil et écran Classement
function fetchBoardInto(dayId, listEl, topN) {
    if (!listEl) return;
    listEl.innerHTML = '';
    listEl.appendChild(_skeletonRows(topN));

    const cfg = dayConfig[dayId];
    const count = (cfg && cfg.count) ? cfg.count : 10;
    const me = getPlayerName();

    fetch(`${GAS_URL}?day=${dayId}&itemCount=${count}&nocache=${Date.now()}`)
        .then(r => r.json())
        .then(data => {
            listEl.innerHTML = '';
            if (!data || data.length === 0) {
                listEl.innerHTML = '<li class="empty">Personne n\'a encore joué — soyez la première !</li>';
                return;
            }
            data.slice(0, topN).forEach((entry, index) => {
                const li = document.createElement('li');
                li.className = 'lrow' + (me && entry.name === me ? ' me' : '');

                const rk = document.createElement('span');
                rk.className = 'rk' + (index < 3 ? ' r' + (index + 1) : '');
                rk.textContent = index + 1;

                const av = document.createElement('span');
                av.className = 'av';
                av.textContent = (entry.name || '?')[0].toUpperCase();

                const nm = document.createElement('span');
                nm.className = 'nm';
                nm.textContent = entry.name + (me && entry.name === me ? ' (vous)' : '');

                const sc = document.createElement('span');
                const isWin = entry.time >= 0;
                sc.className = 'sc' + (isWin ? '' : ' fail');
                sc.textContent = isWin ? `${entry.time.toFixed(2)} s`
                    : (entry.time === -999999 ? 'Abandon' : 'Raté');

                li.append(rk, av, nm, sc);
                listEl.appendChild(li);
            });
        })
        .catch(() => {
            listEl.innerHTML = '<li class="empty">Classement indisponible hors-ligne.</li>';
        });
}

function fetchLeaderboard() {
    leaderboardList.innerHTML = '';
    leaderboardList.appendChild(_skeletonRows(5));

    const targetUrl = `${GAS_URL}?day=${currentDayConfig.id}&itemCount=${activeItemCount}&nocache=${Date.now()}`;

    fetch(targetUrl)
        .then(response => response.json())
        .then(data => {
            leaderboardList.innerHTML = '';
            if (!data || data.length === 0) {
                leaderboardList.innerHTML = '<li style="justify-content:center;color:var(--ink-3)">Soyez la première au classement !</li>';
                return;
            }
            data.forEach((entry, index) => {
                const li = document.createElement('li');

                const left = document.createElement('span');
                const rank = document.createElement('span');
                rank.className = 'rank' + (index < 3 ? ' r' + (index + 1) : '');
                rank.textContent = '#' + (index + 1);
                left.appendChild(rank);
                left.appendChild(document.createTextNode(entry.name));

                const right = document.createElement('span');
                const isWin = entry.time >= 0;
                const isAbandon = entry.time === -999999;
                right.className = 't' + (isWin ? '' : ' fail');
                right.textContent = isWin ? `${entry.time.toFixed(3)}s`
                    : (isAbandon ? 'Abandon' : `Raté (${Math.abs(entry.time).toFixed(3)}s)`);

                li.appendChild(left);
                li.appendChild(right);
                leaderboardList.appendChild(li);
            });
        })
        .catch(() => {
            leaderboardList.innerHTML = '<li style="justify-content:center;color:var(--ink-3)">Classement indisponible hors-ligne.</li>';
        });
}
