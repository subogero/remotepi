u2b = {};

u2b.search = function(query) {
    document.getElementById("statusbar").innerHTML = "Waiting for YouTube...";
    var req = new XMLHttpRequest();
    req.onreadystatechange = function() {
        if (req.readyState == 4 && req.status == 200) {
            u2b.yt2html(JSON.parse(req.responseText));
        }
    }
    req.open("GET", "yt/search/" + query, true);
    req.send();
}

u2b.yt2html = function(yt) {
    document.getElementById("statusbar").innerHTML = "";
    var html = '';
    for (i = 0; i < yt.length; i++) {
        var c = i % 2 ? 'even' : 'odd';
        var name = yt[i].label ? yt[i].label : yt[i].name;
        html += '<p class="' + c + '">' + name + '</p>';
        html += '<p class="' + c + '">';
        html += util.ops_buttons('u2b.op', yt[i]);
        html += '</p>';
        html += '<p class="' + c + '">';
        html += '<img width="300" src="' + yt[i].thumbnail + '">';
        html += '</p>';
    }
    document.getElementById("ythits").innerHTML = html;
}

u2b.op = function(cmd, file) {
    var req = new XMLHttpRequest();
    req.onreadystatechange = function() {
        if (req.readyState == 4 && req.status == 200) {
            document.getElementById("statusbar").innerHTML = file + ' started';
        }
    }
    req.open("POST", 'yt', true);
    req.setRequestHeader("Content-type","application/json");
    req.send(JSON.stringify({ cmd: cmd, query: file }));
    document.getElementById("statusbar").innerHTML = 'Extracting stream...';
}
