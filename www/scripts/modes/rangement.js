// ─── Mode : Le Rangement ─────────────────────────────────────────
// Cosy, façon « A Little to the Left » : 3 mini-scènes d'objets
// ménagers à ranger en les tapant dans l'ordre demandé. L'objet tapé
// correctement rejoint l'étagère (planche marron clair) en bas de la
// scène. 3 vies pour tout le parcours.

function _rangCrayon(h, couleur) {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;flex-direction:column;align-items:center;justify-content:flex-end;' +
        'padding:6px 4px 0;user-select:none;touch-action:manipulation;transition:transform .25s ease;';
    const pointe = document.createElement('div');
    pointe.style.cssText = 'width:0;height:0;border-left:9px solid transparent;border-right:9px solid transparent;' +
        `border-bottom:12px solid ${couleur};`;
    const corps = document.createElement('div');
    corps.style.cssText = `width:18px;height:${h}px;background:${couleur};border-radius:0 0 4px 4px;` +
        'box-shadow:inset -4px 0 0 rgba(35,38,47,.12);';
    wrap.append(pointe, corps);
    return wrap;
}

function _rangLivre(w, teinte) {
    const livre = document.createElement('div');
    livre.style.cssText = `width:${w}px;height:90px;background:${teinte};border-radius:3px 6px 6px 3px;` +
        'position:relative;user-select:none;touch-action:manipulation;transition:transform .25s ease;' +
        'box-shadow:inset -5px 0 0 rgba(255,255,255,.28), inset 3px 0 0 rgba(35,38,47,.18);';
    const tranche = document.createElement('div');
    tranche.style.cssText = 'position:absolute;top:10px;left:3px;right:5px;height:8px;' +
        'border-top:2px solid rgba(255,255,255,.55);border-bottom:2px solid rgba(255,255,255,.55);';
    livre.appendChild(tranche);
    return livre;
}

function _rangPot(label, couleur) {
    const pot = document.createElement('div');
    pot.style.cssText = 'display:flex;flex-direction:column;align-items:center;user-select:none;' +
        'touch-action:manipulation;transition:transform .25s ease;';
    const couvercle = document.createElement('div');
    couvercle.style.cssText = 'width:36px;height:10px;background:#8B90A0;border-radius:5px 5px 0 0;';
    const corps = document.createElement('div');
    corps.style.cssText = `width:50px;height:56px;background:${couleur};border-radius:8px;` +
        'display:flex;align-items:center;justify-content:center;box-shadow:inset -6px 0 0 rgba(35,38,47,.08);';
    const etiquette = document.createElement('div');
    etiquette.style.cssText = 'background:#FFFFFF;border-radius:4px;padding:3px 4px;font-weight:900;' +
        'font-size:.52rem;letter-spacing:.05em;color:#23262F;';
    etiquette.textContent = label;
    corps.appendChild(etiquette);
    pot.append(couvercle, corps);
    return pot;
}

function _rangEtagere() {
    const planche = document.createElement('div');
    planche.style.cssText = 'width:100%;height:12px;background:#C99B6B;border-radius:4px;' +
        'box-shadow:0 3px 0 #A97E52;';
    return planche;
}

function showExampleRangement(day, row, vals) {
    const ex = document.createElement('div');
    ex.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:4px;margin:6px auto;width:200px;';
    const objets = document.createElement('div');
    objets.style.cssText = 'display:flex;align-items:flex-end;justify-content:center;gap:14px;';
    const c1 = _rangCrayon(48, '#9BBCF2');
    const c2 = _rangCrayon(26, '#F5A9A9');
    const c3 = _rangCrayon(36, '#A9D9A9');
    c2.style.transform = 'scale(1)';
    c2.style.boxShadow = '0 0 0 3px #4A6CFA';
    c2.style.borderRadius = '8px';
    objets.append(c1, c2, c3);
    ex.append(objets, _rangEtagere());
    const note = document.createElement('div');
    note.style.cssText = 'font-weight:bold;color:#8B90A0;font-size:.78rem;margin-top:6px;';
    note.textContent = 'Du plus court au plus long !';
    ex.appendChild(note);
    row.style.flexDirection = 'column';
    row.append(ex);
}

