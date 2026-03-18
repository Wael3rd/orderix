function showExampleConveyor(day, row, vals) {
    // GAME 3 : CONVEYOR BELT (Example visual)
    board.style.display = 'flex'; board.style.flexDirection = 'column'; board.style.alignItems = 'center'; board.style.overflow = 'hidden'; board.style.width = '100%';

    const tType = day.type || 'numbers';
    
    // Forcer 10 éléments minimum et s'assurer que c'est un entier
    const beltLength = 8; 
    let pool = generateValues(tType, 5);
    let valsConv = []; 
    for (let i = 0; i < beltLength; i++) {
        valsConv.push(pool[Math.floor(Math.random() * pool.length)]);
    }

    const beltWrapper = document.createElement('div');
    // Masque renforcé et conteneur visuellement distinct
    beltWrapper.style.cssText = 'position:relative; width: 340px; height: 100px; display:flex; justify-content:flex-start; align-items:center; overflow:hidden; margin-bottom:30px; border-radius: 8px; background: rgba(0,0,0,0.05); -webkit-mask-image: linear-gradient(to right, transparent 0%, black 15%, black 85%, transparent 100%); mask-image: linear-gradient(to right, transparent 0%, black 15%, black 85%, transparent 100%);';

    const beltContainer = document.createElement('div');
    // padding-left à 130px aligne mathématiquement le 1er objet (80px) pile au centre des 340px
    beltContainer.style.cssText = 'display:flex; align-items:center; height: 100%; transition: transform 0.15s cubic-bezier(0.4, 0, 0.2, 1); width:max-content; padding-left: 130px;';

    const centerMark = document.createElement('div');
    centerMark.style.cssText = 'position:absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); width:64px; height:64px; border:4px solid #ffc107; border-radius:10px; z-index:5; pointer-events:none; box-shadow: 0 0 10px rgba(0,0,0,0.3);';

    valsConv.forEach((val) => {
        const item = document.createElement('div');
        item.className = `item type-${tType}`;
        item.style.margin = '0 10px'; item.style.flexShrink = '0';
        item.style.transition = 'opacity 0.2s, transform 0.2s';
        applyStyle(item, tType, val);
        beltContainer.appendChild(item);
    });

    beltWrapper.appendChild(beltContainer); 
    beltWrapper.appendChild(centerMark); 
    board.appendChild(beltWrapper);

    const btnContainer = document.createElement('div');
    btnContainer.style.cssText = 'display:flex; gap:15px; flex-wrap:wrap; justify-content:center; padding: 10px;';

    let cIdx = 0;
    const uniqueVals = [...new Set(valsConv)].sort(() => Math.random() - 0.5);

    uniqueVals.forEach(uVal => {
        const btn = document.createElement('div');
        btn.className = `item type-${tType}`; btn.style.cursor = 'pointer';
        applyStyle(btn, tType, uVal);

        btn.addEventListener('pointerdown', (e) => {
            e.preventDefault();
            if(isPaused) return;
            if(valsConv[cIdx] === uVal) {
                beltContainer.children[cIdx].style.opacity = '0';
                beltContainer.children[cIdx].style.transform = 'scale(0.5)';
                cIdx++;
                beltContainer.style.transform = `translateX(-${cIdx * 80}px)`;
                if(cIdx >= valsConv.length) {
                    endGame('Tapis vidé !', true);
                }
            } else {
                endGame('Erreur, mauvais objet chargé !', false);
            }
        });
        btnContainer.appendChild(btn);
    });

    board.appendChild(btnContainer);
}

