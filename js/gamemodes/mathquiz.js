import { state, dom } from '../state.js';
import { generateValues, applyStyle } from '../renderer.js';
import { handleLogic } from '../logic.js';
import { endGame } from '../endgame.js';

export function startMathQuiz(mode) {
    dom.board.style.display      = 'flex';
    dom.board.style.flexDirection = 'row';
    dom.board.style.flexWrap     = 'wrap';
    dom.board.style.justifyContent = 'center';
    state.currentRound = 1;
    state.totalRounds  = 3;
    window.startMathRound = () => _mathRound(mode);
    window.startMathRound();
}

function _mathRound(mode) {
    dom.board.innerHTML = '';
    const op = mode.mathOp;
    let nums = [], answer = 0;
    const count = state.currentRound + 1;

    if (op === '+') { for (let i = 0; i < count; i++) nums.push(Math.floor(Math.random() * 9) + 1); answer = nums.reduce((a, b) => a + b, 0); }
    else if (op === '-') { for (let i = 0; i < count; i++) nums.push(Math.floor(Math.random() * 9) + 1); answer = nums[0]; for (let i = 1; i < count; i++) answer -= nums[i]; }
    else if (op === '*') { for (let i = 0; i < count; i++) nums.push(Math.floor(Math.random() * 9) + 1); answer = nums.reduce((a, b) => a * b, 1); }
    else if (op === '/') {
        let startNum = Math.floor(Math.random() * 9) + 1; nums = [startNum];
        for (let i = 0; i < count - 1; i++) {
            let cur = nums.reduce((acc, val, idx) => idx === 0 ? val : acc / val, startNum);
            let possible = []; for (let d = 1; d <= 9; d++) if (cur % d === 0) possible.push(d);
            nums.push(possible[Math.floor(Math.random() * possible.length)]);
        }
        answer = nums.reduce((acc, val, idx) => idx === 0 ? val : acc / val, nums[0]);
    }

    state.currentMathTarget = answer;
    const opSymbol = op === '*' ? '×' : (op === '/' ? '÷' : op);

    let targetUI = document.getElementById('dynamic-target-ui');
    if (targetUI) targetUI.remove();
    targetUI = document.createElement('div'); targetUI.id = 'dynamic-target-ui';
    targetUI.style.cssText = 'display:flex;flex-direction:column;justify-content:center;align-items:center;width:100%;margin-bottom:20px;font-weight:bold;color:#333;';
    targetUI.innerHTML = `<div style="font-size:1.2rem;color:#666;">ROUND ${state.currentRound}/${state.totalRounds}</div><div style="font-size:2rem;letter-spacing:2px;">${nums.join(` ${opSymbol} `)} = ?</div>`;
    dom.board.parentNode.insertBefore(targetUI, dom.board);

    const vals = generateValues(state.currentDayConfig.type, state.activeItemCount);
    vals.forEach(val => {
        const item = document.createElement('div');
        item.className = `item type-${state.currentDayConfig.type}`;
        applyStyle(item, 'numbers', val);
        item.style.margin = '10px';
        item.addEventListener('click', () => handleLogic(item, val, null, mode, vals));
        dom.board.appendChild(item);
    });
}

export function previewMathQuiz(mode, row) {
    const desc = document.createElement('div');
    desc.innerHTML = 'Trouvez le bon résultat<br>le plus vite possible !';
    desc.style.cssText = 'text-align:center;font-weight:bold;color:#333;';
    const exContainer = document.createElement('div');
    exContainer.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:10px;margin:15px auto;';
    let a = 6, b = 2, ans = mode.mathOp === '+' ? a+b : mode.mathOp === '-' ? a-b : mode.mathOp === '*' ? a*b : a/b;
    const opSymbol = mode.mathOp === '*' ? '×' : (mode.mathOp === '/' ? '÷' : mode.mathOp);
    const eqPreview = document.createElement('div');
    eqPreview.style.cssText = 'font-size:1.5rem;font-weight:bold;color:#333;letter-spacing:2px;';
    eqPreview.textContent = `${a} ${opSymbol} ${b} = ?`;
    const answersPreview = document.createElement('div'); answersPreview.style.cssText = 'display:flex;gap:10px;';
    [ans, ans + 3, ans - 1].forEach((val, idx) => {
        const box = document.createElement('div');
        box.style.cssText = 'width:40px;height:40px;display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:16px;margin:0;border-radius:8px;box-sizing:border-box;color:white;';
        box.style.backgroundColor = idx === 0 ? '#28a745' : '#007bff';
        if (idx === 0) box.style.boxShadow = '0 0 0 3px rgba(40,167,69,0.4)';
        box.textContent = val; answersPreview.appendChild(box);
    });
    exContainer.append(eqPreview, answersPreview);
    row.style.flexDirection = 'column'; row.append(desc, exContainer);
}
