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

    // Config des jours : Supabase (table day_config) en source primaire,
    // repli GAS si indisponible. Cache local pour le démarrage hors-ligne.
    const ctrl = (typeof AbortController !== 'undefined') ? new AbortController() : null;
    if (ctrl) setTimeout(() => ctrl.abort(), 4000);
    const viaGasConfig = () =>
        fetch(`${GAS_URL}?getConfig=1&nocache=${Date.now()}`, ctrl ? { signal: ctrl.signal } : {})
            .then(r => r.json());
    const viaSupabaseConfig = () =>
        fetch(`${SUPABASE_URL}/rest/v1/day_config?select=*`, {
            headers: { apikey: SUPABASE_ANON_KEY, Authorization: 'Bearer ' + SUPABASE_ANON_KEY },
            signal: ctrl ? ctrl.signal : undefined
        })
            .then(r => { if (!r.ok) throw new Error('day_config ' + r.status); return r.json(); })
            .then(rows => {
                const cfg = {};
                (rows || []).forEach(x => {
                    cfg[x.day] = { count: x.item_count || undefined, enabled: x.enabled };
                });
                return cfg;
            });
    ((typeof SB_ENABLED !== 'undefined' && SB_ENABLED)
        ? viaSupabaseConfig().catch(viaGasConfig)
        : viaGasConfig())
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
    // Version de test : le verrou `enabled` du Sheet est ignoré pour que
    // tous les jours restent testables (le Sheet garde la main en prod).
    // Sans ça, les vieilles lignes enabled=FALSE (jours 23-31) grisaient
    // la fin du calendrier de janvier.
    if (ENV_NAME === 'staging') {
        Object.keys(dayConfig).forEach(k => {
            if (dayConfig[k] && dayConfig[k].enabled === false) delete dayConfig[k].enabled;
        });
    }
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

        // Et au serveur si un pseudo existe (jamais en version de test)
        if (ENV_NAME === 'staging') return;
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
// Le « + » à côté des étoiles ouvre la Boutique (avant : doublon du Profil)
document.getElementById('hud-plus').addEventListener('click', () => showScreen('shop'));
// L'avatar du HUD ouvre le Profil (convention Easybrain/SNG)
document.getElementById('hud-avatar').addEventListener('click', () => showScreen('profile'));

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

    // Carte de partage façon Wordle : résultat + série + progression de
    // l'année en emojis, sans jamais révéler la solution du puzzle.
    const playerName = getStorage('orderix_player_name') || '';
    // Page de défi publique (gh-pages) : jolie carte + lien de téléchargement
    const url = 'https://wael3rd.github.io/orderix/defi.html?ref=' + encodeURIComponent(playerName) +
        '&day=' + currentDayConfig.id +
        (isWin && timeVal !== 999999 ? '&t=' + timeVal.toFixed(2) : '');
    const mode = GAME_MODES[currentDayConfig.modeId];
    const stats = computeStats();

    const timeStr = (isWin && timeVal !== 999999)
        ? `Réussi en ${timeVal.toFixed(2).replace('.', ',')} s ⏱`
        : (isWin ? 'Réussi !' : 'Tenté — il me résiste encore !');

    // Barre d'année : 10 blocs, remplis au prorata des puzzles réussis
    const blocs = Math.round(10 * stats.won / 365);
    const barre = '🟩'.repeat(Math.max(isWin ? 1 : 0, blocs)) + '⬜'.repeat(10 - Math.max(isWin ? 1 : 0, blocs));

    const lignes = [
        `🧩 Orderix — Jour ${currentDayConfig.id} · ${mode ? mode.name : ''}`,
        `${isWin ? '✅' : '🔶'} ${timeStr}`
    ];
    if (stats.streak > 1) lignes.push(`🔥 Série : ${stats.streak} jour${stats.streak > 1 ? 's' : ''}`);
    lignes.push(`${barre} ${stats.won}/365`);
    lignes.push('');
    lignes.push(isWin ? `Tu fais mieux ? 👉 ${url}` : `À toi de jouer 👉 ${url}`);
    const textToShare = lignes.join('\n');

    const afterShare = () => {
        logEvent('partage', { jour: currentDayConfig.id, win: isWin });
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

// ─── Partage du récap hebdo (« Ma semaine Orderix ») ─────────────
document.getElementById('week-share').addEventListener('click', () => {
    const r = computeWeekRecap();
    const stats = computeStats();
    const EMOJI = { win: '🟩', fail: '🟥', manque: '⬜', futur: '⬛', vide: '⬛' };
    const barre = r.jours.map(j => EMOJI[j.etat]).join('');
    const lignes = [
        '🧩 Ma semaine Orderix',
        barre + ` ${r.gagnes}/7`,
        (r.best !== null ? `⏱ Meilleure perf : ${r.best.toFixed(2).replace('.', ',')} s` : null),
        (stats.streak > 1 ? `🔥 Série : ${stats.streak} jours` : null),
        '',
        'Rejoins-moi 👉 https://wael3rd.github.io/orderix/defi.html?ref=' +
        encodeURIComponent(getStorage('orderix_player_name') || '')
    ].filter(x => x !== null);
    const txt = lignes.join('\n');
    logEvent('partage_semaine');
    if (navigator.share) navigator.share({ text: txt }).catch(() => { });
    else if (navigator.clipboard) {
        navigator.clipboard.writeText(txt);
        const b = document.getElementById('week-share');
        b.textContent = 'Copié !';
        setTimeout(() => b.textContent = 'Partager ma semaine', 1500);
    }
});

// ─── Groupes d'amies : créer / rejoindre ─────────────────────────
if (typeof SB_ENABLED !== 'undefined' && SB_ENABLED) {
    const fStatus = document.getElementById('friends-status');
    document.getElementById('friend-create-btn').addEventListener('click', async () => {
        const name = prompt('Nom du groupe (ex. « Les sœurs », « Bureau ») :');
        if (!name || !name.trim()) return;
        fStatus.textContent = 'Création…';
        const g = await sbCreateFriendGroup(name.trim().slice(0, 24));
        if (g && g.code) {
            fStatus.textContent = `✓ Groupe créé — partagez le code ${g.code} !`;
            logEvent('amies_groupe_cree');
            buildFriendBoards();
        } else fStatus.textContent = 'Création impossible — réessayez.';
    });
    document.getElementById('friend-join-btn').addEventListener('click', async () => {
        const code = document.getElementById('friend-code-input').value.trim().toUpperCase();
        if (code.length !== 6) { fStatus.textContent = 'Le code fait 6 caractères.'; return; }
        fStatus.textContent = 'Vérification…';
        const g = await sbJoinFriendGroup(code);
        if (g === 'inconnu') fStatus.textContent = 'Code inconnu — vérifiez avec votre amie.';
        else if (g === 'complet') fStatus.textContent = 'Ce groupe est complet (30 max).';
        else if (g && g.name) {
            fStatus.textContent = `✓ Bienvenue dans « ${g.name} » !`;
            document.getElementById('friend-code-input').value = '';
            logEvent('amies_groupe_rejoint');
            buildFriendBoards();
        } else fStatus.textContent = 'Impossible pour le moment — réessayez.';
    });

    // Synchronisation du journal analytics : au démarrage puis toutes les 5 min
    setTimeout(() => sbFlushEvents(), 6000);
    setInterval(() => sbFlushEvents(), 5 * 60 * 1000);
}

// ─── Boutique : bouton d'achat du Pass (stub avant Play Billing) ─
const passBuyBtn = document.getElementById('pass-buy');
if (passBuyBtn) passBuyBtn.addEventListener('click', () => {
    if (typeof _shopBuyMessage === 'function') _shopBuyMessage();
    logEvent('pass_achat_intention');
});

// ─── Sauvegarde de compte : lier un e-mail / récupérer ───────────
if (typeof SB_ENABLED !== 'undefined' && SB_ENABLED) {
    const accCard = document.getElementById('account-card');
    const accStatus = document.getElementById('account-status');
    accCard.hidden = false;
    const majStatutCompte = async () => {
        // Affichage immédiat depuis le cache local, puis vérité serveur
        const mail = getStorage('orderix_email_lie');
        accStatus.textContent = mail
            ? '✓ Compte protégé par ' + mail
            : '⚠ Compte non protégé : une désinstallation le perdrait.';
        accStatus.style.color = mail ? 'var(--vert)' : 'var(--rouge)';
        document.getElementById('account-link-row').style.display = mail ? 'none' : 'flex';

        const u = await sbGetUser();
        if (!u) return;
        if (u.email && u.confirme) {
            setStorage('orderix_email_lie', u.email);
            accStatus.textContent = '✓ Compte protégé et confirmé : ' + u.email;
            accStatus.style.color = 'var(--vert)';
            document.getElementById('account-link-row').style.display = 'none';
        } else if (u.email && u.enAttente) {
            accStatus.textContent = '⏳ Confirmation en attente pour ' + u.email + ' — cliquez le lien reçu par e-mail.';
            accStatus.style.color = 'var(--or)';
        } else if (!u.email && !u.enAttente) {
            // Le serveur dit « aucun e-mail » (compte recréé, base remise à
            // zéro…) : on ne prétend pas être protégée
            setStorage('orderix_email_lie', '');
            accStatus.textContent = '⚠ Compte non protégé : une désinstallation le perdrait.';
            accStatus.style.color = 'var(--rouge)';
            document.getElementById('account-link-row').style.display = 'flex';
        }
    };
    majStatutCompte();

    document.getElementById('account-link-btn').addEventListener('click', async () => {
        const email = document.getElementById('account-email').value.trim();
        if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
            accStatus.textContent = 'Adresse e-mail invalide.';
            accStatus.style.color = 'var(--rouge)';
            return;
        }
        accStatus.textContent = 'Envoi…';
        const res = await sbAttachEmail(email);
        if (res === 'ok') {
            setStorage('orderix_email_lie', email);
            accStatus.textContent = '✓ E-mail de confirmation envoyé à ' + email + ' — cliquez le lien reçu pour finaliser.';
            accStatus.style.color = 'var(--vert)';
            document.getElementById('account-link-row').style.display = 'none';
        } else if (res === 'pris') {
            accStatus.textContent = 'Cet e-mail protège déjà un compte — utilisez « Récupérer » ci-dessous.';
            accStatus.style.color = 'var(--rouge)';
        } else {
            accStatus.textContent = 'Impossible pour le moment — vérifiez la connexion.';
            accStatus.style.color = 'var(--rouge)';
        }
    });

    // Connexions sociales : Google / Facebook / Apple (via Supabase OAuth)
    [['login-google', 'google'], ['login-facebook', 'facebook'], ['login-apple', 'apple']].forEach(([id, provider]) => {
        document.getElementById(id).addEventListener('click', async () => {
            const mail = getStorage('orderix_email_lie');
            if (!mail && getPlayerName()) {
                if (!confirm('Vous allez vous connecter avec ' + provider.charAt(0).toUpperCase() + provider.slice(1) +
                    '.\n\nSi ce compte social a déjà des données Orderix, elles remplaceront votre session actuelle. Continuer ?')) return;
            }
            accStatus.textContent = 'Ouverture de ' + provider + '…';
            accStatus.style.color = 'var(--gris)';
            await sbOAuthLogin(provider);
        });
    });

    // Retour du deep link (Android) : orderix://auth-callback
    // — soit une connexion OAuth (#access_token…), soit le retour du
    // lien de confirmation d'e-mail (l'app se rouvre → on affiche ✓)
    const capApp = window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.App;
    if (capApp && capApp.addListener) {
        capApp.addListener('appUrlOpen', async (ev) => {
            if (!ev || !ev.url || ev.url.indexOf('auth-callback') === -1) return;
            const plug = window.Capacitor.Plugins;
            if (plug.Browser && plug.Browser.close) plug.Browser.close().catch(() => { });

            // Cas confirmation d'e-mail : pas de jetons dans l'URL
            if (ev.url.indexOf('access_token') === -1) {
                showScreen('profile');
                document.getElementById('account-card').scrollIntoView({ block: 'center' });
                accStatus.textContent = 'Vérification de la confirmation…';
                accStatus.style.color = 'var(--gris)';
                await majStatutCompte();
                const u = await sbGetUser();
                if (u && u.confirme) {
                    accStatus.textContent = '🎉 E-mail validé — votre compte est protégé pour toujours !';
                    accStatus.style.color = 'var(--vert)';
                    haptic([15, 40, 20]);
                    celebrate();
                    logEvent('email_confirme');
                }
                return;
            }

            const res = await sbHandleOAuthCallback(ev.url);
            if (res.ok) {
                setStorage('orderix_email_lie', 'connexion sociale');
                majStatutCompte();
                accStatus.textContent = '✓ Connectée — pseudo, scores et achats synchronisés !';
                accStatus.style.color = 'var(--vert)';
                const nom = getPlayerName();
                if (nom) lockName(nom);
                if (currentScreen === 'profile') buildProfile();
                if (currentScreen === 'home') buildHome();
            } else {
                accStatus.textContent = 'Connexion refusée : ' + (res.msg || 'réessayez.') +
                    ' (Le fournisseur est-il configuré dans Supabase ?)';
                accStatus.style.color = 'var(--rouge)';
            }
        });
    }

    document.getElementById('account-recover-btn').addEventListener('click', async () => {
        const email = prompt('L\'e-mail lié à votre ancien compte :');
        if (!email || !email.trim()) return;
        accStatus.textContent = 'Envoi du code à ' + email.trim() + '…';
        accStatus.style.color = 'var(--gris)';
        const sent = await sbSendRecoveryCode(email.trim());
        if (!sent) {
            accStatus.textContent = 'Aucun compte trouvé pour cet e-mail (ou hors-ligne).';
            accStatus.style.color = 'var(--rouge)';
            return;
        }
        const code = prompt('Entrez le code à 6 chiffres reçu par e-mail :');
        if (!code || !code.trim()) return;
        accStatus.textContent = 'Vérification…';
        const ok = await sbRecoverWithCode(email.trim(), code.trim());
        if (ok) {
            setStorage('orderix_email_lie', email.trim());
            majStatutCompte();
            accStatus.textContent = '✓ Compte restauré — pseudo, scores et achats récupérés !';
            accStatus.style.color = 'var(--vert)';
            const nom = getPlayerName();
            if (nom) lockName(nom);
            buildProfile();
        } else {
            accStatus.textContent = 'Code invalide ou expiré — réessayez.';
            accStatus.style.color = 'var(--rouge)';
        }
    });
}

