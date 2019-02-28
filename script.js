var CIRCLE = Math.PI * 2;
const wall_text = 'JS1K';

let color = [0, 255, 0];
let i = -1;
let RayMap_walls = "e13wtdmn7n079tsf7qy20naz7gcepyazc0z1tcvvautqjrrrax1ppc9rbcytdccxd33098ltc02ythhxcevfb01r"
    .split('')
    .reduce((memo, curr, index) => {
        memo[i]
        if (index % 8 === 0) {
            i++;
            memo[i] = '';
        }
        memo[i] += curr;
        return memo;
    }, []).map((e) => parseInt(e, 36).toString(2)).join('').split(''),
    RayMap_light = 2,
    RayMap_width = 20,
    RayMap_height = 22,
    RayMap_outdoors = false;

function RayMap_Get(x, y) {
    x = x | 0;
    y = y | 0;
    if (x < 0 || x >= RayMap_width || y < 0 || y >= RayMap_height) return -1;
    return RayMap_walls[y * RayMap_width + x];
};

function RayMap_Raycast(point, angle, range, fullRange = false) {
    var cells = [];
    var sin = Math.sin(angle);
    var cos = Math.cos(angle);

    var stepX, stepY, nextStep;
    nextStep = { x: point.x, y: point.y, cell: 0, distance: 0 };
    do {
        cells.push(nextStep);
        if (!fullRange && nextStep.cell > 0)
            break;
        stepX = RayMap___step(sin, cos, nextStep.x, nextStep.y);
        stepY = RayMap___step(cos, sin, nextStep.y, nextStep.x, true);
        nextStep = stepX.length2 < stepY.length2
            ? RayMap___inspect(stepX, 1, 0, nextStep.distance, stepX.y, cos, sin)
            : RayMap___inspect(stepY, 0, 1, nextStep.distance, stepY.x, cos, sin);
    } while (nextStep.distance <= range);

    return cells;
};

function RayMap___step(rise, run, x, y, inverted) {
    if (run === 0) return { length2: Infinity };
    var dx = run > 0 ? ~~(x + 1) - x : Math.ceil(x - 1) - x;
    var dy = dx * rise / run;
    return {
        x: inverted ? y + dy : x + dx,
        y: inverted ? x + dx : y + dy,
        length2: dx * dx + dy * dy
    };
};

function RayMap___inspect(step, shiftX, shiftY, distance, offset, cos, sin) {
    var dx = cos < 0 ? shiftX : 0;
    var dy = sin < 0 ? shiftY : 0;
    var index = (((step.y - dy) | 0) * RayMap_width) + ((step.x - dx) | 0);
    step.cell = (index < 0 || index >= RayMap_walls.length) ? -1 : RayMap_walls[index];
    step.distance = distance + Math.sqrt(step.length2);
    step.shading = 0;
    step.offset = offset - (offset | 0);
    return step;
};


let RayCamera_fov = Math.PI * 0.4,
    RayCamera_range = 14,
    RayCamera_lightRange = 5,
    RayCamera_p = { x: 0, y: 0 },
    RayCamera_dir = Math.PI * 0.5;

function RayCamera_Rotate(angle) {
    RayCamera_dir = (RayCamera_dir + angle + CIRCLE) % (CIRCLE);
}

// The Render Engine
// ==============================
let RaycastRenderer_domElement = document.getElementById('canvas');

let RaycastRenderer_width = 640,
    RaycastRenderer_height = 360,
    RaycastRenderer_resolution = 28,
    RaycastRenderer_ctx = RaycastRenderer_domElement.getContext('2d'),
    RaycastRenderer_spacing = RaycastRenderer_width / RaycastRenderer_resolution;

RaycastRenderer_domElement.width = RaycastRenderer_width;
RaycastRenderer_domElement.height = RaycastRenderer_height;

function RaycastRenderer___project(height, angle, distance) {
    var z = distance * Math.cos(angle);
    var wallHeight = RaycastRenderer_height * height / z;
    var bottom = RaycastRenderer_height / 2 * (1 + 1 / z);
    return {
        top: bottom - wallHeight,
        height: wallHeight
    };
};

