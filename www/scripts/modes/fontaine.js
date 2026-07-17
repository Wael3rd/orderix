// ─── Mode : La Fontaine ──────────────────────────────────────────
// Des balles numérotées REBONDISSENT dans la boîte de jeu.
// Il faut les éclater de la plus petite à la plus grande.
// Manche 1 : 8 balles. Manche 2 : 10 balles, 25 % plus rapides.
// 3 vies pour toute la partie. Tap correct : la balle éclate.
// Tap faux : clignotement rouge, une vie en moins.

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
    [{ v: 7, left: 22, top: 34 }, { v: 41, left: 92, top: 10 }, { v: 23, left: 158, top: 56 }].forEach((b, i) => {
        const ball = document.createElement('div');
        ball.style.cssText = `position:absolute;left:${b.left}px;top:${b.top}px;width:40px;height:40px;` +
            'border-radius:50%;background:#4A6CFA;color:#FFFFFF;display:flex;align-items:center;justify-content:center;' +
            'font-weight:900;font-size:.95rem;box-shadow:0 2px 6px rgba(35,38,47,.2);';
        ball.textContent = b.v;
        if (i === 0) ball.style.boxShadow = '0 0 0 3px #FFFFFF, 0 0 0 5px #34B871';
        zone.appendChild(ball);
    });
    // Petite flèche de rebond sur une paroi
    const arrow = document.createElement('div');
    arrow.style.cssText = 'position:absolute;right:6px;top:20px;color:#8B90A0;font-weight:900;font-size:1.05rem;';
    arrow.textContent = '⤢';
    zone.appendChild(arrow);

    const note = document.createElement('div');
    note.style.cssText = 'font-weight:bold;color:#8B90A0;font-size:.8rem;text-align:center;max-width:230px;';
    note.textContent = 'Elles rebondissent ! Éclatez-les de la plus petite à la plus grande.';

    ex.append(zone, note);
    row.style.flexDirection = 'column';
    row.append(ex);
}

