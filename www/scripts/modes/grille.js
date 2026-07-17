// ─── Mode : La Grille ────────────────────────────────────────────
// Un carré de tuiles numérotées mélangées à remettre en ordre de
// lecture (1-2-3 / 4-5-6 / 7-8-9). Contrainte : on ne peut échanger
// une tuile qu'avec une voisine qui la touche — horizontale,
// verticale OU diagonale (8-connexité). Manche 1 : 3×3, manche 2 : 4×4.

function showExampleGrille(day, row, vals) {
    const ex = document.createElement('div');
    ex.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:8px;margin:6px auto;';

    const mini = document.createElement('div');
    mini.style.cssText = 'display:grid;grid-template-columns:repeat(3,30px);gap:5px;';
    const chiffres = [3, 1, 7, 5, 2, 9, 4, 8, 6];
    const selPos = 4; // tuile centrale sélectionnée : toutes les autres la touchent
    chiffres.forEach((v, i) => {
        const t = document.createElement('div');
        t.style.cssText = 'width:30px;height:30px;border-radius:7px;background:#4A6CFA;color:#FFFFFF;font-weight:900;font-size:.8rem;display:flex;align-items:center;justify-content:center;';
        t.textContent = v;
        if (i === selPos) {
            t.style.boxShadow = '0 0 0 2px #FFFFFF, 0 0 0 4px #4A6CFA';
        } else {
            t.style.boxShadow = '0 0 0 2px #FFFFFF, 0 0 0 3px #34B871';
        }
        mini.appendChild(t);
    });

    const note = document.createElement('div');
    note.style.cssText = 'font-size:.78rem;color:#8B90A0;font-weight:bold;text-align:center;';
    note.textContent = 'Échangez avec une voisine (même en diagonale)';

    ex.append(mini, note);
    row.style.flexDirection = 'column';
    row.append(ex);
}

function startGameGrille() {
    board.style.display = 'flex';
    board.style.flexDirection = 'column';
    board.style.alignItems = 'center';

    currentRound = 1;
    totalRounds = 2;

    // Animation d'anneau vert pulsant pour les voisines (nettoyée avec le board)
    const styleAnim = document.createElement('style');
    styleAnim.textContent = '@keyframes grillePulse{0%,100%{box-shadow:0 0 0 2px #FFFFFF,0 0 0 5px #34B871}50%{box-shadow:0 0 0 2px #FFFFFF,0 0 0 8px rgba(52,184,113,.55)}}';
    board.appendChild(styleAnim);

    const hud = document.createElement('div');
    hud.style.cssText = 'font-weight:900;color:#23262F;font-size:1.15rem;margin-bottom:12px;text-align:center;';
    board.appendChild(hud);

    const grille = document.createElement('div');
    grille.style.cssText = 'display:grid;gap:8px;justify-content:center;';
    board.appendChild(grille);

    const astuce = document.createElement('div');
    astuce.style.cssText = 'font-size:.85rem;color:#8B90A0;font-style:italic;margin-top:12px;text-align:center;max-width:300px;';
    astuce.textContent = '« Une tuile s’échange avec celles qui la touchent — même en diagonale. »';
    board.appendChild(astuce);

    let taille = 3;      // 3 puis 4
    let tuiles = [];     // tuiles[position] = valeur
    let sel = null;
    let echanges = 0;
    let fini = false;

    function melanger(n) {
        // Permutation aléatoire avec au moins 5 tuiles mal placées
        let perm, malPlacees;
        do {
            perm = [];
            for (let i = 1; i <= n * n; i++) perm.push(i);
            for (let i = perm.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                const tmp = perm[i]; perm[i] = perm[j]; perm[j] = tmp;
            }
            malPlacees = perm.filter((v, i) => v !== i + 1).length;
        } while (malPlacees < 5);
        return perm;
    }

    function sontVoisines(a, b) {
        const ra = Math.floor(a / taille), ca = a % taille;
        const rb = Math.floor(b / taille), cb = b % taille;
        return a !== b && Math.abs(ra - rb) <= 1 && Math.abs(ca - cb) <= 1;
    }

    function renderHud() {
        hud.innerHTML = 'Manche <b>' + currentRound + '/' + totalRounds + '</b>' +
            ' · Échanges : <b style="color:#4A6CFA">' + echanges + '</b>';
    }

    function render(pulses) {
        renderHud();
        const px = taille === 3 ? 64 : 48;
        const fs = taille === 3 ? '1.4rem' : '1.1rem';
        grille.style.gridTemplateColumns = 'repeat(' + taille + ',' + px + 'px)';
        grille.innerHTML = '';
        tuiles.forEach((v, i) => {
            const t = document.createElement('div');
            t.style.cssText = 'position:relative;width:' + px + 'px;height:' + px + 'px;border-radius:12px;background:#4A6CFA;color:#FFFFFF;font-weight:900;font-size:' + fs + ';display:flex;align-items:center;justify-content:center;touch-action:manipulation;user-select:none;transition:transform .12s,opacity .15s;';
            t.textContent = v;

            if (v === i + 1) {
                // Tuile déjà à sa place définitive : fond vert pâle + ✓ discret
                t.style.background = '#E3F7ED';
                t.style.color = '#34B871';
                const coche = document.createElement('span');
                coche.style.cssText = 'position:absolute;top:2px;right:5px;font-size:.55rem;font-weight:bold;color:#34B871;opacity:.7;';
                coche.textContent = '✓';
                t.appendChild(coche);
            }

            if (sel !== null) {
                if (i === sel) {
                    t.style.boxShadow = '0 0 0 3px #FFFFFF, 0 0 0 6px #4A6CFA';
                    t.style.transform = 'scale(1.06)';
                } else if (sontVoisines(sel, i)) {
                    t.style.animation = 'grillePulse .9s ease-in-out infinite';
                } else {
                    t.style.opacity = '0.45';
                }
            }
            if (pulses && pulses.indexOf(i) !== -1) t.style.animation = 'pulse .3s';

            t.addEventListener('pointerdown', e => { e.preventDefault(); tap(i); });
            grille.appendChild(t);
        });
    }

    function estRangee() {
        for (let i = 0; i < tuiles.length; i++) {
            if (tuiles[i] !== i + 1) return false;
        }
        return true;
    }

    function nouvelleManche() {
        tuiles = melanger(taille);
        sel = null;
        render();
    }

    function tap(i) {
        if (isPaused || fini) return;
        if (sel === null) { sel = i; haptic(6); render(); return; }
        if (sel === i) { sel = null; render(); return; }

        if (sontVoisines(sel, i)) {
            // Échange avec une voisine
            const tmp = tuiles[sel];
            tuiles[sel] = tuiles[i];
            tuiles[i] = tmp;
            echanges++;
            haptic(10);
            const bouges = [sel, i];
            sel = null;
            render(bouges);

            if (estRangee()) {
                if (currentRound < totalRounds) {
                    currentRound++;
                    taille = 4;
                    resultDisplay.textContent = 'Grille rangée — place au 4×4 !';
                    resultDisplay.style.color = '#34B871';
                    haptic([12, 40, 12]);
                    setTimeout(() => {
                        if (isPaused) return;
                        resultDisplay.textContent = '';
                        nouvelleManche();
                    }, 700);
                } else {
                    fini = true;
                    endGame('Les deux grilles sont rangées en ' + echanges + ' échanges !', true);
                }
            }
        } else {
            // Tuile non voisine : la sélection se déplace
            sel = i;
            haptic(6);
            render();
        }
    }

    nouvelleManche();
}
