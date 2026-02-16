function registerSocketHandlers(io, playerStore, pelletWorld) {
    io.on("connection", socket => {
        console.log("User connected:", socket.id);

        const initialPosition = { x: 100, y: 100 };
        const initialRadius = 20;

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

            const position = {
                x: movementData.x,
                y: movementData.y,
                radius: existingPlayer.radius
            };

            playerStore.update(socket.id, position);

            let finalRadius = position.radius;

            const pelletResult = pelletWorld.handlePlayerPosition(position.x, position.y, position.radius);

            if (pelletResult && pelletResult.eatenId) {
                finalRadius = position.radius * 1.02;

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
