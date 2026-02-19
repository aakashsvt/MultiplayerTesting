const { WORLD_WIDTH, WORLD_HEIGHT } = require("./worldConfig");

const INITIAL_PLAYER_RADIUS = 20;
const MAX_PLAYER_RADIUS = 300;
const SPLIT_COOLDOWN_MS = 1000;
const MINIMUM_RADIUS_TO_SPLIT = 30;

function clampToWorldAxis(value, radius, worldLimit) {
    const min = radius;
    const max = worldLimit - radius;

    if (value < min) {
        return min;
    }

    if (value > max) {
        return max;
    }

    return value;
}

function clampPosition(x, y, radius) {
    return {
        x: clampToWorldAxis(x, radius, WORLD_WIDTH),
        y: clampToWorldAxis(y, radius, WORLD_HEIGHT)
    };
}

function getNextRadius(currentRadius) {
    let growth = 0.66;

    if (currentRadius >= MAX_PLAYER_RADIUS) {
        growth = 0;
    } else if (currentRadius >= MAX_PLAYER_RADIUS * 0.75) {
        growth = 0.165;
    } else if (currentRadius >= MAX_PLAYER_RADIUS * 0.5) {
        growth = 0.33;
    }

    return Math.min(currentRadius + growth, MAX_PLAYER_RADIUS);
}

function createInitialPosition(initialRadius) {
    const minX = initialRadius;
    const maxX = WORLD_WIDTH - initialRadius;
    const minY = initialRadius;
    const maxY = WORLD_HEIGHT - initialRadius;

    return {
        x: Math.random() * (maxX - minX) + minX,
        y: Math.random() * (maxY - minY) + minY
    };
}

function ensureCellListForSocket(playerCellsBySocket, socketId) {
    if (!playerCellsBySocket[socketId]) {
        playerCellsBySocket[socketId] = [];
    }

    return playerCellsBySocket[socketId];
}

