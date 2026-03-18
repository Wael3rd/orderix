import { state } from './state.js';
import { dom } from './dom.js';
import {
    ROMAN_TABLE, MONTH_TABLE, PLANET_TABLE, EMOJI_TABLE, ANIMAL_TABLE,
    AGE_TABLE, WORD_TABLE, ALPHA_TABLE, DICE_PATTERNS
} from './config.js';

// ── Value generation ──
export function generateValues(type, count) {
    const FIXED = {
        dice:      [1,2,3,4,5,6],
        alphabet:  Array.from({length:26},(_,i)=>i+1),
        months:    Array.from({length:12},(_,i)=>i+1),
        planets:   Array.from({length:8}, (_,i)=>i+1),
        emojis:    Array.from({length:7}, (_,i)=>i+1),
        animals:   Array.from({length:20},(_,i)=>i+1),
        ages:      Array.from({length:8}, (_,i)=>i+1),
        rating:    [1,2,3,4,5],
        polygons:  [3,4,5,6,7,8,9,10],
        wordLength:[2,3,4,5,6,7,8,9,10,11,12],
        weights:   [1,5,10,25,50,100,200,500,1000,2000,5000,10000,20000,50000,100000],
        durations: [5,10,15,30,45,60,90,120,180,300,600,900,1800,3600,7200],
        mathMul:   [4,6,8,9,10,12,14,15,16,18,20,21,24,25,27,28,30,32,35,36],
    };
    if (FIXED[type]) {
        const list = FIXED[type];
        if (count >= list.length) return list.slice();
        let result = [];
        for (let i = 0; i < count; i++) {
            let v = list[Math.round(i * (list.length - 1) / (count - 1))];
            if (result.indexOf(v) === -1) result.push(v);
        }
        return result;
    }
    const R = {
        lightness:[15,85], saturation:[5,95], hue:[0,240], opacity:[0.1,1.0],
        scale:[0.3,1.0], length:[15,100], heightBar:[10,100], radius:[0,50],
        rotation:[0,170], blur:[0,8], borderWidth:[1,15], fontSize:[8,36],
        shadow:[0,20], centerDot:[4,36], lineLength:[8,55],
        thermometer:[5,95], battery:[5,100], clocks:[1,12], gauge:[10,170],
        compass:[0,330], yPosition:[5,55], wifi:[5,100], dots:[1,20], bars:[1,10],
        stars:[1,10], numbers:[2,99], roman:[1,30], mathAdd:[3,30],
        mathSub:[2,20], fractions:[5,90], binary:[1,31],
        stairs:[1,10], stack:[1,12], target:[1,8], pixels:[2,8],
        checkers:[2,16], stripes:[1,12],
    };
    const INT = 'clocks,dots,bars,stars,numbers,roman,mathAdd,mathSub,binary,stairs,stack,target,pixels,checkers,stripes,borderWidth,fontSize,centerDot,lineLength,shadow,gauge,compass,wifi'.split(',');
    const range = R[type];
    if (!range) return [];
    const isInt = INT.includes(type);
    let vals = [];
    for (let i = 0; i < count; i++) {
        let v = count === 1 ? range[0] : range[0] + i * (range[1] - range[0]) / (count - 1);
        vals.push(isInt ? Math.round(v) : parseFloat(v.toFixed(4)));
    }
    if (isInt) { let seen={}, u=[]; for(let k=0;k<vals.length;k++){if(!seen[vals[k]]){seen[vals[k]]=true;u.push(vals[k]);}} vals=u; }
    return vals;
}

