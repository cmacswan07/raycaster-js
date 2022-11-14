const SCREEN_WIDTH = window.innerWidth;
const SCREEN_HEIGHT = window.innerHeight;

const canvas = document.createElement('canvas');
canvas.setAttribute('width', SCREEN_WIDTH);
canvas.setAttribute('height', SCREEN_HEIGHT);
document.body.appendChild(canvas);

const context = canvas.getContext('2d');
const TICK = 30;
const CELL_SIZE = 64;
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
    Y: CELL_SIZE * 2,
    angle: 0,
    speed: 0
};

const clearScreen = () => {
    context.fillStyle = 'red';
    context.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
}

const movePlayer = () => {

}

const getRays = () => {
    return [];
}

const renderScene = () => {

}

const renderMiniMap = (posX = 0, posY = 0, scale, rays) => {
    const cellSize = scale * CELL_SIZE;
    map.forEach((row, y) => {
        row.forEach((cell, x) => {
            if (cell) {
                context.fillStyle = 'grey';
                context.fillRect(posX + x * cellSize, posY + y * cellSize, cellSize, cellSize);
            }
        })
    })
}

const gameLoop = () => {
    clearScreen();
    movePlayer();
    const rays = getRays();
    renderScene(rays);
    renderMiniMap(0, 0, 0.75, rays);
}

setInterval(gameLoop, TICK);