// ─── Mode : La File ──────────────────────────────────────────────
// 6 clientes en file, tickets 1..6 mélangés. Le guichet ne sert que
// le plus petit ticket restant. La cliente en tête est servie si
// c'est son tour, sinon on peut l'envoyer s'asseoir (4 sièges).
// Une cliente assise est servie dès que son ticket est appelé.
// Si la tête n'est pas servable et que les 4 sièges sont pleins :
// tout le monde est coincé.

function showExampleFileBloquee(day, row, vals) {
    const PASTEL = ['', '#DCE4FF', '#D6F0E2', '#FDEDC9', '#F9DDD7', '#E4E8F5', '#DFEDF9'];
    const ex = document.createElement('div');
    ex.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:8px;margin:6px auto;';

    const ligne = document.createElement('div');
    ligne.style.cssText = 'display:flex;align-items:center;gap:8px;justify-content:center;';

    const guichet = document.createElement('div');
    guichet.style.cssText = 'padding:8px 6px;border:2px solid #C7D2F5;background:#EEF2FF;border-radius:10px;font-weight:900;font-size:.58rem;letter-spacing:.08em;color:#3553D1;';
    guichet.textContent = 'GUICHET';

    const fleche = document.createElement('div');
    fleche.style.cssText = 'font-weight:900;color:#F5B227;font-size:1.1rem;';
    fleche.textContent = '◄';

    ligne.append(guichet, fleche);
    [2, 1, 3].forEach((t, i) => {
        const c = document.createElement('div');
        c.style.cssText = 'width:34px;height:34px;border-radius:50%;background:' + PASTEL[t] + ';border:2px solid #C7D2F5;color:#23262F;font-weight:900;font-size:.9rem;display:flex;align-items:center;justify-content:center;';
        c.textContent = t;
        if (i === 0) c.style.boxShadow = '0 0 0 2px #FFFFFF, 0 0 0 4px #F5B227';
        ligne.appendChild(c);
    });

    const note = document.createElement('div');
    note.style.cssText = 'font-size:.78rem;color:#8B90A0;font-weight:bold;';
    note.textContent = 'Le ticket 2 doit patienter sur un siège';

    ex.append(ligne, note);
    row.style.flexDirection = 'column';
    row.append(ex);
}

