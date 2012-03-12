//
// Reversi
// Dina Betser, 6.170 Assignment 3.

if (!window.console) console = {};

//
// Initialization after the page is loaded
//
$(document).ready(function () {
    var boardDim = 8;
    var boardSize = boardDim * boardDim;
    var outcome = { "draw":"It's a draw!", "win":"Player 1 wins!", "lose":"Player 2 wins!"};
    // create elements
    var elements = Array.dim(boardSize).map(function () {
        // use jquery so that we have jq objects and not elements
        var box = $("<div>");
        box.addClass("box");
        $("#board").append(box);
        return box;
    });

    // create a new board
    var board = new Board(boardSize);

    // attach render methods to elements
    elements.forEach(function (e) {
        e.render = function (player) {
            if (player === board.getPlayer(1))
                e.addClass("player1");
            else if (player === board.getPlayer(2))
                e.addClass("player2");
        };      
    });

    // Refresh the playing board's view.
    var refresh = function () {
      console.log("refreshing");
      for (var idx = 0; idx < boardSize; idx++) {
        elements[idx].render(board.getPlayerForBox(idx));
      }
    }

    // Hover handler to change CSS before a box is clicked.
    elements.forEach(function (e, i) {
        e.hover(
            function() {
                console.log(i);
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
            if (board.play(player, position)) {
                e.render(player);
                return true;
            }
            return false;                                
        };
    });

    // display the outcome of the game
    var displayOutcome = function(player, win) {
        if (win) 
            $("#outcome").text((player === humanPlayer) ? outcome.lose : outcome.win);
        else
            $("#outcome").text(outcome.draw);       
    };

    // add listeners for the click event on each element
    // let the event handler call play on the element,
    // check if the game is over, and make the move of the 
    // computer player
    var humanPlayer = board.getPlayer(Math.round(Math.random()) + 1);
    console.log($("playType").val());
//    if ($("playType").val() === "comp") {
        var computerPlayer = humanPlayer.other;
        elements.forEach(function (e) {
            e.click(function () {
                // if the game is already complete, nothing to do
                if (board.isGameOver(humanPlayer, displayOutcome)) return;
                
                if (e.play(humanPlayer)) {
                    refresh();
                    if (board.isGameOver(humanPlayer, displayOutcome)) return;
    
                    elements[board.pickPlayPosition(computerPlayer)].play(computerPlayer);
                    refresh();
                    board.isGameOver(computerPlayer, displayOutcome);
                }                                   
            });
        });
        
        // if the computer is first to go, find the best move and play
        if (computerPlayer === board.getPlayer(1))
            elements[board.pickPlayPosition(computerPlayer)].play(computerPlayer);
            refresh();
//    } else if ($("playType").val() === "human") { 
//         // TODO implement human vs human
//     } else {
//       alert("You must select a play mode.");
//     }
        

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

    var player_two_boxes = 2;
    var player_one_boxes = 2;
    var boxes_remaining = 60;


    // The current player of the game.
    var currentPlayer = PLAYER_1;
    
    // Allow external access to currentPlayer
    this.getCurrentPlayer = function() {
        return currentPlayer;
    }

    this.getPlayerForBox = function (idx) {
      return board[idx];
    }
    // Initialize Board to othello starting positions. TODO(dbetser) Abstract
    // away hardcoded values.
    this.initBoard = function () {
        var idx;
        for (idx = 0; idx < boardSize; idx++) {
            if (idx === 27 || idx == 36)  
                board[idx] = PLAYER_1;
            else if (idx === 28 || idx === 35)  
                board[idx] = PLAYER_2;
            else
                board[idx] = NONE;
        }
    }
    // returns true if player has won, false otherwise
    var hasWon = function (board, player) {
        // check if won
        if (boxes_remaining == 0) {
            // Check who's won
            if (player_one_boxes > player_two_boxes) {
                alert("Player 1 has won!");
                if (PLAYER_1 === player)
                    return true
            } else if (player_two_boxes > player_one_boxes) {
                alert("Player 2 has won!");
                if (PLAYER_2 === player)
                    return true
            } else if (player_two_boxes == player_one_boxes) {
                alert("It's a draw!");
            }
        }
        return false;
    };      

    // speculative play; returns new board array
    // with the new move played
    var peek = function (board, player, position) {
        var new_board = board.copy();
        new_board[position] = player;       
        return new_board;
    };
        
    // return array of positions player can play on board
    var validPlays = function (board) {
        var plays = [];
        board.forEach(function (b, i) {
            if (numTurnedOver(i, false) > 0) plays.push(i);
        });
        return plays;
    };


    // Check the number of pieces to be turned over in this direction.
    var numTurnedOverDir = function (row, column, rowDir, columnDir, flipBoxes) {
        var numFlipped = 0;
        var curRow;
        var curColumn;
        var box_index;
        curRow = row + rowDir;
        curColumn = column + columnDir;
        while ((curRow > 0) && (curColumn > 0) && (curRow <= boardDim)
               && (curColumn <= boardDim)) {
            box_index = getPieceIndex(curRow, curColumn)
            if (board[box_index] === currentPlayer) {
                // We found another of the current color
                if (flipBoxes === true) {
                    // Do it all again
                    curRow = row + rowDir;
                    curColumn = column + columnDir;
                    while ((curRow > 0) && (curColumn > 0) && (curRow <= boardDim) 
                           && (curColumn <= boardDim)) {
                        box_index = getPieceIndex(curRow, curColumn)
                        if (board[box_index] === currentPlayer) {
                            return numFlipped;
                        }
    
                        board[box_index] = currentPlayer;
                        curRow += rowDir;
                        curColumn += columnDir;
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
            curColumn += columnDir;
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
        return numFlipped;
    }
    
    //
    // Checks if a move is available for the current color.
    // If not, play switches to the other player.
    //
    var isMoveAvailable = function (firstPass) {  
        var idx;
        var szMessage;
    
        // Keep going until there's a legal move
        for (idx = 1; idx <= boardSize; idx++) {
            if (numTurnedOver(idx, false) > 0)
                return true;
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
        alert(szMessage);
    
        if (firstPass === true) {
            isMoveAvailable(false);
        } else {
            numRemaining = 0;
        }   
        return false;
    }

    // Helper function to translate (X, Y) coordinates to index in arrray: [0, boardSize).
    var getPieceIndex = function (row, col) {
        return (row - 1) * 8 + col - 1;
    }

    // player can win in one play
    var canWin = function (board, player) {
        return validPlays(board).some(function (p) {
            return hasWon(peek(board, player, p), player);
        });
    };

    // score of board for this player, assuming just played
    // minimax not interesting for TTT, so add probabilistic element
    // assume that player selects best move with probability of PROB_GOOD

    // 1 if this player has won or can force a win from here
    // -1 if other player has won or can force a win
    // 0 if drawn (no move possible, and no wins)
    // else weighted min of the scores other player can achieve by playing
        
    // level is useful in debugging; not used otherwise
    
    var score = function (board, player, level) {
        
        // if player has already won, return 1
        if (hasWon(board, player)) return 1;
        // if other player can win in one step, return -1
        if (canWin(board, player.other)) return -1;
        
        var plays = validPlays(board);
        // if drawn, return 0
        if (plays.isEmpty()) return 0;
        
        var scores = plays.map(function (p) {
            return -1 * score(peek(board, player.other, p), player.other, level+1);
            });

        var PROB_GOOD = 0.9; // probability of making the right move
        var min_score = scores.reduce(function (a, e) {return (e < a) ? e : a}, 1);
        var non_mins = scores.filter(function (e) {return (e !== min_score);});
        var sum_non_mins = non_mins.reduce(function (a, e) {return a + e;}, 0);
        
        // so score is PROB_GOOD * min + (1 - PROB_GOOD)* average(non_min_scores)
        var count_non_mins = non_mins.length;
        if (count_non_mins === 0) return min_score;
        return (PROB_GOOD * min_score) + (1 - PROB_GOOD) * (sum_non_mins/count_non_mins);
    };
        
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
    this.play = function (player, position) {
        if ($.inArray(position, validPlays(board)) != -1) {
//        if (position] === NONE) {
			numTurnedOver(position, true);
            board[position] = player;
            
            return true;
        }
        return false;
    };
        
    // return best move for player
    this.pickPlayPosition = function (player) {
        var plays = validPlays(board);      
        return plays[
            plays.map(function (p) {
                return score(peek(board, player, p), player, 0);
            }).reduce(function(a, e, i, arr) {  // a = index of maxSoFar, e = element
                return (e > arr[a]) ? i : a}, 0)];                              
    };
}
