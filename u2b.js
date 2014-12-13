u2b = {};

u2b.search = function(query) {
    document.getElementById("ythits").innerHTML = "Waiting for YouTube...";
    var req = new XMLHttpRequest();
    req.onreadystatechange = function() {
        if (req.readyState == 4 && req.status == 200) {
            document.getElementById("ythits").innerHTML = req.responseText;
        }
    }
    req.open("GET", "api.pl?yt search " + query, true);
    req.send();
}

u2b.op = function(cmd, file) {
    var req = new XMLHttpRequest();
    var uri = "api.pl?yt " + cmd + " " + file;
    req.open("GET", uri, true);
    req.send();
}
