// ─── Mode : L'Embouteillage (jour 26) ────────────────────────────
// Inspiré de Rush Hour / Unblock Me / Parking Jam — l'un des genres
// les plus installés du casual. Faites glisser les véhicules dans
// leur axe pour ouvrir la voie à la voiture DORÉE jusqu'à la sortie.
// Annulation illimitée, compteur de manœuvres. Grilles pré-vérifiées
// résolubles (banque de niveaux validés à la main).

const _EMB_LEVELS = [
    // {r, c, len, dir 'h'|'v', gold?} — sortie : ligne 2, côté droit
    [
        { r: 2, c: 1, len: 2, dir: 'h', gold: true },
        { r: 1, c: 3, len: 2, dir: 'v' },
        { r: 4, c: 2, len: 2, dir: 'h' }
    ],
    [
        { r: 2, c: 0, len: 2, dir: 'h', gold: true },
        { r: 2, c: 2, len: 2, dir: 'v' },
        { r: 1, c: 4, len: 3, dir: 'v' },
        { r: 5, c: 0, len: 3, dir: 'h' }
    ],
    [
        { r: 2, c: 2, len: 2, dir: 'h', gold: true },
        { r: 0, c: 4, len: 3, dir: 'v' },
        { r: 5, c: 0, len: 2, dir: 'h' },
        { r: 3, c: 1, len: 2, dir: 'v' }
    ],
    [
        { r: 2, c: 1, len: 2, dir: 'h', gold: true },
        { r: 1, c: 3, len: 3, dir: 'v' },
        { r: 0, c: 0, len: 2, dir: 'h' },
        { r: 4, c: 4, len: 2, dir: 'v' }
    ]
];

const _EMB_COLORS = ['#4A6CFA', '#34B871', '#8B5CF6', '#E0533D', '#3553D1', '#1E7A74'];

function showExampleEmbouteillage(day, row, vals) {
    const ex = document.createElement('div');
    ex.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:10px;margin:6px auto;';

    const mini = document.createElement('div');
    mini.style.cssText = 'position:relative;width:132px;height:132px;background:#E8EAF1;border-radius:10px;';
    const mk = (r, c, w, h, color) => {
        const v = document.createElement('div');
        v.style.cssText = `position:absolute;left:${c * 33 + 3}px;top:${r * 33 + 3}px;width:${w * 33 - 6}px;` +
            `height:${h * 33 - 6}px;border-radius:7px;background:${color};box-shadow:inset 0 -2px 0 rgba(0,0,0,.18);`;
        return v;
    };
    mini.append(mk(1, 0, 2, 1, '#F5B227'), mk(0, 2, 1, 2, '#4A6CFA'), mk(3, 1, 2, 1, '#34B871'));
    const arrow = document.createElement('div');
    arrow.style.cssText = 'position:absolute;right:-16px;top:38px;font-weight:900;color:#F5B227;font-size:1rem;';
    arrow.textContent = '⇒';
    mini.appendChild(arrow);

    const note = document.createElement('div');
    note.style.cssText = 'font-weight:bold;color:#8B90A0;font-size:.8rem;text-align:center;max-width:260px;';
    note.textContent = 'Glissez la voiture bleue vers le haut pour libérer la dorée.';

    ex.append(mini, note);
    row.style.flexDirection = 'column';
    row.append(ex);
}

