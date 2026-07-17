// ─── Mode : L'Ordre Caché (Mastermind de permutation) ────────────
// Une permutation secrète de 5 gemmes. Le joueur réarrange sa rangée
// d'essai (taper 2 gemmes pour les échanger) puis « Proposer » :
// ✓ vert = bonne gemme à cette position, ✗ gris sinon. L'historique
// des essais reste affiché. 6 essais max.

const _OC_GEMS = [
    { c: '#4A6CFA', l: 'B',  n: 'bleue' },
    { c: '#34B871', l: 'V',  n: 'verte' },
    { c: '#F5B227', l: 'O',  n: 'dorée' },
    { c: '#E0533D', l: 'R',  n: 'rouge' },
    { c: '#8B5CF6', l: 'Vi', n: 'violette' }
];

function _ocShuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

function _ocGem(idx, size) {
    const g = _OC_GEMS[idx];
    const d = document.createElement('div');
    d.style.cssText = `width:${size}px;height:${size}px;border-radius:50%;flex-shrink:0;` +
        `background:${g.c};display:flex;align-items:center;justify-content:center;` +
        `font-weight:900;font-size:${Math.round(size * 0.36)}px;color:#FFFFFF;user-select:none;`;
    d.textContent = g.l;
    return d;
}

function showExampleOrdreCache(day, row, vals) {
    const ex = document.createElement('div');
    ex.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:8px;margin:6px auto;';

    const rowEx = document.createElement('div');
    rowEx.style.cssText = 'display:flex;gap:10px;';
    [0, 2, 1, 3].forEach((idx, pos) => {
        const col = document.createElement('div');
        col.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:3px;';
        col.appendChild(_ocGem(idx, 34));
        const mark = document.createElement('div');
        const good = pos === 0 || pos === 3;
        mark.style.cssText = `font-weight:900;font-size:.85rem;color:${good ? '#34B871' : '#8B90A0'};`;
        mark.textContent = good ? '✓' : '✗';
        col.appendChild(mark);
        rowEx.appendChild(col);
    });

    const note = document.createElement('div');
    note.style.cssText = 'font-size:.78rem;color:#8B90A0;font-weight:bold;text-align:center;';
    note.textContent = 'Touchez 2 gemmes pour les échanger, puis proposez';

    ex.append(rowEx, note);
    row.style.flexDirection = 'column';
    row.append(ex);
}

function startGameOrdreCache() {
    board.style.display = 'flex';
    board.style.flexDirection = 'column';
    board.style.alignItems = 'center';

    const MAX = 6;
    let essais = 0;
    let finished = false;
    let selected = null;
    let marks = null; // résultat du dernier essai (tableau de booléens) ou null

    const secret = _ocShuffle([0, 1, 2, 3, 4]);
    let trial = _ocShuffle([0, 1, 2, 3, 4]);
    while (trial.every((v, i) => v === secret[i])) trial = _ocShuffle([0, 1, 2, 3, 4]);

    const counter = document.createElement('div');
    counter.style.cssText = 'font-weight:bold;color:#8B90A0;font-size:.95rem;margin-bottom:10px;';
    board.appendChild(counter);
    function renderCounter() {
        counter.innerHTML = `Essai <b style="color:#4A6CFA">${Math.min(essais + 1, MAX)}/${MAX}</b>`;
    }
    renderCounter();

    const history = document.createElement('div');
    history.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:6px;margin-bottom:14px;min-height:10px;';
    board.appendChild(history);

    const trialRow = document.createElement('div');
    trialRow.style.cssText = 'display:flex;gap:10px;justify-content:center;margin-bottom:16px;';
    board.appendChild(trialRow);

    const proposeBtn = document.createElement('button');
    proposeBtn.className = 'btn btn-primary';
    proposeBtn.textContent = 'Proposer';
    proposeBtn.style.minWidth = '200px';
    board.appendChild(proposeBtn);

    function renderTrial() {
        trialRow.innerHTML = '';
        trial.forEach((gemIdx, pos) => {
            const col = document.createElement('div');
            col.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:4px;';
            const gem = _ocGem(gemIdx, 52);
            gem.style.cursor = 'pointer';
            if (selected === pos) gem.style.boxShadow = '0 0 0 3px #FFFFFF, 0 0 0 6px #3553D1';
            gem.addEventListener('click', () => {
                if (isPaused || finished) return;
                if (selected === null) {
                    selected = pos;
                    haptic(6);
                } else if (selected === pos) {
                    selected = null;
                } else {
                    [trial[selected], trial[pos]] = [trial[pos], trial[selected]];
                    selected = null;
                    marks = null; // les ✓/✗ affichés ne valent que pour l'essai proposé
                    haptic(10);
                }
                renderTrial();
            });
            col.appendChild(gem);
            const mark = document.createElement('div');
            mark.style.cssText = 'font-weight:900;font-size:1.05rem;min-height:1.2em;' +
                `color:${marks && marks[pos] ? '#34B871' : '#8B90A0'};`;
            mark.textContent = marks === null ? '' : (marks[pos] ? '✓' : '✗');
            col.appendChild(mark);
            trialRow.appendChild(col);
        });
    }
    renderTrial();

    function pushHistory(attempt, res, num) {
        const line = document.createElement('div');
        line.style.cssText = 'display:flex;align-items:center;gap:6px;';
        const lbl = document.createElement('span');
        lbl.style.cssText = 'font-size:.72rem;font-weight:bold;color:#8B90A0;width:52px;text-align:right;';
        lbl.textContent = `Essai ${num}`;
        line.appendChild(lbl);
        attempt.forEach((gemIdx, pos) => {
            const col = document.createElement('div');
            col.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:1px;';
            col.appendChild(_ocGem(gemIdx, 20));
            const m = document.createElement('div');
            m.style.cssText = `font-weight:900;font-size:.62rem;color:${res[pos] ? '#34B871' : '#8B90A0'};`;
            m.textContent = res[pos] ? '✓' : '✗';
            col.appendChild(m);
            line.appendChild(col);
        });
        history.appendChild(line);
    }

    function revealSecret() {
        const line = document.createElement('div');
        line.style.cssText = 'display:flex;align-items:center;gap:8px;margin-top:12px;';
        const lbl = document.createElement('span');
        lbl.style.cssText = 'font-size:.8rem;font-weight:bold;color:#8B90A0;';
        lbl.textContent = 'Ordre secret :';
        line.appendChild(lbl);
        secret.forEach(gemIdx => line.appendChild(_ocGem(gemIdx, 34)));
        board.appendChild(line);
    }

    proposeBtn.addEventListener('click', () => {
        if (isPaused || finished) return;
        essais++;
        marks = trial.map((v, i) => v === secret[i]);
        selected = null;
        pushHistory([...trial], marks, essais);
        renderTrial();
        renderCounter();

        if (marks.every(Boolean)) {
            finished = true;
            haptic([12, 40, 12]);
            endGame(`Ordre caché percé en ${essais} essai${essais > 1 ? 's' : ''} !`, true);
        } else if (essais >= MAX) {
            finished = true;
            haptic(60);
            revealSecret();
            endGame('Essais épuisés — voici l’ordre secret.', false);
        } else {
            haptic(20);
        }
    });
}
