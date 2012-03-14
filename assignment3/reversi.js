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

    var isVersusComp;
    onPlayTypeChanged();


    var maxHistorySize = 5;
    var boardStateHistory = new Array();
    var boardStateHistoryIdx = -1;
    // Add click handlers for buttons.
    $("#redo").click(function() {
        if (debug > 0) {
            console.log("Handler for redo.click() called.");
        }
        if (boardStateHistoryIdx < boardStateHistory.length - 1) {
            board.restoreBoardState(boardStateHistory[boardStateHistoryIdx + 1],
                                    refresh);
            boardStateHistoryIdx++;
        } else {
            alert("No moves to redo.");
        }
    });
    $("#undo").click(function() {
        if (debug > 0) {
            console.log("Handler for undo.click() called.");
        }
        if (boardStateHistoryIdx < 0) {
            alert("No more moves to undo.");
        } else {
            board.restoreBoardState(boardStateHistory[boardStateHistoryIdx],
                                    refresh);
            boardStateHistoryIdx--;
        }
    });
    $("#done").click(function() {
        if (currentlyClickedBox === -1) {
            alert("You must select a valid box before submitting!");
            return;
        }
        var e = elements[currentlyClickedBox];
        var player = board.getCurrentPlayer();
        // if the game is already complete, nothing to do
        if (board.isGameOver(player, displayOutcome)) return;
        if (isVersusComp) {
            if (e.play(player)) {
                if (board.isGameOver(player, displayOutcome)) return;
                storeState(board.getCurrentBoardState());        

                // TODO(dbetser): reduce code repetition below.
				board.setCurrentPlayer(player.other, displayCurrentPlayer);
				elements[board.pickPlayPosition(player.other)].play(player.other);
		        currentlyClickedBox = -1;
				board.isGameOver(player.other, displayOutcome);
				board.setCurrentPlayer(player, displayCurrentPlayer);

				refresh();
	        }
        } else {
            if (e.play(player)) {
                if (debug > 0 ) {
                    console.log("human vs human play");
                }
                if (board.isGameOver(player, displayOutcome)) return;
                storeState(board.getCurrentBoardState());        

                currentlyClickedBox = -1;
                refresh();
                board.setCurrentPlayer(player.other, displayCurrentPlayer);
            } else {
                alert("Could not play here. Try another spot");
            }
        }
    });
    $("#restart").click(function() { // Useful for both "restart" and "abort"
        restart();
    });
    $('#playType').change(function() {
        onPlayTypeChanged();
        restart();
    });
    $(document).keypress(function(e){
        if (e.which === 13){
            $("#done").click();
        }
    });

	// Store state for undo/redo purposes.
    var storeState = function(boardState) {
		if (boardStateHistory.length === maxHistorySize) {
			boardStateHistory.splice(0);
		}
		boardStateHistory.push(boardState);
		boardStateHistoryIdx = boardStateHistory.length - 1;
		if (debug > 1) {
			console.log("bstlength", boardStateHistory.length, "idx: ",
			boardStateHistoryIdx);
		}
    };

    var restart = function () {
        board.initBoard();
        
        board.resetStats(resetViewStats);
        refresh();
    };

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

    // TODO(dbetser): change this to use restart.
    board.initBoard();
    storeState(board.getCurrentBoardState());        

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
    var displayCurrentPlayer = function(playerIdx) {
        var player_str = playerIdx === 2 ? "White" : "Black";
        $("#whichPlayer").text(player_str);
        if (debug > 0) {
            console.log("displayCurrentPlayer called: ", player_str)
        }
    };

    // display the outcome of the game
    var displayOutcome = function(player, win) {
        if (win) 
            $("#outcome").text(
                (player === humanPlayer) ? outcome.win : outcome.lose);
        else
            $("#outcome").text(outcome.draw);       
    };

    var resetViewStats = function (pOneBoxes, pTwoBoxes, boxesLeft, playerIdx) {
        updateViewStats(pOneBoxes, pTwoBoxes, boxesLeft);
        displayCurrentPlayer(playerIdx);
    }

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
        playerCallback(currentPlayer === PLAYER_2 ? 1 : 2);
        currentPlayer = this.getPlayer(playerIdx);
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
    var numTurnedOverDir = function (row, column, rowDir, colDir, flipBoxes, player) {
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

    this.getCurrentBoardState = function() {
        return board.copy();
    }

    this.restoreBoardState = function (boardArray, refreshCallback) {
        board = boardArray;
        refreshCallback();
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
