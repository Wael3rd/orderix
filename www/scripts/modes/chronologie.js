// ─── Mode : Chronologie ──────────────────────────────────────────
// Culture générale : composer son ordre sur 5 emplacements puis
// valider. Les bonnes positions se verrouillent en vert (valeur
// révélée), les autres reviennent dans la réserve. On recommence
// jusqu'au sans-faute. Données factuelles embarquées.

const DATASETS = [
    {
        question: 'Du plus ancien au plus récent', unite: 'année',
        items: [
            { label: 'Téléphone', valeur: 1876 },
            { label: 'Avion', valeur: 1903 },
            { label: 'Télévision', valeur: 1926 },
            { label: 'Four à micro-ondes', valeur: 1945 },
            { label: 'Smartphone tactile', valeur: 2007 }
        ]
    },
    {
        question: 'Du plus léger au plus lourd', unite: 'kg',
        items: [
            { label: 'Chat', valeur: 4 },
            { label: 'Loup', valeur: 40 },
            { label: 'Lion', valeur: 190 },
            { label: 'Cheval', valeur: 500 },
            { label: 'Éléphant d\'Afrique', valeur: 5000 }
        ]
    },
    {
        question: 'Du plus bas au plus haut', unite: 'm',
        items: [
            { label: 'Statue de la Liberté', valeur: 93 },
            { label: 'Grande Pyramide', valeur: 139 },
            { label: 'Tour Eiffel', valeur: 330 },
            { label: 'Empire State Building', valeur: 443 },
            { label: 'Burj Khalifa', valeur: 828 }
        ]
    },
    {
        question: 'Du moins élevé au plus élevé', unite: 'm',
        items: [
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
            { label: 'Seine', valeur: 777 },
            { label: 'Loire', valeur: 1006 },
            { label: 'Rhin', valeur: 1233 },
            { label: 'Danube', valeur: 2850 },
            { label: 'Nil', valeur: 6650 }
        ]
    },
    {
        question: 'De la plus petite à la plus grande', unite: 'km',
        items: [
            { label: 'Mercure', valeur: 4879 },
            { label: 'Mars', valeur: 6779 },
            { label: 'Vénus', valeur: 12104 },
            { label: 'Terre', valeur: 12742 },
            { label: 'Jupiter', valeur: 139820 }
        ]
    },
    {
        question: 'Du plus lent au plus rapide', unite: 'km/h',
        items: [
            { label: 'Poule', valeur: 14 },
            { label: 'Chat', valeur: 48 },
            { label: 'Lévrier', valeur: 72 },
            { label: 'Antilope', valeur: 88 },
            { label: 'Faucon pèlerin en piqué', valeur: 320 }
        ]
    },
    {
        question: 'De la vie la plus courte à la plus longue', unite: 'ans',
        items: [
            { label: 'Hamster', valeur: 3 },
            { label: 'Lapin', valeur: 9 },
            { label: 'Chien', valeur: 13 },
            { label: 'Cheval', valeur: 28 },
            { label: 'Tortue géante', valeur: 150 }
        ]
    },
    {
        question: 'Du moins peuplé au plus peuplé', unite: 'millions d\'habitants',
        items: [
            { label: 'Portugal', valeur: 10 },
            { label: 'France', valeur: 68 },
            { label: 'Japon', valeur: 124 },
            { label: 'États-Unis', valeur: 335 },
            { label: 'Inde', valeur: 1440 }
        ]
    },
    {
        question: 'Du plus ancien au plus récent', unite: 'année',
        items: [
            { label: 'Orgue', valeur: -250 },
            { label: 'Violon', valeur: 1550 },
            { label: 'Piano', valeur: 1700 },
            { label: 'Saxophone', valeur: 1846 },
            { label: 'Thérémine', valeur: 1920 }
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
    note.textContent = 'Placez les cartes puis validez — les bonnes se verrouillent';

    ex.append(q, cardsRow, note);
    row.style.flexDirection = 'column';
    row.append(ex);
}

function startGameChronologie() {
    // Retour #79 : on COMPOSE son ordre, on VALIDE, le jeu dit position
    // par position ce qui est juste (verrouillé en vert) et on réessaie
    // jusqu'à tout trouver. Pas de défaite : le chrono départage.
    board.style.display = 'flex';
    board.style.flexDirection = 'column';
    board.style.alignItems = 'center';
    board.style.gap = '12px';

    const set = DATASETS[Math.floor(Math.random() * DATASETS.length)];
    const sorted = [...set.items].sort((a, b) => a.valeur - b.valeur);
    const items = [...set.items].sort(() => Math.random() - 0.5);

    // slots[i] = item posé en position i (null si vide) ; locked[i] = validé
    const slots = [null, null, null, null, null];
    const locked = [false, false, false, false, false];
    let essais = 0;
    let finished = false;

    const header = document.createElement('div');
    header.style.cssText = 'text-align:center;';
    header.innerHTML = `<div style="font-weight:900;color:#23262F;font-size:1.02rem;">${set.question}</div>` +
        `<div style="font-weight:bold;color:#8B90A0;font-size:.8rem;">Unité : ${set.unite}</div>`;
    board.appendChild(header);

    const hud = document.createElement('div');
    hud.style.cssText = 'display:flex;gap:18px;justify-content:center;font-weight:bold;color:#8B90A0;font-size:.9rem;';
    board.appendChild(hud);

    const slotZone = document.createElement('div');
    slotZone.style.cssText = 'display:flex;flex-direction:column;gap:8px;align-items:stretch;min-width:250px;';
    board.appendChild(slotZone);

    const validateBtn = document.createElement('button');
    validateBtn.className = 'btn btn-plum';
    validateBtn.textContent = 'Valider mon ordre';
    board.appendChild(validateBtn);

    const poolZone = document.createElement('div');
    poolZone.style.cssText = 'display:flex;flex-wrap:wrap;gap:10px;justify-content:center;max-width:400px;';
    board.appendChild(poolZone);

    function inSlots(item) { return slots.indexOf(item) !== -1; }

    function render() {
        const lockedCount = locked.filter(Boolean).length;
        hud.innerHTML = `<span>Bien placées : <b style="color:#34B871">${lockedCount}/5</b></span>` +
            `<span>Essais : <b style="color:#4A6CFA">${essais}</b></span>`;

        slotZone.innerHTML = '';
        slots.forEach((item, i) => {
            const line = document.createElement('div');
            line.style.cssText = 'display:flex;align-items:center;gap:10px;';
            const num = document.createElement('div');
            num.style.cssText = 'width:26px;height:26px;border-radius:50%;background:#EEF2FF;color:#3553D1;' +
                'font-weight:900;font-size:.8rem;display:flex;align-items:center;justify-content:center;flex-shrink:0;';
            num.textContent = i + 1;
            line.appendChild(num);
            if (item) {
                const card = _chronoCard(item.label, false);
                card.style.flex = '1';
                if (locked[i]) {
                    card.style.borderColor = '#34B871';
                    card._val.textContent = _chronoFmt(item.valeur, set.unite);
                    card._val.style.color = '#34B871';
                } else {
                    card.style.cursor = 'pointer';
                    card.addEventListener('pointerdown', (e) => {
                        e.preventDefault();
                        if (isPaused || finished) return;
                        slots[i] = null; // renvoyer au réservoir
                        haptic(8);
                        render();
                    });
                }
                line.appendChild(card);
            } else {
                const empty = document.createElement('div');
                empty.style.cssText = 'flex:1;height:48px;border:2px dashed #C9D4FB;border-radius:12px;background:#F4F6FA;';
                line.appendChild(empty);
            }
            slotZone.appendChild(line);
        });

        poolZone.innerHTML = '';
        items.forEach(item => {
            if (inSlots(item)) return;
            const card = _chronoCard(item.label, true);
            card.style.cursor = 'pointer';
            card.addEventListener('pointerdown', (e) => {
                e.preventDefault();
                if (isPaused || finished) return;
                const free = slots.findIndex((s, k) => s === null && !locked[k]);
                if (free === -1) return;
                slots[free] = item;
                haptic(8);
                render();
            });
            poolZone.appendChild(card);
        });

        const full = slots.every(s => s !== null);
        validateBtn.style.opacity = full ? '1' : '.4';
        validateBtn.disabled = !full;
    }

    validateBtn.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        if (isPaused || finished || slots.some(s => s === null)) return;
        essais++;
        let allGood = true;
        const wrongIdx = [];
        slots.forEach((item, i) => {
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
        // Feedback : les mauvaises positions clignotent en rouge puis
        // retournent au réservoir, les bonnes restent verrouillées en vert
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
            wrongIdx.forEach(i => { slots[i] = null; });
            resultDisplay.textContent = '';
            render();
        }, 750);
    });

    render();
}
