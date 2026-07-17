// ─── Mode : L'Aiguillage ─────────────────────────────────────────
// Des wagons numérotés arrivent un par un : les aiguiller vers l'une
// des 3 voies, chacune devant rester STRICTEMENT croissante. Si aucune
// voie n'accepte le wagon, il part au rebut (-1 vie). 3 vies.
// Victoire : 15 wagons traités sans épuiser les vies.

function _aiguillageUniques(count, max) {
    const set = new Set();
    while (set.size < count) set.add(1 + Math.floor(Math.random() * max));
    return [...set];
}

function _aiguillageWagon(val, size, highlight) {
    const w = document.createElement('div');
    const s = size || 44;
    w.style.cssText = `width:${s}px;height:${Math.round(s * 0.82)}px;border-radius:8px;background:#4A6CFA;` +
        'color:#FFFFFF;display:flex;align-items:center;justify-content:center;font-weight:900;flex-shrink:0;' +
        `font-size:${s > 50 ? '1.2rem' : '.9rem'};box-shadow:0 2px 0 #3553D1;`;
    if (highlight) w.style.boxShadow = '0 2px 0 #3553D1, 0 0 0 2px #FFFFFF, 0 0 0 4px #F5B227';
    w.textContent = val;
    return w;
}

function showExampleAiguillage(day, row, vals) {
    const ex = document.createElement('div');
    ex.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:10px;margin:6px auto;';

    const arrivee = document.createElement('div');
    arrivee.style.cssText = 'display:flex;align-items:center;gap:8px;font-weight:bold;color:#8B90A0;font-size:.85rem;';
    arrivee.append(document.createTextNode('Wagon :'), _aiguillageWagon(37, 48, true));

    const voies = document.createElement('div');
    voies.style.cssText = 'display:flex;flex-direction:column;gap:6px;';
    [[5, 21], [40, 62]].forEach((track, i) => {
        const v = document.createElement('div');
        v.style.cssText = 'display:flex;align-items:center;gap:6px;padding:6px 10px;background:#EEF2FF;' +
            'border:2px solid #D9E0FB;border-radius:10px;min-width:200px;';
        const lbl = document.createElement('span');
        lbl.style.cssText = 'font-weight:900;color:#8B90A0;font-size:.75rem;';
        lbl.textContent = 'Voie ' + (i === 0 ? 'A' : 'B');
        v.appendChild(lbl);
        track.forEach(t => v.appendChild(_aiguillageWagon(t, 32)));
        voies.appendChild(v);
    });

    const note = document.createElement('div');
    note.style.cssText = 'font-weight:bold;color:#8B90A0;font-size:.8rem;text-align:center;max-width:260px;';
    note.textContent = '37 peut aller sur la voie A (37 > 21), pas sur la B (37 < 62).';

    ex.append(arrivee, voies, note);
    row.style.flexDirection = 'column';
    row.append(ex);
}

