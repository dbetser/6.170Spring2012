// Network Stickies
// Dina Betser, 6.170 Assignment 4.
//

if (!window.console) { console = {}; }

// Global debug variable to control severity of log messages printed to console.
var debug = 1;

// Initialization after the page is loaded.
$(document).ready(function () {

    // Add click handlers for add sticky button.
    $('#addNote').click(function() {
        if (debug > 0) {
            console.log('Handler for add note called.');
        }

        $('#newNote').show();
    });

    $('#note-form').submit(function(event) {
        if (debug > 0) {
            console.log('Handler for note submit called.');
        }
        event.preventDefault();
        console.log($('#note-body').val());
        var data = {note_body: $('#note-body').val()};
        $.post(
            '/add_sticky',
            data,
            function(response) {
                console.log(response);
                $('#newNote').hide();
            }
        );

    });

    $( "#sticky_pane div" ).draggable({ stack: "#sticky_pane div" });

});

