import { state, dom } from '../state.js';
import { endGame } from '../endgame.js';

export function startConnectDots() {
    dom.board.style.display     = 'block';
    dom.board.style.position    = 'relative';
    dom.board.style.height      = '400px';
    dom.board.style.width       = '100%';
    dom.board.style.touchAction = 'none';

    let currentDot = 1, isDrawing = false;
    const dotSize = 30, padding = 15;
    const bw = (dom.board.clientWidth || 300) - dotSize - padding * 2;
    const bh = 400 - dotSize - padding * 2;

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:0;overflow:visible;';
    dom.board.appendChild(svg);

    const points = [];
    for (let i = 1; i <= state.activeItemCount; i++) {
        const item = document.createElement('div');
        item.className = 'item';
        item.style.cssText = `position:absolute;width:${dotSize}px;height:${dotSize}px;border-radius:50%;background-color:#007bff;color:white;display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:14px;z-index:10;margin:0;box-sizing:border-box;`;
        item.textContent  = i;
        item.dataset.num  = i;
        const px = padding + Math.random() * bw;
        const py = padding + Math.random() * bh;
        item.style.left = px + 'px'; item.style.top = py + 'px';
        points.push({ x: px + dotSize / 2, y: py + dotSize / 2, el: item });
        dom.board.appendChild(item);
    }

    const tempLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    tempLine.setAttribute('stroke', '#ff9800'); tempLine.setAttribute('stroke-width', '4'); tempLine.setAttribute('stroke-dasharray', '5,5');

    dom.board.addEventListener('pointerdown', (e) => {
        if (state.isPaused || currentDot >= state.activeItemCount) return;
        const target = document.elementFromPoint(e.clientX, e.clientY);
        if (target && target.dataset.num == currentDot) {
            isDrawing = true; target.style.backgroundColor = '#28a745';
            svg.appendChild(tempLine); updateTempLine(e);
        }
    });
    dom.board.addEventListener('pointermove', (e) => {
        if (!isDrawing || state.isPaused) return;
        updateTempLine(e);
        const target = document.elementFromPoint(e.clientX, e.clientY);
        if (target && target.dataset.num == currentDot + 1) {
            const prevPt = points[currentDot - 1], newPt = points[currentDot];
            const fixedLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            fixedLine.setAttribute('x1', prevPt.x); fixedLine.setAttribute('y1', prevPt.y);
            fixedLine.setAttribute('x2', newPt.x);  fixedLine.setAttribute('y2', newPt.y);
            fixedLine.setAttribute('stroke', '#28a745'); fixedLine.setAttribute('stroke-width', '4');
            svg.appendChild(fixedLine);
            target.style.backgroundColor = '#28a745'; currentDot++;
            if (currentDot >= state.activeItemCount) { isDrawing = false; if (tempLine.parentNode) tempLine.remove(); endGame('Dessin complété !', true); }
        }
    });

    function updateTempLine(e) {
        const rect = dom.board.getBoundingClientRect();
        const prevPt = points[currentDot - 1];
        tempLine.setAttribute('x1', prevPt.x); tempLine.setAttribute('y1', prevPt.y);
        tempLine.setAttribute('x2', e.clientX - rect.left); tempLine.setAttribute('y2', e.clientY - rect.top);
    }

    const stopDrawing = () => {
        if (state.isPaused || currentDot >= state.activeItemCount) { if (tempLine.parentNode) tempLine.remove(); return; }
        if (!isDrawing) return;
        isDrawing = false; if (tempLine.parentNode) tempLine.remove();
        currentDot = 1; svg.innerHTML = '';
        points.forEach(p => p.el.style.backgroundColor = '#007bff');
    };
    dom.board.addEventListener('pointerup',     stopDrawing);
    dom.board.addEventListener('pointercancel', stopDrawing);
    dom.board.addEventListener('pointerleave',  stopDrawing);
}

export function previewConnectDots(row) {
    const desc = document.createElement('div');
    desc.innerHTML = 'Reliez les points dans l\'ordre<br>sans relâcher le doigt !';
    desc.style.cssText = 'text-align:center;font-weight:bold;color:#333;';
    const exContainer = document.createElement('div');
    exContainer.style.cssText = 'position:relative;width:150px;height:120px;margin:10px auto;';
    const pts = [{x: 20, y: 100}, {x: 75, y: 20}, {x: 130, y: 100}];
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;';
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
    line.setAttribute('points', '20,100 75,20'); line.setAttribute('fill', 'none');
    line.setAttribute('stroke', '#28a745'); line.setAttribute('stroke-width', '4');
    svg.appendChild(line);
    const dashedLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    dashedLine.setAttribute('x1','75'); dashedLine.setAttribute('y1','20');
    dashedLine.setAttribute('x2','130'); dashedLine.setAttribute('y2','100');
    dashedLine.setAttribute('stroke','#ff9800'); dashedLine.setAttribute('stroke-width','4'); dashedLine.setAttribute('stroke-dasharray','5,5');
    svg.appendChild(dashedLine); exContainer.appendChild(svg);
    pts.forEach((p, i) => {
        const dot = document.createElement('div');
        dot.style.cssText = `position:absolute;width:24px;height:24px;border-radius:50%;background-color:${i < 2 ? '#28a745' : '#007bff'};color:white;display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:11px;left:${p.x - 12}px;top:${p.y - 12}px;z-index:2;`;
        dot.textContent = i + 1; exContainer.appendChild(dot);
    });
    row.style.flexDirection = 'column'; row.append(desc, exContainer);
}
