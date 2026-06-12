// ─── Mode : Cibles Mobiles ───────────────────────────────────────
function showExampleReflex(day, row, vals) {
    const item = document.createElement('div');
    item.className = `item type-${day.type}`;
    applyStyle(item, day.type, vals[0]);
    item.style.margin = '0 20px';
    item.style.boxShadow = '0 0 0 3px #FFFFFF, 0 0 0 6px #F5B227';
    row.append(item);
}

function startGameReflex() {
    board.style.display = 'block';
    board.style.position = 'relative';
    board.style.height = '380px';
    board.style.width = '100%';

    let spawned = 0, clicked = 0;
    function spawn() {
        if (spawned >= activeItemCount || isPaused) return;
        const item = document.createElement('div');
        item.className = `item type-${currentDayConfig.type}`;
        item.style.position = 'absolute';

        const bw = Math.min(board.clientWidth || 300, 800) - 60;
        const bh = 380 - 60;
        item.style.left = Math.max(0, Math.random() * bw) + 'px';
        item.style.top = Math.max(0, Math.random() * bh) + 'px';

        const vals = generateValues(currentDayConfig.type, 10);
        applyStyle(item, currentDayConfig.type, vals[Math.floor(Math.random() * vals.length)]);

        const hit = () => {
            if (isPaused) return;
            item.remove(); clicked++;
            haptic(8);
            if (clicked >= activeItemCount) endGame('Toutes les cibles touchées !', true);
        };
        item.addEventListener('touchstart', (e) => { e.preventDefault(); hit(); });
        item.addEventListener('mousedown', hit);

        board.appendChild(item); spawned++;
        gameTimeout = setTimeout(spawn, 300 + Math.random() * 500);
    }
    spawn();
}
