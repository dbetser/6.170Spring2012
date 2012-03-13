// Reversi
// Dina Betser, 6.170 Assignment 3.
//
// JavaScript file implementing the game Reversi/Othello.
// Credit to http://www.onlinespiele-sammlung.de/othello/othello-reversi-games/
// lemurcomputing for algorithm ideas.

if (!window.console) console = {};

// Global debug variable to control severity of log messages. 
var debug = 1;

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
    var board = new Board(boardDim);

    // Set player types/play mode.
    var humanPlayer = board.getPlayer(1);
    if (debug > 1) {
        console.log($("#playType").val());
    }
    var computerPlayer;
    var secondHumanPlayer;
    if ($("#playType").val() === "comp") {
        computerPlayer = humanPlayer.other;
    } else if ($("#playType").val() === "human") { 
        secondHumanPlayer = humanPlayer.other;
        // TODO implement human vs human
    } else {
      alert("You must select a play mode.");
    }

    // Add click handlers for buttons.
    $("#redo").click(function() {
        alert("Handler for redo.click() called.");
    });
    $("#undo").click(function() {
        alert("Handler for undo.click() called.");
    });
    $("#done").click(function() {
        if (currentlyClickedBox === -1) {
            alert("You must select a valid box before submitting!");
        }
        var e = elements[currentlyClickedBox];

        // if the game is already complete, nothing to do
        if (board.isGameOver(humanPlayer, displayOutcome)) return;
        if (e.play(humanPlayer)) {
            refresh();
            if (board.isGameOver(humanPlayer, displayOutcome)) return;
            board.setCurrentPlayer(board.getCurrentPlayer().other,
                                   displayCurrentPlayer);

            elements[board.pickPlayPosition(computerPlayer)]
                .play(computerPlayer);
            refresh();
            board.isGameOver(computerPlayer, displayOutcome);
        }                                   
        // todo: move. if the computer is first to go, find the best move and play
        if (computerPlayer === board.getPlayer(1)) {
            elements[board.pickPlayPosition(computerPlayer)]
                .play(computerPlayer);
        }
        currentlyClickedBox = -1;
        refresh();
        // Switch the current player.
        board.setCurrentPlayer(board.getCurrentPlayer().other,
                               displayCurrentPlayer);
    });
    $("#restart").click(function() { // Useful for both "restart" and "abort"
        restart();
    });
    $('#playType').change(function() {
        restart();
    });
    $(document).keypress(function(e){
        if (e.which === 13){
            $("#done").click();
        }
    });


    var restart = function () {
        board.initBoard();
        refresh();
    }

    // Store which box is currently clicked in the UI so that when the move is
    // submitted it can be referenced. -1 if no box is clicked.
    var currentlyClickedBox = -1;


    // attach render methods to elements
    elements.forEach(function (e, idx) {
        e.render = function (player) {
            if (idx === currentlyClickedBox) {
                e.addClass("currentlyClicked");
            } else {
                e.removeClass("player1 player2 currentlyClicked");
                if (player === board.getPlayer(1))
                    e.addClass("player1");
                else if (player === board.getPlayer(2))
                    e.addClass("player2");
            }
        };      
    });

    // Refresh the playing board's view.
    var refresh = function () {
      if (debug > 0) {
          console.log("Refreshing view.");
      }
      for (var idx = 0; idx < boardSize; idx++) {
        elements[idx].render(board.getPlayerForBox(idx));
      }
    }

    // Hover handler to change CSS before a box is clicked.
    elements.forEach(function (e, i) {
        e.hover(
            function() {
                if (board.getCurrentPlayer() === board.getPlayer(1) &&
                    board.getPlayerForBox(i).toString() === "-")
                  e.addClass("player1");
                else if (board.getCurrentPlayer() === board.getPlayer(2) &&
                    board.getPlayerForBox(i).toString() === "-")
                  e.addClass("player2");
            },
            function() {
                if (board.getCurrentPlayer() === board.getPlayer(1) &&
                    board.getPlayerForBox(i).toString() === "-")
                  e.removeClass("player1");
                else if (board.getCurrentPlayer() === board.getPlayer(2) &&
                    board.getPlayerForBox(i).toString() === "-")
                  e.removeClass("player2");
            });
    });

    board.initBoard();
    refresh();

    // attach play methods to elements
    elements.forEach(function (e, position) {
        e.play = function (player) {    
            if (board.play(player, position, true, updateViewStats)) {
                e.render(player);
                return true;
            }
            return false;                                
        };
    });

    // Update the player that is displayed in the UI.
    var displayCurrentPlayer = function(player_idx) {
        var player_str = player_idx === 1 ? "White" : "Black";
        $("#whichPlayer").text(player_str);
        if (debug > 0) {
            console.log("displayCurrentPlayer called: ", player_str)
        }
    };

    // display the outcome of the game
    var displayOutcome = function(player, win) {
        if (win) 
            $("#outcome").text(
                (player === humanPlayer) ? outcome.lose : outcome.win);
        else
            $("#outcome").text(outcome.draw);       
    };

    // Update the game stats.
    var updateViewStats = function(pOneBoxes, pTwoBoxes, boxesLeft) {
		$("#blackScore").text(pOneBoxes);
		$("#whiteScore").text(pTwoBoxes);
		$("#boxesRemaining").text(boxesLeft);
    };

    // add listeners for the click event on each element
    // let the event handler call play on the element,
    // check if the game is over, and make the move of the 
    // computer player TODO cleanup
    elements.forEach(function (e, position) {
        e.click(function () {
            var player = board.getCurrentPlayer();
            if (board.play(player, position, false, updateViewStats)) {
                currentlyClickedBox = position;
                refresh();
            } else {
                alert("You cannot play at this box");
            }
        });
    });        

});

