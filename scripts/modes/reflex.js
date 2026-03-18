function showExampleReflex(day, row, vals) {
    const desc = document.createElement('div'); desc.innerHTML = 'Cliquez vite sur les éléments<br>qui apparaissent !'; desc.style.textAlign = 'center'; desc.style.fontWeight = 'bold'; desc.style.color = '#333';
    const item = document.createElement('div'); item.className = `item type-${day.type}`; applyStyle(item, day.type, vals[0]); item.style.margin = '0 20px'; item.style.boxShadow = '0 0 0 4px #ffc107';
    row.append(desc, item);
}

function startGameReflex() {
    board.style.display = 'block'; 
    board.style.position = 'relative'; 
    board.style.height = '350px'; 
    board.style.width = '100%';
    
    let spawned = 0, clicked = 0;
    function spawn() {
        if (spawned >= activeItemCount || isPaused) return;
        const item = document.createElement('div');
        item.className = `item type-${currentDayConfig.type}`;
        item.style.position = 'absolute';
        
        const bw = Math.min(board.clientWidth || 300, 800) - 60;
        const bh = 350 - 60;
        item.style.left = Math.max(0, Math.random() * bw) + 'px';
        item.style.top = Math.max(0, Math.random() * bh) + 'px';
        
        const vals = generateValues(currentDayConfig.type, 10);
        applyStyle(item, currentDayConfig.type, vals[Math.floor(Math.random() * vals.length)]);
        
        // Mobile compatibility
        item.addEventListener('touchstart', (e) => { 
            e.preventDefault(); 
            if(isPaused) return; item.remove(); clicked++; 
            if(clicked >= activeItemCount) endGame('Cibles détruites !', true); 
        });
        item.addEventListener('mousedown', () => {
            if(isPaused) return; item.remove(); clicked++; 
            if(clicked >= activeItemCount) endGame('Cibles détruites !', true);
        });

        board.appendChild(item); spawned++;
        gameTimeout = setTimeout(spawn, 300 + Math.random() * 500);
    }
    spawn();
}
