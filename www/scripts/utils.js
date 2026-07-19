// ─── Tables de correspondance & petits helpers ───────────────────
const ROMAN_TABLE = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII', 'XIV', 'XV', 'XVI', 'XVII', 'XVIII', 'XIX', 'XX', 'XXI', 'XXII', 'XXIII', 'XXIV', 'XXV', 'XXVI', 'XXVII', 'XXVIII', 'XXIX', 'XXX'];
const MONTH_TABLE = ['', 'Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
const PLANET_TABLE = ['', '☿', '♀', '⊕', '♂', '♃', '♄', '⛢', '♆'];
const EMOJI_TABLE = ['', '😢', '😕', '😐', '🙂', '😊', '😄', '🤩'];
const ANIMAL_TABLE = ['', '🐜', '🐌', '🐁', '🐀', '🐸', '🐇', '🐈', '🐕', '🐖', '🦊', '🐑', '🐄', '🐎', '🐻', '🦁', '🐊', '🦏', '🐘', '🐋', '🦕'];
const AGE_TABLE = ['', '👶', '🧒', '👦', '🧑', '👨', '🧔', '👨‍🦳', '👴'];
const WORD_TABLE = { 2: 'si', 3: 'eau', 4: 'lune', 5: 'avion', 6: 'jardin', 7: 'château', 8: 'papillon', 9: 'crocodile', 10: 'ordinateur', 11: 'trampoline', 12: 'hippopotame' };
const ALPHA_TABLE = ' ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const DICE_PATTERNS = { 1: [[3, 3]], 2: [[1, 1], [5, 5]], 3: [[1, 1], [3, 3], [5, 5]], 4: [[1, 1], [1, 5], [5, 1], [5, 5]], 5: [[1, 1], [1, 5], [3, 3], [5, 1], [5, 5]], 6: [[1, 1], [1, 3], [1, 5], [5, 1], [5, 3], [5, 5]] };

const MONTH_NAMES_FULL = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
const WEEKDAY_NAMES = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

const WIN_PHRASES = [
    "Quel bel esprit !",
    "Magnifique précision.",
    "Votre cerveau vous dit merci.",
    "Élégamment résolu.",
    "Un sans-faute, bravo.",
    "Belle agilité d'esprit !"
];
const FAIL_PHRASES = [
    "Presque ! Demain est un autre puzzle.",
    "Un faux pas, rien de grave.",
    "Celui-ci était retors…",
    "L'important, c'est d'avoir cherché.",
    "Votre revanche vous attend demain."
];

function pickPhrase(list) { return list[Math.floor(Math.random() * list.length)]; }

function _setText(el, text, size, color) {
    el.style.cssText += `font-size:${size || 14}px;color:${color || 'white'};font-weight:bold;text-align:center;line-height:60px;`;
    el.textContent = text;
}

function _fillText(el, count, char, color) {
    const c = document.createElement('div');
    c.style.cssText = `display:flex;flex-wrap:wrap;gap:1px;padding:3px;width:100%;height:100%;box-sizing:border-box;align-content:flex-start;justify-content:center;font-size:12px;line-height:1;color:${color}`;
    for (let i = 0; i < count; i++) { const s = document.createElement('span'); s.textContent = char; c.appendChild(s); }
    el.appendChild(c);
}

function _formatWeight(g) {
    if (g >= 1000) return (g / 1000) + 'kg';
    return g + 'g';
}

function _formatDuration(s) {
    if (s >= 3600) return (s / 3600) + 'h';
    if (s >= 60) return (s / 60) + 'min';
    return s + 's';
}

// Vibration discrète (Android WebView supporte navigator.vibrate)
function haptic(pattern) {
    try { if (navigator.vibrate) navigator.vibrate(pattern); } catch (e) { }
}

// Met en évidence la ou les bonnes réponses après une erreur
function showSolutionHighlight(correctValues) {
    if (!correctValues || correctValues.length === 0) return;
    const domItems = document.querySelectorAll('#game-board .item');
    let valuesToHighlight = [...correctValues];

    domItems.forEach(item => {
        const v = parseFloat(item.dataset.value);
        const idx = valuesToHighlight.findIndex(cv => Math.abs(cv - v) < 0.0001);
        if (idx !== -1) {
            item.classList.remove('error');
            item.classList.remove('peek-hidden');
            item.style.boxShadow = '0 0 0 3px #FFFFFF, 0 0 0 7px #34B871';
            item.style.transform = 'scale(1.15)';
            item.style.zIndex = '100';
            item.style.opacity = '1';
            valuesToHighlight.splice(idx, 1);
        } else if (!item.classList.contains('error')) {
            item.style.opacity = '0.3';
        }
    });
}

// Pluie de pétales lors d'une victoire
function celebrate() {
    const host = document.getElementById('petals');
    if (!host) return;
    const colors = ['#E0533D', '#34B871', '#F5B227', '#4A6CFA', '#8FA4FB'];
    for (let i = 0; i < 26; i++) {
        const p = document.createElement('div');
        p.className = 'petal';
        p.style.left = Math.random() * 100 + 'vw';
        p.style.background = colors[i % colors.length];
        p.style.animationDuration = (2.2 + Math.random() * 1.8) + 's';
        p.style.animationDelay = (Math.random() * 0.5) + 's';
        p.style.transform = `scale(${0.7 + Math.random() * 0.8})`;
        host.appendChild(p);
        setTimeout(() => p.remove(), 4800);
    }
}

// Icône 3D (Fluent Emoji, MIT — assets/img/) pour le chrome UI
function imgIc(nom, cls) {
    return '<img class="ic3d' + (cls ? ' ' + cls : '') + '" src="assets/img/' + nom + '.png" alt="">';
}
