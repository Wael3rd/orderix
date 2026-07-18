// ─── Mode : Le Tri Minimal (ex-Échange Minimal) ──────────────────
// Retour #100 : les échanges adjacents étaient inratables (toute paire
// inversée est un coup sûr). Nouvelle mécanique : on GLISSE une tuile
// n'importe où dans la colonne (insertion). Budget = minimum théorique
// = 10 − longueur de la plus longue sous-suite croissante. Le puzzle :
// trouver quelles tuiles NE PAS bouger.

function showExampleSwapSort(day, row, vals) {
    const ex = document.createElement('div');
    ex.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:8px;margin:6px auto;';

    const ligne = document.createElement('div');
    ligne.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:6px;justify-content:center;';
    [12, 63, 27, 45].forEach((v, i) => {
        const t = document.createElement('div');
        t.style.cssText = 'width:38px;height:38px;border-radius:9px;background:#4A6CFA;color:#FFFFFF;font-weight:900;font-size:.95rem;display:flex;align-items:center;justify-content:center;';
        t.textContent = v;
        // Le 63 est la seule tuile à déplacer (vers le bas)
        if (i === 1) t.style.boxShadow = '0 0 0 2px #FFFFFF, 0 0 0 4px #F5B227';
        ligne.appendChild(t);
    });
    const fl = document.createElement('div');
    fl.style.cssText = 'font-weight:900;color:#F5B227;font-size:1.1rem;';
    fl.textContent = '⤵ le 63 glisse tout en bas : trié en 1 coup !';
    fl.style.fontSize = '.78rem';

    const note = document.createElement('div');
    note.style.cssText = 'font-size:.78rem;color:#8B90A0;font-weight:bold;max-width:270px;text-align:center;';
    note.textContent = 'Glissez une tuile où vous voulez. Déplacements comptés — trouvez lesquelles ne pas bouger !';

    ex.append(ligne, fl, note);
    row.style.flexDirection = 'column';
    row.append(ex);
}

