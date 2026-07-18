// ─── Mode : Les Tubes ────────────────────────────────────────────
// Water Sort ordonné : 5 tubes, 16 jetons (4 familles de couleur,
// valeurs 1 à 4). Objectif : 4 tubes portant chacun une famille
// complète empilée du 4 (fond) au 1 (sommet). On ne verse un jeton
// que sur un jeton de la MÊME famille de valeur exactement
// supérieure de 1 (un 2 sur un 3, un 1 sur un 2…), ou dans un tube
// vide. Génération par coups inverses depuis l'état résolu :
// toujours solvable. Bouton Annuler à historique illimité.

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

    // Retour #72 : format agrandi — 8 familles × 5 jetons, 10 tubes
    // (8 pleins + 2 vides), sur deux rangées.
    const F = 8, V = 5, T = F + 2;
    const COUL = ['#4A6CFA', '#34B871', '#F5B227', '#E0533D', '#8B5CF6', '#1E7A74', '#E8752A', '#D9469A'];

    // Une fiole est complète si elle contient exactement V jetons de la
    // même famille, rangés du V (fond) au 1 (sommet).
    function tubeComplet(tube) {
        if (tube.length !== V) return false;
        const f = tube[0].f;
        for (let i = 0; i < V; i++) {
            if (tube[i].f !== f || tube[i].v !== V - i) return false;
        }
        return true;
    }

    function estResolu(tubes) {
        let complets = 0;
        for (const tube of tubes) if (tubeComplet(tube)) complets++;
        return complets === F;
    }

    // Génération solvable : 30-40 coups inverses depuis l'état résolu.
    // Un coup inverse = soulever un jeton légalement posé (sur son
    // support de valeur +1 de la même famille, ou dernier de son tube)
    // et le déposer sur n'importe quel tube non plein. Chaque coup
    // inverse est l'inverse d'un versement légal, donc la séquence est
    // rejouable à l'envers : l'état généré est toujours solvable.
    function generer() {
        let secours = null;
        for (let essai = 0; essai < 120; essai++) {
            const tubes = Array.from({ length: F }, (_, f) =>
                Array.from({ length: V }, (_, i) => ({ f: f, v: V - i })));
            tubes.push([], []);
            const objectif = 70 + Math.floor(Math.random() * 21); // 70 à 90
            let faits = 0;
            while (faits < objectif) {
                const coups = [];
                for (let a = 0; a < T; a++) {
                    const tA = tubes[a];
                    if (!tA.length) continue;
                    const jeton = tA[tA.length - 1];
                    const dessous = tA[tA.length - 2];
                    if (dessous && !(dessous.f === jeton.f && dessous.v === jeton.v + 1)) continue;
                    for (let b = 0; b < T; b++) {
                        if (b !== a && tubes[b].length < V) coups.push([a, b]);
                    }
                }
                if (!coups.length) break;
                const c = coups[Math.floor(Math.random() * coups.length)];
                tubes[c[1]].push(tubes[c[0]].pop());
                faits++;
            }
            if (faits >= objectif && !estResolu(tubes)) return tubes;
            if (faits >= 20 && !estResolu(tubes) && !secours) secours = tubes;
        }
        if (secours) return secours;
        // Dernier recours (théorique) : un coup inverse depuis l'état résolu
        const tubes = Array.from({ length: F }, (_, f) =>
            Array.from({ length: V }, (_, i) => ({ f: f, v: V - i })));
        tubes.push([], []);
        tubes[F].push(tubes[0].pop());
        return tubes;
    }

    const tubes = generer();
    let sel = null;      // index du tube source sélectionné
    let coups = 0;
    let fini = false;
    const historique = [];   // coups joués [source, destination], illimité

    const hud = document.createElement('div');
    hud.style.cssText = 'display:flex;align-items:center;gap:14px;margin-bottom:6px;';
    const compteur = document.createElement('div');
    compteur.style.cssText = 'font-weight:bold;color:#8B90A0;font-size:.95rem;';
    const btnAnnuler = document.createElement('button');
    btnAnnuler.className = 'btn btn-ghost';
    btnAnnuler.style.cssText = 'padding:8px 14px;font-size:.85rem;';
    btnAnnuler.textContent = '↩ Annuler';
    btnAnnuler.addEventListener('pointerdown', e => { e.preventDefault(); annuler(); });
    hud.append(compteur, btnAnnuler);
    board.appendChild(hud);

    const zone = document.createElement('div');
    zone.style.cssText = 'display:flex;flex-wrap:wrap;gap:12px 8px;justify-content:center;align-items:flex-end;max-width:360px;';
    board.appendChild(zone);

    function render() {
        compteur.innerHTML = 'Coups : <b style="color:#4A6CFA">' + coups + '</b>';
        btnAnnuler.disabled = !historique.length;
        btnAnnuler.style.opacity = historique.length ? '1' : '.4';
        zone.innerHTML = '';
        tubes.forEach((tube, i) => {
            const locked = tubeComplet(tube);
            const tb = document.createElement('div');
            // 5 tubes par rangée : 5×62px + gaps ≈ 350px, sur 2 rangées
            tb.style.cssText = 'width:62px;height:222px;border-radius:12px 12px 24px 24px;display:flex;flex-direction:column-reverse;align-items:center;padding:5px 0;gap:4px;box-sizing:border-box;touch-action:manipulation;transition:transform .12s;' +
                (locked
                    ? 'background:#E3F7ED;border:2px solid #34B871;box-shadow:0 0 0 2px #FFFFFF, 0 0 0 4px #34B871;'
                    : 'background:#EEF2FF;border:2px solid #C7D2F5;');
            // Retour #87 : les cases pas encore remplies affichent en fond
            // le chiffre attendu à cette position (V au fond, 1 au sommet),
            // pour ne pas avoir à deviner qu'il faut ranger le 1 en dernier.
            for (let posIdx = 0; posIdx < V; posIdx++) {
                const jeton = tube[posIdx];
                const el = document.createElement('div');
                if (jeton) {
                    el.style.cssText = 'width:36px;height:36px;border-radius:50%;background:' + COUL[jeton.f] + ';color:#FFFFFF;font-weight:900;font-size:.95rem;display:flex;align-items:center;justify-content:center;pointer-events:none;transition:transform .12s;flex-shrink:0;';
                    el.textContent = jeton.v;
                    if (sel === i && posIdx === tube.length - 1) {
                        el.style.transform = 'translateY(-10px)';
                        el.style.boxShadow = '0 0 0 3px #FFFFFF, 0 0 0 5px #F5B227';
                    }
                } else {
                    el.style.cssText = 'width:36px;height:36px;border-radius:50%;border:2px dashed #C7D2F5;color:#C7D2F5;font-weight:900;font-size:.85rem;display:flex;align-items:center;justify-content:center;pointer-events:none;flex-shrink:0;box-sizing:border-box;';
                    el.textContent = V - posIdx;
                }
                tb.appendChild(el);
            }
            tb.addEventListener('pointerdown', e => { e.preventDefault(); tap(i, tb); });
            zone.appendChild(tb);
        });
    }

    function tap(i, el) {
        if (isPaused || fini) return;
        if (sel === null) {
            // Une fiole figée (complète) ne se touche plus.
            if (!tubes[i].length || tubeComplet(tubes[i])) return;
            sel = i;
            haptic(6);
            render();
            return;
        }
        if (sel === i) { sel = null; render(); return; }  // re-taper la source annule

        const src = tubes[sel], dst = tubes[i];
        const jeton = src[src.length - 1];
        const sommet = dst[dst.length - 1];
        const legal = dst.length < V && (!sommet || (sommet.f === jeton.f && sommet.v === jeton.v + 1));

        if (!legal) {
            // Coup illégal : secousse, pas de pénalité, la sélection reste
            haptic(40);
            el.style.animation = 'wobble .3s';
            setTimeout(() => { el.style.animation = ''; }, 320);
            return;
        }

        dst.push(src.pop());
        historique.push([sel, i]);
        coups++;
        sel = null;
        haptic(10);
        render();

        if (estResolu(tubes)) {
            fini = true;
            endGame('Huit tubes parfaitement rangés — impressionnant !', true);
        }
    }

    // Annulation : rejoue le dernier coup en sens inverse. Comme le
    // coup annulé était légal, la restauration est toujours valide.
    function annuler() {
        if (isPaused || fini || !historique.length) return;
        const c = historique.pop();
        tubes[c[0]].push(tubes[c[1]].pop());
        coups--;
        sel = null;
        haptic(8);
        render();
    }

    render();
}