// ── Rendering helpers ──
export function _setText(el, text, size, color) {
    el.style.cssText += `font-size:${size||14}px;color:${color||'white'};font-weight:bold;text-align:center;line-height:60px;`;
    el.textContent = text;
}
export function _fillText(el, count, char, color) {
    const c = document.createElement('div');
    c.style.cssText = `display:flex;flex-wrap:wrap;gap:1px;padding:3px;width:100%;height:100%;box-sizing:border-box;align-content:flex-start;justify-content:center;font-size:12px;line-height:1;color:${color}`;
    for(let i=0;i<count;i++){const s=document.createElement('span');s.textContent=char;c.appendChild(s);}
    el.appendChild(c);
}
export function _formatWeight(g) { return g >= 1000 ? (g/1000)+'kg' : g+'g'; }
export function _formatDuration(s) { return s >= 3600 ? (s/3600)+'h' : s >= 60 ? (s/60)+'min' : s+'s'; }

// ── applyStyle: renders an item element for a given type/value ──
export function applyStyle(el, type, val) {
    switch(type) {
    case 'lightness':   el.style.backgroundColor = `hsl(210,80%,${val}%)`; break;
    case 'saturation':  el.style.backgroundColor = `hsl(350,${val}%,50%)`; break;
    case 'hue':         el.style.backgroundColor = `hsl(${240-val},75%,50%)`; break;
    case 'opacity':     el.style.opacity = val; break;
    case 'scale':       el.style.transform = `scale(${val})`; break;
    case 'length':      el.style.width = `${val}px`; break;
    case 'heightBar':   el.style.height = `${val}px`; break;
    case 'radius':      el.style.borderRadius = `${val}%`; break;
    case 'rotation': {
        el.style.backgroundColor = 'transparent'; el.style.position = 'relative';
        const arr = document.createElement('div');
        arr.style.cssText = `position:absolute;top:50%;left:50%;width:4px;height:30px;background:#007bff;border-radius:2px;transform-origin:bottom center;transform:translate(-50%,-100%) rotate(${val}deg)`;
        const tip = document.createElement('div');
        tip.style.cssText = `position:absolute;top:50%;left:50%;width:0;height:0;border-left:8px solid transparent;border-right:8px solid transparent;border-bottom:12px solid #007bff;transform-origin:bottom center;transform:translate(-50%,-36px) rotate(${val}deg)`;
        el.appendChild(arr); el.appendChild(tip); break;
    }
    case 'blur':        el.style.filter = `blur(${val}px)`; break;
    case 'borderWidth': el.style.border = `${val}px solid #ffc107`; el.style.boxSizing = 'border-box'; break;
    case 'fontSize':    el.textContent = 'A'; el.style.fontSize = `${val}px`; el.style.color = 'white'; el.style.fontWeight = 'bold'; break;
    case 'shadow':      el.style.boxShadow = `0 ${val/2}px ${val}px rgba(0,0,0,0.6)`; break;
    case 'centerDot': {
        el.style.position = 'relative';
        const cd = document.createElement('div');
        cd.style.cssText = `position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);border-radius:50%;background:white;width:${val}px;height:${val}px`;
        el.appendChild(cd); break;
    }
    case 'lineLength': {
        el.style.position = 'relative';
        const ln = document.createElement('div');
        ln.style.cssText = `position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);height:4px;background:white;border-radius:2px;width:${val}px`;
        el.appendChild(ln); break;
    }
    case 'thermometer': {
        el.style.backgroundColor = 'transparent'; el.style.position = 'relative';
        const tWrap = document.createElement('div');
        tWrap.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;overflow:hidden;border-radius:0 0 8px 8px;background:#dee2e6;';
        const tube = document.createElement('div');
        tube.style.cssText = `position:absolute;bottom:0;left:30%;width:40%;background:linear-gradient(to top,#dc3545,#ff6b6b);border-radius:0 0 8px 8px;`;
        tube.style.height = val + '%';
        const bulb = document.createElement('div');
        bulb.style.cssText = 'position:absolute;bottom:-2px;left:50%;transform:translateX(-50%);width:18px;height:18px;background:#dc3545;border-radius:50%;';
        tWrap.appendChild(tube); tWrap.appendChild(bulb); el.appendChild(tWrap); break;
    }
    case 'battery': {
        el.style.backgroundColor = 'transparent'; el.style.position = 'relative';
        const shell = document.createElement('div');
        shell.style.cssText = 'position:absolute;top:12px;left:10px;width:40px;height:36px;border:3px solid #6c757d;border-radius:4px;overflow:hidden;';
        const cap = document.createElement('div');
        cap.style.cssText = 'position:absolute;top:16px;right:3px;width:6px;height:14px;background:#6c757d;border-radius:0 2px 2px 0;';
        const colors = ['#28a745','#ffc107','#dc3545'];
        const charge = document.createElement('div');
        charge.style.cssText = `position:absolute;bottom:0;left:0;width:100%;background:${colors[Math.floor(Math.random()*colors.length)]};`;
        charge.style.height = val + '%';
        shell.appendChild(charge); el.appendChild(shell); el.appendChild(cap); break;
    }
    case 'clocks': {
        el.style.backgroundColor = 'transparent'; el.style.position = 'relative';
        const face = document.createElement('div');
        face.style.cssText = 'position:absolute;top:5px;left:5px;width:50px;height:50px;border:3px solid #343a40;border-radius:50%;background:white;';
        const m12 = document.createElement('div');
        m12.style.cssText = 'position:absolute;top:2px;left:50%;transform:translateX(-50%);width:2px;height:6px;background:#343a40;';
        face.appendChild(m12);
        const hh = document.createElement('div');
        hh.style.cssText = `position:absolute;bottom:50%;left:50%;width:3px;height:15px;background:#343a40;border-radius:2px;transform-origin:bottom center;transform:translateX(-50%) rotate(${(val%12)*30}deg)`;
        face.appendChild(hh);
        const mh = document.createElement('div');
        mh.style.cssText = 'position:absolute;bottom:50%;left:50%;width:2px;height:20px;background:#6c757d;border-radius:2px;transform-origin:bottom center;transform:translateX(-50%) rotate(0deg)';
        face.appendChild(mh);
        const cdot = document.createElement('div');
        cdot.style.cssText = 'position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:4px;height:4px;background:#343a40;border-radius:50%';
        face.appendChild(cdot); el.appendChild(face); break;
    }
    case 'gauge': {
        el.style.backgroundColor = 'transparent'; el.style.position = 'relative';
        const arc = document.createElement('div');
        arc.style.cssText = 'position:absolute;top:12px;left:5px;width:50px;height:25px;border-top:4px solid #dee2e6;border-left:4px solid #dee2e6;border-right:4px solid #dee2e6;border-radius:30px 30px 0 0;box-sizing:border-box;';
        const needle = document.createElement('div');
        needle.style.cssText = `position:absolute;bottom:0;left:50%;width:2px;height:22px;background:#dc3545;border-radius:2px;transform-origin:bottom center;transform:translateX(-50%) rotate(${val-90}deg)`;
        arc.appendChild(needle); el.appendChild(arc); break;
    }
    case 'wifi': {
        el.style.backgroundColor = 'transparent'; el.style.position = 'relative';
        const maxBars = 5;
        for (let i = 0; i < maxBars; i++) {
            const b = document.createElement('div');
            const threshold = (i+1)*20;
            const on = val >= threshold;
            const partial = !on && val > threshold-20;
            const opacity = on ? 1 : (partial ? 0.3+0.7*((val-(threshold-20))/20) : 0.15);
            b.style.cssText = `position:absolute;bottom:8px;width:7px;background:#007bff;border-radius:2px;opacity:${opacity};`;
            b.style.left = (8+i*10)+'px'; b.style.height = (8+i*9)+'px';
            el.appendChild(b);
        }
        break;
    }
    case 'compass': {
        el.style.backgroundColor = 'transparent'; el.style.position = 'relative';
        const ring = document.createElement('div');
        ring.style.cssText = 'position:absolute;top:5px;left:5px;width:50px;height:50px;border:2px solid #6c757d;border-radius:50%;';
        const nMark = document.createElement('div');
        nMark.style.cssText = 'position:absolute;top:1px;left:50%;transform:translateX(-50%);font-size:8px;font-weight:bold;color:#dc3545;';
        nMark.textContent = 'N'; ring.appendChild(nMark);
        const ndl = document.createElement('div');
        ndl.style.cssText = `position:absolute;bottom:50%;left:50%;width:2px;height:18px;background:#dc3545;transform-origin:bottom center;transform:translateX(-50%) rotate(${val}deg);border-radius:2px;`;
        ring.appendChild(ndl);
        const ndl2 = document.createElement('div');
        ndl2.style.cssText = `position:absolute;top:50%;left:50%;width:2px;height:18px;background:#6c757d;transform-origin:top center;transform:translateX(-50%) rotate(${val}deg);border-radius:2px;`;
        ring.appendChild(ndl2); el.appendChild(ring); break;
    }
    case 'yPosition': {
        el.style.backgroundColor = '#dee2e6'; el.style.position = 'relative';
        const axis = document.createElement('div');
        axis.style.cssText = 'position:absolute;top:5px;left:50%;width:2px;height:50px;background:#adb5bd;transform:translateX(-50%)';
        const dot2 = document.createElement('div');
        dot2.style.cssText = `position:absolute;left:50%;transform:translate(-50%,50%);width:12px;height:12px;background:#007bff;border-radius:50%;bottom:${val}px`;
        el.appendChild(axis); el.appendChild(dot2); break;
    }
    case 'dots': {
        const cont = document.createElement('div'); cont.className = 'dots-container';
        for(let i=0;i<val;i++){const d=document.createElement('div');d.className='dot';cont.appendChild(d);}
        el.appendChild(cont); break;
    }
    case 'bars': {
        const cont2 = document.createElement('div');
        cont2.style.cssText = 'display:flex;gap:2px;align-items:flex-end;justify-content:center;width:100%;height:100%;padding:4px;box-sizing:border-box;';
        const bw = Math.max(2, Math.floor((52-val*2)/val));
        for(let i=0;i<val;i++){
            const b = document.createElement('div');
            b.style.cssText = `background:white;border-radius:1px;flex-shrink:0;width:${bw}px;height:${15+Math.round(((i*7+3)%11)*3)}px`;
            cont2.appendChild(b);
        }
        el.appendChild(cont2); break;
    }
    case 'stars':    _fillText(el, val, '\u2605', '#ffc107'); break;
    case 'numbers':  _setText(el, String(val), 22, 'white'); break;
    case 'roman':    _setText(el, ROMAN_TABLE[val]||val, val>10?12:16, 'white'); break;
    case 'dice': {
        el.style.backgroundColor='white';el.style.borderRadius='8px';el.style.border='2px solid #343a40';el.style.position='relative';
        const pips = DICE_PATTERNS[val]||[];
        pips.forEach(([r,c])=>{const p=document.createElement('div');p.style.cssText=`position:absolute;width:10px;height:10px;background:#343a40;border-radius:50%;top:${r*8+2}px;left:${c*8+2}px`;el.appendChild(p);});
        break;
    }
    case 'mathAdd': { const a1=Math.max(1,Math.floor(Math.random()*(val-1))+1); _setText(el,a1+'+'+(val-a1),14,'white'); break; }
    case 'mathMul': { let factors=[]; for(let f=1;f<=Math.sqrt(val);f++)if(val%f===0)factors.push(f); let a2=factors[Math.floor(Math.random()*factors.length)]; if(Math.random()>0.5)a2=val/a2; _setText(el,a2+'\u00d7'+(val/a2),14,'white'); break; }
    case 'mathSub': { const off=Math.floor(Math.random()*15)+1; _setText(el,(val+off)+'\u2212'+off,14,'white'); break; }
    case 'fractions': el.style.borderRadius='50%'; el.style.background=`conic-gradient(#28a745 0deg ${val*3.6}deg,#dee2e6 ${val*3.6}deg 360deg)`; break;
    case 'binary': {
        el.style.backgroundColor='#1a1a2e';el.style.display='flex';el.style.flexWrap='wrap';el.style.alignContent='center';el.style.justifyContent='center';el.style.gap='3px';el.style.padding='8px';
        const bits=val.toString(2).padStart(5,'0');
        for(let i=0;i<bits.length;i++){const bit=document.createElement('div');bit.style.cssText=`width:8px;height:8px;border-radius:50%;background:${bits[i]==='1'?'#00ff88':'#333'}`;el.appendChild(bit);}
        break;
    }
    case 'alphabet':   _setText(el, ALPHA_TABLE[val]||'?', 28, 'white'); break;
    case 'months':     _setText(el, MONTH_TABLE[val]||'?', 16, 'white'); break;
    case 'planets':    _setText(el, PLANET_TABLE[val]||'?', 24, 'white'); break;
    case 'animals':    _setText(el, ANIMAL_TABLE[val]||'?', 28, '#333'); el.style.backgroundColor='#f8f9fa'; break;
    case 'wordLength': _setText(el, WORD_TABLE[val]||'?', Math.max(8,18-val), 'white'); break;
    case 'weights':    _setText(el, _formatWeight(val), 12, 'white'); break;
    case 'durations':  _setText(el, _formatDuration(val), 12, 'white'); break;
    case 'emojis':     _setText(el, EMOJI_TABLE[val]||'?', 30, '#333'); el.style.backgroundColor='#f8f9fa'; break;
    case 'polygons': {
        el.style.backgroundColor='transparent';el.style.position='relative';
        const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
        svg.setAttribute('viewBox','0 0 60 60');svg.style.cssText='position:absolute;top:0;left:0;width:100%;height:100%;';
        let pts=[];
        for(let i=0;i<val;i++){const angle=(2*Math.PI*i/val)-Math.PI/2;pts.push(`${30+24*Math.cos(angle)},${30+24*Math.sin(angle)}`);}
        const poly=document.createElementNS('http://www.w3.org/2000/svg','polygon');
        poly.setAttribute('points',pts.join(' '));poly.setAttribute('fill','#007bff');poly.setAttribute('stroke','#0056b3');poly.setAttribute('stroke-width','2');
        svg.appendChild(poly);el.appendChild(svg);break;
    }
    case 'rating': {
        el.style.backgroundColor='#f8f9fa';let starStr='';
        for(let i=0;i<5;i++)starStr+=i<val?'\u2605':'\u2606';
        _setText(el,starStr,11,'#ffc107');el.style.lineHeight='60px';break;
    }
    case 'stairs': {
        el.style.backgroundColor='transparent';el.style.position='relative';
        const sWrap=document.createElement('div');sWrap.style.cssText='position:absolute;top:0;left:0;width:100%;height:100%;overflow:hidden;';
        const stepW=Math.floor(55/val);
        for(let i=0;i<val;i++){const step=document.createElement('div');const sh=(i+1)*Math.floor(55/val);step.style.cssText=`position:absolute;bottom:0;background:#007bff;left:${i*stepW+2}px;width:${Math.max(3,stepW-1)}px;height:${Math.min(58,sh)}px`;sWrap.appendChild(step);}
        el.appendChild(sWrap);break;
    }
    case 'stack': {
        el.style.backgroundColor='transparent';el.style.position='relative';
        const kWrap=document.createElement('div');kWrap.style.cssText='position:absolute;top:0;left:0;width:100%;height:100%;overflow:hidden;';
        const blockH=Math.min(12,Math.floor(56/val));
        for(let i=0;i<val;i++){const blk=document.createElement('div');blk.style.cssText=`position:absolute;left:10px;width:40px;background:hsl(${i*30},70%,50%);border-radius:2px;height:${blockH-1}px;bottom:${i*blockH+2}px`;kWrap.appendChild(blk);}
        el.appendChild(kWrap);break;
    }
    case 'checkers': {
        const cs=Math.max(3,Math.round(60/val));
        el.style.backgroundImage=`linear-gradient(45deg,#007bff 25%,transparent 25%),linear-gradient(-45deg,#007bff 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#007bff 75%),linear-gradient(-45deg,transparent 75%,#007bff 75%)`;
        el.style.backgroundSize=`${cs}px ${cs}px`;el.style.backgroundPosition=`0 0,0 ${cs/2}px,${cs/2}px -${cs/2}px,-${cs/2}px 0`;el.style.backgroundColor='#80bdff';break;
    }
    case 'stripes': { const sw=Math.max(2,Math.round(60/(val*2)));el.style.background=`repeating-linear-gradient(45deg,#007bff,#007bff ${sw}px,#0056b3 ${sw}px,#0056b3 ${sw*2}px)`;break; }
    case 'target': {
        el.style.backgroundColor='transparent';el.style.position='relative';
        for(let i=0;i<val;i++){const ring=document.createElement('div');const size=52-i*Math.floor(48/val);ring.style.cssText=`position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);border-radius:50%;border:2px solid ${i%2===0?'#dc3545':'#fff'};background:${i===val-1?(val%2===0?'#fff':'#dc3545'):'transparent'};box-sizing:border-box;width:${Math.max(6,size)}px;height:${Math.max(6,size)}px;`;el.appendChild(ring);}
        break;
    }
    case 'pixels': {
        el.style.backgroundColor='#dee2e6';el.style.display='grid';el.style.padding='2px';el.style.gap='1px';
        el.style.gridTemplateColumns=`repeat(${val},1fr)`;el.style.gridTemplateRows=`repeat(${val},1fr)`;
        for(let i=0;i<val*val;i++){const px=document.createElement('div');px.style.backgroundColor=((Math.floor(i/val)+i%val)%2===0)?'#007bff':'#28a745';px.style.borderRadius='1px';el.appendChild(px);}
        break;
    }
    case 'ages': _setText(el, AGE_TABLE[val]||'?', 30, '#333'); el.style.backgroundColor='#f8f9fa'; break;
    default: el.style.backgroundColor = '#6c757d';
    }
}

