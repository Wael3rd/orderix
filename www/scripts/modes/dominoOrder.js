// ─── Mode : Dominos ──────────────────────────────────────────────
// Une chaîne de 8 dominos connectés (valeurs 1..6) est générée ; le
// premier est posé au centre, les 7 autres mélangés dans la main.
// Taper un domino de la main : s'il se connecte à une extrémité de la
// chaîne (retourné si besoin, droite prioritaire), il s'attache.
// Sinon : secousse + rappel des extrémités attendues (aucune vie
// perdue). Seule défaite : blocage réel (aucun domino de la main ne
// se connecte). Victoire : main vide.

function _dominoEl(a, b, small) {
    const d = document.createElement('div');
    const w = small ? 28 : 34, h = Math.round((small ? 28 : 34) * 1.25);
    d.style.cssText = 'display:flex;flex-shrink:0;border-radius:8px;overflow:hidden;' +
        'box-shadow:0 1px 2px rgba(35,38,47,.18);user-select:none;touch-action:manipulation;' +
        'transition:transform .12s ease,box-shadow .12s ease;';
    [a, b].forEach((v, i) => {
        const half = document.createElement('div');
        half.style.cssText = `width:${w}px;height:${h}px;background:#4A6CFA;color:#FFFFFF;font-weight:900;` +
            `font-size:${small ? '.9rem' : '1.05rem'};display:flex;align-items:center;justify-content:center;` +
            `pointer-events:none;` + (i === 0 ? 'border-right:2px solid #3553D1;' : '');
        half.textContent = v;
        d.appendChild(half);
    });
    return d;
}

function showExampleDominoOrder(day, row, vals) {
    const ex = document.createElement('div');
    ex.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:10px;margin:6px auto;';

    const chain = document.createElement('div');
    chain.style.cssText = 'display:flex;gap:6px;align-items:center;';
    chain.append(_dominoEl(2, 5, true), _dominoEl(5, 3, true));

    const hand = document.createElement('div');
    hand.style.cssText = 'display:flex;gap:8px;align-items:center;font-weight:bold;color:#8B90A0;font-size:.85rem;';
    const d = _dominoEl(3, 6, true);
    d.style.boxShadow = '0 0 0 3px #FFFFFF, 0 0 0 5px #F5B227';
    hand.append(d, document.createTextNode('→ se connecte au 3'));

    ex.append(chain, hand);
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

    const hud = document.createElement('div');
    hud.style.cssText = 'display:flex;gap:18px;align-items:center;justify-content:center;font-weight:bold;color:#8B90A0;font-size:.95rem;margin-bottom:12px;';
    board.appendChild(hud);

    const chainZone = document.createElement('div');
    chainZone.style.cssText = 'display:flex;flex-wrap:wrap;gap:6px;justify-content:center;align-items:center;max-width:420px;margin-bottom:16px;min-height:46px;';
    board.appendChild(chainZone);

    const handLbl = document.createElement('div');
    handLbl.style.cssText = 'font-weight:bold;font-size:.8rem;letter-spacing:.14em;text-transform:uppercase;color:#8B90A0;margin-bottom:6px;';
    handLbl.textContent = 'Votre main :';
    board.appendChild(handLbl);

    const handZone = document.createElement('div');
    handZone.style.cssText = 'display:flex;flex-wrap:wrap;gap:10px;justify-content:center;max-width:420px;';
    board.appendChild(handZone);

    const leftEnd = () => chain[0][0];
    const rightEnd = () => chain[chain.length - 1][1];
    function canConnect(d) {
        return d[0] === rightEnd() || d[1] === rightEnd() || d[0] === leftEnd() || d[1] === leftEnd();
    }

    function renderHud() {
        hud.innerHTML = `<span>Restants <b style="color:#4A6CFA">${hand.length}</b></span>` +
            `<span style="font-size:1.3rem;color:#23262F">Extrémités : ◀ <b style="color:#4A6CFA">${leftEnd()}</b> … <b style="color:#4A6CFA">${rightEnd()}</b> ▶</span>`;
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
                    // Aucune vie perdue : secousse + message précis sur ce qu'il faut
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
