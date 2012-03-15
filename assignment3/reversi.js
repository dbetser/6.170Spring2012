// Reversi
// Dina Betser, 6.170 Assignment 3.
//
// JavaScript file implementing the game Reversi/Othello.
// Credit to http://www.onlinespiele-sammlung.de/othello/othello-reversi-games/
// lemurcomputing for algorithm ideas.

if (!window.console) console = {};

// Global debug variable to control severity of log messages printed to console.
var debug = 0;

//
// Initialization after the page is loaded
//
$(document).ready(function () {
    var boardDim = 8;
    var boardSize = boardDim * boardDim;
    var outcome = { "draw":"It's a draw!", "win":"Player 1 wins!",
                    "lose":"Player 2 wins!"};
    // create elements
    var elements = Array.dim(boardSize).map(function () {
        // use jquery so that we have jq objects and not elements
        var box = $("<div>");
        box.addClass("box");
        $("#board").append(box);
        return box;
    });

    // create a new board
    var game = new Game(boardDim);

    // Set player types/play mode.
    var humanPlayer = game.getPlayer(1);
    if (debug > 1) {
        console.log($("#playType").val());
    }

    // Boolean to store whether the play is against a computer or human.
    var isVersusComp;

    // Store which box is currently clicked in the UI so that when the move is
    // submitted it can be referenced. -1 if no box is clicked.
    var currentlyClickedBox = -1;

    var maxHistorySize = 80;
    var boardStateHistory;
    var boardStateHistoryIdx;
    var initBoardStateHistory = function() {
        boardStateHistory = new Array;
        boardStateHistoryIdx = -1;
    }

    // Update the boolean representing whether the play type is human vs. human
    // or human vs. computer.
    var onPlayTypeChanged = function() {
        if ($("#playType").val() === "comp") {
            isVersusComp = true;
        } else if ($("#playType").val() === "human") {
            secondHumanPlayer = humanPlayer.other;
            isVersusComp = false;
        } else {
          alert("Error: No play mode is selected.");
        }
    };

    // Add click handlers for buttons.
    // Click handler for redo functionality.
    $("#redo").click(function() {
        if (debug > 0) {
            console.log("Handler for redo.click() called.");
        }
        if (debug > 0) {
            for (var i = 0; i < boardStateHistory.length; i++) {
                console.log(boardStateHistory[i].getBoard().toString());
            }
        }
        if (boardStateHistoryIdx < boardStateHistory.length - 1) {
            game.restoreBoardState(boardStateHistory[boardStateHistoryIdx + 1],
                                   refreshView);
            boardStateHistoryIdx++;
        } else {
            alert("No moves to redo.");
        }
    });

    // Click handler for undo functionality.
    $("#undo").click(function() {
        if (debug > 0) {
            console.log("Handler for undo.click() called.");
        }
        if (boardStateHistoryIdx <= 0) {
            alert("No more moves to undo.");
        } else {
            if (debug > 0) {
                console.log("Current index = ", boardStateHistoryIdx,
                            "; history contains: ");
                for (var i = 0; i < boardStateHistory.length; i++) {
                    console.log(boardStateHistory[i].getBoard().toString());
                }
            }
            boardStateHistoryIdx--;
            game.restoreBoardState(boardStateHistory[boardStateHistoryIdx],
                                   refreshView);
        }
    });

    // Click handler for "submit" functionality.
    $("#done").click(function() {
        if (currentlyClickedBox === -1) {
            alert("You must select a valid box before submitting!");
            return;
        }
        var e = elements[currentlyClickedBox];
        var player = game.getCurrentPlayer();
        // If the game is already complete, nothing to do.
        if (game.isGameOver(player, displayOutcome)) return;
        if (e.play(player)) {
            if (game.isGameOver(player, displayOutcome)) return;
            currentlyClickedBox = -1;
        }
        if (isVersusComp) {
            game.setCurrentPlayer(player.other, displayCurrentPlayer);
            elements[game.pickPlayPosition(player.other)].play(player.other);
            game.setCurrentPlayer(player, displayCurrentPlayer);
            storeState(game.getCurrentBoardState(isVersusComp));
            game.isGameOver(player.other, displayOutcome);
        } else {
            if (debug > 1 ) {
                console.log("human vs human play");
            }
            // TODO undo/redo player
            storeState(game.getCurrentBoardState(isVersusComp));
            console.log("Storing", player.toString());
            game.setCurrentPlayer(player.other, displayCurrentPlayer);
        }
        refreshBoard();
    });
    // Click handler for "restart" functionality.
    // Useful for both "restart" and "abort".
    $("#restart").click(function() {
        restart();
    });
    // Change handler for
    $('#playType').change(function() {
        onPlayTypeChanged();
        restart();
    });
    $(document).keypress(function(e){
        if (e.which === 13) {
            $("#done").click();
        }
    });

    // Store state for undo/redo purposes.
    var storeState = function(boardState) {
        if (debug > 0) {
            console.log("Storing state; Current index = ", boardStateHistoryIdx,
                            "; history contains: ");
            for (var i = 0; i < boardStateHistory.length; i++) {
                console.log(boardStateHistory[i].getBoard().toString());
            }
            console.log("Storestate storing", boardState.getCurPlayer().toString());
        }
        if (boardStateHistory.length === maxHistorySize) {
            boardStateHistory.splice(0);
        }
        boardStateHistory.push(boardState);
        boardStateHistoryIdx = boardStateHistory.length - 1;
        if (debug > 0) {
            console.log("bstlength", boardStateHistory.length, "idx: ",
            boardStateHistoryIdx);
        }
    };

    // Prepare a new game.
    var restart = function () {
        game.initBoard();
        initBoardStateHistory();
        game.resetStats(refreshBoard);
        storeState(game.getCurrentBoardState(isVersusComp));
    };


    // Attach render methods to elements.
    elements.forEach(function (e, idx) {
        e.render = function (player) {
            if (idx === currentlyClickedBox) {
                e.addClass("currentlyClicked");
            } else {
                e.removeClass("player1 player2 currentlyClicked");
                if (player === game.getPlayer(1))
                    e.addClass("player1");
                else if (player === game.getPlayer(2))
                    e.addClass("player2");
            }
        };
    });

    // Refresh the playing board's view.
    var refreshBoard = function () {
      if (debug > 0) {
          console.log("Refreshing view.");
      }
      for (var idx = 0; idx < boardSize; idx++) {
        elements[idx].render(game.getPlayerForBox(idx));
      }
    }

    // Hover handler to change CSS before a box is clicked.
    elements.forEach(function (e, i) {
        e.hover(
            function() {
                if (game.getCurrentPlayer() === game.getPlayer(1) &&
                    game.getPlayerForBox(i).toString() === "-")
                  e.addClass("player1");
                else if (game.getCurrentPlayer() === game.getPlayer(2) &&
                    game.getPlayerForBox(i).toString() === "-")
                  e.addClass("player2");
            },
            function() {
                if (game.getCurrentPlayer() === game.getPlayer(1) &&
                    game.getPlayerForBox(i).toString() === "-")
                  e.removeClass("player1");
                else if (game.getCurrentPlayer() === game.getPlayer(2) &&
                    game.getPlayerForBox(i).toString() === "-")
                  e.removeClass("player2");
            });
    });

    // Attach play methods to elements.
    elements.forEach(function (e, position) {
        e.play = function (player) {
            if (game.play(player, position, true, updateViewStats)) {
                e.render(player);
                return true;
            }
            return false;
        };
    });

    // Update the player that is displayed in the UI.
    var displayCurrentPlayer = function(playerIdx) {
        var player_str = playerIdx === 2 ? "White" : "Black";
        $("#whichPlayer").text(player_str);
        if (debug > 0) {
            console.log("displayCurrentPlayer called: ", player_str)
        }
    };

    // Display the outcome of the game.
    var displayOutcome = function(player, win) {
        if (win)
            $("#outcome").text(
                (player === humanPlayer) ? outcome.win : outcome.lose);
        else
            $("#outcome").text(outcome.draw);
    };

    // Refresh all aspects of the view, including the stats, player, and board.
    var refreshView = function (pOneBoxes, pTwoBoxes, boxesLeft, playerIdx) {
        updateViewStats(pOneBoxes, pTwoBoxes, boxesLeft);
        displayCurrentPlayer(playerIdx);
        refreshBoard()
    }

    // Update the game stats.
    var updateViewStats = function(pOneBoxes, pTwoBoxes, boxesLeft) {
        $("#blackScore").text(pOneBoxes);
        $("#whiteScore").text(pTwoBoxes);
        $("#boxesRemaining").text(boxesLeft);
    };

    // Add listeners for the click event on each element to set the currently
    // clicked box.
    elements.forEach(function (e, position) {
        e.click(function () {
            var player = game.getCurrentPlayer();
            if (game.play(player, position, false, updateViewStats)) {
                currentlyClickedBox = position;
                refreshBoard();
            } else {
                alert("You cannot play at this box");
            }
        });
    });

    // Initialize application.
    onPlayTypeChanged();
    initBoardStateHistory();
    restart();
});

