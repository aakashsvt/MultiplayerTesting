import Input from "../Input.js";
import SocketClient from "../network/SocketClient.js";
import { BASE_PLAYER_RADIUS, PELLET_RADIUS, WORLD_WIDTH, WORLD_HEIGHT } from "../config.js";

export default class Game {
    constructor(ctx) {
        this.ctx = ctx;
        this.baseSpeed = 300;
        this.minSpeedFactor = 0.3;
        this.maxSpeed = 600;
        this.lastTime = 0;
        this.sendAccumulator = 0;
        this.sendRate = 1 / 20;
        this.input = new Input(this.ctx.canvas);
        this.socketClient = new SocketClient();

        this.pelletImage = new Image();
        this.pelletImageLoaded = false;
        this.pelletImage.src = "assets/sprite.png";
        this.pelletImage.onload = () => {
            this.pelletImageLoaded = true;
        };
    }

    update(delta) {
        const player = this.socketClient.getMyPlayer();
        const myCells = this.socketClient.getMyCells();

        if (!player || !myCells || !myCells.length) {
            return;
        }

        const mouse = this.input.getMousePosition();
        const canvas = this.ctx.canvas;
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;

        let dirX = 0;
        let dirY = 0;
        let hasDirection = false;

        if (mouse && typeof mouse.x === "number" && typeof mouse.y === "number") {
            const dx = mouse.x - centerX;
            const dy = mouse.y - centerY;
            const distanceSq = dx * dx + dy * dy;

            if (distanceSq > 0.0001) {
                const distance = Math.sqrt(distanceSq);
                dirX = dx / distance;
                dirY = dy / distance;
                hasDirection = true;
            }
        }

        let anyMoved = false;

        if (hasDirection) {
            for (let i = 0; i < myCells.length; i += 1) {
                const cell = myCells[i];

                const radius =
                    typeof cell.radius === "number" ? cell.radius : BASE_PLAYER_RADIUS;
                const normalizedRadius = radius / BASE_PLAYER_RADIUS;
                const mass = normalizedRadius * normalizedRadius;

                let speedFactor = 1 / Math.sqrt(mass);

                if (!Number.isFinite(speedFactor) || speedFactor <= 0) {
                    speedFactor = 1;
                }

                speedFactor = Math.max(speedFactor, this.minSpeedFactor);

                const maxSpeedFactor = this.maxSpeed / this.baseSpeed;

                if (Number.isFinite(maxSpeedFactor) && maxSpeedFactor > 0) {
                    speedFactor = Math.min(speedFactor, maxSpeedFactor);
                }

                const currentSpeed = this.baseSpeed * speedFactor;
                const maxStep = currentSpeed * delta;

                const stepX = dirX * maxStep;
                const stepY = dirY * maxStep;

                cell.worldX += stepX;
                cell.worldY += stepY;

                const minX = radius;
                const maxX = WORLD_WIDTH - radius;
                const minY = radius;
                const maxY = WORLD_HEIGHT - radius;

                if (cell.worldX < minX) {
                    cell.worldX = minX;
                } else if (cell.worldX > maxX) {
                    cell.worldX = maxX;
                }

                if (cell.worldY < minY) {
                    cell.worldY = minY;
                } else if (cell.worldY > maxY) {
                    cell.worldY = maxY;
                }

                anyMoved = true;
            }
        }

        if (hasDirection && this.input.consumeSplitRequest()) {
            this.socketClient.emitSplit(player.worldX, player.worldY, dirX, dirY);
        }

        this.sendAccumulator += delta;

        if (anyMoved) {
            const cellsToSend = myCells.map(cell => ({
                id: cell.id,
                x: cell.worldX,
                y: cell.worldY
            }));

            this.socketClient.emitMove(cellsToSend);
            this.sendAccumulator = 0;
        }
    }

    render() {
        const canvas = this.ctx.canvas;
        const player = this.socketClient.getMyPlayer();

        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
        this.ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (!player) {
            return;
        }

        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;

        this.ctx.translate(centerX - player.worldX, centerY - player.worldY);

        const gridSize = 50;
        const extraCells = 20;
        const halfWidth = canvas.width / 2;
        const halfHeight = canvas.height / 2;
        const worldMinX = -gridSize * extraCells;
        const worldMaxX = WORLD_WIDTH + gridSize * extraCells;
        const worldMinY = -gridSize * extraCells;
        const worldMaxY = WORLD_HEIGHT + gridSize * extraCells;
        const rawLeft = player.worldX - halfWidth;
        const rawRight = player.worldX + halfWidth;
        const rawTop = player.worldY - halfHeight;
        const rawBottom = player.worldY + halfHeight;
        const viewLeft = Math.max(worldMinX, rawLeft);
        const viewRight = Math.min(worldMaxX, rawRight);
        const viewTop = Math.max(worldMinY, rawTop);
        const viewBottom = Math.min(worldMaxY, rawBottom);

        this.ctx.strokeStyle = "black";
        this.ctx.lineWidth = 0.5;
        this.ctx.beginPath();

        const firstVertical = Math.floor(viewLeft / gridSize) * gridSize;
        const lastVertical = Math.ceil(viewRight / gridSize) * gridSize;

        for (let x = firstVertical; x <= lastVertical; x += gridSize) {
            this.ctx.moveTo(x, viewTop);
            this.ctx.lineTo(x, viewBottom);
        }

        const firstHorizontal = Math.floor(viewTop / gridSize) * gridSize;
        const lastHorizontal = Math.ceil(viewBottom / gridSize) * gridSize;

        for (let y = firstHorizontal; y <= lastHorizontal; y += gridSize) {
            this.ctx.moveTo(viewLeft, y);
            this.ctx.lineTo(viewRight, y);
        }

        this.ctx.stroke();

        const pellets = this.socketClient.getPellets();

        for (const id in pellets) {
            const pellet = pellets[id];
            const pelletRadius = PELLET_RADIUS * 1.1;

            this.ctx.fillStyle = "green";
            this.ctx.beginPath();
            this.ctx.arc(pellet.x, pellet.y, pelletRadius, 0, Math.PI * 2);
            this.ctx.fill();
        }

        const players = this.socketClient.getPlayers();
        const myId = this.socketClient.getMyId();

        for (const id in players) {
            const currentPlayer = players[id];

            const radius =
                typeof currentPlayer.radius === "number" ? currentPlayer.radius : BASE_PLAYER_RADIUS;

            const isMyPlayer = id === myId || (typeof myId === "string" && id.startsWith(myId + ":"));

            this.ctx.fillStyle = isMyPlayer ? "red" : "blue";
            this.ctx.beginPath();
            this.ctx.arc(currentPlayer.worldX, currentPlayer.worldY, radius, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }
}
