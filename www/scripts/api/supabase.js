// ─── Client Supabase minimal (fetch pur, sans SDK ni bundler) ────
// Auth ANONYME device-first : un compte invisible est créé au premier
// envoi de score, aucune donnée personnelle. Le pseudo (optionnel) est
// la seule information publique. Les gardes-fous (1 tentative/jour,
// temps plausibles) vivent côté base dans les fonctions SQL.
// Si les clés ne sont pas configurées, tout ce module est inerte.

const SB_ENABLED = !!(SUPABASE_URL && SUPABASE_ANON_KEY);
let sbSession = null; // { access_token, refresh_token, expires_at, user_id }

function sbLoadSession() {
    try { sbSession = JSON.parse(getStorage('orderix_sb_session') || 'null'); } catch (e) { sbSession = null; }
}

function sbSaveSession() {
    setStorage('orderix_sb_session', sbSession ? JSON.stringify(sbSession) : '');
}

function _sbHeaders(withAuth) {
    const h = { 'apikey': SUPABASE_ANON_KEY, 'Content-Type': 'application/json' };
    if (withAuth && sbSession) h['Authorization'] = 'Bearer ' + sbSession.access_token;
    else h['Authorization'] = 'Bearer ' + SUPABASE_ANON_KEY;
    return h;
}

function _sbStoreTokens(data) {
    if (!data || !data.access_token) return false;
    sbSession = {
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        expires_at: Math.floor(Date.now() / 1000) + (data.expires_in || 3600),
        user_id: (data.user && data.user.id) || (sbSession && sbSession.user_id) || null
    };
    sbSaveSession();
    return true;
}

// Session valide : réutilise, rafraîchit, ou crée un compte anonyme
async function sbEnsureSession() {
    if (!SB_ENABLED) return null;
    if (!sbSession) sbLoadSession();
    const now = Math.floor(Date.now() / 1000);
    if (sbSession && sbSession.expires_at - 90 > now) return sbSession;

    if (sbSession && sbSession.refresh_token) {
        try {
            const r = await fetch(SUPABASE_URL + '/auth/v1/token?grant_type=refresh_token', {
                method: 'POST', headers: _sbHeaders(false),
                body: JSON.stringify({ refresh_token: sbSession.refresh_token })
            });
            if (r.ok && _sbStoreTokens(await r.json())) return sbSession;
        } catch (e) { }
    }

    // Création anonyme (nécessite « Allow anonymous sign-ins » côté projet)
    try {
        const r = await fetch(SUPABASE_URL + '/auth/v1/signup', {
            method: 'POST', headers: _sbHeaders(false), body: '{}'
        });
        const data = await r.json();
        if (r.ok && _sbStoreTokens(data)) {
            if (typeof logEvent === 'function') logEvent('sb_compte_anonyme');
            return sbSession;
        }
        if (typeof logEvent === 'function') logEvent('sb_auth_echec', { code: r.status, msg: (data && data.msg) || (data && data.error_description) || '' });
    } catch (e) { }
    return null;
}

async function sbRpc(nom, args, withAuth) {
    if (!SB_ENABLED) return null;
    if (withAuth && !(await sbEnsureSession())) return null;
    const r = await fetch(SUPABASE_URL + '/rest/v1/rpc/' + nom, {
        method: 'POST', headers: _sbHeaders(withAuth), body: JSON.stringify(args || {})
    });
    if (!r.ok) {
        let msg = '';
        try { msg = (await r.json()).message || ''; } catch (e) { }
        throw new Error('rpc ' + nom + ' → ' + r.status + (msg ? ' · ' + msg : ''));
    }
    const txt = await r.text();
    return txt ? JSON.parse(txt) : null;
}

