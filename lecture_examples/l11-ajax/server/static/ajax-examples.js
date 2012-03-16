// examples of use of JQuery AJAX API
var BASE_URL = '';

var busy = function () {
    var url = BASE_URL + '/status';
    $('#status').html('waiting').load(url);
    while ($('#status').text().length === 7) {
    }
}

// animated gif from http://www.ajaxload.info/
// note still responsive during animation
// note method chaining
// note that load is overloaded; $(window).load(handler) registers handler as listener for load event!
var loading = function () {
    var url = BASE_URL + '/status';
    $('#status').html('<img src="animated.gif"/>').load(url);
};

// examples of asynchronous events using to timers
var alert_timers = function () {    
    setTimeout(function () {alert("page about to expire!");}, 2000);
    setInterval(function () {alert("take a typing break!");}, 4000);
};

// using timers for continual refresh
var continual = function () {
    var url = BASE_URL + '/time';
    setInterval(
        function () {
            $('#status').html('<img src="animated.gif"/>').load(url);
        }, 1000);
};

// get data and pass to callback
var simple_get = function () {
    var url = BASE_URL + '/debug';
    $.get(url, function (response) {alert("Server says: " + response);});
};

// pass data to server as JS object
// can be used to persist state
// data is passed as key/val pairs in URL with GET
// if method were .post, passed as form data with POST
// examine in debugger network browser eg
var get_with_send = function () {
    var url = BASE_URL + '/welcome';
    var data = {user: "Daniel"};
    $.get(url, data, function (response) {alert(response);});
};

// get JSON object back and parse it
// .getJSON method parses result and passes to callback as object
var get_json_status = function () {
    var url = BASE_URL + '/json_status';
    $.getJSON(url, function (result) {
        $('#status').html('status: ' + result.status + " at: " + result.time);
    });
};

// with JQuery selector
// this won't work due to cross-site-scripting protection in the browser
// which prevent javascript loading from another site
var weather = function () {
    var url = "http://www.wunderground.com/US/MA/Newton_Center.html";
    var selector = " #tempActual";
    $('#status').html("Getting current temperature...").load(url + selector);
};

// if things like weather did work, it would permit attacks like this one
// (which works because it is attacking from the same site)
// XSS example
var attack = function () {
    var url = BASE_URL + '/attack';
    $('#status').html('<img src="animated.gif"/>').load(url);
};

// autocomplete: shows ajax wrapped in JQ plugin
var autocomplete_demo = function () {
    var url = BASE_URL + '/suggestions';
    $("#fruit").autocomplete(
    	{source: function(term, suggest) {
            //pass request to server
            $.getJSON(url, term=term, function(response) {
    	        suggest(response.suggestions);
    			});
    		}
		});
}

//continuation with closure
var checkLatency = function() {
    var start = (new Date).getTime();
    var report = function () {
	var finish = (new Date).getTime();
	$('#status').text("Server latency " 
			  + (finish-start)/1000 
			  + " seconds.");
    }
    $.get(BASE_URL + '/status', {}, report);
}

// continuation example
// convert dollars to Cuban pesos using 2 services
var conversion = function () {
    $('#dollars').change(
        function () {
            var dollars = $('#dollars').val();
            $.get(BASE_URL + '/dollars2euros', {dollars: dollars}, function (euros) {
                $.get(BASE_URL + '/euros2pesos', {euros: euros}, function (pesos) {
                    var rounded_pesos = parseFloat(pesos).toFixed(2);
                    $('#pesos').val(rounded_pesos);
                });
            });
        });
    }

// again with functions named
var conversion = function () {
    var display_pesos = function (pesos) {
        var rounded_pesos = parseFloat(pesos).toFixed(2);
        $('#pesos').val(rounded_pesos);
    };
    var euros2pesos = function (euros) {
        $.get(BASE_URL + '/euros2pesos', {euros: euros}, display_pesos);
    };
    var convert = function () {
        var dollars = $('#dollars').val();
        $.get(BASE_URL + '/dollars2euros', {dollars: dollars}, euros2pesos);
    };
    $('#dollars').change(convert);
    }

// again, in continuation passing style
var conversion = function () {
    var display_pesos = function (pesos, continuation) {
        var rounded_pesos = parseFloat(pesos).toFixed(2);
        $('#pesos').val(rounded_pesos);
        continuation();
    };
    var euros2pesos = function (euros, continuation) {
        $.get(BASE_URL + '/euros2pesos', {euros: euros}, continuation);
    };
    var dollars2euros = function (continuation) {
        var dollars = $('#dollars').val();
        $.get(BASE_URL + '/dollars2euros', {dollars: dollars}, continuation);
    };        
    $('#dollars').change(
        function () {
            dollars2euros(
                function (e) {euros2pesos(e,
                    function (p) {display_pesos(p,
                        function () {})
                            ;});});});
}