//
// Implementation of the Board ADT 
// Contains all the game logic
//
var Board = function (boardDim) {
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
    
    // Allow external access to currentPlayer
    this.getCurrentPlayer = function() {
        return currentPlayer;
    }
    
    this.setCurrentPlayer = function(player_idx, playerCallback) {
        playerCallback(currentPlayer === PLAYER_1 ? 1 : 2);
        currentPlayer = this.getPlayer(player_idx);
    }

    this.getPlayerForBox = function (idx) {
      return board[idx];
    }
    // Initialize Board to othello starting positions. TODO(dbetser): Abstract
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
    var hasWon = function (board, player) {
        // check if won
        if (boxesRemaining === 0) {
            // Check who's won
            if (playerOneBoxes > playerTwoBoxes) {
                if (PLAYER_1 === player)
                    return true
            } else if (playerTwoBoxes > playerOneBoxes) {
                if (PLAYER_2 === player)
                    return true
            }
        }
        return false;  // It's a draw.
    };      
/*
    // speculative play; returns new board array
    // with the new move played
    var peek = function (board, player, position) {
        var new_board = board.copy();
        new_board[position] = player;       
        return new_board;
    };
*/        
    // return array of positions player can play on board
    var validPlays = function (board) {
        var plays = [];
        board.forEach(function (b, i) {
            if (debug > 1) {
                console.log(b, i);
            }
            if (numTurnedOver(i, false) > 0) {
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
    var numTurnedOverDir = function (row, column, rowDir, colDir, flipBoxes) {
        var numFlipped = 0;
        var curRow;
        var curColumn;
        var box_index;
        curRow = row + rowDir;
        curColumn = column + colDir;
        while ((curRow >= 0) && (curColumn >= 0) && (curRow < boardDim)
               && (curColumn < boardDim)) {
            box_index = getPieceIndex(curRow, curColumn)
            if (board[box_index] === currentPlayer) {
                // We found another of the current color
                if (flipBoxes === true) {
                    // Do it all again
                    curRow = row + rowDir;
                    curColumn = column + colDir;
                    while ((curRow >= 0) && (curColumn >= 0)
                           && (curRow < boardDim) && (curColumn < boardDim)) {
                        box_index = getPieceIndex(curRow, curColumn)
                        if (board[box_index] === currentPlayer) {
                            return numFlipped;
                        }
    
                        board[box_index] = currentPlayer;
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
    var numTurnedOver = function (box_index, flipBoxes) {
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
        numFlipped += numTurnedOverDir(row, col, -1,  0, flipBoxes);
        numFlipped += numTurnedOverDir(row, col, -1,  1, flipBoxes);
        numFlipped += numTurnedOverDir(row, col,  0,  1, flipBoxes);
        numFlipped += numTurnedOverDir(row, col,  1,  1, flipBoxes);
        numFlipped += numTurnedOverDir(row, col,  1,  0, flipBoxes);
        numFlipped += numTurnedOverDir(row, col,  1, -1, flipBoxes);
        numFlipped += numTurnedOverDir(row, col,  0, -1, flipBoxes);
        numFlipped += numTurnedOverDir(row, col, -1, -1, flipBoxes);
        if (debug > 1) {
            console.log("After flipping box at: ", box_index,
                        " Num turned over = ", numFlipped);
        }
        return numFlipped;
    }
    
    //
    // Checks if a move is available for the current color.
    // If not, play switches to the other player.
    //
    var isMoveAvailable = function (firstPass) {
        if (debug > 1) {
            console.log("Calling isMoveAvailable with firstPass = ", firstPass); 
        }
        var idx;
        var szMessage;
    
        // Keep going until there's a legal move
        for (idx = 0; idx < boardSize; idx++) {
            if (numTurnedOver(idx, false) > 0) {
                if (debug > 0) {
                    console.log("Found a valid move: ", idx);
                }
                return true;
            }
        }
    
        // No moves were found; switch play to the other color.
        if (firstPass === true) {
            szMessage = "There were no legal moves for ";
            if (currentPlayer === PLAYER_1) {
                szMessage += "black.  White plays again.";
                currentPlayer = PLAYER_2;
            } else {
                szMessage += "white.  Black plays again.";
                currentPlayer = PLAYER_1;
            }
        }
        else {
            szMessage = "There were no legal moves for ";
            if (currentPlayer === PLAYER_1) {
                szMessage += "black either.  End of game!";
                currentPlayer = PLAYER_2;
            } else {
                szMessage += "white either.  End of game!";
                currentPlayer = PLAYER_1;
            }
        }
    
        // No moves are available. Alert user.
        $("#outcome").text(szMessage);
        if (debug > 0) {
            console.log(szMessage);
        }
        if (firstPass === true) {
            currentPlayer = currentPlayer.other;
            isMoveAvailable(false);
        } else {
            boxesRemaining = 0;
        }   
        return false;
    }

    // Helper function to translate (X, Y) coordinates to index in arrray:
    // [0, boardSize).
    var getPieceIndex = function (row, col) {
        return row * 8 + col;
    }
/*
    // player can win in one play
    var canWin = function (board, player) {
        return validPlays(board).some(function (p) {
            return hasWon(peek(board, player, p), player);
        });
    };
*/        
    // checks if the game is over
    this.isGameOver = function(player, resultCallback) {        
        if (hasWon(board, player)) {
            this.isGameOver = function () { return true; }
            resultCallback(player, true);
            return true;
        }
        
        var plays = validPlays(board);  
        if (plays.isEmpty()) {
            this.isGameOver = function () { return true; }
            resultCallback(player, false);
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
                        ", valid ", $.inArray(position, validPlays(board)));
        }
        if (board[position] === NONE 
            && $.inArray(position, validPlays(board)) != -1) {
            if (canPlay) {
                var numFlipped = numTurnedOver(position, true);
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
        var plays = validPlays(board); 
        var randomIdx = Math.floor(plays.length * Math.random())
        return plays[randomIdx];                              
    };
}
