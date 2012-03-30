// Reversi
// Dina Betser, 6.170 Assignment 3.
//
// JavaScript file implementing the view and controller for the game
// Reversi/Othello.
// Credit to the 6.170 Tic Tac Toe example for code structuring ideas and some
// function reuse.

if (!window.console) { console = {}; }

// Global debug variable to control severity of log messages printed to console.
var debug = 0;

// Initialization after the page is loaded.
$(document).ready(function () {
    var boardDim = 8;
    var boardSize = boardDim * boardDim;
    var outcome = { "draw":"It's a draw!", "win":"Black wins!",
                    "lose":"White wins!"};
    // Create elements.
    var elements = Array.dim(boardSize).map(function () {
        // use jquery so that we have jq objects and not elements
        var box = $("<div>");
        box.addClass("box");
        $("#board").append(box);
        return box;
    });

    // Create a new board.
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

    // Initialize the variables dealing with board history for undo/redo
    // purposes.
    var maxHistorySize = 80;
    var boardStateHistory;
    var boardStateHistoryIdx;
    var initBoardStateHistory = function() {
        boardStateHistory = [];
        boardStateHistoryIdx = -1;
    };

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

    // Change handler for when the user selects a different mode (vs. human or
    // vs. computer).
    $('#playType').change(function() {
        onPlayTypeChanged();
        restart();
    });

    // Add keyboard handler for the enter key so that pressing enter has the
    // same result as clicking the "Submit" button.
    $(document).keypress(function(e){
        if (e.which === 13) {
            $("#done").click();
        }
    });

    // Prepare a new game.
    var restart = function () {
        $("#outcome").text("");
        game.initBoard();
        initBoardStateHistory();
        game.resetStats(refreshBoard);
        storeState(game.getCurrentBoardState(isVersusComp));
    };

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

    // Update the game stats.
    var updateViewStats = function(pOneBoxes, pTwoBoxes, boxesLeft) {
        $("#blackScore").text(pOneBoxes);
        $("#whiteScore").text(pTwoBoxes);
        $("#boxesRemaining").text(boxesLeft);
    };

    // Refresh the playing board's view.
    var refreshBoard = function () {
      if (debug > 0) {
          console.log("Refreshing view.");
      }
      for (var idx = 0; idx < boardSize; idx++) {
        elements[idx].render(game.getPlayerForBox(idx));
      }
    }

    // Refresh all aspects of the view, including the stats, player, and board.
    var refreshView = function (pOneBoxes, pTwoBoxes, boxesLeft, playerIdx) {
        updateViewStats(pOneBoxes, pTwoBoxes, boxesLeft);
        displayCurrentPlayer(playerIdx);
        refreshBoard()
    }

    // Store state for undo/redo purposes.
    var storeState = function(boardState) {
        if (debug > 0) {
            console.log("Storing state; Current index = ", boardStateHistoryIdx,
                            "; history contains: ");
            for (var i = 0; i < boardStateHistory.length; i++) {
                console.log(boardStateHistory[i].getBoard().toString());
            }
            console.log("Storestate storing",
                        boardState.getCurPlayer().toString());
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

