// Set up a simple server that listens for connections and broadcasts messages to all connected clients.
const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const path = require('path');

// Create the express app
const app = express();
const server = http.createServer(app);
const io = socketIO(server);

// Serve the index.html file
app.use(express.static(path.join(__dirname)));
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Important part of the code
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

// Time
let whiteTime = 100;
let blackTime = 100;
let currentPlayer = 'white';

// Variables
let whiteSocket = null;
let blackSocket = null;

// Listen for connections
io.on('connection', function(socket) {

  // Connect both players to the game and assign colors
  // Set their respective socket to be the white or black socket
    if (!whiteSocket) {
        whiteSocket = socket;
        socket.playerColor = 'white';
        socket.emit('playerColor', 'white');
        console.log("white joined");

        if (blackSocket) {
            io.emit('gameStarted'); // White player has joined
        }
    } else if (!blackSocket) {
        blackSocket = socket;
        socket.playerColor = 'black';
        socket.emit('playerColor', 'black');
        console.log("black joined");
        io.emit('gameStarted'); // Both players have joined
    } else {
      // game full (server already has 2 clients)
      socket.emit('reject');
      socket.disconnect();
      return;
    }

    // Listen for moves and broadcast them to the other player
    socket.on('move', function(data) {
      // received a move from client
      console.log(socket.playerColor, 'player moved: ', data.move);
      socket.broadcast.emit('move', data);
      currentPlayer = (currentPlayer === 'white') ? 'black' : 'white';
      updateTimer();
    })

    // Listen for disconnects
    socket.on('disconnect', function() {
      console.log(socket.playerColor + ' left');
      if (socket.playerColor === 'white') {
        whiteSocket = null;
      } else {
        blackSocket = null;
      }
      io.emit('resetGame')
    });

    // If either player disconnects, reset the game
    if (!whiteSocket || !blackSocket) {
      if (whiteSocket) whiteSocket.emit('resetGame');
      if (blackSocket) blackSocket.emit('resetGame');
      io.emit('waitingForPlayer');
  }

  // update timer
  function updateTimer() {
    let intervalId = setInterval(() => {
        if (currentPlayer === 'white') {
            whiteTime -= 1;
        } else {
            blackTime -= 1;
        }
        io.emit('timer', { whiteTime, blackTime });
    }, 1000);
}
});

// Listen on this port
const port = 3000;
server.listen(port);
console.log('[*] Server is running on localhost:' + port);
