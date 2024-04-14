// SOCKETS
const socket = io();
var playerColor = null;

// When a player joins, we receive a color from the server
socket.on('playerJoined', (color) => {
    playerColor = color;
    console.log("got color: ", color);
    if (color === 'black') {
        board.flip();
        document.getElementById('topTimer').innerText = "White Time: 30.0s";
        document.getElementById('botTimer').innerText = "Black Time: 30.0s";
    } else if (color === 'white') {
        document.getElementById('topTimer').innerText = "Black Time: 30.0s";
        document.getElementById('botTimer').innerText = "White Time: 30.0s";
    }
});

// When we receive a move from the server
socket.on('move', (move) => {
    game.move(move);
    board.position(game.fen());
});

// When we receive a time sync request from the server (all the time)
// Update the timer on the client side for the other player
socket.on('timer', (times) => {
    console.log("Received times: ", times);

    if (playerColor === 'white') {
        document.getElementById('botTimer').innerText = "White Time: " + times.white + "s";
        document.getElementById('topTimer').innerText = "Black Time: " + times.black + "s";
    } else if (playerColor === 'black') {
        document.getElementById('topTimer').innerText = "White Time: " + times.white + "s";
        document.getElementById('botTimer').innerText = "Black Time: " + times.black + "s";
    }
});

socket.on('game-over', (message) => {
    alert(message); // Display an alert to the user
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
    if ((playerColor === 'white' && piece.search(/^b/) !== -1)) return false;
    if ((playerColor === 'black' && piece.search(/^w/) !== -1)) return false;

    // only allow the player to move on their turn
    if (playerColor === 'white' && game.turn() === 'b') return false;
    if (playerColor === 'black' && game.turn() === 'w') return false;
}

function onSnapEnd() {
    board.position(game.fen());
}
