// ─── Mode : Relier les Points ────────────────────────────────────
function showExampleConnectDots(day, row, vals) {
    const exContainer = document.createElement('div');
    exContainer.style.cssText = 'position:relative; width:150px; height:120px; margin: 10px auto;';

    const pts = [{ x: 20, y: 100 }, { x: 75, y: 20 }, { x: 130, y: 100 }];
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;';

    const line = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
    line.setAttribute('points', '20,100 75,20');
    line.setAttribute('fill', 'none');
    line.setAttribute('stroke', '#34B871');
    line.setAttribute('stroke-width', '4');
    svg.appendChild(line);

    const dashedLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    dashedLine.setAttribute('x1', '75'); dashedLine.setAttribute('y1', '20');
    dashedLine.setAttribute('x2', '130'); dashedLine.setAttribute('y2', '100');
    dashedLine.setAttribute('stroke', '#F5B227'); dashedLine.setAttribute('stroke-width', '4'); dashedLine.setAttribute('stroke-dasharray', '5,5');
    svg.appendChild(dashedLine);
    exContainer.appendChild(svg);

    pts.forEach((p, i) => {
        const dot = document.createElement('div');
        dot.style.cssText = `position:absolute; width:24px; height:24px; border-radius:50%; background-color:${i < 2 ? '#34B871' : '#4A6CFA'}; color:white; display:flex; align-items:center; justify-content:center; font-weight:bold; font-size:11px; left:${p.x - 12}px; top:${p.y - 12}px; z-index:2;`;
        dot.textContent = i + 1;
        exContainer.appendChild(dot);
    });

    row.style.flexDirection = 'column';
    row.append(exContainer);
}

function startGameConnectDots() {
    board.style.display = 'block';
    board.style.position = 'relative';
    board.style.height = '420px';
    board.style.width = '100%';
    board.style.touchAction = 'none'; // bloque le scroll mobile pendant le tracé

    let currentDot = 1;
    let isDrawing = false;
    let points = [];
    let boardRect = null;

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:0;overflow:visible;';
    board.appendChild(svg);

    const padding = 15;
    const dotSize = 34;
    const bw = (board.clientWidth || 300) - dotSize - padding * 2;
    const bh = 420 - dotSize - padding * 2;

    for (let i = 1; i <= activeItemCount; i++) {
        const item = document.createElement('div');
        item.className = 'item';
        item.style.cssText = `position:absolute; width:${dotSize}px; height:${dotSize}px; border-radius:50%; background-color:#4A6CFA; color:white; display:flex; align-items:center; justify-content:center; font-weight:bold; font-size:14px; z-index:10; margin:0; box-sizing:border-box;`;
        item.textContent = i;
        item.dataset.num = i;

        const px = padding + Math.random() * bw;
        const py = padding + Math.random() * bh;

        item.style.left = px + 'px';
        item.style.top = py + 'px';

        points.push({ x: px + (dotSize / 2), y: py + (dotSize / 2), el: item });
        board.appendChild(item);
    }

    let tempLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    tempLine.setAttribute('stroke', '#F5B227');
    tempLine.setAttribute('stroke-width', '4');
    tempLine.setAttribute('stroke-dasharray', '5,5');

    board.addEventListener('pointerdown', (e) => {
        if (isPaused || currentDot >= activeItemCount) return; // partie déjà gagnée
        const target = document.elementFromPoint(e.clientX, e.clientY);
        if (target && target.dataset.num == currentDot) {
            isDrawing = true;
            boardRect = board.getBoundingClientRect();
            target.style.backgroundColor = '#34B871';
            svg.appendChild(tempLine);
            updateTempLine(e);
        }
    });

    board.addEventListener('pointermove', (e) => {  // passive not set: uses elementFromPoint
        if (!isDrawing || isPaused) return;
        updateTempLine(e);

        const target = document.elementFromPoint(e.clientX, e.clientY);
        if (target && target.dataset.num == currentDot + 1) {
            const prevPt = points[currentDot - 1];
            const newPt = points[currentDot];

            const fixedLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            fixedLine.setAttribute('x1', prevPt.x); fixedLine.setAttribute('y1', prevPt.y);
            fixedLine.setAttribute('x2', newPt.x); fixedLine.setAttribute('y2', newPt.y);
            fixedLine.setAttribute('stroke', '#34B871');
            fixedLine.setAttribute('stroke-width', '4');
            svg.appendChild(fixedLine);

            target.style.backgroundColor = '#34B871';
            currentDot++;
            haptic(8);

            if (currentDot >= activeItemCount) {
                isDrawing = false;
                if (tempLine.parentNode) tempLine.remove();
                endGame('Tracé complété !', true); // le dessin reste affiché
            }
        }
    });

    function updateTempLine(e) {
        const rect = boardRect;
        const prevPt = points[currentDot - 1];
        tempLine.setAttribute('x1', prevPt.x);
        tempLine.setAttribute('y1', prevPt.y);
        tempLine.setAttribute('x2', e.clientX - rect.left);
        tempLine.setAttribute('y2', e.clientY - rect.top);
    }

    const stopDrawing = () => {
        // Si la partie est finie ou gagnée, ne pas effacer le tracé
        if (isPaused || currentDot >= activeItemCount) {
            if (tempLine.parentNode) tempLine.remove();
            return;
        }

        if (!isDrawing) return;
        isDrawing = false;
        if (tempLine.parentNode) tempLine.remove();

        // Doigt levé en cours de tracé : on recommence depuis le début
        currentDot = 1;
        svg.innerHTML = '';
        points.forEach(p => p.el.style.backgroundColor = '#4A6CFA');
    };

    board.addEventListener('pointerup', stopDrawing, { passive: true });
    board.addEventListener('pointercancel', stopDrawing, { passive: true });
    board.addEventListener('pointerleave', stopDrawing, { passive: true });
}
