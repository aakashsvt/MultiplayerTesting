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

            const ownerId = typeof serverPlayer.id === "string"
                ? serverPlayer.id.split(":")[0]
                : serverPlayer.id;

            this.players[id] = {
                id: serverPlayer.id,
                ownerId,
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

        const ownerId =
            typeof player.id === "string" ? player.id.split(":")[0] : player.id;

        this.players[player.id] = {
            id: player.id,
            ownerId,
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

    getCellsForOwner(ownerId) {
        const result = [];

        if (!ownerId) {
            return result;
        }

        for (const id in this.players) {
            const player = this.players[id];

            if (player && player.ownerId === ownerId) {
                result.push(player);
            }
        }

        return result;
    }

    getMyCells() {
        if (!this.myId) {
            return [];
        }

        return this.getCellsForOwner(this.myId);
    }

    getMainCellForOwner(ownerId) {
        if (!ownerId) {
            return null;
        }

        const mainCell = this.players[ownerId];

        if (mainCell) {
            return mainCell;
        }

        const cells = this.getCellsForOwner(ownerId);

        if (!cells.length) {
            return null;
        }

        let largest = cells[0];

        for (let i = 1; i < cells.length; i += 1) {
            const cell = cells[i];

            if (typeof cell.radius === "number" && cell.radius > largest.radius) {
                largest = cell;
            }
        }

        return largest;
    }

    getMyPlayer() {
        if (!this.myId) {
            return null;
        }

        return this.getMainCellForOwner(this.myId);
    }
}
