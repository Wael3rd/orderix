// ─── Mode : Photo de Classe ──────────────────────────────────────
// Mémorisation d'un rang de personnages : le rang s'affiche quelques
// secondes (barre de temps), puis les personnages sont mélangés
// spatialement. Il faut les taper dans l'ordre d'origine gauche →
// droite. Manche 1 : 6 personnages / 3,5 s. Manche 2 : 8 / 4 s.
// 2 vies pour toute la partie.

const _PHOTO_CAST = [
    { e: '🐱', c: '#FFE1E1' },
    { e: '🐰', c: '#FFEFD6' },
    { e: '🦊', c: '#FFF9C9' },
    { e: '🐻', c: '#DFF5DD' },
    { e: '🐸', c: '#DDEBFF' },
    { e: '🦉', c: '#EADFFB' },
    { e: '🐼', c: '#FBDFF0' },
    { e: '🐨', c: '#E2F3F1' }
];

function _photoPerso(perso, size) {
    const el = document.createElement('div');
    el.style.cssText = `position:relative;width:${size}px;height:${size}px;border-radius:50%;` +
        `background:${perso.c};display:flex;align-items:center;justify-content:center;` +
        `font-size:${Math.round(size * 0.52)}px;flex-shrink:0;user-select:none;` +
        'box-shadow:0 2px 0 rgba(35,38,47,.12);touch-action:manipulation;transition:transform .12s;';
    el.textContent = perso.e;
    return el;
}

function showExamplePhotoClasse(day, row, vals) {
    const cast = _PHOTO_CAST.slice(0, 4);
    const ex = document.createElement('div');
    ex.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:10px;margin:6px auto;';

    const rank = document.createElement('div');
    rank.style.cssText = 'display:flex;align-items:center;gap:8px;font-weight:bold;color:#8B90A0;font-size:.8rem;';
    rank.appendChild(document.createTextNode('Le rang :'));
    cast.forEach(p => rank.appendChild(_photoPerso(p, 38)));

    const shuffledRow = document.createElement('div');
    shuffledRow.style.cssText = 'display:flex;align-items:center;gap:8px;font-weight:bold;color:#8B90A0;font-size:.8rem;padding-bottom:20px;';
    shuffledRow.appendChild(document.createTextNode('Mélangés :'));
    [cast[2], cast[0], cast[3], cast[1]].forEach(p => {
        const el = _photoPerso(p, 38);
        if (p === cast[0]) {
            el.style.boxShadow = '0 0 0 3px #FFFFFF, 0 0 0 5px #4A6CFA';
            const badge = document.createElement('div');
            badge.className = 'badge';
            badge.textContent = '1';
            el.appendChild(badge);
        }
        shuffledRow.appendChild(el);
    });

    ex.append(rank, shuffledRow);
    row.style.flexDirection = 'column';
    row.append(ex);
}

