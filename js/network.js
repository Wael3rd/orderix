import { GAS_URL, DAYS, GAME_MODES, BASE_TYPES } from './config.js';
import { state, dom } from './state.js';
import { getStorage, setStorage } from './storage.js';
import { refreshSidebar } from './sidebar.js';

// ── Config & day setup ────────────────────────────────────────────────────────
export function fetchConfig(onDone) {
    dom.dayButtonsContainer.innerHTML = '<div class="loader"><div class="spinner"></div>Chargement…</div>';
    fetch(`${GAS_URL}?getConfig=1&nocache=${Date.now()}`)
        .then(r => r.json())
        .then(cfg => {
            state.dayConfig = cfg;
            DAYS.forEach(day => {
                const c = state.dayConfig[day.id];
                if (c) {
                    if (c.modeId && GAME_MODES[c.modeId]) day.modeId = c.modeId;
                    if (c.type) {
                        const bType = BASE_TYPES.find(b => b.type === c.type);
                        if (bType) day.type = c.type;
                    }
                    const mName = GAME_MODES[day.modeId].name;
                    const bName = BASE_TYPES.find(b => b.type === day.type).title;
                    day.title = `Jour ${day.id} : ${mName} - ${bName}`;
                }
            });
            onDone();
        })
        .catch(() => onDone());
}

// ── Player history ────────────────────────────────────────────────────────────
export function fetchPlayedDays(name) {
    if (!name) return;
    fetch(`${GAS_URL}?getPlayed=${encodeURIComponent(name)}&nocache=${Date.now()}`)
        .then(r => r.json())
        .then(data => {
            state.serverPlayedDays = data || {};
            refreshSidebar();
        })
        .catch(() => {});
}

// ── Name verification ─────────────────────────────────────────────────────────
export function verifyPlayerName() {
    const name = dom.playerNameMainInput.value.trim();
    if (name.length < 3) {
        dom.nameStatus.textContent = "3 caractères minimum.";
        dom.nameStatus.style.color = "#dc3545";
        state.isNameValid = false;
        return;
    }
    if (name === getStorage('orderix_player_name')) {
        state.isNameValid = true;
        dom.nameInputContainer.classList.add('hidden');
        dom.nameStatus.classList.add('hidden');
        dom.lockedNameDisplay.textContent = name;
        dom.lockedNameDisplay.classList.remove('hidden');
        fetchPlayedDays(name);
        return;
    }
    dom.nameStatus.textContent = "Vérification...";
    dom.nameStatus.style.color = "#333";
    dom.verifyNameBtn.disabled = true;

    fetch(`${GAS_URL}?checkName=${encodeURIComponent(name)}`)
        .then(r => r.json())
        .then(data => {
            dom.verifyNameBtn.disabled = false;
            if (data.available) {
                state.isNameValid = true;
                setStorage('orderix_player_name', name);
                dom.nameInputContainer.classList.add('hidden');
                dom.nameStatus.classList.add('hidden');
                dom.lockedNameDisplay.textContent = name;
                dom.lockedNameDisplay.classList.remove('hidden');
                fetchPlayedDays(name);
            } else {
                state.isNameValid = false;
                dom.nameStatus.textContent = data.reason;
                dom.nameStatus.style.color = "#dc3545";
            }
        })
        .catch(() => {
            dom.verifyNameBtn.disabled = false;
            dom.nameStatus.textContent = "Erreur réseau.";
            dom.nameStatus.style.color = "#dc3545";
        });
}