function startGameFontaine() {
    board.style.display = 'block';
    board.style.position = 'relative';
    board.style.height = '420px';
    board.style.padding = '0';
    board.style.overflow = 'hidden';
    board.style.background = '#EEF2FF';
    board.style.borderRadius = '16px';

    const BALL = 56;                       // diamètre en px
    const H = 420;
    const W = Math.max(board.clientWidth, BALL + 20);
    const TOTAL_ROUNDS = 2;

    let lives = 3;
    let round = 1;
    let over = false;
    let rafId = 0;
    let lastT = 0;

    let balls = [];      // { el, val, x, y, vx, vy, done }
    let remaining = [];  // valeurs triées ; remaining[0] = prochaine attendue
    let popped = 0;
    let total = 0;

    // HUD au-dessus de la zone de jeu (bandeau superposé, transparent aux taps)
    const hud = document.createElement('div');
    hud.style.cssText = 'position:absolute;top:0;left:0;right:0;z-index:20;padding:7px 12px;' +
        'background:rgba(255,255,255,.9);font-weight:bold;font-size:.9rem;color:#8B90A0;pointer-events:none;';
    board.appendChild(hud);

    function renderHud() {
        hud.innerHTML = '<div style="display:flex;justify-content:space-between;align-items:center;">' +
            `<span>Manche <b style="color:#23262F">${round}/${TOTAL_ROUNDS}</b></span>` +
            `<span>Balles <b style="color:#4A6CFA">${popped}/${total}</b></span>` +
            `<span style="color:#E0533D;letter-spacing:2px">${'♥'.repeat(lives)}${'♡'.repeat(3 - lives)}</span></div>`;
    }

    function stopAnim() {
        if (rafId) { cancelAnimationFrame(rafId); rafId = 0; }
    }

    // ── Boucle d'animation unique ────────────────────────────────
    function tick(now) {
        if (isPaused || over) return; // pas de replanification : partie terminée ou en pause
        const dt = Math.min((now - lastT) / 1000, 0.05); // borné (retour d'onglet)
        lastT = now;
        for (let i = 0; i < balls.length; i++) {
            const b = balls[i];
            if (b.done) continue;
            b.x += b.vx * dt;
            b.y += b.vy * dt;
            // Rebond élastique sur les 4 parois
            if (b.x <= 0) { b.x = 0; b.vx = Math.abs(b.vx); }
            else if (b.x >= W - BALL) { b.x = W - BALL; b.vx = -Math.abs(b.vx); }
            if (b.y <= 0) { b.y = 0; b.vy = Math.abs(b.vy); }
            else if (b.y >= H - BALL) { b.y = H - BALL; b.vy = -Math.abs(b.vy); }
            b.el.style.left = b.x + 'px';
            b.el.style.top = b.y + 'px';
        }
        rafId = requestAnimationFrame(tick);
    }

    function popBall(b) {
        b.done = true;
        b.el.style.transition = 'transform .2s ease, opacity .2s ease';
        b.el.style.transform = 'scale(0)';
        b.el.style.opacity = '0';
        b.el.style.pointerEvents = 'none';
        setTimeout(() => { if (b.el.parentNode) b.el.remove(); }, 200);
    }

    function loseGame() {
        over = true;
        stopAnim();
        // Figer les balles et entourer la bonne en vert
        const target = balls.find(x => !x.done && x.val === remaining[0]);
        if (target) target.el.style.boxShadow = '0 0 0 3px #FFFFFF, 0 0 0 6px #34B871';
        endGame('Plus de vies — la bonne balle est entourée en vert.', false);
    }

    function onTap(b, e) {
        e.preventDefault();
        if (isPaused || over || b.done) return;
        if (b.val === remaining[0]) {
            remaining.shift();
            popped++;
            haptic(8);
            popBall(b);
            renderHud();
            if (popped >= total) {
                if (round < TOTAL_ROUNDS) {
                    round++;
                    stopAnim();
                    resultDisplay.textContent = 'Manche 2 : plus de balles, plus vite !';
                    resultDisplay.style.color = '#34B871';
                    haptic([12, 40, 12]);
                    gameTimeout = setTimeout(() => {
                        if (isPaused) return;
                        resultDisplay.textContent = '';
                        startRound(10, 1.25);
                    }, 700);
                } else {
                    over = true;
                    stopAnim();
                    endGame('Toutes les balles ont éclaté dans l\'ordre !', true);
                }
            }
        } else {
            lives--;
            haptic(50);
            b.el.style.background = '#E0533D';
            b.el.style.animation = 'wobble .3s';
            setTimeout(() => {
                if (b.done) return;
                b.el.style.background = '#4A6CFA';
                b.el.style.animation = '';
            }, 300);
            renderHud();
            if (lives <= 0) loseGame();
        }
    }

    // Positions initiales sans chevauchement (rejet, distance min entre coins)
    function placePositions(count) {
        const pts = [];
        const minY = 38;                    // sous le bandeau HUD
        const maxX = W - BALL, maxY = H - BALL - 4;
        for (let i = 0; i < count; i++) {
            let x = 0, y = minY;
            for (let a = 0; a < 300; a++) {
                x = Math.random() * maxX;
                y = minY + Math.random() * (maxY - minY);
                if (pts.every(p => Math.hypot(p.x - x, p.y - y) >= BALL + 4)) break;
            }
            pts.push({ x: x, y: y });
        }
        return pts;
    }

    function startRound(count, speedMul) {
        balls = [];
        popped = 0;
        total = count;
        const values = _fontaineUniques(count, 99);
        remaining = [...values].sort((a, b) => a - b);
        const pts = placePositions(count);
        renderHud();

        values.forEach((val, i) => {
            const el = document.createElement('div');
            el.style.cssText = `position:absolute;left:${pts[i].x}px;top:${pts[i].y}px;width:${BALL}px;height:${BALL}px;` +
                'border-radius:50%;background:#4A6CFA;color:#FFFFFF;display:flex;align-items:center;justify-content:center;' +
                'font-weight:900;font-size:1.25rem;box-shadow:0 3px 8px rgba(35,38,47,.25);' +
                'touch-action:manipulation;user-select:none;z-index:5;';
            el.textContent = val;
            const speed = (90 + Math.random() * 60) * speedMul;
            const angle = Math.random() * Math.PI * 2;
            const b = {
                el: el, val: val,
                x: pts[i].x, y: pts[i].y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                done: false
            };
            el.addEventListener('pointerdown', (e) => onTap(b, e));
            balls.push(b);
            board.appendChild(el);
        });

        lastT = performance.now();
        stopAnim();
        rafId = requestAnimationFrame(tick);
    }

    startRound(8, 1);
}