// ─── RGPD : export et suppression du compte en ligne ─────────────
if (typeof SB_ENABLED !== 'undefined' && SB_ENABLED) {
    const rgpdCard = document.getElementById('rgpd-card');
    const rgpdStatus = document.getElementById('rgpd-status');
    rgpdCard.hidden = false;

    document.getElementById('rgpd-export').addEventListener('click', async () => {
        rgpdStatus.textContent = 'Export en cours…';
        const data = await sbExportMyData();
        if (!data) { rgpdStatus.textContent = 'Aucune donnée en ligne (ou hors-ligne).'; return; }
        const txt = JSON.stringify(data, null, 2);
        logEvent('rgpd_export');
        if (navigator.share) {
            navigator.share({ title: 'Mes données Orderix', text: txt }).catch(() => { });
            rgpdStatus.textContent = '✓ Export prêt à partager.';
        } else if (navigator.clipboard) {
            navigator.clipboard.writeText(txt);
            rgpdStatus.textContent = '✓ Données copiées dans le presse-papiers.';
        }
    });

    document.getElementById('rgpd-delete').addEventListener('click', async () => {
        if (!confirm('Supprimer définitivement votre compte en ligne ?\n\nVos scores publiés et votre pseudo seront effacés des classements. Votre progression LOCALE (calendrier, médailles, série) reste sur ce téléphone.')) return;
        if (!confirm('Vraiment sûr(e) ? Cette action est irréversible.')) return;
        rgpdStatus.textContent = 'Suppression…';
        const ok = await sbDeleteMyAccount();
        rgpdStatus.textContent = ok
            ? '✓ Compte en ligne supprimé. Un nouveau compte anonyme sera créé si vous rejouez en ligne.'
            : 'Échec — vérifiez la connexion et réessayez.';
    });
}

