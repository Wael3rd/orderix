// ─── Mode phare : L'Insertion ────────────────────────────────────
// Façon « Timeline » : une rangée ordonnée grandit au fil de la partie.
// À chaque tour, un nouvel élément se présente : toucher l'emplacement
// exact où il doit s'insérer. 2 vies — l'erreur fait réessayer le même
// élément, donc chaque échec enseigne quelque chose.

function _insertionCell(tType, val, scale) {
    const cell = document.createElement('div');
    const size = Math.round(60 * scale);
    cell.style.cssText = `width:${size}px;height:${size}px;display:flex;align-items:center;justify-content:center;flex-shrink:0;`;
    const item = document.createElement('div');
    item.className = `item type-${tType}`;
    item.style.margin = '0';
    item.style.flexShrink = '0';
    applyStyle(item, tType, val);
    if (scale < 1) {
        item.style.transform = (item.style.transform ? item.style.transform + ' ' : '') + `scale(${scale})`;
        item.style.transformOrigin = 'center';
    }
    cell.appendChild(item);
    return cell;
}

function showExampleInsertion(day, row, vals) {
    const sorted = [...vals].sort((a, b) => a - b);
    const ex = document.createElement('div');
    ex.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:12px;margin:6px auto;';

    const cand = document.createElement('div');
    cand.style.cssText = 'display:flex;align-items:center;gap:10px;font-weight:bold;color:#8B90A0;font-size:.9rem;';
    const candItem = _insertionCell(day.type, sorted[1], 0.8);
    candItem.firstChild.style.boxShadow = '0 0 0 3px #FFFFFF, 0 0 0 5px #4A6CFA';
    cand.append(candItem, document.createTextNode('→ où va-t-il ?'));

    const shelf = document.createElement('div');
    shelf.style.cssText = 'display:flex;align-items:center;gap:4px;';
    [sorted[0], null, sorted[2], sorted[3]].forEach(v => {
        if (v === null) {
            const slot = document.createElement('div');
            slot.className = 'slot-btn slot-hint';
            slot.textContent = '+';
            shelf.appendChild(slot);
        } else {
            shelf.appendChild(_insertionCell(day.type, v, 0.8));
        }
    });

    ex.append(cand, shelf);
    row.style.flexDirection = 'column';
    row.append(ex);
}

