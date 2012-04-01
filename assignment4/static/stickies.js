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
            $SCRIPT_ROOT + '/add_sticky',
            data,
            function(response) {
                console.log(response);
                $('#newNote').hide();
            }
        );

    });

    $('.deleteButton').click(function() {
        var idStr = $(this).attr('id');
        if (debug > 0) {
            console.log('Handler for delete note called on id ', idStr);
        }
        var id = parseInt(idStr.split('_')[1]);
        var data = {note_id: id};
        $.post(
            $SCRIPT_ROOT + '/delete_sticky',
            data,
            function(response) {
                console.log(response);
            }
        );
    });

    $('.editButton').click(function() {
        var idStr = $(this).attr('id');
        if (debug > 0) {
            console.log('Handler for edit note called on id ', idStr);
        }
        var id = parseInt(idStr.split('_')[1]);
        var data = {note_id: id, };
        $.post(
            $SCRIPT_ROOT + '/edit_sticky',
            data,
            function(response) {
                console.log(response);
            }
        );
    });

    $("#sticky_pane div").draggable({
        stack: "#sticky_pane div",
        stop: function(event, ui) {
            var stop_pos = $(this).position();
            var idStr = $(this).attr('id');
            var id = parseInt(idStr.split('_')[1]);
            var data = {note_id: id, x: stop_pos.left, y: stop_pos.top,
                        z: $(this).css("z-index")};
            $.post(
                $SCRIPT_ROOT + '/move_sticky',
                data,
                function(response) {
                    console.log(response);
                }
            );
        }
    });

});