// ─── Rappel quotidien (notification locale, opt-in) ──────────────
// Plugin Capacitor LocalNotifications : absent dans le navigateur, on
// se protège. Une seule notification par jour, à 19 h, jamais plus.
const _LN = (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.LocalNotifications) || null;
const notifToggle = document.getElementById('notif-toggle');
const notifStatus = document.getElementById('notif-status');

function renderNotifToggle() {
    const on = getStorage('orderix_notif') === '1';
    notifToggle.textContent = on ? '🔕 Désactiver le rappel' : '🔔 Activer le rappel';
    notifStatus.textContent = !_LN
        ? 'Disponible dans l\'application Android uniquement.'
        : (on ? '✓ Rappel actif — tous les jours à 19 h.' : '');
}

async function scheduleDailyReminder() {
    if (!_LN) return false;
    try {
        const perm = await _LN.requestPermissions();
        if (perm.display !== 'granted') {
            notifStatus.textContent = 'Autorisation refusée — activez les notifications dans les réglages Android.';
            return false;
        }
        await _LN.cancel({ notifications: [{ id: 1 }] }).catch(() => { });
        await _LN.schedule({
            notifications: [{
                id: 1,
                title: 'Votre puzzle du jour vous attend 🧩',
                body: 'Trois petites minutes pour garder la série au chaud !',
                schedule: { on: { hour: 19, minute: 0 }, allowWhileIdle: true }
            }]
        });
        return true;
    } catch (e) { return false; }
}