function startGameAiguillage() {
    board.style.display = 'flex';
    board.style.flexDirection = 'column';
    board.style.alignItems = 'center';
    board.style.gap = '10px';

    const TOTAL = 15;
    const NAMES = ['A', 'B', 'C'];
    let lives = 3;
    let idx = 0;
    let over = false;

    const wagons = _aiguillageUniques(TOTAL, 99);
    const tracks = [[], [], []];

    const hud = document.createElement('div');
    hud.style.cssText = 'display:flex;gap:18px;align-items:center;justify-content:center;font-weight:bold;color:#8B90A0;font-size:.95rem;';
    board.appendChild(hud);

    const arrivalZone = document.createElement('div');
    arrivalZone.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:4px;';
    board.appendChild(arrivalZone);

    const trackEls = [];
    NAMES.forEach((name, i) => {
        const t = document.createElement('button');
        t.style.cssText = 'display:flex;align-items:center;gap:8px;width:100%;max-width:400px;min-height:58px;' +
            'padding:8px 12px;background:#EEF2FF;border:2px solid #D9E0FB;border-radius:12px;' +
            'transition:transform .1s;touch-action:manipulation;';
        t.addEventListener('pointerdown', (e) => {
            e.preventDefault();
            if (isPaused || over || idx >= TOTAL) return;
            const val = wagons[idx];
            const last = tracks[i].length ? tracks[i][tracks[i].length - 1] : null;
            if (last === null || val > last) {
                tracks[i].push(val);
                haptic(10);
                idx++;
                if (idx >= TOTAL) {
                    over = true;
                    render();
                    endGame('Quinze wagons aiguillés — beau travail de triage !', true);
                } else {
                    render();
                }
            } else {
                // Voie illégale : secousse, sans pénalité
                haptic(30);
                t.style.animation = 'wobble .3s';
                t.style.borderColor = '#E0533D';
                setTimeout(() => { t.style.animation = ''; t.style.borderColor = '#D9E0FB'; }, 350);
            }
        });
        trackEls.push(t);
        board.appendChild(t);
    });

    const rebutBtn = document.createElement('button');
    rebutBtn.style.cssText = 'display:none;padding:12px 26px;border-radius:999px;background:#FDEAE7;' +
        'border:2px solid #E0533D;color:#E0533D;font-weight:900;font-size:.95rem;margin-top:4px;' +
        'transition:transform .1s;touch-action:manipulation;';
    rebutBtn.textContent = 'Rebut (-1 vie)';
    rebutBtn.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        if (isPaused || over || idx >= TOTAL) return;
        lives--;
        haptic(60);
        if (lives <= 0) {
            over = true;
            renderHud();
            endGame('Trop de wagons au rebut — le triage a déraillé.', false);
            return;
        }
        idx++;
        if (idx >= TOTAL) {
            over = true;
            render();
            endGame('Quinze wagons traités malgré quelques rebuts !', true);
        } else {
            resultDisplay.textContent = 'Wagon envoyé au rebut.';
            resultDisplay.style.color = '#E0533D';
            setTimeout(() => { if (!isPaused && resultDisplay.textContent === 'Wagon envoyé au rebut.') resultDisplay.textContent = ''; }, 900);
            render();
        }
    });
    board.appendChild(rebutBtn);

    function renderHud() {
        hud.innerHTML = `<span>Wagon <b style="color:#4A6CFA">${Math.min(idx + 1, TOTAL)}/${TOTAL}</b></span>` +
            `<span style="color:#E0533D;letter-spacing:2px">${'♥'.repeat(lives)}${'♡'.repeat(3 - lives)}</span>`;
    }

    function render() {
        renderHud();
        arrivalZone.innerHTML = '';
        if (idx < TOTAL && !over) {
            const lbl = document.createElement('div');
            lbl.style.cssText = 'font-weight:bold;font-size:.75rem;letter-spacing:.14em;text-transform:uppercase;color:#8B90A0;';
            lbl.textContent = 'Wagon à garer :';
            arrivalZone.append(lbl, _aiguillageWagon(wagons[idx], 62, true));
        }

        let anyLegal = false;
        trackEls.forEach((t, i) => {
            t.innerHTML = '';
            const lbl = document.createElement('span');
            lbl.style.cssText = 'font-weight:900;color:#8B90A0;font-size:.8rem;flex-shrink:0;';
            lbl.textContent = 'Voie ' + NAMES[i];
            t.appendChild(lbl);

            const shown = tracks[i].slice(-3);
            shown.forEach((v, k) => {
                const isLast = k === shown.length - 1;
                t.appendChild(_aiguillageWagon(v, isLast ? 46 : 34));
            });
            if (tracks[i].length === 0) {
                const empty = document.createElement('span');
                empty.style.cssText = 'color:#8B90A0;font-size:.8rem;font-style:italic;';
                empty.textContent = 'libre';
                t.appendChild(empty);
            }

            const last = tracks[i].length ? tracks[i][tracks[i].length - 1] : null;
            if (idx < TOTAL && (last === null || wagons[idx] > last)) anyLegal = true;
        });

        rebutBtn.style.display = (!over && idx < TOTAL && !anyLegal) ? 'block' : 'none';
    }

    render();
}