function startGameSwapSort() {
    board.style.display = 'flex';
    board.style.flexDirection = 'column';
    board.style.alignItems = 'center';

    const N = 10;

    // Longueur de la plus longue sous-suite croissante (O(n²) suffit)
    function lisLen(arr) {
        const dp = new Array(arr.length).fill(1);
        for (let i = 1; i < arr.length; i++) {
            for (let j = 0; j < i; j++) {
                if (arr[j] < arr[i] && dp[j] + 1 > dp[i]) dp[i] = dp[j] + 1;
            }
        }
        return Math.max(...dp);
    }

    // 10 valeurs uniques 1..99 ; minimum de déplacements entre 5 et 7
    // pour une vraie réflexion (ni trivial, ni interminable)
    let valeurs, minimum;
    do {
        const pool = new Set();
        while (pool.size < N) pool.add(1 + Math.floor(Math.random() * 99));
        valeurs = [...pool].sort(() => Math.random() - 0.5);
        minimum = N - lisLen(valeurs);
    } while (minimum < 5 || minimum > 7);

    let budget = minimum;
    let fini = false;

    const hud = document.createElement('div');
    hud.style.cssText = 'font-weight:900;color:#23262F;font-size:1.25rem;margin-bottom:10px;text-align:center;';
    board.appendChild(hud);

    const rangee = document.createElement('div');
    rangee.style.cssText = 'display:flex;flex-direction:column;gap:6px;align-items:center;';
    board.appendChild(rangee);

    const aide = document.createElement('div');
    aide.style.cssText = 'font-size:.85rem;color:#8B90A0;font-weight:bold;margin-top:10px;text-align:center;max-width:300px;';
    aide.textContent = 'Glissez une tuile à sa place · plus petit en haut · remettre une tuile où elle était ne coûte rien';
    board.appendChild(aide);

    const astuce = document.createElement('div');
    astuce.style.cssText = 'font-size:.85rem;color:#8B90A0;font-style:italic;margin-top:12px;text-align:center;';
    astuce.textContent = '« Le secret : repérer les tuiles déjà bien ordonnées entre elles, et ne bouger que les autres. »';
    board.appendChild(astuce);

    const solution = document.createElement('div');
    solution.style.cssText = 'display:none;flex-direction:column;align-items:center;gap:6px;margin-top:14px;';
    board.appendChild(solution);

    function renderHud() {
        const coul = budget <= 1 ? '#E0533D' : '#4A6CFA';
        hud.innerHTML = 'Déplacements restants : <b style="color:' + coul + '">' + budget + '</b>';
    }

    // ── Glisser-déposer (écouteurs sur document, clone sous le doigt) ─
    const drag = { idx: -1, insertIdx: -1, clone: null, dx: 0, dy: 0 };

    function insertIdxFromY(y) {
        // Position d'insertion parmi les tuiles restantes (sans la glissée)
        let idx = 0;
        for (let i = 0; i < rangee.children.length; i++) {
            const el = rangee.children[i];
            if (el.dataset.hole === '1') continue;
            const r = el.getBoundingClientRect();
            if (y > r.top + r.height / 2) idx++;
        }
        return Math.min(idx, N - 1);
    }

    function onDragMove(e) {
        if (drag.idx === -1) return;
        drag.clone.style.left = (e.clientX - drag.dx) + 'px';
        drag.clone.style.top = (e.clientY - drag.dy) + 'px';
        const idx = insertIdxFromY(e.clientY);
        if (idx !== drag.insertIdx) {
            drag.insertIdx = idx;
            render();
        }
    }

    function onDragEnd() {
        document.removeEventListener('pointermove', onDragMove);
        document.removeEventListener('pointerup', onDragEnd);
        document.removeEventListener('pointercancel', onDragEnd);
        if (drag.idx === -1) return;
        if (drag.clone && drag.clone.parentNode) drag.clone.parentNode.removeChild(drag.clone);
        const from = drag.idx, to = drag.insertIdx;
        drag.idx = -1;
        drag.clone = null;
        drag.insertIdx = -1;
        if (to !== from) {
            const v = valeurs.splice(from, 1)[0];
            valeurs.splice(to, 0, v);
            budget--;
            haptic(10);
        }
        render();
        if (estTriee()) {
            fini = true;
            endGame('Colonne triée au déplacement près — tri minimal réussi !', true);
        } else if (budget <= 0) {
            fini = true;
            montrerSolution();
            endGame('Plus de déplacements — la colonne attendue est en vert.', false);
        }
    }

    function startDrag(i, e, sourceEl) {
        if (isPaused || fini || drag.idx !== -1) return;
        drag.idx = i;
        drag.insertIdx = i;
        const rect = sourceEl.getBoundingClientRect();
        drag.dx = e.clientX - rect.left;
        drag.dy = e.clientY - rect.top;
        const clone = document.createElement('div');
        clone.style.cssText = 'width:110px;height:42px;border-radius:10px;background:#3553D1;color:#FFFFFF;' +
            'font-weight:900;font-size:1.1rem;display:flex;align-items:center;justify-content:center;' +
            'position:fixed;z-index:60;pointer-events:none;box-shadow:0 8px 22px rgba(35,38,47,.3);' +
            'left:' + rect.left + 'px;top:' + rect.top + 'px;';
        clone.textContent = valeurs[i];
        document.body.appendChild(clone);
        drag.clone = clone;
        haptic(6);
        document.addEventListener('pointermove', onDragMove);
        document.addEventListener('pointerup', onDragEnd);
        document.addEventListener('pointercancel', onDragEnd);
        render();
    }

    function render() {
        renderHud();
        rangee.innerHTML = '';

        // Ordre affiché : tuile glissée retirée + trou pointillé à l'insertion
        let display = valeurs.map((v, i) => ({ v: v, i: i }));
        if (drag.idx !== -1) {
            display = display.filter(x => x.i !== drag.idx);
            display.splice(drag.insertIdx, 0, { hole: true });
        }

        display.forEach(item => {
            if (item.hole) {
                const h = document.createElement('div');
                h.dataset.hole = '1';
                h.style.cssText = 'width:110px;height:42px;border-radius:10px;border:2px dashed #4A6CFA;' +
                    'background:#EEF2FF;box-sizing:border-box;';
                rangee.appendChild(h);
                return;
            }
            const t = document.createElement('div');
            t.style.cssText = 'width:110px;height:42px;border-radius:10px;background:#4A6CFA;color:#FFFFFF;' +
                'font-weight:900;font-size:1.1rem;display:flex;align-items:center;justify-content:center;' +
                'flex-shrink:0;touch-action:none;user-select:none;cursor:grab;';
            t.textContent = item.v;
            const i = item.i;
            t.addEventListener('pointerdown', e => {
                e.preventDefault();
                startDrag(i, e, t);
            });
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
        lbl.textContent = 'Colonne attendue :';
        const ligne = document.createElement('div');
        ligne.style.cssText = 'display:flex;gap:6px;justify-content:center;flex-wrap:wrap;max-width:340px;';
        [...valeurs].sort((a, b) => a - b).forEach(v => {
            const t = document.createElement('div');
            t.style.cssText = 'width:38px;height:38px;border-radius:9px;background:#34B871;color:#FFFFFF;font-weight:900;font-size:.95rem;display:flex;align-items:center;justify-content:center;';
            t.textContent = v;
            ligne.appendChild(t);
        });
        solution.append(lbl, ligne);
    }

    render();
}
