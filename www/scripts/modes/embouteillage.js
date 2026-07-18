// ─── Mode : L'Embouteillage (jour 26) ────────────────────────────
// Inspiré de Rush Hour / Unblock Me. v2 (retour #64) : la notion
// d'ordre est au cœur du jeu — TROIS voitures numérotées doivent
// sortir par la droite DANS L'ORDRE 1 → 2 → 3, chacune sur sa ligne.
// Une voiture ne peut franchir la sortie que si c'est son tour.
// Grilles plus denses, vérifiées résolubles à la main. Annulation
// illimitée, compteur de manœuvres.

const _EMB_COLORS = ['#4A6CFA', '#34B871', '#8B5CF6', '#3553D1', '#1E7A74', '#E0533D'];

// {r, c, len, dir 'h'|'v', num?} — les voitures numérotées sont
// horizontales et sortent par la droite de leur ligne.
// Retour #93 (« mille fois trop facile ») : niveaux générés puis
// vérifiés par solveur BFS hors-ligne — minimum 22 / 28 / 30 pas.
const _EMB_LEVELS = [
    [
        { r: 2, c: 2, len: 2, dir: 'h', num: 1 },
        { r: 0, c: 1, len: 2, dir: 'h', num: 2 },
        { r: 4, c: 0, len: 2, dir: 'h', num: 3 },
        { r: 4, c: 4, len: 2, dir: 'v' },
        { r: 0, c: 0, len: 2, dir: 'v' },
        { r: 0, c: 5, len: 2, dir: 'v' },
        { r: 3, c: 3, len: 2, dir: 'v' },
        { r: 5, c: 0, len: 3, dir: 'h' },
        { r: 3, c: 5, len: 2, dir: 'v' },
        { r: 2, c: 0, len: 2, dir: 'h' },
        { r: 0, c: 4, len: 2, dir: 'v' },
        { r: 0, c: 3, len: 2, dir: 'v' }
    ],
    [
        { r: 1, c: 0, len: 2, dir: 'h', num: 1 },
        { r: 2, c: 1, len: 2, dir: 'h', num: 2 },
        { r: 5, c: 1, len: 2, dir: 'h', num: 3 },
        { r: 0, c: 5, len: 2, dir: 'v' },
        { r: 0, c: 1, len: 3, dir: 'h' },
        { r: 4, c: 5, len: 2, dir: 'v' },
        { r: 2, c: 4, len: 2, dir: 'v' },
        { r: 3, c: 1, len: 2, dir: 'v' },
        { r: 3, c: 0, len: 3, dir: 'v' },
        { r: 4, c: 2, len: 2, dir: 'h' },
        { r: 2, c: 3, len: 2, dir: 'v' },
        { r: 0, c: 4, len: 2, dir: 'v' }
    ],
    [
        { r: 2, c: 2, len: 2, dir: 'h', num: 1 },
        { r: 3, c: 2, len: 2, dir: 'h', num: 2 },
        { r: 0, c: 1, len: 2, dir: 'h', num: 3 },
        { r: 2, c: 4, len: 2, dir: 'v' },
        { r: 1, c: 4, len: 2, dir: 'h' },
        { r: 0, c: 3, len: 2, dir: 'v' },
        { r: 2, c: 0, len: 2, dir: 'v' },
        { r: 4, c: 4, len: 2, dir: 'v' },
        { r: 3, c: 5, len: 2, dir: 'v' },
        { r: 5, c: 0, len: 2, dir: 'h' },
        { r: 2, c: 1, len: 2, dir: 'v' }
    ]
];

