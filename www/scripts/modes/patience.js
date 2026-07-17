// ─── Mode : Patience ─────────────────────────────────────────────
// Tri patience : un flux de 18 valeurs uniques (2..99) arrive une par
// une. 4 colonnes strictement croissantes : on ne pose que sur une
// colonne vide ou dont la dernière carte est inférieure. Si aucune
// colonne n'est légale : « Défausser » coûte 1 jeton (3 au départ).
// La 4e défausse est fatale. Victoire : les 18 cartes traitées.

function _patienceCardEl(val, small) {
    const c = document.createElement('div');
    const w = small ? 44 : 58, h = small ? 32 : 74;
    c.style.cssText = `width:${w}px;height:${h}px;border-radius:${small ? 8 : 10}px;background:#4A6CFA;` +
        `color:#FFFFFF;font-weight:900;font-size:${small ? '.95rem' : '1.35rem'};display:flex;` +
        `align-items:center;justify-content:center;flex-shrink:0;user-select:none;`;
    c.textContent = val;
    return c;
}

function showExamplePatience(day, row, vals) {
    const ex = document.createElement('div');
    ex.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:10px;margin:6px auto;';

    const top = document.createElement('div');
    top.style.cssText = 'display:flex;align-items:center;gap:8px;font-weight:bold;color:#8B90A0;font-size:.85rem;';
    const cur = _patienceCardEl(42, true);
    cur.style.boxShadow = '0 0 0 3px #FFFFFF, 0 0 0 5px #F5B227';
    top.append(cur, document.createTextNode('→ sur une colonne croissante'));

    const cols = document.createElement('div');
    cols.style.cssText = 'display:flex;gap:8px;align-items:flex-start;';
    [[5, 31], [12], []].forEach(colVals => {
        const col = document.createElement('div');
        col.style.cssText = 'display:flex;flex-direction:column;gap:3px;padding:5px;min-width:50px;min-height:56px;background:#EEF2FF;border:2px dashed #4A6CFA;border-radius:10px;align-items:center;';
        colVals.forEach(v => col.appendChild(_patienceCardEl(v, true)));
        cols.appendChild(col);
    });

    ex.append(top, cols);
    row.style.flexDirection = 'column';
    row.append(ex);
}

function startGamePatience() {
    board.style.display = 'flex';
    board.style.flexDirection = 'column';
    board.style.alignItems = 'center';

    // Flux : 18 valeurs uniques de 2..99, mélangées
    const all = [];
    for (let i = 2; i <= 99; i++) all.push(i);
    all.sort(() => Math.random() - 0.5);
    const stream = all.slice(0, 18);
    let idx = 0;
    let tokens = 3;
    const cols = [[], [], [], []];

    const hud = document.createElement('div');
    hud.style.cssText = 'display:flex;gap:18px;align-items:center;justify-content:center;font-weight:bold;color:#8B90A0;font-size:.95rem;margin-bottom:10px;';
    board.appendChild(hud);

    const curZone = document.createElement('div');
    curZone.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:4px;margin-bottom:14px;';
    board.appendChild(curZone);

    const colZone = document.createElement('div');
    colZone.style.cssText = 'display:flex;gap:8px;justify-content:center;align-items:flex-start;margin-bottom:14px;';
    board.appendChild(colZone);

    const discardBtn = document.createElement('button');
    discardBtn.style.cssText = 'display:none;padding:11px 24px;border-radius:999px;background:#E0533D;color:#FFFFFF;font-weight:900;font-size:.95rem;border:none;touch-action:manipulation;';
    discardBtn.textContent = 'Défausser';
    board.appendChild(discardBtn);

    function renderHud() {
        hud.innerHTML = `<span>Carte <b style="color:#4A6CFA">${Math.min(idx + 1, 18)}/18</b></span>` +
            `<span>Jetons <b style="color:#F5B227;letter-spacing:2px">${'●'.repeat(tokens)}${'○'.repeat(3 - tokens)}</b></span>`;
    }

    function colLegal(ci) {
        const col = cols[ci];
        return col.length === 0 || col[col.length - 1] < stream[idx];
    }

    function renderCols() {
        colZone.innerHTML = '';
        cols.forEach((col, ci) => {
            const el = document.createElement('div');
            el.style.cssText = 'display:flex;flex-direction:column;gap:3px;padding:6px;min-width:56px;min-height:120px;' +
                'background:#EEF2FF;border:2px dashed #4A6CFA;border-radius:12px;align-items:center;' +
                'touch-action:manipulation;transition:box-shadow .12s;';
            col.forEach((v, vi) => {
                const card = _patienceCardEl(v, true);
                if (vi === col.length - 1) card.style.boxShadow = '0 0 0 2px #FFFFFF, 0 0 0 4px #3553D1';
                el.appendChild(card);
            });
            el.addEventListener('pointerdown', (e) => {
                e.preventDefault();
                if (isPaused || idx >= 18) return;
                if (colLegal(ci)) {
                    col.push(stream[idx]);
                    idx++;
                    haptic(10);
                    nextCard();
                } else {
                    haptic(50);
                    el.style.animation = 'wobble .3s';
                    el.style.borderColor = '#E0533D';
                    setTimeout(() => { el.style.animation = ''; el.style.borderColor = '#4A6CFA'; }, 320);
                }
            });
            colZone.appendChild(el);
        });
    }

    function renderCurrent() {
        curZone.innerHTML = '';
        const lbl = document.createElement('div');
        lbl.style.cssText = 'font-weight:bold;font-size:.8rem;letter-spacing:.14em;text-transform:uppercase;color:#8B90A0;';
        lbl.textContent = 'Carte à placer :';
        const card = _patienceCardEl(stream[idx], false);
        card.style.boxShadow = '0 0 0 3px #FFFFFF, 0 0 0 6px #F5B227';
        curZone.append(lbl, card);
    }

    function nextCard() {
        if (idx >= 18) {
            endGame('Les 18 cartes sont rangées — belle patience !', true);
            return;
        }
        renderHud();
        renderCurrent();
        renderCols();
        const stuck = ![0, 1, 2, 3].some(colLegal);
        discardBtn.style.display = stuck ? 'block' : 'none';
        if (stuck && tokens <= 0) {
            // 4e défausse forcée : défaite
            endGame(`Aucune colonne possible et plus de jetons — il restait ${18 - idx} cartes.`, false);
        }
    }

    discardBtn.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        if (isPaused || idx >= 18) return;
        if (tokens <= 0) {
            endGame(`Aucune colonne possible et plus de jetons — il restait ${18 - idx} cartes.`, false);
            return;
        }
        tokens--;
        idx++;
        haptic(30);
        nextCard();
    });

    nextCard();
}
