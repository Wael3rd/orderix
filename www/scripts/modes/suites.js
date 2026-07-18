// ─── Mode : Les Suites ───────────────────────────────────────────
// Spider Solitaire miniature à chiffres : 20 cartes (deux jeux de
// 1 à 10, pas d'enseignes), 5 colonnes de 4 cartes, tout est face
// visible. On déplace une carte et tout paquet en suite décroissante
// consécutive posé dessus (7-6-5…), soit sur une carte de valeur
// exactement supérieure de 1, soit sur une colonne vide. Dès qu'une
// colonne aligne 10→1, la suite s'envole ; deux suites envolées =
// victoire. Annulation illimitée, pas de défaite : le chrono global
// départage. Donne vérifiée résoluble par solveur DFS mémoïsé
// (repli quasi trié garanti après 50 tentatives).

const _SUI_MAX = 10;   // valeurs 1..10
const _SUI_NCOL = 5;   // 5 colonnes de 4 cartes

// ─── Solveur DFS mémoïsé (états canonisés : colonnes triées) ─────
// Prouve qu'une donne est résoluble. Coups explorés : tout suffixe
// en suite décroissante consécutive vers une carte tête+1 ou une
// colonne vide (une seule colonne vide testée : elles sont
// équivalentes). Les suites 10→1 complètes s'envolent d'office.
function _suiSolvable(colsIn, nodeCap) {
    const cap = nodeCap || 200000;
    const memo = new Set();
    let nodes = 0;

    function dfs(cols, faites) {
        for (let i = 0; i < _SUI_NCOL; i++) {
            const c = cols[i], n = c.length;
            if (n < _SUI_MAX) continue;
            let ok = true;
            for (let j = 0; j < _SUI_MAX; j++) {
                if (c[n - _SUI_MAX + j] !== _SUI_MAX - j) { ok = false; break; }
            }
            if (ok) { c.splice(n - _SUI_MAX, _SUI_MAX); faites++; }
        }
        if (faites === 2) return true;
        if (++nodes > cap) return false;
        const cle = cols.map(c => c.join('.')).sort().join('|');
        if (memo.has(cle)) return false;
        memo.add(cle);

        const coups = [];
        let vide = -1;
        for (let j = 0; j < _SUI_NCOL; j++) {
            if (!cols[j].length) { vide = j; break; }
        }
        for (let i = 0; i < _SUI_NCOL; i++) {
            const c = cols[i], n = c.length;
            if (!n) continue;
            let s = n - 1;
            while (s > 0 && c[s - 1] === c[s] + 1) s--;
            for (let k = s; k < n; k++) {
                const tete = c[k];
                for (let j = 0; j < _SUI_NCOL; j++) {
                    if (j === i || !cols[j].length) continue;
                    if (cols[j][cols[j].length - 1] === tete + 1) coups.push([i, k, j, 0]);
                }
                // Déplacer une colonne entière vers une colonne vide est stérile
                if (vide >= 0 && k > 0) coups.push([i, k, vide, 1]);
            }
        }
        // Priorité : poses sur carte avant colonnes vides, paquets longs d'abord
        coups.sort((a, b) => a[3] - b[3] || a[1] - b[1]);
        for (let m = 0; m < coups.length; m++) {
            const suiv = cols.map(c => c.slice());
            suiv[coups[m][2]].push.apply(suiv[coups[m][2]], suiv[coups[m][0]].splice(coups[m][1]));
            if (dfs(suiv, faites)) return true;
        }
        return false;
    }

    return dfs(colsIn.map(c => c.slice()), 0);
}

// Donne : mélange aléatoire re-tiré jusqu'à preuve de résolubilité,
// puis repli quasi trié (résoluble en 6 coups) si vraiment aucun
// mélange ne passe — en pratique quasiment toutes les donnes passent.
function _suiDonne() {
    for (let essai = 0; essai < 50; essai++) {
        const paquet = [];
        for (let d = 0; d < 2; d++) {
            for (let v = 1; v <= _SUI_MAX; v++) paquet.push(v);
        }
        for (let i = paquet.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            const t = paquet[i]; paquet[i] = paquet[j]; paquet[j] = t;
        }
        const cols = [];
        for (let c = 0; c < _SUI_NCOL; c++) cols.push(paquet.slice(c * 4, c * 4 + 4));
        if (_suiSolvable(cols, 60000)) return cols;
    }
    return [[10, 9, 8, 7], [6, 5, 4, 3], [2, 1, 10, 9], [8, 7, 6, 5], [4, 3, 2, 1]];
}