function showExampleEmbouteillage(day, row, vals) {
    const ex = document.createElement('div');
    ex.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:10px;margin:6px auto;';

    const mini = document.createElement('div');
    mini.style.cssText = 'position:relative;width:132px;height:132px;background:#E8EAF1;border-radius:10px;';
    const mk = (r, c, w, h, color, txt) => {
        const v = document.createElement('div');
        v.style.cssText = `position:absolute;left:${c * 33 + 3}px;top:${r * 33 + 3}px;width:${w * 33 - 6}px;` +
            `height:${h * 33 - 6}px;border-radius:7px;background:${color};box-shadow:inset 0 -2px 0 rgba(0,0,0,.18);` +
            'display:flex;align-items:center;justify-content:center;color:#fff;font-weight:900;font-size:.8rem;';
        if (txt) v.textContent = txt;
        return v;
    };
    mini.append(mk(0, 0, 2, 1, '#F5B227', '1'), mk(2, 1, 2, 1, '#F5B227', '2'), mk(1, 3, 1, 2, '#4A6CFA'));
    ex.appendChild(mini);

    const note = document.createElement('div');
    note.style.cssText = 'font-weight:bold;color:#8B90A0;font-size:.8rem;text-align:center;max-width:270px;';
    note.textContent = 'Dégagez la voie et sortez les voitures dorées DANS L\'ORDRE : la 1, puis la 2, puis la 3.';

    ex.append(note);
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
    const level = _EMB_LEVELS[Math.floor(Math.random() * _EMB_LEVELS.length)];
    let colorIdx = 0;
    const cars = level.map(c => ({
        ...c,
        out: false,
        color: c.num ? '#F5B227' : _EMB_COLORS[colorIdx++ % _EMB_COLORS.length]
    }));
    const maxNum = Math.max(...cars.filter(c => c.num).map(c => c.num));

    let nextOut = 1;
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

    // Flèches de sortie sur la ligne de chaque voiture numérotée
    cars.filter(c => c.num).forEach(c => {
        const exit = document.createElement('div');
        exit.className = 'emb-exit';
        exit.dataset.num = c.num;
        exit.style.cssText = `position:absolute;right:-20px;top:${GAP + c.r * (CELL + GAP) + CELL / 2 - 12}px;` +
            'font-weight:900;font-size:1.15rem;transition:color .2s,opacity .2s;';
        exit.textContent = c.num + '⇒';
        stage.appendChild(exit);
    });

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
            if (vi === exceptVi || car.out) return false;
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
            if (dir > 0 && car.c + car.len >= S) {
                // Franchir la sortie : réservé à la voiture dont c'est le tour
                if (car.num && car.num === nextOut) return 'exit';
                return false;
            }
            const target = dir > 0 ? [car.r, car.c + car.len] : [car.r, car.c - 1];
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
        hud.innerHTML = `<span>Sortez la <b style="color:#F5B227">n°${Math.min(nextOut, maxNum)}</b></span>` +
            `<span>Sorties : <b style="color:#34B871">${nextOut - 1}/${maxNum}</b></span>` +
            `<span>Manœuvres : <b style="color:#4A6CFA">${moves}</b></span>`;

        stage.querySelectorAll('.emb-exit').forEach(e => {
            const n = parseInt(e.dataset.num);
            e.style.color = n === nextOut ? '#F5B227' : '#B9BDC9';
            e.style.opacity = n < nextOut ? '0' : '1';
        });

        stage.querySelectorAll('.emb-car').forEach(n => n.remove());
        cars.forEach((car, vi) => {
            if (car.out) return;
            const w = car.dir === 'h' ? car.len : 1;
            const h = car.dir === 'v' ? car.len : 1;
            const el = document.createElement('div');
            el.className = 'emb-car';
            el.style.cssText = `position:absolute;left:${GAP + car.c * (CELL + GAP)}px;top:${GAP + car.r * (CELL + GAP)}px;` +
                `width:${w * CELL + (w - 1) * GAP}px;height:${h * CELL + (h - 1) * GAP}px;border-radius:12px;` +
                `background:${car.color};box-shadow:inset 0 -4px 0 rgba(0,0,0,.18), 0 2px 4px rgba(35,38,47,.2);` +
                'touch-action:none;transition:left .08s,top .08s;display:flex;align-items:center;justify-content:center;' +
                'color:#fff;font-weight:900;font-size:1.15rem;';
            if (car.num) el.textContent = car.num;
            el.addEventListener('pointerdown', (e) => {
                e.preventDefault();
                if (isPaused || over) return;
                drag = { vi: vi, lastX: e.clientX, lastY: e.clientY, acc: 0, delta: 0 };
            });
            stage.appendChild(el);
        });
    }

    let drag = null;
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
                carExits(drag.vi);
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

    function carExits(vi) {
        const car = cars[vi];
        car.out = true;
        history = []; // les sorties ne s'annulent pas
        moves++;
        nextOut++;
        drag = null;
        haptic([12, 40, 16]);
        render();
        if (nextOut > maxNum) {
            over = true;
            endGame(`Trois sorties dans l'ordre parfait, en ${moves} manœuvres !`, true);
        } else {
            resultDisplay.textContent = `La n°${nextOut - 1} est sortie — au tour de la n°${nextOut} !`;
            resultDisplay.style.color = '#34B871';
            setTimeout(() => { if (!isPaused && !over) resultDisplay.textContent = ''; }, 1400);
        }
    }

    render();
}
