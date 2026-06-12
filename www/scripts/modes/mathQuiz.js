// ─── Mode : Calcul mental (4 variantes : + − × ÷) ────────────────
function showExampleMathQuiz(day, row, vals, mode) {
    const exContainer = document.createElement('div');
    exContainer.style.cssText = 'display:flex; flex-direction:column; align-items:center; gap:10px; margin: 6px auto;';

    let a = 6, b = 2, ans = 0;
    if (mode.mathOp === '+') ans = a + b;
    else if (mode.mathOp === '-') ans = a - b;
    else if (mode.mathOp === '*') ans = a * b;
    else if (mode.mathOp === '/') ans = a / b;

    const eqPreview = document.createElement('div');
    eqPreview.style.cssText = 'font-size: 1.5rem; font-weight: bold; color: #23262F; letter-spacing: 2px;';
    const opSymbol = mode.mathOp === '*' ? '×' : (mode.mathOp === '/' ? '÷' : mode.mathOp);
    eqPreview.textContent = `${a} ${opSymbol} ${b} = ?`;

    const answersPreview = document.createElement('div');
    answersPreview.style.cssText = 'display:flex; gap:10px;';

    [ans, ans + 3, ans - 1].forEach((val, idx) => {
        const box = document.createElement('div');
        box.style.cssText = 'width: 40px; height: 40px; display:flex; align-items:center; justify-content:center; font-weight:bold; font-size:16px; margin:0; border-radius:10px; box-sizing:border-box; color:white;';
        box.style.backgroundColor = idx === 0 ? '#34B871' : '#4A6CFA';
        if (idx === 0) box.style.boxShadow = '0 0 0 3px rgba(95, 130, 104, 0.35)';
        box.textContent = val;
        answersPreview.appendChild(box);
    });

    exContainer.append(eqPreview, answersPreview);
    row.style.flexDirection = 'column';
    row.append(exContainer);
}

function startGameMathQuiz(mode) {
    board.style.display = 'flex';
    board.style.flexDirection = 'row';
    board.style.flexWrap = 'wrap';
    board.style.justifyContent = 'center';
    currentRound = 1;
    totalRounds = 3;

    window.startMathRound = function () {
        board.innerHTML = '';
        let nums = [];
        let count = currentRound + 1; // manche 1 = 2 nombres, manche 2 = 3…
        let op = mode.mathOp;
        let answer = 0;

        if (op === '+') {
            for (let i = 0; i < count; i++) nums.push(Math.floor(Math.random() * 9) + 1);
            answer = nums.reduce((a, b) => a + b, 0);
        } else if (op === '-') {
            for (let i = 0; i < count; i++) nums.push(Math.floor(Math.random() * 9) + 1);
            answer = nums[0]; for (let i = 1; i < count; i++) answer -= nums[i];
        } else if (op === '*') {
            for (let i = 0; i < count; i++) nums.push(Math.floor(Math.random() * 9) + 1);
            answer = nums.reduce((a, b) => a * b, 1);
        } else if (op === '/') {
            // Divisions exactes uniquement, avec des nombres de 1 à 9
            let startNum = Math.floor(Math.random() * 9) + 1;
            nums = [startNum];
            for (let i = 0; i < count - 1; i++) {
                let currentVal = nums.reduce((acc, val, idx) => idx === 0 ? val : acc / val, startNum);
                let possibleDivisors = [];
                for (let d = 1; d <= 9; d++) { if (currentVal % d === 0) possibleDivisors.push(d); }
                nums.push(possibleDivisors[Math.floor(Math.random() * possibleDivisors.length)]);
            }
            answer = nums.reduce((acc, val, idx) => idx === 0 ? val : acc / val, nums[0]);
        }

        currentMathTarget = answer;
        const opSymbol = op === '*' ? '×' : (op === '/' ? '÷' : op);

        let targetUI = document.getElementById('dynamic-target-ui');
        if (targetUI) targetUI.remove();
        targetUI = document.createElement('div');
        targetUI.id = 'dynamic-target-ui';
        targetUI.style.cssText = 'display:flex; flex-direction:column; justify-content:center; align-items:center; width:100%; margin:14px 0 6px; font-weight:bold; color:#23262F;';
        targetUI.innerHTML = `<div style="font-size:.95rem; color:#9AA0AE; letter-spacing:.15em; text-transform:uppercase;">Manche ${currentRound}/${totalRounds}</div><div style="font-size:2rem; letter-spacing:2px;">${nums.join(` ${opSymbol} `)} = ?</div>`;
        board.parentNode.insertBefore(targetUI, board);

        // Réponses uniques incluant la bonne
        let answers = [answer];
        while (answers.length < activeItemCount) {
            let fake = answer + Math.floor(Math.random() * 30) - 15;
            if (fake === answer) fake++;
            while (answers.includes(fake)) fake++;
            answers.push(fake);
        }
        answers.sort(() => Math.random() - 0.5);

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
