// ─── Mode : Le Guichet ───────────────────────────────────────────
// 8 clientes avec des tickets numérotés : les servir dans l'ordre
// croissant. Twist mémoire : toutes les 4 s, les tickets se cachent
// pendant 2,5 s — les clientes restent tapables, jouer de mémoire
// est payant. 2 vies. Victoire : les 8 servies.

function _guichetUniques(count, max) {
    const set = new Set();
    while (set.size < count) set.add(1 + Math.floor(Math.random() * max));
    return [...set];
}

function _guichetCliente(ticket) {
    const c = document.createElement('div');
    c.style.cssText = 'position:relative;width:62px;height:62px;border-radius:50%;background:#EEF2FF;' +
        'border:3px solid #4A6CFA;display:flex;align-items:center;justify-content:center;flex-shrink:0;' +
        'touch-action:manipulation;user-select:none;transition:opacity .3s ease, transform .3s ease;';
    const t = document.createElement('span');
    t.style.cssText = 'font-weight:900;font-size:1.15rem;color:#23262F;pointer-events:none;';
    t.textContent = ticket;
    c.appendChild(t);
    return c;
}

function showExampleGuichet(day, row, vals) {
    const ex = document.createElement('div');
    ex.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:10px;margin:6px auto;';

    const salle = document.createElement('div');
    salle.style.cssText = 'display:flex;gap:12px;justify-content:center;align-items:center;';
    [{ t: '11' }, { t: '3', ok: true }, { t: '?', cache: true }].forEach(d => {
        const c = _guichetCliente(d.t);
        c.style.width = '48px'; c.style.height = '48px';
        c.firstChild.style.fontSize = '.95rem';
        if (d.ok) c.style.boxShadow = '0 0 0 3px #FFFFFF, 0 0 0 5px #34B871';
        if (d.cache) { c.style.borderStyle = 'dashed'; c.firstChild.style.color = '#8B90A0'; }
        salle.appendChild(c);
    });

    const note = document.createElement('div');
    note.style.cssText = 'font-weight:bold;color:#8B90A0;font-size:.8rem;text-align:center;max-width:270px;';
    note.textContent = 'Servez le plus petit ticket — même quand ils se cachent, mémorisez !';

    ex.append(salle, note);
    row.style.flexDirection = 'column';
    row.append(ex);
}

function startGameGuichet() {
    board.style.display = 'flex';
    board.style.flexDirection = 'column';
    board.style.alignItems = 'center';
    board.style.gap = '12px';

    const COUNT = 8;
    const SHOW_MS = 4000;
    const HIDE_MS = 2500;
    let lives = 2;
    let nextIdx = 0;
    let served = 0;
    let over = false;
    let hidden = false;
    let phaseTime = 0;

    const tickets = _guichetUniques(COUNT, 20);
    const sorted = [...tickets].sort((a, b) => a - b);
    const shuffled = [...tickets].sort(() => Math.random() - 0.5);

    const hud = document.createElement('div');
    hud.style.cssText = 'display:flex;gap:18px;align-items:center;justify-content:center;font-weight:bold;color:#8B90A0;font-size:.95rem;';
    board.appendChild(hud);

    const guichet = document.createElement('div');
    guichet.style.cssText = 'font-weight:900;font-size:.85rem;color:#4A6CFA;background:#EEF2FF;' +
        'border:2px solid #D9E0FB;border-radius:999px;padding:6px 16px;';
    guichet.textContent = 'Guichet ouvert';
    board.appendChild(guichet);

    // Grille 4×2 : largeur bornée pour forcer 4 clientes par rangée
    const salle = document.createElement('div');
    salle.style.cssText = 'display:flex;flex-wrap:wrap;gap:16px;justify-content:center;max-width:330px;';
    board.appendChild(salle);

    function renderHud() {
        hud.innerHTML = `<span>Servies <b style="color:#4A6CFA">${served}/${COUNT}</b></span>` +
            `<span style="color:#E0533D;letter-spacing:2px">${'♥'.repeat(lives)}${'♡'.repeat(2 - lives)}</span>`;
    }
    renderHud();

    const clientes = {}; // ticket -> { el, span, done }

    function setHidden(h) {
        hidden = h;
        Object.keys(clientes).forEach(k => {
            const c = clientes[k];
            if (c.done) return;
            c.span.textContent = h ? '?' : k;
            c.span.style.color = h ? '#8B90A0' : '#23262F';
            c.el.style.borderStyle = h ? 'dashed' : 'solid';
        });
    }

    function revealAll() {
        Object.keys(clientes).forEach(k => {
            const c = clientes[k];
            if (c.done) return;
            c.span.textContent = k;
            c.span.style.color = '#23262F';
            c.el.style.borderStyle = 'solid';
        });
    }

    shuffled.forEach(ticket => {
        const c = _guichetCliente(ticket);
        clientes[ticket] = { el: c, span: c.firstChild, done: false };

        c.addEventListener('pointerdown', (e) => {
            e.preventDefault();
            const state = clientes[ticket];
            if (isPaused || over || state.done) return;

            if (ticket === sorted[nextIdx]) {
                state.done = true;
                c.style.pointerEvents = 'none';
                c.style.opacity = '0';
                c.style.transform = 'scale(.5)';
                haptic(10);
                nextIdx++;
                served++;
                guichet.textContent = 'Ticket ' + ticket + ' servi';
                renderHud();
                if (served >= COUNT) {
                    over = true;
                    clearInterval(window.speedTimer);
                    endGame('Toute la salle d\'attente est servie, dans l\'ordre !', true);
                }
            } else {
                lives--;
                haptic(60);
                c.style.animation = 'wobble .3s';
                setTimeout(() => { c.style.animation = ''; }, 350);
                renderHud();
                if (lives <= 0) {
                    over = true;
                    clearInterval(window.speedTimer);
                    revealAll();
                    const bonne = clientes[sorted[nextIdx]];
                    if (bonne) bonne.el.style.boxShadow = '0 0 0 3px #FFFFFF, 0 0 0 6px #34B871';
                    endGame('Plus de vies — la bonne cliente est entourée en vert.', false);
                }
            }
        });
        salle.appendChild(c);
    });

    // Cycle mémoire : 4 s visibles, 2,5 s cachés (la pause gèle le cycle)
    clearInterval(window.speedTimer);
    window.speedTimer = setInterval(() => {
        if (isPaused || over) return;
        phaseTime += 100;
        if (!hidden && phaseTime >= SHOW_MS) {
            phaseTime = 0;
            setHidden(true);
        } else if (hidden && phaseTime >= HIDE_MS) {
            phaseTime = 0;
            setHidden(false);
        }
    }, 100);
}
