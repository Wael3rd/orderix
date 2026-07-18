// ─── Mode : Échange Minimal ──────────────────────────────────────
// Une rangée de 10 tuiles-nombres (retour #88 : 7 → 10) à trier avec
// un budget d'échanges ADJACENTS égal au strict minimum (= nombre
// d'inversions de la permutation). Chaque échange compte, même s'il
// aggrave la situation : réfléchir avant de toucher.

function showExampleSwapSort(day, row, vals) {
    const ex = document.createElement('div');
    ex.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:8px;margin:6px auto;';

    // Colonne verticale (retour #73 : l'horizontal faisait défiler l'écran)
    const ligne = document.createElement('div');
    ligne.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:6px;justify-content:center;';
    [12, 45, 27, 63].forEach((v, i) => {
        const t = document.createElement('div');
        t.style.cssText = 'width:38px;height:38px;border-radius:9px;background:#4A6CFA;color:#FFFFFF;font-weight:900;font-size:.95rem;display:flex;align-items:center;justify-content:center;';
        t.textContent = v;
        if (i === 1 || i === 2) t.style.boxShadow = '0 0 0 2px #FFFFFF, 0 0 0 4px #F5B227';
        ligne.appendChild(t);
        if (i === 1) {
            const fl = document.createElement('div');
            fl.style.cssText = 'font-weight:900;color:#F5B227;font-size:1.1rem;';
            fl.textContent = '⇅';
            ligne.appendChild(fl);
        }
    });

    const note = document.createElement('div');
    note.style.cssText = 'font-size:.78rem;color:#8B90A0;font-weight:bold;';
    note.textContent = 'Échangez deux voisines pour trier de haut en bas';

    ex.append(ligne, note);
    row.style.flexDirection = 'column';
    row.append(ex);
}

function startGameSwapSort() {
    board.style.display = 'flex';
    board.style.flexDirection = 'column';
    board.style.alignItems = 'center';

    function compterInversions(arr) {
        let n = 0;
        for (let i = 0; i < arr.length; i++) {
            for (let j = i + 1; j < arr.length; j++) {
                if (arr[i] > arr[j]) n++;
            }
        }
        return n;
    }

    // 10 valeurs uniques 1..99, mélangées avec au moins 12 inversions
    let valeurs, inversions;
    do {
        const pool = new Set();
        while (pool.size < 10) pool.add(1 + Math.floor(Math.random() * 99));
        valeurs = [...pool].sort(() => Math.random() - 0.5);
        inversions = compterInversions(valeurs);
    } while (inversions < 12);

    // Budget = minimum exact d'échanges adjacents (nombre d'inversions)
    let budget = inversions;
    let sel = null;
    let fini = false;

    const hud = document.createElement('div');
    hud.style.cssText = 'font-weight:900;color:#23262F;font-size:1.25rem;margin-bottom:10px;text-align:center;';
    board.appendChild(hud);

    // Retour #73 : rangée VERTICALE — plus de défilement horizontal,
    // le tri se lit de haut (petit) en bas (grand)
    const rangee = document.createElement('div');
    rangee.style.cssText = 'display:flex;flex-direction:column;gap:8px;align-items:center;';
    board.appendChild(rangee);

    const aide = document.createElement('div');
    aide.style.cssText = 'font-size:.85rem;color:#8B90A0;font-weight:bold;margin-top:10px;text-align:center;';
    aide.textContent = 'On n\'échange que deux tuiles VOISINES · plus petit en haut';
    board.appendChild(aide);

    const astuce = document.createElement('div');
    astuce.style.cssText = 'font-size:.85rem;color:#8B90A0;font-style:italic;margin-top:12px;text-align:center;';
    astuce.textContent = '« Chaque échange compte — réfléchissez avant de toucher. »';
    board.appendChild(astuce);

    const solution = document.createElement('div');
    solution.style.cssText = 'display:none;flex-direction:column;align-items:center;gap:6px;margin-top:14px;';
    board.appendChild(solution);

    function renderHud() {
        const coul = budget <= 2 ? '#E0533D' : '#4A6CFA';
        hud.innerHTML = 'Échanges restants : <b style="color:' + coul + '">' + budget + '</b>';
    }

    function render(pulses) {
        renderHud();
        rangee.innerHTML = '';
        valeurs.forEach((v, i) => {
            const t = document.createElement('div');
            t.style.cssText = 'width:110px;height:42px;border-radius:10px;background:#4A6CFA;color:#FFFFFF;font-weight:900;font-size:1.1rem;display:flex;align-items:center;justify-content:center;flex-shrink:0;touch-action:manipulation;user-select:none;transition:transform .12s;';
            t.textContent = v;
            if (sel !== null) {
                if (sel === i) {
                    t.style.transform = 'translateX(8px)';
                    t.style.boxShadow = '0 0 0 3px #FFFFFF, 0 0 0 6px #F5B227';
                } else if (Math.abs(sel - i) === 1) {
                    // Voisine échangeable : anneau vert pulsant
                    t.style.boxShadow = '0 0 0 3px #FFFFFF, 0 0 0 6px #34B871';
                    t.style.animation = 'pulse 1s infinite';
                } else {
                    // Tuile hors de portée : estompée
                    t.style.opacity = '0.45';
                }
            }
            if (pulses && pulses.indexOf(i) !== -1) t.style.animation = 'pulse .3s';
            t.addEventListener('pointerdown', e => { e.preventDefault(); tap(i); });
            rangee.appendChild(t);
        });
    }

    function estTriee() {
        for (let i = 0; i < valeurs.length - 1; i++) {
            if (valeurs[i] > valeurs[i + 1]) return false;
        }
        return true;
    }

    function montrerSolution() {
        solution.style.display = 'flex';
        const lbl = document.createElement('div');
        lbl.style.cssText = 'font-size:.8rem;font-weight:bold;color:#8B90A0;letter-spacing:.1em;text-transform:uppercase;';
        lbl.textContent = 'Rangée attendue :';
        const ligne = document.createElement('div');
        ligne.style.cssText = 'display:flex;gap:6px;justify-content:center;';
        [...valeurs].sort((a, b) => a - b).forEach(v => {
            const t = document.createElement('div');
            t.style.cssText = 'width:38px;height:38px;border-radius:9px;background:#34B871;color:#FFFFFF;font-weight:900;font-size:.95rem;display:flex;align-items:center;justify-content:center;';
            t.textContent = v;
            ligne.appendChild(t);
        });
        solution.append(lbl, ligne);
    }

    function tap(i) {
        if (isPaused || fini) return;
        if (sel === null) { sel = i; haptic(6); render(); return; }
        if (sel === i) { sel = null; render(); return; }

        if (Math.abs(sel - i) === 1) {
            // Échange adjacent : coûte 1, même s'il aggrave
            const tmp = valeurs[sel];
            valeurs[sel] = valeurs[i];
            valeurs[i] = tmp;
            budget--;
            haptic(10);
            const bouges = [sel, i];
            sel = null;
            render(bouges);

            if (estTriee()) {
                fini = true;
                endGame('Rangée triée sans un échange de trop !', true);
            } else if (budget <= 0) {
                fini = true;
                montrerSolution();
                endGame('Budget épuisé — la rangée attendue est en vert.', false);
            }
        } else {
            // Tuile non adjacente : la sélection se déplace
            sel = i;
            haptic(6);
            render();
        }
    }

    render();
}