function startGameConveyor() {
    board.style.display = 'flex'; board.style.flexDirection = 'column'; board.style.alignItems = 'center'; board.style.overflow = 'hidden'; board.style.width = '100%';

    const tType = currentDayConfig.type || 'numbers';
    
    // --- NOUVEAUX PARAMÈTRES ---
    const uniqueValuesCount = 4; // Nombre fixe de valeurs différentes sur le tapis
    const beltLength = parseInt(activeItemCount) || 50; // Nombre total d'éléments sur le tapis (issu du serveur)
    
    // On génère un grand pool, puis on extrait exactement 'uniqueValuesCount' valeurs uniques
    let hugePool = generateValues(tType, 50);
    let uniqueChoices = [...new Set(hugePool)].sort(() => Math.random() - 0.5).slice(0, uniqueValuesCount);
    
    // On construit le tapis en piochant aléatoirement parmis ces choix limités
    let vals = []; 
    for (let i = 0; i < beltLength; i++) {
        vals.push(uniqueChoices[Math.floor(Math.random() * uniqueChoices.length)]);
    }

    // Ajout de l'interface du compteur de progression
    const progressDiv = document.createElement('div');
    progressDiv.style.cssText = 'font-size: 1.2rem; font-weight: bold; margin-bottom: 15px; color: #333;';
    progressDiv.innerHTML = `Objet <span id="conveyor-count" style="color:#007bff;">1</span> / ${vals.length}`;
    board.appendChild(progressDiv);

    const beltWrapper = document.createElement('div');
    beltWrapper.style.cssText = 'position:relative; width: 340px; max-width: 100%; height: 100px; display:block; overflow:hidden; margin-bottom:30px; border-radius: 8px; background: rgba(0,0,0,0.05); -webkit-mask-image: linear-gradient(to right, transparent 0%, black 15%, black 85%, transparent 100%); mask-image: linear-gradient(to right, transparent 0%, black 15%, black 85%, transparent 100%);';

    const beltContainer = document.createElement('div');
    beltContainer.style.cssText = 'display:flex; align-items:center; height: 100%; transition: transform 0.15s cubic-bezier(0.4, 0, 0.2, 1); width:max-content; padding-left: calc(50% - 40px); padding-right: calc(50% - 40px);';

    const centerMark = document.createElement('div');
    centerMark.style.cssText = 'position:absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); width:64px; height:64px; border:4px solid #ffc107; border-radius:10px; z-index:5; pointer-events:none; box-shadow: 0 0 10px rgba(0,0,0,0.3);';

    vals.forEach((val) => {
        const item = document.createElement('div');
        item.className = `item type-${tType}`;
        item.style.margin = '0 10px'; item.style.flexShrink = '0';
        item.style.transition = 'opacity 0.2s, transform 0.2s';
        applyStyle(item, tType, val);
        beltContainer.appendChild(item);
    });

    beltWrapper.appendChild(beltContainer); 
    beltWrapper.appendChild(centerMark); 
    board.appendChild(beltWrapper);

    const btnContainer = document.createElement('div');
    btnContainer.style.cssText = 'display:flex; gap:15px; flex-wrap:wrap; justify-content:center; padding: 10px; width: 100%; max-width: 500px;';

    let cIdx = 0;
    
    // Les boutons correspondent exactement aux valeurs uniques choisies
    uniqueChoices.forEach(uVal => {
        const btn = document.createElement('div');
        btn.className = `item type-${tType}`; btn.style.cursor = 'pointer';
        applyStyle(btn, tType, uVal);

        btn.addEventListener('pointerdown', (e) => {
            e.preventDefault();
            if(isPaused) return;
            if(vals[cIdx] === uVal) {
                beltContainer.children[cIdx].style.opacity = '0';
                beltContainer.children[cIdx].style.transform = 'scale(0.5)';
                cIdx++;
                
                const countSpan = document.getElementById('conveyor-count');
                if (countSpan && cIdx < vals.length) {
                    countSpan.textContent = cIdx + 1;
                }
                
                beltContainer.style.transform = `translateX(-${cIdx * 80}px)`;
                if(cIdx >= vals.length) {
                    if (countSpan) countSpan.textContent = vals.length;
                    endGame('Tapis vidé !', true);
                }
            } else {
                endGame('Erreur, mauvais objet chargé !', false);
            }
        });
        btnContainer.appendChild(btn);
    });

    board.appendChild(btnContainer);
}
