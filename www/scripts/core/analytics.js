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
