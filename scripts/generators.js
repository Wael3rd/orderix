// Generate challenge values for all types
function generateValues(type, count) {
    const FIXED = {
        dice:       [1,2,3,4,5,6],
        alphabet:   Array.from({length:26},(_,i)=>i+1),
        months:     Array.from({length:12},(_,i)=>i+1),
        planets:    Array.from({length:8},(_,i)=>i+1),
        emojis:     Array.from({length:7},(_,i)=>i+1),
        animals:    Array.from({length:20},(_,i)=>i+1),
        ages:       Array.from({length:8},(_,i)=>i+1),
        rating:     [1,2,3,4,5],
        polygons:   [3,4,5,6,7,8,9,10],
        wordLength: [2,3,4,5,6,7,8,9,10,11,12],
        weights:    [1,5,10,25,50,100,200,500,1000,2000,5000,10000,20000,50000,100000],
        durations:  [5,10,15,30,45,60,90,120,180,300,600,900,1800,3600,7200],
        mathAdd:    [4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25],
        mathSub:    [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20],
        mathMul:    [4,6,8,9,10,12,14,15,16,18,20,21,24,25,27,28,30,32,35,36]
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
        stars:[1,10], numbers:[2,99], roman:[1,30],
        fractions:[5,90], binary:[1,31],
        stairs:[1,10], stack:[1,12], target:[1,8], pixels:[2,8],
        checkers:[2,16], stripes:[1,12]
    };
    const INT = 'clocks,dots,bars,stars,numbers,roman,binary,stairs,stack,target,pixels,checkers,stripes,borderWidth,fontSize,centerDot,lineLength,shadow,gauge,compass,wifi'.split(',');
    const range = R[type];
    if (!range) return [];
    const isInt = INT.indexOf(type) !== -1;
    let vals = [];
    for (let i = 0; i < count; i++) {
        let v = count === 1 ? range[0] : range[0] + i * (range[1] - range[0]) / (count - 1);
        vals.push(isInt ? Math.round(v) : parseFloat(v.toFixed(4)));
    }
    if (isInt) { let seen={}, u=[]; for(let k=0;k<vals.length;k++){if(!seen[vals[k]]){seen[vals[k]]=true;u.push(vals[k]);}} vals=u; }
    return vals;
}
