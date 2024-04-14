// Create a server with express
const express = require('express');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);

// Show the static index.html file in public folder
app.use(express.static(__dirname + '/public'));

// Keep track of the players
const initialTime = 120 * 1000; // milliseconds
var currentPlayerTurn = 'white';
var gameStarted = false;
var gameEnded = false; // flag to indicate if the game has ended
var white = { id: null, time: initialTime, lastUpdated: null };
var black = { id: null, time: initialTime, lastUpdated: null };

// Update timer every 100 ms
setInterval(() => {
    const now = Date.now();
    if (white.id && black.id && gameStarted && !gameEnded) {
        if (currentPlayerTurn === 'black' && white.lastUpdated) {
            // If its black's turn, decrement white's time
            white.time -= now - white.lastUpdated;
            white.lastUpdated = now;
        } else if (currentPlayerTurn === 'white' && black.lastUpdated) {
            // If its white's turn, decrement black's time
            black.time -= now - black.lastUpdated;
            black.lastUpdated = now;
        }

        // Send both times to all clients
        io.emit('timer', {
            white: (white.time / 1000).toFixed(1),
            black: (black.time / 1000).toFixed(1)
        });

        if (white.time <= 0 || black.time <= 0) {
            gameEnded = true;
            const loser = white.time <= 0 ? 'White' : 'Black';
            io.emit('game-over', loser);
            return;
        }
    }
}, 100);

// Handle players joining
io.on('connection', (socket) => {
    // Assign the current player a color
    if (!white.id) {
        white.id = socket.id;
        socket.emit('playerJoined', {color: 'white', time: initialTime});
        console.log('White joined');
    } else if (!black.id) {
        currentPlayerTurn = 'black';
        black.id = socket.id;
        socket.emit('playerJoined', {color: 'black', time: initialTime});
        console.log('Black joined');
    }

    // Handle a player's move
    socket.on('move', (move) => {
        // Start the timer for the opponent on the first move of the game
        if (!gameStarted) {
            gameStarted = true;
            black.lastUpdated = Date.now(); // Start black's timer after white's first move
        }

        if (!gameEnded) {
            // Switch the current player after a move
            currentPlayerTurn = currentPlayerTurn === 'white' ? 'black' : 'white';

            // Update the lastUpdated for the current player's timer to start
            if (currentPlayerTurn === 'white') {
                black.lastUpdated = Date.now();
            } else if (currentPlayerTurn === "black") {
                white.lastUpdated = Date.now();
            }

            socket.broadcast.emit('move', move);
        }
    });

    // Handle player disconnect
    socket.on('disconnect', () => {
        if (socket.id === white.id) {
            white = { id: null, time: initialTime, lastUpdated: null };
            console.log('White left');
        } else if (socket.id === black.id) {
            black = { id: null, time: initialTime, lastUpdated: null };
            console.log('Black left');
        }

        gameEnded = false;
        gameStarted = false;
        currentPlayerTurn = 'white';
    });
});

server.listen(3000, () => console.log('Server is running on: 3000'));