if (notifToggle) {
    notifToggle.addEventListener('click', async () => {
        const on = getStorage('orderix_notif') === '1';
        if (on) {
            setStorage('orderix_notif', '0');
            if (_LN) await _LN.cancel({ notifications: [{ id: 1 }] }).catch(() => { });
            logEvent('notif_off');
        } else {
            const ok = await scheduleDailyReminder();
            if (ok) { setStorage('orderix_notif', '1'); logEvent('notif_on'); }
        }
        renderNotifToggle();
    });
    renderNotifToggle();
    // Re-programme à chaque lancement (les reboots Android purgent parfois)
    if (getStorage('orderix_notif') === '1') scheduleDailyReminder();
}

// ─── Onboarding (premier lancement, 3 écrans max) ────────────────
const OB_SLIDES = [
    { e: '🧩', t: 'Un puzzle par jour', x: 'Chaque jour, un nouveau défi de trois petites minutes. Pas plus — c\'est votre rendez-vous cerveau.' },
    { e: '🏅', t: 'Remplissez votre album', x: 'Chaque victoire colorie une case du calendrier. Un mois complet = une médaille. Et les jours manqués se rattrapent !' },
    { e: '🔥', t: 'Gardez la série au chaud', x: 'Jouer chaque jour fait grandir votre série. Un oubli ? Vos gels 🧊 vous pardonnent — vous n\'avez rien à perdre, que des étoiles à gagner.' }
];
let _obIdx = 0;

