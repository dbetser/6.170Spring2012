// Network Stickies
// Dina Betser, 6.170 Assignment 4.
//

if (!window.console) { console = {}; }

// Global debug variable to control severity of log messages printed to console.
var debug = 1;

// Initialization after the page is loaded.
$(document).ready(function () {


    // Utility function to separate the id from a string containing the id.
    var getStickyId = function(idStr) {
        return parseInt(idStr.split('_')[1]);
    }

    // Add click handlers for add sticky button.
    $('#addNote').click(function() {
        if (debug > 0) {
            console.log('Handler for add note called.');
        }
        $('#newNote').show();
    });

    // Save the new sticky content to the model and hide the textarea for
    // editing the text of the new sticky.
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
                $('#newNote').hide();
                window.location.replace($SCRIPT_ROOT);
            }
        );
    });

    // Save the sticky content to the model and hide the textarea for
    // updating the text of the sticky.
    $('#edit-note-form').submit(function(event) {
        if (debug > 0) {
            console.log('Handler for edit note submit called.');
        }
        event.preventDefault();
        var body = $('#edit-note-body').val();
        var id = $('#sticky-to-update').val();
        var data = {note_id: id, note_body: body};
        $.post(
            $SCRIPT_ROOT + '/edit_sticky',
            data,
            function(response) {
                $('#editNote').hide();
                window.location.replace($SCRIPT_ROOT);
            }
        );
    });

    // Remove the given sticky when delete button is clicked.
    $('.deleteButton').click(function() {
        var id = getStickyId($(this).attr('id'));
        if (debug > 0) {
            console.log('Handler for delete note called on id', id);
        }
        var data = {note_id: id};
        $.post(
            $SCRIPT_ROOT + '/delete_sticky',
            data,
            function(response) {
                window.location.replace($SCRIPT_ROOT);
            }
        );
    });

    // Add listener to all edit buttons that pop open a textarea for editing the
    // sticky's content.
    $('.editButton').click(function() {
        var id = getStickyId($(this).attr('id'));
        if (debug > 0) {
            console.log('Handler for edit note called on id', id);
        }
        var data = {note_id: id};
        $.post(
            $SCRIPT_ROOT + '/get_sticky_content',
            data,
            function(response) {
                $('#sticky-to-update').val(id);
                $('#edit-note-body').val(response);
                $('#editNote').show();
            }
        );
    });


    // Create a stack of draggable divs that alert the model when they are moved.
    $("#sticky_pane div").draggable({
        stack: "#sticky_pane div",
        stop: function(event, ui) {
            var stop_pos = $(this).position();
            var id = getStickyId($(this).attr('id'));
            if (debug > 0) {
                console.log('Handler for move note called on id', id);
            }
            var data = {note_id: id, x: stop_pos.left, y: stop_pos.top,
                        z: $(this).css("z-index")};
            $.post(
                $SCRIPT_ROOT + '/move_sticky',
                data,
                function(response) {
                    window.location.replace($SCRIPT_ROOT);
                }
            );
        }
    });

});

