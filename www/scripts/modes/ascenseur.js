// ─── Mode : L'Ascenseur ──────────────────────────────────────────
// L'ascenseur ne monte que : embarquer les passagers dans l'ordre
// croissant de leurs étages. 1 joker par manche (première erreur
// pardonnée), 2e erreur = défaite. Manche 2 : 8 passagers dont 2
// PRIORITAIRES (bord or) à prendre en premier. Victoire après la 2e.

function _ascenseurUniques(count, max) {
    const set = new Set();
    while (set.size < count) set.add(1 + Math.floor(Math.random() * max));
    return [...set];
}

function _ascenseurPassager(floor, prio) {
    const p = document.createElement('div');
    p.style.cssText = 'position:relative;width:60px;height:60px;border-radius:50%;background:#EEF2FF;' +
        'border:3px solid #4A6CFA;color:#23262F;display:flex;align-items:center;justify-content:center;' +
        'font-weight:900;font-size:1.15rem;flex-shrink:0;touch-action:manipulation;user-select:none;' +
        'transition:transform .25s ease, opacity .25s ease;';
    p.textContent = floor;
    if (prio) {
        p.style.borderColor = '#F5B227';
        p.style.background = '#FDF3DC';
        const badge = document.createElement('div');
        badge.style.cssText = 'position:absolute;bottom:-16px;left:50%;transform:translateX(-50%);' +
            'background:#F5B227;color:#FFFFFF;font-weight:900;font-size:.5rem;letter-spacing:.06em;' +
            'padding:2px 6px;border-radius:999px;white-space:nowrap;pointer-events:none;';
        badge.textContent = 'PRIORITAIRE';
        p.appendChild(badge);
    }
    return p;
}

function showExampleAscenseur(day, row, vals) {
    const ex = document.createElement('div');
    ex.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:10px;margin:6px auto;';

    const scene = document.createElement('div');
    scene.style.cssText = 'display:flex;align-items:center;gap:16px;';

    const hall = document.createElement('div');
    hall.style.cssText = 'display:flex;gap:10px;';
    [{ f: 9 }, { f: 2 }, { f: 6 }].forEach((d, i) => {
        const p = _ascenseurPassager(d.f, false);
        p.style.width = '46px'; p.style.height = '46px'; p.style.fontSize = '.95rem';
        if (d.f === 2) p.style.boxShadow = '0 0 0 3px #FFFFFF, 0 0 0 5px #34B871';
        hall.appendChild(p);
    });

    const cabine = document.createElement('div');
    cabine.style.cssText = 'width:74px;height:92px;border:3px solid #23262F;border-radius:10px;background:#FFFFFF;' +
        'display:flex;flex-direction:column;align-items:center;justify-content:flex-start;padding-top:6px;';
    const ind = document.createElement('div');
    ind.style.cssText = 'font-weight:900;font-size:.68rem;color:#4A6CFA;';
    ind.textContent = 'Étage : 0';
    cabine.appendChild(ind);
    scene.append(hall, cabine);

    const note = document.createElement('div');
    note.style.cssText = 'font-weight:bold;color:#8B90A0;font-size:.8rem;text-align:center;max-width:260px;';
    note.textContent = 'L\'ascenseur ne monte que : embarquez d\'abord l\'étage 2.';

    ex.append(scene, note);
    row.style.flexDirection = 'column';
    row.append(ex);
}

