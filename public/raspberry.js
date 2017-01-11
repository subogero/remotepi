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
    window.scrollTo(0, y - 69); // consider tabbar and navbar above
}

rpi.ls2html = function(ls) {
    var html = rpi.navbar();
    html += '<div class="homels">';
    for (i = 0; i < ls.length; i++) {
        var c = i % 2 ? 'even' : 'odd';
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
        if (ls[i].ops.length <= 1) {
            continue;
        }
        html += '<p class="' + c + '"' + style + '>';
        html += util.ops_buttons('rpi.op', ls[i]);
        html += '</p>';
    }
    html += '</div>';
    document.getElementById("home").innerHTML = html;
    rpi.scroll_to('scrollhere');
}

rpi.navbar = function() {
    var html = '<div class="homenavbar">';

    var dirs = rpi.pwd.split('/');
    dirs.pop();

    var dir = '';
    for (i = 0; i < dirs.length; i++) {
        var label = dirs[i] + '/';
        dir += label;
        html += '<a href="javascript:void(0)" ' +
                'onclick="rpi.cd(&quot;' + dir + '&quot;);">' +
                label + '</a> ';
    }

    html += '</div>';
    return html;
}

rpi.cd = function(dir) {
    if (dir.substr(0, 1) === '/') {
        rpi.from = '';
        rpi.pwd = dir;
    } else if (dir === "..") {
        var regex = /([^\/]+)\/$/; // pwd shall always end in /
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