function RaycastRenderer___drawColumn(column, ray, angle) {
    var left = ~~(column * RaycastRenderer_spacing);
    var width = Math.ceil(RaycastRenderer_spacing);
    var hit = -1;

    while (++hit < ray.length && ray[hit].cell <= 0);

    if (hit < ray.length) {
        RaycastRenderer_ctx.save();
        var step = ray[hit];
        const letter = wall_text[column % wall_text.length];
        var wall = RaycastRenderer___project(1, angle, step.distance);

        RaycastRenderer_ctx.globalAlpha = 1;

        const alpha = 1 - Math.max((step.distance + step.shading) / RayCamera_lightRange, 0);
        RaycastRenderer_ctx.fillStyle = 'rgba(' + color[0] + ', ' + color[1] + ', ' + color[2] + ', ' + alpha + ')';

        RaycastRenderer_ctx.font = wall.height + 'px Arial';
        const metrics = RaycastRenderer_ctx.measureText(letter);
        const text_width = metrics.width;
        const scale = width / text_width;
        RaycastRenderer_ctx.scale(scale, 1);
        RaycastRenderer_ctx.fillText(letter, left / scale, wall.top + wall.height);
        RaycastRenderer_ctx.restore();
    }
};

function RaycastRenderer___drawColumns() {
    RaycastRenderer_ctx.save();
    for (var col = 0; col < RaycastRenderer_resolution; col++) {
        var angle = RayCamera_fov * (col / RaycastRenderer_resolution - 0.5);
        var ray = RayMap_Raycast(RayCamera_p, RayCamera_dir + angle, RayCamera_range);
        RaycastRenderer___drawColumn(col, ray, angle);
    }
    RaycastRenderer_ctx.restore();
};

function RaycastRenderer_Render() {
    RaycastRenderer___drawColumns();
};

function RaycastRenderer_Raycast(point, angle, range) {
    return RayMap_Raycast(point, angle, range);
}

// Raycast Demo code
// ==================
// Controls and player object modified from same thing
// as the Raycast Engine
// ======================

let Controls_codes = { 37: 'l', 39: 'r', 38: 'f', 40: 'b' },
    Controls_states = { 'l': false, 'r': false, 'f': false, 'b': false };
document.addEventListener('keydown', Controls_onKey.bind(this, true), false);
document.addEventListener('keyup', Controls_onKey.bind(this, false), false);


function Controls_onKey (val, e) {
    var state = Controls_codes[e.keyCode];
    if (!state) return;
    Controls_states[state] = val;
};

var p = { x: 2.8, y: 3.7 },
    dir = Math.PI * 0.3,
    rot = (angle) => {
        dir = (dir + angle + CIRCLE) % (CIRCLE);
        RayCamera_dir = dir;
    },
    walk = (distance) => {
        var dx = Math.cos(dir) * distance;
        var dy = Math.sin(dir) * distance;
        if (RayMap_Get(p.x + dx, p.y) <= 0) p.x += dx;
        if (RayMap_Get(p.x, p.y + dy) <= 0) p.y += dy;
        RayCamera_p.x = p.x;
        RayCamera_p.y = p.y;
    },
    update = (seconds) => {
        if (Controls_states['l']) rot(-Math.PI * seconds);
        if (Controls_states['r']) rot(Math.PI * seconds);
        if (Controls_states['f']) walk(3 * seconds);
        if (Controls_states['b']) walk(-3 * seconds);
    }

RayCamera_dir = dir;
RayCamera_p.x = p.x;
RayCamera_p.y = p.y;

var lastTime = 0;
var mapPos = { x: -44, y: -44 };
function UpdateRender(time) {
    var seconds = (time - lastTime) / 1000;
    lastTime = time;
    if (seconds < 0.2) {
        update(seconds);
        canvas.width = canvas.width;
        RaycastRenderer_Render();
    }
    requestAnimationFrame(UpdateRender);
}
UpdateRender();
// requestAnimationFrame(UpdateRender);
