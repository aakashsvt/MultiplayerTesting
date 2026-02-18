const { WORLD_WIDTH, WORLD_HEIGHT } = require("./worldConfig");

function registerSocketHandlers(io, playerStore, pelletWorld) {
    io.on("connection", socket => {
        console.log("User connected:", socket.id);

        const INITIAL_PLAYER_RADIUS = 20;
        const MAX_PLAYER_RADIUS = 300;
        const initialRadius = INITIAL_PLAYER_RADIUS;
        const minX = initialRadius;
        const maxX = WORLD_WIDTH - initialRadius;
        const minY = initialRadius;
        const maxY = WORLD_HEIGHT - initialRadius;
        const initialPosition = {
            x: Math.random() * (maxX - minX) + minX,
            y: Math.random() * (maxY - minY) + minY
        };

        playerStore.add(socket.id, {
            id: socket.id,
            x: initialPosition.x,
            y: initialPosition.y,
            radius: initialRadius
        });

        socket.emit("currentPlayers", playerStore.getAll());
        socket.emit("currentPellets", pelletWorld.getPellets());

        socket.broadcast.emit("newPlayer", {
            id: socket.id,
            x: initialPosition.x,
            y: initialPosition.y,
            radius: initialRadius
        });

        socket.on("move", movementData => {
            if (!playerStore.has(socket.id)) {
                return;
            }

            const existingPlayer = playerStore.get(socket.id);

            if (!existingPlayer) {
                return;
            }

            const radius = existingPlayer.radius;
            const clampedX = Math.max(radius, Math.min(WORLD_WIDTH - radius, movementData.x));
            const clampedY = Math.max(radius, Math.min(WORLD_HEIGHT - radius, movementData.y));

            const position = {
                x: clampedX,
                y: clampedY,
                radius
            };

            playerStore.update(socket.id, position);

            let finalRadius = position.radius;

            const pelletResult = pelletWorld.handlePlayerPosition(
                position.x,
                position.y,
                position.radius
            );

            if (pelletResult && pelletResult.eatenId) {
                let growth = 0.66;

                if (position.radius >= MAX_PLAYER_RADIUS) {
                    growth = 0;
                } else if (position.radius >= MAX_PLAYER_RADIUS * 0.75) {
                    growth = 0.165;
                } else if (position.radius >= MAX_PLAYER_RADIUS * 0.5) {
                    growth = 0.33;
                }

                finalRadius = Math.min(position.radius + growth, MAX_PLAYER_RADIUS);

                playerStore.update(socket.id, {
                    x: position.x,
                    y: position.y,
                    radius: finalRadius
                });
                io.emit("pelletRemoved", {
                    id: pelletResult.eatenId
                });

                if (pelletResult.spawned) {
                    io.emit("pelletSpawned", pelletResult.spawned);
                }
            }

            io.emit("playerMoved", {
                id: socket.id,
                x: position.x,
                y: position.y,
                radius: finalRadius
            });
        });

        socket.on("disconnect", () => {
            playerStore.remove(socket.id);
            io.emit("playerDisconnected", socket.id);
        });
    });
}

module.exports = registerSocketHandlers;
