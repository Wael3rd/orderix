// =====================================================================
// Generators: generateValues + applyStyle for all 50 challenge types
// =====================================================================

function generateValues(type, count) {
    var day = null;
    for (var i = 0; i < DAYS.length; i++) {
        if (DAYS[i].type === type) { day = DAYS[i]; break; }
    }
    if (!day) return [];

    var min = day.range[0], max = day.range[1];
    var vals = [];
    for (var j = 0; j < count; j++) {
        var v = count === 1 ? min : min + j * (max - min) / (count - 1);
        vals.push(day.integer ? Math.round(v) : parseFloat(v.toFixed(4)));
    }
    // Deduplicate integers (if range too small for count)
    if (day.integer) {
        var seen = {};
        var unique = [];
        for (var k = 0; k < vals.length; k++) {
            if (!seen[vals[k]]) { seen[vals[k]] = true; unique.push(vals[k]); }
        }
        vals = unique;
    }
    return vals;
}

function applyStyle(el, type, val) {
    switch (type) {

        // ── Couleurs & Lumière ──
        case 'lightness':
            el.style.backgroundColor = 'hsl(210,80%,' + val + '%)';
            break;
        case 'saturation':
            el.style.backgroundColor = 'hsl(350,' + val + '%,50%)';
            break;
        case 'hue':
            el.style.backgroundColor = 'hsl(' + val + ',75%,50%)';
            break;
        case 'red':
            el.style.backgroundColor = 'rgb(' + val + ',40,40)';
            break;
        case 'green':
            el.style.backgroundColor = 'rgb(40,' + val + ',40)';
            break;
        case 'blue':
            el.style.backgroundColor = 'rgb(40,40,' + val + ')';
            break;
        case 'warm':
            el.style.backgroundColor = 'hsl(' + val + ',80%,50%)';
            break;
        case 'opacity':
            el.style.opacity = val;
            break;
        case 'gradient':
            el.style.background = 'linear-gradient(to bottom, #007bff ' + val + '%, #ffffff ' + val + '%)';
            break;
        case 'bicolor':
            el.style.background = 'linear-gradient(to right, #007bff ' + val + '%, #28a745 ' + val + '%)';
            break;

        // ── Tailles & Dimensions ──
        case 'width':
            el.style.width = val + 'px';
            break;
        case 'height':
            el.style.height = val + 'px';
            break;
        case 'scale':
            el.style.transform = 'scale(' + val + ')';
            break;
        case 'fontSize':
            el.textContent = 'A';
            el.style.fontSize = val + 'px';
            el.style.color = 'white';
            el.style.fontWeight = 'bold';
            break;
        case 'borderWidth':
            el.style.border = val + 'px solid #ffc107';
            el.style.boxSizing = 'border-box';
            break;
        case 'padding':
            el.style.padding = val + 'px';
            el.style.boxSizing = 'border-box';
            var inner = document.createElement('div');
            inner.style.width = '100%';
            inner.style.height = '100%';
            inner.style.backgroundColor = '#ffc107';
            inner.style.borderRadius = '2px';
            el.style.backgroundColor = '#007bff';
            el.appendChild(inner);
            break;
        case 'fill':
            el.style.backgroundColor = '#dee2e6';
            el.style.position = 'relative';
            el.style.overflow = 'hidden';
            var bar = document.createElement('div');
            bar.style.cssText = 'position:absolute;bottom:0;left:0;width:100%;background:#007bff;';
            bar.style.height = val + '%';
            el.appendChild(bar);
            break;
        case 'centerDot':
            el.style.position = 'relative';
            var dot = document.createElement('div');
            dot.style.cssText = 'position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);border-radius:50%;background:white;';
            dot.style.width = val + 'px';
            dot.style.height = val + 'px';
            el.appendChild(dot);
            break;
        case 'lineLength':
            el.style.position = 'relative';
            var ln = document.createElement('div');
            ln.style.cssText = 'position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);height:4px;background:white;border-radius:2px;';
            ln.style.width = val + 'px';
            el.appendChild(ln);
            break;
        case 'lineWidth':
            el.style.position = 'relative';
            var lw = document.createElement('div');
            lw.style.cssText = 'position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:40px;background:white;border-radius:2px;';
            lw.style.height = val + 'px';
            el.appendChild(lw);
            break;

        // ── Formes & Géométrie ──
        case 'radius':
            el.style.borderRadius = val + '%';
            break;
        case 'rotation':
            el.style.transform = 'rotate(' + val + 'deg)';
            break;
        case 'skew':
            el.style.transform = 'skewX(' + val + 'deg)';
            break;
        case 'pie':
            el.style.borderRadius = '50%';
            el.style.background = 'conic-gradient(#28a745 0deg ' + val + 'deg, #dee2e6 ' + val + 'deg 360deg)';
            break;
        case 'ringThick':
            el.style.backgroundColor = 'transparent';
            el.style.border = val + 'px solid #007bff';
            el.style.borderRadius = '50%';
            el.style.boxSizing = 'border-box';
            break;
        case 'inset':
            el.style.position = 'relative';
            el.style.backgroundColor = '#dee2e6';
            var ins = document.createElement('div');
            ins.style.cssText = 'position:absolute;background:#007bff;border-radius:3px;';
            ins.style.top = val + 'px';
            ins.style.left = val + 'px';
            ins.style.right = val + 'px';
            ins.style.bottom = val + 'px';
            el.appendChild(ins);
            break;
        case 'diamond':
            el.style.backgroundColor = 'transparent';
            el.style.overflow = 'hidden';
            var diam = document.createElement('div');
            diam.style.cssText = 'position:absolute;top:50%;left:50%;width:40px;background:#007bff;transform:translate(-50%,-50%) rotate(45deg);';
            diam.style.height = val + 'px';
            el.style.position = 'relative';
            el.appendChild(diam);
            break;
        case 'crossWidth':
            el.style.backgroundColor = 'transparent';
            el.style.position = 'relative';
            var ch = document.createElement('div');
            ch.style.cssText = 'position:absolute;top:0;left:50%;transform:translateX(-50%);height:100%;background:#007bff;border-radius:2px;';
            ch.style.width = val + 'px';
            var cv = document.createElement('div');
            cv.style.cssText = 'position:absolute;left:0;top:50%;transform:translateY(-50%);width:100%;background:#007bff;border-radius:2px;';
            cv.style.height = val + 'px';
            el.appendChild(ch);
            el.appendChild(cv);
            break;
        case 'arrow':
            el.style.backgroundColor = 'transparent';
            el.style.position = 'relative';
            el.style.overflow = 'hidden';
            var arr = document.createElement('div');
            arr.style.cssText = 'position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:0;height:0;border-style:solid;';
            arr.style.borderWidth = '0 ' + (val / 2) + 'px ' + val + 'px ' + (val / 2) + 'px';
            arr.style.borderColor = 'transparent transparent #007bff transparent';
            el.appendChild(arr);
            break;
        case 'starSize':
            el.style.backgroundColor = 'transparent';
            el.style.fontSize = val + 'px';
            el.style.color = '#ffc107';
            el.textContent = '★';
            break;

        // ── Comptage ──
        case 'dots':
            _fillSymbols(el, val, 'dot');
            break;
        case 'bars':
            _fillBars(el, val);
            break;
        case 'stars':
            _fillText(el, val, '★', '#ffc107');
            break;
        case 'hearts':
            _fillText(el, val, '♥', '#dc3545');
            break;
        case 'rings':
            _fillRings(el, val);
            break;
        case 'blocks':
            _fillSymbols(el, val, 'block');
            break;
        case 'lines':
            _fillLines(el, val);
            break;
        case 'triangles':
            _fillText(el, val, '▲', '#28a745');
            break;
        case 'diamonds':
            _fillText(el, val, '◆', '#6f42c1');
            break;
        case 'crosses':
            _fillText(el, val, '✚', '#fd7e14');
            break;

        // ── Effets & Filtres ──
        case 'blur':
            el.style.filter = 'blur(' + val + 'px)';
            break;
        case 'brightness':
            el.style.filter = 'brightness(' + val + ')';
            break;
        case 'sepia':
            el.style.filter = 'sepia(' + val + ')';
            break;
        case 'grayscale':
            el.style.backgroundColor = 'hsl(0, 80%, 50%)';
            el.style.filter = 'grayscale(' + val + ')';
            break;
        case 'contrast':
            el.style.background = 'linear-gradient(135deg, #007bff 50%, #6c757d 50%)';
            el.style.filter = 'contrast(' + val + ')';
            break;
        case 'shadow':
            el.style.boxShadow = '0 ' + (val / 2) + 'px ' + val + 'px rgba(0,0,0,0.6)';
            break;
        case 'insetShadow':
            el.style.boxShadow = 'inset 0 0 ' + val + 'px rgba(0,0,0,0.7)';
            break;
        case 'glow':
            el.style.boxShadow = '0 0 ' + val + 'px ' + (val / 2) + 'px rgba(0,123,255,0.7)';
            break;
        case 'stripes':
            var sw = Math.max(2, Math.round(60 / (val * 2)));
            el.style.background = 'repeating-linear-gradient(45deg, #007bff, #007bff ' + sw + 'px, #0056b3 ' + sw + 'px, #0056b3 ' + (sw * 2) + 'px)';
            break;
        case 'checkers':
            var cs = val;
            el.style.backgroundImage =
                'linear-gradient(45deg, #007bff 25%, transparent 25%), ' +
                'linear-gradient(-45deg, #007bff 25%, transparent 25%), ' +
                'linear-gradient(45deg, transparent 75%, #007bff 75%), ' +
                'linear-gradient(-45deg, transparent 75%, #007bff 75%)';
            el.style.backgroundSize = cs + 'px ' + cs + 'px';
            el.style.backgroundPosition = '0 0, 0 ' + (cs / 2) + 'px, ' + (cs / 2) + 'px -' + (cs / 2) + 'px, -' + (cs / 2) + 'px 0';
            el.style.backgroundColor = '#80bdff';
            break;
    }
}

