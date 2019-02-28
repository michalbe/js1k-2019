var CIRCLE = Math.PI * 2;
const wall_text = 'JS1K';
let color = [~~(Math.random() * 255), ~~(Math.random() * 255), ~~(Math.random() * 255)];
function RayMap(options) {
    this.walls = [];
    this.light = 1;
    this.width = 0;
    this.height = 0;
    this.outdoors = false;

    Object.assign(this, options);
}

RayMap.prototype = {
    Get(x, y) {
        x = x | 0;
        y = y | 0;
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) return -1;
        return this.walls[y * this.width + x];
    },

    Raycast(point, angle, range, fullRange = false) {
        var cells = [];
        var sin = Math.sin(angle);
        var cos = Math.cos(angle);

        var stepX, stepY, nextStep;
        nextStep = { x: point.x, y: point.y, cell: 0, distance: 0 };
        do {
            cells.push(nextStep);
            if (!fullRange && nextStep.cell > 0)
                break;
            stepX = this.__step(sin, cos, nextStep.x, nextStep.y);
            stepY = this.__step(cos, sin, nextStep.y, nextStep.x, true);
            nextStep = stepX.length2 < stepY.length2
                ? this.__inspect(stepX, 1, 0, nextStep.distance, stepX.y, cos, sin)
                : this.__inspect(stepY, 0, 1, nextStep.distance, stepY.x, cos, sin);
        } while (nextStep.distance <= range);

        return cells;
    },

    __step(rise, run, x, y, inverted) {
        if (run === 0) return { length2: Infinity };
        var dx = run > 0 ? ~~(x + 1) - x : Math.ceil(x - 1) - x;
        var dy = dx * rise / run;
        return {
            x: inverted ? y + dy : x + dx,
            y: inverted ? x + dx : y + dy,
            length2: dx * dx + dy * dy
        };
    },

    __inspect(step, shiftX, shiftY, distance, offset, cos, sin) {
        var dx = cos < 0 ? shiftX : 0;
        var dy = sin < 0 ? shiftY : 0;
        var index = (((step.y - dy) | 0) * this.width) + ((step.x - dx) | 0);
        step.cell = (index < 0 || index >= this.walls.length) ? -1 : this.walls[index];
        step.distance = distance + Math.sqrt(step.length2);
        step.shading = 0;
        step.offset = offset - (offset | 0);
        return step;
    }
};

// The Camera
// ==========================
function RayCamera(options) {
    this.fov = Math.PI * 0.4;
    this.range = 14;
    this.lightRange = 5;
    this.p = { x: 0, y: 0 };
    this.dir = Math.PI * 0.5;

    Object.assign(this, options);

    this.spacing = this.width / this.resolution;
}

RayCamera.prototype = {
    Rotate: (angle) => {
        this.dir = (this.dir + angle + CIRCLE) % (CIRCLE);
    }
};

// The Render Engine
// ==============================
function RaycastRenderer(options) {
    this.width = 640;
    this.height = 360;
    this.resolution = 30;
    this.domElement = document.createElement('canvas');

    Object.assign(this, options);

    this.domElement.width = this.width;
    this.domElement.height = this.height;
    this.ctx = this.domElement.getContext('2d');
    this.spacing = this.width / this.resolution;
}