function startGameInsertion() {
    board.style.display = 'flex';
    board.style.flexDirection = 'column';
    board.style.alignItems = 'center';

    const tType = currentDayConfig.type;
    let lives = 2;

    // Pool de valeurs uniques ; la rangée démarre à 3, on en insère jusqu'à 10
    let pool = [...new Set(generateValues(tType, Math.max(14, activeItemCount)))];
    pool.sort((a, b) => a - b);
    const totalTarget = Math.min(10, pool.length);
    // Rangée initiale : 3 valeurs étalées ; candidats : le reste, mélangé
    const startIdx = [0, Math.floor(pool.length / 2), pool.length - 1];
    let shelf = startIdx.map(i => pool[i]);
    let candidates = pool.filter((v, i) => !startIdx.includes(i))
        .sort(() => Math.random() - 0.5)
        .slice(0, totalTarget - shelf.length);
    let placed = 0;
    const toPlace = candidates.length;

    const hud = document.createElement('div');
    hud.style.cssText = 'display:flex;gap:18px;align-items:center;justify-content:center;font-weight:bold;color:#8B90A0;font-size:.95rem;margin-bottom:8px;';
    board.appendChild(hud);

    // Retour #69 : barre de temps par insertion — 8 s pour placer,
    // sinon une vie saute et le chrono repart.
    const TEMPS_MS = 8000;
    const barWrap = document.createElement('div');
    barWrap.className = 'timebar-wrap';
    barWrap.style.marginBottom = '14px';
    const bar = document.createElement('div');
    bar.className = 'timebar';
    barWrap.appendChild(bar);
    board.appendChild(barWrap);

    // Retour #69 (mise en page) : le candidat dans une carte propre,
    // bien séparé de la rangée
    const candZone = document.createElement('div');
    candZone.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:6px;margin-bottom:18px;' +
        'background:#fff;border-radius:16px;padding:14px 26px;box-shadow:0 1px 3px rgba(35,38,47,.08);';
    board.appendChild(candZone);

    const shelfZone = document.createElement('div');
    shelfZone.style.cssText = 'display:flex;align-items:center;justify-content:center;flex-wrap:wrap;gap:2px;row-gap:14px;max-width:100%;' +
        'background:#fff;border-radius:16px;padding:14px 10px;box-shadow:0 1px 3px rgba(35,38,47,.08);';
    board.appendChild(shelfZone);

    let over = false;
    function armTimer() {
        let left = TEMPS_MS;
        bar.style.width = '100%';
        clearInterval(window.speedTimer);
        window.speedTimer = setInterval(() => {
            if (isPaused || over) return;
            left -= 50;
            bar.style.width = Math.max(0, (left / TEMPS_MS) * 100) + '%';
            if (left <= 0) {
                clearInterval(window.speedTimer);
                lives--;
                haptic(50);
                renderHud();
                if (lives <= 0) {
                    over = true;
                    endGame('Le temps a eu raison de la rangée…', false);
                } else {
                    resultDisplay.textContent = 'Trop lent — une vie en moins !';
                    resultDisplay.style.color = '#E0533D';
                    setTimeout(() => { if (!isPaused && !over) resultDisplay.textContent = ''; }, 1200);
                    armTimer();
                }
            }
        }, 50);
    }

    function renderHud() {
        hud.innerHTML = `<span>Placés <b style="color:#4A6CFA">${placed}/${toPlace}</b></span>` +
            `<span style="color:#E0533D;letter-spacing:2px">${'♥'.repeat(lives)}${'♡'.repeat(2 - lives)}</span>`;
    }

    function render() {
        renderHud();
        candZone.innerHTML = '';
        shelfZone.innerHTML = '';
        if (placed >= toPlace) return;

        const cand = candidates[placed];
        const lbl = document.createElement('div');
        lbl.style.cssText = 'font-weight:bold;font-size:.8rem;letter-spacing:.14em;text-transform:uppercase;color:#8B90A0;';
        lbl.textContent = 'À insérer :';
        const candCell = _insertionCell(tType, cand, 1);
        candCell.firstChild.style.boxShadow = '0 0 0 3px #FFFFFF, 0 0 0 6px #4A6CFA';
        candZone.append(lbl, candCell);

        // La rangée rétrécit à mesure qu'elle se remplit pour tenir à l'écran
        const scale = shelf.length > 7 ? 0.62 : (shelf.length > 5 ? 0.75 : 0.9);

        for (let s = 0; s <= shelf.length; s++) {
            const slot = document.createElement('button');
            slot.className = 'slot-btn';
            slot.textContent = '+';
            const slotIdx = s;
            slot.addEventListener('click', () => {
                if (isPaused || over) return;
                const left = slotIdx > 0 ? shelf[slotIdx - 1] : null;
                const right = slotIdx < shelf.length ? shelf[slotIdx] : null;
                const ok = (left === null || left < cand) && (right === null || cand < right);

                if (ok) {
                    shelf.splice(slotIdx, 0, cand);
                    placed++;
                    haptic(10);
                    if (placed >= toPlace) {
                        over = true;
                        clearInterval(window.speedTimer);
                        render();
                        // La rangée finale s'affiche complète, victoire
                        endGame('Rangée parfaitement ordonnée !', true);
                        renderFinalShelf();
                    } else {
                        armTimer();
                        render();
                    }
                } else {
                    lives--;
                    haptic(50);
                    slot.classList.add('slot-error');
                    setTimeout(() => slot.classList.remove('slot-error'), 400);
                    renderHud();
                    if (lives <= 0) {
                        // Montre le bon emplacement avant de conclure
                        const correctIdx = shelf.findIndex(v => v > cand);
                        const slots = shelfZone.querySelectorAll('.slot-btn');
                        const target = slots[correctIdx === -1 ? shelf.length : correctIdx];
                        if (target) target.classList.add('slot-correct');
                        over = true;
                        clearInterval(window.speedTimer);
                        endGame('Plus de vies — le bon emplacement est en vert.', false);
                    }
                }
            });
            shelfZone.appendChild(slot);
            if (s < shelf.length) shelfZone.appendChild(_insertionCell(tType, shelf[s], scale));
        }
    }

    function renderFinalShelf() {
        candZone.innerHTML = '';
        shelfZone.innerHTML = '';
        const scale = shelf.length > 7 ? 0.62 : 0.75;
        shelf.forEach(v => shelfZone.appendChild(_insertionCell(tType, v, scale)));
    }

    render();
    armTimer();
}
