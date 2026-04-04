function showExampleDragDrop(day, row, vals) {
    const desc = document.createElement('div'); desc.innerHTML = 'Cliquez un nombre puis sa boîte<br>(Pair/Impair) !'; desc.style.textAlign = 'center'; desc.style.fontWeight = 'bold'; desc.style.color = '#333';
    const ex = document.createElement('div'); ex.style.cssText = 'width:60px; height:60px; border:2px dashed #666; border-radius:5px; margin: 15px auto; display:flex; align-items:center; justify-content:center; font-weight:bold; color:#666;'; ex.textContent = 'PAIR';
    row.style.flexDirection = 'column'; row.append(desc, ex);
}

function startGameDragDrop() {
    board.style.display = 'flex'; board.style.flexDirection = 'column'; board.style.alignItems = 'center'; board.style.width = '100%';

    let selectedItem = null; // Pour le mode tap

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
            if (matched >= activeItemCount) endGame('Tri terminé !', true);
        } else {
            endGame('Mauvaise boîte !', false);
        }
    }

    const createZone = (title, type) => {
        const zone = document.createElement('div');
        zone.style.cssText = 'width: 120px; height: 120px; border: 3px dashed #666; border-radius: 10px; display:flex; align-items:center; justify-content:center; font-weight:bold; font-size:20px; color:#666; transition: background 0.2s; cursor: pointer;';
        zone.textContent = title; zone.dataset.type = type;

        // Drag support
        zone.addEventListener('dragover', e => { e.preventDefault(); zone.style.backgroundColor = '#e9ecef'; });
        zone.addEventListener('dragleave', () => { zone.style.backgroundColor = 'transparent'; });
        zone.addEventListener('drop', e => {
            e.preventDefault(); zone.style.backgroundColor = 'transparent';
            const val = parseInt(e.dataTransfer.getData('text/plain'));
            const draggedEl = document.getElementById('drag-' + val);
            handleDrop(zone, val, draggedEl);
        });

        // Tap support : cliquer sur une zone place l'item sélectionné
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

    let vals = []; for(let i=0; i<activeItemCount; i++) vals.push(Math.floor(Math.random()*99)+1);
    vals.forEach(val => {
        const item = document.createElement('div');
        item.id = 'drag-' + val; item.className = 'item type-numbers';
        item.draggable = true; applyStyle(item, 'numbers', val);
        item.style.cursor = 'pointer';
        item.dataset.tapVal = val;

        // Drag support
        item.addEventListener('dragstart', e => {
            e.dataTransfer.setData('text/plain', val);
            setTimeout(() => item.style.opacity = '0.5', 0);
        });
        item.addEventListener('dragend', () => item.style.opacity = '1');

        // Tap support : cliquer sélectionne l'item, puis cliquer sur une zone le place
        item.addEventListener('click', () => {
            if (isPaused) return;
            // Déselectionner l'ancien
            if (selectedItem) selectedItem.style.boxShadow = '';
            selectedItem = item;
            item.style.boxShadow = '0 0 0 4px #007bff';
        });

        itemsContainer.appendChild(item);
    });
}
