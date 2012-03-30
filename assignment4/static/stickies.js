// Network Stickies
// Dina Betser, 6.170 Assignment 4.
//

if (!window.console) { console = {}; }

// Global debug variable to control severity of log messages printed to console.
var debug = 1;

// Initialization after the page is loaded.
$(document).ready(function () {

    // Add click handlers for add sticky button.
    $("#add").click(function() {
        if (debug > 0) {
            console.log("Handler for add.click() called.");
        }
        var data = {};
        $.post(
            '/add_sticky',
            data,
            function(response) {
                console.log(response);
            }
        );
    });

    $('#register').submit(function() {
        if (debug > 0) {
            console.log("Handler for add.click() called.");
        }
        var data = {};
        $.post(
            '/register',
            data,
            function(response) {
                console.log("registered");
                if (response === true) {
                    $.post(
                        '/login',
                        data,
                        function(login_resp) {
                            console.log("loggedin");
                        }
                    );
                }
            }
        );
    });
});

