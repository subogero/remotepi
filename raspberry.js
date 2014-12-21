rpi = {};
rpi.pwd = "/";
rpi.from = '';

rpi.ls = function() {
    var req = new XMLHttpRequest();
    req.onreadystatechange = function() {
        if (req.readyState == 4 && req.status == 200) {
            rpi.ls2html(JSON.parse(req.responseText));
        }
    }
    req.open("GET", "home" + rpi.pwd, true);
    req.send();
}

rpi.scroll_to = function(id) {
    var elem = document.getElementById(id);
    if (elem == null) {
        window.scrollTo(0, 0);
        return;
    }
    var y = 0;
    do {
        y += elem.offsetTop;
    } while (elem = elem.offsetParent);
    window.scrollTo(0, y - 39);
}

rpi.ls2html = function(ls) {
    var html = '';
    for (i = 0; i < ls.length; i++) {
        var c = i % 2 ? 'odd' : 'even';
        var id = ls[i].name == rpi.from ? ' id="scrollhere"' : '';
        html += '<p class="' + c + '"' + id + '>';
        var style = '';
        if (ls[i].ops.indexOf('cd') != -1) {
            html += '<a href="javascript:void(0)" ' +
                    'onclick="rpi.cd(&quot;' + ls[i].name + '&quot;);">' +
                    ls[i].name + '/</a></p>';
            style = ' style="text-align:right"';
        } else {
            html += ls[i].name + '</p>';
        }
        var ops = ls[i].ops;
        if (ops.length <= 1) {
            continue;
        }
        html += '<p class="' + c + '"' + style + '>';
        for (op = 0; op < ops.length; op++) {
            if (ops[op] == 'cd') {
                continue;
            }
            html += '<button onclick="rpi.op(&quot;' + ops[op] + '&quot;,' +
                    '&quot;' + ls[i].name + '&quot;)" ' +
                    'title="' + ops[op] + '">' + ops[op] + '</button> ';
        }
        html += '</p>';
    }
    document.getElementById("home").innerHTML = html;
    rpi.scroll_to('scrollhere');
}

rpi.cd = function(dir) {
    if (dir === "..") {
        var regex = /([^\/]+)\/$/;
        rpi.from = regex.exec(rpi.pwd)[1]; // [1] for 1st capture group
        rpi.pwd = rpi.pwd.replace(regex, "");
    } else {
        rpi.from = '';
        rpi.pwd += dir + "/";
    }
    rpi.ls();
}

rpi.op = function(cmd, file) {
    var req = new XMLHttpRequest();
    var uri = "home";
    req.open("POST", uri, true);
    req.setRequestHeader("Content-type","application/json");
    req.send(JSON.stringify({ cmd: cmd, file: rpi.pwd + file }));
}
