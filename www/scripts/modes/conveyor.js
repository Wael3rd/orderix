// ─── Mode : Tapis Roulant ────────────────────────────────────────
// Correction d'audit : les types à taille variable (largeur, échelle…)
// désalignaient le tapis (pas fixe de 80 px). Chaque objet est désormais
// enveloppé dans une cellule de taille verrouillée.

function _conveyorCell(item) {
    const cell = document.createElement('div');
    cell.style.cssText = 'width:60px;height:80px;margin:0 10px;display:flex;align-items:center;justify-content:center;flex-shrink:0;';
    item.style.margin = '0';
    item.style.flexShrink = '0';
    cell.appendChild(item);
    return cell;
}

function showExampleConveyor(day, row, vals) {
    // Aperçu statique : un mini-tapis avec le cadre doré au centre
    const tType = day.type || 'numbers';
    const pool = generateValues(tType, 5);

    const ex = document.createElement('div');
    ex.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:14px;margin:6px auto;width:100%;';

    const belt = document.createElement('div');
    belt.style.cssText = 'position:relative;display:flex;align-items:center;justify-content:center;height:90px;';
    [pool[1], pool[0], pool[2]].forEach((val, idx) => {
        const item = document.createElement('div');
        item.className = `item type-${tType}`;
        applyStyle(item, tType, val);
        if (idx !== 1) item.style.opacity = '0.4';
        belt.appendChild(_conveyorCell(item));
    });
    const frame = document.createElement('div');
    frame.style.cssText = 'position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:68px;height:68px;border:4px solid #F5B227;border-radius:12px;pointer-events:none;';
    belt.appendChild(frame);

    const hint = document.createElement('div');
    hint.style.cssText = 'font-size:.85rem;color:#9AA0AE;';
    hint.textContent = 'Touchez le bouton qui correspond à l\'objet encadré';

    ex.append(belt, hint);
    row.style.flexDirection = 'column';
    row.append(ex);
}

function startGameConveyor() {
    board.style.display = 'flex'; board.style.flexDirection = 'column'; board.style.alignItems = 'center'; board.style.overflow = 'hidden'; board.style.width = '100%';

    const tType = currentDayConfig.type || 'numbers';

    const uniqueValuesCount = 4; // nombre de valeurs différentes sur le tapis
    const beltLength = parseInt(activeItemCount) || 50;

    // Grand pool → exactement `uniqueValuesCount` valeurs uniques
    let hugePool = generateValues(tType, 50);
    let uniqueChoices = [...new Set(hugePool)].sort(() => Math.random() - 0.5).slice(0, uniqueValuesCount);

    // Tapis construit en piochant parmi ces choix limités
    let vals = [];
    for (let i = 0; i < beltLength; i++) {
        vals.push(uniqueChoices[Math.floor(Math.random() * uniqueChoices.length)]);
    }

    const progressDiv = document.createElement('div');
    progressDiv.style.cssText = 'font-size: 1.1rem; font-weight: bold; margin-bottom: 15px; color: #23262F;';
    progressDiv.innerHTML = `Objet <span id="conveyor-count" style="color:#4A6CFA;">1</span> / ${vals.length}`;
    board.appendChild(progressDiv);

    const beltWrapper = document.createElement('div');
    beltWrapper.style.cssText = 'position:relative; width: 340px; max-width: 100%; height: 100px; display:block; overflow:hidden; margin-bottom:30px; border-radius: 14px; background: rgba(53,42,51,0.05); -webkit-mask-image: linear-gradient(to right, transparent 0%, black 15%, black 85%, transparent 100%); mask-image: linear-gradient(to right, transparent 0%, black 15%, black 85%, transparent 100%);';

    const beltContainer = document.createElement('div');
    beltContainer.style.cssText = 'display:flex; align-items:center; height: 100%; transition: transform 0.15s cubic-bezier(0.4, 0, 0.2, 1); width:max-content; padding-left: calc(50% - 40px); padding-right: calc(50% - 40px);';

    const centerMark = document.createElement('div');
    centerMark.style.cssText = 'position:absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); width:64px; height:64px; border:4px solid #F5B227; border-radius:12px; z-index:5; pointer-events:none; box-shadow: 0 0 10px rgba(53,42,51,0.25);';

    // Scrolling virtuel : seules VISIBLE_COUNT cellules vivent dans le DOM,
    // recyclées à chaque avance (au lieu de 50-100+ éléments).
    const VISIBLE_COUNT = 7;
    let cIdx = 0;

    function renderVisibleCells() {
        beltContainer.innerHTML = '';
        const frag = document.createDocumentFragment();
        const start = Math.max(0, cIdx - 3);
        const end = Math.min(vals.length, start + VISIBLE_COUNT);
        for (let i = start; i < end; i++) {
            const item = document.createElement('div');
            item.className = `item type-${tType}`;
            item.style.transition = 'opacity 0.2s, transform 0.2s';
            applyStyle(item, tType, vals[i]);
            if (i < cIdx) { item.style.opacity = '0'; item.style.transform = 'scale(0.5)'; }
            frag.appendChild(_conveyorCell(item));
        }
        beltContainer.appendChild(frag);
        beltContainer.style.transform = `translateX(-${(cIdx - start) * 80}px)`;
    }
    renderVisibleCells();

    beltWrapper.appendChild(beltContainer);
    beltWrapper.appendChild(centerMark);
    board.appendChild(beltWrapper);

    const btnContainer = document.createElement('div');
    btnContainer.style.cssText = 'display:flex; gap:15px; flex-wrap:wrap; justify-content:center; padding: 10px; width: 100%; max-width: 500px;';

    uniqueChoices.forEach(uVal => {
        const btn = document.createElement('div');
        btn.className = `item type-${tType}`; btn.style.cursor = 'pointer';
        applyStyle(btn, tType, uVal);

        btn.addEventListener('pointerdown', (e) => {
            e.preventDefault();
            if (isPaused) return;
            if (vals[cIdx] === uVal) {
                cIdx++;
                haptic(8);

                const countSpan = document.getElementById('conveyor-count');
                if (countSpan && cIdx < vals.length) {
                    countSpan.textContent = cIdx + 1;
                }

                renderVisibleCells();
                if (cIdx >= vals.length) {
                    if (countSpan) countSpan.textContent = vals.length;
                    endGame('Tapis vidé !', true);
                }
            } else {
                endGame('Ce n\'était pas le bon objet.', false);
            }
        });
        btnContainer.appendChild(btn);
    });

    board.appendChild(btnContainer);
}
