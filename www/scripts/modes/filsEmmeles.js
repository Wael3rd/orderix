// ─── Mode : Les Fils (jour 29) ───────────────────────────────────
// Inspiré des jeux de démêlage (Twisted Tangle & co). Des fils relient
// vos pastilles (à gauche, mélangées) aux prises 1..8 (à droite, dans
// l'ordre). Échangez deux pastilles pour dénouer tous les fils :
// zéro croisement = ordre parfait. Budget d'échanges limité mais
// toujours suffisant (minimum théorique + 3).

function _filPastille(num, size, selected) {
    const el = document.createElement('div');
    const s = size || 46;
    el.style.cssText = `width:${s}px;height:${s}px;border-radius:50%;flex-shrink:0;user-select:none;` +
        'background:#4A6CFA;color:#fff;display:flex;align-items:center;justify-content:center;' +
        `font-weight:900;font-size:${Math.round(s * 0.4)}px;box-shadow:0 2px 0 #3553D1;` +
        'touch-action:manipulation;transition:transform .12s;';
    if (selected) el.style.cssText += 'box-shadow:0 2px 0 #3553D1, 0 0 0 3px #FFFFFF, 0 0 0 6px #F5B227;transform:scale(1.08);';
    el.textContent = num;
    return el;
}

function showExampleFilsEmmeles(day, row, vals) {
    const ex = document.createElement('div');
    ex.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:8px;margin:6px auto;';

    const svgWrap = document.createElement('div');
    svgWrap.style.cssText = 'position:relative;width:220px;height:110px;';
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '220'); svg.setAttribute('height', '110');
    svg.style.cssText = 'position:absolute;inset:0;';
    [[25, 85, '#E0533D'], [65, 25, '#E0533D']].forEach(([y1, y2, color]) => {
        const l = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        l.setAttribute('x1', 40); l.setAttribute('y1', y1);
        l.setAttribute('x2', 180); l.setAttribute('y2', y2);
        l.setAttribute('stroke', color); l.setAttribute('stroke-width', 3.5);
        svg.appendChild(l);
    });
    svgWrap.appendChild(svg);
    [[2, 8], [1, 48]].forEach(([n, top]) => {
        const p = _filPastille(n, 34);
        p.style.cssText += `position:absolute;left:20px;top:${top}px;`;
        svgWrap.appendChild(p);
    });
    [[1, 8], [2, 48]].forEach(([n, top]) => {
        const p = document.createElement('div');
        p.style.cssText = `position:absolute;right:6px;top:${top}px;width:34px;height:34px;border-radius:8px;` +
            'background:#E8EAF1;color:#8B90A0;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:.85rem;';
        p.textContent = n;
        svgWrap.appendChild(p);
    });

    const note = document.createElement('div');
    note.style.cssText = 'font-weight:bold;color:#8B90A0;font-size:.8rem;text-align:center;max-width:250px;';
    note.textContent = 'Les fils se croisent : échangez les deux pastilles pour tout dénouer.';

    ex.append(svgWrap, note);
    row.style.flexDirection = 'column';
    row.append(ex);
}

function startGameFilsEmmeles() {
    board.style.display = 'flex';
    board.style.flexDirection = 'column';
    board.style.alignItems = 'center';
    board.style.gap = '12px';

    const N = 8, ROW_H = 56, W = 300, PASTILLE = 46;

    // Permutation non triviale : perm[i] = numéro de la pastille en position i
    let perm;
    do { perm = Array.from({ length: N }, (_, i) => i + 1).sort(() => Math.random() - 0.5); }
    while (perm.every((v, i) => v === i + 1));

    // Minimum d'échanges = N − nombre de cycles de la permutation
    function minSwaps(p) {
        const seen = new Array(N).fill(false);
        let cycles = 0;
        for (let i = 0; i < N; i++) {
            if (seen[i]) continue;
            cycles++;
            let j = i;
            while (!seen[j]) { seen[j] = true; j = p[j] - 1; }
        }
        return N - cycles;
    }
    let budget = minSwaps(perm) + 3;
    let selected = -1;
    let over = false;

    const hud = document.createElement('div');
    hud.style.cssText = 'display:flex;gap:18px;font-weight:bold;color:#8B90A0;font-size:.95rem;';
    board.appendChild(hud);

    const stage = document.createElement('div');
    stage.style.cssText = `position:relative;width:${W}px;height:${N * ROW_H}px;`;
    board.appendChild(stage);

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', W); svg.setAttribute('height', N * ROW_H);
    svg.style.cssText = 'position:absolute;inset:0;pointer-events:none;';
    stage.appendChild(svg);

    function crossings() {
        let c = 0;
        for (let i = 0; i < N; i++) for (let j = i + 1; j < N; j++) if (perm[i] > perm[j]) c++;
        return c;
    }

    function render() {
        const cross = crossings();
        hud.innerHTML = `<span>Croisements : <b style="color:${cross ? '#E0533D' : '#34B871'}">${cross}</b></span>` +
            `<span>Échanges restants : <b style="color:${budget <= 1 ? '#E0533D' : '#4A6CFA'}">${budget}</b></span>`;

        stage.querySelectorAll('.fil-node').forEach(n => n.remove());
        svg.innerHTML = '';

        for (let i = 0; i < N; i++) {
            const y = i * ROW_H + ROW_H / 2;
            const targetPos = perm[i] - 1; // la prise du numéro perm[i]
            const ty = targetPos * ROW_H + ROW_H / 2;
            const ok = perm[i] === i + 1;
            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            path.setAttribute('d', `M ${PASTILLE + 8} ${y} C ${W * 0.5} ${y}, ${W * 0.5} ${ty}, ${W - PASTILLE - 8} ${ty}`);
            path.setAttribute('fill', 'none');
            path.setAttribute('stroke', ok ? '#34B871' : '#E0533D');
            path.setAttribute('stroke-width', 3.5);
            path.setAttribute('stroke-linecap', 'round');
            if (!ok) path.setAttribute('stroke-dasharray', '1 0');
            svg.appendChild(path);
        }

        for (let i = 0; i < N; i++) {
            const idx = i;
            const p = _filPastille(perm[i], PASTILLE, selected === i);
            p.className = 'fil-node';
            p.style.cssText += `position:absolute;left:0;top:${i * ROW_H + (ROW_H - PASTILLE) / 2}px;`;
            p.addEventListener('pointerdown', (e) => {
                e.preventDefault();
                if (isPaused || over) return;
                tap(idx);
            });
            stage.appendChild(p);

            const prise = document.createElement('div');
            prise.className = 'fil-node';
            prise.style.cssText = `position:absolute;right:0;top:${i * ROW_H + (ROW_H - 40) / 2}px;width:40px;height:40px;` +
                'border-radius:10px;background:#E8EAF1;color:#8B90A0;display:flex;align-items:center;' +
                'justify-content:center;font-weight:900;font-size:.95rem;';
            prise.textContent = i + 1;
            stage.appendChild(prise);
        }
    }

    function tap(i) {
        if (selected === -1) { selected = i; haptic(8); render(); return; }
        if (selected === i) { selected = -1; render(); return; }
        // Échange
        const t = perm[selected]; perm[selected] = perm[i]; perm[i] = t;
        selected = -1;
        budget--;
        haptic(10);
        render();
        if (crossings() === 0) {
            over = true;
            endGame('Tous les fils sont dénoués — quel doigté !', true);
        } else if (budget <= 0) {
            over = true;
            endGame('Plus d’échanges disponibles et il reste des nœuds.', false);
        }
    }

    render();
}
