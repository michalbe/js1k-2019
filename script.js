var M = Math,
    Mcos = M.cos,
    CIRCLE = M.PI * 2,
    wall_text = 'JS1K',
    RayMap_walls = "e13wtdmn,7n079tsf,7qy20naz,7gcepyaz,c0z1tcvv,autqjrrr,ax1ppc9r,bcytdccx,d33098lt,c02ythhx,cevfb01r"
    .split(',')
    .map((e) => parseInt(e, 36).toString(2)).join('').split(''),
    RayMap_width = 20,
    RayMap_height = 22,
    RayCamera_fov = M.PI * 0.4,
    RayCamera_range = 9,
    RayCamera_lightRange = 5,
    p_x,p_y,
    RayCamera_p_x = p_x = 3,
    RayCamera_p_y = p_y = 4,
    dir,
    RayCamera_dir = dir = 0,
    RaycastRenderer_height = 9,
    RaycastRenderer_resolution = 28,
    // 37 - l, 39 - r, 38 - f, 40 - b
    Controls_states = { 7: 0, 9: 0, 8: 0, 10: 0 },
    lastTime = 0,
    str = '',
    rot = (angle) => {
        dir = (dir + angle + CIRCLE) % (CIRCLE);
        RayCamera_dir = dir;
    },
    walk = (distance) => {
        var dx = Mcos(dir) * distance;
        var dy = M.sin(dir) * distance;
        if (RayMap_Get(p_x + dx, p_y) <= 0) p_x += dx;
        if (RayMap_Get(p_x, p_y + dy) <= 0) p_y += dy;
        RayCamera_p_x = p_x;
        RayCamera_p_y = p_y;
    },
    update = (seconds) => {
        if (Controls_states[7]) rot(-M.PI * seconds);
        if (Controls_states[9]) rot(M.PI * seconds);
        if (Controls_states[8]) walk(3 * seconds);
        if (Controls_states[10]) walk(-3 * seconds);
    };

function RayMap_Get(x, y) {
    x = x | 0;
    y = y | 0;
    if (x < 0 || x >= RayMap_width || y < 0 || y >= RayMap_height) return -1;
    return RayMap_walls[y * RayMap_width + x];
};

function RayMap_Raycast(x, y, angle, range) {
    var cells = [],
        sin = M.sin(angle),
        cos = Mcos(angle),
        stepX, stepY, nextStep;

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
    var dx = run > 0 ? ~~(x + 1) - x : M.ceil(x - 1) - x;
    var dy = dx * rise / run;
    return (run === 0) ? { length2: 9 } : {
        x: inverted ? y + dy : x + dx,
        y: inverted ? x + dx : y + dy,
        length2: dx * dx + dy * dy
    };
};

function RayMap___inspect(step, shiftX, shiftY, distance, cos, sin) {
    var dx = cos < 0 ? shiftX : 0;
    var dy = sin < 0 ? shiftY : 0;
    var index = (((step.y - dy) | 0) * RayMap_width) + ((step.x - dx) | 0);
    step.cell = (index < 0 || index >= 440) ? -1 : RayMap_walls[index];
    step.distance = distance + M.sqrt(step.length2);
    return step;
};

function RayCamera_Rotate(angle) {
    RayCamera_dir = (RayCamera_dir + angle + CIRCLE) % (CIRCLE);
}

function RaycastRenderer___project(angle, distance) {
    var z = distance * Mcos(angle);
    var wallHeight = RaycastRenderer_height / z;
    return wallHeight;
};

function RaycastRenderer___drawColumn(column, ray, angle) {
    var hit = -1;
    while (++hit < ray.length && ray[hit].cell <= 0);

    if (hit < ray.length) {
        var step = ray[hit];
        var wall = RaycastRenderer___project(angle, step.distance);
        const alpha = 1 - M.max((step.distance) / RayCamera_lightRange, 0);
        els[column].style.opacity = alpha;
        els[column].style.transform = 'scaleY(' + wall + ')';
    }
};

function RaycastRenderer___drawColumns() {
    for (var col = 0; col < RaycastRenderer_resolution; col++) {
        var angle = RayCamera_fov * (col / RaycastRenderer_resolution - 0.5),
        ray = RayMap_Raycast(RayCamera_p_x, RayCamera_p_y, RayCamera_dir + angle, RayCamera_range);
        RaycastRenderer___drawColumn(col, ray, angle);
    }
};


function Controls_onKey(val) {
    return (e) => {
        Controls_states[e.keyCode%30] = val;
    }
};

for (let i = 0; i < RaycastRenderer_resolution; i++) {
    str += '<p style="display:inline-block;">' + wall_text[i % wall_text.length] + '</p>';
}

b.innerHTML = str;
b.style.margin = '59px';
let els = d.querySelectorAll('p');

d.onkeydown = Controls_onKey(1);
d.onkeyup = Controls_onKey(0);

function UpdateRender(time) {
    var seconds = (time - lastTime) / 1000;
    lastTime = time;
    update(seconds);
    RaycastRenderer___drawColumns();
    requestAnimationFrame(UpdateRender);
}
UpdateRender();
