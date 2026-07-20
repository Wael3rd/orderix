// ─── Cosmétiques : thèmes de couleurs et avatars, débloqués par niveau ─
// Progression 100 % parure : rien qui change le gameplay. Le niveau =
// 1 + réussites/10 (voir computeStats). Sélection persistée localement.

const THEMES = [
    { id: 'ocean', nom: 'Océan', niveau: 1, bleu: '#4A6CFA', fonce: '#3553D1', pale: '#EEF2FF', bord: '#D6DEFC' },
    { id: 'emeraude', nom: 'Émeraude', niveau: 2, bleu: '#16A47C', fonce: '#0E7E5F', pale: '#E5F7F1', bord: '#C6EDE0' },
    { id: 'corail', nom: 'Corail', niveau: 3, bleu: '#F26B5E', fonce: '#D14C40', pale: '#FEEDEA', bord: '#FBD4CE' },
    { id: 'amethyste', nom: 'Améthyste', niveau: 5, bleu: '#8B5CF6', fonce: '#6D3FD4', pale: '#F2ECFE', bord: '#E0D2FB' },
    { id: 'rose', nom: 'Rose Poudré', niveau: 8, bleu: '#E754A6', fonce: '#C43A88', pale: '#FDECF5', bord: '#F9CFE6' },
    { id: 'minuit', nom: 'Minuit', niveau: 12, bleu: '#3B4B8C', fonce: '#2A3768', pale: '#EAEDF7', bord: '#CDD4EC' },
    // Packs premium (monétisation douce : parure uniquement, 2,99 €)
    { id: 'aurore', nom: 'Aurore', premium: 'pack-aurore', bleu: '#D96C57', fonce: '#B8503D', pale: '#FBEDE9', bord: '#F3CFC6' },
    { id: 'foret', nom: 'Forêt', premium: 'pack-foret', bleu: '#2E7D5B', fonce: '#1F5C42', pale: '#E9F4EE', bord: '#CBE5D7' }
];

// ─── Arrière-plans (fonds d'écran de l'app) ──────────────────────
// Trois familles : progression (niveau), Carnet de Saison (gratuit ou
// premium), et boutique (exclusifs, uniquement achetables).
const BACKGROUNDS = [
    { id: 'lin', nom: 'Lin', niveau: 1, css: '#F4F6FA' },
    { id: 'aube', nom: 'Aube', niveau: 4, css: 'linear-gradient(180deg,#FDF0E8 0%,#F4F6FA 45%)' },
    { id: 'brume', nom: 'Brume', niveau: 7, css: 'linear-gradient(180deg,#EAF0FB 0%,#F4F6FA 50%)' },
    { id: 'jardin', nom: 'Jardin', pass: { tier: 2, piste: 'gratuit' }, css: 'linear-gradient(180deg,#E9F6EC 0%,#F4F6FA 55%)' },
    { id: 'constellation', nom: 'Constellation', pass: { tier: 1, piste: 'premium' }, css: 'radial-gradient(circle at 20% 10%, #E4E9FB 1.5px, transparent 2px), radial-gradient(circle at 70% 30%, #E4E9FB 1.5px, transparent 2px), linear-gradient(180deg,#EDF0FC 0%,#F4F6FA 60%)' },
    { id: 'opale', nom: 'Opale', pass: { tier: 4, piste: 'premium' }, css: 'linear-gradient(135deg,#FDEFF2 0%,#EEF3FD 50%,#EDFAF3 100%)' },
    { id: 'petales', nom: 'Pétales', boutique: 'fond-petales', prix: '1,99 €', css: 'radial-gradient(circle at 85% 15%, #FBE3EE 0%, transparent 40%), linear-gradient(180deg,#FDF1F6 0%,#F4F6FA 60%)' },
    { id: 'aquarelle', nom: 'Aquarelle', boutique: 'fond-aquarelle', prix: '1,99 €', css: 'linear-gradient(120deg,#FDF3E7 0%,#F3EEFB 45%,#EAF5F1 100%)' }
];

