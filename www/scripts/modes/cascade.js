// ─── Mode phare : Tri Cascade ────────────────────────────────────
// Tri de flux sous pression (façon Speed Match) : les éléments
// défilent un par un, il faut décider PLUS PETIT ou PLUS GRAND que
// la référence avant la fin du compte à rebours. Le rythme accélère,
// la référence change en cours de route. 3 vies.

function showExampleCascade(day, row, vals) {
    const sorted = [...vals].sort((a, b) => a - b);
    const pivot = sorted[Math.floor(sorted.length / 2)];
    const ex = document.createElement('div');
    ex.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:10px;margin:6px auto;';

    const ref = document.createElement('div');
    ref.style.cssText = 'display:flex;align-items:center;gap:8px;font-weight:bold;color:#8B90A0;font-size:.85rem;';
    const refItem = document.createElement('div');
    refItem.className = `item type-${day.type}`;
    refItem.style.margin = '0';
    refItem.style.boxShadow = '0 0 0 3px #FFFFFF, 0 0 0 5px #F5B227';
    applyStyle(refItem, day.type, pivot);
    ref.append(document.createTextNode('Référence :'), refItem);

    const zones = document.createElement('div');
    zones.style.cssText = 'display:flex;gap:10px;';
    ['◄ PLUS PETIT', 'PLUS GRAND ►'].forEach((t, i) => {
        const z = document.createElement('div');
        z.className = 'cascade-zone ' + (i === 0 ? 'small-side' : 'big-side');
        z.style.cssText += ';padding:10px 16px;font-size:.78rem;';
        z.textContent = t;
        zones.appendChild(z);
    });

    ex.append(ref, zones);
    row.style.flexDirection = 'column';
    row.append(ex);
}