function startGameAscenseur() {
    board.style.display = 'flex';
    board.style.flexDirection = 'column';
    board.style.alignItems = 'center';
    board.style.gap = '12px';

    let round = 1;
    let over = false;

    const hud = document.createElement('div');
    hud.style.cssText = 'display:flex;gap:16px;align-items:center;justify-content:center;font-weight:bold;color:#8B90A0;font-size:.9rem;';
    board.appendChild(hud);

    const scene = document.createElement('div');
    scene.style.cssText = 'display:flex;align-items:flex-start;justify-content:center;gap:16px;width:100%;max-width:420px;';
    board.appendChild(scene);

    const hall = document.createElement('div');
    hall.style.cssText = 'flex:1;display:flex;flex-wrap:wrap;gap:14px;row-gap:26px;justify-content:center;padding-top:6px;';
    scene.appendChild(hall);

    const cabine = document.createElement('div');
    cabine.style.cssText = 'width:100px;min-height:150px;border:3px solid #23262F;border-radius:12px;background:#FFFFFF;' +
        'display:flex;flex-direction:column;align-items:center;gap:8px;padding:10px 6px;flex-shrink:0;box-shadow:0 3px 0 #8B90A0;';
    const indicateur = document.createElement('div');
    indicateur.style.cssText = 'font-weight:900;font-size:.82rem;color:#4A6CFA;background:#EEF2FF;' +
        'border-radius:999px;padding:4px 10px;white-space:nowrap;';
    const cabinSeat = document.createElement('div');
    cabinSeat.style.cssText = 'min-height:60px;display:flex;align-items:center;justify-content:center;';
    cabine.append(indicateur, cabinSeat);
    scene.appendChild(cabine);

    function startRound() {
        let joker = 1;
        let nextIdx = 0;
        hall.innerHTML = '';
        cabinSeat.innerHTML = '';
        indicateur.textContent = 'Étage : 0';

        const count = round === 1 ? 7 : 8;
        const floors = _ascenseurUniques(count, 12);
        let prioSet = new Set();
        if (round === 2) {
            const shuffledFloors = [...floors].sort(() => Math.random() - 0.5);
            prioSet = new Set(shuffledFloors.slice(0, 2));
        }
        // Ordre attendu : prioritaires d'abord (croissant entre eux), puis les autres (croissant)
        const orderList = [
            ...floors.filter(f => prioSet.has(f)).sort((a, b) => a - b),
            ...floors.filter(f => !prioSet.has(f)).sort((a, b) => a - b)
        ];

        function renderHud() {
            hud.innerHTML = `<span>Manche <b style="color:#23262F">${round}/2</b></span>` +
                `<span>Embarqués <b style="color:#4A6CFA">${nextIdx}/${count}</b></span>` +
                `<span>Joker <b style="color:${joker > 0 ? '#F5B227' : '#8B90A0'}">${joker > 0 ? '★' : '—'}</b></span>`;
        }
        renderHud();

        const shuffled = [...floors].sort(() => Math.random() - 0.5);
        const passagers = {};
        shuffled.forEach(floor => {
            const p = _ascenseurPassager(floor, prioSet.has(floor));
            passagers[floor] = p;

            p.addEventListener('pointerdown', (e) => {
                e.preventDefault();
                if (isPaused || over || p.dataset.done || p.dataset.frozen) return;

                if (floor === orderList[nextIdx]) {
                    // Embarquement : le passager glisse dans la cabine
                    p.dataset.done = '1';
                    p.style.pointerEvents = 'none';
                    p.style.transform = 'translateX(30px) scale(.6)';
                    p.style.opacity = '0';
                    haptic([8, 30, 8]); // petit ding
                    indicateur.textContent = 'Étage : ' + floor;
                    cabinSeat.innerHTML = '';
                    const mini = _ascenseurPassager(floor, prioSet.has(floor));
                    mini.style.width = '48px'; mini.style.height = '48px'; mini.style.fontSize = '1rem';
                    cabinSeat.appendChild(mini);
                    setTimeout(() => { if (p.parentNode) p.style.visibility = 'hidden'; }, 280);
                    nextIdx++;
                    renderHud();

                    if (nextIdx >= count) {
                        if (round === 1) {
                            round = 2;
                            resultDisplay.textContent = 'Manche 2 : attention aux prioritaires !';
                            resultDisplay.style.color = '#F5B227';
                            haptic([12, 40, 12]);
                            gameTimeout = setTimeout(() => {
                                if (isPaused) return;
                                resultDisplay.textContent = '';
                                startRound();
                            }, 1200);
                        } else {
                            over = true;
                            endGame('Tout l\'immeuble est monté sans redescendre !', true);
                        }
                    }
                } else if (joker > 0) {
                    // Première erreur pardonnée : clignote et neutralisé 2 s
                    joker = 0;
                    haptic(50);
                    p.dataset.frozen = '1';
                    p.classList.add('flicker-anim');
                    resultDisplay.textContent = 'Joker utilisé !';
                    resultDisplay.style.color = '#F5B227';
                    setTimeout(() => {
                        delete p.dataset.frozen;
                        p.classList.remove('flicker-anim');
                        if (!isPaused && resultDisplay.textContent === 'Joker utilisé !') resultDisplay.textContent = '';
                    }, 2000);
                    renderHud();
                } else {
                    // Deuxième erreur : défaite, le bon passager est entouré en vert
                    over = true;
                    haptic(60);
                    p.style.animation = 'wobble .3s';
                    const bon = passagers[orderList[nextIdx]];
                    if (bon) bon.style.boxShadow = '0 0 0 3px #FFFFFF, 0 0 0 6px #34B871';
                    endGame('L\'ascenseur ne redescend pas — le bon passager est en vert.', false);
                }
            });
            hall.appendChild(p);
        });
    }

    startRound();
}