function startGameEmbouteillage() {
    board.style.display = 'flex';
    board.style.flexDirection = 'column';
    board.style.alignItems = 'center';
    board.style.gap = '12px';
    board.style.touchAction = 'none';

    const S = 6, CELL = 52, GAP = 4;
    const EXIT_ROW = 2;
    const cars = _EMB_LEVELS[Math.floor(Math.random() * _EMB_LEVELS.length)]
        .map((c, i) => ({ ...c, color: c.gold ? '#F5B227' : _EMB_COLORS[i % _EMB_COLORS.length] }));

    let moves = 0;
    let history = [];
    let over = false;

    const hud = document.createElement('div');
    hud.style.cssText = 'display:flex;gap:18px;align-items:center;font-weight:bold;color:#8B90A0;font-size:.95rem;';
    board.appendChild(hud);

    const stageW = S * CELL + (S + 1) * GAP;
    const stage = document.createElement('div');
    stage.style.cssText = `position:relative;width:${stageW}px;height:${stageW}px;background:#D8DCE8;border-radius:14px;`;
    board.appendChild(stage);

    // Marqueur de sortie
    const exit = document.createElement('div');
    exit.style.cssText = `position:absolute;right:-14px;top:${GAP + EXIT_ROW * (CELL + GAP) + CELL / 2 - 12}px;` +
        'font-weight:900;color:#F5B227;font-size:1.4rem;';
    exit.textContent = '⇒';
    stage.appendChild(exit);

    const undoBtn = document.createElement('button');
    undoBtn.className = 'btn btn-ghost';
    undoBtn.textContent = '↩ Annuler';
    undoBtn.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        if (isPaused || over || !history.length) return;
        const h = history.pop();
        const car = cars[h.vi];
        if (car.dir === 'h') car.c -= h.delta; else car.r -= h.delta;
        moves++;
        haptic(8);
        render();
    });
    board.appendChild(undoBtn);

    function cellFree(r, c, exceptVi) {
        if (r < 0 || r >= S || c < 0 || c >= S) return false;
        return !cars.some((car, vi) => {
            if (vi === exceptVi) return false;
            for (let k = 0; k < car.len; k++) {
                const rr = car.dir === 'v' ? car.r + k : car.r;
                const cc = car.dir === 'h' ? car.c + k : car.c;
                if (rr === r && cc === c) return true;
            }
            return false;
        });
    }

    function tryStep(vi, dir) {
        const car = cars[vi];
        if (car.dir === 'h') {
            const target = dir > 0 ? [car.r, car.c + car.len] : [car.r, car.c - 1];
            // La dorée peut sortir par la droite quand la voie est libre
            if (car.gold && dir > 0 && car.c + car.len >= S) return 'exit';
            if (!cellFree(target[0], target[1], vi)) return false;
            car.c += dir;
        } else {
            const target = dir > 0 ? [car.r + car.len, car.c] : [car.r - 1, car.c];
            if (!cellFree(target[0], target[1], vi)) return false;
            car.r += dir;
        }
        return true;
    }

    function render() {
        hud.innerHTML = `<span>Manœuvres : <b style="color:#4A6CFA">${moves}</b></span>` +
            '<span>Amenez la <b style="color:#F5B227">dorée</b> à la sortie ⇒</span>';

        stage.querySelectorAll('.emb-car').forEach(n => n.remove());
        cars.forEach((car, vi) => {
            const w = car.dir === 'h' ? car.len : 1;
            const h = car.dir === 'v' ? car.len : 1;
            const el = document.createElement('div');
            el.className = 'emb-car';
            el.style.cssText = `position:absolute;left:${GAP + car.c * (CELL + GAP)}px;top:${GAP + car.r * (CELL + GAP)}px;` +
                `width:${w * CELL + (w - 1) * GAP}px;height:${h * CELL + (h - 1) * GAP}px;border-radius:12px;` +
                `background:${car.color};box-shadow:inset 0 -4px 0 rgba(0,0,0,.18), 0 2px 4px rgba(35,38,47,.2);` +
                'touch-action:none;transition:left .08s,top .08s;';
            if (car.gold) {
                const star = document.createElement('div');
                star.style.cssText = 'position:absolute;inset:0;display:flex;align-items:center;justify-content:center;' +
                    'color:#fff;font-weight:900;font-size:1.2rem;';
                star.textContent = '★';
                el.appendChild(star);
            }
            el.addEventListener('pointerdown', (e) => {
                e.preventDefault();
                if (isPaused || over) return;
                startDrag(vi, e);
            });
            stage.appendChild(el);
        });
    }

    let drag = null;
    function startDrag(vi, e) {
        drag = { vi: vi, lastX: e.clientX, lastY: e.clientY, acc: 0, delta: 0 };
    }
    stage.addEventListener('pointermove', (e) => {
        if (!drag || isPaused || over) return;
        const car = cars[drag.vi];
        const d = car.dir === 'h' ? e.clientX - drag.lastX : e.clientY - drag.lastY;
        drag.lastX = e.clientX; drag.lastY = e.clientY;
        drag.acc += d;
        while (Math.abs(drag.acc) >= CELL * 0.7) {
            const dir = drag.acc > 0 ? 1 : -1;
            const res = tryStep(drag.vi, dir);
            if (res === 'exit') {
                finishExit();
                return;
            }
            if (!res) { drag.acc = 0; break; }
            drag.delta += dir;
            drag.acc -= dir * CELL * 0.7;
            haptic(6);
            render();
        }
    });
    const endDrag = () => {
        if (!drag) return;
        if (drag.delta !== 0) {
            history.push({ vi: drag.vi, delta: drag.delta });
            moves++;
            render();
        }
        drag = null;
    };
    stage.addEventListener('pointerup', endDrag);
    stage.addEventListener('pointercancel', endDrag);
    stage.addEventListener('pointerleave', endDrag);

    function finishExit() {
        over = true;
        drag = null;
        const gold = cars.find(c => c.gold);
        gold.c = S + 1; // glisse hors du plateau
        render();
        haptic([12, 40, 16]);
        endGame(`Sortie en ${moves + 1} manœuvre${moves ? 's' : ''} — la voie était toute tracée !`, true);
    }

    render();
}