function startGamePhotoClasse() {
    board.style.display = 'flex';
    board.style.flexDirection = 'column';
    board.style.alignItems = 'center';

    let lives = 2;
    let round = 1;
    const totalRoundsPhoto = 2;

    const hud = document.createElement('div');
    hud.style.cssText = 'display:flex;gap:18px;align-items:center;justify-content:center;font-weight:bold;color:#8B90A0;font-size:.95rem;margin-bottom:10px;';
    board.appendChild(hud);

    const consigne = document.createElement('div');
    consigne.style.cssText = 'font-weight:bold;font-size:.85rem;letter-spacing:.1em;text-transform:uppercase;color:#8B90A0;margin-bottom:10px;text-align:center;';
    board.appendChild(consigne);

    const barWrap = document.createElement('div');
    barWrap.className = 'timebar-wrap';
    const bar = document.createElement('div');
    bar.className = 'timebar';
    barWrap.appendChild(bar);
    board.appendChild(barWrap);

    const stage = document.createElement('div');
    stage.style.cssText = 'display:flex;flex-wrap:wrap;gap:14px;row-gap:30px;justify-content:center;align-items:center;max-width:380px;min-height:140px;margin-bottom:18px;';
    board.appendChild(stage);

    const slotsRow = document.createElement('div');
    slotsRow.style.cssText = 'display:flex;flex-wrap:wrap;gap:8px;row-gap:30px;justify-content:center;max-width:380px;padding-bottom:24px;';
    board.appendChild(slotsRow);

    function renderHud() {
        hud.innerHTML = `<span>Manche <b style="color:#23262F">${round}/${totalRoundsPhoto}</b></span>` +
            `<span style="color:#E0533D;letter-spacing:2px">${'♥'.repeat(lives)}${'♡'.repeat(2 - lives)}</span>`;
    }

    function startRound() {
        const count = round === 1 ? 6 : 8;
        // Temps de mémorisation doublé suite au retour de test (issue #30)
        const memoMs = round === 1 ? 7000 : 8000;
        // Ordre du rang : arbitraire (mélange des personnages)
        const cast = [..._PHOTO_CAST.slice(0, count)].sort(() => Math.random() - 0.5);
        const size = count > 6 ? 52 : 60;      // taille de jeu (phase mélangée)
        const memoSize = count > 6 ? 38 : 50;  // taille du rang mémorisé (une seule ligne)

        renderHud();
        consigne.textContent = 'Mémorisez le rang !';
        barWrap.style.display = '';
        slotsRow.innerHTML = '';
        stage.innerHTML = '';
        stage.style.flexWrap = 'nowrap';
        stage.style.gap = '8px';
        cast.forEach(p => stage.appendChild(_photoPerso(p, memoSize)));

        // Phase de mémorisation : barre de temps qui se vide
        let left = memoMs;
        bar.style.width = '100%';
        clearInterval(window.speedTimer);
        window.speedTimer = setInterval(() => {
            if (isPaused) return;
            left -= 50;
            bar.style.width = `${Math.max(0, (left / memoMs) * 100)}%`;
            if (left <= 0) {
                clearInterval(window.speedTimer);
                shufflePhase(cast, size);
            }
        }, 50);
    }

    function shufflePhase(cast, size) {
        consigne.textContent = 'Retrouvez l’ordre, de gauche à droite !';
        barWrap.style.display = 'none';
        stage.innerHTML = '';
        stage.style.flexWrap = 'wrap';
        stage.style.gap = '14px';
        slotsRow.innerHTML = '';
        let nextIdx = 0;

        // Emplacements du rang du bas (à remplir dans l'ordre)
        const slots = cast.map(() => {
            const s = document.createElement('div');
            s.style.cssText = `position:relative;width:${size - 8}px;height:${size - 8}px;border-radius:50%;` +
                'border:2px dashed #C9D4FB;background:#EEF2FF;flex-shrink:0;';
            slotsRow.appendChild(s);
            return s;
        });

        // Personnages repositionnés en grille aléatoire
        const shuffled = [...cast].sort(() => Math.random() - 0.5);
        const persoEls = new Map();
        shuffled.forEach(p => {
            const el = _photoPerso(p, size);
            persoEls.set(p, el);
            el.addEventListener('click', () => {
                if (isPaused || el.style.visibility === 'hidden') return;

                if (p === cast[nextIdx]) {
                    haptic(10);
                    el.style.visibility = 'hidden';
                    const placed = _photoPerso(p, size - 8);
                    const badge = document.createElement('div');
                    badge.className = 'badge';
                    badge.textContent = nextIdx + 1;
                    placed.appendChild(badge);
                    slots[nextIdx].style.border = 'none';
                    slots[nextIdx].style.background = 'transparent';
                    slots[nextIdx].appendChild(placed);
                    nextIdx++;

                    if (nextIdx >= cast.length) {
                        if (round < totalRoundsPhoto) {
                            round++;
                            resultDisplay.textContent = 'Rang reconstitué — manche suivante !';
                            resultDisplay.style.color = '#34B871';
                            haptic([12, 40, 12]);
                            gameTimeout = setTimeout(() => {
                                if (isPaused) return;
                                resultDisplay.textContent = '';
                                startRound();
                            }, 900);
                        } else {
                            endGame('La photo de classe est parfaite !', true);
                        }
                    }
                } else {
                    lives--;
                    haptic(50);
                    el.style.animation = 'wobble .3s';
                    setTimeout(() => { el.style.animation = ''; }, 350);
                    renderHud();
                    if (lives <= 0) {
                        // Révéler l'ordre d'origine en badges
                        cast.forEach((perso, i) => {
                            const pe = persoEls.get(perso);
                            if (pe && pe.style.visibility !== 'hidden') {
                                const b = document.createElement('div');
                                b.className = 'badge';
                                b.textContent = i + 1;
                                pe.appendChild(b);
                            }
                        });
                        endGame('Plus de vies — l’ordre du rang est affiché.', false);
                    }
                }
            });
            stage.appendChild(el);
        });
    }

    startRound();
}
