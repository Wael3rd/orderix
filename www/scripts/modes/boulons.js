// ─── Mode : Les Boulons ──────────────────────────────────────────
// 4 vis verticales, 9 écrous hexagonaux de 3 largeurs (3 petits,
// 3 moyens, 3 grands). On ne pose un écrou que sur une vis vide ou
// sur un écrou STRICTEMENT plus large. Objectif : 3 vis portant
// chacune une pyramide parfaite grand-moyen-petit. La génération
// est vérifiée solvable en ≤ 30 coups par un BFS borné.

function showExampleBoulons(day, row, vals) {
    const ex = document.createElement('div');
    ex.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:8px;margin:6px auto;';

    function miniVis(tailles) {
        // tailles : du fond au sommet, 1=petit 2=moyen 3=grand
        const LARG = [0, 14, 20, 26];
        const v = document.createElement('div');
        v.style.cssText = 'position:relative;width:32px;height:74px;flex-shrink:0;';
        const tige = document.createElement('div');
        tige.style.cssText = 'position:absolute;left:50%;transform:translateX(-50%);bottom:2px;width:5px;height:66px;background:#8B90A0;border-radius:3px;';
        v.appendChild(tige);
        tailles.forEach((t, j) => {
            const e = document.createElement('div');
            e.style.cssText = 'position:absolute;left:50%;transform:translateX(-50%);bottom:' + (4 + j * 13) + 'px;width:' + LARG[t] + 'px;height:11px;background:#F5B227;border:2px solid #23262F;border-radius:3px;box-sizing:border-box;';
            v.appendChild(e);
        });
        return v;
    }

    const ligne = document.createElement('div');
    ligne.style.cssText = 'display:flex;align-items:flex-end;gap:12px;justify-content:center;';
    const fleche = document.createElement('div');
    fleche.style.cssText = 'font-weight:900;color:#8B90A0;font-size:1.2rem;align-self:center;';
    fleche.textContent = '→';
    ligne.append(miniVis([1, 3, 2]), fleche, miniVis([3, 2, 1]));

    const note = document.createElement('div');
    note.style.cssText = 'font-size:.78rem;color:#8B90A0;font-weight:bold;';
    note.textContent = 'Jamais un grand écrou sur un plus petit';

    ex.append(ligne, note);
    row.style.flexDirection = 'column';
    row.append(ex);
}

