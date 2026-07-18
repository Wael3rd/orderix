// ─── Mode : Chronologie ──────────────────────────────────────────
// Culture générale : 8 cartes dans une colonne, à réordonner par
// GLISSER-DÉPOSER, puis valider. Les bonnes positions se verrouillent
// en vert (valeur révélée), les mauvaises clignotent et restent en
// place. On recommence jusqu'au sans-faute. Données embarquées.

const DATASETS = [
    {
        question: 'Du plus ancien au plus récent', unite: 'année',
        items: [
            { label: 'Machine à vapeur', valeur: 1769 },
            { label: 'Photographie', valeur: 1826 },
            { label: 'Téléphone', valeur: 1876 },
            { label: 'Avion', valeur: 1903 },
            { label: 'Télévision', valeur: 1926 },
            { label: 'Four à micro-ondes', valeur: 1945 },
            { label: 'Web (Internet grand public)', valeur: 1989 },
            { label: 'Smartphone tactile', valeur: 2007 }
        ]
    },
    {
        question: 'Du plus léger au plus lourd', unite: 'kg',
        items: [
            { label: 'Écureuil', valeur: 0.5 },
            { label: 'Chat', valeur: 4 },
            { label: 'Loup', valeur: 40 },
            { label: 'Lion', valeur: 190 },
            { label: 'Cheval', valeur: 500 },
            { label: 'Girafe', valeur: 800 },
            { label: 'Hippopotame', valeur: 1500 },
            { label: 'Éléphant d\'Afrique', valeur: 5000 }
        ]
    },
    {
        question: 'Du plus bas au plus haut', unite: 'm',
        items: [
            { label: 'Arc de Triomphe', valeur: 50 },
            { label: 'Notre-Dame de Paris', valeur: 69 },
            { label: 'Statue de la Liberté', valeur: 93 },
            { label: 'Grande Pyramide', valeur: 139 },
            { label: 'Tour Montparnasse', valeur: 210 },
            { label: 'Tour Eiffel', valeur: 330 },
            { label: 'Empire State Building', valeur: 443 },
            { label: 'Burj Khalifa', valeur: 828 }
        ]
    },
    {
        question: 'Du moins élevé au plus élevé', unite: 'm',
        items: [
            { label: 'Ben Nevis (Écosse)', valeur: 1345 },
            { label: 'Mont Fuji', valeur: 3776 },
            { label: 'Cervin', valeur: 4478 },
            { label: 'Mont Blanc', valeur: 4809 },
            { label: 'Kilimandjaro', valeur: 5895 },
            { label: 'Denali', valeur: 6190 },
            { label: 'Aconcagua', valeur: 6961 },
            { label: 'Everest', valeur: 8849 }
        ]
    },
    {
        question: 'Du plus court au plus long', unite: 'km',
        items: [
            { label: 'Tamise', valeur: 346 },
            { label: 'Seine', valeur: 777 },
            { label: 'Loire', valeur: 1006 },
            { label: 'Rhin', valeur: 1233 },
            { label: 'Danube', valeur: 2850 },
            { label: 'Volga', valeur: 3531 },
            { label: 'Yangzi Jiang', valeur: 6300 },
            { label: 'Nil', valeur: 6650 }
        ]
    },
    {
        question: 'De la plus petite à la plus grande (diamètre)', unite: 'km',
        items: [
            { label: 'La Lune', valeur: 3474 },
            { label: 'Mercure', valeur: 4879 },
            { label: 'Mars', valeur: 6779 },
            { label: 'Vénus', valeur: 12104 },
            { label: 'Terre', valeur: 12742 },
            { label: 'Neptune', valeur: 49244 },
            { label: 'Saturne', valeur: 116460 },
            { label: 'Jupiter', valeur: 139820 }
        ]
    },
    {
        question: 'Du plus lent au plus rapide', unite: 'km/h',
        items: [
            { label: 'Tortue terrestre', valeur: 0.3 },
            { label: 'Poule', valeur: 14 },
            { label: 'Éléphant', valeur: 40 },
            { label: 'Chat', valeur: 48 },
            { label: 'Lévrier', valeur: 72 },
            { label: 'Antilope', valeur: 88 },
            { label: 'Guépard', valeur: 110 },
            { label: 'Faucon pèlerin en piqué', valeur: 320 }
        ]
    },
    {
        question: 'De la vie la plus courte à la plus longue', unite: 'ans',
        items: [
            { label: 'Souris', valeur: 2 },
            { label: 'Hamster', valeur: 3 },
            { label: 'Lapin', valeur: 9 },
            { label: 'Chien', valeur: 13 },
            { label: 'Cheval', valeur: 28 },
            { label: 'Éléphant d\'Asie', valeur: 65 },
            { label: 'Tortue géante', valeur: 150 },
            { label: 'Baleine boréale', valeur: 200 }
        ]
    },
    {
        question: 'Du moins peuplé au plus peuplé', unite: 'millions d\'habitants',
        items: [
            { label: 'Islande', valeur: 0.4 },
            { label: 'Portugal', valeur: 10 },
            { label: 'Espagne', valeur: 48 },
            { label: 'France', valeur: 68 },
            { label: 'Japon', valeur: 124 },
            { label: 'Brésil', valeur: 216 },
            { label: 'États-Unis', valeur: 335 },
            { label: 'Inde', valeur: 1440 }
        ]
    },
    {
        question: 'Du plus ancien au plus récent', unite: 'année',
        items: [
            { label: 'Harpe', valeur: -3000 },
            { label: 'Orgue', valeur: -250 },
            { label: 'Violon', valeur: 1550 },
            { label: 'Piano', valeur: 1700 },
            { label: 'Trompette à pistons', valeur: 1814 },
            { label: 'Saxophone', valeur: 1846 },
            { label: 'Thérémine', valeur: 1920 },
            { label: 'Synthétiseur Moog', valeur: 1964 }
        ]
    }
];

