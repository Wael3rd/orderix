import { state, dom } from '../state.js';
import { endGame } from '../endgame.js';

export function startDragDrop() {
    dom.board.style.display       = 'flex';
    dom.board.style.flexDirection = 'column';
    dom.board.style.alignItems    = 'center';
    dom.board.style.width         = '100%';

    const itemsContainer = document.createElement('div');
    itemsContainer.style.cssText = 'display:flex;flex-wrap:wrap;gap:10px;justify-content:center;margin-bottom:40px;min-height:60px;';
    dom.board.appendChild(itemsContainer);

    const zonesContainer = document.createElement('div');
    zonesContainer.style.cssText = 'display:flex;gap:20px;width:100%;justify-content:center;';

    const createZone = (title, type) => {
        const zone = document.createElement('div');
        zone.style.cssText = 'width:120px;height:120px;border:3px dashed #666;border-radius:10px;display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:20px;color:#666;transition:background 0.2s;';
        zone.textContent = title; zone.dataset.type = type;
        zone.addEventListener('dragover',  e => { e.preventDefault(); zone.style.backgroundColor = '#e9ecef'; });
        zone.addEventListener('dragleave', () => { zone.style.backgroundColor = 'transparent'; });
        zone.addEventListener('drop', e => {
            e.preventDefault(); zone.style.backgroundColor = 'transparent';
            if (state.isPaused) return;
            const val = parseInt(e.dataTransfer.getData('text/plain'));
            const expectedType = (val % 2 === 0) ? 'pair' : 'impair';
            if (zone.dataset.type === expectedType) {
                const el = document.getElementById('drag-' + val); if (el) el.remove();
                state.matched++;
                if (state.matched >= state.activeItemCount) endGame('Tri terminé !', true);
            } else { endGame('Mauvaise boîte !', false); }
        });
        return zone;
    };
    zonesContainer.appendChild(createZone('PAIR', 'pair'));
    zonesContainer.appendChild(createZone('IMPAIR', 'impair'));
    dom.board.appendChild(zonesContainer);

    const vals = []; for (let i = 0; i < state.activeItemCount; i++) vals.push(Math.floor(Math.random() * 99) + 1);
    vals.forEach(val => {
        const item = document.createElement('div');
        item.className = 'item type-numbers'; item.id = 'drag-' + val;
        item.style.cssText = 'cursor:grab;font-size:18px;color:white;font-weight:bold;display:flex;align-items:center;justify-content:center;margin:0;';
        item.textContent = val; item.draggable = true;
        item.addEventListener('dragstart', e => { e.dataTransfer.setData('text/plain', val); });
        itemsContainer.appendChild(item);
    });
}

export function previewDragDrop(row) {
    const desc = document.createElement('div');
    desc.innerHTML = 'Glissez les nombres dans<br>la bonne boîte (Pair/Impair) !';
    desc.style.cssText = 'text-align:center;font-weight:bold;color:#333;';
    const ex = document.createElement('div');
    ex.style.cssText = 'width:60px;height:60px;border:2px dashed #666;border-radius:5px;margin:15px auto;display:flex;align-items:center;justify-content:center;font-weight:bold;color:#666;';
    ex.textContent = 'PAIR';
    row.style.flexDirection = 'column'; row.append(desc, ex);
}
