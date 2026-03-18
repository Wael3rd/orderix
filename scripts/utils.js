const ROMAN_TABLE = ['','I','II','III','IV','V','VI','VII','VIII','IX','X','XI','XII','XIII','XIV','XV','XVI','XVII','XVIII','XIX','XX','XXI','XXII','XXIII','XXIV','XXV','XXVI','XXVII','XXVIII','XXIX','XXX'];
const MONTH_TABLE = ['','Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc'];
const PLANET_TABLE = ['','☿','♀','⊕','♂','♃','♄','⛢','♆'];
const EMOJI_TABLE = ['','😢','😕','😐','🙂','😊','😄','🤩'];
const ANIMAL_TABLE = ['','🐜','🐌','🐁','🐀','🐸','🐇','🐈','🐕','🐖','🦊','🐑','🐄','🐎','🐻','🦁','🐊','🦏','🐘','🐋','🦕'];
const AGE_TABLE = ['','👶','🧒','👦','🧑','👨','🧔','👨‍🦳','👴'];
const WORD_TABLE = {2:'si',3:'eau',4:'lune',5:'avion',6:'jardin',7:'château',8:'papillon',9:'crocodile',10:'ordinateur',11:'trampoline',12:'hippopotame'};
const ALPHA_TABLE = ' ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const DICE_PATTERNS = { 1:[[3,3]], 2:[[1,1],[5,5]], 3:[[1,1],[3,3],[5,5]], 4:[[1,1],[1,5],[5,1],[5,5]], 5:[[1,1],[1,5],[3,3],[5,1],[5,5]], 6:[[1,1],[1,3],[1,5],[5,1],[5,3],[5,5]] };

function _setText(el, text, size, color) {
    el.style.cssText += `font-size:${size||14}px;color:${color||'white'};font-weight:bold;text-align:center;line-height:60px;`;
    el.textContent = text;
}

function _fillText(el, count, char, color) {
    const c = document.createElement('div');
    c.style.cssText = `display:flex;flex-wrap:wrap;gap:1px;padding:3px;width:100%;height:100%;box-sizing:border-box;align-content:flex-start;justify-content:center;font-size:12px;line-height:1;color:${color}`;
    for(let i=0;i<count;i++){const s=document.createElement('span');s.textContent=char;c.appendChild(s);}
    el.appendChild(c);
}

function _formatWeight(g) {
    if (g >= 1000) return (g/1000) + 'kg';
    return g + 'g';
}

function _formatDuration(s) {
    if (s >= 3600) return (s/3600) + 'h';
    if (s >= 60) return (s/60) + 'min';
    return s + 's';
}

function showSolutionHighlight(correctValues) {
    if (!correctValues || correctValues.length === 0) return;
    const domItems = document.querySelectorAll('#game-board .item');
    
    // Copie locale pour gérer les cas de doublons (ex: additions cibles)
    let valuesToHighlight = [...correctValues]; 

    domItems.forEach(item => {
        const v = parseFloat(item.dataset.value);
        const idx = valuesToHighlight.findIndex(cv => Math.abs(cv - v) < 0.0001);
        
        if (idx !== -1) {
            // C'est une bonne réponse ! On la met en évidence.
            item.classList.remove('error');
            item.classList.remove('peek-hidden'); 
            item.style.boxShadow = '0 0 0 6px #28a745'; 
            item.style.transform = 'scale(1.15)'; 
            item.style.zIndex = '100';
            item.style.opacity = '1';
            // Retire la valeur trouvée pour ne pas surligner d'autres copies non nécessaires
            valuesToHighlight.splice(idx, 1); 
        } else {
            // C'est une mauvaise réponse. Si ce n'est pas celle cliquée, on l'assombrit.
            if (!item.classList.contains('error')) {
                item.style.opacity = '0.3'; 
            }
        }
    });
}
