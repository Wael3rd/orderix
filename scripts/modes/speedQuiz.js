function showExampleSpeedQuiz(day, row, vals) {
    // UI Preview for Speed Quiz in menu (Static text, no game logic)
    const desc = document.createElement('div'); 
    desc.innerHTML = 'Trouvez TOUTES les bonnes réponses<br>le plus vite possible !'; 
    desc.style.textAlign = 'center'; 
    desc.style.fontWeight = 'bold'; 
    desc.style.color = '#333';
    
    const ex = document.createElement('div'); 
    
    row.style.flexDirection = 'column'; 
    row.append(desc, ex);
}

function startGameSpeedQuiz() {
    // GAME 4 : SPEED QUIZ (Extraction déterministe)
    board.style.display = 'flex'; board.style.flexDirection = 'column'; board.style.alignItems = 'center';
    currentRound = 1; 
    totalRounds = 5; 
    
    const tType = currentDayConfig.type || 'numbers';
    
    let availableRules = ['min', 'max', 'start', 'end'];
    if (tType === 'numbers') availableRules.push('even', 'odd');
    else availableRules.push('start', 'end'); 
    let roundQuestions = availableRules.sort(() => Math.random() - 0.5).slice(0, 5);
    
    window.startQuizRound = function() {
        board.innerHTML = '';
        const choicesCount = Math.max(parseInt(activeItemCount) || 20, 6);
        const targetK = 5; // Nombre EXACT de bonnes réponses exigées
        let qType = roundQuestions[currentRound - 1];
        
        let vals = [];
        let conditionFn;
        let qTxt = '';
        
        // On génère une énorme réserve de valeurs uniques pour piocher avec précision
        let bigPool = [...new Set(generateValues(tType, 400))].sort(() => Math.random() - 0.5);
        
        // FALLBACK: Si le pool est trop petit pour extraire la condition, on bascule sur Min/Max
        if (bigPool.length < choicesCount) { qType = 'min'; }

        if (qType === 'min') {
            vals = bigPool.slice(0, choicesCount);
            let sorted = [...vals].sort((a, b) => typeof a === 'string' ? a.localeCompare(b) : a - b);
            let targets = sorted.slice(0, targetK);
            conditionFn = v => targets.includes(v);
            qTxt = `Les ${targetK} plus PETITS ?`;
            if (tType === 'size') qTxt = `Les ${targetK} plus FINS ?`;
            if (tType === 'lightness') qTxt = `Les ${targetK} plus SOMBRES ?`;
            if (tType === 'opacity') qTxt = `Les ${targetK} plus TRANSPARENTS ?`;
            
        } else if (qType === 'max') {
            vals = bigPool.slice(0, choicesCount);
            let sorted = [...vals].sort((a, b) => typeof a === 'string' ? a.localeCompare(b) : a - b);
            let targets = sorted.slice(-targetK);
            conditionFn = v => targets.includes(v);
            qTxt = `Les ${targetK} plus GRANDS ?`;
            if (tType === 'size') qTxt = `Les ${targetK} plus GROS ?`;
            if (tType === 'lightness') qTxt = `Les ${targetK} plus CLAIRS ?`;
            if (tType === 'opacity') qTxt = `Les ${targetK} plus OPAQUES ?`;

        } else if (qType === 'even') {
            let evens = bigPool.filter(v => !isNaN(v) && parseInt(v) % 2 === 0);
            let odds = bigPool.filter(v => !isNaN(v) && parseInt(v) % 2 !== 0);
            vals = [...evens.slice(0, targetK), ...odds.slice(0, choicesCount - targetK)];
            conditionFn = v => !isNaN(v) && parseInt(v) % 2 === 0;
            qTxt = 'Tous les PAIRS ?';

        } else if (qType === 'odd') {
            let odds = bigPool.filter(v => !isNaN(v) && parseInt(v) % 2 !== 0);
            let evens = bigPool.filter(v => !isNaN(v) && parseInt(v) % 2 === 0);
            vals = [...odds.slice(0, targetK), ...evens.slice(0, choicesCount - targetK)];
            conditionFn = v => !isNaN(v) && parseInt(v) % 2 !== 0;
            qTxt = 'Tous les IMPAIRS ?';

        } else if (qType === 'start') {
            let byChar = {};
            bigPool.forEach(v => {
                let c = String(v).replace(/^#/,'')[0].toUpperCase();
                if(!byChar[c]) byChar[c] = [];
                byChar[c].push(v);
            });
            let validChars = Object.keys(byChar).filter(c => byChar[c].length >= targetK && bigPool.length - byChar[c].length >= (choicesCount - targetK));
            
            if(validChars.length === 0) { 
                // Secours si impossible de trouver 5 départs identiques
                vals = bigPool.slice(0, choicesCount);
                let sorted = [...vals].sort((a, b) => typeof a === 'string' ? a.localeCompare(b) : a - b);
                let targets = sorted.slice(0, targetK);
                conditionFn = v => targets.includes(v);
                qTxt = `Les ${targetK} plus PETITS ?`;
            } else {
                let charTarget = validChars[Math.floor(Math.random() * validChars.length)];
                let targets = byChar[charTarget].slice(0, targetK);
                let others = bigPool.filter(v => String(v).replace(/^#/,'')[0].toUpperCase() !== charTarget).slice(0, choicesCount - targetK);
                vals = [...targets, ...others];
                conditionFn = v => String(v).replace(/^#/,'')[0].toUpperCase() === charTarget;
                qTxt = `Commencent par "${charTarget}" ?`;
            }
        } else if (qType === 'end') {
            let byChar = {};
            bigPool.forEach(v => {
                let c = String(v).slice(-1).toUpperCase();
                if(!byChar[c]) byChar[c] = [];
                byChar[c].push(v);
            });
            let validChars = Object.keys(byChar).filter(c => byChar[c].length >= targetK && bigPool.length - byChar[c].length >= (choicesCount - targetK));
            
            if(validChars.length === 0) { 
                vals = bigPool.slice(0, choicesCount);
                let sorted = [...vals].sort((a, b) => typeof a === 'string' ? a.localeCompare(b) : a - b);
                let targets = sorted.slice(0, targetK);
                conditionFn = v => targets.includes(v);
                qTxt = `Les ${targetK} plus PETITS ?`;
            } else {
                let charTarget = validChars[Math.floor(Math.random() * validChars.length)];
                let targets = byChar[charTarget].slice(0, targetK);
                let others = bigPool.filter(v => String(v).slice(-1).toUpperCase() !== charTarget).slice(0, choicesCount - targetK);
                vals = [...targets, ...others];
                conditionFn = v => String(v).slice(-1).toUpperCase() === charTarget;
                qTxt = `Terminent par "${charTarget}" ?`;
            }
        }
        
        let foundCount = 0;

        const qDiv = document.createElement('div');
        qDiv.style.cssText = 'font-size: 1.5rem; font-weight: bold; margin-bottom: 20px; color: #333; text-align: center;';
        qDiv.innerHTML = `Round ${currentRound}/${totalRounds}<br><span style="color:#007bff">${qTxt}</span><br><span id="quiz-counter" style="font-size:1.1rem; color:#dc3545; display:inline-block; margin-top:5px;">${targetK} à trouver</span>`;
        board.appendChild(qDiv);

        const itemsCont = document.createElement('div');
        itemsCont.style.cssText = 'display:flex; gap:15px; flex-wrap:wrap; justify-content:center; max-width: 600px;';
        
        vals.sort(() => Math.random() - 0.5); 
        vals.forEach(val => {
            const item = document.createElement('div');
            item.className = `item type-${tType}`; item.style.cursor = 'pointer';
            applyStyle(item, tType, val);
            
            item.addEventListener('pointerdown', (e) => {
                e.preventDefault();
                if(isPaused || item.dataset.found) return; 
                
                if(conditionFn(val)) {
                    item.style.boxShadow = '0 0 0 4px #28a745';
                    item.dataset.found = 'true';
                    item.style.transform = 'scale(0.9)'; 
                    foundCount++;
                    
                    const counterSpan = document.getElementById('quiz-counter');
                    if (counterSpan) {
                        let rem = targetK - foundCount;
                        counterSpan.textContent = rem > 0 ? `${rem} à trouver` : 'Parfait !';
                        counterSpan.style.color = rem > 0 ? '#ff9800' : '#28a745';
                    }
                    
                    if(foundCount >= targetK) {
                        currentRound++;
                        if(currentRound > totalRounds) {
                            setTimeout(() => endGame('Quiz terminé !', true), 300);
                        } else {
                            setTimeout(() => window.startQuizRound(), 400); 
                        }
                    }
                } else {
                    item.style.boxShadow = '0 0 0 4px #dc3545';
                    endGame('Mauvaise réponse !', false);
                }
            });
            itemsCont.appendChild(item);
        });
        board.appendChild(itemsCont);
    };
    window.startQuizRound();
}
