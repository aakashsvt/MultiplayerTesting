import Input from "../Input.js";
import SocketClient from "../network/SocketClient.js";

const BASE_PLAYER_RADIUS = 20;
const PELLET_RADIUS = 8;

export default class Game {
    constructor(ctx) {
        this.ctx = ctx;
        this.speed = 250;
        this.lastTime = 0;
        this.sendAccumulator = 0;
        this.sendRate = 1 / 20;

        this.input = new Input();
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

        if (this.input.isUpPressed()) {
            player.y -= this.speed * delta;
            moved = true;
        }

        if (this.input.isDownPressed()) {
            player.y += this.speed * delta;
            moved = true;
        }

        if (this.input.isLeftPressed()) {
            player.x -= this.speed * delta;
            moved = true;
        }

        if (this.input.isRightPressed()) {
            player.x += this.speed * delta;
            moved = true;
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
