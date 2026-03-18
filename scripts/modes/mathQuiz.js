function showExampleMathQuiz(day, row, vals, mode) {
    const desc = document.createElement('div'); desc.innerHTML = 'Trouvez le bon résultat<br>le plus vite possible !'; desc.style.textAlign = 'center'; desc.style.fontWeight = 'bold'; desc.style.color = '#333';
    
    const exContainer = document.createElement('div');
    exContainer.style.cssText = 'display:flex; flex-direction:column; align-items:center; gap:10px; margin: 15px auto;';
    
    // Calcul factice pour l'exemple
    let a = 6, b = 2, ans = 0;
    if (mode.mathOp === '+') ans = a + b;
    else if (mode.mathOp === '-') ans = a - b;
    else if (mode.mathOp === '*') ans = a * b;
    else if (mode.mathOp === '/') ans = a / b;
    
    const eqPreview = document.createElement('div');
    eqPreview.style.cssText = 'font-size: 1.5rem; font-weight: bold; color: #333; letter-spacing: 2px;';
    const opSymbol = mode.mathOp === '*' ? '×' : (mode.mathOp === '/' ? '÷' : mode.mathOp);
    eqPreview.textContent = `${a} ${opSymbol} ${b} = ?`;
    
    const answersPreview = document.createElement('div');
    answersPreview.style.cssText = 'display:flex; gap:10px;';
    
    // On affiche la bonne réponse (en vert) et deux fausses
    [ans, ans + 3, ans - 1].forEach((val, idx) => {
        const box = document.createElement('div');
        box.className = 'item type-numbers';
        box.style.cssText = 'width: 40px; height: 40px; display:flex; align-items:center; justify-content:center; font-weight:bold; font-size:16px; margin:0; border-radius:8px; box-sizing:border-box;';
        box.style.backgroundColor = idx === 0 ? '#28a745' : '#007bff';
        box.style.color = 'white';
        if(idx === 0) box.style.boxShadow = '0 0 0 3px rgba(40, 167, 69, 0.4)';
        box.textContent = val;
        answersPreview.appendChild(box);
    });
    
    exContainer.append(eqPreview, answersPreview);
    row.style.flexDirection = 'column';
    row.append(desc, exContainer);
}

function startGameMathQuiz(mode) {
    board.style.display = 'flex';
    board.style.flexDirection = 'row';
    board.style.flexWrap = 'wrap';
    board.style.justifyContent = 'center';
    currentRound = 1;
    totalRounds = 3;
    
    window.startMathRound = function() {
        board.innerHTML = '';
        let nums = [];
        let count = currentRound + 1; // Round 1 = 2 numbers, Round 2 = 3...
        let op = mode.mathOp;
        let answer = 0;

        if (op === '+') {
            for(let i=0; i<count; i++) nums.push(Math.floor(Math.random()*9)+1);
            answer = nums.reduce((a,b)=>a+b, 0);
        } else if (op === '-') {
            for(let i=0; i<count; i++) nums.push(Math.floor(Math.random()*9)+1);
            answer = nums[0]; for(let i=1; i<count; i++) answer -= nums[i];
        } else if (op === '*') {
            for(let i=0; i<count; i++) nums.push(Math.floor(Math.random()*9)+1);
            answer = nums.reduce((a,b)=>a*b, 1);
        } else if (op === '/') {
            // Ensure perfect divisions with 1-9 numbers only
            let startNum = Math.floor(Math.random()*9)+1;
            nums = [startNum];
            for(let i=0; i<count-1; i++) {
                let currentVal = nums.reduce((acc, val, idx) => idx === 0 ? val : acc / val, startNum);
                let possibleDivisors = [];
                for(let d=1; d<=9; d++) { if (currentVal % d === 0) possibleDivisors.push(d); }
                nums.push(possibleDivisors[Math.floor(Math.random()*possibleDivisors.length)]);
            }
            answer = nums.reduce((acc, val, idx) => idx === 0 ? val : acc / val, nums[0]);
        }

        currentMathTarget = answer;
        const opSymbol = op === '*' ? '×' : (op === '/' ? '÷' : op);

        let targetUI = document.getElementById('dynamic-target-ui');
        if (targetUI) targetUI.remove();
        targetUI = document.createElement('div');
        targetUI.id = 'dynamic-target-ui';
        targetUI.style.cssText = 'display:flex; flex-direction:column; justify-content:center; align-items:center; width:100%; margin-bottom:20px; font-weight:bold; color:#333;';
        targetUI.innerHTML = `<div style="font-size:1.2rem; color:#666;">ROUND ${currentRound}/${totalRounds}</div><div style="font-size:2rem; letter-spacing:2px;">${nums.join(` ${opSymbol} `)} = ?</div>`;
        board.parentNode.insertBefore(targetUI, board);

        // Generate unique answers including the correct one
        let answers = [answer];
        while(answers.length < activeItemCount) {
            let fake = answer + Math.floor(Math.random() * 30) - 15;
            if (fake === answer) fake++;
            while(answers.includes(fake)) fake++;
            answers.push(fake);
        }
        answers.sort(() => Math.random() - 0.5);

        // Render answers
        answers.forEach(val => {
            const item = document.createElement('div');
            item.className = 'item type-numbers'; 
            item.dataset.value = val;
            applyStyle(item, 'numbers', val); 
            item.style.margin = '10px';
            item.addEventListener('click', () => handleLogic(item, val, null, mode, answers));
            board.appendChild(item);
        });
    };
    
    window.startMathRound();
}
