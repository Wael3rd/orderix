// ─── Mode : Dominos ──────────────────────────────────────────────
// Une chaîne de 8 dominos connectés (valeurs 1..6) est générée ; le
// premier est posé au centre, les 7 autres mélangés dans la main.
// Taper un domino de la main : s'il se connecte à une extrémité de la
// chaîne (retourné si besoin, droite prioritaire), il s'attache.
// Sinon : secousse + rappel des extrémités attendues + une vie perdue
// (retour de test, issue #44 : sans coût, on gagne en tapant au hasard
// sans réfléchir). 3 vies pour toute la partie. Défaite si blocage réel
// (aucun domino de la main ne se connecte) ou vies épuisées. Victoire :
// main vide.

// Dominos affichés à la verticale (retour de test, issue #22) :
// la chaîne se lit de haut en bas, comme une colonne.
function _dominoEl(a, b, small) {
    const d = document.createElement('div');
    const w = small ? 40 : 48, h = Math.round((small ? 40 : 48) * 0.72);
    d.style.cssText = 'display:flex;flex-direction:column;flex-shrink:0;border-radius:8px;overflow:hidden;' +
        'box-shadow:0 1px 2px rgba(35,38,47,.18);user-select:none;touch-action:manipulation;' +
        'transition:transform .12s ease,box-shadow .12s ease;';
    [a, b].forEach((v, i) => {
        const half = document.createElement('div');
        half.style.cssText = `width:${w}px;height:${h}px;background:#4A6CFA;color:#FFFFFF;font-weight:900;` +
            `font-size:${small ? '.9rem' : '1.05rem'};display:flex;align-items:center;justify-content:center;` +
            `pointer-events:none;` + (i === 0 ? 'border-bottom:2px solid #3553D1;' : '');
        half.textContent = v;
        d.appendChild(half);
    });
    return d;
}

function showExampleDominoOrder(day, row, vals) {
    const ex = document.createElement('div');
    ex.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:10px;margin:6px auto;';

    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;gap:18px;align-items:center;';
    const chain = document.createElement('div');
    chain.style.cssText = 'display:flex;flex-direction:column;gap:6px;align-items:center;';
    chain.append(_dominoEl(2, 5, true), _dominoEl(5, 3, true));

    const hand = document.createElement('div');
    hand.style.cssText = 'display:flex;gap:8px;align-items:center;font-weight:bold;color:#8B90A0;font-size:.85rem;';
    const d = _dominoEl(3, 6, true);
    d.style.boxShadow = '0 0 0 3px #FFFFFF, 0 0 0 5px #F5B227';
    hand.append(d, document.createTextNode('→ se connecte au 3'));

    wrap.append(chain, hand);
    ex.append(wrap);
    row.style.flexDirection = 'column';
    row.append(ex);
}

