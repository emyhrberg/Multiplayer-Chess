// Create a server with express
const express = require('express');
const app = express();
const server = require('http').createServer(app);
const socket = require('socket.io')(server);

// Show the static index.html file in public folder
app.use(express.static(__dirname + '/public'));

// Keep track of the players
let playerCount = 0;

// Handle players joining the game
socket.on('connection', (socket) => {

    // Assign the player a color
    playerCount++;
    if (playerCount === 1) {
        socket.emit('playerJoined', 'white');
        console.log('white joined')
    } else {
        socket.emit('playerJoined', 'black');
        console.log('black joined')
    }

    // Handle a player's move
    // Receives a move from the player and broadcast to the other player
    socket.on('move', (move) => {
        socket.broadcast.emit('move', move);
        console.log('[server.js] ' + move.color, ' move: ', move.san)
    });
});

// Start the server on port 4000
const PORT = 4000;
server.listen(PORT);
console.log(`Server is running on port ${PORT}`);
