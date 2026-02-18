export default class PlayerStore {
    constructor() {
        this.players = {};
        this.myId = null;
    }

    setMyId(id) {
        this.myId = id;
    }

    getMyId() {
        return this.myId;
    }

    setPlayers(serverPlayers) {
        this.players = {};

        for (const id in serverPlayers) {
            const serverPlayer = serverPlayers[id];

            if (!serverPlayer || !serverPlayer.id) {
                continue;
            }

            this.players[id] = {
                id: serverPlayer.id,
                worldX: serverPlayer.x,
                worldY: serverPlayer.y,
                radius: serverPlayer.radius
            };
        }
    }

    addPlayer(player) {
        if (!player || !player.id) {
            return;
        }

        this.players[player.id] = {
            id: player.id,
            worldX: player.x,
            worldY: player.y,
            radius: player.radius
        };
    }

    removePlayer(id) {
        delete this.players[id];
    }

    updatePlayerPosition(id, worldX, worldY, radius) {
        const player = this.players[id];

        if (!player) {
            return;
        }

        if (typeof worldX === "number") {
            player.worldX = worldX;
        }

        if (typeof worldY === "number") {
            player.worldY = worldY;
        }

        if (typeof radius === "number") {
            player.radius = radius;
        }
    }

    getPlayers() {
        return this.players;
    }

    getMyPlayer() {
        if (!this.myId) {
            return null;
        }

        return this.players[this.myId] || null;
    }
}
