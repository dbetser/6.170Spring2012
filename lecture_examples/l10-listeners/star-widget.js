// Javascript star widget
// every element on the page with class "starwidget" has a star widget inserted just before it

// invoke f(i) with i ranging over from..to
var fromTo = function (from, to, f) {
    for (var i = from; i <= to; i = i+1) f(i);
};

// create star widget
// value is between 1 and 5; 0 means value is not set
// if initial_value is null, then acts as if no initial value set
// if editable is false, mouse clicks and hovers have no effect
// set_value is a function that is called whenever the value is changed
function makeStarWidget (initial_value, editable, set_value) {
    var star_holder = $('<div class="stars"></div>');
    var stars = [];
    var value = initial_value;
    fromTo(0, 4,
           // create ith star
           (function (i) {
               var star = $('<span class="star"></span>');
               star.addClass(i >= initial_value ? "star-basic" : "star-on");
               star_holder.append(star);
               stars[i] = star;
               // if star widget is just for display, don't add listeners
               if (!editable) return;

               var setPrefixClass = function (names) {
                   fromTo (0, i,
                           function (j) {stars[j].attr('class',names);}
                          );
               };
               star.on("mouseover", function () {
                   // only activate mouseover behavior when value is not set
                   if (0 == value)
                       setPrefixClass("star star-hover");
               });
               star.on("mouseout", function () {
                   if (0 == value)
                       setPrefixClass("star star-basic");
               });
               star.on("mousedown", function () {
                   if (i + 1 == value) {
                       value = 0;
                       set_value(0);
                       setPrefixClass("star star-basic");
                   } else if (0 == value) {
                       value = i + 1;
                       set_value(i + 1);
                       setPrefixClass("star star-on");
                   };
               });
           }));
    return star_holder;
}

if (!Object.create) {  
    Object.create = function (o) {  
        if (arguments.length > 1) {  
            throw new Error('Object.create implementation only accepts the first parameter.');  
        }  
        function F() {}  
        F.prototype = o;  
        return new F();  
    };  
}  

// Alternate version that allows you to add multiple change listeners
// Uses previous star widget functionality
// Tries to make star widget look like a (jquery wrapped) input field
// So you use the onChange() method to add a listener for changes
// And use the val() method to read the current value of the widget
// and otherwise use jq methods like before and append to manage the widget
// Implements this by generating the previous star-widget implementation
// which is a jquery object
// then generating an object that has the star widget as prototype
// so it also has all the jquery methods
// then shadows the onChange() and val() methods to talk to the star widget
// incomplete example; should also be able to set value of star widget
// and trigger change event on it
var makeObservableStarWidget = function(initial_value, editable) {
    var value = initial_value;
    var listeners = [];
    var notifyChange = function() {
        for (i=0; i< listeners.length; i++) {
            (listeners[i])();
        }
    }
    var change = function(listener) {
        listeners.push(listener);
    }
    var dom_element = makeStarWidget(initial_value, editable,
                                     function(v) {
                                         value = v;
                                         notifyChange();
                                     });
    var widget = Object.create(dom_element); //inherit DOM and jquery methods
    widget.change = change;
    widget.val = function() {return value;};
    return widget;
}


$(document).ready(function () {
    $('.starwidget').each(
        function (index,elt) {
            // if input element, then make editable and set value updater
            var editable = (elt.tagName === "INPUT");
            // get element value to initialize stars; set to zero if missing
            var initial_value = elt.getAttribute('value') || 0;
            // create star widget
            // comment 2 lines & uncomment next 3 lines to use observable widget
            var set_value = function (v) {elt.value = v;};
            var star_widget = makeStarWidget(initial_value, editable, set_value);
            //var star_widget = makeObservableStarWidget(initial_value, editable);
            //var set_value = function (v) {elt.value = star_widget.val();};
            //star_widget.onChange(set_value);
            // insert just before the element
            $(elt).before(star_widget);
        });
})