// ── Scores ───────────────────────────────────────────────────────
// timeVal : secondes, négatif = raté, -999999 = abandon (convention GAS)
function sbSubmitScore(timeVal, itemCount, dayId) {
    if (!SB_ENABLED) return Promise.resolve(false);
    const t = parseFloat(timeVal);
    const status = t >= 0 ? 'win' : (t === -999999 ? 'abandon' : 'fail');
    const timeMs = status === 'abandon' ? 0 : Math.round(Math.abs(t) * 1000);
    return sbRpc('submit_score', {
        p_year: new Date().getFullYear(), p_day: dayId,
        p_status: status, p_time_ms: timeMs, p_item_count: itemCount
    }, true).then(() => true).catch(err => {
        // « duplicate key » = seconde tentative : silencieux (rejeu de test)
        if (typeof logEvent === 'function' && String(err).indexOf('duplicate') === -1) {
            logEvent('sb_submit_echec', { msg: String(err).slice(0, 120) });
        }
        return false;
    });
}

function sbSetFeedback(dayId, feedback, shared) {
    if (!SB_ENABLED) return Promise.resolve(false);
    return sbRpc('set_feedback', {
        p_year: new Date().getFullYear(), p_day: dayId,
        p_feedback: feedback || null, p_shared: !!shared
    }, true).then(() => true).catch(() => false);
}

// ── Classement : tout le monde apparaît (« Invitée-xxxx » sans
// pseudo) ; appelé avec la session pour marquer SA propre ligne ──────
function sbLeaderboard(dayId, itemCount, limit) {
    if (!SB_ENABLED) return Promise.resolve(null);
    const appel = (auth) => sbRpc('get_leaderboard', {
        p_year: new Date().getFullYear(), p_day: dayId,
        p_item_count: itemCount, p_limit: limit || 10
    }, auth);
    return appel(true).catch(() => appel(false))
        .then(rows => (rows || []).map(x => ({ name: x.pseudo, time: x.time_ms / 1000, isMe: !!x.is_me })))
        .catch(() => null);
}

// ── Pseudo (profil public) ───────────────────────────────────────
// Résout 'ok' | 'pris' | 'erreur'
async function sbClaimPseudo(name) {
    if (!SB_ENABLED) return 'ok';
    const s = await sbEnsureSession();
    if (!s) return 'erreur';
    try {
        const r = await fetch(SUPABASE_URL + '/rest/v1/profiles?on_conflict=id', {
            method: 'POST',
            headers: Object.assign(_sbHeaders(true), { 'Prefer': 'resolution=merge-duplicates,return=minimal' }),
            body: JSON.stringify({ id: s.user_id, pseudo: name })
        });
        if (r.ok) return 'ok';
        if (r.status === 409) return 'pris'; // unicité du pseudo (citext)
        return 'erreur';
    } catch (e) { return 'erreur'; }
}

// ── Sauvegarde de compte : e-mail sans mot de passe ──────────────
// Lier un e-mail rend le compte anonyme PERMANENT : sur un nouveau
// téléphone, un code à 6 chiffres reçu par e-mail restaure tout
// (pseudo, scores, ligue, achats). Aucun mot de passe, jamais.

// État réel du compte auth : { email, confirme } ou null
async function sbGetUser() {
    if (!SB_ENABLED) return null;
    const s = await sbEnsureSession();
    if (!s) return null;
    try {
        const r = await fetch(SUPABASE_URL + '/auth/v1/user', { headers: _sbHeaders(true) });
        if (!r.ok) return null;
        const d = await r.json();
        return {
            email: d.email || (d.new_email || ''),
            confirme: !!d.email_confirmed_at,
            enAttente: !!d.new_email
        };
    } catch (e) { return null; }
}

// Attache un e-mail au compte anonyme courant (envoie un lien de
// confirmation). Résout 'ok' | 'pris' | 'erreur'.
async function sbAttachEmail(email) {
    if (!SB_ENABLED) return 'erreur';
    const s = await sbEnsureSession();
    if (!s) return 'erreur';
    try {
        // redirect_to = deep link : le clic sur le lien du mail ROUVRE
        // l'application (nécessite orderix://auth-callback dans les
        // Redirect URLs du projet Supabase)
        const r = await fetch(SUPABASE_URL + '/auth/v1/user?redirect_to=' +
            encodeURIComponent(SB_OAUTH_REDIRECT), {
            method: 'PUT', headers: _sbHeaders(true),
            body: JSON.stringify({ email: email })
        });
        const d = await r.json();
        if (r.ok) { logEvent('email_lie'); return 'ok'; }
        const msg = (d && (d.msg || d.error_description || d.message) || '').toLowerCase();
        return msg.indexOf('already') !== -1 ? 'pris' : 'erreur';
    } catch (e) { return 'erreur'; }
}

