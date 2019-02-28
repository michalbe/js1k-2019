var M = Math;
var CIRCLE = M.PI * 2;
const wall_text = 'JS1K';

let i = -1;
let RayMap_walls = "e13wtdmn7n079tsf7qy20naz7gcepyazc0z1tcvvautqjrrrax1ppc9rbcytdccxd33098ltc02ythhxcevfb01r"
    .split('')
    .reduce((memo, curr, index) => {
        if (index % 8 === 0) {
            i++;
            memo[i] = '';
        }
        memo[i] += curr;
        return memo;
    }, []).map((e) => parseInt(e, 36).toString(2)).join('').split(''),
    RayMap_width = 20,
    RayMap_height = 22,
    RayCamera_fov = M.PI * 0.4,
    RayCamera_range = 14,
    RayCamera_lightRange = 5,
    RayCamera_p_x = p_x = 2.8,
    RayCamera_p_y = p_y = 3.7,
    RayCamera_dir = dir = M.PI * 0.3,
    RaycastRenderer_height = 10,
    RaycastRenderer_resolution = 28,
    Controls_codes = { 37: 'l', 39: 'r', 38: 'f', 40: 'b' },
    Controls_states = { 'l': false, 'r': false, 'f': false, 'b': false },
    lastTime = 0,
    str = '',
    rot = (angle) => {
        dir = (dir + angle + CIRCLE) % (CIRCLE);
        RayCamera_dir = dir;
    },
    walk = (distance) => {
        var dx = M.cos(dir) * distance;
        var dy = M.sin(dir) * distance;
        if (RayMap_Get(p_x + dx, p_y) <= 0) p_x += dx;
        if (RayMap_Get(p_x, p_y + dy) <= 0) p_y += dy;
        RayCamera_p_x = p_x;
        RayCamera_p_y = p_y;
    },
    update = (seconds) => {
        if (Controls_states['l']) rot(-M.PI * seconds);
        if (Controls_states['r']) rot(M.PI * seconds);
        if (Controls_states['f']) walk(3 * seconds);
        if (Controls_states['b']) walk(-3 * seconds);
    };

function RayMap_Get(x, y) {
    x = x | 0;
    y = y | 0;
    if (x < 0 || x >= RayMap_width || y < 0 || y >= RayMap_height) return -1;
    return RayMap_walls[y * RayMap_width + x];
};

function RayMap_Raycast(x, y, angle, range) {
    var cells = [];
    var sin = M.sin(angle);
    var cos = M.cos(angle);

    var stepX, stepY, nextStep;
    nextStep = { x, y, cell: 0, distance: 0 };
    do {
        cells.push(nextStep);
        if (nextStep.cell > 0)
            break;
        stepX = RayMap___step(sin, cos, nextStep.x, nextStep.y);
        stepY = RayMap___step(cos, sin, nextStep.y, nextStep.x, true);
        nextStep = stepX.length2 < stepY.length2
            ? RayMap___inspect(stepX, 1, 0, nextStep.distance, cos, sin)
            : RayMap___inspect(stepY, 0, 1, nextStep.distance, cos, sin);
    } while (nextStep.distance <= range);

    return cells;
};

function RayMap___step(rise, run, x, y, inverted) {
    if (run === 0) return { length2: 10e5 };
    var dx = run > 0 ? ~~(x + 1) - x : M.ceil(x - 1) - x;
    var dy = dx * rise / run;
    return {
        x: inverted ? y + dy : x + dx,
        y: inverted ? x + dx : y + dy,
        length2: dx * dx + dy * dy
    };
};

function RayMap___inspect(step, shiftX, shiftY, distance, cos, sin) {
    var dx = cos < 0 ? shiftX : 0;
    var dy = sin < 0 ? shiftY : 0;
    var index = (((step.y - dy) | 0) * RayMap_width) + ((step.x - dx) | 0);
    step.cell = (index < 0 || index >= RayMap_walls.length) ? -1 : RayMap_walls[index];
    step.distance = distance + M.sqrt(step.length2);
    return step;
};

function RayCamera_Rotate(angle) {
    RayCamera_dir = (RayCamera_dir + angle + CIRCLE) % (CIRCLE);
}

function RaycastRenderer___project(height, angle, distance) {
    var z = distance * M.cos(angle);
    var wallHeight = RaycastRenderer_height * height / z;
    return wallHeight;
};

function RaycastRenderer___drawColumn(column, ray, angle) {
    var hit = -1;

    while (++hit < ray.length && ray[hit].cell <= 0);

    if (hit < ray.length) {
        var step = ray[hit];
        var wall = RaycastRenderer___project(1, angle, step.distance);
        const alpha = 1 - M.max((step.distance) / RayCamera_lightRange, 0);
        els[column].style.opacity = alpha;
        els[column].style.transform = 'scaleY(' + wall + ')';
    }
};

function RaycastRenderer___drawColumns() {
    for (var col = 0; col < RaycastRenderer_resolution; col++) {
        var angle = RayCamera_fov * (col / RaycastRenderer_resolution - 0.5);
        var ray = RayMap_Raycast(RayCamera_p_x, RayCamera_p_y, RayCamera_dir + angle, RayCamera_range);
        RaycastRenderer___drawColumn(col, ray, angle);
    }
};


function Controls_onKey(val, e) {
    var state = Controls_codes[e.keyCode];
    Controls_states[state] = val;
};

for (let i = 0; i < RaycastRenderer_resolution; i++) {
    str += '<span>' + wall_text[i % wall_text.length] + '</span>';
}
b.innerHTML = str;
let els = d.querySelectorAll('span');

d.onkeydown = Controls_onKey.bind(this, true);
d.onkeyup = Controls_onKey.bind(this, false);

function UpdateRender(time) {
    var seconds = (time - lastTime) / 1000;
    lastTime = time;
    if (seconds < 0.2) {
        update(seconds);
        RaycastRenderer___drawColumns();
    }
    requestAnimationFrame(UpdateRender);
}
UpdateRender();
