// Description: Client side code for the chess game.

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~	
// Sockets and networking
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
var socket = io()

// Listen for playerColor event from the server
socket.on('playerColor', function(color) {
  playerColor = color;
  console.log('You are playing as ' + playerColor);

  // Flip the board if the player is black
  if (playerColor === 'black') {
      board.flip();
      document.getElementById('favicon').setAttribute('href', 'images/black-icon.ico');
  } else {
      document.getElementById('favicon').setAttribute('href', 'images/white-icon.ico');
  }

    // Update the board
  updateGame();
});

// Listen for gameStarted event from the server
socket.on('gameStarted', function() {
  gameStarted = true;
  console.log('Game has started');
  updateGame();
  $gameStatus.html('Welcome! White moves first'); // initial message
});

// Listen for move event from the server. Is called every move
socket.on('move', function(data) {
  console.log('Move received from server:', data.move);
  game.move(data.move);
  board.position(game.fen());
  updateGame();
  highlightDestinationSquare(data.move);
});

// Listen for reset game
socket.on('resetGame', function() {
  clearHighlights();
  console.log('Resetting game...');
  game.reset();
  board.start();
  gameStarted = false;
  updateGame();
  $gameStatus.html('Waiting for opponent to connect...');
});

// Listen for reject
socket.on('reject', function() {
  alert('Game is full. Please try again later.');
  socket.disconnect();
});

// Listen for waitingForPlayer
socket.on('waitingForPlayer', function() {
  $gameStatus.html('Waiting for new player to join...');
});

socket.on('timer', function(data) {
  if (playerColor === 'black') {
      $('#topTimer').html('White Time: ' + data.whiteTime + 's');
      $('#bottomTimer').html('Black Time: ' + data.blackTime + 's');
  } else if (playerColor === 'white') {
      $('#topTimer').html('Black Time: ' + data.blackTime + 's');
      $('#bottomTimer').html('White Time: ' + data.whiteTime + 's');
  }
});


// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~	
// Chess functions
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

// create new game
var $gameStatus = $('#status') // jquery element to show game status
var game = new Chess()
var playerColor = null;
var gameStarted = false;

// create the board with configuration
var board = Chessboard('myBoard', {
  draggable: true,
  position: 'start',
  pieceTheme: 'images/{piece}.png',
  onDragStart: onDragStart,
  onDrop: onDrop,
  onSnapEnd: onSnapEnd
});

function onDragStart (source, piece, position, orientation) {
  // Do not pick up pieces if the game is over, not started yet, or not the player's turn
  return !(game.game_over() || !gameStarted || game.turn() !== playerColor[0])
}

function onDrop (source, target) {
  // see if the move is legal
  var move = game.move({ from: source, to: target, promotion: 'q'})
  if (!move) return 'snapback' 

  highlightDestinationSquare(target)

  // send the move to the server
  socket.emit('move', {move: move.san});

  // update the board position and game state
  updateGame();
}

// update the board position after the piece snap
function onSnapEnd () {
  board.position(game.fen())
}

function updateGame() {
  var status = 'Waiting for opponent to connect...';
  if (game.game_over()) {
      status = 'Game over, ' + (game.turn() === 'b' ? 'Black' : 'White') + ' is in checkmate.';
  } else if (gameStarted) {
      status = 'Move: ' + (game.turn() === 'b' ? 'Black' : 'White');
  }
  $gameStatus.html(status);
}

// pure visual function to highlight the destination square
function clearHighlights() {
  $('.square-55d63').css('background', '');
}

function highlightDestinationSquare(square) {
  clearHighlights(); // clear previous highlights
  if (square) {
    // Apply a flat color or modify the radial gradient to cover the entire square
    $('.square-' + square).css('background', '#f6c90e');
  }
}