function _chronoFmt(valeur, unite) {
    if (unite === 'année') {
        return valeur < 0 ? `${-valeur} av. J.-C.` : String(valeur);
    }
    return `${valeur} ${unite}`;
}

function _chronoCard(label, small) {
    const card = document.createElement('div');
    card.style.cssText = 'position:relative;background:#FFFFFF;border:2px solid #EEF2FF;' +
        `border-radius:12px;padding:${small ? '6px 10px' : '12px 14px'};` +
        `min-width:${small ? '78px' : '132px'};text-align:center;flex-shrink:0;` +
        'box-shadow:0 2px 6px rgba(35,38,47,.08);user-select:none;';
    const lbl = document.createElement('div');
    lbl.style.cssText = `font-weight:900;color:#23262F;font-size:${small ? '.72rem' : '.92rem'};line-height:1.3;`;
    lbl.textContent = label;
    card.appendChild(lbl);
    const val = document.createElement('div');
    val.style.cssText = `font-weight:bold;color:#8B90A0;font-size:${small ? '.62rem' : '.78rem'};min-height:1.2em;margin-top:2px;`;
    card.appendChild(val);
    card._lbl = lbl;
    card._val = val;
    return card;
}

function _chronoRankChip(card, rank) {
    const chip = document.createElement('div');
    chip.style.cssText = 'position:absolute;top:-9px;left:-9px;width:22px;height:22px;' +
        'border-radius:50%;background:#34B871;color:#FFFFFF;font-weight:900;font-size:12px;' +
        'display:flex;align-items:center;justify-content:center;box-shadow:0 1px 3px rgba(35,38,47,.25);';
    chip.textContent = rank;
    card.appendChild(chip);
}

function showExampleChronologie(day, row, vals) {
    const ex = document.createElement('div');
    ex.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:8px;margin:6px auto;';

    const q = document.createElement('div');
    q.style.cssText = 'font-size:.8rem;color:#8B90A0;font-weight:bold;';
    q.textContent = 'Du plus ancien au plus récent (année)';

    const cardsRow = document.createElement('div');
    cardsRow.style.cssText = 'display:flex;gap:8px;justify-content:center;padding-top:9px;';
    const c1 = _chronoCard('Téléphone', true);
    c1.style.borderColor = '#34B871';
    c1._val.textContent = '1876';
    c1._val.style.color = '#34B871';
    _chronoRankChip(c1, 1);
    cardsRow.append(c1, _chronoCard('Avion', true), _chronoCard('Télévision', true));

    const note = document.createElement('div');
    note.style.cssText = 'font-size:.78rem;color:#8B90A0;font-weight:bold;';
    note.textContent = 'Glissez les cartes pour les réordonner, puis validez — les bonnes se verrouillent';

    ex.append(q, cardsRow, note);
    row.style.flexDirection = 'column';
    row.append(ex);
}

