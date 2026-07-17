// ─── Mode : Les Étagères ─────────────────────────────────────────
// 3 étagères de 4 emplacements, 12 tuiles-nombres formant 3 suites
// consécutives toutes mélangées. On échange deux tuiles n'importe où
// (pas seulement adjacentes). Objectif : chaque étagère porte une
// suite complète en ordre croissant (n'importe quelle suite sur
// n'importe quelle étagère). Budget : 14 échanges.

function showExampleEtageres(day, row, vals) {
    const ex = document.createElement('div');
    ex.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:8px;margin:6px auto;';

    const etagere = document.createElement('div');
    etagere.style.cssText = 'display:flex;flex-direction:column;align-items:center;';
    const ligne = document.createElement('div');
    ligne.style.cssText = 'display:flex;gap:5px;';
    [3, 4, 5, 6].forEach(v => {
        const t = document.createElement('div');
        t.style.cssText = 'width:34px;height:34px;border-radius:8px;background:#EEF2FF;border:2px solid #C7D2F5;color:#23262F;font-weight:900;font-size:.9rem;display:flex;align-items:center;justify-content:center;';
        t.textContent = v;
        ligne.appendChild(t);
    });
    const planche = document.createElement('div');
    planche.style.cssText = 'width:170px;height:7px;background:#8B90A0;border-radius:4px;margin-top:3px;';
    etagere.append(ligne, planche);

    const note = document.createElement('div');
    note.style.cssText = 'font-size:.78rem;color:#8B90A0;font-weight:bold;';
    note.textContent = 'Une suite complète et croissante par étagère';

    ex.append(etagere, note);
    row.style.flexDirection = 'column';
    row.append(ex);
}