RaycastRenderer.prototype = {
    __project(height, angle, distance) {
        var z = distance * Math.cos(angle);
        var wallHeight = this.height * height / z;
        var bottom = this.height / 2 * (1 + 1 / z);
        return {
            top: bottom - wallHeight,
            height: wallHeight
        };
    },

    __drawColumn(column, ray, angle, camera) {
        var left = ~~(column * this.spacing);
        var width = Math.ceil(this.spacing);
        var hit = -1;

        while (++hit < ray.length && ray[hit].cell <= 0);

        // var texture;
        // var textureX = 0;
        if (hit < ray.length) {
            this.ctx.save();
            // TODO: Deal with transparent walls here somehow
            var step = ray[hit];
            const letter = wall_text[column % wall_text.length];
            var wall = this.__project(1, angle, step.distance);

            this.ctx.globalAlpha = 1;

            const alpha = 1 - Math.max((step.distance + step.shading) / camera.lightRange, 0);
            this.ctx.fillStyle = 'rgba(' + color[0] + ', ' + color[1] + ', ' + color[2] + ', ' + alpha + ')';

            ctx.font = wall.height + 'px Arial';
            const metrics = this.ctx.measureText(letter);
            const text_width = metrics.width;
            const scale = width / text_width;
            this.ctx.scale(scale, 1);
            ctx.fillText(letter, left / scale, wall.top + wall.height);
            this.ctx.restore();
        }
    },

    __drawColumns(camera, map) {
        this.ctx.save();
        for (var col = 0; col < this.resolution; col++) {
            var angle = camera.fov * (col / this.resolution - 0.5);
            var ray = map.Raycast(camera.p, camera.dir + angle, camera.range);
            this.__drawColumn(col, ray, angle, camera);
        }
        this.ctx.restore();
    },

    Render(camera, map) {
        this.__drawColumns(camera, map);
    },

    Raycast(point, angle, range) {
        if (this.map)
            return this.map.Raycast(point, angle, range);
        return [];
    }
};

// Raycast Demo code
// ==================
// Controls and player object modified from same thing
// as the Raycast Engine
// ======================

var canvas = document.getElementById('canvas');
var ctx = canvas.getContext('2d');

let i = -1;
var map = new RayMap({
    width: 20,
    height: 22,
    light: 2,
    walls:
        "e13wtdmn7n079tsf7qy20naz7gcepyazc0z1tcvvautqjrrrax1ppc9rbcytdccxd33098ltc02ythhxcevfb01r"
        .split('')
        .reduce((memo, curr, index) => {
            memo[i]
            if (index % 8 === 0) {
                i++;
                memo[i] = '';
            }
            memo[i] += curr;
            return memo;
        }, []).map((e) => parseInt(e, 36).toString(2)).join('').split('')
});


var camera = new RayCamera();

var renderer = new RaycastRenderer({
    width: 640,
    height: 360,
    domElement: canvas
});

function Controls() {
    this.codes = { 37: 'l', 39: 'r', 38: 'f', 40: 'b' };
    this.states = { 'l': false, 'r': false, 'f': false, 'b': false };
    document.addEventListener('keydown', this.onKey.bind(this, true), false);
    document.addEventListener('keyup', this.onKey.bind(this, false), false);
}

Controls.prototype.onKey = function (val, e) {
    var state = this.codes[e.keyCode];
    if (!state) return;
    this.states[state] = val;
};

var controls = new Controls();

var p = { x: 2.8, y: 3.7 },
    dir = Math.PI * 0.3,
    rot = (angle) => {
        dir = (dir + angle + CIRCLE) % (CIRCLE);
        camera.dir = dir;
    },
    walk = (distance, map) => {
        var dx = Math.cos(dir) * distance;
        var dy = Math.sin(dir) * distance;
        if (map.Get(p.x + dx, p.y) <= 0) p.x += dx;
        if (map.Get(p.x, p.y + dy) <= 0) p.y += dy;
        camera.p.x = p.x;
        camera.p.y = p.y;
    },
    update = (controls, map, seconds) => {
        if (controls['l']) rot(-Math.PI * seconds);
        if (controls['r']) rot(Math.PI * seconds);
        if (controls['f']) walk(3 * seconds, map);
        if (controls['b']) walk(-3 * seconds, map);
    }

camera.dir = dir;
camera.p.x = p.x;
camera.p.y = p.y;

var lastTime = 0;
var mapPos = { x: -44, y: -44 };
function UpdateRender(time) {
    var seconds = (time - lastTime) / 1000;
    lastTime = time;
    if (seconds < 0.2) {
        update(controls.states, map, seconds);
        canvas.width = canvas.width;
        renderer.Render(camera, map);
    }
    requestAnimationFrame(UpdateRender);
}
UpdateRender();
// requestAnimationFrame(UpdateRender);