// Object to store board state for undo/redo purposes.
var BoardStateData = function(b, curPlayer, p1boxes, p2boxes, boxesRem) {
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


//
// Implementation of the Game ADT
// Contains all the game logic
//
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

    this.resetStats = function(viewCallback) {
        playerTwoBoxes = 2;
        playerOneBoxes = 2;
        boxesRemaining = 60;
        currentPlayer = PLAYER_1;
        viewCallback(playerOneBoxes, playerTwoBoxes, boxesRemaining, 1);
    }

    // Allow external access to currentPlayer
    this.getCurrentPlayer = function() {
        return currentPlayer;
    }

    this.setCurrentPlayer = function(playerIdx, playerCallback) {
        currentPlayer = this.getPlayer(playerIdx);
        playerCallback(currentPlayer === PLAYER_2 ? 2 : 1);
    }

    this.getPlayerForBox = function (idx) {
        return board[idx];
    }

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

    // return array of positions player can play on board
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
        while ((curRow >= 0) && (curColumn >= 0) && (curRow < boardDim)
               && (curColumn < boardDim)) {
            box_index = getPieceIndex(curRow, curColumn)
            if (board[box_index] === player) {
                // We found another of the current color
                if (flipBoxes === true) {
                    // Do it all again
                    curRow = row + rowDir;
                    curColumn = column + colDir;
                    while ((curRow >= 0) && (curColumn >= 0)
                           && (curRow < boardDim) && (curColumn < boardDim)) {
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

    //
    // Calculates the number of pieces that would get turned over
    //
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
        if (board[box_index] != NONE) {
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

    this.getCurrentBoardState = function(isVersusComp) {
        // Implementing logical xor. This ensures that if we are playing against
        // the computer, we return the alternate player.
        var player;
        if (isVersusComp) {
            player = currentPlayer === PLAYER_1 ? 1 : 2;
        } else {
            player = currentPlayer === PLAYER_1 ? 2 : 1;
        }
        var bsd = new BoardStateData(board.copy(),
                                     player,
                                     playerOneBoxes, playerTwoBoxes,
                                     boxesRemaining)
        return bsd;
    }

    this.restoreBoardState = function (boardStateData, refreshCallback) {
        board = boardStateData.getBoard();
        if (debug > 0) {
            console.log("Restoring state: board = ", board.toString());
        }
        currentPlayer = this.getPlayer(boardStateData.getCurPlayer());
        playerOneBoxes = boardStateData.getPOneBoxes();
        playerTwoBoxes = boardStateData.getPTwoBoxes();
        boxesRemaining = boardStateData.getBoxesRem();
        refreshCallback(playerOneBoxes, playerTwoBoxes, boxesRemaining,
                        boardStateData.getCurPlayer());
    }

    // Helper function to translate (X, Y) coordinates to index in arrray:
    // [0, boardSize).
    var getPieceIndex = function (row, col) {
        return row * 8 + col;
    }

    // checks if the game is over
    this.isGameOver = function(player, resultCallback) {
        if (gameFinished(board, player)) {
            this.isGameOver = function () { return true; }
            // Check who's won
            if (playerOneBoxes > playerTwoBoxes) {
                resultCallback(PLAYER_1, true)
            } else if (playerTwoBoxes > playerOneBoxes) {
                resultCallback(PLAYER_2, true)
            } else {  // tie
                resultCallback(player, false);
            }
            return true;
        }
        return false;
    };

    // returns the player object
    this.getPlayer = function (i) {
        var players = {1: PLAYER_1, 2: PLAYER_2};
        return players[i];
    };

    // mutate board by playing player in position if the move is valid
    this.play = function (player, position, canPlay, viewCallback) {
        if (debug > 1) {
            console.log("Play for player ", player, ", position ", position,
                        ", valid ",
                        $.inArray(position, validPlays(board, player)));
        }
        if (board[position] === NONE
            && $.inArray(position, validPlays(board, player)) != -1) {
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

    // Return a move for player.
    this.pickPlayPosition = function (player) {
        var plays = validPlays(board, player);
        var randomIdx = Math.floor(plays.length * Math.random())
        return plays[randomIdx];
    };
}
