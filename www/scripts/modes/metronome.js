// ─── Mode : Le Métronome ─────────────────────────────────────────
// La Chaîne sous tempo : 12 nombres à taper dans l'ordre croissant,
// mais chaque tap doit arriver avant la fin de la barre de temps.
// Le tempo démarre à 3,0 s et se resserre de 150 ms par bonne réponse
// (plancher 1,1 s). Temps écoulé ou tap faux : -1 vie. 2 vies.

function _metronomeUniques(count, max) {
    const set = new Set();
    while (set.size < count) set.add(1 + Math.floor(Math.random() * max));
    return [...set];
}

function showExampleMetronome(day, row, vals) {
    const ex = document.createElement('div');
    ex.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:10px;margin:6px auto;';

    const grid = document.createElement('div');
    grid.style.cssText = 'display:flex;gap:10px;justify-content:center;align-items:center;';
    const sample = [34, 8, 61, 22];
    const sorted = [...sample].sort((a, b) => a - b);
    sample.forEach(v => {
        const t = document.createElement('div');
        t.style.cssText = 'position:relative;width:48px;height:48px;border-radius:10px;background:#4A6CFA;' +
            'color:#FFFFFF;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:1rem;';
        t.textContent = v;
        if (v === sorted[0]) {
            t.style.opacity = '.45';
            const badge = document.createElement('div');
            badge.style.cssText = 'position:absolute;bottom:-9px;left:50%;transform:translateX(-50%);' +
                'background:#34B871;color:#fff;width:18px;height:18px;border-radius:50%;display:flex;' +
                'align-items:center;justify-content:center;font-weight:700;font-size:10px;';
            badge.textContent = '1';
            t.appendChild(badge);
        }
        if (v === sorted[1]) t.style.boxShadow = '0 0 0 3px #FFFFFF, 0 0 0 5px #4A6CFA';
        grid.appendChild(t);
    });

    const barWrap = document.createElement('div');
    barWrap.style.cssText = 'width:180px;height:10px;background:#E4E7F0;border-radius:999px;overflow:hidden;margin-top:6px;';
    const bar = document.createElement('div');
    bar.style.cssText = 'height:100%;width:55%;border-radius:999px;background:linear-gradient(90deg,#4A6CFA,#F5B227);';
    barWrap.appendChild(bar);

    const note = document.createElement('div');
    note.style.cssText = 'font-weight:bold;color:#8B90A0;font-size:.8rem;text-align:center;';
    note.textContent = 'Ordre croissant, mais chaque tap doit battre le tempo.';

    ex.append(grid, barWrap, note);
    row.style.flexDirection = 'column';
    row.append(ex);
}

function startGameMetronome() {
    board.style.display = 'flex';
    board.style.flexDirection = 'column';
    board.style.alignItems = 'center';

    const COUNT = 12;
    let lives = 2;
    let tempo = 3000;
    let nextIdx = 0;
    let over = false;

    const vals = _metronomeUniques(COUNT, 99);
    const sorted = [...vals].sort((a, b) => a - b);
    const shuffled = [...vals].sort(() => Math.random() - 0.5);

    const hud = document.createElement('div');
    hud.style.cssText = 'display:flex;gap:18px;align-items:center;justify-content:center;font-weight:bold;color:#8B90A0;font-size:.95rem;margin-bottom:10px;';
    board.appendChild(hud);

    const barWrap = document.createElement('div');
    barWrap.className = 'timebar-wrap';
    const bar = document.createElement('div');
    bar.className = 'timebar';
    barWrap.appendChild(bar);
    board.appendChild(barWrap);

    const grid = document.createElement('div');
    grid.style.cssText = 'display:flex;flex-wrap:wrap;column-gap:14px;row-gap:32px;justify-content:center;max-width:340px;';
    board.appendChild(grid);

    function renderHud() {
        hud.innerHTML = `<span>Chaîne <b style="color:#4A6CFA">${nextIdx}/${COUNT}</b> · tempo <b style="color:#23262F">${(tempo / 1000).toFixed(1)} s</b></span>` +
            `<span style="color:#E0533D;letter-spacing:2px">${'♥'.repeat(lives)}${'♡'.repeat(2 - lives)}</span>`;
    }

    function loseGame(message) {
        over = true;
        clearInterval(window.speedTimer);
        showSolutionHighlight([sorted[nextIdx]]);
        endGame(message, false);
    }

    function armBar() {
        let timeLeft = tempo;
        const budget = tempo;
        bar.style.width = '100%';
        clearInterval(window.speedTimer);
        window.speedTimer = setInterval(() => {
            if (isPaused || over) return;
            timeLeft -= 50;
            bar.style.width = `${Math.max(0, (timeLeft / budget) * 100)}%`;
            if (timeLeft <= 0) {
                // Temps écoulé sans tap : vie en moins, la cible reste la même
                lives--;
                haptic(60);
                renderHud();
                if (lives <= 0) {
                    loseGame('Le tempo a eu raison de vous — le bon nombre est entouré.');
                } else {
                    resultDisplay.textContent = 'Trop lent ! On repart.';
                    resultDisplay.style.color = '#E0533D';
                    setTimeout(() => { if (!isPaused && resultDisplay.textContent === 'Trop lent ! On repart.') resultDisplay.textContent = ''; }, 900);
                    armBar();
                }
            }
        }, 50);
    }

    shuffled.forEach(val => {
        const item = document.createElement('div');
        item.className = 'item';
        item.style.margin = '0';
        item.style.color = '#FFFFFF';
        item.style.fontWeight = '900';
        item.style.fontSize = '1.2rem';
        item.dataset.value = val;
        item.textContent = val;

        item.addEventListener('pointerdown', (e) => {
            e.preventDefault();
            if (isPaused || over || item.classList.contains('chain-done')) return;

            if (val === sorted[nextIdx]) {
                item.classList.add('chain-done');
                const badge = document.createElement('div');
                badge.className = 'badge';
                badge.textContent = nextIdx + 1;
                item.appendChild(badge);
                nextIdx++;
                tempo = Math.max(1100, tempo - 150);
                haptic(8);
                renderHud();
                if (nextIdx >= COUNT) {
                    over = true;
                    clearInterval(window.speedTimer);
                    bar.style.width = '100%';
                    endGame('Douze temps, zéro fausse note !', true);
                } else {
                    armBar();
                }
            } else {
                lives--;
                haptic(50);
                item.classList.add('error');
                setTimeout(() => item.classList.remove('error'), 350);
                renderHud();
                if (lives <= 0) loseGame('Plus de vies — le bon nombre est entouré.');
            }
        });
        grid.appendChild(item);
    });

    renderHud();
    armBar();
}