// Étape 1 de la récupération : envoie le code à 6 chiffres
async function sbSendRecoveryCode(email) {
    if (!SB_ENABLED) return false;
    try {
        const r = await fetch(SUPABASE_URL + '/auth/v1/otp', {
            method: 'POST', headers: _sbHeaders(false),
            body: JSON.stringify({ email: email, create_user: false })
        });
        return r.ok;
    } catch (e) { return false; }
}

// Étape 2 : vérifie le code → bascule la session sur l'ancien compte,
// puis restaure pseudo + résultats serveur dans la progression locale
async function sbRecoverWithCode(email, code) {
    if (!SB_ENABLED) return false;
    try {
        const r = await fetch(SUPABASE_URL + '/auth/v1/verify', {
            method: 'POST', headers: _sbHeaders(false),
            body: JSON.stringify({ type: 'email', email: email, token: code })
        });
        const d = await r.json();
        if (!r.ok || !_sbStoreTokens(d)) return false;
        logEvent('compte_recupere');

        // Restauration : pseudo public + résultats de l'année
        const data = await sbExportMyData();
        if (data && data.profile && data.profile.pseudo) {
            setStorage('orderix_player_name', data.profile.pseudo);
        }
        if (data && Array.isArray(data.results)) {
            const annee = new Date().getFullYear();
            data.results.forEach(res => {
                if (res.year !== annee || localResults[res.day]) return;
                const t = res.status === 'win' ? res.time_ms / 1000
                    : (res.status === 'abandon' ? -999999 : -res.time_ms / 1000);
                const dCreation = new Date(res.created_at);
                localResults[res.day] = {
                    count: res.item_count, time: t, isWin: res.status === 'win',
                    rev: 0, late: true, stars: res.status === 'win' ? 1 : 0,
                    saison: dCreation.getFullYear() + '-' + (dCreation.getMonth() + 1)
                };
            });
            setStorage('orderix_local_results', JSON.stringify(localResults));
        }
        return true;
    } catch (e) { return false; }
}

// ── Connexions sociales (Google / Facebook / Apple via Supabase) ─
// Flux navigateur système + retour par deep link orderix://auth-callback.
// Chaque fournisseur doit être configuré dans le dashboard Supabase
// (identifiants créés par le propriétaire) — sinon le bouton explique.
const SB_OAUTH_REDIRECT = 'orderix://auth-callback';

async function sbOAuthLogin(provider) {
    if (!SB_ENABLED) return false;
    const url = SUPABASE_URL + '/auth/v1/authorize?provider=' + provider +
        '&redirect_to=' + encodeURIComponent(SB_OAUTH_REDIRECT);
    const plug = window.Capacitor && window.Capacitor.Plugins;
    logEvent('oauth_ouvert', { provider: provider });
    if (plug && plug.Browser) {
        await plug.Browser.open({ url: url, presentationStyle: 'popover' });
        return true;
    }
    // Repli web (test navigateur) : même URL dans un nouvel onglet
    window.open(url, '_blank');
    return true;
}

