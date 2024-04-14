// Create a server with express
const express = require('express');
const app = express();
const server = require('http').createServer(app);
const socket = require('socket.io')(server);

// Show the static index.html file in public folder
app.use(express.static(__dirname + '/public'));

// Keep track of the players
var playerCount = 0;
var white = {id: null, time: 30};
var black = {id: null, time: 30};

// Handle players joining the game
socket.on('connection', (socket) => {
    playerCount += 1;

    // Assign the current player a color
    if (playerCount === 1 && !white.id) {
        white.id = socket.id;
        socket.emit('playerJoined', 'white');
        console.log('white joined')
    } else if (playerCount === 2 && !black.id) {
        black.id = socket.id;
        socket.emit('playerJoined', 'black');
        console.log('black joined')
    }

    // Handle a player's move
    // Receives a move from the player and broadcast to the other player
    socket.on('move', (move) => {
        socket.broadcast.emit('move', move);
        // console.log(move.color, ' move: ', move.san)
    });

    // Handle player disconnect
    // Give the first player white and the second player black
    socket.on('disconnect', () => {
        playerCount -= 1;
        if (socket.id === white.id) {
            white.id = null;
            console.log('white disconnected')
        }
        if (socket.id === black.id) {
            black.id = null;
            console.log('black disconnected')
        }
    });

});


// Start the server on port 4000
const PORT = 4000;
server.listen(PORT);
console.log(`Server is running on port ${PORT}`);