// ── Helper: fill with dot/block symbols ──
function _fillSymbols(el, count, kind) {
    var cont = document.createElement('div');
    cont.className = 'dots-container';
    for (var i = 0; i < count; i++) {
        var d = document.createElement('div');
        d.className = kind === 'dot' ? 'dot' : 'mini-block';
        cont.appendChild(d);
    }
    el.appendChild(cont);
}

// ── Helper: fill with vertical bars ──
function _fillBars(el, count) {
    var cont = document.createElement('div');
    cont.style.cssText = 'display:flex;gap:2px;align-items:flex-end;justify-content:center;width:100%;height:100%;padding:4px;box-sizing:border-box;';
    var bw = Math.max(2, Math.floor((52 - count * 2) / count));
    for (var i = 0; i < count; i++) {
        var b = document.createElement('div');
        b.style.cssText = 'background:white;border-radius:1px;flex-shrink:0;';
        b.style.width = bw + 'px';
        b.style.height = Math.round(15 + Math.random() * 35) + 'px';
        cont.appendChild(b);
    }
    el.appendChild(cont);
}

// ── Helper: fill with text characters ──
function _fillText(el, count, char, color) {
    var cont = document.createElement('div');
    cont.style.cssText = 'display:flex;flex-wrap:wrap;gap:1px;padding:3px;width:100%;height:100%;box-sizing:border-box;align-content:flex-start;justify-content:center;font-size:12px;line-height:1;';
    cont.style.color = color;
    for (var i = 0; i < count; i++) {
        var s = document.createElement('span');
        s.textContent = char;
        cont.appendChild(s);
    }
    el.appendChild(cont);
}

// ── Helper: concentric rings ──
function _fillRings(el, count) {
    el.style.position = 'relative';
    el.style.backgroundColor = 'transparent';
    var maxR = 28;
    for (var i = 0; i < count; i++) {
        var r = document.createElement('div');
        var size = maxR - i * Math.floor(maxR / (count + 1));
        r.style.cssText = 'position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);border-radius:50%;border:2px solid #007bff;box-sizing:border-box;';
        r.style.width = (size * 2) + 'px';
        r.style.height = (size * 2) + 'px';
        el.appendChild(r);
    }
}

// ── Helper: horizontal lines ──
function _fillLines(el, count) {
    var cont = document.createElement('div');
    cont.style.cssText = 'display:flex;flex-direction:column;gap:2px;justify-content:center;align-items:center;width:100%;height:100%;padding:5px;box-sizing:border-box;';
    for (var i = 0; i < count; i++) {
        var l = document.createElement('div');
        l.style.cssText = 'width:80%;height:2px;background:white;border-radius:1px;flex-shrink:0;';
        cont.appendChild(l);
    }
    el.appendChild(cont);
}
