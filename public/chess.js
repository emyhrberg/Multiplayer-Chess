// SOCKETS
const socket = io();
var playerColor = null;

socket.on('playerJoined', (color) => {
    playerColor = color;
    if (color === 'black') board.flip();
});

socket.on('move', (move) => {
    game.move(move);
    board.position(game.fen());
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


function onDrop(source, target) {
    // see if the move is legal
    var move = game.move({ from: source, to: target, promotion: 'q'});

    // illegal move
    if (move === null) return 'snapback';

    // send the move to the server
    socket.emit('move', move);
}

function onSnapEnd() {
    board.position(game.fen());
}