// Retour du deep link : récupère les jetons du fragment d'URL, bascule
// la session et restaure les données du compte (comme la récupération)
async function sbHandleOAuthCallback(rawUrl) {
    try {
        const frag = String(rawUrl).split('#')[1] || '';
        const p = new URLSearchParams(frag);
        const access = p.get('access_token'), refresh = p.get('refresh_token');
        if (p.get('error_description')) {
            logEvent('oauth_erreur', { msg: p.get('error_description').slice(0, 120) });
            return { ok: false, msg: p.get('error_description') };
        }
        if (!access) return { ok: false, msg: 'jetons absents' };
        _sbStoreTokens({
            access_token: access, refresh_token: refresh,
            expires_in: parseInt(p.get('expires_in')) || 3600,
            user: { id: (JSON.parse(atob(access.split('.')[1])) || {}).sub }
        });
        logEvent('oauth_connecte');
        // Restauration des données du compte connecté
        const data = await sbExportMyData();
        if (data && data.profile && data.profile.pseudo) {
            setStorage('orderix_player_name', data.profile.pseudo);
        }
        if (data && Array.isArray(data.results)) {
            const annee = new Date().getFullYear();
            data.results.forEach(res => {
                if (res.year !== annee || localResults[res.day]) return;
                const t = res.status === 'win' ? res.time_ms / 1000
                    : (res.status === 'abandon' ? -999999 : -res.time_ms / 1000);
                const dC = new Date(res.created_at);
                localResults[res.day] = {
                    count: res.item_count, time: t, isWin: res.status === 'win',
                    rev: 0, late: true, stars: res.status === 'win' ? 1 : 0,
                    saison: dC.getFullYear() + '-' + (dC.getMonth() + 1)
                };
            });
            setStorage('orderix_local_results', JSON.stringify(localResults));
        }
        return { ok: true };
    } catch (e) { return { ok: false, msg: String(e).slice(0, 120) }; }
}

// ── RGPD : export de ses données (art. 20) ───────────────────────
function sbExportMyData() {
    if (!SB_ENABLED) return Promise.resolve(null);
    return sbRpc('export_my_data', {}, true).catch(() => null);
}

// ── RGPD : suppression de compte (art. 17) — irréversible ────────
function sbDeleteMyAccount() {
    if (!SB_ENABLED) return Promise.resolve(false);
    return sbRpc('delete_my_account', {}, true).then(() => {
        sbSession = null;
        sbSaveSession();
        if (typeof logEvent === 'function') logEvent('sb_compte_supprime');
        return true;
    }).catch(() => false);
}

// ── Ligue hebdomadaire ───────────────────────────────────────────
function sbJoinLeague() {
    if (!SB_ENABLED) return Promise.resolve(null);
    return sbRpc('join_league', {}, true).catch(() => null);
}

// Renvoie [{pseudo, wins, total_time_ms, is_me}] ou null
function sbGetLeague() {
    if (!SB_ENABLED) return Promise.resolve(null);
    return sbRpc('get_league', {}, true).catch(() => null);
}

// ── Groupes d'amies ──────────────────────────────────────────────
function sbCreateFriendGroup(name) {
    if (!SB_ENABLED) return Promise.resolve(null);
    return sbRpc('create_friend_group', { p_name: name }, true).catch(() => null);
}

// Résout {code, name} ou une chaîne d'erreur lisible
function sbJoinFriendGroup(code) {
    if (!SB_ENABLED) return Promise.resolve(null);
    return sbRpc('join_friend_group', { p_code: code }, true).catch(err => {
        const m = String(err);
        if (m.indexOf('code inconnu') !== -1) return 'inconnu';
        if (m.indexOf('groupe complet') !== -1) return 'complet';
        return null;
    });
}

function sbLeaveFriendGroup(code) {
    if (!SB_ENABLED) return Promise.resolve(false);
    return sbRpc('leave_friend_group', { p_code: code }, true).then(() => true).catch(() => false);
}

// Renvoie [{code, name, pseudo, wins, total_time_ms, is_me}] ou null
function sbFriendBoards() {
    if (!SB_ENABLED) return Promise.resolve(null);
    return sbRpc('get_friend_boards', {}, true).catch(() => null);
}

// ── Synchronisation du journal analytics (par lots de 100) ───────
function sbFlushEvents() {
    if (!SB_ENABLED || typeof getEvents !== 'function') return Promise.resolve(0);
    const all = getEvents();
    const synced = parseInt(getStorage('orderix_events_synced') || '0') || 0;
    if (all.length <= synced) return Promise.resolve(0);
    // Le journal local est plafonné (rotation) : si le pointeur dépasse, on repart
    const start = synced > all.length ? 0 : synced;
    const lot = all.slice(start, start + 100);
    return sbRpc('log_events', { p_events: lot }, true).then(n => {
        setStorage('orderix_events_synced', String(start + lot.length));
        return n || lot.length;
    }).catch(() => 0);
}
