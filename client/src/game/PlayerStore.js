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
        Object.assign(this.players, serverPlayers);
    }

    addPlayer(player) {
        this.players[player.id] = player;
    }

    removePlayer(id) {
        delete this.players[id];
    }

    updatePlayerPosition(id, x, y, radius) {
        const player = this.players[id];

        if (!player) {
            return;
        }

        if (typeof x === "number") {
            player.x = x;
        }

        if (typeof y === "number") {
            player.y = y;
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
