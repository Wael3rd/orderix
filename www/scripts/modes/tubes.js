// ─── Mode : Les Tubes ────────────────────────────────────────────
// Water Sort ordonné : 4 tubes, 12 jetons (3 familles de couleur,
// valeurs 1 à 4). Objectif : 3 tubes portant chacun une famille
// complète empilée du 4 (fond) au 1 (sommet). On ne verse un jeton
// que sur un jeton de la MÊME famille de valeur exactement
// supérieure de 1 (un 2 sur un 3, un 1 sur un 2…), ou dans un tube
// vide. Génération par coups inverses depuis l'état résolu :
// toujours solvable.

function showExampleTubes(day, row, vals) {
    const COUL = ['#4A6CFA', '#34B871', '#F5B227'];
    const ex = document.createElement('div');
    ex.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:8px;margin:6px auto;';

    function miniTube(jetons) {
        const tb = document.createElement('div');
        tb.style.cssText = 'width:36px;height:112px;background:#EEF2FF;border:2px solid #C7D2F5;border-radius:8px 8px 14px 14px;display:flex;flex-direction:column-reverse;align-items:center;padding:3px 0;gap:3px;box-sizing:border-box;';
        jetons.forEach(j => {
            const el = document.createElement('div');
            el.style.cssText = 'width:22px;height:22px;border-radius:50%;background:' + COUL[j[0]] + ';color:#FFFFFF;font-weight:900;font-size:.68rem;display:flex;align-items:center;justify-content:center;';
            el.textContent = j[1];
            tb.appendChild(el);
        });
        return tb;
    }

    const ligne = document.createElement('div');
    ligne.style.cssText = 'display:flex;align-items:flex-end;gap:14px;justify-content:center;';
    const fleche = document.createElement('div');
    fleche.style.cssText = 'font-weight:900;color:#8B90A0;font-size:1.2rem;align-self:center;';
    fleche.textContent = '→';
    ligne.append(miniTube([[0, 2], [1, 4], [2, 1]]), fleche, miniTube([[0, 4], [0, 3], [0, 2], [0, 1]]));

    const note = document.createElement('div');
    note.style.cssText = 'font-size:.78rem;color:#8B90A0;font-weight:bold;';
    note.textContent = 'Chaque famille rangée du 4 (fond) au 1 (sommet)';

    ex.append(ligne, note);
    row.style.flexDirection = 'column';
    row.append(ex);
}

function startGameTubes() {
    board.style.display = 'flex';
    board.style.flexDirection = 'column';
    board.style.alignItems = 'center';

    const COUL = ['#4A6CFA', '#34B871', '#F5B227'];

    function estResolu(tubes) {
        let complets = 0;
        for (const tube of tubes) {
            if (tube.length !== 4) continue;
            const f = tube[0].f;
            let ok = true;
            for (let i = 0; i < 4; i++) {
                if (tube[i].f !== f || tube[i].v !== 4 - i) { ok = false; break; }
            }
            if (ok) complets++;
        }
        return complets === 3;
    }

    // Génération solvable : 25-35 coups inverses depuis l'état résolu.
    // Un coup inverse = soulever un jeton légalement posé (sur son
    // support de valeur +1 de la même famille, ou dernier de son tube)
    // et le déposer sur n'importe quel tube non plein. Chaque coup
    // inverse est l'inverse d'un versement légal, donc la séquence est
    // rejouable à l'envers : l'état généré est toujours solvable.
    function generer() {
        let secours = null;
        for (let essai = 0; essai < 120; essai++) {
            const tubes = [0, 1, 2].map(f => [4, 3, 2, 1].map(v => ({ f: f, v: v })));
            tubes.push([]);
            const objectif = 25 + Math.floor(Math.random() * 11); // 25 à 35
            let faits = 0;
            while (faits < objectif) {
                const coups = [];
                for (let a = 0; a < 4; a++) {
                    const tA = tubes[a];
                    if (!tA.length) continue;
                    const jeton = tA[tA.length - 1];
                    const dessous = tA[tA.length - 2];
                    if (dessous && !(dessous.f === jeton.f && dessous.v === jeton.v + 1)) continue;
                    for (let b = 0; b < 4; b++) {
                        if (b !== a && tubes[b].length < 4) coups.push([a, b]);
                    }
                }
                if (!coups.length) break;
                const c = coups[Math.floor(Math.random() * coups.length)];
                tubes[c[1]].push(tubes[c[0]].pop());
                faits++;
            }
            if (faits >= objectif && !estResolu(tubes)) return tubes;
            if (faits >= 8 && !estResolu(tubes) && !secours) secours = tubes;
        }
        if (secours) return secours;
        // Dernier recours (théorique) : un coup inverse depuis l'état résolu
        const tubes = [0, 1, 2].map(f => [4, 3, 2, 1].map(v => ({ f: f, v: v })));
        tubes.push([]);
        tubes[3].push(tubes[0].pop());
        return tubes;
    }

    const tubes = generer();
    let sel = null;      // index du tube source sélectionné
    let coups = 0;
    let fini = false;

    const hud = document.createElement('div');
    hud.style.cssText = 'font-weight:bold;color:#8B90A0;font-size:.95rem;margin-bottom:6px;';
    board.appendChild(hud);

    const zone = document.createElement('div');
    zone.style.cssText = 'display:flex;gap:14px;justify-content:center;align-items:flex-end;';
    board.appendChild(zone);

    function render() {
        hud.innerHTML = 'Coups : <b style="color:#4A6CFA">' + coups + '</b>';
        zone.innerHTML = '';
        tubes.forEach((tube, i) => {
            const tb = document.createElement('div');
            tb.style.cssText = 'width:64px;height:214px;background:#EEF2FF;border:2px solid #C7D2F5;border-radius:14px 14px 26px 26px;display:flex;flex-direction:column-reverse;align-items:center;padding:6px 0;gap:6px;box-sizing:border-box;touch-action:manipulation;transition:transform .12s;';
            tube.forEach((jeton, j) => {
                const el = document.createElement('div');
                el.style.cssText = 'width:44px;height:44px;border-radius:50%;background:' + COUL[jeton.f] + ';color:#FFFFFF;font-weight:900;font-size:1.15rem;display:flex;align-items:center;justify-content:center;pointer-events:none;transition:transform .12s;flex-shrink:0;';
                el.textContent = jeton.v;
                if (sel === i && j === tube.length - 1) {
                    el.style.transform = 'translateY(-14px)';
                    el.style.boxShadow = '0 0 0 3px #FFFFFF, 0 0 0 5px #F5B227';
                }
                tb.appendChild(el);
            });
            tb.addEventListener('pointerdown', e => { e.preventDefault(); tap(i, tb); });
            zone.appendChild(tb);
        });
    }

    function tap(i, el) {
        if (isPaused || fini) return;
        if (sel === null) {
            if (!tubes[i].length) return;
            sel = i;
            haptic(6);
            render();
            return;
        }
        if (sel === i) { sel = null; render(); return; }  // re-taper la source annule

        const src = tubes[sel], dst = tubes[i];
        const jeton = src[src.length - 1];
        const sommet = dst[dst.length - 1];
        const legal = dst.length < 4 && (!sommet || (sommet.f === jeton.f && sommet.v === jeton.v + 1));

        if (!legal) {
            // Coup illégal : secousse, pas de pénalité, la sélection reste
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

        if (estResolu(tubes)) {
            fini = true;
            endGame('Trois tubes parfaitement rangés !', true);
        }
    }

    render();
}
