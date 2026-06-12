// ─── Mode : Dactylographie (clavier tactile à l'écran) ───────────
// Réécrit lors de l'audit : l'ancienne version utilisait des <input>
// physiques, inutilisables avec le clavier virtuel Android
// (autocorrection, perte de focus, zoom).

const AZERTY_ROWS = ['AZERTYUIOP', 'QSDFGHJKLM', 'WXCVBN'];

// Construit un clavier AZERTY ; onKey(lettre, élémentTouche) est appelé à chaque appui
function buildKeypad(container, onKey) {
    const pad = document.createElement('div');
    pad.style.cssText = 'display:flex;flex-direction:column;gap:8px;align-items:center;width:100%;';
    AZERTY_ROWS.forEach(rowStr => {
        const r = document.createElement('div');
        r.className = 'keypad';
        r.style.margin = '0';
        rowStr.split('').forEach(ch => {
            const k = document.createElement('button');
            k.className = 'key';
            k.textContent = ch;
            k.addEventListener('pointerdown', (e) => {
                e.preventDefault();
                if (isPaused) return;
                onKey(ch, k);
            });
            r.appendChild(k);
        });
        pad.appendChild(r);
    });
    container.appendChild(pad);
    return pad;
}

function showExampleTyping(day, row, vals) {
    const exContainer = document.createElement('div');
    exContainer.style.cssText = 'display:flex; flex-direction:column; align-items:center; gap:10px; margin: 6px auto;';

    const track = document.createElement('div');
    track.className = 'letter-track';
    ['M', 'O', 'T', 'S'].forEach((ch, idx) => {
        const slot = document.createElement('div');
        slot.className = 'letter-slot' + (idx === 0 ? ' done' : (idx === 1 ? ' current' : ''));
        slot.textContent = ch;
        track.appendChild(slot);
    });

    const hint = document.createElement('div');
    hint.style.cssText = 'font-size:.85rem;color:#9AA0AE;';
    hint.textContent = 'Touchez les lettres sur le clavier à l\'écran';

    exContainer.append(track, hint);
    row.style.flexDirection = 'column';
    row.append(exContainer);
}

function startGameTyping() {
    board.style.display = 'flex';
    board.style.flexDirection = 'column';
    board.style.alignItems = 'center';
    board.style.gap = '16px';

    // Suite de lettres tirée d'une réserve mélangée (évite les répétitions proches)
    let chars = [];
    let letterPool = [];
    for (let i = 0; i < activeItemCount; i++) {
        if (letterPool.length === 0) {
            letterPool = ALPHA_TABLE.trim().split('').sort(() => Math.random() - 0.5);
        }
        chars.push(letterPool.pop());
    }

    const track = document.createElement('div');
    track.className = 'letter-track';
    const slots = chars.map((ch, idx) => {
        const slot = document.createElement('div');
        slot.className = 'letter-slot' + (idx === 0 ? ' current' : '');
        slot.textContent = ch;
        track.appendChild(slot);
        return slot;
    });
    board.appendChild(track);

    let cur = 0;
    buildKeypad(board, (ch, keyEl) => {
        if (cur >= chars.length) return;
        if (ch === chars[cur]) {
            slots[cur].classList.remove('current');
            slots[cur].classList.add('done');
            keyEl.classList.add('ok');
            setTimeout(() => keyEl.classList.remove('ok'), 200);
            haptic(8);
            cur++;
            matched = cur;
            if (cur >= chars.length) {
                endGame('Texte recopié sans faute !', true);
            } else {
                slots[cur].classList.add('current');
            }
        } else {
            keyEl.classList.add('ko');
            setTimeout(() => keyEl.classList.remove('ko'), 280);
            haptic(30);
        }
    });
}
