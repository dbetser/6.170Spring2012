// Reversi
// Dina Betser, 6.170 Assignment 3.
//
// JavaScript file implementing the model for the game Reversi/Othello.
// Credit to http://www.onlinespiele-sammlung.de/othello/othello-reversi-games/
// lemurcomputing for algorithm ideas. Credit to the 6.170 Tic Tac Toe example
// for code structuring ideas and some function reuse.

if (!window.console) { console = {}; }

// Global debug variable to control severity of log messages printed to console.
var debug = 0;


// Implementation of the game state ADT. Modeled as a simple struct with
// getters for all the private local fields. Includes all data that
// represents a given state, including the player, the board, and the
// information about how many boxes are allocated to the two players or remain
// to be allocated. Useful for undo/redo purposes.
var GameStateData = function(b, curPlayer, p1boxes, p2boxes, boxesRem) {
    this.getBoard = function() {
        return b.copy();
    }
    this.getCurPlayer = function () {
        return curPlayer;
    }
    this.getPOneBoxes = function() {
        return p1boxes;
    }
    this.getPTwoBoxes = function() {
        return p2boxes;
    }
    this.getBoxesRem = function() {
        return boxesRem;
    }
};


// Implementation of the Game ADT. Contains all the game logic.
var Game = function (boardDim) {
    var PLAYER_1 = {}, PLAYER_2 = {}, NONE = {};
    PLAYER_1.other = PLAYER_2;
    PLAYER_2.other = PLAYER_1;

    // for debugging
    PLAYER_1.toString = function() {return "1";};
    PLAYER_2.toString = function() {return "2";};
    NONE.toString = function() {return "-";};

    var boardSize = boardDim * boardDim;
    var board = Array.dim(boardSize, NONE);

    var playerTwoBoxes = 2;
    var playerOneBoxes = 2;
    var boxesRemaining = 60;

    // The current player of the game.
    var currentPlayer = PLAYER_1;

    // Initialize Game to Othello starting positions. TODO(dbetser): Abstract
    // away hardcoded values.
    this.initBoard = function () {
        var idx;
        for (idx = 0; idx < boardSize; idx++) {
            if (idx === 27 || idx === 36)
                board[idx] = PLAYER_1;
            else if (idx === 28 || idx === 35)
                board[idx] = PLAYER_2;
            else
                board[idx] = NONE;
        }
    }

    // Reset the statistics used in the view including number of boxes unused
    // and allocated to the two players, and the current player.
    this.resetStats = function(viewCallback) {
        playerTwoBoxes = 2;
        playerOneBoxes = 2;
        boxesRemaining = 60;
        currentPlayer = PLAYER_1;
        viewCallback(playerOneBoxes, playerTwoBoxes, boxesRemaining, 1);
    }

    // Allow external access to currentPlayer.
    this.getCurrentPlayer = function() {
        return currentPlayer;
    }

    // Set the current player and call the callback to update the View.
    this.setCurrentPlayer = function(playerIdx, playerCallback) {
        currentPlayer = this.getPlayer(playerIdx);
        playerCallback(currentPlayer === PLAYER_2 ? 2 : 1);
    }

    // Return the occupant of the box at index idx.
    this.getPlayerForBox = function (idx) {
        return board[idx];
    }

    // Returns the player object for the given index.
    this.getPlayer = function (i) {
        var players = {1: PLAYER_1, 2: PLAYER_2};
        return players[i];
    };

    // Helper function to translate (X, Y) coordinates to index in array
    // in range [0, boardSize).
    var getPieceIndex = function (row, col) {
        return row * 8 + col;
    }

    // Pack up the current state of the game into a GameStateData object
    // for undo/redo purposes.
    this.getCurrentBoardState = function(isVersusComp) {
        // Implementing logical xor. This ensures that if we are playing against
        // the computer, we return the alternate player.
        var player;
        if (isVersusComp) {
            player = currentPlayer === PLAYER_1 ? 1 : 2;
        } else {
            player = currentPlayer === PLAYER_1 ? 2 : 1;
        }
        var bsd = new GameStateData(board.copy(),
                                     player,
                                     playerOneBoxes, playerTwoBoxes,
                                     boxesRemaining)
        return bsd;
    }

    // Unpack the state of the game specified by the input variable, calling
    // the refresh callback to update the UI when finished.
    this.restoreBoardState = function (GameStateData, refreshCallback) {
        board = GameStateData.getBoard();
        if (debug > 0) {
            console.log("Restoring state: board = ", board.toString());
        }
        currentPlayer = this.getPlayer(GameStateData.getCurPlayer());
        playerOneBoxes = GameStateData.getPOneBoxes();
        playerTwoBoxes = GameStateData.getPTwoBoxes();
        boxesRemaining = GameStateData.getBoxesRem();
        refreshCallback(playerOneBoxes, playerTwoBoxes, boxesRemaining,
                        GameStateData.getCurPlayer());
    }

    // Returns true if a player has won, false otherwise.
    var gameFinished = function (board, player) {
        // check if won
        if (boxesRemaining === 0) {
            return true;
        } else if (validPlays(board, PLAYER_1).length === 0 &&
                   validPlays(board, PLAYER_2).length === 0) {
            return true;
        } else {
            return false;
        }
    };

    // Return array of positions player can play on board.
    var validPlays = function (board, player) {
        var plays = [];
        board.forEach(function (b, i) {
            if (debug > 1) {
                console.log(b, i);
            }
            if (numTurnedOver(i, false, player) > 0) {
                plays.push(i);
                if (debug > 1) {
                    console.log("Adding play ", i,
                                "; number of valid plays so far: ",
                                plays.length);
                }
            }
        });
        if (debug > 0) {
            console.log("Number of valid plays: ", plays.length);
        }
        return plays;
    };


    // Check the number of pieces to be turned over in this direction.
    var numTurnedOverDir = function (row, column, rowDir, colDir, flipBoxes,
                                     player) {
        var numFlipped = 0;
        var curRow;
        var curColumn;
        var box_index;
        curRow = row + rowDir;
        curColumn = column + colDir;
        while ((curRow >= 0) && (curColumn >= 0) && (curRow < boardDim) &&
               (curColumn < boardDim)) {
            box_index = getPieceIndex(curRow, curColumn)
            if (board[box_index] === player) {
                // We found another of the current color
                if (flipBoxes === true) {
                    // Do it all again
                    curRow = row + rowDir;
                    curColumn = column + colDir;
                    while ((curRow >= 0) && (curColumn >= 0) &&
                           (curRow < boardDim) && (curColumn < boardDim)) {
                        box_index = getPieceIndex(curRow, curColumn)
                        if (board[box_index] === player) {
                            return numFlipped;
                        }

                        board[box_index] = player;
                        curRow += rowDir;
                        curColumn += colDir;
                    }
                }
                return numFlipped;
            } else if (board[box_index] === NONE) {
                // No more pieces in this direction
                return 0;
            }

            // It's the opposite color so keep going
            numFlipped++;
            curRow += rowDir;
            curColumn += colDir;
        }

        // We reached the edge of the board
        return 0;
    }

    // Calculates the number of pieces that would get turned over.
    var numTurnedOver = function (box_index, flipBoxes, player) {
        var numFlipped = 0;
        var row = Math.floor(box_index / boardDim);
        var col = box_index % boardDim;
        if (debug > 1) {
            console.log("Calling numTurnedOver with row=", row, "; col=", col);
        }
        if (box_index >= boardSize) {
          alert(box_index);

        }
        if (board[box_index] !== NONE) {
            return 0;
        }

        // Check pieces in all directions
        numFlipped += numTurnedOverDir(row, col, -1,  0, flipBoxes, player);
        numFlipped += numTurnedOverDir(row, col, -1,  1, flipBoxes, player);
        numFlipped += numTurnedOverDir(row, col,  0,  1, flipBoxes, player);
        numFlipped += numTurnedOverDir(row, col,  1,  1, flipBoxes, player);
        numFlipped += numTurnedOverDir(row, col,  1,  0, flipBoxes, player);
        numFlipped += numTurnedOverDir(row, col,  1, -1, flipBoxes, player);
        numFlipped += numTurnedOverDir(row, col,  0, -1, flipBoxes, player);
        numFlipped += numTurnedOverDir(row, col, -1, -1, flipBoxes, player);
        if (debug > 1) {
            console.log("After flipping box at: ", box_index,
                        " Num turned over = ", numFlipped);
        }
        return numFlipped;
    }

    // Returns true if the game is over.
    this.isGameOver = function(player, resultCallback) {
        if (gameFinished(board, player)) {
            this.isGameOver = function () { return true; }
            // Check who's won.
            if (playerOneBoxes > playerTwoBoxes) {
                resultCallback(PLAYER_1, true)
            } else if (playerTwoBoxes > playerOneBoxes) {
                resultCallback(PLAYER_2, true)
            } else {  // Tie.
                resultCallback(player, false);
            }
            return true;
        }
        return false;
    };

    // Mutates the board by playing player in position if the move is valid.
    // Updates all appropriate state variables.
    this.play = function (player, position, canPlay, viewCallback) {
        if (debug > 1) {
            console.log("Play for player ", player, ", position ", position,
                        ", valid ",
                        $.inArray(position, validPlays(board, player)));
        }
        if (board[position] === NONE &&
            $.inArray(position, validPlays(board, player)) !== -1) {
            if (canPlay) {
                var numFlipped = numTurnedOver(position, true, currentPlayer);
                if (debug > 1) {
                    console.log("numTurnedOver called; position, player=",
                                position, player.toString());
                }
                board[position] = player;
                boxesRemaining--;
                if (currentPlayer === PLAYER_1) {
                    playerTwoBoxes = playerTwoBoxes - numFlipped;
                    playerOneBoxes = playerOneBoxes + numFlipped + 1;
                } else if (currentPlayer === PLAYER_2) {
                    playerTwoBoxes = playerTwoBoxes + numFlipped + 1;
                    playerOneBoxes = playerOneBoxes - numFlipped;
                }
                viewCallback(playerOneBoxes, playerTwoBoxes, boxesRemaining);
            }
            return true;
        }
        return false;
    };

    // Return a move for player. Currently returns a random move from the list
    // of available moves. TODO(dbetser): Implement smarter algorithm.
    this.pickPlayPosition = function (player) {
        var plays = validPlays(board, player);
        var randomIdx = Math.floor(plays.length * Math.random())
        return plays[randomIdx];
    };
}
