u2b = {};

u2b.search = function(query) {
    util.byId("statusbar").innerHTML = "Waiting for YouTube...";
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
    util.byId("statusbar").innerHTML = "";
    var ythits = util.byIdEmpty("ythits");
    for (i = 0; i < yt.length; i++) {
        var c = i % 2 ? 'even' : 'odd';
        var name = yt[i].label ? yt[i].label : yt[i].name;

        var p1 = util.newEl('p');
        p1.className = c;
        util.appendTxt(p1, name);
        ythits.appendChild(p1);

        var p2 = util.newEl('p');
        p2.className = c;
        util.appendOpsButtons(p2, u2b.op, yt[i]);
        ythits.appendChild(p2);

        var p3 = util.newEl('p');
        p3.className = c;
        var img = util.newEl('img');
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
            util.byId("statusbar").innerHTML = file + ' started';
        }
    }
    req.open("POST", 'yt', true);
    req.setRequestHeader("Content-type","application/json");
    req.send(JSON.stringify({ cmd: cmd, query: file }));
    util.byId("statusbar").innerHTML = 'Extracting stream...';
}