function currentBackground() {
    const id = getStorage('orderix_bg') || 'lin';
    return BACKGROUNDS.find(b => b.id === id) || BACKGROUNDS[0];
}

function applyBackground() {
    // En sombre, les fonds d'écran clairs sont neutralisés : le body suit
    // --fond (sombre). L'habillage cosmétique reprend en clair.
    if (typeof isDark === 'function' && isDark()) {
        document.body.style.background = 'var(--fond)';
        document.body.style.backgroundAttachment = 'fixed';
        return;
    }
    const b = currentBackground();
    document.body.style.background = b.css;
    document.body.style.backgroundAttachment = 'fixed';
}

// ─── Thème sombre (gratuit, phase F) ─────────────────────────────
// Préférence : 'on' | 'off' | absente (= suit le réglage système).
function isDark() {
    const p = getStorage('orderix_dark');
    if (p === 'on') return true;
    if (p === 'off') return false;
    return !!(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
}

function applyDarkMode() {
    const dark = isDark();
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
    applyTheme();       // ré-accorde l'accent (pale/bord) au mode
    applyBackground();  // repeint le body (fond clair ou --fond sombre)
}

// Bascule explicite depuis les Réglages (fige le choix, coupe le suivi système)
function toggleDark() {
    setStorage('orderix_dark', isDark() ? 'off' : 'on');
    applyDarkMode();
    if (typeof haptic === 'function') haptic(8);
}

function backgroundUnlocked(b) {
    if (b.boutique) return hasPack(b.boutique);
    if (b.pass) return passTierReached(b.pass.tier) && (b.pass.piste === 'gratuit' || hasPack('pass-premium'));
    return playerLevel() >= b.niveau;
}

function selectBackground(id) {
    const b = BACKGROUNDS.find(x => x.id === id);
    if (!b) return;
    if (!backgroundUnlocked(b)) {
        if (b.boutique || (b.pass && b.pass.piste === 'premium')) _boutiqueMessage();
        return;
    }
    setStorage('orderix_bg', id);
    applyBackground();
    haptic(8);
    renderCosmetics();
}

// ─── Le Carnet de Saison (battle pass mensuel, tout en douceur) ──
// Saison = mois calendaire (aligné sur l'album). Progression = étoiles
// gagnées ce mois-ci (les rattrapages comptent). Deux pistes : gratuite
// pour toutes, premium (achat unique 4,99 €/saison) pour les exclusifs.
const PASS_TIERS = [
    { etoiles: 3, gratuit: { type: 'gel', ico: 'gel', lbl: '1 gel' }, premium: { type: 'fond', id: 'constellation', ico: 'etoile', lbl: 'Fond Constellation' } },
    { etoiles: 6, gratuit: { type: 'fond', id: 'jardin', ico: 'herbe', lbl: 'Fond Jardin' }, premium: { type: 'avatar', id: '🌺', lbl: 'Avatar 🌺' } },
    { etoiles: 10, gratuit: { type: 'avatar', id: '🍵', lbl: 'Avatar 🍵' }, premium: { type: 'avatar', id: '🕊️', lbl: 'Avatar 🕊️' } },
    { etoiles: 14, gratuit: { type: 'gel', ico: 'gel', lbl: '1 gel' }, premium: { type: 'fond', id: 'opale', ico: 'gemme', lbl: 'Fond Opale' } },
    { etoiles: 19, gratuit: { type: 'avatar', id: '🧶', lbl: 'Avatar 🧶' }, premium: { type: 'avatar', id: '👑', lbl: 'Avatar 👑' } },
    { etoiles: 24, gratuit: { type: 'gel', ico: 'gel', lbl: '1 gel' }, premium: { type: 'avatar', id: '✨', lbl: 'Avatar ✨' } }
];

function seasonKey() {
    const n = new Date();
    return n.getFullYear() + '-' + (n.getMonth() + 1);
}

// Étoiles gagnées pendant la saison (mois réel) en cours
function seasonStars() {
    const key = seasonKey();
    let total = 0;
    Object.keys(localResults).forEach(id => {
        const r = localResults[id];
        if (r && r.isWin && r.saison === key) total += r.stars || 1;
    });
    return total;
}

function passTierReached(tierIdx) {
    return seasonStars() >= PASS_TIERS[Math.max(0, tierIdx - 1)].etoiles;
}

// Récompenses « gel » : créditées une seule fois par palier et par saison
function claimPassRewards() {
    let claim = null;
    try { claim = JSON.parse(getStorage('orderix_pass_claim') || 'null'); } catch (e) { }
    if (!claim || claim.saison !== seasonKey()) claim = { saison: seasonKey(), tiers: [] };
    const stars = seasonStars();
    let nouveaux = 0;
    PASS_TIERS.forEach((t, i) => {
        if (stars < t.etoiles || claim.tiers.indexOf(i) !== -1) return;
        claim.tiers.push(i);
        nouveaux++;
        if (t.gratuit.type === 'gel') {
            streakData.freezes = Math.min(GELS_MAX, streakData.freezes + 1);
            saveStreakData();
        }
        if (typeof logEvent === 'function') logEvent('pass_palier', { palier: i + 1, premium: hasPack('pass-premium') });
    });
    if (nouveaux) setStorage('orderix_pass_claim', JSON.stringify(claim));
    return nouveaux;
}

// ─── Pastille Boutique : palier de Carnet atteint mais pas encore vu ──
// « Atteint » = étoiles de la saison ≥ seuil. « Vu » = mémorisé lors de
// la dernière visite de la Boutique. La pastille s'efface donc à la visite.
function passReachedCount() {
    const stars = seasonStars();
    return PASS_TIERS.filter(t => stars >= t.etoiles).length;
}
function passSeenCount() {
    try {
        const s = JSON.parse(getStorage('orderix_pass_seen') || 'null');
        if (s && s.saison === seasonKey()) return s.n || 0;
    } catch (e) { }
    return 0;
}
function passClaimable() { return passReachedCount() > passSeenCount(); }
function markPassSeen() {
    setStorage('orderix_pass_seen', JSON.stringify({ saison: seasonKey(), n: passReachedCount() }));
}

// Droits premium (au lancement : Google Play Billing ; en attendant,
// la zone de test permet de les simuler)
function hasPack(id) {
    return ((getStorage('orderix_packs') || '').split(',').indexOf(id) !== -1);
}
function themeUnlocked(t) {
    if (t.premium) return hasPack(t.premium);
    return playerLevel() >= t.niveau;
}

const AVATARS = [
    { e: '☺', niveau: 1 }, { e: '🦊', niveau: 2 }, { e: '🐱', niveau: 3 },
    { e: '🦉', niveau: 4 }, { e: '🌸', niveau: 5 }, { e: '🐝', niveau: 6 },
    { e: '🌙', niveau: 7 }, { e: '🍀', niveau: 8 }, { e: '🦋', niveau: 9 },
    { e: '⭐', niveau: 10 }, { e: '🌷', niveau: 11 }, { e: '🧠', niveau: 12 },
    // Avatar de bienvenue : réservé aux joueuses arrivées par un lien
    // d'invitation (?ref=) — le cadeau de la marraine
    { e: '🎁', niveau: 1, parrainage: true },
    // Avatars des packs premium
    { e: '🦩', premium: 'pack-aurore' }, { e: '🌅', premium: 'pack-aurore' },
    { e: '🦚', premium: 'pack-foret' }, { e: '🌲', premium: 'pack-foret' },
    // Avatars du Carnet de Saison (piste gratuite / premium)
    { e: '🍵', pass: { tier: 3, piste: 'gratuit' } }, { e: '🧶', pass: { tier: 5, piste: 'gratuit' } },
    { e: '🌺', pass: { tier: 2, piste: 'premium' } }, { e: '🕊️', pass: { tier: 3, piste: 'premium' } },
    { e: '👑', pass: { tier: 5, piste: 'premium' } }, { e: '✨', pass: { tier: 6, piste: 'premium' } }
];

function playerLevel() {
    // Le niveau monte aux ÉTOILES (doublées le week-end) : 10 étoiles = 1 niveau
    return 1 + Math.floor(computeStats().stars / 10);
}

function currentTheme() {
    const id = getStorage('orderix_theme') || 'ocean';
    return THEMES.find(t => t.id === id) || THEMES[0];
}

function currentAvatar() {
    return getStorage('orderix_avatar') || '';
}

// Applique le thème choisi aux variables CSS globales
function applyTheme() {
    const t = currentTheme();
    const r = document.documentElement.style;
    r.setProperty('--bleu', t.bleu);
    r.setProperty('--bleu-fonce', t.fonce);
    // Le pale/bord clair de l'accent devient un slate sombre en mode nuit
    // (les fines teintes claires de l'accent sont illisibles sur --fond sombre).
    if (document.documentElement.getAttribute('data-theme') === 'dark') {
        r.setProperty('--bleu-pale', '#242A3A');
        r.setProperty('--bleu-bord', '#333B52');
    } else {
        r.setProperty('--bleu-pale', t.pale);
        r.setProperty('--bleu-bord', t.bord);
    }
}

function _boutiqueMessage() {
    const st = document.getElementById('cosmetics-status');
    if (!st) return;
    st.textContent = '💎 Les packs Aurore et Forêt (2,99 € pièce : thème + 2 avatars) arriveront avec la version Play Store — que de la beauté, jamais d\'avantage en jeu.';
    haptic(8);
}

function selectTheme(id) {
    const t = THEMES.find(x => x.id === id);
    if (!t) return;
    if (!themeUnlocked(t)) {
        if (t.premium) _boutiqueMessage();
        return;
    }
    setStorage('orderix_theme', id);
    applyTheme();
    haptic(8);
    renderCosmetics();
}

function avatarUnlocked(a) {
    if (a.parrainage) return getStorage('orderix_referred') === '1';
    if (a.premium) return hasPack(a.premium);
    if (a.pass) return passTierReached(a.pass.tier) && (a.pass.piste === 'gratuit' || hasPack('pass-premium'));
    return playerLevel() >= a.niveau;
}

function selectAvatar(e) {
    const a = AVATARS.find(x => x.e === e);
    if (!a) return;
    if (!avatarUnlocked(a)) {
        if (a.premium) _boutiqueMessage();
        return;
    }
    setStorage('orderix_avatar', e);
    haptic(8);
    renderCosmetics();
}

// Vitrine sur le profil : pastilles de thèmes + grille d'avatars
function renderCosmetics() {
    const zone = document.getElementById('cosmetics-zone');
    if (!zone) return;
    const niveau = playerLevel();
    const themeActif = currentTheme().id;
    const avatarActif = currentAvatar();
    zone.innerHTML = '';

    const lblT = document.createElement('div');
    lblT.style.cssText = 'font-size:.72rem;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:var(--gris);margin-bottom:8px;';
    lblT.textContent = 'Thème de couleurs';
    zone.appendChild(lblT);

    const rowT = document.createElement('div');
    rowT.style.cssText = 'display:flex;gap:10px;flex-wrap:wrap;margin-bottom:16px;';
    THEMES.forEach(t => {
        const ok = themeUnlocked(t);
        const b = document.createElement('button');
        b.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:4px;background:none;padding:0;' +
            (ok ? '' : 'opacity:.45;');
        const sw = document.createElement('div');
        sw.style.cssText = `width:44px;height:44px;border-radius:50%;background:${t.bleu};position:relative;` +
            `box-shadow:inset 0 -4px 0 rgba(0,0,0,.15);` +
            (t.id === themeActif ? `outline:3px solid var(--encre);outline-offset:2px;` : '');
        if (!ok) {
            const lock = document.createElement('span');
            lock.style.cssText = 'position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:1rem;';
            lock.innerHTML = t.premium ? imgIc('gemme') : imgIc('cadenas');
            sw.appendChild(lock);
        }
        const nm = document.createElement('span');
        nm.style.cssText = 'font-size:.6rem;font-weight:800;color:var(--gris);';
        nm.innerHTML = ok ? t.nom : (t.premium ? t.nom + ' ' + imgIc('gemme') : 'niv. ' + t.niveau);
        b.append(sw, nm);
        b.addEventListener('click', () => selectTheme(t.id));
        rowT.appendChild(b);
    });
    zone.appendChild(rowT);

    const lblA = document.createElement('div');
    lblA.style.cssText = 'font-size:.72rem;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:var(--gris);margin-bottom:8px;';
    lblA.textContent = 'Avatar';
    zone.appendChild(lblA);

    const rowA = document.createElement('div');
    rowA.style.cssText = 'display:grid;grid-template-columns:repeat(6,1fr);gap:8px;';
    AVATARS.forEach(a => {
        const ok = avatarUnlocked(a);
        const b = document.createElement('button');
        b.style.cssText = 'aspect-ratio:1;border-radius:14px;background:var(--fond);font-size:1.35rem;' +
            'display:flex;align-items:center;justify-content:center;position:relative;' +
            (a.e === avatarActif ? 'outline:3px solid var(--bleu);outline-offset:-2px;background:var(--bleu-pale);' : '') +
            (ok ? '' : 'opacity:.4;');
        if (ok) b.textContent = a.e; else b.innerHTML = imgIc('cadenas');
        if (!ok) {
            const lv = document.createElement('span');
            lv.style.cssText = 'position:absolute;bottom:2px;right:5px;font-size:.55rem;font-weight:900;color:var(--gris);';
            lv.innerHTML = a.parrainage ? imgIc('cadeau')
                : (a.premium ? imgIc('gemme') : (a.pass ? imgIc('ticket') : a.niveau));
            b.title = a.parrainage ? 'Réservé aux invitées : arrivez via le lien d\'une amie !' : '';
            b.appendChild(lv);
        }
        b.addEventListener('click', () => selectAvatar(a.e));
        rowA.appendChild(b);
    });
    zone.appendChild(rowA);

    // ── Arrière-plans ────────────────────────────────────────────
    const lblB = document.createElement('div');
    lblB.style.cssText = 'font-size:.72rem;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:var(--gris);margin:16px 0 8px;';
    lblB.textContent = 'Arrière-plan';
    zone.appendChild(lblB);

    const bgActif = currentBackground().id;
    const rowB = document.createElement('div');
    rowB.style.cssText = 'display:grid;grid-template-columns:repeat(4,1fr);gap:8px;';
    BACKGROUNDS.forEach(b => {
        const ok = backgroundUnlocked(b);
        const btn = document.createElement('button');
        btn.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:4px;background:none;padding:0;' +
            (ok ? '' : 'opacity:.5;');
        const sw = document.createElement('div');
        sw.style.cssText = `width:100%;aspect-ratio:3/4;border-radius:10px;background:${b.css};position:relative;` +
            'border:1.5px solid var(--ligne);' +
            (b.id === bgActif ? 'outline:3px solid var(--bleu);outline-offset:1px;' : '');
        if (!ok) {
            const lock = document.createElement('span');
            lock.style.cssText = 'position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:1rem;';
            lock.innerHTML = b.boutique ? imgIc('gemme') : (b.pass ? imgIc('ticket') : imgIc('cadenas'));
            sw.appendChild(lock);
        }
        const nm = document.createElement('span');
        nm.style.cssText = 'font-size:.58rem;font-weight:800;color:var(--gris);';
        nm.innerHTML = b.nom + (!ok && b.niveau ? ' · niv. ' + b.niveau : '') +
            (!ok && b.boutique ? ' ' + imgIc('gemme') : '') + (!ok && b.pass ? ' ' + imgIc('ticket') : '');
        btn.append(sw, nm);
        btn.addEventListener('click', () => selectBackground(b.id));
        rowB.appendChild(btn);
    });
    zone.appendChild(rowB);

    const st = document.createElement('div');
    st.id = 'cosmetics-status';
    st.style.cssText = 'font-size:.75rem;font-weight:700;color:var(--gris);margin-top:10px;text-align:center;min-height:1.1em;';
    zone.appendChild(st);
}

applyDarkMode();  // pose data-theme + applyTheme() + applyBackground()
