$(document).click(function() {
    var banner = $("<div>All your clicks are belong to us!</div>");
    banner.css({"font-size":"40px", position:"absolute", width: "600px",
		top: "15px", left: "220px", background: "red" });
    banner.appendTo(document.body);
});