function startGameRangement() {
    board.style.display = 'flex';
    board.style.flexDirection = 'column';
    board.style.alignItems = 'center';

    let lives = 3;
    let scene = 0;

    // Chaque scène : consigne + objets dans l'ORDRE ATTENDU (indice = rang)
    const scenes = [
        {
            consigne: 'Les crayons, du plus court au plus long',
            build: function () {
                const hauteurs = [40, 58, 75, 92, 110];
                const couleurs = ['#F5A9A9', '#F5C97B', '#A9D9A9', '#9BBCF2', '#D3A9E8'];
                return hauteurs.map((h, i) => _rangCrayon(h, couleurs[i]));
            }
        },
        {
            consigne: 'Les livres, du plus épais au plus fin',
            build: function () {
                const largeurs = [44, 37, 30, 23, 16];
                const teintes = ['#3553D1', '#4A6CFA', '#6D89F7', '#93A9F9', '#B9C7FB'];
                return largeurs.map((w, i) => _rangLivre(w, teintes[i]));
            }
        },
        {
            consigne: 'Les pots d’épices, par ordre alphabétique',
            build: function () {
                const labels = ['ANIS', 'CUMIN', 'PAPRIKA', 'SAFRAN', 'THYM'];
                const couleurs = ['#DFF5DD', '#FFEFD6', '#FFE1E1', '#FFF9C9', '#EADFFB'];
                return labels.map((l, i) => _rangPot(l, couleurs[i]));
            }
        }
    ];

    const hud = document.createElement('div');
    hud.style.cssText = 'display:flex;gap:18px;align-items:center;justify-content:center;font-weight:bold;color:#8B90A0;font-size:.95rem;margin-bottom:8px;';
    board.appendChild(hud);

    const consigne = document.createElement('div');
    consigne.style.cssText = 'font-weight:bold;font-size:.95rem;color:#23262F;margin-bottom:14px;text-align:center;';
    board.appendChild(consigne);

    const zone = document.createElement('div');
    zone.style.cssText = 'display:flex;flex-wrap:wrap;align-items:flex-end;justify-content:center;gap:16px;' +
        'min-height:140px;max-width:360px;margin-bottom:22px;';
    board.appendChild(zone);

    const etagereWrap = document.createElement('div');
    etagereWrap.style.cssText = 'width:min(340px, 92%);display:flex;flex-direction:column;';
    const rangee = document.createElement('div');
    rangee.style.cssText = 'display:flex;align-items:flex-end;justify-content:center;gap:12px;min-height:126px;';
    etagereWrap.append(rangee, _rangEtagere());
    board.appendChild(etagereWrap);

    function renderHud() {
        hud.innerHTML = `<span>Scène <b style="color:#23262F">${Math.min(scene + 1, 3)}/3</b></span>` +
            `<span style="color:#E0533D;letter-spacing:2px">${'♥'.repeat(lives)}${'♡'.repeat(3 - lives)}</span>`;
    }

    function startScene() {
        const def = scenes[scene];
        const objets = def.build(); // indice = rang attendu
        let nextIdx = 0;

        renderHud();
        consigne.textContent = def.consigne;
        zone.innerHTML = '';
        rangee.innerHTML = '';

        // Affichage mélangé
        const shuffled = objets.map((el, i) => ({ el: el, ordre: i })).sort(() => Math.random() - 0.5);
        shuffled.forEach(obj => {
            obj.el.addEventListener('click', function tap() {
                if (isPaused || obj.el.dataset.range === '1') return;

                if (obj.ordre === nextIdx) {
                    // L'objet glisse sur l'étagère
                    obj.el.dataset.range = '1';
                    haptic(10);
                    obj.el.style.transform = 'scale(.9)';
                    obj.el.classList.add('gravity-anim');
                    rangee.appendChild(obj.el);
                    nextIdx++;

                    if (nextIdx >= objets.length) {
                        if (scene < scenes.length - 1) {
                            scene++;
                            resultDisplay.textContent = 'Joliment rangé — scène suivante !';
                            resultDisplay.style.color = '#34B871';
                            haptic([12, 40, 12]);
                            gameTimeout = setTimeout(function () {
                                if (isPaused) return;
                                resultDisplay.textContent = '';
                                startScene();
                            }, 900);
                        } else {
                            endGame('Tout est parfaitement rangé !', true);
                        }
                    }
                } else {
                    lives--;
                    haptic(50);
                    obj.el.style.animation = 'wobble .3s';
                    setTimeout(function () { obj.el.style.animation = ''; }, 350);
                    renderHud();

                    if (lives <= 0) {
                        // Entourer le bon objet
                        const bon = shuffled.find(o => o.ordre === nextIdx);
                        if (bon) {
                            bon.el.style.boxShadow = '0 0 0 3px #FFFFFF, 0 0 0 6px #34B871';
                            bon.el.style.borderRadius = '10px';
                        }
                        endGame('Plus de vies — le bon objet est entouré.', false);
                    }
                }
            });
            zone.appendChild(obj.el);
        });
    }

    startScene();
}