function renderOnboarding() {
    const s = OB_SLIDES[_obIdx];
    document.getElementById('ob-emoji').textContent = s.e;
    document.getElementById('ob-title').textContent = s.t;
    document.getElementById('ob-text').textContent = s.x;
    document.getElementById('ob-next').textContent = _obIdx === OB_SLIDES.length - 1 ? 'C\'est parti !' : 'Suivant';
    const dots = document.getElementById('ob-dots');
    dots.innerHTML = '';
    OB_SLIDES.forEach((_, i) => {
        const d = document.createElement('span');
        d.style.cssText = 'width:9px;height:9px;border-radius:50%;transition:background .2s;' +
            `background:${i === _obIdx ? 'var(--bleu)' : '#D8DCE8'};`;
        dots.appendChild(d);
    });
}

function closeOnboarding() {
    document.getElementById('onboarding').classList.add('hidden');
    setStorage('orderix_onboarded', '1');
    logEvent('onboarding_termine', { slide: _obIdx + 1 });
}

if (!getStorage('orderix_onboarded')) {
    document.getElementById('onboarding').classList.remove('hidden');
    renderOnboarding();
    logEvent('onboarding_debut');
}

// Parrainage (côté filleule, 100 % local) : arriver par un lien ?ref=
// débloque l'avatar cadeau 🎁 — définitivement
if (sessionReferredBy && getStorage('orderix_referred') !== '1') {
    setStorage('orderix_referred', '1');
    logEvent('parrainage_filleule', { ref: sessionReferredBy.slice(0, 15) });
}
document.getElementById('ob-next').addEventListener('click', () => {
    if (_obIdx < OB_SLIDES.length - 1) { _obIdx++; haptic(8); renderOnboarding(); }
    else closeOnboarding();
});
document.getElementById('ob-skip').addEventListener('click', closeOnboarding);

// ─── FTUE : proposer le rappel APRÈS la première victoire ────────
function proposeReminderAfterFirstWin() {
    if (getStorage('orderix_notif') === '1' || !_LN) return;
    if (document.getElementById('first-win-cta')) return;
    const cta = document.createElement('div');
    cta.id = 'first-win-cta';
    cta.style.cssText = 'margin-top:14px;padding:14px;border-radius:14px;background:var(--bleu-pale);text-align:center;';
    const txt = document.createElement('div');
    txt.style.cssText = 'font-size:.85rem;font-weight:700;color:var(--bleu-fonce);margin-bottom:10px;';
    txt.textContent = 'Envie de ne jamais rater votre puzzle ? Un petit rappel à 19 h, jamais plus.';
    const yes = document.createElement('button');
    yes.className = 'btn btn-plum';
    yes.style.cssText = 'width:100%;';
    yes.textContent = '🔔 Oui, rappelle-moi';
    yes.addEventListener('click', async () => {
        const ok = await scheduleDailyReminder();
        if (ok) { setStorage('orderix_notif', '1'); logEvent('notif_on', { source: 'premiere_victoire' }); }
        cta.remove();
        renderNotifToggle();
    });
    const later = document.createElement('button');
    later.style.cssText = 'margin-top:8px;background:none;color:var(--gris);font-weight:700;font-size:.78rem;';
    later.textContent = 'Plus tard';
    later.addEventListener('click', () => cta.remove());
    cta.append(txt, yes, later);
    resultPhrase.parentNode.insertBefore(cta, resultPhrase.nextSibling);
}

