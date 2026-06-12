// ─── Mode : Lettres Chrono (clavier tactile + compte à rebours) ──
// Réécrit lors de l'audit : les <input> physiques étaient incompatibles
// avec un chrono de 5 s sur mobile (le temps d'ouvrir le clavier virtuel…).

function showExampleSpeedLetters(day, row, vals) {
    const exContainer = document.createElement('div');
    exContainer.style.cssText = 'display:flex; flex-direction:column; align-items:center; gap:10px; margin: 6px auto; width:100%;';

    const barWrap = document.createElement('div');
    barWrap.className = 'timebar-wrap';
    barWrap.style.marginBottom = '0';
    const bar = document.createElement('div');
    bar.className = 'timebar';
    bar.style.width = '60%';
    barWrap.appendChild(bar);

    const track = document.createElement('div');
    track.className = 'letter-track';
    ['V', 'I', 'T', 'E'].forEach((ch, idx) => {
        const slot = document.createElement('div');
        slot.className = 'letter-slot' + (idx === 0 ? ' done' : (idx === 1 ? ' current' : ''));
        slot.textContent = ch;
        track.appendChild(slot);
    });

    exContainer.append(barWrap, track);
    row.style.flexDirection = 'column';
    row.append(exContainer);
}

function startGameSpeedLetters() {
    board.style.display = 'flex';
    board.style.flexDirection = 'column';
    board.style.alignItems = 'center';
    currentRound = 1;
    totalRounds = Math.max(3, Math.min(parseInt(activeItemCount) || 10, 20));

    window.startLettersRound = function () {
        board.innerHTML = '';

        const roundDisplay = document.createElement('div');
        roundDisplay.style.cssText = 'font-size: 1.1rem; font-weight: bold; color: #8B90A0; margin-bottom: 10px;';
        roundDisplay.textContent = `Manche ${currentRound} / ${totalRounds}`;
        board.appendChild(roundDisplay);

        const barContainer = document.createElement('div');
        barContainer.className = 'timebar-wrap';
        const bar = document.createElement('div');
        bar.className = 'timebar';
        barContainer.appendChild(bar);
        board.appendChild(barContainer);

        // 5 lettres cibles distinctes
        const alphabet = ALPHA_TABLE.trim().split('');
        const shuffled = [...alphabet].sort(() => Math.random() - 0.5);
        const chars = shuffled.slice(0, 5);

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

        // Clavier : les 5 lettres cibles + 5 leurres, mélangés
        const decoys = shuffled.slice(5, 10);
        const keys = [...chars, ...decoys].sort(() => Math.random() - 0.5);
        const pad = document.createElement('div');
        pad.className = 'keypad';
        pad.style.marginTop = '18px';

        let cur = 0;
        keys.forEach(ch => {
            const k = document.createElement('button');
            k.className = 'key';
            k.textContent = ch;
            k.addEventListener('pointerdown', (e) => {
                e.preventDefault();
                if (isPaused || cur >= 5) return;
                if (ch === chars[cur]) {
                    slots[cur].classList.remove('current');
                    slots[cur].classList.add('done');
                    k.classList.add('ok');
                    haptic(8);
                    cur++;
                    if (cur >= 5) {
                        clearInterval(window.speedTimer);
                        currentRound++;
                        if (currentRound > totalRounds) endGame('Toutes les manches tenues !', true);
                        else setTimeout(() => { if (!isPaused) window.startLettersRound(); }, 300);
                    } else {
                        slots[cur].classList.add('current');
                    }
                } else {
                    k.classList.add('ko');
                    setTimeout(() => k.classList.remove('ko'), 280);
                    haptic(30);
                }
            });
            pad.appendChild(k);
        });
        board.appendChild(pad);

        // Compte à rebours de 5 secondes
        let timeLeft = 5000; const step = 50;
        clearInterval(window.speedTimer);
        window.speedTimer = setInterval(() => {
            if (isPaused) return;
            timeLeft -= step;
            bar.style.width = `${(timeLeft / 5000) * 100}%`;
            if (timeLeft <= 0) { clearInterval(window.speedTimer); endGame('Le temps s\'est écoulé !', false); }
        }, step);
    };
    window.startLettersRound();
}