function startGameDominoOrder() {
    board.style.display = 'flex';
    board.style.flexDirection = 'column';
    board.style.alignItems = 'center';

    // Chaîne connectée : 9 valeurs 1..6 → 8 dominos [v(i)|v(i+1)]
    const seq = Array.from({ length: 9 }, () => 1 + Math.floor(Math.random() * 6));
    const dominoes = [];
    for (let i = 0; i < 8; i++) dominoes.push([seq[i], seq[i + 1]]);
    const chain = [dominoes[0]];
    const hand = dominoes.slice(1).sort(() => Math.random() - 0.5);
    let lives = 3;

    const hud = document.createElement('div');
    hud.style.cssText = 'display:flex;gap:18px;align-items:center;justify-content:center;font-weight:bold;color:#8B90A0;font-size:.95rem;margin-bottom:12px;';
    board.appendChild(hud);

    // Chaîne verticale (haut = extrémité gauche, bas = extrémité droite),
    // main à côté pour limiter la hauteur de l'écran
    const mainWrap = document.createElement('div');
    mainWrap.style.cssText = 'display:flex;gap:26px;justify-content:center;align-items:flex-start;';
    board.appendChild(mainWrap);

    const chainZone = document.createElement('div');
    chainZone.style.cssText = 'display:flex;flex-direction:column;gap:6px;align-items:center;min-height:46px;min-width:60px;';
    mainWrap.appendChild(chainZone);

    const handCol = document.createElement('div');
    handCol.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:6px;';
    mainWrap.appendChild(handCol);

    const handLbl = document.createElement('div');
    handLbl.style.cssText = 'font-weight:bold;font-size:.8rem;letter-spacing:.14em;text-transform:uppercase;color:#8B90A0;';
    handLbl.textContent = 'Votre main :';
    handCol.appendChild(handLbl);

    const handZone = document.createElement('div');
    handZone.style.cssText = 'display:grid;grid-template-columns:repeat(2,auto);gap:10px;justify-content:center;';
    handCol.appendChild(handZone);

    const leftEnd = () => chain[0][0];
    const rightEnd = () => chain[chain.length - 1][1];
    function canConnect(d) {
        return d[0] === rightEnd() || d[1] === rightEnd() || d[0] === leftEnd() || d[1] === leftEnd();
    }

    function renderHud() {
        hud.innerHTML = `<span>Restants <b style="color:#4A6CFA">${hand.length}</b></span>` +
            `<span style="font-size:1.15rem;color:#23262F">Extrémités : ▲ <b style="color:#4A6CFA">${leftEnd()}</b> … <b style="color:#4A6CFA">${rightEnd()}</b> ▼</span>` +
            `<span style="color:#E0533D;letter-spacing:2px">${'♥'.repeat(lives)}${'♡'.repeat(3 - lives)}</span>`;
    }

    function renderChain() {
        chainZone.innerHTML = '';
        chain.forEach((d, i) => {
            const el = _dominoEl(d[0], d[1], chain.length > 5);
            if (i === 0 || i === chain.length - 1) {
                el.style.boxShadow = '0 0 0 2px #FFFFFF, 0 0 0 4px #F5B227';
            }
            chainZone.appendChild(el);
        });
    }

    function renderHand() {
        handZone.innerHTML = '';
        hand.forEach((d, i) => {
            const el = _dominoEl(d[0], d[1], false);
            el.addEventListener('pointerdown', (e) => {
                e.preventDefault();
                if (isPaused) return;
                const R = rightEnd(), L = leftEnd();
                let attached = true;
                // Droite prioritaire, retournement automatique
                if (d[0] === R) chain.push([d[0], d[1]]);
                else if (d[1] === R) chain.push([d[1], d[0]]);
                else if (d[1] === L) chain.unshift([d[0], d[1]]);
                else if (d[0] === L) chain.unshift([d[1], d[0]]);
                else attached = false;

                if (attached) {
                    hand.splice(i, 1);
                    haptic(10);
                    render();
                    if (hand.length === 0) {
                        endGame('La chaîne de dominos est complète !', true);
                        return;
                    }
                    if (!hand.some(canConnect)) {
                        endGame('Blocage : aucune extrémité ne correspond. L’ordre de pose compte !', false);
                    }
                } else {
                    // Secousse + message précis sur ce qu'il faut + une vie perdue
                    // (retour de test : taper au hasard sans coût gagnait la partie)
                    lives--;
                    haptic(50);
                    el.style.animation = 'wobble .3s';
                    el.style.boxShadow = '0 0 0 3px #FFFFFF, 0 0 0 6px #E0533D';
                    setTimeout(() => { el.style.animation = ''; el.style.boxShadow = ''; }, 320);
                    const msg = L === R
                        ? `Il faut un ${L} pour se connecter`
                        : `Il faut un ${L} ou un ${R} pour se connecter`;
                    resultDisplay.textContent = msg;
                    resultDisplay.style.color = '#E0533D';
                    setTimeout(() => { if (!isPaused && resultDisplay.textContent === msg) resultDisplay.textContent = ''; }, 1500);
                    renderHud();
                    if (lives <= 0) {
                        endGame('Plus de vies — observez les extrémités avant de jouer.', false);
                        return;
                    }
                }
            });
            handZone.appendChild(el);
        });
    }

    function render() {
        renderHud();
        renderChain();
        renderHand();
    }

    render();
}