// ─── Défi par lien : ?day=N (&t=temps &ref=pseudo) ───────────────
// Le lien de partage ouvre directement le jour concerné, avec le temps
// à battre affiché dans l'intro. (Version web ; l'ouverture in-app
// Android nécessitera les App Links — noté au board.)
(function handleChallengeLink() {
    try {
        const q = new URLSearchParams(window.location.search);
        const dayId = parseInt(q.get('day'));
        if (!dayId) return;
        const day = DAYS.find(d => d.id === dayId);
        if (!day || day.empty) return;
        const t = parseFloat(q.get('t'));
        const ref = (q.get('ref') || '').slice(0, 15);
        setTimeout(() => {
            selectDay(day);
            const banner = document.getElementById('challenge-banner');
            if (t > 0) {
                banner.textContent = `⚔️ Défi${ref ? ' de ' + ref : ''} : battez ${t.toFixed(2).replace('.', ',')} s !`;
                banner.classList.remove('hidden');
            } else if (ref) {
                banner.textContent = `💌 ${ref} vous met au défi sur ce puzzle !`;
                banner.classList.remove('hidden');
            }
            logEvent('defi_ouvert', { jour: dayId, ref: ref, t: t || 0 });
        }, 400);
    } catch (e) { }
})();

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
    document.getElementById('comment-zone').classList.remove('hidden');
    renderCommentOutbox();
    retryPendingComments();
    leaderboardSection.classList.remove('hidden');
    if (feedbackValue !== 'none' && getPlayerName()) {
        dbMessage.textContent = 'Envoi de votre avis…';
        dbMessage.style.color = 'var(--ink-2)';
    }
    submitScore(pendingTimeVal, feedbackValue, true);
    fetchLeaderboard();
}

// ─── Commentaires de test → Claude, sans formulaire GitHub ───────
// L'issue est créée DIRECTEMENT via l'API GitHub (jeton « issues-only »
// injecté au build via config/orderix.staging.local.json, jamais commité).
// File d'attente locale : rien n'est jamais perdu, tout ce qui n'est pas
// parti est renvoyable en un tap et retenté automatiquement.
const GH_TOKEN = (typeof ORDERIX_ENV !== 'undefined' && ORDERIX_ENV.githubToken) || '';

function _loadComments() {
    try { return JSON.parse(getStorage('orderix_comments') || '[]') || []; } catch (e) { return []; }
}
function _saveComments(all) { setStorage('orderix_comments', JSON.stringify(all)); }

function _commentIssueUrl(title, body) {
    return 'https://github.com/Wael3rd/orderix/issues/new?labels=feedback&title=' +
        encodeURIComponent(title) + '&body=' + encodeURIComponent(body);
}

