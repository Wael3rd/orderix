// ─── Mode : La Fontaine ──────────────────────────────────────────
// Des bulles numérotées apparaissent en haut et descendent lentement.
// Il faut les éclater dans l'ordre croissant GLOBAL des 10 valeurs :
// la plus petite valeur restante est toujours la bonne cible, même si
// elle n'est pas encore apparue (patience) ou déjà posée au fond.
// 3 vies. Victoire : les 10 bulles éclatées.

function _fontaineUniques(count, max) {
    const set = new Set();
    while (set.size < count) set.add(1 + Math.floor(Math.random() * max));
    return [...set];
}

function showExampleFontaine(day, row, vals) {
    const ex = document.createElement('div');
    ex.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:8px;margin:6px auto;';

    const zone = document.createElement('div');
    zone.style.cssText = 'position:relative;width:220px;height:110px;background:#EEF2FF;border-radius:14px;overflow:hidden;';
    [{ v: 7, left: 20, top: 8 }, { v: 41, left: 90, top: 40 }, { v: 23, left: 158, top: 66 }].forEach((b, i) => {
        const bubble = document.createElement('div');
        bubble.style.cssText = `position:absolute;left:${b.left}px;top:${b.top}px;width:40px;height:40px;` +
            'border-radius:50%;background:#4A6CFA;color:#FFFFFF;display:flex;align-items:center;justify-content:center;' +
            'font-weight:900;font-size:.95rem;box-shadow:0 2px 6px rgba(35,38,47,.2);';
        bubble.textContent = b.v;
        if (i === 0) bubble.style.boxShadow = '0 0 0 3px #FFFFFF, 0 0 0 5px #34B871';
        zone.appendChild(bubble);
    });

    const note = document.createElement('div');
    note.style.cssText = 'font-weight:bold;color:#8B90A0;font-size:.8rem;text-align:center;';
    note.textContent = 'Les bulles descendent : éclatez-les de la plus petite à la plus grande.';

    ex.append(zone, note);
    row.style.flexDirection = 'column';
    row.append(ex);
}

function startGameFontaine() {
    board.style.display = 'block';
    board.style.position = 'relative';
    board.style.height = '420px';
    board.style.overflow = 'hidden';
    board.style.background = '#EEF2FF';
    board.style.borderRadius = '16px';

    const TOTAL = 10;
    const FALL_MS = 7000;
    const SPAWN_MS = 1100;
    const FLOOR_TOP = 420 - 60; // repos des bulles au fond

    let lives = 3;
    let popped = 0;
    let spawned = 0;
    let over = false;

    const values = _fontaineUniques(TOTAL, 99);
    const remaining = [...values].sort((a, b) => a - b); // remaining[0] = prochaine attendue
    const spawnOrder = [...values].sort(() => Math.random() - 0.5);
    const states = []; // { el, val, done, landed }

    const hud = document.createElement('div');
    hud.style.cssText = 'position:absolute;top:0;left:0;right:0;z-index:20;padding:7px 12px;' +
        'background:rgba(255,255,255,.9);font-weight:bold;font-size:.85rem;color:#8B90A0;';
    board.appendChild(hud);

    function renderHud() {
        hud.innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center;">` +
            `<span>Éclatées <b style="color:#4A6CFA">${popped}/${TOTAL}</b></span>` +
            `<span style="color:#E0533D;letter-spacing:2px">${'♥'.repeat(lives)}${'♡'.repeat(3 - lives)}</span></div>` +
            `<div style="font-size:.75rem;color:#8B90A0;">Prochaine : la plus petite restante</div>`;
    }
    renderHud();

    function freezeBubble(st) {
        const top = getComputedStyle(st.el).top;
        st.el.style.transition = 'none';
        st.el.style.top = top;
    }

    function cleanupAll() {
        over = true;
        clearInterval(window.speedTimer);
        states.forEach(st => { if (!st.done) freezeBubble(st); });
    }

    function popBubble(st, isRed) {
        st.done = true;
        freezeBubble(st);
        void st.el.offsetWidth; // force le reflow avant la nouvelle transition
        st.el.style.transition = 'transform .25s ease, opacity .25s ease';
        if (isRed) st.el.style.background = '#E0533D';
        st.el.style.transform = 'scale(0)';
        st.el.style.opacity = '0';
        st.el.style.pointerEvents = 'none';
        setTimeout(() => { if (st.el.parentNode) st.el.remove(); }, 300);
    }

    function checkEnd() {
        if (lives <= 0) {
            cleanupAll();
            endGame('Plus de vies — la fontaine a gagné cette fois.', false);
            return true;
        }
        if (popped >= TOTAL) {
            cleanupAll();
            endGame('Les dix bulles ont éclaté dans l\'ordre !', true);
            return true;
        }
        return false;
    }

    function handleLanding(st) {
        if (over || st.done || st.landed) return;
        if (isPaused) { gameTimeout = setTimeout(() => handleLanding(st), 400); return; }
        if (st.val === remaining[0]) {
            // La prochaine attendue touche le fond : vie perdue, elle éclate en rouge
            lives--;
            haptic(60);
            remaining.shift();
            popped++;
            popBubble(st, true);
            renderHud();
            checkEnd();
        } else {
            // Elle se pose au fond, toujours tapable
            st.landed = true;
            freezeBubble(st);
            st.el.style.top = FLOOR_TOP + 'px';
        }
    }

    function spawnBubble() {
        const val = spawnOrder[spawned++];
        const b = document.createElement('div');
        b.style.cssText = 'position:absolute;top:-58px;width:54px;height:54px;border-radius:50%;' +
            'background:#4A6CFA;color:#FFFFFF;display:flex;align-items:center;justify-content:center;' +
            'font-weight:900;font-size:1.15rem;box-shadow:0 3px 8px rgba(35,38,47,.25);' +
            `transition:top ${FALL_MS}ms linear;touch-action:manipulation;user-select:none;z-index:5;`;
        b.style.left = (4 + Math.random() * 78) + '%';
        b.textContent = val;
        const st = { el: b, val: val, done: false, landed: false };
        states.push(st);

        b.addEventListener('transitionend', (e) => {
            if (e.propertyName === 'top') handleLanding(st);
        });

        b.addEventListener('pointerdown', (e) => {
            e.preventDefault();
            if (isPaused || over || st.done) return;
            if (st.val === remaining[0]) {
                remaining.shift();
                popped++;
                haptic(10);
                popBubble(st, false);
                renderHud();
                checkEnd();
            } else {
                lives--;
                haptic(60);
                b.style.animation = 'wobble .3s';
                setTimeout(() => { b.style.animation = ''; }, 320);
                renderHud();
                checkEnd();
            }
        });

        board.appendChild(b);
        requestAnimationFrame(() => { b.style.top = FLOOR_TOP + 'px'; });
    }

    // Première bulle immédiatement (plateau peuplé de façon synchrone),
    // puis une nouvelle toutes les ~1100 ms.
    spawnBubble();
    clearInterval(window.speedTimer);
    window.speedTimer = setInterval(() => {
        if (isPaused || over) return;
        if (spawned >= TOTAL) { clearInterval(window.speedTimer); return; }
        spawnBubble();
    }, SPAWN_MS);
}