function startGameEtageres() {
    board.style.display = 'flex';
    board.style.flexDirection = 'column';
    board.style.alignItems = 'center';

    const BUDGET = 14;

    // 3 suites consécutives de 4, séparées d'au moins 2 (aucune
    // ambiguïté : 4 valeurs consécutives = forcément une suite entière)
    const d1 = 1 + Math.floor(Math.random() * 7);
    const d2 = d1 + 5 + Math.floor(Math.random() * 5);
    const d3 = d2 + 5 + Math.floor(Math.random() * 5);
    const suites = [d1, d2, d3].map(d => [d, d + 1, d + 2, d + 3]);
    const toutes = [].concat(suites[0], suites[1], suites[2]);

    // Minimum d'échanges quelconques vers la meilleure cible
    // (n'importe quelle suite sur n'importe quelle étagère) :
    // 12 - nombre de cycles, minimisé sur les 6 affectations
    function minEchanges(cases) {
        const ordres = [[0, 1, 2], [0, 2, 1], [1, 0, 2], [1, 2, 0], [2, 0, 1], [2, 1, 0]];
        let meilleur = Infinity, meilleureCible = null;
        for (const p of ordres) {
            const cible = [].concat(suites[p[0]], suites[p[1]], suites[p[2]]);
            const posCible = {};
            cible.forEach((v, i) => { posCible[v] = i; });
            const vu = new Array(12).fill(false);
            let cycles = 0;
            for (let i = 0; i < 12; i++) {
                if (vu[i]) continue;
                cycles++;
                let j = i;
                while (!vu[j]) { vu[j] = true; j = posCible[cases[j]]; }
            }
            const n = 12 - cycles;
            if (n < meilleur) { meilleur = n; meilleureCible = cible; }
        }
        return { n: meilleur, cible: meilleureCible };
    }

    // Mélange : ni trivial (≥ 4 échanges) ni au-delà de la marge (≤ 9)
    let cases;
    for (let essai = 0; essai < 300; essai++) {
        cases = [...toutes].sort(() => Math.random() - 0.5);
        const m = minEchanges(cases).n;
        if (m >= 4 && m <= 9) break;
    }

    let budget = BUDGET;
    let sel = null;
    let fini = false;

    const hud = document.createElement('div');
    hud.style.cssText = 'font-weight:900;color:#23262F;font-size:1.2rem;margin-bottom:8px;text-align:center;';
    board.appendChild(hud);

    const zone = document.createElement('div');
    zone.style.cssText = 'display:flex;flex-direction:column;gap:16px;align-items:center;';
    board.appendChild(zone);

    const rangees = [];

    function renderHud() {
        const coul = budget <= 3 ? '#E0533D' : '#4A6CFA';
        hud.innerHTML = 'Échanges restants : <b style="color:' + coul + '">' + budget + '</b>';
    }

    function render(pulses) {
        renderHud();
        zone.innerHTML = '';
        rangees.length = 0;
        for (let e = 0; e < 3; e++) {
            const wrap = document.createElement('div');
            wrap.style.cssText = 'display:flex;flex-direction:column;align-items:center;';
            const ligne = document.createElement('div');
            ligne.style.cssText = 'display:flex;gap:8px;';
            for (let s = 0; s < 4; s++) {
                const idx = e * 4 + s;
                const t = document.createElement('div');
                t.style.cssText = 'width:56px;height:56px;border-radius:10px;background:#EEF2FF;border:2px solid #C7D2F5;color:#23262F;font-weight:900;font-size:1.15rem;display:flex;align-items:center;justify-content:center;flex-shrink:0;touch-action:manipulation;user-select:none;transition:transform .12s;';
                t.textContent = cases[idx];
                if (sel === idx) {
                    t.style.transform = 'translateY(-4px)';
                    t.style.borderColor = '#F5B227';
                    t.style.boxShadow = '0 0 0 3px #FFFFFF, 0 0 0 5px #F5B227';
                }
                if (pulses && pulses.indexOf(idx) !== -1) t.style.animation = 'pulse .3s';
                t.addEventListener('pointerdown', ev => { ev.preventDefault(); tap(idx); });
                ligne.appendChild(t);
            }
            const planche = document.createElement('div');
            planche.style.cssText = 'width:264px;height:8px;background:#8B90A0;border-radius:4px;margin-top:4px;box-shadow:0 2px 0 rgba(35,38,47,.15);';
            wrap.append(ligne, planche);
            rangees.push(wrap);
            zone.appendChild(wrap);
        }
    }

    function estGagne() {
        for (let e = 0; e < 3; e++) {
            for (let s = 0; s < 3; s++) {
                if (cases[e * 4 + s] + 1 !== cases[e * 4 + s + 1]) return false;
            }
        }
        return true;
    }

    // À la défaite : surligner en vert une étagère correcte possible
    function montrerEtagerePossible() {
        const cible = minEchanges(cases).cible;
        // Étagère dont le contenu actuel est le plus proche de sa cible
        let choix = 0, meilleurScore = -1;
        for (let e = 0; e < 3; e++) {
            let score = 0;
            for (let s = 0; s < 4; s++) {
                if (cases[e * 4 + s] === cible[e * 4 + s]) score++;
            }
            if (score > meilleurScore) { meilleurScore = score; choix = e; }
        }
        const wrap = rangees[choix];
        wrap.style.borderRadius = '14px';
        wrap.style.boxShadow = '0 0 0 3px #34B871';
        wrap.style.padding = '6px';
        const sol = document.createElement('div');
        sol.style.cssText = 'margin-top:6px;font-weight:900;font-size:.9rem;color:#34B871;';
        sol.textContent = 'Ici : ' + cible.slice(choix * 4, choix * 4 + 4).join(' · ');
        wrap.appendChild(sol);
    }

    function tap(i) {
        if (isPaused || fini) return;
        if (sel === null) { sel = i; haptic(6); render(); return; }
        if (sel === i) { sel = null; render(); return; }

        // Échange libre des deux tuiles
        const tmp = cases[sel];
        cases[sel] = cases[i];
        cases[i] = tmp;
        budget--;
        haptic(10);
        const bouges = [sel, i];
        sel = null;
        render(bouges);

        if (estGagne()) {
            fini = true;
            endGame('Trois étagères parfaitement rangées !', true);
        } else if (budget <= 0) {
            fini = true;
            montrerEtagerePossible();
            endGame('Budget épuisé — une étagère possible est en vert.', false);
        }
    }

    render();
}
