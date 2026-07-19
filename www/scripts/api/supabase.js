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

// ── Classement (lecture publique, aucune session requise) ────────
function sbLeaderboard(dayId, itemCount, limit) {
    if (!SB_ENABLED) return Promise.resolve(null);
    return sbRpc('get_leaderboard', {
        p_year: new Date().getFullYear(), p_day: dayId,
        p_item_count: itemCount, p_limit: limit || 10
    }, false).then(rows => (rows || []).map(x => ({ name: x.pseudo, time: x.time_ms / 1000 })))
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

// ── RGPD : export de ses données (art. 20) ───────────────────────
function sbExportMyData() {
    if (!SB_ENABLED) return Promise.resolve(null);
    return sbRpc('export_my_data', {}, true).catch(() => null);
}