function startGameFileBloquee() {
    board.style.display = 'flex';
    board.style.flexDirection = 'column';
    board.style.alignItems = 'center';

    const PASTEL = ['', '#DCE4FF', '#D6F0E2', '#FDEDC9', '#F9DDD7', '#E4E8F5', '#DFEDF9'];

    // Ordre de file nécessitant au moins 2 mises en attente,
    // vérifié gagnable par simulation gloutonne (jamais plus de 4 assises)
    function generer() {
        for (let essai = 0; essai < 500; essai++) {
            const ordre = [1, 2, 3, 4, 5, 6].sort(() => Math.random() - 0.5);
            const q = ordre.slice();
            const assis = [];
            let proch = 1, mises = 0, ok = true;
            while (proch <= 6) {
                const i = assis.indexOf(proch);
                if (i !== -1) { assis.splice(i, 1); proch++; continue; }
                if (q.length && q[0] === proch) { q.shift(); proch++; continue; }
                if (!q.length || assis.length >= 4) { ok = false; break; }
                assis.push(q.shift());
                mises++;
            }
            if (ok && mises >= 2) return ordre;
        }
        return [3, 4, 1, 2, 6, 5];
    }

    const file = generer();          // tête = index 0 (à gauche)
    const sieges = [null, null, null, null];
    let prochain = 1;
    let selTete = false;
    let busy = false;
    let fini = false;

    const hud = document.createElement('div');
    hud.style.cssText = 'display:flex;gap:18px;align-items:center;justify-content:center;font-weight:bold;color:#8B90A0;font-size:.95rem;margin-bottom:6px;';
    board.appendChild(hud);

    const ligne = document.createElement('div');
    ligne.style.cssText = 'display:flex;align-items:center;gap:8px;justify-content:center;flex-wrap:nowrap;';
    board.appendChild(ligne);

    const salle = document.createElement('div');
    salle.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:8px;margin-top:14px;';
    board.appendChild(salle);

    function cercleCliente(t, taille) {
        const c = document.createElement('div');
        c.style.cssText = 'width:' + taille + 'px;height:' + taille + 'px;border-radius:50%;background:' + PASTEL[t] + ';border:2px solid #C7D2F5;color:#23262F;font-weight:900;font-size:1.05rem;display:flex;align-items:center;justify-content:center;flex-shrink:0;touch-action:manipulation;user-select:none;transition:transform .15s;';
        c.textContent = t;
        return c;
    }

    function render() {
        hud.innerHTML = '<span>Au guichet : <b style="color:#4A6CFA">ticket ' + Math.min(prochain, 6) + '</b></span>' +
            '<span>Servies <b style="color:#34B871">' + (prochain - 1) + '/6</b></span>';

        // File : guichet ◄ tête ... queue
        ligne.innerHTML = '';
        const guichet = document.createElement('div');
        guichet.style.cssText = 'padding:12px 8px;border:2px solid #C7D2F5;background:#EEF2FF;border-radius:12px;font-weight:900;font-size:.62rem;letter-spacing:.08em;color:#3553D1;flex-shrink:0;';
        guichet.textContent = 'GUICHET';
        const fleche = document.createElement('div');
        fleche.style.cssText = 'font-weight:900;color:#F5B227;font-size:1.2rem;flex-shrink:0;';
        fleche.textContent = '◄';
        ligne.append(guichet, fleche);

        file.forEach((t, i) => {
            const c = cercleCliente(t, i === 0 ? 50 : 44);
            if (i === 0) {
                if (selTete) {
                    c.style.transform = 'translateY(-6px)';
                    c.style.boxShadow = '0 0 0 3px #FFFFFF, 0 0 0 6px #F5B227';
                }
                c.addEventListener('pointerdown', e => { e.preventDefault(); tapTete(c); });
            } else {
                c.style.opacity = '.75';
                c.addEventListener('pointerdown', e => {
                    e.preventDefault();
                    if (isPaused || fini || busy) return;
                    haptic(30);
                    c.style.animation = 'wobble .3s';
                    setTimeout(() => { c.style.animation = ''; }, 320);
                });
            }
            ligne.appendChild(c);
        });

        // Salle d'attente : 4 sièges en 2×2
        salle.innerHTML = '';
        const lbl = document.createElement('div');
        lbl.style.cssText = 'font-size:.72rem;font-weight:bold;letter-spacing:.12em;text-transform:uppercase;color:#8B90A0;';
        lbl.textContent = 'Salle d’attente';
        const grille = document.createElement('div');
        grille.style.cssText = 'display:grid;grid-template-columns:repeat(2,58px);gap:10px;justify-content:center;';
        for (let k = 0; k < 4; k++) {
            const slot = document.createElement('div');
            slot.style.cssText = 'width:56px;height:56px;border-radius:50%;border:2px dashed #8B90A0;display:flex;align-items:center;justify-content:center;touch-action:manipulation;';
            if (sieges[k] !== null) {
                const c = cercleCliente(sieges[k], 46);
                c.addEventListener('pointerdown', e => { e.preventDefault(); tapAssise(k, c); });
                slot.appendChild(c);
            } else {
                if (selTete) slot.style.borderColor = '#F5B227';
                slot.addEventListener('pointerdown', e => { e.preventDefault(); tapSiegeVide(k); });
            }
            grille.appendChild(slot);
        }
        salle.append(lbl, grille);
    }

    // Animation de service : la cliente disparaît, puis on réaffiche
    function servir(el) {
        selTete = false;
        resultDisplay.textContent = '';
        busy = true;
        el.style.transition = 'transform .22s ease, opacity .22s ease';
        el.style.transform = 'scale(0)';
        el.style.opacity = '0';
        haptic([10, 30, 10]);
        if (prochain > 6) {
            fini = true;
            endGame('Les six clientes sont servies — file parfaite !', true);
            return;
        }
        setTimeout(() => {
            busy = false;
            if (isPaused || fini) return;
            render();
            verifBlocage();
        }, 240);
    }

    function verifBlocage() {
        if (fini || !file.length) return;
        if (file[0] === prochain) return;
        if (sieges.indexOf(prochain) !== -1) return;
        if (sieges.some(s => s === null)) return;
        fini = true;
        endGame('Tout le monde est coincé !', false);
    }

    function tapTete(el) {
        if (isPaused || fini || busy) return;
        if (file[0] === prochain) {
            file.shift();
            prochain++;
            servir(el);
            return;
        }
        // Pas son tour : on la sélectionne pour l'envoyer s'asseoir
        selTete = !selTete;
        haptic(6);
        resultDisplay.textContent = selTete ? 'Choisissez un siège libre' : '';
        resultDisplay.style.color = '#8B90A0';
        render();
    }

    function tapSiegeVide(k) {
        if (isPaused || fini || busy || !selTete) return;
        sieges[k] = file.shift();
        selTete = false;
        resultDisplay.textContent = '';
        haptic(10);
        render();
        verifBlocage();
    }

    function tapAssise(k, el) {
        if (isPaused || fini || busy) return;
        if (sieges[k] === prochain) {
            sieges[k] = null;
            prochain++;
            servir(el);
        } else {
            haptic(40);
            el.style.animation = 'wobble .3s';
            setTimeout(() => { el.style.animation = ''; }, 320);
        }
    }

    render();
}