function startGameChronologie() {
    // Retours #79 puis #91 : 8 cartes déjà en colonne, on les réordonne
    // par GLISSER-DÉPOSER, on valide, les bonnes positions se
    // verrouillent en vert et les mauvaises restent en place (flash
    // rouge). Pas de défaite : le chrono départage.
    board.style.display = 'flex';
    board.style.flexDirection = 'column';
    board.style.alignItems = 'center';
    board.style.gap = '12px';

    const set = DATASETS[Math.floor(Math.random() * DATASETS.length)];
    const N = set.items.length;
    const sorted = [...set.items].sort((a, b) => a.valeur - b.valeur);

    // order[i] = item en position i ; locked[i] = position validée
    let order = [...set.items].sort(() => Math.random() - 0.5);
    if (order.every((it, i) => it === sorted[i])) order.reverse();
    const locked = new Array(N).fill(false);
    let essais = 0;
    let finished = false;

    const header = document.createElement('div');
    header.style.cssText = 'text-align:center;';
    header.innerHTML = `<div style="font-weight:900;color:#23262F;font-size:1.02rem;">${set.question}</div>` +
        `<div style="font-weight:bold;color:#8B90A0;font-size:.8rem;">Unité : ${set.unite} · glissez les cartes pour les réordonner</div>`;
    board.appendChild(header);

    const hud = document.createElement('div');
    hud.style.cssText = 'display:flex;gap:18px;justify-content:center;font-weight:bold;color:#8B90A0;font-size:.9rem;';
    board.appendChild(hud);

    const slotZone = document.createElement('div');
    slotZone.style.cssText = 'display:flex;flex-direction:column;gap:6px;align-items:stretch;width:300px;max-width:92vw;';
    board.appendChild(slotZone);

    const validateBtn = document.createElement('button');
    validateBtn.className = 'btn btn-plum';
    validateBtn.textContent = 'Valider mon ordre';
    board.appendChild(validateBtn);

    // ── Glisser-déposer (écouteurs sur document : la ligne d'origine
    //    est détruite par les re-rendus pendant le drag) ─────────────
    // dx/dy = point de saisie DANS la carte : le clone reste exactement
    // sous le doigt, sans décalage (retour #102)
    const drag = { item: null, insertIdx: -1, clone: null, dx: 0, dy: 0 };

    function unlockedPositions() {
        const p = [];
        for (let i = 0; i < N; i++) if (!locked[i]) p.push(i);
        return p;
    }

    // Position d'insertion parmi les positions non verrouillées, d'après Y
    function insertIdxFromY(y) {
        const free = unlockedPositions();
        let idx = 0;
        for (const i of free) {
            const line = slotZone.children[i];
            if (!line) continue;
            const r = line.getBoundingClientRect();
            if (y > r.top + r.height / 2) idx++;
        }
        return Math.min(idx, free.length - 1);
    }

    function onDragMove(e) {
        if (!drag.item) return;
        drag.clone.style.left = (e.clientX - drag.dx) + 'px';
        drag.clone.style.top = (e.clientY - drag.dy) + 'px';
        const idx = insertIdxFromY(e.clientY);
        if (idx !== drag.insertIdx) {
            drag.insertIdx = idx;
            render();
        }
    }

    function onDragEnd() {
        document.removeEventListener('pointermove', onDragMove);
        document.removeEventListener('pointerup', onDragEnd);
        document.removeEventListener('pointercancel', onDragEnd);
        if (!drag.item) return;
        if (drag.clone && drag.clone.parentNode) drag.clone.parentNode.removeChild(drag.clone);
        // Reconstruire l'ordre : les positions verrouillées gardent leur
        // carte, les libres reçoivent la séquence non-verrouillée avec
        // l'item glissé inséré à insertIdx.
        const seq = order.filter((it, i) => !locked[i] && it !== drag.item);
        seq.splice(drag.insertIdx, 0, drag.item);
        const next = new Array(N);
        let k = 0;
        for (let i = 0; i < N; i++) next[i] = locked[i] ? order[i] : seq[k++];
        order = next;
        drag.item = null;
        drag.clone = null;
        drag.insertIdx = -1;
        haptic(8);
        render();
    }

    function startDrag(item, e, sourceCard) {
        if (isPaused || finished || drag.item) return;
        drag.item = item;
        drag.insertIdx = insertIdxFromY(e.clientY);
        // Le clone reprend la taille et la position EXACTES de la carte
        // saisie, et suit le doigt depuis le point de saisie.
        const rect = sourceCard.getBoundingClientRect();
        drag.dx = e.clientX - rect.left;
        drag.dy = e.clientY - rect.top;
        const clone = _chronoCard(item.label, true);
        clone.style.position = 'fixed';
        clone.style.zIndex = '60';
        clone.style.boxSizing = 'border-box';
        clone.style.width = rect.width + 'px';
        clone.style.padding = '7px 12px';
        clone.style.left = rect.left + 'px';
        clone.style.top = rect.top + 'px';
        clone.style.pointerEvents = 'none';
        clone.style.borderColor = '#4A6CFA';
        clone.style.boxShadow = '0 8px 22px rgba(35,38,47,.25)';
        document.body.appendChild(clone);
        drag.clone = clone;
        haptic(8);
        document.addEventListener('pointermove', onDragMove);
        document.addEventListener('pointerup', onDragEnd);
        document.addEventListener('pointercancel', onDragEnd);
        render();
    }

    function render() {
        const lockedCount = locked.filter(Boolean).length;
        hud.innerHTML = `<span>Bien placées : <b style="color:#34B871">${lockedCount}/${N}</b></span>` +
            `<span>Essais : <b style="color:#4A6CFA">${essais}</b></span>`;

        // Ordre affiché pendant un drag : item retiré + trou en pointillés
        let display = order;
        let holeAt = -1;
        if (drag.item) {
            const seq = order.filter((it, i) => !locked[i] && it !== drag.item);
            seq.splice(drag.insertIdx, 0, null); // null = emplacement visé
            display = new Array(N);
            let k = 0;
            for (let i = 0; i < N; i++) display[i] = locked[i] ? order[i] : seq[k++];
            holeAt = display.indexOf(null);
        }

        slotZone.innerHTML = '';
        display.forEach((item, i) => {
            const line = document.createElement('div');
            line.style.cssText = 'display:flex;align-items:center;gap:8px;';
            const num = document.createElement('div');
            num.style.cssText = 'width:24px;height:24px;border-radius:50%;background:#EEF2FF;color:#3553D1;' +
                'font-weight:900;font-size:.76rem;display:flex;align-items:center;justify-content:center;flex-shrink:0;';
            num.textContent = i + 1;
            line.appendChild(num);

            if (i === holeAt) {
                const hole = document.createElement('div');
                hole.style.cssText = 'flex:1;height:40px;border:2px dashed #4A6CFA;border-radius:12px;background:#EEF2FF;';
                line.appendChild(hole);
            } else {
                const card = _chronoCard(item.label, true);
                card.style.flex = '1';
                card.style.padding = '7px 12px';
                card.style.touchAction = 'none';
                if (locked[i]) {
                    card.style.borderColor = '#34B871';
                    card._val.textContent = _chronoFmt(item.valeur, set.unite);
                    card._val.style.color = '#34B871';
                } else {
                    card.style.cursor = 'grab';
                    const it = item;
                    card.addEventListener('pointerdown', (e) => {
                        e.preventDefault();
                        startDrag(it, e, card);
                    });
                }
                line.appendChild(card);
            }
            slotZone.appendChild(line);
        });

        validateBtn.style.opacity = drag.item ? '.4' : '1';
        validateBtn.disabled = !!drag.item;
    }

    validateBtn.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        if (isPaused || finished || drag.item) return;
        essais++;
        let allGood = true;
        const wrongIdx = [];
        order.forEach((item, i) => {
            if (locked[i]) return;
            if (item.valeur === sorted[i].valeur && item.label === sorted[i].label) {
                locked[i] = true;
                haptic(8);
            } else {
                allGood = false;
                wrongIdx.push(i);
            }
        });
        if (allGood) {
            finished = true;
            render();
            endGame(`Chronologie reconstituée en ${essais} essai${essais > 1 ? 's' : ''} !`, true);
            return;
        }
        // Les mauvaises clignotent en rouge mais RESTENT en place :
        // on les réarrange en glissant.
        haptic(40);
        render();
        const lines = slotZone.children;
        wrongIdx.forEach(i => {
            const card = lines[i] && lines[i].children[1];
            if (card) {
                card.style.borderColor = '#E0533D';
                card.style.animation = 'wobble .3s';
            }
        });
        resultDisplay.textContent = `${wrongIdx.length} carte${wrongIdx.length > 1 ? 's' : ''} mal placée${wrongIdx.length > 1 ? 's' : ''} — réessayez !`;
        resultDisplay.style.color = '#E0533D';
        setTimeout(() => {
            if (isPaused || finished) return;
            resultDisplay.textContent = '';
            render();
        }, 900);
    });

    render();
}
