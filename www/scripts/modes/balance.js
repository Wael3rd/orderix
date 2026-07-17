// ─── Mode : La Balance ───────────────────────────────────────────
// 5 objets A-E ont des poids secrets (permutation de 1..5).
// 4 pesées dessinées en CSS (le plateau le plus BAS porte le plus
// LOURD) déterminent l'ordre de façon unique (vérifié par force
// brute sur les 120 permutations). Le joueur touche ensuite les
// objets du plus léger au plus lourd. 2 vies.

const _BAL_OBJS = [
    { l: 'A', bg: '#D6E0FF', bd: '#4A6CFA' },
    { l: 'B', bg: '#CFEFDD', bd: '#34B871' },
    { l: 'C', bg: '#FDEBBE', bd: '#F5B227' },
    { l: 'D', bg: '#F9D6CF', bd: '#E0533D' },
    { l: 'E', bg: '#E6D9FB', bd: '#8B5CF6' }
];

function _balShuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

function _balAllPerms() {
    const res = [];
    const a = [1, 2, 3, 4, 5];
    (function rec(k) {
        if (k === a.length) { res.push([...a]); return; }
        for (let i = k; i < a.length; i++) {
            [a[k], a[i]] = [a[i], a[k]];
            rec(k + 1);
            [a[k], a[i]] = [a[i], a[k]];
        }
    })(0);
    return res;
}

// L'ordre total est-il UNIQUEMENT déterminé par ces 4 comparaisons ?
function _balUnique(weights, pairs, perms) {
    let count = 0;
    for (const p of perms) {
        let ok = true;
        for (const [i, j] of pairs) {
            if ((p[i] > p[j]) !== (weights[i] > weights[j])) { ok = false; break; }
        }
        if (ok && ++count > 1) return false;
    }
    return count === 1;
}

function _balGenerate() {
    const perms = _balAllPerms();
    const allPairs = [];
    for (let i = 0; i < 5; i++) for (let j = i + 1; j < 5; j++) allPairs.push([i, j]);

    for (let attempt = 0; attempt < 400; attempt++) {
        const weights = _balShuffle([1, 2, 3, 4, 5]);
        const pairs = _balShuffle(allPairs).slice(0, 4);
        if (_balUnique(weights, pairs, perms)) return { weights, pairs };
    }
    // Repli garanti : les 4 paires consécutives de l'ordre réel (toujours unique)
    const weights = _balShuffle([1, 2, 3, 4, 5]);
    const order = [0, 1, 2, 3, 4].sort((a, b) => weights[a] - weights[b]);
    const pairs = _balShuffle([0, 1, 2, 3].map(k =>
        Math.random() < 0.5 ? [order[k], order[k + 1]] : [order[k + 1], order[k]]
    ));
    return { weights, pairs };
}

function _balCircle(idx, size) {
    const o = _BAL_OBJS[idx];
    const d = document.createElement('div');
    d.style.cssText = `width:${size}px;height:${size}px;border-radius:50%;flex-shrink:0;` +
        `background:${o.bg};border:3px solid ${o.bd};position:relative;` +
        `display:flex;align-items:center;justify-content:center;` +
        `font-weight:900;font-size:${Math.round(size * 0.42)}px;color:#23262F;user-select:none;`;
    d.textContent = o.l;
    return d;
}

// Mini-balance CSS : le plateau le plus bas porte l'objet le plus lourd
function _balWeighing(leftIdx, rightIdx, heavierLeft) {
    const card = document.createElement('div');
    card.style.cssText = 'position:relative;width:104px;height:96px;flex-shrink:0;' +
        'background:#FFFFFF;border:2px solid #EEF2FF;border-radius:12px;';

    const pivot = document.createElement('div');
    pivot.style.cssText = 'position:absolute;left:50%;top:40px;transform:translateX(-50%);' +
        'width:5px;height:38px;background:#8B90A0;border-radius:3px;';
    const foot = document.createElement('div');
    foot.style.cssText = 'position:absolute;left:50%;bottom:8px;transform:translateX(-50%);' +
        'width:40px;height:5px;background:#8B90A0;border-radius:3px;';
    const beam = document.createElement('div');
    beam.style.cssText = 'position:absolute;left:50%;top:40px;width:80px;height:5px;' +
        'background:#23262F;border-radius:3px;' +
        `transform:translate(-50%,-50%) rotate(${heavierLeft ? -12 : 12}deg);`;

    const left = _balCircle(leftIdx, 30);
    left.style.position = 'absolute';
    left.style.left = '4px';
    left.style.top = heavierLeft ? '48px' : '12px';
    const right = _balCircle(rightIdx, 30);
    right.style.position = 'absolute';
    right.style.right = '4px';
    right.style.top = heavierLeft ? '12px' : '48px';

    card.append(pivot, foot, beam, left, right);
    return card;
}

