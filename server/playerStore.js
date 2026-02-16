function createPlayerStore() {
    const players = {};

    function add(id, position) {
        players[id] = position;
    }

    function get(id) {
        return players[id] || null;
    }

    function has(id) {
        return Object.prototype.hasOwnProperty.call(players, id);
    }

    function update(id, position) {
        if (!has(id)) {
            return;
        }

        if (typeof position.x === "number") {
            players[id].x = position.x;
        }

        if (typeof position.y === "number") {
            players[id].y = position.y;
        }

        if (typeof position.radius === "number") {
            players[id].radius = position.radius;
        }
    }

    function remove(id) {
        delete players[id];
    }

    function getAll() {
        return players;
    }

    return {
        add,
        get,
        has,
        update,
        remove,
        getAll
    };
}

module.exports = createPlayerStore;
