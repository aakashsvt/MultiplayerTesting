const { WORLD_WIDTH, WORLD_HEIGHT } = require("./worldConfig");
const CELL_SIZE = 3;
const PELLET_RADIUS = 10;

function createPelletWorld() {
    const cols = Math.floor(WORLD_WIDTH / CELL_SIZE);
    const rows = Math.floor(WORLD_HEIGHT / CELL_SIZE);

    const grid = [];
    for (let x = 0; x < cols; x += 1) {
        grid[x] = new Array(rows).fill(null);
    }

    const pellets = {};
    let nextId = 1;

    function isValidCell(cellX, cellY) {
        return cellX >= 0 && cellX < cols && cellY >= 0 && cellY < rows;
    }

    function cellToWorld(cellX, cellY) {
        return {
            x: cellX * CELL_SIZE + CELL_SIZE / 2,
            y: cellY * CELL_SIZE + CELL_SIZE / 2
        };
    }

    function worldToCell(x, y) {
        const clampedX = Math.max(0, Math.min(WORLD_WIDTH - 1, x));
        const clampedY = Math.max(0, Math.min(WORLD_HEIGHT - 1, y));

        return {
            cellX: Math.floor(clampedX / CELL_SIZE),
            cellY: Math.floor(clampedY / CELL_SIZE)
        };
    }

    function getPellets() {
        return pellets;
    }

    function getPelletInCell(cellX, cellY) {
        if (!isValidCell(cellX, cellY)) {
            return null;
        }

        const id = grid[cellX][cellY];

        if (id === null) {
            return null;
        }

        return pellets[id] || null;
    }

    function addPelletAtCell(cellX, cellY) {
        if (!isValidCell(cellX, cellY)) {
            return null;
        }

        if (grid[cellX][cellY] !== null) {
            return null;
        }

        const id = String(nextId);
        nextId += 1;

        const worldPosition = cellToWorld(cellX, cellY);

        const pellet = {
            id,
            x: worldPosition.x,
            y: worldPosition.y,
            cellX,
            cellY
        };

        pellets[id] = pellet;
        grid[cellX][cellY] = id;

        return pellet;
    }

    function removePellet(id) {
        const pellet = pellets[id];

        if (!pellet) {
            return null;
        }

        const { cellX, cellY } = pellet;

        if (isValidCell(cellX, cellY) && grid[cellX][cellY] === id) {
            grid[cellX][cellY] = null;
        }

        delete pellets[id];

        return pellet;
    }

    function spawnRandomPellet() {
        const maxAttempts = cols * rows;

        for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
            const cellX = Math.floor(Math.random() * cols);
            const cellY = Math.floor(Math.random() * rows);

            if (grid[cellX][cellY] === null) {
                const pellet = addPelletAtCell(cellX, cellY);

                if (pellet) {
                    return pellet;
                }
            }
        }

        return null;
    }

    function populateInitialPellets(count) {
        for (let i = 0; i < count; i += 1) {
            const pellet = spawnRandomPellet();

            if (!pellet) {
                break;
            }               
        }
    }

    function getPelletNearPosition(x, y, playerRadius) {
        const { cellX, cellY } = worldToCell(x, y);

        const effectivePlayerRadius = typeof playerRadius === "number" ? playerRadius : 20;

        const sumRadius = effectivePlayerRadius + PELLET_RADIUS;                                            
        const sumRadiusSq = sumRadius * sumRadius;

        const cellRadius = Math.max(1, Math.ceil(sumRadius / CELL_SIZE));

        for (let offsetX = -cellRadius; offsetX <= cellRadius; offsetX += 1) {
            for (let offsetY = -cellRadius; offsetY <= cellRadius; offsetY += 1) {
                const neighborX = cellX + offsetX;
                const neighborY = cellY + offsetY;

                const pellet = getPelletInCell(neighborX, neighborY);

                if (!pellet) {
                    continue;
                }

                const dx = pellet.x - x;
                const dy = pellet.y - y;
                const distanceSq = dx * dx + dy * dy;

                if (distanceSq <= sumRadiusSq) {
                    return pellet;
                }
            }
        }

        return null;
    }

    function handlePlayerPosition(x, y, playerRadius) {
        const pellet = getPelletNearPosition(x, y, playerRadius);
        if (!pellet) {
            return null;
        }

        const eatenId = pellet.id;
        removePellet(eatenId);

        const spawned = spawnRandomPellet();

        return {
            eatenId,
            spawned
        };
    }

    const startPelletSpawnCount = 800;
    populateInitialPellets(startPelletSpawnCount);

    return {
        getPellets,
        handlePlayerPosition,
        spawnRandomPellet
    };
}

module.exports = createPelletWorld;