function showExampleBalance(day, row, vals) {
    const ex = document.createElement('div');
    ex.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:8px;margin:6px auto;';

    const demo = document.createElement('div');
    demo.style.cssText = 'display:flex;align-items:center;gap:12px;';
    demo.appendChild(_balWeighing(0, 1, false)); // B plus lourd que A
    const txt = document.createElement('div');
    txt.style.cssText = 'font-size:.82rem;color:#8B90A0;font-weight:bold;max-width:150px;text-align:left;';
    txt.textContent = 'B est plus bas : B est plus lourd que A';
    demo.appendChild(txt);

    const note = document.createElement('div');
    note.style.cssText = 'font-size:.78rem;color:#8B90A0;font-weight:bold;';
    note.textContent = 'Puis touchez du plus léger au plus lourd';

    ex.append(demo, note);
    row.style.flexDirection = 'column';
    row.append(ex);
}

function startGameBalance() {
    board.style.display = 'flex';
    board.style.flexDirection = 'column';
    board.style.alignItems = 'center';

    let lives = 2;
    let found = 0;
    let finished = false;
    const { weights, pairs } = _balGenerate();
    // Ordre attendu : indices d'objets du plus léger au plus lourd
    const order = [0, 1, 2, 3, 4].sort((a, b) => weights[a] - weights[b]);

    const hud = document.createElement('div');
    hud.style.cssText = 'display:flex;gap:18px;align-items:center;justify-content:center;font-weight:bold;color:#8B90A0;font-size:.95rem;margin-bottom:8px;';
    board.appendChild(hud);
    function renderHud() {
        hud.innerHTML = `<span>Trouvés <b style="color:#4A6CFA">${found}/5</b></span>` +
            `<span style="color:#E0533D;letter-spacing:2px">${'♥'.repeat(lives)}${'♡'.repeat(2 - lives)}</span>`;
    }
    renderHud();

    const legend = document.createElement('div');
    legend.style.cssText = 'font-size:.8rem;color:#8B90A0;font-weight:bold;margin-bottom:10px;text-align:center;';
    legend.textContent = '⬇ Le plateau le plus bas porte l’objet le plus lourd';
    board.appendChild(legend);

    const weighZone = document.createElement('div');
    weighZone.style.cssText = 'display:flex;flex-wrap:wrap;gap:10px;justify-content:center;margin-bottom:18px;max-width:420px;';
    pairs.forEach(([i, j]) => {
        weighZone.appendChild(_balWeighing(i, j, weights[i] > weights[j]));
    });
    board.appendChild(weighZone);

    const lbl = document.createElement('div');
    lbl.style.cssText = 'font-weight:bold;font-size:.8rem;letter-spacing:.14em;text-transform:uppercase;color:#8B90A0;margin-bottom:10px;';
    lbl.textContent = 'Du plus léger au plus lourd :';
    board.appendChild(lbl);

    const answerRow = document.createElement('div');
    answerRow.style.cssText = 'display:flex;gap:12px;justify-content:center;flex-wrap:wrap;padding-bottom:28px;';
    board.appendChild(answerRow);

    function addBadge(circle, rank, color) {
        const badge = document.createElement('div');
        badge.className = 'badge';
        badge.textContent = rank;
        if (color) badge.style.background = color;
        circle.appendChild(badge);
    }

    const circles = {};
    _balShuffle([0, 1, 2, 3, 4]).forEach(idx => {
        const circle = _balCircle(idx, 54);
        circle.style.cursor = 'pointer';
        circles[idx] = circle;
        circle.addEventListener('click', () => {
            if (isPaused || finished || circle.dataset.done) return;

            if (idx === order[found]) {
                circle.dataset.done = '1';
                circle.style.boxShadow = '0 0 0 3px #FFFFFF, 0 0 0 5px #34B871';
                circle.style.pointerEvents = 'none';
                addBadge(circle, found + 1);
                found++;
                haptic(8);
                renderHud();
                if (found >= 5) {
                    finished = true;
                    endGame('Pesées décodées — ordre parfait !', true);
                }
            } else {
                lives--;
                haptic(60);
                circle.style.boxShadow = '0 0 0 3px #FFFFFF, 0 0 0 5px #E0533D';
                circle.classList.add('wobble-anim');
                setTimeout(() => {
                    circle.classList.remove('wobble-anim');
                    if (!circle.dataset.done) circle.style.boxShadow = '';
                }, 500);
                renderHud();
                if (lives <= 0) {
                    finished = true;
                    // Révèle le rang de chaque objet (rouge = non trouvé)
                    order.forEach((objIdx, rank) => {
                        if (!circles[objIdx].dataset.done) {
                            addBadge(circles[objIdx], rank + 1, '#E0533D');
                        }
                    });
                    endGame('Plus de vies — l’ordre réel est affiché.', false);
                }
            }
        });
        answerRow.appendChild(circle);
    });
}
