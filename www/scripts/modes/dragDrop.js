// ─── Mode : Pair ou Impair (toucher un nombre puis sa boîte) ─────
function showExampleDragDrop(day, row, vals) {
    const ex = document.createElement('div');
    ex.style.cssText = 'display:flex;gap:14px;align-items:center;margin:6px auto;';

    const num = document.createElement('div');
    num.className = 'item type-numbers';
    num.style.margin = '0';
    applyStyle(num, 'numbers', 8);
    num.style.boxShadow = '0 0 0 3px #FFFFFF, 0 0 0 6px #4A6CFA';

    const arrow = document.createElement('div');
    arrow.style.cssText = 'font-size:22px;font-weight:bold;color:#8B90A0;';
    arrow.textContent = '→';

    const zone = document.createElement('div');
    zone.style.cssText = 'width:70px; height:60px; border:2px dashed #34B871; border-radius:12px; display:flex; align-items:center; justify-content:center; font-weight:bold; color:#34B871;';
    zone.textContent = 'PAIR';

    ex.append(num, arrow, zone);
    row.style.flexDirection = 'column';
    row.append(ex);
}

function startGameDragDrop() {
    board.style.display = 'flex'; board.style.flexDirection = 'column'; board.style.alignItems = 'center'; board.style.width = '100%';

    let selectedItem = null; // mode tap

    const itemsContainer = document.createElement('div');
    itemsContainer.style.cssText = 'display:flex; flex-wrap:wrap; gap:10px; justify-content:center; margin-bottom: 40px; min-height: 60px;';
    board.appendChild(itemsContainer);

    const zonesContainer = document.createElement('div');
    zonesContainer.style.cssText = 'display:flex; gap:20px; width:100%; justify-content:center;';

    function handleDrop(zone, val, draggedEl) {
        if (isPaused) return;
        const expectedType = (val % 2 === 0) ? 'pair' : 'impair';
        if (zone.dataset.type === expectedType) {
            if (draggedEl) draggedEl.remove();
            matched++;
            selectedItem = null;
            haptic(8);
            if (matched >= activeItemCount) endGame('Tri terminé sans faute !', true);
        } else {
            endGame('Mauvaise boîte !', false);
        }
    }

    const createZone = (title, type) => {
        const zone = document.createElement('div');
        zone.style.cssText = 'width: 130px; height: 110px; border: 3px dashed #8B90A0; border-radius: 16px; display:flex; align-items:center; justify-content:center; font-weight:bold; font-size:20px; color:#8B90A0; transition: background 0.2s; cursor: pointer; background:#FFFFFF;';
        zone.textContent = title; zone.dataset.type = type;

        // Glisser-déposer (tablettes / souris)
        zone.addEventListener('dragover', e => { e.preventDefault(); zone.style.backgroundColor = '#EBE0E8'; });
        zone.addEventListener('dragleave', () => { zone.style.backgroundColor = '#FFFFFF'; });
        zone.addEventListener('drop', e => {
            e.preventDefault(); zone.style.backgroundColor = '#FFFFFF';
            const val = parseInt(e.dataTransfer.getData('text/plain'));
            const draggedEl = document.getElementById('drag-' + val);
            handleDrop(zone, val, draggedEl);
        });

        // Tap : toucher une zone y place l'élément sélectionné
        zone.addEventListener('click', () => {
            if (isPaused || !selectedItem) return;
            const val = parseInt(selectedItem.dataset.tapVal);
            handleDrop(zone, val, selectedItem);
        });

        return zone;
    };

    zonesContainer.appendChild(createZone('PAIR', 'pair'));
    zonesContainer.appendChild(createZone('IMPAIR', 'impair'));
    board.appendChild(zonesContainer);

    let vals = []; for (let i = 0; i < activeItemCount; i++) vals.push(Math.floor(Math.random() * 99) + 1);
    vals.forEach(val => {
        const item = document.createElement('div');
        item.id = 'drag-' + val; item.className = 'item type-numbers';
        item.draggable = true; applyStyle(item, 'numbers', val);
        item.style.cursor = 'pointer';
        item.dataset.tapVal = val;

        item.addEventListener('dragstart', e => {
            e.dataTransfer.setData('text/plain', val);
            setTimeout(() => item.style.opacity = '0.5', 0);
        });
        item.addEventListener('dragend', () => item.style.opacity = '1');

        // Tap : sélectionner l'élément, puis toucher une boîte
        item.addEventListener('click', () => {
            if (isPaused) return;
            if (selectedItem) selectedItem.style.boxShadow = '';
            selectedItem = item;
            item.style.boxShadow = '0 0 0 3px #FFFFFF, 0 0 0 6px #4A6CFA';
        });

        itemsContainer.appendChild(item);
    });
}
