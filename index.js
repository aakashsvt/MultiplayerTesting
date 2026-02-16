const express = require("express");
const { createServer } = require("node:http");
const { Server } = require("socket.io");

const createPlayerStore = require("./server/playerStore");
const createPelletWorld = require("./server/pelletWorld");
const registerSocketHandlers = require("./server/socketHandlers");

const app = express();
const server = createServer(app);
const io = new Server(server);

app.use(express.static("client"));

const playerStore = createPlayerStore();
const pelletWorld = createPelletWorld();

registerSocketHandlers(io, playerStore, pelletWorld);

const PORT = process.env.PORT || 3000;

server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
});
