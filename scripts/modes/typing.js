function showExampleTyping(day, row, vals) {
    const desc = document.createElement('div'); desc.innerHTML = 'Tapez les lettres au clavier<br>le plus vite possible !'; desc.style.textAlign = 'center'; desc.style.fontWeight = 'bold'; desc.style.color = '#333';

    const exContainer = document.createElement('div');
    exContainer.style.cssText = 'display:flex; flex-direction:column; align-items:center; gap:8px; margin: 15px auto;';

    const wordPreview = document.createElement('div');
    wordPreview.style.cssText = 'font-size: 1.2rem; font-weight: bold; letter-spacing: 4px; color: #333;';
    wordPreview.textContent = 'MOTS';

    const inputsPreview = document.createElement('div');
    inputsPreview.style.cssText = 'display:flex; gap:5px;';

    ['M', 'O', 'T', 'S'].forEach((char, idx) => {
        const box = document.createElement('div');
        box.style.cssText = 'width: 25px; height: 35px; border: 2px solid #ccc; border-radius: 4px; display:flex; align-items:center; justify-content:center; font-weight:bold; font-size:14px;';
        if (idx === 0) {
            box.textContent = 'M';
            box.style.borderColor = '#28a745';
            box.style.backgroundColor = '#d4edda';
        } else if (idx === 1) {
            box.textContent = '|';
            box.style.color = '#007bff';
            box.style.borderColor = '#007bff';
        }
        inputsPreview.appendChild(box);
    });

    exContainer.append(wordPreview, inputsPreview);
    row.style.flexDirection = 'column';
    row.append(desc, exContainer);
}

function startGameTyping() {
    board.style.display = 'flex';
    board.style.flexDirection = 'column';
    board.style.alignItems = 'center';

    const isCompact = activeItemCount > 20;
    const wordContainer = document.createElement('div');
    wordContainer.style.cssText = `font-size: ${isCompact ? '1.2rem' : '2rem'}; font-weight: bold; letter-spacing: ${isCompact ? '2px' : '5px'}; margin-bottom: ${isCompact ? '10px' : '20px'}; color: #333; max-width: 100%; word-break: break-all; text-align: center;`;

    const inputContainer = document.createElement('div');
    inputContainer.style.cssText = `display: flex; gap: ${isCompact ? '3px' : '5px'}; flex-wrap: wrap; justify-content: center; width: 100%;`;

    // Generate characters from a shuffled pool to avoid close repetitions
    let chars = [];
    let letterPool = [];

    for (let i = 0; i < activeItemCount; i++) {
        if (letterPool.length === 0) {
            // Refill and shuffle pool using ALPHA_TABLE (ignoring the leading space)
            letterPool = ALPHA_TABLE.trim().split('').sort(() => Math.random() - 0.5);
        }
        chars.push(letterPool.pop());
    }

    wordContainer.textContent = chars.join('');
    board.appendChild(wordContainer);
    board.appendChild(inputContainer);

    chars.forEach((char, idx) => {
        const inp = document.createElement('input');
        inp.type = 'text';
        inp.maxLength = 1;
        inp.style.cssText = isCompact
            ? 'width: 25px; height: 32px; font-size: 16px; text-align: center; text-transform: uppercase; border: 2px solid #ccc; border-radius: 4px; padding: 0;'
            : 'width: 35px; height: 45px; font-size: 24px; text-align: center; text-transform: uppercase; border: 2px solid #ccc; border-radius: 4px; padding: 0;';
        inp.autocomplete = 'off'; // Prevent OS autocomplete
        inp.dataset.char = char;

        inp.addEventListener('input', (e) => {
            if (e.target.value.toUpperCase() === char) {
                inp.style.borderColor = '#28a745';
                inp.style.backgroundColor = '#d4edda';
                inp.disabled = true;
                matched++;
                if (matched >= activeItemCount) endGame('Texte complété !', true);
                else {
                    const next = inputContainer.querySelectorAll('input')[idx + 1];
                    if (next) next.focus();
                }
            } else {
                inp.value = '';
                inp.style.borderColor = '#dc3545';
                setTimeout(() => inp.style.borderColor = '#ccc', 300);
            }
        });
        inputContainer.appendChild(inp);
    });
    setTimeout(() => { const first = inputContainer.querySelector('input'); if (first) first.focus(); }, 100);
}