function registerSocketHandlers(io, playerStore, pelletWorld) {
    const playerCellsBySocket = {};
    const lastSplitTimeBySocket = {};
    let nextCellIndex = 1;

    io.on("connection", socket => {
        console.log("User connected:", socket.id);

        const initialRadius = INITIAL_PLAYER_RADIUS;
        const initialPosition = createInitialPosition(initialRadius);

        playerStore.add(socket.id, {
            id: socket.id,
            x: initialPosition.x,
            y: initialPosition.y,
            radius: initialRadius
        });

        const socketCells = ensureCellListForSocket(playerCellsBySocket, socket.id);
        socketCells.push(socket.id);

        socket.emit("currentPlayers", playerStore.getAll());
        socket.emit("currentPellets", pelletWorld.getPellets());

        socket.broadcast.emit("newPlayer", {
            id: socket.id,
            x: initialPosition.x,
            y: initialPosition.y,
            radius: initialRadius
        });

        socket.on("move", movementData => {
            if (!movementData || !Array.isArray(movementData.cells)) {
                return;
            }

            const movedCells = movementData.cells;

            for (let i = 0; i < movedCells.length; i += 1) {
                const cellMove = movedCells[i];

                if (!cellMove || typeof cellMove.id !== "string") {
                    continue;
                }

                const cellId = cellMove.id;

                if (!playerStore.has(cellId)) {
                    continue;
                }

                const existingPlayer = playerStore.get(cellId);

                if (!existingPlayer) {
                    continue;
                }

                const radius = existingPlayer.radius;

                const targetX = typeof cellMove.x === "number" ? cellMove.x : existingPlayer.x;
                const targetY = typeof cellMove.y === "number" ? cellMove.y : existingPlayer.y;

                const clampedPosition = clampPosition(targetX, targetY, radius);

                const position = {
                    x: clampedPosition.x,
                    y: clampedPosition.y,
                    radius
                };

                playerStore.update(cellId, position);

                let finalRadius = position.radius;

                const pelletResult = pelletWorld.handlePlayerPosition(
                    position.x,
                    position.y,
                    position.radius
                );

                if (pelletResult && pelletResult.eatenId) {
                    const nextRadius = getNextRadius(position.radius);

                    finalRadius = nextRadius;

                    playerStore.update(cellId, {
                        x: position.x,
                        y: position.y,
                        radius: nextRadius
                    });
                    io.emit("pelletRemoved", {
                        id: pelletResult.eatenId
                    });

                    if (pelletResult.spawned) {
                        io.emit("pelletSpawned", pelletResult.spawned);
                    }
                }

                io.emit("playerMoved", {
                    id: cellId,
                    x: position.x,
                    y: position.y,
                    radius: finalRadius
                });
            }
        });

        socket.on("disconnect", () => {
            const cells = playerCellsBySocket[socket.id];

            if (cells && cells.length > 0) {
                cells.forEach(cellId => {
                    playerStore.remove(cellId);
                    io.emit("playerDisconnected", cellId);
                });
                delete playerCellsBySocket[socket.id];
            } else {
                playerStore.remove(socket.id);
                io.emit("playerDisconnected", socket.id);
            }

            delete lastSplitTimeBySocket[socket.id];
        });

        socket.on("split", data => {
            if (!playerStore.has(socket.id)) {
                return;
            }

            const now = Date.now();
            const lastTime = lastSplitTimeBySocket[socket.id] || 0;

            if (now - lastTime < SPLIT_COOLDOWN_MS) {
                return;
            }

            const dirX = typeof data.dirX === "number" ? data.dirX : 0;
            const dirY = typeof data.dirY === "number" ? data.dirY : 0;
            const lenSq = dirX * dirX + dirY * dirY;

            if (lenSq <= 0) {
                return;
            }

            const len = Math.sqrt(lenSq);
            const normX = dirX / len;
            const normY = dirY / len;
            const cellsForSocket = playerCellsBySocket[socket.id];
            const cellIds =
                Array.isArray(cellsForSocket) && cellsForSocket.length > 0
                    ? cellsForSocket.slice()
                    : [socket.id];

            const socketCells = ensureCellListForSocket(playerCellsBySocket, socket.id);

            let didSplit = false;

            for (let i = 0; i < cellIds.length; i += 1) {
                const cellId = cellIds[i];

                if (!playerStore.has(cellId)) {
                    continue;
                }

                const cell = playerStore.get(cellId);

                if (!cell) {
                    continue;
                }

                const currentRadius = cell.radius;

                if (typeof currentRadius !== "number" || currentRadius < MINIMUM_RADIUS_TO_SPLIT) {
                    continue;
                }

                const newRadius = currentRadius / Math.sqrt(2);

                const updatedCell = {
                    x: cell.x,
                    y: cell.y,
                    radius: newRadius
                };

                playerStore.update(cellId, updatedCell);

                const offsetDistance = newRadius * 4;

                const newX = clampToWorldAxis(cell.x + normX * offsetDistance, newRadius, WORLD_WIDTH);
                const newY = clampToWorldAxis(cell.y + normY * offsetDistance, newRadius, WORLD_HEIGHT);

                const newCellId = `${socket.id}:${nextCellIndex}`;
                nextCellIndex += 1;

                const newCell = {
                    id: newCellId,
                    x: newX,
                    y: newY,
                    radius: newRadius
                };

                playerStore.add(newCellId, newCell);
                socketCells.push(newCellId);

                io.emit("playerMoved", {
                    id: cellId,
                    x: updatedCell.x,
                    y: updatedCell.y,
                    radius: updatedCell.radius
                });

                io.emit("newPlayer", newCell);

                didSplit = true;
            }

            if (didSplit) {
                lastSplitTimeBySocket[socket.id] = now;
            }
        });
    });
}

module.exports = registerSocketHandlers;
