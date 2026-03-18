import { state, dom } from '../state.js';
import { ALPHA_TABLE } from '../renderer.js';
import { endGame } from '../endgame.js';

export function startTyping() {
    dom.board.style.display        = 'flex';
    dom.board.style.flexDirection  = 'column';
    dom.board.style.alignItems     = 'center';

    const wordContainer = document.createElement('div');
    wordContainer.style.cssText = 'font-size:2rem;font-weight:bold;letter-spacing:5px;margin-bottom:20px;color:#333;';

    const inputContainer = document.createElement('div');
    inputContainer.style.cssText = 'display:flex;gap:5px;flex-wrap:wrap;justify-content:center;width:100%;';

    let chars = [];
    for (let i = 0; i < state.activeItemCount; i++) {
        chars.push(ALPHA_TABLE[Math.floor(Math.random() * 26) + 1]);
    }
    wordContainer.textContent = chars.join('');
    dom.board.appendChild(wordContainer);
    dom.board.appendChild(inputContainer);

    let matched = 0;
    chars.forEach((char, idx) => {
        const inp = document.createElement('input');
        inp.type = 'text'; inp.maxLength = 1; inp.autocomplete = 'off';
        inp.style.cssText = 'width:35px;height:45px;font-size:24px;text-align:center;text-transform:uppercase;border:2px solid #ccc;border-radius:4px;padding:0;';
        inp.addEventListener('input', (e) => {
            if (e.target.value.toUpperCase() === char) {
                inp.style.borderColor = '#28a745'; inp.style.backgroundColor = '#d4edda'; inp.disabled = true;
                matched++;
                if (matched >= state.activeItemCount) endGame('Texte complété !', true);
                else { const next = inputContainer.querySelectorAll('input')[idx + 1]; if (next) next.focus(); }
            } else {
                inp.value = ''; inp.style.borderColor = '#dc3545';
                setTimeout(() => inp.style.borderColor = '#ccc', 300);
            }
        });
        inputContainer.appendChild(inp);
    });
    setTimeout(() => { const first = inputContainer.querySelector('input'); if (first) first.focus(); }, 100);
}

export function previewTyping(row) {
    const desc = document.createElement('div');
    desc.innerHTML = 'Tapez les lettres au clavier<br>le plus vite possible !';
    desc.style.cssText = 'text-align:center;font-weight:bold;color:#333;';

    const exContainer = document.createElement('div');
    exContainer.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:8px;margin:15px auto;';
    const wordPreview = document.createElement('div');
    wordPreview.style.cssText = 'font-size:1.2rem;font-weight:bold;letter-spacing:4px;color:#333;';
    wordPreview.textContent = 'MOTS';
    const inputsPreview = document.createElement('div');
    inputsPreview.style.cssText = 'display:flex;gap:5px;';
    ['M', 'O', 'T', 'S'].forEach((char, idx) => {
        const box = document.createElement('div');
        box.style.cssText = 'width:25px;height:35px;border:2px solid #ccc;border-radius:4px;display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:14px;';
        if (idx === 0) { box.textContent = 'M'; box.style.borderColor = '#28a745'; box.style.backgroundColor = '#d4edda'; }
        else if (idx === 1) { box.textContent = '|'; box.style.color = '#007bff'; box.style.borderColor = '#007bff'; }
        inputsPreview.appendChild(box);
    });
    exContainer.append(wordPreview, inputsPreview);
    row.style.flexDirection = 'column';
    row.append(desc, exContainer);
}