// Carte : blanche, chiffre en coin (visible dans l'éventail) + gros
// chiffre au centre. Le 10 est en bleu : c'est la base de la suite.
function _suiCarte(v, opts) {
    const o = opts || {};
    const w = o.w || 60, h = o.h || 80;
    const coul = v === _SUI_MAX ? '#4A6CFA' : '#23262F';
    const el = document.createElement('div');
    el.style.cssText = 'position:relative;width:' + w + 'px;height:' + h + 'px;border-radius:' + (o.mini ? 6 : 10) + 'px;' +
        'background:#FFFFFF;border:2px solid #D8DCE8;box-sizing:border-box;user-select:none;' +
        'touch-action:manipulation;box-shadow:0 1px 3px rgba(35,38,47,.15);' +
        'transition:transform .12s,box-shadow .12s,opacity .3s;';
    if (o.mini) {
        const num = document.createElement('div');
        num.style.cssText = 'position:absolute;top:1px;left:0;right:0;text-align:center;' +
            'font-weight:900;font-size:.8rem;color:' + coul + ';pointer-events:none;';
        num.textContent = v;
        el.appendChild(num);
    } else {
        const coin = document.createElement('div');
        coin.style.cssText = 'position:absolute;top:2px;left:7px;font-weight:900;font-size:1.05rem;' +
            'color:' + coul + ';pointer-events:none;';
        coin.textContent = v;
        const centre = document.createElement('div');
        centre.style.cssText = 'position:absolute;top:14px;left:0;right:0;bottom:0;display:flex;' +
            'align-items:center;justify-content:center;font-weight:900;font-size:1.5rem;' +
            'color:' + coul + ';pointer-events:none;';
        centre.textContent = v;
        el.append(coin, centre);
    }
    return el;
}

function showExampleSuites(day, row, vals) {
    const ex = document.createElement('div');
    ex.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:10px;margin:6px auto;';

    function miniCol(valeurs, selection) {
        const w = 36, h = 48, pas = 17;
        const colonne = document.createElement('div');
        colonne.style.cssText = 'position:relative;width:' + w + 'px;height:' + ((valeurs.length - 1) * pas + h) + 'px;';
        valeurs.forEach((v, i) => {
            const c = _suiCarte(v, { w: w, h: h, mini: true });
            c.style.cssText += 'position:absolute;top:' + (i * pas) + 'px;left:0;z-index:' + (i + 1) + ';';
            if (selection && selection.indexOf(i) !== -1) {
                c.style.cssText += 'background:#EEF2FF;border-color:#4A6CFA;box-shadow:0 0 0 2px #FFFFFF,0 0 0 4px #4A6CFA;';
            }
            colonne.appendChild(c);
        });
        return colonne;
    }

    const ligne = document.createElement('div');
    ligne.style.cssText = 'display:flex;align-items:center;gap:12px;justify-content:center;';
    const gauche = document.createElement('div');
    gauche.style.cssText = 'display:flex;gap:8px;align-items:flex-start;';
    gauche.append(miniCol([8]), miniCol([7, 6], [0, 1]));
    const fleche = document.createElement('div');
    fleche.style.cssText = 'font-weight:900;color:#8B90A0;font-size:1.2rem;';
    fleche.textContent = '→';
    ligne.append(gauche, fleche, miniCol([8, 7, 6]));

    const note = document.createElement('div');
    note.style.cssText = 'font-weight:bold;color:#8B90A0;font-size:.78rem;text-align:center;max-width:280px;';
    note.textContent = 'Posez chaque carte sur la valeur juste au-dessus — complétez 10 → 1';

    ex.append(ligne, note);
    row.style.flexDirection = 'column';
    row.append(ex);
}