function startGameBoulons() {
    board.style.display = 'flex';
    board.style.flexDirection = 'column';
    board.style.alignItems = 'center';

    // 1=petit (36px), 2=moyen (50px), 3=grand (64px)
    const LARG = [0, 36, 50, 64];

    function resolu(v) {
        return v.filter(t => t.join('') === '321').length === 3;
    }

    function encode(v) { return v.map(t => t.join('')).join('|'); }

    // BFS borné : solution en ≤ 30 coups, ≤ 200 000 états visités
    function solvable(depart) {
        if (resolu(depart)) return false;
        let front = [encode(depart)];
        const vus = new Set(front);
        for (let prof = 0; prof < 30; prof++) {
            const prochain = [];
            for (const code of front) {
                const vis = code.split('|').map(s => s ? s.split('').map(Number) : []);
                for (let a = 0; a < 4; a++) {
                    if (!vis[a].length) continue;
                    const n = vis[a][vis[a].length - 1];
                    for (let b = 0; b < 4; b++) {
                        if (b === a) continue;
                        const tb = vis[b];
                        if (tb.length && tb[tb.length - 1] <= n) continue;
                        const copie = vis.map(t => t.slice());
                        copie[b].push(copie[a].pop());
                        if (resolu(copie)) return true;
                        const c = encode(copie);
                        if (!vus.has(c)) {
                            vus.add(c);
                            if (vus.size > 200000) return false;
                            prochain.push(c);
                        }
                    }
                }
            }
            if (!prochain.length) return false;
            front = prochain;
        }
        return false;
    }

    // Mélange aléatoire (3 écrous sur chacune des 3 premières vis,
    // la 4e vide), revérifié jusqu'à obtenir un état solvable
    function generer() {
        for (let essai = 0; essai < 40; essai++) {
            const pool = [1, 1, 1, 2, 2, 2, 3, 3, 3].sort(() => Math.random() - 0.5);
            const cand = [pool.slice(0, 3), pool.slice(3, 6), pool.slice(6, 9), []];
            if (solvable(cand)) return cand;
        }
        // Secours : coups inverses depuis l'état résolu (toujours solvable)
        const vis = [[3, 2, 1], [3, 2, 1], [3, 2, 1], []];
        for (let k = 0; k < 20; k++) {
            const coups = [];
            for (let a = 0; a < 4; a++) {
                const tA = vis[a];
                if (!tA.length) continue;
                const e = tA[tA.length - 1];
                const dessous = tA[tA.length - 2];
                if (dessous !== undefined && dessous <= e) continue; // pas légalement posé
                for (let b = 0; b < 4; b++) { if (b !== a) coups.push([a, b]); }
            }
            if (!coups.length) break;
            const c = coups[Math.floor(Math.random() * coups.length)];
            vis[c[1]].push(vis[c[0]].pop());
        }
        return resolu(vis) ? [[1, 2, 3], [3, 2, 1], [2, 1, 3], []] : vis;
    }

    const vis = generer();
    let sel = null;
    let coups = 0;
    let fini = false;

    const hud = document.createElement('div');
    hud.style.cssText = 'font-weight:bold;color:#8B90A0;font-size:.95rem;margin-bottom:4px;';
    board.appendChild(hud);

    const zone = document.createElement('div');
    zone.style.cssText = 'display:flex;gap:10px;justify-content:center;align-items:flex-end;';
    board.appendChild(zone);

    const HEX = 'polygon(25% 0,75% 0,100% 50%,75% 100%,25% 100%,0 50%)';

    function render() {
        hud.innerHTML = 'Coups : <b style="color:#4A6CFA">' + coups + '</b>';
        zone.innerHTML = '';
        vis.forEach((pile, i) => {
            const col = document.createElement('div');
            col.style.cssText = 'position:relative;width:76px;height:212px;flex-shrink:0;touch-action:manipulation;';

            const socle = document.createElement('div');
            socle.style.cssText = 'position:absolute;left:50%;transform:translateX(-50%);bottom:0;width:66px;height:8px;background:#8B90A0;border-radius:4px;';
            col.appendChild(socle);

            const tige = document.createElement('div');
            tige.style.cssText = 'position:absolute;left:50%;transform:translateX(-50%);bottom:6px;width:10px;height:182px;border-radius:5px 5px 2px 2px;background:repeating-linear-gradient(0deg,#8B90A0 0 4px,#A9AEBD 4px 7px);';
            col.appendChild(tige);

            pile.forEach((taille, j) => {
                const ext = document.createElement('div');
                const lift = (sel === i && j === pile.length - 1);
                ext.style.cssText = 'position:absolute;left:50%;bottom:' + (12 + j * 28) + 'px;width:' + LARG[taille] + 'px;height:26px;background:#23262F;clip-path:' + HEX + ';display:flex;align-items:center;justify-content:center;pointer-events:none;transition:transform .12s;transform:translateX(-50%)' + (lift ? ' translateY(-16px)' : '') + ';';
                if (lift) ext.style.filter = 'drop-shadow(0 0 5px #4A6CFA) drop-shadow(0 0 2px #4A6CFA)';
                const int1 = document.createElement('div');
                int1.style.cssText = 'width:' + (LARG[taille] - 6) + 'px;height:20px;background:#F5B227;clip-path:' + HEX + ';';
                ext.appendChild(int1);
                col.appendChild(ext);
            });

            col.addEventListener('pointerdown', e => { e.preventDefault(); tap(i, col); });
            zone.appendChild(col);
        });
    }

    function tap(i, el) {
        if (isPaused || fini) return;
        if (sel === null) {
            if (!vis[i].length) return;
            sel = i;
            haptic(6);
            render();
            return;
        }
        if (sel === i) { sel = null; render(); return; }  // re-taper la source annule

        const src = vis[sel], dst = vis[i];
        const ecrou = src[src.length - 1];
        const sommet = dst[dst.length - 1];
        const legal = (sommet === undefined) || (sommet > ecrou);

        if (!legal) {
            haptic(40);
            el.style.animation = 'wobble .3s';
            setTimeout(() => { el.style.animation = ''; }, 320);
            return;
        }

        dst.push(src.pop());
        coups++;
        sel = null;
        haptic(10);
        render();

        if (resolu(vis)) {
            fini = true;
            endGame('Trois pyramides parfaites — bien vissé !', true);
        }
    }

    render();
}
