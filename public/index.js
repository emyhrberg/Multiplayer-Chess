// SOCKETS
const socket = io();
var color = null;
var time = null;

// When a player joins, we receive a color from the server
socket.on('playerJoined', (colorAndTime) => {
    color = colorAndTime.color;
    console.log('you are', colorAndTime)
    const time = (colorAndTime.time / 1000).toFixed(1);

    // Set timer default text and styling depending on the player's color
    document.getElementById('topTimer').textContent = time;
    document.getElementById('botTimer').textContent = time;
    if (color === 'black') {
        board.flip();
        document.getElementById('topTimer').className = 'timer white-timer';
        document.getElementById('botTimer').className = 'timer black-timer';
    } else if (color === 'white') {
        document.getElementById('topTimer').className = 'timer black-timer';
        document.getElementById('botTimer').className = 'timer white-timer';
    }
});

// When we receive a time sync request from the server (all the time)
// Update the timer on the client side for the other player
socket.on('timer', (times) => {
    console.log("Received times: ", times);
    const topTimer = document.getElementById('topTimer');
    const botTimer = document.getElementById('botTimer');

    if (color === 'white') {
        topTimer.textContent = times.black
        botTimer.textContent = times.white
    } else if (color === 'black') {
        topTimer.textContent = times.white
        botTimer.textContent = times.black
    }
});

// When we receive a move from the server
socket.on('move', (move) => {
    game.move(move); // Assuming 'game' is defined and manages game logic
    board.position(game.fen()); // Assuming 'board' is defined and manages the board state
});

socket.on('game-over', (loser) => {
    alert("Game Over! ", loser, " loses on time"); // Display an alert to the user
});

// CHESS
const game = new Chess();

var boardConfig = {
    'draggable': true, 
    'position': 'start', 
    'pieceTheme': 'https://chessboardjs.com/img/chesspieces/wikipedia/{piece}.png',
    onDragStart,
    onDrop,
    onSnapEnd
};

var board = Chessboard('myBoard', boardConfig);

function onDrop(source, target) {
    // see if the move is legal
    var move = game.move({ from: source, to: target, promotion: 'q'});
    if (move === null) return 'snapback'; // illegal move

    // send the move to the server
    socket.emit('move', move);
}

function onDragStart(source, piece, position, orientation) {
    // game over
    if (game.game_over()) return false;

    // only allow the player to move their own pieces
    if ((color === 'white' && piece.search(/^b/) !== -1)) return false;
    if ((color === 'black' && piece.search(/^w/) !== -1)) return false;

    // only allow the player to move on their turn
    if (color === 'white' && game.turn() === 'b') return false;
    if (color === 'black' && game.turn() === 'w') return false;
}

function onSnapEnd() {
    board.position(game.fen());
}
