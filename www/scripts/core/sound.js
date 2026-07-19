// ─── Sons du jeu : synthèse WebAudio, aucun asset externe ─────────
// Catalogue court (conventions casual) : tap, étoile à pitch montant,
// jingle de victoire majeur, échec doux descendant. Tous coupables
// via orderix_sound ('off') — bouton dans Réglages & compte.

let _actx = null;
function _audioCtx() {
    if (_actx) return _actx;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    try { _actx = new AC(); } catch (e) { return null; }
    return _actx;
}

function soundOn() { return getStorage('orderix_sound') !== 'off'; }
function toggleSound() { setStorage('orderix_sound', soundOn() ? 'off' : 'on'); return soundOn(); }

function _tone(freq, dur, opts) {
    opts = opts || {};
    const c = _audioCtx(); if (!c || !soundOn()) return;
    if (c.state === 'suspended') c.resume();
    const t = c.currentTime + (opts.delay || 0);
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = opts.type || 'sine';
    o.frequency.setValueAtTime(freq, t);
    if (opts.slide) o.frequency.exponentialRampToValueAtTime(Math.max(40, freq + opts.slide), t + dur);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(opts.vol || .15, t + .012);
    g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    o.connect(g); g.connect(c.destination);
    o.start(t); o.stop(t + dur + .05);
}

// Tap UI : pop neutre court, pitch légèrement aléatoire (anti-fatigue)
function sndTap() { _tone(640 * (0.95 + Math.random() * .1), .055, { type: 'triangle', vol: .09 }); }
// Bonne action : deux notes brillantes
function sndGood() { _tone(740, .09, { type: 'triangle', vol: .13 }); _tone(988, .13, { type: 'triangle', vol: .11, delay: .06 }); }
// Erreur : « thunk » sourd, jamais agressif
function sndBad() { _tone(220, .15, { type: 'square', vol: .06, slide: -60 }); }
// Étoile n°i : ding au pitch montant (sol → si → ré)
function sndStar(i) { _tone([784, 988, 1175][i % 3], .18, { type: 'triangle', vol: .16 }); }
// Jingle de victoire : arpège majeur ascendant + note tenue (~1 s)
function sndWin() {
    [[523, 0], [659, .09], [784, .18], [1047, .27]].forEach(p => _tone(p[0], .22, { type: 'triangle', vol: .14, delay: p[1] }));
    _tone(1319, .5, { type: 'sine', vol: .09, delay: .40 });
}
// Échec : deux notes descendantes, compatissantes
function sndFail() { _tone(392, .18, { type: 'triangle', vol: .09 }); _tone(311, .28, { type: 'triangle', vol: .09, delay: .14 }); }
