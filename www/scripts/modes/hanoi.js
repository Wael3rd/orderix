// ─── Mode : La Tour ──────────────────────────────────────────────
// Tour de Hanoï classique : 4 disques, 3 piquets. La tour complète
// part du piquet GAUCHE et doit arriver sur le piquet DROIT.
// Budget : 22 coups (le minimum théorique est 15).

function showExampleHanoi(day, row, vals) {
    const ex = document.createElement('div');
    ex.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:8px;margin:6px auto;';

    function miniPiquet(disques) {
        // disques : du fond au sommet, largeurs mini
        const COUL = ['#3553D1', '#4A6CFA', '#7C93F5'];
        const p = document.createElement('div');
        p.style.cssText = 'position:relative;width:52px;height:58px;flex-shrink:0;';
        const base = document.createElement('div');
        base.style.cssText = 'position:absolute;left:50%;transform:translateX(-50%);bottom:0;width:48px;height:5px;background:#8B90A0;border-radius:3px;';
        const tige = document.createElement('div');
        tige.style.cssText = 'position:absolute;left:50%;transform:translateX(-50%);bottom:3px;width:5px;height:48px;background:#8B90A0;border-radius:3px;';
        p.append(base, tige);
        disques.forEach((w, j) => {
            const d = document.createElement('div');
            d.style.cssText = 'position:absolute;left:50%;transform:translateX(-50%);bottom:' + (5 + j * 11) + 'px;width:' + w + 'px;height:9px;background:' + COUL[j] + ';border-radius:5px;';
            p.appendChild(d);
        });
        return p;
    }

    const ligne = document.createElement('div');
    ligne.style.cssText = 'display:flex;align-items:flex-end;gap:12px;justify-content:center;';
    const fleche = document.createElement('div');
    fleche.style.cssText = 'font-weight:900;color:#8B90A0;font-size:1.2rem;align-self:center;';
    fleche.textContent = '→';
    ligne.append(miniPiquet([44, 32, 20]), fleche, miniPiquet([]), miniPiquet([44, 32, 20]));

    const note = document.createElement('div');
    note.style.cssText = 'font-size:.78rem;color:#8B90A0;font-weight:bold;';
    note.textContent = 'Déplacez toute la tour vers le piquet droit';

    ex.append(ligne, note);
    row.style.flexDirection = 'column';
    row.append(ex);
}

function startGameHanoi() {
    board.style.display = 'flex';
    board.style.flexDirection = 'column';
    board.style.alignItems = 'center';

    // Tailles 1..4 ; 4 = le plus large (100px)
    const LARG = [0, 40, 60, 80, 100];
    const COUL = [null, '#AEBDF9', '#7C93F5', '#4A6CFA', '#3553D1'];
    const BUDGET = 22;

    const piquets = [[4, 3, 2, 1], [], []];
    let sel = null;
    let coups = 0;
    let fini = false;

    const hud = document.createElement('div');
    hud.style.cssText = 'font-weight:900;color:#23262F;font-size:1.15rem;margin-bottom:4px;';
    board.appendChild(hud);

    const zone = document.createElement('div');
    zone.style.cssText = 'display:flex;gap:4px;justify-content:center;align-items:flex-end;width:100%;max-width:380px;';
    board.appendChild(zone);

    function render() {
        const coul = coups >= BUDGET - 3 ? '#E0533D' : '#4A6CFA';
        hud.innerHTML = 'Coups : <b style="color:' + coul + '">' + coups + '/' + BUDGET + '</b>';
        zone.innerHTML = '';
        piquets.forEach((pile, i) => {
            const col = document.createElement('div');
            col.style.cssText = 'position:relative;width:112px;height:188px;flex-shrink:0;touch-action:manipulation;';

            const base = document.createElement('div');
            base.style.cssText = 'position:absolute;left:50%;transform:translateX(-50%);bottom:20px;width:106px;height:8px;background:#8B90A0;border-radius:4px;';
            col.appendChild(base);

            const tige = document.createElement('div');
            tige.style.cssText = 'position:absolute;left:50%;transform:translateX(-50%);bottom:26px;width:8px;height:132px;background:#8B90A0;border-radius:4px;';
            col.appendChild(tige);

            const lbl = document.createElement('div');
            lbl.style.cssText = 'position:absolute;left:0;right:0;bottom:0;text-align:center;font-size:.68rem;font-weight:bold;letter-spacing:.1em;text-transform:uppercase;color:#8B90A0;';
            lbl.textContent = i === 0 ? 'Départ' : (i === 2 ? 'Arrivée' : '');
            col.appendChild(lbl);

            pile.forEach((taille, j) => {
                const d = document.createElement('div');
                const lift = (sel === i && j === pile.length - 1);
                d.style.cssText = 'position:absolute;left:50%;bottom:' + (28 + j * 22) + 'px;width:' + LARG[taille] + 'px;height:20px;background:' + COUL[taille] + ';border-radius:8px;pointer-events:none;transition:transform .12s;transform:translateX(-50%)' + (lift ? ' translateY(-14px)' : '') + ';';
                if (lift) d.style.boxShadow = '0 0 0 2px #FFFFFF, 0 0 0 4px #F5B227';
                col.appendChild(d);
            });

            col.addEventListener('pointerdown', e => { e.preventDefault(); tap(i, col); });
            zone.appendChild(col);
        });
    }

    function tap(i, el) {
        if (isPaused || fini) return;
        if (sel === null) {
            if (!piquets[i].length) return;
            sel = i;
            haptic(6);
            render();
            return;
        }
        if (sel === i) { sel = null; render(); return; }  // re-taper la source annule

        const src = piquets[sel], dst = piquets[i];
        const disque = src[src.length - 1];
        const sommet = dst[dst.length - 1];
        const legal = (sommet === undefined) || (sommet > disque);

        if (!legal) {
            haptic(40);
            el.style.animation = 'wobble .3s';
            setTimeout(() => { el.style.animation = ''; }, 320);
            return;
        }

        dst.push(src.pop());
        coups++;
        sel = null;
        haptic(10);
        render();

        if (piquets[2].length === 4) {
            fini = true;
            endGame('La tour est arrivée en ' + coups + ' coups !', true);
        } else if (coups >= BUDGET) {
            fini = true;
            endGame('Le minimum est 15 coups — réessayez demain !', false);
        }
    }

    render();
}