// ── Score submission ──────────────────────────────────────────────────────────
export function submitScore(timeVal, feedback, isUpdate = false) {
    let name = dom.playerNameMainInput.value.trim();
    const storedName = getStorage('orderix_player_name');
    if (storedName) name = storedName;

    const payload = {
        name,
        time:          timeVal,
        day:           state.currentDayConfig.id,
        itemCount:     state.activeItemCount,
        feedback,
        isUpdate,
        location:      Intl.DateTimeFormat().resolvedOptions().timeZone,
        modeId:        state.currentDayConfig.modeId,
        type:          state.currentDayConfig.type,
        sharedClicked: state.hasSharedThisGame,
        referredBy:    state.sessionReferredBy,
    };

    fetch(GAS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload),
    })
    .then(r => r.json())
    .then(data => {
        if (data.status === 'error') {
            if (data.message === 'Banned word') {
                dom.dbMessage.textContent = "Ce nom contient un mot interdit.";
            } else if (data.message === 'Name taken for this config') {
                dom.dbMessage.textContent = isUpdate ? "" : "Score déjà enregistré pour cette difficulté.";
            } else {
                dom.dbMessage.textContent = "Erreur serveur.";
            }
            if (!isUpdate || data.message !== 'Name taken for this config') dom.dbMessage.style.color = "#dc3545";
        } else {
            dom.dbMessage.textContent = isUpdate ? "Avis enregistré !" : "Score enregistré avec succès !";
            dom.dbMessage.style.color = "#28a745";
        }
        if (!isUpdate) fetchLeaderboard();
    })
    .catch(err => {
        dom.dbMessage.textContent = "Erreur de connexion au serveur.";
        dom.dbMessage.style.color = "#dc3545";
        console.error(err);
        if (!isUpdate) fetchLeaderboard();
    });
}

// ── Leaderboard ───────────────────────────────────────────────────────────────
export function fetchLeaderboard() {
    dom.leaderboardList.innerHTML = '<li style="padding: 10px; text-align: center;">Chargement...</li>';
    const url = `${GAS_URL}?day=${state.currentDayConfig.id}&itemCount=${state.activeItemCount}&nocache=${Date.now()}`;

    fetch(url)
        .then(r => r.json())
        .then(data => {
            dom.leaderboardList.innerHTML = '';
            if (data.length === 0) {
                dom.leaderboardList.innerHTML = '<li style="padding: 10px; text-align: center;">Aucun score pour cette configuration.</li>';
                return;
            }
            data.forEach((entry, index) => {
                const li = document.createElement('li');
                li.style.cssText = 'padding:10px;border-bottom:1px solid #eee;display:flex;justify-content:space-between;';
                let rankStyle = "font-weight:bold;";
                if (index === 0) rankStyle += " color:gold;";
                else if (index === 1) rankStyle += " color:silver;";
                else if (index === 2) rankStyle += " color:#cd7f32;";
                const isWin = entry.time >= 0;
                const isRQ  = entry.time === -999999;
                const timeDisplay = isWin ? `${entry.time.toFixed(3)}s` : (isRQ ? "RAGE QUIT" : `FAIL (${Math.abs(entry.time).toFixed(3)}s)`);
                const colorStyle  = isWin ? "" : "color:#dc3545;";
                li.innerHTML = `<span><span style="${rankStyle}">#${index + 1}</span> ${entry.name}</span><span style="font-family:monospace;font-weight:bold;${colorStyle}">${timeDisplay}</span>`;
                dom.leaderboardList.appendChild(li);
            });
        })
        .catch(() => {
            dom.leaderboardList.innerHTML = '<li style="padding:10px;text-align:center;color:red;">Erreur de chargement.</li>';
        });
}

// ── Rage-quit recovery on page load ──────────────────────────────────────────
export function recoverPendingFail() {
    try {
        const pending = localStorage.getItem('orderix_pending_game');
        if (!pending) return;
        const data = JSON.parse(pending);
        if (!data || !data.dayId) return;
        localStorage.setItem('orderix_pending_game', '');
        const name = getStorage('orderix_player_name') || '';
        if (!name) return;
        fetch(GAS_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({
                name, time: -999999, day: data.dayId, itemCount: data.itemCount,
                location: data.location || 'Unknown', modeId: data.modeId || '', type: data.type || ''
            }),
        }).then(() => fetchPlayedDays(name)).catch(() => {});
    } catch (e) {}
}
