u2b = {};

u2b.search = function(query) {
    document.getElementById("ythits").innerHTML = "Waiting for YouTube...";
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
    var html = '';
    for (i = 0; i < yt.length; i++) {
        var c = i % 2 ? 'even' : 'odd';
        var name = yt[i].label ? yt[i].label : yt[i].name;
        html += '<p class="' + c + '">' + name + '</p>';
        var ops = yt[i].ops;
        html += '<p class="' + c + '">';
        for (op = 0; op < ops.length; op++) {
            html += '<button onclick="u2b.op(' +
                    '&quot;' + ops[op] + '&quot;,' +
                    '&quot;' + yt[i].name + '&quot;)" ' +
                    'title="' + ops[op] + '">' + ops[op] + '</button> ';
        }
        html += '</p>';
        html += '<p class="' + c + '">';
        html += '<img src="' + yt[i].thumbnail + '">';
        html += '</p>';
    }
    document.getElementById("ythits").innerHTML = html;
}

u2b.op = function(cmd, file) {
    var req = new XMLHttpRequest();
    var uri = "yt/" + cmd + "/" + file;
    req.open("GET", uri, true);
    req.send();
}
