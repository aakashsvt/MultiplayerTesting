const express = require('express');
const { createServer } = require('node:http');
const { Server } = require('socket.io');
const path = require('node:path');

const app = express();
const server = createServer(app)
const io = new Server(server);

app.use(express.static("client"));

const players = {};

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    players[socket.id] = { x: 100, y: 100 };

    socket.emit('currentPlayers', players);

    socket.broadcast.emit('newPlayer', {
        id: socket.id,
        x: 100,
        y: 100
    });

    // MOVE HANDLER MUST BE HERE
    socket.on('move', (movementData) => {
        if (!players[socket.id]) return;

        players[socket.id].x = movementData.x;
        players[socket.id].y = movementData.y;

        io.emit('playerMoved', {
            id: socket.id,
            x: movementData.x,
            y: movementData.y
        });
    });

    socket.on('disconnect', () => {
        delete players[socket.id];
        io.emit('playerDisconnected', socket.id);
    });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});
