// ─── Analytics locaux (Epic mesure) ──────────────────────────────
// Journal d'événements 100 % local pour l'instant : rien ne quitte le
// téléphone. Quand le backend (Supabase) sera branché, ce journal sera
// synchronisé par lots pour construire les cohortes D1/D7/D30.
// Format : { t: ISO, n: nom, p: propriétés } · plafonné aux 600 derniers.

const ANALYTICS_KEY = 'orderix_events';
const ANALYTICS_MAX = 600;

function logEvent(nom, props) {
    try {
        let all = [];
        try { all = JSON.parse(getStorage(ANALYTICS_KEY) || '[]') || []; } catch (e) { }
        all.push({ t: new Date().toISOString(), n: nom, p: props || {} });
        if (all.length > ANALYTICS_MAX) all = all.slice(all.length - ANALYTICS_MAX);
        setStorage(ANALYTICS_KEY, JSON.stringify(all));
    } catch (e) { /* l'analytics ne doit jamais casser le jeu */ }
}

function getEvents() {
    try { return JSON.parse(getStorage(ANALYTICS_KEY) || '[]') || []; } catch (e) { return []; }
}

// Une session = un chargement de l'app
logEvent('session_start', { env: ENV_NAME, jour: todayDayId() });

// Crash reporting léger : toute erreur JS non rattrapée est journalisée
// (plafonné pour qu'une boucle d'erreurs ne noie pas le journal)
let _errCount = 0;
window.addEventListener('error', (e) => {
    if (_errCount++ >= 20) return;
    logEvent('js_error', {
        msg: String(e.message || '').slice(0, 200),
        src: String(e.filename || '').split('/').pop(),
        ligne: e.lineno || 0
    });
});
window.addEventListener('unhandledrejection', (e) => {
    if (_errCount++ >= 20) return;
    logEvent('js_promesse_rejetee', { msg: String(e.reason && e.reason.message || e.reason || '').slice(0, 200) });
});
