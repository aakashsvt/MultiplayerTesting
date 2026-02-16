import PlayerStore from "../game/PlayerStore.js";

export default class SocketClient {
    constructor() {
        this.playerStore = new PlayerStore();
        this.socket = io();
        this.pellets = {};

        this.registerEvents();
    }

    registerEvents() {
        this.socket.on("connect", () => {
            this.playerStore.setMyId(this.socket.id);
            console.log("Connected with ID:", this.socket.id);
        });

        this.socket.on("currentPlayers", serverPlayers => {
            console.log("Current players:", serverPlayers);
            this.playerStore.setPlayers(serverPlayers);
        });

        this.socket.on("currentPellets", serverPellets => {
            this.pellets = serverPellets || {};
        });

        this.socket.on("newPlayer", player => {
            this.playerStore.addPlayer(player);
        });

        this.socket.on("playerDisconnected", id => {
            this.playerStore.removePlayer(id);
        });

        this.socket.on("playerMoved", data => {
            const myId = this.playerStore.getMyId();
            const players = this.playerStore.getPlayers();

            if (!players[data.id]) {
                return;
            }

            const radius = typeof data.radius === "number" ? data.radius : undefined;

            if (data.id === myId) {
                this.playerStore.updatePlayerPosition(data.id, undefined, undefined, radius);
                return;
            }

            this.playerStore.updatePlayerPosition(data.id, data.x, data.y, radius);
        });

        this.socket.on("pelletRemoved", data => {
            const id = data && data.id;

            if (!id) {
                return;
            }

            delete this.pellets[id];
        });

        this.socket.on("pelletSpawned", pellet => {
            if (!pellet || !pellet.id) {
                return;
            }

            this.pellets[pellet.id] = pellet;
        });
    }

    getPlayers() {
        return this.playerStore.getPlayers();
    }

    getMyPlayer() {
        return this.playerStore.getMyPlayer();
    }

    getMyId() {
        return this.playerStore.getMyId();
    }

    getPellets() {
        return this.pellets;
    }

    emitMove(x, y) {
        this.socket.emit("move", { x, y });
    }
}
