// ─── Mode : Les Piles (jour 24) ──────────────────────────────────
// Fusion de couleurs façon Hexa Sort : 5 emplacements en rangée, des
// piles de 1 à 3 jetons colorés arrivent une à une (25 au total).
// On TAPE un emplacement pour y poser la pile courante ; ensuite les
// sommets de même couleur fusionnent en cascade entre emplacements
// VOISINS (le moins fourni donne sa série à l'autre), et 7 jetons
// identiques d'affilée au sommet s'envolent. Objectif : 4 envols
// avant la fin de la livraison, sans dépasser 12 jetons par pile.

const _PILES_COULEURS = ['#4A6CFA', '#34B871', '#F5B227', '#8B5CF6'];

// Un jeton : rectangle arrondi coloré (dimensions au choix de l'appelant)
function _pilesJeton(couleur, larg, haut) {
    const j = document.createElement('div');
    j.style.cssText = 'width:' + larg + 'px;height:' + haut + 'px;border-radius:5px;flex-shrink:0;' +
        'background:' + couleur + ';box-shadow:inset 0 -2px 0 rgba(0,0,0,.18),0 1px 2px rgba(35,38,47,.15);';
    return j;
}

// Une mini-pile empilée du bas vers le haut (couleurs = indices dans _PILES_COULEURS)
function _pilesMiniPile(couleurs, larg, haut) {
    const p = document.createElement('div');
    p.style.cssText = 'display:flex;flex-direction:column-reverse;align-items:center;gap:2px;';
    couleurs.forEach(c => p.appendChild(_pilesJeton(_PILES_COULEURS[c], larg, haut)));
    return p;
}

function showExamplePiles(day, row, vals) {
    const ex = document.createElement('div');
    ex.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:10px;margin:6px auto;';

    function miniSlot(couleurs) {
        const s = document.createElement('div');
        s.style.cssText = 'display:flex;flex-direction:column-reverse;align-items:center;gap:2px;' +
            'width:30px;height:64px;padding:3px 0;background:#EEF0F5;border-radius:7px;box-sizing:border-box;';
        couleurs.forEach(c => s.appendChild(_pilesJeton(_PILES_COULEURS[c], 22, 8)));
        return s;
    }

    const ligne = document.createElement('div');
    ligne.style.cssText = 'display:flex;align-items:flex-end;gap:10px;justify-content:center;';
    const fleche = document.createElement('div');
    fleche.style.cssText = 'font-weight:900;color:#8B90A0;font-size:1.2rem;align-self:center;';
    fleche.textContent = '→';
    // Avant : deux sommets verts voisins · Après : les verts réunis sur une seule pile
    ligne.append(miniSlot([0, 1, 1]), miniSlot([2, 1]), fleche, miniSlot([0]), miniSlot([2, 1, 1, 1]));

    const note = document.createElement('div');
    note.style.cssText = 'font-weight:bold;color:#8B90A0;font-size:.78rem;text-align:center;max-width:270px;';
    note.textContent = 'Deux sommets voisins de même couleur fusionnent. 7 jetons identiques d’affilée : ils s’envolent !';

    ex.append(ligne, note);
    row.style.flexDirection = 'column';
    row.append(ex);
}