// Création silencieuse de l'issue via l'API. Résout true si c'est parti.
function sendCommentDirect(entry) {
    if (!GH_TOKEN) return Promise.resolve(false);
    return fetch('https://api.github.com/repos/Wael3rd/orderix/issues', {
        method: 'POST',
        headers: {
            'Authorization': 'Bearer ' + GH_TOKEN,
            'Accept': 'application/vnd.github+json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ title: entry.title, body: entry.body, labels: entry.labels || ['feedback'] })
    }).then(r => r.ok).catch(() => false);
}

function _markSent(id) {
    const all = _loadComments();
    const e = all.find(x => x.id === id);
    if (e) { e.sent = true; _saveComments(all); }
}

// Retente en arrière-plan tout ce qui n'est pas parti (réseau coupé, etc.)
function retryPendingComments() {
    if (!GH_TOKEN) return;
    _loadComments().filter(e => !e.sent).forEach(e => {
        sendCommentDirect(e).then(ok => { if (ok) { _markSent(e.id); renderCommentOutbox(); } });
    });
}

// ── Verdict : Validé / À modifier / Remplacer (choix unique) ─────
const VERDICTS = {
    valide: { texte: '✅ VALIDÉ', label: 'valide', titre: '[VALIDÉ]' },
    modifier: { texte: '🔧 À MODIFIER', label: 'a-modifier', titre: '[À MODIFIER]' },
    remplacer: { texte: '❌ REMPLACER PAR UN AUTRE GAMEPLAY', label: 'remplacer', titre: '[REMPLACER]' }
};
let selectedVerdict = null;

function renderVerdictChips() {
    document.querySelectorAll('#verdict-row .verdict-chip').forEach(b => {
        const on = b.dataset.verdict === selectedVerdict;
        const couleur = { valide: 'var(--vert)', modifier: 'var(--or)', remplacer: 'var(--rouge)' }[b.dataset.verdict];
        b.style.borderColor = on ? couleur : 'var(--ligne)';
        b.style.color = on ? couleur : 'var(--gris)';
        b.style.background = on ? 'var(--fond)' : 'var(--carte)';
    });
}
document.querySelectorAll('#verdict-row .verdict-chip').forEach(b => {
    b.addEventListener('click', () => {
        selectedVerdict = (selectedVerdict === b.dataset.verdict) ? null : b.dataset.verdict;
        haptic(8);
        renderVerdictChips();
    });
});

document.getElementById('comment-send').addEventListener('click', () => {
    const box = document.getElementById('comment-box');
    const status = document.getElementById('comment-status');
    const txt = box.value.trim();
    if (!selectedVerdict) {
        status.textContent = 'Choisissez d\'abord : Validé, À modifier ou Remplacer.';
        status.style.color = 'var(--rouge)';
        return;
    }
    if (!txt && selectedVerdict !== 'valide') {
        status.textContent = 'Dites en un mot quoi changer (commentaire obligatoire pour ce verdict).';
        status.style.color = 'var(--rouge)';
        return;
    }
    const verdict = VERDICTS[selectedVerdict];

    const day = currentDayConfig;
    const info = day ? getPlayedInfo(day.id) : null;
    const result = info
        ? (info.isWin ? `réussi en ${Math.abs(info.time).toFixed(3)} s` : (info.time === -999999 ? 'abandonné' : 'raté'))
        : '—';
    const title = `[feedback] Jour ${day ? day.id : '?'} — ${day ? GAME_MODES[day.modeId].name : 'général'} ${verdict.titre}`;
    const body = `**Mode** : ${day ? day.title : '—'} (\`${day ? day.modeId : ''}\` · type \`${day ? day.type : ''}\`)\n` +
        `**Résultat** : ${result}\n**Env** : ${ENV_NAME}\n**Verdict** : ${verdict.texte}\n\n**Commentaire** :\n${txt || '(aucun — verdict seul)'}\n\n` +
        `_Envoyé depuis l'app le ${new Date().toLocaleString('fr-FR')}_`;

    const entry = {
        id: Date.now(), date: new Date().toISOString(), day: day ? day.id : 0,
        modeId: day ? day.modeId : '', txt: txt || verdict.texte, result: result,
        title: title, body: body, labels: ['feedback', verdict.label], sent: false
    };
    const all = _loadComments();
    all.push(entry);
    _saveComments(all);
    box.value = '';
    selectedVerdict = null;
    renderVerdictChips();
    renderCommentOutbox();

    if (GH_TOKEN) {
        status.textContent = 'Envoi à Claude…';
        status.style.color = 'var(--gris)';
        sendCommentDirect(entry).then(ok => {
            if (ok) {
                _markSent(entry.id);
                status.textContent = '✓ Envoyé à Claude — merci !';
                status.style.color = 'var(--vert)';
                haptic([10, 30, 10]);
            } else {
                status.textContent = 'Réseau capricieux — gardé dans le filet de secours, renvoi automatique.';
                status.style.color = 'var(--rouge)';
            }
            renderCommentOutbox();
        });
    } else {
        // Repli sans jeton : formulaire GitHub pré-rempli (attention au brouillon)
        window.open(_commentIssueUrl(title, body), '_system');
        status.innerHTML = '<b style="color:var(--rouge)">Vérifiez sur GitHub que c\'est bien CE texte</b> — ' +
            'si un ancien commentaire s\'affiche, effacez-le d\'abord. Copie gardée ci-dessous.';
    }
});

// Filet de secours : les 5 derniers commentaires, état ✓/⏳, renvoi en un tap
function renderCommentOutbox() {
    const zone = document.getElementById('comment-outbox');
    const list = document.getElementById('comment-outbox-list');
    const all = _loadComments();
    if (!all.length) { zone.classList.add('hidden'); return; }
    zone.classList.remove('hidden');
    list.innerHTML = '';
    all.slice(-5).reverse().forEach(entry => {
        const row = document.createElement('div');
        row.style.cssText = 'display:flex;align-items:center;gap:8px;padding:7px 10px;margin-bottom:6px;' +
            'background:var(--fond);border-radius:10px;font-size:.8rem;';
        const state = document.createElement('span');
        state.style.cssText = 'flex-shrink:0;font-size:.9rem;';
        state.textContent = entry.sent ? '✅' : '⏳';
        const label = document.createElement('div');
        label.style.cssText = 'flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--gris);';
        label.innerHTML = `<b style="color:var(--encre)">J${entry.day}</b> · ${entry.txt}`;
        row.append(state, label);
        if (!entry.sent) {
            const resend = document.createElement('button');
            resend.style.cssText = 'flex-shrink:0;padding:6px 12px;border-radius:999px;background:var(--pale);' +
                'color:var(--bleu-fonce);font-weight:900;font-size:.75rem;';
            resend.textContent = '↻ Renvoyer';
            resend.addEventListener('click', () => {
                const t = entry.title || `[feedback] Jour ${entry.day} — commentaire`;
                const b = entry.body || `**Commentaire** :\n${entry.txt}\n\n_Renvoyé depuis le filet de secours_`;
                if (GH_TOKEN) {
                    sendCommentDirect({ title: t, body: b, labels: entry.labels }).then(ok => {
                        if (ok) { _markSent(entry.id); renderCommentOutbox(); haptic([10, 30, 10]); }
                    });
                } else {
                    window.open(_commentIssueUrl(t, b), '_system');
                }
            });
            row.appendChild(resend);
        }
        list.appendChild(row);
    });
}

// ─── Zone de test (staging uniquement) ───────────────────────────
if (ENV_NAME === 'staging') {
    document.getElementById('dev-zone').classList.remove('hidden');

    // Rejouer le jour courant : efface son résultat (local + cache serveur)
    // et rouvre l'écran d'introduction — rien n'est envoyé au serveur en staging.
    document.getElementById('replay-btn').classList.remove('hidden');
    document.getElementById('replay-btn').addEventListener('click', () => {
        if (!currentDayConfig) return;
        const day = currentDayConfig;
        delete localResults[day.id];
        setStorage('orderix_local_results', JSON.stringify(localResults));
        delete serverPlayedDays[day.id];
        pendingTimeVal = 0;
        selectDay(day);
    });
    document.getElementById('reset-progress-btn').addEventListener('click', () => {
        if (!confirm('Effacer toute la progression locale ? Toutes les cases redeviendront jouables.')) return;
        setStorage('orderix_local_results', '');
        setStorage('orderix_pending_game', '');
        localResults = {};
        serverPlayedDays = {};
        // La série et les médailles font partie de la progression ; les
        // badges « ! » de test, eux, survivent (registre séparé).
        streakData = { count: 0, lastDay: 0, freezes: 1, grantMonth: new Date().getFullYear() + '-' + new Date().getMonth(), frozenUsed: 0 };
        saveStreakData();
        buildProfile();
        alert('Progression effacée — le calendrier est vierge.');
    });
    // Simulation d'achat (staging uniquement) : packs, pass premium et
    // fonds boutique — pour tout tester avant l'intégration Play Billing
    document.getElementById('packs-btn').addEventListener('click', () => {
        const on = hasPack('pack-aurore');
        setStorage('orderix_packs', on ? '' : 'pack-aurore,pack-foret,pass-premium,fond-petales,fond-aquarelle');
        logEvent(on ? 'packs_test_off' : 'packs_test_on');
        renderCosmetics();
        alert(on ? 'Achats retirés.' : 'Tout débloqué (simulation) : packs, Pass Premium, fonds exclusifs.');
    });

    // Visionneuse du journal analytics local (les 40 derniers)
    document.getElementById('events-btn').addEventListener('click', () => {
        const list = document.getElementById('events-list');
        if (!list.classList.contains('hidden')) { list.classList.add('hidden'); return; }
        const evts = getEvents().slice(-40).reverse();
        list.textContent = evts.length
            ? evts.map(e => `${e.t.slice(5, 16).replace('T', ' ')} · ${e.n} ${JSON.stringify(e.p)}`).join('\n')
            : 'Aucun événement enregistré.';
        list.classList.remove('hidden');
    });
}

// ─── Confort mobile ──────────────────────────────────────────────
// Le mode « Pression Longue » déclencherait le menu contextuel Android
document.addEventListener('contextmenu', (e) => {
    if (gameInProgress) e.preventDefault();
});
