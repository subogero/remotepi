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
    var ythits = document.getElementById("ythits");
    while (ythits.firstChild) { ythits.removeChild(ythits.firstChild) }
    for (i = 0; i < yt.length; i++) {
        var c = i % 2 ? 'even' : 'odd';
        var name = yt[i].label ? yt[i].label : yt[i].name;

        var p1 = document.createElement('p');
        p1.className = c;
        p1.appendChild(document.createTextNode(name));
        ythits.appendChild(p1);

        var p2 = document.createElement('p');
        p2.className = c;
        util.ops_buttons_dom(u2b.op, yt[i]).forEach(function(i) {
            p2.appendChild(i)
        });
        ythits.appendChild(p2);

        var p3 = document.createElement('p');
        p3.className = c;
        var img = document.createElement('img');
        img.width = 300;
        img.src = yt[i].thumbnail;
        p3.appendChild(img);
        ythits.appendChild(p3);
    }
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