function startGameCascade() {
    board.style.display = 'flex';
    board.style.flexDirection = 'column';
    board.style.alignItems = 'center';

    const tType = currentDayConfig.type;
    let lives = 3;
    let idx = 0;
    const total = Math.max(10, Math.min(16, activeItemCount + 2));

    // Pool de valeurs uniques triées ; la référence est piochée au centre
    let pool = [...new Set(generateValues(tType, 40))].sort((a, b) => a - b);
    if (pool.length < 5) pool = [...new Set(generateValues(tType, 40).concat(generateValues(tType, 40)))].sort((a, b) => a - b);

    let pivot;
    function pickPivot() {
        const lo = Math.floor(pool.length * 0.3), hi = Math.ceil(pool.length * 0.7);
        pivot = pool[lo + Math.floor(Math.random() * Math.max(1, hi - lo))];
    }
    function nextValue() {
        let v;
        do { v = pool[Math.floor(Math.random() * pool.length)]; }
        while (Math.abs(v - pivot) < 0.0001);
        return v;
    }
    pickPivot();

    // ── Interface ──
    const hud = document.createElement('div');
    hud.style.cssText = 'display:flex;gap:18px;align-items:center;justify-content:center;font-weight:bold;color:#8B90A0;font-size:.95rem;margin-bottom:10px;';
    board.appendChild(hud);

    const refZone = document.createElement('div');
    refZone.style.cssText = 'display:flex;align-items:center;gap:10px;margin-bottom:14px;font-weight:bold;color:#8B90A0;font-size:.85rem;';
    board.appendChild(refZone);

    const barWrap = document.createElement('div');
    barWrap.className = 'timebar-wrap';
    const bar = document.createElement('div');
    bar.className = 'timebar';
    barWrap.appendChild(bar);
    board.appendChild(barWrap);

    const stage = document.createElement('div');
    stage.style.cssText = 'display:flex;align-items:center;justify-content:center;min-height:92px;margin-bottom:16px;';
    board.appendChild(stage);

    const zones = document.createElement('div');
    zones.style.cssText = 'display:flex;gap:12px;width:100%;max-width:420px;justify-content:center;';
    const zoneSmall = document.createElement('button');
    zoneSmall.className = 'cascade-zone small-side';
    zoneSmall.innerHTML = '◄<br>PLUS PETIT';
    const zoneBig = document.createElement('button');
    zoneBig.className = 'cascade-zone big-side';
    zoneBig.innerHTML = '►<br>PLUS GRAND';
    zones.append(zoneSmall, zoneBig);
    board.appendChild(zones);

    function renderHud() {
        hud.innerHTML = `<span>Objet <b style="color:#4A6CFA">${Math.min(idx + 1, total)}/${total}</b></span>` +
            `<span style="color:#E0533D;letter-spacing:2px">${'♥'.repeat(lives)}${'♡'.repeat(3 - lives)}</span>`;
    }
    function renderPivot() {
        refZone.innerHTML = '';
        const refItem = document.createElement('div');
        refItem.className = `item type-${tType}`;
        refItem.style.margin = '0';
        refItem.style.pointerEvents = 'none';
        refItem.style.boxShadow = '0 0 0 3px #FFFFFF, 0 0 0 5px #F5B227';
        applyStyle(refItem, tType, pivot);
        refZone.append(document.createTextNode('Référence :'), refItem);
    }

    let currentVal = null;
    let answered = false;

    function loseLife(flashZone) {
        lives--;
        haptic(60);
        if (flashZone) {
            flashZone.classList.add('zone-error');
            setTimeout(() => flashZone.classList.remove('zone-error'), 350);
        }
        renderHud();
        if (lives <= 0) {
            clearInterval(window.speedTimer);
            endGame('Plus de vies — le flux a gagné cette fois.', false);
            return true;
        }
        return false;
    }

    function nextItem() {
        if (idx >= total) {
            clearInterval(window.speedTimer);
            endGame('Tout le flux est trié !', true);
            return;
        }
        // La référence change aux tiers du parcours
        if (idx > 0 && idx % Math.ceil(total / 3) === 0) {
            pickPivot();
            renderPivot();
            resultDisplay.textContent = 'Nouvelle référence !';
            resultDisplay.style.color = '#F5B227';
            setTimeout(() => { if (!isPaused && resultDisplay.textContent === 'Nouvelle référence !') resultDisplay.textContent = ''; }, 1100);
        }

        currentVal = nextValue();
        answered = false;
        stage.innerHTML = '';
        const item = document.createElement('div');
        item.className = `item type-${tType}`;
        item.style.margin = '0';
        item.style.pointerEvents = 'none';
        item.style.transform = (item.style.transform ? item.style.transform + ' ' : '') + 'scale(1.15)';
        applyStyle(item, tType, currentVal);
        stage.appendChild(item);
        renderHud();

        // Compte à rebours : de 3,5 s à 1,4 s au fil du flux
        let timeLeft = Math.max(1400, 3500 - idx * 170);
        const budget = timeLeft;
        const step = 50;
        clearInterval(window.speedTimer);
        window.speedTimer = setInterval(() => {
            if (isPaused) return;
            timeLeft -= step;
            bar.style.width = `${(timeLeft / budget) * 100}%`;
            if (timeLeft <= 0) {
                clearInterval(window.speedTimer);
                answered = true;
                idx++;
                if (!loseLife(null)) nextItem();
            }
        }, step);
    }

    function answer(saidSmaller, zone) {
        if (isPaused || answered || currentVal === null) return;
        answered = true;
        clearInterval(window.speedTimer);
        const isSmaller = currentVal < pivot;
        idx++;
        if (saidSmaller === isSmaller) {
            haptic(8);
            zone.classList.add('zone-ok');
            setTimeout(() => zone.classList.remove('zone-ok'), 250);
            nextItem();
        } else {
            if (!loseLife(zone)) nextItem();
        }
    }

    zoneSmall.addEventListener('pointerdown', (e) => { e.preventDefault(); answer(true, zoneSmall); });
    zoneBig.addEventListener('pointerdown', (e) => { e.preventDefault(); answer(false, zoneBig); });

    renderPivot();
    nextItem();
}
