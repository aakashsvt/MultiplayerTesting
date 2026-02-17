import Input from "../Input.js";
import SocketClient from "../network/SocketClient.js";

const BASE_PLAYER_RADIUS = 20;
const PELLET_RADIUS = 8;

export default class Game {
    constructor(ctx) {
        this.ctx = ctx;
        this.baseSpeed = 250;
        this.minSpeedFactor = 0.15;
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

        if (!player) {
            return;
        }

        let moved = false;

        const mouse = this.input.getMousePosition();

        if (mouse && typeof mouse.x === "number" && typeof mouse.y === "number") {
            const dx = mouse.x - player.x;
            const dy = mouse.y - player.y;
            const distanceSq = dx * dx + dy * dy;

            if (distanceSq > 1) {
                const distance = Math.sqrt(distanceSq);
                const radius =
                    typeof player.radius === "number" ? player.radius : BASE_PLAYER_RADIUS;
                const normalizedRadius = radius / BASE_PLAYER_RADIUS;
                const mass = normalizedRadius * normalizedRadius;

                let speedFactor = 1 / Math.sqrt(mass);

                if (!Number.isFinite(speedFactor) || speedFactor <= 0) {
                    speedFactor = 1;
                }

                speedFactor = Math.max(speedFactor, this.minSpeedFactor);

                const currentSpeed = this.baseSpeed * speedFactor;
                const maxStep = currentSpeed * delta;
                const step = Math.min(maxStep, distance);
                const ratio = step / distance;

                player.x += dx * ratio;
                player.y += dy * ratio;

                const rect = this.ctx.canvas.getBoundingClientRect();
                const minX = radius;
                const maxX = rect.width - radius;
                const minY = radius;
                const maxY = rect.height - radius;

                if (player.x < minX) {
                    player.x = minX;
                } else if (player.x > maxX) {
                    player.x = maxX;
                }

                if (player.y < minY) {
                    player.y = minY;
                } else if (player.y > maxY) {
                    player.y = maxY;
                }
                moved = true;
            }
        }

        this.sendAccumulator += delta;

        if (moved) {
            this.socketClient.emitMove(player.x, player.y);
            this.sendAccumulator = 0;
        }
    }

    render() {
        const canvas = this.ctx.canvas;

        this.ctx.clearRect(0, 0, canvas.width, canvas.height);

        const pellets = this.socketClient.getPellets();

        for (const id in pellets) {
            const pellet = pellets[id];

            if (this.pelletImageLoaded) {
                const size = PELLET_RADIUS * 2;
                this.ctx.drawImage(
                    this.pelletImage,
                    pellet.x - size / 2,
                    pellet.y - size / 2,
                    size,
                    size
                );
            } else {
                this.ctx.fillStyle = "green";
                this.ctx.beginPath();
                this.ctx.arc(pellet.x, pellet.y, PELLET_RADIUS, 0, Math.PI * 2);
                this.ctx.fill();
            }
        }

        const players = this.socketClient.getPlayers();
        const myId = this.socketClient.getMyId();

        for (const id in players) {
            const player = players[id];

            const radius = typeof player.radius === "number" ? player.radius : BASE_PLAYER_RADIUS;

            this.ctx.fillStyle = id === myId ? "red" : "blue";
            this.ctx.beginPath();
            this.ctx.arc(player.x, player.y, radius, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }
}