// ── Timer tick ──
export function gameTick() {
    if (state.isPaused) { state.lastTime = Date.now(); return; }
    const now = Date.now();
    state.timeElapsed += (now - state.lastTime);
    state.lastTime = now;
    dom.timerDisplay.textContent = (state.timeElapsed / 1000).toFixed(3);
}

// ── Badge renderer (for sort/sum modes) ──
export function renderBadges(mode) {
    document.querySelectorAll('.badge').forEach(b => b.remove());
    state.selectionOrder.forEach((item, index) => {
        const badge = document.createElement('div');
        badge.className = 'badge';
        badge.textContent = (mode && mode.isSort) ? (index + 1) : '';
        item.appendChild(badge);
    });
}

// ── Highlight correct solution on error ──
export function showSolutionHighlight(correctValues) {
    if (!correctValues || correctValues.length === 0) return;
    let valuesToHighlight = [...correctValues];
    document.querySelectorAll('#game-board .item').forEach(item => {
        const v = parseFloat(item.dataset.value);
        const idx = valuesToHighlight.findIndex(cv => Math.abs(cv - v) < 0.0001);
        if (idx !== -1) {
            item.classList.remove('error'); item.classList.remove('peek-hidden');
            item.style.boxShadow = '0 0 0 6px #28a745'; item.style.transform = 'scale(1.15)';
            item.style.zIndex = '100'; item.style.opacity = '1';
            valuesToHighlight.splice(idx, 1);
        } else {
            if (!item.classList.contains('error')) item.style.opacity = '0.3';
        }
    });
}
