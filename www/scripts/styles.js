// ─── Rendu visuel des 50 types (recoloré palette « papeterie ») ──
// Prune #4A6CFA · Sauge #34B871 · Terracotta #E0533D · Or #F5B227
function applyStyle(el, type, val) {
    switch (type) {

        // ── Perception visuelle (1-10) ──
        case 'lightness':
            el.style.backgroundColor = `hsl(226,70%,${val}%)`; break;
        case 'saturation':
            el.style.backgroundColor = `hsl(226,${val}%,52%)`; break;
        case 'hue':
            el.style.backgroundColor = `hsl(${240 - val},60%,52%)`; break;
        case 'opacity':
            el.style.opacity = val; break;
        case 'scale':
            el.style.transform = `scale(${val})`; break;
        case 'length':
            el.style.width = `${val}px`; break;
        case 'heightBar':
            el.style.height = `${val}px`; break;
        case 'radius':
            el.style.borderRadius = `${val}%`; break;
        case 'rotation':
            el.style.backgroundColor = 'transparent'; el.style.position = 'relative';
            const arr = document.createElement('div');
            arr.style.cssText = `position:absolute;top:50%;left:50%;width:4px;height:30px;background:#4A6CFA;border-radius:2px;transform-origin:bottom center;transform:translate(-50%,-100%) rotate(${val}deg)`;
            const tip = document.createElement('div');
            tip.style.cssText = `position:absolute;top:50%;left:50%;width:0;height:0;border-left:8px solid transparent;border-right:8px solid transparent;border-bottom:12px solid #4A6CFA;transform-origin:bottom center;transform:translate(-50%,-36px) rotate(${val}deg)`;
            el.appendChild(arr); el.appendChild(tip); break;
        case 'blur':
            el.style.filter = `blur(${val}px)`; break;

        // ── Épaisseurs (11-15) ──
        case 'borderWidth':
            el.style.border = `${val}px solid #F5B227`; el.style.boxSizing = 'border-box'; break;
        case 'fontSize':
            el.textContent = 'A'; el.style.fontSize = `${val}px`; el.style.color = 'white'; el.style.fontWeight = 'bold'; break;
        case 'shadow':
            el.style.boxShadow = `0 ${val / 2}px ${val}px rgba(53,42,51,0.6)`; break;
        case 'centerDot':
            el.style.position = 'relative';
            const cd = document.createElement('div');
            cd.style.cssText = `position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);border-radius:50%;background:white;width:${val}px;height:${val}px`;
            el.appendChild(cd); break;
        case 'lineLength':
            el.style.position = 'relative';
            const ln = document.createElement('div');
            ln.style.cssText = `position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);height:4px;background:white;border-radius:2px;width:${val}px`;
            el.appendChild(ln); break;

        // ── Jauges & instruments (16-22) ──
        case 'thermometer': {
            el.style.backgroundColor = 'transparent'; el.style.position = 'relative';
            const tWrap = document.createElement('div');
            tWrap.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;overflow:hidden;border-radius:0 0 8px 8px;background:#E8EAF1;';
            const tube = document.createElement('div');
            tube.style.cssText = `position:absolute;bottom:0;left:30%;width:40%;background:linear-gradient(to top,#E0533D,#F08A78);border-radius:0 0 8px 8px;`;
            tube.style.height = val + '%';
            const bulb = document.createElement('div');
            bulb.style.cssText = `position:absolute;bottom:-2px;left:50%;transform:translateX(-50%);width:18px;height:18px;background:#E0533D;border-radius:50%;`;
            tWrap.appendChild(tube); tWrap.appendChild(bulb);
            el.appendChild(tWrap); break;
        }
        case 'battery': {
            el.style.backgroundColor = 'transparent'; el.style.position = 'relative';
            const shell = document.createElement('div');
            shell.style.cssText = 'position:absolute;top:12px;left:10px;width:40px;height:36px;border:3px solid #8B90A0;border-radius:4px;overflow:hidden;';
            const cap = document.createElement('div');
            cap.style.cssText = 'position:absolute;top:16px;right:3px;width:6px;height:14px;background:#8B90A0;border-radius:0 2px 2px 0;';
            const charge = document.createElement('div');
            // La couleur est aléatoire et indépendante du remplissage (c'est le niveau qui compte)
            const colors = ['#34B871', '#F5B227', '#E0533D'];
            const randomColor = colors[Math.floor(Math.random() * colors.length)];
            charge.style.cssText = `position:absolute;bottom:0;left:0;width:100%;background:${randomColor};`;
            charge.style.height = val + '%';
            shell.appendChild(charge); el.appendChild(shell); el.appendChild(cap); break;
        }
        case 'clocks': {
            el.style.backgroundColor = 'transparent'; el.style.position = 'relative';
            const face = document.createElement('div');
            face.style.cssText = 'position:absolute;top:5px;left:5px;width:50px;height:50px;border:3px solid #23262F;border-radius:50%;background:white;';
            const m12 = document.createElement('div');
            m12.style.cssText = 'position:absolute;top:2px;left:50%;transform:translateX(-50%);width:2px;height:6px;background:#23262F;';
            face.appendChild(m12);
            const hourAngle = (val % 12) * 30;
            const hh = document.createElement('div');
            hh.style.cssText = `position:absolute;bottom:50%;left:50%;width:3px;height:15px;background:#23262F;border-radius:2px;transform-origin:bottom center;transform:translateX(-50%) rotate(${hourAngle}deg)`;
            face.appendChild(hh);
            const mh = document.createElement('div');
            mh.style.cssText = 'position:absolute;bottom:50%;left:50%;width:2px;height:20px;background:#8B90A0;border-radius:2px;transform-origin:bottom center;transform:translateX(-50%) rotate(0deg)';
            face.appendChild(mh);
            const cdot = document.createElement('div');
            cdot.style.cssText = 'position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:4px;height:4px;background:#23262F;border-radius:50%';
            face.appendChild(cdot);
            el.appendChild(face); break;
        }
        case 'gauge': {
            el.style.backgroundColor = 'transparent'; el.style.position = 'relative';
            const arc = document.createElement('div');
            arc.style.cssText = 'position:absolute;top:12px;left:5px;width:50px;height:25px;border-top:4px solid #E8EAF1;border-left:4px solid #E8EAF1;border-right:4px solid #E8EAF1;border-radius:30px 30px 0 0;box-sizing:border-box;';
            const needle = document.createElement('div');
            needle.style.cssText = `position:absolute;bottom:0;left:50%;width:2px;height:22px;background:#E0533D;border-radius:2px;transform-origin:bottom center;transform:translateX(-50%) rotate(${val - 90}deg)`;
            arc.appendChild(needle);
            el.appendChild(arc); break;
        }
        case 'wifi': {
            el.style.backgroundColor = 'transparent'; el.style.position = 'relative';
            const maxBars = 5;
            for (let i = 0; i < maxBars; i++) {
                const b = document.createElement('div');
                const bh = 8 + i * 9;
                const threshold = (i + 1) * 20;
                const on = val >= threshold;
                const partial = !on && val > threshold - 20;
                const opacity = on ? 1 : (partial ? 0.3 + 0.7 * ((val - (threshold - 20)) / 20) : 0.15);
                b.style.cssText = `position:absolute;bottom:8px;width:7px;background:#4A6CFA;border-radius:2px;opacity:${opacity};`;
                b.style.left = (8 + i * 10) + 'px';
                b.style.height = bh + 'px';
                el.appendChild(b);
            }
            break;
        }
        case 'compass': {
            el.style.backgroundColor = 'transparent'; el.style.position = 'relative';
            const ring = document.createElement('div');
            ring.style.cssText = 'position:absolute;top:5px;left:5px;width:50px;height:50px;border:2px solid #8B90A0;border-radius:50%;';
            const nMark = document.createElement('div');
            nMark.style.cssText = 'position:absolute;top:1px;left:50%;transform:translateX(-50%);font-size:8px;font-weight:bold;color:#E0533D;';
            nMark.textContent = 'N';
            ring.appendChild(nMark);
            const ndl = document.createElement('div');
            ndl.style.cssText = `position:absolute;bottom:50%;left:50%;width:2px;height:18px;background:#E0533D;transform-origin:bottom center;transform:translateX(-50%) rotate(${val}deg);border-radius:2px;`;
            ring.appendChild(ndl);
            const ndl2 = document.createElement('div');
            ndl2.style.cssText = `position:absolute;top:50%;left:50%;width:2px;height:18px;background:#8B90A0;transform-origin:top center;transform:translateX(-50%) rotate(${val}deg);border-radius:2px;`;
            ring.appendChild(ndl2);
            el.appendChild(ring); break;
        }
        case 'yPosition': {
            el.style.backgroundColor = '#E8EAF1'; el.style.position = 'relative';
            const axis = document.createElement('div');
            axis.style.cssText = 'position:absolute;top:5px;left:50%;width:2px;height:50px;background:#9AA0AE;transform:translateX(-50%)';
            const dot2 = document.createElement('div');
            dot2.style.cssText = `position:absolute;left:50%;transform:translate(-50%,50%);width:12px;height:12px;background:#4A6CFA;border-radius:50%;bottom:${val}px`;
            el.appendChild(axis); el.appendChild(dot2); break;
        }

        // ── Comptage (23-25) ──
        case 'dots': {
            const cont = document.createElement('div'); cont.className = 'dots-container';
            for (let i = 0; i < val; i++) { const d = document.createElement('div'); d.className = 'dot'; cont.appendChild(d); }
            el.appendChild(cont); break;
        }
        case 'bars': {
            const cont2 = document.createElement('div');
            cont2.style.cssText = 'display:flex;gap:2px;align-items:flex-end;justify-content:center;width:100%;height:100%;padding:4px;box-sizing:border-box;';
            const bw = Math.max(2, Math.floor((52 - val * 2) / val));
            for (let i = 0; i < val; i++) {
                const b = document.createElement('div');
                b.style.cssText = `background:white;border-radius:1px;flex-shrink:0;width:${bw}px;height:${15 + Math.round(((i * 7 + 3) % 11) * 3)}px`;
                cont2.appendChild(b);
            }
            el.appendChild(cont2); break;
        }
        case 'stars':
            _fillText(el, val, '★', '#F5B227'); break;

        // ── Nombres & calcul mental (26-33) ──
        case 'numbers':
            _setText(el, String(val), 22, 'white'); break;
        case 'roman':
            _setText(el, ROMAN_TABLE[val] || val, val > 10 ? 12 : 16, 'white'); break;
        case 'dice': {
            el.style.backgroundColor = 'white'; el.style.borderRadius = '8px'; el.style.border = '2px solid #23262F'; el.style.position = 'relative';
            const pips = DICE_PATTERNS[val] || [];
            pips.forEach(([r, c]) => {
                const p = document.createElement('div');
                p.style.cssText = `position:absolute;width:10px;height:10px;background:#23262F;border-radius:50%;`;
                p.style.top = (r * 8 + 2) + 'px';
                p.style.left = (c * 8 + 2) + 'px';
                el.appendChild(p);
            });
            break;
        }
        case 'mathAdd': {
            const a1 = Math.max(1, Math.floor(Math.random() * (val - 1)) + 1);
            const b1 = val - a1;
            _setText(el, a1 + '+' + b1, 14, 'white'); break;
        }
        case 'mathMul': {
            let factors = [];
            for (let f = 1; f <= Math.sqrt(val); f++) if (val % f === 0) factors.push(f);
            let a2 = factors[Math.floor(Math.random() * factors.length)];
            if (Math.random() > 0.5) a2 = val / a2;
            _setText(el, a2 + '×' + (val / a2), 14, 'white'); break;
        }
        case 'mathSub': {
            const offset = Math.floor(Math.random() * 15) + 1;
            _setText(el, (val + offset) + '−' + offset, 14, 'white'); break;
        }
        case 'fractions': {
            el.style.borderRadius = '50%';
            el.style.background = `conic-gradient(#34B871 0deg ${val * 3.6}deg, #E8EAF1 ${val * 3.6}deg 360deg)`;
            break;
        }
        case 'binary': {
            el.style.backgroundColor = '#1E2430'; el.style.display = 'flex'; el.style.flexWrap = 'wrap';
            el.style.alignContent = 'center'; el.style.justifyContent = 'center'; el.style.gap = '3px'; el.style.padding = '8px';
            const bits = val.toString(2).padStart(5, '0');
            for (let i = 0; i < bits.length; i++) {
                const bit = document.createElement('div');
                bit.style.cssText = `width:8px;height:8px;border-radius:50%;background:${bits[i] === '1' ? '#A8E6BD' : '#3A4252'}`;
                el.appendChild(bit);
            }
            break;
        }

        // ── Connaissances & texte (34-40) ──
        case 'alphabet':
            _setText(el, ALPHA_TABLE[val] || '?', 28, 'white'); break;
        case 'months':
            _setText(el, MONTH_TABLE[val] || '?', 16, 'white'); break;
        case 'planets':
            _setText(el, PLANET_TABLE[val] || '?', 24, 'white'); break;
        case 'animals':
            _setText(el, ANIMAL_TABLE[val] || '?', 28, '#23262F');
            el.style.backgroundColor = '#F4F6FA'; break;
        case 'wordLength':
            _setText(el, WORD_TABLE[val] || '?', Math.max(8, 18 - val), 'white'); break;
        case 'weights':
            _setText(el, _formatWeight(val), 12, 'white'); break;
        case 'durations':
            _setText(el, _formatDuration(val), 12, 'white'); break;

        // ── Créatif & motifs (41-50) ──
        case 'emojis':
            _setText(el, EMOJI_TABLE[val] || '?', 30, '#23262F');
            el.style.backgroundColor = '#F4F6FA'; break;
        case 'polygons': {
            el.style.backgroundColor = 'transparent'; el.style.position = 'relative';
            const n = val;
            const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            svg.setAttribute('viewBox', '0 0 60 60');
            svg.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;';
            let pts = [];
            for (let i = 0; i < n; i++) {
                const angle = (2 * Math.PI * i / n) - Math.PI / 2;
                pts.push(`${30 + 24 * Math.cos(angle)},${30 + 24 * Math.sin(angle)}`);
            }
            const poly = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
            poly.setAttribute('points', pts.join(' '));
            poly.setAttribute('fill', '#4A6CFA');
            poly.setAttribute('stroke', '#3553D1');
            poly.setAttribute('stroke-width', '2');
            svg.appendChild(poly);
            el.appendChild(svg); break;
        }
        case 'rating': {
            el.style.backgroundColor = '#F4F6FA';
            let starStr = '';
            for (let i = 0; i < 5; i++) starStr += i < val ? '★' : '☆';
            _setText(el, starStr, 11, '#F5B227');
            el.style.lineHeight = '60px'; break;
        }
        case 'stairs': {
            el.style.backgroundColor = 'transparent'; el.style.position = 'relative';
            const sWrap = document.createElement('div');
            sWrap.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;overflow:hidden;';
            const stepW = Math.floor(55 / val);
            for (let i = 0; i < val; i++) {
                const step = document.createElement('div');
                const sh = (i + 1) * Math.floor(55 / val);
                step.style.cssText = `position:absolute;bottom:0;background:#4A6CFA;`;
                step.style.left = (i * stepW + 2) + 'px';
                step.style.width = Math.max(3, stepW - 1) + 'px';
                step.style.height = Math.min(58, sh) + 'px';
                sWrap.appendChild(step);
            }
            el.appendChild(sWrap);
            break;
        }
        case 'stack': {
            el.style.backgroundColor = 'transparent'; el.style.position = 'relative';
            const kWrap = document.createElement('div');
            kWrap.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;overflow:hidden;';
            const blockH = Math.min(12, Math.floor(56 / val));
            for (let i = 0; i < val; i++) {
                const blk = document.createElement('div');
                blk.style.cssText = `position:absolute;left:10px;width:40px;background:hsl(${i * 30},45%,55%);border-radius:2px;`;
                blk.style.height = (blockH - 1) + 'px';
                blk.style.bottom = (i * blockH + 2) + 'px';
                kWrap.appendChild(blk);
            }
            el.appendChild(kWrap);
            break;
        }
        case 'checkers': {
            const cs = Math.max(3, Math.round(60 / val));
            el.style.backgroundImage = `linear-gradient(45deg,#4A6CFA 25%,transparent 25%),linear-gradient(-45deg,#4A6CFA 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#4A6CFA 75%),linear-gradient(-45deg,transparent 75%,#4A6CFA 75%)`;
            el.style.backgroundSize = `${cs}px ${cs}px`;
            el.style.backgroundPosition = `0 0,0 ${cs / 2}px,${cs / 2}px -${cs / 2}px,-${cs / 2}px 0`;
            el.style.backgroundColor = '#C9D4FD'; break;
        }
        case 'stripes': {
            const sw = Math.max(2, Math.round(60 / (val * 2)));
            el.style.background = `repeating-linear-gradient(45deg,#4A6CFA,#4A6CFA ${sw}px,#3553D1 ${sw}px,#3553D1 ${sw * 2}px)`;
            break;
        }
        case 'target': {
            el.style.backgroundColor = 'transparent'; el.style.position = 'relative';
            for (let i = 0; i < val; i++) {
                const ring = document.createElement('div');
                const size = 52 - i * Math.floor(48 / (val));
                ring.style.cssText = `position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);border-radius:50%;border:2px solid ${i % 2 === 0 ? '#E0533D' : '#fff'};background:${i === val - 1 ? (val % 2 === 0 ? '#fff' : '#E0533D') : 'transparent'};box-sizing:border-box;`;
                ring.style.width = Math.max(6, size) + 'px';
                ring.style.height = Math.max(6, size) + 'px';
                el.appendChild(ring);
            }
            break;
        }
        case 'pixels': {
            el.style.backgroundColor = '#E8EAF1'; el.style.display = 'grid'; el.style.padding = '2px'; el.style.gap = '1px';
            el.style.gridTemplateColumns = `repeat(${val}, 1fr)`;
            el.style.gridTemplateRows = `repeat(${val}, 1fr)`;
            for (let i = 0; i < val * val; i++) {
                const px = document.createElement('div');
                px.style.backgroundColor = ((Math.floor(i / val) + i % val) % 2 === 0) ? '#4A6CFA' : '#34B871';
                px.style.borderRadius = '1px';
                el.appendChild(px);
            }
            break;
        }
        case 'ages':
            _setText(el, AGE_TABLE[val] || '?', 30, '#23262F');
            el.style.backgroundColor = '#F4F6FA'; break;

        default:
            el.style.backgroundColor = '#8B90A0';
    }
}