function startGamePiles() {
    board.style.display = 'flex';
    board.style.flexDirection = 'column';
    board.style.alignItems = 'center';
    board.style.gap = '12px';

    const NB_SLOTS = 5;
    const HAUTEUR_MAX = 12;   // au-delà → débordement
    const SEUIL_ENVOL = 7;
    const OBJECTIF = 4;
    const NB_PILES = 25;

    // ── Livraison : 25 piles de 1 à 3 jetons, une ou deux couleurs ──
    // Couleurs légèrement pondérées pour que 4 envols restent atteignables.
    function tireCouleur() {
        const r = Math.random();
        if (r < 0.34) return 0;
        if (r < 0.62) return 1;
        if (r < 0.84) return 2;
        return 3;
    }

    function genPile() {
        const n = [1, 2, 2, 3, 3][Math.floor(Math.random() * 5)];
        const c1 = tireCouleur();
        const jetons = [];
        if (n > 1 && Math.random() < 0.45) {
            // Deux couleurs : deux séries superposées
            let c2 = tireCouleur();
            if (c2 === c1) c2 = (c1 + 1) % 4;
            const k = 1 + Math.floor(Math.random() * (n - 1));
            for (let i = 0; i < k; i++) jetons.push(c1);
            for (let i = k; i < n; i++) jetons.push(c2);
        } else {
            for (let i = 0; i < n; i++) jetons.push(c1);
        }
        return jetons;
    }

    const livraison = [];
    for (let i = 0; i < NB_PILES; i++) livraison.push(genPile());

    // ── État ────────────────────────────────────────────────────────
    const slots = [];
    for (let i = 0; i < NB_SLOTS; i++) slots.push([]);
    let idx = 2;                      // prochaine pile à faire entrer dans la file
    let courante = livraison[0];
    let suivante = livraison[1];
    let envols = 0;
    let over = false;

    // ── DOM ─────────────────────────────────────────────────────────
    const hud = document.createElement('div');
    hud.style.cssText = 'display:flex;align-items:center;gap:16px;flex-wrap:wrap;justify-content:center;';
    const envolsEl = document.createElement('div');
    envolsEl.style.cssText = 'font-weight:bold;color:#8B90A0;font-size:.95rem;';
    const restantesEl = document.createElement('div');
    restantesEl.style.cssText = 'font-weight:bold;color:#8B90A0;font-size:.95rem;';
    const suivanteWrap = document.createElement('div');
    suivanteWrap.style.cssText = 'display:flex;align-items:center;gap:6px;';
    const suivanteLbl = document.createElement('span');
    suivanteLbl.style.cssText = 'font-weight:bold;color:#8B90A0;font-size:.8rem;';
    suivanteLbl.textContent = 'Suivante :';
    const suivanteEl = document.createElement('div');
    suivanteWrap.append(suivanteLbl, suivanteEl);
    hud.append(envolsEl, restantesEl, suivanteWrap);
    board.appendChild(hud);

    const arrivee = document.createElement('div');
    arrivee.style.cssText = 'display:flex;align-items:center;gap:10px;min-height:58px;';
    const arriveeLbl = document.createElement('span');
    arriveeLbl.style.cssText = 'font-weight:900;color:#4A6CFA;font-size:.85rem;';
    arriveeLbl.textContent = 'À poser ↓';
    const couranteEl = document.createElement('div');
    arrivee.append(arriveeLbl, couranteEl);
    board.appendChild(arrivee);

    const zone = document.createElement('div');
    zone.style.cssText = 'display:flex;gap:8px;justify-content:center;align-items:flex-end;';
    board.appendChild(zone);

    const aide = document.createElement('div');
    aide.style.cssText = 'font-weight:bold;color:#8B90A0;font-size:.78rem;text-align:center;max-width:330px;line-height:1.35;';
    aide.textContent = 'Réunissez 7 jetons de même couleur d’affilée sur une pile : ils s’envolent ! ' +
        'Le compteur doré au-dessus d’une pile montre la série en cours.';
    board.appendChild(aide);

    const slotEls = [];

    // ── Logique ─────────────────────────────────────────────────────
    // Longueur de la série de couleur identique au sommet d'une pile
    function serieSommet(pile) {
        if (!pile.length) return 0;
        const c = pile[pile.length - 1];
        let k = 0;
        for (let i = pile.length - 1; i >= 0 && pile[i] === c; i--) k++;
        return k;
    }

    // Cascade ITÉRATIVE : envols puis une fusion par tour, 30 tours max.
    // Renvoie la liste des emplacements où un envol a eu lieu (pour l'effet).
    function cascade() {
        const envolsFaits = [];
        for (let iter = 0; iter < 30; iter++) {
            let bouge = false;

            // 1. Envols : 7+ jetons identiques d'affilée au sommet
            for (let i = 0; i < NB_SLOTS; i++) {
                const k = serieSommet(slots[i]);
                if (k >= SEUIL_ENVOL) {
                    slots[i].splice(slots[i].length - k, k);
                    envols++;
                    envolsFaits.push(i);
                    haptic([12, 40, 14]);
                    bouge = true;
                }
            }

            // 2. Une fusion entre voisins (la plus à gauche)
            for (let i = 0; i < NB_SLOTS - 1; i++) {
                const a = slots[i], b = slots[i + 1];
                if (!a.length || !b.length) continue;
                if (a[a.length - 1] !== b[b.length - 1]) continue;
                // Le slot le moins fourni (en jetons de cette couleur au sommet)
                // donne sa série à l'autre ; égalité → le moins haut donne.
                const ka = serieSommet(a), kb = serieSommet(b);
                let src, dst;
                if (ka < kb) { src = a; dst = b; }
                else if (kb < ka) { src = b; dst = a; }
                else if (a.length <= b.length) { src = a; dst = b; }
                else { src = b; dst = a; }
                const k = serieSommet(src);
                const serie = src.splice(src.length - k, k);
                for (let j = 0; j < serie.length; j++) dst.push(serie[j]);
                bouge = true;
                break;
            }

            if (!bouge) break;
        }
        return envolsFaits;
    }

    // ── Rendu ───────────────────────────────────────────────────────
    function render() {
        envolsEl.innerHTML = 'Envols : <b style="color:#4A6CFA">' + envols + '</b>/' + OBJECTIF;
        const posees = idx - (courante ? 1 : 0) - (suivante ? 1 : 0);
        restantesEl.innerHTML = 'Piles : <b style="color:#4A6CFA">' + posees + '</b>/' + NB_PILES;

        suivanteEl.innerHTML = '';
        if (suivante) suivanteEl.appendChild(_pilesMiniPile(suivante, 22, 8));

        couranteEl.innerHTML = '';
        if (courante) couranteEl.appendChild(_pilesMiniPile(courante, 40, 14));

        zone.innerHTML = '';
        slotEls.length = 0;
        for (let i = 0; i < NB_SLOTS; i++) {
            const slot = document.createElement('div');
            // Bordure rouge quand la pile frôle le débordement (12 max)
            const danger = slots[i].length > HAUTEUR_MAX - 3;
            slot.style.cssText = 'display:flex;flex-direction:column-reverse;align-items:center;gap:2px;' +
                'width:52px;height:208px;padding:4px 0;background:#EEF0F5;' +
                'border:2px dashed ' + (danger ? '#E0533D' : '#C2C7D6') + ';' +
                'border-radius:10px;box-sizing:border-box;position:relative;touch-action:manipulation;' +
                'flex-shrink:0;user-select:none;';
            slots[i].forEach(c => slot.appendChild(_pilesJeton(_PILES_COULEURS[c], 40, 14)));
            // Compteur de série au sommet : « k/7 » dès 2 jetons identiques d'affilée
            const k = serieSommet(slots[i]);
            if (k >= 2) {
                const chip = document.createElement('div');
                chip.style.cssText = 'position:absolute;top:-11px;left:50%;transform:translateX(-50%);' +
                    'background:#F5B227;color:#fff;font-weight:900;font-size:.66rem;padding:2px 7px;' +
                    'border-radius:9px;white-space:nowrap;pointer-events:none;box-shadow:0 1px 3px rgba(35,38,47,.25);';
                chip.textContent = k + '/' + SEUIL_ENVOL;
                slot.appendChild(chip);
            }
            const si = i;
            slot.addEventListener('pointerdown', e => {
                e.preventDefault();
                tap(si, slot);
            });
            slotEls.push(slot);
            zone.appendChild(slot);
        }
    }

    // Petit effet « envol » au-dessus d'un emplacement (positions calculées)
    function effetEnvol(i) {
        const el = slotEls[i];
        if (!el) return;
        const fx = document.createElement('div');
        fx.textContent = '✦ Envol !';
        fx.style.cssText = 'position:absolute;left:50%;bottom:110px;transform:translateX(-50%);' +
            'font-weight:900;font-size:.8rem;color:#F5B227;white-space:nowrap;pointer-events:none;' +
            'z-index:30;transition:transform .6s ease-out,opacity .6s ease-out;';
        el.appendChild(fx);
        setTimeout(() => {
            fx.style.transform = 'translateX(-50%) translateY(-52px)';
            fx.style.opacity = '0';
        }, 20);
        setTimeout(() => { if (fx.parentNode) fx.parentNode.removeChild(fx); }, 700);
    }

    // ── Interaction ─────────────────────────────────────────────────
    function tap(i, el) {
        if (isPaused || over || !courante) return;

        // Poser la pile courante au sommet de l'emplacement tapé
        for (let j = 0; j < courante.length; j++) slots[i].push(courante[j]);
        haptic(10);

        // Faire avancer la file d'arrivée
        courante = suivante;
        suivante = idx < livraison.length ? livraison[idx] : null;
        if (idx < livraison.length) idx++;

        const faits = cascade();
        render();
        faits.forEach(effetEnvol);

        // Fins de partie (la victoire prime : un envol peut sauver in extremis)
        if (envols >= OBJECTIF) {
            over = true;
            endGame('Quatre piles envolées — tri magistral !', true);
            return;
        }
        if (slots.some(s => s.length > HAUTEUR_MAX)) {
            over = true;
            endGame('Une pile a débordé !', false);
            return;
        }
        if (!courante) {
            over = true;
            endGame('La livraison est finie — il manquait des envols.', false);
        }
    }

    render();
}