function startGameSuites() {
    board.style.display = 'flex';
    board.style.flexDirection = 'column';
    board.style.alignItems = 'center';
    board.style.gap = '12px';

    let cols = _suiDonne();
    let suites = 0;
    let coups = 0;
    let selected = null;      // { col, idx } : la carte idx et tout ce qui est dessus
    let history = [];         // pile d'états JSON, annulation illimitée
    let over = false;
    let animating = false;
    let cardEls = [];         // éléments cartes par colonne (pour l'envol)

    const snapshot = () => JSON.stringify({ cols: cols, suites: suites, coups: coups });
    const restore = (snap) => {
        const s = JSON.parse(snap);
        cols = s.cols; suites = s.suites; coups = s.coups;
    };

    const hud = document.createElement('div');
    hud.style.cssText = 'display:flex;align-items:center;gap:14px;margin-bottom:2px;';
    const compteur = document.createElement('div');
    compteur.style.cssText = 'font-weight:bold;color:#8B90A0;font-size:.95rem;';
    const btnAnnuler = document.createElement('button');
    btnAnnuler.className = 'btn btn-ghost';
    btnAnnuler.style.cssText = 'padding:8px 14px;font-size:.85rem;';
    btnAnnuler.textContent = '↩ Annuler';
    btnAnnuler.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        if (isPaused || over || animating || !history.length) return;
        restore(history.pop());
        selected = null;
        haptic(8);
        render();
    });
    hud.append(compteur, btnAnnuler);
    board.appendChild(hud);

    const zone = document.createElement('div');
    zone.style.cssText = 'display:flex;gap:8px;align-items:flex-start;justify-content:center;';
    board.appendChild(zone);

    function shake(el) {
        haptic(30);
        el.style.animation = 'wobble .25s';
        setTimeout(() => { el.style.animation = ''; }, 300);
    }

    function render() {
        compteur.innerHTML = 'Suites : <b style="color:#34B871">' + suites + '/2</b> · Coups : <b style="color:#4A6CFA">' + coups + '</b>';
        btnAnnuler.disabled = !history.length;
        btnAnnuler.style.opacity = history.length ? '1' : '.4';
        zone.innerHTML = '';
        cardEls = [];
        cols.forEach((col, ci) => {
            const colEl = document.createElement('div');
            const hauteur = col.length ? (col.length - 1) * 26 + 80 : 80;
            colEl.style.cssText = 'position:relative;width:60px;height:' + hauteur + 'px;flex-shrink:0;';
            const liste = [];
            if (!col.length) {
                const videEl = document.createElement('div');
                videEl.style.cssText = 'width:60px;height:80px;border-radius:10px;border:2px dashed #C2C7D6;' +
                    'box-sizing:border-box;touch-action:manipulation;';
                videEl.addEventListener('pointerdown', (e) => {
                    e.preventDefault();
                    if (isPaused || over || animating || !selected) return;
                    deposer(ci, videEl);
                });
                colEl.appendChild(videEl);
            } else {
                col.forEach((v, idx) => {
                    const isSel = selected && selected.col === ci && idx >= selected.idx;
                    const carte = _suiCarte(v);
                    carte.style.cssText += 'position:absolute;top:' + (idx * 26) + 'px;left:0;z-index:' + (idx + 1) + ';';
                    if (isSel) {
                        carte.style.cssText += 'background:#EEF2FF;border-color:#4A6CFA;' +
                            'box-shadow:0 0 0 3px #FFFFFF,0 0 0 5px #4A6CFA;transform:translateY(-4px);';
                    }
                    carte.addEventListener('pointerdown', (e) => {
                        e.preventDefault();
                        tap(ci, idx, carte);
                    });
                    colEl.appendChild(carte);
                    liste.push(carte);
                });
            }
            cardEls.push(liste);
            zone.appendChild(colEl);
        });
    }

    // Sélectionne le paquet qui commence à cette carte s'il forme une
    // suite décroissante consécutive jusqu'au sommet, sinon secousse.
    function selectionner(ci, idx, el) {
        const c = cols[ci];
        for (let k = idx; k < c.length - 1; k++) {
            if (c[k] !== c[k + 1] + 1) { shake(el); selected = null; render(); return; }
        }
        selected = { col: ci, idx: idx };
        haptic(6);
        render();
    }

    function tap(ci, idx, el) {
        if (isPaused || over || animating) return;
        if (selected) {
            if (selected.col === ci) {
                // Re-taper la sélection la désélectionne ; taper une carte
                // plus basse tente une nouvelle sélection depuis celle-ci.
                if (idx >= selected.idx) { selected = null; render(); }
                else selectionner(ci, idx, el);
                return;
            }
            deposer(ci, el);
            return;
        }
        selectionner(ci, idx, el);
    }

    // Dépose le paquet sélectionné sur la colonne ci si le coup est
    // légal (sommet = tête + 1, ou colonne vide), sinon secousse.
    function deposer(ci, el) {
        const src = cols[selected.col];
        const tete = src[selected.idx];
        const dst = cols[ci];
        const legal = !dst.length || dst[dst.length - 1] === tete + 1;
        if (!legal) { shake(el); selected = null; render(); return; }
        history.push(snapshot());
        dst.push.apply(dst, src.splice(selected.idx));
        coups++;
        selected = null;
        haptic(8);
        render();
        envoler(ci);
    }

    // Une colonne dont le sommet aligne 10→1 : les 10 cartes passent
    // en vert puis s'envolent. Deux suites envolées = victoire.
    function envoler(ci) {
        const c = cols[ci];
        const n = c.length;
        if (n < _SUI_MAX) return;
        for (let j = 0; j < _SUI_MAX; j++) {
            if (c[n - _SUI_MAX + j] !== _SUI_MAX - j) return;
        }
        animating = true;
        haptic([12, 40, 16]);
        const els = cardEls[ci].slice(n - _SUI_MAX);
        els.forEach((el) => {
            el.style.background = '#34B871';
            el.style.borderColor = '#34B871';
            el.childNodes.forEach((t) => { if (t.style) t.style.color = '#FFFFFF'; });
        });
        setTimeout(() => {
            els.forEach((el, k) => {
                el.style.transform = 'translateY(-' + (26 + k * 4) + 'px)';
                el.style.opacity = '0';
            });
        }, 320);
        setTimeout(() => {
            c.splice(n - _SUI_MAX, _SUI_MAX);
            suites++;
            animating = false;
            render();
            if (suites === 2) {
                over = true;
                endGame('Deux suites royales — tri parfait !', true);
            }
        }, 700);
    }

    render();
}
