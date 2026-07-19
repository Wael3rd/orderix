// ─── Cosmétiques : thèmes de couleurs et avatars, débloqués par niveau ─
// Progression 100 % parure : rien qui change le gameplay. Le niveau =
// 1 + réussites/10 (voir computeStats). Sélection persistée localement.

const THEMES = [
    { id: 'ocean', nom: 'Océan', niveau: 1, bleu: '#4A6CFA', fonce: '#3553D1', pale: '#EEF2FF', bord: '#D6DEFC' },
    { id: 'emeraude', nom: 'Émeraude', niveau: 2, bleu: '#16A47C', fonce: '#0E7E5F', pale: '#E5F7F1', bord: '#C6EDE0' },
    { id: 'corail', nom: 'Corail', niveau: 3, bleu: '#F26B5E', fonce: '#D14C40', pale: '#FEEDEA', bord: '#FBD4CE' },
    { id: 'amethyste', nom: 'Améthyste', niveau: 5, bleu: '#8B5CF6', fonce: '#6D3FD4', pale: '#F2ECFE', bord: '#E0D2FB' },
    { id: 'rose', nom: 'Rose Poudré', niveau: 8, bleu: '#E754A6', fonce: '#C43A88', pale: '#FDECF5', bord: '#F9CFE6' },
    { id: 'minuit', nom: 'Minuit', niveau: 12, bleu: '#3B4B8C', fonce: '#2A3768', pale: '#EAEDF7', bord: '#CDD4EC' }
];

const AVATARS = [
    { e: '☺', niveau: 1 }, { e: '🦊', niveau: 2 }, { e: '🐱', niveau: 3 },
    { e: '🦉', niveau: 4 }, { e: '🌸', niveau: 5 }, { e: '🐝', niveau: 6 },
    { e: '🌙', niveau: 7 }, { e: '🍀', niveau: 8 }, { e: '🦋', niveau: 9 },
    { e: '⭐', niveau: 10 }, { e: '🌷', niveau: 11 }, { e: '🧠', niveau: 12 },
    // Avatar de bienvenue : réservé aux joueuses arrivées par un lien
    // d'invitation (?ref=) — le cadeau de la marraine
    { e: '🎁', niveau: 1, parrainage: true }
];

function playerLevel() {
    return 1 + Math.floor(computeStats().won / 10);
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
    r.setProperty('--bleu-pale', t.pale);
    r.setProperty('--bleu-bord', t.bord);
}

function selectTheme(id) {
    const t = THEMES.find(x => x.id === id);
    if (!t || playerLevel() < t.niveau) return;
    setStorage('orderix_theme', id);
    applyTheme();
    haptic(8);
    renderCosmetics();
}

function avatarUnlocked(a) {
    if (a.parrainage) return getStorage('orderix_referred') === '1';
    return playerLevel() >= a.niveau;
}

function selectAvatar(e) {
    const a = AVATARS.find(x => x.e === e);
    if (!a || !avatarUnlocked(a)) return;
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
        const ok = niveau >= t.niveau;
        const b = document.createElement('button');
        b.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:4px;background:none;padding:0;' +
            (ok ? '' : 'opacity:.4;');
        const sw = document.createElement('div');
        sw.style.cssText = `width:44px;height:44px;border-radius:50%;background:${t.bleu};position:relative;` +
            `box-shadow:inset 0 -4px 0 rgba(0,0,0,.15);` +
            (t.id === themeActif ? `outline:3px solid var(--encre);outline-offset:2px;` : '');
        if (!ok) {
            const lock = document.createElement('span');
            lock.style.cssText = 'position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:1rem;';
            lock.textContent = '🔒';
            sw.appendChild(lock);
        }
        const nm = document.createElement('span');
        nm.style.cssText = 'font-size:.6rem;font-weight:800;color:var(--gris);';
        nm.textContent = ok ? t.nom : 'niv. ' + t.niveau;
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
        b.textContent = ok ? a.e : '🔒';
        if (!ok) {
            const lv = document.createElement('span');
            lv.style.cssText = 'position:absolute;bottom:2px;right:5px;font-size:.55rem;font-weight:900;color:var(--gris);';
            lv.textContent = a.parrainage ? '💌' : a.niveau;
            b.title = a.parrainage ? 'Réservé aux invitées : arrivez via le lien d\'une amie !' : '';
            b.appendChild(lv);
        }
        b.addEventListener('click', () => selectAvatar(a.e));
        rowA.appendChild(b);
    });
    zone.appendChild(rowA);
}

applyTheme();
