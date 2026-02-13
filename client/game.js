const socket = io();
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const players = {};
let myId = null;

/* -------------------- INPUT -------------------- */

const keys = {
    up: false,
    down: false,
    left: false,
    right: false
};

window.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowUp') keys.up = true;
    if (e.key === 'ArrowDown') keys.down = true;
    if (e.key === 'ArrowLeft') keys.left = true;
    if (e.key === 'ArrowRight') keys.right = true;
});

window.addEventListener('keyup', (e) => {
    if (e.key === 'ArrowUp') keys.up = false;
    if (e.key === 'ArrowDown') keys.down = false;
    if (e.key === 'ArrowLeft') keys.left = false;
    if (e.key === 'ArrowRight') keys.right = false;
});

/* -------------------- SOCKET EVENTS -------------------- */

socket.on('connect', () => {
    myId = socket.id;
});

socket.on('currentPlayers', (serverPlayers) => {
    console.log('Current players:', serverPlayers);
    Object.assign(players, serverPlayers);
});

socket.on('newPlayer', (player) => {
    players[player.id] = player;
});

socket.on('playerDisconnected', (id) => {
    delete players[id];
});

socket.on('playerMoved', (data) => {
    if (!players[data.id]) return;

    if (data.id === myId) {
        // Server reconciliation for self
        players[data.id].x = data.x;
        players[data.id].y = data.y;
    } else {
        // Update other players
        players[data.id].x = data.x;
        players[data.id].y = data.y;
    }
});

/* -------------------- GAME LOOP -------------------- */

const speed = 250; // pixels per second
let lastTime = 0;
let sendAccumulator = 0;
const sendRate = 1 / 20; // 20 updates per second

function gameLoop(time) {
    const delta = (time - lastTime) / 1000;
    lastTime = time;

    update(delta);
    render();

    requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);

/* -------------------- UPDATE -------------------- */

function update(delta) {
    if (!players[myId]) return;

    const player = players[myId];

    let moved = false;

    if (keys.up) {
        player.y -= speed * delta;
        moved = true;
    }
    if (keys.down) {
        player.y += speed * delta;
        moved = true;
    }
    if (keys.left) {
        player.x -= speed * delta;
        moved = true;
    }
    if (keys.right) {
        player.x += speed * delta;
        moved = true;
    }

    // Send movement at fixed rate, not every frame
    sendAccumulator += delta;

    if (moved) {
        socket.emit('move', {
            x: player.x,
            y: player.y
        });
        sendAccumulator = 0;
    }
}

/* -------------------- RENDER -------------------- */

function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let id in players) {
        const p = players[id];
        ctx.fillStyle = id === myId ? 'red' : 'blue';
        ctx.fillRect(p.x, p.y, 40, 40);
    }
}
