const SCREEN_WIDTH = window.innerWidth;
const SCREEN_HEIGHT = window.innerHeight;

const canvas = document.createElement('canvas');
canvas.setAttribute('width', SCREEN_WIDTH);
canvas.setAttribute('height', SCREEN_HEIGHT);
document.body.appendChild(canvas);

const context = canvas.getContext('2d');
const TICK = 30;
const CELL_SIZE = 64;
const PLAYER_SIZE = 10;

let maxWallHeight = 0;

const getHue = (hexColor) => {
    let r = parseInt(hexColor.substr(1, 2), 16);
    let g = parseInt(hexColor.substr(3, 2), 16);
    let b = parseInt(hexColor.substr(5, 2), 16);

    r /= 255;
    g /= 255;
    b /= 255;

    let max = Math.max(r, g, b)
    let min = Math.min(r, g, b);
    let h = (max + min) / 2;

    if (max === min) {
        h = s = 0;
    } else {
        let d = max - min;
        switch(max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }

    return h;
}

const getWallBrightness = (hexColor, wallHeight) => {
    const hue = getHue(hexColor);
    // the higher wallHeight is, the higher the brightness should be
    // the smaller wallHeight is, the darker the brightness should be
    // wallHeight 200 ( the closest wall line ) should return 100%
    // wallHeight 0 ( the furthest wall line ) should return 0%
    // wallHeight 160 should return 80%
    // wallHeight 40 should return 20%
    let lightValue = Math.floor((wallHeight / SCREEN_HEIGHT) * 100);

    if (lightValue < 20) {
        return 20;
    } else if (lightValue > 60) {
        return 60;
    }
    // console.log(lightValue, wallHeight, maxWallHeight);
    return lightValue;
}

const getLinearGradientVertical = (color1, color2, color3) => {
    const linGrad = context.createLinearGradient(0, 0, 0, SCREEN_HEIGHT);
    linGrad.addColorStop(0, color1);
    linGrad.addColorStop(0.5, color2);
    linGrad.addColorStop(1, color3);
    return linGrad;
}

const getLinearGradientHorizontal = (color1, color2, color3) => {
    const linGrad = context.createLinearGradient(0, 0, SCREEN_WIDTH, 0);
    linGrad.addColorStop(0, color1);
    // linGrad.addColorStop(0.25, color2);
    linGrad.addColorStop(0.5, color2);
    // linGrad.addColorStop(0.75, color2);
    linGrad.addColorStop(1, color1);
    return linGrad;
}

const toRadians = (deg) => {
    return (deg * Math.PI) / 180;
}

const PLAYER_FOV = toRadians(60);

// the shorter wallHeight, the lower the lightness should be
const COLORS = {
    rays: '#fff',
    floor: ['#020024', '#090979', '#00D4FF'],
    ceiling: ['#00d4ff', '#097962', '#020024'],
    wall: '#ff0095',
    // wall: 'hsl(300, 76%, 50%)',
    // wall: ['#e900ff', '#4f0551', '#e900ff'],
    wallDark: '#401838'
};

const map = [
    [1, 1, 1, 1, 1, 1, 1],
    [1, 0, 0, 0, 0, 0, 1],
    [1, 0, 1, 1, 0, 1, 1],
    [1, 0, 0, 0, 0, 0, 1],
    [1, 0, 1, 0, 1, 0, 1],
    [1, 0, 1, 0, 1, 0, 1],
    [1, 1, 1, 1, 1, 1, 1,]
]; 

const player = {
    x: CELL_SIZE * 1.5,
    y: CELL_SIZE * 2,
    angle: 0,
    speed: 0
};

console.log(player);

const clearScreen = () => {
    context.fillStyle = 'blue';
    context.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
}

const movePlayer = () => {
    player.x += Math.cos(player.angle) * player.speed;
    player.y += Math.sin(player.angle) * player.speed;
}

const outOfMapBounds = (x, y) => {
    return x < 0 || x >= map[0].length || y < 0 || y >= map.length
}

const distance = (x1, y1, x2, y2) => {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}

const getVCollision = (angle) => {
    const right = Math.abs(Math.floor((angle - Math.PI / 2) / Math.PI) % 2);

    const firstX = right ? 
        Math.floor(player.x / CELL_SIZE) * CELL_SIZE + CELL_SIZE
    :
        Math.floor(player.x / CELL_SIZE) * CELL_SIZE
    ;

    const firstY = player.y + (firstX - player.x) * Math.tan(angle);
    const xA = right ? CELL_SIZE : -CELL_SIZE;
    const yA = xA * Math.tan(angle);

    let wall;
    let nextX = firstX;
    let nextY = firstY;

    while (!wall) {
        const cellX = right ?
            Math.floor(nextX / CELL_SIZE) 
        : 
            Math.floor(nextX / CELL_SIZE) - 1
        ;
        const cellY = Math.floor(nextY / CELL_SIZE);

        if (outOfMapBounds(cellX, cellY)) {
            break;
        }
        wall = map[cellY][cellX];

        if (!wall) {
            nextX += xA;
            nextY += yA;
        }
    }
    return { angle, distance: distance(player.x, player.y, nextX, nextY), vertical: true }
}

const getHCollision = (angle) => {
    const up = Math.abs(Math.floor(angle / Math.PI) % 2);
    const firstY = up ?
        Math.floor(player.y / CELL_SIZE) * CELL_SIZE
    :
        Math.floor(player.y / CELL_SIZE) * CELL_SIZE + CELL_SIZE
    ;

    const firstX = player.x + (firstY - player.y) / Math.tan(angle);

    const yA = up ?
        -CELL_SIZE
    :
        CELL_SIZE
    ;
    const xA = yA / Math.tan(angle);

    let wall;
    let nextX = firstX;
    let nextY = firstY;
    
    while (!wall) {
        const cellX = Math.floor(nextX / CELL_SIZE);
        const cellY = up ?
            Math.floor(nextY / CELL_SIZE) - 1
        : 
            Math.floor(nextY / CELL_SIZE)
        ;

        if (outOfMapBounds(cellX, cellY)) {
            break;
        }
        wall = map[cellY][cellX];

        if (!wall) {
            nextX += xA;
            nextY += yA;
        }
    }
    return { angle, distance: distance(player.x, player.y, nextX, nextY), vertical: false }
}

const castRay = (angle) => {
    const vCollision = getVCollision(angle);
    const hCollision = getHCollision(angle);

    return hCollision.distance >= vCollision.distance ?
        vCollision 
    :
        hCollision
    ;
}

const getRays = () => {
    const initialAngle = player.angle - PLAYER_FOV / 2;
    const numberOfRays = SCREEN_WIDTH;
    const angleStep = PLAYER_FOV / numberOfRays;
    return Array.from({ length: numberOfRays }, (_, i) => {
        const angle = initialAngle + i * angleStep;
        const ray = castRay(angle);
        return ray;
    })
}

const renderScene = (rays) => {
    rays.forEach((ray, i) => {
        const distance = ray.distance;

        // draw wall
        const wallHeight = (CELL_SIZE * 5) / distance * 277;
        maxWallHeight = Math.max(maxWallHeight, wallHeight);
        // context.fillStyle = ray.vertical ? 
        //     COLORS.wallDark 
        // : 
        //     COLORS.wall
        // ;
        let fillStyle = `hsl(${getHue(COLORS.wall)}, ${getWallBrightness(COLORS.wall, wallHeight)}%, ${getWallBrightness(COLORS.wall, wallHeight)}%)`
        context.fillStyle = ray.vertical ? 
            COLORS.wallDark 
        : 
            `hsl(${getHue(COLORS.wall)}, ${getWallBrightness(COLORS.wall, wallHeight)}%, ${getWallBrightness(COLORS.wall, wallHeight)}%)`
        ;
        context.fillRect(i, SCREEN_HEIGHT / 2 - wallHeight / 2, 1, wallHeight);

        // draw floor
        context.fillStyle = getLinearGradientVertical(COLORS.floor[0], COLORS.floor[1], COLORS.floor[2]);
        context.fillRect(i, SCREEN_HEIGHT / 2 + wallHeight / 2, 1, SCREEN_HEIGHT / 2 - wallHeight / 2);

        // draw ceiling
        context.fillStyle = getLinearGradientVertical(COLORS.ceiling[0], COLORS.ceiling[1], COLORS.ceiling[2]);
        context.fillRect(i, 0, 1, SCREEN_HEIGHT / 2 - wallHeight / 2);
    });
}

const renderMiniMap = (posX = 0, posY = 0, scale = 1, rays) => {
    const cellSize = scale * CELL_SIZE;
    map.forEach((row, y) => {
        row.forEach((cell, x) => {
            if (cell) {
                context.fillStyle = 'grey';
                context.fillRect(
                    posX + x * cellSize, 
                    posY + y * cellSize, 
                    cellSize, 
                    cellSize
                );
            } else {
                context.fillStyle = 'blue';
                context.fillRect(
                    posX + x * cellSize, 
                    posY + y * cellSize, 
                    cellSize, 
                    cellSize
                );
            }
        });
    });
    context.strokeStyle = COLORS.rays;
    const rayLength = PLAYER_SIZE * 2;

    rays.forEach(ray => {
        context.beginPath();
        context.moveTo(player.x * scale + posX, player.y * scale + posY);
        context.lineTo(
            (player.x + Math.cos(ray.angle) * ray.distance) * scale,
            (player.y + Math.sin(ray.angle) * ray.distance) * scale,
        );
        context.closePath();
        context.stroke();
    });

    context.fillStyle = 'orange';
    context.fillRect(
        posX + player.x * scale - PLAYER_SIZE / 2,
        posY + player.y * scale - PLAYER_SIZE / 2,
        PLAYER_SIZE,
        PLAYER_SIZE
    );

    context.strokeStyle = 'orange';
    context.beginPath();
    context.moveTo(player.x * scale + posX, player.y * scale + posY);
    context.lineTo(
        (player.x + Math.cos(player.angle) * rayLength) * scale,
        (player.y + Math.sin(player.angle) * rayLength) * scale,
    );
    context.closePath();
    context.stroke();
}

const gameLoop = () => {
    clearScreen();
    movePlayer();
    const rays = getRays();
    renderScene(rays);
    renderMiniMap(0, 0, 0.75, rays);
}

setInterval(gameLoop, TICK);

document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowUp') {
        player.speed = 2;
    }

    if (e.key === 'ArrowDown') {
        player.speed = -2;
    }

    // need to move these to the gameLoop

    if (e.key === 'ArrowLeft') {
        player.angle -= .05;
    }

    if (e.key === 'ArrowRight') {
        player.angle += .05;
    }
});


document.addEventListener('keyup', (e) => {
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        player.speed = 0;
    }
})