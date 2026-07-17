// ─── Point d'entrée : amorçage et écouteurs globaux ──────────────

(function boot() {
    // 1. Pseudo déjà validé → verrouille l'affichage du profil
    if (savedName) {
        lockName(savedName);
        fetchPlayedDays(savedName);
    }

    // 2. Config serveur (nb d'éléments par jour, overrides mode/type, jours désactivés)
    //    Démarrage instantané : cache local d'abord, réseau ensuite (timeout 4 s).
    try {
        const cached = getStorage('orderix_day_config');
        if (cached) applyDayConfig(JSON.parse(cached));
    } catch (e) { }

    const bootStart = Date.now();
    showScreen('home');
    const remaining = Math.max(0, 1200 - (Date.now() - bootStart));
    setTimeout(() => document.getElementById('boot-loader').classList.add('fade'), remaining);

    const ctrl = (typeof AbortController !== 'undefined') ? new AbortController() : null;
    if (ctrl) setTimeout(() => ctrl.abort(), 4000);
    fetch(`${GAS_URL}?getConfig=1&nocache=${Date.now()}`, ctrl ? { signal: ctrl.signal } : {})
        .then(r => r.json())
        .then(cfg => {
            setStorage('orderix_day_config', JSON.stringify(cfg));
            applyDayConfig(cfg);
            if (currentScreen === 'home') buildHome();
            if (currentScreen === 'calendar') buildCalendar();
        })
        .catch(() => { });

    // 3. Partie interrompue (app fermée en plein jeu) → comptée comme abandon
    recoverPendingGame();
})();

function applyDayConfig(cfg) {
    // La distribution mode×type des 365 jours est organisée dans le code
    // (state.js) depuis l'audit v2.1 — les overrides modeId/type hérités du
    // Google Sheet ne sont PLUS appliqués (ils écrasaient la nouvelle
    // rotation des modes phares). Le serveur conserve deux leviers :
    // `count` (nombre d'éléments) et `enabled` (désactivation d'urgence).
    dayConfig = cfg || {};
}

function recoverPendingGame() {
    try {
        const pending = getStorage('orderix_pending_game');
        if (!pending) return;
        const data = JSON.parse(pending);
        if (!data || !data.dayId) return;
        setStorage('orderix_pending_game', '');

        // Marque le jour comme abandonné en local
        saveLocalResult(data.dayId, data.itemCount || 10, -999999, false);

        // Et au serveur si un pseudo existe
        const name = getStorage('orderix_player_name') || '';
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
        }).then(() => fetchPlayedDays(name)).catch(() => { });
    } catch (e) { }
}

// ─── Navigation ──────────────────────────────────────────────────
document.querySelectorAll('#tabbar .tab').forEach(tab => {
    tab.addEventListener('click', () => showScreen(tab.dataset.screen));
});
document.getElementById('hud-plus').addEventListener('click', () => showScreen('profile'));

// ─── Boutons de jeu ──────────────────────────────────────────────
startBtn.addEventListener('click', startGame);
checkBtn.addEventListener('click', verifyOrder);
homeBtn.addEventListener('click', goHome);

backBtn.addEventListener('click', () => {
    if (gameInProgress && !isPaused) {
        // Quitter en pleine partie = abandon (une seule tentative par puzzle)
        if (confirm('Quitter maintenant comptera ce puzzle comme abandonné. Continuer ?')) {
            abandonGame();
        }
        return;
    }
    goBack(); // revient à l'écran d'origine (accueil OU calendrier)
});

// Bouton retour Android (popstate dans la WebView)
window.addEventListener('popstate', function () {
    if (gameInProgress && currentDayConfig && !isPaused) {
        abandonGame();
    } else if (currentScreen === 'game') {
        goBack();
    }
});

// ─── Partage ─────────────────────────────────────────────────────
shareBtn.addEventListener('click', () => {
    if (!currentDayConfig) return;
    let isWin = false, timeVal = 0;
    if (pendingTimeVal !== 0) {
        isWin = pendingTimeVal > 0;
        timeVal = Math.abs(pendingTimeVal);
    } else {
        const info = getPlayedInfo(currentDayConfig.id);
        if (!info) return;
        isWin = info.isWin;
        timeVal = Math.abs(info.time);
    }

    const status = isWin ? "réussi" : "tenté";
    const playerName = getStorage('orderix_player_name') || '';
    const url = 'https://orderix.app/?ref=' + encodeURIComponent(playerName) + '&day=' + currentDayConfig.id;
    const timeStr = timeVal === 999999 ? '' : ` en ${timeVal}s`;
    const textToShare = `J'ai ${status} le puzzle du jour ${currentDayConfig.id} d'Orderix (${currentDayConfig.title})${timeStr} — à votre tour : ${url}`;

    const afterShare = () => {
        if (!hasSharedThisGame && pendingTimeVal !== 0) {
            hasSharedThisGame = true;
            submitScore(Math.abs(pendingTimeVal), '', true);
        }
    };

    if (navigator.share) {
        navigator.share({ text: textToShare }).then(afterShare).catch(() => { });
    } else if (navigator.clipboard) {
        navigator.clipboard.writeText(textToShare).then(() => {
            shareBtn.textContent = 'Copié !';
            setTimeout(() => shareBtn.textContent = 'Partager', 2000);
            afterShare();
        });
    }
});

// ─── Pseudo ──────────────────────────────────────────────────────
verifyNameBtn.addEventListener('click', verifyPlayerName);
playerNameMainInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') verifyPlayerName();
});

// ─── Avis sur le puzzle ──────────────────────────────────────────
btnLike.addEventListener('click', () => handleFeedback('like'));
btnDislike.addEventListener('click', () => handleFeedback('dislike'));
btnSkip.addEventListener('click', () => handleFeedback('none'));

function handleFeedback(feedbackValue) {
    feedbackQ.classList.add('hidden');
    feedbackContainer.classList.add('hidden');
    resultActions.classList.remove('hidden');
    leaderboardSection.classList.remove('hidden');
    if (feedbackValue !== 'none' && getPlayerName()) {
        dbMessage.textContent = 'Envoi de votre avis…';
        dbMessage.style.color = 'var(--ink-2)';
    }
    submitScore(pendingTimeVal, feedbackValue, true);
    fetchLeaderboard();
}

// ─── Zone de test (staging uniquement) ───────────────────────────
if (ENV_NAME === 'staging') {
    document.getElementById('dev-zone').classList.remove('hidden');
    document.getElementById('reset-progress-btn').addEventListener('click', () => {
        if (!confirm('Effacer toute la progression locale ? Toutes les cases redeviendront jouables.')) return;
        setStorage('orderix_local_results', '');
        setStorage('orderix_pending_game', '');
        localResults = {};
        serverPlayedDays = {};
        buildProfile();
        alert('Progression effacée — le calendrier est vierge.');
    });
}

// ─── Confort mobile ──────────────────────────────────────────────
// Le mode « Pression Longue » déclencherait le menu contextuel Android
document.addEventListener('contextmenu', (e) => {
    if (gameInProgress) e.preventDefault();
});
