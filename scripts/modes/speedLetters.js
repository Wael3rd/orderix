function showExampleSpeedLetters(day, row, vals) {
    const desc = document.createElement('div'); desc.innerHTML = 'Tapez les lettres avant<br>la fin du temps !'; desc.style.textAlign = 'center'; desc.style.fontWeight = 'bold'; desc.style.color = '#333';
    const ex = document.createElement('div'); ex.style.cssText = 'width:80px; height:10px; background:#dc3545; border-radius:5px; margin: 15px auto;';
    row.style.flexDirection = 'column'; row.append(desc, ex);
}

function startGameSpeedLetters() {
    board.style.display = 'flex'; board.style.flexDirection = 'column'; board.style.alignItems = 'center';
    currentRound = 1; totalRounds = activeItemCount; 
    
    window.startLettersRound = function() {
        board.innerHTML = '';
        
        const roundDisplay = document.createElement('div');
        roundDisplay.style.cssText = 'font-size: 1.3rem; font-weight: bold; color: #555; margin-bottom: 10px;';
        roundDisplay.textContent = `${currentRound} / ${totalRounds}`;
        board.appendChild(roundDisplay);

        const barContainer = document.createElement('div');
        barContainer.style.cssText = 'width: 80%; height: 20px; background: #ddd; border-radius: 10px; margin-bottom: 20px; overflow: hidden;';
        const bar = document.createElement('div');
        bar.style.cssText = 'width: 100%; height: 100%; background: #dc3545; transition: width 0.05s linear;';
        barContainer.appendChild(bar); board.appendChild(barContainer);

        const inputContainer = document.createElement('div');
        inputContainer.style.cssText = 'display: flex; gap: 5px; justify-content: center;';
        
        let chars = []; for(let i=0; i<5; i++) chars.push(String.fromCharCode(65 + Math.floor(Math.random() * 26)));

        const charsDisplay = document.createElement('div');
        charsDisplay.style.cssText = 'display: flex; gap: 5px; justify-content: center; margin-bottom: 10px;';
        chars.forEach(char => {
            const box = document.createElement('div');
            box.style.cssText = 'width: 40px; height: 50px; font-size: 28px; font-weight: bold; display: flex; align-items: center; justify-content: center; background: #007bff; color: white; border-radius: 4px;';
            box.textContent = char;
            charsDisplay.appendChild(box);
        });
        board.appendChild(charsDisplay);
        
        let localMatched = 0;
        chars.forEach((char, idx) => {
            const inp = document.createElement('input');
            inp.type = 'text'; inp.maxLength = 1; inp.autocomplete = 'off';
            inp.style.cssText = 'width: 40px; height: 50px; font-size: 24px; text-align: center; text-transform: uppercase; border: 2px solid #ccc; border-radius: 4px;';
            inp.addEventListener('input', (e) => {
                if (e.target.value.toUpperCase() === char) {
                    inp.style.borderColor = '#28a745'; inp.style.backgroundColor = '#d4edda'; inp.disabled = true;
                    localMatched++;
                    if (localMatched >= 5) {
                        clearInterval(window.speedTimer);
                        currentRound++;
                        if (currentRound > totalRounds) endGame('Survie réussie !', true);
                        else setTimeout(() => window.startLettersRound(), 300);
                    } else {
                        const next = inputContainer.querySelectorAll('input')[idx + 1];
                        if (next) next.focus();
                    }
                } else {
                    inp.value = ''; inp.style.borderColor = '#dc3545';
                    setTimeout(() => inp.style.borderColor = '#ccc', 300);
                }
            });
            inputContainer.appendChild(inp);
        });
        board.appendChild(inputContainer);
        setTimeout(() => { const first = inputContainer.querySelector('input'); if(first) first.focus(); }, 100);

        // 5 Seconds Timer Logic
        let timeLeft = 5000; const step = 50;
        clearInterval(window.speedTimer);
        window.speedTimer = setInterval(() => {
            if (isPaused) return;
            timeLeft -= step;
            bar.style.width = `${(timeLeft / 5000) * 100}%`;
            if (timeLeft <= 0) { clearInterval(window.speedTimer); endGame('Temps écoulé !', false); }
        }, step);
    };
    window.startLettersRound();
}
